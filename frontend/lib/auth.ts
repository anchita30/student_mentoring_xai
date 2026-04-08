import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Types ──────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  full_name: string;
  user_type: "student" | "mentor";
  is_active: boolean;
  student_id?: number;
  branch?: string;
  department?: string;  // For mentors
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  user_type: "student" | "mentor";
  // Student-specific fields
  enrollment_number?: string;
  semester?: number;
  branch?: string;
}

export interface LoginData {
  username: string; // email
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Auth API Functions ─────────────────────────────────────────
export const authService = {
  // Register new user
  register: async (data: RegisterData): Promise<User> => {
    const response = await authAPI.post("/auth/register", data);
    return response.data;
  },

  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append("username", data.username);
    formData.append("password", data.password);

    const response = await authAPI.post("/auth/token", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Store token
    localStorage.setItem("access_token", response.data.access_token);

    return response.data;
  },

  // Get current user info
  getCurrentUser: async (): Promise<User> => {
    const response = await authAPI.get("/auth/me");
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem("access_token");
  },

  // Check if user is logged in
  isLoggedIn: (): boolean => {
    return !!localStorage.getItem("access_token");
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem("access_token");
  },
};

export default authService;