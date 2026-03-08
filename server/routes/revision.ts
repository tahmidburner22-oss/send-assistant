import { Router, Request, Response } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import db from "../db/index.js";

const router = Router();

// ── Multer — memory storage, max 10MB for documents ──────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith(".txt")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, Word, and text files are supported"));
    }
  },
});

// ── Multi-provider AI helpers (same pattern as ai.ts) ────────────────────────
const PROVIDER_ORDER = ["groq", "gemini", "openai", "openrouter"] as const;

function getEffectiveKey(provider: string): string {
  try {
    const row = db.prepare(
      "SELECT api_key FROM admin_api_keys WHERE provider = ?"
    ).get(provider) as any;
    if (row?.api_key) return row.api_key;
  } catch (_) {}
  const envMap: Record<string, string> = {
    groq: process.env.GROQ_API_KEY || "",
    gemini: process.env.GEMINI_API_KEY || "",
    openai: process.env.OPENAI_API_KEY || "",
    openrouter: process.env.OPENROUTER_API_KEY || "",
  };
  return envMap[provider] || "";
}

function getAdminModel(provider: string): string {
  try {
    const row = db.prepare(
      "SELECT model FROM admin_api_keys WHERE provider = ?"
    ).get(provider) as any;
    return row?.model || "";
  } catch (_) { return ""; }
}

async function callGroq(system: string, user: string, key: string, model: string, maxTokens: number): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: model || "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.choices[0].message.content;
}

async function callGemini(system: string, user: string, key: string, maxTokens: number): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: system ? `${system}\n\n${user}` : user }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(system: string, user: string, key: string, model: string, maxTokens: number): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as any;
  return data.choices[0].message.content;
}

async function callOpenRouter(system: string, user: string, key: string, model: string, maxTokens: number): Promise<string> {
  const fallbackModels = [
    model,
    "nvidia/nemotron-nano-9b-v2:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
  ].filter(Boolean);
  for (const m of fallbackModels) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://adaptly.co.uk",
          "X-Title": "Adaptly",
        },
        body: JSON.stringify({
          model: m,
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          max_tokens: maxTokens,
        }),
      });
      if (!res.ok) continue;
      const data = await res.json() as any;
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
    } catch (_) {}
  }
  throw new Error("OpenRouter: all models failed");
}

async function callWithFallback(system: string, user: string, maxTokens: number): Promise<string> {
  const errors: string[] = [];
  for (const provider of PROVIDER_ORDER) {
    const key = getEffectiveKey(provider);
    if (!key) { errors.push(`${provider}: no key`); continue; }
    try {
      const model = getAdminModel(provider);
      let content = "";
      if (provider === "groq") content = await callGroq(system, user, key, model, maxTokens);
      else if (provider === "gemini") content = await callGemini(system, user, key, maxTokens);
      else if (provider === "openai") content = await callOpenAI(system, user, key, model, maxTokens);
      else if (provider === "openrouter") content = await callOpenRouter(system, user, key, model, maxTokens);
      if (content?.trim()) {
        console.log(`[Revision AI] Success via ${provider}`);
        return content;
      }
      errors.push(`${provider}: empty response`);
    } catch (err: any) {
      const msg = (err?.message || String(err)).slice(0, 100);
      console.warn(`[Revision AI] ${provider} failed: ${msg}`);
      errors.push(`${provider}: ${msg}`);
    }
  }
  throw new Error(`All AI providers failed. Please configure an API key in Admin Settings. Details: ${errors.join(" | ")}`);
}

// ── Extract text from uploaded buffer ────────────────────────────────────────
async function extractText(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === "text/plain" || mimetype === "application/octet-stream") {
    return buffer.toString("utf-8").slice(0, 15000);
  }
  if (mimetype === "application/pdf") {
    try {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js" as any)).default
        || (await import("pdf-parse" as any)).default;
      const data = await pdfParse(buffer);
      return (data.text || "").slice(0, 15000);
    } catch (_) {
      return buffer.toString("utf-8").slice(0, 15000);
    }
  }
  return buffer.toString("utf-8").slice(0, 15000);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/revision/upload
// Extract text + generate podcast script
// Returns: { text, script }  — audio is handled client-side via Web Speech API
// ─────────────────────────────────────────────────────────────────────────────
router.post("/upload", requireAuth, upload.single("document"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const rawText = await extractText(req.file.buffer, req.file.mimetype);
    if (!rawText || rawText.trim().length < 50) {
      return res.status(400).json({ error: "Could not extract readable text from this file. Please try a different file." });
    }

    const script = await callWithFallback(
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

    res.json({ text: rawText, script, audioBase64: "" });
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

    const answer = await callWithFallback(
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

    const avoidList = (existingQuestions as any[]).slice(-20).map((q: any) => q.question).join("\n");

    const raw = await callWithFallback(
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

    let questions: any[] = [];
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      questions = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      return res.status(500).json({ error: "Failed to parse quiz questions — please try again" });
    }

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

export default router;
