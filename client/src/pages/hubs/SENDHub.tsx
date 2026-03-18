import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import TopicVisual from "@/components/TopicVisual";
import {
  Shield, BookOpen, IdCard, CheckSquare, ShieldAlert, Heart,
  ScanSearch, Calendar, ArrowRight, Brain, Users, Star,
  ChevronRight, FileText, Sparkles,
} from "lucide-react";

const tools = [
  {
    path: "/send-screener",
    label: "SEND Needs Screener",
    icon: ScanSearch,
    color: "bg-indigo-50 text-indigo-600",
    border: "border-indigo-100",
    description: "Identify pupils who may need a SEND referral using research-backed screening questions across 8 need areas.",
    badge: "Start Here",
    badgeColor: "bg-indigo-100 text-indigo-700",
    topic: "Mental Health and Wellbeing",
    subject: "pshe",
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
    topic: "Nouns, Verbs and Adjectives",
    subject: "english",
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
    topic: "Descriptive Writing",
    subject: "english",
  },
  {
    path: "/tools/iep-generator",
    label: "IEP / EHCP Goals",
    icon: Shield,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
    description: "Generate legally-compliant SMART IEP and EHCP goals tailored to each pupil's needs and provision.",
    topic: "Equality and Diversity",
    subject: "pshe",
  },
  {
    path: "/tools/social-stories",
    label: "Social Stories",
    icon: BookOpen,
    color: "bg-purple-50 text-purple-600",
    border: "border-purple-100",
    description: "Create personalised social stories to support autistic pupils with transitions and new situations.",
    topic: "Narrative Writing — Story Structure",
    subject: "english",
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
    topic: "Healthy Relationships",
    subject: "pshe",
  },
  {
    path: "/tools/smart-targets",
    label: "SMART Targets",
    icon: CheckSquare,
    color: "bg-teal-50 text-teal-600",
    border: "border-teal-100",
    description: "Set specific, measurable, achievable, relevant and time-bound targets for pupils on the SEND register.",
    topic: "Careers and Aspirations",
    subject: "pshe",
  },
  {
    path: "/tools/behaviour-plan",
    label: "Behaviour Support Plan",
    icon: ShieldAlert,
    color: "bg-orange-50 text-orange-600",
    border: "border-orange-100",
    description: "Draft positive behaviour support plans with antecedents, triggers, and de-escalation strategies.",
    topic: "Healthy Relationships",
    subject: "pshe",
  },
  {
    path: "/tools/wellbeing-support",
    label: "Wellbeing Support",
    icon: Heart,
    color: "bg-red-50 text-red-500",
    border: "border-red-100",
    description: "Generate wellbeing check-ins, anxiety support plans, and emotional regulation strategies.",
    topic: "Mental Health and Wellbeing",
    subject: "pshe",
  },
  {
    path: "/visual-timetable",
    label: "Visual Timetable",
    icon: Calendar,
    color: "bg-sky-50 text-sky-600",
    border: "border-sky-100",
    description: "Build visual daily timetables to support pupils with autism, ADHD or anxiety around transitions.",
    topic: "Online Safety and Cyberbullying",
    subject: "pshe",
  },
];

const stats = [
  { label: "SEND Tools", value: "10", icon: Brain, color: "text-indigo-600" },
  { label: "Pupils Supported", value: "1,200+", icon: Users, color: "text-blue-600" },
  { label: "Time Saved / Tool", value: "~20 min", icon: Star, color: "text-amber-600" },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

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

      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">All Tools</h2>
          <span className="text-xs text-muted-foreground">{tools.length} tools</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <motion.div key={tool.path} variants={item} className="group">
                <Link href={tool.path}>
                  <Card className={`hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border ${tool.border} overflow-hidden`}>
                    {/* Topic visual header with editable image cycling */}
                    <div className="relative">
                      <TopicVisual
                        subject={tool.subject}
                        topic={tool.topic}
                        size="full"
                        editable
                      />
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tool.color}`}>
                          <Icon className="w-4 h-4" />
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
