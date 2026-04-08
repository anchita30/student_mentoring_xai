import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Types ──────────────────────────────────────────────────────
export interface Student {
  id?: number;
  full_name: string;
  email: string;
  enrollment_number: string;
  semester: number;
  branch: string;
}

export interface AcademicRecord {
  semester: number;
  subject_name: string;
  marks_obtained: number;
  total_marks: number;
  attendance_percentage: number;
  gpa?: number;
}

export interface Course {
  course_name: string;
  platform?: string;
  domain: string;
  completion_percentage: number;
  completion_days?: number;
  weekly_study_hours?: number;
}

export interface Project {
  title: string;
  domain: string;
  difficulty_level: number;
  technologies_used?: string;
  completion_days?: number;
  github_link?: string;
  is_team_project?: boolean;
}

export interface Skill {
  problem_solving_rating: number;
  programming_comfort: number;
  math_comfort: number;
  communication_rating: number;
  hackathons_participated: number;
  clubs_joined: number;
  competitions_participated: number;
}

export interface MentorFeedback {
  mentor_name: string;
  recommended_domain?: string;
  recommended_courses?: string;
  recommended_projects?: string;
  skill_improvements?: string;
  general_notes?: string;
}

export interface DomainScores {
  student_id: number;
  scores: {
    [key: string]: number;
  };
  top_domain: string;
  top_score: number;
}

export interface SHAPExplanation {
  feature: string;
  contribution: number;
  value: number;
}

export interface GlobalFeatureImportance {
  feature: string;
  importance: number;
}

export interface TextualExplanation {
  student_id: number;
  domain: string;
  score: number;
  explanation: string;
  confidence_level: string;
  top_factors: number;
  improvement_areas: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  conversation_history: ChatMessage[];
  user_role: "student" | "mentor";
  user_id: number;
}

export interface ChatResponse {
  response: string;
  success: boolean;
}

// ─── Student APIs ───────────────────────────────────────────────
export const studentAPI = {
  // Create new student
  create: async (student: Student) => {
    const response = await api.post("/students/", student);
    return response.data;
  },

  // Get all students
  getAll: async () => {
    const response = await api.get("/students/");
    return response.data;
  },

  // Get single student
  getById: async (studentId: number) => {
    const response = await api.get(`/students/${studentId}`);
    return response.data;
  },

  // Add academic record
  addAcademicRecord: async (studentId: number, record: AcademicRecord) => {
    const response = await api.post(`/students/${studentId}/academic`, record);
    return response.data;
  },

  // Get academic records
  getAcademicRecords: async (studentId: number) => {
    const response = await api.get(`/students/${studentId}/academic`);
    return response.data;
  },

  // Add course
  addCourse: async (studentId: number, course: Course) => {
    const response = await api.post(`/students/${studentId}/courses`, course);
    return response.data;
  },

  // Get courses
  getCourses: async (studentId: number) => {
    const response = await api.get(`/students/${studentId}/courses`);
    return response.data;
  },

  // Add project
  addProject: async (studentId: number, project: Project) => {
    const response = await api.post(`/students/${studentId}/projects`, project);
    return response.data;
  },

  // Get projects
  getProjects: async (studentId: number) => {
    const response = await api.get(`/students/${studentId}/projects`);
    return response.data;
  },

  // Add skill
  addSkill: async (studentId: number, skill: Skill) => {
    const response = await api.post(`/students/${studentId}/skills`, skill);
    return response.data;
  },

  // Get skills
  getSkills: async (studentId: number) => {
    const response = await api.get(`/students/${studentId}/skills`);
    return response.data;
  },

  // Add mentor feedback
  addFeedback: async (studentId: number, feedback: MentorFeedback) => {
    const response = await api.post(`/students/${studentId}/feedback`, feedback);
    return response.data;
  },

  // Get mentor feedback
  getFeedback: async (studentId: number) => {
    const response = await api.get(`/students/${studentId}/feedback`);
    return response.data;
  },
};

// ─── ML Prediction APIs ─────────────────────────────────────────
export const predictionAPI = {
  // Generate domain predictions for a student
  predict: async (studentId: number): Promise<DomainScores> => {
    const response = await api.post("/predict/", { student_id: studentId });
    return response.data;
  },

  // Get SHAP explanation for a student
  explainPrediction: async (
    studentId: number,
    domain?: string
  ): Promise<{ student_id: number; domain: string; explanations: SHAPExplanation[] }> => {
    const url = domain
      ? `/predict/${studentId}/explain?domain=${domain}`
      : `/predict/${studentId}/explain`;
    const response = await api.get(url);
    return response.data;
  },

  // Get global feature importance
  getGlobalImportance: async (): Promise<GlobalFeatureImportance[]> => {
    const response = await api.get("/predict/global-importance");
    return response.data;
  },

  // Get textual explanation for a student's prediction
  explainTextual: async (
    studentId: number,
    domain?: string
  ): Promise<TextualExplanation> => {
    const url = domain
      ? `/predict/${studentId}/explain-text?domain=${domain}`
      : `/predict/${studentId}/explain-text`;
    const response = await api.get(url);
    return response.data;
  },
};

// ─── Chatbot APIs ───────────────────────────────────────────────
export const chatAPI = {
  // Send message to chatbot
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post("/api/chat", request);
    return response.data;
  },

  // Check chatbot health
  checkHealth: async () => {
    const response = await api.get("/api/chat/health");
    return response.data;
  },
};

export default api;
