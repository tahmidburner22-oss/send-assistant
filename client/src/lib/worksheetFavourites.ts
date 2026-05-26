/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * worksheetFavourites.ts — FEAT-G17.
 *
 * Pure helpers for the worksheet-favourites speed-dial. Stores
 * favourites client-side in localStorage with a server sync hook
 * (server route: /api/library/favourites). Tests bypass the network
 * by passing { fetcher } overrides.
 */

export interface FavouriteRecord {
  worksheetId: string;
  label: string;
  createdAt: string;
  /** Snapshot of the worksheet generation params (for pre-fill). */
  snapshot?: {
    subject?: string;
    yearGroup?: string;
    topic?: string;
    sendNeed?: string | null;
    examBoard?: string;
    difficulty?: string;
    archetype?: string;
  };
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const memoryStore = new Map<string, string>();

function getStorage(): StorageLike {
  if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: StorageLike }).localStorage) {
    try {
      const ls = (globalThis as { localStorage?: StorageLike }).localStorage!;
      ls.getItem("__probe__");
      return ls;
    } catch {
      // private mode or blocked
    }
  }
  return {
    getItem: (k) => (memoryStore.has(k) ? memoryStore.get(k)! : null),
    setItem: (k, v) => {
      memoryStore.set(k, v);
    },
  };
}

const KEY = "worksheet_favourites_v1";
const MAX_FAVOURITES = 50;

export function loadFavourites(): FavouriteRecord[] {
  try {
    const raw = getStorage().getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as FavouriteRecord[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveFavourites(list: FavouriteRecord[]): void {
  getStorage().setItem(KEY, JSON.stringify(list));
}

export function isFavourited(worksheetId: string, list?: FavouriteRecord[]): boolean {
  const arr = list ?? loadFavourites();
  return arr.some((f) => f.worksheetId === worksheetId);
}

export function toggleFavourite(
  rec: FavouriteRecord,
  list?: FavouriteRecord[],
): { list: FavouriteRecord[]; nowFavourited: boolean; warning?: string } {
  const current = (list ?? loadFavourites()).slice();
  const idx = current.findIndex((f) => f.worksheetId === rec.worksheetId);
  if (idx >= 0) {
    current.splice(idx, 1);
    saveFavourites(current);
    return { list: current, nowFavourited: false };
  }
  if (current.length >= MAX_FAVOURITES) {
    return {
      list: current,
      nowFavourited: false,
      warning: `Limit reached — un-favourite older entries (max ${MAX_FAVOURITES}).`,
    };
  }
  current.unshift(rec);
  saveFavourites(current);
  return { list: current, nowFavourited: true };
}

export function recentFavourites(limit = 8, list?: FavouriteRecord[]): FavouriteRecord[] {
  const arr = list ?? loadFavourites();
  return arr.slice(0, Math.max(0, limit));
}

export function isStale(rec: FavouriteRecord, monthsThreshold = 6): boolean {
  if (!rec.createdAt) return false;
  const t = Date.parse(rec.createdAt);
  if (!Number.isFinite(t)) return false;
  const ageMs = Date.now() - t;
  const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30.4375);
  return ageMonths >= monthsThreshold;
}

export const __testing = { KEY, MAX_FAVOURITES };
