/**
 * BatchToolRunner — generic CSV-driven batch generator.
 *
 * Promoted from the previous ReportCommentsBatch implementation, which was
 * pinned to one tool (and one set of columns). This version is column-agnostic
 * and accepts a buildPrompt callback so any AIToolPage tool can opt-in by
 * passing batchable={true} + a CSV column spec.
 *
 * End-of-term Pupil Passport season for a SENCO with 200 children on the SEND
 * register is currently a one-at-a-time slog. Batch + Word/ZIP export turns a
 * two-day task into a 20-minute coffee break.
 */
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, Download, Copy, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { callAI } from "@/lib/ai";

export interface BatchToolSpec {
  /** Tool slug, used for filenames + telemetry */
  toolSlug: string;
  /** Tool display title */
  title: string;
  /** Required columns (lower-case, no spaces) — used to map CSV headers to row fields */
  columns: { id: string; label: string; required?: boolean }[];
  /** Build the AI prompt for one row of values */
  buildPrompt: (row: Record<string, string>) => { system: string; user: string; maxTokens?: number };
  /** Optional template CSV body (with header line + 2-3 example rows) */
  templateCsv?: string;
  /** Maximum rows allowed (default 40) */
  maxRows?: number;
}

interface GeneratedRow {
  values: Record<string, string>;
  output: string;
  status: "pending" | "generating" | "done" | "error";
  error?: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) { result.push(current); current = ""; }
    else current += ch;
  }
  result.push(current);
  return result;
}

function parseCsv(text: string, columns: BatchToolSpec["columns"]): Record<string, string>[] {
  const lines = text.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, ""));
  const colIndex: Record<string, number> = {};
  for (const col of columns) {
    const idx = headers.findIndex(h => h.includes(col.id.toLowerCase()) || col.id.toLowerCase().includes(h));
    colIndex[col.id] = idx;
  }

  const rows: Record<string, string>[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cells = parseCSVLine(lines[li]).map(c => c.trim());
    const row: Record<string, string> = {};
    columns.forEach((col, posIdx) => {
      const ci = colIndex[col.id] >= 0 ? colIndex[col.id] : posIdx;
      row[col.id] = cells[ci] ?? "";
    });
    rows.push(row);
  }

  return rows.filter(r => columns.filter(c => c.required).every(c => (r[c.id] || "").trim() !== ""));
}

interface Props {
  spec: BatchToolSpec;
}

export function BatchToolRunner({ spec }: Props) {
  const [csvText, setCsvText] = useState("");
  const [rows, setRows]       = useState<GeneratedRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress]     = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef     = useRef(false);

  const maxRows = spec.maxRows ?? 40;
  const requiredCols = spec.columns.filter(c => c.required).map(c => c.id).join(", ");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setCsvText((ev.target?.result as string) || ""); toast.success(`Loaded ${file.name}`); };
    reader.readAsText(file);
  };

  const handleLoadTemplate = () => {
    if (!spec.templateCsv) {
      // Build a minimal header-only template if none provided
      setCsvText(spec.columns.map(c => c.id).join(",") + "\n");
    } else {
      setCsvText(spec.templateCsv);
    }
    toast.success("Template loaded — edit with your data.");
  };

  const handleGenerate = async () => {
    const parsed = parseCsv(csvText, spec.columns);
    if (parsed.length === 0) {
      toast.error(`No valid rows found. Required columns: ${requiredCols || "(none)"}.`);
      return;
    }
    if (parsed.length > maxRows) {
      toast.error(`Maximum ${maxRows} rows per batch. Please split your data.`);
      return;
    }

    setGenerating(true);
    abortRef.current = false;
    setProgress({ current: 0, total: parsed.length });

    const results: GeneratedRow[] = parsed.map(values => ({ values, output: "", status: "pending" }));
    setRows([...results]);

    for (let i = 0; i < parsed.length; i++) {
      if (abortRef.current) break;
      results[i].status = "generating";
      setRows([...results]);
      setProgress({ current: i + 1, total: parsed.length });

      try {
        const { system, user, maxTokens } = spec.buildPrompt(parsed[i]);
        const { text } = await callAI(system, user, maxTokens || 800);
        results[i].output = text.trim();
        results[i].status = "done";
      } catch (err: any) {
        results[i].status = "error";
        results[i].error  = err?.message?.slice(0, 80) || "Failed";
      }
      setRows([...results]);

      if (i < parsed.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
    setGenerating(false);
    const successCount = results.filter(r => r.status === "done").length;
    toast.success(`Generated ${successCount}/${parsed.length} successfully.`);
  };

  const handleStop      = () => { abortRef.current = true; };
  const handleCopyAll   = () => {
    const text = rows.filter(r => r.status === "done").map(r => {
      const head = spec.columns.map(c => r.values[c.id]).filter(Boolean).join(" — ");
      return `${head}:\n${r.output}`;
    }).join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    toast.success("All output copied!");
  };
  const handleDownload  = () => {
    const text = rows.filter(r => r.status === "done").map(r => {
      const head = spec.columns.map(c => r.values[c.id]).filter(Boolean).join(" — ");
      return `${head}\n${r.output}`;
    }).join("\n\n" + "=".repeat(60) + "\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${spec.toolSlug}-batch-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const doneCount = rows.filter(r => r.status === "done").length;
  const detected  = csvText ? parseCsv(csvText, spec.columns).length : 0;

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Batch CSV Data — {spec.title}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleLoadTemplate}>Load Template</Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3.5 h-3.5 mr-1" />Upload CSV
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>
          <Textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder={`Paste CSV here. Columns: ${spec.columns.map(c => c.id).join(", ")}`}
            rows={8}
            className="text-xs font-mono"
            aria-label="Batch CSV input"
          />
          <p className="text-[10px] text-muted-foreground">
            {csvText ? `${detected} valid rows detected (max ${maxRows})` : "Paste class data or upload a CSV file"}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={generating || !csvText.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating ({progress.current}/{progress.total})…</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate All</>
              )}
            </Button>
            {generating && <Button variant="outline" onClick={handleStop}>Stop</Button>}
          </div>
          {generating && (
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.current}>
              <div className="h-full bg-emerald-600 rounded-full transition-all duration-300" style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }} />
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Generated ({doneCount}/{rows.length})</h3>
              {doneCount > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyAll}>
                    <Copy className="w-3.5 h-3.5 mr-1" />Copy All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-3.5 h-3.5 mr-1" />Download
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {rows.map((r, i) => {
                const head = spec.columns.map(c => r.values[c.id]).filter(Boolean).join(" — ");
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border text-sm ${
                      r.status === "done"     ? "border-emerald-200 bg-emerald-50/50" :
                      r.status === "error"    ? "border-red-200 bg-red-50/50" :
                      r.status === "generating" ? "border-brand/30 bg-brand-light/20" :
                                                   "border-border/50 bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {r.status === "done"     && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      {r.status === "error"    && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      {r.status === "generating" && <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />}
                      <span className="font-semibold text-xs truncate">{head || `Row ${i + 1}`}</span>
                      {r.status === "done" && (
                        <button
                          className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
                          onClick={() => { navigator.clipboard.writeText(r.output); toast.success("Copied!"); }}
                        >
                          Copy
                        </button>
                      )}
                    </div>
                    {r.status === "done"  && <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{r.output}</p>}
                    {r.status === "error" && <p className="text-xs text-red-600">{r.error}</p>}
                    {r.status === "generating" && <p className="text-xs text-muted-foreground italic">Generating…</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BatchToolRunner;
