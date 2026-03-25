/**
 * PresentationMaker — AI-powered lesson slide generator
 * Chalkie.ai-quality output: structured slides, professional themes, PPTX export
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
  ArrowRight, List, Copy, Check, Plus,
} from "lucide-react";
import { callAI } from "@/lib/ai";
import { useApp } from "@/contexts/AppContext";
import { useLocation } from "wouter";

import { FunFactsCarousel } from "@/components/FunFactsCarousel";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SlideContent {
  type: "title" | "learning-objectives" | "hook" | "content" | "key-terms" | "worked-example" | "activity" | "discussion" | "check-understanding" | "summary" | "exit-ticket" | "extension";
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  terms?: { term: string; definition: string }[];
  question?: string;
  options?: string[];
  answer?: string;
  steps?: string[];
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
};

type ThemeKey = keyof typeof THEMES;

// ─── Slide type icons ─────────────────────────────────────────────────────────
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
};

// ─── Slide type labels ────────────────────────────────────────────────────────
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
function buildSlidePrompt(params: {
  subject: string;
  yearGroup: string;
  topic: string;
  lessonType: string;
  slideCount: number;
  objectives?: string;
  additionalNotes?: string;
  sendNeeds?: string;
}): { system: string; user: string } {
  const { subject, yearGroup, topic, lessonType, slideCount, objectives, additionalNotes, sendNeeds } = params;

  const system = `You are an expert UK teacher and curriculum designer with 15+ years of experience creating outstanding, Ofsted-ready lesson presentations. You specialise in creating engaging, visually structured lessons that follow best pedagogical practice (Rosenshine's Principles, retrieval practice, spaced learning).

Your presentations are:
- Structured with clear learning progression (hook → objectives → content → practice → review)
- Age-appropriate and pitched perfectly for the year group
- Visually clear with concise bullet points (max 5 per slide, max 8 words per bullet)
- Packed with engaging activities, discussion prompts, and formative assessment
- SEND-inclusive with clear language and scaffolded support where needed
- Export-ready for PowerPoint with professional layouts

CRITICAL: You MUST return ONLY a valid JSON object. No markdown, no explanation, no code blocks. Just raw JSON.`;

  const user = `Create a complete, high-quality lesson presentation for the following:

Subject: ${subject}
Year Group: ${yearGroup}
Topic: ${topic}
Lesson Type: ${lessonType}
Number of Slides: ${slideCount}
${objectives ? `Learning Objectives: ${objectives}` : ""}
${sendNeeds ? `SEND / Additional Needs: ${sendNeeds}` : ""}
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ""}

Return a JSON object with this EXACT structure:
{
  "title": "Lesson title (engaging, specific)",
  "subject": "${subject}",
  "yearGroup": "${yearGroup}",
  "topic": "${topic}",
  "slides": [
    {
      "type": "title",
      "title": "Main lesson title",
      "subtitle": "Subject | Year Group | Date: ___________",
      "body": "One engaging hook sentence about the topic",
      "layout": "centered",
      "speakerNotes": "Welcome pupils, introduce the lesson..."
    },
    {
      "type": "learning-objectives",
      "title": "Today's Learning Objectives",
      "bullets": [
        "All: [must objective — core knowledge all pupils will achieve]",
        "Most: [should objective — deeper understanding most will achieve]",
        "Some: [could objective — extension for higher attainers]"
      ],
      "layout": "full",
      "speakerNotes": "Share objectives with class, ask pupils to predict..."
    },
    {
      "type": "hook",
      "title": "Starter Activity",
      "question": "Engaging question or retrieval task to activate prior knowledge",
      "bullets": ["Instruction 1", "Instruction 2"],
      "body": "Give pupils 3 minutes to discuss with their partner.",
      "layout": "centered",
      "speakerNotes": "Use cold calling to gather responses..."
    },
    ... (continue for all ${slideCount} slides, using appropriate types)
  ],
  "totalSlides": ${slideCount}
}

SLIDE TYPES to use (choose the most appropriate for each slide):
- "title" — opening title slide
- "learning-objectives" — lesson objectives (always include)
- "hook" — starter/retrieval activity
- "content" — main teaching content with bullets
- "key-terms" — vocabulary with terms array: [{"term": "word", "definition": "meaning"}]
- "worked-example" — step-by-step example with steps array
- "activity" — pupil task with clear instructions
- "discussion" — discussion/debate prompt
- "check-understanding" — quick quiz or MCQ with question, options array, answer
- "summary" — lesson summary and key takeaways
- "exit-ticket" — end of lesson assessment question
- "extension" — challenge task for early finishers

LAYOUT OPTIONS:
- "full" — full-width content
- "two-col" — two column layout
- "centered" — centred content (good for titles and questions)
- "image-right" — content left, image placeholder right

QUALITY REQUIREMENTS:
1. Every slide must have a clear, specific title (not generic like "Content Slide")
2. Bullet points must be concise (max 8 words each), specific, and factually accurate for ${topic}
3. Include at least 2 interactive/activity slides
4. Include formative assessment (check-understanding or exit-ticket)
5. Speaker notes must be practical and detailed (2-4 sentences each)
6. Key terms slide must have 5-8 accurate definitions for ${topic}
7. Worked example must have 4-6 clear, numbered steps
8. The lesson must flow logically from introduction to conclusion
9. Content must be curriculum-accurate for ${yearGroup} level
10. Use engaging, age-appropriate language throughout

Generate
 exactly ${slideCount} slides now.`;

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

  const renderSlideContent = () => {
    switch (slide.type) {
      case "title":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-12">
            <div className="text-4xl font-black mb-4 leading-tight" style={{ color: "white" }}>
              {slide.title}
            </div>
            {slide.subtitle && (
              <div className="text-lg font-medium mb-4" style={{ color: "rgba(255,255,255,0.85)" }}>
                {slide.subtitle}
              </div>
            )}
            {slide.body && (
              <div className="text-base max-w-2xl" style={{ color: "rgba(255,255,255,0.75)" }}>
                {slide.body}
              </div>
            )}
          </div>
        );

      case "learning-objectives":
        return (
          <div className="flex flex-col h-full">
            <div className="px-10 pt-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.accent }}>
                  <Target className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
              <div className="h-1 w-16 rounded-full" style={{ background: theme.secondary }} />
            </div>
            <div className="flex-1 px-10 pb-8 flex flex-col justify-center gap-3">
              {slide.bullets?.map((bullet, i) => {
                const isAll = bullet.startsWith("All:");
                const isMost = bullet.startsWith("Most:");
                const isSome = bullet.startsWith("Some:");
                const bgColor = isAll ? "#dcfce7" : isMost ? "#dbeafe" : isSome ? "#fef3c7" : theme.light;
                const borderColor = isAll ? "#16a34a" : isMost ? "#2563eb" : isSome ? "#d97706" : theme.secondary;
                const label = isAll ? "ALL" : isMost ? "MOST" : isSome ? "SOME" : `${i + 1}`;
                const text = bullet.replace(/^(All:|Most:|Some:)\s*/, "");
                return (
                  <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: bgColor, border: `2px solid ${borderColor}` }}>
                    <div className="px-2 py-0.5 rounded-full text-xs font-bold text-white flex-shrink-0" style={{ background: borderColor }}>
                      {label}
                    </div>
                    <div className="text-sm font-medium" style={{ color: theme.text }}>{text}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "key-terms":
        return (
          <div className="flex flex-col h-full">
            <div className="px-10 pt-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.secondary }}>
                  <List className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
              <div className="h-1 w-16 rounded-full" style={{ background: theme.secondary }} />
            </div>
            <div className="flex-1 px-10 pb-8 grid grid-cols-2 gap-2 overflow-hidden">
              {slide.terms?.slice(0, 8).map((item, i) => (
                <div key={i} className="rounded-lg p-2.5 border" style={{ background: theme.light, borderColor: theme.secondary + "40" }}>
                  <div className="text-xs font-bold mb-1" style={{ color: theme.secondary }}>{item.term}</div>
                  <div className="text-xs text-gray-600 leading-relaxed">{item.definition}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "worked-example":
        return (
          <div className="flex flex-col h-full">
            <div className="px-10 pt-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.primary }}>
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
              <div className="h-1 w-16 rounded-full" style={{ background: theme.secondary }} />
            </div>
            <div className="flex-1 px-10 pb-8 flex flex-col justify-center gap-2">
              {slide.steps?.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: theme.secondary }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 rounded-lg p-2.5" style={{ background: theme.light }}>
                    <div className="text-sm" style={{ color: theme.text }}>{step}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "check-understanding":
        return (
          <div className="flex flex-col h-full">
            <div className="px-10 pt-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.accent }}>
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
              <div className="h-1 w-16 rounded-full" style={{ background: theme.accent }} />
            </div>
            <div className="flex-1 px-10 pb-8 flex flex-col justify-center">
              {slide.question && (
                <div className="rounded-xl p-4 mb-4 text-center" style={{ background: theme.light }}>
                  <div className="text-lg font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
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
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: isAnswer ? "#16a34a" : theme.secondary }}>
                          {letters[i]}
                        </div>
                        <div className="text-sm" style={{ color: theme.text }}>{opt}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case "hook":
      case "discussion":
      case "exit-ticket":
        return (
          <div className="flex flex-col h-full">
            <div className="px-10 pt-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: slide.type === "hook" ? theme.accent : theme.secondary }}>
                  <HelpCircle className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
              <div className="h-1 w-16 rounded-full" style={{ background: theme.secondary }} />
            </div>
            <div className="flex-1 px-10 pb-8 flex flex-col justify-center gap-4">
              {slide.question && (
                <div className="rounded-2xl p-5 text-center" style={{ background: theme.light, border: `2px solid ${theme.secondary}30` }}>
                  <div className="text-xl font-semibold" style={{ color: theme.primary }}>{slide.question}</div>
                </div>
              )}
              {slide.bullets && slide.bullets.length > 0 && (
                <div className="space-y-2">
                  {slide.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5" style={{ background: theme.secondary }}>
                        {i + 1}
                      </div>
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

      default: // content, activity, summary, extension
        return (
          <div className="flex flex-col h-full">
            <div className="px-10 pt-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.primary }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>{slide.title}</h2>
              </div>
              <div className="h-1 w-16 rounded-full" style={{ background: theme.secondary }} />
            </div>
            <div className="flex-1 px-10 pb-8 flex flex-col justify-center gap-2">
              {slide.body && (
                <div className="text-sm text-gray-600 mb-2 italic">{slide.body}</div>
              )}
              {slide.bullets && slide.bullets.length > 0 && (
                <div className="space-y-2">
                  {slide.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg p-2.5" style={{ background: theme.light }}>
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: theme.secondary }} />
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
      {/* Top accent bar for non-title slides */}
      {!isTitleSlide && (
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: theme.gradient }} />
      )}
      {/* Slide number badge */}
      <div className="absolute top-3 right-4 text-xs font-medium" style={{ color: isTitleSlide ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>
        {index + 1} / {total}
      </div>
      {/* Slide type badge */}
      <div className="absolute bottom-3 left-4">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
          background: isTitleSlide ? "rgba(255,255,255,0.2)" : theme.light,
          color: isTitleSlide ? "rgba(255,255,255,0.8)" : theme.secondary,
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
      pSlide.background = { fill: "FFFFFF" };
      // Top accent bar
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: primaryClean },
      });
      // Title
      pSlide.addText(slide.title, {
        x: 0.5, y: 0.3, w: 8.5, h: 0.6,
        fontSize: 22, bold: true, color: primaryClean,
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
      pSlide.background = { fill: "FFFFFF" };
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: primaryClean },
      });
      pSlide.addText(slide.title, {
        x: 0.5, y: 0.3, w: 8.5, h: 0.6,
        fontSize: 22, bold: true, color: primaryClean,
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
          fontSize: 10, color: textClean,
          fontFace: "Calibri", wrap: true,
        });
      });
    } else if (slide.type === "worked-example") {
      pSlide.background = { fill: "FFFFFF" };
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: primaryClean },
      });
      pSlide.addText(slide.title, {
        x: 0.5, y: 0.3, w: 8.5, h: 0.6,
        fontSize: 22, bold: true, color: primaryClean,
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
          fontSize: 12, color: textClean,
          fontFace: "Calibri", wrap: true,
        });
      });
    } else if (slide.type === "check-understanding") {
      pSlide.background = { fill: "FFFFFF" };
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: accentClean },
      });
      pSlide.addText(slide.title, {
        x: 0.5, y: 0.3, w: 8.5, h: 0.6,
        fontSize: 22, bold: true, color: primaryClean,
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
          fontSize: 15, bold: true, color: primaryClean,
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
          fontSize: 12, color: textClean,
          fontFace: "Calibri", wrap: true,
        });
      });
    } else {
      // Generic slide: content, activity, hook, discussion, summary, exit-ticket, extension
      pSlide.background = { fill: "FFFFFF" };
      pSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: primaryClean },
      });
      pSlide.addText(slide.title, {
        x: 0.5, y: 0.3, w: 8.5, h: 0.6,
        fontSize: 22, bold: true, color: primaryClean,
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
          fontSize: 12, color: "6B7280",
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
          fontSize: 15, bold: true, color: primaryClean,
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
            fontSize: 12, color: textClean,
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
                  <Select value={yearGroup} onValueChange={setYearGroup}>
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
