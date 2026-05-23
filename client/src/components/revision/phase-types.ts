/**
 * phase-types.ts
 *
 * Shared prop contract for every phase component (Warmup, Lesson, Break,
 * Quiz, Stretch, Flashcards, Reflect). Keeps the Runner ⇄ Phase wiring
 * uniform: each phase receives the plan, the current phase config, the
 * accessibility styles, and a couple of callbacks to push partial results
 * back up so they're saved even if the timer expires before the pupil
 * "finishes".
 */
import type {
  RevisionPhase,
  RevisionSessionPlan,
  PhaseProgress,
} from "@/lib/revision-session-store";

export interface ActiveChild {
  id: string;
  name: string;
  yearGroup: string;
  sendNeeds: string[];
  preferredLanguage?: string;
  readingAgeOverride?: number | null;
}

export interface PhaseComponentProps {
  plan: RevisionSessionPlan;
  phase: RevisionPhase;
  phaseIndex: number;
  /** Stable id for the run — used by NotesPad etc. for per-session storage. */
  sessionId: string;
  child: ActiveChild;
  /** Accessibility styles inherited from the AccessibilityPanel. */
  fontSize: number;
  fontFamily: string;
  /** True when the runtime clock is currently paused. */
  paused: boolean;
  /** Seconds left in this phase (kept in sync by the runner). */
  remainingSec: number;
  /** Whether to play soft chimes on user actions (the runner manages phase
   *  boundaries, so phases only chime on their own internal events). */
  soundOn: boolean;
  /** Pupil-side aggregate of any wrong / skipped quiz answers so far, used
   *  by the Flashcards phase to seed its deck. */
  quizMistakes?: Array<{ question: string; correctAnswer: string }>;
  /** Notify the runner of partial results — saved to the in-progress run on
   *  every change so a tab close never loses work. */
  onResultUpdate: (patch: Partial<PhaseProgress>) => void;
  /** Pupil clicked "I'm ready" / "Next phase" / "I'm back early". */
  onAdvance: () => void;
}
