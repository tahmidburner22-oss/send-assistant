/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * ClassLeaderboard.tsx — FEAT-H4.
 *
 * Opt-in leaderboard for the teacher dashboard. Initials only.
 * Bottom-3 hidden from public view per safeguarding research.
 */

import React from "react";
import type { LeaderboardEntry } from "@/lib/gamificationEngine";

export interface ClassLeaderboardProps {
  entries: LeaderboardEntry[];
  enabled: boolean;
  /** When true, shows hidden-pupils count as a footer note. */
  hiddenCount?: number;
}

export function ClassLeaderboard(props: ClassLeaderboardProps): React.ReactElement {
  if (!props.enabled) {
    return (
      <div data-testid="class-leaderboard-disabled" className="text-xs text-gray-500 italic">
        Class leaderboard is off. Admin can enable it in school settings.
      </div>
    );
  }
  return (
    <div data-testid="class-leaderboard" className="border border-gray-200 rounded p-2">
      <h3 className="text-sm font-bold mb-2">Top of class</h3>
      <ol className="space-y-0.5 text-xs">
        {props.entries.slice(0, 10).map((e, i) => (
          <li key={e.pupilId} className="flex items-center justify-between">
            <span>
              <strong>#{i + 1}</strong> {e.initials}
            </span>
            <span className="text-gray-600">
              {e.totalCorrect} correct · {e.percentile}%
            </span>
          </li>
        ))}
      </ol>
      {props.hiddenCount && props.hiddenCount > 0 && (
        <p className="mt-2 text-[11px] text-gray-500">
          {props.hiddenCount} pupil{props.hiddenCount === 1 ? "" : "s"} hidden from public view.
        </p>
      )}
    </div>
  );
}

export default ClassLeaderboard;
