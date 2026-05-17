/**
 * unitPack.test.ts — FEAT-PC5 (pack-1) · Phase C
 *
 * Covers the three public entry points of lib/unitPack.ts:
 *
 *   - planUnit(): deterministic shape, lesson-cap enforcement, spec-point
 *     anchoring when a bundled taxonomy matches.
 *   - executeUnit(): per-lesson progress event ordering (started → ok|failed
 *     in lesson-index order) and AbortSignal mid-run termination.
 *   - bundleUnit('zip'): JSZip output structure — week folders, pupil +
 *     teacher PDFs per ok lesson, FAILED.txt per failed lesson, plus the
 *     overview CSV + Markdown files at the root.
 *
 * Network: no real AI is called — `vi.mock('../ai', …)` swaps the module
 * for a lightweight stub. PDF synthesis is also mocked so the test runs
 * without jsPDF on a Node 22 sandbox (the jsPDF library is heavy and the
 * test would otherwise add ~200ms per ZIP step).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import JSZip from "jszip";

// ─── Mocks ─────────────────────────────────────────────────────────────────

vi.mock("../ai", () => ({
  aiGenerateWorksheet: vi.fn(),
}));

// PDF blobs: avoid pulling jsPDF for the ZIP-structure assertions. Each call
// returns a tiny deterministic Uint8Array wrapped in a Blob so JSZip writes
// real bytes into the archive (and we can verify presence on read-back).
vi.mock("../unitPackPdfShim", () => ({
  buildLessonPdfBlob: vi.fn(async (
    _plan: unknown,
    lesson: { index: number; title: string },
    _ws: unknown,
    view: "student" | "teacher",
  ) => {
    const stamp = `PDF lesson=${lesson.index} title=${lesson.title} view=${view}`;
    return new Blob([new TextEncoder().encode(stamp)], { type: "application/pdf" });
  }),
}));

// ─── Imports (after mocks) ─────────────────────────────────────────────────

import {
  planUnit,
  executeUnit,
  bundleUnit,
  MAX_LESSONS,
  type UnitProgressEvent,
  type UnitLessonResult,
} from "../unitPack";
import { aiGenerateWorksheet } from "../ai";

// Helper: collect every progress event from the generator into an array.
async function collectProgress(
  iter: AsyncGenerator<UnitProgressEvent, UnitLessonResult[], void>,
): Promise<{ events: UnitProgressEvent[]; results: UnitLessonResult[] }> {
  const events: UnitProgressEvent[] = [];
  let next = await iter.next();
  while (!next.done) {
    events.push(next.value);
    next = await iter.next();
  }
  return { events, results: next.value };
}

/** A successful default impl that returns a deterministic worksheet stub. */
const defaultAiImpl = async (params: { topic: string }) => ({
  title: `Worksheet on ${params.topic}`,
  subtitle: "auto-generated",
  sections: [
    { title: "Starter", content: "Q1: Try this.", type: "starter" },
    { title: "Mark scheme", content: "Q1: A.", type: "mark-scheme", teacherOnly: true },
  ],
  metadata: { adaptations: [] as string[], difficulty: "mixed" },
  isAI: true as const,
  provider: "stub",
});

beforeEach(() => {
  // Restore the success path before every test — the failing-retry test
  // mutates the impl and we don't want it leaking.
  (aiGenerateWorksheet as unknown as ReturnType<typeof vi.fn>).mockReset();
  (aiGenerateWorksheet as unknown as ReturnType<typeof vi.fn>).mockImplementation(defaultAiImpl);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── planUnit() ────────────────────────────────────────────────────────────

describe("planUnit", () => {
  it("returns one lesson per week by default", () => {
    const plan = planUnit({
      subject: "Mathematics",
      topic: "Linear graphs",
      yearGroup: "Year 10",
      weeks: 4,
      ability: "mixed",
    });
    expect(plan.lessons).toHaveLength(4);
    expect(plan.lessons.map((l) => l.index)).toEqual([1, 2, 3, 4]);
    expect(plan.lessons.map((l) => l.week)).toEqual([1, 2, 3, 4]);
    expect(plan.unitTitle).toContain("Linear graphs");
  });

  it("respects lessonsPerWeek and stamps positionInWeek", () => {
    const plan = planUnit({
      subject: "English",
      topic: "Romeo & Juliet",
      yearGroup: "Year 9",
      weeks: 2,
      lessonsPerWeek: 3,
      ability: "mixed",
    });
    expect(plan.lessons).toHaveLength(6);
    expect(plan.lessons[0]).toMatchObject({ week: 1, positionInWeek: 1 });
    expect(plan.lessons[2]).toMatchObject({ week: 1, positionInWeek: 3 });
    expect(plan.lessons[3]).toMatchObject({ week: 2, positionInWeek: 1 });
  });

  it("clamps to MAX_LESSONS when the input requests more", () => {
    const plan = planUnit({
      subject: "Mathematics",
      topic: "Algebra",
      yearGroup: "Year 10",
      weeks: 12,
      lessonsPerWeek: 5, // 60 → clamped
      ability: "mixed",
    });
    expect(plan.lessons.length).toBeLessThanOrEqual(MAX_LESSONS);
    expect(plan.lessons.length).toBe(MAX_LESSONS);
  });

  it("anchors lessons to spec refs when a bundled taxonomy matches", () => {
    // AQA Maths Y10 ships with this PR / earlier; planUnit should populate
    // specRefs for at least the lessons whose deterministic sample lands on
    // a spec point with a topic-token match.
    const plan = planUnit({
      subject: "Mathematics",
      topic: "Algebra",
      yearGroup: "Year 10",
      weeks: 3,
      ability: "mixed",
      board: "aqa",
    });
    const refs = plan.lessons.flatMap((l) => l.specRefs);
    // The dataset definitely covers "algebra" — every lesson should anchor.
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.length).toBeLessThanOrEqual(plan.lessons.length);
  });

  it("emits a generatedAt timestamp + plan-level metadata", () => {
    const plan = planUnit({
      subject: "Mathematics",
      topic: "Fractions",
      yearGroup: "Year 5",
      weeks: 2,
      ability: "support",
    });
    expect(typeof plan.generatedAt).toBe("string");
    expect(new Date(plan.generatedAt).toString()).not.toBe("Invalid Date");
    expect(plan.finalAssessmentBrief).toContain("Fractions");
    expect(plan.knowledgeOrganiserOutline.length).toBeGreaterThan(0);
    expect(plan.parentLetterTopic).toContain("Fractions");
  });
});

// ─── executeUnit() ────────────────────────────────────────────────────────

describe("executeUnit", () => {
  it("emits started → ok pairs in lesson-index order", async () => {
    const plan = planUnit({
      subject: "Mathematics",
      topic: "Algebra",
      yearGroup: "Year 10",
      weeks: 3,
      ability: "mixed",
    });
    const { events, results } = await collectProgress(executeUnit(plan, { minGapMs: 0 }));
    // 3 lessons × 2 events each = 6 events, in the right order.
    expect(events).toHaveLength(plan.lessons.length * 2);
    for (let i = 0; i < plan.lessons.length; i++) {
      expect(events[i * 2].status).toBe("started");
      expect(events[i * 2].stepIdx).toBe(i);
      expect(events[i * 2 + 1].status).toBe("ok");
      expect(events[i * 2 + 1].stepIdx).toBe(i);
    }
    expect(results).toHaveLength(plan.lessons.length);
    expect(results.every((r) => r.worksheet !== null)).toBe(true);
    expect(aiGenerateWorksheet).toHaveBeenCalledTimes(plan.lessons.length);
  }, 30000);

  it("yields a failed event when aiGenerateWorksheet throws on every retry", async () => {
    (aiGenerateWorksheet as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async () => {
        throw new Error("boom");
      },
    );
    const plan = planUnit({
      subject: "Mathematics",
      topic: "Algebra",
      yearGroup: "Year 10",
      weeks: 1,
      ability: "mixed",
    });
    const { events, results } = await collectProgress(executeUnit(plan, { minGapMs: 0 }));
    const last = events[events.length - 1];
    expect(last.status).toBe("failed");
    if (last.status === "failed") expect(last.error).toContain("boom");
    expect(results).toHaveLength(1);
    expect(results[0].worksheet).toBeNull();
    // 1 attempt + 2 retries == 3 calls per lesson.
    expect(aiGenerateWorksheet).toHaveBeenCalledTimes(3);
  }, 30000);

  it("aborts mid-run and returns partial results", async () => {
    const plan = planUnit({
      subject: "Mathematics",
      topic: "Algebra",
      yearGroup: "Year 10",
      weeks: 4,
      ability: "mixed",
    });
    const ctrl = new AbortController();
    const events: UnitProgressEvent[] = [];
    const iter = executeUnit(plan, { signal: ctrl.signal, minGapMs: 0 });
    let count = 0;
    for await (const ev of iter) {
      events.push(ev);
      // Abort right after the first lesson finishes (the 'ok' event).
      if (ev.status === "ok" && ++count === 1) ctrl.abort();
    }
    // We saw at least one started + one ok event before stopping.
    expect(events.some((e) => e.status === "started")).toBe(true);
    expect(events.some((e) => e.status === "ok")).toBe(true);
    // We did NOT receive events for every lesson in the plan — abort cut
    // the run short before the remaining lessons started.
    const startedCount = events.filter((e) => e.status === "started").length;
    expect(startedCount).toBeLessThan(plan.lessons.length);
  }, 30000);
});

// ─── bundleUnit('zip') ────────────────────────────────────────────────────

describe("bundleUnit('zip')", () => {
  it("emits week folders + pupil/teacher PDFs + overview files", async () => {
    const plan = planUnit({
      subject: "Mathematics",
      topic: "Algebra",
      yearGroup: "Year 10",
      weeks: 2,
      ability: "mixed",
    });
    const okWorksheet = {
      title: "Lesson 1 — Algebra",
      subtitle: "stub",
      sections: [{ title: "Q1", content: "answer this", type: "independent" }],
      metadata: { adaptations: [], difficulty: "mixed" },
      isAI: true as const,
    };
    const results: UnitLessonResult[] = plan.lessons.map((l) => ({
      lesson: l,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      worksheet: okWorksheet as any,
    }));

    const blob = await bundleUnit(plan, results, "zip");
    expect(blob).toBeInstanceOf(Blob);

    // Re-read the zip to verify file structure.
    const buf = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const names = Object.keys(zip.files);

    // Top-level overview files exist.
    expect(names).toContain("unit-overview.csv");
    expect(names).toContain("unit-overview.md");

    // Two PDFs per lesson, grouped by week folder.
    for (const l of plan.lessons) {
      const week = `Week ${l.week}`;
      const pupilCandidates = names.filter(
        (n) => n.startsWith(`${week}/Lesson ${l.index} `) && n.endsWith("pupil.pdf"),
      );
      const teacherCandidates = names.filter(
        (n) => n.startsWith(`${week}/Lesson ${l.index} `) && n.endsWith("teacher-key.pdf"),
      );
      expect(pupilCandidates).toHaveLength(1);
      expect(teacherCandidates).toHaveLength(1);
    }

    // Overview CSV header row + one row per lesson.
    const csv = await zip.files["unit-overview.csv"].async("string");
    const csvLines = csv.split("\n").filter(Boolean);
    expect(csvLines[0]).toMatch(/^Lesson,Week,/);
    expect(csvLines).toHaveLength(plan.lessons.length + 1);

    // Overview Markdown has one ### heading per lesson.
    const md = await zip.files["unit-overview.md"].async("string");
    const headingCount = (md.match(/^### Lesson /gm) || []).length;
    expect(headingCount).toBe(plan.lessons.length);
  }, 30000);

  it("writes a FAILED.txt instead of PDFs when a lesson failed", async () => {
    const plan = planUnit({
      subject: "Mathematics",
      topic: "Algebra",
      yearGroup: "Year 10",
      weeks: 2,
      ability: "mixed",
    });
    const results: UnitLessonResult[] = [
      {
        lesson: plan.lessons[0],
        worksheet: {
          title: "ok",
          subtitle: "",
          sections: [],
          metadata: { adaptations: [], difficulty: "mixed" },
          isAI: true as const,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
      { lesson: plan.lessons[1], worksheet: null, error: "AI provider 503" },
    ];
    const blob = await bundleUnit(plan, results, "zip");
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const names = Object.keys(zip.files);
    // Lesson 1: pupil + teacher PDFs.
    expect(names.some((n) => n.includes("Lesson 1") && n.endsWith("pupil.pdf"))).toBe(true);
    // Lesson 2: failure stub, no PDFs.
    expect(names.some((n) => n.includes("Lesson 2") && n.endsWith("FAILED.txt"))).toBe(true);
    expect(names.some((n) => n.includes("Lesson 2") && n.endsWith("pupil.pdf"))).toBe(false);
    const stub = await zip.files[
      names.find((n) => n.endsWith("FAILED.txt"))!
    ].async("string");
    expect(stub).toContain("AI provider 503");
  }, 30000);

  it("rejects unsupported bundle formats", async () => {
    const plan = planUnit({
      subject: "Mathematics",
      topic: "Algebra",
      yearGroup: "Year 10",
      weeks: 1,
      ability: "mixed",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(bundleUnit(plan, [], "cc" as any)).rejects.toThrow(/not supported/);
  });
});
