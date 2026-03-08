import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload, Play, Pause, MessageSquare,
  Mic, MicOff, Send, RefreshCw, ChevronRight, CheckCircle2,
  XCircle, HelpCircle, BookOpen, Headphones, Brain, Loader2,
  FileText, ArrowRight, Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}
type AnswerState = "unanswered" | "correct" | "wrong";
type Tab = "podcast" | "quiz";

// ── API helpers ───────────────────────────────────────────────────────────────
function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem("send_token");
  return token ? { Authorization: `Bearer ${token}`, ...extra } : extra;
}
async function apiPost(path: string, body: Record<string, any>) {
  const res = await fetch(`/api/revision${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RevisionHub() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("podcast");
  const [uploading, setUploading] = useState(false);
  const [documentText, setDocumentText] = useState("");
  const [podcastScript, setPodcastScript] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [interrupted, setInterrupted] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cancel speech on unmount
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  // ── Speech controls ────────────────────────────────────────────────────────
  const startSpeech = (rate = speechRate) => {
    if (!podcastScript) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(podcastScript);
    utt.lang = "en-GB";
    utt.rate = rate;
    utt.pitch = 1;
    utt.onend = () => setIsPlaying(false);
    utt.onerror = () => setIsPlaying(false);
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!podcastScript) return;
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    } else {
      startSpeech();
    }
  };

  const handleInterrupt = () => {
    if (isPlaying) { window.speechSynthesis.pause(); setIsPlaying(false); }
    setInterrupted(true);
    setAnswer("");
  };

  const resumePodcast = () => {
    setInterrupted(false);
    setQuestion("");
    setAnswer("");
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  const changeRate = (rate: number) => {
    setSpeechRate(rate);
    const wasPlaying = isPlaying;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    if (wasPlaying) {
      setTimeout(() => startSpeech(rate), 100);
    }
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const handleUpload = async (file: File) => {
    setUploading(true);
    setDocumentText("");
    setPodcastScript("");
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setQuestions([]);
    setCurrentQIndex(0);
    setScore({ correct: 0, total: 0 });
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await fetch("/api/revision/upload", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setDocumentText(data.text || "");
      setPodcastScript(data.script || "");
      toast.success("Document processed! Press play to start your revision podcast.");
    } catch (err: any) {
      toast.error(err.message || "Failed to process document");
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  // ── Ask a question ─────────────────────────────────────────────────────────
  const askQuestion = async () => {
    if (!question.trim() || !documentText) return;
    setAskingQuestion(true);
    setAnswer("");
    try {
      const data = await apiPost("/ask", { question, documentText });
      setAnswer(data.answer || "");
    } catch (err: any) {
      toast.error(err.message || "Failed to get answer");
    } finally {
      setAskingQuestion(false);
    }
  };

  // ── Voice input ────────────────────────────────────────────────────────────
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Voice input not supported in this browser"); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => { setQuestion(e.results[0][0].transcript); setIsListening(false); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // ── Load quiz questions ────────────────────────────────────────────────────
  const loadQuiz = async (append = false) => {
    if (!documentText) return;
    if (append) setLoadingMore(true); else setLoadingQuiz(true);
    try {
      const data = await apiPost("/quiz", { documentText, count: 5, existingQuestions: questions });
      if (append) {
        setQuestions(prev => [...prev, ...(data.questions || [])]);
      } else {
        setQuestions(data.questions || []);
        setCurrentQIndex(0);
        setSelectedOption(null);
        setAnswerState("unanswered");
        setScore({ correct: 0, total: 0 });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate quiz");
    } finally {
      setLoadingQuiz(false);
      setLoadingMore(false);
    }
  };

  // ── Quiz interaction ───────────────────────────────────────────────────────
  const selectOption = (idx: number) => {
    if (answerState !== "unanswered") return;
    setSelectedOption(idx);
    const q = questions[currentQIndex];
    const isCorrect = idx === q.correct;
    setAnswerState(isCorrect ? "correct" : "wrong");
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
  };

  const nextQuestion = () => {
    const nextIdx = currentQIndex + 1;
    if (nextIdx >= questions.length - 2 && !loadingMore) loadQuiz(true);
    if (nextIdx < questions.length) {
      setCurrentQIndex(nextIdx);
      setSelectedOption(null);
      setAnswerState("unanswered");
    }
  };

  const currentQ = questions[currentQIndex];

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!documentText && !uploading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-6 py-8 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Revision Hub</h1>
              <p className="text-sm text-muted-foreground">Upload any document — get a podcast, quiz, and AI tutor</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg space-y-6">
            {/* Feature cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Headphones, label: "AI Podcast", desc: "Spoken revision from your notes" },
                { icon: MessageSquare, label: "Interrupt & Ask", desc: "Ask questions mid-podcast" },
                { icon: Brain, label: "Smart Quiz", desc: "Unlimited interactive questions" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-muted/40 rounded-xl p-3 text-center space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center mx-auto">
                    <Icon className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
                </div>
              ))}
            </div>

            {/* Upload zone */}
            <div
              className="border-2 border-dashed border-brand/30 rounded-2xl p-8 text-center space-y-4 cursor-pointer hover:border-brand/60 hover:bg-brand/5 transition-all"
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
            >
              <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
                <Upload className="w-7 h-7 text-brand" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Drop your notes here</p>
                <p className="text-sm text-muted-foreground mt-1">PDF, Word (.docx), or plain text — up to 10MB</p>
              </div>
              <Button className="bg-brand hover:bg-brand/90 text-white gap-2">
                <Upload className="w-4 h-4" /> Choose File
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx,text/plain,application/pdf" className="hidden" onChange={onFileChange} />
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (uploading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
          <p className="font-semibold text-foreground">Processing your document…</p>
          <p className="text-sm text-muted-foreground">Extracting text and writing your revision podcast script</p>
        </div>
      </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Revision Hub</h1>
            <p className="text-xs text-muted-foreground">Document loaded — ready to revise</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { window.speechSynthesis?.cancel(); setDocumentText(""); setPodcastScript(""); setIsPlaying(false); }}>
          <Upload className="w-3.5 h-3.5" /> New document
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {(["podcast", "quiz"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors capitalize",
              tab === t ? "text-brand border-b-2 border-brand" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "podcast" ? "🎧 Podcast" : "🧠 Quiz"}
          </button>
        ))}
      </div>

      {/* ── PODCAST TAB ─────────────────────────────────────────────────────── */}
      {tab === "podcast" && (
        <div className="flex-1 flex flex-col p-6 gap-4 max-w-2xl mx-auto w-full">

          {/* Player card */}
          <div className="bg-gradient-to-br from-brand/10 to-brand/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Your Revision Podcast</p>
                <p className="text-xs text-muted-foreground">AI-narrated from your document • Browser voice</p>
              </div>
              {isPlaying && (
                <div className="flex gap-0.5 items-end h-5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-1 bg-brand rounded-full animate-pulse" style={{ height: `${[60,100,80,40][i-1]}%`, animationDelay: `${i*0.1}s` }} />
                  ))}
                </div>
              )}
            </div>

            {/* Play/Pause button */}
            <div className="flex items-center justify-center gap-4">
              <Button
                size="icon"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-brand hover:bg-brand/90 text-white shadow-lg"
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
              </Button>
            </div>

            {/* Speed control */}
            <div className="flex items-center justify-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mr-1">Speed:</span>
              {[0.75, 1, 1.25, 1.5, 2].map(r => (
                <button
                  key={r}
                  onClick={() => changeRate(r)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                    speechRate === r ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {r}×
                </button>
              ))}
            </div>

            {/* Interrupt button */}
            {!interrupted && (
              <Button
                variant="outline"
                className="w-full gap-2 border-brand/30 text-brand hover:bg-brand/10"
                onClick={handleInterrupt}
              >
                <MessageSquare className="w-4 h-4" />
                Interrupt & Ask a Question
              </Button>
            )}
          </div>

          {/* Q&A panel */}
          {interrupted && (
            <div className="bg-background border rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand" /> Ask a question
                </p>
                <Button variant="ghost" size="sm" onClick={resumePodcast} className="text-muted-foreground text-xs">
                  Resume podcast
                </Button>
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="What would you like to know about this topic?"
                  className="resize-none text-sm"
                  rows={2}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askQuestion(); } }}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    size="icon"
                    variant={isListening ? "default" : "outline"}
                    onClick={toggleVoice}
                    className={isListening ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button size="icon" onClick={askQuestion} disabled={!question.trim() || askingQuestion} className="bg-brand hover:bg-brand/90 text-white">
                    {askingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {answer && (
                <div className="bg-brand/5 border border-brand/20 rounded-xl p-4">
                  <p className="text-xs font-medium text-brand mb-1.5">AI Tutor</p>
                  <p className="text-sm leading-relaxed text-foreground">{answer}</p>
                </div>
              )}
            </div>
          )}

          {/* Script preview */}
          {podcastScript && (
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 select-none">
                <BookOpen className="w-4 h-4" /> View podcast script
              </summary>
              <div className="mt-3 bg-muted/30 rounded-xl p-4 text-sm leading-relaxed text-foreground">
                {podcastScript}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ── QUIZ TAB ────────────────────────────────────────────────────────── */}
      {tab === "quiz" && (
        <div className="flex-1 flex flex-col p-6 gap-4 max-w-2xl mx-auto w-full">
          {/* Score bar */}
          {score.total > 0 && (
            <div className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm font-medium">{score.correct}/{score.total} correct</span>
              <div className="flex-1">
                <Progress value={(score.correct / score.total) * 100} className="h-1.5" />
              </div>
              <span className="text-sm text-muted-foreground">{Math.round((score.correct / score.total) * 100)}%</span>
            </div>
          )}

          {loadingQuiz ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Generating quiz questions…</p>
              </div>
            </div>
          ) : currentQ ? (
            <div className="space-y-4">
              {/* Question counter */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Question {currentQIndex + 1} of {questions.length}{loadingMore ? "+" : ""}</span>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => loadQuiz()}>
                  <RefreshCw className="w-3 h-3" /> New set
                </Button>
              </div>

              {/* Question card */}
              <div className="bg-gradient-to-br from-brand/10 to-brand/5 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-base font-semibold text-foreground leading-snug">{currentQ.question}</p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQ.correct;
                  const revealed = answerState !== "unanswered";

                  let style = "border-border bg-background hover:bg-muted/50 hover:border-brand/40 cursor-pointer";
                  if (revealed && isCorrect) style = "border-green-500 bg-green-50 dark:bg-green-950/30";
                  else if (revealed && isSelected && !isCorrect) style = "border-red-400 bg-red-50 dark:bg-red-950/30";

                  return (
                    <button
                      key={idx}
                      onClick={() => selectOption(idx)}
                      disabled={revealed}
                      className={cn("w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 transition-all", style)}
                    >
                      <span className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                        revealed && isCorrect ? "bg-green-500 text-white" :
                        revealed && isSelected && !isCorrect ? "bg-red-400 text-white" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {["A", "B", "C", "D"][idx]}
                      </span>
                      <span className="text-sm font-medium flex-1">{opt}</span>
                      {revealed && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                      {revealed && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* I don't know button */}
              {answerState === "unanswered" && (
                <Button
                  variant="outline"
                  className="w-full text-muted-foreground gap-2"
                  onClick={() => { setSelectedOption(null); setAnswerState("wrong"); setScore(prev => ({ ...prev, total: prev.total + 1 })); }}
                >
                  <HelpCircle className="w-4 h-4" /> I don't know — show me the answer
                </Button>
              )}

              {/* Explanation */}
              {answerState !== "unanswered" && (
                <div className={cn(
                  "rounded-xl p-4 border space-y-1.5",
                  answerState === "correct"
                    ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                    : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                )}>
                  <p className={cn(
                    "text-sm font-semibold",
                    answerState === "correct" ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"
                  )}>
                    {answerState === "correct" ? "✓ Correct! Well done." : `✗ The correct answer is: ${currentQ.options[currentQ.correct]}`}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}

              {/* Next button */}
              {answerState !== "unanswered" && (
                <Button
                  className="w-full bg-brand hover:bg-brand/90 text-white gap-2"
                  onClick={nextQuestion}
                  disabled={loadingMore && currentQIndex >= questions.length - 1}
                >
                  {loadingMore && currentQIndex >= questions.length - 1 ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Loading next question…</>
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Next Question</>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Brain className="w-12 h-12 text-brand mx-auto" />
                <p className="font-semibold">Ready to test yourself?</p>
                <p className="text-sm text-muted-foreground">Generate unlimited questions from your document</p>
                <Button className="bg-brand hover:bg-brand/90 text-white gap-2" onClick={() => loadQuiz()}>
                  <Brain className="w-4 h-4" /> Generate Quiz
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
