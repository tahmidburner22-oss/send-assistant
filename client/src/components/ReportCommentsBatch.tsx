/**
 * ReportCommentsBatch — generate report comments for an entire class at once.
 *
 * Teachers paste or upload a CSV with columns:
 *   initials, pronoun, subject, yearGroup, attainment, strengths, targets
 *
 * Then click "Generate All" — each row is processed sequentially via callAI
 * with a progress bar. Results are displayed in a scrollable list and can be
 * bulk-copied or downloaded as a text file.
 *
 * This is the single most-requested feature for end-of-term report writing.
 */
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, Download, Copy, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { callAI } from "@/lib/ai";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";

interface StudentRow {
  initials: string;
  pronoun: string;
  subject: string;
  yearGroup: string;
  attainment: string;
  strengths: string;
  targets: string;
  tone?: string;
  context?: string;
}

interface GeneratedComment {
  student: StudentRow;
  comment: string;
  status: "pending" | "generating" | "done" | "error";
  error?: string;
}

const CSV_TEMPLATE = `initials,pronoun,subject,yearGroup,attainment,strengths,targets
E.J.,She/her,Maths,Year 8,expected,Strong algebraic skills. Solved simultaneous equations independently.,Practise graph interpretation and apply to real-world contexts.
M.W.,He/him,Maths,Year 8,exceeding,Exceptional problem-solving. Won school maths challenge.,Explore A-level content as extension.
R.T.,They/them,Maths,Year 8,approaching,Good effort with fractions. Improved confidence in class.,Focus on multiplying decimals and checking answers systematically.`;

function parseCSV(text: string): StudentRow[] {
  const lines = text.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0].toLowerCase().replace(/\s+/g, "");
  const headers = headerLine.split(",").map(h => h.trim());

  // Map columns
  const colMap: Record<string, number> = {};
  const knownCols = ["initials", "pronoun", "subject", "yeargroup", "attainment", "strengths", "targets", "tone", "context"];
  headers.forEach((h, i) => {
    const match = knownCols.find(k => h.includes(k) || k.includes(h));
    if (match) colMap[match] = i;
  });

  if (!colMap.initials && colMap.initials !== 0) {
    // Try positional fallback
    if (headers.length >= 7) {
      colMap.initials = 0;
      colMap.pronoun = 1;
      colMap.subject = 2;
      colMap.yeargroup = 3;
      colMap.attainment = 4;
      colMap.strengths = 5;
      colMap.targets = 6;
    }
  }

  const rows: StudentRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Handle quoted fields
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 5) continue;

    rows.push({
      initials: cols[colMap.initials ?? 0]?.trim() || "",
      pronoun: cols[colMap.pronoun ?? 1]?.trim() || "They/them",
      subject: cols[colMap.subject ?? 2]?.trim() || "",
      yearGroup: cols[colMap.yeargroup ?? 3]?.trim() || "",
      attainment: cols[colMap.attainment ?? 4]?.trim() || "expected",
      strengths: cols[colMap.strengths ?? 5]?.trim() || "",
      targets: cols[colMap.targets ?? 6]?.trim() || "",
      tone: cols[colMap.tone ?? -1]?.trim() || "balanced",
      context: cols[colMap.context ?? -1]?.trim() || "",
    });
  }
  return rows.filter(r => r.initials && r.strengths);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function buildCommentPrompt(row: StudentRow, wordCount = 100): { system: string; user: string } {
  const subjectPronoun = row.pronoun?.split("/")[0] || "they";
  const objectPronoun = row.pronoun?.split("/")[1] || "them";
  const possessivePronoun = subjectPronoun === "she" ? "her" : subjectPronoun === "he" ? "his" : "their";

  const system = `You are an experienced UK school report writer. Write one professional, personalised report comment. Use ONLY ${subjectPronoun}/${objectPronoun}/${possessivePronoun} pronouns. Be specific, evidence-based, and parent-accessible. Include a concrete next step. Aim for ~${wordCount} words. Write ONLY the comment — no preamble.`;

  const user = `Student: ${row.initials} | ${row.subject} | ${row.yearGroup} | Attainment: ${row.attainment} | Tone: ${row.tone || "balanced"}
Strengths: ${row.strengths}
${row.targets ? `Targets: ${row.targets}` : ""}
${row.context ? `Context: ${row.context}` : ""}`;

  return { system, user };
}

export function ReportCommentsBatch() {
  const { preferences } = useUserPreferences();
  const [csvText, setCsvText] = useState("");
  const [comments, setComments] = useState<GeneratedComment[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text || "");
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      toast.error("No valid student rows found. Check your CSV format (needs: initials, pronoun, subject, yearGroup, attainment, strengths, targets).");
      return;
    }
    if (rows.length > 40) {
      toast.error("Maximum 40 students per batch. Please split your class list.");
      return;
    }

    setGenerating(true);
    abortRef.current = false;
    setProgress({ current: 0, total: rows.length });

    const results: GeneratedComment[] = rows.map(r => ({
      student: r,
      comment: "",
      status: "pending",
    }));
    setComments([...results]);

    for (let i = 0; i < rows.length; i++) {
      if (abortRef.current) break;

      results[i].status = "generating";
      setComments([...results]);
      setProgress({ current: i + 1, total: rows.length });

      try {
        const { system, user } = buildCommentPrompt(rows[i]);
        const { text } = await callAI(system, user, 600);
        results[i].comment = text.trim();
        results[i].status = "done";
      } catch (err: any) {
        results[i].status = "error";
        results[i].error = err.message?.slice(0, 80) || "Failed";
      }

      setComments([...results]);

      // Small delay between requests to avoid overwhelming rate limits
      if (i < rows.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setGenerating(false);
    const successCount = results.filter(r => r.status === "done").length;
    toast.success(`Generated ${successCount}/${rows.length} comments successfully.`);
  };

  const handleStop = () => {
    abortRef.current = true;
  };

  const handleCopyAll = () => {
    const text = comments
      .filter(c => c.status === "done")
      .map(c => `${c.student.initials} (${c.student.subject}):\n${c.comment}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    toast.success("All comments copied to clipboard!");
  };

  const handleDownload = () => {
    const text = comments
      .filter(c => c.status === "done")
      .map(c => `${c.student.initials} — ${c.student.subject} (${c.student.yearGroup})\n${c.comment}`)
      .join("\n\n" + "=".repeat(60) + "\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-comments-batch-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const handleLoadTemplate = () => {
    setCsvText(CSV_TEMPLATE);
    toast.success("Template loaded — edit with your class data");
  };

  const doneCount = comments.filter(c => c.status === "done").length;

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Class CSV Data</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleLoadTemplate}>
                Load Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3.5 h-3.5 mr-1" />Upload CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
          <Textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="Paste CSV here or upload a file. Columns: initials, pronoun, subject, yearGroup, attainment, strengths, targets"
            rows={8}
            className="text-xs font-mono"
          />
          <p className="text-[10px] text-muted-foreground">
            {csvText ? `${parseCSV(csvText).length} students detected` : "Paste your class data or upload a CSV file"}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={generating || !csvText.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating ({progress.current}/{progress.total})...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate All Comments</>
              )}
            </Button>
            {generating && (
              <Button variant="outline" onClick={handleStop}>
                Stop
              </Button>
            )}
          </div>

          {/* Progress bar */}
          {generating && (
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {comments.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Generated Comments ({doneCount}/{comments.length})
              </h3>
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
              {comments.map((c, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-sm ${
                    c.status === "done"
                      ? "border-emerald-200 bg-emerald-50/50"
                      : c.status === "error"
                      ? "border-red-200 bg-red-50/50"
                      : c.status === "generating"
                      ? "border-brand/30 bg-brand-light/20"
                      : "border-border/50 bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {c.status === "done" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                    {c.status === "error" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    {c.status === "generating" && <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />}
                    <span className="font-semibold text-xs">
                      {c.student.initials} — {c.student.subject} ({c.student.yearGroup})
                    </span>
                    {c.status === "done" && (
                      <button
                        className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => { navigator.clipboard.writeText(c.comment); toast.success("Copied!"); }}
                      >
                        Copy
                      </button>
                    )}
                  </div>
                  {c.status === "done" && (
                    <p className="text-xs text-foreground/80 leading-relaxed">{c.comment}</p>
                  )}
                  {c.status === "error" && (
                    <p className="text-xs text-red-600">{c.error}</p>
                  )}
                  {c.status === "generating" && (
                    <p className="text-xs text-muted-foreground italic">Generating...</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ReportCommentsBatch;
