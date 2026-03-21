import { useState } from "react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";
import AIToolPage from "@/components/AIToolPage";
import { BookMarked, Printer } from "lucide-react";

const years = ["Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11"].map(y => ({ value: y, label: y }));

/**
 * Parse a 3-way differentiated comprehension output into three labelled sections.
 * Looks for **Support Level**, **Core Level**, **Extension Level** headings.
 */
function parse3Way(text: string): { support: string; core: string; extension: string; rest: string } | null {
  const supportMatch  = text.match(/\*\*Support\s*Level\*\*([^]*?)(?=\*\*Core\s*Level\*\*|\*\*Extension\s*Level\*\*|$)/i);
  const coreMatch     = text.match(/\*\*Core\s*Level\*\*([^]*?)(?=\*\*Extension\s*Level\*\*|$)/i);
  const extensionMatch = text.match(/\*\*Extension\s*Level\*\*([^]*?)(?=$)/i);
  if (!supportMatch && !coreMatch && !extensionMatch) return null;
  // Capture everything after all three levels as "rest" (e.g. answer key, vocab activity)
  const lastLevelEnd = extensionMatch
    ? text.indexOf(extensionMatch[0]) + extensionMatch[0].length
    : coreMatch
    ? text.indexOf(coreMatch[0]) + coreMatch[0].length
    : 0;
  const rest = text.slice(lastLevelEnd).trim();
  return {
    support:   supportMatch?.[1]?.trim()   || "",
    core:      coreMatch?.[1]?.trim()      || "",
    extension: extensionMatch?.[1]?.trim() || "",
    rest,
  };
}

function mdToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<p class='font-semibold mt-2'>$1</p>")
    .replace(/^[-•]\s+(.+)$/gm, "<li class='ml-4'>$1</li>")
    .replace(/\n\n/g, "</p><p class='mt-2'>")
    .replace(/\n/g, "<br/>");
}

const LEVEL_CONFIG = [
  { key: "support",   label: "Support Level",   sub: "Scaffolded — sentence starters & guided questions", bg: "#eff6ff", border: "#3b82f6", header: "#2563eb", badge: "Foundation" },
  { key: "core",      label: "Core Level",       sub: "Standard comprehension questions",                  bg: "#f5f3ff", border: "#7c3aed", header: "#6d28d9", badge: "Core" },
  { key: "extension", label: "Extension Level",  sub: "Higher-order thinking — analysis & evaluation",     bg: "#ecfeff", border: "#0891b2", header: "#0e7490", badge: "Extension" },
] as const;

function ThreeWayOutput({ parsed, rest, logoUrl, schoolName }: {
  parsed: { support: string; core: string; extension: string; rest: string };
  rest: string;
  logoUrl?: string;
  schoolName?: string;
}) {
  const [printLevel, setPrintLevel] = useState<"all" | "support" | "core" | "extension">("all");

  return (
    <div className="space-y-4">
      {/* Print level selector */}
      <div className="no-print flex items-center gap-2 flex-wrap p-3 bg-slate-50 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Print:</span>
        {(["all", "support", "core", "extension"] as const).map(level => (
          <button
            key={level}
            onClick={() => setPrintLevel(level)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
              printLevel === level
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
            }`}
          >
            {level === "all" ? "All three levels" : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
        <button
          onClick={() => window.print()}
          className="no-print ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold bg-slate-800 text-white border border-slate-800 hover:bg-slate-900"
        >
          <Printer className="w-3.5 h-3.5" /> Print selected level
        </button>
      </div>

      {/* Three level panels */}
      {LEVEL_CONFIG.map(cfg => {
        const content = parsed[cfg.key];
        if (!content) return null;
        const hidden = printLevel !== "all" && printLevel !== cfg.key;
        return (
          <div
            key={cfg.key}
            className={hidden ? "no-print" : ""}
            style={{
              border: `2px solid ${cfg.border}`,
              borderRadius: "12px",
              overflow: "hidden",
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            {/* Header */}
            <div style={{ background: cfg.header, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "15px", color: "#fff" }}>{cfg.label}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", marginTop: "1px" }}>{cfg.sub}</div>
              </div>
              <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>
                {cfg.badge}
              </span>
            </div>
            {/* Content */}
            <div
              style={{ padding: "14px 16px", background: cfg.bg, fontSize: "14px", lineHeight: "1.7" }}
              dangerouslySetInnerHTML={{ __html: mdToHtml(content) }}
            />
          </div>
        );
      })}

      {/* Answer key / vocab activity if present */}
      {parsed.rest && (
        <div style={{ border: "2px solid #94a3b8", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ background: "#475569", padding: "10px 16px" }}>
            <div style={{ fontWeight: 800, fontSize: "15px", color: "#fff" }}>Answer Key & Additional Activities</div>
          </div>
          <div
            style={{ padding: "14px 16px", background: "#f8fafc", fontSize: "14px", lineHeight: "1.7" }}
            dangerouslySetInnerHTML={{ __html: mdToHtml(parsed.rest) }}
          />
        </div>
      )}
    </div>
  );
}

export default function ComprehensionGenerator() {
  const { preferences } = useUserPreferences();
  const [lastDiff, setLastDiff] = useState<string>("3-way");

  return (
    <AIToolPage
      assignable={true}
      title="Comprehension Generator"
      description="Create differentiated reading comprehension activities from any text"
      icon={<BookMarked className="w-5 h-5 text-white" />}
      accentColor="bg-sky-600"
      fields={[
        { id: "text", label: "Source Text", type: "textarea", placeholder: "Paste the reading passage here...", required: true, span: "full" },
        { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
        { id: "numQuestions", label: "Questions per Level", type: "select", options: [3,5,6,8,10].map(n => ({ value: String(n), label: String(n) })), span: "half" },
        { id: "questionTypes", label: "Question Types", type: "select", options: [
          { value: "mixed",    label: "Mixed (literal + inferential + evaluative)" },
          { value: "literal",  label: "Literal only" },
          { value: "inference", label: "Inference focused" },
          { value: "vipers",   label: "VIPERS format" },
        ], span: "half" },
        { id: "differentiation", label: "Differentiation", type: "select", options: [
          { value: "3-way",  label: "3-way (Support / Core / Extension)" },
          { value: "single", label: "Single level" },
          { value: "send",   label: "SEND adapted" },
        ], span: "half", onChange: (val: string) => setLastDiff(val) },
        { id: "includeAnswers", label: "Include Answer Key", type: "select", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], span: "half" },
        { id: "includeVocab", label: "Include Vocabulary Activity", type: "select", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], span: "half" },
      ]}
      buildPrompt={(v) => {
        setLastDiff(v.differentiation || "3-way");
        return {
          system: `You are an expert UK English teacher specialising in reading comprehension and literacy. You create high-quality comprehension activities that develop genuine reading skills. You use the VIPERS framework where appropriate.`,
          user: `Create a comprehension activity for ${v.yearGroup} based on this text:

${v.text}

Requirements:
- ${v.numQuestions || 5} questions per level
- Question types: ${v.questionTypes || "mixed"}
- Differentiation: ${v.differentiation || "3-way"}
- Include answer key: ${v.includeAnswers !== "no" ? "Yes" : "No"}
- Include vocabulary activity: ${v.includeVocab !== "no" ? "Yes" : "No"}

${v.differentiation === "3-way" ? `IMPORTANT — Structure output with EXACTLY these three headings on their own lines:
**Support Level**
(${v.numQuestions || 5} scaffolded questions with sentence starters, simpler vocabulary, guided prompts)

**Core Level**
(${v.numQuestions || 5} standard questions — a mix of literal and inferential)

**Extension Level**
(${v.numQuestions || 5} higher-order questions requiring analysis, evaluation, and extended writing)

Keep each level completely self-contained. Do NOT merge levels or reference other levels within a level.` : ""}

${v.questionTypes === "vipers" ? "Label each question with its VIPERS skill (V/I/P/E/R/S)" : ""}

For each question: clear question text, marks allocation${v.includeAnswers !== "no" ? ", model answer" : ""}.

${v.includeVocab !== "no" ? "\nAfter all levels: VOCABULARY ACTIVITY with 5-8 key words from the text — definition, example sentence, and a task." : ""}`,
          maxTokens: 4000,
        };
      }}
      outputTitle={(v) => `Comprehension Activity (${v.yearGroup})`}
      formatOutput={(text) => {
        if (lastDiff === "3-way") {
          const parsed = parse3Way(text);
          if (parsed) {
            // Return a sentinel that AIToolPage will render via dangerouslySetInnerHTML
            // We use a data attribute to pass the JSON so the custom renderer can pick it up
            return `<div data-3way="${encodeURIComponent(JSON.stringify(parsed))}"></div>`;
          }
        }
        return formatToolOutput(text, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#0284c7", emoji: "📖", title: "Comprehension" });
      }}
    />
  );
}
