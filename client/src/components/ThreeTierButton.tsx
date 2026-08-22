/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * One-click LA / MA / HA differentiation control.
 *
 * The control deliberately keeps completed tiers visible when another tier
 * fails. A teacher can save the usable versions and retry only the failed
 * tier rather than re-running the entire group.
 */

import React, { useState } from "react";
import {
  runThreeTierDifferentiation,
  type DifferentiationTier,
  type ThreeTierOutput,
} from "@/lib/threeTierDifferentiation";

const ALL_TIERS: DifferentiationTier[] = ["LA", "MA", "HA"];

export interface ThreeTierButtonProps<TWorksheet> {
  worksheet: TWorksheet;
  differentiate: (worksheet: TWorksheet, tier: DifferentiationTier) => Promise<TWorksheet>;
  onSaveAll?: (output: ThreeTierOutput<TWorksheet>) => void | Promise<void>;
  className?: string;
}

export function ThreeTierButton<TWorksheet>(
  props: ThreeTierButtonProps<TWorksheet>,
): React.ReactElement {
  const [busyTier, setBusyTier] = useState<DifferentiationTier | "all" | null>(null);
  const [output, setOutput] = useState<ThreeTierOutput<TWorksheet> | null>(null);
  const [activeTier, setActiveTier] = useState<DifferentiationTier>("MA");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const busy = busyTier !== null;

  function mergeRetryOutput(retry: ThreeTierOutput<TWorksheet>): ThreeTierOutput<TWorksheet> {
    if (!output) return retry;
    const resultsByTier = new Map(output.results.map((result) => [result.tier, result]));
    retry.results.forEach((result) => resultsByTier.set(result.tier, result));
    const results = ALL_TIERS.map((tier) => resultsByTier.get(tier)).filter(Boolean) as ThreeTierOutput<TWorksheet>["results"];
    return {
      groupId: output.groupId,
      results,
      successCount: results.filter((result) => result.status === "fulfilled").length,
      failCount: results.filter((result) => result.status === "rejected").length,
    };
  }

  async function run(tiers?: DifferentiationTier[]) {
    if (busy) return;
    const retryingTier = tiers?.[0] ?? null;
    setBusyTier(retryingTier || "all");
    setError(null);
    if (!tiers) setOutput(null);

    try {
      const next = await runThreeTierDifferentiation({
        worksheet: props.worksheet,
        differentiate: props.differentiate,
        groupId: output?.groupId,
        tiers,
      });
      const merged = tiers ? mergeRetryOutput(next) : next;
      setOutput(merged);
      const firstSuccess = merged.results.find((result) => result.status === "fulfilled")?.tier;
      if (firstSuccess) setActiveTier(firstSuccess);
    } catch (err) {
      setError((err as Error)?.message || "The differentiation request could not be started. Please try again.");
    } finally {
      setBusyTier(null);
    }
  }

  async function saveAvailableTiers() {
    if (!output || output.successCount === 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      await props.onSaveAll?.(output);
    } catch (err) {
      setError((err as Error)?.message || "The available differentiated worksheets could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const activeResult = output?.results.find((result) => result.tier === activeTier);

  return (
    <div className={`no-print ${props.className || ""}`} data-testid="three-tier-control">
      <button
        type="button"
        onClick={() => run()}
        disabled={busy}
        data-testid="three-tier-button"
        className="text-sm px-3 py-1.5 rounded border border-indigo-500 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        {busyTier === "all" ? "Building LA, MA, then HA…" : "Differentiate LA / MA / HA"}
      </button>
      {error && <p className="text-xs text-red-700 mt-1" role="alert">{error}</p>}
      {output && (
        <section className="mt-3 border border-indigo-200 rounded-md bg-white p-3 shadow-sm" data-testid="three-tier-preview" aria-label="Three differentiated worksheet versions">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <p className="text-xs font-semibold text-slate-800">Differentiated lesson set</p>
              <p className="text-xs text-slate-600">LA, MA and HA keep the same lesson focus. Completed versions remain available if another tier needs attention.</p>
            </div>
            <span className="text-xs font-medium text-indigo-700">{output.successCount}/3 ready</span>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Differentiated worksheet tiers">
            {ALL_TIERS.map((tier) => {
              const result = output.results.find((item) => item.tier === tier);
              const ok = result?.status === "fulfilled";
              const failed = result?.status === "rejected";
              const isRetrying = busyTier === tier;
              return (
                <div key={tier} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => ok && setActiveTier(tier)}
                    disabled={!ok}
                    role="tab"
                    aria-selected={activeTier === tier && ok}
                    data-testid={`three-tier-tab-${tier}`}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      activeTier === tier && ok
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : ok
                          ? "bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100"
                          : "bg-red-50 border-red-200 text-red-800"
                    } disabled:cursor-not-allowed`}
                  >
                    {tier} {ok ? "ready" : failed ? "needs retry" : "not run"}
                  </button>
                  {failed && (
                    <button
                      type="button"
                      onClick={() => run([tier])}
                      disabled={busy}
                      data-testid={`three-tier-retry-${tier}`}
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                    >
                      {isRetrying ? `Retrying ${tier}…` : `Retry ${tier}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {activeResult?.status === "fulfilled" && (
            <p className="mt-2 text-xs text-emerald-700" aria-live="polite">{activeTier} version is ready for review and saving.</p>
          )}
          {output.results.filter((result) => result.status === "rejected").map((result) => (
            <p key={result.tier} className="mt-2 text-xs text-red-700" role="status">
              {result.tier} was not created after {result.attempts} attempts: {result.error}
            </p>
          ))}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveAvailableTiers}
              disabled={output.successCount === 0 || saving}
              className="text-xs px-2.5 py-1.5 rounded border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              {saving ? "Saving available versions…" : output.successCount === 3 ? "Save all three to History" : "Save available versions"}
            </button>
            {output.failCount > 0 && <span className="text-xs text-slate-600">You can save the ready versions now and retry the remaining tier later.</span>}
          </div>
        </section>
      )}
    </div>
  );
}

export default ThreeTierButton;
