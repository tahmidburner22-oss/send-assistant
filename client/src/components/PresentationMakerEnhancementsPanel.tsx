/**
 * PresentationMakerEnhancementsPanel — surfaces 5 v2 improvements:
 *   1. Speaker notes view (presenter cue cards, A4 print)
 *   2. Slide-level regenerate (lib builds prompt; this panel calls callAI)
 *   3. Image library reuse (Pexels / Unsplash / Openverse / Wikimedia)
 *   4. Pupil-pace toggle (slow / standard / brisk → adjusted timings)
 *   5. Google Slides export (outline + slides.new launcher)
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  StickyNote, Wand2, Image as ImageIcon, Gauge, ExternalLink, Printer, Copy,
  Loader2, RefreshCw, ArrowDown,
} from "lucide-react";
import { callAI } from "@/lib/ai";
import {
  buildPresenterCards, presenterCardsHtml,
  buildSlideRegenPrompt,
  suggestImages, IMAGE_SOURCE_LABEL, IMAGE_SOURCE_LICENSE, type ImageSuggestion,
  applyPace, PACE_LABEL, type PaceProfile,
  buildSlidesExport, slidesImportInstructions,
  type DeckLite, type SlideLite,
} from "@/lib/presentation-maker-enhancements";

interface Props {
  deck: DeckLite;
  activeSlideIndex: number;
  onSlideRegenerated?: (slideIndex: number, slide: SlideLite) => void;
  onApplyPace?: (newDeck: DeckLite) => void;
}

function openPrint(html: string, title: string): void {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) {
    toast.error("Pop-up blocked — allow pop-ups to print.");
    return;
  }
  w.document.write(`<!doctype html><html><head><title>${title}</title></head><body>${html}<script>window.print();<\/script></body></html>`);
  w.document.close();
}

async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}`);
  } catch {
    toast.error("Copy failed");
  }
}

export default function PresentationMakerEnhancementsPanel({
  deck, activeSlideIndex, onSlideRegenerated, onApplyPace,
}: Props) {
  const cards = useMemo(() => buildPresenterCards(deck), [deck]);

  // Slide regen
  const [regenInstruction, setRegenInstruction] = useState("Make this more visual and add a clearer worked example.");
  const [regenLoading, setRegenLoading] = useState(false);

  async function handleSlideRegen() {
    if (!deck.slides[activeSlideIndex]) {
      toast.error("Pick a slide first.");
      return;
    }
    if (!regenInstruction.trim()) {
      toast.error("Add an instruction first.");
      return;
    }
    setRegenLoading(true);
    try {
      const { system, user, maxTokens } = buildSlideRegenPrompt({
        deck, slideIndex: activeSlideIndex, instruction: regenInstruction.trim(),
      });
      const { text } = await callAI(system, user, maxTokens);
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      const json = JSON.parse(match ? match[0] : cleaned);
      if (!json || !json.title) {
        toast.error("AI returned an unexpected shape — try a different instruction.");
      } else if (onSlideRegenerated) {
        onSlideRegenerated(activeSlideIndex, json as SlideLite);
        toast.success(`Slide ${activeSlideIndex + 1} regenerated.`);
      } else {
        toast("Regenerated, but the page didn't accept the update.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Regenerate failed.");
    } finally {
      setRegenLoading(false);
    }
  }

  // Image library
  const activeSlide = deck.slides[activeSlideIndex];
  const [imgQuery, setImgQuery] = useState<string>(activeSlide?.image_prompt || activeSlide?.title || "");
  const imgSuggestions: ImageSuggestion[] = useMemo(() => suggestImages(imgQuery, 6), [imgQuery]);

  // Pace
  const [pace, setPace] = useState<PaceProfile>("standard");
  const paceTransform = useMemo(() => applyPace(deck, pace), [deck, pace]);

  // Google Slides export
  const slidesPayload = useMemo(() => buildSlidesExport(deck), [deck]);

  return (
    <Card className="border-indigo-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-indigo-600" />
          <p className="text-sm font-bold">Presentation extras — {deck.slides.length} slide(s)</p>
        </div>

        <Tabs defaultValue="notes">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="notes"><StickyNote className="w-3.5 h-3.5 mr-1" />Speaker notes</TabsTrigger>
            <TabsTrigger value="regen"><RefreshCw className="w-3.5 h-3.5 mr-1" />Regenerate slide</TabsTrigger>
            <TabsTrigger value="images"><ImageIcon className="w-3.5 h-3.5 mr-1" />Images</TabsTrigger>
            <TabsTrigger value="pace"><Gauge className="w-3.5 h-3.5 mr-1" />Pupil pace</TabsTrigger>
            <TabsTrigger value="slides"><ExternalLink className="w-3.5 h-3.5 mr-1" />Google Slides</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              One A4 cue card per slide — title, type, timing chip, presenter cue line, expanded speaker notes.
              Print before the lesson; flip through as you teach.
            </p>
            <div className="rounded-md border bg-white max-h-72 overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-indigo-50 sticky top-0">
                  <tr>
                    <th className="text-left p-1.5 w-12">#</th>
                    <th className="text-left p-1.5">Slide</th>
                    <th className="text-left p-1.5 w-16">Mins</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c) => (
                    <tr key={c.index} className="border-t border-slate-100 align-top">
                      <td className="p-1.5 text-slate-400">{c.index}</td>
                      <td className="p-1.5">
                        <div className="font-semibold text-indigo-800">{c.title}</div>
                        <div className="text-[10px] text-slate-500">{c.type} · "{c.cueLine}"</div>
                      </td>
                      <td className="p-1.5 text-slate-600 font-mono">{c.timingMinutes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button size="sm" variant="outline" onClick={() => openPrint(presenterCardsHtml(deck, cards), `${deck.title} — cue cards`)} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print A4 cue cards
            </Button>
          </TabsContent>

          <TabsContent value="regen" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Regenerate just the active slide (currently <strong>#{activeSlideIndex + 1}: {deck.slides[activeSlideIndex]?.title || "(none)"}</strong>) with a focused instruction.
              The rest of the deck is preserved.
            </p>
            <Textarea
              value={regenInstruction}
              onChange={(e) => setRegenInstruction(e.target.value)}
              placeholder="e.g. Add a misconception callout and a worked example with units"
              className="text-[11px] h-20"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSlideRegen} disabled={regenLoading || !deck.slides[activeSlideIndex]} className="gap-1.5">
                {regenLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Thinking…</> : <><RefreshCw className="w-3.5 h-3.5" />Regenerate slide #{activeSlideIndex + 1}</>}
              </Button>
              {!onSlideRegenerated && (
                <span className="text-[10px] italic self-center text-amber-700">
                  Result will appear here once the page wires <code>onSlideRegenerated</code>.
                </span>
              )}
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Search for permissively-licensed images across Pexels, Unsplash, Openverse and Wikimedia. Click a suggestion to
              open the search in a new tab — no API keys, no per-image fetches from this app.
            </p>
            <Input
              value={imgQuery}
              onChange={(e) => setImgQuery(e.target.value)}
              placeholder="e.g. water cycle classroom diagram"
              className="text-[11px] h-8"
            />
            <ul className="text-[11px] space-y-1 max-h-56 overflow-y-auto">
              {imgSuggestions.map((s) => (
                <li key={s.url} className="flex items-start gap-2 rounded border border-indigo-100 bg-indigo-50/40 p-2">
                  <Badge variant="outline" className="text-[9px] uppercase">{IMAGE_SOURCE_LABEL[s.source]}</Badge>
                  <div className="flex-1">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-indigo-800 underline">{s.query}</a>
                    <div className="text-[10px] text-slate-500">{s.reason} · <em>{IMAGE_SOURCE_LICENSE[s.source]}</em></div>
                  </div>
                </li>
              ))}
              {imgSuggestions.length === 0 && (
                <li className="text-[11px] italic text-muted-foreground">Type an image prompt above to get suggestions.</li>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="pace" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Apply a pace profile across the deck — useful for the same lesson taught to a class with low prior knowledge
              vs a revision class. Each slide's <code>timingMinutes</code> is rescaled.
            </p>
            <div className="flex flex-wrap gap-2">
              {(["slow", "standard", "brisk"] as PaceProfile[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPace(p)}
                  className={`text-[11px] px-3 py-1.5 rounded border ${pace === p ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-indigo-300 text-indigo-700"}`}
                >
                  {PACE_LABEL[p]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <Badge variant="outline">Before: {paceTransform.result.beforeTotal} min</Badge>
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300">After: {paceTransform.result.totalMinutes} min</Badge>
              <Badge variant="outline">×{paceTransform.result.multiplier} multiplier</Badge>
            </div>
            <details className="text-[11px]">
              <summary className="cursor-pointer text-indigo-700">Per-slide changes</summary>
              <div className="rounded-md border bg-white max-h-48 overflow-y-auto mt-1">
                <table className="w-full text-[10px]">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left p-1.5 w-10">#</th>
                      <th className="text-left p-1.5 w-16">Before</th>
                      <th className="text-left p-1.5 w-12"></th>
                      <th className="text-left p-1.5 w-16">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paceTransform.result.perSlide.map((row) => (
                      <tr key={row.index} className="border-t border-slate-100">
                        <td className="p-1.5 text-slate-400">{row.index}</td>
                        <td className="p-1.5 font-mono">{row.before ?? "(default)"}</td>
                        <td className="p-1.5"><ArrowDown className="w-3 h-3 text-slate-400 -rotate-90" /></td>
                        <td className="p-1.5 font-mono font-semibold">{row.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
            <Button size="sm" disabled={!onApplyPace || pace === "standard"} onClick={() => onApplyPace?.(paceTransform.deck)} className="gap-1.5">
              <Gauge className="w-3.5 h-3.5" /> Apply {pace} pace to deck
            </Button>
          </TabsContent>

          <TabsContent value="slides" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Open a fresh Google Slides deck and paste the outline below — no API or extension required.
              Each <code>#</code> becomes a slide title; <code>-</code> bullets fill the body.
            </p>
            <pre className="text-[10px] bg-slate-50 border rounded p-2 max-h-40 overflow-auto whitespace-pre-wrap">{slidesPayload.pasteText}</pre>
            <pre className="text-[10px] bg-blue-50/50 border border-blue-100 rounded p-2 whitespace-pre-wrap">{slidesImportInstructions()}</pre>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(slidesPayload.pasteText, "outline")} className="gap-1.5">
                <Copy className="w-3.5 h-3.5" /> Copy outline
              </Button>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(slidesPayload.outline, "TSV")} className="gap-1.5">
                <Copy className="w-3.5 h-3.5" /> Copy TSV (title \t body \t notes)
              </Button>
              <a href={slidesPayload.launchUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Open Google Slides
                </Button>
              </a>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
