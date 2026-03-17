/**
 * QuizBlast — Kahoot-style classroom quiz game (HOST screen)
 *
 * New features:
 *  - Difficulty tiers: Bronze / Silver / Gold per question
 *  - Digital rewards: badges awarded at end based on score/streak
 *  - Topic-based question selection with tier filtering
 *  - Performance: questions pre-loaded, no lag between screens
 *  - Richer final screen with individual badges per player
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Play, Trophy, Users, ChevronRight, RotateCcw,
  Zap, BookOpen, CheckCircle, ArrowLeft,
  Plus, Pencil, Copy, ExternalLink, RefreshCw,
  Star, Shield, Award, Flame, Crown, Medal,
  Target, Sparkles, Filter,
} from "lucide-react";
import InlineQuizBuilder from "@/components/InlineQuizBuilder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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

// ─── Difficulty Tier ──────────────────────────────────────────────────────────
type Tier = "bronze" | "silver" | "gold";

const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string; border: string; points: number; icon: React.ReactNode; emoji: string }> = {
  bronze: { label: "Bronze",  color: "text-amber-700",  bg: "bg-amber-100",  border: "border-amber-300",  points: 100, icon: <Shield className="w-4 h-4" />,  emoji: "🥉" },
  silver: { label: "Silver",  color: "text-slate-600",  bg: "bg-slate-100",  border: "border-slate-300",  points: 200, icon: <Star className="w-4 h-4" />,    emoji: "🥈" },
  gold:   { label: "Gold",    color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-300", points: 300, icon: <Crown className="w-4 h-4" />,   emoji: "🏆" },
};

// ─── Digital Badges ───────────────────────────────────────────────────────────
interface DigitalBadge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
}

const ALL_BADGES: DigitalBadge[] = [
  { id: "perfect",      name: "Perfect Score",    description: "Answered every question correctly",     emoji: "⭐", color: "bg-yellow-400" },
  { id: "gold_master",  name: "Gold Master",      description: "Answered 3+ Gold questions correctly",  emoji: "🏆", color: "bg-yellow-500" },
  { id: "silver_star",  name: "Silver Star",      description: "Answered 5+ Silver questions correctly", emoji: "🌟", color: "bg-slate-400" },
  { id: "bronze_start", name: "Bronze Badge",     description: "Completed the quiz",                    emoji: "🥉", color: "bg-amber-600" },
  { id: "hot_streak",   name: "Hot Streak",       description: "5 correct answers in a row",            emoji: "🔥", color: "bg-orange-500" },
  { id: "speed_demon",  name: "Speed Demon",      description: "Answered 3+ questions in under 5s",     emoji: "⚡", color: "bg-blue-500" },
  { id: "champion",     name: "Champion",         description: "Finished in 1st place",                 emoji: "👑", color: "bg-purple-500" },
  { id: "podium",       name: "Podium Finish",    description: "Finished in the top 3",                 emoji: "🎖️", color: "bg-indigo-500" },
  { id: "comeback",     name: "Comeback Kid",     description: "Scored in the bottom half then top half", emoji: "🚀", color: "bg-green-500" },
  { id: "participant",  name: "Participant",      description: "Completed the quiz",                    emoji: "🎮", color: "bg-gray-400" },
];

function awardBadges(player: RoomPlayer, rank: number, totalPlayers: number, questions: ApiQuestion[]): DigitalBadge[] {
  const badges: DigitalBadge[] = [];
  const correctAnswers = player.answers.filter(a => a === true).length;
  const totalAnswered = player.answers.filter(a => a !== null).length;

  if (totalAnswered === questions.length && correctAnswers === questions.length) badges.push(ALL_BADGES.find(b => b.id === "perfect")!);
  if (rank === 0) badges.push(ALL_BADGES.find(b => b.id === "champion")!);
  else if (rank <= 2 && totalPlayers >= 3) badges.push(ALL_BADGES.find(b => b.id === "podium")!);

  // Gold questions correct
  const goldCorrect = player.answers.filter((a, i) => a === true && questions[i]?.tier === "gold").length;
  if (goldCorrect >= 3) badges.push(ALL_BADGES.find(b => b.id === "gold_master")!);

  // Silver questions correct
  const silverCorrect = player.answers.filter((a, i) => a === true && questions[i]?.tier === "silver").length;
  if (silverCorrect >= 5) badges.push(ALL_BADGES.find(b => b.id === "silver_star")!);

  // Streak
  let maxStreak = 0, streak = 0;
  for (const a of player.answers) { if (a === true) { streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 0; }
  if (maxStreak >= 5) badges.push(ALL_BADGES.find(b => b.id === "hot_streak")!);

  if (badges.length === 0) badges.push(ALL_BADGES.find(b => b.id === "participant")!);
  return badges;
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
    tier?: Tier;
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

interface ApiQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
  tier: Tier;
}

function bankToApi(q: QuizQuestion, i: number, tier: Tier): ApiQuestion {
  return {
    id: `q-${i}`,
    question: q.q,
    options: q.options as unknown as string[],
    correctIndex: q.answer,
    timeLimit: tier === "gold" ? 30 : tier === "silver" ? 25 : 20,
    tier,
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

// Assign tiers to questions: first third = bronze, middle = silver, last third = gold
function assignTiers(questions: QuizQuestion[]): { q: QuizQuestion; tier: Tier }[] {
  const n = questions.length;
  return questions.map((q, i) => ({
    q,
    tier: i < n / 3 ? "bronze" : i < (2 * n) / 3 ? "silver" : "gold",
  }));
}

// Build a mixed-tier set from a category
function buildMixedTierSet(cat: QuizCategory, count = 15): ApiQuestion[] {
  const withTiers = assignTiers(cat.questions);
  const bronze = shuffle(withTiers.filter(x => x.tier === "bronze")).slice(0, Math.ceil(count * 0.4));
  const silver = shuffle(withTiers.filter(x => x.tier === "silver")).slice(0, Math.ceil(count * 0.4));
  const gold   = shuffle(withTiers.filter(x => x.tier === "gold")).slice(0, Math.ceil(count * 0.2));
  const all = shuffle([...bronze, ...silver, ...gold]).slice(0, count);
  return all.map((x, i) => bankToApi(x.q, i, x.tier));
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

// ─── Tier Badge component ─────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: Tier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuizGame() {
  const [, navigate] = useLocation();

  type View = "home" | "subject" | "category" | "custom-list" | "builder" | "lobby" | "question" | "reveal" | "final";
  const [view, setView] = useState<View>("home");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<Tier | "all">("all");
  const [customQuizzes, setCustomQuizzes] = useState<CustomQuiz[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [builderEditId, setBuilderEditId] = useState<string | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<ApiQuestion[]>([]);

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
    setCurrentQuestions(questions);
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
    const qs = buildMixedTierSet(cat, 15);
    await createRoom(qs, `${cat.title} — ${selectedTierFilter === "all" ? "Mixed Difficulty" : TIER_CONFIG[selectedTierFilter].label}`);
  }

  async function startFromCustom(quizId: string) {
    try {
      const res = await fetch(`/api/quiz/custom/${quizId}`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Quiz not found");
      const quiz = await res.json();
      // Assign tiers to custom quiz questions
      const withTiers = quiz.questions.map((q: ApiQuestion, i: number) => ({
        ...q,
        tier: (i < quiz.questions.length / 3 ? "bronze" : i < (2 * quiz.questions.length) / 3 ? "silver" : "gold") as Tier,
        timeLimit: q.timeLimit || 20,
      }));
      await createRoom(withTiers, quiz.title);
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
    setRoom(null); setRoomCode(""); setView("home"); setCurrentQuestions([]);
  }

  function copyJoinLink() {
    const url = `${window.location.origin}/quiz-join/${roomCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Join link copied!");
  }

  const joinUrl = roomCode ? `${window.location.origin}/quiz-join/${roomCode}` : "";

  // ─── Categories filtered by tier ─────────────────────────────────────────────
  const filteredCategories = useMemo(() => {
    const cats = getCategoriesBySubject(selectedSubject);
    return cats;
  }, [selectedSubject]);

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
            {/* Tier legend */}
            <div className="flex items-center justify-center gap-3 mt-4">
              {(["bronze", "silver", "gold"] as Tier[]).map(t => (
                <span key={t} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${TIER_CONFIG[t].bg} ${TIER_CONFIG[t].color} ${TIER_CONFIG[t].border} border`}>
                  {TIER_CONFIG[t].emoji} {TIER_CONFIG[t].label} — {TIER_CONFIG[t].points} pts
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setView("subject")}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 text-left hover:bg-white/20 transition-all">
              <BookOpen className="w-10 h-10 text-yellow-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Pre-built Quizzes</h2>
              <p className="text-purple-200">590+ questions across Maths, English, Science, History, Geography &amp; French — with Bronze, Silver &amp; Gold difficulty tiers</p>
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { loadCustomQuizzes(); setView("custom-list"); }}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 text-left hover:bg-white/20 transition-all">
              <Plus className="w-10 h-10 text-green-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">My Quizzes</h2>
              <p className="text-purple-200">Create your own quiz, upload a document, or edit saved quizzes</p>
            </motion.button>
          </div>
          {/* Badges preview */}
          <div className="mt-8 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-bold">Digital Rewards</h3>
              <span className="text-purple-300 text-sm ml-1">— students earn badges based on performance</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_BADGES.slice(0, 6).map(b => (
                <div key={b.id} className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                  <span>{b.emoji}</span>
                  <span className="text-white text-xs font-semibold">{b.name}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                <span className="text-purple-300 text-xs">+{ALL_BADGES.length - 6} more</span>
              </div>
            </div>
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
            {SUBJECTS.map(subj => {
              const cats = getCategoriesBySubject(subj);
              const totalQs = cats.reduce((s, c) => s + c.questions.length, 0);
              return (
                <motion.button key={subj} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => { setSelectedSubject(subj); setView("category"); }}
                  className={`bg-gradient-to-br ${SUBJECT_COLOURS[subj] || "from-gray-600 to-gray-800"} rounded-2xl p-6 text-white font-bold text-xl text-left shadow-lg`}>
                  {subj}
                  <div className="text-sm font-normal opacity-80 mt-1">{cats.length} topics · {totalQs} questions</div>
                  <div className="flex gap-1 mt-2">
                    {(["bronze", "silver", "gold"] as Tier[]).map(t => (
                      <span key={t} className="text-xs opacity-70">{TIER_CONFIG[t].emoji}</span>
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (view === "category") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setView("subject")} className="flex items-center gap-2 text-purple-200 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black text-white">{selectedSubject} — Choose a Topic</h2>
          </div>
          {/* Difficulty info */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm font-semibold">Mixed Difficulty Mode</span>
            </div>
            <p className="text-purple-200 text-xs">Each quiz contains a mix of Bronze (easy), Silver (medium), and Gold (hard) questions. Points awarded: 🥉 100 · 🥈 200 · 🏆 300</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCategories.map(cat => {
              const withTiers = assignTiers(cat.questions);
              const bronzeCount = withTiers.filter(x => x.tier === "bronze").length;
              const silverCount = withTiers.filter(x => x.tier === "silver").length;
              const goldCount   = withTiers.filter(x => x.tier === "gold").length;
              return (
                <motion.button key={cat.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => startFromCategory(cat)}
                  disabled={creatingRoom}
                  className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-5 text-left hover:bg-white/20 transition-all disabled:opacity-50">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{cat.emoji}</span>
                    <div className="flex-1">
                      <div className="font-bold text-white text-lg">{cat.title}</div>
                      <div className="text-purple-200 text-sm mb-2">{cat.questions.length} questions</div>
                      <div className="flex gap-2">
                        <span className="text-xs bg-amber-900/50 text-amber-300 rounded px-1.5 py-0.5">🥉 {bronzeCount}</span>
                        <span className="text-xs bg-slate-800/50 text-slate-300 rounded px-1.5 py-0.5">🥈 {silverCount}</span>
                        <span className="text-xs bg-yellow-900/50 text-yellow-300 rounded px-1.5 py-0.5">🏆 {goldCount}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-300 mt-1" />
                  </div>
                </motion.button>
              );
            })}
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
            <Button onClick={() => setView("builder")} className="bg-green-500 hover:bg-green-600 text-white gap-2">
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
              <Button onClick={() => setView("builder")} className="bg-green-500 hover:bg-green-600 text-white gap-2">
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
                    <div className="flex gap-1 mt-1">
                      {(["bronze", "silver", "gold"] as Tier[]).map(t => (
                        <span key={t} className="text-xs opacity-60">{TIER_CONFIG[t].emoji}</span>
                      ))}
                      <span className="text-xs text-purple-300 ml-1">Auto-assigned tiers</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setBuilderEditId(quiz.id); setView("builder"); }} variant="outline"
                      className="border-white/30 text-white hover:bg-white/20 gap-1">
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button size="sm" onClick={() => startFromCustom(quiz.id)} disabled={creatingRoom}
                      className="bg-green-500 hover:bg-green-600 text-white gap-1">
                      <Play className="w-3.5 h-5" /> Play
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

  if (view === "builder") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => { setBuilderEditId(null); loadCustomQuizzes(); setView("custom-list"); }}
            className="flex items-center gap-2 text-purple-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to My Quizzes
          </button>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <InlineQuizBuilder
              editId={builderEditId}
              onSaved={() => { setBuilderEditId(null); loadCustomQuizzes(); setView("custom-list"); }}
              onCancel={() => { setBuilderEditId(null); setView("custom-list"); }}
            />
          </div>
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
            <div className="flex items-center justify-center gap-2 mt-3">
              {(["bronze", "silver", "gold"] as Tier[]).map(t => (
                <span key={t} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${TIER_CONFIG[t].bg} ${TIER_CONFIG[t].color}`}>
                  {TIER_CONFIG[t].emoji} {TIER_CONFIG[t].label}
                </span>
              ))}
            </div>
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
    const tier = (q as any).tier as Tier | undefined;
    const answered = room.players.filter(p => p.answers.length > room.currentQuestion).length;
    const progress = ((room.currentQuestion) / room.totalQuestions) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
        {/* Progress bar */}
        <div className="h-1.5 bg-white/10">
          <motion.div className="h-full bg-yellow-400" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-white/60 text-sm font-semibold">
              Q{room.currentQuestion + 1}/{room.totalQuestions}
            </div>
            {tier && <TierBadge tier={tier} />}
          </div>
          <TimerRing seconds={timer} total={q.timeLimit} />
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Users className="w-4 h-4" />
            <span>{answered}/{room.playerCount} answered</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <AnimatePresence mode="wait">
            <motion.div key={room.currentQuestion} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 max-w-3xl w-full text-center mb-8">
              {tier && (
                <div className="mb-3">
                  <TierBadge tier={tier} />
                  <span className="text-purple-300 text-xs ml-2">+{TIER_CONFIG[tier].points} pts for correct answer</span>
                </div>
              )}
              <p className="text-white text-2xl md:text-3xl font-bold leading-snug">{q.question}</p>
            </motion.div>
          </AnimatePresence>
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
    const tier = (q as any).tier as Tier | undefined;
    const topPlayers = [...room.players].sort((a, b) => b.score - a.score).slice(0, 5);
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-green-500 rounded-2xl p-6 max-w-3xl w-full text-center mb-6 shadow-xl">
            <CheckCircle className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white/80 text-sm font-semibold mb-1">Correct Answer</p>
            <p className="text-white text-2xl font-bold">{q.options[q.correctIndex ?? 0]}</p>
            {tier && (
              <div className="mt-2">
                <TierBadge tier={tier} />
                <span className="text-white/70 text-xs ml-2">+{TIER_CONFIG[tier].points} pts</span>
              </div>
            )}
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
                  {p.streak >= 3 && <Flame className="w-4 h-4 text-orange-400" title={`${p.streak} streak`} />}
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6 overflow-y-auto">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3" />
            <h1 className="text-4xl font-black text-white">Final Results</h1>
            <p className="text-purple-200">{room.quizTitle}</p>
          </div>
          {/* Podium */}
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
          {/* Full leaderboard */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 mb-6">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Medal className="w-4 h-4 text-yellow-400" /> Full Leaderboard
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sorted.map((p, i) => {
                const badges = awardBadges(p, i, sorted.length, currentQuestions);
                return (
                  <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-white/10 last:border-0">
                    <span className="text-white/60 w-6 text-sm font-bold">{i + 1}</span>
                    <span className="flex-1 text-white font-semibold">{p.name}</span>
                    <div className="flex gap-1">
                      {badges.slice(0, 3).map(b => (
                        <span key={b.id} title={b.name} className="text-base">{b.emoji}</span>
                      ))}
                    </div>
                    <span className="text-yellow-400 font-black">{p.score.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Digital Rewards section */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5 mb-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" /> Digital Rewards
            </h3>
            <div className="space-y-4">
              {sorted.map((p, i) => {
                const badges = awardBadges(p, i, sorted.length, currentQuestions);
                return (
                  <div key={p.id}>
                    <div className="text-white/80 text-sm font-semibold mb-1.5">{p.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {badges.map(b => (
                        <motion.div key={b.id} initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className={`${b.color} rounded-xl px-3 py-2 flex items-center gap-2`}>
                          <span className="text-xl">{b.emoji}</span>
                          <div>
                            <div className="text-white text-xs font-bold">{b.name}</div>
                            <div className="text-white/70 text-[10px]">{b.description}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
