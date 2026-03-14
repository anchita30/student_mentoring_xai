import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

print("🚀 Starting ML model training...")

# ── Load dataset ──────────────────────────────────────────────────────────────
data_path = os.path.join(os.path.dirname(__file__), "data", "students_dataset.csv")
df = pd.read_csv(data_path)
print(f"✅ Loaded dataset: {len(df)} students")

# ── Feature columns (inputs to the model) ─────────────────────────────────────
FEATURE_COLUMNS = [
    "semester",
    "math_comfort",
    "programming_comfort",
    "problem_solving_rating",
    "communication_rating",
    "avg_subject_marks",
    "attendance_percentage",
    "gpa",
    "num_courses",
    "avg_course_completion",
    "weekly_study_hours",
    "num_projects",
    "avg_project_difficulty",
    "hackathons_participated",
    "clubs_joined",
    "competitions_participated",
]

# ── Target columns (what we want to predict) ──────────────────────────────────
TARGET_COLUMNS = [
    "score_web_development",
    "score_machine_learning",
    "score_cybersecurity",
    "score_data_engineering",
    "score_cloud_computing",
    "score_mobile_development",
]

# ── Prepare data ──────────────────────────────────────────────────────────────
X = df[FEATURE_COLUMNS]
y = df[TARGET_COLUMNS]

print(f"📊 Features: {len(FEATURE_COLUMNS)}")
print(f"🎯 Targets: {len(TARGET_COLUMNS)} domain scores")

# ── Split into train and test sets ────────────────────────────────────────────
# 80% for training, 20% for testing
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"🔀 Train size: {len(X_train)} | Test size: {len(X_test)}")

# ── Scale features ────────────────────────────────────────────────────────────
# Scaling puts all numbers on the same scale (0 to 1)
# So "marks out of 100" and "rating out of 10" are treated fairly
scaler = MinMaxScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
print("✅ Features scaled")

# ── Train the model ───────────────────────────────────────────────────────────
# RandomForest = many decision trees working together
# MultiOutputRegressor = predicts multiple scores at once
print("🌲 Training Random Forest model...")

base_model = RandomForestRegressor(
    n_estimators=200,      # 200 decision trees
    max_depth=10,          # each tree can be 10 levels deep
    min_samples_split=5,
    random_state=42,
    n_jobs=-1              # use all CPU cores
)

model = MultiOutputRegressor(base_model)
model.fit(X_train_scaled, y_train)
print("✅ Model trained!")

# ── Evaluate the model ────────────────────────────────────────────────────────
y_pred = model.predict(X_test_scaled)

print("\n📈 Model Performance:")
for i, target in enumerate(TARGET_COLUMNS):
    mae = mean_absolute_error(y_test.iloc[:, i], y_pred[:, i])
    r2 = r2_score(y_test.iloc[:, i], y_pred[:, i])
    print(f"  {target:<30} MAE: {mae:.2f}  R²: {r2:.3f}")

overall_mae = mean_absolute_error(y_test, y_pred)
print(f"\n  Overall MAE: {overall_mae:.2f} (lower is better)")

# ── Save the model and scaler ─────────────────────────────────────────────────
models_path = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(models_path, exist_ok=True)

model_path = os.path.join(models_path, "domain_model.joblib")
scaler_path = os.path.join(models_path, "scaler.joblib")
features_path = os.path.join(models_path, "feature_columns.joblib")

joblib.dump(model, model_path)
joblib.dump(scaler, scaler_path)
joblib.dump(FEATURE_COLUMNS, features_path)

print(f"\n💾 Model saved to: {model_path}")
print(f"💾 Scaler saved to: {scaler_path}")
print(f"💾 Features saved to: {features_path}")
print("\n🎉 Training complete!")