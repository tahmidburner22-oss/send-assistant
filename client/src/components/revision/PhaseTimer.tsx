/**
 * PhaseTimer — SEND-aware countdown for one phase of a revision session.
 *
 * Visual modes
 *  • Ring (default)   — SVG circle that drains from full to empty.
 *  • Bar              — horizontal progress bar; auto-selected when the user
 *                       (or OS) prefers reduced motion, or when the parent
 *                       toggled the "calm" timer style.
 *
 * Behaviour
 *  • Plays a single soft chime at 30s remaining (warning) and a two-note
 *    chime at 0s (phase complete) — only when `soundOn` is true.
 *  • Pause / +2 min / Skip buttons are owned by the parent (Runner) so the
 *    timer stays presentational; this component only requests them via
 *    callbacks.
 *  • All numbers are rounded server-side; we never display fractional seconds
 *    to keep the numerals legible at the configured font size.
 *
 * This component is deliberately presentational — it does not tick. The
 * Runner owns the clock so it can be persisted to localStorage and survive
 * a tab close.
 */
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Pause, Play, Plus, SkipForward } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { formatClock } from "@/lib/revision-session-planner";
import {
  playPhaseCompleteChime,
  playWarningChime,
} from "@/lib/revision-sound";

export type TimerStyle = "ring" | "bar";

interface PhaseTimerProps {
  /** Total duration of the current phase in seconds, including extensions. */
  totalSec: number;
  /** How many seconds of `totalSec` have elapsed. */
  elapsedSec: number;
  /** Whether the timer is paused. */
  paused: boolean;
  /** Whether the soft chime should play. */
  soundOn: boolean;
  /** Forced style override; otherwise auto-resolves. */
  style?: TimerStyle;
  /** Pupil-facing label that sits above the clock — e.g. "Listen & Learn". */
  label?: string;
  /** Hide the buttons (used on the wrap-up screen). */
  hideControls?: boolean;
  /** Hide the "+2 min" button on phases where extension makes no sense. */
  hideExtend?: boolean;
  /** Pause / resume the phase. */
  onTogglePause: () => void;
  /** Add 2 extra minutes to the current phase. */
  onExtend?: () => void;
  /** Skip the rest of the current phase. */
  onSkip?: () => void;
}

export default function PhaseTimer({
  totalSec,
  elapsedSec,
  paused,
  soundOn,
  style,
  label,
  hideControls = false,
  hideExtend = false,
  onTogglePause,
  onExtend,
  onSkip,
}: PhaseTimerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const resolvedStyle: TimerStyle = style ?? (reducedMotion ? "bar" : "ring");

  const remaining = Math.max(0, Math.round(totalSec - elapsedSec));
  const fraction = totalSec > 0 ? Math.max(0, Math.min(1, elapsedSec / totalSec)) : 0;

  // ── Chime triggers ──────────────────────────────────────────────────────
  // Track the last "remaining" we saw so we only chime on the crossing.
  const lastRemainingRef = useRef<number>(remaining);
  useEffect(() => {
    if (!soundOn || paused) {
      lastRemainingRef.current = remaining;
      return;
    }
    const prev = lastRemainingRef.current;
    if (prev > 30 && remaining <= 30 && remaining > 0) {
      playWarningChime();
    } else if (prev > 0 && remaining === 0) {
      playPhaseCompleteChime();
    }
    lastRemainingRef.current = remaining;
  }, [remaining, paused, soundOn]);

  return (
    <div className="flex flex-col items-center gap-3 select-none" aria-live="polite">
      {label && (
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      )}

      {resolvedStyle === "ring" ? (
        <Ring fraction={fraction} remaining={remaining} paused={paused} />
      ) : (
        <Bar fraction={fraction} remaining={remaining} paused={paused} />
      )}

      {!hideControls && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <TimerButton
            onClick={onTogglePause}
            label={paused ? "Resume" : "Pause"}
            tone="neutral"
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {paused ? "Resume" : "Pause"}
          </TimerButton>

          {onExtend && !hideExtend && (
            <TimerButton onClick={onExtend} label="Add 2 minutes" tone="positive">
              <Plus className="w-3.5 h-3.5" />
              +2 min
            </TimerButton>
          )}

          {onSkip && (
            <TimerButton onClick={onSkip} label="Skip to next phase" tone="neutral">
              <SkipForward className="w-3.5 h-3.5" />
              Skip
            </TimerButton>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Visual primitives ──────────────────────────────────────────────────────

const SIZE = 132;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function Ring({
  fraction,
  remaining,
  paused,
}: {
  fraction: number;
  remaining: number;
  paused: boolean;
}) {
  const dashOffset = CIRC * fraction;
  const isWarning = remaining <= 30 && remaining > 0;
  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="currentColor"
          strokeWidth={STROKE}
          fill="none"
          className="text-indigo-100"
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          className={isWarning ? "text-amber-500" : "text-indigo-600"}
          strokeDasharray={CIRC}
          initial={false}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`tabular-nums font-bold leading-none ${isWarning ? "text-amber-600" : "text-indigo-700"}`}
             style={{ fontSize: 28 }}>
          {formatClock(remaining)}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
          {paused ? "Paused" : remaining === 0 ? "Done" : "Remaining"}
        </div>
      </div>
    </div>
  );
}

function Bar({
  fraction,
  remaining,
  paused,
}: {
  fraction: number;
  remaining: number;
  paused: boolean;
}) {
  const isWarning = remaining <= 30 && remaining > 0;
  const pct = Math.max(0, Math.min(1, 1 - fraction)); // bar shows remaining
  return (
    <div className="w-full max-w-[260px] flex flex-col items-center gap-2">
      <div className={`tabular-nums font-bold leading-none ${isWarning ? "text-amber-600" : "text-indigo-700"}`}
           style={{ fontSize: 30 }}>
        {formatClock(remaining)}
      </div>
      <div className="w-full h-3 rounded-full bg-indigo-100 overflow-hidden">
        <div
          className={`h-full transition-[width] duration-500 ease-linear ${
            isWarning ? "bg-amber-500" : "bg-indigo-600"
          }`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {paused ? "Paused" : remaining === 0 ? "Done" : "Remaining"}
      </div>
    </div>
  );
}

function TimerButton({
  onClick,
  children,
  label,
  tone,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  tone: "neutral" | "positive";
}) {
  const tones: Record<typeof tone, string> = {
    neutral:
      "bg-white border border-border text-foreground hover:bg-muted",
    positive:
      "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 h-7 text-[11px] font-semibold transition-colors ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
