/**
 * WarmupPhase — the "Now / Next / Then" opener every revision session
 * begins with. Reduces uncertainty for SEND learners by previewing the
 * first three phases of the session and listing the tools / materials
 * the pupil should grab before they start.
 */
import { motion } from "framer-motion";
import { Backpack, Sparkles } from "lucide-react";
import PhaseHero from "../PhaseHero";
import { phaseIcon, phaseLongBlurb, phaseShortLabel } from "../phase-meta";
import { formatMinutes } from "@/lib/revision-session-planner";
import { materialsForSession } from "@/lib/revision-content";
import type { PhaseComponentProps } from "../phase-types";

export default function WarmupPhase({
  plan,
  child,
  fontSize,
  fontFamily,
  onAdvance,
}: PhaseComponentProps) {
  // The next 3 phases after warmup form the Now / Next / Then preview.
  const upcoming = plan.phases.slice(1, 4);
  const labels = ["Now", "Next", "Then"];

  // Materials/tools the pupil should grab before starting.
  const materials = materialsForSession(plan);

  const speakable =
    `Hi ${child.name}! Today we'll revise ${plan.topic} in ${plan.subjectLabel}. ` +
    `Before we start, grab: ${materials.map((m) => m.label).join(", ")}. ` +
    upcoming
      .map((p, i) => `${labels[i]}: ${phaseShortLabel(p)} for ${formatMinutes(p.durationSec)}.`)
      .join(" ") +
    " When you're ready, press 'I'm ready' to begin.";

  return (
    <div className="space-y-4" style={{ fontSize, fontFamily }}>
      <PhaseHero
        kind="warmup"
        tone="indigo"
        title={`Hi ${child.name}! Here's what we'll do today`}
        instruction={`Today's topic: ${plan.topic} (${plan.subjectLabel}).`}
        subInstruction="Grab your things, then we'll preview the session before we start."
        speakable={speakable}
        fontFamily={fontFamily}
      />

      {/* What you'll need ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
            <Backpack className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            What you'll need
          </p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
          {materials.map((m, i) => (
            <motion.li
              key={`${m.label}-${i}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-2 rounded-xl bg-white border border-amber-100 px-2.5 py-1.5"
            >
              <span className="text-base leading-none flex-shrink-0" aria-hidden>
                {m.icon}
              </span>
              <span className="text-[12px] text-foreground leading-snug" style={{ fontFamily }}>
                {m.label}
              </span>
            </motion.li>
          ))}
        </ul>
        <p className="text-[11px] text-amber-800/80 mt-2 leading-snug">
          Take a minute to grab everything before we begin. It saves stopping mid-lesson.
        </p>
      </div>

      {/* Now / Next / Then cards ─────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 px-1 mb-2">
          The plan
        </p>
        <div className="grid grid-cols-3 gap-2">
          {upcoming.map((p, idx) => {
            const Icon = phaseIcon(p.kind);
            return (
              <motion.div
                key={`${p.kind}-${idx}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.25 }}
                className="rounded-2xl border border-indigo-200 bg-white shadow-sm p-3 flex flex-col items-center text-center"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {labels[idx] ?? "Then"}
                </span>
                <div className="mt-2 w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="mt-2 text-[11px] font-semibold text-foreground leading-tight">
                  {phaseShortLabel(p)}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {formatMinutes(p.durationSec)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
                  {phaseLongBlurb(p.kind)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Continuing-after preview */}
      {plan.phases.length > 4 && (
        <div className="rounded-2xl border border-border/50 bg-white p-3 text-xs text-muted-foreground text-center leading-relaxed">
          After that we'll have a longer break, then some harder questions,
          then flashcards, then a quick check-in about how it felt.
        </div>
      )}

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={onAdvance}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-2xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-emerald-800 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          I've got everything — let's start
        </button>
      </div>
    </div>
  );
}
