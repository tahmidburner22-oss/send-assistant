/**
 * ks5SynopticBuilder.ts — PR-25 / audit item #36.
 *
 * KS5 (A-Level) synoptic generator. Pure / deterministic.
 *
 * KS5 papers test "synoptic" reasoning — questions that draw on more
 * than one prior topic. Until now the worksheet generator at KS5
 * produced topic-isolated questions identical in structure to KS4.
 * This builder takes a target topic + the SoW prior topics already
 * stamped on the worksheet (`metadata.priorTopics` from Pillar A) and
 * produces a deterministic "synoptic stem" that names ≥ 2 prior
 * topics the LLM must thread together when answering.
 *
 * The output is pure metadata; the LLM still writes the question
 * body. The post-validator chain warns when a Y12+ worksheet ships
 * without any synoptic stem.
 */

export interface SynopticBuilderInputs {
  topic: string;
  subject?: string;
  yearGroup?: string;
  /** Prior topics covered earlier in the SoW. */
  priorTopics?: string[];
  /** When false, the builder no-ops and returns null. Default true. */
  enableForKs5Only?: boolean;
}

export interface SynopticStem {
  /** The opening prompt the LLM should use as a stem. */
  stem: string;
  /** The two prior topics threaded into the stem. */
  threadedTopics: [string, string];
  /** Suggested mark tariff (synoptic stems usually carry 6+). */
  suggestedMarks: number;
  /** Synoptic level: "double" = 2 topics, "triple" = 3. */
  level: "double" | "triple";
}

const KS5_YEAR_RE = /\bY(?:ear)?\s*1[2-3]\b|KS5|A[\s-]?Level/i;

/** Heuristic: which year groups produce synoptic stems? */
export function isKs5(yearGroup: string | undefined): boolean {
  return KS5_YEAR_RE.test(String(yearGroup || ""));
}

/**
 * Build a deterministic synoptic stem. Picks the two earliest prior
 * topics from `priorTopics` (so the stem is reproducible across
 * regenerations), threads them through a subject-tuned template.
 */
export function buildSynopticStem(inputs: SynopticBuilderInputs): SynopticStem | null {
  const enabled = inputs.enableForKs5Only ?? true;
  if (enabled && !isKs5(inputs.yearGroup)) return null;

  const priors = (inputs.priorTopics || [])
    .map((t) => (t || "").trim())
    .filter((t) => t.length > 0);
  if (priors.length < 2) return null;

  const [a, b] = [priors[0], priors[1]] as [string, string];
  const subject = String(inputs.subject || "").toLowerCase();
  const target = String(inputs.topic || "this topic").trim();
  const subjectStems: Record<string, string> = {
    physics: `Linking your knowledge of "${a}" and "${b}", explain how each contributes to "${target}". Quote one equation from each prior topic and use them to build the answer.`,
    chemistry: `Drawing on "${a}" and "${b}", account for the behaviour observed in "${target}". You must reference at least one named mechanism from each prior topic.`,
    biology: `Combining your understanding of "${a}" and "${b}", explain how the two processes interact in "${target}". Reference one named structure or molecule from each.`,
    history: `Using evidence from "${a}" and "${b}", evaluate the extent to which they shaped "${target}". Reach a substantiated judgement.`,
    geography: `Synthesising "${a}" and "${b}", explain the processes that produced "${target}". Reference data or a named example from each prior topic.`,
    "english literature": `Drawing on "${a}" and "${b}", analyse how both texts illuminate "${target}". Embed one short quotation from each.`,
    mathematics: `Using techniques from "${a}" and "${b}", solve the problem on "${target}". Show every step; identify which technique is being used at each step.`,
  };
  const stem = subjectStems[subject] || `Threading "${a}" and "${b}", explain "${target}". Reference at least one named idea from each prior topic.`;
  const level: SynopticStem["level"] = priors.length >= 3 ? "triple" : "double";
  const suggestedMarks = level === "triple" ? 9 : 6;
  return { stem, threadedTopics: [a, b], suggestedMarks, level };
}

export interface SynopticAuditWorksheet {
  metadata?: {
    yearGroup?: string;
    subject?: string;
    topic?: string;
    priorTopics?: string[];
    synopticLinks?: Array<{ priorTopic: string }>;
    synopticStem?: SynopticStem;
  } & Record<string, unknown>;
  sections?: Array<{ content?: string }>;
}

/**
 * Worksheet-level slice. Stamps the deterministic stem onto
 * `metadata.synopticStem` (additive). When the LLM omits a synoptic
 * question on a Y12+ worksheet AND there are ≥ 2 prior topics, emits
 * a warning so the teacher banner picks it up.
 */
export function enforceKs5Synoptic(
  ws: SynopticAuditWorksheet,
): { worksheet: SynopticAuditWorksheet; warnings: string[] } {
  const warnings: string[] = [];
  if (!isKs5(ws.metadata?.yearGroup)) return { worksheet: ws, warnings };
  const priors = ws.metadata?.priorTopics || [];
  if (priors.length < 2) return { worksheet: ws, warnings };

  const stamped = ws.metadata?.synopticStem;
  const stem =
    stamped ||
    buildSynopticStem({
      topic: String(ws.metadata?.topic || ""),
      subject: ws.metadata?.subject,
      yearGroup: ws.metadata?.yearGroup,
      priorTopics: priors,
    });
  if (!stem) return { worksheet: ws, warnings };

  // Detect whether at least one section already references both
  // priors — a soft signal the LLM did the synoptic threading.
  const sectionText = (ws.sections || []).map((s) => String(s.content || "")).join(" ").toLowerCase();
  const a = stem.threadedTopics[0].toLowerCase();
  const b = stem.threadedTopics[1].toLowerCase();
  const threadedAlready = sectionText.includes(a) && sectionText.includes(b);
  if (!threadedAlready) {
    warnings.push(
      `[Phase PR-25 — KS5 synoptic] Worksheet does not visibly thread prior topics "${stem.threadedTopics[0]}" and "${stem.threadedTopics[1]}".`,
    );
  }

  return {
    worksheet: {
      ...ws,
      metadata: {
        ...(ws.metadata || {}),
        synopticStem: stem,
      },
    },
    warnings,
  };
}
