import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6"
      style={{
        background: "linear-gradient(135deg, #f5f0ff 0%, #fde8f0 25%, #e8f8f2 50%, #deeeff 75%, #fff8e8 100%)",
        fontFamily: "var(--font-architects)",
      }}
    >
      {/* Background blobs */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ background: "#c4b5fd" }} />
      <div className="absolute top-[10%] right-[-60px] w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "#86efac" }} />
      <div className="absolute bottom-[-60px] left-[20%] w-80 h-80 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "#fda4af" }} />
      <div className="absolute bottom-[10%] right-[10%] w-56 h-56 rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: "#93c5fd" }} />

      {/* Logo */}
      <div className="relative z-10 mb-14 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: "linear-gradient(135deg, #a78bfa, #34d399)",
              boxShadow: "0 8px 32px rgba(167,139,250,0.4)",
            }}
          >
            🧬
          </div>
          <h1
            className="text-5xl font-bold"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #059669)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "var(--font-architects)",
            }}
          >
            DomainDNA
          </h1>
        </div>
        <p className="text-lg" style={{ color: "#6b7280" }}>
          Your domain is in your data 🧬
        </p>

        {/* Pills */}
        <div className="flex gap-3 justify-center mt-4 flex-wrap">
          {[
            { label: "ML Powered", color: "#7c3aed" },
            { label: "XAI Based", color: "#059669" },
          ].map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.8)",
                color: tag.color,
                fontFamily: "var(--font-architects)",
              }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-6 w-full max-w-2xl">

        {/* Student card */}
        <div className="flex-1">
          <div
            className="group rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:-translate-y-2 flex flex-col items-center justify-between"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(20px)",
              border: "1.5px solid rgba(255,255,255,0.8)",
              boxShadow: "0 8px 32px rgba(167,139,250,0.15), 0 2px 8px rgba(0,0,0,0.06)",
              minHeight: "380px",
            }}
          >
            <div
              className="w-40 h-40 rounded-2xl overflow-hidden mb-6"
              style={{ boxShadow: "0 4px 20px rgba(167,139,250,0.25)" }}
            >
              <Image
                src="/images/student.jpg"
                alt="Student"
                width={160}
                height={160}
                className="w-full h-full object-cover"
              />
            </div>

            <h2
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: "#6d28d9", fontFamily: "var(--font-architects)" }}
            >
              I am a Student
            </h2>

            <Link href="/student/login" className="w-full">
              <div
                className="w-full py-3 rounded-2xl text-sm font-semibold text-center text-white cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                  boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
                  fontFamily: "var(--font-architects)",
                }}
              >
                Get Started →
              </div>
            </Link>
          </div>
        </div>

        {/* Mentor card */}
        <div className="flex-1">
          <div
            className="group rounded-3xl p-8 transition-all duration-500 hover:scale-105 hover:-translate-y-2 flex flex-col items-center justify-between"
            style={{
              background: "rgba(255,255,255,0.55)",
              backdropFilter: "blur(20px)",
              border: "1.5px solid rgba(255,255,255,0.8)",
              boxShadow: "0 8px 32px rgba(52,211,153,0.15), 0 2px 8px rgba(0,0,0,0.06)",
              minHeight: "380px",
            }}
          >
            <div
              className="w-40 h-40 rounded-2xl overflow-hidden mb-6"
              style={{ boxShadow: "0 4px 20px rgba(52,211,153,0.25)" }}
            >
              <Image
                src="/images/mentor.jpg"
                alt="Mentor"
                width={160}
                height={160}
                className="w-full h-full object-cover"
              />
            </div>

            <h2
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: "#065f46", fontFamily: "var(--font-architects)" }}
            >
              I am a Mentor
            </h2>

            <Link href="/mentor/login" className="w-full">
              <div
                className="w-full py-3 rounded-2xl text-sm font-semibold text-center text-white cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #34d399, #059669)",
                  boxShadow: "0 4px 15px rgba(5,150,105,0.3)",
                  fontFamily: "var(--font-architects)",
                }}
              >
                View Students →
              </div>
            </Link>
          </div>
        </div>

      </div>

      {/* Tagline strip */}
      <style>{`
        @keyframes float1 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
        @keyframes float3 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
        .pill1 { animation: float1 3s ease-in-out infinite; }
        .pill2 { animation: float2 3s ease-in-out infinite 0.4s; }
        .pill3 { animation: float3 3s ease-in-out infinite 0.8s; }
      `}</style>

      <div className="relative z-10 flex gap-3 mt-12 flex-wrap justify-center">
        {[
          { icon: "🧠", label: "Smart", color: "#7c3aed", bg: "rgb(255, 255, 255)", cls: "pill1" },
          { icon: "✨", label: "Explainable", color: "#059669", bg: "rgb(255, 255, 255)", cls: "pill2" },
          { icon: "🎯", label: "Guided", color: "#e8845a", bg: "rgb(255, 255, 255)", cls: "pill3" },
        ].map((item, i) => (
          <div
            key={i}
            className={`${item.cls} flex items-center gap-2 px-5 py-2 rounded-full`}
            style={{
              background: item.bg,
              border: "1.5px solid rgba(255,255,255,0.8)",
              backdropFilter: "blur(12px)",
              boxShadow: `0 4px 15px ${item.color}22`,
              fontFamily: "var(--font-architects)",
              color: item.color,
              fontSize: "14px",
            }}
          >
            <span style={{ fontSize: "16px" }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-10 text-xs" style={{ color: "#c4b5d0" }}>
        DomainDNA — Built for smarter mentorship 
      </p>

    </main>
  );
}