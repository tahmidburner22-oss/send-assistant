/**
 * BreakPhase — a calm break screen with three or four activity options.
 *
 * The pupil picks an activity, which then renders the corresponding inner
 * view: a slow breathing circle, a stretch text card, a quiet screen, or a
 * "drink & walk" card. Reduced-motion users get a static breathing card
 * with text instructions instead of the animation.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Coffee, Footprints, Wind, type LucideIcon } from "lucide-react";
import PhaseHero from "../PhaseHero";
import { breakTypeLabel, formatClock } from "@/lib/revision-session-planner";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import type { PhaseComponentProps } from "../phase-types";
import type { BreakType } from "@/lib/revision-session-store";

interface BreakOption {
  id: BreakType;
  icon: LucideIcon;
  emoji: string;
  blurb: string;
}

const ALL_OPTIONS: Record<BreakType, BreakOption> = {
  breathing:    { id: "breathing",  icon: Wind,       emoji: "🌬️", blurb: "Slow breaths to settle." },
  stretch:      { id: "stretch",    icon: Footprints, emoji: "🤸",  blurb: "A few simple stretches." },
  quiet:        { id: "quiet",      icon: Coffee,     emoji: "🌳",  blurb: "Just sit quietly." },
  "drink-walk": { id: "drink-walk", icon: Coffee,     emoji: "🥤",  blurb: "Get a drink, take a walk." },
};

export default function BreakPhase({
  phase,
  remainingSec,
  fontSize,
  fontFamily,
  onAdvance,
}: PhaseComponentProps) {
  const reducedMotion = usePrefersReducedMotion();
  const menu: BreakType[] = phase.config?.breakMenu ?? ["breathing", "stretch", "quiet"];
  const options = menu.map((id) => ALL_OPTIONS[id]);

  const [picked, setPicked] = useState<BreakType | null>(null);

  return (
    <div className="space-y-4" style={{ fontSize, fontFamily }}>
      <PhaseHero
        kind="break"
        tone="rose"
        title={picked ? breakTypeLabel(picked) : "Brain break"}
        instruction={picked ? "I'll let you know when it's time to come back." : "Pick what feels good right now."}
        speakable={picked ? "Take a break. I'll let you know when it's time to come back." : "It's break time. Pick what feels good right now."}
        fontFamily={fontFamily}
      />

      {!picked ? (
        <div className={`grid gap-2 ${options.length >= 4 ? "grid-cols-2" : "grid-cols-3"}`}>
          {options.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                type="button"
                onClick={() => setPicked(opt.id)}
                className="flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50 hover:border-rose-300 transition-colors text-center shadow-sm"
              >
                <span className="text-3xl leading-none" aria-hidden>{opt.emoji}</span>
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-rose-800">
                  <Icon className="w-3.5 h-3.5" />
                  {breakTypeLabel(opt.id)}
                </span>
                <span className="text-[11px] text-muted-foreground leading-snug">{opt.blurb}</span>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <BreakActivity type={picked} remainingSec={remainingSec} reducedMotion={reducedMotion} />
      )}

      <div className="flex flex-col items-center gap-2 pt-2">
        {picked && (
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3 h-3" />
            Pick a different break
          </button>
        )}
        <button
          type="button"
          onClick={onAdvance}
          className="inline-flex items-center gap-2 px-5 h-10 rounded-2xl font-semibold text-sm text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
        >
          I'm back early
        </button>
      </div>
    </div>
  );
}

function BreakActivity({
  type,
  remainingSec,
  reducedMotion,
}: {
  type: BreakType;
  remainingSec: number;
  reducedMotion: boolean;
}) {
  if (type === "breathing") {
    return reducedMotion ? (
      <div className="rounded-3xl bg-rose-50 border border-rose-200 p-6 text-center space-y-2">
        <div className="text-3xl" aria-hidden>🌬️</div>
        <p className="text-sm font-semibold text-rose-900">Breathe in for 4 seconds.</p>
        <p className="text-sm text-rose-800">Hold for 1 second.</p>
        <p className="text-sm text-rose-800">Breathe out for 6 seconds.</p>
        <p className="text-xs text-rose-700/80 mt-2">{formatClock(remainingSec)} left</p>
      </div>
    ) : (
      <div className="relative rounded-3xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 p-6 flex flex-col items-center gap-3">
        <motion.div
          className="w-32 h-32 rounded-full bg-rose-300/70 shadow-inner"
          animate={{ scale: [0.7, 1, 0.7] }}
          transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
          aria-hidden
        />
        <p className="text-sm text-rose-900 text-center max-w-xs">
          Breathe in as the circle grows. Breathe out as it shrinks.
        </p>
        <p className="text-xs text-rose-700/80">{formatClock(remainingSec)} left</p>
      </div>
    );
  }

  if (type === "stretch") {
    return (
      <div className="rounded-3xl bg-rose-50 border border-rose-200 p-5 space-y-2 text-sm text-rose-900">
        <p className="font-semibold">A few simple stretches:</p>
        <ul className="space-y-1.5 list-decimal pl-5">
          <li>Roll your shoulders back, slowly, three times.</li>
          <li>Stretch your arms above your head and reach up.</li>
          <li>Tilt your head gently from side to side.</li>
          <li>Stand up if you can. Take a slow, deep breath.</li>
        </ul>
        <p className="text-xs text-rose-700/80 pt-1">{formatClock(remainingSec)} left</p>
      </div>
    );
  }

  if (type === "quiet") {
    return (
      <div className="rounded-3xl bg-rose-50/60 border border-rose-200 p-8 text-center space-y-2">
        <div className="text-4xl" aria-hidden>🌳</div>
        <p className="text-sm text-rose-900">Just sit quietly.</p>
        <p className="text-xs text-rose-700/80">No pressure to do anything.</p>
        <p className="text-xs text-rose-700/80 pt-2">{formatClock(remainingSec)} left</p>
      </div>
    );
  }

  // drink-walk
  return (
    <div className="rounded-3xl bg-rose-50 border border-rose-200 p-6 text-center space-y-2">
      <div className="text-4xl" aria-hidden>🥤</div>
      <p className="text-sm font-semibold text-rose-900">Take a walk and grab a drink.</p>
      <p className="text-xs text-rose-800">
        Look out the window for a moment. I'll be here when you get back.
      </p>
      <p className="text-xs text-rose-700/80 pt-2">{formatClock(remainingSec)} left</p>
    </div>
  );
}
