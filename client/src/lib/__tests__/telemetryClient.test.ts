/**
 * telemetryClient.test.ts — W1 / FEAT-H6.
 *
 * Tests cover the pure `fetchTelemetry` branch logic so the H6 admin
 * dashboard hydration is exercised without a DOM. The hooks themselves
 * are thin `useEffect` wrappers; the interesting branches (URL shape,
 * error propagation, body unwrapping) live in `fetchTelemetry`.
 */

import { describe, it, expect } from "vitest";
import { fetchTelemetry, type TelemetryQuery } from "../telemetryClient";

type FetcherInit = RequestInit | undefined;
type FakeRes = { ok: boolean; status: number; json: () => Promise<unknown> };

function makeFetcher(impl: (url: string, init: FetcherInit) => FakeRes) {
  const calls: { url: string; init: FetcherInit }[] = [];
  const fetcher = async (url: string, init?: FetcherInit) => {
    calls.push({ url, init });
    return impl(url, init);
  };
  return { fetcher, calls };
}

describe("fetchTelemetry — URL + happy path", () => {
  it("targets /api/telemetry/admin/telemetry with the metric + windowDays query", async () => {
    const { fetcher, calls } = makeFetcher(() => ({
      ok: true,
      status: 200,
      json: async () => ({ data: { totalFirings: 0, perValidator: [] } }),
    }));
    const query: TelemetryQuery = { metric: "validatorFirings", windowDays: 7 };
    await fetchTelemetry(query, fetcher);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/api/telemetry/admin/telemetry");
    expect(calls[0].url).toContain("metric=validatorFirings");
    expect(calls[0].url).toContain("windowDays=7");
  });

  it("defaults windowDays to 30 when omitted", async () => {
    const { fetcher, calls } = makeFetcher(() => ({
      ok: true,
      status: 200,
      json: async () => ({ data: { totalRegenerations: 0, rows: [] } }),
    }));
    await fetchTelemetry({ metric: "regenerationHeatmap" }, fetcher);
    expect(calls[0].url).toContain("windowDays=30");
  });

  it("unwraps the { data } envelope", async () => {
    const payload = { totalCalls: 5, byDay: [], byProvider: [] };
    const { fetcher } = makeFetcher(() => ({
      ok: true,
      status: 200,
      json: async () => ({ data: payload }),
    }));
    const result = await fetchTelemetry<typeof payload>(
      { metric: "tokenCostRollup" },
      fetcher,
    );
    expect(result).toEqual(payload);
  });

  it("falls back to the bare body when no { data } envelope is present", async () => {
    const payload = { totalCalls: 1 };
    const { fetcher } = makeFetcher(() => ({
      ok: true,
      status: 200,
      json: async () => payload,
    }));
    const result = await fetchTelemetry<typeof payload>(
      { metric: "tokenCostRollup" },
      fetcher,
    );
    expect(result).toEqual(payload);
  });
});

describe("fetchTelemetry — error branches", () => {
  it("throws when the HTTP response is not ok", async () => {
    const { fetcher } = makeFetcher(() => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));
    await expect(
      fetchTelemetry({ metric: "validatorFirings" }, fetcher),
    ).rejects.toThrow(/HTTP 500/);
  });

  it("propagates a server-supplied { error } message", async () => {
    const { fetcher } = makeFetcher(() => ({
      ok: true,
      status: 200,
      json: async () => ({ error: "metric unknown" }),
    }));
    await expect(
      fetchTelemetry({ metric: "validatorFirings" }, fetcher),
    ).rejects.toThrow(/metric unknown/);
  });
});
