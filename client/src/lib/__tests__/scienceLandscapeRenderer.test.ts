import { describe, expect, it } from "vitest";
import { canRenderScienceLandscape, renderScienceLandscape } from "../scienceLandscapeRenderer";

const chemistry = (topic: string, yearGroup = "Year 10") => ({
  subject: "Chemistry",
  yearGroup,
  topic,
  sendNeedId: "Dyslexia",
  readingAge: 10,
  examBoard: "AQA",
});

describe("science landscape renderer", () => {
  it("routes the supplied Chemistry reference concepts to original one-page landscape layouts", () => {
    const atomic = renderScienceLandscape(chemistry("Atomic Structure and Models"));
    const concentration = renderScienceLandscape(chemistry("Concentration of Solutions"));
    const metallic = renderScienceLandscape(chemistry("Metallic Bonding"));
    expect(atomic.layout).toBe("timeline");
    expect(concentration.layout).toBe("formula");
    expect(metallic.layout).toBe("interpretation");
    for (const document of [atomic, concentration, metallic]) {
      expect(document.html).toContain("@page { size: A4 landscape; margin: 0; }");
      expect(document.html).toContain('class="science-page"');
      expect((document.html.match(/class="science-page"/g) || [])).toHaveLength(1);
      expect(document.html).toContain('data-send="1"');
      expect(document.html).toContain("Support: Dyslexia · Age 10");
      expect(document.html).toContain("background: #ffffff");
    }
  });

  it("keeps scientific diagrams deterministic and topic-specific", () => {
    const atomic = renderScienceLandscape(chemistry("Atomic Structure and Models"));
    const concentration = renderScienceLandscape(chemistry("Concentration of Solutions"));
    const metallic = renderScienceLandscape(chemistry("Metallic Bonding"));
    expect(atomic.html).toContain('aria-label="solid sphere model"');
    expect(concentration.html).toContain('aria-label="beaker showing solution, solvent and solute"');
    expect(metallic.html).toContain('aria-label="metallic bonding particle model"');
  });

  it("provides an intentionally spacious primary route with simple direct prompts", () => {
    const primary = renderScienceLandscape({ subject: "Science", yearGroup: "Year 2", topic: "Plants", sendNeedId: "Working Memory Difficulties", readingAge: 6 });
    expect(primary.layout).toBe("primary-observation");
    expect(primary.html).toContain("LOOK");
    expect(primary.html).toContain("SORT");
    expect(primary.html).toContain("SAY AND WRITE");
    expect(primary.html).toContain("Support: Working memory · Age 6");
    expect(canRenderScienceLandscape({ subject: "Science", yearGroup: "Year 2", topic: "Plants" })).toBe(true);
  });

  it("does not claim a dedicated secondary Science template for an unsupported topic", () => {
    expect(canRenderScienceLandscape({ subject: "Science", yearGroup: "Year 8", topic: "Forces" })).toBe(false);
  });
});
