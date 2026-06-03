/**
 * StoryStudio — SEND Reading & Story Studio + published e-book (Tool T2).
 * Inspired by BuildMyStory, re-imagined SEND-first.
 *
 * A SEND pupil becomes a PUBLISHED AUTHOR: enter an idea + reading level, the
 * AI scaffolds a short, accessible, multi-page story, and it renders as a
 * celebratory e-book (cover with the child's name as author) that prints to a
 * real book and reads aloud.
 *
 * Accessibility / SEND-first:
 *   - 3 reading levels (symbol-supported → simple → extended).
 *   - Per-page read-aloud (Web Speech API).
 *   - Optional ARASAAC symbol strip for key words (free symbol layer).
 *   - Optional, teacher-initiated illustration per page via the FREE,
 *     safety-gated generation endpoint (/api/generation-proxy). Degrades
 *     gracefully: if the endpoint isn't configured the button simply hides.
 *
 * FREE + Gemini-independent (callAI → server fallback chain).
 */
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Printer, Loader2, Volume2, Image as ImageIcon, Star } from "lucide-react";
import { callAI, parseWithFixes } from "@/lib/ai";
import { SymbolSupportedWords } from "@/components/SymbolSupportedWords";

interface StoryPage {
  text: string;
  illustrationPrompt?: string;
  keyWords?: string[];
  /** Resolved illustration data URL (set when the teacher generates one). */
  imageDataUrl?: string;
  imageLoading?: boolean;
}
interface Story {
  title: string;
  pages: StoryPage[];
}

const READING_LEVELS = [
  { value: "symbol", label: "Symbol-supported (a few words a page)" },
  { value: "simple", label: "Simple sentences" },
  { value: "extended", label: "Extended (a short paragraph a page)" },
];

// ── Inline, graceful illustration helper ──────────────────────────────────────
// PR-B is independent of the generation endpoint (PR-A). We call it directly and
// degrade silently if it's absent/disabled.
async function checkGenerationEnabled(): Promise<boolean> {
  try {
    const r = await fetch("/api/generation-proxy/status", { credentials: "include" });
    if (!r.ok) return false;
    const j = (await r.json()) as { enabled?: boolean };
    return j?.enabled === true;
  } catch {
    return false;
  }
}
async function generatePageIllustration(prompt: string): Promise<string | null> {
  try {
    const r = await fetch("/api/generation-proxy/illustrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ prompt, style: "storybook" }),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { dataUrl?: string };
    return typeof j.dataUrl === "string" ? j.dataUrl : null;
  } catch {
    return null;
  }
}

export default function StoryStudio() {
  const [idea, setIdea] = useState("");
  const [author, setAuthor] = useState("");
  const [level, setLevel] = useState("simple");
  const [pageCount, setPageCount] = useState("5");
  const [symbols, setSymbols] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  const [genEnabled, setGenEnabled] = useState(false);

  useEffect(() => { checkGenerationEnabled().then(setGenEnabled); }, []);

  async function handleGenerate() {
    const i = idea.trim();
    if (!i) {
      toast.error("Describe the story idea, e.g. 'a shy dragon who makes a friend'.");
      return;
    }
    setLoading(true);
    setStory(null);
    try {
      const system =
        "You are a UK SEND teacher helping a pupil author a short, gentle, age-appropriate " +
        "story. Return ONLY JSON: {\"title\":\"...\",\"pages\":[{\"text\":\"...\",\"illustrationPrompt\":\"...\",\"keyWords\":[\"...\"]}]}. " +
        "One 'text' per page matching the reading level. 'illustrationPrompt' is a short, " +
        "calm, child-safe scene description (no text in image). 'keyWords' is 1-3 simple " +
        "content words from the page (for symbol support). Keep the story positive, with a " +
        "clear beginning/middle/end. British English.";
      const user = `Story idea: ${i}\nReading level: ${level}\nNumber of pages: ${pageCount}`;
      const { text } = await callAI(system, user, 1600, { responseFormat: "json_object" });
      const parsed = parseWithFixes(text) as Partial<Story>;
      const pages = Array.isArray(parsed?.pages)
        ? parsed.pages
            .map((p) => ({
              text: String((p as StoryPage)?.text || "").trim(),
              illustrationPrompt: (p as StoryPage)?.illustrationPrompt ? String((p as StoryPage).illustrationPrompt) : undefined,
              keyWords: Array.isArray((p as StoryPage)?.keyWords) ? (p as StoryPage).keyWords!.map((k) => String(k)).filter(Boolean) : [],
            }))
            .filter((p) => p.text)
        : [];
      if (pages.length === 0) {
        toast.error("The story came back empty — try a clearer idea.");
        return;
      }
      setStory({ title: String(parsed?.title || i), pages });
      toast.success("Story drafted! Add pictures and publish.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.startsWith("AUTH_REQUIRED") ? "Please log in again to use AI." : "Could not write the story — please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function illustratePage(index: number) {
    if (!story) return;
    const page = story.pages[index];
    const prompt = page.illustrationPrompt || page.text;
    setStory((s) => s ? { ...s, pages: s.pages.map((p, i) => i === index ? { ...p, imageLoading: true } : p) } : s);
    const dataUrl = await generatePageIllustration(prompt);
    setStory((s) => s ? { ...s, pages: s.pages.map((p, i) => i === index ? { ...p, imageLoading: false, imageDataUrl: dataUrl || undefined } : p) } : s);
    if (!dataUrl) toast.error("Couldn't make a picture for this page right now.");
  }

  function speak(text: string) {
    try {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-GB";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch { /* nice-to-have */ }
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="print:hidden">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand" />
          Reading &amp; Story Studio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every pupil becomes a published author. Draft a gentle, accessible story at the
          right reading level, add calm illustrations and symbol support, then publish it as
          a printable e-book with the child's name on the cover.
        </p>
      </motion.div>

      <Card className="print:hidden">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ss-idea">Story idea</Label>
            <Textarea id="ss-idea" rows={2} placeholder="e.g. a shy dragon who learns to make a friend at school" value={idea} onChange={(e) => setIdea(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ss-author">Author (pupil's name)</Label>
              <Input id="ss-author" placeholder="e.g. Aisha" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Pages</Label>
              <Select value={pageCount} onValueChange={setPageCount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["3", "4", "5", "6", "8"].map((n) => <SelectItem key={n} value={n}>{n} pages</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Reading level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{READING_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch id="ss-symbols" checked={symbols} onCheckedChange={setSymbols} />
              <Label htmlFor="ss-symbols" className="text-sm">Symbol support (ARASAAC)</Label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
              Write the story
            </Button>
            {story && <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" />Publish / print e-book</Button>}
          </div>
          {!genEnabled && (
            <p className="text-[11px] text-muted-foreground">Picture generation is optional and only appears if a free image provider is configured on the server.</p>
          )}
        </CardContent>
      </Card>

      {story && (
        <div className="space-y-4">
          {/* Cover */}
          <Card className="overflow-hidden">
            <CardContent className="p-8 text-center bg-gradient-to-br from-indigo-50 to-purple-50">
              <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h2 className="text-2xl font-extrabold text-indigo-900">{story.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">written and illustrated by</p>
              <p className="text-lg font-bold text-indigo-700">{author.trim() || "________"}</p>
            </CardContent>
          </Card>

          {/* Pages */}
          {story.pages.map((page, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Page {i + 1}</span>
                  <div className="flex gap-1.5 print:hidden">
                    <Button size="sm" variant="ghost" onClick={() => speak(page.text)}><Volume2 className="w-3.5 h-3.5 mr-1" />Read aloud</Button>
                    {genEnabled && (
                      <Button size="sm" variant="ghost" onClick={() => illustratePage(i)} disabled={page.imageLoading}>
                        {page.imageLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5 mr-1" />}
                        {page.imageDataUrl ? "Redraw" : "Add picture"}
                      </Button>
                    )}
                  </div>
                </div>
                {page.imageDataUrl && (
                  <img src={page.imageDataUrl} alt="" className="mx-auto max-h-64 rounded-lg object-contain" />
                )}
                <p className="text-lg leading-relaxed text-center">{page.text}</p>
                {symbols && page.keyWords && page.keyWords.length > 0 && (
                  <div className="flex justify-center">
                    <SymbolSupportedWords terms={page.keyWords} size={48} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <p className="text-center text-[10px] text-muted-foreground">
            Symbols by ARASAAC (arasaac.org), CC BY-NC-SA. Illustrations (if used) are AI-generated and teacher-reviewed.
          </p>
        </div>
      )}
    </div>
  );
}
