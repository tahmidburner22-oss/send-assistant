/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * AnotherOneButton.tsx — FEAT-G2.
 *
 * Teacher-only one-click "Another one like this" button. Lives on
 * every question card in the worksheet preview (not in print view).
 * Calls the supplied dispatcher (anotherOneLikeThis) and emits the
 * fresh section to the caller via onAppend.
 */

import React, { useState } from "react";
import {
  anotherOneLikeThis,
  type SectionLite,
  type AnotherOneOutput,
} from "@/lib/anotherOneLikeThis";

export interface AnotherOneButtonProps {
  section: SectionLite;
  subject: string;
  excludeExemplarIds?: string[];
  /** Called with the fresh section + provenance metadata. */
  onAppend: (out: AnotherOneOutput) => void;
  className?: string;
}

export function AnotherOneButton(props: AnotherOneButtonProps): React.ReactElement {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const out = await anotherOneLikeThis({
        section: props.section,
        subject: props.subject,
        excludeExemplarIds: props.excludeExemplarIds,
      });
      props.onAppend(out);
    } catch (err) {
      setError((err as Error)?.message || "Failed to regenerate.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={`no-print inline-flex items-center gap-2 ${props.className || ""}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        data-testid="another-one-button"
        className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        aria-label="Generate another question on this skill"
      >
        {busy ? "Regenerating…" : "↻ Another like this"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}

export default AnotherOneButton;
