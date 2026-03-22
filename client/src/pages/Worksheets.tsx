import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, type Worksheet } from "@/contexts/AppContext";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { subjects, yearGroups, sendNeeds, examBoards, difficulties, colorOverlays, getDifficultyOptions, subjectTierMode } from "@/lib/send-data";
import { generateWorksheet, type GeneratedWorksheet } from "@/lib/worksheet-generator";
import { downloadWorksheetPdf } from "@/lib/pdf-generator";
import { downloadHtmlAsPdf, printWorksheetElement, serialiseElement, buildPopupHtml, getKatexCssInline } from "@/lib/pdf-generator-v2";
import WorksheetRenderer, { renderMath, stripKatexToPlainText } from "@/components/WorksheetRenderer";
import { worksheetBank, type BankWorksheet } from "@/lib/worksheet-bank";
import { getSyllabusTopics, type SyllabusTopic } from "@/lib/syllabus-data";
import { aiGenerateWorksheet, aiEditSection, aiScaffoldExistingWorksheet, aiDifferentiateExistingWorksheet, parseNaturalLanguageInput, aiScenarioSwap, aiAdjustReadingLevel } from "@/lib/ai";
// examPaperBuilder is dynamically imported inside handlers to avoid loading the large question bank on initial page load
import type { PastPaperQuestion } from "@/lib/pastPaperQuestions";
import PrintOptionsDialog, { type PrintOptions } from "@/components/PrintOptionsDialog";
import SENDInfoPanel from "@/components/SENDInfoPanel";
import DiagnosticStarterSheet from "@/components/DiagnosticStarterSheet";
import { FunFactsCarousel } from "@/components/FunFactsCarousel";
import {
  FileText, Upload, Library, Sparkles, Download, Printer, Save, Star,
  Eye, EyeOff, GraduationCap, Palette, Edit3, Users, Check, ZoomIn, ZoomOut,
  Mic, MicOff, Image, Search, Clock, Award, ChevronRight, ChevronDown,
  AlertCircle, CheckCircle, RefreshCw, FileDown, X, Wand2, History, Trash2, Info, PenLine, Square, CheckSquare, ListChecks, ClipboardCheck,
  MessageSquare, Send, RotateCcw, Layers, Volume2, VolumeX, Loader2,
} from "lucide-react";

// ─── Debounce hook ──────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Voice-to-text hook ─────────────────────────────────────────────────────
function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join("");
      onResult(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, [onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, startListening, stopListening };
}

// ─── Format content helper ──────────────────────────────────────────────────
function formatContent(content: string): string {
  if (!content) return "";
  // Normalize spaced HTML tags that AI sometimes generates (e.g. "x < sup > 2 < /sup >")
  let normalized = content
    .replace(/<\s*sup\s*>/gi, "<sup>")
    .replace(/<\s*\/\s*sup\s*>/gi, "</sup>")
    .replace(/<\s*sub\s*>/gi, "<sub>")
    .replace(/<\s*\/\s*sub\s*>/gi, "</sub>");
  // Apply renderMath to handle KaTeX fractions, LaTeX expressions, and superscripts
  let processed = renderMath(normalized);
  return processed
    // Horizontal rules — flexible: match --- with optional surrounding whitespace
    .replace(/^\s*---\s*$/gm, "<hr class='my-3 border-gray-300'/>")
    // Blockquotes (SEND context, notes)
    .replace(/^> (.+)$/gm, "<div class='blockquote-line bg-blue-50 border-l-4 border-blue-400 pl-3 py-1 my-1 text-sm text-blue-800 rounded-r'>$1</div>")
    // Answer lines — render as styled underline
    .replace(/_{20,}/g, "<span class='answer-line inline-block w-full border-b-2 border-gray-400 my-1.5 min-h-[1.5rem]'>&nbsp;</span>")
    // Marks badges [X marks]
    .replace(/(\[\d+ marks?\])/g, "<span class='marks-badge ml-2 text-xs font-bold text-white bg-gray-600 px-1.5 py-0.5 rounded'>$1</span>")
    // Hints — removed (not shown on worksheets)
    .replace(/^\s*>?\s*Hint:.*$/gm, "")
    // Bullet points
    .replace(/^[•\-] (.+)$/gm, "<div class='flex items-start gap-2 my-1'><span class='text-brand mt-1'>&#8226;</span><span>$1</span></div>")
    // Step lines
    .replace(/^(Step \d+:.+)$/gm, "<div class='step-line font-semibold text-emerald-700 mt-2'>$1</div>")
    // Source lines (exam paper attribution)
    .replace(/^\*\[(.+)\]\*$/gm, "<div class='source-line text-xs text-gray-400 italic mt-1'>[$1]</div>")
    // Newlines
    .replace(/\n/g, "<br/>");
}

function renderWorksheetText(ws: GeneratedWorksheet, includeTeacher: boolean): string {
  let text = `${ws.title}\n${ws.subtitle}\n\n`;
  ws.sections.forEach(s => {
    if (!includeTeacher && (s.type === "answers" || s.type === "adaptations")) return;
    text += `=== ${s.title} ===\n${s.content}\n\n`;
  });
  return text;
}

// ─── AI worksheet type ──────────────────────────────────────────────────────
interface AIWorksheet {
  title: string;
  subtitle?: string;
  sections: Array<{ title: string; type: string; content: string; teacherOnly: boolean }>;
  metadata: {
    subject: string; topic: string; yearGroup: string; sendNeed?: string;
    difficulty: string; examBoard?: string; adaptations?: string[];
    totalMarks?: number; estimatedTime?: string;
  };
  diagramUrl?: string | null;
  isAI: true;
}

type AnyWorksheet = GeneratedWorksheet | AIWorksheet;

function isAIWorksheet(ws: AnyWorksheet): ws is AIWorksheet {
  return (ws as AIWorksheet).isAI === true;
}

// ─── Loading helpers ──────────────────────────────────────────────────────────
function LoadingStageMessage({ stages }: { stages: string[] }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setIdx(i => Math.min(i + 1, stages.length - 1)), 6000);
    return () => clearInterval(interval);
  }, [stages.length]);
  return (
    <p className="text-sm text-muted-foreground mt-1 min-h-[40px] transition-all duration-500">
      {stages[idx]}
    </p>
  );
}
function AnimatedProgressBar() {
  const [width, setWidth] = React.useState(4);
  React.useEffect(() => {
    // Ease the bar from 4% to 90% over ~30s, never reaching 100% (done when component unmounts)
    const steps = [10, 25, 45, 60, 72, 82, 88, 90];
    const delays = [1000, 3000, 6000, 10000, 15000, 20000, 26000, 32000];
    const timers = delays.map((d, i) => setTimeout(() => setWidth(steps[i]), d));
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div
      className="h-full bg-brand rounded-full transition-all duration-1000 ease-out"
      style={{ width: `${width}%` }}
    />
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Worksheets() {
  const [location] = useLocation();
  const { saveWorksheet, updateWorksheet, deleteWorksheet, worksheetHistory, children, assignWork, colorOverlay, setColorOverlay, refreshData, user } = useApp();
  const isPlatformAdmin = user?.email === "admin@adaptly.co.uk" || user?.email === "admin@sendassistant.app";
  const { preferences } = useUserPreferences();
  const showLibraryTab = preferences.showWorksheetLibrary === true;
  // Filter out 11+ unless user has enabled it in Settings → Features
  const filteredSubjects = (preferences.show11Plus ?? false)
    ? subjects
    : subjects.filter(s => s.id !== "eleven-plus");

  // Re-fetch data from server on mount so history count is always current
  useEffect(() => { refreshData(); }, []);

  // Parse URL params for pre-filling from Curriculum Progression or external links
  const _urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const preSelectedSubject = _urlParams.get("subject") || "";
  const preSelectedTopic = _urlParams.get("topic") || "";
  const preSelectedDescription = _urlParams.get("description") || "";
  const preSelectedYearGroup = _urlParams.get("yearGroup") || "";
  const preSelectedSendNeed = _urlParams.get("sendNeed") || "";

  const [activeTab, setActiveTab] = useState("generate");
  const [subject, setSubject] = useState(() => preSelectedSubject);
  const [yearGroup, setYearGroup] = useState(() => preSelectedYearGroup);
  const [topic, setTopic] = useState(() => preSelectedTopic);
  const [sendNeed, setSendNeed] = useState(() => preSelectedSendNeed);
  const [difficulty, setDifficulty] = useState("mixed");
  const [worksheetLength, setWorksheetLength] = useState("30");
  const [examBoard, setExamBoard] = useState("none");
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [examStyle, setExamStyle] = useState(false);
  const [recallTopic, setRecallTopic] = useState("");

  // ── Class Presets ─────────────────────────────────────────────────────────
  interface ClassPreset {
    id: string;
    name: string;
    subject: string;
    yearGroup: string;
    sendNeed: string;
    difficulty: string;
    examBoard: string;
    worksheetLength: string;
    readingAge: number;
    createdAt: string;
  }
  const [presets, setPresets] = useState<ClassPreset[]>(() => {
    try { return JSON.parse(localStorage.getItem("adaptly_worksheet_presets") || "[]"); } catch { return []; }
  });
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");

  const savePreset = () => {
    if (!presetName.trim()) { toast.error("Give your preset a name"); return; }
    const newPreset: ClassPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      subject, yearGroup, sendNeed, difficulty, examBoard, worksheetLength, readingAge,
      createdAt: new Date().toISOString(),
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    try { localStorage.setItem("adaptly_worksheet_presets", JSON.stringify(updated)); } catch {}
    setPresetName("");
    setShowSavePreset(false);
    toast.success(`Preset "${newPreset.name}" saved!`);
  };

  const loadPreset = (p: ClassPreset) => {
    setSubject(p.subject);
    setYearGroup(p.yearGroup);
    setSendNeed(p.sendNeed);
    setDifficulty(p.difficulty);
    setExamBoard(p.examBoard);
    setWorksheetLength(p.worksheetLength);
    setReadingAge(p.readingAge);
    toast.success(`Loaded "${p.name}"`);
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    try { localStorage.setItem("adaptly_worksheet_presets", JSON.stringify(updated)); } catch {}
    toast.success("Preset deleted");
  };
  // Natural language input
  const [nlInput, setNlInput] = useState("");
  const [nlExpanded, setNlExpanded] = useState(false);
  // Target page count (0 = auto, 1, 2, 3)
  const [targetPages, setTargetPages] = useState(0);
  // Reading age (0 = match year group, 7, 9, 11, 13)
  const [readingAge, setReadingAge] = useState(0);
  // Scenario swap state
  const [scenarioSwapLoading, setScenarioSwapLoading] = useState(false);
  const [showScenarioDialog, setShowScenarioDialog] = useState(false);
  const [scenarioInput, setScenarioInput] = useState("");
  // Reading level adjustment (post-generation)
  const [readingLevelLoading, setReadingLevelLoading] = useState(false);
  // Diagnostic Starter state
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{ questions: string[]; topic: string } | null>(null);
  const [showDiagnosticDialog, setShowDiagnosticDialog] = useState(false);
  const [diagnosticFailed, setDiagnosticFailed] = useState(false); // true = student failed, suggest easier version

  // Diagnostic Starter Chat (open chat tab)
  type DiagChatMessage = { role: "user" | "assistant"; content: string };
  const [diagChatMessages, setDiagChatMessages] = useState<DiagChatMessage[]>([]);
  const [diagChatInput, setDiagChatInput] = useState("");
  const [diagChatLoading, setDiagChatLoading] = useState(false);
  const diagChatEndRef = useRef<HTMLDivElement>(null);
  const [diagSheetResult, setDiagSheetResult] = useState<{ topic: string; questions: string[] } | null>(null);

  // Reset difficulty to a valid option when subject changes
  // Exam-style always defaults OFF — user must opt in
  useEffect(() => {
    if (subject) {
      const opts = getDifficultyOptions(subject);
      const validIds = opts.map(o => o.id);
      setDifficulty(prev => validIds.includes(prev) ? prev : (validIds.includes("mixed") ? "mixed" : validIds[0]));
    }
  }, [subject]);
  const [additionalInstructions, setAdditionalInstructions] = useState(() => preSelectedDescription);
  // Pre-fill additional instructions from URL description param (from Curriculum Progression)
  useEffect(() => { if (preSelectedDescription) setAdditionalInstructions(preSelectedDescription); }, []);
  // Syllabus-based topic suggestions
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const syllabusTopics = useMemo(() => {
    if (!subject || !yearGroup) return [];
    return getSyllabusTopics(subject, yearGroup);
  }, [subject, yearGroup]);
  // Diagram toggle — always off by default; user can enable it manually for any subject
  const [generateDiagram, setGenerateDiagram] = useState(false);
  const [isRevisionMat, setIsRevisionMat] = useState(false);
  const [useAI, setUseAI] = useState(true);

  const [loading, setLoading] = useState(false);
  const [generationStatus, setGenerationStatus] = useState(""); // live status during generation
  const [generated, setGenerated] = useState<AnyWorksheet | null>(null);
  const [viewMode, setViewMode] = useState<"teacher" | "student">("teacher");
  const [showOverlayPicker, setShowOverlayPicker] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [hiddenSections, setHiddenSections] = useState<Set<number>>(new Set());
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [editType, setEditType] = useState<"ai" | "manual" | "none">("none");
  const [editedSections, setEditedSections] = useState<Record<number, string>>({});
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  // AI Edit state
  const [aiEditSectionIndex, setAiEditSectionIndex] = useState<number | null>(null);
  const [aiEditPrompt, setAiEditPrompt] = useState("");
  const [aiEditLoading, setAiEditLoading] = useState(false);
  // Answer box size/remove state (per section index; 0 = removed)
  const [answerBoxSizes, setAnswerBoxSizes] = useState<Record<number, number>>({});
  const handleAnswerBoxSizeChange = (sectionIndex: number, lines: number) => {
    setAnswerBoxSizes(prev => ({ ...prev, [sectionIndex]: lines }));
  };
  const handleAnswerBoxRemove = (sectionIndex: number) => {
    setAnswerBoxSizes(prev => ({ ...prev, [sectionIndex]: 0 }));
  };
  const [rating, setRating] = useState(0);
  const [savedWorksheetId, setSavedWorksheetId] = useState<string | null>(null);
  const [textSize, setTextSize] = useState(14);
  const [voiceTargetSection, setVoiceTargetSection] = useState<number | null>(null);
  const [voiceAnswers, setVoiceAnswers] = useState<Record<number, string>>({});

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadSendNeed, setUploadSendNeed] = useState("");
  const [uploadYearGroup, setUploadYearGroup] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Bank state
  const [bankSearch, setBankSearch] = useState("");
  const [bankSubjectFilter, setBankSubjectFilter] = useState("all");
  const [bankYearFilter, setBankYearFilter] = useState("all");
  const [selectedBankSheet, setSelectedBankSheet] = useState<BankWorksheet | null>(null);
  const [bankViewMode, setBankViewMode] = useState<"teacher" | "student">("student");

  // Exam Question Search state
  const [examQSearch, setExamQSearch] = useState("");
  const [examQSubject, setExamQSubject] = useState("all");
  const [examQBoard, setExamQBoard] = useState("all");
  const [examQTier, setExamQTier] = useState("all");
  const [examQExpanded, setExamQExpanded] = useState<string | null>(null);
  const [examQPage, setExamQPage] = useState(1);
  const EXAM_PAGE_SIZE = 20;
  // Lazy-loaded question bank — only loaded when Exam Bank tab is first opened
  const [allPastPaperQuestions, setAllPastPaperQuestions] = useState<PastPaperQuestion[]>([]);
  const [examBankLoading, setExamBankLoading] = useState(false);
  const [examBankLoaded, setExamBankLoaded] = useState(false);
  // Debounced search to avoid filtering on every keystroke
  const debouncedExamQSearch = useDebounce(examQSearch, 250);
  // Multi-select state for Exam Hub
  const [selectedExamQIds, setSelectedExamQIds] = useState<Set<string>>(new Set());
  const selectedExamQuestions = useMemo(() => {
    return allPastPaperQuestions.filter(q => selectedExamQIds.has(q.id));
  }, [selectedExamQIds, allPastPaperQuestions]);

  // Pre-compute subject list and topic counts once when question bank loads
  const examBankSubjects = useMemo(() => {
    return Array.from(new Set(allPastPaperQuestions.map(q => q.subject).filter(Boolean))).sort() as string[];
  }, [allPastPaperQuestions]);

  const examBankTopicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of allPastPaperQuestions) {
      if (q.topic) counts[q.topic] = (counts[q.topic] || 0) + 1;
    }
    return counts;
  }, [allPastPaperQuestions]);

  // Filtered results — only recompute when debounced search or filters change
  const examQFiltered = useMemo(() => {
    const q = debouncedExamQSearch.toLowerCase().trim();
    if (!q && examQSubject === "all" && examQBoard === "all" && examQTier === "all") return null; // null = show topic overview
    const results = allPastPaperQuestions.filter(question => {
      const qText = question.text || question.question || '';
      if (!qText) return false;
      const matchSearch = !q ||
        (question.topic || '').toLowerCase().includes(q) ||
        qText.toLowerCase().includes(q) ||
        (question.subject || '').toLowerCase().includes(q);
      const matchSubject = examQSubject === "all" || question.subject === examQSubject;
      const matchBoard = examQBoard === "all" || question.board === examQBoard;
      const matchTier = examQTier === "all" || question.tier === examQTier;
      return matchSearch && matchSubject && matchBoard && matchTier;
    });
    // If the strict filter returns nothing but a board/tier was selected,
    // fall back to dropping the tier constraint (then board) so the user always sees something
    if (results.length === 0 && (examQBoard !== "all" || examQTier !== "all")) {
      const relaxTier = allPastPaperQuestions.filter(question => {
        const qText = question.text || question.question || '';
        if (!qText) return false;
        const matchSearch = !q ||
          (question.topic || '').toLowerCase().includes(q) ||
          qText.toLowerCase().includes(q) ||
          (question.subject || '').toLowerCase().includes(q);
        const matchSubject = examQSubject === "all" || question.subject === examQSubject;
        const matchBoard = examQBoard === "all" || question.board === examQBoard;
        return matchSearch && matchSubject && matchBoard;
      });
      if (relaxTier.length > 0) return relaxTier;
      // Also relax board
      const relaxBoth = allPastPaperQuestions.filter(question => {
        const qText = question.text || question.question || '';
        if (!qText) return false;
        const matchSearch = !q ||
          (question.topic || '').toLowerCase().includes(q) ||
          qText.toLowerCase().includes(q) ||
          (question.subject || '').toLowerCase().includes(q);
        const matchSubject = examQSubject === "all" || question.subject === examQSubject;
        return matchSearch && matchSubject;
      });
      return relaxBoth;
    }
    return results;
  }, [debouncedExamQSearch, examQSubject, examQBoard, examQTier, allPastPaperQuestions]);
  const selectedTotalMarks = useMemo(() => {
    return selectedExamQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }, [selectedExamQuestions]);
  const toggleExamQ = useCallback((id: string) => {
    setSelectedExamQIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // History state
  const [historySearch, setHistorySearch] = useState("");
  const [selectedHistorySheet, setSelectedHistorySheet] = useState<Worksheet | null>(null);
  const [historyEditMode, setHistoryEditMode] = useState(false);
  const [historyEditedSections, setHistoryEditedSections] = useState<Record<number, string>>({});
  const [historyAiEditIdx, setHistoryAiEditIdx] = useState<number | null>(null);
  const [historyAiPrompt, setHistoryAiPrompt] = useState("");
  const [historyAiLoading, setHistoryAiLoading] = useState(false);
  const [historyViewMode, setHistoryViewMode] = useState<"teacher" | "student">("teacher");
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  // "How to use" guide — collapsed by default
  const [howToOpen, setHowToOpen] = useState(false);
  // One-click differentiation
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewHtml, setPrintPreviewHtml] = useState<string>("");
  const [printPreviewLoading, setPrintPreviewLoading] = useState(false);
  const [printPreviewViewMode, setPrintPreviewViewMode] = useState<"teacher" | "student">("teacher");
  const [diffLoading, setDiffLoading] = useState<string | null>(null);
  const [diffVersions, setDiffVersions] = useState<Record<string, AIWorksheet>>({});
  // SEND need override for the scaffold dialog (lets teacher pick a different SEND need)
  const [sendNeedForScaffold, setSendNeedForScaffold] = useState<string>("");

  const worksheetRef = useRef<HTMLDivElement>(null);
  const uploadWorksheetRef = useRef<HTMLDivElement>(null);
  const historyContentRef = useRef<HTMLDivElement>(null);
  const historyPrintRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diagnosticRef = useRef<HTMLDivElement>(null);

  // tRPC mutations
  
  

  // Voice input
  const [currentVoiceText, setCurrentVoiceText] = useState("");
  const { listening: voiceListening, startListening, stopListening } = useVoiceInput((text) => {
    setCurrentVoiceText(text);
    if (voiceTargetSection !== null) {
      setVoiceAnswers(prev => ({ ...prev, [voiceTargetSection]: text }));
    }
  });

  // ── Worksheet Text-to-Speech (Read Aloud) ────────────────────────────────
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  // Floating selection TTS tooltip
  const [selectionTooltip, setSelectionTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [selectionTtsLoading, setSelectionTtsLoading] = useState(false);
  const selectionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up TTS audio URLs on unmount
  useEffect(() => {
    return () => {
      if (ttsAudioUrl) URL.revokeObjectURL(ttsAudioUrl);
    };
  }, [ttsAudioUrl]);

  // Listen for text selection on the worksheet to show the floating TTS tooltip.
  // Using mouseup (not selectionchange) because selectionchange fires many times
  // mid-drag and also fires with a collapsed selection immediately after mouseup,
  // causing the tooltip to flash and vanish. mouseup fires exactly once when the
  // user finishes selecting.
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Small delay so the browser has finalised the selection
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
          setSelectionTooltip(null);
          return;
        }
        const selectedText = selection.toString().trim();
        if (selectedText.length < 3) { setSelectionTooltip(null); return; }
        // Only show tooltip if selection is within the worksheet content
        const range = selection.getRangeAt(0);
        const worksheetEl = worksheetRef.current;
        if (!worksheetEl) return;
        const container = range.commonAncestorContainer;
        if (!worksheetEl.contains(container)) { setSelectionTooltip(null); return; }
        // Position tooltip above the selection
        const rect = range.getBoundingClientRect();
        setSelectionTooltip({
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY - 52,
          text: selectedText,
        });
      }, 80);
    };

    // Hide tooltip when clicking outside the worksheet or the tooltip itself
    const handleDocMouseDown = (e: MouseEvent) => {
      const worksheetEl = worksheetRef.current;
      const target = e.target as Node;
      // If click is outside the worksheet and not on the tooltip button, hide it
      if (worksheetEl && !worksheetEl.contains(target)) {
        // Check if click is on the floating tooltip button (has class no-print fixed)
        const isTooltipClick = (target as Element)?.closest?.(".selection-tts-tooltip");
        if (!isTooltipClick) setSelectionTooltip(null);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleDocMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleDocMouseDown);
    };
  }, []);

  // Stop TTS playback
  const stopTts = useCallback(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.src = "";
      ttsAudioRef.current = null;
    }
    setTtsPlaying(false);
    setTtsLoading(false);
  }, []);

  // Read the full worksheet aloud using neural TTS
  const handleReadAloud = useCallback(async () => {
    if (ttsPlaying || ttsLoading) { stopTts(); return; }
    if (!generated) return;
    // Build plain text from all visible sections
    const parts: string[] = [];
    if (generated.title) parts.push(generated.title);
    const visibleSections = generated.sections.filter((_, i) => !hiddenSections.has(i));
    for (const section of visibleSections) {
      if ((section as any).teacherOnly && viewMode === "student") continue;
      if (section.type === "answers" && viewMode === "student") continue;
      if (section.title) parts.push(section.title + ".");
      const content = section.content || "";
      // Strip HTML tags and KaTeX markup for clean TTS text
      const plainText = content
        .replace(/<[^>]+>/g, " ")
        .replace(/\\[a-zA-Z]+\{[^}]*\}/g, "")
        .replace(/\$[^$]*\$/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (plainText) parts.push(plainText);
    }
    const fullText = parts.join(" ");
    if (!fullText.trim()) return;
    setTtsLoading(true);
    try {
      const token = localStorage.getItem("send_token") || "";
      const res = await fetch("/api/revision/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
        body: JSON.stringify({ text: fullText.slice(0, 8000), voice: "nova", language: "en" }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "TTS failed"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (ttsAudioUrl) URL.revokeObjectURL(ttsAudioUrl);
      setTtsAudioUrl(url);
      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      audio.onended = () => { setTtsPlaying(false); setTtsLoading(false); };
      audio.onerror = () => { setTtsPlaying(false); setTtsLoading(false); toast.error("Audio playback failed."); };
      await audio.play();
      setTtsPlaying(true);
    } catch (e: any) {
      toast.error(e.message || "Read aloud failed. Please try again.");
    } finally {
      setTtsLoading(false);
    }
  }, [generated, hiddenSections, viewMode, ttsPlaying, ttsLoading, ttsAudioUrl, stopTts]);

  // Read highlighted/selected text aloud
  const handleReadSelection = useCallback(async (text: string) => {
    if (selectionTtsLoading) return;
    // Stop any existing selection audio
    if (selectionAudioRef.current) { selectionAudioRef.current.pause(); selectionAudioRef.current.src = ""; selectionAudioRef.current = null; }
    setSelectionTtsLoading(true);
    try {
      const token = localStorage.getItem("send_token") || "";
      const res = await fetch("/api/revision/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
        body: JSON.stringify({ text: text.slice(0, 4000), voice: "nova", language: "en" }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "TTS failed"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      selectionAudioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); setSelectionTtsLoading(false); };
      audio.onerror = () => { URL.revokeObjectURL(url); setSelectionTtsLoading(false); };
      await audio.play();
    } catch (e: any) {
      toast.error(e.message || "Could not read selection.");
    } finally {
      setSelectionTtsLoading(false);
    }
  }, [selectionTtsLoading]);

  // Set subject and topic from URL params on mount (used by Curriculum Progression one-click generate)
  useEffect(() => {
    if (preSelectedSubject) setSubject(preSelectedSubject);
    if (preSelectedTopic) setTopic(preSelectedTopic);
  }, []);

  const overlayBg = colorOverlays.find(o => o.id === colorOverlay)?.color || "#ffffff";

  // ─── Page-count enforcement for student view ────────────────────────────────
  // When the user selects a page limit (targetPages > 0) and viewMode is "student",
  // progressively remove sections in priority order until the content fits.
  //
  // PRIORITY (highest = keep, lowest = remove first):
  //   KEEP:   header, learning-objectives, section-A (guided), section-B (independent),
  //           worked-example, section-C (word-problems), common-mistakes, extension/challenge
  //   REMOVE: self-reflection, self-assessment, reminder-box, vocabulary, prior-knowledge,
  //           teacher-notes, mark-scheme, adaptations
  //
  // Estimation: ~2200 characters of content ≈ 1 A4 page at standard font size.
  const CHARS_PER_PAGE = 2200;
  const REMOVABLE_SECTION_PRIORITY: string[] = [
    // Remove first (least important for student learning)
    "self-reflection",    // How Did I Do? reflection box
    "self-assessment",    // Self Assessment (alias)
    "adaptations",        // SEND Adaptations — teacher copy only
    "teacher-notes",      // Teacher Notes
    "mark-scheme",        // Mark Scheme
    "answers",            // Answer section
    "prior-knowledge",    // Prior Knowledge recall
    "reminder-box",       // Reminder Box / Key Steps
    "vocabulary",         // Key Vocabulary
    // Remove last (important student-facing content)
    "challenge",          // Extension / Challenge (optional bonus)
    "word-problems",      // Section C — Word Problems
    "independent",        // Section B — Core Practice
    // guided (Section A), example (Worked Example), objective (Learning Objectives)
    // are NEVER removed — they are the core of the worksheet
  ];

  const displaySections = useMemo(() => {
    if (!generated) return [];
    // Start with all sections, applying teacher/student visibility rules
    let sections = generated.sections.filter((s) => {
      if (viewMode === "student") {
        // Always hide teacher-only, answers, mark-scheme, teacher-notes in student view
        if (s.teacherOnly || s.type === "answers" || s.type === "mark-scheme" || s.type === "teacher-notes" || s.type === "adaptations") return false;
      }
      return true;
    });

    // If no page limit or not in student view, return as-is
    if (targetPages <= 0 || viewMode !== "student") return sections;

    // Estimate total content size
    const estimateChars = (secs: typeof sections) =>
      secs.reduce((sum, s) => {
        const c = s.content;
        const len = typeof c === "string" ? c.length : Array.isArray(c) ? JSON.stringify(c).length : 0;
        return sum + len + 200; // +200 for section header overhead
      }, 400); // +400 for worksheet header

    const maxChars = targetPages * CHARS_PER_PAGE;

    // Progressively remove sections until we fit within the page limit
    for (const typeToRemove of REMOVABLE_SECTION_PRIORITY) {
      if (estimateChars(sections) <= maxChars) break;
      sections = sections.filter((s) => s.type !== typeToRemove);
    }

    return sections;
  }, [generated, viewMode, targetPages, editedSections]);

  // ─── Generate worksheet ────────────────────────────────────────────────────

  // Revision Mat instruction injected when toggle is on
  const REVISION_MAT_INSTRUCTIONS = `REVISION MAT FORMAT — READ EVERY RULE CAREFULLY:

You are creating a GCSE revision mat for the topic specified. Every single rule below is mandatory.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — ONE COMBINED TITLE/LO/VOCAB BOX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate exactly ONE section with:
  "type": "revision-mat-title"

Its "content" field must be formatted EXACTLY like this (no asterisks, no markdown):
[Topic Name]
LO: Students will be able to [one clear learning objective sentence].
Key Vocabulary:
[Term 1] — [brief definition]
[Term 2] — [brief definition]
[Term 3] — [brief definition]
[Term 4] — [brief definition]
[Term 5] — [brief definition]
[Term 6] — [brief definition]

Rules:
- First line = topic title only (no prefix like "Title:" — just the topic name)
- LO line must start exactly "LO: "
- Key Vocabulary section must start exactly "Key Vocabulary:"
- 5–8 vocabulary terms, one per line, format: Term — definition
- No bullet points, no numbering, no markdown, NO asterisks anywhere

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — EXACTLY 12 QUESTION BOXES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each box: "type": "revision-mat-box", "title": "", "marks": <integer>

⛔ ABSOLUTE RULES — VIOLATING ANY OF THESE IS WRONG:

1. QUESTIONS ONLY — never put answers, mark schemes, worked examples, or
   model answers in a question box. Every box must be a question a student
   answers, NOT a box containing the answer.

2. ONE QUESTION PER BOX — never put multiple questions in one box.
   WRONG: "1. Define fertilisation\n2. What is a gamete?\n3. Name the male gamete."
   RIGHT: Three separate boxes, each with ONE question.

3. COMPLETE QUESTIONS — every question must be fully written out and make sense
   on its own. Never truncate or cut off a question. The full question text,
   including all MCQ options, must fit in the "content" field.

4. MCQ MUST STAY TOGETHER — if a question has multiple choice options (a. b. c. d.),
   the question stem AND all four options must be in the SAME box content.
   WRONG: Putting the question in one box and options in another.
   RIGHT: "Which of the following is a gamete?\na. Zygote\nb. Sperm cell\nc. Ovary\nd. Uterus"

5. NO SECTION HEADINGS — do NOT write "Section A", "Section B", "Core Practice",
   "Recall", "Foundation", "Extension" or any heading as a box title or content.
   "title" must always be "" (empty string) for every question box.

6. NO ANSWERS IN BOXES — never include text like:
   "Fertilisation: the fusion of gametes" as if it were a question.
   Those are answers. Write the question instead: "Define fertilisation."

7. NO ASTERISKS — do not use * or ** anywhere in any content field.

REQUIRED MARK MIX (exactly 12 boxes total):
- 1-mark questions: 4 boxes  → short recall, define, state, fill-blank, true/false, MCQ
- 2-mark questions: 3 boxes  → name two, give two examples, explain briefly
- 3-mark questions: 2 boxes  → describe, explain with reason
- 4-mark questions: 2 boxes  → extended describe/explain, show working
- 6-mark question:  1 box    → evaluate, assess, extended response (Challenge)

REQUIRED QUESTION TYPES — include ALL of these across the 12 boxes:

• Multiple choice [1 mark]: question stem + exactly 4 options on separate lines:
  "Which of the following is [X]?\na. [option]\nb. [option]\nc. [option]\nd. [option]"
  ALL four options must be in the SAME content field as the question stem.

• Fill-in-the-blank [1 mark]: one sentence with ___ for missing word(s)
  Example: "The male gamete in flowering plants is found in ___."

• True / False [1 mark]: one clear statement followed by a new line with exactly:
  True / False
  Example: "Fertilisation occurs in the ovary.\nTrue / False"

• Short recall [1–2 marks]:
  Examples: "State two differences between sexual and asexual reproduction."
            "Name the female gamete in animals."
            "Give the term for a fertilised egg cell."

• Describe/Explain [2–3 marks]:
  Examples: "Explain why fertilisation cannot occur without pollination. [2 marks]"
            "Describe the process of fertilisation in flowering plants. [3 marks]"

• Extended response [4 marks]: full exam-style question with "[4 marks]" in the text
  Example: "Describe how pollen is transferred from one flower to another and explain what happens after it reaches the stigma. [4 marks]"

• Match-up [2 marks]: exactly this format (no headers, no extra text, just pairs):
  Term 1 | Definition 1
  Term 2 | Definition 2
  Term 3 | Definition 3
  Term 4 | Definition 4

• Challenge [6 marks]: starts with "Challenge:" and ends with "[6 marks]"
  Example: "Challenge: A student claims that asexual reproduction is always better than sexual reproduction. Evaluate this claim, referring to advantages and disadvantages of both types of reproduction. [6 marks]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JSON FIELD RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every question box MUST have:
- "type": "revision-mat-box"
- "title": ""  ← ALWAYS empty — no exceptions
- "marks": the mark value as an integer (1, 2, 3, 4, or 6)
- "content": the COMPLETE question text — no truncation, no answers, no asterisks

No self-reflection box. No working-out box. No extra sections.
One teacher section (teacherOnly: true) with mark scheme for all questions.

REMEMBER: Every question must be COMPLETE, CORRECT, and SPECIFIC to the topic. Do not generate placeholder text or incomplete questions.`;



  const handleGenerate = async () => {
    if (!subject || !yearGroup || !topic) {
      toast.error("Please fill in Subject, Year Group, and Topic.");
      return;
    }
    setLoading(true);
    setGenerationStatus("Connecting to AI...");
    setEditedSections({});
    setEditMode(false);
    setRating(0);
    setSavedWorksheetId(null);
    setVoiceAnswers({});

    // Cycle status messages so the user knows it's working
    const statusMessages = [
      "Building worksheet structure...",
      "Writing questions and content...",
      "Adding scaffolding and examples...",
      "Finishing up...",
    ];
    let statusIdx = 0;
    const statusInterval = setInterval(() => {
      statusIdx = (statusIdx + 1) % statusMessages.length;
      setGenerationStatus(statusMessages[statusIdx]);
    }, 4000);

    let generatedWs: AnyWorksheet | null = null;

    // ── EXAM-STYLE MODE: Generate AI worksheet then replace exercises with real exam questions ──────
    if (examStyle) {
      try {
        // Step 1: Generate the full AI worksheet (learning objectives, vocab, worked example, etc.)
        toast.info("Generating worksheet structure...");
        const aiResult = await aiGenerateWorksheet({
          subject, topic, yearGroup,
          sendNeed: sendNeed && sendNeed !== "none-selected" ? sendNeed : undefined,
          difficulty,
          examBoard: examBoard !== "none" ? examBoard : undefined,
          includeAnswers,
          examStyle: false, // Generate normal structure — we'll inject real exam questions
          additionalInstructions,
          isRevisionMat,
          generateDiagram: false, // No diagram in exam mode
          worksheetLength,
          introOnly: true, // Only generate intro sections (objectives, vocab, worked example) — exam questions will be injected from the bank
          targetPages: targetPages || undefined,
          readingAge: readingAge || undefined,
        });

        // Step 2: Replace exercise sections with real exam questions from the bank
        const { buildHybridExamWorksheet, hasPastPaperQuestions, getPastPaperDatabaseInfo } = await import('@/lib/examPaperBuilder');
        const hybridResult = buildHybridExamWorksheet({
          aiWorksheet: aiResult,
          subject,
          topic,
          yearGroup,
          examBoard: examBoard !== "none" ? examBoard : "AQA",
          difficulty,
          sendNeed: sendNeed && sendNeed !== "none-selected" ? sendNeed : undefined,
          includeAnswers,
          worksheetLength,
        });

        generatedWs = { ...hybridResult, isAI: true } as AIWorksheet;

        const hasQuestions = hasPastPaperQuestions(subject, examBoard !== "none" ? examBoard : "AQA");
        if (hasQuestions) {
          const dbInfo = getPastPaperDatabaseInfo();
          toast.success(`Worksheet generated with real exam questions from ${dbInfo.total} past paper questions!`);
        } else {
          toast.info("Worksheet generated — no past paper questions found for this subject, AI questions used.");
        }
      } catch (err) {
        console.error("Hybrid exam worksheet build failed:", err);
        toast.error("Could not build exam worksheet — falling back to AI generation.");
        // Fall through to AI generation
        try {
          const result = await aiGenerateWorksheet({
            subject, topic, yearGroup,
            sendNeed: sendNeed && sendNeed !== "none-selected" ? sendNeed : undefined,
            difficulty,
            examBoard: examBoard !== "none" ? examBoard : undefined,
            includeAnswers,
            examStyle: true,
            additionalInstructions,
            isRevisionMat,
            generateDiagram: false,
            worksheetLength,
            targetPages: targetPages || undefined,
            readingAge: readingAge || undefined,
          });
          generatedWs = { ...result, isAI: true } as AIWorksheet;
          toast.success("Exam-style worksheet generated with AI!");
        } catch (aiErr) {
          console.error("AI fallback also failed:", aiErr);
          toast.error("Generation failed. Please try again.");
        }
      }
    } else if (useAI) {
      // ── STANDARD AI MODE ───────────────────────────────────────────────────
      try {
        const result = await aiGenerateWorksheet({
          subject, topic, yearGroup,
          sendNeed: sendNeed && sendNeed !== "none-selected" ? sendNeed : undefined,
          difficulty,
          examBoard: examBoard !== "none" ? examBoard : undefined,
          includeAnswers,
          examStyle,
          additionalInstructions,
          isRevisionMat,
          generateDiagram,
          worksheetLength,
          recallTopic: recallTopic.trim() || undefined,
          targetPages: targetPages || undefined,
          readingAge: readingAge || undefined,
        });
        generatedWs = { ...result, isAI: true } as AIWorksheet;
        toast.success(generateDiagram ? "Worksheet with diagram generated!" : "Worksheet generated with AI!");
      } catch (err: any) {
        console.error("AI generation failed:", err?.message);
        const errMsg = err?.message || String(err);
        // Handle session expiry — show clear message and redirect to login
        if (errMsg.startsWith('AUTH_REQUIRED') || errMsg.includes('Session expired') || errMsg.includes('Authentication required')) {
          toast.error("Your session has expired. Redirecting to login...", { duration: 4000 });
          setTimeout(() => { window.location.href = '/login'; }, 2000);
          return;
        }
        if (errMsg.includes("No AI provider keys configured") || errMsg.includes("noKeysConfigured") || errMsg.includes("Settings → AI Providers")) {
          toast.error(
            "No AI keys configured. Go to Settings → AI Providers to add your school's API keys. Using local generator for now.",
            { duration: 10000 }
          );
          generatedWs = generateWorksheet({ subject, topic, yearGroup, sendNeed: sendNeed || undefined, difficulty, examBoard, includeAnswers, additionalInstructions });
        } else {
          // Retry across all available providers — server tries Groq→Cerebras→Gemini→OpenRouter→OpenAI→Claude→Mistral→DeepSeek
          const providerNames = ["Groq", "Gemini", "OpenRouter", "OpenAI", "Claude", "Mistral", "DeepSeek", "Fallback"];
          let retrySuccess = false;
          for (let attempt = 1; attempt <= 8; attempt++) {
            const providerLabel = providerNames[attempt - 1] ?? `Provider ${attempt}`;
            if (isPlatformAdmin) {
              setGenerationStatus(`Trying ${providerLabel}…`);
              toast(`Trying ${providerLabel}…`, { icon: "🔄", id: "ai-retry" });
            }
            await new Promise(r => setTimeout(r, 300));
            try {
              const retryResult = await aiGenerateWorksheet({
                subject, topic, yearGroup,
                sendNeed: sendNeed && sendNeed !== "none-selected" ? sendNeed : undefined,
                difficulty,
                examBoard: examBoard !== "none" ? examBoard : undefined,
                includeAnswers,
                examStyle,
                additionalInstructions,
                isRevisionMat,
                generateDiagram: false,
                worksheetLength,
                targetPages: targetPages || undefined,
                readingAge: readingAge || undefined,
              });
              generatedWs = { ...retryResult, isAI: true } as AIWorksheet;
              if (isPlatformAdmin) toast.success(`Worksheet generated via ${providerLabel}!`, { id: "ai-retry" });
              retrySuccess = true;
              break;
            } catch (retryErr: any) {
              // Stop retrying if it's an auth error
              if (retryErr?.message?.startsWith('AUTH_REQUIRED')) {
                toast.error("Your session has expired. Redirecting to login...", { duration: 4000 });
                setTimeout(() => { window.location.href = '/login'; }, 2000);
                return;
              }
              console.error(`Retry ${attempt} (${providerLabel}) failed:`, retryErr?.message);
            }
          }
          if (!retrySuccess) {
            toast.error("AI generation failed. Please refresh the page and try again.", { duration: 8000, id: "ai-retry" });
          }
        }
      }
    } else {
      await new Promise(r => setTimeout(r, 800));
      generatedWs = generateWorksheet({ subject, topic, yearGroup, sendNeed: sendNeed || undefined, difficulty, examBoard, includeAnswers, additionalInstructions });
      toast.success("Lesson generated!");
    }

    if (generatedWs) {
      setGenerated(generatedWs);
      setHiddenSections(new Set());
      setDiffVersions({});
      // Show quality warnings if detected
      const qIssues = (generatedWs.metadata as any)?.qualityIssues;
      if (qIssues && qIssues.length > 0) {
        setTimeout(() => {
          toast.warning(`Quality check: ${qIssues[0]}${qIssues.length > 1 ? ` (+${qIssues.length - 1} more)` : ""}. Consider regenerating if content looks wrong.`, { duration: 6000 });
        }, 1000);
      }
      // Auto-save on generate so dashboard updates immediately
      const ws = generatedWs;
      const sectionsToSave = ws.sections.map(s => ({ ...s }));
      const content = sectionsToSave.filter(s => !s.teacherOnly).map(s => `## ${s.title}\n${s.content}`).join("\n\n");
      const teacherContent = sectionsToSave.map(s => `## ${s.title}\n${s.content}`).join("\n\n");
      saveWorksheet({
        title: ws.title,
        subtitle: (ws as any).subtitle,
        subject: ws.metadata.subject,
        topic: ws.metadata.topic,
        yearGroup: ws.metadata.yearGroup,
        sendNeed: ws.metadata.sendNeed,
        difficulty: ws.metadata.difficulty,
        examBoard: ws.metadata.examBoard,
        content, teacherContent, rating: 0, overlay: colorOverlay,
        sections: sectionsToSave,
        metadata: ws.metadata as any,
        isAI: isAIWorksheet(ws),
      }).then(saved => {
        setSavedWorksheetId(saved.id);
        refreshData(); // Update dashboard counts immediately
      }).catch(() => {}); // Silent auto-save
    }

    clearInterval(statusInterval);
    setGenerationStatus("");
    setLoading(false);
  };

  // ─── Generate Diagnostic Starter ────────────────────────────────────────────
  const handleGenerateDiagnostic = async () => {
    if (!subject || !yearGroup || !topic) {
      toast.error("Please fill in Subject, Year Group, and Topic first.");
      return;
    }
    setDiagnosticLoading(true);
    setDiagnosticResult(null);
    setDiagnosticFailed(false);
    try {
      const storedToken = typeof localStorage !== "undefined" ? localStorage.getItem("send_token") : null;
      const diagnosticHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (storedToken) diagnosticHeaders["Authorization"] = `Bearer ${storedToken}`;
      const response = await fetch("/api/ai/diagnostic-starter", {
        method: "POST",
        headers: diagnosticHeaders,
        credentials: "include",
        body: JSON.stringify({ subject, yearGroup, topic, sendNeed: sendNeed && sendNeed !== "none-selected" ? sendNeed : undefined }),
      });
      if (!response.ok) throw new Error("Diagnostic generation failed");
      const data = await response.json();
      setDiagnosticResult({ questions: data.questions, topic });
      setShowDiagnosticDialog(true);
    } catch (err) {
      console.error("Diagnostic starter error:", err);
      toast.error("Could not generate diagnostic starter. Please try again.");
    } finally {
      setDiagnosticLoading(false);
    }
  };

  // ─── Diagnostic Starter Chat — send message and render as worksheet-style sheet ──
  const handleDiagChatSend = async () => {
    const userText = diagChatInput.trim();
    if (!userText || diagChatLoading) return;
    setDiagChatInput("");
    setDiagChatMessages(prev => [...prev, { role: "user", content: userText }]);
    setDiagChatLoading(true);
    setDiagSheetResult(null);
    try {
      const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('send_token') : null;
      const diagHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (storedToken) diagHeaders["Authorization"] = `Bearer ${storedToken}`;
      const res = await fetch("/api/ai/diagnostic-starter", {
        method: "POST",
        headers: diagHeaders,
        credentials: "include",
        body: JSON.stringify({ freeText: userText }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as any;
        throw new Error(errData?.error || `Diagnostic generation failed (${res.status})`);
      }
      const data = await res.json();
      const qs: string[] = Array.isArray(data.questions)
        ? data.questions.map((q: any) => (typeof q === "string" ? q : q.q || q.question || JSON.stringify(q)))
        : [];
      const topicLabel: string = data.topic || userText;
      setDiagSheetResult({ topic: topicLabel, questions: qs });
      setDiagChatMessages(prev => [...prev, { role: "assistant", content: `Generated ${qs.length} starter questions for "${topicLabel}"` }]);
    } catch (err) {
      console.error("Diagnostic starter error:", err);
      setDiagChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't generate questions. Please try again." }]);
    } finally {
      setDiagChatLoading(false);
    }
  };

  // Auto-scroll diagnostic chat to bottom
  useEffect(() => {
    diagChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [diagChatMessages, diagChatLoading]);

  // ─── Build worksheet from selected exam questions (Exam Hub multi-select) ──
  const handleBuildFromSelected = async () => {
    if (selectedExamQuestions.length === 0) {
      toast.error("Please select at least one question from the Exam Hub.");
      return;
    }
    setLoading(true);
    setEditedSections({});
    setEditMode(false);
    setRating(0);
    setSavedWorksheetId(null);
    setVoiceAnswers({});

    try {
      // Determine subject from selected questions
      const qSubject = selectedExamQuestions[0]?.subject || subject || "Mathematics";
      const qYearGroup = yearGroup || "Year 10";

      // Build worksheet directly from selected questions (no AI needed)
      const { buildSelectedQuestionsWorksheet } = await import('@/lib/examPaperBuilder');
      const ws = buildSelectedQuestionsWorksheet({
        questions: selectedExamQuestions,
        subject: qSubject,
        yearGroup: qYearGroup,
        sendNeed: sendNeed && sendNeed !== "none-selected" ? sendNeed : undefined,
        includeAnswers,
      });

      const generatedWs = { ...ws, isAI: true } as AIWorksheet;
      setGenerated(generatedWs);
      setDiffVersions({}); // Clear old diff versions when a new worksheet is generated
      setActiveTab("generate");

      // Auto-save
      const sectionsToSave = generatedWs.sections.map(s => ({ ...s }));
      const content = sectionsToSave.filter(s => !s.teacherOnly).map(s => `## ${s.title}\n${s.content}`).join("\n\n");
      const teacherContent = sectionsToSave.map(s => `## ${s.title}\n${s.content}`).join("\n\n");
      saveWorksheet({
        title: generatedWs.title,
        subtitle: (generatedWs as any).subtitle,
        subject: generatedWs.metadata.subject,
        topic: generatedWs.metadata.topic,
        yearGroup: generatedWs.metadata.yearGroup,
        sendNeed: generatedWs.metadata.sendNeed,
        difficulty: generatedWs.metadata.difficulty,
        examBoard: generatedWs.metadata.examBoard,
        content, teacherContent, rating: 0, overlay: colorOverlay,
        sections: sectionsToSave,
        metadata: generatedWs.metadata as any,
        isAI: true,
      }).then(saved => {
        setSavedWorksheetId(saved.id);
        refreshData();
      }).catch(() => {});

      toast.success(`Worksheet built with ${selectedExamQuestions.length} exam questions (${selectedTotalMarks} marks)!`);
      // Clear selection after building
      setSelectedExamQIds(new Set());
    } catch (err) {
      console.error("Build from selected questions failed:", err);
      toast.error("Failed to build worksheet from selected questions.");
    }

    setLoading(false);
  };

  // ─── Upload & adapt ────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      toast.error("Only PDF (.pdf) and Word (.doc, .docx) files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large. Maximum 10MB."); return; }
    setUploadFile(file);
    setUploadResult(null);
    setUploadPreview(null);
  };

  const handleUploadAdapt = async () => {
    if (!uploadFile || !uploadSendNeed) { toast.error("Please upload a file and select a SEND need."); return; }
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("sendNeed", uploadSendNeed);
      if (uploadYearGroup) formData.append("yearGroup", uploadYearGroup);
      const token = localStorage.getItem("send_token");
      const res = await fetch("/api/ai/adapt-worksheet", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setUploadResult(data);
      toast.success("Worksheet adapted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to adapt worksheet. Please try again.");
    }
    setUploadLoading(false);
  };

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!generated) return;
    // Apply any manual edits to sections before saving
    const sectionsWithEdits = generated.sections.map((s, i) => ({
      ...s,
      content: editedSections[i] !== undefined ? editedSections[i] : s.content,
    }));
    // Exclude hidden sections from saved content (but keep full sections array for re-editing)
    const visibleSections = sectionsWithEdits.filter((_, i) => !hiddenSections.has(i));
    const content = visibleSections.filter(s => !s.teacherOnly).map(s => `## ${s.title}\n${s.content}`).join("\n\n");
    const teacherContent = visibleSections.map(s => `## ${s.title}\n${s.content}`).join("\n\n");
    if (savedWorksheetId) {
      // Already auto-saved — just update the existing record with latest edits + rating
      await updateWorksheet(savedWorksheetId, { content, teacherContent, rating, overlay: colorOverlay, sections: sectionsWithEdits });
    } else {
      const saved = await saveWorksheet({
        title: generated.title,
        subtitle: (generated as any).subtitle,
        subject: generated.metadata.subject,
        topic: generated.metadata.topic,
        yearGroup: generated.metadata.yearGroup,
        sendNeed: generated.metadata.sendNeed,
        difficulty: generated.metadata.difficulty,
        examBoard: generated.metadata.examBoard,
        content, teacherContent, rating, overlay: colorOverlay,
        // Preserve full sections for re-editing
        sections: sectionsWithEdits,
        metadata: generated.metadata as any,
        isAI: isAIWorksheet(generated),
      });
      setSavedWorksheetId(saved.id);
    }
    await refreshData(); // Refresh dashboard counts
    toast.success("Lesson saved to history!");
  };

  // ─── PDF Download (pixel-perfect HTML-to-PDF) ─────────────────────────────
  const handleDownloadPdf = async () => {
    if (!generated) { toast.error("PDF error: no worksheet loaded"); return; }
    const container = worksheetRef.current || (document.querySelector(".worksheet-content") as HTMLElement);
    if (!container) { toast.error("PDF error: worksheet not found in DOM"); return; }
    const printRoot = (container.querySelector(".worksheet-print-root") as HTMLElement) || container;
    try {
      const filename = `${generated.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_${viewMode}.pdf`;
      await downloadHtmlAsPdf(printRoot, filename, {
        overlayColor: overlayBg,
        viewMode,
        textSize,
        title: generated.title,
        sendNeedId: generated?.metadata?.sendNeed || sendNeed || undefined,
        landscape: isRevisionMat,
      });
      toast.success(`PDF downloaded!`);
    } catch (err) {
      console.error("PDF download error:", err);
      toast.error("Could not generate PDF. Please try again.");
    }
  };

  // ─── Print (opens PrintOptionsDialog) ─────────────────────────────────
  const handlePrint = () => {
    setShowPrintDialog(true);
  };

  const handlePrintWithOptions = (options: PrintOptions) => {
    const container = worksheetRef.current || (document.querySelector(".worksheet-content") as HTMLElement);
    if (!container) return;
    printWorksheetElement(container, {
      overlayColor: overlayBg,
      viewMode: options.view,
      layout: options.layout,
      textSize,
      title: generated?.title,
      sendNeedId: generated?.metadata?.sendNeed || sendNeed || undefined,
      landscape: isRevisionMat,
    });
  };
  // ─── Paginated Print Preview ────────────────────────────────────────────────
  const handleOpenPrintPreview = async (previewViewMode: "teacher" | "student" = "teacher") => {
    const container = worksheetRef.current || (document.querySelector(".worksheet-content") as HTMLElement);
    if (!container) { toast.error("No worksheet loaded"); return; }
    setPrintPreviewViewMode(previewViewMode);
    setPrintPreviewLoading(true);
    setShowPrintPreview(true);
    setPrintPreviewHtml("");
    try {
      const contentHtml = serialiseElement(container, previewViewMode);
      const katexCss = getKatexCssInline();
      const sendNeedId = generated?.metadata?.sendNeed || sendNeed || undefined;
      const bg = overlayBg || "#ffffff";

      // A4 dimensions at 96dpi — landscape for revision mats
      const A4_W = isRevisionMat ? 1123 : 794;
      const A4_H = isRevisionMat ? 794 : 1123;
      const MARGIN = isRevisionMat ? 23 : 45; // ~6mm landscape, ~12mm portrait
      const CONTENT_H = A4_H - MARGIN * 2;

      // Step 1: Render content in a hidden measurement iframe at A4 width
      // to get the real rendered height of each block
      const { getSendFormatting } = await import("@/lib/send-data");
      const fmt = getSendFormatting(sendNeedId, textSize);

      const measureHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>${katexCss}</style>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: ${bg};
            font-family: ${fmt.fontFamily}; font-size: ${fmt.fontSize}px;
            line-height: ${fmt.lineHeight}; width: ${A4_W}px; }
          .worksheet-print-root { background: ${bg}; width: ${A4_W}px; padding: ${MARGIN}px; }
          .ws-teacher-section { ${previewViewMode === "student" ? "display:none!important;" : ""} }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .katex .katex-mathml { position:absolute!important; clip:rect(1px,1px,1px,1px)!important;
            padding:0!important; border:0!important; height:1px!important; width:1px!important; overflow:hidden!important; }
        </style></head><body>${contentHtml}</body></html>`;

      const measureIframe = document.createElement("iframe");
      measureIframe.style.cssText = `position:fixed;top:0;left:-9999px;width:${A4_W}px;height:${isRevisionMat ? A4_H : A4_H * 3}px;border:none;visibility:hidden;`;
      document.body.appendChild(measureIframe);

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("measure iframe timeout")), 15000);
        measureIframe.onload = () => { clearTimeout(timer); resolve(); };
        measureIframe.srcdoc = measureHtml;
      });
      try {
        const iDoc = measureIframe.contentDocument!;
        if (iDoc.fonts?.ready) await Promise.race([iDoc.fonts.ready, new Promise<void>(r => setTimeout(r, 2000))]);
      } catch (_) {}
      await new Promise<void>(r => requestAnimationFrame(() => setTimeout(r, 300)));

      // Step 2: Measure each direct child block of the print root
      const iDoc = measureIframe.contentDocument!;
      const root = iDoc.querySelector(".worksheet-print-root") as HTMLElement || iDoc.body;
      const blockEls = Array.from(root.querySelectorAll<HTMLElement>(":scope > *"));
      const blocks = blockEls.map(el => ({
        html: el.outerHTML,
        height: el.getBoundingClientRect().height,
      }));
      document.body.removeChild(measureIframe);

      // Step 3: Pack blocks into pages — never split a block across pages
      const pages: string[][] = [[]];
      let curPageH = 0;
      for (const blk of blocks) {
        if (curPageH === 0 || curPageH + blk.height <= CONTENT_H + 10) {
          pages[pages.length - 1].push(blk.html);
          curPageH += blk.height;
        } else {
          pages.push([blk.html]);
          curPageH = blk.height;
        }
      }

      // Step 4: Build paginated preview HTML — each page is a white A4 card
      const pageCards = pages.map((pageBlocks, i) => `
        <div class="preview-page">
          <div class="page-label">Page ${i + 1} of ${pages.length}</div>
          <div class="worksheet-print-root">${pageBlocks.join("")}</div>
        </div>`).join("");

      const previewHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>${katexCss}</style>
        <style>
          *, *::before, *::after { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: #374151;
            font-family: ${fmt.fontFamily}; font-size: ${fmt.fontSize}px;
            line-height: ${fmt.lineHeight}; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .katex .katex-mathml { position:absolute!important; clip:rect(1px,1px,1px,1px)!important;
            padding:0!important; border:0!important; height:1px!important; width:1px!important; overflow:hidden!important; }
          @page { size: ${isRevisionMat ? "A4 landscape" : "A4 portrait"}; margin: ${isRevisionMat ? "6mm" : "12mm"}; }
          .preview-page {
            position: relative;
            width: ${A4_W}px;
            min-height: ${A4_H}px;
            background: ${bg};
            margin: 28px auto;
            box-shadow: 0 4px 24px rgba(0,0,0,0.5);
          }
          .page-label {
            position: absolute;
            bottom: 6px; right: 10px;
            font-size: 10px; color: #9ca3af;
            font-family: Arial, sans-serif;
            pointer-events: none;
          }
          .worksheet-print-root {
            background: ${bg};
            padding: ${MARGIN}px;
            width: ${A4_W}px;
          }
          .ws-section { margin-bottom: 10px !important; border-radius: 4px !important;
            border: 1.5px solid #5b21b6 !important;
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .ws-header { border: 1.5px solid #5b21b6 !important; border-radius: 4px !important;
            margin-bottom: 10px !important; overflow: hidden !important;
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          th { background: #5b21b6 !important; color: white !important; padding: 8px 12px;
            text-align: left; font-weight: 600; }
          td { padding: 7px 12px; border: 1px solid #e5e7eb; vertical-align: top; }
          h1, h2, h3 { line-height: 1.3; }
          p { margin-bottom: 0.5em; }
          ul, ol { padding-left: 20px; margin: 6px 0; }
          li { margin-bottom: 4px; }
          .ws-teacher-section { ${previewViewMode === "student" ? "display:none!important;" : ""} }
        </style></head><body>${pageCards}</body></html>`;

      setPrintPreviewHtml(previewHtml);
    } catch (err) {
      console.error("Print preview error:", err);
      toast.error("Could not generate preview. Please try again.");
      setShowPrintPreview(false);
    } finally {
      setPrintPreviewLoading(false);
    }
  };

  // ─── AI Edit Section ────────────────────────────────────────────────────────
  const handleAiEditSection = async () => {
    if (aiEditSectionIndex === null || !aiEditPrompt.trim() || !generated) return;
    setAiEditLoading(true);
    try {
      const section = generated.sections[aiEditSectionIndex];
      const currentContent = getSectionContent(aiEditSectionIndex, section.content);
      const { newContent } = await aiEditSection({
        sectionTitle: section.title,
        currentContent,
        instruction: aiEditPrompt,
        subject: generated.metadata?.subject,
        yearGroup: generated.metadata?.yearGroup,
        sendNeed: generated.metadata?.sendNeed,
      });
      setEditedSections(prev => ({ ...prev, [aiEditSectionIndex]: newContent }));
      setAiEditSectionIndex(null);
      setAiEditPrompt("");
      toast.success("Section updated with AI!");
    } catch (e) {
      toast.error("AI edit failed. Please try again.");
    }
    setAiEditLoading(false);
  };

  // ─── Assign ──────────────────────────────────────────────────────────────────────
  const handleAssign = (childId: string) => {
    if (!generated) return;
    // Filter out teacher-only sections for student view
    const studentSections = generated.sections.filter(s => !s.teacherOnly);
    const content = studentSections.map(s => `## ${s.title}\n${s.content}`).join("\n\n");
    assignWork(childId, {
      title: generated.title,
      subtitle: (generated as any).subtitle,
      type: "worksheet",
      content,
      // Pass full sections so Parent Portal can render with WorksheetRenderer
      sections: studentSections,
      metadata: (generated as any).metadata,
    });
    setShowAssignDialog(false);
    toast.success("Worksheet assigned!");
  };

  const getSectionContent = (i: number, original: string) => editedSections[i] !== undefined ? editedSections[i] : original;

  // ─── Scenario Swap ──────────────────────────────────────────────────────────────
  const handleScenarioSwap = async () => {
    if (!generated || !scenarioInput.trim()) return;
    setScenarioSwapLoading(true);
    try {
      const ws = generated as AIWorksheet;
      const result = await aiScenarioSwap({
        sections: ws.sections,
        newScenario: scenarioInput.trim(),
        subject: ws.metadata?.subject || subject,
        yearGroup: ws.metadata?.yearGroup || yearGroup,
        sendNeed: ws.metadata?.sendNeed || sendNeed || undefined,
      });
      const swappedWorksheet: AIWorksheet = {
        ...ws,
        sections: result.sections as any,
        isAI: true as const,
      };
      setGenerated(swappedWorksheet);
      setEditedSections({});
      setShowScenarioDialog(false);
      setScenarioInput("");
      toast.success(`Questions recontextualized to "${scenarioInput.trim()}"!`);
    } catch (err) {
      console.error("Scenario swap failed:", err);
      toast.error("Scenario swap failed. Please try again.");
    }
    setScenarioSwapLoading(false);
  };

  // ─── Reading Level Adjustment (post-generation) ─────────────────────────────────
  const handleReadingLevelAdjust = async (age: number) => {
    if (!generated) return;
    setReadingLevelLoading(true);
    try {
      const ws = generated as AIWorksheet;
      const result = await aiAdjustReadingLevel({
        sections: ws.sections,
        targetAge: age,
        subject: ws.metadata?.subject || subject,
        yearGroup: ws.metadata?.yearGroup || yearGroup,
        sendNeed: ws.metadata?.sendNeed || sendNeed || undefined,
      });
      const adjustedWorksheet: AIWorksheet = {
        ...ws,
        sections: result.sections as any,
        isAI: true as const,
      };
      setGenerated(adjustedWorksheet);
      setEditedSections({});
      toast.success(`Reading level adjusted to Age ${age}!`);
    } catch (err) {
      console.error("Reading level adjustment failed:", err);
      toast.error("Reading level adjustment failed. Please try again.");
    }
    setReadingLevelLoading(false);
  };

  // ─── Natural Language Input handler ───────────────────────────────────────────
  // The NL bar is a shortcut: type freely and generate immediately.
  // Everything NOT mentioned in the prompt gets a clean standard default —
  // it does NOT inherit whatever the dropdowns happen to be showing right now.
  // "Year 11 fractions" → standard difficulty, no SEND, reading age auto, no exam style.
  const handleNlInput = async () => {
    if (!nlInput.trim()) return;
    const rawPrompt = nlInput.trim();
    const parsed = parseNaturalLanguageInput(rawPrompt);

    // Only use what was actually mentioned — clean defaults for everything else.
    const nextSubject    = parsed.subject   || "mathematics";
    const nextYearGroup  = parsed.yearGroup || "Year 10";
    // If parser couldn't find a topic, use the entire raw prompt as the topic
    // so the AI always gets useful context.
    const nextTopic      = parsed.topic     || rawPrompt;
    // Only set difficulty if explicitly mentioned — otherwise leave as "mixed" (standard)
    const nextDifficulty = parsed.difficulty || "mixed";
    // Only apply SEND if explicitly mentioned — otherwise no SEND adaptation
    const nextSendNeed   = parsed.sendNeed  || "none-selected";

    // Update the visible dropdowns so they reflect what was generated
    setSubject(nextSubject);
    setYearGroup(nextYearGroup);
    setTopic(nextTopic);
    setDifficulty(nextDifficulty);
    setSendNeed(nextSendNeed);
    // Clear any leftover options that weren't mentioned
    setExamStyle(false);
    setReadingAge(0);
    setAdditionalInstructions("");

    setNlInput("");
    setNlExpanded(false);
    setLoading(true);
    setGenerationStatus("Parsing your request...");
    setEditedSections({});
    setEditMode(false);
    setRating(0);
    setSavedWorksheetId(null);
    setVoiceAnswers({});

    const nlStatusMessages = ["Building worksheet...", "Writing questions...", "Adding content...", "Almost done..."];
    let nlStatusIdx = 0;
    const nlStatusInterval = setInterval(() => {
      nlStatusIdx = (nlStatusIdx + 1) % nlStatusMessages.length;
      setGenerationStatus(nlStatusMessages[nlStatusIdx]);
    }, 3500);

    let generatedWs: AnyWorksheet | null = null;
    try {
      if (useAI) {
        const result = await aiGenerateWorksheet({
          subject: nextSubject,
          topic: nextTopic,
          yearGroup: nextYearGroup,
          // Only pass sendNeed if one was explicitly detected
          sendNeed: parsed.sendNeed || undefined,
          difficulty: nextDifficulty,
          // Don't inherit examBoard from dropdown — use standard unless mentioned
          examBoard: undefined,
          includeAnswers,
          // Don't inherit examStyle from dropdown toggle
          examStyle: false,
          // Pass the raw prompt so AI gets the full context
          additionalInstructions: rawPrompt,
          generateDiagram: false,
          worksheetLength: "30",
          targetPages: undefined,
          readingAge: undefined,
        });
        generatedWs = { ...result, isAI: true } as AIWorksheet;
        toast.success("Worksheet generated!");
      } else {
        generatedWs = generateWorksheet({
          subject: nextSubject,
          topic: nextTopic,
          yearGroup: nextYearGroup,
          sendNeed: parsed.sendNeed || undefined,
          difficulty: nextDifficulty,
          examBoard: "none",
          includeAnswers,
          additionalInstructions: rawPrompt,
        });
        toast.success("Worksheet generated!");
      }
    } catch (err: any) {
      console.error("Natural-language worksheet generation failed:", err);
      const errMsg = err?.message || String(err);
      if (!errMsg.includes("No AI provider keys configured")) {
        const providerNames = ["Groq", "Gemini", "OpenRouter", "OpenAI", "Claude", "Mistral"];
        let retrySuccess = false;
        for (let attempt = 1; attempt <= 8; attempt++) {
          const providerLabel = providerNames[attempt - 1] ?? `Provider ${attempt}`;
          if (isPlatformAdmin) toast(`Trying ${providerLabel}…`, { icon: "🔄", id: "nl-retry" });
          await new Promise(r => setTimeout(r, Math.min(attempt * 400, 1200)));
          try {
            const retryResult = await aiGenerateWorksheet({
              subject: nextSubject, topic: nextTopic, yearGroup: nextYearGroup,
              sendNeed: parsed.sendNeed || undefined,
              difficulty: nextDifficulty,
              examBoard: undefined, examStyle: false,
              includeAnswers,
              additionalInstructions: rawPrompt,
              generateDiagram: false, worksheetLength: "30",
            });
            generatedWs = { ...retryResult, isAI: true } as AIWorksheet;
            if (isPlatformAdmin) toast.success(`Worksheet generated via ${providerLabel}!`, { id: "nl-retry" });
            retrySuccess = true;
            break;
          } catch (_) {}
        }
        if (!retrySuccess && isPlatformAdmin) {
          toast.error("All AI providers tried — check Settings → AI Providers.", { id: "nl-retry" });
        }
      } else {
        toast.error("No AI keys configured. Go to Settings → AI Providers.");
      }
    } finally {
      clearInterval(nlStatusInterval);
      setGenerationStatus("");
      setLoading(false);
    }

    if (generatedWs) {
      setGenerated(generatedWs);
      const ws = generatedWs;
      const sectionsToSave = ws.sections.map(s => ({ ...s }));
      const content = sectionsToSave.filter(s => !s.teacherOnly).map(s => `## ${s.title}\n${s.content}`).join("\n\n");
      const teacherContent = sectionsToSave.map(s => `## ${s.title}\n${s.content}`).join("\n\n");
      saveWorksheet({
        title: ws.title,
        subtitle: (ws as any).subtitle,
        subject: ws.metadata.subject,
        topic: ws.metadata.topic,
        yearGroup: ws.metadata.yearGroup,
        sendNeed: ws.metadata.sendNeed,
        difficulty: ws.metadata.difficulty,
        examBoard: ws.metadata.examBoard,
        content, teacherContent, rating: 0, overlay: colorOverlay,
        sections: sectionsToSave,
        metadata: ws.metadata as any,
        isAI: isAIWorksheet(ws),
      }).then(saved => {
        setSavedWorksheetId(saved.id);
        refreshData();
      }).catch(() => {});
    }
  };

  // ─── One-click differentiation ────────────────────────────────────────────
  const handleDifferentiate = async (tier: string) => {
    if (!generated) return;
    setDiffLoading(tier);
    try {
      const ws = generated as AIWorksheet;

      // ── SEND tier: transform the EXISTING worksheet with real scaffolding ──────
      // This uses the dedicated scaffold-worksheet endpoint which takes the current
      // worksheet sections and adds gap fills, sentence starters, word banks, and
      // hint boxes — preserving every original question verbatim.
      if (tier === "send") {
        const effectiveSendNeed =
          // 1. Explicit override from the dialog SEND need picker
          (sendNeedForScaffold && sendNeedForScaffold !== "none" && sendNeedForScaffold !== "none-selected")
            ? sendNeedForScaffold
            // 2. SEND need embedded in the worksheet metadata
            : (ws.metadata?.sendNeed && ws.metadata.sendNeed !== "none" && ws.metadata.sendNeed !== "none-selected")
              ? ws.metadata.sendNeed
              // 3. SEND need from the generate form
              : (sendNeed && sendNeed !== "none-selected" && sendNeed !== "")
                ? sendNeed
                : "general";

        // Get the non-teacher sections to scaffold (exclude answer sections)
        const sectionsToScaffold = (ws.sections || []).filter(
          (s: any) => !s.teacherOnly
        );

        const scaffolded = await aiScaffoldExistingWorksheet({
          sections: sectionsToScaffold,
          sendNeed: effectiveSendNeed,
          subject: ws.metadata?.subject || subject,
          topic: ws.metadata?.topic || topic,
          yearGroup: ws.metadata?.yearGroup || yearGroup,
          title: ws.title,
        });

        // Merge scaffolded sections back, preserving teacher-only sections
        // Fix section title prefix: AI returns "SECTION 1: Title" — strip the prefix
        const cleanedScaffoldedSections = (scaffolded.sections || []).map((s: any) => ({
          ...s,
          title: (s.title || "").replace(/^SECTION\s*\d+:\s*/i, "").trim() || s.title,
        }));

        // Update the SEND Adaptations & Rationale teacher section with actual scaffolding applied
        const teacherSections = (ws.sections || []).filter((s: any) => s.teacherOnly).map((s: any) => {
          if (/SEND Adaptations/i.test(s.title || "")) {
            const appliedList = (scaffolded.scaffoldingApplied || []).map((a: string) => `• ${a}`).join("\n");
            return {
              ...s,
              content: `THIS WORKSHEET HAS BEEN SCAFFOLDED FOR: ${effectiveSendNeed.toUpperCase()}\n\nADAPTATIONS APPLIED:\n${appliedList}\n\nWHY THIS MATTERS:\nThese adaptations have been applied to remove barriers for students with ${effectiveSendNeed}. Each scaffold directly supports access to the curriculum content while maintaining the same learning objectives as the standard worksheet.\n\nCLASSROOM TIPS:\n• Pre-teach the key vocabulary before distributing the worksheet\n• Allow additional processing time for each question\n• Check in with the student at the start of each section\n• Consider paired working or a reading partner if appropriate`,
            };
          }
          return s;
        });

        // If a word bank was generated, prepend it as a section
        const wordBankSection: { title: string; content: string; type: string; teacherOnly: boolean }[] = scaffolded.wordBank
          ? [{ title: "Word Bank", content: scaffolded.wordBank, type: "wordbank", teacherOnly: false }]
          : [];

        const scaffoldedWorksheet: AIWorksheet = {
          ...ws,
          sections: [...wordBankSection, ...cleanedScaffoldedSections, ...teacherSections],
          metadata: {
            ...ws.metadata,
            sendNeed: effectiveSendNeed,
            adaptations: scaffolded.scaffoldingApplied || [],
          },
          isAI: true as const,
        };

        setDiffVersions(prev => ({ ...prev, send: scaffoldedWorksheet }));
        setGenerated(scaffoldedWorksheet);
        setShowDiffDialog(false);
        toast.success(`SEND Scaffolded version created with ${effectiveSendNeed} adaptations!`);
        setDiffLoading(null);
        return;
      }

      // ── Foundation / Higher tiers: transform existing worksheet (faster than regenerating) ──
      const differentiated = await aiDifferentiateExistingWorksheet({
        sections: (ws.sections || []),
        tier: tier as 'foundation' | 'higher',
        subject: ws.metadata?.subject || subject,
        topic: ws.metadata?.topic || topic,
        yearGroup: ws.metadata?.yearGroup || yearGroup,
        title: ws.title,
      });

      // Merge differentiated pupil sections back, preserving teacher-only sections unchanged
      const cleanedDiffSections = (differentiated.sections || []).map((s: any) => ({
        ...s,
        title: (s.title || "").replace(/^SECTION\s*\d+:\s*/i, "").trim() || s.title,
      }));
      const teacherOnlySections = (ws.sections || []).filter((s: any) => s.teacherOnly);

      const differentiatedWorksheet: AIWorksheet = {
        ...ws,
        sections: [...cleanedDiffSections, ...teacherOnlySections],
        metadata: {
          ...ws.metadata,
          difficulty: tier,
        },
        isAI: true as const,
      };
      setDiffVersions(prev => ({ ...prev, [tier]: differentiatedWorksheet }));
      setGenerated(differentiatedWorksheet);
      setShowDiffDialog(false);
      toast.success(`${tier === "foundation" ? "Foundation" : "Higher"} version generated!`);
    } catch (err) {
      console.error("Differentiation failed:", err);
      toast.error("Differentiation failed. Please try again.");
    } finally {
      setDiffLoading(null);
    }
  };

  // ─── Filtered bank ─────────────────────────────────────────────────────────
  const filteredBank = worksheetBank.filter(w => {
    const q = bankSearch.toLowerCase();
    const matchSearch = !bankSearch || w.title.toLowerCase().includes(q) || w.topic.toLowerCase().includes(q) || w.tags.some(t => t.toLowerCase().includes(q));
    const matchSubject = bankSubjectFilter === "all" || w.subject === bankSubjectFilter;
    const matchYear = bankYearFilter === "all" || w.yearGroup === bankYearFilter;
    return matchSearch && matchSubject && matchYear;
  });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      </motion.div>

      {loading && !generated && (() => {
        const STAGES = [
          "Connecting to AI (Groq)…",
          "Building worksheet structure…",
          "Writing questions and worked example…",
          "Adding differentiation and vocabulary…",
          "Finalising your worksheet…",
        ];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white shadow-2xl border border-border/50 max-w-sm w-full mx-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
                <Sparkles className="w-6 h-6 text-brand absolute inset-0 m-auto" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground text-lg">Generating your worksheet</h3>
                {isPlatformAdmin ? (
                  generationStatus && generationStatus.startsWith("Trying") ? (
                    <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">{generationStatus}</p>
                  ) : (
                    <LoadingStageMessage stages={STAGES} />
                  )
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Crafting your personalised resource…</p>
                )}
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <AnimatedProgressBar />
              </div>
              {isPlatformAdmin ? (
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {["Groq","Gemini","OpenRouter","OpenAI","Claude","Mistral"].map(p => (
                    <span key={p} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${
                      generationStatus?.includes(p)
                        ? "bg-brand text-white border-brand"
                        : "bg-muted text-muted-foreground border-border/40"
                    }`}>{p}</span>
                  ))}
                </div>
              ) : (
                <FunFactsCarousel className="mt-1" />
              )}
              <p className="text-xs text-muted-foreground">Please wait — do not close this page</p>
            </div>
          </div>
        );
      })()}

      {!generated ? (
        <Tabs value={activeTab} onValueChange={(tab) => {
          setActiveTab(tab);
          // Lazy-load the question bank only when Exam Bank tab is first opened
          if (tab === 'exam-questions' && !examBankLoaded && !examBankLoading) {
            setExamBankLoading(true);
            import('@/lib/pastPaperQuestions').then(mod => {
              setAllPastPaperQuestions(mod.allPastPaperQuestions);
              setExamBankLoaded(true);
              setExamBankLoading(false);
            }).catch(() => setExamBankLoading(false));
          }
          // Reset pagination when switching to exam tab
          if (tab === 'exam-questions') setExamQPage(1);
        }}>
          <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className={`flex w-max min-w-full h-10`}>
            <TabsTrigger value="generate" className="text-xs gap-1 flex-1 min-w-[80px]"><Sparkles className="w-3 h-3" /><span className="hidden xs:inline">Generate</span><span className="xs:hidden">Gen</span></TabsTrigger>
            <TabsTrigger value="upload" className="text-xs gap-1 flex-1 min-w-[72px]"><Upload className="w-3 h-3" /> Upload</TabsTrigger>
            {showLibraryTab && (
              <TabsTrigger value="bank" className="text-xs gap-1 flex-1 min-w-[72px]"><Library className="w-3 h-3" /> Library</TabsTrigger>
            )}
            <TabsTrigger value="exam-questions" className="text-xs gap-1 flex-1 min-w-[80px]"><Award className="w-3 h-3" /><span className="hidden sm:inline">Exam Bank</span><span className="sm:hidden">Exams</span></TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1 flex-1 min-w-[72px]">
              <History className="w-3 h-3" /> History
              {worksheetHistory.length > 0 && (
                <span className="ml-1 bg-brand text-white text-[10px] rounded-full px-1.5 py-0">{worksheetHistory.length}</span>
              )}
            </TabsTrigger>
          </TabsList>
          </div>

          {/* ─── GENERATE TAB ──────────────────────────────────────────── */}
          <TabsContent value="generate" className="mt-4">
            <Card className="border-border/40 shadow-sm">
              <CardContent className="p-6 space-y-5">
                {/* Page heading */}
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand" /> Worksheet Generator</h2>
                  <p className="text-sm text-muted-foreground mt-1">Create differentiated, curriculum-aligned worksheets in seconds.</p>
                </div>

                {/* Natural Language Input */}
                <div className="p-4 rounded-xl border border-brand/30 bg-brand-light/20 space-y-2">
                  <Label className="text-sm font-medium text-brand flex items-center gap-1.5"><Wand2 className="h-4 w-4" /> What do you want to create today?</Label>
                  <div className="flex gap-2 items-start">
                    {nlExpanded ? (
                      <Textarea
                        value={nlInput}
                        onChange={e => setNlInput(e.target.value)}
                        onBlur={() => { if (!nlInput.trim()) setNlExpanded(false); }}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleNlInput(); }}
                        placeholder='e.g. "Year 7 fractions for dyslexia, foundation level, AQA" or "Primary Year 4 rainforests, 30 mins, ADHD support"'
                        className="flex-1 bg-white min-h-[100px] resize-none text-sm"
                        autoFocus
                        rows={4}
                      />
                    ) : (
                      <Input
                        value={nlInput}
                        onChange={e => setNlInput(e.target.value)}
                        onFocus={() => setNlExpanded(true)}
                        onKeyDown={e => { if (e.key === 'Enter') handleNlInput(); }}
                        placeholder='e.g. "Year 11 Fractions" or "Y7 Science Forces"'
                        className="h-10 flex-1 bg-white"
                      />
                    )}
                    <Button onClick={handleNlInput} disabled={!nlInput.trim()} size="sm" className="h-10 px-4 bg-brand hover:bg-brand/90 text-white shrink-0">
                      <Sparkles className="w-4 h-4 mr-1" /> Generate
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {nlExpanded
                      ? "💡 The more detail you give, the better the worksheet. Include: topic, year group, SEND need, difficulty level, time, exam board. Press Ctrl+Enter or click Generate."
                      : "💡 The more information you provide the better — include topic, year group, SEND need, difficulty and time for best results."}
                  </p>
                </div>

                {/* AI Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/80">
                  <div>
                    <p className="font-medium text-emerald-800 text-sm">AI Generation (Groq · Llama 3.1 8B)</p>
                    <p className="text-xs text-emerald-600">High-quality AI for rich, curriculum-aligned content</p>
                  </div>
                  <Switch checked={useAI} onCheckedChange={setUseAI} />
                </div>

                {/* Core fields */}
                <div className="p-4 rounded-xl border border-border/40 bg-slate-50/50 space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><FileText className="h-4 w-4 text-brand/70" /> Core Settings</h3>

                {/* How to use guide — collapsible */}
                <div className="rounded-lg bg-blue-50 border border-blue-100 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setHowToOpen(v => !v)}
                    className="w-full flex items-center justify-between gap-1.5 px-3 py-2.5 text-left hover:bg-blue-100/60 transition-colors"
                  >
                    <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 flex-shrink-0" /> How to use this generator
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-blue-500 flex-shrink-0 transition-transform duration-200 ${howToOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {howToOpen && (
                    <div className="px-3 pb-3 space-y-1.5 text-xs text-blue-700 leading-relaxed border-t border-blue-100">
                      <p className="pt-2">
                        <strong>Quick way:</strong> Use the AI bar above — type e.g. <em>"Year 9 Forces AQA foundation"</em> and hit Generate.
                        The dropdowns will be ignored.
                      </p>
                      <p>
                        <strong>Full control:</strong> Fill in Subject, Year Group and Topic below. Every field adds specificity —
                        the more detail you give, the better the output.
                      </p>
                      <p className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5 flex-shrink-0">★</span>
                        <span><strong>SEND Need field:</strong> Setting this tailors vocabulary, scaffolding, layout and instructions
                        specifically for that need — dyslexia gets larger spacing and colour overlays, ASC gets literal language and
                        structured steps, ADHD gets tick boxes and chunked tasks.</span>
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Subject *</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>{filteredSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Year Group *</Label>
                    <Select value={yearGroup} onValueChange={v => {
                      setYearGroup(v);
                      // Auto-set reading age to match the year group
                      const yrToAge: Record<string, number> = {
                        "Year 1": 5, "Year 2": 6, "Year 3": 7, "Year 4": 8,
                        "Year 5": 9, "Year 6": 10, "Year 7": 11, "Year 8": 12,
                        "Year 9": 13, "Year 10": 14, "Year 11": 15, "Year 12": 17,
                        "Year 13": 17, "KS1": 6, "KS2": 9, "KS3": 12,
                        "GCSE": 15, "A-Level": 17, "11+ Preparation": 10,
                      };
                      if (yrToAge[v] !== undefined) setReadingAge(yrToAge[v]);
                    }}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select year" /></SelectTrigger>
                      <SelectContent>{yearGroups.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <Label className="text-xs font-medium">Topic *</Label>
                  {syllabusTopics.length > 0 ? (
                    <div className="space-y-1">
                      <Select value={topic} onValueChange={(val) => { if (val === "__custom__") { setTopic(""); setShowTopicSuggestions(true); } else { setTopic(val); setShowTopicSuggestions(false); } }}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select a curriculum topic" /></SelectTrigger>
                        <SelectContent className="max-h-64">
                          {syllabusTopics.map((st, i) => {
                            // Show year-group label for topics from prior years (not the currently selected year)
                            const isFromPriorYear = st.yearGroup && yearGroup && st.yearGroup !== yearGroup;
                            return (
                              <SelectItem key={i} value={st.topic}>
                                <span>{st.topic}</span>
                                {isFromPriorYear && (
                                  <span className="ml-2 text-[10px] text-muted-foreground font-medium opacity-70">({st.yearGroup})</span>
                                )}
                              </SelectItem>
                            );
                          })}
                          <SelectItem value="__custom__">Enter custom topic...</SelectItem>
                        </SelectContent>
                      </Select>
                      {showTopicSuggestions && (
                        <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Type your custom topic..." className="h-10" autoFocus />
                      )}
                    </div>
                  ) : (
                    <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder={subject && yearGroup ? "No syllabus data — type a topic" : "Select subject & year group first"} className="h-10" />
                  )}
                  {syllabusTopics.length > 0 && !showTopicSuggestions && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{syllabusTopics.length} curriculum topics for {yearGroup} {subjects.find(s => s.id === subject)?.name || subject}{(() => {
                      const yr = parseInt((yearGroup || "").replace(/[^0-9]/g, ""), 10);
                      if (yr >= 2 && yr <= 6) return ` (Years 1–${yr})`;
                      if (yr >= 8 && yr <= 11) return ` (Years 7–${yr})`;
                      if (yr === 13) return ` (Years 12–13)`;
                      return "";
                    })()}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">SEND Need</Label>
                    <Select value={sendNeed} onValueChange={setSendNeed}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select SEND need" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none-selected">No specific need</SelectItem>
                        {sendNeeds.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      {subjectTierMode[subject?.toLowerCase()] === "tiered" ? "Tier" :
                       subjectTierMode[subject?.toLowerCase()] === "eleven-plus" ? "Level" : "Difficulty"}
                    </Label>
                    <div className="flex gap-1">
                      {getDifficultyOptions(subject || "").map(d => (
                        <button key={d.id} onClick={() => setDifficulty(d.id)}
                          title={d.description}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${difficulty === d.id ? "bg-brand text-white" : "bg-muted text-muted-foreground"}`}>
                          {d.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Worksheet Length inside core settings */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Worksheet Length</Label>
                  <div className="flex gap-1.5">
                    {[
                      { id: "10", name: "10 mins", desc: "Quick practice — 5–8 focused questions" },
                      { id: "30", name: "30 mins", desc: "Standard lesson — 15–20 questions" },
                      { id: "60", name: "1 hour", desc: "Full lesson — 30+ questions across all sections" },
                    ].map(l => (
                      <button key={l.id} onClick={() => setWorksheetLength(l.id)}
                        title={l.desc}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${worksheetLength === l.id ? "bg-brand text-white shadow-sm" : "bg-white text-muted-foreground border border-border/60 hover:border-brand/30"}`}>
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reading Age Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Reading Age</Label>
                    <span className="text-xs font-semibold text-brand">
                      {readingAge === 0 ? "Auto (match year group)" : readingAge >= 17 ? "Age 17+" : `Age ${readingAge}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-4">5</span>
                    <input
                      type="range"
                      min={0}
                      max={13}
                      step={1}
                      value={readingAge === 0 ? 0 : readingAge <= 5 ? 1 : readingAge <= 6 ? 2 : readingAge <= 7 ? 3 : readingAge <= 8 ? 4 : readingAge <= 9 ? 5 : readingAge <= 10 ? 6 : readingAge <= 11 ? 7 : readingAge <= 12 ? 8 : readingAge <= 13 ? 9 : readingAge <= 14 ? 10 : readingAge <= 15 ? 11 : readingAge <= 16 ? 12 : 13}
                      onChange={e => {
                        const v = Number(e.target.value);
                        if (v === 0) setReadingAge(0);
                        else {
                          const ages = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
                          setReadingAge(ages[v - 1] ?? 0);
                        }
                      }}
                      className="flex-1 h-2 accent-brand cursor-pointer"
                    />
                    <span className="text-[10px] text-muted-foreground w-5">17+</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground px-5">
                    <span>Auto</span>
                    <span>KS1</span>
                    <span>KS2</span>
                    <span>KS3</span>
                    <span>GCSE</span>
                    <span>A-Level</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Controls vocabulary complexity and sentence length. Academic difficulty stays the same.</p>
                </div>
                </div>{/* End core settings box */}

                {sendNeed && sendNeed !== "none-selected" && (
                  <SENDInfoPanel sendNeedId={sendNeed} context="worksheet" />
                )}

                {/* Advanced Options - collapsible */}
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-border/40 bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                    <span className="text-sm font-medium text-foreground">Advanced Options</span>
                    <span className="text-xs text-muted-foreground ml-auto">Recall topic, exam board, instructions & more</span>
                  </summary>
                  <div className="mt-3 p-4 rounded-xl border border-border/40 bg-slate-50/30 space-y-4">

                {/* Recall Topic - moved to advanced */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Recall Topic (optional)</Label>
                  <Input
                    value={recallTopic}
                    onChange={e => setRecallTopic(e.target.value)}
                    placeholder="e.g. Fractions, Photosynthesis… — adds 2–3 recap questions at the start"
                    className="h-10"
                  />
                  <p className="text-[10px] text-muted-foreground">If set, 2–3 recall questions on this previous topic will appear at the top of the worksheet before the main content.</p>
                </div>

                {/* Page Count — moved to Advanced Options */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Page Count (optional)</Label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTargetPages(0)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        targetPages === 0 ? "bg-brand text-white border-brand" : "bg-white text-foreground border-border hover:border-brand/30"
                      }`}>
                      Auto
                    </button>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={targetPages > 0 ? targetPages : ""}
                        placeholder="e.g. 1, 2, 4..."
                        onChange={e => {
                          const v = parseInt(e.target.value);
                          setTargetPages(isNaN(v) || v < 1 ? 0 : Math.min(v, 20));
                        }}
                        className="flex-1 h-9 px-3 rounded-lg text-xs border border-border focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">pages</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Set how many A4 pages the worksheet should fill. Leave as Auto to let the AI decide based on worksheet length.</p>
                </div>

                <div className="hidden">
                  <Label className="text-xs font-medium">Exam Board (GCSE / A-Level)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {examBoards.map(eb => (
                      <button key={eb.id} onClick={() => setExamBoard(eb.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${examBoard === eb.id ? "bg-brand text-white border-brand" : "bg-white text-foreground border-border hover:border-brand/30"}`}>
                        {eb.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Additional Instructions (optional)</Label>
                  <Textarea value={additionalInstructions} onChange={e => setAdditionalInstructions(e.target.value)}
                    placeholder={`Examples:\n• "Include 2 worked examples showing full method steps"\n• "Focus on calculating gradient, avoid y-intercept"\n• "Add a formulae box at the top, use Edexcel command words"\n• "Make questions progressively harder, last 2 must be exam-style"\n• "Include a data table students fill in"`}
                    className="min-h-[80px] text-sm" />
                  <p className="text-[10px] text-muted-foreground">Specific instructions override defaults. The more detail you give, the better the output.</p>
                </div>

                <div className="flex flex-wrap gap-4 items-center py-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={includeAnswers} onCheckedChange={setIncludeAnswers} id="answers-sw" />
                    <Label htmlFor="answers-sw" className="text-xs">Include answers & mark scheme</Label>
                  </div>
                  {useAI && (
                    <div className="flex items-center gap-2">
                      <Switch checked={generateDiagram} onCheckedChange={setGenerateDiagram} id="diagram-sw" />
                      <Label htmlFor="diagram-sw" className="text-xs flex items-center gap-1">
                        <Image className="h-3 w-3" /> Include topic diagram
                      </Label>
                    </div>
                  )}
                </div>
                  </div>{/* End advanced options content */}
                </details>

                {/* ── Class Presets ────────────────────────────────────────── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>📌</span> Class Presets
                    </Label>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5 border-brand/30 text-brand hover:bg-brand-light"
                      onClick={() => { setPresetName(""); setShowSavePreset(true); }}
                    >
                      + Save current as preset
                    </Button>
                  </div>

                  {/* Save preset dialog */}
                  {showSavePreset && (
                    <div className="p-3 rounded-xl border border-brand/30 bg-brand-light/20 space-y-2">
                      <p className="text-xs text-muted-foreground">Name this preset (e.g. "Year 7 Set 3 — Maths")</p>
                      <div className="flex gap-2">
                        <Input
                          value={presetName}
                          onChange={e => setPresetName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") savePreset(); if (e.key === "Escape") setShowSavePreset(false); }}
                          placeholder="e.g. Year 9 Foundation Maths"
                          className="h-8 text-sm flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={savePreset} className="h-8 bg-brand hover:bg-brand/90 text-white text-xs">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowSavePreset(false)} className="h-8 text-xs">Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Preset chips */}
                  {presets.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {presets.map(p => (
                        <div key={p.id} className="flex items-center gap-1 bg-muted rounded-lg border border-border/50 pl-2.5 pr-1 py-1">
                          <button
                            onClick={() => loadPreset(p)}
                            className="text-xs font-medium text-foreground hover:text-brand transition-colors"
                          >
                            {p.name}
                          </button>
                          <button
                            onClick={() => deletePreset(p.id)}
                            className="w-4 h-4 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors text-[10px]"
                            title="Delete preset"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {presets.length === 0 && !showSavePreset && (
                    <p className="text-[10px] text-muted-foreground">Save your current settings as a preset for quick re-use with the same class.</p>
                  )}
                </div>

                {/* Revision Mat Toggle — prominent, outside advanced options */}
                <div
                  onClick={() => setIsRevisionMat(!isRevisionMat)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                    isRevisionMat
                      ? "border-amber-400 bg-amber-50"
                      : "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isRevisionMat ? "bg-amber-500" : "bg-muted"}`}>
                      <span className="text-lg">{isRevisionMat ? "📐" : "📋"}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">Revision Mat</p>
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Different layout</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isRevisionMat
                          ? "Landscape · 3-tier grid · Foundation / Core / Extension on one sheet"
                          : "Switch to a landscape revision mat with activities circling a central topic"}
                      </p>
                    </div>
                  </div>
                  <Switch checked={isRevisionMat} onCheckedChange={setIsRevisionMat} id="revmat-sw" onClick={e => e.stopPropagation()} />
                </div>

                <Button onClick={handleGenerate} disabled={loading} className="w-full h-12 bg-brand hover:bg-brand/90 text-white text-base font-semibold shadow-sm">
                  {loading
                    ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />{generationStatus || (useAI ? "Generating with AI..." : "Generating...")}</>
                    : <><Sparkles className="w-4 h-4 mr-2" /> Generate Worksheet</>}
                </Button>

                {/* Diagnostic Starter button */}
                <Button
                  variant="outline"
                  onClick={handleGenerateDiagnostic}
                  disabled={diagnosticLoading || loading || !subject || !yearGroup || !topic}
                  className="w-full h-10 border-brand/40 text-brand hover:bg-brand-light/30 gap-2"
                >
                  {diagnosticLoading
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Generating Diagnostic...</>
                    : <><ClipboardCheck className="w-3.5 h-3.5" />Generate Diagnostic Starter</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── UPLOAD TAB ────────────────────────────────────────────── */}
          <TabsContent value="upload" className="mt-4">
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Upload a worksheet (PDF or Word document)</p>
                    <p className="text-xs mt-0.5">All questions, symbols (× ÷ √ ²), and content are preserved verbatim. Only formatting and presentation are adapted for the SEND need.</p>
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileSelect({ target: { files: [file] } } as any);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {uploadFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-emerald-600">
                        <FileText className="h-8 w-8" />
                        <span className="font-medium">{uploadFile.name}</span>
                      </div>
                      <p className="text-sm text-gray-500">Click to change file</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">Drop worksheet here or click to browse</p>
                      <p className="text-gray-400 text-sm mt-1">PDF (.pdf) or Word (.doc, .docx) — up to 10MB</p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">SEND Need *</Label>
                    <Select value={uploadSendNeed} onValueChange={setUploadSendNeed}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select SEND need" /></SelectTrigger>
                      <SelectContent>{sendNeeds.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Year Group</Label>
                    <Select value={uploadYearGroup} onValueChange={setUploadYearGroup}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Optional" /></SelectTrigger>
                      <SelectContent>{yearGroups.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                {uploadSendNeed && (
                  <SENDInfoPanel sendNeedId={uploadSendNeed} context="worksheet" />
                )}

                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  All questions and symbols are preserved verbatim — only formatting is adapted
                </div>

                <Button onClick={handleUploadAdapt} disabled={uploadLoading || !uploadFile || !uploadSendNeed} className="w-full h-11 bg-brand hover:bg-brand/90 text-white">
                  {uploadLoading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Adapting with AI...</> : <><Sparkles className="h-4 w-4 mr-2" />Adapt Worksheet for SEND</>}
                </Button>

                {/* Upload result — rendered using WorksheetRenderer for professional output */}
                {uploadResult && (() => {
                  const adapted = uploadResult.adapted;
                  // Build a GeneratedWorksheet-compatible object from the adapted result.
                  // Use a non-mutating spread so re-renders don't duplicate the teacherSection.
                  const baseSections: any[] = adapted?.sections ?? [
                    { title: "Adapted Worksheet", type: "guided", content: adapted?.adaptedContent || "", teacherOnly: false }
                  ];
                  const sections = adapted?.teacherSection && !baseSections.some((s: any) => s.teacherOnly)
                    ? [...baseSections, { ...adapted.teacherSection, teacherOnly: true }]
                    : baseSections;
                  const uploadedWorksheet = {
                    title: adapted?.title || uploadFile?.name?.replace(/\.[^.]+$/, "") || "Adapted Worksheet",
                    subtitle: adapted?.subtitle || `${uploadYearGroup || "Year 9"} — Adapted for ${sendNeeds.find(n => n.id === uploadSendNeed)?.name || uploadSendNeed}`,
                    sections,
                    metadata: {
                      subject: "uploaded",
                      topic: adapted?.title || "Uploaded worksheet",
                      yearGroup: uploadYearGroup || "Year 9",
                      sendNeed: uploadSendNeed,
                      sendNeedId: uploadSendNeed,
                      difficulty: "mixed",
                      adaptations: adapted?.adaptationsSummary || [],
                    },
                  };
                  return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-sm">Adaptation complete — content preserved verbatim</span>
                      </div>
                      {adapted?.adaptationsSummary?.length > 0 && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="font-medium text-purple-800 text-xs mb-1">Formatting adaptations applied:</p>
                          <ul className="text-xs text-purple-700 space-y-0.5">
                            {adapted.adaptationsSummary.map((a: string, i: number) => (
                              <li key={i} className="flex items-start gap-1"><CheckCircle className="h-3 w-3 text-purple-500 flex-shrink-0 mt-0.5" />{a}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* Professional worksheet renderer — same as generated worksheets */}
                      <div className="border rounded-xl overflow-hidden shadow-sm" ref={uploadWorksheetRef}>
                        <WorksheetRenderer
                          worksheet={uploadedWorksheet as any}
                          viewMode="student"
                          textSize={textSize}
                          overlayColor={overlayBg || colorOverlays.find(o => o.id === "cream")?.color || ""}
                          editedSections={{}}
                          schoolLogoUrl={preferences.schoolLogoUrl}
                          schoolName={preferences.schoolName}
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (uploadWorksheetRef.current) printWorksheetElement(uploadWorksheetRef.current);
                          }}
                        >
                          <Printer className="h-4 w-4 mr-1" />Print
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (uploadWorksheetRef.current) {
                              try {
                                await downloadHtmlAsPdf(uploadWorksheetRef.current, `${uploadedWorksheet.title}_adapted.pdf`);
                                toast.success("PDF downloaded!");
                              } catch { toast.error("Could not generate PDF. Please try again."); }
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />Download PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 border-brand/30 text-brand hover:bg-brand/5"
                          onClick={async () => {
                            try {
                              await saveWorksheet({
                                title: uploadedWorksheet.title,
                                subtitle: uploadedWorksheet.subtitle,
                                subject: "uploaded",
                                topic: "Uploaded & adapted worksheet",
                                yearGroup: uploadYearGroup || "",
                                sendNeed: uploadSendNeed,
                                difficulty: "mixed",
                                content: sections.filter((s: any) => !s.teacherOnly).map((s: any) => `## ${s.title}
${s.content}`).join("\n\n"),
                                teacherContent: sections.map((s: any) => `## ${s.title}
${s.content}`).join("\n\n"),
                                sections: sections as any,
                                isAI: true,
                              });
                              await refreshData();
                              toast.success("Saved to history!");
                            } catch { toast.error("Could not save. Please try again."); }
                          }}
                        >
                          <Save className="h-4 w-4 mr-1" />Save to History
                        </Button>
                      </div>
                    </motion.div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── BANK TAB ──────────────────────────────────────────────── */}
          <TabsContent value="bank" className="mt-4 space-y-3">
            <Card className="border-border/50">
              <CardContent className="p-3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input value={bankSearch} onChange={e => setBankSearch(e.target.value)} placeholder="Search worksheets..." className="pl-9 h-9" />
                </div>
                <div className="flex gap-2">
                  <Select value={bankSubjectFilter} onValueChange={setBankSubjectFilter}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="All subjects" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      {filteredSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={bankYearFilter} onValueChange={setBankYearFilter}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="All years" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All years</SelectItem>
                      {yearGroups.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-500">{filteredBank.length} worksheets — dyslexia-friendly fonts, SEND adaptations built in</p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {filteredBank.map(ws => (
                <Card key={ws.id} className="hover:shadow-md transition-shadow cursor-pointer border-border/50" onClick={() => setSelectedBankSheet(ws)}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">{ws.title}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="outline" className="text-xs py-0">{ws.yearGroup}</Badge>
                          <Badge variant="outline" className="text-xs py-0">{ws.difficulty}</Badge>
                          <Badge className="text-xs py-0 bg-emerald-100 text-emerald-700">SEND Friendly</Badge>
                          <span className="text-xs text-gray-400">{ws.source}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span><Clock className="h-3 w-3 inline mr-0.5" />{ws.estimatedTime}</span>
                          {ws.totalMarks && <span><Award className="h-3 w-3 inline mr-0.5" />{ws.totalMarks} marks</span>}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredBank.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Library className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No worksheets match your search.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── EXAM QUESTIONS TAB ──────────────────────────────────────────────────────────────────────── */}
          <TabsContent value="exam-questions" className="mt-4 space-y-3">
            {/* Loading state while question bank is being loaded */}
            {examBankLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading question bank...</p>
              </div>
            )}
            {!examBankLoading && (
            <>{/* Search & filter bar */}
            <Card className="border-border/50">
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-foreground">Exam Hub — Select Questions</span>
                  <Badge className="ml-auto bg-blue-100 text-blue-700 text-xs">{allPastPaperQuestions.length} questions</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Search and tick questions to build a custom worksheet from real past paper questions. Select multiple questions, then click "Build Worksheet".</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={examQSearch}
                    onChange={e => { setExamQSearch(e.target.value); setExamQPage(1); }}
                    placeholder="Search by topic (e.g. Fractions, Algebra, Forces...)"
                    className="pl-9 h-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={examQSubject} onValueChange={v => { setExamQSubject(v); setExamQPage(1); }}>
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-[120px]"><SelectValue placeholder="All subjects" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      {examBankSubjects.map(s => (
                        <SelectItem key={s} value={s}>{s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={examQBoard} onValueChange={v => { setExamQBoard(v); setExamQPage(1); }}>
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-[100px]"><SelectValue placeholder="All boards" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All boards</SelectItem>
                      {["AQA", "Edexcel", "OCR", "WJEC", "STA", "KS2 SATs", "Adaptly"].map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={examQTier} onValueChange={v => { setExamQTier(v); setExamQPage(1); }}>
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-[100px]"><SelectValue placeholder="All tiers" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tiers</SelectItem>
                      <SelectItem value="Higher">Higher</SelectItem>
                      <SelectItem value="Foundation">Foundation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Floating selection bar */}
            {selectedExamQIds.size > 0 && (
              <Card className="border-blue-300 bg-blue-50 sticky top-0 z-10 shadow-md">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">
                        {selectedExamQIds.size} question{selectedExamQIds.size !== 1 ? 's' : ''} selected
                      </span>
                      <Badge className="bg-blue-200 text-blue-800 text-xs">{selectedTotalMarks} marks</Badge>
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                        ~{Math.max(5, Math.round(selectedTotalMarks * 1.5))} mins
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 border-blue-300 text-blue-600 hover:bg-blue-100"
                        onClick={() => setSelectedExamQIds(new Set())}
                      >
                        <X className="h-3 w-3 mr-1" /> Clear
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleBuildFromSelected}
                        disabled={loading}
                      >
                        {loading ? (
                          <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Building...</>
                        ) : (
                          <><Sparkles className="h-3 w-3 mr-1" /> Build Worksheet</>
                        )}
                      </Button>
                    </div>
                  </div>
                  {/* Show selected question summaries */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedExamQuestions.slice(0, 8).map(q => (
                      <Badge
                        key={q.id}
                        className="text-xs py-0 bg-white text-blue-700 border border-blue-200 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        onClick={() => toggleExamQ(q.id)}
                      >
                        {q.topic} ({q.marks}m) <X className="h-2.5 w-2.5 ml-1" />
                      </Badge>
                    ))}
                    {selectedExamQuestions.length > 8 && (
                      <Badge variant="outline" className="text-xs py-0 text-blue-500">+{selectedExamQuestions.length - 8} more</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {(() => {
              // Topic overview (no filters active)
              if (examQFiltered === null) {
                const topics = Object.keys(examBankTopicCounts).sort();
                return (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 px-1">{topics.length} topics available — type a topic name or select a subject above to search</p>
                    <div className="flex flex-wrap gap-2">
                      {topics.slice(0, 60).map(topic => (
                        <button
                          key={topic}
                          onClick={() => { setExamQSearch(topic || ''); setExamQPage(1); }}
                          className="px-3 py-1.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          {topic} <span className="text-blue-400">({examBankTopicCounts[topic]})</span>
                        </button>
                      ))}
                      {topics.length > 60 && (
                        <span className="px-3 py-1.5 text-xs text-gray-400">+{topics.length - 60} more topics — use the search box</span>
                      )}
                    </div>
                  </div>
                );
              }

              if (examQFiltered.length === 0) {
                // Find closest matches ignoring the board/tier filter to help user
                const subjectOnlyMatches = allPastPaperQuestions.filter(q => {
                  const qText = q.text || q.question || '';
                  const matchSubject = examQSubject === "all" || q.subject === examQSubject;
                  const matchSearch = !debouncedExamQSearch.trim() ||
                    (q.topic || '').toLowerCase().includes(debouncedExamQSearch.toLowerCase()) ||
                    qText.toLowerCase().includes(debouncedExamQSearch.toLowerCase());
                  return matchSubject && matchSearch;
                }).slice(0, 6);
                return (
                  <div className="text-center py-8 text-gray-400 space-y-3">
                    <Search className="h-10 w-10 mx-auto opacity-40" />
                    <p className="text-sm font-medium text-gray-500">No questions match that exact combination.</p>
                    <p className="text-xs text-gray-400">Try selecting "All boards" or "All tiers" — our question bank is primarily AQA.</p>
                    {subjectOnlyMatches.length > 0 && (
                      <div className="text-left mt-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2 px-1">Similar questions from other boards/tiers:</p>
                        <div className="space-y-1.5">
                          {subjectOnlyMatches.map(q => (
                            <button
                              key={q.id}
                              onClick={() => { setExamQBoard("all"); setExamQTier("all"); }}
                              className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
                            >
                              <div className="flex gap-1 mb-0.5 flex-wrap">
                                <span className="text-[10px] font-bold bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">{q.board}</span>
                                <span className="text-[10px] text-gray-500">{q.topic}</span>
                                {q.tier && <span className="text-[10px] text-gray-400">{q.tier}</span>}
                              </div>
                              <p className="text-xs text-gray-700 line-clamp-1">{q.text || q.question}</p>
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => { setExamQBoard("all"); setExamQTier("all"); }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          → Show all boards & tiers
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              const pageStart = 0;
              const pageEnd = examQPage * EXAM_PAGE_SIZE;
              const displayedQuestions = examQFiltered.slice(pageStart, pageEnd);
              const hasMore = pageEnd < examQFiltered.length;

              return (
                <div className="space-y-2">
                  {/* Notice when tier/board filter was relaxed to show results */}
                  {(examQBoard !== "all" || examQTier !== "all") && examQFiltered.some(q =>
                    (examQTier !== "all" && q.tier !== examQTier) ||
                    (examQBoard !== "all" && q.board !== examQBoard)
                  ) && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                      <span>No exact match for your board/tier selection — showing closest available questions. <button onClick={() => { setExamQBoard("all"); setExamQTier("all"); }} className="font-semibold underline">Clear filters</button></span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-gray-500">{examQFiltered.length} question{examQFiltered.length !== 1 ? 's' : ''} found — showing {displayedQuestions.length}</p>
                    <button
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => {
                        const allIds = new Set(selectedExamQIds);
                        const allSelected = displayedQuestions.every(q => allIds.has(q.id));
                        if (allSelected) {
                          displayedQuestions.forEach(q => allIds.delete(q.id));
                        } else {
                          displayedQuestions.forEach(q => allIds.add(q.id));
                        }
                        setSelectedExamQIds(allIds);
                      }}
                    >
                      {displayedQuestions.every(q => selectedExamQIds.has(q.id)) ? 'Deselect visible' : 'Select visible'}
                    </button>
                  </div>
                  {displayedQuestions.map(question => {
                    const isSelected = selectedExamQIds.has(question.id);
                    return (
                    <Card
                      key={question.id}
                      className={`border-border/50 hover:shadow-md transition-shadow cursor-pointer ${isSelected ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''}`}
                      onClick={() => setExamQExpanded(examQExpanded === question.id ? null : question.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          {/* Checkbox */}
                          <button
                            className="mt-0.5 flex-shrink-0"
                            onClick={(e) => { e.stopPropagation(); toggleExamQ(question.id); }}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-300 hover:text-blue-400" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-1 mb-1">
                              <Badge className={`text-xs py-0 font-bold ${
                                question.board === "AQA" ? "bg-blue-600 text-white" :
                                question.board === "Edexcel" ? "bg-purple-600 text-white" :
                                question.board === "OCR" ? "bg-green-600 text-white" :
                                question.board === "WJEC" ? "bg-orange-600 text-white" :
                                question.board === "Adaptly" ? "bg-brand text-white" :
                                "bg-gray-500 text-white"
                              }`}>{question.board}</Badge>
                              <Badge variant="outline" className="text-xs py-0">{question.topic}</Badge>
                              {question.tier && <Badge variant="outline" className="text-xs py-0">{question.tier}</Badge>}
                              <Badge variant="outline" className="text-xs py-0">{question.year}</Badge>
                              {question.series && <Badge variant="outline" className="text-xs py-0 text-gray-400">{question.series}</Badge>}
                              <Badge className="text-xs py-0 bg-gray-100 text-gray-600">{question.marks} mark{question.marks !== 1 ? 's' : ''}</Badge>
                            </div>
                            <p className="text-sm text-foreground line-clamp-3">{stripKatexToPlainText(renderMath(question.text || question.question || ''))}</p>
                            <p className="text-xs text-muted-foreground mt-1">{question.paper} · Q{question.questionNum}</p>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${examQExpanded === question.id ? 'rotate-180' : ''}`} />
                        </div>

                        {examQExpanded === question.id && (
                          <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-blue-700 mb-1">Full Question:</p>
                              <p className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: renderMath(question.text || question.question || '') }} />
                              {question.context && (
                                <div className="mt-2 p-2 bg-white rounded border border-blue-100">
                                  <p className="text-xs text-gray-500 font-medium mb-1">Context:</p>
                                  <p className="text-xs text-gray-700" dangerouslySetInnerHTML={{ __html: renderMath(question.context || "") }} />
                                </div>
                              )}
                              {question.subParts && question.subParts.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {question.subParts.map(part => (
                                    <div key={part.label} className="flex gap-2 text-xs">
                                      <span className="font-medium text-blue-600">{part.label}</span>
                                      <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: renderMath(part.text) }} />
                                      <span className="text-gray-400 ml-auto">[{part.marks} mark{part.marks !== 1 ? 's' : ''}]</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {question.markScheme && (
                              <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-xs font-semibold text-green-700 mb-1">Mark Scheme:</p>
                                <p className="text-xs text-gray-700" dangerouslySetInnerHTML={{ __html: renderMath(question.markScheme || "") }} />
                              </div>
                            )}
                            {/* Hints removed from display */}
                            <div className="flex gap-2 pt-1">
                              <Button
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                className={`text-xs h-7 ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExamQ(question.id);
                                }}
                              >
                                {isSelected ? (
                                  <><CheckSquare className="h-3 w-3 mr-1" /> Selected</>
                                ) : (
                                  <><Square className="h-3 w-3 mr-1" /> Select for worksheet</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSubject(question.subject || '');
                                  setTopic(question.topic || '');
                                  if (question.board && question.board !== 'STA' && question.board !== 'KS2 SATs') setExamBoard(question.board);
                                  if (question.tier) setDifficulty(question.tier.toLowerCase());
                                  setExamStyle(true);
                                  setActiveTab('generate');
                                  toast.success(`Loaded: ${question.topic} — ${question.board}`);
                                }}
                              >
                                <Sparkles className="h-3 w-3 mr-1" /> Generate full worksheet
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                  })}
                  {hasMore && (
                    <button
                      className="w-full py-2.5 text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      onClick={() => setExamQPage(p => p + 1)}
                    >
                      Load more ({examQFiltered.length - pageEnd} remaining)
                    </button>
                  )}
                </div>
              );
            })()}
            </>)}
          </TabsContent>

          {/* ─── HISTORY TAB ──────────────────────────────────────────────────────────────────────── */}
          <TabsContent value="history" className="mt-4 space-y-3">
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Search saved worksheets..."
                    className="w-full pl-9 pr-3 h-9 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              </CardContent>
            </Card>

            {worksheetHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <History className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No saved worksheets yet.</p>
                <p className="text-xs mt-1">Generate and save a worksheet to see it here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {worksheetHistory
                  .filter(w => !historySearch || w.title.toLowerCase().includes(historySearch.toLowerCase()) || w.subject.toLowerCase().includes(historySearch.toLowerCase()) || w.topic.toLowerCase().includes(historySearch.toLowerCase()))
                  .map(ws => (
                    <Card key={ws.id} className="hover:shadow-md transition-shadow cursor-pointer border-border/50" onClick={() => {
                      setActiveTab("history");
                      setSelectedHistorySheet(null);
                      setHistoryEditedSections({});
                      setHistoryEditMode(false);
                      setHistoryViewMode("teacher");
                      setSavedWorksheetId(ws.id);
                      setEditedSections({});
                      setEditMode(false);
                      setEditType("none");
                      setAiEditSectionIndex(null);
                      setShowDiffDialog(false);
                      setDiffVersions({});
                      // Detect if this is a revision mat and set state accordingly
                      const wsIsRevisionMat = Array.isArray(ws.sections) && ws.sections.some((s: any) => s.type === 'revision-mat-box' || s.type === 'revision-mat-title' || s.type === 'revision-mat-lo');
                      setIsRevisionMat(wsIsRevisionMat);
                      setGenerated({
                        title: ws.title,
                        subtitle: ws.subtitle,
                        sections: Array.isArray(ws.sections) ? ws.sections : [],
                        metadata: {
                          subject: ws.subject,
                          topic: ws.topic,
                          yearGroup: ws.yearGroup,
                          difficulty: ws.difficulty,
                          examBoard: ws.examBoard,
                          sendNeed: ws.sendNeed,
                          ...(ws.metadata || {}),
                        },
                        isAI: true as const,
                      } as AIWorksheet);
                    }}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-foreground truncate">{(ws.title || '').replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim()}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs text-muted-foreground">{ws.yearGroup} · {ws.subject} · {ws.topic}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              <span><Clock className="h-3 w-3 inline mr-0.5" />{new Date(ws.createdAt).toLocaleDateString("en-GB")}</span>
                              {Array.isArray(ws.sections) && ws.sections.some((s: any) => s.type === 'revision-mat-box' || s.type === 'revision-mat-title' || s.type === 'revision-mat-lo') && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">📐 Revision Mat</span>
                              )}
                              {ws.rating && ws.rating > 0 && <span>{'★'.repeat(ws.rating)}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); if (confirm(`Permanently delete "${ws.title}"? This cannot be undone.`)) deleteWorksheet(ws.id); }}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* ─── STARTER TAB ──────────────────────────────────────────── */}
        </Tabs>
      ) : (
        /* ─── GENERATED WORKSHEET VIEW ──────────────────────────────── */
        <div className="space-y-4">
          {/* Toolbar Row 1 */}
          <div className="flex flex-wrap items-center gap-2 no-print">
            <div className="flex bg-muted rounded-lg p-0.5">
              <button onClick={() => setViewMode("teacher")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === "teacher" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>
                <GraduationCap className="w-3.5 h-3.5" /> Teacher
              </button>
              <button onClick={() => setViewMode("student")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === "student" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>
                <Eye className="w-3.5 h-3.5" /> Student
              </button>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button onClick={() => setTextSize(Math.max(10, textSize - 2))} className="p-1.5 rounded-md hover:bg-white/80 text-muted-foreground hover:text-foreground"><ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="text-xs font-medium px-1.5 min-w-[32px] text-center">{textSize}px</span>
              <button onClick={() => setTextSize(Math.min(24, textSize + 2))} className="p-1.5 rounded-md hover:bg-white/80 text-muted-foreground hover:text-foreground"><ZoomIn className="w-3.5 h-3.5" /></button>
            </div>
            <button
              onClick={() => handleOpenPrintPreview(viewMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-white/80 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 transition-all"
            >
              <Eye className="w-3.5 h-3.5" /> Print Preview
            </button>
          </div>

          {/* Toolbar Row 2 */}
          <div className="flex flex-wrap gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => setShowOverlayPicker(!showOverlayPicker)}>
              <Palette className="w-3.5 h-3.5 mr-1.5" /> Overlay
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSectionPicker(p => !p)}
              className={showSectionPicker ? "border-brand text-brand bg-brand-light" : ""}
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" /> Sections
              {hiddenSections.size > 0 && (
                <span className="ml-1 text-[10px] bg-brand text-white rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {hiddenSections.size}
                </span>
              )}
            </Button>
            {!editMode ? (
              <>
                <Button variant="outline" size="sm"
                  className="gap-1.5 border-brand/40 text-brand hover:bg-brand-light"
                  onClick={() => { setEditMode(true); setEditType("ai"); }}>
                  <Sparkles className="w-3.5 h-3.5" />Edit with AI
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5"
                  onClick={() => { setEditMode(true); setEditType("manual"); }}>
                  <PenLine className="w-3.5 h-3.5" />Edit Manually
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm"
                  className="gap-1.5 text-amber-600 border-amber-300"
                  onClick={() => { setEditMode(false); setEditType("none"); setEditedSections({}); setAiEditSectionIndex(null); setAnswerBoxSizes({}); }}>
                  <X className="w-3.5 h-3.5" />Cancel
                </Button>
                {editType === "manual" && (
                  <Button size="sm"
                    className="bg-brand hover:bg-brand/90 text-white gap-1.5"
                    onClick={() => { setEditMode(false); setEditType("none"); setAiEditSectionIndex(null); toast.success("Changes saved!"); }}>
                    <Check className="w-3.5 h-3.5" />Save Changes
                  </Button>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="text-brand border-brand/30 hover:bg-brand-light">
              <FileDown className="w-3.5 h-3.5 mr-1.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-3.5 h-3.5 mr-1.5" /> Print</Button>
            <Button variant="outline" size="sm" onClick={handleSave}><Save className="w-3.5 h-3.5 mr-1.5" /> Save</Button>
            {/* Read Aloud — neural TTS reads the full worksheet */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReadAloud}
              disabled={ttsLoading}
              className={`gap-1.5 ${
                ttsPlaying
                  ? "border-green-400 text-green-700 bg-green-50 hover:bg-green-100"
                  : "border-purple-300 text-purple-700 hover:bg-purple-50"
              }`}
              title={ttsPlaying ? "Stop reading" : "Read worksheet aloud"}
            >
              {ttsLoading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</>
              ) : ttsPlaying ? (
                <><VolumeX className="w-3.5 h-3.5" /> Stop</>  
              ) : (
                <><Volume2 className="w-3.5 h-3.5" /> Read Aloud</>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDiffDialog(true)} className="gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-50">
              <Sparkles className="w-3.5 h-3.5" /> Differentiate
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowScenarioDialog(true)} className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50" disabled={scenarioSwapLoading}>
              {scenarioSwapLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Swapping...</> : <><RefreshCw className="w-3.5 h-3.5" /> Scenario Swap</>}
            </Button>
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Users className="w-3.5 h-3.5 mr-1.5" /> Assign</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Assign to Student</DialogTitle></DialogHeader>
                <div className="space-y-2 mt-2">
                  {children.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No children added yet.</p>
                  ) : children.map(child => (
                    <button key={child.id} onClick={() => handleAssign(child.id)}
                      className="w-full p-3 rounded-lg border border-border hover:border-brand/30 hover:bg-brand-light/30 transition-all text-left flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand font-semibold text-sm">{child.name[0]}</div>
                      <div><div className="text-sm font-medium">{child.name}</div><div className="text-xs text-muted-foreground">{child.yearGroup} · {child.sendNeed}</div></div>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Toolbar Row 3 — Reading Level Adjustment Slider */}
          <div className="flex flex-wrap items-center gap-3 no-print">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Reading Level:</span>
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <span className="text-[10px] text-muted-foreground">5</span>
              <input
                type="range"
                min={1}
                max={13}
                step={1}
                value={(() => {
                  // Convert readingAge (5–17) back to slider position (1–13)
                  if (readingAge <= 0) {
                    // Auto — map to slider position based on yearGroup default
                    const yrToAge: Record<string, number> = {
                      "Year 1": 5, "Year 2": 6, "Year 3": 7, "Year 4": 8,
                      "Year 5": 9, "Year 6": 10, "Year 7": 11, "Year 8": 12,
                      "Year 9": 13, "Year 10": 14, "Year 11": 15, "Year 12": 17,
                      "Year 13": 17, "KS1": 6, "KS2": 9, "KS3": 12,
                      "GCSE": 15, "A-Level": 17, "11+ Preparation": 10,
                    };
                    const defaultAge = yrToAge[yearGroup] ?? 11;
                    const ages = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
                    return ages.indexOf(defaultAge) + 1 || 7;
                  }
                  const ages = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
                  const idx = ages.indexOf(readingAge);
                  return idx >= 0 ? idx + 1 : 7;
                })()}
                disabled={readingLevelLoading}
                onChange={e => {
                  const v = Number((e.target as HTMLInputElement).value);
                  const ages = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
                  setReadingAge(ages[v - 1] ?? 11);
                }}
                onMouseUp={e => {
                  const v = Number((e.target as HTMLInputElement).value);
                  const ages = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
                  handleReadingLevelAdjust(ages[v - 1] ?? 11);
                }}
                onTouchEnd={e => {
                  const v = Number((e.target as HTMLInputElement).value);
                  const ages = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
                  handleReadingLevelAdjust(ages[v - 1] ?? 11);
                }}
                className="flex-1 h-2 accent-brand cursor-pointer disabled:opacity-50"
              />
              <span className="text-[10px] text-muted-foreground">17+</span>
            </div>
            {readingLevelLoading
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" /><span className="text-xs text-muted-foreground">Adjusting...</span></>
              : <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded">{readingAge === 0 ? (() => {
                  const yrToAge: Record<string, number> = {
                    "Year 1": 5, "Year 2": 6, "Year 3": 7, "Year 4": 8,
                    "Year 5": 9, "Year 6": 10, "Year 7": 11, "Year 8": 12,
                    "Year 9": 13, "Year 10": 14, "Year 11": 15, "Year 12": 17,
                    "Year 13": 17, "KS1": 6, "KS2": 9, "KS3": 12,
                    "GCSE": 15, "A-Level": 17, "11+ Preparation": 10,
                  };
                  const defaultAge = yrToAge[yearGroup] ?? 11;
                  return `Age ${defaultAge} (default)`;
                })() : readingAge >= 17 ? "Age 17+" : `Age ${readingAge}`}</span>
            }
          </div>

          {/* Scenario Swap Dialog */}
          <Dialog open={showScenarioDialog} onOpenChange={setShowScenarioDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-orange-600" />
                  Scenario Swap
                </DialogTitle>
                <p className="text-sm text-muted-foreground">Change the real-world context of all questions while keeping the same academic skills and difficulty.</p>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">New scenario / theme</Label>
                  <Input
                    value={scenarioInput}
                    onChange={e => setScenarioInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && scenarioInput.trim()) handleScenarioSwap(); }}
                    placeholder='e.g. "football", "space exploration", "cooking", "gaming"'
                    className="h-10"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Football", "Gaming", "Space", "Cooking", "Animals", "Music", "Shopping", "Travel"].map(s => (
                    <button key={s} onClick={() => setScenarioInput(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${scenarioInput === s ? "bg-orange-100 border-orange-300 text-orange-800" : "bg-white border-border hover:border-orange-200"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={handleScenarioSwap}
                    disabled={scenarioSwapLoading || !scenarioInput.trim()}
                  >
                    {scenarioSwapLoading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Swapping...</> : <><RefreshCw className="h-4 w-4 mr-2" />Swap Scenario</>}
                  </Button>
                  <Button variant="outline" onClick={() => setShowScenarioDialog(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Overlay picker */}
          {showOverlayPicker && (
            <Card className="border-border/50 no-print">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-2">Colour overlay applies to screen, print, and PDF.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {colorOverlays.map(o => (
                    <button key={o.id} onClick={() => { setColorOverlay(o.id); setShowOverlayPicker(false); }}
                      className={`p-2 rounded-lg border-2 transition-all text-center ${colorOverlay === o.id ? "border-brand" : "border-transparent hover:border-border"}`}
                      style={{ backgroundColor: o.color }}>
                      <div className="text-xs font-medium text-gray-800">{o.name}</div>
                      <div className="text-[9px] text-gray-600 mt-0.5 leading-tight">{o.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section visibility picker */}
          {showSectionPicker && generated && (
            <Card className="border-brand/30 bg-brand-light/10 no-print">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-brand" /> Choose which sections to include
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHiddenSections(new Set())}
                      className="text-[10px] text-brand hover:underline"
                    >Show all</button>
                    <button
                      onClick={() => {
                        const nonTeacher = generated.sections
                          .map((_, i) => i)
                          .filter(i => !(generated.sections[i] as any).teacherOnly);
                        setHiddenSections(new Set(nonTeacher.slice(0, -1)));
                      }}
                      className="text-[10px] text-muted-foreground hover:underline"
                    >Reset</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {generated.sections.map((section, i) => {
                    const isHidden = hiddenSections.has(i);
                    const isTeacher = (section as any).teacherOnly;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setHiddenSections(prev => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i); else next.add(i);
                            return next;
                          });
                        }}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all ${
                          isHidden
                            ? "border-border/40 bg-muted/30 opacity-50"
                            : "border-brand/30 bg-white"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${isHidden ? "border border-border" : "bg-brand"}`}>
                          {!isHidden && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-xs text-foreground truncate flex-1">{section.title}</span>
                        {isTeacher && (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded flex-shrink-0">T</span>
                        )}
                        {isHidden && <EyeOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {hiddenSections.size > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {hiddenSections.size} section{hiddenSections.size !== 1 ? "s" : ""} hidden — excluded from PDF and print.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {editMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 no-print">
              <strong>Edit Mode:</strong> Click on any section to edit. Changes carry through to PDF, HTML, and print.
            </div>
          )}

          {/* Floating Read Selection tooltip — appears when text is highlighted in the worksheet */}
          {selectionTooltip && (
            <div
              className="fixed z-50 no-print selection-tts-tooltip"
              style={{ left: selectionTooltip.x, top: selectionTooltip.y, transform: "translateX(-50%)" }}
            >
              <button
                onMouseDown={(e) => { e.preventDefault(); handleReadSelection(selectionTooltip.text); }}
                disabled={selectionTtsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-700 text-white text-xs font-medium shadow-lg hover:bg-purple-800 transition-all disabled:opacity-60"
                title="Read selected text aloud"
              >
                {selectionTtsLoading ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Reading...</>
                ) : (
                  <><Volume2 className="w-3 h-3" /> Read aloud</>
                )}
              </button>
            </div>
          )}
          {/* Voice-to-text notice */}
          {voiceListening && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 no-print">
              <Mic className="h-4 w-4 text-red-500 animate-pulse" />
              <span className="text-sm text-red-700">Listening... speak your answer now</span>
              <Button size="sm" variant="ghost" className="ml-auto text-red-600" onClick={stopListening}>
                <MicOff className="h-4 w-4 mr-1" />Stop
              </Button>
            </div>
          )}

          {/* Worksheet content — uses new WorksheetRenderer for pixel-perfect print/PDF */}
          <div ref={worksheetRef} className="worksheet-content" style={{ backgroundColor: overlayBg }}>
            <Card className="border-border/50 overflow-hidden" style={{ backgroundColor: overlayBg }}>
              <CardContent className="p-2 sm:p-3" style={{ backgroundColor: overlayBg }}>
                {/* Show WorksheetRenderer only when NOT in edit mode */}
                {!editMode && (
                  <WorksheetRenderer
                    worksheet={{
                      title: generated.title,
                      subtitle: (generated as any).subtitle,
                      sections: (displaySections as any).filter((_: any, i: number) => !hiddenSections.has(i)),
                      metadata: {
                        ...(generated.metadata as any),
                        sendNeedId: generated.metadata?.sendNeed || sendNeed || undefined,
                      },
                      isAI: isAIWorksheet(generated),
                    }}
                    viewMode={viewMode}
                    textSize={textSize}
                    overlayColor={overlayBg}
                    editedSections={editedSections}
                    onSectionClick={undefined}
                    editMode={false}
                    answerBoxSizes={answerBoxSizes}
                    schoolLogoUrl={preferences.schoolLogoUrl}
                    schoolName={preferences.schoolName}
                    isRevisionMat={isRevisionMat}
                  />
                )}
                {/* Inline section edit rendering (Manual + AI) */}
                {editMode && (
                  <div className="mt-4 space-y-3">
                    {generated.sections.map((section, i) => {
                      if (hiddenSections.has(i)) return null;
                      if (viewMode === "student" && (section.type === "answers" || section.type === "adaptations" || section.teacherOnly)) return null;
                      const currentContent = getSectionContent(i, section.content);
                      const isTeacher = (section as any).teacherOnly;
                      const isAiTarget = aiEditSectionIndex === i;
                      return (
                        <div key={i} className={`rounded-lg border p-3 ${isTeacher ? "bg-amber-50 border-amber-200" : "bg-card border-border/50"}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-sm">{section.title}</h3>
                            {isTeacher && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Teacher</span>}
                          </div>
                          {editType === "manual" ? (
                            <Textarea
                              value={currentContent}
                              onChange={e => setEditedSections(prev => ({ ...prev, [i]: e.target.value }))}
                              className="min-h-[80px] text-sm"
                              style={{ fontSize: `${textSize}px` }}
                            />
                          ) : editType === "ai" ? (
                            <>
                              <div
                                className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 cursor-pointer rounded-md p-2 border border-dashed border-brand/40 hover:bg-brand-light/30 hover:border-brand transition-colors"
                                title="Click to edit this section with AI"
                                onClick={() => { setAiEditSectionIndex(isAiTarget ? null : i); setAiEditPrompt(""); }}
                              >
                                <span className="block text-[10px] text-brand font-medium mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" />Click to edit with AI</span>
                                <div dangerouslySetInnerHTML={{ __html: formatContent(currentContent) }} />
                              </div>
                              {isAiTarget && (
                                <div className="mt-2 rounded-lg border border-brand/30 bg-brand-light/30 p-3 space-y-2">
                                  <p className="text-xs font-medium text-brand flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Describe what you'd like to change</p>
                                  <Textarea
                                    value={aiEditPrompt}
                                    onChange={e => setAiEditPrompt(e.target.value)}
                                    placeholder="e.g. Make this simpler, add sentence starters, make questions harder…"
                                    className="text-sm min-h-[70px] resize-none"
                                    disabled={aiEditLoading}
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" className="bg-brand hover:bg-brand/90 text-white gap-1.5" disabled={aiEditLoading || !aiEditPrompt.trim()} onClick={handleAiEditSection}>
                                      {aiEditLoading ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Editing…</> : <><Sparkles className="h-3.5 w-3.5" />Apply AI Edit</>}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => { setAiEditSectionIndex(null); setAiEditPrompt(""); }} disabled={aiEditLoading}>Cancel</Button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm leading-relaxed text-foreground/90"
                              dangerouslySetInnerHTML={{ __html: formatContent(currentContent) }} />
                          )}
                          {/* Answer box controls — shown for practice/challenge sections in edit mode */}
                          {!isTeacher && (section.type === "guided" || section.type === "independent" || section.type === "challenge") && (() => {
                            const DEFAULT_LINES: Record<string, number> = { guided: 4, independent: 4, challenge: 6 };
                            const currentLines = answerBoxSizes[i] !== undefined ? answerBoxSizes[i] : (DEFAULT_LINES[section.type] ?? 4);
                            return (
                              <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] font-semibold text-purple-700">Answer box:</span>
                                  {currentLines === 0 ? (
                                    <>
                                      <span className="text-[11px] text-gray-400 italic">Removed</span>
                                      <Button size="sm" variant="outline" className="h-6 text-[11px] px-2 border-purple-300 text-purple-700" onClick={() => handleAnswerBoxSizeChange(i, DEFAULT_LINES[section.type] ?? 4)}>+ Restore</Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button size="sm" variant="outline" className="h-6 w-6 p-0 text-sm font-bold" onClick={() => handleAnswerBoxSizeChange(i, Math.max(1, currentLines - 1))} title="Fewer lines">−</Button>
                                      <span className="text-[12px] text-gray-700 min-w-[56px] text-center">{currentLines} line{currentLines !== 1 ? "s" : ""}</span>
                                      <Button size="sm" variant="outline" className="h-6 w-6 p-0 text-sm font-bold" onClick={() => handleAnswerBoxSizeChange(i, Math.min(20, currentLines + 1))} title="More lines">+</Button>
                                      <div className="w-px h-4 bg-gray-200 mx-1" />
                                      <Button size="sm" variant="outline" className="h-6 text-[11px] px-2 border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleAnswerBoxRemove(i)} title="Remove answer box">✕ Remove</Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Rating section */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rate this lesson:</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => {
                        setRating(s);
                        // Immediately persist rating if worksheet is already saved
                        if (savedWorksheetId) {
                          updateWorksheet(savedWorksheetId, { rating: s }).catch(() => {});
                        }
                      }}>
                        <Star className={`w-5 h-5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                {/* SEND adaptations summary */}
                {viewMode === "teacher" && (Array.isArray((generated as AIWorksheet).metadata?.adaptations) ? (generated as AIWorksheet).metadata.adaptations! : typeof (generated as AIWorksheet).metadata?.adaptations === "string" ? [(generated as AIWorksheet).metadata.adaptations as unknown as string] : []).length > 0 && (
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-bold text-purple-800 text-sm mb-2">SEND Adaptations Applied</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      {(Array.isArray((generated as AIWorksheet).metadata.adaptations) ? (generated as AIWorksheet).metadata.adaptations! : typeof (generated as AIWorksheet).metadata.adaptations === "string" ? [(generated as AIWorksheet).metadata.adaptations as unknown as string] : []).map((a, i) => (
                        <li key={i} className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Button variant="outline" onClick={() => { setGenerated(null); setEditedSections({}); setEditMode(false); setEditType("none"); }} className="no-print">
            ← Generate Another Lesson
          </Button>
        </div>
      )}

      {/* AI Edit Section Modal */}
      <Dialog open={aiEditSectionIndex !== null} onOpenChange={(open) => !open && setAiEditSectionIndex(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-indigo-600" />
              Edit Section with AI
            </DialogTitle>
          </DialogHeader>
          {aiEditSectionIndex !== null && generated && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <span className="font-medium">Section: </span>
                {generated.sections[aiEditSectionIndex]?.title}
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">What would you like to change?</Label>
                <Textarea
                  placeholder="e.g. Make this simpler for a student with dyslexia, add more sentence starters, make the questions harder..."
                  value={aiEditPrompt}
                  onChange={e => setAiEditPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleAiEditSection}
                  disabled={aiEditLoading || !aiEditPrompt.trim()}
                >
                  {aiEditLoading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Updating...</> : <><Wand2 className="h-4 w-4 mr-2" />Apply AI Edit</>}
                </Button>
                <Button variant="outline" onClick={() => setAiEditSectionIndex(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Bank worksheet modal */}
      <Dialog open={!!selectedBankSheet} onOpenChange={(open) => !open && setSelectedBankSheet(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedBankSheet?.title}
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">SEND Friendly</Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedBankSheet && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex border rounded-lg overflow-hidden">
                  <button onClick={() => setBankViewMode("student")} className={`px-3 py-1.5 text-xs ${bankViewMode === "student" ? "bg-brand text-white" : "bg-white text-gray-600"}`}>
                    <Eye className="h-3 w-3 inline mr-1" />Student
                  </button>
                  <button onClick={() => setBankViewMode("teacher")} className={`px-3 py-1.5 text-xs ${bankViewMode === "teacher" ? "bg-brand text-white" : "bg-white text-gray-600"}`}>
                    <GraduationCap className="h-3 w-3 inline mr-1" />Teacher
                  </button>
                </div>
                <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" />Print</Button>
                <Button size="sm" className="bg-brand hover:bg-brand/90 text-white" onClick={() => {
                  if (children.length > 0) setShowAssignDialog(true);
                  else toast.info("Add students first from the Pupils page.");
                }}>
                  <Users className="h-4 w-4 mr-1" />Assign
                </Button>
              </div>
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatContent(selectedBankSheet.content) }} />
              {bankViewMode === "teacher" && (
                <>
                  {selectedBankSheet.markScheme && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-bold text-green-800 mb-2 text-sm">Mark Scheme</h3>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatContent(selectedBankSheet.markScheme) }} />
                    </div>
                  )}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-bold text-yellow-800 mb-2 text-sm">Teacher Notes</h3>
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatContent(selectedBankSheet.teacherNotes) }} />
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── History Sheet Modal (full edit) ────────────────────────────────────────────────── */}
      <Dialog open={!!selectedHistorySheet && !generated} onOpenChange={open => { if (!open) { setSelectedHistorySheet(null); setHistoryEditedSections({}); setHistoryEditMode(false); setHistoryAiEditIdx(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <History className="h-4 w-4 text-brand" />
              <span className="flex-1 truncate">{(selectedHistorySheet?.title || '').replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim()}</span>

            </DialogTitle>
          </DialogHeader>

          {selectedHistorySheet && (() => {
            const ws = selectedHistorySheet;
            // Build sections from stored sections or parse from content string
            const sections: Array<{ title: string; type: string; content: string; teacherOnly?: boolean; svg?: string; caption?: string }> =
              ws.sections && ws.sections.length > 0
                ? ws.sections
                : ws.teacherContent
                  ? ws.teacherContent.split(/\n(?=## )/).map(block => {
                      const lines = block.split("\n");
                      const title = lines[0].replace(/^## /, "").trim();
                      const content = lines.slice(1).join("\n").trim();
                      return { title, type: "text", content };
                    })
                  : [];

            const visibleSections = historyViewMode === "teacher" ? sections : sections.filter(s => !s.teacherOnly);

            return (
              <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-muted rounded-lg p-0.5">
                    <button onClick={() => setHistoryViewMode("teacher")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${historyViewMode === "teacher" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>
                      <GraduationCap className="w-3.5 h-3.5" /> Teacher
                    </button>
                    <button onClick={() => setHistoryViewMode("student")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${historyViewMode === "student" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>
                      <Eye className="w-3.5 h-3.5" /> Student
                    </button>
                  </div>
                  <Button size="sm" variant={historyEditMode ? "default" : "outline"}
                    className={historyEditMode ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                    onClick={() => { setHistoryEditMode(!historyEditMode); if (historyEditMode) setHistoryAiEditIdx(null); }}>
                    <Edit3 className="h-3.5 w-3.5 mr-1" />{historyEditMode ? "Done Editing" : "Edit Manually"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const printTarget = historyPrintRef.current || historyContentRef.current;
                    const isHistoryRM = sections.some((s: any) => s.type === "revision-mat-box" || s.type === "revision-mat-title" || s.type === "revision-mat-lo");
                    if (printTarget) {
                      printWorksheetElement(printTarget, { viewMode: historyViewMode === "teacher" ? "teacher" : "student", landscape: isHistoryRM });
                    } else {
                      window.print();
                    }
                  }}><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
                  <Button size="sm" className="bg-brand hover:bg-brand/90 text-white" onClick={() => {
                    // Save edits back to history
                    const updatedSections = sections.map((s, i) => ({
                      ...s,
                      content: historyEditedSections[i] !== undefined ? historyEditedSections[i] : s.content,
                    }));
                    const content = updatedSections.filter(s => !s.teacherOnly).map(s => `## ${s.title}\n${s.content}`).join("\n\n");
                    const teacherContent = updatedSections.map(s => `## ${s.title}\n${s.content}`).join("\n\n");
                    updateWorksheet(ws.id, { sections: updatedSections, content, teacherContent });
                    setSelectedHistorySheet({ ...ws, sections: updatedSections, content, teacherContent });
                    setHistoryEditedSections({});
                    toast.success("Changes saved!");
                  }}><Save className="h-3.5 w-3.5 mr-1" />Save Changes</Button>
                </div>

                {/* Subtitle */}
                {ws.subtitle && <p className="text-xs text-muted-foreground">{ws.subtitle}</p>}

                {/* Hidden WorksheetRenderer used for print/PDF — captures proper styled output */}
                {(() => {
                  const historyIsRM = sections.some((s: any) => s.type === "revision-mat-box" || s.type === "revision-mat-title" || s.type === "revision-mat-lo");
                  return (
                    <div ref={historyPrintRef} style={{ position: 'absolute', left: '-9999px', top: 0, width: historyIsRM ? '1123px' : '794px', pointerEvents: 'none', zIndex: -1 }}>
                      <WorksheetRenderer
                        worksheet={{
                          title: ws.title || '',
                          subtitle: ws.subtitle || '',
                          sections: sections.map((s: any, i: number) => ({
                            ...s,
                            content: historyEditedSections[i] !== undefined ? historyEditedSections[i] : s.content,
                            type: s.type || 'text'
                          })),
                          metadata: { subject: ws.subject || '', yearGroup: ws.yearGroup || '', topic: ws.topic || '' },
                        }}
                        viewMode={historyViewMode === "teacher" ? "teacher" : "student"}
                        textSize={textSize}
                        editMode={false}
                        overlayColor=""
                        editedSections={historyEditedSections}
                        schoolLogoUrl={preferences.schoolLogoUrl}
                        schoolName={preferences.schoolName}
                        isRevisionMat={historyIsRM}
                      />
                    </div>
                  );
                })()}

                {/* Sections */}
                <div className="space-y-3" ref={historyContentRef}>
                  {visibleSections.map((section, i) => {
                    const currentContent = historyEditedSections[i] !== undefined ? historyEditedSections[i] : section.content;
                    const isTeacherSection = section.teacherOnly;
                    return (
                      <div key={i} className={`rounded-lg border p-3 ${isTeacherSection ? "bg-amber-50 border-amber-200" : "bg-card border-border/50"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm text-foreground">{(section.title || '').replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim()}</h3>
                          <div className="flex items-center gap-1">
                            {isTeacherSection && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Teacher</span>}
                            {historyEditMode && (
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-brand"
                                onClick={() => { setHistoryAiEditIdx(historyAiEditIdx === i ? null : i); setHistoryAiPrompt(""); }}>
                                <Wand2 className="h-3 w-3 mr-1" />AI Edit
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* AI Edit panel */}
                        {historyEditMode && historyAiEditIdx === i && (
                          <div className="mb-2 p-2 bg-brand/5 border border-brand/20 rounded-lg space-y-2">
                            <Textarea
                              value={historyAiPrompt}
                              onChange={e => setHistoryAiPrompt(e.target.value)}
                              placeholder="e.g. Make this section easier for Year 5, add more examples, simplify vocabulary..."
                              className="text-xs min-h-[60px] border-brand/30"
                            />
                            <Button size="sm" className="w-full bg-brand hover:bg-brand/90 text-white text-xs"
                              disabled={historyAiLoading || !historyAiPrompt.trim()}
                              onClick={async () => {
                                setHistoryAiLoading(true);
                                try {
                                  const result = await aiEditSection({ sectionTitle: section.title, currentContent, instruction: historyAiPrompt, yearGroup: ws.yearGroup || "" });
                                  setHistoryEditedSections(prev => ({ ...prev, [i]: result.newContent }));
                                  setHistoryAiEditIdx(null);
                                  toast.success("Section updated by AI!");
                                } catch {
                                  toast.error("AI edit failed.");
                                } finally {
                                  setHistoryAiLoading(false);
                                }
                              }}>
                              {historyAiLoading ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Wand2 className="h-3 w-3 mr-1" />}
                              Apply AI Edit
                            </Button>
                          </div>
                        )}

                        {/* Section content */}
                        {section.type === "diagram" && ((section as any).svg || (section as any).imageUrl) ? (
                          <div className="text-center">
                            {(section as any).imageUrl ? (
                              <div className="inline-block w-full max-w-xl border border-gray-200 rounded-lg overflow-hidden bg-white p-2">
                                <img
                                  src={(section as any).imageUrl}
                                  alt={(section as any).caption || `${section.title} diagram`}
                                  className="w-full h-auto object-contain max-h-80"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div className="inline-block w-full max-w-xl border border-gray-200 rounded-lg overflow-hidden bg-white"
                                dangerouslySetInnerHTML={{ __html: (section as any).svg }} />
                            )}
                            {(section as any).caption && <p className="text-xs text-muted-foreground mt-1 italic">{(section as any).caption}</p>}
                            {(section as any).attribution && <p className="text-[10px] text-muted-foreground/50 mt-0.5 italic">{(section as any).attribution}</p>}
                          </div>
                        ) : section.type === "vocabulary" ? (
                          <div className="flex flex-wrap gap-1.5">
                            {currentContent.split("\n").filter(l => l.includes("|") && !l.trim().startsWith("TERM")).map((line, li) => {
                              const parts = line.split("|");
                              const term = parts[0]?.trim();
                              const def = parts.slice(1).join("|").trim();
                              return term && def ? (
                                <div key={li} className="text-xs border border-border/50 rounded p-1.5 bg-muted/30">
                                  <span className="font-semibold text-brand">{term}</span>: {def}
                                </div>
                              ) : null;
                            })}
                          </div>
                        ) : historyEditMode ? (
                          <Textarea
                            value={currentContent}
                            onChange={e => setHistoryEditedSections(prev => ({ ...prev, [i]: e.target.value }))}
                            className="min-h-[80px] text-sm text-foreground/90 leading-relaxed border-amber-300 focus:border-amber-500"
                          />
                        ) : (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90"
                            dangerouslySetInnerHTML={{ __html: formatContent(currentContent) }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Print Preview Modal — Paginated A4 view matching the browser print dialog */}
      {showPrintPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPrintPreview(false); }}
        >
          {/* Sticky toolbar */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-gray-900 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-gray-300" />
              <div>
                <h2 className="font-bold text-white text-sm">Print Preview</h2>
                <p className="text-xs text-gray-400">
                  {printPreviewLoading ? "Building preview…" : `${printPreviewViewMode === "teacher" ? "Teacher" : "Student"} view · Sections never split`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex bg-gray-800 rounded-lg p-0.5 mr-1">
                <button
                  onClick={() => handleOpenPrintPreview("teacher")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    printPreviewViewMode === "teacher" ? "bg-white text-gray-900" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Teacher
                </button>
                <button
                  onClick={() => handleOpenPrintPreview("student")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    printPreviewViewMode === "student" ? "bg-white text-gray-900" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Student
                </button>
              </div>
              <Button size="sm" variant="outline" onClick={handlePrint}
                className="gap-1.5 border-gray-600 text-white hover:bg-gray-800 bg-transparent">
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadPdf}
                className="gap-1.5 border-brand/60 text-brand hover:bg-brand/10 bg-transparent">
                <FileDown className="w-3.5 h-3.5" /> PDF
              </Button>
              <button onClick={() => setShowPrintPreview(false)}
                className="ml-1 p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable page area — uses a live iframe so the browser's own CSS engine
               handles page-break-inside: avoid, keeping sections together exactly as
               the print dialog does. No canvas slicing, no section splitting. */}
          <div className="flex-1 overflow-hidden bg-gray-700 relative">
            {printPreviewLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-white">
                <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-300">Building print preview…</p>
                <p className="text-xs text-gray-400">Measuring sections and paginating…</p>
              </div>
            ) : !printPreviewHtml ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-sm">No content to preview</p>
              </div>
            ) : (
              <iframe
                key={printPreviewHtml.slice(0, 40)}
                srcDoc={printPreviewHtml}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                  background: "#374151",
                }}
                title="Print Preview"
                sandbox="allow-same-origin"
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-2 bg-gray-900 border-t border-gray-700 text-xs text-gray-500 text-center">
            Exact print output — sections are never split across pages, matching the browser print dialog
          </div>
        </div>
      )}

      {/* Print Options Dialog */}
      <PrintOptionsDialog
        open={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        onPrint={handlePrintWithOptions}
      />

      {/* One-click Differentiation Dialog */}
      <Dialog open={showDiffDialog} onOpenChange={setShowDiffDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              One-Click Differentiation
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Choose one version to generate and apply immediately to the worksheet.</p>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Tier cards */}
            {([
              { tier: "foundation", label: "Foundation", desc: "Accessible version with simpler language, more scaffolding, and fewer questions. Ideal for lower-attaining students.", colour: "blue", icon: "🟦" },
              { tier: "higher", label: "Higher", desc: "Challenging version with multi-step problems, reasoning questions, and extension tasks. Ideal for higher-attaining students.", colour: "purple", icon: "🟣" },
              { tier: "send", label: "SEND Scaffolded", desc: "Full SEND scaffolding: fill-in-the-blank guided questions, vocabulary box, sentence starters, chunked instructions, and visual supports.", colour: "green", icon: "🟢" },
            ] as const).map(({ tier, label, desc, colour, icon }) => (
              <div key={tier} className={`rounded-xl border p-4 space-y-3 ${
                // extra top padding for SEND card to accommodate the SEND picker
                tier === "send" ? "pb-4" : ""} ${
                colour === "blue" ? "border-blue-200 bg-blue-50" :
                colour === "purple" ? "border-purple-200 bg-purple-50" :
                "border-green-200 bg-green-50"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <span className={`font-semibold text-sm ${
                        colour === "blue" ? "text-blue-800" :
                        colour === "purple" ? "text-purple-800" :
                        "text-green-800"
                      }`}>{label}</span>
                    </div>
                    {/* Only show desc in the header row for non-SEND tiers */}
                    {tier !== "send" && (
                      <p className={`text-xs mt-1 ${
                        colour === "blue" ? "text-blue-700" :
                        colour === "purple" ? "text-purple-700" :
                        "text-green-700"
                      }`}>{desc}</p>
                    )}
                  </div>
                  {tier === "send" && (
                    <div className="mt-2 space-y-2">
                      <Label className="text-xs font-medium text-green-800">SEND Need for scaffolding</Label>
                      <Select
                        value={sendNeedForScaffold || sendNeed || ""}
                        onValueChange={setSendNeedForScaffold}
                      >
                        <SelectTrigger className="h-8 text-xs border-green-300 bg-white">
                          <SelectValue placeholder="Use worksheet SEND need (or select override)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General accessibility</SelectItem>
                          {sendNeeds.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                        </SelectContent>
                      </Select>

                    </div>
                  )}
                  <Button
                    size="sm"
                    disabled={diffLoading === tier}
                    onClick={() => handleDifferentiate(tier)}
                    className={`shrink-0 ${
                      colour === "blue" ? "bg-blue-600 hover:bg-blue-700 text-white" :
                      colour === "purple" ? "bg-purple-600 hover:bg-purple-700 text-white" :
                      "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {diffLoading === tier ? <><RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> Generating...</> : <><Sparkles className="h-3 w-3 mr-1.5" /> {tier === "send" ? "Apply SEND scaffolding" : tier === "foundation" ? "Apply Foundation version" : "Apply Higher version"}</>}
                  </Button>
                </div>
                {diffVersions[tier] && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-semibold text-green-700">{label} version ready!</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                        setGenerated(diffVersions[tier]);
                        setShowDiffDialog(false);
                        toast.success(`Switched to ${label} version`);
                      }}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={async () => {
                        const ws = diffVersions[tier];
                        const studentSections = ws.sections.filter((s: any) => !s.teacherOnly);
                        const content = studentSections.map((s: any) => `## ${s.title}\n${s.content}`).join("\n\n");
                        assignWork("", { title: `${ws.title} (${label})`, type: "worksheet", content, sections: studentSections, metadata: ws.metadata } as any);
                        setShowDiffDialog(false);
                        setShowAssignDialog(true);
                      }}>
                        <Users className="h-3 w-3 mr-1" /> Assign
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                        const ws = diffVersions[tier];
                        const sectionsToSave = ws.sections.map((s: any) => ({ ...s }));
                        const wsContent = sectionsToSave.filter((s: any) => !s.teacherOnly).map((s: any) => `## ${s.title}\n${s.content}`).join("\n\n");
                        const wsTeacherContent = sectionsToSave.map((s: any) => `## ${s.title}\n${s.content}`).join("\n\n");
                        saveWorksheet({
                          title: `${ws.title} (${label})`,
                          subtitle: ws.subtitle,
                          subject: ws.metadata?.subject || subject,
                          topic: ws.metadata?.topic || topic,
                          yearGroup: ws.metadata?.yearGroup || yearGroup,
                          difficulty: ws.metadata?.difficulty || difficulty || "mixed",
                          examBoard: ws.metadata?.examBoard,
                          sendNeed: ws.metadata?.sendNeed,
                          content: wsContent,
                          teacherContent: wsTeacherContent,
                          sections: sectionsToSave,
                          metadata: ws.metadata,
                          isAI: true,
                        });
                        toast.success(`${label} version saved!`);
                      }}>
                        <Save className="h-3 w-3 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Diagnostic Starter Dialog ─────────────────────────────────────────── */}
      <Dialog open={showDiagnosticDialog} onOpenChange={setShowDiagnosticDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          {/* Slim toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-brand" />
              <span className="font-semibold text-sm">Diagnostic Starter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                className="bg-brand hover:bg-brand/90 text-white gap-1.5 h-7 text-xs"
                onClick={async () => {
                  if (!diagnosticRef.current || !diagnosticResult) return;
                  try {
                    const { downloadHtmlAsPdf } = await import("@/lib/pdf-generator-v2");
                    const safeName = diagnosticResult.topic.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
                    await downloadHtmlAsPdf(diagnosticRef.current, `Diagnostic_Starter_${safeName}.pdf`, {
                      overlayColor: "#ffffff",
                      viewMode: "student",
                      textSize,
                    });
                    toast.success("PDF downloaded!");
                  } catch {
                    toast.error("Could not generate PDF. Please try again.");
                  }
                }}
              >
                <Download className="w-3 h-3" /> Download PDF
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowDiagnosticDialog(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Full-width sheet — no padding so purple header goes edge to edge */}
          <div className="overflow-y-auto flex-1 bg-gray-100">
            {diagnosticResult?.questions && (
              <DiagnosticStarterSheet
                ref={diagnosticRef}
                topic={diagnosticResult.topic}
                questions={diagnosticResult.questions}
                sendNeedId={sendNeed && sendNeed !== "none-selected" ? sendNeed : undefined}
                textSize={textSize}
                overlayColor="#ffffff"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
