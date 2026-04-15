/**
 * EHCP Evidence Extraction Route — Adaptly
 *
 * POST /api/ehcp/extract
 *   Accepts a PDF/Word/text file and returns the raw extracted text.
 *   Unlike the revision upload endpoint, this does NOT run any AI processing —
 *   it simply extracts and returns the document text so the client-side EHCP
 *   generator can use it directly.
 *
 * PDF extraction uses the system `pdftotext` binary (poppler-utils) via a
 * child process — this is far more reliable than pdf-parse v2 which changed
 * its API completely and requires a browser-like environment.
 *
 * The endpoint uses the same async job pattern as the revision route to avoid
 * Railway's 30-second HTTP timeout on large documents.
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { randomUUID } from "crypto";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const execAsync = promisify(exec);
const router = Router();

// ── Multer — memory storage, max 25MB ────────────────────────────────────────
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
      cb(new Error("Only PDF, Word (.docx) and text files are supported"));
    }
  },
});

// ── In-memory job store (same pattern as revision.ts) ────────────────────────
type JobStatus = "pending" | "done" | "error";
interface Job {
  status: JobStatus;
  progress: string;
  text?: string;
  error?: string;
  createdAt: number;
}
const jobs = new Map<string, Job>();

// Clean up jobs older than 15 minutes
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
}, 60_000);

// ── Text extraction helper ────────────────────────────────────────────────────
async function extractText(buffer: Buffer, mimetype: string, filename: string): Promise<string> {
  let raw = "";

  if (mimetype === "text/plain" || (mimetype === "application/octet-stream" && filename.endsWith(".txt"))) {
    raw = buffer.toString("utf-8");
  } else if (mimetype === "application/pdf") {
    // Write buffer to a temp file and run pdftotext
    const tmpPath = join(tmpdir(), `ehcp_${randomUUID()}.pdf`);
    try {
      await writeFile(tmpPath, buffer);
      // -layout preserves table/column structure; stdout output with "-"
      const { stdout } = await execAsync(`pdftotext -layout "${tmpPath}" -`, {
        timeout: 30_000,
        maxBuffer: 10 * 1024 * 1024,
      });
      raw = stdout;
    } catch (pdfErr: any) {
      console.error("[EHCP extractText] pdftotext error:", pdfErr?.message || pdfErr);
      // Try without -layout as fallback
      try {
        const { stdout } = await execAsync(`pdftotext "${tmpPath}" -`, {
          timeout: 30_000,
          maxBuffer: 10 * 1024 * 1024,
        });
        raw = stdout;
      } catch (fallbackErr: any) {
        console.error("[EHCP extractText] pdftotext fallback error:", fallbackErr?.message || fallbackErr);
        raw = "";
      }
    } finally {
      // Clean up temp file
      unlink(tmpPath).catch(() => {});
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
      console.error("[EHCP extractText] mammoth error:", docErr?.message || docErr);
      raw = "";
    }
  } else {
    raw = buffer.toString("utf-8");
  }

  if (!raw || raw.trim().length < 20) {
    throw new Error(`Could not extract readable text from "${filename}". Please ensure the file is not scanned/image-only.`);
  }

  // ── Light cleaning — preserve structure for EHCP evidence extraction ─────
  // We keep newlines (unlike the revision route which collapses them) because
  // section headings and structured data (test scores, tables) rely on line breaks.
  const lines = raw.split(/\n/);
  const cleaned = lines
    .map(l => l.trimEnd())
    .filter(l => {
      if (!l.trim()) return true; // Keep blank lines to preserve paragraph structure
      // Remove standalone page numbers
      if (/^[-–—]?\s*page\s*\d+\s*[-–—]?$/i.test(l.trim())) return false;
      if (/^\d{1,3}$/.test(l.trim())) return false;
      // Remove pure separator lines
      if (/^[\-_\.=\s]{4,}$/.test(l.trim())) return false;
      return true;
    })
    .join("\n")
    // Collapse runs of 3+ blank lines to 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Return up to 20,000 chars (more than revision route's 15,000 — EHCP evidence
  // documents can be lengthy and we need all the detail)
  return cleaned.slice(0, 20000);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ehcp/extract
// Accepts a single document, extracts raw text, returns { jobId }.
// Client polls GET /api/ehcp/job/:id for the result.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/extract", requireAuth, upload.single("document"), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const jobId = randomUUID();
  const fileBuffer = req.file.buffer;
  const fileMime = req.file.mimetype;
  const fileName = req.file.originalname;

  jobs.set(jobId, { status: "pending", progress: `Extracting text from ${fileName}…`, createdAt: Date.now() });

  // Process in background to avoid timeout
  (async () => {
    try {
      console.log(`[EHCP] Job ${jobId} started for "${fileName}" (${fileMime})`);
      const t0 = Date.now();

      const text = await extractText(fileBuffer, fileMime, fileName);

      console.log(`[EHCP] Job ${jobId} done in ${Date.now() - t0}ms — ${text.length} chars extracted`);
      jobs.set(jobId, { ...jobs.get(jobId)!, status: "done", text });
    } catch (err: any) {
      console.error(`[EHCP] Job ${jobId} error:`, err);
      jobs.set(jobId, { ...jobs.get(jobId)!, status: "error", error: err.message || "Failed to extract text from document" });
    }
  })();

  res.json({ jobId });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ehcp/job/:id
// Poll for extraction job status.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/job/:id", requireAuth, async (req: Request, res: Response) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found or expired" });
  if (job.status === "pending") return res.json({ status: "pending", progress: job.progress });
  if (job.status === "error") return res.json({ status: "error", error: job.error });
  // Done — return text and clean up
  jobs.delete(req.params.id);
  return res.json({ status: "done", text: job.text });
});

export default router;
