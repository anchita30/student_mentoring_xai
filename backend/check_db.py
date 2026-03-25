import sys
import os
sys.path.append(os.path.join(os.getcwd()))
from app.database import engine
from sqlalchemy import text

# Check if tables exist
with engine.connect() as conn:
    result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
    tables = [row[0] for row in result]
    print('Existing tables:', tables)

    # Check if students table exists and has any data
    if 'students' in tables:
        result = conn.execute(text('SELECT COUNT(*) FROM students'))
        count = result.fetchone()[0]
        print(f'Students count: {count}')
    else:
        print('No students table found!')