import pandas as pd
import numpy as np
import random
from faker import Faker

fake = Faker()
np.random.seed(42)
random.seed(42)

# HUGE DATASET - 2000 students for perfect predictions
NUM_STUDENTS = 2000

print("Generating MASSIVE dataset with realistic domain correlations...")

# Enhanced domain definitions with clear skill correlations
DOMAINS = {
    "Web Development": {
        "key_skills": ["programming_comfort", "math_comfort"],
        "projects": ["E-commerce Website", "Social Media Platform", "Blog CMS", "Portfolio Site", "Food Delivery App", "Online Banking", "Task Manager", "Real Estate Site"],
        "courses": ["React.js Masterclass", "Full Stack Development", "JavaScript Bootcamp", "Node.js Backend", "HTML/CSS Advanced", "Vue.js Complete", "Angular Framework"],
        "skill_weights": {"programming_comfort": 0.4, "math_comfort": 0.2, "problem_solving_rating": 0.3, "communication_rating": 0.1}
    },
    "Machine Learning": {
        "key_skills": ["math_comfort", "programming_comfort", "problem_solving_rating"],
        "projects": ["Image Classifier", "Sentiment Analysis", "Recommendation System", "Fraud Detection", "Stock Predictor", "Chatbot AI", "Face Recognition", "Credit Scoring"],
        "courses": ["Machine Learning A-Z", "Deep Learning Specialization", "Python for Data Science", "Neural Networks", "TensorFlow Mastery", "Computer Vision", "NLP Fundamentals"],
        "skill_weights": {"math_comfort": 0.4, "programming_comfort": 0.3, "problem_solving_rating": 0.25, "communication_rating": 0.05}
    },
    "Cybersecurity": {
        "key_skills": ["problem_solving_rating", "math_comfort"],
        "projects": ["Network Security Tool", "Encryption System", "Vulnerability Scanner", "Firewall Implementation", "Penetration Testing", "Malware Analysis", "SIEM Dashboard"],
        "courses": ["Ethical Hacking", "Network Security", "Cryptography Fundamentals", "Cyber Defense", "Digital Forensics", "Security Auditing", "CISSP Prep"],
        "skill_weights": {"problem_solving_rating": 0.4, "math_comfort": 0.25, "programming_comfort": 0.25, "communication_rating": 0.1}
    },
    "Data Engineering": {
        "key_skills": ["programming_comfort", "math_comfort", "problem_solving_rating"],
        "projects": ["Data Pipeline", "ETL System", "Real-time Analytics", "Data Warehouse", "Stream Processing", "Data Lake", "Apache Kafka Setup", "Spark Clusters"],
        "courses": ["Apache Spark", "Data Engineering with Python", "SQL Mastery", "Big Data Analytics", "Kafka Streams", "Elasticsearch", "Data Modeling"],
        "skill_weights": {"programming_comfort": 0.35, "math_comfort": 0.3, "problem_solving_rating": 0.3, "communication_rating": 0.05}
    },
    "Cloud Computing": {
        "key_skills": ["programming_comfort", "problem_solving_rating"],
        "projects": ["AWS Deployment", "Docker Containerization", "Microservices Architecture", "Serverless App", "Kubernetes Cluster", "CI/CD Pipeline", "Auto-scaling System"],
        "courses": ["AWS Solutions Architect", "Docker & Kubernetes", "Cloud Computing Fundamentals", "DevOps", "Azure Certification", "Google Cloud", "Terraform"],
        "skill_weights": {"programming_comfort": 0.35, "problem_solving_rating": 0.35, "math_comfort": 0.2, "communication_rating": 0.1}
    },
    "Mobile Development": {
        "key_skills": ["programming_comfort", "communication_rating"],
        "projects": ["Android App", "iOS App", "Cross-platform App", "Mobile Game", "Fitness Tracker", "Social Media App", "E-commerce Mobile", "AR App"],
        "courses": ["Android Development", "iOS Swift Programming", "React Native", "Flutter Development", "Mobile UI/UX", "App Store Optimization", "Firebase"],
        "skill_weights": {"programming_comfort": 0.4, "communication_rating": 0.25, "problem_solving_rating": 0.25, "math_comfort": 0.1}
    }
}

def generate_realistic_student(student_id, target_domain=None):
    """Generate a student with realistic correlations to a target domain"""

    # If no target domain, randomly select one
    if not target_domain:
        target_domain = random.choice(list(DOMAINS.keys()))

    domain_info = DOMAINS[target_domain]

    # Generate skills based on domain strengths
    skills = {}
    skill_weights = domain_info["skill_weights"]

    for skill, weight in skill_weights.items():
        if weight >= 0.3:  # Strong correlation
            skills[skill] = np.random.normal(8.5, 1.2)  # High skills
        elif weight >= 0.2:  # Medium correlation
            skills[skill] = np.random.normal(7.0, 1.5)  # Medium skills
        else:  # Low correlation
            skills[skill] = np.random.normal(5.5, 2.0)  # Variable skills

    # Clamp skills to 1-10 range
    for skill, value in skills.items():
        skills[skill] = min(10, max(1, round(value, 1)))

    # Generate academic performance based on math comfort
    math_score = skills["math_comfort"]
    if math_score >= 8:
        gpa = np.random.normal(8.5, 0.8)
        attendance = np.random.normal(88, 8)
    elif math_score >= 6:
        gpa = np.random.normal(7.2, 1.0)
        attendance = np.random.normal(78, 12)
    else:
        gpa = np.random.normal(6.0, 1.2)
        attendance = np.random.normal(68, 15)

    gpa = min(10, max(4, round(gpa, 1)))
    attendance = min(95, max(45, round(attendance)))

    # Generate projects based on domain
    num_projects = random.choices([1, 2, 3, 4], weights=[0.3, 0.4, 0.25, 0.05])[0]
    projects = []

    for i in range(num_projects):
        if random.random() < 0.7:  # 70% chance for target domain project
            project_domain = target_domain
            project_title = random.choice(domain_info["projects"])
        else:  # 30% chance for other domain
            other_domains = [d for d in DOMAINS.keys() if d != target_domain]
            project_domain = random.choice(other_domains)
            project_title = random.choice(DOMAINS[project_domain]["projects"])

        projects.append({
            "title": project_title,
            "domain": project_domain,
            "difficulty": random.randint(2, 5)
        })

    # Generate courses based on domain
    num_courses = random.choices([0, 1, 2, 3], weights=[0.2, 0.4, 0.3, 0.1])[0]
    courses = []

    for i in range(num_courses):
        if random.random() < 0.8:  # 80% chance for target domain course
            course_domain = target_domain
            course_name = random.choice(domain_info["courses"])
        else:  # 20% chance for other domain
            other_domains = [d for d in DOMAINS.keys() if d != target_domain]
            course_domain = random.choice(other_domains)
            course_name = random.choice(DOMAINS[course_domain]["courses"])

        courses.append({
            "course_name": course_name,
            "domain": course_domain,
            "completion_percentage": random.randint(75, 100)
        })

    # Generate extracurricular activities based on skills
    hackathons = max(0, int(np.random.poisson(skills["programming_comfort"] / 3)))
    clubs = max(0, int(np.random.poisson(skills["communication_rating"] / 4)))
    competitions = max(0, int(np.random.poisson(skills["problem_solving_rating"] / 3.5)))

    # Create student record
    student = {
        "student_id": student_id,
        "full_name": fake.name(),
        "email": fake.email(),
        "enrollment_number": f"EN202{student_id:04d}",
        "semester": random.choice([5, 6, 7, 8]),
        "branch": random.choice(["CS", "IT", "ECE", "EE"]),
        "gpa": gpa,
        "attendance_percentage": attendance,

        # Skills
        "math_comfort": skills["math_comfort"],
        "programming_comfort": skills["programming_comfort"],
        "problem_solving_rating": skills["problem_solving_rating"],
        "communication_rating": skills["communication_rating"],
        "hackathons_participated": hackathons,
        "clubs_joined": clubs,
        "competitions_participated": competitions,

        # Target domain (for validation)
        "target_domain": target_domain,

        # Projects and courses counts
        "num_projects": len(projects),
        "num_courses": len(courses),
        "primary_project_domain": projects[0]["domain"] if projects else None,
        "primary_course_domain": courses[0]["domain"] if courses else None,
    }

    return student

def generate_huge_dataset():
    """Generate huge realistic dataset with 2000 students"""
    print(f"Generating HUGE dataset with {NUM_STUDENTS} students...")

    students = []

    # Generate balanced distribution across domains
    students_per_domain = NUM_STUDENTS // len(DOMAINS)

    for domain in DOMAINS.keys():
        print(f"Generating {students_per_domain} students for {domain}...")
        for i in range(students_per_domain):
            student_id = len(students) + 1
            student = generate_realistic_student(student_id, domain)
            students.append(student)

    # Fill remaining students with random domains
    while len(students) < NUM_STUDENTS:
        student_id = len(students) + 1
        student = generate_realistic_student(student_id)
        students.append(student)

    # Create DataFrame
    df = pd.DataFrame(students)

    # Add some noise to make it more realistic
    for col in ["math_comfort", "programming_comfort", "problem_solving_rating", "communication_rating"]:
        noise = np.random.normal(0, 0.1, len(df))
        df[col] = df[col] + noise
        df[col] = df[col].clip(1, 10).round(1)

    print(f"\nDataset generated with {len(df)} students!")
    print("Domain distribution:")
    print(df["target_domain"].value_counts())
    print(f"\nSkill statistics:")
    print(df[["math_comfort", "programming_comfort", "problem_solving_rating", "communication_rating"]].describe())

    return df

if __name__ == "__main__":
    # Generate the huge dataset
    df = generate_huge_dataset()

    # Save to CSV
    df.to_csv("students_dataset.csv", index=False)
    print(f"\nHUGE dataset saved to students_dataset.csv!")
    print(f"Ready for ML training with {len(df)} realistic student profiles!")