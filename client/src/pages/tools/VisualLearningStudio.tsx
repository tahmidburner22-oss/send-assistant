/**
 * VisualLearningStudio — SEND Visual Learning Studio (Tool T4).
 * Inspired by MyLens, re-imagined SEND-first.
 *
 * Turns a topic into an accessible, code-rendered SVG visual (mind map /
 * flowchart / cycle / timeline) using the EXISTING free `PresentationDiagram`
 * engine — the "MyLens approach": the LLM emits STRUCTURED DATA and the SVG is
 * drawn deterministically in code (always relevant, print-perfect, $0, no image
 * model). Gemini-independent (server fallback chain).
 *
 * SEND-first twist: **progressive disclosure** — reveal one node at a time with
 * a slider/Next button so the learner is never overwhelmed, a calm low-contrast
 * palette, and a clean print layout.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Network, Sparkles, Printer, Loader2, ChevronRight, RotateCcw } from "lucide-react";
import { callAI, parseWithFixes } from "@/lib/ai";
import PresentationDiagram from "@/components/PresentationDiagram";

// Mirrors PresentationDiagram's internal DiagramData (kept local — the engine
// doesn't export its type; this is the documented contract it consumes).
interface DiagramData {
  kind: "flowchart" | "venn" | "timeline" | "circuit" | "cell" | "water-cycle" | "food-chain" | "equation-graph" | "labelled-box" | "cycle";
  title?: string;
  nodes: Array<{ id: string; label: string; group?: string }>;
  edges?: Array<{ from: string; to: string; label?: string; style?: "arrow" | "line" | "dashed" }>;
}

// Calm, low-stimulus SEND palette (no harsh contrasts).
const CALM_THEME = {
  primary: "#4338ca",
  secondary: "#6366f1",
  accent: "#0ea5e9",
  text: "#1e293b",
  bg: "#f8fafc",
  light: "#e0e7ff",
};

type VisualKind = "flowchart" | "cycle" | "timeline";

const VISUAL_OPTIONS: { value: VisualKind; label: string; hint: string }[] = [
  { value: "flowchart", label: "Mind map / flowchart", hint: "Branches & connections" },
  { value: "cycle", label: "Cycle", hint: "Repeating process (e.g. water cycle)" },
  { value: "timeline", label: "Timeline", hint: "Events in order" },
];

export default function VisualLearningStudio() {
  const [topic, setTopic] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [kind, setKind] = useState<VisualKind>("flowchart");
  const [diagram, setDiagram] = useState<DiagramData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState(0); // progressive disclosure cursor

  async function handleGenerate() {
    const t = topic.trim();
    if (!t) {
      toast.error("Enter a topic, e.g. 'The Water Cycle' or 'Life cycle of a butterfly'.");
      return;
    }
    setLoading(true);
    try {
      const shape =
        kind === "cycle"
          ? '{"kind":"cycle","title":"...","nodes":[{"id":"n1","label":"..."}]}'
          : kind === "timeline"
            ? '{"kind":"timeline","title":"...","nodes":[{"id":"n1","label":"..."}]}'
            : '{"kind":"flowchart","title":"...","nodes":[{"id":"n1","label":"..."}],"edges":[{"from":"n1","to":"n2"}]}';
      const system =
        "You are a UK SEND teacher building an accessible learning visual. Return ONLY " +
        `JSON of the form ${shape}. Use 4-6 nodes MAX (SEND learners are easily overwhelmed). ` +
        "Each label is 1-4 plain words. For flowchart, add edges connecting the nodes in a " +
        "sensible order (a central idea linking to branches, or a step sequence). For cycle, " +
        "order the nodes so the last leads back to the first. For timeline, order nodes " +
        "chronologically. British English, age-appropriate for the year group.";
      const user = `Topic: ${t}\nVisual type: ${kind}${yearGroup ? `\nYear group: ${yearGroup}` : ""}`;
      const { text } = await callAI(system, user, 700, { responseFormat: "json_object" });
      const parsed = parseWithFixes(text) as Partial<DiagramData>;
      const nodes = Array.isArray(parsed?.nodes)
        ? parsed.nodes
            .map((n, i) => ({ id: String(n?.id || `n${i + 1}`), label: String(n?.label || "").trim() }))
            .filter((n) => n.label)
            .slice(0, 6)
        : [];
      if (nodes.length === 0) {
        toast.error("AI didn't return usable content — try a clearer topic.");
        return;
      }
      const edges = Array.isArray(parsed?.edges)
        ? parsed.edges
            .map((e) => ({ from: String(e?.from || ""), to: String(e?.to || ""), label: e?.label ? String(e.label) : undefined }))
            .filter((e) => e.from && e.to)
        : undefined;
      const d: DiagramData = { kind: kind === "cycle" ? "cycle" : kind === "timeline" ? "timeline" : "flowchart", title: t, nodes, edges };
      setDiagram(d);
      setReveal(nodes.length); // show all by default; teacher can step back
      toast.success("Visual ready — use the reveal slider for progressive disclosure.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.startsWith("AUTH_REQUIRED") ? "Please log in again to use AI." : "Could not generate the visual — please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Progressive disclosure: show only the first `reveal` nodes (and edges whose
  // endpoints are both revealed).
  const shownDiagram = useMemo<DiagramData | null>(() => {
    if (!diagram) return null;
    const shownNodes = diagram.nodes.slice(0, reveal);
    const shownIds = new Set(shownNodes.map((n) => n.id));
    const shownEdges = (diagram.edges || []).filter((e) => shownIds.has(e.from) && shownIds.has(e.to));
    return { ...diagram, nodes: shownNodes, edges: shownEdges };
  }, [diagram, reveal]);

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="print:hidden">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Network className="w-5 h-5 text-brand" />
          Visual Learning Studio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Turn any topic into an accessible mind map, cycle or timeline. Visuals are
          drawn in code (always relevant, print-perfect, free). Reveal one step at a
          time so learners aren't overwhelmed.
        </p>
      </motion.div>

      <Card className="print:hidden">
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vls-topic">Topic</Label>
              <Input id="vls-topic" placeholder="e.g. The Water Cycle" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vls-year">Year group (optional)</Label>
              <Input id="vls-year" placeholder="e.g. Year 5" value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Visual type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as VisualKind)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VISUAL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label} — {o.hint}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
              Generate visual
            </Button>
            {diagram && <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" />Print</Button>}
          </div>
        </CardContent>
      </Card>

      {diagram && shownDiagram && (
        <div className="space-y-4">
          {/* Progressive-disclosure controls — hidden on print */}
          <Card className="print:hidden">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Reveal: <span className="font-semibold text-foreground">{reveal} of {diagram.nodes.length}</span></Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setReveal(0)}><RotateCcw className="w-3.5 h-3.5 mr-1" />Reset</Button>
                  <Button size="sm" variant="secondary" onClick={() => setReveal((r) => Math.min(diagram.nodes.length, r + 1))} disabled={reveal >= diagram.nodes.length}>
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
              <Slider value={[reveal]} min={0} max={diagram.nodes.length} step={1} onValueChange={(v) => setReveal(v[0])} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mx-auto" style={{ maxWidth: 560, aspectRatio: "400 / 280" }}>
                {reveal > 0 ? (
                  <PresentationDiagram diagram={shownDiagram as any} theme={CALM_THEME} />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Press “Next” to reveal the first part.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
