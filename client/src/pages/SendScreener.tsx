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
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, RotateCcw, AlertTriangle,
  CheckCircle2, Info, BookOpen, Brain, Eye, Activity,
  Calculator, MessageSquare, Heart, Lightbulb, ArrowRight,
  ExternalLink, Zap, Clock, FileDown, Printer, UserPlus, X
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";

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
      { id: "d1", text: "When reading a page of text, do you confuse visually similar words — for example misreading 'cat' as 'cot', 'was' as 'saw', or 'form' as 'from' — even in familiar material?", trait: "visual word confusion" },
      { id: "d2", text: "Do you regularly lose your place when reading, skip lines, or re-read the same line without realising it — even when concentrating hard?", trait: "losing place when reading" },
      { id: "d3", text: "When you encounter an unfamiliar word, do you struggle to sound it out phonetically — for example breaking 'necessary' into 'nec-es-sa-ry' — even after years of reading practice?", trait: "phonological decoding difficulty" },
      { id: "d4", text: "When writing, do you find it hard to get your thoughts onto paper in a logical order, even when you know exactly what you want to say — as if the connection between thinking and writing is blocked?", trait: "written expression difficulty" },
      { id: "d5", text: "Do you have persistent difficulty telling left from right without consciously thinking about it — for example when giving directions, following instructions, or reading maps?", trait: "left/right confusion" },
      { id: "d6", text: "When given a sequence of verbal instructions (e.g. 'go to the office, collect the register, then return to class'), do you need them repeated or written down to avoid forgetting steps?", trait: "working memory for verbal instructions" },
      { id: "d7", text: "Do you need to re-read paragraphs several times before the meaning becomes clear — not because the vocabulary is hard, but because the meaning doesn't 'stick' on first reading?", trait: "reading comprehension difficulty" },
      { id: "d8", text: "When reading aloud, do you frequently stumble over words, mispronounce them, or lose your place — even with text you have read before?", trait: "reading fluency difficulty" },
      { id: "d9", text: "Did you find it significantly harder than peers to memorise sequences such as the alphabet, days of the week, or multiplication tables — even with repeated practice over months?", trait: "rote learning difficulty" },
      { id: "d10", text: "Do you make spelling errors in words you have written hundreds of times — for example 'becuase', 'freind', or 'definately' — and find the correct spelling doesn't stick even after correction?", trait: "persistent spelling difficulty" },
      { id: "d11", text: "Do you find it difficult to copy text accurately from a board or book — losing your place between looking up and looking down, or making errors in the process?", trait: "copying accuracy difficulty" },
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
      { id: "a1", text: "How often do you struggle to finish the final details of a project once the interesting or challenging parts are done — leaving tasks 90% complete but never quite finished?", trait: "difficulty completing tasks" },
      { id: "a2", text: "How often do you find it genuinely difficult to organise multi-step tasks — for example, not knowing where to start, losing track of steps, or completing them in the wrong order?", trait: "organisational difficulty" },
      { id: "a3", text: "How often do you forget appointments, deadlines, or commitments — even ones you considered important — unless you use reminders or external systems?", trait: "forgetting commitments" },
      { id: "a4", text: "When faced with a task requiring sustained mental effort, how often do you delay starting it for hours or days — even when you know the delay is causing problems?", trait: "task initiation avoidance" },
      { id: "a5", text: "How often do you feel physically restless when required to sit still for extended periods — tapping, fidgeting, shifting position, or feeling an urge to get up and move?", trait: "physical restlessness" },
      { id: "a6", text: "How often do you feel internally driven or 'switched on' even when you want to slow down — as if your brain or body won't let you fully rest or switch off?", trait: "hyperactivity" },
      { id: "a7", text: "How often do you make careless errors in routine or repetitive work — not because you lack the skill, but because your attention drifts before you've checked your work?", trait: "careless errors under low engagement" },
      { id: "a8", text: "How often do you find your mind wandering during tasks that require sustained concentration — for example reading, listening to a lecture, or completing paperwork?", trait: "sustained attention difficulty" },
      { id: "a9", text: "How often do you find yourself not fully absorbing what someone is saying during a conversation — even when you intend to listen and the topic is relevant to you?", trait: "listening attention difficulty" },
      { id: "a10", text: "How often do you misplace everyday items — keys, phone, glasses, documents — and spend significant time searching for them?", trait: "losing objects" },
      { id: "a11", text: "How often does background noise, movement, or activity in your environment pull your attention away from what you are trying to focus on — even when you are trying hard to concentrate?", trait: "distractibility" },
      { id: "a12", text: "How often do you act on impulse — speaking before thinking, interrupting others, or making decisions without fully considering the consequences?", trait: "impulsivity" },
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
      { id: "s1", text: "I often notice small sounds that other people do not seem to notice — such as the hum of fluorescent lights, distant traffic, or a clock ticking — and find them distracting or distressing.", trait: "heightened auditory sensitivity" },
      { id: "s2", text: "When reading a story or watching a film, I find it difficult to work out what a character is feeling or what they intend to do next — I need it to be stated explicitly rather than implied.", trait: "difficulty inferring others' mental states" },
      { id: "s3", text: "I have one or more areas of very deep, specific interest that I pursue with much greater intensity than most people — and I find it hard to understand why others don't share the same level of interest.", trait: "intense focused interests" },
      { id: "s4", text: "I find it difficult to interpret facial expressions, tone of voice, or body language in real time — for example, I often can't tell if someone is annoyed, joking, or upset unless they say so directly.", trait: "difficulty reading facial expressions" },
      { id: "s5", text: "I find social interactions genuinely exhausting — even enjoyable ones — and need significant time alone afterwards to recover and feel like myself again.", trait: "social exhaustion" },
      { id: "s6", text: "I strongly rely on routines and feel significant distress, anxiety, or anger when plans change unexpectedly — even small, seemingly minor changes can be very upsetting.", trait: "need for routine and predictability" },
      { id: "s7", text: "I tend to interpret language literally and find sarcasm, irony, idioms, or jokes confusing — for example, 'break a leg' or 'it's raining cats and dogs' can be momentarily baffling.", trait: "literal language processing" },
      { id: "s8", text: "I find unwritten social rules genuinely difficult to understand — for example, how long to maintain eye contact, when it's acceptable to interrupt, or how to know when a conversation is over.", trait: "difficulty with implicit social rules" },
      { id: "s9", text: "Certain textures, lights, sounds, smells, or tastes cause me significant discomfort or distress — in ways that seem disproportionate to how others react to the same stimulus.", trait: "sensory sensitivity" },
      { id: "s10", text: "I find it much easier and more comfortable to talk about factual topics, systems, or areas of interest than to discuss feelings, emotions, or abstract social concepts.", trait: "preference for factual over emotional conversation" },
      { id: "s11", text: "I often replay social interactions afterwards, analysing what was said and worrying that I said or did something wrong — even when there is no evidence that anything went badly.", trait: "post-interaction social rumination" },
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
      { id: "dp1", text: "Do you bump into furniture, trip over objects, or knock things over significantly more often than others seem to — even in familiar environments you know well?", trait: "clumsiness and collision" },
      { id: "dp2", text: "Is your handwriting consistently untidy, inconsistent in letter size or spacing, or difficult for others to read — even when you are making a deliberate effort to write neatly?", trait: "handwriting difficulty" },
      { id: "dp3", text: "Do you find it takes significantly longer than others to learn new physical skills — such as riding a bike, swimming, or a new sport — even with repeated practice and instruction?", trait: "motor learning difficulty" },
      { id: "dp4", text: "Do you struggle with tasks requiring precise hand-eye coordination — such as catching or throwing a ball, using scissors accurately, threading a needle, or pouring liquid without spilling?", trait: "hand-eye coordination difficulty" },
      { id: "dp5", text: "Do you find it hard to judge distances, spaces, or proportions accurately — for example misjudging how much space you need when walking through a gap, parking, or fitting items into a bag?", trait: "spatial judgement difficulty" },
      { id: "dp6", text: "Do you find it difficult to carry out multi-step tasks in the correct order without losing track — for example following a recipe, assembling furniture, or getting ready in the morning?", trait: "sequencing difficulty" },
      { id: "dp7", text: "Do you find it hard to organise your thoughts into a clear, logical sequence when speaking or writing — jumping between ideas, losing the thread, or struggling to structure what you want to say?", trait: "cognitive sequencing difficulty" },
      { id: "dp8", text: "Do you find fine motor tasks — such as tying shoelaces, fastening small buttons, using cutlery, or writing for extended periods — noticeably more difficult or tiring than they seem to be for others?", trait: "fine motor difficulty" },
      { id: "dp9", text: "Do you have difficulty with personal organisation — for example regularly forgetting equipment, struggling to keep a tidy workspace, or finding it hard to manage your belongings and time?", trait: "organisational and planning difficulty" },
      { id: "dp10", text: "Do you find physical education, team sports, or activities requiring coordination (e.g. dance, gymnastics) significantly more challenging than academic subjects — and have you tended to avoid them?", trait: "gross motor and sport avoidance" },
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
      { id: "dc1", text: "Do you find it very difficult to recall basic number facts automatically — for example that 7 × 8 = 56 or 9 + 6 = 15 — even after extensive practice, so that you still need to count or calculate each time?", trait: "number fact retrieval difficulty" },
      { id: "dc2", text: "Do you struggle to understand what a number actually represents in terms of quantity — for example, finding it hard to grasp that 347 is made up of 3 hundreds, 4 tens, and 7 units, or that 0.5 is the same as a half?", trait: "place value understanding difficulty" },
      { id: "dc3", text: "Do you find it genuinely hard to estimate quantities without counting — for example, whether a crowd of 50 would fill a room, whether a price is reasonable, or roughly how long a journey will take?", trait: "quantity estimation difficulty" },
      { id: "dc4", text: "Do you struggle with everyday money tasks — such as calculating change, estimating a total bill, splitting costs between people, or checking whether you've been charged correctly?", trait: "applied number difficulty" },
      { id: "dc5", text: "Do you find it difficult to read an analogue clock quickly and accurately — needing to count the positions of the hands rather than reading the time at a glance?", trait: "analogue time difficulty" },
      { id: "dc6", text: "Do you experience significant anxiety, panic, or a sense of mental 'shutdown' when faced with maths tasks — even straightforward ones like splitting a bill or calculating a percentage?", trait: "maths anxiety" },
      { id: "dc7", text: "Do you find it difficult to hold a sequence of numbers in mind — for example, struggling to remember a phone number, PIN, or set of measurements long enough to use them?", trait: "number sequence memory difficulty" },
      { id: "dc8", text: "Do you confuse similar-looking mathematical symbols or operations — for example mixing up + and ×, < and >, or ÷ and − — especially under time pressure?", trait: "symbol confusion" },
      { id: "dc9", text: "Do you find it hard to understand the concept of fractions, decimals, or percentages — for example struggling to grasp that 1/4, 0.25, and 25% all represent the same amount?", trait: "fraction and proportion difficulty" },
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
      { id: "sl1", text: "Do you regularly experience word-finding difficulties when speaking — where the word you want is 'on the tip of your tongue' but won't come, causing you to pause, use a substitute word, or describe the word instead?", trait: "word-finding difficulty" },
      { id: "sl2", text: "Do you struggle to follow multi-step verbal instructions without asking for them to be repeated or written down — for example, a sequence of three or more directions given verbally?", trait: "verbal instruction processing difficulty" },
      { id: "sl3", text: "Do you find it significantly harder to follow conversations or instructions when there is background noise — such as in a classroom, canteen, or busy room — compared to a quiet environment?", trait: "auditory processing in noise" },
      { id: "sl4", text: "Do you sometimes misunderstand what people say and respond in a way that seems off-topic or unexpected to them — suggesting you processed the words differently from what was intended?", trait: "language comprehension difficulty" },
      { id: "sl5", text: "Do you find it difficult to structure your sentences clearly when speaking — for example, trailing off mid-sentence, losing your train of thought, or struggling to express a complex idea verbally?", trait: "expressive language difficulty" },
      { id: "sl6", text: "Have others commented that your speech is difficult to understand — for example that you mumble, rush your words, mispronounce sounds, or are unclear in certain situations?", trait: "speech intelligibility difficulty" },
      { id: "sl7", text: "Do you find non-literal language confusing — for example idioms ('bite the bullet'), metaphors ('she has a heart of gold'), or sarcasm — needing a moment to work out what was actually meant?", trait: "non-literal language difficulty" },
      { id: "sl8", text: "Do you find conversational turn-taking difficult — either frequently talking over others, interrupting without realising, or struggling to know when it is your turn to speak?", trait: "conversational turn-taking difficulty" },
      { id: "sl9", text: "Do you find it hard to understand or use vocabulary at the level expected for your age — for example frequently encountering words you don't know, or struggling to use precise vocabulary when writing or speaking?", trait: "vocabulary knowledge difficulty" },
      { id: "sl10", text: "Do you find it difficult to retell a story, event, or explanation in a clear, logical sequence — often jumping between parts, leaving out key information, or confusing the listener?", trait: "narrative and sequencing difficulty" },
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
      { id: "an1", text: "Over the past two weeks, how often have you felt persistently nervous, anxious, or on edge — not just in response to a specific event, but as a general background feeling?", trait: "persistent anxiety" },
      { id: "an2", text: "Over the past two weeks, how often have you found yourself unable to stop or control worrying — even when you know the worry is excessive or unlikely to be helpful?", trait: "uncontrollable worry" },
      { id: "an3", text: "Over the past two weeks, how often have you felt unable to relax or 'switch off' — even in situations that should feel safe, calm, or enjoyable?", trait: "inability to relax" },
      { id: "an4", text: "Over the past two weeks, how often have you felt so restless or keyed up that it is hard to sit still — feeling a physical tension or agitation that is difficult to settle?", trait: "anxious restlessness" },
      { id: "an5", text: "Over the past two weeks, how often have you become easily irritable or short-tempered — reacting more strongly than the situation warrants, and finding it hard to manage your emotional responses?", trait: "anxiety-driven irritability" },
      { id: "an6", text: "Over the past two weeks, how often have you felt a sense of dread or fear that something awful is about to happen — even when there is no clear or immediate threat?", trait: "anticipatory fear" },
      { id: "an7", text: "Do you regularly avoid situations, places, or activities because of anxiety — for example, social situations, school, crowded places, or anything that might trigger worry or discomfort?", trait: "anxiety avoidance" },
      { id: "an8", text: "Do you experience physical symptoms of anxiety in everyday situations — such as a racing heart, difficulty breathing, sweating, stomach aches, headaches, or a feeling of unreality?", trait: "somatic anxiety symptoms" },
      { id: "an9", text: "Do you find yourself spending significant time worrying about things that might go wrong in the future — replaying scenarios, planning for worst cases, or struggling to stop 'what if' thinking?", trait: "future-focused worry" },
      { id: "an10", text: "Has anxiety, worry, or fear significantly affected your ability to attend school or work, maintain friendships, or take part in activities you would otherwise enjoy?", trait: "anxiety impact on functioning" },
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
      { id: "ml1", text: "Does it take significantly longer than peers to learn and consolidate new concepts or skills — requiring many more repetitions, examples, and explanations before the learning is secure?", trait: "slow acquisition of new learning" },
      { id: "ml2", text: "Is it hard to retain new information over time — for example, appearing to understand something in a lesson but having little or no recall of it the following week, even after practice?", trait: "retention difficulty" },
      { id: "ml3", text: "Is it difficult to apply knowledge learned in one context to a different situation — for example, understanding a maths concept in maths but not recognising how to use it in science or everyday life?", trait: "transfer of learning difficulty" },
      { id: "ml4", text: "Are abstract concepts — such as fractions, metaphors, cause and effect, or the passage of time — particularly difficult to understand, even with concrete examples and repeated explanation?", trait: "abstract reasoning difficulty" },
      { id: "ml5", text: "Is it hard to work independently on tasks without step-by-step adult support — for example, not knowing how to start, getting stuck quickly, or needing frequent reassurance and prompting?", trait: "independence in learning difficulty" },
      { id: "ml6", text: "Is it difficult to keep up with the pace of lessons, discussions, or group activities — often still processing earlier information when the class has moved on?", trait: "processing speed difficulty" },
      { id: "ml7", text: "Is reading and writing at a noticeably lower level than expected for the person's age — for example, reading age being 2 or more years behind chronological age?", trait: "below age-expected literacy" },
      { id: "ml8", text: "Is it hard to plan and organise work without significant adult support — for example, struggling to know where to start, how to structure a response, or how to break a task into steps?", trait: "planning and organisation difficulty" },
      { id: "ml9", text: "Does the person have difficulty understanding and using subject-specific vocabulary across the curriculum — for example, struggling with terms like 'hypothesis', 'chronological', or 'denominator'?", trait: "curriculum vocabulary difficulty" },
      { id: "ml10", text: "Is there a noticeable gap between what the person seems to understand verbally in conversation and what they are able to produce independently in written work or assessments?", trait: "verbal-written performance gap" },
    ],
  },
];

const RESPONSE_OPTIONS = [
  { value: 0, label: "Never", description: "This doesn't apply" },
  { value: 1, label: "Rarely", description: "Occasionally" },
  { value: 2, label: "Sometimes", description: "Fairly regularly" },
  { value: 3, label: "Often", description: "Most of the time" },
  { value: 4, label: "Always", description: "Constantly" },
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

// ─── Quick screener — first 3 questions per section ──────────────────────────
const QUICK_QUESTIONS: Array<{ question: Question; section: Section; indexInSection: number }> = [];
SECTIONS.forEach(section => {
  section.questions.slice(0, 3).forEach((question, indexInSection) => {
    QUICK_QUESTIONS.push({ question, section, indexInSection });
  });
});
const QUICK_TOTAL = QUICK_QUESTIONS.length; // 8 sections × 3 = 24

type ScreenerMode = "quick" | "full";

// ─── Component ──────────────────────────────────────────────────
export default function SendScreener() {
  const { children, assignWork } = useApp();
  const [step, setStep] = useState<"intro" | "mode-select" | "questions" | "results">("intro");
  const [screenerMode, setScreenerMode] = useState<ScreenerMode>("full");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [direction, setDirection] = useState<1 | -1>(1);
  const [justAnswered, setJustAnswered] = useState(false);
  // Assign-to-child dialog state
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignedChildId, setAssignedChildId] = useState("");
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Active question set depends on mode
  const activeQuestions = screenerMode === "quick" ? QUICK_QUESTIONS : ALL_QUESTIONS;
  const totalQ = screenerMode === "quick" ? QUICK_TOTAL : TOTAL_QUESTIONS;

  const currentItem = activeQuestions[currentQuestionIndex];
  const currentAnswer = currentItem ? answers[currentItem.question.id] : undefined;
  const progress = (currentQuestionIndex / totalQ) * 100;

  // Auto-advance after answering
  useEffect(() => {
    if (justAnswered && currentAnswer !== undefined) {
      const timer = setTimeout(() => {
        if (currentQuestionIndex < totalQ - 1) {
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
  }, [justAnswered, currentAnswer, currentQuestionIndex, totalQ]);

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
    setScreenerMode("full");
    setAssignSuccess(false);
    setShowAssignDialog(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Build a plain-text summary for PDF / assign
  function buildResultsSummary(): string {
    const results = SECTIONS.map(section => {
      const pct = getPercentage(answers, section);
      const level = getLevel(pct, section);
      return `${section.title}: ${level.toUpperCase()} (${pct}%)`;
    });
    return [
      `SEND Screener Results — ${screenerMode === "quick" ? "Quick" : "Full"} Screener`,
      `Date: ${new Date().toLocaleDateString("en-GB")}`,
      "",
      "IMPORTANT: This is NOT a diagnosis. These are screening indicators only.",
      "Only a qualified professional can provide a formal diagnosis.",
      "",
      ...results,
      "",
      "Generated by Adaptly SEND Screener (adaptly.co.uk)",
    ].join("\n");
  }

  async function handleAssignToChild() {
    if (!assignedChildId) return;
    const summary = buildResultsSummary();
    await assignWork(assignedChildId, {
      title: `SEND Screener Results (${screenerMode === "quick" ? "Quick" : "Full"}) — ${new Date().toLocaleDateString("en-GB")}`,
      type: "worksheet",
      content: summary,
    });
    setAssignSuccess(true);
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
            onClick={() => setStep("mode-select")}
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

  // ── Mode Select ───────────────────────────────────────────────────
  if (step === "mode-select") {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Choose Screener Length</h2>
            <p className="text-sm text-gray-500">Select how much time you have</p>
          </div>

          {/* Non-diagnosis reminder */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Reminder:</strong> Neither version is a clinical diagnosis. Results are screening indicators only — a high score means traits are present that are worth exploring with a qualified professional.
            </p>
          </div>

          {/* Quick option */}
          <button
            onClick={() => { setScreenerMode("quick"); setCurrentQuestionIndex(0); setAnswers({}); setStep("questions"); }}
            className="w-full text-left bg-white border-2 border-emerald-300 hover:border-emerald-500 rounded-2xl p-5 transition-all shadow-sm hover:shadow-md active:scale-[0.99] group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 text-base">Quick Screener</h3>
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">~5 minutes</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">3 key questions per area — 24 questions total across all 8 SEND areas.</p>
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                  <strong>Note:</strong> The quick screener gives a broad overview but is <strong>less accurate</strong> than the full version. Fewer questions means some indicators may be missed. For a more thorough picture, use the Full Screener.
                </p>
              </div>
            </div>
          </button>

          {/* Full option */}
          <button
            onClick={() => { setScreenerMode("full"); setCurrentQuestionIndex(0); setAnswers({}); setStep("questions"); }}
            className="w-full text-left bg-white border-2 border-indigo-300 hover:border-indigo-500 rounded-2xl p-5 transition-all shadow-sm hover:shadow-md active:scale-[0.99] group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 text-base">Full Screener</h3>
                  <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">~20 minutes</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{TOTAL_QUESTIONS} in-depth questions across all 8 SEND areas — the complete evidence-based screener.</p>
                <p className="text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-200">
                  <strong>Recommended:</strong> More questions means a more accurate and detailed profile. Best used when you have time to reflect carefully on each question.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStep("intro")}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
          >
            ← Back
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Questions ───────────────────────────────────────────────────
  if (step === "questions") {
    const { question, section, indexInSection } = currentItem;
    const questionsPerSection = screenerMode === "quick" ? 3 : section.questions.length;

    // Find which section number we're in
    const sectionIndex = SECTIONS.findIndex(s => s.id === section.id);
    const questionsInPreviousSections = SECTIONS.slice(0, sectionIndex).reduce(
      (sum, s) => sum + (screenerMode === "quick" ? 3 : s.questions.length), 0
    );
    const questionNumberInSection = indexInSection + 1;

    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Top progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{section.title}</span>
              {screenerMode === "quick" && (
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Quick</span>
              )}
            </div>
            <span>{currentQuestionIndex + 1} / {totalQ}</span>
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
              const qPerSec = screenerMode === "quick" ? 3 : s.questions.length;
              const sStart = SECTIONS.slice(0, i).reduce((sum, sec) => sum + (screenerMode === "quick" ? 3 : sec.questions.length), 0);
              const sEnd = sStart + qPerSec;
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
          {section.title} — Q{questionNumberInSection} of {questionsPerSection}
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
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-sm text-gray-500">{totalQ} questions · 8 areas screened</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              screenerMode === "quick" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
            }`}>
              {screenerMode === "quick" ? "Quick Screener" : "Full Screener"}
            </span>
          </div>
          {screenerMode === "quick" && (
            <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
              Quick screener results are indicative only. For a more accurate profile, consider taking the Full Screener.
            </p>
          )}
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
        <div className="space-y-3">
          {/* Row 1: Save PDF + Print */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const printWindow = window.open("", "_blank");
                if (!printWindow) return;
                const resultsHtml = results.map(r => `
                  <div style="margin-bottom:12px;padding:10px;border:1px solid #e5e7eb;border-radius:8px;">
                    <strong>${r.section.title}</strong> —
                    <span style="color:${r.level==="high"?"#dc2626":r.level==="moderate"?"#d97706":"#16a34a"}">
                      ${r.level.toUpperCase()} (${r.pct}%)
                    </span>
                    ${r.verdict ? `<p style="margin:4px 0 0;font-size:13px;color:#374151;">${r.verdict.headline}</p>` : ""}
                  </div>`).join("");
                printWindow.document.write(`
                  <!DOCTYPE html><html><head>
                  <title>SEND Screener Results</title>
                  <style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#111;}
                  h1{font-size:22px;margin-bottom:4px;}p{font-size:13px;color:#555;}
                  .disclaimer{background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:12px;margin:16px 0;font-size:12px;}
                  .footer{margin-top:24px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px;}
                  </style></head><body>
                  <h1>SEND Screener Results</h1>
                  <p>${screenerMode === "quick" ? "Quick Screener" : "Full Screener"} — ${new Date().toLocaleDateString("en-GB")}</p>
                  <div class="disclaimer"><strong>⚠️ This is NOT a diagnosis.</strong> These results are screening indicators only. Only a qualified professional (Educational Psychologist, GP, Psychiatrist, or specialist assessor) can provide a formal diagnosis.</div>
                  ${resultsHtml}
                  <div class="footer">Generated by Adaptly SEND Screener (adaptly.co.uk) — For educational and informational purposes only.</div>
                  </body></html>`);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => printWindow.print(), 500);
              }}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Save as PDF
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>

          {/* Row 2: Assign to Child */}
          {children.length > 0 && (
            <button
              onClick={() => { setShowAssignDialog(true); setAssignSuccess(false); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-lg shadow-indigo-200"
            >
              <UserPlus className="w-4 h-4" />
              Assign to a Child
            </button>
          )}

          {/* Row 3: Start Again */}
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Start Again
          </button>
        </div>

        {/* Assign to Child Dialog */}
        <AnimatePresence>
          {showAssignDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
              onClick={e => { if (e.target === e.currentTarget) setShowAssignDialog(false); }}
            >
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Assign to a Child</h3>
                  <button onClick={() => setShowAssignDialog(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {assignSuccess ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">Results assigned!</p>
                    <p className="text-sm text-gray-500 mt-1">The screener results have been added to the child's profile.</p>
                    <button
                      onClick={() => setShowAssignDialog(false)}
                      className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">Select which child to assign these screener results to. They will appear in the child's profile under Assignments.</p>
                    <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                      {children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => setAssignedChildId(child.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            assignedChildId === child.id
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                            {child.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{child.name}</p>
                            <p className="text-xs text-gray-500">Year {child.yearGroup}</p>
                          </div>
                          {assignedChildId === child.id && (
                            <CheckCircle2 className="w-5 h-5 text-indigo-600 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleAssignToChild}
                      disabled={!assignedChildId}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-bold transition-colors"
                    >
                      Assign Results
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
