/**
 * braillePipeline.ts — FEAT-PC7 · Phase C (Braille export)
 * ──────────────────────────────────────────────────────────────────────────
 * Converts a worksheet's plain-text content into a UEB Grade 2 Braille
 * string (.brf format) and triggers a download.
 *
 * Strategy (per PR-B handoff): rather than ship liblouis-wasm into the
 * client bundle, we route transcription through a server-side endpoint
 * `/api/ai/braille` that delegates to the AI provider chain. This keeps:
 *   - the client bundle untouched (no ~200kb wasm),
 *   - the audit surface small (no native code to vet),
 *   - the user's machine free from the wasm-decode cost on every export.
 *
 * The transcription is best-effort: if the server call fails we fall back
 * to a deterministic Grade 1 (ASCII-Braille subset) transcription so the
 * teacher always gets *something* to emboss. The fallback is clearly
 * labelled in the resulting BRF header.
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export interface BrailleSection {
  title?: string;
  content?: string;
  type?: string;
  teacherOnly?: boolean;
}

export interface BrailleSourceWorksheet {
  title?: string;
  subtitle?: string;
  sections?: BrailleSection[];
}

export type BrailleGrade = "1" | "2";

export interface BrailleResult {
  /** The full BRF (Braille Ready Format) text — one line per print row. */
  brf: string;
  /** "g2" when produced via liblouis-wasm/AI, "g1" when fallback. */
  grade: BrailleGrade;
  /** Human-readable note describing the source (server / fallback). */
  source: "server" | "fallback";
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface BrailleOptions {
  /** Force the local (Grade 1) fallback even if the server is available. */
  forceFallback?: boolean;
  /** Override request timeout in ms. Default 30s. */
  timeoutMs?: number;
  /** Width in cells per line. Default 40 (standard embosser page). */
  cellsPerLine?: number;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}

/**
 * Transcribe a worksheet to BRF Braille text.
 *
 * Pupil-facing sections only — teacher answer keys are dropped so the
 * pupil's emboss does not include the answers.
 */
export async function worksheetToBrl(
  worksheet: BrailleSourceWorksheet,
  opts: BrailleOptions = {},
): Promise<BrailleResult> {
  const cellsPerLine = Math.max(20, Math.min(80, opts.cellsPerLine ?? 40));
  const plain = flattenWorksheet(worksheet);

  if (!opts.forceFallback) {
    try {
      const serverBrl = await callServerBraille(plain, opts);
      if (serverBrl && serverBrl.trim()) {
        return {
          brf: wrapAsBrf(serverBrl, cellsPerLine, "g2"),
          grade: "2",
          source: "server",
        };
      }
    } catch (err) {
      // Swallow — fall back to local Grade 1.
      console.warn("[braillePipeline] server transcription failed, falling back:", err);
    }
  }

  const fallbackBrl = transcribeGrade1(plain);
  return {
    brf: wrapAsBrf(fallbackBrl, cellsPerLine, "g1"),
    grade: "1",
    source: "fallback",
  };
}

/**
 * Trigger a browser download of a BRF file produced by worksheetToBrl.
 */
export function downloadBrf(brf: string, filename: string): void {
  if (typeof document === "undefined") return;
  const safeName = filename.toLowerCase().endsWith(".brf") ? filename : `${filename}.brf`;
  const blob = new Blob([brf], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Server transcription ──────────────────────────────────────────────────

async function callServerBraille(
  plain: string,
  opts: BrailleOptions,
): Promise<string> {
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer =
    controller && typeof window !== "undefined"
      ? window.setTimeout(() => controller.abort(), opts.timeoutMs ?? 30_000)
      : null;
  if (opts.signal && controller) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch("/api/ai/braille", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      signal: controller?.signal,
      body: JSON.stringify({ text: plain, grade: 2 }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Braille endpoint returned ${res.status}: ${body.slice(0, 120)}`);
    }
    const data = (await res.json()) as { brl?: string; brf?: string; text?: string };
    return data.brl || data.brf || data.text || "";
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

// ─── Worksheet → plain text ────────────────────────────────────────────────

function flattenWorksheet(ws: BrailleSourceWorksheet): string {
  const out: string[] = [];
  if (ws.title) out.push(ws.title);
  if (ws.subtitle) out.push(ws.subtitle);
  out.push("");

  for (const s of ws.sections || []) {
    if (s.teacherOnly) continue;
    const t = (s.type || "").toLowerCase();
    if (t === "answers" || t === "mark-scheme" || t === "answer-key") continue;
    if (s.title) out.push(s.title.toUpperCase());
    if (s.content) out.push(s.content);
    out.push("");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ─── BRF wrapper ───────────────────────────────────────────────────────────

/**
 * Wrap raw Braille (or Grade 1 ASCII-Braille) into BRF format:
 *   - Form-feed (0x0C) at start of each printable page.
 *   - Lines hard-wrapped to `cellsPerLine` characters.
 *   - 25 lines per page (standard embosser default).
 *
 * BRF readers ignore additional metadata, so we leave a readable header
 * comment on the first line for sighted reviewers.
 */
function wrapAsBrf(brl: string, cellsPerLine: number, grade: "g1" | "g2"): string {
  const linesPerPage = 25;
  const header = `>>>ADAPTLY BRF (${grade.toUpperCase()}) — ${new Date().toISOString().slice(0, 10)}<<<`;
  const wrapped: string[] = [header];

  for (const rawLine of brl.split(/\r?\n/)) {
    if (!rawLine) {
      wrapped.push("");
      continue;
    }
    let i = 0;
    while (i < rawLine.length) {
      wrapped.push(rawLine.slice(i, i + cellsPerLine));
      i += cellsPerLine;
    }
  }

  // Paginate
  const pages: string[] = [];
  for (let i = 0; i < wrapped.length; i += linesPerPage) {
    const page = wrapped.slice(i, i + linesPerPage).join("\n");
    pages.push(page);
  }
  return pages.join("\n\f\n");
}

// ─── Grade 1 fallback (ASCII Braille / North American computer Braille) ───
//
// We map ASCII letters/digits/punctuation onto the standard 6-dot Unicode
// Braille range (U+2800–U+28FF). Real Grade 2 contractions are NOT
// applied — that's the server's job. The fallback exists purely so a
// teacher offline still gets a printable BRF.

const ASCII_TO_BRAILLE: Record<string, string> = {
  a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋", g: "⠛", h: "⠓",
  i: "⠊", j: "⠚", k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕", p: "⠏",
  q: "⠟", r: "⠗", s: "⠎", t: "⠞", u: "⠥", v: "⠧", w: "⠺", x: "⠭",
  y: "⠽", z: "⠵",
  "0": "⠼⠚", "1": "⠼⠁", "2": "⠼⠃", "3": "⠼⠉", "4": "⠼⠙",
  "5": "⠼⠑", "6": "⠼⠋", "7": "⠼⠛", "8": "⠼⠓", "9": "⠼⠊",
  ".": "⠲", ",": "⠂", ";": "⠆", ":": "⠒", "?": "⠦", "!": "⠖",
  "'": "⠄", '"': "⠶", "-": "⠤", "(": "⠐⠣", ")": "⠐⠜",
  "/": "⠌", " ": " ",
};

function transcribeGrade1(text: string): string {
  if (!text) return "";
  const out: string[] = [];
  let prevWasDigit = false;

  for (const rawCh of text) {
    const ch = rawCh.toLowerCase();
    if (ch >= "a" && ch <= "z") {
      // Capital indicator
      if (rawCh >= "A" && rawCh <= "Z") out.push("⠠");
      out.push(ASCII_TO_BRAILLE[ch] || ch);
      prevWasDigit = false;
    } else if (ch >= "0" && ch <= "9") {
      // Number sign only on the first digit of a run
      if (!prevWasDigit) out.push("⠼");
      // The digit mapping in our table already includes the number sign;
      // emit only the letter portion when continuing a run.
      const fullMapped = ASCII_TO_BRAILLE[ch] || "";
      out.push(prevWasDigit ? fullMapped.slice(1) : fullMapped.slice(1));
      prevWasDigit = true;
    } else if (ch === "\n") {
      out.push("\n");
      prevWasDigit = false;
    } else {
      out.push(ASCII_TO_BRAILLE[ch] || ch);
      prevWasDigit = false;
    }
  }
  return out.join("");
}
