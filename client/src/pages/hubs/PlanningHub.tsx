import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays, Calendar, BookMarked, Table2, Ticket,
  Sparkles, BookOpen, LayoutGrid, ClipboardList, ArrowRight,
  Pencil, ChevronRight, Lightbulb, Clock,
} from "lucide-react";

const tools = [
  {
    path: "/tools/lesson-planner",
    label: "Lesson Planner",
    icon: CalendarDays,
    color: "bg-green-50 text-green-600",
    border: "border-green-100",
    description: "Generate full, Ofsted-ready lesson plans with learning objectives, activities, and AFL strategies.",
    badge: "Most Used",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    path: "/tools/medium-term-planner",
    label: "Medium Term Planner",
    icon: Calendar,
    color: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-100",
    description: "Build 6–8 week schemes of work with sequenced lessons, key vocabulary and assessment points.",
  },
  {
    path: "/differentiate",
    label: "Differentiate",
    icon: Sparkles,
    color: "bg-purple-50 text-purple-600",
    border: "border-purple-100",
    description: "Instantly adapt any task or text for different ability groups — foundation to extension in one click.",
    badge: "AI",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    path: "/tools/comprehension-generator",
    label: "Comprehension Generator",
    icon: BookMarked,
    color: "bg-sky-50 text-sky-600",
    border: "border-sky-100",
    description: "Create bespoke reading comprehension tasks on any topic, tied to curriculum objectives.",
  },
  {
    path: "/tools/rubric-generator",
    label: "Rubric / Mark Scheme",
    icon: Table2,
    color: "bg-violet-50 text-violet-600",
    border: "border-violet-100",
    description: "Generate clear assessment rubrics and mark schemes aligned to GCSE or A-Level criteria.",
  },
  {
    path: "/tools/exit-ticket",
    label: "Exit Ticket",
    icon: Ticket,
    color: "bg-fuchsia-50 text-fuchsia-600",
    border: "border-fuchsia-100",
    description: "Create end-of-lesson exit tickets to assess understanding and inform next lesson planning.",
  },
  {
    path: "/reading",
    label: "Reading & Stories",
    icon: BookOpen,
    color: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
    description: "Generate SEND-friendly stories and guided reading resources for any topic or reading age.",
  },
  {
    path: "/templates",
    label: "Pre-made Worksheets",
    icon: LayoutGrid,
    color: "bg-cyan-50 text-cyan-600",
    border: "border-cyan-100",
    description: "Browse a library of ready-made worksheets across all subjects, ready to download and print.",
  },
  {
    path: "/tools/risk-assessment",
    label: "Risk Assessment",
    icon: ClipboardList,
    color: "bg-red-50 text-red-600",
    border: "border-red-100",
    description: "Complete off-site trip and activity risk assessments with step-by-step guidance.",
    badge: "Compliance",
    badgeColor: "bg-red-100 text-red-700",
  },
];

const stats = [
  { label: "Planning Tools", value: "9", icon: Pencil, color: "text-green-600" },
  { label: "Time Saved / Plan", value: "~30 min", icon: Clock, color: "text-amber-600" },
  { label: "Curriculum Aligned", value: "KS1–5", icon: Lightbulb, color: "text-purple-600" },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

export default function PlanningHub() {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-7">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link href="/home"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Planning Hub</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-200">
            <Pencil className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">Planning Hub</h1>
            <p className="text-sm text-muted-foreground">Lesson planning, resources and assessment tools</p>
          </div>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-3 gap-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
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
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tool.badgeColor}`}>{tool.badge}</span>
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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card className="border-green-100 bg-green-50/40">
          <CardContent className="p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-green-800 mb-1">Planning Tip</p>
              <p className="text-xs text-green-700/80 leading-relaxed">
                Start with the Medium Term Planner to map your sequence of learning, then use the Lesson Planner for individual lessons. Use Differentiate to adapt materials for SEND and high-attaining pupils from the same base resource.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
