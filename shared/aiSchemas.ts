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

export const WorksheetSectionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50000),
  type: z.string().optional().default("text"),
  teacherOnly: z.boolean().optional().default(false),
  difficulty: z.string().optional(),
  order: z.number().int().optional(),
});

export type WorksheetSection = z.infer<typeof WorksheetSectionSchema>;

export const WorksheetSectionArraySchema = z.array(WorksheetSectionSchema).min(1).max(50);

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
