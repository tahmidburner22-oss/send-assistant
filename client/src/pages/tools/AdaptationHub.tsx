/**
 * AdaptationHub — SEND Resource Sharing & Adaptation Hub (Tool T5).
 * Inspired by TeachShare, re-imagined SEND-first.
 *
 * Two free, Gemini-independent AI workflows that adapt EXISTING material rather
 * than starting from scratch:
 *   A) "Adapt for SEND" — paste any text/resource + pick a SEND profile → the AI
 *      simplifies the language, chunks it, adds scaffolds and flags where symbol
 *      support / sensory considerations help.
 *   B) "Video → activity" — paste a video link (+ the title/topic) → the AI builds
 *      accessible comprehension activities (picture-match prompts, sequencing,
 *      simple MCQs, key vocabulary).
 *
 * Note on video: we cannot fetch a third-party video server-side for free, so
 * the teacher pastes the title/topic (and optionally a transcript/description)
 * and the AI works from that — keeping it free and dependency-light.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Recycle, Sparkles, Printer, Loader2, Youtube, Wand2 } from "lucide-react";
import { callAI, parseWithFixes } from "@/lib/ai";

const SEND_PROFILES = [
  "Dyslexia (reading)",
  "MLD (moderate learning difficulty)",
  "ADHD (short bursts)",
  "ASD (needs predictability)",
  "EAL + SEND",
  "Pre-verbal / symbol support",
];

interface VideoActivity {
  summary?: string;
  vocab?: string[];
  questions?: Array<{ question?: string; options?: string[]; answer?: string }>;
  sequencing?: string[];
}

export default function AdaptationHub() {
  // ── Adapt-for-SEND state ──
  const [sourceText, setSourceText] = useState("");
  const [profile, setProfile] = useState(SEND_PROFILES[0]);
  const [adapted, setAdapted] = useState("");
  const [adaptLoading, setAdaptLoading] = useState(false);

  // ── Video-to-activity state ──
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTopic, setVideoTopic] = useState("");
  const [videoNotes, setVideoNotes] = useState("");
  const [activity, setActivity] = useState<VideoActivity | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  async function handleAdapt() {
    const s = sourceText.trim();
    if (s.length < 20) {
      toast.error("Paste a paragraph or more of the resource to adapt.");
      return;
    }
    setAdaptLoading(true);
    setAdapted("");
    try {
      const system =
        "You are a UK SEND specialist. Adapt the teacher's resource for the named SEND " +
        "profile WITHOUT losing the core content. Simplify vocabulary, shorten sentences, " +
        "chunk into clear steps/headings, add a short word bank, and add bracketed notes like " +
        "[symbol support here] or [movement break] where helpful. Return readable Markdown " +
        "(headings, short bullets). British English. Keep it concise.";
      const user = `SEND profile: ${profile}\n\nResource to adapt:\n${s.slice(0, 6000)}`;
      const { text } = await callAI(system, user, 1800, { responseFormat: "text" });
      setAdapted(text.trim());
      toast.success("Adapted for " + profile + ".");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.startsWith("AUTH_REQUIRED") ? "Please log in again to use AI." : "Could not adapt the text — please try again.");
    } finally {
      setAdaptLoading(false);
    }
  }

  async function handleVideo() {
    const topic = videoTopic.trim();
    if (!topic) {
      toast.error("Add the video's title or topic so activities can be built.");
      return;
    }
    setVideoLoading(true);
    setActivity(null);
    try {
      const system =
        "You are a UK SEND teacher turning a video into accessible comprehension activities. " +
        "Return ONLY JSON: {\"summary\":\"...\",\"vocab\":[\"...\"],\"questions\":[{\"question\":\"...\"," +
        "\"options\":[\"...\"],\"answer\":\"...\"}],\"sequencing\":[\"...\"]}. Provide a 2-sentence simple " +
        "summary, 6 key vocabulary words, 4 simple multiple-choice questions (2-4 options, mark the " +
        "answer), and 4-5 sequencing steps (the main events in order). British English, low cognitive load.";
      const user = `Video link: ${videoUrl || "(not given)"}\nTitle/topic: ${topic}\nNotes/description/transcript: ${videoNotes.slice(0, 4000) || "(none)"}`;
      const { text } = await callAI(system, user, 1600, { responseFormat: "json_object" });
      const parsed = parseWithFixes(text) as VideoActivity;
      if (!parsed || typeof parsed !== "object") {
        toast.error("AI returned an unexpected result — please try again.");
        return;
      }
      setActivity(parsed);
      toast.success("Accessible activities ready.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.startsWith("AUTH_REQUIRED") ? "Please log in again to use AI." : "Could not build activities — please try again.");
    } finally {
      setVideoLoading(false);
    }
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="print:hidden">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Recycle className="w-5 h-5 text-brand" />
          Resource Adaptation Hub
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Adapt resources you already have — simplify any text for a specific SEND profile, or
          turn a video into accessible comprehension activities. Free, and works without Gemini.
        </p>
      </motion.div>

      <Tabs defaultValue="adapt">
        <TabsList className="print:hidden">
          <TabsTrigger value="adapt"><Wand2 className="w-4 h-4 mr-1.5" />Adapt for SEND</TabsTrigger>
          <TabsTrigger value="video"><Youtube className="w-4 h-4 mr-1.5" />Video → activity</TabsTrigger>
        </TabsList>

        {/* ── Adapt for SEND ── */}
        <TabsContent value="adapt" className="space-y-4">
          <Card className="print:hidden">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ah-src">Paste the resource text</Label>
                <Textarea id="ah-src" rows={6} placeholder="Paste a worksheet, passage or instructions here…" value={sourceText} onChange={(e) => setSourceText(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Adapt for</Label>
                  <Select value={profile} onValueChange={setProfile}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SEND_PROFILES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAdapt} disabled={adaptLoading}>
                    {adaptLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                    Adapt for SEND
                  </Button>
                  {adapted && <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" />Print</Button>}
                </div>
              </div>
            </CardContent>
          </Card>
          {adapted && (
            <Card><CardContent className="p-5">
              <Badge variant="secondary" className="mb-2">Adapted — {profile}</Badge>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">{adapted}</div>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* ── Video → activity ── */}
        <TabsContent value="video" className="space-y-4">
          <Card className="print:hidden">
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ah-url">Video link (optional)</Label>
                  <Input id="ah-url" placeholder="https://www.youtube.com/watch?v=…" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ah-topic">Title / topic</Label>
                  <Input id="ah-topic" placeholder="e.g. The life cycle of a frog" value={videoTopic} onChange={(e) => setVideoTopic(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ah-notes">Description / transcript (optional — improves accuracy)</Label>
                <Textarea id="ah-notes" rows={4} placeholder="Paste the video description or a few notes about what it covers…" value={videoNotes} onChange={(e) => setVideoNotes(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleVideo} disabled={videoLoading}>
                  {videoLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                  Build activities
                </Button>
                {activity && <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" />Print</Button>}
              </div>
            </CardContent>
          </Card>

          {activity && (
            <div className="space-y-3">
              {activity.summary && (
                <Card><CardContent className="p-4"><h3 className="font-bold text-sm mb-1">Summary</h3><p className="text-sm leading-relaxed">{activity.summary}</p></CardContent></Card>
              )}
              {activity.vocab && activity.vocab.length > 0 && (
                <Card><CardContent className="p-4"><h3 className="font-bold text-sm mb-2">Key words</h3>
                  <div className="flex flex-wrap gap-2">{activity.vocab.map((w, i) => <span key={i} className="rounded-full border px-3 py-1 text-sm font-semibold capitalize">{w}</span>)}</div>
                </CardContent></Card>
              )}
              {activity.sequencing && activity.sequencing.length > 0 && (
                <Card><CardContent className="p-4"><h3 className="font-bold text-sm mb-2">Put the events in order</h3>
                  <ol className="list-decimal pl-5 text-sm space-y-1">{activity.sequencing.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </CardContent></Card>
              )}
              {activity.questions && activity.questions.length > 0 && (
                <Card><CardContent className="p-4"><h3 className="font-bold text-sm mb-2">Comprehension questions</h3>
                  <ol className="space-y-2 text-sm">
                    {activity.questions.map((q, i) => (
                      <li key={i}>
                        <span className="font-semibold">{i + 1}. {q.question}</span>
                        {q.options && q.options.length > 0 && (
                          <ul className="pl-5 mt-0.5 space-y-0.5">
                            {q.options.map((o, j) => (
                              <li key={j} className={o === q.answer ? "font-semibold text-emerald-700" : ""}>{String.fromCharCode(65 + j)}. {o}{o === q.answer ? "  ✓" : ""}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ol>
                </CardContent></Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
