import { describe, expect, it } from "vitest";
import { autoGenerateCircuitDiagram, validateDiagram, type DiagramSpec } from "../engines/diagramEngine";

const base: Omit<DiagramSpec, "components"> = {
  type: "general",
  title: "Clear labelled structure",
  altText: "A simple diagram with clearly separated labelled boxes.",
  boxWidth: 400,
  boxHeight: 220,
  connections: [],
};

describe("structured diagram geometry gate", () => {
  it("accepts separated external labels within the diagram boundary", () => {
    const spec: DiagramSpec = {
      ...base,
      components: [
        { id: "left", symbol: "box-labeled", x: 96, y: 128, label: "Input", labelPosition: "above" },
        { id: "right", symbol: "box-labeled", x: 304, y: 128, label: "Output", labelPosition: "above" },
      ],
    };

    const result = validateDiagram(spec, 400, 220);
    expect(result.pass).toBe(true);
  });

  it("keeps the approved series and parallel circuit patterns renderable", () => {
    expect(autoGenerateCircuitDiagram("series circuit")).not.toBeNull();
    expect(autoGenerateCircuitDiagram("parallel circuit")).not.toBeNull();
  });

  it("rejects an external label that would be clipped or overlap the diagram edge", () => {
    const spec: DiagramSpec = {
      ...base,
      components: [
        { id: "edge", symbol: "box-labeled", x: 48, y: 120, label: "Long edge label", labelPosition: "left" },
      ],
    };

    const result = validateDiagram(spec, 400, 220);
    expect(result.pass).toBe(false);
    expect(result.allErrors.some(error => error.includes("clipped"))).toBe(true);
  });
});
