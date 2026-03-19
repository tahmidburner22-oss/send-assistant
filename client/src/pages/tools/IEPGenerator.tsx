/**
 * EHCP Plan Generator — Adaptly
 *
 * A comprehensive, multi-stage Education, Health and Care Plan (EHCP) generator
 * built in accordance with the UK SEND Code of Practice 2015, the Children and
 * Families Act 2014, and the Equality Act 2010.
 *
 * Stages:
 *   1. Pupil Information — basic details, diagnosis, needs area
 *   2. Evidence Upload   — reports, assessments (PDF/Word), manual text
 *   3. AI Extraction     — structured needs, strengths, current provision
 *   4. Plan Generation   — Sections A, B, C, D, E, F, G, H
 *   5. QA Review         — golden thread check, compliance scoring
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
  namedCaseworker: string;
  aspirations: string;
  parentConcerns: string;
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function EHCPPlanGenerator() {
  const { preferences } = useUserPreferences();
  const [stage, setStage] = useState<Stage>("info");
  const [completed, setCompleted] = useState<Set<Stage>>(new Set());
  const outputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pupilInfo, setPupilInfo] = useState<PupilInfo>({
    initials: "", yearGroup: "", primaryNeed: "", secondaryNeeds: [],
    needsArea: [], currentSchool: "", namedCaseworker: "", aspirations: "", parentConcerns: "",
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
    const token = localStorage.getItem("send_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
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
    fd.append("language", "en");
    fd.append("yearGroup", "year10");
    const res = await fetch("/api/revision/upload", { method: "POST", headers: authHeaders(), credentials: "include", body: fd });
    if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
    const { jobId } = await res.json();
    const token = localStorage.getItem("send_token");
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`/api/revision/job/${jobId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include",
      });
      const data = await poll.json();
      if (data.status === "done") return data.text || "";
      if (data.status === "error") throw new Error(data.error || `Processing failed for ${file.name}`);
    }
    throw new Error(`Timed out processing ${file.name}`);
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
        `You are an expert Educational Psychologist and SENCO. Extract structured SEND information from reports. Return valid JSON only — no markdown.`,
        `Extract structured information from these reports for ${pupilInfo.initials} (${pupilInfo.yearGroup}, ${pupilInfo.primaryNeed}).

DOCUMENTS:
${src.slice(0, 12000)}

Return exactly this JSON:
{
  "strengths": ["Specific strength with evidence e.g. 'Strong verbal reasoning (WISC-V VCI: 112, 79th percentile)'"],
  "needs": ["Specific need with evidence e.g. 'Phonological processing difficulty (CTOPP-2: 4th percentile)'"],
  "provision": ["Current provision e.g. 'Weekly 1:1 SALT (45 mins, NHS)'"],
  "professionalRecommendations": ["Specific recommendation e.g. 'EP recommends literacy group 5x20 mins weekly'"]
}

Rules: include test scores/percentiles where mentioned. Each item must be a specific, complete sentence. Minimum 3 items per category where evidence supports.`,
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

    const sys = `You are an expert SENCO and EHCP writer. You write EHCPs compliant with the UK SEND Code of Practice 2015, Children and Families Act 2014, and Equality Act 2010. Every need in Section B must link to an outcome in Section E and provision in Section F (the golden thread). Outcomes must be SMART and within 12 months. Provisions must specify frequency, duration, who delivers, and setting. Return valid JSON only.`;
    const baseInfo = `Pupil: ${pupilInfo.initials} | Year: ${pupilInfo.yearGroup} | Primary Need: ${pupilInfo.primaryNeed}
Secondary Needs: ${pupilInfo.secondaryNeeds.join(", ") || "None"}
EHCP Areas: ${pupilInfo.needsArea.join(", ")}
Aspirations: ${pupilInfo.aspirations || "Not provided"}
Parent Concerns: ${pupilInfo.parentConcerns || "Not provided"}

NEEDS (${extracted.needs.length}):
${extracted.needs.map((n,i) => `${i+1}. ${n}`).join("\n")}

STRENGTHS:
${extracted.strengths.map((s,i) => `${i+1}. ${s}`).join("\n")}

CURRENT PROVISION:
${extracted.provision.map((p,i) => `${i+1}. ${p}`).join("\n")}

PROFESSIONAL RECOMMENDATIONS:
${extracted.professionalRecommendations.map((r,i) => `${i+1}. ${r}`).join("\n")}`;

    try {
      setGenProgress("Writing Sections A, B and C (Needs)…");
      const { text: t1 } = await callAI(sys,
        `Write EHCP Sections A, B and C for:\n\n${baseInfo}\n\nReturn JSON:\n{"sectionA":"Views and aspirations of the child and parents — 2-3 paragraphs, first-person from pupil where appropriate, referencing wishes for the future. Person-centred, strengths-based, forward-looking.","sectionB":"Full Section B: Special Educational Needs — comprehensive, area-specific description of ALL needs. Each EHCP area must be clearly addressed. Specific, evidenced, impact-focused. 400-600 words of professional prose.","sectionC":"Section C: Health Needs — describe any health needs relevant to special educational needs, or state no separate health needs identified."}`,
        3500);
      const p1 = parseWithFixes(t1.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim());

      setGenProgress("Writing Section E (Outcomes)…");
      const { text: t2 } = await callAI(sys,
        `Write EHCP Section E (Outcomes) for:\n\n${baseInfo}\n\nSection B (Needs):\n${p1.sectionB || ""}\n\nReturn JSON:\n{"sectionE":[{"ref":"E1","area":"Communication and Interaction","outcome":"By [12 months from now], [initials] will be able to [specific measurable achievement]","successCriteria":["Measurable indicator 1","Measurable indicator 2","Measurable indicator 3"],"linkedNeed":"Reference to specific need in Section B"}]}`,
        2500);
      const p2 = parseWithFixes(t2.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim());

      setGenProgress("Writing Section F (Provision) and Sections G–H…");
      const outcomesStr = Array.isArray(p2.sectionE) ? p2.sectionE.map((o: any,i: number) => `${o.ref||`E${i+1}`}: ${o.outcome}`).join("\n") : "";
      const { text: t3 } = await callAI(sys,
        `Write EHCP Sections F, G and H for:\n\n${baseInfo}\n\nOutcomes (Section E):\n${outcomesStr}\n\nReturn JSON:\n{"sectionF":[{"ref":"F1","description":"Specific provision","frequency":"e.g. 5 sessions/week","duration":"e.g. 30 minutes","deliveredBy":"e.g. Specialist Teacher","setting":"e.g. Small group","linkedOutcome":"E1"}],"sectionG":"Health provision or state none required","sectionH":"Social care provision or state none required"}`,
        2500);
      const p3 = parseWithFixes(t3.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim());

      // Build sections
      const built: EHCPSection[] = [
        {
          id:"sA", code:"A",
          title:"The Views, Wishes and Feelings of the Child and Their Parents",
          content: typeof p1.sectionA==="string" ? p1.sectionA : "Section A to be completed — record the child's and parents' views and wishes.",
        },
        {
          id:"sB", code:"B",
          title:"Special Educational Needs",
          content: typeof p1.sectionB==="string" ? p1.sectionB : "Section B to be completed.",
        },
        {
          id:"sC", code:"C",
          title:"Health Needs",
          content: typeof p1.sectionC==="string" ? p1.sectionC : "No health needs separate from special educational needs have been identified at this time.",
        },
        {
          id:"sD", code:"D",
          title:"Social Care Needs",
          content: `This section describes any social care needs of ${pupilInfo.initials} that relate to their disability or condition.\n\nNo social care needs have been identified through the assessment process that are separate from the special educational needs described in Section B. This section will be updated following any social care assessment or if the child's circumstances change.`,
        },
        {
          id:"sE", code:"E",
          title:"Outcomes — What We Are Seeking to Achieve",
          content: Array.isArray(p2.sectionE)
            ? p2.sectionE.map((o: any, i: number) => {
                const ref = o.ref || `E${i+1}`;
                const criteria = Array.isArray(o.successCriteria) ? o.successCriteria.map((c: string) => `  • ${c}`).join("\n") : "";
                return `${ref}. ${o.outcome}\n\nArea: ${o.area||""}\nLinked Need: ${o.linkedNeed||""}\n\nSuccess Criteria:\n${criteria}`;
              }).join("\n\n---\n\n")
            : (typeof p2.sectionE==="string" ? p2.sectionE : "Section E to be completed."),
        },
        {
          id:"sF", code:"F",
          title:"Special Educational Provision",
          content: Array.isArray(p3.sectionF)
            ? p3.sectionF.map((p: any, i: number) => {
                const ref = p.ref || `F${i+1}`;
                return `${ref}. ${p.description}\n\nFrequency: ${p.frequency||"To be specified"}\nDuration: ${p.duration||"To be specified"}\nDelivered by: ${p.deliveredBy||"To be specified"}\nSetting: ${p.setting||"To be specified"}\nLinked Outcome: ${p.linkedOutcome||""}`;
              }).join("\n\n---\n\n")
            : (typeof p3.sectionF==="string" ? p3.sectionF : "Section F to be completed."),
        },
        {
          id:"sG", code:"G",
          title:"Health Provision",
          content: typeof p3.sectionG==="string" ? p3.sectionG : "No health provision has been specified in this EHCP. Any health provision required will be set out following consultation with relevant health commissioners.",
        },
        {
          id:"sH", code:"H",
          title:"Social Care Provision",
          content: typeof p3.sectionH==="string" ? p3.sectionH : "No social care provision is required at this time. This section will be updated if the child's circumstances or needs change.",
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

  // ── Step 5 ────────────────────────────────────────────────────────────────
  const handleQA = async () => {
    if (!sections.length) return;
    setQaLoading(true);
    try {
      const sB = sections.find(s => s.code==="B")?.content || "";
      const sE = sections.find(s => s.code==="E")?.content || "";
      const sF = sections.find(s => s.code==="F")?.content || "";
      const { text } = await callAI(
        `You are a senior SEND compliance officer reviewing EHCPs for quality and legal compliance with the UK SEND Code of Practice 2015. Return valid JSON only.`,
        `Review this EHCP for ${pupilInfo.initials} and provide a quality assessment.

SECTION B (Needs):\n${sB.slice(0,2500)}

SECTION E (Outcomes):\n${sE.slice(0,2000)}

SECTION F (Provision):\n${sF.slice(0,2000)}

Return JSON:
{"needsCount":<number of distinct needs in B>,"outcomesCount":<number of outcomes in E>,"provisionCount":<number of provisions in F>,"linkedProperly":<true/false>,"gaps":["specific gap or issue"],"complianceScore":<0-100>,"suggestions":["specific actionable improvement"]}

Scoring: golden thread linkage (40pts), SMART outcomes (30pts), specific provision (30pts).`,
        2000);
      const parsed = parseWithFixes(text.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim());
      setQaResult({
        needsCount: parsed.needsCount || 0,
        outcomesCount: parsed.outcomesCount || 0,
        provisionCount: parsed.provisionCount || 0,
        linkedProperly: !!parsed.linkedProperly,
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
        complianceScore: parsed.complianceScore || 0,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
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
    try { await downloadHtmlAsPdf(outputRef.current, `EHCP_${pupilInfo.initials.replace(/\./g,"")}_${new Date().toISOString().slice(0,10)}.pdf`); toast.success("PDF downloaded"); }
    catch { toast.error("PDF generation failed"); }
  };
  const handleDocx = async () => {
    try {
      await exportToDocx({ title: `EHCP Draft — ${pupilInfo.initials} (${pupilInfo.yearGroup})`, content: buildExportText(), subtitle: `Generated by Adaptly · ${new Date().toLocaleDateString("en-GB")} · Aligned with SEND Code of Practice 2015` });
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
            <div className="flex-shrink-0 bg-white rounded-xl px-3 py-2 text-center hidden sm:block">
              <div className="text-indigo-700 font-black text-base tracking-tight leading-none">adaptly</div>
              <div className="text-indigo-400 text-[9px] font-bold tracking-widest uppercase mt-0.5">SEND AI</div>
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
                    <p className="text-[10px] text-muted-foreground">Max 4 chars — GDPR: initials only, no full names</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Year Group <span className="text-red-500">*</span></Label>
                    <select value={pupilInfo.yearGroup} onChange={e => setPupilInfo(p => ({...p, yearGroup: e.target.value}))} className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-indigo-600/30">
                      <option value="">Select…</option>
                      {YEAR_GROUPS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">School (optional)</Label>
                    <Input value={pupilInfo.currentSchool} onChange={e => setPupilInfo(p => ({...p, currentSchool: e.target.value}))} placeholder="School name" className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Named Caseworker (optional)</Label>
                    <Input value={pupilInfo.namedCaseworker} onChange={e => setPupilInfo(p => ({...p, namedCaseworker: e.target.value}))} placeholder="SENCO or LA caseworker" className="h-10" />
                  </div>
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
                  <p className="text-[10px] text-muted-foreground">SEND Code of Practice 2015, Chapter 6 — select all that apply</p>
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
                  <Label className="text-xs font-medium">Pupil & Parent Aspirations (optional)</Label>
                  <Textarea value={pupilInfo.aspirations} onChange={e => setPupilInfo(p => ({...p, aspirations: e.target.value}))} placeholder="What does the pupil want to achieve? What are parents' hopes for their child?" rows={3} className="text-sm resize-none" />
                  <p className="text-[10px] text-muted-foreground">Person-centred — feeds into Section A of the EHCP</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Parent/Carer Concerns (optional)</Label>
                  <Textarea value={pupilInfo.parentConcerns} onChange={e => setPupilInfo(p => ({...p, parentConcerns: e.target.value}))} placeholder="Key concerns raised by parents or carers during the assessment process…" rows={2} className="text-sm resize-none" />
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
                  <Label className="text-xs font-medium">Additional Notes / Manual Input (optional)</Label>
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
                  <p className="font-medium text-indigo-800">What the AI extracts:</p>
                  <p>• <strong>Needs</strong> — specific, evidenced difficulties with test scores where available</p>
                  <p>• <strong>Strengths</strong> — positive abilities and areas of relative strength</p>
                  <p>• <strong>Current Provision</strong> — support and interventions already in place</p>
                  <p>• <strong>Recommendations</strong> — specific suggestions from professionals</p>
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
                    {([ { key: "needs" as const, label: "Identified Needs", icon: Brain, cls: "bg-blue-50 border-blue-200 text-blue-800" },
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { code:"A", title:"Views & Aspirations", desc:"Person-centred" },
                    { code:"B", title:"Needs", desc:"Evidenced, specific" },
                    { code:"C", title:"Health Needs", desc:"Health-related" },
                    { code:"D", title:"Social Care Needs", desc:"Social care" },
                    { code:"E", title:"Outcomes", desc:"SMART, 12-month" },
                    { code:"F", title:"Provision", desc:"Specific, assigned" },
                    { code:"G", title:"Health Provision", desc:"NHS provision" },
                    { code:"H", title:"Social Care Provision", desc:"Social care" },
                  ] as const).map(s => {
                    const style = SECTION_STYLES[s.code];
                    return (
                      <div key={s.code} className={`flex items-start gap-2 p-2.5 rounded-lg border ${style.border} ${style.bg}`}>
                        <div className={`w-6 h-6 rounded font-black text-xs flex items-center justify-center flex-shrink-0 ${style.color}`}>{s.code}</div>
                        <div>
                          <p className={`text-xs font-semibold leading-tight ${style.color}`}>{s.title}</p>
                          <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-start gap-2">
                  <Link className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-indigo-800">Golden Thread</p>
                    <p className="text-[10px] text-indigo-700 mt-0.5">Every need in Section B links to a SMART outcome in Section E and specific provision in Section F — as required by the SEND Code of Practice 2015.</p>
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
                      <Sparkles className="w-4 h-4" />Generate Full EHCP Draft
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
                  <p className="font-medium text-amber-800">The QA check reviews:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {["Golden thread — all needs linked to outcomes and provision","SMART outcomes — specific, measurable, time-bound","Provision specificity — who, what, when, where, how often","Legal compliance with SEND Code of Practice 2015","Missing sections or evidence gaps","Person-centred language and strengths-based framing"].map(item => (
                      <span key={item} className="flex items-start gap-1"><span className="text-amber-400 flex-shrink-0 mt-0.5">•</span>{item}</span>
                    ))}
                  </div>
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
                    <p className="text-xs text-muted-foreground">Checking golden thread, SMART criteria, and legal compliance</p>
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
                    </div>
                    <div className="flex-shrink-0 hidden sm:block">
                      {preferences.schoolLogoUrl ? (
                        <img
                          src={preferences.schoolLogoUrl}
                          alt="School logo"
                          className="h-14 w-auto object-contain rounded-xl bg-white p-1.5"
                        />
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
