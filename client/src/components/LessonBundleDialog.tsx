/**
 * LessonBundleDialog — Phase 4 / FEAT-009
 *
 * Builds and opens a multi-modal lesson bundle (starter slide + Now/Next/Then
 * visual + exit ticket) for the currently-generated worksheet. Single-shot
 * AI call (~£0 on free-tier providers); deterministic fallback so the bundle
 * always prints even when the AI is unavailable.
 */
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BookOpenCheck,
  Loader2,
  Printer,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Wand2,
} from "lucide-react";
import {
  runLessonBundle,
  openLessonBundleWindow,
  type LessonBundle,
  type LessonBundleBaseWorksheet,
} from "@/lib/lesson-bundle";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worksheet: LessonBundleBaseWorksheet | null;
}

export function LessonBundleDialog({ open, onOpenChange, worksheet }: Props) {
  const [duration, setDuration] = useState(50);
  const [includeCover, setIncludeCover] = useState(true);
  const [building, setBuilding] = useState(false);
  const [bundle, setBundle] = useState<LessonBundle | null>(null);

  useEffect(() => {
    if (!open) {
      setBundle(null);
      setBuilding(false);
    }
  }, [open]);

  async function handleBuild() {
    if (!worksheet) {
      toast.error("Generate a worksheet first.");
      return;
    }
    setBuilding(true);
    setBundle(null);
    try {
      const b = await runLessonBundle({
        worksheet,
        duration: Math.max(15, Math.min(120, Math.round(duration))) || 50,
      });
      setBundle(b);
      if (b.usedFallback) {
        toast.warning(
          "Lesson bundle ready, but AI was unavailable — template placeholders were used. Check the starter and exit ticket before printing.",
        );
      } else {
        toast.success("Lesson bundle ready");
      }
    } catch (e) {
      toast.error(`Lesson bundle failed: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setBuilding(false);
    }
  }

  function open_(viewMode: "teacher" | "student") {
    if (!bundle) return;
    const win = openLessonBundleWindow(bundle, {
      viewMode,
      includeCoverPage: includeCover,
    });
    if (!win) {
      toast.error("Browser blocked the pop-up. Please allow pop-ups for Adaptly.");
    }
  }

  function print_(viewMode: "teacher" | "student") {
    if (!bundle) return;
    const win = openLessonBundleWindow(bundle, {
      viewMode,
      includeCoverPage: includeCover,
    });
    if (!win) {
      toast.error("Browser blocked the pop-up. Please allow pop-ups for Adaptly.");
      return;
    }
    setTimeout(() => {
      try {
        win.print();
      } catch {
        /* user can press Cmd+P */
      }
    }, 800);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-blue-600" />
            Lesson bundle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Auto-pair this worksheet with a starter slide, a Now/Next/Then visual
            for SEND pupils, and a 3-question exit ticket — all ready to print.
            One AI call, free-tier providers, no new dependencies.
          </p>

          {/* Settings */}
          <div className="rounded-lg border p-3 space-y-3 bg-muted/40">
            <div>
              <Label className="text-xs" htmlFor="bundle-duration">
                Lesson length (minutes)
              </Label>
              <Input
                id="bundle-duration"
                type="number"
                min={15}
                max={120}
                step={5}
                value={duration}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setDuration(isFinite(n) ? n : 50);
                }}
                className="mt-1 h-8 text-sm"
                disabled={building}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Now/Next/Then times scale to this duration (default 5 / 35 / 10 for a 50-min lesson).
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs cursor-pointer" htmlFor="bundle-cover-switch">
                Include cover page
              </Label>
              <Switch
                id="bundle-cover-switch"
                checked={includeCover}
                onCheckedChange={setIncludeCover}
                disabled={building}
              />
            </div>
          </div>

          {/* Status */}
          {building && (
            <div className="flex items-center gap-2 rounded-lg border bg-blue-50 border-blue-200 p-3 text-xs text-blue-800">
              <Loader2 className="w-4 h-4 animate-spin" />
              Asking the AI for a starter + exit ticket…
            </div>
          )}

          {bundle && !building && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="text-xs font-semibold flex items-center gap-2 flex-wrap">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Bundle ready
                {bundle.usedFallback && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                    Fallback used
                  </Badge>
                )}
              </div>
              <ul className="text-[11px] text-muted-foreground space-y-0.5 pl-4 list-disc">
                <li>
                  <strong>Starter:</strong> {bundle.starter.questions.length} retrieval
                  question{bundle.starter.questions.length === 1 ? "" : "s"} ·{" "}
                  {bundle.starter.keyVocab.length} key term
                  {bundle.starter.keyVocab.length === 1 ? "" : "s"}
                </li>
                <li>
                  <strong>Now/Next/Then:</strong> {bundle.flow.now.minutes}+
                  {bundle.flow.next.minutes}+{bundle.flow.then.minutes} min
                </li>
                <li>
                  <strong>Exit ticket:</strong> {bundle.exit.questions.length} questions
                  with teacher key
                </li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-end pt-1">
            {bundle && !building ? (
              <>
                <Button variant="outline" size="sm" onClick={() => open_("teacher")}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open (teacher)
                </Button>
                <Button variant="outline" size="sm" onClick={() => open_("student")}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open (pupils)
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => print_("student")}
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setBundle(null)}>
                  Rebuild
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleBuild}
                disabled={!worksheet || building}
              >
                {building ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Building…
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                    Build lesson bundle
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LessonBundleDialog;
