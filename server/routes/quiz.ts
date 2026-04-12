/**
 * QuizBlast Backend Routes
 *
 * GET    /api/quiz/custom              — list school's custom quizzes
 * POST   /api/quiz/custom              — create a custom quiz
 * PUT    /api/quiz/custom/:id          — update a custom quiz
 * DELETE /api/quiz/custom/:id          — delete a custom quiz
 * POST   /api/quiz/generate-from-doc   — upload PDF/Word and AI-generate quiz
 * POST   /api/quiz/rooms               — create a room (returns 6-digit code)
 * GET    /api/quiz/rooms/:code         — get room state (for polling)
 * POST   /api/quiz/rooms/:code/join    — player joins room
 * POST   /api/quiz/rooms/:code/start   — host starts game
 * POST   /api/quiz/rooms/:code/answer  — player submits answer
 * POST   /api/quiz/rooms/:code/next    — host advances to next question
 * DELETE /api/quiz/rooms/:code         — host ends/closes room
 */
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { randomBytes } from "crypto";
import multer from "multer";
import fs from "fs";
import path from "path";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { z } from "zod";

// Zod schema for AI-generated quiz questions (generate-from-doc route)
const GeneratedQuizQuestionSchema = z.object({
  question: z.string().min(1).max(1000),
  options: z.array(z.string().min(1).max(500)).length(4),
  correctIndex: z.number().int().min(0).max(3),
});
const GeneratedQuizArraySchema = z.array(GeneratedQuizQuestionSchema).min(1).max(50);

const router = Router();
const upload = multer({ dest: "/tmp/quiz-uploads/", limits: { fileSize: 20 * 1024 * 1024 } });

// ─── In-memory room store (fast, no DB needed for ephemeral game sessions) ────
interface RoomPlayer {
  id: string;
  name: string;
  score: number;
  streak: number;
  answers: (boolean | null)[];
  answeredAt?: number; // timestamp for speed bonus
}
interface RoomQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
}
interface Room {
  code: string;
  hostId: string;
  schoolId: string;
  quizTitle: string;
  questions: RoomQuestion[];
  players: Record<string, RoomPlayer>;
  phase: "lobby" | "question" | "reveal" | "leaderboard" | "ended";
  currentQuestion: number;
  questionStartedAt?: number;
  autoAdvancedAt?: number;
  createdAt: number;
}

const rooms: Record<string, Room> = {};

// Clean up rooms older than 4 hours
setInterval(() => {
  const cutoff = Date.now() - 4 * 60 * 60 * 1000;
  for (const code of Object.keys(rooms)) {
    if (rooms[code].createdAt < cutoff) delete rooms[code];
  }
}, 30 * 60 * 1000);

function generateCode(): string {
  // Use crypto.randomBytes for a cryptographically secure 6-digit room code
  let code: string;
  do {
    // randomBytes(3) gives 0-16777215; take modulo 900000 + 100000 to get 100000-999999
    const n = randomBytes(3).readUIntBE(0, 3) % 900000 + 100000;
    code = n.toString();
  } while (rooms[code]);
  return code;
}

function calcScore(room: Room, player: RoomPlayer, correct: boolean): number {
  if (!correct) return 0;
  const elapsed = player.answeredAt
    ? (player.answeredAt - (room.questionStartedAt || player.answeredAt)) / 1000
    : 0;
  const timeLimit = room.questions[room.currentQuestion]?.timeLimit || 20;
  const speedBonus = Math.max(0, Math.floor((1 - elapsed / timeLimit) * 500));
  const streakBonus = player.streak >= 2 ? 50 * Math.min(player.streak, 5) : 0;
  return 500 + speedBonus + streakBonus;
}

function sanitiseRoom(room: Room) {
  // Don't expose correct answers to players
  return {
    code: room.code,
    quizTitle: room.quizTitle,
    phase: room.phase,
    currentQuestion: room.currentQuestion,
    totalQuestions: room.questions.length,
    questionStartedAt: room.questionStartedAt,
    currentQ: room.phase === "question" || room.phase === "reveal"
      ? {
          id: room.questions[room.currentQuestion]?.id,
          question: room.questions[room.currentQuestion]?.question,
          options: room.questions[room.currentQuestion]?.options,
          timeLimit: room.questions[room.currentQuestion]?.timeLimit,
          correctIndex: room.phase === "reveal" ? room.questions[room.currentQuestion]?.correctIndex : undefined,
        }
      : null,
    players: Object.values(room.players)
      .sort((a, b) => b.score - a.score)
      .map(p => ({ id: p.id, name: p.name, score: p.score, streak: p.streak, answers: p.answers })),
    playerCount: Object.keys(room.players).length,
  };
}

// ─── Custom Quiz CRUD ─────────────────────────────────────────────────────────

router.get("/custom", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const quizzes = await db.prepare(
    `SELECT id, title, subject, topic, question_count, created_by_name, created_at
     FROM custom_quizzes WHERE school_id = ? ORDER BY created_at DESC`
  ).all(schoolId);
  res.json(quizzes);
});

router.post("/custom", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const { title, subject, topic, questions } = req.body;
  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "title and questions are required" });
  }
  const id = uuidv4();
  await db.prepare(
    `INSERT INTO custom_quizzes (id, school_id, title, subject, topic, questions, question_count, created_by, created_by_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`
  ).run(id, schoolId, title, subject || "", topic || "", JSON.stringify(questions), questions.length, req.user!.id, req.user!.displayName || "Teacher");
  res.json({ id });
});

router.put("/custom/:id", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const { title, subject, topic, questions } = req.body;
  const existing = await db.prepare("SELECT id FROM custom_quizzes WHERE id = ? AND school_id = ?").get(req.params.id, schoolId);
  if (!existing) return res.status(404).json({ error: "Not found" });
  await db.prepare(
    `UPDATE custom_quizzes SET title=?, subject=?, topic=?, questions=?, question_count=? WHERE id=?`
  ).run(title, subject || "", topic || "", JSON.stringify(questions), questions.length, req.params.id);
  res.json({ ok: true });
});

router.delete("/custom/:id", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  await db.prepare("DELETE FROM custom_quizzes WHERE id = ? AND school_id = ?").run(req.params.id, schoolId);
  res.json({ ok: true });
});

router.get("/custom/:id", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const quiz = await db.prepare("SELECT * FROM custom_quizzes WHERE id = ? AND school_id = ?").get(req.params.id, schoolId) as any;
  if (!quiz) return res.status(404).json({ error: "Not found" });
  quiz.questions = JSON.parse(quiz.questions || "[]");
  res.json(quiz);
});

// ─── Document → Quiz AI Generation ───────────────────────────────────────────

router.post("/generate-from-doc", requireAuth, upload.single("file"), async (req: Request, res: Response) => {
  const file = (req as any).file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  let text = "";
  try {
    // Extract text from the uploaded file
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".txt") {
      text = fs.readFileSync(file.path, "utf8");
    } else if (ext === ".pdf") {
      // Use pdftotext (poppler-utils, pre-installed)
      const { execSync } = await import("child_process");
      text = execSync(`pdftotext "${file.path}" -`).toString();
    } else if (ext === ".docx" || ext === ".doc") {
      // Use mammoth for Word docs
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ path: file.path });
        text = result.value;
      } catch {
        return res.status(400).json({ error: "Could not read Word document. Please convert to PDF or TXT." });
      }
    } else {
      return res.status(400).json({ error: "Unsupported file type. Use PDF, DOCX, or TXT." });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to extract text from file." });
  } finally {
    try { fs.unlinkSync(file.path); } catch {}
  }

  if (!text || text.trim().length < 50) {
    return res.status(400).json({ error: "Could not extract enough text from the document." });
  }

  // Truncate to avoid token limits
  const truncated = text.slice(0, 6000);
  const questionCount = parseInt(req.body.questionCount || "10", 10);
  const title = req.body.title || path.basename((req as any).file?.originalname || "Quiz", path.extname((req as any).file?.originalname || ""));

  try {
    const { OpenAI } = await import("openai");
    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a quiz generator. Given text content, create exactly ${questionCount} multiple-choice questions.
Return ONLY a valid JSON array with no markdown, no explanation. Each item: { "question": "...", "options": ["A","B","C","D"], "correctIndex": 0 }
correctIndex is 0-based. Make questions clear, educational, and based ONLY on the provided text.`,
        },
        { role: "user", content: `Generate ${questionCount} quiz questions from this content:\n\n${truncated}` },
      ],
      temperature: 0.4,
      max_tokens: 3000,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "[]";
    let parsedRaw: unknown;
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
      parsedRaw = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON. Please try again." });
    }

    // Validate with Zod schema
    const zodResult = GeneratedQuizArraySchema.safeParse(parsedRaw);
    if (!zodResult.success) {
      console.warn("[QuizGen] Zod validation failed:", zodResult.error.flatten());
      return res.status(500).json({ error: "AI could not generate valid questions from this document." });
    }

    const valid = zodResult.data.map((q, i) => ({
      id: `gen-${i}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      timeLimit: 20,
    }));

    res.json({ title, questions: valid });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "AI generation failed" });
  }
});

// ─── Room Management ──────────────────────────────────────────────────────────

// POST /api/quiz/rooms — create room
router.post("/rooms", requireAuth, async (req: Request, res: Response) => {
  const { quizTitle, questions } = req.body;
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: "questions array is required" });
  }
  const code = generateCode();
  rooms[code] = {
    code,
    hostId: req.user!.id,
    schoolId: req.user!.schoolId || "",
    quizTitle: quizTitle || "QuizBlast",
    questions: questions.map((q: any, i: number) => ({
      id: q.id || `q-${i}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      timeLimit: q.timeLimit || 20,
    })),
    players: {},
    phase: "lobby",
    currentQuestion: 0,
    createdAt: Date.now(),
  };
  res.json({ code, joinUrl: `/quiz-join/${code}` });
});

// GET /api/quiz/rooms/:code — poll room state
router.get("/rooms/:code", async (req: Request, res: Response) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found or expired" });
  res.json(sanitiseRoom(room));
});

// POST /api/quiz/rooms/:code/join — player joins (mid-game joining allowed)
router.post("/rooms/:code/join", async (req: Request, res: Response) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found. Check your code." });
  // Allow joining in lobby OR during active game (phase: question/reveal)
  if (room.phase === "ended") return res.status(400).json({ error: "This game has already ended." });
  const { name } = req.body;
  if (!name || name.trim().length === 0) return res.status(400).json({ error: "Name is required" });
  const playerId = uuidv4();
  // If joining mid-game, pad answers array so player is in sync with current question
  const answersNeeded = room.phase !== "lobby" ? room.currentQuestion : 0;
  room.players[playerId] = {
    id: playerId,
    name: name.trim().slice(0, 30),
    score: 0,
    streak: 0,
    answers: Array(answersNeeded).fill(false), // mark skipped questions as incorrect
  };
  res.json({ playerId, code: room.code, currentQuestion: room.currentQuestion, phase: room.phase });
});

// POST /api/quiz/rooms/:code/start — host starts game
router.post("/rooms/:code/start", requireAuth, async (req: Request, res: Response) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.hostId !== req.user!.id) return res.status(403).json({ error: "Only the host can start the game" });
  if (room.phase !== "lobby") return res.status(400).json({ error: "Game already started" });
  room.phase = "question";
  room.currentQuestion = 0;
  room.questionStartedAt = Date.now();
  res.json(sanitiseRoom(room));
});

// POST /api/quiz/rooms/:code/answer — player submits answer
router.post("/rooms/:code/answer", async (req: Request, res: Response) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.phase !== "question") return res.status(400).json({ error: "Not in question phase" });
  const { playerId, answerIndex } = req.body;
  const player = room.players[playerId];
  if (!player) return res.status(404).json({ error: "Player not found" });
  // Only allow one answer per question
  if (player.answers.length > room.currentQuestion) {
    return res.status(400).json({ error: "Already answered" });
  }
  player.answeredAt = Date.now();
  const correct = answerIndex === room.questions[room.currentQuestion]?.correctIndex;
  player.answers.push(correct);
  if (correct) {
    player.streak += 1;
    player.score += calcScore(room, player, true);
  } else {
    player.streak = 0;
    player.answers[player.answers.length - 1] = false;
  }

  // Auto-advance to reveal phase when ALL players have answered this question
  const playerList = Object.values(room.players);
  const allAnswered = playerList.length > 0 && playerList.every(
    (p: any) => p.answers.length > room.currentQuestion
  );
  if (allAnswered && room.phase === "question") {
    // Delay 1.5s then move to reveal so clients can see the "all answered" state
    setTimeout(() => {
      if (room.phase === "question") {
        room.phase = "reveal";
        room.autoAdvancedAt = Date.now();
      }
    }, 1500);
  }

  res.json({ correct, score: player.score, streak: player.streak, allAnswered });
});

// POST /api/quiz/rooms/:code/next — host advances (reveal → next question or leaderboard)
router.post("/rooms/:code/next", requireAuth, async (req: Request, res: Response) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.hostId !== req.user!.id) return res.status(403).json({ error: "Only the host can advance" });

  if (room.phase === "question") {
    // Move to reveal
    room.phase = "reveal";
  } else if (room.phase === "reveal") {
    if (room.currentQuestion + 1 >= room.questions.length) {
      room.phase = "ended";
    } else {
      room.currentQuestion += 1;
      room.questionStartedAt = Date.now();
      room.phase = "question";
    }
  }
  res.json(sanitiseRoom(room));
});

// POST /api/quiz/rooms/:code/save-results — host saves final results to pupil profiles
router.post("/rooms/:code/save-results", requireAuth, async (req: Request, res: Response) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.hostId !== req.user!.id) return res.status(403).json({ error: "Only the host can save results" });

  const { playerMappings } = req.body as { playerMappings?: Array<{ playerName: string; pupilId?: string }> };
  const mappingMap: Record<string, string> = {};
  if (playerMappings) {
    for (const m of playerMappings) {
      if (m.pupilId) mappingMap[m.playerName] = m.pupilId;
    }
  }

  const saved: string[] = [];
  for (const [playerName, player] of Object.entries(room.players)) {
    const correctCount = player.answers.filter(Boolean).length;
    const totalQuestions = room.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const badge = percentage >= 90 ? "gold" : percentage >= 70 ? "silver" : "bronze";
    const pupilId = mappingMap[playerName] || null;
    const id = uuidv4();
    try {
      await db.prepare(`
        INSERT INTO quiz_results (id, school_id, pupil_id, pupil_name, quiz_id, quiz_title, subject, topic,
          score, max_score, percentage, correct_count, total_questions, badge, played_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `).run(
        id, room.schoolId, pupilId, playerName,
        null, room.quizTitle, null, null,
        player.score, 1000 * totalQuestions, percentage, correctCount, totalQuestions, badge
      );
      saved.push(playerName);
    } catch (e) {
      console.error("Failed to save quiz result:", e);
    }
  }

  res.json({ saved, total: Object.keys(room.players).length });
});

// GET /api/quiz/results — get quiz results for school (analytics)
router.get("/results", requireAuth, async (req: Request, res: Response) => {
  const { pupilId, limit = 50 } = req.query;
  let results: any[];
  if (pupilId) {
    results = await db.prepare(
      "SELECT * FROM quiz_results WHERE pupil_id = ? ORDER BY played_at DESC LIMIT ?"
    ).all(pupilId as string, Number(limit)) as any[];
  } else {
    results = await db.prepare(
      "SELECT * FROM quiz_results WHERE school_id = ? ORDER BY played_at DESC LIMIT ?"
    ).all(req.user!.schoolId, Number(limit)) as any[];
  }
  res.json(results);
});

// DELETE /api/quiz/rooms/:code — host closes room
router.delete("/rooms/:code", requireAuth, async (req: Request, res: Response) => {
  const room = rooms[req.params.code];
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.hostId !== req.user!.id) return res.status(403).json({ error: "Only the host can close the room" });
  delete rooms[req.params.code];
  res.json({ ok: true });
});

export default router;
