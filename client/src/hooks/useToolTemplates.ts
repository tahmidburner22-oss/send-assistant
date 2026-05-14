/**
 * useToolTemplates — per-tool reusable form-value templates.
 *
 * SENCOs aren't writing 30 unique Behaviour Plans — they're writing 5
 * archetypes (escalation/withdrawal/ADHD-impulsivity/anxiety/transition) and
 * adapting each to a specific child. This hook persists named bundles of
 * form values + the output that resulted, so a teacher can:
 *
 *   1. Save a great generation as a template ("Y4 PDA escalation plan")
 *   2. Pick a template at the top of the form to pre-fill all fields
 *   3. Optionally restore the original output to use as a starting point
 *
 * Storage layout:  adaptly_templates_v1_<toolSlug>  →  Template[]
 * Cap:             20 templates per tool, ~100 KB per template
 * Scope:           localStorage (per-user). A future "Share with my school"
 *                  feature would sync to the school via the API.
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_PREFIX  = "adaptly_templates_v1_";
const MAX_ENTRIES     = 20;
const MAX_BYTES_ENTRY = 100_000;

export interface ToolTemplate {
  id: string;
  name: string;
  at: number;
  values: Record<string, string>;
  /** Optional cached AI output that produced this template (helps preview). */
  output?: string;
}

export interface UseToolTemplatesApi {
  templates: ToolTemplate[];
  save: (name: string, values: Record<string, string>, output?: string) => ToolTemplate | null;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  get: (id: string) => ToolTemplate | undefined;
}

function keyFor(toolSlug: string): string {
  return STORAGE_PREFIX + toolSlug;
}

function readAll(toolSlug: string): ToolTemplate[] {
  try {
    const raw = localStorage.getItem(keyFor(toolSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ToolTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(toolSlug: string, entries: ToolTemplate[]): void {
  try {
    localStorage.setItem(keyFor(toolSlug), JSON.stringify(entries));
  } catch {}
}

export function useToolTemplates(toolSlug: string): UseToolTemplatesApi {
  const [templates, setTemplates] = useState<ToolTemplate[]>([]);

  useEffect(() => {
    if (!toolSlug) return;
    setTemplates(readAll(toolSlug));
  }, [toolSlug]);

  const save = useCallback((name: string, values: Record<string, string>, output?: string): ToolTemplate | null => {
    const cleanName = (name || "").trim();
    if (!toolSlug || !cleanName) return null;
    const entry: ToolTemplate = {
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: cleanName.slice(0, 80),
      at: Date.now(),
      values: { ...values },
      output: output ? output.slice(0, MAX_BYTES_ENTRY) : undefined,
    };
    let saved: ToolTemplate | null = null;
    setTemplates(prev => {
      // Replace existing template with the same name (case-insensitive)
      const idx = prev.findIndex(t => t.name.toLowerCase() === entry.name.toLowerCase());
      let next: ToolTemplate[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...entry, id: prev[idx].id }; // preserve original id
      } else {
        next = [entry, ...prev].slice(0, MAX_ENTRIES);
      }
      writeAll(toolSlug, next);
      saved = idx >= 0 ? next[idx] : entry;
      return next;
    });
    return saved;
  }, [toolSlug]);

  const rename = useCallback((id: string, name: string) => {
    const clean = (name || "").trim().slice(0, 80);
    if (!clean) return;
    setTemplates(prev => {
      const next = prev.map(t => (t.id === id ? { ...t, name: clean } : t));
      writeAll(toolSlug, next);
      return next;
    });
  }, [toolSlug]);

  const remove = useCallback((id: string) => {
    setTemplates(prev => {
      const next = prev.filter(t => t.id !== id);
      writeAll(toolSlug, next);
      return next;
    });
  }, [toolSlug]);

  const get = useCallback(
    (id: string) => templates.find(t => t.id === id),
    [templates],
  );

  return { templates, save, rename, remove, get };
}

export default useToolTemplates;
