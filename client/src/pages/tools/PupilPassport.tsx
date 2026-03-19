import AIToolPage from "@/components/AIToolPage";
import { IdCard } from "lucide-react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";

const sendNeeds = [
  "Autism Spectrum Condition","ADHD","Dyslexia","Dyscalculia","Dyspraxia",
  "Speech & Language Needs","Social, Emotional & Mental Health","Hearing Impairment",
  "Visual Impairment","Physical Disability","Moderate Learning Difficulties",
  "Severe Learning Difficulties","Complex Needs","EAL",
].map(n => ({ value: n, label: n }));

// Section colour map
const SECTION_COLOURS: Record<string, string> = {
  "About Me":                    "#6366f1",
  "My Strengths":                "#10b981",
  "What I Find Challenging":     "#f59e0b",
  "What Helps Me Learn":         "#3b82f6",
  "How to Communicate with Me":  "#8b5cf6",
  "My Current Goals":            "#ec4899",
  "Please Remember":             "#ef4444",
};

function formatPassport(text: string, logoUrl?: string, schoolName?: string): string {
  // Parse the markdown sections
  const lines = text.split("\n");
  let html = "";
  let inBullets = false;

  const closeBullets = () => {
    if (inBullets) { html += "</ul>"; inBullets = false; }
  };

  // Header
  const logoImg = logoUrl
    ? `<img src="${logoUrl}" alt="School logo" style="height:52px;width:auto;object-fit:contain;border-radius:6px;" />`
    : `<div style="width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:24px;">🪪</div>`;

  html += `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:700px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
      <div style="display:flex;align-items:center;gap:14px;">
        ${logoImg}
        <div>
          <div style="font-size:20px;font-weight:800;color:white;letter-spacing:-0.3px;">Pupil Passport</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:2px;">${schoolName || "All About Me — For Staff"}</div>
        </div>
      </div>
      <div style="text-align:right;font-size:10px;color:rgba(255,255,255,0.55);line-height:1.6;">Person-centred · Strengths-based<br/>UK SEND Code of Practice aligned</div>
    </div>
    <div style="padding:24px 28px 28px;display:grid;gap:16px;">
  `;

  let currentSectionTitle = "";
  let currentSectionContent: string[] = [];

  const flushSection = () => {
    if (!currentSectionTitle || currentSectionContent.length === 0) return;
    const colour = SECTION_COLOURS[currentSectionTitle] || "#6366f1";
    const emoji = {
      "About Me": "👋",
      "My Strengths": "⭐",
      "What I Find Challenging": "🧩",
      "What Helps Me Learn": "💡",
      "How to Communicate with Me": "💬",
      "My Current Goals": "🎯",
      "Please Remember": "📌",
    }[currentSectionTitle] || "📋";

    const isBullet = currentSectionContent.some(l => l.startsWith("•") || l.startsWith("-") || l.startsWith("*"));
    const contentHtml = isBullet
      ? `<ul style="margin:0;padding-left:18px;display:grid;gap:5px;">${
          currentSectionContent
            .filter(l => l.trim())
            .map(l => `<li style="font-size:13px;color:#374151;line-height:1.5;">${l.replace(/^[•\-\*]\s*/, "")}</li>`)
            .join("")
        }</ul>`
      : currentSectionContent
          .filter(l => l.trim())
          .map(l => `<p style="margin:0 0 6px;font-size:13px;color:#374151;line-height:1.6;">${l}</p>`)
          .join("");

    const isHighlight = currentSectionTitle === "Please Remember";
    html += `
    <div style="border-radius:12px;border:1.5px solid ${colour}22;background:${colour}08;overflow:hidden;">
      <div style="background:${colour}${isHighlight ? "22" : "15"};padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid ${colour}20;">
        <span style="font-size:16px;">${emoji}</span>
        <span style="font-size:13px;font-weight:700;color:${colour};letter-spacing:0.2px;">${currentSectionTitle}</span>
      </div>
      <div style="padding:12px 16px;">${contentHtml}</div>
    </div>`;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect section headers: **Title** or ## Title or numbered
    const headerMatch =
      line.match(/^\*\*([^*]+)\*\*\s*$/) ||
      line.match(/^#{1,3}\s+(.+)/) ||
      line.match(/^\d+\.\s+\*\*([^*]+)\*\*/);

    if (headerMatch) {
      flushSection();
      currentSectionTitle = (headerMatch[1] || headerMatch[0]).replace(/\*\*/g, "").replace(/^\d+\.\s+/, "").trim();
      currentSectionContent = [];
    } else {
      currentSectionContent.push(line);
    }
  }
  flushSection();

  html += `
    </div>
    <div style="padding:12px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:10px;color:#9ca3af;">Generated by Adaptly · adaptly.co.uk</span>
      <span style="font-size:10px;color:#9ca3af;">This document is confidential — SEND Code of Practice 2015</span>
    </div>
  </div>`;

  return html;
}

export default function PupilPassport() {
  const { preferences } = useUserPreferences();

  return (
    <AIToolPage
      title="Pupil Passport Generator"
      assignable={true}
      description="Create a one-page pupil passport that tells staff everything they need to know"
      icon={<IdCard className="w-5 h-5 text-white" />}
      accentColor="bg-amber-600"
      fields={[
        { id: "studentName", label: "Student Initials", type: "text", placeholder: "e.g. O.B.", required: true, span: "half", maxLength: 4, hint: "Initials only (max 4 chars) — do not enter full names (GDPR)" },
        { id: "yearGroup", label: "Year Group", type: "text", placeholder: "e.g. Year 4", required: true, span: "half" },
        { id: "sendNeed", label: "Primary SEND Need", type: "select", options: sendNeeds, required: true, span: "half" },
        { id: "pronoun", label: "Pronoun", type: "select", options: [{ value: "She/her", label: "She/her" }, { value: "He/him", label: "He/him" }, { value: "They/them", label: "They/them" }], span: "half" },
        { id: "strengths", label: "Strengths & Interests", type: "textarea", placeholder: "What does this student love? What are they good at?", required: true, span: "full" },
        { id: "challenges", label: "Challenges & Barriers to Learning", type: "textarea", placeholder: "What do they find difficult? What triggers difficulties?", required: true, span: "full" },
        { id: "strategies", label: "What Helps (Strategies that work)", type: "textarea", placeholder: "What strategies, adaptations, or support helps this student?", span: "full" },
        { id: "communication", label: "Communication Style", type: "textarea", placeholder: "How does this student communicate best? Any AAC, visual supports?", span: "full" },
        { id: "goals", label: "Current Targets / Goals", type: "textarea", placeholder: "Current IEP/EHCP targets or focus areas", span: "full" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert SENCO creating a professional, person-centred Pupil Passport. Pupil Passports are one-page documents that give all staff a quick, clear picture of a student — their strengths, needs, and how to support them. They are written in a positive, strengths-based way and are practical for teachers to use.`,
        user: `Create a Pupil Passport for:

Name: ${v.studentName}
Year Group: ${v.yearGroup}
SEND Need: ${v.sendNeed}
Pronoun: ${v.pronoun}

Strengths & Interests:
${v.strengths}

Challenges & Barriers:
${v.challenges}

${v.strategies ? `What Helps:\n${v.strategies}` : ""}
${v.communication ? `Communication:\n${v.communication}` : ""}
${v.goals ? `Current Targets:\n${v.goals}` : ""}

Format as a professional Pupil Passport with these exact section headings (use **bold** markdown):
1. **About Me** — brief, positive introduction in first person ("I am...")
2. **My Strengths** — what I'm good at and love
3. **What I Find Challenging** — honest but positive framing
4. **What Helps Me Learn** — practical strategies for teachers
5. **How to Communicate with Me** — communication preferences
6. **My Current Goals** — targets I'm working towards
7. **Please Remember** — 3-5 key bullet points for all staff

Write in a warm, positive, person-centred style. Keep it concise.`,
        maxTokens: 2000,
      })}
      formatOutput={(text) => formatPassport(text, preferences.schoolLogoUrl, preferences.schoolName)}
      outputTitle={(v) => `Pupil Passport — ${v.studentName} (${v.yearGroup})`}
    />
  );
}
