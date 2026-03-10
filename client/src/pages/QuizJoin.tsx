/**
 * QuizBlast — Player Join Screen (public, no auth required)
 *
 * Players visit /quiz-join or /quiz-join/:code, enter their name,
 * then answer questions in real-time on their own device.
 */
import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { Zap, CheckCircle, XCircle, Trophy, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
  players: { id: string; name: string; score: number; streak: number; answers: (boolean | null)[]; }[];
  playerCount: number;
}

const ANSWER_COLOURS = [
  "bg-red-500 hover:bg-red-600 active:bg-red-700",
  "bg-blue-500 hover:bg-blue-600 active:bg-blue-700",
  "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700",
  "bg-green-500 hover:bg-green-600 active:bg-green-700",
];
const ANSWER_SHAPES = ["▲", "◆", "●", "■"];

function TimerBar({ seconds, total }: { seconds: number; total: number }) {
  const pct = total > 0 ? seconds / total : 0;
  const colour = pct > 0.5 ? "bg-green-400" : pct > 0.25 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
      <div className={`h-full ${colour} rounded-full transition-all duration-1000`} style={{ width: `${pct * 100}%` }} />
    </div>
  );
}

export default function QuizJoin() {
  const [, params] = useRoute("/quiz-join/:code");
  const urlCode = params?.code || "";

  const [codeInput, setCodeInput] = useState(urlCode);
  const [nameInput, setNameInput] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [joinedCode, setJoinedCode] = useState("");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [joining, setJoining] = useState(false);
  const [lastAnswerIndex, setLastAnswerIndex] = useState<number | null>(null);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [prevQuestion, setPrevQuestion] = useState(-1);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll room state
  async function pollRoom(code: string) {
    try {
      const res = await fetch(`/api/quiz/rooms/${code}`);
      if (!res.ok) { stopPolling(); setRoom(null); return; }
      const data: RoomState = await res.json();
      setRoom(data);
      // Reset answered flag when question changes
      if (data.currentQuestion !== prevQuestion) {
        setPrevQuestion(data.currentQuestion);
        setHasAnswered(false);
        setLastAnswerIndex(null);
        setLastAnswerCorrect(null);
      }
    } catch {}
  }

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
    if (room?.phase === "question" && room.currentQ) {
      const limit = room.currentQ.timeLimit || 20;
      const elapsed = room.questionStartedAt ? Math.floor((Date.now() - room.questionStartedAt) / 1000) : 0;
      const remaining = Math.max(0, limit - elapsed);
      setTimer(remaining);
      if (remaining > 0) {
        timerRef.current = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [room?.phase, room?.currentQuestion]);

  useEffect(() => () => { stopPolling(); }, []);

  async function handleJoin() {
    const code = codeInput.trim();
    const name = nameInput.trim();
    if (!code || code.length !== 6) { toast.error("Enter a valid 6-digit code"); return; }
    if (!name) { toast.error("Enter your name"); return; }
    setJoining(true);
    try {
      const res = await fetch(`/api/quiz/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Could not join"); return; }
      setPlayerId(data.playerId);
      setJoinedCode(code);
      await pollRoom(code);
      startPolling(code);
    } catch { toast.error("Network error. Try again."); }
    finally { setJoining(false); }
  }

  async function handleAnswer(optionIndex: number) {
    if (hasAnswered || !joinedCode || !playerId) return;
    setHasAnswered(true);
    setLastAnswerIndex(optionIndex);
    try {
      const res = await fetch(`/api/quiz/rooms/${joinedCode}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, answerIndex: optionIndex }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastAnswerCorrect(data.correct);
        setScore(data.score);
        setStreak(data.streak);
      }
    } catch {}
  }

  // ─── Not joined yet ───────────────────────────────────────────────────────
  if (!playerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
          <div className="text-center mb-6">
            <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
            <h1 className="text-3xl font-black text-indigo-700">QuizBlast</h1>
            <p className="text-gray-500 mt-1">Enter the code from your teacher</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1 block">Game Code</label>
              <Input
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-3xl font-black tracking-widest h-14 border-2 border-indigo-200 focus:border-indigo-500"
                maxLength={6}
                onKeyDown={e => e.key === "Enter" && nameInput && handleJoin()}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1 block">Your Name</label>
              <Input
                value={nameInput}
                onChange={e => setNameInput(e.target.value.slice(0, 30))}
                placeholder="Enter your name"
                className="h-12 border-2 border-indigo-200 focus:border-indigo-500"
                onKeyDown={e => e.key === "Enter" && codeInput.length === 6 && handleJoin()}
              />
            </div>
            <Button onClick={handleJoin} disabled={joining || codeInput.length !== 6 || !nameInput.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 text-lg gap-2">
              {joining ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              Join Game
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Lobby ────────────────────────────────────────────────────────────────
  if (room?.phase === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
        <div className="text-center">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2">{room.quizTitle}</h1>
          <p className="text-purple-200 mb-6">You're in! Waiting for the teacher to start…</p>
          <div className="bg-white/10 rounded-2xl px-8 py-4 inline-block mb-4">
            <p className="text-white/60 text-sm">Playing as</p>
            <p className="text-white text-2xl font-black">{nameInput}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-purple-200">
            <Users className="w-4 h-4" />
            <span>{room.playerCount} player{room.playerCount !== 1 ? "s" : ""} waiting</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Question ─────────────────────────────────────────────────────────────
  if (room?.phase === "question" && room.currentQ) {
    const q = room.currentQ;
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Q{room.currentQuestion + 1}/{room.totalQuestions}</span>
            <span className="text-white font-bold text-lg">{timer}s</span>
            <span className="text-yellow-400 font-bold">{score.toLocaleString()} pts</span>
          </div>
          <TimerBar seconds={timer} total={q.timeLimit} />
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col px-4">
          <AnimatePresence mode="wait">
            <motion.div key={room.currentQuestion} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 my-4 text-center">
              <p className="text-white text-xl font-bold leading-snug">{q.question}</p>
            </motion.div>
          </AnimatePresence>

          {/* Answer buttons */}
          {!hasAnswered ? (
            <div className="grid grid-cols-2 gap-3 mt-auto mb-6">
              {q.options.map((opt, i) => (
                <motion.button key={i} whileTap={{ scale: 0.95 }}
                  onClick={() => handleAnswer(i)}
                  className={`${ANSWER_COLOURS[i]} rounded-2xl p-4 text-white font-bold text-base flex flex-col items-center gap-2 shadow-lg min-h-[80px] justify-center`}>
                  <span className="text-2xl">{ANSWER_SHAPES[i]}</span>
                  <span className="text-center leading-tight">{opt}</span>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center mb-6">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-center bg-white/10 rounded-2xl p-8 w-full max-w-xs">
                {lastAnswerCorrect === null ? (
                  <>
                    <RefreshCw className="w-10 h-10 text-white/60 animate-spin mx-auto mb-3" />
                    <p className="text-white font-bold">Submitting…</p>
                  </>
                ) : lastAnswerCorrect ? (
                  <>
                    <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-3" />
                    <p className="text-white text-xl font-black">Correct! 🎉</p>
                    {streak > 1 && <p className="text-yellow-400 font-bold mt-1">🔥 {streak} streak!</p>}
                    <p className="text-white/60 mt-2">{score.toLocaleString()} points</p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-14 h-14 text-red-400 mx-auto mb-3" />
                    <p className="text-white text-xl font-black">Not quite!</p>
                    <p className="text-white/60 mt-2">Waiting for next question…</p>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Reveal ───────────────────────────────────────────────────────────────
  if (room?.phase === "reveal" && room.currentQ) {
    const q = room.currentQ;
    const myPlayer = room.players.find(p => p.id === playerId);
    const myRank = myPlayer ? room.players.sort((a, b) => b.score - a.score).findIndex(p => p.id === playerId) + 1 : null;
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm w-full">
          {lastAnswerCorrect === true ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
              <p className="text-white text-2xl font-black mb-1">Correct! 🎉</p>
              {streak > 1 && <p className="text-yellow-400 font-bold mb-2">🔥 {streak} streak!</p>}
            </motion.div>
          ) : lastAnswerCorrect === false ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
              <p className="text-white text-2xl font-black mb-1">Not quite!</p>
              <p className="text-white/60 mb-2">The correct answer was:</p>
              <p className="text-green-400 font-bold text-lg">{q.options[q.correctIndex ?? 0]}</p>
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-10 h-10 text-white/40" />
              </div>
              <p className="text-white text-xl font-bold">Time's up!</p>
            </motion.div>
          )}
          <div className="bg-white/10 rounded-2xl p-5 mt-6">
            <p className="text-white/60 text-sm">Your score</p>
            <p className="text-yellow-400 text-4xl font-black">{score.toLocaleString()}</p>
            {myRank && <p className="text-white/60 text-sm mt-1">#{myRank} of {room.playerCount}</p>}
          </div>
          <p className="text-purple-200 mt-4 text-sm">Waiting for next question…</p>
        </div>
      </div>
    );
  }

  // ─── Final ────────────────────────────────────────────────────────────────
  if (room?.phase === "ended") {
    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex(p => p.id === playerId) + 1;
    const podiumIcons = ["🥇", "🥈", "🥉"];
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm w-full text-center">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3" />
          <h1 className="text-3xl font-black text-white mb-1">Game Over!</h1>
          <p className="text-purple-200 mb-6">{room.quizTitle}</p>
          {myRank <= 3 && <p className="text-4xl mb-4">{podiumIcons[myRank - 1]}</p>}
          <div className="bg-white/10 rounded-2xl p-5 mb-6">
            <p className="text-white/60 text-sm">Your final score</p>
            <p className="text-yellow-400 text-5xl font-black">{score.toLocaleString()}</p>
            <p className="text-white/60 mt-1">#{myRank} of {room.playerCount}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 text-left">
            <p className="text-white font-bold mb-3 text-sm">Final Leaderboard</p>
            <div className="space-y-2">
              {sorted.slice(0, 10).map((p, i) => (
                <div key={p.id} className={`flex items-center gap-3 py-1 ${p.id === playerId ? "text-yellow-400" : "text-white"}`}>
                  <span className="w-5 text-sm font-bold opacity-60">{i + 1}</span>
                  <span className="flex-1 font-semibold truncate">{p.name}{p.id === playerId ? " (you)" : ""}</span>
                  <span className="font-black">{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Room not found / expired ─────────────────────────────────────────────
  if (playerId && !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-white text-xl font-bold mb-2">Room not found or game ended</p>
          <p className="text-purple-200 mb-6">Ask your teacher for a new code</p>
          <Button onClick={() => { setPlayerId(""); setJoinedCode(""); setRoom(null); }}
            className="bg-white text-indigo-700 hover:bg-white/90 font-bold">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
