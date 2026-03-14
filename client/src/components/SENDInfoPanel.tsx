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
  /** The SEND need ID (e.g. "dyslexia", "adhd") */
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

  const need = sendNeeds.find(n => n.id === sendNeedId);
  if (!need) return null;

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
          </div>
          <p className="text-xs text-purple-700 mt-1 leading-relaxed">{need.description}</p>
        </div>
      </div>

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
          <span className="font-semibold">Teacher section included:</span> The generated content will contain a private teacher-only section explaining every adaptation made and the evidence-based rationale for why it helps students with {need.name}.
        </p>
      </div>
    </motion.div>
  );
}
