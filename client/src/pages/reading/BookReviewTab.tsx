/**
 * BookReviewTab
 * ─────────────────────────────────────────────────────────────────────────────
 * Enter a book title (and optionally author + year group) → AI generates a
 * spoiler-free summary and review to help pupils decide whether to read it.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Sparkles, RotateCcw, Printer, Loader2, BookOpen, Tag, GraduationCap, Link2 } from "lucide-react";
import { yearGroups } from "@/lib/send-data";
import { callAI, parseWithFixes } from "@/lib/ai";

interface BookReview {
  title: string;
  author: string;
  genre: string;
  ageRange: string;
  summary: string;
  review: string;
  themes: string[];
  starRating: number;
  readingLevel: string;
  curriculumLinks: string[];
  similarBooks: string[];
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
      {half && <Star className="w-4 h-4 fill-amber-200 text-amber-400" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} className="w-4 h-4 text-muted-foreground/30" />
      ))}
      <span className="text-sm font-semibold text-amber-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

const GENRES = [
  "Adventure", "Fantasy", "Mystery", "Historical Fiction", "Science Fiction",
  "Contemporary Fiction", "Horror / Spooky", "Comedy", "Romance", "Non-Fiction",
  "Biography", "Poetry", "Graphic Novel",
];

export default function BookReviewTab() {
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BookReview | null>(null);

  const handleGenerate = async () => {
    if (!bookTitle.trim()) {
      toast.error("Please enter a book title.");
      return;
    }
    setLoading(true);
    try {
      const audienceLabel = yearGroup ? `for ${yearGroup} pupils` : "for school pupils";
      const authorLabel = author ? ` by ${author}` : "";
      const system = `You are an expert children's and young adult literature specialist and school librarian. Write engaging, age-appropriate book summaries and reviews that help pupils decide whether to read a book. Always return valid JSON only.`;
      const user = `Write a book summary and review of "${bookTitle}"${authorLabel} ${audienceLabel}${genre ? ` (genre: ${genre})` : ""}.

Return a JSON object:
{
  "title": "${bookTitle}",
  "author": "${author || "Unknown"}",
  "genre": "the book's genre",
  "ageRange": "recommended reading age range e.g. Ages 9-12",
  "summary": "A 3-4 paragraph spoiler-free summary. Engaging and written for the target age group. Do NOT reveal the ending.",
  "review": "A 2-3 paragraph honest review covering: writing style, themes, what makes it special, who would enjoy it, and any content warnings relevant for school use.",
  "themes": ["theme1", "theme2", "theme3"],
  "starRating": 4.5,
  "readingLevel": "e.g. Year 5-7 / Ages 9-12",
  "curriculumLinks": ["e.g. PSHE - friendship and belonging", "English - narrative structure"],
  "similarBooks": ["Book 1 by Author", "Book 2 by Author", "Book 3 by Author"]
}`;

      const { text } = await callAI(system, user, 1500);
      let parsed: BookReview;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = parseWithFixes(jsonMatch ? jsonMatch[0] : text);
      } catch {
        parsed = {
          title: bookTitle,
          author: author || "Unknown",
          genre: genre || "",
          ageRange: "",
          summary: text,
          review: "",
          themes: [],
          starRating: 0,
          readingLevel: "",
          curriculumLinks: [],
          similarBooks: [],
        };
      }
      setResult(parsed);
      toast.success("Book review generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate review. Please try again.");
    }
    setLoading(false);
  };

  const handleReset = () => {
    setResult(null);
    setBookTitle("");
    setAuthor("");
    setYearGroup("");
    setGenre("");
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Book Title *</Label>
                  <Input
                    value={bookTitle}
                    onChange={e => setBookTitle(e.target.value)}
                    placeholder="e.g. Harry Potter and the Philosopher's Stone"
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Author (optional)</Label>
                    <Input
                      value={author}
                      onChange={e => setAuthor(e.target.value)}
                      placeholder="e.g. J.K. Rowling"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Year Group (optional)</Label>
                    <Select value={yearGroup} onValueChange={setYearGroup}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select year" /></SelectTrigger>
                      <SelectContent>
                        {yearGroups.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Genre selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Genre (optional)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {GENRES.map(g => (
                      <button
                        key={g}
                        onClick={() => setGenre(genre === g ? "" : g)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                          genre === g
                            ? "bg-brand text-white border-brand"
                            : "bg-muted text-muted-foreground border-transparent hover:border-brand/30"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full h-11 bg-brand hover:bg-brand/90 text-white"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Review…</>
                    : <><Star className="w-4 h-4 mr-2" />Get Book Review</>
                  }
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Toolbar */}
            <div className="flex gap-2 no-print">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-1.5" />Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />New
              </Button>
            </div>

            {/* Header card */}
            <Card className="border-border/50 bg-gradient-to-br from-brand-light/30 to-white">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Book icon */}
                  <div className="w-14 h-20 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 border border-brand/20">
                    <BookOpen className="w-7 h-7 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg leading-tight">{result.title}</h2>
                    {result.author && result.author !== "Unknown" && (
                      <p className="text-sm text-muted-foreground mt-0.5">by {result.author}</p>
                    )}
                    <div className="mt-2">
                      {result.starRating > 0 && <StarRating rating={result.starRating} />}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.genre && (
                        <span className="text-[11px] bg-brand-light text-brand px-2 py-0.5 rounded-full font-medium border border-brand/20">
                          {result.genre}
                        </span>
                      )}
                      {result.ageRange && (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {result.ageRange}
                        </span>
                      )}
                      {result.readingLevel && (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {result.readingLevel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            {result.summary && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-brand" />What's it about?
                  </h3>
                  <div className="text-sm text-foreground leading-relaxed space-y-2">
                    {result.summary.split(/\n\n+/).map((para, i) => (
                      <p key={i}>{para.trim()}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review */}
            {result.review && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500" />Review
                  </h3>
                  <div className="text-sm text-foreground leading-relaxed space-y-2">
                    {result.review.split(/\n\n+/).map((para, i) => (
                      <p key={i}>{para.trim()}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Themes */}
            {result.themes?.length > 0 && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-purple-500" />Key Themes
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.themes.map((theme, i) => (
                      <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full">
                        {theme}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Curriculum Links */}
            {result.curriculumLinks?.length > 0 && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-green-600" />Curriculum Links
                  </h3>
                  <ul className="space-y-1">
                    {result.curriculumLinks.map((link, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">•</span>{link}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Similar Books */}
            {result.similarBooks?.length > 0 && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-blue-500" />If you enjoyed this, try…
                  </h3>
                  <ul className="space-y-1">
                    {result.similarBooks.map((book, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-blue-400 mt-0.5">•</span>{book}
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
