import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FileText } from "lucide-react";
import {
  TeacherPageHeader,
  TeacherSectionHeading,
  TeacherWorkspace,
  TeacherWorkspacePanel,
} from "../TeacherWorkspace";

const h = createElement;

describe("TeacherWorkspace shared layout", () => {
  it("renders the semantic workspace shell, header hierarchy and action slot", () => {
    const html = renderToStaticMarkup(
      h(
        TeacherWorkspace,
        { className: "space-y-5" },
        h(TeacherPageHeader, {
          eyebrow: "Review workspace",
          title: "Materials, history and provenance",
          description: "Review the exact saved structure deliberately.",
          icon: FileText,
          actions: h("button", { type: "button" }, "Create a resource"),
          meta: h("span", null, "12 materials"),
        }),
        h(TeacherWorkspacePanel, null, h("p", null, "Workspace content")),
      ),
    );

    expect(html).toContain("teacher-workspace");
    expect(html).toContain("teacher-page-header");
    expect(html).toContain("Review workspace");
    expect(html).toContain("Materials, history and provenance");
    expect(html).toContain("Create a resource");
    expect(html).toContain("teacher-workspace-panel");
  });

  it("accepts an existing icon element and keeps section heading actions visible", () => {
    const html = renderToStaticMarkup(
      h(TeacherPageHeader, {
        title: "Lesson planner",
        icon: h("span", { "data-icon": "existing-tool-icon" }, "LP"),
        actions: h("a", { href: "/worksheets" }, "Open worksheet studio"),
      }),
    );
    const sectionHtml = renderToStaticMarkup(
      h(TeacherSectionHeading, {
        eyebrow: "Today",
        title: "Your next teaching decisions",
        action: h("a", { href: "/pupils" }, "Open pupils"),
      }),
    );

    expect(html).toContain('data-icon="existing-tool-icon"');
    expect(html).toContain("Open worksheet studio");
    expect(sectionHtml).toContain("teacher-section-heading");
    expect(sectionHtml).toContain("Open pupils");
  });
});
