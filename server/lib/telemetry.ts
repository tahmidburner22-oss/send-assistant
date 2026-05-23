/**
 * server/lib/telemetry.ts — PR-22 / audit item #78.
 *
 * Server-side telemetry logger. Side-effecting (writes to stdout via
 * the standard logging pipeline). Designed to swap in `pino` once the
 * dep lands — until then we use a minimal pino-shaped console wrapper
 * so the call sites don't have to change later.
 *
 * Public API (mirrors pino's basic shape):
 *
 *   const log = createTelemetryLogger({ serviceName: "worksheets" });
 *   log.info({ event: "render.complete", worksheetId, durationMs });
 *   log.warn({ event: "validator.fired", name: "command-word-fidelity" });
 *   log.error({ event: "render.crash", err });
 *
 * Every log line is JSON so it can be ingested by Loki / CloudWatch
 * out of the box. The PR-9 PII redaction rules apply — pupil names
 * are passed through `redactPii()` from `server/lib/generationCache.ts`
 * before they hit the log.
 */

export type TelemetryLevel = "debug" | "info" | "warn" | "error";

export interface TelemetryLogger {
  debug: (payload: Record<string, unknown>) => void;
  info: (payload: Record<string, unknown>) => void;
  warn: (payload: Record<string, unknown>) => void;
  error: (payload: Record<string, unknown>) => void;
  child: (extra: Record<string, unknown>) => TelemetryLogger;
}

export interface TelemetryLoggerOptions {
  serviceName: string;
  /** Default minimum level to emit. Defaults to "info". */
  minLevel?: TelemetryLevel;
  /** Optional sink override — mostly for tests. */
  sink?: (level: TelemetryLevel, payload: Record<string, unknown>) => void;
  /** Static fields stamped on every log line. */
  defaults?: Record<string, unknown>;
}

const LEVEL_RANK: Record<TelemetryLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const PII_KEYS_RE = /pupilName|firstName|lastName|email|phone|address|nhsNumber|upn/i;

function redactValue(key: string, value: unknown): unknown {
  if (PII_KEYS_RE.test(key) && typeof value === "string") {
    if (value.length === 0) return value;
    return value.slice(0, 1) + "***";
  }
  return value;
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      out[k] = redactObject(v as Record<string, unknown>);
    } else {
      out[k] = redactValue(k, v);
    }
  }
  return out;
}

function defaultSink(level: TelemetryLevel, payload: Record<string, unknown>): void {
  // Pino-shaped JSON line. Includes ISO timestamp + level numeric so a
  // future swap to actual pino is a one-line change.
  const line = JSON.stringify({
    level: LEVEL_RANK[level],
    levelName: level,
    time: new Date().toISOString(),
    ...payload,
  });
  // eslint-disable-next-line no-console
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (level === "debug") console.debug(line);
  else console.log(line);
}

export function createTelemetryLogger(options: TelemetryLoggerOptions): TelemetryLogger {
  const minLevel = options.minLevel ?? "info";
  const sink = options.sink ?? defaultSink;
  const defaults = options.defaults ?? {};

  function emit(level: TelemetryLevel, payload: Record<string, unknown>): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[minLevel]) return;
    const merged = { service: options.serviceName, ...defaults, ...payload };
    sink(level, redactObject(merged));
  }

  const logger: TelemetryLogger = {
    debug: (p) => emit("debug", p),
    info: (p) => emit("info", p),
    warn: (p) => emit("warn", p),
    error: (p) => emit("error", p),
    child: (extra) =>
      createTelemetryLogger({
        ...options,
        defaults: { ...defaults, ...extra },
      }),
  };
  return logger;
}

/** Test helper — exported so unit tests can verify the redaction
 *  rules without re-importing private internals. */
export const __test__ = { redactObject, redactValue };
