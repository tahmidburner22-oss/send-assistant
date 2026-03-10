/**
 * QuizBlast — Kahoot-style classroom quiz game (HOST screen)
 *
 * Flow:
 *  1. Home → pick pre-built or custom quiz
 *  2. Room created → 6-digit code shown → players join on their devices
 *  3. Host starts → questions shown → players answer on own devices
 *  4. After each question: reveal correct answer + live leaderboard
 *  5. Final podium leaderboard
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Play, Trophy, Users, ChevronRight, RotateCcw,
  Zap, BookOpen, CheckCircle, ArrowLeft,
  Plus, Pencil, Copy, ExternalLink, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  SUBJECTS,
  getCategoriesBySubject,
  type QuizCategory,
  type QuizQuestion,
} from "../lib/quiz-bank";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("send_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface RoomPlayer {
  id: string;
  name: string;
  score: number;
  streak: number;
  answers: (boolean | null)[];
}
interface RoomState {
  code: string;
  quizTitle: string;
  phase: "lobby" | "question" | "reveal" | "ended";
  currentQuestion: number;
  totalQuestions: number;
  questionStartedAt?: number;
  currentQ?: {
    id: string;
    question: string;
    options: string[];
    timeLimit: number;
    correctIndex?: number;
  } | null;
  players: RoomPlayer[];
  playerCount: number;
}
interface CustomQuiz {
  id: string;
  title: string;
  subject: string;
  topic: string;
  question_count: number;
  created_by_name: string;
}

// Convert quiz-bank question to API format
interface ApiQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
}

function bankToApi(q: QuizQuestion, i: number): ApiQuestion {
  return {
    id: `q-${i}`,
    question: q.q,
    options: q.options as unknown as string[],
    correctIndex: q.answer,
    timeLimit: 20,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ANSWER_COLOURS = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500"];
const ANSWER_SHAPES = ["▲", "◆", "●", "■"];

const SUBJECT_COLOURS: Record<string, string> = {
  Maths: "from-blue-600 to-blue-800",
  English: "from-purple-600 to-purple-800",
  Science: "from-green-600 to-green-800",
  History: "from-amber-600 to-amber-800",
  Geography: "from-teal-600 to-teal-800",
  French: "from-rose-600 to-rose-800",
};

// ─── Timer ring ───────────────────────────────────────────────────────────────
function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const pct = total > 0 ? seconds / total : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const colour = pct > 0.5 ? "#22c55e" : pct > 0.25 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#ffffff30" strokeWidth="7" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={colour} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
      </svg>
      <span className="text-3xl font-black text-white z-10">{seconds}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuizGame() {
  const [, navigate] = useLocation();

  type View = "home" | "subject" | "category" | "custom-list" | "lobby" | "question" | "reveal" | "final";
  const [view, setView] = useState<View>("home");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customQuizzes, setCustomQuizzes] = useState<CustomQuiz[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // Room
  const [room, setRoom] = useState<RoomState | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [timer, setTimer] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll room state every 1.5s
  const pollRoom = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/quiz/rooms/${code}`, { headers: getAuthHeader() });
      if (!res.ok) return;
      const data: RoomState = await res.json();
      setRoom(data);
      if (data.phase === "question") setView("question");
      else if (data.phase === "reveal") setView("reveal");
      else if (data.phase === "ended") { setView("final"); stopPolling(); }
    } catch {}
  }, []);

  function startPolling(code: string) {
    stopPolling();
    pollRef.current = setInterval(() => pollRoom(code), 1500);
  }
  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  // Timer countdown
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (view === "question" && room?.currentQ) {
      const limit = room.currentQ.timeLimit || 20;
      const elapsed = room.questionStartedAt ? Math.floor((Date.now() - room.questionStartedAt) / 1000) : 0;
      const remaining = Math.max(0, limit - elapsed);
      setTimer(remaining);
      if (remaining > 0) {
        timerRef.current = setInterval(() => {
          setTimer(t => Math.max(0, t - 1));
        }, 1000);
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view, room?.currentQuestion]);

  useEffect(() => () => { stopPolling(); }, []);

  async function loadCustomQuizzes() {
    setLoadingCustom(true);
    try {
      const res = await fetch("/api/quiz/custom", { headers: getAuthHeader() });
      if (res.ok) setCustomQuizzes(await res.json());
    } finally { setLoadingCustom(false); }
  }

  async function createRoom(questions: ApiQuestion[], title: string) {
    setCreatingRoom(true);
    try {
      const res = await fetch("/api/quiz/rooms", {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ quizTitle: title, questions }),
      });
      if (!res.ok) throw new Error("Failed to create room");
      const data = await res.json();
      setRoomCode(data.code);
      await pollRoom(data.code);
      startPolling(data.code);
      setView("lobby");
    } catch (err: any) {
      toast.error(err.message || "Could not create room");
    } finally { setCreatingRoom(false); }
  }

  async function startFromCategory(cat: QuizCategory) {
    const qs = shuffle(cat.questions).slice(0, Math.min(cat.questions.length, 15)).map(bankToApi);
    await createRoom(qs, cat.title);
  }

  async function startFromCustom(quizId: string) {
    try {
      const res = await fetch(`/api/quiz/custom/${quizId}`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Quiz not found");
      const quiz = await res.json();
      await createRoom(quiz.questions, quiz.title);
    } catch (err: any) { toast.error(err.message); }
  }

  async function startGame() {
    if (!roomCode) return;
    try {
      const res = await fetch(`/api/quiz/rooms/${roomCode}/start`, {
        method: "POST", headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Could not start game");
      const data = await res.json();
      setRoom(data);
      setView("question");
    } catch (err: any) { toast.error(err.message); }
  }

  async function advance() {
    if (!roomCode || advancing) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/quiz/rooms/${roomCode}/next`, {
        method: "POST", headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error("Could not advance");
      const data = await res.json();
      setRoom(data);
      if (data.phase === "question") setView("question");
      else if (data.phase === "reveal") setView("reveal");
      else if (data.phase === "ended") { setView("final"); stopPolling(); }
    } catch (err: any) { toast.error(err.message); }
    finally { setAdvancing(false); }
  }

  async function endGame() {
    if (roomCode) {
      await fetch(`/api/quiz/rooms/${roomCode}`, { method: "DELETE", headers: getAuthHeader() });
    }
    stopPolling();
    setRoom(null); setRoomCode(""); setView("home");
  }

  function copyJoinLink() {
    const url = `${window.location.origin}/quiz-join/${roomCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Join link copied!");
  }

  const joinUrl = roomCode ? `${window.location.origin}/quiz-join/${roomCode}` : "";

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEWS
  // ─────────────────────────────────────────────────────────────────────────────

  if (view === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Zap className="w-10 h-10 text-yellow-400" />
              <h1 className="text-5xl font-black text-white tracking-tight">QuizBlast</h1>
            </div>
            <p className="text-purple-200 text-lg">Live classroom quiz game — Kahoot-style</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setView("subject")}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 text-left hover:bg-white/20 transition-all">
              <BookOpen className="w-10 h-10 text-yellow-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Pre-built Quizzes</h2>
              <p className="text-purple-200">600+ questions across Maths, English, Science, History, Geography &amp; French</p>
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { loadCustomQuizzes(); setView("custom-list"); }}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 text-left hover:bg-white/20 transition-all">
              <Plus className="w-10 h-10 text-green-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">My Quizzes</h2>
              <p className="text-purple-200">Create your own quiz, upload a document, or edit saved quizzes</p>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "subject") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setView("home")} className="flex items-center gap-2 text-purple-200 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h2 className="text-3xl font-black text-white mb-6">Choose a Subject</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SUBJECTS.map(subj => (
              <motion.button key={subj} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => { setSelectedSubject(subj); setView("category"); }}
                className={`bg-gradient-to-br ${SUBJECT_COLOURS[subj] || "from-gray-600 to-gray-800"} rounded-2xl p-6 text-white font-bold text-xl text-left shadow-lg`}>
                {subj}
                <div className="text-sm font-normal opacity-80 mt-1">{getCategoriesBySubject(subj).length} categories</div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === "category") {
    const cats = getCategoriesBySubject(selectedSubject);
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setView("subject")} className="flex items-center gap-2 text-purple-200 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <h2 className="text-3xl font-black text-white mb-6">{selectedSubject} — Choose a Topic</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cats.map(cat => (
              <motion.button key={cat.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => startFromCategory(cat)}
                disabled={creatingRoom}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-5 text-left hover:bg-white/20 transition-all disabled:opacity-50">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{cat.emoji}</span>
                  <div>
                    <div className="font-bold text-white text-lg">{cat.title}</div>
                    <div className="text-purple-200 text-sm">{cat.questions.length} questions</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
          {creatingRoom && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-700">Creating room…</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "custom-list") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setView("home")} className="flex items-center gap-2 text-purple-200 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black text-white">My Quizzes</h2>
            <Button onClick={() => navigate("/quiz-builder")} className="bg-green-500 hover:bg-green-600 text-white gap-2">
              <Plus className="w-4 h-4" /> Create Quiz
            </Button>
          </div>
          {loadingCustom ? (
            <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-white/60 mx-auto" /></div>
          ) : customQuizzes.length === 0 ? (
            <div className="text-center py-16 bg-white/10 rounded-2xl border border-white/20">
              <BookOpen className="w-12 h-12 text-purple-300 mx-auto mb-4" />
              <p className="text-white text-xl font-bold mb-2">No custom quizzes yet</p>
              <p className="text-purple-200 mb-6">Create a quiz manually or upload a document to generate one with AI</p>
              <Button onClick={() => navigate("/quiz-builder")} className="bg-green-500 hover:bg-green-600 text-white gap-2">
                <Plus className="w-4 h-4" /> Create Your First Quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {customQuizzes.map(quiz => (
                <div key={quiz.id} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-white text-lg">{quiz.title}</div>
                    <div className="text-purple-200 text-sm">{quiz.subject} · {quiz.question_count} questions · by {quiz.created_by_name}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => navigate(`/quiz-builder?edit=${quiz.id}`)} variant="outline"
                      className="border-white/30 text-white hover:bg-white/20 gap-1">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button size="sm" onClick={() => startFromCustom(quiz.id)} disabled={creatingRoom}
                      className="bg-green-500 hover:bg-green-600 text-white gap-1">
                      <Play className="w-3.5 h-3.5" /> Play
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "lobby" && room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white mb-2">{room.quizTitle}</h1>
            <p className="text-purple-200">Share the code or link — players join on their own devices</p>
          </div>
          <div className="bg-white rounded-3xl p-8 text-center mb-6 shadow-2xl">
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Join Code</p>
            <div className="text-7xl font-black text-indigo-700 tracking-widest mb-4 font-mono">{roomCode}</div>
            <p className="text-gray-400 text-sm mb-4">
              Go to <span className="font-semibold text-indigo-600">{window.location.host}/quiz-join</span>
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={copyJoinLink} variant="outline" className="gap-2">
                <Copy className="w-4 h-4" /> Copy Link
              </Button>
              <Button onClick={() => window.open(joinUrl, "_blank")} variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" /> Open Join Page
              </Button>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-lg">{room.playerCount} player{room.playerCount !== 1 ? "s" : ""} in lobby</span>
            </div>
            {room.players.length === 0 ? (
              <p className="text-purple-300 text-sm">Waiting for players to join…</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {room.players.map(p => (
                  <motion.div key={p.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="bg-white/20 rounded-full px-4 py-1.5 text-white font-semibold text-sm">
                    {p.name}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={endGame} variant="outline" className="border-white/30 text-white hover:bg-white/20">
              Cancel
            </Button>
            <Button onClick={startGame} disabled={room.playerCount === 0}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-6 gap-2">
              <Play className="w-5 h-5" /> Start Game ({room.playerCount} player{room.playerCount !== 1 ? "s" : ""})
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "question" && room?.currentQ) {
    const q = room.currentQ;
    const answered = room.players.filter(p => p.answers.length > room.currentQuestion).length;
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-white/60 text-sm font-semibold">
            Question {room.currentQuestion + 1} of {room.totalQuestions}
          </div>
          <TimerRing seconds={timer} total={q.timeLimit} />
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Users className="w-4 h-4" />
            <span>{answered}/{room.playerCount} answered</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <motion.div key={room.currentQuestion} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 max-w-3xl w-full text-center mb-8">
            <p className="text-white text-2xl md:text-3xl font-bold leading-snug">{q.question}</p>
          </motion.div>
          <div className="grid grid-cols-2 gap-4 max-w-3xl w-full">
            {q.options.map((opt, i) => (
              <div key={i} className={`${ANSWER_COLOURS[i]} rounded-2xl p-5 text-white font-bold text-lg flex items-center gap-3 shadow-lg`}>
                <span className="text-2xl">{ANSWER_SHAPES[i]}</span>
                <span>{opt}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end">
          <Button onClick={advance} disabled={advancing}
            className="bg-white text-indigo-700 hover:bg-white/90 font-bold gap-2 px-8 py-3">
            {advancing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            Show Answer
          </Button>
        </div>
      </div>
    );
  }

  if (view === "reveal" && room?.currentQ) {
    const q = room.currentQ;
    const topPlayers = [...room.players].sort((a, b) => b.score - a.score).slice(0, 5);
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-green-500 rounded-2xl p-6 max-w-3xl w-full text-center mb-6 shadow-xl">
            <CheckCircle className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white/80 text-sm font-semibold mb-1">Correct Answer</p>
            <p className="text-white text-2xl font-bold">{q.options[q.correctIndex ?? 0]}</p>
          </motion.div>
          <div className="grid grid-cols-2 gap-3 max-w-3xl w-full mb-8">
            {q.options.map((opt, i) => (
              <div key={i} className={`rounded-xl p-4 flex items-center gap-3 font-bold text-white
                ${i === q.correctIndex ? "bg-green-500 ring-4 ring-white/50" : "bg-white/10 opacity-50"}`}>
                <span className="text-xl">{ANSWER_SHAPES[i]}</span>
                <span>{opt}</span>
                {i === q.correctIndex && <CheckCircle className="w-5 h-5 ml-auto" />}
              </div>
            ))}
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 max-w-3xl w-full">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Top Players
            </h3>
            <div className="space-y-2">
              {topPlayers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-white/60 w-5 text-sm font-bold">{i + 1}</span>
                  <div className="flex-1 bg-white/10 rounded-full h-8 overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center px-3"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (p.score / (topPlayers[0]?.score || 1)) * 100)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}>
                      <span className="text-white text-xs font-bold truncate">{p.name}</span>
                    </motion.div>
                  </div>
                  <span className="text-white font-bold text-sm w-16 text-right">{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end">
          <Button onClick={advance} disabled={advancing}
            className="bg-white text-indigo-700 hover:bg-white/90 font-bold gap-2 px-8 py-3">
            {advancing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            {room.currentQuestion + 1 >= room.totalQuestions ? "Final Results" : "Next Question"}
          </Button>
        </div>
      </div>
    );
  }

  if (view === "final" && room) {
    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    const podiumIcons = ["🥇", "🥈", "🥉"];
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3" />
            <h1 className="text-4xl font-black text-white">Final Results</h1>
            <p className="text-purple-200">{room.quizTitle}</p>
          </div>
          {sorted.length >= 1 && (
            <div className="flex items-end justify-center gap-4 mb-8">
              {[sorted[1], sorted[0], sorted[2]].filter(Boolean).map((p, i) => {
                const rank = i === 1 ? 0 : i === 0 ? 1 : 2;
                const heights = ["h-24", "h-32", "h-20"];
                return (
                  <motion.div key={p.id} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: rank * 0.15 }}
                    className={`flex flex-col items-center ${i === 1 ? "order-2" : i === 0 ? "order-1" : "order-3"}`}>
                    <div className="text-3xl mb-1">{podiumIcons[rank]}</div>
                    <div className="bg-white/20 rounded-t-xl px-6 py-3 text-center" style={{ minWidth: 80 }}>
                      <div className="text-white font-bold truncate max-w-[100px]">{p.name}</div>
                      <div className="font-black text-xl text-yellow-400">{p.score.toLocaleString()}</div>
                    </div>
                    <div className={`bg-white/10 w-full ${heights[rank]}`} />
                  </motion.div>
                );
              })}
            </div>
          )}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 mb-6">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sorted.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-1">
                  <span className="text-white/60 w-6 text-sm font-bold">{i + 1}</span>
                  <span className="flex-1 text-white font-semibold">{p.name}</span>
                  <span className="text-yellow-400 font-black">{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={endGame} className="w-full bg-white text-indigo-700 hover:bg-white/90 font-bold py-4 text-lg gap-2">
            <RotateCcw className="w-5 h-5" /> Play Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return null;
}
