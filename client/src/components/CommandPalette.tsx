import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Home, Sparkles, FileText, BookOpen, LayoutGrid, Users, Clock,
  BarChart3, Lightbulb, Settings, ScanSearch, Headphones, Zap, NotebookPen,
  ScrollText, Brain, GraduationCap, Pencil, MessageCircle, Monitor,
  Shield, IdCard, CheckSquare, ShieldAlert, Heart, CalendarDays, Calendar,
  Table2, BookMarked, Ticket, Layers, BookType, ClipboardList,
  Mail, AlignLeft, TrendingUp, MessageSquare, ExternalLink, FileCheck,
  Map, Gamepad2, UserCog, BarChart2, Lock,
} from "lucide-react";

const hubItems = [
  { path: "/send-hub",           label: "SEND Hub",           icon: Brain,         group: "Hubs",  keywords: ["send", "inclusion", "special needs"] },
  { path: "/ehcp-hub",           label: "EHCP Hub",           icon: ClipboardList, group: "Hubs",  keywords: ["ehcp", "education health care plan", "iep", "senco"] },
  { path: "/revision-section",   label: "Revision Hub",       icon: GraduationCap, group: "Hubs",  keywords: ["revision", "exam", "gcse", "a-level"] },
  { path: "/planning-hub",       label: "Planning Hub",       icon: Pencil,        group: "Hubs",  keywords: ["planning", "lesson", "scheme of work"] },
  { path: "/communications-hub", label: "Communications Hub", icon: MessageCircle, group: "Hubs",  keywords: ["communications", "parents", "letters", "reports"] },
  { path: "/classroom-hub",      label: "Classroom Hub",      icon: Monitor,       group: "Hubs",  keywords: ["classroom", "display", "timetable", "behaviour"] },
];

const coreItems = [
  { path: "/home",           label: "Home",                icon: Home,        group: "Core", keywords: ["dashboard", "start", "overview"] },
  { path: "/differentiate",  label: "Differentiate",       icon: Sparkles,    group: "Core", keywords: ["differentiation", "scaffold", "adapt", "send"] },
  { path: "/worksheets",     label: "Worksheets",          icon: FileText,    group: "Core", keywords: ["worksheet", "activity", "task", "generate"] },
  { path: "/reading",        label: "Reading & Stories",   icon: BookOpen,    group: "Core", keywords: ["reading", "stories", "comprehension", "fiction"] },
  { path: "/past-papers",    label: "Past Papers",         icon: ScrollText,  group: "Core", keywords: ["past papers", "exam", "gcse", "questions", "practice"] },
  { path: "/templates",      label: "Pre-made Worksheets", icon: LayoutGrid,  group: "Core", keywords: ["templates", "premade", "ready made", "resource"] },
  { path: "/pupils",         label: "Pupils",              icon: Users,       group: "Core", keywords: ["pupils", "students", "children", "class", "register"] },
  { path: "/revision-hub",   label: "Audio Revision Hub",  icon: Headphones,  group: "Core", keywords: ["audio", "revision", "listen", "voice", "tts"] },
  { path: "/quiz-game",      label: "QuizBlast",           icon: Zap,         group: "Core", keywords: ["quiz", "game", "quizblast", "interactive", "live"] },
  { path: "/quiz-builder",   label: "Quiz Builder",        icon: Gamepad2,    group: "Core", keywords: ["quiz builder", "create quiz", "questions", "multiple choice"] },
  { path: "/daily-briefing", label: "Daily Briefing",      icon: NotebookPen, group: "Core", keywords: ["briefing", "morning", "afternoon", "debrief", "daily"] },
  { path: "/visual-timetable", label: "Visual Timetable",  icon: Map,         group: "Core", keywords: ["timetable", "visual", "schedule", "routine", "send"] },
  { path: "/history",        label: "History",             icon: Clock,       group: "Core", keywords: ["history", "previous", "saved", "recent"] },
  { path: "/analytics",      label: "Analytics",           icon: BarChart3,   group: "Core", keywords: ["analytics", "stats", "usage", "data", "insights"] },
  { path: "/ideas",          label: "Ideas & Feedback",    icon: Lightbulb,   group: "Core", keywords: ["ideas", "feedback", "suggestions", "feature request"] },
  { path: "/settings",       label: "Settings",            icon: Settings,    group: "Core", keywords: ["settings", "preferences", "account", "school", "logo"] },
];

const sendItems = [
  { path: "/tools/iep-generator",       label: "EHCP Plan Generator",    icon: FileCheck,   group: "SEND Tools", keywords: ["ehcp", "iep", "plan", "education health care", "senco", "draft"] },
  { path: "/send-screener",             label: "SEND Needs Screener",     icon: ScanSearch,  group: "SEND Tools", keywords: ["screener", "needs", "assessment", "identify", "send"] },
  { path: "/tools/social-stories",      label: "Social Stories",          icon: BookOpen,    group: "SEND Tools", keywords: ["social stories", "autism", "asd", "behaviour", "narrative"] },
  { path: "/tools/pupil-passport",      label: "Pupil Passport",          icon: IdCard,      group: "SEND Tools", keywords: ["pupil passport", "profile", "one page", "student info"] },
  { path: "/tools/smart-targets",       label: "SMART Targets",           icon: CheckSquare, group: "SEND Tools", keywords: ["smart targets", "goals", "objectives", "iep targets"] },
  { path: "/tools/behaviour-plan",      label: "Behaviour Support Plan",  icon: ShieldAlert, group: "SEND Tools", keywords: ["behaviour", "support plan", "bsp", "conduct", "intervention"] },
  { path: "/tools/wellbeing-support",   label: "Wellbeing Support",       icon: Heart,       group: "SEND Tools", keywords: ["wellbeing", "mental health", "support", "pastoral"] },
];

const planningItems = [
  { path: "/tools/lesson-planner",          label: "Lesson Planner",          icon: CalendarDays,  group: "Planning", keywords: ["lesson plan", "planner", "scheme", "objectives"] },
  { path: "/tools/medium-term-planner",     label: "Medium Term Planner",     icon: Calendar,      group: "Planning", keywords: ["medium term", "mtp", "half term", "unit plan"] },
  { path: "/tools/quiz-generator",          label: "Quiz Generator",          icon: Lightbulb,     group: "Planning", keywords: ["quiz", "questions", "multiple choice", "test"] },
  { path: "/tools/rubric-generator",        label: "Rubric / Mark Scheme",    icon: Table2,        group: "Planning", keywords: ["rubric", "mark scheme", "assessment", "criteria", "marking"] },
  { path: "/tools/comprehension-generator", label: "Comprehension Generator", icon: BookMarked,    group: "Planning", keywords: ["comprehension", "reading", "questions", "passage"] },
  { path: "/tools/exit-ticket",             label: "Exit Ticket",             icon: Ticket,        group: "Planning", keywords: ["exit ticket", "plenary", "check", "assessment"] },
  { path: "/tools/flash-cards",             label: "Flash Cards",             icon: Layers,        group: "Planning", keywords: ["flash cards", "flashcards", "revision", "memory"] },
  { path: "/tools/vocabulary-builder",      label: "Vocabulary Builder",      icon: BookType,      group: "Planning", keywords: ["vocabulary", "words", "glossary", "definitions", "key terms"] },
  { path: "/tools/risk-assessment",         label: "Risk Assessment",         icon: ClipboardList, group: "Planning", keywords: ["risk assessment", "health safety", "trip", "outdoor"] },
];

const commsItems = [
  { path: "/tools/report-comments",   label: "Report Comments",    icon: FileText,      group: "Communications", keywords: ["report", "comments", "end of term", "pupil report"] },
  { path: "/tools/parent-newsletter", label: "Parent Newsletter",  icon: Mail,          group: "Communications", keywords: ["newsletter", "parents", "letter", "communication"] },
  { path: "/tools/text-rewriter",     label: "Text Rewriter",      icon: AlignLeft,     group: "Communications", keywords: ["rewriter", "simplify", "rephrase", "edit", "reword"] },
  { path: "/pupil-comments",          label: "Pupil Comments",     icon: MessageSquare, group: "Communications", keywords: ["pupil comments", "feedback", "marking", "written"] },
  { path: "/behaviour-tracking",      label: "Behaviour Tracking", icon: TrendingUp,    group: "Communications", keywords: ["behaviour", "tracking", "incidents", "log", "pastoral"] },
  { path: "/attendance",              label: "Attendance Tracker", icon: BarChart2,     group: "Communications", keywords: ["attendance", "register", "absence", "present"] },
  { path: "/parent-portal",           label: "Parent Portal",      icon: ExternalLink,  group: "Communications", keywords: ["parent portal", "parents", "share", "external"] },
];

const allGroups = [
  { label: "Hubs",           items: hubItems },
  { label: "Core",           items: coreItems },
  { label: "SEND Tools",     items: sendItems },
  { label: "Planning",       items: planningItems },
  { label: "Communications", items: commsItems },
  { label: "Legal & Info",   items: [
    { path: "/privacy",        label: "Privacy Policy",    icon: Shield,      group: "Legal & Info", keywords: ["privacy", "gdpr", "data protection", "personal data"] },
    { path: "/terms",          label: "Terms of Service",  icon: FileText,    group: "Legal & Info", keywords: ["terms", "conditions", "legal", "agreement"] },
    { path: "/dpa",            label: "Data Processing Agreement", icon: Lock, group: "Legal & Info", keywords: ["dpa", "data processing", "gdpr", "school contract"] },
    { path: "/safeguarding",   label: "Safeguarding Policy", icon: Shield,   group: "Legal & Info", keywords: ["safeguarding", "kcsie", "child safety", "dsl"] },
    { path: "/ai-governance",  label: "AI Governance",     icon: Shield,      group: "Legal & Info", keywords: ["ai", "governance", "responsible ai", "transparency"] },
    { path: "/accessibility",  label: "Accessibility",     icon: Users,       group: "Legal & Info", keywords: ["accessibility", "wcag", "disability", "screen reader"] },
    { path: "/help",           label: "Help Centre",       icon: BookOpen,    group: "Legal & Info", keywords: ["help", "support", "faq", "how to", "guide"] },
  ]},
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Listen for keyboard shortcut Ctrl+K / Cmd+K
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    // Listen for custom event dispatched by the search bar button
    const openPalette = () => setOpen(true);
    document.addEventListener("keydown", down);
    window.addEventListener("adaptly:open-search", openPalette);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("adaptly:open-search", openPalette);
    };
  }, []);

  const handleSelect = (path: string) => {
    setLocation(path);
    setOpen(false);
    setQuery("");
  };

  return (
    <CommandDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(""); }}>
      <CommandInput
        placeholder="Search pages, tools, hubs…"
        value={query}
        onValueChange={setQuery}
        autoFocus
      />
      <CommandList>
        <CommandEmpty>No results found for "{query}".</CommandEmpty>
        {allGroups.map(group => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.path}
                  value={`${item.label} ${item.group} ${item.path} ${(item.keywords || []).join(" ")}`}
                  onSelect={() => handleSelect(item.path)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{item.group}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
