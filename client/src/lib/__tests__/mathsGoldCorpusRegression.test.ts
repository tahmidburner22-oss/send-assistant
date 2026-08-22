import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { applyGoldMathsAdaptations } from "../mathsGoldAdaptations";
import { renderGoldWorksheetHtml, type GoldWorksheet } from "../mathsGoldRenderer";
import { getGoldSendTheme } from "../mathsGoldSend";

const here = path.dirname(fileURLToPath(import.meta.url));
const worksheetsDir = path.resolve(here, "../../../../maths-worksheets/json");
const slugs = [
  "021-substitution-into-expressions",
  "027-angles-in-polygons",
  "032-circumference-of-a-circle",
  "039-comparing-fractions-decimals-and-percentages",
  "044-dividing-decimals",
  "050-adding-and-subtracting-fractions",
  "073-simplifying-algebraic-fractions",
  "170-mean-median-mode-and-range",
  "165-one-step-equations",
  "174-plotting-straight-line-graphs",
  "137-conditional-probability-and-venn-diagrams",
  "145-applying-pythagoras-in-3d-problems",
  "160-non-linear-simultaneous-equations",
  "179-enlargement",
  "194-volume-of-pyramids-cones-and-spheres",
];

function load(slug: string): GoldWorksheet {
  return JSON.parse(fs.readFileSync(path.join(worksheetsDir, `${slug}.json`), "utf8")) as GoldWorksheet;
}

describe("approved KS3/KS4 Maths gold corpus regression", () => {
  it("keeps all fifteen audited templates on exactly two fixed landscape pages under combined adaptations", () => {
    for (const slug of slugs) {
      const base = load(slug);
      const theme = getGoldSendTheme("dyslexia");
      const adapted = applyGoldMathsAdaptations(base, { sendNeedId: "dyslexia", readingAge: 10, sendTheme: theme });
      const html = renderGoldWorksheetHtml(adapted.worksheet, theme, adapted.notes);

      expect(html.match(/<div class="page">/g), slug).toHaveLength(2);
      expect(html, slug).toContain('@page { size: A4 landscape; margin: 5mm 6mm; }');
      expect(html, slug).toContain('data-send="1"');
      expect(html, slug).toContain('Adaptations: Dyslexia-friendly · Reading age 10: plain words and short direct instructions');
      expect(html, slug).toContain('.ws-root[data-send] .ic-blue   { background: transparent; }');
      expect(adapted.worksheet.modelled_examples, slug).toHaveLength(base.modelled_examples.length);
      expect(adapted.worksheet.practice.map((section) => section.questions.length), slug)
        .toEqual(base.practice.map((section) => section.questions.length));
      expect(adapted.worksheet.practice.map((section) => section.questions.map((question) => question.expression)), slug)
        .toEqual(base.practice.map((section) => section.questions.map((question) => question.expression)));
    }
  });

  it("keeps every supplied Maths SEND profile on a white page surface", () => {
    for (const need of ["dyslexia", "adhd", "asc", "mld", "eal", "dyscalculia", "working-memory", "anxiety", "asc-social"]) {
      expect(getGoldSendTheme(need)?.pageBg, need).toBeUndefined();
    }
  });
});
