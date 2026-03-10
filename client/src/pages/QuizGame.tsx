import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Trophy,
  Users,
  Clock,
  ChevronRight,
  RotateCcw,
  Star,
  Zap,
  BookOpen,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import {
  QUIZ_BANK,
  SUBJECTS,
  getCategoriesBySubject,
  getCategoryById,
  type QuizCategory,
  type QuizQuestion,
} from "../lib/quiz-bank";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  answers: (boolean | null)[];
}

type GamePhase =
  | "subject-select"
  | "category-select"
  | "player-setup"
  | "question"
  | "answer-reveal"
  | "leaderboard"
  | "final";

const QUESTION_TIME = 20; // seconds per question
const POINTS_BASE = 100;
const STREAK_BONUS = 50;

const SUBJECT_COLOURS: Record<string, string> = {
  Maths: "from-blue-500 to-blue-700",
  English: "from-purple-500 to-purple-700",
  Science: "from-green-500 to-green-700",
  History: "from-amber-500 to-amber-700",
  Geography: "from-teal-500 to-teal-700",
  French: "from-rose-500 to-rose-700",
};

const ANSWER_COLOURS = [
  "bg-red-500 hover:bg-red-600",
  "bg-blue-500 hover:bg-blue-600",
  "bg-yellow-500 hover:bg-yellow-600",
  "bg-green-500 hover:bg-green-600",
];

const ANSWER_LETTERS = ["A", "B", "C", "D"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const pct = seconds / total;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const colour =
    pct > 0.5 ? "#22c55e" : pct > 0.25 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      <span className="text-2xl font-bold" style={{ color: colour }}>
        {seconds}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuizGame() {
  const [phase, setPhase] = useState<GamePhase>("subject-select");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [playerAnswers, setPlayerAnswers] = useState<Record<string, number>>({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Timer ──────────────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const revealAnswer = useCallback(() => {
    stopTimer();
    const q = questions[currentQ];
    // Score players
    setPlayers(prev =>
      prev.map(p => {
        const ans = playerAnswers[p.id];
        const correct = ans === q.answer;
        const newStreak = correct ? p.streak + 1 : 0;
        const bonus = correct ? POINTS_BASE + (newStreak > 1 ? STREAK_BONUS * (newStreak - 1) : 0) : 0;
        return {
          ...p,
          score: p.score + bonus,
          streak: newStreak,
          answers: [...p.answers, correct],
        };
      })
    );
    setPhase("answer-reveal");
  }, [questions, currentQ, playerAnswers, stopTimer]);

  useEffect(() => {
    if (phase !== "question") return;
    setTimeLeft(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          revealAnswer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, currentQ, revealAnswer, stopTimer]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function startGame() {
    if (!selectedCategory) return;
    const qs = shuffle(selectedCategory.questions).slice(0, 10);
    setQuestions(qs);
    setCurrentQ(0);
    setPlayerAnswers({});
    setSelectedAnswer(null);
    setPhase("question");
  }

  function handleAnswer(optionIdx: number) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(optionIdx);
    // In single-device mode, record for the "active" player (first one)
    if (players.length > 0) {
      setPlayerAnswers(prev => ({ ...prev, [players[0].id]: optionIdx }));
    }
  }

  function handlePlayerAnswer(playerId: string, optionIdx: number) {
    setPlayerAnswers(prev => ({ ...prev, [playerId]: optionIdx }));
  }

  function nextQuestion() {
    const next = currentQ + 1;
    if (next >= questions.length) {
      setPhase("final");
    } else {
      setCurrentQ(next);
      setPlayerAnswers({});
      setSelectedAnswer(null);
      setPhase("question");
    }
  }

  function addPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;
    setPlayers(prev => [
      ...prev,
      { id: generateId(), name, score: 0, streak: 0, answers: [] },
    ]);
    setNewPlayerName("");
  }

  function removePlayer(id: string) {
    setPlayers(prev => prev.filter(p => p.id !== id));
  }

  function resetGame() {
    setPhase("subject-select");
    setSelectedSubject("");
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentQ(0);
    setPlayers([]);
    setPlayerAnswers({});
    setSelectedAnswer(null);
    setShowLeaderboard(false);
  }

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // ── Render phases ──────────────────────────────────────────────────────────

  // 1. Subject Select
  if (phase === "subject-select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Zap className="w-10 h-10 text-yellow-400" />
              <h1 className="text-4xl font-extrabold text-white">QuizBlast</h1>
            </div>
            <p className="text-slate-400 text-lg">Classroom quiz game — choose a subject to begin</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SUBJECTS.map(subject => {
              const cats = getCategoriesBySubject(subject);
              const gradient = SUBJECT_COLOURS[subject] || "from-slate-500 to-slate-700";
              const emoji = cats[0]?.emoji || "📚";
              return (
                <button
                  key={subject}
                  onClick={() => { setSelectedSubject(subject); setPhase("category-select"); }}
                  className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white text-left hover:scale-105 transition-transform shadow-lg`}
                >
                  <div className="text-4xl mb-3">{emoji}</div>
                  <div className="text-xl font-bold">{subject}</div>
                  <div className="text-sm opacity-80 mt-1">{cats.length} categories</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. Category Select
  if (phase === "category-select") {
    const cats = getCategoriesBySubject(selectedSubject);
    const gradient = SUBJECT_COLOURS[selectedSubject] || "from-slate-500 to-slate-700";
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setPhase("subject-select")}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to subjects
          </button>
          <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 mb-8 text-white`}>
            <h2 className="text-3xl font-extrabold">{selectedSubject}</h2>
            <p className="opacity-80 mt-1">Select a category</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cats.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat); setPhase("player-setup"); }}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-5 text-left text-white transition-colors flex items-center gap-4"
              >
                <span className="text-3xl">{cat.emoji}</span>
                <div>
                  <div className="font-bold text-lg">{cat.title}</div>
                  <div className="text-slate-400 text-sm">{cat.questions.length} questions</div>
                </div>
                <ChevronRight className="ml-auto text-slate-500 w-5 h-5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Player Setup
  if (phase === "player-setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setPhase("category-select")}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">{selectedCategory?.emoji}</div>
            <h2 className="text-3xl font-extrabold text-white">{selectedCategory?.title}</h2>
            <p className="text-slate-400 mt-2">Add players or play solo</p>
          </div>

          {/* Add player */}
          <div className="bg-slate-800 rounded-xl p-5 mb-4 border border-slate-700">
            <label className="block text-slate-300 font-semibold mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" /> Add Players
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addPlayer()}
                placeholder="Enter player name..."
                className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={addPlayer}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Player list */}
          {players.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-5 mb-6 border border-slate-700">
              <div className="space-y-2">
                {players.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-700 rounded-lg px-4 py-2">
                    <span className="text-white font-medium">
                      <span className="text-slate-400 mr-2">#{i + 1}</span>{p.name}
                    </span>
                    <button
                      onClick={() => removePlayer(p.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-extrabold text-xl py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg"
          >
            <Play className="w-6 h-6" />
            {players.length === 0 ? "Play Solo" : `Start Game (${players.length} player${players.length > 1 ? "s" : ""})`}
          </button>
        </div>
      </div>
    );
  }

  // 4. Question
  if (phase === "question" && questions[currentQ]) {
    const q = questions[currentQ];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 max-w-3xl mx-auto w-full">
          <div className="text-slate-400 font-semibold">
            Question {currentQ + 1} / {questions.length}
          </div>
          <TimerRing seconds={timeLeft} total={QUESTION_TIME} />
          <div className="flex items-center gap-2 text-slate-400">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm">{selectedCategory?.title}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-3xl mx-auto w-full mb-6">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <div className="bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-700 text-center">
            <p className="text-white text-2xl font-bold leading-snug">{q.q}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={selectedAnswer !== null}
                className={`${ANSWER_COLOURS[i]} text-white font-bold text-lg py-5 px-6 rounded-xl flex items-center gap-3 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">
                  {ANSWER_LETTERS[i]}
                </span>
                {opt}
              </button>
            ))}
          </div>

          {/* Multi-player answer buttons */}
          {players.length > 1 && (
            <div className="mt-6 bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 text-sm font-semibold mb-3">Player answers:</p>
              <div className="space-y-2">
                {players.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-white text-sm w-28 truncate">{p.name}</span>
                    <div className="flex gap-1">
                      {q.options.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePlayerAnswer(p.id, i)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            playerAnswers[p.id] === i
                              ? "bg-blue-500 text-white"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          {ANSWER_LETTERS[i]}
                        </button>
                      ))}
                    </div>
                    {playerAnswers[p.id] !== undefined && (
                      <span className="text-green-400 text-xs">✓</span>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={revealAnswer}
                className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition-colors"
              >
                Reveal Answer
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5. Answer Reveal
  if (phase === "answer-reveal" && questions[currentQ]) {
    const q = questions[currentQ];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full">
          {/* Correct answer highlight */}
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
            <h2 className="text-2xl font-extrabold text-white mb-1">Correct Answer</h2>
            <div className={`${ANSWER_COLOURS[q.answer].split(" ")[0]} text-white font-bold text-xl py-4 px-6 rounded-xl inline-flex items-center gap-3 mt-2`}>
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">
                {ANSWER_LETTERS[q.answer]}
              </span>
              {q.options[q.answer]}
            </div>
          </div>

          {/* Player results */}
          {players.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-5 mb-6 border border-slate-700">
              <div className="space-y-2">
                {players.map(p => {
                  const ans = playerAnswers[p.id];
                  const correct = ans === q.answer;
                  const unanswered = ans === undefined;
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-slate-700 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        {unanswered ? (
                          <Clock className="w-5 h-5 text-slate-400" />
                        ) : correct ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className="text-white font-medium">{p.name}</span>
                        {p.streak > 1 && (
                          <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
                            🔥 {p.streak}x
                          </span>
                        )}
                      </div>
                      <span className="text-yellow-400 font-bold">{p.score.toLocaleString()} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={nextQuestion}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-lg py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            {currentQ + 1 >= questions.length ? (
              <>
                <Trophy className="w-5 h-5" /> See Final Results
              </>
            ) : (
              <>
                Next Question <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // 6. Final Leaderboard
  if (phase === "final") {
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-4xl font-extrabold text-white">Final Results</h2>
            <p className="text-slate-400 mt-2">{selectedCategory?.title} — {questions.length} questions</p>
          </div>

          {players.length > 0 ? (
            <div className="space-y-3 mb-8">
              {sortedPlayers.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 rounded-xl p-4 border ${
                    i === 0
                      ? "bg-yellow-500/10 border-yellow-500/50"
                      : i === 1
                      ? "bg-slate-400/10 border-slate-400/50"
                      : i === 2
                      ? "bg-amber-700/10 border-amber-700/50"
                      : "bg-slate-800 border-slate-700"
                  }`}
                >
                  <span className="text-3xl w-10 text-center">{medals[i] || `#${i + 1}`}</span>
                  <div className="flex-1">
                    <div className="text-white font-bold text-lg">{p.name}</div>
                    <div className="flex gap-3 mt-1">
                      {p.answers.map((a, qi) => (
                        <span key={qi} className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${a ? "bg-green-500" : "bg-red-500"}`}>
                          {a ? "✓" : "✗"}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-extrabold text-xl">{p.score.toLocaleString()}</div>
                    <div className="text-slate-400 text-xs">points</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700 text-center">
              <Star className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <p className="text-white text-xl font-bold">Quiz Complete!</p>
              <p className="text-slate-400 mt-1">You answered {questions.length} questions</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setPhase("player-setup"); setPlayers(prev => prev.map(p => ({ ...p, score: 0, streak: 0, answers: [] }))); }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
            <button
              onClick={resetGame}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <BookOpen className="w-4 h-4" /> New Category
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
