/**
 * tool-vocab.ts — single source of truth for option lists used across all
 * AI-tool forms (subjects, year groups, SEND needs, target areas, tones).
 *
 * Until now each tool page (QuizGenerator, SmartTargets, RubricGenerator,
 * LessonPlanner, ReportComments…) re-declared its own slightly-different
 * subject/year/SEND list. That meant:
 *   - "this option exists in tool A but not tool B" bugs
 *   - Adding "Pathological Demand Avoidance" required edits in 8 files
 *   - The TypeScript compiler couldn't catch a typo'd send-need ID
 *
 * This module fixes both. Tools should import from here and only here.
 *
 * NOTE: lib/send-data.ts already exposes a richer Subject[]/SendNeed[]
 * shape used by Differentiate.tsx and the screener. Those structures are
 * kept for backward compatibility; this module exposes flat
 * {value,label}[] arrays that match the AIToolPage select-field contract.
 */

export interface VocabOption {
  value: string;
  label: string;
}

// ─── Subjects ────────────────────────────────────────────────────────────────
// One unified list. Use SUBJECTS_PRIMARY / SUBJECTS_SECONDARY when a tool only
// needs the relevant subset for a key stage; otherwise prefer SUBJECTS_ALL.

export const SUBJECTS_ALL: VocabOption[] = [
  { value: "English",            label: "English" },
  { value: "Maths",              label: "Maths" },
  { value: "Science",            label: "Science" },
  { value: "Biology",            label: "Biology" },
  { value: "Chemistry",          label: "Chemistry" },
  { value: "Physics",            label: "Physics" },
  { value: "History",            label: "History" },
  { value: "Geography",          label: "Geography" },
  { value: "RE",                 label: "Religious Education" },
  { value: "PSHE",               label: "PSHE" },
  { value: "Art",                label: "Art & Design" },
  { value: "Music",              label: "Music" },
  { value: "PE",                 label: "Physical Education" },
  { value: "Computing",          label: "Computing" },
  { value: "MFL",                label: "Modern Foreign Languages" },
  { value: "Design Technology",  label: "Design & Technology" },
  { value: "Drama",              label: "Drama" },
  { value: "Citizenship",        label: "Citizenship" },
  { value: "Business Studies",   label: "Business Studies" },
  { value: "Economics",          label: "Economics" },
  { value: "Psychology",         label: "Psychology" },
  { value: "Sociology",          label: "Sociology" },
  { value: "Law",                label: "Law" },
  { value: "Media Studies",      label: "Media Studies" },
  { value: "Film Studies",       label: "Film Studies" },
  { value: "Health & Social Care", label: "Health & Social Care" },
];

export const SUBJECTS_PRIMARY: VocabOption[] = SUBJECTS_ALL.filter(s =>
  ["English","Maths","Science","History","Geography","RE","PSHE","Art","Music","PE","Computing","MFL","Design Technology","Drama"].includes(s.value),
);

export const SUBJECTS_SECONDARY: VocabOption[] = SUBJECTS_ALL.filter(s =>
  !["Citizenship","Business Studies","Economics","Psychology","Sociology","Law","Media Studies","Film Studies","Health & Social Care"].includes(s.value)
    || ["Business Studies","Economics","Psychology","Sociology","Law","Media Studies","Film Studies","Health & Social Care","Citizenship"].includes(s.value),
);

// Convenience addition for ReportComments which has an "overall" option.
export const SUBJECTS_WITH_OVERALL: VocabOption[] = [
  ...SUBJECTS_ALL,
  { value: "Overall Progress / Form Tutor", label: "Overall Progress / Form Tutor" },
];

// ─── Year groups ─────────────────────────────────────────────────────────────

export const YEAR_GROUPS: VocabOption[] = [
  "Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6",
  "Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13",
].map(y => ({ value: y, label: y }));

// ─── SEND needs ──────────────────────────────────────────────────────────────
// Single canonical list. Includes Pathological Demand Avoidance which was
// previously missing from every tool. Add new entries HERE only.

export const SEND_NEEDS: VocabOption[] = [
  { value: "Autism Spectrum Condition",          label: "Autism Spectrum Condition (ASC)" },
  { value: "Pathological Demand Avoidance",      label: "Pathological Demand Avoidance (PDA)" },
  { value: "ADHD",                                label: "ADHD" },
  { value: "Dyslexia",                            label: "Dyslexia" },
  { value: "Dyscalculia",                         label: "Dyscalculia" },
  { value: "Dyspraxia",                           label: "Dyspraxia (DCD)" },
  { value: "Speech & Language Needs",             label: "Speech, Language & Communication Needs (SLCN)" },
  { value: "Social, Emotional & Mental Health",   label: "Social, Emotional & Mental Health (SEMH)" },
  { value: "Hearing Impairment",                  label: "Hearing Impairment" },
  { value: "Visual Impairment",                   label: "Visual Impairment" },
  { value: "Physical Disability",                 label: "Physical Disability" },
  { value: "Moderate Learning Difficulties",      label: "Moderate Learning Difficulties (MLD)" },
  { value: "Severe Learning Difficulties",        label: "Severe Learning Difficulties (SLD)" },
  { value: "Complex Needs",                       label: "Complex / Multiple Needs" },
  { value: "EAL",                                 label: "English as an Additional Language (EAL)" },
];

export type SendNeedValue = typeof SEND_NEEDS[number]["value"];

// ─── Target areas (SmartTargets, IEP, EHCP outcomes) ─────────────────────────

export const TARGET_AREAS: VocabOption[] = [
  "Reading","Writing","Maths","Communication","Social Skills",
  "Behaviour & Self-Regulation","Independence","Fine Motor Skills",
  "Gross Motor Skills","Attention & Focus","Emotional Regulation",
  "Organisational Skills",
].map(a => ({ value: a, label: a }));

// ─── Tones (used by ReportComments, ParentNewsletter, BehaviourPlan etc.) ────

export const TONES_REPORT: VocabOption[] = [
  { value: "positive",    label: "Positive & Encouraging" },
  { value: "balanced",    label: "Balanced (strengths + targets)" },
  { value: "concern",     label: "Raising Concern Sensitively" },
  { value: "celebration", label: "Celebrating Achievement" },
];

export const TONES_NEWSLETTER: VocabOption[] = [
  { value: "warm",          label: "Warm & Friendly" },
  { value: "professional",  label: "Professional & Formal" },
  { value: "celebratory",   label: "Celebratory & Upbeat" },
  { value: "informative",   label: "Informative & Clear" },
  { value: "supportive",    label: "Supportive & Empathetic" },
];

// ─── Pronouns (single canonical option set) ──────────────────────────────────

export const PRONOUNS: VocabOption[] = [
  { value: "She/her",   label: "She/her" },
  { value: "He/him",    label: "He/him" },
  { value: "They/them", label: "They/them" },
];

// ─── Attainment levels (ReportComments + IEPGenerator) ──────────────────────

export const ATTAINMENT_LEVELS: VocabOption[] = [
  { value: "exceeding",            label: "Exceeding / Above Expected" },
  { value: "expected",             label: "Meeting Expected" },
  { value: "approaching",          label: "Approaching Expected" },
  { value: "below",                label: "Below Expected" },
  { value: "significant-progress", label: "Significant Progress Made" },
  { value: "exceptional",          label: "Exceptional / Outstanding" },
];
