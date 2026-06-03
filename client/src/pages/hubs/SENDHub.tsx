import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield, BookOpen, IdCard, CheckSquare, ShieldAlert, Heart,
  ScanSearch, Calendar, ArrowRight, Brain, Users, Star,
  ChevronRight, FileText, Sparkles, FileCheck, ShieldCheck, LayoutGrid,
} from "lucide-react";

interface Tool {
  path: string;
  label: string;
  icon: any;
  color: string;
  border: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}

const creationTools: Tool[] = [
  {
    path: "/send-screener",
    label: "SEND Needs Screener",
    icon: ScanSearch,
    color: "bg-indigo-50 text-indigo-600",
    border: "border-indigo-100",
    description: "Identify pupils who may need a SEND referral using research-backed screening questions across 8 need areas.",
    badge: "Start Here",
    badgeColor: "bg-indigo-100 text-indigo-700",
  },
  {
    path: "/worksheets",
    label: "SEND Worksheets",
    icon: FileText,
    color: "bg-brand-light text-brand",
    border: "border-border/60",
    description: "Generate fully differentiated, dyslexia-friendly worksheets with overlays, scaffolding and SEND adjustments built in.",
    badge: "Most Used",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    path: "/differentiate",
    label: "Differentiate",
    icon: Sparkles,
    color: "bg-purple-50 text-purple-600",
    border: "border-purple-100",
    description: "Instantly adapt any task or text for different ability levels — foundation, core and extension in one click.",
    badge: "AI",
    badgeColor: "bg-purple-100 text-purple-700",
  },
];

const supportTools: Tool[] = [
  {
    path: "/tools/iep-generator",
    label: "EHCP Plan Generator",
    icon: FileCheck,
    color: "bg-indigo-50 text-indigo-700",
    border: "border-indigo-100",
    description: "5-stage AI-assisted EHCP drafting with golden thread QA, golden thread validation, and Word export. SENCO access.",
    badge: "SENCO",
    badgeColor: "bg-indigo-100 text-indigo-700",
  },
  {
    path: "/tools/social-stories",
    label: "Social Stories",
    icon: BookOpen,
    color: "bg-purple-50 text-purple-600",
    border: "border-purple-100",
    description: "Create personalised social stories to support autistic pupils with transitions and new situations.",
  },
  {
    path: "/tools/pupil-passport",
    label: "Pupil Passport",
    icon: IdCard,
    color: "bg-amber-50 text-amber-600",
    border: "border-amber-100",
    description: "Build 'All About Me' pupil passports that give every teacher instant context on a pupil's needs.",
    badge: "New",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    path: "/tools/smart-targets",
    label: "SMART Targets",
    icon: CheckSquare,
    color: "bg-teal-50 text-teal-600",
    border: "border-teal-100",
    description: "Set specific, measurable, achievable, relevant and time-bound targets for pupils on the SEND register.",
  },
  {
    path: "/tools/behaviour-plan",
    label: "Behaviour Support Plan",
    icon: ShieldAlert,
    color: "bg-orange-50 text-orange-600",
    border: "border-orange-100",
    description: "Draft positive behaviour support plans with antecedents, triggers, and de-escalation strategies.",
  },
  {
    path: "/tools/wellbeing-support",
    label: "Wellbeing Support",
    icon: Heart,
    color: "bg-red-50 text-red-500",
    border: "border-red-100",
    description: "Generate wellbeing check-ins, anxiety support plans, and emotional regulation strategies.",
  },
  {
    path: "/visual-timetable",
    label: "Visual Timetable",
    icon: Calendar,
    color: "bg-sky-50 text-sky-600",
    border: "border-sky-100",
    description: "Build visual daily timetables to support pupils with autism, ADHD or anxiety around transitions.",
  },
  {
    path: "/tools/communication-board",
    label: "Communication Board",
    icon: LayoutGrid,
    color: "bg-cyan-50 text-cyan-600",
    border: "border-cyan-100",
    description: "Build printable AAC symbol boards (ARASAAC) for choice-making and symbol-supported communication. Words can be suggested by AI or typed in.",
    badge: "New",
    badgeColor: "bg-cyan-100 text-cyan-700",
  },
  {
    path: "/tools/risk-assessment",
    label: "Risk Assessment",
    icon: ShieldCheck,
    color: "bg-rose-50 text-rose-600",
    border: "border-rose-100",
    description: "Trip and activity risk assessments with SEND-specific reasonable adjustments and parental consent tracking.",
  },
];

const stats = [
  { label: "SEND Tools", value: String(creationTools.length + supportTools.length), icon: Brain, color: "text-indigo-600" },
  { label: "Pupils Supported", value: "1,200+", icon: Users, color: "text-blue-600" },
  { label: "Time Saved / Tool", value: "~20 min", icon: Star, color: "text-amber-600" },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <motion.div variants={item}>
      <Link href={tool.path}>
        <Card className={`group relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border ${tool.border}`}>
          {/* Left accent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-500 opacity-70 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-4 pl-5">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tool.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{tool.label}</span>
                  {(tool as any).badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${(tool as any).badgeColor}`}>{(tool as any).badge}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function SENDHub() {
  const totalTools = creationTools.length + supportTools.length;

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-7">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link href="/home"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">SEND Hub</span>
      </motion.div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 text-white shadow-xl"
      >
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 w-64 h-64 rounded-full bg-black/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ring-indigo-200/60 flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">SEND Hub</h1>
              <p className="text-sm sm:text-base text-white/90 mt-1.5 leading-relaxed max-w-2xl">
                Specialist tools for inclusion and SEND support — screen pupils, draft plans, and adapt every resource to the named pupil in front of you.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              {totalTools} tools
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
              <Shield className="w-3 h-3" />
              SEND Code of Practice 2015 aligned
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      >
        {stats.map((s, i) => (
          <Card key={i} className="border-border/50 bg-gradient-to-br from-white to-indigo-50/30">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-base font-bold text-foreground">{s.value}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* ── Section 1: Creation ────────────────────────────────────────── */}
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Creation</h2>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-auto">
            {creationTools.length} tools
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-3 -mt-1">Generate SEND-adapted resources, screen pupils, and differentiate content.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {creationTools.map(tool => <ToolCard key={tool.path} tool={tool} />)}
        </div>
      </motion.div>

      {/* ── Section 2: Support ────────────────────────────────────────── */}
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center gap-2 mb-3 mt-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-sm">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Support</h2>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-auto">
            {supportTools.length} tools
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-3 -mt-1">Plans, passports, targets and support documents for SEND pupils.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {supportTools.map(tool => <ToolCard key={tool.path} tool={tool} />)}
        </div>
      </motion.div>

      {/* ── Compliance footer ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50/60 backdrop-blur-sm p-5 shadow-sm">
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/40 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-indigo-900 mb-1">UK SEND Code of Practice aligned</p>
              <p className="text-xs sm:text-sm text-indigo-700/85 leading-relaxed">
                All tools in this hub are designed in line with the SEND Code of Practice 2015, the Equality Act 2010,
                and the Children and Families Act 2014. Output should always be reviewed by a qualified SENCO before use.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
