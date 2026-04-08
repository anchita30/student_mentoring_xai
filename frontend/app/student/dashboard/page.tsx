"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { studentAPI, predictionAPI } from "@/lib/api";
import type { AcademicRecord, Course, Project, Skill } from "@/lib/api";
import SuccessAnimation from "@/components/SuccessAnimation";
import ChatBot from "@/components/ChatBot";
import { useAuth } from "@/contexts/AuthContext";

const SUBJECTS = [
  { name: "Internet Programming", key: "internet_programming" },
  { name: "Computer Network Security", key: "network_security" },
  { name: "Entrepreneurship & E-Business", key: "entrepreneurship" },
  { name: "Software Engineering", key: "software_engineering" },
];

const ELECTIVES = [
  { name: "Advanced Data Structures & Analysis", key: "adsa" },
  { name: "Advanced Database Management", key: "adbms" },
];

const DOMAINS = [
  "Web Development", "Machine Learning", "Cybersecurity",
  "Data Engineering", "Cloud Computing", "Mobile Development"
];

const NAV_ITEMS = [
  { icon: "🏠", label: "Dashboard", id: "home" },
  { icon: "📚", label: "Marks", id: "Marks" },
  { icon: "💻", label: "Projects", id: "Projects" },
  { icon: "⚡", label: "Skills", id: "Skills" },
  { icon: "🎓", label: "Certificates", id: "Certificates" },
  { icon: "🔔", label: "Notifications", id: "notifications", badge: true },
];

type CertificateForm = {
  course_name: string;
  platform: string;
  domain: string;
  completion_percentage: string;
  certificate_file: File | null;
};

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const { user, logout } = useAuth();

  // Get student ID and branch from auth context
  const studentId = user?.student_id || 1; // Fallback to 1 if not available
  const studentBranch = user?.branch || "Loading..."; // Use actual branch from user context

  const [elective, setElective] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [gpa, setGpa] = useState("");
  const [projects, setProjects] = useState([
    { title: "", domain: "", difficulty: "", tech: "", hours: "", github: "" }
  ]);
  const [skills, setSkills] = useState({
    math_comfort: "", programming_comfort: "",
    problem_solving_rating: "", communication_rating: "",
    hackathons_participated: "", clubs_joined: "",
    competitions_participated: "", github_link: "",
    career_goal: "", preferred_learning_style: "",
  });
  const [certificates, setCertificates] = useState<CertificateForm[]>([
    { course_name: "", platform: "", domain: "", completion_percentage: "", certificate_file: null }
  ]);

  // Track what's been saved to prevent duplicates
  const [savedProjects, setSavedProjects] = useState<Set<string>>(new Set());
  const [savedCertificates, setSavedCertificates] = useState<Set<string>>(new Set());

  const handleSave = async () => {
    if (loading) return; // Prevent double submission

    setLoading(true);
    setError(null);

    try {
      if (activeTab === "Marks") {
        // Save academic records
        const subjects = Object.entries(marks).filter(([_, value]) => value !== "");
        for (const [subjectKey, mark] of subjects) {
          const subjectName = SUBJECTS.find(s => s.key === subjectKey)?.name ||
                              ELECTIVES.find(e => e.key === subjectKey)?.name ||
                              subjectKey;
          const record: AcademicRecord = {
            semester: 5,
            subject_name: subjectName,
            marks_obtained: parseFloat(mark),
            total_marks: 100,
            attendance_percentage: 75, // Default for now
            gpa: gpa ? parseFloat(gpa) : undefined,
          };
          await studentAPI.addAcademicRecord(studentId, record);
        }
      } else if (activeTab === "Projects") {
        // Save only NEW projects (not already saved)
        const validProjects = projects.filter(p => p.title && p.domain);
        for (const project of validProjects) {
          const projectKey = `${project.title}-${project.domain}`;
          if (!savedProjects.has(projectKey)) {
            const projectData: Project = {
              title: project.title,
              domain: project.domain,
              difficulty_level: parseInt(project.difficulty) || 3,
              technologies_used: project.tech,
              github_link: project.github,
              is_team_project: false,
            };
            await studentAPI.addProject(studentId, projectData);
            setSavedProjects(prev => new Set(prev).add(projectKey));
          }
        }
      } else if (activeTab === "Skills") {
        // Save skills
        const skillData: Skill = {
          math_comfort: parseFloat(skills.math_comfort) || 5,
          programming_comfort: parseFloat(skills.programming_comfort) || 5,
          problem_solving_rating: parseFloat(skills.problem_solving_rating) || 5,
          communication_rating: parseFloat(skills.communication_rating) || 5,
          hackathons_participated: parseInt(skills.hackathons_participated) || 0,
          clubs_joined: parseInt(skills.clubs_joined) || 0,
          competitions_participated: parseInt(skills.competitions_participated) || 0,
        };
        await studentAPI.addSkill(studentId, skillData);
      } else if (activeTab === "Certificates") {
        // Save only NEW certificates (not already saved)
        const validCertificates = certificates.filter(c => c.course_name && c.domain);
        for (const cert of validCertificates) {
          const certKey = `${cert.course_name}-${cert.domain}`;
          if (!savedCertificates.has(certKey)) {
            const courseData: Course = {
              course_name: cert.course_name,
              platform: cert.platform,
              domain: cert.domain,
              completion_percentage: parseFloat(cert.completion_percentage) || 0,
            };
            await studentAPI.addCourse(studentId, courseData);
            setSavedCertificates(prev => new Set(prev).add(certKey));
          }
        }
      }

      // After saving, trigger ML prediction
      await predictionAPI.predict(studentId);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);

      // Refresh notifications after saving data
      await fetchNotifications();
    } catch (err: any) {
      console.error("Save failed:", err);
      setError(err.response?.data?.detail || "Failed to save data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addProject = () => setProjects([...projects, { title: "", domain: "", difficulty: "", tech: "", hours: "", github: "" }]);
  const addCertificate = () => setCertificates([...certificates, { course_name: "", platform: "", domain: "", completion_percentage: "", certificate_file: null }]);

  // Fetch student data when component mounts
  useEffect(() => {
    if (studentId) {  // Load data for any valid student ID
      fetchStudentData();
      fetchNotifications();
    }
  }, [studentId]); // Only re-run when studentId changes

  const fetchStudentData = async () => {
    try {
      // First fetch from students endpoint to get branch data
      const students = await studentAPI.getAll();
      const currentStudent = students.find((s: any) => s.id === studentId);
      if (currentStudent) {
        setStudentData(currentStudent);
      }

      // Fetch all saved data for this student
      const [academicRecords, projects, courses, skills] = await Promise.all([
        studentAPI.getAcademicRecords(studentId).catch(() => []),
        studentAPI.getProjects(studentId).catch(() => []),
        studentAPI.getCourses(studentId).catch(() => []),
        studentAPI.getSkills(studentId).catch(() => []),
      ]);

      // Load saved academic marks
      if (academicRecords && academicRecords.length > 0) {
        const savedMarks = academicRecords.reduce((acc: any, record: any) => {
          const key = record.subject_name.toLowerCase().replace(/\s+/g, '_');
          acc[key] = record.marks_obtained;
          return acc;
        }, {});
        setMarks(prev => ({ ...prev, ...savedMarks }));
      }

      // Load saved projects
      if (projects && projects.length > 0) {
        const savedProjects = projects.map((p: any) => ({
          title: p.title || "",
          domain: p.domain || "",
          difficulty: p.difficulty_level?.toString() || "",
          tech: p.technologies_used || "",
          hours: "8", // Default hours
          github: p.github_link || ""
        }));
        // Always add one empty form for new projects
        setProjects([...savedProjects, { title: "", domain: "", difficulty: "", tech: "", hours: "", github: "" }]);

        // Track saved projects to prevent duplicates
        const projectKeys = projects.map((p: any) => `${p.title}-${p.domain}`);
        setSavedProjects(new Set(projectKeys));
      }

      // Load saved certificates (courses)
      if (courses && courses.length > 0) {
        const savedCertificates = courses.map((c: any) => ({
          course_name: c.course_name || "",
          platform: c.platform || "",
          domain: c.domain || "",
          completion_percentage: c.completion_percentage?.toString() || "",
          certificate_file: null
        }));
        // Always add one empty form for new certificates
        setCertificates([...savedCertificates, { course_name: "", platform: "", domain: "", completion_percentage: "", certificate_file: null }]);

        // Track saved certificates to prevent duplicates
        const certKeys = courses.map((c: any) => `${c.course_name}-${c.domain}`);
        setSavedCertificates(new Set(certKeys));
      }

      // Load saved skills
      if (skills && skills.length > 0) {
        const savedSkills = skills[0]; // Take the first (latest) skills entry
        setSkills({
          math_comfort: savedSkills.math_comfort?.toString() || "",
          programming_comfort: savedSkills.programming_comfort?.toString() || "",
          problem_solving_rating: savedSkills.problem_solving_rating?.toString() || "",
          communication_rating: savedSkills.communication_rating?.toString() || "",
          hackathons_participated: savedSkills.hackathons_participated?.toString() || "",
          clubs_joined: savedSkills.clubs_joined?.toString() || "",
          competitions_participated: savedSkills.competitions_participated?.toString() || "",
          github_link: savedSkills.github_link || "",
          career_goal: savedSkills.career_goal || "",
          preferred_learning_style: savedSkills.preferred_learning_style || "",
        });
      }

    } catch (error) {
      console.error("Failed to fetch student data:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      // Fetch mentor feedback for this student
      const feedbacks = await studentAPI.getFeedback(studentId);

      // Show only the latest feedback (keep most recent)
      const uniqueNotifications = feedbacks
        ? feedbacks.reduce((unique: any[], notification: any) => {
            const existing = unique.find(n =>
              n.mentor_name === notification.mentor_name &&
              n.general_notes === notification.general_notes
            );
            if (!existing) {
              unique.push(notification);
            }
            return unique;
          }, [])
        : [];

      console.log('Fetched notifications:', uniqueNotifications.length);
      setNotifications(uniqueNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    }
  };

  const glass = {
    background: "rgba(255,255,255,0.45)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1.5px solid rgba(255,255,255,0.7)",
    borderRadius: "20px",
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.6)",
    border: "1.5px solid rgba(167,139,250,0.25)",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "13px",
    outline: "none",
    width: "100%",
    fontFamily: "var(--font-poppins)",
    color: "#1f1f1f",
    backdropFilter: "blur(10px)",
  };

  const labelStyle = {
    fontSize: "12px",
    fontWeight: "500" as const,
    color: "#6b7280",
    marginBottom: "6px",
    display: "block" as const,
    fontFamily: "var(--font-poppins)",
  };

  return (
    <div className="min-h-screen flex" style={{
      background: "linear-gradient(135deg, #f5f0ff 0%, #fde8f0 25%, #e8f8f2 50%, #deeeff 100%)",
      fontFamily: "var(--font-poppins)",
    }}>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatBob {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(167,139,250,0.3); }
          50% { box-shadow: 0 0 20px 6px rgba(167,139,250,0.15); }
        }
        @keyframes successPop {
          0% { opacity:0; transform: scale(0.8) translateY(20px); }
          70% { transform: scale(1.05) translateY(0); }
          100% { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity:1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity:0; }
        }
        .fade-in { animation: fadeSlideIn 0.5s ease-out forwards; }
        .fade-in-1 { animation: fadeSlideIn 0.5s ease-out 0.1s forwards; opacity:0; }
        .fade-in-2 { animation: fadeSlideIn 0.5s ease-out 0.2s forwards; opacity:0; }
        .fade-in-3 { animation: fadeSlideIn 0.5s ease-out 0.3s forwards; opacity:0; }
        .fade-in-4 { animation: fadeSlideIn 0.5s ease-out 0.4s forwards; opacity:0; }
        .float-bob { animation: floatBob 3s ease-in-out infinite; }
        .pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
        .success-pop { animation: successPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .glass-card {
          background: rgba(255,255,255,0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1.5px solid rgba(255,255,255,0.7);
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255,255,255,0.6);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(167,139,250,0.15);
        }
        .nav-btn {
          transition: all 0.2s ease;
        }
        .nav-btn:hover {
          background: rgba(167,139,250,0.1) !important;
          transform: translateX(4px);
        }
        .save-btn {
          transition: all 0.3s ease;
        }
        .save-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124,58,237,0.4) !important;
        }
        .confetti-piece {
          position: fixed;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          animation: confettiFall linear forwards;
        }
      `}</style>

      {/* Background blobs */}
      <div className="fixed top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "#c4b5fd" }} />
      <div className="fixed bottom-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "#86efac" }} />
      <div className="fixed top-[40%] right-[20%] w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "#fda4af" }} />

      {/* ── Sidebar ── */}
      <div className="w-64 min-h-screen flex flex-col py-6 px-4 relative z-10"
        style={{
          background: "rgba(255,255,255,0.5)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          borderRight: "1.5px solid rgba(255,255,255,0.7)",
        }}>

        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-10 fade-in">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg float-bob"
            style={{
              background: "linear-gradient(135deg, #a78bfa, #34d399)",
              boxShadow: "0 4px 15px rgba(167,139,250,0.4)"
            }}>
            🧬
          </div>
          <span className="font-bold text-xl" style={{ color: "#6d28d9" }}>DomainDNA</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="nav-btn flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-left relative"
              style={{
                background: activeTab === item.id
                  ? "linear-gradient(135deg, rgba(167,139,250,0.25), rgba(252,231,243,0.4))"
                  : "transparent",
                color: activeTab === item.id ? "#6d28d9" : "#9ca3af",
                border: activeTab === item.id
                  ? "1.5px solid rgba(167,139,250,0.3)"
                  : "1.5px solid transparent",
                boxShadow: activeTab === item.id
                  ? "0 4px 15px rgba(167,139,250,0.1)"
                  : "none",
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              {item.label}
              {item.badge && notifications.length > 0 && (
                <div className="absolute right-3 top-2 w-5 h-5 rounded-full flex items-center justify-center text-white pulse-glow"
                  style={{ background: "#ef4444", fontSize: "10px" }}>
                  {notifications.length}
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-2 glass-card">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                boxShadow: "0 4px 10px rgba(124,58,237,0.3)"
              }}>
              {user?.full_name?.[0]?.toUpperCase() || "S"}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "#1f1f1f" }}>
                {user?.full_name || "Student"}
              </p>
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                Sem 5 • {user?.branch || studentData?.branch || "Loading..."}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
            style={{ color: "#ef4444" }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 p-8 overflow-y-auto relative z-10">

        {/* HOME */}
        {activeTab === "home" && (
          <div>
            {/* Welcome banner */}
            <div className="rounded-3xl p-8 mb-6 relative overflow-hidden fade-in"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9, #4c1d95)",
                minHeight: "200px",
                boxShadow: "0 20px 60px rgba(109,40,217,0.35)",
              }}>
              {/* Glassy overlay circles */}
              <div className="absolute top-[-40px] right-[200px] w-40 h-40 rounded-full opacity-10"
                style={{ background: "white" }} />
              <div className="absolute bottom-[-30px] left-[300px] w-32 h-32 rounded-full opacity-10"
                style={{ background: "white" }} />

              <div className="relative z-10 max-w-lg">
                <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Welcome back 👋
                </p>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Hello, {user?.full_name?.split(' ')[0] || "Student"}!
                </h1>
                <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Enter your academic data so your mentor can guide you to the right domain
                </p>
                <button onClick={() => setActiveTab("Marks")}
                  className="save-btn px-6 py-2.5 rounded-2xl text-sm font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    color: "white",
                    border: "1.5px solid rgba(255,255,255,0.4)",
                    backdropFilter: "blur(10px)",
                  }}>
                  Start Entering Data →
                </button>
              </div>

              {/* Character image */}
              <div className="absolute right-6 bottom-0 h-full flex items-end float-bob">
                <Image src="/images/welcome.jpg" alt="Welcome"
                  width={220} height={180}
                  className="object-cover rounded-2xl opacity-90"
                  style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }} />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Subjects", value: Object.keys(marks).length, icon: "📚", color: "#a78bfa", delay: "0.1s" },
                { label: "Projects", value: projects.filter(p => p.title).length, icon: "💻", color: "#34d399", delay: "0.2s" },
                { label: "Certificates", value: certificates.filter(c => c.course_name).length, icon: "🎓", color: "#f472b6", delay: "0.3s" },
                { label: "Skills filled", value: Object.values(skills).filter(v => v).length, icon: "⚡", color: "#fb923c", delay: "0.4s" },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-5"
                  style={{ animationDelay: stat.delay }}>
                  <div className="text-2xl mb-3">{stat.icon}</div>
                  <p className="text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick nav cards */}
            <p className="text-sm font-medium mb-3" style={{ color: "#9ca3af" }}>Quick access</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { tab: "Marks", icon: "📚", title: "Enter Marks", desc: "Sem 5 subjects + GPA", color: "rgba(167,139,250,0.15)", accent: "#a78bfa", delay: "0.1s" },
                { tab: "Projects", icon: "💻", title: "Add Projects", desc: "Technical projects + GitHub", color: "rgba(52,211,153,0.15)", accent: "#34d399", delay: "0.2s" },
                { tab: "Skills", icon: "⚡", title: "Rate Your Skills", desc: "Self assessment + activities", color: "rgba(244,114,182,0.15)", accent: "#f472b6", delay: "0.3s" },
                { tab: "Certificates", icon: "🎓", title: "Add Certificates", desc: "Online courses + platforms", color: "rgba(96,165,250,0.15)", accent: "#60a5fa", delay: "0.4s" },
              ].map((card, i) => (
                <button key={i} onClick={() => setActiveTab(card.tab)}
                  className="glass-card p-6 text-left"
                  style={{
                    background: card.color,
                    border: `1.5px solid ${card.accent}44`,
                  }}>
                  <div className="text-3xl mb-3">{card.icon}</div>
                  <p className="font-bold text-sm mb-1" style={{ color: "#1f1f1f" }}>{card.title}</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>{card.desc}</p>
                  <div className="mt-3 text-xs font-semibold" style={{ color: card.accent }}>
                    Go → 
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MARKS */}
        {activeTab === "Marks" && (
          <div className="fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#1f1f1f" }}>📚 Sem 5 Marks</h2>
              <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>Enter your marks for each subject out of 100</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {SUBJECTS.map((subject, i) => (
                <div key={subject.key} className="glass-card p-5"
                  style={{ animationDelay: `${i * 0.1}s` }}>
                  <label style={labelStyle}>{subject.name}</label>
                  <input type="number" min="0" max="100"
                    placeholder="Marks out of 100"
                    value={marks[subject.key] || ""}
                    onChange={(e) => setMarks({ ...marks, [subject.key]: e.target.value })}
                    style={inputStyle} />
                </div>
              ))}
            </div>

            <div className="glass-card p-5 mb-4">
              <label style={labelStyle}>Elective Subject</label>
              <select value={elective} onChange={(e) => setElective(e.target.value)} style={inputStyle}>
                <option value="">Select your elective</option>
                {ELECTIVES.map(e => <option key={e.key} value={e.key}>{e.name}</option>)}
              </select>
              {elective && (
                <div className="mt-4">
                  <label style={labelStyle}>
                    Marks for {ELECTIVES.find(e => e.key === elective)?.name}
                  </label>
                  <input type="number" min="0" max="100"
                    placeholder="Marks out of 100"
                    value={marks[elective] || ""}
                    onChange={(e) => setMarks({ ...marks, [elective]: e.target.value })}
                    style={inputStyle} />
                </div>
              )}
            </div>

            <div className="glass-card p-5 mb-6">
              <label style={labelStyle}>Semester GPA</label>
              <input type="number" min="0" max="10" step="0.1"
                placeholder="e.g. 8.5"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                style={inputStyle} />
            </div>

            <button onClick={handleSave} className="save-btn px-8 py-3 rounded-2xl text-white font-semibold text-sm"
              disabled={loading}
              style={{
                background: loading ? "#9ca3af" : "linear-gradient(135deg, #a78bfa, #7c3aed)",
                boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}>
              {loading ? "Saving..." : "Save Marks ✓"}
            </button>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>
        )}

        {/* PROJECTS */}
        {activeTab === "Projects" && (
          <div className="fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#1f1f1f" }}>💻 My Projects</h2>
              <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>Add your technical projects</p>
            </div>

            {projects.map((project, idx) => (
              <div key={idx} className="glass-card p-6 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>
                    {idx + 1}
                  </div>
                  <p className="font-bold text-sm" style={{ color: "#6d28d9" }}>Project {idx + 1}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Project Title", key: "title", placeholder: "e.g. Image Classifier", type: "text" },
                    { label: "Weekly Hours", key: "hours", placeholder: "e.g. 10", type: "number" },
                    { label: "Technologies Used", key: "tech", placeholder: "e.g. Python, TensorFlow", type: "text" },
                    { label: "GitHub Link", key: "github", placeholder: "https://github.com/...", type: "text" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label style={labelStyle}>{field.label}</label>
                      <input type={field.type} placeholder={field.placeholder}
                        value={(project as any)[field.key]}
                        onChange={(e) => {
                          const p = [...projects];
                          (p[idx] as any)[field.key] = e.target.value;
                          setProjects(p);
                        }}
                        style={inputStyle} />
                    </div>
                  ))}
                  <div>
                    <label style={labelStyle}>Domain</label>
                    <select value={project.domain}
                      onChange={(e) => { const p = [...projects]; p[idx].domain = e.target.value; setProjects(p); }}
                      style={inputStyle}>
                      <option value="">Select domain</option>
                      {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Difficulty (1-5)</label>
                    <select value={project.difficulty}
                      onChange={(e) => { const p = [...projects]; p[idx].difficulty = e.target.value; setProjects(p); }}
                      style={inputStyle}>
                      <option value="">Select</option>
                      {[1,2,3,4,5].map(n => (
                        <option key={n} value={n}>{n} — {["Very Easy","Easy","Medium","Hard","Very Hard"][n-1]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-3 flex-wrap">
              <button onClick={addProject}
                className="save-btn px-6 py-3 rounded-2xl text-sm font-semibold"
                style={{
                  background: "rgba(167,139,250,0.15)",
                  color: "#6d28d9",
                  border: "1.5px solid rgba(167,139,250,0.3)"
                }}>
                + Add Another Project
              </button>
              <button onClick={handleSave}
                disabled={loading}
                className="save-btn px-8 py-3 rounded-2xl text-white font-semibold text-sm"
                style={{
                  background: loading ? "#9ca3af" : "linear-gradient(135deg, #a78bfa, #7c3aed)",
                  boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? "Saving..." : "Save Projects ✓"}
              </button>
            </div>
          </div>
        )}

        {/* SKILLS */}
        {activeTab === "Skills" && (
          <div className="fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#1f1f1f" }}>⚡ Skills & Activities</h2>
              <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>Rate yourself honestly — this helps the ML model accuracy</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: "Math Comfort (1-10)", key: "math_comfort", placeholder: "e.g. 8", min: 1, max: 10 },
                { label: "Programming Comfort (1-10)", key: "programming_comfort", placeholder: "e.g. 7", min: 1, max: 10 },
                { label: "Problem Solving (1-10)", key: "problem_solving_rating", placeholder: "e.g. 8", min: 1, max: 10 },
                { label: "Communication (1-10)", key: "communication_rating", placeholder: "e.g. 6", min: 1, max: 10 },
                { label: "Hackathons Participated", key: "hackathons_participated", placeholder: "e.g. 2", min: 0, max: 50 },
                { label: "Clubs Joined", key: "clubs_joined", placeholder: "e.g. 1", min: 0, max: 20 },
                { label: "Competitions", key: "competitions_participated", placeholder: "e.g. 3", min: 0, max: 50 },
              ].map((field) => (
                <div key={field.key} className="glass-card p-5">
                  <label style={labelStyle}>{field.label}</label>
                  <input
                    type="number"
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    value={(skills as any)[field.key]}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Validate on change
                      if (value === '' || (Number(value) >= field.min && Number(value) <= field.max)) {
                        setSkills({ ...skills, [field.key]: value });
                      }
                    }}
                    style={inputStyle} />
                </div>
              ))}
            </div>

            <div className="glass-card p-5 mb-4">
              <label style={labelStyle}>GitHub Profile Link</label>
              <input placeholder="https://github.com/yourusername"
                value={skills.github_link}
                onChange={(e) => setSkills({ ...skills, github_link: e.target.value })}
                style={inputStyle} />
            </div>

            <div className="glass-card p-5 mb-4">
              <label style={labelStyle}>Career Goal / Dream Domain</label>
              <input placeholder="e.g. I want to work in Machine Learning"
                value={skills.career_goal}
                onChange={(e) => setSkills({ ...skills, career_goal: e.target.value })}
                style={inputStyle} />
            </div>

            <div className="glass-card p-5 mb-6">
              <label style={labelStyle}>Preferred Learning Style</label>
              <select value={skills.preferred_learning_style}
                onChange={(e) => setSkills({ ...skills, preferred_learning_style: e.target.value })}
                style={inputStyle}>
                <option value="">Select</option>
                <option value="video">Video Lectures</option>
                <option value="reading">Reading / Docs</option>
                <option value="hands_on">Hands-on Practice</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <button onClick={handleSave}
              disabled={loading}
              className="save-btn px-8 py-3 rounded-2xl text-white font-semibold text-sm"
              style={{
                background: loading ? "#9ca3af" : "linear-gradient(135deg, #a78bfa, #7c3aed)",
                boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}>
              {loading ? "Saving..." : "Save Skills ✓"}
            </button>
          </div>
        )}

        {/* CERTIFICATES */}
        {activeTab === "Certificates" && (
          <div className="fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#1f1f1f" }}>🎓 Course Certificates</h2>
              <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>Add online courses and certifications</p>
            </div>

            {certificates.map((cert, idx) => (
              <div key={idx} className="glass-card p-6 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #60a5fa, #2563eb)" }}>
                    {idx + 1}
                  </div>
                  <p className="font-bold text-sm" style={{ color: "#2563eb" }}>Certificate {idx + 1}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Course Name</label>
                    <input placeholder="e.g. Machine Learning by Andrew Ng"
                      value={cert.course_name}
                      onChange={(e) => { const c = [...certificates]; c[idx].course_name = e.target.value; setCertificates(c); }}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Platform</label>
                    <input placeholder="e.g. Coursera, Udemy, NPTEL"
                      value={cert.platform}
                      onChange={(e) => { const c = [...certificates]; c[idx].platform = e.target.value; setCertificates(c); }}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Domain</label>
                    <select value={cert.domain}
                      onChange={(e) => { const c = [...certificates]; c[idx].domain = e.target.value; setCertificates(c); }}
                      style={inputStyle}>
                      <option value="">Select domain</option>
                      {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Completion %</label>
                    <input type="number" min="0" max="100" placeholder="e.g. 100"
                      value={cert.completion_percentage}
                      onChange={(e) => { const c = [...certificates]; c[idx].completion_percentage = e.target.value; setCertificates(c); }}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Upload Certificate</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
                            const c = [...certificates];
                            c[idx].certificate_file = file;
                            setCertificates(c);
                          } else if (file) {
                            alert("File size must be less than 5MB");
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                        id={`cert-file-${idx}`}
                      />
                      <label
                        htmlFor={`cert-file-${idx}`}
                        style={{
                          ...inputStyle,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: "40px",
                          border: "1.5px dashed rgba(96,165,250,0.4)",
                        }}
                      >
                        {cert.certificate_file ? (
                          <span className="text-blue-600 text-xs">
                            📄 {cert.certificate_file.name}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">
                            📤 Upload Certificate (PDF, JPG, PNG)
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-3 flex-wrap">
              <button onClick={addCertificate}
                className="save-btn px-6 py-3 rounded-2xl text-sm font-semibold"
                style={{
                  background: "rgba(96,165,250,0.15)",
                  color: "#2563eb",
                  border: "1.5px solid rgba(96,165,250,0.3)"
                }}>
                + Add Another Certificate
              </button>
              <button onClick={handleSave}
                disabled={loading}
                className="save-btn px-8 py-3 rounded-2xl text-white font-semibold text-sm"
                style={{
                  background: loading ? "#9ca3af" : "linear-gradient(135deg, #a78bfa, #7c3aed)",
                  boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? "Saving..." : "Save Certificates ✓"}
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#1f1f1f" }}>🔔 Notifications</h2>
              <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>Messages from your mentor</p>
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification, index) => (
                  <div key={`${notification.mentor_name}-${notification.general_notes?.slice(0, 20)}-${index}`} className="glass-card p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg, #34d399, #059669)",
                          boxShadow: "0 4px 10px rgba(5,150,105,0.3)"
                        }}>
                        {notification.mentor_name?.[0]?.toUpperCase() || "M"}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-sm" style={{ color: "#1f1f1f" }}>
                            {notification.mentor_name || "Your Mentor"}
                          </p>
                          <span className="text-xs" style={{ color: "#9ca3af" }}>
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="rounded-2xl p-4 mt-2"
                          style={{
                            background: "linear-gradient(135deg, rgba(209,250,229,0.6), rgba(219,234,254,0.6))",
                            border: "1.5px solid rgba(52,211,153,0.2)",
                            backdropFilter: "blur(10px)",
                          }}>
                          <div className="space-y-3">
                            {notification.recommended_domain && (
                              <p className="text-sm" style={{ color: "#065f46" }}>
                                <strong>Recommended Domain:</strong> {notification.recommended_domain}
                              </p>
                            )}
                            {notification.recommended_courses && (
                              <p className="text-sm" style={{ color: "#065f46" }}>
                                <strong>Recommended Courses:</strong> {notification.recommended_courses}
                              </p>
                            )}
                            {notification.recommended_projects && (
                              <p className="text-sm" style={{ color: "#065f46" }}>
                                <strong>Recommended Projects:</strong> {notification.recommended_projects}
                              </p>
                            )}
                            {notification.general_notes && (
                              <p className="text-sm" style={{ color: "#065f46" }}>
                                <strong>Notes:</strong> {notification.general_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "#1f1f1f" }}>No feedback yet</h3>
                <p className="text-sm" style={{ color: "#9ca3af" }}>
                  Complete your profile and wait for your mentor to review your data
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── SUCCESS ANIMATION ── */}
      <SuccessAnimation
        show={showSuccess}
        onHide={() => setShowSuccess(false)}
      />

      {/* ── CHATBOT ── */}
      <ChatBot userRole="student" userId={studentId} />

    </div>
  );
}