import jsPDF from "jspdf";

interface Student {
  id: number;
  name: string;
  roll: string;
  semester: number;
  branch: string;
  status: string;
  scores: {
    [key: string]: number;
  };
  shap: Array<{
    feature: string;
    contribution: number;
  }>;
  marks: {
    [key: string]: number;
  };
  gpa: number;
  projects: number;
  certificates: number;
}

interface Feedback {
  attendance: string;
  participation: string;
  lab_performance: string;
  assignment_consistency: string;
  suggested_domain: string;
  recommended_courses: string;
  recommended_projects: string;
  remarks: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  machine_learning: "Machine Learning",
  web_development: "Web Development",
  cybersecurity: "Cybersecurity",
  data_engineering: "Data Engineering",
  cloud_computing: "Cloud Computing",
  mobile_development: "Mobile Dev",
};

const DOMAIN_COLORS: Record<string, string> = {
  machine_learning: "#a78bfa",
  web_development: "#34d399",
  cybersecurity: "#f472b6",
  data_engineering: "#60a5fa",
  cloud_computing: "#fb923c",
  mobile_development: "#fbbf24",
};

export function generateStudentPDF(student: Student, feedback: Feedback, mentorName: string = "Dr. Priya Sharma") {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ── HEADER ──────────────────────────────────────────────────
  // Background gradient effect (using rectangles)
  doc.setFillColor(167, 139, 250);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setFillColor(52, 211, 153);
  doc.rect(0, 35, pageWidth, 5, "F");

  // Logo/Icon
  doc.setFontSize(24);
  doc.text("DNA", 15, 22);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("DomainDNA", 30, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Student Domain Analysis Report", 30, 28);

  // Date
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 28, { align: "right" });

  // ── STUDENT INFO ────────────────────────────────────────────
  let yPos = 50;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${student.name}`, 15, yPos);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`${student.roll} - Semester ${student.semester} - ${student.branch}`, 15, yPos + 6);

  // Status badge
  const statusColor: [number, number, number] = student.status === "reviewed" ? [52, 211, 153] : [251, 146, 60];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - 45, yPos - 5, 30, 8, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(student.status === "reviewed" ? "Reviewed" : "Pending", pageWidth - 30, yPos, { align: "center" });

  yPos += 18;

  // ── ACADEMIC PERFORMANCE ────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ACADEMIC PERFORMANCE", 15, yPos);
  yPos += 8;

  // Academic stats boxes
  const academicStats = [
    { label: "GPA", value: student.gpa.toString() },
    { label: "Projects", value: student.projects.toString() },
    { label: "Certificates", value: student.certificates.toString() },
  ];

  let xPos = 15;
  academicStats.forEach((stat) => {
    doc.setFillColor(240, 240, 255);
    doc.roundedRect(xPos, yPos, 35, 15, 2, 2, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(124, 58, 237);
    doc.text(stat.value, xPos + 17.5, yPos + 7, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(stat.label, xPos + 17.5, yPos + 12, { align: "center" });
    xPos += 40;
  });

  yPos += 22;

  // ── DOMAIN SCORES ───────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("DOMAIN SUITABILITY SCORES", 15, yPos);
  yPos += 8;

  const sortedScores = Object.entries(student.scores).sort((a, b) => b[1] - a[1]);

  sortedScores.forEach(([domain, score]) => {
    const color = DOMAIN_COLORS[domain];
    const rgb = hexToRgb(color);

    // Domain name
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(DOMAIN_LABELS[domain], 15, yPos);

    // Score value
    doc.setFont("helvetica", "bold");
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text(`${score}%`, pageWidth - 15, yPos, { align: "right" });

    // Progress bar background
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(15, yPos + 2, pageWidth - 30, 4, 2, 2, "F");

    // Progress bar fill
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    const barWidth = ((pageWidth - 30) * score) / 100;
    doc.roundedRect(15, yPos + 2, barWidth, 4, 2, 2, "F");

    yPos += 12;
  });

  yPos += 5;

  // ── SHAP EXPLANATION ────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SHAP - FEATURE CONTRIBUTIONS TO TOP DOMAIN", 15, yPos);
  yPos += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Explainable AI shows which factors contribute most to the domain recommendation", 15, yPos);
  yPos += 8;

  // SHAP bars
  const maxContribution = Math.max(...student.shap.map(s => Math.abs(s.contribution)));

  student.shap.slice(0, 6).forEach((item) => {
    const isPositive = item.contribution >= 0;
    const barColor: [number, number, number] = isPositive ? [52, 211, 153] : [239, 68, 68];

    // Feature name
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(item.feature, 15, yPos);

    // Contribution value
    doc.setFont("helvetica", "bold");
    doc.setTextColor(barColor[0], barColor[1], barColor[2]);
    const valueText = isPositive ? `+${item.contribution.toFixed(2)}` : item.contribution.toFixed(2);
    doc.text(valueText, 75, yPos);

    // Bar
    const barMaxWidth = 100;
    const barWidth = (Math.abs(item.contribution) / maxContribution) * barMaxWidth;
    const barX = 85;

    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.roundedRect(barX, yPos - 3, barWidth, 4, 1, 1, "F");

    yPos += 8;
  });

  yPos += 5;

  // ── MENTOR FEEDBACK ─────────────────────────────────────────
  if (feedback.remarks || feedback.suggested_domain) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("MENTOR FEEDBACK", 15, yPos);
    yPos += 8;

    if (feedback.suggested_domain) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Suggested Domain:", 15, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(5, 150, 105);
      doc.text(DOMAIN_LABELS[feedback.suggested_domain] || feedback.suggested_domain, 55, yPos);
      yPos += 8;
    }

    if (feedback.recommended_courses) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Recommended Courses:", 15, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const coursesLines = doc.splitTextToSize(feedback.recommended_courses, pageWidth - 30);
      doc.text(coursesLines, 15, yPos);
      yPos += coursesLines.length * 4 + 4;
    }

    if (feedback.remarks) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Overall Remarks:", 15, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const remarksLines = doc.splitTextToSize(feedback.remarks, pageWidth - 30);
      doc.text(remarksLines, 15, yPos);
      yPos += remarksLines.length * 4;
    }
  }

  // ── FOOTER ──────────────────────────────────────────────────
  doc.setFillColor(245, 245, 245);
  doc.rect(0, pageHeight - 20, pageWidth, 20, "F");

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.text(`Reviewed by: ${mentorName}`, 15, pageHeight - 10);
  doc.text("DomainDNA - ML-Powered Domain Analysis", pageWidth / 2, pageHeight - 10, { align: "center" });
  doc.text(`Page 1 of 1`, pageWidth - 15, pageHeight - 10, { align: "right" });

  // ── SAVE PDF ────────────────────────────────────────────────
  const filename = `${student.name.replace(/\s+/g, "_")}_DomainAnalysis.pdf`;
  doc.save(filename);
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}
