import { describe, expect, it } from "vitest";
import { getPresentationSubjectVisual, isHighContrastSafeSubjectVisual } from "../presentationVisualTheme";

const palette = {
  primary: "#1B2A4A",
  secondary: "#2563EB",
  accent: "#F59E0B",
  bg: "#FFFFFF",
  light: "#EFF6FF",
  gradient: "linear-gradient(135deg, #1B2A4A 0%, #2563EB 100%)",
};

describe("presentation subject visual themes", () => {
  it("chooses distinct, meaningful decorative motifs for core lesson subjects", () => {
    const maths = getPresentationSubjectVisual("Mathematics", palette);
    const chemistry = getPresentationSubjectVisual("Chemistry", palette);
    const history = getPresentationSubjectVisual("History", palette);
    const geography = getPresentationSubjectVisual("Geography", palette);

    expect(maths.motif).toBe("graph-grid");
    expect(chemistry.motif).toBe("molecules");
    expect(history.motif).toBe("manuscript");
    expect(geography.motif).toBe("contours");
    expect(maths.surfaceBackground).toContain("linear-gradient");
    expect(chemistry.titleBackground).toContain(palette.gradient);
  });

  it("keeps decorative visuals non-essential and safe in high-contrast mode", () => {
    const visual = getPresentationSubjectVisual("Physics", palette, true);

    expect(visual.motif).toBe("orbit");
    expect(visual.titleBackground).toBe("#0A0A0A");
    expect(visual.surfaceBackground).toBe("#FFFFFF");
    expect(isHighContrastSafeSubjectVisual(visual)).toBe(true);
  });

  it("has a graceful generic lesson fallback for uncatalogued subjects", () => {
    const visual = getPresentationSubjectVisual("Classics", palette);

    expect(visual.motif).toBe("abstract");
    expect(visual.label).toBe("Lesson focus");
    expect(visual.frameColor).toMatch(/^rgba\(/);
  });
});
