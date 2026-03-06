import { useState, useRef, useEffect, useCallback } from "react";
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
import { subjects, yearGroups, sendNeeds, examBoards, difficulties, colorOverlays } from "@/lib/send-data";
import { generateWorksheet, type GeneratedWorksheet } from "@/lib/worksheet-generator";
import { downloadWorksheetPdf } from "@/lib/pdf-generator";
import { worksheetBank, type BankWorksheet } from "@/lib/worksheet-bank";
import { aiGenerateWorksheet, aiEditSection } from "@/lib/ai";
import {
  FileText, Upload, Library, Sparkles, Download, Printer, Save, Star,
  Eye, GraduationCap, Palette, Edit3, Users, Check, ZoomIn, ZoomOut,
  Mic, MicOff, Image, Search, Clock, Award, ChevronRight,
  AlertCircle, CheckCircle, RefreshCw, FileDown, X, Wand2, History, Trash2
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
  return content
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em class='text-muted-foreground'>$1</em>")
    .replace(/^(Q?\d+[a-z]?[.)] .+)$/gm, "<div class='question-line my-2'><span class='font-medium'>$1</span></div>")
    .replace(/^\s*(Hint:.+)$/gm, "<div class='hint-line text-blue-700 text-sm italic pl-4 my-1'>&#128161; $1</div>")
    .replace(/\[(\d+ marks?)\]/g, "<span class='marks-badge ml-2 text-xs font-bold text-white bg-gray-600 px-1.5 py-0.5 rounded'>[$1]</span>")
    .replace(/^[•\-] (.+)$/gm, "<div class='flex items-start gap-2 my-1'><span class='text-brand mt-1'>&#8226;</span><span>$1</span></div>")
    .replace(/^(Step \d+:.+)$/gm, "<div class='step-line font-semibold text-emerald-700 mt-2'>$1</div>")
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
  const { saveWorksheet, updateWorksheet, worksheetHistory, children, assignWork, colorOverlay, setColorOverlay } = useApp();

  // Parse URL params for subject pre-selection (wouter doesn't include query string in useLocation)
  const preSelectedSubject = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("subject") || "" : "";

  const [activeTab, setActiveTab] = useState("generate");
  const [subject, setSubject] = useState(() => preSelectedSubject);
  const [yearGroup, setYearGroup] = useState("");
  const [topic, setTopic] = useState("");
  const [sendNeed, setSendNeed] = useState("");
  const [difficulty, setDifficulty] = useState("mixed");
  const [examBoard, setExamBoard] = useState("none");
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [examStyle, setExamStyle] = useState(false);
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [generateDiagram, setGenerateDiagram] = useState(false);
  const [useAI, setUseAI] = useState(true);

  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<AnyWorksheet | null>(null);
  const [viewMode, setViewMode] = useState<"teacher" | "student">("teacher");
  const [showOverlayPicker, setShowOverlayPicker] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedSections, setEditedSections] = useState<Record<number, string>>({});
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  // AI Edit state
  const [aiEditSectionIndex, setAiEditSectionIndex] = useState<number | null>(null);
  const [aiEditPrompt, setAiEditPrompt] = useState("");
  const [aiEditLoading, setAiEditLoading] = useState(false);
  const [rating, setRating] = useState(0);
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

  // History state
  const [historySearch, setHistorySearch] = useState("");
  const [selectedHistorySheet, setSelectedHistorySheet] = useState<Worksheet | null>(null);
  const [historyEditMode, setHistoryEditMode] = useState(false);
  const [historyEditedSections, setHistoryEditedSections] = useState<Record<number, string>>({});
  const [historyAiEditIdx, setHistoryAiEditIdx] = useState<number | null>(null);
  const [historyAiPrompt, setHistoryAiPrompt] = useState("");
  const [historyAiLoading, setHistoryAiLoading] = useState(false);
  const [historyViewMode, setHistoryViewMode] = useState<"teacher" | "student">("teacher");

  const worksheetRef = useRef<HTMLDivElement>(null);
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

  // Set subject from URL param on mount
  useEffect(() => {
    if (preSelectedSubject) setSubject(preSelectedSubject);
  }, [preSelectedSubject]);

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
    setVoiceAnswers({});

    if (useAI) {
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
        });
        setGenerated({ ...result, isAI: true } as AIWorksheet);
        toast.success(generateDiagram ? "Worksheet with diagram generated!" : "Worksheet generated with AI!");
      } catch (err) {
        console.error("AI generation failed:", err);
        toast.error("AI generation failed — using local generator as fallback.");
        const ws = generateWorksheet({ subject, topic, yearGroup, sendNeed: sendNeed || undefined, difficulty, examBoard, includeAnswers, additionalInstructions });
        setGenerated(ws);
      }
    } else {
      await new Promise(r => setTimeout(r, 800));
      const ws = generateWorksheet({ subject, topic, yearGroup, sendNeed: sendNeed || undefined, difficulty, examBoard, includeAnswers, additionalInstructions });
      setGenerated(ws);
      toast.success("Worksheet generated!");
    }
    setLoading(false);
  };

  // ─── Upload & adapt ────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) { toast.error("Please upload a JPG, PNG, or PDF file."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large. Maximum 10MB."); return; }
    setUploadFile(file);
    setUploadResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadAdapt = async () => {
    if (!uploadFile || !uploadSendNeed) { toast.error("Please upload a file and select a SEND need."); return; }
    setUploadLoading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(uploadFile);
      });
      toast.error("File upload adaptation is not available in this version. Please use the AI Generate tab instead.");
      return;
    } catch (err) {
      toast.error("Failed to adapt worksheet. Please try again.");
    }
    setUploadLoading(false);
  };

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!generated) return;
    // Apply any manual edits to sections before saving
    const sectionsWithEdits = generated.sections.map((s, i) => ({
      ...s,
      content: editedSections[i] !== undefined ? editedSections[i] : s.content,
    }));
    const content = sectionsWithEdits.filter(s => !s.teacherOnly).map(s => `## ${s.title}\n${s.content}`).join("\n\n");
    const teacherContent = sectionsWithEdits.map(s => `## ${s.title}\n${s.content}`).join("\n\n");
    saveWorksheet({
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
    toast.success("Worksheet saved to history!");
  };

  // ─── PDF Download ──────────────────────────────────────────────────────────
  const handleDownloadPdf = () => {
    if (!generated) return;
    const editedWorksheet = {
      ...generated,
      sections: generated.sections.map((s, i) => ({
        ...s,
        content: editedSections[i] !== undefined ? editedSections[i] : s.content,
      })),
    } as GeneratedWorksheet;
    downloadWorksheetPdf(editedWorksheet, {
      viewMode,
      overlayId: colorOverlay,
      fontSize: Math.round(textSize * 0.85),
    });
    toast.success(`PDF downloaded (${viewMode} view)!`);
  };

  // ─── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const style = document.createElement("style");
    style.id = "print-ws-style";
    const teacherHide = viewMode === "student" ? ".teacher-section { display: none !important; }" : "";
    style.textContent = "@media print { .no-print, nav, header { display: none !important; } " + teacherHide + " body { background: " + overlayBg + " !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .worksheet-content * { font-size: " + textSize + "px !important; } }";
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.getElementById("print-ws-style")?.remove(), 1000);
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
        <div className="rounded-xl overflow-hidden mb-4 border border-border/50">
          <img src="/images/worksheet-hero.webp" alt="Worksheets" className="w-full h-32 object-cover" />
        </div>
      </motion.div>

      {!generated ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 h-10">
            <TabsTrigger value="generate" className="text-xs gap-1"><Sparkles className="w-3 h-3" /> Generate</TabsTrigger>
            <TabsTrigger value="upload" className="text-xs gap-1"><Upload className="w-3 h-3" /> Upload</TabsTrigger>
            <TabsTrigger value="bank" className="text-xs gap-1"><Library className="w-3 h-3" /> Bank</TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1">
              <History className="w-3 h-3" /> History
              {worksheetHistory.length > 0 && (
                <span className="ml-1 bg-brand text-white text-[10px] rounded-full px-1.5 py-0">{worksheetHistory.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ─── GENERATE TAB ──────────────────────────────────────────── */}
          <TabsContent value="generate" className="mt-4">
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                {/* AI Toggle */}
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div>
                    <p className="font-medium text-emerald-800 text-sm">AI Generation (GPT-4o + Gemini)</p>
                    <p className="text-xs text-emerald-600">Dual LLMs for richer, more detailed content</p>
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

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Topic *</Label>
                  <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fractions, Pythagoras, Creative Writing" className="h-10" />
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
                    <Label className="text-xs font-medium">Difficulty</Label>
                    <div className="flex gap-1">
                      {difficulties.map(d => (
                        <button key={d.id} onClick={() => setDifficulty(d.id)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${difficulty === d.id ? "bg-brand text-white" : "bg-muted text-muted-foreground"}`}>
                          {d.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

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
                  <div className="flex items-center gap-2">
                    <Switch checked={examStyle} onCheckedChange={setExamStyle} id="exam-style-sw" />
                    <Label htmlFor="exam-style-sw" className="text-xs flex items-center gap-1">
                      <Award className="h-3 w-3" /> Exam-style formatting
                    </Label>
                  </div>
                  {useAI && (
                    <div className="flex items-center gap-2">
                      <Switch checked={generateDiagram} onCheckedChange={setGenerateDiagram} id="diagram-sw" />
                      <Label htmlFor="diagram-sw" className="text-xs flex items-center gap-1">
                        <Image className="h-3 w-3" /> Generate diagram (AI-drawn SVG)
                      </Label>
                    </div>
                  )}
                </div>

                <Button onClick={handleGenerate} disabled={loading} className="w-full h-11 bg-brand hover:bg-brand/90 text-white">
                  {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />{useAI ? "Generating with AI..." : "Generating..."}</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Worksheet</>}
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
                    <p className="font-medium">Upload any worksheet (PDF or image)</p>
                    <p className="text-xs mt-0.5">AI adapts text and structure for the SEND need. All diagrams and images are preserved exactly as-is.</p>
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
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" className="hidden" onChange={handleFileSelect} />
                  {uploadPreview ? (
                    <div className="space-y-2">
                      {uploadFile?.type.startsWith("image/") ? (
                        <img src={uploadPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-emerald-600">
                          <FileText className="h-8 w-8" />
                          <span className="font-medium">{uploadFile?.name}</span>
                        </div>
                      )}
                      <p className="text-sm text-gray-500">Click to change file</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">Drop worksheet here or click to browse</p>
                      <p className="text-gray-400 text-sm mt-1">JPG, PNG, PDF — up to 10MB</p>
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

                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  Diagrams and images will be preserved — only text and structure will be adapted
                </div>

                <Button onClick={handleUploadAdapt} disabled={uploadLoading || !uploadFile || !uploadSendNeed} className="w-full h-11 bg-brand hover:bg-brand/90 text-white">
                  {uploadLoading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Adapting with AI...</> : <><Sparkles className="h-4 w-4 mr-2" />Adapt Worksheet for SEND</>}
                </Button>

                {/* Upload result */}
                {uploadResult && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-sm">Adaptation complete!</span>
                      <Badge className="bg-green-100 text-green-700 text-xs">Diagrams preserved</Badge>
                    </div>
                    {uploadResult.adapted?.adaptationsSummary?.length > 0 && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="font-medium text-purple-800 text-xs mb-1">Adaptations made:</p>
                        <ul className="text-xs text-purple-700 space-y-0.5">
                          {uploadResult.adapted.adaptationsSummary.map((a: string, i: number) => (
                            <li key={i} className="flex items-start gap-1"><CheckCircle className="h-3 w-3 text-purple-500 flex-shrink-0 mt-0.5" />{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="border rounded-lg p-4 bg-white text-sm" dangerouslySetInnerHTML={{ __html: formatContent(uploadResult.adapted?.adaptedContent || "Adaptation complete.") }} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" />Print</Button>
                      <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />Download PDF</Button>
                    </div>
                  </motion.div>
                )}
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

          {/* ─── HISTORY TAB ──────────────────────────────────────────────────────── */}
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
                            <h3 className="font-semibold text-sm text-foreground truncate">{ws.title}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs text-muted-foreground">{ws.yearGroup} · {ws.subject} · {ws.topic}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              <span><Clock className="h-3 w-3 inline mr-0.5" />{new Date(ws.createdAt).toLocaleDateString("en-GB")}</span>
                              {ws.isAI && <span className="text-emerald-600 font-medium">AI</span>}
                              {ws.rating && ws.rating > 0 && <span>{'\u2605'.repeat(ws.rating)}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); if (confirm(`Delete "${ws.title}"?`)) updateWorksheet(ws.id, { title: "__deleted__" }); }}
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
            {isAIWorksheet(generated) && (
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />AI Generated
              </Badge>
            )}
          </div>

          {/* Toolbar Row 2 */}
          <div className="flex flex-wrap gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => setShowOverlayPicker(!showOverlayPicker)}>
              <Palette className="w-3.5 h-3.5 mr-1.5" /> Overlay
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}
              className={editMode ? "bg-amber-100 border-amber-300 text-amber-700" : ""}>
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> {editMode ? "Done Editing" : "Edit"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="text-brand border-brand/30 hover:bg-brand-light">
              <FileDown className="w-3.5 h-3.5 mr-1.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-3.5 h-3.5 mr-1.5" /> Print</Button>
            <Button variant="outline" size="sm" onClick={handleSave}><Save className="w-3.5 h-3.5 mr-1.5" /> Save</Button>
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
                <div className="grid grid-cols-4 gap-2">
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

          {/* Worksheet content */}
          <div ref={worksheetRef} className="worksheet-content" style={{ backgroundColor: overlayBg }}>
            <Card className="border-border/50 overflow-hidden" style={{ backgroundColor: overlayBg }}>
              <CardContent className="p-5 sm:p-8" style={{ backgroundColor: overlayBg, fontSize: `${textSize}px` }}>
                <div className="mb-6">
                  <h1 className="font-bold text-foreground" style={{ fontSize: `${textSize + 8}px` }}>{generated.title}</h1>
                  {(generated as any).subtitle && (
                    <p className="text-muted-foreground mt-1" style={{ fontSize: `${textSize - 1}px` }}>{(generated as any).subtitle}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">{generated.metadata.yearGroup}</Badge>
                    {generated.metadata.sendNeed && <Badge className="text-xs bg-purple-100 text-purple-700">{generated.metadata.sendNeed} adapted</Badge>}
                    {generated.metadata.estimatedTime && <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-0.5" />{generated.metadata.estimatedTime}</Badge>}
                    {generated.metadata.totalMarks && <Badge variant="outline" className="text-xs"><Award className="h-3 w-3 mr-0.5" />{generated.metadata.totalMarks} marks</Badge>}
                  </div>
                </div>

                {/* AI Diagram */}
                {(generated as AIWorksheet).diagramUrl && (
                  <div className="mb-4 text-center">
                    <img src={(generated as AIWorksheet).diagramUrl!} alt="Generated diagram" className="max-w-xs mx-auto rounded-lg border border-gray-200 shadow-sm" />
                    <p className="text-xs text-gray-400 mt-1">AI-generated diagram — SEND adaptations applied to text only</p>
                  </div>
                )}

                {generated.sections.map((section, i) => {
                  if (viewMode === "student" && (section.type === "answers" || section.type === "adaptations" || section.teacherOnly)) return null;
                  const currentContent = getSectionContent(i, section.content);
                  const isAnswerSection = section.type === "answers" || section.type === "mark-scheme";
                  const isTeacherSection = section.teacherOnly || section.type === "teacher-notes";
                  const sectionAccent = 
                    section.type === "guided" ? "border-l-4 border-l-blue-400" :
                    section.type === "independent" ? "border-l-4 border-l-emerald-400" :
                    section.type === "challenge" ? "border-l-4 border-l-purple-400" :
                    section.type === "mark-scheme" ? "border-l-4 border-l-amber-400" :
                    section.type === "teacher-notes" ? "border-l-4 border-l-rose-400" :
                    section.type === "objective" ? "border-l-4 border-l-teal-400" :
                    section.type === "example" ? "border-l-4 border-l-indigo-400" :
                    "";

                  return (
                    <div key={i} className={`mb-6 pl-3 ${isTeacherSection ? "border-l-4 border-yellow-400 teacher-section" : isAnswerSection ? "border-l-4 border-green-400" : sectionAccent}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="font-semibold text-purple-700 worksheet-section-title pb-1 border-b border-border/50"
                          style={{ fontSize: `${textSize + 2}px` }}>
                          {section.title}
                          {isTeacherSection && <span className="ml-2 text-xs text-yellow-600 font-normal">(Teacher)</span>}
                        </h2>
                        {/* Voice-to-text button for practice sections */}
                        {!isTeacherSection && (section.type === "independent" || section.type === "guided") && (
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 px-2 text-xs no-print"
                            onClick={() => {
                              setVoiceTargetSection(i);
                              if (voiceListening && voiceTargetSection === i) stopListening();
                              else startListening();
                            }}
                          >
                            {voiceListening && voiceTargetSection === i
                              ? <><MicOff className="h-3 w-3 text-red-500 mr-1" />Stop</>
                              : <><Mic className="h-3 w-3 text-emerald-600 mr-1" />Speak Answer</>
                            }
                          </Button>
                        )}
                        {/* Edit with AI button */}
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 px-2 text-xs no-print text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          onClick={() => { setAiEditSectionIndex(i); setAiEditPrompt(""); }}
                        >
                          <Wand2 className="h-3 w-3 mr-1" />Edit with AI
                        </Button>
                      </div>

                      {section.type === "diagram" && (section as any).svg ? (
                        <div className="diagram-section text-center">
                          <div
                            className="inline-block w-full max-w-xl border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
                            dangerouslySetInnerHTML={{ __html: (section as any).svg }}
                          />
                          {(section as any).caption && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {(section as any).caption}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">AI-generated diagram — labelled for {yearGroup || "this year group"}</p>
                        </div>
                      ) : section.type === "vocabulary" ? (
                        <div className="vocab-table">
                          {currentContent.includes("\n") && currentContent.includes("|") ? (
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-brand/10">
                                  <th className="text-left p-2 border border-gray-200 font-semibold w-1/3">Term</th>
                                  <th className="text-left p-2 border border-gray-200 font-semibold">Definition</th>
                                </tr>
                              </thead>
                              <tbody>
                                {currentContent.split("\n").filter(l => l.includes("|") && !l.trim().startsWith("TERM")).map((line, li) => {
                                  const parts = line.split("|");
                                  const term = parts[0]?.trim();
                                  const def = parts.slice(1).join("|").trim();
                                  return term && def ? (
                                    <tr key={li} className={li % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                      <td className="p-2 border border-gray-200 font-medium text-brand">{term}</td>
                                      <td className="p-2 border border-gray-200">{def}</td>
                                    </tr>
                                  ) : null;
                                })}
                              </tbody>
                            </table>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {currentContent.split(" | ").map((word, wi) => (
                                <span key={wi} className="px-3 py-1 rounded-full font-medium bg-brand-light text-brand vocab-pill" style={{ fontSize: `${textSize - 2}px` }}>
                                  {word}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : section.type === "review" ? (
                        <div className="flex items-center gap-2 no-print">
                          <span className="text-foreground" style={{ fontSize: `${textSize}px` }}>Rate this worksheet:</span>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(s => (
                              <button key={s} onClick={() => setRating(s)}>
                                <Star className={`w-5 h-5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : editMode ? (
                        <Textarea
                          value={currentContent}
                          onChange={e => setEditedSections(prev => ({ ...prev, [i]: e.target.value }))}
                          className="min-h-[100px] text-foreground/90 leading-relaxed border-amber-300 focus:border-amber-500"
                          style={{ fontSize: `${textSize}px`, backgroundColor: overlayBg }}
                        />
                      ) : (
                        <div className="leading-relaxed whitespace-pre-wrap text-foreground/90"
                          style={{ fontSize: `${textSize}px` }}
                          dangerouslySetInnerHTML={{ __html: formatContent(currentContent) }} />
                      )}

                      {/* Voice answer display */}
                      {voiceAnswers[i] && !isTeacherSection && (
                        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm no-print">
                          <span className="text-emerald-700 font-medium">Voice answer: </span>
                          <span>{voiceAnswers[i]}</span>
                          <button onClick={() => setVoiceAnswers(prev => { const n = {...prev}; delete n[i]; return n; })} className="ml-2 text-gray-400 hover:text-gray-600">
                            <X className="h-3 w-3 inline" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* SEND adaptations summary */}
                {viewMode === "teacher" && ((generated as AIWorksheet).metadata?.adaptations ?? []).length > 0 && (
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-bold text-purple-800 text-sm mb-2">SEND Adaptations Applied (Text & Structure Only — Diagrams Unchanged)</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      {((generated as AIWorksheet).metadata.adaptations || []).map((a, i) => (
                        <li key={i} className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Button variant="outline" onClick={() => { setGenerated(null); setEditedSections({}); setEditMode(false); }} className="no-print">
            ← Generate Another Worksheet
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
                  else toast.info("Add students first from the Children page.");
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
              {selectedHistorySheet?.isAI && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-normal">AI</span>}
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
                        {section.type === "diagram" && (section as any).svg ? (
                          <div className="text-center">
                            <div className="inline-block w-full max-w-xl border border-gray-200 rounded-lg overflow-hidden bg-white"
                              dangerouslySetInnerHTML={{ __html: (section as any).svg }} />
                            {(section as any).caption && <p className="text-xs text-muted-foreground mt-1 italic">{(section as any).caption}</p>}
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
    </div>
  );
}
