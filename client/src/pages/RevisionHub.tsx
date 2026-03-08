import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload, Play, Pause, MessageSquare,
  Mic, MicOff, Send, CheckCircle2,
  XCircle, HelpCircle, BookOpen, Headphones, Brain, Loader2,
  ArrowRight, Volume2, Globe, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}
type AnswerState = "unanswered" | "correct" | "wrong";
type Tab = "podcast" | "quiz";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "hi", label: "Hindi" },
  { code: "ur", label: "Urdu" },
  { code: "pl", label: "Polish" },
  { code: "tr", label: "Turkish" },
  { code: "ru", label: "Russian" },
];

const TTS_VOICES = [
  { id: "nova", label: "Nova - Natural Female" },
  { id: "shimmer", label: "Shimmer - Warm Female" },
  { id: "onyx", label: "Onyx - Deep Male" },
  { id: "fable", label: "Fable - Expressive Male" },
  { id: "alloy", label: "Alloy - Neutral" },
  { id: "echo", label: "Echo - Balanced Male" },
];

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

export default function RevisionHub() {
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
  // TTS state
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [usingBrowserTTS, setUsingBrowserTTS] = useState(false);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load browser voices as fallback
  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis?.getVoices() || [];
      const eng = all.filter(v => v.lang.startsWith("en"));
      setBrowserVoices(eng);
      if (!selectedBrowserVoice && eng.length > 0) {
        const pick = eng.find(v => /natural|enhanced|premium/i.test(v.name)) || eng[0];
        setSelectedBrowserVoice(pick.name);
      }
    };
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", load);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); };
  }, [audioUrl]);

  // Neural TTS: call server endpoint, fall back to browser speech if no key
  const generateAudio = async (script: string, voice = selectedVoice, lang = selectedLanguage) => {
    if (!script) return;
    setAudioLoading(true);
    setAudioUrl(null);
    setUsingBrowserTTS(false);
    setIsPlaying(false);
    window.speechSynthesis?.cancel();
    try {
      const token = localStorage.getItem("send_token");
      const res = await fetch("/api/revision/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: "include",
        body: JSON.stringify({ text: script, voice, language: lang }),
      });
      if (res.ok && res.headers.get("content-type")?.includes("audio")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setUsingBrowserTTS(false);
        toast.success("Neural podcast ready! Press play to listen.");
      } else {
        setUsingBrowserTTS(true);
        toast.info("Using browser voice. Add an OpenAI key in Settings for a more natural voice.");
      }
    } catch {
      setUsingBrowserTTS(true);
    } finally {
      setAudioLoading(false);
    }
  };

  const startBrowserSpeech = (rate = speechRate) => {
    if (!podcastScript) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(podcastScript);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === selectedBrowserVoice);
    if (voice) { utt.voice = voice; utt.lang = voice.lang; }
    else utt.lang = "en-GB";
    utt.rate = rate;
    utt.pitch = 1.05;
    utt.volume = 1;
    utt.onend = () => setIsPlaying(false);
    utt.onerror = () => setIsPlaying(false);
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!podcastScript) return;
    if (audioUrl && !usingBrowserTTS) {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) { audio.pause(); setIsPlaying(false); }
      else { audio.play(); setIsPlaying(true); }
    } else {
      if (isPlaying) { window.speechSynthesis.pause(); setIsPlaying(false); }
      else if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); setIsPlaying(true); }
      else startBrowserSpeech();
    }
  };

  const handleInterrupt = () => {
    if (isPlaying) {
      if (audioUrl && !usingBrowserTTS) audioRef.current?.pause();
      else window.speechSynthesis.pause();
      setIsPlaying(false);
    }
    setInterrupted(true);
    setAnswer("");
  };

  const resumePodcast = () => {
    setInterrupted(false);
    setQuestion("");
    setAnswer("");
    if (audioUrl && !usingBrowserTTS) { audioRef.current?.play(); setIsPlaying(true); }
    else if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); setIsPlaying(true); }
  };

  const changeRate = (rate: number) => {
    setSpeechRate(rate);
    if (audioUrl && audioRef.current) {
      audioRef.current.playbackRate = rate;
    } else {
      const wasPlaying = isPlaying;
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      if (wasPlaying) setTimeout(() => startBrowserSpeech(rate), 100);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setDocumentText("");
    setPodcastScript("");
    setAudioUrl(null);
    setUsingBrowserTTS(false);
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setQuestions([]);
    setCurrentQIndex(0);
    setScore({ correct: 0, total: 0 });
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("language", selectedLanguage);
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
      if (data.script) {
        await generateAudio(data.script, selectedVoice, selectedLanguage);
      }
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

  // Empty state
  if (!documentText && !uploading && !audioLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-6 py-8 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Revision Hub</h1>
              <p className="text-sm text-muted-foreground">Upload any document - get a podcast, quiz, and AI tutor</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Headphones, label: "Neural Podcast", desc: "Natural human-like AI voice" },
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={e => setSelectedLanguage(e.target.value)}
                  className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={e => setSelectedVoice(e.target.value)}
                  className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  {TTS_VOICES.map(v => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
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
                <p className="text-sm text-muted-foreground mt-1">PDF, Word (.docx), or plain text - up to 10MB</p>
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

  // Loading state
  if (uploading || audioLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-brand animate-spin" />
          </div>
          <p className="font-semibold text-foreground">
            {uploading ? "Processing your document..." : "Generating neural audio..."}
          </p>
          <p className="text-sm text-muted-foreground">
            {uploading
              ? "Extracting text and writing your revision podcast script"
              : "Creating a natural human-like voice podcast for you"}
          </p>
        </div>
      </div>
    );
  }

  // Main view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          style={{ display: "none" }}
        />
      )}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Revision Hub</h1>
            <p className="text-xs text-muted-foreground">
              {usingBrowserTTS ? "Browser voice active" : "Neural voice active"} -{" "}
              {LANGUAGES.find(l => l.code === selectedLanguage)?.label ?? "English"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => {
            window.speechSynthesis?.cancel();
            if (audioRef.current) audioRef.current.pause();
            setDocumentText("");
            setPodcastScript("");
            setAudioUrl(null);
            setIsPlaying(false);
          }}
        >
          <Upload className="w-3.5 h-3.5" /> New document
        </Button>
      </div>
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
            {t === "podcast" ? "Podcast" : "Quiz"}
          </button>
        ))}
      </div>
      {tab === "podcast" && (
        <div className="flex-1 flex flex-col p-6 gap-4 max-w-2xl mx-auto w-full">
          <div className="bg-gradient-to-br from-brand/10 to-brand/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">Your Revision Podcast</p>
                <p className="text-xs text-muted-foreground">
                  {usingBrowserTTS
                    ? "Browser voice - add an OpenAI key in Settings for neural audio"
                    : `Neural voice: ${TTS_VOICES.find(v => v.id === selectedVoice)?.label ?? selectedVoice}`}
                </p>
              </div>
              {isPlaying && (
                <div className="flex gap-0.5 items-end h-5">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="w-1 bg-brand rounded-full animate-pulse"
                      style={{ height: `${[60, 100, 80, 40][i - 1]}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="icon"
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-brand hover:bg-brand/90 text-white shadow-lg"
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
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
                  {r}x
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={e => setSelectedLanguage(e.target.value)}
                  className="w-full text-xs bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={e => setSelectedVoice(e.target.value)}
                  className="w-full text-xs bg-muted border border-border rounded-lg px-2 py-1.5 text-foreground"
                >
                  {TTS_VOICES.map(v => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              disabled={audioLoading}
              onClick={() => generateAudio(podcastScript, selectedVoice, selectedLanguage)}
            >
              {audioLoading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating audio...</>
                : <><Sparkles className="w-3.5 h-3.5" /> Re-generate with selected voice and language</>}
            </Button>
            {usingBrowserTTS && browserVoices.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Browser voice:</span>
                <select
                  value={selectedBrowserVoice}
                  onChange={e => {
                    setSelectedBrowserVoice(e.target.value);
                    if (isPlaying) {
                      window.speechSynthesis.cancel();
                      setIsPlaying(false);
                      setTimeout(() => startBrowserSpeech(speechRate), 100);
                    }
                  }}
                  className="text-xs bg-muted border border-border rounded-lg px-2 py-1 text-foreground flex-1 truncate"
                >
                  {browserVoices.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name.replace(/Microsoft |Google /, "").replace(/ \(.*\)/, "")} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {!interrupted && (
              <Button
                variant="outline"
                className="w-full gap-2 border-brand/30 text-brand hover:bg-brand/10"
                onClick={handleInterrupt}
              >
                <MessageSquare className="w-4 h-4" />
                Interrupt and Ask a Question
              </Button>
            )}
          </div>
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
      {tab === "quiz" && (
        <div className="flex-1 flex flex-col p-6 gap-4 max-w-2xl mx-auto w-full">
          {score.total > 0 && (
            <div className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{score.correct}/{score.total} correct</span>
                  <span className="text-muted-foreground">{Math.round((score.correct / score.total) * 100)}%</span>
                </div>
                <Progress value={(score.correct / score.total) * 100} className="h-1.5" />
              </div>
            </div>
          )}
          {loadingQuiz ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Generating your quiz...</p>
              </div>
            </div>
          ) : currentQ ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  Q{currentQIndex + 1}
                </span>
                {score.total > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {score.correct}/{score.total} correct
                  </span>
                )}
              </div>
              <div className="bg-muted/30 rounded-2xl p-5">
                <p className="font-semibold text-foreground leading-relaxed">{currentQ.question}</p>
              </div>
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
              {answerState === "unanswered" && (
                <Button
                  variant="outline"
                  className="w-full text-muted-foreground gap-2"
                  onClick={() => { setSelectedOption(null); setAnswerState("wrong"); setScore(prev => ({ ...prev, total: prev.total + 1 })); }}
                >
                  <HelpCircle className="w-4 h-4" /> I don't know - show me the answer
                </Button>
              )}
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
                    {answerState === "correct" ? "Correct! Well done." : `The correct answer is: ${currentQ.options[currentQ.correct]}`}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}
              {answerState !== "unanswered" && (
                <Button
                  className="w-full bg-brand hover:bg-brand/90 text-white gap-2"
                  onClick={nextQuestion}
                  disabled={loadingMore && currentQIndex >= questions.length - 1}
                >
                  {loadingMore && currentQIndex >= questions.length - 1 ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Loading next question...</>
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
