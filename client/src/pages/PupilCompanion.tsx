/**
 * PupilCompanion — `/share/companion/:token`
 *
 * Public, token-protected, pupil-facing read-only view of a single
 * worksheet. Each question has a 3-step hint ladder (nudge → strategy →
 * worked example). Pupils click "Show next hint" to escalate, so they
 * scaffold themselves rather than being given the answer in one click.
 *
 * Design constraints (Phase 4 / FEAT-005):
 *  - No login required (token-gated). The token resolves a redacted
 *    record from localStorage on the issuing teacher's device.
 *  - Mobile-first — pupils will scan a printed QR and open this on a
 *    phone or shared device.
 *  - No teacher notes, no answer keys, no PII.
 *  - Reveal state is per-question and persisted to sessionStorage so a
 *    refresh doesn't lose the pupil's place.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Lightbulb, BookOpen, Compass, Sparkles, Lock } from "lucide-react";
import { readCompanionShare, type CompanionShareRecord, type CompanionQuestion } from "@/lib/companion-share";

const REVEAL_KEY_PREFIX = "adaptly_companion_reveal_";

export default function PupilCompanion() {
  const { token } = useParams<{ token: string }>();
  const [record, setRecord] = useState<CompanionShareRecord | null | undefined>(undefined);

  useEffect(() => {
    if (!token) {
      setRecord(null);
      return;
    }
    setRecord(readCompanionShare(token));
  }, [token]);

  if (record === undefined) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Loading…</div>;
  }

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-emerald-50 to-white">
        <Card className="max-w-sm">
          <CardContent className="p-6 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-sm font-bold">Worksheet link expired or invalid</p>
            <p className="text-xs text-muted-foreground">
              Ask your teacher to print a fresh QR code or share a new link.
            </p>
            <Link href="/login">
              <span className="text-xs text-brand underline">Back to Adaptly</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <CompanionView record={record} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// View
// ─────────────────────────────────────────────────────────────────────────────

function CompanionView({ record }: { record: CompanionShareRecord }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-16">
      <header className="bg-emerald-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-5 sm:py-6">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-90">
            Pupil companion
          </p>
          <h1 className="text-xl sm:text-2xl font-black leading-tight mt-1">
            {record.title}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2 text-[11px] sm:text-xs">
            {record.yearGroup && (
              <span className="px-2 py-0.5 rounded-full bg-white/15">{record.yearGroup}</span>
            )}
            {record.subject && (
              <span className="px-2 py-0.5 rounded-full bg-white/15">{record.subject}</span>
            )}
            {record.topic && (
              <span className="px-2 py-0.5 rounded-full bg-white/15">{record.topic}</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 sm:pt-6 space-y-3 sm:space-y-4">
        {record.encouragement && (
          <Card className="border-emerald-200">
            <CardContent className="p-3 sm:p-4 flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base text-foreground/90">{record.encouragement}</p>
            </CardContent>
          </Card>
        )}

        {/* "How to use" panel — reduces teacher hand-holding overhead */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-3 sm:p-4 text-sm">
            <div className="font-semibold mb-1 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-600" />
              How to use this
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-foreground/80 text-[13px] sm:text-sm">
              <li>Read the question carefully and try it on your own first.</li>
              <li>Stuck? Tap <strong>Show next hint</strong> for a small clue.</li>
              <li>Still stuck? Reveal the next two hints in order. Don't skip.</li>
              <li>Write your final answer on your worksheet — not here.</li>
            </ol>
          </CardContent>
        </Card>

        {record.questions.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              No questions in this companion. Ask your teacher for a new link.
            </CardContent>
          </Card>
        ) : (
          record.questions.map((q, idx) => (
            <QuestionCard key={q.questionId} q={q} index={idx + 1} token={record.token} />
          ))
        )}

        <p className="text-[10px] text-center text-muted-foreground pt-4 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          Read-only · no teacher notes · no answer key.
        </p>
      </main>
    </div>
  );
}

function QuestionCard({
  q,
  index,
  token,
}: {
  q: CompanionQuestion;
  index: number;
  token: string;
}) {
  const storageKey = useMemo(() => `${REVEAL_KEY_PREFIX}${token}_${q.questionId}`, [token, q.questionId]);
  const [revealed, setRevealed] = useState<number>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      const parsed = raw ? parseInt(raw, 10) : 0;
      return isFinite(parsed) ? Math.max(0, Math.min(3, parsed)) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, String(revealed));
    } catch {
      /* private mode */
    }
  }, [storageKey, revealed]);

  const hints = q.hints || [];
  const hintLabels: [string, string, string] = ["Nudge", "Strategy", "Worked example"];

  return (
    <Card>
      <CardContent className="p-3 sm:p-4 space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-full bg-emerald-600 text-white text-xs font-bold px-2">
            Q{index}
          </span>
          <p className="text-xs text-muted-foreground font-medium">{q.sectionTitle}</p>
        </div>
        <p className="text-[15px] sm:text-base whitespace-pre-wrap leading-relaxed">{q.question}</p>

        {hints.length === 3 && (
          <div className="space-y-2 pt-1">
            {[0, 1, 2].map((i) =>
              i < revealed ? (
                <div
                  key={i}
                  className={`rounded-lg p-3 text-sm border ${
                    i === 0
                      ? "bg-amber-50 border-amber-200"
                      : i === 1
                      ? "bg-orange-50 border-orange-200"
                      : "bg-rose-50 border-rose-200"
                  }`}
                >
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${
                      i === 0
                        ? "text-amber-700"
                        : i === 1
                        ? "text-orange-700"
                        : "text-rose-700"
                    }`}
                  >
                    {i === 0 ? <Lightbulb className="w-3 h-3" /> : i === 1 ? <Compass className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                    Hint {i + 1} · {hintLabels[i]}
                  </div>
                  <p>{hints[i]}</p>
                </div>
              ) : null,
            )}

            {revealed < 3 ? (
              <button
                type="button"
                onClick={() => setRevealed((r) => Math.min(3, r + 1))}
                className="w-full rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 font-semibold py-3 text-sm transition-colors"
              >
                Show next hint ({revealed + 1}/3)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRevealed(0)}
                className="text-[11px] text-muted-foreground underline hover:text-foreground"
              >
                Reset hints
              </button>
            )}
          </div>
        )}

        {hints.length === 0 && (
          <p className="text-[12px] italic text-muted-foreground">
            (No hints provided for this question yet — work through it carefully and ask your teacher if you're stuck.)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
