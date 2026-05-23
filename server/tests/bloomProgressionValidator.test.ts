import { describe, it, expect } from "vitest";
import {
  inferBloomLevel,
  checkBloomMonotonicity,
  checkScienceWorkingSpace,
  BLOOM_ORDER,
} from "../../client/src/lib/bloomProgressionValidator";

describe("PR-14 / inferBloomLevel", () => {
  it("identifies 'calculate' as apply level", () => {
    expect(inferBloomLevel("Calculate the area of this rectangle.")).toBe("apply");
  });

  it("identifies 'evaluate' as evaluate level", () => {
    expect(inferBloomLevel("Evaluate the effectiveness of this policy.")).toBe("evaluate");
  });

  it("identifies 'name' as remember level", () => {
    expect(inferBloomLevel("Name three types of rock.")).toBe("remember");
  });

  it("identifies 'explain' as understand level", () => {
    expect(inferBloomLevel("Explain why photosynthesis is important.")).toBe("understand");
  });

  it("identifies 'compare' as analyse level", () => {
    expect(inferBloomLevel("Compare the two methods of heat transfer.")).toBe("analyse");
  });

  it("defaults to remember for ambiguous content", () => {
    expect(inferBloomLevel("What is the value?")).toBe("remember");
  });
});

describe("PR-14 / checkBloomMonotonicity", () => {
  it("correctly ordered questions produce no violations", () => {
    const sections = [
      { type: "q-short", title: "Q1", content: "Name the capital of France." },
      { type: "q-short", title: "Q2", content: "Explain why Paris is the capital." },
      { type: "q-extended", title: "Q3", content: "Evaluate the importance of Paris in European history." },
    ];
    const result = checkBloomMonotonicity(sections);
    expect(result.isMonotone).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  it("detects a large Bloom drop as a violation", () => {
    const sections = [
      { type: "q-short", title: "Q1", content: "Evaluate the impact of climate change." },
      { type: "q-short", title: "Q2", content: "Name one greenhouse gas." },
    ];
    const result = checkBloomMonotonicity(sections);
    expect(result.isMonotone).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("allows one step back without flagging", () => {
    const sections = [
      { type: "q-short", title: "Q1", content: "Explain why water expands when frozen." },
      { type: "q-short", title: "Q2", content: "Name the process of water turning to ice." },
    ];
    // understand -> remember is one step — should be allowed
    const result = checkBloomMonotonicity(sections);
    expect(result.isMonotone).toBe(true);
  });

  it("ignores non-question sections", () => {
    const sections = [
      { type: "learning-objective", title: "LO", content: "Evaluate everything." },
      { type: "q-short", title: "Q1", content: "Name a planet." },
      { type: "word-bank", title: "Vocab", content: "Evaluate this." },
      { type: "q-short", title: "Q2", content: "Explain why Mars is red." },
    ];
    const result = checkBloomMonotonicity(sections);
    expect(result.assignments.length).toBe(2); // Only question sections
    expect(result.isMonotone).toBe(true);
  });
});

describe("PR-14 / checkScienceWorkingSpace", () => {
  it("flags science calculation questions missing Working: stub", () => {
    const sections = [
      { type: "q-short", title: "Q1", content: "Calculate the speed if distance = 100m and time = 10s." },
    ];
    const result = checkScienceWorkingSpace(sections, "Physics");
    expect(result.sectionsNeedingWorkingSpace.length).toBe(1);
    expect(result.warnings.length).toBe(1);
  });

  it("does not flag questions with existing Working: stub", () => {
    const sections = [
      { type: "q-short", title: "Q1", content: "Calculate the speed.\nWorking:\n\nAnswer: ___" },
    ];
    const result = checkScienceWorkingSpace(sections, "Physics");
    expect(result.sectionsNeedingWorkingSpace.length).toBe(0);
  });

  it("does not apply to non-science subjects", () => {
    const sections = [
      { type: "q-short", title: "Q1", content: "Calculate 5 + 3." },
    ];
    const result = checkScienceWorkingSpace(sections, "Mathematics");
    expect(result.sectionsNeedingWorkingSpace.length).toBe(0);
  });

  it("does not flag non-calculation questions in science", () => {
    const sections = [
      { type: "q-short", title: "Q1", content: "Describe the process of osmosis." },
    ];
    const result = checkScienceWorkingSpace(sections, "Biology");
    expect(result.sectionsNeedingWorkingSpace.length).toBe(0);
  });
});
