"use client";
import { useState, useEffect } from "react";
import { predictionAPI, TextualExplanation as TextualExplanationType } from "@/lib/api";

interface TextualExplanationProps {
  studentId: number;
}

export default function TextualExplanation({ studentId }: TextualExplanationProps) {
  const [explanation, setExplanation] = useState<TextualExplanationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExplanation = async () => {
      if (!studentId) return;

      setLoading(true);
      setError(null);
      try {
        const explanationData = await predictionAPI.explainTextual(studentId);
        setExplanation(explanationData);
      } catch (err) {
        console.error("Failed to fetch textual explanation:", err);
        setError("Failed to load explanation. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
          <p className="text-sm" style={{ color: "#9ca3af" }}>Generating explanation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 rounded-2xl" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
        <p className="text-sm font-medium mb-2" style={{ color: "#dc2626" }}>
          ⚠️ Unable to Generate Explanation
        </p>
        <p className="text-xs" style={{ color: "#9ca3af" }}>
          {error}
        </p>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="text-center p-6 rounded-2xl" style={{ background: "rgba(156, 163, 175, 0.1)", border: "1px solid rgba(156, 163, 175, 0.2)" }}>
        <p className="text-sm" style={{ color: "#9ca3af" }}>
          No explanation available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with confidence level */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-lg" style={{ color: "#1f1f1f" }}>
            {explanation.domain} Recommendation
          </h4>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: explanation.confidence_level === 'High' ? "rgba(34, 197, 94, 0.15)" :
                         explanation.confidence_level === 'Medium' ? "rgba(251, 146, 60, 0.15)" :
                         "rgba(107, 114, 128, 0.15)",
              color: explanation.confidence_level === 'High' ? "#16a34a" :
                     explanation.confidence_level === 'Medium' ? "#ea580c" :
                     "#6b7280"
            }}
          >
            {explanation.confidence_level} Confidence
          </span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color: "#7c3aed" }}>
            {explanation.score.toFixed(1)}/100
          </p>
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            Suitability Score
          </p>
        </div>
      </div>

      {/* Explanation text */}
      <div
        className="rounded-2xl p-6 text-sm leading-relaxed whitespace-pre-line"
        style={{
          background: "rgba(139, 92, 246, 0.05)",
          border: "1px solid rgba(139, 92, 246, 0.1)",
          fontFamily: "var(--font-poppins)"
        }}
      >
        <div style={{ color: "#374151" }}>
          {explanation.explanation}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div
          className="text-center p-4 rounded-xl"
          style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)" }}
        >
          <p className="text-2xl font-bold mb-1" style={{ color: "#16a34a" }}>
            {explanation.top_factors}
          </p>
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            Key Strengths
          </p>
        </div>
        <div
          className="text-center p-4 rounded-xl"
          style={{ background: "rgba(251, 146, 60, 0.1)", border: "1px solid rgba(251, 146, 60, 0.2)" }}
        >
          <p className="text-2xl font-bold mb-1" style={{ color: "#ea580c" }}>
            {explanation.improvement_areas}
          </p>
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            Growth Areas
          </p>
        </div>
      </div>
    </div>
  );
}