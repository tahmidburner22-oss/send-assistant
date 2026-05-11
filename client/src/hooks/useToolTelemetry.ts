/**
 * useToolTelemetry — privacy-preserving usage events for every tool page.
 *
 * Wired into AIToolPage and PupilDocumentsPanel so we can answer:
 *   - which tools do teachers actually use?
 *   - which generate calls fail (and on which provider)?
 *   - do outputs get copied / downloaded / assigned, or abandoned?
 *   - how often do teachers paste PII that we block?
 *
 * Delivery:
 *   - Events are POSTed to /api/telemetry/tool-event.
 *   - Failures are swallowed — telemetry must NEVER break the UX.
 *   - Requests use `sendBeacon` for final events where available (so a tab
 *     close still flushes), otherwise `fetch` with `keepalive: true`.
 *   - For parent-portal callers we forward the cached X-Parent-Code from
 *     localStorage (same key the portal uses) so the server can classify
 *     the event as "parent" without any extra plumbing.
 */
import { useCallback, useEffect, useRef } from "react";

export type ToolEventName =
  | "tool_opened"
  | "tool_closed"
  | "generate_start"
  | "generate_success"
  | "generate_fail"
  | "output_copied"
  | "output_downloaded"
  | "output_printed"
  | "output_assigned"
  | "draft_restored"
  | "draft_discarded"
  | "pii_blocked";

export interface ToolEventPayload {
  provider?: string;
  durationMs?: number;
  errorCode?: string;
}

interface Api {
  fire: (event: ToolEventName, payload?: ToolEventPayload) => void;
  /** Begin a timed operation; returns a fn that, when called, fires the matching
   * success/fail event with the elapsed durationMs. */
  startTimer: (event: ToolEventName) => (outcome: "success" | "fail", payload?: ToolEventPayload) => void;
}

const PARENT_CODE_STORAGE_KEY = "adaptly_parent_code";

function readParentCode(): string | null {
  try {
    return window.localStorage.getItem(PARENT_CODE_STORAGE_KEY);
  } catch { return null; }
}

function postEvent(body: Record<string, unknown>, useBeacon = false): void {
  try {
    const url = "/api/telemetry/tool-event";
    const json = JSON.stringify(body);
    // sendBeacon can't set custom headers (like X-Parent-Code), so only use it
    // for teacher-session events where cookies carry the auth. Otherwise fetch.
    const parentCode = readParentCode();
    if (useBeacon && !parentCode && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([json], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (parentCode) headers["X-Parent-Code"] = parentCode;
    // Fire-and-forget — we deliberately don't await this.
    fetch(url, { method: "POST", credentials: "include", headers, body: json, keepalive: true })
      .catch(() => { /* swallow */ });
  } catch { /* swallow */ }
}

export function useToolTelemetry(toolId: string): Api {
  const openedRef = useRef(false);
  const toolIdRef = useRef(toolId);
  toolIdRef.current = toolId;

  const fire = useCallback((event: ToolEventName, payload?: ToolEventPayload) => {
    const tid = toolIdRef.current;
    if (!tid) return;
    postEvent({
      toolId: tid,
      eventName: event,
      provider: payload?.provider,
      durationMs: payload?.durationMs,
      errorCode: payload?.errorCode,
    });
  }, []);

  const startTimer = useCallback((event: ToolEventName) => {
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    fire(event);
    return (outcome: "success" | "fail", payload?: ToolEventPayload) => {
      const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
      const durationMs = Math.max(0, Math.round(t1 - t0));
      const name: ToolEventName = outcome === "success" ? "generate_success" : "generate_fail";
      fire(name, { ...payload, durationMs });
    };
  }, [fire]);

  // Fire tool_opened once per mount and tool_closed once on unmount.
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    fire("tool_opened");
    const handleBeforeUnload = () => postEvent({ toolId: toolIdRef.current, eventName: "tool_closed" }, true);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      fire("tool_closed");
    };
  }, [fire]);

  return { fire, startTimer };
}

export default useToolTelemetry;
