import React, { useState, useRef } from "react";
import { aiGenerateStory, callAI, parseWithFixes } from "@/lib/ai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useApp, type Child, type AttendanceRecord, type AttendanceStatus, type TimetableLesson } from "@/contexts/AppContext";
import WorksheetRenderer, { renderMath } from "@/components/WorksheetRenderer";
import { SendScreenerResultsView } from "@/components/SendScreenerResultsView";
import { sendNeeds, storyGenres, storyLengths, readingLevels, colorOverlays, yearGroups } from "@/lib/send-data";
import { generateStoryContent } from "@/lib/worksheet-generator";
import {
  GraduationCap, KeyRound, FileText, BookOpen, Upload, Eye,
  CheckCircle, Clock, AlertCircle, ArrowLeft, Sparkles, Plus, X,
  MessageSquare, Image, Paperclip, ZoomIn, ZoomOut,
  CalendarDays, CheckCircle2, XCircle, MinusCircle, Sun, Sunset, TrendingUp,
  Calendar, MapPin, User2, ChevronLeft, ChevronRight as ChevronRightIcon,
  PenLine, Check, Loader2, ScrollText, ExternalLink, Filter, ChevronDown, ChevronUp,
  Home, LayoutDashboard, Menu, Star, Bell, BookMarked, Headphones, Zap, ScanSearch, Newspaper, RefreshCw
} from "lucide-react";
import { subjects as pastPaperSubjects, allYears as ppAllYears, allBoards as ppAllBoards } from "@/lib/pastPapers";
import { Link } from "wouter";

// Comprehension questions generator (same as Stories page)
function generateComprehensionQuestions(_content: string, genre: string): string[] {
  const questions: Record<string, string[]> = {
    adventure: ["What challenge did the main character face?", "How did the character show bravery?", "What would you have done differently?", "Describe the setting in your own words."],
    fantasy: ["What magical elements appeared in the story?", "How did the character use their special abilities?", "What is the moral of the story?", "Describe the fantasy world in detail."],
    mystery: ["What clues helped solve the mystery?", "Who do you think was responsible and why?", "What red herrings appeared in the story?", "How did the detective use logical thinking?"],
    "sci-fi": ["What futuristic technology appeared in the story?", "How was the world different from our own?", "What scientific concepts were explored?", "What problems did the characters face in space/the future?"],
    historical: ["What historical period is the story set in?", "How was life different for people in that time?", "What historical facts are included in the story?", "What can we learn from this period of history?"],
    comedy: ["What made the story funny?", "Describe the funniest moment and explain why it was humorous.", "How did the misunderstanding begin?", "How was the problem eventually resolved?"],
    spooky: ["What created the feeling of suspense in the story?", "How did the author build tension?", "What was the scariest moment and why?", "Was the ending satisfying? Explain your answer."],
    sports: ["What obstacles did the character overcome?", "What does this story teach us about teamwork?", "How did the character prepare for the big event?", "What qualities made the character a good sportsperson?"],
  };
  const defaultQs = ["What is the main theme of this story?", "How does the main character change throughout the story?", "What is the most important moment in the story? Explain why.", "Write a short summary of the story in your own words."];
  return questions[genre] || defaultQs;
}

/** Lightweight wrapper to render a worksheet using WorksheetRenderer in the Parent Portal */
function WorksheetRendererView({
  title,
  subtitle,
  sections,
  metadata,
}: {
  title: string;
  subtitle?: string;
  sections: Array<{ title: string; type: string; content: string; teacherOnly?: boolean; svg?: string; caption?: string }>;
  metadata?: { subject?: string; topic?: string; yearGroup?: string; difficulty?: string; examBoard?: string; };
}) {
  // Build a minimal worksheet object compatible with WorksheetRenderer
  const worksheetData = {
    title,
    subtitle,
    sections,
    metadata: metadata || {},
    isAI: true,
  };
  return (
    <div className="worksheet-parent-portal-view overflow-auto">
      <WorksheetRenderer
        worksheet={worksheetData as any}
        viewMode="student"
        textSize={14}
        overlayColor="none"
        editMode={false}
        editedSections={{}}
      />
    </div>
  );
}

/** Render any AI-generated content (worksheets, tools, differentiation) as formatted HTML */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function contentToHtml(text: string): string {
  // Decode any HTML entities that may have been double-encoded before processing
  const decoded = decodeHtmlEntities(text);
  const withMath = renderMath(decoded);
  return withMath
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>")
    .replace(/^#{1,3} (.+)$/gm, "<h3 class='font-bold text-base mt-4 mb-1 text-foreground'>$1</h3>")
    .replace(/^[•\-] (.+)$/gm, "<li class='ml-4 list-disc text-foreground/90'>$1</li>")
    .replace(/^\* (.+)$/gm, "<li class='ml-4 list-disc text-foreground/90'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 list-decimal text-foreground/90'>$2</li>")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\n{2,}/g, "</p><p class='mb-2 text-foreground/90'>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p class='mb-2 text-foreground/90'>")
    .replace(/$/, "</p>");
}

function storyToHtml(md: string, textSize: number): string {
  return md
    .replace(/^## (.+)$/gm, `<h2 style="font-size:${textSize + 4}px" class="font-bold mt-6 mb-2 text-emerald-700">$1</h2>`)
    .replace(/^# (.+)$/gm, `<h1 style="font-size:${textSize + 8}px" class="font-bold mb-4">$1</h1>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, `</p><p style="font-size:${textSize}px" class="mb-3 leading-relaxed">`)
    .replace(/^/, `<p style="font-size:${textSize}px" class="mb-3 leading-relaxed">`)
    + '</p>';
}

// ─────────────────────────────────────────────
// Past Papers Panel (used inside Parent Portal)
// ─────────────────────────────────────────────
const ppColorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    badge: "bg-blue-100 text-blue-700" },
  green:   { bg: "bg-green-50",   border: "border-green-200",   text: "text-green-700",   badge: "bg-green-100 text-green-700" },
  purple:  { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  badge: "bg-purple-100 text-purple-700" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  badge: "bg-orange-100 text-orange-700" },
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-700",  badge: "bg-indigo-100 text-indigo-700" },
  teal:    { bg: "bg-teal-50",    border: "border-teal-200",    text: "text-teal-700",    badge: "bg-teal-100 text-teal-700" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-700" },
  cyan:    { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-700",    badge: "bg-cyan-100 text-cyan-700" },
  slate:   { bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-700",   badge: "bg-slate-100 text-slate-700" },
  yellow:  { bg: "bg-yellow-50",  border: "border-yellow-200",  text: "text-yellow-700",  badge: "bg-yellow-100 text-yellow-700" },
  pink:    { bg: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-700",    badge: "bg-pink-100 text-pink-700" },
};

function PastPapersPanel() {
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedBoard, setSelectedBoard] = useState<string>("All");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const filteredSubjects = pastPaperSubjects.map(s => ({
    ...s,
    filteredBoards: s.examBoards
      .filter(eb => selectedBoard === "All" || eb.board === selectedBoard)
      .map(eb => ({
        ...eb,
        papers: eb.papers.filter(p => selectedYear === "All" || p.year === parseInt(selectedYear)),
      }))
      .filter(eb => eb.papers.length > 0),
  })).filter(s => s.filteredBoards.length > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <ScrollText className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">GCSE Past Papers</h3>
          <p className="text-xs text-muted-foreground">Free papers & mark schemes from official exam boards</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Filter className="w-3.5 h-3.5" /> Filter
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="All">All Years</option>
                {ppAllYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">Exam Board</label>
              <select
                value={selectedBoard}
                onChange={e => setSelectedBoard(e.target.value)}
                className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="All">All Boards</option>
                {ppAllBoards.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          {(selectedYear !== "All" || selectedBoard !== "All") && (
            <button
              onClick={() => { setSelectedYear("All"); setSelectedBoard("All"); }}
              className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </CardContent>
      </Card>

      {/* Subject list */}
      {filteredSubjects.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-6 text-center">
            <ScrollText className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground">No papers found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredSubjects.map(subject => {
            const colors = ppColorMap[subject.color] ?? ppColorMap.blue;
            const isExpanded = expandedSubject === subject.id;
            const totalPapers = subject.filteredBoards.reduce((sum, eb) => sum + eb.papers.length, 0);
            return (
              <div key={subject.id} className={`rounded-xl border-2 ${colors.border} overflow-hidden`}>
                {/* Subject header */}
                <button
                  onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                  className={`w-full flex items-center justify-between p-3 ${colors.bg}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{subject.icon}</span>
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${colors.text}`}>{subject.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {totalPapers} paper{totalPapers !== 1 ? "s" : ""}
                        {" · "}{subject.filteredBoards.map(eb => eb.board).join(", ")}
                      </p>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className={`w-4 h-4 ${colors.text}`} />
                    : <ChevronDown className={`w-4 h-4 ${colors.text}`} />}
                </button>

                {/* Papers list */}
                {isExpanded && (
                  <div className="bg-white divide-y divide-border/40">
                    {subject.filteredBoards.map(eb => (
                      <div key={eb.board} className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge} mb-2 inline-block`}>
                          {eb.board}
                        </span>
                        <div className="space-y-1.5 mt-1">
                          {eb.papers.map((paper, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-2 py-1.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground leading-tight">{paper.title}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  {paper.tier && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                      paper.tier === "Higher" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                                    }`}>{paper.tier}</span>
                                  )}
                                  <span className="text-[9px] text-muted-foreground">{paper.series} {paper.year}</span>
                                </div>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <a
                                  href={paper.paperUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  <FileText className="w-3 h-3" /> Paper
                                </a>
                                <a
                                  href={paper.markSchemeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                  <CheckCircle className="w-3 h-3" /> MS
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-2 flex items-center gap-1">
                          <FileText className="w-2.5 h-2.5" />
                          Direct PDF downloads — no sign-in required
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-[10px] text-blue-700 leading-relaxed">
          <strong>About these resources:</strong> Clicking Paper or MS downloads the PDF directly — no sign-in required. Papers are hosted by Physics &amp; Maths Tutor and sourced from AQA, Edexcel and OCR.
        </p>
      </div>
    </div>
  );
}

function NewslettersPanel() {
  const { parentNewsletters } = useApp() as any;
  const [selectedNewsletter, setSelectedNewsletter] = useState<any | null>(null);
  const newsletters: any[] = parentNewsletters || [];

  if (newsletters.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📰</span>
          </div>
          <h3 className="font-semibold text-foreground mb-1">No Newsletters Yet</h3>
          <p className="text-sm text-muted-foreground">School newsletters will appear here when published by staff.</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedNewsletter) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setSelectedNewsletter(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to newsletters
        </button>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <h3 className="font-bold text-lg text-foreground mb-1">{selectedNewsletter.title}</h3>
            <p className="text-xs text-muted-foreground mb-4">{selectedNewsletter.date}</p>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
              {selectedNewsletter.content}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">Latest communications from school:</p>
      {newsletters.map((n: any) => (
        <Card key={n.id} className="border-border/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedNewsletter(n)}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-base">📰</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.date}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.content?.slice(0, 120)}...</p>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ParentPortal() {
  const { children, addSubmission, updateAssignment, attendanceRecords } = useApp();
  const [code, setCode] = useState("");
  const [child, setChild] = useState<Child | null>(null);
  const [behaviourRecords, setBehaviourRecords] = useState<any[]>([]);
  const [supportPlans, setSupportPlans] = useState<any[]>([]);
  const [behaviourLoading, setBehaviourLoading] = useState(false);
  const [viewContent, setViewContent] = useState<{
    title: string;
    subtitle?: string;
    content: string;
    type?: string;
    sections?: Array<{ title: string; type: string; content: string; teacherOnly?: boolean; svg?: string; caption?: string }>;
    metadata?: { subject?: string; topic?: string; yearGroup?: string; difficulty?: string; examBoard?: string; };
  } | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("assignments");
  const [activeSection, setActiveSection] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitContent, setSubmitContent] = useState("");
  const [submitQuestion, setSubmitQuestion] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ dataUrl: string; name: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Story generator state
  const [storyGenre, setStoryGenre] = useState("");
  const [storyYearGroup, setStoryYearGroup] = useState("");
  const [storyCharacters, setStoryCharacters] = useState<string[]>([""]);
  const [storySetting, setStorySetting] = useState("");
  const [storyLength, setStoryLength] = useState("medium");
  const [storyReadingLevel, setStoryReadingLevel] = useState("age-appropriate");
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyResult, setStoryResult] = useState<{ title: string; content: string; questions: string[] } | null>(null);
  const [storyTextSize, setStoryTextSize] = useState(15);
  const [storyOverlay, setStoryOverlay] = useState("none");
  const [showQuestions, setShowQuestions] = useState(false);
  type StoryEditMode = "none" | "manual" | "ai";
  const [storyEditMode, setStoryEditMode] = useState<StoryEditMode>("none");
  const [storyManualText, setStoryManualText] = useState("");
  const [storyAiPrompt, setStoryAiPrompt] = useState("");
  const [storyAiEditLoading, setStoryAiEditLoading] = useState(false);

  // AI Insights state
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsResult, setInsightsResult] = useState<{ strengths: string[]; areasForGrowth: string[]; suggestedPractice: string[]; encouragement: string } | null>(null);

  const handleCodeEntry = () => {
    const found = children.find(c => c.code === code.toUpperCase().trim());
    if (found) {
      setChild(found);
      toast.success(`Welcome! Viewing ${found.name}'s portal.`);
      // Fetch behaviour records and support plans from the server
      setBehaviourLoading(true);
      const token = localStorage.getItem('send_token');
      const hdrs = { Authorization: `Bearer ${token}` };
      Promise.all([
        fetch(`/api/data/parent/behaviour/${found.id}`, { headers: hdrs }).then(r => r.ok ? r.json() : []),
        fetch(`/api/data/parent/support-plans/${found.id}`, { headers: hdrs }).then(r => r.ok ? r.json() : []),
      ])
        .then(([beh, plans]) => {
          setBehaviourRecords(Array.isArray(beh) ? beh : []);
          setSupportPlans(Array.isArray(plans) ? plans : []);
        })
        .catch(() => { setBehaviourRecords([]); setSupportPlans([]); })
        .finally(() => setBehaviourLoading(false));
    } else {
      toast.error("Invalid code. Please check and try again.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadedFile({ dataUrl, name: file.name, type: file.type });
      toast.success(`File "${file.name}" ready to upload.`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWork = () => {
    if (!child || !submitTitle) {
      toast.error("Please add a title for your submission.");
      return;
    }
    if (!submitContent && !uploadedFile) {
      toast.error("Please add some work — either type it or upload a file.");
      return;
    }
    addSubmission(child.id, {
      title: submitTitle,
      content: submitContent,
      fileDataUrl: uploadedFile?.dataUrl,
      fileName: uploadedFile?.name,
      fileType: uploadedFile?.type,
      question: submitQuestion || undefined,
    });
    toast.success("Work submitted successfully!");
    setSubmitTitle(""); setSubmitContent(""); setSubmitQuestion("");
    setUploadedFile(null); setShowSubmit(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateInsights = async () => {
    if (!child) return;
    setInsightsLoading(true);
    setInsightsResult(null);
    try {
      const completedCount = child.assignments.filter(a => a.status === "completed").length;
      const pendingCount = child.assignments.filter(a => a.status !== "completed").length;
      const submissionsCount = child.submissions.length;
      const markedSubmissions = child.submissions.filter(s => s.mark || s.feedback);
      const feedbackSummary = markedSubmissions.slice(-5).map(s => `Assignment: ${s.title}. Mark: ${s.mark || "not marked"}. Feedback: ${s.feedback || "none"}`).join("\n");
      const systemPrompt = `You are a supportive UK school teacher providing personalised insights to parents about their child's learning progress. Be warm, encouraging, and specific. Always respond with valid JSON only.`;
      const userPrompt = `Generate personalised learning insights for ${child.name} (${child.yearGroup}${child.sendNeed ? `, ${child.sendNeed}` : ""}).

Progress data:
- Completed assignments: ${completedCount}
- Pending assignments: ${pendingCount}
- Work submitted: ${submissionsCount}
- Recent feedback from teacher:\n${feedbackSummary || "No feedback yet"}

Return EXACTLY this JSON:
{
  "strengths": ["[specific strength 1 based on data]", "[specific strength 2]", "[specific strength 3]"],
  "areasForGrowth": ["[specific area for improvement 1]", "[specific area for improvement 2]"],
  "suggestedPractice": ["[specific practice activity 1 parents can do at home]", "[specific practice activity 2]", "[specific practice activity 3]"],
  "encouragement": "[1-2 sentences of warm, personalised encouragement for the parent and child]"
}`;
      const token = localStorage.getItem("send_token");
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
        body: JSON.stringify({ prompt: userPrompt, systemPrompt, maxTokens: 800 }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      const text = (data.content || data.text || "").replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = parseWithFixes(text);
      setInsightsResult(parsed);
    } catch (err) {
      toast.error("Could not generate insights. Please try again.");
    }
    setInsightsLoading(false);
  };

  const markStarted = (assignmentId: string) => {
    if (!child) return;
    updateAssignment(child.id, assignmentId, { status: "started", progress: 10 });
    toast.success("Marked as started!");
  };

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    if (status === "started") return <Clock className="w-4 h-4 text-amber-500" />;
    return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  };

  // Story generator functions
  const addCharacter = () => setStoryCharacters([...storyCharacters, ""]);
  const removeCharacter = (i: number) => setStoryCharacters(storyCharacters.filter((_, idx) => idx !== i));
  const updateCharacter = (i: number, val: string) => {
    const updated = [...storyCharacters];
    updated[i] = val;
    setStoryCharacters(updated);
  };

  

  const handleGenerateStory = async () => {
    if (!storyGenre || !storyYearGroup) {
      toast.error("Please select a genre and year group.");
      return;
    }
    setStoryLoading(true);
    try {
      const charNames = storyCharacters.filter(c => c.trim());
      const result = await aiGenerateStory({
        genre: storyGenre,
        yearGroup: storyYearGroup,
        characters: charNames,
        setting: storySetting || undefined,
        readingLevel: storyReadingLevel,
        length: storyLength,
        sendNeed: child?.sendNeed,
      });
      const questions = generateComprehensionQuestions(result.content, storyGenre);
      setStoryResult({ title: result.title, content: result.content, questions });
      toast.success("Story generated with AI!");
    } catch (_err) {
      // Fallback to local generator
      const charNames = storyCharacters.filter(c => c.trim());
      const story = generateStoryContent({
        genre: storyGenre,
        yearGroup: storyYearGroup,
        characters: charNames,
        setting: storySetting || undefined,
        readingLevel: storyReadingLevel,
        length: storyLength,
      });
      const questions = generateComprehensionQuestions(story.content, storyGenre);
      setStoryResult({ ...story, questions });
      toast.success("Story generated!");
    }
    setStoryLoading(false);
  };

  const storyOverlayBg = colorOverlays.find(o => o.id === storyOverlay)?.color || "#ffffff";

  if (!child) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-emerald-50 to-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Parent Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your child's access code to get started</p>
          </div>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Access Code</Label>
                <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  className="h-12 text-center text-lg font-mono tracking-widest uppercase"
                  maxLength={6}
                  onKeyDown={e => e.key === "Enter" && handleCodeEntry()} />
                <p className="text-xs text-muted-foreground text-center">Ask your child's teacher for their unique code</p>
              </div>
              <Button onClick={handleCodeEntry} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
                <KeyRound className="w-4 h-4 mr-2" /> Access Portal
              </Button>
              <div className="text-center">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Teacher Login
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <h3 className="text-sm font-semibold text-emerald-800 mb-2">What can you do here?</h3>
            <ul className="space-y-1.5 text-xs text-emerald-700">
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" /> View your child's assignments</li>
              <li className="flex items-center gap-2"><Upload className="w-3.5 h-3.5" /> Upload completed work (photos or files)</li>
              <li className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Generate personalised stories to read at home</li>
              <li className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Ask questions and receive teacher feedback</li>
            </ul>
          </div>
        </motion.div>
      </div>
    );
  }

  const needName = sendNeeds.find(n => n.id === child.sendNeed)?.name || child.sendNeed;

  // Dashboard stats
  const childAttendance = attendanceRecords.filter((r: any) => r.childId === child.id);
  const amPresent = childAttendance.filter((r: any) => r.amStatus === "attended").length;
  const pmPresent = childAttendance.filter((r: any) => r.pmStatus === "attended").length;
  const totalDays = childAttendance.length;
  const amPct = totalDays > 0 ? Math.round((amPresent / totalDays) * 100) : null;
  const pmPct = totalDays > 0 ? Math.round((pmPresent / totalDays) * 100) : null;
  const overallPct = totalDays > 0 ? Math.round(((amPresent + pmPresent) / (totalDays * 2)) * 100) : null;
  const pendingAssignments = child.assignments.filter(a => a.status !== "completed");
  const completedAssignments = child.assignments.filter(a => a.status === "completed");
  const recentBehaviour = behaviourRecords.slice(0, 5);
  const positiveCount = behaviourRecords.filter((r: any) => r.type === "positive").length;
  const concernCount = behaviourRecords.filter((r: any) => r.type === "concern" || r.type === "incident").length;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-emerald-600" },
    { id: "assignments", label: "Assignments", icon: FileText, color: "text-blue-600" },
    { id: "attendance", label: "Attendance", icon: CalendarDays, color: "text-green-600" },
    { id: "behaviour", label: "Behaviour", icon: TrendingUp, color: "text-orange-600" },
    { id: "timetable", label: "Timetable", icon: Calendar, color: "text-purple-600" },
    { id: "submissions", label: "Submit Work", icon: Upload, color: "text-teal-600" },
    { id: "stories", label: "Story Generator", icon: BookOpen, color: "text-pink-600" },
    { id: "past-papers", label: "Past Papers", icon: ScrollText, color: "text-indigo-600" },
    { id: "revision-hub", label: "Revision Hub", icon: Headphones, color: "text-violet-600" },
    { id: "quizblast", label: "QuizBlast", icon: Zap, color: "text-yellow-500" },
    { id: "newsletters", label: "Newsletters", icon: Newspaper, color: "text-rose-600" },
    { id: "send-screener", label: "SEND Screener", icon: ScanSearch, color: "text-cyan-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border/50 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-1 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">{child.name[0]}</div>
            <span className="text-sm font-semibold text-foreground">{child.name}'s Portal</span>
          </div>
          <button onClick={() => setChild(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-72 z-50 shadow-xl flex flex-col bg-white">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-emerald-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                  {child.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{child.name}</div>
                  <div className="text-xs text-emerald-100">{child.yearGroup} · {needName}</div>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto py-3">
              <div className="px-3 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Navigation</span>
              </div>
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                    className={`w-full mx-0 px-4 py-2.5 flex items-center gap-3 transition-all text-sm ${
                      isActive ? "bg-emerald-50 text-emerald-700 font-medium border-r-2 border-emerald-600" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : item.color}`} />
                    <span>{item.label}</span>
                    {item.id === "assignments" && pendingAssignments.length > 0 && (
                      <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {pendingAssignments.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-border/50">
              <button
                onClick={() => setChild(null)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Exit Portal
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 px-4 py-5 max-w-3xl mx-auto w-full space-y-4">
        {/* Bottom nav tabs for mobile */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {navItems.slice(0, 6).map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-muted-foreground border border-border/50 hover:bg-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ─── DASHBOARD ─── */}
        {activeSection === "dashboard" && (
          <div className="space-y-4">
            {/* Welcome card */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    {child.name[0]}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold">{child.name}</h2>
                    <p className="text-emerald-100 text-sm">{child.yearGroup}</p>
                    {needName && needName !== child.sendNeed && (
                      <span className="inline-block mt-1 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{needName}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{overallPct !== null ? `${overallPct}%` : "—"}</div>
                    <div className="text-emerald-100 text-xs">Attendance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{pendingAssignments.length}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Pending</div>
                  <div className="text-xs text-muted-foreground">Assignments</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600">{positiveCount}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Positive</div>
                  <div className="text-xs text-muted-foreground">Behaviour</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-500">{concernCount}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Concerns</div>
                  <div className="text-xs text-muted-foreground">Logged</div>
                </CardContent>
              </Card>
            </div>

            {/* Current Assignments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground text-sm">Current Assignments</h3>
                <button onClick={() => setActiveSection("assignments")} className="text-xs text-emerald-600 hover:underline">View all</button>
              </div>
              {pendingAssignments.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5 text-center">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">No pending assignments</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {pendingAssignments.slice(0, 3).map(a => (
                    <Card key={a.id} className="border-0 shadow-sm">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          a.status === "started" ? "bg-amber-100" : "bg-blue-100"
                        }`}>
                          {a.status === "started" ? <Clock className="w-4 h-4 text-amber-600" /> : <FileText className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground">Set {new Date(a.assignedAt).toLocaleDateString('en-GB')}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          a.status === "started" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        }`}>{a.status === "started" ? "In Progress" : "Not Started"}</span>
                      </CardContent>
                    </Card>
                  ))}
                  {pendingAssignments.length > 3 && (
                    <button onClick={() => setActiveSection("assignments")} className="w-full text-xs text-center text-emerald-600 hover:underline py-1">
                      + {pendingAssignments.length - 3} more assignments
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Attendance Summary */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground text-sm">Attendance</h3>
                <button onClick={() => setActiveSection("attendance")} className="text-xs text-emerald-600 hover:underline">View details</button>
              </div>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  {totalDays === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No attendance records yet</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Overall Attendance</span>
                        <span className={`text-sm font-bold ${
                          overallPct !== null && overallPct >= 95 ? "text-emerald-600" :
                          overallPct !== null && overallPct >= 90 ? "text-amber-600" : "text-red-600"
                        }`}>{overallPct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            overallPct !== null && overallPct >= 95 ? "bg-emerald-500" :
                            overallPct !== null && overallPct >= 90 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${overallPct || 0}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">{amPct}%</div>
                          <div className="text-xs text-muted-foreground">AM Sessions</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">{pmPct}%</div>
                          <div className="text-xs text-muted-foreground">PM Sessions</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Behaviour */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground text-sm">Recent Behaviour</h3>
                <button onClick={() => setActiveSection("behaviour")} className="text-xs text-emerald-600 hover:underline">View all</button>
              </div>
              {behaviourLoading ? (
                <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center text-sm text-muted-foreground">Loading...</CardContent></Card>
              ) : recentBehaviour.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-1">🌟</div>
                    <p className="text-sm font-medium text-foreground">No behaviour events logged</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Events logged by staff will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {recentBehaviour.map((event: any, i: number) => (
                    <Card key={i} className="border-0 shadow-sm">
                      <CardContent className={`p-3 flex items-start gap-3 ${
                        event.type === "positive" ? "bg-emerald-50" :
                        event.type === "concern" ? "bg-amber-50" : "bg-red-50"
                      }`}>
                        <span className="text-lg flex-shrink-0">
                          {event.type === "positive" ? "⭐" : event.type === "concern" ? "⚠️" : "📝"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold capitalize">{event.category || event.type}</p>
                            <p className="text-xs text-muted-foreground">{event.date ? new Date(event.date).toLocaleDateString('en-GB') : ""}</p>
                          </div>
                          {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* AI Learning Insights */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground text-sm">AI Learning Insights</h3>
                <Button size="sm" variant="outline" disabled={insightsLoading} onClick={generateInsights}
                  className="text-xs h-7 gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                  {insightsLoading ? <><RefreshCw className="w-3 h-3 animate-spin" /> Generating...</> : <><Zap className="w-3 h-3" /> Generate Insights</>}
                </Button>
              </div>
              {!insightsResult && !insightsLoading && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <Zap className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Personalised AI Insights</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Click "Generate Insights" to get AI-powered strengths, areas for growth, and suggested practice activities.</p>
                  </CardContent>
                </Card>
              )}
              {insightsLoading && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-spin" />
                    <p className="text-sm text-muted-foreground">Analysing {child?.name}'s progress...</p>
                  </CardContent>
                </Card>
              )}
              {insightsResult && (
                <div className="space-y-3">
                  {/* Encouragement */}
                  <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
                    <CardContent className="p-4">
                      <p className="text-sm text-indigo-800 leading-relaxed">💬 {insightsResult.encouragement}</p>
                    </CardContent>
                  </Card>
                  {/* Strengths */}
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">✅ Strengths</p>
                      <ul className="space-y-1">
                        {insightsResult.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  {/* Areas for Growth */}
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">📈 Areas for Growth</p>
                      <ul className="space-y-1">
                        {insightsResult.areasForGrowth.map((a, i) => (
                          <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">•</span>{a}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  {/* Suggested Practice */}
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">🏠 Suggested Practice at Home</p>
                      <ul className="space-y-1">
                        {insightsResult.suggestedPractice.map((p, i) => (
                          <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                            <span className="text-blue-500 mt-0.5">{i + 1}.</span>{p}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-2">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "submissions", label: "Submit Work", icon: Upload, color: "bg-teal-50 text-teal-700 border-teal-200" },
                  { id: "stories", label: "Story Generator", icon: BookOpen, color: "bg-pink-50 text-pink-700 border-pink-200" },
                  { id: "past-papers", label: "Past Papers", icon: ScrollText, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                  { id: "revision-hub", label: "Revision Hub", icon: Headphones, color: "bg-violet-50 text-violet-700 border-violet-200" },
                ].map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => setActiveSection(action.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all hover:shadow-sm ${action.color}`}
                    >
                      <Icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── SECTION CONTENT (non-dashboard) ─── */}
        {activeSection !== "dashboard" && (() => {
          const sec = { id: activeSection };
          return (
            <div className="space-y-4">
              {/* Section header */}
              <div className="flex items-center gap-2">
                {(() => {
                  const navItem = navItems.find(n => n.id === activeSection);
                  const Icon = navItem?.icon || FileText;
                  return (
                    <>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white shadow-sm`}>
                        <Icon className={`w-4 h-4 ${navItem?.color || "text-muted-foreground"}`} />
                      </div>
                      <h2 className="text-base font-semibold text-foreground">{navItem?.label}</h2>
                    </>
                  );
                })()}
              </div>

              {/* Section content */}
              <div>
        {sec.id === "newsletters" && <div className="space-y-3">
          <NewslettersPanel />
        </div>}
        {sec.id === "assignments" && <div className="space-y-2">
            {child.assignments.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">No Assignments Yet</h3>
                  <p className="text-sm text-muted-foreground">Your teacher hasn't assigned any work yet.</p>
                </CardContent>
              </Card>
            ) : child.assignments.map(a => (
              <Card key={a.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {a.type === "worksheet" ? <FileText className="w-5 h-5 text-emerald-600 mt-0.5" /> : <BookOpen className="w-5 h-5 text-purple-600 mt-0.5" />}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">{a.title}</h4>
                        {statusIcon(a.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Assigned: {new Date(a.assignedAt).toLocaleDateString()}</p>

                      {/* Progress bar */}
                      {(a.progress !== undefined && a.progress > 0) && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground">Progress</span>
                            <span className="text-[10px] font-medium text-emerald-600">{a.progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${a.progress}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Teacher comment */}
                      {a.teacherComment && (
                        <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                          <p className="text-xs text-emerald-700 flex items-start gap-1.5">
                            <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span><strong>Teacher:</strong> {a.teacherComment}</span>
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => setViewContent({ title: a.title, subtitle: (a as any).subtitle, content: a.content, type: a.type, sections: (a as any).sections, metadata: (a as any).metadata })}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                        {a.status === "not-started" && (
                          <Button variant="outline" size="sm" onClick={() => markStarted(a.id)}>
                            <Clock className="w-3.5 h-3.5 mr-1" /> Start
                          </Button>
                        )}
                      </div>
                      {a.feedback && <div className="mt-2 p-2 rounded-lg bg-emerald-50 text-xs text-emerald-700">Teacher feedback: {a.feedback}</div>}
                      {a.mark && <div className="mt-1 text-xs font-semibold">Mark: {a.mark}</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>}
        {sec.id === "behaviour" && <div className="space-y-3">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-lg">📋</span> Behaviour Support Plans
                </h3>
                {behaviourLoading ? (
                  <div className="text-center py-4"><p className="text-sm text-muted-foreground">Loading...</p></div>
                ) : supportPlans.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-sm font-medium text-foreground">No active behaviour support plans</p>
                    <p className="text-xs text-muted-foreground mt-1">Your child's teacher will share any plans here when created.</p>
                  </div>
                ) : supportPlans.map((plan: any, i: number) => (
                  <div key={i} className="border border-border/50 rounded-lg p-3 mb-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-sm">{plan.title || 'Behaviour Support Plan'}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        plan.status === 'review' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{plan.status || 'Active'}</span>
                    </div>
                    {plan.summary && <p className="text-xs text-muted-foreground mt-2">{plan.summary}</p>}
                    {plan.strategies && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-foreground mb-1">Strategies:</p>
                        <p className="text-xs text-muted-foreground">{plan.strategies}</p>
                      </div>
                    )}
                    {plan.positiveTargets && (
                      <div className="mt-2 p-2 rounded bg-emerald-50 border border-emerald-200">
                        <p className="text-xs font-semibold text-emerald-700 mb-1">Positive Targets:</p>
                        <p className="text-xs text-emerald-700">{plan.positiveTargets}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-lg">📊</span> Recent Behaviour Log
                </h3>
                {behaviourLoading ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Loading behaviour records...</p>
                  </div>
                ) : behaviourRecords.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">🌟</div>
                    <p className="text-sm font-medium text-foreground">No behaviour events recorded</p>
                    <p className="text-xs text-muted-foreground mt-1">Positive and other events logged by staff will appear here.</p>
                  </div>
                ) : behaviourRecords.slice(0, 20).map((event: any, i: number) => (
                  <div key={i} className={`flex items-start gap-3 p-2 rounded-lg mb-2 ${
                    event.type === 'positive' ? 'bg-emerald-50 border border-emerald-200' :
                    event.type === 'concern' ? 'bg-amber-50 border border-amber-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <span className="text-lg flex-shrink-0">
                      {event.type === 'positive' ? '⭐' : event.type === 'concern' ? '⚠️' : '📝'}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold capitalize">{event.category || event.type}</p>
                        <p className="text-xs text-muted-foreground">{event.date ? new Date(event.date).toLocaleDateString('en-GB') : ''}</p>
                      </div>
                      {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                      {event.action_taken && <p className="text-xs text-blue-600 mt-0.5">Action: {event.action_taken}</p>}
                      {event.recorded_by_name && <p className="text-xs text-muted-foreground mt-0.5">Recorded by: {event.recorded_by_name}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-lg">🏆</span> Achievements &amp; Rewards
                </h3>
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🌟</div>
                  <p className="text-sm font-medium text-foreground">Achievements will appear here</p>
                  <p className="text-xs text-muted-foreground mt-1">Stars, certificates, and rewards earned by your child will be shown here.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-xs text-blue-700">
                  <strong>Questions about behaviour?</strong> Please contact your child's teacher or SENCO directly through the school office. This portal is updated by staff regularly.
                </p>
              </CardContent>
            </Card>
        </div>}
        {sec.id === "submissions" && <div className="space-y-3">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" /> Submit Work
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Title / What is this for? *</Label>
                    <Input value={submitTitle} onChange={e => setSubmitTitle(e.target.value)}
                      placeholder="e.g. Maths homework — fractions" className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Written Work (optional)</Label>
                    <Textarea value={submitContent} onChange={e => setSubmitContent(e.target.value)}
                      placeholder="Type your work here, or upload a photo/file below..."
                      className="min-h-[100px] text-sm" />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Upload Photo or File (optional)</Label>
                    <div
                      className="border-2 border-dashed border-border/60 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadedFile ? (
                        <div className="space-y-2">
                          {uploadedFile.type.startsWith("image/") ? (
                            <img src={uploadedFile.dataUrl} alt="Uploaded" className="max-h-40 mx-auto rounded-lg border border-border/50" />
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <FileText className="w-8 h-8 text-emerald-600" />
                              <span className="text-sm font-medium text-foreground">{uploadedFile.name}</span>
                            </div>
                          )}
                          <p className="text-xs text-emerald-600 font-medium">{uploadedFile.name} — ready to submit</p>
                          <button
                            onClick={e => { e.stopPropagation(); setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto"
                          >
                            <X className="w-3 h-3" /> Remove file
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-center gap-3 mb-2">
                            <Image className="w-6 h-6 text-muted-foreground" />
                            <Paperclip className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">Tap to upload a photo or file</p>
                          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF, Word — max 10MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Question for teacher */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Question for the Teacher (optional)
                    </Label>
                    <Textarea value={submitQuestion} onChange={e => setSubmitQuestion(e.target.value)}
                      placeholder="Ask your child's teacher a question about this work..."
                      className="min-h-[70px] text-sm" />
                  </div>

                  <Button onClick={handleSubmitWork} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Upload className="w-4 h-4 mr-2" /> Submit Work
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Previous submissions */}
            {child.submissions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Previous Submissions</h4>
                {child.submissions.map(s => (
                  <Card key={s.id} className="border-border/50">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(s.submittedAt).toLocaleDateString()}</p>
                      {s.fileName && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" /> {s.fileName}
                        </p>
                      )}
                      {s.question && (
                        <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                          <p className="text-xs text-blue-700"><strong>Your question:</strong> {s.question}</p>
                        </div>
                      )}
                      {s.feedback && (
                        <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                          <p className="text-xs text-emerald-700"><strong>Teacher feedback:</strong> {s.feedback}</p>
                        </div>
                      )}
                      {s.mark && <div className="mt-1 text-xs font-semibold text-foreground">Mark: {s.mark}</div>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </div>}
        {sec.id === "stories" && <div className="space-y-4">
            {!storyResult ? (
              <Card className="border-border/50">
                <CardContent className="p-4 space-y-4">
                  <div className="text-center py-2">
                    <div className="text-3xl mb-2">📚</div>
                    <h3 className="font-semibold text-foreground">Story Generator</h3>
                    <p className="text-xs text-muted-foreground mt-1">Generate a personalised story to read at home</p>
                  </div>

                  {/* Genre Selection */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Choose a Genre *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {storyGenres.map(g => (
                        <button key={g.id} onClick={() => setStoryGenre(g.id)}
                          className={`p-2.5 rounded-lg border text-center transition-all ${storyGenre === g.id ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-300"}`}>
                          <div className="text-lg mb-0.5">{g.emoji}</div>
                          <div className="text-[10px] font-medium">{g.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Year Group *</Label>
                      <Select value={storyYearGroup} onValueChange={setStoryYearGroup}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select year" /></SelectTrigger>
                        <SelectContent>{yearGroups.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Reading Level</Label>
                      <Select value={storyReadingLevel} onValueChange={setStoryReadingLevel}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>{readingLevels.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Story Length */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Length</Label>
                    <div className="flex gap-2">
                      {storyLengths.map(l => (
                        <button key={l.id} onClick={() => setStoryLength(l.id)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${storyLength === l.id ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                          {l.name}<br /><span className="text-[9px] opacity-70">{l.words}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Characters */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Character Names</Label>
                      <button onClick={addCharacter} className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {storyCharacters.map((char, i) => (
                        <div key={i} className="flex gap-2">
                          <Input value={char} onChange={e => updateCharacter(i, e.target.value)}
                            placeholder={`Character ${i + 1} name`} className="h-9 text-sm" />
                          {storyCharacters.length > 1 && (
                            <button onClick={() => removeCharacter(i)} className="text-muted-foreground hover:text-destructive">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Setting (optional)</Label>
                    <Input value={storySetting} onChange={e => setStorySetting(e.target.value)}
                      placeholder="e.g. A magical forest, outer space..." className="h-10" />
                  </div>

                  <Button onClick={handleGenerateStory} disabled={storyLoading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
                    {storyLoading
                      ? <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Generating Story...</>
                      : <><BookOpen className="w-4 h-4 mr-2" /> Generate Story</>}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Story Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    <button onClick={() => setStoryTextSize(Math.max(12, storyTextSize - 2))}
                      className="p-1.5 rounded-md hover:bg-white/80 transition-all text-muted-foreground">
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-medium px-1.5 min-w-[32px] text-center">{storyTextSize}px</span>
                    <button onClick={() => setStoryTextSize(Math.min(24, storyTextSize + 2))}
                      className="p-1.5 rounded-md hover:bg-white/80 transition-all text-muted-foreground">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Overlay selector */}
                  <Select value={storyOverlay} onValueChange={setStoryOverlay}>
                    <SelectTrigger className="h-8 text-xs w-auto min-w-[120px]">
                      <SelectValue placeholder="Colour overlay" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOverlays.map(o => (
                        <SelectItem key={o.id} value={o.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: o.color }} />
                            {o.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {storyEditMode === "none" && (
                    <>
                      <Button variant="outline" size="sm"
                        className="gap-1.5 border-brand/40 text-brand hover:bg-brand-light"
                        onClick={() => setStoryEditMode("ai")}>
                        <Sparkles className="w-3.5 h-3.5" />Edit with AI
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5"
                        onClick={() => { setStoryManualText(storyResult.content); setStoryEditMode("manual"); }}>
                        <PenLine className="w-3.5 h-3.5" />Edit Manually
                      </Button>
                    </>
                  )}
                  {storyEditMode === "ai" && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-300"
                      onClick={() => { setStoryEditMode("none"); setStoryAiPrompt(""); }}>
                      <X className="w-3.5 h-3.5" />Cancel AI Edit
                    </Button>
                  )}
                  {storyEditMode === "manual" && (
                    <>
                      <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-300"
                        onClick={() => setStoryEditMode("none")}>
                        <X className="w-3.5 h-3.5" />Cancel
                      </Button>
                      <Button size="sm" className="bg-brand hover:bg-brand/90 text-white gap-1.5"
                        onClick={() => { setStoryResult({ ...storyResult, content: storyManualText }); setStoryEditMode("none"); toast.success("Changes saved!"); }}>
                        <Check className="w-3.5 h-3.5" />Save Changes
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setShowQuestions(!showQuestions)}>
                    {showQuestions ? "Hide Questions" : "Show Questions"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setStoryResult(null)}>
                    New Story
                  </Button>
                </div>

                {/* AI edit panel */}
                {storyEditMode === "ai" && (
                  <div className="rounded-lg border border-brand/30 bg-brand-light/30 p-3 space-y-2">
                    <p className="text-xs font-medium text-brand flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Describe what you'd like to change
                    </p>
                    <Textarea
                      value={storyAiPrompt}
                      onChange={e => setStoryAiPrompt(e.target.value)}
                      placeholder="e.g. Make it simpler, add more dialogue, change the ending…"
                      className="text-sm min-h-[80px] resize-none"
                      disabled={storyAiEditLoading}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-brand hover:bg-brand/90 text-white gap-1.5"
                        disabled={storyAiEditLoading}
                        onClick={async () => {
                          if (!storyAiPrompt.trim() || !storyResult) return;
                          setStoryAiEditLoading(true);
                          try {
                            const system = `You are an expert SEND teacher editing an educational story. Apply the instruction and return the full updated story as plain text only.`;
                            const user = `Story title: "${storyResult.title}"\n\nCurrent story:\n${storyResult.content}\n\nInstruction: ${storyAiPrompt}\n\nReturn the full updated story:`;
                            const { text } = await callAI(system, user, 3000);
                            setStoryResult({ ...storyResult, content: text.trim() });
                            setStoryEditMode("none");
                            setStoryAiPrompt("");
                            toast.success("Story updated with AI!");
                          } catch {
                            toast.error("AI edit failed. Please try again.");
                          }
                          setStoryAiEditLoading(false);
                        }}
                      >
                        {storyAiEditLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Editing…</> : <><Sparkles className="w-3.5 h-3.5" />Apply AI Edit</>}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setStoryEditMode("none"); setStoryAiPrompt(""); }} disabled={storyAiEditLoading}>
                        <X className="w-3.5 h-3.5 mr-1" />Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Manual edit textarea */}
                {storyEditMode === "manual" && (
                  <Textarea
                    value={storyManualText}
                    onChange={e => setStoryManualText(e.target.value)}
                    className="text-sm font-mono min-h-[300px] resize-y"
                  />
                )}

                {/* Story Content */}
                <Card className="border-border/50 overflow-hidden" style={{ backgroundColor: storyOverlayBg }}>
                  <CardContent className="p-5 sm:p-8" style={{ backgroundColor: storyOverlayBg }}>
                    <div className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: storyToHtml(storyResult.content, storyTextSize) }} />
                  </CardContent>
                </Card>

                {/* Comprehension Questions */}
                {showQuestions && storyResult.questions.length > 0 && (
                  <Card className="border-border/50" style={{ backgroundColor: storyOverlayBg }}>
                    <CardContent className="p-5" style={{ backgroundColor: storyOverlayBg }}>
                      <h3 className="font-semibold text-emerald-700 mb-3" style={{ fontSize: `${storyTextSize + 2}px` }}>
                        Comprehension Questions
                      </h3>
                      <ol className="space-y-3">
                        {storyResult.questions.map((q, i) => (
                          <li key={i} className="text-foreground flex gap-2" style={{ fontSize: `${storyTextSize}px` }}>
                            <span className="text-emerald-600 font-semibold">{i + 1}.</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
        </div>}
        {sec.id === "attendance" && <div className="space-y-4">
            {(() => {
              const recs = attendanceRecords
                .filter((r: AttendanceRecord) => r.childId === child.id)
                .sort((a: AttendanceRecord, b: AttendanceRecord) => b.date.localeCompare(a.date));
              const total = recs.length;
              const amPresent = recs.filter((r: AttendanceRecord) => r.amStatus === "attended").length;
              const pmPresent = recs.filter((r: AttendanceRecord) => r.pmStatus === "attended").length;
              const amPct = total > 0 ? Math.round((amPresent / total) * 100) : 0;
              const pmPct = total > 0 ? Math.round((pmPresent / total) * 100) : 0;
              const AttBadge = ({ status }: { status: AttendanceStatus }) => {
                if (status === "attended") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium"><CheckCircle2 className="h-3 w-3" />Present</span>;
                if (status === "absent") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium"><XCircle className="h-3 w-3" />Absent</span>;
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium"><MinusCircle className="h-3 w-3" />—</span>;
              };
              const fmtDate = (s: string) => {
                const [y, m, d] = s.split("-").map(Number);
                return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
              };
              return (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <div className="text-lg font-bold text-foreground">{total}</div>
                      <div className="text-xs text-muted-foreground">Days recorded</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-600">{amPct}%</div>
                      <div className="text-xs text-muted-foreground">AM attendance</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-600">{pmPct}%</div>
                      <div className="text-xs text-muted-foreground">PM attendance</div>
                    </div>
                  </div>
                  {recs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No attendance records yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50 rounded-lg border border-border/50 overflow-hidden">
                      {recs.slice(0, 20).map((rec: AttendanceRecord) => (
                        <div key={rec.id} className="px-3 py-2.5 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{fmtDate(rec.date)}</div>
                            {(rec.amReason || rec.pmReason) && (
                              <div className="text-xs text-red-600 mt-0.5">
                                {rec.amReason && <span>AM: {rec.amReason}</span>}
                                {rec.amReason && rec.pmReason && <span> · </span>}
                                {rec.pmReason && <span>PM: {rec.pmReason}</span>}
                              </div>
                            )}
                            {rec.notes && <div className="text-xs text-muted-foreground mt-0.5">{rec.notes}</div>}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <div className="text-center">
                              <div className="text-[9px] text-muted-foreground mb-0.5 flex items-center gap-0.5"><Sun className="h-2.5 w-2.5" />AM</div>
                              <AttBadge status={rec.amStatus} />
                            </div>
                            <div className="text-center">
                              <div className="text-[9px] text-muted-foreground mb-0.5 flex items-center gap-0.5"><Sunset className="h-2.5 w-2.5" />PM</div>
                              <AttBadge status={rec.pmStatus} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
        </div>}
        {sec.id === "timetable" && <div>
            {(() => {
              const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
              const periods = [1, 2, 3, 4, 5, 6, 7, 8];
              const periodTimes: Record<number, string> = {
                1: "8:50–9:50", 2: "9:50–10:50", 3: "11:10–12:10",
                4: "12:10–13:10", 5: "14:00–15:00", 6: "15:00–16:00",
                7: "16:00–17:00", 8: "17:00–18:00"
              };
              const timetable: TimetableLesson[] = child.timetable || [];
              const getLesson = (day: string, period: number) =>
                timetable.find(l => l.day === day && l.period === period);

              const subjectColors: Record<string, string> = {
                "Maths": "bg-blue-100 text-blue-800 border-blue-200",
                "English": "bg-purple-100 text-purple-800 border-purple-200",
                "Science": "bg-green-100 text-green-800 border-green-200",
                "History": "bg-amber-100 text-amber-800 border-amber-200",
                "Geography": "bg-teal-100 text-teal-800 border-teal-200",
                "Art": "bg-pink-100 text-pink-800 border-pink-200",
                "PE": "bg-orange-100 text-orange-800 border-orange-200",
                "Music": "bg-indigo-100 text-indigo-800 border-indigo-200",
                "Computing": "bg-cyan-100 text-cyan-800 border-cyan-200",
                "RE": "bg-rose-100 text-rose-800 border-rose-200",
                "PSHE": "bg-lime-100 text-lime-800 border-lime-200",
                "French": "bg-sky-100 text-sky-800 border-sky-200",
                "Spanish": "bg-red-100 text-red-800 border-red-200",
                "Drama": "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
              };
              const getColor = (subject: string) =>
                subjectColors[subject] || "bg-gray-100 text-gray-700 border-gray-200";

              // Today's day name
              const todayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
              const todayLessons = timetable.filter(l => l.day === todayName).sort((a, b) => a.period - b.period);

              if (timetable.length === 0) {
                return (
                  <Card className="border-border/50">
                    <CardContent className="p-6 text-center">
                      <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-foreground">No timetable set yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ask {child.name}'s teacher to add the timetable from the pupil management page.
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Today's lessons highlight */}
                  {todayLessons.length > 0 && (
                    <Card className="border-brand/30 bg-brand/5">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarDays className="h-4 w-4 text-brand" />
                          <span className="text-sm font-semibold text-brand">Today — {todayName}</span>
                        </div>
                        <div className="space-y-1.5">
                          {todayLessons.map(lesson => (
                            <div key={lesson.period} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${getColor(lesson.subject)}`}>
                              <span className="font-bold w-4">{lesson.period}</span>
                              <span className="font-semibold flex-1">{lesson.subject}</span>
                              {lesson.teacher && <span className="flex items-center gap-0.5"><User2 className="h-3 w-3" />{lesson.teacher}</span>}
                              {lesson.room && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{lesson.room}</span>}
                              <span className="text-[10px] opacity-70">{periodTimes[lesson.period]}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Full weekly timetable grid */}
                  <Card className="border-border/50">
                    <CardContent className="p-0 overflow-x-auto">
                      <table className="w-full text-xs border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 text-left font-semibold border-b border-border/50 w-16">Period</th>
                            {days.map(d => (
                              <th key={d} className={`p-2 text-center font-semibold border-b border-border/50 ${d === todayName ? "bg-brand/10 text-brand" : ""}`}>
                                {d.slice(0, 3)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {periods.slice(0, 6).map(p => (
                            <tr key={p} className="border-b border-border/30 hover:bg-muted/30">
                              <td className="p-1.5 text-center">
                                <div className="font-bold text-foreground">{p}</div>
                                <div className="text-[9px] text-muted-foreground">{periodTimes[p]}</div>
                              </td>
                              {days.map(d => {
                                const lesson = getLesson(d, p);
                                return (
                                  <td key={d} className={`p-1 text-center ${d === todayName ? "bg-brand/5" : ""}`}>
                                    {lesson ? (
                                      <div className={`rounded px-1 py-1 border text-[10px] leading-tight ${getColor(lesson.subject)}`}>
                                        <div className="font-semibold">{lesson.subject}</div>
                                        {lesson.room && <div className="opacity-70">{lesson.room}</div>}
                                      </div>
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  {/* Subject count summary */}
                  <Card className="border-border/50">
                    <CardContent className="p-3">
                      <p className="text-xs font-semibold text-foreground mb-2">This week's subjects</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(new Set(timetable.map(l => l.subject))).map(subj => {
                          const count = timetable.filter(l => l.subject === subj).length;
                          return (
                            <span key={subj} className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${getColor(subj)}`}>
                              {subj} × {count}
                            </span>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
        </div>}
        {sec.id === "past-papers" && <div><PastPapersPanel /></div>}
        {sec.id === "revision-hub" && (
          <div className="p-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
              <span className="text-2xl">🎧</span>
            </div>
            <p className="font-semibold text-foreground text-sm">Revision Hub</p>
            <p className="text-xs text-muted-foreground">Upload any document to get an AI-narrated podcast, interactive quiz, and AI tutor — all in one place.</p>
            <a href="/revision-hub" className="inline-flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-brand/90 transition-colors">
              Open Revision Hub →
            </a>
          </div>
        )}
        {sec.id === "quizblast" && (
          <div className="p-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center mx-auto">
              <span className="text-2xl">⚡</span>
            </div>
            <p className="font-semibold text-foreground text-sm">QuizBlast</p>
            <p className="text-xs text-muted-foreground">Live Kahoot-style classroom quiz game. Ask your child for the 6-digit room code to join their quiz session.</p>
            <div className="flex flex-col gap-2">
              <a href="/quiz-join" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-md">
                ⚡ Join a Quiz with Room Code
              </a>
              <a href="/quiz-game" className="inline-flex items-center justify-center gap-2 border border-indigo-200 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors">
                View Quiz Library
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground">Your child's teacher will share the room code when a live quiz is running.</p>
          </div>
        )}
        {sec.id === "send-screener" && (() => {
          const completedScreeners = child?.assignments?.filter(a => a.type === "send-screener") ?? [];
          const inProgressScreeners = child?.assignments?.filter(a => a.type === "send-screener-progress") ?? [];
          const latestCompleted = completedScreeners.length > 0 ? completedScreeners[completedScreeners.length - 1] : null;
          const latestInProgress = inProgressScreeners.length > 0 ? inProgressScreeners[inProgressScreeners.length - 1] : null;

          // Parse the in-progress data to check teacher permission
          let inProgressData: any = null;
          if (latestInProgress?.content) {
            try { inProgressData = JSON.parse(latestInProgress.content); } catch {}
          }
          const canResumeAtHome = inProgressData?.allowHomeResume === true;
          const progressPct = latestInProgress?.progress ?? 0;

          // Build resume URL with saved state encoded
          const resumeUrl = canResumeAtHome && inProgressData
            ? `/send-screener?resume=${encodeURIComponent(JSON.stringify({ mode: inProgressData.mode, answers: inProgressData.answers, currentQuestionIndex: inProgressData.currentQuestionIndex }))}`
            : null;

          return (
            <div className="p-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                <span className="text-amber-600 text-sm flex-shrink-0">⚠️</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>This is NOT a diagnosis.</strong> This screener identifies potential indicators of SEND needs based on validated clinical tools. Only a qualified professional can diagnose. Results are for informational purposes only.
                </p>
              </div>

              {/* In-progress screener — show resume if teacher has allowed it */}
              {latestInProgress && (
                <div className="border border-amber-200 rounded-xl overflow-hidden">
                  <div className="bg-amber-50 px-4 py-3 flex items-center gap-2">
                    <span className="text-amber-600">⏳</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-800">Screener In Progress</p>
                      <p className="text-xs text-amber-600 mt-0.5">{progressPct}% complete · Saved {new Date(latestInProgress.assignedAt).toLocaleDateString("en-GB")}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-amber-100">
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="px-4 py-3">
                    {canResumeAtHome ? (
                      <a
                        href={resumeUrl!}
                        className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-colors"
                      >
                        ▶ Resume Screener — pick up where you left off
                      </a>
                    ) : (
                      <p className="text-xs text-center text-muted-foreground py-1">
                        🔒 Your teacher hasn't enabled home resumption yet. Ask them to allow it.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Completed screener results */}
              {latestCompleted ? (
                <div className="space-y-4">
                  {latestCompleted.content ? (
                    <SendScreenerResultsView
                      content={latestCompleted.content}
                      title={latestCompleted.title}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-emerald-600">✅</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-800">SEND Screener Completed</p>
                        <p className="text-xs text-emerald-700">{latestCompleted.title}</p>
                        <p className="text-xs text-muted-foreground">Completed: {new Date(latestCompleted.assignedAt).toLocaleDateString("en-GB")}</p>
                      </div>
                    </div>
                  )}
                  <a
                    href="/send-screener"
                    className="flex items-center justify-center gap-2 w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors"
                  >
                    <span>🔍</span> Retake SEND Screener
                  </a>
                </div>
              ) : !latestInProgress ? (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This evidence-based screener covers 8 areas of SEND need: Dyslexia, ADHD, Autism (ASC), Dyspraxia, Dyscalculia, Speech &amp; Language, Anxiety, and Moderate Learning Difficulties. It takes approximately 15–20 minutes and produces a personalised report.
                  </p>
                  <a
                    href="/send-screener"
                    className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3 px-4 rounded-xl transition-colors shadow-md shadow-indigo-100"
                  >
                    <span>🔍</span> Start SEND Screener
                  </a>
                  <p className="text-[10px] text-center text-muted-foreground">
                    Questions are drawn from: BDA Dyslexia Checklist · WHO ASRS (ADHD) · AQ-10 (Autism) · MABC-2 (Dyspraxia) · Butterworth Dyscalculia Screener · CELF-5 (SLCN) · GAD-7 (Anxiety) · British Ability Scales (MLD)
                  </p>
                </>
              ) : null}
            </div>
          );
        })()}
              </div>
            </div>
          );
        })()}
      </main>

      {/* View Content Dialog — renders with full formatting matching how content was generated */}
      <Dialog open={!!viewContent} onOpenChange={() => setViewContent(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{viewContent?.title}</DialogTitle>
            {viewContent?.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{viewContent.subtitle}</p>}
          </DialogHeader>
          {viewContent?.type === 'send-screener' ? (
            <div className="mt-2">
              <SendScreenerResultsView
                content={viewContent.content}
                title={viewContent.title}
              />
            </div>
          ) : viewContent?.sections && viewContent.sections.length > 0 ? (
            // Render with full WorksheetRenderer for proper formatting
            <div className="mt-2">
              <WorksheetRendererView
                title={viewContent.title}
                subtitle={viewContent.subtitle}
                sections={viewContent.sections}
                metadata={viewContent.metadata}
              />
            </div>
          ) : (
            // Fallback for older assignments without sections
            <div
              className="mt-2 prose prose-sm max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: contentToHtml(viewContent?.content || "") }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
