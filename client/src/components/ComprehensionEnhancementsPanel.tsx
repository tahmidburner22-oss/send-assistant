/**
 * ComprehensionEnhancementsPanel — surfaces the five Comprehension Generator
 * improvements: per-level reading-age, cloze, vocab strip, source loader and
 * Bloom tagging. Rendered below the comprehension output.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Gauge, ListChecks, BookOpen, Layers } from "lucide-react";
import {
  computeReadability,
  buildCloze,
  extractVocab,
  vocabStripAsHtml,
  tagAllQuestions,
  bloomDistribution,
  bloomBadgeHtml,
  type BloomLevel,
} from "@/lib/comprehension-enhancements";

interface Props {
  rawOutput: string;
  sourceText: string;
}

const BLOOM_ORDER: BloomLevel[] = [
  "Knowledge", "Comprehension", "Application", "Analysis", "Evaluation", "Creation",
];

function extractLevels(text: string): { support: string; core: string; extension: string } {
  const support = text.match(/\*\*Support\s*Level\*\*([\s\S]*?)(?=\*\*Core\s*Level\*\*|\*\*Extension\s*Level\*\*|$)/i)?.[1] || "";
  const core = text.match(/\*\*Core\s*Level\*\*([\s\S]*?)(?=\*\*Extension\s*Level\*\*|$)/i)?.[1] || "";
  const extension = text.match(/\*\*Extension\s*Level\*\*([\s\S]*?)(?=$)/i)?.[1] || "";
  return { support, core, extension };
}

export default function ComprehensionEnhancementsPanel({ rawOutput, sourceText }: Props) {
  const [clozeEvery, setClozeEvery] = useState(7);

  const levels = useMemo(() => extractLevels(rawOutput), [rawOutput]);
  const ageStats = useMemo(() => ({
    support: levels.support ? computeReadability(levels.support) : null,
    core: levels.core ? computeReadability(levels.core) : null,
    extension: levels.extension ? computeReadability(levels.extension) : null,
    source: sourceText ? computeReadability(sourceText) : null,
  }), [levels, sourceText]);

  const cloze = useMemo(() => (sourceText ? buildCloze(sourceText, clozeEvery) : null), [sourceText, clozeEvery]);
  const vocab = useMemo(() => (sourceText ? extractVocab(sourceText, 8) : []), [sourceText]);
  const tagged = useMemo(() => (rawOutput ? tagAllQuestions(rawOutput) : []), [rawOutput]);
  const dist = useMemo(() => bloomDistribution(tagged), [tagged]);
  const totalQs = tagged.length || 1;

  function copyCloze() {
    if (!cloze) return;
    const text = `${cloze.passage}\n\n--- ANSWERS ---\n${cloze.answers.map((a, i) => `${i + 1}. ${a}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    toast.success("Cloze passage copied with answer key.");
  }

  function printVocab() {
    const html = vocabStripAsHtml(vocab);
    const w = window.open("", "_blank", "width=900,height=600");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Pre-teach vocab</title></head><body>${html}<script>window.print();<\/script></body></html>`);
    w.document.close();
  }

  if (!rawOutput && !sourceText) return null;

  return (
    <Card className="border-sky-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-600" />
          <p className="text-sm font-bold">Comprehension extras</p>
        </div>

        <Tabs defaultValue="age">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="age">Reading age</TabsTrigger>
            <TabsTrigger value="cloze">Cloze</TabsTrigger>
            <TabsTrigger value="vocab">Pre-teach vocab</TabsTrigger>
            <TabsTrigger value="bloom">Bloom mix</TabsTrigger>
          </TabsList>

          <TabsContent value="age" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Flesch-Kincaid grade applied to each generated level — verifies that "Support" really
              is easier than "Core".
            </p>
            <div className="grid sm:grid-cols-4 gap-2 text-[11px]">
              {[
                { key: "source", label: "Source" },
                { key: "support", label: "Support" },
                { key: "core", label: "Core" },
                { key: "extension", label: "Extension" },
              ].map(({ key, label }) => {
                const stats = (ageStats as Record<string, ReturnType<typeof computeReadability> | null>)[key];
                if (!stats) {
                  return (
                    <div key={key} className="rounded border border-dashed p-2 text-muted-foreground">
                      <div className="font-semibold">{label}</div>
                      <div>Not detected</div>
                    </div>
                  );
                }
                return (
                  <div key={key} className="rounded border bg-white p-2">
                    <div className="font-semibold text-sky-700">{label}</div>
                    <div className="text-foreground text-base font-bold">~age {stats.approxUkReadingAge}</div>
                    <Badge variant="outline" className="mt-1 text-[10px]">{stats.band}</Badge>
                    <div className="text-muted-foreground mt-1">{stats.words} words</div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="cloze" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Auto-generates a cloze (gap-fill) version of the source passage by replacing every
              Nth content word with a numbered blank.
            </p>
            <div className="flex items-center gap-2 text-[11px]">
              <span>Blank every</span>
              <select
                value={clozeEvery}
                onChange={(e) => setClozeEvery(Number(e.target.value))}
                className="h-7 px-2 rounded border bg-background text-xs"
              >
                {[5, 6, 7, 8, 10].map((n) => (
                  <option key={n} value={n}>{n} content words</option>
                ))}
              </select>
              <span>({cloze?.answers.length || 0} blanks)</span>
            </div>
            {cloze ? (
              <>
                <div className="rounded-md border bg-muted/30 p-2 text-[12px] whitespace-pre-wrap leading-6 max-h-56 overflow-y-auto">
                  {cloze.passage}
                </div>
                <details className="text-[11px]">
                  <summary className="cursor-pointer text-sky-700 font-semibold">Answer key ({cloze.answers.length})</summary>
                  <ol className="mt-1 grid grid-cols-2 gap-1 list-decimal pl-5">
                    {cloze.answers.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ol>
                </details>
                <Button size="sm" variant="outline" onClick={copyCloze} className="gap-1.5">
                  <ListChecks className="w-3.5 h-3.5" /> Copy passage + answers
                </Button>
              </>
            ) : (
              <p className="text-[11px] italic text-muted-foreground">Provide a source passage to enable cloze generation.</p>
            )}
          </TabsContent>

          <TabsContent value="vocab" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Auto-extracted Tier 2/3 candidate words with the sentences they appear in, ready
              to glue at the top of the worksheet.
            </p>
            <div
              className="rounded-md border bg-white p-2"
              dangerouslySetInnerHTML={{ __html: vocabStripAsHtml(vocab) }}
            />
            {vocab.length > 0 && (
              <Button size="sm" variant="outline" onClick={printVocab} className="gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Print vocab strip
              </Button>
            )}
          </TabsContent>

          <TabsContent value="bloom" className="space-y-2 pt-3">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <p className="text-[11px] font-semibold">Bloom's taxonomy distribution ({tagged.length} questions detected)</p>
            </div>
            {tagged.length === 0 ? (
              <p className="text-[11px] italic text-muted-foreground">No questions detected yet — generate first.</p>
            ) : (
              <>
                <div className="space-y-1">
                  {BLOOM_ORDER.map((level) => {
                    const n = dist[level];
                    const pct = Math.round((n / totalQs) * 100);
                    return (
                      <div key={level} className="flex items-center gap-2 text-[11px]">
                        <span className="w-24" dangerouslySetInnerHTML={{ __html: bloomBadgeHtml(level) }} />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-12 text-right text-muted-foreground">{n} · {pct}%</span>
                      </div>
                    );
                  })}
                </div>
                <details className="text-[11px]">
                  <summary className="cursor-pointer text-sky-700 font-semibold">Per-question tags</summary>
                  <ul className="mt-1 space-y-1 max-h-48 overflow-y-auto">
                    {tagged.map((q) => (
                      <li key={q.index} className="flex items-start gap-1.5">
                        <span dangerouslySetInnerHTML={{ __html: bloomBadgeHtml(q.bloom) }} />
                        <span className="flex-1 text-foreground/80">{q.raw.slice(0, 140)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            )}
            <Badge variant="outline" className="text-[10px]">
              <Gauge className="w-3 h-3 mr-1" /> Tagged automatically by question verb
            </Badge>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
