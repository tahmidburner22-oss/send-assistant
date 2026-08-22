import { describe, expect, it } from "vitest";
import { formatPrimaryWorksheetRules, getPrimaryWorksheetPolicy } from "../primaryWorksheetPolicy";

describe("primary worksheet policy", () => {
  it("sets a concrete, short-sentence KS1 standard", () => {
    const policy = getPrimaryWorksheetPolicy("Year 1");
    expect(policy.stage).toBe("KS1");
    expect(policy.pupilFacingRules.join(" ")).toContain("no more than 8 words");
    expect(policy.pupilFacingRules.join(" ")).toContain("one small, concrete objective");
  });

  it("sets an instructional lower-KS2 standard rather than an infantilised one", () => {
    const policy = getPrimaryWorksheetPolicy("Year 4");
    expect(policy.stage).toBe("Lower KS2");
    expect(policy.pupilFacingRules.join(" ")).toContain("no more than 12 words");
    expect(policy.pupilFacingRules.join(" ")).toContain("Do not infantilise");
  });

  it("sets mature reasoning and non-colour-only access expectations for upper KS2", () => {
    const policy = getPrimaryWorksheetPolicy("Year 6");
    expect(policy.stage).toBe("Upper KS2");
    const prompt = formatPrimaryWorksheetRules("Year 6");
    expect(prompt).toContain("reasoning");
    expect(prompt).toContain("Colour must supplement text and symbols");
  });
});
