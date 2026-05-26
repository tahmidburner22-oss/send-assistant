/**
 * pdfAnswerKeyHtml.test.ts — PR-B / W9.
 *
 * Tests the deterministic HTML builder added to pdf-generator-v2.ts that
 * turns a worksheet into a teacher-only answer-key page fragment, used by
 * the "Append answer-key page" checkbox in PrintOptionsDialog.
 *
 * The fragment is appended to the print popup body via
 * printWorksheetElement(..., { extraHtml }) — these tests cover the
 * deterministic branches (empty worksheet → empty string, populated
 * worksheet → page-break + watermark + per-question rows) without
 * touching the DOM.
 */

import { describe, it, expect } from "vitest";
import { buildAnswerKeyHtml } from "../pdf-generator-v2";

describe("buildAnswerKeyHtml — empty / populated branches", () => {
  it("returns the empty string when the worksheet has no answer-bearing sections", () => {
    expect(buildAnswerKeyHtml({})).toBe("");
    expect(buildAnswerKeyHtml({ sections: [] })).toBe("");
  });

  it("emits a page-break + TEACHER ONLY watermark + per-question rows for a populated worksheet", () => {
    const ws = {
      title: "Forces",
      sections: [
        {
          title: "Q1 Newton's second law",
          content: "F = ma; m = 2 kg, a = 3 m/s^2 → F = 6 N",
          type: "q-application",
          marks: 3,
          questionNumber: 1,
        },
        {
          title: "Q2 Free-body diagram",
          content: "Resolve weight + normal + friction",
          type: "q-understanding",
          marks: 2,
          questionNumber: 2,
        },
      ],
    };
    const html = buildAnswerKeyHtml(ws);
    expect(html).toContain("page-break-before:always");
    expect(html.toUpperCase()).toContain("TEACHER ONLY");
    expect(html).toContain("Q1");
    expect(html).toContain("Q2");
    expect(html).toContain("F = ma");
  });

  it("escapes HTML in the worksheet content so user-provided text cannot inject markup", () => {
    const ws = {
      title: "Sneaky",
      sections: [
        {
          title: "Q1 <script>alert(1)</script>",
          content: "answer & more <b>bold</b>",
          type: "q-recall",
          marks: 1,
          questionNumber: 1,
        },
      ],
    };
    const html = buildAnswerKeyHtml(ws);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
  });
});
