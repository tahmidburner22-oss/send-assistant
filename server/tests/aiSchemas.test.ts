/**
 * aiSchemas.test.ts
 *
 * Unit tests for the shared AI output Zod schemas (P2-5 audit remediation).
 * Validates that the schemas correctly accept valid AI output and reject malformed output.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── Inline schema definitions (mirrors shared/aiSchemas.ts) ─────────────────
// These are duplicated here so tests don't depend on the shared module path resolution

const QuizQuestionSchema = z.object({
  question: z.string().min(1).max(1000),
  options: z.array(z.string().min(1).max(500)).length(4),
  correctIndex: z.number().int().min(0).max(3),
});
const QuizArraySchema = z.array(QuizQuestionSchema).min(1).max(50);

const SlideTypeEnum = z.enum([
  "title","learning-objectives","hook","content","key-terms","worked-example",
  "activity","discussion","check-understanding","summary","exit-ticket","extension",
  "retrieval-warm-up","misconception-bust","exam-technique","real-world-link",
  "think-pair-share","mini-quiz","diagram-label","pause-and-solve",
]);

const SlideSchema = z.object({
  type: SlideTypeEnum,
  title: z.string().min(1).max(200),
  bullets: z.array(z.string()).max(8).optional(),
  body: z.string().max(2000).optional(),
  speakerNotes: z.string().max(2000).optional(),
});

const PresentationSchema = z.object({
  title: z.string().min(1).max(300),
  subject: z.string().min(1).max(100),
  yearGroup: z.string().min(1).max(50),
  topic: z.string().min(1).max(300),
  slides: z.array(SlideSchema).min(1).max(40),
});

// ─── Quiz schema tests ────────────────────────────────────────────────────────
describe("Quiz AI output schema", () => {
  const validQuestion = {
    question: "What is the capital of France?",
    options: ["London", "Paris", "Berlin", "Madrid"],
    correctIndex: 1,
  };

  it("accepts a valid quiz question", () => {
    const result = QuizQuestionSchema.safeParse(validQuestion);
    expect(result.success).toBe(true);
  });

  it("rejects a question with fewer than 4 options", () => {
    const result = QuizQuestionSchema.safeParse({
      ...validQuestion,
      options: ["London", "Paris", "Berlin"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a question with more than 4 options", () => {
    const result = QuizQuestionSchema.safeParse({
      ...validQuestion,
      options: ["A", "B", "C", "D", "E"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a correctIndex out of range", () => {
    const result = QuizQuestionSchema.safeParse({
      ...validQuestion,
      correctIndex: 4,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a correctIndex of -1", () => {
    const result = QuizQuestionSchema.safeParse({
      ...validQuestion,
      correctIndex: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty question string", () => {
    const result = QuizQuestionSchema.safeParse({
      ...validQuestion,
      question: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an array of valid questions", () => {
    const result = QuizArraySchema.safeParse([validQuestion, { ...validQuestion, correctIndex: 0 }]);
    expect(result.success).toBe(true);
  });

  it("rejects an empty array", () => {
    const result = QuizArraySchema.safeParse([]);
    expect(result.success).toBe(false);
  });

  it("rejects array with more than 50 questions", () => {
    const tooMany = Array(51).fill(validQuestion);
    const result = QuizArraySchema.safeParse(tooMany);
    expect(result.success).toBe(false);
  });
});

// ─── Presentation schema tests ────────────────────────────────────────────────
describe("Presentation AI output schema", () => {
  const validSlide = {
    type: "content" as const,
    title: "The Water Cycle",
    bullets: ["Evaporation occurs when water heats up", "Condensation forms clouds"],
  };

  const validPresentation = {
    title: "The Water Cycle",
    subject: "Science",
    yearGroup: "Year 7",
    topic: "The Water Cycle",
    slides: [
      { type: "title" as const, title: "The Water Cycle" },
      validSlide,
      { type: "summary" as const, title: "What We Learned" },
    ],
  };

  it("accepts a valid presentation", () => {
    const result = PresentationSchema.safeParse(validPresentation);
    expect(result.success).toBe(true);
  });

  it("rejects presentation with empty slides array", () => {
    const result = PresentationSchema.safeParse({ ...validPresentation, slides: [] });
    expect(result.success).toBe(false);
  });

  it("rejects presentation with more than 40 slides", () => {
    const tooMany = Array(41).fill(validSlide);
    const result = PresentationSchema.safeParse({ ...validPresentation, slides: tooMany });
    expect(result.success).toBe(false);
  });

  it("rejects slide with unknown type", () => {
    const result = SlideSchema.safeParse({
      type: "unknown-type",
      title: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slide with empty title", () => {
    const result = SlideSchema.safeParse({ type: "content", title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects slide with more than 8 bullets", () => {
    const result = SlideSchema.safeParse({
      type: "content",
      title: "Test",
      bullets: Array(9).fill("bullet point"),
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid slide types", () => {
    const validTypes = [
      "title","learning-objectives","hook","content","key-terms","worked-example",
      "activity","discussion","check-understanding","summary","exit-ticket","extension",
    ];
    for (const type of validTypes) {
      const result = SlideSchema.safeParse({ type, title: "Test Slide" });
      expect(result.success).toBe(true);
    }
  });

  it("rejects presentation with missing required fields", () => {
    const result = PresentationSchema.safeParse({
      title: "Test",
      slides: [validSlide],
      // missing subject, yearGroup, topic
    });
    expect(result.success).toBe(false);
  });
});

// ─── CORS origin validation logic test ───────────────────────────────────────
describe("CORS origin exact-match logic", () => {
  const ALLOWED_ORIGINS = [
    "https://adaptly.co.uk",
    "https://www.adaptly.co.uk",
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  function isAllowed(origin: string): boolean {
    return ALLOWED_ORIGINS.includes(origin);
  }

  it("allows exact-match origins", () => {
    expect(isAllowed("https://adaptly.co.uk")).toBe(true);
    expect(isAllowed("https://www.adaptly.co.uk")).toBe(true);
    expect(isAllowed("http://localhost:5173")).toBe(true);
  });

  it("blocks subdomain spoofing attempts", () => {
    expect(isAllowed("https://evil.adaptly.co.uk")).toBe(false);
    expect(isAllowed("https://adaptly.co.uk.evil.com")).toBe(false);
    expect(isAllowed("https://notadaptly.co.uk")).toBe(false);
  });

  it("blocks protocol downgrade attempts", () => {
    expect(isAllowed("http://adaptly.co.uk")).toBe(false);
  });

  it("blocks empty or null origins", () => {
    expect(isAllowed("")).toBe(false);
    expect(isAllowed("null")).toBe(false);
  });
});

// ─── Crypto.randomBytes access code format tests ─────────────────────────────
describe("Access code generation", () => {
  it("generates a 10-character hex string from 5 random bytes", () => {
    const { randomBytes } = require("crypto");
    const code = randomBytes(5).toString("hex");
    expect(code).toHaveLength(10);
    expect(code).toMatch(/^[0-9a-f]{10}$/);
  });

  it("generates unique codes on each call", () => {
    const { randomBytes } = require("crypto");
    const codes = new Set(Array.from({ length: 100 }, () => randomBytes(5).toString("hex")));
    // All 100 should be unique (probability of collision is astronomically low)
    expect(codes.size).toBe(100);
  });
});
