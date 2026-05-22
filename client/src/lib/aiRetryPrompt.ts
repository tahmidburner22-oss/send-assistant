/**
 * aiRetryPrompt.ts
 *
 * PR-9 — audit item #41 — structured-output retry with diagnostic-only
 * re-prompt.
 *
 * Pure helper that, given a structured-output failure (Zod parse
 * error, JSON syntax error, schema-shape mismatch), returns a
 * diagnostic re-prompt the caller can hand back to the LLM. The
 * re-prompt is *diagnostic-only*: it states what was wrong with the
 * previous output and asks the model to emit ONLY the corrected JSON,
 * without re-stating the original system prompt or the user's
 * request. That keeps the second-attempt token bill small and avoids
 * the "double-prompt" amplification effect where the model is told
 * the rules twice and starts hallucinating to "satisfy" both copies.
 *
 * Out of scope:
 *   - Retry policy (max retries, backoff). The caller decides.
 *   - Retry telemetry / dashboards (PR-27).
 *   - Streaming retry (PR-20).
 */

import type { ZodError } from "zod";

/**
 * Shape of a structured-output failure the retry helper understands.
 * The caller produces one of these from whichever upstream parsed
 * the LLM output (Zod, JSON.parse, or a custom schema layer).
 */
export interface StructuredOutputFailure {
  kind: "json-syntax" | "schema-mismatch" | "empty-output" | "unknown";
  /** Raw output the LLM returned (truncated to ~2k chars by the
   *  helper before being included in the re-prompt). */
  raw?: string;
  /** Human-readable failure reason. For Zod, the caller passes the
   *  flattened error message; for JSON.parse, the SyntaxError
   *  message. */
  reason: string;
  /** Optional Zod-style error tree, when the failure originated
   *  from `WorksheetOutputSchema.safeParse`. The helper extracts the
   *  first 5 issues and inlines them. */
  zod?: Pick<ZodError, "issues">;
}

const RAW_OUTPUT_BUDGET = 2_000;
const MAX_ZOD_ISSUES_INLINED = 5;

/**
 * Truncate `raw` to a fixed length so the re-prompt stays cheap.
 * Cuts at the budget and appends an ellipsis when clipped — pure /
 * deterministic so two identical failures produce identical
 * re-prompts.
 */
function truncateRaw(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.length <= RAW_OUTPUT_BUDGET) return raw;
  return raw.slice(0, RAW_OUTPUT_BUDGET) + "\n…[output truncated]";
}

function stringifyZodIssues(zod: Pick<ZodError, "issues"> | undefined): string | null {
  if (!zod || !Array.isArray(zod.issues) || zod.issues.length === 0) return null;
  const issues = zod.issues.slice(0, MAX_ZOD_ISSUES_INLINED).map((i) => {
    const path = Array.isArray(i.path) ? i.path.join(".") : "(root)";
    const code = (i as { code?: string }).code || "issue";
    return `  - ${path}: ${code} — ${i.message}`;
  });
  const overflow = zod.issues.length - MAX_ZOD_ISSUES_INLINED;
  if (overflow > 0) {
    issues.push(`  …and ${overflow} more issue(s).`);
  }
  return issues.join("\n");
}

const FAILURE_HEADER: Record<StructuredOutputFailure["kind"], string> = {
  "json-syntax":
    "Your previous output was not valid JSON. The parser failed with:",
  "schema-mismatch":
    "Your previous output parsed as JSON but did not match the worksheet schema. The validator failed with:",
  "empty-output":
    "Your previous output was empty. The orchestrator received zero bytes from the model.",
  unknown:
    "Your previous output could not be processed. The orchestrator reported:",
};

/**
 * Build the re-prompt the caller hands back to the LLM. The result is
 * a single user-message string the caller appends after the failed
 * assistant turn — NOT a full system+user re-prompt. This keeps the
 * retry conversation small (one turn instead of two), which cuts
 * token spend and avoids re-stating the manifesto a second time.
 *
 * The output is purely deterministic given the failure shape, so two
 * identical failures produce byte-identical re-prompts (helpful for
 * caching and snapshot tests).
 */
export function buildDiagnosticRetryPrompt(
  failure: Readonly<StructuredOutputFailure>,
): string {
  const lines: string[] = [];
  lines.push(FAILURE_HEADER[failure.kind] ?? FAILURE_HEADER.unknown);
  lines.push("");
  lines.push(failure.reason.trim() || "(no reason supplied)");

  const zodSummary = stringifyZodIssues(failure.zod);
  if (zodSummary) {
    lines.push("");
    lines.push("Specific schema issues:");
    lines.push(zodSummary);
  }

  const truncated = truncateRaw(failure.raw);
  if (truncated) {
    lines.push("");
    lines.push("Your previous output was:");
    lines.push("```");
    lines.push(truncated);
    lines.push("```");
  }

  lines.push("");
  lines.push(
    "Re-emit the worksheet as a SINGLE JSON object that exactly matches the schema. " +
      "Do NOT explain the fix. Do NOT include markdown fences. Do NOT re-state the original prompt. " +
      "Output JSON ONLY.",
  );

  return lines.join("\n");
}

/**
 * Convenience helper for the common case where the upstream is
 * `WorksheetOutputSchema.safeParse`. Pass the parse result directly.
 * Returns `null` when the parse succeeded.
 */
export function buildRetryPromptFromZodResult(
  result: { success: false; error: ZodError } | { success: true },
  raw?: string,
): string | null {
  if (result.success) return null;
  return buildDiagnosticRetryPrompt({
    kind: "schema-mismatch",
    reason: result.error.issues
      .slice(0, MAX_ZOD_ISSUES_INLINED)
      .map((i) => i.message)
      .join("; "),
    raw,
    zod: result.error,
  });
}
