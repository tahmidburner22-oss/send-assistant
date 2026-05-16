/**
 * Scan-and-mark — FEAT-010
 * ----------------------------------------------------------------------------
 * Client wrapper around POST /api/ai/scan-mark, plus helpers that turn the
 * marking result into the closed-loop adaptive feed (recentMisconceptions on
 * the Child record). The next worksheet pulls those misconceptions back into
 * the AI prompt via lib/pupil-context.ts → buildPupilContext(child), which is
 * already wired into Worksheets.tsx, so this loop closes itself.
 *
 * No new dependencies: image upload uses the standard FormData multipart path
 * the rest of the app already speaks to (server uses multer.memoryStorage).
 */

// Auth flows through an httpOnly cookie, so we just need credentials: "include".
// We can't use lib/api's apiFetch wrapper because it forces a JSON Content-Type
// and would clobber the multipart boundary multer needs to parse the upload.

export interface ScanMarkExpected {
  questionText: string;
  modelAnswer?: string;
  marks?: number;
}

export interface ScanMarkQuestion {
  questionNumber: number;
  questionText: string;
  pupilAnswer: string;
  correct: boolean;
  marksAwarded: number;
  marksAvailable: number;
  modelAnswer: string;
  misconceptionTag: string | null;
}

export interface ScanMarkSummary {
  totalAwarded: number;
  totalAvailable: number;
  overallNote: string;
}

export interface ScanMarkResult {
  questions: ScanMarkQuestion[];
  summary: ScanMarkSummary;
  provider: string;
}

/**
 * Send a photo of a completed worksheet to Gemini Vision for marking.
 * Throws on failure with a user-readable message.
 */
export async function scanAndMark(params: {
  image: File | Blob;
  title?: string;
  subject?: string;
  topic?: string;
  yearGroup?: string;
  expectedAnswers?: ScanMarkExpected[];
}): Promise<ScanMarkResult> {
  const fd = new FormData();
  // The server expects the field name "image".
  // If a Blob (no name) is passed, multer needs a filename to accept it.
  const filename =
    (params.image as File).name ||
    `scan-${Date.now()}.${(params.image.type || "image/jpeg").split("/")[1] || "jpg"}`;
  fd.append("image", params.image, filename);
  if (params.title) fd.append("title", params.title);
  if (params.subject) fd.append("subject", params.subject);
  if (params.topic) fd.append("topic", params.topic);
  if (params.yearGroup) fd.append("yearGroup", params.yearGroup);
  if (params.expectedAnswers && params.expectedAnswers.length > 0) {
    fd.append("expectedAnswers", JSON.stringify(params.expectedAnswers.slice(0, 30)));
  }

  // Do NOT set Content-Type — the browser must add the multipart boundary.
  const res = await fetch("/api/ai/scan-mark", {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    let msg = `Scan-mark failed (HTTP ${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch { /* keep default */ }
    throw new Error(msg);
  }
  const data = (await res.json()) as ScanMarkResult;
  if (!Array.isArray(data.questions)) {
    throw new Error("Scan-mark returned an unexpected response shape.");
  }
  return data;
}

/**
 * Pull every non-null misconception tag from a marking result, deduped and
 * trimmed. Used to update Child.recentMisconceptions for the closed loop.
 */
export function extractMisconceptions(result: ScanMarkResult): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of result.questions) {
    if (q.correct) continue;
    const tag = (q.misconceptionTag || "").trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

/**
 * Merge fresh misconceptions onto the existing list on a Child, keeping the
 * most-recent tag first and capping the list. Mirrors the behaviour we want
 * for buildPupilContext — only the latest 5 tags ever go into the next
 * worksheet's prompt, so storing more is wasted memory.
 */
export function mergeMisconceptions(
  existing: string[] | undefined,
  fresh: string[],
  cap: number = 12,
): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const tag of [...fresh, ...(existing || [])]) {
    const t = (tag || "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(t);
    if (merged.length >= cap) break;
  }
  return merged;
}

/**
 * Pull (questionText, modelAnswer, marks) from a generated worksheet so the
 * marking endpoint has reference material. We accept any shape that has a
 * sections[] array with content strings — the server only uses these as
 * hints so a noisy/best-effort extraction is fine.
 */
export function buildExpectedAnswersFromWorksheet(ws: any): ScanMarkExpected[] {
  if (!ws || !Array.isArray(ws.sections)) return [];
  const out: ScanMarkExpected[] = [];
  for (const s of ws.sections) {
    if (!s || s.teacherOnly) continue;
    const type = String(s.type || "").toLowerCase();
    if (!/exercise|question|practice|exit-ticket|revision-mat-box/.test(type)) continue;
    const content = String(s.content || "").trim();
    if (!content) continue;
    // Each exercise section often holds multiple numbered questions in the
    // body; split on lines starting "1.", "2.", etc., otherwise treat the
    // whole content as one question.
    const lines = content.split(/\n(?=\s*\d+[.)])/);
    for (const line of lines) {
      const cleaned = line.trim();
      if (cleaned.length < 4) continue;
      const marksMatch = cleaned.match(/\[(\d+)\s*marks?\]/i);
      out.push({
        questionText: cleaned.replace(/\s*\[\d+\s*marks?\]\s*$/i, "").slice(0, 600),
        marks: marksMatch ? parseInt(marksMatch[1], 10) : (typeof s.marks === "number" ? s.marks : undefined),
      });
      if (out.length >= 30) return out;
    }
  }
  return out;
}
