/**
 * biasAuditor.ts -- PR-12 / PD9
 *
 * Pure deterministic bias & sensitivity audit for AI-generated worksheets.
 * Checks name distribution, gendered professions, cultural assumptions,
 * socioeconomic assumptions, and religious defaults.
 * No I/O, no LLM calls.
 */

export type BiasKind = "name-distribution" | "gendered-profession" | "cultural-assumption" | "socioeconomic-assumption" | "religious-default";
export type BiasSeverity = "info" | "warning" | "flag";

export interface BiasFinding {
  kind: BiasKind;
  severity: BiasSeverity;
  sectionIndex?: number;
  evidence: string;
  suggestion: string;
}

export interface BiasAuditResult {
  findings: BiasFinding[];
  score: number; // 0-100, where 100 = no issues found
}

// -- Built-in lookup tables ------------------------------------------------

/** Common UK male first names from diverse ethnic backgrounds. */
const DIVERSE_MALE_NAMES = new Set([
  "james", "oliver", "mohammed", "muhammad", "aiden", "leon", "kofi",
  "raj", "wei", "liam", "noah", "arjun", "omar", "kai", "lucas",
  "ibrahim", "daniel", "samuel", "aarav", "jayden", "tyler", "ethan",
]);

/** Common UK female first names from diverse ethnic backgrounds. */
const DIVERSE_FEMALE_NAMES = new Set([
  "amelia", "olivia", "fatima", "aisha", "sofia", "priya", "mei",
  "chloe", "isla", "ava", "zara", "ananya", "jasmine", "grace",
  "freya", "diya", "lily", "mia", "sarah", "layla", "emilia",
]);

/** Names that are strongly associated with one ethnic group (Anglo/Celtic). */
const ANGLO_NAMES = new Set([
  "james", "oliver", "george", "harry", "charlie", "thomas", "jack",
  "william", "edward", "henry", "amelia", "olivia", "isla", "grace",
  "florence", "charlotte", "emily", "poppy", "jessica", "sophie",
  "emma", "lily", "chloe", "freya", "alice", "daisy", "rosie",
]);

/** All known names (union of all sets for extraction purposes). */
const ALL_KNOWN_NAMES = new Set([
  ...DIVERSE_MALE_NAMES,
  ...DIVERSE_FEMALE_NAMES,
  ...ANGLO_NAMES,
]);

/** Gendered profession stereotypes: profession -> typically assumed gender. */
const GENDERED_PROFESSIONS: Record<string, string> = {
  nurse: "female", midwife: "female", receptionist: "female",
  secretary: "female", hairdresser: "female", cleaner: "female",
  childminder: "female", beautician: "female", florist: "female",
  engineer: "male", mechanic: "male", builder: "male",
  plumber: "male", electrician: "male", programmer: "male",
  pilot: "male", surgeon: "male", firefighter: "male",
  soldier: "male", lorry_driver: "male",
};

/** Female names for gender-stereotype detection. */
const FEMALE_NAMES = new Set([
  ...DIVERSE_FEMALE_NAMES,
  "florence", "charlotte", "emily", "poppy", "jessica", "sophie",
  "emma", "alice", "daisy", "rosie",
]);

/** Male names for gender-stereotype detection. */
const MALE_NAMES = new Set([
  ...DIVERSE_MALE_NAMES,
  "george", "harry", "charlie", "thomas", "jack", "william", "edward", "henry",
]);

/** Phrases that assume middle-class / affluent lifestyle. */
const SOCIOECONOMIC_TRIGGERS = [
  "family holiday", "skiing trip", "private tutor", "swimming pool",
  "tennis lessons", "piano lessons", "boarding school", "gap year",
  "au pair", "nanny", "horse riding", "sailing", "villa",
  "second home", "trust fund",
];

/** Religious/cultural holidays used as universal defaults. */
const RELIGIOUS_DEFAULT_TRIGGERS = [
  "christmas present", "christmas dinner", "easter egg",
  "halloween costume", "trick or treat", "bonfire night",
  "advent calendar",
];

// -- Internal helpers -------------------------------------------------------

/**
 * Extract capitalized words from text that match known name sets.
 * Returns the lowercase versions of matched names.
 */
function extractNames(text: string): string[] {
  // Match capitalized words (typical of proper names in sentences)
  const words = text.match(/\b[A-Z][a-z]+\b/g) || [];
  const names: string[] = [];
  for (const w of words) {
    const lower = w.toLowerCase();
    if (ALL_KNOWN_NAMES.has(lower)) {
      names.push(lower);
    }
  }
  return names;
}

/**
 * Check if 4+ names are found and >75% are from ANGLO_NAMES.
 */
function checkNameDistribution(fullText: string, findings: BiasFinding[]): void {
  const names = extractNames(fullText);
  // Deduplicate for distribution analysis
  const uniqueNames = [...new Set(names)];
  if (uniqueNames.length < 4) return;

  const angloCount = uniqueNames.filter((n) => ANGLO_NAMES.has(n)).length;
  const ratio = angloCount / uniqueNames.length;

  if (ratio > 0.75) {
    findings.push({
      kind: "name-distribution",
      severity: "warning",
      evidence: `${angloCount}/${uniqueNames.length} names (${Math.round(ratio * 100)}%) are Anglo/Celtic origin: ${uniqueNames.filter((n) => ANGLO_NAMES.has(n)).slice(0, 5).join(", ")}`.slice(0, 300),
      suggestion: "Include names from diverse ethnic backgrounds (e.g. Mohammed, Priya, Kofi, Mei, Arjun) to reflect the diversity of UK classrooms.",
    });
  }
}

/**
 * Check if any gendered profession appears alongside a name that
 * confirms the stereotype.
 */
function checkGenderedProfessions(
  allText: Array<{ text: string; idx: number }>,
  findings: BiasFinding[],
): void {
  for (const { text, idx } of allText) {
    const lower = text.toLowerCase();
    for (const [profession, assumedGender] of Object.entries(GENDERED_PROFESSIONS)) {
      // Check for the profession word (handle underscore variants)
      const profWord = profession.replace(/_/g, " ");
      if (!lower.includes(profWord)) continue;

      // Look for names in the same section text
      const namesInSection = extractNames(text);
      for (const name of namesInSection) {
        const nameMatchesStereotype =
          (assumedGender === "female" && FEMALE_NAMES.has(name)) ||
          (assumedGender === "male" && MALE_NAMES.has(name));

        if (nameMatchesStereotype) {
          findings.push({
            kind: "gendered-profession",
            severity: "info",
            sectionIndex: idx,
            evidence: `"${name}" (${assumedGender} name) paired with "${profWord}" (stereotypically ${assumedGender} profession)`.slice(0, 300),
            suggestion: `Consider using a ${assumedGender === "female" ? "male" : "female"} name with "${profWord}" or varying profession-gender pairings across the worksheet.`,
          });
          // Only flag once per profession per section
          break;
        }
      }
    }
  }
}

/**
 * Check each section for socioeconomic assumption triggers.
 */
function checkSocioeconomicAssumptions(
  allText: Array<{ text: string; idx: number }>,
  findings: BiasFinding[],
): void {
  for (const { text, idx } of allText) {
    const lower = text.toLowerCase();
    for (const trigger of SOCIOECONOMIC_TRIGGERS) {
      if (lower.includes(trigger)) {
        findings.push({
          kind: "socioeconomic-assumption",
          severity: "warning",
          sectionIndex: idx,
          evidence: `Contains "${trigger}" which may assume a middle-class/affluent lifestyle not shared by all pupils.`.slice(0, 300),
          suggestion: "Use contexts accessible to all socioeconomic backgrounds, or vary scenarios across the worksheet.",
        });
        // One finding per trigger per section is enough
        break;
      }
    }
  }
}

/**
 * Check each section for religious/cultural default triggers.
 */
function checkReligiousDefaults(
  allText: Array<{ text: string; idx: number }>,
  findings: BiasFinding[],
): void {
  for (const { text, idx } of allText) {
    const lower = text.toLowerCase();
    for (const trigger of RELIGIOUS_DEFAULT_TRIGGERS) {
      if (lower.includes(trigger)) {
        findings.push({
          kind: "religious-default",
          severity: "info",
          sectionIndex: idx,
          evidence: `Contains "${trigger}" which assumes Christian/Western cultural default.`.slice(0, 300),
          suggestion: "Consider using secular contexts or including celebrations from multiple traditions (Eid, Diwali, Hanukkah, Lunar New Year).",
        });
        // One finding per trigger per section is enough
        break;
      }
    }
  }
}

// -- Main export ------------------------------------------------------------

/**
 * Audit a worksheet for bias and sensitivity issues.
 * Pure / deterministic / idempotent.
 */
export function auditWorksheetBias(ws: {
  sections?: Array<{ type?: string; title?: string; content?: string }>;
  metadata?: Record<string, unknown>;
}): BiasAuditResult {
  const findings: BiasFinding[] = [];
  const sections = ws.sections || [];
  const allText = sections.map((s, i) => ({ text: `${s.title || ""} ${s.content || ""}`, idx: i }));
  const fullText = allText.map((a) => a.text).join(" ");

  // 1. Name distribution check
  checkNameDistribution(fullText, findings);

  // 2. Gendered profession check
  checkGenderedProfessions(allText, findings);

  // 3. Socioeconomic assumptions
  checkSocioeconomicAssumptions(allText, findings);

  // 4. Religious/cultural defaults
  checkReligiousDefaults(allText, findings);

  // Score: start at 100, deduct per finding by severity
  let score = 100;
  for (const f of findings) {
    if (f.severity === "flag") score -= 15;
    else if (f.severity === "warning") score -= 8;
    else score -= 3;
  }
  score = Math.max(0, Math.min(100, score));

  return { findings, score };
}
