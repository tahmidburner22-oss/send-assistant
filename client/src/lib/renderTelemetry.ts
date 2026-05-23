/**
 * renderTelemetry.ts — PR-22 / audit item #78.
 *
 * Crash-free render rate helper. Pure / deterministic.
 *
 * The renderer surfaces a teacher-facing card if a section throws
 * during render; this module aggregates render outcomes into a
 * crash-free rate metric the admin telemetry panel surfaces (PR-27).
 * No I/O — production deployments wire this into a pino logger via
 * `server/lib/telemetry.ts`.
 */

export interface RenderTelemetryEvent {
  /** Stable id for the worksheet being rendered. */
  worksheetId: string;
  /** ISO timestamp the render attempt started. */
  startedAt: string;
  /** True when the render reached the closing bracket; false on throw. */
  completed: boolean;
  /** When `completed === false`, the error class / first line. */
  errorMessage?: string;
  /** Optional render duration in ms (mock instrumentation). */
  durationMs?: number;
}

export interface RenderTelemetrySummary {
  totalAttempts: number;
  totalSuccessful: number;
  totalCrashed: number;
  crashFreeRate: number; // 0..1
  /** Breakdown by error message → count. Capped at 10 entries. */
  topErrors: Array<{ message: string; count: number }>;
  /** Average duration of completed renders, in ms. */
  averageDurationMs: number | null;
  /** Time window represented (earliest..latest). */
  windowStart?: string;
  windowEnd?: string;
}

/**
 * Aggregate a list of render-telemetry events. Pure: no I/O, no time
 * dependence, no random sampling. The caller decides which window of
 * events to pass in.
 */
export function summariseRenderTelemetry(events: RenderTelemetryEvent[]): RenderTelemetrySummary {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      totalAttempts: 0,
      totalSuccessful: 0,
      totalCrashed: 0,
      crashFreeRate: 1,
      topErrors: [],
      averageDurationMs: null,
    };
  }
  let successful = 0;
  let crashed = 0;
  const errorCounts: Record<string, number> = Object.create(null);
  let durSum = 0;
  let durN = 0;
  let earliest: string | undefined;
  let latest: string | undefined;
  for (const e of events) {
    if (e.completed) {
      successful += 1;
      if (typeof e.durationMs === "number" && Number.isFinite(e.durationMs)) {
        durSum += e.durationMs;
        durN += 1;
      }
    } else {
      crashed += 1;
      const msg = (e.errorMessage || "Unknown error").split("\n")[0].slice(0, 200);
      errorCounts[msg] = (errorCounts[msg] || 0) + 1;
    }
    if (!earliest || e.startedAt < earliest) earliest = e.startedAt;
    if (!latest || e.startedAt > latest) latest = e.startedAt;
  }
  const total = successful + crashed;
  const topErrors = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([message, count]) => ({ message, count }));
  return {
    totalAttempts: total,
    totalSuccessful: successful,
    totalCrashed: crashed,
    crashFreeRate: total > 0 ? Number((successful / total).toFixed(4)) : 1,
    topErrors,
    averageDurationMs: durN > 0 ? Number((durSum / durN).toFixed(2)) : null,
    windowStart: earliest,
    windowEnd: latest,
  };
}
