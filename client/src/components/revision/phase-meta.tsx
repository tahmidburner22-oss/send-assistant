/**
 * phase-meta.tsx
 *
 * Shared icon + short-label helpers so the schedule strip, the warm-up
 * "Now / Next / Then" cards and the per-phase headers all stay in sync.
 *
 * Kept TSX rather than TS because the icon helper returns a Lucide
 * component reference (so the consumer can render it as a JSX element).
 */
import {
  BookOpen,
  Coffee,
  GraduationCap,
  HelpCircle,
  Layers,
  Smile,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { RevisionPhase, RevisionPhaseKind } from "@/lib/revision-session-store";

export function phaseIcon(kind: RevisionPhaseKind): LucideIcon {
  switch (kind) {
    case "warmup":     return GraduationCap;
    case "lesson":     return BookOpen;
    case "break":      return Coffee;
    case "quiz":       return HelpCircle;
    case "stretch":    return Target;
    case "flashcards": return Layers;
    case "reflect":    return Smile;
  }
}

export function phaseShortLabel(phase: RevisionPhase): string {
  // Prefer the configured label, but fall back per kind.
  if (phase.label) return phase.label;
  switch (phase.kind) {
    case "warmup":     return "Warm-up";
    case "lesson":     return "Listen";
    case "break":      return "Break";
    case "quiz":       return "Quiz";
    case "stretch":    return "Stretch";
    case "flashcards": return "Flashcards";
    case "reflect":    return "Reflect";
  }
}

/** Pupil-friendly description used in Now / Next / Then warm-up cards. */
export function phaseLongBlurb(kind: RevisionPhaseKind): string {
  switch (kind) {
    case "warmup":     return "We'll look at the plan for today.";
    case "lesson":     return "Listen to the lesson and jot down notes.";
    case "break":      return "Rest your brain — pick what feels good.";
    case "quiz":       return "A few quick questions to check what stuck.";
    case "stretch":    return "Harder questions to push your thinking.";
    case "flashcards": return "Lock in what you learned with flashcards.";
    case "reflect":    return "Tell me how it felt — done!";
  }
}
