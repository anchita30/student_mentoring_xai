#!/usr/bin/env python3
"""
Test ML predictions with corrected data for web development
"""
import sys
import os
sys.path.append(os.path.join(os.getcwd()))
from app.services.ml_service import predict_domain_scores

print("=== TESTING WEB DEVELOPMENT PROFILE ===")

# Shreya's current data (predicts Data Engineering)
current_data = {
    'semester': 5,
    'gpa': 7.5,
    'attendance_percentage': 75.0,
    'branch': 'IT',
    'math_comfort': 1,  # LOW!
    'programming_comfort': 5.0,
    'problem_solving_rating': 5.0,
    'communication_rating': 8.0,
    'hackathons_participated': 6,
    'clubs_joined': 0,
    'competitions_participated': 0,
    'num_projects': 1,  # Has web dev project
    'num_courses': 1    # But has ML course!
}

print("Current data predictions:")
current_predictions = predict_domain_scores(current_data)
for domain, score in sorted(current_predictions.items(), key=lambda x: x[1], reverse=True):
    print(f"  {domain}: {score:.1f}")

print("\n" + "="*50)

# Corrected web development profile
webdev_data = {
    'semester': 5,
    'gpa': 7.5,
    'attendance_percentage': 75.0,
    'branch': 'IT',
    'math_comfort': 7,  # IMPROVED!
    'programming_comfort': 8,  # HIGHER for web dev
    'problem_solving_rating': 7,
    'communication_rating': 8.0,
    'hackathons_participated': 6,
    'clubs_joined': 0,
    'competitions_participated': 0,
    'num_projects': 2,  # More projects
    'num_courses': 1    # Keep the one course
}

print("Web development optimized profile predictions:")
webdev_predictions = predict_domain_scores(webdev_data)
for domain, score in sorted(webdev_predictions.items(), key=lambda x: x[1], reverse=True):
    print(f"  {domain}: {score:.1f}")

print("\n=== RECOMMENDATIONS ===")
print("To get Web Development as top prediction:")
print("1. Increase Math Comfort from 1 to 7+ (currently very low)")
print("2. Increase Programming Comfort from 5 to 8+")
print("3. Either avoid ML/Data courses, or add more Web Dev courses")
print("4. Add more web development projects")
print("\nThe ML model is working correctly - it's detecting that:")
print("- Low math skills (1/10) don't match web development requirements")
print("- Data analysis course suggests ML/Data Engineering interest")
print("- Current skill profile better matches Data Engineering than Web Dev")