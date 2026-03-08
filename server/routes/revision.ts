import { Router, Request, Response } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";

const router = Router();

// ── OpenAI client (TTS uses OpenAI directly) ──────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// ── Multer — memory storage, max 10MB for documents ──────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "text/plain", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith(".txt")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and text files are supported"));
    }
  },
});

// ── Extract text from uploaded buffer ────────────────────────────────────────
async function extractText(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === "text/plain" || mimetype === "application/octet-stream") {
    return buffer.toString("utf-8").slice(0, 15000);
  }
  if (mimetype === "application/pdf") {
    try {
      // Dynamic import to handle ESM/CJS boundary
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js" as any)).default || (await import("pdf-parse" as any)).default;
      const data = await pdfParse(buffer);
      return (data.text || "").slice(0, 15000);
    } catch (e) {
      // Fallback: try reading as text
      return buffer.toString("utf-8").slice(0, 15000);
    }
  }
  return buffer.toString("utf-8").slice(0, 15000);
}

// ── Call AI (uses env OPENAI_API_KEY via openai SDK) ─────────────────────────
async function callAI(system: string, user: string, maxTokens = 2000): Promise<string> {
  const res = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  return res.choices[0]?.message?.content || "";
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/revision/upload
// Extract text + generate podcast script + generate TTS audio
// Returns: { text, script, audioBase64 }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/upload", requireAuth, upload.single("document"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const rawText = await extractText(req.file.buffer, req.file.mimetype);
    if (!rawText || rawText.trim().length < 50) {
      return res.status(400).json({ error: "Could not extract readable text from this file" });
    }

    // Generate engaging podcast/audiobook script
    const script = await callAI(
      `You are an enthusiastic, friendly educational podcast host. 
       Convert the provided study material into an engaging spoken podcast script.
       Rules:
       - Write in natural spoken English — no bullet points, no markdown, no headers
       - Use a warm, encouraging tone suitable for students aged 11-18
       - Break complex ideas into simple explanations with relatable examples
       - Occasionally say things like "Now here's the interesting part..." or "Let's think about this..."
       - Keep it between 300-500 words so it's a focused revision session
       - Do NOT say "In this podcast" or "Welcome to" — just dive straight into the content
       - End with: "That's everything for this topic. Tap the quiz button when you're ready to test yourself!"`,
      `Study material to convert:\n\n${rawText}`,
      800
    );

    // Generate TTS audio using OpenAI
    let audioBase64 = "";
    try {
      const ttsResponse = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: script.slice(0, 4096), // TTS limit
        speed: 1.0,
      });
      const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
      audioBase64 = audioBuffer.toString("base64");
    } catch (ttsErr) {
      console.error("TTS error:", ttsErr);
      // Return script without audio — client can use browser TTS as fallback
    }

    res.json({ text: rawText, script, audioBase64 });
  } catch (err: any) {
    console.error("Revision upload error:", err);
    res.status(500).json({ error: err.message || "Failed to process document" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/revision/ask
// Interrupt Q&A: answer a question about the document
// Body: { question, documentText }
// Returns: { answer }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/ask", requireAuth, async (req: Request, res: Response) => {
  try {
    const { question, documentText } = req.body;
    if (!question || !documentText) {
      return res.status(400).json({ error: "question and documentText are required" });
    }

    const answer = await callAI(
      `You are a helpful, encouraging tutor helping a student understand their revision material.
       Answer the student's question based on the provided document text.
       - Keep answers clear, concise, and age-appropriate (11-18 year olds)
       - If the answer isn't in the document, say so honestly and give a brief general explanation
       - Use simple language and relatable examples where possible
       - Be warm and encouraging — never make the student feel silly for asking
       - Keep answers to 2-4 sentences maximum`,
      `Document text:\n${documentText.slice(0, 8000)}\n\nStudent question: ${question}`,
      400
    );

    res.json({ answer });
  } catch (err: any) {
    console.error("Revision ask error:", err);
    res.status(500).json({ error: err.message || "Failed to answer question" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/revision/quiz
// Generate a batch of multiple-choice questions with explanations
// Body: { documentText, count?, existingQuestions? }
// Returns: { questions: [{id, question, options, correct, explanation}] }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/quiz", requireAuth, async (req: Request, res: Response) => {
  try {
    const { documentText, count = 5, existingQuestions = [] } = req.body;
    if (!documentText) {
      return res.status(400).json({ error: "documentText is required" });
    }

    const avoidList = existingQuestions.slice(-20).map((q: any) => q.question).join("\n");

    const raw = await callAI(
      `You are an expert teacher creating multiple-choice revision questions.
       Generate exactly ${count} multiple-choice questions based on the provided text.
       
       STRICT JSON FORMAT — respond with ONLY a JSON array, no markdown, no explanation:
       [
         {
           "question": "Clear question text?",
           "options": ["Option A", "Option B", "Option C", "Option D"],
           "correct": 0,
           "explanation": "Explanation of why the correct answer is right AND why the others are wrong. Be specific and educational. 2-3 sentences."
         }
       ]
       
       Rules:
       - "correct" is the 0-based index of the correct option in the options array
       - All 4 options must be plausible (no obviously wrong distractors)
       - Questions should test understanding, not just memorisation
       - Vary difficulty: some straightforward, some requiring deeper thinking
       - Do NOT repeat these questions: ${avoidList || "none yet"}
       - Explanations must be encouraging and educational — explain WHY each wrong answer is incorrect`,
      `Study text:\n${documentText.slice(0, 8000)}`,
      1500
    );

    // Parse JSON safely
    let questions = [];
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      questions = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      return res.status(500).json({ error: "Failed to parse quiz questions" });
    }

    // Add unique IDs
    questions = questions.map((q: any, i: number) => ({
      ...q,
      id: `q_${Date.now()}_${i}`,
    }));

    res.json({ questions });
  } catch (err: any) {
    console.error("Revision quiz error:", err);
    res.status(500).json({ error: err.message || "Failed to generate quiz" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/revision/tts
// Convert any text to speech (for re-reading answers or explanations)
// Body: { text }
// Returns: { audioBase64 }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/tts", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    const ttsResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text.slice(0, 1000),
      speed: 1.0,
    });
    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    res.json({ audioBase64: audioBuffer.toString("base64") });
  } catch (err: any) {
    console.error("TTS error:", err);
    res.status(500).json({ error: err.message || "TTS failed" });
  }
});

export default router;
