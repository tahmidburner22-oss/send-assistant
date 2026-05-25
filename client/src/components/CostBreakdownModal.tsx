/**
 * PD13 — UI surface for cost transparency: breakdown modal opened
 * when the bursar clicks the chip in WorksheetRenderer's footer.
 *
 * Shows the full cost picture: provider, model, prompt + completion
 * tokens, USD + GBP, duration, cache status. The chip itself is the
 * teaser; this is the defensible audit view the bursar uses to argue
 * the licence value.
 *
 * Pure presentational — receives a CostEstimateMeta + cacheHit. No
 * data-fetching here.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt, CheckCircle2, Clock } from "lucide-react";
import type { CostEstimateMeta } from "@/lib/aiCostStamp";
import {
  formatGbp,
  formatDuration,
  formatProvider,
  USD_TO_GBP,
} from "@/lib/aiCostFormat";

export interface CostBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costEstimate: CostEstimateMeta;
  cacheHit?: boolean;
  cacheKey?: string;
}

function Row(props: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 text-sm border-b border-slate-100 last:border-b-0">
      <span className="text-slate-500">{props.label}</span>
      <span
        className={
          "font-semibold text-slate-900 " +
          (props.mono ? "font-mono text-xs" : "")
        }
        style={{ wordBreak: "break-all" }}
      >
        {props.value}
      </span>
    </div>
  );
}

export default function CostBreakdownModal(props: CostBreakdownModalProps) {
  const { open, onOpenChange, costEstimate, cacheHit, cacheKey } = props;
  const totalTokens = costEstimate.promptTokens + costEstimate.completionTokens;
  const usd = cacheHit ? 0 : costEstimate.estimatedUsd;
  const gbp = formatGbp(usd);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            Generation cost
          </DialogTitle>
        </DialogHeader>

        {cacheHit && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold mb-0.5">Served from cache</div>
              <div className="leading-relaxed">
                This worksheet was returned from the in-memory generation
                cache — your school did not pay the AI provider for this
                response. Token counts below show what a fresh call would
                have used.
              </div>
            </div>
          </div>
        )}

        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 mt-2">
          <Row label="Provider" value={formatProvider(costEstimate.provider, costEstimate.model)} />
          <Row label="Prompt tokens" value={costEstimate.promptTokens.toLocaleString()} />
          <Row label="Completion tokens" value={costEstimate.completionTokens.toLocaleString()} />
          <Row label="Total tokens" value={totalTokens.toLocaleString()} />
          <Row label="Estimated cost (GBP)" value={gbp} />
          <Row
            label="Estimated cost (USD)"
            value={usd > 0 ? `$${usd.toFixed(6)}` : "$0"}
          />
          {typeof costEstimate.durationMs === "number" && costEstimate.durationMs > 0 && (
            <Row label="Duration" value={formatDuration(costEstimate.durationMs)} />
          )}
          {cacheKey && <Row label="Cache key" value={cacheKey} mono />}
        </div>

        <div className="text-[11px] text-slate-500 leading-relaxed mt-2 flex items-start gap-1.5">
          <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>
            Token counts are estimated using the public 4-chars-per-token
            rule of thumb. USD figures use the per-provider pricing in
            <code className="mx-1 px-1 py-0.5 rounded bg-slate-100 font-mono text-[10px]">aiCostEstimate.ts</code>
            (mid-2026 published rates). GBP is converted at a fixed rate of
            {" "}{USD_TO_GBP.toFixed(2)} so the figure stays defensible and
            test-stable. Live FX is out of scope.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
