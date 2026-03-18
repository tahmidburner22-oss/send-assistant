import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import TopicVisual from "@/components/TopicVisual";
import {
  FileText, Headphones, Layers, ScrollText, HelpCircle,
  BookType, Zap, BookMarked, ArrowRight, GraduationCap,
  TrendingUp, Clock, ChevronRight,
} from "lucide-react";

const tools = [
  {
    path: "/worksheets",
    label: "Worksheets",
    icon: FileText,
    color: "bg-brand-light text-brand",
    border: "border-border/60",
    description: "Generate curriculum-aligned revision worksheets with differentiated tasks for all ability levels.",
    badge: "Start Here",
    badgeColor: "bg-blue-100 text-blue-700",
    topic: "Fractions",
    subject: "mathematics",
  },
  {
    path: "/revision-hub",
    label: "Audio Revision Hub",
    icon: Headphones,
    color: "bg-indigo-50 text-indigo-600",
    border: "border-indigo-100",
    description: "Listen to AI-generated audio revision summaries — great for auditory learners and SEND pupils.",
    badge: "New",
    badgeColor: "bg-indigo-100 text-indigo-700",
    topic: "Genetics and Inheritance",
    subject: "science",
  },
  {
    path: "/past-papers",
    label: "Past Papers",
    icon: ScrollText,
    color: "bg-teal-50 text-teal-600",
    border: "border-teal-100",
    description: "Access GCSE and A-Level past papers across AQA, OCR and Edexcel with mark scheme guidance.",
    badge: "Popular",
    badgeColor: "bg-teal-100 text-teal-700",
    topic: "Quadratic Equations",
    subject: "mathematics",
  },
  {
    path: "/tools/flash-cards",
    label: "Flash Cards",
    icon: Layers,
    color: "bg-yellow-50 text-yellow-600",
    border: "border-yellow-100",
    description: "Generate printable or digital flash card sets for any topic, subject and year group instantly.",
    topic: "The Solar System",
    subject: "science",
  },
  {
    path: "/tools/quiz-generator",
    label: "Quiz Generator",
    icon: HelpCircle,
    color: "bg-violet-50 text-violet-600",
    border: "border-violet-100",
    description: "Build custom multiple-choice and short-answer quizzes aligned to any topic or specification.",
    topic: "Rates of Reaction",
    subject: "chemistry",
  },
  {
    path: "/tools/vocabulary-builder",
    label: "Vocabulary Builder",
    icon: BookType,
    color: "bg-lime-50 text-lime-700",
    border: "border-lime-100",
    description: "Generate subject-specific vocabulary lists with definitions and contextual example sentences.",
    topic: "Vocabulary in Context",
    subject: "english",
  },
  {
    path: "/quiz-game",
    label: "QuizBlast",
    icon: Zap,
    color: "bg-orange-50 text-orange-500",
    border: "border-orange-100",
    description: "Run live, competitive classroom quiz games — ideal for revision lessons and end-of-topic tests.",
    badge: "Live",
    badgeColor: "bg-orange-100 text-orange-700",
    topic: "Electricity and Circuits",
    subject: "science",
  },
  {
    path: "/tools/comprehension-generator",
    label: "Comprehension Generator",
    icon: BookMarked,
    color: "bg-sky-50 text-sky-600",
    border: "border-sky-100",
    description: "Auto-generate reading comprehension passages and questions at any reading level or subject.",
    topic: "Reading Comprehension — Inference",
    subject: "english",
  },
];

const stats = [
  { label: "Revision Tools", value: "8", icon: GraduationCap, color: "text-teal-600" },
  { label: "Exam Boards", value: "AQA · OCR · Edexcel", icon: ScrollText, color: "text-indigo-600" },
  { label: "Avg Time Saved", value: "~25 min", icon: Clock, color: "text-amber-600" },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

export default function RevisionHubSection() {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-7">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link href="/home"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Revision Hub</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-200">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">Revision Hub</h1>
            <p className="text-sm text-muted-foreground">Everything your pupils need to prepare for exams</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <motion.div key={tool.path} variants={item} className="group">
                <Link href={tool.path}>
                  <Card className={`hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border ${tool.border} overflow-hidden`}>
                    <div className="relative">
                      <TopicVisual subject={tool.subject} topic={tool.topic} size="full" editable />
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
        <Card className="border-teal-100 bg-teal-50/40">
          <CardContent className="p-4 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-teal-800 mb-1">Revision Best Practice</p>
              <p className="text-xs text-teal-700/80 leading-relaxed">
                Research shows spaced retrieval practice improves long-term retention by up to 50%. Use Flash Cards and QuizBlast regularly in the weeks leading up to exams rather than cramming.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
