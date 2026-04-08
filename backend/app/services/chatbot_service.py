import os
import json
from typing import List, Dict, Any, Optional
from groq import Groq
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.models import Student, DomainScore, AcademicRecord, Project, Skill, Course
from app.services import ml_service
from app.config import settings


class ChatbotService:
    """
    AI Chatbot service using Groq API for student analytics conversations.
    Provides context-aware responses grounded in actual database data.
    """
    
    def __init__(self, db: Session):
        self.db = db
        api_key = settings.GROQ_API_KEY
        if not api_key or api_key == "your_groq_api_key_here":
            raise ValueError("GROQ_API_KEY not configured. Get free key from https://console.groq.com")
        self.client = Groq(api_key=api_key)
        
    def get_system_prompt(self, role: str, user_id: int) -> str:
        """Generate context-aware system prompt based on user role."""
        
        if role == "student":
            return f"""You are a helpful AI assistant for a student analytics platform.
You're helping student ID {user_id} understand their academic performance and career recommendations.

Your capabilities:
- Explain domain scores and why certain domains were recommended
- Analyze their skills, projects, and academic performance  
- Suggest areas for improvement
- Answer questions about their SHAP explanations (feature importance)
- Provide career guidance based on their profile
- Tell them about their MENTOR and mentor's recommendations

When asked about mentors, ALWAYS use get_student_profile function to fetch real mentor data.

Always:
- Be encouraging and supportive
- Use data from the database functions to give accurate answers
- Explain technical concepts in simple terms
- Keep responses concise (2-3 sentences unless detail is needed)

You have access to functions to query their real data. Use them to provide accurate, personalized responses."""

        else:  # mentor
            return f"""You are a helpful AI assistant for mentors on a student analytics platform.
You're helping mentor ID {user_id} understand and guide their students.

Your capabilities:
- Find students by domain interests, performance, or skills
- Analyze student profiles and provide insights
- Compare students and identify trends
- Help mentors understand SHAP explanations
- Suggest which students need attention

Always:
- Be professional and data-driven
- Use database functions to provide accurate statistics
- Highlight actionable insights
- Keep responses concise but informative

You have access to functions to query student data. Use them to help mentors make informed decisions."""

    def get_function_definitions(self, role: str) -> List[Dict[str, Any]]:
        """Define available functions for the AI to call."""
        
        # Functions available to both students and mentors
        common_functions = [
            {
                "name": "get_domain_scores",
                "description": "Get domain predictions/scores for a specific student",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "student_id": {
                            "type": "integer",
                            "description": "The ID of the student"
                        }
                    },
                    "required": ["student_id"]
                }
            },
            {
                "name": "get_shap_explanation",
                "description": "Get SHAP explanation (why domains were recommended) for a student",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "student_id": {
                            "type": "integer",
                            "description": "The ID of the student"
                        }
                    },
                    "required": ["student_id"]
                }
            },
            {
                "name": "get_student_profile",
                "description": "Get complete profile including academic records, projects, skills, and MENTOR INFORMATION for a student",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "student_id": {
                            "type": "integer",
                            "description": "The ID of the student"
                        }
                    },
                    "required": ["student_id"]
                }
            }
        ]
        
        # Additional functions only for mentors
        mentor_functions = [
            {
                "name": "find_students_by_domain",
                "description": "Find students interested in or strong in a specific domain",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "domain": {
                            "type": "string",
                            "description": "Domain name (e.g., 'Machine Learning', 'Web Development', 'Data Science')"
                        },
                        "min_score": {
                            "type": "number",
                            "description": "Minimum score threshold (0-100). Default: 70",
                            "default": 70
                        }
                    },
                    "required": ["domain"]
                }
            },
            {
                "name": "get_performance_stats",
                "description": "Get aggregated statistics about student performance",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "metric": {
                            "type": "string",
                            "enum": ["gpa", "attendance", "projects", "skills"],
                            "description": "Which metric to analyze"
                        }
                    },
                    "required": ["metric"]
                }
            },
            {
                "name": "search_students",
                "description": "Search for students by name, branch, or semester",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query (name or enrollment number)"
                        },
                        "branch": {
                            "type": "string",
                            "description": "Filter by branch (e.g., 'CS', 'IT')"
                        },
                        "semester": {
                            "type": "integer",
                            "description": "Filter by semester"
                        }
                    }
                }
            }
        ]
        
        if role == "mentor":
            return common_functions + mentor_functions
        return common_functions

    # ─── Function Implementations ─────────────────────────────

    def get_domain_scores(self, student_id: int) -> Dict[str, Any]:
        """Get domain predictions for a student."""
        try:
            score_record = self.db.query(DomainScore).filter(
                DomainScore.student_id == student_id
            ).first()
            
            if not score_record:
                return {"error": "No domain scores found for this student"}
            
            # Extract all domain scores
            domains = [
                {"name": "Web Development", "score": round(score_record.web_development, 2)},
                {"name": "Machine Learning", "score": round(score_record.machine_learning, 2)},
                {"name": "Cybersecurity", "score": round(score_record.cybersecurity, 2)},
                {"name": "Data Engineering", "score": round(score_record.data_engineering, 2)},
                {"name": "Cloud Computing", "score": round(score_record.cloud_computing, 2)},
                {"name": "Mobile Development", "score": round(score_record.mobile_development, 2)},
            ]
            
            # Sort by score descending
            domains_sorted = sorted(domains, key=lambda x: x["score"], reverse=True)
            
            return {
                "student_id": student_id,
                "domains": domains_sorted,
                "top_domain": domains_sorted[0]["name"],
                "top_score": domains_sorted[0]["score"]
            }
        except Exception as e:
            return {"error": str(e)}

    def get_shap_explanation(self, student_id: int) -> Dict[str, Any]:
        """Get SHAP explanation for why domains were recommended."""
        try:
            # Get student data
            student = self.db.query(Student).filter(Student.id == student_id).first()
            if not student:
                return {"error": "Student not found"}
            
            # Gather data to build features (same as predictions.py)
            academic_records = self.db.query(AcademicRecord).filter(
                AcademicRecord.student_id == student_id
            ).all()
            courses = self.db.query(Course).filter(Course.student_id == student_id).all()
            projects = self.db.query(Project).filter(Project.student_id == student_id).all()
            skill = self.db.query(Skill).filter(Skill.student_id == student_id).first()
            
            if not academic_records and not projects and not skill:
                return {"error": "Not enough data for SHAP analysis"}
            
            # Build feature dict
            import numpy as np
            avg_marks = np.mean([rec.marks_obtained / rec.total_marks * 100 
                               for rec in academic_records]) if academic_records else 70
            avg_attendance = np.mean([rec.attendance_percentage 
                                    for rec in academic_records]) if academic_records else 75
            avg_gpa = np.mean([rec.gpa for rec in academic_records 
                             if rec.gpa]) if academic_records else 7.5
            
            features = {
                "semester": student.semester,
                "avg_subject_marks": avg_marks,
                "attendance_percentage": avg_attendance,
                "gpa": avg_gpa,
                "num_courses": len(courses),
                "avg_course_completion": np.mean([c.completion_percentage 
                                                 for c in courses]) if courses else 50,
                "weekly_study_hours": np.mean([c.weekly_study_hours for c in courses 
                                              if c.weekly_study_hours]) if courses else 10,
                "num_projects": len(projects),
                "avg_project_difficulty": np.mean([p.difficulty_level 
                                                  for p in projects]) if projects else 3,
            }
            
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
            
            # Get SHAP explanation from ML service
            shap_explanations = ml_service.explain_prediction_shap(features)
            
            # Format top features
            top_features = shap_explanations[:5] if len(shap_explanations) > 5 else shap_explanations
            
            return {
                "student_name": student.full_name,
                "top_influencing_factors": [
                    {
                        "feature": exp["feature"],
                        "impact": round(exp["contribution"], 2),
                        "value": exp.get("value", "N/A")
                    }
                    for exp in top_features
                ]
            }
        except Exception as e:
            return {"error": str(e)}

    def get_student_profile(self, student_id: int) -> Dict[str, Any]:
        """Get complete student profile."""
        try:
            student = self.db.query(Student).filter(Student.id == student_id).first()
            if not student:
                return {"error": "Student not found"}
            
            # Get academic records
            academic = self.db.query(AcademicRecord).filter(
                AcademicRecord.student_id == student_id
            ).all()
            
            # Get projects
            projects = self.db.query(Project).filter(
                Project.student_id == student_id
            ).all()
            
            # Get skills
            skills = self.db.query(Skill).filter(
                Skill.student_id == student_id
            ).first()  # Skill is a single record, not multiple
            
            # Get mentor feedback
            from app.models.models import MentorFeedback
            mentor_feedback = self.db.query(MentorFeedback).filter(
                MentorFeedback.student_id == student_id
            ).order_by(MentorFeedback.created_at.desc()).first()
            
            # Calculate averages
            avg_gpa = self.db.query(func.avg(AcademicRecord.gpa)).filter(
                AcademicRecord.student_id == student_id
            ).scalar() or 0
            
            avg_attendance = self.db.query(func.avg(AcademicRecord.attendance_percentage)).filter(
                AcademicRecord.student_id == student_id
            ).scalar() or 0
            
            result = {
                "name": student.full_name,
                "email": student.email,
                "enrollment": student.enrollment_number,
                "semester": student.semester,
                "branch": student.branch,
                "avg_gpa": round(avg_gpa, 2),
                "avg_attendance": round(avg_attendance, 2),
                "total_projects": len(projects),
                "project_domains": list(set(p.domain for p in projects)),
            }
            
            # Add skill ratings if available
            if skills:
                result["skills"] = {
                    "problem_solving": skills.problem_solving_rating,
                    "programming": skills.programming_comfort,
                    "math": skills.math_comfort,
                    "communication": skills.communication_rating,
                    "hackathons": skills.hackathons_participated,
                    "clubs": skills.clubs_joined,
                    "competitions": skills.competitions_participated
                }
            
            # Add mentor info if available
            if mentor_feedback:
                result["mentor"] = {
                    "name": mentor_feedback.mentor_name,
                    "recommended_domain": mentor_feedback.recommended_domain,
                    "recommended_courses": mentor_feedback.recommended_courses,
                    "recommended_projects": mentor_feedback.recommended_projects,
                    "notes": mentor_feedback.general_notes
                }
            else:
                result["mentor"] = None
            
            return result
        except Exception as e:
            return {"error": str(e)}

    def find_students_by_domain(self, domain: str, min_score: float = 70) -> Dict[str, Any]:
        """Find students strong in a specific domain."""
        try:
            students = self.db.query(Student, DomainScore).join(
                DomainScore, Student.id == DomainScore.student_id
            ).filter(
                and_(
                    DomainScore.domain_name.ilike(f"%{domain}%"),
                    DomainScore.score >= min_score
                )
            ).order_by(DomainScore.score.desc()).limit(10).all()
            
            if not students:
                return {"message": f"No students found with {domain} score >= {min_score}"}
            
            return {
                "domain": domain,
                "min_score": min_score,
                "students": [
                    {
                        "id": student.Student.id,
                        "name": student.Student.full_name,
                        "branch": student.Student.branch,
                        "semester": student.Student.semester,
                        "score": round(student.DomainScore.score, 2)
                    }
                    for student in students
                ]
            }
        except Exception as e:
            return {"error": str(e)}

    def get_performance_stats(self, metric: str) -> Dict[str, Any]:
        """Get aggregated performance statistics."""
        try:
            if metric == "gpa":
                stats = self.db.query(
                    func.avg(AcademicRecord.gpa).label("average"),
                    func.max(AcademicRecord.gpa).label("highest"),
                    func.min(AcademicRecord.gpa).label("lowest"),
                    func.count(func.distinct(AcademicRecord.student_id)).label("total_students")
                ).first()
                
                return {
                    "metric": "GPA",
                    "average": round(stats.average or 0, 2),
                    "highest": round(stats.highest or 0, 2),
                    "lowest": round(stats.lowest or 0, 2),
                    "total_students": stats.total_students
                }
                
            elif metric == "attendance":
                stats = self.db.query(
                    func.avg(AcademicRecord.attendance_percentage).label("average"),
                    func.count(func.distinct(AcademicRecord.student_id)).label("total_students")
                ).first()
                
                return {
                    "metric": "Attendance",
                    "average": round(stats.average or 0, 2),
                    "total_students": stats.total_students
                }
                
            elif metric == "projects":
                stats = self.db.query(
                    func.count(Project.id).label("total_projects"),
                    func.count(func.distinct(Project.student_id)).label("students_with_projects")
                ).first()
                
                return {
                    "metric": "Projects",
                    "total_projects": stats.total_projects,
                    "students_with_projects": stats.students_with_projects,
                    "avg_per_student": round(stats.total_projects / max(stats.students_with_projects, 1), 2)
                }
                
            else:
                return {"error": f"Unknown metric: {metric}"}
                
        except Exception as e:
            return {"error": str(e)}

    def search_students(self, query: Optional[str] = None, branch: Optional[str] = None, 
                       semester: Optional[int] = None) -> Dict[str, Any]:
        """Search for students by various criteria."""
        try:
            filters = []
            
            if query:
                filters.append(
                    (Student.full_name.ilike(f"%{query}%")) | 
                    (Student.enrollment_number.ilike(f"%{query}%"))
                )
            if branch:
                filters.append(Student.branch.ilike(f"%{branch}%"))
            if semester:
                filters.append(Student.semester == semester)
            
            students = self.db.query(Student).filter(and_(*filters) if filters else True).limit(10).all()
            
            return {
                "count": len(students),
                "students": [
                    {
                        "id": s.id,
                        "name": s.full_name,
                        "email": s.email,
                        "enrollment": s.enrollment_number,
                        "branch": s.branch,
                        "semester": s.semester
                    }
                    for s in students
                ]
            }
        except Exception as e:
            return {"error": str(e)}

    def execute_function(self, function_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a function call from the AI."""
        function_map = {
            "get_domain_scores": self.get_domain_scores,
            "get_shap_explanation": self.get_shap_explanation,
            "get_student_profile": self.get_student_profile,
            "find_students_by_domain": self.find_students_by_domain,
            "get_performance_stats": self.get_performance_stats,
            "search_students": self.search_students
        }
        
        func = function_map.get(function_name)
        if not func:
            return {"error": f"Unknown function: {function_name}"}
        
        try:
            return func(**arguments)
        except Exception as e:
            return {"error": f"Function execution error: {str(e)}"}

    async def chat(self, message: str, conversation_history: List[Dict[str, str]], 
                   role: str, user_id: int) -> str:
        """
        Main chat function that processes user message and returns AI response.
        
        Args:
            message: User's message
            conversation_history: List of previous messages [{"role": "user"/"assistant", "content": "..."}]
            role: "student" or "mentor"
            user_id: ID of the user (student_id or mentor_id)
        
        Returns:
            AI assistant's response
        """
        try:
            # Build messages for API
            messages = [
                {"role": "system", "content": self.get_system_prompt(role, user_id)}
            ]
            
            # Add conversation history
            messages.extend(conversation_history)
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            # Get function definitions
            tools = [
                {
                    "type": "function",
                    "function": func_def
                }
                for func_def in self.get_function_definitions(role)
            ]
            
            # Call Groq API
            print(f"[CHATBOT] Calling Groq API for {role} user {user_id}")
            print(f"[CHATBOT] Message: {message}")
            print(f"[CHATBOT] Available tools: {len(tools)}")
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                tools=tools,
                tool_choice="auto",
                max_tokens=1000,
                temperature=0.7
            )
            
            assistant_message = response.choices[0].message
            print(f"[CHATBOT] Got response, tool_calls: {assistant_message.tool_calls}")
            
            # Check if AI wants to call functions
            if assistant_message.tool_calls:
                print(f"[CHATBOT] AI wants to call {len(assistant_message.tool_calls)} functions")
                # Execute function calls
                messages.append(assistant_message)
                
                for tool_call in assistant_message.tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    print(f"[CHATBOT] Calling function: {function_name}({function_args})")
                    
                    # Execute the function
                    function_result = self.execute_function(function_name, function_args)
                    
                    print(f"[CHATBOT] Function result: {function_result}")
                    
                    # Add function result to messages
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(function_result)
                    })
                
                # Get final response from AI with function results
                final_response = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    max_tokens=1000,
                    temperature=0.7
                )
                
                return final_response.choices[0].message.content
            else:
                print("[CHATBOT] No function calls, returning direct response")
                # Direct response without function calls
                return assistant_message.content
                
        except Exception as e:
            return f"I'm having trouble processing that request. Error: {str(e)}"
