/**
 * Quiz WebSocket Handler
 *
 * Manages real-time WebSocket connections for QuizBlast game sessions.
 * Players connect at /ws/quiz?room=<code>&player=<playerId>
 * The server broadcasts game events to all connected players in a room.
 */
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { Server } from "http";

export type QuizWsMessageType =
  | "question_reveal"
  | "answer_result"
  | "leaderboard_update"
  | "game_end"
  | "room_state"
  | "pong"
  | "error";

export interface QuizWsMessage {
  type: QuizWsMessageType;
  data?: any;
}

interface ConnectedPlayer {
  ws: WebSocket;
  playerId: string;
  roomCode: string;
}

// Map: roomCode -> Map of playerId -> ConnectedPlayer
const roomConnections = new Map<string, Map<string, ConnectedPlayer>>();

let wss: WebSocketServer | null = null;

export function initQuizWebSocket(httpServer: Server): WebSocketServer {
  wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || "", "http://localhost");
    const roomCode = url.searchParams.get("room");
    const playerId = url.searchParams.get("player");

    if (!roomCode || !playerId) {
      ws.close(4001, "Missing room or player parameter");
      return;
    }

    // Register the connection
    if (!roomConnections.has(roomCode)) {
      roomConnections.set(roomCode, new Map());
    }
    const roomMap = roomConnections.get(roomCode)!;

    // Close any existing connection for this player (reconnection scenario)
    const existing = roomMap.get(playerId);
    if (existing && existing.ws.readyState === WebSocket.OPEN) {
      existing.ws.close(4000, "Replaced by new connection");
    }

    const player: ConnectedPlayer = { ws, playerId, roomCode };
    roomMap.set(playerId, player);

    // Send connection acknowledgment
    sendToClient(ws, { type: "room_state", data: { connected: true, roomCode, playerId } });

    // Handle incoming messages from the player
    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "ping") {
          sendToClient(ws, { type: "pong" });
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on("close", () => {
      const room = roomConnections.get(roomCode);
      if (room) {
        room.delete(playerId);
        if (room.size === 0) {
          roomConnections.delete(roomCode);
        }
      }
    });

    ws.on("error", () => {
      const room = roomConnections.get(roomCode);
      if (room) {
        room.delete(playerId);
        if (room.size === 0) {
          roomConnections.delete(roomCode);
        }
      }
    });
  });

  console.log("🎮 Quiz WebSocket server initialised at /ws/quiz");
  return wss;
}

/**
 * Handle HTTP upgrade requests for the /ws/quiz path.
 * Call this from the main server upgrade handler.
 */
export function handleQuizUpgrade(req: IncomingMessage, socket: any, head: Buffer): void {
  if (!wss) return;
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss!.emit("connection", ws, req);
  });
}

/**
 * Check if a given URL path should be handled by the quiz WebSocket.
 */
export function isQuizWsPath(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith("/ws/quiz");
}

// ── Broadcasting functions ────────────────────────────────────────────────────

/**
 * Broadcast a message to all connected players in a room.
 */
export function broadcastToRoom(roomCode: string, message: QuizWsMessage, excludePlayerId?: string): void {
  const room = roomConnections.get(roomCode);
  if (!room) return;

  const payload = JSON.stringify(message);
  for (const [pid, player] of room) {
    if (excludePlayerId && pid === excludePlayerId) continue;
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(payload);
    }
  }
}

/**
 * Send a message to a specific player in a room.
 */
export function sendToPlayer(roomCode: string, playerId: string, message: QuizWsMessage): void {
  const room = roomConnections.get(roomCode);
  if (!room) return;

  const player = room.get(playerId);
  if (player && player.ws.readyState === WebSocket.OPEN) {
    player.ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast a question reveal to all players in a room.
 */
export function broadcastQuestionReveal(roomCode: string, questionData: {
  questionIndex: number;
  totalQuestions: number;
  question: string;
  options: string[];
  timeLimit: number;
  questionStartedAt: number;
}): void {
  broadcastToRoom(roomCode, {
    type: "question_reveal",
    data: questionData,
  });
}

/**
 * Send answer result to the specific player who answered.
 */
export function sendAnswerResult(roomCode: string, playerId: string, result: {
  correct: boolean;
  score: number;
  streak: number;
}): void {
  sendToPlayer(roomCode, playerId, {
    type: "answer_result",
    data: result,
  });
}

/**
 * Broadcast leaderboard update to all players in a room.
 */
export function broadcastLeaderboard(roomCode: string, leaderboard: Array<{
  id: string;
  name: string;
  score: number;
  streak: number;
}>): void {
  broadcastToRoom(roomCode, {
    type: "leaderboard_update",
    data: { leaderboard },
  });
}

/**
 * Broadcast game end to all players in a room.
 */
export function broadcastGameEnd(roomCode: string, finalLeaderboard: Array<{
  id: string;
  name: string;
  score: number;
}>): void {
  broadcastToRoom(roomCode, {
    type: "game_end",
    data: { leaderboard: finalLeaderboard },
  });
  // Clean up room connections after a short delay
  setTimeout(() => {
    const room = roomConnections.get(roomCode);
    if (room) {
      for (const player of room.values()) {
        if (player.ws.readyState === WebSocket.OPEN) {
          player.ws.close(1000, "Game ended");
        }
      }
      roomConnections.delete(roomCode);
    }
  }, 5000);
}

function sendToClient(ws: WebSocket, message: QuizWsMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
