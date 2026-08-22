import { describe, expect, it } from "vitest";
import { canRenderHumanitiesLandscape, renderHumanitiesLandscape } from "../humanitiesLandscapeRenderer";

describe("humanitiesLandscapeRenderer", () => {
  const base = { yearGroup: "Year 10", sendNeedId: "Dyslexia", readingAge: 10, examBoard: "AQA" };

  it("routes English, History and Geography to original fixed two-page landscape documents", () => {
    const samples = [
      { subject: "English", topic: "Language Paper 1", needle: "ORIGINAL FICTION EXTRACT" },
      { subject: "History", topic: "Conflict and Tension", needle: "ORIGINAL PRACTICE SOURCE" },
      { subject: "Geography", topic: "Urban Issues and Challenges", needle: "ORIGINAL PRACTICE DATA" },
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
    expect(english.layout).toBe("english-reading-writing");
    expect(english.html).toContain("YOUR WRITING");
    expect(history.layout).toBe("history-source-judgement");
    expect(history.html).toContain("YOUR STRUCTURED RESPONSE");
    expect(geography.layout).toBe("geography-data-evaluation");
    expect(geography.html).toContain("YOUR JUSTIFIED EVALUATION");
  });

  it("does not route primary or unrelated subjects into the secondary humanities fixed layouts", () => {
    expect(canRenderHumanitiesLandscape({ subject: "English", yearGroup: "Year 5", topic: "Stories" })).toBe(false);
    expect(canRenderHumanitiesLandscape({ subject: "Art & Design", yearGroup: "Year 10", topic: "Portraiture" })).toBe(false);
  });
});
