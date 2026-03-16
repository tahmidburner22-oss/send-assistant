import { useState, useRef } from "react";
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
import SENDInfoPanel from "@/components/SENDInfoPanel";
import { SendScreenerResultsView } from "@/components/SendScreenerResultsView";
import { useScheduler } from "@/hooks/useScheduler";
import { TOPIC_BANK } from "@/lib/topic-bank";
import { CURRICULUM_PROGRESSIONS, getProgressionsForSubject, getRecommendedStep, type TopicProgression } from "@/lib/curriculum-progression";
import { frequencyLabel } from "@/lib/scheduler";
import {
  Plus, UserPlus, Copy, Trash2, Edit3, FileText, BookOpen,
  CheckCircle, Clock, AlertCircle, MessageSquare, TrendingUp,
  ChevronLeft, Shield, Star, Send, Calendar, X, Zap, BrainCircuit,
  PlayCircle, PauseCircle, RotateCcw, Settings2, Upload, RefreshCw, Database,
  ChevronRight, ChevronDown, Layers, Lock
} from "lucide-react";

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

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("send_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Children() {
  const { children, addChild, removeChild, updateChild, updateAssignment, deleteAssignment, updateSubmission, assignWork } = useApp();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [showCsvDialog, setShowCsvDialog] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [name, setName] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [sendNeed, setSendNeed] = useState(""); // kept for single-select compat
  const [selectedSendNeeds, setSelectedSendNeeds] = useState<string[]>([]);

  const toggleSendNeed = (id: string) => {
    setSelectedSendNeeds(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  // Assignment detail state
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [teacherComment, setTeacherComment] = useState("");

  // Submission feedback state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [markText, setMarkText] = useState("");
  const [autoMarkLoading, setAutoMarkLoading] = useState(false);
  const [autoMarkResult, setAutoMarkResult] = useState<{ mark: string; feedback: string; misconceptions: string[] } | null>(null);
  const [progressExpanded, setProgressExpanded] = useState(false);
  // Topic card modal — stores the topic index clicked so we can show the full ladder
  const [selectedTopicCard, setSelectedTopicCard] = useState<{ topicIdx: number; subject: string } | null>(null);
  // SEND need collapsible — one entry per SEND need id, starts closed
  const [sendNeedExpanded, setSendNeedExpanded] = useState<Record<string, boolean>>({});

  // AI Auto-Assignment Scheduler
  const scheduler = useScheduler({
    children,
    assignWork,
    onWorksheetGenerated: (childId, assignment) => {
      // Refresh selectedChild so the new assignment appears in the Assignments tab
      setSelectedChild(prev => {
        if (!prev || prev.id !== childId) return prev;
        return { ...prev, assignments: [...prev.assignments, assignment] };
      });
    },
  });

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
    if (status === "started") return <Clock className="w-4 h-4 text-amber-500" />;
    return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  };

  const statusLabel = (status: string) => {
    if (status === "completed") return "Completed";
    if (status === "started") return "In Progress";
    return "Not Started";
  };

  const openAssignmentDetail = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setProgressValue(assignment.progress ?? 0);
    setTeacherComment(assignment.teacherComment ?? "");
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
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      {topicCardModal}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage your SEND students and their assignments.</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCsvDialog(true)}>
            <Upload className="w-4 h-4 mr-1" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="bg-brand hover:bg-brand/90 text-white">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </motion.div>

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

                  {/* Assignment Content — full 1:1 WorksheetRenderer matching the generated worksheet */}
                  {selectedAssignment.sections && selectedAssignment.sections.length > 0 ? (
                    <div className="border border-border/50 rounded-lg overflow-hidden">
                      <WorksheetRenderer
                        worksheet={{
                          title: selectedAssignment.title,
                          subtitle: (selectedAssignment as any).subtitle,
                          sections: (() => {
                            const raw = selectedAssignment.sections;
                            const arr = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : raw;
                            return (arr as any[]).filter((s: any) => !s.teacherOnly);
                          })(),
                          metadata: {
                            ...((selectedAssignment as any).metadata || {}),
                            sendNeedId: (selectedAssignment as any).metadata?.sendNeed || undefined,
                          },
                          isAI: true,
                        }}
                        viewMode="student"
                        textSize={14}
                        editMode={false}
                        overlayColor="#ffffff"
                        editedSections={{}}
                      />
                    </div>
                  ) : selectedAssignment.content ? (
                    <div className="border border-border/50 rounded-lg overflow-hidden">
                      <WorksheetRenderer
                        worksheet={{
                          title: selectedAssignment.title,
                          subtitle: (selectedAssignment as any).subtitle,
                          sections: [{ title: 'Content', type: 'guided', content: selectedAssignment.content, teacherOnly: false }],
                          metadata: (selectedAssignment as any).metadata || {},
                          isAI: true,
                        }}
                        viewMode="student"
                        textSize={14}
                        editMode={false}
                        overlayColor="#ffffff"
                        editedSections={{}}
                      />
                    </div>
                  ) : null}
                </>
              )}

              <div className="flex gap-2">
                {selectedAssignment.type !== 'send-screener' && (
                  <Button onClick={saveAssignmentProgress} className="flex-1 bg-brand hover:bg-brand/90 text-white">
                    <Send className="w-4 h-4 mr-1.5" /> Save Progress
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedAssignment(null)} className={selectedAssignment.type === 'send-screener' ? 'w-full' : ''}>Close</Button>
              </div>
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
          {children.map((child, i) => {
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
          })}
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

              <Tabs defaultValue="assignments">
                <TabsList className="w-full grid grid-cols-3 h-9">
                  <TabsTrigger value="assignments" className="text-xs">Assignments ({selectedChild.assignments.length})</TabsTrigger>
                  <TabsTrigger value="submissions" className="text-xs">Submissions ({selectedChild.submissions.length})</TabsTrigger>
                  <TabsTrigger value="scheduler" className="text-xs"><Zap className="h-3 w-3 mr-1" />Scheduler</TabsTrigger>
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
                          <button
                            onClick={e => { e.stopPropagation(); if (confirm('Delete this assignment?')) deleteAssignment(selectedChild.id, a.id); }}
                            className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 ml-1"
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

                {/* ── AI Auto-Assignment Scheduler Tab (with integrated Skill Ladder) ── */}
                <TabsContent value="scheduler" className="mt-3 space-y-3">
                  {(() => {
                    const cfg = scheduler.getConfig(selectedChild.id);
                    const isRunning = scheduler.generating[selectedChild.id] || false;
                    const bank = TOPIC_BANK[cfg.subject] || TOPIC_BANK.mathematics;
                    const currentTopicEntry = bank[cfg.topicIndex % bank.length];
                    const prevTopicIdx = cfg.topicIndex === 0 ? null : ((cfg.topicIndex - 1) + bank.length) % bank.length;
                    const prevTopicEntry = prevTopicIdx !== null ? bank[prevTopicIdx] : null;

                    // Progress Chain logic
                    const lastAssignment = selectedChild.assignments.length > 0
                      ? selectedChild.assignments[selectedChild.assignments.length - 1]
                      : null;
                    const lastProgress = lastAssignment?.progress ?? 0;
                    const MASTERY_THRESHOLD = 70;
                    const shouldReinforce = !!(lastAssignment && lastProgress < MASTERY_THRESHOLD && lastAssignment.status !== 'not-started');
                    const recommendedTopicIdx = shouldReinforce
                      ? Math.max(0, cfg.topicIndex - 1)
                      : cfg.topicIndex;
                    const recommendedTopic = bank[recommendedTopicIdx % bank.length];
                    const chainStart = Math.max(0, cfg.topicIndex - 2);
                    const chainTopics = bank.slice(chainStart, Math.min(bank.length, chainStart + 6));

                    // Progression-based chain (Skill Ladder connected to Learning Progress Chain)
                    const progressions = getProgressionsForSubject(cfg.subject);
                    const hasProgressions = progressions.length > 0;
                    const currentProgTopicIdx = (cfg.progressionTopicIndex ?? 0) % (progressions.length || 1);
                    const currentProgStepIdx = cfg.progressionStepIndex ?? 0;
                    const currentProgression = hasProgressions ? progressions[currentProgTopicIdx] : null;
                    const currentStep = currentProgression ? currentProgression.steps[currentProgStepIdx % currentProgression.steps.length] : null;
                    // Show a window of topics around the current one
                    const progChainStart = Math.max(0, currentProgTopicIdx - 1);
                    const progChainTopics = hasProgressions ? progressions.slice(progChainStart, Math.min(progressions.length, progChainStart + 4)) : [];

                    return (
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                          <BrainCircuit className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-indigo-800">AI Auto-Assignment Scheduler</p>
                            <p className="text-xs text-indigo-600 mt-0.5">Automatically generates and assigns SEND-adapted worksheets for {selectedChild.name} on a rotating curriculum. Topics vary each time and include recall questions from the previous sheet.</p>
                          </div>
                        </div>

                        {/* ── Unified Learning Progress Chain + Skill Ladder ── */}
                        <div className="p-3 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 space-y-3">
                          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setProgressExpanded(!progressExpanded)}>
                            <TrendingUp className="h-4 w-4 text-indigo-600" />
                            <p className="text-xs font-semibold text-indigo-900 flex-1">Learning Progress Chain &amp; Skill Ladder</p>
                            <ChevronDown className={`h-4 w-4 text-indigo-600 transition-transform duration-200 ${progressExpanded ? 'rotate-180' : ''}`} />
                          </div>
                          <p className="text-[10px] text-indigo-600">Each topic on the chain has a skill ladder. Auto-generation works through every step before moving to the next topic.</p>

                          {progressExpanded && hasProgressions ? (
                            <div className="space-y-2">
                              {/* Topic chain scroll */}
                              <div className="flex items-start gap-1.5 overflow-x-auto pb-1">
                                {progChainTopics.map((prog, i) => {
                                  const absTopicIdx = progChainStart + i;
                                  const isTopicCompleted = absTopicIdx < currentProgTopicIdx;
                                  const isTopicCurrent = absTopicIdx === currentProgTopicIdx;
                                  const isTopicNext = absTopicIdx === currentProgTopicIdx + 1;
                                  return (
                                    <div key={prog.topicId} className="flex items-start gap-1 flex-shrink-0">
                                      <div
                                        className={`rounded-xl border-2 p-2 min-w-[90px] max-w-[110px] cursor-pointer hover:shadow-md transition-shadow ${
                                        isTopicCompleted ? 'bg-green-50 border-green-300' :
                                        isTopicCurrent ? 'bg-white border-indigo-400 shadow-sm' :
                                        isTopicNext ? 'bg-amber-50 border-amber-200' :
                                        'bg-muted/30 border-border/40'
                                      }`}
                                        onClick={() => setSelectedTopicCard({ topicIdx: absTopicIdx, subject: cfg.subject })}
                                      >
                                        {/* Topic header */}
                                        <div className="flex items-center gap-1 mb-1.5">
                                          <div className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            isTopicCompleted ? 'bg-green-500' :
                                            isTopicCurrent ? 'bg-indigo-600' :
                                            isTopicNext ? 'bg-amber-400' :
                                            'bg-muted-foreground/30'
                                          }`}>
                                            {isTopicCompleted ? (
                                              <CheckCircle className="h-2.5 w-2.5 text-white" />
                                            ) : (
                                              <span className="text-[7px] text-white font-bold">{absTopicIdx + 1}</span>
                                            )}
                                          </div>
                                          <p className={`text-[9px] font-semibold leading-tight ${
                                            isTopicCompleted ? 'text-green-700' :
                                            isTopicCurrent ? 'text-indigo-800' :
                                            isTopicNext ? 'text-amber-700' :
                                            'text-muted-foreground'
                                          }`}>{prog.topicName.substring(0, 18)}</p>
                                        </div>
                                        {/* Skill ladder steps for this topic */}
                                        <div className="space-y-0.5">
                                          {prog.steps.map((step, si) => {
                                            const isStepDone = isTopicCompleted || (isTopicCurrent && si < currentProgStepIdx);
                                            const isStepCurrent = isTopicCurrent && si === currentProgStepIdx;
                                            const isStepLocked = !isTopicCurrent && !isTopicCompleted;
                                            return (
                                              <div key={step.id} className={`flex items-center gap-1 px-1 py-0.5 rounded ${
                                                isStepDone ? 'bg-green-100' :
                                                isStepCurrent ? 'bg-indigo-100 border border-indigo-300' :
                                                isStepLocked ? 'opacity-40' :
                                                'bg-white/60'
                                              }`}>
                                                <div className={`h-3 w-3 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                  isStepDone ? 'bg-green-500' :
                                                  isStepCurrent ? 'bg-indigo-600' :
                                                  'bg-muted-foreground/20'
                                                }`}>
                                                  {isStepDone ? (
                                                    <CheckCircle className="h-2 w-2 text-white" />
                                                  ) : isStepCurrent ? (
                                                    <span className="text-[6px] text-white font-bold">▶</span>
                                                  ) : (
                                                    <span className="text-[6px] text-muted-foreground">{si + 1}</span>
                                                  )}
                                                </div>
                                                <p className={`text-[8px] leading-tight truncate ${
                                                  isStepDone ? 'text-green-700' :
                                                  isStepCurrent ? 'text-indigo-800 font-semibold' :
                                                  'text-muted-foreground'
                                                }`}>{step.title}</p>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        <p className="text-[7px] text-center text-muted-foreground mt-1 opacity-60">tap to expand</p>
                                      </div>
                                      {i < progChainTopics.length - 1 && (
                                        <div className="flex flex-col items-center justify-center h-full pt-4">
                                          <div className={`h-0.5 w-3 ${
                                            isTopicCompleted ? 'bg-green-400' : 'bg-border'
                                          }`} />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                {progChainStart + progChainTopics.length < progressions.length && (
                                  <div className="flex items-center justify-center pt-4 ml-1">
                                    <p className="text-[9px] text-muted-foreground">+{progressions.length - (progChainStart + progChainTopics.length)} more topics</p>
                                  </div>
                                )}
                              </div>

                              {/* Current position indicator */}
                              {currentProgression && currentStep && (
                                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                                  <Layers className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold text-indigo-800">Current Position</p>
                                    <p className="text-[10px] text-indigo-700 mt-0.5">
                                      Topic {currentProgTopicIdx + 1}/{progressions.length}: <strong>{currentProgression.topicName}</strong>
                                    </p>
                                    <p className="text-[10px] text-indigo-600">
                                      Step {currentProgStepIdx + 1}/{currentProgression.steps.length}: <strong>{currentStep.title}</strong>
                                    </p>
                                    <p className="text-[10px] text-indigo-500 mt-0.5 italic">{currentStep.description}</p>
                                  </div>
                                </div>
                              )}

                              {/* Mastery / progress feedback */}
                              {lastAssignment && lastAssignment.status !== 'not-started' ? (
                                <div className={`flex items-start gap-2 p-2.5 rounded-lg ${
                                  shouldReinforce ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'
                                }`}>
                                  {shouldReinforce
                                    ? <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                                    : <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                                  }
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[10px] font-semibold ${
                                      shouldReinforce ? 'text-amber-800' : 'text-green-800'
                                    }`}>
                                      {shouldReinforce
                                        ? `Reinforce recommended — last score ${lastProgress}% (below ${MASTERY_THRESHOLD}% mastery)`
                                        : `Ready to advance — last score ${lastProgress}% ✓`
                                      }
                                    </p>
                                    <p className={`text-[10px] mt-0.5 ${
                                      shouldReinforce ? 'text-amber-700' : 'text-green-700'
                                    }`}>
                                      {shouldReinforce
                                        ? `Recommended: Repeat current step with extra scaffolding`
                                        : currentStep ? `Next: Advance to step ${currentProgStepIdx + 2 <= (currentProgression?.steps.length ?? 0) ? currentProgStepIdx + 2 : 1} of ${currentProgression?.topicName}` : 'All steps complete — move to next topic'
                                      }
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-muted-foreground text-center py-1">
                                  {selectedChild.assignments.length === 0
                                    ? 'No assignments yet — generate the first worksheet to start the progress chain.'
                                    : 'Assignment not yet started — progress will update once the student begins.'}
                                </p>
                              )}
                            </div>
                          ) : progressExpanded ? (
                            /* Fallback: old topic bank chain if no progressions for this subject */
                            <div className="space-y-2">
                              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                                {chainTopics.map((t, i) => {
                                  const absIdx = chainStart + i;
                                  const isCompleted = absIdx < cfg.topicIndex;
                                  const isCurrent = absIdx === cfg.topicIndex;
                                  const isNext = absIdx === cfg.topicIndex + 1;
                                  return (
                                    <div key={absIdx} className="flex items-center gap-1 flex-shrink-0">
                                      <div className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-center min-w-[72px] max-w-[80px] ${
                                        isCompleted ? 'bg-green-100 border border-green-300' :
                                        isCurrent ? 'bg-brand/10 border-2 border-brand' :
                                        isNext ? 'bg-amber-50 border border-amber-200' :
                                        'bg-muted/40 border border-border/40'
                                      }`}>
                                        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${
                                          isCompleted ? 'bg-green-500' :
                                          isCurrent ? 'bg-brand' :
                                          isNext ? 'bg-amber-400' :
                                          'bg-muted-foreground/30'
                                        }`}>
                                          {isCompleted ? (
                                            <CheckCircle className="h-3 w-3 text-white" />
                                          ) : isCurrent ? (
                                            <span className="text-[8px] text-white font-bold">NOW</span>
                                          ) : isNext ? (
                                            <span className="text-[8px] text-white font-bold">NEXT</span>
                                          ) : (
                                            <span className="text-[8px] text-white">{absIdx + 1}</span>
                                          )}
                                        </div>
                                        <p className={`text-[9px] leading-tight mt-0.5 ${
                                          isCompleted ? 'text-green-700' :
                                          isCurrent ? 'text-brand font-semibold' :
                                          isNext ? 'text-amber-700' :
                                          'text-muted-foreground'
                                        }`}>{t.topic.split(' — ')[0].substring(0, 20)}</p>
                                      </div>
                                      {i < chainTopics.length - 1 && (
                                        <div className={`h-0.5 w-3 flex-shrink-0 ${
                                          absIdx < cfg.topicIndex ? 'bg-green-400' : 'bg-border'
                                        }`} />
                                      )}
                                    </div>
                                  );
                                })}
                                {chainStart + chainTopics.length < bank.length && (
                                  <p className="text-[9px] text-muted-foreground ml-1">+{bank.length - (chainStart + chainTopics.length)} more</p>
                                )}
                              </div>
                              {lastAssignment && lastAssignment.status !== 'not-started' ? (
                                <div className={`flex items-start gap-2 p-2.5 rounded-lg ${
                                  shouldReinforce ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'
                                }`}>
                                  {shouldReinforce
                                    ? <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                                    : <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                                  }
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[10px] font-semibold ${
                                      shouldReinforce ? 'text-amber-800' : 'text-green-800'
                                    }`}>
                                      {shouldReinforce
                                        ? `Reinforce recommended — last score ${lastProgress}% (below ${MASTERY_THRESHOLD}% mastery)`
                                        : `Ready to advance — last score ${lastProgress}% ✓`
                                      }
                                    </p>
                                    <p className={`text-[10px] mt-0.5 ${
                                      shouldReinforce ? 'text-amber-700' : 'text-green-700'
                                    }`}>
                                      {shouldReinforce
                                        ? `Recommended next: Repeat "${recommendedTopic.topic}" with extra scaffolding`
                                        : `Recommended next: "${recommendedTopic.topic}"`
                                      }
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-muted-foreground text-center py-1">
                                  {selectedChild.assignments.length === 0
                                    ? 'No assignments yet — generate the first worksheet to start the progress chain.'
                                    : 'Assignment not yet started — progress will update once the student begins.'}
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>

                        {/* Subject */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Subject</Label>
                          <Select
                            value={cfg.subject}
                            onValueChange={v => scheduler.updateSettings(selectedChild.id, { subject: v })}
                          >
                            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {subjects.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Current + next step preview */}
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 space-y-1.5">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Next Generation</p>
                          {hasProgressions && currentProgression && currentStep ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Topic</span>
                                <span className="text-xs font-medium text-foreground">{currentProgression.topicName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Step {currentProgStepIdx + 1}</span>
                                <span className="text-xs text-foreground">{currentStep.title}</span>
                              </div>
                              {cfg.lastWorksheetTitle && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Recall from</span>
                                  <span className="text-xs text-muted-foreground truncate">{cfg.lastWorksheetTitle}</span>
                                </div>
                              )}
                              <p className="text-[10px] text-muted-foreground">{progressions.length} topics × skill ladder steps = full {cfg.subject} progression.</p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Next</span>
                                <span className="text-xs font-medium text-foreground">{currentTopicEntry?.topic}</span>
                              </div>
                              {prevTopicEntry && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Recall from</span>
                                  <span className="text-xs text-muted-foreground">{prevTopicEntry.topic}</span>
                                </div>
                              )}
                              <p className="text-[10px] text-muted-foreground">Topics rotate automatically through the full {cfg.subject} curriculum ({bank.length} topics).</p>
                            </>
                          )}
                        </div>

                        {/* Frequency + Difficulty row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Frequency</Label>
                            <Select
                              value={cfg.frequency}
                              onValueChange={v => scheduler.updateSettings(selectedChild.id, { frequency: v as "daily" | "weekly" | "biweekly" })}
                            >
                              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily" className="text-xs">Daily</SelectItem>
                                <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
                                <SelectItem value="biweekly" className="text-xs">Every 2 Weeks</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Difficulty</Label>
                            <Select
                              value={cfg.difficulty}
                              onValueChange={v => scheduler.updateSettings(selectedChild.id, { difficulty: v as "foundation" | "mixed" | "higher" })}
                            >
                              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="foundation" className="text-xs">Foundation</SelectItem>
                                <SelectItem value="mixed" className="text-xs">Mixed</SelectItem>
                                <SelectItem value="higher" className="text-xs">Higher</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Toggles row */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border/50">
                            <Label className="text-xs font-medium">Include Answer Key</Label>
                            <button
                              onClick={() => scheduler.updateSettings(selectedChild.id, { includeAnswers: !cfg.includeAnswers })}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                cfg.includeAnswers ? "bg-brand" : "bg-muted-foreground/30"
                              }`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                                cfg.includeAnswers ? "translate-x-4.5" : "translate-x-0.5"
                              }`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border/50">
                            <div>
                              <Label className="text-xs font-medium">Include Recall Section</Label>
                              <p className="text-[10px] text-muted-foreground">5 questions from the previous worksheet topic</p>
                            </div>
                            <button
                              onClick={() => scheduler.updateSettings(selectedChild.id, { includeRecall: !cfg.includeRecall })}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                cfg.includeRecall ? "bg-brand" : "bg-muted-foreground/30"
                              }`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                                cfg.includeRecall ? "translate-x-4.5" : "translate-x-0.5"
                              }`} />
                            </button>
                          </div>
                        </div>

                        {/* Last / Next run info */}
                        {cfg.lastFiredAt && (
                          <div className="flex items-center gap-4 p-2.5 rounded-lg bg-green-50 border border-green-200 text-xs">
                            <div>
                              <span className="text-green-700 font-medium">Last generated:</span>
                              <span className="text-green-600 ml-1">{new Date(cfg.lastFiredAt).toLocaleDateString()}</span>
                            </div>
                            {cfg.nextFireAt && (
                              <div>
                                <span className="text-green-700 font-medium">Next due:</span>
                                <span className="text-green-600 ml-1">{new Date(cfg.nextFireAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {cfg.lastWorksheetTitle && (
                          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                            <p className="text-[10px] text-amber-700 font-medium">Last worksheet assigned:</p>
                            <p className="text-xs text-amber-800 mt-0.5">{cfg.lastWorksheetTitle}</p>
                            {cfg.lastKeyVocabulary.length > 0 && (
                              <p className="text-[10px] text-amber-600 mt-1">Recall vocab: {cfg.lastKeyVocabulary.join(", ")}</p>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => scheduler.runNow(selectedChild)}
                            disabled={isRunning}
                            className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                          >
                            {isRunning ? (
                              <><RotateCcw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generating...</>
                            ) : (
                              <><PlayCircle className="h-3.5 w-3.5 mr-1.5" />Generate &amp; Assign Now</>
                            )}
                          </Button>
                          {cfg.enabled ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => scheduler.disableScheduler(selectedChild.id)}
                            >
                              <PauseCircle className="h-3.5 w-3.5 mr-1" />Pause
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                              onClick={() => scheduler.enableScheduler(selectedChild.id)}
                            >
                              <Settings2 className="h-3.5 w-3.5 mr-1" />Enable Auto
                            </Button>
                          )}
                        </div>

                        {/* SEND Info Panels — collapsible, one per SEND need, starts closed */}
                        {(() => {
                          const childNeeds = selectedChild.sendNeeds && selectedChild.sendNeeds.length > 0
                            ? selectedChild.sendNeeds
                            : selectedChild.sendNeed && selectedChild.sendNeed !== 'none' ? [selectedChild.sendNeed] : [];
                          if (childNeeds.length === 0) return null;
                          return (
                            <div className="space-y-2">
                              {childNeeds.map(needId => {
                                const needInfo = sendNeeds.find(n => n.id === needId);
                                if (!needInfo) return null;
                                const isOpen = sendNeedExpanded[needId] ?? false;
                                return (
                                  <div key={needId} className="rounded-xl border border-purple-200 bg-purple-50 overflow-hidden">
                                    {/* Collapsible header */}
                                    <button
                                      type="button"
                                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer select-none"
                                      onClick={() => setSendNeedExpanded(prev => ({ ...prev, [needId]: !isOpen }))}
                                    >
                                      <div className="h-5 w-5 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[9px] font-bold text-purple-700">{needInfo.name.substring(0, 2).toUpperCase()}</span>
                                      </div>
                                      <span className="text-xs font-semibold text-purple-800 flex-1">{needInfo.name}</span>
                                      <span className="text-[10px] text-purple-500 bg-purple-100 px-1.5 py-0.5 rounded mr-1">{needInfo.category}</span>
                                      <ChevronDown className={`h-3.5 w-3.5 text-purple-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {/* Collapsible body */}
                                    {isOpen && (
                                      <div className="px-3 pb-3">
                                        <SENDInfoPanel
                                          sendNeedId={needId}
                                          context="scheduler"
                                          className="!rounded-none !border-0 !bg-transparent !p-0"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {cfg.enabled && (
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                            <p className="text-xs text-indigo-700">Auto-scheduler active — new worksheet generated {frequencyLabel(cfg.frequency)} and assigned to {selectedChild.name} automatically.</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
