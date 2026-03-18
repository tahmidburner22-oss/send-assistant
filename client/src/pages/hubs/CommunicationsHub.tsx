import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText, Mail, AlignLeft, ExternalLink, MessageSquare,
  TrendingUp, ClipboardList, ArrowRight, MessageCircle,
  Users, ChevronRight, Bell,
} from "lucide-react";

const tools = [
  {
    path: "/tools/report-comments",
    label: "Report Comments",
    icon: FileText,
    color: "bg-rose-50 text-rose-600",
    border: "border-rose-100",
    description: "Generate personalised, positive end-of-term report comments for every pupil in seconds.",
    badge: "Most used",
    badgeColor: "bg-rose-100 text-rose-700",
  },
  {
    path: "/tools/parent-newsletter",
    label: "Parent Newsletter",
    icon: Mail,
    color: "bg-pink-50 text-pink-600",
    border: "border-pink-100",
    description: "Draft professional, engaging parent newsletters covering class news, events and key information.",
  },
  {
    path: "/tools/text-rewriter",
    label: "Text Rewriter",
    icon: AlignLeft,
    color: "bg-cyan-50 text-cyan-600",
    border: "border-cyan-100",
    description: "Simplify complex educational language for parents, or make pupil-facing text more accessible.",
  },
  {
    path: "/parent-portal",
    label: "Parent Portal",
    icon: ExternalLink,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
    description: "Share pupil progress, assignments and resources directly with parents via a secure portal.",
    badge: "Portal",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    path: "/pupil-comments",
    label: "Pupil Comments",
    icon: MessageSquare,
    color: "bg-violet-50 text-violet-600",
    border: "border-violet-100",
    description: "Log and track verbal and written feedback given to pupils across lessons and assessments.",
  },
  {
    path: "/behaviour-tracking",
    label: "Behaviour Tracking",
    icon: TrendingUp,
    color: "bg-orange-50 text-orange-600",
    border: "border-orange-100",
    description: "Record behaviour incidents, patterns and interventions to inform parent and SEND conversations.",
  },
  {
    path: "/attendance",
    label: "Attendance",
    icon: ClipboardList,
    color: "bg-green-50 text-green-600",
    border: "border-green-100",
    description: "Monitor attendance patterns and generate reports for parents, governors or local authority.",
    badge: "Compliance",
    badgeColor: "bg-green-100 text-green-700",
  },
];

const stats = [
  { label: "Comms Tools", value: "7", icon: MessageCircle, color: "text-rose-600" },
  { label: "Stakeholders", value: "Parents, Pupils", icon: Users, color: "text-blue-600" },
  { label: "Avg Time Saved", value: "~20 min", icon: Bell, color: "text-amber-600" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function CommunicationsHub() {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-7">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link href="/home"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Communications Hub</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-200">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">Communications Hub</h1>
            <p className="text-sm text-muted-foreground">Parent comms, pupil feedback and tracking tools</p>
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
        <Card className="border-rose-100 bg-rose-50/40">
          <CardContent className="p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-rose-800 mb-1">Communication Best Practice</p>
              <p className="text-xs text-rose-700/80 leading-relaxed">
                Use the Text Rewriter to ensure all parent communications are written at an accessible reading level. Ofsted expects schools to communicate clearly with all families, including those with lower literacy or English as an additional language.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
