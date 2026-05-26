/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * proceduralActivities/wordsearch.ts — FEAT-G4.
 *
 * Pure deterministic wordsearch generator. Configurable grid size,
 * diagonals on/off, seeded shuffle. Returns a grid + the recorded
 * placements so the answer-key page (G12) can list them.
 */

import { makeRandom, shuffleSeeded, type SeededRandom } from "./seededRandom";

export type WordsearchDirection = "→" | "↓" | "↘" | "↗";

export interface WordsearchPlacement {
  word: string;
  row: number;
  col: number;
  dir: WordsearchDirection;
}

export interface WordsearchInput {
  words: string[];
  gridSize?: number;
  allowDiagonals?: boolean;
  seed?: number;
}

export interface WordsearchOutput {
  grid: string[][];
  placements: WordsearchPlacement[];
  warnings: string[];
}

const DIRS_NO_DIAG: WordsearchDirection[] = ["→", "↓"];
const DIRS_ALL: WordsearchDirection[] = ["→", "↓", "↘", "↗"];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function deltaFor(dir: WordsearchDirection): { dr: number; dc: number } {
  switch (dir) {
    case "→":
      return { dr: 0, dc: 1 };
    case "↓":
      return { dr: 1, dc: 0 };
    case "↘":
      return { dr: 1, dc: 1 };
    case "↗":
      return { dr: -1, dc: 1 };
  }
}

function tryPlace(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dir: WordsearchDirection,
  size: number,
): boolean {
  const { dr, dc } = deltaFor(dir);
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    const cell = grid[r][c];
    if (cell !== "" && cell !== word[i]) return false;
  }
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    grid[r][c] = word[i];
  }
  return true;
}

export function generateWordsearch(input: WordsearchInput): WordsearchOutput {
  const cleaned = (input.words || [])
    .map((w) => String(w).toUpperCase().replace(/[^A-Z]/g, ""))
    .filter((w) => w.length >= 2);
  if (cleaned.length === 0) {
    return { grid: [], placements: [], warnings: ["No valid words supplied."] };
  }
  const maxLen = cleaned.reduce((m, w) => Math.max(m, w.length), 0);
  const totalLetters = cleaned.reduce((s, w) => s + w.length, 0);
  const baseSize = Math.max(maxLen + 2, Math.ceil(Math.sqrt(totalLetters * 1.4)));
  const sizeRequest = input.gridSize && input.gridSize >= maxLen ? input.gridSize : baseSize;
  const allowDiag = input.allowDiagonals !== false;
  const dirs = allowDiag ? DIRS_ALL : DIRS_NO_DIAG;
  const rand = makeRandom(input.seed ?? 1);

  // Try up to 3 size escalations to fit every word.
  let size = sizeRequest;
  for (let attempt = 0; attempt < 3; attempt++) {
    const grid: string[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ""),
    );
    const placements: WordsearchPlacement[] = [];
    const placedAll = cleaned.every((word) => {
      for (let tries = 0; tries < 80; tries++) {
        const dir = dirs[Math.floor(rand() * dirs.length)];
        const row = Math.floor(rand() * size);
        const col = Math.floor(rand() * size);
        if (tryPlace(grid, word, row, col, dir, size)) {
          placements.push({ word, row, col, dir });
          return true;
        }
      }
      return false;
    });
    if (placedAll) {
      // fill empty cells with random letters
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r][c] === "") {
            grid[r][c] = ALPHABET[Math.floor(rand() * 26)];
          }
        }
      }
      return { grid, placements, warnings: [] };
    }
    size += 2;
  }

  // Fallback: emit best-effort grid with a warning.
  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ALPHABET[Math.floor(rand() * 26)]),
  );
  return {
    grid,
    placements: [],
    warnings: ["Could not fit all words; rendering best-effort grid."],
  };
}

export const __testing = { shuffleSeeded, makeRandom, deltaFor };
