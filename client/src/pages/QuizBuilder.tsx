/**
 * QuizBuilder — Teacher quiz creation tool
 *
 * Features:
 * - Create/edit quizzes manually (add/edit/delete questions)
 * - Upload a PDF, Word doc, or TXT file → AI generates questions
 * - Save to school's custom quiz library
 */
import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import {
  Plus, Trash2, Upload, Zap, Save, ArrowLeft,
  RefreshCw, CheckCircle, GripVertical, Pencil, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function getAuthHeader(): Record<string, string> {
  return {};
}

interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  timeLimit: number;
}

function makeId() { return Math.random().toString(36).slice(2, 9); }

function blankQuestion(): QuizQuestion {
  return { id: makeId(), question: "", options: ["", "", "", ""], correctIndex: 0, timeLimit: 20 };
}

export default function QuizBuilder() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const editId = new URLSearchParams(search).get("edit");

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([blankQuestion()]);
  const [editingIdx, setEditingIdx] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Document upload
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(10);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load existing quiz if editing
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    fetch(`/api/quiz/custom/${editId}`, { headers: getAuthHeader() })
      .then(r => r.json())
      .then(data => {
        setTitle(data.title || "");
        setSubject(data.subject || "");
        setTopic(data.topic || "");
        setQuestions(data.questions?.length ? data.questions : [blankQuestion()]);
        setEditingIdx(null);
      })
      .catch(() => toast.error("Could not load quiz"))
      .finally(() => setLoading(false));
  }, [editId]);

  function updateQuestion(idx: number, updates: Partial<QuizQuestion>) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...updates } : q));
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options] as [string, string, string, string];
      opts[optIdx] = value;
      return { ...q, options: opts };
    }));
  }

  function addQuestion() {
    const newQ = blankQuestion();
    setQuestions(prev => [...prev, newQ]);
    setEditingIdx(questions.length);
  }

  function deleteQuestion(idx: number) {
    if (questions.length === 1) { toast.error("A quiz needs at least one question"); return; }
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    setEditingIdx(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [".pdf", ".docx", ".doc", ".txt"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) { toast.error("Only PDF, Word (.docx), or TXT files are supported"); return; }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("questionCount", String(uploadCount));
    fd.append("title", title || file.name.replace(/\.[^.]+$/, ""));

    try {
      const res = await fetch("/api/quiz/generate-from-doc", {
        method: "POST",
        headers: getAuthHeader(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      if (!title) setTitle(data.title || "");
      setQuestions(data.questions);
      setEditingIdx(null);
      toast.success(`${data.questions.length} questions generated from your document!`);
    } catch (err: any) {
      toast.error(err.message || "Could not generate questions");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Please enter a quiz title"); return; }
    const valid = questions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
    if (valid.length === 0) { toast.error("Add at least one complete question with all 4 options"); return; }

    setSaving(true);
    try {
      const body = { title: title.trim(), subject, topic, questions: valid };
      const url = editId ? `/api/quiz/custom/${editId}` : "/api/quiz/custom";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success(editId ? "Quiz updated!" : "Quiz saved to your library!");
      navigate("/quiz-game");
    } catch (err: any) {
      toast.error(err.message || "Could not save quiz");
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const SUBJECTS = ["Maths", "English", "Science", "History", "Geography", "French", "Art", "Music", "PE", "PSHE", "Computing", "Other"];
  const ANSWER_COLOURS = ["text-red-500", "text-blue-500", "text-yellow-500", "text-green-500"];
  const ANSWER_SHAPES = ["▲", "◆", "●", "■"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate("/quiz-game")} className="text-purple-200 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black text-white">{editId ? "Edit Quiz" : "Create Quiz"}</h1>
          <div className="ml-auto flex gap-2">
            <Button onClick={handleSave} disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white font-bold gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Quiz
            </Button>
          </div>
        </div>

        {/* Quiz details */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 mb-5">
          <h2 className="text-white font-bold mb-4">Quiz Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-purple-200 text-sm mb-1 block">Title *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Year 7 Fractions Quiz"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40" />
            </div>
            <div>
              <label className="text-purple-200 text-sm mb-1 block">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full h-10 rounded-md bg-white/10 border border-white/20 text-white px-3 text-sm">
                <option value="">Select subject</option>
                {SUBJECTS.map(s => <option key={s} value={s} className="bg-indigo-900">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-purple-200 text-sm mb-1 block">Topic</label>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Adding Fractions"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40" />
            </div>
          </div>
        </div>

        {/* AI document upload */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-bold">Generate from Document (AI)</h2>
          </div>
          <p className="text-purple-200 text-sm mb-4">Upload a PDF, Word doc, or text file and AI will generate quiz questions from it.</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-purple-200 text-sm">Questions:</label>
              <select value={uploadCount} onChange={e => setUploadCount(Number(e.target.value))}
                className="h-9 rounded-md bg-white/10 border border-white/20 text-white px-2 text-sm">
                {[5, 10, 15, 20].map(n => <option key={n} value={n} className="bg-indigo-900">{n}</option>)}
              </select>
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFileUpload}
              className="hidden" id="quiz-file-upload" />
            <label htmlFor="quiz-file-upload">
              <Button asChild disabled={uploading}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold gap-2 cursor-pointer">
                <span>
                  {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Generating…" : "Upload & Generate"}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold">{questions.length} Question{questions.length !== 1 ? "s" : ""}</h2>
            <Button onClick={addQuestion} size="sm" className="bg-white/20 hover:bg-white/30 text-white gap-1">
              <Plus className="w-4 h-4" /> Add Question
            </Button>
          </div>

          <AnimatePresence>
            {questions.map((q, idx) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-xl overflow-hidden">
                {/* Question header */}
                <div className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}>
                  <GripVertical className="w-4 h-4 text-white/30" />
                  <span className="text-white/60 text-sm font-bold w-6">Q{idx + 1}</span>
                  <span className="flex-1 text-white font-semibold truncate">
                    {q.question || <span className="text-white/40 italic">Untitled question</span>}
                  </span>
                  {q.question && q.options.every(o => o.trim()) && (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  )}
                  <button onClick={e => { e.stopPropagation(); deleteQuestion(idx); }}
                    className="text-white/40 hover:text-red-400 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Pencil className={`w-4 h-4 transition-colors ${editingIdx === idx ? "text-yellow-400" : "text-white/40"}`} />
                </div>

                {/* Expanded editor */}
                {editingIdx === idx && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    <div>
                      <label className="text-purple-200 text-sm mb-1 block">Question</label>
                      <textarea value={q.question} onChange={e => updateQuestion(idx, { question: e.target.value })}
                        placeholder="Type your question here…"
                        rows={2}
                        className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 p-3 text-sm resize-none focus:outline-none focus:border-white/40" />
                    </div>
                    <div>
                      <label className="text-purple-200 text-sm mb-2 block">Answer Options (click the correct one)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`flex items-center gap-2 rounded-lg p-2 border-2 transition-colors cursor-pointer
                            ${q.correctIndex === oi ? "border-green-400 bg-green-400/10" : "border-white/10 bg-white/5"}`}
                            onClick={() => updateQuestion(idx, { correctIndex: oi as 0 | 1 | 2 | 3 })}>
                            <span className={`text-lg font-bold ${ANSWER_COLOURS[oi]}`}>{ANSWER_SHAPES[oi]}</span>
                            <input value={opt} onChange={e => { e.stopPropagation(); updateOption(idx, oi, e.target.value); }}
                              onClick={e => e.stopPropagation()}
                              placeholder={`Option ${oi + 1}`}
                              className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm focus:outline-none" />
                            {q.correctIndex === oi && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                          </div>
                        ))}
                      </div>
                      <p className="text-purple-300 text-xs mt-2">Click an option to mark it as correct</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-purple-200 text-sm">Time limit:</label>
                      <select value={q.timeLimit} onChange={e => updateQuestion(idx, { timeLimit: Number(e.target.value) })}
                        className="h-8 rounded-md bg-white/10 border border-white/20 text-white px-2 text-sm">
                        {[10, 15, 20, 30, 45, 60].map(t => <option key={t} value={t} className="bg-indigo-900">{t}s</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          <Button onClick={addQuestion} variant="outline"
            className="w-full border-dashed border-white/30 text-white hover:bg-white/10 gap-2 py-6">
            <Plus className="w-5 h-5" /> Add Another Question
          </Button>
        </div>

        {/* Bottom save */}
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 text-lg gap-2">
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
