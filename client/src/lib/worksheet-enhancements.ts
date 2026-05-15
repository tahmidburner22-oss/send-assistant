/**
 * worksheet-enhancements.ts — Improvements layered onto Worksheet Generator.
 *
 * Strip differentiation is intentionally NOT included — left as a separate
 * later release. This module adds:
 *   1. Dual teacher/pupil version emit (split a single output)
 *   2. Answer-key validator (every Q has a unique entry; counts match)
 *   3. Curriculum tag autocomplete (NC objective code from topic + year)
 *   4. A4 print-scale preview helpers (page-break heuristic, scale factor)
 *
 * Strip differentiation = SKIPPED on purpose — see ideas.md / changelog.
 */

// ── 1. Dual teacher / pupil version split ───────────────────────────────────

/**
 * Split a teacher-and-pupil combined output into two separate strings.
 * The model is asked to wrap the answer key in `--- TEACHER ANSWER KEY ---`
 * (matches ExitTicket's existing convention). If the marker is missing we
 * fall back to a heuristic: any line starting with "Answer:" / "Mark scheme:"
 * goes into the teacher copy.
 */
export function splitTeacherPupilVersions(text: string): { pupil: string; teacher: string } {
  const exact = text.split(/^[\s\-]*---\s*TEACHER\s*(?:ANSWER\s*KEY|COPY|KEY|ANSWERS?)\s*---/im);
  if (exact.length >= 2) {
    return { pupil: exact[0].trim(), teacher: exact.slice(1).join("\n").trim() };
  }
  const lines = text.split("\n");
  const pupilLines: string[] = [];
  const teacherLines: string[] = [];
  for (const l of lines) {
    if (/^\s*(?:answer|mark\s*scheme|teacher\s*notes?|model\s*answer|expected\s*response)\s*:/i.test(l)) {
      teacherLines.push(l);
    } else {
      pupilLines.push(l);
    }
  }
  return { pupil: pupilLines.join("\n").trim(), teacher: teacherLines.join("\n").trim() };
}

/** Append a system-prompt suffix asking the model to emit the dual format. */
export const DUAL_VERSION_SYSTEM_SUFFIX = `

OUTPUT FORMAT — DUAL VERSIONS:
1. First emit the pupil-facing worksheet text only (no answers).
2. On a single line, print exactly: --- TEACHER ANSWER KEY ---
3. Then for every question above, give the answer + a one-line mark-scheme note + any common pupil misconception to flag.
The two sections must be separated by exactly that marker line so a downstream parser can split them.`;

// ── 2. Answer-key validator ─────────────────────────────────────────────────

export interface AnswerKeyReport {
  ok: boolean;
  questionCount: number;
  answerCount: number;
  duplicates: string[];
  problems: string[];
}

const QUESTION_NUMBER_RX = /^\s*(?:Q|Question)?\s*(\d+)\s*[).:]/i;

export function validateAnswerKey(pupilText: string, teacherText: string): AnswerKeyReport {
  const qNumbers = new Set<number>();
  for (const line of pupilText.split("\n")) {
    const m = line.match(QUESTION_NUMBER_RX);
    if (m) qNumbers.add(Number(m[1]));
  }
  const aNumbers = new Set<number>();
  const seenAnswers = new Map<string, number>();
  const duplicates: string[] = [];
  for (const line of teacherText.split("\n")) {
    const m = line.match(QUESTION_NUMBER_RX);
    if (m) aNumbers.add(Number(m[1]));
    const ansMatch = line.match(/answer\s*:\s*(.+)$/i);
    if (ansMatch) {
      const norm = ansMatch[1].trim().toLowerCase();
      const prev = seenAnswers.get(norm) || 0;
      seenAnswers.set(norm, prev + 1);
      if (prev === 1) duplicates.push(ansMatch[1].trim());
    }
  }
  const problems: string[] = [];
  if (qNumbers.size === 0) problems.push("No numbered questions detected.");
  if (aNumbers.size === 0) problems.push("No numbered answers detected.");
  if (qNumbers.size !== aNumbers.size) {
    problems.push(`Mismatch: ${qNumbers.size} question(s) but ${aNumbers.size} answer(s).`);
  }
  for (const q of qNumbers) if (!aNumbers.has(q)) problems.push(`Q${q} has no answer in the key.`);
  if (duplicates.length > 0) problems.push(`Duplicate answers found: ${duplicates.slice(0, 5).join("; ")}`);
  return {
    ok: problems.length === 0,
    questionCount: qNumbers.size,
    answerCount: aNumbers.size,
    duplicates,
    problems,
  };
}

// ── 3. Curriculum tag autocomplete ──────────────────────────────────────────

export interface CurriculumTag {
  code: string;       // e.g. 5F4
  label: string;      // human-readable description
  yearGroup: string;  // Y1–Y6, KS3, KS4
  subject: string;    // Mathematics / English / Science
}

/**
 * Tiny curriculum tag bank — the most common UK National Curriculum
 * objective codes for primary maths/english/science. Real product would
 * load thousands; this is enough to make the autocomplete feel smart out
 * of the box and to demonstrate the print-footer stamp.
 */
export const CURRICULUM_TAGS: CurriculumTag[] = [
  { code: "Y1N1",  label: "Count to and across 100", yearGroup: "Y1", subject: "Mathematics" },
  { code: "Y2N3",  label: "Two-digit place value", yearGroup: "Y2", subject: "Mathematics" },
  { code: "Y3N4",  label: "Add and subtract numbers with up to 3 digits", yearGroup: "Y3", subject: "Mathematics" },
  { code: "Y4F2",  label: "Recognise and show equivalent fractions", yearGroup: "Y4", subject: "Mathematics" },
  { code: "Y4F4",  label: "Add and subtract fractions with the same denominator", yearGroup: "Y4", subject: "Mathematics" },
  { code: "Y4M3",  label: "Measure and calculate the perimeter of rectilinear figures", yearGroup: "Y4", subject: "Mathematics" },
  { code: "Y5F1",  label: "Compare and order fractions", yearGroup: "Y5", subject: "Mathematics" },
  { code: "Y5F4",  label: "Add and subtract fractions with the same denominator and multiples", yearGroup: "Y5", subject: "Mathematics" },
  { code: "Y6R1",  label: "Use ratio language and notation", yearGroup: "Y6", subject: "Mathematics" },
  { code: "Y6A2",  label: "Use simple formulae", yearGroup: "Y6", subject: "Mathematics" },

  { code: "Y2W3",  label: "Develop pleasure in reading by listening to stories", yearGroup: "Y2", subject: "English" },
  { code: "Y3W2",  label: "Read and discuss a range of fiction, poetry, plays and non-fiction", yearGroup: "Y3", subject: "English" },
  { code: "Y4W4",  label: "Compose sentences using a wider range of structures", yearGroup: "Y4", subject: "English" },
  { code: "Y5R2",  label: "Inference: drawing inferences such as inferring characters' feelings", yearGroup: "Y5", subject: "English" },
  { code: "Y6W1",  label: "Plan, draft, write, edit and proofread", yearGroup: "Y6", subject: "English" },

  { code: "Y3S2",  label: "Forces and magnets", yearGroup: "Y3", subject: "Science" },
  { code: "Y4S3",  label: "States of matter", yearGroup: "Y4", subject: "Science" },
  { code: "Y5S1",  label: "Earth and space", yearGroup: "Y5", subject: "Science" },
  { code: "Y6S2",  label: "Living things and their habitats", yearGroup: "Y6", subject: "Science" },
];

export function suggestCurriculumTags(opts: { topic: string; subject?: string; yearGroup?: string }): CurriculumTag[] {
  const topic = (opts.topic || "").toLowerCase().trim();
  if (!topic) return [];
  const tokens = topic.split(/\s+/).filter(t => t.length >= 3);
  return CURRICULUM_TAGS
    .filter(t => !opts.subject || t.subject === opts.subject)
    .filter(t => !opts.yearGroup || t.yearGroup === opts.yearGroup)
    .map(t => {
      const score = tokens.reduce((acc, tok) => acc + (t.label.toLowerCase().includes(tok) ? 1 : 0), 0);
      return { tag: t, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(x => x.tag);
}

// ── 4. A4 print-scale preview helpers ───────────────────────────────────────

/** A4 portrait dimensions in CSS pixels at 96dpi. */
export const A4_WIDTH_PX  = 794;   // 210mm
export const A4_HEIGHT_PX = 1123;  // 297mm

/** Recommended scale factor to fit a body width into the on-screen preview. */
export function scaleFor(containerWidth: number): number {
  if (containerWidth <= 0) return 1;
  return Math.min(1, containerWidth / A4_WIDTH_PX);
}

/**
 * Look at a rendered HTML element and detect questions that straddle a page
 * break by walking direct children that are question blocks.
 */
export function detectPageBreaks(root: HTMLElement | null): { questionIndex: number; topPx: number; splits: boolean }[] {
  if (!root) return [];
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-question], li, .question, p"));
  const out: { questionIndex: number; topPx: number; splits: boolean }[] = [];
  items.forEach((el, i) => {
    const top    = el.offsetTop;
    const bottom = top + el.offsetHeight;
    const startPage = Math.floor(top / A4_HEIGHT_PX);
    const endPage   = Math.floor(bottom / A4_HEIGHT_PX);
    out.push({ questionIndex: i, topPx: top, splits: startPage !== endPage });
  });
  return out;
}
