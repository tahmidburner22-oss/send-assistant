/**
 * UnitPackDialog.tsx — FEAT-PC5 (pack-1) · Phase C
 *
 * Single form → live progress checklist → ZIP download. Mounted from the
 * MediumTermPlanner page banner and from the Home "Plan a unit" tile.
 * Stop button calls AbortController; partial results are still downloadable.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Layers, Loader2, StopCircle, Download, AlertTriangle, CheckCircle2, CircleDashed,
} from "lucide-react";

import {
  planUnit,
  executeUnit,
  bundleUnit,
  MAX_LESSONS,
  type AbilityTier,
  type UnitPlan,
  type UnitLessonResult,
  type UnitBundleFormat,
} from "@/lib/unitPack";
import type { ExamBoard } from "@/lib/specPointTaxonomy";

// ─── Constants ─────────────────────────────────────────────────────────────

const SUBJECTS = [
  "English", "Mathematics", "Combined Science", "Biology", "Chemistry", "Physics",
  "History", "Geography", "RE", "Computing", "Art", "Music", "PE",
];
const YEAR_GROUPS = [
  "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12",
];
const ABILITIES: { value: AbilityTier; label: string }[] = [
  { value: "mixed", label: "Mixed ability" },
  { value: "support", label: "Needs support" },
  { value: "foundation", label: "Foundation tier" },
  { value: "higher", label: "Higher tier" },
];
const BOARDS: { value: ExamBoard; label: string }[] = [
  { value: "aqa", label: "AQA" },
  { value: "edexcel", label: "Edexcel" },
  { value: "ocr", label: "OCR" },
];

// ─── Component ─────────────────────────────────────────────────────────────

export interface UnitPackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional pre-fill from the surrounding tool (e.g. MediumTermPlanner). */
  initialSubject?: string;
  initialYearGroup?: string;
  initialTopic?: string;
}

export default function UnitPackDialog({
  open,
  onOpenChange,
  initialSubject,
  initialYearGroup,
  initialTopic,
}: UnitPackDialogProps) {
  // Form state
  const [subject, setSubject] = useState(initialSubject || "Mathematics");
  const [yearGroup, setYearGroup] = useState(initialYearGroup || "Year 10");
  const [topic, setTopic] = useState(initialTopic || "");
  const [weeks, setWeeks] = useState(3);
  const [ability, setAbility] = useState<AbilityTier>("mixed");
  const [board, setBoard] = useState<ExamBoard | "">("");

  // Run state
  const [running, setRunning] = useState(false);
  const [plan, setPlan] = useState<UnitPlan | null>(null);
  const [results, setResults] = useState<UnitLessonResult[]>([]);
  const [statuses, setStatuses] = useState<Record<number, "pending" | "running" | "ok" | "failed">>({});
  const [bundling, setBundling] = useState(false);
  const [aborted, setAborted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Reset on close.
  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      abortRef.current = null;
      setRunning(false);
      setBundling(false);
      setPlan(null);
      setResults([]);
      setStatuses({});
      setAborted(false);
    } else {
      if (initialSubject) setSubject(initialSubject);
      if (initialYearGroup) setYearGroup(initialYearGroup);
      if (initialTopic) setTopic(initialTopic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const previewLessonCount = Math.min(weeks, MAX_LESSONS);
  const completedCount = useMemo(
    () => Object.values(statuses).filter((s) => s === "ok" || s === "failed").length,
    [statuses],
  );
  const failedCount = useMemo(
    () => Object.values(statuses).filter((s) => s === "failed").length,
    [statuses],
  );
  const pct = plan && plan.lessons.length > 0
    ? Math.round((completedCount / plan.lessons.length) * 100)
    : 0;

  // ── Run ────────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      toast.error("Add a topic first.");
      return;
    }
    const newPlan = planUnit({
      subject,
      yearGroup,
      topic: topic.trim(),
      weeks,
      ability,
      board: board || undefined,
    });
    if (newPlan.lessons.length > MAX_LESSONS) {
      toast.error(`Unit packs are capped at ${MAX_LESSONS} lessons.`);
      return;
    }
    setPlan(newPlan);
    setResults([]);
    setStatuses(Object.fromEntries(newPlan.lessons.map((l) => [l.index, "pending" as const])));
    setAborted(false);
    setRunning(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const collected: UnitLessonResult[] = [];
    try {
      for await (const ev of executeUnit(newPlan, { signal: ctrl.signal })) {
        if (ev.status === "started") {
          setStatuses((s) => ({ ...s, [ev.lesson.index]: "running" }));
        } else if (ev.status === "ok") {
          collected.push({ lesson: ev.lesson, worksheet: ev.worksheet });
          setStatuses((s) => ({ ...s, [ev.lesson.index]: "ok" }));
        } else if (ev.status === "failed") {
          collected.push({ lesson: ev.lesson, worksheet: null, error: ev.error });
          setStatuses((s) => ({ ...s, [ev.lesson.index]: "failed" }));
        }
        setResults([...collected]);
      }
      if (ctrl.signal.aborted) {
        setAborted(true);
        toast.warning(
          `Stopped after ${collected.length} of ${newPlan.lessons.length} lessons. ` +
            `You can still download the partial pack.`,
        );
      } else if (collected.some((r) => !r.worksheet)) {
        toast.warning(
          `Unit pack ready — ${collected.filter((r) => r.worksheet).length} of ${collected.length} ` +
            `lessons generated. Failed lessons are flagged in the overview.`,
        );
      } else {
        toast.success(`Unit pack ready — all ${collected.length} lessons generated.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unit pack run failed.");
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [subject, yearGroup, topic, weeks, ability, board]);

  const handleAbort = useCallback(() => {
    abortRef.current?.abort();
    toast.info("Stopping after the current lesson…");
  }, []);

  // ── Bundle + download ──────────────────────────────────────────────────
  const handleDownload = useCallback(async (format: UnitBundleFormat = "zip") => {
    if (!plan || results.length === 0) return;
    setBundling(true);
    try {
      const blob = await bundleUnit(plan, results, format);
      const ext = format === "cc" ? "imscc" : "zip";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug(plan.unitTitle)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (format === "cc") {
        toast.success("Common Cartridge (.imscc) downloaded — import into your LMS.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not build the package.");
    } finally {
      setBundling(false);
    }
  }, [plan, results]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            New unit pack
          </DialogTitle>
          <DialogDescription>
            Plan + generate a full scheme of work. Output is one ZIP — pupil + teacher
            PDFs per lesson, plus an overview index. Capped at {MAX_LESSONS} lessons.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Form */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Subject</Label>
              <Select value={subject} onValueChange={setSubject} disabled={running}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Year group</Label>
              <Select value={yearGroup} onValueChange={setYearGroup} disabled={running}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEAR_GROUPS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs" htmlFor="unit-pack-topic">Topic / unit title</Label>
              <Input
                id="unit-pack-topic"
                value={topic}
                disabled={running}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Romeo & Juliet, Linear graphs, Forces & motion"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Weeks: {weeks}</Label>
              <Slider
                min={1}
                max={6}
                step={1}
                value={[weeks]}
                onValueChange={(v) => setWeeks(v[0] ?? 1)}
                disabled={running}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ability tier</Label>
              <Select value={ability} onValueChange={(v) => setAbility(v as AbilityTier)} disabled={running}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ABILITIES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Board (optional)</Label>
              <Select
                value={board || "__none__"}
                onValueChange={(v) => setBoard(v === "__none__" ? "" : (v as ExamBoard))}
                disabled={running}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No board</SelectItem>
                  {BOARDS.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!plan && (
            <p className="text-[11px] text-muted-foreground">
              Will generate up to <strong>{previewLessonCount}</strong> lessons (1 lesson per week).
            </p>
          )}

          {/* Progress */}
          {plan && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold">{plan.unitTitle}</span>
                <Badge variant="outline">
                  {completedCount} / {plan.lessons.length} lessons
                  {failedCount > 0 ? ` · ${failedCount} failed` : ""}
                </Badge>
              </div>
              <Progress value={pct} />
              <ul className="text-xs space-y-1 max-h-[220px] overflow-y-auto pr-1">
                {plan.lessons.map((l) => {
                  const st = statuses[l.index] || "pending";
                  return (
                    <li key={l.index} className="flex items-center gap-2">
                      <StatusIcon status={st} />
                      <span className="font-mono text-[10px] text-muted-foreground w-8">
                        W{l.week}.{l.positionInWeek}
                      </span>
                      <span className="truncate">{l.title}</span>
                      {l.specRefs.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {l.specRefs.join(", ")}
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
              {aborted && (
                <p className="text-[11px] text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Stopped — partial download still available.
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-end pt-1">
            {running ? (
              <Button variant="outline" size="sm" onClick={handleAbort}>
                <StopCircle className="w-3.5 h-3.5 mr-1.5" /> Stop
              </Button>
            ) : results.length > 0 ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setPlan(null); setResults([]); setStatuses({}); setAborted(false); }}>
                  Build another
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload("cc")}
                  disabled={bundling}
                  title="Export as Common Cartridge (.imscc) for Canvas, Moodle, etc."
                >
                  {bundling ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Export .imscc
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleDownload("zip")}
                  disabled={bundling}
                >
                  {bundling ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Download ZIP
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleGenerate}
                disabled={!topic.trim()}
              >
                <Layers className="w-3.5 h-3.5 mr-1.5" />
                Generate unit pack
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusIcon({ status }: { status: "pending" | "running" | "ok" | "failed" }) {
  if (status === "ok") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
  if (status === "running") return <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin shrink-0" />;
  if (status === "failed") return <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
  return <CircleDashed className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "unit-pack";
}
