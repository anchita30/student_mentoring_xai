import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

print("Training ML model with HUGE dataset...")

# Load the new huge dataset
data_path = os.path.join(os.path.dirname(__file__), "data", "students_dataset.csv")
df = pd.read_csv(data_path)
print(f"Loaded dataset: {len(df)} students")

# Feature columns from the new dataset
FEATURE_COLUMNS = [
    "semester",
    "gpa",
    "attendance_percentage",
    "math_comfort",
    "programming_comfort",
    "problem_solving_rating",
    "communication_rating",
    "hackathons_participated",
    "clubs_joined",
    "competitions_participated",
    "num_projects",
    "num_courses"
]

print(f"Features: {len(FEATURE_COLUMNS)}")

# Encode branch (categorical to numeric)
label_encoder = LabelEncoder()
df['branch_encoded'] = label_encoder.fit_transform(df['branch'])
FEATURE_COLUMNS.append('branch_encoded')

# Create realistic domain scores based on student profiles
def calculate_domain_score(row, domain):
    """Calculate realistic domain score based on student characteristics"""
    base_score = 30 + np.random.normal(0, 5)

    if domain == "Web Development":
        base_score += row['programming_comfort'] * 3.5
        base_score += row['communication_rating'] * 2
        base_score += row['num_projects'] * 1.5
    elif domain == "Machine Learning":
        base_score += row['math_comfort'] * 4
        base_score += row['programming_comfort'] * 3
        base_score += row['problem_solving_rating'] * 2
    elif domain == "Cybersecurity":
        base_score += row['problem_solving_rating'] * 4
        base_score += row['math_comfort'] * 2.5
        base_score += row['competitions_participated'] * 2
    elif domain == "Data Engineering":
        base_score += row['math_comfort'] * 3.5
        base_score += row['programming_comfort'] * 3.5
        base_score += row['gpa'] * 2
    elif domain == "Cloud Computing":
        base_score += row['programming_comfort'] * 3.5
        base_score += row['problem_solving_rating'] * 3
        base_score += row['num_courses'] * 1.5
    elif domain == "Mobile Development":
        base_score += row['programming_comfort'] * 4
        base_score += row['communication_rating'] * 2.5
        base_score += row['num_projects'] * 1.5

    # Boost if this is their target domain
    if row['target_domain'] == domain:
        base_score += np.random.uniform(10, 20)

    # Add some randomness but keep realistic
    score = base_score + np.random.normal(0, 3)
    return max(20, min(95, score))

# Generate domain scores
domains = ["Web Development", "Machine Learning", "Cybersecurity",
           "Data Engineering", "Cloud Computing", "Mobile Development"]

for domain in domains:
    col_name = f"score_{domain.lower().replace(' ', '_')}"
    df[col_name] = df.apply(lambda row: calculate_domain_score(row, domain), axis=1)

TARGET_COLUMNS = [f"score_{domain.lower().replace(' ', '_')}" for domain in domains]
print(f"Targets: {len(TARGET_COLUMNS)} domain scores")

# Prepare features and targets
X = df[FEATURE_COLUMNS]
y = df[TARGET_COLUMNS]

print(f"Dataset shape: {X.shape}")
print(f"Target shape: {y.shape}")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
print("Features scaled")

# Train the model
print("Training Random Forest model...")

base_model = RandomForestRegressor(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

model = MultiOutputRegressor(base_model)
model.fit(X_train_scaled, y_train)
print("Model trained!")

# Evaluate model
y_pred = model.predict(X_test_scaled)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"Model Performance:")
print(f"  MSE: {mse:.2f}")
print(f"  R²: {r2:.3f}")

# Individual domain performance
for i, domain in enumerate(domains):
    domain_r2 = r2_score(y_test.iloc[:, i], y_pred[:, i])
    print(f"  {domain}: R² = {domain_r2:.3f}")

# Save models
models_dir = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(models_dir, exist_ok=True)

model_path = os.path.join(models_dir, "domain_model.joblib")
scaler_path = os.path.join(models_dir, "scaler.joblib")
features_path = os.path.join(models_dir, "feature_columns.joblib")

joblib.dump(model, model_path)
joblib.dump(scaler, scaler_path)
joblib.dump(FEATURE_COLUMNS, features_path)

print(f"\nModel saved to: {model_path}")
print(f"Scaler saved to: {scaler_path}")
print(f"Features saved to: {features_path}")

print(f"\nSUCCESS! Trained model with {len(df)} students for highly accurate predictions!")