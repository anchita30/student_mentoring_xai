"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface AuthPageProps {
  userType: "student" | "mentor";
}

export default function AuthPage({ userType }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    enrollment_number: "",
    semester: "",
    branch: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login
        await login({
          username: formData.email,
          password: formData.password,
        });
      } else {
        // Register
        const registerData = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          user_type: userType,
        };

        // Add student-specific fields if registering as student
        if (userType === "student") {
          Object.assign(registerData, {
            enrollment_number: formData.enrollment_number,
            semester: parseInt(formData.semester),
            branch: formData.branch,
          });
        }

        await register(registerData);
      }

      // Redirect based on user type
      if (userType === "student") {
        router.push("/student/dashboard");
      } else {
        router.push("/mentor/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const gradientClass = userType === "student"
    ? "bg-gradient-to-br from-purple-50 via-pink-50 to-green-50"
    : "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50";

  const accentColor = userType === "student" ? "#a78bfa" : "#34d399";

  return (
    <div className={`min-h-screen flex items-center justify-center ${gradientClass}`}>

      {/* Background blobs */}
      <div className="fixed top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: accentColor }} />
      <div className="fixed bottom-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: accentColor }} />

      <div className="max-w-md w-full space-y-8 p-8">

        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-800 transition-colors">
            ← Back to home
          </Link>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)` }}>
              {userType === "student" ? "🧬" : "👩‍🏫"}
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              {userType === "student" ? "Student" : "Mentor"} {isLogin ? "Login" : "Sign Up"}
            </h2>
          </div>

          <p className="text-gray-600">
            {isLogin ? "Welcome back!" : `Create your ${userType} account to get started`}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name (Register only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your full name"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your password"
            />
          </div>

          {/* Student-specific fields (Register only) */}
          {!isLogin && userType === "student" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.enrollment_number}
                  onChange={(e) => setFormData({ ...formData, enrollment_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. EN2024001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    required
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch
                  </label>
                  <select
                    required
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select</option>
                    <option value="CS">Computer Science</option>
                    <option value="IT">Information Technology</option>
                    <option value="ECE">Electronics & Communication</option>
                    <option value="ME">Mechanical Engineering</option>
                    <option value="CE">Civil Engineering</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Error message */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg text-white font-medium transition-all"
            style={{
              background: loading ? "#9ca3af" : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
          </button>

          {/* Toggle between login/register */}
          <div className="text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium hover:underline"
                style={{ color: accentColor }}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}