/**
 * pipeline.ts — Adaptly Worksheet Generation Pipeline
 *
 * Orchestrates the 10-stage validation pipeline:
 *
 * Stage 1: Topic plan (Planner engine)
 * Stage 2: Question sequencing (Planner engine)
 * Stage 3: Layout assignment (Layout engine)
 * Stage 4: Diagram generation (Diagram engine)
 * Stage 5: SEND overlay (Adaptation engine)
 * Stage 6: Primary/secondary profile adjustment (Adaptation engine)
 * Stage 7: Page fit check (Layout engine + Validator)
 * Stage 8: Accessibility check (Validator)
 * Stage 9: Final render check (Validator)
 * Stage 10: Lock output (Validator)
 *
 * Usage:
 *   const result = await runWorksheetPipeline(params, aiWorksheet);
 *   if (result.readyToRender) { render(result.worksheet); }
 */

import { createWorksheetPlan, QUESTION_LAYOUT_MAP, type WorksheetPlan } from "./planner";
import { assignLayouts, type AssignedQuestion, type PageLayoutPlan } from "./layoutEngine";
import { autoGenerateCircuitDiagram, validateDiagram, type DiagramSpec } from "./diagramEngine";
import { buildAdaptation, applyAdaptation, type AdaptationProfile } from "./adaptationEngine";
import { validateWorksheet, lockOutput, type ValidationReport } from "./validator";
import type { WorksheetData } from "../worksheet-generator";

// ─── Pipeline parameters ──────────────────────────────────────────────────────
export interface PipelineParams {
  topic: string;
  subject: string;
  yearGroup: string;
  phase: "primary" | "secondary";
  durationMins: number;
  sendNeed?: string;
  priorTopic?: string;
  difficulty?: string;
}

// ─── Pipeline result ──────────────────────────────────────────────────────────
export interface PipelineResult {
  worksheet: WorksheetData;
  plan: WorksheetPlan;
  assignedQuestions: AssignedQuestion[];
  pages: PageLayoutPlan[];
  validationReport: ValidationReport;
  readyToRender: boolean;
  stageLog: PipelineStageLog[];
  diagramSVGs: Record<string, string>; // sectionId -> SVG string
}

export interface PipelineStageLog {
  stage: number;
  name: string;
  status: "OK" | "WARN" | "FAIL";
  messages: string[];
  durationMs: number;
}

// ─── Pipeline orchestrator ────────────────────────────────────────────────────
/**
 * Runs the full 10-stage pipeline on an AI-generated worksheet.
 * Returns a PipelineResult with the validated, adapted, locked worksheet.
 */
export function runWorksheetPipeline(
  params: PipelineParams,
  aiWorksheet: WorksheetData
): PipelineResult {
  const stageLog: PipelineStageLog[] = [];
  const diagramSVGs: Record<string, string> = {};

  function logStage(stage: number, name: string, status: "OK" | "WARN" | "FAIL", messages: string[], start: number) {
    stageLog.push({ stage, name, status, messages, durationMs: Date.now() - start });
  }

  // ── Stage 1: Topic plan ───────────────────────────────────────────────────
  let t = Date.now();
  const plan = createWorksheetPlan({
    topic: params.topic,
    subject: params.subject,
    yearGroup: params.yearGroup,
    phase: params.phase,
    durationMins: params.durationMins,
    sendNeed: params.sendNeed,
    priorTopic: params.priorTopic,
    difficulty: params.difficulty,
  });
  logStage(1, "Topic Plan", plan.validationWarnings.length > 0 ? "WARN" : "OK", plan.validationWarnings, t);

  // ── Stage 2: Question sequencing ─────────────────────────────────────────
  t = Date.now();
  // Verify no adjacent same layout family
  const layoutSeq = plan.layoutFamilySequence;
  const adjacentErrors: string[] = [];
  for (let i = 1; i < layoutSeq.length; i++) {
    if (layoutSeq[i] === layoutSeq[i - 1]) {
      adjacentErrors.push(`Adjacent questions ${i} and ${i + 1} share layout family "${layoutSeq[i]}".`);
    }
  }
  logStage(2, "Question Sequencing", adjacentErrors.length > 0 ? "WARN" : "OK", adjacentErrors, t);

  // ── Stage 3: Layout assignment ────────────────────────────────────────────
  t = Date.now();
  // Estimate marks per question from the AI worksheet sections
  const marksPerQuestion = estimateMarksFromWorksheet(aiWorksheet, plan.totalQuestions);
  const { assignedQuestions, pages, warnings: layoutWarnings } = assignLayouts(plan, marksPerQuestion);
  logStage(3, "Layout Assignment", layoutWarnings.length > 0 ? "WARN" : "OK", layoutWarnings, t);

  // ── Stage 4: Diagram generation ───────────────────────────────────────────
  t = Date.now();
  const diagramErrors: string[] = [];
  const diagramsForValidation: Array<{ spec: DiagramSpec; containerWidth: number; containerHeight: number; questionNumber?: number }> = [];

  // Auto-generate circuit diagram if topic is electricity/circuits
  const circuitDiagram = autoGenerateCircuitDiagram(params.topic);
  if (circuitDiagram) {
    const validation = validateDiagram(circuitDiagram.spec, circuitDiagram.spec.boxWidth, circuitDiagram.spec.boxHeight);
    if (validation.pass) {
      diagramSVGs["auto-circuit"] = circuitDiagram.svg;
      diagramsForValidation.push({
        spec: circuitDiagram.spec,
        containerWidth: circuitDiagram.spec.boxWidth,
        containerHeight: circuitDiagram.spec.boxHeight,
      });
    } else {
      diagramErrors.push(...validation.allErrors);
    }
  }

  // Check any diagrams already in the AI worksheet
  for (const section of (aiWorksheet.sections ?? [])) {
    if (section.diagramSpec) {
      try {
        const spec = typeof section.diagramSpec === "string"
          ? JSON.parse(section.diagramSpec) as DiagramSpec
          : section.diagramSpec as DiagramSpec;
        const validation = validateDiagram(spec, 500, 300);
        if (validation.pass) {
          diagramSVGs[section.id ?? section.title] = ""; // will be rendered by the renderer
          diagramsForValidation.push({ spec, containerWidth: 500, containerHeight: 300 });
        } else {
          diagramErrors.push(...validation.allErrors.map(e => `Section "${section.title}": ${e}`));
        }
      } catch {
        diagramErrors.push(`Section "${section.title}": Invalid diagram spec.`);
      }
    }
  }

  logStage(4, "Diagram Generation", diagramErrors.length > 0 ? "FAIL" : "OK", diagramErrors, t);

  // ── Stage 5: SEND overlay ─────────────────────────────────────────────────
  t = Date.now();
  const originalSectionCount = aiWorksheet.sections?.length ?? 0;
  let adaptedWorksheet = aiWorksheet;
  const adaptationWarnings: string[] = [];

  if (params.sendNeed || params.phase) {
    const profile: AdaptationProfile = {
      phase: params.phase,
      sendNeed: params.sendNeed as any,
      difficulty: params.difficulty as any,
    };
    const adaptation = buildAdaptation(aiWorksheet, profile);
    adaptedWorksheet = applyAdaptation(aiWorksheet, adaptation);
    adaptationWarnings.push(...adaptation.validationWarnings);
  }
  logStage(5, "SEND Overlay", adaptationWarnings.length > 0 ? "WARN" : "OK", adaptationWarnings, t);

  // ── Stage 6: Primary/secondary profile adjustment ─────────────────────────
  t = Date.now();
  // Already handled in Stage 5 via AdaptationProfile.phase
  logStage(6, "Profile Adjustment", "OK", [], t);

  // ── Stage 7: Page fit check ───────────────────────────────────────────────
  t = Date.now();
  const overflowWarnings: string[] = [];
  for (const page of pages) {
    if (page.hasOverflow) {
      overflowWarnings.push(`Page ${page.pageNumber} has content overflow.`);
    }
  }
  logStage(7, "Page Fit Check", overflowWarnings.length > 0 ? "WARN" : "OK", overflowWarnings, t);

  // ── Stage 8: Accessibility check ─────────────────────────────────────────
  t = Date.now();
  const accessibilityWarnings: string[] = [];
  for (const section of (adaptedWorksheet.sections ?? [])) {
    if ((section.type === "diagram" || section.type === "q-circuit" || section.type === "q-label-diagram") && !section.altText) {
      accessibilityWarnings.push(`Section "${section.title}" is a diagram but has no alt text.`);
    }
  }
  logStage(8, "Accessibility Check", accessibilityWarnings.length > 0 ? "WARN" : "OK", accessibilityWarnings, t);

  // ── Stage 9: Final render check (full validation) ─────────────────────────
  t = Date.now();
  const validationReport = validateWorksheet({
    worksheet: adaptedWorksheet,
    plan,
    assignedQuestions,
    originalSectionCount,
    diagrams: diagramsForValidation,
  });
  logStage(9, "Final Render Check", validationReport.status === "PASS" ? "OK" : validationReport.errors.length > 0 ? "FAIL" : "WARN",
    [...validationReport.errors, ...validationReport.warnings], t);

  // ── Stage 10: Lock output ─────────────────────────────────────────────────
  t = Date.now();
  const lockedWorksheet = lockOutput(adaptedWorksheet, validationReport);
  logStage(10, "Lock Output", validationReport.readyToRender ? "OK" : "FAIL",
    validationReport.readyToRender ? [] : ["Worksheet failed validation. Output locked for review."], t);

  return {
    worksheet: lockedWorksheet,
    plan,
    assignedQuestions,
    pages,
    validationReport,
    readyToRender: validationReport.readyToRender,
    stageLog,
    diagramSVGs,
  };
}

// ─── Helper: estimate marks per question from AI worksheet ────────────────────
function estimateMarksFromWorksheet(worksheet: WorksheetData, totalQuestions: number): number[] {
  const marks: number[] = [];
  const sections = worksheet.sections ?? [];

  // Try to extract marks from section content
  for (const section of sections) {
    const marksMatch = section.content?.match(/\[(\d+)\s*marks?\]/i);
    if (marksMatch) {
      marks.push(parseInt(marksMatch[1]));
    } else {
      // Default marks by section type
      const typeMarks: Record<string, number> = {
        "q-true-false": 4,
        "q-mcq": 1,
        "q-gap-fill": 4,
        "q-short-answer": 3,
        "q-extended": 5,
        "q-label-diagram": 4,
        "q-data-table": 4,
        "q-draw": 3,
        "q-graph": 4,
        "q-circuit": 4,
        "q-ordering": 3,
        "q-matching": 3,
        // Advanced question types
        "q-error-correction": 4,
        "q-ranking": 3,
        "q-what-changed": 4,
        "q-constraint-problem": 5,
        "error_correction": 4,
        "ranking": 3,
        "what_changed": 4,
        "constraint_problem": 5,
      };
      marks.push(typeMarks[section.type] ?? 3);
    }
  }

  // Pad to totalQuestions if needed
  while (marks.length < totalQuestions) {
    marks.push(3);
  }

  return marks.slice(0, totalQuestions);
}
