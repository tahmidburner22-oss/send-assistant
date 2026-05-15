/**
 * SharedWorksheet — public read-only view of a shared worksheet.
 * No authentication required. Teacher sections are excluded server-side.
 *
 * URL modes:
 *   /shared/:token            — standard student worksheet view (default)
 *   /shared/:token?mode=pupil — pupil-companion view (read-aloud, hint ladder)
 *
 * Pupil mode never calls an LLM at runtime: hints are pre-baked into
 * worksheet.metadata.hintLadders at generation time. This makes the
 * experience safeguarding-clean and offline-resilient.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WorksheetRenderer from "@/components/WorksheetRenderer";
import { GraduationCap, Loader2, AlertCircle, ExternalLink, Lightbulb, Volume2, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, Star } from "lucide-react";
import { pairQuestionsWithHints, type HintLadderEntry } from "@/lib/hint-ladder";

// ─────────────────────────────────────────────────────────────────────────────
// Pupil mode — hint ladder + read-aloud, no live AI
// ─────────────────────────────────────────────────────────────────────────────

interface PupilSection {
  title?: string;
  type?: string;
  content?: string;
  teacherOnly?: boolean;
}

function speak(text: string) {
  if (typeof window === "undefined") return;
  const synth = (window as any).speechSynthesis;
  if (!synth || !text) return;
  try {
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-GB";
    utter.rate = 0.95;
    synth.speak(utter);
  } catch {
    // Best-effort: ignore.
  }
}

function PupilCompanionView({
  worksheet,
  sections,
  hintLadders,
}: {
  worksheet: any;
  sections: PupilSection[];
  hintLadders: HintLadderEntry[] | undefined;
}) {
  const paired = useMemo(
    () => pairQuestionsWithHints(sections, hintLadders),
    [sections, hintLadders],
  );

  const [index, setIndex] = useState(0);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  // Reset hints when navigating to a new question
  useEffect(() => {
    setHintsRevealed(0);
  }, [index]);

  if (paired.length === 0) {
    // No questions detected — fall back to standard student view inside pupil mode.
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Pupil mode isn't available for this worksheet yet.</p>
          <p className="text-xs mt-1">It hasn't been published with a hint ladder. Showing the standard view below.</p>
        </div>
        <WorksheetRenderer
          worksheet={{
            title: worksheet.title,
            subtitle: worksheet.subtitle,
            sections: worksheet.sections,
            metadata: worksheet.metadata,
            isAI: true,
          }}
          viewMode="student"
          textSize={16}
          overlayColor="#ffffff"
          editMode={false}
          editedSections={{}}
        />
      </div>
    );
  }

  const q = paired[index];
  const total = paired.length;
  const progress = (doneIds.size / total) * 100;
  const isDone = doneIds.has(q.questionId);
  const hasHints = !!q.hints;

  return (
    <div className="space-y-5">
      {/* Pupil-mode banner + sticker streak */}
      <div className="rounded-xl bg-gradient-to-r from-brand-light to-brand/10 border border-brand/30 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-brand font-semibold uppercase tracking-wide">Pupil mode</p>
          <p className="text-sm text-foreground/80">{worksheet.title}</p>
        </div>
        <div className="flex items-center gap-1.5 text-amber-500" aria-label={`${doneIds.size} of ${total} done`}>
          {Array.from({ length: Math.min(5, doneIds.size) }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-current" />
          ))}
          <span className="text-xs font-bold text-foreground ml-1">
            {doneIds.size}/{total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-brand transition-all duration-500"
          style={{ width: `${progress}%` }}
          aria-label={`${Math.round(progress)}% complete`}
        />
      </div>

      {/* Question card */}
      <Card className="border-2 border-brand/20">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Question {index + 1} of {total}
            </p>
            <span className="text-[10px] text-muted-foreground">{q.sectionTitle}</span>
          </div>

          <p className="text-base leading-relaxed text-foreground">{q.text}</p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => speak(q.text)}
              aria-label="Read question aloud"
            >
              <Volume2 className="w-3.5 h-3.5" /> Read aloud
            </Button>
            {hasHints && hintsRevealed < 3 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => setHintsRevealed(n => Math.min(3, n + 1))}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                {hintsRevealed === 0 ? "Show a clue" : `Clue ${hintsRevealed + 1} of 3`}
              </Button>
            )}
            {hintsRevealed > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setHintsRevealed(0)}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Hide clues
              </Button>
            )}
          </div>

          {/* Hint stack */}
          {hasHints && hintsRevealed > 0 && (
            <ul className="space-y-2 pt-2">
              {q.hints!.slice(0, hintsRevealed).map((h, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase">
                      Clue {i + 1}
                    </span>
                    <p className="text-foreground/90">{h}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!hasHints && (
            <p className="text-xs text-muted-foreground italic">
              No clues for this one — give it a try and ask your teacher if you're stuck.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </Button>

        <Button
          size="sm"
          className={`gap-1.5 ${isDone ? "bg-emerald-600 hover:bg-emerald-700" : "bg-brand hover:bg-brand/90"} text-white`}
          onClick={() => {
            setDoneIds(prev => {
              const next = new Set(prev);
              if (next.has(q.questionId)) next.delete(q.questionId);
              else next.add(q.questionId);
              return next;
            });
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isDone ? "Marked done" : "Mark as done"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setIndex(i => Math.min(total - 1, i + 1))}
          disabled={index === total - 1}
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Finished celebration */}
      {doneIds.size === total && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4 text-center"
        >
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-emerald-900">Brilliant — you've finished!</p>
          <p className="text-xs text-emerald-700 mt-1">Show your teacher when you're ready.</p>
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public shell
// ─────────────────────────────────────────────────────────────────────────────

export default function SharedWorksheet() {
  const [location] = useLocation();
  const tokenAndQuery = location.split("/shared/")[1] || "";
  const [tokenPart] = tokenAndQuery.split("?");
  const token = tokenPart?.split("/")[0];

  // Read mode from window.location.search (wouter doesn't surface it via useLocation).
  const isPupilMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("mode") === "pupil";
    } catch { return false; }
  }, []);

  const [loading, setLoading] = useState(true);
  const [worksheet, setWorksheet] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setError("Invalid link."); setLoading(false); return; }
    fetch(`/api/data/shared/${token}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error || "Not found"); }))
      .then(data => { setWorksheet(data); setLoading(false); })
      .catch(err => { setError(err.message || "Worksheet not found."); setLoading(false); });
  }, [token]);

  const hintLadders: HintLadderEntry[] | undefined = worksheet?.metadata?.hintLadders;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-brand" />
            </div>
            <span className="text-sm font-semibold text-foreground">Adaptly</span>
            {isPupilMode && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold uppercase">
                Pupil mode
              </span>
            )}
          </div>
          <a
            href="/"
            className="text-xs text-brand hover:underline flex items-center gap-1"
          >
            Create your own <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
          </div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-red-200">
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h2 className="font-semibold text-foreground mb-1">Worksheet not found</h2>
                <p className="text-sm text-muted-foreground">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">This link may have been revoked or may be invalid.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {worksheet && !loading && !isPupilMode && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Worksheet header */}
            <div className="mb-4 space-y-1">
              <h1 className="text-xl font-bold text-foreground">{worksheet.title}</h1>
              <p className="text-sm text-muted-foreground">
                {[worksheet.subject, worksheet.yearGroup, worksheet.difficulty]
                  .filter(Boolean).join(" · ")}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                <span className="px-2 py-0.5 rounded-full bg-brand-light text-brand font-medium">Shared via Adaptly</span>
                <span>Student view — teacher notes hidden</span>
              </div>
            </div>

            {/* Render the worksheet */}
            <WorksheetRenderer
              worksheet={{
                title: worksheet.title,
                subtitle: worksheet.subtitle,
                sections: worksheet.sections,
                metadata: worksheet.metadata,
                isAI: true,
              }}
              viewMode="student"
              textSize={14}
              overlayColor="#ffffff"
              editMode={false}
              editedSections={{}}
            />

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
              <p>Created with <strong className="text-brand">Adaptly</strong> · Professional teaching resources</p>
              <a href="/" className="text-brand hover:underline">adaptly.co.uk — Try it free</a>
            </div>
          </motion.div>
        )}

        {worksheet && !loading && isPupilMode && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <PupilCompanionView
              worksheet={worksheet}
              sections={worksheet.sections || []}
              hintLadders={hintLadders}
            />
            <div className="mt-8 text-center text-xs text-muted-foreground">
              <a href={`/shared/${token}`} className="text-brand hover:underline">
                Switch to standard view
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
