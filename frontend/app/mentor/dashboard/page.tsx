"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { generateStudentPDF } from "@/lib/generatePDF";
import { studentAPI, predictionAPI } from "@/lib/api";
import type { SHAPExplanation } from "@/lib/api";

const MOCK_STUDENTS = [
  {
    id: 1, name: "Rohit Sharma", roll: "EN2024001", semester: 5, branch: "CS",
    status: "pending",
    scores: {
      machine_learning: 74, web_development: 61, data_engineering: 58,
      cybersecurity: 45, cloud_computing: 40, mobile_development: 35
    },
    shap: [
      { feature: "Math Comfort", contribution: 2.68 },
      { feature: "Avg Course Completion", contribution: 3.5 },
      { feature: "Num Projects", contribution: 1.98 },
      { feature: "Programming Comfort", contribution: 1.75 },
      { feature: "Attendance", contribution: -2.03 },
      { feature: "Weekly Hours", contribution: 1.2 },
    ],
    marks: { internet_programming: 88, network_security: 72, entrepreneurship: 65, software_engineering: 80 },
    gpa: 8.5,
    projects: 3,
    certificates: 2,
  },
  {
    id: 2, name: "Priya Patel", roll: "EN2024002", semester: 5, branch: "CS",
    status: "reviewed",
    scores: {
      web_development: 78, machine_learning: 55, mobile_development: 60,
      cybersecurity: 40, cloud_computing: 45, data_engineering: 50
    },
    shap: [
      { feature: "Programming Comfort", contribution: 3.1 },
      { feature: "Num Projects", contribution: 2.4 },
      { feature: "Math Comfort", contribution: -1.2 },
      { feature: "Weekly Hours", contribution: 1.8 },
      { feature: "Hackathons", contribution: 1.5 },
      { feature: "Attendance", contribution: 0.9 },
    ],
    marks: { internet_programming: 92, network_security: 68, entrepreneurship: 70, software_engineering: 85 },
    gpa: 8.9,
    projects: 4,
    certificates: 3,
  },
  {
    id: 3, name: "Arjun Singh", roll: "EN2024003", semester: 5, branch: "CS",
    status: "pending",
    scores: {
      cybersecurity: 81, cloud_computing: 65, machine_learning: 50,
      web_development: 45, data_engineering: 55, mobile_development: 38
    },
    shap: [
      { feature: "Problem Solving", contribution: 3.8 },
      { feature: "Programming Comfort", contribution: 2.9 },
      { feature: "Num Projects", contribution: 2.1 },
      { feature: "Math Comfort", contribution: 1.6 },
      { feature: "Attendance", contribution: -1.4 },
      { feature: "Weekly Hours", contribution: 0.8 },
    ],
    marks: { internet_programming: 75, network_security: 90, entrepreneurship: 60, software_engineering: 78 },
    gpa: 8.2,
    projects: 2,
    certificates: 1,
  },
  {
    id: 4, name: "Sneha Kulkarni", roll: "EN2024004", semester: 5, branch: "CS",
    status: "reviewed",
    scores: {
      data_engineering: 76, machine_learning: 68, cloud_computing: 58,
      web_development: 50, cybersecurity: 42, mobile_development: 45
    },
    shap: [
      { feature: "Math Comfort", contribution: 3.2 },
      { feature: "Avg Course Completion", contribution: 2.8 },
      { feature: "Programming Comfort", contribution: 2.1 },
      { feature: "Weekly Hours", contribution: 1.9 },
      { feature: "Attendance", contribution: 1.4 },
      { feature: "Hackathons", contribution: -0.8 },
    ],
    marks: { internet_programming: 82, network_security: 78, entrepreneurship: 72, software_engineering: 88 },
    gpa: 9.1,
    projects: 5,
    certificates: 4,
  },
];

const DOMAIN_COLORS: Record<string, string> = {
  machine_learning: "#a78bfa",
  web_development: "#34d399",
  cybersecurity: "#f472b6",
  data_engineering: "#60a5fa",
  cloud_computing: "#fb923c",
  mobile_development: "#fbbf24",
};

const DOMAIN_LABELS: Record<string, string> = {
  machine_learning: "Machine Learning",
  web_development: "Web Development",
  cybersecurity: "Cybersecurity",
  data_engineering: "Data Engineering",
  cloud_computing: "Cloud Computing",
  mobile_development: "Mobile Dev",
};

export default function MentorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("students");
  const [selectedStudent, setSelectedStudent] = useState<typeof MOCK_STUDENTS[0] | null>(null);
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<typeof MOCK_STUDENTS>([]); // Start with empty array
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [feedback, setFeedback] = useState({
    attendance: "", participation: "", lab_performance: "",
    assignment_consistency: "", suggested_domain: "",
    recommended_courses: "", recommended_projects: "", remarks: ""
  });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [shapData, setShapData] = useState<SHAPExplanation[] | null>(null);
  const [loadingShap, setLoadingShap] = useState(false);
  const [globalImportance, setGlobalImportance] = useState<Array<{feature: string, importance: number}>>([]);
  const [loadingGlobalImportance, setLoadingGlobalImportance] = useState(false);

  // Check if user is mentor, redirect if not
  useEffect(() => {
    if (user && user.user_type !== "mentor") {
      router.push("/student/dashboard");
    }
  }, [user, router]);

  // Fetch real students from API
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const studentsData = await studentAPI.getAll();

      // Transform API data to match expected format
      const transformedStudents = await Promise.all(
        studentsData.map(async (student: any) => {
          // Get scores from predictions
          let scores = {
            machine_learning: 0, web_development: 0, cybersecurity: 0,
            data_engineering: 0, cloud_computing: 0, mobile_development: 0
          };

          try {
            const predictionResult = await predictionAPI.predict(student.id);
            if (predictionResult.scores) {
              scores = {
                machine_learning: predictionResult.scores.machine_learning || 0,
                web_development: predictionResult.scores.web_development || 0,
                cybersecurity: predictionResult.scores.cybersecurity || 0,
                data_engineering: predictionResult.scores.data_engineering || 0,
                cloud_computing: predictionResult.scores.cloud_computing || 0,
                mobile_development: predictionResult.scores.mobile_development || 0,
              };
            }
          } catch (error) {
            console.log("No predictions yet for student", student.id);
          }

          // Get academic data
          let academicData = { gpa: 0, projects: 0, certificates: 0, marks: {}, hasData: false };
          try {
            const [academicRecords, projects, courses] = await Promise.all([
              studentAPI.getAcademicRecords(student.id),
              studentAPI.getProjects(student.id),
              studentAPI.getCourses(student.id)
            ]);

            const hasAcademicData = academicRecords && academicRecords.length > 0;
            const hasProjectData = projects && projects.length > 0;
            const hasCourseData = courses && courses.length > 0;

            academicData = {
              gpa: hasAcademicData ? (academicRecords[0]?.gpa || 0) : 0,
              projects: projects?.length || 0,
              certificates: courses?.length || 0,
              marks: hasAcademicData ? academicRecords.reduce((acc: any, record: any) => {
                acc[record.subject_name.toLowerCase().replace(/\s+/g, '_')] =
                  Math.round((record.marks_obtained / record.total_marks) * 100);
                return acc;
              }, {}) : {},
              hasData: hasAcademicData || hasProjectData || hasCourseData
            };
          } catch (error) {
            console.log("No academic data yet for student", student.id);
          }

          // Check if student has mentor feedback to determine status
          let hasReview = false;
          try {
            const feedback = await studentAPI.getFeedback(student.id);
            hasReview = feedback && feedback.length > 0;
          } catch (error) {
            console.log("No feedback yet for student", student.id);
          }

          return {
            id: student.id,
            name: student.full_name,
            roll: student.enrollment_number,
            semester: student.semester,
            branch: student.branch,
            status: hasReview ? "reviewed" : "pending",  // Set status based on actual feedback
            scores: academicData.hasData ? scores : {},  // Only show scores if student has entered data
            shap: [], // Will be fetched when student is selected
            marks: academicData.marks,
            gpa: academicData.gpa,
            projects: academicData.projects,
            certificates: academicData.certificates,
            hasData: academicData.hasData,
          };
        })
      );

      setStudents(transformedStudents);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      // Don't use mock data - just keep empty array
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll.toLowerCase().includes(search.toLowerCase())
  );

  const topDomain = (student: typeof students[0]) => {
    if (!student.scores || Object.keys(student.scores).length === 0) {
      return ["unknown", 0]; // Return default if no scores
    }
    const entries = Object.entries(student.scores);
    if (entries.length === 0) {
      return ["unknown", 0];
    }
    return entries.sort((a, b) => b[1] - a[1])[0];
  };

  // Only include students with actual data entered
  const studentsWithData = students.filter(s =>
    s.hasData && (s.projects > 0 || s.certificates > 0 || Object.keys(s.marks).length > 0)
  );

  const analyticsData = Object.keys(DOMAIN_LABELS).map(domain => ({
    domain: DOMAIN_LABELS[domain].split(" ")[0],
    count: studentsWithData.filter(s => {
      const topDomainData = topDomain(s);
      return topDomainData && topDomainData[0] === domain;
    }).length,
    color: DOMAIN_COLORS[domain],
  }));

  const handleSendFeedback = async () => {
    if (!selectedStudent || feedbackSent) return; // Prevent duplicate submission

    setFeedbackSent(true); // Set immediately to prevent double clicks

    try {
      const feedbackData = {
        mentor_name: user?.full_name || "Mentor",
        // Numerical ratings for ML model
        attendance_percentage: feedback.attendance ? parseFloat(feedback.attendance) : null,
        participation_rating: feedback.participation ? parseFloat(feedback.participation) : null,
        lab_performance_rating: feedback.lab_performance ? parseFloat(feedback.lab_performance) : null,
        assignment_consistency: feedback.assignment_consistency ? parseFloat(feedback.assignment_consistency) : null,
        // Recommendations
        recommended_domain: feedback.suggested_domain,
        recommended_courses: feedback.recommended_courses,
        recommended_projects: feedback.recommended_projects,
        skill_improvements: feedback.lab_performance,
        general_notes: feedback.remarks
      };

      await studentAPI.addFeedback(selectedStudent.id, feedbackData);

      setTimeout(() => setFeedbackSent(false), 3000);

      // Update student status to reviewed
      setStudents(students.map(s =>
        s.id === selectedStudent.id ? { ...s, status: "reviewed" } : s
      ));
      setSelectedStudent({ ...selectedStudent, status: "reviewed" });

      // Refresh the students list to ensure data is up to date
      await fetchStudents();

    } catch (error) {
      console.error("Failed to send feedback:", error);
      setFeedbackSent(false); // Reset loading state on error
    }
  };

  const handleDownloadPDF = () => {
    if (selectedStudent) {
      generateStudentPDF(selectedStudent, feedback, user?.full_name || "Mentor");
    }
  };

  // Fetch real SHAP data when student is selected
  useEffect(() => {
    if (selectedStudent) {
      fetchShapData(selectedStudent.id);
    }
  }, [selectedStudent]);

  // Fetch global feature importance when analytics tab is opened
  useEffect(() => {
    if (activeTab === "analytics" && globalImportance.length === 0) {
      fetchGlobalImportance();
    }
  }, [activeTab]);

  const fetchShapData = async (studentId: number) => {
    setLoadingShap(true);
    try {
      const result = await predictionAPI.explainPrediction(studentId);
      setShapData(result.explanations);
    } catch (error) {
      console.error("Failed to fetch SHAP data:", error);
      // Fallback to mock data if API fails
      setShapData(null);
    } finally {
      setLoadingShap(false);
    }
  };

  const fetchGlobalImportance = async () => {
    setLoadingGlobalImportance(true);
    try {
      const result = await predictionAPI.getGlobalImportance();
      setGlobalImportance(result.slice(0, 10)); // Top 10 features
    } catch (error) {
      console.error("Failed to fetch global importance:", error);
    } finally {
      setLoadingGlobalImportance(false);
    }
  };

  const glass = "rgba(255,255,255,0.5)";

  const inputStyle = {
    background: "rgba(255,255,255,0.6)",
    border: "1.5px solid rgba(52,211,153,0.25)",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    outline: "none",
    width: "100%",
    fontFamily: "var(--font-architects)",
    color: "#1f1f1f",
  };

  const labelStyle = {
    fontSize: "12px",
    fontWeight: "500" as const,
    color: "#6b7280",
    marginBottom: "6px",
    display: "block" as const,
    fontFamily: "var(--font-architects)",
  };

  return (
    <div className="min-h-screen" style={{
      background: "linear-gradient(135deg, #f5f0ff 0%, #fde8f0 25%, #e8f8f2 50%, #deeeff 100%)",
      fontFamily: "var(--font-architects)",
    }}>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity:0; transform:translateY(16px); }
          to { opacity:1; transform:translateY(0); }
        }
        @keyframes floatBob {
          0%,100% { transform:translateY(0px); }
          50% { transform:translateY(-6px); }
        }
        .fade-in { animation: fadeSlideIn 0.5s ease-out forwards; }
        .float-bob { animation: floatBob 3s ease-in-out infinite; }
        .glass-card {
          background: rgba(255,255,255,0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1.5px solid rgba(255,255,255,0.7);
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255,255,255,0.65);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(52,211,153,0.15);
        }
        .student-card {
          background: rgba(255,255,255,0.5);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(255,255,255,0.7);
          border-radius: 20px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .student-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(52,211,153,0.2);
          border-color: rgba(52,211,153,0.4);
        }
        .save-btn { transition: all 0.3s ease; }
        .save-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(5,150,105,0.4) !important;
        }
      `}</style>

      {/* Background blobs */}
      <div className="fixed top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "#6ee7b7" }} />
      <div className="fixed bottom-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "#93c5fd" }} />

      {/* ── Top Navbar ── */}
      <nav className="sticky top-0 z-50 px-8 py-4 flex items-center justify-between"
        style={{
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(20px)",
          borderBottom: "1.5px solid rgba(255,255,255,0.7)",
        }}>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center float-bob"
            style={{ background: "linear-gradient(135deg, #34d399, #059669)", boxShadow: "0 4px 15px rgba(52,211,153,0.4)" }}>
            🧬
          </div>
          <span className="font-bold text-lg" style={{ color: "#059669" }}>DomainDNA</span>
          <span className="px-2 py-0.5 rounded-full text-xs ml-2"
            style={{ background: "rgba(52,211,153,0.15)", color: "#059669", border: "1px solid rgba(52,211,153,0.3)" }}>
            Mentor
          </span>
        </div>

        {/* Nav tabs */}
        <div className="flex gap-1 p-1 rounded-2xl"
          style={{ background: "rgba(52,211,153,0.1)" }}>
          {[
            { id: "students", label: "👥 Students" },
            { id: "analytics", label: "📊 Analytics" },
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedStudent(null); }}
              className="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300"
              style={{
                background: activeTab === tab.id ? "white" : "transparent",
                color: activeTab === tab.id ? "#059669" : "#9ca3af",
                boxShadow: activeTab === tab.id ? "0 2px 8px rgba(52,211,153,0.2)" : "none",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
            style={{ background: "rgba(52,211,153,0.1)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #34d399, #059669)" }}>
              {user?.full_name?.[0]?.toUpperCase() || "M"}
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#065f46" }}>
                {user?.full_name || "Mentor"}
              </p>
              <p className="text-xs" style={{ color: "#9ca3af" }}>Mentor • CS</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="text-xs px-3 py-2 rounded-xl transition-all"
            style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}
          >
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="p-8">

        {/* ── STUDENTS TAB ── */}
        {activeTab === "students" && !selectedStudent && (
          <div className="fade-in">

            {/* Welcome banner */}
            <div className="rounded-3xl p-8 mb-8 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #059669, #34d399, #0284c7)",
                minHeight: "180px",
                boxShadow: "0 20px 60px rgba(5,150,105,0.35)",
              }}>
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-40 w-32 h-32 rounded-full" style={{ background: "white" }} />
                <div className="absolute bottom-4 left-60 w-20 h-20 rounded-full" style={{ background: "white" }} />
              </div>
              <div className="relative z-10 max-w-lg">
                <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>Good morning 👋</p>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Hello, {user?.full_name?.split(' ')[0] || "Mentor"}!
                </h1>
                <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                  You have <strong className="text-white">{students.filter(s => s.status === "pending").length} students</strong> pending review
                </p>
              </div>
              <div className="absolute right-6 bottom-0 float-bob">
                <Image src="/images/mentor_banner.jpg" alt="Mentor"
                  width={220} height={175}
                  className="object-cover rounded-2xl"
                  style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }} />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Students", value: students.length, icon: "👥", color: "#34d399" },
                { label: "Reviewed", value: students.filter(s => s.status === "reviewed").length, icon: "✅", color: "#60a5fa" },
                { label: "Pending", value: students.filter(s => s.status === "pending").length, icon: "⏳", color: "#f472b6" },
                { label: "Avg GPA", value: students.length > 0 ? (students.reduce((a, s) => a + s.gpa, 0) / students.length).toFixed(1) : "0.0", icon: "📊", color: "#a78bfa" },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-5">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <p className="text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold" style={{ color: "#1f1f1f" }}>Your Students</h2>
              <div className="flex-1 max-w-sm">
                <input
                  placeholder="🔍 Search by name or roll number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    ...inputStyle,
                    background: "rgba(255,255,255,0.7)",
                  }}
                />
              </div>
            </div>

            {/* Student cards grid */}
            <div className="grid grid-cols-3 gap-5">
              {filteredStudents.map((student, i) => {
                const [topDomainKey, topScore] = topDomain(student);
                return (
                  <div key={student.id}
                    className="student-card p-6"
                    onClick={() => setSelectedStudent(student)}
                    style={{ animationDelay: `${i * 0.1}s` }}>

                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold"
                          style={{ background: "linear-gradient(135deg, #34d399, #059669)", boxShadow: "0 4px 10px rgba(52,211,153,0.3)" }}>
                          {student.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: "#1f1f1f" }}>{student.name}</p>
                          <p className="text-xs" style={{ color: "#9ca3af" }}>
                            {student.roll} • Sem {student.semester} • {student.branch}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: student.status === "reviewed" ? "rgba(52,211,153,0.15)" : "rgba(251,146,60,0.15)",
                          color: student.status === "reviewed" ? "#059669" : "#ea580c",
                          border: `1px solid ${student.status === "reviewed" ? "rgba(52,211,153,0.3)" : "rgba(251,146,60,0.3)"}`,
                        }}>
                        {student.status === "reviewed" ? "✓ Reviewed" : "⏳ Pending"}
                      </span>
                    </div>

                    {/* Top domain */}
                    <div className="rounded-2xl p-3 mb-4"
                      style={{
                        background: `${DOMAIN_COLORS[topDomainKey]}18`,
                        border: `1.5px solid ${DOMAIN_COLORS[topDomainKey]}33`,
                      }}>
                      <p className="text-xs mb-1" style={{ color: "#9ca3af" }}>Top domain</p>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm" style={{ color: DOMAIN_COLORS[topDomainKey] }}>
                          {DOMAIN_LABELS[topDomainKey]}
                        </p>
                        <span className="font-bold text-lg" style={{ color: DOMAIN_COLORS[topDomainKey] }}>
                          {topScore}%
                        </span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-2 h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${topScore}%`, background: DOMAIN_COLORS[topDomainKey] }} />
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex gap-2 mb-4">
                      {[
                        { label: "GPA", value: student.gpa },
                        { label: "Projects", value: student.projects },
                        { label: "Certs", value: student.certificates },
                      ].map((s, j) => (
                        <div key={j} className="flex-1 text-center py-2 rounded-xl"
                          style={{ background: "rgba(255,255,255,0.6)" }}>
                          <p className="font-bold text-sm" style={{ color: "#1f1f1f" }}>{s.value}</p>
                          <p className="text-xs" style={{ color: "#9ca3af" }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      className="save-btn w-full py-2.5 rounded-2xl text-sm font-semibold text-white"
                      style={{
                        background: "linear-gradient(135deg, #34d399, #059669)",
                        boxShadow: "0 4px 15px rgba(5,150,105,0.25)",
                      }}>
                      View Full Analysis →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STUDENT DETAIL VIEW ── */}
        {activeTab === "students" && selectedStudent && (
          <div className="fade-in">

            {/* Back button */}
            <button onClick={() => setSelectedStudent(null)}
              className="flex items-center gap-2 mb-6 text-sm font-medium transition-all hover:gap-3"
              style={{ color: "#059669" }}>
              ← Back to Students
            </button>

            {/* Student header */}
            <div className="glass-card p-6 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                  style={{ background: "linear-gradient(135deg, #34d399, #059669)", boxShadow: "0 4px 15px rgba(52,211,153,0.3)" }}>
                  {selectedStudent.name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#1f1f1f" }}>{selectedStudent.name}</h2>
                  <p className="text-sm" style={{ color: "#9ca3af" }}>
                    {selectedStudent.roll} • Sem {selectedStudent.semester} • {selectedStudent.branch}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    background: selectedStudent.status === "reviewed" ? "rgba(52,211,153,0.15)" : "rgba(251,146,60,0.15)",
                    color: selectedStudent.status === "reviewed" ? "#059669" : "#ea580c",
                  }}>
                  {selectedStudent.status === "reviewed" ? "✓ Reviewed" : "⏳ Pending Review"}
                </span>
                {/* PDF Download button */}
                <button
                  onClick={handleDownloadPDF}
                  className="save-btn px-4 py-2 rounded-2xl text-sm font-semibold text-white flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg, #60a5fa, #2563eb)", boxShadow: "0 4px 15px rgba(37,99,235,0.3)" }}>
                  📄 Download PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">

              {/* Domain scores */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-sm mb-4" style={{ color: "#1f1f1f" }}>
                  🎯 Domain Suitability Scores
                </h3>
                <div className="flex flex-col gap-3">
                  {Object.entries(selectedStudent.scores)
                    .sort((a, b) => b[1] - a[1])
                    .map(([domain, score]) => (
                      <div key={domain}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{ color: "#6b7280" }}>{DOMAIN_LABELS[domain]}</span>
                          <span className="text-xs font-bold" style={{ color: DOMAIN_COLORS[domain] }}>{score}%</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${score}%`, background: DOMAIN_COLORS[domain] }} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* SHAP XAI Chart */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-sm mb-1" style={{ color: "#1f1f1f" }}>
                  🧠 SHAP — Why This Domain?
                </h3>
                <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>
                  Feature contributions to top domain score {loadingShap && "(Loading...)"}
                </p>
                {!loadingShap ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={shapData || selectedStudent.shap}
                      layout="vertical"
                      margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="feature" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip
                        formatter={(value: unknown) => {
                          const v = Number(value);
                          return [v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2), "Contribution"];
                        }}
                        contentStyle={{ borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)" }}
                      />
                      <Bar dataKey="contribution" radius={[0, 6, 6, 0]} fill="#34d399" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[200px]">
                    <p className="text-sm text-gray-400">Loading explanations...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Academic data */}
            <div className="glass-card p-6 mb-6">
              <h3 className="font-bold text-sm mb-4" style={{ color: "#1f1f1f" }}>📚 Academic Performance</h3>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(selectedStudent.marks).map(([subject, mark]) => (
                  <div key={subject} className="rounded-2xl p-3 text-center"
                    style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
                    <p className="text-xl font-bold mb-1" style={{ color: "#059669" }}>{mark}</p>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      {subject.replace(/_/g, " ").split(" ").slice(0, 2).join(" ")}
                    </p>
                  </div>
                ))}
                <div className="rounded-2xl p-3 text-center"
                  style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
                  <p className="text-xl font-bold mb-1" style={{ color: "#7c3aed" }}>{selectedStudent.gpa}</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>GPA</p>
                </div>
              </div>
            </div>

            {/* Mentor Feedback Form */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-sm mb-1" style={{ color: "#1f1f1f" }}>✍️ Mentor Feedback</h3>
              <p className="text-xs mb-6" style={{ color: "#9ca3af" }}>
                Add your observations and recommendations for this student
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: "Attendance %", key: "attendance", placeholder: "e.g. 85", min: 0, max: 100 },
                  { label: "Participation Rating (1-10)", key: "participation", placeholder: "e.g. 8", min: 1, max: 10 },
                  { label: "Lab Performance (1-10)", key: "lab_performance", placeholder: "e.g. 7", min: 1, max: 10 },
                  { label: "Assignment Consistency (1-10)", key: "assignment_consistency", placeholder: "e.g. 9", min: 1, max: 10 },
                ].map((field) => (
                  <div key={field.key}>
                    <label style={labelStyle}>{field.label}</label>
                    <input
                      type="number"
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      value={(feedback as any)[field.key]}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Validate on change
                        if (value === '' || (Number(value) >= field.min && Number(value) <= field.max)) {
                          setFeedback({ ...feedback, [field.key]: value });
                        }
                      }}
                      style={inputStyle} />
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label style={labelStyle}>Suggested Domain</label>
                <select value={feedback.suggested_domain}
                  onChange={(e) => setFeedback({ ...feedback, suggested_domain: e.target.value })}
                  style={inputStyle}>
                  <option value="">Select domain</option>
                  {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label style={labelStyle}>Recommended Courses</label>
                <textarea placeholder="e.g. SQL for Data Analysis, Pandas course on Coursera..."
                  value={feedback.recommended_courses}
                  onChange={(e) => setFeedback({ ...feedback, recommended_courses: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, resize: "none" as const }} />
              </div>

              <div className="mb-4">
                <label style={labelStyle}>Recommended Projects</label>
                <textarea placeholder="e.g. Build a data pipeline, Create an ETL project..."
                  value={feedback.recommended_projects}
                  onChange={(e) => setFeedback({ ...feedback, recommended_projects: e.target.value })}
                  rows={2}
                  style={{ ...inputStyle, resize: "none" as const }} />
              </div>

              <div className="mb-6">
                <label style={labelStyle}>Overall Remarks</label>
                <textarea placeholder="Write your overall assessment and guidance for this student..."
                  value={feedback.remarks}
                  onChange={(e) => setFeedback({ ...feedback, remarks: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: "none" as const }} />
              </div>

              {/* Show feedback button only when required fields are filled */}
              {feedback.attendance && feedback.participation && feedback.lab_performance && feedback.assignment_consistency ? (
                <button onClick={handleSendFeedback}
                  className="save-btn px-8 py-3 rounded-2xl text-white font-semibold text-sm"
                  style={{
                    background: "linear-gradient(135deg, #34d399, #059669)",
                    boxShadow: "0 4px 15px rgba(5,150,105,0.3)",
                  }}>
                  {feedbackSent ? "✓ Feedback Sent!" : "Send Feedback to Student →"}
                </button>
              ) : (
                <div className="text-center p-4 rounded-2xl" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
                  <p className="text-sm font-medium mb-2" style={{ color: "#ea580c" }}>
                    📝 Complete Assessment First
                  </p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    Fill in attendance %, participation rating, lab performance, and assignment consistency to send feedback
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === "analytics" && (
          <div className="fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#1f1f1f" }}>📊 Analytics Overview</h2>
              <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>
                Analytics available for {studentsWithData.length} students with submitted data
              </p>
            </div>

            {studentsWithData.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-6 mb-6">

              {/* Bar chart */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-sm mb-4" style={{ color: "#1f1f1f" }}>
                  Domain Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="domain" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", background: "rgba(255,255,255,0.9)" }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#34d399" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Domain breakdown cards */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-sm mb-4" style={{ color: "#1f1f1f" }}>
                  Students per Domain
                </h3>
                <div className="flex flex-col gap-3">
                  {Object.entries(DOMAIN_LABELS).map(([key, label]) => {
                    const count = students.filter(s => topDomain(s)[0] === key).length;
                    const pct = Math.round((count / students.length) * 100);
                    return (
                      <div key={key}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{ color: "#6b7280" }}>{label}</span>
                          <span className="text-xs font-bold" style={{ color: DOMAIN_COLORS[key] }}>
                            {count} student{count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: DOMAIN_COLORS[key] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* XAI Point 3: Global Feature Importance */}
            <div className="glass-card p-6 mb-6">
              <h3 className="font-bold text-sm mb-1" style={{ color: "#1f1f1f" }}>
                🧠 Global Feature Importance (XAI)
              </h3>
              <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>
                Which factors matter most for domain predictions across all students?
                {loadingGlobalImportance && " (Loading...)"}
              </p>
              {!loadingGlobalImportance && globalImportance.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-6">
                  {globalImportance.map((item, idx) => {
                    const maxImportance = globalImportance[0].importance;
                    const barWidth = (item.importance / maxImportance) * 100;
                    return (
                      <div key={idx} className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: "#6b7280" }}>
                            {idx + 1}. {item.feature}
                          </span>
                          <span className="text-xs font-bold" style={{ color: "#34d399" }}>
                            {(item.importance * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${barWidth}%`, background: "#34d399" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : loadingGlobalImportance ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-gray-400">Loading global insights...</p>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-gray-400">No data available. Start backend server to see insights.</p>
                </div>
              )}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
              {(studentsWithData.length > 0 ? [
                { label: "Most popular domain", value: analyticsData.length > 0 ? analyticsData.reduce((a, b) => a.count > b.count ? a : b).domain : "N/A", color: "#a78bfa", icon: "🤖" },
                { label: "Average class GPA", value: studentsWithData.length > 0 ? (studentsWithData.reduce((a, s) => a + (s.gpa || 0), 0) / studentsWithData.length).toFixed(2) : "0.00", color: "#34d399", icon: "📊" },
                { label: "Students with data", value: studentsWithData.length, color: "#f472b6", icon: "👥" },
              ] : [
                { label: "No data yet", value: "0", color: "#9ca3af", icon: "📊" },
                { label: "Waiting for students", value: "0", color: "#9ca3af", icon: "⏳" },
                { label: "Enter data first", value: "0", color: "#9ca3af", icon: "📝" },
              ]).map((item, i) => (
                <div key={i} className="glass-card p-5">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-2xl font-bold mb-1" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>{item.label}</p>
                </div>
              ))}
            </div>
              </>) : (
                <div className="glass-card p-8 text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: "#1f1f1f" }}>No Analytics Available</h3>
                  <p className="text-sm mb-4" style={{ color: "#9ca3af" }}>
                    Analytics will appear once students submit their data (marks, projects, skills, certificates)
                  </p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    Students need to fill out their profiles first
                  </p>
                </div>
              )}
          </div>
        )}

      </div>
    </div>
  );
}