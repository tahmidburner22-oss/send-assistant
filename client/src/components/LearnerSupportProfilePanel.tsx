import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Child } from "@/contexts/AppContext";
import {
  activeTemporaryAdjustments,
  learnerSupportHeadline,
  normaliseLearnerSupportProfile,
  type LearnerSupportProfile,
  type TemporarySupportAdjustment,
} from "@/lib/learnerSupportProfile";

const listToText = (items: string[]) => items.join("\n");
const textToList = (value: string) => value.split("\n").map(item => item.trim()).filter(Boolean).slice(0, 12);

interface LearnerSupportProfilePanelProps {
  pupil: Child;
  onSave: (profile: LearnerSupportProfile) => Promise<void>;
}

/**
 * Teacher-authored provision editor. It intentionally describes what helps the
 * pupil access learning; it is not a screening or diagnostic interface.
 */
export default function LearnerSupportProfilePanel({ pupil, onSave }: LearnerSupportProfilePanelProps) {
  const initialProfile = useMemo(() => normaliseLearnerSupportProfile(pupil.learnerSupportProfile || {}), [pupil.id, pupil.learnerSupportProfile]);
  const [profile, setProfile] = useState<LearnerSupportProfile>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adjustmentLabel, setAdjustmentLabel] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  useEffect(() => {
    setProfile(initialProfile);
    setSaved(false);
  }, [initialProfile]);

  const activeAdjustments = activeTemporaryAdjustments(profile);
  const listFields: Array<{ label: string; help: string; key: "strengths" | "barriers" | "successfulStrategies" }> = [
    { label: "Strengths to use", help: "Build engagement through interests, confidence and successful approaches.", key: "strengths" },
    { label: "Access barriers", help: "Describe the barrier to access, not a diagnosis or assumption.", key: "barriers" },
    { label: "Strategies that help", help: "Use one strategy per line; these will appear in opt-in tool context.", key: "successfulStrategies" },
  ];
  const update = (patch: Partial<LearnerSupportProfile>) => {
    setProfile(current => ({ ...current, ...patch }));
    setSaved(false);
  };

  const addAdjustment = () => {
    const label = adjustmentLabel.trim();
    if (!label) return;
    const adjustment: TemporarySupportAdjustment = {
      id: `support-${Date.now()}`,
      label,
      reason: adjustmentReason.trim(),
      active: true,
    };
    update({ temporaryAdjustments: [...profile.temporaryAdjustments, adjustment].slice(0, 8) });
    setAdjustmentLabel("");
    setAdjustmentReason("");
  };

  const removeAdjustment = (id: string) => update({ temporaryAdjustments: profile.temporaryAdjustments.filter(item => item.id !== id) });

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ ...profile, reviewedAt: new Date().toISOString() });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-white">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold">Learner support profile</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Record access preferences and strategies that help this pupil learn. This supports teaching decisions; it is not a diagnostic or safeguarding record.
            </p>
          </div>
          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-white border border-indigo-100 text-indigo-700">
            {learnerSupportHeadline(profile)}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {listFields.map(({ label, help, key }) => (
            <label key={key} className="rounded-xl border border-indigo-100 bg-white p-3 space-y-1.5">
              <span className="text-xs font-semibold">{label}</span>
              <span className="block text-[10px] text-muted-foreground leading-relaxed">{help}</span>
              <textarea
                className="w-full min-h-[88px] rounded-lg border border-input bg-background px-2.5 py-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={listToText(profile[key])}
                onChange={event => update({ [key]: textToList(event.target.value) })}
                placeholder="One item per line"
              />
            </label>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <fieldset className="rounded-xl border border-indigo-100 bg-white p-3 space-y-2">
            <legend className="px-1 text-xs font-semibold">Accessible presentation</legend>
            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              <label className="space-y-1">Font scale
                <select className="w-full rounded-lg border border-input bg-background px-2 py-1.5" value={profile.accessibility.fontScale} onChange={event => update({ accessibility: { ...profile.accessibility, fontScale: event.target.value as LearnerSupportProfile["accessibility"]["fontScale"] } })}>
                  <option value="standard">Standard</option><option value="large">Large</option><option value="extra-large">Extra large</option>
                </select>
              </label>
              <label className="space-y-1">Line spacing
                <select className="w-full rounded-lg border border-input bg-background px-2 py-1.5" value={profile.accessibility.lineSpacing} onChange={event => update({ accessibility: { ...profile.accessibility, lineSpacing: event.target.value as LearnerSupportProfile["accessibility"]["lineSpacing"] } })}>
                  <option value="standard">Standard</option><option value="spacious">Spacious</option><option value="extra-spacious">Extra spacious</option>
                </select>
              </label>
              {[
                ["highContrast", "High-contrast boundaries"],
                ["reduceVisualClutter", "Reduce visual clutter"],
                ["useVisualSupports", "Use visual supports"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-2 cursor-pointer">
                  <input type="checkbox" checked={Boolean(profile.accessibility[key as keyof LearnerSupportProfile["accessibility"]])} onChange={event => update({ accessibility: { ...profile.accessibility, [key]: event.target.checked } })} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-indigo-100 bg-white p-3 space-y-2">
            <legend className="px-1 text-xs font-semibold">Communication and scaffolding</legend>
            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              <label className="space-y-1">Instruction style
                <select className="w-full rounded-lg border border-input bg-background px-2 py-1.5" value={profile.communication.instructionStyle} onChange={event => update({ communication: { ...profile.communication, instructionStyle: event.target.value as LearnerSupportProfile["communication"]["instructionStyle"] } })}>
                  <option value="direct">Direct and literal</option><option value="invitational">Invitational</option><option value="choice-led">Choice-led</option>
                </select>
              </label>
              <label className="space-y-1">Scaffold entry point
                <select className="w-full rounded-lg border border-input bg-background px-2 py-1.5" value={profile.scaffoldingLevel} onChange={event => update({ scaffoldingLevel: event.target.value as LearnerSupportProfile["scaffoldingLevel"] })}>
                  <option value="independent">Independent</option><option value="prompted">Prompted</option><option value="part-modelled">Part-modelled</option><option value="modelled">Modelled</option>
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-2 cursor-pointer"><input type="checkbox" checked={profile.communication.processingTime === "extended"} onChange={event => update({ communication: { ...profile.communication, processingTime: event.target.checked ? "extended" : "standard" } })} />Extended processing time</label>
              <label className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-2 cursor-pointer"><input type="checkbox" checked={profile.communication.vocabularySupport} onChange={event => update({ communication: { ...profile.communication, vocabularySupport: event.target.checked } })} />Vocabulary support</label>
              <label className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-2 cursor-pointer"><input type="checkbox" checked={profile.communication.sentenceFrames} onChange={event => update({ communication: { ...profile.communication, sentenceFrames: event.target.checked } })} />Sentence frames</label>
            </div>
          </fieldset>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="rounded-xl border border-indigo-100 bg-white p-3 space-y-1.5">
            <span className="text-xs font-semibold">Pupil voice</span>
            <span className="block text-[10px] text-muted-foreground">Use the pupil’s own words where possible. Keep this focused on learning access.</span>
            <textarea className="w-full min-h-[64px] rounded-lg border border-input bg-background px-2.5 py-2 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-300" value={profile.pupilVoice} onChange={event => update({ pupilVoice: event.target.value.slice(0, 500) })} placeholder="For example: ‘I like one clear step at a time and a quiet start.’" />
          </label>
          <Button onClick={save} disabled={saving} className="gap-2 min-h-10">
            <CheckCircle2 className="w-4 h-4" />{saving ? "Saving…" : saved ? "Saved" : "Save reviewed support"}
          </Button>
        </div>

        <div className="rounded-xl border border-dashed border-indigo-200 bg-white/70 p-3 space-y-2">
          <div className="flex items-center gap-2"><Clock3 className="w-4 h-4 text-indigo-600" /><h3 className="text-xs font-semibold">Temporary support for a topic or fortnight</h3></div>
          <p className="text-[10px] text-muted-foreground">Use this for a time-limited adjustment. It is visible to opted-in tools and does not overwrite the long-term profile.</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
            <input className="rounded-lg border border-input bg-background px-2.5 py-2 text-xs" value={adjustmentLabel} onChange={event => setAdjustmentLabel(event.target.value)} placeholder="Adjustment, e.g. oral response" />
            <input className="rounded-lg border border-input bg-background px-2.5 py-2 text-xs" value={adjustmentReason} onChange={event => setAdjustmentReason(event.target.value)} placeholder="Reason or current lesson context" />
            <Button type="button" variant="outline" onClick={addAdjustment} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add</Button>
          </div>
          {activeAdjustments.length > 0 && <div className="flex flex-wrap gap-2 pt-1">{activeAdjustments.map(item => <span key={item.id} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] text-indigo-800">{item.label}<button type="button" aria-label={`Remove ${item.label}`} onClick={() => removeAdjustment(item.id)} className="rounded-full hover:bg-indigo-200"><X className="w-3 h-3" /></button></span>)}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
