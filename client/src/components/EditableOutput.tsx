/**
 * EditableOutput — reusable component for displaying AI-generated text content
 * with "Edit with AI" and "Edit Manually" buttons.
 *
 * Usage:
 *   <EditableOutput
 *     content={result}
 *     onContentChange={setResult}
 *     formatHtml={formatAIText}   // optional — renders HTML if provided
 *     context={{ subject, yearGroup, sendNeed }}  // optional — for AI edit context
 *   />
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Edit3, X, Check, Loader2, PenLine } from "lucide-react";
import { callAI } from "@/lib/ai";

interface EditableOutputProps {
  /** The raw text content to display / edit */
  content: string;
  /** Called whenever the content changes (manual or AI edit) */
  onContentChange: (newContent: string) => void;
  /** Optional: convert raw text to HTML for display */
  formatHtml?: (text: string) => string;
  /** Optional context passed to the AI when editing */
  context?: {
    subject?: string;
    yearGroup?: string;
    sendNeed?: string;
    title?: string;
  };
  /** Extra CSS classes for the display area */
  className?: string;
}

type EditMode = "none" | "manual" | "ai";

export default function EditableOutput({
  content,
  onContentChange,
  formatHtml,
  context,
  className = "",
}: EditableOutputProps) {
  const [mode, setMode] = useState<EditMode>("none");
  const [manualText, setManualText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ── Enter manual edit mode ──────────────────────────────────────────────────
  function startManual() {
    setManualText(content);
    setMode("manual");
  }

  // ── Save manual edits ───────────────────────────────────────────────────────
  function saveManual() {
    onContentChange(manualText);
    setMode("none");
    toast.success("Changes saved!");
  }

  // ── Cancel any edit ─────────────────────────────────────────────────────────
  function cancel() {
    setMode("none");
    setManualText("");
    setAiPrompt("");
  }

  // ── Run AI edit ─────────────────────────────────────────────────────────────
  async function runAiEdit() {
    if (!aiPrompt.trim()) {
      toast.error("Please describe what you'd like to change.");
      return;
    }
    setAiLoading(true);
    try {
      const system = `You are an expert SEND teacher editing AI-generated educational content. Apply the user's instruction to the content and return the full updated content. Keep the same general format and structure. Return only the updated content — no extra commentary.`;
      const user = `${context?.title ? `Title: ${context.title}\n` : ""}${context?.subject ? `Subject: ${context.subject}\n` : ""}${context?.yearGroup ? `Year Group: ${context.yearGroup}\n` : ""}${context?.sendNeed ? `SEND Need: ${context.sendNeed}\n` : ""}
Current content:
${content}

Instruction: ${aiPrompt}

Return the full updated content:`;
      const { text } = await callAI(system, user, 3000);
      onContentChange(text.trim());
      setMode("none");
      setAiPrompt("");
      toast.success("Content updated with AI!");
    } catch {
      toast.error("AI edit failed. Please try again.");
    }
    setAiLoading(false);
  }

  const displayHtml = formatHtml ? formatHtml(content) : null;

  return (
    <div className="space-y-3">
      {/* ── Edit mode toolbar ── */}
      {mode === "none" && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-brand/40 text-brand hover:bg-brand-light"
            onClick={() => setMode("ai")}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Edit with AI
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={startManual}
          >
            <PenLine className="w-3.5 h-3.5" />
            Edit Manually
          </Button>
        </div>
      )}

      {/* ── AI edit panel ── */}
      {mode === "ai" && (
        <div className="rounded-lg border border-brand/30 bg-brand-light/30 p-3 space-y-2">
          <p className="text-xs font-medium text-brand flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Describe what you'd like to change
          </p>
          <Textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="e.g. Make it simpler for Year 3, add more examples, shorten the introduction…"
            className="text-sm min-h-[80px] resize-none"
            disabled={aiLoading}
            onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runAiEdit(); }}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-brand hover:bg-brand/90 text-white gap-1.5"
              onClick={runAiEdit}
              disabled={aiLoading}
            >
              {aiLoading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Editing…</>
                : <><Sparkles className="w-3.5 h-3.5" />Apply AI Edit</>}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel} disabled={aiLoading}>
              <X className="w-3.5 h-3.5 mr-1" />Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Manual edit panel ── */}
      {mode === "manual" && (
        <div className="space-y-2">
          <Textarea
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            className="text-sm font-mono min-h-[200px] resize-y"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-brand hover:bg-brand/90 text-white gap-1.5"
              onClick={saveManual}
            >
              <Check className="w-3.5 h-3.5" />Save Changes
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>
              <X className="w-3.5 h-3.5 mr-1" />Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Content display (hidden in manual edit mode) ── */}
      {mode !== "manual" && (
        displayHtml ? (
          <div
            className={`prose prose-sm max-w-none text-foreground/90 leading-relaxed ${className}`}
            dangerouslySetInnerHTML={{ __html: displayHtml }}
          />
        ) : (
          <div className={`text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 ${className}`}>
            {content}
          </div>
        )
      )}
    </div>
  );
}
