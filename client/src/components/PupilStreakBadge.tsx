/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * PupilStreakBadge.tsx — FEAT-H4.
 *
 * Flame icon + day count for the companion app header.
 */

import React from "react";

export interface PupilStreakBadgeProps {
  currentDays: number;
  longestDays?: number;
  className?: string;
}

export function PupilStreakBadge(props: PupilStreakBadgeProps): React.ReactElement {
  const days = Math.max(0, props.currentDays || 0);
  return (
    <span
      data-testid="pupil-streak-badge"
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-50 border border-orange-300 text-orange-800 ${props.className || ""}`}
      aria-label={`${days}-day streak`}
      title={props.longestDays ? `Longest: ${props.longestDays} days` : undefined}
    >
      <span aria-hidden="true">🔥</span>
      <span>
        <strong>{days}</strong> day{days === 1 ? "" : "s"}
      </span>
    </span>
  );
}

export default PupilStreakBadge;
