export interface ToolQualityReport {
  score: number;
  suggestions: string[];
}

const TOOL_RULES: Array<{ match: RegExp; checks: Array<(text: string) => string | null> }> = [
  {
    match: /lesson plan/i,
    checks: [
      (t) => /learning objective|objectives/i.test(t) ? null : "Add explicit learning objectives section.",
      (t) => /success criteria/i.test(t) ? null : "Include success criteria to align outcomes.",
      (t) => /assessment/i.test(t) ? null : "Add formative assessment checkpoints.",
    ],
  },
  {
    match: /quiz/i,
    checks: [
      (t) => /answer/i.test(t) ? null : "Include an answer key or answer explanations.",
      (t) => /\?/g.test(t) ? null : "Ensure questions are clearly phrased as questions.",
    ],
  },
  {
    match: /vocabulary/i,
    checks: [
      (t) => /definition/i.test(t) ? null : "Include definitions for each vocabulary item.",
      (t) => /example/i.test(t) ? null : "Add usage examples for vocabulary terms.",
    ],
  },
  {
    match: /report comments|behaviour|wellbeing|risk|iep/i,
    checks: [
      (t) => /next step|action/i.test(t) ? null : "Add specific next steps or actions.",
      (t) => /evidence|example/i.test(t) ? null : "Add evidence/examples to support statements.",
    ],
  },
];

function basicChecks(text: string): string[] {
  const suggestions: string[] = [];
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words < 120) suggestions.push("Expand detail: output is currently very short.");
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0).length;
  if (paragraphs < 3) suggestions.push("Improve readability with clearer paragraph/section breaks.");
  if (!/[0-9][\).]/.test(text) && !/[-•]/.test(text)) {
    suggestions.push("Add structured bullets or numbered steps for classroom usability.");
  }
  return suggestions;
}

export function auditToolContent(toolTitle: string, text: string): ToolQualityReport {
  const suggestions = basicChecks(text);
  for (const rule of TOOL_RULES) {
    if (rule.match.test(toolTitle)) {
      for (const check of rule.checks) {
        const s = check(text);
        if (s) suggestions.push(s);
      }
    }
  }
  const deduped = Array.from(new Set(suggestions));
  const score = Math.max(40, Math.min(100, 100 - deduped.length * 8));
  return { score, suggestions: deduped.slice(0, 5) };
}
