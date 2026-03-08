import { Router, Request, Response } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import db from "../db/index.js";
import * as googleTTS from "google-tts-api";

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
  let raw = "";
  if (mimetype === "text/plain" || mimetype === "application/octet-stream") {
    raw = buffer.toString("utf-8");
  } else if (mimetype === "application/pdf") {
    try {
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js" as any)).default
        || (await import("pdf-parse" as any)).default;
      const data = await pdfParse(buffer);
      raw = data.text || "";
    } catch (_) {
      raw = buffer.toString("utf-8");
    }
  } else {
    raw = buffer.toString("utf-8");
  }

  // ── Clean common PDF noise ────────────────────────────────────────────────
  const lines = raw.split(/\n/);
  const cleaned = lines
    .map(l => l.trim())
    .filter(l => {
      if (!l) return false;
      // Remove standalone page numbers (e.g. "1", "Page 1", "- 1 -")
      if (/^[-–—]?\s*page\s*\d+\s*[-–—]?$/i.test(l)) return false;
      if (/^\d{1,3}$/.test(l)) return false;
      // Remove common header/footer patterns
      if (/^(all rights reserved|copyright|confidential|www\.|http|©|\bversion\b|\brev\b|\bdraft\b)/i.test(l)) return false;
      // Remove lines that are just dashes, dots, or underscores
      if (/^[\-_\.=\s]{3,}$/.test(l)) return false;
      // Remove very short fragments (single chars, lone numbers)
      if (l.length < 3) return false;
      return true;
    })
    .join(" ")
    // Collapse multiple spaces
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned.slice(0, 15000);
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

    // Language for the podcast script (passed from client as form field)
    const language = (req.body?.language || "en").toString().slice(0, 5);
    const LANG_NAMES: Record<string, string> = {
      en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
      pt: "Portuguese", ar: "Arabic", zh: "Chinese", ja: "Japanese",
      hi: "Hindi", ur: "Urdu", pl: "Polish", tr: "Turkish", ru: "Russian",
    };
    const langName = LANG_NAMES[language] || "English";
    const langInstruction = language === "en"
      ? ""
      : `\n       - IMPORTANT: Write the ENTIRE podcast script in ${langName}. All explanations, examples, transitions, and the closing line must be in ${langName}.`;

    // First pass: ask AI to identify and extract only the core educational content
    const cleanedContent = await callWithFallback(
      `You are a document analyst. Your job is to extract ONLY the core educational content from the text below.
       Remove: page numbers, headers, footers, author names, publication dates, copyright notices, table of contents entries, references/bibliography, URLs, and any administrative boilerplate.
       Keep: all subject matter, explanations, definitions, examples, key concepts, facts, and arguments.
       Return ONLY the cleaned educational content as plain text. Do not add any commentary or labels.`,
      `Document text:\n\n${rawText}`,
      2000
    );

    const script = await callWithFallback(
      `You are an expert educational podcast host creating a revision podcast for students aged 11-18.
       Your job is to transform study notes into a rich, engaging spoken explanation — like a brilliant teacher talking directly to a student.

       CRITICAL RULES:
       - Write ONLY natural spoken language — absolutely no bullet points, no markdown, no headers, no asterisks
       - Do NOT just read the notes back. EXPLAIN everything as if the student has never heard it before
       - Break down every concept step by step with clear reasoning
       - Use real-world analogies and relatable examples to make abstract ideas stick
       - Define any technical terms the moment you use them
       - Connect ideas together naturally
       - Use natural speech patterns and vary your sentence length
       - Aim for 600-900 words of spoken script (about 4-6 minutes of audio)
       - Do NOT start with "Welcome" or "In this podcast" — open with the first key concept immediately
       - End with a brief encouragement to take the quiz${langInstruction}`,
      `Educational content to turn into a podcast:\n\n${cleanedContent}`,
      1200
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/revision/tts
// Convert podcast script to speech via free Google TTS (fallback) or OpenAI (if key exists)
// Body: { text, voice?, language? }
// Returns: audio/mpeg stream
// ─────────────────────────────────────────────────────────────────────────────
router.post("/tts", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text, voice = "nova", language = "en" } = req.body;
    if (!text || text.length < 5) {
      return res.status(400).json({ error: "text is required" });
    }

    // 1. Try OpenAI TTS if a key is available
    let openaiKey = "";
    const schoolId = (req as any).user?.schoolId;
    if (schoolId) {
      try {
        const row = db.prepare(
          "SELECT api_key FROM school_api_keys WHERE school_id=? AND provider='openai' LIMIT 1"
        ).get(schoolId) as any;
        if (row?.api_key) openaiKey = row.api_key;
      } catch { /* ignore */ }
    }
    if (!openaiKey) {
      try {
        const row = db.prepare(
          "SELECT api_key FROM admin_api_keys WHERE provider='openai' LIMIT 1"
        ).get() as any;
        if (row?.api_key) openaiKey = row.api_key;
      } catch { /* ignore */ }
    }
    if (!openaiKey) openaiKey = process.env.OPENAI_API_KEY || "";

    if (openaiKey) {
      const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
      const selectedVoice = validVoices.includes(voice) ? voice : "nova";
      const trimmedText = text.slice(0, 4000);

      try {
        const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: "tts-1",
            input: trimmedText,
            voice: selectedVoice,
            response_format: "mp3",
          }),
        });

        if (ttsRes.ok) {
          res.setHeader("Content-Type", "audio/mpeg");
          const buffer = Buffer.from(await ttsRes.arrayBuffer());
          return res.send(buffer);
        }
      } catch (err) {
        console.warn("[TTS] OpenAI failed, falling back to Google:", err);
      }
    }

    // 2. Free Google TTS (unlimited, no key required)
    // Splits long text into ≤200-char chunks automatically, then we combine all MP3 buffers
    const lang = language.split("-")[0] || "en";

    // Limit to ~3000 chars (~3-4 minutes of speech) to keep response fast
    const chunks = googleTTS.getAllAudioUrls(text.slice(0, 3000), {
      lang,
      slow: false,
      host: "https://translate.google.com",
    });

    if (!chunks || chunks.length === 0) {
      throw new Error("Google TTS returned no audio chunks");
    }

    // Fetch all chunks with a proper browser User-Agent (required by Google)
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
      const googleRes = await fetch(chunk.url, { headers: { "User-Agent": UA } });
      if (!googleRes.ok) {
        console.warn(`[TTS] Google chunk failed: ${googleRes.status} for "${chunk.shortText.slice(0, 30)}"`);
        continue;
      }
      audioBuffers.push(Buffer.from(await googleRes.arrayBuffer()));
    }

    if (audioBuffers.length === 0) {
      throw new Error("All Google TTS chunks failed");
    }

    const combined = Buffer.concat(audioBuffers);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", combined.byteLength.toString());
    res.setHeader("Cache-Control", "no-store");
    res.send(combined);

  } catch (err: any) {
    console.error("Revision TTS error:", err);
    res.status(500).json({ error: err.message || "TTS failed" });
  }
});

export default router;
