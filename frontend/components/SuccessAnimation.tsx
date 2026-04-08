"use client";
import { useEffect } from "react";
import Image from "next/image";

interface SuccessAnimationProps {
  show: boolean;
  onHide: () => void;
}

export default function SuccessAnimation({ show, onHide }: SuccessAnimationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{
        background: "rgba(245, 240, 255, 0.85)",
        backdropFilter: "blur(25px)",
        animation: "fadeInBackdrop 0.5s ease-out forwards"
      }}>

      {/* Background gradient blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none float-gentle"
        style={{ background: "linear-gradient(135deg, #c4b5fd, #e0e7ff)" }} />
      <div className="absolute bottom-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-25 blur-3xl pointer-events-none float-gentle-delayed"
        style={{ background: "linear-gradient(135deg, #ddd6fe, #f3e8ff)" }} />

      {/* Confetti */}
      {[...Array(25)].map((_, i) => (
        <div key={i} className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            background: ["#a78bfa","#c4b5fd","#e0e7ff","#f3e8ff","#ddd6fe"][i % 5],
            animationDuration: `${2.5 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 0.8}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
          }} />
      ))}

      {/* Main content */}
      <div className="success-pop flex flex-col items-center relative z-10">

        {/* Floating Success GIF/Animation */}
        <div className="relative mb-6">
          {/* Glowing background */}
          <div className="absolute inset-0 rounded-full opacity-40 pulse-glow-lavender"
            style={{
              background: "linear-gradient(135deg, #a78bfa, #c4b5fd)",
              width: "280px",
              height: "280px",
              transform: "scale(1.1)",
            }} />

          {/* Success icon with floating animation */}
          <div className="relative w-[260px] h-[260px] flex items-center justify-center rounded-full float-bob-gentle"
            style={{
              background: "linear-gradient(135deg, #f5f0ff, #faf5ff)",
              border: "3px solid rgba(167, 139, 250, 0.3)",
              boxShadow: "0 20px 60px rgba(167, 139, 250, 0.4)",
            }}>

            {/* Success checkmark animation */}
            <div className="relative">
              <div className="text-8xl mb-2 checkmark-bounce">✨</div>
              <div className="absolute top-0 left-0 text-8xl mb-2 checkmark-bounce-delayed">🎉</div>
            </div>
          </div>
        </div>

        {/* Success text */}
        <h2 className="text-5xl font-bold mb-3 text-gradient-lavender typewriter"
          style={{ fontFamily: "var(--font-poppins)" }}>
          Data Saved Successfully!
        </h2>

        <p className="text-lg mb-4 fade-in-delayed"
          style={{
            color: "#7c3aed",
            fontFamily: "var(--font-poppins)",
          }}>
          Your mentor will review your profile and provide personalized guidance ✨
        </p>

        {/* Floating icons */}
        <div className="flex gap-3 mb-6">
          {["🧬", "📊", "⭐", "🚀", "💫", "✨"].map((emoji, i) => (
            <span key={i}
              style={{
                fontSize: "28px",
                animationDelay: `${i * 0.15}s`,
              }}
              className="float-bob-staggered">
              {emoji}
            </span>
          ))}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 opacity-70">
          <div className="w-3 h-3 rounded-full bg-purple-400 pulse-dot"></div>
          <div className="w-3 h-3 rounded-full bg-purple-400 pulse-dot" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-3 h-3 rounded-full bg-purple-400 pulse-dot" style={{ animationDelay: "0.4s" }}></div>
        </div>

      </div>

      <style jsx>{`
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes success-pop {
          0% { opacity:0; transform: scale(0.8) translateY(30px); }
          70% { transform: scale(1.05) translateY(-5px); }
          100% { opacity:1; transform: scale(1) translateY(0); }
        }

        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-8px) translateX(4px) rotate(1deg); }
          50% { transform: translateY(-4px) translateX(-6px) rotate(-1deg); }
          75% { transform: translateY(-12px) translateX(2px) rotate(0.5deg); }
        }

        @keyframes float-gentle-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-6px) translateX(-4px) rotate(-0.5deg); }
          50% { transform: translateY(-10px) translateX(8px) rotate(1deg); }
          75% { transform: translateY(-2px) translateX(-3px) rotate(-0.5deg); }
        }

        @keyframes float-bob-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes float-bob-staggered {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.1); }
        }

        @keyframes checkmark-bounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(-5deg); }
          75% { transform: scale(1.1) rotate(5deg); }
        }

        @keyframes checkmark-bounce-delayed {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
          30% { transform: scale(1.3) rotate(10deg); opacity: 1; }
          80% { transform: scale(1.05) rotate(-5deg); opacity: 0.8; }
        }

        @keyframes pulse-glow-lavender {
          0%, 100% { box-shadow: 0 0 20px rgba(167, 139, 250, 0.3), 0 0 40px rgba(167, 139, 250, 0.2); }
          50% { box-shadow: 0 0 30px rgba(167, 139, 250, 0.6), 0 0 60px rgba(167, 139, 250, 0.4); }
        }

        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes fade-in-delayed {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        .success-pop { animation: success-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .float-gentle { animation: float-gentle 6s ease-in-out infinite; }
        .float-gentle-delayed { animation: float-gentle-delayed 7s ease-in-out infinite 1s; }
        .float-bob-gentle { animation: float-bob-gentle 3s ease-in-out infinite; }
        .float-bob-staggered { animation: float-bob-staggered 2.5s ease-in-out infinite; }
        .checkmark-bounce { animation: checkmark-bounce 2s ease-in-out infinite; }
        .checkmark-bounce-delayed { animation: checkmark-bounce-delayed 2s ease-in-out infinite 0.5s; }
        .pulse-glow-lavender { animation: pulse-glow-lavender 2.5s ease-in-out infinite; }
        .fade-in-delayed { animation: fade-in-delayed 0.8s ease-out 0.3s forwards; opacity: 0; }
        .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite; }

        .text-gradient-lavender {
          background: linear-gradient(135deg, #7c3aed, #a78bfa, #c4b5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .confetti-piece {
          position: fixed;
          border-radius: 3px;
          animation: confetti-fall linear forwards;
          pointer-events: none;
          z-index: 100;
        }
      `}</style>
    </div>
  );
}