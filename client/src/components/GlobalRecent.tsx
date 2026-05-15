/**
 * GlobalRecent — drawer showing the last N AI generations across every
 * tool, drawn from the same timeline-events store as the per-pupil view.
 *
 * Triggered by Cmd-Shift-R (and a "Recent" button in AppLayout). Promotes
 * the per-tool useOutputHistory pattern (FEAT-003) into a single platform-
 * wide surface.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { History, ArrowRight, Filter, X } from "lucide-react";
import { getAllEvents, type TimelineEvent } from "@/lib/timeline-events";
import { TOOLS, getTool } from "@/lib/tool-registry";
import { useApp } from "@/contexts/AppContext";

export default function GlobalRecent() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [toolFilter, setToolFilter] = useState("");
  const [pupilFilter, setPupilFilter] = useState("");
  const [, navigate] = useLocation();
  const { children } = useApp();

  // Reload on open + when storage changes elsewhere.
  useEffect(() => {
    if (!open) return;
    setEvents(getAllEvents(200));
    const handler = () => setEvents(getAllEvents(200));
    window.addEventListener("storage", handler);
    window.addEventListener("adaptly:timeline-changed", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("adaptly:timeline-changed", handler);
    };
  }, [open]);

  // Keyboard shortcut Cmd/Ctrl-Shift-R
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    const onCustom = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("adaptly:open-recent", onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("adaptly:open-recent", onCustom);
    };
  }, []);

  const filtered = events
    .filter(e => !toolFilter || e.toolId === toolFilter)
    .filter(e => !pupilFilter || e.pupilId === pupilFilter);

  function openEvent(e: TimelineEvent) {
    const tool = getTool(e.toolId);
    if (!tool) return;
    setOpen(false);
    navigate(`${tool.path}${e.pupilId ? `?pupilId=${e.pupilId}` : ""}`);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="hidden md:flex items-center gap-1.5 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          title="Recent generations (Ctrl+Shift+R)"
          aria-label="Recent generations"
        >
          <History className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <SheetTitle className="text-sm font-semibold flex items-center gap-2">
            <History className="w-4 h-4" /> Recent across all tools
          </SheetTitle>
          <p className="text-[10px] text-muted-foreground">{events.length} events · last 12 months</p>
        </SheetHeader>

        {/* Filters */}
        <div className="px-4 py-2 border-b space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3 h-3 text-muted-foreground" />
            <button
              onClick={() => setToolFilter("")}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                toolFilter === "" ? "bg-foreground text-background border-foreground" : "bg-white border-border"
              }`}
            >
              All tools
            </button>
            {TOOLS
              .filter(t => events.some(e => e.toolId === t.id))
              .slice(0, 12)
              .map(t => (
                <button
                  key={t.id}
                  onClick={() => setToolFilter(t.id)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    toolFilter === t.id ? "bg-foreground text-background border-foreground" : "bg-white border-border"
                  }`}
                >
                  {t.label}
                </button>
              ))}
          </div>

          {children.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground">Pupil:</span>
              <button
                onClick={() => setPupilFilter("")}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  pupilFilter === "" ? "bg-foreground text-background border-foreground" : "bg-white border-border"
                }`}
              >
                All
              </button>
              {Array.from(new Set(events.map(e => e.pupilId)))
                .slice(0, 8)
                .map(pid => {
                  const c = children.find(ch => ch.id === pid);
                  if (!c) return null;
                  return (
                    <button
                      key={pid}
                      onClick={() => setPupilFilter(pid)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        pupilFilter === pid ? "bg-foreground text-background border-foreground" : "bg-white border-border"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No matching generations yet.
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {filtered.map(e => {
                const tool = getTool(e.toolId);
                const Icon = tool?.icon || History;
                const c = children.find(ch => ch.id === e.pupilId);
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => openEvent(e)}
                      className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-start gap-3"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tool?.colour || "bg-muted"}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{e.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {tool?.label}{c ? ` · ${c.name}` : ""} · {new Date(e.at).toLocaleString("en-GB")}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 mt-1" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
