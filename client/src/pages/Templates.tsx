import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { FileText, BookOpen, Sparkles, Users, BarChart3, ClipboardList, Lightbulb, GraduationCap } from "lucide-react";

const templates = [
  {
    title: "Maths Worksheet",
    description: "Fractions, equations, percentages, Pythagoras, ratio & more",
    icon: FileText,
    color: "bg-brand-light text-brand",
    href: "/worksheets?subject=mathematics",
  },
  {
    title: "English Worksheet",
    description: "Comprehension, creative writing, grammar, spelling",
    icon: FileText,
    color: "bg-purple-50 text-purple-600",
    href: "/worksheets?subject=english",
  },
  {
    title: "Science Worksheet",
    description: "Cells, forces, energy, chemistry, biology",
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
    href: "/worksheets?subject=science",
  },
  {
    title: "Social Story",
    description: "Generate personalised social stories for SEND students",
    icon: BookOpen,
    color: "bg-amber-50 text-amber-600",
    href: "/stories",
  },
  {
    title: "Differentiate Task",
    description: "Adapt any existing task for SEND students",
    icon: Sparkles,
    color: "bg-rose-50 text-rose-600",
    href: "/differentiate",
  },
  {
    title: "IEP Support",
    description: "Individual Education Plan strategies and targets",
    icon: ClipboardList,
    color: "bg-teal-50 text-teal-600",
    href: "/worksheets",
  },
  {
    title: "Behaviour Support",
    description: "Zones of Regulation, reward charts, self-regulation",
    icon: BarChart3,
    color: "bg-orange-50 text-orange-600",
    href: "/worksheets",
  },
  {
    title: "Transition Support",
    description: "Visual timetables, social stories for transitions",
    icon: GraduationCap,
    color: "bg-indigo-50 text-indigo-600",
    href: "/stories",
  },
];

export default function Templates() {
  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground">Quick-start templates for common SEND resources.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map((tmpl, i) => {
          const Icon = tmpl.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link href={tmpl.href}>
                <Card className="border-border/50 hover:border-brand/30 hover:shadow-sm transition-all cursor-pointer h-full">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${tmpl.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{tmpl.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tmpl.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
