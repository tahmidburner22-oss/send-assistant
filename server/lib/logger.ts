import type { Request } from "express";

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  requestId?: string;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  userId?: string;
  schoolId?: string | null;
  error?: string;
  [k: string]: unknown;
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function logInfo(message: string, context?: LogContext) {
  write("info", message, context);
}

export function logWarn(message: string, context?: LogContext) {
  write("warn", message, context);
}

export function logError(message: string, context?: LogContext) {
  write("error", message, context);
}

export function reqContext(req: Request, extra: LogContext = {}): LogContext {
  return {
    requestId: (req as any).requestId,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    schoolId: req.user?.schoolId ?? null,
    ...extra,
  };
}
