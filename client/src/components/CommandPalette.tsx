import { useState, useEffect } from "react";
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
} from "lucide-react";

const hubItems = [
  { path: "/send-hub",           label: "SEND Hub",           icon: Brain,         group: "Hubs" },
  { path: "/revision-section",   label: "Revision Hub",       icon: GraduationCap, group: "Hubs" },
  { path: "/planning-hub",       label: "Planning Hub",       icon: Pencil,        group: "Hubs" },
  { path: "/communications-hub", label: "Communications Hub", icon: MessageCircle, group: "Hubs" },
  { path: "/classroom-hub",      label: "Classroom Hub",      icon: Monitor,       group: "Hubs" },
];

const coreItems = [
  { path: "/home",           label: "Home",               icon: Home,        group: "Core" },
  { path: "/differentiate",  label: "Differentiate",      icon: Sparkles,    group: "Core" },
  { path: "/worksheets",     label: "Worksheets",         icon: FileText,    group: "Core" },
  { path: "/reading",        label: "Reading & Stories",  icon: BookOpen,    group: "Core" },
  { path: "/past-papers",    label: "Past Papers",        icon: ScrollText,  group: "Core" },
  { path: "/templates",      label: "Pre-made Worksheets",icon: LayoutGrid,  group: "Core" },
  { path: "/pupils",         label: "Pupils",             icon: Users,       group: "Core" },
  { path: "/revision-hub",   label: "Audio Revision Hub", icon: Headphones,  group: "Core" },
  { path: "/quiz-game",      label: "QuizBlast",          icon: Zap,         group: "Core" },
  { path: "/daily-briefing", label: "Daily Briefing",     icon: NotebookPen, group: "Core" },
  { path: "/history",        label: "History",            icon: Clock,       group: "Core" },
  { path: "/analytics",      label: "Analytics",          icon: BarChart3,   group: "Core" },
  { path: "/ideas",          label: "Ideas",              icon: Lightbulb,   group: "Core" },
  { path: "/settings",       label: "Settings",           icon: Settings,    group: "Core" },
];

const sendItems = [
  { path: "/tools/iep-generator",       label: "EHCP Plan Generator",   icon: FileCheck,   group: "SEND Tools" },
  { path: "/send-screener",             label: "SEND Needs Screener",    icon: ScanSearch,  group: "SEND Tools" },
  { path: "/tools/social-stories",      label: "Social Stories",         icon: BookOpen,    group: "SEND Tools" },
  { path: "/tools/pupil-passport",      label: "Pupil Passport",         icon: IdCard,      group: "SEND Tools" },
  { path: "/tools/smart-targets",       label: "SMART Targets",          icon: CheckSquare, group: "SEND Tools" },
  { path: "/tools/behaviour-plan",      label: "Behaviour Support Plan", icon: ShieldAlert, group: "SEND Tools" },
  { path: "/tools/wellbeing-support",   label: "Wellbeing Support",      icon: Heart,       group: "SEND Tools" },
];

const planningItems = [
  { path: "/tools/lesson-planner",          label: "Lesson Planner",          icon: CalendarDays, group: "Planning" },
  { path: "/tools/medium-term-planner",     label: "Medium Term Planner",     icon: Calendar,     group: "Planning" },
  { path: "/tools/quiz-generator",          label: "Quiz Generator",          icon: Lightbulb,    group: "Planning" },
  { path: "/tools/rubric-generator",        label: "Rubric / Mark Scheme",    icon: Table2,       group: "Planning" },
  { path: "/tools/comprehension-generator", label: "Comprehension Generator", icon: BookMarked,   group: "Planning" },
  { path: "/tools/exit-ticket",             label: "Exit Ticket",             icon: Ticket,       group: "Planning" },
  { path: "/tools/flash-cards",             label: "Flash Cards",             icon: Layers,       group: "Planning" },
  { path: "/tools/vocabulary-builder",      label: "Vocabulary Builder",      icon: BookType,     group: "Planning" },
  { path: "/tools/risk-assessment",         label: "Risk Assessment",         icon: ClipboardList,group: "Planning" },
];

const commsItems = [
  { path: "/tools/report-comments",   label: "Report Comments",   icon: FileText,    group: "Communications" },
  { path: "/tools/parent-newsletter", label: "Parent Newsletter", icon: Mail,        group: "Communications" },
  { path: "/tools/text-rewriter",     label: "Text Rewriter",     icon: AlignLeft,   group: "Communications" },
  { path: "/pupil-comments",          label: "Pupil Comments",    icon: MessageSquare,group: "Communications" },
  { path: "/behaviour-tracking",      label: "Behaviour Tracking",icon: TrendingUp,  group: "Communications" },
  { path: "/attendance",              label: "Attendance Tracker",icon: ClipboardList,group: "Communications" },
  { path: "/parent-portal",           label: "Parent Portal",     icon: ExternalLink, group: "Communications" },
];

const allGroups = [
  { label: "Hubs",           items: hubItems },
  { label: "Core",           items: coreItems },
  { label: "SEND Tools",     items: sendItems },
  { label: "Planning",       items: planningItems },
  { label: "Communications", items: commsItems },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setLocation(path);
    setOpen(false);
    setQuery("");
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search pages, tools, hubs…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {allGroups.map(group => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.path} value={item.label} keywords={[item.group, item.path]} onSelect={() => handleSelect(item.path)}>
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
