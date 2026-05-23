/**
 * promptSections/revisionTipsContract.ts — PR-21
 *
 * Phase 3 revision-tips contract block. Mirrors the inline copy in
 * `ai.ts:structuredSystemSections`. Pure.
 */

export interface RevisionTipsContractInputs {
  topic?: string;
  subject?: string;
  examBoard?: string;
  commandWords?: string[];
}

export function buildRevisionTipsContract(inputs: RevisionTipsContractInputs = {}): string {
  const topic = String(inputs.topic || "").trim() || "this topic";
  const commandWord = (inputs.commandWords || [])[0] || "the command word";
  return [
    "REVISION TIPS CONTRACT",
    `- Five tips, in canonical order: COMMAND WORD, WATCH OUT, METHOD, MARK SCHEME, TIME.`,
    `- COMMAND WORD: explain what "${commandWord}" actually wants for "${topic}".`,
    `- WATCH OUT: name a real misconception about "${topic}".`,
    "- TIME: budget ~1 minute per mark.",
  ].join("\n");
}
