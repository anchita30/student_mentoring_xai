import joblib
import numpy as np
import pandas as pd
import shap
from typing import Dict, Any, List
import os

# ── Load Model & Artifacts ────────────────────────────────────────────────────
# Go up 3 levels from backend/app/services/ to project root, then into ml/models
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models")

model = joblib.load(os.path.join(MODEL_DIR, "domain_model.joblib"))
scaler = joblib.load(os.path.join(MODEL_DIR, "scaler.joblib"))
feature_columns = joblib.load(os.path.join(MODEL_DIR, "feature_columns.joblib"))

print("ML Model loaded successfully")

# ── Domain Names ──────────────────────────────────────────────────────────────
DOMAIN_NAMES = [
    "score_web_development",
    "score_machine_learning",
    "score_cybersecurity",
    "score_data_engineering",
    "score_cloud_computing",
    "score_mobile_development",
]

DOMAIN_DISPLAY_NAMES = [
    "Web Development",
    "Machine Learning",
    "Cybersecurity",
    "Data Engineering",
    "Cloud Computing",
    "Mobile Development",
]


def prepare_features(student_data: Dict[str, Any]) -> pd.DataFrame:
    """
    Convert student data from API into the exact feature format expected by new model.
    """
    # Basic features from the new model
    features = {
        "semester": student_data.get("semester", 5),
        "gpa": student_data.get("gpa", 7.5),
        "attendance_percentage": student_data.get("attendance_percentage", 75),
        "math_comfort": student_data.get("math_comfort", 5),
        "programming_comfort": student_data.get("programming_comfort", 5),
        "problem_solving_rating": student_data.get("problem_solving_rating", 5),
        "communication_rating": student_data.get("communication_rating", 5),
        "hackathons_participated": student_data.get("hackathons_participated", 0),
        "clubs_joined": student_data.get("clubs_joined", 0),
        "competitions_participated": student_data.get("competitions_participated", 0),
        "num_projects": student_data.get("num_projects", 0),
        "num_courses": student_data.get("num_courses", 0),
    }

    # Add branch encoding - encode student branch to numeric
    branch = student_data.get("branch", "CS")
    branch_mapping = {"CS": 0, "IT": 1, "ECE": 2, "EE": 3}
    features["branch_encoded"] = branch_mapping.get(branch, 0)

    # Create DataFrame
    df = pd.DataFrame([features])

    # Debug: Print what we have vs what's expected
    print(f"Available features: {list(df.columns)}")
    print(f"Expected features: {feature_columns}")

    # Ensure we only return columns that exist in both the DataFrame and feature_columns
    available_features = [col for col in feature_columns if col in df.columns]
    print(f"Using features: {available_features}")

    if not available_features:
        # Fallback: use all available features
        print("Warning: No matching features found, using all available features")
        return df

    return df[available_features]


def predict_domain_scores(student_data: Dict[str, Any]) -> Dict[str, float]:
    """
    Predict domain suitability scores for a student.

    Returns:
        Dict with snake_case domain names as keys and scores (0-100) as values
    """
    # Prepare features
    features_df = prepare_features(student_data)

    # Scale features
    features_scaled = scaler.transform(features_df)

    # Predict
    predictions = model.predict(features_scaled)[0]

    # Convert to dict with snake_case domain names for API compatibility
    snake_case_names = [
        "web_development",
        "machine_learning",
        "cybersecurity",
        "data_engineering",
        "cloud_computing",
        "mobile_development",
    ]

    scores = {
        snake_name: float(score)
        for snake_name, score in zip(snake_case_names, predictions)
    }

    # Apply project-based boost (projects should outweigh courses)
    # Check if student has web development projects
    if student_data.get('num_projects', 0) > 0:
        # This is a simple fix - if student has projects, boost web development
        # In a real system, we'd track individual project domains
        # For now, assume student with projects is interested in web development
        scores["web_development"] += 12.0  # Significant boost
        print(f"Applied +12.0 boost to web_development based on having {student_data.get('num_projects', 0)} projects")

    # Ensure scores don't exceed 95
    for domain in scores:
        scores[domain] = min(95.0, scores[domain])

    return scores


def explain_prediction_shap(student_data: Dict[str, Any], top_domain: str = None) -> List[Dict[str, Any]]:
    """
    Generate SHAP explanations for why the model predicted certain scores.

    Args:
        student_data: Student features
        top_domain: Which domain to explain (defaults to highest scoring domain)

    Returns:
        List of feature contributions sorted by importance
    """
    # Prepare features
    features_df = prepare_features(student_data)
    features_scaled = scaler.transform(features_df)

    # Get predictions first to find top domain
    predictions = model.predict(features_scaled)[0]

    if top_domain is None:
        # Find the domain with highest score
        top_domain_idx = np.argmax(predictions)
    else:
        # Find index of specified domain
        try:
            top_domain_idx = DOMAIN_DISPLAY_NAMES.index(top_domain)
        except ValueError:
            top_domain_idx = 0  # Default to first domain

    # Create SHAP explainer (TreeExplainer for RandomForest)
    # We need to explain a specific output, so we use the estimator for that domain
    explainer = shap.TreeExplainer(model.estimators_[top_domain_idx])

    # Calculate SHAP values
    shap_values = explainer.shap_values(features_scaled)

    # Create explanation list
    explanations = []
    feature_names = list(features_df.columns)
    for feature_name, shap_value in zip(feature_names, shap_values[0]):
        explanations.append({
            "feature": feature_name.replace("_", " ").title(),
            "contribution": float(shap_value),
            "value": float(features_df[feature_name].iloc[0]),
        })

    # Sort by absolute contribution
    explanations.sort(key=lambda x: abs(x["contribution"]), reverse=True)

    return explanations


def calculate_global_feature_importance(num_samples: int = 100) -> List[Dict[str, Any]]:
    """
    Calculate feature importance across multiple students.
    This is useful for the mentor analytics dashboard.

    Returns:
        List of features with average importance scores
    """
    # For global importance, we can use the feature importances from RandomForest
    # Average across all domain estimators

    importances = []
    for estimator in model.estimators_:
        importances.append(estimator.feature_importances_)

    # Average importance across all domains
    avg_importance = np.mean(importances, axis=0)

    # Create feature importance list using available feature columns
    feature_importance = [
        {
            "feature": feature_name.replace("_", " ").title(),
            "importance": float(importance),
        }
        for feature_name, importance in zip(feature_columns, avg_importance)
        if len(feature_columns) == len(avg_importance)
    ]

    # If lengths don't match, use a fallback approach
    if not feature_importance:
        # Fallback to basic feature names
        basic_features = ["Math Comfort", "Programming Comfort", "Problem Solving",
                         "Communication", "Projects", "Courses", "GPA", "Attendance"]
        for i, importance in enumerate(avg_importance):
            if i < len(basic_features):
                feature_importance.append({
                    "feature": basic_features[i],
                    "importance": float(importance),
                })

    # Sort by importance
    feature_importance.sort(key=lambda x: x["importance"], reverse=True)

    return feature_importance
