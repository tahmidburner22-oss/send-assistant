/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * proceduralActivities/crossword.ts — FEAT-G4.
 *
 * Greedy crossword generator. Picks the longest word as the seed,
 * then attempts to interlock each subsequent word at every shared
 * letter. Tries up to 50 seeded restarts and keeps the layout that
 * placed the most words. Emits a warning per skipped word.
 */

import { makeRandom, shuffleSeeded } from "./seededRandom";

export interface CrosswordEntry {
  word: string;
  clue: string;
}

export type CrosswordCell = "#" | null | string;

export interface CrosswordClue {
  num: number;
  dir: "across" | "down";
  clue: string;
  answer: string;
  row: number;
  col: number;
}

export interface CrosswordInput {
  entries: CrosswordEntry[];
  seed?: number;
  maxRestarts?: number;
}

export interface CrosswordOutput {
  grid: CrosswordCell[][];
  clues: CrosswordClue[];
  skipped: string[];
  warnings: string[];
}

interface Placement {
  word: string;
  clue: string;
  row: number;
  col: number;
  dir: "across" | "down";
}

const GRID_SIZE = 25; // virtual; trimmed to bounding box at the end.

function clean(word: string): string {
  return String(word || "").toUpperCase().replace(/[^A-Z]/g, "");
}

function tryPlace(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  dir: "across" | "down",
): boolean {
  const dr = dir === "down" ? 1 : 0;
  const dc = dir === "across" ? 1 : 0;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    const cell = grid[r][c];
    if (cell !== null && cell !== word[i]) return false;
  }
  // Check head/tail are not adjacent to another letter (to avoid words running into each other).
  const headR = row - dr;
  const headC = col - dc;
  if (headR >= 0 && headC >= 0 && headR < GRID_SIZE && headC < GRID_SIZE && grid[headR][headC] !== null) return false;
  const tailR = row + dr * word.length;
  const tailC = col + dc * word.length;
  if (
    tailR >= 0 &&
    tailC >= 0 &&
    tailR < GRID_SIZE &&
    tailC < GRID_SIZE &&
    grid[tailR][tailC] !== null
  ) return false;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    grid[r][c] = word[i];
  }
  return true;
}

function attempt(entries: CrosswordEntry[], seed: number): CrosswordOutput {
  const grid: (string | null)[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null),
  );
  const placements: Placement[] = [];
  const skipped: string[] = [];
  const rand = makeRandom(seed);

  // Sort longest first (deterministic), shuffle ties.
  const list = entries
    .map((e) => ({ ...e, _w: clean(e.word) }))
    .filter((e) => e._w.length >= 2);
  list.sort((a, b) => b._w.length - a._w.length);
  const shuffledTail = shuffleSeeded(list.slice(1), rand);
  const ordered = list.length > 0 ? [list[0], ...shuffledTail] : list;

  // Place first word horizontally at centre.
  if (ordered.length > 0) {
    const first = ordered[0];
    const row = Math.floor(GRID_SIZE / 2);
    const col = Math.floor((GRID_SIZE - first._w.length) / 2);
    if (tryPlace(grid, first._w, row, col, "across")) {
      placements.push({ word: first._w, clue: first.clue, row, col, dir: "across" });
    } else {
      skipped.push(first._w);
    }
  }

  for (let i = 1; i < ordered.length; i++) {
    const e = ordered[i];
    const w = e._w;
    let placed = false;
    outer: for (let p = 0; p < placements.length; p++) {
      const placedWord = placements[p];
      for (let pi = 0; pi < placedWord.word.length; pi++) {
        for (let wi = 0; wi < w.length; wi++) {
          if (placedWord.word[pi] !== w[wi]) continue;
          const newDir: "across" | "down" = placedWord.dir === "across" ? "down" : "across";
          let row: number, col: number;
          if (placedWord.dir === "across") {
            // intersect column.
            col = placedWord.col + pi;
            row = placedWord.row - wi;
          } else {
            row = placedWord.row + pi;
            col = placedWord.col - wi;
          }
          if (tryPlace(grid, w, row, col, newDir)) {
            placements.push({ word: w, clue: e.clue, row, col, dir: newDir });
            placed = true;
            break outer;
          }
        }
      }
    }
    if (!placed) skipped.push(w);
  }

  // Trim to bounding box.
  let minR = GRID_SIZE,
    minC = GRID_SIZE,
    maxR = 0,
    maxC = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== null) {
        if (r < minR) minR = r;
        if (c < minC) minC = c;
        if (r > maxR) maxR = r;
        if (c > maxC) maxC = c;
      }
    }
  }
  if (minR > maxR) {
    return { grid: [], clues: [], skipped, warnings: skipped.map((w) => `Could not place: ${w}`) };
  }
  const trimmed: CrosswordCell[][] = [];
  for (let r = minR; r <= maxR; r++) {
    const row: CrosswordCell[] = [];
    for (let c = minC; c <= maxC; c++) {
      const v = grid[r][c];
      row.push(v === null ? "#" : v);
    }
    trimmed.push(row);
  }

  // Number the clues by reading order.
  const clues: CrosswordClue[] = [];
  let num = 0;
  const seen = new Map<string, number>();
  for (const p of placements) {
    const key = `${p.row - minR},${p.col - minC}`;
    let n = seen.get(key);
    if (n === undefined) {
      num += 1;
      seen.set(key, num);
      n = num;
    }
    clues.push({
      num: n,
      dir: p.dir,
      clue: p.clue,
      answer: p.word,
      row: p.row - minR,
      col: p.col - minC,
    });
  }
  clues.sort((a, b) => (a.num - b.num) || a.dir.localeCompare(b.dir));

  return {
    grid: trimmed,
    clues,
    skipped,
    warnings: skipped.map((w) => `Could not place: ${w}`),
  };
}

export function generateCrossword(input: CrosswordInput): CrosswordOutput {
  const entries = (input.entries || []).filter((e) => e && e.word && e.clue);
  if (entries.length === 0) {
    return { grid: [], clues: [], skipped: [], warnings: ["No entries supplied."] };
  }
  const restarts = Math.max(1, Math.min(50, input.maxRestarts ?? 50));
  let best: CrosswordOutput | null = null;
  const baseSeed = input.seed ?? 1;
  for (let i = 0; i < restarts; i++) {
    const out = attempt(entries, baseSeed + i);
    if (best === null || out.clues.length > best.clues.length) {
      best = out;
      if (out.skipped.length === 0) break;
    }
  }
  return best || { grid: [], clues: [], skipped: [], warnings: ["No layout produced."] };
}
