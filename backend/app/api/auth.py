from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.database import get_db
from app.models.models import Student, User
from pydantic import BaseModel
from typing import Optional

# Auth configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Schemas ──────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    user_type: str  # "student" or "mentor"
    # Student-specific fields
    enrollment_number: Optional[str] = None
    semester: Optional[int] = None
    branch: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    user_type: str
    is_active: bool
    student_id: Optional[int] = None
    branch: Optional[str] = None  # Add branch field

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ── Helper Functions ─────────────────────────────────────────
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(db, email)
    if user is None:
        raise credentials_exception
    return user


# ── Endpoints ────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (student or mentor)
    """
    # Check if user already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create user account
    hashed_password = get_password_hash(user_data.password)

    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        user_type=user_data.user_type,
        is_active=True
    )

    db.add(db_user)
    db.flush()

    # If student, also create student profile
    student_id = None
    if user_data.user_type == "student":
        if not user_data.enrollment_number or not user_data.semester or not user_data.branch:
            raise HTTPException(
                status_code=400,
                detail="Enrollment number, semester, and branch are required for students"
            )

        student = Student(
            full_name=user_data.full_name,
            email=user_data.email,
            enrollment_number=user_data.enrollment_number,
            semester=user_data.semester,
            branch=user_data.branch
        )
        db.add(student)
        db.flush()
        student_id = student.id

        # Link user to student
        db_user.student_id = student_id

    db.commit()
    db.refresh(db_user)

    return UserResponse(
        id=db_user.id,
        email=db_user.email,
        full_name=db_user.full_name,
        user_type=db_user.user_type,
        is_active=db_user.is_active,
        student_id=student_id,
        branch=user_data.branch if user_data.user_type == "student" else None
    )


@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login endpoint - returns JWT token
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    # Get branch information if user is a student
    branch = None
    if user.user_type == "student" and user.student_id:
        student = db.query(Student).filter(Student.id == user.student_id).first()
        if student:
            branch = student.branch

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            user_type=user.user_type,
            is_active=user.is_active,
            student_id=user.student_id,
            branch=branch
        )
    )


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get current logged-in user info
    """
    # Get branch information if user is a student
    branch = None
    if current_user.user_type == "student" and current_user.student_id:
        student = db.query(Student).filter(Student.id == current_user.student_id).first()
        if student:
            branch = student.branch

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        user_type=current_user.user_type,
        is_active=current_user.is_active,
        student_id=current_user.student_id,
        branch=branch
    )