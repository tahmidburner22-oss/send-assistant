import { describe, expect, it } from "vitest";
import { fixedLayoutPdfPlacement } from "../mathsGoldPdf";

describe("fixed-layout PDF placement", () => {
  it("keeps the protected Gold Maths print margins", () => {
    expect(fixedLayoutPdfPlacement("gold")).toEqual({ x: 6, y: 5, width: 285, height: 200 });
  });

  it("does not translate zero-margin Science or Humanities pages", () => {
    expect(fixedLayoutPdfPlacement("zero-margin")).toEqual({ x: 0, y: 0, width: 285, height: 200 });
  });
});
