/**
 * DifferentiateEnhancementsPanel — embedded next to the Differentiate
 * output. Surfaces the five improvements (OCR, diff view, multi-need
 * stacking, source-respecting, reading-age dial).
 */
import { useMemo, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/inline-switch";
import { Label } from "@/components/ui/label";
import {
  Sparkles, Camera, GitCompare, Layers as LayersIcon, Lock, BookOpen,
  AlertTriangle, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  loadTesseractOCR, cleanupOcrText, diffAdaptation, stackAdaptations,
  stackedSystemSuffix, fleschKincaidAge, flagDifficultWords,
  ADAPTATION_PRIORITY,
} from "@/lib/differentiate-enhancements";

interface Props {
  /** The original (un-adapted) source text. */
  before: string;
  /** The adapted output. */
  after: string;
  /** Selected SEND needs (array, supports multi-need stacking). */
  needs: string[];
  setNeeds: (next: string[]) => void;
  sourceRespecting: boolean;
  setSourceRespecting: (v: boolean) => void;
  /** Optional callback when the OCR'd text is ready to be applied as the source. */
  onOcrText?: (text: string) => void;
}

const SEND_OPTIONS = Object.keys(ADAPTATION_PRIORITY);

export default function DifferentiateEnhancementsPanel(props: Props) {
  const { before, after, needs, setNeeds, sourceRespecting, setSourceRespecting, onOcrText } = props;

  const [targetAge, setTargetAge] = useState(10);
  const [ocrLoading, setOcrLoading] = useState(false);

  const diff = useMemo(() => diffAdaptation(before || "", after || ""), [before, after]);
  const ordered = useMemo(() => stackAdaptations(needs), [needs]);
  const livePreviewAge = useMemo(() => fleschKincaidAge(after || before || ""), [after, before]);
  const tooHard = useMemo(() => flagDifficultWords(after || before || "", targetAge), [after, before, targetAge]);

  function toggleNeed(n: string) {
    if (needs.includes(n)) setNeeds(needs.filter(x => x !== n));
    else if (needs.length >= 3) toast("You can stack at most 3 SEND profiles.");
    else setNeeds([...needs, n]);
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setOcrLoading(true);
    try {
      const recognise = await loadTesseractOCR();
      const text = await recognise(file);
      onOcrText?.(text);
      toast.success("Text extracted from photo.");
    } catch (e) {
      toast.error("OCR failed. Try a clearer photo or paste text instead.");
    }
    setOcrLoading(false);
  }

  return (
    <Card className="border-purple-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <p className="text-sm font-bold">Differentiate Enhancements</p>
        </div>

        <Tabs defaultValue="diff">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="ocr">OCR upload</TabsTrigger>
            <TabsTrigger value="diff">Diff view</TabsTrigger>
            <TabsTrigger value="stack">Need stack</TabsTrigger>
            <TabsTrigger value="source">Source-respect</TabsTrigger>
            <TabsTrigger value="age">Reading age</TabsTrigger>
          </TabsList>

          {/* 1. OCR */}
          <TabsContent value="ocr" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Snap a textbook page on your phone, or upload a photo / scanned PDF.
            </p>
            <Label htmlFor="ocr-file" className="block">
              <input
                id="ocr-file"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
                className="block w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-purple-200 file:bg-purple-50 file:text-purple-700"
                disabled={ocrLoading}
              />
            </Label>
            {ocrLoading && (
              <div className="flex items-center gap-2 text-xs text-purple-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recognising text — first run downloads the OCR model (~6 MB).
              </div>
            )}
          </TabsContent>

          {/* 2. Adaptation diff view */}
          <TabsContent value="diff" className="space-y-2 pt-3">
            {!before || !after ? (
              <p className="text-xs text-muted-foreground italic">Run a differentiation to see the side-by-side diff.</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {diff.map((d, i) => <DiffRow key={i} d={d} />)}
              </div>
            )}
          </TabsContent>

          {/* 3. Multiple-need stacking */}
          <TabsContent value="stack" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Pick up to three SEND profiles. The order below shows the layering order the AI will apply.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SEND_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => toggleNeed(n)}
                  className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                    needs.includes(n) ? "bg-purple-600 text-white border-purple-600" : "bg-white border-border hover:border-foreground/30"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {ordered.length > 1 && (
              <div className="text-[11px] mt-2">
                <p className="text-muted-foreground mb-1">Layering order:</p>
                <ol className="list-decimal pl-5 space-y-0.5">
                  {ordered.map((n, i) => <li key={n}><strong>{n}</strong></li>)}
                </ol>
              </div>
            )}
          </TabsContent>

          {/* 4. Source-respecting */}
          <TabsContent value="source" className="space-y-2 pt-3">
            <div className="flex items-center gap-2">
              <Switch id="source-resp" checked={sourceRespecting} onCheckedChange={setSourceRespecting} />
              <Label htmlFor="source-resp" className="text-xs cursor-pointer">
                Preserve numbering, headings and branding
              </Label>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Use this when adapting purchased schemes (White Rose, Twinkl) to keep the original look-and-feel.
            </p>
          </TabsContent>

          {/* 5. Reading age dial */}
          <TabsContent value="age" className="space-y-2 pt-3">
            <Label className="text-xs flex items-center justify-between">
              Target reading age
              <span className="text-[10px] text-muted-foreground">{targetAge} yrs · current ≈ {livePreviewAge}</span>
            </Label>
            <Slider value={[targetAge]} onValueChange={([v]) => setTargetAge(v)} min={6} max={16} step={0.5} className="mt-2" />
            {tooHard.length > 0 ? (
              <div>
                <p className="text-[11px] text-amber-700 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> {tooHard.length} word{tooHard.length === 1 ? "" : "s"} above target:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tooHard.slice(0, 24).map(w => <Badge key={w} variant="outline" className="text-[10px]">{w}</Badge>)}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-emerald-700">No flagged words above target.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function DiffRow({ d }: { d: ReturnType<typeof diffAdaptation>[number] }) {
  const styles = {
    "vocab-swap":       "bg-amber-50 border-amber-200",
    "sentence-shorter": "bg-blue-50 border-blue-200",
    "scaffold-added":   "bg-purple-50 border-purple-200",
    "scaffold-stem":    "bg-purple-50 border-purple-200",
    "image-cue":        "bg-pink-50 border-pink-200",
    "added":            "bg-emerald-50 border-emerald-200",
    "removed":          "bg-red-50 border-red-200",
    "unchanged":        "bg-muted/30 border-border/50",
  };
  return (
    <div className={`rounded-md border p-2 text-[11px] space-y-1 ${styles[d.kind]}`}>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] capitalize">{d.kind.replace(/-/g, " ")}</Badge>
        {d.rationale && <span className="text-muted-foreground">{d.rationale}</span>}
      </div>
      {d.before && <p className="line-through text-muted-foreground">{d.before}</p>}
      {d.after && <p>{d.after}</p>}
    </div>
  );
}
