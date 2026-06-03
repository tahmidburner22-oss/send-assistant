/**
 * PresentationMaker — AI-powered lesson slide generator
 * Professional-quality output: structured slides, professional themes, PPTX export
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Monitor, Sparkles, RefreshCw, ChevronLeft,
  ChevronRight, Loader2, Palette, FileDown, Eye,
  BookOpen, Target, Lightbulb, HelpCircle, CheckSquare, Brain,
  ArrowRight, List, Copy, Check, Plus, Users, AlertCircle,
  Pencil, Zap, Edit3, Calculator, GraduationCap, Sliders,
  Printer, Mail, Save, Maximize2, X, ChevronUp, ChevronDown,
  Trash2, MoreVertical,
  // Phase 3 imports (timer, reveal, presenter view, accessibility)
  Volume2, VolumeX, Pause, Play, Clock, Send, Type as TypeIcon,
  Sun, Moon, ZoomIn, History as HistoryIcon, EyeOff,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { callAI, callAIMessages, type AIChatMessage } from "@/lib/ai";
import { useApp } from "@/contexts/AppContext";
import { useLocation } from "wouter";

import { FunFactsCarousel } from "@/components/FunFactsCarousel";
import PresentationDiagram from "@/components/PresentationDiagram";
import PresentationMakerEnhancementsPanel from "@/components/PresentationMakerEnhancementsPanel";
import SlidePollQR from "@/components/SlidePollQR";
import { persistHandoff } from "@/components/SendToMenu";
import { resolvePresentationTemplate } from "@/lib/presentation-templates";
import { buildSubjectPromptFragments, getSubjectProfile } from "@/lib/subject-profiles";
import { formatMisconceptionsForPrompt } from "@/lib/misconception-bank";
import { lookupByTopic, type CurriculumEntry } from "@/lib/curriculumBank";
import { runAllValidators, type ValidationFinding } from "@/lib/presentation-validators";
import { recordTelemetry } from "@/lib/presentation-telemetry";
import { readSchoolIdentity, writeSchoolIdentity, fileToDataUrl, type SchoolIdentity } from "@/lib/school-identity";
import { resolveDeckImages, bestImageUrl, fetchImageAsDataUrl } from "@/lib/presentation-image-resolver";
// V5 — opt-in ARASAAC symbol support for word banks / key terms (SEND USP).
import { TermSymbol } from "@/components/SymbolSupportedWords";
import { resolveSymbolsForWords, fetchSymbolAsDataUrl } from "@/lib/symbol-resolver";
import { resolveSendSpecs, composeSendNoteForPresentation, getSendReadingAgeCeiling, getAppliedAdaptations, getSendThemeOverride } from "@/lib/sendPromptFragments";
import { z } from "zod";

// ─── Zod schema for AI-generated slide validation ────────────────────────────
// Slide type enum. New types for the teacher-framework:
//   vocab-reference   — full glossary table (replaces/augments key-terms for revision decks)
//   model-answer      — annotated exemplar showing mark-scheme points
//   exam-practice     — timed exam question card with mark allocation + command word
//   brain-break       — ADHD mid-deck "stand up and stretch" slide
//   checkin           — Anxiety/SEMH emoji feelings check-in
//   method-steps      — Dyslexia/Dyscalculia "Step-by-step method" reference
//   help-box          — MLD key-facts reference panel
//   word-bank         — SLCN/EAL vocabulary strip with plain-English definitions
//   take-a-break      — PDA/Anxiety/Tourette's break slide
const SlideTypeEnum = z.enum([
  "title","learning-objectives","hook","content","key-terms","worked-example",
  "activity","discussion","check-understanding","summary","exit-ticket","extension",
  "retrieval-warm-up","misconception-bust","exam-technique","real-world-link",
  "think-pair-share","mini-quiz","diagram-label","pause-and-solve",
  // Teacher-framework additions
  "vocab-reference","model-answer","exam-practice",
  // SEND-native slide types (inserted by the prompt when specific needs apply)
  "brain-break","checkin","method-steps","help-box","word-bank","take-a-break",
  // Primary-school types (already supported by the renderer)
  "story-time","draw-it","sort-it","match-it","fill-the-gap","spot-the-mistake","number-talk",
  // ── Phase 1: section divider (item 6) ───────────────────────────────
  "section-divider",
  // ── Phase 2: classroom-action slide types (items 28–33) ─────────────
  "cold-call","live-model","do-now","choose-your-task","stuck-help","homework",
]);

const SlideContentSchema = z.object({
  type: SlideTypeEnum,
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  /** Title-slide layout variant — used only when type === "title". */
  titleVariant: z.enum(["centered","split-image","asymmetric","module-divider"]).optional(),
  bullets: z.array(z.string().min(1).max(500)).max(10).optional(),
  body: z.string().max(2000).optional(),
  terms: z.array(z.object({ term: z.string().min(1), definition: z.string().min(1) })).max(20).optional(),
  question: z.string().max(1000).optional(),
  options: z.array(z.string().min(1)).max(6).optional(),
  answer: z.string().max(500).optional(),
  steps: z.array(z.string().min(1)).max(12).optional(),
  misconception: z.string().max(500).optional(),
  correction: z.string().max(500).optional(),
  retrievalQuestions: z.array(z.string().min(1)).max(8).optional(),
  realWorldContext: z.string().max(1000).optional(),
  examTip: z.string().max(500).optional(),
  markSchemeHint: z.string().max(500).optional(),
  diagramDescription: z.string().max(500).optional(),
  diagramLabels: z.array(z.string().min(1)).max(20).optional(),
  diagram: z.object({
    kind: z.enum(["flowchart", "venn", "timeline", "circuit", "cell", "water-cycle", "food-chain", "equation-graph", "labelled-box", "cycle"]),
    title: z.string().max(120).optional(),
    nodes: z.array(z.object({
      id: z.string().max(40),
      label: z.string().max(100),
      group: z.string().max(40).optional(),
      x: z.number().optional(),
      y: z.number().optional(),
    })).max(20),
    edges: z.array(z.object({
      from: z.string().max(40),
      to: z.string().max(40),
      label: z.string().max(80).optional(),
      style: z.enum(["arrow", "line", "dashed"]).optional(),
    })).max(30).optional(),
    sets: z.array(z.object({
      label: z.string().max(80),
      items: z.array(z.string().max(80)).max(10),
    })).max(4).optional(),
    equation: z.string().max(200).optional(),
  }).optional(),
  image_prompt: z.string().max(500).optional(),
  /** Phase 4 — resolved stock-image record (see shared/aiSchemas.ts). */
  image: z.object({
    url: z.string().min(1).max(2000),
    thumbUrl: z.string().max(2000).optional(),
    width: z.number().int().min(1).max(20000).optional(),
    height: z.number().int().min(1).max(20000).optional(),
    source: z.enum(["pexels", "unsplash", "openverse", "wikimedia", "manual"]).optional(),
    photographer: z.string().max(200).optional(),
    photographerUrl: z.string().max(500).optional(),
    sourceUrl: z.string().max(2000).optional(),
    attribution: z.string().max(300).optional(),
    licence: z.string().max(200).optional(),
    resolvedAt: z.string().max(40).optional(),
  }).optional(),
  layout: z.enum(["full","two-col","image-right","image-left","centered","bullet-list","hero-number","definition","process","quote-block",
    // ── Phase 1: 7 new layouts ────────────────────────────────────────
    "split-stat","comparison-table","timeline-horizontal","card-grid","before-after","quote-portrait","diagram-callouts",
  ]).optional(),
  bulletsRight: z.array(z.string().min(1).max(500)).max(6).optional(),
  headline: z.string().max(200).optional(),
  quote: z.string().max(600).optional(),
  attribution: z.string().max(200).optional(),
  accent: z.string().max(50).optional(),
  speakerNotes: z.string().max(2000).optional(),

  // ── Phase 1 layout-specific fields (all optional, used when layout matches) ──
  /** comparison-table rows: each row is {label, left, right}. */
  compareRows: z.array(z.object({
    label: z.string().max(80).optional(),
    left: z.string().min(1).max(240),
    right: z.string().min(1).max(240),
  })).max(8).optional(),
  /** comparison-table headers ["A","B"] — defaults to ["Before","After"]. */
  compareHeaders: z.tuple([z.string().max(60), z.string().max(60)]).optional(),
  /** timeline-horizontal events. */
  timelineEvents: z.array(z.object({
    date: z.string().min(1).max(40),
    title: z.string().min(1).max(80),
    description: z.string().max(160).optional(),
  })).max(8).optional(),
  /** card-grid items (rendered as a 2×3 grid). */
  cards: z.array(z.object({
    title: z.string().min(1).max(80),
    body: z.string().min(1).max(220),
    icon: z.string().max(40).optional(),
  })).max(6).optional(),
  /** before-after two-block compare — populates a contrasting pair. */
  beforeAfter: z.object({
    before: z.string().min(1).max(500),
    after: z.string().min(1).max(500),
    beforeLabel: z.string().max(40).optional(),
    afterLabel: z.string().max(40).optional(),
  }).optional(),
  /** diagram-callouts: positioned labels around a central diagram. */
  diagramCallouts: z.array(z.object({
    label: z.string().min(1).max(80),
    position: z.enum(["top-left","top","top-right","right","bottom-right","bottom","bottom-left","left"]),
    description: z.string().max(160).optional(),
  })).max(8).optional(),

  // ── Phase 2 classroom-action slide-type fields ─────────────────────────────
  /** cold-call: the prompt teacher reads + an optional cue for the named pupil. */
  coldCallCue: z.string().max(300).optional(),
  namedPupilHint: z.string().max(120).optional(),
  /** live-model: explicit I-do / We-do / You-do progression. */
  liveModel: z.object({
    iDo: z.string().min(1).max(500),
    weDo: z.string().min(1).max(500),
    youDo: z.string().min(1).max(500),
  }).optional(),
  /** stuck-help: escalating hint ladder + final answer (revealed last). */
  hintLadder: z.array(z.string().min(1).max(240)).max(5).optional(),
  finalAnswer: z.string().max(500).optional(),
  /** homework: brief, link, due date, estimated minutes. */
  homeworkBrief: z.string().max(500).optional(),
  homeworkDueDate: z.string().max(40).optional(),
  homeworkMinutes: z.number().int().min(1).max(180).optional(),
  homeworkLink: z.string().max(400).optional(),

  // ── Teacher-framework content fields ───────────────────────────────────────
  /** Timing chip shown top-right. "5" becomes "⏱ 5 min". */
  timingMinutes: z.number().int().min(1).max(60).optional(),
  /** Learning-objectives banding (must/should/could). */
  successCriteria: z.object({
    must: z.string().max(300),
    should: z.string().max(300),
    could: z.string().max(300),
  }).optional(),
  /** Structured worked example — renders as a bordered box with distinct steps. */
  workedExampleBox: z.object({
    problem: z.string().max(500),
    steps: z.array(z.string().min(1).max(300)).min(1).max(8),
    answer: z.string().max(300),
    units: z.string().max(50).optional(),
    commonError: z.string().max(300).optional(),
  }).optional(),
  /** Full vocabulary reference table (vocab-reference slide). */
  vocabTable: z.array(z.object({
    term: z.string().min(1).max(80),
    definition: z.string().min(1).max(240),
    example: z.string().max(200).optional(),
  })).max(16).optional(),
  /** Mark-scheme annotations for model-answer slides. */
  markScheme: z.array(z.object({
    point: z.string().min(1).max(300),
    marks: z.number().int().min(1).max(10),
  })).max(12).optional(),
  /** Exam-practice question structure. */
  examQuestion: z.object({
    stem: z.string().max(1000),
    marks: z.number().int().min(1).max(30),
    timeMins: z.number().int().min(1).max(60).optional(),
    commandWord: z.string().max(40).optional(),
  }).optional(),
  /** Per-slide differentiation variants. */
  differentiation: z.object({
    support: z.string().max(500).optional(),
    core: z.string().max(500).optional(),
    extension: z.string().max(500).optional(),
  }).optional(),

  // ── SEND-structured fields (rendered as distinct boxes) ────────────────────
  /** ASC / Asperger "What you need to do:" box (numbered steps). */
  whatYouNeedToDo: z.array(z.string().min(1).max(200)).max(8).optional(),
  /** SLCN / EAL / MLD word bank shown at the top of the slide. */
  wordBank: z.array(z.object({
    term: z.string().min(1).max(60),
    definition: z.string().min(1).max(200),
  })).max(8).optional(),
  /** SLCN / Dyslexia sentence starter shown underneath a question. */
  sentenceStarter: z.string().max(200).optional(),
  /** SLCN / MLD "The answer is ___ because ___" answer frame. */
  answerFrame: z.string().max(200).optional(),
  /** Dyslexia / Dyscalculia method reference steps. */
  methodSteps: z.array(z.string().min(1).max(200)).max(8).optional(),
  /** MLD help-box key facts (formulas, number bonds, reminders). */
  helpBox: z.array(z.string().min(1).max(200)).max(8).optional(),
  /** ASC / Tourette's completion checklist (renders as tick boxes). */
  completionChecklist: z.array(z.string().min(1).max(200)).max(8).optional(),
  /** SLCN / EAL visual-cue label (arrow, icon, diagram reference). */
  visualCue: z.string().max(200).optional(),
  /** PDA / Anxiety label override — "BONUS", "Secret Mission", "Optional". */
  bonusLabel: z.string().max(60).optional(),
  /** ADHD bolded action verb surfaced at the top of activity slides. */
  actionVerb: z.string().max(40).optional(),
  /** ADHD visible-checkbox flag (render `[ ]` in front of every bullet). */
  visibleCheckboxes: z.boolean().optional(),
});

const PresentationDataSchema = z.object({
  title: z.string().min(1).max(300),
  subject: z.string().min(1).max(100),
  yearGroup: z.string().min(1).max(50),
  topic: z.string().min(1).max(300),
  slides: z.array(SlideContentSchema).min(1).max(40),
  theme: z.string().max(50).optional().default("navy"),
  totalSlides: z.number().int().min(1).max(40).optional(),
});

// ─── Types ───────────────────────────────────────────────────────────────────
export type SlideType = z.infer<typeof SlideTypeEnum>;

export interface SlideContent {
  type: SlideType;
  title: string;
  subtitle?: string;
  titleVariant?: "centered" | "split-image" | "asymmetric" | "module-divider";
  bullets?: string[];
  body?: string;
  terms?: { term: string; definition: string }[];
  question?: string;
  options?: string[];
  answer?: string;
  steps?: string[];
  // Misconception-bust fields
  misconception?: string;
  correction?: string;
  // Retrieval warm-up fields
  retrievalQuestions?: string[];
  // Real-world link fields
  realWorldContext?: string;
  // Exam technique fields
  examTip?: string;
  markSchemeHint?: string;
  // Diagram label fields
  diagramDescription?: string;
  diagramLabels?: string[];
  diagram?: {
    kind: "flowchart" | "venn" | "timeline" | "circuit" | "cell" | "water-cycle" | "food-chain" | "equation-graph" | "labelled-box" | "cycle";
    title?: string;
    nodes: Array<{ id: string; label: string; group?: string; x?: number; y?: number }>;
    edges?: Array<{ from: string; to: string; label?: string; style?: "arrow" | "line" | "dashed" }>;
    sets?: Array<{ label: string; items: string[] }>;
    equation?: string;
  };
  image_prompt?: string;
  /**
   * Phase 4 — resolved stock-image record. Populated by the server image
   * proxy after the AI returns `image_prompt`. The renderer prefers this
   * over the legacy `source.unsplash.com` shortcut so the same picture
   * lands in every export and the licence travels with the slide JSON.
   */
  image?: {
    url: string;
    thumbUrl?: string;
    width?: number;
    height?: number;
    source?: "pexels" | "unsplash" | "openverse" | "wikimedia" | "manual";
    photographer?: string;
    photographerUrl?: string;
    sourceUrl?: string;
    attribution?: string;
    licence?: string;
    resolvedAt?: string;
  };
  layout?: "full" | "two-col" | "image-right" | "image-left" | "centered" | "bullet-list" | "hero-number" | "definition" | "process" | "quote-block"
    | "split-stat" | "comparison-table" | "timeline-horizontal" | "card-grid" | "before-after" | "quote-portrait" | "diagram-callouts";
  bulletsRight?: string[];
  headline?: string;
  quote?: string;
  attribution?: string;
  accent?: string;
  speakerNotes?: string;

  // Phase 1 layout-specific fields
  compareRows?: { label?: string; left: string; right: string }[];
  compareHeaders?: [string, string];
  timelineEvents?: { date: string; title: string; description?: string }[];
  cards?: { title: string; body: string; icon?: string }[];
  beforeAfter?: { before: string; after: string; beforeLabel?: string; afterLabel?: string };
  diagramCallouts?: { label: string; position: "top-left"|"top"|"top-right"|"right"|"bottom-right"|"bottom"|"bottom-left"|"left"; description?: string }[];

  // Phase 2 classroom-action slide-type fields
  coldCallCue?: string;
  namedPupilHint?: string;
  liveModel?: { iDo: string; weDo: string; youDo: string };
  hintLadder?: string[];
  finalAnswer?: string;
  homeworkBrief?: string;
  homeworkDueDate?: string;
  homeworkMinutes?: number;
  homeworkLink?: string;

  // Teacher-framework content fields
  timingMinutes?: number;
  successCriteria?: { must: string; should: string; could: string };
  workedExampleBox?: {
    problem: string;
    steps: string[];
    answer: string;
    units?: string;
    commonError?: string;
  };
  vocabTable?: { term: string; definition: string; example?: string }[];
  markScheme?: { point: string; marks: number }[];
  examQuestion?: { stem: string; marks: number; timeMins?: number; commandWord?: string };
  differentiation?: { support?: string; core?: string; extension?: string };

  // SEND-structured fields
  whatYouNeedToDo?: string[];
  wordBank?: { term: string; definition: string }[];
  sentenceStarter?: string;
  answerFrame?: string;
  methodSteps?: string[];
  helpBox?: string[];
  completionChecklist?: string[];
  visualCue?: string;
  bonusLabel?: string;
  actionVerb?: string;
  visibleCheckboxes?: boolean;
}

export interface PresentationData {
  title: string;
  subject: string;
  yearGroup: string;
  topic: string;
  slides: SlideContent[];
  theme: string;
  totalSlides: number;
}

// ─── Themes ──────────────────────────────────────────────────────────────────
const THEMES = {
  navy: {
    name: "Royal Navy",
    primary: "#1B2A4A",
    secondary: "#2563EB",
    accent: "#F59E0B",
    bg: "#FFFFFF",
    text: "#1e293b",
    light: "#EFF6FF",
    gradient: "linear-gradient(135deg, #1B2A4A 0%, #2563EB 100%)",
  },
  emerald: {
    name: "Emerald",
    primary: "#065F46",
    secondary: "#10B981",
    accent: "#F59E0B",
    bg: "#FFFFFF",
    text: "#1e293b",
    light: "#ECFDF5",
    gradient: "linear-gradient(135deg, #065F46 0%, #10B981 100%)",
  },
  purple: {
    name: "Purple",
    primary: "#4C1D95",
    secondary: "#7C3AED",
    accent: "#F59E0B",
    bg: "#FFFFFF",
    text: "#1e293b",
    light: "#F5F3FF",
    gradient: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)",
  },
  slate: {
    name: "Slate",
    primary: "#0F172A",
    secondary: "#475569",
    accent: "#3B82F6",
    bg: "#FFFFFF",
    text: "#1e293b",
    light: "#F1F5F9",
    gradient: "linear-gradient(135deg, #0F172A 0%, #475569 100%)",
  },
  rose: {
    name: "Rose",
    primary: "#881337",
    secondary: "#E11D48",
    accent: "#F59E0B",
    bg: "#FFFFFF",
    text: "#1e293b",
    light: "#FFF1F2",
    gradient: "linear-gradient(135deg, #881337 0%, #E11D48 100%)",
  },
  teal: {
    name: "Teal",
    primary: "#134E4A",
    secondary: "#0D9488",
    accent: "#F59E0B",
    bg: "#FFFFFF",
    text: "#1e293b",
    light: "#F0FDFA",
    gradient: "linear-gradient(135deg, #134E4A 0%, #0D9488 100%)",
  },
  rainbow: {
    name: "Rainbow (Primary)",
    primary: "#7C3AED",
    secondary: "#EC4899",
    accent: "#F59E0B",
    bg: "#FFFBF0",
    text: "#1e293b",
    light: "#FDF4FF",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F59E0B 100%)",
  },
  midnight: {
    name: "Midnight (Dark)",
    primary: "#E2E8F0",
    secondary: "#818CF8",
    accent: "#F472B6",
    bg: "#0F172A",
    text: "#CBD5E1",
    light: "#1E293B",
    gradient: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
  },
  coral: {
    name: "Coral Sunset",
    primary: "#9A3412",
    secondary: "#EA580C",
    accent: "#FBBF24",
    bg: "#FFFFFF",
    text: "#1c1917",
    light: "#FFF7ED",
    gradient: "linear-gradient(135deg, #9A3412 0%, #EA580C 60%, #FBBF24 100%)",
  },
  ocean: {
    name: "Ocean Blue",
    primary: "#0C4A6E",
    secondary: "#0284C7",
    accent: "#38BDF8",
    bg: "#FFFFFF",
    text: "#0c4a6e",
    light: "#F0F9FF",
    gradient: "linear-gradient(135deg, #0C4A6E 0%, #0284C7 60%, #38BDF8 100%)",
  },
  // ── Phase-1 dark themes ───────────────────────────────────────────────
  // Three additional dark variants so secondary teachers don't all converge
  // on `midnight`. Each pairs a true-dark background with one strong accent
  // so on-screen contrast is still WCAG-AA-friendly. The PPTX export reads
  // `bg` directly and dark-detect logic at line ~2670 flips body text to
  // light grey when bg < #3C3C3C, so these slot in without further work.
  "studio-dark": {
    name: "Studio Dark",
    primary: "#F8FAFC",
    secondary: "#22D3EE",
    accent: "#FB7185",
    bg: "#0B1220",
    text: "#E2E8F0",
    light: "#1E293B",
    gradient: "linear-gradient(135deg, #0B1220 0%, #1E3A8A 100%)",
  },
  "slate-mono": {
    name: "Slate Mono",
    primary: "#F1F5F9",
    secondary: "#94A3B8",
    accent: "#FACC15",
    bg: "#111827",
    text: "#CBD5E1",
    light: "#1F2937",
    gradient: "linear-gradient(135deg, #111827 0%, #374151 100%)",
  },
  editorial: {
    name: "Editorial",
    primary: "#FDF2F8",
    secondary: "#F472B6",
    accent: "#FBBF24",
    bg: "#1E1B2E",
    text: "#E9D5FF",
    light: "#2D2640",
    gradient: "linear-gradient(135deg, #1E1B2E 0%, #4C1D95 100%)",
  },
  "forest-dark": {
    name: "Forest Dark",
    primary: "#ECFDF5",
    secondary: "#34D399",
    accent: "#FBBF24",
    bg: "#0A1F14",
    text: "#D1FAE5",
    light: "#13301F",
    gradient: "linear-gradient(135deg, #0A1F14 0%, #064E3B 100%)",
  },
};
type ThemeKey = keyof typeof THEMES;

// ─── SEND-aware theme composer ───────────────────────────────────────────────
// Layers SEND-driven overrides on top of the teacher-chosen base theme. This
// is the single function both FullSlideView and exportToPptx call when
// rendering, so the preview and the exported .pptx always match.
//
// The stricter access requirement wins when multiple needs disagree (e.g. if
// both Dyslexia and VI are selected, VI's high-contrast rules take priority
// because removing the visual-access barrier is the more urgent constraint).
export interface ComposedTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
  light: string;
  gradient: string;
  /** Font to use for body text — overrides the default. */
  fontFamily?: string;
  /** Min body font size in pt (for PPTX export). */
  minBodyPt?: number;
  /** Min title font size in pt (for PPTX export). */
  minTitlePt?: number;
  /** Line-height multiplier for on-screen. */
  lineHeight?: number;
  /** True when a SEND need imposes high-contrast mode. */
  highContrast?: boolean;
  /** True when red alarm colours are banned (substitute with amber). */
  banAlarmRed?: boolean;
  /** True when activity/challenge slides should use invitational labels. */
  invitationalLabels?: boolean;
  /** List of applied SEND spec names for the "adaptations applied" banner. */
  appliedSendNames: string[];
}

export function composeTheme(
  baseKey: ThemeKey,
  sendNeeds: string[] | string | null | undefined,
  subjectForAuto?: string,
): ComposedTheme {
  // ── "subject-auto" — use the active subject's palette + font ────────────
  // Resolves the subject profile (via the same helper the prompt builder
  // uses) and synthesises a base theme on the fly so every Chemistry deck
  // looks like Chemistry, every History deck like History, etc. The SEND
  // override pass below still runs and can clobber any of these values.
  let base: typeof THEMES[ThemeKey];
  if (baseKey === ("subject-auto" as ThemeKey) && subjectForAuto) {
    const sp = getSubjectProfile(subjectForAuto);
    if (sp) {
      const p = sp.palette;
      base = {
        name: `${sp.label} Auto`,
        primary: `#${p.darkBg}`,
        secondary: `#${p.accent1}`,
        accent: `#${p.accent2}`,
        bg: `#${p.lightBg}`,
        text: "#1e293b",
        light: `#${p.lightBg}`,
        gradient: `linear-gradient(135deg, #${p.darkBg} 0%, #${p.accent1} 100%)`,
      };
    } else {
      base = THEMES.navy;
    }
  } else {
    base = THEMES[baseKey] || THEMES.navy;
  }
  const override = getSendThemeOverride(sendNeeds);
  const applied = resolveSendSpecs(sendNeeds).map(s => s.name);

  // Start from the base theme and layer SEND overrides on top.
  let primary = base.primary;
  let secondary = base.secondary;
  let accent = base.accent;
  let bg = base.bg;
  let text = base.text;
  let light = base.light;
  let gradient = base.gradient;

  // Dyslexia: cream background + dark text for BDA readability.
  if (override.bg) bg = override.bg;
  if (override.text) text = override.text;

  // VI high-contrast: black-on-white regardless of base theme. Also widen the
  // `light` container so it doesn't wash out text.
  if (override.highContrast) {
    bg = "#FFFFFF";
    text = "#000000";
    light = "#F4F4F4";
    // Force the primary/secondary to very dark for the header bars/titles
    primary = "#0A0A0A";
    secondary = "#1F2937";
    gradient = "linear-gradient(135deg, #0A0A0A 0%, #1F2937 100%)";
  }

  // Anxiety / PDA / Tourette's soft palette: replace any red accent with amber.
  if (override.banAlarmRed) {
    if (/^#?[eE][0-9a-fA-F]{2}[0-9a-fA-F][0-9a-fA-F]/.test(accent) || accent.toLowerCase().startsWith("#e11d48") || accent.toLowerCase().startsWith("#dc2626")) {
      accent = "#F59E0B";
    }
  }
  if (override.softPalette) {
    // Push primary towards its lighter sibling if it's currently a strong red.
    if (primary.toLowerCase() === "#881337" || primary.toLowerCase() === "#dc2626") {
      primary = "#7C3AED";
      gradient = "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)";
    }
  }

  return {
    name: base.name,
    primary,
    secondary,
    accent,
    bg,
    text,
    light,
    gradient,
    fontFamily: override.fontFamily,
    minBodyPt: override.minBodyPt,
    minTitlePt: override.minTitlePt,
    lineHeight: override.lineHeight,
    highContrast: override.highContrast,
    banAlarmRed: override.banAlarmRed,
    invitationalLabels: override.invitationalLabels,
    appliedSendNames: applied,
  };
}

// Build the PPTX font-family string pptxgenjs accepts.
function themeFontFamily(theme: ComposedTheme): string {
  return theme.fontFamily || "Calibri";
}

// ─── Subject-aware fonts ─────────────────────────────────────────────────────
// SEND theme overrides win first (Verdana for Dyslexia, Arial for VI).
// Otherwise STEM gets a clean sans, humanities a serif, and CPD a display
// face. Returns a font face PPTX & most browsers will resolve.
function getSubjectFontFamily(subject: string | undefined): string {
  if (!subject) return "Calibri";
  const s = subject.toLowerCase();
  if (/staff|cpd|training/.test(s))                                                       return "Georgia";
  if (/maths|mathematics|physics|chemistry|biology|science|computer|technology/.test(s))  return "Inter";
  if (/english|history|religious|sociology|psychology|philosophy|media|film/.test(s))     return "Source Serif Pro";
  if (/art|design|drama|music/.test(s))                                                   return "Source Serif Pro";
  return "Inter";
}

/**
 * Resolve the active font family taking SEND, theme and subject into account.
 * SEND > theme.fontFamily > subject-aware > Calibri.
 */
function resolveActiveFont(theme: ComposedTheme, subject: string | undefined): string {
  if (theme.fontFamily) return theme.fontFamily;
  return getSubjectFontFamily(subject);
}

// ─── Inline-text rich rendering (items 12 + 13) ──────────────────────────────
// Renders a string with inline:
//   `code`      → mono chip with tinted background
//   $maths$     → Consolas span (Maths-friendly)
//   [icon:name] → leading emoji (icon registry below)
// Backwards-compatible: plain strings render unchanged.
const INLINE_ICONS: Record<string, string> = {
  warning: "⚠️", note: "📝", check: "✅", cross: "❌",
  star: "⭐", lightbulb: "💡", bookmark: "🔖", search: "🔍",
  flask: "🧪", atom: "⚛️", math: "🧮", clock: "⏱",
  globe: "🌍", rocket: "🚀", brain: "🧠", target: "🎯",
};
function richText(text: string, key?: number | string): React.ReactNode {
  if (!text) return null;
  // Strip leading icon token: "[icon:warning] do this carefully"
  let leadingIcon: string | null = null;
  const iconMatch = text.match(/^\s*\[icon:([a-z-]+)\]\s*/i);
  if (iconMatch && INLINE_ICONS[iconMatch[1].toLowerCase()]) {
    leadingIcon = INLINE_ICONS[iconMatch[1].toLowerCase()];
    text = text.replace(iconMatch[0], "");
  }
  // Tokenise: split by `code` and $math$ markers, preserving them.
  const parts: Array<{ kind: "text" | "code" | "math"; v: string }> = [];
  const re = /(`[^`]+`|\$[^$\n]+\$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ kind: "text", v: text.slice(last, m.index) });
    if (m[0].startsWith("`")) parts.push({ kind: "code", v: m[0].slice(1, -1) });
    else parts.push({ kind: "math", v: m[0].slice(1, -1) });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", v: text.slice(last) });
  return (
    <span key={key}>
      {leadingIcon && <span aria-hidden style={{ marginRight: 4 }}>{leadingIcon}</span>}
      {parts.map((p, i) => {
        if (p.kind === "code") return <code key={i} className="px-1 py-0.5 rounded bg-slate-100 text-slate-900 font-mono text-[0.92em]">{p.v}</code>;
        if (p.kind === "math") return <span key={i} className="px-1 py-0.5 rounded bg-blue-50 text-blue-900 font-mono text-[0.95em]">{p.v}</span>;
        return <span key={i}>{p.v}</span>;
      })}
    </span>
  );
}

// ─── Subject-mascot per primary slide (item 16) ─────────────────────────────
function getSubjectMascot(subject: string | undefined): string {
  const s = (subject || "").toLowerCase();
  if (/maths|mathematics/.test(s))             return "🧮";
  if (/biology/.test(s))                        return "🌱";
  if (/chemistry/.test(s))                      return "🧪";
  if (/physics/.test(s))                        return "⚛️";
  if (/science/.test(s))                        return "🔬";
  if (/computer|technology/.test(s))            return "💻";
  if (/history/.test(s))                        return "🏛️";
  if (/geograph/.test(s))                       return "🌍";
  if (/english|literature|language/.test(s))    return "📖";
  if (/french|spanish|german|mfl/.test(s))      return "🗣️";
  if (/art|design/.test(s))                     return "🎨";
  if (/drama|theatre/.test(s))                  return "🎭";
  if (/music/.test(s))                          return "🎵";
  if (/physical education|\bpe\b/.test(s))      return "⚽";
  if (/religious|theolog/.test(s))              return "🕊️";
  if (/business|economics/.test(s))             return "💼";
  if (/sociolog/.test(s))                       return "👥";
  if (/psycholog/.test(s))                      return "🧠";
  if (/media/.test(s))                          return "📺";
  if (/pshe/.test(s))                           return "💛";
  return "✨";
}

// ─── Pedagogy badge — Rosenshine + Bloom hint per slide type (item 34) ──────
const SLIDE_TYPE_PEDAGOGY: Record<string, { rosenshine?: string; bloom: string }> = {
  "title":               { bloom: "—" },
  "learning-objectives": { rosenshine: "R1 daily review", bloom: "RECALL" },
  "retrieval-warm-up":   { rosenshine: "R1 daily review",  bloom: "RECALL" },
  "hook":                { bloom: "UNDERSTAND" },
  "key-terms":           { bloom: "UNDERSTAND" },
  "vocab-reference":     { bloom: "RECALL" },
  "content":             { rosenshine: "R3 small steps",   bloom: "UNDERSTAND" },
  "diagram-label":       { bloom: "UNDERSTAND" },
  "worked-example":      { rosenshine: "R4 modelling",     bloom: "APPLY" },
  "live-model":          { rosenshine: "R4 modelling",     bloom: "APPLY" },
  "model-answer":        { rosenshine: "R4 modelling",     bloom: "EVALUATE" },
  "activity":            { rosenshine: "R5 guided practice", bloom: "APPLY" },
  "do-now":              { rosenshine: "R5 guided practice", bloom: "APPLY" },
  "choose-your-task":    { rosenshine: "R5 guided practice", bloom: "APPLY" },
  "pause-and-solve":     { rosenshine: "R7 high success",  bloom: "APPLY" },
  "stuck-help":          { rosenshine: "R8 scaffolding",   bloom: "APPLY" },
  "check-understanding": { rosenshine: "R6 check for understanding", bloom: "ANALYSE" },
  "mini-quiz":           { rosenshine: "R10 weekly review", bloom: "ANALYSE" },
  "cold-call":           { rosenshine: "R6 check for understanding", bloom: "ANALYSE" },
  "misconception-bust":  { bloom: "ANALYSE" },
  "exam-technique":      { bloom: "EVALUATE" },
  "real-world-link":     { bloom: "EVALUATE" },
  "discussion":          { bloom: "EVALUATE" },
  "think-pair-share":    { bloom: "EVALUATE" },
  "exam-practice":       { rosenshine: "R9 independent practice", bloom: "APPLY" },
  "extension":           { bloom: "CREATE" },
  "summary":             { rosenshine: "R10 weekly review", bloom: "RECALL" },
  "exit-ticket":         { rosenshine: "R6 check for understanding", bloom: "RECALL" },
  "homework":            { rosenshine: "R9 independent practice", bloom: "APPLY" },
  "section-divider":     { bloom: "—" },
};

// ─── Slide type icons ────────────────────────────────────────────────────
const SLIDE_ICONS: Record<string, React.ElementType> = {
  "title": Monitor,
  "learning-objectives": Target,
  "hook": Lightbulb,
  "content": BookOpen,
  "key-terms": List,
  "worked-example": Brain,
  "activity": CheckSquare,
  "discussion": HelpCircle,
  "check-understanding": CheckSquare,
  "summary": ArrowRight,
  "exit-ticket": CheckSquare,
  "extension": Plus,
  "retrieval-warm-up": Brain,
  "misconception-bust": Lightbulb,
  "exam-technique": Target,
  "real-world-link": BookOpen,
  "think-pair-share": Users,
  "mini-quiz": CheckSquare,
  "diagram-label": Monitor,
  "pause-and-solve": Brain,
  "spot-the-mistake": AlertCircle,
  "draw-it": Pencil,
  "sort-it": List,
  "match-it": Zap,
  "fill-the-gap": Edit3,
  "story-time": BookOpen,
  "number-talk": Calculator,
  // Teacher-framework additions
  "vocab-reference": List,
  "model-answer": Target,
  "exam-practice": GraduationCap,
  // SEND-native types
  "brain-break": Zap,
  "checkin": HelpCircle,
  "method-steps": List,
  "help-box": BookOpen,
  "word-bank": List,
  "take-a-break": HelpCircle,
  // Phase 1 section divider + Phase 2 classroom actions
  "section-divider": ArrowRight,
  "cold-call": Users,
  "live-model": Brain,
  "do-now": Pencil,
  "choose-your-task": List,
  "stuck-help": HelpCircle,
  "homework": Edit3,
};

// ─── Slide type labels ────────────────────────────────────────────────────
const SLIDE_LABELS: Record<string, string> = {
  "title": "Title Slide",
  "learning-objectives": "Learning Objectives",
  "hook": "Starter / Hook",
  "content": "Main Content",
  "key-terms": "Key Vocabulary",
  "worked-example": "Worked Example",
  "activity": "Activity",
  "discussion": "Discussion",
  "check-understanding": "Check Understanding",
  "summary": "Summary",
  "exit-ticket": "Exit Ticket",
  "extension": "Extension",
  "retrieval-warm-up": "Retrieval Warm-Up",
  "misconception-bust": "Misconception Buster",
  "exam-technique": "Exam Technique",
  "real-world-link": "Real-World Link",
  "think-pair-share": "Think • Pair • Share",
  "mini-quiz": "Mini Quiz",
  "diagram-label": "Diagram & Labels",
  "pause-and-solve": "Pause & Solve",
  "spot-the-mistake": "Spot the Mistake",
  "draw-it": "Draw It!",
  "sort-it": "Sort It!",
  "match-it": "Match It!",
  "fill-the-gap": "Fill the Gap",
  "story-time": "Story Time",
  "number-talk": "Number Talk",
  // Teacher-framework additions
  "vocab-reference": "Key Vocabulary Reference",
  "model-answer": "Model Answer",
  "exam-practice": "Exam Practice",
  // SEND-native types
  "brain-break": "Brain Break",
  "checkin": "Feelings Check-In",
  "method-steps": "Step-by-Step Method",
  "help-box": "Help Box",
  "word-bank": "Word Bank",
  "take-a-break": "Take a Break",
  // Phase 1 section divider + Phase 2 classroom actions
  "section-divider": "Section Divider",
  "cold-call": "Cold Call",
  "live-model": "Live Model (I do · We do · You do)",
  "do-now": "Do Now (Starter)",
  "choose-your-task": "Choose Your Task",
  "stuck-help": "Stuck? Hint Ladder",
  "homework": "Homework",
};

// ─── Subject options ──────────────────────────────────────────────────────────
const SUBJECTS = [
  "English", "Mathematics", "Science", "Biology", "Chemistry", "Physics",
  "History", "Geography", "Religious Studies", "PSHE", "Art & Design",
  "Design Technology", "Music", "Drama", "Physical Education",
  "Computer Science", "Modern Foreign Languages", "Business Studies",
  "Economics", "Psychology", "Sociology", "Media Studies", "Film Studies",
  "Philosophy", "Health & Social Care", "Law", "Politics", "Other",
];

const YEAR_GROUPS = [
  "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6",
  "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13",
  "Mixed / All Years",
];

const SLIDE_COUNTS = ["18", "20", "15", "12", "10", "8"];

// ─── SEND needs — canonical ids grouped by COBS / SEND Code of Practice ─────
// The ids match client/src/lib/sendPromptFragments.ts so the prompt builder
// and the UI speak the same language. "asperger" is routed separately from
// "asc" so teachers can pick either.
const SEND_CATEGORIES: Array<{
  label: string;
  needs: Array<{ id: string; label: string; blurb: string }>;
}> = [
  {
    label: "Communication & Interaction",
    needs: [
      { id: "asc",       label: "Autism Spectrum Condition (ASC)", blurb: "Literal language, 'what you need to do' boxes, neutral contexts" },
      { id: "asperger",  label: "Asperger Syndrome",               blurb: "Literal, predictable layout, interest-based contexts permitted" },
      { id: "slcn",      label: "Speech, Language & Communication (SLCN)", blurb: "Word banks, sentence frames, visual cues, S-V-O sentences" },
      { id: "pda-odd",   label: "PDA / ODD",                       blurb: "Invitational language, optional missions, natural break points" },
    ],
  },
  {
    label: "Cognition & Learning",
    needs: [
      { id: "dyslexia",    label: "Dyslexia",        blurb: "Cream background, max 12 words/sentence, 1.5× spacing, method steps" },
      { id: "dyscalculia", label: "Dyscalculia",     blurb: "Sub-step blanks, key-facts slide, number-line reference, real-world contexts" },
      { id: "mld",         label: "Moderate Learning Difficulties (MLD)", blurb: "Model-answer first, help-box, KS2 reading level, CPA progression" },
    ],
  },
  {
    label: "Social, Emotional & Mental Health",
    needs: [
      { id: "adhd",      label: "ADHD",                   blurb: "Visible checkboxes, bolded action verbs, brain-break slide, varied formats" },
      { id: "anxiety",   label: "Anxiety / SEMH",         blurb: "Emoji check-ins, invitational language, softer palette, no red alarms" },
      { id: "tourettes", label: "Tourette's Syndrome",    blurb: "Varied response formats, take-a-break slides, calm supportive tone" },
    ],
  },
  {
    label: "Sensory & Physical",
    needs: [
      { id: "vi",        label: "Visual Impairment",      blurb: "High-contrast, 24pt+ body, 40pt+ titles, text-described diagrams" },
      { id: "hi",        label: "Hearing Impairment",     blurb: "Every slide self-contained, no listening tasks, visual supports" },
      { id: "dyspraxia", label: "Dyspraxia / DCD",        blurb: "Structured response frames, MCQ/matching, no extended writing" },
    ],
  },
  {
    label: "Language & Access",
    needs: [
      { id: "eal",             label: "EAL",                              blurb: "Key vocabulary, plain-English definitions, culturally neutral contexts" },
      { id: "older-learners",  label: "Older Learners (KS3/KS4/KS5)",     blurb: "Graphic organisers, Cornell notes, study tips, age-appropriate language" },
    ],
  },
];

// Flat list of all SEND need ids (used for validation).
const SEND_ALL_IDS = SEND_CATEGORIES.flatMap(c => c.needs.map(n => n.id));

/** Reusable multi-select chip group used by both the generate form and the
 *  Adapt-for-SEND dialog. Free-form — any combination of chips can be
 *  selected; there is no pupil-linking. Designed to be visually compact so
 *  it fits in the narrow left-hand form panel. */
function SendNeedsPicker({
  selectedIds,
  onChange,
  notes,
  onNotesChange,
  compact = false,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  notes?: string;
  onNotesChange?: (v: string) => void;
  compact?: boolean;
}) {
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      {SEND_CATEGORIES.map(cat => (
        <div key={cat.label} className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{cat.label}</div>
          <div className="flex flex-wrap gap-1">
            {cat.needs.map(n => {
              const on = selectedIds.includes(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => toggle(n.id)}
                  title={n.blurb}
                  className={`text-[10px] leading-tight rounded-full border transition-all px-2 py-1 text-left ${
                    on
                      ? "bg-purple-600 text-white border-purple-600 shadow"
                      : "bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                  }`}
                >
                  <span className="font-semibold">{n.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!compact && onNotesChange && (
        <div className="pt-1">
          <Label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Extra context (free text, optional)</Label>
          <Textarea
            value={notes || ""}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="e.g. 3 pupils — one needs enlarged print, one uses a laptop..."
            className="text-xs resize-none h-14 mt-1"
          />
        </div>
      )}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          <div className="text-[10px] text-gray-500">{selectedIds.length} need{selectedIds.length > 1 ? "s" : ""} selected</div>
          <button type="button" onClick={() => onChange([])} className="text-[10px] text-gray-400 hover:text-red-600 underline">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

/** Banner shown above the deck preview listing every applied SEND adaptation
 *  with an expandable per-spec rule list. Each change bullet has a "why"
 *  popover revealing the evidence-based rationale from the COBS handbook /
 *  SEND Code of Practice. This is the audit trail teachers surface when
 *  parents, SENCOs or Ofsted ask "why did you adapt it this way?". */
function SendAppliedBanner({ sendNeedIds }: { sendNeedIds: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const applied = getAppliedAdaptations(sendNeedIds);
  if (!applied.length) return null;
  const totalChanges = applied.reduce((sum, a) => sum + a.changes.length, 0);

  return (
    <div className="rounded-lg border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-purple-100/50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap text-left">
          <span className="px-2 py-0.5 bg-purple-700 text-white text-[10px] font-bold uppercase tracking-wide rounded">
            SEND Adapted
          </span>
          <span className="text-sm font-semibold text-purple-900">
            {applied.map(a => a.name).join(" + ")}
          </span>
          <span className="text-xs text-purple-600">
            ({totalChanges} change{totalChanges !== 1 ? "s" : ""} applied)
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-purple-600 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-purple-200 bg-white/40">
          {applied.map(spec => (
            <div key={spec.id} className="rounded bg-white border border-purple-200 p-2">
              <div className="text-[11px] font-bold text-purple-900 mb-1">{spec.name}</div>
              <ul className="space-y-1">
                {spec.changes.map((c, i) => (
                  <li key={i} className="text-[11px] text-gray-700 flex items-start gap-2" title={c.why}>
                    <span className="text-purple-400 flex-shrink-0 mt-0.5">✦</span>
                    <div>
                      <span>{c.what}</span>
                      <span className="text-gray-500 italic"> — {c.why}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="text-[10px] text-purple-700 italic pt-1">
            Rationale drawn from the UK SEND Code of Practice and COBS handbook.
            The academic rigour of the lesson is unchanged — only HOW content is presented.
          </div>
        </div>
      )}
    </div>
  );
}

const EXAM_BOARDS = [
  { value: "none", label: "Not applicable" },
  { value: "AQA", label: "AQA" },
  { value: "Edexcel", label: "Edexcel / Pearson" },
  { value: "OCR", label: "OCR" },
  { value: "WJEC", label: "WJEC / Eduqas" },
  { value: "CIE", label: "Cambridge (CIE)" },
  { value: "SQA", label: "SQA (Scotland)" },
];

// Reading age → label mapping
const READING_AGE_LABELS: Record<number, string> = {
  5:  "Age 5–6 (Reception/Y1)",
  6:  "Age 6–7 (Year 1–2)",
  7:  "Age 7–8 (Year 2–3)",
  8:  "Age 8–9 (Year 3–4)",
  9:  "Age 9–10 (Year 4–5)",
  10: "Age 10–11 (Year 5–6)",
  11: "Age 11–12 (Year 7)",
  12: "Age 12–13 (Year 8)",
  13: "Age 13–14 (Year 9)",
  14: "Age 14–15 (Year 10)",
  15: "Age 15–16 (Year 11)",
  16: "Age 16+ (Sixth Form)",
};

const LESSON_TYPES = [
  { value: "introduction", label: "Introduction to Topic" },
  { value: "deepdive", label: "Deep Dive / Exploration" },
  { value: "revision", label: "Revision Lesson" },
  { value: "exam-prep", label: "Exam Preparation" },
  { value: "practical", label: "Practical / Activity-Based" },
  { value: "discussion", label: "Discussion / Debate" },
  { value: "assessment", label: "Assessment / Review" },
];

// ─── AI Prompt Builder ────────────────────────────────────────────────────────
// Pedagogy engine: builds a structured slide plan then generates content.
// Follows Bloom's taxonomy progression and Rosenshine's Principles.

/** Maps slide count to a structured teaching flow plan */
function buildSlidePlan(slideCount: number, lessonType: string, yearGroup?: string): string[] {
  const isPrimary = /year [1-6]|ks1|ks2|reception/i.test(yearGroup || "");

  if (isPrimary) {
    // Primary school slide plan — activity-based, colourful, child-friendly
    const primaryCore = [
      "title",
      "learning-objectives",
      "hook",
      "key-terms",
      "story-time",
      "worked-example",
      "exit-ticket",
    ];
    const primaryFillers: Record<string, string[]> = {
      introduction:   ["hook", "story-time", "draw-it", "fill-the-gap", "think-pair-share", "sort-it", "summary"],
      deepdive:       ["hook", "story-time", "worked-example", "spot-the-mistake", "draw-it", "fill-the-gap", "think-pair-share", "summary"],
      revision:       ["retrieval-warm-up", "fill-the-gap", "spot-the-mistake", "match-it", "sort-it", "mini-quiz", "summary"],
      "exam-prep":    ["worked-example", "fill-the-gap", "spot-the-mistake", "mini-quiz", "think-pair-share", "summary"],
      practical:      ["hook", "story-time", "worked-example", "draw-it", "activity", "think-pair-share", "summary"],
      discussion:     ["hook", "story-time", "think-pair-share", "sort-it", "discussion", "summary"],
      assessment:     ["hook", "fill-the-gap", "spot-the-mistake", "match-it", "mini-quiz", "summary"],
    };
    const fillers = primaryFillers[lessonType] || primaryFillers["introduction"];
    if (slideCount <= 7) return primaryCore.slice(0, slideCount);
    const plan = [...primaryCore];
    let fi = 0;
    while (plan.length < slideCount) {
      plan.splice(plan.length - 1, 0, fillers[fi % fillers.length]);
      fi++;
    }
    return plan.slice(0, slideCount);
  }

  // Secondary school slide plan
  // ─── 18-slide canonical teacher-framework flow ─────────────────────────────
  // When the teacher asks for exactly 18 slides and it's a secondary lesson,
  // emit the full teacher-focused framework plan straight out of the guide:
  //   1 title → 2 starter/retrieval → 3 objectives (must/should/could)
  //   → 4,5 concept1+example → 6,7 concept2+application → 8 concept3
  //   → 9 activity → 10 concept4/extension → 11 worked example → 12 misconception
  //   → 13 visual summary → 14 exam technique → 15 model answer
  //   → 16 exam practice → 17 key vocab → 18 plenary exit ticket
  // This plan is the single biggest driver of "this looks like a real lesson,
  // not a generic deck". Other slide counts still use the flexible plan below.
  if (slideCount === 18) {
    return [
      "title",
      "retrieval-warm-up",
      "learning-objectives",
      "content",            // concept 1 — explanation with key definitions
      "worked-example",     // concept 1 — worked example or deeper explanation
      "content",            // concept 2 — explanation with key definitions
      "activity",           // concept 2 — application or practice task
      "content",            // concept 3 — explanation
      "activity",           // student task — 8-10 minute independent/paired
      "diagram-label",      // concept 4 or extension — visual
      "worked-example",     // worked example or case study
      "misconception-bust", // common misconceptions
      "summary",            // visual summary of concepts so far
      "exam-technique",     // exam technique
      "model-answer",       // model exam answer with annotations
      "exam-practice",      // exam practice question (timed, marked)
      "vocab-reference",    // key vocabulary reference
      "exit-ticket",        // plenary — exit ticket / summary quiz
    ];
  }

  const core = [
    "title",
    "learning-objectives",
    "retrieval-warm-up",
    "key-terms",
    "content",
    "worked-example",
    "exit-ticket",
  ];

  // Filler types chosen based on lesson type and slide count
  const fillerPool: Record<string, string[]> = {
    introduction:   ["hook", "content", "diagram-label", "check-understanding", "discussion", "summary", "pause-and-solve"],
    deepdive:       ["hook", "content", "worked-example", "misconception-bust", "diagram-label", "check-understanding", "pause-and-solve", "summary"],
    revision:       ["retrieval-warm-up", "mini-quiz", "misconception-bust", "exam-technique", "check-understanding", "pause-and-solve", "summary"],
    "exam-prep":    ["exam-technique", "worked-example", "mini-quiz", "misconception-bust", "check-understanding", "pause-and-solve", "summary"],
    practical:      ["hook", "diagram-label", "worked-example", "activity", "check-understanding", "discussion", "summary"],
    discussion:     ["hook", "real-world-link", "discussion", "think-pair-share", "content", "check-understanding", "summary"],
    assessment:     ["hook", "mini-quiz", "check-understanding", "pause-and-solve", "misconception-bust", "summary"],
  };

  const fillers = fillerPool[lessonType] || fillerPool["introduction"];

  if (slideCount <= 7) return core.slice(0, slideCount);

  const plan = [...core];
  let fi = 0;
  while (plan.length < slideCount) {
    const filler = fillers[fi % fillers.length];
    const insertAt = plan.length - 1;
    plan.splice(insertAt, 0, filler);
    fi++;
  }
  return plan.slice(0, slideCount);
}

/** Two-stage image relevance check: returns a search query only if image adds value */
function getImageSearchQuery(slide: { type: string; title: string; topic: string; subject: string }): string | null {
  // Stage 1: Does this slide type benefit from an image?
  const imageWorthyTypes = new Set([
    "title", "hook", "content", "worked-example", "real-world-link",
    "diagram-label", "key-terms", "summary", "activity",
  ]);
  if (!imageWorthyTypes.has(slide.type)) return null;

  // Stage 2: Is the topic concrete enough to find a relevant image?
  const abstractTopics = /introduction|overview|objectives|summary|revision|assessment|general|misc/i;
  if (abstractTopics.test(slide.title) && abstractTopics.test(slide.topic)) return null;

  // Build a specific, relevant search query
  const topicKeyword = slide.topic.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const subjectKeyword = slide.subject.toLowerCase();

  // Subject-specific query refinements
  const refinements: Record<string, string> = {
    physics: "physics science",
    chemistry: "chemistry laboratory",
    biology: "biology nature",
    mathematics: "mathematics geometry",
    history: "historical",
    geography: "geography landscape",
    english: "literature reading",
    "computer science": "technology computing",
  };
  const refinement = refinements[subjectKeyword] || subjectKeyword;

  return `${topicKeyword} ${refinement} education`.slice(0, 80);
}

function applyTemplateBias(basePlan: string[], bias: string[]): string[] {
  if (!bias.length) return basePlan;
  const plan = [...basePlan];
  const locked = new Set([0, 1, Math.max(0, plan.length - 1)]);
  let insertCursor = 2;
  for (const preferred of bias) {
    if (plan.includes(preferred)) continue;
    while (locked.has(insertCursor) && insertCursor < plan.length - 1) insertCursor += 1;
    if (insertCursor >= plan.length - 1) break;
    plan[insertCursor] = preferred;
    insertCursor += 1;
  }
  return plan;
}

// ─── Per-board command-word reference (item 19) ─────────────────────────────
// Authoritative command-word lists per (board, subject-family). The prompt
// builder injects these so model answers and exam-practice questions use the
// board's actual mark-scheme phraseology rather than a generic synonym.
const BOARD_COMMAND_WORDS: Record<string, Record<string, string[]>> = {
  AQA: {
    science:    ["state", "name", "describe", "explain", "calculate", "compare", "evaluate", "predict", "suggest", "justify"],
    mathematics:["work out", "show that", "solve", "prove", "hence", "calculate", "factorise", "simplify", "expand"],
    english:    ["analyse", "evaluate", "compare", "explain", "explore", "infer", "identify"],
    history:    ["describe", "explain", "evaluate", "to what extent", "how far do you agree"],
    geography:  ["describe", "explain", "assess", "evaluate", "compare", "calculate", "suggest"],
    business:   ["state", "calculate", "explain", "analyse", "discuss", "evaluate", "justify"],
    psychology: ["outline", "describe", "explain", "evaluate", "discuss", "compare"],
    sociology:  ["identify", "describe", "explain", "evaluate", "discuss", "compare", "assess"],
    other:      ["describe", "explain", "evaluate", "compare", "analyse", "calculate"],
  },
  Edexcel: {
    science:    ["state", "describe", "explain", "calculate", "predict", "compare", "evaluate", "deduce"],
    mathematics:["work out", "show that", "solve", "prove", "given that", "express", "calculate"],
    english:    ["analyse", "evaluate", "compare", "explore"],
    history:    ["describe", "explain", "to what extent", "how convincing"],
    geography:  ["describe", "explain", "assess", "evaluate", "compare", "suggest"],
    business:   ["state", "calculate", "analyse", "evaluate", "recommend"],
    psychology: ["describe", "explain", "evaluate", "assess"],
    other:      ["describe", "explain", "evaluate", "analyse", "compare"],
  },
  OCR: {
    science:    ["state", "describe", "explain", "calculate", "compare", "predict", "evaluate", "justify"],
    mathematics:["work out", "show that", "solve", "prove", "hence", "calculate"],
    english:    ["analyse", "evaluate", "compare", "explore"],
    history:    ["describe", "explain", "assess", "to what extent"],
    geography:  ["describe", "explain", "assess", "evaluate"],
    business:   ["state", "calculate", "explain", "analyse", "evaluate", "recommend"],
    psychology: ["outline", "describe", "explain", "evaluate"],
    other:      ["describe", "explain", "analyse", "evaluate"],
  },
  WJEC: {
    science:    ["state", "describe", "explain", "calculate", "evaluate", "compare"],
    other:      ["describe", "explain", "analyse", "evaluate"],
  },
  CIE: {
    science:    ["state", "describe", "explain", "calculate", "compare", "predict"],
    mathematics:["work out", "show that", "solve", "prove"],
    other:      ["describe", "explain", "analyse", "evaluate"],
  },
  SQA: {
    science:    ["state", "describe", "explain", "calculate", "compare"],
    other:      ["describe", "explain", "analyse", "evaluate"],
  },
};

function getBoardCommandWords(board: string | undefined, subject: string): string[] {
  if (!board || board === "none") return [];
  const subjectFamily = (() => {
    const s = (subject || "").toLowerCase();
    if (/maths|mathematics/.test(s))                            return "mathematics";
    if (/biology|chemistry|physics|science/.test(s))            return "science";
    if (/english|literature|language/.test(s))                  return "english";
    if (/history/.test(s))                                      return "history";
    if (/geograph/.test(s))                                     return "geography";
    if (/business|economics/.test(s))                           return "business";
    if (/psycholog/.test(s))                                    return "psychology";
    if (/sociolog/.test(s))                                     return "sociology";
    return "other";
  })();
  const tbl = BOARD_COMMAND_WORDS[board] || {};
  return tbl[subjectFamily] || tbl.other || [];
}

function buildSlidePrompt(params: {
  subject: string;
  yearGroup: string;
  topic: string;
  lessonType: string;
  slideCount: number;
  objectives?: string;
  additionalNotes?: string;
  sendNeeds?: string;
  readingAge?: number;
  examBoard?: string;
  differentiationLevel?: "foundation" | "core" | "extension";
}): { system: string; user: string } {
  const { subject, yearGroup, topic, lessonType, slideCount, objectives, additionalNotes, sendNeeds, readingAge, examBoard, differentiationLevel } = params;

  const isSTEM = /maths|mathematics|physics|chemistry|biology|science|computing|computer|technology|engineering/i.test(subject);
  const isPrimary = /year [1-6]|ks1|ks2/i.test(yearGroup);
  const isExamYear = /year 1[0-3]|gcse|a.?level|sixth/i.test(yearGroup);

  const template = resolvePresentationTemplate({ subject, yearGroup, lessonType, sendNeeds, differentiationLevel });

  // Build the structured slide plan. Templates always get to bias the plan now
  // (item 21 fix): the previous "lock 18-slide" rule meant teacher-chosen
  // humanities-discussion / exam-revision-precision templates couldn't
  // actually rearrange an 18-slide deck. Now they can — applyTemplateBias
  // still respects the locked positions (title/objectives/exit-ticket) so
  // the canonical pedagogy spine survives.
  const basePlan = buildSlidePlan(slideCount, lessonType, yearGroup);
  const slidePlan = applyTemplateBias(basePlan, template.slidePlanBias);

  // Bloom's taxonomy mapping for teaching progression
  const bloomsMap: Record<string, string> = {
    "title":              "RECALL — set context and activate prior knowledge",
    "learning-objectives":"RECALL — clarify what pupils will know and be able to do",
    "retrieval-warm-up":  "RECALL — retrieve prior knowledge (spaced practice)",
    "hook":               "RECALL/UNDERSTAND — engage curiosity, surface misconceptions",
    "key-terms":          "UNDERSTAND — build vocabulary and conceptual framework",
    "content":            "UNDERSTAND — teach new knowledge clearly and concisely",
    "diagram-label":      "UNDERSTAND/APPLY — visual processing and labelling",
    "worked-example":     "APPLY — model the thinking process step by step",
    "activity":           "APPLY — guided practice with scaffolding",
    "pause-and-solve":    "APPLY — independent attempt before revealing answer",
    "check-understanding":"ANALYSE — formative assessment, identify gaps",
    "mini-quiz":          "ANALYSE — retrieval practice across multiple questions",
    "misconception-bust": "ANALYSE — explicitly address common errors",
    "think-pair-share":   "ANALYSE/EVALUATE — collaborative reasoning",
    "discussion":         "EVALUATE — higher-order thinking and debate",
    "real-world-link":    "EVALUATE — connect to authentic contexts",
    "exam-technique":     "EVALUATE — exam strategy and mark scheme awareness",
    "extension":          "CREATE — challenge for higher attainers",
    "summary":            "RECALL — consolidate key learning",
    "exit-ticket":        "RECALL/APPLY — end-of-lesson assessment",
    // Teacher-framework additions
    "vocab-reference":    "RECALL — glossary reference for revision and follow-up",
    "model-answer":       "EVALUATE — exemplar showing how marks are earned",
    "exam-practice":      "APPLY/EVALUATE — timed exam-style attempt with marks visible",
    // SEND-native types
    "brain-break":        "REGULATE — restore attention (ADHD-specific)",
    "checkin":            "REGULATE — emotional readiness (SEMH/Anxiety)",
    "method-steps":       "UNDERSTAND — visible reference method (Dyslexia/Dyscalculia)",
    "help-box":           "UNDERSTAND — reference of key facts (MLD)",
    "word-bank":          "UNDERSTAND — pre-taught vocabulary (SLCN/EAL)",
    "take-a-break":       "REGULATE — permission to pause (PDA/Anxiety/Tourette's)",
  };

  const planDescription = slidePlan.map((type, i) =>
    `  Slide ${i + 1}: "${type}" — ${bloomsMap[type] || "APPLY"}`
  ).join("\n");

  // ── Subject profile (SHARED with the worksheet generator) ──────────────
  // buildSubjectPromptFragments returns palette + slide structure + domain
  // rules + a spec anchor, keyed off the subject. Using the SAME helper in
  // both tools is how we keep presentation content and worksheet content
  // anchored to the same UK GCSE specification for a given topic.
  const subjectFragments = buildSubjectPromptFragments(subject);

  // ── SEND adaptation (SHARED with the worksheet generator) ─────────────
  // Multi-need aware — teachers can select multiple SEND needs and the
  // helper merges every applicable spec into one note. composeSendNoteForPresentation
  // handles both single-id and array inputs gracefully and is the single
  // source of truth for what "adapt this deck for X + Y" means.
  const sendNote = sendNeeds ? composeSendNoteForPresentation(sendNeeds) : "";

  // Resolve every applicable spec for the hard-cap + structured-field hints.
  const appliedSendSpecs = resolveSendSpecs(sendNeeds);
  const sendSpec = appliedSendSpecs[0] || null;
  const sendHardCap = appliedSendSpecs.length
    ? `\nSEND HARD CAP (non-negotiable): Every slide in this deck MUST comply with EVERY rule from ${appliedSendSpecs.map(s => s.name).join(" + ")} above. No exceptions — when rules conflict, pick the strictest access requirement.`
    : "";

  // Reading-age auto-clamp: some SEND needs impose a ceiling that conflicts
  // with a teacher-set reading age. We don't override the teacher's number
  // but we surface the conflict to the LLM so it defaults to the ceiling.
  const sendReadingCeiling = getSendReadingAgeCeiling(sendNeeds);
  const effectiveReadingAge = sendReadingCeiling && readingAge && readingAge > sendReadingCeiling
    ? sendReadingCeiling
    : readingAge;
  const readingAgeClampNote = sendReadingCeiling && readingAge && readingAge > sendReadingCeiling
    ? `\nNOTE: Teacher selected reading age ${readingAge} but the SEND adaptation caps reading age at ${sendReadingCeiling}. Use the capped reading age of ${sendReadingCeiling} for ALL slide text. The academic rigour of the content stays at year-group level — only the READING LEVEL drops.`
    : "";

  // Teacher-framework SEND-native slide type hints — when certain needs apply,
  // instruct the LLM to use the dedicated slide types we added to the schema
  // rather than cramming SEND support into `body` or `bullets`.
  const sendStructuredFieldsNote = appliedSendSpecs.length ? `
SEND STRUCTURED FIELDS (use these fields on relevant slides — do NOT stuff SEND content into generic \`body\`/\`bullets\`):
${appliedSendSpecs.some(s => ["adhd"].includes(s.id)) ? `- ADHD: set "visibleCheckboxes": true on every activity/check-understanding slide so the renderer shows [ ] before each item. Set "actionVerb" to the bolded verb. Insert one "brain-break" slide roughly mid-deck.
` : ""}${appliedSendSpecs.some(s => ["dyslexia", "dyscalculia"].includes(s.id)) ? `- Dyslexia/Dyscalculia: populate "methodSteps" on worked-example slides. Add a dedicated "method-steps" slide before the first practice slide.
` : ""}${appliedSendSpecs.some(s => ["asc", "asperger"].includes(s.id)) ? `- ASC/Asperger: populate "whatYouNeedToDo" on every activity slide. Populate "completionChecklist" on the exit-ticket slide.
` : ""}${appliedSendSpecs.some(s => ["mld"].includes(s.id)) ? `- MLD: populate "helpBox" on the slide before independent practice. Use "sentenceStarter" on every activity slide.
` : ""}${appliedSendSpecs.some(s => ["slcn", "eal"].includes(s.id)) ? `- SLCN/EAL: populate "wordBank" on the first content slide (use a dedicated "word-bank" slide type). Populate "answerFrame" on every check-understanding slide. Populate "visualCue" where relevant.
` : ""}${appliedSendSpecs.some(s => ["anxiety"].includes(s.id)) ? `- Anxiety/SEMH: insert a "checkin" slide near the start AND before the exit-ticket. Label any challenge slide with "bonusLabel": "OPTIONAL BONUS — only if you want to!".
` : ""}${appliedSendSpecs.some(s => ["pda-odd"].includes(s.id)) ? `- PDA/ODD: label every activity slide with "bonusLabel": "Explore — choose where to start" or "Secret Mission — if you choose to accept it". Insert a "take-a-break" slide mid-deck.
` : ""}${appliedSendSpecs.some(s => ["tourettes"].includes(s.id)) ? `- Tourette's: insert a "take-a-break" slide every 3–4 content slides. Avoid any alarm-red styling language.
` : ""}` : "";

  const readingAgeNote = effectiveReadingAge ? `
READING AGE TARGET: ${READING_AGE_LABELS[effectiveReadingAge] || `Age ${effectiveReadingAge}`}
- Every word of text on slides must be readable by a child of reading age ${effectiveReadingAge}.
- Vocabulary ceiling: ${effectiveReadingAge <= 8 ? "only the 1,000 most common English words; no technical jargon without a definition" : effectiveReadingAge <= 11 ? "everyday vocabulary; define all subject-specific terms on the key-terms slide" : effectiveReadingAge <= 14 ? "GCSE-level vocabulary; avoid A-level register" : "full academic vocabulary appropriate for sixth form"}
- Sentence length: max ${effectiveReadingAge <= 8 ? "6" : effectiveReadingAge <= 11 ? "10" : effectiveReadingAge <= 14 ? "15" : "20"} words per sentence on slides.
- ${effectiveReadingAge <= 10 ? "Use concrete examples (objects, animals, everyday situations) not abstract concepts." : ""}` : "";

  const examBoardNote = examBoard && examBoard !== "none" ? `
EXAM BOARD: ${examBoard}
- Use ${examBoard} command words, mark scheme language, and assessment objectives.
- Reference ${examBoard} specification terminology where relevant.
- Exam technique slides must reflect ${examBoard} mark scheme conventions.` : "";

  // ── Per-board command words (item 19) ────────────────────────────────────
  // Inject the actual command-word list this board uses for THIS subject so
  // exam-practice and model-answer slides phrase questions in the canonical
  // mark-scheme register.
  const boardCommandWords = getBoardCommandWords(examBoard, subject);
  const boardCommandWordsBlock = boardCommandWords.length ? `
${examBoard?.toUpperCase()} COMMAND WORDS (use these EXACTLY when writing exam-practice / model-answer / exam-technique slides):
${boardCommandWords.map(w => `  • ${w}`).join("\n")}` : "";

  // ── Misconception bank wiring (item 18) ──────────────────────────────────
  // Pull vetted misconceptions for this (subject, topic, year-group) from the
  // shared bank rather than letting the LLM hallucinate. Falls back silently
  // when no entries match.
  const misconceptionsBlock = (() => {
    try {
      return formatMisconceptionsForPrompt({ subject, topic, yearGroup, limit: 4 });
    } catch { return ""; }
  })();

  // ── Spec-point catalogue from curriculumBank (item 17) ───────────────────
  // For boards we have data for, surface real spec-refs so the AI cites them
  // ("AQA C5.1.2") instead of generic "GCSE chemistry" framing.
  const specPointsBlock = (() => {
    try {
      const board = (examBoard && examBoard !== "none" ? examBoard : "AQA") as any;
      const entries: CurriculumEntry[] = lookupByTopic(board, subject, yearGroup, topic, "both");
      if (!entries || entries.length === 0) return "";
      const lines = entries.slice(0, 6).map(e => `  • ${e.specPoint.specRef} — ${e.specPoint.statement}`);
      return `
${board} SPEC POINTS LIKELY RELEVANT TO "${topic}" (cite by ref where appropriate):
${lines.join("\n")}`;
    } catch { return ""; }
  })();

  const diffNote = differentiationLevel ? `
DIFFERENTIATION LEVEL: ${differentiationLevel.toUpperCase()}
- ${differentiationLevel === "foundation" ? "Pitch content at foundation/support level. Use scaffolding, sentence starters, word banks, and worked examples on every activity slide. Avoid open-ended tasks without structure." : differentiationLevel === "extension" ? "Pitch content at extension/challenge level. Include higher-order thinking, evaluation tasks, and stretch questions. Assume strong prior knowledge." : "Pitch content at core/expected level for this year group."}` : "";

  const templateNote = `
PRESENTATION TEMPLATE: ${template.label}
- Follow this presentation style strictly.
- Preferred image style: ${template.imageStyle}.
${template.promptAdditions.map(line => `- ${line}`).join("\n")}`;

  // Subject-specific design + content anchors. paletteBlock informs colour
  // choices, slideStructureBlock is a 12-slide plan tuned to the discipline
  // (only used as GUIDANCE — the authoritative plan is still `planDescription`
  // below), and domainRulesBlock + specAnchorBlock force the LLM to use
  // real spec points and discipline-appropriate conventions (e.g. Consolas
  // for maths formulae, state symbols for chemistry equations).
  const subjectNote = `
SUBJECT PROFILE — ${subjectFragments.profile.label.toUpperCase()}

${subjectFragments.paletteBlock}

${subjectFragments.domainRulesBlock}

${subjectFragments.specAnchorBlock}

Additional slide-design guidance for this subject (may be blended with the plan below):
${subjectFragments.slideStructureBlock}
`;

  const system = `You are an expert UK teacher and curriculum designer. You create outstanding, Ofsted-ready lesson presentations that follow best pedagogical practice: Rosenshine's Principles, Bloom's Taxonomy, retrieval practice, and spaced learning.

SUPPLY-TEACHER DEPTH TEST (NON-NEGOTIABLE):
Write every slide so that a supply teacher with NO subject knowledge could deliver it from these slides alone, with NO textbook. Every concept must be EXPLAINED, not just named. This is the difference between a slide deck and a real lesson:
- WRONG: "Step 1: Rearrange the equation." (names the step, doesn't explain how)
- RIGHT: "Step 1: Move the +5 to the other side by subtracting 5 from both sides. This gives: 2x = 7 − 5 = 2."

PRESENTATION DESIGN RULES:
1. TEXT LIMITS: Max 12 words per bullet (8 words preferred). Max 5 bullets per slide. No paragraphs. No dense text blocks.
2. TEACHING FLOW: Every slide has a clear pedagogical role. Follow the slide plan exactly.
3. VISUAL-FIRST: Every non-title slide must include at least one shape element (card, table, callout box, or diagram) — never plain text on a blank background. Use the appropriate slide type so the renderer picks the right shape set.
4. PROGRESSION: Difficulty escalates: recall → understand → apply → analyse → evaluate.
5. INTERACTION: At least 30% of slides must be interactive (questions, activities, discussions).
6. SPECIFICITY: Use real numbers, real contexts, real examples — never generic placeholders. If you write a worked example, SHOW the actual numbers. Do NOT write "solve this equation" — solve it yourself and show the solution. If you write a historical claim, cite the real date, real event, real named historian with their actual interpretation.
7. CONCISENESS: Slide titles max 6 words. Speaker notes 2-4 sentences, practical and actionable.
8. IMAGE PROMPTS: For visual slides, include a specific image_prompt field describing an ideal photograph or diagram.

TIMING (MANDATORY FOR EVERY ACTIVITY/TASK SLIDE):
Every slide whose type is "activity", "pause-and-solve", "think-pair-share", "check-understanding", "mini-quiz", "discussion", "exam-practice", "retrieval-warm-up", "hook", "brain-break" or "take-a-break" MUST include a "timingMinutes" number. The renderer shows this as "⏱ X min" in the top-right so pupils can self-regulate. Typical values: starter 5, retrieval 5, activity 6-10, exam-practice 5-10, plenary 5, brain-break 1, take-a-break 2.

MARK ALLOCATIONS:
- Every exam-practice slide MUST populate "examQuestion" with {stem, marks, timeMins, commandWord}. The marks value is shown as a "[X marks]" chip.
- Every model-answer slide MUST populate "markScheme" — an array of {point, marks} showing exactly where each mark is earned.
- Every exam-technique slide must reference the exam board's command words (e.g. describe, explain, evaluate, calculate, state).

LEARNING OBJECTIVES:
Objectives slides MUST populate "successCriteria" with three strings: must / should / could. The renderer shows each in a distinct coloured card. Do NOT use the old "All:/Most:/Some:" prefix format when successCriteria is provided.

WORKED EXAMPLES:
Worked-example slides MUST populate "workedExampleBox" with {problem, steps[], answer, units?, commonError?}. The renderer places this in a bordered box with a distinct background so pupils can visually find the worked-example box on the slide. "steps" must include the formula, the substitution, any rearrangement, and the final answer with units.

KEY VOCABULARY REFERENCE:
Vocab-reference slides MUST populate "vocabTable" — an array of {term, definition, example?}. This becomes a full-width reference table. Include every essential term for the topic (aim for 8-12).

DIFFERENTIATION (built into every activity slide):
Where appropriate, populate "differentiation" with {support, core, extension}. Support = scaffolded version with sentence starter. Core = standard task. Extension = harder application or evaluation question. The renderer shows these as three colour-coded cards.

LAYOUT DIRECTIVE (MANDATORY FOR EVERY NON-TITLE SLIDE):
Every non-title slide MUST include a "layout" field that tells the renderer how to arrange content. Choose from:
- "bullet-list"   → default bullets list (use when simply listing facts)
- "two-col"       → two balanced columns (use when comparing A vs B, Before vs After, Pros vs Cons). Put left-column bullets in "bullets" and right-column bullets in "bulletsRight".
- "hero-number"   → one big headline number + supporting bullets (use for statistics, key data, formulae). Put the number/formula in "headline" and supporting points in "bullets".
- "image-left"    → image on left, bullets on right. Requires image_prompt.
- "image-right"   → image on right, bullets on left. Requires image_prompt.
- "definition"    → big word + definition + example underneath (use for single key terms).
- "process"       → horizontal step-by-step flow (use for processes, methods). Put numbered stages in "steps".
- "quote-block"   → large quote in the centre + attribution (use for primary sources, quotes).
The layout MUST match the slide's content — do not pick bullet-list if the content would be clearer as two columns or a process flow. Layout is the #1 thing that makes a slide "look like a real lesson slide, not text on a page".

CRITICAL: Return ONLY valid JSON. No markdown, no explanation, no code blocks.`;

  const slideTypeGuide = `SLIDE TYPE SPECIFICATIONS:

"title" → title (engaging, specific), subtitle (subject | year | date line), body (one hook sentence), image_prompt (relevant background image)
"learning-objectives" → title, successCriteria {must, should, could}, speakerNotes
"retrieval-warm-up" → title, retrievalQuestions (array of 3-5 quick recall questions from prior lessons), timingMinutes (5), speakerNotes
"hook" → title, question (thought-provoking opener), bullets (2-3 instructions), body (timing/context), timingMinutes (3-5), image_prompt
"key-terms" → title, terms (array of {term, definition} — 5-8 terms, definitions max 10 words each)
"content" → title, bullets (3-5 concise facts/concepts, max 8 words each), body (optional context sentence), layout ("two-col" if comparing), image_prompt (optional)
"worked-example" → title, workedExampleBox {problem, steps[3-6], answer, units, commonError}, speakerNotes. The steps MUST include the formula, the substitution, any rearrangement, and the final answer with units.
"diagram-label" -> title, diagram {kind, nodes[], edges[], sets?, equation?, title?}, diagramLabels (array of 4-8 label strings), question (what to label/identify), speakerNotes. ALWAYS populate the \`diagram\` field -- choose the best kind for the topic. The renderer draws SVG automatically from this data.
"activity" → title, question (task instruction), bullets (3-5 step-by-step instructions), differentiation {support, core, extension}, timingMinutes, body (brief context), speakerNotes
"pause-and-solve" → title, question (the problem to solve), steps (reveal steps — show method progressively), answer (final answer), timingMinutes, speakerNotes
"check-understanding" → title, question (MCQ question stem), options (array of 4 options A-D), answer (correct letter), timingMinutes (2-3), speakerNotes
"mini-quiz" → title, retrievalQuestions (3-5 questions with answers embedded as "Q: ... A: ..."), timingMinutes (5), speakerNotes
"misconception-bust" → title, misconception (what students often think — quote it), correction (what is actually correct), bullets (why the misconception is wrong — 2-3 points), speakerNotes
"think-pair-share" → title, question (discussion question), bullets (Think/Pair/Share instructions), body (time: "2 min think, 2 min pair, share"), timingMinutes (4-6), speakerNotes
"discussion" → title, question (debate/discussion prompt), bullets (2-3 discussion points or sentence starters), body (context), timingMinutes, speakerNotes
"real-world-link" → title, realWorldContext (1-2 sentences connecting to real life), bullets (3 real-world applications), image_prompt (relevant real-world image), speakerNotes
"exam-technique" → title, examTip (specific exam strategy), markSchemeHint (what examiners look for), bullets (2-3 command word tips), speakerNotes
"extension" → title, question (challenge task), bullets (scaffolding steps for extension), body (hint or context), speakerNotes
"summary" → title, bullets (3-5 key takeaways — the most important things to remember), body (link to next lesson), speakerNotes
"exit-ticket" → title, question (assessment question), options (optional MCQ options), answer (correct answer or model answer), timingMinutes (3-5), speakerNotes

── Teacher-framework additions (use these exactly as specified):
"vocab-reference" → title, vocabTable (array of 8-12 {term, definition, example?} — every essential term for this topic with plain-English definition and a brief example). This is the reference slide pupils will revisit.
"model-answer" → title, body (the full model answer text, 2-5 sentences), markScheme (array of {point, marks} showing exactly where each mark is earned — sum matches the total), examTip (one-line tip on structure), speakerNotes
"exam-practice" → title, examQuestion {stem, marks, timeMins, commandWord}, differentiation (optional support/core/extension variants), speakerNotes. Render this as a timed exam card with the mark chip visible.

── Phase 2 classroom-action slide types (use these when the lesson calls for them):
"section-divider" → title (chapter heading e.g. "Part 2 — Application"), subtitle (one-line teaser), body (optional, italic). Used as a visual chapter break inside longer decks.
"cold-call" → title, coldCallCue (the exact line the teacher reads), question (the cold-call question), namedPupilHint (optional — "try a quieter pupil"), bullets (optional follow-up cues).
"live-model" → title, liveModel {iDo, weDo, youDo} — three contrasting phrasings of the same problem. iDo = teacher demonstrates, weDo = guided, youDo = independent. Pairs with worked-example.
"do-now" → title, question (the silent-start task), bullets (optional sub-tasks), timingMinutes (3-5). Pupils complete this AS THEY ENTER — silent, in their book.
"choose-your-task" → title, question (the task framing), differentiation {support, core, extension}. Pupils self-select the route they'll take.
"stuck-help" → title, question (the original task), hintLadder (3 escalating hints: small nudge → method reminder → near-answer), finalAnswer (revealed last). Designed to keep pupils thinking before getting the answer.
"homework" → title, homeworkBrief (what to do), homeworkDueDate, homeworkMinutes, homeworkLink (optional URL). Replaces a plain "Homework" slide at the end of decks.

── Layout-specific data fields (use these when picking the matching layout):
- "split-stat" layout: populate \`headline\` with the big number/percentage, \`subtitle\` with its caption, \`body\` with a "what this means" sentence, \`bullets\` with 1-3 supporting points.
- "comparison-table" layout: populate \`compareHeaders: ["A","B"]\` and \`compareRows: [{label, left, right}]\` (4-6 rows).
- "timeline-horizontal" layout: populate \`timelineEvents: [{date, title, description?}]\` (4-6 events).
- "card-grid" layout: populate \`cards: [{title, body, icon?}]\` (6 cards in 3×2 grid). icon may be an emoji.
- "before-after" layout: populate \`beforeAfter: {before, after, beforeLabel, afterLabel}\` for the contrast pair.
- "quote-portrait" layout: populate \`quote\`, \`attribution\`, \`image_prompt\` (portrait of speaker).
- "diagram-callouts" layout: populate \`diagramDescription\` plus \`diagramCallouts: [{label, position, description?}]\` where position is one of top-left / top / top-right / right / bottom-right / bottom / bottom-left / left. Also populate the \`diagram\` field if the topic warrants a structured diagram (the renderer will use it when present).

── DIAGRAM SYSTEM (populate \`diagram\` on any diagram-label slide):
The \`diagram\` field is rendered as a programmatic SVG. Choose the \`kind\` that best fits:
- "flowchart": nodes connected by directional arrows (processes, algorithms, decision trees)
- "venn": overlapping sets with items (comparing/contrasting concepts)
- "timeline": events on a horizontal timeline
- "circuit": electrical circuit (label nodes as: battery, resistor, lamp, switch, ammeter, voltmeter)
- "cell": biological cell diagram (label parts: nucleus, mitochondria, cell membrane, cytoplasm, etc.)
- "water-cycle": cyclical natural process (evaporation, condensation, precipitation, collection)
- "food-chain": linear chain of organisms with energy flow arrows
- "equation-graph": x/y coordinate graph (provide \`equation\` field, nodes as axis labels)
- "labelled-box": generic central diagram with surrounding labels
- "cycle": any cyclical process (carbon cycle, rock cycle, nitrogen cycle, etc.)

Structure: { kind, title?, nodes: [{id, label, group?}], edges?: [{from, to, label?, style?}], sets?: [{label, items[]}], equation? }
- For flowchart/food-chain: populate nodes + edges
- For venn: populate sets (2-3 sets with their items; shared items appear in multiple sets)
- For circuit: populate nodes (id = component type) + edges (connections)
- For timeline: populate nodes (label = event, group = date)
- For cell/labelled-box: populate nodes (label = part name)
- For cycle/water-cycle: populate nodes in order + edges connecting them in a loop
- For equation-graph: populate equation + nodes for axis labels

── Inline rich-text markers in any text field (bullets / body / question):
- \`code\` → mono chip (use for keywords, function names, short code samples)
- $math$ → Consolas inline maths span (use for inline equations and formulae)
- [icon:warning] / [icon:check] / [icon:flask] / etc. → leading emoji
The renderer applies these automatically — DON'T over-use, but reach for them when the line genuinely is code or maths.

── SEND-native slide types (use these when the named need applies):
"brain-break" → title ("BRAIN BREAK"), body ("Stand up and stretch for 30 seconds"), timingMinutes (1). Do NOT add bullets or questions — the slide is deliberately sparse.
"checkin" → title ("How are you feeling?"), bullets (the 5 emoji scale: 😀 Calm / 🙂 OK / 😐 Not sure / 😟 Worried / 😣 Struggling), body (optional: "Show the teacher on your fingers"), timingMinutes (1-2).
"method-steps" → title ("Step-by-Step Method"), methodSteps (4-6 numbered steps), body (one-line reminder).
"help-box" → title ("Help Box — Key Facts"), helpBox (4-8 one-line facts/formulas/reminders), body (when to use this).
"word-bank" → title ("Word Bank"), wordBank (4-8 {term, definition} — plain-English definitions), body (optional: when to refer to this).
"take-a-break" → title ("Take a Break"), body ("Take a breath here if you need to. Come back when you're ready."), timingMinutes (2).

${isPrimary ? `
PRIMARY SLIDE TYPE SPECIFICATIONS (use these for primary school):
"story-time" → title, body (short story/scenario in 2-3 simple sentences introducing the topic), image_prompt (colourful, child-friendly scene), speakerNotes (how to read it aloud)
"draw-it" → title, question (simple drawing instruction e.g. "Draw 3 apples in the box"), body (what to draw — be very specific), speakerNotes
"sort-it" → title, question (sorting instruction), bullets (items to sort — 4-6 items), body (category labels e.g. "Living / Not Living"), speakerNotes
"match-it" → title, question (matching instruction), bullets (left column items), body (right column items — same count, shuffled), speakerNotes
"fill-the-gap" → title, question (fill-in-the-blank sentence or short passage with ___ gaps), bullets (word bank — 4-6 words), speakerNotes
"spot-the-mistake" → title, question (show a worked example with a deliberate mistake), answer (what the mistake is and why), speakerNotes
"number-talk" → title, question (a number or calculation to think about), bullets (3 different ways to think about it), body (discussion prompt), speakerNotes
"think-pair-share" → title, question (simple discussion question), bullets (Think: 1 min / Pair: 1 min / Share: hands up!), body (sentence starter e.g. "I think... because..."), speakerNotes
` : ""}`;

  const user = `Create a complete, high-quality lesson presentation.

SUBJECT: ${subject}
YEAR GROUP: ${yearGroup}
TOPIC: ${topic}
LESSON TYPE: ${lessonType}
SLIDE COUNT: ${slideCount}
${objectives ? `LEARNING OBJECTIVES: ${objectives}` : ""}
${additionalNotes ? `ADDITIONAL NOTES: ${additionalNotes}` : ""}
${sendNote}
${sendHardCap}
${sendStructuredFieldsNote}
${readingAgeNote}
${readingAgeClampNote}
${examBoardNote}
${boardCommandWordsBlock}
${specPointsBlock}
${misconceptionsBlock}
${diffNote}
${subjectNote}
${templateNote}

SLIDE PLAN (follow this EXACTLY — do not change the order or types):
${planDescription}

${slideTypeGuide}

IMAGE SYSTEM — TWO-STAGE RELEVANCE CHECK:
For every slide with an image_prompt field:
1. First check: Is this slide type visual? (title, hook, content, real-world-link = YES; objectives, key-terms, exit-ticket = NO)
2. Second check: Is the topic specific enough for a relevant image? (e.g. "photograph of a rainforest canopy" = YES; "Introduction" = NO)
Only include image_prompt if BOTH checks pass. Make it specific: "photograph of a series circuit with labelled components" not "science image".
When you do include images, they must match this style: ${template.imageStyle}.
NOTE: Diagrams are generated programmatically via the \`diagram\` field -- do NOT use image_prompt for scientific diagrams, circuits, cells, flowcharts, etc. Use image_prompt only for photographic backgrounds (e.g. "photograph of a rainforest canopy").

QUALITY STANDARDS:
- Every bullet max 8 words, factually accurate for ${topic}
- Worked examples must use real numbers relevant to ${topic}
- Speaker notes must be practical teaching guidance (not just "teach this slide")
- ${isSTEM ? "STEM: Use correct units, formulae, and scientific notation" : "Humanities: Use precise subject vocabulary and text references"}
- ${isPrimary ? `PRIMARY SCHOOL RULES (MANDATORY):
  1. Language: max 6 words per bullet. Short sentences. No jargon.
  2. Tone: warm, encouraging, fun. "Well done!", "Can you spot it?", "Have a go!"
  3. Activities: EVERY activity slide must have a clear, single task instruction.
  4. Visuals: describe colourful, child-friendly images in image_prompt fields.
  5. Numbers: use concrete examples (apples, toys, animals) not abstract symbols.
  6. Variety: mix drawing, matching, circling, sorting, filling in blanks.
  7. No dense text — max 3 words per bullet. Bigger is better.` : "SECONDARY: Use GCSE/A-level appropriate vocabulary"}
- ${isExamYear ? "EXAM YEAR: Include mark scheme language, command words, band descriptors" : ""}
- Misconception slides must name the SPECIFIC misconception for this topic
- Exit ticket must be answerable in 2 minutes and directly assess the lesson objective

Return JSON with this structure:
{
  "title": "Specific lesson title",
  "subject": "${subject}",
  "yearGroup": "${yearGroup}",
  "topic": "${topic}",
  "slides": [ ... exactly ${slideCount} slides following the plan above ... ],
  "totalSlides": ${slideCount}
}`;

  return { system, user };
}


// ─── Slide Renderer ───────────────────────────────────────────────────────────
function SlidePreview({
  slide,
  theme,
  index,
  total,
  isActive,
  onClick,
}: {
  slide: SlideContent;
  theme: ComposedTheme;
  index: number;
  total: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = SLIDE_ICONS[slide.type] || BookOpen;
  // Per-type mini layouts so a vocab-reference thumbnail doesn't look the
  // same as an exam-practice thumbnail. Falls back to the legacy "title +
  // first 3 bullets" rendering for any type without a bespoke mini.
  const renderMiniBody = () => {
    switch (slide.type) {
      case "title":
      case "section-divider":
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1.5" style={{ background: theme.gradient }}>
            <div className="text-[7px] font-black truncate text-white max-w-full">{slide.title}</div>
            {slide.subtitle && <div className="text-[5px] text-white/70 truncate max-w-full">{slide.subtitle}</div>}
          </div>
        );
      case "vocab-reference":
      case "key-terms":
      case "word-bank": {
        const rows = (slide.vocabTable || slide.terms || slide.wordBank || []).slice(0, 4);
        return (
          <div className="absolute inset-0 flex flex-col" style={{ background: theme.bg }}>
            <div className="h-2" style={{ background: theme.gradient }} />
            <div className="flex-1 p-1 grid grid-cols-2 gap-0.5 content-start">
              {rows.map((r: any, i: number) => (
                <div key={i} className="rounded-[2px] px-0.5 py-0.5" style={{ background: theme.light }}>
                  <div className="text-[4px] font-bold truncate" style={{ color: theme.secondary }}>{r.term}</div>
                  <div className="text-[3px] text-gray-500 truncate">{r.definition}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case "worked-example":
      case "method-steps": {
        const steps = (slide.workedExampleBox?.steps || slide.methodSteps || slide.steps || []).slice(0, 3);
        return (
          <div className="absolute inset-0 flex flex-col" style={{ background: theme.bg }}>
            <div className="h-2" style={{ background: theme.gradient }} />
            <div className="flex-1 p-1 space-y-0.5">
              <div className="text-[5px] font-bold truncate" style={{ color: theme.primary }}>{slide.title}</div>
              {steps.map((st, i) => (
                <div key={i} className="flex items-start gap-0.5">
                  <div className="w-2 h-2 rounded-full flex items-center justify-center text-[3px] font-bold text-white flex-shrink-0" style={{ background: theme.secondary }}>{i + 1}</div>
                  <div className="text-[4px] text-gray-700 truncate">{st}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case "exam-practice": {
        const q = slide.examQuestion;
        return (
          <div className="absolute inset-0 flex flex-col" style={{ background: theme.bg }}>
            <div className="h-2" style={{ background: theme.gradient }} />
            <div className="flex-1 p-1">
              <div className="text-[5px] font-bold truncate" style={{ color: theme.primary }}>{slide.title}</div>
              <div className="flex gap-0.5 mt-0.5">
                {q?.commandWord && <span className="px-0.5 py-px rounded bg-slate-900 text-white text-[3px] font-bold">{q.commandWord}</span>}
                {q?.marks != null && <span className="px-0.5 py-px rounded bg-amber-500 text-white text-[3px] font-bold">[{q.marks}m]</span>}
              </div>
              <div className="text-[3px] text-gray-700 line-clamp-3 mt-0.5">{q?.stem || slide.question}</div>
            </div>
          </div>
        );
      }
      case "check-understanding":
      case "mini-quiz": {
        const opts = (slide.options || []).slice(0, 4);
        return (
          <div className="absolute inset-0 flex flex-col" style={{ background: theme.bg }}>
            <div className="h-2" style={{ background: theme.gradient }} />
            <div className="flex-1 p-1">
              <div className="text-[4px] font-bold truncate" style={{ color: theme.primary }}>{slide.question || slide.title}</div>
              <div className="grid grid-cols-2 gap-0.5 mt-0.5">
                {opts.map((o, i) => (
                  <div key={i} className="rounded-[2px] px-0.5 py-px text-[3px] truncate" style={{ background: theme.light, color: theme.text }}>
                    {String.fromCharCode(65 + i)} {o}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      case "comparison-table":
        return (
          <div className="absolute inset-0 flex flex-col" style={{ background: theme.bg }}>
            <div className="h-2" style={{ background: theme.gradient }} />
            <div className="flex-1 p-1 grid grid-cols-2 gap-0.5">
              <div className="rounded-[2px] p-0.5" style={{ background: theme.light }}>
                <div className="text-[3px] font-bold" style={{ color: theme.secondary }}>{slide.compareHeaders?.[0] || "A"}</div>
              </div>
              <div className="rounded-[2px] p-0.5" style={{ background: theme.light }}>
                <div className="text-[3px] font-bold" style={{ color: theme.secondary }}>{slide.compareHeaders?.[1] || "B"}</div>
              </div>
              {(slide.compareRows || []).slice(0, 3).flatMap((r, i) => [
                <div key={`l${i}`} className="text-[3px] truncate" style={{ color: theme.text }}>{r.left}</div>,
                <div key={`r${i}`} className="text-[3px] truncate" style={{ color: theme.text }}>{r.right}</div>,
              ])}
            </div>
          </div>
        );
      case "timeline-horizontal":
        return (
          <div className="absolute inset-0 flex flex-col" style={{ background: theme.bg }}>
            <div className="h-2" style={{ background: theme.gradient }} />
            <div className="flex-1 p-1 flex items-center">
              <div className="relative w-full">
                <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: theme.secondary + "60" }} />
                <div className="grid relative" style={{ gridTemplateColumns: `repeat(${Math.max((slide.timelineEvents || []).length, 1)}, 1fr)` }}>
                  {(slide.timelineEvents || []).slice(0, 6).map((_, i) => (
                    <div key={i} className="flex justify-center"><div className="w-1 h-1 rounded-full" style={{ background: theme.secondary }} /></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case "card-grid":
        return (
          <div className="absolute inset-0 flex flex-col" style={{ background: theme.bg }}>
            <div className="h-2" style={{ background: theme.gradient }} />
            <div className="flex-1 p-1 grid grid-cols-3 gap-0.5">
              {(slide.cards || []).slice(0, 6).map((c, i) => (
                <div key={i} className="rounded-[2px] p-0.5" style={{ background: theme.light }}>
                  <div className="text-[3px] font-bold truncate" style={{ color: theme.secondary }}>{c.title}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case "before-after": {
        const ba = slide.beforeAfter;
        return (
          <div className="absolute inset-0 flex flex-col" style={{ background: theme.bg }}>
            <div className="h-2" style={{ background: theme.gradient }} />
            <div className="flex-1 p-1 grid grid-cols-2 gap-0.5">
              <div className="rounded-[2px] p-0.5" style={{ background: "#fee2e2" }}>
                <div className="text-[3px] font-bold text-red-700">{ba?.beforeLabel || "Before"}</div>
                <div className="text-[3px] text-red-900 truncate">{ba?.before}</div>
              </div>
              <div className="rounded-[2px] p-0.5" style={{ background: "#dcfce7" }}>
                <div className="text-[3px] font-bold text-green-700">{ba?.afterLabel || "After"}</div>
                <div className="text-[3px] text-green-900 truncate">{ba?.after}</div>
              </div>
            </div>
          </div>
        );
      }
      case "misconception-bust":
        return (
          <div className="absolute inset-0 flex flex-col" style={{ background: theme.bg }}>
            <div className="h-2" style={{ background: theme.gradient }} />
            <div className="flex-1 p-1 space-y-0.5">
              <div className="rounded-[2px] p-0.5" style={{ background: "#fee2e2" }}>
                <div className="text-[3px] font-bold text-red-700">❌ Common myth</div>
              </div>
              <div className="rounded-[2px] p-0.5" style={{ background: "#dcfce7" }}>
                <div className="text-[3px] font-bold text-green-700">✓ Truth</div>
              </div>
            </div>
          </div>
        );
      default:
        // Legacy fallback: title + first 3 bullets
        return (
          <div className="absolute inset-0 flex flex-col" style={{ background: theme.bg }}>
            <div className="h-2" style={{ background: theme.gradient }} />
            <div className="flex-1 p-2 flex flex-col justify-center overflow-hidden">
              <div className="text-[7px] font-bold truncate" style={{ color: theme.primary }}>{slide.title}</div>
              {slide.bullets && slide.bullets.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {slide.bullets.slice(0, 3).map((b, i) => (
                    <div key={i} className="flex items-start gap-0.5">
                      <div className="w-1 h-1 rounded-full mt-0.5 flex-shrink-0" style={{ background: theme.secondary }} />
                      <div className="text-[5px] text-gray-600 truncate">{b}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg overflow-hidden border-2 transition-all ${
        isActive ? "border-blue-500 shadow-lg scale-[1.02]" : "border-gray-200 hover:border-gray-300"
      }`}
      style={{ aspectRatio: "16/9", position: "relative" }}
    >
      {renderMiniBody()}
      {/* Slide number */}
      <div className="absolute bottom-1 right-1 text-[5px] text-gray-400 z-10">{index + 1}/{total}</div>
      {/* Mini icon for non-title types (top-left) */}
      {slide.type !== "title" && slide.type !== "section-divider" && (
        <div className="absolute top-1 left-1 z-10 w-3 h-3 rounded-sm flex items-center justify-center" style={{ background: theme.secondary + "30" }}>
          <Icon className="w-2 h-2" style={{ color: theme.secondary }} />
        </div>
      )}
    </button>
  );
}

// ─── Full Slide View ──────────────────────────────────────────────────────────
// Pedagogy badge colours per slide type
const SLIDE_TYPE_COLOURS: Record<string, string> = {
  "title":               "#1B2A4A",
  "learning-objectives": "#16a34a",
  "retrieval-warm-up":   "#7C3AED",
  "hook":                "#d97706",
  "key-terms":           "#0891b2",
  "content":             "#1B2A4A",
  "diagram-label":       "#0891b2",
  "worked-example":      "#1d4ed8",
  "activity":            "#059669",
  "pause-and-solve":     "#be123c", // distinct from misconception (#dc2626) — rose
  "check-understanding": "#d97706",
  "mini-quiz":           "#7C3AED",
  "misconception-bust":  "#dc2626", // alarm red — reserved for "this is WRONG"
  "think-pair-share":    "#0891b2",
  "discussion":          "#059669",
  "real-world-link":     "#065f46",
  "exam-technique":      "#1d4ed8",
  "extension":           "#7C3AED",
  "summary":             "#1B2A4A",
  "exit-ticket":         "#9333ea", // distinct from misconception — purple end-of-lesson
  // Teacher-framework additions
  "vocab-reference":     "#0891b2",
  "model-answer":        "#1d4ed8",
  "exam-practice":       "#b45309",
  // SEND-native types
  "brain-break":         "#f59e0b",
  "checkin":             "#14b8a6",
  "method-steps":        "#1d4ed8",
  "help-box":            "#ca8a04",
  "word-bank":           "#0891b2",
  "take-a-break":        "#14b8a6",
  // Phase 1 + 2 additions
  "section-divider":     "#475569",
  "cold-call":           "#0d9488",
  "live-model":          "#1d4ed8",
  "do-now":              "#0891b2",
  "choose-your-task":    "#7C3AED",
  "stuck-help":          "#a16207",
  "homework":            "#475569",
};

/**
 * Small attribution chip rendered over slide images that came from a
 * stock-photo proxy. Required by the Pexels/Unsplash terms (Pexels asks
 * for credit; Unsplash strongly recommends it). The chip is hidden in
 * presenter mode to keep the slide clean — but it still ships in the
 * slide JSON, in the PPTX export and in any printed handout.
 */
function ImageCredit({ slide }: { slide: SlideContent }) {
  const img = slide.image;
  if (!img || !img.attribution) return null;
  return (
    <div
      className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-medium leading-tight pointer-events-none"
      style={{
        background: "rgba(0,0,0,0.55)",
        color: "white",
        maxWidth: "70%",
        backdropFilter: "blur(2px)",
      }}
      title={img.licence || ""}
    >
      {img.attribution}
    </div>
  );
}

function SlideHeader({ slide, theme, Icon }: { slide: SlideContent; theme: ComposedTheme; Icon: React.ElementType }) {  const badgeColour = SLIDE_TYPE_COLOURS[slide.type] || theme.secondary;
  const ped = SLIDE_TYPE_PEDAGOGY[slide.type];
  return (
    <div className="px-10 pt-7 pb-3">
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: badgeColour }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-[1.35rem] font-bold leading-tight" style={{ color: theme.primary }}>{slide.title}</h2>
        {/* Pedagogy badge — Rosenshine + Bloom for the teacher's eye. Hidden
            in the PPTX export and in print, but visible in the on-screen editor
            so ECTs/SLT can see why each slide is here. */}
        {ped && ped.bloom !== "—" && (
          <div className="ml-auto flex items-center gap-1.5">
            {ped.rosenshine && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200" title="Rosenshine's Principles of Instruction">{ped.rosenshine}</span>
            )}
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200" title="Bloom's taxonomy band">{ped.bloom}</span>
          </div>
        )}
      </div>
      <div className="h-[3px] w-14 rounded-full" style={{ background: badgeColour }} />
    </div>
  );
}

// ─── Layout-aware renderer for generic (content / activity / extension / …) slides ──
function renderLayoutSlide(
  slide: SlideContent,
  theme: ComposedTheme,
  badgeColour: string,
  Icon: React.ElementType,
) {
  const layout = slide.layout || "bullet-list";
  const hasImage = Boolean(slide.image_prompt || slide.image?.url);
  const imgUrl = bestImageUrl(slide as any, 800, 600);

  const BulletList = ({ bullets, size = "sm" }: { bullets?: string[]; size?: "sm" | "xs" }) => (
    <div className="space-y-2">
      {(bullets || []).map((bullet, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg p-2.5" style={{ background: theme.light }}>
          {slide.visibleCheckboxes ? (
            <div className="w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5" style={{ borderColor: badgeColour }} />
          ) : (
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: badgeColour }} />
          )}
          <div className={`${size === "xs" ? "text-xs" : "text-sm"} font-medium`} style={{ color: theme.text }}>{richText(bullet, i)}</div>
        </div>
      ))}
    </div>
  );

  // Differentiation card strip — shown below content when the AI has provided
  // support / core / extension variants. Matches Lever 5 from the guide.
  const DifferentiationStrip = () => {
    const d = slide.differentiation;
    if (!d || (!d.support && !d.core && !d.extension)) return null;
    return (
      <div className="grid grid-cols-3 gap-2 mt-3">
        {d.support && (
          <div className="rounded-lg p-2" style={{ background: "#dcfce7", border: "1px solid #16a34a" }}>
            <div className="text-[9px] font-bold uppercase text-green-900 mb-0.5">Support</div>
            <div className="text-[11px] text-green-950 leading-tight">{d.support}</div>
          </div>
        )}
        {d.core && (
          <div className="rounded-lg p-2" style={{ background: "#dbeafe", border: "1px solid #2563eb" }}>
            <div className="text-[9px] font-bold uppercase text-blue-900 mb-0.5">Core</div>
            <div className="text-[11px] text-blue-950 leading-tight">{d.core}</div>
          </div>
        )}
        {d.extension && (
          <div className="rounded-lg p-2" style={{ background: "#f5f3ff", border: "1px solid #7c3aed" }}>
            <div className="text-[9px] font-bold uppercase text-purple-900 mb-0.5">Extension</div>
            <div className="text-[11px] text-purple-950 leading-tight">{d.extension}</div>
          </div>
        )}
      </div>
    );
  };

  // Completion checklist — ASC/Tourette's structured tick boxes.
  const CompletionChecklist = () => {
    if (!slide.completionChecklist || slide.completionChecklist.length === 0) return null;
    return (
      <div className="rounded-lg border bg-white p-2 mt-2" style={{ borderColor: badgeColour + "60" }}>
        <div className="text-[9px] font-bold uppercase tracking-wide text-gray-500 mb-1">Completion checklist</div>
        {slide.completionChecklist.map((item, i) => (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <div className="w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5" style={{ borderColor: badgeColour }} />
            <div className="text-[11px]" style={{ color: theme.text }}>{item}</div>
          </div>
        ))}
      </div>
    );
  };

  // Method-steps inline strip — Dyslexia/Dyscalculia method reference inside
  // activity/content slides (for when there isn't a dedicated method-steps slide).
  const MethodStepsStrip = () => {
    if (!slide.methodSteps || slide.methodSteps.length === 0) return null;
    return (
      <div className="rounded-lg border-2 bg-white p-2 mt-2" style={{ borderColor: badgeColour }}>
        <div className="text-[9px] font-bold uppercase tracking-wide text-gray-500 mb-1">Method steps</div>
        {slide.methodSteps.map((step, i) => (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: badgeColour }}>{i + 1}</div>
            <div className="text-[11px]" style={{ color: theme.text }}>{step}</div>
          </div>
        ))}
      </div>
    );
  };

  // Help-box inline strip — MLD key facts inside a content/activity slide.
  const HelpBoxStrip = () => {
    if (!slide.helpBox || slide.helpBox.length === 0) return null;
    return (
      <div className="rounded-md border border-yellow-400 bg-yellow-50 p-2 mt-2">
        <div className="text-[9px] font-bold uppercase tracking-wide text-yellow-900 mb-1">Help box</div>
        {slide.helpBox.map((item, i) => (
          <div key={i} className="text-[11px] text-yellow-950 py-0.5">• {item}</div>
        ))}
      </div>
    );
  };

  // Header-then-body shell used by most layouts
  const Shell: React.FC<{ children: React.ReactNode; contentClass?: string }> = ({ children, contentClass }) => (
    <div className="flex flex-col h-full">
      <SlideHeader slide={slide} theme={theme} Icon={Icon} />
      <div className={`flex-1 px-10 pb-7 ${contentClass || "flex flex-col justify-center gap-2"}`}>
        {children}
      </div>
    </div>
  );

  switch (layout) {
    case "two-col":
      return (
        <Shell contentClass="grid grid-cols-2 gap-5 items-start">
          <div>
            {slide.body && <div className="text-xs uppercase tracking-wide font-bold mb-2" style={{ color: badgeColour }}>{slide.body}</div>}
            <BulletList bullets={slide.bullets} />
          </div>
          <div>
            <BulletList bullets={slide.bulletsRight} />
          </div>
        </Shell>
      );

    case "hero-number":
      return (
        <Shell>
          {slide.headline && (
            <div className="text-center my-3">
              <div className="text-[4rem] font-black leading-none" style={{ color: theme.primary }}>{slide.headline}</div>
              {slide.body && <div className="text-sm text-gray-600 mt-2 italic">{slide.body}</div>}
            </div>
          )}
          <BulletList bullets={slide.bullets} />
        </Shell>
      );

    case "image-left":
    case "image-right":
      return (
        <Shell contentClass={`grid grid-cols-2 gap-5 items-center ${layout === "image-right" ? "" : "grid-flow-col-dense"}`}>
          <div className={layout === "image-right" ? "order-1" : "order-2"}>
            {slide.body && <div className="text-sm text-gray-600 mb-2 italic">{slide.body}</div>}
            {slide.question && (
              <div className="rounded-xl p-3 mb-2" style={{ background: theme.light, border: `1px solid ${badgeColour}30` }}>
                <div className="text-sm font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
              </div>
            )}
            <BulletList bullets={slide.bullets} />
          </div>
          <div className={`rounded-xl overflow-hidden h-full min-h-[220px] relative ${layout === "image-right" ? "order-2" : "order-1"}`}
               style={{ background: `#f1f5f9 center/cover no-repeat url(${imgUrl || ""})`, border: `1px solid ${badgeColour}30` }}>
            {!hasImage && <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">No image prompt provided</div>}
            <ImageCredit slide={slide} />
          </div>
        </Shell>
      );

    case "definition":
      return (
        <Shell contentClass="flex flex-col justify-center gap-4 items-center text-center">
          <div className="text-3xl font-black" style={{ color: theme.primary }}>{slide.headline || slide.title}</div>
          {slide.body && (
            <div className="max-w-2xl text-base" style={{ color: theme.text }}>{slide.body}</div>
          )}
          {slide.bullets && slide.bullets.length > 0 && (
            <div className="rounded-xl p-4 max-w-2xl" style={{ background: theme.light, border: `1px solid ${badgeColour}30` }}>
              <div className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: badgeColour }}>Example</div>
              {slide.bullets.map((b, i) => <div key={i} className="text-sm mb-1" style={{ color: theme.text }}>{b}</div>)}
            </div>
          )}
        </Shell>
      );

    case "process":
      return (
        <Shell contentClass="flex flex-col justify-center gap-3">
          {slide.body && <div className="text-sm text-gray-600 mb-1 italic">{slide.body}</div>}
          <div className="flex items-stretch gap-2 overflow-x-auto">
            {(slide.steps || []).map((step, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <div className="rounded-xl px-3 py-2 min-w-[130px] max-w-[180px]" style={{ background: theme.light, border: `1.5px solid ${badgeColour}`, color: theme.text }}>
                  <div className="text-[10px] font-bold uppercase mb-0.5" style={{ color: badgeColour }}>Step {i + 1}</div>
                  <div className="text-xs font-medium">{step}</div>
                </div>
                {i < (slide.steps?.length || 0) - 1 && <div className="text-xl flex-shrink-0" style={{ color: badgeColour }}>→</div>}
              </div>
            ))}
          </div>
        </Shell>
      );

    case "quote-block":
      return (
        <Shell contentClass="flex flex-col justify-center items-center text-center gap-2">
          {slide.quote && (
            <div className="max-w-3xl">
              <div className="text-4xl leading-none mb-2" style={{ color: badgeColour }}>“</div>
              <div className="text-xl font-medium italic leading-snug" style={{ color: theme.primary }}>{slide.quote}</div>
              <div className="text-4xl leading-none mt-2 text-right" style={{ color: badgeColour }}>”</div>
            </div>
          )}
          {slide.attribution && (
            <div className="text-sm font-semibold mt-1" style={{ color: theme.text }}>— {slide.attribution}</div>
          )}
          {slide.body && <div className="text-xs italic text-gray-500 mt-2">{slide.body}</div>}
        </Shell>
      );

    case "centered":
      return (
        <Shell contentClass="flex flex-col justify-center items-center text-center gap-3">
          {slide.headline && <div className="text-4xl font-black" style={{ color: theme.primary }}>{slide.headline}</div>}
          {slide.body && <div className="text-base max-w-2xl" style={{ color: theme.text }}>{slide.body}</div>}
          <BulletList bullets={slide.bullets} />
        </Shell>
      );

    // ── Phase 1: split-stat — hero number + supporting context cards ─────
    case "split-stat":
      return (
        <Shell contentClass="grid grid-cols-2 gap-5 items-center">
          <div className="flex flex-col items-center text-center">
            <div className="text-[5rem] font-black leading-none tracking-tight" style={{ color: badgeColour }}>
              {slide.headline || slide.bullets?.[0] || "—"}
            </div>
            {slide.subtitle && <div className="text-sm font-semibold mt-2" style={{ color: theme.text }}>{slide.subtitle}</div>}
          </div>
          <div className="space-y-2">
            {slide.body && <div className="text-xs uppercase tracking-wide font-bold" style={{ color: badgeColour }}>What this means</div>}
            {slide.body && <div className="text-sm leading-relaxed" style={{ color: theme.text }}>{slide.body}</div>}
            <BulletList bullets={(slide.bullets || []).slice(slide.headline ? 0 : 1)} />
          </div>
        </Shell>
      );

    // ── Phase 1: comparison-table — labelled side-by-side rows ──────────
    case "comparison-table": {
      const headers = slide.compareHeaders || ["A", "B"];
      const rows = slide.compareRows || (slide.bullets || []).map((b, i) => ({ label: undefined as string | undefined, left: b, right: slide.bulletsRight?.[i] || "—" }));
      return (
        <Shell contentClass="flex flex-col justify-center">
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: badgeColour + "60" }}>
            <div className="grid text-[10px] font-bold uppercase tracking-wide text-white"
                 style={{ background: badgeColour, gridTemplateColumns: rows.some(r => r.label) ? "120px 1fr 1fr" : "1fr 1fr" }}>
              {rows.some(r => r.label) && <div className="px-2 py-1.5">Aspect</div>}
              <div className="px-2 py-1.5">{headers[0]}</div>
              <div className="px-2 py-1.5" style={{ borderLeft: "1px solid rgba(255,255,255,0.2)" }}>{headers[1]}</div>
            </div>
            {rows.slice(0, 8).map((r, i) => (
              <div key={i} className="grid text-[12px]" style={{
                background: i % 2 ? "white" : theme.light,
                gridTemplateColumns: rows.some(x => x.label) ? "120px 1fr 1fr" : "1fr 1fr",
              }}>
                {rows.some(x => x.label) && <div className="px-2 py-1.5 font-semibold" style={{ color: badgeColour }}>{r.label || ""}</div>}
                <div className="px-2 py-1.5" style={{ color: theme.text }}>{r.left}</div>
                <div className="px-2 py-1.5 border-l" style={{ color: theme.text, borderColor: badgeColour + "20" }}>{r.right}</div>
              </div>
            ))}
          </div>
        </Shell>
      );
    }

    // ── Phase 1: timeline-horizontal — event nodes along an axis ────────
    case "timeline-horizontal": {
      const events = slide.timelineEvents || [];
      return (
        <Shell contentClass="flex flex-col justify-center">
          {slide.body && <div className="text-xs italic text-gray-500 mb-3 text-center">{slide.body}</div>}
          <div className="relative pt-8 pb-4">
            <div className="absolute left-0 right-0 top-12 h-1 rounded" style={{ background: badgeColour + "60" }} />
            <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(events.length, 1)}, 1fr)`, gap: 4 }}>
              {events.map((e, i) => (
                <div key={i} className="flex flex-col items-center text-center px-1">
                  <div className="text-[10px] font-bold mb-1" style={{ color: badgeColour }}>{e.date}</div>
                  <div className="w-3 h-3 rounded-full ring-4 ring-white" style={{ background: badgeColour }} />
                  <div className="mt-2 rounded-lg p-1.5 w-full" style={{ background: theme.light, border: `1px solid ${badgeColour}40` }}>
                    <div className="text-[11px] font-bold leading-tight" style={{ color: theme.primary }}>{e.title}</div>
                    {e.description && <div className="text-[9px] text-gray-600 mt-0.5 leading-tight">{e.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Shell>
      );
    }

    // ── Phase 1: card-grid — 2×3 callout cards (or 3×2 wide) ─────────────
    case "card-grid": {
      const cards = slide.cards || [];
      return (
        <Shell contentClass="grid grid-cols-3 gap-2 content-start">
          {cards.slice(0, 6).map((c, i) => (
            <div key={i} className="rounded-xl p-2.5" style={{ background: theme.light, border: `1px solid ${badgeColour}30` }}>
              {c.icon && <div className="text-xl mb-1" aria-hidden>{c.icon}</div>}
              <div className="text-[12px] font-bold mb-0.5" style={{ color: badgeColour }}>{c.title}</div>
              <div className="text-[11px] leading-tight" style={{ color: theme.text }}>{c.body}</div>
            </div>
          ))}
        </Shell>
      );
    }

    // ── Phase 1: before-after — contrasting two-state compare ────────────
    case "before-after": {
      const ba = slide.beforeAfter || { before: slide.bullets?.[0] || "—", after: slide.bulletsRight?.[0] || "—" };
      const beforeLabel = ba.beforeLabel || "Before";
      const afterLabel = ba.afterLabel || "After";
      return (
        <Shell contentClass="grid grid-cols-2 gap-3 items-stretch">
          <div className="rounded-2xl p-4 flex flex-col" style={{ background: "#fef2f2", border: "2px solid #fca5a5" }}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-red-700 mb-2">{beforeLabel}</div>
            <div className="text-sm leading-relaxed text-red-900 flex-1">{ba.before}</div>
          </div>
          <div className="rounded-2xl p-4 flex flex-col" style={{ background: "#dcfce7", border: "2px solid #86efac" }}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-green-700 mb-2">{afterLabel}</div>
            <div className="text-sm leading-relaxed text-green-900 flex-1">{ba.after}</div>
          </div>
        </Shell>
      );
    }

    // ── Phase 1: quote-portrait — quote + image of speaker on the left ───
    case "quote-portrait": {
      const imgUrlQp = bestImageUrl(slide as any, 400, 500);
      return (
        <Shell contentClass="grid grid-cols-[180px_1fr] gap-5 items-center">
          <div className="rounded-2xl overflow-hidden h-full min-h-[220px] relative"
               style={{ background: `${theme.light} center/cover no-repeat url(${imgUrlQp || ""})`, border: `1px solid ${badgeColour}30` }}>
            {!imgUrlQp && <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">portrait</div>}
            <ImageCredit slide={slide} />
          </div>
          <div>
            <div className="text-3xl leading-none mb-2" style={{ color: badgeColour }}>“</div>
            <div className="text-lg italic font-medium leading-snug" style={{ color: theme.primary }}>{slide.quote || slide.body || "(quote)"}</div>
            {slide.attribution && (
              <div className="text-sm font-semibold mt-3" style={{ color: theme.text }}>— {slide.attribution}</div>
            )}
          </div>
        </Shell>
      );
    }

    // ── Phase 1: diagram-callouts -- central area with positioned labels ──
    case "diagram-callouts": {
      const callouts = slide.diagramCallouts || [];
      const posClass: Record<string, string> = {
        "top-left": "top-2 left-2", "top": "top-2 left-1/2 -translate-x-1/2", "top-right": "top-2 right-2",
        "right": "right-2 top-1/2 -translate-y-1/2", "bottom-right": "bottom-2 right-2",
        "bottom": "bottom-2 left-1/2 -translate-x-1/2", "bottom-left": "bottom-2 left-2",
        "left": "left-2 top-1/2 -translate-y-1/2",
      };
      return (
        <Shell contentClass="relative">
          {slide.diagram ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <PresentationDiagram diagram={slide.diagram} theme={theme} />
            </div>
          ) : (
            <div className="absolute inset-0 rounded-xl border-2 border-dashed flex items-center justify-center"
                 style={{ borderColor: badgeColour + "60", background: theme.light }}>
              <div className="text-xs italic text-gray-500 max-w-md text-center px-4">{slide.diagramDescription || "Diagram"}</div>
            </div>
          )}
          {callouts.slice(0, 8).map((c, i) => (
            <div key={i} className={`absolute ${posClass[c.position] || "top-2 left-2"} rounded-lg px-2 py-1`} style={{ background: "white", border: `1.5px solid ${badgeColour}`, boxShadow: "0 2px 4px rgba(0,0,0,0.08)" }}>
              <div className="text-[11px] font-bold" style={{ color: badgeColour }}>{c.label}</div>
              {c.description && <div className="text-[10px] text-gray-600 max-w-[180px]">{c.description}</div>}
            </div>
          ))}
        </Shell>
      );
    }

    case "bullet-list":
    case "full":
    default:
      return (
        <Shell>
          {slide.body && <div className="text-sm text-gray-600 mb-1 italic">{slide.body}</div>}
          {slide.question && (
            <div className="rounded-xl p-3.5 mb-1" style={{ background: theme.light, border: `1px solid ${badgeColour}30` }}>
              <div className="text-sm font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
            </div>
          )}
          <BulletList bullets={slide.bullets} />
          <MethodStepsStrip />
          <HelpBoxStrip />
          <CompletionChecklist />
          <DifferentiationStrip />
        </Shell>
      );
  }
}

function FullSlideView({
  slide,
  theme,
  index,
  total,
  revealLevel = Infinity,
  branding,
  symbolSupport = false,
}: {
  slide: SlideContent;
  theme: ComposedTheme;
  index: number;
  total: number;
  revealLevel?: number;
  /** Per-school branding watermark — applied to title slide always, and to
   *  every slide when `branding.showOnEverySlide` is true. */
  branding?: SchoolIdentity;
  /** V5 — when true, render an ARASAAC pictogram above each word-bank /
   *  key-terms / vocab-reference term (opt-in SEND symbol support). */
  symbolSupport?: boolean;
}) {
  const Icon = SLIDE_ICONS[slide.type] || BookOpen;
  const badgeColour = SLIDE_TYPE_COLOURS[slide.type] || theme.secondary;

  const renderSlideContent = () => {
    switch (slide.type) {

      // ── Title ──────────────────────────────────────────────────────────────
      // titleVariant controls layout: centered (default), split-image,
      // asymmetric or module-divider. Each variant uses the chosen theme
      // gradient for the dark area; only the composition changes.
      case "title": {
        const variant = slide.titleVariant || "centered";
        const bgImage = bestImageUrl(slide as any, 1280, 720);
        if (variant === "split-image") {
          return (
            <div className="flex h-full">
              <div className="w-1/2 flex flex-col justify-center px-10 py-8 gap-3" style={{ background: theme.gradient }}>
                <div className="text-[2.1rem] font-black leading-tight" style={{ color: "white" }}>{slide.title}</div>
                {slide.subtitle && <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{slide.subtitle}</div>}
                {slide.body && (
                  <div className="text-sm rounded-xl px-4 py-3 mt-2" style={{ color: "rgba(255,255,255,0.95)", background: "rgba(0,0,0,0.25)" }}>{slide.body}</div>
                )}
              </div>
              <div className="w-1/2 bg-cover bg-center relative" style={{ backgroundImage: bgImage ? `url(${bgImage})` : "linear-gradient(135deg,#cbd5e1,#94a3b8)" }}>
                <ImageCredit slide={slide} />
              </div>
            </div>
          );
        }
        if (variant === "asymmetric") {
          return (
            <div className="relative h-full overflow-hidden" style={{ background: theme.bg }}>
              {bgImage && <div className="absolute inset-0 opacity-15 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />}
              <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full" style={{ background: theme.gradient, opacity: 0.85 }} />
              <div className="absolute -bottom-12 -left-8 w-56 h-56 rounded-full" style={{ background: theme.accent, opacity: 0.5 }} />
              <div className="relative h-full flex flex-col justify-center px-14 max-w-[60%]">
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: theme.secondary }}>Lesson</div>
                <div className="text-[2.4rem] font-black leading-tight mb-3" style={{ color: theme.primary }}>{slide.title}</div>
                {slide.subtitle && <div className="text-sm font-medium" style={{ color: theme.text }}>{slide.subtitle}</div>}
                {slide.body && <div className="text-xs italic mt-3 max-w-md" style={{ color: theme.text }}>{slide.body}</div>}
              </div>
            </div>
          );
        }
        if (variant === "module-divider") {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center px-14 gap-3" style={{ background: theme.gradient, color: "white" }}>
              <div className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-80">Module</div>
              <div className="text-[3rem] font-black leading-none">{slide.title}</div>
              <div className="h-1 w-32 rounded-full" style={{ background: theme.accent }} />
              {slide.subtitle && <div className="text-base font-medium opacity-90 max-w-2xl">{slide.subtitle}</div>}
              {slide.body && <div className="text-sm italic opacity-80 max-w-xl mt-2">{slide.body}</div>}
            </div>
          );
        }
        // Default: centered (legacy behaviour)
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-14 gap-4">
            {bgImage && (
              <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
            )}
            <div className="relative">
              <div className="text-[2.4rem] font-black mb-3 leading-tight" style={{ color: "white" }}>{slide.title}</div>
              {slide.subtitle && (
                <div className="text-base font-medium mb-3" style={{ color: "rgba(255,255,255,0.85)" }}>{slide.subtitle}</div>
              )}
              {slide.body && (
                <div className="text-sm max-w-xl mx-auto rounded-xl px-5 py-3" style={{ color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.25)" }}>{slide.body}</div>
              )}
            </div>
          </div>
        );
      }

      // ── Section divider — chapter break inside a longer deck ─────────────
      case "section-divider":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-14 gap-3" style={{ background: theme.gradient, color: "white" }}>
            <div className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-75">Part</div>
            <div className="text-[3rem] font-black leading-none">{slide.title}</div>
            {slide.subtitle && <div className="text-base font-medium opacity-90 max-w-2xl">{slide.subtitle}</div>}
            {slide.body && <div className="text-sm italic opacity-80 max-w-xl mt-2">{slide.body}</div>}
          </div>
        );

      // ── Learning Objectives ────────────────────────────────────────────────
      // Prefer the structured successCriteria ({must, should, could}) when
      // the AI provides it — this is the teacher-framework format. Fall back
      // to the legacy All:/Most:/Some: bullet prefixes for older decks.
      case "learning-objectives":
        if (slide.successCriteria) {
          const bands: Array<["MUST"|"SHOULD"|"COULD", string, string, string]> = [
            ["MUST",   slide.successCriteria.must,   "#dcfce7", "#16a34a"],
            ["SHOULD", slide.successCriteria.should, "#dbeafe", "#2563eb"],
            ["COULD",  slide.successCriteria.could,  "#fef3c7", "#d97706"],
          ];
          return (
            <div className="flex flex-col h-full">
              <SlideHeader slide={slide} theme={theme} Icon={Target} />
              <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-2.5">
                {bands.map(([label, text, bg, border]) => (
                  <div key={label} className="flex items-start gap-3 rounded-xl p-3" style={{ background: bg, border: `2px solid ${border}` }}>
                    <div className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ background: border }}>{label}</div>
                    <div className="text-sm font-medium" style={{ color: theme.text }}>{text}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Target} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-2.5">
              {slide.bullets?.map((bullet, i) => {
                const isAll  = bullet.startsWith("All:");
                const isMost = bullet.startsWith("Most:");
                const isSome = bullet.startsWith("Some:");
                const bg     = isAll ? "#dcfce7" : isMost ? "#dbeafe" : isSome ? "#fef3c7" : theme.light;
                const border = isAll ? "#16a34a" : isMost ? "#2563eb" : isSome ? "#d97706" : theme.secondary;
                const label  = isAll ? "ALL" : isMost ? "MOST" : isSome ? "SOME" : `${i + 1}`;
                const text   = bullet.replace(/^(All:|Most:|Some:)\s*/, "");
                return (
                  <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: bg, border: `2px solid ${border}` }}>
                    <div className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ background: border }}>{label}</div>
                    <div className="text-sm font-medium" style={{ color: theme.text }}>{text}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      // ── Retrieval Warm-Up ──────────────────────────────────────────────────
      case "retrieval-warm-up":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Brain} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: badgeColour }}>
                Retrieve from memory — no notes
              </div>
              {(slide.retrievalQuestions || slide.bullets || []).map((q, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ background: theme.light, border: `1px solid ${badgeColour}30` }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: badgeColour }}>{i + 1}</div>
                  <div className="text-sm font-medium" style={{ color: theme.text }}>{q}</div>
                </div>
              ))}
            </div>
          </div>
        );

      // ── Key Terms ──────────────────────────────────────────────────────────
      case "key-terms":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={List} />
            <div className="flex-1 px-10 pb-7 grid grid-cols-2 gap-2 overflow-hidden">
              {slide.terms?.slice(0, 8).map((item, i) => (
                <div key={i} className="rounded-lg p-2.5 border flex items-start gap-2" style={{ background: theme.light, borderColor: badgeColour + "40" }}>
                  {symbolSupport && <TermSymbol term={item.term} size={40} />}
                  <div className="min-w-0">
                    <div className="text-xs font-bold mb-1" style={{ color: badgeColour }}>{item.term}</div>
                    <div className="text-xs text-gray-600 leading-relaxed">{item.definition}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ── Worked Example ─────────────────────────────────────────────────────
      // Prefer the structured workedExampleBox ({problem, steps, answer, units,
      // commonError}) when the AI provides it — renders as a bordered box
      // with a distinct background so it's visually identifiable as a worked
      // example (per the teacher-framework guide). Falls back to the legacy
      // loose `steps` array for older decks.
      case "worked-example":
        if (slide.workedExampleBox) {
          const w = slide.workedExampleBox;
          return (
            <div className="flex flex-col h-full">
              <SlideHeader slide={slide} theme={theme} Icon={Brain} />
              <div className="flex-1 px-10 pb-7 flex flex-col justify-center">
                <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: badgeColour, background: theme.light }}>
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white" style={{ background: badgeColour }}>
                    Worked Example
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Problem</div>
                      <div className="text-sm font-medium" style={{ color: theme.text, fontFamily: "Consolas, monospace" }}>{w.problem}</div>
                    </div>
                    <div className="space-y-1.5">
                      {w.steps.map((step, i) => {
                        const stepShown = revealLevel >= i + 1;
                        return (
                          <div key={i} className="flex items-start gap-2" style={{ opacity: stepShown ? 1 : 0.25 }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: badgeColour }}>{i + 1}</div>
                            <div className="flex-1 text-sm rounded-lg bg-white border border-gray-200 px-2 py-1" style={{ color: theme.text, fontFamily: "Consolas, monospace" }}>
                              {stepShown ? step : "·".repeat(Math.min(40, step.length))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200" style={{ opacity: revealLevel >= w.steps.length + 1 ? 1 : 0.25 }}>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Answer</div>
                      <div className="text-base font-black" style={{ color: badgeColour, fontFamily: "Consolas, monospace" }}>
                        {revealLevel >= w.steps.length + 1 ? `${w.answer}${w.units ? ` ${w.units}` : ""}` : "—"}
                      </div>
                    </div>
                    {w.commonError && (
                      <div className="rounded-md border border-red-300 bg-red-50 px-2 py-1.5 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-red-800">Common error: </span>
                        <span className="text-[11px] text-red-900">{w.commonError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Brain} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-2">
              {slide.body && (
                <div className="text-xs italic text-gray-500 mb-1">{slide.body}</div>
              )}
              {slide.steps?.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: badgeColour }}>{i + 1}</div>
                  <div className="flex-1 rounded-lg p-2.5" style={{ background: theme.light }}>
                    <div className="text-sm" style={{ color: theme.text }}>{step}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ── Pause & Solve ──────────────────────────────────────────────────────
      case "pause-and-solve":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Brain} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-3">
              {slide.question && (
                <div className="rounded-2xl p-5 text-center" style={{ background: "#fef2f2", border: `2px solid ${badgeColour}` }}>
                  <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: badgeColour }}>Your turn — attempt this now</div>
                  <div className="text-lg font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
                </div>
              )}
              {slide.steps && slide.steps.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: badgeColour }}>Method</div>
                  {slide.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: badgeColour }}>{i + 1}</div>
                      <div className="text-xs" style={{ color: theme.text }}>{step}</div>
                    </div>
                  ))}
                </div>
              )}
              {slide.answer && (
                <div className="rounded-lg p-2.5 text-center" style={{ background: revealLevel >= 1 ? "#dcfce7" : "#f1f5f9", border: `1px solid ${revealLevel >= 1 ? "#16a34a" : "#cbd5e1"}` }}>
                  <div className="text-xs font-bold" style={{ color: revealLevel >= 1 ? "#15803d" : "#64748b" }}>
                    {revealLevel >= 1 ? `Answer: ${slide.answer}` : "Answer hidden — press → or Space to reveal"}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      // ── Check Understanding / Mini Quiz ────────────────────────────────────
      case "check-understanding":
      case "mini-quiz":
        if (slide.type === "mini-quiz" && slide.retrievalQuestions) {
          return (
            <div className="flex flex-col h-full">
              <SlideHeader slide={slide} theme={theme} Icon={CheckSquare} />
              <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-2">
                {slide.retrievalQuestions.map((q, i) => {
                  const parts = q.split(/\s*A:\s*/);
                  const showAnswer = revealLevel >= 1;
                  return (
                    <div key={i} className="rounded-lg p-2.5" style={{ background: theme.light, border: `1px solid ${badgeColour}30` }}>
                      <div className="text-sm font-medium" style={{ color: theme.text }}>
                        <span className="font-bold" style={{ color: badgeColour }}>Q{i + 1}: </span>{parts[0]}
                      </div>
                      {parts[1] && (
                        showAnswer
                          ? <div className="text-xs mt-1 font-medium text-green-700">✓ {parts[1]}</div>
                          : <div className="text-xs mt-1 italic text-gray-400">— answer hidden —</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={CheckSquare} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-3">
              {slide.question && (
                <div className="rounded-xl p-4 text-center" style={{ background: theme.light }}>
                  <div className="text-base font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
                </div>
              )}
              {slide.options && (
                <div className="grid grid-cols-2 gap-2">
                  {slide.options.map((opt, i) => {
                    const letters = ["A", "B", "C", "D"];
                    const isAnswer = (slide.answer === letters[i] || slide.answer === opt) && revealLevel >= 1;
                    return (
                      <div key={i} className="flex items-center gap-2 rounded-lg p-2.5 border-2" style={{
                        borderColor: isAnswer ? "#16a34a" : "#e5e7eb",
                        background: isAnswer ? "#dcfce7" : "white",
                      }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: isAnswer ? "#16a34a" : badgeColour }}>{letters[i]}</div>
                        <div className="text-sm" style={{ color: theme.text }}>{opt}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      // ── Misconception Buster ───────────────────────────────────────────────
      case "misconception-bust":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Lightbulb} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-3">
              {slide.misconception && (
                <div className="rounded-xl p-3.5" style={{ background: "#fef2f2", border: "2px solid #dc2626" }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-red-600 mb-1">Common Misconception</div>
                  <div className="text-sm font-medium text-red-800">"{slide.misconception}"</div>
                </div>
              )}
              {slide.correction && (
                <div className="rounded-xl p-3.5" style={{ background: "#dcfce7", border: "2px solid #16a34a" }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-green-700 mb-1">Actually…</div>
                  <div className="text-sm font-medium text-green-900">{slide.correction}</div>
                </div>
              )}
              {slide.bullets && slide.bullets.length > 0 && (
                <div className="space-y-1.5">
                  {slide.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5" style={{ background: badgeColour }}>{i + 1}</div>
                      <div className="text-xs" style={{ color: theme.text }}>{b}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      // ── Think Pair Share ───────────────────────────────────────────────────
      case "think-pair-share":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={HelpCircle} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-3">
              {slide.question && (
                <div className="rounded-2xl p-4 text-center" style={{ background: theme.light, border: `2px solid ${badgeColour}30` }}>
                  <div className="text-base font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {["🤔 Think", "💬 Pair", "📣 Share"].map((label, i) => (
                  <div key={i} className="rounded-lg p-2.5 text-center" style={{ background: theme.light, border: `1px solid ${badgeColour}40` }}>
                    <div className="text-sm font-bold" style={{ color: badgeColour }}>{label}</div>
                    {slide.bullets && slide.bullets[i] && (
                      <div className="text-xs mt-1 text-gray-600">{slide.bullets[i]}</div>
                    )}
                  </div>
                ))}
              </div>
              {slide.body && (
                <div className="text-xs italic text-gray-500 text-center">{slide.body}</div>
              )}
            </div>
          </div>
        );

      // ── Real World Link ────────────────────────────────────────────────────
      case "real-world-link":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={BookOpen} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-3">
              {slide.realWorldContext && (
                <div className="rounded-xl p-4" style={{ background: "#f0fdf4", border: `2px solid ${badgeColour}` }}>
                  <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: badgeColour }}>Real-World Context</div>
                  <div className="text-sm font-medium text-gray-800">{slide.realWorldContext}</div>
                </div>
              )}
              {slide.bullets && slide.bullets.length > 0 && (
                <div className="space-y-2">
                  {slide.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg p-2.5" style={{ background: theme.light }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: badgeColour }} />
                      <div className="text-sm" style={{ color: theme.text }}>{b}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      // ── Exam Technique ─────────────────────────────────────────────────────
      case "exam-technique":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Target} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-3">
              {slide.examTip && (
                <div className="rounded-xl p-3.5" style={{ background: "#dbeafe", border: "2px solid #2563eb" }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-blue-700 mb-1">Exam Tip</div>
                  <div className="text-sm font-semibold text-blue-900">{slide.examTip}</div>
                </div>
              )}
              {slide.markSchemeHint && (
                <div className="rounded-xl p-3.5" style={{ background: "#fef3c7", border: "2px solid #d97706" }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-amber-700 mb-1">What Examiners Look For</div>
                  <div className="text-sm font-medium text-amber-900">{slide.markSchemeHint}</div>
                </div>
              )}
              {slide.bullets && slide.bullets.length > 0 && (
                <div className="space-y-1.5">
                  {slide.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5" style={{ background: badgeColour }}>{i + 1}</div>
                      <div className="text-xs" style={{ color: theme.text }}>{b}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      // ── Diagram Label ──────────────────────────────────────────────────────
      case "diagram-label":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Monitor} />
            <div className="flex-1 px-10 pb-7 flex gap-6">
              {/* Left: diagram description box */}
              <div className="flex-1 flex flex-col justify-center">
                {slide.diagram ? (
                  <PresentationDiagram diagram={slide.diagram} theme={theme} />
                ) : (
                  <div className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center" style={{ borderColor: badgeColour + "60", background: theme.light, minHeight: "140px" }}>
                    <div className="text-xs text-gray-500 mb-2">Diagram Area</div>
                    {slide.diagramDescription && (
                      <div className="text-xs text-gray-700 italic">{slide.diagramDescription}</div>
                    )}
                  </div>
                )}
              </div>
              {/* Right: labels + question */}
              <div className="w-48 flex flex-col justify-center gap-2">
                {slide.question && (
                  <div className="text-xs font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
                )}
                {slide.diagramLabels?.map((label, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ background: theme.light, border: `1px solid ${badgeColour}40` }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: badgeColour }}>{i + 1}</div>
                    <div className="text-xs" style={{ color: theme.text }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ── Hook / Discussion / Exit Ticket ────────────────────────────────────
      case "hook":
      case "discussion":
      case "exit-ticket":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={HelpCircle} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-4">
              {slide.question && (
                <div className="rounded-2xl p-5 text-center" style={{ background: theme.light, border: `2px solid ${badgeColour}30` }}>
                  <div className="text-lg font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
                </div>
              )}
              {slide.bullets && slide.bullets.length > 0 && (
                <div className="space-y-2">
                  {slide.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5" style={{ background: badgeColour }}>{i + 1}</div>
                      <div className="text-sm" style={{ color: theme.text }}>{b}</div>
                    </div>
                  ))}
                </div>
              )}
              {slide.body && (
                <div className="text-sm italic text-gray-500 text-center">{slide.body}</div>
              )}
            </div>
          </div>
        );

      // ── Summary ────────────────────────────────────────────────────────────
      case "summary":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={ArrowRight} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-2">
              {slide.bullets && slide.bullets.length > 0 && (
                <div className="space-y-2">
                  {slide.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg p-3" style={{ background: theme.light, border: `1px solid ${badgeColour}30` }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: badgeColour }}>✓</div>
                      <div className="text-sm font-medium" style={{ color: theme.text }}>{b}</div>
                    </div>
                  ))}
                </div>
              )}
              {slide.body && (
                <div className="mt-2 text-xs italic text-gray-500 text-center border-t pt-2">{slide.body}</div>
              )}
            </div>
          </div>
        );

      // ── Primary: Story Time ──────────────────────────────────────────────
      case "story-time":
        return (
          <div className="flex flex-col h-full" style={{ background: `linear-gradient(135deg, ${theme.light} 0%, ${theme.bg} 100%)` }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: badgeColour, color: "white" }}>📖</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex flex-col justify-center gap-4">
              {slide.body && (
                <div className="rounded-3xl p-5 text-[1.1rem] font-semibold leading-relaxed" style={{ background: theme.light, border: `3px solid ${badgeColour}`, color: theme.text }}>
                  {slide.body}
                </div>
              )}
              {slide.image_prompt && (
                <div className="rounded-2xl overflow-hidden h-28 bg-cover bg-center opacity-80 relative" style={{ backgroundImage: `url(${bestImageUrl(slide as any, 600, 200) || ""})`, border: `3px solid ${theme.accent}` }}>
                  <ImageCredit slide={slide} />
                </div>
              )}
            </div>
          </div>
        );

      // ── Primary: Draw It ──────────────────────────────────────────────────
      case "draw-it":
        return (
          <div className="flex flex-col h-full" style={{ background: `linear-gradient(135deg, ${theme.light} 0%, ${theme.bg} 100%)` }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: badgeColour, color: "white" }}>✏️</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex gap-4 items-center">
              <div className="flex-1">
                {slide.question && (
                  <div className="text-[1.1rem] font-bold mb-4 rounded-2xl p-4" style={{ background: theme.light, border: `3px solid ${badgeColour}`, color: theme.text }}>
                    {slide.question}
                  </div>
                )}
                {slide.body && <div className="text-sm font-medium" style={{ color: theme.text }}>{slide.body}</div>}
              </div>
              <div className="flex-1 rounded-3xl flex items-center justify-center" style={{ border: `3px dashed ${badgeColour}`, background: "white", minHeight: "120px" }}>
                <div className="text-center" style={{ color: badgeColour, opacity: 0.6 }}>
                  <div className="text-4xl mb-1">🖊️</div>
                  <div className="text-xs font-semibold">Draw here</div>
                </div>
              </div>
            </div>
          </div>
        );

      // ── Primary: Sort It ──────────────────────────────────────────────────
      case "sort-it":
        return (
          <div className="flex flex-col h-full" style={{ background: `linear-gradient(135deg, ${theme.light} 0%, ${theme.bg} 100%)` }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: badgeColour, color: "white" }}>🗂️</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex flex-col justify-center gap-3">
              {slide.question && <div className="text-base font-bold" style={{ color: theme.text }}>{slide.question}</div>}
              <div className="flex gap-3 flex-wrap">
                {slide.bullets?.map((item, i) => (
                  <div key={i} className="px-4 py-2 rounded-2xl text-sm font-bold" style={{ background: ["#fef9c3","#dcfce7","#dbeafe","#fce7f3","#f3e8ff","#ffedd5"][i%6], border: `2px solid ${["#ca8a04","#16a34a","#2563eb","#db2777","#7c3aed","#ea580c"][i%6]}`, color: ["#713f12","#14532d","#1e3a8a","#831843","#4c1d95","#431407"][i%6] }}>
                    {item}
                  </div>
                ))}
              </div>
              {slide.body && (
                <div className="flex gap-3 mt-2">
                  {slide.body.split("/").map((cat, i) => (
                    <div key={i} className="flex-1 rounded-2xl p-3 text-center font-bold text-sm" style={{ background: i===0?"#dcfce7":"#dbeafe", border: `2px dashed ${i===0?"#16a34a":"#2563eb"}`, color: i===0?"#14532d":"#1e3a8a", minHeight: "50px" }}>
                      {cat.trim()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      // ── Primary: Match It ──────────────────────────────────────────────────
      case "match-it":
        return (
          <div className="flex flex-col h-full" style={{ background: `linear-gradient(135deg, ${theme.light} 0%, ${theme.bg} 100%)` }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: badgeColour, color: "white" }}>⚡</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex gap-4 items-center">
              <div className="flex-1 flex flex-col gap-2">
                {slide.bullets?.map((item, i) => (
                  <div key={i} className="rounded-xl px-4 py-2 text-sm font-bold" style={{ background: theme.light, border: `2px solid ${badgeColour}`, color: theme.text }}>{item}</div>
                ))}
              </div>
              <div className="flex flex-col gap-2 text-2xl text-gray-300">
                {slide.bullets?.map((_, i) => <div key={i}>→</div>)}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {slide.body?.split("|").map((item, i) => (
                  <div key={i} className="rounded-xl px-4 py-2 text-sm font-bold" style={{ background: theme.light, border: `2px solid ${theme.accent}`, color: theme.text }}>{item.trim()}</div>
                ))}
              </div>
            </div>
          </div>
        );

      // ── Primary: Fill the Gap ──────────────────────────────────────────────
      case "fill-the-gap":
        return (
          <div className="flex flex-col h-full" style={{ background: `linear-gradient(135deg, ${theme.light} 0%, ${theme.bg} 100%)` }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: badgeColour, color: "white" }}>✍️</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex flex-col justify-center gap-4">
              {slide.question && (
                <div className="text-[1.1rem] font-bold rounded-2xl p-5 leading-loose" style={{ background: theme.light, border: `3px solid ${badgeColour}`, color: theme.text }}>
                  {slide.question.split("___").map((part, i, arr) => (
                    <span key={i}>{part}{i < arr.length-1 && <span className="inline-block border-b-4 w-20 mx-1 align-bottom" style={{ borderColor: badgeColour }} />}</span>
                  ))}
                </div>
              )}
              {slide.bullets && slide.bullets.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: badgeColour }}>Word Bank</div>
                  <div className="flex gap-2 flex-wrap">
                    {slide.bullets.map((word, i) => (
                      <div key={i} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ background: theme.light, border: `2px solid ${badgeColour}`, color: theme.text }}>{word}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      // ── Primary: Spot the Mistake ──────────────────────────────────────────
      case "spot-the-mistake":
        return (
          <div className="flex flex-col h-full" style={{ background: `linear-gradient(135deg, ${theme.light} 0%, ${theme.bg} 100%)` }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "#dc2626", color: "white" }}>🔍</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex flex-col justify-center gap-4">
              {slide.question && (
                <div className="text-[1.1rem] font-bold rounded-2xl p-5" style={{ background: "#fee2e2", border: "3px solid #dc2626", color: "#7f1d1d" }}>
                  <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#dc2626" }}>Can you spot the mistake? 🕵️</div>
                  {slide.question}
                </div>
              )}
              {slide.answer && (
                <div className="text-sm font-semibold rounded-xl p-3" style={{ background: "#dcfce7", border: "2px solid #16a34a", color: "#14532d" }}>
                  <span className="font-bold">✓ The mistake was: </span>{slide.answer}
                </div>
              )}
            </div>
          </div>
        );

      // ── Primary: Number Talk ──────────────────────────────────────────────
      case "number-talk":
        return (
          <div className="flex flex-col h-full" style={{ background: `linear-gradient(135deg, ${theme.light} 0%, ${theme.bg} 100%)` }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: badgeColour, color: "white" }}>🔢</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex gap-5 items-center">
              {slide.question && (
                <div className="w-32 h-32 rounded-3xl flex items-center justify-center text-[2.5rem] font-black flex-shrink-0" style={{ background: theme.light, border: `4px solid ${badgeColour}`, color: theme.primary }}>
                  {slide.question}
                </div>
              )}
              <div className="flex-1 flex flex-col gap-2">
                {slide.bullets?.map((way, i) => (
                  <div key={i} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: theme.light, border: `2px solid ${badgeColour}`, color: theme.text }}>
                    {way}
                  </div>
                ))}
                {slide.body && <div className="text-xs font-semibold italic mt-1" style={{ color: theme.text, opacity: 0.7 }}>{slide.body}</div>}
              </div>
            </div>
          </div>
        );

      // ── Vocab Reference ────────────────────────────────────────────────────
      // Full-width glossary table. Renders vocabTable (term, definition, example?)
      // as a multi-row card. Falls back to `terms` for back-compat with key-terms
      // decks that accidentally choose this type.
      case "vocab-reference": {
        const rows = slide.vocabTable && slide.vocabTable.length
          ? slide.vocabTable
          : (slide.terms || []).map(t => ({ term: t.term, definition: t.definition, example: undefined as string | undefined }));
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={List} />
            <div className="flex-1 px-8 pb-7 overflow-hidden">
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: badgeColour + "60" }}>
                <div className="grid grid-cols-[160px_1fr_180px] text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: badgeColour }}>
                  <div className="px-2 py-1.5">Term</div>
                  <div className="px-2 py-1.5">Definition</div>
                  <div className="px-2 py-1.5">Example</div>
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {rows.slice(0, 12).map((r, i) => (
                    <div key={i} className="grid grid-cols-[160px_1fr_180px] text-[11px]" style={{ background: i % 2 ? "white" : theme.light }}>
                      <div className="px-2 py-1.5 font-bold flex items-center gap-1.5" style={{ color: badgeColour }}>
                        {symbolSupport && <TermSymbol term={r.term} size={28} />}
                        <span>{r.term}</span>
                      </div>
                      <div className="px-2 py-1.5" style={{ color: theme.text }}>{r.definition}</div>
                      <div className="px-2 py-1.5 italic text-gray-600">{r.example || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      // ── Model Answer ───────────────────────────────────────────────────────
      // Displays the full model answer with an annotated mark scheme breakdown.
      case "model-answer":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Target} />
            <div className="flex-1 px-8 pb-7 grid grid-cols-[1fr_260px] gap-3">
              <div className="rounded-xl border-2 p-3 overflow-y-auto" style={{ borderColor: badgeColour, background: theme.light }}>
                <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: badgeColour }}>Model Answer</div>
                <div className="text-sm leading-relaxed" style={{ color: theme.text, opacity: revealLevel >= 1 ? 1 : 0.15 }}>
                  {revealLevel >= 1 ? (slide.body || slide.answer || "(Model answer)") : "[ press → to reveal the model answer ]"}
                </div>
              </div>
              <div className="space-y-1.5 overflow-y-auto">
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Mark Scheme</div>
                {(slide.markScheme || []).map((m, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-white border p-1.5" style={{ borderColor: badgeColour + "40" }}>
                    <div className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white flex-shrink-0" style={{ background: badgeColour }}>+{m.marks}</div>
                    <div className="text-[11px] leading-tight" style={{ color: theme.text }}>{m.point}</div>
                  </div>
                ))}
                {slide.examTip && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-1.5 mt-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-amber-900 mb-0.5">Tip</div>
                    <div className="text-[11px] text-amber-950">{slide.examTip}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // ── Exam Practice ──────────────────────────────────────────────────────
      // Timed exam card with mark chip, time chip, and command-word badge.
      case "exam-practice": {
        const q = slide.examQuestion;
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={GraduationCap} />
            <div className="flex-1 px-10 pb-7 flex flex-col gap-3 justify-center">
              <div className="rounded-2xl border-2 p-4" style={{ borderColor: badgeColour, background: "#fffbeb" }}>
                <div className="flex items-center gap-2 mb-2">
                  {q?.commandWord && <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold uppercase">{q.commandWord}</span>}
                  {q?.marks != null && <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold">[{q.marks} marks]</span>}
                  {q?.timeMins != null && <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold">⏱ {q.timeMins} min</span>}
                </div>
                <div className="text-base font-medium leading-relaxed" style={{ color: theme.text }}>
                  {q?.stem || slide.question || slide.body}
                </div>
              </div>
              {slide.differentiation && (
                <div className="grid grid-cols-3 gap-2">
                  {slide.differentiation.support && (
                    <div className="rounded-lg p-2" style={{ background: "#dcfce7", border: "1px solid #16a34a" }}>
                      <div className="text-[9px] font-bold uppercase text-green-900 mb-0.5">Support</div>
                      <div className="text-[11px] text-green-950">{slide.differentiation.support}</div>
                    </div>
                  )}
                  {slide.differentiation.core && (
                    <div className="rounded-lg p-2" style={{ background: "#dbeafe", border: "1px solid #2563eb" }}>
                      <div className="text-[9px] font-bold uppercase text-blue-900 mb-0.5">Core</div>
                      <div className="text-[11px] text-blue-950">{slide.differentiation.core}</div>
                    </div>
                  )}
                  {slide.differentiation.extension && (
                    <div className="rounded-lg p-2" style={{ background: "#f5f3ff", border: "1px solid #7c3aed" }}>
                      <div className="text-[9px] font-bold uppercase text-purple-900 mb-0.5">Extension</div>
                      <div className="text-[11px] text-purple-950">{slide.differentiation.extension}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      // ── SEND: Brain Break (ADHD) ──────────────────────────────────────────
      case "brain-break":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-14 gap-3" style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }}>
            <div className="text-6xl">🧠</div>
            <div className="text-4xl font-black tracking-tight" style={{ color: "#92400e" }}>BRAIN BREAK</div>
            <div className="text-lg font-semibold" style={{ color: "#92400e" }}>{slide.body || "Stand up and stretch for 30 seconds"}</div>
          </div>
        );

      // ── SEND: Check-In (Anxiety/SEMH) ─────────────────────────────────────
      case "checkin":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-10 gap-4">
            <div className="text-2xl font-bold" style={{ color: theme.primary }}>{slide.title || "How are you feeling?"}</div>
            <div className="flex gap-3 flex-wrap justify-center">
              {["😀 Calm","🙂 OK","😐 Not sure","😟 Worried","😣 Struggling"].map((f, i) => (
                <div key={i} className="px-3 py-2 rounded-xl border-2 text-sm font-semibold" style={{ background: "white", borderColor: "#14b8a6" }}>{f}</div>
              ))}
            </div>
            {slide.body && <div className="text-xs italic text-gray-600 mt-1">{slide.body}</div>}
          </div>
        );

      // ── SEND: Method Steps (Dyslexia/Dyscalculia) ─────────────────────────
      case "method-steps":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={List} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-2">
              {(slide.methodSteps || slide.steps || []).map((step, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border-2 p-2.5" style={{ background: "white", borderColor: badgeColour + "80" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{ background: badgeColour }}>{i + 1}</div>
                  <div className="text-sm font-medium pt-0.5" style={{ color: theme.text }}>{step}</div>
                </div>
              ))}
              {slide.body && <div className="text-xs italic text-gray-600 mt-1 text-center">{slide.body}</div>}
            </div>
          </div>
        );

      // ── SEND: Help Box (MLD) ──────────────────────────────────────────────
      case "help-box":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={BookOpen} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center">
              <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: "#ca8a04", background: "#fef9c3" }}>
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-yellow-950" style={{ background: "#facc15" }}>
                  Help Box — refer back to this any time
                </div>
                <div className="p-3 space-y-1.5">
                  {(slide.helpBox || slide.bullets || []).map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm font-medium text-yellow-950">{h}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      // ── SEND: Word Bank (SLCN/EAL) ────────────────────────────────────────
      case "word-bank":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={List} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-2">
                {(slide.wordBank || slide.terms || []).slice(0, 8).map((w, i) => (
                  <div key={i} className="rounded-lg border-2 p-2 flex items-center gap-2" style={{ background: "#ecfeff", borderColor: "#06b6d4" }}>
                    {symbolSupport && <TermSymbol term={w.term} size={44} />}
                    <div className="min-w-0">
                      <div className="text-[13px] font-black text-cyan-900">{w.term}</div>
                      <div className="text-[11px] text-cyan-800 leading-tight">{w.definition}</div>
                    </div>
                  </div>
                ))}
              </div>
              {slide.body && <div className="text-[11px] italic text-gray-600 mt-2 text-center">{slide.body}</div>}
            </div>
          </div>
        );

      // ── SEND: Take a Break (PDA/Anxiety/Tourette's) ───────────────────────
      case "take-a-break":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-14 gap-3" style={{ background: "linear-gradient(135deg,#f0fdfa,#ccfbf1)" }}>
            <div className="text-5xl">☕</div>
            <div className="text-3xl font-black" style={{ color: "#134e4a" }}>Take a Break</div>
            <div className="text-base font-medium max-w-lg" style={{ color: "#134e4a" }}>
              {slide.body || "Take a breath here if you need to. Come back when you're ready."}
            </div>
          </div>
        );

      // ── Phase 2: cold-call ─────────────────────────────────────────────
      case "cold-call":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Users} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-3">
              {slide.coldCallCue && (
                <div className="rounded-2xl p-4 text-center" style={{ background: theme.light, border: `2px solid ${badgeColour}` }}>
                  <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: badgeColour }}>Cold-call cue — say this</div>
                  <div className="text-lg font-semibold" style={{ color: theme.primary }}>{slide.coldCallCue}</div>
                </div>
              )}
              {slide.question && (
                <div className="rounded-xl p-3" style={{ background: "white", border: `1px solid ${badgeColour}40` }}>
                  <div className="text-[10px] font-bold uppercase mb-1 text-gray-500">Question</div>
                  <div className="text-base font-medium" style={{ color: theme.text }}>{slide.question}</div>
                </div>
              )}
              {slide.namedPupilHint && (
                <div className="text-[12px] italic text-gray-500 text-center">Try a quieter pupil — {slide.namedPupilHint}</div>
              )}
              {slide.bullets && slide.bullets.length > 0 && (
                <div className="space-y-1.5">
                  {slide.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: badgeColour }}>{i + 1}</div>
                      <div className="text-xs" style={{ color: theme.text }}>{b}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      // ── Phase 2: live-model (I do · We do · You do) ────────────────────
      case "live-model": {
        const m = slide.liveModel;
        const stages: Array<[string, string, string, string, string]> = [
          ["I DO",   "Watch first",      m?.iDo || "(model)",  "#dbeafe", "#1d4ed8"],
          ["WE DO",  "Try with me",      m?.weDo || "(guided)", "#fef3c7", "#b45309"],
          ["YOU DO", "Independent",      m?.youDo || "(solo)",  "#dcfce7", "#16a34a"],
        ];
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Brain} />
            <div className="flex-1 px-10 pb-7 grid grid-cols-3 gap-2.5">
              {stages.map(([label, sub, content, bg, fg]) => (
                <div key={label} className="rounded-2xl p-3 flex flex-col" style={{ background: bg, border: `2px solid ${fg}` }}>
                  <div className="text-[10px] font-black tracking-wide uppercase" style={{ color: fg }}>{label}</div>
                  <div className="text-[10px] italic mb-1" style={{ color: fg, opacity: 0.7 }}>{sub}</div>
                  <div className="text-sm leading-snug flex-1" style={{ color: fg }}>{content}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // ── Phase 2: do-now (low-stakes starter as pupils arrive) ─────────────
      case "do-now":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Pencil} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-3">
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-1">Do this now — silently, in your book</div>
              </div>
              {slide.question && (
                <div className="rounded-2xl p-5" style={{ background: theme.light, border: `2px solid ${badgeColour}` }}>
                  <div className="text-base font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
                </div>
              )}
              {slide.bullets && slide.bullets.length > 0 && (
                <div className="space-y-1.5">
                  {slide.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-white border-2 flex-shrink-0 mt-0.5" style={{ borderColor: badgeColour }} />
                      <div className="text-sm font-medium" style={{ color: theme.text }}>{b}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      // ── Phase 2: choose-your-task (3 routes) ─────────────────────────────
      case "choose-your-task": {
        const d = slide.differentiation || {};
        const routes = [
          { label: d.support ? "Build it"  : null, body: d.support, bg: "#dcfce7", fg: "#16a34a" },
          { label: d.core ? "Stretch it"   : null, body: d.core,    bg: "#dbeafe", fg: "#2563eb" },
          { label: d.extension ? "Master it" : null, body: d.extension, bg: "#f5f3ff", fg: "#7c3aed" },
        ].filter(r => r.body);
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={List} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-3">
              {slide.question && (
                <div className="rounded-xl p-3 text-center" style={{ background: theme.light, border: `1px solid ${badgeColour}30` }}>
                  <div className="text-base font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
                </div>
              )}
              <div className={`grid gap-2.5 ${routes.length === 3 ? "grid-cols-3" : routes.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                {routes.map((r, i) => (
                  <div key={i} className="rounded-2xl p-3 flex flex-col" style={{ background: r.bg, border: `2px solid ${r.fg}` }}>
                    <div className="text-[10px] font-black uppercase tracking-wide" style={{ color: r.fg }}>{r.label}</div>
                    <div className="text-[12px] mt-1 leading-snug" style={{ color: r.fg }}>{r.body}</div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] italic text-center text-gray-500">Pick the one that feels right for you today.</div>
            </div>
          </div>
        );
      }

      // ── Phase 2: stuck-help (hint ladder, answer hidden until last) ─────
      case "stuck-help":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={HelpCircle} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-2.5">
              {slide.question && (
                <div className="rounded-xl p-3" style={{ background: theme.light, border: `1px solid ${badgeColour}30` }}>
                  <div className="text-sm font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
                </div>
              )}
              {(slide.hintLadder || []).map((hint, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg p-2.5" style={{ background: ["#fef9c3","#fed7aa","#fecaca"][Math.min(i, 2)], border: `1.5px solid ${["#ca8a04","#c2410c","#dc2626"][Math.min(i, 2)]}` }}>
                  <div className="w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ background: ["#ca8a04","#c2410c","#dc2626"][Math.min(i, 2)] }}>H{i + 1}</div>
                  <div className="text-[12px] flex-1" style={{ color: ["#713f12","#7c2d12","#7f1d1d"][Math.min(i, 2)] }}>{hint}</div>
                </div>
              ))}
              {slide.finalAnswer && (
                <details className="rounded-lg" style={{ background: "#dcfce7", border: "1.5px solid #16a34a" }}>
                  <summary className="cursor-pointer px-3 py-2 text-[12px] font-bold text-green-800">Reveal the answer</summary>
                  <div className="px-3 pb-2 text-[12px] text-green-900">{slide.finalAnswer}</div>
                </details>
              )}
            </div>
          </div>
        );

      // ── Phase 2: homework — brief + due + minutes + link ──────────────
      case "homework":
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Edit3} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-3">
              <div className="rounded-2xl p-4" style={{ background: theme.light, border: `2px solid ${badgeColour}` }}>
                <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: badgeColour }}>Homework</div>
                <div className="text-base font-medium" style={{ color: theme.text }}>{slide.homeworkBrief || slide.body || "(homework brief)"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg p-2" style={{ background: "white", border: `1px solid ${badgeColour}40` }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Due</div>
                  <div className="text-sm font-semibold" style={{ color: theme.primary }}>{slide.homeworkDueDate || "—"}</div>
                </div>
                <div className="rounded-lg p-2" style={{ background: "white", border: `1px solid ${badgeColour}40` }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Time</div>
                  <div className="text-sm font-semibold" style={{ color: theme.primary }}>{slide.homeworkMinutes ? `${slide.homeworkMinutes} min` : "—"}</div>
                </div>
                <div className="rounded-lg p-2 truncate" style={{ background: "white", border: `1px solid ${badgeColour}40` }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Submit</div>
                  <div className="text-sm font-semibold truncate" style={{ color: theme.primary }}>{slide.homeworkLink ? "link in chat" : "in book"}</div>
                </div>
              </div>
            </div>
          </div>
        );

      // ── Default: content / activity / extension ────────────────────────────
      default:
        return renderLayoutSlide(slide, theme, badgeColour, Icon);
    }
  };

  const isTitleSlide = slide.type === "title" || slide.type === "section-divider";

  // SEND field strips — rendered ABOVE the slide's main content so they are
  // unmissable and don't get pushed off-screen on short slides.
  const renderSendStrips = () => {
    const strips: React.ReactElement[] = [];
    if (slide.wordBank && slide.wordBank.length > 0) {
      strips.push(
        <div key="wordBank" className="mx-6 mt-4 rounded-lg border border-cyan-300 bg-cyan-50/80 px-3 py-2">
          <div className="text-[9px] font-bold uppercase tracking-wide text-cyan-800 mb-1">Word Bank</div>
          <div className="flex flex-wrap gap-1.5">
            {slide.wordBank.slice(0, 8).map((w, i) => (
              <div key={i} className="bg-white border border-cyan-200 rounded px-2 py-0.5 text-[11px]">
                <span className="font-bold text-cyan-900">{w.term}</span>
                <span className="text-cyan-700"> — {w.definition}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (slide.whatYouNeedToDo && slide.whatYouNeedToDo.length > 0) {
      strips.push(
        <div key="whatYouNeedToDo" className="mx-6 mt-3 rounded-lg border-2 border-yellow-400 bg-yellow-50 px-3 py-2">
          <div className="text-[9px] font-bold uppercase tracking-wide text-yellow-900 mb-1">What you need to do:</div>
          <ol className="list-decimal pl-4 space-y-0.5">
            {slide.whatYouNeedToDo.slice(0, 8).map((step, i) => (
              <li key={i} className="text-[11px] text-yellow-950">{step}</li>
            ))}
          </ol>
        </div>
      );
    }
    if (slide.actionVerb) {
      strips.push(
        <div key="actionVerb" className="mx-6 mt-2 inline-flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wide text-gray-500">Action</span>
          <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900">{slide.actionVerb}</span>
        </div>
      );
    }
    return strips.length ? <div>{strips}</div> : null;
  };

  // Footer SEND strips — sentence starter + answer frame + visual cue
  const renderSendFooter = () => {
    const parts: React.ReactElement[] = [];
    if (slide.sentenceStarter) {
      parts.push(
        <div key="sentenceStarter" className="italic text-[11px] text-gray-700 bg-gray-50 border-l-2 border-gray-300 px-2 py-1">
          Sentence starter: "<span className="font-medium">{slide.sentenceStarter}</span>"
        </div>
      );
    }
    if (slide.answerFrame) {
      parts.push(
        <div key="answerFrame" className="text-[11px] text-gray-700 bg-blue-50 border-l-2 border-blue-300 px-2 py-1">
          Answer frame: <span className="font-medium">{slide.answerFrame}</span>
        </div>
      );
    }
    if (slide.visualCue) {
      parts.push(
        <div key="visualCue" className="text-[11px] text-gray-700 bg-purple-50 border-l-2 border-purple-300 px-2 py-1">
          Visual cue: <span className="font-medium">{slide.visualCue}</span>
        </div>
      );
    }
    if (!parts.length) return null;
    return (
      <div className="absolute left-4 right-4 bottom-10 flex flex-col gap-1 pointer-events-none">
        {parts}
      </div>
    );
  };

  // Timing chip — shown top-right under the slide number when the AI has
  // populated timingMinutes. Never shown on the title slide.
  const renderTimingChip = () => {
    if (isTitleSlide || !slide.timingMinutes) return null;
    return (
      <div className="absolute top-10 right-4 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900">
        ⏱ {slide.timingMinutes} min
      </div>
    );
  };

  // Bonus label override — PDA/Anxiety rename "challenge"/"extension" slides.
  const renderBonusLabel = () => {
    if (isTitleSlide || !slide.bonusLabel) return null;
    return (
      <div className="absolute bottom-10 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 border border-purple-300 text-purple-800">
        {slide.bonusLabel}
      </div>
    );
  };

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-2xl"
      style={{
        aspectRatio: "16/9",
        background: isTitleSlide ? theme.gradient : theme.bg,
        position: "relative",
        // theme.fontFamily wins (SEND), then any preview-level wrapper font
        // (the parent supplies a CSS variable for subject-aware font when no
        // SEND override is active).
        fontFamily: theme.fontFamily || "var(--pres-font, Calibri)",
        lineHeight: theme.lineHeight || undefined,
      }}
    >
      {/* Top accent bar — coloured by slide type */}
      {!isTitleSlide && (
        <div className="absolute top-0 left-0 right-0 h-[4px]" style={{ background: badgeColour }} />
      )}
      {/* Left accent bar — coloured by slide type (matches the guide's spec) */}
      {!isTitleSlide && (
        <div className="absolute top-0 bottom-0 left-0 w-[6px]" style={{ background: badgeColour }} />
      )}
      {/* Slide number badge */}
      <div className="absolute top-3 right-4 text-xs font-medium" style={{ color: isTitleSlide ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>
        {index + 1} / {total}
      </div>
      {/* Slide type badge — bottom left */}
      <div className="absolute bottom-3 left-4">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
          background: isTitleSlide ? "rgba(255,255,255,0.2)" : badgeColour + "18",
          color: isTitleSlide ? "rgba(255,255,255,0.8)" : badgeColour,
          border: `1px solid ${isTitleSlide ? "rgba(255,255,255,0.3)" : badgeColour + "40"}`,
        }}>
          {SLIDE_LABELS[slide.type] || slide.type}
        </span>
      </div>
      {renderTimingChip()}
      {renderBonusLabel()}
      {!isTitleSlide && renderSendStrips()}
      {renderSlideContent()}
      {!isTitleSlide && renderSendFooter()}
      {/* School-identity watermark — title always; every slide when opted-in. */}
      {branding?.name && (slide.type === "title" || branding.showOnEverySlide) && (
        <div className="absolute bottom-2 right-3 flex items-center gap-1.5 opacity-70 pointer-events-none" style={{ color: isTitleSlide ? "rgba(255,255,255,0.85)" : theme.text }}>
          {branding.logoDataUrl && <img src={branding.logoDataUrl} alt="" className="h-5 w-auto object-contain" />}
          <div className="text-[9px] font-semibold leading-tight">
            <div>{branding.name}</div>
            {branding.motto && slide.type === "title" && <div className="italic font-normal">{branding.motto}</div>}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── PPTX Export ─────────────────────────────────────────────────────────────
async function exportToPptx(
  presentation: PresentationData,
  themeKey: ThemeKey,
  sendNeedIds: string[] = [],
  symbolSupport = false,
): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  const theme = composeTheme(themeKey, sendNeedIds, presentation.subject);
  // Font family resolves: SEND override > theme.fontFamily > subject-aware > Calibri.
  const pptxFont = theme.fontFamily || getSubjectFontFamily(presentation.subject);
  // Minimum font sizes — raised by SEND needs (VI = 24pt body, 40pt title).
  const minBodyPt = theme.minBodyPt || 12;
  const minTitlePt = theme.minTitlePt || 22;

  pptx.layout = "LAYOUT_WIDE"; // 16:9
  pptx.title = presentation.title;
  pptx.subject = presentation.subject;
  pptx.author = "Adaptly AI";

  // ── Image data URLs (Phase 4 / item 10) ─────────────────────────────────
  // pptxgenjs `addImage({ data })` needs base64 bytes. Cross-origin fetches
  // against Pexels/Unsplash CDN are blocked from the browser, so we route
  // every fetch through `/api/image-proxy/fetch?format=base64`. Pre-resolve
  // in parallel before painting so the per-slide loop stays synchronous.
  const imageDataByIndex = new Map<number, string>();
  const imageFetches: Promise<void>[] = [];
  presentation.slides.forEach((slide, i) => {
    const url = slide.image?.thumbUrl || slide.image?.url;
    if (!url) return;
    imageFetches.push(
      fetchImageAsDataUrl(url).then((dataUrl) => {
        if (dataUrl) imageDataByIndex.set(i, dataUrl);
      }).catch(() => { /* best-effort */ })
    );
  });
  if (imageFetches.length > 0) {
    await Promise.all(imageFetches);
  }

  // ── V5 — Symbol data URLs for word banks / key terms / vocab tables ──────
  // When symbol support is on, pre-resolve an ARASAAC pictogram for every term
  // on word-bank / key-terms / vocab-reference slides into a base64 data URL
  // (pptxgenjs addImage needs base64; the proxy /fetch?format=base64 bypasses
  // CORS). Keyed by lowercased term so the synchronous painters can look up an
  // image without async work. Best-effort: missing symbols simply paint text.
  const symbolDataByTerm = new Map<string, string>();
  if (symbolSupport) {
    const termSet = new Set<string>();
    presentation.slides.forEach((slide) => {
      if (slide.type !== "word-bank" && slide.type !== "key-terms" && slide.type !== "vocab-reference") return;
      const rows = slide.wordBank || slide.vocabTable || slide.terms || [];
      rows.forEach((r: { term?: string }) => {
        const t = (r?.term || "").trim();
        if (t) termSet.add(t);
      });
    });
    const terms = Array.from(termSet);
    if (terms.length > 0) {
      try {
        const symbolMap = await resolveSymbolsForWords(terms, { lang: "en" });
        await Promise.all(
          Object.entries(symbolMap).map(async ([term, sym]) => {
            const dataUrl = await fetchSymbolAsDataUrl(sym.thumbUrl);
            if (dataUrl) symbolDataByTerm.set(term.toLowerCase(), dataUrl);
          }),
        );
      } catch { /* best-effort — fall back to text-only */ }
    }
  }

  // Helper: hex to RGB
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const primaryClean = theme.primary.replace("#", "");
  const secondaryClean = theme.secondary.replace("#", "");
  const accentClean = theme.accent.replace("#", "");
  const textClean = theme.text.replace("#", "");
  const lightClean = theme.light.replace("#", "");
  const bgClean = theme.bg.replace("#", "");
  // Dark theme detection: if bg is dark, use white text for non-title slides.
  // VI high-contrast forces bg=white so this always resolves to isDark=false.
  const isDark = parseInt(bgClean.slice(0, 2), 16) < 60;
  const slideBgClean = bgClean;
  const slideTextClean = isDark ? "E2E8F0" : textClean;
  const slideTitleClean = isDark ? "E2E8F0" : primaryClean;

  // ── Per-slide-type colour lookup (matches SLIDE_TYPE_COLOURS) ──────────────
  // The preview uses these as the left accent bar colour; the PPTX export
  // mirrors them on the top accent bar + slide-type pill so the two outputs
  // look visually consistent.
  const slideAccent = (t: string) => (SLIDE_TYPE_COLOURS[t] || theme.secondary).replace("#", "");

  // Reusable header painter — accent bar + title + underline + optional
  // timing chip / slide-type pill. Every non-title slide calls this so the
  // export matches the on-screen preview.
  const paintHeader = (pSlide: any, slide: SlideContent) => {
    const accent = slideAccent(slide.type);
    // Top accent bar (full width)
    pSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { type: "solid", color: accent } });
    // Left accent bar (vertical)
    pSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0.08, w: 0.08, h: 5.52, fill: { type: "solid", color: accent } });
    // Slide type pill — bottom-left
    pSlide.addShape(pptx.ShapeType.rect, {
      x: 0.35, y: 5.15, w: 1.9, h: 0.28,
      fill: { type: "solid", color: accent + "18" },
      line: { color: accent, width: 0.5 },
      rectRadius: 0.14,
    });
    pSlide.addText(SLIDE_LABELS[slide.type] || slide.type, {
      x: 0.35, y: 5.15, w: 1.9, h: 0.28,
      fontSize: 8, bold: true, color: accent,
      align: "center", fontFace: pptxFont,
    });
    // Title + underline
    pSlide.addText(slide.title, {
      x: 0.5, y: 0.3, w: 8.5, h: 0.6,
      fontSize: Math.max(22, minTitlePt - 18), bold: true, color: slideTitleClean,
      fontFace: pptxFont,
    });
    pSlide.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 0.95, w: 1.2, h: 0.05,
      fill: { type: "solid", color: accent },
    });
    // Timing chip — top-right under the slide number
    if (slide.timingMinutes) {
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 8.3, y: 0.52, w: 1.2, h: 0.3,
        fill: { type: "solid", color: "FEF3C7" },
        line: { color: "D97706", width: 0.75 },
        rectRadius: 0.15,
      });
      pSlide.addText(`⏱ ${slide.timingMinutes} min`, {
        x: 8.3, y: 0.52, w: 1.2, h: 0.3,
        fontSize: 10, bold: true, color: "92400E",
        align: "center", fontFace: pptxFont,
      });
    }
    // Bonus label — bottom-right
    if (slide.bonusLabel) {
      const blWidth = Math.min(4.2, 0.8 + slide.bonusLabel.length * 0.08);
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 9.6 - blWidth, y: 5.15, w: blWidth, h: 0.28,
        fill: { type: "solid", color: "F5F3FF" },
        line: { color: "7C3AED", width: 0.75 },
        rectRadius: 0.14,
      });
      pSlide.addText(slide.bonusLabel, {
        x: 9.6 - blWidth, y: 5.15, w: blWidth, h: 0.28,
        fontSize: 9, bold: true, color: "5B21B6",
        align: "center", fontFace: pptxFont,
      });
    }
  };

  // SEND field strip painter — word bank, what-you-need-to-do, sentence
  // frame, answer frame. Returns the new Y cursor for the caller.
  const paintSendStrips = (pSlide: any, slide: SlideContent, startY: number): number => {
    let y = startY;
    if (slide.wordBank && slide.wordBank.length) {
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y, w: 9, h: 0.55,
        fill: { type: "solid", color: "ECFEFF" },
        line: { color: "06B6D4", width: 0.75 },
        rectRadius: 0.06,
      });
      pSlide.addText("Word Bank:", { x: 0.65, y: y + 0.05, w: 1.2, h: 0.22, fontSize: 9, bold: true, color: "155E75", fontFace: pptxFont });
      const wbText = slide.wordBank.slice(0, 6).map(w => `${w.term} — ${w.definition}`).join("   ·   ");
      pSlide.addText(wbText, { x: 1.9, y: y + 0.05, w: 7.5, h: 0.45, fontSize: 10, color: "164E63", fontFace: pptxFont, wrap: true });
      y += 0.65;
    }
    if (slide.whatYouNeedToDo && slide.whatYouNeedToDo.length) {
      const h = 0.28 + slide.whatYouNeedToDo.length * 0.22;
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y, w: 9, h,
        fill: { type: "solid", color: "FEFCE8" },
        line: { color: "CA8A04", width: 1 },
        rectRadius: 0.06,
      });
      pSlide.addText("What you need to do:", { x: 0.65, y: y + 0.05, w: 8.7, h: 0.22, fontSize: 9, bold: true, color: "713F12", fontFace: pptxFont });
      const steps = slide.whatYouNeedToDo.map((s, i) => `${i + 1}. ${s}`).join("\n");
      pSlide.addText(steps, { x: 0.8, y: y + 0.26, w: 8.5, h: h - 0.28, fontSize: 10, color: "713F12", fontFace: pptxFont, wrap: true });
      y += h + 0.08;
    }
    if (slide.actionVerb) {
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y, w: 2.5, h: 0.3,
        fill: { type: "solid", color: "FEF3C7" },
        line: { color: "F59E0B", width: 0.75 },
        rectRadius: 0.14,
      });
      pSlide.addText(`ACTION: ${slide.actionVerb}`, {
        x: 0.5, y, w: 2.5, h: 0.3,
        fontSize: 10, bold: true, color: "92400E",
        align: "center", fontFace: pptxFont,
      });
      y += 0.4;
    }
    return y;
  };

  // Footer SEND strip painter — sentence starter, answer frame, visual cue.
  const paintSendFooter = (pSlide: any, slide: SlideContent) => {
    let y = 4.8;
    const rows = [
      slide.sentenceStarter && { label: "Sentence starter:", value: `"${slide.sentenceStarter}"`, bg: "F3F4F6", border: "9CA3AF", text: "374151" },
      slide.answerFrame && { label: "Answer frame:", value: slide.answerFrame, bg: "EFF6FF", border: "3B82F6", text: "1E3A8A" },
      slide.visualCue && { label: "Visual cue:", value: slide.visualCue, bg: "F5F3FF", border: "7C3AED", text: "5B21B6" },
    ].filter(Boolean) as Array<{ label: string; value: string; bg: string; border: string; text: string }>;
    if (!rows.length) return;
    // Each row is 0.28 tall. Stack upward from y=4.8.
    y = 4.8 - rows.length * 0.3;
    rows.forEach((r, i) => {
      const ry = y + i * 0.3;
      pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: ry, w: 9, h: 0.28, fill: { type: "solid", color: r.bg }, line: { color: r.border, width: 0.5 }, rectRadius: 0.04 });
      pSlide.addText(`${r.label} ${r.value}`, { x: 0.65, y: ry + 0.03, w: 8.7, h: 0.22, fontSize: 10, color: r.text, fontFace: pptxFont, italic: true, wrap: true });
    });
  };

  // ── Diagram painter — renders structured diagram data as pptxgenjs shapes ──
  const paintDiagram = (pSlide: any, diagram: NonNullable<SlideContent['diagram']>, x: number, y: number, w: number, h: number) => {
    const nodes = diagram.nodes || [];
    const edges = diagram.edges || [];

    if (diagram.kind === "flowchart" || diagram.kind === "food-chain") {
      const isHorizontal = diagram.kind === "food-chain";
      const nodeW = isHorizontal ? Math.min(1.8, (w - 0.4) / Math.max(nodes.length, 1)) : 2.0;
      const nodeH = 0.45;
      const positions: Record<string, { cx: number; cy: number }> = {};

      nodes.forEach((node, i) => {
        const nx = isHorizontal ? x + 0.2 + i * (w / nodes.length) : x + (w - nodeW) / 2;
        const ny = isHorizontal ? y + h / 2 - nodeH / 2 : y + 0.2 + i * (h / nodes.length);
        positions[node.id] = { cx: nx + nodeW / 2, cy: ny + nodeH / 2 };
        pSlide.addShape(pptx.ShapeType.rect, { x: nx, y: ny, w: nodeW, h: nodeH, fill: { type: "solid", color: secondaryClean }, rectRadius: 0.06 });
        pSlide.addText(node.label, { x: nx, y: ny, w: nodeW, h: nodeH, fontSize: 9, color: "FFFFFF", align: "center", valign: "middle", fontFace: pptxFont, bold: true });
      });

      edges.forEach(edge => {
        const from = positions[edge.from];
        const to = positions[edge.to];
        if (from && to) {
          pSlide.addShape(pptx.ShapeType.line, {
            x: from.cx, y: from.cy, w: to.cx - from.cx || 0.01, h: to.cy - from.cy || 0.01,
            line: { color: accentClean, width: 1.5 },
          });
        }
      });
    } else if (diagram.kind === "venn") {
      const sets = diagram.sets || [];
      const circleW = w * 0.55;
      const circleH = h * 0.7;
      if (sets.length >= 2) {
        pSlide.addShape(pptx.ShapeType.ellipse, { x: x, y: y + 0.3, w: circleW, h: circleH, fill: { type: "solid", color: secondaryClean + "40" }, line: { color: secondaryClean, width: 1.5 } });
        pSlide.addShape(pptx.ShapeType.ellipse, { x: x + w - circleW, y: y + 0.3, w: circleW, h: circleH, fill: { type: "solid", color: accentClean + "40" }, line: { color: accentClean, width: 1.5 } });
        pSlide.addText(sets[0].label, { x: x, y: y, w: circleW, h: 0.3, fontSize: 10, bold: true, color: secondaryClean, align: "center", fontFace: pptxFont });
        pSlide.addText(sets[1].label, { x: x + w - circleW, y: y, w: circleW, h: 0.3, fontSize: 10, bold: true, color: accentClean, align: "center", fontFace: pptxFont });
        const leftItems = sets[0].items.filter(i => !sets[1].items.includes(i)).join("\n");
        const rightItems = sets[1].items.filter(i => !sets[0].items.includes(i)).join("\n");
        const shared = sets[0].items.filter(i => sets[1].items.includes(i)).join("\n");
        if (leftItems) pSlide.addText(leftItems, { x: x + 0.15, y: y + 0.6, w: circleW * 0.5, h: circleH - 0.4, fontSize: 8, color: slideTextClean, fontFace: pptxFont, wrap: true });
        if (rightItems) pSlide.addText(rightItems, { x: x + w - circleW * 0.55, y: y + 0.6, w: circleW * 0.5, h: circleH - 0.4, fontSize: 8, color: slideTextClean, fontFace: pptxFont, wrap: true });
        if (shared) pSlide.addText(shared, { x: x + (w - 1.2) / 2, y: y + h * 0.4, w: 1.2, h: circleH * 0.5, fontSize: 8, color: slideTextClean, fontFace: pptxFont, wrap: true, align: "center" });
      }
    } else if (diagram.kind === "timeline") {
      const lineY = y + h / 2;
      pSlide.addShape(pptx.ShapeType.line, { x: x + 0.1, y: lineY, w: w - 0.2, h: 0, line: { color: secondaryClean, width: 2 } });
      nodes.forEach((node, i) => {
        const nx = x + 0.3 + i * ((w - 0.6) / Math.max(nodes.length - 1, 1));
        pSlide.addShape(pptx.ShapeType.ellipse, { x: nx - 0.08, y: lineY - 0.08, w: 0.16, h: 0.16, fill: { type: "solid", color: accentClean } });
        pSlide.addText(node.group || "", { x: nx - 0.5, y: lineY - 0.45, w: 1.0, h: 0.3, fontSize: 7, color: secondaryClean, align: "center", fontFace: pptxFont, bold: true });
        pSlide.addText(node.label, { x: nx - 0.6, y: lineY + 0.15, w: 1.2, h: 0.4, fontSize: 7, color: slideTextClean, align: "center", fontFace: pptxFont, wrap: true });
      });
    } else {
      // Generic: labelled-box, cell, cycle, water-cycle, circuit, equation-graph
      const boxW = w * 0.45;
      const boxH = h * 0.5;
      const boxX = x + (w - boxW) / 2;
      const boxY = y + (h - boxH) / 2;
      pSlide.addShape(pptx.ShapeType.rect, { x: boxX, y: boxY, w: boxW, h: boxH, fill: { type: "solid", color: lightClean }, line: { color: secondaryClean, width: 1.5 }, rectRadius: 0.08 });
      pSlide.addText(diagram.title || diagram.kind, { x: boxX, y: boxY, w: boxW, h: boxH, fontSize: 10, color: slideTextClean, align: "center", valign: "middle", fontFace: pptxFont });
      nodes.slice(0, 8).forEach((node, i) => {
        const angle = (i / Math.min(nodes.length, 8)) * Math.PI * 2 - Math.PI / 2;
        const labelX = boxX + boxW / 2 + Math.cos(angle) * (boxW * 0.7) - 0.5;
        const labelY = boxY + boxH / 2 + Math.sin(angle) * (boxH * 0.7) - 0.12;
        pSlide.addText(node.label, { x: Math.max(x, labelX), y: Math.max(y, labelY), w: 1.2, h: 0.28, fontSize: 8, color: slideTextClean, fontFace: pptxFont, align: "center" });
      });
    }
  };

  for (const [idx, slide] of presentation.slides.entries()) {
    const pSlide = pptx.addSlide();

    // Add speaker notes
    if (slide.speakerNotes) {
      pSlide.addNotes(slide.speakerNotes);
    }

    if (slide.type === "title") {
      // Full gradient background
      pSlide.background = { fill: primaryClean };
      // Gradient overlay rectangle
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: "100%",
        fill: { type: "solid", color: primaryClean },
      });
      // ── Phase 4 / item 10 — embed real image when resolved ───────────
      // titleVariant === "split-image" → photo on the right half.
      // Other variants → full-bleed dim background photo + dark overlay
      // so the title text stays legible.
      const titleImg = imageDataByIndex.get(idx);
      const isSplit = slide.titleVariant === "split-image";
      if (titleImg && isSplit) {
        // Right half image
        pSlide.addImage({
          data: titleImg,
          x: 5, y: 0, w: 5, h: 5.625,
          sizing: { type: "cover", w: 5, h: 5.625 },
        });
      } else if (titleImg) {
        // Full-bleed dim image behind the gradient overlay
        pSlide.addImage({
          data: titleImg,
          x: 0, y: 0, w: 10, h: 5.625,
          sizing: { type: "cover", w: 10, h: 5.625 },
          transparency: 70, // 0=opaque, 100=invisible
        });
      }
      // Decorative accent bar
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: accentClean },
      });
      // Title
      pSlide.addText(slide.title, {
        x: 0.5, y: 1.8, w: isSplit ? 4.3 : 9, h: 1.5,
        fontSize: 36, bold: true, color: "FFFFFF",
        align: isSplit ? "left" : "center", fontFace: pptxFont,
        wrap: true,
      });
      // Subtitle
      if (slide.subtitle) {
        pSlide.addText(slide.subtitle, {
          x: 0.5, y: 3.5, w: isSplit ? 4.3 : 9, h: 0.5,
          fontSize: 16, color: "CCDDFF",
          align: isSplit ? "left" : "center", fontFace: pptxFont,
          italic: true,
        });
      }
      // Body / hook
      if (slide.body) {
        pSlide.addText(slide.body, {
          x: isSplit ? 0.5 : 1, y: 4.2, w: isSplit ? 4.3 : 8, h: 0.6,
          fontSize: 13, color: "AABBDD",
          align: isSplit ? "left" : "center", fontFace: pptxFont,
          italic: true,
        });
      }
      // Slide number
      pSlide.addText(`${idx + 1} / ${presentation.slides.length}`, {
        x: 8.5, y: 5.1, w: 1, h: 0.3,
        fontSize: 9, color: "8899BB",
        align: "right",
      });
      // Image attribution chip — small, dim, bottom-left corner.
      if (titleImg && slide.image?.attribution) {
        pSlide.addText(slide.image.attribution, {
          x: isSplit ? 5.05 : 0.1, y: 5.4,
          w: isSplit ? 4.9 : 4.5, h: 0.2,
          fontSize: 7, color: "FFFFFF", italic: true,
          fontFace: pptxFont, align: "left",
        });
      }
    } else if (slide.type === "learning-objectives") {
      pSlide.background = { fill: slideBgClean };
      paintHeader(pSlide, slide);
      // Prefer the structured successCriteria format when the AI provides it.
      const objColors = ["16A34A", "2563EB", "D97706"];
      const objLabels = ["MUST", "SHOULD", "COULD"];
      const band = slide.successCriteria
        ? [slide.successCriteria.must, slide.successCriteria.should, slide.successCriteria.could]
        : (slide.bullets || []).slice(0, 3).map(b => b.replace(/^(All:|Most:|Some:|Must:|Should:|Could:)\s*/i, ""));
      band.forEach((text, i) => {
        const color = objColors[i] || secondaryClean;
        const label = objLabels[i] || String(i + 1);
        const yPos = 1.2 + i * 1.1;
        pSlide.addShape(pptx.ShapeType.rect, {
          x: 0.5, y: yPos, w: 9, h: 0.85,
          fill: { type: "solid", color: color + "15" },
          line: { color, width: 1.5 },
          rectRadius: 0.1,
        });
        pSlide.addText(label, {
          x: 0.6, y: yPos + 0.2, w: 0.85, h: 0.45,
          fontSize: 10, bold: true, color: "FFFFFF",
          align: "center",
          fill: { type: "solid", color },
          rectRadius: 0.1,
        });
        pSlide.addText(text, {
          x: 1.65, y: yPos + 0.15, w: 7.6, h: 0.55,
          fontSize: Math.max(13, minBodyPt), color: textClean,
          fontFace: pptxFont,
          wrap: true,
        });
      });
    } else if (slide.type === "key-terms") {
      pSlide.background = { fill: slideBgClean };
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: isDark ? secondaryClean : primaryClean },
      });
      pSlide.addText(slide.title, {
        x: 0.5, y: 0.3, w: 8.5, h: 0.6,
        fontSize: 22, bold: true, color: slideTitleClean,
        fontFace: pptxFont,
      });
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 0.95, w: 1.2, h: 0.05,
        fill: { type: "solid", color: secondaryClean },
      });
      // Terms grid (2 columns)
      const terms = (slide.terms || []).slice(0, 8);
      terms.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = col === 0 ? 0.5 : 5.2;
        const y = 1.2 + row * 1.0;
        pSlide.addShape(pptx.ShapeType.rect, {
          x, y, w: 4.5, h: 0.85,
          fill: { type: "solid", color: lightClean },
          line: { color: secondaryClean + "40", width: 1 },
          rectRadius: 0.08,
        });
        const symKt = symbolSupport ? symbolDataByTerm.get((item.term || "").toLowerCase()) : undefined;
        const ktX = symKt ? x + 0.85 : x + 0.1;
        const ktW = symKt ? 3.55 : 4.3;
        if (symKt) pSlide.addImage({ data: symKt, x: x + 0.1, y: y + 0.12, w: 0.6, h: 0.6 });
        pSlide.addText(item.term, {
          x: ktX, y: y + 0.05, w: ktW, h: 0.3,
          fontSize: 11, bold: true, color: secondaryClean,
          fontFace: pptxFont,
        });
        pSlide.addText(item.definition, {
          x: ktX, y: y + 0.38, w: ktW, h: 0.42,
          fontSize: 10, color: slideTextClean,
          fontFace: pptxFont, wrap: true,
        });
      });
    } else if (slide.type === "worked-example") {
      pSlide.background = { fill: slideBgClean };
      paintHeader(pSlide, slide);
      const accent = slideAccent(slide.type);
      // Prefer the structured workedExampleBox if the AI populated it —
      // renders as a bordered "Worked Example" box with distinct background
      // so it's visually identifiable (per the teacher-framework guide).
      if (slide.workedExampleBox) {
        const w = slide.workedExampleBox;
        pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.15, w: 9, h: 3.6, fill: { type: "solid", color: lightClean }, line: { color: accent, width: 2 }, rectRadius: 0.1 });
        // Top band
        pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.15, w: 9, h: 0.32, fill: { type: "solid", color: accent } });
        pSlide.addText("WORKED EXAMPLE", { x: 0.65, y: 1.17, w: 8.7, h: 0.28, fontSize: 10, bold: true, color: "FFFFFF", fontFace: pptxFont });
        // Problem
        pSlide.addText("Problem", { x: 0.65, y: 1.52, w: 8.7, h: 0.22, fontSize: 9, bold: true, color: "4B5563", fontFace: pptxFont });
        pSlide.addText(w.problem, { x: 0.65, y: 1.72, w: 8.7, h: 0.35, fontSize: 12, color: slideTextClean, fontFace: "Consolas", wrap: true });
        // Steps
        let sy = 2.1;
        w.steps.slice(0, 6).forEach((step, i) => {
          pSlide.addShape(pptx.ShapeType.ellipse, { x: 0.65, y: sy, w: 0.3, h: 0.3, fill: { type: "solid", color: accent } });
          pSlide.addText(String(i + 1), { x: 0.65, y: sy, w: 0.3, h: 0.3, fontSize: 11, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: pptxFont });
          pSlide.addShape(pptx.ShapeType.rect, { x: 1.05, y: sy, w: 8.3, h: 0.32, fill: { type: "solid", color: "FFFFFF" }, line: { color: "E5E7EB", width: 0.5 }, rectRadius: 0.04 });
          pSlide.addText(step, { x: 1.15, y: sy + 0.04, w: 8.15, h: 0.26, fontSize: 11, color: slideTextClean, fontFace: "Consolas", wrap: true });
          sy += 0.38;
        });
        // Answer
        pSlide.addShape(pptx.ShapeType.rect, { x: 0.65, y: 4.3, w: 8.7, h: 0.35, fill: { type: "solid", color: "FFFFFF" }, line: { color: accent, width: 1 }, rectRadius: 0.04 });
        pSlide.addText("Answer:", { x: 0.75, y: 4.33, w: 1.2, h: 0.3, fontSize: 10, bold: true, color: "4B5563", fontFace: pptxFont });
        pSlide.addText(`${w.answer}${w.units ? ` ${w.units}` : ""}`, { x: 1.95, y: 4.33, w: 7.3, h: 0.3, fontSize: 13, bold: true, color: accent, fontFace: "Consolas" });
        // Common error
        if (w.commonError) {
          pSlide.addText(`⚠ Common error: ${w.commonError}`, { x: 0.65, y: 4.7, w: 8.7, h: 0.3, fontSize: 10, color: "991B1B", italic: true, fontFace: pptxFont, wrap: true });
        }
      } else {
        // Fallback: loose steps array (legacy decks).
        (slide.steps || []).forEach((step, i) => {
          const y = 1.15 + i * 0.75;
          pSlide.addShape(pptx.ShapeType.ellipse, { x: 0.5, y: y, w: 0.4, h: 0.4, fill: { type: "solid", color: secondaryClean } });
          pSlide.addText(String(i + 1), { x: 0.5, y: y, w: 0.4, h: 0.4, fontSize: 12, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
          pSlide.addShape(pptx.ShapeType.rect, { x: 1.1, y: y, w: 8.3, h: 0.55, fill: { type: "solid", color: lightClean }, rectRadius: 0.08 });
          pSlide.addText(step, { x: 1.2, y: y + 0.05, w: 8.1, h: 0.45, fontSize: 12, color: slideTextClean, fontFace: pptxFont, wrap: true });
        });
      }
    } else if (slide.type === "check-understanding") {
      pSlide.background = { fill: slideBgClean };
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: accentClean },
      });
      pSlide.addText(slide.title, {
        x: 0.5, y: 0.3, w: 8.5, h: 0.6,
        fontSize: 22, bold: true, color: slideTitleClean,
        fontFace: pptxFont,
      });
      if (slide.question) {
        pSlide.addShape(pptx.ShapeType.rect, {
          x: 0.5, y: 1.1, w: 9, h: 0.9,
          fill: { type: "solid", color: lightClean },
          rectRadius: 0.1,
        });
        pSlide.addText(slide.question, {
          x: 0.7, y: 1.2, w: 8.6, h: 0.7,
          fontSize: 15, bold: true, color: slideTitleClean,
          align: "center", fontFace: pptxFont, wrap: true,
        });
      }
      const letters = ["A", "B", "C", "D"];
      (slide.options || []).forEach((opt, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = col === 0 ? 0.5 : 5.2;
        const y = 2.3 + row * 0.9;
        const isAnswer = slide.answer === letters[i] || slide.answer === opt;
        pSlide.addShape(pptx.ShapeType.rect, {
          x, y, w: 4.5, h: 0.7,
          fill: { type: "solid", color: isAnswer ? "DCFCE7" : "FFFFFF" },
          line: { color: isAnswer ? "16A34A" : "E5E7EB", width: isAnswer ? 2 : 1 },
          rectRadius: 0.08,
        });
        pSlide.addText(letters[i], {
          x: x + 0.1, y: y + 0.1, w: 0.5, h: 0.5,
          fontSize: 13, bold: true, color: isAnswer ? "16A34A" : secondaryClean,
          align: "center",
        });
        pSlide.addText(opt, {
          x: x + 0.7, y: y + 0.12, w: 3.7, h: 0.46,
          fontSize: 12, color: slideTextClean,
          fontFace: pptxFont, wrap: true,
        });
      });
    } else if (slide.type === "misconception-bust") {
      // ─── Misconception Buster — red ❌ / green ✅ two-column split ────────
      pSlide.background = { fill: slideBgClean };
      paintHeader(pSlide, slide);
      let y = paintSendStrips(pSlide, slide, 1.15);
      // Misconception card (red)
      pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 4.4, h: 1.4, fill: { type: "solid", color: "FEE2E2" }, line: { color: "DC2626", width: 1.5 }, rectRadius: 0.08 });
      pSlide.addText("❌ Students often think:", { x: 0.6, y: y + 0.05, w: 4.2, h: 0.3, fontSize: 11, bold: true, color: "991B1B", fontFace: pptxFont });
      pSlide.addText(slide.misconception || "", { x: 0.6, y: y + 0.35, w: 4.2, h: 1.0, fontSize: 12, color: "7F1D1D", fontFace: pptxFont, wrap: true });
      // Correction card (green)
      pSlide.addShape(pptx.ShapeType.rect, { x: 5.1, y, w: 4.4, h: 1.4, fill: { type: "solid", color: "DCFCE7" }, line: { color: "16A34A", width: 1.5 }, rectRadius: 0.08 });
      pSlide.addText("✅ What is actually true:", { x: 5.2, y: y + 0.05, w: 4.2, h: 0.3, fontSize: 11, bold: true, color: "14532D", fontFace: pptxFont });
      pSlide.addText(slide.correction || "", { x: 5.2, y: y + 0.35, w: 4.2, h: 1.0, fontSize: 12, color: "14532D", fontFace: pptxFont, wrap: true });
      y += 1.55;
      // Why the misconception is wrong
      if (slide.bullets && slide.bullets.length) {
        pSlide.addText("Why the misconception is wrong:", { x: 0.5, y, w: 9, h: 0.25, fontSize: 10, bold: true, color: "4B5563", fontFace: pptxFont });
        y += 0.3;
        slide.bullets.slice(0, 4).forEach(b => {
          pSlide.addText(`• ${b}`, { x: 0.7, y, w: 8.8, h: 0.3, fontSize: Math.max(11, minBodyPt), color: slideTextClean, fontFace: pptxFont, wrap: true });
          y += 0.3;
        });
      }
      paintSendFooter(pSlide, slide);
    } else if (slide.type === "model-answer") {
      // ─── Model Answer — answer on left, mark scheme on right ────────────
      pSlide.background = { fill: slideBgClean };
      paintHeader(pSlide, slide);
      const accent = slideAccent(slide.type);
      // Answer card
      pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.15, w: 5.6, h: 3.6, fill: { type: "solid", color: lightClean }, line: { color: accent, width: 1.5 }, rectRadius: 0.08 });
      pSlide.addText("MODEL ANSWER", { x: 0.65, y: 1.22, w: 5.3, h: 0.25, fontSize: 9, bold: true, color: accent, fontFace: pptxFont });
      pSlide.addText(slide.body || slide.answer || "", { x: 0.65, y: 1.55, w: 5.3, h: 3.1, fontSize: Math.max(12, minBodyPt), color: slideTextClean, fontFace: pptxFont, wrap: true });
      // Mark scheme column
      pSlide.addText("MARK SCHEME", { x: 6.2, y: 1.22, w: 3.3, h: 0.25, fontSize: 9, bold: true, color: "4B5563", fontFace: pptxFont });
      let my = 1.52;
      (slide.markScheme || []).slice(0, 8).forEach(m => {
        pSlide.addShape(pptx.ShapeType.rect, { x: 6.2, y: my, w: 3.3, h: 0.42, fill: { type: "solid", color: "FFFFFF" }, line: { color: accent + "50", width: 0.5 }, rectRadius: 0.04 });
        pSlide.addShape(pptx.ShapeType.rect, { x: 6.25, y: my + 0.08, w: 0.45, h: 0.26, fill: { type: "solid", color: accent }, rectRadius: 0.04 });
        pSlide.addText(`+${m.marks}`, { x: 6.25, y: my + 0.08, w: 0.45, h: 0.26, fontSize: 9, bold: true, color: "FFFFFF", align: "center", fontFace: pptxFont });
        pSlide.addText(m.point, { x: 6.75, y: my + 0.05, w: 2.7, h: 0.34, fontSize: 10, color: slideTextClean, fontFace: pptxFont, wrap: true });
        my += 0.48;
      });
      if (slide.examTip) {
        pSlide.addShape(pptx.ShapeType.rect, { x: 6.2, y: my + 0.1, w: 3.3, h: 0.65, fill: { type: "solid", color: "FEF3C7" }, line: { color: "D97706", width: 0.75 }, rectRadius: 0.04 });
        pSlide.addText("TIP", { x: 6.3, y: my + 0.15, w: 3.2, h: 0.2, fontSize: 8, bold: true, color: "92400E", fontFace: pptxFont });
        pSlide.addText(slide.examTip, { x: 6.3, y: my + 0.32, w: 3.2, h: 0.42, fontSize: 10, color: "92400E", fontFace: pptxFont, wrap: true });
      }
      paintSendFooter(pSlide, slide);
    } else if (slide.type === "exam-practice") {
      // ─── Exam Practice — exam card with command/marks/time chips ─────────
      pSlide.background = { fill: slideBgClean };
      paintHeader(pSlide, slide);
      const accent = slideAccent(slide.type);
      const q = slide.examQuestion;
      let y = paintSendStrips(pSlide, slide, 1.15);
      pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 9, h: 2.4, fill: { type: "solid", color: "FFFBEB" }, line: { color: accent, width: 2 }, rectRadius: 0.1 });
      // Chips row
      let cx = 0.65;
      if (q?.commandWord) {
        pSlide.addShape(pptx.ShapeType.rect, { x: cx, y: y + 0.12, w: 1.0, h: 0.28, fill: { type: "solid", color: "0F172A" }, rectRadius: 0.04 });
        pSlide.addText(q.commandWord.toUpperCase(), { x: cx, y: y + 0.12, w: 1.0, h: 0.28, fontSize: 9, bold: true, color: "FFFFFF", align: "center", fontFace: pptxFont });
        cx += 1.1;
      }
      if (q?.marks != null) {
        pSlide.addShape(pptx.ShapeType.rect, { x: cx, y: y + 0.12, w: 1.0, h: 0.28, fill: { type: "solid", color: "D97706" }, rectRadius: 0.04 });
        pSlide.addText(`[${q.marks} marks]`, { x: cx, y: y + 0.12, w: 1.0, h: 0.28, fontSize: 9, bold: true, color: "FFFFFF", align: "center", fontFace: pptxFont });
        cx += 1.1;
      }
      if (q?.timeMins != null) {
        pSlide.addShape(pptx.ShapeType.rect, { x: cx, y: y + 0.12, w: 1.2, h: 0.28, fill: { type: "solid", color: "E2E8F0" }, rectRadius: 0.04 });
        pSlide.addText(`⏱ ${q.timeMins} min`, { x: cx, y: y + 0.12, w: 1.2, h: 0.28, fontSize: 9, bold: true, color: "334155", align: "center", fontFace: pptxFont });
      }
      // Question stem
      pSlide.addText(q?.stem || slide.question || slide.body || "", { x: 0.7, y: y + 0.5, w: 8.6, h: 1.8, fontSize: Math.max(14, minBodyPt + 2), color: slideTextClean, fontFace: pptxFont, wrap: true });
      y += 2.55;
      // Differentiation cards (optional)
      if (slide.differentiation) {
        const d = slide.differentiation;
        const cards = [
          d.support && { bg: "DCFCE7", border: "16A34A", label: "SUPPORT", text: d.support, tcol: "14532D" },
          d.core && { bg: "DBEAFE", border: "2563EB", label: "CORE", text: d.core, tcol: "1E3A8A" },
          d.extension && { bg: "F5F3FF", border: "7C3AED", label: "EXTENSION", text: d.extension, tcol: "5B21B6" },
        ].filter(Boolean) as any[];
        const w = 9.0 / Math.max(cards.length, 1) - 0.1;
        cards.forEach((c, i) => {
          const x = 0.5 + i * (w + 0.1);
          pSlide.addShape(pptx.ShapeType.rect, { x, y, w, h: 0.85, fill: { type: "solid", color: c.bg }, line: { color: c.border, width: 1 }, rectRadius: 0.06 });
          pSlide.addText(c.label, { x: x + 0.08, y: y + 0.05, w: w - 0.16, h: 0.22, fontSize: 8, bold: true, color: c.tcol, fontFace: pptxFont });
          pSlide.addText(c.text, { x: x + 0.08, y: y + 0.28, w: w - 0.16, h: 0.55, fontSize: 10, color: c.tcol, fontFace: pptxFont, wrap: true });
        });
      }
      paintSendFooter(pSlide, slide);
    } else if (slide.type === "vocab-reference") {
      // ─── Vocab Reference — full table ───────────────────────────────────
      pSlide.background = { fill: slideBgClean };
      paintHeader(pSlide, slide);
      const accent = slideAccent(slide.type);
      const rows = slide.vocabTable && slide.vocabTable.length
        ? slide.vocabTable
        : (slide.terms || []).map(t => ({ term: t.term, definition: t.definition, example: undefined as string | undefined }));
      const rowH = 0.36;
      // Header row
      pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.15, w: 9, h: 0.32, fill: { type: "solid", color: accent } });
      pSlide.addText("Term",       { x: 0.6, y: 1.17, w: 2.0, h: 0.28, fontSize: 10, bold: true, color: "FFFFFF", fontFace: pptxFont });
      pSlide.addText("Definition", { x: 2.7, y: 1.17, w: 4.0, h: 0.28, fontSize: 10, bold: true, color: "FFFFFF", fontFace: pptxFont });
      pSlide.addText("Example",    { x: 6.8, y: 1.17, w: 2.6, h: 0.28, fontSize: 10, bold: true, color: "FFFFFF", fontFace: pptxFont });
      rows.slice(0, 10).forEach((r, i) => {
        const ry = 1.47 + i * rowH;
        pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: ry, w: 9, h: rowH, fill: { type: "solid", color: i % 2 ? "FFFFFF" : lightClean } });
        const symVr = symbolSupport ? symbolDataByTerm.get((r.term || "").toLowerCase()) : undefined;
        const vrX = symVr ? 0.92 : 0.6;
        const vrW = symVr ? 1.68 : 2.0;
        if (symVr) pSlide.addImage({ data: symVr, x: 0.58, y: ry + 0.04, w: 0.28, h: 0.28 });
        pSlide.addText(r.term,       { x: vrX, y: ry + 0.04, w: vrW, h: rowH - 0.08, fontSize: 10, bold: true, color: accent, fontFace: pptxFont, wrap: true });
        pSlide.addText(r.definition, { x: 2.7, y: ry + 0.04, w: 4.0, h: rowH - 0.08, fontSize: 10, color: slideTextClean, fontFace: pptxFont, wrap: true });
        pSlide.addText(r.example || "—", { x: 6.8, y: ry + 0.04, w: 2.6, h: rowH - 0.08, fontSize: 10, italic: true, color: "6B7280", fontFace: pptxFont, wrap: true });
      });
    } else if (slide.type === "brain-break") {
      // ─── Brain Break — bold amber page ──────────────────────────────────
      pSlide.background = { fill: "FEF3C7" };
      pSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { type: "solid", color: "F59E0B" } });
      pSlide.addText("🧠", { x: 0, y: 1.4, w: 10, h: 1.2, fontSize: 72, align: "center", fontFace: pptxFont });
      pSlide.addText("BRAIN BREAK", { x: 0, y: 2.7, w: 10, h: 0.8, fontSize: 44, bold: true, color: "92400E", align: "center", fontFace: pptxFont });
      pSlide.addText(slide.body || "Stand up and stretch for 30 seconds", { x: 0.5, y: 3.6, w: 9, h: 0.6, fontSize: 18, color: "92400E", align: "center", fontFace: pptxFont });
    } else if (slide.type === "checkin") {
      // ─── Check-in — 5 emoji feelings ────────────────────────────────────
      pSlide.background = { fill: slideBgClean };
      paintHeader(pSlide, slide);
      const feelings = ["😀 Calm", "🙂 OK", "😐 Not sure", "😟 Worried", "😣 Struggling"];
      const w = 1.6, gap = 0.15;
      const startX = (10 - (w * feelings.length + gap * (feelings.length - 1))) / 2;
      feelings.forEach((f, i) => {
        const x = startX + i * (w + gap);
        pSlide.addShape(pptx.ShapeType.rect, { x, y: 2.3, w, h: 1.2, fill: { type: "solid", color: "FFFFFF" }, line: { color: "14B8A6", width: 2 }, rectRadius: 0.1 });
        pSlide.addText(f, { x, y: 2.3, w, h: 1.2, fontSize: 18, bold: true, color: "134E4A", align: "center", valign: "middle", fontFace: pptxFont });
      });
      if (slide.body) {
        pSlide.addText(slide.body, { x: 0.5, y: 3.8, w: 9, h: 0.4, fontSize: 12, italic: true, color: "6B7280", align: "center", fontFace: pptxFont });
      }
    } else if (slide.type === "method-steps") {
      // ─── Method Steps — numbered cards ───────────────────────────────────
      pSlide.background = { fill: slideBgClean };
      paintHeader(pSlide, slide);
      const accent = slideAccent(slide.type);
      const steps = slide.methodSteps || slide.steps || [];
      let y = 1.15;
      steps.slice(0, 6).forEach((step, i) => {
        pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 9, h: 0.5, fill: { type: "solid", color: "FFFFFF" }, line: { color: accent, width: 1.5 }, rectRadius: 0.06 });
        pSlide.addShape(pptx.ShapeType.ellipse, { x: 0.6, y: y + 0.08, w: 0.34, h: 0.34, fill: { type: "solid", color: accent } });
        pSlide.addText(String(i + 1), { x: 0.6, y: y + 0.08, w: 0.34, h: 0.34, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: pptxFont });
        pSlide.addText(step, { x: 1.05, y: y + 0.1, w: 8.35, h: 0.3, fontSize: Math.max(12, minBodyPt), color: slideTextClean, fontFace: pptxFont, wrap: true });
        y += 0.6;
      });
    } else if (slide.type === "help-box") {
      // ─── Help Box — yellow callout ──────────────────────────────────────
      pSlide.background = { fill: slideBgClean };
      paintHeader(pSlide, slide);
      pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.15, w: 9, h: 3.5, fill: { type: "solid", color: "FEF9C3" }, line: { color: "CA8A04", width: 2 }, rectRadius: 0.1 });
      pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.15, w: 9, h: 0.35, fill: { type: "solid", color: "FACC15" } });
      pSlide.addText("Help Box — refer back to this any time", { x: 0.65, y: 1.18, w: 8.8, h: 0.28, fontSize: 11, bold: true, color: "713F12", fontFace: pptxFont });
      const items = slide.helpBox || slide.bullets || [];
      let y = 1.6;
      items.slice(0, 8).forEach(item => {
        pSlide.addText(`• ${item}`, { x: 0.8, y, w: 8.5, h: 0.32, fontSize: Math.max(12, minBodyPt), color: "713F12", fontFace: pptxFont, wrap: true });
        y += 0.32;
      });
    } else if (slide.type === "word-bank") {
      // ─── Word Bank — cyan grid ──────────────────────────────────────────
      pSlide.background = { fill: slideBgClean };
      paintHeader(pSlide, slide);
      const items = slide.wordBank || slide.terms || [];
      items.slice(0, 8).forEach((w, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = col === 0 ? 0.5 : 5.15;
        const y = 1.2 + row * 0.95;
        pSlide.addShape(pptx.ShapeType.rect, { x, y, w: 4.35, h: 0.85, fill: { type: "solid", color: "ECFEFF" }, line: { color: "06B6D4", width: 1.5 }, rectRadius: 0.08 });
        const sym = symbolSupport ? symbolDataByTerm.get((w.term || "").toLowerCase()) : undefined;
        const tX = sym ? x + 0.85 : x + 0.1;
        const tW = sym ? 3.4 : 4.15;
        if (sym) pSlide.addImage({ data: sym, x: x + 0.1, y: y + 0.12, w: 0.6, h: 0.6 });
        pSlide.addText(w.term, { x: tX, y: y + 0.05, w: tW, h: 0.3, fontSize: 13, bold: true, color: "155E75", fontFace: pptxFont });
        pSlide.addText(w.definition, { x: tX, y: y + 0.38, w: tW, h: 0.42, fontSize: 11, color: "164E63", fontFace: pptxFont, wrap: true });
      });
    } else if (slide.type === "take-a-break") {
      // ─── Take a Break — soft teal page ──────────────────────────────────
      pSlide.background = { fill: "F0FDFA" };
      pSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { type: "solid", color: "14B8A6" } });
      pSlide.addText("☕", { x: 0, y: 1.4, w: 10, h: 1.2, fontSize: 64, align: "center", fontFace: pptxFont });
      pSlide.addText("Take a Break", { x: 0, y: 2.7, w: 10, h: 0.7, fontSize: 36, bold: true, color: "134E4A", align: "center", fontFace: pptxFont });
      pSlide.addText(slide.body || "Take a breath here if you need to. Come back when you're ready.", { x: 1.5, y: 3.5, w: 7, h: 0.8, fontSize: 16, color: "134E4A", align: "center", fontFace: pptxFont, wrap: true });
    } else {
      // Generic slide: content, activity, hook, discussion, summary, exit-ticket, extension,
      // plus any other type without a bespoke branch. Uses the shared header painter + strips.
      pSlide.background = { fill: slideBgClean };
      paintHeader(pSlide, slide);

      // ── Phase 4 / item 10 — image-bearing layouts ──────────────────────
      // image-left, image-right, quote-portrait and story-time all reserve
      // half (or part) of the canvas for a real photograph. We embed via
      // `pSlide.addImage({ data })` so the photo travels inside the .pptx
      // with its credit chip — no external dependency at open time.
      const slideImg = imageDataByIndex.get(idx);
      const imageLayout = slide.layout;
      const isImageLeft = slideImg && imageLayout === "image-left";
      const isImageRight = slideImg && imageLayout === "image-right";
      const isQuotePortrait = slideImg && imageLayout === "quote-portrait";
      const isStoryTime = slideImg && slide.type === "story-time";
      const hasSideImage = isImageLeft || isImageRight || isQuotePortrait;
      // Reserve content-area X bounds when an image takes one side.
      const contentX = isImageLeft || isQuotePortrait ? 5.1 : 0.5;
      const contentW = hasSideImage ? 4.4 : 9;

      if (hasSideImage) {
        // Image side: left half for image-left/quote-portrait, right half
        // for image-right.
        const imgX = (isImageLeft || isQuotePortrait) ? 0.2 : 5.4;
        const imgY = 1.15;
        const imgW = 4.4;
        const imgH = 3.95;
        pSlide.addImage({
          data: slideImg!,
          x: imgX, y: imgY, w: imgW, h: imgH,
          sizing: { type: "cover", w: imgW, h: imgH },
        });
        if (slide.image?.attribution) {
          pSlide.addText(slide.image.attribution, {
            x: imgX, y: imgY + imgH - 0.22, w: imgW, h: 0.2,
            fontSize: 7, color: "FFFFFF", italic: true,
            fill: { type: "solid", color: "000000" },
            transparency: 50,
            fontFace: pptxFont, align: "left",
          });
        }
      }

      let yPos = paintSendStrips(pSlide, slide, 1.15);

      // Quote-portrait: put the quote in big italic text on the content side
      // instead of running the generic body/bullet path.
      const skipGenericBody = isQuotePortrait && Boolean(slide.quote);
      if (skipGenericBody) {
        pSlide.addText(`"${slide.quote}"`, {
          x: contentX, y: yPos + 0.2, w: contentW, h: 2.5,
          fontSize: 18, italic: true, color: slideTitleClean,
          fontFace: pptxFont, wrap: true, valign: "middle",
        });
        if (slide.attribution) {
          pSlide.addText(`— ${slide.attribution}`, {
            x: contentX, y: yPos + 2.8, w: contentW, h: 0.4,
            fontSize: 12, bold: true, color: slideTextClean,
            fontFace: pptxFont, wrap: true,
          });
        }
      }

      if (!skipGenericBody && slide.body) {
        pSlide.addText(slide.body, {
          x: contentX, y: yPos, w: contentW, h: 0.5,
          fontSize: Math.max(12, minBodyPt), color: isDark ? "94A3B8" : "6B7280",
          italic: true, fontFace: pptxFont, wrap: true,
        });
        yPos += 0.6;
      }

      if (!skipGenericBody && slide.question) {
        pSlide.addShape(pptx.ShapeType.rect, {
          x: contentX, y: yPos, w: contentW, h: 0.8,
          fill: { type: "solid", color: lightClean },
          rectRadius: 0.1,
        });
        pSlide.addText(slide.question, {
          x: contentX + 0.2, y: yPos + 0.1, w: contentW - 0.4, h: 0.6,
          fontSize: Math.max(15, minBodyPt + 3), bold: true, color: slideTitleClean,
          align: "center", fontFace: pptxFont, wrap: true,
        });
        yPos += 1.0;
      }

      if (!skipGenericBody && slide.bullets && slide.bullets.length > 0) {
        slide.bullets.forEach(bullet => {
          pSlide.addShape(pptx.ShapeType.rect, {
            x: contentX, y: yPos, w: contentW, h: 0.55,
            fill: { type: "solid", color: lightClean },
            rectRadius: 0.06,
          });
          // Visible checkbox (ADHD) or regular bullet dot
          if (slide.visibleCheckboxes) {
            pSlide.addShape(pptx.ShapeType.rect, {
              x: contentX + 0.1, y: yPos + 0.14, w: 0.28, h: 0.28,
              fill: { type: "solid", color: "FFFFFF" }, line: { color: secondaryClean, width: 1.5 },
              rectRadius: 0.03,
            });
          } else {
            pSlide.addShape(pptx.ShapeType.ellipse, {
              x: contentX + 0.15, y: yPos + 0.18, w: 0.18, h: 0.18,
              fill: { type: "solid", color: secondaryClean },
            });
          }
          pSlide.addText(bullet, {
            x: contentX + 0.55, y: yPos + 0.08, w: contentW - 0.7, h: 0.4,
            fontSize: Math.max(12, minBodyPt), color: slideTextClean,
            fontFace: pptxFont, wrap: true,
          });
          yPos += 0.65;
        });
      }

      // Story-time: render a wide horizontal image strip below body when no
      // side image is in play (story-time uses the narrative + photo combo,
      // not a half-canvas split).
      if (isStoryTime && !hasSideImage && slideImg) {
        const stripY = Math.max(yPos + 0.1, 3.6);
        const stripH = Math.min(1.4, 5.1 - stripY - 0.1);
        if (stripH > 0.4) {
          pSlide.addImage({
            data: slideImg,
            x: 0.5, y: stripY, w: 9, h: stripH,
            sizing: { type: "cover", w: 9, h: stripH },
          });
          if (slide.image?.attribution) {
            pSlide.addText(slide.image.attribution, {
              x: 0.5, y: stripY + stripH - 0.22, w: 9, h: 0.2,
              fontSize: 7, color: "FFFFFF", italic: true,
              fill: { type: "solid", color: "000000" },
              transparency: 50,
              fontFace: pptxFont, align: "left",
            });
          }
        }
      }

      // Method steps inline (Dyslexia/Dyscalculia)
      if (slide.methodSteps && slide.methodSteps.length) {
        pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: yPos, w: 9, h: 0.3 + slide.methodSteps.length * 0.28, fill: { type: "solid", color: "FFFFFF" }, line: { color: secondaryClean, width: 1.5 }, rectRadius: 0.06 });
        pSlide.addText("Method steps", { x: 0.6, y: yPos + 0.04, w: 8.8, h: 0.22, fontSize: 9, bold: true, color: "4B5563", fontFace: pptxFont });
        slide.methodSteps.forEach((step, i) => {
          pSlide.addText(`${i + 1}. ${step}`, { x: 0.8, y: yPos + 0.26 + i * 0.28, w: 8.4, h: 0.26, fontSize: 11, color: slideTextClean, fontFace: pptxFont, wrap: true });
        });
        yPos += 0.4 + slide.methodSteps.length * 0.28;
      }

      // Help box inline (MLD)
      if (slide.helpBox && slide.helpBox.length) {
        pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: yPos, w: 9, h: 0.3 + slide.helpBox.length * 0.26, fill: { type: "solid", color: "FEF9C3" }, line: { color: "CA8A04", width: 1 }, rectRadius: 0.06 });
        pSlide.addText("Help box", { x: 0.6, y: yPos + 0.04, w: 8.8, h: 0.22, fontSize: 9, bold: true, color: "713F12", fontFace: pptxFont });
        slide.helpBox.forEach((item, i) => {
          pSlide.addText(`• ${item}`, { x: 0.8, y: yPos + 0.26 + i * 0.26, w: 8.4, h: 0.24, fontSize: 11, color: "713F12", fontFace: pptxFont, wrap: true });
        });
        yPos += 0.4 + slide.helpBox.length * 0.26;
      }

      // Completion checklist (ASC/Tourette's)
      if (slide.completionChecklist && slide.completionChecklist.length) {
        pSlide.addShape(pptx.ShapeType.rect, { x: 0.5, y: yPos, w: 9, h: 0.3 + slide.completionChecklist.length * 0.26, fill: { type: "solid", color: "FFFFFF" }, line: { color: secondaryClean, width: 1 }, rectRadius: 0.06 });
        pSlide.addText("Completion checklist", { x: 0.6, y: yPos + 0.04, w: 8.8, h: 0.22, fontSize: 9, bold: true, color: "4B5563", fontFace: pptxFont });
        slide.completionChecklist.forEach((item, i) => {
          const ry = yPos + 0.26 + i * 0.26;
          pSlide.addShape(pptx.ShapeType.rect, { x: 0.75, y: ry + 0.03, w: 0.18, h: 0.18, fill: { type: "solid", color: "FFFFFF" }, line: { color: secondaryClean, width: 1 }, rectRadius: 0.02 });
          pSlide.addText(item, { x: 1.0, y: ry, w: 8.3, h: 0.24, fontSize: 11, color: slideTextClean, fontFace: pptxFont, wrap: true });
        });
        yPos += 0.4 + slide.completionChecklist.length * 0.26;
      }

      // Differentiation cards strip
      if (slide.differentiation && (slide.differentiation.support || slide.differentiation.core || slide.differentiation.extension)) {
        const d = slide.differentiation;
        const cards = [
          d.support && { bg: "DCFCE7", border: "16A34A", label: "SUPPORT", text: d.support, tcol: "14532D" },
          d.core && { bg: "DBEAFE", border: "2563EB", label: "CORE", text: d.core, tcol: "1E3A8A" },
          d.extension && { bg: "F5F3FF", border: "7C3AED", label: "EXTENSION", text: d.extension, tcol: "5B21B6" },
        ].filter(Boolean) as any[];
        const cw = 9.0 / Math.max(cards.length, 1) - 0.1;
        cards.forEach((c, i) => {
          const cx = 0.5 + i * (cw + 0.1);
          pSlide.addShape(pptx.ShapeType.rect, { x: cx, y: yPos, w: cw, h: 0.7, fill: { type: "solid", color: c.bg }, line: { color: c.border, width: 1 }, rectRadius: 0.06 });
          pSlide.addText(c.label, { x: cx + 0.08, y: yPos + 0.04, w: cw - 0.16, h: 0.2, fontSize: 8, bold: true, color: c.tcol, fontFace: pptxFont });
          pSlide.addText(c.text, { x: cx + 0.08, y: yPos + 0.24, w: cw - 0.16, h: 0.44, fontSize: 10, color: c.tcol, fontFace: pptxFont, wrap: true });
        });
      }

      // Paint programmatic diagram if present
      if (slide.diagram) {
        paintDiagram(pSlide, slide.diagram, 0.5, 1.15, 5.5, 3.5);
      }

      paintSendFooter(pSlide, slide);
    }

    // Slide number footer
    pSlide.addText(`${idx + 1} / ${presentation.slides.length}`, {
      x: 8.5, y: 5.15, w: 1, h: 0.25,
      fontSize: 9, color: "9CA3AF",
      align: "right",
    });
  }

  await pptx.writeFile({ fileName: `${presentation.title.replace(/[^a-z0-9]/gi, "_")}_Adaptly.pptx` });
}

// ─── Presenter Mode ───────────────────────────────────────────────────────
// Real presenter view: current slide on left, next preview + notes + clock +
// timer + key legend on the right. Blackout/whiteout overlay sits on top when
// the teacher hits B / W. All keyboard handling routed through the parent's
// `onKeyDown` so reveal state stays in one place.
function PresenterMode({
  presentation, theme, activeSlide, revealLevel,
  timerSeconds, timerPaused, blackout, showNotes, branding,
  onKeyDown, onSetActive, onExit, onTogglePause, onClearBlackout,
  symbolSupport = false,
}: {
  presentation: PresentationData;
  theme: ComposedTheme;
  activeSlide: number;
  revealLevel: number;
  timerSeconds: number | null;
  timerPaused: boolean;
  blackout: "none" | "black" | "white";
  showNotes: boolean;
  branding?: SchoolIdentity;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSetActive: (i: number) => void;
  onExit: () => void;
  onTogglePause: () => void;
  onClearBlackout: () => void;
  symbolSupport?: boolean;
}) {
  const slide = presentation.slides[activeSlide];
  const next = presentation.slides[activeSlide + 1];
  const total = presentation.slides.length;

  // Wall-clock string, refreshed every second.
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const wall = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Timer chrome — colours shift red <60s.
  const mins = timerSeconds == null ? null : Math.floor(timerSeconds / 60);
  const secs = timerSeconds == null ? null : timerSeconds % 60;
  const timerLow = (timerSeconds ?? 9999) < 60;
  const timerStr = timerSeconds == null ? "—" : `${mins}:${(secs as number).toString().padStart(2, "0")}`;

  if (!slide) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex outline-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
      ref={el => el?.focus()}
    >
      {/* Blackout / whiteout overlay (B / W keys) ───────────────────────── */}
      {blackout !== "none" && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center cursor-pointer"
          style={{ background: blackout === "black" ? "#000" : "#fff" }}
          onClick={onClearBlackout}
          role="button"
          aria-label="Blackout — click or press any key to restore"
        >
          <div className={`text-xs ${blackout === "black" ? "text-white/30" : "text-black/30"}`}>
            (press any key to resume)
          </div>
        </div>
      )}

      {/* Left — main slide ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl" style={{ aspectRatio: "16/9" }}>
            <FullSlideView slide={slide} theme={theme} index={activeSlide} total={total} revealLevel={revealLevel} branding={branding} symbolSupport={symbolSupport} />
          </div>
        </div>
        {/* Bottom control strip ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-2 bg-black/60 text-white text-xs">
          <div className="flex items-center gap-3">
            <button onClick={() => onSetActive(Math.max(0, activeSlide - 1))} disabled={activeSlide === 0} className="flex items-center gap-1 disabled:opacity-30 hover:text-gray-300">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button onClick={() => onSetActive(Math.min(total - 1, activeSlide + 1))} disabled={activeSlide === total - 1} className="flex items-center gap-1 disabled:opacity-30 hover:text-gray-300">
              Next <ChevronRight className="w-4 h-4" />
            </button>
            <div className="opacity-70 ml-2">{activeSlide + 1} / {total}</div>
          </div>
          <div className="opacity-60 hidden md:block">→ reveal · ↓ next · R reveal-all · B black · W white · T pause · N notes · Esc exit</div>
          <button onClick={onExit} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right — presenter sidebar ───────────────────────────────────────── */}
      <div className="w-80 bg-slate-900 text-white flex flex-col border-l border-slate-700 hidden lg:flex">
        {/* Clock + timer */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 opacity-60" />
            <div className="text-sm font-mono">{wall}</div>
          </div>
          <button onClick={onTogglePause} className={`text-xs font-mono px-2 py-1 rounded ${timerLow ? "bg-red-500 text-white animate-pulse" : "bg-slate-800"}`}>
            {timerPaused ? <Play className="w-3 h-3 inline" /> : <Pause className="w-3 h-3 inline" />} {timerStr}
          </button>
        </div>
        {/* Next slide preview */}
        <div className="p-3 border-b border-slate-800">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Next slide</div>
          {next ? (
            <div className="rounded-md overflow-hidden border border-slate-700 bg-white" style={{ aspectRatio: "16/9" }}>
              <div className="w-full h-full transform scale-[0.4] origin-top-left" style={{ width: "250%", height: "250%" }}>
                <FullSlideView slide={next} theme={theme} index={activeSlide + 1} total={total} symbolSupport={symbolSupport} />
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">— end of deck —</div>
          )}
        </div>
        {/* Speaker notes */}
        {showNotes && (
          <div className="p-3 flex-1 overflow-y-auto">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Speaker notes</div>
            <div className="text-xs leading-relaxed whitespace-pre-wrap">
              {slide.speakerNotes || <span className="italic text-slate-500">(no notes)</span>}
            </div>
          </div>
        )}
        {!showNotes && (
          <div className="p-3 flex-1 overflow-y-auto">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Slide info</div>
            <div className="text-xs space-y-1">
              <div><span className="text-slate-400">Type:</span> {SLIDE_LABELS[slide.type] || slide.type}</div>
              {slide.timingMinutes && <div><span className="text-slate-400">Timing:</span> {slide.timingMinutes} min</div>}
              {Number.isFinite(revealLevel) && <div><span className="text-slate-400">Reveal:</span> {revealLevel}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PresentationMaker() {
  const { user } = useApp();
  const [, setLocation] = useLocation();

  // Form state
  const [subject, setSubject] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [topic, setTopic] = useState("");
  const [lessonType, setLessonType] = useState("introduction");
  const [slideCount, setSlideCount] = useState("18");
  const [objectives, setObjectives] = useState("");
  // Multi-select SEND needs — stored as a string[] of canonical spec ids
  // (e.g. ["adhd","dyslexia"]). Empty array = no adaptations. Teachers can
  // also type free-form notes via `sendNeedsNotes` which is combined with
  // the structured ids when the prompt is built.
  const [sendNeedIds, setSendNeedIds] = useState<string[]>([]);
  const [sendNeedsNotes, setSendNeedsNotes] = useState("");
  // V5 — opt-in ARASAAC symbol support for word-bank / key-terms / vocab
  // slides (SEND USP). Deck-level toggle; off by default so existing decks
  // render identically until a teacher turns it on.
  const [symbolSupport, setSymbolSupport] = useState(false);
  // Compose the sendNeeds string used by buildSlidePrompt (structured ids +
  // optional free-text notes, comma-separated).
  const sendNeeds = [...sendNeedIds, sendNeedsNotes.trim()].filter(Boolean).join(",");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("navy");
  const [readingAge, setReadingAge] = useState<number>(12);
  const [examBoard, setExamBoard] = useState("none");
  const [differentiationLevel, setDifferentiationLevel] = useState<"foundation" | "core" | "extension">("core");

  // Auto-select Rainbow theme for primary school year groups
  const handleYearGroupChange = (value: string) => {
    setYearGroup(value);
    if (/year [1-6]|ks1|ks2|reception/i.test(value)) {
      setSelectedTheme("rainbow");
    } else if (selectedTheme === "rainbow") {
      setSelectedTheme("navy");
    }
  };

  // Generation state
  const [loading, setLoading] = useState(false);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);

  // ── Feature state ────────────────────────────────────────────────────────────
  // Fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Email dialog
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [emailFormat, setEmailFormat] = useState<"pdf" | "pptx">("pdf");
  const [sendingEmail, setSendingEmail] = useState(false);
  // Save to library
  const [savingToLib, setSavingToLib] = useState(false);
  const [savedToLib, setSavedToLib] = useState(false);
  // SEND Adaptation — multi-select ids (canonical spec ids from send-data.ts).
  // Same ids used by the main generate form; the adapt dialog simply re-uses
  // them so the two flows stay in lock-step.
  const [showSendAdaptDialog, setShowSendAdaptDialog] = useState(false);
  const [sendAdaptNeedIds, setSendAdaptNeedIds] = useState<string[]>(["dyslexia"]);
  const [sendAdaptNotes, setSendAdaptNotes] = useState("");
  const [adaptingForSend, setAdaptingForSend] = useState(false);
  const [adaptedPresentation, setAdaptedPresentation] = useState<PresentationData | null>(null);
  const [showSendComparison, setShowSendComparison] = useState(false);
  const [comparisonActiveSlide, setComparisonActiveSlide] = useState(0);
  // Inline slide edit
  const [slideEditValues, setSlideEditValues] = useState<Partial<SlideContent>>({});

  // ── Iterative refinement ─────────────────────────────────────────────────────
  // We keep the conversation history across generate → refine rounds so the
  // AI remembers the full deck context and the teacher's prior instructions.
  // Per the guide: "Iterating with specific feedback is more powerful than
  // getting the perfect first prompt. The AI remembers context within a
  // conversation, so you can refine slide by slide without regenerating the
  // whole presentation."
  const [conversation, setConversation] = useState<AIChatMessage[]>([]);
  const [showRefineDialog, setShowRefineDialog] = useState(false);
  const [refineScope, setRefineScope] = useState<"slide" | "deck">("slide");
  const [refineTargetSlide, setRefineTargetSlide] = useState<number>(0);
  const [refineText, setRefineText] = useState("");
  const [refining, setRefining] = useState(false);

  // ── Phase 3 — Presenter classroom features ─────────────────────────────
  /** Click-to-reveal counter for the active slide (resets on slide change). */
  const [revealLevel, setRevealLevel] = useState<number>(Infinity);
  /** Live countdown remaining seconds; null when no timer running. */
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerPaused, setTimerPaused] = useState<boolean>(false);
  /** Blackout/whiteout overlay (B / W keys in presenter). */
  const [blackout, setBlackout] = useState<"none"|"black"|"white">("none");
  /** Display preferences — independent of SEND. Affects on-screen preview only. */
  const [zoom, setZoom] = useState<number>(1.0);
  const [fontOverride, setFontOverride] = useState<""|"sans"|"serif"|"mono"|"dyslexic">("");
  const [contrastMode, setContrastMode] = useState<"normal"|"high"|"sepia">("normal");
  const [showDisplayPrefs, setShowDisplayPrefs] = useState(false);
  /** Read-aloud (Web Speech API) handle. */
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  /** AfL polling QR for the active slide. */
  const [showPollQR, setShowPollQR] = useState(false);
  /** Speaker-notes batch generator state. */
  const [generatingNotes, setGeneratingNotes] = useState(false);
  /** School identity dialog. */
  const [showIdentityDialog, setShowIdentityDialog] = useState(false);
  const [identity, setIdentity] = useState<SchoolIdentity>(() => readSchoolIdentity());
  /** Per-slide version history (item 53) — last 5 versions per slide index. */
  const [slideHistory, setSlideHistory] = useState<Record<number, SlideContent[]>>({});
  const [historyForIdx, setHistoryForIdx] = useState<number | null>(null);
  /** Variant generator state (item 55). */
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [variantOptions, setVariantOptions] = useState<SlideContent[] | null>(null);
  const [variantTargetIdx, setVariantTargetIdx] = useState<number>(0);

  // Reset reveal level + timer whenever the active slide changes.
  useEffect(() => {
    setRevealLevel(Infinity);
    setBlackout("none");
    // Stop any in-progress speech when the slide changes.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIdx(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlide, presentation?.slides?.length]);

  // Drive the live countdown timer when in fullscreen mode and the slide has a duration.
  useEffect(() => {
    if (!isFullscreen || !presentation) { setTimerSeconds(null); return; }
    const cur = presentation.slides[activeSlide];
    if (!cur?.timingMinutes) { setTimerSeconds(null); return; }
    setTimerSeconds(cur.timingMinutes * 60);
    setTimerPaused(false);
  }, [isFullscreen, activeSlide, presentation]);
  useEffect(() => {
    if (timerSeconds === null || timerPaused) return;
    if (timerSeconds <= 0) return;
    const id = window.setInterval(() => setTimerSeconds(s => (s == null ? null : Math.max(0, s - 1))), 1000);
    return () => window.clearInterval(id);
  }, [timerSeconds, timerPaused]);

  // ── Autosave & draft recovery ──────────────────────────────────────────
  // Write the current presentation + form state to localStorage on every
  // edit (debounced 1.5s), so a refresh / crash doesn't lose work. On mount,
  // offer to restore the most-recent draft if one exists.
  const AUTOSAVE_KEY = "adaptly_pres_maker_draft_v1";
  const hasOfferedRecover = useRef(false);
  useEffect(() => {
    if (hasOfferedRecover.current) return;
    hasOfferedRecover.current = true;
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      const ageHours = (Date.now() - (draft?.at || 0)) / 3_600_000;
      if (!draft?.presentation || ageHours > 24) return;
      // Tiny prompt — we don't auto-restore without consent.
      const ok = window.confirm(`Recover unsaved presentation "${draft.presentation.title}" from ${Math.round(ageHours * 60)} min ago?`);
      if (ok) {
        setPresentation(draft.presentation);
        if (draft.subject) setSubject(draft.subject);
        if (draft.yearGroup) setYearGroup(draft.yearGroup);
        if (draft.topic) setTopic(draft.topic);
        if (draft.theme) setSelectedTheme(draft.theme);
        toast.success("Draft restored.");
      } else {
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!presentation) return;
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
          at: Date.now(),
          presentation,
          subject, yearGroup, topic, theme: selectedTheme,
        }));
      } catch {}
    }, 1500);
    return () => window.clearTimeout(id);
  }, [presentation, subject, yearGroup, topic, selectedTheme]);

  // Base theme is what the teacher chose; `theme` is the SEND-composed version
  // used for every render. When no SEND needs are selected, composeTheme
  // returns the base theme unchanged (applied* fields empty). Passing the
  // subject lets `subject-auto` resolve the matching subject palette.
  const theme = composeTheme(selectedTheme, sendNeedIds, subject);
  // Subject-aware font, honouring SEND > theme > subject. Used for the on-screen
  // preview; the PPTX export resolves the same way inside `exportToPptx`.
  const activeFont = resolveActiveFont(theme, subject);

  const handleGenerate = async () => {
    if (!subject || !yearGroup || !topic) {
      toast.error("Please fill in Subject, Year Group, and Topic");
      return;
    }

    setLoading(true);
    setPresentation(null);
    setActiveSlide(0);

    try {
      const template = resolvePresentationTemplate({ subject, yearGroup, lessonType, sendNeeds, differentiationLevel });
      const { system, user: userPrompt } = buildSlidePrompt({
        subject,
        yearGroup,
        topic,
        lessonType,
        slideCount: parseInt(slideCount),
        objectives,
        sendNeeds,
        additionalNotes,
        readingAge,
        examBoard,
        differentiationLevel,
      });

      const result = await callAI(system, userPrompt, 8000);

      // Parse JSON
      let parsed: PresentationData;
      try {
        const rawText = typeof result === 'string' ? result : (result as any).text || JSON.stringify(result);
        const cleaned = rawText
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```\s*$/, "")
          .trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        const rawParsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
        // Validate with Zod schema
        const zodResult = PresentationDataSchema.safeParse({ ...rawParsed, theme: rawParsed.theme || template.defaultTheme || selectedTheme });
        if (!zodResult.success) {
          console.warn("[PresentationMaker] Zod validation issues:", zodResult.error.flatten());
          // Fall back to raw parsed data if it has slides — Zod errors are non-fatal here
          // as the AI may return extra fields or slightly different types
          if (!rawParsed.slides || !Array.isArray(rawParsed.slides) || rawParsed.slides.length === 0) {
            throw new Error("No slides were generated. Please try again.");
          }
          parsed = { ...(rawParsed as PresentationData), theme: rawParsed.theme || template.defaultTheme || selectedTheme } as PresentationData;
        } else {
          parsed = zodResult.data as PresentationData;
        }
      } catch (parseErr: any) {
        if (parseErr.message?.includes("No slides")) throw parseErr;
        throw new Error("Failed to parse AI response as JSON. Please try again.");
      }

      if (!parsed.theme && template.defaultTheme) {
        parsed.theme = template.defaultTheme;
      }
      setPresentation(parsed);
      // Phase 4 / items 9 + 52 — resolve every slide's `image_prompt` to a
      // real Pexels/Unsplash image with attribution + licence so the
      // library save, email digest and PPTX export all carry the same
      // picture. Runs in the background; the renderer falls back to the
      // legacy keyword URL until resolution completes.
      void (async () => {
        try {
          const resolvedSlides = await resolveDeckImages(parsed.slides as any);
          setPresentation((curr) => {
            if (!curr) return curr;
            // Bail if the user has already moved on to a different deck.
            if (curr.title !== parsed.title || curr.slides.length !== resolvedSlides.length) return curr;
            return { ...curr, slides: resolvedSlides as typeof curr.slides };
          });
        } catch (e) {
          // Resolution is best-effort — never block the generation flow.
          console.warn("[PresentationMaker] image resolution failed:", e);
        }
      })();
      // Seed the conversation with the system + user + assistant round so
      // refinement turns can build on this context without re-sending
      // everything. The assistant message stores the AI's JSON output so the
      // model "remembers" what it previously produced.
      const assistantText = typeof result === 'string' ? result : (result as any).text || JSON.stringify(result);
      setConversation([
        { role: "system", content: system },
        { role: "user", content: userPrompt },
        { role: "assistant", content: assistantText },
      ]);
      toast.success(`Generated ${parsed.slides.length} slides!`);
    } catch (err: any) {
      console.error("Presentation generation failed:", err);
      toast.error(err.message || "Failed to generate presentation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Iterative refinement ─────────────────────────────────────────────────
  // The centrepiece of the teacher-framework: "Iterating with specific
  // feedback is more powerful than getting the perfect first prompt."
  //
  // Opens the refine dialog. When scope === "slide" the panel is pre-seeded
  // with a template that pinpoints the current slide; when scope === "deck"
  // the panel drops the per-slide pointer and talks about the whole deck.
  const openRefineDialog = (scope: "slide" | "deck", slideIndex?: number) => {
    const idx = typeof slideIndex === "number" ? slideIndex : activeSlide;
    setRefineScope(scope);
    setRefineTargetSlide(idx);
    const slide = presentation?.slides[idx];
    const slideLabel = slide ? `slide ${idx + 1} (${SLIDE_LABELS[slide.type] || slide.type})` : `slide ${idx + 1}`;
    const template = scope === "slide"
      ? `The previous output was missing [describe what's missing]. On this version, ensure ${slideLabel} has [specific improvement]. Give it [e.g. a worked example box with these contents / a misconception callout / a word bank / a timing indicator / a mark allocation / a SEND "what you need to do" box].`
      : `The previous output was missing [describe what's missing]. On this version, ensure every slide has [specific improvement across the whole deck]. Focus particularly on [e.g. richer worked examples / SEND support / mark scheme rigour / command word accuracy].`;
    setRefineText(template);
    setShowRefineDialog(true);
  };

  // Quick-pick templates matching the teacher-framework guide. These are
  // one-click instructions that expand the refinement prompt so the teacher
  // doesn't have to type them every time.
  const REFINE_QUICK_PICKS: Array<{ label: string; template: (slideLabel: string) => string }> = [
    { label: "Add worked example box",       template: s => `Add a full worked example box to ${s} with a realistic problem, 4-6 numbered steps showing the formula, substitution, rearrangement, final answer with units, and a common error callout. Use Consolas for the maths.` },
    { label: "Add timing indicator",         template: s => `Add a timingMinutes value to ${s} appropriate for the activity (typical starter 5, activity 6-10, plenary 5).` },
    { label: "Add mark allocation",          template: s => `Add an examQuestion {stem, marks, timeMins, commandWord} block to ${s} using the exam board's actual command words and realistic marks.` },
    { label: "Add common misconception",     template: s => `Add a misconception + correction pair to ${s} naming the SPECIFIC misconception pupils have for this topic — not a generic error.` },
    { label: "Increase supply-teacher depth", template: s => `Expand ${s} so a supply teacher with no subject knowledge could deliver it from these slides alone. Every concept must be explained, not just named.` },
    { label: "Add must/should/could bands",  template: s => `Populate the successCriteria {must, should, could} on ${s} with three concrete, measurable outcomes.` },
    { label: "Add differentiation cards",    template: s => `Populate the differentiation {support, core, extension} block on ${s}. Support = scaffolded with sentence starter. Core = standard. Extension = harder application or evaluation.` },
    { label: "Add SEND word bank",           template: s => `Add a wordBank to ${s} with 4-6 essential terms and plain-English definitions appropriate for SLCN / EAL pupils.` },
    { label: "Add SEND 'what to do' box",    template: s => `Add a whatYouNeedToDo numbered-steps box to ${s} listing exactly what pupils need to do, in literal unambiguous language (ASC-friendly).` },
    { label: "Add method steps",             template: s => `Add a methodSteps list to ${s} giving the canonical method as 4-6 numbered reference steps pupils can refer back to (Dyslexia/Dyscalculia-friendly).` },
    { label: "Add sentence starter",         template: s => `Add a sentenceStarter to ${s} that pupils can copy and complete (e.g. "The answer is ___ because ___").` },
    { label: "Add exam technique",           template: s => `Add an examTip and markSchemeHint to ${s} explaining exactly how marks are awarded for this question type and what examiners look for.` },
  ];

  // Applies the refinement by calling the AI with the full conversation so
  // the model remembers the prior deck. The AI is asked to return ONLY the
  // changed slide(s) as a JSON object — we then splice those back into the
  // current presentation without regenerating anything the teacher didn't ask
  // to change.
  const handleRefine = async () => {
    if (!presentation || !refineText.trim()) return;
    setRefining(true);
    try {
      const slide = presentation.slides[refineTargetSlide];
      const scopeHeader = refineScope === "slide"
        ? `REFINE SCOPE: A SINGLE SLIDE — slide index ${refineTargetSlide} (type "${slide?.type}", title "${slide?.title}").`
        : `REFINE SCOPE: THE WHOLE DECK — every slide.`;

      // Current slide snapshot so the AI knows exactly what the "previous
      // output" looked like. For deck-wide refinement we send a compact
      // summary of all slides (title + type) to keep tokens manageable.
      const snapshot = refineScope === "slide" && slide
        ? JSON.stringify(slide)
        : JSON.stringify(presentation.slides.map((s, i) => ({ index: i, type: s.type, title: s.title })));

      const userMsg = `${scopeHeader}

TEACHER REFINEMENT REQUEST:
${refineText}

CURRENT ${refineScope === "slide" ? "SLIDE" : "DECK"} STATE:
${snapshot}

RESPONSE FORMAT (STRICT):
${refineScope === "slide"
  ? `Return ONLY a JSON object like: {"slideIndex": ${refineTargetSlide}, "slide": { ...the full updated slide object... }}. Do not return any other slides.`
  : `Return ONLY a JSON object like: {"slides": [ ...N slides in the SAME ORDER and count as the current deck, each with its full content... ]}. Preserve every slide's type and index; only change content.`}
Keep the slide types unchanged. Populate the NEW structured fields (workedExampleBox, successCriteria, vocabTable, markScheme, examQuestion, differentiation, wordBank, whatYouNeedToDo, methodSteps, helpBox, sentenceStarter, answerFrame, completionChecklist, timingMinutes, visibleCheckboxes, actionVerb, bonusLabel) as appropriate.
No markdown, no code fences, JSON only.`;

      const messages: AIChatMessage[] = [
        ...conversation,
        { role: "user", content: userMsg },
      ];
      const result = await callAIMessages(messages, 8000);
      const rawText = result.text;
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);

      let updatedSlides: SlideContent[];
      if (refineScope === "slide") {
        const idx = typeof parsed.slideIndex === "number" ? parsed.slideIndex : refineTargetSlide;
        const incoming = parsed.slide || parsed;
        if (!incoming || typeof incoming !== "object") throw new Error("Refinement response missing slide data.");
        // Stash the prior slide so the teacher can rollback (item 53).
        setSlideHistory(prev => {
          const cur = presentation.slides[idx];
          const list = (prev[idx] || []).concat([cur]).slice(-5);
          return { ...prev, [idx]: list };
        });
        updatedSlides = [...presentation.slides];
        // Preserve the existing type — the AI MUST NOT change slide types.
        updatedSlides[idx] = { ...updatedSlides[idx], ...incoming, type: updatedSlides[idx].type } as SlideContent;
        // Phase 4 — if the refined slide changed its `image_prompt` we must
        // drop the stale resolved `image` so resolveDeckImages picks a new
        // picture for the new prompt. Without this, refining a slide leaves
        // the image record pointing at the previous keyword.
        if (typeof incoming.image_prompt === "string" && incoming.image_prompt !== presentation.slides[idx].image_prompt) {
          updatedSlides[idx] = { ...updatedSlides[idx], image: undefined };
        }
      } else {
        const arr = Array.isArray(parsed.slides) ? parsed.slides : null;
        if (!arr) throw new Error("Refinement response missing slides array.");
        updatedSlides = presentation.slides.map((orig, i) => {
          const incoming = arr[i] || arr.find((s: any) => s?.index === i);
          if (!incoming) return orig;
          const merged = { ...orig, ...incoming, type: orig.type } as SlideContent;
          if (typeof incoming.image_prompt === "string" && incoming.image_prompt !== orig.image_prompt) {
            merged.image = undefined;
          }
          return merged;
        });
      }

      setPresentation({ ...presentation, slides: updatedSlides, totalSlides: updatedSlides.length });
      // Re-resolve any slides whose image_prompt changed (the spread above
      // intentionally cleared `image` so resolveDeckImages will fill it).
      void (async () => {
        try {
          const resolved = await resolveDeckImages(updatedSlides as any);
          setPresentation((curr) => {
            if (!curr) return curr;
            if (curr.slides.length !== resolved.length) return curr;
            return { ...curr, slides: resolved as typeof curr.slides };
          });
        } catch { /* best-effort */ }
      })();
      if (refineScope === "slide") setActiveSlide(refineTargetSlide);
      // Append this round to the conversation so future refinements know
      // what was asked and what the AI produced.
      setConversation([
        ...messages,
        { role: "assistant", content: rawText },
      ]);
      setShowRefineDialog(false);
      setRefineText("");
      toast.success(refineScope === "slide" ? "Slide refined." : "Deck refined.");
      recordTelemetry(refineScope === "slide" ? "refine-slide" : "refine-deck", { slideType: presentation.slides[refineTargetSlide]?.type });
    } catch (err: any) {
      console.error("Refinement failed:", err);
      toast.error(err.message || "Refinement failed. Please try again.");
    } finally {
      setRefining(false);
    }
  };

  const handleExportPptx = async () => {
    if (!presentation) return;
    setExporting(true);
    try {
      await exportToPptx(presentation, selectedTheme, sendNeedIds, symbolSupport);
      recordTelemetry("export-pptx", { slides: presentation.slides.length, theme: selectedTheme });
      toast.success("PowerPoint downloaded!");
    } catch (err: any) {
      console.error("PPTX export failed:", err);
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleCopyText = () => {
    if (!presentation) return;
    const text = presentation.slides.map((s, i) =>
      `Slide ${i + 1}: ${s.title}\n${s.bullets?.join("\n") || s.body || s.question || ""}`
    ).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  // ── Save to Library ──────────────────────────────────────────────────────────
  const handleSaveToLibrary = async () => {
    if (!presentation) return;
    setSavingToLib(true);
    try {
      const res = await fetch("/api/presentation-library/entries", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: presentation.title,
          subject: presentation.subject,
          topic: presentation.topic,
          year_group: presentation.yearGroup,
          slides: presentation.slides,
          tags: [presentation.subject, presentation.yearGroup, lessonType],
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedToLib(true);
      toast.success("Saved to Presentation Library!");
      setTimeout(() => setSavedToLib(false), 3000);
    } catch {
      toast.error("Could not save to library. Please try again.");
    }
    setSavingToLib(false);
  };

  // ── Email handler ────────────────────────────────────────────────────────────
  const handleSendEmail = async () => {
    if (!presentation || !emailTo.trim()) return;
    setSendingEmail(true);
    try {
      const res = await fetch("/api/presentation/email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentation,
          themeKey: selectedTheme,
          recipientEmail: emailTo.trim(),
          message: emailMsg,
          format: emailFormat,
        }),
      });
      if (!res.ok) throw new Error("Email failed");
      toast.success(`Presentation sent to ${emailTo}!`);
      setShowEmailDialog(false);
      setEmailTo("");
      setEmailMsg("");
    } catch {
      toast.error("Could not send email. Please try again.");
    }
    setSendingEmail(false);
  };

  // ── SEND Adaptation ──────────────────────────────────────────────────────────
  // Applies one or more canonical SEND adaptations (ids from
  // client/src/lib/sendPromptFragments.ts) to the existing deck by re-writing
  // every slide through the AI. The AI sees the full composed SEND note
  // (multi-need aware) and the structured-fields guidance so it can populate
  // the new SEND fields (wordBank, whatYouNeedToDo, methodSteps, etc.).
  const handleAdaptForSend = async () => {
    if (!presentation) return;
    if (sendAdaptNeedIds.length === 0 && !sendAdaptNotes.trim()) {
      toast.error("Pick at least one SEND need first.");
      return;
    }
    setAdaptingForSend(true);
    const appliedSpecs = resolveSendSpecs(sendAdaptNeedIds);
    const needLabel = appliedSpecs.length
      ? appliedSpecs.map(s => s.name).join(" + ")
      : sendAdaptNotes.trim() || "Additional needs";
    const allNeedsForPrompt = [...sendAdaptNeedIds, sendAdaptNotes.trim()].filter(Boolean).join(",");
    try {
      // Full slide JSON — we send everything so the AI can adapt the new
      // structured fields (vocabTable, workedExampleBox, examQuestion, etc.)
      // that the generic passthrough used to strip.
      const slideSummary = presentation.slides.map((s, i) => ({ index: i, ...s }));

      const sendNote = composeSendNoteForPresentation(allNeedsForPrompt) ||
        `For "${needLabel}": reduce cognitive load, chunk information, use clear simple language, and add support cues appropriate to the need.`;

      const systemPrompt = `You are an expert UK SEND teacher adapting a lesson presentation for pupils with ${needLabel}.
Adapt EVERY slide to be accessible for this specific combination of needs while preserving the academic rigour.

${sendNote}

SEND STRUCTURED FIELDS (populate these on relevant slides — do NOT stuff SEND content into generic body/bullets):
- "whatYouNeedToDo": string[] — numbered "what you need to do:" steps (ASC, Asperger)
- "wordBank": {term, definition}[] — plain-English key vocabulary (SLCN, EAL, MLD)
- "sentenceStarter": string — "The answer is..." etc. (SLCN, Dyslexia)
- "answerFrame": string — "The X is ___ because ___" (SLCN, MLD)
- "methodSteps": string[] — numbered method reference (Dyslexia, Dyscalculia)
- "helpBox": string[] — key facts/formulas (MLD)
- "completionChecklist": string[] — tick-box checklist (ASC, Tourette's)
- "visualCue": string — one-line visual cue reference (SLCN, EAL)
- "bonusLabel": string — "OPTIONAL BONUS", "Secret Mission", "Explore" (Anxiety, PDA)
- "actionVerb": string — bolded action verb at top of activity (ADHD)
- "visibleCheckboxes": boolean — draw [ ] before every bullet (ADHD)
- "timingMinutes": number — add timing if not present on activity slides

Rules:
- Return ONLY valid JSON array matching input structure exactly.
- Keep all fields not relevant as null/undefined.
- Preserve the pedagogical intent and academic rigour of every slide.
- Do NOT change the slide types or the index order.
- You MAY insert NEW slides of type "brain-break" (ADHD), "checkin" (Anxiety), "method-steps" (Dyslexia), "help-box" (MLD), "word-bank" (SLCN/EAL), "take-a-break" (PDA/Tourette's) using index values that sit BETWEEN original slides (e.g. 2.5 between slides 2 and 3) — the caller will re-sequence indices afterward.`;

      const userPrompt = `Adapt these ${presentation.slides.length} slides for pupils with ${needLabel}.
Input slides JSON:
${JSON.stringify(slideSummary)}

Return JSON array of adapted slides.`;

      const result = await callAI(systemPrompt, userPrompt, 8000);
      const rawText = typeof result === "string" ? result : (result as any).text || JSON.stringify(result);
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      const adaptedSlides: any[] = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);

      // Merge each adapted slide back onto the original so fields the AI didn't
      // touch survive. This is a SPREAD merge — we take the original, then the
      // adapted fields win, then we force-preserve `type` (never let the AI
      // change it). New slides the AI injected (index values not in 0..N-1) are
      // appended in order.
      const adaptedMap = new Map<number, any>();
      const newSlides: any[] = [];
      for (const a of adaptedSlides) {
        if (typeof a.index === "number" && Number.isInteger(a.index) && a.index < presentation.slides.length) {
          adaptedMap.set(a.index, a);
        } else if (typeof a.index === "number") {
          newSlides.push(a);
        }
      }
      const merged = presentation.slides.map((orig, i) => {
        const adapted = adaptedMap.get(i) || adaptedSlides[i];
        if (!adapted) return orig;
        const { index: _i, type: _t, ...fields } = adapted;
        return { ...orig, ...fields } as SlideContent;
      });
      // Insert any AI-injected SEND slides between originals, sorted by index.
      newSlides
        .sort((a, b) => (a.index || 0) - (b.index || 0))
        .forEach(ns => {
          const pos = Math.max(0, Math.min(merged.length, Math.round(ns.index)));
          const { index: _i, ...rest } = ns;
          merged.splice(pos, 0, rest as SlideContent);
        });

      const newPresentation: PresentationData = {
        ...presentation,
        title: `${presentation.title} — ${needLabel} Adapted`,
        slides: merged,
        totalSlides: merged.length,
      };

      setAdaptedPresentation(newPresentation);
      setShowSendAdaptDialog(false);
      setShowSendComparison(true);
      setComparisonActiveSlide(0);
      toast.success(`Adapted for ${needLabel} — pick which version to use!`);
    } catch (err: any) {
      console.error("SEND adaptation failed:", err);
      toast.error("Adaptation failed. Please try again.");
    }
    setAdaptingForSend(false);
  };

  // ── Print Handout ────────────────────────────────────────────────────────────
  const handlePrintHandout = (layout: "1up" | "2up" | "notes") => {
    if (!presentation) return;
    const theme = composeTheme(selectedTheme, sendNeedIds, presentation.subject);
    const slidesHtml = presentation.slides.map((slide, i) => {
      const bullets = slide.bullets?.map(b => `<li>${b}</li>`).join("") || "";
      const steps = slide.steps?.map((s, si) => `<li><strong>${si + 1}.</strong> ${s}</li>`).join("") || "";
      const terms = slide.terms?.map(t => `<tr><td><strong>${t.term}</strong></td><td>${t.definition}</td></tr>`).join("") || "";
      const slideContent = `
        <div class="slide-card" style="background:${slide.type === "title" ? theme.primary : "#fff"};color:${slide.type === "title" ? "#fff" : theme.text};border:2px solid ${theme.secondary};border-radius:8px;padding:16px;page-break-inside:avoid;">
          <div style="font-size:8px;color:${slide.type === "title" ? "rgba(255,255,255,0.7)" : "#888"};margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">${SLIDE_LABELS[slide.type] || slide.type}</div>
          <div style="font-size:${layout === "1up" ? "20px" : "13px"};font-weight:bold;margin-bottom:8px;color:${slide.type === "title" ? "#fff" : theme.primary}">${slide.title}</div>
          ${slide.subtitle ? `<div style="font-size:${layout === "1up" ? "14px" : "10px"};color:${slide.type === "title" ? "rgba(255,255,255,0.8)" : "#555"};margin-bottom:8px">${slide.subtitle}</div>` : ""}
          ${slide.body ? `<p style="font-size:${layout === "1up" ? "13px" : "9px"};margin:4px 0">${slide.body}</p>` : ""}
          ${slide.question ? `<p style="font-size:${layout === "1up" ? "13px" : "9px"};font-weight:bold;background:${theme.light};padding:6px;border-radius:4px">${slide.question}</p>` : ""}
          ${bullets ? `<ul style="font-size:${layout === "1up" ? "13px" : "9px"};margin:4px 0;padding-left:16px">${bullets}</ul>` : ""}
          ${steps ? `<ol style="font-size:${layout === "1up" ? "13px" : "9px"};margin:4px 0;padding-left:16px">${steps}</ol>` : ""}
          ${terms ? `<table style="font-size:9px;width:100%;border-collapse:collapse">${terms}</table>` : ""}
          <div style="text-align:right;font-size:7px;color:#aaa;margin-top:4px">${i+1}/${presentation.slides.length}</div>
        </div>`;
      if (layout === "notes") {
        return `<div style="margin-bottom:24px;page-break-after:always">${slideContent}<div style="margin-top:8px;padding:8px;border:1px solid #ddd;border-radius:4px;min-height:60px;font-size:10px;color:#555"><strong>Speaker Notes:</strong><br>${slide.speakerNotes || "<em>(no notes)</em>"}</div></div>`;
      }
      return slideContent;
    });

    const cols = layout === "1up" ? 1 : 2;
    const printHtml = `<!DOCTYPE html><html><head><title>${presentation.title} — Handout</title>
<style>body{font-family:sans-serif;margin:0;padding:16px}.grid{display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px}@media print{body{margin:0;padding:8px}.slide-card{break-inside:avoid}}</style>
</head><body><h2 style="font-size:14px;margin-bottom:12px;color:${theme.primary}">${presentation.title} · ${presentation.subject} · ${presentation.yearGroup}</h2>
<div class="${layout === "notes" ? "" : "grid"}">${slidesHtml.join(layout === "notes" ? "" : "\n")}</div>
<p style="font-size:9px;color:#aaa;margin-top:16px;text-align:center">Generated by Adaptly · adaptly.co.uk</p>
</body></html>`;

    const w = window.open("", "_blank");
    if (!w) { toast.error("Please allow popups to print."); return; }
    w.document.write(printHtml);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  };

  // ── Fullscreen / Presenter keyboard binding ─────────────────────────────────
  // Conventions follow PowerPoint / Keynote so muscle memory transfers:
  //   →, Space  →  next reveal step on current slide; advance slide if exhausted
  //   ↓, PgDn   →  next slide (no progressive reveal)
  //   ←, ↑, PgUp →  previous slide
  //   R         →  reveal everything on the current slide
  //   B         →  black-out screen (toggle)
  //   W         →  white-out screen (toggle)
  //   T         →  pause/resume countdown timer
  //   .         →  jump back to first slide
  //   End       →  jump to last slide
  //   N         →  toggle speaker notes (companion panel)
  //   Esc       →  clear blackout, then exit
  const handleFullscreenKeyDown = (e: React.KeyboardEvent) => {
    if (!isFullscreen || !presentation) return;
    const cur = presentation.slides[activeSlide];
    const total = presentation.slides.length;
    // If we're blacked-out, any key restores the slide except Esc which exits.
    if (blackout !== "none") {
      if (e.key === "Escape") setBlackout("none");
      else { e.preventDefault(); setBlackout("none"); }
      return;
    }
    switch (e.key) {
      case "ArrowRight":
      case " ":
      case "Spacebar": {
        e.preventDefault();
        // Reveal-aware advance: increment revealLevel up to a slide-specific
        // ceiling, then advance to the next slide.
        const ceiling = (() => {
          if (cur?.workedExampleBox) return cur.workedExampleBox.steps.length + 1; // steps + answer
          if (cur?.type === "pause-and-solve" || cur?.type === "check-understanding" || cur?.type === "mini-quiz" || cur?.type === "model-answer" || cur?.type === "stuck-help" || cur?.type === "exit-ticket") return 1;
          return 0;
        })();
        if (Number.isFinite(revealLevel) && (revealLevel as number) < ceiling) {
          setRevealLevel(((revealLevel as number) || 0) + 1);
        } else {
          if (activeSlide < total - 1) setActiveSlide(activeSlide + 1);
        }
        break;
      }
      case "ArrowDown":
      case "PageDown":
        e.preventDefault();
        if (activeSlide < total - 1) setActiveSlide(activeSlide + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        e.preventDefault();
        if (activeSlide > 0) setActiveSlide(activeSlide - 1);
        break;
      case "r":
      case "R":
        e.preventDefault();
        setRevealLevel(Infinity);
        break;
      case "b":
      case "B":
        e.preventDefault();
        setBlackout("black");
        break;
      case "w":
      case "W":
        e.preventDefault();
        setBlackout("white");
        break;
      case "t":
      case "T":
        e.preventDefault();
        setTimerPaused(p => !p);
        break;
      case "n":
      case "N":
        e.preventDefault();
        setShowNotes(s => !s);
        break;
      case "Home":
      case ".":
        e.preventDefault();
        setActiveSlide(0);
        break;
      case "End":
        e.preventDefault();
        setActiveSlide(total - 1);
        break;
      case "Escape":
        setIsFullscreen(false);
        break;
    }
  };

  // ── Read-aloud (Web Speech API) ─────────────────────────────────────────
  const speakSlide = (slide: SlideContent | undefined, idx: number) => {
    if (!slide || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const text = [
      slide.title,
      slide.subtitle,
      slide.body,
      slide.question,
      ...(slide.bullets || []),
    ].filter(Boolean).join(". ");
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onend = () => setSpeakingIdx(null);
    utt.onerror = () => setSpeakingIdx(null);
    window.speechSynthesis.speak(utt);
    setSpeakingIdx(idx);
  };

  // ── Generate speaker notes for slides that lack them (item 25) ──────────
  // Batches every slide with empty speakerNotes through callAIMessages so the
  // model uses the deck-wide context. Returns 2-3 sentence notes per slide.
  const handleGenerateMissingNotes = async () => {
    if (!presentation) return;
    const missingIdx = presentation.slides
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => !s.speakerNotes || s.speakerNotes.trim().length < 20)
      .map(({ i }) => i);
    if (missingIdx.length === 0) {
      toast.info("Every slide already has speaker notes.");
      return;
    }
    setGeneratingNotes(true);
    try {
      const sys = `You are a UK teacher. Generate practical, classroom-ready speaker notes for each slide listed. Each notes block must be 2-3 sentences and contain: what the teacher should DO (point at, ask, compare), what to LISTEN FOR (a specific pupil response), and what comes NEXT. No fluff.

Return ONLY a JSON object: { "notes": { "<slideIndex>": "...notes...", ... } }`;
      const slideSummary = missingIdx.map(i => {
        const s = presentation.slides[i];
        return { index: i, type: s.type, title: s.title, body: (s.body || "").slice(0, 200), question: s.question, bullets: (s.bullets || []).slice(0, 5) };
      });
      const usr = `Deck title: ${presentation.title}
Subject: ${presentation.subject}
Year: ${presentation.yearGroup}
Topic: ${presentation.topic}

Slides needing notes:
${JSON.stringify(slideSummary)}

Return JSON only.`;
      const result = await callAI(sys, usr, 4000);
      const rawText = typeof result === "string" ? result : (result as any).text || JSON.stringify(result);
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : cleaned);
      const notes = parsed.notes || {};
      const newSlides = presentation.slides.map((s, i) => {
        const note = notes[String(i)] || notes[i];
        return note && (typeof note === "string") ? { ...s, speakerNotes: note } : s;
      });
      setPresentation({ ...presentation, slides: newSlides });
      toast.success(`Generated notes for ${missingIdx.length} slide${missingIdx.length === 1 ? "" : "s"}.`);
    } catch (e: any) {
      console.error("Generate notes failed:", e);
      toast.error("Couldn't generate notes — please try again.");
    } finally {
      setGeneratingNotes(false);
    }
  };

  // ── Variant generator (item 55) ─────────────────────────────────────────
  // Asks the AI for 3 distinct phrasings of the active slide (formal /
  // pupil-friendly / story-led). Surfaces them as a chooser modal; pick
  // one to splice into the deck. The previous slide goes into history so
  // the choice is reversible.
  const handleGenerateVariants = async (idx: number) => {
    if (!presentation) return;
    const slide = presentation.slides[idx];
    if (!slide) return;
    setGeneratingVariants(true);
    setVariantTargetIdx(idx);
    setVariantOptions(null);
    try {
      const sys = `You produce three distinct phrasings of a single lesson slide.
The three variants must vary in TONE only — academic content, learning objective and slide TYPE must stay identical:
  1) Formal / mark-scheme tone
  2) Pupil-friendly / conversational tone
  3) Story-led / context-first tone
Return ONLY a JSON object: { "variants": [<full slide JSON #1>, <full slide JSON #2>, <full slide JSON #3>] }
Each variant must keep the same "type" as the input slide. Do NOT change any structured data fields like marks/timingMinutes/successCriteria — only rewrite human-readable text fields.`;
      const usr = `Deck: ${presentation.title} (${presentation.subject}, ${presentation.yearGroup})
Slide to revoice (preserve type "${slide.type}"):
${JSON.stringify(slide)}

Return JSON only.`;
      const result = await callAI(sys, usr, 3500);
      const rawText = typeof result === "string" ? result : (result as any).text || JSON.stringify(result);
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : cleaned);
      const variants: SlideContent[] = (parsed.variants || []).slice(0, 3).map((v: any) => ({ ...slide, ...v, type: slide.type }));
      if (variants.length === 0) throw new Error("No variants returned.");
      setVariantOptions(variants);
    } catch (err: any) {
      console.error("Variant generation failed:", err);
      toast.error("Couldn't generate variants — please try again.");
    } finally {
      setGeneratingVariants(false);
    }
  };
  const acceptVariant = (variant: SlideContent) => {
    if (!presentation) return;
    const idx = variantTargetIdx;
    setSlideHistory(prev => {
      const cur = presentation.slides[idx];
      const list = (prev[idx] || []).concat([cur]).slice(-5);
      return { ...prev, [idx]: list };
    });
    const newSlides = [...presentation.slides];
    newSlides[idx] = variant;
    setPresentation({ ...presentation, slides: newSlides });
    setVariantOptions(null);
    toast.success("Variant applied.");
  };

  // ── Inline slide editing ─────────────────────────────────────────────────────
  const startEditSlide = (idx: number) => {
    if (!presentation) return;
    setEditingSlide(idx);
    setSlideEditValues({ ...presentation.slides[idx] });
  };

  const saveEditSlide = () => {
    if (!presentation || editingSlide === null) return;
    // Push the prior version into history before overwriting (item 53).
    setSlideHistory(prev => {
      const cur = presentation.slides[editingSlide];
      const list = (prev[editingSlide] || []).concat([cur]).slice(-5);
      return { ...prev, [editingSlide]: list };
    });
    const newSlides = [...presentation.slides];
    newSlides[editingSlide] = { ...newSlides[editingSlide], ...slideEditValues } as SlideContent;
    setPresentation({ ...presentation, slides: newSlides });
    setEditingSlide(null);
    recordTelemetry("edit-slide", { slideType: newSlides[editingSlide].type, slideIndex: editingSlide });
    toast.success("Slide updated!");
  };

  const deleteSlide = (idx: number) => {
    if (!presentation || presentation.slides.length <= 1) return;
    const newSlides = presentation.slides.filter((_, i) => i !== idx);
    setPresentation({ ...presentation, slides: newSlides, totalSlides: newSlides.length });
    if (activeSlide >= newSlides.length) setActiveSlide(newSlides.length - 1);
    toast.success("Slide deleted.");
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    if (!presentation) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= presentation.slides.length) return;
    const newSlides = [...presentation.slides];
    [newSlides[idx], newSlides[newIdx]] = [newSlides[newIdx], newSlides[idx]];
    setPresentation({ ...presentation, slides: newSlides });
    setActiveSlide(newIdx);
  };

  const currentSlide = presentation?.slides[activeSlide];

  // ── Phase 5/6 — validator findings + telemetry ───────────────────────────
  // Run validators on every deck change. Cheap pure functions — no AI calls.
  const validatorFindings: ValidationFinding[] = useMemo(() => {
    if (!presentation) return [];
    return runAllValidators({
      slides: presentation.slides as any,
      objectives,
      readingAge,
    });
  }, [presentation, objectives, readingAge]);

  // Telemetry ping when a deck is generated or exported (small useEffect for
  // each so the meta is keyed correctly).
  useEffect(() => {
    if (!presentation) return;
    recordTelemetry("generate", { slides: presentation.slides.length, theme: selectedTheme });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentation?.title]);
  useEffect(() => {
    if (!selectedTheme) return;
    recordTelemetry("theme-change", { theme: selectedTheme });
  }, [selectedTheme]);

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{
        ["--pres-font" as any]: (
          fontOverride === "sans" ? "Inter, system-ui, sans-serif"
          : fontOverride === "serif" ? "'Source Serif Pro', Georgia, serif"
          : fontOverride === "mono" ? "'Consolas', monospace"
          : fontOverride === "dyslexic" ? "'OpenDyslexic', Verdana, sans-serif"
          : activeFont
        ),
        // Zoom is applied to the slide preview area only (the styles cascade
        // via the CSS variable); see FullSlideView's wrapper.
        ["--pres-zoom" as any]: zoom.toFixed(2),
        ...(contrastMode === "high" ? { filter: "contrast(1.15) saturate(1.1)" } : {}),
        ...(contrastMode === "sepia" ? { filter: "sepia(0.4)" } : {}),
      }}
    >
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/planning-hub")} className="text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.gradient }}>
                <Monitor className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Presentation Maker</h1>
                <p className="text-xs text-gray-500">AI-powered lesson slides</p>
              </div>
            </div>
          </div>
          {presentation && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleSaveToLibrary} disabled={savingToLib} className="text-xs gap-1">
                {savedToLib ? <Check className="w-3 h-3 text-green-600" /> : <Save className="w-3 h-3" />}
                {savedToLib ? "Saved!" : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowEmailDialog(true)} className="text-xs gap-1">
                <Mail className="w-3 h-3" />Send
              </Button>
              {/* Print dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <Printer className="w-3 h-3" />Print
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handlePrintHandout("1up")}>📄 1 slide per page</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePrintHandout("2up")}>📑 2 slides per page (handout)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePrintHandout("notes")}>📋 Notes page (slide + notes)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline" size="sm" onClick={() => setShowIdentityDialog(true)}
                className="text-xs gap-1"
                title="School identity (logo, motto, brand colour)"
              >
                🏫 School
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)} className="text-xs gap-1">
                <Maximize2 className="w-3 h-3" />Present
              </Button>
              <Button
                variant="outline" size="sm" onClick={() => setShowDisplayPrefs(p => !p)}
                className="text-xs gap-1"
                title="Display preferences (zoom, font, contrast)"
              >
                <TypeIcon className="w-3 h-3" />Display
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => speakSlide(currentSlide, activeSlide)}
                className="text-xs gap-1"
                title={speakingIdx === activeSlide ? "Stop reading" : "Read this slide aloud"}
              >
                {speakingIdx === activeSlide ? <VolumeX className="w-3 h-3 text-red-500" /> : <Volume2 className="w-3 h-3" />}
                {speakingIdx === activeSlide ? "Stop" : "Read"}
              </Button>
              {/* Show "Live poll QR" only when the active slide is question-bearing. */}
              {currentSlide && ["check-understanding","mini-quiz","exit-ticket","hook","discussion","cold-call"].includes(currentSlide.type) && (
                <Button
                  variant="outline" size="sm"
                  onClick={() => setShowPollQR(true)}
                  className="text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  title="Pupils scan to answer — live AfL poll"
                >
                  📱 Live poll
                </Button>
              )}
              {/* Send the current deck context to another tool (Worksheets, Flashcards, Exit Ticket…). */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs gap-1" title="Continue this work in another tool">
                    <Send className="w-3 h-3" />Send
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem onClick={() => {
                    persistHandoff("presentation-maker", { topic: presentation?.topic || topic, yearGroup, subject, sourceSlide: currentSlide?.title || "" }, presentation?.title);
                    setLocation("/worksheets");
                  }}>📄 Make a worksheet from this lesson</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const vocabSlide = presentation?.slides.find(s => s.type === "vocab-reference");
                    const flashContent = vocabSlide?.vocabTable
                      ? vocabSlide.vocabTable.map(t => `${t.term} :: ${t.definition}`).join("\n")
                      : (presentation?.slides.flatMap(s => s.terms || []).map(t => `${t.term} :: ${t.definition}`).join("\n") || "");
                    persistHandoff("presentation-maker", { topic: presentation?.topic || topic, yearGroup, subject }, flashContent);
                    setLocation("/tools/flashcards");
                  }}>🃏 Push key terms to Flashcards</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const exitSlide = presentation?.slides.find(s => s.type === "exit-ticket");
                    persistHandoff("presentation-maker",
                      { topic: presentation?.topic || topic, yearGroup, subject },
                      exitSlide ? `Q: ${exitSlide.question || ""}\nA: ${exitSlide.answer || ""}` : "");
                    setLocation("/tools/exit-ticket");
                  }}>✓ Exit-ticket → Exit Ticket tool</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const examSlides = presentation?.slides.filter(s => s.type === "exam-practice" || s.type === "mini-quiz" || s.type === "check-understanding");
                    const blastContent = (examSlides || []).map(s => s.question || "").filter(Boolean).join("\n");
                    persistHandoff("presentation-maker", { topic: presentation?.topic || topic, yearGroup, subject }, blastContent);
                    setLocation("/tools/quiz-blast");
                  }}>⚡ Send quiz to Quiz Blast</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    persistHandoff("presentation-maker", { topic: presentation?.topic || topic, yearGroup, subject }, presentation?.title);
                    setLocation("/tools/lesson-bundle");
                  }}>📦 Bundle as lesson pack</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => setShowSendAdaptDialog(true)} className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold">
                Adapt for SEND
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyText} className="text-xs gap-1">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}Copy
              </Button>
              <Button size="sm" onClick={handleExportPptx} disabled={exporting} className="text-xs text-white gap-1" style={{ background: theme.gradient, border: "none" }}>
                {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
                Export .pptx
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Form */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Generate Presentation
                  </h2>
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Subject *</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(s => (
                        <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Group */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Year Group *</Label>
                  <Select value={yearGroup} onValueChange={handleYearGroupChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select year group..." />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_GROUPS.map(y => (
                        <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Topic */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Topic / Lesson Title *</Label>
                  <Input
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. The Water Cycle, Macbeth's Ambition..."
                    className="h-8 text-xs"
                  />
                </div>

                {/* Lesson Type */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Lesson Type</Label>
                  <Select value={lessonType} onValueChange={setLessonType}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LESSON_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Slide Count */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Number of Slides</Label>
                  <Select value={slideCount} onValueChange={setSlideCount}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLIDE_COUNTS.map(n => (
                        <SelectItem key={n} value={n} className="text-xs">{n} slides</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Learning Objectives */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Learning Objectives (optional)</Label>
                  <Textarea
                    value={objectives}
                    onChange={e => setObjectives(e.target.value)}
                    placeholder="Leave blank for AI to generate..."
                    className="text-xs resize-none h-16"
                  />
                </div>

                {/* Reading Age Slider */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Sliders className="w-3 h-3" /> Reading Age
                    <span className="ml-auto font-normal text-gray-500">{READING_AGE_LABELS[readingAge]}</span>
                  </Label>
                  <Slider
                    min={5}
                    max={16}
                    step={1}
                    value={[readingAge]}
                    onValueChange={([v]) => setReadingAge(v)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>Age 5</span>
                    <span>Age 11</span>
                    <span>Age 16+</span>
                  </div>
                </div>

                {/* Differentiation Level */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Differentiation Level
                  </Label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["foundation", "core", "extension"] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => setDifferentiationLevel(level)}
                        className={`py-1.5 rounded-lg text-[10px] font-semibold border-2 transition-all capitalize ${
                          differentiationLevel === level
                            ? level === "foundation" ? "bg-blue-50 border-blue-500 text-blue-700"
                              : level === "extension" ? "bg-purple-50 border-purple-500 text-purple-700"
                              : "bg-green-50 border-green-500 text-green-700"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {level === "foundation" ? "Foundation" : level === "core" ? "Core" : "Extension"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exam Board */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Exam Board (optional)</Label>
                  <Select value={examBoard} onValueChange={setExamBoard}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select exam board..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EXAM_BOARDS.map(b => (
                        <SelectItem key={b.value} value={b.value} className="text-xs">{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SEND Needs — multi-select chip group */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">SEND / Additional Needs (optional)</Label>
                  <div className="rounded-lg border border-gray-200 bg-white p-2">
                    <SendNeedsPicker
                      selectedIds={sendNeedIds}
                      onChange={setSendNeedIds}
                      notes={sendNeedsNotes}
                      onNotesChange={setSendNeedsNotes}
                    />
                  </div>
                </div>

                {/* Symbol Support — opt-in ARASAAC pictograms on word banks */}
                <div className="flex items-start gap-2 rounded-lg border border-cyan-200 bg-cyan-50/50 p-2">
                  <Switch checked={symbolSupport} onCheckedChange={setSymbolSupport} id="symbol-support-sw" className="mt-0.5" />
                  <Label htmlFor="symbol-support-sw" className="text-xs text-gray-700 cursor-pointer">
                    <span className="font-semibold">Symbol support (SEND)</span>
                    <span className="block text-[11px] text-gray-500 font-normal mt-0.5">
                      Add a picture symbol above each Word Bank, Key Terms and Vocabulary term (ARASAAC). Shows on screen and in the PowerPoint export.
                    </span>
                  </Label>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Additional Instructions (optional)</Label>
                  <Textarea
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                    placeholder="Any specific requirements, exam board, context..."
                    className="text-xs resize-none h-16"
                  />
                </div>

                {/* Theme Picker */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> Theme
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Subject-auto theme — pulls palette from subject-profiles.ts */}
                    <button
                      onClick={() => setSelectedTheme("subject-auto" as ThemeKey)}
                      className={`rounded-lg p-2 border-2 transition-all text-left ${
                        selectedTheme === ("subject-auto" as ThemeKey) ? "border-blue-500 shadow-sm" : "border-gray-200 hover:border-gray-300"
                      }`}
                      title={subject ? `Use the ${subject} palette automatically` : "Pick a subject first"}
                    >
                      <div className="h-4 rounded mb-1" style={{
                        background: subject
                          ? `linear-gradient(135deg, #${getSubjectProfile(subject).palette.darkBg} 0%, #${getSubjectProfile(subject).palette.accent1} 100%)`
                          : "linear-gradient(135deg,#64748b,#94a3b8)",
                      }} />
                      <div className="text-[9px] font-bold text-gray-700 truncate">✨ Subject Auto</div>
                    </button>
                    {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedTheme(key)}
                        className={`rounded-lg p-2 border-2 transition-all text-left ${
                          selectedTheme === key ? "border-blue-500 shadow-sm" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="h-4 rounded mb-1" style={{ background: t.gradient }} />
                        <div className="text-[9px] font-medium text-gray-700 truncate">{t.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading || !subject || !yearGroup || !topic}
                  className="w-full text-white font-semibold"
                  style={{ background: loading ? "#9ca3af" : theme.gradient, border: "none" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating slides...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Presentation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Slide preview */}
          <div className="lg:col-span-2">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: theme.gradient }}>
                  <Monitor className="w-8 h-8 text-white animate-pulse" />
                </div>
                <div className="text-lg font-bold text-gray-900 mb-2">Creating your presentation...</div>
                <div className="text-sm text-gray-500 mb-6">Generating {slideCount} professional slides</div>
                <FunFactsCarousel />
              </div>
            )}

            {!loading && !presentation && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: theme.light }}>
                  <Monitor className="w-10 h-10" style={{ color: theme.secondary }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI Presentation Maker</h3>
                <p className="text-sm text-gray-500 max-w-sm mb-4">
                  Fill in the form and click Generate to create a professional lesson presentation with structured slides, activities, and speaker notes.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-sm text-left">
                  {[
                    { icon: Target, label: "Learning objectives", desc: "Tiered All/Most/Some" },
                    { icon: Brain, label: "Worked examples", desc: "Step-by-step breakdowns" },
                    { icon: CheckSquare, label: "Formative assessment", desc: "MCQs & exit tickets" },
                    { icon: FileDown, label: "PPTX export", desc: "Ready to present" },
                  ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-2 p-2 rounded-lg bg-white border">
                      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: theme.light }}>
                        <Icon className="w-3 h-3" style={{ color: theme.secondary }} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">{label}</div>
                        <div className="text-[10px] text-gray-500">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && presentation && (
              <div className="space-y-4">
                {/* ── SEND adaptations applied banner ─────────────────────── */}
                {/* Renders when any SEND need was selected for this deck. Shows
                    the list of applied specs with an expandable "what will
                    change" list and the evidence-based "why" popover for each
                    bullet. This is what the teacher shows a parent / SENDCO / Ofsted
                    inspector as justification for the adaptation. */}
                {sendNeedIds.length > 0 && (
                  <SendAppliedBanner sendNeedIds={sendNeedIds} />
                )}

                {/* ── Phase 5/6 deck-quality findings (items 22, 24, 26) ──── */}
                {validatorFindings.length > 0 && (
                  <details className="rounded-lg border border-amber-300 bg-amber-50 overflow-hidden">
                    <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100/60 list-none flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{validatorFindings.length} deck-quality finding{validatorFindings.length === 1 ? "" : "s"}</span>
                      <span className="ml-auto text-[10px] text-amber-700 font-normal">click to expand</span>
                    </summary>
                    <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-amber-200 bg-white/40">
                      {validatorFindings.map((f, i) => (
                        <div key={i} className="text-[11px] text-amber-900 flex items-start gap-2">
                          <span className="text-amber-600 flex-shrink-0 mt-0.5">·</span>
                          <div>
                            <span className="font-medium">{f.message}</span>
                            {f.suggestion && <span className="text-amber-700 italic"> — {f.suggestion}</span>}
                            {f.index >= 0 && (
                              <button
                                onClick={() => { setActiveSlide(f.index); openRefineDialog("slide", f.index); }}
                                className="ml-2 text-[10px] underline text-amber-800 hover:text-amber-950"
                              >
                                Fix slide {f.index + 1}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Presentation header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{presentation.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{presentation.subject}</Badge>
                      <Badge variant="outline" className="text-xs">{presentation.yearGroup}</Badge>
                      <Badge variant="outline" className="text-xs">{presentation.slides.length} slides</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowNotes(!showNotes)} className="text-xs gap-1" title="Toggle speaker-notes panel">
                <Eye className="w-3 h-3 mr-1" />
                {showNotes ? "Hide" : "Show"} Notes
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={handleGenerateMissingNotes}
                disabled={generatingNotes}
                className="text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                title="Generate practical 2-3 sentence speaker notes for slides that lack them"
              >
                {generatingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Gen notes
              </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRefineDialog("slide", activeSlide)}
                      disabled={conversation.length === 0}
                      className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold"
                    >
                      Refine this slide
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateVariants(activeSlide)}
                      disabled={generatingVariants}
                      className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold"
                      title="Generate 3 alternative phrasings (formal / pupil-friendly / story-led)"
                    >
                      {generatingVariants ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      3 variants
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRefineDialog("deck")}
                      disabled={conversation.length === 0}
                      className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold"
                    >
                      Refine whole deck
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </div>

                {/* Main slide view */}
                {currentSlide && (
                  <div style={{ transform: `scale(var(--pres-zoom, 1))`, transformOrigin: "top center", transition: "transform 0.15s ease-out" }}>
                    <FullSlideView
                      slide={currentSlide}
                      theme={theme}
                      index={activeSlide}
                      total={presentation.slides.length}
                      branding={identity}
                      symbolSupport={symbolSupport}
                    />
                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                        disabled={activeSlide === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <span className="text-xs text-gray-500">
                        Slide {activeSlide + 1} of {presentation.slides.length} — {SLIDE_LABELS[currentSlide.type] || currentSlide.type}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveSlide(Math.min(presentation.slides.length - 1, activeSlide + 1))}
                        disabled={activeSlide === presentation.slides.length - 1}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Speaker notes */}
                    {showNotes && currentSlide.speakerNotes && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="text-xs font-semibold text-amber-800 mb-1">Speaker Notes</div>
                        <div className="text-xs text-amber-700 leading-relaxed">{currentSlide.speakerNotes}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Slide strip with inline edit controls */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gray-700">All Slides ({presentation.slides.length})</div>
                    <Button size="sm" variant="outline" className="text-xs h-6 gap-1"
                      onClick={() => {
                        const newSlide: SlideContent = { type: "content", title: "New Slide", bullets: ["Add your content here"] };
                        const newSlides = [...presentation.slides, newSlide];
                        setPresentation({ ...presentation, slides: newSlides, totalSlides: newSlides.length });
                        setActiveSlide(newSlides.length - 1);
                      }}>
                      <Plus className="w-3 h-3" />Add Slide
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                    {presentation.slides.map((slide, i) => (
                      <div key={i} className="relative group">
                        <SlidePreview slide={slide} theme={theme} index={i} total={presentation.slides.length} isActive={i === activeSlide} onClick={() => setActiveSlide(i)} />
                        {/* Per-slide controls */}
                        <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5 bg-white/90 rounded p-0.5 shadow">
                          <button onClick={(e) => { e.stopPropagation(); moveSlide(i, -1); }} disabled={i === 0} className="w-4 h-4 flex items-center justify-center hover:bg-gray-100 rounded disabled:opacity-30"><ChevronUp className="w-2.5 h-2.5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); moveSlide(i, 1); }} disabled={i === presentation.slides.length - 1} className="w-4 h-4 flex items-center justify-center hover:bg-gray-100 rounded disabled:opacity-30"><ChevronDown className="w-2.5 h-2.5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); startEditSlide(i); }} className="w-4 h-4 flex items-center justify-center hover:bg-blue-50 rounded"><Pencil className="w-2.5 h-2.5 text-blue-600" /></button>
                          {(slideHistory[i]?.length || 0) > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); setHistoryForIdx(i); }} className="w-4 h-4 flex items-center justify-center hover:bg-amber-50 rounded" title={`${slideHistory[i].length} prior version(s)`}>
                              <HistoryIcon className="w-2.5 h-2.5 text-amber-600" />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }} disabled={presentation.slides.length <= 1} className="w-4 h-4 flex items-center justify-center hover:bg-red-50 rounded disabled:opacity-30"><Trash2 className="w-2.5 h-2.5 text-red-500" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inline slide editor */}
                {editingSlide !== null && (
                  <div className="border border-blue-200 rounded-lg bg-blue-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-blue-800">Editing Slide {editingSlide + 1}</div>
                      <button onClick={() => setEditingSlide(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Title</Label>
                      <Input className="h-8 text-xs" value={slideEditValues.title || ""} onChange={e => setSlideEditValues(v => ({ ...v, title: e.target.value }))} />
                    </div>
                    {slideEditValues.subtitle !== undefined && (
                      <div className="space-y-2">
                        <Label className="text-xs">Subtitle</Label>
                        <Input className="h-8 text-xs" value={slideEditValues.subtitle || ""} onChange={e => setSlideEditValues(v => ({ ...v, subtitle: e.target.value }))} />
                      </div>
                    )}
                    {slideEditValues.body !== undefined && (
                      <div className="space-y-2">
                        <Label className="text-xs">Body text</Label>
                        <Textarea className="text-xs resize-none h-16" value={slideEditValues.body || ""} onChange={e => setSlideEditValues(v => ({ ...v, body: e.target.value }))} />
                      </div>
                    )}
                    {slideEditValues.question !== undefined && (
                      <div className="space-y-2">
                        <Label className="text-xs">Question</Label>
                        <Input className="h-8 text-xs" value={slideEditValues.question || ""} onChange={e => setSlideEditValues(v => ({ ...v, question: e.target.value }))} />
                      </div>
                    )}
                    {slideEditValues.bullets && (
                      <div className="space-y-2">
                        <Label className="text-xs">Bullets (one per line)</Label>
                        <Textarea className="text-xs resize-none h-24" value={(slideEditValues.bullets || []).join("\n")} onChange={e => setSlideEditValues(v => ({ ...v, bullets: e.target.value.split("\n").filter(Boolean) }))} />
                      </div>
                    )}
                    {slideEditValues.speakerNotes !== undefined && (
                      <div className="space-y-2">
                        <Label className="text-xs">Speaker Notes</Label>
                        <Textarea className="text-xs resize-none h-16" value={slideEditValues.speakerNotes || ""} onChange={e => setSlideEditValues(v => ({ ...v, speakerNotes: e.target.value }))} />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={saveEditSlide}>Save Changes</Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setEditingSlide(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {/* Export buttons */}
                <div className="flex gap-2 pt-2 border-t flex-wrap">
                  <Button onClick={handleExportPptx} disabled={exporting} className="flex-1 text-white font-semibold" style={{ background: theme.gradient, border: "none" }}>
                    {exporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporting...</> : <><FileDown className="w-4 h-4 mr-2" />Download PowerPoint (.pptx)</>}
                  </Button>
                  <Button variant="outline" onClick={handleSaveToLibrary} disabled={savingToLib} className="text-xs gap-1">
                    {savedToLib ? <Check className="w-4 h-4 text-green-600" /> : <Save className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" onClick={handleCopyText} className="text-xs">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                {/* PR5 v2 panel — speaker notes / regenerate slide / images / pace / Google Slides */}
                <PresentationMakerEnhancementsPanel
                  deck={{
                    title: presentation.title,
                    subject: presentation.subject,
                    yearGroup: presentation.yearGroup,
                    topic: presentation.topic,
                    theme: presentation.theme,
                    slides: presentation.slides as unknown as import("@/lib/presentation-maker-enhancements").SlideLite[],
                    totalSlides: presentation.totalSlides,
                  }}
                  activeSlideIndex={activeSlide}
                  onSlideRegenerated={(idx, slide) => {
                    setPresentation((curr) => {
                      if (!curr) return curr;
                      const newSlides = curr.slides.slice();
                      newSlides[idx] = { ...newSlides[idx], ...(slide as unknown as SlideContent) };
                      return { ...curr, slides: newSlides };
                    });
                  }}
                  onApplyPace={(newDeck) => {
                    setPresentation((curr) => {
                      if (!curr) return curr;
                      // Preserve original slides' fields, only override timingMinutes from the paced deck
                      const newSlides = curr.slides.map((s, i) => {
                        const paced = newDeck.slides[i] as { timingMinutes?: number } | undefined;
                        return paced ? { ...s, timingMinutes: paced.timingMinutes } : s;
                      });
                      return { ...curr, slides: newSlides };
                    });
                    toast.success("Deck timings updated.");
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Presenter Mode (replaces the legacy fullscreen) ─────────────────── */}
      {/* Layout: large current slide on the left, side panel on the right with
          next-slide thumbnail + speaker notes + countdown + wall-clock + key
          legend. B/W blackout overlay sits above everything when active.    */}
      {isFullscreen && presentation && currentSlide && (
        <PresenterMode
          presentation={presentation}
          theme={theme}
          activeSlide={activeSlide}
          revealLevel={revealLevel}
          timerSeconds={timerSeconds}
          timerPaused={timerPaused}
          blackout={blackout}
          showNotes={showNotes}
          branding={identity}
          onKeyDown={handleFullscreenKeyDown}
          onSetActive={setActiveSlide}
          onExit={() => setIsFullscreen(false)}
          onTogglePause={() => setTimerPaused(p => !p)}
          onClearBlackout={() => setBlackout("none")}
          symbolSupport={symbolSupport}
        />
      )}

      {/* ── Email Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-4 h-4" />Send Presentation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Recipient Email *</Label>
              <Input className="h-8 text-xs" type="email" placeholder="teacher@school.co.uk" value={emailTo} onChange={e => setEmailTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Message (optional)</Label>
              <Textarea className="text-xs resize-none h-16" placeholder="Here's the lesson presentation..." value={emailMsg} onChange={e => setEmailMsg(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Format</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["pdf", "pptx"] as const).map(f => (
                  <button key={f} onClick={() => setEmailFormat(f)} className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all uppercase ${emailFormat === f ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200 text-gray-600"}`}>{f === "pdf" ? "📄 PDF" : "📊 PowerPoint"}</button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSendEmail} disabled={sendingEmail || !emailTo.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              {sendingEmail ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Sending...</> : <><Mail className="w-3 h-3 mr-1" />Send</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AfL Live Poll QR ─────────────────────────────────────────────── */}
      <SlidePollQR
        open={showPollQR}
        onOpenChange={setShowPollQR}
        slide={currentSlide ? {
          title: currentSlide.title,
          question: currentSlide.question,
          options: currentSlide.options,
          answer: currentSlide.answer,
          type: currentSlide.type,
        } : null}
      />

      {/* ── Variant Chooser dialog (item 55) ─────────────────────────────── */}
      <Dialog open={!!variantOptions} onOpenChange={(o) => !o && setVariantOptions(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pick a variant for slide {variantTargetIdx + 1}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(variantOptions || []).map((v, i) => {
              const labels = ["Formal", "Pupil-friendly", "Story-led"];
              return (
                <div key={i} className="rounded-lg border-2 border-gray-200 hover:border-purple-400 p-3 cursor-pointer flex flex-col gap-2"
                     onClick={() => acceptVariant(v)}>
                  <div className="text-[9px] font-bold uppercase tracking-wide text-purple-700">{labels[i] || `Variant ${i + 1}`}</div>
                  <div className="text-sm font-bold" style={{ color: theme.primary }}>{v.title}</div>
                  {v.subtitle && <div className="text-[11px] italic text-gray-500">{v.subtitle}</div>}
                  {v.body && <div className="text-[11px] text-gray-700 line-clamp-3">{v.body}</div>}
                  {v.bullets && v.bullets.length > 0 && (
                    <ul className="text-[10px] text-gray-700 list-disc pl-4">
                      {v.bullets.slice(0, 4).map((b, bi) => <li key={bi} className="line-clamp-1">{b}</li>)}
                    </ul>
                  )}
                  <Button size="sm" className="mt-auto bg-purple-600 hover:bg-purple-700 text-white text-xs">Use this variant</Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Slide Version History dialog (item 53) ───────────────────────── */}
      <Dialog open={historyForIdx !== null} onOpenChange={(o) => !o && setHistoryForIdx(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Slide {historyForIdx === null ? "" : historyForIdx + 1} — version history</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {historyForIdx !== null && (slideHistory[historyForIdx] || []).slice().reverse().map((past, vi) => {
              const realIdx = (slideHistory[historyForIdx] || []).length - 1 - vi;
              return (
                <div key={vi} className="rounded-lg border border-gray-200 p-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gray-700">v{realIdx + 1} — {SLIDE_LABELS[past.type] || past.type}</div>
                    <Button size="sm" variant="outline" className="text-xs h-6"
                      onClick={() => {
                        if (!presentation || historyForIdx === null) return;
                        // Stash the current as a new version, then restore.
                        setSlideHistory(prev => {
                          const cur = presentation.slides[historyForIdx];
                          const list = (prev[historyForIdx] || []).concat([cur]).slice(-5);
                          return { ...prev, [historyForIdx]: list };
                        });
                        const newSlides = [...presentation.slides];
                        newSlides[historyForIdx] = past;
                        setPresentation({ ...presentation, slides: newSlides });
                        toast.success("Reverted to earlier version.");
                        setHistoryForIdx(null);
                      }}>
                      Restore
                    </Button>
                  </div>
                  <div className="text-[11px] font-bold" style={{ color: theme.primary }}>{past.title}</div>
                  {past.body && <div className="text-[10px] text-gray-600 line-clamp-2">{past.body}</div>}
                  {past.bullets && past.bullets.length > 0 && (
                    <ul className="text-[10px] text-gray-700 list-disc pl-4 mt-1">
                      {past.bullets.slice(0, 3).map((b, i) => <li key={i} className="line-clamp-1">{b}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
            {historyForIdx !== null && (slideHistory[historyForIdx] || []).length === 0 && (
              <div className="text-xs italic text-gray-500">No prior versions yet — they'll appear here after you edit or refine this slide.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── School Identity Dialog ───────────────────────────────────────── */}
      <Dialog open={showIdentityDialog} onOpenChange={setShowIdentityDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>School identity</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Add your school's name, motto and logo. Every deck you build will carry a small footer
              watermark, and the logo appears on the title slide.
            </p>
            <div className="space-y-1">
              <Label className="text-xs">School name</Label>
              <Input value={identity.name || ""} onChange={e => setIdentity({ ...identity, name: e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Motto / tagline (optional)</Label>
              <Input value={identity.motto || ""} onChange={e => setIdentity({ ...identity, motto: e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Brand colour</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={identity.brandColour || "#1B2A4A"}
                  onChange={e => setIdentity({ ...identity, brandColour: e.target.value })}
                  className="h-8 w-12 rounded border"
                />
                <Input
                  value={identity.brandColour || ""}
                  onChange={e => setIdentity({ ...identity, brandColour: e.target.value })}
                  placeholder="#1B2A4A"
                  className="h-8 text-xs flex-1 font-mono"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Logo (PNG/JPG, &lt; 200kb)</Label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 200_000) { toast.error("Logo too large — please use under 200kb."); return; }
                  const url = await fileToDataUrl(f);
                  setIdentity(id => ({ ...id, logoDataUrl: url }));
                }}
                className="text-xs"
              />
              {identity.logoDataUrl && (
                <div className="flex items-center gap-2 mt-1">
                  <img src={identity.logoDataUrl} alt="logo" className="w-12 h-12 object-contain border rounded bg-white" />
                  <button onClick={() => setIdentity(id => ({ ...id, logoDataUrl: undefined }))} className="text-[10px] text-red-600 underline">Remove</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={!!identity.showOnEverySlide}
                onChange={e => setIdentity({ ...identity, showOnEverySlide: e.target.checked })}
                id="show-everywhere"
              />
              <Label htmlFor="show-everywhere" className="text-xs">Show watermark on every slide (not just title)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowIdentityDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { writeSchoolIdentity(identity); toast.success("School identity saved."); setShowIdentityDialog(false); }} className="bg-blue-600 hover:bg-blue-700 text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Display Preferences popover ──────────────────────────────────── */}
      {showDisplayPrefs && (
        <div className="fixed top-14 right-4 z-40 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-gray-800">Display preferences</div>
            <button onClick={() => setShowDisplayPrefs(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="text-[10px] text-gray-500">
            These are independent of any SEND adaptations and only affect how slides look on YOUR screen.
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Zoom · {Math.round(zoom * 100)}%</Label>
            <Slider min={0.7} max={1.6} step={0.05} value={[zoom]} onValueChange={([v]) => setZoom(v)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Font</Label>
            <div className="grid grid-cols-3 gap-1">
              {([
                ["", "Auto"], ["sans", "Sans"], ["serif", "Serif"],
                ["mono", "Mono"], ["dyslexic", "Dyslexic"],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFontOverride(val as any)}
                  className={`text-[10px] py-1 rounded border ${fontOverride === val ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200 text-gray-600"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Contrast</Label>
            <div className="grid grid-cols-3 gap-1">
              {([["normal","Normal"],["high","High"],["sepia","Sepia"]] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setContrastMode(val as any)}
                  className={`text-[10px] py-1 rounded border ${contrastMode === val ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-gray-200 text-gray-600"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SEND Adaptation Dialog ───────────────────────────────────────────── */}
      <Dialog open={showSendAdaptDialog} onOpenChange={setShowSendAdaptDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><span className="inline-block w-2 h-6 rounded bg-purple-600" />Adapt for SEND</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Pick any combination of SEND needs. Adaptations follow the UK SEND Code of Practice and
              are layered together — when rules conflict, the strictest access requirement wins.
              The AI will regenerate each slide with the correct structured fields (word banks,
              method steps, check-ins, etc.) and show a side-by-side comparison.
            </p>
            <SendNeedsPicker
              selectedIds={sendAdaptNeedIds}
              onChange={setSendAdaptNeedIds}
              notes={sendAdaptNotes}
              onNotesChange={setSendAdaptNotes}
            />
            {sendAdaptNeedIds.length > 0 && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-2 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wide text-purple-800">What will change</div>
                <ul className="text-[11px] text-purple-950 space-y-0.5 list-disc pl-4">
                  {resolveSendSpecs(sendAdaptNeedIds).flatMap(spec =>
                    spec.bullets.slice(0, 3).map((b, i) => (
                      <li key={`${spec.id}-${i}`}><span className="font-semibold">[{spec.name}]</span> {b.what}</li>
                    ))
                  ).slice(0, 8)}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowSendAdaptDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdaptForSend} disabled={adaptingForSend || (sendAdaptNeedIds.length === 0 && !sendAdaptNotes.trim())} className="bg-purple-600 hover:bg-purple-700 text-white">
              {adaptingForSend ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Adapting...</> : <><Sparkles className="w-3 h-3 mr-1" />Generate Adapted Copy</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Refine Dialog — iterative refinement with conversation memory ──── */}
      {/* Centrepiece feature from the teacher-framework guide: "Iterating with
          specific feedback is more powerful than getting the perfect first
          prompt. The AI remembers context within a conversation." */}
      <Dialog open={showRefineDialog} onOpenChange={setShowRefineDialog}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="inline-block w-2 h-6 rounded bg-purple-600" />
              {refineScope === "slide" ? "Refine this slide" : "Refine whole deck"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {refineScope === "slide" && presentation?.slides[refineTargetSlide] && (
              <div className="rounded-lg border bg-gray-50 p-2 text-xs">
                <span className="font-semibold">Editing: </span>
                Slide {refineTargetSlide + 1} — {presentation.slides[refineTargetSlide].title}
                <span className="text-gray-500"> ({SLIDE_LABELS[presentation.slides[refineTargetSlide].type] || presentation.slides[refineTargetSlide].type})</span>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Quick-pick improvements</Label>
              <div className="flex flex-wrap gap-1">
                {REFINE_QUICK_PICKS.map(qp => (
                  <button
                    key={qp.label}
                    type="button"
                    onClick={() => {
                      const slideLabel = refineScope === "slide"
                        ? `slide ${refineTargetSlide + 1}`
                        : "every slide";
                      const addition = qp.template(slideLabel);
                      setRefineText(prev => prev.trim() ? `${prev.trim()}\n\n${addition}` : addition);
                    }}
                    className="text-[10px] leading-tight rounded-full border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 px-2 py-1 transition-all"
                  >
                    + {qp.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Your refinement instruction</Label>
              <Textarea
                value={refineText}
                onChange={e => setRefineText(e.target.value)}
                placeholder="Describe what needs to change…"
                className="text-xs resize-none h-36"
              />
              <div className="text-[10px] text-gray-500 italic">
                Tip: be specific about WHAT was missing and WHAT should be added. The AI remembers the previous version and only changes what you ask for.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowRefineDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRefine} disabled={refining || !refineText.trim()} className="bg-purple-600 hover:bg-purple-700 text-white">
              {refining ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Refining…</> : <><Sparkles className="w-3 h-3 mr-1" />Apply refinement</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SEND Comparison View ─────────────────────────────────────────────── */}
      {showSendComparison && adaptedPresentation && presentation && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <div className="sticky top-0 bg-white border-b z-10 px-6 py-3 flex items-center justify-between shadow-sm">
            <div>
              <h2 className="font-bold text-gray-900">SEND Adaptation — Side by Side</h2>
              <p className="text-xs text-gray-500">Choose which version to keep, or use either for different groups</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setShowSendComparison(false); setAdaptedPresentation(null); }} className="text-xs">Discard Adapted</Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs" onClick={() => { setPresentation(adaptedPresentation); setShowSendComparison(false); setAdaptedPresentation(null); toast.success("Switched to SEND-adapted version!"); }}>Use Adapted Version</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowSendComparison(false)}>Keep Original</Button>
            </div>
          </div>
          {/* Slide nav */}
          <div className="flex items-center justify-center gap-4 py-3 border-b bg-gray-50">
            <Button variant="outline" size="sm" onClick={() => setComparisonActiveSlide(s => Math.max(0, s - 1))} disabled={comparisonActiveSlide === 0}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm font-medium">Slide {comparisonActiveSlide + 1} of {presentation.slides.length}</span>
            <Button variant="outline" size="sm" onClick={() => setComparisonActiveSlide(s => Math.min(presentation.slides.length - 1, s + 1))} disabled={comparisonActiveSlide === presentation.slides.length - 1}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          {/* Side-by-side */}
          <div className="grid grid-cols-2 gap-6 p-6 max-w-7xl mx-auto">
            {/* Original */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Original</span>
              </div>
              <FullSlideView slide={presentation.slides[comparisonActiveSlide]} theme={theme} index={comparisonActiveSlide} total={presentation.slides.length} symbolSupport={symbolSupport} />
              {presentation.slides[comparisonActiveSlide]?.speakerNotes && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                  <strong>Notes:</strong> {presentation.slides[comparisonActiveSlide].speakerNotes}
                </div>
              )}
            </div>
            {/* Adapted */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold">SEND Adapted</span>
              </div>
              <FullSlideView slide={adaptedPresentation.slides[comparisonActiveSlide]} theme={theme} index={comparisonActiveSlide} total={adaptedPresentation.slides.length} symbolSupport={symbolSupport} />
              {adaptedPresentation.slides[comparisonActiveSlide]?.speakerNotes && (
                <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                  <strong>Notes:</strong> {adaptedPresentation.slides[comparisonActiveSlide].speakerNotes}
                </div>
              )}
            </div>
          </div>
          {/* Slide strip thumbnails */}
          <div className="px-6 pb-6">
            <div className="text-xs font-semibold text-gray-600 mb-2">All Slides</div>
            <div className="grid grid-cols-8 gap-2">
              {presentation.slides.map((_, i) => (
                <button key={i} onClick={() => setComparisonActiveSlide(i)} className={`text-[10px] py-1 px-2 rounded border transition-all ${i === comparisonActiveSlide ? "border-blue-500 bg-blue-50 text-blue-700 font-bold" : "border-gray-200 hover:border-gray-400 text-gray-500"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

