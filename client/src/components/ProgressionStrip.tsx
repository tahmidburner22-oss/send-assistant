/**
 * ProgressionStrip — Curriculum progression CTAs (Phase 4 / FEAT-006)
 *
 * Sits above the rendered worksheet and surfaces the topic's place on the
 * UK curriculum ladder, with one-click CTAs to generate a prerequisite
 * (5-min starter) or an extension worksheet for the next step.
 *
 * Reads from the existing CURRICULUM_PROGRESSIONS data — does not require a
 * new DAG. If no progression matches the topic, the strip renders nothing.
 *
 * Why this is teacher-useful:
 *   - Makes the planning question "what comes next?" explicit at the point
 *     of generation rather than after the lesson.
 *   - The "generate prerequisite for the 3 pupils who haven't covered Y4
 *     Number 7c" workflow becomes a one-click follow-up.
 *   - Renders with class `no-print` so it never appears on the printed sheet.
 */

import React, { useMemo } from "react";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProgressionForTopic } from "@/lib/curriculum-progression";
import type { SkillStep } from "@/lib/curriculum-progression";

export interface ProgressionStripProps {
  subject?: string;
  topic?: string;
  /** Called when teacher clicks "Generate prerequisite". Receives the previous step. */
  onGeneratePrerequisite?: (step: SkillStep) => void;
  /** Called when teacher clicks "Generate extension". Receives the next step. */
  onGenerateExtension?: (step: SkillStep) => void;
}

/** Find the SkillStep that best matches the current worksheet's topic + subtopic. */
function pickCurrentStep(progression: ReturnType<typeof getProgressionForTopic>, topicHint: string): SkillStep | null {
  if (!progression || progression.steps.length === 0) return null;
  const hint = topicHint.toLowerCase();
  // Prefer a step whose title is contained in the topic hint; else first step
  const exact = progression.steps.find((s) => hint.includes(s.title.toLowerCase()));
  return exact || progression.steps[0];
}

const ProgressionStrip: React.FC<ProgressionStripProps> = ({ subject, topic, onGeneratePrerequisite, onGenerateExtension }) => {
  const data = useMemo(() => {
    if (!subject || !topic) return null;
    const prog = getProgressionForTopic(subject, topic);
    if (!prog) return null;
    const current = pickCurrentStep(prog, topic);
    if (!current) return null;
    const idx = prog.steps.findIndex((s) => s.id === current.id);
    const prev = idx > 0 ? prog.steps[idx - 1] : null;
    const next = idx >= 0 && idx < prog.steps.length - 1 ? prog.steps[idx + 1] : null;
    return { prog, current, prev, next, idx };
  }, [subject, topic]);

  if (!data) return null;
  const { prog, current, prev, next, idx } = data;

  return (
    <Card className="border-brand/30 bg-brand-light/10 no-print">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-brand uppercase tracking-wide">
              UK Curriculum progression — {prog.topicName}
            </p>
            <p className="text-xs text-foreground mt-0.5">
              <span className="font-medium">Step {idx + 1} of {prog.steps.length}:</span> {current.title}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{current.description}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {prev ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-start gap-2 text-left h-auto py-2"
              onClick={() => onGeneratePrerequisite?.(prev)}
            >
              <ChevronLeft className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span className="flex-1 min-w-0">
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wide">Prerequisite</span>
                <span className="block text-xs font-medium truncate">{prev.title}</span>
              </span>
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
            </Button>
          ) : (
            <div className="flex-1 px-3 py-2 rounded-lg border border-dashed border-border/50 text-[10px] text-muted-foreground italic flex items-center">
              First step — no prerequisite.
            </div>
          )}

          {next ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-start gap-2 text-left h-auto py-2"
              onClick={() => onGenerateExtension?.(next)}
            >
              <span className="flex-1 min-w-0">
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wide">Extension</span>
                <span className="block text-xs font-medium truncate">{next.title}</span>
              </span>
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
              <ChevronRight className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            </Button>
          ) : (
            <div className="flex-1 px-3 py-2 rounded-lg border border-dashed border-border/50 text-[10px] text-muted-foreground italic flex items-center">
              Final step — topic complete.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressionStrip;
