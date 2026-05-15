/**
 * SendToMenu — uniform "Send to…" dropdown rendered in every AIToolPage's
 * post-generation toolbar. Clicking a target navigates to it with carry-over
 * field values so the next tool feels pre-loaded by the previous one.
 *
 * Targets are sourced from the tool registry. Field translation is handled
 * by tool-registry.translateFields (canonical names like topic / yearGroup).
 */
import { useLocation } from "wouter";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Send, ArrowRight } from "lucide-react";
import { sendToTargets, translateFields } from "@/lib/tool-registry";

interface Props {
  fromToolId: string;
  values: Record<string, string>;
  /** Optional output passed via sessionStorage to the destination tool. */
  output?: string;
}

const HANDOFF_KEY = "adaptly_handoff_v1";

export function persistHandoff(toolId: string, values: Record<string, string>, output?: string): void {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({
      toolId,
      values: translateFields(values),
      output: output?.slice(0, 80_000),
      at: Date.now(),
    }));
  } catch {}
}

/** Tools at the destination side read this once on mount. */
export function consumeHandoff(forToolId: string): { values: Record<string, string>; output?: string } | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.toolId === forToolId) return null;       // tool only consumes work from a *different* tool
    if (Date.now() - (parsed.at || 0) > 5 * 60_000) return null;   // 5-minute window
    sessionStorage.removeItem(HANDOFF_KEY);
    return { values: parsed.values || {}, output: parsed.output };
  } catch {
    return null;
  }
}

export default function SendToMenu({ fromToolId, values, output }: Props) {
  const [, navigate] = useLocation();
  const targets = sendToTargets(fromToolId);
  if (targets.length === 0) return null;

  function go(targetId: string, path: string) {
    persistHandoff(fromToolId, values, output);
    // Pass canonicals via querystring too — AIToolPage already merges
    // window.location.search into form values.
    const translated = translateFields(values);
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(translated)) {
      if (v && typeof v === "string" && v.length < 200) params.set(k, v);
    }
    const sep = path.includes("?") ? "&" : "?";
    navigate(`${path}${params.toString() ? sep + params.toString() : ""}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Send className="w-3.5 h-3.5" />
          Send to…
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide">Continue this work in</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {targets.map(t => {
          const Icon = t.icon;
          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => go(t.id, t.path)}
              className="cursor-pointer"
            >
              <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">{t.description}</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 ml-2 text-muted-foreground/50" />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
