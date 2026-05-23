/**
 * promptSections/selfReflectionContract.ts — PR-21
 *
 * Phase 2 self-reflection contract block. Mirrors the inline copy in
 * `ai.ts:structuredSystemSections`. Pure.
 */

export interface SelfReflectionContractInputs {
  topic?: string;
  subject?: string;
}

export function buildSelfReflectionContract(inputs: SelfReflectionContractInputs = {}): string {
  const topic = String(inputs.topic || "").trim() || "this topic";
  return [
    "SELF-REFLECTION CONTRACT",
    `- Topic-anchored: every prompt must mention "${topic}" by name.`,
    "- Tier-2 vocabulary only (a Year-7 reader should follow it).",
    "- Three prompts in canonical order: traffic-light confidence, sticking-point, action.",
  ].join("\n");
}
