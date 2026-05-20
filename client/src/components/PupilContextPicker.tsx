/**
 * PupilContextPicker — pre-fills a tool form from a saved pupil record and
 * (optionally) injects a summary of that pupil's recent records into the
 * AI prompt context.
 *
 * Rendered at the top of every AIToolPage form when at least one pupil
 * exists in useApp().children. Selecting a pupil:
 *   1. Auto-fills matching field IDs (studentName, yearGroup, sendNeed)
 *   2. Reveals a "Use recent records" toggle. When ON, AIToolPage prepends
 *      the pupil-context block to the AI user prompt.
 *
 * GDPR: see lib/pupil-context.ts. Defaults to OFF so a teacher must
 * explicitly opt in to record injection.
 */
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/inline-switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCircle2, Sparkles } from "lucide-react";
import type { Child } from "@/contexts/AppContext";
import { buildPupilContext } from "@/lib/pupil-context";

interface Props {
  children: Child[];
  selectedId: string;
  onSelect: (childId: string) => void;
  injectRecords: boolean;
  onToggleInject: (next: boolean) => void;
}

export function PupilContextPicker({
  children,
  selectedId,
  onSelect,
  injectRecords,
  onToggleInject,
}: Props) {
  const selected = useMemo(
    () => children.find(c => c.id === selectedId),
    [children, selectedId],
  );

  const summary = selected ? buildPupilContext(selected) : null;

  if (children.length === 0) return null;

  return (
    <Card className="border-indigo-200 bg-indigo-50/40 p-3 mb-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 text-indigo-700 text-xs font-semibold whitespace-nowrap">
          <UserCircle2 className="w-4 h-4" />
          Pupil context
        </div>

        <div className="flex-1 min-w-0">
          <Select value={selectedId || ""} onValueChange={(v) => onSelect(v === "__none" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm" aria-label="Select pupil to pre-fill form">
              <SelectValue placeholder="Pre-fill from a pupil…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">No pupil (start blank)</SelectItem>
              {children.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}{c.yearGroup ? ` · ${c.yearGroup}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <Label
              htmlFor="pupil-context-inject"
              className="text-[11px] text-indigo-700 cursor-pointer select-none"
            >
              Use recent records
            </Label>
            <Switch
              id="pupil-context-inject"
              checked={injectRecords}
              onCheckedChange={onToggleInject}
              aria-label="Inject pupil records into AI prompt"
            />
          </div>
        )}
      </div>

      {selected && summary && (
        <p className="mt-2 text-[11px] text-indigo-700/80 leading-snug">
          {summary.headline}
          {injectRecords && (
            <span className="ml-1 text-emerald-700 font-medium">
              · Records will be passed to the AI
            </span>
          )}
        </p>
      )}
    </Card>
  );
}

export default PupilContextPicker;
