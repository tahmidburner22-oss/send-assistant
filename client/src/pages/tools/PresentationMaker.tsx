/**
 * PresentationMaker — AI-powered lesson slide generator
 * Professional-quality output: structured slides, professional themes, PPTX export
 */
import { useState } from "react";
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
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { callAI } from "@/lib/ai";
import { useApp } from "@/contexts/AppContext";
import { useLocation } from "wouter";

import { FunFactsCarousel } from "@/components/FunFactsCarousel";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SlideContent {
  type: "title" | "learning-objectives" | "hook" | "content" | "key-terms" | "worked-example"
    | "activity" | "discussion" | "check-understanding" | "summary" | "exit-ticket" | "extension"
    | "retrieval-warm-up" | "misconception-bust" | "exam-technique" | "real-world-link"
    | "think-pair-share" | "mini-quiz" | "diagram-label" | "pause-and-solve";
  title: string;
  subtitle?: string;
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
  image_prompt?: string;
  layout?: "full" | "two-col" | "image-right" | "image-left" | "centered";
  accent?: string;
  speakerNotes?: string;
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
};
type ThemeKey = keyof typeof THEMES;

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

const SLIDE_COUNTS = ["8", "10", "12", "15", "18", "20"];

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

  // Build the structured slide plan
  const slidePlan = buildSlidePlan(slideCount, lessonType, yearGroup);

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
  };

  const planDescription = slidePlan.map((type, i) =>
    `  Slide ${i + 1}: "${type}" — ${bloomsMap[type] || "APPLY"}`
  ).join("\n");

  const sendNote = sendNeeds ? `
SEND ADAPTATIONS (apply throughout):
- ${sendNeeds}
- Use clear, unambiguous language
- Chunk information into small steps
- Include sentence starters where appropriate
- Reduce cognitive load: max 3 bullets per slide for SEND pupils` : "";

  const readingAgeNote = readingAge ? `
READING AGE TARGET: ${READING_AGE_LABELS[readingAge] || `Age ${readingAge}`}
- Every word of text on slides must be readable by a child of reading age ${readingAge}.
- Vocabulary ceiling: ${readingAge <= 8 ? "only the 1,000 most common English words; no technical jargon without a definition" : readingAge <= 11 ? "everyday vocabulary; define all subject-specific terms on the key-terms slide" : readingAge <= 14 ? "GCSE-level vocabulary; avoid A-level register" : "full academic vocabulary appropriate for sixth form"}
- Sentence length: max ${readingAge <= 8 ? "6" : readingAge <= 11 ? "10" : readingAge <= 14 ? "15" : "20"} words per sentence on slides.
- ${readingAge <= 10 ? "Use concrete examples (objects, animals, everyday situations) not abstract concepts." : ""}` : "";

  const examBoardNote = examBoard && examBoard !== "none" ? `
EXAM BOARD: ${examBoard}
- Use ${examBoard} command words, mark scheme language, and assessment objectives.
- Reference ${examBoard} specification terminology where relevant.
- Exam technique slides must reflect ${examBoard} mark scheme conventions.` : "";

  const diffNote = differentiationLevel ? `
DIFFERENTIATION LEVEL: ${differentiationLevel.toUpperCase()}
- ${differentiationLevel === "foundation" ? "Pitch content at foundation/support level. Use scaffolding, sentence starters, word banks, and worked examples on every activity slide. Avoid open-ended tasks without structure." : differentiationLevel === "extension" ? "Pitch content at extension/challenge level. Include higher-order thinking, evaluation tasks, and stretch questions. Assume strong prior knowledge." : "Pitch content at core/expected level for this year group."}` : "";

  const system = `You are an expert UK teacher and curriculum designer. You create outstanding, Ofsted-ready lesson presentations that follow best pedagogical practice: Rosenshine's Principles, Bloom's Taxonomy, retrieval practice, and spaced learning.

PRESENTATION DESIGN RULES (NON-NEGOTIABLE):
1. TEXT LIMITS: Max 8 words per bullet. Max 4 bullets per slide. No paragraphs. No dense text blocks.
2. TEACHING FLOW: Every slide has a clear pedagogical role. Follow the slide plan exactly.
3. VISUAL-FIRST: Prefer diagrams, examples, and visuals over text explanations.
4. PROGRESSION: Difficulty escalates: recall → understand → apply → analyse → evaluate.
5. INTERACTION: At least 30% of slides must be interactive (questions, activities, discussions).
6. SPECIFICITY: Use real numbers, real contexts, real examples — never generic placeholders.
7. CONCISENESS: Slide titles max 6 words. Speaker notes 2-4 sentences, practical and actionable.
8. IMAGE PROMPTS: For visual slides, include a specific image_prompt field describing an ideal photograph or diagram.

CRITICAL: Return ONLY valid JSON. No markdown, no explanation, no code blocks.`;

  const slideTypeGuide = `SLIDE TYPE SPECIFICATIONS:

"title" → title (engaging, specific), subtitle (subject | year | date line), body (one hook sentence), image_prompt (relevant background image)
"learning-objectives" → title, bullets (All/Most/Some format — 3 bullets), speakerNotes
"retrieval-warm-up" → title, retrievalQuestions (array of 3-5 quick recall questions from prior lessons), speakerNotes
"hook" → title, question (thought-provoking opener), bullets (2-3 instructions), body (timing/context), image_prompt
"key-terms" → title, terms (array of {term, definition} — 5-8 terms, definitions max 10 words each)
"content" → title, bullets (3-5 concise facts/concepts, max 8 words each), body (optional context sentence), layout ("two-col" if comparing), image_prompt (optional)
"worked-example" → title, steps (4-6 numbered steps, each max 15 words, show full working), body (what to notice), speakerNotes
"diagram-label" → title, diagramDescription (describe the diagram clearly for rendering), diagramLabels (array of 4-8 label strings), question (what to label/identify), speakerNotes
"activity" → title, question (task instruction), bullets (3-5 step-by-step instructions), body (time allocation e.g. "5 minutes"), speakerNotes
"pause-and-solve" → title, question (the problem to solve), steps (reveal steps — show method progressively), answer (final answer), speakerNotes
"check-understanding" → title, question (MCQ question stem), options (array of 4 options A-D), answer (correct letter), speakerNotes
"mini-quiz" → title, retrievalQuestions (3-5 questions with answers embedded as "Q: ... A: ..."), speakerNotes
"misconception-bust" → title, misconception (what students often think — quote it), correction (what is actually correct), bullets (why the misconception is wrong — 2-3 points), speakerNotes
"think-pair-share" → title, question (discussion question), bullets (Think/Pair/Share instructions), body (time: "2 min think, 2 min pair, share"), speakerNotes
"discussion" → title, question (debate/discussion prompt), bullets (2-3 discussion points or sentence starters), body (context), speakerNotes
"real-world-link" → title, realWorldContext (1-2 sentences connecting to real life), bullets (3 real-world applications), image_prompt (relevant real-world image), speakerNotes
"exam-technique" → title, examTip (specific exam strategy), markSchemeHint (what examiners look for), bullets (2-3 command word tips), speakerNotes
"extension" → title, question (challenge task), bullets (scaffolding steps for extension), body (hint or context), speakerNotes
"summary" → title, bullets (3-5 key takeaways — the most important things to remember), body (link to next lesson), speakerNotes
"exit-ticket" → title, question (assessment question), options (optional MCQ options), answer (correct answer or model answer), speakerNotes

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
${readingAgeNote}
${examBoardNote}
${diffNote}

SLIDE PLAN (follow this EXACTLY — do not change the order or types):
${planDescription}

${slideTypeGuide}

IMAGE SYSTEM — TWO-STAGE RELEVANCE CHECK:
For every slide with an image_prompt field:
1. First check: Is this slide type visual? (title, hook, content, real-world-link, diagram-label = YES; objectives, key-terms, exit-ticket = NO)
2. Second check: Is the topic specific enough for a relevant image? (e.g. "Ohm's Law circuit" = YES; "Introduction" = NO)
Only include image_prompt if BOTH checks pass. Make it specific: "photograph of a series circuit with labelled components" not "science image".

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
  theme: typeof THEMES[ThemeKey];
  index: number;
  total: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = SLIDE_ICONS[slide.type] || BookOpen;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg overflow-hidden border-2 transition-all ${
        isActive ? "border-blue-500 shadow-lg scale-[1.02]" : "border-gray-200 hover:border-gray-300"
      }`}
      style={{ aspectRatio: "16/9", position: "relative" }}
    >
      <div className="absolute inset-0 flex flex-col" style={{ background: theme.bg }}>
        {/* Mini slide header */}
        <div className="h-2" style={{ background: theme.gradient }} />
        <div className="flex-1 p-2 flex flex-col justify-center overflow-hidden">
          <div className="text-[7px] font-bold truncate" style={{ color: theme.primary }}>
            {slide.title}
          </div>
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
        {/* Slide number */}
        <div className="absolute bottom-1 right-1 text-[5px] text-gray-400">{index + 1}/{total}</div>
      </div>
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
  "pause-and-solve":     "#dc2626",
  "check-understanding": "#d97706",
  "mini-quiz":           "#7C3AED",
  "misconception-bust":  "#dc2626",
  "think-pair-share":    "#0891b2",
  "discussion":          "#059669",
  "real-world-link":     "#065f46",
  "exam-technique":      "#1d4ed8",
  "extension":           "#7C3AED",
  "summary":             "#1B2A4A",
  "exit-ticket":         "#dc2626",
};

function SlideHeader({ slide, theme, Icon }: { slide: SlideContent; theme: typeof THEMES[ThemeKey]; Icon: React.ElementType }) {
  const badgeColour = SLIDE_TYPE_COLOURS[slide.type] || theme.secondary;
  return (
    <div className="px-10 pt-7 pb-3">
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: badgeColour }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-[1.35rem] font-bold leading-tight" style={{ color: theme.primary }}>{slide.title}</h2>
      </div>
      <div className="h-[3px] w-14 rounded-full" style={{ background: badgeColour }} />
    </div>
  );
}

function FullSlideView({
  slide,
  theme,
  index,
  total,
}: {
  slide: SlideContent;
  theme: typeof THEMES[ThemeKey];
  index: number;
  total: number;
}) {
  const Icon = SLIDE_ICONS[slide.type] || BookOpen;
  const badgeColour = SLIDE_TYPE_COLOURS[slide.type] || theme.secondary;

  const renderSlideContent = () => {
    switch (slide.type) {

      // ── Title ──────────────────────────────────────────────────────────────
      case "title":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-14 gap-4">
            {slide.image_prompt && (
              <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: `url(https://source.unsplash.com/featured/1280x720/?${encodeURIComponent(slide.image_prompt)})` }} />
            )}
            <div className="relative">
              <div className="text-[2.4rem] font-black mb-3 leading-tight" style={{ color: "white" }}>
                {slide.title}
              </div>
              {slide.subtitle && (
                <div className="text-base font-medium mb-3" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {slide.subtitle}
                </div>
              )}
              {slide.body && (
                <div className="text-sm max-w-xl mx-auto rounded-xl px-5 py-3" style={{ color: "rgba(255,255,255,0.9)", background: "rgba(0,0,0,0.25)" }}>
                  {slide.body}
                </div>
              )}
            </div>
          </div>
        );

      // ── Learning Objectives ────────────────────────────────────────────────
      case "learning-objectives":
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
                <div key={i} className="rounded-lg p-2.5 border" style={{ background: theme.light, borderColor: badgeColour + "40" }}>
                  <div className="text-xs font-bold mb-1" style={{ color: badgeColour }}>{item.term}</div>
                  <div className="text-xs text-gray-600 leading-relaxed">{item.definition}</div>
                </div>
              ))}
            </div>
          </div>
        );

      // ── Worked Example ─────────────────────────────────────────────────────
      case "worked-example":
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
                <div className="rounded-lg p-2.5 text-center" style={{ background: "#dcfce7", border: "1px solid #16a34a" }}>
                  <div className="text-xs font-bold text-green-700">Answer: {slide.answer}</div>
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
                  return (
                    <div key={i} className="rounded-lg p-2.5" style={{ background: theme.light, border: `1px solid ${badgeColour}30` }}>
                      <div className="text-sm font-medium" style={{ color: theme.text }}>
                        <span className="font-bold" style={{ color: badgeColour }}>Q{i + 1}: </span>{parts[0]}
                      </div>
                      {parts[1] && (
                        <div className="text-xs mt-1 font-medium text-green-700">✓ {parts[1]}</div>
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
                    const isAnswer = slide.answer === letters[i] || slide.answer === opt;
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
                <div className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center" style={{ borderColor: badgeColour + "60", background: theme.light, minHeight: "140px" }}>
                  <div className="text-xs text-gray-500 mb-2">Diagram Area</div>
                  {slide.diagramDescription && (
                    <div className="text-xs text-gray-700 italic">{slide.diagramDescription}</div>
                  )}
                </div>
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
          <div className="flex flex-col h-full" style={{ background: "linear-gradient(135deg,#FFF0FB,#FFF8E1)" }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "#EC4899" }}>📖</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: "#7C3AED" }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex flex-col justify-center gap-4">
              {slide.body && (
                <div className="rounded-3xl p-5 text-[1.1rem] font-semibold leading-relaxed" style={{ background: "rgba(236,72,153,0.1)", border: "3px solid #EC4899", color: "#4a044e" }}>
                  {slide.body}
                </div>
              )}
              {slide.image_prompt && (
                <div className="rounded-2xl overflow-hidden h-28 bg-cover bg-center opacity-80" style={{ backgroundImage: `url(https://source.unsplash.com/featured/600x200/?${encodeURIComponent(slide.image_prompt)})`, border: "3px solid #F59E0B" }} />
              )}
            </div>
          </div>
        );

      // ── Primary: Draw It ──────────────────────────────────────────────────
      case "draw-it":
        return (
          <div className="flex flex-col h-full" style={{ background: "linear-gradient(135deg,#F0FDF4,#ECFEFF)" }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "#22c55e" }}>✏️</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: "#15803d" }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex gap-4 items-center">
              <div className="flex-1">
                {slide.question && (
                  <div className="text-[1.1rem] font-bold mb-4 rounded-2xl p-4" style={{ background: "rgba(34,197,94,0.15)", border: "3px solid #22c55e", color: "#14532d" }}>
                    {slide.question}
                  </div>
                )}
                {slide.body && <div className="text-sm font-medium" style={{ color: "#166534" }}>{slide.body}</div>}
              </div>
              <div className="flex-1 rounded-3xl flex items-center justify-center" style={{ border: "3px dashed #22c55e", background: "white", minHeight: "120px" }}>
                <div className="text-center" style={{ color: "#86efac" }}>
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
          <div className="flex flex-col h-full" style={{ background: "linear-gradient(135deg,#FFF7ED,#FFFBEB)" }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "#f97316" }}>🗂️</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: "#c2410c" }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex flex-col justify-center gap-3">
              {slide.question && <div className="text-base font-bold" style={{ color: "#7c2d12" }}>{slide.question}</div>}
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
          <div className="flex flex-col h-full" style={{ background: "linear-gradient(135deg,#EFF6FF,#F5F3FF)" }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "#7C3AED" }}>⚡</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: "#4c1d95" }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex gap-4 items-center">
              <div className="flex-1 flex flex-col gap-2">
                {slide.bullets?.map((item, i) => (
                  <div key={i} className="rounded-xl px-4 py-2 text-sm font-bold" style={{ background: "#ede9fe", border: "2px solid #7C3AED", color: "#4c1d95" }}>{item}</div>
                ))}
              </div>
              <div className="flex flex-col gap-2 text-2xl text-gray-300">
                {slide.bullets?.map((_, i) => <div key={i}>→</div>)}
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {slide.body?.split("|").map((item, i) => (
                  <div key={i} className="rounded-xl px-4 py-2 text-sm font-bold" style={{ background: "#fce7f3", border: "2px solid #EC4899", color: "#831843" }}>{item.trim()}</div>
                ))}
              </div>
            </div>
          </div>
        );

      // ── Primary: Fill the Gap ──────────────────────────────────────────────
      case "fill-the-gap":
        return (
          <div className="flex flex-col h-full" style={{ background: "linear-gradient(135deg,#ECFEFF,#F0FDF4)" }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "#0891b2" }}>✍️</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: "#164e63" }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex flex-col justify-center gap-4">
              {slide.question && (
                <div className="text-[1.1rem] font-bold rounded-2xl p-5 leading-loose" style={{ background: "rgba(8,145,178,0.1)", border: "3px solid #0891b2", color: "#164e63" }}>
                  {slide.question.split("___").map((part, i, arr) => (
                    <span key={i}>{part}{i < arr.length-1 && <span className="inline-block border-b-4 border-cyan-500 w-20 mx-1 align-bottom" />}</span>
                  ))}
                </div>
              )}
              {slide.bullets && slide.bullets.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#0891b2" }}>Word Bank</div>
                  <div className="flex gap-2 flex-wrap">
                    {slide.bullets.map((word, i) => (
                      <div key={i} className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ background: "#cffafe", border: "2px solid #0891b2", color: "#164e63" }}>{word}</div>
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
          <div className="flex flex-col h-full" style={{ background: "linear-gradient(135deg,#FFF1F2,#FFF7ED)" }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "#dc2626" }}>🔍</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: "#991b1b" }}>{slide.title}</h2>
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
          <div className="flex flex-col h-full" style={{ background: "linear-gradient(135deg,#FEFCE8,#FFF0FB)" }}>
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "#eab308" }}>🔢</div>
                <h2 className="text-[1.5rem] font-black" style={{ color: "#713f12" }}>{slide.title}</h2>
              </div>
            </div>
            <div className="flex-1 px-8 pb-6 flex gap-5 items-center">
              {slide.question && (
                <div className="w-32 h-32 rounded-3xl flex items-center justify-center text-[2.5rem] font-black flex-shrink-0" style={{ background: "#fef9c3", border: "4px solid #eab308", color: "#713f12" }}>
                  {slide.question}
                </div>
              )}
              <div className="flex-1 flex flex-col gap-2">
                {slide.bullets?.map((way, i) => (
                  <div key={i} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: ["#fef9c3","#dcfce7","#dbeafe"][i%3], border: `2px solid ${["#ca8a04","#16a34a","#2563eb"][i%3]}`, color: ["#713f12","#14532d","#1e3a8a"][i%3] }}>
                    {way}
                  </div>
                ))}
                {slide.body && <div className="text-xs font-semibold italic mt-1" style={{ color: "#92400e" }}>{slide.body}</div>}
              </div>
            </div>
          </div>
        );

      // ── Default: content / activity / extension ────────────────────────────
      default:
        return (
          <div className="flex flex-col h-full">
            <SlideHeader slide={slide} theme={theme} Icon={Icon} />
            <div className="flex-1 px-10 pb-7 flex flex-col justify-center gap-2">
              {slide.body && (
                <div className="text-sm text-gray-600 mb-1 italic">{slide.body}</div>
              )}
              {slide.question && (
                <div className="rounded-xl p-3.5 mb-1" style={{ background: theme.light, border: `1px solid ${badgeColour}30` }}>
                  <div className="text-sm font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
                </div>
              )}
              {slide.bullets && slide.bullets.length > 0 && (
                <div className="space-y-2">
                  {slide.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg p-2.5" style={{ background: theme.light }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: badgeColour }} />
                      <div className="text-sm font-medium" style={{ color: theme.text }}>{bullet}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  const isTitleSlide = slide.type === "title";

  return (
    <div
      className="w-full rounded-2xl overflow-hidden shadow-2xl"
      style={{
        aspectRatio: "16/9",
        background: isTitleSlide ? theme.gradient : theme.bg,
        position: "relative",
      }}
    >
      {/* Top accent bar — coloured by slide type */}
      {!isTitleSlide && (
        <div className="absolute top-0 left-0 right-0 h-[4px]" style={{ background: badgeColour }} />
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
      {renderSlideContent()}
    </div>
  );
}


// ─── PPTX Export ─────────────────────────────────────────────────────────────
async function exportToPptx(presentation: PresentationData, themeKey: ThemeKey): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  const theme = THEMES[themeKey];

  pptx.layout = "LAYOUT_WIDE"; // 16:9
  pptx.title = presentation.title;
  pptx.subject = presentation.subject;
  pptx.author = "Adaptly AI";

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
  // Dark theme detection: if bg is dark, use white text for non-title slides
  const isDark = parseInt(bgClean.slice(0, 2), 16) < 60;
  const slideBgClean = bgClean;
  const slideTextClean = isDark ? "E2E8F0" : textClean;
  const slideTitleClean = isDark ? "E2E8F0" : primaryClean;

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
      // Decorative accent bar
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: accentClean },
      });
      // Title
      pSlide.addText(slide.title, {
        x: 0.5, y: 1.8, w: 9, h: 1.5,
        fontSize: 36, bold: true, color: "FFFFFF",
        align: "center", fontFace: "Calibri",
        wrap: true,
      });
      // Subtitle
      if (slide.subtitle) {
        pSlide.addText(slide.subtitle, {
          x: 0.5, y: 3.5, w: 9, h: 0.5,
          fontSize: 16, color: "CCDDFF",
          align: "center", fontFace: "Calibri",
          italic: true,
        });
      }
      // Body / hook
      if (slide.body) {
        pSlide.addText(slide.body, {
          x: 1, y: 4.2, w: 8, h: 0.6,
          fontSize: 13, color: "AABBDD",
          align: "center", fontFace: "Calibri",
          italic: true,
        });
      }
      // Slide number
      pSlide.addText(`${idx + 1} / ${presentation.slides.length}`, {
        x: 8.5, y: 5.1, w: 1, h: 0.3,
        fontSize: 9, color: "8899BB",
        align: "right",
      });
    } else if (slide.type === "learning-objectives") {
      pSlide.background = { fill: slideBgClean };
      // Top accent bar
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: isDark ? secondaryClean : primaryClean },
      });
      // Title
      pSlide.addText(slide.title, {
        x: 0.5, y: 0.3, w: 8.5, h: 0.6,
        fontSize: 22, bold: true, color: slideTitleClean,
        fontFace: "Calibri",
      });
      // Underline
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 0.95, w: 1.2, h: 0.05,
        fill: { type: "solid", color: secondaryClean },
      });
      // Objectives
      const objColors = ["16A34A", "2563EB", "D97706"];
      const objLabels = ["ALL", "MOST", "SOME"];
      (slide.bullets || []).forEach((bullet, i) => {
        const text = bullet.replace(/^(All:|Most:|Some:)\s*/i, "");
        const color = objColors[i] || secondaryClean;
        const label = objLabels[i] || String(i + 1);
        const yPos = 1.2 + i * 1.1;
        // Background rect
        pSlide.addShape(pptx.ShapeType.rect, {
          x: 0.5, y: yPos, w: 9, h: 0.85,
          fill: { type: "solid", color: color + "15" },
          line: { color, width: 1.5 },
          rectRadius: 0.1,
        });
        // Label badge
        pSlide.addText(label, {
          x: 0.6, y: yPos + 0.2, w: 0.7, h: 0.45,
          fontSize: 11, bold: true, color: "FFFFFF",
          align: "center",
          fill: { type: "solid", color },
          rectRadius: 0.1,
        });
        // Objective text
        pSlide.addText(text, {
          x: 1.5, y: yPos + 0.15, w: 7.8, h: 0.55,
          fontSize: 13, color: textClean,
          fontFace: "Calibri",
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
        fontFace: "Calibri",
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
        pSlide.addText(item.term, {
          x: x + 0.1, y: y + 0.05, w: 4.3, h: 0.3,
          fontSize: 11, bold: true, color: secondaryClean,
          fontFace: "Calibri",
        });
        pSlide.addText(item.definition, {
          x: x + 0.1, y: y + 0.38, w: 4.3, h: 0.42,
          fontSize: 10, color: slideTextClean,
          fontFace: "Calibri", wrap: true,
        });
      });
    } else if (slide.type === "worked-example") {
      pSlide.background = { fill: slideBgClean };
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: isDark ? secondaryClean : primaryClean },
      });
      pSlide.addText(slide.title, {
        x: 0.5, y: 0.3, w: 8.5, h: 0.6,
        fontSize: 22, bold: true, color: slideTitleClean,
        fontFace: "Calibri",
      });
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 0.95, w: 1.2, h: 0.05,
        fill: { type: "solid", color: secondaryClean },
      });
      (slide.steps || []).forEach((step, i) => {
        const y = 1.15 + i * 0.75;
        // Step circle
        pSlide.addShape(pptx.ShapeType.ellipse, {
          x: 0.5, y: y, w: 0.4, h: 0.4,
          fill: { type: "solid", color: secondaryClean },
        });
        pSlide.addText(String(i + 1), {
          x: 0.5, y: y, w: 0.4, h: 0.4,
          fontSize: 12, bold: true, color: "FFFFFF",
          align: "center", valign: "middle",
        });
        // Step text
        pSlide.addShape(pptx.ShapeType.rect, {
          x: 1.1, y: y, w: 8.3, h: 0.55,
          fill: { type: "solid", color: lightClean },
          rectRadius: 0.08,
        });
        pSlide.addText(step, {
          x: 1.2, y: y + 0.05, w: 8.1, h: 0.45,
          fontSize: 12, color: slideTextClean,
          fontFace: "Calibri", wrap: true,
        });
      });
    } else if (slide.type === "check-understanding") {
      pSlide.background = { fill: slideBgClean };
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: accentClean },
      });
      pSlide.addText(slide.title, {
        x: 0.5, y: 0.3, w: 8.5, h: 0.6,
        fontSize: 22, bold: true, color: slideTitleClean,
        fontFace: "Calibri",
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
          align: "center", fontFace: "Calibri", wrap: true,
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
          fontFace: "Calibri", wrap: true,
        });
      });
    } else {
      // Generic slide: content, activity, hook, discussion, summary, exit-ticket, extension
      pSlide.background = { fill: slideBgClean };
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: isDark ? secondaryClean : primaryClean },
      });
      pSlide.addText(slide.title, {
        x: 0.5, y: 0.3, w: 8.5, h: 0.6,
        fontSize: 22, bold: true, color: slideTitleClean,
        fontFace: "Calibri",
      });
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 0.95, w: 1.2, h: 0.05,
        fill: { type: "solid", color: secondaryClean },
      });

      let yPos = 1.2;

      if (slide.body) {
        pSlide.addText(slide.body, {
          x: 0.5, y: yPos, w: 9, h: 0.5,
          fontSize: 12, color: isDark ? "94A3B8" : "6B7280",
          italic: true, fontFace: "Calibri", wrap: true,
        });
        yPos += 0.6;
      }

      if (slide.question) {
        pSlide.addShape(pptx.ShapeType.rect, {
          x: 0.5, y: yPos, w: 9, h: 0.8,
          fill: { type: "solid", color: lightClean },
          rectRadius: 0.1,
        });
        pSlide.addText(slide.question, {
          x: 0.7, y: yPos + 0.1, w: 8.6, h: 0.6,
          fontSize: 15, bold: true, color: slideTitleClean,
          align: "center", fontFace: "Calibri", wrap: true,
        });
        yPos += 1.0;
      }

      if (slide.bullets && slide.bullets.length > 0) {
        slide.bullets.forEach((bullet, i) => {
          pSlide.addShape(pptx.ShapeType.rect, {
            x: 0.5, y: yPos, w: 9, h: 0.55,
            fill: { type: "solid", color: lightClean },
            rectRadius: 0.06,
          });
          pSlide.addShape(pptx.ShapeType.ellipse, {
            x: 0.65, y: yPos + 0.18, w: 0.18, h: 0.18,
            fill: { type: "solid", color: secondaryClean },
          });
          pSlide.addText(bullet, {
            x: 1.0, y: yPos + 0.08, w: 8.3, h: 0.4,
            fontSize: 12, color: slideTextClean,
            fontFace: "Calibri", wrap: true,
          });
          yPos += 0.65;
        });
      }
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PresentationMaker() {
  const { user } = useApp();
  const [, setLocation] = useLocation();

  // Form state
  const [subject, setSubject] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [topic, setTopic] = useState("");
  const [lessonType, setLessonType] = useState("introduction");
  const [slideCount, setSlideCount] = useState("12");
  const [objectives, setObjectives] = useState("");
  const [sendNeeds, setSendNeeds] = useState("");
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

  const theme = THEMES[selectedTheme];

  const handleGenerate = async () => {
    if (!subject || !yearGroup || !topic) {
      toast.error("Please fill in Subject, Year Group, and Topic");
      return;
    }

    setLoading(true);
    setPresentation(null);
    setActiveSlide(0);

    try {
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
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
      } catch (parseErr) {
        throw new Error("Failed to parse AI response as JSON. Please try again.");
      }

      if (!parsed.slides || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        throw new Error("No slides were generated. Please try again.");
      }

      setPresentation(parsed);
      toast.success(`Generated ${parsed.slides.length} slides!`);
    } catch (err: any) {
      console.error("Presentation generation failed:", err);
      toast.error(err.message || "Failed to generate presentation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPptx = async () => {
    if (!presentation) return;
    setExporting(true);
    try {
      await exportToPptx(presentation, selectedTheme);
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

  const currentSlide = presentation?.slides[activeSlide];

  return (
    <div className="min-h-screen bg-gray-50">
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                className="text-xs"
              >
                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                Copy Text
              </Button>
              <Button
                size="sm"
                onClick={handleExportPptx}
                disabled={exporting}
                className="text-xs text-white"
                style={{ background: theme.gradient, border: "none" }}
              >
                {exporting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileDown className="w-3 h-3 mr-1" />}
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

                {/* SEND Needs */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">SEND / Additional Needs (optional)</Label>
                  <Input
                    value={sendNeeds}
                    onChange={e => setSendNeeds(e.target.value)}
                    placeholder="e.g. 3 pupils with dyslexia, 2 EAL..."
                    className="h-8 text-xs"
                  />
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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNotes(!showNotes)}
                      className="text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {showNotes ? "Hide" : "Show"} Notes
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
                  <div>
                    <FullSlideView
                      slide={currentSlide}
                      theme={theme}
                      index={activeSlide}
                      total={presentation.slides.length}
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

                {/* Slide strip */}
                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">All Slides</div>
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                    {presentation.slides.map((slide, i) => (
                      <SlidePreview
                        key={i}
                        slide={slide}
                        theme={theme}
                        index={i}
                        total={presentation.slides.length}
                        isActive={i === activeSlide}
                        onClick={() => setActiveSlide(i)}
                      />
                    ))}
                  </div>
                </div>

                {/* Export buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={handleExportPptx}
                    disabled={exporting}
                    className="flex-1 text-white font-semibold"
                    style={{ background: theme.gradient, border: "none" }}
                  >
                    {exporting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exporting...</>
                    ) : (
                      <><FileDown className="w-4 h-4 mr-2" />Download PowerPoint (.pptx)</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopyText}
                    className="text-xs"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
