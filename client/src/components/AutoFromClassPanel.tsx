/**
 * AutoFromClassPanel — Phase A · PR-2
 * ─────────────────────────────────────────────────────────────────────────────
 * "Auto from class" mode for the worksheet generator.
 *
 *   1. Teacher picks a class (yearGroup grouping today — see class-auto-brief).
 *   2. We render a read-only summary of the class: pupil count, tier mix,
 *      reading-age range, recent misconceptions to address.
 *   3. Teacher hits "Generate for {classLabel}" to dispatch via
 *      aiGenerateWorksheetFromClassBrief, OR "Edit in form" to switch back
 *      to Manual mode with subject/topic/yearGroup/sendNeed pre-filled.
 *
 * The form is never hidden behind a feature flag and is never the wrong
 * choice — Auto is an optional fast path on top of it.
 */
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Users, AlertCircle, Pencil } from "lucide-react";
import type { Child } from "@/contexts/AppContext";
import {
  buildClassAutoBrief,
  classAutoBriefIsUsable,
  type ClassAutoBrief,
} from "@/lib/class-auto-brief";

export interface AutoFromClassPrefill {
  subject: string;
  topic: string;
  yearGroup: string;
  sendNeed: string;
  readingAge: number;
}

interface Props {
  pupils: Child[];
  /** The currently-selected subject in the form, used to look up a
   *  suggestedTopic for the brief. May be empty — the empty-state
   *  copy explains how to fix it. */
  subject: string;
  selectedClassId: string;
  onClassChange: (classId: string) => void;
  /** Called when the teacher clicks "Generate". The parent owns the
   *  loading state, so this returns void. */
  onGenerate: (brief: ClassAutoBrief) => void;
  /** Called when the teacher clicks "Edit in form". The parent should
   *  flip the mode to Manual and pre-fill the form fields. */
  onEditInForm: (prefill: AutoFromClassPrefill) => void;
  /** Disable the action buttons while a generation is running. */
  busy?: boolean;
}

export function AutoFromClassPanel({
  pupils,
  subject,
  selectedClassId,
  onClassChange,
  onGenerate,
  onEditInForm,
  busy = false,
}: Props) {
  // Distinct yearGroups become the class options. Sorted naturally.
  const classOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of pupils) if (c.yearGroup) set.add(c.yearGroup);
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [pupils]);

  const [missingSubjectHinted, setMissingSubjectHinted] = useState(false);

  const brief: ClassAutoBrief | null = useMemo(() => {
    if (!selectedClassId) return null;
    return buildClassAutoBrief(selectedClassId, pupils, { subject: subject || undefined });
  }, [selectedClassId, pupils, subject]);

  const usable = brief ? classAutoBriefIsUsable(brief) : false;
  const usableWithoutTopic = brief ? classAutoBriefIsUsable(brief, { requireTopic: false }) : false;

  const handleGenerate = () => {
    if (!brief) return;
    if (!usable) {
      // Action is disabled but defend in depth.
      setMissingSubjectHinted(true);
      return;
    }
    onGenerate(brief);
  };

  const handleEditInForm = () => {
    if (!brief) return;
    onEditInForm({
      subject: brief.suggestedSubject || subject || "",
      topic: brief.suggestedTopic || "",
      yearGroup: brief.classLabel || "",
      sendNeed: brief.sendNeeds.length === 1 ? brief.sendNeeds[0] : "",
      readingAge: brief.readingAgeRange.max || 0,
    });
  };

  const tm = brief?.tierMix;
  const tierTotal = tm ? tm.foundation + tm.core + tm.higher + tm.send : 0;

  return (
    <div className="space-y-5">
      {/* Class picker */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Class</Label>
        <Select value={selectedClassId} onValueChange={onClassChange}>
          <SelectTrigger className="h-10" data-testid="auto-from-class-picker">
            <SelectValue placeholder={classOptions.length === 0 ? "No pupils on roster yet" : "Pick a class"} />
          </SelectTrigger>
          <SelectContent>
            {classOptions.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground">
          Classes are grouped by year group. Pick one to see who's in it and what to teach next.
        </p>
      </div>

      {/* Empty / not-yet-picked state */}
      {!brief && classOptions.length > 0 && (
        <div className="rounded-xl border border-dashed border-border/60 bg-slate-50/50 p-6 text-center text-sm text-muted-foreground">
          Pick a class above to see the suggested topic and pupil mix.
        </div>
      )}

      {/* No pupils on roster */}
      {classOptions.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800">
            <strong>No pupils on roster yet.</strong> Add at least one pupil under <em>Pupils</em> to use Auto from class.
            You can still create worksheets in the Manual tab.
          </div>
        </div>
      )}

      {/* Brief summary chips + action buttons */}
      {brief && (
        <div className="rounded-xl border border-border/40 bg-slate-50/50 p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-brand/70" />
              {brief.classLabel}
              <Badge variant="secondary" className="text-[10px]">
                {brief.pupilCount} pupil{brief.pupilCount === 1 ? "" : "s"}
              </Badge>
            </h4>
          </div>

          {/* Topic chip */}
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Suggested topic</Label>
            {brief.suggestedTopic ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge className="bg-brand/10 text-brand-700 hover:bg-brand/15">{brief.suggestedTopic}</Badge>
                {brief.suggestedSubject && (
                  <Badge variant="outline" className="text-[10px]">{brief.suggestedSubject}</Badge>
                )}
              </div>
            ) : (
              <div className="mt-1 text-xs text-muted-foreground italic">
                {subject
                  ? "No topic recorded yet for this class. Use Edit in form to enter one manually."
                  : "Pick a Subject in the Manual tab first, or use Edit in form to enter a topic."}
              </div>
            )}
          </div>

          {/* Tier mix */}
          {tierTotal > 0 && (
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Tier mix</Label>
              <div className="mt-1 flex gap-1.5 flex-wrap">
                {tm!.foundation > 0 && <Badge variant="outline" className="text-[10px]">{tm!.foundation} foundation</Badge>}
                {tm!.core       > 0 && <Badge variant="outline" className="text-[10px]">{tm!.core} core</Badge>}
                {tm!.higher     > 0 && <Badge variant="outline" className="text-[10px]">{tm!.higher} higher</Badge>}
                {tm!.send       > 0 && <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-800">{tm!.send} SEND</Badge>}
              </div>
            </div>
          )}

          {/* Reading-age range */}
          {brief.readingAgeRange.max > 0 && (
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Reading age</Label>
              <div className="mt-1 text-xs">
                {brief.readingAgeRange.min === brief.readingAgeRange.max
                  ? `~${brief.readingAgeRange.max}`
                  : `${brief.readingAgeRange.min}–${brief.readingAgeRange.max}`}
              </div>
            </div>
          )}

          {/* Class will see (top 3 misconceptions) */}
          {brief.recentMisconceptions.length > 0 && (
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Class will see (top 3)</Label>
              <ul className="mt-1 text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                {brief.recentMisconceptions.slice(0, 3).map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* SEND needs in class */}
          {brief.sendNeeds.length > 0 && (
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">SEND in class</Label>
              <div className="mt-1 flex gap-1.5 flex-wrap">
                {brief.sendNeeds.slice(0, 6).map((s, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] border-amber-200 text-amber-800">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Empty-state hint when class is fine but topic is missing */}
          {!usable && usableWithoutTopic && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>
                {subject
                  ? `No upcoming lesson scheduled for ${brief.classLabel}. Use "Edit in form" to enter a topic manually.`
                  : `Pick a Subject in the Manual tab first so we can suggest a topic, or use "Edit in form" to enter one manually.`}
              </span>
            </div>
          )}
          {missingSubjectHinted && !usable && (
            <div className="text-[11px] text-amber-700">Add a topic via "Edit in form" before generating.</div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleGenerate}
              disabled={busy || !usable}
              className="bg-brand hover:bg-brand/90 text-white"
              size="sm"
              data-testid="auto-from-class-generate"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Generate for {brief.classLabel}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditInForm}
              disabled={busy}
              data-testid="auto-from-class-edit-in-form"
            >
              <Pencil className="w-4 h-4 mr-1.5" />
              Edit in form
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutoFromClassPanel;
