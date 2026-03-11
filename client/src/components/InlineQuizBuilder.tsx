/**
 * InlineQuizBuilder — embeddable version of QuizBuilder for use inside QuizBlast.
 * Accepts editId, onSaved, and onCancel props instead of using routing.
 */
import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Upload, Zap, Save, RefreshCw, CheckCircle, Pencil, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("send_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
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

interface Props {
  editId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

const SUBJECTS = ["Maths", "English", "Science", "History", "Geography", "French", "Art", "Music", "PE", "PSHE", "Computing", "Other"];
const ANSWER_COLOURS = ["text-red-500", "text-blue-500", "text-yellow-500", "text-green-500"];
const ANSWER_SHAPES = ["▲", "◆", "●", "■"];

export default function InlineQuizBuilder({ editId, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([blankQuestion()]);
  const [editingIdx, setEditingIdx] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(10);
  const fileRef = useRef<HTMLInputElement>(null);

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
      toast.success(`${data.questions.length} questions generated!`);
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
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Could not save quiz");
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900">{editId ? "Edit Quiz" : "Create Quiz"}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="gap-2">
            <X className="w-4 h-4" /> Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-green-500 hover:bg-green-600 text-white gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Quiz
          </Button>
        </div>
      </div>

      {/* Quiz details */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-4">Quiz Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="text-gray-600 text-sm mb-1 block">Title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Year 7 Fractions Quiz" />
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-1 block">Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select subject</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-1 block">Topic</label>
            <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Fractions & Decimals" />
          </div>
        </div>
      </div>

      {/* AI from document */}
      <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-200">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-800">Generate from Document (AI)</h3>
        </div>
        <p className="text-indigo-600 text-sm mb-4">Upload a PDF, Word doc, or TXT file and AI will generate quiz questions automatically.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-indigo-700 text-sm">Questions:</label>
            <select value={uploadCount} onChange={e => setUploadCount(Number(e.target.value))}
              className="h-9 rounded-md border border-indigo-200 bg-white px-2 text-sm text-indigo-800">
              {[5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            {uploading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</> : <><Upload className="w-4 h-4" /> Upload Document</>}
          </Button>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">{questions.length} Question{questions.length !== 1 ? "s" : ""}</h3>
          <Button onClick={addQuestion} variant="outline" className="gap-2 text-green-600 border-green-300 hover:bg-green-50">
            <Plus className="w-4 h-4" /> Add Question
          </Button>
        </div>
        <AnimatePresence>
          {questions.map((q, idx) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-gray-200 rounded-xl mb-3 overflow-hidden shadow-sm">
              {/* Question header */}
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}>
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                  {q.question || <span className="text-gray-400 italic">No question text yet</span>}
                </span>
                <div className="flex items-center gap-2">
                  {q.question && q.options.every(o => o.trim()) && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  <button onClick={e => { e.stopPropagation(); deleteQuestion(idx); }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {editingIdx === idx ? <X className="w-4 h-4 text-gray-400" /> : <Pencil className="w-4 h-4 text-gray-400" />}
                </div>
              </div>
              {/* Expanded editor */}
              <AnimatePresence>
                {editingIdx === idx && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="overflow-hidden border-t border-gray-100">
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="text-gray-600 text-xs font-medium mb-1 block">Question Text *</label>
                        <Input value={q.question} onChange={e => updateQuestion(idx, { question: e.target.value })}
                          placeholder="Enter your question here…" className="text-sm" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${q.correctIndex === oi ? "border-green-400 bg-green-50" : "border-gray-200"}`}>
                            <span className={`text-lg font-bold ${ANSWER_COLOURS[oi]}`}>{ANSWER_SHAPES[oi]}</span>
                            <Input value={opt} onChange={e => updateOption(idx, oi, e.target.value)}
                              placeholder={`Option ${oi + 1}`} className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0" />
                            <button onClick={() => updateQuestion(idx, { correctIndex: oi as 0|1|2|3 })}
                              className={`ml-auto text-xs px-2 py-1 rounded-full font-medium transition-colors ${q.correctIndex === oi ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-green-100"}`}>
                              {q.correctIndex === oi ? "✓ Correct" : "Set correct"}
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-gray-600 text-xs font-medium">Time limit:</label>
                        <select value={q.timeLimit} onChange={e => updateQuestion(idx, { timeLimit: Number(e.target.value) })}
                          className="h-8 rounded-md border border-gray-200 px-2 text-sm">
                          {[10, 15, 20, 30, 45, 60].map(t => <option key={t} value={t}>{t}s</option>)}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
