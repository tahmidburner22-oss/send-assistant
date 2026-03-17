import { useApp } from "@/contexts/AppContext";
import { useUserPreferences, ALL_DASHBOARD_CARDS } from "@/contexts/UserPreferencesContext";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cobsTips, subjects } from "@/lib/send-data";
import {
  FileText, Sparkles, Users, BookOpen, Calculator,
  FlaskConical, Landmark, Globe, Palette, Music, Dumbbell, Monitor,
  Wrench, Heart, Languages, UserCheck, Briefcase, Theater, Lightbulb,
  GraduationCap, BarChart2, CalendarDays, Brain, ScrollText, Gamepad2, Settings,
  ArrowRight, PlayCircle,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

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

  // ── "Continue where you left off" ─────────────────────────────────────────
  const inProgressWorksheets = worksheetHistory
    .filter(w => !w.rating)
    .slice(0, 2)
    .map(w => ({
      title: w.title,
      subtitle: w.subject ? `${w.subject}${w.yearGroup ? " · " + w.yearGroup : ""}` : "Worksheet",
      createdAt: w.createdAt,
      href: "/worksheets",
      icon: FileText,
      color: "text-brand bg-brand-light",
      badge: "Worksheet",
    }));

  const inProgressStories = storyHistory.slice(0, 1).map(s => ({
    title: s.title,
    subtitle: `${s.genre || "Story"}${s.yearGroup ? " · " + s.yearGroup : ""}`,
    createdAt: s.createdAt,
    href: "/reading",
    icon: BookOpen,
    color: "text-emerald-600 bg-emerald-50",
    badge: "Story",
  }));

  const inProgressDiffs = differentiationHistory.slice(0, 1).map(d => ({
    title: d.subject ? `${d.subject} differentiation` : "Differentiated task",
    subtitle: d.yearGroup || "Differentiation",
    createdAt: d.createdAt,
    href: "/differentiate",
    icon: Sparkles,
    color: "text-purple-600 bg-purple-50",
    badge: "Differentiation",
  }));

  const continueItems = [...inProgressWorksheets, ...inProgressStories, ...inProgressDiffs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

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

  const visibleSubjects = subjects.filter(subject =>
    preferences.dashboardSubjects.length === 0 ||
    preferences.dashboardSubjects.some(s =>
      s.toLowerCase() === subject.name.toLowerCase() ||
      s.toLowerCase() === subject.id.toLowerCase()
    )
  );

  // ── Derived appearance helpers ─────────────────────────────────────────────
  const iconShape = preferences.iconShape ?? "rounded";
  const iconBorder = preferences.iconBorderStyle ?? "none";
  const cardStyle = preferences.cardStyle ?? "default";
  const density = preferences.layoutDensity ?? "comfortable";

  // Icon container shape class
  const iconShapeClass =
    iconShape === "circle"  ? "rounded-full" :
    iconShape === "square"  ? "rounded-none" :
    "rounded-xl"; // default: rounded

  // Icon border/ring class
  const iconBorderClass =
    iconBorder === "subtle" ? "ring-1 ring-border/60" :
    iconBorder === "bold"   ? "ring-2 ring-brand/40" :
    ""; // none

  // Card extra class
  const cardClass =
    cardStyle === "flat"     ? "shadow-none border-border/30" :
    cardStyle === "elevated" ? "shadow-md border-border/20" :
    "border-border/50"; // default

  // Gap between sections
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

      {/* Continue where you left off */}
      {(preferences.showContinueSection ?? true) && continueItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="flex items-center gap-2 mb-3">
            <PlayCircle className="w-4 h-4 text-brand" />
            <h3 className="text-base font-semibold text-foreground">Continue where you left off</h3>
          </div>
          <div className="space-y-2">
            {continueItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link key={i} href={item.href}>
                  <Card className={`border-brand/20 bg-brand-light/20 hover:border-brand/40 hover:shadow-sm transition-all cursor-pointer ${cardStyle === "flat" ? "shadow-none" : cardStyle === "elevated" ? "shadow-md" : ""}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${item.color} ${iconShapeClass} ${iconBorderClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                        {item.subtitle && <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground">{timeAgo(item.createdAt)}</span>
                        <span className="text-[10px] font-medium text-brand bg-brand-light px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
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
          <div className="space-y-2">
            {recentItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link key={i} href={item.href}>
                  <Card className={`hover:border-brand/30 hover:shadow-sm transition-all cursor-pointer ${cardClass}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${item.color} ${iconShapeClass} ${iconBorderClass}`}>
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
