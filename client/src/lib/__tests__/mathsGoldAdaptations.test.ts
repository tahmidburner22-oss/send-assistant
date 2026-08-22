import { describe, expect, it } from "vitest";
import { applyGoldMathsAdaptations } from "../mathsGoldAdaptations";
import { renderGoldWorksheetHtml, type GoldWorksheet } from "../mathsGoldRenderer";
import { getGoldSendTheme } from "../mathsGoldSend";

const fixture: GoldWorksheet = {
  title: "ALGEBRA\n(SUBSTITUTION)",
  objective: "LO: I can calculate and evaluate an expression.",
  info_boxes: {
    key_terms: { title: "Key terms", content: [{ text: "Determine the value.", type: "paragraph" }] },
    what_we_learn: { title: "Quick examples", examples: [{ correct: true, expr: "x = 3", desc: "Calculate the answer." }] },
    key_idea: { title: "Key idea", text: "Identify the number.", equation: "x = 3", caption: "Therefore, check the answer." },
  },
  modelled_examples: [
    { id: "ex1", label: "Example 1", question: "Calculate 2 + 2", steps: ["Determine the total"], answer: "= 4", explanation: "Work it out." },
    { id: "ex2", label: "Example 2", question: "Calculate 3 + 3", steps: ["Determine the total"], answer: "= 6", explanation: "Work it out." },
    { id: "ex3", label: "Example 3", question: "Calculate 4 + 4", steps: ["Determine the total"], answer: "= 8", explanation: "Work it out." },
    { id: "ex4", label: "Example 4", question: "Calculate 5 + 5", steps: ["Determine the total"], answer: "= 10", explanation: "Work it out." },
  ],
  practice: [
    { id: "p1", number: 1, heading: "Practice", heading_color: "#1F5FA6", bg_color: "#EEF3FF", border_color: "#1F5FA6", instruction: "Calculate each expression.", linked_example: "ex1", questions: [{ id: "a", expression: "2x + 1", answer: "7" }] },
    { id: "p2", number: 2, heading: "Practice", heading_color: "#1F5FA6", bg_color: "#EEF3FF", border_color: "#1F5FA6", instruction: "Calculate each expression.", linked_example: "ex2", questions: [{ id: "a", expression: "3x + 1", answer: "10" }] },
    { id: "p3", number: 3, heading: "Practice", heading_color: "#CC0000", bg_color: "#FFF0F0", border_color: "#CC0000", instruction: "Calculate each expression.", linked_example: "ex3", questions: [{ id: "a", expression: "4x + 1", answer: "13" }] },
    { id: "p4", number: 4, heading: "Practice", heading_color: "#1E7D2E", bg_color: "#EDFAEE", border_color: "#1E7D2E", instruction: "Calculate each expression.", linked_example: "ex4", questions: [{ id: "a", expression: "5x + 1", answer: "16" }] },
    { id: "p5", number: 5, heading: "Practice", heading_color: "#7B3FA0", bg_color: "#F5EEFF", border_color: "#7B3FA0", instruction: "Calculate each expression.", linked_example: "ex4", questions: [{ id: "a", expression: "6x + 1", answer: "19" }] },
  ],
  misconceptions: { items: [{ id: "a", statement: "Calculate the answer.", correct: true }] },
  challenge: { problems: [{ id: "a", text: "Determine the value." }, { id: "b", text: "Calculate the answer." }] },
};

describe("gold Maths adaptation layer", () => {
  it("changes only bounded learner-facing wording at a selected reading age", () => {
    const base = JSON.parse(JSON.stringify(fixture)) as GoldWorksheet;
    const result = applyGoldMathsAdaptations(base, { readingAge: 10 });

    expect(result.notes).toHaveLength(1);
    expect(result.notes[0].id).toBe("reading-age");
    expect(result.worksheet.objective).toContain("work out");
    expect(result.worksheet.practice[0].instruction).toContain("work out");
    expect(result.worksheet.practice.map((section) => section.questions)).toEqual(base.practice.map((section) => section.questions));
    expect(result.worksheet.practice.map((section) => section.bg_color)).toEqual(base.practice.map((section) => section.bg_color));
    expect(result.worksheet.modelled_examples).toHaveLength(4);
    expect(result.worksheet.practice).toHaveLength(5);
    expect(result.worksheet.challenge.problems).toHaveLength(2);
  });

  it("adds an explicit SEND record while retaining white page surfaces", () => {
    const theme = getGoldSendTheme("dyslexia");
    const result = applyGoldMathsAdaptations(fixture, { sendNeedId: "dyslexia", sendTheme: theme });
    const html = renderGoldWorksheetHtml(result.worksheet, theme, result.notes);

    expect(theme?.pageBg).toBeUndefined();
    expect(result.notes).toEqual(expect.arrayContaining([expect.objectContaining({ id: "send", label: "Dyslexia-friendly" })]));
    expect(html).toContain('data-send="1"');
    expect(html).toContain("Adaptations: Dyslexia-friendly");
    expect(html).toContain(".ws-root[data-send] .ic-blue   { background: transparent; }");
  });

  it("keeps the complete two-page structural schema unchanged when SEND and reading-age adaptations combine", () => {
    const base = JSON.parse(JSON.stringify(fixture)) as GoldWorksheet;
    const result = applyGoldMathsAdaptations(base, { sendNeedId: "adhd", readingAge: 8, sendTheme: getGoldSendTheme("adhd") });

    expect(result.worksheet.title).toBe(base.title);
    expect(result.worksheet.practice.map((section) => section.id)).toEqual(base.practice.map((section) => section.id));
    expect(result.worksheet.practice.map((section) => section.questions.map((question) => question.expression))).toEqual(base.practice.map((section) => section.questions.map((question) => question.expression)));
    expect(result.worksheet.practice.map((section) => section.questions.map((question) => question.answer))).toEqual(base.practice.map((section) => section.questions.map((question) => question.answer)));
    expect(result.worksheet.challenge.problems.map((problem) => problem.id)).toEqual(base.challenge.problems.map((problem) => problem.id));
    expect(result.notes.map((note) => note.id)).toEqual(["send", "reading-age"]);
  });
});
