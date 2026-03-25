#!/usr/bin/env python3
"""
Quick script to add mentor feedback rating columns to existing database.
Run this once to update the mentor_feedback table schema.
"""

import sys
import os

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from sqlalchemy import text
from app.database import engine

def update_mentor_feedback_table():
    """Add new columns to mentor_feedback table"""

    # SQL to add new columns
    sql_commands = [
        "ALTER TABLE mentor_feedback ADD COLUMN IF NOT EXISTS attendance_percentage FLOAT NULL;",
        "ALTER TABLE mentor_feedback ADD COLUMN IF NOT EXISTS participation_rating FLOAT NULL;",
        "ALTER TABLE mentor_feedback ADD COLUMN IF NOT EXISTS lab_performance_rating FLOAT NULL;",
        "ALTER TABLE mentor_feedback ADD COLUMN IF NOT EXISTS assignment_consistency FLOAT NULL;",
    ]

    try:
        with engine.connect() as conn:
            print("🔧 Updating mentor_feedback table schema...")

            for sql in sql_commands:
                print(f"   Executing: {sql}")
                conn.execute(text(sql))

            conn.commit()
            print("✅ Successfully updated mentor_feedback table!")
            print("   New columns added:")
            print("   - attendance_percentage (FLOAT)")
            print("   - participation_rating (FLOAT)")
            print("   - lab_performance_rating (FLOAT)")
            print("   - assignment_consistency (FLOAT)")

    except Exception as e:
        print(f"❌ Error updating table: {e}")
        sys.exit(1)

if __name__ == "__main__":
    update_mentor_feedback_table()