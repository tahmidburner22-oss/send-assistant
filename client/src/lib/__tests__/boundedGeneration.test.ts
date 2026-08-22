import { describe, expect, it } from "vitest";
import { GenerationTimeoutError, withGenerationTimeout } from "../boundedGeneration";

describe("withGenerationTimeout", () => {
  it("returns a completed generation result before the timeout", async () => {
    await expect(withGenerationTimeout(Promise.resolve("worksheet"), 20)).resolves.toBe("worksheet");
  });

  it("rejects a stalled generation with a teacher-usable timeout error", async () => {
    const never = new Promise<never>(() => undefined);
    await expect(withGenerationTimeout(never, 5)).rejects.toBeInstanceOf(GenerationTimeoutError);
  });
});
