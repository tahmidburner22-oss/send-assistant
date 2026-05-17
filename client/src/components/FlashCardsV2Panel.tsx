/**
 * FlashCardsV2Panel — surfaces 5 improvements on top of the existing
 * FlashCards page: Leitner mode, image cards, audio-on-flip, foldable strips,
 * class progress export.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Boxes, Image as ImageIcon, Volume2, Printer, Users, Download } from "lucide-react";
import {
  loadLeitner,
  saveLeitner,
  newLeitnerEntry,
  leitnerSummary,
  LEITNER_INTERVAL_DAYS,
  type LeitnerBox,
  attachImage,
  getImageCard,
  imageCardHtml,
  speakText,
  stopSpeaking,
  speechSupported,
  buildFoldableStripsHtml,
  classStuckSummary,
  classStuckSummaryAsCsv,
  type SimpleCard,
} from "@/lib/flashcards-v2-enhancements";

interface Props {
  /** Flat list of cards currently on the page (used for foldable strip + image attach). */
  cards: SimpleCard[];
  /** A stable key used to identify each card (subject|topic|front). */
  cardKey: (front: string) => string;
}

export default function FlashCardsV2Panel({ cards, cardKey }: Props) {
  const [tick, setTick] = useState(0);
  const [imgFront, setImgFront] = useState("");
  const [imgUrl, setImgUrl] = useState("");

  const leitner = useMemo(() => loadLeitner(), [tick]);
  const summary = useMemo(() => leitnerSummary(leitner), [leitner]);
  const stuck = useMemo(() => classStuckSummary(2), [tick]);

  function recordLeitnerInit() {
    if (cards.length === 0) {
      toast.error("Generate cards first.");
      return;
    }
    const next = { ...leitner };
    let added = 0;
    for (const c of cards) {
      const key = cardKey(c.front);
      if (!next[key]) {
        next[key] = newLeitnerEntry(key);
        added += 1;
      }
    }
    saveLeitner(next);
    setTick((t) => t + 1);
    toast.success(`Tracked ${added} new card(s) in Leitner Box 1.`);
  }

  function attachImg() {
    if (!imgFront.trim() || !imgUrl.trim()) {
      toast.error("Enter both the card front text and the image URL.");
      return;
    }
    attachImage(cardKey(imgFront.trim()), imgUrl.trim(), imgFront.trim());
    setImgFront("");
    setImgUrl("");
    setTick((t) => t + 1);
    toast.success("Image attached.");
  }

  function speakAll() {
    if (!speechSupported()) {
      toast.error("Speech synthesis not supported on this browser.");
      return;
    }
    if (cards.length === 0) {
      toast.error("Generate cards first.");
      return;
    }
    // Read each card front then back, with a short pause.
    for (const c of cards) {
      speakText(`${c.front}. ${c.back}`);
    }
    toast.success(`Reading ${cards.length} cards aloud.`);
  }

  function printFoldable() {
    if (cards.length === 0) {
      toast.error("Generate cards first.");
      return;
    }
    const html = buildFoldableStripsHtml(cards, { columns: 2, title: "Flash cards (foldable)" });
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Foldable cards</title></head><body>${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  function downloadCsv() {
    if (stuck.length === 0) {
      toast("No 'stuck' cards across the class yet.");
      return;
    }
    const csv = classStuckSummaryAsCsv(stuck);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `class-stuck-cards-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${stuck.length} stuck cards.`);
  }

  // Live preview of an image attachment (if the user has typed a front)
  const livePreview = useMemo(() => {
    if (!imgFront.trim() || !imgUrl.trim()) return null;
    return imageCardHtml({ cardKey: cardKey(imgFront), imageUrl: imgUrl, alt: imgFront }, 110);
  }, [imgFront, imgUrl, cardKey]);

  // Pre-existing attached preview (for the first card on screen, illustrative)
  const firstAttachment = cards.length > 0 ? getImageCard(cardKey(cards[0].front)) : null;

  // Cleanup speech on unmount
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  return (
    <Card className="border-yellow-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-yellow-600" />
          <p className="text-sm font-bold">Flash card extras</p>
        </div>

        <Tabs defaultValue="leitner">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="leitner"><Boxes className="w-3.5 h-3.5 mr-1" />Leitner</TabsTrigger>
            <TabsTrigger value="image"><ImageIcon className="w-3.5 h-3.5 mr-1" />Image cards</TabsTrigger>
            <TabsTrigger value="audio"><Volume2 className="w-3.5 h-3.5 mr-1" />Read aloud</TabsTrigger>
            <TabsTrigger value="foldable"><Printer className="w-3.5 h-3.5 mr-1" />Foldable</TabsTrigger>
            <TabsTrigger value="class"><Users className="w-3.5 h-3.5 mr-1" />Class progress</TabsTrigger>
          </TabsList>

          <TabsContent value="leitner" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Physical-style 5-box system as an alternative to SM-2: cards graduate up a box on
              correct answer and drop to box 1 on wrong.
            </p>
            <div className="grid grid-cols-5 gap-2 text-center">
              {([1, 2, 3, 4, 5] as LeitnerBox[]).map((box) => (
                <div key={box} className="rounded-md border p-2 bg-yellow-50">
                  <div className="text-[10px] uppercase tracking-wider text-yellow-800">Box {box}</div>
                  <div className="text-lg font-bold text-yellow-900">{summary[box]}</div>
                  <div className="text-[10px] text-muted-foreground">every {LEITNER_INTERVAL_DAYS[box]}d</div>
                </div>
              ))}
            </div>
            <Button size="sm" onClick={recordLeitnerInit}>
              Add current cards to Box 1
            </Button>
          </TabsContent>

          <TabsContent value="image" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Attach an image to a card front — particularly valuable for EYFS phonics, EAL, and SEND vocab cards.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              <Input
                value={imgFront}
                onChange={(e) => setImgFront(e.target.value)}
                placeholder="Card front (exact text)"
                className="text-xs"
              />
              <Input
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
                placeholder="Image URL (https://…)"
                className="text-xs"
              />
            </div>
            <Button size="sm" onClick={attachImg} className="gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Attach image
            </Button>
            {livePreview && (
              <div className="rounded-md border bg-white p-2" dangerouslySetInnerHTML={{ __html: livePreview }} />
            )}
            {firstAttachment && (
              <div className="rounded-md border bg-yellow-50/40 p-2">
                <p className="text-[10px] text-muted-foreground mb-1">First-card attachment preview:</p>
                <div dangerouslySetInnerHTML={{ __html: imageCardHtml(firstAttachment, 110) }} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="audio" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Read every card front + back aloud using the browser speech engine — supports dyslexia, EAL, and EYFS.
              {!speechSupported() && " (Not supported on this browser.)"}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={speakAll} disabled={!speechSupported() || cards.length === 0} className="gap-1.5">
                <Volume2 className="w-3.5 h-3.5" /> Read deck aloud
              </Button>
              <Button size="sm" variant="outline" onClick={stopSpeaking} disabled={!speechSupported()}>
                Stop
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="foldable" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              A4 fold-in-half print layout where each card stacks front (top half) and back (bottom half).
              Pupils fold the page so the back is hidden.
            </p>
            <Button size="sm" onClick={printFoldable} disabled={cards.length === 0} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print foldable strips ({cards.length})
            </Button>
          </TabsContent>

          <TabsContent value="class" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Aggregates the cards multiple pupils find hardest (low ease or Leitner box ≤ 2),
              ready for re-teach planning. Recorded automatically when pupils review cards.
            </p>
            {stuck.length === 0 ? (
              <p className="text-[11px] italic text-muted-foreground">
                No stuck cards across the class yet — comes alive once pupils start reviewing.
              </p>
            ) : (
              <ul className="text-[11px] space-y-1 max-h-48 overflow-y-auto">
                {stuck.slice(0, 12).map((s) => (
                  <li key={s.cardKey} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px]">{s.pupilCount} pupil{s.pupilCount === 1 ? "" : "s"}</Badge>
                    <span className="flex-1"><strong>{s.cardFront.slice(0, 60)}</strong>
                      <span className="text-muted-foreground ml-1">
                        {s.averageEase ? `EF ${s.averageEase.toFixed(2)}` : ""}
                        {s.averageLeitnerBox ? ` Box ${s.averageLeitnerBox.toFixed(1)}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button size="sm" variant="outline" onClick={downloadCsv} disabled={stuck.length === 0} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
