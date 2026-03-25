from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Student, AcademicRecord, Project, Skill, Course
from app.schemas import StudentResponse

router = APIRouter(prefix="/testing", tags=["Testing"])


@router.post("/create-test-student", response_model=StudentResponse)
def create_test_student(db: Session = Depends(get_db)):
    """
    Create a test student with sample data for demo purposes.
    """
    # Check if student already exists
    existing = db.query(Student).filter(Student.enrollment_number == "EN2024001").first()
    if existing:
        return existing

    # Create student
    student = Student(
        full_name="Rohit Sharma",
        email="rohit@example.com",
        enrollment_number="EN2024001",
        semester=5,
        branch="Computer Science"
    )
    db.add(student)
    db.flush()  # Get the ID

    # Add academic records
    subjects = [
        {"name": "Internet Programming", "marks": 88},
        {"name": "Computer Network Security", "marks": 72},
        {"name": "Entrepreneurship & E-Business", "marks": 65},
        {"name": "Software Engineering", "marks": 80},
    ]

    for subj in subjects:
        record = AcademicRecord(
            student_id=student.id,
            semester=5,
            subject_name=subj["name"],
            marks_obtained=subj["marks"],
            total_marks=100,
            attendance_percentage=75,
            gpa=8.5
        )
        db.add(record)

    # Add project
    project = Project(
        student_id=student.id,
        title="Image Classifier",
        domain="Machine Learning",
        difficulty_level=4,
        technologies_used="Python, TensorFlow",
        github_link="https://github.com/example/classifier",
        is_team_project=False
    )
    db.add(project)

    # Add skills
    skill = Skill(
        student_id=student.id,
        math_comfort=8.0,
        programming_comfort=7.0,
        problem_solving_rating=8.0,
        communication_rating=6.0,
        hackathons_participated=2,
        clubs_joined=1,
        competitions_participated=3
    )
    db.add(skill)

    # Add course
    course = Course(
        student_id=student.id,
        course_name="Machine Learning by Andrew Ng",
        platform="Coursera",
        domain="Machine Learning",
        completion_percentage=100,
        weekly_study_hours=10
    )
    db.add(course)

    db.commit()
    db.refresh(student)

    return student
