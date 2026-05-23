/**
 * promptSections/subjectFamilyDirectives.ts — PR-21
 *
 * Per-subject-family directives. Phase 1 lock — sciences do NOT get
 * the maths-only working-out box. Encoded here so the carve-up never
 * regresses that invariant.
 */

export interface SubjectFamilyInputs {
  subject?: string;
  yearGroup?: string;
}

type SubjectFamily = "maths" | "science" | "humanities" | "english-lit" | "english-lang" | "creative" | "general";

function classify(subject: string | undefined): SubjectFamily {
  const s = String(subject || "").toLowerCase();
  if (/math/i.test(s)) return "maths";
  if (/biology|chemistry|physics|science/i.test(s)) return "science";
  if (/literature|english\s*lit/i.test(s)) return "english-lit";
  if (/english\s*lang|language/i.test(s)) return "english-lang";
  if (/history|geography|religious/i.test(s)) return "humanities";
  if (/art|music|drama|design/i.test(s)) return "creative";
  return "general";
}

export function buildSubjectFamilyDirectives(inputs: SubjectFamilyInputs = {}): string {
  const family = classify(inputs.subject);
  const lines = [`SUBJECT FAMILY DIRECTIVES — ${family}`];
  switch (family) {
    case "maths":
      lines.push(
        "- Calculation questions MUST carry `workingOutBox: true` so the renderer prints a dot-grid.",
        "- Show every step in the worked example.",
        "- Always state units on the final answer.",
      );
      break;
    case "science":
      lines.push(
        "- DO NOT set workingOutBox=true. Sciences use lined answer space, never the maths working-out grid.",
        "- Quote the formula → substitute → evaluate. SI units on every numerical answer.",
        "- Y10/Y11 sheets MUST include one Required-Practical question.",
      );
      break;
    case "english-lit":
      lines.push(
        "- Embed quotations <6 words inside sentences.",
        "- Analyse a SINGLE word per quotation. Link to writer's intent.",
      );
      break;
    case "english-lang":
      lines.push(
        "- Name the technique (simile, plosive, modal verb), then comment on the EFFECT on the reader.",
      );
      break;
    case "humanities":
      lines.push(
        "- Anchor every claim to a date, named source or named figure.",
        "- Use 'however' and 'as a result' to make causal chains explicit.",
      );
      break;
    case "creative":
      lines.push(
        "- Reference a named practitioner / artist / composer per claim.",
        "- Link evaluation to the brief's intended audience.",
      );
      break;
    default:
      lines.push("- Plain English. UK National Curriculum vocabulary.");
  }
  return lines.join("\n");
}
