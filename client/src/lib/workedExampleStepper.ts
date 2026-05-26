/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * workedExampleStepper.ts — FEAT-H9.
 *
 * Pure state machine for the multi-step worked-example walkthrough
 * in the companion app. Pupil reveals step 1 → attempts step 2 →
 * gets G1 verifier feedback → reveals step 2's model → unlocks step
 * 3. Step state persists in companion-answer-log.
 */

export type StepStatus = "locked" | "revealed" | "attempted" | "fed-back" | "complete";

export interface WorkedStep {
  stepNumber: number;
  prompt: string;
  expectedAnswer?: string;
  modelAnswer: string;
  methodMark?: string;
}

export interface StepperState {
  currentStep: number;
  perStep: Record<number, StepStatus>;
}

export type StepperAction =
  | { type: "init"; steps: WorkedStep[] }
  | { type: "reveal"; step: number }
  | { type: "attempt"; step: number }
  | { type: "feedback"; step: number }
  | { type: "advance" };

export function initialStepperState(steps: WorkedStep[]): StepperState {
  const perStep: Record<number, StepStatus> = {};
  for (let i = 0; i < steps.length; i++) {
    perStep[i + 1] = i === 0 ? "revealed" : "locked";
  }
  return { currentStep: 1, perStep };
}

function isUnlocked(state: StepperState, stepNumber: number): boolean {
  if (stepNumber === 1) return true;
  return state.perStep[stepNumber - 1] === "complete";
}

export function stepperReducer(state: StepperState, action: StepperAction): StepperState {
  switch (action.type) {
    case "init":
      return initialStepperState(action.steps);
    case "reveal": {
      if (!isUnlocked(state, action.step)) return state;
      return { ...state, perStep: { ...state.perStep, [action.step]: "revealed" } };
    }
    case "attempt": {
      if (!isUnlocked(state, action.step)) return state;
      return { ...state, perStep: { ...state.perStep, [action.step]: "attempted" } };
    }
    case "feedback": {
      const cur = state.perStep[action.step];
      if (cur !== "attempted" && cur !== "revealed") return state;
      return { ...state, perStep: { ...state.perStep, [action.step]: "fed-back" } };
    }
    case "advance": {
      const cur = state.perStep[state.currentStep];
      if (cur !== "fed-back" && cur !== "revealed") return state;
      const newPerStep = { ...state.perStep, [state.currentStep]: "complete" as StepStatus };
      const next = state.currentStep + 1;
      if (newPerStep[next] === "locked") newPerStep[next] = "revealed";
      return { ...state, currentStep: next, perStep: newPerStep };
    }
    default:
      return state;
  }
}

export function isStepRevealed(state: StepperState, stepNumber: number): boolean {
  const s = state.perStep[stepNumber];
  return s === "revealed" || s === "attempted" || s === "fed-back" || s === "complete";
}
