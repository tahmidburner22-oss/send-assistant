/**
 * PhaseSchedule — the "Now / Next / Then" strip rendered above every phase
 * during a live revision session.
 *
 * SEND rationale: visible visual schedules dramatically reduce uncertainty
 * for ASC, ADHD and PDA learners. Showing every phase in order, with a tick
 * on completed ones and a clear "you are here" indicator, lets the child
 * predict and prepare for what's coming next instead of being surprised.
 */
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import type { RevisionPhase } from "@/lib/revision-session-store";
import { formatMinutes } from "@/lib/revision-session-planner";
import { phaseIcon, phaseShortLabel } from "./phase-meta";

interface PhaseScheduleProps {
  phases: RevisionPhase[];
  currentIndex: number;
  /** Compact mode collapses tile labels — used inside narrow viewports. */
  compact?: boolean;
}

export default function PhaseSchedule({
  phases,
  currentIndex,
  compact = false,
}: PhaseScheduleProps) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
      aria-label="Session schedule"
    >
      {phases.map((phase, idx) => {
        const Icon = phaseIcon(phase.kind);
        const isCurrent = idx === currentIndex;
        const isDone = idx < currentIndex;
        const label = phaseShortLabel(phase);

        return (
          <motion.div
            key={`${phase.kind}-${idx}`}
            initial={false}
            animate={{ scale: isCurrent ? 1 : 0.98, opacity: isDone ? 0.85 : 1 }}
            transition={{ duration: 0.25 }}
            className={[
              "flex-shrink-0 flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5",
              isCurrent
                ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-500/20 shadow-sm"
                : isDone
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-border/60 bg-white",
            ].join(" ")}
          >
            <span
              className={[
                "flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center",
                isCurrent
                  ? "bg-indigo-600 text-white"
                  : isDone
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground",
              ].join(" ")}
            >
              {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
            </span>
            {!compact && (
              <div className="flex flex-col leading-tight">
                <span
                  className={`text-[11px] font-semibold ${
                    isCurrent
                      ? "text-indigo-800"
                      : isDone
                        ? "text-emerald-700"
                        : "text-foreground"
                  }`}
                >
                  {label}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  {formatMinutes(phase.durationSec)}
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
