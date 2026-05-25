/**
 * presentation-telemetry.ts — local-only telemetry for the Presentation Maker.
 *
 * Stores edit / refine / theme / regenerate events in localStorage so the
 * teacher gets a simple "your patterns" view (which slide types they touch
 * most, which themes they ship, how often they refine before exporting).
 *
 * No PII, no network — purely a local introspection aid. Cleared by the user
 * via the "Reset patterns" button in the Display Prefs panel.
 */

export interface TelemetryEvent {
  ts: number;
  kind: "generate" | "refine-slide" | "refine-deck" | "regen-slide" | "edit-slide" |
        "delete-slide" | "add-slide" | "move-slide" | "theme-change" | "send-adapt" |
        "export-pptx" | "send-email" | "save-library" | "fullscreen-enter" |
        "print-handout" | "send-to";
  meta?: Record<string, string | number | undefined>;
}

const KEY = "adaptly_pres_maker_telemetry_v1";
const MAX_EVENTS = 500;

function readAll(): TelemetryEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeAll(arr: TelemetryEvent[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX_EVENTS))); } catch {}
}

export function recordTelemetry(kind: TelemetryEvent["kind"], meta?: TelemetryEvent["meta"]): void {
  const arr = readAll();
  arr.push({ ts: Date.now(), kind, meta });
  writeAll(arr);
}

export function readTelemetry(): TelemetryEvent[] { return readAll(); }
export function clearTelemetry(): void { try { localStorage.removeItem(KEY); } catch {} }

// Aggregations the UI surfaces.
export interface TelemetrySummary {
  totalEvents: number;
  daysActive: number;
  topSlideTypes: Array<{ type: string; count: number }>;
  topThemes: Array<{ theme: string; count: number }>;
  refineCount: number;
  exportCount: number;
  averageRefinesPerExport: number | null;
}
export function summariseTelemetry(): TelemetrySummary {
  const events = readAll();
  const slideTypeCount: Record<string, number> = {};
  const themeCount: Record<string, number> = {};
  let refineCount = 0;
  let exportCount = 0;
  const days = new Set<string>();
  for (const e of events) {
    days.add(new Date(e.ts).toISOString().slice(0, 10));
    if (e.kind === "edit-slide" || e.kind === "regen-slide" || e.kind === "delete-slide") {
      const t = e.meta?.slideType as string | undefined;
      if (t) slideTypeCount[t] = (slideTypeCount[t] || 0) + 1;
    }
    if (e.kind === "theme-change") {
      const t = e.meta?.theme as string | undefined;
      if (t) themeCount[t] = (themeCount[t] || 0) + 1;
    }
    if (e.kind === "refine-slide" || e.kind === "refine-deck" || e.kind === "regen-slide") refineCount += 1;
    if (e.kind === "export-pptx") exportCount += 1;
  }
  return {
    totalEvents: events.length,
    daysActive: days.size,
    topSlideTypes: Object.entries(slideTypeCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count]) => ({ type, count })),
    topThemes: Object.entries(themeCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([theme, count]) => ({ theme, count })),
    refineCount,
    exportCount,
    averageRefinesPerExport: exportCount > 0 ? Math.round((refineCount / exportCount) * 10) / 10 : null,
  };
}
