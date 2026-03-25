#!/usr/bin/env python3
"""
Quick test to verify backend API is working
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

def test_database():
    """Test database connection and check tables"""
    try:
        with engine.connect() as conn:
            # Check if students table exists
            result = conn.execute(text("SELECT COUNT(*) FROM students"))
            student_count = result.scalar()
            print(f"Database connected!")
            print(f"   Students in database: {student_count}")

            # Check mentor_feedback columns
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'mentor_feedback'
                ORDER BY ordinal_position
            """))
            columns = [row[0] for row in result]
            print(f"\nMentor Feedback columns:")
            for col in columns:
                print(f"   - {col}")

            # Check if new columns exist
            required_cols = ['attendance_percentage', 'participation_rating',
                           'lab_performance_rating', 'assignment_consistency']
            missing = [col for col in required_cols if col not in columns]

            if missing:
                print(f"\nMissing columns: {missing}")
                print("   Run: python fix_database.py")
            else:
                print(f"\nAll required columns present!")

    except Exception as e:
        print(f"Database error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_database()
