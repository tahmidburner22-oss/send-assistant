/**
 * SendScreenerResultsView
 * Renders the full rich SEND screener report from stored assignment content.
 * Supports both the new JSON format and the legacy plain-text format.
 */
import { useState } from "react";
import {
  AlertTriangle, CheckCircle2, Info, BookOpen, Brain, Eye, Activity,
  Calculator, MessageSquare, Heart, Lightbulb, ArrowRight, ExternalLink,
  ChevronRight
} from "lucide-react";

// ─── Section metadata (mirrors SendScreener.tsx SECTIONS) ────────────────────
const SECTION_META: Record<string, {
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  evidenceSource: string;
  moderateThreshold: number;
  highThreshold: number;
}> = {
  dyslexia: {
    title: "Reading & Writing",
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    accentColor: "bg-purple-600",
    evidenceSource: "BDA Adult Dyslexia Checklist · Phonological Awareness Battery",
    moderateThreshold: 35,
    highThreshold: 60,
  },
  adhd: {
    title: "Attention & Focus",
    icon: <Brain className="w-5 h-5" />,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    accentColor: "bg-orange-600",
    evidenceSource: "WHO ASRS-v1.1 · DSM-5 ADHD Criteria",
    moderateThreshold: 35,
    highThreshold: 60,
  },
  asc: {
    title: "Social & Sensory",
    icon: <Eye className="w-5 h-5" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    accentColor: "bg-blue-600",
    evidenceSource: "AQ-10 (Baron-Cohen et al., 2012 / NICE CG142)",
    moderateThreshold: 30,
    highThreshold: 55,
  },
  dyspraxia: {
    title: "Coordination & Movement",
    icon: <Activity className="w-5 h-5" />,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    accentColor: "bg-green-600",
    evidenceSource: "MABC-2 Checklist (Henderson & Sugden) · DCD Indicators",
    moderateThreshold: 30,
    highThreshold: 55,
  },
  dyscalculia: {
    title: "Numbers & Maths",
    icon: <Calculator className="w-5 h-5" />,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    accentColor: "bg-red-600",
    evidenceSource: "Butterworth Dyscalculia Screener (2003) · Numerical Cognition Lab",
    moderateThreshold: 35,
    highThreshold: 60,
  },
  slcn: {
    title: "Speech & Communication",
    icon: <MessageSquare className="w-5 h-5" />,
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    accentColor: "bg-teal-600",
    evidenceSource: "CELF-5 Clinical Indicators · RCSLT SLCN Framework",
    moderateThreshold: 30,
    highThreshold: 55,
  },
  anxiety: {
    title: "Anxiety & Wellbeing",
    icon: <Heart className="w-5 h-5" />,
    color: "text-pink-700",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    accentColor: "bg-pink-600",
    evidenceSource: "GAD-7 (Spitzer et al., 2006) · PHQ-A (Adolescent Depression)",
    moderateThreshold: 35,
    highThreshold: 60,
  },
  mld: {
    title: "Learning & Processing",
    icon: <Lightbulb className="w-5 h-5" />,
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    accentColor: "bg-yellow-600",
    evidenceSource: "SEND Code of Practice (DfE, 2015) · British Ability Scales",
    moderateThreshold: 30,
    highThreshold: 55,
  },
};

// ─── Verdict content (mirrors SendScreener.tsx VERDICT_CONTENT) ──────────────
const VERDICT_CONTENT: Record<string, {
  low: { headline: string; explanation: string };
  moderate: { headline: string; explanation: string };
  high: { headline: string; explanation: string };
  whatItMeans: string;
  nextSteps: string[];
  professionalRoute: string;
}> = {
  dyslexia: {
    whatItMeans: "Dyslexia is a specific learning difficulty that primarily affects reading, writing, and spelling. It is neurological in origin and is not related to intelligence. The BDA estimates that around 10% of the UK population has dyslexia.",
    nextSteps: ["Speak to the school SENCo or a literacy specialist", "Request a formal assessment from an Educational Psychologist", "Explore assistive technology (text-to-speech, spell-checkers)", "Look into coloured overlays and specialist fonts (e.g. OpenDyslexic)"],
    professionalRoute: "Educational Psychologist or specialist dyslexia assessor (AMBDA/APC qualified)",
    low: { headline: "Few indicators of Dyslexia", explanation: "Your responses suggest that the reading, writing, and phonological processing difficulties most associated with dyslexia are not significantly present." },
    moderate: { headline: "Some indicators of Dyslexia", explanation: "Your responses suggest you experience several traits associated with dyslexia. These are worth exploring further — particularly if they are affecting daily life or academic progress." },
    high: { headline: "Strong indicators of Dyslexia", explanation: "Your responses show a significant pattern of traits strongly associated with dyslexia, including difficulties with phonological processing, reading fluency, spelling, and written expression." },
  },
  adhd: {
    whatItMeans: "ADHD (Attention Deficit Hyperactivity Disorder) is a neurodevelopmental condition affecting attention, impulse control, and activity levels. It affects around 5% of children and 3–4% of adults in the UK.",
    nextSteps: ["Speak to your GP for a referral to a psychiatrist or paediatrician", "Contact your school SENCo if this is for a pupil", "Explore structured routines, task-chunking, and environmental adjustments", "Look into ADHD coaching and support organisations (e.g. ADHD UK, CHADD)"],
    professionalRoute: "GP referral to psychiatrist or paediatrician (NICE CG87/NG87)",
    low: { headline: "Few indicators of ADHD", explanation: "Your responses suggest that attention, impulsivity, and hyperactivity difficulties associated with ADHD are not significantly present." },
    moderate: { headline: "Some indicators of ADHD", explanation: "Your responses suggest you experience several traits associated with ADHD — particularly around sustained attention, organisation, and task completion." },
    high: { headline: "Strong indicators of ADHD", explanation: "Your responses show a significant pattern of traits strongly associated with ADHD. The questions are drawn from the WHO ASRS-v1.1, aligned to DSM-5 ADHD diagnostic criteria." },
  },
  asc: {
    whatItMeans: "Autism Spectrum Condition (ASC/ASD) is a lifelong neurodevelopmental condition affecting social communication, sensory processing, and flexibility of thought. Around 1 in 100 people in the UK are autistic.",
    nextSteps: ["Speak to your GP for a referral to an autism diagnostic service", "Contact the school SENCo if this is for a pupil", "Explore the National Autistic Society (NAS) resources", "Look into sensory accommodations and social communication support"],
    professionalRoute: "GP referral to autism diagnostic service (NICE CG142/NG142)",
    low: { headline: "Few indicators of Autism Spectrum Condition", explanation: "Your responses suggest that social, sensory, and communication traits associated with ASC are not significantly present." },
    moderate: { headline: "Some indicators of Autism Spectrum Condition", explanation: "Your responses suggest you experience several traits associated with ASC — such as sensory sensitivities, preference for routine, or difficulties with social communication." },
    high: { headline: "Strong indicators of Autism Spectrum Condition", explanation: "Your responses show a significant pattern of traits strongly associated with ASC. The questions are based on the AQ-10, recommended by NICE (CG142) as a first-stage screening tool." },
  },
  dyspraxia: {
    whatItMeans: "Dyspraxia, also known as Developmental Coordination Disorder (DCD), is a neurodevelopmental condition affecting motor coordination and planning. It affects around 5–6% of school-age children.",
    nextSteps: ["Speak to your GP for an occupational therapy referral", "Contact the school SENCo if this is for a pupil", "Explore typing as an alternative to handwriting", "Look into the Dyspraxia Foundation for support and resources"],
    professionalRoute: "GP referral to Occupational Therapist (OT) or paediatrician",
    low: { headline: "Few indicators of Dyspraxia (DCD)", explanation: "Your responses suggest that motor coordination and organisational difficulties associated with dyspraxia are not significantly present." },
    moderate: { headline: "Some indicators of Dyspraxia (DCD)", explanation: "Your responses suggest you experience several traits associated with dyspraxia — such as difficulties with coordination, handwriting, or sequencing tasks." },
    high: { headline: "Strong indicators of Dyspraxia (DCD)", explanation: "Your responses show a significant pattern of traits strongly associated with Developmental Coordination Disorder, based on MABC-2 Checklist indicators." },
  },
  dyscalculia: {
    whatItMeans: "Dyscalculia is a specific learning difficulty affecting the ability to acquire arithmetical skills. It reflects a fundamental difficulty processing numerical information and affects around 5–7% of the population.",
    nextSteps: ["Speak to the school SENCo or a specialist maths teacher", "Request a formal assessment from an Educational Psychologist", "Explore concrete manipulatives, number lines, and structured numeracy programmes", "Look into the Dyscalculia Network for resources"],
    professionalRoute: "Educational Psychologist or specialist dyscalculia assessor",
    low: { headline: "Few indicators of Dyscalculia", explanation: "Your responses suggest that numerical and mathematical difficulties associated with dyscalculia are not significantly present." },
    moderate: { headline: "Some indicators of Dyscalculia", explanation: "Your responses suggest you experience several traits associated with dyscalculia — such as difficulties remembering number facts, understanding place value, or handling money." },
    high: { headline: "Strong indicators of Dyscalculia", explanation: "Your responses show a significant pattern of traits strongly associated with dyscalculia, based on Butterworth's Dyscalculia Screener (2003)." },
  },
  slcn: {
    whatItMeans: "Speech, Language and Communication Needs (SLCN) is an umbrella term for a range of difficulties with understanding and/or using spoken language. Around 10% of children in the UK have some form of SLCN.",
    nextSteps: ["Request a referral to a Speech and Language Therapist (SALT)", "Contact the school SENCo if this is for a pupil", "Explore visual supports and pre-teaching vocabulary strategies", "Look into ICAN (children's communication charity) resources"],
    professionalRoute: "Speech and Language Therapist (SALT) — via GP or school referral",
    low: { headline: "Few indicators of SLCN", explanation: "Your responses suggest that speech, language, and communication difficulties are not significantly present." },
    moderate: { headline: "Some indicators of SLCN", explanation: "Your responses suggest you experience several traits associated with Speech, Language & Communication Needs — such as word-finding difficulties or trouble following complex instructions." },
    high: { headline: "Strong indicators of SLCN", explanation: "Your responses show a significant pattern of traits strongly associated with Speech, Language & Communication Needs, based on CELF-5 clinical indicators and the RCSLT SLCN framework." },
  },
  anxiety: {
    whatItMeans: "Anxiety is the most common mental health difficulty in children and young people. The GAD-7 is a validated, widely-used screening tool recommended by NICE. Anxiety is highly treatable — early identification and support make a significant difference.",
    nextSteps: ["Speak to a GP, school counsellor, or mental health professional", "Contact the school SENCo or pastoral team if this is for a pupil", "Explore evidence-based approaches such as CBT and mindfulness", "Look into Young Minds, Mind, or Kooth for support resources"],
    professionalRoute: "GP, CAMHS (Child and Adolescent Mental Health Services), or school counsellor",
    low: { headline: "Few indicators of significant Anxiety", explanation: "Your responses suggest that anxiety and emotional wellbeing difficulties are not significantly impacting you at this time." },
    moderate: { headline: "Some indicators of Anxiety", explanation: "Your responses suggest you experience several traits associated with anxiety — such as persistent worry, physical symptoms, or avoidance." },
    high: { headline: "Strong indicators of Anxiety / Mental Health needs", explanation: "Your responses show a significant pattern of traits associated with anxiety, based on the GAD-7 (Spitzer et al., 2006), recommended by NICE (CG113)." },
  },
  mld: {
    whatItMeans: "Moderate Learning Difficulties (MLD) refers to significantly below-average intellectual functioning alongside difficulties with adaptive behaviour. The SEND Code of Practice (DfE, 2015) recognises MLD as one of the four broad areas of SEND need.",
    nextSteps: ["Speak to the school SENCo about a formal SEND assessment", "Request an Educational Psychology assessment", "Explore scaffolded tasks, visual supports, and additional processing time", "Consider whether an Education, Health and Care Plan (EHCP) is appropriate"],
    professionalRoute: "Educational Psychologist via school SENCo referral",
    low: { headline: "Few indicators of MLD", explanation: "Your responses suggest that learning and processing difficulties associated with MLD are not significantly present." },
    moderate: { headline: "Some indicators of MLD", explanation: "Your responses suggest you experience several traits associated with learning and processing difficulties — such as needing more time, difficulty with abstract concepts, or challenges with independent working." },
    high: { headline: "Strong indicators of MLD", explanation: "Your responses show a significant pattern of traits associated with Moderate Learning Difficulties, based on SEND Code of Practice indicators and British Ability Scales criteria." },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SectionResult {
  id: string;
  pct: number;
  level: "low" | "moderate" | "high";
}

export interface ParsedScreenerData {
  mode: string;
  date: string;
  results: SectionResult[];
}

// ─── Parser ───────────────────────────────────────────────────────────────────
/**
 * Parse the stored assignment content string into structured data.
 * Supports both the new JSON-embedded format and the legacy plain-text format.
 */
export function parseScreenerContent(content: string): ParsedScreenerData | null {
  if (!content) return null;

  // Try new JSON format first: look for a JSON block embedded in the content
  const jsonMatch = content.match(/---JSON_DATA---\n([\s\S]+?)\n---END_JSON---/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]) as ParsedScreenerData;
    } catch {
      // fall through to legacy parser
    }
  }

  // Legacy plain-text format parser
  // Format: "Reading & Writing: LOW (9%)"
  const lines = content.split("\n");
  const results: SectionResult[] = [];

  // Map display titles back to section IDs
  const titleToId: Record<string, string> = {
    "Reading & Writing": "dyslexia",
    "Attention & Focus": "adhd",
    "Social & Sensory": "asc",
    "Coordination & Movement": "dyspraxia",
    "Numbers & Maths": "dyscalculia",
    "Speech & Communication": "slcn",
    "Anxiety & Wellbeing": "anxiety",
    "Learning & Processing": "mld",
  };

  for (const line of lines) {
    // Match patterns like "Reading & Writing: LOW (9%)" or "Reading & Writing: HIGH (75%)"
    const match = line.match(/^(.+?):\s*(LOW|MODERATE|HIGH)\s*\((\d+)%\)/i);
    if (match) {
      const title = match[1].trim();
      const level = match[2].toLowerCase() as "low" | "moderate" | "high";
      const pct = parseInt(match[3], 10);
      const id = titleToId[title];
      if (id) {
        results.push({ id, pct, level });
      }
    }
  }

  if (results.length === 0) return null;

  // Extract mode and date from header lines
  const modeLine = lines.find(l => l.includes("Quick Screener") || l.includes("Full Screener")) || "";
  const mode = modeLine.includes("Quick") ? "Quick" : "Full";
  const dateLine = lines.find(l => l.startsWith("Date:")) || "";
  const date = dateLine.replace("Date:", "").trim();

  return { mode, date, results };
}

// ─── Individual result card ───────────────────────────────────────────────────
function ResultCard({ result }: { result: SectionResult }) {
  const [expanded, setExpanded] = useState(true);
  const meta = SECTION_META[result.id];
  const verdict = VERDICT_CONTENT[result.id];
  if (!meta || !verdict) return null;

  const levelVerdict = verdict[result.level];

  return (
    <div className={`rounded-2xl border-2 overflow-hidden ${meta.borderColor}`}>
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className={`w-full flex items-center justify-between p-4 ${meta.bgColor} text-left`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.accentColor} text-white`}>
            {meta.icon}
          </div>
          <div>
            <p className={`font-bold text-sm ${meta.color}`}>{levelVerdict.headline}</p>
            <p className="text-xs text-gray-500">{meta.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            result.level === "high" ? "bg-red-100 text-red-700" :
            result.level === "moderate" ? "bg-amber-100 text-amber-700" :
            "bg-green-100 text-green-700"
          }`}>{result.pct}%</span>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>

      {/* Card body */}
      {expanded && (
        <div className="bg-white p-5 space-y-4">
          {/* Evidence source */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <BookOpen className="w-3.5 h-3.5" />
            Based on: {meta.evidenceSource}
          </div>

          {/* What it means */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">What this means</p>
            <p className="text-sm text-gray-600 leading-relaxed">{levelVerdict.explanation}</p>
          </div>

          {/* About this area */}
          {verdict.whatItMeans && (
            <div className={`rounded-xl p-4 ${meta.bgColor} border ${meta.borderColor}`}>
              <p className={`text-xs font-bold mb-1 uppercase tracking-wide ${meta.color}`}>
                About {meta.title}
              </p>
              <p className={`text-xs leading-relaxed ${meta.color}`}>{verdict.whatItMeans}</p>
            </div>
          )}

          {/* Next steps */}
          {verdict.nextSteps && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Recommended next steps</p>
              <ul className="space-y-1.5">
                {verdict.nextSteps.map(step => (
                  <li key={step} className="flex items-start gap-2 text-xs text-gray-600">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Professional route */}
          {verdict.professionalRoute && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700">
                <strong>Who to see:</strong> {verdict.professionalRoute}
              </p>
            </div>
          )}

          {/* Reminder */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700">
              <strong>Remember:</strong> This result is a screening indicator, not a diagnosis. A high score means
              these traits are present and worth exploring — it does not confirm any condition.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  content: string;
  title?: string;
}

export function SendScreenerResultsView({ content, title }: Props) {
  const data = parseScreenerContent(content);

  if (!data) {
    // Fallback: show raw text
    return (
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
        <p className="text-xs font-medium text-gray-500 mb-2">SEND Screener Results:</p>
        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{content}</pre>
      </div>
    );
  }

  const highResults = data.results.filter(r => r.level === "high");
  const moderateResults = data.results.filter(r => r.level === "moderate");
  const lowResults = data.results.filter(r => r.level === "low");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 mb-3">
          <CheckCircle2 className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {title || "SEND Screener Results"}
        </h2>
        <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
          {data.date && <p className="text-xs text-gray-500">Completed: {data.date}</p>}
          {data.mode && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              data.mode === "Quick" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
            }`}>
              {data.mode} Screener
            </span>
          )}
        </div>
      </div>

      {/* Non-diagnosis disclaimer */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 mb-1 text-sm">Important: This is NOT a diagnosis</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              These results are <strong>screening indicators only</strong>. They show which areas have traits worth
              exploring further — they do <strong>not</strong> confirm or rule out any condition. Only a qualified
              professional can provide a formal diagnosis.
            </p>
          </div>
        </div>
      </div>

      {/* Overview bar chart */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">Overview — All 8 Areas</h3>
        <div className="space-y-3">
          {data.results.map(r => {
            const meta = SECTION_META[r.id];
            if (!meta) return null;
            return (
              <div key={r.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={meta.color}>{meta.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{meta.title}</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    r.level === "high" ? "bg-red-100 text-red-700" :
                    r.level === "moderate" ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {r.level === "high" ? "High" : r.level === "moderate" ? "Moderate" : "Low"} · {r.pct}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      r.level === "high" ? "bg-red-400" : r.level === "moderate" ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* High results — detailed cards */}
      {highResults.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
            Areas with Strong Indicators
          </h3>
          <div className="space-y-4">
            {highResults.map(r => <ResultCard key={r.id} result={r} />)}
          </div>
        </div>
      )}

      {/* Moderate results */}
      {moderateResults.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            Areas with Some Indicators
          </h3>
          <div className="space-y-4">
            {moderateResults.map(r => <ResultCard key={r.id} result={r} />)}
          </div>
        </div>
      )}

      {/* All low */}
      {highResults.length === 0 && moderateResults.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
          <h3 className="font-bold text-emerald-800 mb-1">No significant indicators found</h3>
          <p className="text-sm text-emerald-700">
            Responses suggest low likelihood of the SEND needs covered in this screener.
            If there are concerns, please speak to a SENCo or GP.
          </p>
        </div>
      )}

      {/* Low results — collapsible */}
      {lowResults.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1.5 list-none select-none">
            <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
            Low-likelihood areas ({lowResults.length})
          </summary>
          <div className="space-y-2 mt-3">
            {lowResults.map(r => {
              const meta = SECTION_META[r.id];
              if (!meta) return null;
              return (
                <div key={r.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={meta.color}>{meta.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{meta.title}</span>
                  </div>
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">{r.pct}% — Low</span>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* Legal disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Disclaimer:</strong> This screener is for informational and educational purposes only. It does not
            constitute a medical, psychological, or educational diagnosis. Results are based entirely on self-reported
            responses and should be interpreted with caution. Only a qualified professional — such as an Educational
            Psychologist, GP, Psychiatrist, Paediatrician, or specialist assessor — can provide a formal diagnosis.
            If you are concerned about a child, please speak to their school's SENCo in the first instance.
          </p>
        </div>
      </div>
    </div>
  );
}
