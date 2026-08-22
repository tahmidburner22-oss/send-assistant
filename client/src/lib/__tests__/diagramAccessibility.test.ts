import { describe, expect, it } from "vitest";
import { buildDiagramAccessibilityDescription, extractDiagramSpec } from "../ai";

describe("diagram accessibility contract", () => {
  it("derives a concise non-visual description from structured reference content", () => {
    const description = buildDiagramAccessibilityDescription({
      type: "flow",
      title: "Water cycle",
      steps: ["Evaporation", "Condensation", "Precipitation"],
    });

    expect(description).toContain("Water cycle");
    expect(description).toContain("3 ordered stages");
    expect(description).toContain("Evaporation");
    expect(description.length).toBeLessThanOrEqual(700);
  });

  it("keeps a meaningful author-supplied description when parsing a diagram marker", () => {
    const spec = extractDiagramSpec('[[DIAGRAM:{"type":"number-line","title":"Integers","start":-3,"end":3,"accessibilityDescription":"A number line from negative three to positive three, with zero at the centre."}]]');

    expect(spec).toMatchObject({ type: "number-line", accessibilityDescription: "A number line from negative three to positive three, with zero at the centre." });
  });

  it("does not turn the accessibility description into an assessment task", () => {
    const description = buildDiagramAccessibilityDescription({
      type: "bar",
      title: "Rainfall reference",
      bars: [{ label: "January", value: 40 }, { label: "February", value: 55 }],
    });

    expect(description).toContain("January: 40");
    expect(description).not.toMatch(/answer|calculate|question/i);
  });
});
