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
 *
 * Book grounding additions (this PR):
 *   - Optional separate "Book content" upload — the actual book PDF / Word /
 *     text file. Uploaded once, parsed page-by-page server-side, and
 *     cached for 24h. Subsequent question generations slice ONLY the
 *     selected page range and ground the AI in the real text.
 *   - Per-reading-age criteria spreadsheets — .csv or .xlsx with a
 *     "reading age" / "criteria" column pair. The server picks the row
 *     matching the selected reading age and only sends that.
 *   - Result UI exposes a "Grounded ✓" badge when real text was used.
 */
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, Sparkles, Upload, X, Download, Printer, RotateCcw, FileText,
  Loader2, MessageCircle, Target, BookOpen, ShieldCheck, AlertTriangle, Trash2,
} from "lucide-react";
import { readingLevels, sendNeeds } from "@/lib/send-data";
import SENDInfoPanel from "@/components/SENDInfoPanel";
import { useApp } from "@/contexts/AppContext";
import { usePupilScope } from "@/contexts/PupilScopeContext";
import { learnerSupportPrompt } from "@/lib/learnerSupportProfile";

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
  /** True when the AI was grounded in the real book text. */
  grounded?: boolean;
  /** True when bookContentId was supplied but the cache had expired. */
  groundedExpired?: boolean;
  groundedRange?: { firstPage: number; lastPage: number; totalPages: number };
  criteriaSource?: { type: "matched-row" | "flat" | "none"; matchedRow?: string };
}

interface CachedBookContent {
  bookId: string;
  totalPages: number;
  filename: string;
  title: string;
  uploadedAt: number;
  /** Server-side cache TTL — we keep the same on the client so the UI
   *  hides stale entries before the server forgets them. */
  expiresAt: number;
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

const BOOK_CACHE_KEY = "adaptly_book_content_v1";

function loadBookCache(): Record<string, CachedBookContent> {
  try {
    const raw = localStorage.getItem(BOOK_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CachedBookContent>;
    const now = Date.now();
    // Drop expired entries on read.
    let dirty = false;
    for (const k of Object.keys(parsed)) {
      if (parsed[k].expiresAt < now) {
        delete parsed[k];
        dirty = true;
      }
    }
    if (dirty) localStorage.setItem(BOOK_CACHE_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return {};
  }
}

function saveBookCacheEntry(titleKey: string, entry: CachedBookContent) {
  try {
    const cache = loadBookCache();
    cache[titleKey] = entry;
    localStorage.setItem(BOOK_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* localStorage quota — ignore */
  }
}

function removeBookCacheEntry(titleKey: string) {
  try {
    const cache = loadBookCache();
    delete cache[titleKey];
    localStorage.setItem(BOOK_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

function bookCacheKey(title: string): string {
  return title.trim().toLowerCase();
}

export default function BookQuestionsTab() {
  const { children } = useApp();
  const { pupilId: scopedPupilId } = usePupilScope();
  const scopedPupil = children.find(child => child.id === scopedPupilId) || null;
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [readingAge, setReadingAge] = useState("");
  const [pagesFrom, setPagesFrom] = useState("");
  const [pagesTo, setPagesTo] = useState("");
  const [chapterInfo, setChapterInfo] = useState("");
  const [questionCount, setQuestionCount] = useState("8");
  const [criteriaFile, setCriteriaFile] = useState<File | null>(null);
  const [sendNeed, setSendNeed] = useState("");
  // VIPERS focus — Year of Reading addition. Empty array = "all VIPERS".
  const [vipersFocus, setVipersFocus] = useState<VipersId[]>([]);
  const [includeBookTalk, setIncludeBookTalk] = useState(true);
  // Book content (separate from criteria) — uploaded once, cached server-side
  // for 24h, sliced by pagesFrom/pagesTo on each generation.
  const [bookContent, setBookContent] = useState<CachedBookContent | null>(null);
  const [bookContentUploading, setBookContentUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [showTeacherNotes, setShowTeacherNotes] = useState(false);
  const criteriaInputRef = useRef<HTMLInputElement>(null);
  const bookContentInputRef = useRef<HTMLInputElement>(null);

  // When the book title changes, restore any cached book-content entry so
  // teachers don't have to re-upload across chapter sessions.
  useEffect(() => {
    const key = bookCacheKey(bookTitle);
    if (!key) {
      setBookContent(null);
      return;
    }
    const cache = loadBookCache();
    const entry = cache[key];
    if (entry && entry.expiresAt > Date.now()) {
      setBookContent(entry);
    } else {
      setBookContent(null);
    }
  }, [bookTitle]);

  const handleCriteriaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Criteria file must be under 5MB");
      return;
    }
    setCriteriaFile(file);
  };

  const handleBookContentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Book file must be under 25MB");
      return;
    }
    if (!bookTitle.trim()) {
      toast.error("Please enter a book title first so we can cache this for you.");
      return;
    }
    setBookContentUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", bookTitle);
      const response = await fetch("/api/ai/book-content", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Upload failed");
      }
      const data = await response.json();
      const entry: CachedBookContent = {
        bookId: data.bookId,
        totalPages: data.totalPages,
        filename: data.filename,
        title: data.title || data.filename,
        uploadedAt: Date.now(),
        expiresAt: data.cachedUntil || Date.now() + 24 * 60 * 60 * 1000,
      };
      setBookContent(entry);
      saveBookCacheEntry(bookCacheKey(bookTitle), entry);
      toast.success(`Parsed ${data.totalPages} pages — questions will be grounded in the real text.`);
    } catch (err: any) {
      toast.error(err?.message || "Could not parse that book file.");
    }
    setBookContentUploading(false);
    // Reset the input so the same file can be re-selected if needed.
    if (bookContentInputRef.current) bookContentInputRef.current.value = "";
  };

  const handleRemoveBookContent = () => {
    if (bookTitle.trim()) removeBookCacheEntry(bookCacheKey(bookTitle));
    setBookContent(null);
    toast.info("Book content cleared. Questions will now be inferred from the title only.");
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
      // Always go through the server endpoint now — it handles grounding,
      // xlsx/csv criteria parsing, VIPERS focus and Book Talk in one place
      // and returns a uniform shape.
      const formData = new FormData();
      if (criteriaFile) formData.append("file", criteriaFile);
      formData.append("bookTitle", bookTitle);
      formData.append("author", author);
      formData.append("readingAge", readingAge);
      formData.append("pagesFrom", pagesFrom);
      formData.append("pagesTo", pagesTo);
      formData.append("chapterInfo", chapterInfo);
      formData.append("questionCount", questionCount);
      if (bookContent?.bookId) formData.append("bookContentId", bookContent.bookId);
      if (vipersFocus.length > 0) formData.append("vipersFocus", vipersFocus.join(","));
      formData.append("includeBookTalk", String(includeBookTalk));
      if (scopedPupil?.learnerSupportProfile) {
        const guidance = learnerSupportPrompt(scopedPupil.learnerSupportProfile).join("\n").slice(0, 3000);
        if (guidance) formData.append("learnerSupportGuidance", guidance);
      }

      const response = await fetch("/api/ai/book-questions", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Generation failed");
      }
      const data: QuestionResult = await response.json();
      setResult(data);

      if (data.groundedExpired) {
        toast.warning("Cached book content expired — questions were generated without grounding. Re-upload the book to ground future runs.");
      } else if (data.grounded) {
        toast.success(`Generated! Grounded in pages ${data.groundedRange?.firstPage}–${data.groundedRange?.lastPage}.`);
      } else {
        toast.success("Questions generated!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate questions. Please try again.");
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
    // Note: we deliberately keep the bookContent cache in localStorage so
    // the same book can be reused. We just clear the in-memory state here.
    setBookContent(null);
    setVipersFocus([]);
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

                {/* ── Book content upload — Year of Reading 2026 ─────────── */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-emerald-600" />
                    Book content (recommended for grounded questions)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Upload the actual book (PDF / Word / text). Questions will be generated <strong>only</strong> from the pages you specify, not inferred from the title. Cached for 24 hours so you can reuse it for the next chapter.
                  </p>
                  {!bookContent ? (
                    <button
                      type="button"
                      onClick={() => bookContentInputRef.current?.click()}
                      disabled={bookContentUploading || !bookTitle.trim()}
                      className="w-full border-2 border-dashed border-emerald-300 rounded-lg p-4 text-center hover:border-emerald-500 hover:bg-emerald-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {bookContentUploading ? (
                        <>
                          <Loader2 className="w-5 h-5 mx-auto mb-1 text-emerald-600 animate-spin" />
                          <p className="text-xs text-emerald-800">Parsing book pages…</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                          <p className="text-xs text-emerald-800 font-medium">
                            {bookTitle.trim() ? "Click to upload PDF / Word / text book (max 25MB)" : "Enter the book title above first"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Page-aware: questions will use only the pages you choose.
                          </p>
                        </>
                      )}
                      <input
                        ref={bookContentInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={handleBookContentChange}
                      />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-emerald-900 truncate">{bookContent.filename}</p>
                        <p className="text-[10px] text-emerald-800">
                          {bookContent.totalPages} pages parsed · cached for ~{Math.max(1, Math.round((bookContent.expiresAt - Date.now()) / (60 * 60 * 1000)))}h
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => bookContentInputRef.current?.click()}
                        className="text-[11px] text-emerald-800 hover:text-emerald-900 underline"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveBookContent}
                        className="text-emerald-800 hover:text-destructive"
                        aria-label="Remove book content"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <input
                        ref={bookContentInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={handleBookContentChange}
                      />
                    </div>
                  )}
                </div>

                {/* Pages read */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Pages / Chapter Read {bookContent ? "*" : "(optional)"}
                  </Label>
                  {bookContent && (
                    <p className="text-[11px] text-emerald-700">
                      Out of {bookContent.totalPages} pages. Questions will be generated <strong>only</strong> from this range.
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={pagesFrom}
                      onChange={e => setPagesFrom(e.target.value)}
                      placeholder="From page"
                      className="h-10 text-sm"
                      type="number"
                      min="1"
                      max={bookContent?.totalPages}
                    />
                    <Input
                      value={pagesTo}
                      onChange={e => setPagesTo(e.target.value)}
                      placeholder="To page"
                      className="h-10 text-sm"
                      type="number"
                      min="1"
                      max={bookContent?.totalPages}
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

                {/* Criteria file upload — now accepts xlsx/csv */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Criteria / Mark Scheme (optional)</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Upload your mark scheme. <strong>Excel and CSV with a "reading age" + "criteria" column pair</strong> will auto-pick the row matching the selected reading age. PDF, Word, and text files are also supported.
                  </p>
                  {!criteriaFile ? (
                    <button
                      onClick={() => criteriaInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-brand/40 hover:bg-brand-light/20 transition-all"
                    >
                      <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Click to upload PDF / Word / Excel / CSV / text (max 5MB)</p>
                      <input
                        ref={criteriaInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                        className="hidden"
                        onChange={handleCriteriaFileChange}
                      />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-brand-light/30 rounded-lg border border-brand/20">
                      <FileText className="w-4 h-4 text-brand flex-shrink-0" />
                      <span className="text-xs font-medium text-brand flex-1 truncate">{criteriaFile.name}</span>
                      <button onClick={() => setCriteriaFile(null)} className="text-muted-foreground hover:text-destructive">
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
                    <SENDInfoPanel sendNeedId={sendNeed} context="reading" className="mt-2" learnerSupportProfile={scopedPupil?.learnerSupportProfile} />
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

            {/* Grounded / criteria-source banner */}
            {(result.grounded || result.groundedExpired || result.criteriaSource?.type === "matched-row") && (
              <Card className={`border ${result.grounded ? "border-emerald-300 bg-emerald-50" : result.groundedExpired ? "border-amber-300 bg-amber-50" : "border-sky-300 bg-sky-50"}`}>
                <CardContent className="p-3 space-y-1.5">
                  {result.grounded && result.groundedRange && (
                    <p className="text-xs flex items-center gap-1.5 text-emerald-900">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span><strong>Grounded</strong> — questions generated from the actual text on pages {result.groundedRange.firstPage}–{result.groundedRange.lastPage} (of {result.groundedRange.totalPages}).</span>
                    </p>
                  )}
                  {result.groundedExpired && (
                    <p className="text-xs flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Cached book content expired (24h). Questions were generated <em>without</em> grounding — re-upload the book to ground future runs.</span>
                    </p>
                  )}
                  {result.criteriaSource?.type === "matched-row" && result.criteriaSource.matchedRow && (
                    <p className="text-xs flex items-center gap-1.5 text-sky-900">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Using criteria row matching <strong>{result.criteriaSource.matchedRow}</strong> from your spreadsheet.</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

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
                      {result.grounded && (
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />Grounded
                        </span>
                      )}
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
