import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield, BookOpen, IdCard, CheckSquare, ShieldAlert, Heart,
  ScanSearch, Calendar, ArrowRight, Brain, Users, Star,
  ChevronRight, FileText, Sparkles, FileCheck, Info,
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
];

const stats = [
  { label: "SEND Tools", value: "10", icon: Brain, color: "text-indigo-600" },
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
        <Card className={`hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border ${tool.border} group`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tool.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground">{tool.label}</span>
                  {(tool as any).badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${(tool as any).badgeColor}`}>{(tool as any).badge}</span>
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
}

export default function SENDHub() {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-7">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link href="/home"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">SEND Hub</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">SEND Hub</h1>
            <p className="text-sm text-muted-foreground">Specialist tools for inclusion and SEND support</p>
          </div>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-3 gap-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        {stats.map((s, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-3 flex items-center gap-2.5">
              <s.icon className={`w-5 h-5 flex-shrink-0 ${s.color}`} />
              <div>
                <div className="text-base font-bold text-foreground">{s.value}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* ── Section 1: Creation ── */}
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Creation</h2>
          <span className="text-xs text-muted-foreground ml-auto">{creationTools.length} tools</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3 -mt-1">Generate SEND-adapted resources, screen pupils, and differentiate content.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {creationTools.map(tool => <ToolCard key={tool.path} tool={tool} />)}
        </div>
      </motion.div>

      {/* ── Section 2: Support ── */}
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center gap-2 mb-3 mt-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Support</h2>
          <span className="text-xs text-muted-foreground ml-auto">{supportTools.length} tools</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3 -mt-1">Plans, passports, targets and support documents for SEND pupils.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {supportTools.map(tool => <ToolCard key={tool.path} tool={tool} />)}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card className="border-indigo-100 bg-indigo-50/40">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-indigo-800 mb-1">UK SEND Code of Practice Aligned</p>
              <p className="text-xs text-indigo-700/80 leading-relaxed">
                All tools in this hub are designed in line with the SEND Code of Practice 2015, the Equality Act 2010,
                and the Children and Families Act 2014. Output should always be reviewed by a qualified SENCO before use.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
