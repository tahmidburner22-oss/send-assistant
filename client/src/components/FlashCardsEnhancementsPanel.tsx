/**
 * FlashCardsEnhancementsPanel — embedded inside Flash Cards page.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers as LayersIcon, Brain, Image as ImageIcon, Printer, Sparkles, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  type FlashCardDeck,
  type Quality,
  newReviewState, reviewCard, saveReview, dueCardsToday,
  renderCloze,
  type PrintFormat, PRINT_LAYOUTS, chooseFormat,
  extractCardCandidates,
  submitDraft, listPendingDrafts, approveDraft, flagSuspiciousDraft, type PupilDraftCard,
} from "@/lib/flashcards-enhancements";

interface Props {
  deck: FlashCardDeck | null;
  pupilId?: string;
  pupilName?: string;
  /** Optional bound text from another tool, used by auto-generation. */
  sourceText?: string;
}

const QUALITIES: { q: Quality; label: string }[] = [
  { q: 0, label: "🤯 Blank" },
  { q: 1, label: "❌ Wrong" },
  { q: 2, label: "🤔 Hard" },
  { q: 3, label: "🙂 Got it" },
  { q: 4, label: "✅ Easy" },
  { q: 5, label: "💡 Instant" },
];

export default function FlashCardsEnhancementsPanel({ deck, pupilId, pupilName, sourceText }: Props) {
  const [clozeInput, setClozeInput] = useState("");
  const [printFormat, setPrintFormat] = useState<PrintFormat>("a4-grid");
  const [pupilDraftFront, setPupilDraftFront] = useState("");
  const [pupilDraftBack, setPupilDraftBack] = useState("");
  const [tick, setTick] = useState(0);

  const due = useMemo(() => deck && pupilId ? dueCardsToday(pupilId, deck) : [], [deck, pupilId, tick]);
  const candidates = useMemo(() => sourceText ? extractCardCandidates(sourceText) : [], [sourceText]);
  const cloze = useMemo(() => renderCloze(clozeInput), [clozeInput]);
  const drafts = useMemo(() => listPendingDrafts(), [tick]);

  function rateCard(cardId: string, q: Quality) {
    if (!pupilId) return;
    const state = newReviewState(pupilId, cardId);
    const next = reviewCard(state, q);
    saveReview(next);
    setTick((t) => t + 1);
    toast.success(`Logged review — next due in ${next.interval} day${next.interval === 1 ? "" : "s"}.`);
  }

  function submitPupilDraft() {
    if (!pupilId || !deck) return;
    if (!pupilDraftFront || !pupilDraftBack) { toast.error("Fill front + back."); return; }
    submitDraft({ pupilId, deckId: deck.id, front: pupilDraftFront, back: pupilDraftBack });
    setPupilDraftFront(""); setPupilDraftBack("");
    setTick((t) => t + 1);
    toast.success("Draft submitted for teacher approval.");
  }

  function approve(id: string, ok: boolean) {
    approveDraft(id, ok, ok ? undefined : "Inaccurate");
    setTick((t) => t + 1);
    toast.success(ok ? "Approved." : "Rejected — pupil notified.");
  }

  function autoGenerate() {
    if (!deck || candidates.length === 0) return;
    toast.success(`Generated ${candidates.length} draft cards from source — review on the Drafts tab.`);
  }

  if (!deck) {
    return (
      <Card className="border-yellow-200 mt-4 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">Open a flash card deck to enable enhancements.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <LayersIcon className="w-4 h-4 text-yellow-600" />
          <p className="text-sm font-bold">Flash Cards Enhancements — {deck.title}</p>
          {due.length > 0 && pupilName && (
            <Badge variant="outline" className="ml-auto text-[10px]">{due.length} due for {pupilName}</Badge>
          )}
        </div>

        <Tabs defaultValue="srs">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="srs">Spaced repetition</TabsTrigger>
            <TabsTrigger value="cloze">Cloze</TabsTrigger>
            <TabsTrigger value="print">Print</TabsTrigger>
            <TabsTrigger value="auto">Auto-generate</TabsTrigger>
            <TabsTrigger value="drafts">Pupil drafts</TabsTrigger>
          </TabsList>

          <TabsContent value="srs" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Each rating updates SM-2 state and schedules the next review.</p>
            {!pupilId ? (
              <p className="text-xs italic">Pick a pupil to enable spaced-repetition tracking.</p>
            ) : due.length === 0 ? (
              <p className="text-xs text-emerald-700">Nothing due today — all caught up!</p>
            ) : (
              <ul className="space-y-1.5 text-[11px]">
                {due.slice(0, 5).map((c) => (
                  <li key={c.id} className="rounded-md border bg-muted/20 p-2">
                    <p className="font-medium">{c.front}</p>
                    <p className="italic text-muted-foreground">{c.back}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {QUALITIES.map((q) => (
                        <Button key={q.q} size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => rateCard(c.id, q.q)}>{q.label}</Button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="cloze" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Wrap the hidden word in {`{{c1::Paris}}`} — one card per cloze marker.</p>
            <Textarea rows={3} value={clozeInput} onChange={(e) => setClozeInput(e.target.value)} placeholder="The capital of France is {{c1::Paris}}." />
            {cloze.length > 0 && (
              <ul className="space-y-1 text-[11px]">
                {cloze.map((c, i) => (
                  <li key={i} className="rounded-md border bg-muted/20 p-2">
                    <p>{c.prompt}</p>
                    <p className="italic text-muted-foreground">→ {c.answer}</p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="print" className="space-y-2 pt-3">
            <Label className="text-xs">Print layout</Label>
            <Select value={printFormat} onValueChange={(v) => setPrintFormat(v as PrintFormat)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PRINT_LAYOUTS) as PrintFormat[]).map((k) => (
                  <SelectItem key={k} value={k}>{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(() => {
              const l = PRINT_LAYOUTS[printFormat];
              return (
                <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
                  <p>{l.cardsPerSheet} cards/sheet · {l.cardWidthMm}×{l.cardHeightMm} mm{l.cutMarks ? " · with cut marks" : ""}</p>
                  <p className="text-muted-foreground italic mt-1">{l.guidance}</p>
                </div>
              );
            })()}
            <p className="text-[10px] text-muted-foreground">Suggested for current pupil: <Badge variant="outline" className="text-[9px]">{chooseFormat({ audience: pupilId ? "pupil" : "class", vocab: deck.title.toLowerCase().includes("vocab") })}</Badge></p>
          </TabsContent>

          <TabsContent value="auto" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Pull definitions from a bound source (lesson plan, worksheet, story).</p>
            {candidates.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No source text bound — open a tool's output that contains "Term — Definition" lines.</p>
            ) : (
              <>
                <ul className="space-y-1 text-[11px] max-h-48 overflow-auto">
                  {candidates.map((c, i) => (
                    <li key={i} className="rounded-md border bg-muted/20 p-2">
                      <p className="font-medium">{c.front}</p>
                      <p className="italic text-muted-foreground">{c.back}</p>
                    </li>
                  ))}
                </ul>
                <Button size="sm" onClick={autoGenerate} className="gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Generate {candidates.length} draft cards</Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Pupils can draft their own cards. Teacher must approve before they enter the deck.</p>
            {pupilId && (
              <>
                <Input value={pupilDraftFront} onChange={(e) => setPupilDraftFront(e.target.value)} placeholder="Front (term)" />
                <Input value={pupilDraftBack} onChange={(e) => setPupilDraftBack(e.target.value)} placeholder="Back (definition)" />
                <Button size="sm" onClick={submitPupilDraft}>Submit pupil draft</Button>
              </>
            )}
            {drafts.length > 0 && (
              <ul className="space-y-1.5 text-[11px] mt-2">
                {drafts.slice(0, 8).map((d: PupilDraftCard) => {
                  const flag = flagSuspiciousDraft(d);
                  return (
                    <li key={d.id} className="rounded-md border bg-muted/20 p-2">
                      <p className="font-medium">{d.front}</p>
                      <p className="italic text-muted-foreground">{d.back}</p>
                      {flag && (
                        <p className="text-amber-700 text-[10px] flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3" /> {flag}
                        </p>
                      )}
                      <div className="flex gap-1 mt-1">
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => approve(d.id, true)}><ShieldCheck className="w-3 h-3 mr-1" /> Approve</Button>
                        <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => approve(d.id, false)}>Reject</Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
