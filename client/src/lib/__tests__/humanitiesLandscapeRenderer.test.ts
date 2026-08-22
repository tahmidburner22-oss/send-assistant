import { describe, expect, it } from "vitest";
import { canRenderHumanitiesLandscape, renderHumanitiesLandscape } from "../humanitiesLandscapeRenderer";

describe("humanitiesLandscapeRenderer", () => {
  const base = { yearGroup: "Year 10", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" };

  it("routes English, History, Geography and Business Studies to original fixed two-page landscape documents", () => {
    const samples = [
      { subject: "English", topic: "Language Paper 1", needle: "ORIGINAL FICTION EXTRACT" },
      { subject: "History", topic: "Conflict and Tension", needle: "ORIGINAL PRACTICE SOURCE" },
      { subject: "Geography", topic: "Urban Issues and Challenges", needle: "ORIGINAL PRACTICE DATA" },
      { subject: "Business Studies", topic: "Marketing and Finance", needle: "ORIGINAL PRACTICE CASE" },
    ];
    for (const sample of samples) {
      expect(canRenderHumanitiesLandscape({ ...base, ...sample })).toBe(true);
      const document = renderHumanitiesLandscape({ ...base, ...sample });
      expect(document.html.match(/class="humanities-page"/g)).toHaveLength(2);
      expect(document.html).toContain("@page { size: A4 landscape");
      expect(document.html).toContain('data-send="1"');
      expect(document.html).toContain("Support: Dyslexia · Age 10");
      expect(document.html).toContain(sample.needle);
      expect(document.html).toContain("background:#ffffff");
    }
  });

  it("uses subject-specific GCSE skill structures without a generic worksheet fall-through", () => {
    const english = renderHumanitiesLandscape({ ...base, subject: "English", topic: "Language Paper 2" });
    const history = renderHumanitiesLandscape({ ...base, subject: "History", topic: "Health and the People" });
    const geography = renderHumanitiesLandscape({ ...base, subject: "Geography", topic: "The Changing Economic World" });
    const business = renderHumanitiesLandscape({ ...base, subject: "Business Studies", topic: "Marketing and Finance" });
    expect(english.layout).toBe("english-reading-writing");
    expect(english.html).toContain("YOUR WRITING");
    expect(history.layout).toBe("history-source-judgement");
    expect(history.html).toContain("YOUR STRUCTURED RESPONSE");
    expect(geography.layout).toBe("geography-data-evaluation");
    expect(geography.html).toContain("YOUR JUSTIFIED EVALUATION");
    expect(business.layout).toBe("business-data-decision");
    expect(business.html).toContain("YOUR EVALUATED RECOMMENDATION");
    expect(business.html).toContain("Gross profit");
  });

  it("provides compact, concrete and print-safe support for ASC and low-vision pupils", () => {
    const asc = renderHumanitiesLandscape({ subject: "Geography", yearGroup: "Year 9", topic: "Climate Change", sendNeedId: "asc-sensory", readingAge: 14 });
    expect(asc.html).toContain('data-support-mode="asc"');
    expect(asc.html).toContain("Work route: read one task, complete its response box, then move to the next step.");
    expect(asc.html).toContain('data-layout-page="geography-evaluation"');
    expect(asc.html).toMatch(/\.humanities-page\[data-layout-page="geography-evaluation"\] \.linebox\.large,\s*\.humanities-page\[data-layout-page="business-evaluation"\] \.linebox\.large \{ min-height:36mm; \}/);

    const visual = renderHumanitiesLandscape({ subject: "Business", yearGroup: "Year 10", topic: "Marketing", sendNeedId: "vi", readingAge: 17 });
    expect(visual.html).toContain('data-support-mode="visual"');
    expect(visual.html).toContain("High-contrast borders and clear white response areas separate each task and answer space.");
    expect(visual.html).toContain('border-width:.65mm');
    expect(visual.html).toContain('.humanities-root[data-support-mode="visual"] { font-family:Arial, Helvetica, sans-serif; }');
    expect(visual.html).toContain('.humanities-root[data-support-mode="visual"] .card h2, .humanities-root[data-support-mode="visual"] .card h3 { font-size:10.6pt; }');
    expect(visual.html).toContain('.humanities-root[data-support-mode="visual"] .card p, .humanities-root[data-support-mode="visual"] .point { font-size:9.8pt; line-height:1.34; }');
    expect(visual.html).toContain('data-layout-page="business-evaluation"');
  });

  it("does not route primary or unrelated subjects into the secondary humanities fixed layouts", () => {
    expect(canRenderHumanitiesLandscape({ subject: "English", yearGroup: "Year 5", topic: "Stories" })).toBe(false);
    expect(canRenderHumanitiesLandscape({ subject: "Art & Design", yearGroup: "Year 10", topic: "Portraiture" })).toBe(false);
    expect(canRenderHumanitiesLandscape({ subject: "Business Studies", yearGroup: "Year 6", topic: "Enterprise" })).toBe(false);
  });
});
