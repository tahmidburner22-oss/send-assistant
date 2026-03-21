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
  Send, Loader2, Wand2, X,
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { callAI } from "@/lib/ai";

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

export default function Home() {
  const { user, worksheetHistory, storyHistory, differentiationHistory, children, refreshData } = useApp();
  const { preferences } = useUserPreferences();

  useEffect(() => { refreshData(); }, []);
  const [tip] = useState(() => cobsTips[Math.floor(Math.random() * cobsTips.length)]);

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

  const stats = [
    { label: "Worksheets", value: totalWorksheets, color: "text-brand" },
    { label: "Stories",    value: totalStories,    color: "text-purple-600" },
    { label: "Pupils",     value: totalChildren,   color: "text-blue-600" },
    { label: "Time Saved", value: `${timeSaved}m`, color: "text-amber-600" },
    { label: "Avg Rating", value: avgRating || "—",color: "text-rose-500" },
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

  const sectionGap = density === "compact" ? "space-y-4" : "space-y-6";

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className={`px-4 py-6 max-w-2xl mx-auto ${sectionGap}`}>
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground">Welcome back, {user?.displayName || "Teacher"}</h2>
        <p className="text-sm text-muted-foreground mt-1">Here's your Adaptly overview</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {stats.map((stat, i) => (
            <Card key={i} className={cardClass}>
              <CardContent className="p-3 text-center">
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* ── Natural Language Input ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
        <div className="relative">
          <div className="flex items-center gap-2 p-3 rounded-2xl border border-brand/25 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 shadow-sm focus-within:border-brand/50 focus-within:shadow-md transition-all">
            <Wand2 className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
            <textarea
              ref={nlRef}
              value={nlQuery}
              onChange={e => { setNlQuery(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleNLSubmit(); } }}
              placeholder="What would you like to create? e.g. a Year 9 maths worksheet on fractions for a student with dyslexia..."
              rows={1}
              className="flex-1 resize-none bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/60 leading-relaxed"
              style={{ minHeight: "22px", maxHeight: "120px" }}
              disabled={nlLoading}
            />
            <button
              onClick={handleNLSubmit}
              disabled={nlLoading || !nlQuery.trim()}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            >
              {nlLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-1.5 ml-1">
            Be as specific as possible — include year group, subject, topic, and any SEND needs
          </p>
        </div>
      </motion.div>

      {/* "Almost there" dialog */}
      {nlDialog?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setNlDialog(null)}>
          <div className="bg-background rounded-2xl shadow-2xl border border-border/50 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <Wand2 className="w-5 h-5 text-brand" />
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
                className="flex-1 h-9 rounded-xl bg-brand hover:bg-brand/90 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Wand2 className="w-3.5 h-3.5" /> Take me there
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Continue where you left off — single most-recent task */}
      {(preferences.showContinueSection ?? true) && continueItem && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="flex items-center gap-2 mb-3">
            <PlayCircle className="w-4 h-4 text-brand" />
            <h3 className="text-base font-semibold text-foreground">Continue where you left off</h3>
          </div>
          <Link href={continueItem.href}>
            <Card className={`border-brand/20 bg-brand-light/20 hover:border-brand/40 hover:shadow-sm transition-all cursor-pointer ${cardStyle === "flat" ? "shadow-none" : cardStyle === "elevated" ? "shadow-md" : ""}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${continueItem.color} ${iconShapeClass} ${iconBorderClass}`}>
                  <continueItem.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{continueItem.title}</p>
                  {continueItem.subtitle && (
                    <p className="text-[10px] text-muted-foreground">{continueItem.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">{timeAgo(continueItem.createdAt)}</span>
                  <span className="text-[10px] font-medium text-brand bg-brand-light px-1.5 py-0.5 rounded-full">
                    {continueItem.badge}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}

      {/* Recent Activity */}
      {(preferences.showRecentActivity ?? true) && recentItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
            <Link href="/history">
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link key={i} href={item.href}>
                  <Card className={`hover:border-brand/30 hover:shadow-sm transition-all cursor-pointer ${cardClass}`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${item.color} ${iconShapeClass} ${iconBorderClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                        {item.subtitle && <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(item.createdAt)}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Explore Sections */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
        <div className="mb-3">
          <h3 className="text-base font-semibold text-foreground">Explore Sections</h3>
          <p className="text-xs text-muted-foreground mt-0.5">All Adaptly tools organised by purpose</p>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {[
            { path: "/send-hub",           label: "SEND Hub",            icon: Brain,         bg: "bg-indigo-600", light: "bg-indigo-50",  text: "text-indigo-700",  desc: "Screener, Worksheets, Differentiate, IEP, Social Stories + more", count: "10 tools" },
            { path: "/revision-section",   label: "Revision Hub",        icon: GraduationCap, bg: "bg-teal-600",   light: "bg-teal-50",    text: "text-teal-700",    desc: "Worksheets, Audio Revision, Past Papers, Flash Cards + more", count: "8 tools" },
            { path: "/planning-hub",       label: "Planning Hub",        icon: Pencil,        bg: "bg-green-600",  light: "bg-green-50",   text: "text-green-700",   desc: "Lesson Planner, Medium Term Planner, Rubric, Exit Ticket + more", count: "9 tools" },
            { path: "/communications-hub", label: "Communications Hub",  icon: MessageSquare, bg: "bg-rose-600",   light: "bg-rose-50",    text: "text-rose-700",    desc: "Parent Portal, Report Comments, Newsletters, Tracking + more",   count: "7 tools" },
            { path: "/classroom-hub",      label: "Classroom Hub",       icon: Monitor,       bg: "bg-blue-600",   light: "bg-blue-50",    text: "text-blue-700",    desc: "Reading, Pupil Profiles, Daily Briefing, Attendance + more", count: "9 tools" },
          ].map((hub) => {
            const Icon = hub.icon;
            return (
              <Link key={hub.path} href={hub.path}>
                <Card className={`hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${cardClass} group`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-10 h-10 ${hub.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{hub.label}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${hub.light} ${hub.text}`}>{hub.count}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{hub.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Access Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Quick Access</h3>
          <Link href="/settings?tab=dashboard">
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="w-3 h-3" /> Customise
            </button>
          </Link>
        </div>
        {visibleCards.length === 0 ? (
          <Card className={`border-dashed ${cardClass}`}>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No cards selected.{" "}
                <Link href="/settings?tab=dashboard">
                  <span className="text-brand underline cursor-pointer">Customise your dashboard</span>
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visibleCards.map((card) => {
              const meta = cardIconMap[card.id] || { icon: FileText, color: "bg-muted text-muted-foreground", href: "/" };
              const Icon = meta.icon;
              return (
                <Link key={card.id} href={meta.href}>
                  <Card className={`hover:border-brand/30 hover:shadow-sm transition-all cursor-pointer h-full ${cardClass}`}>
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className={`w-10 h-10 ${meta.color} flex items-center justify-center ${iconShapeClass} ${iconBorderClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium text-foreground">{card.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Browse by Subject */}
      {(preferences.showSubjectBrowser ?? true) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-foreground">Browse by Subject</h3>
            <Link href="/settings?tab=dashboard">
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="w-3 h-3" /> Customise
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {(visibleSubjects.length > 0 ? visibleSubjects : subjects).map((subject) => {
              const Icon = subjectIcons[subject.id] || BookOpen;
              return (
                <Link key={subject.id} href={`/worksheets?subject=${subject.id}`}>
                  <Card className={`hover:border-brand/30 hover:shadow-sm transition-all cursor-pointer ${cardClass}`}>
                    <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                      <div
                        className={`w-8 h-8 flex items-center justify-center ${iconShapeClass} ${iconBorderClass}`}
                        style={{ backgroundColor: subject.color + "15", color: subject.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-foreground leading-tight">{subject.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* COBS Handbook Tip */}
      {(preferences.showCobsTip ?? true) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className={`border-brand/20 bg-brand-light/30 ${cardStyle === "flat" ? "shadow-none" : cardStyle === "elevated" ? "shadow-md" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5 ${iconShapeClass} ${iconBorderClass}`}>
                  <Lightbulb className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-brand mb-1">COBS Handbook Tip</div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{tip}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
