/**
 * PhaseHero — shared heading block for every phase: a coloured chip with
 * the phase icon, a title, an instruction line, and an optional "🔊 Read"
 * button that reads the heading aloud (Web Speech).
 *
 * Keeps the visual language consistent across the seven phases.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { speakText, speechSupported, stopSpeaking } from "@/lib/flashcards-v2-enhancements";
import { phaseIcon } from "./phase-meta";
import type { RevisionPhaseKind } from "@/lib/revision-session-store";

type Tone = "indigo" | "rose" | "amber" | "emerald" | "violet";

interface PhaseHeroProps {
  kind: RevisionPhaseKind;
  title: string;
  /** One-line instruction shown under the title. */
  instruction?: string;
  /** Optional secondary line shown smaller. */
  subInstruction?: string;
  tone?: Tone;
  /** What the read-aloud button speaks (defaults to title + instruction). */
  speakable?: string;
  fontFamily?: string;
}

const TONES: Record<Tone, { gradFrom: string; gradTo: string; chipBg: string; ring: string; titleColor: string }> = {
  indigo:  { gradFrom: "from-indigo-50",  gradTo: "to-violet-50",  chipBg: "bg-indigo-600",  ring: "ring-indigo-500/20",  titleColor: "text-indigo-900" },
  rose:    { gradFrom: "from-rose-50",    gradTo: "to-pink-50",    chipBg: "bg-rose-500",    ring: "ring-rose-500/20",    titleColor: "text-rose-900" },
  amber:   { gradFrom: "from-amber-50",   gradTo: "to-orange-50",  chipBg: "bg-amber-500",   ring: "ring-amber-500/20",   titleColor: "text-amber-900" },
  emerald: { gradFrom: "from-emerald-50", gradTo: "to-teal-50",    chipBg: "bg-emerald-600", ring: "ring-emerald-500/20", titleColor: "text-emerald-900" },
  violet:  { gradFrom: "from-violet-50",  gradTo: "to-fuchsia-50", chipBg: "bg-violet-600",  ring: "ring-violet-500/20",  titleColor: "text-violet-900" },
};

export default function PhaseHero({
  kind,
  title,
  instruction,
  subInstruction,
  tone = "indigo",
  speakable,
  fontFamily,
}: PhaseHeroProps) {
  const Icon = phaseIcon(kind);
  const t = TONES[tone];
  const [speaking, setSpeaking] = useState(false);
  const ttsAvailable = speechSupported();

  const handleSpeak = () => {
    if (!ttsAvailable) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const text = speakable ?? `${title}. ${instruction ?? ""}`;
    if (!text.trim()) return;
    speakText(text, { rate: 0.9, lang: "en-GB" });
    setSpeaking(true);
    const ms = Math.min(text.length * 70, 30_000) + 600;
    window.setTimeout(() => setSpeaking(false), ms);
  };

  // Stop speech if hero unmounts mid-utterance (e.g. phase advances).
  useEffect(() => () => { stopSpeaking(); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.gradFrom} ${t.gradTo} border border-border/40 px-4 py-4`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${t.chipBg} text-white flex items-center justify-center shadow-sm ring-4 ring-white`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-bold leading-tight ${t.titleColor}`} style={{ fontFamily }}>
            {title}
          </h3>
          {instruction && (
            <p className="text-sm text-foreground/80 mt-0.5" style={{ fontFamily }}>
              {instruction}
            </p>
          )}
          {subInstruction && (
            <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily }}>
              {subInstruction}
            </p>
          )}
        </div>
        {ttsAvailable && (
          <button
            type="button"
            onClick={handleSpeak}
            aria-label={speaking ? "Stop reading" : "Read aloud"}
            className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 h-7 text-[11px] font-semibold border transition-colors ${
              speaking
                ? `${t.chipBg} text-white border-transparent`
                : "bg-white text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            {speaking ? "Stop" : "Read"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
