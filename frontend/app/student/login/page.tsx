"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    enrollment_number: "",
    semester: "",
    branch: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateEmail = (email: string): boolean => {
    // For students, email must match format: 23104xxx@apsit.edu.in where xxx are 3 digits
    const studentEmailRegex = /^23104\d{3}@apsit\.edu\.in$/;
    return studentEmailRegex.test(email);
  };

  const handleTabSwitch = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setRegistrationSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate email format for students (registration and login)
    if (!validateEmail(form.email)) {
      setError("Email must be in format: 23104xxx@apsit.edu.in (where xxx are 3 digits)");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Login
        await login({
          username: form.email,
          password: form.password,
        });
        // Only redirect to dashboard after login
        router.push("/student/dashboard");
      } else {
        // Register
        await register({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          user_type: "student",
          enrollment_number: form.enrollment_number,
          semester: parseInt(form.semester),
          branch: form.branch,
        });
        // Show success message instead of redirecting
        setRegistrationSuccess(true);
        // Clear form
        setForm({
          full_name: "",
          email: "",
          password: "",
          enrollment_number: "",
          semester: "",
          branch: "",
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #f5f0ff 0%, #fde8f0 50%, #e8f8f2 100%)",
        fontFamily: "var(--font-poppins)",
      }}
    >
      {/* Background blobs */}
      <div className="fixed top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "#c4b5fd" }} />
      <div className="fixed bottom-[-60px] right-[-60px] w-72 h-72 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "#86efac" }} />

      {/* Main card */}
      <div
        className="w-full max-w-4xl rounded-3xl overflow-hidden flex"
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(30px)",
          border: "1.5px solid rgba(255,255,255,0.9)",
          boxShadow: "0 20px 60px rgba(167,139,250,0.2), 0 4px 20px rgba(0,0,0,0.08)",
          minHeight: "580px",
        }}
      >
        {/* Left — Form */}
        <div className="flex-1 p-10 flex flex-col justify-center">

          {/* Back link */}
          <Link href="/" className="text-xs mb-8 flex items-center gap-1"
            style={{ color: "#a78bfa" }}>
            ← Back to home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
              style={{ background: "linear-gradient(135deg, #a78bfa, #34d399)" }}>
              🧬
            </div>
            <span className="font-bold text-lg" style={{ color: "#6d28d9" }}>
              DomainDNA
            </span>
          </div>

          {/* Toggle */}
          <div className="flex gap-1 mb-8 p-1 rounded-2xl w-fit"
            style={{ background: "rgba(167,139,250,0.1)" }}>
            <button
              onClick={() => handleTabSwitch(true)}
              className="px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300"
              style={{
                background: isLogin ? "white" : "transparent",
                color: isLogin ? "#6d28d9" : "#9ca3af",
                boxShadow: isLogin ? "0 2px 8px rgba(167,139,250,0.2)" : "none",
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabSwitch(false)}
              className="px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300"
              style={{
                background: !isLogin ? "white" : "transparent",
                color: !isLogin ? "#6d28d9" : "#9ca3af",
                boxShadow: !isLogin ? "0 2px 8px rgba(167,139,250,0.2)" : "none",
              }}
            >
              Register
            </button>
          </div>

          <h1 className="text-3xl font-bold mb-2" style={{ color: "#1f1f1f" }}>
            {isLogin ? "Welcome back! 👋" : "Create account ✨"}
          </h1>
          <p className="text-sm mb-8" style={{ color: "#9ca3af" }}>
            {isLogin
              ? "Sign in to view your domain insights"
              : "Join DomainDNA and discover your path"}
          </p>

          {/* Registration Success Message */}
          {registrationSuccess && (
            <div className="mb-6 p-4 rounded-xl border-2 border-green-200 bg-green-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <h3 className="font-semibold text-green-800">Registration Successful! 🎉</h3>
              </div>
              <p className="text-green-700 text-sm mb-3">
                Your account has been created successfully. You can now sign in with your credentials.
              </p>
              <button
                onClick={() => handleTabSwitch(true)}
                className="text-sm font-semibold px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Go to Sign In →
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Register only fields */}
            {!isLogin && (
              <>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>
                    Full Name
                  </label>
                  <input
                    name="full_name"
                    type="text"
                    placeholder="Rohit Sharma"
                    value={form.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.8)",
                      border: "1.5px solid rgba(167,139,250,0.2)",
                      color: "#1f1f1f",
                      fontFamily: "var(--font-poppins)",
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>
                      Roll Number
                    </label>
                    <input
                      name="enrollment_number"
                      type="text"
                      placeholder="EN2024001"
                      value={form.enrollment_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        background: "rgba(255,255,255,0.8)",
                        border: "1.5px solid rgba(167,139,250,0.2)",
                        color: "#1f1f1f",
                        fontFamily: "var(--font-poppins)",
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>
                      Semester
                    </label>
                    <select
                      name="semester"
                      value={form.semester}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        background: "rgba(255,255,255,0.8)",
                        border: "1.5px solid rgba(167,139,250,0.2)",
                        color: "#1f1f1f",
                        fontFamily: "var(--font-poppins)",
                      }}
                    >
                      <option value="">Select</option>
                      {[1,2,3,4,5,6,7,8].map(s => (
                        <option key={s} value={s}>Sem {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>
                    Branch
                  </label>
                  <input
                    name="branch"
                    type="text"
                    placeholder="Computer Science"
                    value={form.branch}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.8)",
                      border: "1.5px solid rgba(167,139,250,0.2)",
                      color: "#1f1f1f",
                      fontFamily: "var(--font-poppins)",
                    }}
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6b7280" }}>
                Email Address {!isLogin && <span style={{ color: "#7c3aed" }}>(Format: 23104xxx@apsit.edu.in)</span>}
              </label>
              <input
                name="email"
                type="email"
                placeholder={isLogin ? "23104xxx@apsit.edu.in" : "23104123@apsit.edu.in"}
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: "1.5px solid rgba(167,139,250,0.2)",
                  color: "#1f1f1f",
                  fontFamily: "var(--font-poppins)",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium" style={{ color: "#6b7280" }}>
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => alert("Forgot password functionality will be implemented soon.")}
                    className="text-xs font-medium hover:underline"
                    style={{ color: "#7c3aed" }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  border: "1.5px solid rgba(167,139,250,0.2)",
                  color: "#1f1f1f",
                  fontFamily: "var(--font-poppins)",
                }}
              />
            </div>

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
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white mt-2 transition-all duration-300 hover:opacity-90 hover:shadow-lg"
              style={{
                background: loading ? "#9ca3af" : "linear-gradient(135deg, #a78bfa, #7c3aed)",
                boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
                fontFamily: "var(--font-poppins)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Please wait..." : (isLogin ? "Sign In →" : "Create Account →")}
            </button>

          </form>

          <p className="text-xs text-center mt-6" style={{ color: "#9ca3af" }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => handleTabSwitch(!isLogin)}
              className="font-semibold"
              style={{ color: "#7c3aed" }}
            >
              {isLogin ? "Register" : "Sign In"}
            </button>
          </p>

        </div>

         {/* Right — Illustration */}
        <div
          className="hidden sm:block flex-1 relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #ede9fe, #fce7f3, #e0f2fe)",
          }}
        >
          <Image
            src="/images/student_login.png"
            alt="Student Login"
            fill
            className="object-cover"
          />

        
        </div>

      </div>
    </main>
  );
}