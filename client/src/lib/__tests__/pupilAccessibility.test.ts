import { describe, expect, it } from "vitest";
import { buildPupilReaderSegments, plainTextForPupilReader, spokenWordIndex } from "../pupilAccessibility";

describe("pupil accessibility reader helpers", () => {
  it("creates concise screen-reader segments and excludes teacher material", () => {
    const segments = buildPupilReaderSegments({
      title: "Fractions practice",
      sections: [
        { title: "Learning objective", content: "Compare fractions with the same denominator.", type: "objective" },
        { title: "Answers", content: "1/2, 3/4", type: "answers" },
        { title: "Teacher notes", content: "Prompt pupil if needed.", teacherOnly: true },
      ],
    });

    expect(segments.map((segment) => segment.text).join(" ")).toContain("Compare fractions");
    expect(segments.map((segment) => segment.text).join(" ")).not.toContain("Prompt pupil");
    expect(segments.map((segment) => segment.text).join(" ")).not.toContain("1/2, 3/4");
  });

  it("extracts a fixed-layout reader transcript without changing the source HTML", () => {
    const html = "<html><style>.page{width:285mm}</style><body><h1>Atomic structure</h1><p>Describe the nucleus.</p></body></html>";
    const segments = buildPupilReaderSegments({ fixedLayoutHtml: html });

    expect(segments).toHaveLength(1);
    expect(segments[0].text).toContain("Atomic structure");
    expect(segments[0].text).not.toContain("width:285mm");
  });

  it("normalises worksheet markup and calculates a spoken-word index", () => {
    expect(plainTextForPupilReader("<p>Atoms &amp; ions</p>")).toBe("Atoms and ions");
    expect(spokenWordIndex("One two three", 4)).toBe(1);
  });
});
