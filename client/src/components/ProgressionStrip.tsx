/**
 * ProgressionStrip — FEAT-006
 * ───────────────────────────
 * Shows a horizontal "skill ladder" above the rendered worksheet so the
 * teacher can see at a glance:
 *   - which step of the topic this worksheet sits on
 *   - what comes BEFORE it (prerequisite — generate a 5-min starter)
 *   - what comes AFTER it (extension — generate the next-step worksheet)
 *
 * Turns the worksheet generator from a single-shot tool into a planner's
 * brain. Reads the linear ladder in client/src/lib/curriculum-progression.ts
 * (no DAG yet — see lib comment for future direction).
 *
 * Costs zero — pure local logic + click-to-regenerate that calls back into
 * the existing AI worksheet flow with the chosen step's title as the topic.
 */
import { useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { getProgressionForTopic, type SkillStep, type TopicProgression } from "@/lib/curriculum-progression";

interface Props {
  subject: string;
  topic: string;
  /** Called when the teacher wants to jump to a specific step. */
  onJumpToStep: (step: SkillStep, mode: "prerequisite" | "extension" | "exact") => void;
}

/**
 * Best-effort current-step detection: pick the step whose title most closely
 * matches the worksheet's topic phrase. Falls back to step 1.
 */
function detectCurrentStepIndex(progression: TopicProgression, topic: string): number {
  if (!topic) return 0;
  const topicLower = topic.toLowerCase();
  let best = -1;
  let bestScore = 0;
  for (let i = 0; i < progression.steps.length; i++) {
    const step = progression.steps[i];
    const titleLower = step.title.toLowerCase();
    let score = 0;
    // Exact title match wins outright
    if (titleLower === topicLower) return i;
    // Token overlap
    const topicTokens = new Set(topicLower.split(/\W+/).filter((t) => t.length >= 3));
    const titleTokens = titleLower.split(/\W+/).filter((t) => t.length >= 3);
    for (const t of titleTokens) if (topicTokens.has(t)) score++;
    // Substring bonus
    if (topicLower.includes(titleLower) || titleLower.includes(topicLower)) score += 2;
    if (score > bestScore) { best = i; bestScore = score; }
  }
  return best >= 0 ? best : 0;
}

export function ProgressionStrip({ subject, topic, onJumpToStep }: Props) {
  const progression = useMemo(() => getProgressionForTopic(subject, topic), [subject, topic]);
  const currentIdx = useMemo(() => (progression ? detectCurrentStepIndex(progression, topic) : 0), [progression, topic]);

  if (!progression) return null;

  const prerequisite = currentIdx > 0 ? progression.steps[currentIdx - 1] : null;
  const extension = currentIdx < progression.steps.length - 1 ? progression.steps[currentIdx + 1] : null;
  const currentStep = progression.steps[currentIdx];

  return (
    <div
      className="ws-progression-strip no-print mb-3 rounded-lg border border-indigo-200 bg-indigo-50/40 px-3 py-2.5"
      aria-label="Curriculum progression"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1.5">
          Curriculum ladder · {progression.topicName}
        </p>
        <span className="text-[10px] text-indigo-600/70">
          Step {currentIdx + 1} of {progression.steps.length}
        </span>
      </div>

      {/* Step pips */}
      <div className="flex items-center gap-1 mb-2.5 overflow-x-auto pb-1">
        {progression.steps.map((step, i) => {
          const state =
            i < currentIdx ? "before" : i === currentIdx ? "current" : "after";
          const stateClasses =
            state === "current"
              ? "bg-indigo-600 text-white border-indigo-600"
              : state === "before"
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-white text-indigo-700 border-indigo-200";
          return (
            <button
              key={step.id}
              onClick={() => onJumpToStep(step, state === "before" ? "prerequisite" : state === "after" ? "extension" : "exact")}
              className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border ${stateClasses} hover:shadow-sm transition`}
              title={step.description}
            >
              <span className="font-bold">{i + 1}</span>
              <span className="max-w-[140px] truncate">{step.title}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-indigo-700/85 leading-snug mb-2">
        <span className="font-semibold">Now:</span> {currentStep.title} — {currentStep.description}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {prerequisite && (
          <button
            onClick={() => onJumpToStep(prerequisite, "prerequisite")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800"
            title="Generate a 5-minute starter on the prerequisite step"
          >
            <ArrowDownToLine className="w-3 h-3" />
            <span>Prerequisite</span>
            <span className="text-emerald-600 font-normal max-w-[140px] truncate">
              <ChevronLeft className="w-2.5 h-2.5 inline" /> {prerequisite.title}
            </span>
          </button>
        )}
        {extension && (
          <button
            onClick={() => onJumpToStep(extension, "extension")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-800"
            title="Generate an extension worksheet on the next step"
          >
            <ArrowUpToLine className="w-3 h-3" />
            <span>Extension</span>
            <span className="text-indigo-600 font-normal max-w-[140px] truncate">
              {extension.title} <ChevronRight className="w-2.5 h-2.5 inline" />
            </span>
          </button>
        )}
        {!prerequisite && !extension && (
          <span className="text-[11px] text-indigo-600/70 italic">This is the only step on the ladder.</span>
        )}
      </div>
    </div>
  );
}

export default ProgressionStrip;
