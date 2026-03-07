/**
 * AIToolPage — reusable shell for all AI tool pages.
 * Handles: form → generate → display → save/print/PDF
 */
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw, Printer, Download, Copy, Save, ChevronLeft } from "lucide-react";
import { callAI } from "@/lib/ai";
import { downloadHtmlAsPdf, printWorksheetElement } from "@/lib/pdf-generator-v2";

export interface AIToolField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  span?: "full" | "half";
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

export default function AIToolPage({
  title, description, icon, accentColor, fields, buildPrompt, formatOutput, outputTitle,
}: AIToolPageProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("");
  const outputRef = useRef<HTMLDivElement>(null);

  const setValue = (id: string, val: string) => setValues(prev => ({ ...prev, [id]: val }));

  const handleGenerate = async () => {
    const missing = fields.filter(f => f.required && !values[f.id]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map(f => f.label).join(", ")}`);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { system, user, maxTokens } = buildPrompt(values);
      const { text, provider: p } = await callAI(system, user, maxTokens || 2500);
      setResult(text);
      setProvider(p);
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
                        onChange={e => setValue(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
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
              <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />New
              </Button>
              {provider && (
                <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />{provider}
                </Badge>
              )}
              <div className="ml-auto flex gap-2">
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

            {/* Output */}
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

            <Button variant="outline" onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Regenerating...</> : <><RefreshCw className="w-4 h-4 mr-2" />Regenerate</>}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
