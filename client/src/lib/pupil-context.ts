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

  const ehcp = (child.ehcpOutcomes || []).filter(s => typeof s === "string" && s.trim().length > 0);
  const iep = (child.iepTargets || []).filter(s => typeof s === "string" && s.trim().length > 0);
  const recentMisconceptions = (child.recentMisconceptions || []).filter(s => typeof s === "string" && s.trim().length > 0);

  const headline = [
    child.yearGroup,
    sendList.join(", "),
    ehcp.length > 0 ? `${ehcp.length} EHCP outcome${ehcp.length === 1 ? "" : "s"}` : "",
    iep.length > 0 ? `${iep.length} IEP target${iep.length === 1 ? "" : "s"}` : "",
  ].filter(Boolean).join(" · ") || "No SEND need recorded";

  const lines: string[] = [];
  lines.push("[Pupil Records — use as context, do NOT name the pupil in the output]");
  lines.push(`- Year group: ${child.yearGroup || "(not set)"}`);
  if (sendList.length > 0) lines.push(`- SEND need(s): ${sendList.join(", ")}`);

  if (ehcp.length > 0) {
    lines.push(`- EHCP outcomes (design tasks that move pupil toward these):`);
    for (const o of ehcp.slice(0, 6)) lines.push(`  • ${o.slice(0, 200)}`);
  }

  if (iep.length > 0) {
    lines.push(`- IEP targets (current SMART targets — embed practice opportunities):`);
    for (const t of iep.slice(0, 6)) lines.push(`  • ${t.slice(0, 200)}`);
  }

  if (recentMisconceptions.length > 0) {
    lines.push(`- Recent misconceptions from past mark-scan results — explicitly address these:`);
    for (const m of recentMisconceptions.slice(0, 5)) lines.push(`  • ${m.slice(0, 200)}`);
  }

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

  if (
    recentAssignments.length === 0 &&
    recentSubmissions.length === 0 &&
    ehcp.length === 0 &&
    iep.length === 0 &&
    recentMisconceptions.length === 0
  ) {
    lines.push(`- No prior assignments, observations, or recorded outcomes on file.`);
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
