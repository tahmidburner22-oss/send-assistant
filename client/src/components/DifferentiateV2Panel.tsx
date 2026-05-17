/**
 * DifferentiateV2Panel — surfaces 5 improvements on top of the existing
 * Differentiate page: side-by-side diff, "show me why" rationale, dual output,
 * overlay live preview, and symbol-pack suggester.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, GitCompare, Wand2, Layers, Palette, ImageIcon } from "lucide-react";
import {
  buildDiffView,
  explainAdaptation,
  buildOverlayPreviewHtml,
  PRINT_OVERLAY_COLOURS,
  suggestSymbolSlots,
  symbolPackAsHtml,
  type OverlayId,
} from "@/lib/differentiate-v2-enhancements";

interface Props {
  before: string;
  after: string;
  /** When the parent generates a Stretch sibling this becomes non-empty. */
  stretchVersion?: string;
  onGenerateDual?: () => void;
  dualLoading?: boolean;
}

export default function DifferentiateV2Panel({ before, after, stretchVersion, onGenerateDual, dualLoading }: Props) {
  const [overlay, setOverlay] = useState<OverlayId>("cream");
  const [rationale, setRationale] = useState<string>("");
  const [rationaleLoading, setRationaleLoading] = useState(false);

  const diff = useMemo(() => (before && after ? buildDiffView(before, after) : null), [before, after]);
  const slots = useMemo(() => (after ? suggestSymbolSlots(after) : []), [after]);

  useEffect(() => {
    setRationale("");
  }, [before, after]);

  async function loadRationale() {
    if (!before || !after) return;
    setRationaleLoading(true);
    try {
      const txt = await explainAdaptation(before, after);
      setRationale(txt);
    } catch {
      toast.error("Couldn't generate rationale right now.");
    }
    setRationaleLoading(false);
  }

  if (!before || !after) return null;

  return (
    <Card className="border-purple-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-purple-600" />
          <p className="text-sm font-bold">Differentiate extras</p>
        </div>

        <Tabs defaultValue="diff">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="diff"><GitCompare className="w-3.5 h-3.5 mr-1" />Diff</TabsTrigger>
            <TabsTrigger value="rationale"><Wand2 className="w-3.5 h-3.5 mr-1" />Why?</TabsTrigger>
            <TabsTrigger value="dual"><Layers className="w-3.5 h-3.5 mr-1" />Support + Stretch</TabsTrigger>
            <TabsTrigger value="overlay"><Palette className="w-3.5 h-3.5 mr-1" />Overlay preview</TabsTrigger>
            <TabsTrigger value="symbols"><ImageIcon className="w-3.5 h-3.5 mr-1" />Symbols</TabsTrigger>
          </TabsList>

          <TabsContent value="diff" className="space-y-2 pt-3">
            {diff && (
              <>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {diff.summary.shorter > 0  && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">{diff.summary.shorter} shorter</Badge>}
                  {diff.summary.vocab > 0    && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">{diff.summary.vocab} vocab</Badge>}
                  {diff.summary.scaffold > 0 && <Badge className="bg-blue-100 text-blue-700 border-blue-300">{diff.summary.scaffold} scaffold</Badge>}
                  {diff.summary.visual > 0   && <Badge className="bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300">{diff.summary.visual} visual</Badge>}
                  {diff.summary.added > 0    && <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300">{diff.summary.added} added</Badge>}
                  {diff.summary.removed > 0  && <Badge className="bg-rose-100 text-rose-700 border-rose-300">{diff.summary.removed} removed</Badge>}
                </div>
                <div
                  className="rounded-md border bg-white p-2 max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: diff.html }}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="rationale" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Generates a 90-word teacher-facing rationale referencing concrete observations
              (sentence length, scaffolding, vocabulary tier, visual cues).
            </p>
            <Button size="sm" onClick={loadRationale} disabled={rationaleLoading}>
              {rationaleLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Thinking…</> : <><Wand2 className="w-3.5 h-3.5 mr-1" />Show me why</>}
            </Button>
            {rationale && (
              <div className="rounded-md border bg-purple-50 p-3 text-[12px] leading-6 text-purple-900">
                {rationale}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dual" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Generate a paired <strong>Support + Stretch</strong> version side-by-side so the same lesson
              can serve a mixed-attainment class without two clicks.
            </p>
            <Button size="sm" onClick={onGenerateDual} disabled={dualLoading || !onGenerateDual}>
              {dualLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Generating both…</> : <><Layers className="w-3.5 h-3.5 mr-1" />Generate Support + Stretch</>}
            </Button>
            {stretchVersion && (
              <div className="rounded-md border bg-amber-50 p-3 text-[12px] leading-6 max-h-56 overflow-y-auto whitespace-pre-wrap">
                {stretchVersion}
              </div>
            )}
          </TabsContent>

          <TabsContent value="overlay" className="space-y-2 pt-3">
            <div className="flex items-center gap-2 text-[11px] flex-wrap">
              <span>Overlay:</span>
              {(Object.keys(PRINT_OVERLAY_COLOURS) as OverlayId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setOverlay(id)}
                  className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${overlay === id ? "border-purple-600 ring-2 ring-purple-300" : "border-slate-300"}`}
                  style={{ background: PRINT_OVERLAY_COLOURS[id] }}
                >
                  {id}
                </button>
              ))}
            </div>
            <div
              className="rounded-md border max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: buildOverlayPreviewHtml(after, overlay, 14) }}
            />
            <p className="text-[10px] text-muted-foreground italic">
              Same overlay applies to print and PDF exports above.
            </p>
          </TabsContent>

          <TabsContent value="symbols" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Auto-extracted slots where a Widgit-style symbol would help — useful for ASD/MLD/EAL pupils.
              Each suggestion includes a search query you can drop into your symbol tool of choice.
            </p>
            <div
              className="rounded-md border bg-white p-2"
              dangerouslySetInnerHTML={{ __html: symbolPackAsHtml(slots) }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
