/**
 * lesson-bundle.ts — Phase 4 / FEAT-009 (Multi-modal lesson bundle)
 *
 * Take ONE generated worksheet and auto-pair it with three small artefacts
 * that wrap a complete 50-minute lesson around it:
 *
 *   1. Starter slide   — 5-min retrieval warm-up (2 questions + key vocab)
 *   2. Now/Next/Then   — visual lesson-flow strip for SEND pupils
 *   3. Exit ticket     — 3-question micro-quiz with teacher answer key
 *
 * The starter and exit are AI-generated in a single batched call (one
 * round-trip, ≈600 tokens out — cheaper than two separate calls). The
 * Now/Next/Then strip is deterministic, no AI cost.
 *
 * Design constraints:
 *  - £0 cost: re-uses callAI on the existing free-tier providers.
 *  - Non-blocking caller: this module exposes pure async functions; the
 *    UI dialog drives the lifecycle.
 *  - Defensive parsing: malformed AI JSON falls back to template
 *    placeholders so the bundle still prints.
 *  - Pure HTML output (no React DOM mount), mirroring class-pack so the
 *    booklet is robust against route navigation.
 */
import { callAI } from "@/lib/ai";
import {
  buildPopupHtml,
  getKatexCssInline,
} from "@/lib/pdf-generator-v2";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LessonBundleSection {
  title: string;
  content: string;
  type?: string;
  teacherOnly?: boolean;
}

export interface LessonBundleBaseWorksheet {
  title: string;
  subtitle?: string;
  sections: LessonBundleSection[];
  metadata?: {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    examBoard?: string;
    difficulty?: string;
  };
}

export interface StarterSlide {
  /** Slide title — usually "Do Now" or "Retrieval starter". */
  title: string;
  /** 2-3 short retrieval questions. */
  questions: string[];
  /** Key vocabulary the pupil needs for today's lesson (max 8). */
  keyVocab: { term: string; definition: string }[];
  /** Optional one-line success criterion / lesson objective. */
  objective?: string;
}

export interface NowNextThenStrip {
  now: { label: string; minutes: number; detail?: string };
  next: { label: string; minutes: number; detail?: string };
  then: { label: string; minutes: number; detail?: string };
}

export interface ExitTicketQuestion {
  prompt: string;
  /** Optional MCQ options. If empty, treat as short-answer. */
  options?: string[];
  /** Teacher answer (verbatim or model answer). */
  answer: string;
  /** One-line marking guidance. */
  markingNote?: string;
}

export interface ExitTicketSlip {
  title: string;
  questions: ExitTicketQuestion[];
  /** "What to do next lesson" prompt for the teacher. */
  followUp: string;
}

export interface LessonBundle {
  base: LessonBundleBaseWorksheet;
  starter: StarterSlide;
  flow: NowNextThenStrip;
  exit: ExitTicketSlip;
  /** ISO timestamp; useful for footer date. */
  generatedAt: string;
  /** True when AI failed and template placeholders were used. */
  usedFallback: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Now/Next/Then — deterministic, no AI cost
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a sensible 50-minute lesson flow strip from the worksheet metadata.
 * Times sum to 50 minutes by default (5 + 35 + 10) and the labels are
 * subject-aware so EAL / SEND pupils get a clear lesson contract.
 */
export function buildNowNextThen(opts: {
  subject?: string;
  topic?: string;
  duration?: number; // total lesson minutes, default 50
}): NowNextThenStrip {
  const total = opts.duration && opts.duration > 0 ? opts.duration : 50;
  // Allocate proportionally so a 30-min lesson scales sensibly.
  const starter = Math.max(3, Math.round(total * 0.1));
  const exit = Math.max(5, Math.round(total * 0.2));
  const main = Math.max(10, total - starter - exit);
  const subject = opts.subject ? capitalise(opts.subject) : "Today's lesson";
  const topic = opts.topic ? `: ${opts.topic}` : "";

  return {
    now: {
      label: "Do Now",
      minutes: starter,
      detail: "Retrieval starter — answer 2 questions on your whiteboard.",
    },
    next: {
      label: `${subject}${topic}`,
      minutes: main,
      detail: "Worksheet activities (work through the questions in order).",
    },
    then: {
      label: "Exit Ticket",
      minutes: exit,
      detail: "Hand in your slip on the way out — it shows what you learnt.",
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI pass — combined starter + exit ticket in one round-trip
// ─────────────────────────────────────────────────────────────────────────────

const MAX_TOKENS = 1400;

/**
 * Ask the AI to produce the starter slide and exit ticket in a single batched
 * JSON response. Reads the worksheet's first non-teacher section title to
 * keep the starter aligned to today's content.
 */
export async function runLessonBundleAI(input: {
  worksheet: LessonBundleBaseWorksheet;
}): Promise<{ starter: StarterSlide; exit: ExitTicketSlip } | null> {
  try {
    const meta = input.worksheet.metadata || {};
    // Sample up to 600 chars of the worksheet content so the AI knows what
    // the lesson is actually about (handy for vocab + retrieval).
    const sampleContent = (input.worksheet.sections || [])
      .filter((s) => !s.teacherOnly)
      .slice(0, 4)
      .map((s) => `## ${s.title}\n${s.content}`)
      .join("\n\n")
      .slice(0, 1800);

    const system = `You are an experienced UK SEND classroom teacher producing supporting materials for a printable worksheet. Return STRICT JSON only — no markdown fences, no commentary.

Constraints:
1. Year-group + reading-age appropriate. British spelling.
2. Starter must be RETRIEVAL only — questions about prior learning the pupils should already know, NOT today's content. Two short questions max.
3. Vocab: 5–8 short term + 1-sentence definition pairs. Definitions ≤ 14 words, no jargon.
4. Exit ticket: exactly THREE quick checks of TODAY's lesson (mix of one MCQ, one short-answer, one application). Each ≤ 25 words. Provide the model answer + a one-line marking note.
5. Exit ticket follow-up: one actionable sentence the teacher should re-teach if half the class gets a question wrong.
6. Output JSON in this exact schema:
{
  "starter": {
    "title": "Do Now",
    "objective": "string",
    "questions": ["string", "string"],
    "keyVocab": [{"term":"string","definition":"string"}, ...]
  },
  "exit": {
    "title": "Exit Ticket",
    "questions": [
      {"prompt":"string","options":["A","B","C","D"],"answer":"B","markingNote":"string"},
      {"prompt":"string","answer":"string","markingNote":"string"},
      {"prompt":"string","answer":"string","markingNote":"string"}
    ],
    "followUp": "string"
  }
}`;

    const user = `Subject: ${meta.subject || "(unknown)"}\nTopic: ${meta.topic || "(unknown)"}\nYear group: ${meta.yearGroup || "(unknown)"}\nDifficulty: ${meta.difficulty || "mixed"}\n\nWorksheet title: ${input.worksheet.title}\n\nSample of today's worksheet content:\n${sampleContent}\n\nProduce the starter + exit JSON described in the system prompt. No prose outside the JSON.`;

    const { text } = await callAI(system, user, MAX_TOKENS);
    const parsed = extractJson(text);
    if (!parsed) return null;

    const starter = normaliseStarter(parsed.starter);
    const exit = normaliseExit(parsed.exit);
    if (!starter || !exit) return null;
    return { starter, exit };
  } catch {
    return null;
  }
}

/**
 * Build the full lesson bundle. Falls back to deterministic placeholders if
 * the AI pass fails so the booklet always prints.
 */
export async function runLessonBundle(input: {
  worksheet: LessonBundleBaseWorksheet;
  duration?: number;
}): Promise<LessonBundle> {
  const ai = await runLessonBundleAI({ worksheet: input.worksheet });
  const usedFallback = !ai;
  const meta = input.worksheet.metadata || {};

  const starter: StarterSlide =
    ai?.starter || {
      title: "Do Now",
      objective: meta.topic ? `Today: ${meta.topic}` : undefined,
      questions: [
        "Write down one thing you remember from your last lesson on this topic.",
        "Write a question you would like answered today.",
      ],
      keyVocab: [],
    };

  const exit: ExitTicketSlip =
    ai?.exit || {
      title: "Exit Ticket",
      questions: [
        {
          prompt: "What is the ONE thing you understood best from today's lesson?",
          answer: "Pupil reflection — accept any thoughtful response.",
        },
        {
          prompt: "What is one question you still have?",
          answer: "Pupil reflection — accept any thoughtful response.",
        },
        {
          prompt: "Rate your confidence today (1–5).",
          options: ["1", "2", "3", "4", "5"],
          answer: "Self-rating — no correct answer.",
        },
      ],
      followUp:
        "Review responses to flag anyone scoring below 3 — they may need a follow-up conversation.",
    };

  const flow = buildNowNextThen({
    subject: meta.subject,
    topic: meta.topic,
    duration: input.duration,
  });

  return {
    base: input.worksheet,
    starter,
    flow,
    exit,
    generatedAt: new Date().toISOString(),
    usedFallback,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML rendering
// ─────────────────────────────────────────────────────────────────────────────

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderStarterPage(s: StarterSlide, base: LessonBundleBaseWorksheet): string {
  const meta = base.metadata || {};
  const vocab = (s.keyVocab || [])
    .slice(0, 8)
    .map(
      (v) =>
        `<li><strong>${esc(v.term)}</strong> — ${esc(v.definition)}</li>`,
    )
    .join("");
  const questions = (s.questions || [])
    .slice(0, 3)
    .map((q, i) => `<li><span class="lb-q-num">Q${i + 1}.</span> ${esc(q)}</li>`)
    .join("");

  return `<article class="lb-page lb-starter">
    <header class="lb-card-head lb-card-head-amber">
      <span class="lb-pill">STARTER · 5 min</span>
      <h2>${esc(s.title || "Do Now")}</h2>
    </header>
    ${
      s.objective
        ? `<div class="lb-objective"><strong>Today:</strong> ${esc(s.objective)}</div>`
        : ""
    }
    <section class="lb-block">
      <h3>Retrieval — answer on your whiteboard</h3>
      <ol class="lb-questions">${questions || "<li><em>No questions generated.</em></li>"}</ol>
    </section>
    ${
      vocab
        ? `<section class="lb-block">
        <h3>Key vocabulary</h3>
        <ul class="lb-vocab">${vocab}</ul>
      </section>`
        : ""
    }
    <footer class="lb-foot">
      <span>${esc(meta.subject || "")}${meta.topic ? ` · ${esc(meta.topic)}` : ""}${
    meta.yearGroup ? ` · ${esc(meta.yearGroup)}` : ""
  }</span>
      <span>Adaptly · adaptly.co.uk</span>
    </footer>
  </article>`;
}

function renderFlowPage(f: NowNextThenStrip, base: LessonBundleBaseWorksheet): string {
  const total = f.now.minutes + f.next.minutes + f.then.minutes;
  const tile = (kind: "now" | "next" | "then", t: NowNextThenStrip["now"]): string => {
    const labelMap = { now: "Now", next: "Next", then: "Then" } as const;
    const colourMap = {
      now: { bg: "#d1fae5", border: "#10b981", label: "#064e3b" },
      next: { bg: "#dbeafe", border: "#3b82f6", label: "#1e3a8a" },
      then: { bg: "#fde68a", border: "#f59e0b", label: "#7c2d12" },
    } as const;
    const c = colourMap[kind];
    return `<div class="lb-tile" style="background:${c.bg};border:2.5px solid ${c.border};">
      <div class="lb-tile-pill" style="color:${c.label};">${labelMap[kind]} · ${t.minutes} min</div>
      <div class="lb-tile-label" style="color:${c.label};">${esc(t.label)}</div>
      ${t.detail ? `<div class="lb-tile-detail">${esc(t.detail)}</div>` : ""}
    </div>`;
  };
  const meta = base.metadata || {};
  return `<article class="lb-page lb-flow">
    <header class="lb-card-head lb-card-head-blue">
      <span class="lb-pill">LESSON FLOW · ${total} min</span>
      <h2>Now / Next / Then</h2>
    </header>
    <p class="lb-flow-blurb">A simple at-a-glance lesson plan — designed so SEND pupils know what's coming and how long is left.</p>
    <div class="lb-flow-grid">
      ${tile("now", f.now)}
      ${tile("next", f.next)}
      ${tile("then", f.then)}
    </div>
    <footer class="lb-foot">
      <span>Pin to the board · share with TAs · clip to the worksheet folder.</span>
      <span>${esc(meta.subject || "")}${meta.topic ? ` · ${esc(meta.topic)}` : ""}</span>
    </footer>
  </article>`;
}

function renderExitPage(e: ExitTicketSlip, base: LessonBundleBaseWorksheet, viewMode: "teacher" | "student"): string {
  const meta = base.metadata || {};
  const studentQs = e.questions
    .map((q, i) => {
      const opts = q.options && q.options.length > 0
        ? `<ul class="lb-mcq">${q.options
            .map((o) => `<li><span class="lb-checkbox"></span>${esc(o)}</li>`)
            .join("")}</ul>`
        : `<div class="lb-answer-line"></div><div class="lb-answer-line"></div>`;
      return `<li>
        <div class="lb-q-prompt"><strong>Q${i + 1}.</strong> ${esc(q.prompt)}</div>
        ${opts}
      </li>`;
    })
    .join("");

  const teacherQs = e.questions
    .map((q, i) => {
      const optsLine = q.options && q.options.length > 0 ? `<div class="lb-options">Options: ${q.options.map(esc).join(" · ")}</div>` : "";
      return `<li>
        <div><strong>Q${i + 1}.</strong> ${esc(q.prompt)}</div>
        ${optsLine}
        <div class="lb-answer"><strong>Answer:</strong> ${esc(q.answer)}</div>
        ${q.markingNote ? `<div class="lb-marking">Marking: ${esc(q.markingNote)}</div>` : ""}
      </li>`;
    })
    .join("");

  return `<article class="lb-page lb-exit">
    <header class="lb-card-head lb-card-head-purple">
      <span class="lb-pill">EXIT TICKET · 5 min</span>
      <h2>${esc(e.title || "Exit Ticket")}</h2>
    </header>
    <div class="lb-name-row">
      <span><strong>Name:</strong> ____________________</span>
      <span><strong>Class:</strong> _________</span>
      <span><strong>Date:</strong> ${new Date().toLocaleDateString("en-GB")}</span>
    </div>
    <ol class="lb-exit-questions">${studentQs}</ol>
    ${
      viewMode === "teacher"
        ? `<section class="lb-teacher-key ws-teacher-section">
          <h3>Teacher answer key</h3>
          <ol>${teacherQs}</ol>
          <div class="lb-followup"><strong>What to do next lesson:</strong> ${esc(e.followUp || "—")}</div>
        </section>`
        : ""
    }
    <footer class="lb-foot">
      <span>${esc(meta.subject || "")}${meta.topic ? ` · ${esc(meta.topic)}` : ""}${
    meta.yearGroup ? ` · ${esc(meta.yearGroup)}` : ""
  }</span>
      <span>Adaptly · adaptly.co.uk</span>
    </footer>
  </article>`;
}

function renderCoverPage(b: LessonBundle): string {
  const m = b.base.metadata || {};
  return `<article class="lb-page lb-cover">
    <span class="lb-pill lb-pill-emerald">LESSON BUNDLE</span>
    <h1 class="lb-cover-title">${esc(b.base.title)}</h1>
    <div class="lb-cover-meta">
      ${m.yearGroup ? `<span>${esc(m.yearGroup)}</span>` : ""}
      ${m.subject ? `<span>· ${esc(m.subject)}</span>` : ""}
      ${m.topic ? `<span>· ${esc(m.topic)}</span>` : ""}
    </div>
    <ol class="lb-cover-toc">
      <li><strong>1. Starter slide</strong> — print A4 portrait, project on the board.</li>
      <li><strong>2. Now / Next / Then</strong> — A4 landscape, pin near the visualiser.</li>
      <li><strong>3. The worksheet</strong> — print as you normally would (this booklet doesn't include it; use the main Print button).</li>
      <li><strong>4. Exit ticket</strong> — print 1 per pupil; teacher key is on the back.</li>
    </ol>
    ${
      b.usedFallback
        ? `<p class="lb-warn">AI was unavailable — template placeholders were used for the starter and exit ticket. Check both pages before printing.</p>`
        : ""
    }
  </article>`;
}

const STYLESHEET = `
  @page { size: A4 portrait; margin: 14mm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111827; margin: 0; }
  .lb-page { padding: 0; max-width: 740px; margin: 0 auto 24px; page-break-after: always; }
  .lb-page:last-child { page-break-after: auto; }
  .lb-card-head { padding: 12px 16px; border-radius: 8px 8px 0 0; color: #fff; }
  .lb-card-head h2 { margin: 4px 0 0; font-size: 22px; }
  .lb-card-head-amber { background: linear-gradient(135deg, #f59e0b, #b45309); }
  .lb-card-head-blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
  .lb-card-head-purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
  .lb-pill { display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; background: rgba(255,255,255,0.18); color: #fff; padding: 3px 10px; border-radius: 999px; }
  .lb-pill-emerald { background: #10b981; color: #fff; }
  .lb-objective { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px 12px; font-size: 13px; margin: 12px 0; }
  .lb-block { margin: 16px 0; padding: 0 4px; }
  .lb-block h3 { font-size: 14px; color: #1a2744; margin: 0 0 6px; border-bottom: 1.5px solid #e5e7eb; padding-bottom: 2px; }
  .lb-questions { font-size: 14px; line-height: 1.8; padding-left: 24px; }
  .lb-q-num { font-weight: 700; color: #b45309; margin-right: 6px; }
  .lb-vocab { font-size: 12.5px; line-height: 1.7; padding-left: 20px; }
  .lb-foot { margin-top: 16px; padding: 6px 4px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; }
  /* Flow page */
  .lb-flow-blurb { font-size: 12px; color: #4b5563; margin: 8px 4px 14px; }
  .lb-flow-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 12px 0; }
  .lb-tile { padding: 14px; border-radius: 12px; text-align: left; min-height: 130px; display: flex; flex-direction: column; gap: 6px; }
  .lb-tile-pill { font-size: 10px; font-weight: 800; letter-spacing: 0.08em; }
  .lb-tile-label { font-size: 18px; font-weight: 800; line-height: 1.15; }
  .lb-tile-detail { font-size: 12px; color: #1f2937; }
  /* Exit ticket */
  .lb-name-row { display: flex; gap: 18px; font-size: 12px; padding: 10px 4px; border-bottom: 1.5px dashed #e5e7eb; margin-bottom: 10px; }
  .lb-exit-questions { padding-left: 24px; font-size: 13px; line-height: 1.7; }
  .lb-exit-questions > li { margin-bottom: 14px; }
  .lb-q-prompt { margin-bottom: 6px; }
  .lb-mcq { list-style: none; padding-left: 4px; margin: 4px 0; }
  .lb-mcq > li { display: flex; align-items: center; gap: 8px; margin: 3px 0; }
  .lb-checkbox { display: inline-block; width: 13px; height: 13px; border: 1.5px solid #6b7280; border-radius: 2px; flex-shrink: 0; }
  .lb-answer-line { border-bottom: 1px dotted #9ca3af; height: 22px; margin-bottom: 4px; }
  .lb-teacher-key { background: #f0fdf4; border: 1.5px solid #10b981; border-radius: 8px; padding: 12px 14px; margin-top: 18px; page-break-before: always; }
  .lb-teacher-key h3 { color: #065f46; margin: 0 0 6px; font-size: 14px; }
  .lb-teacher-key ol { font-size: 12.5px; line-height: 1.65; padding-left: 22px; }
  .lb-teacher-key li { margin-bottom: 8px; }
  .lb-options { font-size: 11px; color: #6b7280; }
  .lb-answer { font-size: 12.5px; color: #065f46; margin-top: 2px; }
  .lb-marking { font-size: 11px; color: #6b7280; font-style: italic; }
  .lb-followup { background: #fef9c3; border-left: 4px solid #ca8a04; padding: 6px 10px; font-size: 12px; margin-top: 8px; }
  /* Cover */
  .lb-cover { text-align: center; padding-top: 40px; }
  .lb-cover-title { font-size: 28px; color: #064e3b; margin: 14px 0 6px; }
  .lb-cover-meta { font-size: 13px; color: #4b5563; display: inline-flex; gap: 4px; margin-bottom: 16px; flex-wrap: wrap; justify-content: center; }
  .lb-cover-toc { text-align: left; font-size: 13px; line-height: 1.8; margin: 24px auto; max-width: 480px; }
  .lb-warn { background: #fef3c7; border-left: 4px solid #f59e0b; color: #78350f; font-size: 12px; padding: 10px 14px; margin: 12px auto 0; max-width: 520px; text-align: left; }
  @media screen { body { background: #f3f4f6; padding: 16px; } .lb-page { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.08); padding: 24px; border-radius: 6px; } }
`;

export function buildLessonBundleHtml(b: LessonBundle, opts: {
  viewMode?: "teacher" | "student";
  includeCoverPage?: boolean;
} = {}): string {
  const viewMode: "teacher" | "student" = opts.viewMode || "student";
  const includeCover = opts.includeCoverPage !== false;
  const cover = includeCover ? renderCoverPage(b) : "";
  const starterPage = renderStarterPage(b.starter, b.base);
  const flowPage = renderFlowPage(b.flow, b.base);
  const exitPage = renderExitPage(b.exit, b.base, viewMode);
  const contentHtml = `<div class="worksheet-print-root"><style>${STYLESHEET}</style>${cover}${starterPage}${flowPage}${exitPage}</div>`;
  const katexCss = getKatexCssInline();
  return buildPopupHtml(contentHtml, katexCss, {
    viewMode,
    layout: "together",
    title: `Lesson bundle — ${b.base.title}`,
  });
}

export function openLessonBundleWindow(
  b: LessonBundle,
  opts: { viewMode?: "teacher" | "student"; includeCoverPage?: boolean } = {},
): Window | null {
  const html = buildLessonBundleHtml(b, opts);
  const win = window.open("", "_blank", "width=900,height=750,scrollbars=yes,resizable=yes");
  if (!win) return null;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return win;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function capitalise(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function extractJson(raw: string): { starter?: unknown; exit?: unknown } | null {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  try {
    return JSON.parse(cleaned.slice(first, last + 1));
  } catch {
    return null;
  }
}

function normaliseStarter(raw: unknown): StarterSlide | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = typeof r.title === "string" ? r.title : "Do Now";
  const objective = typeof r.objective === "string" ? r.objective : undefined;
  const questions = Array.isArray(r.questions)
    ? (r.questions as unknown[]).filter((q): q is string => typeof q === "string").slice(0, 3)
    : [];
  if (questions.length === 0) return null;
  const keyVocab = Array.isArray(r.keyVocab)
    ? (r.keyVocab as unknown[])
        .filter((v): v is { term?: unknown; definition?: unknown } => typeof v === "object" && v !== null)
        .map((v) => ({
          term: typeof v.term === "string" ? v.term : "",
          definition: typeof v.definition === "string" ? v.definition : "",
        }))
        .filter((v) => v.term && v.definition)
        .slice(0, 8)
    : [];
  return { title, objective, questions, keyVocab };
}

function normaliseExit(raw: unknown): ExitTicketSlip | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = typeof r.title === "string" ? r.title : "Exit Ticket";
  const followUp = typeof r.followUp === "string" ? r.followUp : "";
  if (!Array.isArray(r.questions)) return null;
  const questions: ExitTicketQuestion[] = (r.questions as unknown[])
    .filter((q): q is { prompt?: unknown; options?: unknown; answer?: unknown; markingNote?: unknown } =>
      typeof q === "object" && q !== null,
    )
    .map((q) => ({
      prompt: typeof q.prompt === "string" ? q.prompt : "",
      options: Array.isArray(q.options)
        ? (q.options as unknown[]).filter((o): o is string => typeof o === "string").slice(0, 6)
        : undefined,
      answer: typeof q.answer === "string" ? q.answer : "",
      markingNote: typeof q.markingNote === "string" ? q.markingNote : undefined,
    }))
    .filter((q) => q.prompt && q.answer)
    .slice(0, 4);
  if (questions.length === 0) return null;
  return { title, questions, followUp };
}
