import pandas as pd
import numpy as np
import random
import os

np.random.seed(42)
random.seed(42)

DOMAINS = ["web_development", "machine_learning", "cybersecurity",
           "data_engineering", "cloud_computing", "mobile_development"]

DOMAIN_PROFILES = {
    "web_development": {
        "math_comfort": (5, 8),
        "programming_comfort": (7, 10),
        "problem_solving": (6, 9),
        "participation": (6, 9),
        "lab_performance": (6, 10),
    },
    "machine_learning": {
        "math_comfort": (7, 10),
        "programming_comfort": (7, 10),
        "problem_solving": (7, 10),
        "participation": (6, 10),
        "lab_performance": (7, 10),
    },
    "cybersecurity": {
        "math_comfort": (6, 9),
        "programming_comfort": (6, 9),
        "problem_solving": (7, 10),
        "participation": (6, 9),
        "lab_performance": (6, 9),
    },
    "data_engineering": {
        "math_comfort": (6, 9),
        "programming_comfort": (7, 10),
        "problem_solving": (6, 9),
        "participation": (6, 9),
        "lab_performance": (6, 9),
    },
    "cloud_computing": {
        "math_comfort": (5, 8),
        "programming_comfort": (6, 9),
        "problem_solving": (6, 9),
        "participation": (5, 8),
        "lab_performance": (6, 9),
    },
    "mobile_development": {
        "math_comfort": (5, 8),
        "programming_comfort": (7, 10),
        "problem_solving": (6, 9),
        "participation": (6, 9),
        "lab_performance": (6, 10),
    },
}

def calculate_domain_score(features, domain):
    """
    Calculate domain score based on features with realistic correlations
    """
    # Start with base score of 30-40
    base_score = 30 + random.uniform(0, 10)

    # Domain-specific feature weights (reduced to prevent maxing out)
    if domain == "machine_learning":
        base_score += features["math_comfort"] * 2.5
        base_score += features["programming_comfort"] * 2.0
        base_score += features["problem_solving"] * 1.8
        base_score += features["num_courses"] * 1.2
        base_score += features["avg_project_difficulty"] * 1.5

    elif domain == "web_development":
        base_score += features["programming_comfort"] * 2.5
        base_score += features["num_projects"] * 2.0
        base_score += features["lab_performance"] * 1.5
        base_score += features["avg_course_completion"] / 15
        base_score += features["participation"] * 1.2

    elif domain == "cybersecurity":
        base_score += features["problem_solving"] * 2.5
        base_score += features["programming_comfort"] * 2.0
        base_score += features["math_comfort"] * 1.5
        base_score += features["hackathons"] * 1.8
        base_score += features["competitions"] * 1.5

    elif domain == "data_engineering":
        base_score += features["math_comfort"] * 2.0
        base_score += features["programming_comfort"] * 2.0
        base_score += features["avg_course_completion"] / 12
        base_score += features["num_courses"] * 1.5
        base_score += features["gpa"] * 1.5

    elif domain == "cloud_computing":
        base_score += features["programming_comfort"] * 2.0
        base_score += features["num_courses"] * 2.0
        base_score += features["avg_project_difficulty"] * 1.5
        base_score += features["lab_performance"] * 1.2
        base_score += features["weekly_hours"] * 0.6

    elif domain == "mobile_development":
        base_score += features["programming_comfort"] * 2.5
        base_score += features["num_projects"] * 2.0
        base_score += features["avg_project_difficulty"] * 1.5
        base_score += features["lab_performance"] * 1.2
        base_score += features["participation"] * 1.2

    # Add some randomness but keep it realistic
    score = base_score + random.uniform(-3, 3)

    # Clamp to 20-95 range (not 100 to keep it realistic)
    return max(20, min(95, score))


def generate_student(student_id, primary_domain):
    profile = DOMAIN_PROFILES[primary_domain]

    semester = random.randint(3, 8)

    # ── Skills (aligned with primary domain) ──────────────────────
    math_comfort = round(random.uniform(*profile["math_comfort"]), 1)
    programming_comfort = round(random.uniform(*profile["programming_comfort"]), 1)
    problem_solving = round(random.uniform(*profile["problem_solving"]), 1)
    communication = round(random.uniform(5, 9), 1)

    # ── Activities ─────────────────────────────────────────────────
    hackathons = random.randint(0, 5)
    clubs_joined = random.randint(0, 3)
    competitions = random.randint(0, 4)
    preferred_learning = random.choice([0, 1, 2])  # 0=video, 1=reading, 2=mixed

    # ── Academic performance ───────────────────────────────────────
    base_marks = random.uniform(60, 92)
    subject_marks = round(base_marks + random.uniform(-8, 8), 1)
    subject_marks = max(45, min(100, subject_marks))
    attendance = round(random.uniform(65, 95), 1)
    gpa = round((subject_marks / 100) * 10, 2)

    # ── Course activity ────────────────────────────────────────────
    num_courses = random.randint(1, 6)
    avg_completion = round(random.uniform(65, 98), 1)
    weekly_hours = round(random.uniform(4, 18), 1)

    # ── Projects ───────────────────────────────────────────────────
    num_projects = random.randint(1, 5)
    avg_difficulty = round(random.uniform(2, 5), 1)
    if semester >= 6:
        avg_difficulty = min(5, avg_difficulty + 0.5)

    # ── Mentor ratings ─────────────────────────────────────────────
    participation_rating = round(random.uniform(*profile["participation"]), 1)
    lab_performance = round(random.uniform(*profile["lab_performance"]), 1)
    assignment_consistency = round(random.uniform(5, 10), 1)

    # Package features for score calculation
    features = {
        "math_comfort": math_comfort,
        "programming_comfort": programming_comfort,
        "problem_solving": problem_solving,
        "communication": communication,
        "hackathons": hackathons,
        "clubs": clubs_joined,
        "competitions": competitions,
        "num_courses": num_courses,
        "avg_course_completion": avg_completion,
        "weekly_hours": weekly_hours,
        "num_projects": num_projects,
        "avg_project_difficulty": avg_difficulty,
        "participation": participation_rating,
        "lab_performance": lab_performance,
        "gpa": gpa,
    }

    # ── Calculate domain scores with realistic correlations ───────
    scores = {}
    for domain in DOMAINS:
        if domain == primary_domain:
            # Primary domain gets boost
            base = calculate_domain_score(features, domain)
            scores[domain] = round(base + random.uniform(5, 10), 1)
        else:
            # Other domains calculated normally
            scores[domain] = round(calculate_domain_score(features, domain), 1)

    # Ensure primary domain is highest (85% of the time)
    if random.random() < 0.85:
        max_other = max([s for d, s in scores.items() if d != primary_domain])
        if scores[primary_domain] <= max_other:
            scores[primary_domain] = max_other + random.uniform(3, 8)

    # Clamp all scores to 20-95 range
    for domain in scores:
        scores[domain] = max(20, min(95, scores[domain]))

    # Add related domain boost
    if primary_domain == "machine_learning":
        scores["data_engineering"] = min(100, scores["data_engineering"] + random.uniform(8, 15))
    if primary_domain == "web_development":
        scores["mobile_development"] = min(100, scores["mobile_development"] + random.uniform(8, 15))
    if primary_domain == "data_engineering":
        scores["machine_learning"] = min(100, scores["machine_learning"] + random.uniform(5, 12))
        scores["cloud_computing"] = min(100, scores["cloud_computing"] + random.uniform(5, 10))

    return {
        "student_id": student_id,
        "primary_domain": primary_domain,
        "semester": semester,
        "math_comfort": math_comfort,
        "programming_comfort": programming_comfort,
        "problem_solving_rating": problem_solving,
        "communication_rating": communication,
        "hackathons_participated": hackathons,
        "clubs_joined": clubs_joined,
        "competitions_participated": competitions,
        "preferred_learning_style": preferred_learning,
        "avg_subject_marks": subject_marks,
        "attendance_percentage": attendance,
        "gpa": gpa,
        "num_courses": num_courses,
        "avg_course_completion": avg_completion,
        "weekly_study_hours": weekly_hours,
        "num_projects": num_projects,
        "avg_project_difficulty": avg_difficulty,
        "participation_rating": participation_rating,
        "lab_performance_rating": lab_performance,
        "assignment_consistency": assignment_consistency,
        "score_web_development": round(scores["web_development"], 1),
        "score_machine_learning": round(scores["machine_learning"], 1),
        "score_cybersecurity": round(scores["cybersecurity"], 1),
        "score_data_engineering": round(scores["data_engineering"], 1),
        "score_cloud_computing": round(scores["cloud_computing"], 1),
        "score_mobile_development": round(scores["mobile_development"], 1),
    }

# ── Generate 300 students (50 per domain for better balance) ──────
print("🎲 Generating synthetic student dataset with realistic correlations...")

students = []
student_id = 1

for domain in DOMAINS:
    print(f"   Generating 50 students with primary domain: {domain}")
    for _ in range(50):
        students.append(generate_student(student_id, domain))
        student_id += 1

# ── Save to CSV ────────────────────────────────────────────────────
df = pd.DataFrame(students)

output_path = os.path.join(os.path.dirname(__file__), "students_dataset.csv")
df.to_csv(output_path, index=False)

print(f"\n✅ Generated {len(students)} students")
print(f"💾 Saved to: {output_path}")
print(f"\n📊 Distribution:")
for domain in DOMAINS:
    count = len(df[df['primary_domain'] == domain])
    avg_score = df[f'score_{domain}'].mean()
    print(f"   {domain}: {count} students (avg score: {avg_score:.1f})")

print("\n🎯 Sample student profiles:")
for i in range(3):
    student = df.iloc[i]
    print(f"\n   Student {student['student_id']} (Primary: {student['primary_domain']}):")
    print(f"      Math: {student['math_comfort']}/10, Programming: {student['programming_comfort']}/10")
    print(f"      Projects: {student['num_projects']}, Courses: {student['num_courses']}")
    print(f"      Scores: ML={student['score_machine_learning']:.0f}, Web={student['score_web_development']:.0f}, Cloud={student['score_cloud_computing']:.0f}")
