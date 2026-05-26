/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * QuestionTimer.tsx — FEAT-G13.
 *
 * Per-question timer display + tick handler. Drives the pure
 * questionTimer reducer. Locks the parent's answer-entry input on
 * expiry via the onExpire callback.
 */

import React, { useEffect, useReducer, useRef } from "react";
import {
  initialTimerState,
  isExpired,
  remainingMs,
  timerReducer,
} from "@/lib/questionTimer";

export interface QuestionTimerProps {
  allocatedMs: number;
  /** Called once when the timer reaches zero. */
  onExpire?: () => void;
  /** Auto-start on mount (mock-exam mode). Default false. */
  autoStart?: boolean;
}

function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return "∞";
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QuestionTimer(props: QuestionTimerProps): React.ReactElement {
  const [state, dispatch] = useReducer(timerReducer, initialTimerState(props.allocatedMs));
  const expiredRef = useRef(false);

  useEffect(() => {
    if (props.autoStart) dispatch({ type: "start", now: Date.now() });
  }, [props.autoStart]);

  useEffect(() => {
    if (state.status !== "running") return;
    const id = window.setInterval(() => {
      const now = Date.now();
      dispatch({ type: "tick", now });
      if (!expiredRef.current && isExpired(state, now)) {
        expiredRef.current = true;
        props.onExpire?.();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [state, props]);

  const remaining = remainingMs(state, Date.now());
  const expired = state.status === "finished";

  return (
    <div
      data-testid="question-timer"
      className="inline-flex items-center gap-1 text-xs font-mono"
      aria-live="off"
    >
      <span aria-label="Time remaining">{formatMs(remaining)}</span>
      {state.status === "idle" && (
        <button
          type="button"
          onClick={() => dispatch({ type: "start", now: Date.now() })}
          className="px-1.5 py-0.5 border rounded"
          aria-label="Start timer"
        >
          ▶
        </button>
      )}
      {state.status === "running" && (
        <button
          type="button"
          onClick={() => dispatch({ type: "pause", now: Date.now() })}
          className="px-1.5 py-0.5 border rounded"
          aria-label="Pause timer"
        >
          ⏸
        </button>
      )}
      {state.status === "paused" && (
        <button
          type="button"
          onClick={() => dispatch({ type: "resume", now: Date.now() })}
          className="px-1.5 py-0.5 border rounded"
          aria-label="Resume timer"
        >
          ▶
        </button>
      )}
      {expired && <span className="text-red-600">⏰ Time up</span>}
    </div>
  );
}

export default QuestionTimer;
