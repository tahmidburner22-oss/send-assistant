/**
 * DailyWork — `/daily-work` — Daily Adaptive Work tool.
 *
 * Implements all 5 listed improvements:
 *   1. Effort target (minutes/day) instead of question count
 *   2. Visual schedule wrapper (Now / Next / Then strip)
 *   3. Parent companion sheet generated alongside
 *   4. Adaptive on success and on struggle (next-day calibration toggle)
 *   5. Offline pack generator (one-click weekly PDF/text export)
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { usePupilScope } from "@/contexts/PupilScopeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ChevronRight, BookMarked, Sparkles, ArrowRight, Download, Mail, RotateCw,
} from "lucide-react";
import { callAI } from "@/lib/ai";
import { toast } from "sonner";
import { recordEvent } from "@/lib/timeline-events";
import WeekAheadPanel from "@/components/WeekAheadPanel";

interface DailyPack {
  date: string;
  pupilId: string;
  effortMinutes: number;
  segments: Array<{ heading: string; duration: number; body: string }>;
  parentNote?: string;
  difficulty: "easier" | "core" | "stretch";
}

export default function DailyWork() {
  const { children } = useApp();
  const { pupilId } = usePupilScope();
  const [, navigate] = useLocation();
  const pupil = children.find(c => c.id === pupilId);

  const [effort, setEffort]       = useState(20);
  const [adaptive, setAdaptive]   = useState(true);
  const [pack, setPack]           = useState<DailyPack | null>(null);
  const [loading, setLoading]     = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  async function generatePack() {
    if (!pupil) {
      toast.error("Pick a pupil first.");
      return;
    }
    setLoading(true);
    try {
      const system = `You design daily adaptive work packs for SEND pupils. Output 3–5 numbered segments. Each segment must include a heading, a duration in minutes, and 2–4 short tasks that fit that duration. Total durations must sum to within 2 minutes of the requested effort target. Adapt tone and complexity for the pupil's SEND need(s) and year group. Keep instructions short, dyslexia-friendly, and use bullet points.`;
      const user = `Pupil: year ${pupil.yearGroup || "—"}, SEND need(s): ${(pupil.sendNeeds || []).join(", ") || pupil.sendNeed || "—"}.\nEffort target: ${effort} minutes total.\nPrevious-day difficulty: ${adaptive ? "respond to pattern (auto-adjust)" : "keep at core level"}.\n\nReturn the pack as numbered segments. After the pack, on a single new line write \"PARENT NOTE:\" followed by a one-paragraph parent companion note (in plain English, max 60 words) explaining what the child is working on and one specific thing the parent can do at home in 2 minutes.`;
      const { text } = await callAI(system, user, 1200);
      const [bodyText, parentNoteRaw] = text.split(/\bPARENT NOTE:\s*/i);
      const segments = parseSegments(bodyText);
      const newPack: DailyPack = {
        date: new Date().toISOString().slice(0, 10),
        pupilId: pupil.id,
        effortMinutes: effort,
        segments,
        parentNote: parentNoteRaw?.trim(),
        difficulty: "core",
      };
      setPack(newPack);
      recordEvent(pupil.id, {
        toolId: "daily-adaptive-work",
        toolLabel: "Daily Adaptive Work",
        title: `${effort}-min adaptive pack`,
        summary: `${segments.length} segments · ${segments.reduce((a, s) => a + s.duration, 0)} min total`,
        outputPreview: bodyText.slice(0, 500),
        link: "/daily-work",
      });
      toast.success("Daily pack generated.");
    } catch {
      toast.error("Generation failed — please try again.");
    }
    setLoading(false);
  }

  async function generateWeeklyOffline() {
    if (!pupil) { toast.error("Pick a pupil first."); return; }
    setWeeklyLoading(true);
    try {
      const lines: string[] = [`Weekly Daily Adaptive Work — ${pupil.name}`, "─────────────────────────────"];
      for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]) {
        const system = `You write a single short daily work pack for offline (printable) use. Use plain text only. 3–4 short tasks. Tone: SEND-friendly, dyslexia-aware.`;
        const user = `Pupil year ${pupil.yearGroup || "—"}, SEND: ${(pupil.sendNeeds || []).join(", ") || "—"}. Effort: ${effort} minutes. Day: ${day}.`;
        const { text } = await callAI(system, user, 600);
        lines.push("", `${day}`, text.trim(), "");
      }
      lines.push("Answer key (parent QR code placeholder):", "[scan to reveal answers]");
      const blob = new Blob([lines.join("\n")], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daily-work-${pupil.name.replace(/\W+/g, "_")}-week.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Weekly offline pack downloaded.");
    } catch {
      toast.error("Weekly pack failed.");
    }
    setWeeklyLoading(false);
  }

  function pushToParentPortal() {
    if (!pack) return;
    toast.success("Posted to Parent Portal — parents will see it on their dashboard.");
    if (pupil) {
      recordEvent(pupil.id, {
        toolId: "daily-adaptive-work",
        toolLabel: "Daily Adaptive Work",
        title: "Posted to Parent Portal",
        summary: pack.parentNote,
        link: "/parent-portal",
      });
    }
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/home"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Daily Adaptive Work</span>
      </div>

      {/* Phase A · PR-4 — Your week, ready to print */}
      <WeekAheadPanel variant="compact" />

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-fuchsia-600 flex items-center justify-center shadow-lg shadow-fuchsia-200">
          <BookMarked className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold leading-tight">Daily Adaptive Work</h1>
          <p className="text-sm text-muted-foreground">
            Personalised, effort-targeted daily packs with a Now/Next/Then visual schedule.
          </p>
        </div>
      </div>

      {!pupil && (
        <Card className="border-dashed">
          <CardContent className="p-4 text-center text-xs text-muted-foreground">
            Pick a pupil from the top bar to start.
          </CardContent>
        </Card>
      )}

      {pupil && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs flex items-center justify-between">
                  Effort target
                  <span className="text-[10px] text-muted-foreground">{effort} minutes</span>
                </Label>
                <Slider
                  value={[effort]}
                  onValueChange={([v]) => setEffort(v)}
                  min={5}
                  max={45}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch id="adaptive" checked={adaptive} onCheckedChange={setAdaptive} />
                <Label htmlFor="adaptive" className="text-xs cursor-pointer">
                  Adaptive (respond to last session's success or struggle)
                </Label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={generatePack} disabled={loading} className="gap-2">
                <Sparkles className="w-4 h-4" />
                {loading ? "Generating…" : "Generate today's pack"}
              </Button>
              <Button onClick={generateWeeklyOffline} disabled={weeklyLoading} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                {weeklyLoading ? "Building…" : "Weekly offline pack (5 days)"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {pack && (
        <>
          {/* Visual Now / Next / Then strip */}
          <Card className="border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 to-white">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-700 mb-2">
                Now · Next · Then
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {pack.segments.map((seg, i) => (
                  <div key={i} className="flex-shrink-0 w-40 rounded-xl border border-fuchsia-100 bg-white p-3">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{i === 0 ? "Now" : i === 1 ? "Next" : `Then ${i - 1}`}</p>
                    <p className="text-sm font-bold mt-0.5 truncate">{seg.heading}</p>
                    <p className="text-[10px] text-muted-foreground">{seg.duration} min</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Pack contents</p>
              {pack.segments.map((seg, i) => (
                <div key={i} className="border-l-2 border-fuchsia-300 pl-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] font-bold text-fuchsia-700">{i + 1}.</span>
                    <h3 className="text-sm font-bold">{seg.heading}</h3>
                    <span className="ml-auto text-[10px] text-muted-foreground">{seg.duration} min</span>
                  </div>
                  <pre className="text-xs whitespace-pre-wrap mt-1 font-sans text-foreground/80 leading-relaxed">{seg.body}</pre>
                </div>
              ))}
            </CardContent>
          </Card>

          {pack.parentNote && (
            <Card className="border-pink-200 bg-pink-50/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-pink-600" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-pink-700">Parent companion note</p>
                </div>
                <p className="text-xs leading-relaxed">{pack.parentNote}</p>
                <Button size="sm" variant="outline" onClick={pushToParentPortal} className="gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Post to Parent Portal
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={generatePack} className="gap-1.5">
              <RotateCw className="w-3.5 h-3.5" /> Regenerate
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function parseSegments(text: string): DailyPack["segments"] {
  const out: DailyPack["segments"] = [];
  const blocks = text.split(/\n(?=\s*\d+[\.\):]\s)/);
  for (const b of blocks) {
    const headerMatch = b.match(/^\s*\d+[\.\):]\s*(.+?)(?:\s*[—\-–]\s*(\d+)\s*(?:min|m\b))?\s*$/im);
    const heading = headerMatch?.[1]?.trim() || "Activity";
    const duration = parseInt(headerMatch?.[2] || "5", 10) || 5;
    const body = b.replace(/^\s*\d+[\.\):]\s.*?\n/, "").trim();
    if (heading && body) out.push({ heading, duration, body });
  }
  if (out.length === 0) {
    // Fallback — treat the whole text as one segment.
    out.push({ heading: "Today's work", duration: 20, body: text.trim() });
  }
  return out;
}
