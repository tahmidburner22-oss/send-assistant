/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * ThreeTierButton.tsx — FEAT-G9.
 *
 * One-click toolbar button. On click, runs three concurrent
 * differentiate calls (LA / MA / HA) and shows a tabbed preview.
 * UI is intentionally minimal — the caller wires the differentiate
 * function in.
 */

import React, { useState } from "react";
import {
  runThreeTierDifferentiation,
  type DifferentiationTier,
  type ThreeTierOutput,
} from "@/lib/threeTierDifferentiation";

export interface ThreeTierButtonProps<TWorksheet> {
  worksheet: TWorksheet;
  differentiate: (worksheet: TWorksheet, tier: DifferentiationTier) => Promise<TWorksheet>;
  onSaveAll?: (output: ThreeTierOutput<TWorksheet>) => void;
  className?: string;
}

export function ThreeTierButton<TWorksheet>(
  props: ThreeTierButtonProps<TWorksheet>,
): React.ReactElement {
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<ThreeTierOutput<TWorksheet> | null>(null);
  const [activeTier, setActiveTier] = useState<DifferentiationTier>("MA");
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const out = await runThreeTierDifferentiation({
        worksheet: props.worksheet,
        differentiate: props.differentiate,
      });
      setOutput(out);
    } catch (err) {
      setError((err as Error)?.message || "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`no-print ${props.className || ""}`}>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        data-testid="three-tier-button"
        className="text-sm px-3 py-1.5 rounded border border-blue-500 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
      >
        {busy ? "Generating LA / MA / HA…" : "Differentiate (LA / MA / HA)"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {output && (
        <div className="mt-3 border border-gray-200 rounded p-2" data-testid="three-tier-preview">
          <div className="flex gap-2 mb-2">
            {(["LA", "MA", "HA"] as DifferentiationTier[]).map((t) => {
              const r = output.results.find((x) => x.tier === t);
              const ok = r?.status === "fulfilled";
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTier(t)}
                  disabled={!ok}
                  data-testid={`three-tier-tab-${t}`}
                  className={`text-xs px-2 py-1 rounded ${
                    activeTier === t ? "bg-blue-600 text-white" : ok ? "bg-gray-100" : "bg-red-100 text-red-700"
                  } disabled:opacity-50`}
                >
                  {t} {ok ? "✓" : "✗"}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-gray-600">
            Group id: <code>{output.groupId}</code> · Success {output.successCount}/3
          </div>
          <button
            type="button"
            onClick={() => props.onSaveAll?.(output)}
            disabled={output.successCount === 0}
            className="mt-2 text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Save all to library
          </button>
        </div>
      )}
    </div>
  );
}

export default ThreeTierButton;
