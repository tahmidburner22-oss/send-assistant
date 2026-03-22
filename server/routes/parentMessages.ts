/**
 * Parent Messages Route — Two-way parent-teacher communication
 * Teachers can send messages to parents; parents can reply.
 * Messages are threaded per pupil.
 */
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { pushNotification } from "../lib/notifications.js";

const router = Router();

// ── GET /api/messages/:pupilId — get all messages for a pupil ─────────────────
router.get("/:pupilId", requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const { pupilId } = req.params;

  // Verify access: teacher must own the pupil, or it's a parent viewing their child
  const pupil = db.prepare("SELECT * FROM pupils WHERE id = ?").get(pupilId) as any;
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });

  const isTeacher = pupil.school_id === user.schoolId;
  const isParent = pupil.parent_access_code && req.headers["x-parent-code"] === pupil.parent_access_code;

  if (!isTeacher && !isParent) {
    return res.status(403).json({ error: "Access denied" });
  }

  const messages = db.prepare(`
    SELECT * FROM parent_messages
    WHERE pupil_id = ?
    ORDER BY created_at ASC
  `).all(pupilId) as any[];

  res.json(messages.map(m => ({
    id: m.id,
    pupilId: m.pupil_id,
    senderType: m.sender_type,
    senderName: m.sender_name,
    body: m.body,
    createdAt: m.created_at,
    read: m.read === 1,
  })));
});

// ── POST /api/messages/:pupilId — send a message ─────────────────────────────
router.post("/:pupilId", requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const { pupilId } = req.params;
  const { body, senderType } = req.body;

  if (!body?.trim()) return res.status(400).json({ error: "Message body is required" });

  const pupil = db.prepare("SELECT * FROM pupils WHERE id = ?").get(pupilId) as any;
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });

  const isTeacher = pupil.school_id === user.schoolId;
  const isParent = pupil.parent_access_code && req.headers["x-parent-code"] === pupil.parent_access_code;

  if (!isTeacher && !isParent) {
    return res.status(403).json({ error: "Access denied" });
  }

  const actualSenderType = isTeacher ? "teacher" : "parent";
  const senderName = isTeacher ? (user.displayName || "Teacher") : "Parent/Carer";

  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO parent_messages (id, pupil_id, sender_type, sender_name, body, created_at, read)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(id, pupilId, actualSenderType, senderName, body.trim(), now);

  const message = {
    id,
    pupilId,
    senderType: actualSenderType,
    senderName,
    body: body.trim(),
    createdAt: now,
    read: false,
  };

  // Push real-time notification
  if (actualSenderType === "parent") {
    // Notify the teacher who owns this pupil
    const teacher = db.prepare("SELECT id FROM users WHERE school_id = ? AND role IN ('teacher', 'senco', 'school_admin') LIMIT 1").get(pupil.school_id) as any;
    if (teacher) {
      pushNotification(teacher.id, {
        type: "message",
        title: `New message from ${senderName}`,
        body: `Re: ${pupil.name} — ${body.trim().slice(0, 80)}${body.trim().length > 80 ? "…" : ""}`,
        link: `/pupils/${pupilId}?tab=messages`,
        metadata: { pupilId, messageId: id },
      });
    }
  } else {
    // Notify parent (via polling — parents don't have WS connections)
    // Mark any unread parent messages as notified
  }

  res.status(201).json(message);
});

// ── PATCH /api/messages/:pupilId/:messageId/read — mark message as read ───────
router.patch("/:pupilId/:messageId/read", requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const { pupilId, messageId } = req.params;

  const pupil = db.prepare("SELECT * FROM pupils WHERE id = ?").get(pupilId) as any;
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });

  const isTeacher = pupil.school_id === user.schoolId;
  const isParent = pupil.parent_access_code && req.headers["x-parent-code"] === pupil.parent_access_code;

  if (!isTeacher && !isParent) {
    return res.status(403).json({ error: "Access denied" });
  }

  db.prepare("UPDATE parent_messages SET read = 1 WHERE id = ? AND pupil_id = ?").run(messageId, pupilId);
  res.json({ success: true });
});

// ── GET /api/messages/:pupilId/unread-count — unread count for parent portal ──
router.get("/:pupilId/unread-count", (req: Request, res: Response) => {
  const { pupilId } = req.params;
  const parentCode = req.headers["x-parent-code"] as string;

  const pupil = db.prepare("SELECT * FROM pupils WHERE id = ?").get(pupilId) as any;
  if (!pupil) return res.status(404).json({ error: "Pupil not found" });

  if (pupil.parent_access_code && parentCode !== pupil.parent_access_code) {
    return res.status(403).json({ error: "Access denied" });
  }

  const result = db.prepare(`
    SELECT COUNT(*) as count FROM parent_messages
    WHERE pupil_id = ? AND sender_type = 'teacher' AND read = 0
  `).get(pupilId) as any;

  res.json({ count: result.count });
});

// ── GET /api/messages/notifications — get unread notifications for logged-in user ──
router.get("/", requireAuth, (req: Request, res: Response) => {
  const user = req.user!;

  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(user.id) as any[];

  res.json(notifications.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    createdAt: n.created_at,
    read: n.read === 1,
    metadata: n.metadata ? JSON.parse(n.metadata) : undefined,
  })));
});

// ── PATCH /api/messages/notifications/:id/read — mark notification as read ────
router.patch("/notifications/:id/read", requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(id, user.id);
  res.json({ success: true });
});

// ── PATCH /api/messages/notifications/read-all — mark all as read ─────────────
router.patch("/notifications/read-all", requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(user.id);
  res.json({ success: true });
});

export default router;
