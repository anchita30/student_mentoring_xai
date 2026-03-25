#!/usr/bin/env python3
"""
Clean ALL duplicate entries from the database
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.models import Student, AcademicRecord, Course, Project, Skill, MentorFeedback
from app.database import get_db

# Database connection
DATABASE_URL = "postgresql://admin:password123@localhost:5433/student_analytics"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def clean_duplicates():
    """Remove duplicate entries across all tables"""
    db = SessionLocal()
    try:
        print("Starting duplicate cleanup...")

        # 1. Clean duplicate projects (keep oldest)
        print("\nCleaning duplicate projects...")
        project_duplicates = db.execute(text("""
            DELETE FROM projects
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM projects
                GROUP BY student_id, title, domain
            )
        """))
        print(f"   Removed {project_duplicates.rowcount} duplicate projects")

        # 2. Clean duplicate courses/certificates (keep oldest)
        print("\nCleaning duplicate courses/certificates...")
        course_duplicates = db.execute(text("""
            DELETE FROM courses
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM courses
                GROUP BY student_id, course_name, domain
            )
        """))
        print(f"   Removed {course_duplicates.rowcount} duplicate courses")

        # 3. Clean duplicate skills (keep newest)
        print("\nCleaning duplicate skills...")
        skill_duplicates = db.execute(text("""
            DELETE FROM skills
            WHERE id NOT IN (
                SELECT MAX(id)
                FROM skills
                GROUP BY student_id
            )
        """))
        print(f"   Removed {skill_duplicates.rowcount} duplicate skills")

        # 4. Clean duplicate academic records (keep newest)
        print("\nCleaning duplicate academic records...")
        academic_duplicates = db.execute(text("""
            DELETE FROM academic_records
            WHERE id NOT IN (
                SELECT MAX(id)
                FROM academic_records
                GROUP BY student_id, subject_name, semester
            )
        """))
        print(f"   Removed {academic_duplicates.rowcount} duplicate academic records")

        # 5. Clean duplicate mentor feedback (keep newest)
        print("\nCleaning duplicate mentor feedback...")
        feedback_duplicates = db.execute(text("""
            DELETE FROM mentor_feedback
            WHERE id NOT IN (
                SELECT MAX(id)
                FROM mentor_feedback
                GROUP BY student_id, mentor_name, general_notes
            )
        """))
        print(f"   Removed {feedback_duplicates.rowcount} duplicate feedback entries")

        # Commit all changes
        db.commit()
        print("\nDatabase cleanup completed successfully!")

        # Show final counts
        print("\nFinal database counts:")
        students = db.query(Student).count()
        projects = db.query(Project).count()
        courses = db.query(Course).count()
        skills = db.query(Skill).count()
        records = db.query(AcademicRecord).count()
        feedback = db.query(MentorFeedback).count()

        print(f"   Students: {students}")
        print(f"   Projects: {projects}")
        print(f"   Courses: {courses}")
        print(f"   Skills: {skills}")
        print(f"   Academic Records: {records}")
        print(f"   Mentor Feedback: {feedback}")

    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_duplicates()