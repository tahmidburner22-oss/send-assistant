/**
 * @file shared/aiSchemas.ts
 * @description Zod schemas for validating AI-generated JSON output before rendering.
 *
 * These schemas act as a contract between the AI layer and the UI/server.
 * Any AI response that fails validation is caught early, preventing silent
 * rendering failures or XSS vectors from malformed content.
 *
 * Usage (server-side):
 *   import { parseAIOutput, WorksheetSectionSchema } from "../../shared/aiSchemas.js";
 *   const sections = parseAIOutput(WorksheetSectionArraySchema, rawJson, []);
 *
 * Usage (client-side):
 *   import { parseAIOutput, QuizSchema } from "@/shared/aiSchemas";
 *   const quiz = parseAIOutput(QuizSchema, rawJson, { questions: [] });
 */
import { z } from "zod";

// ── Utility ───────────────────────────────────────────────────────────────────

/**
 * Safely parse AI output against a Zod schema.
 * On failure, logs a warning and returns the provided fallback value.
 * This ensures the UI always receives a usable value even when the AI
 * returns unexpected structure.
 */
export function parseAIOutput<T>(
  schema: z.ZodType<T>,
  data: unknown,
  fallback: T,
  context?: string
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const ctx = context ? ` [${context}]` : "";
  console.warn(`[AI Schema Validation${ctx}] Parse failed:`, result.error.flatten());
  return fallback;
}

// ── Worksheet Section Schema ──────────────────────────────────────────────────
// Spec-aligned: includes all fields used by the generation engine, overlay engine,
// diagram injection pipeline, and QA validation gate.

export const WorksheetSectionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50000),
  type: z.string().optional().default("text"),
  teacherOnly: z.boolean().optional().default(false),
  difficulty: z.string().optional(),
  order: z.number().int().optional(),
  // Diagram / asset fields
  imageUrl: z.string().url().optional().or(z.string().startsWith("/").optional()),
  assetRef: z.string().optional(),
  svg: z.string().optional(),
  caption: z.string().max(500).optional(),
  fullPage: z.boolean().optional(),
  attribution: z.string().optional(),
  // Overlay / SEND fields
  isOverlay: z.boolean().optional().default(false),
  marks: z.number().int().min(0).max(100).optional(),
  label: z.string().optional(),
  // QA fields
  qualityIssues: z.array(z.string()).optional(),
  // ── PB1 — Per-question provenance fields ──────────────────────────────────
  /** PB1 — Curriculum spec reference, e.g. "KS4 Physics — Forces". */
  specRef: z.string().max(200).optional(),
  /** PB1 — Assessment Objective tag (AO1–AO4). */
  ao: z.enum(["AO1", "AO2", "AO3", "AO4"]).optional(),
  /** PB1 — Bloom's taxonomy level. */
  bloomLevel: z.enum(["remember", "understand", "apply", "analyse", "evaluate", "create"]).optional(),
  /** PB1 — Expected reading age for the question text (Flesch-Kincaid). */
  expectedReadingAge: z.number().min(5).max(18).optional(),
  /** PB1 — Optional source citation (e.g. past paper year). */
  sourceCitation: z.string().max(300).optional(),
  // ── Phase 1 — Curriculum-aligned structure fields ─────────────────────────
  /** Phase 1 — Number of writing lines the renderer should emit for this
   *  question. When omitted the renderer falls back to linesForMarks(marks). */
  answerLines: z.number().int().min(0).max(40).optional(),
  /** Phase 1 — UK exam-board command word that opens the stem
   *  (e.g. "Calculate", "Explain", "Evaluate", "Describe"). */
  commandWord: z.string().max(40).optional(),
  /** Phase 1 — National Curriculum Programme-of-Study reference, verbatim
   *  where possible (e.g. "KS4 Mathematics — Algebra A4: Simplify and
   *  manipulate algebraic expressions"). Distinct from `specRef` which is
   *  the awarding-body spec point. */
  ncRef: z.string().max(300).optional(),
  /** Phase 1 — When true, the renderer prepends a dot-grid working-out box
   *  ABOVE the answer lines and a single capped "Final answer:" row BELOW.
   *  Used for maths / science calculation questions. */
  workingOutBox: z.boolean().optional(),
  /** Phase 1 — 1-based question number within the worksheet (1..20 for a
   *  standard secondary sheet). Set by the AI; validated by the post-validator. */
  questionNumber: z.number().int().min(1).max(40).optional(),
});

export type WorksheetSection = z.infer<typeof WorksheetSectionSchema>;

export const WorksheetSectionArraySchema = z.array(WorksheetSectionSchema).min(1).max(80);

// Full worksheet output schema — validates the complete AI-generated worksheet object
export const WorksheetOutputSchema = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(300).optional(),
  sections: WorksheetSectionArraySchema,
  metadata: z.object({
    subject: z.string().optional(),
    yearGroup: z.string().optional(),
    topic: z.string().optional(),
    difficulty: z.string().optional(),
    examBoard: z.string().optional(),
    sendNeed: z.string().nullable().optional(),
    adaptations: z.array(z.string()).optional(),
    qualityIssues: z.array(z.string()).optional(),
    qualityWarning: z.string().optional(),
    generatedAt: z.string().optional(),
    provider: z.string().optional(),
    /** Phase 4 / FEAT-002 — misconception IDs the AI deliberately targeted. */
    misconceptionsTargeted: z.array(z.string()).optional(),
    /** FEAT-PB7 — per-MCQ misconception linkage; one entry per diagnosed distractor. */
    misconceptionLinks: z.array(z.object({
      sectionIndex: z.number().int().min(0),
      sectionTitle: z.string().optional(),
      distractor: z.string().min(1).max(2),
      misconceptionId: z.string().min(1).max(40),
    })).optional(),
    /** FEAT-PB6 — per-rule SEND adaptation fidelity report. */
    sendFidelityReport: z.object({
      sendNeedId: z.string(),
      sendNeedName: z.string(),
      rules: z.array(z.object({
        ruleIndex: z.number().int().min(1),
        rule: z.string(),
        status: z.enum(["applied", "missing", "not-checked"]),
        evidence: z.string().optional(),
      })),
      appliedCount: z.number().int().min(0),
      totalCount: z.number().int().min(0),
      fidelityRatio: z.number().min(0).max(1),
      warnings: z.array(z.string()),
    }).optional(),
    /** FEAT-PC8 — Fluency / Reasoning / Problem-Solving balance audit. */
    mathsStrandBalance: z.object({
      assignments: z.array(z.object({
        sectionIndex: z.number().int().min(0),
        sectionTitle: z.string().optional(),
        sectionType: z.string().optional(),
        strand: z.enum(["fluency", "reasoning", "problem_solving"]),
        evidence: z.string(),
      })),
      counts: z.object({
        fluency: z.number().int().min(0),
        reasoning: z.number().int().min(0),
        problem_solving: z.number().int().min(0),
      }),
      targets: z.object({
        fluency: z.number().int().min(0),
        reasoning: z.number().int().min(0),
        problem_solving: z.number().int().min(0),
      }),
      totalQuestions: z.number().int().min(0),
      meetsTarget: z.boolean(),
      warnings: z.array(z.string()),
    }).optional(),
    /** FEAT-PC9 — KS4 Required Practical anchor (science only). */
    requiredPractical: z.object({
      id: z.string(),
      title: z.string(),
      specCode: z.string(),
      wsSkills: z.array(z.string()),
      detected: z.boolean(),
      evidence: z.string().optional(),
    }).optional(),
    /** FEAT-PC10 — per-question coverage map (Y9+ only). */
    coverageMap: z.object({
      rows: z.array(z.object({
        qNum: z.number().int().min(1),
        sectionIndex: z.number().int().min(0),
        sectionTitle: z.string().optional(),
        sectionType: z.string().optional(),
        marks: z.number().int().min(0),
        bloom: z.enum(["recall", "understanding", "application", "challenge", "uncategorised"]),
        commandWord: z.string(),
        specRef: z.string(),
        misconceptionIds: z.array(z.string()),
      })),
      totalQuestions: z.number().int().min(0),
      totalMarks: z.number().int().min(0),
      bloomDistribution: z.object({
        recall: z.number().int().min(0),
        understanding: z.number().int().min(0),
        application: z.number().int().min(0),
        challenge: z.number().int().min(0),
        uncategorised: z.number().int().min(0),
      }),
      commandWords: z.array(z.string()),
      subject: z.string().optional(),
      yearGroup: z.string().optional(),
      topic: z.string().optional(),
    }).optional(),
    /** Phase 4 / FEAT-005 — three-step hint ladder per question id (e.g. s0q3). */
    hintLadders: z.array(z.object({
      questionId: z.string(),
      question: z.string(),
      hints: z.tuple([z.string(), z.string(), z.string()]),
    })).optional(),
    /** Phase 4 / FEAT-005 — token + expiry for the issued /share/companion/:token link. */
    companionShare: z.object({
      token: z.string(),
      expiresAt: z.string(),
    }).optional(),
    // ── Pillar A — Exam-style questions for Year 9+ ─────────────────────────
    /** PA#1 — UK GCSE paper code. */
    paper: z.enum(["P1", "P2", "P3"]).optional(),
    /** PA#1 — calculator allowed on the source paper. */
    calculator: z.boolean().optional(),
    /** PA#1 — Assessment Objective histogram across all questions on the sheet. */
    aoHistogram: z.object({
      AO1: z.number().int().min(0),
      AO2: z.number().int().min(0),
      AO3: z.number().int().min(0),
      AO4: z.number().int().min(0),
    }).partial().optional(),
    /** PA#2 — 6-mark LOR detection result. */
    lorPresent: z.boolean().optional(),
    lorMarks: z.number().int().min(0).max(20).optional(),
    lorBands: z.array(z.string()).max(5).optional(),
    /** PA#3 — synoptic question links to prior topics. */
    synopticLinks: z.array(z.object({
      sectionIndex: z.number().int().min(0),
      priorTopic: z.string().min(1).max(200),
      sectionTitle: z.string().optional(),
    })).optional(),
    /** PA#3 — prior topics injected into the prompt. */
    priorTopics: z.array(z.string().min(1).max(200)).max(10).optional(),
    /** PA#4 — exam-paper template key (e.g. "aqa:english_lang:P1"). */
    examPaperTemplate: z.string().max(100).optional(),
    /** Pillar A — non-blocking warnings raised by the post-validators. */
    postValidatorWarnings: z.array(z.string()).optional(),
    /** FEAT-PB2 — symbolic maths verification report (CAS round-trip). */
    mathsVerification: z.object({
      perQuestion: z.array(z.object({
        sectionIndex: z.number().int().min(0),
        sectionTitle: z.string().optional(),
        kind: z.enum(["numeric", "expression", "equation", "unknown"]),
        raw: z.string().max(2000),
        expected: z.string().max(500),
        status: z.enum(["ok", "mismatch", "unverified"]),
        cas: z.string().max(500).optional(),
        reason: z.string().max(500).optional(),
      })),
      counts: z.object({
        ok: z.number().int().min(0),
        mismatch: z.number().int().min(0),
        unverified: z.number().int().min(0),
      }),
      ranAt: z.string().optional(),
      durationMs: z.number().min(0).optional(),
    }).optional(),
    /** FEAT-PB3 — re-teach worksheet provenance (set when this worksheet was
     * generated from a misconception detected in a Scan & Mark batch on a
     * source worksheet). The renderer surfaces a header badge and footer
     * sentence so the teacher can see the lineage at a glance. */
    reteach: z.object({
      sourceWorksheetId: z.string().min(1).max(200).optional(),
      sourceWorksheetTitle: z.string().max(300).optional(),
      misconceptionId: z.string().min(1).max(40),
      misconceptionText: z.string().max(500).optional(),
      pupilsTargeted: z.array(z.string().max(200)).max(60).optional(),
      pctWrong: z.number().min(0).max(100).optional(),
      questionIdx: z.number().int().min(0).optional(),
      generatedAt: z.string().optional(),
    }).optional(),
    /** PR-15 -- past-paper fingerprint detection result. */
    pastPaperFingerprint: z.object({
      matchCount: z.number().int().min(0),
      highRiskCount: z.number().int().min(0),
    }).optional(),
  }).optional(),
  isAI: z.boolean().optional(),
  provider: z.string().optional(),
});

export type WorksheetOutput = z.infer<typeof WorksheetOutputSchema>;

// ── Quiz Schema ───────────────────────────────────────────────────────────────

export const QuizQuestionSchema = z.object({
  question: z.string().min(1).max(1000),
  options: z.array(z.string().min(1).max(500)).min(2).max(6),
  answer: z.string().min(1).max(500),
  explanation: z.string().max(1000).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  topic: z.string().max(200).optional(),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  questions: z.array(QuizQuestionSchema).min(1).max(50),
  subject: z.string().max(200).optional(),
  yearGroup: z.string().max(50).optional(),
});

export type Quiz = z.infer<typeof QuizSchema>;

// ── IEP Schema ────────────────────────────────────────────────────────────────

export const SMARTTargetSchema = z.object({
  target: z.string().min(1).max(500),
  specific: z.string().max(500).optional(),
  measurable: z.string().max(500).optional(),
  achievable: z.string().max(500).optional(),
  relevant: z.string().max(500).optional(),
  timebound: z.string().max(200).optional(),
  strategies: z.array(z.string().max(300)).max(10).optional(),
  successCriteria: z.string().max(500).optional(),
  reviewDate: z.string().max(100).optional(),
});

export type SMARTTarget = z.infer<typeof SMARTTargetSchema>;

export const IEPSchema = z.object({
  pupilName: z.string().max(200).optional(),
  sendNeed: z.string().max(200).optional(),
  strengths: z.array(z.string().max(500)).max(10).optional(),
  barriers: z.array(z.string().max(500)).max(10).optional(),
  targets: z.array(SMARTTargetSchema).min(1).max(10),
  provisionMap: z.array(z.string().max(500)).max(20).optional(),
  parentViews: z.string().max(1000).optional(),
  pupilViews: z.string().max(1000).optional(),
  reviewDate: z.string().max(100).optional(),
});

export type IEP = z.infer<typeof IEPSchema>;

// ── Risk Assessment Schema ────────────────────────────────────────────────────

export const RiskItemSchema = z.object({
  hazard: z.string().min(1).max(500),
  likelihood: z.number().int().min(1).max(5),
  severity: z.number().int().min(1).max(5),
  riskRating: z.number().int().min(1).max(25).optional(),
  controlMeasures: z.array(z.string().max(500)).min(1).max(10),
  residualRisk: z.number().int().min(1).max(25).optional(),
  responsiblePerson: z.string().max(200).optional(),
  redFlag: z.boolean().optional().default(false),
});

export type RiskItem = z.infer<typeof RiskItemSchema>;

export const RiskAssessmentSchema = z.object({
  title: z.string().min(1).max(300),
  activity: z.string().max(500).optional(),
  assessor: z.string().max(200).optional(),
  date: z.string().max(100).optional(),
  risks: z.array(RiskItemSchema).min(1).max(30),
  emergencyProcedures: z.string().max(1000).optional(),
  reviewDate: z.string().max(100).optional(),
});

export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

// ── Exit Ticket Schema ────────────────────────────────────────────────────────

export const ExitTicketItemSchema = z.object({
  question: z.string().min(1).max(500),
  type: z.enum(["open", "mcq", "true-false", "rating"]).default("open"),
  options: z.array(z.string().max(200)).max(6).optional(),
  answerKey: z.string().max(500).optional(),
  bloomsLevel: z.string().max(100).optional(),
});

export type ExitTicketItem = z.infer<typeof ExitTicketItemSchema>;

export const ExitTicketSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  learningObjective: z.string().max(500).optional(),
  items: z.array(ExitTicketItemSchema).min(1).max(10),
  teacherNotes: z.string().max(1000).optional(),
});

export type ExitTicket = z.infer<typeof ExitTicketSchema>;

// ── Social Story Schema ───────────────────────────────────────────────────────

export const SocialStoryPageSchema = z.object({
  text: z.string().min(1).max(500),
  type: z.enum(["descriptive", "perspective", "directive", "affirmative", "coaching"]).optional(),
  imagePrompt: z.string().max(300).optional(),
});

export type SocialStoryPage = z.infer<typeof SocialStoryPageSchema>;

export const SocialStorySchema = z.object({
  title: z.string().min(1).max(200),
  pages: z.array(SocialStoryPageSchema).min(3).max(20),
  carolGrayRatio: z.object({
    descriptive: z.number().int().min(0),
    perspective: z.number().int().min(0),
    directive: z.number().int().min(0),
    affirmative: z.number().int().min(0),
    coaching: z.number().int().min(0),
  }).optional(),
});

export type SocialStory = z.infer<typeof SocialStorySchema>;

// ── Lesson Plan Schema ────────────────────────────────────────────────────────

export const LessonPlanSectionSchema = z.object({
  phase: z.string().min(1).max(100),
  duration: z.string().max(50).optional(),
  teacherActivity: z.string().max(1000),
  pupilActivity: z.string().max(1000),
  differentiation: z.string().max(500).optional(),
  resources: z.array(z.string().max(200)).max(10).optional(),
  assessment: z.string().max(500).optional(),
});

export type LessonPlanSection = z.infer<typeof LessonPlanSectionSchema>;

export const LessonPlanSchema = z.object({
  title: z.string().min(1).max(300),
  subject: z.string().max(200).optional(),
  yearGroup: z.string().max(50).optional(),
  duration: z.string().max(50).optional(),
  learningObjectives: z.array(z.string().max(300)).min(1).max(10),
  keyVocabulary: z.array(z.string().max(100)).max(20).optional(),
  sections: z.array(LessonPlanSectionSchema).min(1).max(10),
  homeworkTask: z.string().max(500).optional(),
  sendConsiderations: z.string().max(1000).optional(),
});

export type LessonPlan = z.infer<typeof LessonPlanSchema>;

// ── Pupil Passport Schema ─────────────────────────────────────────────────────

export const PupilPassportSchema = z.object({
  name: z.string().max(200).optional(),
  strengths: z.array(z.string().max(300)).max(10),
  challenges: z.array(z.string().max(300)).max(10),
  strategies: z.array(z.string().max(300)).max(15),
  communicationStyle: z.string().max(500).optional(),
  triggers: z.array(z.string().max(300)).max(10).optional(),
  calming: z.array(z.string().max(300)).max(10).optional(),
  interests: z.array(z.string().max(200)).max(10).optional(),
  importantPeople: z.array(z.string().max(200)).max(10).optional(),
  pupilVoice: z.string().max(500).optional(),
});

export type PupilPassport = z.infer<typeof PupilPassportSchema>;

// ── Report Comment Schema ─────────────────────────────────────────────────────

export const ReportCommentSchema = z.object({
  comment: z.string().min(10).max(2000),
  tone: z.enum(["positive", "constructive", "neutral"]).optional(),
  biasFlags: z.array(z.string().max(200)).max(5).optional(),
  readingAge: z.number().min(6).max(18).optional(),
});

export type ReportComment = z.infer<typeof ReportCommentSchema>;

// ── Presentation Schema ───────────────────────────────────────────────────────

export const SlideSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.array(z.string().max(500)).max(10),
  notes: z.string().max(1000).optional(),
  layout: z.enum(["title", "content", "two-column", "image", "blank"]).optional().default("content"),
  imagePrompt: z.string().max(300).optional(),
});

export type Slide = z.infer<typeof SlideSchema>;

export const PresentationSchema = z.object({
  title: z.string().min(1).max(300),
  slides: z.array(SlideSchema).min(1).max(30),
  theme: z.string().max(100).optional(),
});

export type Presentation = z.infer<typeof PresentationSchema>;

// ── Comprehension Schema ──────────────────────────────────────────────────────

export const ComprehensionQuestionSchema = z.object({
  question: z.string().min(1).max(500),
  level: z.enum(["literal", "inferential", "evaluative"]),
  marks: z.number().int().min(1).max(10).optional(),
  answerKey: z.string().max(500).optional(),
});

export type ComprehensionQuestion = z.infer<typeof ComprehensionQuestionSchema>;

export const ComprehensionSchema = z.object({
  passage: z.string().min(50).max(5000),
  questions: z.array(ComprehensionQuestionSchema).min(1).max(20),
  vocabularyFocus: z.array(z.string().max(100)).max(10).optional(),
  readingLevel: z.string().max(50).optional(),
});

export type Comprehension = z.infer<typeof ComprehensionSchema>;


// ── Bulk Scan-and-Mark Schemas — FEAT-PB4 ─────────────────────────────────────
// Class-set scanning (multiple pupil photos) goes through the same per-image
// /api/ai/scan-mark endpoint, so the per-question shape mirrors the existing
// scan-mark response. These schemas validate the *aggregated* class-set
// payload that the UI persists in memory and that the marksheet CSV exporter
// consumes. They are intentionally permissive: missing optional fields fall
// back to defaults rather than tripping the exporter, because a single bad
// scan in a 30-pupil run shouldn't dynamite the whole marksheet.

export const ScanMarkQuestionSchema = z.object({
  questionNumber: z.number().int().min(1),
  questionText: z.string().max(2000).default(""),
  pupilAnswer: z.string().max(2000).default(""),
  correct: z.boolean(),
  marksAwarded: z.number().min(0).max(100),
  marksAvailable: z.number().min(0).max(100),
  modelAnswer: z.string().max(2000).default(""),
  misconceptionTag: z.string().max(300).nullable(),
});

export type ScanMarkQuestionShape = z.infer<typeof ScanMarkQuestionSchema>;

export const ScanMarkResultSchema = z.object({
  questions: z.array(ScanMarkQuestionSchema).max(50),
  summary: z.object({
    totalAwarded: z.number().min(0),
    totalAvailable: z.number().min(0),
    overallNote: z.string().max(2000).default(""),
  }),
  provider: z.string().max(50).default("unknown"),
});

export type ScanMarkResultShape = z.infer<typeof ScanMarkResultSchema>;

export const BatchScanResultSchema = z.object({
  pupilId: z.string().min(1).max(64),
  pupilName: z.string().min(1).max(120),
  upn: z.string().max(64).optional(),
  result: ScanMarkResultSchema,
  scannedAt: z.string().min(1),
  feedbackComment: z.string().max(2000).optional(),
  error: z.string().max(500).optional(),
});

export type BatchScanResultShape = z.infer<typeof BatchScanResultSchema>;

/**
 * The full bulk-scan payload as it lives in the dialog's state and as it is
 * passed to exportToCsv. Validated once after a batch completes so a
 * teacher-facing CSV export never silently drops a malformed pupil row.
 */
export const BulkScanResultSchema = z.object({
  worksheetTitle: z.string().min(1).max(300),
  className: z.string().max(120).optional(),
  /** ISO 8601 timestamp when the batch finished. */
  completedAt: z.string().min(1),
  results: z.array(BatchScanResultSchema).max(50),
  /** Aggregated stats pulled in via aggregateBatch — optional so callers
   *  can validate just the raw batch ahead of computing aggregates. */
  aggregate: z
    .object({
      totalPupils: z.number().int().min(0),
      totalQuestions: z.number().int().min(0),
      classAccuracyPct: z.number().min(0).max(100),
      topMisconceptions: z
        .array(
          z.object({
            label: z.string().min(1).max(300),
            pupilCount: z.number().int().min(0),
          }),
        )
        .max(10),
    })
    .optional(),
});

export type BulkScanResult = z.infer<typeof BulkScanResultSchema>;
