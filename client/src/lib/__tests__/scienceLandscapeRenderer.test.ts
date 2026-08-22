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

  it("routes the supplied Biology, Chemistry and Physics expansion topics to dedicated one-page layouts", () => {
    const cases = [
      [chemistry("Cells and Microscopy"), "cells", "plant cell with cell wall"],
      [chemistry("Photosynthesis"), "photosynthesis", "leaf showing carbon dioxide entering"],
      [chemistry("Genetics and Inheritance"), "genetics", "Punnett square"],
      [chemistry("Ionic Bonding"), "ionic", "electron transfer from sodium"],
      [chemistry("Covalent Bonding"), "covalent", "shared electron pairs"],
      [chemistry("Rates of Reaction"), "rates", "product against time graph"],
      [{ ...chemistry("Forces"), subject: "Physics" }, "forces", "free body diagram"],
      [{ ...chemistry("Energy Stores"), subject: "Physics" }, "energy", "energy store transfer"],
      [{ ...chemistry("Waves"), subject: "Physics" }, "waves", "transverse wave labelled"],
    ] as const;
    for (const [options, layout, diagram] of cases) {
      const document = renderScienceLandscape(options);
      expect(document.layout).toBe(layout);
      expect(canRenderScienceLandscape(options)).toBe(true);
      expect((document.html.match(/class="science-page"/g) || [])).toHaveLength(1);
      expect(document.html).toContain('data-send="1"');
      expect(document.html).toContain("Support: Dyslexia · Age 10");
      expect(document.html).toContain(diagram);
    }
  });

  it("provides explicit enlarged-print typography and high contrast for low-vision pupils", () => {
    const visual = renderScienceLandscape({ subject: "Physics", yearGroup: "Year 10", topic: "Waves", sendNeedId: "vi", readingAge: 17 });
    expect(visual.layout).toBe("waves");
    expect((visual.html.match(/class="science-page"/g) || [])).toHaveLength(1);
    expect(visual.html).toContain('data-support-mode="visual"');
    expect(visual.html).toContain('.science-root[data-support-mode="visual"] { font-family:Arial, Helvetica, sans-serif; }');
    expect(visual.html).toContain('.science-root[data-support-mode="visual"] .card p, .science-root[data-support-mode="visual"] .q { font-size:9.7pt; line-height:1.34; }');
    expect(visual.html).toContain('border-width:.7mm');
  });

  it("keeps reading-age adaptation limited to learner-facing wording in the expansion layouts", () => {
    const standard = renderScienceLandscape({ subject: "Physics", yearGroup: "Year 10", topic: "Waves", sendNeedId: "Dyslexia", readingAge: 14 });
    const adapted = renderScienceLandscape({ subject: "Physics", yearGroup: "Year 10", topic: "Waves", sendNeedId: "Dyslexia", readingAge: 10 });
    expect(standard.layout).toBe("waves");
    expect(adapted.layout).toBe("waves");
    expect((standard.html.match(/class="science-page"/g) || [])).toHaveLength(1);
    expect((adapted.html.match(/class="science-page"/g) || [])).toHaveLength(1);
    expect(adapted.html).toContain("How are transverse and longitudinal waves different?");
    expect(standard.html).toContain("State the difference between a transverse and a longitudinal wave.");
  });

  it("does not claim a dedicated secondary Science template for an unsupported topic", () => {
    expect(canRenderScienceLandscape({ subject: "Science", yearGroup: "Year 8", topic: "Magnets" })).toBe(false);
  });
});
