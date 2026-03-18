import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar, TrendingUp, ClipboardList, MessageSquare,
  Zap, NotebookPen, Users, BarChart3,
  ArrowRight, Monitor, ChevronRight, Star, Clock,
} from "lucide-react";

const tools = [
  {
    path: "/daily-briefing",
    label: "Daily Briefing",
    icon: NotebookPen,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
    description: "Start each day with an AI-generated briefing: key events, pupil notes, and reminders.",
    badge: "Daily",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    path: "/visual-timetable",
    label: "Visual Timetable",
    icon: Calendar,
    color: "bg-sky-50 text-sky-600",
    border: "border-sky-100",
    description: "Build clear visual timetables for SEND pupils who benefit from structured daily routines.",
  },
  {
    path: "/behaviour-tracking",
    label: "Behaviour Tracking",
    icon: TrendingUp,
    color: "bg-orange-50 text-orange-600",
    border: "border-orange-100",
    description: "Log behaviour incidents with charts for progress reviews, EHCP evidence, and parent meetings.",
  },
  {
    path: "/attendance",
    label: "Attendance Tracker",
    icon: ClipboardList,
    color: "bg-lime-50 text-lime-700",
    border: "border-lime-100",
    description: "Track pupil attendance patterns and identify persistent absence early for safeguarding purposes.",
    badge: "Safeguarding",
    badgeColor: "bg-lime-100 text-lime-800",
  },
  {
    path: "/pupil-comments",
    label: "Pupil Comments",
    icon: MessageSquare,
    color: "bg-violet-50 text-violet-600",
    border: "border-violet-100",
    description: "Record timestamped observations about pupils — supports report writing and annual reviews.",
  },
  {
    path: "/quiz-game",
    label: "QuizBlast",
    icon: Zap,
    color: "bg-yellow-50 text-yellow-500",
    border: "border-yellow-100",
    description: "Host live, Kahoot-style quiz games directly in the classroom to boost engagement and revision.",
    badge: "Live",
    badgeColor: "bg-yellow-100 text-yellow-700",
  },
  {
    path: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    color: "bg-rose-50 text-rose-600",
    border: "border-rose-100",
    description: "Review usage stats, worksheet ratings, pupil progress data and time-saved insights.",
  },
  {
    path: "/pupils",
    label: "Pupil Profiles",
    icon: Users,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
    description: "Manage your class register, assign work, track completion and record SEND information.",
    badge: "Core",
    badgeColor: "bg-blue-100 text-blue-700",
  },
];

const stats = [
  { label: "Classroom Tools", value: "8", icon: Monitor, color: "text-blue-600" },
  { label: "Pupils Managed", value: "Unlimited", icon: Users, color: "text-violet-600" },
  { label: "Avg Session", value: "8 min", icon: Clock, color: "text-amber-600" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ClassroomHub() {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-7">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link href="/home"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Classroom Hub</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">Classroom Hub</h1>
            <p className="text-sm text-muted-foreground">Day-to-day classroom management and pupil tracking</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      >
        {stats.map((s, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-2.5">
              <s.icon className={`w-5 h-5 flex-shrink-0 ${s.color}`} />
              <div>
                <div className="text-sm font-bold text-foreground leading-tight">{s.value}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Tools Grid */}
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">All Tools</h2>
          <span className="text-xs text-muted-foreground">{tools.length} tools</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <motion.div key={tool.path} variants={item}>
                <Link href={tool.path}>
                  <Card className={`hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border ${tool.border} group`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tool.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-foreground">{tool.label}</span>
                            {tool.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tool.badgeColor}`}>
                                {tool.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Tip */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card className="border-blue-100 bg-blue-50/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-800 mb-1">Pro Tip</p>
              <p className="text-xs text-blue-700/80 leading-relaxed">
                Use the Daily Briefing every morning to see pupil flagged notes and unreviewed work. Pair the Behaviour Tracker with Pupil Passport records to build a strong evidence base for EHCP annual reviews.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
