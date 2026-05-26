/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * parentLetter.ts — FEAT-G14.
 *
 * Pure helper that builds a parent-letter / homework-cover-note from
 * a worksheet's metadata, in three tones (supportive / firm /
 * informative). Pure / deterministic — the LLM-driven variant
 * (`aiGenerateParentLetter`) lives in `ai.ts`.
 */

export type ParentTone = "supportive" | "firm" | "informative";

export interface ParentLetterInput {
  worksheetTitle: string;
  schoolName: string;
  teacherName: string;
  weekStarting: string;
  /** Learning objective for the worksheet (one short paragraph). */
  learningObjective?: string;
  /** Optional companion-app token to surface as a self-practice link. */
  companionToken?: string;
  /** Tone of voice. Default: 'informative'. */
  parentTone?: ParentTone;
}

export interface ParentLetterOutput {
  tone: ParentTone;
  text: string;
  bullets: string[];
  signatureLine: string;
}

const TONE_PREAMBLE: Record<ParentTone, string> = {
  supportive:
    "I'm writing with this week's worksheet — it's an exciting opportunity for your child to keep building on what we've been exploring in class.",
  firm:
    "Please find this week's worksheet enclosed. We expect every pupil to complete and return it by the published deadline.",
  informative:
    "Please find this week's worksheet enclosed. The activity is linked to our current scheme of work and consolidates this week's learning.",
};

const TONE_BULLETS: Record<ParentTone, string[]> = {
  supportive: [
    "Sit with your child for the first question — it builds confidence.",
    "Celebrate what they did well, then look at one thing to improve.",
    "Use the companion app together if you have a few quiet minutes.",
  ],
  firm: [
    "Please ensure the worksheet is completed and returned by the deadline.",
    "Check the work is your child's own and not copied.",
    "Sign and date the bottom of the cover note to confirm completion.",
  ],
  informative: [
    "Read the learning objective with your child before they start.",
    "Encourage them to attempt every question, even if unsure.",
    "Use the companion app to revisit any tricky questions.",
  ],
};

function bulletsForLO(lo?: string): string[] {
  if (!lo) return [];
  // Light grounding: turn the LO into a concrete suggestion.
  const trimmed = lo.replace(/^pupils? will (be able to )?/i, "").trim();
  return [
    `Ask your child to explain ${trimmed} in their own words.`,
  ];
}

export function buildParentLetter(input: ParentLetterInput): ParentLetterOutput {
  const tone: ParentTone = input.parentTone || "informative";
  const preamble = TONE_PREAMBLE[tone];
  const baseBullets = TONE_BULLETS[tone].slice(0, 2);
  const groundedBullets = bulletsForLO(input.learningObjective);
  const bullets = [...groundedBullets, ...baseBullets].slice(0, 3);
  const lines: string[] = [];
  lines.push(input.schoolName);
  lines.push(`Week starting ${input.weekStarting}`);
  lines.push("");
  lines.push("Dear Parent / Carer,");
  lines.push("");
  lines.push(preamble);
  lines.push("");
  lines.push(`Worksheet: ${input.worksheetTitle}`);
  if (input.learningObjective) {
    lines.push(`Learning objective: ${input.learningObjective}`);
  }
  lines.push("");
  lines.push("How parents can help:");
  for (const b of bullets) lines.push(`  • ${b}`);
  if (input.companionToken) {
    lines.push("");
    lines.push(`Practise more: /companion/${input.companionToken}`);
  }
  lines.push("");
  lines.push("Yours sincerely,");
  lines.push(input.teacherName);
  return {
    tone,
    text: lines.join("\n"),
    bullets,
    signatureLine: input.teacherName,
  };
}
