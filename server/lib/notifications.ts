/**
 * Real-time Notification System
 * Uses WebSocket (ws) to push notifications to connected clients.
 * Each authenticated user gets their own channel keyed by userId.
 */
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middleware/auth.js";
import db from "../db/index.js";

export interface Notification {
  id: string;
  type: "message" | "assignment" | "worksheet_shared" | "quiz_result" | "safeguarding" | "system";
  title: string;
  body: string;
  link?: string;
  createdAt: string;
  read: boolean;
  metadata?: Record<string, any>;
}

// In-memory map: userId → Set of connected WebSocket clients
const connections = new Map<string, Set<WebSocket>>();

export function initWebSocketServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: "/api/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    // Extract token from query string: /api/ws?token=<jwt>
    const url = new URL(req.url || "", "http://localhost");
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(4001, "Unauthorised: no token");
      return;
    }

    let userId: string;
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      userId = payload.userId || payload.sub || payload.id;
      if (!userId) throw new Error("No userId in token");
    } catch {
      ws.close(4001, "Unauthorised: invalid token");
      return;
    }

    // Register connection
    if (!connections.has(userId)) {
      connections.set(userId, new Set());
    }
    connections.get(userId)!.add(ws);

    // Send unread notifications on connect — "init" type for client compatibility
    const unread = getUnreadNotifications(userId);
    ws.send(JSON.stringify({ type: "init", notifications: unread }));

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "mark_read" && msg.id) {
          markNotificationRead(userId, msg.id);
        } else if (msg.type === "mark_all_read") {
          markAllNotificationsRead(userId);
        } else if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      connections.get(userId)?.delete(ws);
      if (connections.get(userId)?.size === 0) {
        connections.delete(userId);
      }
    });

    ws.on("error", () => {
      connections.get(userId)?.delete(ws);
    });
  });

  console.log("🔔 WebSocket notification server initialised at /api/ws");
  return wss;
}

// ── Push a notification to a specific user ────────────────────────────────────
export function pushNotification(userId: string, notification: Omit<Notification, "id" | "createdAt" | "read">): void {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const full: Notification = {
    ...notification,
    id,
    createdAt: new Date().toISOString(),
    read: false,
  };

  // Persist to DB
  try {
    db.prepare(`
      INSERT OR IGNORE INTO notifications (id, user_id, type, title, body, link, metadata, created_at, read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      full.id,
      userId,
      full.type,
      full.title,
      full.body,
      full.link || null,
      full.metadata ? JSON.stringify(full.metadata) : null,
      full.createdAt
    );
  } catch {
    // Table may not exist yet — gracefully degrade
  }

  // Push to connected clients
  const userConnections = connections.get(userId);
  if (userConnections && userConnections.size > 0) {
    const payload = JSON.stringify({ type: "notification", notification: full });
    for (const ws of userConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}

// ── Push a notification to all users in a school ─────────────────────────────
export function pushSchoolNotification(schoolId: string, notification: Omit<Notification, "id" | "createdAt" | "read">): void {
  try {
    const users = db.prepare("SELECT id FROM users WHERE school_id = ?").all(schoolId) as any[];
    for (const user of users) {
      pushNotification(user.id, notification);
    }
  } catch {
    // gracefully degrade
  }
}

// ── Get unread notifications for a user ──────────────────────────────────────
export function getUnreadNotifications(userId: string): Notification[] {
  try {
    const rows = db.prepare(`
      SELECT * FROM notifications WHERE user_id = ? AND read = 0
      ORDER BY created_at DESC LIMIT 50
    `).all(userId) as any[];

    return rows.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      link: r.link,
      createdAt: r.created_at,
      read: r.read === 1,
      metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
    }));
  } catch {
    return [];
  }
}

// ── Mark a notification as read ───────────────────────────────────────────────
export function markNotificationRead(userId: string, notificationId: string): void {
  try {
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(notificationId, userId);
  } catch {
    // gracefully degrade
  }
}

// ── Mark all notifications as read ───────────────────────────────────────────
export function markAllNotificationsRead(userId: string): void {
  try {
    db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(userId);
  } catch {
    // gracefully degrade
  }
}
