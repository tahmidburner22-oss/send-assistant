import { describe, expect, it } from "vitest";
import { renderScienceLandscape } from "../scienceLandscapeRenderer";

describe("primary science landscape renderer", () => {
  it("uses a topic-specific, child-friendly Plants investigation rather than a generic observation sheet", () => {
    const document = renderScienceLandscape({ subject: "Science", yearGroup: "Year 1", topic: "Plants", readingAge: 6, sendNeedId: "Dyslexia" });

    expect(document.layout).toBe("primary-observation");
    expect(document.html).toContain("PLANTS — LOOK, SORT AND EXPLAIN");
    expect(document.html).toContain("I can name the main parts of a plant.");
    expect(document.html).toContain("root");
    expect(document.html).toContain("stem");
    expect(document.html).toContain("leaf");
    expect(document.html).toContain("flower");
    expect(document.html).toContain("primary-card look surface");
    expect(document.html).toContain("background:#ffffff");
    expect(document.html).toContain("Support: Dyslexia · Age 6");
  });

  it("uses correct upper-primary science content while keeping instructions short and the page contract fixed", () => {
    const document = renderScienceLandscape({ subject: "Science", yearGroup: "Year 4", topic: "States of Matter", readingAge: 8, sendNeedId: "Working Memory Difficulties" });

    expect(document.title).toContain("States of Matter");
    expect(document.html).toContain("STATES OF MATTER — LOOK, SORT AND EXPLAIN");
    expect(document.html).toContain("A solid keeps its shape.");
    expect(document.html).toContain("A liquid can flow.");
    expect(document.html).toContain("A gas fills its container.");
    expect(document.html).toContain("@page { size: A4 landscape; margin: 0; }");
    expect((document.html.match(/class=\"science-page\"/g) || [])).toHaveLength(1);
  });

  it("uses a complete-circuit model for Year 6 Electricity without turning visual colour into the only source of meaning", () => {
    const document = renderScienceLandscape({ subject: "Science", yearGroup: "Year 6", topic: "Electricity", readingAge: 10 });

    expect(document.html).toContain("ELECTRICITY — COMPLETE CIRCUITS");
    expect(document.html).toContain("A complete circuit is a closed loop.");
    expect(document.html).toContain("battery");
    expect(document.html).toContain("switch");
    expect(document.html).toContain("bulb");
    expect(document.html).toContain("primary-card explain surface");
  });
});
