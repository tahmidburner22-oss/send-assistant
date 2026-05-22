/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * server/tests/worksheet-eval/generators.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Generator abstraction for the eval harness. Two implementations:
 *
 *   1. `mockGenerator` — deterministic, runs offline, costs $0. Builds a
 *      minimal but well-formed worksheet from the fixture's `params` so
 *      the post-validator + rule chain has something to score. Used when
 *      `EVAL_MODE=mock` (the default in CI / sandbox / dev).
 *
 *   2. `liveGenerator` — calls the production `aiGenerateWorksheet` from
 *      `client/src/lib/ai.ts`. Requires API keys in env (the underlying
 *      module reads from `localStorage`; live mode shims a global stub so
 *      the call works under Node).
 *
 * Switching is a one-line flag — `EVAL_MODE=live` flips it. Both
 * generators return the same `AIWorksheetResult` shape so the runner
 * downstream of the call doesn't care which path produced the output.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { PostValidatorWorksheet } from "../../../client/src/lib/worksheetPostValidator";
import type { EvalFixtureParams } from "./types";

export type GeneratedWorksheet = PostValidatorWorksheet;

export interface Generator {
  /** Free-text label for the report. */
  name: string;
  /** Estimated USD cost per call — used by the cost guard. */
  estimatedCostUsd: number;
  /** Generate a worksheet for the given params. */
  generate(params: EvalFixtureParams): Promise<GeneratedWorksheet>;
}

// ─── Mock generator ──────────────────────────────────────────────────────────

/**
 * Builds a deterministic worksheet that mirrors the structural
 * contract `aiGenerateWorksheet` is expected to satisfy:
 *
 *   - 7 question sections (Phase 1 contract)
 *   - 1 worked-example section
 *   - 1 mark-scheme (teacherOnly)
 *   - 1 word-bank with 3 entries
 *   - 1 self-reflection section
 *   - 1 revision-tips section
 *   - metadata.{subject, topic, yearGroup, examBoard, totalMarks, estimatedTime}
 *
 * It does NOT exercise the LLM — its job is to give the post-validator
 * + rule chain a baseline to grade. A passing fixture under mock mode
 * means the harness wiring is correct end-to-end. Live mode is what
 * actually probes generator quality.
 */
export const mockGenerator: Generator = {
  name: "mock",
  estimatedCostUsd: 0,
  async generate(params: EvalFixtureParams): Promise<GeneratedWorksheet> {
    const subject = params.subject || "Maths";
    const topic = params.topic || "Untitled";
    const yearGroup = params.yearGroup || "Year 7";
    const examBoard = params.examBoard ?? "AQA";

    // Section `type` strings drawn from QUESTION_SECTION_TYPES /
    // TEACHER_KEY_TYPES / LO_TYPES in `qaScoreBuilder.ts` so the QA
    // scorer recognises this baseline as a well-formed worksheet.
    const questionTypes = [
      "q-short-answer",
      "q-mcq",
      "q-true-false",
      "q-gap-fill",
      "q-extended",
      "application",
      "challenge",
    ] as const;
    const questionSections = questionTypes.map((qtype, i) => ({
      id: `q-${i + 1}`,
      type: qtype,
      title: `Question ${i + 1}`,
      content: `Define one key idea from ${topic}. (${i + 1} mark${i === 0 ? "" : "s"})`,
      specRef: `${examBoard}-${subject.slice(0, 3).toUpperCase()}-${i + 1}`,
    }));

    const sections: GeneratedWorksheet["sections"] = [
      {
        id: "lo",
        type: "learning-objective",
        title: "Learning Objective",
        content: `Pupils will be able to describe one feature of ${topic}.`,
      },
      {
        id: "wb",
        type: "word-bank",
        title: "Key Vocabulary",
        content: `term-a — definition\nterm-b — definition\nterm-c — definition`,
      },
      {
        id: "we",
        type: "worked-example",
        title: "Worked Example",
        content: `Step 1. Read the question.\nStep 2. Identify the key idea.\nStep 3. Write the answer.`,
      },
      ...questionSections,
      {
        id: "ms",
        type: "mark-scheme",
        title: "Mark Scheme",
        teacherOnly: true,
        content: `Q1: 1 mark for definition. Q2: 1 mark. Q3: 1 mark. Q4: 1 mark. Q5: 1 mark. Q6: 1 mark. Q7: 1 mark.`,
      },
      {
        id: "sr",
        type: "self-reflection",
        title: "Self-Reflection",
        content: `I can describe one feature of ${topic}.\nI can give one example linked to ${topic}.\nI can explain one idea from ${topic}.\nI can compare two ideas in ${topic}.\nI can apply ${topic} to a new question.`,
      },
      {
        id: "rt",
        type: "revision-tips",
        title: "Revision Tips",
        content: `1. Re-read your notes on ${topic}.\n2. Practise the command word "describe" by writing two short answers.\n3. Make a mind-map of ${topic}.\n4. Test yourself on Key Vocabulary.\n5. Try a past-paper question on ${topic}.`,
      },
    ];

    return {
      title: `${topic} — ${yearGroup} ${subject}`,
      subtitle: `${yearGroup} • ${examBoard}`,
      sections,
      metadata: {
        subject,
        topic,
        yearGroup,
        examBoard,
        difficulty: params.difficulty ?? "medium",
        totalMarks: 7,
        estimatedTime: "20 minutes",
        adaptations: params.sendNeed ? [params.sendNeed] : [],
        sendNeed: params.sendNeed,
        // Stamped so the qaScore's metadataValidity component reaches 5/5.
        generatorVersion: "eval-mock-1.0.0",
      },
    };
  },
};

// ─── Live generator ──────────────────────────────────────────────────────────

/**
 * Wraps `aiGenerateWorksheet` from `client/src/lib/ai.ts`. Requires:
 *
 *   - `localStorage` shimmed (ai.ts reads API keys via `getStoredKey`,
 *     which uses `globalThis.localStorage`).
 *   - A populated key store (`AI_KEY_STORAGE`) keyed by provider
 *     (groq / gemini / openrouter / openai / anthropic). Set via env
 *     `EVAL_OPENAI_KEY`, `EVAL_GROQ_KEY`, etc.
 *
 * Cost is approximate — 4000 tokens × $0.000002/token = ~$0.008 per
 * call on GPT-4o-mini-class models. Override with EVAL_COST_PER_CALL.
 */
export const liveGenerator: Generator = {
  name: "live",
  estimatedCostUsd: parseFloat(process.env.EVAL_COST_PER_CALL ?? "0.008"),
  async generate(params: EvalFixtureParams): Promise<GeneratedWorksheet> {
    // Shim localStorage if missing (Node has no DOM).
    const g = globalThis as unknown as {
      localStorage?: {
        getItem(k: string): string | null;
        setItem(k: string, v: string): void;
      };
    };
    if (!g.localStorage) {
      const store = new Map<string, string>();
      // Seed from env. The shape mirrors AI_KEY_STORAGE in ai.ts.
      const envKeys: Record<string, string | undefined> = {
        groq: process.env.EVAL_GROQ_KEY,
        gemini: process.env.EVAL_GEMINI_KEY,
        openrouter: process.env.EVAL_OPENROUTER_KEY,
        openai: process.env.EVAL_OPENAI_KEY,
        anthropic: process.env.EVAL_ANTHROPIC_KEY,
      };
      const keyMap: Record<string, string> = {};
      for (const [provider, key] of Object.entries(envKeys)) {
        if (key) keyMap[provider] = key;
      }
      if (Object.keys(keyMap).length === 0) {
        throw new Error(
          "live mode requires at least one of EVAL_OPENAI_KEY / EVAL_ANTHROPIC_KEY / EVAL_GROQ_KEY / EVAL_GEMINI_KEY / EVAL_OPENROUTER_KEY",
        );
      }
      store.set("ai_keys", JSON.stringify(keyMap));
      g.localStorage = {
        getItem(k: string) {
          return store.has(k) ? (store.get(k) as string) : null;
        },
        setItem(k: string, v: string) {
          store.set(k, v);
        },
      };
    }

    // Dynamic import so a sandbox without these client-side deps never
    // fails to load the harness file. Live mode is opt-in.
    const { aiGenerateWorksheet } = (await import(
      "../../../client/src/lib/ai"
    )) as typeof import("../../../client/src/lib/ai");

    const result = await aiGenerateWorksheet({
      subject: params.subject,
      topic: params.topic,
      yearGroup: params.yearGroup,
      sendNeed: params.sendNeed,
      difficulty: params.difficulty,
      examBoard: params.examBoard,
      includeAnswers: params.includeAnswers,
      examStyle: params.examStyle,
      worksheetLength: params.worksheetLength,
      readingAge: params.readingAge,
      isRevisionMat: params.isRevisionMat,
      paper: params.paper,
      calculator: params.calculator,
      recallTopic: params.recallTopic,
      priorTopics: params.priorTopics,
    });

    return result as unknown as GeneratedWorksheet;
  },
};

/** Pick a generator from `EVAL_MODE` (defaults to mock). */
export function pickGenerator(): Generator {
  const mode = (process.env.EVAL_MODE ?? "mock").toLowerCase();
  if (mode === "live") return liveGenerator;
  return mockGenerator;
}
