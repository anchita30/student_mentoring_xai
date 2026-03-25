#!/usr/bin/env python3
"""
Clean duplicate entries from database
Run this once to fix existing duplicates
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from sqlalchemy import text, func
    from app.database import engine
    from app.models.models import Student, Project, Course, AcademicRecord, Skill, MentorFeedback

    print("Cleaning duplicate entries from database...")

    with engine.connect() as conn:
        # Clean duplicate projects (keep only latest)
        result = conn.execute(text("""
            DELETE FROM projects
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (PARTITION BY student_id, title ORDER BY id DESC) as rn
                    FROM projects
                ) t WHERE t.rn = 1
            )
        """))
        print(f"Removed {result.rowcount} duplicate projects")

        # Clean duplicate courses (keep only latest)
        result = conn.execute(text("""
            DELETE FROM courses
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (PARTITION BY student_id, course_name ORDER BY id DESC) as rn
                    FROM courses
                ) t WHERE t.rn = 1
            )
        """))
        print(f"Removed {result.rowcount} duplicate courses")

        # Clean duplicate academic records (keep only latest)
        result = conn.execute(text("""
            DELETE FROM academic_records
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (PARTITION BY student_id, subject_name ORDER BY id DESC) as rn
                    FROM academic_records
                ) t WHERE t.rn = 1
            )
        """))
        print(f"Removed {result.rowcount} duplicate academic records")

        # Clean duplicate skills (keep only latest)
        result = conn.execute(text("""
            DELETE FROM skills
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY id DESC) as rn
                    FROM skills
                ) t WHERE t.rn = 1
            )
        """))
        print(f"Removed {result.rowcount} duplicate skills")

        conn.commit()
        print("\nDatabase cleaned! Duplicates removed.")

        # Show current counts
        result = conn.execute(text("SELECT COUNT(*) FROM projects"))
        print(f"Projects remaining: {result.scalar()}")

        result = conn.execute(text("SELECT COUNT(*) FROM courses"))
        print(f"Courses remaining: {result.scalar()}")

        result = conn.execute(text("SELECT COUNT(*) FROM academic_records"))
        print(f"Academic records remaining: {result.scalar()}")

        result = conn.execute(text("SELECT COUNT(*) FROM mentor_feedback"))
        print(f"Mentor feedback remaining: {result.scalar()}")

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)