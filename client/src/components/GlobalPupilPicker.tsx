/**
 * GlobalPupilPicker — the "pupil scope" pill that lives in AppLayout's
 * top bar. Picking a pupil here pre-selects them in every tool's
 * PupilContextPicker until the user clears the scope.
 */
import { useApp } from "@/contexts/AppContext";
import { usePupilScope } from "@/contexts/PupilScopeContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle2, X } from "lucide-react";
import { Link } from "wouter";

export default function GlobalPupilPicker() {
  const { children } = useApp();
  const { pupilId, setPupilId } = usePupilScope();

  if (!children || children.length === 0) return null;
  const current = children.find(c => c.id === pupilId);

  return (
    <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/40 border border-border/40">
      <UserCircle2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <Select value={pupilId || "__none"} onValueChange={(v) => setPupilId(v === "__none" ? "" : v)}>
        <SelectTrigger
          className="h-7 min-h-7 w-[170px] text-xs border-0 bg-transparent shadow-none focus:ring-0 px-1"
          aria-label="Select pupil scope"
        >
          <SelectValue placeholder="No pupil scoped" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="__none">No pupil scoped</SelectItem>
          {children.map(c => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}{c.yearGroup ? ` · ${c.yearGroup}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {current && (
        <Link href={`/pupils/${current.id}`}>
          <button
            className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand text-white hover:opacity-90"
            title="Open pupil profile"
          >
            View
          </button>
        </Link>
      )}
      {current && (
        <button
          onClick={() => setPupilId("")}
          className="p-0.5 rounded hover:bg-muted text-muted-foreground"
          title="Clear pupil scope"
          aria-label="Clear pupil scope"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
