/**
 * Scheduler API — autonomous daily worksheet generation per pupil + subject.
 *
 * A pupil can have multiple scheduler_configs (one per subject). Each config
 * follows a skill ladder and auto-generates a worksheet at every fire-time.
 * When the pupil submits their assignment, the worker auto-marks it. The
 * teacher can accept the AI mark or override it.
 *
 * Pass gate: score >= pass_threshold (default 70%) → advance to next topic.
 *            score <  pass_threshold → regenerate a fresh worksheet on the
 *            same topic with different questions.
 *
 * SEND adaptation is pulled from the pupil's profile automatically (send_need
 * column) at every generation — no duplication of settings.
 *
 * Routes (all require teacher auth):
 *   GET    /                         — list configs for school
 *   GET    /:pupilId                 — configs for one pupil (all subjects)
 *   PUT    /:pupilId/:subject        — create or update
 *   DELETE /:pupilId/:subject        — disable + remove
 *   POST   /:pupilId/:subject/run-now — manual trigger
 *   POST   /:pupilId/:subject/advance — manual advance (next topic)
 *   POST   /:pupilId/:subject/set-topic — jump to a specific topic
 *   POST   /assignments/:assignmentId/accept-mark — accept AI mark
 *   POST   /assignments/:assignmentId/override-mark — teacher overrides mark
 */
import { Router, Request, Response } from "express";
import db from "../db/index.js";
import { requireAuth, auditLog } from "../middleware/auth.js";
import { runSchedulerForConfig, markAssignmentNow, advanceScheduler, setSchedulerTopic, publicSubjectLadders, SchedulerRunBusyError } from "../lib/schedulerWorker.js";

const router = Router();

// ── Helpers ──────────────────────────────────────────────────────────────────
function rowToConfig(r: any) {
  if (!r) return null;
  let lastKeyVocab: any[] = [];
  try { lastKeyVocab = r.last_key_vocab ? JSON.parse(r.last_key_vocab) : []; } catch {}
  return {
    pupilId: r.pupil_id,
    subject: r.subject,
    schoolId: r.school_id,
    enabled: r.enabled === 1,
    frequency: r.frequency,
    difficulty: r.difficulty,
    includeAnswers: r.include_answers === 1,
    includeRecall: r.include_recall === 1,
    nextFireAt: r.next_fire_at,
    lastFiredAt: r.last_fired_at,
    lastWorksheetTitle: r.last_worksheet_title,
    lastKeyVocab,
    topicIndex: r.topic_index,
    progressionTopicIndex: r.progression_topic_index,
    progressionStepIndex: r.progression_step_index,
    lastError: r.last_error,
    retryAfter: r.retry_after,
    passThreshold: r.pass_threshold,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function assertPupilBelongsToSchool(pupilId: string, schoolId: string) {
  const pupil = await db.prepare("SELECT * FROM pupils WHERE id = ? AND school_id = ?").get(pupilId, schoolId) as any;
  return pupil;
}

// ── GET /api/scheduler — list all configs for the school ────────────────────
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  if (!schoolId) return res.status(400).json({ error: "No school" });
  const rows = await db.prepare(
    `SELECT sc.* FROM scheduler_configs sc
     JOIN pupils p ON p.id = sc.pupil_id
     WHERE p.school_id = ?
     ORDER BY sc.updated_at DESC`
  ).all(schoolId) as any[];
  res.json(rows.map(rowToConfig));
});

// ── GET /api/scheduler/ladders — canonical worker curriculum progression ───
// This must precede /:pupilId so the client displays the same sequence that
// the autonomous worker actually uses to generate future work.
router.get("/ladders", requireAuth, (_req: Request, res: Response) => {
  res.json(publicSubjectLadders());
});

// ── GET /api/scheduler/:pupilId — configs for one pupil across subjects ─────
router.get("/:pupilId", requireAuth, async (req: Request, res: Response) => {
  const pupil = await assertPupilBelongsToSchool(req.params.pupilId, req.user!.schoolId!);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const rows = await db.prepare(
    `SELECT * FROM scheduler_configs WHERE pupil_id = ? ORDER BY subject`
  ).all(req.params.pupilId) as any[];
  res.json(rows.map(rowToConfig));
});

// ── PUT /api/scheduler/:pupilId/:subject — create or update ─────────────────
router.put("/:pupilId/:subject", requireAuth, async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId!;
  const pupil = await assertPupilBelongsToSchool(req.params.pupilId, schoolId);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });

  const subject = (req.params.subject || "").toLowerCase().slice(0, 60);
  if (!subject) return res.status(400).json({ error: "subject required" });

  const {
    enabled = true,
    frequency = "daily",
    difficulty = "mixed",
    includeAnswers = true,
    includeRecall = true,
    passThreshold = 70,
    topicIndex = 0,
    progressionTopicIndex = 0,
    progressionStepIndex = 0,
  } = req.body || {};

  const validFrequency = ["daily", "weekly", "biweekly"].includes(frequency) ? frequency : "daily";
  const validDifficulty = ["foundation", "mixed", "higher"].includes(difficulty) ? difficulty : "mixed";
  const clampedThreshold = Math.max(1, Math.min(100, Number(passThreshold) || 70));

  // Next fire: fire immediately on first enable; otherwise at start of next period.
  const ms = validFrequency === "daily" ? 24 * 3600 * 1000
    : validFrequency === "weekly" ? 7 * 24 * 3600 * 1000
    : 14 * 24 * 3600 * 1000;
  const existing = await db.prepare(
    "SELECT * FROM scheduler_configs WHERE pupil_id = ? AND subject = ?"
  ).get(req.params.pupilId, subject) as any;

  const nextFireAt = enabled
    ? (existing && existing.enabled === 1 && existing.next_fire_at
        ? existing.next_fire_at
        : new Date(Date.now() + 5_000).toISOString())  // fire in 5s on first enable
    : null;

  await db.prepare(
    `INSERT INTO scheduler_configs
       (pupil_id, subject, school_id, enabled, frequency, difficulty,
        include_answers, include_recall, next_fire_at, topic_index,
        progression_topic_index, progression_step_index, pass_threshold,
        created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
     ON CONFLICT (pupil_id, subject) DO UPDATE SET
       school_id = EXCLUDED.school_id,
       enabled = EXCLUDED.enabled,
       frequency = EXCLUDED.frequency,
       difficulty = EXCLUDED.difficulty,
       include_answers = EXCLUDED.include_answers,
       include_recall = EXCLUDED.include_recall,
       next_fire_at = EXCLUDED.next_fire_at,
       pass_threshold = EXCLUDED.pass_threshold,
       topic_index = COALESCE(scheduler_configs.topic_index, EXCLUDED.topic_index),
       progression_topic_index = COALESCE(scheduler_configs.progression_topic_index, EXCLUDED.progression_topic_index),
       progression_step_index = COALESCE(scheduler_configs.progression_step_index, EXCLUDED.progression_step_index),
       updated_at = NOW()`
  ).run(
    req.params.pupilId,
    subject,
    schoolId,
    enabled ? 1 : 0,
    validFrequency,
    validDifficulty,
    includeAnswers ? 1 : 0,
    includeRecall ? 1 : 0,
    nextFireAt,
    topicIndex,
    progressionTopicIndex,
    progressionStepIndex,
    clampedThreshold,
    req.user!.id,
  );

  // Touch ms to keep the compiler happy about unused var in this scope
  void ms;

  auditLog(req.user!.id, schoolId, "scheduler.upsert", "scheduler_config", `${req.params.pupilId}:${subject}`,
    { enabled, frequency: validFrequency, difficulty: validDifficulty, passThreshold: clampedThreshold }, req.ip);

  const row = await db.prepare(
    "SELECT * FROM scheduler_configs WHERE pupil_id = ? AND subject = ?"
  ).get(req.params.pupilId, subject) as any;
  res.json(rowToConfig(row));
});

// ── DELETE /api/scheduler/:pupilId/:subject ─────────────────────────────────
router.delete("/:pupilId/:subject", requireAuth, async (req: Request, res: Response) => {
  const pupil = await assertPupilBelongsToSchool(req.params.pupilId, req.user!.schoolId!);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  await db.prepare(
    "DELETE FROM scheduler_configs WHERE pupil_id = ? AND subject = ?"
  ).run(req.params.pupilId, req.params.subject.toLowerCase());
  auditLog(req.user!.id, req.user!.schoolId, "scheduler.delete", "scheduler_config",
    `${req.params.pupilId}:${req.params.subject}`, {}, req.ip);
  res.json({ success: true });
});

// ── POST /api/scheduler/:pupilId/:subject/run-now ────────────────────────────
router.post("/:pupilId/:subject/run-now", requireAuth, async (req: Request, res: Response) => {
  const pupil = await assertPupilBelongsToSchool(req.params.pupilId, req.user!.schoolId!);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const subject = req.params.subject.toLowerCase();
  const cfg = await db.prepare(
    "SELECT * FROM scheduler_configs WHERE pupil_id = ? AND subject = ?"
  ).get(req.params.pupilId, subject) as any;
  if (!cfg) return res.status(404).json({ error: "Scheduler config not found" });

  try {
    const result = await runSchedulerForConfig(cfg, { triggeredBy: req.user!.id });
    res.json({ ok: true, assignmentId: result.assignmentId, topic: result.topic, worksheetTitle: result.title });
  } catch (err: any) {
    if (err instanceof SchedulerRunBusyError) {
      return res.status(409).json({ error: err.message, code: "generation-in-progress" });
    }
    console.error("scheduler run-now failed:", err);
    res.status(500).json({ error: err?.message || "Generation failed" });
  }
});

// ── POST /api/scheduler/:pupilId/:subject/advance ────────────────────────────
router.post("/:pupilId/:subject/advance", requireAuth, async (req: Request, res: Response) => {
  const pupil = await assertPupilBelongsToSchool(req.params.pupilId, req.user!.schoolId!);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const subject = req.params.subject.toLowerCase();
  const next = await advanceScheduler(req.params.pupilId, subject);
  if (!next) return res.status(404).json({ error: "Scheduler config not found" });
  auditLog(req.user!.id, req.user!.schoolId, "scheduler.advance", "scheduler_config", `${req.params.pupilId}:${subject}`,
    { nextTopicIndex: next.progression_topic_index, nextStepIndex: next.progression_step_index }, req.ip);
  res.json(rowToConfig(next));
});

// ── POST /api/scheduler/:pupilId/:subject/set-topic ──────────────────────────
// body: { progressionTopicIndex: number, progressionStepIndex: number }
router.post("/:pupilId/:subject/set-topic", requireAuth, async (req: Request, res: Response) => {
  const pupil = await assertPupilBelongsToSchool(req.params.pupilId, req.user!.schoolId!);
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });
  const subject = req.params.subject.toLowerCase();
  const { progressionTopicIndex, progressionStepIndex = 0 } = req.body || {};
  if (typeof progressionTopicIndex !== "number" || progressionTopicIndex < 0) {
    return res.status(400).json({ error: "progressionTopicIndex must be a non-negative number" });
  }
  const next = await setSchedulerTopic(req.params.pupilId, subject, {
    progressionTopicIndex,
    progressionStepIndex: Math.max(0, Number(progressionStepIndex) || 0),
  });
  if (!next) return res.status(404).json({ error: "Scheduler config not found" });
  auditLog(req.user!.id, req.user!.schoolId, "scheduler.set-topic", "scheduler_config",
    `${req.params.pupilId}:${subject}`, { progressionTopicIndex, progressionStepIndex }, req.ip);
  res.json(rowToConfig(next));
});

// ── POST /api/scheduler/assignments/:assignmentId/mark-now ───────────────────
// Allows teacher to manually trigger auto-mark for a submitted assignment.
router.post("/assignments/:assignmentId/mark-now", requireAuth, async (req: Request, res: Response) => {
  const a = await db.prepare("SELECT * FROM assignments WHERE id = ?").get(req.params.assignmentId) as any;
  if (!a) return res.status(404).json({ error: "Assignment not found" });
  const pupil = await assertPupilBelongsToSchool(a.pupil_id, req.user!.schoolId!);
  if (!pupil) return res.status(403).json({ error: "Access denied" });
  try {
    const result = await markAssignmentNow(a);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Mark failed" });
  }
});

// ── POST /api/scheduler/assignments/:assignmentId/accept-mark ────────────────
// Teacher accepts the AI-generated mark as-is.
router.post("/assignments/:assignmentId/accept-mark", requireAuth, async (req: Request, res: Response) => {
  const a = await db.prepare("SELECT * FROM assignments WHERE id = ?").get(req.params.assignmentId) as any;
  if (!a) return res.status(404).json({ error: "Assignment not found" });
  const pupil = await assertPupilBelongsToSchool(a.pupil_id, req.user!.schoolId!);
  if (!pupil) return res.status(403).json({ error: "Access denied" });

  await db.prepare(
    `UPDATE assignments SET auto_mark_accepted = 1, status = 'completed', marked_at = NOW() WHERE id = ?`
  ).run(req.params.assignmentId);
  auditLog(req.user!.id, req.user!.schoolId, "scheduler.accept-mark", "assignment", req.params.assignmentId,
    { score: a.marked_score }, req.ip);

  // Advance on pass, regenerate on fail
  if (a.scheduler_subject) {
    const cfg = await db.prepare(
      "SELECT * FROM scheduler_configs WHERE pupil_id = ? AND subject = ?"
    ).get(a.pupil_id, a.scheduler_subject) as any;
    if (cfg) {
      const threshold = cfg.pass_threshold ?? 70;
      const score = a.marked_score ?? 0;
      if (score >= threshold) {
        await advanceScheduler(a.pupil_id, a.scheduler_subject);
      } else {
        // Regenerate same topic immediately (the worker tick will pick up next_fire_at).
        await db.prepare(
          `UPDATE scheduler_configs SET next_fire_at = NOW() + INTERVAL '5 seconds', updated_at = NOW()
           WHERE pupil_id = ? AND subject = ?`
        ).run(a.pupil_id, a.scheduler_subject);
      }
    }
  }
  res.json({ ok: true });
});

// ── POST /api/scheduler/assignments/:assignmentId/override-mark ──────────────
// Teacher overrides the AI mark. Body: { score, feedback? }
router.post("/assignments/:assignmentId/override-mark", requireAuth, async (req: Request, res: Response) => {
  const a = await db.prepare("SELECT * FROM assignments WHERE id = ?").get(req.params.assignmentId) as any;
  if (!a) return res.status(404).json({ error: "Assignment not found" });
  const pupil = await assertPupilBelongsToSchool(a.pupil_id, req.user!.schoolId!);
  if (!pupil) return res.status(403).json({ error: "Access denied" });

  const score = Math.max(0, Math.min(100, Number(req.body?.score) || 0));
  const feedback = typeof req.body?.feedback === "string" ? req.body.feedback.slice(0, 4000) : null;

  await db.prepare(
    `UPDATE assignments
     SET marked_score = ?, feedback = COALESCE(?, feedback),
         auto_mark_accepted = 0, status = 'completed', marked_at = NOW()
     WHERE id = ?`
  ).run(score, feedback, req.params.assignmentId);

  auditLog(req.user!.id, req.user!.schoolId, "scheduler.override-mark", "assignment", req.params.assignmentId,
    { score, previousScore: a.marked_score }, req.ip);

  // Apply advance/regenerate based on override
  if (a.scheduler_subject) {
    const cfg = await db.prepare(
      "SELECT * FROM scheduler_configs WHERE pupil_id = ? AND subject = ?"
    ).get(a.pupil_id, a.scheduler_subject) as any;
    if (cfg) {
      const threshold = cfg.pass_threshold ?? 70;
      if (score >= threshold) {
        await advanceScheduler(a.pupil_id, a.scheduler_subject);
      } else {
        await db.prepare(
          `UPDATE scheduler_configs SET next_fire_at = NOW() + INTERVAL '5 seconds', updated_at = NOW()
           WHERE pupil_id = ? AND subject = ?`
        ).run(a.pupil_id, a.scheduler_subject);
      }
    }
  }
  res.json({ ok: true });
});

export default router;
