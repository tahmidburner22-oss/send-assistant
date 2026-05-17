/**
 * ExitTicketEnhancementsPanel — surfaces 5 improvements alongside the
 * Exit Ticket output: digital QR, misconception bank, confidence row preview,
 * lesson-tag header, and bulk class-set composer.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { QrCode, Brain, Smile, Calendar, Users, Plus, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import {
  buildQrBlock,
  CONFIDENCE_ROW_HTML,
  buildLessonHeaderHtml,
  logMisconception,
  listMisconceptionsForTopic,
  buildBulkTicketBatch,
  pupilHeaderHtml,
  type ExitTicketChild,
  type ExitMisconception,
} from "@/lib/exit-ticket-enhancements";
import { callAI } from "@/lib/ai";

interface Props {
  values: Record<string, string>;
  ticketText: string;     // current generated ticket text (may be empty until first generation)
}

export default function ExitTicketEnhancementsPanel({ values, ticketText }: Props) {
  const { children } = useApp();
  const [tick, setTick] = useState(0);

  // ── 1. QR ────
  const [qrUrl, setQrUrl] = useState("");

  // ── 2. Misconception bank ────
  const topic = values.learningObjective || "";
  const items = useMemo(() => listMisconceptionsForTopic(topic), [topic, tick]);
  const [wrong, setWrong] = useState("");
  const [notes, setNotes] = useState("");

  function logNow() {
    if (!wrong.trim() || !topic.trim()) {
      toast.error("Need both a topic (learning objective) and a wrong answer.");
      return;
    }
    logMisconception({
      topic,
      subject: values.subject || "",
      yearGroup: values.yearGroup || "",
      wrongAnswer: wrong.trim(),
      notes: notes.trim() || undefined,
    });
    setWrong("");
    setNotes("");
    setTick((t) => t + 1);
    toast.success("Misconception logged — it will appear as a distractor next time you generate.");
  }

  // ── 3. Confidence row — preview only
  // ── 4. Lesson header
  const today = new Date().toISOString().slice(0, 10);
  const headerHtml = buildLessonHeaderHtml({
    date: today,
    subject: values.subject || "(subject)",
    yearGroup: values.yearGroup || "(year)",
    lessonTitle: values.learningObjective || "(LO)",
    period: undefined,
    teacherInitials: undefined,
  });

  // ── 5. Bulk
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkOutput, setBulkOutput] = useState<{ pupil: ExitTicketChild; level: string; html: string }[]>([]);

  useEffect(() => {
    setBulkOutput([]);
  }, [topic]);

  function togglePupil(id: string) {
    setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function runBulk() {
    if (selectedIds.length === 0) {
      toast.error("Select at least one pupil for the class set.");
      return;
    }
    if (!values.learningObjective) {
      toast.error("Generate a base ticket first so the bulk run knows the LO.");
      return;
    }
    setBulkLoading(true);
    try {
      const pupils: ExitTicketChild[] = selectedIds
        .map((id) => children.find((c) => c.id === id))
        .filter(Boolean)
        .map((c) => ({
          id: c!.id,
          name: c!.name,
          yearGroup: c!.yearGroup,
          // primaryNeed/level are best-effort — the user can refine
          primaryNeed: (c as { sendNeed?: string }).sendNeed || (c as { primaryNeed?: string }).primaryNeed,
        }));
      const batch = buildBulkTicketBatch({ baseValues: values, pupils });
      const out: { pupil: ExitTicketChild; level: string; html: string }[] = [];
      for (const item of batch) {
        const system = `You are a UK teacher writing a personalised exit ticket. Keep it under 5 minutes; assess the LO directly. Return plain markdown.`;
        const user = `Write an exit ticket for ${item.pupil.name} (${item.values.yearGroup}, ${item.values.subject}).
LO: ${item.values.learningObjective}
Level: ${item.level}${item.values.pupilNeed ? `\nPrimary need: ${item.values.pupilNeed}` : ""}

For SUPPORT level: simpler language, sentence stems, picture cues, max 3 questions.
For CORE level: standard, max 5 questions, mix literal + applied.
For EXTENSION level: open-ended, justify-your-answer, application of skill.

End with a teacher answer-key after this exact line: --- TEACHER ANSWER KEY ---`;
        const { text } = await callAI(system, user, 1200);
        const html = `${pupilHeaderHtml(item.pupil, item.level)}<pre style="white-space:pre-wrap;font-family:Arial;font-size:12px;padding:10px;">${escapeHtml(text)}</pre>`;
        out.push({ pupil: item.pupil, level: item.level, html });
      }
      setBulkOutput(out);
      toast.success(`Generated ${out.length} personalised tickets.`);
    } catch {
      toast.error("Bulk generation failed.");
    }
    setBulkLoading(false);
  }

  function printBulk() {
    if (bulkOutput.length === 0) return;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const body = bulkOutput
      .map((b) => `<div style="page-break-after: always; padding: 16mm;">${b.html}</div>`)
      .join("");
    w.document.write(`<!doctype html><html><head><title>Class set</title></head><body>${body}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
  }

  return (
    <Card className="border-fuchsia-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-fuchsia-600" />
          <p className="text-sm font-bold">Exit Ticket extras</p>
        </div>

        <Tabs defaultValue="qr">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="qr"><QrCode className="w-3.5 h-3.5 mr-1" />QR submit</TabsTrigger>
            <TabsTrigger value="bank"><Brain className="w-3.5 h-3.5 mr-1" />Misconception bank</TabsTrigger>
            <TabsTrigger value="conf"><Smile className="w-3.5 h-3.5 mr-1" />Confidence row</TabsTrigger>
            <TabsTrigger value="header"><Calendar className="w-3.5 h-3.5 mr-1" />Lesson header</TabsTrigger>
            <TabsTrigger value="bulk"><Users className="w-3.5 h-3.5 mr-1" />Class set</TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Embed a QR code that pupils scan to submit answers (or visit a class-collection link).
              Drop in any URL — Google Form, Microsoft Forms, your LMS quiz, etc.
            </p>
            <div className="flex gap-2">
              <Input
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                placeholder="https://forms.gle/example"
                className="text-xs h-8"
              />
            </div>
            {qrUrl && (
              <div
                className="rounded-md border bg-white p-2"
                dangerouslySetInnerHTML={{ __html: buildQrBlock(qrUrl) }}
              />
            )}
            <p className="text-[10px] text-muted-foreground italic">QR rendered via api.qrserver.com — internet required at print time.</p>
          </TabsContent>

          <TabsContent value="bank" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Log common wrong answers you've seen. Next time you generate a ticket on this LO, the
              top observed wrong answers are injected as distractors.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              <Input
                value={wrong}
                onChange={(e) => setWrong(e.target.value)}
                placeholder="Common wrong answer / misconception"
                className="text-xs"
              />
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="text-xs min-h-[36px]"
              />
            </div>
            <Button size="sm" onClick={logNow} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Log misconception
            </Button>
            {items.length > 0 && (
              <div className="rounded-md border bg-fuchsia-50 p-2 max-h-48 overflow-y-auto space-y-1">
                {items.slice(0, 8).map((m: ExitMisconception) => (
                  <div key={m.id} className="text-[11px] flex items-start gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{m.tally}×</Badge>
                    <span className="font-medium">"{m.wrongAnswer}"</span>
                    <span className="text-muted-foreground ml-1">— {m.lastSeen}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="conf" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              The 1-2-3 self-assessment scale is automatically appended to every printed ticket.
              Preview:
            </p>
            <div
              className="rounded-md border bg-white p-2"
              dangerouslySetInnerHTML={{ __html: CONFIDENCE_ROW_HTML }}
            />
          </TabsContent>

          <TabsContent value="header" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Tagged header is auto-stamped with today's date, subject and learning objective.
            </p>
            <div
              className="rounded-md border overflow-hidden"
              dangerouslySetInnerHTML={{ __html: headerHtml }}
            />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Pick the pupils who need a personalised version (one ticket each, level chosen by SEND tag).
            </p>
            {children.length === 0 ? (
              <p className="text-[11px] italic text-muted-foreground">Add pupils to your class first.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {children.map((c) => {
                    const sel = selectedIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => togglePupil(c.id)}
                        className={`px-2 py-1 rounded-md border text-[11px] ${sel ? "bg-fuchsia-600 border-fuchsia-600 text-white" : "bg-white border-slate-300 text-foreground hover:border-fuchsia-300"}`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={runBulk} disabled={bulkLoading || !ticketText} className="gap-1.5">
                    {bulkLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating {selectedIds.length}…</>
                      : <><Users className="w-3.5 h-3.5" />Generate {selectedIds.length || ""} class tickets</>}
                  </Button>
                  {bulkOutput.length > 0 && (
                    <Button size="sm" variant="outline" onClick={printBulk}>
                      Print all {bulkOutput.length}
                    </Button>
                  )}
                </div>
                {bulkOutput.length > 0 && (
                  <details className="text-[11px]">
                    <summary className="cursor-pointer text-fuchsia-700 font-semibold">Preview ({bulkOutput.length})</summary>
                    <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                      {bulkOutput.map((b) => (
                        <div
                          key={b.pupil.id}
                          className="rounded-md border bg-white"
                          dangerouslySetInnerHTML={{ __html: b.html }}
                        />
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
