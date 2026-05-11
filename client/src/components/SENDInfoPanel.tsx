/**
 * SENDInfoPanel — Reusable component that shows SEND need info and what changes
 * will be made to generated content when a SEND need is selected.
 *
 * Used on: Worksheets (generate + upload tabs), Differentiate, StoriesContent,
 *          BookQuestionsTab, Children (scheduler).
 */
import { motion } from "framer-motion";
import { Info, Sparkles, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { sendNeeds } from "@/lib/send-data";

interface SENDInfoPanelProps {
  /**
   * The SEND need ID. Accepts both plain ids ("adhd", "asc") and the
   * compound sub-profile format the worksheet UI emits when an autism
   * sub-profile is selected (e.g. "asc:asc-demand-avoidant").
   */
  sendNeedId: string;
  /** Optional context label to customise the "What will change" heading */
  context?: "worksheet" | "story" | "differentiation" | "questions" | "scheduler";
  /** Optional extra className */
  className?: string;
}

const CONTEXT_LABELS: Record<string, string> = {
  worksheet: "What will change in your worksheet",
  story: "What will change in your story",
  differentiation: "What will change in the differentiated version",
  questions: "What will change in the generated questions",
  scheduler: "What will change in auto-generated worksheets",
};

export default function SENDInfoPanel({ sendNeedId, context = "worksheet", className = "" }: SENDInfoPanelProps) {
  if (!sendNeedId || sendNeedId === "none-selected" || sendNeedId === "none") return null;

  // The picker may emit "asc:asc-demand-avoidant". Look up the base need by
  // the part BEFORE the colon so we still show the shared description block;
  // highlight the sub-profile separately below.
  const [baseId, profileId] = sendNeedId.split(":");
  const need = sendNeeds.find(n => n.id === baseId) || sendNeeds.find(n => n.id === sendNeedId);
  if (!need) return null;
  const activeProfile = profileId && need.subProfiles
    ? need.subProfiles.find(p => p.id === profileId) || null
    : null;

  const heading = CONTEXT_LABELS[context] ?? CONTEXT_LABELS.worksheet;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-xl border border-purple-200 bg-purple-50 p-3 space-y-3 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-purple-800">{need.name}</span>
            <Badge className="text-[10px] bg-purple-100 text-purple-700 border-purple-200">{need.category}</Badge>
            {activeProfile && (
              <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                {activeProfile.name}
              </Badge>
            )}
          </div>
          {/* Structured description (Presentation / Barriers / What changes) when
              available — falls back to the flat description string otherwise. */}
          {need.descriptionBlocks ? (
            <div className="mt-2 space-y-2 bg-white/70 rounded-md border border-purple-100 p-2.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-purple-900">How it presents</p>
                <p className="text-xs text-purple-800 leading-relaxed">{need.descriptionBlocks.presentation}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-purple-900">Barriers on a standard worksheet</p>
                <p className="text-xs text-purple-800 leading-relaxed">{need.descriptionBlocks.barriers}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-purple-900">What the generator changes</p>
                <p className="text-xs text-purple-800 leading-relaxed">{need.descriptionBlocks.whatChanges}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-purple-700 mt-1 leading-relaxed">{need.description}</p>
          )}
          {activeProfile && (
            <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-md p-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-900">
                Sub-profile focus
              </p>
              <p className="text-xs text-emerald-800 leading-relaxed">
                <span className="font-semibold">{activeProfile.summary}.</span>{" "}
                {activeProfile.focus}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sub-profile picker hint — shown only when sub-profiles exist but none picked */}
      {!activeProfile && need.subProfiles && need.subProfiles.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
          <p className="text-[11px] font-semibold text-amber-900 mb-1">
            Pick a sub-profile for a more targeted adaptation
          </p>
          <ul className="space-y-0.5">
            {need.subProfiles.map(p => (
              <li key={p.id} className="text-[11px] text-amber-800 leading-relaxed">
                <span className="font-semibold">{p.name}</span> — {p.summary}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-amber-700 mt-1 italic">
            Without a sub-profile the generator uses the shared ASC adaptation.
          </p>
        </div>
      )}

      {/* Summary of changes */}
      {need.worksheetChanges && (
        <div className="bg-white/70 rounded-lg border border-purple-100 p-2.5 space-y-2">
          <p className="text-[11px] font-semibold text-purple-900 uppercase tracking-wide flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-purple-600" />
            {heading}
          </p>
          <p className="text-xs text-purple-800 italic leading-relaxed">{need.worksheetChanges.summary}</p>
          <div className="space-y-2 mt-1">
            {need.worksheetChanges.changes.map((c, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-start gap-1.5">
                  <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-xs font-medium text-purple-900">{c.what}</span>
                </div>
                <p className="text-[11px] text-purple-600 leading-relaxed ml-4">
                  <span className="font-medium text-purple-700">Why: </span>{c.why}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher notes reminder */}
      <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg p-2">
        <Info className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[11px] text-amber-800 leading-relaxed">
          <span className="font-semibold">Teacher section included:</span> The generated content will contain a private teacher-only section explaining every adaptation made and the evidence-based rationale for why it helps students with {activeProfile?.name || need.name}.
        </p>
      </div>
    </motion.div>
  );
}
