/**
 * BookQuestionsTab
 * ─────────────────────────────────────────────────────────────────────────────
 * Enter a book title, reading age, pages read, and optionally upload a criteria
 * file → AI generates comprehension questions tailored to the reading age.
 *
 * Year of Reading 2026 additions:
 *   - VIPERS focus selector (Vocabulary, Inference, Predict, Explain,
 *     Retrieve, Sequence) — the dominant UK reading framework
 *   - Optional Book Talk sentence starters for oracy / guided reading
 */
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Sparkles, Upload, X, Download, Printer, RotateCcw, FileText, Loader2, MessageCircle, Target } from "lucide-react";
import { readingLevels, sendNeeds } from "@/lib/send-data";
import SENDInfoPanel from "@/components/SENDInfoPanel";
import { callAI, parseWithFixes } from "@/lib/ai";

interface Question {
  number: number;
  type: string;
  question: string;
  marks: number;
}

interface TeacherNote {
  number: number;
  guidance: string;
}

interface QuestionResult {
  questions: Question[];
  teacherNotes: TeacherNote[];
  /** Year of Reading addition — oracy / discussion prompts for guided reading. */
  bookTalk?: string[];
  provider?: string;
}

const QUESTION_TYPES: Record<string, string> = {
  literal: "Literal",
  inference: "Inference",
  vocabulary: "Vocabulary",
  evaluation: "Evaluation",
  comprehension: "Comprehension",
  prediction: "Prediction",
  summary: "Summary",
  // VIPERS-aligned
  predict: "Predict",
  explain: "Explain",
  retrieve: "Retrieve",
  sequence: "Sequence",
};

const TYPE_COLOURS: Record<string, string> = {
  literal: "bg-blue-50 text-blue-700 border-blue-200",
  inference: "bg-purple-50 text-purple-700 border-purple-200",
  vocabulary: "bg-amber-50 text-amber-700 border-amber-200",
  evaluation: "bg-green-50 text-green-700 border-green-200",
  comprehension: "bg-slate-50 text-slate-700 border-slate-200",
  prediction: "bg-rose-50 text-rose-700 border-rose-200",
  predict: "bg-rose-50 text-rose-700 border-rose-200",
  explain: "bg-indigo-50 text-indigo-700 border-indigo-200",
  retrieve: "bg-blue-50 text-blue-700 border-blue-200",
  sequence: "bg-teal-50 text-teal-700 border-teal-200",
  summary: "bg-teal-50 text-teal-700 border-teal-200",
};

// VIPERS — UK primary reading-comprehension framework. Each strand has a
// short label, a one-line teacher description, and an example stem.
const VIPERS = [
  { id: "V", label: "Vocabulary", colour: "bg-amber-100 text-amber-800 border-amber-300", desc: "Word meaning in context" },
  { id: "I", label: "Inference",  colour: "bg-purple-100 text-purple-800 border-purple-300", desc: "Read between the lines" },
  { id: "P", label: "Predict",    colour: "bg-rose-100 text-rose-800 border-rose-300",       desc: "What might happen next" },
  { id: "E", label: "Explain",    colour: "bg-indigo-100 text-indigo-800 border-indigo-300", desc: "Author's choices and intent" },
  { id: "R", label: "Retrieve",   colour: "bg-blue-100 text-blue-800 border-blue-300",       desc: "Find it in the text" },
  { id: "S", label: "Sequence / Summarise", colour: "bg-teal-100 text-teal-800 border-teal-300", desc: "Order or summarise events" },
] as const;

type VipersId = (typeof VIPERS)[number]["id"];

export default function BookQuestionsTab() {
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [readingAge, setReadingAge] = useState("");
  const [pagesFrom, setPagesFrom] = useState("");
  const [pagesTo, setPagesTo] = useState("");
  const [chapterInfo, setChapterInfo] = useState("");
  const [questionCount, setQuestionCount] = useState("8");
  const [criteriaFile, setCriteriaFile] = useState<File | null>(null);
  const [criteriaText, setCriteriaText] = useState("");
  const [sendNeed, setSendNeed] = useState("");
  // VIPERS focus — Year of Reading addition. Empty array = "all VIPERS".
  const [vipersFocus, setVipersFocus] = useState<VipersId[]>([]);
  const [includeBookTalk, setIncludeBookTalk] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [showTeacherNotes, setShowTeacherNotes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setCriteriaFile(file);
    // Read text files directly
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (ev) => setCriteriaText(ev.target?.result as string || "");
      reader.readAsText(file);
    } else {
      // For PDF/docx we'll send to server — just store the file
      setCriteriaText("");
    }
  };

  const handleGenerate = async () => {
    if (!bookTitle.trim()) {
      toast.error("Please enter a book title.");
      return;
    }
    if (!readingAge) {
      toast.error("Please select a reading age.");
      return;
    }

    setLoading(true);
    try {
      // If there's a criteria file (PDF/docx), send via server endpoint
      if (criteriaFile && !criteriaText) {
        const formData = new FormData();
        formData.append("file", criteriaFile);
        formData.append("bookTitle", bookTitle);
        formData.append("author", author);
        formData.append("readingAge", readingAge);
        formData.append("pagesFrom", pagesFrom);
        formData.append("pagesTo", pagesTo);
        formData.append("chapterInfo", chapterInfo);
        formData.append("questionCount", questionCount);

            const response = await fetch("/api/ai/book-questions", {
          method: "POST",
          credentials: "include",
          credentials: "include",
          body: formData,
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        setResult(data);
        toast.success("Questions generated!");
        return;
      }

      // Otherwise use client-side AI call (cheaper, no file upload needed)
      const readingAgeLabel = readingLevels.find(r => r.id === readingAge)?.name || readingAge;
      const pagesLabel = pagesFrom && pagesTo ? `pages ${pagesFrom}–${pagesTo}` : pagesFrom ? `from page ${pagesFrom}` : "";
      const chapterLabel = chapterInfo ? `(${chapterInfo})` : "";
      const criteriaSection = criteriaText ? `\n\nCriteria / mark scheme provided by teacher:\n${criteriaText.slice(0, 2000)}` : "";

      // VIPERS focus translates to a question-type bias the prompt can honour.
      const vipersLabels = vipersFocus.length > 0
        ? VIPERS.filter(v => vipersFocus.includes(v.id)).map(v => v.label).join(", ")
        : "balanced VIPERS coverage (Vocabulary, Inference, Predict, Explain, Retrieve, Sequence)";

      const bookTalkSection = includeBookTalk
        ? `\n\nALSO return a "bookTalk" array with 4 oracy / discussion sentence starters
suitable for guided reading conversation. Examples: "I think… because in the text…",
"The author's choice of word '…' makes me feel…", "I would change/agree/disagree with…".
These should be open-ended and reusable across the book, not tied to one specific page.`
        : "";

      const system = `You are an expert English teacher and literacy specialist working in UK primary or secondary schools. You generate high-quality comprehension questions aligned to the VIPERS framework (Vocabulary, Inference, Predict, Explain, Retrieve, Sequence/Summarise). Questions must be appropriate for the specified reading age. Always return valid JSON only.`;

      const user = `Book: "${bookTitle}"${author ? ` by ${author}` : ""}
Reading age / level: ${readingAgeLabel}
Section read: ${pagesLabel} ${chapterLabel}
Number of questions: ${questionCount}
VIPERS focus: ${vipersLabels}${criteriaSection}

Generate ${questionCount} VIPERS-tagged comprehension questions for pupils at ${readingAgeLabel} level who have just read this section.

Use these "type" values to align with VIPERS:
- "vocabulary" (V — word meaning in context)
- "inference"  (I — read between the lines)
- "predict"    (P — what might happen next, why)
- "explain"    (E — author's choices, language, structure)
- "retrieve"   (R — find it in the text)
- "sequence"   (S — order or summarise events)

If the user requested a specific VIPERS focus (above), at least 70% of questions must use those types.${bookTalkSection}

Return JSON:
{
  "questions": [
    { "number": 1, "type": "retrieve",  "question": "...", "marks": 1 },
    { "number": 2, "type": "inference", "question": "...", "marks": 2 }
  ],
  "teacherNotes": [
    { "number": 1, "guidance": "Accept any answer that mentions..." }
  ]${includeBookTalk ? ',\n  "bookTalk": ["I think… because…", "..."]' : ""}
}`;

      const { text } = await callAI(system, user, 2200);
      let parsed: QuestionResult;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = parseWithFixes(jsonMatch ? jsonMatch[0] : text);
      } catch {
        const lines = text.split("\n").filter(l => /^Q?\d+[.)]/i.test(l.trim()));
        parsed = {
          questions: lines.map((l, i) => ({
            number: i + 1,
            type: "comprehension",
            question: l.replace(/^Q?\d+[.\)\s]+/i, "").trim(),
            marks: 1,
          })),
          teacherNotes: [],
        };
      }
      setResult(parsed);
      toast.success("Questions generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate questions. Please try again.");
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setResult(null);
    setBookTitle("");
    setAuthor("");
    setReadingAge("");
    setPagesFrom("");
    setPagesTo("");
    setChapterInfo("");
    setCriteriaFile(null);
    setCriteriaText("");
  };

  const totalMarks = result?.questions.reduce((sum, q) => sum + (q.marks || 1), 0) ?? 0;

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-medium">Book Title *</Label>
                    <Input
                      value={bookTitle}
                      onChange={e => setBookTitle(e.target.value)}
                      placeholder="e.g. The Lion, the Witch and the Wardrobe"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Author (optional)</Label>
                    <Input
                      value={author}
                      onChange={e => setAuthor(e.target.value)}
                      placeholder="e.g. C.S. Lewis"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Reading Age *</Label>
                    <Select value={readingAge} onValueChange={setReadingAge}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select reading age" /></SelectTrigger>
                      <SelectContent>
                        {readingLevels.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Pages read */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Pages / Chapter Read (optional)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={pagesFrom}
                      onChange={e => setPagesFrom(e.target.value)}
                      placeholder="From page"
                      className="h-10 text-sm"
                      type="number"
                      min="1"
                    />
                    <Input
                      value={pagesTo}
                      onChange={e => setPagesTo(e.target.value)}
                      placeholder="To page"
                      className="h-10 text-sm"
                      type="number"
                      min="1"
                    />
                    <Input
                      value={chapterInfo}
                      onChange={e => setChapterInfo(e.target.value)}
                      placeholder="Chapter (optional)"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                {/* Number of questions */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Number of Questions</Label>
                  <div className="flex gap-2">
                    {["4", "6", "8", "10", "12"].map(n => (
                      <button
                        key={n}
                        onClick={() => setQuestionCount(n)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${questionCount === n ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Criteria file upload */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Criteria / Mark Scheme (optional)</Label>
                  <p className="text-[11px] text-muted-foreground">Upload your own mark scheme or learning objectives and questions will be based on your criteria.</p>
                  {!criteriaFile ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-brand/40 hover:bg-brand-light/20 transition-all"
                    >
                      <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Click to upload PDF, Word, or text file (max 5MB)</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-brand-light/30 rounded-lg border border-brand/20">
                      <FileText className="w-4 h-4 text-brand flex-shrink-0" />
                      <span className="text-xs font-medium text-brand flex-1 truncate">{criteriaFile.name}</span>
                      <button onClick={() => { setCriteriaFile(null); setCriteriaText(""); }} className="text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* SEND Need selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">SEND Need (optional)</Label>
                  <Select value={sendNeed} onValueChange={setSendNeed}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="No specific need" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none-selected">No specific need</SelectItem>
                      {sendNeeds.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {sendNeed && sendNeed !== "none-selected" && (
                    <SENDInfoPanel sendNeedId={sendNeed} context="reading" className="mt-2" />
                  )}
                </div>

                {/* VIPERS focus — Year of Reading 2026 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-brand" />VIPERS focus
                    </Label>
                    {vipersFocus.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setVipersFocus([])}
                        className="text-[10px] text-muted-foreground hover:text-brand"
                      >
                        Clear (use all)
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tap one or more strands to bias the questions toward them. Leave all unselected for a balanced mix.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {VIPERS.map(v => {
                      const active = vipersFocus.includes(v.id);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVipersFocus(prev =>
                            active ? prev.filter(x => x !== v.id) : [...prev, v.id]
                          )}
                          className={`text-left p-2 rounded-lg border transition-all ${
                            active ? `${v.colour} border-current ring-1 ring-current/20` : "bg-muted text-muted-foreground border-transparent hover:border-border"
                          }`}
                        >
                          <div className="text-[11px] font-bold">{v.id} — {v.label}</div>
                          <div className="text-[10px] opacity-80 leading-tight">{v.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Book Talk sentence starters toggle */}
                <label className="flex items-start gap-2 p-2.5 rounded-lg border border-border hover:border-brand/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBookTalk}
                    onChange={e => setIncludeBookTalk(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium flex items-center gap-1.5">
                      <MessageCircle className="w-3 h-3 text-brand" />
                      Include Book Talk sentence starters
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Adds 4 oracy prompts for guided reading discussion (e.g. "I think… because…").
                    </p>
                  </div>
                </label>

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full h-11 bg-brand hover:bg-brand/90 text-white"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Questions…</>
                    : <><HelpCircle className="w-4 h-4 mr-2" />Generate Questions</>
                  }
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 no-print">
              <Button variant="outline" size="sm" onClick={() => setShowTeacherNotes(!showTeacherNotes)}>
                {showTeacherNotes ? "Hide" : "Show"} Teacher Notes
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1.5" />Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />New
              </Button>
            </div>

            {/* Header */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-base">{bookTitle}</h2>
                    {author && <p className="text-sm text-muted-foreground">by {author}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {readingAge && (
                        <span className="text-[11px] bg-brand-light text-brand px-2 py-0.5 rounded-full font-medium">
                          {readingLevels.find(r => r.id === readingAge)?.name || readingAge}
                        </span>
                      )}
                      {(pagesFrom || pagesTo) && (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          Pages {pagesFrom}{pagesTo ? `–${pagesTo}` : "+"}
                        </span>
                      )}
                      {chapterInfo && (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {chapterInfo}
                        </span>
                      )}
                      <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {result.questions.length} questions · {totalMarks} marks
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <div className="space-y-3">
              {result.questions.map((q) => {
                const typeColour = TYPE_COLOURS[q.type] || TYPE_COLOURS.comprehension;
                const teacherNote = result.teacherNotes?.find(n => n.number === q.number);
                return (
                  <Card key={q.number} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm flex-shrink-0">
                          {q.number}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${typeColour}`}>
                              {QUESTION_TYPES[q.type] || q.type}
                            </span>
                            <span className="text-[11px] text-muted-foreground">[{q.marks} mark{q.marks !== 1 ? "s" : ""}]</span>
                          </div>
                          <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                          {/* Answer lines */}
                          <div className="space-y-1.5 mt-3">
                            {Array.from({ length: Math.max(2, q.marks + 1) }).map((_, i) => (
                              <div key={i} className="border-b border-border/60 h-6" />
                            ))}
                          </div>
                          {/* Teacher note */}
                          {showTeacherNotes && teacherNote && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-[11px] font-semibold text-amber-700 mb-0.5">Teacher Note</p>
                              <p className="text-xs text-amber-800">{teacherNote.guidance}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Book Talk sentence starters — Year of Reading 2026 */}
            {result.bookTalk && result.bookTalk.length > 0 && (
              <Card className="border-brand/30 bg-brand-light/30">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-brand" />Book Talk — sentence starters
                  </h3>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Use during guided reading to prompt oracy and discussion.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.bookTalk.map((s, i) => (
                      <li key={i} className="rounded-md border border-brand/20 bg-white px-3 py-2 text-sm">
                        <span className="text-brand font-bold mr-1">{i + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
