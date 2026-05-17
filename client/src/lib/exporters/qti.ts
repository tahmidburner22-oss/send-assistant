/**
 * exporters/qti.ts — FEAT-PC3 · Phase C
 * ──────────────────────────────────────────────────────────────────────────
 * QTI 3.0 (IMS Global) XML export for worksheets.
 *
 * Maps each worksheet section into the closest QTI 3.0 interaction kind:
 *   - MCQ → qti-choice-interaction with correctResponse
 *   - True/False → qti-choice-interaction (2 options)
 *   - Short answer → qti-extended-text-interaction
 *   - Numeric → qti-text-entry-interaction with baseValue match
 *   - Word-bank gap-fill → qti-gap-match-interaction
 *
 * The output is a standalone XML string that validates against the
 * IMS QTI 3.0 Assessment Item schema.
 */

import type { AIWorksheetResult, AIWorksheetSection } from "../ai";

// ─── Public API ────────────────────────────────────────────────────────────

export interface QtiExportOptions {
  /** Override identifier prefix (default: "adaptly-item"). */
  identifierPrefix?: string;
  /** Include metadata extensions (specRef, ao) from PB1 fields. */
  includeMetadata?: boolean;
}

/**
 * Export a worksheet to QTI 3.0 XML. Returns a full assessmentItem XML per
 * section, wrapped in an assessmentTest container.
 */
export function exportWorksheetToQti(
  worksheet: AIWorksheetResult,
  opts: QtiExportOptions = {},
): string {
  const prefix = opts.identifierPrefix || "adaptly-item";
  const includeMetadata = opts.includeMetadata !== false;

  const sections = (worksheet.sections || []).filter(
    (s) => !s.teacherOnly && s.type !== "answers" && s.type !== "mark-scheme",
  );

  const items = sections.map((section, idx) =>
    buildAssessmentItem(section, idx, prefix, includeMetadata),
  );

  const testIdentifier = `${prefix}-test`;
  const title = escXml(worksheet.title || "Adaptly Worksheet");

  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="${testIdentifier}"
  title="${title}"
  tool-name="Adaptly"
  tool-version="1.0">
  <qti-test-part identifier="part-1" navigation-mode="nonlinear" submission-mode="individual">
    <qti-assessment-section identifier="section-1" title="${title}" visible="true">
${items.map((item) => `      <qti-assessment-item-ref identifier="${item.id}" href="${item.id}.xml"/>`).join("\n")}
    </qti-assessment-section>
  </qti-test-part>
</qti-assessment-test>

${items.map((item) => item.xml).join("\n\n")}`;
}

/**
 * Export a single section as a standalone QTI 3.0 assessmentItem XML.
 * Useful for per-question exports.
 */
export function exportSectionToQti(
  section: AIWorksheetSection,
  index: number,
  opts: QtiExportOptions = {},
): string {
  const prefix = opts.identifierPrefix || "adaptly-item";
  const includeMetadata = opts.includeMetadata !== false;
  return buildAssessmentItem(section, index, prefix, includeMetadata).xml;
}

// ─── Internal builders ─────────────────────────────────────────────────────

interface QtiItem {
  id: string;
  xml: string;
}

function buildAssessmentItem(
  section: AIWorksheetSection,
  index: number,
  prefix: string,
  includeMetadata: boolean,
): QtiItem {
  const id = `${prefix}-${index + 1}`;
  const title = escXml(section.title || `Item ${index + 1}`);
  const sectionType = detectInteractionType(section);

  let bodyXml: string;
  let responseDecl: string;
  let responseProcessing: string;

  switch (sectionType) {
    case "choice":
      ({ bodyXml, responseDecl, responseProcessing } = buildChoiceInteraction(section, id));
      break;
    case "true-false":
      ({ bodyXml, responseDecl, responseProcessing } = buildTrueFalseInteraction(section, id));
      break;
    case "text-entry":
      ({ bodyXml, responseDecl, responseProcessing } = buildTextEntryInteraction(section, id));
      break;
    case "gap-match":
      ({ bodyXml, responseDecl, responseProcessing } = buildGapMatchInteraction(section, id));
      break;
    case "extended-text":
    default:
      ({ bodyXml, responseDecl, responseProcessing } = buildExtendedTextInteraction(section, id));
      break;
  }

  const metadataBlock = includeMetadata ? buildMetadataBlock(section) : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item
  xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="${id}"
  title="${title}"
  adaptive="false"
  time-dependent="false">
${metadataBlock}${responseDecl}
  <qti-item-body>
${bodyXml}
  </qti-item-body>
${responseProcessing}
</qti-assessment-item>`;

  return { id, xml };
}

type InteractionType = "choice" | "true-false" | "text-entry" | "gap-match" | "extended-text";

function detectInteractionType(section: AIWorksheetSection): InteractionType {
  const type = (section.type || "").toLowerCase();
  const content = (section.content || "").toLowerCase();

  if (type === "mcq" || type === "multiple-choice" || type.includes("choice")) return "choice";
  if (type === "true-false" || type === "true/false") return "true-false";
  if (type === "gap-fill" || type === "word-bank" || type.includes("gap")) return "gap-match";
  if (type === "numeric" || type === "calculation") return "text-entry";

  // Heuristic: if content has A) B) C) D) patterns or bullet options
  if (/\b[A-D]\)\s/m.test(section.content || "")) return "choice";
  if (/\btrue\s*(or|\/)\s*false\b/i.test(content)) return "true-false";
  if (/_{3,}/.test(section.content || "")) return "gap-match";

  return "extended-text";
}

// ─── Choice interaction (MCQ) ──────────────────────────────────────────────

function buildChoiceInteraction(
  section: AIWorksheetSection,
  id: string,
): { bodyXml: string; responseDecl: string; responseProcessing: string } {
  const options = extractOptions(section.content || "");
  const correctIdx = 0; // Default to first option if we can't determine
  const correctId = `choice-${correctIdx + 1}`;

  const choicesXml = options
    .map(
      (opt, i) =>
        `        <qti-simple-choice identifier="choice-${i + 1}">${escXml(opt)}</qti-simple-choice>`,
    )
    .join("\n");

  const prompt = extractPrompt(section.content || "", options);

  const bodyXml = `    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
      <qti-prompt>${escXml(prompt)}</qti-prompt>
${choicesXml}
    </qti-choice-interaction>`;

  const responseDecl = `  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>${correctId}</qti-value>
    </qti-correct-response>
  </qti-response-declaration>`;

  const responseProcessing = `  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct"/>`;

  return { bodyXml, responseDecl, responseProcessing };
}

// ─── True/False interaction ────────────────────────────────────────────────

function buildTrueFalseInteraction(
  section: AIWorksheetSection,
  id: string,
): { bodyXml: string; responseDecl: string; responseProcessing: string } {
  const prompt = (section.content || section.title || "").split("\n")[0].trim();

  const bodyXml = `    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">
      <qti-prompt>${escXml(prompt)}</qti-prompt>
      <qti-simple-choice identifier="true">True</qti-simple-choice>
      <qti-simple-choice identifier="false">False</qti-simple-choice>
    </qti-choice-interaction>`;

  const responseDecl = `  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>true</qti-value>
    </qti-correct-response>
  </qti-response-declaration>`;

  const responseProcessing = `  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct"/>`;

  return { bodyXml, responseDecl, responseProcessing };
}

// ─── Text entry interaction (numeric) ──────────────────────────────────────

function buildTextEntryInteraction(
  section: AIWorksheetSection,
  id: string,
): { bodyXml: string; responseDecl: string; responseProcessing: string } {
  const prompt = (section.content || section.title || "").split("\n")[0].trim();

  const bodyXml = `    <qti-prompt>${escXml(prompt)}</qti-prompt>
    <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="10"/>`;

  const responseDecl = `  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">
    <qti-correct-response>
      <qti-value></qti-value>
    </qti-correct-response>
  </qti-response-declaration>`;

  const responseProcessing = `  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct"/>`;

  return { bodyXml, responseDecl, responseProcessing };
}

// ─── Gap match interaction ─────────────────────────────────────────────────

function buildGapMatchInteraction(
  section: AIWorksheetSection,
  id: string,
): { bodyXml: string; responseDecl: string; responseProcessing: string } {
  const content = section.content || "";
  // Extract words from blanks (___) patterns
  const gaps = content.match(/_{3,}/g) || ["___"];
  const gapCount = gaps.length;

  const prompt = content.replace(/_{3,}/g, '<qti-gap identifier="GAP_$i"/>').replace(
    /\$i/g,
    (() => {
      let c = 0;
      return () => String(++c);
    })() as unknown as string,
  );

  // Simple gap rendering — each gap gets a placeholder
  let gapIdx = 0;
  const promptWithGaps = content.replace(/_{3,}/g, () => {
    gapIdx++;
    return `<qti-gap identifier="GAP_${gapIdx}"/>`;
  });

  const gapTexts = Array.from({ length: gapCount }, (_, i) => `word-${i + 1}`);
  const associableChoices = gapTexts
    .map(
      (w, i) =>
        `      <qti-gap-text identifier="WORD_${i + 1}" match-max="1">${escXml(w)}</qti-gap-text>`,
    )
    .join("\n");

  const bodyXml = `    <qti-gap-match-interaction response-identifier="RESPONSE">
${associableChoices}
      <qti-block-content>
        <p>${escXml(content.replace(/_{3,}/g, "[___]"))}</p>
      </qti-block-content>
    </qti-gap-match-interaction>`;

  const responseDecl = `  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair"/>`;

  const responseProcessing = `  <qti-response-processing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct"/>`;

  return { bodyXml, responseDecl, responseProcessing };
}

// ─── Extended text interaction (short/long answer) ─────────────────────────

function buildExtendedTextInteraction(
  section: AIWorksheetSection,
  id: string,
): { bodyXml: string; responseDecl: string; responseProcessing: string } {
  const prompt = section.content || section.title || "";

  const bodyXml = `    <qti-prompt>${escXml(prompt.slice(0, 2000))}</qti-prompt>
    <qti-extended-text-interaction response-identifier="RESPONSE" expected-lines="5"/>`;

  const responseDecl = `  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>`;

  const responseProcessing = `  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-base-value base-type="float">0</qti-base-value>
    </qti-set-outcome-value>
  </qti-response-processing>`;

  return { bodyXml, responseDecl, responseProcessing };
}

// ─── Metadata block ────────────────────────────────────────────────────────

function buildMetadataBlock(section: AIWorksheetSection): string {
  const parts: string[] = [];
  const s = section as any;

  if (s.specRef) {
    parts.push(`    <qti-catalog-info>
      <qti-catalog identifier="adaptly-specref">
        <qti-entry>${escXml(s.specRef)}</qti-entry>
      </qti-catalog>
    </qti-catalog-info>`);
  }
  if (s.ao) {
    parts.push(`    <qti-catalog-info>
      <qti-catalog identifier="adaptly-ao">
        <qti-entry>${escXml(s.ao)}</qti-entry>
      </qti-catalog>
    </qti-catalog-info>`);
  }

  if (parts.length === 0) return "";
  return `  <qti-item-metadata>\n${parts.join("\n")}\n  </qti-item-metadata>\n`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function extractOptions(content: string): string[] {
  // Try A) B) C) D) pattern
  const abcdMatch = content.match(/[A-D]\)\s*[^\n]+/g);
  if (abcdMatch && abcdMatch.length >= 2) {
    return abcdMatch.map((m) => m.replace(/^[A-D]\)\s*/, "").trim());
  }
  // Try bullet/numbered list
  const bullets = content.match(/^[\s]*[-•]\s+.+$/gm);
  if (bullets && bullets.length >= 2) {
    return bullets.map((b) => b.replace(/^[\s]*[-•]\s+/, "").trim());
  }
  // Fallback
  return ["Option A", "Option B", "Option C", "Option D"];
}

function extractPrompt(content: string, options: string[]): string {
  // Take everything before the first option line
  const lines = content.split("\n");
  const promptLines: string[] = [];
  for (const line of lines) {
    if (/^[A-D]\)/.test(line.trim()) || /^[-•]\s/.test(line.trim())) break;
    promptLines.push(line);
  }
  return promptLines.join(" ").trim() || "Select the correct answer.";
}

function escXml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
