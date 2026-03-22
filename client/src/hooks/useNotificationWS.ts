/**
 * useNotificationWS
 * Establishes an authenticated WebSocket connection to /api/ws and manages
 * real-time notification state. Returns the notification list and helpers to
 * dismiss individual or all notifications.
 *
 * Protocol (server → client):
 *   { type: "init",         notifications: RealNotif[] }  — sent on connect
 *   { type: "notification", notification: RealNotif }     — new push
 *   { type: "pong" }                                       — keepalive reply
 *
 * Protocol (client → server):
 *   { type: "mark_read",     notificationId: string }
 *   { type: "mark_all_read" }
 *   { type: "ping" }
 */
import { useEffect, useRef, useState, useCallback } from "react";

export interface RealNotif {
  id: string;
  type: "message" | "assignment" | "worksheet_shared" | "quiz_result" | "safeguarding" | "system";
  title: string;
  body: string;
  link?: string;
  read: boolean;
  created_at: string;
}

interface UseNotificationWSOptions {
  /** JWT token for authenticating the WebSocket connection */
  token: string | undefined | null;
  /** Maximum notifications to keep in memory (default: 50) */
  maxNotifs?: number;
}

interface UseNotificationWSResult {
  notifications: RealNotif[];
  unreadCount: number;
  dismiss: (id: string) => void;
  markAllRead: () => void;
  isConnected: boolean;
}

export function useNotificationWS({
  token,
  maxNotifs = 50,
}: UseNotificationWSOptions): UseNotificationWSResult {
  const [notifications, setNotifications] = useState<RealNotif[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/ws?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      retryCount.current = 0;
      // Keepalive ping every 25 seconds (Railway idles WS at 30s)
      if (pingRef.current) clearInterval(pingRef.current);
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25_000);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string);

        if (msg.type === "init" && Array.isArray(msg.notifications)) {
          // Server sent initial unread list
          setNotifications(msg.notifications.slice(0, maxNotifs));
        } else if (msg.type === "notifications" && Array.isArray(msg.data)) {
          // Alternative server format (both handled for resilience)
          setNotifications(msg.data.slice(0, maxNotifs));
        } else if (msg.type === "notification" && msg.notification) {
          // Single new push — prepend, cap at maxNotifs
          setNotifications(prev =>
            [msg.notification, ...prev.filter(n => n.id !== msg.notification.id)].slice(0, maxNotifs)
          );
        } else if (msg.type === "notification" && msg.data) {
          // Alternative server format
          setNotifications(prev =>
            [msg.data, ...prev.filter((n: RealNotif) => n.id !== msg.data.id)].slice(0, maxNotifs)
          );
        }
        // Ignore "pong" — just a keepalive ack
      } catch {
        // Malformed JSON — ignore
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (pingRef.current) clearInterval(pingRef.current);
      // Exponential back-off reconnect (max 30 s)
      const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
      retryCount.current += 1;
      retryRef.current = setTimeout(() => connect(), delay);
    };
  }, [token, maxNotifs]);

  useEffect(() => {
    connect();
    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "mark_read", notificationId: id }));
    } else {
      // Fallback REST call
      fetch(`/api/messages/notifications/${id}/read`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {});
    }
  }, [token]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "mark_all_read" }));
    } else {
      fetch("/api/messages/notifications/read-all", {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).catch(() => {});
    }
  }, [token]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, dismiss, markAllRead, isConnected };
}
