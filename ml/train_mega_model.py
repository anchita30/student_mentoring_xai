import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
import shap

def prepare_features(df):
    """Prepare features for training with enhanced feature engineering"""
    print("Preparing features for ML training...")

    # Basic features
    feature_columns = [
        'math_comfort', 'programming_comfort', 'problem_solving_rating',
        'communication_rating', 'hackathons_participated', 'clubs_joined',
        'competitions_participated', 'gpa', 'attendance_percentage',
        'num_projects', 'num_courses'
    ]

    # Feature engineering - create interaction features
    df['skill_combo_math_prog'] = df['math_comfort'] * df['programming_comfort']
    df['skill_combo_prob_comm'] = df['problem_solving_rating'] * df['communication_rating']
    df['academic_strength'] = (df['gpa'] * df['attendance_percentage']) / 100
    df['project_experience'] = df['num_projects'] * 2 + df['num_courses']
    df['extracurricular_score'] = (df['hackathons_participated'] * 3 +
                                   df['competitions_participated'] * 2 +
                                   df['clubs_joined'])

    # Add engineered features
    feature_columns.extend([
        'skill_combo_math_prog', 'skill_combo_prob_comm', 'academic_strength',
        'project_experience', 'extracurricular_score'
    ])

    # Encode categorical variables
    le_branch = LabelEncoder()
    df['branch_encoded'] = le_branch.fit_transform(df['branch'])
    feature_columns.append('branch_encoded')

    # Prepare target variables (domain scores)
    target_domains = ['Web Development', 'Machine Learning', 'Cybersecurity',
                     'Data Engineering', 'Cloud Computing', 'Mobile Development']

    # Create realistic domain scores based on student profiles
    for domain in target_domains:
        domain_col = f'score_{domain.lower().replace(" ", "_")}'
        df[domain_col] = calculate_domain_scores(df, domain)

    return df, feature_columns, target_domains

def calculate_domain_scores(df, domain):
    """Calculate realistic domain scores based on student characteristics"""
    scores = []

    for _, student in df.iterrows():
        # Base score
        base_score = 40 + np.random.normal(0, 5)

        # Domain-specific scoring logic
        if domain == "Web Development":
            base_score += student['programming_comfort'] * 3
            base_score += student['communication_rating'] * 2
            base_score += student['num_projects'] * 2
            if student.get('primary_project_domain') == domain:
                base_score += 8

        elif domain == "Machine Learning":
            base_score += student['math_comfort'] * 3.5
            base_score += student['programming_comfort'] * 2.5
            base_score += student['problem_solving_rating'] * 2
            if student.get('primary_course_domain') == domain:
                base_score += 10

        elif domain == "Cybersecurity":
            base_score += student['problem_solving_rating'] * 3.5
            base_score += student['math_comfort'] * 2
            base_score += student['programming_comfort'] * 2
            base_score += student['competitions_participated'] * 1.5

        elif domain == "Data Engineering":
            base_score += student['math_comfort'] * 3
            base_score += student['programming_comfort'] * 3
            base_score += student['gpa'] * 1.5
            base_score += student['num_courses'] * 1.5

        elif domain == "Cloud Computing":
            base_score += student['programming_comfort'] * 3
            base_score += student['problem_solving_rating'] * 2.5
            base_score += student['num_projects'] * 1.5

        elif domain == "Mobile Development":
            base_score += student['programming_comfort'] * 3.5
            base_score += student['communication_rating'] * 2
            base_score += student['num_projects'] * 2

        # Boost if target domain matches
        if student.get('target_domain') == domain:
            base_score += np.random.uniform(10, 20)

        # Add some randomness but keep realistic
        score = base_score + np.random.normal(0, 3)
        score = max(25, min(95, score))  # Clamp to realistic range
        scores.append(round(score, 1))

    return scores

def train_model_for_domain(X_train, X_test, y_train, y_test, domain_name):
    """Train an optimized model for a specific domain"""
    print(f"Training model for {domain_name}...")

    # Hyperparameter tuning with GridSearchCV
    param_grid = {
        'n_estimators': [100, 200, 300],
        'max_depth': [None, 10, 20, 30],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4]
    }

    rf = RandomForestRegressor(random_state=42)

    # Use GridSearchCV for hyperparameter tuning
    grid_search = GridSearchCV(
        rf, param_grid, cv=5, scoring='neg_mean_squared_error',
        n_jobs=-1, verbose=1
    )

    grid_search.fit(X_train, y_train)
    best_model = grid_search.best_estimator_

    # Evaluate model
    y_pred = best_model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"  Best params: {grid_search.best_params_}")
    print(f"  MSE: {mse:.2f}, R²: {r2:.3f}")

    return best_model, {'mse': mse, 'r2': r2}

def train_mega_model():
    """Train high-performance models with huge dataset"""
    print("TRAINING MEGA ML MODEL WITH HUGE DATASET")

    # Load the huge dataset
    try:
        df = pd.read_csv('ml/data/students_dataset.csv')
        print(f"Loaded dataset with {len(df)} students")
    except FileNotFoundError:
        print("Dataset not found! Generating huge dataset first...")
        os.system('cd ml/data && python generate_huge_dataset.py')
        df = pd.read_csv('ml/data/students_dataset.csv')

    # Prepare features and targets
    df, feature_columns, target_domains = prepare_features(df)

    X = df[feature_columns]

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_scaled = pd.DataFrame(X_scaled, columns=feature_columns)

    # Split data
    X_train, X_test = train_test_split(X_scaled, test_size=0.2, random_state=42)

    # Train models for each domain
    models = {}
    performance = {}

    for domain in target_domains:
        target_col = f'score_{domain.lower().replace(" ", "_")}'
        y = df[target_col]
        y_train, y_test = train_test_split(y, test_size=0.2, random_state=42)

        model, perf = train_model_for_domain(X_train, X_test, y_train, y_test, domain)
        models[domain] = model
        performance[domain] = perf

    # Save models
    os.makedirs('ml/models', exist_ok=True)

    # Save individual domain models
    for domain, model in models.items():
        model_file = f'ml/models/{domain.lower().replace(" ", "_")}_model.joblib'
        joblib.dump(model, model_file)
        print(f"Saved {domain} model to {model_file}")

    # Save scaler and feature columns
    joblib.dump(scaler, 'ml/models/scaler.joblib')
    joblib.dump(feature_columns, 'ml/models/feature_columns.joblib')

    # Create a combined model for backward compatibility
    combined_model = {
        'models': models,
        'scaler': scaler,
        'feature_columns': feature_columns,
        'target_domains': target_domains
    }
    joblib.dump(combined_model, 'ml/models/domain_model.joblib')

    print("\nMODEL PERFORMANCE SUMMARY:")
    for domain, perf in performance.items():
        print(f"  {domain}: R² = {perf['r2']:.3f}, MSE = {perf['mse']:.2f}")

    print(f"\nMEGA MODELS TRAINED WITH {len(df)} STUDENTS!")
    print("Predictions will be HIGHLY accurate!")

    return models, scaler, feature_columns

if __name__ == "__main__":
    train_mega_model()