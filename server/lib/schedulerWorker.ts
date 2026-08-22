/**
 * Scheduler Worker — autonomous daily worksheet generation + auto-mark.
 *
 * Runs inside the Node process via setInterval. Every tick (5 min by default):
 *   1. Find all scheduler_configs that are enabled + due (next_fire_at <= NOW())
 *   2. For each, generate a fresh SEND-adapted worksheet using the pupil's
 *      profile (year_group, send_need) AND the config's topic/skill-ladder
 *      position. Insert a new assignment row.
 *   3. Find all assignments that are submitted but not marked (source='scheduler'
 *      AND status='submitted' AND marked_at IS NULL) and run the AI auto-mark.
 *
 * The teacher can accept the AI mark (advances pupil on the ladder if >= pass
 * threshold, else regenerates) or override it via the /accept-mark and
 * /override-mark endpoints on the scheduler router.
 *
 * Topic/skill ladder is served by a small embedded subject → topic list
 * (authoritative in one place — the client uses the same list via
 * client/src/lib/topic-bank.ts but the worker cannot import client code).
 */
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { callWithFallback } from "../routes/ai.js";

// ── Topic ladders per subject ────────────────────────────────────────────────
// Keep this list conservative and safe. The worker will cycle through these
// topics in order and escalate step-by-step. Teachers can override via the
// set-topic endpoint.
const TOPIC_LADDERS: Record<string, { topic: string; steps: string[] }[]> = {
  mathematics: [
    { topic: "Number — Place Value & Rounding", steps: ["Identify place value", "Round to significant figures", "Compare & order decimals"] },
    { topic: "Fractions, Decimals & Percentages", steps: ["Equivalent fractions", "Convert between forms", "Percentage of an amount", "Percentage change"] },
    { topic: "Algebra — Expressions & Equations", steps: ["Collecting like terms", "Expanding brackets", "Factorising", "Solving linear equations", "Rearranging formulae"] },
    { topic: "Ratio & Proportion", steps: ["Simplifying ratios", "Dividing into a ratio", "Best buy problems", "Direct proportion"] },
    { topic: "Geometry & Angles", steps: ["Angle rules in lines", "Angles in triangles & quadrilaterals", "Parallel lines", "Polygons"] },
    { topic: "Perimeter, Area & Volume", steps: ["Perimeter & area of rectangles", "Area of triangles", "Area of compound shapes", "Circumference & area of circles", "Volume of prisms"] },
    { topic: "Statistics", steps: ["Mean, median, mode, range", "Frequency tables", "Bar charts & pictograms", "Stem-and-leaf"] },
    { topic: "Probability", steps: ["Listing outcomes", "Probability scale & notation", "Tree diagrams", "Experimental probability"] },
    { topic: "Trigonometry", steps: ["Pythagoras", "SOHCAHTOA in right-angled triangles", "Bearings"] },
  ],
  english: [
    { topic: "Reading Comprehension — Fiction", steps: ["Retrieval", "Inference", "Language analysis", "Structure analysis"] },
    { topic: "Reading Comprehension — Non-Fiction", steps: ["Identifying information", "Comparing texts", "Writer's viewpoint", "Persuasive techniques"] },
    { topic: "Writing — Description & Narrative", steps: ["Sensory detail", "Characterisation", "Structure", "Figurative language"] },
    { topic: "Writing — Transactional", steps: ["Letters", "Articles", "Speeches", "Leaflets"] },
    { topic: "Grammar & Punctuation", steps: ["Word classes", "Sentence types", "Commas, colons, semicolons", "Apostrophes"] },
    { topic: "Spelling & Vocabulary", steps: ["Common spelling rules", "Homophones", "Prefixes & suffixes", "Tier 2 vocabulary"] },
  ],
  science: [
    { topic: "Biology — Cells & Organisation", steps: ["Animal and plant cells", "Specialised cells", "Microscopy", "Tissues and organs"] },
    { topic: "Biology — Living Processes", steps: ["Digestion", "Respiration", "Circulation", "Homeostasis"] },
    { topic: "Chemistry — Atoms & Elements", steps: ["Atomic structure", "Periodic table", "Elements and compounds", "Mixtures and separation"] },
    { topic: "Chemistry — Reactions", steps: ["Word equations", "Conservation of mass", "Acids and alkalis", "Displacement reactions"] },
    { topic: "Physics — Forces & Motion", steps: ["Contact forces", "Gravity and weight", "Speed and distance-time graphs", "Newton's laws"] },
    { topic: "Physics — Energy", steps: ["Energy stores", "Transfers", "Efficiency", "Renewable vs non-renewable"] },
  ],
  history: [
    { topic: "Ancient Civilisations", steps: ["Ancient Egypt", "Ancient Greece", "Roman Empire"] },
    { topic: "Medieval Britain", steps: ["Norman conquest", "Feudal system", "Black Death"] },
    { topic: "Tudors & Stuarts", steps: ["Henry VIII", "Elizabeth I", "Civil War"] },
    { topic: "Industrial Revolution", steps: ["Agricultural change", "Factory system", "Social reform"] },
    { topic: "World Wars", steps: ["Causes of WW1", "Trench warfare", "Causes of WW2", "The Holocaust", "Home front"] },
  ],
  geography: [
    { topic: "Physical Geography", steps: ["Rivers", "Coasts", "Weather & climate", "Tectonics"] },
    { topic: "Human Geography", steps: ["Urbanisation", "Migration", "Development", "Globalisation"] },
    { topic: "Environmental Issues", steps: ["Climate change", "Ecosystems", "Resource management"] },
  ],
};

function listSubjectTopics(subject: string) {
  const key = subject.toLowerCase().trim();
  return TOPIC_LADDERS[key] || TOPIC_LADDERS.mathematics;
}

// ── SEND cue — pulled from pupil.send_need for every generation ─────────────
const SEND_CUES: Record<string, string> = {
  "Dyslexia": "Use short sentences, clear typography, one instruction per line, avoid dense text blocks.",
  "Dyscalculia": "Show every calculation step. Explicit numeric recipes. Worked example first.",
  "ADHD": "Break work into 5–7 short, clearly numbered items. Include a brain-break suggestion mid-way.",
  "Autism": "Use literal, unambiguous language. Predictable structure. Clear success criteria.",
  "SEMH": "Non-judgemental phrasing. Include a check-in prompt. Encourage self-reflection.",
  "MLD": "Chunk content. Use key vocabulary box. Plenty of scaffolding.",
  "Working memory": "Keep instructions short. Provide a 'helpful reminder' box for key facts.",
  "Speech & Language": "Use plain, concrete language. Visual prompts where possible.",
  "Hearing impairment": "Written instructions only — no audio references.",
  "Visual impairment": "Large print; high contrast; concise text.",
  "Tourettes": "Short, low-pressure tasks. Permit breaks.",
  "EAL": "Simple vocabulary. Bilingual glossary friendly. Visual scaffolds.",
};

function sendCueFor(sendNeed: string | null | undefined): string | null {
  if (!sendNeed) return null;
  // send_need column can be a single value or comma-separated list
  const needs = String(sendNeed).split(",").map(s => s.trim()).filter(Boolean);
  const cues = needs.map(n => SEND_CUES[n]).filter(Boolean);
  return cues.length > 0 ? cues.join(" ") : null;
}

/**
 * Reduces the durable teacher-authored learner-support profile to a bounded
 * generation cue. It deliberately excludes names, diagnosis and safeguarding
 * information and preserves the learner's objective, demand and mark scheme.
 */
export function buildSchedulerLearnerSupportCue(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const profile = JSON.parse(raw) as Record<string, any>;
    const list = (value: unknown, limit = 4) => Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map(item => item.trim().slice(0, 120)).slice(0, limit)
      : [] as string[];
    const accessibility = profile.accessibility && typeof profile.accessibility === "object" ? profile.accessibility as Record<string, unknown> : {};
    const communication = profile.communication && typeof profile.communication === "object" ? profile.communication as Record<string, unknown> : {};
    const parts: string[] = [];
    const strategies = list(profile.successfulStrategies);
    if (strategies.length) parts.push(`Trusted strategies: ${strategies.join("; ")}.`);
    if (accessibility.fontScale === "large" || accessibility.fontScale === "extra-large") parts.push("Use accessible larger print where the output surface permits.");
    if (accessibility.lineSpacing === "spacious" || accessibility.lineSpacing === "extra-spacious") parts.push("Use generous line spacing and short information blocks.");
    if (accessibility.highContrast === true) parts.push("Use high-contrast presentation.");
    if (accessibility.reduceVisualClutter === true) parts.push("Reduce visual clutter without removing content.");
    if (accessibility.useVisualSupports === true) parts.push("Use a concise visual support only where it does not become an assessed task.");
    if (communication.vocabularySupport === true) parts.push("Provide a compact plain-English vocabulary aid.");
    if (communication.sentenceFrames === true) parts.push("Use removable answer frames or sentence starters outside assessed wording.");
    if (communication.processingTime === "extended") parts.push("Avoid timed-pressure wording; the teacher decides any formal access arrangement.");
    const scaffold = typeof profile.scaffoldingLevel === "string" ? profile.scaffoldingLevel : "";
    if (["modelled", "part-modelled", "prompted", "independent"].includes(scaffold)) parts.push(`Scaffold entry point: ${scaffold}; fade support only after teacher-reviewed evidence.`);
    return parts.length ? parts.join(" ").slice(0, 1600) : null;
  } catch {
    return null;
  }
}

// ── Generate the worksheet (text content only — rich rendering on client) ──
async function generateSchedulerWorksheet(opts: {
  yearGroup: string | null;
  learnerSupportCue?: string | null;
  sendNeed: string | null;
  subject: string;
  topic: string;
  step: string;
  difficulty: string;
  includeAnswers: boolean;
  includeRecall: boolean;
  previousTitle?: string | null;
  previousKeyVocab: string[];
  variantSeed: number;
  schoolId: string | null;
}): Promise<{ title: string; content: string; sections: any[]; markScheme: string | null; keyVocab: string[] }> {
  const sendCue = sendCueFor(opts.sendNeed);
  const yg = opts.yearGroup || "secondary school";
  const recallLine = opts.includeRecall && opts.previousTitle
    ? `Include a 2-question 'Recall' starter at the top covering key vocabulary from last session's worksheet: ${opts.previousTitle}. Re-use these vocab words if possible: ${opts.previousKeyVocab.slice(0, 6).join(", ") || "(none)"}.`
    : "Start with a 2-question retrieval starter on prior knowledge for this topic.";
  const answersLine = opts.includeAnswers
    ? "After the student questions, include a '--- TEACHER ANSWER KEY ---' block with model answers, marks, and brief marking guidance."
    : "DO NOT include an answer key.";
  const sendLine = sendCue ? `SEND adaptation (${opts.sendNeed}): ${sendCue}` : "No SEND adaptation required.";
  const learnerSupportLine = opts.learnerSupportCue
    ? `Teacher-reviewed learner access guidance: ${opts.learnerSupportCue} Preserve the learning objective, current ladder step, question demand, mark allocation and accuracy. Do not name or diagnose the pupil; keep help in clearly labelled removable support boxes.`
    : "No additional learner-support profile guidance recorded.";

  const system = `You are an expert UK SEND educator creating high-quality differentiated worksheets for ${yg}. British English spelling. Clear, calculation-focused questions for maths. Specific, curriculum-aligned for all subjects.`;

  const user = `Create a one-page worksheet.

Year group: ${yg}
Subject: ${opts.subject}
Topic: ${opts.topic}
Specific skill (current step on the ladder): ${opts.step}
Difficulty: ${opts.difficulty}
Variant: #${opts.variantSeed} (this should be a FRESH set of questions — do not reuse prior phrasing).

${sendLine}
${learnerSupportLine}

STRUCTURE (follow EXACTLY, use these H2 headings):
## Learning Objective
One sentence LO tied to the specific skill above.

## Key Vocabulary
5 bullets — each is a word + a short, plain-English definition.

## Recall Starter
${recallLine}

## Worked Example
One fully solved example showing the method. Number the MAIN steps only (Step 1:, Step 2:) — do not number sub-lines.

## Questions (8 total)
Numbered 1–8. Mix straightforward, medium, and challenge items. For maths, every question must be calculation-based (no "explain why" prose). For other subjects, mix retrieval, inference, and application.

## Challenge
One short extension question.

${answersLine}

Return ONLY the markdown. No preamble. No "Look at the diagram" or "Study the diagram" phrases anywhere.`;

  const { content } = await callWithFallback(system, user, 3000, undefined, opts.schoolId || undefined);
  // Strip decorative diagram preambles even if the model ignores the instruction
  const cleaned = content
    .replace(/(Study|Look at|Examine|Observe)[^.\n]{0,60}diagram[^.\n]{0,120}\.?/gi, "")
    .trim();

  // Very rough split of student vs teacher block
  const sepIdx = cleaned.search(/-{2,}\s*TEACHER\s*ANSWER\s*KEY\s*-{0,}/i);
  const studentPart = sepIdx >= 0 ? cleaned.slice(0, sepIdx).trim() : cleaned;
  const teacherPart = sepIdx >= 0 ? cleaned.slice(sepIdx).replace(/^-{2,}\s*TEACHER\s*ANSWER\s*KEY\s*-{0,}\s*/i, "").trim() : null;

  // Extract Key Vocabulary bullets for next-session recall
  const vocabMatch = studentPart.match(/##\s*Key Vocabulary\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  const keyVocab = vocabMatch
    ? vocabMatch[1].split("\n").map(l => l.replace(/^[-*•]\s*/, "").split(/[:\-—]/)[0].trim()).filter(Boolean).slice(0, 10)
    : [];

  const title = `${opts.subject.charAt(0).toUpperCase() + opts.subject.slice(1)} — ${opts.topic}: ${opts.step}`;

  // Build coarse section layout so the existing WorksheetRenderer can display this nicely
  const sections = [
    { title, type: "worksheet", content: studentPart, teacherOnly: false },
  ];
  if (teacherPart) sections.push({ title: "Teacher Answer Key", type: "mark-scheme", content: teacherPart, teacherOnly: true } as any);

  return {
    title,
    content: studentPart,
    sections,
    markScheme: teacherPart,
    keyVocab,
  };
}

// ── Run a single config: generate + insert assignment ────────────────────────
export class SchedulerRunBusyError extends Error {
  constructor() {
    super("A worksheet generation is already in progress for this pupil and subject.");
    this.name = "SchedulerRunBusyError";
  }
}

export async function runSchedulerForConfig(cfg: any, _opts: { triggeredBy?: string } = {}): Promise<{ assignmentId: string; topic: string; title: string }> {
  // Claim the configuration before invoking AI. The background worker can read
  // a due row just before a teacher pauses it, and a manual run can arrive on
  // the same row; this conditional update is the authoritative duplicate guard.
  const automaticRun = !_opts.triggeredBy;
  const claimSql = automaticRun
    ? `UPDATE scheduler_configs
         SET generation_lock_until = NOW() + INTERVAL '2 minutes', updated_at = NOW()
       WHERE pupil_id = ? AND subject = ? AND enabled = 1
         AND (generation_lock_until IS NULL OR generation_lock_until <= NOW())`
    : `UPDATE scheduler_configs
         SET generation_lock_until = NOW() + INTERVAL '2 minutes', updated_at = NOW()
       WHERE pupil_id = ? AND subject = ?
         AND (generation_lock_until IS NULL OR generation_lock_until <= NOW())`;
  const claim = await db.prepare(claimSql).run(cfg.pupil_id, cfg.subject);
  if (claim.changes !== 1) throw new SchedulerRunBusyError();

  const pupil = await db.prepare("SELECT * FROM pupils WHERE id = ?").get(cfg.pupil_id) as any;
  if (!pupil) throw new Error("Pupil not found");

  const ladder = listSubjectTopics(cfg.subject);
  const topicIdx = Math.min(Math.max(cfg.progression_topic_index || 0, 0), ladder.length - 1);
  const topicEntry = ladder[topicIdx];
  const stepIdx = Math.min(Math.max(cfg.progression_step_index || 0, 0), topicEntry.steps.length - 1);
  const step = topicEntry.steps[stepIdx];

  const previousKeyVocab = (() => {
    try { return cfg.last_key_vocab ? JSON.parse(cfg.last_key_vocab) : []; } catch { return []; }
  })();

  try {
    const result = await generateSchedulerWorksheet({
      yearGroup: pupil.year_group,
      learnerSupportCue: buildSchedulerLearnerSupportCue(pupil.learner_support_profile_json),
      sendNeed: pupil.send_need,
      subject: cfg.subject,
      topic: topicEntry.topic,
      step,
      difficulty: cfg.difficulty,
      includeAnswers: cfg.include_answers === 1,
      includeRecall: cfg.include_recall === 1,
      previousTitle: cfg.last_worksheet_title,
      previousKeyVocab,
      variantSeed: Date.now() % 10_000,
      schoolId: cfg.school_id || pupil.school_id || null,
    });

    const assignmentId = uuidv4();
    await db.prepare(
      `INSERT INTO assignments
         (id, pupil_id, assigned_by, title, type, content, sections, metadata,
          mark_scheme, source, scheduler_subject, status, assigned_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'not-started', NOW())`
    ).run(
      assignmentId,
      cfg.pupil_id,
      cfg.created_by || null,
      result.title,
      "scheduler-worksheet",
      result.content,
      JSON.stringify(result.sections),
      JSON.stringify({
        subject: cfg.subject,
        topic: topicEntry.topic,
        step,
        yearGroup: pupil.year_group,
        sendNeed: pupil.send_need,
        learnerSupportProfileApplied: Boolean(buildSchedulerLearnerSupportCue(pupil.learner_support_profile_json)),
        difficulty: cfg.difficulty,
      }),
      result.markScheme,
      "scheduler",
      cfg.subject,
    );

    // Advance scheduler pointer so the NEXT generation explores a fresh variant
    // but stays on the same step until the pupil submits and the mark decides.
    const ms = cfg.frequency === "daily" ? 24 * 3600 * 1000
      : cfg.frequency === "weekly" ? 7 * 24 * 3600 * 1000
      : 14 * 24 * 3600 * 1000;
    await db.prepare(
      `UPDATE scheduler_configs
         SET next_fire_at = NOW() + (INTERVAL '1 millisecond' * ?),
             last_fired_at = NOW(),
             last_worksheet_title = ?,
             last_key_vocab = ?,
             last_error = NULL,
             retry_after = NULL,
             generation_lock_until = NULL,
             updated_at = NOW()
       WHERE pupil_id = ? AND subject = ?`
    ).run(ms, result.title, JSON.stringify(result.keyVocab), cfg.pupil_id, cfg.subject);

    return { assignmentId, topic: topicEntry.topic, title: result.title };
  } catch (err: any) {
    const msg = err?.message || String(err);
    await db.prepare(
      `UPDATE scheduler_configs
         SET last_error = ?, retry_after = NOW() + INTERVAL '10 minutes',
             generation_lock_until = NULL, updated_at = NOW()
       WHERE pupil_id = ? AND subject = ?`
    ).run(msg.slice(0, 400), cfg.pupil_id, cfg.subject);
    throw err;
  }
}

// ── Auto-mark a single submitted assignment ──────────────────────────────────
export async function markAssignmentNow(a: any): Promise<{ score: number; feedback: string }> {
  // Pull submission content (stored in assignments.content once pupil submits via existing flow)
  const submission = a.content || "";
  const markScheme = a.mark_scheme || "No mark scheme provided. Use professional UK teacher judgement.";

  const system = `You are an experienced, fair UK teacher marking a pupil's submitted worksheet. You provide a numeric percentage score AND specific, actionable feedback. You apply the given mark scheme strictly but fairly. British English. No marks for things outside the mark scheme.`;
  const user = `Mark the following pupil submission.

Pupil submission (raw):
"""
${submission.slice(0, 8000)}
"""

Mark scheme / teacher answer key:
"""
${markScheme.slice(0, 6000)}
"""

OUTPUT RULES — return strict JSON ONLY, no markdown fence, no commentary:
{
  "score": <integer 0–100 — overall percentage>,
  "perQuestion": [{"q": <number>, "awarded": <number>, "outOf": <number>, "note": "<brief marker note>"}],
  "strengths": ["...", "..."],
  "improvements": ["specific, actionable improvement 1", "specific, actionable improvement 2", "specific, actionable improvement 3"],
  "summary": "2–3 sentence overall comment to the pupil"
}`;

  const { content } = await callWithFallback(system, user, 2500);
  let parsed: any = null;
  try {
    const jsonText = content.replace(/```json\s*|\s*```/g, "").trim();
    parsed = JSON.parse(jsonText);
  } catch {
    // Try to salvage via regex
    const m = content.match(/"score"\s*:\s*(\d+)/);
    parsed = { score: m ? Number(m[1]) : 50, summary: content.slice(0, 400) };
  }

  const score = Math.max(0, Math.min(100, Math.round(Number(parsed?.score) || 0)));
  const feedbackText = [
    parsed?.summary ? `Summary: ${parsed.summary}` : "",
    parsed?.strengths?.length ? `What went well:\n- ${parsed.strengths.join("\n- ")}` : "",
    parsed?.improvements?.length ? `To improve:\n- ${parsed.improvements.join("\n- ")}` : "",
  ].filter(Boolean).join("\n\n");

  await db.prepare(
    `UPDATE assignments
       SET marked_score = ?, feedback = ?, marked_at = NOW(), auto_mark_accepted = 0, status = 'marked-pending-review'
     WHERE id = ?`
  ).run(score, feedbackText.slice(0, 4000), a.id);

  return { score, feedback: feedbackText };
}

// ── Advance / set-topic helpers ──────────────────────────────────────────────
export async function advanceScheduler(pupilId: string, subject: string) {
  const cfg = await db.prepare(
    "SELECT * FROM scheduler_configs WHERE pupil_id = ? AND subject = ?"
  ).get(pupilId, subject) as any;
  if (!cfg) return null;

  const ladder = listSubjectTopics(subject);
  const topicIdx = Math.min(Math.max(cfg.progression_topic_index || 0, 0), ladder.length - 1);
  const currentTopic = ladder[topicIdx];
  let nextStepIdx = (cfg.progression_step_index || 0) + 1;
  let nextTopicIdx = topicIdx;
  if (nextStepIdx >= currentTopic.steps.length) {
    nextTopicIdx = (topicIdx + 1) % ladder.length;
    nextStepIdx = 0;
  }

  await db.prepare(
    `UPDATE scheduler_configs
       SET progression_topic_index = ?, progression_step_index = ?,
           next_fire_at = NOW() + INTERVAL '5 seconds', updated_at = NOW()
     WHERE pupil_id = ? AND subject = ?`
  ).run(nextTopicIdx, nextStepIdx, pupilId, subject);

  return db.prepare(
    "SELECT * FROM scheduler_configs WHERE pupil_id = ? AND subject = ?"
  ).get(pupilId, subject) as any;
}

export async function setSchedulerTopic(pupilId: string, subject: string, opts: { progressionTopicIndex: number; progressionStepIndex: number }) {
  const ladder = listSubjectTopics(subject);
  const topicIdx = Math.min(Math.max(opts.progressionTopicIndex, 0), ladder.length - 1);
  const stepIdx = Math.min(Math.max(opts.progressionStepIndex, 0), (ladder[topicIdx]?.steps.length || 1) - 1);
  await db.prepare(
    `UPDATE scheduler_configs
       SET progression_topic_index = ?, progression_step_index = ?,
           next_fire_at = NOW() + INTERVAL '5 seconds', updated_at = NOW()
     WHERE pupil_id = ? AND subject = ?`
  ).run(topicIdx, stepIdx, pupilId, subject);
  return db.prepare(
    "SELECT * FROM scheduler_configs WHERE pupil_id = ? AND subject = ?"
  ).get(pupilId, subject) as any;
}

// ── Public list (used by the client to render topic picker) ──────────────────
export function publicSubjectLadders() {
  return Object.fromEntries(Object.entries(TOPIC_LADDERS).map(([k, v]) => [k, v.map(t => ({ topic: t.topic, steps: t.steps }))]));
}

// ── In-process worker tick ───────────────────────────────────────────────────
let WORKER_HANDLE: NodeJS.Timeout | null = null;
const TICK_MS = Number(process.env.SCHEDULER_TICK_MS) > 0 ? Number(process.env.SCHEDULER_TICK_MS) : 5 * 60 * 1000;

async function tick() {
  const dueConfigs = await db.prepare(
    `SELECT * FROM scheduler_configs
      WHERE enabled = 1
        AND next_fire_at IS NOT NULL
        AND next_fire_at <= NOW()
        AND (retry_after IS NULL OR retry_after <= NOW())
      ORDER BY next_fire_at ASC
      LIMIT 25`
  ).all() as any[];
  for (const cfg of dueConfigs) {
    try { await runSchedulerForConfig(cfg); }
    catch (err: any) {
      // A second worker/manual request losing the short claim is expected and
      // not an operational failure. Other errors retain their retry state.
      if (!(err instanceof SchedulerRunBusyError)) {
        console.error(`[scheduler] run failed for ${cfg.pupil_id}/${cfg.subject}:`, err?.message || err);
      }
    }
  }

  // Auto-mark submitted scheduler assignments not yet marked
  const dueMarks = await db.prepare(
    `SELECT * FROM assignments
      WHERE source = 'scheduler'
        AND status = 'submitted'
        AND marked_at IS NULL
      ORDER BY submitted_at ASC
      LIMIT 25`
  ).all() as any[];
  for (const a of dueMarks) {
    try { await markAssignmentNow(a); }
    catch (err: any) { console.error(`[scheduler] mark failed for ${a.id}:`, err?.message || err); }
  }
}

export function startSchedulerWorker() {
  if (WORKER_HANDLE) return;
  console.log(`[scheduler] worker starting (tick every ${Math.round(TICK_MS / 1000)}s)`);
  // First tick after a short delay so the server finishes boot
  setTimeout(() => { tick().catch(e => console.error("[scheduler] first tick error:", e)); }, 20_000);
  WORKER_HANDLE = setInterval(() => {
    tick().catch(err => console.error("[scheduler] tick error:", err));
  }, TICK_MS);
}

export function stopSchedulerWorker() {
  if (WORKER_HANDLE) {
    clearInterval(WORKER_HANDLE);
    WORKER_HANDLE = null;
  }
}
