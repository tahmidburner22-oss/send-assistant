import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import { downloadHtmlAsPdf, printWorksheetElement } from "@/lib/pdf-generator-v2";
import WorksheetRenderer, { renderMath, stripKatexToPlainText } from "@/components/WorksheetRenderer";
import { worksheetBank, type BankWorksheet } from "@/lib/worksheet-bank";
import { getSyllabusTopics, type SyllabusTopic } from "@/lib/syllabus-data";
import { aiGenerateWorksheet, aiEditSection, aiScaffoldExistingWorksheet } from "@/lib/ai";
// examPaperBuilder is dynamically imported inside handlers to avoid loading the large question bank on initial page load
import type { PastPaperQuestion } from "@/lib/pastPaperQuestions";
import PrintOptionsDialog, { type PrintOptions } from "@/components/PrintOptionsDialog";
import SENDInfoPanel from "@/components/SENDInfoPanel";
import {
  FileText, Upload, Library, Sparkles, Download, Printer, Save, Star,
  Eye, GraduationCap, Palette, Edit3, Users, Check, ZoomIn, ZoomOut,
  Mic, MicOff, Image, Search, Clock, Award, ChevronRight, ChevronDown,
  AlertCircle, CheckCircle, RefreshCw, FileDown, X, Wand2, History, Trash2, Info, PenLine, Square, CheckSquare, ListChecks
} from "lucide-react";

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
    .replace(/^\s*>?\s*💡.*$/gm, "")
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

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Worksheets() {
  const [location] = useLocation();
  const { saveWorksheet, updateWorksheet, deleteWorksheet, worksheetHistory, children, assignWork, colorOverlay, setColorOverlay, refreshData } = useApp();
  const { preferences } = useUserPreferences();
  const showLibraryTab = preferences.showWorksheetLibrary === true;

  // Re-fetch data from server on mount so history count is always current
  useEffect(() => { refreshData(); }, []);

  // Parse URL params for pre-filling from Curriculum Progression or external links
  const _urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const preSelectedSubject = _urlParams.get("subject") || "";
  const preSelectedTopic = _urlParams.get("topic") || "";
  const preSelectedDescription = _urlParams.get("description") || "";

  const [activeTab, setActiveTab] = useState("generate");
  const [subject, setSubject] = useState(() => preSelectedSubject);
  const [yearGroup, setYearGroup] = useState("");
  const [topic, setTopic] = useState(() => preSelectedTopic);
  const [sendNeed, setSendNeed] = useState("");
  const [difficulty, setDifficulty] = useState("mixed");
  const [worksheetLength, setWorksheetLength] = useState("30");
  const [examBoard, setExamBoard] = useState("none");
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [examStyle, setExamStyle] = useState(false);

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
  const [useAI, setUseAI] = useState(true);

  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<AnyWorksheet | null>(null);
  const [viewMode, setViewMode] = useState<"teacher" | "student">("teacher");
  const [showOverlayPicker, setShowOverlayPicker] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editType, setEditType] = useState<"ai" | "manual" | "none">("none");
  const [editedSections, setEditedSections] = useState<Record<number, string>>({});
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  // AI Edit state
  const [aiEditSectionIndex, setAiEditSectionIndex] = useState<number | null>(null);
  const [aiEditPrompt, setAiEditPrompt] = useState("");
  const [aiEditLoading, setAiEditLoading] = useState(false);
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
  // Lazy-loaded question bank — only loaded when Exam Bank tab is first opened
  const [allPastPaperQuestions, setAllPastPaperQuestions] = useState<PastPaperQuestion[]>([]);
  const [examBankLoading, setExamBankLoading] = useState(false);
  const [examBankLoaded, setExamBankLoaded] = useState(false);
  // Multi-select state for Exam Hub
  const [selectedExamQIds, setSelectedExamQIds] = useState<Set<string>>(new Set());
  const selectedExamQuestions = useMemo(() => {
    return allPastPaperQuestions.filter(q => selectedExamQIds.has(q.id));
  }, [selectedExamQIds, allPastPaperQuestions]);
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
  // One-click differentiation
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [diffLoading, setDiffLoading] = useState<string | null>(null);
  const [diffVersions, setDiffVersions] = useState<Record<string, AIWorksheet>>({});
  // SEND need override for the scaffold dialog (lets teacher pick a different SEND need)
  const [sendNeedForScaffold, setSendNeedForScaffold] = useState<string>("");

  const worksheetRef = useRef<HTMLDivElement>(null);
  const uploadWorksheetRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC mutations
  
  

  // Voice input
  const [currentVoiceText, setCurrentVoiceText] = useState("");
  const { listening: voiceListening, startListening, stopListening } = useVoiceInput((text) => {
    setCurrentVoiceText(text);
    if (voiceTargetSection !== null) {
      setVoiceAnswers(prev => ({ ...prev, [voiceTargetSection]: text }));
    }
  });

  // Set subject and topic from URL params on mount (used by Curriculum Progression one-click generate)
  useEffect(() => {
    if (preSelectedSubject) setSubject(preSelectedSubject);
    if (preSelectedTopic) setTopic(preSelectedTopic);
  }, []);

  const overlayBg = colorOverlays.find(o => o.id === colorOverlay)?.color || "#ffffff";

  // ─── Generate worksheet ────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!subject || !yearGroup || !topic) {
      toast.error("Please fill in Subject, Year Group, and Topic.");
      return;
    }
    setLoading(true);
    setEditedSections({});
    setEditMode(false);
    setRating(0);
    setSavedWorksheetId(null);
    setVoiceAnswers({});

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
          generateDiagram: false, // No diagram in exam mode
          worksheetLength,
          introOnly: true, // Only generate intro sections (objectives, vocab, worked example) — exam questions will be injected from the bank
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
            generateDiagram: false,
            worksheetLength,
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
          generateDiagram,
          worksheetLength,
        });
        generatedWs = { ...result, isAI: true } as AIWorksheet;
        toast.success(generateDiagram ? "Worksheet with diagram generated!" : "Worksheet generated with AI!");
      } catch (err: any) {
        console.error("AI generation failed:", err);
        console.error("[DEBUG] Error name:", err?.name, "| message:", err?.message?.slice(0, 300), "| stack:", err?.stack?.slice(0, 200));
        const errMsg = err?.message || String(err);
        if (errMsg.includes("No AI provider keys configured") || errMsg.includes("noKeysConfigured") || errMsg.includes("Settings → AI Providers")) {
          toast.error(
            "⚠️ No AI keys configured. Go to Settings → AI Providers to add your school's API keys. Using local generator for now.",
            { duration: 10000 }
          );
        } else if (err?.name === "AbortError") {
          toast.error("AI generation timed out. Please try again.");
        } else {
          toast.error(`AI generation failed: ${errMsg.slice(0, 80)}. Using local generator as fallback.`);
        }
        generatedWs = generateWorksheet({ subject, topic, yearGroup, sendNeed: sendNeed || undefined, difficulty, examBoard, includeAnswers, additionalInstructions });
      }
    } else {
      await new Promise(r => setTimeout(r, 800));
      generatedWs = generateWorksheet({ subject, topic, yearGroup, sendNeed: sendNeed || undefined, difficulty, examBoard, includeAnswers, additionalInstructions });
      toast.success("Lesson generated!");
    }

    if (generatedWs) {
      setGenerated(generatedWs);
      setDiffVersions({}); // Clear old diff versions when a new worksheet is generated
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

    setLoading(false);
  };

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
    const content = sectionsWithEdits.filter(s => !s.teacherOnly).map(s => `## ${s.title}\n${s.content}`).join("\n\n");
    const teacherContent = sectionsWithEdits.map(s => `## ${s.title}\n${s.content}`).join("\n\n");
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
    if (!generated || !worksheetRef.current) return;
    toast.info("Generating PDF...");
    // Target the inner worksheet-print-root for a clean capture (no UI chrome)
    const printRoot = (worksheetRef.current.querySelector(".worksheet-print-root") as HTMLElement) || worksheetRef.current;
    try {
      const filename = `${generated.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_${viewMode}.pdf`;
      await downloadHtmlAsPdf(printRoot, filename, { overlayColor: overlayBg });
      toast.success(`PDF downloaded (${viewMode} view)!`);
    } catch (err) {
      // Fallback to jsPDF
      const editedWorksheet = {
        ...generated,
        sections: generated.sections.map((s, i) => ({
          ...s,
          content: editedSections[i] !== undefined ? editedSections[i] : s.content,
        })),
      } as GeneratedWorksheet;
      downloadWorksheetPdf(editedWorksheet, { viewMode, overlayId: colorOverlay, fontSize: Math.round(textSize * 0.85) });
      toast.success(`PDF downloaded!`);
    }
  };

  // ─── Print (opens PrintOptionsDialog) ─────────────────────────────────
  const handlePrint = () => {
    setShowPrintDialog(true);
  };

  const handlePrintWithOptions = (options: PrintOptions) => {
    if (!worksheetRef.current) return;
    printWorksheetElement(worksheetRef.current, {
      overlayColor: overlayBg,
      viewMode: options.view,
      layout: options.layout,
      textSize,
      title: generated?.title,
      sendNeedId: generated?.metadata?.sendNeed || sendNeed || undefined,
    });
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

  // ─── Assign ────────────────────────────────────────────────────────────────
  const handleAssign = (childId: string) => {
    if (!generated) return;
    const content = generated.sections.filter(s => !s.teacherOnly).map(s => `## ${s.title}\n${s.content}`).join("\n\n");
    assignWork(childId, { title: generated.title, type: "worksheet", content });
    setShowAssignDialog(false);
    toast.success("Worksheet assigned!");
  };

  const getSectionContent = (i: number, original: string) => editedSections[i] !== undefined ? editedSections[i] : original;

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
        const teacherSections = (ws.sections || []).filter((s: any) => s.teacherOnly);

        // If a word bank was generated, prepend it as a section
        const wordBankSection: { title: string; content: string; type: string; teacherOnly: boolean }[] = scaffolded.wordBank
          ? [{ title: "Word Bank", content: scaffolded.wordBank, type: "wordbank", teacherOnly: false }]
          : [];

        const scaffoldedWorksheet: AIWorksheet = {
          ...ws,
          sections: [...wordBankSection, ...scaffolded.sections, ...teacherSections],
          metadata: {
            ...ws.metadata,
            sendNeed: effectiveSendNeed,
            adaptations: scaffolded.scaffoldingApplied || [],
          },
          isAI: true as const,
        };

        setDiffVersions(prev => ({ ...prev, send: scaffoldedWorksheet }));
        toast.success(`SEND Scaffolded version created with ${effectiveSendNeed} adaptations!`);
        setDiffLoading(null);
        return;
      }

      // ── Foundation / Higher tiers: regenerate from scratch ──────────────────
      const tierDifficulty = tier;

      const tierInstruction = tier === "foundation"
        ? `FOUNDATION TIER — SCAFFOLDED VERSION. You MUST apply ALL of these rules without exception:
(1) WORD BANK: Add a Word Bank box at the very top with 6-8 key terms and simple one-line definitions.
(2) SECTION A (Guided Practice): EVERY question MUST have a fill-in-the-blank answer frame OR sentence starter. Example: "The answer is ___ because ___" or "Step 1: ___, Step 2: ___". NO open questions in Section A.
(3) SECTION B (Core Practice): Include a 'Key Facts' reminder box at the top with 3-4 essential facts. Questions must be single-step only. Include at least 2 partially-worked examples where students complete the final step.
(4) WORKED EXAMPLE: Break into micro-steps (max 6 words per step). Number every step. Use arrows to show progression. Annotate each step with WHY.
(5) CHALLENGE: Label as 'OPTIONAL BONUS — only try this if you have finished everything else!' Make it a simple extension, NOT a new concept.
(6) LANGUAGE: Short sentences (max 12 words). Bold all key terms. Use active voice only. Use simple whole numbers.
(7) REMINDER BOX: Write the 3 steps as a simple numbered checklist with tick boxes [ ].
(8) REFLECTION: Use tick-box 'I can' statements only. Include an emoji confidence scale (😕 🙂 😀).`
        : `HIGHER TIER — EXTENDED CHALLENGE VERSION. You MUST apply ALL of these rules without exception:
(1) SECTION A (Guided Practice): Start at Grade 5/6 difficulty — NO trivial recall questions. Include algebraic manipulation. At least 2 questions require showing full method with justification.
(2) SECTION B (Core Practice): Include at least 2 multi-step problems combining two or more skills. Include at least 1 'Show that...' or 'Prove that...' or 'Hence...' question. Include at least 1 question with non-integer or algebraic values.
(3) CHALLENGE: Must be a genuine Grade 8-9 problem — proof, reverse engineering, or multi-concept application. Include a 'Stretch Further' sub-part.
(4) EXTENSION SECTION: Add a 'Going Further' section after the challenge with 1-2 A-Level preview questions or real-world applications requiring synoptic thinking.
(5) WORKED EXAMPLE: Show a complex example demonstrating the highest-level application. Include examiner tips and common errors to avoid at Grade 8-9.
(6) QUESTIONS: Use non-integer coefficients, surds, or complex values. Include command words: Evaluate, Justify, Derive, Hence or otherwise, Prove.
(7) MARK SCHEME: Include detailed mark scheme with method marks (M), accuracy marks (A), and examiner notes for each question.
(8) LANGUAGE: Use precise mathematical/scientific language. Expect correct notation throughout.`;

      const result = await aiGenerateWorksheet({
        subject: ws.metadata?.subject || subject,
        topic: ws.metadata?.topic || topic,
        yearGroup: ws.metadata?.yearGroup || yearGroup,
        difficulty: tierDifficulty,
        examBoard: ws.metadata?.examBoard !== "General" ? ws.metadata?.examBoard : undefined,
        includeAnswers,
        worksheetLength,
        additionalInstructions: tierInstruction,
      });
      setDiffVersions(prev => ({ ...prev, [tier]: { ...result, isAI: true as const } as AIWorksheet }));
      toast.success(`${tier === "foundation" ? "Foundation" : "Higher"} version generated!`);
    } catch (err) {
      toast.error("Differentiation failed. Please try again.");
    }
    setDiffLoading(null);
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
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      </motion.div>

      {loading && !generated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white shadow-2xl border border-border/50 max-w-sm w-full mx-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
              <Sparkles className="w-6 h-6 text-brand absolute inset-0 m-auto" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground text-lg">Generating your worksheet</h3>
              <p className="text-sm text-muted-foreground mt-1">AI is crafting a high-quality, differentiated worksheet. This may take up to 60 seconds for complex topics.</p>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-brand rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-xs text-muted-foreground">Please wait — do not close this page</p>
          </div>
        </div>
      )}

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
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                {/* AI Toggle */}
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div>
                    <p className="font-medium text-emerald-800 text-sm">AI Generation (Groq · Llama 3.1 8B)</p>
                    <p className="text-xs text-emerald-600">High-quality AI for rich, curriculum-aligned content</p>
                  </div>
                  <Switch checked={useAI} onCheckedChange={setUseAI} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Subject *</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Year Group *</Label>
                    <Select value={yearGroup} onValueChange={setYearGroup}>
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
                          {syllabusTopics.map((st, i) => (
                            <SelectItem key={i} value={st.topic}>{st.topic}</SelectItem>
                          ))}
                          <SelectItem value="__custom__">✏️ Enter custom topic...</SelectItem>
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
                    <p className="text-[10px] text-muted-foreground mt-0.5">📚 {syllabusTopics.length} curriculum topics for {yearGroup} {subjects.find(s => s.id === subject)?.name || subject}{(() => {
                      const yr = parseInt((yearGroup || "").replace(/[^0-9]/g, ""), 10);
                      if (yr >= 2 && yr <= 6) return ` (Years 1–${yr})`;
                      if (yr >= 8 && yr <= 11) return ` (Years 7–${yr})`;
                      if (yr === 13) return ` (Years 12–13)`;
                      return "";
                    })()}</p>
                  )}
                </div>

                {sendNeed && sendNeed !== "none-selected" && (
                  <SENDInfoPanel sendNeedId={sendNeed} context="worksheet" />
                )}

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

                {/* ── Worksheet Length ── */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Worksheet Length</Label>
                  <div className="flex gap-1">
                    {[
                      { id: "10", name: "10 mins", desc: "Quick practice — 5–8 focused questions" },
                      { id: "30", name: "30 mins", desc: "Standard lesson — 15–20 questions" },
                      { id: "60", name: "1 hour", desc: "Full lesson — 30+ questions across all sections" },
                    ].map(l => (
                      <button key={l.id} onClick={() => setWorksheetLength(l.id)}
                        title={l.desc}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${worksheetLength === l.id ? "bg-brand text-white" : "bg-muted text-muted-foreground"}`}>
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── SEND Adaptation Preview Panel ── */}
                {sendNeed && sendNeed !== "none-selected" && (() => {
                  const need = sendNeeds.find(n => n.id === sendNeed);
                  if (!need) return null;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-xl border border-purple-200 bg-purple-50 p-3 space-y-3"
                    >
                      {/* Header */}
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-purple-800">{need.name}</span>
                            <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200">{need.category}</Badge>
                          </div>
                          <p className="text-xs text-purple-700 mt-1 leading-relaxed">{need.description}</p>
                        </div>
                      </div>

                      {/* Summary of changes */}
                      {need.worksheetChanges && (
                        <div className="bg-white/70 rounded-lg border border-purple-100 p-2.5 space-y-2">
                          <p className="text-[11px] font-semibold text-purple-900 uppercase tracking-wide flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-purple-600" />
                            What will change in your worksheet
                          </p>
                          <p className="text-xs text-purple-800 italic leading-relaxed">{need.worksheetChanges.summary}</p>
                          <div className="space-y-2 mt-1">
                            {need.worksheetChanges.changes.map((c, i) => (
                              <div key={i} className="space-y-0.5">
                                <div className="flex items-start gap-1.5">
                                  <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                                  <span className="text-xs font-medium text-purple-900">{c.what}</span>
                                </div>
                                <p className="text-[11px] text-purple-600 pl-4.5 leading-relaxed ml-4">
                                  <span className="font-medium text-purple-700">Why: </span>{c.why}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Teacher notes reminder */}
                      <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <Info className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          <span className="font-semibold">Teacher section included:</span> The generated worksheet will contain a private teacher-only section explaining every adaptation made and the evidence-based rationale for why it helps students with {need.name}.
                        </p>
                      </div>
                    </motion.div>
                  );
                })()}

                <div className="space-y-1.5">
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
                    placeholder="Any specific requirements..." className="min-h-[60px] text-sm" />
                </div>

                <div className="flex flex-wrap gap-4 items-center py-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={includeAnswers} onCheckedChange={setIncludeAnswers} id="answers-sw" />
                    <Label htmlFor="answers-sw" className="text-xs">Include answers & mark scheme</Label>
                  </div>
                  {/* Exam style toggle hidden — feature removed from UI */}
                  {useAI && (
                    <div className="flex items-center gap-2">
                      <Switch checked={generateDiagram} onCheckedChange={setGenerateDiagram} id="diagram-sw" />
                      <Label htmlFor="diagram-sw" className="text-xs flex items-center gap-1">
                        <Image className="h-3 w-3" /> Include topic diagram
                      </Label>
                    </div>
                  )}
                </div>

                <Button onClick={handleGenerate} disabled={loading} className="w-full h-11 bg-brand hover:bg-brand/90 text-white">
                  {loading
                    ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />{useAI ? "Generating with AI..." : "Generating..."}</>
                    : <><Sparkles className="w-4 h-4 mr-2" /> Generate Worksheet</>}
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
                  // Build a GeneratedWorksheet-compatible object from the adapted result
                  const sections = adapted?.sections ?? [
                    { title: "Adapted Worksheet", type: "guided", content: adapted?.adaptedContent || "", teacherOnly: false }
                  ];
                  if (adapted?.teacherSection) {
                    sections.push({ ...adapted.teacherSection, teacherOnly: true });
                  }
                  const uploadedWorksheet = {
                    title: adapted?.title || uploadFile?.name?.replace(/\.[^.]+$/, "") || "Adapted Worksheet",
                    subtitle: adapted?.subtitle || `${uploadSendNeed} adaptation`,
                    sections,
                    metadata: {
                      subject: "uploaded",
                      topic: "Uploaded worksheet",
                      yearGroup: uploadYearGroup || "Year 9",
                      sendNeed: uploadSendNeed,
                      difficulty: "Standard",
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
                          overlayColor={overlayBg}
                          editedSections={{}}
                        />
                      </div>
                      <div className="flex gap-2">
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
                              toast.info("Generating PDF...");
                              try {
                                await downloadHtmlAsPdf(uploadWorksheetRef.current, `${uploadedWorksheet.title}_adapted.pdf`);
                                toast.success("PDF downloaded!");
                              } catch { toast.error("PDF generation failed."); }
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />Download PDF
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
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
                    onChange={e => setExamQSearch(e.target.value)}
                    placeholder="Search by topic (e.g. Fractions, Algebra, Forces...)"
                    className="pl-9 h-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={examQSubject} onValueChange={setExamQSubject}>
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-[120px]"><SelectValue placeholder="All subjects" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      {Array.from(new Set(allPastPaperQuestions.map(q => q.subject).filter(Boolean))).sort().map(s => (
                        <SelectItem key={s as string} value={s as string}>{((s as string) || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={examQBoard} onValueChange={setExamQBoard}>
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-[100px]"><SelectValue placeholder="All boards" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All boards</SelectItem>
                      {["AQA", "Edexcel", "OCR", "WJEC", "STA", "KS2 SATs"].map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={examQTier} onValueChange={setExamQTier}>
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
              const q = examQSearch.toLowerCase().trim();
              const filtered = allPastPaperQuestions.filter(question => {
                const qText = question.text || question.question || '';
                if (!qText) return false; // skip malformed entries
                const matchSearch = !q ||
                  (question.topic || '').toLowerCase().includes(q) ||
                  qText.toLowerCase().includes(q) ||
                  (question.subject || '').toLowerCase().includes(q);
                const matchSubject = examQSubject === "all" || question.subject === examQSubject;
                const matchBoard = examQBoard === "all" || question.board === examQBoard;
                const matchTier = examQTier === "all" || question.tier === examQTier;
                return matchSearch && matchSubject && matchBoard && matchTier;
              }).slice(0, 50); // limit to 50 results

              if (!q && examQSubject === "all" && examQBoard === "all" && examQTier === "all") {
                // Show topic overview when no search — pre-compute counts in a single pass
                const topicCounts: Record<string, number> = {};
                for (const q of allPastPaperQuestions) {
                  if (q.topic) topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
                }
                const topics = Object.keys(topicCounts).sort();
                return (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 px-1">{topics.length} topics available — type a topic name above to search</p>
                    <div className="flex flex-wrap gap-2">
                      {topics.map(topic => (
                          <button
                            key={topic}
                            onClick={() => setExamQSearch(topic || '')}
                            className="px-3 py-1.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            {topic} <span className="text-blue-400">({topicCounts[topic]})</span>
                          </button>
                        ))}
                    </div>
                  </div>
                );
              }

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 text-gray-400">
                    <Search className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No questions found for "{examQSearch}".</p>
                    <p className="text-xs mt-1">Try a different topic name or exam board.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-gray-500">{filtered.length} question{filtered.length !== 1 ? 's' : ''} found{q ? ` for "${examQSearch}"` : ''}</p>
                    <button
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => {
                        const allIds = new Set(selectedExamQIds);
                        const allSelected = filtered.every(q => allIds.has(q.id));
                        if (allSelected) {
                          filtered.forEach(q => allIds.delete(q.id));
                        } else {
                          filtered.forEach(q => allIds.add(q.id));
                        }
                        setSelectedExamQIds(allIds);
                      }}
                    >
                      {filtered.every(q => selectedExamQIds.has(q.id)) ? 'Deselect all' : 'Select all visible'}
                    </button>
                  </div>
                  {filtered.map(question => {
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
                              <Badge className="text-xs py-0 bg-blue-100 text-blue-700">{question.board}</Badge>
                              <Badge variant="outline" className="text-xs py-0">{question.topic}</Badge>
                              {question.tier && <Badge variant="outline" className="text-xs py-0">{question.tier}</Badge>}
                              <Badge variant="outline" className="text-xs py-0">{question.year}</Badge>
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
                  {filtered.length === 50 && (
                    <p className="text-xs text-center text-gray-400 py-2">Showing first 50 results — refine your search for more specific results</p>
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
                    <Card key={ws.id} className="hover:shadow-md transition-shadow cursor-pointer border-border/50" onClick={() => { setSelectedHistorySheet(ws); setHistoryEditedSections({}); setHistoryEditMode(false); setHistoryViewMode("teacher"); }}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-foreground truncate">{(ws.title || '').replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim()}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs text-muted-foreground">{ws.yearGroup} · {ws.subject} · {ws.topic}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              <span><Clock className="h-3 w-3 inline mr-0.5" />{new Date(ws.createdAt).toLocaleDateString("en-GB")}</span>

                              {ws.rating && ws.rating > 0 && <span>{'\u2605'.repeat(ws.rating)}</span>}
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

          </div>

          {/* Toolbar Row 2 */}
          <div className="flex flex-wrap gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => setShowOverlayPicker(!showOverlayPicker)}>
              <Palette className="w-3.5 h-3.5 mr-1.5" /> Overlay
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
                  onClick={() => { setEditMode(false); setEditType("none"); setEditedSections({}); setAiEditSectionIndex(null); }}>
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
            <Button variant="outline" size="sm" onClick={() => setShowDiffDialog(true)} className="gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-50">
              <Sparkles className="w-3.5 h-3.5" /> Differentiate
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

          {editMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 no-print">
              <strong>Edit Mode:</strong> Click on any section to edit. Changes carry through to PDF, HTML, and print.
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
              <CardContent className="p-5 sm:p-8" style={{ backgroundColor: overlayBg }}>
                {/* Show WorksheetRenderer only when NOT in edit mode */}
                {!editMode && (
                  <WorksheetRenderer
                    worksheet={{
                      title: generated.title,
                      subtitle: (generated as any).subtitle,
                      sections: generated.sections as any,
                      metadata: {
                        ...(generated.metadata as any),
                        // Pass the SEND need ID explicitly so WorksheetRenderer can apply correct formatting
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
                  />
                )}
                {/* Inline section edit rendering (Manual + AI) */}
                {editMode && (
                  <div className="mt-4 space-y-3">
                    {generated.sections.map((section, i) => {
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
      <Dialog open={!!selectedHistorySheet} onOpenChange={open => { if (!open) { setSelectedHistorySheet(null); setHistoryEditedSections({}); setHistoryEditMode(false); setHistoryAiEditIdx(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <History className="h-4 w-4 text-brand" />
              <span className="flex-1 truncate">{selectedHistorySheet?.title}</span>

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
                  <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
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

                {/* Sections */}
                <div className="space-y-3">
                  {visibleSections.map((section, i) => {
                    const currentContent = historyEditedSections[i] !== undefined ? historyEditedSections[i] : section.content;
                    const isTeacherSection = section.teacherOnly;
                    return (
                      <div key={i} className={`rounded-lg border p-3 ${isTeacherSection ? "bg-amber-50 border-amber-200" : "bg-card border-border/50"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm text-foreground">{section.title}</h3>
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
            <p className="text-sm text-muted-foreground">Generate Foundation, Higher, and SEND-scaffolded versions of this worksheet in one click.</p>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Tier cards */}
            {([
              { tier: "foundation", label: "Foundation", desc: "Accessible version with simpler language, more scaffolding, and fewer questions. Ideal for lower-attaining students.", colour: "blue", icon: "🟦" },
              { tier: "higher", label: "Higher", desc: "Challenging version with multi-step problems, reasoning questions, and extension tasks. Ideal for higher-attaining students.", colour: "purple", icon: "🟣" },
              { tier: "send", label: "SEND Scaffolded", desc: "Full SEND scaffolding: fill-in-the-blank guided questions, vocabulary box, sentence starters, chunked instructions, and visual supports.", colour: "green", icon: "♿" },
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
                    <p className={`text-xs mt-1 ${
                      colour === "blue" ? "text-blue-700" :
                      colour === "purple" ? "text-purple-700" :
                      "text-green-700"
                    }`}>{desc}</p>
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
                      {(sendNeedForScaffold || sendNeed) && sendNeedForScaffold !== "general" && (
                        <SENDInfoPanel
                          sendNeedId={sendNeedForScaffold || sendNeed}
                          context="worksheet"
                          className="mt-2"
                        />
                      )}
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
                    {diffLoading === tier ? <><RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> Generating...</> : <><Sparkles className="h-3 w-3 mr-1.5" /> Generate</>}
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
                        const content = ws.sections.filter((s: any) => !s.teacherOnly).map((s: any) => `## ${s.title}\n${s.content}`).join("\n\n");
                        assignWork("", { title: `${ws.title} (${label})`, type: "worksheet", content });
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
    </div>
  );
}
