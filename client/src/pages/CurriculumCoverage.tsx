/**
 * CurriculumCoverage.tsx — FEAT-PC4 (UI half) · Phase C
 * ──────────────────────────────────────────────────────────────────────────
 * The "Ofsted view" page. Renders a coverage matrix:
 *
 *   - rows:   pupils (filtered by class / year group)
 *   - cols:   spec points for the chosen (board, subject, year group)
 *   - cells:  mastery state (unseen / red / amber / green) computed by
 *             aggregateCoverage from coverageAggregator.ts (PR #56).
 *
 * Inputs come from two sources:
 *
 *   - children from AppContext (the live roster).
 *   - WorksheetAttempt[] from the persistent attempt log
 *     (lib/attemptLog.ts, written by ScanMarkDialog after each scan in
 *     Worksheets.tsx). Survives reloads via localStorage.
 *
 * Click handoffs:
 *
 *   - Unseen cell → /worksheets?autoFromCoverage=1 with sessionStorage
 *     payload. Worksheets.tsx will surface a follow-up PR that reads it
 *     and pre-fills the Auto-from-class panel. Until that PR lands, the
 *     handoff is a no-op on the destination side, but the click still
 *     navigates the teacher to the right surface.
 *   - Red / amber cell → /worksheets?reteach=1 with the existing
 *     reteachHandoff sessionStorage key the PB3 useEffect already reads.
 *
 * Performance: a manual viewport-window keeps render cost flat for big
 * classes (≥ 200 pupils × ≥ 80 specs). We intentionally do NOT pull in
 * @tanstack/react-virtual for this PR — the windowing logic here is < 30
 * lines and avoids a new dependency. If the grid ever needs sub-row
 * virtualisation (smooth-scroll on a Chromebook), bumping to a real
 * virtualiser is a one-file follow-up.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  HoverCard, HoverCardContent, HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Download, Grid3x3, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useApp } from "@/contexts/AppContext";
import { useAttemptLog } from "@/hooks/useAttemptLog";

import {
  aggregateCoverage,
  coverageMatrixToCsv,
  type CoverageCell,
  type CoverageColumn,
  type PupilLite,
} from "@/lib/coverageAggregator";
import {
  listAvailableTaxonomies,
  type ExamBoard,
} from "@/lib/specPointTaxonomy";
import { isFeatureEnabled } from "@/lib/featureFlags";

// ─── Constants ─────────────────────────────────────────────────────────────

const COL_WIDTH_PX = 56;          // each spec column.
const ROW_HEIGHT_PX = 36;         // each pupil row.
const HEADER_HEIGHT_PX = 100;     // sticky column header (rotated text).
const PUPIL_COL_WIDTH_PX = 200;   // sticky first column.
const ROW_OVERSCAN = 6;           // extra rows above/below the viewport.
const COL_OVERSCAN = 4;           // extra columns left/right of the viewport.

const STATUS_BG: Record<CoverageCell["status"], string> = {
  unseen: "bg-slate-50 border-slate-200",
  red:    "bg-red-100  border-red-200",
  amber:  "bg-amber-100 border-amber-200",
  green:  "bg-emerald-100 border-emerald-200",
};

const STATUS_LABEL: Record<CoverageCell["status"], string> = {
  unseen: "Unseen",
  red:    "Below 50%",
  amber:  "50–79%",
  green:  "80%+",
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function CurriculumCoverage() {
  const flagOn = isFeatureEnabled("COVERAGE_MAP_ENABLED");
  const { children } = useApp();
  const { attempts, clearAttemptLog } = useAttemptLog();
  const [, navigate] = useLocation();

  // ── Filter state ─────────────────────────────────────────────────────────
  const taxonomies = useMemo(() => listAvailableTaxonomies(), []);
  const [board, setBoard] = useState<ExamBoard>(() => taxonomies[0]?.board ?? "aqa");
  const [subject, setSubject] = useState<string>(() => taxonomies[0]?.subject ?? "Mathematics");
  const [yearGroup, setYearGroup] = useState<string>(() => taxonomies[0]?.yearGroup ?? "Year 10");
  const [classFilter, setClassFilter] = useState<string>("all");

  // Distinct classes (year groups) on the live roster — filter chips driver.
  const classOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of children) if (c.yearGroup) set.add(c.yearGroup);
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [children]);

  // Pupils for the matrix: every child whose yearGroup matches the
  // taxonomy's yearGroup (or the explicit class filter, when it's set).
  const pupils: PupilLite[] = useMemo(() => {
    const wanted = classFilter === "all" ? yearGroup : classFilter;
    return children
      .filter((c) => c.yearGroup === wanted)
      .map((c) => ({ id: c.id, name: c.name, yearGroup: c.yearGroup }));
  }, [children, yearGroup, classFilter]);

  // ── Aggregate ─────────────────────────────────────────────────────────────
  const matrix = useMemo(
    () => aggregateCoverage(pupils, attempts, { board, subject, yearGroup }),
    [pupils, attempts, board, subject, yearGroup],
  );

  // Sync the (board, subject, year) options when the registry changes.
  // The dropdowns iterate the registered taxonomies so we never offer a
  // combination we don't have data for.
  const subjectOptions = useMemo(
    () => Array.from(new Set(taxonomies.filter((t) => t.board === board).map((t) => t.subject))),
    [taxonomies, board],
  );
  const yearOptions = useMemo(
    () => Array.from(new Set(
      taxonomies.filter((t) => t.board === board && t.subject === subject).map((t) => t.yearGroup),
    )),
    [taxonomies, board, subject],
  );
  const boardOptions = useMemo(
    () => Array.from(new Set(taxonomies.map((t) => t.board))),
    [taxonomies],
  );

  // Auto-fix the year/subject when the user picks a board that doesn't
  // carry the current selection.
  useEffect(() => {
    if (!subjectOptions.includes(subject) && subjectOptions[0]) setSubject(subjectOptions[0]);
  }, [subjectOptions, subject]);
  useEffect(() => {
    if (!yearOptions.includes(yearGroup) && yearOptions[0]) setYearGroup(yearOptions[0]);
  }, [yearOptions, yearGroup]);

  // ── Cell click → handoffs ───────────────────────────────────────────────
  const onCellClick = useCallback((pupil: PupilLite, col: CoverageColumn, cell: CoverageCell) => {
    if (cell.status === "unseen") {
      // Auto-from-class handoff. Worksheets.tsx today reads weekAhead /
      // reteach handoffs out of sessionStorage; the autoFromCoverage one
      // is identical wire-format, but consumed by a follow-up edit on the
      // Worksheets side. Until then, we still navigate so the teacher
      // lands on the right page with the right class pre-selected.
      try {
        sessionStorage.setItem("autoFromCoverageHandoff", JSON.stringify({
          pupilId: pupil.id,
          pupilName: pupil.name,
          classId: pupil.yearGroup || yearGroup,
          subject,
          yearGroup,
          board,
          specRef: col.specRef,
          specTitle: col.specTitle,
          ts: Date.now(),
        }));
      } catch { /* swallow */ }
      toast.info(`Generating worksheet for ${pupil.name} on "${col.specTitle}"…`);
      navigate("/worksheets?autoFromCoverage=1");
      return;
    }

    // Red / amber → re-teach. Use the same shape PB3 already consumes via
    // sessionStorage.reteachHandoff. The ?reteach=1 query string is what
    // the destination useEffect listens for.
    const evidence = cell.evidence[cell.evidence.length - 1];
    if (!evidence) {
      toast.error("No source worksheet for this attempt.");
      return;
    }
    const misconceptionId =
      cell.evidence.find((e) => e.markPct < 50)?.questionIdx
        ? `cell:${pupil.id}:${col.specRef}`
        : `cell:${pupil.id}:${col.specRef}`;
    const brief = {
      topic: col.specTitle,
      subject,
      yearGroup,
      misconceptionId,
      misconceptionLabel: `${col.specRef} — ${col.specTitle}`,
      pupilsToTarget: [pupil.name],
      pctWrong: 100 - (cell.rollingMeanPct ?? 0),
      questionIdx: evidence.questionIdx ?? 1,
      sourceWorksheetTitle: evidence.worksheetTitle ?? "Coverage trigger",
      // Re-teach instructions are built by reteachPlanner; the destination
      // useEffect just calls aiGenerateReteachWorksheet with whatever brief
      // it gets, so we provide a compact, deterministic block here. Keeps
      // this PR focused — a richer brief lives in the next iteration.
      instructions: [
        `RE-TEACH WORKSHEET — pupil ${pupil.name} is below the mastery threshold on spec point ${col.specRef}.`,
        `Spec point: "${col.specTitle}".`,
        `Rolling mean across last attempts: ${cell.rollingMeanPct ?? 0}%.`,
        `Target: bring this pupil to ≥ 80% mastery via a single short re-teach worksheet.`,
        `Mandatory: include one worked example, two contrast pairs and six fresh practice questions on this spec point.`,
      ].join("\n"),
    };
    const source = {
      id: evidence.worksheetId,
      title: evidence.worksheetTitle,
      metadata: { subject, topic: col.specTitle, yearGroup },
    };
    try {
      sessionStorage.setItem("reteachHandoff", JSON.stringify({ brief, source, ts: Date.now() }));
    } catch {
      toast.error("Could not stage the re-teach handoff (storage unavailable).");
      return;
    }
    toast.info(`Generating re-teach for "${col.specRef}"…`);
    navigate("/worksheets?reteach=1");
  }, [board, subject, yearGroup, navigate]);

  // ── CSV export ──────────────────────────────────────────────────────────
  const onExportCsv = useCallback(() => {
    if (matrix.rows.length === 0 || matrix.cols.length === 0) {
      toast.error("Nothing to export — no pupils or no taxonomy bundled.");
      return;
    }
    const csv = coverageMatrixToCsv(matrix);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coverage-${board}-${subject.toLowerCase().replace(/\s+/g, "-")}-${yearGroup.toLowerCase().replace(/\s+/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [matrix, board, subject, yearGroup]);

  // ── Viewport windowing ──────────────────────────────────────────────────
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewport, setViewport] = useState({ w: 1024, h: 600 });

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setViewport({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visibleRows = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT_PX) - ROW_OVERSCAN);
    const end = Math.min(
      matrix.rows.length,
      Math.ceil((scrollTop + viewport.h - HEADER_HEIGHT_PX) / ROW_HEIGHT_PX) + ROW_OVERSCAN,
    );
    return { start, end };
  }, [scrollTop, viewport.h, matrix.rows.length]);

  const visibleCols = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollLeft / COL_WIDTH_PX) - COL_OVERSCAN);
    const end = Math.min(
      matrix.cols.length,
      Math.ceil((scrollLeft + viewport.w - PUPIL_COL_WIDTH_PX) / COL_WIDTH_PX) + COL_OVERSCAN,
    );
    return { start, end };
  }, [scrollLeft, viewport.w, matrix.cols.length]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  // ── Feature flag gate ────────────────────────────────────────────────────
  if (!flagOn) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Grid3x3 className="w-10 h-10 mx-auto text-muted-foreground" />
            <h1 className="text-xl font-semibold">Curriculum Coverage</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The coverage map is in pilot. We turn it on once your school has at least two
              awarding-body taxonomies bundled. Ask Adaptly support to enable it for your tenant,
              or set <code className="text-xs">VITE_COVERAGE_MAP_ENABLED=1</code> in a self-host
              build.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const totalGridWidth = PUPIL_COL_WIDTH_PX + matrix.cols.length * COL_WIDTH_PX;
  const totalGridHeight = HEADER_HEIGHT_PX + matrix.rows.length * ROW_HEIGHT_PX;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-brand" />
            Curriculum Coverage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mastery per pupil per spec point. Click an unseen cell to generate a targeted
            worksheet, or a red / amber cell to schedule a re-teach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExportCsv}>
            <Download className="w-4 h-4 mr-1.5" />
            Export coverage CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm("Clear the local attempt log? This only affects this browser.")) {
                clearAttemptLog();
                toast.success("Attempt log cleared.");
              }
            }}
            title="Clear local attempt log"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear log
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Board</Label>
            <Select value={board} onValueChange={(v) => setBoard(v as ExamBoard)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {boardOptions.map((b) => (
                  <SelectItem key={b} value={b}>{b.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {subjectOptions.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Year group</Label>
            <Select value={yearGroup} onValueChange={setYearGroup}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Class filter</Label>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All in {yearGroup}</SelectItem>
                {classOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Legend + counts */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {(["unseen", "red", "amber", "green"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`inline-block w-3.5 h-3.5 rounded border ${STATUS_BG[s]}`} />
            <span className="text-muted-foreground">{STATUS_LABEL[s]}</span>
          </div>
        ))}
        <Badge variant="outline" className="ml-auto">
          {matrix.rows.length} pupil{matrix.rows.length === 1 ? "" : "s"} ·
          {" "}{matrix.cols.length} spec point{matrix.cols.length === 1 ? "" : "s"} ·
          {" "}{attempts.length} attempt{attempts.length === 1 ? "" : "s"} on file
        </Badge>
      </div>

      {/* Warnings */}
      {matrix.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 space-y-1">
          {matrix.warnings.map((w, i) => <div key={i}>· {w}</div>)}
        </div>
      )}

      {/* Empty states */}
      {matrix.rows.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          No pupils on roster for {classFilter === "all" ? yearGroup : classFilter}. Add pupils
          via <strong>Pupils</strong> first.
        </CardContent></Card>
      )}
      {matrix.rows.length > 0 && matrix.cols.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          No spec-point taxonomy bundled for {board.toUpperCase()} {subject} {yearGroup}.
        </CardContent></Card>
      )}

      {/* Grid */}
      {matrix.rows.length > 0 && matrix.cols.length > 0 && (
        <Card className="overflow-hidden">
          <div
            ref={scrollerRef}
            onScroll={onScroll}
            className="relative overflow-auto bg-background"
            style={{ maxHeight: 600 }}
            data-testid="coverage-grid-scroller"
          >
            <div
              className="relative"
              style={{ width: totalGridWidth, height: totalGridHeight }}
            >
              {/* Sticky column header */}
              <div
                className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border"
                style={{ height: HEADER_HEIGHT_PX, width: totalGridWidth }}
              >
                {/* Top-left corner — sticky on both axes */}
                <div
                  className="absolute left-0 top-0 z-30 bg-background border-r border-border flex items-end p-2"
                  style={{ width: PUPIL_COL_WIDTH_PX, height: HEADER_HEIGHT_PX }}
                >
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Pupil ⤵   ·   Spec ➡
                  </span>
                </div>
                {/* Rotated spec-point labels */}
                {matrix.cols.slice(visibleCols.start, visibleCols.end).map((col, i) => {
                  const idx = visibleCols.start + i;
                  return (
                    <div
                      key={col.specRef}
                      className="absolute top-0 border-l border-border/40 flex items-end justify-center"
                      style={{
                        left: PUPIL_COL_WIDTH_PX + idx * COL_WIDTH_PX,
                        width: COL_WIDTH_PX,
                        height: HEADER_HEIGHT_PX,
                      }}
                      title={`${col.specRef} — ${col.specTitle}`}
                    >
                      <div className="origin-bottom-left rotate-[-60deg] translate-x-2 text-[10px] leading-tight pb-1 max-w-[140px] whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className="font-mono text-foreground">{col.specRef}</span>
                        <span className="text-muted-foreground"> · {col.specTitle.slice(0, 36)}{col.specTitle.length > 36 ? "…" : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Body rows (only the visible window) */}
              {matrix.rows.slice(visibleRows.start, visibleRows.end).map((pupil, ri) => {
                const rowIdx = visibleRows.start + ri;
                const top = HEADER_HEIGHT_PX + rowIdx * ROW_HEIGHT_PX;
                return (
                  <div key={pupil.id} className="absolute left-0" style={{ top, height: ROW_HEIGHT_PX, width: totalGridWidth }}>
                    {/* Sticky pupil name (first column) */}
                    <div
                      className="absolute left-0 top-0 z-10 bg-background border-r border-b border-border flex items-center px-3 text-sm"
                      style={{ width: PUPIL_COL_WIDTH_PX, height: ROW_HEIGHT_PX }}
                    >
                      <span className="truncate font-medium text-foreground">{pupil.name}</span>
                    </div>
                    {/* Cells (only the visible column window) */}
                    {matrix.cols.slice(visibleCols.start, visibleCols.end).map((col, ci) => {
                      const cidx = visibleCols.start + ci;
                      const cell = matrix.cells[pupil.id]?.[col.specRef] ?? { status: "unseen" as const, evidence: [] };
                      return (
                        <CoverageCellButton
                          key={col.specRef}
                          pupil={pupil}
                          col={col}
                          cell={cell}
                          left={PUPIL_COL_WIDTH_PX + cidx * COL_WIDTH_PX}
                          onClick={() => onCellClick(pupil, col, cell)}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Footer — class-level bar */}
      {matrix.classMasteryBySpec.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                Class mastery by spec point
              </div>
              <span className="text-[11px] text-muted-foreground">
                Last updated {new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Each bar shows the % of the class at green for that spec point. A row that's stuck
              red across the class is what to teach next.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
              {matrix.classMasteryBySpec.slice(0, 24).map((row) => (
                <div key={row.specRef} className="rounded border border-border/50 px-2 py-1.5 text-[11px] flex items-center justify-between gap-2">
                  <span className="font-mono text-muted-foreground">{row.specRef}</span>
                  <span className="font-semibold text-emerald-700 tabular-nums">{Math.round(row.pctGreen)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── CoverageCellButton ────────────────────────────────────────────────────

interface CellProps {
  pupil: PupilLite;
  col: CoverageColumn;
  cell: CoverageCell;
  left: number;
  onClick: () => void;
}

function CoverageCellButton({ pupil, col, cell, left, onClick }: CellProps) {
  const evidenceSummary = cell.evidence.slice(-3).map((e) => `${e.markPct}%`).join(" · ");
  const lastSeen = cell.lastSeenAt
    ? new Date(cell.lastSeenAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : null;
  return (
    <HoverCard openDelay={120} closeDelay={40}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={`${pupil.name} — ${col.specRef} ${col.specTitle}: ${STATUS_LABEL[cell.status]}`}
          className={`absolute top-0 border ${STATUS_BG[cell.status]} hover:ring-2 hover:ring-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-shadow`}
          style={{ left, width: COL_WIDTH_PX, height: ROW_HEIGHT_PX }}
          data-testid={`coverage-cell-${pupil.id}-${col.specRef}`}
          data-status={cell.status}
        />
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-72 text-xs space-y-1">
        <div className="font-semibold text-sm">{pupil.name}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{col.specRef}</div>
        <div className="text-foreground">{col.specTitle}</div>
        <div className="pt-1 flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`${STATUS_BG[cell.status]} border-transparent text-foreground`}>
            {STATUS_LABEL[cell.status]}
          </Badge>
          {typeof cell.rollingMeanPct === "number" && (
            <span className="text-muted-foreground">Rolling mean: {cell.rollingMeanPct}%</span>
          )}
          {lastSeen && <span className="text-muted-foreground">Last seen: {lastSeen}</span>}
        </div>
        {cell.evidence.length > 0 && (
          <div className="text-muted-foreground">
            Recent attempts ({cell.evidence.length}): {evidenceSummary || "—"}
          </div>
        )}
        <div className="pt-1 text-[10px] text-muted-foreground italic">
          {cell.status === "unseen"
            ? "Click to generate a worksheet for this pupil and spec."
            : "Click to schedule a re-teach for this gap."}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
