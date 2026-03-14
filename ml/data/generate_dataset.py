import pandas as pd
import numpy as np
import random
import os

np.random.seed(42)
random.seed(42)

# ── Domain profiles ──────────────────────────────────────────────────────────
# Each domain has a "ideal student profile"
# We'll generate students that lean toward one or more domains

DOMAINS = ["web_development", "machine_learning", "cybersecurity", 
           "data_engineering", "cloud_computing", "mobile_development"]

DOMAIN_PROFILES = {
    "web_development": {
        "math_comfort": (4, 7),
        "programming_comfort": (6, 10),
        "problem_solving": (5, 9),
        "preferred_subjects": ["Web Technologies", "UI/UX", "JavaScript", "Databases"],
        "preferred_techs": ["React", "Node.js", "HTML", "CSS", "MongoDB"],
    },
    "machine_learning": {
        "math_comfort": (7, 10),
        "programming_comfort": (6, 10),
        "problem_solving": (7, 10),
        "preferred_subjects": ["Machine Learning", "Statistics", "Linear Algebra", "Python"],
        "preferred_techs": ["Python", "TensorFlow", "scikit-learn", "Pandas", "NumPy"],
    },
    "cybersecurity": {
        "math_comfort": (5, 8),
        "programming_comfort": (6, 9),
        "problem_solving": (7, 10),
        "preferred_subjects": ["Network Security", "Cryptography", "OS", "Linux"],
        "preferred_techs": ["Kali Linux", "Wireshark", "Python", "Bash", "Metasploit"],
    },
    "data_engineering": {
        "math_comfort": (6, 9),
        "programming_comfort": (6, 9),
        "problem_solving": (6, 9),
        "preferred_subjects": ["Databases", "Big Data", "Statistics", "SQL"],
        "preferred_techs": ["SQL", "Spark", "Kafka", "Airflow", "Python"],
    },
    "cloud_computing": {
        "math_comfort": (4, 7),
        "programming_comfort": (5, 9),
        "problem_solving": (6, 9),
        "preferred_subjects": ["Networks", "OS", "Distributed Systems", "DevOps"],
        "preferred_techs": ["AWS", "Docker", "Kubernetes", "Terraform", "Linux"],
    },
    "mobile_development": {
        "math_comfort": (4, 7),
        "programming_comfort": (6, 10),
        "problem_solving": (5, 9),
        "preferred_subjects": ["Mobile Computing", "UI/UX", "Java", "Swift"],
        "preferred_techs": ["Flutter", "React Native", "Android", "iOS", "Firebase"],
    },
}

def generate_student(student_id, primary_domain):
    profile = DOMAIN_PROFILES[primary_domain]

    # ── Basic info ────────────────────────────────────────────────────────────
    semester = random.randint(3, 8)
    
    # ── Skills ────────────────────────────────────────────────────────────────
    math_comfort = round(random.uniform(*profile["math_comfort"]), 1)
    programming_comfort = round(random.uniform(*profile["programming_comfort"]), 1)
    problem_solving = round(random.uniform(*profile["problem_solving"]), 1)
    communication = round(random.uniform(4, 9), 1)

    # ── Academic performance ──────────────────────────────────────────────────
    base_marks = random.uniform(55, 95)
    subject_marks = round(base_marks + random.uniform(-10, 10), 1)
    subject_marks = max(40, min(100, subject_marks))
    attendance = round(random.uniform(60, 98), 1)
    gpa = round((subject_marks / 100) * 10, 2)

    # ── Course activity ───────────────────────────────────────────────────────
    num_courses = random.randint(1, 6)
    course_domains = [primary_domain] * max(1, int(num_courses * 0.6))
    other_domains = [d for d in DOMAINS if d != primary_domain]
    course_domains += random.choices(other_domains, k=num_courses - len(course_domains))
    
    avg_completion = round(random.uniform(60, 100), 1)
    weekly_hours = round(random.uniform(3, 20), 1)

    # ── Projects ──────────────────────────────────────────────────────────────
    num_projects = random.randint(1, 5)
    project_domains = [primary_domain] * max(1, int(num_projects * 0.6))
    project_domains += random.choices(other_domains, k=num_projects - len(project_domains))
    
    avg_difficulty = round(random.uniform(1, 5), 1)
    
    # Students who are more advanced have harder projects
    if semester >= 6:
        avg_difficulty = round(random.uniform(2.5, 5), 1)

    # ── Extracurriculars ──────────────────────────────────────────────────────
    hackathons = random.randint(0, 5)
    clubs = random.randint(0, 3)
    competitions = random.randint(0, 4)

    # ── Domain scores (what we want to PREDICT) ───────────────────────────────
    # These are calculated based on the student profile
    # Primary domain gets highest score, others get lower scores
    
    scores = {}
    for domain in DOMAINS:
        if domain == primary_domain:
            scores[domain] = round(random.uniform(65, 95), 1)
        else:
            scores[domain] = round(random.uniform(15, 55), 1)

    # Slight boost to related domains
    if primary_domain == "machine_learning":
        scores["data_engineering"] = min(100, scores["data_engineering"] + random.uniform(5, 15))
    if primary_domain == "web_development":
        scores["mobile_development"] = min(100, scores["mobile_development"] + random.uniform(5, 15))
    if primary_domain == "cloud_computing":
        scores["data_engineering"] = min(100, scores["data_engineering"] + random.uniform(5, 10))

    return {
        "student_id": student_id,
        "primary_domain": primary_domain,
        "semester": semester,
        "math_comfort": math_comfort,
        "programming_comfort": programming_comfort,
        "problem_solving_rating": problem_solving,
        "communication_rating": communication,
        "avg_subject_marks": subject_marks,
        "attendance_percentage": attendance,
        "gpa": gpa,
        "num_courses": num_courses,
        "avg_course_completion": avg_completion,
        "weekly_study_hours": weekly_hours,
        "num_projects": num_projects,
        "avg_project_difficulty": avg_difficulty,
        "hackathons_participated": hackathons,
        "clubs_joined": clubs,
        "competitions_participated": competitions,
        # Target scores
        "score_web_development": round(scores["web_development"], 1),
        "score_machine_learning": round(scores["machine_learning"], 1),
        "score_cybersecurity": round(scores["cybersecurity"], 1),
        "score_data_engineering": round(scores["data_engineering"], 1),
        "score_cloud_computing": round(scores["cloud_computing"], 1),
        "score_mobile_development": round(scores["mobile_development"], 1),
    }

# ── Generate 240 students (40 per domain) ─────────────────────────────────────
students = []
student_id = 1

for domain in DOMAINS:
    for _ in range(40):
        students.append(generate_student(student_id, domain))
        student_id += 1

# Shuffle so domains are mixed
random.shuffle(students)

df = pd.DataFrame(students)

# Save to CSV
output_path = os.path.join(os.path.dirname(__file__), "students_dataset.csv")
df.to_csv(output_path, index=False)

print(f"✅ Dataset generated successfully!")
print(f"📊 Total students: {len(df)}")
print(f"📁 Saved to: {output_path}")
print(f"\nDomain distribution:")
print(df["primary_domain"].value_counts())
print(f"\nSample data:")
print(df.head(3).to_string())
