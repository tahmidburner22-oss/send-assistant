/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * TierShiftButtons.tsx — FEAT-H11.
 *
 * Two buttons in the companion app per question (after G1's verifier
 * returns): "Try easier" and "Try harder". Wraps tierShiftedAnotherOne.
 */

import React, { useState } from "react";
import { tierShiftedAnotherOne, type TierShift } from "@/lib/tierShift";
import type { SectionLite, AnotherOneOutput } from "@/lib/anotherOneLikeThis";
import type { Tier } from "@/lib/curriculumBank";

export interface TierShiftButtonsProps {
  section: SectionLite;
  subject: string;
  currentTier?: Tier;
  excludeExemplarIds?: string[];
  onAlternative: (shift: TierShift, output: AnotherOneOutput) => void;
}

export function TierShiftButtons(props: TierShiftButtonsProps): React.ReactElement {
  const [busy, setBusy] = useState<TierShift | null>(null);

  async function handleClick(shift: TierShift) {
    if (busy) return;
    setBusy(shift);
    try {
      const out = await tierShiftedAnotherOne({
        section: props.section,
        subject: props.subject,
        shift,
        currentTier: props.currentTier,
        excludeExemplarIds: props.excludeExemplarIds,
      });
      props.onAlternative(shift, out);
    } catch {
      // surface upstream
    } finally {
      setBusy(null);
    }
  }

  // FEAT-H11 — tier guards: hide easier button when already at foundation,
  // hide harder when already at higher.
  const showEasier = props.currentTier !== "foundation";
  const showHarder = props.currentTier !== "higher";

  return (
    <div className="inline-flex gap-2 mt-2 no-print">
      {showEasier && (
        <button
          type="button"
          onClick={() => handleClick("easier")}
          disabled={!!busy}
          data-testid="tier-shift-easier"
          aria-label="Try an easier question on this skill"
          className="text-xs px-2 py-1 rounded border border-emerald-500 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
        >
          {busy === "easier" ? "…" : "↓ Try easier"}
        </button>
      )}
      {showHarder && (
        <button
          type="button"
          onClick={() => handleClick("harder")}
          disabled={!!busy}
          data-testid="tier-shift-harder"
          aria-label="Try a harder question on this skill"
          className="text-xs px-2 py-1 rounded border border-purple-500 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
        >
          {busy === "harder" ? "…" : "↑ Try harder"}
        </button>
      )}
    </div>
  );
}

export default TierShiftButtons;
