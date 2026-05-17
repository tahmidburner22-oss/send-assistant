/**
 * ReteachGapPanel — FEAT-PB3 · Phase B
 *
 * Mounted by ScanMarkDialog after a Scan & Mark batch has been recorded
 * for the current worksheet. Shows one "Re-teach this gap" card per
 * (question, misconception) pair where ≥ thresholdPct of the class got
 * the question wrong. Each card carries a single button that the parent
 * threads through to aiGenerateReteachWorksheet.
 *
 * Pure presentation: aggregation lives in reteachPlanner.aggregateClassErrors;
 * generation lives in reteachPlanner.aiGenerateReteachWorksheet. The panel
 * only renders the rows it is given and emits an onReteach callback per click.
 */

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Sparkles, Users, AlertTriangle } from "lucide-react";
import {
  aggregateClassErrors,
  buildReteachBrief,
  emitReteachTelemetry,
  type ReteachGapRow,
  type ReteachBrief,
  type ScanBatchResult,
} from "@/lib/reteachPlanner";

interface SourceWorksheetLite {
  id?: string;
  title?: string;
  metadata?: { subject?: string; topic?: string; yearGroup?: string; [key: string]: unknown };
  sections?: Array<Record<string, unknown>>;
}

interface Props {
  /** All ScanMarkResults accumulated for the current worksheet, one per pupil. */
  batch: ScanBatchResult;
  /** The worksheet the batch was marked against — supplies subject/topic/year. */
  sourceWorksheet: SourceWorksheetLite | null;
  /** Threshold (0..100) above which a gap surfaces. Default 40. */
  thresholdPct?: number;
  /** Called once per click. Parent should hand off to aiGenerateReteachWorksheet. */
  onReteach: (brief: ReteachBrief) => void;
}

export function ReteachGapPanel({ batch, sourceWorksheet, thresholdPct = 40, onReteach }: Props) {
  const rows = useMemo<ReteachGapRow[]>(
    () => aggregateClassErrors(batch, { thresholdPct }),
    [batch, thresholdPct],
  );

  // Soft telemetry hook — fires once per render where rows.length changes.
  // The hook is non-blocking and a no-op when window.__adaptlyTelemetry is
  // not registered, mirroring the Phase A · PR-4 pattern.
  useMemo(() => {
    if (rows.length > 0) {
      emitReteachTelemetry("reteach.suggested", {
        gapCount: rows.length,
        thresholdPct,
        sourceWorksheetTitle: sourceWorksheet?.title || "",
      });
    }
  }, [rows.length, thresholdPct, sourceWorksheet?.title]);

  if (!sourceWorksheet) return null;
  if (batch.length === 0) return null;

  // No gaps above threshold — show a positive empty-state so the teacher
  // knows the loop ran but nothing needs re-teaching.
  if (rows.length === 0) {
    return (
      <div
        data-testid="reteach-gap-panel-empty"
        className="rounded-md border bg-emerald-50 border-emerald-200 px-3 py-3 text-xs text-emerald-900"
      >
        <div className="flex items-center gap-2 font-semibold mb-0.5">
          <Sparkles className="w-4 h-4" />
          No re-teach gaps detected
        </div>
        <p className="text-[11px] leading-relaxed">
          Across {batch.length} pupil{batch.length === 1 ? "" : "s"}, no question crossed the
          {" "}{thresholdPct}% wrong-answer threshold for the same misconception. The class is on
          track — keep going.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="reteach-gap-panel" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BrainCircuit className="w-4 h-4 text-amber-700" />
          Re-teach gaps
          <Badge variant="secondary" className="text-[10px] font-medium">
            {rows.length} suggested
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">
          ≥{thresholdPct}% wrong · {batch.length} pupil{batch.length === 1 ? "" : "s"} scanned
        </span>
      </div>

      <ul className="space-y-2">
        {rows.map((row) => {
          const brief = buildReteachBrief(row, sourceWorksheet);
          return (
            <li
              key={`${row.questionIdx}-${row.misconceptionId}`}
              data-testid={`reteach-gap-row-${row.questionIdx}-${row.misconceptionId}`}
              className="rounded-md border bg-amber-50/60 border-amber-200 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-semibold">Q{row.questionIdx}</span>
                    <span className="text-amber-800">·</span>
                    <span>{row.pctWrong.toFixed(0)}% wrong</span>
                    <span className="text-amber-800">·</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {row.pupilsWrong.length}/{row.totalPupils}
                    </span>
                  </div>
                  <div className="text-sm text-foreground leading-snug">
                    <span className="text-muted-foreground">Stem: </span>
                    {row.questionText.length > 140
                      ? row.questionText.slice(0, 140).trimEnd() + "…"
                      : row.questionText}
                  </div>
                  <div className="text-xs text-amber-950 leading-snug">
                    <span className="font-semibold">Misconception: </span>
                    {row.misconceptionLabel}
                  </div>
                  {row.pupilsWrong.length > 0 && (
                    <div className="text-[11px] text-muted-foreground leading-snug">
                      Affects: {row.pupilsWrong.slice(0, 6).join(", ")}
                      {row.pupilsWrong.length > 6 ? ` +${row.pupilsWrong.length - 6} more` : ""}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={() => {
                    emitReteachTelemetry("reteach.generated", {
                      misconceptionId: brief.misconceptionId,
                      pctWrong: brief.pctWrong,
                      questionIdx: brief.questionIdx,
                    });
                    onReteach(brief);
                  }}
                  className="flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Re-teach this gap
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ReteachGapPanel;
