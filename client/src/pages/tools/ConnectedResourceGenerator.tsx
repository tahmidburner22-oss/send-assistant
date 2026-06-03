/**
 * ConnectedResourceGenerator — SEND Connected Resource Generator (Tool T1).
 * Inspired by EasyClass's "Connected OS", re-imagined SEND-first. FLAGSHIP.
 *
 * One input (topic + year group + SEND profile) → a single CONNECTED, aligned
 * resource pack, all about the same content:
 *   1. Differentiated worksheet outline (3 levels)
 *   2. Presentation slide outline
 *   3. Adapted reading passage (3 reading levels)
 *   4. Accessible quiz (picture/word, no time pressure)
 *   5. Communication-board vocabulary (AAC)
 *   6. Teacher / TA guide (scaffolds, sensory breaks)
 *
 * One AI call (FREE, Gemini-independent via the server fallback chain) returns
 * the whole pack as JSON. Everything renders in one print-ready workspace with
 * deep links to the matching full-featured tools.
 */
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Layers, Sparkles, Printer, Loader2, FileText, Presentation, BookOpen,
  HelpCircle, LayoutGrid, GraduationCap, ArrowRight,
} from "lucide-react";
import { callAI, parseWithFixes } from "@/lib/ai";

interface ConnectedPack {
  worksheet?: { title?: string; sections?: Array<{ heading?: string; items?: string[] }> };
  slides?: Array<{ title?: string; bullets?: string[] }>;
  reading?: { title?: string; levels?: Array<{ label?: string; text?: string }> };
  quiz?: Array<{ question?: string; options?: string[]; answer?: string }>;
  commsVocab?: string[];
  teacherGuide?: string[];
}

const SEND_PROFILES = [
  "Pre-verbal / symbol support",
  "Dyslexia (reading)",
  "ADHD (short bursts)",
  "ASD (needs predictability)",
  "MLD (moderate learning difficulty)",
  "SEMH (social, emotional, mental health)",
  "PMLD (sensory approach)",
];

export default function ConnectedResourceGenerator() {
  const [topic, setTopic] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [profile, setProfile] = useState(SEND_PROFILES[0]);
  const [pack, setPack] = useState<ConnectedPack | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    const t = topic.trim();
    if (!t) {
      toast.error("Enter a topic, e.g. 'Animals that live in the ocean'.");
      return;
    }
    setLoading(true);
    setPack(null);
    try {
      const system =
        "You are a UK SEND specialist teacher. From ONE topic, produce a CONNECTED, " +
        "aligned resource pack (every artefact about the SAME content). Return ONLY JSON: " +
        '{"worksheet":{"title":"...","sections":[{"heading":"...","items":["..."]}]},' +
        '"slides":[{"title":"...","bullets":["..."]}],' +
        '"reading":{"title":"...","levels":[{"label":"Symbol-supported","text":"..."},{"label":"Simple sentences","text":"..."},{"label":"Extended","text":"..."}]},' +
        '"quiz":[{"question":"...","options":["...","..."],"answer":"..."}],' +
        '"commsVocab":["..."],"teacherGuide":["..."]}. ' +
        "Keep it concise: worksheet 3-4 sections (3-4 items each), 4-5 slides (3 bullets), " +
        "reading 3 levels (2-3 sentences each), 4 quiz questions (2-4 options), 10 comms words " +
        "(core + topic), 4-5 teacher/TA tips. Adapt language, scaffolding and sensory advice to " +
        "the SEND profile and year group. British English.";
      const user = `Topic: ${t}\nYear group: ${yearGroup || "not specified"}\nSEND profile: ${profile}`;
      const { text } = await callAI(system, user, 2200, { responseFormat: "json_object" });
      const parsed = parseWithFixes(text) as ConnectedPack;
      if (!parsed || typeof parsed !== "object") {
        toast.error("AI returned an unexpected result — please try again.");
        return;
      }
      setPack(parsed);
      toast.success("Connected pack ready.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg.startsWith("AUTH_REQUIRED") ? "Please log in again to use AI." : "Could not generate the pack — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="print:hidden">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand" />
          Connected Resource Generator
          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Flagship</Badge>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          One topic → a whole connected pack: differentiated worksheet, slides, a reading
          passage at three levels, an accessible quiz, communication-board vocabulary and a
          TA guide — all aligned to the same content and your pupil's profile.
        </p>
      </motion.div>

      <Card className="print:hidden">
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="crg-topic">Topic</Label>
              <Input id="crg-topic" placeholder="e.g. Animals that live in the ocean" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crg-year">Year group (optional)</Label>
              <Input id="crg-year" placeholder="e.g. Year 3" value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>SEND profile</Label>
            <Select value={profile} onValueChange={setProfile}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEND_PROFILES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
              Generate connected pack
            </Button>
            {pack && <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" />Print pack</Button>}
          </div>
        </CardContent>
      </Card>

      {pack && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-center">{topic.trim()} — Connected Pack <span className="text-sm font-normal text-muted-foreground">({profile})</span></h2>

          {/* Worksheet */}
          {pack.worksheet && (
            <PackCard icon={<FileText className="w-4 h-4" />} title={pack.worksheet.title || "Differentiated Worksheet"} link="/worksheets" linkLabel="Build full worksheet">
              {(pack.worksheet.sections || []).map((s, i) => (
                <div key={i} className="mb-3">
                  <h4 className="font-semibold text-sm">{s.heading}</h4>
                  <ul className="list-disc pl-5 text-sm space-y-0.5">{(s.items || []).map((it, j) => <li key={j}>{it}</li>)}</ul>
                </div>
              ))}
            </PackCard>
          )}

          {/* Slides */}
          {pack.slides && pack.slides.length > 0 && (
            <PackCard icon={<Presentation className="w-4 h-4" />} title="Presentation Slides" link="/tools/presentation-maker" linkLabel="Open Presentation Maker">
              <div className="grid gap-2 sm:grid-cols-2">
                {pack.slides.map((sl, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="text-xs font-bold text-brand mb-1">Slide {i + 1}: {sl.title}</div>
                    <ul className="list-disc pl-4 text-xs space-y-0.5">{(sl.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
                  </div>
                ))}
              </div>
            </PackCard>
          )}

          {/* Reading */}
          {pack.reading && (
            <PackCard icon={<BookOpen className="w-4 h-4" />} title={pack.reading.title || "Reading Passage"} link="/reading" linkLabel="Open Reading & Stories">
              <div className="space-y-2">
                {(pack.reading.levels || []).map((lv, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <Badge variant="secondary" className="mb-1.5">{lv.label}</Badge>
                    <p className="text-sm leading-relaxed">{lv.text}</p>
                  </div>
                ))}
              </div>
            </PackCard>
          )}

          {/* Quiz */}
          {pack.quiz && pack.quiz.length > 0 && (
            <PackCard icon={<HelpCircle className="w-4 h-4" />} title="Accessible Quiz" link="/tools/quiz-generator" linkLabel="Open Quiz Generator">
              <ol className="space-y-2 text-sm">
                {pack.quiz.map((q, i) => (
                  <li key={i}>
                    <span className="font-semibold">{i + 1}. {q.question}</span>
                    {q.options && q.options.length > 0 && (
                      <ul className="pl-5 mt-0.5 space-y-0.5">
                        {q.options.map((o, j) => (
                          <li key={j} className={o === q.answer ? "font-semibold text-emerald-700" : ""}>
                            {String.fromCharCode(65 + j)}. {o}{o === q.answer ? "  ✓" : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </PackCard>
          )}

          {/* Comms vocab */}
          {pack.commsVocab && pack.commsVocab.length > 0 && (
            <PackCard icon={<LayoutGrid className="w-4 h-4" />} title="Communication-Board Vocabulary" link="/tools/communication-board" linkLabel="Build the board">
              <div className="flex flex-wrap gap-2">
                {pack.commsVocab.map((w, i) => <span key={i} className="rounded-full border px-3 py-1 text-sm font-semibold capitalize">{w}</span>)}
              </div>
            </PackCard>
          )}

          {/* Teacher guide */}
          {pack.teacherGuide && pack.teacherGuide.length > 0 && (
            <PackCard icon={<GraduationCap className="w-4 h-4" />} title="Teacher / TA Guide">
              <ul className="list-disc pl-5 text-sm space-y-1">{pack.teacherGuide.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </PackCard>
          )}
        </div>
      )}
    </div>
  );
}

function PackCard({ icon, title, link, linkLabel, children }: {
  icon: React.ReactNode; title: string; link?: string; linkLabel?: string; children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-bold flex items-center gap-2 text-sm">
            <span className="w-7 h-7 rounded-lg bg-brand-light text-brand flex items-center justify-center">{icon}</span>
            {title}
          </h3>
          {link && (
            <Link href={link}>
              <span className="print:hidden text-xs font-medium text-brand hover:underline inline-flex items-center gap-0.5 cursor-pointer">
                {linkLabel} <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
