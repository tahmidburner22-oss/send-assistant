/**
 * bloomProgressionAudit.ts — PR-14 (audit items #8, #9)
 *
 * Pure / idempotent post-validator that audits two related pedagogical
 * properties of every worksheet:
 *
 *   1. **Bloom-monotonicity (#8)** — questions across a worksheet
 *      should rise in cognitive demand. We map each question to a
 *      Bloom rank using the leading command word + the section's
 *      `bloomLevel` field when present, and warn when consecutive
 *      questions step DOWN by more than one Bloom rank. A Y10 worksheet
 *      that opens with "Evaluate" and follows with "Define" is
 *      backwards-progressing — usually a placement bug, not a
 *      pedagogical choice.
 *
 *   2. **Science working-space stub (#9)** — every science calculation
 *      question (`Calculate`, `Work out`, `Determine`) needs a stub
 *      working-out space. The Phase 1 rule already forces a
 *      `workingOutBox: true` on maths calculation stems but Sciences
 *      were intentionally omitted. This validator emits a warning for
 *      science calculation questions that don't have explicit working
 *      lines — sciences use plain ruled lines (not the dot grid) but
 *      still need the space.
 */

interface Section {
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
  marks?: number;
  bloomLevel?: string;
  commandWord?: string;
  workingOutBox?: boolean;
  answerLines?: number;
}

interface Worksheet {
  sections?: Section[];
  metadata?: {
    subject?: string;
    [key: string]: unknown;
  };
}

const BLOOM_RANK: Record<string, number> = {
  remember: 1,
  understand: 2,
  apply: 3,
  analyse: 4,
  evaluate: 5,
  create: 6,
};

const COMMAND_WORD_TO_BLOOM: Array<{ re: RegExp; rank: number }> = [
  { re: /^\s*(state|name|list|recall|identify)\b/i, rank: 1 },
  { re: /^\s*(describe|define|outline|summarise)\b/i, rank: 2 },
  { re: /^\s*(calculate|find|solve|work\s+out|show\s+that|determine|how\s+many|how\s+much)\b/i, rank: 3 },
  { re: /^\s*(explain|use|apply)\b/i, rank: 3 },
  { re: /^\s*(compare|contrast|analyse)\b/i, rank: 4 },
  { re: /^\s*(evaluate|justify|assess|critique)\b/i, rank: 5 },
  { re: /^\s*(design|plan|create|propose)\b/i, rank: 6 },
];

function rankOf(s: Section): number | null {
  const fromField = (s.bloomLevel || "").toLowerCase();
  if (BLOOM_RANK[fromField]) return BLOOM_RANK[fromField];
  const cw = (s.commandWord || "").trim();
  const fromCommandWord = cw && COMMAND_WORD_TO_BLOOM.find((m) => m.re.test(cw));
  if (fromCommandWord) return fromCommandWord.rank;
  // Fall back to the leading word of the question content.
  const content = (s.content || "").trim();
  const leadMatch = content.match(/^\s*([A-Za-z][a-zA-Z]+)/);
  const lead = leadMatch ? leadMatch[1] : "";
  const fromLead = lead && COMMAND_WORD_TO_BLOOM.find((m) => m.re.test(lead));
  return fromLead ? fromLead.rank : null;
}

function isQuestionSection(s: Section): boolean {
  const t = (s.type || "").toLowerCase();
  return /^q-|question|application|practice|challenge/.test(t);
}

function isScienceSubject(subject?: string): boolean {
  const s = (subject || "").toLowerCase();
  return /science|biology|chemistry|physics/.test(s);
}

function isCalculationStem(s: Section): boolean {
  const cw = (s.commandWord || "").toLowerCase();
  if (/calculate|work\s+out|determine|find/.test(cw)) return true;
  const content = (s.content || "").toLowerCase();
  return /\b(calculate|work\s+out|determine|find\s+the\s+(value|mass|temperature|time))\b/.test(content);
}

export function enforceBloomProgression(
  ws: Worksheet,
): { worksheet: Worksheet; warnings: string[] } {
  const warnings: string[] = [];
  const sections = ws.sections || [];
  const subject = ws.metadata?.subject;

  // Bloom monotonicity.
  const questions = sections.filter((s) => !s.teacherOnly && isQuestionSection(s));
  let lastRank: number | null = null;
  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const rank = rankOf(q);
    if (rank == null) continue;
    if (lastRank != null && rank + 1 < lastRank) {
      warnings.push(
        `[Phase PR-14 — Bloom progression] Question "${q.title || `Q${i + 1}`}" drops from rank ${lastRank} to rank ${rank}. ` +
        `Cognitive demand should rise (or hold) across a worksheet — check ordering.`,
      );
    }
    lastRank = rank;
  }

  // Science working-space stub.
  if (isScienceSubject(subject)) {
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!isCalculationStem(q)) continue;
      const hasSpace =
        (q.answerLines || 0) >= 2 ||
        /(working|space\s+for\s+working|show\s+your\s+working)/i.test(q.content || "");
      if (!hasSpace) {
        warnings.push(
          `[Phase PR-14 — Science working space] Calculation question "${q.title || `Q${i + 1}`}" has no working-out space. ` +
          `Add 2-4 ruled answer lines or include a "Show your working" cue.`,
        );
      }
    }
  }

  if (warnings.length === 0) return { worksheet: ws, warnings: [] };

  return {
    worksheet: {
      ...ws,
      metadata: {
        ...(ws.metadata || {}),
        bloomProgressionReport: {
          warningCount: warnings.length,
          questionCount: questions.length,
        },
      },
    },
    warnings,
  };
}
