import { useState, useCallback } from "react";
import { callAI } from "@/lib/ai";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { AlignLeft, ArrowRight, Copy, Check, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const readingLevels = [
  { value: "age-5-6",        label: "Age 5–6 (Reception / Y1)" },
  { value: "age-7-8",        label: "Age 7–8 (Year 2–3)" },
  { value: "age-9-10",       label: "Age 9–10 (Year 4–5)" },
  { value: "age-11-12",      label: "Age 11–12 (Year 6–7)" },
  { value: "age-13-14",      label: "Age 13–14 (Year 8–9)" },
  { value: "age-15-16",      label: "Age 15–16 (Year 10–11)" },
  { value: "age-17-plus",    label: "Age 17+ (Sixth Form / Adult)" },
  { value: "simple-send",    label: "Simplified — SEND/SEN support" },
  { value: "eal-beginner",   label: "EAL Beginner" },
  { value: "eal-intermediate", label: "EAL Intermediate" },
];

const purposes = [
  { value: "simplify",    label: "Simplify (make easier)" },
  { value: "extend",      label: "Extend (make harder)" },
  { value: "eal",         label: "Adapt for EAL learners" },
  { value: "send",        label: "Adapt for SEND learners" },
  { value: "formal",      label: "Make more formal/academic" },
  { value: "accessible",  label: "Make more accessible" },
];

const supports = [
  { value: "none",      label: "None" },
  { value: "vocab",     label: "Key vocabulary glossary" },
  { value: "questions", label: "Comprehension questions" },
  { value: "both",      label: "Both" },
];

const preservation = [
  { value: "strict",   label: "Strict — preserve all key facts" },
  { value: "moderate", label: "Moderate — preserve main ideas" },
  { value: "loose",    label: "Loose — simplify freely" },
];

/** Count approximate words in a string */
function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Rough Flesch-Kincaid Grade Level estimate */
function readabilityScore(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 4).length || 1;
  const words = wordCount(text) || 1;
  const syllables = text.replace(/[^aeiouAEIOU]/g, "").length || 1;
  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
}

function DiffStats({ original, rewritten }: { original: string; rewritten: string }) {
  const origWords = wordCount(original);
  const newWords = wordCount(rewritten);
  const wordDiff = newWords - origWords;
  const origGrade = readabilityScore(original);
  const newGrade  = readabilityScore(rewritten);
  const gradeDiff = newGrade - origGrade;

  return (
    <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm">
      <div className="flex items-center gap-1.5">
        <BarChart2 className="w-4 h-4 text-slate-400" />
        <span className="text-slate-500">Word count:</span>
        <span className="font-semibold text-slate-800">{origWords} → {newWords}</span>
        <Badge variant="outline" className={wordDiff <= 0 ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-sky-700 border-sky-200 bg-sky-50"}>
          {wordDiff > 0 ? `+${wordDiff}` : wordDiff}
        </Badge>
      </div>
      <div className="w-px h-5 bg-slate-200" />
      <div className="flex items-center gap-1.5">
        <span className="text-slate-500">Reading grade:</span>
        <span className="font-semibold text-slate-800">{origGrade.toFixed(1)} → {newGrade.toFixed(1)}</span>
        <Badge variant="outline" className={gradeDiff <= 0 ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-amber-700 border-amber-200 bg-amber-50"}>
          {gradeDiff > 0 ? `+${gradeDiff.toFixed(1)}` : gradeDiff.toFixed(1)} grade levels
        </Badge>
      </div>
    </div>
  );
}

export default function TextRewriter() {
  const { preferences } = useUserPreferences();
  const [originalText, setOriginalText] = useState("");
  const [purpose, setPurpose]           = useState("simplify");
  const [targetLevel, setTargetLevel]   = useState("age-9-10");
  const [preserve, setPreserve]         = useState("moderate");
  const [addSupports, setAddSupports]   = useState("none");
  const [loading, setLoading]           = useState(false);
  const [rewritten, setRewritten]       = useState<string | null>(null);
  const [copied, setCopied]             = useState(false);

  const handleRewrite = useCallback(async () => {
    if (!originalText.trim()) { toast.error("Please paste some text to rewrite."); return; }
    setLoading(true);
    setRewritten(null);
    try {
      const { text } = await callAI(
        `You are an expert UK teacher and literacy specialist. Rewrite texts to be accessible for different learners while preserving key content and meaning. Adjust vocabulary, sentence complexity, and structure to match the target level.`,
        `Rewrite the following text.

Purpose: ${purpose}
Target Level: ${targetLevel}
Content Preservation: ${preserve}

Original Text:
${originalText}

Requirements:
- Adjust vocabulary and sentence length to match the target level
${purpose === "simplify" || purpose === "send" || purpose === "eal" ? "- Use shorter sentences, simpler words, and clearer structure" : ""}
${purpose === "extend" || purpose === "formal" ? "- Use sophisticated vocabulary, complex sentences, and academic language" : ""}
${purpose === "eal" ? "- Avoid idioms, use literal language, define any cultural references" : ""}
${purpose === "send" ? "- Use visual structure (bullet points, bold key words), short sentences, active voice" : ""}
- Preserve the key information and meaning
${addSupports === "vocab" || addSupports === "both" ? "\nAfter the rewritten text, add a KEY VOCABULARY section with definitions for any challenging words." : ""}
${addSupports === "questions" || addSupports === "both" ? "\nAfter the rewritten text, add 3–5 COMPREHENSION QUESTIONS to check understanding." : ""}

Output ONLY the rewritten text and any requested supports. Do NOT include headings like "Rewritten:" or "Original:".`,
        2500,
      );
      setRewritten(text.trim());
      toast.success("Text rewritten!");
    } catch {
      toast.error("Rewrite failed. Please try again.");
    }
    setLoading(false);
  }, [originalText, purpose, targetLevel, preserve, addSupports]);

  const handleCopy = useCallback(async () => {
    if (!rewritten) return;
    await navigator.clipboard.writeText(rewritten);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [rewritten]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center flex-shrink-0">
          <AlignLeft className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Text Rewriter</h1>
          <p className="text-sm text-gray-500">Rewrite any text — see original and rewritten side by side</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <Label>Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{purposes.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Target Reading Level</Label>
              <Select value={targetLevel} onValueChange={setTargetLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{readingLevels.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Content Preservation</Label>
              <Select value={preserve} onValueChange={setPreserve}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{preservation.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Add Learning Supports</Label>
              <Select value={addSupports} onValueChange={setAddSupports}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{supports.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleRewrite} disabled={loading || !originalText.trim()} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold">
            {loading ? "Rewriting…" : "Rewrite Text"}
            {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </CardContent>
      </Card>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-gray-700">Original Text</Label>
            <span className="text-xs text-gray-400">{wordCount(originalText)} words</span>
          </div>
          <Textarea
            value={originalText}
            onChange={e => setOriginalText(e.target.value)}
            placeholder="Paste the text you want to rewrite here…"
            className="min-h-[320px] resize-y font-mono text-sm border-gray-200 focus:border-cyan-400"
          />
        </div>

        {/* Rewritten */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-gray-700">Rewritten Text</Label>
            <div className="flex items-center gap-2">
              {rewritten && <span className="text-xs text-gray-400">{wordCount(rewritten)} words</span>}
              {rewritten && (
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-800 font-medium">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          </div>
          <div className={`min-h-[320px] rounded-lg border p-3 text-sm whitespace-pre-wrap font-mono leading-relaxed ${
            loading ? "bg-gray-50 border-dashed border-gray-200 text-gray-400 animate-pulse" :
            rewritten ? "bg-white border-cyan-200" : "bg-gray-50 border-dashed border-gray-200 text-gray-400"
          }`}>
            {loading ? "Rewriting…" : rewritten || "The rewritten text will appear here after you click Rewrite."}
          </div>
        </div>
      </div>

      {/* Diff stats — shown when both sides have content */}
      {rewritten && originalText.trim() && (
        <DiffStats original={originalText} rewritten={rewritten} />
      )}
    </div>
  );
}
