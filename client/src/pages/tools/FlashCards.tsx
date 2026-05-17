import { useState, useCallback, useRef } from "react";
import { callAI } from "@/lib/ai";
import { downloadHtmlAsPdf } from "@/lib/pdf-generator-v2";
import { Layers, RotateCcw, ChevronLeft, ChevronRight, Shuffle, Printer, Check, X, Download, Clock, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import FlashCardsV2Panel from "@/components/FlashCardsV2Panel";
import {
  loadLeitner,
  saveLeitner,
  newLeitnerEntry,
  leitnerReview,
  speakText,
  speechSupported,
  recordPupilProgress,
  getImageCard,
  imageCardHtml,
} from "@/lib/flashcards-v2-enhancements";
import { useApp } from "@/contexts/AppContext";
import { usePupilScope } from "@/contexts/PupilScopeContext";

const subjects = ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","Computing","MFL","Design Technology","Drama"].map(s => ({ value: s, label: s }));
const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => ({ value: y, label: y }));

interface Card { front: string; back: string; hint?: string; }

// --- SM-2 Spaced Repetition ---

interface SM2Data {
  ease: number;        // ease factor, default 2.5, min 1.3
  interval: number;    // days until next review
  repetitions: number; // consecutive correct answers
  nextReview: number;  // timestamp (ms) when card is next due
}

interface SM2Card extends Card {
  sm2: SM2Data;
  cardKey: string; // unique key for localStorage lookup
}

const SM2_STORAGE_KEY = "adaptly_flashcards_sm2";

function getStoredSM2(): Record<string, SM2Data> {
  try {
    const stored = localStorage.getItem(SM2_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveSM2(data: Record<string, SM2Data>) {
  try {
    localStorage.setItem(SM2_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function makeCardKey(subject: string, topic: string, front: string): string {
  return `${subject}|${topic}|${front}`.toLowerCase().trim();
}

function sm2Update(data: SM2Data, quality: number): SM2Data {
  let { ease, interval, repetitions } = data;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * ease);
    repetitions += 1;
  } else {
    interval = 1;
    repetitions = 0;
  }

  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  return { ease, interval, repetitions, nextReview };
}

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
function StudyMode({ cards, onReset, onSM2Update, pupilId, pupilName }: { cards: SM2Card[]; onReset: () => void; onSM2Update: (cardKey: string, sm2: SM2Data) => void; pupilId?: string; pupilName?: string }) {
  const [deck, setDeck]           = useState(cards);
  const [idx, setIdx]             = useState(0);
  const [flipped, setFlipped]     = useState(false);
  const [known, setKnown]         = useState<Set<number>>(new Set());
  const [unsure, setUnsure]       = useState<Set<number>>(new Set());
  const [showHint, setShowHint]   = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showDueOnly, setShowDueOnly] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredDeck = showDueOnly
    ? deck.filter(c => c.sm2.nextReview <= Date.now())
    : deck;

  const card = filteredDeck[idx];
  const progress = filteredDeck.length > 0 ? `${idx + 1} / ${filteredDeck.length}` : "0 / 0";
  const dueCount = deck.filter(c => c.sm2.nextReview <= Date.now()).length;

  const next = useCallback(() => { setFlipped(false); setShowHint(false); setIdx(i => Math.min(i + 1, filteredDeck.length - 1)); }, [filteredDeck.length]);
  const prev = useCallback(() => { setFlipped(false); setShowHint(false); setIdx(i => Math.max(i - 1, 0)); }, []);

  // Update Leitner state and class progress on each mark.
  const updateLeitnerAndClass = (correct: boolean) => {
    if (!card) return;
    const leitner = loadLeitner();
    const entry = leitner[card.cardKey] || newLeitnerEntry(card.cardKey);
    const updated = leitnerReview(entry, correct);
    leitner[card.cardKey] = updated;
    saveLeitner(leitner);
    if (pupilId && pupilName) {
      recordPupilProgress({
        pupilId,
        pupilName,
        cardKey: card.cardKey,
        cardFront: card.front,
        ease: card.sm2.ease,
        leitnerBox: updated.box,
        attempts: card.sm2.repetitions + 1,
        correctRate: correct ? 1 : 0,
      });
    }
  };

  const markKnown = () => {
    setKnown(s => new Set([...s, idx]));
    setUnsure(s => { const n = new Set(s); n.delete(idx); return n; });
    if (card) {
      const updated = sm2Update(card.sm2, 4);
      onSM2Update(card.cardKey, updated);
      card.sm2 = updated;
      updateLeitnerAndClass(true);
    }
    next();
  };
  const markUnsure = () => {
    setUnsure(s => new Set([...s, idx]));
    setKnown(s => { const n = new Set(s); n.delete(idx); return n; });
    if (card) {
      const updated = sm2Update(card.sm2, 1);
      onSM2Update(card.cardKey, updated);
      card.sm2 = updated;
      updateLeitnerAndClass(false);
    }
    next();
  };

  const reshuffleDeck = () => { setDeck(shuffle(deck)); setIdx(0); setFlipped(false); setShowHint(false); };

  const speakCurrent = () => {
    if (!card) return;
    const text = flipped ? `${card.back}` : `${card.front}`;
    speakText(text);
  };

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

  const knownPct  = filteredDeck.length > 0 ? Math.round((known.size  / filteredDeck.length) * 100) : 0;
  const unsurePct = filteredDeck.length > 0 ? Math.round((unsure.size / filteredDeck.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Due today filter + review stats */}
      <div className="flex items-center justify-between">
        <Button
          variant={showDueOnly ? "default" : "outline"}
          size="sm"
          onClick={() => { setShowDueOnly(d => !d); setIdx(0); setFlipped(false); setShowHint(false); setKnown(new Set()); setUnsure(new Set()); }}
          className={`gap-1.5 text-xs font-semibold ${showDueOnly ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "text-indigo-700 border-indigo-200 hover:bg-indigo-50"}`}
        >
          <Clock className="w-3.5 h-3.5" />
          Due today ({dueCount})
        </Button>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{deck.length} total cards</span>
          <span className="text-indigo-600 font-medium">{dueCount} due</span>
        </div>
      </div>

      {filteredDeck.length === 0 ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
          <p className="font-bold text-emerald-800 text-sm">All caught up! No cards due for review.</p>
          <p className="text-xs text-emerald-600 mt-1">Come back later when more cards are due, or disable the filter to study all cards.</p>
          <Button size="sm" variant="outline" onClick={() => setShowDueOnly(false)} className="mt-3 text-xs">
            Show all cards
          </Button>
        </div>
      ) : (
      <>
      {/* Progress bar */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="font-semibold text-gray-700">{progress}</span>
        <div className="flex gap-3 text-xs">
          <span className="text-emerald-600 font-semibold">&#10003; Known: {known.size}</span>
          <span className="text-amber-600 font-semibold">? Unsure: {unsure.size}</span>
          <span className="text-gray-400">{filteredDeck.length - known.size - unsure.size} remaining</span>
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
              {card && getImageCard(card.cardKey) && (
                <div dangerouslySetInnerHTML={{ __html: imageCardHtml(getImageCard(card.cardKey)!, 80) }} />
              )}
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

      {/* Read aloud */}
      {speechSupported() && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); speakCurrent(); }} className="gap-1.5 text-violet-600 border-violet-300">
            <Volume2 className="w-3.5 h-3.5" /> Read aloud
          </Button>
        </div>
      )}

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
          <Button variant="outline" size="sm" onClick={next} disabled={idx === filteredDeck.length - 1} className="gap-1">
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
      {idx === filteredDeck.length - 1 && flipped && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 text-center">
          <p className="font-bold text-indigo-800 text-sm">End of deck! 🎉</p>
          <p className="text-xs text-indigo-600 mt-1">
            Known: {known.size} · Still learning: {unsure.size} · Unreviewed: {filteredDeck.length - known.size - unsure.size}
          </p>
          {unsure.size > 0 && (
            <Button size="sm" onClick={() => { setDeck(filteredDeck.filter((_, i) => unsure.has(i))); setIdx(0); setFlipped(false); setKnown(new Set()); setUnsure(new Set()); setShowDueOnly(false); }}
              className="mt-2 bg-amber-500 hover:bg-amber-600 text-white text-xs gap-1">
              <RotateCcw className="w-3 h-3" /> Review {unsure.size} unsure card{unsure.size !== 1 ? "s" : ""}
            </Button>
          )}
        </div>
      )}

      </>
      )}

      {/* Printable + PDF card grid — each card split into QUESTION card + ANSWER card */}
      <div ref={printRef} className="hidden print:block mt-4" style={{ fontFamily: "Arial, sans-serif" }}>
        <p style={{ fontSize: "10px", color: "#6b7280", marginBottom: "10px", fontStyle: "italic" }}>Print and cut out each card. Fold or pair each question card with its matching answer card.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
          {deck.map((c, i) => (
            <>
              {/* Question card */}
              <div key={`q-${i}`} style={{ border: "2px solid #4f46e5", borderRadius: "8px", padding: "14px", pageBreakInside: "avoid", background: "#f5f3ff", minHeight: "100px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.5px", display: "flex", justifyContent: "space-between" }}>
                  <span>Card {i + 1} — Question</span>
                  <span style={{ color: "#a5b4fc" }}>FRONT</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#111827", flex: 1, display: "flex", alignItems: "center" }}>{c.front}</div>
                {c.hint && <div style={{ fontSize: "10px", color: "#7c3aed", marginTop: "6px", fontStyle: "italic" }}>💡 {c.hint}</div>}
              </div>
              {/* Answer card */}
              <div key={`a-${i}`} style={{ border: "2px solid #059669", borderRadius: "8px", padding: "14px", pageBreakInside: "avoid", background: "#ecfdf5", minHeight: "100px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#059669", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.5px", display: "flex", justifyContent: "space-between" }}>
                  <span>Card {i + 1} — Answer</span>
                  <span style={{ color: "#6ee7b7" }}>BACK</span>
                </div>
                <div style={{ fontSize: "13px", color: "#374151", flex: 1, lineHeight: "1.5" }}>{c.back}</div>
              </div>
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FlashCards() {
  const { children } = useApp();
  const { pupilId } = usePupilScope();
  const scopedPupil = children.find((c) => c.id === pupilId);
  const [subject,      setSubject]      = useState("Science");
  const [yearGroup,    setYearGroup]    = useState("Year 10");
  const [topic,        setTopic]        = useState("");
  const [cardType,     setCardType]     = useState("vocab");
  const [numCards,     setNumCards]     = useState("10");
  const [sendAdapted,  setSendAdapted]  = useState("no");
  const [includeHints, setIncludeHints] = useState("yes");
  const [loading,      setLoading]      = useState(false);
  const [cards,        setCards]        = useState<SM2Card[] | null>(null);

  const handleSM2Update = useCallback((cardKey: string, sm2: SM2Data) => {
    const store = getStoredSM2();
    store[cardKey] = sm2;
    saveSM2(store);
  }, []);

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
      const sm2Store = getStoredSM2();
      const enhancedCards: SM2Card[] = parsed.map(card => {
        const cardKey = makeCardKey(subject, topic, card.front);
        const existing = sm2Store[cardKey];
        return {
          ...card,
          cardKey,
          sm2: existing || { ease: 2.5, interval: 0, repetitions: 0, nextReview: 0 },
        };
      });
      setCards(enhancedCards);
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
        <>
          <StudyMode cards={cards} onReset={() => setCards(null)} onSM2Update={handleSM2Update} pupilId={pupilId || undefined} pupilName={scopedPupil?.name} />
          <FlashCardsV2Panel
            cards={cards.map((c) => ({ front: c.front, back: c.back, hint: c.hint }))}
            cardKey={(front) => makeCardKey(subject, topic, front)}
          />
        </>
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
