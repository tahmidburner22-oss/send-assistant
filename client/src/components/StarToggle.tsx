/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * StarToggle.tsx — FEAT-G17.
 *
 * Reusable star-icon affordance for marking worksheets as
 * favourites. Optimistic-update friendly: parent passes `value` and
 * `onChange`, this component just renders + announces.
 */

import React from "react";

export interface StarToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  size?: number;
  className?: string;
}

export function StarToggle(props: StarToggleProps): React.ReactElement {
  const size = props.size || 18;
  return (
    <button
      type="button"
      onClick={() => props.onChange(!props.value)}
      aria-pressed={props.value}
      aria-label={props.label || (props.value ? "Remove from favourites" : "Add to favourites")}
      data-testid="star-toggle"
      className={`inline-flex items-center justify-center rounded hover:bg-yellow-50 ${props.className || ""}`}
      style={{ width: size + 6, height: size + 6 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        aria-hidden="true"
        fill={props.value ? "#facc15" : "none"}
        stroke={props.value ? "#facc15" : "#9ca3af"}
        strokeWidth="1.5"
      >
        <path d="M10 1.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L10 14.9l-5.25 2.75 1-5.85-4.25-4.15 5.9-.85L10 1.5z" />
      </svg>
    </button>
  );
}

export default StarToggle;
