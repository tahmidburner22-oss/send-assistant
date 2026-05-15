/**
 * pipelines.ts — Named multi-tool workflows that mirror the actual job a
 * SENCO is doing.
 *
 * Each pipeline is a numbered stepper at the top of /pipelines/:id; each
 * step deep-links into a tool with carry-over field values, and progress
 * is persisted per pupil in localStorage.
 *
 * The four canonical pipelines below mirror the PROCESS block on the
 * landing page (Screen → Plan → Adapt → Deliver → Review), plus an
 * onboarding flow and a report-season flow.
 */

import type { ToolEntry } from "./tool-registry";
import { getTool } from "./tool-registry";

export interface PipelineStep {
  toolId: string;
  /** Heading displayed above the tool in the stepper. */
  heading: string;
  /** Plain-language summary of the step. */
  blurb: string;
  /** Optional — fields the previous step's output should fill in. */
  carryOver?: string[];
}

export interface PipelineDef {
  id: string;
  label: string;
  description: string;
  audience: string;
  steps: PipelineStep[];
}

export const PIPELINES: PipelineDef[] = [
  {
    id: "annual-review",
    label: "Annual Review",
    description: "Run a complete EHCP annual review pack from screening through to the parent-facing output.",
    audience: "SENCO",
    steps: [
      { toolId: "send-screener",       heading: "1 · Re-screen", blurb: "Evidence the change-over-time picture across six domains." },
      { toolId: "pupil-passport",       heading: "2 · Update Passport", blurb: "Refresh the 1-page profile staff and supply teachers see." },
      { toolId: "ehcp-plan-generator",  heading: "3 · Draft EHCP Update", blurb: "Generate a redline with last year's outcomes and progress." },
      { toolId: "smart-targets",        heading: "4 · Set Termly Targets", blurb: "Build SMART targets aligned to the new outcomes." },
      { toolId: "behaviour-plan",       heading: "5 · Refresh BSP", blurb: "Update triggers, de-escalation strategies and review dates." },
      { toolId: "parent-newsletter",    heading: "6 · Parent Letter", blurb: "Translate, audio-render, and post to the Parent Portal." },
      { toolId: "scheduler",            heading: "7 · Book the AR", blurb: "Schedule the review meeting with auto-reminders." },
    ],
  },
  {
    id: "new-pupil-onboarding",
    label: "New-Pupil Onboarding",
    description: "Capture everything you need for a new SEND pupil joining mid-year.",
    audience: "SENCO + class teacher",
    steps: [
      { toolId: "pupil-passport",       heading: "1 · Capture Basics", blurb: "Quick all-about-me from previous-school records." },
      { toolId: "send-screener",        heading: "2 · Baseline", blurb: "Establish the starting picture across SEND domains." },
      { toolId: "ehcp-plan-generator",  heading: "3 · Plan If Needed", blurb: "If thresholds met, draft the referral pack." },
      { toolId: "daily-adaptive-work",  heading: "4 · Calibrate Daily Work", blurb: "Initial daily-work calibration before pattern emerges." },
    ],
  },
  {
    id: "lesson-delivery",
    label: "Lesson Delivery",
    description: "Plan, build, deliver and assess one lesson — with SEND adaptations baked in at every step.",
    audience: "Class teacher",
    steps: [
      { toolId: "medium-term-planner",  heading: "1 · Where Are We?", blurb: "Pick the row in the half-term plan you're delivering." },
      { toolId: "lesson-planner",       heading: "2 · Plan Tomorrow", blurb: "Generate the full plan with adaptations column.", carryOver: ["topic", "yearGroup"] },
      { toolId: "worksheet-generator",  heading: "3 · Build the Work", blurb: "Curriculum-aligned worksheet from the lesson plan.", carryOver: ["topic", "yearGroup", "sendNeed"] },
      { toolId: "differentiate",        heading: "4 · Differentiate", blurb: "Strip-or-stack adapt for named SEND profiles." },
      { toolId: "rubric-generator",     heading: "5 · Mark Scheme", blurb: "SEND-tuned rubric, ready before the lesson runs." },
      { toolId: "visual-timetable",     heading: "6 · Update Timetable", blurb: "Push the lesson into the visual timetable for the class." },
      { toolId: "skill-ladder",         heading: "7 · Roll Into Evidence", blurb: "Auto-update the skill ladder rungs after marking." },
    ],
  },
  {
    id: "report-season",
    label: "Report Season",
    description: "End-of-term report season — bulk generate, lint, send.",
    audience: "Senior leader + class teachers",
    steps: [
      { toolId: "skill-ladder",         heading: "1 · Pull Evidence", blurb: "Surface mastery vs exposure data per cohort." },
      { toolId: "report-comments",      heading: "2 · Bulk Generate", blurb: "Class-CSV batch run with bias / cliché lint." },
      { toolId: "rubric-generator",     heading: "3 · Calibrate", blurb: "Cross-check the comments against this term's rubrics." },
      { toolId: "parent-newsletter",    heading: "4 · Cover Letter", blurb: "School-wide context for the report packs." },
      { toolId: "parent-portal",        heading: "5 · Distribute", blurb: "Push translated + audio versions to families." },
    ],
  },
  {
    id: "behaviour-flow",
    label: "Behaviour Cycle",
    description: "Move from a logged ABC incident pattern to a defensible plan with parent and TA buy-in.",
    audience: "Class teacher + SENCO",
    steps: [
      { toolId: "send-screener",        heading: "1 · Quick screen", blurb: "Rule out unmet need before naming a behaviour problem." },
      { toolId: "behaviour-plan",       heading: "2 · Draft BSP", blurb: "Twelve-section plan, validator-checked, with lanyard card." },
      { toolId: "pupil-passport",       heading: "3 · Sync Passport", blurb: "Mirror new strategies into the supply-teacher view." },
      { toolId: "scheduler",            heading: "4 · Book Review", blurb: "Calendar 6-week review with all named adults." },
      { toolId: "parent-newsletter",    heading: "5 · Parent Letter", blurb: "Translate-and-send the plan summary to home." },
    ],
  },
];

export function getPipeline(id: string): PipelineDef | undefined {
  return PIPELINES.find(p => p.id === id);
}

/** Resolve a pipeline's steps to full tool entries (skips unknown tools). */
export function pipelineSteps(p: PipelineDef): Array<PipelineStep & { tool: ToolEntry }> {
  const out: Array<PipelineStep & { tool: ToolEntry }> = [];
  for (const s of p.steps) {
    const tool = getTool(s.toolId);
    if (tool) out.push({ ...s, tool });
  }
  return out;
}

const PROGRESS_KEY = "adaptly_pipelines_v1";

interface PipelineProgress {
  /** key = `${pipelineId}::${pupilId || 'general'}` */
  [key: string]: { completed: string[]; current: number; updatedAt: number };
}

function readProgress(): PipelineProgress {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch { return {}; }
}

function writeProgress(p: PipelineProgress): void {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch {}
}

function progressKey(pipelineId: string, pupilId?: string): string {
  return `${pipelineId}::${pupilId || "general"}`;
}

export function getPipelineProgress(pipelineId: string, pupilId?: string) {
  const all = readProgress();
  return all[progressKey(pipelineId, pupilId)] || { completed: [], current: 0, updatedAt: 0 };
}

export function markStepComplete(pipelineId: string, stepIndex: number, pupilId?: string): void {
  const all = readProgress();
  const k = progressKey(pipelineId, pupilId);
  const cur = all[k] || { completed: [], current: 0, updatedAt: 0 };
  const stepKey = String(stepIndex);
  if (!cur.completed.includes(stepKey)) cur.completed = [...cur.completed, stepKey];
  cur.current = Math.max(cur.current, stepIndex + 1);
  cur.updatedAt = Date.now();
  all[k] = cur;
  writeProgress(all);
}

export function resetPipelineProgress(pipelineId: string, pupilId?: string): void {
  const all = readProgress();
  delete all[progressKey(pipelineId, pupilId)];
  writeProgress(all);
}
