import { describe, expect, it, vi } from "vitest";
import {
  runThreeTierDifferentiation,
  type DifferentiationTier,
} from "../threeTierDifferentiation";

type FixtureWorksheet = { id: string; metadata?: Record<string, unknown> };

const worksheet: FixtureWorksheet = { id: "source" };

describe("runThreeTierDifferentiation", () => {
  it("runs LA, MA and HA sequentially so one provider request completes before the next starts", async () => {
    const events: string[] = [];
    const differentiate = vi.fn(async (_worksheet: FixtureWorksheet, tier: DifferentiationTier) => {
      events.push(`${tier}:start`);
      await Promise.resolve();
      events.push(`${tier}:end`);
      return { id: tier };
    });

    const output = await runThreeTierDifferentiation({ worksheet, differentiate, groupId: "group-sequential" });

    expect(events).toEqual([
      "LA:start", "LA:end",
      "MA:start", "MA:end",
      "HA:start", "HA:end",
    ]);
    expect(differentiate.mock.calls.map(([, tier]) => tier)).toEqual(["LA", "MA", "HA"]);
    expect(output.groupId).toBe("group-sequential");
    expect(output.successCount).toBe(3);
    expect(output.failCount).toBe(0);
    expect(output.results.map((result) => result.attempts)).toEqual([1, 1, 1]);
  });

  it("retries each failed tier once, retains successful tiers, and exposes the final failure reason", async () => {
    const attempts: Record<DifferentiationTier, number> = { LA: 0, MA: 0, HA: 0 };
    const differentiate = vi.fn(async (_worksheet: FixtureWorksheet, tier: DifferentiationTier) => {
      attempts[tier] += 1;
      if (tier === "MA" && attempts[tier] === 1) throw new Error("temporary provider timeout");
      if (tier === "HA") throw new Error("provider unavailable");
      return { id: `${tier}-${attempts[tier]}` };
    });

    const output = await runThreeTierDifferentiation({ worksheet, differentiate, groupId: "group-recovery" });

    expect(attempts).toEqual({ LA: 1, MA: 2, HA: 2 });
    expect(output.successCount).toBe(2);
    expect(output.failCount).toBe(1);
    expect(output.results).toMatchObject([
      { tier: "LA", status: "fulfilled", worksheet: { id: "LA-1" }, attempts: 1 },
      { tier: "MA", status: "fulfilled", worksheet: { id: "MA-2" }, attempts: 2 },
      { tier: "HA", status: "rejected", error: "provider unavailable", attempts: 2 },
    ]);
  });

  it("can retry one named failed tier without re-running successful tiers and preserves the group id", async () => {
    const calls: DifferentiationTier[] = [];
    const differentiate = vi.fn(async (_worksheet: FixtureWorksheet, tier: DifferentiationTier) => {
      calls.push(tier);
      return { id: `${tier}-replacement` };
    });

    const output = await runThreeTierDifferentiation({
      worksheet,
      differentiate,
      groupId: "group-retained",
      tiers: ["HA"],
    });

    expect(calls).toEqual(["HA"]);
    expect(output.groupId).toBe("group-retained");
    expect(output.results).toEqual([
      { tier: "HA", status: "fulfilled", worksheet: { id: "HA-replacement" }, attempts: 1 },
    ]);
  });
});
