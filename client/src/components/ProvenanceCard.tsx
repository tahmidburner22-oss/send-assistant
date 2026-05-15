/**
 * ProvenanceCard — small "Why this output?" badge + dialog rendered next
 * to every AIToolPage result. Shows:
 *   - which prompt template fed the model
 *   - which validators ran (and pass/fail per rule)
 *   - which pupil-context fields were injected (if any)
 *   - estimated tokens + cost (from credit-meter)
 *
 * This is the trust foundation Ofsted and parents will increasingly ask
 * for. It costs nothing in inference and makes every generation legible.
 */
import { Info, ShieldCheck, ShieldAlert, Coins, Clock } from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface ProvenanceFacts {
  toolLabel: string;
  systemPromptHead: string;
  fieldsUsed: string[];
  validators?: { ok: boolean; ruleCount: number; failures: string[] };
  pupilContextInjected?: boolean;
  tokens?: number;
  cost?: number;
  generatedAt: number;
  provider?: string;
}

export default function ProvenanceCard({ facts }: { facts: ProvenanceFacts }) {
  const validatorOk = facts.validators?.ok !== false;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
          title="Why this output?"
          aria-label="Provenance details"
        >
          <Info className="w-3 h-3" />
          Why this output?
          {validatorOk ? (
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
          ) : (
            <ShieldAlert className="w-3 h-3 text-amber-500" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-xs space-y-2">
        <p className="font-bold text-sm">{facts.toolLabel} — provenance</p>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">System prompt</p>
          <p className="text-[11px] leading-snug bg-muted/40 rounded p-2 line-clamp-3">{facts.systemPromptHead}</p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Fields used</p>
          <div className="flex flex-wrap gap-1">
            {facts.fieldsUsed.length === 0
              ? <span className="text-muted-foreground">No structured fields.</span>
              : facts.fieldsUsed.map(f => (
                <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
              ))}
            {facts.pupilContextInjected && (
              <Badge className="text-[10px] bg-indigo-100 text-indigo-700 border-indigo-200">+ pupil records</Badge>
            )}
          </div>
        </div>

        {facts.validators && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5 flex items-center gap-1">
              {validatorOk ? <ShieldCheck className="w-3 h-3 text-emerald-500" /> : <ShieldAlert className="w-3 h-3 text-amber-500" />}
              Validators
            </p>
            {validatorOk ? (
              <p className="text-[11px] text-emerald-600">All {facts.validators.ruleCount} checks passed.</p>
            ) : (
              <ul className="text-[11px] text-amber-700 list-disc pl-4 space-y-0.5">
                {facts.validators.failures.map(f => <li key={f}>{f}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t pt-2">
          {typeof facts.tokens === "number" && (
            <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> ~{facts.tokens.toLocaleString()} tokens</span>
          )}
          {typeof facts.cost === "number" && (
            <span>≈ £{facts.cost.toFixed(3)}</span>
          )}
          {facts.provider && <Badge variant="outline" className="text-[10px]">{facts.provider}</Badge>}
        </div>

        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {new Date(facts.generatedAt).toLocaleString("en-GB")}
        </p>
      </PopoverContent>
    </Popover>
  );
}
