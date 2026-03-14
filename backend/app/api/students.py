from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Student, AcademicRecord, Course, Project, Skill, MentorFeedback
from app.schemas import (
    StudentCreate, StudentResponse,
    AcademicRecordCreate, AcademicRecordResponse,
    CourseCreate, CourseResponse,
    ProjectCreate, ProjectResponse,
    SkillCreate, SkillResponse,
    MentorFeedbackCreate, MentorFeedbackResponse
)
from typing import List

router = APIRouter(prefix="/students", tags=["Students"])

# ─── Create Student ───────────────────────────────────────

@router.post("/", response_model=StudentResponse)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.email == student.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_student = Student(**student.model_dump())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

# ─── Get All Students ─────────────────────────────────────

@router.get("/", response_model=List[StudentResponse])
def get_all_students(db: Session = Depends(get_db)):
    return db.query(Student).all()

# ─── Get Single Student ───────────────────────────────────

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

# ─── Add Academic Record ──────────────────────────────────

@router.post("/{student_id}/academic", response_model=AcademicRecordResponse)
def add_academic_record(student_id: int, record: AcademicRecordCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db_record = AcademicRecord(student_id=student_id, **record.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

# ─── Get Academic Records ─────────────────────────────────

@router.get("/{student_id}/academic", response_model=List[AcademicRecordResponse])
def get_academic_records(student_id: int, db: Session = Depends(get_db)):
    return db.query(AcademicRecord).filter(AcademicRecord.student_id == student_id).all()

# ─── Add Course ───────────────────────────────────────────

@router.post("/{student_id}/courses", response_model=CourseResponse)
def add_course(student_id: int, course: CourseCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db_course = Course(student_id=student_id, **course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

# ─── Get Courses ──────────────────────────────────────────

@router.get("/{student_id}/courses", response_model=List[CourseResponse])
def get_courses(student_id: int, db: Session = Depends(get_db)):
    return db.query(Course).filter(Course.student_id == student_id).all()

# ─── Add Project ──────────────────────────────────────────

@router.post("/{student_id}/projects", response_model=ProjectResponse)
def add_project(student_id: int, project: ProjectCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db_project = Project(student_id=student_id, **project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

# ─── Get Projects ─────────────────────────────────────────

@router.get("/{student_id}/projects", response_model=List[ProjectResponse])
def get_projects(student_id: int, db: Session = Depends(get_db)):
    return db.query(Project).filter(Project.student_id == student_id).all()

# ─── Add Skill ────────────────────────────────────────────

@router.post("/{student_id}/skills", response_model=SkillResponse)
def add_skill(student_id: int, skill: SkillCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db_skill = Skill(student_id=student_id, **skill.model_dump())
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

# ─── Get Skills ───────────────────────────────────────────

@router.get("/{student_id}/skills", response_model=List[SkillResponse])
def get_skills(student_id: int, db: Session = Depends(get_db)):
    return db.query(Skill).filter(Skill.student_id == student_id).all()

# ─── Add Mentor Feedback ──────────────────────────────────

@router.post("/{student_id}/feedback", response_model=MentorFeedbackResponse)
def add_feedback(student_id: int, feedback: MentorFeedbackCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db_feedback = MentorFeedback(student_id=student_id, **feedback.model_dump())
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

# ─── Get Mentor Feedback ──────────────────────────────────

@router.get("/{student_id}/feedback", response_model=List[MentorFeedbackResponse])
def get_feedback(student_id: int, db: Session = Depends(get_db)):
    return db.query(MentorFeedback).filter(MentorFeedback.student_id == student_id).all()