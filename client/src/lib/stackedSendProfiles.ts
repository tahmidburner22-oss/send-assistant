/**
 * stackedSendProfiles.ts — PR-16
 *
 * Support for multiple stacked SEND needs per worksheet.
 * A pupil might have ADHD + dyslexia + MLD — each need adds its own
 * adaptations, and some combinations have interaction rules.
 *
 * Pure / deterministic / idempotent. No I/O, no LLM calls.
 */

export interface StackedSendResult {
  /** All resolved profile IDs. */
  profiles: string[];
  /** Combined unique adaptations from all profiles (de-duplicated). */
  combinedAdaptations: string[];
  /** Interaction warnings (e.g. "ADHD tick-boxes may conflict with ASC predictability needs"). */
  interactionWarnings: string[];
  /** Suggested reading age (minimum across all profile suggestions). */
  suggestedReadingAge?: number;
}

/**
 * Known interaction warnings between SEND profile pairs.
 */
const INTERACTIONS: Array<{ profiles: [string, string]; warning: string }> = [
  { profiles: ["adhd", "asc"], warning: "ADHD tick-boxes and brain breaks may conflict with ASC need for predictability — keep breaks at fixed intervals only." },
  { profiles: ["adhd", "pda"], warning: "ADHD direct-demand scaffolds conflict with PDA demand avoidance — use invitational language for all instructions." },
  { profiles: ["dyslexia", "vi"], warning: "Dyslexia-friendly fonts may conflict with VI large-print requirements — prioritise font size over font choice." },
  { profiles: ["mld", "eal"], warning: "MLD simplified language may remove the subject vocabulary EAL pupils need to acquire — keep key terms, add definitions." },
  { profiles: ["semh", "trauma"], warning: "SEMH emotional check-ins may inadvertently surface trauma responses — keep check-ins factual, not emotional." },
];

/** Default reading age suggestions per profile. */
const READING_AGE_SUGGESTIONS: Record<string, number> = {
  mld: 8,
  dyslexia: 10,
  adhd: 11,
  asc: 11,
  eal: 9,
  slcn: 9,
  trauma: 10,
  vi: 12,
  hi: 12,
  pda: 11,
  semh: 11,
};

/**
 * Resolve multiple stacked SEND profiles into a combined adaptation set.
 * De-duplicates adaptations, detects interaction warnings, and suggests
 * the lowest appropriate reading age.
 */
export function resolveStackedSendProfiles(
  sendNeeds: string[],
): StackedSendResult {
  const profiles = sendNeeds
    .map((s) => s.toLowerCase().trim())
    .filter(Boolean);

  if (profiles.length === 0) {
    return { profiles: [], combinedAdaptations: [], interactionWarnings: [] };
  }

  // Collect adaptations (in a real system these would come from resolveSendSpec)
  const adaptations = new Set<string>();
  for (const profile of profiles) {
    // Generic adaptations per profile category
    if (/adhd/i.test(profile)) {
      adaptations.add("Add tick-boxes to each question");
      adaptations.add("Add brain breaks every 4-5 questions");
      adaptations.add("Bold key action words");
    }
    if (/dyslexia/i.test(profile)) {
      adaptations.add("Bold key terms at first use");
      adaptations.add("Break long paragraphs (max 3 lines)");
      adaptations.add("Add section dividers");
    }
    if (/asc|autism|asperger/i.test(profile)) {
      adaptations.add("Number every instruction explicitly");
      adaptations.add("Use consistent terminology");
      adaptations.add("Remove figurative language from instructions");
    }
    if (/mld|moderate learning/i.test(profile)) {
      adaptations.add("Add hints to every question");
      adaptations.add("Use KS2-level language");
      adaptations.add("Provide model answer for Q1");
    }
    if (/pda/i.test(profile)) {
      adaptations.add("Use invitational language ('You might like to...')");
      adaptations.add("Mark challenge as optional");
    }
    if (/trauma/i.test(profile)) {
      adaptations.add("Start with confidence-building questions");
      adaptations.add("Use invitational language");
      adaptations.add("Avoid triggering scenarios");
    }
    if (/eal/i.test(profile)) {
      adaptations.add("Add word bank with definitions");
      adaptations.add("Add sentence frames for writing tasks");
    }
    if (/slcn|speech|language/i.test(profile)) {
      adaptations.add("Keep sentences under 12 words");
      adaptations.add("Add sentence frames");
      adaptations.add("Add word bank");
    }
  }

  // Check for interactions
  const interactionWarnings: string[] = [];
  for (const interaction of INTERACTIONS) {
    const [a, b] = interaction.profiles;
    if (profiles.some((p) => p.includes(a)) && profiles.some((p) => p.includes(b))) {
      interactionWarnings.push(interaction.warning);
    }
  }

  // Suggest reading age (minimum across all applicable profiles)
  const ages = profiles
    .map((p) => {
      for (const [key, age] of Object.entries(READING_AGE_SUGGESTIONS)) {
        if (p.includes(key)) return age;
      }
      return undefined;
    })
    .filter((a): a is number => a !== undefined);
  const suggestedReadingAge = ages.length > 0 ? Math.min(...ages) : undefined;

  return {
    profiles,
    combinedAdaptations: [...adaptations],
    interactionWarnings,
    suggestedReadingAge,
  };
}
