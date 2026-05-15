/**
 * CreditMeterChip — month-to-date AI cost shown in the AppLayout top bar.
 * Click to see breakdown by tool. Defensible-not-precise; uses the
 * blended rate from lib/credit-meter.
 */
import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { listEntries, thisMonthCost, thisMonthTokens } from "@/lib/credit-meter";
import { TOOLS } from "@/lib/tool-registry";

export default function CreditMeterChip() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick(t => t + 1);
    window.addEventListener("storage", onChange);
    window.addEventListener("adaptly:credit-changed", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("adaptly:credit-changed", onChange);
    };
  }, []);

  const cost = thisMonthCost();
  const tokens = thisMonthTokens();
  const start = new Date(); start.setDate(1); start.setHours(0,0,0,0);
  const entries = listEntries({ since: start.getTime() });
  const byTool: Record<string, { tokens: number; cost: number; count: number }> = {};
  for (const e of entries) {
    const t = byTool[e.toolId] || { tokens: 0, cost: 0, count: 0 };
    t.tokens += e.tokens; t.cost += e.cost; t.count += 1;
    byTool[e.toolId] = t;
  }
  const sorted = Object.entries(byTool).sort((a, b) => b[1].cost - a[1].cost).slice(0, 8);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/40 border border-border/40 text-[10px] text-muted-foreground hover:text-foreground"
          title="Month-to-date AI cost"
        >
          <Coins className="w-3 h-3" />
          £{cost.toFixed(2)}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 text-xs">
        <p className="font-bold text-sm">AI usage this month</p>
        <p className="text-muted-foreground text-[11px] mb-2">
          ≈ {tokens.toLocaleString()} tokens · ≈ £{cost.toFixed(2)}. Estimated at the
          platform's blended rate; actual billing on the school account.
        </p>
        {sorted.length === 0 ? (
          <p className="text-muted-foreground italic">No generations this month yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {sorted.map(([id, t]) => {
              const tool = TOOLS.find(x => x.id === id);
              return (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{tool?.label || id}</span>
                  <span className="text-muted-foreground text-[10px]">{t.count}× · £{t.cost.toFixed(3)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
