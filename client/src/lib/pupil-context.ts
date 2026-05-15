/**
 * pupil-context.ts — derive a stable AI prompt-context block from a pupil
 * record. Used by AIToolPage when the user explicitly opts in via the
 * "Use [Pupil A]'s recent records" toggle on the PupilContextPicker.
 *
 * This is the single biggest gap between Adaptly and "AI that knows my kids":
 * once a pupil is selected we can hand the model a structured summary of
 * the last 3 IEP targets, last 5 behaviour entries, current Smart Targets,
 * and stored learning preferences, so a Behaviour Plan generated in March
 * automatically knows what the November plan said and what worked.
 *
 * GDPR posture: we already store these on the pupil record; this module
 * never sends anything that wasn't already authored by school staff. It
 * does NOT include free-text full names — only the pupil's display name
 * and SEND need(s).
 */
import type { Child, Assignment, Submission } from "@/contexts/AppContext";

export interface PupilContextSummary {
  /** Compact one-liner shown next to the picker. */
  headline: string;
  /** Full block to inject into the AI user prompt. */
  promptBlock: string;
}

const MAX_RECENT_ASSIGNMENTS = 3;
const MAX_RECENT_SUBMISSIONS = 5;

export function buildPupilContext(child: Child): PupilContextSummary {
  const sendList =
    (child.sendNeeds && child.sendNeeds.length > 0
      ? child.sendNeeds
      : child.sendNeed
        ? [child.sendNeed]
        : []
    ).filter(Boolean);

  const recentAssignments: Assignment[] = [...(child.assignments || [])]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, MAX_RECENT_ASSIGNMENTS);

  const recentSubmissions: Submission[] = [...(child.submissions || [])]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, MAX_RECENT_SUBMISSIONS);

  const headline = [
    child.yearGroup,
    sendList.join(", "),
  ].filter(Boolean).join(" · ") || "No SEND need recorded";

  const lines: string[] = [];
  lines.push("[Pupil Records — use as context, do NOT name the pupil in the output]");
  lines.push(`- Year group: ${child.yearGroup || "(not set)"}`);
  if (sendList.length > 0) lines.push(`- SEND need(s): ${sendList.join(", ")}`);

  if (recentAssignments.length > 0) {
    lines.push(`- Recent assignments (most recent first):`);
    for (const a of recentAssignments) {
      const summary = (a.title || a.type || "assignment").slice(0, 80);
      lines.push(`  • ${summary}`);
    }
  }

  if (recentSubmissions.length > 0) {
    lines.push(`- Recent observations / submissions:`);
    for (const s of recentSubmissions) {
      const t = (s as any).title || (s as any).type || "observation";
      lines.push(`  • ${String(t).slice(0, 80)}`);
    }
  }

  // FEAT-005: surface EHCP / IEP outcomes when present so the AI can target them.
  // FEAT-003: surface recent misconceptions from the marking pipeline so the
  // generator can adapt the next worksheet to close known gaps.
  if (Array.isArray(child.ehcpOutcomes) && child.ehcpOutcomes.length > 0) {
    lines.push(`- EHCP outcomes (annual review):`);
    for (const o of child.ehcpOutcomes.slice(0, 5)) lines.push(`  • ${String(o).slice(0, 160)}`);
  }
  if (Array.isArray(child.iepTargets) && child.iepTargets.length > 0) {
    lines.push(`- IEP / SMART targets:`);
    for (const t of child.iepTargets.slice(0, 5)) lines.push(`  • ${String(t).slice(0, 160)}`);
  }
  if (Array.isArray(child.recentMisconceptions) && child.recentMisconceptions.length > 0) {
    lines.push(`- Misconceptions surfaced by recent marking (close these):`);
    for (const m of child.recentMisconceptions.slice(0, 5)) lines.push(`  • ${String(m).slice(0, 100)}`);
  }

  if (recentAssignments.length === 0 && recentSubmissions.length === 0) {
    lines.push(`- No prior assignments or observations on file.`);
  }

  return { headline, promptBlock: lines.join("\n") };
}

/** Map common Child properties onto AIToolPage field IDs. */
export function pupilToFormValues(child: Child): Record<string, string> {
  const initials = (child.name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map(p => p[0]?.toUpperCase() ?? "")
    .filter(Boolean)
    .join(".");
  const initialsWithDot = initials ? initials + "." : "";

  const values: Record<string, string> = {};
  if (initialsWithDot) values.studentName = initialsWithDot.slice(0, 4);
  if (child.yearGroup) values.yearGroup   = child.yearGroup;
  if (child.sendNeed)  values.sendNeed    = child.sendNeed;
  return values;
}
