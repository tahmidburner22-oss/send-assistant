/**
 * PD13 — UI surface for cost transparency: tiny chip rendered in
 * WorksheetRenderer's footer (teacher view only).
 *
 * Reads `metadata.costEstimate` + `metadata.cacheHit` from the
 * worksheet. Hidden when:
 *   - The worksheet has no cost data (older worksheets generated
 *     before PD13 / PR-9, or schemas the LLM didn't populate).
 *   - The user has set `preferences.costTransparency = false` in
 *     Settings → Generation cost.
 *
 * Click opens `<CostBreakdownModal>` for the full audit-friendly
 * breakdown.
 */
import { useState } from "react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatChipLabel } from "@/lib/aiCostFormat";
import type { CostEstimateMeta } from "@/lib/aiCostStamp";
import CostBreakdownModal from "./CostBreakdownModal";

export interface WorksheetCostChipProps {
  /** Pulled from worksheet.metadata.costEstimate. */
  costEstimate: CostEstimateMeta | undefined;
  /** Pulled from worksheet.metadata.cacheHit. */
  cacheHit?: boolean;
  /** Pulled from worksheet.metadata.cacheKey. */
  cacheKey?: string;
  /** When true, renders even when the user toggle is OFF. Used by the
   *  admin spend panel which always wants to show the chip. */
  forceShow?: boolean;
}

export default function WorksheetCostChip(props: WorksheetCostChipProps) {
  const { costEstimate, cacheHit, cacheKey, forceShow } = props;
  const [modalOpen, setModalOpen] = useState(false);
  const { preferences } = useUserPreferences();

  // Default ON: undefined or true → show; only explicit `false` hides.
  const userOptedIn = preferences.costTransparency !== false;
  const visible = forceShow || userOptedIn;

  const label = formatChipLabel(costEstimate, cacheHit);
  if (!visible || !label || !costEstimate) return null;

  return (
    <>
      <button
        type="button"
        data-testid="worksheet-cost-chip"
        aria-label={`Generation cost: ${label}. Click to see breakdown.`}
        onClick={() => setModalOpen(true)}
        className={
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 " +
          "text-[10px] font-medium transition-colors cursor-pointer " +
          (cacheHit
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100")
        }
        style={{ fontFamily: "DM Sans, system-ui, sans-serif" }}
      >
        <span
          aria-hidden="true"
          className={
            "inline-block w-1.5 h-1.5 rounded-full " +
            (cacheHit ? "bg-emerald-500" : "bg-indigo-500")
          }
        />
        <span>{label}</span>
      </button>

      <CostBreakdownModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        costEstimate={costEstimate}
        cacheHit={cacheHit}
        cacheKey={cacheKey}
      />
    </>
  );
}
