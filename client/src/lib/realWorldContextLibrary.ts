/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * realWorldContextLibrary.ts — FEAT-H3.
 *
 * Lookup + format helpers over the curated real-world context list.
 * Pure data layer — see client/src/data/contexts/realWorldContexts.json.
 */

import contextsRaw from "@/data/contexts/realWorldContexts.json";

export type ContextFreshness = "evergreen" | "seasonal" | "dated";

export interface RealWorldContext {
  id: string;
  name: string;
  category: string;
  freshness: ContextFreshness;
  suggestedFor: string[];
  examples: string[];
  avoidWith?: string[];
}

interface RawData {
  version: number;
  lastUpdated: string;
  contexts: RealWorldContext[];
}

const DATA = contextsRaw as RawData;

export function listContexts(): RealWorldContext[] {
  return DATA.contexts.slice();
}

export function getContext(id: string): RealWorldContext | undefined {
  return DATA.contexts.find((c) => c.id === id);
}

export function listCategories(): string[] {
  return Array.from(new Set(DATA.contexts.map((c) => c.category))).sort();
}

export interface FilterOptions {
  subject?: string;
  sendNeed?: string;
  category?: string;
  /** When false, hides contexts whose freshness is 'seasonal' or 'dated'. */
  includeSeasonal?: boolean;
}

export function filterContexts(opts: FilterOptions = {}): RealWorldContext[] {
  const subj = opts.subject?.toLowerCase();
  const send = opts.sendNeed?.toLowerCase();
  const cat = opts.category?.toLowerCase();
  return DATA.contexts.filter((c) => {
    if (opts.includeSeasonal === false && c.freshness !== "evergreen") return false;
    if (cat && c.category.toLowerCase() !== cat) return false;
    if (subj && c.suggestedFor.length > 0) {
      if (!c.suggestedFor.some((s) => s.toLowerCase() === subj)) return false;
    }
    if (send && c.avoidWith && c.avoidWith.some((a) => a.toLowerCase() === send)) return false;
    return true;
  });
}

/** Build a prompt directive for the supplied context. */
export function buildContextDirective(contextId: string | undefined | null): string {
  if (!contextId) return "";
  const ctx = getContext(contextId);
  if (!ctx) return "";
  const examples = ctx.examples.slice(0, 3).map((e) => `  - ${e}`).join("\n");
  return [
    "",
    `── Real-world context: ${ctx.name} ──`,
    `Use ${ctx.name} examples in worked examples and word problems where natural.`,
    "Suggested:",
    examples,
    "",
  ].join("\n");
}
