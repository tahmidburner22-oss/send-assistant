import { useState, useRef, useCallback, useEffect } from "react";
import WorksheetRenderer from "@/components/WorksheetRenderer";
import { parseWithFixes } from "@/lib/ai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useApp, type Child, type Assignment, type Submission, type TimetableLesson } from "@/contexts/AppContext";
import { yearGroups, sendNeeds, subjects } from "@/lib/send-data";
import { getAuthHeader, scheduler as schedulerApi } from "@/lib/api";
import SENDInfoPanel from "@/components/SENDInfoPanel";
import { SendScreenerResultsView } from "@/components/SendScreenerResultsView";
import PupilDocumentsPanel from "@/components/PupilDocumentsPanel";
import { useScheduler } from "@/hooks/useScheduler";
import { TOPIC_BANK } from "@/lib/topic-bank";
import { CURRICULUM_PROGRESSIONS, getProgressionsForSubject, getRecommendedStep, type TopicProgression } from "@/lib/curriculum-progression";
import { frequencyLabel } from "@/lib/scheduler";
import { resolvePupilAssignmentOverlay } from "@/lib/assignmentViewContract";
import { TeacherPageHeader, TeacherWorkspace } from "@/components/TeacherWorkspace";
import {
  Plus, UserPlus, Copy, Trash2, Edit3, FileText, BookOpen,
  CheckCircle, Clock, AlertCircle, MessageSquare, TrendingUp,
  ChevronLeft, Shield, Star, Send, Calendar, X, Zap, BrainCircuit,
  PlayCircle, PauseCircle, RotateCcw, Settings2, Upload, RefreshCw, Database,
  Users, ChevronRight, ChevronDown, Layers, Lock, Eye, Sparkles, Search, BookMarked
} from "lucide-react";


// ─── Teacher-side Messages Panel ─────────────────────────────────────────────
function TeacherMessagesPanel({ childId, childName }: { childId: string; childName: string }) {
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; body: string; createdAt: string }>>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/parent-messages/${childId}`, { credentials: "include" });
      if (res.ok) { const d = await res.json(); setMessages(d.messages || []); }
    } catch {}
    setLoading(false);
  }, [childId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/parent-messages/${childId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: newMsg.trim(), sender: "teacher" }),
      });
      if (res.ok) { setNewMsg(""); await fetchMessages(); }
    } catch {}
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[420px] rounded-xl border border-border/50 bg-white overflow-hidden">
      <div className="p-3 border-b border-border/50 bg-emerald-50">
        <p className="text-sm font-semibold text-emerald-800">Parent Messages — {childName}</p>
        <p className="text-xs text-emerald-600 mt-0.5">Messages between you and {childName}'s parent/carer.</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full"><span className="text-xs text-muted-foreground">Loading...</span></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Send a message to {childName}'s parent to start a conversation.</p>
          </div>
        ) : messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === "teacher" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              m.sender === "teacher" ? "bg-emerald-600 text-white rounded-br-sm" : "bg-gray-100 text-foreground rounded-bl-sm"
            }`}>
              <p>{m.body}</p>
              <p className={`text-[10px] mt-1 ${m.sender === "teacher" ? "text-emerald-200" : "text-muted-foreground"}`}>
                {m.sender === "teacher" ? "You" : "Parent"} · {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-border/50 flex gap-2">
        <input
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message to the parent..."
          className="flex-1 h-9 text-sm px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMsg.trim()}
          className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium disabled:opacity-50 transition-colors"
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

// ─── Curriculum Progression Tab Component ───────────────────────────────────
function ProgressionTab({ child }: { child: import("@/contexts/AppContext").Child }) {
  const [selectedSubject, setSelectedSubject] = useState("mathematics");
  const [selectedProgression, setSelectedProgression] = useState<TopicProgression | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const progressions = getProgressionsForSubject(selectedSubject);

  const lastAssignment = child.assignments.filter(a => a.status !== 'not-started').slice(-1)[0] || null;
  const lastProgress = lastAssignment?.progress ?? 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-50 border border-purple-200">
        <Layers className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-purple-800">Curriculum Progression Model</p>
          <p className="text-xs text-purple-600 mt-0.5">Structured skill ladders that build step by step. The system recommends the next worksheet based on {child.name}'s performance.</p>
        </div>
      </div>

      {/* Subject selector */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Subject</Label>
        <Select value={selectedSubject} onValueChange={v => { setSelectedSubject(v); setSelectedProgression(null); setCurrentStepIndex(0); }}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {subjects.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Topic list or skill ladder */}
      {!selectedProgression ? (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Choose a Topic Skill Ladder</Label>
          {progressions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No skill ladders available for this subject yet.</p>
          ) : (
            <div className="space-y-1.5">
              {progressions.map(p => (
                <button
                  key={p.topicId}
                  onClick={() => { setSelectedProgression(p); setCurrentStepIndex(0); }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border/60 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left"
                >
                  <div>
                    <p className="text-xs font-medium">{p.topicName}</p>
                    <p className="text-[10px] text-muted-foreground">{p.steps.length} skill steps</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Back + title */}
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedProgression(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" />Back
            </button>
            <p className="text-xs font-semibold">{selectedProgression.topicName}</p>
          </div>

          {/* Step selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Current Step</Label>
            <Select value={String(currentStepIndex)} onValueChange={v => setCurrentStepIndex(Number(v))}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {selectedProgression.steps.map((s, i) => (
                  <SelectItem key={s.id} value={String(i)} className="text-xs">Step {i + 1}: {s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skill ladder visual */}
          <div className="space-y-1.5">
            {selectedProgression.steps.map((step, i) => {
              const isCompleted = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const isLocked = i > currentStepIndex;
              return (
                <div key={step.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all ${
                  isCompleted ? 'bg-green-50 border-green-200' :
                  isCurrent ? 'bg-purple-50 border-purple-300 border-2' :
                  'bg-muted/30 border-border/40'
                }`}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isCompleted ? 'bg-green-500' : isCurrent ? 'bg-purple-600' : 'bg-muted-foreground/20'
                  }`}>
                    {isCompleted ? <CheckCircle className="h-3.5 w-3.5 text-white" /> :
                     isLocked ? <Lock className="h-3 w-3 text-muted-foreground" /> :
                     <span className="text-[10px] text-white font-bold">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${
                      isCompleted ? 'text-green-800' : isCurrent ? 'text-purple-800' : 'text-muted-foreground'
                    }`}>
                      {isCurrent && <span className="text-[9px] bg-purple-600 text-white rounded px-1 mr-1">CURRENT</span>}
                      {isCompleted && <span className="text-[9px] bg-green-500 text-white rounded px-1 mr-1">DONE</span>}
                      {step.title}
                    </p>
                    {(isCurrent || isCompleted) && <p className="text-[10px] text-muted-foreground mt-0.5">{step.description}</p>}
                    {isCurrent && step.keyVocabulary.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {step.keyVocabulary.map(v => (
                          <span key={v} className="text-[9px] bg-purple-100 text-purple-700 rounded px-1.5 py-0.5">{v}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendation */}
          {lastAssignment && lastAssignment.status !== 'not-started' && (() => {
            const rec = getRecommendedStep(selectedProgression, currentStepIndex, lastProgress);
            return (
              <div className={`flex items-start gap-2 p-2.5 rounded-lg ${
                rec.shouldAdvance ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
              }`}>
                {rec.shouldAdvance
                  ? <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                  : <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-semibold ${
                    rec.shouldAdvance ? 'text-green-800' : 'text-amber-800'
                  }`}>{rec.reason}</p>
                  <p className={`text-[10px] mt-0.5 ${
                    rec.shouldAdvance ? 'text-green-700' : 'text-amber-700'
                  }`}>Recommended: <strong>{rec.step.title}</strong></p>
                </div>
              </div>
            );
          })()}

          {/* Generate worksheet button */}
          {currentStepIndex < selectedProgression.steps.length - 1 ? (
            <Button
              size="sm"
              className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white text-xs"
              onClick={() => {
                const step = selectedProgression.steps[currentStepIndex];
                const url = `/worksheets?subject=${selectedSubject}&topic=${encodeURIComponent(step.title)}&description=${encodeURIComponent(step.description)}&pupil=${child.id}`;
                window.location.href = url;
              }}
            >
              <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
              Generate Worksheet — Step {currentStepIndex + 1}: {selectedProgression.steps[currentStepIndex].title}
            </Button>
          ) : (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <p className="text-xs text-green-800 font-medium">All steps completed! 🎉</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default function Children() {
  const { children, addChild, removeChild, updateChild, updateAssignment, deleteAssignment, updateSubmission, refreshData } = useApp();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [showCsvDialog, setShowCsvDialog] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [pupilSearch, setPupilSearch] = useState("");
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [name, setName] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [sendNeed, setSendNeed] = useState(""); // kept for single-select compat
  const [selectedSendNeeds, setSelectedSendNeeds] = useState<string[]>([]);
  const [showSencoReport, setShowSencoReport] = useState(false);
  const [sencoReport, setSencoReport] = useState<any>(null);
  const [sencoReportLoading, setSencoReportLoading] = useState(false);

  // Load SENCO report when panel opens
  const loadSencoReport = async () => {
    if (sencoReport) return; // cached
    setSencoReportLoading(true);
    try {
          const res = await fetch("/api/admin/senco-report", {
        credentials: "include",
      });
      if (res.ok) setSencoReport(await res.json());
    } catch (_) {}
    setSencoReportLoading(false);
  };

  const handleGdprExportPupil = async (pupilId: string, pupilName: string) => {
    try {
          const res = await fetch(`/api/gdpr/pupils/${pupilId}/export`, {
        credentials: "include",
      });
      if (!res.ok) { import("sonner").then(m => m.toast.error("Export failed — admin access required")); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pupil-data-${pupilId.slice(0, 8)}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      import("sonner").then(m => m.toast.success(`Data exported for pupil`));
    } catch (_) { import("sonner").then(m => m.toast.error("Export failed")); }
  };

  const toggleSendNeed = (id: string) => {
    setSelectedSendNeeds(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  // Assignment detail state
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [teacherComment, setTeacherComment] = useState("");
  // Assignment view-only modal (eye icon)
  const [viewAssignment, setViewAssignment] = useState<Assignment | null>(null);
  const viewedAssignmentOverlay = resolvePupilAssignmentOverlay(viewAssignment?.metadata);

  // Submission feedback state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [markText, setMarkText] = useState("");
  const [autoMarkLoading, setAutoMarkLoading] = useState(false);
  const [autoMarkResult, setAutoMarkResult] = useState<{ mark: string; feedback: string; misconceptions: string[] } | null>(null);
  const [schedulerReviewLoading, setSchedulerReviewLoading] = useState(false);
  const [schedulerOverrideScore, setSchedulerOverrideScore] = useState("");
  const [progressExpanded, setProgressExpanded] = useState(false);
  // Topic card modal — stores the topic index clicked so we can show the full ladder
  const [selectedTopicCard, setSelectedTopicCard] = useState<{ topicIdx: number; subject: string } | null>(null);
  // SEND need collapsible — one entry per SEND need id, starts closed
  const [sendNeedExpanded, setSendNeedExpanded] = useState<Record<string, boolean>>({});

  // Pupil work plans are server-backed: state survives browser closure and is
  // shared with authorised colleagues. Refresh rather than constructing a
  // synthetic local assignment after a schedule run.
  const scheduler = useScheduler({
    children,
    onSchedulerChanged: async () => { await refreshData(); },
  });

  useEffect(() => {
    setSelectedChild(previous => previous
      ? children.find(child => child.id === previous.id) || previous
      : previous);
  }, [children]);

  const handleCsvImport = async (file: File) => {
    setCsvImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { toast.error("CSV must have a header row and at least one data row"); setCsvImporting(false); return; }
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ""; });
        return row;
      }).filter(r => Object.values(r).some(v => v));
      const res = await fetch("/api/mis/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ rows }),
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Import complete: ${data.created} added, ${data.updated} updated, ${data.skipped} skipped`);
        setShowCsvDialog(false);
        window.location.reload();
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch (e: any) {
      toast.error("Failed to parse CSV: " + e.message);
    }
    setCsvImporting(false);
  };

  const handleAdd = async () => {
    if (!name || !yearGroup || selectedSendNeeds.length === 0) {
      toast.error("Please fill in all fields and select at least one SEND need.");
      return;
    }
    if (name.length > 4) {
      toast.error("Initials must be 4 characters or fewer (e.g. A.J. or Alex).");
      return;
    }
    const primarySendNeed = selectedSendNeeds[0];
    const child = await addChild({ name, yearGroup, sendNeed: primarySendNeed, sendNeeds: selectedSendNeeds });
    toast.success(`${name} added! Code: ${child.code}`);
    setName(""); setYearGroup(""); setSendNeed(""); setSelectedSendNeeds([]); setShowAdd(false);
  };

  const handleUpdate = () => {
    if (!editChild) return;
    const sendNeedsToSave = editChild.sendNeeds && editChild.sendNeeds.length > 0
      ? editChild.sendNeeds
      : editChild.sendNeed ? [editChild.sendNeed] : [];
    updateChild(editChild.id, { name: editChild.name, yearGroup: editChild.yearGroup, sendNeed: sendNeedsToSave[0] || "", sendNeeds: sendNeedsToSave, timetable: editChild.timetable, parentEmail: editChild.parentEmail, parentName: editChild.parentName });
    toast.success("Child updated!");
    setEditChild(null);
  };

  const handleRemove = (child: Child) => {
    if (confirm(`Remove ${child.name}? This cannot be undone.`)) {
      removeChild(child.id);
      if (selectedChild?.id === child.id) setSelectedChild(null);
      toast.success(`${child.name} removed.`);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-4 h-4 text-brand" />;
    if (status === "marked-pending-review") return <AlertCircle className="w-4 h-4 text-indigo-600" />;
    if (status === "submitted") return <Clock className="w-4 h-4 text-amber-500" />;
    if (status === "started") return <Clock className="w-4 h-4 text-amber-500" />;
    return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  };

  const statusLabel = (status: string) => {
    if (status === "completed") return "Completed";
    if (status === "marked-pending-review") return "Mark ready for teacher review";
    if (status === "submitted") return "Submitted for marking";
    if (status === "started") return "In Progress";
    return "Not Started";
  };

  const openAssignmentDetail = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setProgressValue(assignment.progress ?? 0);
    setTeacherComment(assignment.teacherComment ?? "");
    setSchedulerOverrideScore(assignment.mark !== undefined && assignment.mark !== null ? String(assignment.mark) : "");
  };

  const refreshAfterSchedulerReview = async () => {
    await refreshData();
    setSelectedAssignment(null);
  };

  const acceptSchedulerMark = async () => {
    if (!selectedAssignment || !selectedChild || selectedAssignment.status !== "marked-pending-review") return;
    const score = selectedAssignment.mark ?? "the proposed";
    if (!window.confirm(`Accept ${score}% as the final scheduler mark? This will apply the work-plan mastery rule and may advance the next curriculum step.`)) return;
    setSchedulerReviewLoading(true);
    try {
      await schedulerApi.acceptMark(selectedAssignment.id);
      await refreshAfterSchedulerReview();
      toast.success("Scheduler mark accepted. The pupil work plan has been updated from your review decision.");
    } catch (error) {
      console.error("[scheduler] accept mark failed", error);
      toast.error("The scheduler mark could not be accepted. No progression decision was changed.");
    } finally {
      setSchedulerReviewLoading(false);
    }
  };

  const overrideSchedulerMark = async () => {
    if (!selectedAssignment || !selectedChild || selectedAssignment.status !== "marked-pending-review") return;
    const score = Number(schedulerOverrideScore);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      toast.error("Enter a whole-number final mark from 0 to 100.");
      return;
    }
    if (!window.confirm(`Set ${score}% as the final scheduler mark? This will apply the work-plan mastery rule and may advance or reinforce the next step.`)) return;
    setSchedulerReviewLoading(true);
    try {
      await schedulerApi.overrideMark(selectedAssignment.id, score, teacherComment.trim() || undefined);
      await refreshAfterSchedulerReview();
      toast.success("Teacher mark recorded. The pupil work plan has been updated from your review decision.");
    } catch (error) {
      console.error("[scheduler] override mark failed", error);
      toast.error("The teacher mark could not be saved. No progression decision was changed.");
    } finally {
      setSchedulerReviewLoading(false);
    }
  };

  const saveAssignmentProgress = () => {
    if (!selectedChild || !selectedAssignment) return;
    const newStatus = progressValue >= 100 ? "completed" : progressValue > 0 ? "started" : "not-started";
    updateAssignment(selectedChild.id, selectedAssignment.id, {
      progress: progressValue,
      status: newStatus,
      teacherComment,
    });
    // Refresh selected child
    setSelectedChild(prev => prev ? {
      ...prev,
      assignments: prev.assignments.map(a => a.id === selectedAssignment.id
        ? { ...a, progress: progressValue, status: newStatus, teacherComment }
        : a)
    } : null);
    toast.success("Progress saved!");
    setSelectedAssignment(null);
  };

  const openSubmissionFeedback = (submission: Submission) => {
    setSelectedSubmission(submission);
    setFeedbackText(submission.feedback ?? "");
    setMarkText(submission.mark ?? "");
  };

  const handleAutoMark = async () => {
    if (!selectedSubmission) return;
    setAutoMarkLoading(true);
    setAutoMarkResult(null);
    try {
      const content = selectedSubmission.content || "";
      const title = selectedSubmission.title || "worksheet";
      const childYearGroup = selectedChild?.yearGroup || "Year 7";
      const systemPrompt = `You are an expert UK school teacher marking student homework. You mark work fairly, identify misconceptions, and provide constructive feedback. Always respond with valid JSON only.`;
      const userPrompt = `Mark this student's submitted work for the assignment: "${title}" (${childYearGroup}).

Student's submitted work:
${content}

Return EXACTLY this JSON:
{
  "mark": "[e.g. 7/10 or 85% or B+]",
  "feedback": "[2-3 sentences of constructive, encouraging feedback highlighting what was done well and what to improve]",
  "misconceptions": ["[specific misconception 1 if any]", "[specific misconception 2 if any]"]
}

If the submission is empty or too short to mark, return mark: "N/A", feedback: "No work submitted to mark.", misconceptions: []`;
          const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: userPrompt, systemPrompt, maxTokens: 800 }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      const text = (data.content || data.text || "").replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = parseWithFixes(text);
      setAutoMarkResult(parsed);
      setMarkText(parsed.mark || "");
      setFeedbackText(parsed.feedback || "");
      toast.success("Auto-marked by AI!");
    } catch (err) {
      toast.error("Auto-marking failed. Please mark manually.");
    }
    setAutoMarkLoading(false);
  };

  const saveSubmissionFeedback = () => {
    if (!selectedChild || !selectedSubmission) return;
    updateSubmission(selectedChild.id, selectedSubmission.id, {
      feedback: feedbackText,
      mark: markText,
    });
    setSelectedChild(prev => prev ? {
      ...prev,
      submissions: prev.submissions.map(s => s.id === selectedSubmission.id
        ? { ...s, feedback: feedbackText, mark: markText }
        : s)
    } : null);
    toast.success("Feedback sent!");
    setSelectedSubmission(null);
  };

  // ── Topic Card Modal helpers ──────────────────────────────────────────────
  const topicCardModal = (() => {
    if (!selectedTopicCard || !selectedChild) return null;
    const progressions = getProgressionsForSubject(selectedTopicCard.subject);
    const prog = progressions[selectedTopicCard.topicIdx];
    if (!prog) return null;
    const cfg = scheduler.getConfig(selectedChild.id);
    const currentTopicIdx = cfg.progressionTopicIndex ?? 0;
    const currentStepIdx = cfg.progressionStepIndex ?? 0;
    const isCurrentTopic = selectedTopicCard.topicIdx === currentTopicIdx;
    const isCompletedTopic = selectedTopicCard.topicIdx < currentTopicIdx;

    // Match assignments to steps by title pattern
    const stepScores: Record<string, number | null> = {};
    prog.steps.forEach((step, si) => {
      const stepPattern = `Step ${si + 1}`;
      const topicPattern = prog.topicName.toLowerCase().substring(0, 10);
      const matched = selectedChild.assignments
        .filter(a => a.status !== 'not-started' && a.progress != null &&
          (a.title.toLowerCase().includes(topicPattern) || a.title.includes(stepPattern)))
        .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
      stepScores[step.id] = matched.length > 0 ? (matched[0].progress ?? null) : null;
    });

    const handleAdvance = () => {
      const progressions2 = getProgressionsForSubject(selectedTopicCard.subject);
      const currentProg = progressions2[currentTopicIdx];
      if (!currentProg) return;
      const nextStepIdx = currentStepIdx + 1;
      if (nextStepIdx >= currentProg.steps.length) {
        const nextTopicIdx = (currentTopicIdx + 1) % progressions2.length;
        scheduler.updateSettings(selectedChild.id, { progressionTopicIndex: nextTopicIdx, progressionStepIndex: 0 } as any);
        toast.success(`Advanced to topic: ${progressions2[nextTopicIdx]?.topicName}`);
      } else {
        scheduler.updateSettings(selectedChild.id, { progressionStepIndex: nextStepIdx } as any);
        toast.success(`Advanced to step ${nextStepIdx + 1}: ${currentProg.steps[nextStepIdx]?.title}`);
      }
      setSelectedTopicCard(null);
    };

    return (
      <Dialog open={!!selectedTopicCard} onOpenChange={() => setSelectedTopicCard(null)}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCompletedTopic ? 'bg-green-500' : isCurrentTopic ? 'bg-indigo-600' : 'bg-amber-400'
              }`}>
                {isCompletedTopic
                  ? <CheckCircle className="h-3 w-3 text-white" />
                  : <span className="text-[8px] text-white font-bold">{selectedTopicCard.topicIdx + 1}</span>
                }
              </div>
              <span>{prog.topicName}</span>
              {isCompletedTopic && <span className="text-[10px] text-green-600 font-normal ml-1">Completed</span>}
              {isCurrentTopic && <span className="text-[10px] text-indigo-600 font-normal ml-1">In Progress</span>}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mt-1">
            <p className="text-[11px] text-muted-foreground">Full skill ladder — {prog.steps.length} steps</p>

            {prog.steps.map((step, si) => {
              const isStepDone = isCompletedTopic || (isCurrentTopic && si < currentStepIdx);
              const isStepCurrent = isCurrentTopic && si === currentStepIdx;
              const score = stepScores[step.id];
              return (
                <div key={step.id} className={`rounded-lg border p-2.5 space-y-1 ${
                  isStepDone ? 'bg-green-50 border-green-200' :
                  isStepCurrent ? 'bg-indigo-50 border-indigo-300 shadow-sm' :
                  'bg-muted/30 border-border/40 opacity-60'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold ${
                      isStepDone ? 'bg-green-500 text-white' :
                      isStepCurrent ? 'bg-indigo-600 text-white' :
                      'bg-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {isStepDone ? <CheckCircle className="h-3 w-3" /> : si + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-tight ${
                        isStepDone ? 'text-green-800' : isStepCurrent ? 'text-indigo-800' : 'text-muted-foreground'
                      }`}>{step.title}</p>
                    </div>
                    {score != null && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        score >= 70 ? 'bg-green-100 text-green-700' :
                        score >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>{score}%</span>
                    )}
                    {score == null && (isStepDone || isStepCurrent) && (
                      <span className="text-[10px] text-muted-foreground px-1.5">No score</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-7 leading-relaxed">{step.description}</p>
                  {step.keyVocabulary && step.keyVocabulary.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-7">
                      {step.keyVocabulary.map(v => (
                        <span key={v} className="text-[9px] bg-white/80 border border-border/50 rounded px-1 py-0.5 text-muted-foreground">{v}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Advance button — only shown when viewing the current topic */}
          {isCurrentTopic && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Currently on step {currentStepIdx + 1} of {prog.steps.length}: <strong>{prog.steps[currentStepIdx]?.title}</strong>
              </p>
              <Button
                size="sm"
                className="w-full text-xs h-8"
                onClick={handleAdvance}
              >
                <ChevronRight className="h-3.5 w-3.5 mr-1" />
                {currentStepIdx + 1 < prog.steps.length
                  ? `Advance to Step ${currentStepIdx + 2}: ${prog.steps[currentStepIdx + 1]?.title}`
                  : `Complete Topic — Move to ${progressions[selectedTopicCard.topicIdx + 1]?.topicName ?? 'Next Topic'}`
                }
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  })();

  return (
    <TeacherWorkspace className="space-y-4">
      {topicCardModal}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
        <TeacherPageHeader
          eyebrow="Pupil workspace"
          title={selectedChild ? `${selectedChild.name} · pupil review` : "Pupils, support and progress"}
          description={selectedChild
            ? "Review assigned work, current support and teacher-approved next steps without changing the learner-facing task."
            : "Manage SEND-aware pupil profiles, review scheduled work and move from a learner signal to a teacher decision."}
          icon={Users}
          meta={<span className="rounded-full border border-brand/20 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-brand">{children.length} pupil profile{children.length === 1 ? "" : "s"}</span>}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowSencoReport(s => !s)} className={showSencoReport ? "border-brand bg-brand-light text-brand" : "bg-white/75"}>
                <Users className="mr-1 h-4 w-4" /> SENCO report
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCsvDialog(true)} className="bg-white/75">
                <Upload className="mr-1 h-4 w-4" /> Import
              </Button>
              <Button size="sm" onClick={() => setShowAdd(true)} className="bg-brand text-white hover:bg-brand/90">
                <Plus className="mr-1 h-4 w-4" /> Add pupil
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* SENCO Cross-Class Report */}
      {showSencoReport && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {!sencoReport && !sencoReportLoading && (
            <div className="text-center py-4">
              <button
                onClick={loadSencoReport}
                className="px-4 py-2 bg-brand text-white text-sm rounded-lg hover:bg-brand/90 transition-colors"
              >
                Load SENCO Report
              </button>
            </div>
          )}
          {sencoReportLoading && (
            <div className="text-center py-4 text-sm text-muted-foreground">Loading report…</div>
          )}
          {sencoReport && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  School-wide SEND Overview — {sencoReport.totalSendPupils} pupils
                </p>
                <button onClick={() => setSencoReport(null)} className="text-xs text-muted-foreground hover:text-foreground">Refresh</button>
              </div>
              {/* Need summary */}
              <div className="flex flex-wrap gap-2">
                {sencoReport.needCounts.map((n: any) => (
                  <span key={n.need} className="text-xs px-2 py-1 rounded-full bg-brand-light text-brand font-medium">
                    {n.need} ({n.count})
                  </span>
                ))}
              </div>
              {/* Grouped pupil list */}
              {Object.entries(sencoReport.grouped as Record<string, any[]>).map(([need, pupils]) => (
                <div key={need} className="rounded-xl border border-border/50 overflow-hidden">
                  <div className="px-3 py-2 bg-muted/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{need}</span>
                    <span className="text-xs text-muted-foreground">{(pupils as any[]).length} pupil{(pupils as any[]).length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="divide-y divide-border/30">
                    {(pupils as any[]).map((p: any) => (
                      <div key={p.id} className="px-3 py-2 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-foreground">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">{p.yearGroup}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-[10px] text-muted-foreground">{p.completedAssignments}/{p.totalAssignments} done</span>
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-brand rounded-full" style={{ width: `${p.avgProgress}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* CSV Import Dialog */}
      <Dialog open={showCsvDialog} onOpenChange={setShowCsvDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-brand" /> Import Pupils from CSV</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">Upload a CSV file exported from Bromcom, Arbor, or any MIS. The file should have a header row with columns like <strong>Name</strong>, <strong>Year Group</strong>, <strong>SEN Status</strong>, and optionally <strong>UPN</strong> and <strong>Date of Birth</strong>.</p>
            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">Click to select a CSV file</p>
              <p className="text-xs text-muted-foreground mb-3">Supports Bromcom, Arbor, and standard CSV exports</p>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvImport(f); }}
              />
              <Button size="sm" variant="outline" onClick={() => csvInputRef.current?.click()} disabled={csvImporting}>
                {csvImporting ? <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Importing...</> : "Choose File"}
              </Button>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Expected column names (any of these will be recognised):</p>
              <p>Name, Preferred Name, Legal Name</p>
              <p>Year Group, Year, year_group</p>
              <p>SEN Status, SEND Need, SEN Need, send_need</p>
              <p>UPN, Unique Pupil Number</p>
              <p>DOB, Date of Birth, DateOfBirth</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Pupil Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-brand" /> Add New Pupil</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Data Protection Notice */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed space-y-1">
                <p><strong>Data Protection Notice (GDPR/DPA 2018)</strong></p>
                <p>To protect pupil privacy, <strong>only enter initials</strong> (maximum 4 characters, e.g. "A.J." or "Alex"). Do not enter full names, dates of birth, addresses, or any other personally identifiable information.</p>
                <p>All data is stored locally on this device only and is never transmitted to any server. No pupil data is shared with third parties.</p>
                <p className="text-amber-700 font-medium">By adding a child, you confirm you have appropriate consent under your school's data protection policy.</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">First Name or Initials *</Label>
              <Input value={name} onChange={e => { if (e.target.value.length <= 4) setName(e.target.value); }} placeholder="e.g. A.J. or Alex" className="h-10" maxLength={4} />
              <p className="text-[10px] text-muted-foreground">Initials only — maximum 4 characters (e.g. A.J., Alex, S.T.)</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Year Group *</Label>
              <Select value={yearGroup} onValueChange={setYearGroup}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>{yearGroups.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">SEND Needs * <span className="font-normal text-muted-foreground">(select all that apply)</span></Label>
              <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                {sendNeeds.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => toggleSendNeed(n.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${
                      selectedSendNeeds.includes(n.id)
                        ? 'bg-brand/10 text-brand border border-brand/30'
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                      selectedSendNeeds.includes(n.id) ? 'bg-brand border-brand' : 'border-border'
                    }`}>
                      {selectedSendNeeds.includes(n.id) && <span className="text-white text-[10px]">✓</span>}
                    </span>
                    <span className="flex-1">{n.name}</span>
                    <span className="text-[10px] text-muted-foreground">{n.category}</span>
                  </button>
                ))}
              </div>
              {selectedSendNeeds.length > 0 && (
                <p className="text-[10px] text-brand">{selectedSendNeeds.length} selected: {selectedSendNeeds.map(id => sendNeeds.find(n => n.id === id)?.name).filter(Boolean).join(', ')}</p>
              )}
            </div>
            <Button onClick={handleAdd} className="w-full h-10 bg-brand hover:bg-brand/90 text-white">Add Pupil</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Child Dialog */}
      <Dialog open={!!editChild} onOpenChange={() => setEditChild(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit {editChild?.name}</DialogTitle></DialogHeader>
          {editChild && (
            <Tabs defaultValue="details">
              <TabsList className="w-full grid grid-cols-2 mb-3">
                <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
                <TabsTrigger value="timetable" className="text-xs"><Calendar className="h-3 w-3 mr-1" />Timetable</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Initials Only (max 4 characters) *</Label>
                    <Input value={editChild.name} onChange={e => { if (e.target.value.length <= 4) setEditChild({ ...editChild, name: e.target.value }); }} className="h-10" maxLength={4} placeholder="e.g. A.J." />
                    <p className="text-[10px] text-muted-foreground">Initials only — do not enter full names (GDPR)</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Year Group</Label>
                    <Select value={editChild.yearGroup} onValueChange={v => setEditChild({ ...editChild, yearGroup: v })}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>{yearGroups.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">SEND Needs <span className="font-normal text-muted-foreground">(select all that apply)</span></Label>
                    <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                      {sendNeeds.map(n => {
                        const currentNeeds = editChild.sendNeeds && editChild.sendNeeds.length > 0
                          ? editChild.sendNeeds
                          : editChild.sendNeed ? [editChild.sendNeed] : [];
                        const isSelected = currentNeeds.includes(n.id);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              const current = editChild.sendNeeds && editChild.sendNeeds.length > 0
                                ? editChild.sendNeeds
                                : editChild.sendNeed ? [editChild.sendNeed] : [];
                              const updated = isSelected ? current.filter(x => x !== n.id) : [...current, n.id];
                              setEditChild({ ...editChild, sendNeeds: updated, sendNeed: updated[0] || "" });
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${
                              isSelected ? 'bg-brand/10 text-brand border border-brand/30' : 'hover:bg-muted/50 border border-transparent'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                              isSelected ? 'bg-brand border-brand' : 'border-border'
                            }`}>
                              {isSelected && <span className="text-white text-[10px]">✓</span>}
                            </span>
                            <span className="flex-1">{n.name}</span>
                            <span className="text-[10px] text-muted-foreground">{n.category}</span>
                          </button>
                        );
                      })}
                    </div>
                    {(() => {
                      const currentNeeds = editChild.sendNeeds && editChild.sendNeeds.length > 0
                        ? editChild.sendNeeds
                        : editChild.sendNeed ? [editChild.sendNeed] : [];
                      return currentNeeds.length > 0 ? (
                        <p className="text-[10px] text-brand">{currentNeeds.length} selected: {currentNeeds.map(id => sendNeeds.find(n => n.id === id)?.name).filter(Boolean).join(', ')}</p>
                      ) : null;
                    })()}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Parent / Guardian Name</Label>
                    <Input value={editChild.parentName || ""} onChange={e => setEditChild({ ...editChild, parentName: e.target.value })} className="h-10" placeholder="e.g. Mr. Smith" />
                    <p className="text-[10px] text-muted-foreground">Optional — used in behaviour alert emails</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Parent / Guardian Email</Label>
                    <Input type="email" value={editChild.parentEmail || ""} onChange={e => setEditChild({ ...editChild, parentEmail: e.target.value })} className="h-10" placeholder="parent@example.com" />
                    <p className="text-[10px] text-muted-foreground">If set, parent receives an email when a behaviour incident is logged</p>
                  </div>
                  <Button onClick={handleUpdate} className="w-full h-10 bg-brand hover:bg-brand/90 text-white">Save Changes</Button>
                </div>
              </TabsContent>

              <TabsContent value="timetable">
                {(() => {
                  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                  const periods = [1, 2, 3, 4, 5, 6];
                  const subjects = ["Maths", "English", "Science", "History", "Geography", "Art", "PE", "Music", "Computing", "RE", "PSHE", "French", "Spanish", "Drama", "Free"];
                  const timetable: TimetableLesson[] = editChild.timetable || [];
                  const getLesson = (day: string, period: number) =>
                    timetable.find(l => l.day === day && l.period === period);
                  const setLesson = (day: string, period: number, subject: string) => {
                    const filtered = timetable.filter(l => !(l.day === day && l.period === period));
                    const updated = subject === "" ? filtered : [...filtered, { day, period, subject }];
                    setEditChild({ ...editChild, timetable: updated });
                  };
                  return (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">Click a cell to set the subject for that period.</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse min-w-[400px]">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-1.5 text-left border border-border/50 w-12">P</th>
                              {days.map(d => <th key={d} className="p-1.5 text-center border border-border/50">{d.slice(0,3)}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {periods.map(p => (
                              <tr key={p}>
                                <td className="p-1.5 text-center font-bold border border-border/50 bg-muted/50">{p}</td>
                                {days.map(d => {
                                  const lesson = getLesson(d, p);
                                  return (
                                    <td key={d} className="p-0.5 border border-border/30">
                                      <Select value={lesson?.subject || ""} onValueChange={v => setLesson(d, p, v)}>
                                        <SelectTrigger className="h-7 text-[10px] border-0 bg-transparent focus:ring-0 px-1">
                                          <SelectValue placeholder="—" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="">— Empty —</SelectItem>
                                          {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                      </Select>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setEditChild({ ...editChild, timetable: [] })}>
                          <X className="h-3 w-3 mr-1" />Clear All
                        </Button>
                        <Button size="sm" className="flex-1 text-xs bg-brand hover:bg-brand/90 text-white" onClick={handleUpdate}>
                          <Calendar className="h-3 w-3 mr-1" />Save Timetable
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Detail Dialog */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className={selectedAssignment?.type === 'send-screener' ? 'max-w-2xl max-h-[90vh] overflow-y-auto' : selectedAssignment?.sections?.length ? 'max-w-4xl max-h-[90vh] overflow-y-auto' : 'max-w-lg'}>
          {selectedAssignment?.type !== 'send-screener' && !selectedAssignment?.sections?.length && (
            <DialogHeader><DialogTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-brand" /> Assignment Progress</DialogTitle></DialogHeader>
          )}
          {selectedAssignment?.type === 'send-screener' && (
            <DialogHeader><DialogTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-brand" /> SEND Screener Results</DialogTitle></DialogHeader>
          )}
          {selectedAssignment && (
            <div className="space-y-4 mt-2">
              <div>
                <h4 className="font-semibold text-foreground">{selectedAssignment.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Assigned: {new Date(selectedAssignment.assignedAt).toLocaleDateString()} · Status: {statusLabel(selectedAssignment.status)}
                </p>
              </div>

              {/* SEND Screener: show full rich results */}
              {selectedAssignment.type === 'send-screener' && selectedAssignment.content ? (
                <SendScreenerResultsView
                  content={selectedAssignment.content}
                  title={selectedAssignment.title}
                />
              ) : selectedAssignment.status === "marked-pending-review" && selectedAssignment.source === "scheduler" ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-indigo-950">Teacher review required before progression</p>
                        <p className="mt-1 text-xs leading-relaxed text-indigo-800">The suggested mark is <span className="font-bold">{selectedAssignment.mark ?? "not available"}%</span>. Accept it or set a final mark below; the work plan will then advance or reinforce the current step according to its saved mastery threshold.</p>
                      </div>
                    </div>
                  </div>
                  {selectedAssignment.feedback && (
                    <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Suggested feedback</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-foreground">{selectedAssignment.feedback}</p>
                    </div>
                  )}
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Final mark (0–100)</Label>
                      <Input type="number" min="0" max="100" step="1" value={schedulerOverrideScore} onChange={event => setSchedulerOverrideScore(event.target.value)} className="h-10 text-sm" />
                    </div>
                    <Button variant="outline" disabled={schedulerReviewLoading} onClick={() => void overrideSchedulerMark()} className="h-10 border-indigo-300 text-xs text-indigo-800 hover:bg-indigo-50">Record teacher mark</Button>
                  </div>
                  <Button disabled={schedulerReviewLoading || selectedAssignment.mark === undefined || selectedAssignment.mark === null} onClick={() => void acceptSchedulerMark()} className="h-10 w-full bg-indigo-600 text-xs text-white hover:bg-indigo-700">
                    {schedulerReviewLoading ? <><RotateCcw className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving review…</> : <><CheckCircle className="mr-1.5 h-3.5 w-3.5" />Accept suggested mark</>}
                  </Button>
                  {(selectedAssignment.sections?.length || selectedAssignment.content) && (
                    <Button variant="outline" size="sm" className="w-full gap-2 border-brand/30 text-brand hover:bg-brand-light" onClick={() => { setViewAssignment(selectedAssignment); setSelectedAssignment(null); }}>
                      <Eye className="w-4 h-4" /> View pupil-safe worksheet
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Progress Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Completion Progress</Label>
                      <span className="text-sm font-bold text-brand">{progressValue}%</span>
                    </div>
                    <Slider
                      value={[progressValue]}
                      onValueChange={([v]) => setProgressValue(v)}
                      min={0} max={100} step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Not Started</span>
                      <span>In Progress</span>
                      <span>Completed</span>
                    </div>
                    {/* Progress bar visual */}
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-300"
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>
                  </div>

                  {/* Teacher Comment */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-brand" /> Teacher Comment
                    </Label>
                    <Textarea
                      value={teacherComment}
                      onChange={e => setTeacherComment(e.target.value)}
                      placeholder="Add a comment for this student's progress..."
                      className="min-h-[80px] text-sm"
                    />
                  </div>

                  {/* Eye button to open full worksheet view */}
                  {(selectedAssignment.sections?.length || selectedAssignment.content) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 border-brand/30 text-brand hover:bg-brand-light"
                      onClick={() => { setViewAssignment(selectedAssignment); setSelectedAssignment(null); }}
                    >
                      <Eye className="w-4 h-4" /> View pupil-safe worksheet
                    </Button>
                  )}
                </>
              )}

              <div className="flex gap-2">
                {selectedAssignment.type !== 'send-screener' && selectedAssignment.status !== 'marked-pending-review' && (
                  <Button onClick={saveAssignmentProgress} className="flex-1 bg-brand hover:bg-brand/90 text-white">
                    <Send className="w-4 h-4 mr-1.5" /> Save Progress
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedAssignment(null)} className={selectedAssignment.type === 'send-screener' || selectedAssignment.status === 'marked-pending-review' ? 'w-full' : ''}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View-only Worksheet Modal (eye icon) */}
      <Dialog open={!!viewAssignment} onOpenChange={open => { if (!open) setViewAssignment(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8">
              <Eye className="w-5 h-5 text-brand" />
              {viewAssignment?.title}
            </DialogTitle>
          </DialogHeader>
          {viewAssignment && (
            <div className="mt-2">
              <WorksheetRenderer
                worksheet={{
                  title: viewAssignment.title,
                  subtitle: (viewAssignment as any).subtitle,
                  sections: (() => {
                    const raw = viewAssignment.sections;
                    if (raw && (Array.isArray(raw) ? raw.length > 0 : true)) {
                      const arr = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : raw;
                      return (arr as any[]).filter((s: any) => !s.teacherOnly);
                    }
                    return [{ title: 'Content', type: 'guided', content: viewAssignment.content || '', teacherOnly: false }];
                  })(),
                  metadata: {
                    ...((viewAssignment as any).metadata || {}),
                    sendNeedId: (viewAssignment as any).metadata?.sendNeed || undefined,
                  },
                  isAI: true,
                }}
                viewMode="student"
                textSize={14}
                editMode={false}
                overlayColor={viewedAssignmentOverlay.color}
                editedSections={{}}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Submission Feedback Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-brand" /> Review Submission</DialogTitle></DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 mt-2">
              <div>
                <h4 className="font-semibold text-foreground">{selectedSubmission.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Submitted: {new Date(selectedSubmission.submittedAt).toLocaleDateString()}</p>
              </div>

              {/* Submitted content */}
              {selectedSubmission.content && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Submitted Work:</p>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{selectedSubmission.content}</p>
                </div>
              )}

              {/* Uploaded file preview */}
              {selectedSubmission.fileDataUrl && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Uploaded File: {selectedSubmission.fileName}</p>
                  {selectedSubmission.fileType?.startsWith("image/") ? (
                    <img src={selectedSubmission.fileDataUrl} alt="Submitted work" className="max-w-full rounded-lg border border-border/50" />
                  ) : (
                    <a href={selectedSubmission.fileDataUrl} download={selectedSubmission.fileName}
                      className="text-xs text-brand hover:underline flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Download {selectedSubmission.fileName}
                    </a>
                  )}
                </div>
              )}

              {/* Parent question */}
              {selectedSubmission.question && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-1">Parent Question:</p>
                  <p className="text-sm text-blue-800">{selectedSubmission.question}</p>
                </div>
              )}

              {/* Auto-Mark with AI */}
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5"><BrainCircuit className="w-3.5 h-3.5" /> Auto-Mark with AI</p>
                    <p className="text-xs text-indigo-600 mt-0.5">AI will mark the work, suggest a grade, and identify misconceptions.</p>
                  </div>
                  <Button size="sm" disabled={autoMarkLoading || !selectedSubmission?.content} onClick={handleAutoMark}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs shrink-0">
                    {autoMarkLoading ? <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Marking...</> : <><BrainCircuit className="w-3 h-3 mr-1" /> Auto-Mark</>}
                  </Button>
                </div>
                {autoMarkResult && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs font-semibold text-green-700">AI Mark: {autoMarkResult.mark}</span>
                    </div>
                    {autoMarkResult.misconceptions && autoMarkResult.misconceptions.filter(Boolean).length > 0 && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                        <p className="text-xs font-semibold text-amber-800 mb-1">⚠️ Misconceptions identified:</p>
                        <ul className="space-y-0.5">
                          {autoMarkResult.misconceptions.filter(Boolean).map((m, i) => (
                            <li key={i} className="text-xs text-amber-700 flex items-start gap-1"><span className="mt-0.5">•</span>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-xs text-indigo-700">Mark and feedback fields have been pre-filled — edit as needed before sending.</p>
                  </div>
                )}
              </div>

              {/* Mark */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Mark / Grade</Label>
                <Input value={markText} onChange={e => setMarkText(e.target.value)} placeholder="e.g. 8/10, A, Good" className="h-10" />
              </div>

              {/* Feedback */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-brand" /> Feedback to Parent/Student
                </Label>
                <Textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Write feedback that will be visible in the parent portal..."
                  className="min-h-[100px] text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={saveSubmissionFeedback} className="flex-1 bg-brand hover:bg-brand/90 text-white">
                  <Send className="w-4 h-4 mr-1.5" /> Send Feedback
                </Button>
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Children List */}
      {children.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No Pupils Added</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your SEND students to assign worksheets and track progress.</p>
            <Button onClick={() => setShowAdd(true)} className="bg-brand hover:bg-brand/90 text-white">
              <Plus className="w-4 h-4 mr-1" /> Add First Pupil
            </Button>
          </CardContent>
        </Card>
      ) : !selectedChild ? (
        <div className="space-y-2">
          {children.length > 2 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={pupilSearch}
                onChange={e => setPupilSearch(e.target.value)}
                placeholder="Search pupils by name, SEND need, or notes..."
                className="w-full pl-9 pr-4 h-9 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              {pupilSearch && (
                <button onClick={() => setPupilSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {(() => {
            const q = pupilSearch.toLowerCase().trim();
            const filtered = q
              ? children.filter(c => {
                  const needs = (c.sendNeeds || [c.sendNeed]).filter(Boolean).map(id => sendNeeds.find(n => n.id === id)?.name || id || "").join(" ").toLowerCase();
                  const notes = (c.notes || "").toLowerCase();
                  return c.name.toLowerCase().includes(q) || needs.includes(q) || notes.includes(q) || (c.yearGroup || "").toLowerCase().includes(q);
                })
              : children;
            if (q && filtered.length === 0) return (
              <p className="text-sm text-muted-foreground text-center py-6">No pupils match "{pupilSearch}"</p>
            );
            return filtered.map((child, i) => {
            const childNeeds = child.sendNeeds && child.sendNeeds.length > 0
              ? child.sendNeeds
              : child.sendNeed ? [child.sendNeed] : [];
            const needName = childNeeds.map(id => sendNeeds.find(n => n.id === id)?.name || id).join(', ') || 'No SEND need';
            const completedCount = child.assignments.filter(a => a.status === "completed").length;
            const totalCount = child.assignments.length;
            return (
              <motion.div key={child.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="border-border/50 hover:border-brand/30 transition-all cursor-pointer" onClick={() => setSelectedChild(child)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-lg">{child.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground">{child.name}</div>
                      <div className="text-xs text-muted-foreground">{child.yearGroup} · {needName}</div>
                      {totalCount > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[80px]">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{completedCount}/{totalCount} done</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={e => { e.stopPropagation(); copyCode(child.code); }}
                        className="px-2 py-1 rounded-md bg-muted text-xs font-mono text-muted-foreground hover:bg-muted/80 flex items-center gap-1">
                        {child.code} <Copy className="w-3 h-3" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setEditChild(child); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleRemove(child); }} className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
            });
          })()}
        </div>
      ) : (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedChild(null)} className="flex items-center gap-1.5">
            <ChevronLeft className="w-4 h-4" /> Back to List
          </Button>

          <Card className="border-border/50">
            <CardContent className="p-4">
              {/* Child Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-xl">{selectedChild.name[0]}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{selectedChild.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedChild.yearGroup} · {(selectedChild.sendNeeds && selectedChild.sendNeeds.length > 0 ? selectedChild.sendNeeds : selectedChild.sendNeed ? [selectedChild.sendNeed] : []).map(id => sendNeeds.find(n => n.id === id)?.name || id).join(', ')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">Access Code:</span>
                    <button onClick={() => copyCode(selectedChild.code)}
                      className="px-2 py-0.5 rounded bg-muted text-xs font-mono text-muted-foreground hover:bg-muted/80 flex items-center gap-1">
                      {selectedChild.code} <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {/* Overall progress */}
                {selectedChild.assignments.length > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-brand">
                      {Math.round(selectedChild.assignments.reduce((sum, a) => sum + (a.progress ?? 0), 0) / selectedChild.assignments.length)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">Overall</div>
                  </div>
                )}
              </div>

              {/* Quick Generate for this pupil */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    const sendParam = (selectedChild.sendNeeds?.[0] || selectedChild.sendNeed) ? `&sendNeed=${encodeURIComponent(selectedChild.sendNeeds?.[0] || selectedChild.sendNeed || "")}` : "";
                    window.location.href = `/worksheets?yearGroup=${encodeURIComponent(selectedChild.yearGroup || "Year 9")}${sendParam}&pupil=${selectedChild.id}`;
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand/90 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> Generate Worksheet
                </button>
                <button
                  onClick={() => {
                    const sendParam = (selectedChild.sendNeeds?.[0] || selectedChild.sendNeed) ? `&sendNeed=${encodeURIComponent(selectedChild.sendNeeds?.[0] || selectedChild.sendNeed || "")}` : "";
                    window.location.href = `/differentiate?yearGroup=${encodeURIComponent(selectedChild.yearGroup || "Year 9")}${sendParam}`;
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Differentiate
                </button>
                <button
                  onClick={() => handleGdprExportPupil(selectedChild.id, selectedChild.name)}
                  title="Export all data held for this pupil (UK GDPR Article 20)"
                  className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg border border-border/60 bg-background text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" /> GDPR
                </button>
              </div>

              <Tabs defaultValue="assignments">
                <TabsList className="w-full grid grid-cols-5 h-9">
                  <TabsTrigger value="assignments" className="text-xs">Assignments ({selectedChild.assignments.length})</TabsTrigger>
                  <TabsTrigger value="submissions" className="text-xs">Submissions ({selectedChild.submissions.length})</TabsTrigger>
                  <TabsTrigger value="scheduler" className="text-xs"><Zap className="h-3 w-3 mr-1" />Scheduler</TabsTrigger>
                  <TabsTrigger value="documents" className="text-xs"><BookMarked className="h-3 w-3 mr-1" />Docs</TabsTrigger>
                  <TabsTrigger value="messages" className="text-xs"><MessageSquare className="h-3 w-3 mr-1" />Messages</TabsTrigger>
                </TabsList>

                <TabsContent value="assignments" className="mt-3 space-y-2">
                  {selectedChild.assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No assignments yet. Generate a worksheet or story and assign it.</p>
                  ) : selectedChild.assignments.map(a => (
                    <div key={a.id} className="p-3 rounded-lg border border-border/50 hover:border-brand/30 transition-all">
                      <div className="flex items-center gap-3" onClick={() => openAssignmentDetail(a)} style={{ cursor: 'pointer' }}>
                        {a.type === "send-screener" ? <span className="text-sm flex-shrink-0">🔍</span> : a.type === "worksheet" ? <FileText className="w-4 h-4 text-brand flex-shrink-0" /> : <BookOpen className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{a.title}</div>
                          <div className="text-xs text-muted-foreground">{new Date(a.assignedAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-brand">{a.progress ?? 0}%</span>
                          {statusIcon(a.status)}
                          {(a.type === 'worksheet' || a.type === 'story') && (a.sections?.length || a.content) && (
                            <button
                              onClick={e => { e.stopPropagation(); setViewAssignment(a); }}
                              className="p-1 rounded hover:bg-brand/10 text-muted-foreground hover:text-brand"
                              title="View worksheet"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); if (confirm('Delete this assignment?')) deleteAssignment(selectedChild.id, a.id); }}
                            className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                            title="Delete assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden" onClick={() => openAssignmentDetail(a)} style={{ cursor: 'pointer' }}>
                        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${a.progress ?? 0}%` }} />
                      </div>
                      {a.teacherComment && (
                        <div className="mt-2 flex items-start gap-1.5">
                          <MessageSquare className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground italic line-clamp-1">{a.teacherComment}</p>
                        </div>
                      )}
                      <p className="text-[10px] text-brand mt-1.5 cursor-pointer" onClick={() => openAssignmentDetail(a)}>Click to update progress →</p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="submissions" className="mt-3 space-y-2">
                  {selectedChild.submissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No submissions yet.</p>
                  ) : selectedChild.submissions.map(s => (
                    <div key={s.id} className="p-3 rounded-lg border border-border/50 hover:border-brand/30 transition-all cursor-pointer"
                      onClick={() => openSubmissionFeedback(s)}>
                      <div className="flex items-start gap-3">
                        <FileText className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{s.title}</div>
                          <div className="text-xs text-muted-foreground">{new Date(s.submittedAt).toLocaleDateString()}</div>
                          {s.fileName && <div className="text-xs text-muted-foreground">File: {s.fileName}</div>}
                          {s.question && (
                            <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Question from parent
                            </div>
                          )}
                          {s.feedback && <div className="text-xs text-brand mt-1">Feedback: {s.feedback}</div>}
                          {s.mark && <div className="text-xs font-semibold mt-0.5">Mark: {s.mark}</div>}
                        </div>
                        {!s.feedback && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Needs review</span>
                        )}
                      </div>
                      <p className="text-[10px] text-brand mt-1.5">Click to review & give feedback →</p>
                    </div>
                  ))}
                </TabsContent>

                {/* ── Server-backed pupil work plan ─────────────────────────────── */}
                <TabsContent value="scheduler" className="mt-3 space-y-3">
                  {(() => {
                    const cfg = scheduler.getConfig(selectedChild.id);
                    const status = scheduler.statusFor(selectedChild.id);
                    const ladder = scheduler.ladders[cfg.subject] || [];
                    const topicIndex = Math.max(0, Math.min(cfg.progressionTopicIndex || 0, Math.max(0, ladder.length - 1)));
                    const currentTopic = ladder[topicIndex];
                    const stepIndex = Math.max(0, Math.min(cfg.progressionStepIndex || 0, Math.max(0, (currentTopic?.steps.length || 1) - 1)));
                    const currentStep = currentTopic?.steps[stepIndex];
                    const isRunning = scheduler.generating[selectedChild.id] || false;
                    const statusCopy = status === "active"
                      ? "Automatic work plan active"
                      : status === "needs-attention" ? "Needs attention" : "Plan paused";
                    const statusClass = status === "active"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : status === "needs-attention" ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-muted/55 border-border/60 text-muted-foreground";

                    return (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-3.5 sm:p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 items-start gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                                <BrainCircuit className="h-4.5 w-4.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-indigo-950">Pupil work plan</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-indigo-700">A server-saved plan for {selectedChild.name}. It keeps its schedule, review state and next step even when this browser closes.</p>
                              </div>
                            </div>
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass}`}>{statusCopy}</span>
                          </div>
                        </div>

                        {cfg.lastError && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-amber-900">The last scheduled run did not finish</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-amber-800">{cfg.lastError}</p>
                                {cfg.retryAfter && <p className="mt-1 text-[11px] font-medium text-amber-900">Automatic retry: {new Date(cfg.retryAfter).toLocaleString("en-GB")}</p>}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-border/60 bg-card p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Current curriculum step</p>
                            {scheduler.loading ? (
                              <p className="mt-2 text-xs text-muted-foreground">Loading the worker’s curriculum plan…</p>
                            ) : currentTopic && currentStep ? (
                              <>
                                <p className="mt-2 text-sm font-semibold text-foreground">{currentTopic.topic}</p>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Step {stepIndex + 1} of {currentTopic.steps.length}: <span className="font-medium text-foreground">{currentStep}</span></p>
                              </>
                            ) : (
                              <p className="mt-2 text-xs text-muted-foreground">Choose a supported subject to load its curriculum progression.</p>
                            )}
                          </div>
                          <div className="rounded-xl border border-border/60 bg-card p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Plan timing</p>
                            <p className="mt-2 text-sm font-semibold text-foreground">{cfg.nextFireAt ? new Date(cfg.nextFireAt).toLocaleString("en-GB") : "No automatic run scheduled"}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {cfg.lastFiredAt ? `Last generated: ${new Date(cfg.lastFiredAt).toLocaleString("en-GB")}` : "No worksheet has been generated from this plan yet."}
                            </p>
                            {cfg.lastWorksheetTitle && <p className="mt-1 truncate text-[11px] font-medium text-indigo-700">Latest: {cfg.lastWorksheetTitle}</p>}
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Subject</Label>
                            <Select value={cfg.subject} onValueChange={subject => void scheduler.updateSettings(selectedChild.id, { subject, progressionTopicIndex: 0, progressionStepIndex: 0 })}>
                              <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{subjects.map(subject => <SelectItem key={subject.id} value={subject.id} className="text-xs">{subject.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Frequency</Label>
                            <Select value={cfg.frequency} onValueChange={frequency => void scheduler.updateSettings(selectedChild.id, { frequency: frequency as "daily" | "weekly" | "biweekly" })}>
                              <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily" className="text-xs">Daily</SelectItem>
                                <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
                                <SelectItem value="biweekly" className="text-xs">Every two weeks</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Starting challenge</Label>
                            <Select value={cfg.difficulty} onValueChange={difficulty => void scheduler.updateSettings(selectedChild.id, { difficulty: difficulty as "foundation" | "mixed" | "higher" })}>
                              <SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="foundation" className="text-xs">Foundation</SelectItem>
                                <SelectItem value="mixed" className="text-xs">Mixed</SelectItem>
                                <SelectItem value="higher" className="text-xs">Higher</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <button type="button" onClick={() => void scheduler.updateSettings(selectedChild.id, { includeRecall: !cfg.includeRecall })} className="flex min-h-12 items-center justify-between rounded-xl border border-border/60 bg-card px-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/35">
                            <span><span className="block text-xs font-semibold">Retrieval starter</span><span className="mt-0.5 block text-[11px] text-muted-foreground">Recall the last plan’s vocabulary.</span></span>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${cfg.includeRecall ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{cfg.includeRecall ? "On" : "Off"}</span>
                          </button>
                          <button type="button" onClick={() => void scheduler.updateSettings(selectedChild.id, { includeAnswers: !cfg.includeAnswers })} className="flex min-h-12 items-center justify-between rounded-xl border border-border/60 bg-card px-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/35">
                            <span><span className="block text-xs font-semibold">Teacher answer key</span><span className="mt-0.5 block text-[11px] text-muted-foreground">Kept separate from the pupil view.</span></span>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${cfg.includeAnswers ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{cfg.includeAnswers ? "On" : "Off"}</span>
                          </button>
                        </div>

                        <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3">
                          <p className="text-xs font-semibold text-purple-900">SEND support is sourced from the pupil profile</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-purple-800">{selectedChild.sendNeeds?.length ? selectedChild.sendNeeds.join(", ") : selectedChild.sendNeed || "No recorded SEND profile"}. {selectedChild.learnerSupportProfile ? `Teacher-reviewed strategies and the ${selectedChild.learnerSupportProfile.scaffoldingLevel.replace(/-/g, " ")} scaffold entry point are passed as access guidance.` : "No additional learner-support preferences are passed."} The worker preserves the current ladder step, intended challenge, marks and accuracy; it never makes progression or provision changes without teacher review.</p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button onClick={() => void scheduler.runNow(selectedChild)} disabled={isRunning} className="h-10 flex-1 bg-indigo-600 text-xs text-white hover:bg-indigo-700">
                            {isRunning ? <><RotateCcw className="mr-1.5 h-3.5 w-3.5 animate-spin" />Generating safely…</> : <><PlayCircle className="mr-1.5 h-3.5 w-3.5" />Generate and assign now</>}
                          </Button>
                          {cfg.enabled ? (
                            <Button variant="outline" onClick={() => void scheduler.disableScheduler(selectedChild.id)} className="h-10 border-amber-300 text-xs text-amber-800 hover:bg-amber-50"><PauseCircle className="mr-1.5 h-3.5 w-3.5" />Pause plan</Button>
                          ) : (
                            <Button variant="outline" onClick={() => void scheduler.enableScheduler(selectedChild.id)} className="h-10 border-indigo-300 text-xs text-indigo-700 hover:bg-indigo-50"><Settings2 className="mr-1.5 h-3.5 w-3.5" />Enable automatic plan</Button>
                          )}
                        </div>
                        <p className="px-1 text-[10px] leading-relaxed text-muted-foreground">Manual generation is always teacher-triggered. Automatic plans create work only after you enable this pupil’s plan; progression is determined after review, not simply because a worksheet was created.</p>
                      </div>
                    );
                  })()}
                </TabsContent>

                <TabsContent value="documents" className="mt-3">
                  <PupilDocumentsPanel
                    pupilId={selectedChild.id}
                    pupilName={selectedChild.name}
                    yearGroup={selectedChild.yearGroup}
                    mode="teacher"
                  />
                </TabsContent>

                <TabsContent value="messages" className="mt-3">
                  <TeacherMessagesPanel childId={selectedChild.id} childName={selectedChild.name} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </TeacherWorkspace>
  );
}
