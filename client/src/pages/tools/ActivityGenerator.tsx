/**
 * ActivityGenerator — SEND Interactive Activity Generator (Tool T3).
 * Inspired by ToolsEdu, re-imagined SEND-first.
 *
 * Generates accessible, printable + on-screen interactive activities from a
 * vocabulary list (typed) OR an AI-suggested topic vocabulary set:
 *   - Word search   (reuses lib/proceduralActivities/wordsearch)
 *   - Crossword     (reuses lib/proceduralActivities/crossword — picture/word clues)
 *   - Matching      (reuses lib/proceduralActivities/matching — word ↔ definition)
 *   - Fill-the-gaps (reuses lib/proceduralActivities/cloze — word bank + slots)
 *
 * SEND-first: large touch/eye-gaze targets, adjustable complexity (item count),
 * no time pressure, gentle styling, full keyboard access, and a clean print
 * layout (every control is print:hidden). All generation is FREE — the four
 * generators are pure/deterministic; only the optional "suggest vocabulary"
 * step uses callAI (Gemini-independent via the server fallback chain).
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Gamepad2, Sparkles, Printer, Loader2, Wand2, Eraser, Eye, EyeOff,
} from "lucide-react";
import { callAI, parseWithFixes } from "@/lib/ai";
import { generateWordsearch } from "@/lib/proceduralActivities/wordsearch";
import { generateCrossword } from "@/lib/proceduralActivities/crossword";
import { generateMatching } from "@/lib/proceduralActivities/matching";
import { generateCloze } from "@/lib/proceduralActivities/cloze";

type ActivityType = "wordsearch" | "crossword" | "matching" | "cloze";

interface VocabItem {
  term: string;
  definition: string;
}

const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "wordsearch", label: "Word search" },
  { value: "crossword", label: "Crossword (picture/word clues)" },
  { value: "matching", label: "Matching (word ↔ meaning)" },
  { value: "cloze", label: "Fill the gaps (word bank)" },
];

/** Parse "term: definition" or "term — definition" lines into vocab items. */
function parseVocab(raw: string): VocabItem[] {
  const out: VocabItem[] = [];
  const seen = new Set<string>();
  for (const line of raw.split(/\n+/)) {
    const l = line.trim();
    if (!l) continue;
    const m = l.match(/^(.+?)\s*[:\u2013\u2014-]\s*(.+)$/);
    const term = (m ? m[1] : l).trim();
    const definition = (m ? m[2] : "").trim();
    const key = term.toLowerCase();
    if (!term || seen.has(key)) continue;
    seen.add(key);
    out.push({ term, definition });
  }
  return out.slice(0, 20);
}

export default function ActivityGenerator() {
  const [topic, setTopic] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [vocabInput, setVocabInput] = useState("");
  const [activity, setActivity] = useState<ActivityType>("wordsearch");
  const [maxItems, setMaxItems] = useState(8);
  const [vocab, setVocab] = useState<VocabItem[]>([]);
  const [clozeProse, setClozeProse] = useState("");
  const [showAnswers, setShowAnswers] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [built, setBuilt] = useState(false);

  const effectiveVocab = useMemo(() => vocab.slice(0, maxItems), [vocab, maxItems]);

  // ── Optional AI: expand a topic into vocabulary (+ short pupil-friendly
  //    definitions and a cloze paragraph). Degrades gracefully to manual entry.
  async function handleSuggest() {
    const t = topic.trim();
    if (!t) {
      toast.error("Enter a topic first, or type a vocabulary list below.");
      return;
    }
    setSuggesting(true);
    try {
      const system =
        "You are a UK SEND teacher creating accessible activities. Return ONLY JSON: " +
        '{"items":[{"term":"...","definition":"..."}],"cloze":"..."}. ' +
        "Give 8-10 key vocabulary terms for the topic with SHORT, pupil-friendly " +
        "definitions (max 8 words each). 'cloze' is a 3-4 sentence paragraph about the " +
        "topic with 4-6 of the key terms replaced by tokens of the form __BLANK:term__ " +
        "(keep the answer inside the token). British English, suitable for the year group.";
      const user = `Topic: ${t}${yearGroup ? `\nYear group: ${yearGroup}` : ""}`;
      const { text } = await callAI(system, user, 900, { responseFormat: "json_object" });
      const parsed = parseWithFixes(text) as { items?: Array<{ term?: string; definition?: string }>; cloze?: string };
      const items = Array.isArray(parsed?.items)
        ? parsed.items
            .map((i) => ({ term: String(i?.term || "").trim(), definition: String(i?.definition || "").trim() }))
            .filter((i) => i.term)
        : [];
      if (items.length === 0) {
        toast.error("AI returned no usable vocabulary — try another topic or type a list.");
        return;
      }
      setVocab(items);
      setClozeProse(typeof parsed?.cloze === "string" ? parsed.cloze : "");
      setVocabInput(items.map((i) => (i.definition ? `${i.term}: ${i.definition}` : i.term)).join("\n"));
      setBuilt(true);
      toast.success(`Suggested ${items.length} terms — pick an activity below.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.startsWith("AUTH_REQUIRED") ? "Please log in again to use AI." : "AI unavailable — type a vocabulary list instead.");
    } finally {
      setSuggesting(false);
    }
  }

  function handleBuildFromList() {
    const items = parseVocab(vocabInput);
    if (items.length === 0) {
      toast.error("Add some vocabulary (one per line, optionally 'term: meaning').");
      return;
    }
    setVocab(items);
    setClozeProse("");
    setBuilt(true);
  }

  function clearAll() {
    setVocab([]);
    setVocabInput("");
    setTopic("");
    setClozeProse("");
    setBuilt(false);
  }

  // ── Build the chosen activity (pure, memoised by inputs) ───────────────────
  const wordsearch = useMemo(
    () => (activity === "wordsearch" && effectiveVocab.length
      ? generateWordsearch({ words: effectiveVocab.map((v) => v.term), seed: 7 })
      : null),
    [activity, effectiveVocab],
  );
  const crossword = useMemo(
    () => (activity === "crossword" && effectiveVocab.length
      ? generateCrossword({
          entries: effectiveVocab.map((v) => ({ word: v.term, clue: v.definition || v.term })),
          seed: 7,
        })
      : null),
    [activity, effectiveVocab],
  );
  const matching = useMemo(
    () => (activity === "matching" && effectiveVocab.length
      ? generateMatching({
          pairs: effectiveVocab.filter((v) => v.definition).map((v) => ({ left: v.term, right: v.definition })),
          seed: 7,
        })
      : null),
    [activity, effectiveVocab],
  );
  const cloze = useMemo(
    () => (activity === "cloze" && clozeProse
      ? generateCloze({ prose: clozeProse, includeWordBank: true, seed: 7 })
      : null),
    [activity, clozeProse],
  );

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="print:hidden">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-brand" />
          Interactive Activity Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Turn a topic or vocabulary list into accessible word searches, crosswords,
          matching games and fill-the-gap activities. Large targets, no time pressure,
          print or play on screen. Free — no paid tools.
        </p>
      </motion.div>

      <Card className="print:hidden">
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ag-topic">Topic (optional, for AI suggestions)</Label>
              <Input id="ag-topic" placeholder="e.g. The Water Cycle, Minibeasts" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ag-year">Year group (optional)</Label>
              <Input id="ag-year" placeholder="e.g. Year 4" value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ag-vocab">Vocabulary (one per line — optionally "term: meaning")</Label>
            <Textarea
              id="ag-vocab"
              rows={4}
              placeholder={"evaporation: water turning into vapour\ncondensation: vapour turning back into water\nprecipitation: rain, snow or hail"}
              value={vocabInput}
              onChange={(e) => setVocabInput(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Activity type</Label>
              <Select value={activity} onValueChange={(v) => setActivity(v as ActivityType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Number of items: <span className="font-semibold text-foreground">{maxItems}</span></Label>
              <Slider value={[maxItems]} min={3} max={16} step={1} onValueChange={(v) => setMaxItems(v[0])} />
              <p className="text-[11px] text-muted-foreground">Fewer items = simpler. Adjust for the learner.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={handleBuildFromList} disabled={suggesting}>
              <Wand2 className="w-4 h-4 mr-1.5" />Build activity
            </Button>
            <Button variant="secondary" onClick={handleSuggest} disabled={suggesting}>
              {suggesting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
              Suggest vocabulary with AI
            </Button>
            {built && (
              <>
                <Button variant="outline" onClick={() => setShowAnswers((s) => !s)}>
                  {showAnswers ? <EyeOff className="w-4 h-4 mr-1.5" /> : <Eye className="w-4 h-4 mr-1.5" />}
                  {showAnswers ? "Hide answers" : "Show answers"}
                </Button>
                <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" />Print</Button>
                <Button variant="ghost" onClick={clearAll}><Eraser className="w-4 h-4 mr-1.5" />Clear</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Output (prints) ─────────────────────────────────────────────── */}
      {built && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-center">
            {topic.trim() || "Vocabulary Activity"}
            {" — "}
            {ACTIVITY_OPTIONS.find((o) => o.value === activity)?.label}
          </h2>

          {activity === "wordsearch" && wordsearch && (
            <Card><CardContent className="p-4 space-y-4">
              <table className="mx-auto border-collapse">
                <tbody>
                  {wordsearch.grid.map((row, r) => (
                    <tr key={r}>
                      {row.map((ch, c) => (
                        <td key={c} className="border border-border w-8 h-8 sm:w-9 sm:h-9 text-center align-middle text-base font-bold uppercase">{ch}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-wrap justify-center gap-2">
                {effectiveVocab.map((v) => (
                  <span key={v.term} className="rounded-full border px-3 py-1 text-sm font-semibold uppercase">{v.term}</span>
                ))}
              </div>
              {showAnswers && wordsearch.placements.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Answers: {wordsearch.placements.map((p) => `${p.word} (r${p.row + 1},c${p.col + 1} ${p.dir})`).join("  ·  ")}
                </p>
              )}
            </CardContent></Card>
          )}

          {activity === "crossword" && crossword && (
            <Card><CardContent className="p-4 space-y-4">
              {crossword.grid.length > 0 ? (
                <table className="mx-auto border-collapse">
                  <tbody>
                    {crossword.grid.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c} className={`w-9 h-9 text-center align-middle text-base font-bold uppercase ${cell === "#" ? "bg-muted" : "border border-border"}`}>
                            {showAnswers && cell !== "#" ? cell : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-center text-sm text-muted-foreground">Add definitions (term: meaning) so clues can be generated.</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                {(["across", "down"] as const).map((dir) => (
                  <div key={dir}>
                    <h3 className="font-bold capitalize mb-1">{dir}</h3>
                    <ol className="space-y-1 text-sm">
                      {crossword.clues.filter((cl) => cl.dir === dir).map((cl) => (
                        <li key={`${cl.num}-${cl.dir}`}><span className="font-semibold">{cl.num}.</span> {cl.clue}{showAnswers && <span className="text-muted-foreground"> — {cl.answer}</span>}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}

          {activity === "matching" && matching && (
            <Card><CardContent className="p-4">
              {matching.left.length > 0 ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    {matching.left.map((l, i) => (
                      <div key={i} className="rounded-lg border-2 p-3 text-sm font-semibold flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-brand-light text-brand flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        {l}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {matching.right.map((rg, i) => (
                      <div key={i} className="rounded-lg border-2 p-3 text-sm flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                        {rg}
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-center text-sm text-muted-foreground">Add definitions (term: meaning) so pairs can be made.</p>}
              {showAnswers && matching.left.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground text-center">
                  Answers: {matching.key.map((origIdx, i) => `${i + 1}→${String.fromCharCode(65 + i)} (${matching.left[origIdx]})`).join("  ·  ")}
                </p>
              )}
            </CardContent></Card>
          )}

          {activity === "cloze" && (
            <Card><CardContent className="p-4 space-y-3">
              {cloze ? (
                <>
                  {cloze.wordBank && cloze.wordBank.length > 0 && (
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Word bank</p>
                      <div className="flex flex-wrap gap-2">
                        {cloze.wordBank.map((w, i) => <span key={i} className="rounded-full border bg-white px-3 py-1 text-sm font-semibold">{w}</span>)}
                      </div>
                    </div>
                  )}
                  <p className="text-base leading-loose whitespace-pre-wrap">{cloze.rendered}</p>
                  {showAnswers && (
                    <p className="text-xs text-muted-foreground">Answers: {cloze.blanks.map((b) => `[${b.num}] ${b.answer}`).join("  ·  ")}</p>
                  )}
                </>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Fill-the-gaps needs a paragraph. Use <span className="font-medium text-foreground">Suggest vocabulary with AI</span> to generate one automatically.
                </p>
              )}
            </CardContent></Card>
          )}

          <p className="text-center text-[11px] text-muted-foreground">
            Tip: every activity works on paper and on screen. Reduce the number of items for a simpler version.
          </p>
        </div>
      )}
    </div>
  );
}
