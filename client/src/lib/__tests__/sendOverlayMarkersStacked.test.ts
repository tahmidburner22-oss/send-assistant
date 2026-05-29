/**
 * Tests for `enforceSendOverlayMarkers` Lane 2.3 stacked-need
 * dispatcher (compound `+`-separated sendNeed strings).
 *
 * Companion to `sendOverlayMarkers.test.ts`'s "stacked-need
 * composability" suite (commit d2d48d8). That suite calls each
 * single-need branch in sequence to verify they DON'T clobber each
 * other; this suite calls the dispatcher with the actual compound
 * key (e.g. `"hi+eal"`) to verify the parser, priority order, and
 * idempotency hold end-to-end.
 *
 * The stacked dispatcher recurses into `enforceSendOverlayMarkers`
 * once per part in priority order:
 *
 *   HI (10) → Dyslexia (20) → MLD (30) → Anxiety (40) →
 *   ADHD (50) → Dyscalculia (60) → EAL (70) →
 *   VI (80) → Dyspraxia (90)
 *
 * Anxiety runs BEFORE ADHD so its "OPTIONAL BONUS" Challenge title
 * lands first; the `SEND_RENAMED_CHALLENGE_TITLES` first-rename-wins
 * guard (commit d2d48d8) then makes ADHD skip its own rename.
 *
 * The order is deliberately documented in the dispatcher's JSDoc; a
 * regression here means a future PR has shifted priority and these
 * tests guard against silently breaking the stacked-fixtures eval
 * suite.
 */

import { describe, expect, it } from "vitest";
import {
  enforceSendOverlayMarkers,
  runStackedSendMarkers,
  type PostValidatorWorksheet,
  type PostValidatorSection,
} from "../worksheetPostValidator";

// ── Test fixture builder ────────────────────────────────────────────────────

function makeWs(
  sendNeed: string,
  sectionsExtra: PostValidatorSection[] = [],
): PostValidatorWorksheet {
  return {
    title: "Y9 Geography — Plate tectonics",
    metadata: {
      subject: "Geography",
      topic: "Plate tectonics",
      yearGroup: "Year 9",
      sendNeed,
    },
    sections: [
      {
        id: "lo",
        type: "objective",
        title: "Learning Objectives",
        content:
          "Describe how convection currents drive plate movement and explain the link to earthquakes.",
        teacherOnly: false,
      },
      {
        id: "vocab",
        type: "vocabulary",
        title: "Key Vocabulary",
        content:
          "convection — heat transfer in a fluid\nplate — a section of the lithosphere\nfault — a crack between two plates\nepicentre — the surface point above an earthquake",
        teacherOnly: false,
      },
      {
        id: "we",
        type: "example",
        title: "Worked Example",
        content:
          "Step 1: Identify the plate boundary.\nStep 2: Describe the movement.\nStep 3: Link to the hazard.",
        teacherOnly: false,
      },
      ...sectionsExtra,
      {
        id: "q1",
        type: "q-mcq",
        title: "Q1 — Recall",
        content:
          "Which boundary type produces a deep ocean trench? [1 mark]\nA Constructive\nB Destructive\nC Conservative\nD Collision",
        teacherOnly: false,
      },
      {
        id: "q2",
        type: "q-short-answer",
        title: "Q2 — Recall",
        content: "State 2 features of a destructive plate boundary. [2 marks]",
        teacherOnly: false,
      },
      {
        id: "q3",
        type: "q-extended",
        title: "Q3 — Application",
        content:
          "Explain why the Pacific Ring of Fire experiences frequent earthquakes. (4 marks)",
        teacherOnly: false,
      },
      {
        id: "q4",
        type: "q-extended",
        title: "Q4 — Calculation",
        content:
          "An earthquake measured 6.4 on the Richter scale at one station and 4.2 at a station 200 km away. Calculate the percentage decrease. (3 marks)",
        teacherOnly: false,
      },
      {
        id: "challenge",
        type: "challenge",
        title: "Challenge Question",
        content:
          "Evaluate which is more dangerous: a destructive boundary earthquake or a constructive boundary volcano. (8 marks)",
        teacherOnly: false,
      },
      {
        id: "tk",
        type: "mark-scheme",
        title: "Teacher Key",
        content:
          "Q1: B; Q2: deep trench, fold mountains; Q3: subduction → friction → seismic stress release; …",
        teacherOnly: true,
      },
    ],
  };
}

function isIdempotentStacked(
  ws: PostValidatorWorksheet,
  sendNeed: string,
): boolean {
  const r1 = enforceSendOverlayMarkers(ws, { sendNeed });
  const r2 = enforceSendOverlayMarkers(r1.worksheet, { sendNeed });
  return (
    JSON.stringify(r1.worksheet) === JSON.stringify(r2.worksheet) &&
    r2.warnings.length === 0
  );
}

// ── HI + EAL ────────────────────────────────────────────────────────────────

describe("Stacked dispatcher — HI + EAL", () => {
  it("inserts HI's Topic Summary AND appends EAL sentence frames", () => {
    const ws = makeWs("hi+eal");
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, {
      sendNeed: "hi+eal",
    });
    const sections = worksheet.sections!;

    // HI marker — topic-summary section inserted.
    const summary = sections.find((s) => s.type === "topic-summary");
    expect(summary).toBeDefined();
    expect(String(summary!.content)).toMatch(/Plate tectonics/);

    // EAL marker — sentence-frame on extended-response questions.
    const extendedQuestions = sections.filter(
      (s) => s.type === "q-extended" || s.type === "challenge",
    );
    expect(extendedQuestions.length).toBeGreaterThan(0);
    for (const q of extendedQuestions) {
      expect(String(q.content)).toMatch(/Sentence frame:/i);
    }

    // Both branches stamped warnings.
    expect(warnings.some((w) => /Phase 4 — HI/.test(w))).toBe(true);
    expect(warnings.some((w) => /Phase 4 — EAL/.test(w))).toBe(true);
    // Stacked framing warning is prepended.
    expect(warnings[0]).toMatch(/Stacked SEND/);
  });

  it("is idempotent (re-running produces no new mutations)", () => {
    expect(isIdempotentStacked(makeWs("hi+eal"), "hi+eal")).toBe(true);
  });
});

// ── ADHD + Dyslexia ─────────────────────────────────────────────────────────

describe("Stacked dispatcher — ADHD + Dyslexia", () => {
  it("inserts Dyslexia method-box AND prefixes ADHD tick-boxes on every question", () => {
    const ws = makeWs("adhd+dyslexia");
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, {
      sendNeed: "adhd+dyslexia",
    });
    const sections = worksheet.sections!;

    // Dyslexia marker — method-box inserted before first question.
    const methodBox = sections.find(
      (s) =>
        String(s.type || "").toLowerCase() === "method-box" ||
        /method\s*step/i.test(String(s.title || "")),
    );
    expect(methodBox).toBeDefined();

    // ADHD marker — every question content begins with "[ ] ".
    const questions = sections.filter(
      (s) =>
        String(s.type || "").startsWith("q-") || s.type === "challenge",
    );
    for (const q of questions) {
      const firstLine = (
        String(q.content || "")
          .split("\n")
          .find((l) => l.trim()) || ""
      ).trim();
      expect(firstLine.startsWith("[ ]")).toBe(true);
    }

    // Brain-break inserted (≥4 question sections in the fixture).
    const hasBrainBreak = sections.some(
      (s) =>
        typeof s.content === "string" && /brain\s*break/i.test(s.content),
    );
    expect(hasBrainBreak).toBe(true);

    expect(warnings.some((w) => /Phase 4 — Dyslexia/.test(w))).toBe(true);
    expect(warnings.some((w) => /Phase 4 — ADHD/.test(w))).toBe(true);
  });

  it("is idempotent", () => {
    expect(isIdempotentStacked(makeWs("adhd+dyslexia"), "adhd+dyslexia")).toBe(
      true,
    );
  });
});

// ── Anxiety + ADHD — title-rewrite contention test ─────────────────────────

describe("Stacked dispatcher — Anxiety + ADHD", () => {
  it("Anxiety's 'OPTIONAL BONUS' title wins (first-rename-wins, guarded by SEND_RENAMED_CHALLENGE_TITLES)", () => {
    const ws = makeWs("anxiety+adhd");
    const { worksheet } = enforceSendOverlayMarkers(ws, {
      sendNeed: "anxiety+adhd",
    });
    const challenge = worksheet.sections!.find((s) => s.type === "challenge");
    expect(challenge).toBeDefined();
    expect(challenge!.title).toBe("OPTIONAL BONUS — only if you want to!");
  });

  it("still applies ADHD's tick-box prefix on questions when Anxiety also runs", () => {
    const ws = makeWs("anxiety+adhd");
    const { worksheet } = enforceSendOverlayMarkers(ws, {
      sendNeed: "anxiety+adhd",
    });
    const questions = worksheet.sections!.filter(
      (s) =>
        String(s.type || "").startsWith("q-") || s.type === "challenge",
    );
    for (const q of questions) {
      const firstLine = (
        String(q.content || "")
          .split("\n")
          .find((l) => l.trim()) || ""
      ).trim();
      expect(firstLine.startsWith("[ ]")).toBe(true);
    }
  });

  it("is idempotent", () => {
    expect(isIdempotentStacked(makeWs("anxiety+adhd"), "anxiety+adhd")).toBe(
      true,
    );
  });
});

// ── HI + MLD — design-intent skip ───────────────────────────────────────────

describe("Stacked dispatcher — HI + MLD", () => {
  it("MLD branch is a no-op when HI's topic-summary is already inserted", () => {
    const ws = makeWs("hi+mld");
    const { worksheet } = enforceSendOverlayMarkers(ws, { sendNeed: "hi+mld" });
    const summaries = worksheet.sections!.filter(
      (s) => s.type === "topic-summary",
    );
    const contexts = worksheet.sections!.filter(
      (s) => s.type === "topic-context",
    );
    // Exactly one topic-summary (from HI) and zero topic-context (MLD
    // detected the summary and skipped its own insertion).
    expect(summaries).toHaveLength(1);
    expect(contexts).toHaveLength(0);
  });
});

// ── Dyscalculia + EAL ───────────────────────────────────────────────────────

describe("Stacked dispatcher — Dyscalculia + EAL", () => {
  it("appends BOTH the number cue and the sentence frame on the same question", () => {
    const ws = makeWs("dyscalculia+eal");
    const { worksheet } = enforceSendOverlayMarkers(ws, {
      sendNeed: "dyscalculia+eal",
    });
    // Q4 is "Calculate the percentage decrease" — has digits AND is
    // an extended-response question, so BOTH the dyscalculia number
    // cue AND the EAL frame should land on it.
    const q4 = worksheet.sections!.find((s) => s.id === "q4");
    expect(q4).toBeDefined();
    expect(String(q4!.content)).toMatch(/numbers\s+in\s+this\s+question/i);
    expect(String(q4!.content)).toMatch(/sentence\s+frame/i);
  });

  it("is idempotent", () => {
    expect(
      isIdempotentStacked(makeWs("dyscalculia+eal"), "dyscalculia+eal"),
    ).toBe(true);
  });
});

// ── Dispatcher edge cases ───────────────────────────────────────────────────

describe("Stacked dispatcher — edge cases", () => {
  it("tolerates the `&` and `,` separators as well as `+`", () => {
    const wsAmp = makeWs("hi&eal");
    const wsComma = makeWs("hi,eal");
    const r1 = enforceSendOverlayMarkers(wsAmp, { sendNeed: "hi&eal" });
    const r2 = enforceSendOverlayMarkers(wsComma, { sendNeed: "hi,eal" });
    expect(
      r1.worksheet.sections!.some((s) => s.type === "topic-summary"),
    ).toBe(true);
    expect(
      r2.worksheet.sections!.some((s) => s.type === "topic-summary"),
    ).toBe(true);
  });

  it("drops unknown keys silently and runs only the recognised ones", () => {
    // "asc" has no marker enforcer today (Lane 2.1 / Lane 3 follow-up).
    const ws = makeWs("hi+asc");
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, {
      sendNeed: "hi+asc",
    });
    // HI ran — topic-summary present.
    expect(
      worksheet.sections!.some((s) => s.type === "topic-summary"),
    ).toBe(true);
    // Only ONE recognised need ran, so no "Stacked SEND" framing
    // warning is prepended (single-need behaviour).
    expect(warnings.some((w) => /Stacked SEND/.test(w))).toBe(false);
  });

  it("returns an unmodified worksheet when ALL keys are unknown", () => {
    const ws = makeWs("asc+slcn");
    const before = JSON.stringify(ws.sections);
    const { worksheet, warnings } = enforceSendOverlayMarkers(ws, {
      sendNeed: "asc+slcn",
    });
    expect(JSON.stringify(worksheet.sections)).toBe(before);
    expect(warnings).toHaveLength(0);
  });

  it("de-dupes repeated keys (e.g. 'hi+hi' runs HI once, not twice)", () => {
    const ws = makeWs("hi+hi");
    const { worksheet } = enforceSendOverlayMarkers(ws, { sendNeed: "hi+hi" });
    const summaries = worksheet.sections!.filter(
      (s) => s.type === "topic-summary",
    );
    expect(summaries).toHaveLength(1);
  });

  it("runStackedSendMarkers is callable directly with a compound string", () => {
    const ws = makeWs("placeholder");
    const { worksheet, warnings } = runStackedSendMarkers(ws, "hi+eal");
    expect(
      worksheet.sections!.some((s) => s.type === "topic-summary"),
    ).toBe(true);
    expect(warnings.some((w) => /Phase 4 — HI/.test(w))).toBe(true);
    expect(warnings.some((w) => /Phase 4 — EAL/.test(w))).toBe(true);
  });

  it("normalises whitespace and `send:` prefixes inside compound parts", () => {
    const ws = makeWs("send:hi + send:eal");
    const { worksheet } = enforceSendOverlayMarkers(ws, {
      sendNeed: "send:hi + send:eal",
    });
    expect(
      worksheet.sections!.some((s) => s.type === "topic-summary"),
    ).toBe(true);
    const extended = worksheet.sections!.find((s) => s.type === "q-extended");
    expect(String(extended!.content)).toMatch(/sentence\s+frame/i);
  });
});
