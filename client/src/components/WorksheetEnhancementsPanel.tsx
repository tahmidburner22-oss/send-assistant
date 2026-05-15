/**
 * WorksheetEnhancementsPanel — embedded next to the Worksheet Generator
 * output. Surfaces the four improvements (dual version, answer-key
 * validator, curriculum tag, A4 preview).
 *
 * Renders nothing if no AI output is available yet.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, AlertTriangle, Copy, Tag, Ruler, Eye, FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import {
  splitTeacherPupilVersions, validateAnswerKey, suggestCurriculumTags,
  A4_WIDTH_PX, A4_HEIGHT_PX,
} from "@/lib/worksheet-enhancements";

interface Props {
  output: string;
  topic: string;
  subject?: string;
  yearGroup?: string;
}

export default function WorksheetEnhancementsPanel({ output, topic, subject, yearGroup }: Props) {
  const split = useMemo(() => splitTeacherPupilVersions(output), [output]);
  const report = useMemo(() => validateAnswerKey(split.pupil, split.teacher), [split]);
  const tags   = useMemo(() => suggestCurriculumTags({ topic, subject, yearGroup }), [topic, subject, yearGroup]);
  const [picked, setPicked] = useState<string>(tags[0]?.code || "");

  if (!output) return null;

  return (
    <Card className="border-blue-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          <p className="text-sm font-bold">Worksheet Enhancements</p>
        </div>

        <Tabs defaultValue="dual">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="dual">Dual versions</TabsTrigger>
            <TabsTrigger value="key">Answer-key check</TabsTrigger>
            <TabsTrigger value="tags">Curriculum tags</TabsTrigger>
            <TabsTrigger value="a4">A4 preview</TabsTrigger>
          </TabsList>

          {/* 1. Dual versions */}
          <TabsContent value="dual" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              The same generation, split into a pupil copy (no answers) and a teacher copy with mark scheme + misconceptions.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              <CopyCard title="Pupil copy" body={split.pupil} accent="blue" />
              <CopyCard title="Teacher copy" body={split.teacher || "(No answer key detected — re-generate with the dual-version system suffix.)"} accent="amber" />
            </div>
          </TabsContent>

          {/* 2. Answer-key validator */}
          <TabsContent value="key" className="space-y-2 pt-3">
            {report.ok
              ? <div className="flex items-center gap-2 text-emerald-700 text-xs"><CheckCircle2 className="w-4 h-4" /> Answer-key consistent: {report.questionCount} questions, {report.answerCount} answers, no duplicates.</div>
              : <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 text-xs"><AlertTriangle className="w-4 h-4" /> Found {report.problems.length} issue{report.problems.length === 1 ? "" : "s"}.</div>
                  <ul className="text-[11px] text-amber-700 list-disc pl-5 space-y-0.5">
                    {report.problems.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>}
          </TabsContent>

          {/* 3. Curriculum tag autocomplete */}
          <TabsContent value="tags" className="space-y-2 pt-3">
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No matching National Curriculum codes for this topic.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">Pick the closest NC objective. The chosen code is stamped on the printed footer for Ofsted deep-dive evidence.</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <button
                      key={t.code}
                      onClick={() => setPicked(t.code)}
                      className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                        picked === t.code ? "bg-blue-600 text-white border-blue-600" : "bg-white border-border hover:border-foreground/30"
                      }`}
                    >
                      <span className="font-mono font-bold mr-1.5">{t.code}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
                {picked && (
                  <div className="text-[11px] flex items-center gap-1.5 text-muted-foreground">
                    <Tag className="w-3 h-3" />
                    Footer stamp: <code className="bg-muted/40 px-1.5 py-0.5 rounded">{picked} · NC {yearGroup || ""} ({subject})</code>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* 4. A4 preview */}
          <TabsContent value="a4" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              How the worksheet would look at A4 portrait scale ({A4_WIDTH_PX}×{A4_HEIGHT_PX} px @ 96dpi).
            </p>
            <div className="rounded-md border bg-muted/30 p-2 overflow-auto max-h-[420px]">
              <div
                className="bg-white shadow-sm border mx-auto"
                style={{
                  width: A4_WIDTH_PX,
                  minHeight: A4_HEIGHT_PX,
                  padding: "48px",
                  transform: "scale(0.55)",
                  transformOrigin: "top center",
                  marginBottom: "-460px",
                }}
              >
                <pre className="whitespace-pre-wrap text-[12px] leading-relaxed font-sans">{split.pupil || output}</pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function CopyCard({ title, body, accent }: { title: string; body: string; accent: "blue" | "amber" }) {
  const cls = accent === "blue" ? "border-blue-200 bg-blue-50/30" : "border-amber-200 bg-amber-50/30";
  return (
    <div className={`rounded-md border ${cls} p-2 space-y-1`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider">{title}</p>
        <button
          onClick={() => { navigator.clipboard.writeText(body); toast.success(`${title} copied`); }}
          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <Copy className="w-3 h-3" /> Copy
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-[11px] max-h-48 overflow-y-auto">{body}</pre>
    </div>
  );
}
