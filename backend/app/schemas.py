from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ─── Student Schemas ───────────────────────────────────────

class StudentCreate(BaseModel):
    full_name: str
    email: str
    enrollment_number: str
    semester: int
    branch: str

class StudentResponse(BaseModel):
    id: int
    full_name: str
    email: str
    enrollment_number: str
    semester: int
    branch: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# ─── Academic Record Schemas ───────────────────────────────

class AcademicRecordCreate(BaseModel):
    semester: int
    subject_name: str
    marks_obtained: float
    total_marks: float
    attendance_percentage: float
    gpa: Optional[float] = None

class AcademicRecordResponse(AcademicRecordCreate):
    id: int
    student_id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# ─── Course Schemas ────────────────────────────────────────

class CourseCreate(BaseModel):
    course_name: str
    platform: Optional[str] = None
    domain: str
    completion_percentage: float
    completion_days: Optional[int] = None
    weekly_study_hours: Optional[float] = None

class CourseResponse(CourseCreate):
    id: int
    student_id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# ─── Project Schemas ───────────────────────────────────────

class ProjectCreate(BaseModel):
    title: str
    domain: str
    difficulty_level: int
    technologies_used: Optional[str] = None
    completion_days: Optional[int] = None
    github_link: Optional[str] = None
    is_team_project: bool = False

class ProjectResponse(ProjectCreate):
    id: int
    student_id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# ─── Skill Schemas ─────────────────────────────────────────

class SkillCreate(BaseModel):
    problem_solving_rating: float
    programming_comfort: float
    math_comfort: float
    communication_rating: float
    hackathons_participated: int = 0
    clubs_joined: int = 0
    competitions_participated: int = 0

class SkillResponse(SkillCreate):
    id: int
    student_id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# ─── Mentor Feedback Schemas ───────────────────────────────

class MentorFeedbackCreate(BaseModel):
    mentor_name: str
    recommended_domain: Optional[str] = None
    recommended_courses: Optional[str] = None
    recommended_projects: Optional[str] = None
    skill_improvements: Optional[str] = None
    general_notes: Optional[str] = None

class MentorFeedbackResponse(MentorFeedbackCreate):
    id: int
    student_id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

# ─── Domain Score Schemas ──────────────────────────────────

class DomainScoreResponse(BaseModel):
    id: int
    student_id: int
    web_development: float
    machine_learning: float
    cybersecurity: float
    data_engineering: float
    cloud_computing: float
    mobile_development: float
    generated_at: Optional[datetime]

    class Config:
        from_attributes = True