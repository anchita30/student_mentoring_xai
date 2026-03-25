from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Student, DomainScore, AcademicRecord, Course, Project, Skill
from app.services import ml_service
from app.schemas import DomainScoreResponse
from typing import Dict, Any, List
from pydantic import BaseModel
import numpy as np

router = APIRouter(prefix="/predict", tags=["ML Predictions"])


# ── Schemas ───────────────────────────────────────────────────
class PredictionRequest(BaseModel):
    student_id: int
    # Optional: allow manual feature override for testing
    override_features: Dict[str, Any] | None = None


class PredictionResponse(BaseModel):
    student_id: int
    scores: Dict[str, float]
    top_domain: str
    top_score: float


class SHAPExplanation(BaseModel):
    feature: str
    contribution: float
    value: float


class SHAPResponse(BaseModel):
    student_id: int
    domain: str
    explanations: List[SHAPExplanation]


class GlobalImportanceResponse(BaseModel):
    feature: str
    importance: float


# ── Helper Functions ──────────────────────────────────────────
def extract_student_features(student_id: int, db: Session) -> Dict[str, Any]:
    """
    Extract all features needed for ML prediction from database.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Get academic records
    academic_records = db.query(AcademicRecord).filter(
        AcademicRecord.student_id == student_id
    ).all()

    # Get courses
    courses = db.query(Course).filter(Course.student_id == student_id).all()

    # Get projects
    projects = db.query(Project).filter(Project.student_id == student_id).all()

    # Get skills
    skill = db.query(Skill).filter(Skill.student_id == student_id).first()

    # Get latest mentor feedback
    from app.models.models import MentorFeedback
    latest_feedback = db.query(MentorFeedback).filter(
        MentorFeedback.student_id == student_id
    ).order_by(MentorFeedback.created_at.desc()).first()

    # Calculate aggregated features
    avg_marks = (
        np.mean([rec.marks_obtained / rec.total_marks * 100 for rec in academic_records])
        if academic_records
        else 70
    )
    avg_attendance = (
        np.mean([rec.attendance_percentage for rec in academic_records])
        if academic_records
        else 75
    )
    avg_gpa = (
        np.mean([rec.gpa for rec in academic_records if rec.gpa])
        if academic_records
        else 7.5
    )
    num_courses = len(courses)
    avg_course_completion = (
        np.mean([c.completion_percentage for c in courses]) if courses else 50
    )
    avg_weekly_hours = (
        np.mean([c.weekly_study_hours for c in courses if c.weekly_study_hours])
        if courses
        else 10
    )
    num_projects = len(projects)
    avg_project_difficulty = (
        np.mean([p.difficulty_level for p in projects]) if projects else 3
    )

    # Build feature dict
    features = {
        "semester": student.semester,
        "avg_subject_marks": avg_marks,
        "attendance_percentage": avg_attendance,
        "gpa": avg_gpa,
        "num_courses": num_courses,
        "avg_course_completion": avg_course_completion,
        "weekly_study_hours": avg_weekly_hours,
        "num_projects": num_projects,
        "avg_project_difficulty": avg_project_difficulty,
    }

    # Add skill features if available
    if skill:
        features.update({
            "math_comfort": skill.math_comfort,
            "programming_comfort": skill.programming_comfort,
            "problem_solving_rating": skill.problem_solving_rating,
            "communication_rating": skill.communication_rating,
            "hackathons_participated": skill.hackathons_participated,
            "clubs_joined": skill.clubs_joined,
            "competitions_participated": skill.competitions_participated,
        })
    else:
        # Default values if skills not entered
        features.update({
            "math_comfort": 5,
            "programming_comfort": 5,
            "problem_solving_rating": 5,
            "communication_rating": 5,
            "hackathons_participated": 0,
            "clubs_joined": 0,
            "competitions_participated": 0,
        })

    # Add mentor feedback features if available, otherwise defaults
    if latest_feedback:
        # Use actual mentor ratings with fallback to defaults
        features.update({
            "preferred_learning_style": 2,  # Mixed (could be made dynamic)
            "participation_rating": latest_feedback.participation_rating if latest_feedback.participation_rating else 5.0,
            "lab_performance_rating": latest_feedback.lab_performance_rating if latest_feedback.lab_performance_rating else 5.0,
            "assignment_consistency": latest_feedback.assignment_consistency if latest_feedback.assignment_consistency else 5.0,
        })

        # Override attendance with mentor assessment if provided
        if latest_feedback.attendance_percentage:
            features["attendance_percentage"] = latest_feedback.attendance_percentage
    else:
        # Default values if no mentor feedback yet
        features.update({
            "preferred_learning_style": 2,  # Mixed
            "participation_rating": 5.0,
            "lab_performance_rating": 5.0,
            "assignment_consistency": 5.0,
        })

    return features


# ── Endpoints ─────────────────────────────────────────────────

@router.post("/", response_model=PredictionResponse)
def predict_domain_scores(
    request: PredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Generate ML-based domain suitability scores for a student.
    Automatically saves predictions to database.
    """
    # Extract features from database
    features = extract_student_features(request.student_id, db)

    # Override features if provided (for testing)
    if request.override_features:
        features.update(request.override_features)

    # Generate predictions
    scores = ml_service.predict_domain_scores(features)

    # Find top domain
    top_domain = max(scores, key=scores.get)
    top_score = scores[top_domain]

    # Save to database
    # Check if prediction already exists
    existing = db.query(DomainScore).filter(
        DomainScore.student_id == request.student_id
    ).first()

    if existing:
        # Update existing
        existing.web_development = scores["web_development"]
        existing.machine_learning = scores["machine_learning"]
        existing.cybersecurity = scores["cybersecurity"]
        existing.data_engineering = scores["data_engineering"]
        existing.cloud_computing = scores["cloud_computing"]
        existing.mobile_development = scores["mobile_development"]
    else:
        # Create new
        domain_score = DomainScore(
            student_id=request.student_id,
            web_development=scores["web_development"],
            machine_learning=scores["machine_learning"],
            cybersecurity=scores["cybersecurity"],
            data_engineering=scores["data_engineering"],
            cloud_computing=scores["cloud_computing"],
            mobile_development=scores["mobile_development"],
        )
        db.add(domain_score)

    db.commit()

    return PredictionResponse(
        student_id=request.student_id,
        scores=scores,
        top_domain=top_domain,
        top_score=top_score,
    )


@router.get("/{student_id}/explain", response_model=SHAPResponse)
def explain_prediction(
    student_id: int,
    domain: str | None = None,
    db: Session = Depends(get_db)
):
    """
    Generate SHAP explanations for a student's domain scores.
    Shows which features contribute most to the prediction.

    Args:
        student_id: Student ID
        domain: Specific domain to explain (optional, defaults to top domain)
    """
    # Extract features
    features = extract_student_features(student_id, db)

    # Generate SHAP explanations
    explanations = ml_service.explain_prediction_shap(features, domain)

    # Determine which domain was explained
    if domain is None:
        scores = ml_service.predict_domain_scores(features)
        domain = max(scores, key=scores.get)

    return SHAPResponse(
        student_id=student_id,
        domain=domain,
        explanations=explanations,
    )


@router.get("/global-importance", response_model=List[GlobalImportanceResponse])
def get_global_feature_importance():
    """
    Get global feature importance across all domains.
    Useful for mentor analytics dashboard.
    """
    importance = ml_service.calculate_global_feature_importance()
    return importance
