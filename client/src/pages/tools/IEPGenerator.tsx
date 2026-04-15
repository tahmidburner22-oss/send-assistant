/**
 * EHCP Plan Generator — Adaptly
 *
 * A comprehensive, multi-stage Education, Health and Care Plan (EHCP) generator
 * built in accordance with the UK SEND Code of Practice 2015, the Children and
 * Families Act 2014, and the Equality Act 2010.
 *
 * Stages:
 *   1. Pupil Information — basic details, diagnosis, needs area, annual review date
 *   2. Evidence Upload   — reports, assessments (PDF/Word), manual text
 *   3. AI Extraction     — structured needs, strengths, current provision
 *   4. Plan Generation   — Sections A–H plus I (Placement) and K (Appendices)
 *   5. QA Review         — rule-based + AI golden thread check, compliance scoring
 *   6. Final Draft       — full render, per-section editing, PDF/Word export
 *
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { callAI, parseWithFixes } from "@/lib/ai";
import { exportToDocx } from "@/lib/docx-export";
import { downloadHtmlAsPdf, printWorksheetElement } from "@/lib/pdf-generator-v2";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import {
  Brain, Upload, FileText, CheckCircle, AlertCircle, ChevronRight,
  ChevronLeft, Sparkles, RefreshCw, Download, Printer, Copy,
  Shield, Target, Layers, PenLine, X, Check, Loader2,
  Users, BookOpen, Heart, Zap, FileDown, BarChart3, Info,
  ClipboardCheck, AlertTriangle, Star, ArrowRight, Eye, Link,
  Calendar, School, BookMarked,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = "info" | "evidence" | "extract" | "generate" | "qa" | "output";

interface PupilInfo {
  initials: string;
  yearGroup: string;
  primaryNeed: string;
  secondaryNeeds: string[];
  needsArea: string[];
  currentSchool: string;
  proposedPlacement: string;
  namedCaseworker: string;
  aspirations: string;
  parentConcerns: string;
  annualReviewDate: string;
  dateOfPlan: string;
  coprodEvidence: string; // Evidence of child/parent involvement
  // Multi-agency: Sections C, D, G, H
  healthNeeds: string;        // Section C — health needs related to SEN
  healthProvision: string;    // Section G — health provision to be provided
  socialCareNeeds: string;    // Section D — social care needs related to SEN
  socialCareProvision: string; // Section H — social care provision required
}

interface ExtractedData {
  strengths: string[];
  needs: string[];
  provision: string[];
  professionalRecommendations: string[];
  rawText: string;
}

interface EHCPSection {
  id: string;
  code: string;
  title: string;
  content: string;
}

interface QAResult {
  needsCount: number;
  outcomesCount: number;
  provisionCount: number;
  linkedProperly: boolean;
  gaps: string[];
  complianceScore: number;
  suggestions: string[];
  ruleChecks: { label: string; pass: boolean; detail: string }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const YEAR_GROUPS = [
  "Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6",
  "Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13",
];

const PRIMARY_NEEDS = [
  "Autism Spectrum Condition (ASC)",
  "Attention Deficit Hyperactivity Disorder (ADHD)",
  "Dyslexia",
  "Dyscalculia",
  "Dyspraxia / Developmental Coordination Disorder",
  "Speech, Language and Communication Needs (SLCN)",
  "Social, Emotional and Mental Health (SEMH)",
  "Moderate Learning Difficulties (MLD)",
  "Severe Learning Difficulties (SLD)",
  "Profound and Multiple Learning Difficulties (PMLD)",
  "Specific Learning Difficulty (SpLD)",
  "Hearing Impairment (HI)",
  "Visual Impairment (VI)",
  "Multi-Sensory Impairment (MSI)",
  "Physical Disability (PD)",
  "Acquired Brain Injury",
  "Complex Needs / Multiple Diagnoses",
  "Down Syndrome",
  "Cerebral Palsy",
  "Epilepsy",
  "Tourette Syndrome",
  "Anxiety / Mental Health",
  "Trauma / PTSD",
  "English as Additional Language with SEND",
];

const NEEDS_AREAS = [
  "Communication and Interaction",
  "Cognition and Learning",
  "Social, Emotional and Mental Health",
  "Sensory and/or Physical",
];

const STAGES: { id: Stage; label: string; icon: React.ElementType }[] = [
  { id: "info",     label: "Pupil Info",   icon: Users },
  { id: "evidence", label: "Evidence",     icon: Upload },
  { id: "extract",  label: "Extract",      icon: Brain },
  { id: "generate", label: "Generate",     icon: Sparkles },
  { id: "qa",       label: "QA Check",     icon: ClipboardCheck },
  { id: "output",   label: "Final Draft",  icon: FileText },
];

const SECTION_STYLES: Record<string, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  A: { color: "text-slate-700",  bg: "bg-slate-50",  border: "border-slate-200", icon: Users },
  B: { color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",  icon: Brain },
  C: { color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200",icon: Heart },
  D: { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200",icon: FileText },
  E: { color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200", icon: Target },
  F: { color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200",icon: Layers },
  G: { color: "text-cyan-700",   bg: "bg-cyan-50",   border: "border-cyan-200",  icon: Shield },
  H: { color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-200",  icon: Zap },
  I: { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200", icon: School },
  K: { color: "text-gray-700",   bg: "bg-gray-50",   border: "border-gray-200",  icon: BookMarked },
};

// ── Stage Progress Bar ────────────────────────────────────────────────────────

function StageBar({ current, completed }: { current: Stage; completed: Set<Stage> }) {
  const currentIdx = STAGES.findIndex(s => s.id === current);
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 no-print">
      {STAGES.map((stage, i) => {
        const Icon = stage.icon;
        const isDone = completed.has(stage.id) || i < currentIdx;
        const isCurrent = stage.id === current;
        return (
          <div key={stage.id} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isCurrent ? "bg-indigo-600 text-white shadow-sm"
              : isDone ? "bg-green-100 text-green-700"
              : "bg-muted text-muted-foreground"
            }`}>
              {isDone ? <CheckCircle className="w-3 h-3 flex-shrink-0" /> : <Icon className="w-3 h-3 flex-shrink-0" />}
              <span className="hidden sm:inline">{stage.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <ChevronRight className={`w-3 h-3 flex-shrink-0 ${i < currentIdx ? "text-green-500" : "text-muted-foreground/40"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Editable Section Card ─────────────────────────────────────────────────────

function SectionCard({ section, onEdit }: { section: EHCPSection; onEdit: (id: string, content: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(section.content);
  const style = SECTION_STYLES[section.code] || SECTION_STYLES.A;
  const Icon = style.icon;

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${style.border}`}>
      <div className={`px-4 py-3 flex items-center justify-between ${style.bg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border ${style.border} ${style.bg} ${style.color}`}>
            {section.code}
          </div>
          <p className={`text-sm font-bold ${style.color}`}>{section.title}</p>
        </div>
        <button
          onClick={() => { setDraft(section.content); setEditing(!editing); }}
          className={`p-1.5 rounded-lg text-xs flex items-center gap-1 hover:opacity-80 transition-opacity ${style.color}`}
        >
          {editing ? <X className="w-3.5 h-3.5" /> : <PenLine className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{editing ? "Cancel" : "Edit"}</span>
        </button>
      </div>
      <div className="px-4 py-4 bg-white">
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="min-h-[220px] text-sm font-mono resize-y"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5" onClick={() => { onEdit(section.id, draft); setEditing(false); toast.success("Section updated"); }}>
                <Check className="w-3.5 h-3.5" />Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(section.content); }}>
                <X className="w-3.5 h-3.5 mr-1" />Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{section.content}</div>
        )}
      </div>
    </div>
  );
}

// ── QA Score Badge ────────────────────────────────────────────────────────────

function QABadge({ score }: { score: number }) {
  const cls = score >= 80 ? "bg-green-100 text-green-700 border-green-300"
    : score >= 60 ? "bg-amber-100 text-amber-700 border-amber-300"
    : "bg-red-100 text-red-700 border-red-300";
  const label = score >= 80 ? "High Quality" : score >= 60 ? "Needs Review" : "Significant Gaps";
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-semibold text-sm ${cls}`}>
      <BarChart3 className="w-4 h-4" />{score}% — {label}
    </div>
  );
}

// ── Rule-based QA checks (deterministic, not AI-scored) ──────────────────────

function runRuleChecks(sections: EHCPSection[], extracted: ExtractedData | null): { label: string; pass: boolean; detail: string }[] {
  const sB = sections.find(s => s.code === "B")?.content || "";
  const sE = sections.find(s => s.code === "E")?.content || "";
  const sF = sections.find(s => s.code === "F")?.content || "";
  const sA = sections.find(s => s.code === "A")?.content || "";
  const sI = sections.find(s => s.code === "I")?.content || "";

  const outcomeCount = (sE.match(/---/g) || []).length + (sE.length > 50 ? 1 : 0);
  const provisionCount = (sF.match(/---/g) || []).length + (sF.length > 50 ? 1 : 0);
  const needCount = extracted?.needs.length || 0;

  return [
    {
      label: "Section B covers all selected EHCP areas",
      pass: NEEDS_AREAS.every(area => !sB || sB.toLowerCase().includes(area.toLowerCase().split(" ")[0])),
      detail: "Section B must address every area of need selected in pupil info",
    },
    {
      label: "SMART outcomes present in Section E",
      pass: outcomeCount >= 1 && sE.toLowerCase().includes("will be able to"),
      detail: "Each outcome must be specific, measurable, and time-bound",
    },
    {
      label: "Section F specifies who delivers each provision",
      pass: sF.toLowerCase().includes("delivered by") || sF.toLowerCase().includes("specialist") || sF.toLowerCase().includes("teacher"),
      detail: "Every provision must state who delivers it (SEND COP 2015, para 9.69)",
    },
    {
      label: "Section F specifies frequency and duration",
      pass: sF.toLowerCase().includes("session") || sF.toLowerCase().includes("week") || sF.toLowerCase().includes("minute"),
      detail: "Provisions must be quantified — how often, for how long",
    },
    {
      label: "Section A reflects child/parent voice",
      pass: sA.length > 100 && (sA.includes("I ") || sA.toLowerCase().includes("wish") || sA.toLowerCase().includes("hope") || sA.toLowerCase().includes("want")),
      detail: "Section A must be person-centred and include the child's own voice",
    },
    {
      label: "Section I (Placement) completed",
      pass: sI.length > 30,
      detail: "Section I must name the school/setting — legally required in a final EHCP",
    },
    {
      label: "Sufficient needs identified (≥3 in Section B)",
      pass: needCount >= 3 || sB.split("\n\n").filter(p => p.length > 40).length >= 3,
      detail: "A thorough Section B should describe all significant needs with evidence",
    },
    {
      label: "Outcomes and provisions roughly match needs",
      pass: outcomeCount >= 1 && provisionCount >= 1,
      detail: "Every need should ideally generate at least one outcome and one provision",
    },
  ];
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function EHCPPlanGenerator() {
  const { preferences } = useUserPreferences();
  const [stage, setStage] = useState<Stage>("info");
  const [completed, setCompleted] = useState<Set<Stage>>(new Set());
  const outputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pupilInfo, setPupilInfo] = useState<PupilInfo>({
    initials: "", yearGroup: "", primaryNeed: "", secondaryNeeds: [],
    needsArea: [], currentSchool: "", proposedPlacement: "", namedCaseworker: "",
    aspirations: "", parentConcerns: "", annualReviewDate: "", dateOfPlan: "",
    coprodEvidence: "",
    healthNeeds: "", healthProvision: "", socialCareNeeds: "", socialCareProvision: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [manualNotes, setManualNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);

  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");
  const [sections, setSections] = useState<EHCPSection[]>([]);

  const [qaLoading, setQaLoading] = useState(false);
  const [qaResult, setQaResult] = useState<QAResult | null>(null);

  const mark = (s: Stage) => setCompleted(prev => new Set([...prev, s]));

  const authHeaders = () => {
    return {};
  };

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const handleInfoNext = () => {
    if (!pupilInfo.initials.trim()) return toast.error("Please enter pupil initials");
    if (!pupilInfo.yearGroup) return toast.error("Please select a year group");
    if (!pupilInfo.primaryNeed) return toast.error("Please select a primary need");
    if (pupilInfo.needsArea.length === 0) return toast.error("Please select at least one EHCP area of need");
    mark("info"); setStage("evidence");
  };

  // ── Step 2 ────────────────────────────────────────────────────────────────
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = ["application/pdf","application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain"];
    const valid = Array.from(files).filter(f => allowed.includes(f.type) || f.name.endsWith(".txt"));
    if (!valid.length) return toast.error("Only PDF, Word (.docx) and text files are supported");
    setUploadedFiles(prev => [...prev, ...valid]);
    toast.success(`${valid.length} file${valid.length > 1 ? "s" : ""} added`);
  };

  const extractFileText = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("document", file);
    // Use the dedicated EHCP extraction endpoint — returns raw text without
    // any AI processing, preserving structure (line breaks, headings, scores)
    const res = await fetch("/api/ehcp/extract", { method: "POST", credentials: "include", body: fd });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed for ${file.name}`);
    }
    const { jobId } = await res.json();
    // Poll up to 90 seconds (large PDFs can take a moment)
    for (let i = 0; i < 45; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`/api/ehcp/job/${jobId}`, { credentials: "include" });
      const data = await poll.json();
      if (data.status === "done") return data.text || "";
      if (data.status === "error") throw new Error(data.error || `Processing failed for ${file.name}`);
    }
    throw new Error(`Timed out processing ${file.name} — please try a smaller file`);
  };

  const handleEvidenceNext = async () => {
    if (!uploadedFiles.length && !manualNotes.trim())
      return toast.error("Please upload at least one report or enter manual notes");
    setUploading(true);
    try {
      const texts: string[] = [];
      if (manualNotes.trim()) texts.push(`--- Manual Notes ---\n${manualNotes}`);
      for (const file of uploadedFiles) {
        toast.info(`Extracting: ${file.name}…`);
        const t = await extractFileText(file);
        if (t.trim()) texts.push(`--- ${file.name} ---\n${t}`);
      }
      setExtractedText(texts.join("\n\n"));
      mark("evidence"); setStage("extract");
    } catch (err: any) {
      toast.error(err.message || "Failed to process files");
    }
    setUploading(false);
  };

  // ── Step 3 ────────────────────────────────────────────────────────────────
  const handleExtract = async () => {
    const src = extractedText || manualNotes;
    if (!src.trim()) return toast.error("No evidence text available");
    setExtracting(true);
    try {
      const { text } = await callAI(
        `You are an expert Educational Psychologist and SENCO. Extract structured SEND information from professional reports. Be specific — include test scores, percentiles, and dates wherever they appear. Return valid JSON only — no markdown.`,
        `Extract structured information from these professional reports for ${pupilInfo.initials} (${pupilInfo.yearGroup}, ${pupilInfo.primaryNeed}).

DOCUMENTS:
${src.slice(0, 12000)}

Return exactly this JSON:
{
  "strengths": ["Specific strength with evidence e.g. 'Strong verbal reasoning (WISC-V VCI: 112, 79th percentile, assessed March 2025)'"],
  "needs": ["Specific need with evidence e.g. 'Phonological processing difficulty significantly below age-related expectations (CTOPP-2: 4th percentile, assessed by EP March 2025)'"],
  "provision": ["Current provision e.g. 'Weekly 1:1 SALT sessions (45 mins, NHS SALT team, started Jan 2025)'"],
  "professionalRecommendations": ["Specific recommendation from named professional e.g. 'EP Dr Smith recommends specialist literacy group 5x20 mins weekly using Barton Reading programme'"]
}

Rules:
- Include test scores, percentiles, dates, and professional names wherever mentioned
- Each item must be a complete, specific sentence — no vague generalisations
- Minimum 3 items per category where the evidence supports it
- Use professional SENCO/EP language throughout`,
        2500
      );
      const clean = text.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
      const parsed = parseWithFixes(clean);
      const data: ExtractedData = {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        needs: Array.isArray(parsed.needs) ? parsed.needs : [],
        provision: Array.isArray(parsed.provision) ? parsed.provision : [],
        professionalRecommendations: Array.isArray(parsed.professionalRecommendations) ? parsed.professionalRecommendations : [],
        rawText: src,
      };
      setExtracted(data);
      mark("extract");
      toast.success(`Extracted ${data.needs.length} needs, ${data.strengths.length} strengths`);
    } catch (err: any) { toast.error(err.message || "Extraction failed"); }
    setExtracting(false);
  };

  // ── Step 4 ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!extracted) return toast.error("Complete the extraction step first");
    setGenerating(true); setSections([]);

    // Determine review date — 12 months from today if not set
    const reviewDate = pupilInfo.annualReviewDate ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB");
    const planDate = pupilInfo.dateOfPlan || new Date().toLocaleDateString("en-GB");

    const sys = `You are an expert SENCO and EHCP writer with 15 years' experience. You write EHCPs that are fully compliant with the UK SEND Code of Practice 2015, Children and Families Act 2014, and Equality Act 2010.

MANDATORY REQUIREMENTS:
- Every need in Section B MUST link to at least one SMART outcome in Section E (the golden thread)
- Every outcome in Section E MUST have at least one specific provision in Section F
- Section B MUST address each of the pupil's selected EHCP areas separately with its own headed paragraph
- Section F provisions MUST contain all five legal elements: WHAT (description), HOW OFTEN (frequency), HOW LONG (duration), WHO DELIVERS (person/role), WHERE (setting/context)
- All outcomes must be SMART: specific, measurable, achievable, relevant, and time-bound to ${reviewDate}
- Use professional, strengths-based, person-centred language throughout
- Return valid JSON only — no markdown fences`;

    const baseInfo = `Pupil: ${pupilInfo.initials} | Year: ${pupilInfo.yearGroup} | Primary Need: ${pupilInfo.primaryNeed}
Secondary Needs: ${pupilInfo.secondaryNeeds.join(", ") || "None"}
EHCP Areas selected: ${pupilInfo.needsArea.join(", ")}
School: ${pupilInfo.currentSchool || "Not specified"}
Aspirations: ${pupilInfo.aspirations || "Not provided"}
Parent/Carer Concerns: ${pupilInfo.parentConcerns || "Not provided"}
Co-production evidence: ${pupilInfo.coprodEvidence || "Parents attended assessment meeting and agreed with findings"}
Annual Review Date: ${reviewDate}

IDENTIFIED NEEDS (${extracted.needs.length}) — each must appear in Section B:
${extracted.needs.map((n,i) => `${i+1}. ${n}`).join("\n")}

STRENGTHS — weave into Section A and B:
${extracted.strengths.map((s,i) => `${i+1}. ${s}`).join("\n")}

CURRENT PROVISION — reference in Section F where appropriate:
${extracted.provision.map((p,i) => `${i+1}. ${p}`).join("\n")}

PROFESSIONAL RECOMMENDATIONS — drive Section F content:
${extracted.professionalRecommendations.map((r,i) => `${i+1}. ${r}`).join("\n")}`;

    try {
      // ── Call 1: Sections A, B, C, D ──
      setGenProgress("Writing Sections A & B (Needs) — this is the most important part…");
      const { text: t1 } = await callAI(sys,
        `Write EHCP Sections A, B, C and D for:\n\n${baseInfo}

Return JSON:
{
  "sectionA": "2-3 paragraphs. First-person from the pupil where possible ('I enjoy...', 'I find it hard when...'). Include parent voice separately. Reference aspirations and strengths. Forward-looking and hopeful. Include: ${pupilInfo.coprodEvidence || 'reference to assessment meetings attended by pupil and parents'}.",
  "sectionB": "CRITICAL — write a separate headed paragraph for EACH of the pupil's areas of need: ${pupilInfo.needsArea.join(", ")}. Under each heading, describe the specific needs with evidence (test scores, professional observations). Address the impact on learning, social participation, and daily functioning. Each paragraph minimum 80 words. Total minimum 400 words. Include all ${extracted.needs.length} identified needs by name.",
  "sectionC": "Health needs related to SEN. Write a minimum of 2 sentences. If health needs have been identified (e.g. ADHD medication, sensory processing, anxiety, co-occurring medical conditions): describe the specific health needs, how they relate to the SEN, and any health input involved. If NO separate health needs have been identified beyond what is described in Section B, write: 'No health needs separate from the special educational needs described in Section B have been identified through the Education, Health and Care needs assessment process for ${pupilInfo.initials}. However, any health needs that emerge or are identified through subsequent review should be reported to the EHCP coordinator so that this section may be updated. The school should be informed of any health conditions, medication, or clinical appointments that may affect ${pupilInfo.initials}\'s attendance or participation.' Statutory note: This section should be completed in consultation with the NHS health commissioner responsible for the area.",
  "sectionD": "Social care needs related to SEN or to the child's disability. Write a minimum of 2 sentences. If social care needs have been identified: describe the specific needs, any open social care involvement, and the assessed needs. If NO separate social care needs have been identified, write: 'No social care needs separate from the special educational needs described in Section B have been identified through the Education, Health and Care needs assessment for ${pupilInfo.initials}. The family has not been referred to or is not currently open to children\'s social care services. Should any social care needs be identified in future, the Local Authority must be informed so that this section may be updated in accordance with Schedule 3 of the Children and Families Act 2014.' Include the name of the lead LA officer responsible for social care coordination if known."
}`,
        4000);
      const p1 = parseWithFixes(t1.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim());

      // ── Call 2: Section E (Outcomes) ──
      setGenProgress("Writing Section E — SMART outcomes with phased milestones…");
      const { text: t2 } = await callAI(sys,
        `Write EHCP Section E (Outcomes) for:\n\n${baseInfo}\n\nSection B already written:\n${(p1.sectionB || "").slice(0, 2000)}

CRITICAL RULES for Section E:
- Write one outcome per area of need (${pupilInfo.needsArea.join(", ")})
- Each outcome must be SMART and specify "By ${reviewDate}, ${pupilInfo.initials} will..."
- Include SHORT TERM milestone (3 months) and MEDIUM TERM milestone (6 months) under each outcome
- Link each outcome explicitly to the need it addresses in Section B
- Success criteria must be measurable (observable behaviour, quantified improvement, or assessment score)

Return JSON:
{"sectionE":[{"ref":"E1","area":"Communication and Interaction","outcome":"By ${reviewDate}, ${pupilInfo.initials} will be able to [specific measurable achievement]","shortTermMilestone":"By [3 months]: [observable step]","mediumTermMilestone":"By [6 months]: [observable step]","successCriteria":["Criterion 1 — measurable","Criterion 2 — measurable","Criterion 3 — measurable"],"linkedNeeds":["Reference to need(s) in Section B this addresses"]}]}`,
        3000);
      const p2 = parseWithFixes(t2.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim());

      // ── Call 3: Sections F, G, H ──
      setGenProgress("Writing Section F (Provision) — all five legal elements for each provision…");
      const outcomesStr = Array.isArray(p2.sectionE)
        ? p2.sectionE.map((o: any,i: number) => `${o.ref||`E${i+1}`}: ${o.outcome}`).join("\n")
        : "";
      const { text: t3 } = await callAI(sys,
        `Write EHCP Sections F, G and H for:\n\n${baseInfo}\n\nOutcomes (Section E):\n${outcomesStr}

CRITICAL RULES for Section F:
- Write Section F as flowing professional prose paragraphs, NOT bullet points
- Every provision MUST embed all five mandatory elements in the prose:
  1. WHAT: what the provision is
  2. HOW OFTEN: frequency (e.g. "five times per week")
  3. HOW LONG: duration per session (e.g. "for 30 minutes")
  4. WHO: delivered by whom (role and ideally qualification)
  5. WHERE: in what setting (e.g. "in a small group of no more than 4 pupils")
- Write a separate provision paragraph for each area of need
- Reference the professional recommendations: ${extracted.professionalRecommendations.slice(0,3).join("; ")}
- Each provision paragraph minimum 60 words

Return JSON:
{"sectionF":[{"ref":"F1","linkedOutcome":"E1","provision":"Full flowing prose paragraph with all five elements embedded. Example: '[Pupil initials] will receive specialist literacy support, delivered by a qualified specialist teacher (AMBDA or equivalent), five times per week for 30 minutes per session, in a small group of no more than 4 pupils. Sessions will use a structured, cumulative phonics programme and will be delivered within school during the core school day...'"}],"sectionG":"Health provision required (Section G). IMPORTANT: This section must specify any health services to be provided. Write in flowing prose. If health provision is required: specify WHAT provision (e.g. occupational therapy, speech and language therapy, CAMHS support, physiotherapy), HOW OFTEN (frequency), by WHOM (role and service), and WHERE delivered. If NO health provision is specified at this time, write the following statutory text verbatim: 'No health provision has been specified for ${pupilInfo.initials} at this time. The Local Authority is required to consult with the relevant NHS health commissioners (NHS England or the relevant Clinical Commissioning Group / Integrated Care Board) before the final EHCP is issued. Any health provision identified through that consultation process must be included in this section before the plan is finalised. Health provision included in an EHCP is binding on the NHS body responsible for commissioning it (Children and Families Act 2014, Section 42).'","sectionH":"Social care provision required (Section H). Write in flowing prose. Section H1 covers provision under s.2 of the Chronically Sick and Disabled Persons Act 1970. Section H2 covers other social care provision reasonably required. If social care provision is required: specify the provision, frequency, and responsible local authority team. If NO social care provision is required at this time, write: 'No social care provision under Section H is required for ${pupilInfo.initials} at this time. This determination was made following consideration of the child\'s needs as described in Sections C and D. Should social care needs arise or change, the EHCP must be reviewed and this section updated accordingly. The Local Authority\'s duty under Section 42 of the Children and Families Act 2014 extends to any social care provision specified in this section.'"}`,
        3000);
      const p3 = parseWithFixes(t3.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim());

      // ── Build all sections including I and K ──
      const built: EHCPSection[] = [
        {
          id:"sA", code:"A",
          title:"The Views, Wishes and Feelings of the Child and Their Parents/Carers",
          content: typeof p1.sectionA==="string" ? p1.sectionA
            : "Section A to be completed — record the child's and parents' views, wishes, and feelings in their own words.",
        },
        {
          id:"sB", code:"B",
          title:"Special Educational Needs",
          content: typeof p1.sectionB==="string" ? p1.sectionB : "Section B to be completed.",
        },
        {
          id:"sC", code:"C",
          title:"Health Needs Related to SEN",
          content: typeof p1.sectionC==="string" ? p1.sectionC
            : "No health needs separate from the special educational needs described in Section B have been identified at this time.",
        },
        {
          id:"sD", code:"D",
          title:"Social Care Needs Related to SEN",
          content: typeof p1.sectionD==="string" ? p1.sectionD
            : `No social care needs have been identified through the assessment process for ${pupilInfo.initials} that are separate from the special educational needs described in Section B. This section will be updated if circumstances change.`,
        },
        {
          id:"sE", code:"E",
          title:"Outcomes — What We Are Seeking to Achieve",
          content: Array.isArray(p2.sectionE)
            ? p2.sectionE.map((o: any, i: number) => {
                const ref = o.ref || `E${i+1}`;
                const criteria = Array.isArray(o.successCriteria)
                  ? o.successCriteria.map((c: string) => `  • ${c}`).join("\n") : "";
                const linkedNeeds = Array.isArray(o.linkedNeeds) ? o.linkedNeeds.join("; ") : (o.linkedNeeds || "");
                return [
                  `${ref}. ${o.outcome}`,
                  `\nArea: ${o.area || ""}`,
                  linkedNeeds ? `\nLinked Need(s): ${linkedNeeds}` : "",
                  o.shortTermMilestone ? `\nShort-term (3 months): ${o.shortTermMilestone}` : "",
                  o.mediumTermMilestone ? `\nMedium-term (6 months): ${o.mediumTermMilestone}` : "",
                  criteria ? `\nSuccess Criteria:\n${criteria}` : "",
                  `\nReview Date: ${reviewDate}`,
                ].filter(Boolean).join("");
              }).join("\n\n---\n\n")
            : (typeof p2.sectionE==="string" ? p2.sectionE : "Section E to be completed."),
        },
        {
          id:"sF", code:"F",
          title:"Special Educational Provision",
          content: Array.isArray(p3.sectionF)
            ? p3.sectionF.map((p: any, i: number) => {
                const ref = p.ref || `F${i+1}`;
                return `${ref}. ${p.provision || p.description || "Provision to be specified."}${p.linkedOutcome ? `\n\n[Linked to Outcome: ${p.linkedOutcome}]` : ""}`;
              }).join("\n\n---\n\n")
            : (typeof p3.sectionF==="string" ? p3.sectionF : "Section F to be completed."),
        },
        {
          id:"sG", code:"G",
          title:"Health Provision",
          content: typeof p3.sectionG==="string" ? p3.sectionG
            : "No health provision has been specified in this EHCP at this time. Any health provision required will be set out following consultation with the relevant health commissioners and clinical leads.",
        },
        {
          id:"sH", code:"H",
          title:"Social Care Provision",
          content: typeof p3.sectionH==="string" ? p3.sectionH
            : "No social care provision is required at this time. This section will be updated if the child's social care needs or circumstances change.",
        },
        {
          id:"sI", code:"I",
          title:"Placement — Name and Type of School or Other Institution",
          content: [
            pupilInfo.proposedPlacement || pupilInfo.currentSchool
              ? `${pupilInfo.initials} will attend: ${pupilInfo.proposedPlacement || pupilInfo.currentSchool}`
              : "The name and type of school or other institution to be named here. This section is completed by the Local Authority following consultation with the family and the proposed setting.",
            "",
            "Type of school/setting: [Mainstream / Special / Resourced provision / Independent special school — complete as appropriate]",
            "",
            "If the parents have expressed a preference for a particular school or type of school, this must be considered in accordance with Schedule 3 of the Children and Families Act 2014.",
            "",
            `Note: This EHCP draft was prepared on ${planDate}. The placement named in Section I becomes legally binding only when the final EHCP is issued by the Local Authority.`,
          ].join("\n"),
        },
        {
          id:"sK", code:"K",
          title:"Appendices — List of Documents Considered",
          content: [
            `The following documents were considered in preparing this EHCP for ${pupilInfo.initials}:`,
            "",
            uploadedFiles.length > 0
              ? uploadedFiles.map((f, i) => `${i+1}. ${f.name}`).join("\n")
              : "1. [List all reports, assessments and evidence considered — e.g. Educational Psychology report (date), Speech & Language Therapy assessment (date), school progress data (date)]",
            "",
            manualNotes.trim() ? "• Manual notes from assessment meetings and professional consultation" : "",
            "",
            "Any evidence considered but not listed above should be added here before the EHCP is finalised.",
          ].filter(l => l !== null).join("\n"),
        },
      ];

      setSections(built);
      setGenProgress("");
      mark("generate");
      setStage("qa");
      toast.success("EHCP draft generated — running quality check…");
    } catch (err: any) {
      toast.error(err.message || "Generation failed. Please try again.");
      setGenProgress("");
    }
    setGenerating(false);
  };

  // ── Step 5: QA — rule-based FIRST, then AI for nuance ────────────────────
  const handleQA = async () => {
    if (!sections.length) return;
    setQaLoading(true);
    try {
      // Run deterministic rule checks first
      const ruleChecks = runRuleChecks(sections, extracted);
      const ruleScore = Math.round((ruleChecks.filter(r => r.pass).length / ruleChecks.length) * 100);

      // Then run AI for gap analysis and suggestions
      const sB = sections.find(s => s.code==="B")?.content || "";
      const sE = sections.find(s => s.code==="E")?.content || "";
      const sF = sections.find(s => s.code==="F")?.content || "";
      const { text } = await callAI(
        `You are a senior SEND compliance officer. Review this EHCP for quality and legal compliance with the UK SEND Code of Practice 2015. Focus only on genuine gaps — do not invent problems. Return valid JSON only.`,
        `Review this EHCP for ${pupilInfo.initials} and identify genuine gaps or improvements.

SECTION B (Needs):\n${sB.slice(0,2000)}

SECTION E (Outcomes):\n${sE.slice(0,1500)}

SECTION F (Provision):\n${sF.slice(0,1500)}

Return JSON:
{"needsCount":<integer>,"outcomesCount":<integer>,"provisionCount":<integer>,"linkedProperly":<true/false>,"gaps":["Only real, specific gaps — maximum 5"],"suggestions":["Specific, actionable improvement — maximum 5"]}`,
        1500);
      const parsed = parseWithFixes(text.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim());

      // Blend rule score (60%) and AI score (40%) for final compliance score
      const aiScore = Math.min(95, Math.max(20, 50 + (parsed.linkedProperly ? 20 : 0) + (parsed.gaps?.length === 0 ? 15 : parsed.gaps?.length <= 2 ? 8 : 0)));
      const finalScore = Math.round(ruleScore * 0.6 + aiScore * 0.4);

      setQaResult({
        needsCount: parsed.needsCount || extracted?.needs.length || 0,
        outcomesCount: parsed.outcomesCount || 0,
        provisionCount: parsed.provisionCount || 0,
        linkedProperly: !!parsed.linkedProperly,
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
        complianceScore: finalScore,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        ruleChecks,
      });
      mark("qa");
    } catch { toast.error("QA check failed — you can still proceed to the draft"); }
    setQaLoading(false);
  };

  // ── Export helpers ────────────────────────────────────────────────────────
  const buildExportText = () =>
    sections.map(s => `=== SECTION ${s.code}: ${s.title.toUpperCase()} ===\n\n${s.content}`).join("\n\n\n");

  const handleCopy = () => { navigator.clipboard.writeText(buildExportText()); toast.success("Copied to clipboard"); };
  const handlePrint = () => { if (outputRef.current) printWorksheetElement(outputRef.current, { title: `EHCP Draft — ${pupilInfo.initials}` }); };
  const handlePdf = async () => {
    if (!outputRef.current) return;
    try {
      await downloadHtmlAsPdf(outputRef.current, `EHCP_${pupilInfo.initials.replace(/\./g,"")}_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success("PDF downloaded");
    } catch { toast.error("PDF generation failed"); }
  };
  const handleDocx = async () => {
    try {
      await exportToDocx({
        title: `EHCP Draft — ${pupilInfo.initials} (${pupilInfo.yearGroup})`,
        content: buildExportText(),
        subtitle: `${pupilInfo.currentSchool || "School TBC"} · Generated by Adaptly · ${new Date().toLocaleDateString("en-GB")} · Aligned with SEND Code of Practice 2015`,
        schoolName: preferences.schoolName,
      });
      toast.success("Word document downloaded");
    } catch { toast.error("Word export failed"); }
  };

  const editSection = (id: string, content: string) =>
    setSections(prev => prev.map(s => s.id===id ? { ...s, content } : s));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">EHCP Plan Generator</h1>
                <p className="text-indigo-200 text-sm mt-0.5">AI-assisted Education, Health and Care Plan drafting</p>
                <p className="text-indigo-300 text-xs mt-1">SEND Code of Practice 2015 · Children and Families Act 2014 · Equality Act 2010</p>
              </div>
            </div>
            <div className="flex-shrink-0 hidden sm:block">
              {preferences.schoolLogoUrl ? (
                <img src={preferences.schoolLogoUrl} alt="School logo" className="h-14 w-auto object-contain rounded-xl bg-white p-1.5" />
              ) : (
                <div className="bg-white rounded-xl px-3 py-2.5 text-center">
                  <div className="text-indigo-700 font-black text-xl tracking-tight leading-none">adaptly</div>
                  <div className="text-indigo-400 text-[9px] font-bold tracking-widest uppercase mt-1">SEND AI</div>
                </div>
              )}
              {preferences.schoolName && (
                <div className="text-[10px] text-indigo-300 text-center mt-1 max-w-[80px] leading-tight">{preferences.schoolName}</div>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 bg-white/10 rounded-lg p-2.5">
            <Info className="w-3.5 h-3.5 text-indigo-200 flex-shrink-0 mt-0.5" />
            <p className="text-indigo-200 text-xs leading-relaxed">
              This tool generates a <strong className="text-white">draft only</strong>. All output must be reviewed and approved by a qualified SENCO or caseworker before use as a statutory EHCP document. Use initials only — never enter full names (UK GDPR / DPA 2018).
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stage bar */}
      <StageBar current={stage} completed={completed} />

      <AnimatePresence mode="wait">

        {/* ── STAGE 1: Pupil Information ── */}
        {stage === "info" && (
          <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-bold text-sm">Step 1: Pupil Information</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Pupil Initials <span className="text-red-500">*</span></Label>
                    <Input value={pupilInfo.initials} onChange={e => setPupilInfo(p => ({...p, initials: e.target.value.slice(0,4)}))} placeholder="e.g. J.S." maxLength={4} className="h-10" />
                    <p className="text-[10px] text-muted-foreground">Max 4 chars — GDPR: initials only</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Year Group <span className="text-red-500">*</span></Label>
                    <select value={pupilInfo.yearGroup} onChange={e => setPupilInfo(p => ({...p, yearGroup: e.target.value}))} className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-indigo-600/30">
                      <option value="">Select…</option>
                      {YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Current School</Label>
                    <Input value={pupilInfo.currentSchool} onChange={e => setPupilInfo(p => ({...p, currentSchool: e.target.value}))} placeholder="Current school name" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Proposed Placement (Section I)</Label>
                    <Input value={pupilInfo.proposedPlacement} onChange={e => setPupilInfo(p => ({...p, proposedPlacement: e.target.value}))} placeholder="School to be named in EHCP" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Date of Plan</Label>
                    <Input type="date" value={pupilInfo.dateOfPlan} onChange={e => setPupilInfo(p => ({...p, dateOfPlan: e.target.value}))} className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1"><Calendar className="w-3 h-3" />Annual Review Date</Label>
                    <Input type="date" value={pupilInfo.annualReviewDate} onChange={e => setPupilInfo(p => ({...p, annualReviewDate: e.target.value}))} className="h-10" />
                    <p className="text-[10px] text-muted-foreground">Default: 12 months from today if blank</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Named Caseworker (optional)</Label>
                  <Input value={pupilInfo.namedCaseworker} onChange={e => setPupilInfo(p => ({...p, namedCaseworker: e.target.value}))} placeholder="SENCO or LA caseworker name" className="h-10" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Primary SEND Need <span className="text-red-500">*</span></Label>
                  <select value={pupilInfo.primaryNeed} onChange={e => setPupilInfo(p => ({...p, primaryNeed: e.target.value}))} className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-indigo-600/30">
                    <option value="">Select primary need…</option>
                    {PRIMARY_NEEDS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Co-occurring / Secondary Needs (optional)</Label>
                  <div className="border rounded-lg p-2 max-h-36 overflow-y-auto space-y-0.5">
                    {PRIMARY_NEEDS.filter(n => n !== pupilInfo.primaryNeed).map(n => (
                      <button key={n} type="button"
                        onClick={() => setPupilInfo(p => ({...p, secondaryNeeds: p.secondaryNeeds.includes(n) ? p.secondaryNeeds.filter(x=>x!==n) : [...p.secondaryNeeds,n]}))}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${pupilInfo.secondaryNeeds.includes(n) ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "hover:bg-muted/50 text-foreground"}`}>
                        {pupilInfo.secondaryNeeds.includes(n) && "✓ "}{n}
                      </button>
                    ))}
                  </div>
                  {pupilInfo.secondaryNeeds.length > 0 && <p className="text-[10px] text-indigo-600">{pupilInfo.secondaryNeeds.length} selected</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">EHCP Areas of Need <span className="text-red-500">*</span></Label>
                  <p className="text-[10px] text-muted-foreground">SEND Code of Practice 2015, Chapter 6 — select all that apply. Section B will have a headed paragraph for each.</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {NEEDS_AREAS.map(area => (
                      <button key={area} type="button"
                        onClick={() => setPupilInfo(p => ({...p, needsArea: p.needsArea.includes(area) ? p.needsArea.filter(x=>x!==area) : [...p.needsArea,area]}))}
                        className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${pupilInfo.needsArea.includes(area) ? "bg-indigo-50 border-indigo-300 text-indigo-800" : "border-border hover:border-indigo-300 hover:bg-indigo-50/50"}`}>
                        {pupilInfo.needsArea.includes(area) ? "✓ " : ""}{area}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Pupil & Parent Aspirations</Label>
                  <Textarea value={pupilInfo.aspirations} onChange={e => setPupilInfo(p => ({...p, aspirations: e.target.value}))} placeholder="What does the pupil want to achieve? What are parents' hopes for their child's future?" rows={3} className="text-sm resize-none" />
                  <p className="text-[10px] text-muted-foreground">Person-centred — feeds directly into Section A</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Parent/Carer Concerns</Label>
                  <Textarea value={pupilInfo.parentConcerns} onChange={e => setPupilInfo(p => ({...p, parentConcerns: e.target.value}))} placeholder="Key concerns raised by parents or carers during the assessment process…" rows={2} className="text-sm resize-none" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Co-production Evidence</Label>
                  <Input value={pupilInfo.coprodEvidence} onChange={e => setPupilInfo(p => ({...p, coprodEvidence: e.target.value}))} placeholder="e.g. Parents attended EP assessment 14/01/2026 and agreed findings" className="h-10 text-sm" />
                  <p className="text-[10px] text-muted-foreground">Required — EHCPs must evidence that the child and family were involved in planning</p>
                </div>

                <Button onClick={handleInfoNext} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                  Continue to Evidence Upload <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── STAGE 2: Evidence ── */}
        {stage === "evidence" && (
          <motion.div key="evidence" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-bold text-sm">Step 2: Evidence & Reports</h2>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                  <p className="text-xs text-indigo-800 font-medium mb-1.5">Suggested documents to upload</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] text-indigo-700">
                    {["EP (Educational Psychology) report","SALT (Speech & Language) assessment","OT (Occupational Therapy) assessment","School progress data / reports","Medical consultant letters","Specialist teacher assessments","Annual review documents","Parent/carer statement of views"].map(d => (
                      <span key={d} className="flex items-center gap-1"><span className="text-indigo-400">•</span>{d}</span>
                    ))}
                  </div>
                </div>

                <div
                  className="border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
                  onDragOver={e => e.preventDefault()}
                >
                  <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold">Drop reports here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, Word (.docx), or text files — up to 25MB each</p>
                  <Button size="sm" variant="outline" className="mt-3 border-indigo-300 text-indigo-600 hover:bg-indigo-50">Choose Files</Button>
                </div>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="hidden" onChange={e => addFiles(e.target.files)} />

                {uploadedFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">{uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} queued:</p>
                    {uploadedFiles.map((f,i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                        <FileText className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        <span className="text-xs flex-1 truncate">{f.name}</span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{(f.size/1024).toFixed(0)}KB</span>
                        <button onClick={() => setUploadedFiles(prev => prev.filter((_,j)=>j!==i))} className="p-0.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Additional Notes / Manual Input</Label>
                  <Textarea value={manualNotes} onChange={e => setManualNotes(e.target.value)} placeholder="Paste notes from meetings, verbal feedback from professionals, parent observations, or any information not in the uploaded files…" rows={4} className="text-sm resize-none" />
                  <p className="text-[10px] text-muted-foreground">You can use this alone without uploading files if you prefer</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStage("info")} className="gap-1.5"><ChevronLeft className="w-3.5 h-3.5" />Back</Button>
                  <Button onClick={handleEvidenceNext} disabled={uploading || (!uploadedFiles.length && !manualNotes.trim())} className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Processing files…</> : <><ArrowRight className="w-4 h-4" />Extract & Analyse</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── STAGE 3: Extract ── */}
        {stage === "extract" && (
          <motion.div key="extract" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-bold text-sm">Step 3: AI Needs Extraction</h2>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-700 space-y-1">
                  <p className="font-medium text-indigo-800">What the AI extracts from your documents:</p>
                  <p>• <strong>Needs</strong> — specific difficulties with test scores and percentiles where available</p>
                  <p>• <strong>Strengths</strong> — positive abilities and areas of relative strength</p>
                  <p>• <strong>Current Provision</strong> — support and interventions already in place</p>
                  <p>• <strong>Professional Recommendations</strong> — specific suggestions from assessors</p>
                </div>

                {!extracted && !extracting && (
                  <Button onClick={handleExtract} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    <Brain className="w-4 h-4" />Run AI Extraction
                  </Button>
                )}

                {extracting && (
                  <div className="text-center py-10 space-y-3">
                    <Brain className="w-10 h-10 text-indigo-600 mx-auto animate-pulse" />
                    <p className="text-sm font-semibold">Analysing reports…</p>
                    <p className="text-xs text-muted-foreground">Reading documents and extracting structured needs data</p>
                  </div>
                )}

                {extracted && !extracting && (
                  <div className="space-y-3">
                    {([
                       { key: "needs" as const, label: "Identified Needs", icon: Brain, cls: "bg-blue-50 border-blue-200 text-blue-800" },
                       { key: "strengths" as const, label: "Identified Strengths", icon: Star, cls: "bg-green-50 border-green-200 text-green-800" },
                       { key: "provision" as const, label: "Current Provision", icon: Shield, cls: "bg-amber-50 border-amber-200 text-amber-800" },
                       { key: "professionalRecommendations" as const, label: "Professional Recommendations", icon: BookOpen, cls: "bg-purple-50 border-purple-200 text-purple-800" },
                    ] as const).map(({ key, label, icon: Icon, cls }) => (
                      <div key={key} className={`rounded-lg border p-3 ${cls.split(" ").slice(0,2).join(" ")}`}>
                        <div className={`flex items-center gap-2 mb-2 ${cls.split(" ")[2]}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <p className="text-xs font-bold uppercase tracking-wide">{label} ({extracted[key].length})</p>
                        </div>
                        {extracted[key].length === 0
                          ? <p className="text-xs text-muted-foreground italic">None identified — add more evidence or enter details manually</p>
                          : <ul className="space-y-1">{extracted[key].map((item,i) => (
                              <li key={i} className="text-xs flex items-start gap-1.5"><span className="font-bold flex-shrink-0 mt-0.5">{i+1}.</span><span className="leading-relaxed">{item}</span></li>
                            ))}</ul>
                        }
                      </div>
                    ))}

                    {extractedText && (
                      <details>
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                          <Eye className="w-3 h-3" />View raw extracted text ({extractedText.length.toLocaleString()} chars)
                        </summary>
                        <div className="mt-2 p-3 bg-muted/30 rounded-lg max-h-36 overflow-y-auto">
                          <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap">{extractedText.slice(0,2000)}{extractedText.length>2000?"…":""}</pre>
                        </div>
                      </details>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleExtract} disabled={extracting} className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />Re-extract
                      </Button>
                      <Button onClick={() => { mark("extract"); setStage("generate"); }} className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        Generate EHCP Draft <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button variant="ghost" size="sm" onClick={() => setStage("evidence")} className="gap-1.5 text-muted-foreground">
                  <ChevronLeft className="w-3.5 h-3.5" />Back
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── STAGE 4: Generate ── */}
        {stage === "generate" && (
          <motion.div key="generate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-bold text-sm">Step 4: Generate EHCP Draft</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {([
                    { code:"A", title:"Views & Aspirations" },
                    { code:"B", title:"Needs (per area)" },
                    { code:"C", title:"Health Needs" },
                    { code:"D", title:"Social Care" },
                    { code:"E", title:"SMART Outcomes" },
                    { code:"F", title:"Provision (5 elements)" },
                    { code:"G", title:"Health Provision" },
                    { code:"H", title:"Social Care Provision" },
                    { code:"I", title:"Placement" },
                    { code:"K", title:"Appendices" },
                  ] as const).map(s => {
                    const style = SECTION_STYLES[s.code];
                    return (
                      <div key={s.code} className={`flex items-start gap-2 p-2.5 rounded-lg border ${style.border} ${style.bg}`}>
                        <div className={`w-6 h-6 rounded font-black text-xs flex items-center justify-center flex-shrink-0 ${style.color}`}>{s.code}</div>
                        <p className={`text-[10px] font-semibold leading-tight ${style.color}`}>{s.title}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-start gap-2">
                  <Link className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-indigo-800">Golden Thread + All 5 Provision Elements</p>
                    <p className="text-[10px] text-indigo-700 mt-0.5">Every need in Section B links to a SMART outcome in E and specific provision in F. Each provision in Section F will include: what, how often, how long, who delivers, and where — as required by SEND COP 2015 para 9.69.</p>
                  </div>
                </div>

                {generating ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto">
                      <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                    <p className="text-sm font-bold">Generating your EHCP draft…</p>
                    <p className="text-xs text-muted-foreground">{genProgress || "Writing all sections…"}</p>
                    <div className="flex justify-center gap-1">
                      {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStage("extract")} className="gap-1.5"><ChevronLeft className="w-3.5 h-3.5" />Back</Button>
                    <Button onClick={handleGenerate} className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                      <Sparkles className="w-4 h-4" />Generate Full EHCP Draft (Sections A–K)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── STAGE 5: QA ── */}
        {stage === "qa" && (
          <motion.div key="qa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-amber-600" />
                  <h2 className="font-bold text-sm">Step 5: Quality Assurance Review</h2>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 space-y-1">
                  <p className="font-medium text-amber-800">Two-layer QA check:</p>
                  <p>• <strong>Rule-based checks</strong> — deterministic tests against SEND COP legal requirements</p>
                  <p>• <strong>AI review</strong> — nuanced gap analysis and improvement suggestions</p>
                  <p>• <strong>Blended score</strong> — 60% rule checks, 40% AI assessment</p>
                </div>

                {!qaResult && !qaLoading && (
                  <Button onClick={handleQA} className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white gap-2">
                    <ClipboardCheck className="w-4 h-4" />Run QA Check
                  </Button>
                )}

                {qaLoading && (
                  <div className="text-center py-8 space-y-3">
                    <ClipboardCheck className="w-10 h-10 text-amber-600 mx-auto animate-pulse" />
                    <p className="text-sm font-semibold">Reviewing EHCP quality…</p>
                    <p className="text-xs text-muted-foreground">Running rule checks + AI compliance review</p>
                  </div>
                )}

                {qaResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div>
                        <p className="text-xs font-bold mb-1.5">EHCP Quality Score</p>
                        <QABadge score={qaResult.complianceScore} />
                      </div>
                      <div className="text-right space-y-0.5 text-xs">
                        <div><span className="font-semibold">{qaResult.needsCount}</span> <span className="text-muted-foreground">needs</span></div>
                        <div><span className="font-semibold">{qaResult.outcomesCount}</span> <span className="text-muted-foreground">outcomes</span></div>
                        <div><span className="font-semibold">{qaResult.provisionCount}</span> <span className="text-muted-foreground">provisions</span></div>
                      </div>
                    </div>

                    {/* Rule-based checks */}
                    {qaResult.ruleChecks && qaResult.ruleChecks.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-foreground">Legal Requirement Checks</p>
                        {qaResult.ruleChecks.map((check, i) => (
                          <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${check.pass ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                            {check.pass
                              ? <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                              : <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />}
                            <div>
                              <p className={`font-semibold ${check.pass ? "text-green-800" : "text-red-800"}`}>{check.label}</p>
                              {!check.pass && <p className="text-red-700 mt-0.5">{check.detail}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={`flex items-center gap-2.5 p-3 rounded-lg border ${qaResult.linkedProperly ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                      {qaResult.linkedProperly ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
                      <div>
                        <p className={`text-xs font-bold ${qaResult.linkedProperly ? "text-green-800" : "text-amber-800"}`}>
                          Golden Thread: {qaResult.linkedProperly ? "Complete ✓" : "Gaps Detected"}
                        </p>
                        <p className={`text-[10px] ${qaResult.linkedProperly ? "text-green-700" : "text-amber-700"}`}>
                          {qaResult.linkedProperly ? "All needs linked to outcomes and provision" : "Some needs may lack corresponding outcomes or provision"}
                        </p>
                      </div>
                    </div>

                    {qaResult.gaps.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />Issues to Address ({qaResult.gaps.length})</p>
                        <ul className="space-y-1">{qaResult.gaps.map((g,i) => <li key={i} className="text-xs text-red-700 flex items-start gap-1.5"><span className="flex-shrink-0 mt-0.5">•</span>{g}</li>)}</ul>
                      </div>
                    )}

                    {qaResult.suggestions.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Improvement Suggestions</p>
                        <ul className="space-y-1">{qaResult.suggestions.map((s,i) => <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5"><span className="font-bold flex-shrink-0">{i+1}.</span>{s}</li>)}</ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleQA} disabled={qaLoading} className="gap-1.5"><RefreshCw className="w-3.5 h-3.5" />Re-check</Button>
                      <Button onClick={() => { mark("qa"); setStage("output"); }} className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        View Final Draft <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button variant="ghost" size="sm" onClick={() => { mark("qa"); setStage("output"); }} className="w-full gap-1.5 text-muted-foreground">
                  Skip QA and view draft <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── STAGE 6: Output ── */}
        {stage === "output" && sections.length > 0 && (
          <motion.div key="output" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-2 items-center no-print">
                <Button variant="outline" size="sm" onClick={() => setStage("qa")} className="gap-1.5"><ChevronLeft className="w-3.5 h-3.5" />Back to QA</Button>
                {qaResult && <QABadge score={qaResult.complianceScore} />}
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5"><Copy className="w-3.5 h-3.5" />Copy</Button>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5"><Printer className="w-3.5 h-3.5" />Print</Button>
                  <Button variant="outline" size="sm" onClick={handlePdf} className="gap-1.5"><Download className="w-3.5 h-3.5" />PDF</Button>
                  <Button variant="outline" size="sm" onClick={handleDocx} className="gap-1.5"><FileDown className="w-3.5 h-3.5" />Word</Button>
                </div>
              </div>

              {/* Document */}
              <div ref={outputRef}>
                {/* Cover header */}
                <div className="bg-gradient-to-br from-indigo-800 to-indigo-950 rounded-2xl p-6 text-white mb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1.5">Education, Health and Care Plan — Draft</div>
                      <h1 className="text-2xl font-black leading-tight">EHCP — {pupilInfo.initials}</h1>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-indigo-200">
                        {pupilInfo.yearGroup && <span>{pupilInfo.yearGroup}</span>}
                        {pupilInfo.primaryNeed && <span>· {pupilInfo.primaryNeed}</span>}
                        {pupilInfo.currentSchool && <span>· {pupilInfo.currentSchool}</span>}
                      </div>
                      {pupilInfo.needsArea.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {pupilInfo.needsArea.map(a => (
                            <span key={a} className="text-[10px] bg-white/15 text-indigo-100 px-2 py-0.5 rounded-full font-medium">{a}</span>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-indigo-300">
                        {pupilInfo.dateOfPlan && <span>Plan date: {pupilInfo.dateOfPlan}</span>}
                        {pupilInfo.annualReviewDate && <span>Annual review: {pupilInfo.annualReviewDate}</span>}
                        {pupilInfo.namedCaseworker && <span>Caseworker: {pupilInfo.namedCaseworker}</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0 hidden sm:block">
                      {preferences.schoolLogoUrl ? (
                        <img src={preferences.schoolLogoUrl} alt="School logo" className="h-14 w-auto object-contain rounded-xl bg-white p-1.5" />
                      ) : (
                        <div className="bg-white rounded-xl px-3 py-2.5 text-center">
                          <div className="text-indigo-700 font-black text-xl tracking-tight leading-none">adaptly</div>
                          <div className="text-indigo-400 text-[9px] font-bold tracking-widest uppercase mt-1">SEND AI</div>
                        </div>
                      )}
                      {preferences.schoolName && (
                        <div className="text-[10px] text-indigo-300 text-center mt-1 max-w-[80px] leading-tight">{preferences.schoolName}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Needs Identified", value: String(extracted?.needs.length ?? 0) },
                      { label: "SMART Outcomes", value: String(sections.find(s=>s.code==="E")?.content.split("---").filter(Boolean).length ?? 0) },
                      { label: "Provisions", value: String(sections.find(s=>s.code==="F")?.content.split("---").filter(Boolean).length ?? 0) },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white/10 rounded-xl p-2.5">
                        <div className="text-xl font-black">{stat.value}</div>
                        <div className="text-[10px] text-indigo-300 mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-[10px] text-indigo-300">
                    <Info className="w-3 h-3" />
                    Draft prepared {new Date().toLocaleDateString("en-GB")} · Must be reviewed by a qualified SENCO before use as a statutory document
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-4">
                  {sections.map(section => (
                    <SectionCard key={section.id} section={section} onEdit={editSection} />
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Generated by <strong className="text-indigo-600">Adaptly</strong> — AI-assisted SEND planning</span>
                  <span>Aligned with SEND Code of Practice 2015 · Not for statutory use without professional review</span>
                </div>
              </div>

              <Button variant="outline" onClick={handleGenerate} disabled={generating} className="w-full gap-2 no-print">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Regenerating…</> : <><RefreshCw className="w-4 h-4" />Regenerate All Sections</>}
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
