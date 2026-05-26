/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * AnswerEntryPanel.tsx — FEAT-G1.
 *
 * Pupil-facing answer-entry surface for the companion app. Renders
 * the appropriate input (text / radio / textarea) based on the
 * section's `answerSpec.mode`, runs the verifier on submit, and
 * surfaces an instant tick / cross + diagnosed misconception (when
 * available) + a "Show hint ladder" disclosure.
 */

import React, { useState } from "react";
import {
  verifyAnswer,
  type AnswerSpec,
  type MisconceptionLink,
  type VerifyResult,
  type VerifierStatus,
} from "@/lib/answerVerifier";
import { recordAttempt } from "@/lib/companion-answer-log";

export interface AnswerEntryPanelProps {
  token: string;
  sectionIndex: number;
  answerSpec?: AnswerSpec;
  marksAvailable?: number;
  misconceptionLinks?: MisconceptionLink[];
  /** Optional pupil-facing MCQ option labels (A-D). */
  mcqOptions?: string[];
  /** Called when an attempt is recorded. */
  onAttempt?: (result: VerifyResult, pupilAnswer: string) => void;
  /** When true, input becomes read-only (e.g. timer expired). */
  locked?: boolean;
  /** Optional hint ladder to expose on demand. */
  hints?: [string, string, string];
}

const STATUS_COLOUR: Record<VerifierStatus, string> = {
  correct: "bg-green-50 border-green-300 text-green-800",
  partial: "bg-yellow-50 border-yellow-300 text-yellow-800",
  incorrect: "bg-red-50 border-red-300 text-red-800",
  unmarked: "bg-gray-50 border-gray-300 text-gray-700",
};

export function AnswerEntryPanel(props: AnswerEntryPanelProps): React.ReactElement {
  const mode = props.answerSpec?.mode || "open";
  const [value, setValue] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  function submit() {
    if (props.locked) return;
    const verification = verifyAnswer(props.answerSpec, value, {
      misconceptionLinks: props.misconceptionLinks,
      sectionIndex: props.sectionIndex,
      marksAvailable: props.marksAvailable,
    });
    setResult(verification);
    try {
      recordAttempt(props.token, {
        sectionIndex: props.sectionIndex,
        attemptedAt: new Date().toISOString(),
        status: verification.status,
        gainedMarks: verification.gainedMarks,
        marksAvailable: verification.marksAvailable,
        pupilAnswer: value,
        misconceptionId: verification.misconceptionId,
      });
    } catch {
      // localStorage may be blocked — non-fatal
    }
    props.onAttempt?.(verification, value);
  }

  return (
    <div data-testid="answer-entry-panel" className="mt-2 text-sm">
      {mode === "mcq" ? (
        <fieldset className="space-y-1">
          <legend className="sr-only">Choose an answer</legend>
          {(props.mcqOptions || ["A", "B", "C", "D"]).map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            return (
              <label key={letter} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`mcq-${props.token}-${props.sectionIndex}`}
                  value={letter}
                  checked={value === letter}
                  onChange={() => setValue(letter)}
                  disabled={props.locked}
                />
                <span>
                  <strong>{letter}.</strong> {opt}
                </span>
              </label>
            );
          })}
        </fieldset>
      ) : mode === "structured" ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={props.locked}
          rows={4}
          aria-label="Show your working"
          placeholder="Show your working step by step…"
          className="w-full border rounded px-2 py-1 text-sm"
        />
      ) : mode === "open" ? (
        <p className="italic text-gray-500">Teacher will mark this question.</p>
      ) : (
        <input
          type={mode === "numeric" ? "text" : "text"}
          inputMode={mode === "numeric" ? "decimal" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={props.locked}
          aria-label="Your answer"
          placeholder={mode === "numeric" ? "Type a number" : "Type your answer"}
          className="w-full border rounded px-2 py-1 text-sm"
        />
      )}
      {mode !== "open" && (
        <button
          type="button"
          onClick={submit}
          disabled={props.locked || !value.trim()}
          data-testid="answer-entry-check"
          className="mt-2 px-3 py-1 text-xs font-bold rounded bg-blue-600 text-white disabled:opacity-50"
        >
          Check
        </button>
      )}
      {result && (
        <div
          role="status"
          aria-live="polite"
          data-testid="answer-entry-result"
          className={`mt-2 border rounded px-2 py-1 text-xs ${STATUS_COLOUR[result.status]}`}
        >
          {result.feedback}
          {result.misconceptionText && (
            <div className="mt-1 text-[11px] italic">{result.misconceptionText}</div>
          )}
        </div>
      )}
      {props.hints && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setHintsOpen((v) => !v)}
            className="text-xs text-blue-700 underline"
          >
            {hintsOpen ? "Hide hints" : "Show hint ladder"}
          </button>
          {hintsOpen && (
            <div className="mt-1 space-y-1">
              {Array.from({ length: hintLevel }).map((_, i) => (
                <div key={i} className="text-xs px-2 py-1 bg-gray-50 border-l-2 border-gray-400">
                  <strong>Hint {i + 1}:</strong> {props.hints![i]}
                </div>
              ))}
              {hintLevel < 3 && (
                <button
                  type="button"
                  onClick={() => setHintLevel((l) => Math.min(3, l + 1))}
                  className="text-xs px-2 py-0.5 border border-gray-300 rounded"
                >
                  {hintLevel === 0 ? "Show first hint" : "Next hint"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AnswerEntryPanel;
