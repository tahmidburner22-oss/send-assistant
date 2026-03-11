import { useApp } from "@/contexts/AppContext";
import { useUserPreferences, ALL_DASHBOARD_CARDS } from "@/contexts/UserPreferencesContext";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cobsTips, subjects } from "@/lib/send-data";
import {
  FileText, Sparkles, Users, Clock, Share2, BookOpen, Calculator,
  FlaskConical, Landmark, Globe, Palette, Music, Dumbbell, Monitor,
  Wrench, Heart, Languages, UserCheck, Briefcase, Theater, Lightbulb,
  GraduationCap, BarChart2, CalendarDays, Brain, ScrollText, Gamepad2, Settings
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

const subjectIcons: Record<string, any> = {
  english: BookOpen, mathematics: Calculator, science: FlaskConical,
  history: Landmark, geography: Globe, art: Palette, music: Music,
  pe: Dumbbell, computing: Monitor, dt: Wrench, re: Heart,
  mfl: Languages, pshe: UserCheck, business: Briefcase, drama: Theater,
};

// Map dashboard card IDs to icons and colours
const cardIconMap: Record<string, { icon: any; color: string; href: string }> = {
  "worksheets":    { icon: FileText,    color: "bg-brand-light text-brand",         href: "/worksheets" },
  "differentiate": { icon: Sparkles,    color: "bg-purple-50 text-purple-600",       href: "/differentiate" },
  "quiz-game":     { icon: Gamepad2,    color: "bg-orange-50 text-orange-600",       href: "/quiz-game" },
  "revision-hub":  { icon: Brain,       color: "bg-indigo-50 text-indigo-600",       href: "/revision-hub" },
  "past-papers":   { icon: ScrollText,  color: "bg-teal-50 text-teal-600",           href: "/past-papers" },
  "stories":       { icon: BookOpen,    color: "bg-emerald-50 text-emerald-600",     href: "/stories" },
  "children":      { icon: Users,       color: "bg-blue-50 text-blue-600",           href: "/children" },
  "analytics":     { icon: BarChart2,   color: "bg-rose-50 text-rose-600",           href: "/analytics" },
  "daily-briefing":{ icon: CalendarDays,color: "bg-amber-50 text-amber-600",         href: "/daily-briefing" },
  "templates":     { icon: GraduationCap,color:"bg-cyan-50 text-cyan-600",           href: "/templates" },
  "attendance":    { icon: CalendarDays,color: "bg-green-50 text-green-600",         href: "/attendance" },
  "behaviour":     { icon: UserCheck,   color: "bg-pink-50 text-pink-600",           href: "/behaviour-tracking" },
};

export default function Home() {
  const { user, worksheetHistory, storyHistory, differentiationHistory, children, refreshData } = useApp();
  const { preferences } = useUserPreferences();

  // Re-fetch data from server every time the dashboard is visited so stats stay current
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
    { label: "Differentiations", value: totalDifferentiations + totalStories, color: "text-purple-600" },
    { label: "Pupils", value: totalChildren, color: "text-blue-600" },
    { label: "Time Saved", value: `${timeSaved}m`, color: "text-amber-600" },
    { label: "Avg Rating", value: avgRating || "—", color: "text-rose-500" },
  ];

  // Filter dashboard cards based on user preferences
  const visibleCards = ALL_DASHBOARD_CARDS.filter(card =>
    preferences.dashboardCards.includes(card.id)
  );

  // Filter subjects based on user preferences
  const visibleSubjects = subjects.filter(subject =>
    preferences.dashboardSubjects.length === 0 ||
    preferences.dashboardSubjects.some(s => s.toLowerCase() === subject.name.toLowerCase() || s.toLowerCase() === subject.id.toLowerCase())
  );

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground">Welcome back, {user?.displayName || "Teacher"}</h2>
        <p className="text-sm text-muted-foreground mt-1">Here's your Adaptly overview</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {stats.map((stat, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-3 text-center">
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Quick Access Cards — driven by dashboard preferences */}
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
          <Card className="border-dashed border-border/50">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No cards selected. <Link href="/settings?tab=dashboard"><span className="text-brand underline cursor-pointer">Customise your dashboard</span></Link></p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visibleCards.map((card) => {
              const meta = cardIconMap[card.id] || { icon: FileText, color: "bg-muted text-muted-foreground", href: "/" };
              const Icon = meta.icon;
              return (
                <Link key={card.id} href={meta.href}>
                  <Card className="border-border/50 hover:border-brand/30 hover:shadow-sm transition-all cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className={`w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center`}>
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

      {/* Browse by Subject — filtered by preferences */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 className="text-base font-semibold text-foreground mb-3">Browse by Subject</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {(visibleSubjects.length > 0 ? visibleSubjects : subjects).map((subject) => {
            const Icon = subjectIcons[subject.id] || BookOpen;
            return (
              <Link key={subject.id} href={`/worksheets?subject=${subject.id}`}>
                <Card className="border-border/50 hover:border-brand/30 hover:shadow-sm transition-all cursor-pointer">
                  <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: subject.color + "15", color: subject.color }}>
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

      {/* COBS Handbook Tip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="border-brand/20 bg-brand-light/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
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
    </div>
  );
}
