import { Router, Request, Response } from "express";
import multer from "multer";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import OpenAI from "openai";
import { requireAuth } from "../middleware/auth.js";
import db from "../db/index.js";
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


const router = Router();

// ── Multer — memory storage, max 10MB for documents ──────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
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
    elevenlabs: process.env.ELEVENLABS_API_KEY || "",
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
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      raw = result?.text ?? "";
    } catch (pdfErr: any) {
      console.error("[extractText] pdf-parse error:", pdfErr?.message || pdfErr);
      raw = buffer.toString("utf-8");
    }
  } else if (
    mimetype === "application/msword" ||
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const mammoth = await import("mammoth");
      const mammothLib = (mammoth as any).default || mammoth;
      const result = await mammothLib.extractRawText({ buffer });
      raw = result.value || "";
    } catch (docErr: any) {
      console.error("[extractText] mammoth error:", docErr?.message || docErr);
      raw = "";
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
  const yearGroupRaw = (req.body?.yearGroup || "year10").toString();
  const yearNum = parseInt(yearGroupRaw.replace(/[^0-9]/g, ""), 10) || 10;
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

      // Scale podcast length based on document size
      const docLen = rawText.length;
      const targetWords =
        docLen < 500   ? (yearNum <= 6 ? 200 : yearNum <= 9 ? 350 : 450) :
        docLen < 1500  ? (yearNum <= 6 ? 350 : yearNum <= 9 ? 550 : 700) :
        docLen < 4000  ? (yearNum <= 6 ? 500 : yearNum <= 9 ? 800 : 1000) :
        docLen < 8000  ? (yearNum <= 6 ? 650 : yearNum <= 9 ? 1000 : 1300) :
                         (yearNum <= 6 ? 800 : yearNum <= 9 ? 1200 : 1600);

      // Age-tailored script guidance based on year group
      const ageGuide =
        yearNum <= 2  ? `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}). Use very short sentences (5\u20138 words). Only the simplest vocabulary. Speak like a kind, encouraging primary teacher. Use lots of repetition and concrete examples. Avoid any abstract concepts. Target: ${targetWords} words.` :
        yearNum <= 4  ? `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}). Use short, clear sentences. Simple everyday vocabulary. Introduce new words with an immediate plain-English definition. Use relatable real-world examples. Target: ${targetWords} words.` :
        yearNum <= 6  ? `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}). Use clear sentences (10\u201315 words). Introduce subject vocabulary with brief definitions. Use concrete examples and analogies. Target: ${targetWords} words.` :
        yearNum <= 8  ? `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}). Use moderate complexity. Introduce technical vocabulary with definitions. Some abstract concepts are fine if anchored to concrete examples. Target: ${targetWords} words.` :
        yearNum <= 9  ? `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}). Use KS3-level academic language. Technical vocabulary expected. Multi-clause sentences are fine. Target: ${targetWords} words.` :
        yearNum <= 11 ? `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}) studying for their GCSEs. Use GCSE-level academic language. Subject-specific terminology is expected. Use command words (describe, explain, evaluate, analyse) naturally. Target: ${targetWords} words.` :
                        `The student is in Year ${yearNum} (age ${yearNum + 4}\u2013${yearNum + 5}) studying at A-Level. Use A-Level academic register. Sophisticated vocabulary, nuanced arguments, synoptic links. Reference relevant theories and studies. Target: ${targetWords} words.`;

      // Calculate max tokens based on target word count (roughly 1.4 tokens per word)
      const maxTokens = Math.min(4000, Math.max(600, Math.round(targetWords * 1.5)));

      const script = await callWithFallback(
        `You are an incredibly warm, engaging, and slightly informal educational podcaster — like a brilliant friend who genuinely loves this subject and can't wait to explain it.
       Ignore all headers, page numbers, and formatting in the document — focus only on the actual educational content.
       Transform it into natural flowing speech that sounds like a real person talking — NOT a textbook being read aloud.

       STUDENT PROFILE: ${ageGuide}

       HOW TO SOUND HUMAN (follow every one of these):
       - Use contractions constantly: you're, it's, that's, we're, don't, can't, I've, they've
       - Start sentences with "So", "Now", "Right", "Okay", "And", "But" — just like real speech
       - Use natural thinking phrases: "Here's the thing...", "What's really interesting is...", "And this is where it gets good..."
       - Ask rhetorical questions and answer them straight away: "Why does that matter? Well..."
       - Use casual asides: "— and this is the key part —", "trust me on this one", "you'll see this a lot in the exam"
       - Vary pace: short punchy sentences for emphasis. Then a longer one to explain the detail. Then short again.
       - React naturally: "Pretty cool, right?", "I know, it sounds complicated — but stick with me.", "See how that connects?"
       - Speak to one student directly using "you" — never address a class
       - Sound genuinely enthusiastic — like someone who loves this topic, not someone performing enthusiasm

       CONTENT RULES:
       - Actually explain each concept from scratch as if the student has never heard it — don't just repeat the notes
       - Use real-world analogies and examples relevant to the student's actual life and age
       - Define technical terms instantly in plain conversational language the moment you use them
       - Connect ideas: "This links back to what we just covered...", "Remember that bit? Here's why it mattered."
       - Cover every key concept — nothing important gets skipped
       - No bullet points, no markdown, no headers, no numbered lists — pure natural speech only
       - Do NOT open with "Welcome" or "In this podcast" — dive straight into the first concept
       - End with exactly: "Right, you've got a really solid understanding of this now. Jump over to the quiz and put it to the test — good luck!"
       ${langInstruction}`,
        `Document text to turn into a natural podcast script:\n\n${rawText.slice(0, 8000)}`,
        maxTokens
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

    const existingQList = (existingQuestions as any[]).slice(-30);
    const avoidList = existingQList.map((q: any) => q.question).join("\n");
    // Build a normalised set of existing question stems for server-side dedup
    const existingNormalised = new Set(
      existingQList.map((q: any) => (q.question || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim())
    );

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
       
       CRITICAL RULES — you MUST follow ALL of these:
       - "correct" is the 0-based index of the correct option in the options array
       - All 4 options must be plausible (no obviously wrong distractors)
       - Questions should test understanding, not just memorisation
       - Vary difficulty: some straightforward, some requiring deeper thinking
       - ABSOLUTE RULE: Do NOT generate questions that are the same as, similar to, or paraphrase any of these already-asked questions:
${avoidList ? avoidList.split("\n").map((q: string) => `         * ${q}`).join("\n") : "         (none yet)"}
       - Each new question MUST cover a DIFFERENT fact, concept, or aspect of the text from all previous questions
       - Explanations must be encouraging and educational — explain WHY each wrong answer is incorrect`,
      `Study text:\n${documentText.slice(0, 8000)}`,
      1500
    );

    let questions: any[] = [];
    try {
      // Strip markdown code fences (```json ... ``` or ``` ... ```) if present
      const stripped = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      const jsonMatch = stripped.match(/\[[\s\S]*\]/);
      questions = JSON.parse(jsonMatch ? jsonMatch[0] : stripped);
    } catch {
      return res.status(500).json({ error: "Failed to parse quiz questions — please try again" });
    }

    // Server-side deduplication: filter out any questions too similar to existing ones
    questions = questions.filter((q: any) => {
      const norm = (q.question || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      if (existingNormalised.has(norm)) return false;
      // Also filter near-duplicates (first 40 chars match)
      const prefix = norm.slice(0, 40);
      for (const existing of existingNormalised) {
        if (existing.slice(0, 40) === prefix) return false;
      }
      return true;
    });

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

// Split text into sentence-aware chunks for TTS
// Uses 900-char chunks to avoid OpenAI TTS chunking errors on long inputs
function splitIntoChunks(text: string, maxChars = 900): string[] {
  // Normalise whitespace and remove any zero-width / invisible chars that confuse TTS
  const clean = text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")  // zero-width chars
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= maxChars) return [clean];

  const chunks: string[] = [];
  // Split on sentence boundaries: . ! ? followed by space or end
  // Also split on newlines which often appear in podcast scripts
  const sentences = clean.match(/[^.!?\n]+[.!?\n]+\s*/g) || [clean];
  let current = "";

  for (const sentence of sentences) {
    // If a single sentence is longer than maxChars, split it on commas/clauses
    if (sentence.length > maxChars) {
      if (current.trim()) { chunks.push(current.trim()); current = ""; }
      // Split long sentence on comma or semicolon boundaries
      const parts = sentence.match(/[^,;]+[,;]?\s*/g) || [sentence];
      let partCurrent = "";
      for (const part of parts) {
        if ((partCurrent + part).length > maxChars && partCurrent.length > 0) {
          chunks.push(partCurrent.trim());
          partCurrent = part;
        } else {
          partCurrent += part;
        }
      }
      if (partCurrent.trim()) current = partCurrent;
      continue;
    }

    if ((current + sentence).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  // Filter empty chunks that could cause TTS API errors
  return chunks.filter(c => c.length > 0) || [clean.slice(0, maxChars)];
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/revision/tts — Neural TTS
// Primary: OpenAI TTS (tts-1-hd) — reliable from server environments
// Fallback: Microsoft Edge Neural TTS (msedge-tts) — high quality but may be blocked on cloud IPs
//
// Voice mapping (frontend voice name -> OpenAI voice):
//   nova / Aoede    -> nova    (warm female)
//   shimmer / Leda  -> shimmer (soft female)
//   alloy / Kore    -> alloy   (confident female)
//   echo / Charon   -> echo    (natural male)
//   fable / Fenrir  -> fable   (expressive male)
//   onyx            -> onyx    (deep male)
//
// Body: { text, voice?, language? }
// Returns: audio/mpeg stream
router.post("/tts", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text, voice = "nova", language = "en" } = req.body;
    if (!text || text.length < 5) {
      return res.status(400).json({ error: "text is required" });
    }

    // Map frontend voice names to OpenAI TTS voice IDs
    const OPENAI_VOICE_MAP: Record<string, string> = {
      nova:    "nova",
      hannah:  "nova",
      shimmer: "shimmer",
      autumn:  "shimmer",
      alloy:   "alloy",
      diana:   "alloy",
      echo:    "echo",
      daniel:  "echo",
      fable:   "fable",
      troy:    "fable",
      onyx:    "onyx",
      austin:  "onyx",
    };

    // Map voice names to Azure Neural voice IDs (fallback)
    const AZURE_VOICE_MAP: Record<string, string> = {
      nova:    "en-GB-SoniaNeural",
      hannah:  "en-GB-SoniaNeural",
      shimmer: "en-GB-LibbyNeural",
      autumn:  "en-GB-LibbyNeural",
      alloy:   "en-GB-MaisieNeural",
      diana:   "en-GB-MaisieNeural",
      echo:    "en-GB-RyanNeural",
      daniel:  "en-GB-RyanNeural",
      fable:   "en-US-GuyNeural",
      troy:    "en-US-GuyNeural",
      onyx:    "en-US-EricNeural",
      austin:  "en-US-EricNeural",
    };

    // Non-English language overrides for Azure (fallback)
    const LANG_VOICE_MAP: Record<string, string> = {
      cy: "cy-GB-NiaNeural",
      fr: "fr-FR-DeniseNeural",
      es: "es-ES-ElviraNeural",
      de: "de-DE-KatjaNeural",
      ar: "ar-EG-SalmaNeural",
    };

    const openaiVoice = (OPENAI_VOICE_MAP[voice] || "nova") as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
    const azureVoice = (language !== "en" && LANG_VOICE_MAP[language])
      ? LANG_VOICE_MAP[language]
      : (AZURE_VOICE_MAP[voice] || "en-GB-SoniaNeural");

    // PRIMARY: OpenAI TTS — sequential chunks with retry to avoid rate limit failures
    try {
      console.log(`[TTS] OpenAI TTS: voice=${openaiVoice}, chars=${text.length}`);
      const openai = new OpenAI();
      // Smaller chunks = more reliable, fewer chunk errors
      const chunks = splitIntoChunks(text, 900);
      console.log(`[TTS] Processing ${chunks.length} chunk(s) sequentially`);

      const mp3Buffers: Buffer[] = [];
      for (let i = 0; i < chunks.length; i++) {
        let lastErr: any;
        // Up to 3 retries per chunk with exponential backoff
        for (let attempt = 0; attempt < 3; attempt++) {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 30000);
          try {
            const response = await openai.audio.speech.create({
              model: "tts-1-hd",  // higher quality, more natural sound
              voice: openaiVoice,
              input: chunks[i],
              response_format: "mp3",
              speed: 0.95,       // very slightly slower = more natural delivery
            }, { signal: ctrl.signal });
            clearTimeout(timer);
            const buf = Buffer.from(await response.arrayBuffer());
            console.log(`[TTS] Chunk ${i + 1}/${chunks.length} ready (${buf.byteLength}b)`);
            mp3Buffers.push(buf);
            lastErr = null;
            break;
          } catch (e) {
            clearTimeout(timer);
            lastErr = e;
            console.warn(`[TTS] Chunk ${i + 1} attempt ${attempt + 1} failed:`, (e as any)?.message);
            if (attempt < 2) await new Promise(r => setTimeout(r, (attempt + 1) * 800)); // backoff
          }
        }
        if (lastErr) throw lastErr;
      }

      const combined = Buffer.concat(mp3Buffers);
      console.log(`[TTS] Done: ${combined.byteLength} bytes, ${chunks.length} chunks`);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", combined.byteLength.toString());
      return res.send(combined);

    } catch (openaiErr: any) {
      console.warn(`[TTS] OpenAI failed (${openaiErr?.message}), trying msedge-tts...`);

      // FALLBACK: msedge-tts — also parallelised
      const tts = new MsEdgeTTS();
      await tts.setMetadata(azureVoice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const chunks = splitIntoChunks(text, 2000);

      const results = await Promise.all(
        chunks.map(async (chunk) => {
          const { audioStream } = tts.toStream(chunk);
          const bufs: Buffer[] = [];
          await new Promise<void>((resolve, reject) => {
            const t = setTimeout(() => reject(new Error("msedge chunk timeout")), 30000);
            let done = false;
            const finish = () => { if (!done) { done = true; clearTimeout(t); resolve(); } };
            audioStream.on("data", (d: Buffer) => bufs.push(d));
            audioStream.on("end", finish);
            audioStream.on("close", finish);
            audioStream.on("error", (e: Error) => { if (!done) { done = true; clearTimeout(t); reject(e); } });
          });
          return bufs.length > 0 ? Buffer.concat(bufs) : null;
        })
      );

      tts.close();
      const valid = results.filter((b): b is Buffer => b !== null);
      if (valid.length === 0) throw new Error("Both TTS providers returned no audio");

      const combined = Buffer.concat(valid);
      console.log(`[TTS] msedge fallback success: ${combined.byteLength} bytes`);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", combined.byteLength.toString());
      return res.send(combined);
    }

  } catch (err: any) {
    console.error("[TTS] All TTS providers failed:", err?.message || err);
    res.status(500).json({ error: err.message || "Neural voice generation failed. Please try again." });
  }
});


export default router;
