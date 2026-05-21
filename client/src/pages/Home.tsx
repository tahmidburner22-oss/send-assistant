import { useApp } from "@/contexts/AppContext";
import { useUserPreferences, ALL_DASHBOARD_CARDS } from "@/contexts/UserPreferencesContext";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cobsTips, subjects } from "@/lib/send-data";
import {
  FileText, Sparkles, Users, BookOpen, Calculator,
  FlaskConical, Landmark, Globe, Palette, Music, Dumbbell, Monitor,
  Wrench, Heart, Languages, UserCheck, Briefcase, Theater, Lightbulb,
  GraduationCap, BarChart2, CalendarDays, Brain, ScrollText, Gamepad2, Settings,
  ArrowRight, PlayCircle, ClipboardList, Stethoscope, Pencil, MessageSquare, ChevronRight,
  Send, Loader2, Wand2, X, Layers,
  Clock, Star, Sun, Moon, Sunrise, Sunset, Zap,
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { callAI } from "@/lib/ai";
import WeekAheadPanel from "@/components/WeekAheadPanel";
import UnitPackDialog from "@/components/UnitPackDialog";

const subjectIcons: Record<string, any> = {
  english: BookOpen, mathematics: Calculator, science: FlaskConical,
  history: Landmark, geography: Globe, art: Palette, music: Music,
  pe: Dumbbell, computing: Monitor, dt: Wrench, re: Heart,
  mfl: Languages, pshe: UserCheck, business: Briefcase, drama: Theater,
};

const cardIconMap: Record<string, { icon: any; color: string; href: string }> = {
  "worksheets":    { icon: FileText,     color: "bg-brand-light text-brand",         href: "/worksheets" },
  "differentiate": { icon: Sparkles,     color: "bg-purple-50 text-purple-600",       href: "/differentiate" },
  "quiz-game":     { icon: Gamepad2,     color: "bg-orange-50 text-orange-600",       href: "/quiz-game" },
  "revision-hub":  { icon: Brain,        color: "bg-indigo-50 text-indigo-600",       href: "/revision-hub" },
  "past-papers":   { icon: ScrollText,   color: "bg-teal-50 text-teal-600",           href: "/past-papers" },
  "reading":       { icon: BookOpen,     color: "bg-emerald-50 text-emerald-600",     href: "/reading" },
  "children":      { icon: Users,        color: "bg-blue-50 text-blue-600",           href: "/children" },
  "analytics":     { icon: BarChart2,    color: "bg-rose-50 text-rose-600",           href: "/analytics" },
  "daily-briefing":{ icon: CalendarDays, color: "bg-amber-50 text-amber-600",         href: "/daily-briefing" },
  "templates":     { icon: GraduationCap,color: "bg-cyan-50 text-cyan-600",           href: "/templates" },
  "attendance":    { icon: CalendarDays, color: "bg-green-50 text-green-600",         href: "/attendance" },
  "behaviour":     { icon: UserCheck,    color: "bg-pink-50 text-pink-600",           href: "/behaviour-tracking" },
};

// ── Read in-progress items from localStorage (risk assessment, SEND screener) ──
function getLocalInProgressItems(): Array<{
  title: string; subtitle: string; createdAt: string;
  href: string; icon: any; color: string; badge: string;
}> {
  const items: Array<{
    title: string; subtitle: string; createdAt: string;
    href: string; icon: any; color: string; badge: string;
  }> = [];

  try {
    // Risk Assessment
    const raSavedAt = localStorage.getItem("adaptly_risk_assessment_v1_savedAt");
    const raRaw = localStorage.getItem("adaptly_risk_assessment_v1");
    const raStep = localStorage.getItem("adaptly_risk_assessment_step_v1");
    if (raSavedAt && raRaw && raStep) {
      const raData = JSON.parse(raRaw);
      const stepNum = parseInt(raStep, 10);
      // Only show if not on the final step (step 9 = signatures = essentially complete)
      if (stepNum < 9) {
        const venue = raData.venueName || "unknown venue";
        const stepLabel = ["", "Trip Overview", "Type of Group", "Staffing", "Equipment",
          "Venue & Environment", "Travel", "Emergency Procedures", "Children's Info", "Signatures"][stepNum] || `Step ${stepNum}`;
        items.push({
          title: `Risk Assessment — ${venue}`,
          subtitle: `Last on: ${stepLabel} (step ${stepNum} of 9)`,
          createdAt: raSavedAt,
          href: "/tools/risk-assessment",
          icon: ClipboardList,
          color: "text-red-600 bg-red-50",
          badge: "Risk Assessment",
        });
      }
    }
  } catch (_) {}

  try {
    // SEND Screener — check for any saved screener progress
    // The screener saves progress per-assignment via the server, but may also
    // store a draft in localStorage under a known key
    const screenerRaw = localStorage.getItem("adaptly_send_screener_draft");
    if (screenerRaw) {
      const screenerData = JSON.parse(screenerRaw);
      if (screenerData?.savedAt) {
        items.push({
          title: "SEND Screener",
          subtitle: screenerData.pupilName ? `For: ${screenerData.pupilName}` : "Draft in progress",
          createdAt: screenerData.savedAt,
          href: "/send-screener",
          icon: Stethoscope,
          color: "text-blue-600 bg-blue-50",
          badge: "SEND Screener",
        });
      }
    }
  } catch (_) {}

  return items;
}

// ── Time-aware greeting helper ───────────────────────────────────────────────
// Returns a greeting label, a matching icon, and a gradient string used both
// for the icon halo and the gradient-text on the user's name. Pure: only
// reads `new Date()`, no React state, so it can live outside the component.
function getTimeGreeting(): { label: string; Icon: any; gradient: string } {
  const h = new Date().getHours();
  if (h < 5)  return { label: "Working late",     Icon: Moon,    gradient: "from-indigo-500 via-purple-500 to-fuchsia-500" };
  if (h < 12) return { label: "Good morning",     Icon: Sunrise, gradient: "from-amber-500 via-orange-400 to-rose-400" };
  if (h < 17) return { label: "Good afternoon",   Icon: Sun,     gradient: "from-emerald-500 via-teal-500 to-cyan-500" };
  if (h < 21) return { label: "Good evening",     Icon: Sunset,  gradient: "from-orange-500 via-rose-500 to-fuchsia-500" };
  return       { label: "Working late",     Icon: Moon,    gradient: "from-indigo-500 via-purple-500 to-fuchsia-500" };
}

function todayLong(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Three rotating example prompts for the AI command bar. Clicking one fills
// the textarea so first-time visitors immediately see the kind of request
// the dispatcher understands.
const NL_SUGGESTIONS = [
  "Year 9 maths worksheet on fractions for a pupil with dyslexia",
  "Lesson plan: KS3 Romeo & Juliet, 50 min, mixed ability",
  "Social story for Year 4 transition to a new classroom",
];

export default function Home() {
  const { user, worksheetHistory, storyHistory, differentiationHistory, children, refreshData } = useApp();
  const { preferences } = useUserPreferences();

  useEffect(() => { refreshData(); }, []);
  const [tip] = useState(() => cobsTips[Math.floor(Math.random() * cobsTips.length)]);
  // Phase C · PC5 (pack-1) — controls the unit-pack dialog launched from the
  // "Plan a unit" tile rendered next to WeekAheadPanel.
  const [unitPackOpen, setUnitPackOpen] = useState(false);

  const totalWorksheets = worksheetHistory.length;
  const totalStories = storyHistory.length;
  const totalDifferentiations = differentiationHistory.length;
  const totalChildren = children.length;
  const timeSaved = (totalWorksheets * 15) + (totalStories * 10) + (totalDifferentiations * 8);
  const avgRating = useMemo(() => {
    const rated = worksheetHistory.filter(w => w.rating);
    if (rated.length === 0) return null;
    return (rated.reduce((sum, w) => sum + (w.rating || 0), 0) / rated.length).toFixed(1);
  }, [worksheetHistory]);

  const stats: Array<{
    label: string;
    value: number | string;
    color: string;
    icon: any;
    gradient: string;
  }> = [
    { label: "Worksheets", value: totalWorksheets, color: "text-brand",      icon: FileText, gradient: "from-brand via-emerald-500 to-teal-500" },
    { label: "Stories",    value: totalStories,    color: "text-purple-600", icon: BookOpen, gradient: "from-purple-500 via-fuchsia-500 to-pink-500" },
    { label: "Pupils",     value: totalChildren,   color: "text-blue-600",   icon: Users,    gradient: "from-blue-500 via-sky-500 to-cyan-500" },
    { label: "Time Saved", value: `${timeSaved}m`, color: "text-amber-600",  icon: Clock,    gradient: "from-amber-500 via-orange-500 to-rose-500" },
    { label: "Avg Rating", value: avgRating || "—",color: "text-rose-500",   icon: Star,     gradient: "from-rose-500 via-pink-500 to-fuchsia-500" },
  ];

  // ── Single "Continue where you left off" item ──────────────────────────────
  // Gather all candidates from server history + localStorage tools, pick the newest one
  const continueItem = useMemo(() => {
    const candidates: Array<{
      title: string; subtitle: string; createdAt: string;
      href: string; icon: any; color: string; badge: string;
    }> = [];

    // Most recent unrated worksheet
    const latestWs = worksheetHistory.find(w => !w.rating);
    if (latestWs) {
      candidates.push({
        title: latestWs.title,
        subtitle: latestWs.subject
          ? `${latestWs.subject}${latestWs.yearGroup ? " · " + latestWs.yearGroup : ""}`
          : "Worksheet",
        createdAt: latestWs.createdAt,
        href: "/worksheets",
        icon: FileText,
        color: "text-brand bg-brand-light",
        badge: "Worksheet",
      });
    }

    // Most recent story
    if (storyHistory.length > 0) {
      const s = storyHistory[0];
      candidates.push({
        title: s.title,
        subtitle: `${s.genre || "Story"}${s.yearGroup ? " · " + s.yearGroup : ""}`,
        createdAt: s.createdAt,
        href: "/reading",
        icon: BookOpen,
        color: "text-emerald-600 bg-emerald-50",
        badge: "Story",
      });
    }

    // Most recent differentiation
    if (differentiationHistory.length > 0) {
      const d = differentiationHistory[0];
      candidates.push({
        title: d.subject ? `${d.subject} differentiation` : "Differentiated task",
        subtitle: d.yearGroup || "Differentiation",
        createdAt: d.createdAt,
        href: "/differentiate",
        icon: Sparkles,
        color: "text-purple-600 bg-purple-50",
        badge: "Differentiation",
      });
    }

    // localStorage-based tools (risk assessment, SEND screener)
    candidates.push(...getLocalInProgressItems());

    if (candidates.length === 0) return null;

    // Return the single most recent
    return candidates.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [worksheetHistory, storyHistory, differentiationHistory]);

  // ── Recent Activity ────────────────────────────────────────────────────────
  const recentItems = [
    ...worksheetHistory.slice(0, 3).map(w => ({
      title: w.title,
      subtitle: w.subject ? `${w.subject}${w.yearGroup ? " · " + w.yearGroup : ""}` : "",
      createdAt: w.createdAt,
      href: "/worksheets",
      icon: FileText,
      color: "text-brand bg-brand-light",
    })),
    ...storyHistory.slice(0, 2).map(s => ({
      title: s.title,
      subtitle: `${s.genre || "Story"}${s.yearGroup ? " · " + s.yearGroup : ""}`,
      createdAt: s.createdAt,
      href: "/reading",
      icon: BookOpen,
      color: "text-emerald-600 bg-emerald-50",
    })),
    ...differentiationHistory.slice(0, 2).map(d => ({
      title: d.subject ? `${d.subject} differentiation` : "Differentiated task",
      subtitle: d.yearGroup || "",
      createdAt: d.createdAt,
      href: "/differentiate",
      icon: Sparkles,
      color: "text-purple-600 bg-purple-50",
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const visibleCards = ALL_DASHBOARD_CARDS.filter(card =>
    preferences.dashboardCards.includes(card.id)
  );

  // ── Natural Language Dispatcher ───────────────────────────────────────────
  const [, setLocation] = useLocation();
  const [nlQuery, setNlQuery]           = useState("");
  const [nlLoading, setNlLoading]       = useState(false);
  const [nlDialog, setNlDialog]         = useState<{
    show: boolean;
    title: string;
    message: string;
    fields: Array<{ label: string; key: string; placeholder: string; value: string }>;
    href: string;
    params: Record<string, string>;
  } | null>(null);
  const nlRef = useRef<HTMLTextAreaElement>(null);

  // Full tool catalogue — what the AI can route to
  const TOOL_CATALOGUE = `
AVAILABLE TOOLS (name → route → what it does → required fields):
worksheets → /worksheets → Generate SEND-adapted worksheets → subject, topic, yearGroup
differentiate → /differentiate → Differentiate existing tasks for SEND → task text, difficulty level, sendNeed
lesson-planner → /tools/lesson-planner → Full lesson plan with timing → subject, topic, yearGroup, duration
medium-term-planner → /tools/medium-term-planner → Scheme of work over weeks → subject, topic, yearGroup, weeks
quiz-generator → /tools/quiz-generator → Generate a quiz with questions → subject, topic, yearGroup
rubric-generator → /tools/rubric-generator → Assessment rubric or mark scheme → task description, yearGroup
comprehension-generator → /tools/comprehension-generator → Comprehension passage + questions → subject, topic, yearGroup
exit-ticket → /tools/exit-ticket → Quick end-of-lesson check → subject, learningObjective, yearGroup
flash-cards → /tools/flash-cards → Revision flash cards → subject, topic, yearGroup
vocabulary-builder → /tools/vocabulary-builder → Vocabulary lists and mats → subject, topic, yearGroup
social-stories → /tools/social-stories → Social stories for SEND pupils → pupilName, situation, sendNeed
pupil-passport → /tools/pupil-passport → One-page pupil profile → pupilName, yearGroup, sendNeed
smart-targets → /tools/smart-targets → SMART targets for SEND pupils → pupilName, sendNeed, area
behaviour-plan → /tools/behaviour-plan → Positive behaviour support plan → pupilName, sendNeed, concern
iep-generator → /tools/iep-generator → Full EHCP/IEP document → pupilName, yearGroup, sendNeed
wellbeing-support → /tools/wellbeing-support → Wellbeing intervention plan → pupilName, yearGroup, concern
report-comments → /tools/report-comments → School report comments → studentName, subject, yearGroup, pronoun
parent-newsletter → /tools/parent-newsletter → Parent letters and newsletters → schoolName, type, content
text-rewriter → /tools/text-rewriter → Simplify or adapt any text → (text provided by user)
reading → /reading → Personalised story generator → genre, yearGroup, sendNeed
send-screener → /send-screener → SEND needs screening questionnaire → pupilName, yearGroup
risk-assessment → /tools/risk-assessment → Trip risk assessment → venueName
revision-hub → /revision-hub → Podcast + quiz revision tool → subject, topic
`;

  const handleNLSubmit = async () => {
    const q = nlQuery.trim();
    if (!q) return;
    setNlLoading(true);
    try {
      const { text } = await callAI(
        `You are an educational assistant routing teacher requests to the correct tool.
Given a teacher's natural language request, determine:
1. Which tool best matches their request
2. What information can be extracted from their request
3. What required information is MISSING

${TOOL_CATALOGUE}

Respond with ONLY valid JSON in this exact format:
{
  "tool": "tool-name-from-catalogue",
  "route": "/route/from/catalogue",
  "confidence": "high|medium|low",
  "extracted": { "field": "value from their request" },
  "missing": [{ "key": "fieldKey", "label": "Human label", "placeholder": "e.g. example" }],
  "summary": "One sentence: what you understood them to want"
}

Rules:
- Only include fields in "extracted" if clearly stated in the request
- Put in "missing" any REQUIRED fields not mentioned
- For text-rewriter: if they pasted text, put it in extracted.text and missing = []
- confidence "high" = route is clear, confidence "low" = ambiguous
- If completely unclear, use tool "worksheets" as safe default`,
        `Teacher's request: "${q}"`
      );

      let parsed: any;
      try {
        const clean = text.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean);
      } catch {
        // AI response wasn't valid JSON — go straight to worksheets
        setLocation("/worksheets");
        return;
      }

      const { route, missing = [], extracted = {}, summary } = parsed;

      if (!missing || missing.length === 0) {
        // All info present — build query string and navigate
        const params = new URLSearchParams(extracted).toString();
        setLocation(params ? `${route}?${params}` : route);
        setNlQuery("");
      } else {
        // Missing required fields — show the "Almost there" dialog
        setNlDialog({
          show: true,
          title: "Almost there — just a few more details",
          message: summary || `I can help with that! I just need a couple more details to get started.`,
          fields: missing.map((f: any) => ({ ...f, value: extracted[f.key] || "" })),
          href: route,
          params: extracted,
        });
      }
    } catch {
      // Network/AI error — go to worksheets as safe fallback
      setLocation("/worksheets");
    } finally {
      setNlLoading(false);
    }
  };

  const visibleSubjects = subjects.filter(subject =>
    (subject.id !== "eleven-plus" || (preferences.show11Plus ?? false)) &&
    (preferences.dashboardSubjects.length === 0 ||
    preferences.dashboardSubjects.some(s =>
      s.toLowerCase() === subject.name.toLowerCase() ||
      s.toLowerCase() === subject.id.toLowerCase()
    ))
  );

  // ── Derived appearance helpers ─────────────────────────────────────────────
  const iconShape   = preferences.iconShape        ?? "rounded";
  const iconBorder  = preferences.iconBorderStyle  ?? "none";
  const cardStyle   = preferences.cardStyle        ?? "default";
  const density     = preferences.layoutDensity    ?? "comfortable";

  const iconShapeClass =
    iconShape === "circle" ? "rounded-full" :
    iconShape === "square" ? "rounded-none" :
    "rounded-xl";

  const iconBorderClass =
    iconBorder === "subtle" ? "ring-1 ring-border/60" :
    iconBorder === "bold"   ? "ring-2 ring-brand/40" :
    "";

  const cardClass =
    cardStyle === "flat"     ? "shadow-none border-border/30" :
    cardStyle === "elevated" ? "shadow-md border-border/20" :
    "border-border/50";

  const sectionGap = density === "compact" ? "space-y-5" : "space-y-7";

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // ── Time-aware greeting (Good morning / afternoon / evening) ──────────────
  // Computed once per render — cheap, and matches the user's local hour
  // every time the dashboard mounts. We don't ticker it because greetings
  // changing mid-session would be visually unsettling.
  const greeting = useMemo(() => getTimeGreeting(), []);
  const GreetingIcon = greeting.Icon;

  // Handy boolean — whether the teacher has any signal of activity at all.
  // Used to soften the welcome subtitle for first-time / empty-state users
  // so the dashboard never reads "you have saved 0 minutes" on day one.
  const hasActivity = totalWorksheets + totalStories + totalDifferentiations > 0;

  return (
    <div className={`px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto ${sectionGap}`}>
      {/* ────────────────────────────────────────────────────────────────────
          Welcome hero — time-aware greeting, gradient name, decorative blobs.
          A premium replacement for the previous two-line text header.
          ──────────────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-background via-brand-light/30 to-background p-5 sm:p-7 lg:p-8">
          {/* Soft decorative blobs — pure CSS, no extra paint cost */}
          <div aria-hidden className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-brand/15 via-emerald-200/30 to-cyan-200/15 blur-3xl pointer-events-none" />
          <div aria-hidden className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-gradient-to-br from-purple-200/20 via-pink-200/15 to-rose-200/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${greeting.gradient} text-white shadow-lg shadow-brand/20`}>
              <GreetingIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground/80">
                {todayLong()}
              </p>
              <h1 className="mt-1.5 text-2xl sm:text-3xl lg:text-[2.25rem] font-bold tracking-tight leading-tight">
                {greeting.label},{" "}
                <span className={`bg-gradient-to-r ${greeting.gradient} bg-clip-text text-transparent`}>
                  {user?.displayName || "Teacher"}
                </span>
              </h1>
              <p className="mt-2 text-sm sm:text-[15px] text-muted-foreground max-w-xl leading-relaxed">
                {hasActivity ? (
                  <>
                    Here's everything you've worked on, ready to keep moving. Adaptly has saved you{" "}
                    <span className="font-semibold text-foreground tabular-nums">{timeSaved} minutes</span> of planning so far.
                  </>
                ) : (
                  <>Pick up a tool below, or just type what you need into the command bar — Adaptly will route you to the right place.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ────────────────────────────────────────────────────────────────────
          Top row — Week-ahead panel + Plan-a-unit launcher.
          On lg+ they sit side by side (2:1); on smaller screens they stack.
          ──────────────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 items-stretch">
          <div className="lg:col-span-2">
            <WeekAheadPanel />
          </div>

          {/* Plan a unit — promoted to a richer launcher tile */}
          <Card
            className={`relative overflow-hidden cursor-pointer group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${cardClass} bg-gradient-to-br from-emerald-50 via-teal-50/60 to-cyan-50/40`}
            onClick={() => setUnitPackOpen(true)}
            role="button"
            aria-label="Plan a unit — generate a full scheme of work as one ZIP"
          >
            <div aria-hidden className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-300/30 blur-3xl pointer-events-none" />
            <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <CardContent className="relative p-4 sm:p-5 h-full flex flex-col justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30 ${iconBorderClass}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-semibold text-foreground">Plan a unit</span>
                    <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">New</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                    Generate every worksheet for a 1–6 week unit in one ZIP. Pupil + teacher PDFs per lesson.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-emerald-700">
                <span className="inline-flex items-center gap-1">
                  <Zap className="w-3 h-3" /> One click · full scheme
                </span>
                <span className="inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Start <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
      <UnitPackDialog open={unitPackOpen} onOpenChange={setUnitPackOpen} />

      {/* ────────────────────────────────────────────────────────────────────
          Stats strip — bigger numerals, gradient hairline per metric, icon
          chip alongside the label so each card is scannable at a glance.
          ──────────────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className={`relative overflow-hidden ${cardClass}`}>
                <div aria-hidden className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${stat.gradient}`} />
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <div className={`mt-1.5 text-2xl sm:text-3xl font-bold tabular-nums leading-none ${stat.color}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* ────────────────────────────────────────────────────────────────────
          AI command bar — wider, premium gradient surround, suggestion
          chips, gradient send button. Same NL dispatcher behaviour.
          ──────────────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="relative">
          {/* Soft outer glow — only painted when not focus-within to avoid
              double-shadowing the focus state. */}
          <div aria-hidden className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-brand/30 via-purple-500/25 to-indigo-500/30 opacity-50 blur-xl pointer-events-none" />
          <div className="relative rounded-2xl border border-brand/25 bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/30 dark:from-background dark:via-indigo-950/40 dark:to-purple-950/30 shadow-sm focus-within:border-brand/60 focus-within:shadow-md transition-all">
            <div className="flex items-start gap-3 p-3 sm:p-4">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-purple-500 text-white flex items-center justify-center shadow-md shadow-brand/30 mt-0.5">
                <Wand2 className="w-4 h-4" />
              </div>
              <textarea
                ref={nlRef}
                value={nlQuery}
                onChange={e => { setNlQuery(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleNLSubmit(); } }}
                placeholder="Ask Adaptly for anything — e.g. 'a Year 9 fractions worksheet for a pupil with dyslexia'"
                rows={1}
                className="flex-1 resize-none bg-transparent border-0 outline-none text-sm sm:text-[15px] text-foreground placeholder:text-muted-foreground/60 leading-relaxed pt-1.5"
                style={{ minHeight: "26px", maxHeight: "140px" }}
                disabled={nlLoading}
              />
              <button
                onClick={handleNLSubmit}
                disabled={nlLoading || !nlQuery.trim()}
                aria-label="Send request"
                className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-emerald-600 hover:from-brand hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-md shadow-brand/30 transition-all"
              >
                {nlLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
            {/* Suggestion chips — only render when the textarea is empty so
                they don't crowd the user's typed query. */}
            {!nlQuery && !nlLoading && (
              <div className="px-3 sm:px-4 pb-3 -mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 mr-0.5">Try</span>
                {NL_SUGGESTIONS.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => { setNlQuery(chip); nlRef.current?.focus(); }}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-background/60 backdrop-blur hover:border-brand/40 hover:bg-brand-light/40 hover:text-foreground text-muted-foreground transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-brand/70" />
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* "Almost there" dialog — unchanged behaviour, same markup. */}
      {nlDialog?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setNlDialog(null)}>
          <div className="bg-background rounded-2xl shadow-2xl border border-border/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-purple-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-brand/30">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">{nlDialog.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{nlDialog.message}</p>
                </div>
              </div>
              <button onClick={() => setNlDialog(null)} className="text-muted-foreground hover:text-foreground mt-0.5 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {nlDialog.fields.map((field, i) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-foreground">{field.label}</label>
                  <input
                    autoFocus={i === 0}
                    type="text"
                    defaultValue={field.value}
                    placeholder={field.placeholder}
                    onChange={e => {
                      setNlDialog(prev => prev ? {
                        ...prev,
                        fields: prev.fields.map((f, fi) => fi === i ? { ...f, value: e.target.value } : f)
                      } : null);
                    }}
                    className="mt-1 w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setNlDialog(null)}
                className="flex-1 h-9 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!nlDialog) return;
                  const allParams = { ...nlDialog.params };
                  nlDialog.fields.forEach(f => { if (f.value.trim()) allParams[f.key] = f.value.trim(); });
                  const qs = new URLSearchParams(allParams).toString();
                  setNlDialog(null);
                  setNlQuery("");
                  setLocation(qs ? `${nlDialog.href}?${qs}` : nlDialog.href);
                }}
                className="flex-1 h-9 rounded-xl bg-gradient-to-r from-brand to-emerald-600 hover:brightness-110 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <Wand2 className="w-3.5 h-3.5" /> Take me there
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          Continue where you left off — single recent item, raised visual
          treatment with brand-tinted background and stronger hover.
          ──────────────────────────────────────────────────────────────────── */}
      {(preferences.showContinueSection ?? true) && continueItem && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}>
          <div className="flex items-center gap-2 mb-3">
            <PlayCircle className="w-4 h-4 text-brand" />
            <h3 className="text-base font-semibold text-foreground">Continue where you left off</h3>
          </div>
          <Link href={continueItem.href}>
            <Card className={`group relative overflow-hidden border-brand/25 bg-gradient-to-r from-brand-light/40 via-brand-light/15 to-background hover:border-brand/50 hover:shadow-md transition-all cursor-pointer ${cardStyle === "flat" ? "shadow-none" : cardStyle === "elevated" ? "shadow-md" : ""}`}>
              <div aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand via-emerald-500 to-teal-500" />
              <CardContent className="relative p-4 flex items-center gap-3">
                <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${continueItem.color} ${iconShapeClass} ${iconBorderClass} group-hover:scale-105 transition-transform`}>
                  <continueItem.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{continueItem.title}</p>
                  {continueItem.subtitle && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{continueItem.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">{timeAgo(continueItem.createdAt)}</span>
                  <span className="text-[10px] font-semibold text-brand bg-brand-light px-2 py-0.5 rounded-full">
                    {continueItem.badge}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          Recent Activity — same data, lighter visual treatment per row
          (icon chip with hover-grow, chevron on hover).
          ──────────────────────────────────────────────────────────────────── */}
      {(preferences.showRecentActivity ?? true) && recentItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
            <Link href="/history">
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link key={i} href={item.href}>
                  <Card className={`group h-full hover:border-brand/30 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${cardClass}`}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${item.color} ${iconShapeClass} ${iconBorderClass} group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{item.title}</p>
                        {item.subtitle && <p className="text-[11px] text-muted-foreground mt-1 truncate">{item.subtitle}</p>}
                        <p className="text-[10px] text-muted-foreground/70 mt-1.5">{timeAgo(item.createdAt)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          Explore Sections — hub navigation. Larger 2-col cards on lg+,
          coloured top accent strip, soft halo on hover, gradient pill
          showing tool count.
          ──────────────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Explore Adaptly</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Every tool, organised by purpose</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[
            { path: "/send-hub",           label: "SEND Hub",            icon: Brain,         bg: "bg-indigo-600", light: "bg-indigo-50",  text: "text-indigo-700",  halo: "bg-indigo-300/40", desc: "Screener, Worksheets, Differentiate, IEP, Social Stories + more", count: "10 tools" },
            { path: "/revision-section",   label: "Revision Hub",        icon: GraduationCap, bg: "bg-teal-600",   light: "bg-teal-50",    text: "text-teal-700",    halo: "bg-teal-300/40",   desc: "Worksheets, Audio Revision, Past Papers, Flash Cards + more", count: "8 tools" },
            { path: "/planning-hub",       label: "Planning Hub",        icon: Pencil,        bg: "bg-green-600",  light: "bg-green-50",   text: "text-green-700",   halo: "bg-green-300/40",  desc: "Lesson Planner, Medium Term Planner, Rubric, Exit Ticket + more", count: "9 tools" },
            { path: "/communications-hub", label: "Communications Hub",  icon: MessageSquare, bg: "bg-rose-600",   light: "bg-rose-50",    text: "text-rose-700",    halo: "bg-rose-300/40",   desc: "Parent Portal, Report Comments, Newsletters, Tracking + more",   count: "7 tools" },
            { path: "/classroom-hub",      label: "Classroom Hub",       icon: Monitor,       bg: "bg-blue-600",   light: "bg-blue-50",    text: "text-blue-700",    halo: "bg-blue-300/40",   desc: "Reading, Pupil Profiles, Daily Briefing, Attendance + more", count: "9 tools" },
          ].map((hub) => {
            const Icon = hub.icon;
            return (
              <Link key={hub.path} href={hub.path}>
                <Card className={`group relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer h-full ${cardClass}`}>
                  {/* Top accent strip — picks up the hub's brand colour */}
                  <div aria-hidden className={`absolute inset-x-0 top-0 h-1 ${hub.bg}`} />
                  {/* Soft hover halo in the top-right corner */}
                  <div aria-hidden className={`absolute -top-12 -right-10 w-32 h-32 rounded-full ${hub.halo} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none`} />
                  <CardContent className="relative p-4 sm:p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 ${hub.bg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-black/5 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-semibold text-foreground">{hub.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hub.light} ${hub.text}`}>{hub.count}</span>
                      </div>
                      <p className="text-[12px] sm:text-[13px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{hub.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* ────────────────────────────────────────────────────────────────────
          Quick Access — user-customised dashboard cards. Same data, but
          larger icon chips and a richer empty-state.
          ──────────────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Quick Access</h3>
          <Link href="/settings?tab=dashboard">
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-3 h-3" /> Customise
            </button>
          </Link>
        </div>
        {visibleCards.length === 0 ? (
          <Card className={`border-dashed bg-muted/30 ${cardClass}`}>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No cards selected.{" "}
                <Link href="/settings?tab=dashboard">
                  <span className="text-brand underline cursor-pointer font-medium">Customise your dashboard</span>
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {visibleCards.map((card) => {
              const meta = cardIconMap[card.id] || { icon: FileText, color: "bg-muted text-muted-foreground", href: "/" };
              const Icon = meta.icon;
              return (
                <Link key={card.id} href={meta.href}>
                  <Card className={`group h-full hover:border-brand/30 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${cardClass}`}>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className={`w-11 h-11 ${meta.color} flex items-center justify-center ${iconShapeClass} ${iconBorderClass} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-foreground leading-tight">{card.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ────────────────────────────────────────────────────────────────────
          Browse by Subject — subject-coloured tinted background per tile,
          icon halo grows on hover for a tactile feel.
          ──────────────────────────────────────────────────────────────────── */}
      {(preferences.showSubjectBrowser ?? true) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-foreground">Browse by Subject</h3>
            <Link href="/settings?tab=dashboard">
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="w-3 h-3" /> Customise
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2 sm:gap-3">
            {(visibleSubjects.length > 0 ? visibleSubjects : subjects).map((subject) => {
              const Icon = subjectIcons[subject.id] || BookOpen;
              return (
                <Link key={subject.id} href={`/worksheets?subject=${subject.id}`}>
                  <Card
                    className={`group hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${cardClass}`}
                    style={{
                      // Linear-gradient from a 10% tint of the subject colour
                      // into the card surface — gives every tile a distinct
                      // identity without overpowering the layout.
                      backgroundImage: `linear-gradient(135deg, ${subject.color}14 0%, transparent 70%)`,
                    }}
                  >
                    <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center ${iconShapeClass} ${iconBorderClass} group-hover:scale-110 transition-transform`}
                        style={{ backgroundColor: subject.color + "1F", color: subject.color }}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-foreground leading-tight">{subject.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ────────────────────────────────────────────────────────────────────
          COBS Handbook Tip — closing flourish. Brand-gradient icon chip,
          decorative halo, slightly larger typography for readability.
          ──────────────────────────────────────────────────────────────────── */}
      {(preferences.showCobsTip ?? true) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <Card className={`relative overflow-hidden border-brand/25 bg-gradient-to-br from-brand-light/40 via-background to-brand-light/15 ${cardStyle === "flat" ? "shadow-none" : cardStyle === "elevated" ? "shadow-md" : ""}`}>
            <div aria-hidden className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
            <CardContent className="relative p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 bg-gradient-to-br from-brand to-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-brand/30 ${iconShapeClass} ${iconBorderClass}`}>
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-brand mb-1.5">COBS Handbook · Daily Tip</div>
                  <p className="text-sm sm:text-[15px] text-foreground/85 leading-relaxed">{tip}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
