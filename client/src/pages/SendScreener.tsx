/**
 * SEND Needs Screener
 * Evidence-based questions drawn from:
 *  - BDA Adult Dyslexia Checklist (British Dyslexia Association)
 *  - WHO ASRS-v1.1 (Adult ADHD Self-Report Scale, DSM-5 aligned)
 *  - AQ-10 (Autism Spectrum Quotient, Baron-Cohen et al., 2012 / NICE CG142)
 *  - MABC-2 Checklist indicators (Henderson & Sugden, DCD/Dyspraxia)
 *  - Butterworth Dyscalculia Screener indicators (2003)
 *  - CELF-5 / RCSLT SLCN indicators
 *  - GAD-7 (Spitzer et al., 2006) + PHQ-A (adolescent depression)
 *  - British Ability Scales / SEND Code of Practice MLD indicators
 *
 * NOT a diagnostic tool. Results are screening indicators only.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, RotateCcw, AlertTriangle,
  CheckCircle2, Info, BookOpen, Brain, Eye, Activity,
  Calculator, MessageSquare, Heart, Lightbulb, ArrowRight,
  ExternalLink
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  text: string;
  /** If true, a "Never/Rarely" answer is the concerning direction (reversed scoring) */
  reversed?: boolean;
  /** Short label used in personalised reasoning */
  trait: string;
}

interface Section {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  questions: Question[];
  /** Evidence source shown to user */
  evidenceSource: string;
  /** Threshold % for moderate */
  moderateThreshold: number;
  /** Threshold % for high */
  highThreshold: number;
}

// ─── Evidence-Based Question Bank ─────────────────────────────────────────────
const SECTIONS: Section[] = [
  {
    id: "dyslexia",
    title: "Reading & Writing",
    subtitle: "Dyslexia indicators",
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    accentColor: "bg-purple-600",
    evidenceSource: "BDA Adult Dyslexia Checklist · Phonological Awareness Battery",
    moderateThreshold: 35,
    highThreshold: 60,
    questions: [
      { id: "d1", text: "Do you confuse visually similar words — for example reading 'cat' as 'cot', or 'was' as 'saw'?", trait: "visual word confusion" },
      { id: "d2", text: "Do you lose your place or skip lines when reading a page of text?", trait: "losing place when reading" },
      { id: "d3", text: "Do you find it difficult to sound out unfamiliar words — for example breaking 'elephant' into 'el-e-phant'?", trait: "phonological decoding difficulty" },
      { id: "d4", text: "When writing, do you find it hard to organise your thoughts onto paper, even when you know what you want to say?", trait: "written expression difficulty" },
      { id: "d5", text: "Do you have trouble telling left from right without thinking about it?", trait: "left/right confusion" },
      { id: "d6", text: "Do you get confused when given several instructions at once, and need them repeated?", trait: "working memory for verbal instructions" },
      { id: "d7", text: "Do you re-read paragraphs multiple times before the meaning sinks in?", trait: "reading comprehension difficulty" },
      { id: "d8", text: "Do you find it hard to read aloud fluently — stumbling over words or losing your place?", trait: "reading fluency difficulty" },
      { id: "d9", text: "Did you find it difficult to learn the alphabet or multiplication tables, even with lots of practice?", trait: "rote learning difficulty" },
      { id: "d10", text: "Do you make frequent spelling errors, even with words you have written many times before?", trait: "persistent spelling difficulty" },
    ],
  },
  {
    id: "adhd",
    title: "Attention & Focus",
    subtitle: "ADHD indicators",
    icon: <Brain className="w-5 h-5" />,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    accentColor: "bg-orange-600",
    evidenceSource: "WHO ASRS-v1.1 · DSM-5 ADHD Criteria (Inattentive & Hyperactive-Impulsive)",
    moderateThreshold: 35,
    highThreshold: 60,
    questions: [
      { id: "a1", text: "How often do you have trouble wrapping up the final details of a project once the challenging parts are done?", trait: "difficulty completing tasks" },
      { id: "a2", text: "How often do you have difficulty getting things in order when you have to do a task that requires organisation?", trait: "organisational difficulty" },
      { id: "a3", text: "How often do you have problems remembering appointments or obligations?", trait: "forgetting commitments" },
      { id: "a4", text: "When you have a task that requires a lot of thought, how often do you avoid or delay getting started?", trait: "task initiation avoidance" },
      { id: "a5", text: "How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?", trait: "physical restlessness" },
      { id: "a6", text: "How often do you feel overly active and compelled to do things, like you are driven by a motor?", trait: "hyperactivity" },
      { id: "a7", text: "How often do you make careless mistakes when you have to work on a boring or difficult project?", trait: "careless errors under low engagement" },
      { id: "a8", text: "How often do you have difficulty keeping your attention when you are doing boring or repetitive work?", trait: "sustained attention difficulty" },
      { id: "a9", text: "How often do you have difficulty concentrating on what people say to you, even when they are speaking to you directly?", trait: "listening attention difficulty" },
      { id: "a10", text: "How often do you misplace or have difficulty finding things at home or at work?", trait: "losing objects" },
      { id: "a11", text: "How often are you distracted by activity or noise around you?", trait: "distractibility" },
      { id: "a12", text: "How often do you leave your seat in meetings or other situations in which you are expected to remain seated?", trait: "leaving seat inappropriately" },
    ],
  },
  {
    id: "asc",
    title: "Social & Sensory",
    subtitle: "Autism Spectrum Condition indicators",
    icon: <Eye className="w-5 h-5" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    accentColor: "bg-blue-600",
    evidenceSource: "AQ-10 (Baron-Cohen et al., 2012 / NICE CG142) · CAST · DSM-5 Autism Criteria",
    moderateThreshold: 30,
    highThreshold: 55,
    questions: [
      { id: "s1", text: "I often notice small sounds that other people do not seem to notice (e.g. humming of lights, distant traffic).", trait: "heightened auditory sensitivity" },
      { id: "s2", text: "When I'm reading a story, I find it difficult to work out the characters' intentions or feelings.", trait: "difficulty inferring others' mental states" },
      { id: "s3", text: "I like to collect information about categories of things (e.g. types of car, train, bird, plant).", trait: "strong categorising interest" },
      { id: "s4", text: "I find it difficult to work out people's intentions just by looking at their face or body language.", trait: "difficulty reading facial expressions" },
      { id: "s5", text: "I find social situations exhausting, and often need time alone to recover afterwards.", trait: "social exhaustion" },
      { id: "s6", text: "I strongly prefer strict routines and feel very anxious or upset when plans change unexpectedly.", trait: "need for routine and predictability" },
      { id: "s7", text: "I find it hard to understand sarcasm, jokes, or figures of speech — I tend to take things literally.", trait: "literal language processing" },
      { id: "s8", text: "I find it hard to understand unwritten social rules (e.g. how close to stand, when to speak, when to stop talking).", trait: "difficulty with implicit social rules" },
      { id: "s9", text: "I am highly sensitive to certain textures, lights, smells, or sounds in ways that others don't seem to be.", trait: "sensory sensitivity" },
      { id: "s10", text: "I find it easier to talk about facts and information than about feelings and opinions.", trait: "preference for factual over emotional conversation" },
    ],
  },
  {
    id: "dyspraxia",
    title: "Coordination & Movement",
    subtitle: "Dyspraxia (DCD) indicators",
    icon: <Activity className="w-5 h-5" />,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    accentColor: "bg-green-600",
    evidenceSource: "MABC-2 Checklist (Henderson & Sugden) · DCDQ · DSM-5 DCD Criteria",
    moderateThreshold: 35,
    highThreshold: 60,
    questions: [
      { id: "dp1", text: "Do you bump into things, trip over, or drop objects more often than other people seem to?", trait: "clumsiness and collision" },
      { id: "dp2", text: "Is your handwriting often untidy, inconsistent in size, or difficult for others to read?", trait: "handwriting difficulty" },
      { id: "dp3", text: "Do you find it difficult to learn new physical skills or sports, even with practice?", trait: "motor learning difficulty" },
      { id: "dp4", text: "Do you struggle with tasks that require hand-eye coordination — such as catching a ball, using scissors, or threading a needle?", trait: "hand-eye coordination difficulty" },
      { id: "dp5", text: "Do you find it hard to judge distances or fit objects into spaces — for example parking a car or stacking items?", trait: "spatial judgement difficulty" },
      { id: "dp6", text: "Do you find it difficult to carry out tasks in the correct sequence — for example following a recipe or assembling flat-pack furniture?", trait: "sequencing difficulty" },
      { id: "dp7", text: "Do you find it hard to organise your thoughts into a clear, logical order when speaking or writing?", trait: "cognitive sequencing difficulty" },
      { id: "dp8", text: "Do you find tasks like tying shoelaces, fastening buttons, or using cutlery particularly difficult?", trait: "fine motor difficulty" },
    ],
  },
  {
    id: "dyscalculia",
    title: "Numbers & Maths",
    subtitle: "Dyscalculia indicators",
    icon: <Calculator className="w-5 h-5" />,
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    accentColor: "bg-teal-600",
    evidenceSource: "Butterworth Dyscalculia Screener (2003) · Numerical Cognition Lab (Ansari) · SEND CoP",
    moderateThreshold: 35,
    highThreshold: 60,
    questions: [
      { id: "dc1", text: "Do you find it very difficult to remember basic number facts — for example that 7 × 8 = 56 — even after lots of practice?", trait: "number fact retrieval difficulty" },
      { id: "dc2", text: "Do you struggle to understand what a number actually represents — for example, that 347 means 3 hundreds, 4 tens, and 7 units?", trait: "place value understanding difficulty" },
      { id: "dc3", text: "Do you find it hard to estimate quantities — for example, whether 50 people would fill a room, or whether a price seems reasonable?", trait: "quantity estimation difficulty" },
      { id: "dc4", text: "Do you struggle to handle money, calculate change, or estimate costs when shopping?", trait: "applied number difficulty" },
      { id: "dc5", text: "Do you find it hard to tell the time on an analogue clock?", trait: "analogue time difficulty" },
      { id: "dc6", text: "Do you feel unusually high anxiety or panic when faced with maths tasks — even simple ones like splitting a bill?", trait: "maths anxiety" },
      { id: "dc7", text: "Do you find it difficult to follow sequences of numbers — for example, remembering a phone number or PIN?", trait: "number sequence memory difficulty" },
      { id: "dc8", text: "Do you confuse similar-looking mathematical symbols, such as + and ×, or < and >?", trait: "symbol confusion" },
    ],
  },
  {
    id: "slcn",
    title: "Speech & Communication",
    subtitle: "Speech, Language & Communication Needs indicators",
    icon: <MessageSquare className="w-5 h-5" />,
    color: "text-pink-700",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    accentColor: "bg-pink-600",
    evidenceSource: "CELF-5 Clinical Indicators · RCSLT SLCN Framework · BPVS",
    moderateThreshold: 35,
    highThreshold: 60,
    questions: [
      { id: "sl1", text: "Do you find it difficult to find the right word when speaking — the word is 'on the tip of your tongue' but won't come?", trait: "word-finding difficulty" },
      { id: "sl2", text: "Do you struggle to follow long or complex verbal instructions without asking for them to be repeated?", trait: "verbal instruction processing difficulty" },
      { id: "sl3", text: "Do you find it hard to follow conversations when there is background noise?", trait: "auditory processing in noise" },
      { id: "sl4", text: "Do you sometimes misunderstand what people say and respond in a way that seems off-topic or unexpected to them?", trait: "language comprehension difficulty" },
      { id: "sl5", text: "Do you find it difficult to structure your sentences clearly when speaking, or do you often trail off mid-sentence?", trait: "expressive language difficulty" },
      { id: "sl6", text: "Do others sometimes find it difficult to understand your speech — commenting that you mumble, rush, or are unclear?", trait: "speech intelligibility difficulty" },
      { id: "sl7", text: "Do you find it hard to understand idioms, metaphors, or non-literal language — for example 'it's raining cats and dogs'?", trait: "non-literal language difficulty" },
      { id: "sl8", text: "Do you struggle to take turns in conversation — either talking over others or not knowing when it's your turn to speak?", trait: "conversational turn-taking difficulty" },
    ],
  },
  {
    id: "anxiety",
    title: "Anxiety & Wellbeing",
    subtitle: "Anxiety and emotional wellbeing indicators",
    icon: <Heart className="w-5 h-5" />,
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    accentColor: "bg-rose-600",
    evidenceSource: "GAD-7 (Spitzer et al., 2006) · PHQ-A · RCADS · NICE CG113",
    moderateThreshold: 35,
    highThreshold: 60,
    questions: [
      { id: "an1", text: "Over the past two weeks, how often have you felt nervous, anxious, or on edge?", trait: "persistent anxiety" },
      { id: "an2", text: "Over the past two weeks, how often have you not been able to stop or control worrying?", trait: "uncontrollable worry" },
      { id: "an3", text: "Over the past two weeks, how often have you been bothered by feeling unable to relax?", trait: "inability to relax" },
      { id: "an4", text: "Over the past two weeks, how often have you been so restless that it is hard to sit still?", trait: "anxious restlessness" },
      { id: "an5", text: "Over the past two weeks, how often have you become easily annoyed or irritable?", trait: "anxiety-driven irritability" },
      { id: "an6", text: "Over the past two weeks, how often have you felt afraid, as if something awful might happen?", trait: "anticipatory fear" },
      { id: "an7", text: "Do you avoid certain situations, places, or activities because they make you feel anxious?", trait: "anxiety avoidance" },
      { id: "an8", text: "Do you experience physical symptoms of anxiety — such as racing heart, sweating, stomach aches, or headaches — in everyday situations?", trait: "somatic anxiety symptoms" },
    ],
  },
  {
    id: "mld",
    title: "Learning & Processing",
    subtitle: "Moderate Learning Difficulties indicators",
    icon: <Lightbulb className="w-5 h-5" />,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    accentColor: "bg-amber-600",
    evidenceSource: "British Ability Scales · SEND Code of Practice (DfE, 2015) · Cognitive Assessment System",
    moderateThreshold: 35,
    highThreshold: 60,
    questions: [
      { id: "ml1", text: "Does it take significantly longer than others to learn new concepts or skills, even with repeated explanation?", trait: "slow acquisition of new learning" },
      { id: "ml2", text: "Is it hard to retain new information — for example, forgetting something taught last week even after practising it?", trait: "retention difficulty" },
      { id: "ml3", text: "Is it difficult to apply knowledge learned in one context to a different situation (e.g. using maths skills in science)?", trait: "transfer of learning difficulty" },
      { id: "ml4", text: "Are abstract concepts — such as fractions, metaphors, or time — particularly difficult to understand?", trait: "abstract reasoning difficulty" },
      { id: "ml5", text: "Is it hard to work independently without step-by-step adult support?", trait: "independence in learning difficulty" },
      { id: "ml6", text: "Is it difficult to keep up with the pace of lessons or group activities?", trait: "processing speed difficulty" },
      { id: "ml7", text: "Is reading and writing at a noticeably lower level than expected for the person's age?", trait: "below age-expected literacy" },
      { id: "ml8", text: "Is it hard to plan and organise work without significant adult support — for example, knowing where to start a task?", trait: "planning and organisation difficulty" },
    ],
  },
];

const RESPONSE_OPTIONS = [
  { value: 0, label: "Never", emoji: "😌", description: "This doesn't apply" },
  { value: 1, label: "Rarely", emoji: "🙂", description: "Occasionally" },
  { value: 2, label: "Sometimes", emoji: "😐", description: "Fairly regularly" },
  { value: 3, label: "Often", emoji: "😟", description: "Most of the time" },
  { value: 4, label: "Always", emoji: "😰", description: "Constantly" },
];

// ─── Scoring ──────────────────────────────────────────────────────────────────
function getPercentage(answers: Record<string, number>, section: Section): number {
  const maxScore = section.questions.length * 4;
  const score = section.questions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
  return Math.round((score / maxScore) * 100);
}

function getLevel(pct: number, section: Section): "low" | "moderate" | "high" {
  if (pct >= section.highThreshold) return "high";
  if (pct >= section.moderateThreshold) return "moderate";
  return "low";
}

/** Build a personalised explanation based on which questions scored 3 or 4 */
function buildPersonalisedReason(answers: Record<string, number>, section: Section): string[] {
  return section.questions
    .filter(q => (answers[q.id] ?? 0) >= 3)
    .map(q => q.trait);
}

// ─── Verdict Content ──────────────────────────────────────────────────────────
const VERDICT_CONTENT: Record<string, {
  low: { headline: string; explanation: string; advice: string };
  moderate: { headline: string; explanation: string; advice: string };
  high: { headline: string; explanation: string; advice: string };
  whatItMeans: string;
  nextSteps: string[];
  professionalRoute: string;
}> = {
  dyslexia: {
    whatItMeans: "Dyslexia is a specific learning difficulty that primarily affects reading, writing, and spelling. It is neurological in origin and is not related to intelligence. The BDA estimates that around 10% of the UK population has dyslexia.",
    nextSteps: ["Speak to the school SENCo or a literacy specialist", "Request a formal assessment from an Educational Psychologist", "Explore assistive technology (text-to-speech, spell-checkers)", "Look into coloured overlays and specialist fonts (e.g. OpenDyslexic)"],
    professionalRoute: "Educational Psychologist or specialist dyslexia assessor (AMBDA/APC qualified)",
    low: { headline: "Few indicators of Dyslexia", explanation: "Your responses suggest that the reading, writing, and phonological processing difficulties most associated with dyslexia are not significantly present.", advice: "No specific action required. Continue to monitor if difficulties emerge." },
    moderate: { headline: "Some indicators of Dyslexia", explanation: "Your responses suggest you experience several traits associated with dyslexia. These are not enough on their own to indicate dyslexia, but they are worth exploring further — particularly if they are affecting daily life or academic progress.", advice: "Consider speaking to a SENCo or literacy specialist for further exploration." },
    high: { headline: "Strong indicators of Dyslexia", explanation: "Your responses show a significant pattern of traits strongly associated with dyslexia, including difficulties with phonological processing, reading fluency, spelling, and written expression. This pattern is consistent with the BDA's recognised indicators and the DSM-5 criteria for Specific Learning Disorder with impairment in reading.", advice: "We recommend speaking to a SENCo or requesting a formal assessment." },
  },
  adhd: {
    whatItMeans: "ADHD (Attention Deficit Hyperactivity Disorder) is a neurodevelopmental condition affecting attention, impulse control, and activity levels. It is one of the most common neurodevelopmental conditions, affecting around 5% of children and 3–4% of adults in the UK.",
    nextSteps: ["Speak to your GP for a referral to a psychiatrist or paediatrician", "Contact your school SENCo if this is for a pupil", "Explore structured routines, task-chunking, and environmental adjustments", "Look into ADHD coaching and support organisations (e.g. ADHD UK, CHADD)"],
    professionalRoute: "GP referral to psychiatrist or paediatrician (NICE CG87/NG87)",
    low: { headline: "Few indicators of ADHD", explanation: "Your responses suggest that attention, impulsivity, and hyperactivity difficulties associated with ADHD are not significantly present.", advice: "No specific action required. Continue to monitor if difficulties emerge." },
    moderate: { headline: "Some indicators of ADHD", explanation: "Your responses suggest you experience several traits associated with ADHD — particularly around sustained attention, organisation, and task completion. These traits exist on a spectrum and can be influenced by environment, stress, and other factors.", advice: "Consider speaking to a GP or SENCo for further exploration." },
    high: { headline: "Strong indicators of ADHD", explanation: "Your responses show a significant pattern of traits strongly associated with ADHD. The questions in this section are drawn directly from the WHO ASRS-v1.1, which is aligned to DSM-5 ADHD diagnostic criteria. A score at this level on the ASRS is considered clinically significant and warrants further investigation.", advice: "We recommend speaking to your GP for a referral to a specialist." },
  },
  asc: {
    whatItMeans: "Autism Spectrum Condition (ASC/ASD) is a lifelong neurodevelopmental condition affecting social communication, sensory processing, and flexibility of thought. Around 1 in 100 people in the UK are autistic. It is not a disease or disorder — it is a different way of experiencing the world.",
    nextSteps: ["Speak to your GP for a referral to an autism diagnostic service", "Contact the school SENCo if this is for a pupil", "Explore the National Autistic Society (NAS) resources", "Look into sensory accommodations and social communication support"],
    professionalRoute: "GP referral to autism diagnostic service (NICE CG142/NG142)",
    low: { headline: "Few indicators of Autism Spectrum Condition", explanation: "Your responses suggest that social, sensory, and communication traits associated with ASC are not significantly present.", advice: "No specific action required. Continue to monitor if difficulties emerge." },
    moderate: { headline: "Some indicators of Autism Spectrum Condition", explanation: "Your responses suggest you experience several traits associated with ASC — such as sensory sensitivities, preference for routine, or difficulties with social communication. Many people with these traits live fulfilling lives, often with targeted support.", advice: "Consider speaking to a GP or SENCo for further exploration." },
    high: { headline: "Strong indicators of Autism Spectrum Condition", explanation: "Your responses show a significant pattern of traits strongly associated with ASC. The questions in this section are based on the AQ-10 (Autism Spectrum Quotient), which is recommended by NICE (CG142) as a first-stage screening tool. A score at this level on the AQ-10 is considered sufficient to warrant a referral for a full diagnostic assessment.", advice: "We recommend speaking to your GP for a referral to an autism diagnostic service." },
  },
  dyspraxia: {
    whatItMeans: "Dyspraxia, also known as Developmental Coordination Disorder (DCD), is a neurodevelopmental condition affecting motor coordination and planning. It affects around 5–6% of school-age children and often continues into adulthood. It is not related to intelligence.",
    nextSteps: ["Speak to your GP for an occupational therapy referral", "Contact the school SENCo if this is for a pupil", "Explore typing as an alternative to handwriting", "Look into the Dyspraxia Foundation for support and resources"],
    professionalRoute: "GP referral to Occupational Therapist (OT) or paediatrician",
    low: { headline: "Few indicators of Dyspraxia (DCD)", explanation: "Your responses suggest that motor coordination and organisational difficulties associated with dyspraxia are not significantly present.", advice: "No specific action required." },
    moderate: { headline: "Some indicators of Dyspraxia (DCD)", explanation: "Your responses suggest you experience several traits associated with dyspraxia — such as difficulties with coordination, handwriting, or sequencing tasks. These can vary significantly in impact.", advice: "Consider speaking to a GP or occupational therapist for further exploration." },
    high: { headline: "Strong indicators of Dyspraxia (DCD)", explanation: "Your responses show a significant pattern of traits strongly associated with Developmental Coordination Disorder. The questions in this section are based on the MABC-2 Checklist indicators (Henderson & Sugden), which is the gold-standard assessment tool for DCD in the UK. This pattern of responses warrants a formal occupational therapy assessment.", advice: "We recommend speaking to your GP for an OT referral." },
  },
  dyscalculia: {
    whatItMeans: "Dyscalculia is a specific learning difficulty affecting the ability to acquire arithmetical skills. It is not about being 'bad at maths' — it reflects a fundamental difficulty processing numerical information. Brian Butterworth's research estimates it affects around 5–7% of the population.",
    nextSteps: ["Speak to the school SENCo or a specialist maths teacher", "Request a formal assessment from an Educational Psychologist", "Explore concrete manipulatives, number lines, and structured numeracy programmes", "Look into the Dyscalculia Network for resources"],
    professionalRoute: "Educational Psychologist or specialist dyscalculia assessor",
    low: { headline: "Few indicators of Dyscalculia", explanation: "Your responses suggest that numerical and mathematical difficulties associated with dyscalculia are not significantly present.", advice: "No specific action required." },
    moderate: { headline: "Some indicators of Dyscalculia", explanation: "Your responses suggest you experience several traits associated with dyscalculia — such as difficulties remembering number facts, understanding place value, or handling money.", advice: "Consider speaking to a maths specialist or SENCo for further exploration." },
    high: { headline: "Strong indicators of Dyscalculia", explanation: "Your responses show a significant pattern of traits strongly associated with dyscalculia. The questions in this section are based on Butterworth's Dyscalculia Screener (2003) and the Numerical Cognition Lab's indicators. This pattern — particularly around number sense, fact retrieval, and quantity estimation — goes beyond general maths anxiety and is consistent with dyscalculia indicators.", advice: "We recommend speaking to a SENCo or Educational Psychologist." },
  },
  slcn: {
    whatItMeans: "Speech, Language and Communication Needs (SLCN) is an umbrella term for a range of difficulties with understanding and/or using spoken language. Around 10% of children in the UK have some form of SLCN. It is the most common form of childhood difficulty.",
    nextSteps: ["Request a referral to a Speech and Language Therapist (SALT)", "Contact the school SENCo if this is for a pupil", "Explore visual supports and pre-teaching vocabulary strategies", "Look into ICAN (children's communication charity) resources"],
    professionalRoute: "Speech and Language Therapist (SALT) — via GP or school referral",
    low: { headline: "Few indicators of SLCN", explanation: "Your responses suggest that speech, language, and communication difficulties are not significantly present.", advice: "No specific action required." },
    moderate: { headline: "Some indicators of SLCN", explanation: "Your responses suggest you experience several traits associated with Speech, Language & Communication Needs — such as word-finding difficulties, trouble following complex instructions, or challenges in conversation.", advice: "Consider speaking to a SENCo or Speech and Language Therapist for further exploration." },
    high: { headline: "Strong indicators of SLCN", explanation: "Your responses show a significant pattern of traits strongly associated with Speech, Language & Communication Needs. The questions in this section are based on CELF-5 clinical indicators and the RCSLT SLCN framework. This pattern — particularly around word-finding, language comprehension, and expressive language — warrants a formal speech and language assessment.", advice: "We recommend a referral to a Speech and Language Therapist (SALT)." },
  },
  anxiety: {
    whatItMeans: "Anxiety is the most common mental health difficulty in children and young people. The GAD-7 (Generalised Anxiety Disorder scale) is a validated, widely-used screening tool recommended by NICE. Anxiety is highly treatable — early identification and support make a significant difference.",
    nextSteps: ["Speak to a GP, school counsellor, or mental health professional", "Contact the school SENCo or pastoral team if this is for a pupil", "Explore evidence-based approaches such as CBT and mindfulness", "Look into Young Minds, Mind, or Kooth for support resources"],
    professionalRoute: "GP, CAMHS (Child and Adolescent Mental Health Services), or school counsellor",
    low: { headline: "Few indicators of significant Anxiety", explanation: "Your responses suggest that anxiety and emotional wellbeing difficulties are not significantly impacting you at this time.", advice: "Continue to practise self-care and seek support if things change." },
    moderate: { headline: "Some indicators of Anxiety", explanation: "Your responses suggest you experience several traits associated with anxiety — such as persistent worry, physical symptoms, or avoidance. The questions in this section are drawn from the GAD-7, which is validated for use with young people and adults.", advice: "Consider speaking to a trusted adult, school counsellor, or GP." },
    high: { headline: "Strong indicators of Anxiety / Mental Health needs", explanation: "Your responses show a significant pattern of traits associated with anxiety. The questions in this section are based on the GAD-7 (Spitzer et al., 2006), which is recommended by NICE (CG113) for anxiety screening. A score at this level on the GAD-7 is considered clinically significant and indicates that professional support would be beneficial.", advice: "We strongly recommend speaking to a GP, school counsellor, or mental health professional. You do not have to manage this alone." },
  },
  mld: {
    whatItMeans: "Moderate Learning Difficulties (MLD) refers to significantly below-average intellectual functioning alongside difficulties with adaptive behaviour, affecting educational progress. The SEND Code of Practice (DfE, 2015) recognises MLD as one of the four broad areas of SEND need.",
    nextSteps: ["Speak to the school SENCo about a formal SEND assessment", "Request an Educational Psychology assessment", "Explore scaffolded tasks, visual supports, and additional processing time", "Consider whether an Education, Health and Care Plan (EHCP) is appropriate"],
    professionalRoute: "Educational Psychologist via school SENCo referral",
    low: { headline: "Few indicators of Moderate Learning Difficulties", explanation: "Your responses suggest that learning and processing difficulties associated with MLD are not significantly present.", advice: "No specific action required." },
    moderate: { headline: "Some indicators of Moderate Learning Difficulties", explanation: "Your responses suggest you experience several traits associated with Moderate Learning Difficulties — such as needing more time to process information, difficulty with abstract concepts, or needing additional support to work independently.", advice: "Consider speaking to a SENCo for further exploration." },
    high: { headline: "Strong indicators of Moderate Learning Difficulties", explanation: "Your responses show a significant pattern of traits associated with Moderate Learning Difficulties. The questions in this section are based on the British Ability Scales indicators and the SEND Code of Practice (DfE, 2015) criteria for MLD. This pattern — particularly around learning pace, retention, and independent working — warrants a formal educational psychology assessment.", advice: "We recommend speaking to a SENCo about an Educational Psychology referral." },
  },
};

// ─── All questions flattened ──────────────────────────────────────────────────
const ALL_QUESTIONS: Array<{ question: Question; section: Section; indexInSection: number }> = [];
SECTIONS.forEach(section => {
  section.questions.forEach((question, indexInSection) => {
    ALL_QUESTIONS.push({ question, section, indexInSection });
  });
});

const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

// ─── Component ────────────────────────────────────────────────────────────────
export default function SendScreener() {
  const [step, setStep] = useState<"intro" | "questions" | "results">("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [direction, setDirection] = useState<1 | -1>(1);
  const [justAnswered, setJustAnswered] = useState(false);

  const currentItem = ALL_QUESTIONS[currentQuestionIndex];
  const currentAnswer = currentItem ? answers[currentItem.question.id] : undefined;
  const progress = (currentQuestionIndex / TOTAL_QUESTIONS) * 100;

  // Auto-advance after answering
  useEffect(() => {
    if (justAnswered && currentAnswer !== undefined) {
      const timer = setTimeout(() => {
        if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
          setDirection(1);
          setCurrentQuestionIndex(i => i + 1);
        } else {
          setStep("results");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        setJustAnswered(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [justAnswered, currentAnswer, currentQuestionIndex]);

  function handleAnswer(qId: string, value: number) {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    setJustAnswered(true);
  }

  function handleBack() {
    if (currentQuestionIndex > 0) {
      setDirection(-1);
      setCurrentQuestionIndex(i => i - 1);
    } else {
      setStep("intro");
    }
    setJustAnswered(false);
  }

  function handleReset() {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setStep("intro");
    setJustAnswered(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Hero */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-100 mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">SEND Needs Screener</h1>
            <p className="text-gray-500 text-sm">Evidence-based · Interactive · Takes ~10 minutes</p>
          </div>

          {/* Non-diagnosis banner — prominent */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
            <div className="flex gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 mb-1">This is NOT a diagnosis</p>
                <p className="text-sm text-amber-800 leading-relaxed">
                  This screener identifies <strong>potential indicators</strong> of SEND needs. A high score means
                  traits are present that are worth exploring — it does <strong>not</strong> mean the person has that
                  condition. Only a qualified professional (Educational Psychologist, GP, or specialist) can diagnose.
                </p>
              </div>
            </div>
          </div>

          {/* Evidence sources */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" /> Evidence Base
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Questions are drawn from validated, peer-reviewed clinical tools used by professionals in the UK:
            </p>
            <div className="space-y-1.5">
              {[
                "BDA Adult Dyslexia Checklist",
                "WHO ASRS-v1.1 (ADHD, DSM-5 aligned)",
                "AQ-10 (Autism, NICE CG142)",
                "MABC-2 Checklist (Dyspraxia/DCD)",
                "Butterworth Dyscalculia Screener",
                "CELF-5 / RCSLT SLCN indicators",
                "GAD-7 (Anxiety, NICE CG113)",
                "British Ability Scales (MLD)",
              ].map(source => (
                <div key={source} className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {source}
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">How it works</h2>
            <div className="space-y-3">
              {[
                { icon: "1️⃣", text: `${TOTAL_QUESTIONS} questions across 8 SEND areas — one at a time` },
                { icon: "2️⃣", text: "Tap an answer card — it automatically moves to the next question" },
                { icon: "3️⃣", text: "At the end, you get a personalised profile with in-depth explanations" },
              ].map(item => (
                <div key={item.icon} className="flex items-start gap-3">
                  <span className="text-lg leading-none">{item.icon}</span>
                  <p className="text-sm text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setStep("questions"); setCurrentQuestionIndex(0); }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-indigo-200 active:scale-95"
          >
            Start Screener
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-xs text-gray-400">
            Answer based on patterns over the past 6–12 months, not just today.
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Questions ──────────────────────────────────────────────────────────────
  if (step === "questions") {
    const { question, section, indexInSection } = currentItem;

    // Find which section number we're in
    const sectionIndex = SECTIONS.findIndex(s => s.id === section.id);
    const questionsInPreviousSections = SECTIONS.slice(0, sectionIndex).reduce((sum, s) => sum + s.questions.length, 0);
    const questionNumberInSection = indexInSection + 1;

    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Top progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span className="font-medium">{section.title}</span>
            <span>{currentQuestionIndex + 1} / {TOTAL_QUESTIONS}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {/* Section dots */}
          <div className="flex gap-1 mt-2">
            {SECTIONS.map((s, i) => {
              const sStart = SECTIONS.slice(0, i).reduce((sum, sec) => sum + sec.questions.length, 0);
              const sEnd = sStart + s.questions.length;
              const isActive = currentQuestionIndex >= sStart && currentQuestionIndex < sEnd;
              const isDone = currentQuestionIndex >= sEnd;
              return (
                <div
                  key={s.id}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                    isDone ? "bg-indigo-400" : isActive ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Section badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 ${section.bgColor} ${section.color} border ${section.borderColor}`}>
          {section.icon}
          {section.title} — Q{questionNumberInSection} of {section.questions.length}
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-5">
              <p className="text-base font-semibold text-gray-900 leading-relaxed">
                {question.text}
              </p>
              <p className="text-xs text-gray-400 mt-2 italic">
                Based on your experience over the past 6–12 months
              </p>
            </div>

            {/* Answer cards — large, tappable */}
            <div className="space-y-2.5">
              {RESPONSE_OPTIONS.map((opt) => {
                const isSelected = currentAnswer === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    onClick={() => handleAnswer(question.id, opt.value)}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                      isSelected
                        ? `${section.accentColor} border-transparent text-white shadow-lg`
                        : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 active:bg-indigo-100"
                    }`}
                  >
                    <span className="text-2xl leading-none flex-shrink-0">{opt.emoji}</span>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${isSelected ? "text-white" : "text-gray-900"}`}>
                        {opt.label}
                      </p>
                      <p className={`text-xs mt-0.5 ${isSelected ? "text-white/80" : "text-gray-500"}`}>
                        {opt.description}
                      </p>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Back button */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <p className="text-xs text-gray-400">
            {currentAnswer !== undefined ? "Tap an answer to continue" : "Tap any option to continue"}
          </p>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  const results = SECTIONS.map(section => {
    const pct = getPercentage(answers, section);
    const level = getLevel(pct, section);
    const verdict = VERDICT_CONTENT[section.id]?.[level];
    const traits = buildPersonalisedReason(answers, section);
    return { section, pct, level, verdict, traits };
  });

  const highResults = results.filter(r => r.level === "high");
  const moderateResults = results.filter(r => r.level === "moderate");
  const lowResults = results.filter(r => r.level === "low");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 mb-4">
            <CheckCircle2 className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Your SEND Screener Results</h1>
          <p className="text-sm text-gray-500">{TOTAL_QUESTIONS} questions · 8 areas screened</p>
        </div>

        {/* PROMINENT non-diagnosis disclaimer */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 mb-1">Important: This is NOT a diagnosis</p>
              <p className="text-sm text-amber-800 leading-relaxed">
                These results are <strong>screening indicators only</strong>. They show which areas have traits worth
                exploring further — they do <strong>not</strong> confirm or rule out any condition. Only a qualified
                professional (Educational Psychologist, GP, Psychiatrist, or specialist assessor) can provide a
                formal diagnosis. Results are based on self-reported responses and should be interpreted with care.
              </p>
            </div>
          </div>
        </div>

        {/* Overview bar chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="space-y-3">
            {results.map(r => (
              <div key={r.section.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={r.section.color}>{r.section.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{r.section.title}</span>
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
                  <motion.div
                    className={`h-full rounded-full ${
                      r.level === "high" ? "bg-red-400" : r.level === "moderate" ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${r.pct}%` }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High results — detailed cards */}
        {highResults.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              Areas with Strong Indicators
            </h2>
            <div className="space-y-4">
              {highResults.map(r => (
                <ResultCard key={r.section.id} r={r} />
              ))}
            </div>
          </div>
        )}

        {/* Moderate results */}
        {moderateResults.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              Areas with Some Indicators
            </h2>
            <div className="space-y-4">
              {moderateResults.map(r => (
                <ResultCard key={r.section.id} r={r} />
              ))}
            </div>
          </div>
        )}

        {/* All low */}
        {highResults.length === 0 && moderateResults.length === 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-bold text-emerald-800 mb-1 text-lg">No significant indicators found</h3>
            <p className="text-sm text-emerald-700">
              Your responses suggest low likelihood of the SEND needs covered in this screener.
              If you have concerns, please speak to a SENCo or GP.
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
              {lowResults.map(r => (
                <div key={r.section.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={r.section.color}>{r.section.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{r.section.title}</span>
                  </div>
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">{r.pct}% — Low</span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Final legal disclaimer */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <div className="flex gap-2">
            <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>Disclaimer:</strong> This screener is for informational and educational purposes only. It does not
              constitute a medical, psychological, or educational diagnosis. Results are based entirely on self-reported
              responses and should be interpreted with caution. Only a qualified professional — such as an Educational
              Psychologist, GP, Psychiatrist, Paediatrician, or specialist assessor — can provide a formal diagnosis.
              If you are concerned about a child, please speak to their school's SENCo in the first instance.
              Questions are based on publicly available, validated clinical screening tools; this screener has not
              itself been independently validated.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Start Again
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-lg shadow-indigo-200"
          >
            Print / Save Results
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Result Card Component ─────────────────────────────────────────────────────
function ResultCard({ r }: { r: {
  section: Section;
  pct: number;
  level: "low" | "moderate" | "high";
  verdict: { headline: string; explanation: string; advice: string } | undefined;
  traits: string[];
}}) {
  const [expanded, setExpanded] = useState(true);
  const content = VERDICT_CONTENT[r.section.id];

  return (
    <div className={`rounded-2xl border-2 overflow-hidden ${r.section.borderColor}`}>
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className={`w-full flex items-center justify-between p-4 ${r.section.bgColor} text-left`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.section.accentColor} text-white`}>
            {r.section.icon}
          </div>
          <div>
            <p className={`font-bold text-sm ${r.section.color}`}>{r.verdict?.headline}</p>
            <p className="text-xs text-gray-500">{r.section.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            r.level === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
          }`}>{r.pct}%</span>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>

      {/* Card body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-5 space-y-4">

              {/* Evidence source */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <BookOpen className="w-3.5 h-3.5" />
                Based on: {content?.evidenceSource || r.section.evidenceSource}
              </div>

              {/* Why we think this — personalised */}
              {r.traits.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Why this area was flagged for you
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    You indicated that you experience the following traits <strong>often or always</strong>:
                  </p>
                  <ul className="space-y-1">
                    {r.traits.map(trait => (
                      <li key={trait} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="text-amber-500 mt-0.5 flex-shrink-0">▸</span>
                        <span className="capitalize">{trait}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-3 italic">
                    These specific traits are among the recognised indicators of {r.section.title.toLowerCase()} difficulties
                    in the clinical tools this screener is based on.
                  </p>
                </div>
              )}

              {/* What it means */}
              <div>
                <p className="text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">What this means</p>
                <p className="text-sm text-gray-600 leading-relaxed">{r.verdict?.explanation}</p>
              </div>

              {/* What is this condition */}
              {content?.whatItMeans && (
                <div className={`rounded-xl p-4 ${r.section.bgColor} border ${r.section.borderColor}`}>
                  <p className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: "inherit" }}>
                    <span className={r.section.color}>About {r.section.title}</span>
                  </p>
                  <p className={`text-xs leading-relaxed ${r.section.color}`}>{content.whatItMeans}</p>
                </div>
              )}

              {/* Next steps */}
              {content?.nextSteps && (
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Recommended next steps</p>
                  <ul className="space-y-1.5">
                    {content.nextSteps.map(step => (
                      <li key={step} className="flex items-start gap-2 text-xs text-gray-600">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Professional route */}
              {content?.professionalRoute && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-700">
                    <strong>Who to see:</strong> {content.professionalRoute}
                  </p>
                </div>
              )}

              {/* Reminder this is not a diagnosis */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  <strong>Remember:</strong> This result is a screening indicator, not a diagnosis. A high score means
                  these traits are present and worth exploring — it does not confirm you have this condition.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
