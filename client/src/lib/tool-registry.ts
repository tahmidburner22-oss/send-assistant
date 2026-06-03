/**
 * tool-registry.ts — Single source of truth for the 24 platform tools.
 *
 * Each entry maps a stable tool slug to:
 *  - the human label & route used everywhere (sidebar, palette, hubs, timeline)
 *  - the hub it primarily belongs to (used by hub storyboards)
 *  - which downstream tools can be reached from this tool's "Send to…" menu
 *  - which pupil/form fields it can pre-populate from the registry handoff
 *
 * The registry is intentionally data-only so it can be consumed by:
 *  - AIToolPage (Send-to menu)
 *  - PupilProfile (per-tool tabs, timeline)
 *  - HubStoryboard / pipelines
 *  - CommandPalette + GlobalRecent (icons, labels)
 *
 * IDs match the slug AIToolPage derives from `title` (lowercase, dash-separated).
 */
import type { LucideIcon } from "lucide-react";
import {
  FileCheck, FileText, Sparkles, BookOpen, Zap, Headphones, ShieldAlert,
  IdCard, CheckSquare, Heart, Mail, BarChart3, CalendarDays, ScrollText,
  ScanSearch, Calendar, ExternalLink, Layers, Table2, Map as MapIcon,
  BookMarked, Gauge, Presentation, Ticket, HelpCircle, ShieldCheck,
  Pencil, MessageSquare, BookOpenCheck, LayoutGrid,
  Gamepad2, Network, Recycle, Bot,
} from "lucide-react";

export type HubId =
  | "send" | "ehcp" | "planning" | "classroom" | "communications" | "revision";

export interface ToolEntry {
  /** Stable slug — used for storage keys, validators, telemetry, routes. */
  id: string;
  /** Human label — matches the landing-page TOOLS list. */
  label: string;
  /** Primary route within the app. */
  path: string;
  /** Hub the tool primarily belongs to. */
  hub: HubId;
  /** Lucide icon. */
  icon: LucideIcon;
  /** Tailwind colour pair: text + tinted bg (e.g. "text-indigo-600 bg-indigo-50"). */
  colour: string;
  /** Short description for hub cards / timelines. */
  description: string;
  /** Down-stream tools reachable from this tool's "Send to…" menu. */
  sendTo: string[];
  /** Whether this tool emits write-backs onto a pupil timeline. */
  writeBack?: boolean;
}

export const TOOLS: ToolEntry[] = [
  {
    id: "ehcp-plan-generator",
    label: "EHCP Plan Generator",
    path: "/tools/iep-generator",
    hub: "ehcp",
    icon: FileCheck,
    colour: "text-indigo-700 bg-indigo-50",
    description: "5-stage AI EHCP builder with golden-thread QA.",
    sendTo: ["smart-targets", "behaviour-plan", "pupil-passport", "scheduler"],
    writeBack: true,
  },
  {
    id: "worksheet-generator",
    label: "Worksheet Generator",
    path: "/worksheets",
    hub: "planning",
    icon: FileText,
    colour: "text-blue-600 bg-blue-50",
    description: "Curriculum-aligned, SEND-adapted worksheets.",
    sendTo: ["differentiate", "flash-cards", "daily-adaptive-work"],
    writeBack: true,
  },
  {
    id: "differentiate",
    label: "Differentiate",
    path: "/differentiate",
    hub: "send",
    icon: Sparkles,
    colour: "text-purple-600 bg-purple-50",
    description: "Adapt any worksheet for different SEND profiles.",
    sendTo: ["worksheet-generator", "flash-cards"],
    writeBack: true,
  },
  {
    id: "reading-and-stories",
    label: "Reading & Stories",
    path: "/reading",
    hub: "classroom",
    icon: BookOpen,
    colour: "text-emerald-600 bg-emerald-50",
    description: "AI-generated reading passages + comprehension.",
    sendTo: ["audio-revision-hub", "comprehension-generator", "skill-ladder"],
    writeBack: true,
  },
  {
    id: "quizblast",
    label: "QuizBlast",
    path: "/quiz-game",
    hub: "classroom",
    icon: Zap,
    colour: "text-yellow-600 bg-yellow-50",
    description: "Live interactive classroom quizzes.",
    sendTo: ["skill-ladder", "report-comments", "daily-adaptive-work"],
    writeBack: true,
  },
  {
    id: "audio-revision-hub",
    label: "Audio Revision Hub",
    path: "/revision-hub",
    hub: "revision",
    icon: Headphones,
    colour: "text-indigo-600 bg-indigo-50",
    description: "Text-to-speech + voice-controlled revision.",
    sendTo: ["flash-cards", "skill-ladder"],
    writeBack: true,
  },
  {
    id: "behaviour-plan",
    label: "Behaviour Support Plans",
    path: "/tools/behaviour-plan",
    hub: "send",
    icon: ShieldAlert,
    colour: "text-orange-600 bg-orange-50",
    description: "Personalised BSPs with triggers + de-escalation.",
    sendTo: ["pupil-passport", "scheduler", "wellbeing-support"],
    writeBack: true,
  },
  {
    id: "pupil-passport",
    label: "Pupil Passport",
    path: "/tools/pupil-passport",
    hub: "send",
    icon: IdCard,
    colour: "text-amber-600 bg-amber-50",
    description: "One-page profiles for staff + supply teachers.",
    sendTo: ["behaviour-plan", "lesson-planner", "smart-targets"],
    writeBack: true,
  },
  {
    id: "smart-targets",
    label: "SMART Targets",
    path: "/tools/smart-targets",
    hub: "send",
    icon: CheckSquare,
    colour: "text-teal-600 bg-teal-50",
    description: "Measurable, time-bound EHCP-aligned targets.",
    sendTo: ["pupil-passport", "report-comments", "scheduler"],
    writeBack: true,
  },
  {
    id: "wellbeing-support",
    label: "Wellbeing Support",
    path: "/tools/wellbeing-support",
    hub: "send",
    icon: Heart,
    colour: "text-rose-600 bg-rose-50",
    description: "Wellbeing check-ins, plans + interventions.",
    sendTo: ["behaviour-plan", "scheduler", "parent-newsletter"],
    writeBack: true,
  },
  {
    id: "communication-board",
    label: "Communication Board",
    path: "/tools/communication-board",
    hub: "send",
    icon: LayoutGrid,
    colour: "text-sky-600 bg-sky-50",
    description: "Printable AAC symbol boards (ARASAAC) for choice-making + communication.",
    sendTo: ["visual-timetable", "social-stories", "pupil-passport"],
    writeBack: false,
  },
  {
    id: "connected-resource-generator",
    label: "Connected Resource Generator",
    path: "/tools/connected-resource",
    hub: "send",
    icon: Layers,
    colour: "text-indigo-600 bg-indigo-50",
    description: "One topic → a connected, differentiated SEND pack (worksheet, slides, reading, quiz, comms board, TA guide).",
    sendTo: ["worksheet-generator", "communication-board", "send-story-studio"],
    writeBack: false,
  },
  {
    id: "send-story-studio",
    label: "Reading & Story Studio",
    path: "/tools/story-studio",
    hub: "send",
    icon: BookOpen,
    colour: "text-emerald-600 bg-emerald-50",
    description: "Pupils author accessible, illustrated, symbol-supported e-books — published with their name.",
    sendTo: ["send-activity-generator", "communication-board"],
    writeBack: false,
  },
  {
    id: "send-activity-generator",
    label: "Interactive Activity Generator",
    path: "/tools/activity-generator",
    hub: "send",
    icon: Gamepad2,
    colour: "text-yellow-600 bg-yellow-50",
    description: "Accessible word searches, crosswords, matching & fill-the-gaps from any vocabulary.",
    sendTo: ["communication-board", "send-visual-learning"],
    writeBack: false,
  },
  {
    id: "send-visual-learning",
    label: "Visual Learning Studio",
    path: "/tools/visual-learning",
    hub: "send",
    icon: Network,
    colour: "text-sky-600 bg-sky-50",
    description: "Accessible mind maps, cycles & timelines (free SVG engine) with progressive disclosure.",
    sendTo: ["send-connected-resource", "send-story-studio"],
    writeBack: false,
  },
  {
    id: "send-adaptation-hub",
    label: "Resource Adaptation Hub",
    path: "/tools/adaptation-hub",
    hub: "send",
    icon: Recycle,
    colour: "text-teal-600 bg-teal-50",
    description: "Adapt any text for a SEND profile, or turn a video into accessible comprehension activities.",
    sendTo: ["worksheet-generator", "send-activity-generator"],
    writeBack: false,
  },
  {
    id: "send-teaching-agent",
    label: "SEND Teaching Agent",
    path: "/tools/teaching-agent",
    hub: "send",
    icon: Bot,
    colour: "text-purple-600 bg-purple-50",
    description: "EHCP-linked rubrics, costed provision maps & annual-review prep packs.",
    sendTo: ["smart-targets", "ehcp-plan-generator"],
    writeBack: false,
  },
  {
    id: "parent-newsletter",
    label: "Parent Newsletter",
    path: "/tools/parent-newsletter",
    hub: "communications",
    icon: Mail,
    colour: "text-pink-600 bg-pink-50",
    description: "Inclusive parent communications in seconds.",
    sendTo: ["parent-portal"],
    writeBack: true,
  },
  {
    id: "analytics-dashboard",
    label: "Analytics Dashboard",
    path: "/analytics",
    hub: "classroom",
    icon: BarChart3,
    colour: "text-rose-600 bg-rose-50",
    description: "School-wide and pupil-level analytics.",
    sendTo: [],
    writeBack: false,
  },
  {
    id: "lesson-planner",
    label: "Lesson Planner",
    path: "/tools/lesson-planner",
    hub: "planning",
    icon: CalendarDays,
    colour: "text-green-600 bg-green-50",
    description: "Full lesson plans with SEND adaptations.",
    sendTo: ["worksheet-generator", "exit-ticket", "rubric-generator", "skill-ladder"],
    writeBack: true,
  },
  {
    id: "past-papers",
    label: "Past Papers",
    path: "/past-papers",
    hub: "revision",
    icon: ScrollText,
    colour: "text-teal-600 bg-teal-50",
    description: "Searchable past-paper bank with SEND-adapted versions.",
    sendTo: ["differentiate", "flash-cards", "audio-revision-hub"],
    writeBack: false,
  },
  {
    id: "send-screener",
    label: "SEND Screener",
    path: "/send-screener",
    hub: "send",
    icon: ScanSearch,
    colour: "text-indigo-600 bg-indigo-50",
    description: "Evidence-based SEND screening + referrals.",
    sendTo: ["pupil-passport", "ehcp-plan-generator", "smart-targets"],
    writeBack: true,
  },
  {
    id: "scheduler",
    label: "Scheduler",
    path: "/scheduler",
    hub: "communications",
    icon: Calendar,
    colour: "text-violet-600 bg-violet-50",
    description: "Coordinate reviews, meetings + reminders.",
    sendTo: ["parent-newsletter"],
    writeBack: true,
  },
  {
    id: "parent-portal",
    label: "Parent Portal",
    path: "/parent-portal",
    hub: "communications",
    icon: ExternalLink,
    colour: "text-blue-600 bg-blue-50",
    description: "Pupils, parents and staff connected.",
    sendTo: [],
    writeBack: false,
  },
  {
    id: "skill-ladder",
    label: "Skill Ladder",
    path: "/skill-ladder",
    hub: "classroom",
    icon: Gauge,
    colour: "text-cyan-600 bg-cyan-50",
    description: "Visual progression tracker per pupil.",
    sendTo: ["worksheet-generator", "smart-targets"],
    writeBack: true,
  },
  {
    id: "daily-adaptive-work",
    label: "Daily Adaptive Work",
    path: "/daily-work",
    hub: "send",
    icon: BookMarked,
    colour: "text-fuchsia-600 bg-fuchsia-50",
    description: "Personalised daily work pack per pupil.",
    sendTo: ["parent-portal"],
    writeBack: true,
  },
  {
    id: "rubric-generator",
    label: "Rubric Generator",
    path: "/tools/rubric-generator",
    hub: "planning",
    icon: Table2,
    colour: "text-violet-600 bg-violet-50",
    description: "SEND-tuned assessment rubrics in one click.",
    sendTo: ["report-comments", "skill-ladder"],
    writeBack: true,
  },
  {
    id: "report-comments",
    label: "Report Comments",
    path: "/tools/report-comments",
    hub: "communications",
    icon: FileText,
    colour: "text-rose-600 bg-rose-50",
    description: "Individualised report comments in seconds.",
    sendTo: ["parent-portal", "parent-newsletter"],
    writeBack: true,
  },
  {
    id: "visual-timetable",
    label: "Visual Timetable",
    path: "/visual-timetable",
    hub: "send",
    icon: MapIcon,
    colour: "text-sky-600 bg-sky-50",
    description: "Symbol + audio-cue daily timetables.",
    sendTo: ["pupil-passport", "daily-adaptive-work"],
    writeBack: false,
  },
  {
    id: "flash-cards",
    label: "Flash Cards",
    path: "/tools/flash-cards",
    hub: "revision",
    icon: Layers,
    colour: "text-yellow-600 bg-yellow-50",
    description: "Spaced-repetition flashcards from any topic.",
    sendTo: ["audio-revision-hub", "skill-ladder"],
    writeBack: true,
  },
  {
    id: "medium-term-planner",
    label: "Medium-Term Planner",
    path: "/tools/medium-term-planner",
    hub: "planning",
    icon: Calendar,
    colour: "text-emerald-700 bg-emerald-50",
    description: "Half-term + unit plans with SEND considerations.",
    sendTo: ["lesson-planner", "rubric-generator"],
    writeBack: false,
  },

  // ── Restored tools — were dropped from the hub layout when storyboards
  // were introduced. They have always been routed in App.tsx but were never
  // surfaced via hub cards or the tool registry. Adding them back so they
  // appear in HubStoryboard tool pills and Send-to menus. ─────────────────
  {
    id: "presentation-maker",
    label: "Presentation Maker",
    path: "/tools/presentation-maker",
    hub: "planning",
    icon: Presentation,
    colour: "text-fuchsia-600 bg-fuchsia-50",
    description: "AI-generated lesson slides, ready to teach from.",
    sendTo: ["lesson-planner", "worksheet-generator", "exit-ticket"],
    writeBack: false,
  },
  {
    id: "comprehension-generator",
    label: "Comprehension Generator",
    path: "/tools/comprehension-generator",
    hub: "planning",
    icon: BookOpenCheck,
    colour: "text-emerald-600 bg-emerald-50",
    description: "Reading passage + comprehension questions on any topic.",
    sendTo: ["worksheet-generator", "differentiate", "flash-cards"],
    writeBack: true,
  },
  {
    id: "exit-ticket",
    label: "Exit Ticket",
    path: "/tools/exit-ticket",
    hub: "planning",
    icon: Ticket,
    colour: "text-amber-600 bg-amber-50",
    description: "Quick end-of-lesson check on the learning objective.",
    sendTo: ["skill-ladder", "lesson-planner"],
    writeBack: true,
  },
  {
    id: "vocabulary-builder",
    label: "Vocabulary Builder",
    path: "/tools/vocabulary-builder",
    hub: "planning",
    icon: BookMarked,
    colour: "text-lime-700 bg-lime-50",
    description: "Tier 2 / 3 vocabulary mats and word lists per topic.",
    sendTo: ["worksheet-generator", "flash-cards", "comprehension-generator"],
    writeBack: true,
  },
  {
    id: "quiz-generator",
    label: "Quiz Generator",
    path: "/tools/quiz-generator",
    hub: "planning",
    icon: HelpCircle,
    colour: "text-orange-600 bg-orange-50",
    description: "Printable quiz papers with mark scheme and SEND tier.",
    sendTo: ["quizblast", "rubric-generator", "skill-ladder"],
    writeBack: true,
  },
  {
    id: "risk-assessment",
    label: "Risk Assessment",
    path: "/tools/risk-assessment",
    hub: "send",
    icon: ShieldCheck,
    colour: "text-red-600 bg-red-50",
    description: "Trip and activity risk assessments with SEND adjustments.",
    sendTo: ["scheduler", "parent-newsletter"],
    writeBack: false,
  },
  {
    id: "text-rewriter",
    label: "Text Rewriter",
    path: "/tools/text-rewriter",
    hub: "communications",
    icon: Pencil,
    colour: "text-slate-600 bg-slate-50",
    description: "Simplify, translate or adapt any text for reading age.",
    sendTo: ["differentiate", "parent-newsletter", "comprehension-generator"],
    writeBack: false,
  },
  {
    id: "social-stories",
    label: "Social Stories",
    path: "/tools/social-stories",
    hub: "send",
    icon: MessageSquare,
    colour: "text-purple-600 bg-purple-50",
    description: "Personalised social stories for transitions and routines.",
    sendTo: ["pupil-passport", "behaviour-plan", "wellbeing-support"],
    writeBack: true,
  },
  {
    id: "create-exam-paper",
    label: "Create an Exam Paper",
    path: "/tools/create-exam-paper",
    hub: "revision",
    icon: ScrollText,
    colour: "text-rose-700 bg-rose-50",
    description: "Pick subject, topics and total marks — assemble a real-style mock exam paper from the question bank.",
    sendTo: ["differentiate", "flash-cards", "audio-revision-hub"],
    writeBack: true,
  },
];

const BY_ID = new globalThis.Map(TOOLS.map(t => [t.id, t]));

export function getTool(id: string): ToolEntry | undefined {
  return BY_ID.get(id);
}

/** Look up a tool entry from its AIToolPage-derived slug — falls back gracefully. */
export function getToolBySlug(slug: string): ToolEntry | undefined {
  return BY_ID.get(slug);
}

/** All tools in a given hub, ordered to match the landing-page narrative. */
export function toolsForHub(hub: HubId): ToolEntry[] {
  return TOOLS.filter(t => t.hub === hub);
}

/** Resolve the downstream tool entries this tool can hand off to. */
export function sendToTargets(id: string): ToolEntry[] {
  const t = BY_ID.get(id);
  if (!t) return [];
  return t.sendTo.map(targetId => BY_ID.get(targetId)).filter(Boolean) as ToolEntry[];
}

/**
 * Field-name aliases the registry will translate when handing off from one
 * tool to another (e.g. lesson-planner.topic → worksheet-generator.topic).
 * Keep deliberately small — per-tool overrides live in each tool's onLoad.
 */
export const FIELD_ALIASES: Record<string, string[]> = {
  topic:     ["topic", "subject_topic", "lesson_topic", "title"],
  yearGroup: ["yearGroup", "year", "year_group"],
  subject:   ["subject"],
  sendNeed:  ["sendNeed", "send_need", "need"],
  studentName: ["studentName", "pupil", "pupilName", "initials"],
};

/** Translate a field-value bag from one tool's vocabulary to another's. */
export function translateFields(
  values: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = { ...values };
  for (const [canon, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (values[alias] && !out[canon]) out[canon] = values[alias];
    }
    for (const alias of aliases) {
      if (out[canon] && !out[alias]) out[alias] = out[canon];
    }
  }
  return out;
}
