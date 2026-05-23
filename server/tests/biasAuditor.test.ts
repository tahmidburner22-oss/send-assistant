import { describe, it, expect } from "vitest";
import { auditWorksheetBias, type BiasFinding } from "../../client/src/lib/biasAuditor";

describe("PR-12 / biasAuditor", () => {
  it("flags all-Anglo name distribution", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Q1", content: "James has 5 apples. Oliver gives him 3 more. Harry takes 2." },
        { type: "q-short", title: "Q2", content: "Emily bakes 12 cakes. Charlotte eats 4. Sophie eats 3." },
        { type: "q-short", title: "Q3", content: "George runs 5km. Edward runs 3km. William runs 7km." },
      ],
    };
    const result = auditWorksheetBias(ws);
    expect(result.findings.some((f) => f.kind === "name-distribution")).toBe(true);
  });

  it("does not flag diverse name set", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Q1", content: "Mohammed has 5 apples. Priya gives him 3 more." },
        { type: "q-short", title: "Q2", content: "Aiden bakes 12 cakes. Fatima eats 4." },
        { type: "q-short", title: "Q3", content: "Kai runs 5km. Zara runs 3km." },
      ],
    };
    const result = auditWorksheetBias(ws);
    expect(result.findings.filter((f) => f.kind === "name-distribution").length).toBe(0);
  });

  it("flags gendered profession assumptions", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Q1", content: "Sarah is a nurse at the hospital. She works 12 hours." },
      ],
    };
    const result = auditWorksheetBias(ws);
    expect(result.findings.some((f) => f.kind === "gendered-profession")).toBe(true);
  });

  it("flags socioeconomic assumptions", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Q1", content: "On their family holiday to Spain, the Smiths drove 450 miles." },
      ],
    };
    const result = auditWorksheetBias(ws);
    expect(result.findings.some((f) => f.kind === "socioeconomic-assumption")).toBe(true);
  });

  it("flags religious default usage", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Q1", content: "For his christmas present, Tom received a bicycle costing £150." },
      ],
    };
    const result = auditWorksheetBias(ws);
    expect(result.findings.some((f) => f.kind === "religious-default")).toBe(true);
  });

  it("returns score of 100 for clean worksheet", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Q1", content: "Calculate 2 + 3." },
        { type: "q-short", title: "Q2", content: "What is the area of a rectangle with length 5cm and width 3cm?" },
      ],
    };
    const result = auditWorksheetBias(ws);
    expect(result.score).toBe(100);
    expect(result.findings.length).toBe(0);
  });

  it("score decreases with more findings", () => {
    const ws = {
      sections: [
        { type: "q-short", title: "Q1", content: "James has 5 apples. Oliver gives him 3. Harry takes 2. George shares. William counts. Edward helps. Charlotte watches." },
        { type: "q-short", title: "Q2", content: "On their family holiday, the nurse Sarah took her private tutor along." },
      ],
    };
    const result = auditWorksheetBias(ws);
    expect(result.score).toBeLessThan(100);
  });
});
