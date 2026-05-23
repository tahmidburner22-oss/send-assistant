/**
 * sendStackedProfiles.ts — PR-16 (audit items #29 #30 #32 #82)
 *
 * Two scaffolding pieces for the SEND surface:
 *
 *   1. `TRAUMA_INFORMED_SEND_PROFILE` — a new SEND profile entry with a
 *      worksheetRules + worksheetRulesContent block matching the
 *      structure used in `sendPromptFragments.ts`. Trauma-informed
 *      pedagogy emphasises predictability, choice, regulation and
 *      relational safety — different from generic anxiety adaptations.
 *
 *   2. `mergeSendProfiles(profileKeys[])` — merges multiple SEND profile
 *      rule arrays into a single de-duplicated, conflict-resolved set
 *      so a worksheet can carry stacked profiles
 *      (`metadata.sendNeeds = ["adhd", "dyslexia"]`). The rule-merger is
 *      pure / deterministic / idempotent.
 *
 * Plus `rememberPupilReadingAge` — a tiny helper that records the
 *  reading-age memory per pupil (audit item #30). Stored in metadata
 *  so the next worksheet for the same pupil can default the
 *  expectedReadingAge field without re-prompting.
 */

export interface SendProfile {
  id: string;
  name: string;
  worksheetRules: string[];
  worksheetRulesContent: string[];
}

// ─── Trauma-informed profile (audit #32) ────────────────────────────────────

export const TRAUMA_INFORMED_SEND_PROFILE: SendProfile = {
  id: "trauma-informed",
  name: "Trauma-informed register",
  worksheetRules: [
    "Open with one low-stakes confidence-builder Q1 (tick / single word) before any extended writing.",
    "Frame the worksheet as 'exploration' not 'test' in the subtitle and any opening line.",
    "Use predictable section structure pupil already recognises (warm-up → main → optional bonus). Do not introduce a brand-new section type without a pupil-facing label.",
    "Give two equivalent choices on at least one open-ended question ('write about X OR Y') so a pupil can opt-out of a triggering context without disclosing.",
    "Include one teacher-facing line that names the pupil's regulation strategies (e.g. '5 deep breaths before Q3') if a Pupil Passport is available.",
    "Avoid time pressure language ('quickly', 'in under N minutes') in the pupil-facing copy.",
    "Print-hide any teacher-only content that names sensitive topics — never let a pupil see e.g. 'this pupil is in care' in the body of the worksheet.",
  ],
  worksheetRulesContent: [
    "Use neutral subject contexts; avoid family / parent / home / loss / illness / crime / police framings unless the topic mandates it.",
    "Pre-teach every emotion word with a plain-English definition before it appears in a question stem.",
    "Use 'many pupils think …' to introduce misconceptions, not 'you might think …'.",
    "Anchor at least one example to the pupil's stated interest if a Pupil Passport is available.",
    "End the worksheet with one regulation cue ('take a moment, then check your work') before any final mark cue.",
  ],
};

// ─── Stacking ────────────────────────────────────────────────────────────────

/**
 * Pure helper: merges multiple SEND profiles' rule arrays into a single
 * de-duplicated array, preserving the order from the first profile and
 * appending unique entries from subsequent ones. Both `worksheetRules`
 * and `worksheetRulesContent` are merged.
 */
export function mergeSendProfiles(
  profiles: ReadonlyArray<SendProfile>,
): SendProfile {
  if (profiles.length === 0) {
    return {
      id: "none",
      name: "None",
      worksheetRules: [],
      worksheetRulesContent: [],
    };
  }
  if (profiles.length === 1) return profiles[0];

  const seenRules = new Set<string>();
  const seenContent = new Set<string>();
  const rules: string[] = [];
  const content: string[] = [];

  for (const p of profiles) {
    for (const r of p.worksheetRules) {
      const key = r.trim().toLowerCase();
      if (seenRules.has(key)) continue;
      seenRules.add(key);
      rules.push(r);
    }
    for (const r of p.worksheetRulesContent) {
      const key = r.trim().toLowerCase();
      if (seenContent.has(key)) continue;
      seenContent.add(key);
      content.push(r);
    }
  }

  return {
    id: profiles.map((p) => p.id).join("+"),
    name: profiles.map((p) => p.name).join(" + "),
    worksheetRules: rules,
    worksheetRulesContent: content,
  };
}

// ─── Reading-age memory ─────────────────────────────────────────────────────

export interface PupilReadingAgeMemory {
  pupilId: string;
  observedReadingAge: number;
  observedAt: string;
  source: "scan-mark" | "teacher-set" | "auto-estimated";
}

/**
 * Pure: returns a new memory list with the pupil's most recent reading
 * age updated. Idempotent — calling with the same value at the same
 * timestamp yields the same list.
 */
export function rememberPupilReadingAge(
  history: ReadonlyArray<PupilReadingAgeMemory>,
  entry: PupilReadingAgeMemory,
  maxEntries = 200,
): PupilReadingAgeMemory[] {
  const filtered = history.filter(
    (h) => !(h.pupilId === entry.pupilId && h.observedAt === entry.observedAt),
  );
  filtered.push(entry);
  // Sort newest first, keep most recent N.
  filtered.sort(
    (a, b) => new Date(b.observedAt).valueOf() - new Date(a.observedAt).valueOf(),
  );
  return filtered.slice(0, maxEntries);
}

export function lookupPupilReadingAge(
  history: ReadonlyArray<PupilReadingAgeMemory>,
  pupilId: string,
): PupilReadingAgeMemory | undefined {
  return history.find((h) => h.pupilId === pupilId);
}
