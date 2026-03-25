from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(100), nullable=False)
    full_name = Column(String(100), nullable=False)
    user_type = Column(String(20), nullable=False)  # "student" or "mentor"
    is_active = Column(Boolean, default=True, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to student (if user is a student)
    student = relationship("Student", back_populates="user")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    enrollment_number = Column(String(50), unique=True, nullable=False)
    semester = Column(Integer, nullable=False)
    branch = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="student")
    academic_records = relationship("AcademicRecord", back_populates="student")
    courses = relationship("Course", back_populates="student")
    projects = relationship("Project", back_populates="student")
    skills = relationship("Skill", back_populates="student")
    domain_scores = relationship("DomainScore", back_populates="student")
    mentor_feedbacks = relationship("MentorFeedback", back_populates="student")


class AcademicRecord(Base):
    __tablename__ = "academic_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    semester = Column(Integer, nullable=False)
    subject_name = Column(String(100), nullable=False)
    marks_obtained = Column(Float, nullable=False)
    total_marks = Column(Float, nullable=False)
    attendance_percentage = Column(Float, nullable=False)
    gpa = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="academic_records")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_name = Column(String(200), nullable=False)
    platform = Column(String(100), nullable=True)
    domain = Column(String(100), nullable=False)
    completion_percentage = Column(Float, nullable=False)
    completion_days = Column(Integer, nullable=True)
    weekly_study_hours = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="courses")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    title = Column(String(200), nullable=False)
    domain = Column(String(100), nullable=False)
    difficulty_level = Column(Integer, nullable=False)  # 1 to 5
    technologies_used = Column(Text, nullable=True)
    completion_days = Column(Integer, nullable=True)
    github_link = Column(String(300), nullable=True)
    is_team_project = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="projects")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    problem_solving_rating = Column(Float, nullable=False)  # 1 to 10
    programming_comfort = Column(Float, nullable=False)
    math_comfort = Column(Float, nullable=False)
    communication_rating = Column(Float, nullable=False)
    hackathons_participated = Column(Integer, default=0)
    clubs_joined = Column(Integer, default=0)
    competitions_participated = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="skills")


class DomainScore(Base):
    __tablename__ = "domain_scores"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    web_development = Column(Float, default=0.0)
    machine_learning = Column(Float, default=0.0)
    cybersecurity = Column(Float, default=0.0)
    data_engineering = Column(Float, default=0.0)
    cloud_computing = Column(Float, default=0.0)
    mobile_development = Column(Float, default=0.0)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="domain_scores")


class MentorFeedback(Base):
    __tablename__ = "mentor_feedback"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    mentor_name = Column(String(100), nullable=False)
    # Mentor assessment ratings
    attendance_percentage = Column(Float, nullable=True)
    participation_rating = Column(Float, nullable=True)  # 1-10
    lab_performance_rating = Column(Float, nullable=True)  # 1-10
    assignment_consistency = Column(Float, nullable=True)  # 1-10
    # Recommendations
    recommended_domain = Column(String(100), nullable=True)
    recommended_courses = Column(Text, nullable=True)
    recommended_projects = Column(Text, nullable=True)
    skill_improvements = Column(Text, nullable=True)
    general_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="mentor_feedbacks")