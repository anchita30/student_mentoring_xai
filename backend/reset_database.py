#!/usr/bin/env python3
"""
COMPLETE DATABASE RESET - Wipe ALL data for fresh start
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.models import Student, AcademicRecord, Course, Project, Skill, MentorFeedback, User, DomainScore
from app.database import get_db

# Database connection
DATABASE_URL = "postgresql://admin:password123@localhost:5433/student_analytics"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def reset_database():
    """Completely wipe ALL data from database"""
    db = SessionLocal()
    try:
        print("COMPLETE DATABASE RESET - Starting...")
        print("This will delete ALL data: students, mentors, projects, certificates, everything!")

        # Delete all data in correct dependency order (reverse of creation)
        print("\nDeleting all mentor feedback...")
        db.execute(text("DELETE FROM mentor_feedback"))

        print("Deleting all domain scores...")
        db.execute(text("DELETE FROM domain_scores"))

        print("Deleting all academic records...")
        db.execute(text("DELETE FROM academic_records"))

        print("Deleting all courses/certificates...")
        db.execute(text("DELETE FROM courses"))

        print("Deleting all projects...")
        db.execute(text("DELETE FROM projects"))

        print("Deleting all skills...")
        db.execute(text("DELETE FROM skills"))

        print("Deleting all users (mentors & students)...")
        db.execute(text("DELETE FROM users"))

        print("Deleting all students...")
        db.execute(text("DELETE FROM students"))

        # Reset auto-increment sequences
        print("\nResetting ID sequences...")
        try:
            db.execute(text("ALTER SEQUENCE users_id_seq RESTART WITH 1"))
            db.execute(text("ALTER SEQUENCE students_id_seq RESTART WITH 1"))
            db.execute(text("ALTER SEQUENCE projects_id_seq RESTART WITH 1"))
            db.execute(text("ALTER SEQUENCE courses_id_seq RESTART WITH 1"))
            db.execute(text("ALTER SEQUENCE skills_id_seq RESTART WITH 1"))
            db.execute(text("ALTER SEQUENCE academic_records_id_seq RESTART WITH 1"))
            db.execute(text("ALTER SEQUENCE mentor_feedback_id_seq RESTART WITH 1"))
            db.execute(text("ALTER SEQUENCE domain_scores_id_seq RESTART WITH 1"))
        except Exception as seq_error:
            print(f"Warning: Could not reset sequences: {seq_error}")

        # Commit all changes
        db.commit()
        print("\nDATABASE COMPLETELY WIPED!")
        print("Ready for fresh start with:")
        print("- 0 students")
        print("- 0 mentors")
        print("- 0 projects")
        print("- 0 certificates")
        print("- 0 feedback")
        print("- Reset ID counters")
        print("\nDatabase is now pristine and ready!")

    except Exception as e:
        print(f"Error during reset: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Safety confirmation
    confirm = input("Type 'RESET' to confirm complete database wipe: ")
    if confirm == "RESET":
        reset_database()
    else:
        print("Database reset cancelled.")