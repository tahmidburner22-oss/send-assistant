import { useState, useRef } from "react";
import { callAI, parseWithFixes } from "@/lib/ai";
import { downloadHtmlAsPdf, printWorksheetElement } from "@/lib/pdf-generator-v2";
import { exportToDocx } from "@/lib/docx-export";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  BookOpen, RefreshCw, Sparkles, Copy, Printer, Download,
  ChevronLeft, Loader2, Clock, FileDown,
} from "lucide-react";

// ── Data Options ──────────────────────────────────────────────────────────────

import { SUBJECTS_ALL as subjects, YEAR_GROUPS as years } from "@/lib/tool-vocab";
const durations = ["20 minutes","30 minutes","45 minutes","50 minutes","60 minutes","75 minutes","90 minutes","100 minutes"].map(d => ({ value: d, label: d }));
const teachingStyles = [
  { value: "direct", label: "Direct Instruction" },
  { value: "inquiry", label: "Inquiry-Based Learning" },
  { value: "collaborative", label: "Collaborative / Group Work" },
  { value: "flipped", label: "Flipped Classroom" },
  { value: "mixed", label: "Mixed / Blended" },
];

// ── Interfaces ────────────────────────────────────────────────────────────────

interface LessonPlanPhase {
  name: string;
  mins: number;
  teacherSteps: string[];
  pupilSteps: string[];
  differentiation: string;
}

interface LessonPlanData {
  overview: string;
  objectives: string[];
  successCriteria: string[];
  vocab: { term: string; definition: string }[];
  phases: LessonPlanPhase[];
  sendAdaptations: string;
  afL: string;
  homework: string;
}

// ── Section Colours ───────────────────────────────────────────────────────────

const SECTION_COLOURS: Record<string, { bg: string; border: string; text: string }> = {
  overview: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  objectives: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  successCriteria: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  vocab: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  phases: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
  sendAdaptations: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700" },
  afL: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700" },
  homework: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
};

const SECTION_TITLES: Record<string, string> = {
  overview: "Lesson Overview",
  objectives: "Learning Objectives",
  successCriteria: "Success Criteria",
  vocab: "Key Vocabulary",
  sendAdaptations: "SEND Adaptations",
  afL: "Assessment for Learning",
  homework: "Homework / Follow-Up",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function LessonPlanner() {
  const { preferences } = useUserPreferences();

  // Form state
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<LessonPlanData | null>(null);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const set = (key: string, val: string) => setValues(prev => ({ ...prev, [key]: val }));

  // ── Generate ────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!values.subject || !values.yearGroup || !values.topic) {
      toast.error("Please fill in Subject, Year Group, and Topic");
      return;
    }

    setLoading(true);
    setPlan(null);

    const systemPrompt = `You are an outstanding UK teacher with 15+ years of experience. You create detailed, SEND-inclusive, curriculum-aligned lesson plans grounded in Rosenshine's Principles, EEF guidance, and the UK National Curriculum. Return valid JSON only - no markdown fences, no commentary outside the JSON.`;

    const userPrompt = `Create a comprehensive lesson plan for:
Subject: ${values.subject}
Year Group: ${values.yearGroup}
Topic: ${values.topic}
Duration: ${values.duration || "60 minutes"}
Class Size: ${values.classSize || "Mixed ability class"}
SEND / Additional Needs: ${values.sendNeeds || "Mixed ability - standard differentiation required"}
Prior Learning: ${values.priorLearning || "Standard prior knowledge for this year group and topic"}
Teaching Approach: ${values.teachingStyle || "Mixed / Blended"}
${values.objectives ? `Learning Objectives: ${values.objectives}` : ""}
${values.resources ? `Available Resources: ${values.resources}` : ""}
${values.examBoard ? `Exam Board: ${values.examBoard}` : ""}

Return a lesson plan as JSON with this exact structure:
{
  "overview": "Brief 2-sentence overview of the lesson",
  "objectives": ["Must: ...", "Should: ...", "Could: ..."],
  "successCriteria": ["I can...", "I can...", "I can..."],
  "vocab": [{"term": "word", "definition": "meaning"}, ...],
  "phases": [
    {"name": "Starter / Hook", "mins": <number, minimum 5>, "teacherSteps": ["step1", "step2"], "pupilSteps": ["step1"], "differentiation": "how to adapt"},
    {"name": "Main Teaching", "mins": <number>, "teacherSteps": [...], "pupilSteps": [...], "differentiation": "..."},
    {"name": "Guided Practice", "mins": <number>, "teacherSteps": [...], "pupilSteps": [...], "differentiation": "..."},
    {"name": "Independent Practice", "mins": <number>, "teacherSteps": [...], "pupilSteps": [...], "differentiation": "..."},
    {"name": "Plenary", "mins": <number, minimum 5>, "teacherSteps": [...], "pupilSteps": [...], "differentiation": "..."}
  ],
  "sendAdaptations": "Detailed SEND adaptations paragraph",
  "afL": "Assessment for Learning strategies",
  "homework": "Homework task description or 'None set'"
}

Provide 4-6 vocabulary terms. Each phase should have 3-5 teacher steps and 2-4 pupil steps. Be extremely specific and practical - a supply teacher should be able to deliver this lesson from this plan alone.`;

    try {
      const { text } = await callAI(systemPrompt, userPrompt, 4000);
      const parsed = parseWithFixes(text) as LessonPlanData;

      // Phase-time sanity clamping
      if (parsed.phases && parsed.phases.length > 0) {
        const starter = parsed.phases[0];
        if (starter.mins < 5) starter.mins = 5;
        const plenary = parsed.phases[parsed.phases.length - 1];
        if (plenary.name.toLowerCase().includes("plenary") && plenary.mins < 5) plenary.mins = 5;
      }

      setPlan(parsed);
      toast.success("Lesson plan generated!");
    } catch (err) {
      toast.error("Failed to generate lesson plan. Please try again.");
      console.error("LessonPlanner generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Per-Section Regenerate ──────────────────────────────────────────────────

  const handleRegenerate = async (sectionKey: string, phaseIndex?: number) => {
    if (!plan) return;

    const regenerateKey = phaseIndex !== undefined ? `phases[${phaseIndex}]` : sectionKey;
    setRegeneratingSection(regenerateKey);

    const sectionName = phaseIndex !== undefined
      ? `phases[${phaseIndex}] (${plan.phases[phaseIndex].name})`
      : sectionKey;

    const systemPrompt = `You are an expert UK teacher. Regenerate ONLY the specified section of a lesson plan. Return valid JSON for just that section - no markdown, no extra text.`;

    const userPrompt = `Lesson context: Subject=${values.subject}, Topic=${values.topic}, Year=${values.yearGroup}, Duration=${values.duration || "60 minutes"}.
Current plan: ${JSON.stringify(plan)}
Regenerate the section: ${sectionName}. Return ONLY the JSON value for that section.`;

    try {
      const { text } = await callAI(systemPrompt, userPrompt, 2000);
      const parsed = parseWithFixes(text);

      setPlan(prev => {
        if (!prev) return prev;
        const updated = { ...prev };

        if (phaseIndex !== undefined) {
          const newPhases = [...updated.phases];
          newPhases[phaseIndex] = parsed as LessonPlanPhase;
          // Enforce min times after regeneration
          if (phaseIndex === 0 && newPhases[0].mins < 5) newPhases[0].mins = 5;
          if (phaseIndex === newPhases.length - 1 && newPhases[phaseIndex].name.toLowerCase().includes("plenary") && newPhases[phaseIndex].mins < 5) {
            newPhases[phaseIndex].mins = 5;
          }
          updated.phases = newPhases;
        } else {
          (updated as any)[sectionKey] = parsed;
        }

        return updated;
      });
      toast.success(`Regenerated: ${SECTION_TITLES[sectionKey] || sectionName}`);
    } catch (err) {
      toast.error("Failed to regenerate section. Please try again.");
      console.error("Regenerate error:", err);
    } finally {
      setRegeneratingSection(null);
    }
  };

  // ── Export Helpers ──────────────────────────────────────────────────────────

  const buildExportText = (): string => {
    if (!plan) return "";
    let text = `LESSON PLAN: ${values.subject} - ${values.topic} (${values.yearGroup})\n\n`;
    text += `OVERVIEW\n${plan.overview}\n\n`;
    text += `LEARNING OBJECTIVES\n${plan.objectives.map(o => `- ${o}`).join("\n")}\n\n`;
    text += `SUCCESS CRITERIA\n${plan.successCriteria.map(s => `- ${s}`).join("\n")}\n\n`;
    text += `KEY VOCABULARY\n${plan.vocab.map(v => `${v.term}: ${v.definition}`).join("\n")}\n\n`;
    text += `LESSON PHASES\n`;
    for (const phase of plan.phases) {
      text += `\n${phase.name} (${phase.mins} minutes)\n`;
      text += `Teacher Steps:\n${phase.teacherSteps.map(s => `  - ${s}`).join("\n")}\n`;
      text += `Pupil Steps:\n${phase.pupilSteps.map(s => `  - ${s}`).join("\n")}\n`;
      text += `Differentiation: ${phase.differentiation}\n`;
    }
    text += `\nSEND ADAPTATIONS\n${plan.sendAdaptations}\n\n`;
    text += `ASSESSMENT FOR LEARNING\n${plan.afL}\n\n`;
    text += `HOMEWORK\n${plan.homework}\n`;
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildExportText());
      toast.success("Copied to clipboard");
    } catch { toast.error("Failed to copy"); }
  };

  const handlePrint = () => {
    if (!outputRef.current) return;
    printWorksheetElement(outputRef.current);
  };

  const handlePdf = async () => {
    if (!outputRef.current) return;
    try {
      await downloadHtmlAsPdf(outputRef.current, `Lesson_Plan_${values.subject}_${values.topic}_${values.yearGroup}`.replace(/[^a-zA-Z0-9_-]/g, "_"));
      toast.success("PDF downloaded");
    } catch { toast.error("PDF generation failed"); }
  };

  const handleDocx = async () => {
    try {
      await exportToDocx({
        title: `Lesson Plan: ${values.subject} - ${values.topic} (${values.yearGroup})`,
        content: buildExportText(),
        schoolName: preferences.schoolName,
      });
      toast.success("Word document downloaded");
    } catch { toast.error("Word export failed"); }
  };

  // ── Render: Section Card ────────────────────────────────────────────────────

  const SectionCard = ({ sectionKey, title, children, phaseIndex }: {
    sectionKey: string;
    title: string;
    children: React.ReactNode;
    phaseIndex?: number;
  }) => {
    const colours = SECTION_COLOURS[sectionKey] || SECTION_COLOURS.overview;
    const regenerateKey = phaseIndex !== undefined ? `phases[${phaseIndex}]` : sectionKey;
    const isRegenerating = regeneratingSection === regenerateKey;

    return (
      <Card className={`${colours.border} border overflow-hidden`}>
        <div className={`${colours.bg} px-4 py-2 flex items-center justify-between border-b ${colours.border}`}>
          <h3 className={`font-semibold ${colours.text}`}>{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 ${colours.text} hover:${colours.bg}`}
            onClick={() => handleRegenerate(sectionKey, phaseIndex)}
            disabled={isRegenerating || regeneratingSection !== null}
          >
            {isRegenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <CardContent className="p-4">
          {isRegenerating ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Regenerating...
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    );
  };

  // ── Render: Form ────────────────────────────────────────────────────────────

  if (!plan && !loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Lesson Plan Generator</h1>
            <p className="text-muted-foreground">Generate detailed, SEND-inclusive, curriculum-aligned lesson plans ready to teach</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Select value={values.subject || ""} onValueChange={v => set("subject", v)}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{subjects.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Year Group *</Label>
                <Select value={values.yearGroup || ""} onValueChange={v => set("yearGroup", v)}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>{years.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Topic / Learning Focus *</Label>
              <Input
                value={values.topic || ""}
                onChange={e => set("topic", e.target.value)}
                placeholder="e.g. Fractions, The Water Cycle, WW2 Causes"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Lesson Duration</Label>
                <Select value={values.duration || ""} onValueChange={v => set("duration", v)}>
                  <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                  <SelectContent>{durations.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Class Size</Label>
                <Input
                  value={values.classSize || ""}
                  onChange={e => set("classSize", e.target.value)}
                  placeholder="e.g. 28 pupils"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>SEND / Additional Needs</Label>
              <Input
                value={values.sendNeeds || ""}
                onChange={e => set("sendNeeds", e.target.value)}
                placeholder="e.g. 3 pupils with dyslexia, 2 with ADHD, 1 EAL"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Prior Learning / Starting Point</Label>
              <Textarea
                value={values.priorLearning || ""}
                onChange={e => set("priorLearning", e.target.value)}
                placeholder="What do pupils already know? What misconceptions might they have?"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Learning Objectives (optional - leave blank for AI to generate)</Label>
              <Textarea
                value={values.objectives || ""}
                onChange={e => set("objectives", e.target.value)}
                placeholder="e.g. Students will be able to explain the causes of WW2"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Available Resources</Label>
              <Input
                value={values.resources || ""}
                onChange={e => set("resources", e.target.value)}
                placeholder="e.g. iPads, mini whiteboards, manipulatives, textbooks"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Exam Board (if applicable)</Label>
                <Input
                  value={values.examBoard || ""}
                  onChange={e => set("examBoard", e.target.value)}
                  placeholder="e.g. AQA, Edexcel, OCR, WJEC"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Teaching Approach</Label>
                <Select value={values.teachingStyle || ""} onValueChange={v => set("teachingStyle", v)}>
                  <SelectTrigger><SelectValue placeholder="Select approach" /></SelectTrigger>
                  <SelectContent>{teachingStyles.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleGenerate} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Lesson Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: Loading ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-lg font-medium text-muted-foreground">Generating your lesson plan...</p>
        <p className="text-sm text-muted-foreground">This may take 15-30 seconds</p>
      </div>
    );
  }

  // ── Render: Plan Output ─────────────────────────────────────────────────────

  if (!plan) return null;

  const totalMins = plan.phases.reduce((sum, p) => sum + p.mins, 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPlan(null)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold">
            {values.subject} - {values.topic} ({values.yearGroup})
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5 mr-1" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5 mr-1" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handlePdf}>
            <Download className="h-3.5 w-3.5 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleDocx}>
            <FileDown className="h-3.5 w-3.5 mr-1" /> Word
          </Button>
        </div>
      </div>

      {/* Duration summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Total: {totalMins} minutes across {plan.phases.length} phases</span>
      </div>

      {/* Output container for PDF/print */}
      <div ref={outputRef} className="space-y-4">
        {/* Overview */}
        <SectionCard sectionKey="overview" title="Lesson Overview">
          <p className="text-sm leading-relaxed">{plan.overview}</p>
        </SectionCard>

        {/* Objectives */}
        <SectionCard sectionKey="objectives" title="Learning Objectives">
          <ul className="space-y-1">
            {plan.objectives.map((obj, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="font-medium text-green-600 mt-0.5">&#8226;</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Success Criteria */}
        <SectionCard sectionKey="successCriteria" title="Success Criteria">
          <ul className="space-y-1">
            {plan.successCriteria.map((sc, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">&#10003;</span>
                <span>{sc}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Vocabulary */}
        <SectionCard sectionKey="vocab" title="Key Vocabulary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plan.vocab.map((v, i) => (
              <div key={i} className="bg-purple-25 border border-purple-100 rounded p-2">
                <span className="font-semibold text-sm text-purple-800">{v.term}</span>
                <span className="text-sm text-muted-foreground ml-1">- {v.definition}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Phases */}
        {plan.phases.map((phase, idx) => (
          <SectionCard key={idx} sectionKey="phases" title={`${phase.name} (${phase.mins} min)`} phaseIndex={idx}>
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold uppercase text-indigo-600 mb-1">Teacher Steps</h4>
                <ol className="space-y-1 list-decimal list-inside">
                  {phase.teacherSteps.map((step, si) => (
                    <li key={si} className="text-sm">{step}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-indigo-600 mb-1">Pupil Steps</h4>
                <ol className="space-y-1 list-decimal list-inside">
                  {phase.pupilSteps.map((step, si) => (
                    <li key={si} className="text-sm">{step}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase text-indigo-600 mb-1">Differentiation</h4>
                <p className="text-sm text-muted-foreground">{phase.differentiation}</p>
              </div>
            </div>
          </SectionCard>
        ))}

        {/* SEND Adaptations */}
        <SectionCard sectionKey="sendAdaptations" title="SEND Adaptations">
          <p className="text-sm leading-relaxed">{plan.sendAdaptations}</p>
        </SectionCard>

        {/* AfL */}
        <SectionCard sectionKey="afL" title="Assessment for Learning">
          <p className="text-sm leading-relaxed">{plan.afL}</p>
        </SectionCard>

        {/* Homework */}
        <SectionCard sectionKey="homework" title="Homework / Follow-Up">
          <p className="text-sm leading-relaxed">{plan.homework}</p>
        </SectionCard>
      </div>
    </div>
  );
}
