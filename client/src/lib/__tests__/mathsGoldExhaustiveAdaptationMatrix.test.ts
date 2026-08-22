import { describe, expect, it } from "vitest";
import { MATHS_GOLD_MANIFEST, loadGoldWorksheet } from "@/data/maths-gold/manifest";
import { applyGoldMathsAdaptations } from "../mathsGoldAdaptations";
import { renderGoldWorksheetHtml } from "../mathsGoldRenderer";
import { getGoldSendTheme } from "../mathsGoldSend";

const SEND_NEED_IDS = [
  "dyslexia", "dyspraxia", "mld", "dyscalculia", "slcn", "eal", "adhd",
  "asc", "asperger", "anxiety", "semh", "pda-odd", "vi", "hi", "tourettes",
  "older-learners", "working-memory", "asc-social", "asc-demand-avoidant",
  "asc-sensory", "asc-rigid",
] as const;

const READING_AGES = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as const;

describe("Maths Gold exhaustive SEND and reading-age matrix", () => {
  it("retains every protected two-page landscape contract across all real template/profile/age combinations", async () => {
    let checks = 0;

    for (const entry of MATHS_GOLD_MANIFEST) {
      const source = await loadGoldWorksheet(entry.slug);
      expect(source, entry.slug).not.toBeNull();
      if (!source) continue;
      const originalExpressions = source.practice.map((section) => section.questions.map((question) => question.expression));
      const originalAnswers = source.practice.map((section) => section.questions.map((question) => question.answer));
      const originalCounts = source.practice.map((section) => section.questions.length);

      for (const sendNeedId of SEND_NEED_IDS) {
        const theme = getGoldSendTheme(sendNeedId);
        expect(theme, `${entry.slug} / ${sendNeedId}`).toBeDefined();
        expect(theme?.pageBg || "#ffffff", `${entry.slug} / ${sendNeedId}`).toBe("#ffffff");

        for (const readingAge of READING_AGES) {
          const adapted = applyGoldMathsAdaptations(source, { sendNeedId, readingAge, sendTheme: theme });
          const label = `${entry.slug} / ${sendNeedId} / age-${readingAge}`;
          const html = renderGoldWorksheetHtml(adapted.worksheet, theme, adapted.notes);

          // Non-negotiable geometry and white-surface contract.
          expect(html.match(/<div class="page">/g), label).toHaveLength(2);
          expect(html, label).toContain('@page { size: A4 landscape; margin: 5mm 6mm; }');
          expect(html, label).toContain('data-send="1"');

          // Reading-age support may change language only, never the question
          // data, answers, question count, ordering or modelled-example count.
          expect(adapted.worksheet.practice.map((section) => section.questions.length), label).toEqual(originalCounts);
          expect(adapted.worksheet.practice.map((section) => section.questions.map((question) => question.expression)), label)
            .toEqual(originalExpressions);
          expect(adapted.worksheet.practice.map((section) => section.questions.map((question) => question.answer)), label)
            .toEqual(originalAnswers);
          expect(adapted.worksheet.modelled_examples.length, label).toBe(source.modelled_examples.length);
          expect(adapted.notes.map((note) => note.id), label).toEqual(["send", "reading-age"]);
          checks += 1;
        }
      }
    }

    expect(checks).toBe(MATHS_GOLD_MANIFEST.length * SEND_NEED_IDS.length * READING_AGES.length);
  }, 90_000);
});
