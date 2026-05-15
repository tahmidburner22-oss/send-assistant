/**
 * offline-queue.ts — small offline/PWA fallback for AI generations.
 *
 * Many SEND staff work in low-bandwidth environments — rural primaries,
 * hospital schools, outreach visits. This module:
 *   1. Caches the most recent N successful generations across all tools so
 *      they can be re-opened (read-only) when offline.
 *   2. Queues outbound generations when navigator.onLine is false, replays
 *      them when the connection returns, and notifies via toast.
 *
 * The queue is intentionally simple — no service worker required — and
 * fits our zero-server-change posture. When a real PWA service worker is
 * added later, the same shape can be promoted.
 */

const CACHE_KEY = "adaptly_offline_cache_v1";
const QUEUE_KEY = "adaptly_offline_queue_v1";
const MAX_CACHE = 50;
const MAX_QUEUE = 20;

export interface OfflineCacheItem {
  id: string;
  toolId: string;
  toolLabel: string;
  title: string;
  output: string;
  at: number;
  pupilId?: string;
}

export interface QueuedGeneration {
  id: string;
  toolId: string;
  toolLabel: string;
  system: string;
  user: string;
  values: Record<string, string>;
  pupilId?: string;
  queuedAt: number;
}

function readCache(): OfflineCacheItem[] {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]"); } catch { return []; }
}
function writeCache(items: OfflineCacheItem[]): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(items.slice(0, MAX_CACHE))); } catch {}
}

function readQueue(): QueuedGeneration[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
}
function writeQueue(items: QueuedGeneration[]): void {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(0, MAX_QUEUE))); } catch {}
}

export function cacheGeneration(item: Omit<OfflineCacheItem, "id" | "at">): void {
  const next: OfflineCacheItem = {
    ...item,
    id: `oc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    at: Date.now(),
  };
  const items = [next, ...readCache().filter(c => c.output !== item.output)];
  writeCache(items);
}

export function listCached(): OfflineCacheItem[] {
  return readCache();
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

export function enqueueGeneration(g: Omit<QueuedGeneration, "id" | "queuedAt">): QueuedGeneration {
  const item: QueuedGeneration = {
    ...g,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    queuedAt: Date.now(),
  };
  const next = [...readQueue(), item];
  writeQueue(next);
  try { window.dispatchEvent(new CustomEvent("adaptly:queue-changed")); } catch {}
  return item;
}

export function listQueue(): QueuedGeneration[] {
  return readQueue();
}

export function dequeue(id: string): void {
  writeQueue(readQueue().filter(q => q.id !== id));
  try { window.dispatchEvent(new CustomEvent("adaptly:queue-changed")); } catch {}
}
