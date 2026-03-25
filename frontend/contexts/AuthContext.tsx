"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User, LoginData, RegisterData } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isStudent: () => boolean;
  isMentor: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isLoggedIn()) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token might be expired, logout
          authService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (data: LoginData) => {
    const authResponse = await authService.login(data);
    setUser(authResponse.user);
  };

  const register = async (data: RegisterData) => {
    const newUser = await authService.register(data);
    // Just register, don't auto-login
    return newUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isStudent = () => user?.user_type === "student";
  const isMentor = () => user?.user_type === "mentor";

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isStudent,
    isMentor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}