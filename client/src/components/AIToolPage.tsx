/**
 * AIToolPage — reusable shell for all AI tool pages.
 * Handles: form → generate → display → edit (AI or manual) → save/print/PDF
 */
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Sparkles, RefreshCw, Printer, Download, Copy, Save, ChevronLeft,
  PenLine, X, Check, Loader2, Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { callAI } from "@/lib/ai";
import { downloadHtmlAsPdf, printWorksheetElement } from "@/lib/pdf-generator-v2";
import { useApp } from "@/contexts/AppContext";

export interface AIToolField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  span?: "full" | "half";
  maxLength?: number;
  hint?: string; // helper text shown below the field
}

interface AIToolPageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string; // tailwind bg class e.g. "bg-purple-600"
  fields: AIToolField[];
  buildPrompt: (values: Record<string, string>) => { system: string; user: string; maxTokens?: number };
  formatOutput?: (text: string) => string;
  outputTitle?: (values: Record<string, string>) => string;
  savedCategory?: string;
  assignable?: boolean; // whether this tool output can be assigned to a student
  onResult?: (text: string, values: Record<string, string>) => void;
}

function formatAIText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^#{1,3} (.+)$/gm, "<h3 class='font-bold text-base mt-4 mb-1'>$1</h3>")
    .replace(/^[•\-\*] (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 list-decimal'>$2</li>")
    .replace(/\n{2,}/g, "</p><p class='mb-2'>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p class='mb-2'>")
    .replace(/$/, "</p>");
}

type EditMode = "none" | "manual" | "ai";

export default function AIToolPage({
  title, description, icon, accentColor, fields, buildPrompt, formatOutput, outputTitle, onResult, assignable,
}: AIToolPageProps) {
  const { children, assignWork } = useApp();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("");
  const outputRef = useRef<HTMLDivElement>(null);
  // Edit state
  const [editMode, setEditMode] = useState<EditMode>("none");
  const [manualText, setManualText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiEditLoading, setAiEditLoading] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const handleAssign = (childId: string) => {
    if (!result) return;
    const outputTitleStr = outputTitle ? outputTitle(values) : title;
    assignWork(childId, { title: outputTitleStr, type: title.toLowerCase().replace(/\s+/g, "-"), content: result });
    setShowAssignDialog(false);
    toast.success("Assigned to student!");
  };

  const setValue = (id: string, val: string) => setValues(prev => ({ ...prev, [id]: val }));

  const handleGenerate = async () => {
    const missing = fields.filter(f => f.required && !values[f.id]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map(f => f.label).join(", ")}`);
      return;
    }
    setLoading(true);
    setResult(null);
    setEditMode("none");
    try {
      const { system, user, maxTokens } = buildPrompt(values);
      const { text, provider: p } = await callAI(system, user, maxTokens || 2500);
      setResult(text);
      setProvider(p);
      onResult?.(text, values);
      toast.success("Generated successfully!");
    } catch (err) {
      toast.error("Generation failed. Please try again.");
      console.error(err);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
  };

  const handlePrint = () => {
    if (!outputRef.current) return;
    printWorksheetElement(outputRef.current, { title: outputTitle?.(values) || title });
  };

  const handlePdf = async () => {
    if (!outputRef.current) return;
    toast.info("Generating PDF...");
    try {
      const filename = `${(outputTitle?.(values) || title).replace(/\s+/g, "_")}.pdf`;
      await downloadHtmlAsPdf(outputRef.current, filename);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("PDF generation failed. Try Print instead.");
    }
  };

  // ── AI edit ─────────────────────────────────────────────────────────────────
  const handleAiEdit = async () => {
    if (!aiPrompt.trim() || !result) return;
    setAiEditLoading(true);
    try {
      const system = `You are an expert SEND teacher editing AI-generated educational content. Apply the user's instruction to the content and return the full updated content. Keep the same general format and structure. Return only the updated content — no extra commentary.`;
      const user = `Tool: ${title}\nCurrent content:\n${result}\n\nInstruction: ${aiPrompt}\n\nReturn the full updated content:`;
      const { text } = await callAI(system, user, 3000);
      setResult(text.trim());
      setEditMode("none");
      setAiPrompt("");
      toast.success("Content updated with AI!");
    } catch {
      toast.error("AI edit failed. Please try again.");
    }
    setAiEditLoading(false);
  };

  const formattedOutput = result ? (formatOutput ? formatOutput(result) : formatAIText(result)) : "";

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className={`rounded-xl p-5 mb-4 text-white ${accentColor}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h1 className="font-bold text-lg">{title}</h1>
              <p className="text-white/80 text-sm">{description}</p>
            </div>
          </div>
        </div>

        {!result ? (
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {fields.map(field => (
                  <div key={field.id} className={`space-y-1.5 ${field.span === "full" ? "col-span-2" : ""}`}>
                    <label className="text-xs font-medium text-foreground">
                      {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={values[field.id] || ""}
                        onChange={e => setValue(field.id, e.target.value)}
                        className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
                      >
                        <option value="">Select...</option>
                        {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        value={values[field.id] || ""}
                        onChange={e => setValue(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={values[field.id] || ""}
                        onChange={e => {
                          const val = field.maxLength ? e.target.value.slice(0, field.maxLength) : e.target.value;
                          setValue(field.id, val);
                        }}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    )}
                    {field.hint && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{field.hint}</p>
                    )}
                  </div>
                ))}
              </div>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full h-11 bg-brand hover:bg-brand/90 text-white"
              >
                {loading
                  ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  : <><Sparkles className="w-4 h-4 mr-2" />Generate with AI</>
                }
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="outline" size="sm" onClick={() => { setResult(null); setEditMode("none"); }}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />New
              </Button>
              {provider && (
                <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />{provider}
                </Badge>
              )}
              <div className="ml-auto flex flex-wrap gap-2">
                {/* Edit buttons — only shown when not in edit mode */}
                {editMode === "none" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-brand/40 text-brand hover:bg-brand-light"
                      onClick={() => setEditMode("ai")}
                    >
                      <Sparkles className="w-3.5 h-3.5" />Edit with AI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => { setManualText(result); setEditMode("manual"); }}
                    >
                      <PenLine className="w-3.5 h-3.5" />Edit Manually
                    </Button>
                  </>
                )}
                {/* Cancel buttons in edit mode */}
                {editMode === "ai" && (
                  <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-300"
                    onClick={() => { setEditMode("none"); setAiPrompt(""); }}>
                    <X className="w-3.5 h-3.5" />Cancel
                  </Button>
                )}
                {editMode === "manual" && (
                  <>
                    <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-300"
                      onClick={() => setEditMode("none")}>
                      <X className="w-3.5 h-3.5" />Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-brand hover:bg-brand/90 text-white gap-1.5"
                      onClick={() => { setResult(manualText); setEditMode("none"); toast.success("Changes saved!"); }}
                    >
                      <Check className="w-3.5 h-3.5" />Save Changes
                    </Button>
                  </>
                )}
                {assignable && children && children.length > 0 && (
                  <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 border-blue-300 text-blue-600 hover:bg-blue-50">
                        <Users className="w-3.5 h-3.5" />Assign to Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm">
                      <DialogHeader>
                        <DialogTitle>Assign to Student</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground mb-3">Select a student to assign this output to:</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {children.map(child => (
                          <button
                            key={child.id}
                            className="w-full text-left px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm flex items-center gap-2"
                            onClick={() => handleAssign(child.id)}
                          >
                            <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand">
                              {child.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="font-medium">{child.name}</span>
                            {child.yearGroup && <span className="text-muted-foreground text-xs ml-auto">{child.yearGroup}</span>}
                          </button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="w-3.5 h-3.5 mr-1" />Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5 mr-1" />Print
                </Button>
                <Button variant="outline" size="sm" onClick={handlePdf}>
                  <Download className="w-3.5 h-3.5 mr-1" />PDF
                </Button>
              </div>
            </div>

            {/* AI edit panel */}
            {editMode === "ai" && (
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
                  disabled={aiEditLoading}
                  onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAiEdit(); }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-brand hover:bg-brand/90 text-white gap-1.5"
                    onClick={handleAiEdit}
                    disabled={aiEditLoading}
                  >
                    {aiEditLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Editing…</>
                      : <><Sparkles className="w-3.5 h-3.5" />Apply AI Edit</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditMode("none"); setAiPrompt(""); }} disabled={aiEditLoading}>
                    <X className="w-3.5 h-3.5 mr-1" />Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Manual edit textarea */}
            {editMode === "manual" && (
              <Textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                className="text-sm font-mono min-h-[300px] resize-y"
              />
            )}

            {/* Output — hidden in manual edit mode */}
            {editMode !== "manual" && (
              <Card className="border-border/50">
                <CardContent className="p-6" ref={outputRef}>
                  {outputTitle && (
                    <h2 className="font-bold text-lg mb-4 text-foreground border-b pb-2">
                      {outputTitle(values)}
                    </h2>
                  )}
                  <div
                    className="prose prose-sm max-w-none text-foreground/90 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formattedOutput }}
                  />
                </CardContent>
              </Card>
            )}

            <Button variant="outline" onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Regenerating...</> : <><RefreshCw className="w-4 h-4 mr-2" />Regenerate</>}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
