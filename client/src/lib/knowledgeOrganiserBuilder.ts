/**
 * knowledgeOrganiserBuilder.ts — PR-10 / PD10
 *
 * Pure deterministic extraction of a Knowledge Organiser from an
 * already-generated worksheet. No LLM call, no I/O.
 */
import type { KnowledgeOrganiser } from "./mtp-v2-enhancements";
export type { KnowledgeOrganiser };
export { knowledgeOrganiserHtml } from "./mtp-v2-enhancements";

export interface WorksheetInput {
  title?: string;
  sections?: Array<{ type?: string; title?: string; content?: string }>;
  metadata?: Record<string, unknown>;
}

/**
 * Derive a knowledge organiser from an already-generated worksheet.
 * Extracts vocab from word-bank sections, key facts from learning-objective
 * and content sections, sticky questions from self-reflection.
 * No LLM call - entirely deterministic.
 */
export function deriveKnowledgeOrganiserFromWorksheet(ws: WorksheetInput): KnowledgeOrganiser {
  const sections = ws.sections || [];
  const meta = ws.metadata || {};

  const vocabulary = extractVocabulary(sections);
  const keyFacts = extractKeyFacts(sections);
  const stickyQuestions = extractStickyQuestions(sections);
  const diagramHint = extractDiagramHint(sections);

  const unitTitle = ws.title || (typeof meta.topic === "string" ? meta.topic : "Untitled");
  const yearGroup = typeof meta.yearGroup === "string" ? meta.yearGroup : "";

  return { unitTitle, yearGroup, vocabulary, keyFacts, stickyQuestions, diagramHint };
}

// ── Internal helpers ────────────────────────────────────────────────────────

function extractVocabulary(
  sections: Array<{ type?: string; title?: string; content?: string }>,
): { term: string; definition: string }[] {
  const out: { term: string; definition: string }[] = [];
  for (const s of sections) {
    if (!s.type || !/(word-bank|vocabulary)/i.test(s.type)) continue;
    const lines = (s.content || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const cleaned = line.replace(/^[\-\u2022*\d.)\s]+/, "");
      const m = cleaned.match(/^([A-Za-z][\w\s\-']*?)\s*[\-\u2013\u2014:|]\s*(.+)$/);
      if (m && m[1] && m[2]) {
        out.push({ term: m[1].trim(), definition: m[2].trim() });
        if (out.length >= 10) return out;
      }
    }
  }
  return out;
}

function extractKeyFacts(
  sections: Array<{ type?: string; title?: string; content?: string }>,
): string[] {
  const out: string[] = [];
  const cues = /(\d{2,4}|\b(?:always|never|because|caused|results?\s+in|equals?|approximately|must|will)\b)/i;
  for (const s of sections) {
    if (!s.type || !/(learning-objective|objectives)/i.test(s.type)) continue;
    const lines = (s.content || "").split(/\n+/).map((l) => l.replace(/^[\-\u2022*\d.)\s]+/, "").trim()).filter((l) => l.length > 10);
    for (const line of lines) {
      if (cues.test(line) || line.length > 15) {
        out.push(line);
        if (out.length >= 8) return out;
      }
    }
  }
  return out;
}

function extractStickyQuestions(
  sections: Array<{ type?: string; title?: string; content?: string }>,
): string[] {
  const out: string[] = [];
  for (const s of sections) {
    if (!s.type || !/(self-reflection|revision-tips)/i.test(s.type)) continue;
    const lines = (s.content || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const cleaned = line.replace(/^[\-\u2022*\d.)\s]+/, "");
      if (cleaned.endsWith("?") || /^(can |do |how |what |why |where |when )/i.test(cleaned)) {
        out.push(cleaned);
        if (out.length >= 5) return out;
      }
    }
  }
  return out;
}

function extractDiagramHint(
  sections: Array<{ type?: string; title?: string; content?: string }>,
): string | undefined {
  for (const s of sections) {
    if (s.type === "diagram" && s.title) {
      return s.title;
    }
  }
  return undefined;
}
