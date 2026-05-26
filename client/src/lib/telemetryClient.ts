/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * telemetryClient.ts — FEAT-H6.
 *
 * Tiny fetch hook + helper for the admin telemetry dashboard.
 * Wraps the new GET /api/admin/telemetry?metric=... endpoint with
 * loading / error / success states. Pure (in node) when fetcher is
 * supplied; otherwise uses global fetch.
 */

import { useEffect, useState } from "react";
import type {
  ValidatorFiringHistogram,
  RegenerationHeatmap,
  TokenCostRollup,
} from "./telemetryAggregators";

export type TelemetryMetric = "validatorFirings" | "regenerationHeatmap" | "tokenCostRollup";

export interface TelemetryQuery {
  metric: TelemetryMetric;
  windowDays?: number;
}

export interface TelemetryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

type Fetcher = (input: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

function defaultFetcher(): Fetcher {
  if (typeof fetch === "function") {
    return fetch.bind(globalThis) as unknown as Fetcher;
  }
  return async () => ({ ok: false, status: 0, json: async () => ({}) });
}

export async function fetchTelemetry<T>(
  query: TelemetryQuery,
  fetcher: Fetcher = defaultFetcher(),
): Promise<T> {
  const params = new URLSearchParams({
    metric: query.metric,
    windowDays: String(query.windowDays ?? 30),
  });
  const res = await fetcher(`/api/admin/telemetry?${params.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Telemetry fetch failed: HTTP ${res.status}`);
  const body = (await res.json()) as { data?: T; error?: string };
  if (body.error) throw new Error(body.error);
  return (body.data ?? body) as T;
}

export function useTelemetry<T>(query: TelemetryQuery): TelemetryState<T> {
  const [state, setState] = useState<TelemetryState<T>>({ data: null, loading: true, error: null });
  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    fetchTelemetry<T>(query)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [query.metric, query.windowDays]);
  return state;
}

// Convenience typed wrappers.
export const useValidatorFirings = (windowDays = 30) =>
  useTelemetry<ValidatorFiringHistogram>({ metric: "validatorFirings", windowDays });
export const useRegenerationHeatmap = (windowDays = 30) =>
  useTelemetry<RegenerationHeatmap>({ metric: "regenerationHeatmap", windowDays });
export const useTokenCostRollup = (windowDays = 30) =>
  useTelemetry<TokenCostRollup>({ metric: "tokenCostRollup", windowDays });

export const __testing = { defaultFetcher };
