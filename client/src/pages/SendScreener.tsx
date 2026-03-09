import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, RotateCcw, AlertCircle, CheckCircle2, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  text: string;
}

interface Section {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  sendNeedId: string;
  questions: Question[];
}

// ─── Questionnaire Data ───────────────────────────────────────────────────────
const SECTIONS: Section[] = [
  {
    id: "dyslexia",
    title: "Reading & Writing",
    subtitle: "Indicators associated with Dyslexia",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    sendNeedId: "dyslexia",
    questions: [
      { id: "d1", text: "Do you find yourself re-reading sentences because the meaning doesn't sink in?" },
      { id: "d2", text: "Do letters or words sometimes appear to move, blur, or jumble on the page?" },
      { id: "d3", text: "Do you struggle to spot spelling mistakes in your own writing?" },
      { id: "d4", text: "Do you find it hard to copy text accurately from a board or book?" },
      { id: "d5", text: "Do you mix up similar-looking letters (e.g. b/d, p/q) when reading or writing?" },
      { id: "d6", text: "Do you find it difficult to remember a sequence of verbal instructions?" },
      { id: "d7", text: "Do you mix up left and right, or find map reading confusing?" },
      { id: "d8", text: "Do you read significantly more slowly than others your age?" },
      { id: "d9", text: "Do you have difficulty sounding out unfamiliar words when reading aloud?" },
      { id: "d10", text: "Do you find it hard to express your ideas in writing, even when you can explain them verbally?" },
    ],
  },
  {
    id: "adhd",
    title: "Attention & Focus",
    subtitle: "Indicators associated with ADHD",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    sendNeedId: "adhd",
    questions: [
      { id: "a1", text: "Do you find it very difficult to concentrate on tasks you find boring or repetitive?" },
      { id: "a2", text: "Do you often misplace everyday items such as keys, phone, or schoolwork?" },
      { id: "a3", text: "Do you feel physically restless or find it hard to sit still for long periods?" },
      { id: "a4", text: "Do you often interrupt others or blurt out answers before a question is finished?" },
      { id: "a5", text: "Do you struggle to organise tasks, manage your time, or meet deadlines?" },
      { id: "a6", text: "Do you frequently shift from one unfinished activity to another?" },
      { id: "a7", text: "Do you find it hard to wait your turn in conversations or queues?" },
      { id: "a8", text: "Do you often forget to complete daily tasks or routines, even familiar ones?" },
      { id: "a9", text: "Do you find your mind wandering during lessons, meetings, or conversations?" },
      { id: "a10", text: "Do you sometimes act impulsively without thinking through the consequences?" },
    ],
  },
  {
    id: "asc",
    title: "Social & Sensory",
    subtitle: "Indicators associated with Autism Spectrum Condition (ASC)",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    sendNeedId: "asc",
    questions: [
      { id: "s1", text: "Do you find social situations exhausting, confusing, or overwhelming?" },
      { id: "s2", text: "Are you highly sensitive to loud noises, bright lights, strong smells, or certain textures?" },
      { id: "s3", text: "Do you strongly prefer strict routines and feel very anxious when plans change unexpectedly?" },
      { id: "s4", text: "Do you have one or more very intense, highly focused interests or hobbies?" },
      { id: "s5", text: "Do you sometimes struggle to understand sarcasm, jokes, or figures of speech?" },
      { id: "s6", text: "Do you find it difficult to read facial expressions or body language?" },
      { id: "s7", text: "Do you prefer to be alone rather than in groups, even with people you know?" },
      { id: "s8", text: "Do you find it hard to understand unwritten social rules (e.g. how close to stand, when to speak)?" },
      { id: "s9", text: "Do you repeat certain movements, sounds, or phrases when anxious or excited (stimming)?" },
      { id: "s10", text: "Do you find it difficult to cope with unexpected changes to your environment or schedule?" },
    ],
  },
  {
    id: "dyspraxia",
    title: "Coordination & Movement",
    subtitle: "Indicators associated with Dyspraxia (DCD)",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    sendNeedId: "dyspraxia",
    questions: [
      { id: "dp1", text: "Do you often bump into things, trip over, or drop objects more than others?" },
      { id: "dp2", text: "Do you struggle with fine motor tasks such as handwriting, using scissors, or fastening buttons?" },
      { id: "dp3", text: "Do you find it difficult to learn new physical skills or sports?" },
      { id: "dp4", text: "Do you have difficulty organising your thoughts into a clear, logical sequence?" },
      { id: "dp5", text: "Do you find tasks that require hand-eye coordination (e.g. catching a ball) particularly hard?" },
      { id: "dp6", text: "Do you struggle with spatial awareness — judging distances or fitting objects into spaces?" },
      { id: "dp7", text: "Do you find it hard to carry out multi-step instructions in the correct order?" },
      { id: "dp8", text: "Is your handwriting often described as untidy, inconsistent, or difficult to read?" },
    ],
  },
  {
    id: "dyscalculia",
    title: "Numbers & Maths",
    subtitle: "Indicators associated with Dyscalculia",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    sendNeedId: "dyscalculia",
    questions: [
      { id: "dc1", text: "Do you find it very difficult to remember basic number facts (e.g. times tables)?" },
      { id: "dc2", text: "Do you struggle to understand the concept of place value (units, tens, hundreds)?" },
      { id: "dc3", text: "Do you find it hard to tell the time on an analogue clock?" },
      { id: "dc4", text: "Do you struggle to handle money, give change, or estimate costs?" },
      { id: "dc5", text: "Do you find it difficult to judge distances, sizes, or amounts visually?" },
      { id: "dc6", text: "Do you often confuse similar-looking mathematical symbols (e.g. + and ×, < and >)?" },
      { id: "dc7", text: "Do you find it hard to follow sequences of numbers or remember phone numbers?" },
      { id: "dc8", text: "Do you feel unusually high anxiety when faced with maths tasks, even simple ones?" },
    ],
  },
  {
    id: "slcn",
    title: "Speech & Communication",
    subtitle: "Indicators associated with Speech, Language & Communication Needs (SLCN)",
    color: "text-pink-700",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    sendNeedId: "slcn",
    questions: [
      { id: "sl1", text: "Do you find it difficult to find the right words when speaking, even for familiar things?" },
      { id: "sl2", text: "Do you struggle to understand complex or lengthy verbal instructions?" },
      { id: "sl3", text: "Do you find it hard to follow conversations when there is background noise?" },
      { id: "sl4", text: "Do you sometimes misunderstand what people say and respond in an unexpected way?" },
      { id: "sl5", text: "Do you find it difficult to structure your spoken sentences clearly?" },
      { id: "sl6", text: "Do you struggle to take turns in conversation or know when it is your turn to speak?" },
      { id: "sl7", text: "Do you find it hard to understand or use non-literal language (e.g. idioms, metaphors)?" },
      { id: "sl8", text: "Do others sometimes find it hard to understand your speech?" },
    ],
  },
  {
    id: "anxiety",
    title: "Anxiety & Emotional Wellbeing",
    subtitle: "Indicators associated with Anxiety / Mental Health needs",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    sendNeedId: "anxiety",
    questions: [
      { id: "an1", text: "Do you experience persistent worry or fear that feels difficult to control?" },
      { id: "an2", text: "Do you avoid certain situations or places because they make you feel anxious?" },
      { id: "an3", text: "Do you experience physical symptoms of anxiety (e.g. racing heart, sweating, stomach aches) in everyday situations?" },
      { id: "an4", text: "Do you find it hard to concentrate because of worrying thoughts?" },
      { id: "an5", text: "Do you feel overwhelmed by tasks or situations that others seem to manage easily?" },
      { id: "an6", text: "Do you find it very difficult to cope with criticism or making mistakes?" },
      { id: "an7", text: "Do you experience low mood, loss of interest, or persistent feelings of sadness?" },
      { id: "an8", text: "Do you find it hard to sleep due to worrying thoughts?" },
    ],
  },
  {
    id: "mld",
    title: "Learning & Processing",
    subtitle: "Indicators associated with Moderate Learning Difficulties (MLD)",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    sendNeedId: "mld",
    questions: [
      { id: "ml1", text: "Do you find it takes significantly longer than others to learn new concepts or skills?" },
      { id: "ml2", text: "Do you find it hard to retain new information even after repeated practice?" },
      { id: "ml3", text: "Do you struggle to apply knowledge learned in one context to a different situation?" },
      { id: "ml4", text: "Do you find abstract concepts (e.g. fractions, metaphors, time) particularly difficult to grasp?" },
      { id: "ml5", text: "Do you find it hard to work independently without step-by-step support?" },
      { id: "ml6", text: "Do you struggle to keep up with the pace of lessons or group activities?" },
      { id: "ml7", text: "Do you find it difficult to understand and use written language at the expected level for your age?" },
      { id: "ml8", text: "Do you find it hard to plan and organise your work without significant adult support?" },
    ],
  },
];

const RESPONSE_OPTIONS = [
  { value: 0, label: "Never", description: "This doesn't apply to me" },
  { value: 1, label: "Rarely", description: "Happens occasionally" },
  { value: 2, label: "Sometimes", description: "Happens fairly regularly" },
  { value: 3, label: "Often", description: "Happens most of the time" },
  { value: 4, label: "Always", description: "This is a constant experience" },
];

// ─── Verdict Logic ────────────────────────────────────────────────────────────
function getPercentage(answers: Record<string, number>, section: Section): number {
  const maxScore = section.questions.length * 4;
  const score = section.questions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
  return Math.round((score / maxScore) * 100);
}

function getLevel(pct: number): "low" | "moderate" | "high" {
  if (pct >= 60) return "high";
  if (pct >= 35) return "moderate";
  return "low";
}

const VERDICTS: Record<string, Record<"low" | "moderate" | "high", { headline: string; body: string; advice: string }>> = {
  dyslexia: {
    low: {
      headline: "Few indicators of Dyslexia",
      body: "Your responses suggest that reading and writing difficulties associated with dyslexia are not significantly present for you at this time.",
      advice: "No specific action required. Continue to monitor if difficulties emerge.",
    },
    moderate: {
      headline: "Some indicators of Dyslexia",
      body: "Your responses suggest you experience some traits associated with dyslexia, such as difficulties with reading fluency, spelling, or processing written information. These traits can vary in impact depending on context.",
      advice: "Consider speaking to a SENCo or literacy specialist. Strategies such as coloured overlays, text-to-speech tools, and structured literacy programmes may be helpful.",
    },
    high: {
      headline: "Strong indicators of Dyslexia",
      body: "Your responses indicate a significant number of traits strongly associated with dyslexia. This includes difficulties with reading, spelling, phonological processing, and written expression. These are consistent with the BDA's recognised indicators of dyslexia.",
      advice: "We strongly recommend speaking to a SENCo or educational psychologist. A formal diagnostic assessment can provide clarity and unlock access to support, including exam access arrangements and specialist teaching.",
    },
  },
  adhd: {
    low: {
      headline: "Few indicators of ADHD",
      body: "Your responses suggest that attention, impulsivity, and hyperactivity difficulties associated with ADHD are not significantly present for you at this time.",
      advice: "No specific action required. Continue to monitor if difficulties emerge.",
    },
    moderate: {
      headline: "Some indicators of ADHD",
      body: "Your responses suggest you experience some traits associated with ADHD, such as difficulties sustaining attention, managing time, or controlling impulses. These traits exist on a spectrum and can be influenced by environment and stress.",
      advice: "Consider speaking to a GP or SENCo. Strategies such as structured routines, task-chunking, movement breaks, and environmental adjustments can be very effective.",
    },
    high: {
      headline: "Strong indicators of ADHD",
      body: "Your responses indicate a significant number of traits strongly associated with ADHD — including persistent difficulties with attention, organisation, impulsivity, and/or hyperactivity. These are consistent with recognised ADHD diagnostic criteria.",
      advice: "We strongly recommend speaking to a GP or paediatrician for a referral. A formal ADHD assessment can provide clarity and access to support including medication, coaching, and workplace/school adjustments.",
    },
  },
  asc: {
    low: {
      headline: "Few indicators of Autism Spectrum Condition",
      body: "Your responses suggest that social, sensory, and communication traits associated with ASC are not significantly present for you at this time.",
      advice: "No specific action required. Continue to monitor if difficulties emerge.",
    },
    moderate: {
      headline: "Some indicators of Autism Spectrum Condition",
      body: "Your responses suggest you experience some traits associated with ASC, such as sensory sensitivities, preference for routine, or difficulties with social communication. Many people with these traits live fulfilling lives, often with targeted support.",
      advice: "Consider speaking to a GP or SENCo. Strategies such as visual timetables, sensory accommodations, and social skills support can make a significant difference.",
    },
    high: {
      headline: "Strong indicators of Autism Spectrum Condition",
      body: "Your responses indicate a significant number of traits strongly associated with ASC — including difficulties with social communication, sensory processing, and flexibility of thought. These are consistent with recognised autism diagnostic criteria.",
      advice: "We strongly recommend speaking to a GP for a referral to a specialist. A formal autism assessment can provide clarity, self-understanding, and access to tailored support and legal protections.",
    },
  },
  dyspraxia: {
    low: {
      headline: "Few indicators of Dyspraxia",
      body: "Your responses suggest that motor coordination and organisational difficulties associated with dyspraxia are not significantly present for you at this time.",
      advice: "No specific action required.",
    },
    moderate: {
      headline: "Some indicators of Dyspraxia",
      body: "Your responses suggest you experience some traits associated with dyspraxia (DCD), such as difficulties with coordination, handwriting, or sequencing tasks. These can vary significantly in impact.",
      advice: "Consider speaking to a GP or occupational therapist. Strategies such as typing instead of handwriting, structured task-planning, and physical coordination exercises may help.",
    },
    high: {
      headline: "Strong indicators of Dyspraxia",
      body: "Your responses indicate a significant number of traits strongly associated with dyspraxia (Developmental Coordination Disorder), including difficulties with motor coordination, spatial awareness, and task sequencing.",
      advice: "We recommend speaking to a GP for an occupational therapy referral. A formal assessment can provide clarity and access to specialist support, including exam access arrangements.",
    },
  },
  dyscalculia: {
    low: {
      headline: "Few indicators of Dyscalculia",
      body: "Your responses suggest that numerical and mathematical difficulties associated with dyscalculia are not significantly present for you at this time.",
      advice: "No specific action required.",
    },
    moderate: {
      headline: "Some indicators of Dyscalculia",
      body: "Your responses suggest you experience some traits associated with dyscalculia, such as difficulties remembering number facts, understanding place value, or handling money. These traits can be improved with targeted support.",
      advice: "Consider speaking to a maths specialist or SENCo. Concrete manipulatives, number lines, and structured numeracy programmes can be very effective.",
    },
    high: {
      headline: "Strong indicators of Dyscalculia",
      body: "Your responses indicate a significant number of traits strongly associated with dyscalculia — including persistent difficulties with number sense, calculation, and mathematical reasoning that go beyond general maths anxiety.",
      advice: "We recommend speaking to a SENCo or educational psychologist. A formal assessment can provide clarity and access to specialist maths support and exam accommodations.",
    },
  },
  slcn: {
    low: {
      headline: "Few indicators of SLCN",
      body: "Your responses suggest that speech, language, and communication difficulties are not significantly present for you at this time.",
      advice: "No specific action required.",
    },
    moderate: {
      headline: "Some indicators of SLCN",
      body: "Your responses suggest you experience some traits associated with Speech, Language & Communication Needs, such as word-finding difficulties, trouble following complex instructions, or challenges in conversation.",
      advice: "Consider speaking to a SENCo or speech and language therapist. Strategies such as visual supports, pre-teaching vocabulary, and structured conversation practice can be very helpful.",
    },
    high: {
      headline: "Strong indicators of SLCN",
      body: "Your responses indicate a significant number of traits strongly associated with Speech, Language & Communication Needs — including persistent difficulties with understanding, expressing, or using spoken language effectively.",
      advice: "We strongly recommend a referral to a Speech and Language Therapist (SALT). A formal assessment can identify specific areas of difficulty and guide targeted intervention.",
    },
  },
  anxiety: {
    low: {
      headline: "Few indicators of significant Anxiety",
      body: "Your responses suggest that anxiety and emotional wellbeing difficulties are not significantly impacting you at this time.",
      advice: "Continue to practise self-care and seek support if things change.",
    },
    moderate: {
      headline: "Some indicators of Anxiety",
      body: "Your responses suggest you experience some traits associated with anxiety or emotional wellbeing difficulties, such as persistent worry, avoidance, or physical symptoms of stress. These are common experiences but can be supported effectively.",
      advice: "Consider speaking to a trusted adult, school counsellor, or GP. Strategies such as mindfulness, structured worry time, and gradual exposure to anxiety-provoking situations can be very effective.",
    },
    high: {
      headline: "Strong indicators of Anxiety / Mental Health needs",
      body: "Your responses indicate a significant number of traits associated with anxiety or mental health difficulties — including persistent worry, avoidance, physical symptoms, and impact on daily functioning.",
      advice: "We strongly recommend speaking to a GP, school counsellor, or mental health professional. You do not have to manage this alone — effective support is available, including talking therapies, CBT, and school-based pastoral care.",
    },
  },
  mld: {
    low: {
      headline: "Few indicators of Moderate Learning Difficulties",
      body: "Your responses suggest that learning and processing difficulties associated with MLD are not significantly present for you at this time.",
      advice: "No specific action required.",
    },
    moderate: {
      headline: "Some indicators of Moderate Learning Difficulties",
      body: "Your responses suggest you experience some traits associated with Moderate Learning Difficulties, such as needing more time to process information, difficulty with abstract concepts, or needing additional support to work independently.",
      advice: "Consider speaking to a SENCo. Strategies such as scaffolded tasks, visual supports, pre-teaching, and additional processing time can make a significant difference.",
    },
    high: {
      headline: "Strong indicators of Moderate Learning Difficulties",
      body: "Your responses indicate a significant number of traits associated with Moderate Learning Difficulties — including persistent difficulties with learning, retention, and applying knowledge across contexts.",
      advice: "We recommend speaking to a SENCo or educational psychologist. A formal assessment can provide clarity and support access to an Education, Health and Care Plan (EHCP) and specialist provision.",
    },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SendScreener() {
  const [step, setStep] = useState<"intro" | "questions" | "results">("intro");
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const section = SECTIONS[currentSection];
  const totalSections = SECTIONS.length;

  const sectionAnswered = section?.questions.every((q) => answers[q.id] !== undefined);
  const allAnswered = SECTIONS.every((s) => s.questions.every((q) => answers[q.id] !== undefined));

  function handleAnswer(qId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  function handleNext() {
    if (currentSection < totalSections - 1) {
      setCurrentSection((c) => c + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setStep("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    if (currentSection > 0) {
      setCurrentSection((c) => c - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setStep("intro");
    }
  }

  function handleReset() {
    setAnswers({});
    setCurrentSection(0);
    setStep("intro");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">SEND Needs Screener</h1>
            <p className="text-gray-500 text-sm">Developed in line with BDA, NICE, and COBS guidance</p>
          </div>

          {showDisclaimer && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">Important Notice</p>
                <p className="text-sm text-amber-700">
                  This screener is a <strong>non-diagnostic tool</strong> designed to help identify potential traits associated with SEND needs. It is <strong>not a medical diagnosis</strong> and should not be used as one. If you score highly in any area, we recommend speaking to a SENCo, GP, or qualified specialist.
                </p>
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="text-xs text-amber-600 underline mt-2"
                >
                  I understand, dismiss this notice
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">About this screener</h2>
            <p className="text-sm text-gray-600 mb-4">
              This questionnaire covers <strong>8 key SEND areas</strong> with a total of <strong>74 questions</strong>. For each question, you will select how frequently you experience the described trait. At the end, you will receive a personalised profile with a verdict for each area.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SECTIONS.map((s) => (
                <div key={s.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${s.bgColor} ${s.borderColor} border`}>
                  <span className={`text-xs font-medium ${s.color}`}>{s.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">How to answer</h2>
            <div className="space-y-2">
              {RESPONSE_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-semibold text-gray-700">{opt.label}</span>
                  <span className="text-xs text-gray-500">{opt.description}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Answer based on your general experience, not just today. Think about patterns over the past 6–12 months.
            </p>
          </div>

          <button
            onClick={() => { setStep("questions"); setCurrentSection(0); }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Begin Screener
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Questions ──────────────────────────────────────────────────────────────
  if (step === "questions") {
    const progress = ((currentSection) / totalSections) * 100;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Section {currentSection + 1} of {totalSections}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex gap-1 mt-2">
            {SECTIONS.map((s, i) => (
              <div
                key={s.id}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  i < currentSection ? "bg-indigo-400" : i === currentSection ? "bg-indigo-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {/* Section header */}
            <div className={`rounded-xl p-5 mb-6 border ${section.bgColor} ${section.borderColor}`}>
              <h2 className={`text-lg font-bold mb-1 ${section.color}`}>{section.title}</h2>
              <p className="text-sm text-gray-600">{section.subtitle}</p>
            </div>

            {/* Questions */}
            <div className="space-y-5">
              {section.questions.map((q, qi) => (
                <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    <span className="text-gray-400 mr-2">{qi + 1}.</span>
                    {q.text}
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {RESPONSE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer(q.id, opt.value)}
                        className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                          answers[q.id] === opt.value
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-105"
                            : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        <span className="text-base leading-none">
                          {opt.value === 0 ? "😌" : opt.value === 1 ? "🙂" : opt.value === 2 ? "😐" : opt.value === 3 ? "😟" : "😰"}
                        </span>
                        <span className="text-center leading-tight">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!sectionAnswered}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  sectionAnswered
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {currentSection < totalSections - 1 ? (
                  <>Next Section <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>View My Results <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
            {!sectionAnswered && (
              <p className="text-xs text-center text-gray-400 mt-2">
                Please answer all questions in this section to continue.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  const results = SECTIONS.map((s) => ({
    section: s,
    pct: getPercentage(answers, s),
    level: getLevel(getPercentage(answers, s)),
    verdict: VERDICTS[s.id]?.[getLevel(getPercentage(answers, s))],
  }));

  const highResults = results.filter((r) => r.level === "high");
  const moderateResults = results.filter((r) => r.level === "moderate");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 mb-4">
            <CheckCircle2 className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your SEND Screener Results</h1>
          <p className="text-sm text-gray-500">Based on your responses across {totalSections} sections and {Object.keys(answers).length} questions</p>
        </div>

        {/* Disclaimer banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            <strong>Remember:</strong> These results are a screening indicator only — not a diagnosis. High scores suggest traits worth exploring further with a qualified professional.
          </p>
        </div>

        {/* Summary overview */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="space-y-3">
            {results.map((r) => (
              <div key={r.section.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{r.section.title}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    r.level === "high"
                      ? "bg-red-100 text-red-700"
                      : r.level === "moderate"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}>
                    {r.level === "high" ? "High" : r.level === "moderate" ? "Moderate" : "Low"} — {r.pct}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      r.level === "high" ? "bg-red-400" : r.level === "moderate" ? "bg-amber-400" : "bg-green-400"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${r.pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority areas */}
        {highResults.length > 0 && (
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
              High Likelihood Areas
            </h2>
            <div className="space-y-4">
              {highResults.map((r) => (
                <div key={r.section.id} className={`rounded-xl border p-5 ${r.section.bgColor} ${r.section.borderColor}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-bold text-base ${r.section.color}`}>{r.verdict?.headline}</h3>
                    <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">{r.pct}%</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{r.verdict?.body}</p>
                  <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-white">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Recommended next steps:</p>
                    <p className="text-xs text-gray-600">{r.verdict?.advice}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {moderateResults.length > 0 && (
          <div className="mb-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Moderate Likelihood Areas
            </h2>
            <div className="space-y-4">
              {moderateResults.map((r) => (
                <div key={r.section.id} className={`rounded-xl border p-5 ${r.section.bgColor} ${r.section.borderColor}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-bold text-base ${r.section.color}`}>{r.verdict?.headline}</h3>
                    <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">{r.pct}%</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{r.verdict?.body}</p>
                  <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-white">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Recommended next steps:</p>
                    <p className="text-xs text-gray-600">{r.verdict?.advice}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {highResults.length === 0 && moderateResults.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-green-800 mb-1">No significant indicators found</h3>
            <p className="text-sm text-green-700">Your responses suggest low likelihood of the SEND needs covered in this screener. If you have concerns, please speak to a SENCo or GP.</p>
          </div>
        )}

        {/* Low results (collapsed) */}
        {results.filter((r) => r.level === "low").length > 0 && (
          <details className="mb-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700 mb-2 list-none flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              View low-likelihood areas ({results.filter((r) => r.level === "low").length})
            </summary>
            <div className="space-y-2 mt-3">
              {results.filter((r) => r.level === "low").map((r) => (
                <div key={r.section.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{r.section.title}</span>
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{r.pct}% — Low</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{r.verdict?.body}</p>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Final disclaimer */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Disclaimer:</strong> This screener is for informational purposes only and does not constitute a medical or educational diagnosis. Results are based on self-reported responses and should be interpreted with caution. Only a qualified professional (educational psychologist, GP, SENCo, or specialist) can provide a formal diagnosis. If you are concerned about a child, please speak to their school's SENCo in the first instance.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Start Again
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            Print / Save Results
          </button>
        </div>
      </motion.div>
    </div>
  );
}
