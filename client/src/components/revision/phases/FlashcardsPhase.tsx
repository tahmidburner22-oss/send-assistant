/**
 * FlashcardsPhase — "Lock it in".
 *
 * Builds a small deck (4–8 cards) by combining quiz mistakes with topic key
 * vocabulary, then walks the pupil through them one at a time. Tap to flip,
 * then rate "Forgot / Hard / Good / Easy". Ratings drive an SM-2 update
 * written to the same `adaptly_flashcards_sm2` localStorage key the
 * standalone Flash Cards tool uses, so the cards keep coming back in the
 * regular flashcards experience too.
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Loader2, RotateCcw, Volume2 } from "lucide-react";
import PhaseHero from "../PhaseHero";
import { buildFlashcardSeeds, generateLessonScript, type FlashCardSeed } from "@/lib/revision-content";
import {
  speakText,
  speechSupported,
  stopSpeaking,
  recordPupilProgress,
} from "@/lib/flashcards-v2-enhancements";
import type { PhaseComponentProps } from "../phase-types";

// ── SM-2 helpers (compatible with the existing FlashCards.tsx storage) ────

interface SM2Data {
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: number;
}
const SM2_KEY = "adaptly_flashcards_sm2";

function loadSm2(): Record<string, SM2Data> {
  try { return JSON.parse(localStorage.getItem(SM2_KEY) || "{}"); } catch { return {}; }
}
function saveSm2(data: Record<string, SM2Data>): void {
  try { localStorage.setItem(SM2_KEY, JSON.stringify(data)); } catch {}
}
function makeCardKey(subject: string, topic: string, front: string): string {
  return `${subject}|${topic}|${front}`.toLowerCase().trim();
}

function sm2Update(prev: SM2Data | undefined, quality: number): SM2Data {
  let { ease, interval, repetitions } = prev ?? { ease: 2.5, interval: 0, repetitions: 0, nextReview: 0 };
  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.max(1, Math.round(interval * ease));
    repetitions += 1;
  } else {
    interval = 1;
    repetitions = 0;
  }
  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;
  return { ease, interval, repetitions, nextReview: Date.now() + interval * 86400_000 };
}

// ── Component ──────────────────────────────────────────────────────────────

const QUALITY_BY_LABEL: Record<string, number> = {
  Forgot: 1,
  Hard:   2,
  Good:   4,
  Easy:   5,
};

export default function FlashcardsPhase({
  plan,
  child,
  fontSize,
  fontFamily,
  quizMistakes,
  onAdvance,
}: PhaseComponentProps) {
  const [seeds, setSeeds] = useState<FlashCardSeed[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rated, setRated] = useState<number>(0);
  const ttsAvailable = speechSupported();

  // Build the deck on mount: try to enrich with key terms from a fresh
  // lesson generation; if that fails we still have mistakes + bank vocab.
  useEffect(() => {
    let cancelled = false;

    const baseInput = {
      subjectId: plan.subject,
      subjectLabel: plan.subjectLabel,
      topic: plan.topic,
      yearGroup: plan.yearGroup,
      difficulty: plan.difficulty,
      readingAgeOverride: child.readingAgeOverride,
      sendNeeds: child.sendNeeds,
    };

    // Build a quick deck immediately (without lesson key terms) so the
    // pupil isn't blocked by an AI call.
    const quickDeck = buildFlashcardSeeds(baseInput, quizMistakes ?? [], []);
    setSeeds(quickDeck);

    // Then enrich in the background.
    generateLessonScript(baseInput)
      .then((script) => {
        if (cancelled) return;
        const enriched = buildFlashcardSeeds(
          baseInput,
          quizMistakes ?? [],
          script.keyTerms,
        );
        // Only swap if the enriched deck actually differs.
        if (
          enriched.length !== quickDeck.length ||
          enriched.some((c, i) => c.front !== quickDeck[i]?.front)
        ) {
          setSeeds(enriched);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [plan, child, quizMistakes]);

  const current = seeds?.[idx] ?? null;

  useEffect(() => () => { stopSpeaking(); }, []);

  const handleRate = (label: keyof typeof QUALITY_BY_LABEL) => {
    if (!current) return;
    const quality = QUALITY_BY_LABEL[label];

    // Persist SM-2.
    const all = loadSm2();
    const key = makeCardKey(plan.subject, plan.topic, current.front);
    all[key] = sm2Update(all[key], quality);
    saveSm2(all);

    // Class-progress fan-out (existing analytics).
    try {
      recordPupilProgress({
        pupilId: child.id,
        pupilName: child.name,
        cardKey: key,
        cardFront: current.front,
        ease: all[key].ease,
        attempts: (all[key].repetitions || 0) + 1,
        correctRate: quality >= 3 ? 1 : 0,
      });
    } catch {}

    setRated((n) => n + 1);

    // Move on.
    if (seeds && idx + 1 < seeds.length) {
      setIdx(idx + 1);
      setFlipped(false);
    } else {
      onAdvance();
    }
  };

  const speak = () => {
    if (!current || !ttsAvailable) return;
    speakText(flipped ? current.back : current.front, { rate: 0.9, lang: "en-GB" });
  };

  const total = seeds?.length ?? 0;

  return (
    <div className="space-y-4" style={{ fontSize, fontFamily }}>
      <PhaseHero
        kind="flashcards"
        tone="violet"
        title="Lock it in"
        instruction="Tap the card to flip. Rate how well you knew it — that's it!"
        speakable="Lock it in. Tap the card to flip and rate how well you knew it."
        fontFamily={fontFamily}
      />

      {!seeds && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Building your deck…
        </div>
      )}

      {seeds && current && (
        <>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              Card <span className="font-semibold text-foreground">{idx + 1}</span> of {total}
            </span>
            <span>{rated} rated</span>
          </div>
          <div className="h-1.5 rounded-full bg-violet-100 overflow-hidden">
            <div
              className="h-full bg-violet-600 transition-all"
              style={{ width: `${(idx / total) * 100}%` }}
            />
          </div>

          <div
            className="relative rounded-3xl border border-violet-200 bg-gradient-to-br from-white to-violet-50 shadow-sm cursor-pointer select-none"
            style={{ minHeight: 200, perspective: 1000 }}
            onClick={() => setFlipped((f) => !f)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") setFlipped((f) => !f); }}
            aria-label={flipped ? "Showing answer. Tap to see question." : "Showing question. Tap to flip."}
          >
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 py-8"
              animate={{ opacity: flipped ? 0 : 1 }}
              transition={{ duration: 0.18 }}
            >
              <span className="text-[11px] uppercase font-bold tracking-wider text-violet-700">
                Question
              </span>
              <p
                className="mt-2 font-semibold text-foreground leading-relaxed"
                style={{ fontSize: fontSize + 2, fontFamily }}
              >
                {current.front}
              </p>
              {current.hint && (
                <p className="mt-2 text-[11px] text-muted-foreground italic">{current.hint}</p>
              )}
              <p className="absolute bottom-3 text-[10px] text-violet-700/80 uppercase tracking-wider">
                Tap to flip
              </p>
            </motion.div>

            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 py-8"
              initial={false}
              animate={{ opacity: flipped ? 1 : 0 }}
              transition={{ duration: 0.18 }}
            >
              <span className="text-[11px] uppercase font-bold tracking-wider text-violet-700">
                Answer
              </span>
              <p
                className="mt-2 text-foreground leading-relaxed"
                style={{ fontSize: fontSize + 1, fontFamily }}
              >
                {current.back}
              </p>
              <p className="absolute bottom-3 text-[10px] text-violet-700/80 uppercase tracking-wider">
                Tap to flip back
              </p>
            </motion.div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-center gap-2">
            {ttsAvailable && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); speak(); }}
                className="inline-flex items-center gap-1 rounded-full px-2.5 h-7 text-[11px] font-semibold border border-border bg-white hover:bg-muted text-muted-foreground"
              >
                <Volume2 className="w-3 h-3" />
                Read
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFlipped((f) => !f); }}
              className="inline-flex items-center gap-1 rounded-full px-2.5 h-7 text-[11px] font-semibold border border-border bg-white hover:bg-muted text-muted-foreground"
            >
              <RotateCcw className="w-3 h-3" />
              Flip
            </button>
          </div>

          {/* Rating */}
          {flipped ? (
            <div className="grid grid-cols-4 gap-1.5">
              {(["Forgot", "Hard", "Good", "Easy"] as const).map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleRate(label)}
                  className={`h-11 rounded-2xl text-[12px] font-bold text-white shadow-sm transition-colors ${
                    [
                      "bg-rose-500 hover:bg-rose-600",
                      "bg-amber-500 hover:bg-amber-600",
                      "bg-emerald-500 hover:bg-emerald-600",
                      "bg-indigo-500 hover:bg-indigo-600",
                    ][i]
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-[11px] text-muted-foreground">
              Tap the card or "Flip" to see the answer.
            </p>
          )}
        </>
      )}

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={onAdvance}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          Skip the rest
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
