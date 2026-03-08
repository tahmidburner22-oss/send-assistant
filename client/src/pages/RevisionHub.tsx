import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload, Play, Pause, SkipBack, SkipForward, MessageSquare,
  Mic, MicOff, Send, RefreshCw, ChevronRight, CheckCircle2,
  XCircle, HelpCircle, BookOpen, Headphones, Brain, Loader2,
  Volume2, VolumeX, FileText, ArrowRight
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
type AnswerState = "unanswered" | "correct" | "wrong" | "explained";
type Tab = "podcast" | "quiz";

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiPost(path: string, body: Record<string, any>) {
  const res = await fetch(`/api/revision${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const [audioSrc, setAudioSrc] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Audio controls ─────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [audioSrc]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
  };

  const seek = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
  };

  const handleInterrupt = () => {
    if (audioRef.current && isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    setInterrupted(true);
    setAnswer("");
  };

  const resumePodcast = () => {
    setInterrupted(false);
    setQuestion("");
    setAnswer("");
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const handleUpload = async (file: File) => {
    setUploading(true);
    setDocumentText("");
    setPodcastScript("");
    setAudioSrc("");
    setQuestions([]);
    setCurrentQIndex(0);
    setScore({ correct: 0, total: 0 });
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await fetch("/api/revision/upload", {
        method: "POST",
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
      if (data.audioBase64) {
        setAudioSrc(`data:audio/mp3;base64,${data.audioBase64}`);
      }
      toast.success("Document processed! Your revision podcast is ready.");
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
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setQuestion(transcript);
      setIsListening(false);
    };
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
      const data = await apiPost("/quiz", {
        documentText,
        count: 5,
        existingQuestions: questions,
      });
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
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const nextQuestion = () => {
    const nextIdx = currentQIndex + 1;
    // If we're 2 from the end, load more in background
    if (nextIdx >= questions.length - 2 && !loadingMore) {
      loadQuiz(true);
    }
    if (nextIdx < questions.length) {
      setCurrentQIndex(nextIdx);
      setSelectedOption(null);
      setAnswerState("unanswered");
    }
  };

  const currentQ = questions[currentQIndex];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
                { icon: <Headphones className="w-5 h-5" />, label: "AI Podcast", desc: "Listen to your notes" },
                { icon: <MessageSquare className="w-5 h-5" />, label: "Ask Questions", desc: "Interrupt anytime" },
                { icon: <Brain className="w-5 h-5" />, label: "Unlimited Quiz", desc: "Interactive MCQs" },
              ].map(f => (
                <div key={f.label} className="bg-muted/50 rounded-xl p-3 text-center space-y-1.5">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center mx-auto text-brand">{f.icon}</div>
                  <p className="text-xs font-semibold">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-brand/30 rounded-2xl p-10 text-center cursor-pointer hover:border-brand/60 hover:bg-brand/5 transition-all"
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
            >
              <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-brand" />
              </div>
              <p className="font-semibold text-foreground mb-1">Drop your document here</p>
              <p className="text-sm text-muted-foreground mb-4">PDF or text file — up to 10MB</p>
              <Button className="bg-brand hover:bg-brand/90 text-white">
                <Upload className="w-4 h-4 mr-2" /> Choose File
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={onFileChange} />
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
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto animate-pulse">
            <Headphones className="w-8 h-8 text-brand" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Creating your revision podcast…</p>
            <p className="text-sm text-muted-foreground mt-1">Extracting text, writing script, generating audio</p>
          </div>
          <Loader2 className="w-6 h-6 text-brand animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
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
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">Document loaded</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
          <Upload className="w-3.5 h-3.5" /> New document
        </Button>
        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" onChange={onFileChange} />
      </div>

      {/* Tabs */}
      <div className="flex border-b px-6">
        {([
          { id: "podcast", label: "Podcast", icon: <Headphones className="w-4 h-4" /> },
          { id: "quiz", label: "Quiz", icon: <Brain className="w-4 h-4" /> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); if (t.id === "quiz" && questions.length === 0) loadQuiz(); }}
            className={cn(
              "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              tab === t.id ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── PODCAST TAB ─────────────────────────────────────────────────────── */}
      {tab === "podcast" && (
        <div className="flex-1 flex flex-col p-6 gap-4 max-w-2xl mx-auto w-full">
          {/* Audio player card */}
          <div className="bg-gradient-to-br from-brand/10 to-brand/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Your Revision Podcast</p>
                <p className="text-xs text-muted-foreground">AI-narrated from your document</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <input
                type="range" min={0} max={duration || 100} value={currentTime}
                onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); }}
                className="w-full h-1.5 accent-brand cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => seek(-10)} className="text-muted-foreground">
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-brand hover:bg-brand/90 text-white shadow-lg"
                disabled={!audioSrc}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => seek(10)} className="text-muted-foreground">
                <SkipForward className="w-5 h-5" />
              </Button>
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

          {/* Hidden audio element */}
          {audioSrc && <audio ref={audioRef} src={audioSrc} preload="auto" />}

          {/* No audio fallback — show script */}
          {!audioSrc && podcastScript && (
            <div className="bg-muted/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="w-4 h-4" /> Podcast Script (audio unavailable)
              </div>
              <p className="text-sm leading-relaxed text-foreground">{podcastScript}</p>
            </div>
          )}

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

          {/* Script preview (collapsed) */}
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

                  let style = "border-border bg-background hover:bg-muted/50 hover:border-brand/40";
                  if (revealed && isCorrect) style = "border-green-500 bg-green-50 dark:bg-green-950/30";
                  else if (revealed && isSelected && !isCorrect) style = "border-red-400 bg-red-50 dark:bg-red-950/30";
                  else if (!revealed) style = "border-border bg-background hover:bg-muted/50 hover:border-brand/40 cursor-pointer";

                  return (
                    <button
                      key={idx}
                      onClick={() => selectOption(idx)}
                      disabled={revealed}
                      className={cn(
                        "w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        style
                      )}
                    >
                      {/* Letter badge */}
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
                    {answerState === "correct" ? "✓ Correct!" : "✗ Not quite — here's why:"}
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
