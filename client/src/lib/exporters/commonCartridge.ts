/**
 * exporters/commonCartridge.ts — FEAT-PC3 · Phase C
 * ──────────────────────────────────────────────────────────────────────────
 * Common Cartridge 1.3 export for unit packs.
 *
 * Produces a .imscc file (zip with a specific directory layout + manifest)
 * that Canvas, Moodle, Blackboard, and itslearning can import as a course
 * module.
 *
 * Structure:
 *   /imsmanifest.xml
 *   /resources/
 *     /lesson-1/assessment.xml   (QTI 3.0 per worksheet)
 *     /lesson-1/content.html     (lesson overview)
 *     ...
 *   /overview/
 *     /mtp.html                  (unit overview markdown → HTML)
 *     /knowledge-organiser.html
 *     /parent-letter.html
 *
 * Depends on: JSZip (already a project dep), exportSectionToQti from ./qti
 */

import JSZip from "jszip";
import { exportWorksheetToQti } from "./qti";
import type { AIWorksheetResult } from "../ai";
import type { UnitPlan, UnitPlanLesson, UnitLessonResult } from "../unitPack";

// ─── Public API ────────────────────────────────────────────────────────────

export interface CommonCartridgeOptions {
  /** Include parent letter HTML resource. Default true. */
  includeParentLetter?: boolean;
  /** Include knowledge organiser resource. Default true. */
  includeKnowledgeOrganiser?: boolean;
  /** CC version (only 1.3 supported). */
  version?: "1.3";
}

/**
 * Export a complete unit (plan + lesson results) to a Common Cartridge
 * .imscc blob suitable for import into LMS platforms.
 */
export async function exportUnitToCommonCartridge(
  plan: UnitPlan,
  results: UnitLessonResult[],
  opts: CommonCartridgeOptions = {},
): Promise<Blob> {
  const zip = new JSZip();
  const resources: ManifestResource[] = [];
  const includeParent = opts.includeParentLetter !== false;
  const includeKO = opts.includeKnowledgeOrganiser !== false;

  // ── Per-lesson resources ─────────────────────────────────────────────────

  for (const r of results) {
    if (!r.worksheet) continue;

    const lessonDir = `resources/lesson-${r.lesson.index}`;
    const lessonId = `lesson-${r.lesson.index}`;

    // QTI assessment XML
    const qtiXml = exportWorksheetToQti(r.worksheet, {
      identifierPrefix: `unit-${slugify(plan.topic)}-l${r.lesson.index}`,
      includeMetadata: true,
    });
    zip.file(`${lessonDir}/assessment.xml`, qtiXml);

    // Lesson content HTML (overview page)
    const contentHtml = buildLessonContentHtml(plan, r.lesson, r.worksheet);
    zip.file(`${lessonDir}/content.html`, contentHtml);

    resources.push({
      identifier: `${lessonId}-assessment`,
      type: "imsqti_xmlv3p0/imscc_xmlv1p3/assessment",
      href: `${lessonDir}/assessment.xml`,
      files: [`${lessonDir}/assessment.xml`],
    });
    resources.push({
      identifier: `${lessonId}-content`,
      type: "webcontent",
      href: `${lessonDir}/content.html`,
      files: [`${lessonDir}/content.html`],
    });
  }

  // ── Unit overview resources ──────────────────────────────────────────────

  const overviewHtml = buildUnitOverviewHtml(plan, results);
  zip.file("overview/mtp.html", overviewHtml);
  resources.push({
    identifier: "unit-overview",
    type: "webcontent",
    href: "overview/mtp.html",
    files: ["overview/mtp.html"],
  });

  if (includeKO) {
    const koHtml = buildKnowledgeOrganiserHtml(plan);
    zip.file("overview/knowledge-organiser.html", koHtml);
    resources.push({
      identifier: "knowledge-organiser",
      type: "webcontent",
      href: "overview/knowledge-organiser.html",
      files: ["overview/knowledge-organiser.html"],
    });
  }

  if (includeParent) {
    const parentHtml = buildParentLetterHtml(plan);
    zip.file("overview/parent-letter.html", parentHtml);
    resources.push({
      identifier: "parent-letter",
      type: "webcontent",
      href: "overview/parent-letter.html",
      files: ["overview/parent-letter.html"],
    });
  }

  // ── Manifest ─────────────────────────────────────────────────────────────

  const manifest = buildImsManifest(plan, resources);
  zip.file("imsmanifest.xml", manifest);

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    mimeType: "application/zip",
  });
}

// ─── Manifest builder ──────────────────────────────────────────────────────

interface ManifestResource {
  identifier: string;
  type: string;
  href: string;
  files: string[];
}

function buildImsManifest(plan: UnitPlan, resources: ManifestResource[]): string {
  const title = escXml(plan.unitTitle);
  const identifier = `adaptly-cc-${slugify(plan.topic)}-${Date.now()}`;

  const resourcesXml = resources
    .map(
      (r) =>
        `    <resource identifier="${escXml(r.identifier)}" type="${escXml(r.type)}" href="${escXml(r.href)}">
${r.files.map((f) => `      <file href="${escXml(f)}"/>`).join("\n")}
    </resource>`,
    )
    .join("\n");

  const itemsXml = resources
    .map(
      (r) =>
        `      <item identifier="item-${escXml(r.identifier)}" identifierref="${escXml(r.identifier)}">
        <title>${escXml(r.identifier)}</title>
      </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}"
  xmlns="http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1"
  xmlns:lom="http://ltsc.ieee.org/xsd/LOM"
  xmlns:lomimscc="http://ltsc.ieee.org/xsd/imsccv1p3/LOM/manifest"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p3/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p3/ccv1p3_imscp_v1p2_v1p0.xsd">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.3.0</schemaversion>
    <lom:lom>
      <lom:general>
        <lom:title>
          <lom:string language="en">${title}</lom:string>
        </lom:title>
        <lom:description>
          <lom:string language="en">${escXml(plan.subject)} unit: ${escXml(plan.topic)} (${escXml(plan.yearGroup)})</lom:string>
        </lom:description>
      </lom:general>
    </lom:lom>
  </metadata>
  <organizations>
    <organization identifier="org-1" structure="rooted-hierarchy">
      <item identifier="root">
        <title>${title}</title>
${itemsXml}
      </item>
    </organization>
  </organizations>
  <resources>
${resourcesXml}
  </resources>
</manifest>`;
}

// ─── HTML content builders ─────────────────────────────────────────────────

function buildLessonContentHtml(
  plan: UnitPlan,
  lesson: UnitPlanLesson,
  worksheet: AIWorksheetResult,
): string {
  const sections = (worksheet.sections || [])
    .filter((s) => !s.teacherOnly)
    .map(
      (s) => `<section>
  <h3>${escHtml(s.title || "Section")}</h3>
  <div>${escHtml(s.content || "")}</div>
</section>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escHtml(lesson.title)}</title>
</head>
<body>
  <h1>${escHtml(lesson.title)}</h1>
  <p><strong>${escHtml(plan.subject)}</strong> &middot; ${escHtml(plan.yearGroup)} &middot; Week ${lesson.week}</p>
  <h2>Learning objectives</h2>
  <ul>
${lesson.objectives.map((o) => `    <li>${escHtml(o)}</li>`).join("\n")}
  </ul>
  ${lesson.specRefs.length ? `<p><em>Spec refs: ${escHtml(lesson.specRefs.join(", "))}</em></p>` : ""}
  <h2>Worksheet content</h2>
  ${sections}
</body>
</html>`;
}

function buildUnitOverviewHtml(plan: UnitPlan, results: UnitLessonResult[]): string {
  const lessonsTable = results
    .map((r) => {
      const status = r.worksheet ? "&#10003;" : "&#10007;";
      return `  <tr>
    <td>${r.lesson.index}</td>
    <td>Week ${r.lesson.week}</td>
    <td>${escHtml(r.lesson.title)}</td>
    <td>${r.lesson.specRefs.map(escHtml).join(", ") || "&mdash;"}</td>
    <td>${status}</td>
  </tr>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escHtml(plan.unitTitle)} — Overview</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>${escHtml(plan.unitTitle)}</h1>
  <ul>
    <li><strong>Subject:</strong> ${escHtml(plan.subject)}</li>
    <li><strong>Year group:</strong> ${escHtml(plan.yearGroup)}</li>
    <li><strong>Topic:</strong> ${escHtml(plan.topic)}</li>
    <li><strong>Weeks:</strong> ${plan.weeks}</li>
    <li><strong>Lessons:</strong> ${plan.lessons.length}</li>
    <li><strong>Ability tier:</strong> ${escHtml(plan.ability)}</li>
    ${plan.board ? `<li><strong>Board:</strong> ${escHtml(plan.board.toUpperCase())}</li>` : ""}
    <li><strong>Generated:</strong> ${escHtml(plan.generatedAt)}</li>
  </ul>
  <h2>Lesson summary</h2>
  <table>
    <thead><tr><th>#</th><th>Week</th><th>Title</th><th>Spec refs</th><th>Status</th></tr></thead>
    <tbody>
${lessonsTable}
    </tbody>
  </table>
  <h2>Knowledge organiser outline</h2>
  <ul>
${plan.knowledgeOrganiserOutline.map((k) => `    <li>${escHtml(k)}</li>`).join("\n")}
  </ul>
  <h2>Assessment</h2>
  <p>${escHtml(plan.finalAssessmentBrief)}</p>
</body>
</html>`;
}

function buildKnowledgeOrganiserHtml(plan: UnitPlan): string {
  const items = plan.knowledgeOrganiserOutline
    .map((k) => `    <li>${escHtml(k)}</li>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Knowledge Organiser — ${escHtml(plan.topic)}</title>
</head>
<body>
  <h1>Knowledge Organiser</h1>
  <h2>${escHtml(plan.topic)} — ${escHtml(plan.yearGroup)} ${escHtml(plan.subject)}</h2>
  <ul>
${items}
  </ul>
  <p><em>Generated by Adaptly on ${escHtml(plan.generatedAt)}</em></p>
</body>
</html>`;
}

function buildParentLetterHtml(plan: UnitPlan): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Parent Letter — ${escHtml(plan.parentLetterTopic)}</title>
</head>
<body>
  <h1>Parent / Carer Information</h1>
  <p>Dear Parent / Carer,</p>
  <p>This term, your child will be studying <strong>${escHtml(plan.parentLetterTopic)}</strong> in ${escHtml(plan.subject)}.</p>
  <p>The unit covers ${plan.lessons.length} lessons over ${plan.weeks} weeks, focusing on:</p>
  <ul>
${plan.knowledgeOrganiserOutline.map((k) => `    <li>${escHtml(k)}</li>`).join("\n")}
  </ul>
  <h2>How you can help at home</h2>
  <ul>
    <li>Ask your child what they learnt each lesson</li>
    <li>Encourage them to use the key vocabulary</li>
    <li>Support them with any homework tasks</li>
  </ul>
  <p>If you have any questions, please do not hesitate to contact us.</p>
  <p><em>Generated by Adaptly</em></p>
</body>
</html>`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function escXml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(s: string): string {
  return (s || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}
