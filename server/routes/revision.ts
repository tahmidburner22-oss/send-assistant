import { Router, Request, Response } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import db from "../db/index.js";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { randomUUID } from "crypto";

// ─── In-memory job queue for background document processing ───────────────────
// Allows the upload endpoint to return immediately with a jobId,
// bypassing Railway's 30-second HTTP timeout.
type JobStatus = "pending" | "done" | "error";
interface Job {
  status: JobStatus;
  progress: string;
  text?: string;
  script?: string;
  error?: string;
  createdAt: number;
}
const jobs = new Map<string, Job>();
// Clean up jobs older than 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
}, 60_000);

// Language code → Microsoft Edge Neural TTS voice
const EDGE_VOICE_MAP: Record<string, string> = {
  en:    "en-GB-LibbyNeural",
  "en-GB": "en-GB-LibbyNeural",
  "en-US": "en-US-AriaNeural",
  es:    "es-ES-ElviraNeural",
  fr:    "fr-FR-DeniseNeural",
  de:    "de-DE-KatjaNeural",
  it:    "it-IT-ElsaNeural",
  pt:    "pt-PT-RaquelNeural",
  ar:    "ar-EG-SalmaNeural",
  zh:    "zh-CN-XiaoxiaoNeural",
  ja:    "ja-JP-NanamiNeural",
  hi:    "hi-IN-SwaraNeural",
  ur:    "ur-PK-UzmaNeural",
  pl:    "pl-PL-ZofiaNeural",
  tr:    "tr-TR-EmelNeural",
  ru:    "ru-RU-SvetlanaNeural",
};

// Split text into sentence-boundary chunks of ~400 chars for parallel processing
function splitIntoChunks(text: string, maxLen = 400): string[] {
  // Split on sentence-ending punctuation followed by whitespace
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    const candidate = current ? current + " " + s : s;
    if (candidate.length > maxLen && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 0);
}

async function ttsOneChunk(text: string, voice: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = await tts.toStream(text);
  const parts: Buffer[] = [];
  for await (const chunk of audioStream) parts.push(chunk as Buffer);
  return Buffer.concat(parts);
}

async function edgeTTS(text: string, language: string): Promise<Buffer> {
  const lang = language.split("-")[0].toLowerCase();
  const voice = EDGE_VOICE_MAP[language] || EDGE_VOICE_MAP[lang] || "en-GB-LibbyNeural";
  const chunks = splitIntoChunks(text, 400);
  // Process all chunks in parallel for speed, then concatenate in order
  const buffers = await Promise.all(chunks.map(c => ttsOneChunk(c, voice)));
  return Buffer.concat(buffers);
}

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
// Provider order: providers with keys are tried first.
// On Railway, OPENAI_API_KEY is set so openai is tried first.
// If a Groq or Gemini key is added (free, much faster), they will be tried first.
const PROVIDER_ORDER = ["groq", "gemini", "openai", "openrouter"] as const;

function getEffectiveKey(provider: string): string {
  // Prefer environment variables (always fresh) over DB rows (may be stale)
  const envMap: Record<string, string> = {
    groq: process.env.GROQ_API_KEY || "",
    gemini: process.env.GEMINI_API_KEY || "",
    openai: process.env.OPENAI_API_KEY || "",
    openrouter: process.env.OPENROUTER_API_KEY || "",
  };
  if (envMap[provider]) return envMap[provider];
  // Fall back to DB (admin-configured keys via Admin Panel)
  try {
    const row = db.prepare(
      "SELECT api_key FROM admin_api_keys WHERE provider = ? ORDER BY updated_at DESC LIMIT 1"
    ).get(provider) as any;
    if (row?.api_key) return row.api_key;
  } catch (_) {}
  return "";
}

function getAdminModel(provider: string): string {
  try {
    const row = db.prepare(
      "SELECT model FROM admin_api_keys WHERE provider = ? ORDER BY updated_at DESC LIMIT 1"
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

// Wrap a promise with a timeout
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

async function callWithFallback(system: string, user: string, maxTokens: number): Promise<string> {
  const errors: string[] = [];
  for (const provider of PROVIDER_ORDER) {
    const key = getEffectiveKey(provider);
    if (!key) { errors.push(`${provider}: no key`); continue; }
    try {
      const model = getAdminModel(provider);
      let callPromise: Promise<string>;
      if (provider === "groq") callPromise = callGroq(system, user, key, model, maxTokens);
      else if (provider === "gemini") callPromise = callGemini(system, user, key, maxTokens);
      else if (provider === "openai") callPromise = callOpenAI(system, user, key, model, maxTokens);
      else callPromise = callOpenRouter(system, user, key, model, maxTokens);
      const content = await withTimeout(callPromise, 15000, provider);
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
// Immediately returns { jobId } and processes the document in the background.
// Client polls GET /api/revision/job/:id to check status.
// This bypasses Railway's 30-second HTTP timeout.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/upload", requireAuth, upload.single("document"), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const jobId = randomUUID();
  const language = (req.body?.language || "en").toString().slice(0, 5);
  const fileBuffer = req.file.buffer;
  const fileMime = req.file.mimetype;

  // Store job immediately so the client can start polling
  jobs.set(jobId, { status: "pending", progress: "Extracting text from document...", createdAt: Date.now() });

  // Process in background (do NOT await)
  (async () => {
    try {
      console.log(`[Revision] Job ${jobId} started. Keys: groq=${!!process.env.GROQ_API_KEY}, gemini=${!!process.env.GEMINI_API_KEY}, openai=${!!process.env.OPENAI_API_KEY}`);
      const t0 = Date.now();

      const rawText = await extractText(fileBuffer, fileMime);
      if (!rawText || rawText.trim().length < 50) {
        jobs.set(jobId, { ...jobs.get(jobId)!, status: "error", error: "Could not extract readable text from this file. Please try a different file." });
        return;
      }

      jobs.set(jobId, { ...jobs.get(jobId)!, progress: "Writing your revision podcast script..." });

      const LANG_NAMES: Record<string, string> = {
        en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
        pt: "Portuguese", ar: "Arabic", zh: "Chinese", ja: "Japanese",
        hi: "Hindi", ur: "Urdu", pl: "Polish", tr: "Turkish", ru: "Russian",
      };
      const langName = LANG_NAMES[language] || "English";
      const langInstruction = language === "en"
        ? ""
        : `\n       - IMPORTANT: Write the ENTIRE podcast script in ${langName}. All explanations, examples, transitions, and the closing line must be in ${langName}.`;

      const script = await callWithFallback(
        `You are an expert educational podcast host creating a revision podcast for students aged 11-18.
       You will receive raw document text which may contain headers, page numbers, and boilerplate — ignore all of that.
       Your job is to transform the CORE EDUCATIONAL CONTENT into a rich, engaging spoken explanation — like a brilliant teacher talking directly to a student.

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
        `Document text to turn into a podcast script:\n\n${rawText.slice(0, 6000)}`,
        1200
      );

      console.log(`[Revision] Job ${jobId} done in ${Date.now()-t0}ms`);
      jobs.set(jobId, { ...jobs.get(jobId)!, status: "done", text: rawText, script });
    } catch (err: any) {
      console.error(`[Revision] Job ${jobId} error:`, err);
      jobs.set(jobId, { ...jobs.get(jobId)!, status: "error", error: err.message || "Failed to process document" });
    }
  })();

  // Return immediately with the job ID
  res.json({ jobId });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/revision/job/:id
// Poll for job status. Returns progress message while pending, result when done.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/job/:id", requireAuth, (req: Request, res: Response) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.status === "pending") return res.json({ status: "pending", progress: job.progress });
  if (job.status === "error") return res.json({ status: "error", error: job.error });
  // Done — return result and clean up
  jobs.delete(req.params.id);
  return res.json({ status: "done", text: job.text, script: job.script });
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
// Convert podcast script to natural speech using Microsoft Edge Neural TTS
// (free, no key required, human-quality voices for 14+ languages)
// Falls back to OpenAI TTS if an API key is configured.
// Body: { text, voice?, language? }
// Returns: audio/mpeg stream
// ─────────────────────────────────────────────────────────────────────────────
router.post("/tts", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text, voice = "nova", language = "en" } = req.body;
    if (!text || text.length < 5) {
      return res.status(400).json({ error: "text is required" });
    }

    // 1. Try OpenAI TTS if a key is configured (premium upgrade path)
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
    // If no school/admin key found, use the environment OpenAI key.
    // This ensures TTS always works with a human-sounding voice.
    if (!openaiKey && process.env.OPENAI_API_KEY) {
      openaiKey = process.env.OPENAI_API_KEY;
    }

    if (openaiKey) {
      const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
      const selectedVoice = validVoices.includes(voice) ? voice : "nova";
      try {
        const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: "tts-1-hd", input: text.slice(0, 4096), voice: selectedVoice, response_format: "mp3" }),
        });
        if (ttsRes.ok) {
          const buffer = Buffer.from(await ttsRes.arrayBuffer());
          res.setHeader("Content-Type", "audio/mpeg");
          res.setHeader("Content-Length", buffer.byteLength.toString());
          return res.send(buffer);
        }
      } catch (err) {
        console.warn("[TTS] OpenAI failed, using Edge TTS:", err);
      }
    }

    // 2. Free Microsoft Edge Neural TTS — natural, human-sounding, no key required
    console.log(`[TTS] Edge TTS: lang=${language}, chars=${text.length}`);
    const audio = await edgeTTS(text, language);
    if (!audio || audio.byteLength < 100) {
      throw new Error("Edge TTS returned empty audio");
    }
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audio.byteLength.toString());
    res.setHeader("Cache-Control", "no-store");
    res.send(audio);

  } catch (err: any) {
    console.error("Revision TTS error:", err);
    res.status(500).json({ error: err.message || "TTS failed" });
  }
});

export default router;
