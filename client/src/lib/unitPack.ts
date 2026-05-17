/**
 * unitPack.ts — FEAT-PC5 (pack-1) · Phase C
 * ──────────────────────────────────────────────────────────────────────────
 * Bulk scheme-of-work generator. One brief in → one zip out.
 *
 *   - planUnit(): deterministic plan, no AI, anchors lessons to PC4 spec
 *     points when a taxonomy is bundled. Capped at MAX_LESSONS.
 *   - executeUnit(): async generator over aiGenerateWorksheet calls;
 *     yields per-lesson progress; honours AbortSignal.
 *   - bundleUnit('zip'): JSZip blob with per-week folders, pupil + teacher
 *     PDFs per lesson, plus an overview CSV + Markdown at the root.
 *
 * Common Cartridge ('cc') and lms-push arrive in PC5-pack-2 / PC1.
 */

import JSZip from "jszip";
import { aiGenerateWorksheet, type AIWorksheetResult, type AIWorksheetSection } from "./ai";
import {
  getSpecPoints,
  type ExamBoard,
  type SpecPoint,
} from "./specPointTaxonomy";

// JSZip ships its own ESM types; we only need a structural alias.
type ZipFile = JSZip;

// ─── Tunables ──────────────────────────────────────────────────────────────

/** Hard cap on lessons in a single unit pack — see FEAT-PC5 acceptance. */
export const MAX_LESSONS = 20;
/** Lessons per minute upper bound — matches aiGenerateWorksheet retry loop. */
const LESSONS_PER_MINUTE_CAP = 6;
/** Per-lesson AI retry attempts (matches the existing aiGenerateWorksheet caller pattern). */
const PER_LESSON_RETRIES = 2;
/** Minimum gap between AI calls to honour LESSONS_PER_MINUTE_CAP. */
const MIN_GAP_MS = Math.ceil(60_000 / LESSONS_PER_MINUTE_CAP);

// ─── Public types ──────────────────────────────────────────────────────────

export type AbilityTier = "mixed" | "foundation" | "higher" | "support";

export interface UnitPlanLesson {
  /** 1-based lesson index across the whole unit. */
  index: number;
  /** 1-based week the lesson sits in. */
  week: number;
  /** Position within the week (1, 2, 3…). */
  positionInWeek: number;
  /** Lesson title (deterministic from spec point title or topic). */
  title: string;
  /** 1–3 short learning objectives. */
  objectives: string[];
  /** Spec-point references — empty when no taxonomy bundled. */
  specRefs: string[];
  /** Free-form additional instructions to forward to aiGenerateWorksheet. */
  brief: string;
}

export interface UnitPlan {
  unitTitle: string;
  subject: string;
  yearGroup: string;
  topic: string;
  weeks: number;
  ability: AbilityTier;
  board?: ExamBoard;
  /** Resolved exactly once at plan time so executeUnit + bundleUnit agree. */
  lessons: UnitPlanLesson[];
  /** What the plan would tell the assessment / KO / parent-letter calls. */
  finalAssessmentBrief: string;
  knowledgeOrganiserOutline: string[];
  parentLetterTopic: string;
  /** Stamped at plan time so bundleUnit can surface it in the overview. */
  generatedAt: string;
}

export type UnitProgressEvent =
  | { stepIdx: number; status: "started"; lesson: UnitPlanLesson }
  | { stepIdx: number; status: "ok"; lesson: UnitPlanLesson; worksheet: AIWorksheetResult }
  | { stepIdx: number; status: "failed"; lesson: UnitPlanLesson; error: string };

export interface UnitLessonResult {
  lesson: UnitPlanLesson;
  worksheet: AIWorksheetResult | null;
  error?: string;
}

export interface ExecuteUnitOptions {
  signal?: AbortSignal;
  /** Optional override for the per-lesson SEND need passed through. */
  sendNeed?: string;
  /** Optional override for the worksheet length passed through. */
  worksheetLength?: string;
  /** Hook for the UI to mirror progress without `for await` plumbing. */
  onProgress?: (ev: UnitProgressEvent) => void;
  /**
   * Override the minimum gap between AI calls. Defaults to MIN_GAP_MS so
   * production traffic respects the LESSONS_PER_MINUTE_CAP. Tests pass `0`
   * to make a 4-lesson run finish in milliseconds.
   */
  minGapMs?: number;
}

export type UnitBundleFormat = "zip"; // 'cc' / 'lms-push' arrive in sibling PRs.

// ─── planUnit ──────────────────────────────────────────────────────────────

export interface PlanUnitInput {
  subject: string;
  topic: string;
  yearGroup: string;
  weeks: number;
  ability: AbilityTier;
  board?: ExamBoard;
  /** Lessons per week, default 1. Total lessons = weeks * lessonsPerWeek. */
  lessonsPerWeek?: number;
}

/**
 * Build a deterministic UnitPlan. No AI calls — pure metadata. The lesson
 * cap (MAX_LESSONS) is enforced here so executeUnit + bundleUnit can rely
 * on it.
 */
export function planUnit(input: PlanUnitInput): UnitPlan {
  const weeks = clamp(Math.floor(input.weeks || 1), 1, 12);
  const lpw = clamp(Math.floor(input.lessonsPerWeek ?? 1), 1, 5);
  const totalRaw = weeks * lpw;
  const total = clamp(totalRaw, 1, MAX_LESSONS);

  // Anchor lessons to spec points when a taxonomy is bundled. We sample
  // evenly across the dataset so a 6-lesson unit on a 12-spec topic doesn't
  // duplicate spec refs.
  const dataset = input.board
    ? getSpecPoints(input.board, input.subject, input.yearGroup)
    : null;
  const candidatePoints: SpecPoint[] = dataset
    ? filterSpecPointsForTopic(dataset.specPoints, input.topic)
    : [];

  const lessons: UnitPlanLesson[] = [];
  for (let i = 0; i < total; i++) {
    const week = Math.floor(i / lpw) + 1;
    const positionInWeek = (i % lpw) + 1;
    const point = candidatePoints.length
      ? candidatePoints[Math.floor((i / total) * candidatePoints.length)]
      : null;
    const fallbackTitle = `${input.topic} — Lesson ${i + 1}`;
    const title = point ? `${input.topic}: ${point.specTitle}` : fallbackTitle;
    const objectives = point
      ? [`Understand ${point.specTitle.toLowerCase()}.`, `Apply it to a worked example.`]
      : [`Understand a key idea in ${input.topic}.`, `Apply it to a worked example.`];
    const specRefs = point ? [point.specRef] : [];
    const brief = point
      ? `Anchor every question to ${point.specRef} (${point.specTitle}). Tier: ${input.ability}.`
      : `Tier: ${input.ability}. Topic focus: ${input.topic}.`;
    lessons.push({
      index: i + 1,
      week,
      positionInWeek,
      title,
      objectives,
      specRefs,
      brief,
    });
  }

  return {
    unitTitle: `${input.topic} — ${input.yearGroup} ${input.subject}`,
    subject: input.subject,
    yearGroup: input.yearGroup,
    topic: input.topic,
    weeks,
    ability: input.ability,
    board: input.board,
    lessons,
    finalAssessmentBrief: `End-of-unit assessment covering ${lessons.length} lessons on ${input.topic}.`,
    knowledgeOrganiserOutline: [
      "Key vocabulary",
      "Worked examples",
      "Common misconceptions",
      "Spec-point checklist",
    ],
    parentLetterTopic: `${input.topic} (${input.yearGroup})`,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Heuristic spec-point filter. The worksheet topic field is free-text
 * ("Romeo & Juliet", "Linear graphs", "Forces & Motion"), but spec point
 * titles are awarding-body short-form. We accept ALL points when the
 * heuristic returns nothing so the plan still produces lessons; that's
 * deliberately lenient — the alternative is an empty unit pack.
 */
function filterSpecPointsForTopic(points: SpecPoint[], topic: string): SpecPoint[] {
  const needle = topic.trim().toLowerCase();
  if (!needle) return points;
  const tokens = needle.split(/[^a-z0-9]+/i).filter((t) => t.length > 2);
  const matched = points.filter((p) => {
    const t = p.specTitle.toLowerCase();
    return tokens.some((tok) => t.includes(tok));
  });
  return matched.length > 0 ? matched : points;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ─── executeUnit ───────────────────────────────────────────────────────────

/**
 * Run aiGenerateWorksheet sequentially across the plan's lessons, yielding
 * one progress event per lesson. Honours AbortSignal — when the signal
 * aborts mid-run, the generator yields a `failed` event for the current
 * lesson and returns the (partial) results array.
 */
export async function* executeUnit(
  plan: UnitPlan,
  opts: ExecuteUnitOptions = {},
): AsyncGenerator<UnitProgressEvent, UnitLessonResult[], void> {
  const results: UnitLessonResult[] = [];
  let lastTick = 0;
  const minGap = opts.minGapMs ?? MIN_GAP_MS;

  for (let i = 0; i < plan.lessons.length; i++) {
    if (opts.signal?.aborted) break;
    const lesson = plan.lessons[i];

    // Rate limit: pace AI calls so we don't outrun the worksheet generator
    // backend. The `Math.max(0, …)` guards against negative gaps when the
    // previous call took longer than minGap.
    const wait = Math.max(0, minGap - (Date.now() - lastTick));
    if (wait > 0 && i > 0) await sleep(wait, opts.signal);
    if (opts.signal?.aborted) break;

    const startedEvt: UnitProgressEvent = { stepIdx: i, status: "started", lesson };
    opts.onProgress?.(startedEvt);
    yield startedEvt;

    let attempt = 0;
    let lastErr = "";
    let worksheet: AIWorksheetResult | null = null;
    while (attempt <= PER_LESSON_RETRIES) {
      if (opts.signal?.aborted) break;
      try {
        worksheet = await aiGenerateWorksheet({
          subject: plan.subject,
          topic: plan.topic,
          yearGroup: plan.yearGroup,
          examBoard: plan.board,
          difficulty: tierToDifficulty(plan.ability),
          sendNeed: opts.sendNeed,
          worksheetLength: opts.worksheetLength ?? "30",
          includeAnswers: true,
          additionalInstructions: lesson.brief,
        });
        break;
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
        attempt++;
        if (attempt > PER_LESSON_RETRIES) break;
        // Light back-off — first retry near-immediate, second waits a beat.
        // Tests pass minGapMs: 0 to short-circuit the wait entirely.
        const backoff = minGap === 0 ? 0 : attempt * 1500;
        await sleep(backoff, opts.signal);
      }
    }
    lastTick = Date.now();

    if (worksheet) {
      results.push({ lesson, worksheet });
      const okEvt: UnitProgressEvent = { stepIdx: i, status: "ok", lesson, worksheet };
      opts.onProgress?.(okEvt);
      yield okEvt;
    } else {
      results.push({ lesson, worksheet: null, error: lastErr || "unknown" });
      const failEvt: UnitProgressEvent = {
        stepIdx: i,
        status: "failed",
        lesson,
        error: lastErr || "unknown",
      };
      opts.onProgress?.(failEvt);
      yield failEvt;
    }
  }
  return results;
}

function tierToDifficulty(t: AbilityTier): string {
  switch (t) {
    case "foundation":
    case "support":
      return "foundation";
    case "higher":
      return "higher";
    default:
      return "mixed";
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (ms <= 0) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}

// ─── bundleUnit ────────────────────────────────────────────────────────────

/**
 * Stitch the plan + per-lesson results into a single zip blob.
 *
 *   /unit-overview.csv    — one row per lesson; index, week, title, specRefs, status
 *   /unit-overview.md     — same data plus per-lesson objectives, human-readable
 *   /Week 1/
 *     /Lesson 1 — pupil.pdf
 *     /Lesson 1 — teacher-key.pdf
 *     /Lesson 2 — pupil.pdf
 *     ...
 *
 * Lessons that failed to generate get a stub placeholder PDF with the
 * error string so the directory layout stays predictable; teachers can
 * regenerate the missing lessons via the normal worksheet flow.
 */
export async function bundleUnit(
  plan: UnitPlan,
  results: UnitLessonResult[],
  format: UnitBundleFormat = "zip",
): Promise<Blob> {
  if (format !== "zip") {
    throw new Error(
      `bundleUnit: '${format}' format is not supported in this build. Common ` +
        `Cartridge ('cc') and 'lms-push' arrive in sibling PRs (PC5-pack-2 and ` +
        `PC1).`,
    );
  }
  // Lazy-load PdfBuilder so test environments that mock pdf-generator don't
  // pay its cost. Vitest's `vi.mock` pattern supports both shapes.
  const { buildLessonPdfBlob } = await import("./unitPackPdfShim");
  const zip: ZipFile = new JSZip();

  zip.file("unit-overview.csv", buildOverviewCsv(plan, results));
  zip.file("unit-overview.md", buildOverviewMarkdown(plan, results));

  for (const r of results) {
    const week = `Week ${r.lesson.week}`;
    const safeTitle = sanitiseFilename(r.lesson.title) || `Lesson-${r.lesson.index}`;
    const stem = `Lesson ${r.lesson.index} — ${safeTitle}`;
    if (r.worksheet) {
      const pupilPdf = await buildLessonPdfBlob(plan, r.lesson, r.worksheet, "student");
      const teacherPdf = await buildLessonPdfBlob(plan, r.lesson, r.worksheet, "teacher");
      zip.file(`${week}/${stem} — pupil.pdf`, pupilPdf);
      zip.file(`${week}/${stem} — teacher-key.pdf`, teacherPdf);
    } else {
      const stub = buildFailureStub(plan, r.lesson, r.error || "unknown error");
      zip.file(`${week}/${stem} — FAILED.txt`, stub);
    }
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

function buildOverviewCsv(plan: UnitPlan, results: UnitLessonResult[]): string {
  const rows: string[][] = [
    ["Lesson", "Week", "Position", "Title", "SpecRefs", "Status", "Error"],
  ];
  for (const r of results) {
    const status = r.worksheet ? "ok" : "failed";
    rows.push([
      String(r.lesson.index),
      String(r.lesson.week),
      String(r.lesson.positionInWeek),
      r.lesson.title,
      r.lesson.specRefs.join("; "),
      status,
      r.error ?? "",
    ]);
  }
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

function csvCell(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildOverviewMarkdown(plan: UnitPlan, results: UnitLessonResult[]): string {
  const lines: string[] = [];
  lines.push(`# ${plan.unitTitle}`);
  lines.push("");
  lines.push(`- Subject: ${plan.subject}`);
  lines.push(`- Year group: ${plan.yearGroup}`);
  lines.push(`- Topic: ${plan.topic}`);
  lines.push(`- Weeks: ${plan.weeks}`);
  lines.push(`- Lessons: ${plan.lessons.length}`);
  lines.push(`- Ability tier: ${plan.ability}`);
  if (plan.board) lines.push(`- Board: ${plan.board.toUpperCase()}`);
  lines.push(`- Generated: ${plan.generatedAt}`);
  lines.push("");
  lines.push("## Lessons");
  lines.push("");
  for (const r of results) {
    const okMark = r.worksheet ? "✓" : "✗";
    lines.push(`### Lesson ${r.lesson.index} — ${r.lesson.title} ${okMark}`);
    lines.push(`*Week ${r.lesson.week}, position ${r.lesson.positionInWeek}*`);
    if (r.lesson.specRefs.length > 0) {
      lines.push(`Spec refs: ${r.lesson.specRefs.join(", ")}`);
    }
    for (const obj of r.lesson.objectives) lines.push(`- ${obj}`);
    if (!r.worksheet && r.error) lines.push(`> Failed: ${r.error}`);
    lines.push("");
  }
  return lines.join("\n");
}

function buildFailureStub(plan: UnitPlan, lesson: UnitPlanLesson, error: string): string {
  return [
    `${plan.unitTitle}`,
    `Lesson ${lesson.index} (Week ${lesson.week}, position ${lesson.positionInWeek})`,
    `Title: ${lesson.title}`,
    "",
    "This lesson failed to generate when the unit pack was built.",
    `Error: ${error}`,
    "",
    "Re-run the unit pack to retry this lesson, or open the worksheet generator",
    "and create it manually using the brief below:",
    "",
    lesson.brief,
  ].join("\n");
}

function sanitiseFilename(s: string): string {
  return s
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

// ─── Re-exports ────────────────────────────────────────────────────────────

export type { AIWorksheetResult, AIWorksheetSection };
