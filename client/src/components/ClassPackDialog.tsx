/**
 * ClassPackDialog — Phase 4 / FEAT-004
 *
 * One-click "differentiate this worksheet for every pupil in my class" tool.
 * The teacher picks pupils, an optional tier mode, and the dialog runs the
 * existing `aiScaffoldExistingWorksheet` and `aiDifferentiateExistingWorksheet`
 * endpoints sequentially, then opens a printable booklet (one differentiated
 * mini-worksheet per pupil) in a new window.
 *
 *   - Sequential generation with progress bar (cancellable).
 *   - Failures fall back to the base sheet so the booklet always prints.
 *   - £0 cost: re-uses existing free-tier endpoints.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/inline-switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  Loader2,
  StopCircle,
  Printer,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from "lucide-react";
import {
  runClassPack,
  openClassPackWindow,
  type ClassPackBaseWorksheet,
  type ClassPackProgress,
  type ClassPackResult,
} from "@/lib/class-pack";
import type { Child } from "@/contexts/AppContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All registered pupils. */
  pupils: Child[];
  /** Generated worksheet to base the pack on. */
  worksheet: ClassPackBaseWorksheet | null;
  /** Optional default-selected ids (e.g. from class register). */
  initialSelectedIds?: string[];
}

type TierMode = "auto" | "foundation" | "higher" | "none";

export function ClassPackDialog({
  open,
  onOpenChange,
  pupils: allPupils,
  worksheet,
  initialSelectedIds,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedIds || []));
  const [yearFilter, setYearFilter] = useState<string>("__all__");
  const [tierMode, setTierMode] = useState<TierMode>("auto");
  const [applyScaffold, setApplyScaffold] = useState(true);
  const [includeCover, setIncludeCover] = useState(true);
  const [includeTeacherSummary, setIncludeTeacherSummary] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<ClassPackProgress | null>(null);
  const [result, setResult] = useState<ClassPackResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset state on open / close so each generation starts clean.
  useEffect(() => {
    if (!open) {
      setProgress(null);
      setResult(null);
      setRunning(false);
      abortRef.current?.abort();
      abortRef.current = null;
    } else if (initialSelectedIds && initialSelectedIds.length > 0) {
      setSelected(new Set(initialSelectedIds));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const yearGroups = useMemo(() => {
    const set = new Set<string>();
    allPupils.forEach((c) => {
      if (c.yearGroup) set.add(c.yearGroup);
    });
    return Array.from(set).sort();
  }, [allPupils]);

  const visiblePupils = useMemo(() => {
    return allPupils.filter((c) => yearFilter === "__all__" || c.yearGroup === yearFilter);
  }, [allPupils, yearFilter]);

  const allVisibleSelected =
    visiblePupils.length > 0 && visiblePupils.every((c) => selected.has(c.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visiblePupils.forEach((c) => next.delete(c.id));
      } else {
        visiblePupils.forEach((c) => next.add(c.id));
      }
      return next;
    });
  }

  async function handleGenerate() {
    if (!worksheet) {
      toast.error("Generate or open a worksheet first.");
      return;
    }
    const pupils = allPupils.filter((c) => selected.has(c.id));
    if (pupils.length === 0) {
      toast.error("Pick at least one pupil.");
      return;
    }
    if (pupils.length > 30) {
      const ok = window.confirm(
        `You're about to differentiate this sheet for ${pupils.length} pupils. That will take a few minutes. Continue?`,
      );
      if (!ok) return;
    }

    setRunning(true);
    setResult(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await runClassPack({
        base: worksheet,
        pupils,
        options: {
          tierMode,
          applySendScaffold: applyScaffold,
          includeCoverPage: includeCover,
          includeTeacherSummary,
        },
        onProgress: setProgress,
        signal: ctrl.signal,
      });
      setResult(res);
      const fallbacks = res.pupils.filter((p) => p.fellBack).length;
      if (fallbacks > 0) {
        toast.warning(
          `Class pack ready — ${fallbacks} pupil${fallbacks === 1 ? "" : "s"} fell back to the base sheet.`,
        );
      } else {
        toast.success(`Class pack ready — ${res.pupils.length} differentiated copies.`);
      }
    } catch (e) {
      toast.error(`Class pack failed: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setRunning(false);
    toast.info("Stopped — partial pack discarded.");
  }

  function openBooklet(viewMode: "teacher" | "student") {
    if (!result) return;
    const win = openClassPackWindow(result, {
      viewMode,
      includeCoverPage: includeCover,
      includeTeacherSummary: includeTeacherSummary,
    });
    if (!win) {
      toast.error("Browser blocked the pop-up. Please allow pop-ups for Adaptly.");
    }
  }

  function printBooklet(viewMode: "teacher" | "student") {
    if (!result) return;
    const win = openClassPackWindow(result, {
      viewMode,
      includeCoverPage: includeCover,
      includeTeacherSummary: includeTeacherSummary,
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

  const pct = progress
    ? Math.min(100, Math.round((progress.current / Math.max(1, progress.total)) * 100))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Class pack — one-click differentiation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Pick pupils. Adaptly will run a SEND scaffold + (optional) tier shift
            per pupil and combine the results into a single printable booklet.
            Each pupil's copy is on its own page.
          </p>

          {/* Tier + scaffold options */}
          <div className="rounded-lg border p-3 space-y-3 bg-muted/40">
            <div>
              <Label className="text-xs font-semibold">Difficulty tier</Label>
              <RadioGroup
                value={tierMode}
                onValueChange={(v) => setTierMode(v as TierMode)}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1"
                disabled={running}
              >
                {(
                  [
                    { v: "auto", lbl: "Auto by need" },
                    { v: "none", lbl: "Keep base" },
                    { v: "foundation", lbl: "All Foundation" },
                    { v: "higher", lbl: "All Higher" },
                  ] as const
                ).map((opt) => (
                  <Label
                    key={opt.v}
                    htmlFor={`tier-${opt.v}`}
                    className={`flex items-center gap-2 text-xs cursor-pointer p-2 rounded border ${
                      tierMode === opt.v ? "border-brand bg-brand-light/40" : "border-border/50"
                    }`}
                  >
                    <RadioGroupItem value={opt.v} id={`tier-${opt.v}`} className="h-3.5 w-3.5" />
                    {opt.lbl}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs cursor-pointer" htmlFor="scaffold-switch">
                Add SEND scaffolds per pupil's primary need
              </Label>
              <Switch
                id="scaffold-switch"
                checked={applyScaffold}
                onCheckedChange={setApplyScaffold}
                disabled={running}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs cursor-pointer" htmlFor="cover-switch">
                  Cover page
                </Label>
                <Switch
                  id="cover-switch"
                  checked={includeCover}
                  onCheckedChange={setIncludeCover}
                  disabled={running}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs cursor-pointer" htmlFor="teacher-summary-switch">
                  Teacher crib sheet
                </Label>
                <Switch
                  id="teacher-summary-switch"
                  checked={includeTeacherSummary}
                  onCheckedChange={setIncludeTeacherSummary}
                  disabled={running}
                />
              </div>
            </div>
          </div>

          {/* Pupil picker */}
          <div className="rounded-lg border">
            <div className="flex items-center justify-between p-2 border-b bg-muted/20 gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold">
                  {selected.size} of {allPupils.length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Select value={yearFilter} onValueChange={setYearFilter} disabled={running}>
                  <SelectTrigger className="h-7 w-[140px] text-xs">
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All years</SelectItem>
                    {yearGroups.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={toggleAll}
                  disabled={running || visiblePupils.length === 0}
                >
                  {allVisibleSelected ? "Clear visible" : "Select all visible"}
                </Button>
              </div>
            </div>
            <div className="max-h-[260px] overflow-y-auto divide-y">
              {visiblePupils.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground italic">
                  {allPupils.length === 0
                    ? "Register pupils first to use Class pack."
                    : "No pupils match this filter."}
                </p>
              ) : (
                visiblePupils.map((c) => (
                  <label
                    key={c.id}
                    htmlFor={`cp-pupil-${c.id}`}
                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/30"
                  >
                    <Checkbox
                      id={`cp-pupil-${c.id}`}
                      checked={selected.has(c.id)}
                      onCheckedChange={() => toggle(c.id)}
                      disabled={running}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{c.name || c.code || "(unnamed)"}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {c.yearGroup || "—"}
                        {c.sendNeed ? ` · ${c.sendNeed}` : ""}
                      </div>
                    </div>
                    {c.sendNeed && (
                      <Badge variant="outline" className="text-[10px]">
                        {c.sendNeed}
                      </Badge>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Progress */}
          {(running || progress) && (
            <div className="rounded-lg border bg-emerald-50/60 border-emerald-200 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {running ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span className="font-semibold text-emerald-800">
                    {progress
                      ? `Pupil ${progress.current} of ${progress.total} — ${progress.pupilName}`
                      : "Starting…"}
                  </span>
                </div>
                {progress?.message && (
                  <span className="text-emerald-700 italic">{progress.message}</span>
                )}
              </div>
              <Progress value={pct} />
            </div>
          )}

          {result && !running && (
            <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
              <div className="text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Booklet ready — {result.pupils.length} differentiated copies
                {result.pupils.some((p) => p.fellBack) && (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-700">
                    <AlertTriangle className="w-3 h-3" />
                    {result.pupils.filter((p) => p.fellBack).length} fell back
                  </span>
                )}
              </div>
              <ul className="text-[11px] text-muted-foreground max-h-[120px] overflow-y-auto space-y-0.5 pl-3 list-disc">
                {result.pupils.map((p) => (
                  <li key={p.child.id}>
                    <strong>{p.child.name || p.child.code}</strong>: {p.adaptationNote}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-end pt-1">
            {running ? (
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <StopCircle className="w-3.5 h-3.5 mr-1.5" /> Stop
              </Button>
            ) : result ? (
              <>
                <Button variant="outline" size="sm" onClick={() => openBooklet("teacher")}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open (teacher)
                </Button>
                <Button variant="outline" size="sm" onClick={() => openBooklet("student")}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open (pupils)
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => printBooklet("student")}
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Print booklet
                </Button>
                <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                  Build another
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleGenerate}
                disabled={!worksheet || selected.size === 0}
              >
                <Layers className="w-3.5 h-3.5 mr-1.5" />
                Build pack ({selected.size} pupils)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ClassPackDialog;
