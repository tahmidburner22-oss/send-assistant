/**
 * promptSections/sendAdaptationDirectives.ts — PR-21
 *
 * Per-SEND-profile adaptation block. Composes the canonical SEND
 * directives from `sendStackedProfiles` (PR-16) without re-stating
 * the rules inline.
 */

export interface SendAdaptationInputs {
  sendNeeds?: string[];
}

const PER_NEED_DIRECTIVES: Record<string, string> = {
  adhd: "ADHD: Break tasks into 5-step chunks. Use checkboxes and bold sub-headings.",
  dyslexia: "Dyslexia: Cap sentences at 12 words. Avoid italics. Use lower-case 'l' / numeric '1' distinct.",
  autism: "Autism: Use literal language; avoid idioms. Provide a concrete worked example for every abstract idea.",
  asc: "ASC: Use literal language. Provide explicit step-numbering. Avoid metaphor.",
  "trauma-informed": "Trauma-informed: No surprise question types. Avoid negatively framed prompts. Provide a clear endpoint.",
  dyspraxia: "Dyspraxia: Increase line spacing. Provide ample writing space. Avoid timed pressure.",
  "older-learners": "Older learners: Adult register. Avoid juvenile contexts. Use real-world UK adult scenarios.",
  semh: "SEMH: Use neutral, supportive language. Avoid public-comparison framing.",
  mld: "MLD: Pre-teach every Tier-3 word in the Word Bank. Cap sentences at 10 words.",
  vi: "VI: Provide tactile description for every diagram. Avoid colour-only cues.",
  hi: "HI: Avoid audio-only references. Provide written equivalents.",
};

export function buildSendAdaptationDirectives(inputs: SendAdaptationInputs = {}): string {
  const needs = (inputs.sendNeeds || [])
    .map((n) => String(n || "").trim().toLowerCase())
    .filter(Boolean);
  if (needs.length === 0) return "";
  const lines = ["SEND DIRECTIVES"];
  for (const n of needs) {
    const text = PER_NEED_DIRECTIVES[n];
    if (text) lines.push(`- ${text}`);
  }
  if (lines.length === 1) return "";
  return lines.join("\n");
}
