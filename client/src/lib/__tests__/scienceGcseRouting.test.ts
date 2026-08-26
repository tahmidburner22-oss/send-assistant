import { describe, expect, it } from "vitest";
import { getGcseTopicChoices } from "../gcseTopicCatalogue";
import { resolveGcseScienceRenderRoute } from "../scienceGcseRouting";
import { renderScienceLandscape } from "../scienceLandscapeRenderer";

describe("GCSE Science DfE routing", () => {
  const year10Foundation = getGcseTopicChoices("science", "Year 10", "foundation");

  it("routes the exact atomic-structure DfE target to the reviewed atomic page", () => {
    const atomic = year10Foundation.find((choice) => choice.topic === "Atomic structure and isotopes");
    expect(atomic).toBeDefined();

    const route = resolveGcseScienceRenderRoute(atomic);
    expect(route).toMatchObject({ kind: "dedicated", layout: "atomic-structure" });

    const document = renderScienceLandscape({
      subject: "Science",
      yearGroup: "Year 10",
      topic: atomic!.topic,
      learningObjective: atomic!.objective,
      layoutOverride: route.kind === "dedicated" ? route.layout : undefined,
    });

    expect(document.layout).toBe("atomic-structure");
    expect(document.html).toContain("NUCLEUS, ELECTRONS AND ISOTOPES");
    expect(document.html).toContain("positively charged nucleus surrounded by negatively charged electrons");
    expect(document.html).toContain("carbon-12");
    expect(document.html).not.toContain("HOW MODELS CHANGED");
  });

  it("does not route an unmapped DfE target through an approximately related fixed layout", () => {
    const periodicTable = year10Foundation.find((choice) => choice.topic === "The periodic table");
    expect(periodicTable).toBeDefined();

    expect(resolveGcseScienceRenderRoute(periodicTable)).toMatchObject({ kind: "generic" });
  });
});
