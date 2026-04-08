"""
Migration script to add department column to users table for mentors.
Run this once to update the database schema.
"""
from sqlalchemy import create_engine, text
from app.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='department'
        """))
        
        if result.fetchone() is None:
            # Add the department column
            conn.execute(text("""
                ALTER TABLE users ADD COLUMN department VARCHAR(100)
            """))
            conn.commit()
            print("✅ Successfully added 'department' column to users table")
        else:
            print("ℹ️ Column 'department' already exists in users table")

if __name__ == "__main__":
    migrate()
