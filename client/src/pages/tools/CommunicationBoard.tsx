/**
 * CommunicationBoard — AAC / symbol-supported communication board generator.
 *
 * SEND USP feature (Elevation Plan, Tool 1 — Communication Boards). Builds a
 * printable grid of picture symbols + word labels from either:
 *   (a) a comma/line-separated word list  — works fully offline (no AI), or
 *   (b) a topic + key stage               — AI suggests topic vocabulary,
 *       then each word is resolved to an ARASAAC pictogram.
 *
 * Symbols come from ARASAAC via /api/symbol-proxy (free, CC BY-NC-SA) — the
 * platform's free, legal symbol layer. Words with no pictogram still render as
 * a clean text card so the board is never broken.
 *
 * Accessibility: large touch targets, tap-to-hear (Web Speech API), high-
 * contrast labels, and a print layout that drops all controls.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  LayoutGrid, Sparkles, Printer, Loader2, Volume2, Languages, Wand2, Eraser,
} from "lucide-react";
import { callAI, parseWithFixes } from "@/lib/ai";
import { resolveSymbolsForWords, type SymbolResult } from "@/lib/symbol-resolver";
import { useApp } from "@/contexts/AppContext";
import { usePupilScope } from "@/contexts/PupilScopeContext";
import { learnerSupportPrompt } from "@/lib/learnerSupportProfile";

interface BoardCard {
  word: string;
  symbol: SymbolResult | null;
}

// ARASAAC supports many languages; expose the common classroom set.
const LANGUAGES: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pl", label: "Polish" },
  { value: "ar", label: "Arabic" },
  { value: "ro", label: "Romanian" },
  { value: "cy", label: "Welsh" },
];

const GRID_SIZES: { value: string; label: string }[] = [
  { value: "2", label: "2 columns (largest)" },
  { value: "3", label: "3 columns" },
  { value: "4", label: "4 columns" },
  { value: "5", label: "5 columns (most)" },
];

/** Split a free-text list on commas / new lines into clean, de-duped words. */
function parseWordList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\n,]+/)) {
    const w = part.trim();
    if (!w) continue;
    const key = w.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
  }
  return out.slice(0, 40); // sensible board cap
}

export default function CommunicationBoard() {
  const { children } = useApp();
  const { pupilId: scopedPupilId } = usePupilScope();
  const scopedPupil = children.find(child => child.id === scopedPupilId) || null;
  const [topic, setTopic] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [wordsInput, setWordsInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [columns, setColumns] = useState("4");
  const [cards, setCards] = useState<BoardCard[]>([]);
  const [boardTitle, setBoardTitle] = useState("");
  const [building, setBuilding] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  // Resolve a list of words to symbol cards via the ARASAAC proxy.
  async function buildBoard(words: string[], titleForBoard: string) {
    if (words.length === 0) {
      toast.error("Add at least one word, or use AI to suggest some.");
      return;
    }
    setBuilding(true);
    try {
      const symbolMap = await resolveSymbolsForWords(words, { lang: language });
      const next: BoardCard[] = words.map((word) => ({
        word,
        symbol: symbolMap[word] ?? null,
      }));
      setCards(next);
      setBoardTitle(titleForBoard);
      const withSymbols = next.filter((c) => c.symbol).length;
      if (withSymbols === 0) {
        toast.warning("No symbols found for these words — try simpler everyday words.");
      } else {
        toast.success(`Board built — ${withSymbols} of ${next.length} words have a symbol.`);
      }
    } catch {
      toast.error("Could not build the board. Please try again.");
    } finally {
      setBuilding(false);
    }
  }

  function handleBuildFromList() {
    const words = parseWordList(wordsInput);
    buildBoard(words, topic.trim() || "Communication Board");
  }

  // Optional AI step: expand a topic into age-appropriate board vocabulary.
  // Degrades gracefully — if AI is unavailable the teacher can still type a
  // word list manually and build the board offline.
  async function handleAISuggest() {
    const t = topic.trim();
    if (!t) {
      toast.error("Enter a topic first (e.g. 'snack time', 'the beach', 'feelings').");
      return;
    }
    setSuggesting(true);
    try {
      const system =
        "You are a UK SEND specialist creating an AAC communication board. " +
        "Return ONLY JSON: {\"words\":[\"...\"]}. Choose 12 concrete, high-frequency " +
        "words a pupil would need to communicate about the topic: a mix of core words " +
        "(I, want, more, stop, help, like) and topic-specific nouns/verbs. Use simple, " +
        "everyday single words (no phrases), British English, suitable for the year group.";
      const supportLines = scopedPupil?.learnerSupportProfile ? learnerSupportPrompt(scopedPupil.learnerSupportProfile) : [];
      const user = `Topic: ${t}${yearGroup ? `\nYear group: ${yearGroup}` : ""}${supportLines.length ? `\n\nTeacher-reviewed communication and access preferences (do not name the pupil or infer a diagnosis). Use only to favour appropriate core vocabulary, accessible word choices and response routes; return single everyday words only.\n${supportLines.join("\n")}` : ""}`;
      const { text } = await callAI(system, user, 500, { responseFormat: "json_object" });
      const parsed = parseWithFixes(text) as { words?: unknown };
      const words = Array.isArray(parsed?.words)
        ? parsed.words.map((w) => String(w)).filter(Boolean)
        : [];
      if (words.length === 0) {
        toast.error("AI did not return usable words — try a different topic or add words manually.");
        return;
      }
      // Show the suggestions in the textarea so the teacher can edit before building.
      setWordsInput(words.join(", "));
      await buildBoard(parseWordList(words.join(", ")), t);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.startsWith("AUTH_REQUIRED")) {
        toast.error("Please log in again to use AI suggestions.");
      } else {
        toast.error("AI suggestions unavailable right now — type a word list and build manually.");
      }
    } finally {
      setSuggesting(false);
    }
  }

  function speak(word: string) {
    try {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      // Map the board language to a BCP-47 hint for the voice engine.
      u.lang = ({ en: "en-GB", es: "es-ES", fr: "fr-FR", de: "de-DE", pl: "pl-PL", ar: "ar", ro: "ro-RO", cy: "cy" } as Record<string, string>)[language] || "en-GB";
      window.speechSynthesis.speak(u);
    } catch {
      /* speech is a nice-to-have; ignore failures */
    }
  }

  function clearAll() {
    setCards([]);
    setBoardTitle("");
    setWordsInput("");
    setTopic("");
  }

  const colClass =
    columns === "2" ? "grid-cols-2"
    : columns === "3" ? "grid-cols-2 sm:grid-cols-3"
    : columns === "5" ? "grid-cols-3 sm:grid-cols-5"
    : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5">
      {/* Header — hidden on print */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="print:hidden">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-brand" />
          Communication Board
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build a printable symbol board for AAC, choice-making and symbol-supported
          communication. Type a word list, or let AI suggest vocabulary for a topic.
          Symbols are from ARASAAC.
        </p>
      </motion.div>

      {/* Builder controls — hidden on print */}
      <Card className="print:hidden">
        <CardContent className="p-4 space-y-4">
          {scopedPupil?.learnerSupportProfile && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900 leading-relaxed">
              <span className="font-semibold">Selected-pupil communication guide:</span> reviewed communication and access preferences can guide optional word suggestions. Review and edit the word list before building or printing the board.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cb-topic">Topic (optional, for AI suggestions)</Label>
              <Input
                id="cb-topic"
                placeholder="e.g. snack time, the beach, feelings"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cb-year">Year group (optional)</Label>
              <Input
                id="cb-year"
                placeholder="e.g. Year 3, Reception"
                value={yearGroup}
                onChange={(e) => setYearGroup(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cb-words">Words (comma or line separated)</Label>
            <Textarea
              id="cb-words"
              rows={3}
              placeholder="I, want, more, help, stop, drink, biscuit, finished"
              value={wordsInput}
              onChange={(e) => setWordsInput(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" />Symbol language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><LayoutGrid className="w-3.5 h-3.5" />Board layout</Label>
              <Select value={columns} onValueChange={setColumns}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRID_SIZES.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={handleBuildFromList} disabled={building || suggesting}>
              {building ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1.5" />}
              Build board
            </Button>
            <Button variant="secondary" onClick={handleAISuggest} disabled={building || suggesting}>
              {suggesting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
              Suggest words with AI
            </Button>
            {cards.length > 0 && (
              <>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1.5" />Print
                </Button>
                <Button variant="ghost" onClick={clearAll}>
                  <Eraser className="w-4 h-4 mr-1.5" />Clear
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* The board itself — this is what prints */}
      {cards.length > 0 && (
        <div className="space-y-3">
          {boardTitle && (
            <h2 className="text-lg font-bold text-center">{boardTitle}</h2>
          )}
          <div className={`grid ${colClass} gap-3`}>
            {cards.map((card, i) => (
              <motion.button
                key={`${card.word}-${i}`}
                type="button"
                onClick={() => speak(card.word)}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18, delay: Math.min(i * 0.015, 0.3) }}
                className="group relative flex flex-col items-center justify-between rounded-xl border-2 border-border bg-white p-2 text-center hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand print:shadow-none"
                aria-label={`${card.word} — tap to hear`}
              >
                <span className="absolute right-1 top-1 text-muted-foreground/50 print:hidden" aria-hidden>
                  <Volume2 className="w-3.5 h-3.5" />
                </span>
                <div className="flex h-24 w-full items-center justify-center sm:h-28">
                  {card.symbol ? (
                    <img
                      src={card.symbol.thumbUrl}
                      alt={card.word}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted text-3xl font-bold text-muted-foreground">
                      {card.word.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="mt-1 w-full truncate text-sm font-semibold capitalize text-foreground">
                  {card.word}
                </span>
              </motion.button>
            ))}
          </div>

          {/* ARASAAC attribution — required by the CC BY-NC-SA licence */}
          <p className="pt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
            Symbols by ARASAAC (arasaac.org), author Sergio Palao, property of the
            Government of Aragón, licensed under Creative Commons BY-NC-SA.
            For non-commercial educational use.
          </p>
        </div>
      )}

      {/* Empty state */}
      {cards.length === 0 && !building && (
        <Card className="print:hidden border-dashed">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Your board will appear here. Add words above and press
            {" "}<span className="font-medium text-foreground">Build board</span>, or
            enter a topic and let AI suggest the vocabulary.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
