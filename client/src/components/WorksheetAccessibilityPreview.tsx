import { Eye, MessageSquareText, Printer, ScanLine } from "lucide-react";
import type { LearnerSupportProfile } from "@/lib/learnerSupportProfile";
import { buildAssessmentAccessPlan, normaliseLearnerSupportProfile } from "@/lib/learnerSupportProfile";

interface WorksheetAccessibilityPreviewProps {
  profile?: LearnerSupportProfile;
  protectedLayout?: boolean;
}

/**
 * A pre-generation access preview. It deliberately previews presentation and
 * response choices only: it cannot alter questions, marks, curriculum demand or
 * protected print geometry.
 */
export default function WorksheetAccessibilityPreview({ profile, protectedLayout = false }: WorksheetAccessibilityPreviewProps) {
  if (!profile) return null;
  const support = normaliseLearnerSupportProfile(profile);
  const assessmentAccess = buildAssessmentAccessPlan(support);
  const fontSize = support.accessibility.fontScale === "extra-large" ? "18px" : support.accessibility.fontScale === "large" ? "16px" : "14px";
  const lineHeight = support.accessibility.lineSpacing === "extra-spacious" ? 1.8 : support.accessibility.lineSpacing === "spacious" ? 1.55 : 1.35;
  const responseModes = assessmentAccess.responseRoutes;
  const chips = [
    support.accessibility.highContrast ? "High contrast" : null,
    support.accessibility.reduceVisualClutter ? "Reduced clutter" : null,
    support.accessibility.useVisualSupports ? "Visual supports" : null,
    support.communication.vocabularySupport ? "Vocabulary support" : null,
    support.communication.sentenceFrames ? "Sentence frames" : null,
    support.communication.processingTime === "extended" ? "Extended processing time" : null,
  ].filter(Boolean) as string[];

  return (
    <section className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 space-y-3" aria-label="Accessibility preview">
      <div className="flex items-start gap-2">
        <Eye className="h-4 w-4 text-sky-700 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-sky-950">Accessibility preview</p>
          <p className="text-[11px] leading-relaxed text-sky-800">This previews presentation preferences from the selected pupil’s reviewed support profile. It does not lower the objective, change marks or alter protected print geometry.</p>
        </div>
      </div>

      <div className={`rounded-lg border p-3 ${support.accessibility.highContrast ? "border-slate-950 bg-white text-slate-950" : "border-sky-200 bg-white text-slate-800"}`} style={{ fontSize, lineHeight }}>
        <p className="font-bold">Example task</p>
        <p className="mt-1">Explain one reason this method works. Use the key word if it helps.</p>
        {support.communication.sentenceFrames && <p className="mt-2 font-medium">Sentence frame: This works because ______.</p>}
        <div className="mt-3 border-b border-current/70 min-h-5" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {chips.length ? chips.map(chip => <span key={chip} className="rounded-full border border-sky-200 bg-white px-2 py-1 text-[10px] font-medium text-sky-900">{chip}</span>) : <span className="text-[10px] text-sky-800">Standard presentation preferences selected.</span>}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 text-[11px]">
        <div className="flex items-start gap-1.5 rounded-lg bg-white/75 p-2 text-sky-900"><MessageSquareText className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><b>Response routes:</b> {responseModes.join(", ")}. Teachers select the appropriate route; {assessmentAccess.demandInvariant.toLowerCase()}</span></div>
        <div className="flex items-start gap-1.5 rounded-lg bg-white/75 p-2 text-sky-900"><Printer className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span><b>Print protection:</b> {protectedLayout ? "The approved page count, boxes and layout are fixed." : "Print/export remains subject to the worksheet quality checks."}</span></div>
      </div>

      <p className="flex items-start gap-1.5 text-[10px] text-sky-800"><ScanLine className="h-3.5 w-3.5 mt-0.5 shrink-0" />Before sharing, review the generated fidelity evidence and the actual pupil view. {assessmentAccess.activeTemporaryAdjustments.length ? `Active review items: ${assessmentAccess.activeTemporaryAdjustments.join(", ")}. ` : ""}A preview is a planning aid, not proof that every support landed.</p>
    </section>
  );
}
