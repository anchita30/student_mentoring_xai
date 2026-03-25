from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Student, AcademicRecord, Course, Project, Skill, DomainScore
from datetime import datetime

router = APIRouter(prefix="/seed", tags=["Database Seeding"])


@router.post("/test-students")
def seed_test_students(db: Session = Depends(get_db)):
    """
    Populate database with test students for demo purposes.
    This creates 4 students with realistic data.
    """

    # Clear existing data (optional - comment out if you want to keep existing data)
    db.query(DomainScore).delete()
    db.query(Skill).delete()
    db.query(Project).delete()
    db.query(Course).delete()
    db.query(AcademicRecord).delete()
    db.query(Student).delete()
    db.commit()

    # Student 1: Rohit Sharma
    student1 = Student(
        full_name="Rohit Sharma",
        email="rohit@example.com",
        enrollment_number="EN2024001",
        semester=5,
        branch="CS"
    )
    db.add(student1)
    db.flush()

    # Academic records for Student 1
    db.add(AcademicRecord(
        student_id=student1.id,
        semester=5,
        subject_name="Internet Programming",
        marks_obtained=88,
        total_marks=100,
        attendance_percentage=85,
        gpa=8.5
    ))
    db.add(AcademicRecord(
        student_id=student1.id,
        semester=5,
        subject_name="Computer Network Security",
        marks_obtained=72,
        total_marks=100,
        attendance_percentage=80,
        gpa=8.5
    ))

    # Projects for Student 1
    db.add(Project(
        student_id=student1.id,
        title="Image Classifier",
        domain="Machine Learning",
        difficulty_level=4,
        technologies_used="Python, TensorFlow",
        github_link="https://github.com/example/classifier"
    ))
    db.add(Project(
        student_id=student1.id,
        title="E-commerce Website",
        domain="Web Development",
        difficulty_level=3,
        technologies_used="React, Node.js"
    ))

    # Courses for Student 1
    db.add(Course(
        student_id=student1.id,
        course_name="Machine Learning by Andrew Ng",
        platform="Coursera",
        domain="Machine Learning",
        completion_percentage=85,
        weekly_study_hours=10
    ))

    # Skills for Student 1
    db.add(Skill(
        student_id=student1.id,
        math_comfort=8.0,
        programming_comfort=7.0,
        problem_solving_rating=8.0,
        communication_rating=6.0,
        hackathons_participated=2,
        clubs_joined=1,
        competitions_participated=3
    ))

    # Student 2: Priya Patel
    student2 = Student(
        full_name="Priya Patel",
        email="priya@example.com",
        enrollment_number="EN2024002",
        semester=5,
        branch="CS"
    )
    db.add(student2)
    db.flush()

    db.add(AcademicRecord(
        student_id=student2.id,
        semester=5,
        subject_name="Internet Programming",
        marks_obtained=92,
        total_marks=100,
        attendance_percentage=90,
        gpa=8.9
    ))

    db.add(Project(
        student_id=student2.id,
        title="Portfolio Website",
        domain="Web Development",
        difficulty_level=4,
        technologies_used="Next.js, Tailwind CSS"
    ))

    db.add(Course(
        student_id=student2.id,
        course_name="Full Stack Web Development",
        platform="Udemy",
        domain="Web Development",
        completion_percentage=95
    ))

    db.add(Skill(
        student_id=student2.id,
        math_comfort=6.0,
        programming_comfort=9.0,
        problem_solving_rating=8.0,
        communication_rating=7.0,
        hackathons_participated=4,
        clubs_joined=2,
        competitions_participated=5
    ))

    # Student 3: Arjun Singh
    student3 = Student(
        full_name="Arjun Singh",
        email="arjun@example.com",
        enrollment_number="EN2024003",
        semester=5,
        branch="CS"
    )
    db.add(student3)
    db.flush()

    db.add(AcademicRecord(
        student_id=student3.id,
        semester=5,
        subject_name="Computer Network Security",
        marks_obtained=90,
        total_marks=100,
        attendance_percentage=75,
        gpa=8.2
    ))

    db.add(Project(
        student_id=student3.id,
        title="Network Security Scanner",
        domain="Cybersecurity",
        difficulty_level=5,
        technologies_used="Python, Nmap"
    ))

    db.add(Skill(
        student_id=student3.id,
        math_comfort=7.0,
        programming_comfort=8.0,
        problem_solving_rating=9.0,
        communication_rating=5.0,
        hackathons_participated=1,
        clubs_joined=0,
        competitions_participated=2
    ))

    # Student 4: Sneha Kulkarni
    student4 = Student(
        full_name="Sneha Kulkarni",
        email="sneha@example.com",
        enrollment_number="EN2024004",
        semester=5,
        branch="CS"
    )
    db.add(student4)
    db.flush()

    db.add(AcademicRecord(
        student_id=student4.id,
        semester=5,
        subject_name="Internet Programming",
        marks_obtained=82,
        total_marks=100,
        attendance_percentage=88,
        gpa=9.1
    ))

    db.add(Project(
        student_id=student4.id,
        title="Data Pipeline",
        domain="Data Engineering",
        difficulty_level=4,
        technologies_used="Python, Pandas, SQL"
    ))

    db.add(Course(
        student_id=student4.id,
        course_name="Data Engineering with Python",
        platform="DataCamp",
        domain="Data Engineering",
        completion_percentage=100
    ))

    db.add(Skill(
        student_id=student4.id,
        math_comfort=9.0,
        programming_comfort=8.0,
        problem_solving_rating=8.0,
        communication_rating=6.0,
        hackathons_participated=3,
        clubs_joined=1,
        competitions_participated=4
    ))

    db.commit()

    return {
        "message": "✅ Test students seeded successfully!",
        "students_created": 4,
        "students": [
            {"id": student1.id, "name": student1.full_name},
            {"id": student2.id, "name": student2.full_name},
            {"id": student3.id, "name": student3.full_name},
            {"id": student4.id, "name": student4.full_name},
        ]
    }


@router.delete("/clear-all")
def clear_all_data(db: Session = Depends(get_db)):
    """
    Clear all data from database (use with caution!)
    """
    db.query(DomainScore).delete()
    db.query(Skill).delete()
    db.query(Project).delete()
    db.query(Course).delete()
    db.query(AcademicRecord).delete()
    db.query(Student).delete()
    db.commit()

    return {"message": "✅ All data cleared!"}
