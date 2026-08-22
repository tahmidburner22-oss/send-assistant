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
import { learnerSupportPrompt, normaliseLearnerSupportProfile } from "@/lib/learnerSupportProfile";

export interface PupilContextSummary {
  /** Compact one-liner shown next to the picker. */
  headline: string;
  /** Full block to inject into the AI user prompt. */
  promptBlock: string;
  /** Pillar A (FEAT-PA-003) — last 3 distinct worksheet topics, most-recent first.
   *  Used by aiGenerateWorksheet to auto-fill the priorTopics[] param so the
   *  planner can interleave 1–2 synoptic questions without teacher input. */
  priorTopics: string[];
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
    .sort((a, b) => ((a.createdAt ?? a.assignedAt) < (b.createdAt ?? b.assignedAt) ? 1 : -1))
    .slice(0, MAX_RECENT_ASSIGNMENTS);

  const recentSubmissions: Submission[] = [...(child.submissions || [])]
    .sort((a, b) => ((a.createdAt ?? a.submittedAt) < (b.createdAt ?? b.submittedAt) ? 1 : -1))
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

  const learnerSupport = normaliseLearnerSupportProfile(child.learnerSupportProfile || {});
  const learnerSupportLines = learnerSupportPrompt(learnerSupport);
  if (learnerSupportLines.length > 0) {
    lines.push(`- Teacher-reviewed learner support profile (remove access barriers; do not diagnose or lower the learning objective):`);
    lines.push(...learnerSupportLines.map(line => `  ${line}`));
  }

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

  // ── Pillar A (FEAT-PA-003) — derive prior topics from recent assignments ─
  // We surface the last 3 distinct worksheet topics on the prompt block AND
  // return them as `priorTopics` so the worksheet generator can auto-fill its
  // synoptic-interleave slots without the teacher having to retype each
  // previous lesson. Ordering: most-recent first; deduped case-insensitively.
  const priorTopicsRaw: string[] = [];
  for (const a of recentAssignments) {
    if (a.type !== "worksheet" && a.type !== "story" && a.type !== "differentiation") {
      // Only assignments that actually carry a curriculum topic are useful.
      continue;
    }
    const topic = (a as any)?.metadata?.topic;
    if (typeof topic === "string" && topic.trim().length > 0) {
      priorTopicsRaw.push(topic.trim());
    }
  }
  const priorTopics: string[] = [];
  const seen = new Set<string>();
  for (const t of priorTopicsRaw) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    priorTopics.push(t);
    if (priorTopics.length >= 3) break;
  }
  if (priorTopics.length > 0) {
    lines.push(`- Prior topics covered (most recent first — interleave 1–2 synoptic questions linking to these):`);
    for (const t of priorTopics) lines.push(`  • ${t.slice(0, 120)}`);
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

  return { headline, promptBlock: lines.join("\n"), priorTopics };
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
