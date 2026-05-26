/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * questionTimer.ts — FEAT-G13.
 *
 * Tiny pure state machine used by the per-question timer in the
 * companion app (mock-exam mode). The React component drives the
 * machine via the reducer; this file has no side-effects.
 */

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export interface TimerState {
  status: TimerStatus;
  /** Wall-clock timestamp the current run started (ms). */
  startedAt: number | null;
  /** Total elapsed time in milliseconds, NOT including the current run when running. */
  elapsedMs: number;
  /** Allocated time in milliseconds. 0 = no allocation, no auto-finish. */
  allocatedMs: number;
}

export type TimerAction =
  | { type: "init"; allocatedMs: number }
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "tick"; now: number }
  | { type: "reset" }
  | { type: "finish" };

export function initialTimerState(allocatedMs = 0): TimerState {
  return { status: "idle", startedAt: null, elapsedMs: 0, allocatedMs: Math.max(0, allocatedMs) };
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "init":
      return initialTimerState(action.allocatedMs);
    case "start":
      if (state.status === "running" || state.status === "finished") return state;
      return { ...state, status: "running", startedAt: action.now };
    case "pause":
      if (state.status !== "running") return state;
      return {
        ...state,
        status: "paused",
        elapsedMs: state.elapsedMs + (state.startedAt !== null ? action.now - state.startedAt : 0),
        startedAt: null,
      };
    case "resume":
      if (state.status !== "paused") return state;
      return { ...state, status: "running", startedAt: action.now };
    case "tick": {
      if (state.status !== "running" || state.startedAt === null) return state;
      const total = state.elapsedMs + (action.now - state.startedAt);
      if (state.allocatedMs > 0 && total >= state.allocatedMs) {
        return { ...state, status: "finished", elapsedMs: state.allocatedMs, startedAt: null };
      }
      return state;
    }
    case "reset":
      return initialTimerState(state.allocatedMs);
    case "finish":
      return {
        ...state,
        status: "finished",
        elapsedMs:
          state.status === "running" && state.startedAt !== null
            ? state.elapsedMs + (Date.now() - state.startedAt)
            : state.elapsedMs,
        startedAt: null,
      };
    default:
      return state;
  }
}

export function totalElapsed(state: TimerState, now: number): number {
  if (state.status === "running" && state.startedAt !== null) {
    return state.elapsedMs + (now - state.startedAt);
  }
  return state.elapsedMs;
}

export function remainingMs(state: TimerState, now: number): number {
  if (!state.allocatedMs) return Infinity;
  return Math.max(0, state.allocatedMs - totalElapsed(state, now));
}

export function isExpired(state: TimerState, now: number): boolean {
  return state.allocatedMs > 0 && totalElapsed(state, now) >= state.allocatedMs;
}
