import { useState, useCallback, useRef } from "react";
import { callAI } from "@/lib/ai";
import { downloadHtmlAsPdf } from "@/lib/pdf-generator-v2";
import { Layers, RotateCcw, ChevronLeft, ChevronRight, Shuffle, Printer, Check, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => ({ value: y, label: y }));

interface Card { front: string; back: string; hint?: string; }

/** Parse AI output into Card objects */
function parseCards(text: string): Card[] {
  const cards: Card[] = [];
  const blocks = text.split(/---+/).map(b => b.trim()).filter(Boolean);
  for (const block of blocks) {
    const frontMatch = block.match(/^FRONT:\s*(.+?)(?:\nBACK:|$)/ms);
    const backMatch  = block.match(/^BACK:\s*(.+?)(?:\nMEMORY HINT:|$)/ms);
    const hintMatch  = block.match(/^MEMORY HINT:\s*(.+?)$/ms);
    if (frontMatch && backMatch) {
      cards.push({
        front: frontMatch[1].trim(),
        back:  backMatch[1].trim(),
        hint:  hintMatch?.[1]?.trim(),
      });
    }
  }
  return cards;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Interactive flip-card study mode */
function StudyMode({ cards, onReset }: { cards: Card[]; onReset: () => void }) {
  const [deck, setDeck]           = useState(cards);
  const [idx, setIdx]             = useState(0);
  const [flipped, setFlipped]     = useState(false);
  const [known, setKnown]         = useState<Set<number>>(new Set());
  const [unsure, setUnsure]       = useState<Set<number>>(new Set());
  const [showHint, setShowHint]   = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const card = deck[idx];
  const progress = `${idx + 1} / ${deck.length}`;

  const next = useCallback(() => { setFlipped(false); setShowHint(false); setIdx(i => Math.min(i + 1, deck.length - 1)); }, [deck.length]);
  const prev = useCallback(() => { setFlipped(false); setShowHint(false); setIdx(i => Math.max(i - 1, 0)); }, []);

  const markKnown = () => {
    setKnown(s => new Set([...s, idx]));
    setUnsure(s => { const n = new Set(s); n.delete(idx); return n; });
    next();
  };
  const markUnsure = () => {
    setUnsure(s => new Set([...s, idx]));
    setKnown(s => { const n = new Set(s); n.delete(idx); return n; });
    next();
  };

  const reshuffleDeck = () => { setDeck(shuffle(deck)); setIdx(0); setFlipped(false); setShowHint(false); };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setPdfLoading(true);
    try {
      await downloadHtmlAsPdf(printRef.current, `Flash_Cards.pdf`);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Could not generate PDF. Please try again.");
    }
    setPdfLoading(false);
  };

  const knownPct  = Math.round((known.size  / deck.length) * 100);
  const unsurePct = Math.round((unsure.size / deck.length) * 100);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="font-semibold text-gray-700">{progress}</span>
        <div className="flex gap-3 text-xs">
          <span className="text-emerald-600 font-semibold">✓ Known: {known.size}</span>
          <span className="text-amber-600 font-semibold">? Unsure: {unsure.size}</span>
          <span className="text-gray-400">{deck.length - known.size - unsure.size} remaining</span>
        </div>
      </div>

      {/* Progress track */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
        <div className="h-full bg-emerald-400 transition-all" style={{ width: `${knownPct}%` }} />
        <div className="h-full bg-amber-400 transition-all" style={{ width: `${unsurePct}%` }} />
      </div>

      {/* Flip card */}
      <div className="flex justify-center">
        <div
          className="relative cursor-pointer select-none"
          style={{ width: "min(100%, 520px)", height: "240px", perspective: "1000px" }}
          onClick={() => setFlipped(f => !f)}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 25 }}
            style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", position: "relative" }}
          >
            {/* Front */}
            <div style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
              className={`rounded-2xl border-2 flex flex-col items-center justify-center p-6 text-center shadow-lg
                ${known.has(idx) ? "border-emerald-400 bg-emerald-50" : unsure.has(idx) ? "border-amber-400 bg-amber-50" : "border-indigo-200 bg-white"}`}>
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-3">Question / Term</div>
              <p className="text-xl font-bold text-gray-900 leading-snug">{card?.front}</p>
              <div className="mt-4 text-xs text-gray-400">Tap to reveal answer</div>
            </div>
            {/* Back */}
            <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}
              className="rounded-2xl border-2 border-violet-300 bg-violet-50 flex flex-col items-center justify-center p-6 text-center shadow-lg">
              <div className="text-xs font-semibold text-violet-500 uppercase tracking-wide mb-3">Answer</div>
              <p className="text-lg font-semibold text-gray-800 leading-snug">{card?.back}</p>
              {card?.hint && showHint && (
                <p className="mt-3 text-sm text-violet-600 italic">💡 {card.hint}</p>
              )}
              {card?.hint && !showHint && (
                <button onClick={e => { e.stopPropagation(); setShowHint(true); }}
                  className="mt-3 text-xs text-violet-500 hover:text-violet-700 underline">Show memory hint</button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mark buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex gap-3 justify-center">
            <Button onClick={markUnsure} variant="outline"
              className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold">
              <X className="w-4 h-4" /> Still learning
            </Button>
            <Button onClick={markKnown}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              <Check className="w-4 h-4" /> Got it!
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav + controls */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={prev} disabled={idx === 0} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Prev
          </Button>
          <Button variant="outline" size="sm" onClick={next} disabled={idx === deck.length - 1} className="gap-1">
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={reshuffleDeck} className="gap-1 text-gray-600">
            <Shuffle className="w-3.5 h-3.5" /> Shuffle
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1 text-gray-600 no-print">
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={pdfLoading} className="gap-1 text-brand border-brand/30 hover:bg-brand/5 no-print">
            <Download className="w-3.5 h-3.5" /> {pdfLoading ? "Saving…" : "PDF"}
          </Button>
          <Button variant="outline" size="sm" onClick={onReset} className="gap-1 text-gray-600">
            <RotateCcw className="w-3.5 h-3.5" /> New cards
          </Button>
        </div>
      </div>

      {/* Completion message */}
      {idx === deck.length - 1 && flipped && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 text-center">
          <p className="font-bold text-indigo-800 text-sm">End of deck! 🎉</p>
          <p className="text-xs text-indigo-600 mt-1">
            Known: {known.size} · Still learning: {unsure.size} · Unreviewed: {deck.length - known.size - unsure.size}
          </p>
          {unsure.size > 0 && (
            <Button size="sm" onClick={() => { setDeck(deck.filter((_, i) => unsure.has(i))); setIdx(0); setFlipped(false); setKnown(new Set()); setUnsure(new Set()); }}
              className="mt-2 bg-amber-500 hover:bg-amber-600 text-white text-xs gap-1">
              <RotateCcw className="w-3 h-3" /> Review {unsure.size} unsure card{unsure.size !== 1 ? "s" : ""}
            </Button>
          )}
        </div>
      )}

      {/* Printable + PDF card grid */}
      <div ref={printRef} className="hidden print:block mt-4" style={{ fontFamily: "Arial, sans-serif" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          {deck.map((c, i) => (
            <div key={i} style={{ border: "2px solid #4f46e5", borderRadius: "8px", padding: "14px", pageBreakInside: "avoid", background: "#fff" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.5px" }}>Card {i + 1}</div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827", marginBottom: "8px" }}>{c.front}</div>
              <div style={{ fontSize: "13px", color: "#374151", borderTop: "1px dashed #c7d2fe", paddingTop: "8px", lineHeight: "1.5" }}>{c.back}</div>
              {c.hint && <div style={{ fontSize: "11px", color: "#7c3aed", marginTop: "6px", fontStyle: "italic" }}>💡 {c.hint}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FlashCards() {
  const [subject,      setSubject]      = useState("Science");
  const [yearGroup,    setYearGroup]    = useState("Year 10");
  const [topic,        setTopic]        = useState("");
  const [cardType,     setCardType]     = useState("vocab");
  const [numCards,     setNumCards]     = useState("10");
  const [sendAdapted,  setSendAdapted]  = useState("no");
  const [includeHints, setIncludeHints] = useState("yes");
  const [loading,      setLoading]      = useState(false);
  const [cards,        setCards]        = useState<Card[] | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) { toast.error("Please enter a topic."); return; }
    setLoading(true); setCards(null);
    try {
      const { text } = await callAI(
        `You are an expert UK teacher creating flash cards for student revision. Cards are clear, concise, and memorable. For SEND students use simple language and memory aids.`,
        `Create ${numCards} flash cards for:
Subject: ${subject} | Year Group: ${yearGroup} | Topic: ${topic}
Card Type: ${cardType} | SEND Adapted: ${sendAdapted === "yes" ? "Yes — simple language" : "No"}
Include Memory Hints: ${includeHints === "yes" ? "Yes" : "No"}

Format EXACTLY like this for every card — include the dashes:
---
**Card [number]**
FRONT: [term/question — keep to one line if possible]
BACK: [definition/answer — 2-4 lines max, concise]
${includeHints === "yes" ? "MEMORY HINT: [mnemonic or visual memory aid]" : ""}
---

Requirements:
- Cover the most important/examinable content for ${topic}
- Keep FRONT brief, BACK complete but concise
- ${sendAdapted === "yes" ? "Use simple vocabulary and short sentences throughout" : `Use appropriate ${yearGroup} academic language`}
- Include ALL ${numCards} cards`,
        2500,
      );
      const parsed = parseCards(text);
      if (parsed.length === 0) throw new Error("No cards parsed");
      setCards(parsed);
      toast.success(`${parsed.length} flash cards generated!`);
    } catch {
      toast.error("Failed to generate cards. Please try again.");
    }
    setLoading(false);
  }, [subject, yearGroup, topic, cardType, numCards, sendAdapted, includeHints]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-600 flex items-center justify-center flex-shrink-0">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Flash Card Generator</h1>
          <p className="text-sm text-gray-500">Generate cards then study interactively with flip, self-mark, and spaced review</p>
        </div>
      </div>

      {cards ? (
        <StudyMode cards={cards} onReset={() => setCards(null)} />
      ) : (
        <div className="space-y-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{subjects.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Year Group</Label>
              <Select value={yearGroup} onValueChange={setYearGroup}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{years.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Topic *</Label>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. The Water Cycle, Fractions, WW2 Key Events" />
            </div>
            <div className="space-y-1">
              <Label>Card Type</Label>
              <Select value={cardType} onValueChange={setCardType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vocab">Vocabulary (term + definition)</SelectItem>
                  <SelectItem value="qa">Question & Answer</SelectItem>
                  <SelectItem value="concept">Concept + Example</SelectItem>
                  <SelectItem value="dates">Dates & Events</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Number of Cards</Label>
              <Select value={numCards} onValueChange={setNumCards}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[5,8,10,12,15,20].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>SEND Adapted</Label>
              <Select value={sendAdapted} onValueChange={setSendAdapted}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes — simple language</SelectItem>
                  <SelectItem value="no">Standard level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Memory Hints</Label>
              <Select value={includeHints} onValueChange={setIncludeHints}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes — mnemonics / memory aids</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold">
            {loading ? "Generating cards…" : `Generate ${numCards} Flash Cards`}
          </Button>
        </div>
      )}
    </div>
  );
}
