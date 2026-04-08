"""
Script to update mentor's department in the database.
Run this after running add_department_column.py
"""
from sqlalchemy import create_engine, text
from app.config import settings

def update_mentor_department():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # First, let's see all mentors
        result = conn.execute(text("""
            SELECT id, email, full_name, department FROM users WHERE user_type = 'mentor'
        """))
        
        mentors = result.fetchall()
        
        if not mentors:
            print("No mentors found in database.")
            return
        
        print("\n📋 Current mentors in database:")
        print("-" * 60)
        for m in mentors:
            print(f"ID: {m[0]} | Email: {m[1]} | Name: {m[2]} | Dept: {m[3] or 'Not set'}")
        print("-" * 60)
        
        # Ask which mentor to update
        mentor_email = input("\nEnter the email of the mentor to update: ").strip()
        new_department = input("Enter the department (e.g., IT, CS, ECE): ").strip()
        
        if not mentor_email or not new_department:
            print("❌ Email and department are required.")
            return
        
        # Update the mentor
        result = conn.execute(
            text("UPDATE users SET department = :dept WHERE email = :email AND user_type = 'mentor'"),
            {"dept": new_department, "email": mentor_email}
        )
        conn.commit()
        
        if result.rowcount > 0:
            print(f"\n✅ Successfully updated department to '{new_department}' for {mentor_email}")
        else:
            print(f"\n❌ No mentor found with email: {mentor_email}")

if __name__ == "__main__":
    update_mentor_department()
