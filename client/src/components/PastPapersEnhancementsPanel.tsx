/**
 * PastPapersEnhancementsPanel — embedded inside Past Papers page.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Sparkles, Search, Package, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  type PastPaperQuestion, type AdaptationProfile, defaultsFor,
  adaptQuestion, type AdaptedQuestion,
  commentaryForMarkScheme,
  searchQuestions, type QuestionBankFilter,
  buildExamPack, packAsText,
  autoMark, type PupilAttempt,
} from "@/lib/past-papers-enhancements";

interface Props {
  bank: PastPaperQuestion[];
  selectedQuestion?: PastPaperQuestion;
}

const PROFILES: AdaptationProfile[] = ["dyslexia", "asc", "adhd", "eal", "vi", "low-reading-age"];

export default function PastPapersEnhancementsPanel({ bank, selectedQuestion }: Props) {
  const [profile, setProfile] = useState<AdaptationProfile>("dyslexia");
  const [filter, setFilter] = useState<QuestionBankFilter>({});
  const [attemptText, setAttemptText] = useState("");

  const adapted: AdaptedQuestion | null = useMemo(
    () => selectedQuestion ? adaptQuestion(selectedQuestion, defaultsFor(profile)) : null,
    [selectedQuestion, profile],
  );

  const commentary = useMemo(
    () => selectedQuestion ? commentaryForMarkScheme(selectedQuestion.markScheme) : [],
    [selectedQuestion],
  );

  const searchResults = useMemo(
    () => searchQuestions(bank, filter).slice(0, 30),
    [bank, filter],
  );

  function exportPack() {
    if (searchResults.length === 0) { toast.error("Search returned no questions."); return; }
    const pack = buildExamPack({
      title: `SEND-adapted pack — ${filter.topic || "mixed"}`,
      questions: searchResults.slice(0, 8),
      options: defaultsFor(profile),
    });
    const blob = new Blob([packAsText(pack)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile}-pack.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Adapted exam pack exported.");
  }

  const markResult = useMemo(() => {
    if (!selectedQuestion || !attemptText) return null;
    const attempt: PupilAttempt = { questionId: selectedQuestion.id, text: attemptText };
    return autoMark(selectedQuestion, attempt);
  }, [selectedQuestion, attemptText]);

  return (
    <Card className="border-indigo-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <p className="text-sm font-bold">Past Papers Enhancements</p>
        </div>

        <Tabs defaultValue="adapt">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="adapt">Adapt question</TabsTrigger>
            <TabsTrigger value="commentary">Mark scheme</TabsTrigger>
            <TabsTrigger value="search">Bank search</TabsTrigger>
            <TabsTrigger value="pack">Adapted pack</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
          </TabsList>

          <TabsContent value="adapt" className="space-y-2 pt-3">
            {!selectedQuestion ? (
              <p className="text-xs italic text-muted-foreground">Pick a question to adapt.</p>
            ) : (
              <>
                <div>
                  <Label className="text-xs">Adaptation profile</Label>
                  <Select value={profile} onValueChange={(v) => setProfile(v as AdaptationProfile)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROFILES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {adapted && (
                  <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
                    <p className="whitespace-pre-line">{adapted.adaptedText}</p>
                    <p className="font-bold mt-2">Scaffolds:</p>
                    <ul className="list-disc pl-5">{adapted.scaffolds.map((s) => <li key={s}>{s}</li>)}</ul>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {adapted.options.fontPx}px on {adapted.options.paper} paper · +{adapted.options.extraTimePct}% time{adapted.options.largePrint ? " · large print" : ""}
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="commentary" className="space-y-2 pt-3">
            {!selectedQuestion ? (
              <p className="text-xs italic text-muted-foreground">Pick a question first.</p>
            ) : commentary.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No mark scheme on this question.</p>
            ) : (
              <ul className="space-y-1.5 text-[11px]">
                {commentary.map((c, i) => (
                  <li key={i} className="rounded-md border bg-muted/20 p-2">
                    <p className="font-mono text-[10px]">{c.excerpt}</p>
                    <p className="mt-1 text-muted-foreground"><Sparkles className="w-3 h-3 inline mr-1" /> {c.commentary}</p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-2 pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Input placeholder="Topic" value={filter.topic || ""} onChange={(e) => setFilter({ ...filter, topic: e.target.value })} />
              <Input type="number" placeholder="Year from" value={filter.yearFrom || ""} onChange={(e) => setFilter({ ...filter, yearFrom: Number(e.target.value) || undefined })} />
              <Input type="number" placeholder="Year to" value={filter.yearTo || ""} onChange={(e) => setFilter({ ...filter, yearTo: Number(e.target.value) || undefined })} />
              <Input type="number" placeholder="Min marks" value={filter.marksFrom || ""} onChange={(e) => setFilter({ ...filter, marksFrom: Number(e.target.value) || undefined })} />
            </div>
            <p className="text-[10px] text-muted-foreground">{searchResults.length} match{searchResults.length === 1 ? "" : "es"} (showing first 30).</p>
            <ul className="space-y-1 max-h-48 overflow-auto text-[11px]">
              {searchResults.map((q) => (
                <li key={q.id} className="rounded-md border bg-muted/20 p-2">
                  <span className="font-mono text-[10px] mr-1">{q.year}</span>
                  <Badge variant="outline" className="text-[9px] mr-1">{q.marks}m</Badge>
                  {q.text.slice(0, 100)}{q.text.length > 100 ? "…" : ""}
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="pack" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Build a SEND-adapted exam pack from the current search results, applying the chosen profile.</p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">Profile</Label>
                <Select value={profile} onValueChange={(v) => setProfile(v as AdaptationProfile)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROFILES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={exportPack} className="gap-1.5"><Package className="w-3.5 h-3.5" /> Export pack</Button>
            </div>
          </TabsContent>

          <TabsContent value="practice" className="space-y-2 pt-3">
            {!selectedQuestion ? (
              <p className="text-xs italic text-muted-foreground">Pick a question to practise against.</p>
            ) : (
              <>
                <Textarea rows={5} value={attemptText} onChange={(e) => setAttemptText(e.target.value)} placeholder="Type the pupil's answer here…" />
                {markResult && (
                  <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
                    <p><CheckCircle2 className="w-3 h-3 inline mr-1 text-emerald-600" /> Awarded <strong>{markResult.awarded}</strong> / {markResult.maxMarks}</p>
                    <ul className="list-disc pl-5 mt-1">{markResult.feedback.map((f, i) => <li key={i}>{f}</li>)}</ul>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
