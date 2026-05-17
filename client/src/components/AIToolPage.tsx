/**
 * AIToolPage — reusable shell for all AI tool pages.
 * Handles: form → generate → display → edit (AI or manual) → save/print/PDF/DOCX
 *
 * Phase-3 additions (this file):
 *   - Pupil context picker (auto-fill + opt-in record injection)
 *   - Output history (last 10 generations) + Restore
 *   - Save-as-template + Start-from-template
 *   - Programmatic output validators with one-click Auto-fix
 *   - Section-level regenerate (for tools that opt in)
 *   - Generic CSV batch runner (for tools that opt in)
 *   - a11y + responsive form (grid-cols-1 sm:grid-cols-2, aria-required, focus-first-missing)
 *   - Cmd/Ctrl+Enter to submit, soft min-input quality nudge
 */
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Sparkles, RefreshCw, Printer, Download, Copy, Save, ChevronLeft,
  PenLine, X, Check, Loader2, Users, FileText, FileDown,
  AlertTriangle, History, Bookmark, ListTree,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { callAI } from "@/lib/ai";
import { callAIStream, supportsStreaming } from "@/lib/callAIStream";
import { StreamedOutput } from "@/components/StreamedOutput";
import { renderMath } from "@/components/WorksheetRenderer";
import { downloadHtmlAsPdf, printWorksheetElement } from "@/lib/pdf-generator-v2";
import { useApp } from "@/contexts/AppContext";
import { FunFactsCarousel } from "@/components/FunFactsCarousel";
import { exportToDocx } from "@/lib/docx-export";
import { useLocation } from "wouter";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { useDraftAutosave } from "@/hooks/useDraftAutosave";
import { useToolTelemetry } from "@/hooks/useToolTelemetry";
import { useOutputHistory } from "@/hooks/useOutputHistory";
import { useToolTemplates } from "@/hooks/useToolTemplates";
import { scanFormValues, maxSeverity, summariseFindings } from "@/lib/piiScanner";
import { AccessibilityPanel, type AccessibilityStyles } from "@/components/AccessibilityPanel";
import { runValidators, type ValidationResult } from "@/lib/output-validators";
import { parseSections, replaceSectionBody, type ParsedSection } from "@/lib/section-parser";
import { buildPupilContext, pupilToFormValues } from "@/lib/pupil-context";
import { PupilContextPicker } from "@/components/PupilContextPicker";
import { BatchToolRunner, type BatchToolSpec } from "@/components/BatchToolRunner";
import { usePupilScope } from "@/contexts/PupilScopeContext";
import { recordEvent } from "@/lib/timeline-events";
import { getToolBySlug } from "@/lib/tool-registry";
import SendToMenu from "@/components/SendToMenu";
import { consumeHandoff } from "@/components/SendToMenu";
import ProvenanceCard, { type ProvenanceFacts } from "@/components/ProvenanceCard";
import { estimateTokens, estimateCost, logGeneration } from "@/lib/credit-meter";
import { cacheGeneration, isOnline, enqueueGeneration } from "@/lib/offline-queue";

export interface AIToolField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  span?: "full" | "half";
  maxLength?: number;
  hint?: string; // helper text shown below the field
}

interface AIToolPageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string; // tailwind bg class e.g. "bg-purple-600"
  fields: AIToolField[];
  buildPrompt: (values: Record<string, string>) => { system: string; user: string; maxTokens?: number };
  formatOutput?: (text: string) => string;
  outputTitle?: (values: Record<string, string>) => string;
  savedCategory?: string;
  assignable?: boolean; // whether this tool output can be assigned to a student
  onResult?: (text: string, values: Record<string, string>) => void;
  worksheetLink?: boolean; // show "Generate Worksheet" button after generation
  isLessonPlan?: boolean; // use the rich lesson plan renderer
  initialValues?: Record<string, string>; // pre-populate fields (e.g. from SEND screener)
  /**
   * Optional custom React renderer for the generated text — takes precedence over
   * formatOutput. Used by tools (Exit Ticket) that need a structured split view
   * rather than a single block of HTML.
   */
  renderCustomOutput?: (text: string, values: Record<string, string>) => React.ReactNode;
  /**
   * Optional transformer applied to the text before it is assigned to a student.
   * E.g. Exit Ticket uses this to strip the teacher answer key.
   */
  transformBeforeAssign?: (text: string) => string;
  /**
   * Optional render prop for post-generation actions (e.g. translation dropdown).
   * Rendered below the output card in the results area.
   */
  renderPostActions?: (result: string, values: Record<string, string>) => React.ReactNode;
  /**
   * If true and at least one pupil exists in useApp().children, render a
   * Class-CSV batch tab above the form so the tool can be run over a class.
   * The batch spec defaults to the tool's normal buildPrompt; pass
   * `batchSpec` to customise required columns.
   */
  batchable?: boolean;
  /**
   * Optional explicit BatchToolSpec override. If omitted but batchable=true,
   * a default spec is inferred from the field list.
   */
  batchSpec?: Partial<BatchToolSpec>;
  /**
   * If true, the output is parsed into sections (## headings or **Section N:**)
   * and each section gets a "Regenerate this part" button.
   */
  sectionable?: boolean;
}

// ─── Lesson Plan Renderer ────────────────────────────────────────────────────
function LessonPlanRenderer({ text, title: planTitle }: { text: string; title: string }) {
  // Parse sections from markdown
  const lines = text.replace(/\\n/g, "\n").split("\n");

  type Section = { heading: string; level: number; content: string[] };
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const raw of lines) {
    const line = raw.replace(/\\n/g, "");
    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h1 || h2 || h3) {
      if (current) sections.push(current);
      current = { heading: (h1 || h2 || h3)![1], level: h1 ? 1 : h2 ? 2 : 3, content: [] };
    } else if (current) {
      current.content.push(line);
    }
  }
  if (current) sections.push(current);

  // Render a content block (lines) to HTML
  function renderContent(lines: string[]): string {
    const html: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    function flushTable() {
      if (!tableRows.length) return;
      const [header, , ...body] = tableRows;
      html.push(`<table class="w-full text-sm border-collapse mb-4"><thead><tr>${(header || []).map(c => `<th class="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-semibold">${c}</th>`).join("")}</tr></thead><tbody>${body.map(row => `<tr>${row.map(c => `<td class="border border-gray-300 px-3 py-2">${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      tableRows = [];
      inTable = false;
    }

    for (const line of lines) {
      if (line.startsWith("|")) {
        inTable = true;
        const cells = line.split("|").slice(1, -1).map(c => c.trim());
        tableRows.push(cells);
        continue;
      }
      if (inTable) flushTable();

      const bold = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      const italic = bold.replace(/\*([^*]+?)\*/g, "<em>$1</em>");

      if (line.match(/^[\-\*•] /)) {
        html.push(`<li class="ml-5 list-disc mb-1 text-gray-700">${italic.replace(/^[\-\*•] /, "")}</li>`);
      } else if (line.match(/^\d+\. /)) {
        html.push(`<li class="ml-5 list-decimal mb-1 text-gray-700">${italic.replace(/^\d+\. /, "")}</li>`);
      } else if (line.trim() === "") {
        html.push("<div class='h-2'></div>");
      } else {
        html.push(`<p class="mb-2 text-gray-700 leading-relaxed">${italic}</p>`);
      }
    }
    if (inTable) flushTable();
    return html.join("\n");
  }

  const SECTION_COLOURS: Record<string, string> = {
    "LESSON OVERVIEW": "bg-blue-50 border-blue-200",
    "LEARNING OBJECTIVES": "bg-green-50 border-green-200",
    "SUCCESS CRITERIA": "bg-emerald-50 border-emerald-200",
    "KEY VOCABULARY": "bg-purple-50 border-purple-200",
    "RESOURCES REQUIRED": "bg-orange-50 border-orange-200",
    "LESSON STRUCTURE": "bg-indigo-50 border-indigo-200",
    "SEND ADAPTATIONS": "bg-pink-50 border-pink-200",
    "ASSESSMENT FOR LEARNING": "bg-teal-50 border-teal-200",
    "HOMEWORK": "bg-yellow-50 border-yellow-200",
    "TEACHER NOTES": "bg-gray-50 border-gray-200",
  };

  function getSectionColour(heading: string): string {
    const upper = heading.toUpperCase();
    for (const key of Object.keys(SECTION_COLOURS)) {
      if (upper.includes(key)) return SECTION_COLOURS[key];
    }
    return "bg-white border-gray-200";
  }

  // Find curriculum link (last line containing http or NC reference)
  const allLines = text.split("\n");
  const curriculumLine = allLines.find(l => l.toLowerCase().includes("curriculum") && (l.includes("http") || l.includes("gov.uk") || l.includes("nc ref") || l.includes("programme of study")));

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Lesson Plan</div>
            <h1 className="text-2xl font-black leading-tight mb-2">{planTitle}</h1>
            <div className="text-blue-100 text-sm opacity-90">Generated by Adaptly · Professional Teaching Resource</div>
          </div>
          <div className="flex-shrink-0 bg-white rounded-lg px-3 py-2">
            <div className="text-blue-700 font-black text-lg tracking-tight">adaptly</div>
            <div className="text-blue-400 text-[9px] font-semibold tracking-widest uppercase">Teaching Tools</div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {sections.map((sec, idx) => (
          <div key={idx} className={`rounded-xl border-2 overflow-hidden ${getSectionColour(sec.heading)}`}>
            <div className={`px-5 py-3 border-b-2 ${getSectionColour(sec.heading).replace("bg-", "border-").split(" ")[1]}`}>
              <h2 className={`font-bold text-sm uppercase tracking-wider ${
                sec.level === 3 ? "text-gray-600 text-xs" : "text-gray-800"
              }`}>
                {sec.level === 3 ? "↳ " : ""}{sec.heading}
              </h2>
            </div>
            <div className="px-5 py-4">
              <div dangerouslySetInnerHTML={{ __html: renderContent(sec.content) }} />
            </div>
          </div>
        ))}
      </div>

      {/* Curriculum link at bottom */}
      {curriculumLine && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <span className="font-semibold">Curriculum Reference: </span>
          {curriculumLine.replace(/^[\-\*•#\s]+/, "")}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
        <span>Generated by <strong className="text-blue-600">Adaptly</strong> · adaptly.co.uk</span>
        <span>For classroom use only · Not for redistribution</span>
      </div>
    </div>
  );
}

function formatAIText(text: string): string {
  // Apply KaTeX math rendering first so symbols/LaTeX render correctly
  const withMath = renderMath(text);
  return withMath
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")  // bold
    .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>")           // italic
    .replace(/^#{1,3} (.+)$/gm, "<h3 class='font-bold text-base mt-4 mb-1'>$1</h3>")
    .replace(/^[•\-] (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/^\* (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 list-decimal'>$2</li>")
    .replace(/\*\*/g, "")                                 // strip any remaining **
    .replace(/\*/g, "")                                   // strip any remaining lone *
    .replace(/\n{2,}/g, "</p><p class='mb-2'>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p class='mb-2'>")
    .replace(/$/, "</p>");
}

type EditMode = "none" | "manual" | "ai";

export default function AIToolPage({
  title, description, icon, accentColor, fields, buildPrompt, formatOutput, outputTitle, onResult, assignable, worksheetLink, isLessonPlan, initialValues, renderCustomOutput, transformBeforeAssign, renderPostActions, batchable, batchSpec, sectionable,
}: AIToolPageProps) {
  const { children, assignWork, user } = useApp();
  const isPlatformAdmin = user?.email === "admin@adaptly.co.uk" || user?.email === "admin@sendassistant.app";
  const { preferences } = useUserPreferences();
  const [, navigate] = useLocation();

  // Merge URL search params with initialValues prop — URL params take precedence
  // This is how the dashboard NL parser pre-populates fields when it navigates here
  const urlParams = typeof window !== "undefined"
    ? Object.fromEntries(new URLSearchParams(window.location.search).entries())
    : {};
  const mergedInitial = { ...(initialValues || {}), ...urlParams };

  const [values, setValues] = useState<Record<string, string>>(mergedInitial);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("");
  const outputRef = useRef<HTMLDivElement>(null);
  // Edit state
  const [editMode, setEditMode] = useState<EditMode>("none");
  const [manualText, setManualText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiEditLoading, setAiEditLoading] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // ── Phase 1: Draft autosave ────────────────────────────────────────────────
  const toolSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { restore: restoreDraft, discard: discardDraft } = useDraftAutosave(toolSlug, values);
  const [draftRestored, setDraftRestored] = useState(false);

  // Restore draft on first mount if values are empty
  if (!draftRestored) {
    const saved = restoreDraft();
    if (saved && typeof saved === "object") {
      const hasContent = Object.values(saved).some(v => typeof v === "string" && v.trim() !== "");
      if (hasContent) {
        // Defer state update to avoid setting state during render
        setTimeout(() => {
          setValues(prev => ({ ...prev, ...saved }));
          toast("Draft restored from your last session", {
            duration: 5000,
            action: {
              label: "Discard",
              onClick: () => { discardDraft(); setValues(mergedInitial); },
            },
          });
          telemetry.fire("draft_restored");
        }, 0);
      }
    }
    setDraftRestored(true);
  }

  // ── Phase 1: Telemetry ─────────────────────────────────────────────────────
  const telemetry = useToolTelemetry(toolSlug);

  // ── Accessibility controls state ───────────────────────────────────────────
  const [a11yStyles, setA11yStyles] = useState<AccessibilityStyles>({
    fontSize: 14,
    fontFamily: "inherit",
    backgroundColor: "#FFFFFF",
  });

  // ── Streaming state ────────────────────────────────────────────────────────
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");

  // ── Phase-3: history / templates / validation / sections / pupil / batch ──
  const history   = useOutputHistory(toolSlug);
  const templates = useToolTemplates(toolSlug);

  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [autoFixing, setAutoFixing] = useState(false);

  const [showHistoryDialog,  setShowHistoryDialog]  = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateNameInput,  setTemplateNameInput]  = useState("");

  const [selectedPupilId,    setSelectedPupilId]    = useState("");
  const [injectPupilRecords, setInjectPupilRecords] = useState(false);

  // ── Connectivity: read/write the global pupil scope ───────────────────────
  const { pupilId: globalPupilId, setPupilId: setGlobalPupilId } = usePupilScope();
  // Sync global → local on mount and when scope changes elsewhere.
  useEffect(() => {
    if (globalPupilId && globalPupilId !== selectedPupilId) {
      setSelectedPupilId(globalPupilId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalPupilId]);
  // Sync local → global when teacher picks one inside the tool.
  useEffect(() => {
    if (selectedPupilId && selectedPupilId !== globalPupilId) {
      setGlobalPupilId(selectedPupilId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPupilId]);

  // ── Connectivity: consume "Send to…" handoff from a previous tool ─────────
  useEffect(() => {
    const incoming = consumeHandoff(toolSlug);
    if (!incoming) return;
    if (incoming.values && Object.keys(incoming.values).length > 0) {
      const matched: Record<string, string> = {};
      for (const [k, v] of Object.entries(incoming.values)) {
        if (typeof v !== "string") continue;
        if (fields.some(f => f.id === k)) matched[k] = v;
      }
      if (Object.keys(matched).length > 0) {
        setValues(prev => ({ ...prev, ...matched }));
        toast(`Picked up ${Object.keys(matched).length} field${Object.keys(matched).length === 1 ? "" : "s"} from the previous tool`, { duration: 4000 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [sectionRegenIdx, setSectionRegenIdx] = useState<number | null>(null);

  const [showBatchMode, setShowBatchMode] = useState(false);

  // Refs to first input of each field for focus-first-missing on submit.
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>({});

  // Focus the first missing required field if validation on submit fails.
  const focusFirstMissing = useCallback((missingIds: string[]) => {
    for (const id of missingIds) {
      const el = fieldRefs.current[id];
      if (el && typeof (el as any).focus === "function") {
        (el as any).focus();
        break;
      }
    }
  }, []);

  // Soft quality nudge — fired on submit when inputs look too short.
  const qualityNudge = useCallback((vals: Record<string, string>): string | null => {
    const issues: string[] = [];
    for (const f of fields) {
      const v = (vals[f.id] || "").trim();
      if (!v) continue;
      if (f.type === "text" && /topic|focus|lesson|task/i.test(f.label) && v.length < 8) {
        issues.push(`"${f.label}" is very short — consider more detail.`);
      }
      if (f.type === "textarea" && v.length < 30) {
        issues.push(`"${f.label}" is very short — fuller context produces stronger output.`);
      }
    }
    return issues.length > 0 ? issues.join(" ") : null;
  }, [fields]);

  // Memoised parsed sections of the current result.
  const parsedSections: ParsedSection[] = useMemo(
    () => (sectionable && result ? parseSections(result) : []),
    [sectionable, result],
  );

  const handleAssign = (childId: string) => {
    if (!result) return;
    const outputTitleStr = outputTitle ? outputTitle(values) : title;
    const assignContent = transformBeforeAssign ? transformBeforeAssign(result) : result;
    assignWork(childId, { title: outputTitleStr, type: title.toLowerCase().replace(/\s+/g, "-"), content: assignContent });
    setShowAssignDialog(false);
    telemetry.fire("output_assigned");
    toast.success("Assigned to student!");
  };

  const setValue = (id: string, val: string) => setValues(prev => ({ ...prev, [id]: val }));

  // Connectivity: write a structured event to the pupil timeline whenever a
  // generation succeeds while a pupil is in scope. Best-effort, never throws.
  // Also logs to credit-meter, caches the output for offline read, and
  // records facts the ProvenanceCard renders.
  const [provenance, setProvenance] = useState<ProvenanceFacts | null>(null);
  const writeTimelineEvent = useCallback((output: string, providerName?: string, systemPromptHead?: string) => {
    const registryEntry = getToolBySlug(toolSlug);
    const fieldsUsed = Object.keys(values).filter(k => values[k]?.trim());
    const tokens = estimateTokens(output) + estimateTokens(JSON.stringify(values));
    const cost   = estimateCost(tokens);

    // Credit-meter
    logGeneration({
      toolId: registryEntry?.id || toolSlug,
      toolLabel: registryEntry?.label || title,
      pupilId: selectedPupilId || undefined,
      tokens,
      cost,
    });

    // Offline read-cache
    cacheGeneration({
      toolId: registryEntry?.id || toolSlug,
      toolLabel: registryEntry?.label || title,
      title: outputTitle ? outputTitle(values) : title,
      output,
      pupilId: selectedPupilId || undefined,
    });

    // Provenance facts for the "Why this output?" card.
    setProvenance({
      toolLabel: registryEntry?.label || title,
      systemPromptHead: (systemPromptHead || "").slice(0, 240) || `${title} default system prompt`,
      fieldsUsed,
      validators: validation
        ? { ok: validation.ok, ruleCount: validation.issues.length, failures: validation.issues.map(i => i.message) }
        : { ok: true, ruleCount: 0, failures: [] },
      pupilContextInjected: !!(injectPupilRecords && selectedPupilId),
      tokens,
      cost,
      generatedAt: Date.now(),
      provider: providerName,
    });

    if (selectedPupilId) {
      recordEvent(selectedPupilId, {
        toolId: registryEntry?.id || toolSlug,
        toolLabel: registryEntry?.label || title,
        title: outputTitle ? outputTitle(values) : title,
        summary: undefined,
        outputPreview: output.slice(0, 500),
        link: registryEntry?.path,
      });
    }

    try {
      window.dispatchEvent(new CustomEvent("adaptly:timeline-changed"));
      window.dispatchEvent(new CustomEvent("adaptly:credit-changed"));
    } catch {}
  }, [selectedPupilId, toolSlug, title, outputTitle, values, validation, injectPupilRecords]);

  const handleGenerate = async (opts: { skipNudge?: boolean } = {}) => {
    const missing = fields.filter(f => f.required && !values[f.id]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map(f => f.label).join(", ")}`);
      focusFirstMissing(missing.map(f => f.id));
      return;
    }
    // Soft quality nudge — non-blocking.
    if (!opts.skipNudge) {
      const nudge = qualityNudge(values);
      if (nudge) {
        toast(nudge, {
          duration: 6000,
          action: {
            label: "Generate anyway",
            onClick: () => handleGenerate({ skipNudge: true }),
          },
        });
        return;
      }
    }
    // ── Phase 1: PII pre-flight check ──────────────────────────────────────
    const piiResult = scanFormValues(values, { ignoreFields: ["subject", "yearGroup", "year", "duration", "examBoard"] });
    const severity = maxSeverity(piiResult);
    if (severity === "high") {
      const findings = summariseFindings(piiResult);
      toast.error(`Blocked: personal data detected (${findings.join("; ")}). Use initials or remove before generating.`);
      telemetry.fire("pii_blocked", { errorCode: severity });
      return;
    }
    if (severity === "medium") {
      const findings = summariseFindings(piiResult);
      toast("Personal data warning: " + findings.join("; ") + ". Consider using initials.", { duration: 6000 });
    }
    // ── Generate ───────────────────────────────────────────────────────────
    const endTimer = telemetry.startTimer("generate_start");
    setLoading(true);
    setResult(null);
    setStreamedText("");
    setIsStreaming(false);
    setEditMode("none");
    setValidation(null);
    try {
      const promptParts = buildPrompt(values);
      let { system, user } = promptParts;
      const { maxTokens } = promptParts;

      // Inject pupil-context block if a pupil is picked AND opt-in toggle is on.
      const selectedPupil = injectPupilRecords && selectedPupilId
        ? children.find(c => c.id === selectedPupilId)
        : null;
      if (selectedPupil) {
        const ctx = buildPupilContext(selectedPupil);
        user = `${ctx.promptBlock}\n\n${user}`;
      }

      // Use streaming if supported — gives ~3x perceived speed improvement
      if (supportsStreaming()) {
        setLoading(false); // Hide full-screen spinner — streaming shows progress inline
        setIsStreaming(true);
        let accumulated = "";
        let streamProvider = "";
        for await (const chunk of callAIStream(system, user, maxTokens || 2500)) {
          if (chunk.provider) streamProvider = chunk.provider;
          if (chunk.text) {
            accumulated += chunk.text;
            setStreamedText(accumulated);
          }
          if (chunk.done) break;
        }
        setIsStreaming(false);
        setResult(accumulated);
        setProvider(streamProvider);
        onResult?.(accumulated, values);
        discardDraft();
        endTimer("success", { provider: streamProvider });
        // Run programmatic output validators (no-op for tools without rules).
        const v = runValidators(toolSlug, accumulated, values);
        setValidation(v.ok ? null : v);
        // Push to per-tool output history (best-effort, capped at 10).
        history.push({
          values: { ...values },
          output: accumulated,
          title: outputTitle ? outputTitle(values) : title,
        });
        // Connectivity: per-pupil timeline write-back.
        writeTimelineEvent(accumulated, streamProvider, system);
        toast.success("Generated successfully!");
      } else {
        // Fallback: non-streaming
        const { text, provider: p } = await callAI(system, user, maxTokens || 2500);
        setResult(text);
        setProvider(p);
        onResult?.(text, values);
        discardDraft();
        endTimer("success", { provider: p });
        const v = runValidators(toolSlug, text, values);
        setValidation(v.ok ? null : v);
        history.push({
          values: { ...values },
          output: text,
          title: outputTitle ? outputTitle(values) : title,
        });
        writeTimelineEvent(text, p, system);
        toast.success("Generated successfully!");
      }
    } catch (err) {
      setIsStreaming(false);
      endTimer("fail", { errorCode: (err as any)?.message?.slice(0, 64) || "unknown" });
      // If we're offline, queue the generation so it runs when we're back.
      if (!isOnline()) {
        const registryEntry = getToolBySlug(toolSlug);
        const promptParts = buildPrompt(values);
        enqueueGeneration({
          toolId: registryEntry?.id || toolSlug,
          toolLabel: registryEntry?.label || title,
          system: promptParts.system,
          user: promptParts.user,
          values: { ...values },
          pupilId: selectedPupilId || undefined,
        });
        toast("You appear to be offline — your generation is queued and will run when you're back online.", { duration: 7000 });
      } else {
        toast.error("Generation failed. Please try again.");
      }
      console.error(err);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    telemetry.fire("output_copied");
    toast.success("Copied to clipboard!");
  };

  const handlePrint = () => {
    if (!outputRef.current) return;
    telemetry.fire("output_printed");
    printWorksheetElement(outputRef.current, { title: outputTitle?.(values) || title });
  };

  const handlePdf = async () => {
    if (!outputRef.current) return;
    try {
      const filename = `${(outputTitle?.(values) || title).replace(/\s+/g, "_")}.pdf`;
      await downloadHtmlAsPdf(outputRef.current, filename);
      telemetry.fire("output_downloaded");
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Could not generate PDF. Please try again.");
    }
  };

  const handleDocx = async () => {
    if (!result) return;
    try {
      await exportToDocx({
        title: outputTitle?.(values) || title,
        content: result,
        subtitle: `Generated by Adaptly · ${new Date().toLocaleDateString("en-GB")}`,
        schoolName: preferences.schoolName,
      });
      toast.success("Word document downloaded!");
    } catch (err: any) {
      console.error("DOCX export failed:", err);
      toast.error("Could not generate Word document. Please try again.");
    }
  };

  // ── AI edit ─────────────────────────────────────────────────────────────────
  const handleAiEdit = async () => {
    if (!aiPrompt.trim() || !result) return;
    setAiEditLoading(true);
    try {
      const system = `You are an expert SEND teacher editing AI-generated educational content. Apply the user's instruction to the content and return the full updated content. Keep the same general format and structure. Return only the updated content — no extra commentary.`;
      const user = `Tool: ${title}\nCurrent content:\n${result}\n\nInstruction: ${aiPrompt}\n\nReturn the full updated content:`;
      const { text } = await callAI(system, user, 3000);
      setResult(text.trim());
      setEditMode("none");
      setAiPrompt("");
      toast.success("Content updated with AI!");
    } catch {
      toast.error("AI edit failed. Please try again.");
    }
    setAiEditLoading(false);
  };

  // ── Phase-3: Auto-fix on validation failure ──────────────────────────────
  const handleAutoFix = async () => {
    if (!result || !validation || validation.ok || !validation.autoFixInstruction) return;
    setAutoFixing(true);
    try {
      const system = `You are an expert SEND teacher correcting a previously-generated piece of content. Apply the fix instruction precisely and return the FULL revised content. No commentary, no extra preamble.`;
      const user = `Tool: ${title}\nCurrent content:\n${result}\n\nFix instruction: ${validation.autoFixInstruction}\n\nReturn the full revised content:`;
      const { text } = await callAI(system, user, 3000);
      const newText = text.trim();
      setResult(newText);
      const v = runValidators(toolSlug, newText, values);
      setValidation(v.ok ? null : v);
      history.push({ values: { ...values }, output: newText, title: outputTitle ? outputTitle(values) : title });
      toast.success(v.ok ? "Auto-fix applied successfully!" : "Auto-fix applied — some checks still failing.");
    } catch {
      toast.error("Auto-fix failed. Please try again or edit manually.");
    }
    setAutoFixing(false);
  };

  // ── Phase-3: Section-level regenerate ─────────────────────────────────────
  const handleRegenerateSection = async (sectionIndex: number) => {
    if (!result) return;
    const sections = parseSections(result);
    const section  = sections[sectionIndex];
    if (!section) return;

    setSectionRegenIdx(sectionIndex);
    try {
      const system = `You are an expert SEND teacher refining one section of a previously-generated document. Rewrite ONLY the requested section, keeping its heading. Do not echo the heading line. Return ONLY the new body text — no commentary.`;
      const otherSections = sections
        .map((s, i) => i === sectionIndex ? null : `${s.heading}\n${s.body}`)
        .filter(Boolean)
        .join("\n\n");
      const user = `Tool: ${title}\nSection to rewrite: ${section.title}\nKeep this section's tone and style consistent with the rest of the document.\n\n--- OTHER SECTIONS (for context, do not rewrite) ---\n${otherSections}\n\n--- CURRENT BODY OF SECTION TO REWRITE ---\n${section.body}\n\nReturn only the new body for "${section.title}":`;
      const { text } = await callAI(system, user, 1500);
      const newDoc   = replaceSectionBody(result, sectionIndex, text);
      setResult(newDoc);
      const v = runValidators(toolSlug, newDoc, values);
      setValidation(v.ok ? null : v);
      toast.success(`Regenerated: ${section.title}`);
    } catch {
      toast.error("Section regenerate failed. Please try again.");
    }
    setSectionRegenIdx(null);
  };

  // ── Phase-3: Templates / History / Pupil-picker handlers ─────────────────
  const handleSaveTemplate = () => {
    const name = templateNameInput.trim();
    if (!name) { toast.error("Please enter a template name."); return; }
    const saved = templates.save(name, values, result || undefined);
    if (saved) {
      setShowTemplateDialog(false);
      setTemplateNameInput("");
      toast.success(`Saved template: ${saved.name}`);
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    const t = templates.get(templateId);
    if (!t) return;
    setValues(prev => ({ ...prev, ...t.values }));
    if (t.output) setResult(t.output);
    toast.success(`Loaded template: ${t.name}`);
  };

  const handleRestoreHistory = (id: string) => {
    const entry = history.get(id);
    if (!entry) return;
    setValues(prev => ({ ...prev, ...entry.values }));
    setResult(entry.output);
    setShowHistoryDialog(false);
    toast.success("Restored from history");
  };

  const handlePupilSelect = (childId: string) => {
    setSelectedPupilId(childId);
    if (!childId) return;
    const c = children.find(ch => ch.id === childId);
    if (!c) return;
    const prefilled = pupilToFormValues(c);
    // Only set fields that exist on this tool (avoid clobbering unrelated state).
    const updates: Record<string, string> = {};
    for (const [k, v] of Object.entries(prefilled)) {
      if (fields.some(f => f.id === k)) updates[k] = String(v);
    }
    if (Object.keys(updates).length > 0) {
      setValues(prev => ({ ...prev, ...updates }));
      toast.success(`Pre-filled ${Object.keys(updates).length} field${Object.keys(updates).length === 1 ? "" : "s"} from pupil record`);
    }
  };

  // Cmd/Ctrl+Enter from any field submits the form.
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!loading && !isStreaming) handleGenerate();
    }
  };

  // Build a default BatchToolSpec from this tool's fields, if user opted in.
  const inferredBatchSpec: BatchToolSpec | null = useMemo(() => {
    if (!batchable) return null;
    const cols = fields.map(f => ({ id: f.id, label: f.label, required: f.required }));
    return {
      toolSlug,
      title,
      columns: cols,
      buildPrompt: (row) => buildPrompt(row),
      ...(batchSpec || {}),
    };
  }, [batchable, batchSpec, fields, toolSlug, title, buildPrompt]);

  const rawOutput = result ? (formatOutput ? formatOutput(result) : formatAIText(result)) : "";
  // Sanitize AI-generated HTML before rendering to prevent XSS
  const formattedOutput = rawOutput ? DOMPurify.sanitize(rawOutput, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "h3", "h4", "ul", "ol", "li",
      "span", "div", "sup", "sub", "table", "thead", "tbody", "tr", "th", "td"],
    ALLOWED_ATTR: ["class", "style"],
  }) : "";

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className={`rounded-xl p-5 mb-4 text-white ${accentColor}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h1 className="font-bold text-lg">{title}</h1>
              <p className="text-white/80 text-sm">{description}</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white shadow-2xl border border-border/50 max-w-sm w-full mx-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
                <Sparkles className="w-6 h-6 text-brand absolute inset-0 m-auto" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground text-lg">Generating with AI</h3>
                {isPlatformAdmin ? (
                  <p className="text-sm text-muted-foreground mt-1">Processing your request…</p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Crafting your personalised resource…</p>
                )}
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-brand rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
              {!isPlatformAdmin && <FunFactsCarousel className="mt-1" />}
              <p className="text-xs text-muted-foreground">Please wait — do not close this page</p>
            </div>
          </div>
        )}

        {!result && !isStreaming ? (
          <>
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-4" onKeyDown={handleFormKeyDown}>
              {/* Batch-mode toggle when this tool opts into batch */}
              {batchable && children && children.length > 0 && (
                <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                  <button
                    type="button"
                    onClick={() => setShowBatchMode(false)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      !showBatchMode ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                    aria-pressed={!showBatchMode}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBatchMode(true)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      showBatchMode ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                    aria-pressed={showBatchMode}
                  >
                    <Users className="w-3 h-3 inline mr-1" />Batch (whole class)
                  </button>
                </div>
              )}

              {/* Batch runner takes over the form when active */}
              {batchable && showBatchMode && inferredBatchSpec ? (
                <BatchToolRunner spec={inferredBatchSpec} />
              ) : (
              <>

              {/* Pupil context picker (auto-fill + opt-in record injection) */}
              {children && children.length > 0 && (
                <PupilContextPicker
                  children={children}
                  selectedId={selectedPupilId}
                  onSelect={handlePupilSelect}
                  injectRecords={injectPupilRecords}
                  onToggleInject={setInjectPupilRecords}
                />
              )}

              {/* Templates: pick saved + Save current */}
              {(templates.templates.length > 0 || result) && (
                <div className="flex flex-wrap items-center gap-2 -mt-1">
                  {templates.templates.length > 0 && (
                    <Select onValueChange={(v) => v && handleLoadTemplate(v)}>
                      <SelectTrigger className="h-9 w-auto min-w-[200px] text-xs gap-2" aria-label="Start from a saved template">
                        <Bookmark className="w-3.5 h-3.5" />
                        <SelectValue placeholder="Start from a template…" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.templates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {history.entries.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHistoryDialog(true)}
                      className="gap-1.5 text-xs"
                    >
                      <History className="w-3.5 h-3.5" />Recent ({history.entries.length})
                    </Button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map(field => {
                  const hintId = field.hint ? `hint-${field.id}` : undefined;
                  const inputId = `field-${field.id}`;
                  const commonProps = {
                    id: inputId,
                    "aria-required": field.required ? true : undefined,
                    "aria-describedby": hintId,
                  } as const;
                  return (
                  <div key={field.id} className={`space-y-1.5 ${field.span === "full" ? "sm:col-span-2" : ""}`}>
                    <label htmlFor={inputId} className="text-xs font-medium text-foreground">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
                    </label>
                    {field.type === "select" ? (
                      <select
                        {...commonProps}
                        ref={el => { fieldRefs.current[field.id] = el; }}
                        value={values[field.id] || ""}
                        onChange={e => setValue(field.id, e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
                      >
                        <option value="">Select...</option>
                        {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        {...commonProps}
                        ref={el => { fieldRefs.current[field.id] = el; }}
                        value={values[field.id] || ""}
                        onChange={e => setValue(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
                      />
                    ) : (
                      <input
                        {...commonProps}
                        ref={el => { fieldRefs.current[field.id] = el; }}
                        type="text"
                        value={values[field.id] || ""}
                        onChange={e => {
                          const val = field.maxLength ? e.target.value.slice(0, field.maxLength) : e.target.value;
                          setValue(field.id, val);
                        }}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    )}
                    {field.hint && (
                      <p id={hintId} className="text-[10px] text-muted-foreground mt-0.5">{field.hint}</p>
                    )}
                  </div>
                  );
                })}
              </div>
              <Button
                onClick={() => handleGenerate()}
                disabled={loading}
                className="w-full h-11 bg-brand hover:bg-brand/90 text-white"
                aria-keyshortcuts="Control+Enter Meta+Enter"
              >
                {loading
                  ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  : <><Sparkles className="w-4 h-4 mr-2" />Generate with AI</>
                }
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Tip: press <kbd className="px-1 rounded bg-muted">Cmd</kbd>/<kbd className="px-1 rounded bg-muted">Ctrl</kbd>+<kbd className="px-1 rounded bg-muted">Enter</kbd> from any field to generate
              </p>
              </>
              )}
            </CardContent>
          </Card>
          {/* Render V2 panel tabs even before generation so they are always accessible */}
          {renderPostActions && renderPostActions("", values)}
          </>
        ) : isStreaming && !result ? (
          /* Streaming in progress — show progressive text */
          <div className="space-y-3">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <StreamedOutput
                  text={streamedText}
                  isStreaming={true}
                  className="min-h-[120px]"
                  style={{
                    fontSize: `${a11yStyles.fontSize}px`,
                    fontFamily: a11yStyles.fontFamily,
                    backgroundColor: a11yStyles.backgroundColor,
                  }}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="outline" size="sm" onClick={() => { setResult(null); setStreamedText(""); setEditMode("none"); }}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />New
              </Button>
              {provider && isPlatformAdmin && (
                <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />{provider}
                </Badge>
              )}
              <div className="ml-auto flex flex-wrap gap-2">
                {/* Edit buttons — only shown when not in edit mode */}
                {editMode === "none" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-brand/40 text-brand hover:bg-brand-light"
                      onClick={() => setEditMode("ai")}
                    >
                      <Sparkles className="w-3.5 h-3.5" />Edit with AI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => { setManualText(result); setEditMode("manual"); }}
                    >
                      <PenLine className="w-3.5 h-3.5" />Edit Manually
                    </Button>
                  </>
                )}
                {/* Cancel buttons in edit mode */}
                {editMode === "ai" && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-300"
                    onClick={() => { setEditMode("none"); setAiPrompt(""); }}>
                    <X className="w-3.5 h-3.5" />Cancel
                  </Button>
                )}
                {editMode === "manual" && (
                  <>
                    <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-300"
                      onClick={() => setEditMode("none")}>
                      <X className="w-3.5 h-3.5" />Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-brand hover:bg-brand/90 text-white gap-1.5"
                      onClick={() => { setResult(manualText); setEditMode("none"); toast.success("Changes saved!"); }}
                    >
                      <Check className="w-3.5 h-3.5" />Save Changes
                    </Button>
                  </>
                )}
                {assignable && children && children.length > 0 && (
                  <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 border-blue-300 text-blue-600 hover:bg-blue-50">
                        <Users className="w-3.5 h-3.5" />Assign to Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Assign to Student</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground mb-3">Select a student to assign this output to:</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {children.map(child => (
                          <button
                            key={child.id}
                            className="w-full text-left px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm flex items-center gap-2"
                            onClick={() => handleAssign(child.id)}
                          >
                            <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand">
                              {child.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="font-medium">{child.name}</span>
                            {child.yearGroup && <span className="text-muted-foreground text-xs ml-auto">{child.yearGroup}</span>}
                          </button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="w-3.5 h-3.5 mr-1" />Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5 mr-1" />Print
                </Button>
                <Button variant="outline" size="sm" onClick={handlePdf}>
                  <Download className="w-3.5 h-3.5 mr-1" />PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleDocx} title="Download as Word document">
                  <FileDown className="w-3.5 h-3.5 mr-1" />Word
                </Button>
                {/* Connectivity: continue the work in another tool */}
                <SendToMenu
                  fromToolId={getToolBySlug(toolSlug)?.id || toolSlug}
                  values={values}
                  output={result || undefined}
                />
                {/* Provenance — "Why this output?" */}
                {provenance && <ProvenanceCard facts={provenance} />}
                {/* Save as template / Recent */}
                <Button variant="outline" size="sm" onClick={() => setShowTemplateDialog(true)} title="Save current values as a reusable template">
                  <Bookmark className="w-3.5 h-3.5 mr-1" />Save as template
                </Button>
                {history.entries.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowHistoryDialog(true)} title="Browse recent generations">
                    <History className="w-3.5 h-3.5 mr-1" />Recent
                  </Button>
                )}
              </div>
            </div>

            {/* AI edit panel */}
            {editMode === "ai" && (
              <div className="rounded-lg border border-brand/30 bg-brand-light/30 p-3 space-y-2">
                <p className="text-xs font-medium text-brand flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Describe what you'd like to change
                </p>
                <Textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. Make it simpler for Year 3, add more examples, shorten the introduction…"
                  className="text-sm min-h-[80px] resize-none"
                  disabled={aiEditLoading}
                  onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAiEdit(); }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-brand hover:bg-brand/90 text-white gap-1.5"
                    onClick={handleAiEdit}
                    disabled={aiEditLoading}
                  >
                    {aiEditLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Editing…</>
                      : <><Sparkles className="w-3.5 h-3.5" />Apply AI Edit</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditMode("none"); setAiPrompt(""); }} disabled={aiEditLoading}>
                    <X className="w-3.5 h-3.5 mr-1" />Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Manual edit textarea */}
            {editMode === "manual" && (
              <Textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                className="text-sm font-mono min-h-[300px] resize-y"
              />
            )}

            {/* Output — hidden in manual edit mode */}
            {editMode !== "manual" && (
              <>
              {/* Validation banner */}
              {validation && !validation.ok && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2" role="status" aria-live="polite">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-semibold text-amber-900">Output quality check found {validation.issues.length} issue{validation.issues.length === 1 ? "" : "s"}:</p>
                      <ul className="text-xs text-amber-800 list-disc ml-4 space-y-0.5">
                        {validation.issues.slice(0, 5).map((iss, i) => (
                          <li key={i}>{iss.message}</li>
                        ))}
                        {validation.issues.length > 5 && <li>…and {validation.issues.length - 5} more</li>}
                      </ul>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {validation.autoFixInstruction && (
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 h-7"
                          onClick={handleAutoFix}
                          disabled={autoFixing}
                        >
                          {autoFixing
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Fixing…</>
                            : <><Sparkles className="w-3.5 h-3.5" />Auto-fix</>}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => setValidation(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Section-level regenerate panel (opt-in via sectionable) */}
              {sectionable && parsedSections.length > 1 && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <ListTree className="w-4 h-4" />
                    <span className="text-xs font-semibold">Regenerate just one section</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedSections.map((sec, i) => (
                      <Button
                        key={i}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                        disabled={sectionRegenIdx !== null}
                        onClick={() => handleRegenerateSection(i)}
                        title={`Regenerate: ${sec.title}`}
                      >
                        {sectionRegenIdx === i
                          ? <><Loader2 className="w-3 h-3 animate-spin" />Regenerating…</>
                          : <><RefreshCw className="w-3 h-3" />{sec.title.slice(0, 40)}</>}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <AccessibilityPanel onChange={setA11yStyles} className="mb-2" />
              <Card className="border-border/50">
                <CardContent
                  className={isLessonPlan ? "p-6" : "p-6"}
                  ref={outputRef}
                  style={{
                    fontSize: `${a11yStyles.fontSize}px`,
                    fontFamily: a11yStyles.fontFamily,
                    backgroundColor: a11yStyles.backgroundColor,
                  }}
                >
                  {isLessonPlan && result ? (
                    <LessonPlanRenderer
                      text={result}
                      title={outputTitle ? outputTitle(values) : title}
                    />
                  ) : renderCustomOutput && result ? (
                    <>
                      {outputTitle && (
                        <h2 className="font-bold text-lg mb-4 text-foreground border-b pb-2">
                          {outputTitle(values)}
                        </h2>
                      )}
                      {renderCustomOutput(result, values)}
                    </>
                  ) : (
                    <>
                      {outputTitle && (
                        <h2 className="font-bold text-lg mb-4 text-foreground border-b pb-2">
                          {outputTitle(values)}
                        </h2>
                      )}
                      <div
                        className="prose prose-sm max-w-none text-foreground/90 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formattedOutput }}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
              {renderPostActions && result && renderPostActions(result, values)}
              </>
            )}

            <Button variant="outline" onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Regenerating...</> : <><RefreshCw className="w-4 h-4 mr-2" />Regenerate</>}
            </Button>
            {worksheetLink && values.subject && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 border-brand/40 text-brand hover:bg-brand-light"
                onClick={() => {
                  const subjectSlug = values.subject?.toLowerCase().replace(/\s+/g, '-') || '';
                  const topicParam = values.topic ? `&topic=${encodeURIComponent(values.topic)}` : '';
                  navigate(`/worksheets?subject=${encodeURIComponent(subjectSlug)}${topicParam}`);
                }}
              >
                <FileText className="w-3.5 h-3.5" />Generate Worksheet for This Lesson
              </Button>
            )}
          </div>
        )}

        {/* History dialog — restore a previous generation */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-4 h-4" />Recent generations
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground mb-2">
              Up to 10 recent generations are kept locally on this device. Select one to restore.
            </p>
            {history.entries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No history yet.</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {history.entries.map(entry => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => handleRestoreHistory(entry.id)}
                    className="w-full text-left p-2 rounded-lg border border-border hover:bg-muted text-xs space-y-1"
                  >
                    <div className="font-semibold text-foreground line-clamp-1">{entry.title || "Untitled"}</div>
                    <div className="text-muted-foreground text-[10px]">
                      {new Date(entry.at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                    <div className="text-muted-foreground line-clamp-2">{entry.output.slice(0, 160)}…</div>
                  </button>
                ))}
              </div>
            )}
            {history.entries.length > 0 && (
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { history.clear(); toast.success("History cleared"); }}>
                Clear history
              </Button>
            )}
          </DialogContent>
        </Dialog>

        {/* Save-as-template dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bookmark className="w-4 h-4" />Save as template
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">
              Templates capture the current form values and (optionally) the latest output, ready to re-use later.
            </p>
            <Input
              placeholder="Template name (e.g. Y4 PDA escalation plan)"
              value={templateNameInput}
              onChange={e => setTemplateNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSaveTemplate(); }}
              autoFocus
            />
            {templates.templates.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Existing</p>
                {templates.templates.map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-xs">
                    <span className="flex-1 truncate">{t.name}</span>
                    <button type="button" className="text-red-500 hover:underline text-[10px]"
                      onClick={() => { templates.remove(t.id); toast.success("Template deleted"); }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
              <Button size="sm" className="bg-brand text-white" onClick={handleSaveTemplate}>
                <Save className="w-3.5 h-3.5 mr-1" />Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
