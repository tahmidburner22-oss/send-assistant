/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * WorkedExampleWalkthrough.tsx — FEAT-H9.
 *
 * Companion-app surface that drives a multi-step worked-example
 * walkthrough via the pure stepperReducer. Per step: pupil reveals
 * → attempts → gets verifier feedback → reveals model → unlocks next.
 * Falls back to plain rendering when the section has no
 * workedExampleSteps.
 */

import React, { useReducer, useState } from "react";
import {
  initialStepperState,
  isStepRevealed,
  stepperReducer,
  type WorkedStep,
} from "@/lib/workedExampleStepper";
import { verifyAnswer, type AnswerSpec, type VerifyResult } from "@/lib/answerVerifier";

export interface WorkedExampleWalkthroughProps {
  steps: WorkedStep[];
  /** When set, runs the verifier on each step's attempt. */
  buildAnswerSpec?: (step: WorkedStep) => AnswerSpec | undefined;
}

export function WorkedExampleWalkthrough(props: WorkedExampleWalkthroughProps): React.ReactElement {
  const [state, dispatch] = useReducer(stepperReducer, initialStepperState(props.steps));
  const [attempts, setAttempts] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, VerifyResult>>({});

  if (!props.steps || props.steps.length === 0) {
    return <p className="italic text-gray-500">No structured steps for this worked example.</p>;
  }

  return (
    <ol className="space-y-3" data-testid="worked-example-walkthrough">
      {props.steps.map((step) => {
        const revealed = isStepRevealed(state, step.stepNumber);
        const status = state.perStep[step.stepNumber];
        return (
          <li
            key={step.stepNumber}
            className={`border rounded p-2 ${revealed ? "bg-white" : "bg-gray-50 opacity-60"}`}
            aria-current={state.currentStep === step.stepNumber}
          >
            <div className="text-xs font-bold mb-1">Step {step.stepNumber}</div>
            {revealed ? (
              <>
                <p className="text-sm">{step.prompt}</p>
                {status === "attempted" || status === "fed-back" || status === "complete" ? null : (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={attempts[step.stepNumber] || ""}
                      onChange={(e) =>
                        setAttempts((a) => ({ ...a, [step.stepNumber]: e.target.value }))
                      }
                      className="border rounded px-2 py-1 text-sm w-full"
                      placeholder="Your attempt…"
                      aria-label={`Step ${step.stepNumber} attempt`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const spec = props.buildAnswerSpec?.(step);
                        if (spec) {
                          const r = verifyAnswer(spec, attempts[step.stepNumber] || "", { marksAvailable: 1 });
                          setResults((m) => ({ ...m, [step.stepNumber]: r }));
                        }
                        dispatch({ type: "feedback", step: step.stepNumber });
                      }}
                      disabled={!attempts[step.stepNumber]}
                      className="mt-1 text-xs px-2 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                    >
                      Check my step
                    </button>
                  </div>
                )}
                {results[step.stepNumber] && (
                  <p className="mt-1 text-xs text-gray-700">{results[step.stepNumber].feedback}</p>
                )}
                {(status === "fed-back" || status === "complete") && (
                  <div className="mt-2 text-xs bg-yellow-50 border-l-2 border-yellow-400 px-2 py-1">
                    <strong>Model:</strong> {step.modelAnswer}
                  </div>
                )}
                {state.currentStep === step.stepNumber && status !== "complete" && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "advance" })}
                    className="mt-2 text-xs px-2 py-1 rounded border border-gray-400"
                  >
                    Next step →
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs italic text-gray-500">Locked — finish step {step.stepNumber - 1}.</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default WorkedExampleWalkthrough;
