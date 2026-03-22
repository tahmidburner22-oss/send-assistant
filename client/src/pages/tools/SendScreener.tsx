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
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, RotateCcw, AlertTriangle,
  CheckCircle2, Info, BookOpen, Brain, Eye, Activity,
  Calculator, MessageSquare, Heart, Lightbulb, ArrowRight,
  ExternalLink, Zap, Clock, FileDown, Printer, UserPlus, X,
  Save, PlayCircle
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
  /** Real-life example to help the person understand the question */
  example?: string;
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
      { id: "d1", text: "When reading a page of text, do you confuse visually similar words — for example misreading 'cat' as 'cot', 'was' as 'saw', or 'form' as 'from' — even in familiar material?", trait: "visual word confusion", example: "You're reading a recipe and read 'bake' as 'bike', or read a street sign as 'Bark Road' when it says 'Back Road'." },
      { id: "d2", text: "Do you regularly lose your place when reading, skip lines, or re-read the same line without realising it — even when concentrating hard?", trait: "losing place when reading", example: "You're reading a textbook and suddenly realise you've read the same paragraph twice, or you skip from line 3 to line 5 without noticing." },
      { id: "d3", text: "When you encounter an unfamiliar word, do you struggle to sound it out phonetically — for example breaking 'necessary' into 'nec-es-sa-ry' — even after years of reading practice?", trait: "phonological decoding difficulty", example: "You see the word 'phenomenon' in a science lesson and can't break it into sounds to read it aloud, so you skip it or guess." },
      { id: "d4", text: "When writing, do you find it hard to get your thoughts onto paper in a logical order, even when you know exactly what you want to say — as if the connection between thinking and writing is blocked?", trait: "written expression difficulty", example: "You can explain your ideas perfectly when talking to a friend, but when you sit down to write an essay, the words come out jumbled or you stare at a blank page." },
      { id: "d5", text: "Do you have persistent difficulty telling left from right without consciously thinking about it — for example when giving directions, following instructions, or reading maps?", trait: "left/right confusion", example: "Someone says 'turn left at the roundabout' and you have to hold up your hands to check which is left before turning." },
      { id: "d6", text: "When given a sequence of verbal instructions (e.g. 'go to the office, collect the register, then return to class'), do you need them repeated or written down to avoid forgetting steps?", trait: "working memory for verbal instructions", example: "Your teacher says 'open your book to page 42, answer questions 3 to 7, then swap with your partner' — and by the time you open the book, you've forgotten the page number." },
      { id: "d7", text: "Do you need to re-read paragraphs several times before the meaning becomes clear — not because the vocabulary is hard, but because the meaning doesn't 'stick' on first reading?", trait: "reading comprehension difficulty", example: "You read a paragraph in a history textbook and realise at the end that you have no idea what it just said, even though you understood each individual word." },
      { id: "d8", text: "When reading aloud, do you frequently stumble over words, mispronounce them, or lose your place — even with text you have read before?", trait: "reading fluency difficulty", example: "When asked to read aloud in class, you stumble over words like 'although' or 'through', even though you've seen them hundreds of times." },
      { id: "d9", text: "Did you find it significantly harder than peers to memorise sequences such as the alphabet, days of the week, or multiplication tables — even with repeated practice over months?", trait: "rote learning difficulty", example: "Your classmates learned the times tables in Year 3, but you still struggle to recall 7×8 without counting on your fingers." },
      { id: "d10", text: "Do you make spelling errors in words you have written hundreds of times — for example 'becuase', 'freind', or 'definately' — and find the correct spelling doesn't stick even after correction?", trait: "persistent spelling difficulty", example: "You write 'their' when you mean 'there' in every essay, and even after being corrected dozens of times, you still mix them up." },
      { id: "d11", text: "Do you find it difficult to copy text accurately from a board or book — losing your place between looking up and looking down, or making errors in the process?", trait: "copying accuracy difficulty", example: "When copying notes from the whiteboard, you keep losing your place and end up with missing words or lines that don't match what the teacher wrote." },
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
      { id: "a1", text: "How often do you struggle to finish the final details of a project once the interesting or challenging parts are done — leaving tasks 90% complete but never quite finished?", trait: "difficulty completing tasks", example: "You start a school project with loads of energy, but once the fun creative part is done, you never get around to writing the conclusion or tidying up the formatting." },
      { id: "a2", text: "How often do you find it genuinely difficult to organise multi-step tasks — for example, not knowing where to start, losing track of steps, or completing them in the wrong order?", trait: "organisational difficulty", example: "You have a homework assignment with 5 parts and you can't decide which to do first, so you end up doing bits of each and finishing none." },
      { id: "a3", text: "How often do you forget appointments, deadlines, or commitments — even ones you considered important — unless you use reminders or external systems?", trait: "forgetting commitments", example: "You completely forget about a dentist appointment even though you made it yourself last week, or you miss a homework deadline you knew about." },
      { id: "a4", text: "When faced with a task requiring sustained mental effort, how often do you delay starting it for hours or days — even when you know the delay is causing problems?", trait: "task initiation avoidance", example: "You know you need to start revising for an exam next week, but you keep putting it off and doing other things instead, even though it stresses you out." },
      { id: "a5", text: "How often do you feel physically restless when required to sit still for extended periods — tapping, fidgeting, shifting position, or feeling an urge to get up and move?", trait: "physical restlessness", example: "During a long lesson, you constantly tap your pen, bounce your leg, or feel like you need to get up and walk around the room." },
      { id: "a6", text: "How often do you feel internally driven or 'switched on' even when you want to slow down — as if your brain or body won't let you fully rest or switch off?", trait: "hyperactivity", example: "At bedtime, your mind races through ideas, plans, and random thoughts, and you can't seem to switch off even though you're exhausted." },
      { id: "a7", text: "How often do you make careless errors in routine or repetitive work — not because you lack the skill, but because your attention drifts before you've checked your work?", trait: "careless errors under low engagement", example: "You know how to do the maths, but you write 6 instead of 9 or skip a question entirely because your mind wandered while working through the sheet." },
      { id: "a8", text: "How often do you find your mind wandering during tasks that require sustained concentration — for example reading, listening to a lecture, or completing paperwork?", trait: "sustained attention difficulty", example: "You're in a lesson and suddenly realise you've been thinking about something completely unrelated for the last 10 minutes and missed everything the teacher said." },
      { id: "a9", text: "How often do you find yourself not fully absorbing what someone is saying during a conversation — even when you intend to listen and the topic is relevant to you?", trait: "listening attention difficulty", example: "A friend is telling you about their weekend and you nod along, but afterwards you can't remember any of the details they shared." },
      { id: "a10", text: "How often do you misplace everyday items — keys, phone, glasses, documents — and spend significant time searching for them?", trait: "losing objects", example: "You put your phone down somewhere in the house and spend 20 minutes searching every room, only to find it in the fridge or under a cushion." },
      { id: "a11", text: "How often does background noise, movement, or activity in your environment pull your attention away from what you are trying to focus on — even when you are trying hard to concentrate?", trait: "distractibility", example: "You're trying to do homework but someone walking past, a car outside, or a notification sound completely breaks your concentration every time." },
      { id: "a12", text: "How often do you act on impulse — speaking before thinking, interrupting others, or making decisions without fully considering the consequences?", trait: "impulsivity", example: "You blurt out an answer in class before the teacher finishes the question, or you buy something online without thinking about whether you can afford it." },
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
      { id: "s1", text: "I often notice small sounds that other people do not seem to notice — such as the hum of fluorescent lights, distant traffic, or a clock ticking — and find them distracting or distressing.", trait: "heightened auditory sensitivity", example: "In a quiet classroom, you can hear the buzzing of the lights or the ticking of a clock, and it bothers you so much you can't concentrate, while nobody else seems to notice." },
      { id: "s2", text: "When reading a story or watching a film, I find it difficult to work out what a character is feeling or what they intend to do next — I need it to be stated explicitly rather than implied.", trait: "difficulty inferring others' mental states", example: "You're watching a film and everyone else seems to know the character is lying, but you didn't pick up on it until someone explained the facial expression." },
      { id: "s3", text: "I have one or more areas of very deep, specific interest that I pursue with much greater intensity than most people — and I find it hard to understand why others don't share the same level of interest.", trait: "intense focused interests", example: "You know absolutely everything about trains, dinosaurs, or a specific video game — and you could talk about it for hours, but your friends lose interest after a few minutes." },
      { id: "s4", text: "I find it difficult to interpret facial expressions, tone of voice, or body language in real time — for example, I often can't tell if someone is annoyed, joking, or upset unless they say so directly.", trait: "difficulty reading facial expressions", example: "A teacher says 'That's fine' in a sharp tone, and you take it at face value, not realising they were actually annoyed with you." },
      { id: "s5", text: "I find social interactions genuinely exhausting — even enjoyable ones — and need significant time alone afterwards to recover and feel like myself again.", trait: "social exhaustion", example: "After a birthday party or a busy day at school, you feel completely drained and need to be alone in your room for hours to recover." },
      { id: "s6", text: "I strongly rely on routines and feel significant distress, anxiety, or anger when plans change unexpectedly — even small, seemingly minor changes can be very upsetting.", trait: "need for routine and predictability", example: "You always eat lunch at the same table, and when someone else sits there, it genuinely upsets you for the rest of the day." },
      { id: "s7", text: "I tend to interpret language literally and find sarcasm, irony, idioms, or jokes confusing — for example, 'break a leg' or 'it's raining cats and dogs' can be momentarily baffling.", trait: "literal language processing", example: "Someone says 'I'm dying of laughter' and for a split second you feel concerned, or a teacher says 'pull your socks up' and you look down at your feet." },
      { id: "s8", text: "I find unwritten social rules genuinely difficult to understand — for example, how long to maintain eye contact, when it's acceptable to interrupt, or how to know when a conversation is over.", trait: "difficulty with implicit social rules", example: "You keep talking to someone and don't realise they've been trying to leave the conversation for the last five minutes, or you're unsure whether to wave, shake hands, or hug when greeting someone." },
      { id: "s9", text: "Certain textures, lights, sounds, smells, or tastes cause me significant discomfort or distress — in ways that seem disproportionate to how others react to the same stimulus.", trait: "sensory sensitivity", example: "You can't wear certain fabrics because they feel unbearable on your skin, or the smell of the school canteen makes you feel physically sick." },
      { id: "s10", text: "I find it much easier and more comfortable to talk about factual topics, systems, or areas of interest than to discuss feelings, emotions, or abstract social concepts.", trait: "preference for factual over emotional conversation", example: "You can happily explain how an engine works or discuss football stats, but when someone asks 'How are you feeling?', you struggle to find the words." },
      { id: "s11", text: "I often replay social interactions afterwards, analysing what was said and worrying that I said or did something wrong — even when there is no evidence that anything went badly.", trait: "post-interaction social rumination", example: "After chatting with a group at lunch, you spend the whole evening replaying the conversation in your head, worrying you said something weird." },
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
      { id: "dp1", text: "Do you bump into furniture, trip over objects, or knock things over significantly more often than others seem to — even in familiar environments you know well?", trait: "clumsiness and collision", example: "You walk into the same door frame at home multiple times a week, or you knock your drink over at the dinner table so often your family expects it." },
      { id: "dp2", text: "Is your handwriting consistently untidy, inconsistent in letter size or spacing, or difficult for others to read — even when you are making a deliberate effort to write neatly?", trait: "handwriting difficulty", example: "Your teacher often can't read your answers in tests, and even when you try your hardest, the letters are different sizes and the lines are wonky." },
      { id: "dp3", text: "Do you find it takes significantly longer than others to learn new physical skills — such as riding a bike, swimming, or a new sport — even with repeated practice and instruction?", trait: "motor learning difficulty", example: "Your friends learned to ride a bike in a weekend, but it took you months of practice, and you still feel wobbly." },
      { id: "dp4", text: "Do you struggle with tasks requiring precise hand-eye coordination — such as catching or throwing a ball, using scissors accurately, threading a needle, or pouring liquid without spilling?", trait: "hand-eye coordination difficulty", example: "In PE, you regularly miss catches that others find easy, or when pouring a drink you often spill it over the side of the glass." },
      { id: "dp5", text: "Do you find it hard to judge distances, spaces, or proportions accurately — for example misjudging how much space you need when walking through a gap, parking, or fitting items into a bag?", trait: "spatial judgement difficulty", example: "You try to walk between two desks and clip your hip on one, or you misjudge how far away a step is and stumble." },
      { id: "dp6", text: "Do you find it difficult to carry out multi-step tasks in the correct order without losing track — for example following a recipe, assembling furniture, or getting ready in the morning?", trait: "sequencing difficulty", example: "When getting ready for school, you put your shoes on before your socks, or you forget to brush your teeth even though you do it every day." },
      { id: "dp7", text: "Do you find it hard to organise your thoughts into a clear, logical sequence when speaking or writing — jumping between ideas, losing the thread, or struggling to structure what you want to say?", trait: "cognitive sequencing difficulty", example: "When telling a friend about your weekend, you jump from Saturday evening to Sunday morning to Friday night, and they get confused." },
      { id: "dp8", text: "Do you find fine motor tasks — such as tying shoelaces, fastening small buttons, using cutlery, or writing for extended periods — noticeably more difficult or tiring than they seem to be for others?", trait: "fine motor difficulty", example: "You avoid shirts with small buttons because they take ages to fasten, or your hand aches badly after writing for just 10 minutes." },
      { id: "dp9", text: "Do you have difficulty with personal organisation — for example regularly forgetting equipment, struggling to keep a tidy workspace, or finding it hard to manage your belongings and time?", trait: "organisational and planning difficulty", example: "You regularly turn up to school without your PE kit, your bag is always a mess, and you can never find the right book when you need it." },
      { id: "dp10", text: "Do you find physical education, team sports, or activities requiring coordination (e.g. dance, gymnastics) significantly more challenging than academic subjects — and have you tended to avoid them?", trait: "gross motor and sport avoidance", example: "You dread PE lessons and always try to sit out, because team sports feel embarrassing when you can't keep up with everyone else." },
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
      { id: "dc1", text: "Do you find it very difficult to recall basic number facts automatically — for example that 7 × 8 = 56 or 9 + 6 = 15 — even after extensive practice, so that you still need to count or calculate each time?", trait: "number fact retrieval difficulty", example: "In a maths test, you still have to count on your fingers to work out 6+7, while everyone else seems to just know the answer instantly." },
      { id: "dc2", text: "Do you struggle to understand what a number actually represents in terms of quantity — for example, finding it hard to grasp that 347 is made up of 3 hundreds, 4 tens, and 7 units, or that 0.5 is the same as a half?", trait: "place value understanding difficulty", example: "When the teacher asks you to round 347 to the nearest hundred, you're not sure whether the answer is 300 or 400 because you can't picture what those numbers mean." },
      { id: "dc3", text: "Do you find it genuinely hard to estimate quantities without counting — for example, whether a crowd of 50 would fill a room, whether a price is reasonable, or roughly how long a journey will take?", trait: "quantity estimation difficulty", example: "Someone asks 'How many sweets are in the jar?' and you have absolutely no idea whether it's 20 or 200 — you can't even make a rough guess." },
      { id: "dc4", text: "Do you struggle with everyday money tasks — such as calculating change, estimating a total bill, splitting costs between people, or checking whether you've been charged correctly?", trait: "applied number difficulty", example: "You pay with a £10 note for something costing £6.50 and can't quickly work out that you should get £3.50 back." },
      { id: "dc5", text: "Do you find it difficult to read an analogue clock quickly and accurately — needing to count the positions of the hands rather than reading the time at a glance?", trait: "analogue time difficulty", example: "When someone points at a clock on the wall and asks the time, you need to count around from 12 to work out where the minute hand is pointing." },
      { id: "dc6", text: "Do you experience significant anxiety, panic, or a sense of mental 'shutdown' when faced with maths tasks — even straightforward ones like splitting a bill or calculating a percentage?", trait: "maths anxiety", example: "When the teacher says 'pop quiz on times tables', your mind goes completely blank and you feel panicky, even though you revised them last night." },
      { id: "dc7", text: "Do you find it difficult to hold a sequence of numbers in mind — for example, struggling to remember a phone number, PIN, or set of measurements long enough to use them?", trait: "number sequence memory difficulty", example: "Someone tells you a phone number and by the time you pick up your phone to type it in, you've already forgotten the first few digits." },
      { id: "dc8", text: "Do you confuse similar-looking mathematical symbols or operations — for example mixing up + and ×, < and >, or ÷ and − — especially under time pressure?", trait: "symbol confusion", example: "In a timed test, you accidentally multiply instead of add because the symbols look similar to you when you're rushing." },
      { id: "dc9", text: "Do you find it hard to understand the concept of fractions, decimals, or percentages — for example struggling to grasp that 1/4, 0.25, and 25% all represent the same amount?", trait: "fraction and proportion difficulty", example: "A shop says '25% off' and you can't work out how much you'd actually save, or you don't understand that half a pizza is the same as 0.5 of a pizza." },
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
      { id: "sl1", text: "Do you regularly experience word-finding difficulties when speaking — where the word you want is 'on the tip of your tongue' but won't come, causing you to pause, use a substitute word, or describe the word instead?", trait: "word-finding difficulty", example: "You want to say 'microscope' but the word won't come, so you say 'that thing you look through to see tiny stuff' instead." },
      { id: "sl2", text: "Do you struggle to follow multi-step verbal instructions without asking for them to be repeated or written down — for example, a sequence of three or more directions given verbally?", trait: "verbal instruction processing difficulty", example: "Your teacher says 'Put your books away, get out your planner, and write down tonight's homework' — and you only remember the first instruction." },
      { id: "sl3", text: "Do you find it significantly harder to follow conversations or instructions when there is background noise — such as in a classroom, canteen, or busy room — compared to a quiet environment?", trait: "auditory processing in noise", example: "In the noisy school canteen, you can't follow what your friend is saying even though they're sitting right next to you." },
      { id: "sl4", text: "Do you sometimes misunderstand what people say and respond in a way that seems off-topic or unexpected to them — suggesting you processed the words differently from what was intended?", trait: "language comprehension difficulty", example: "Someone asks 'Can you pass the time?' meaning 'What time is it?', and you start talking about how to make time go faster." },
      { id: "sl5", text: "Do you find it difficult to structure your sentences clearly when speaking — for example, trailing off mid-sentence, losing your train of thought, or struggling to express a complex idea verbally?", trait: "expressive language difficulty", example: "You start explaining something to a friend and halfway through the sentence you forget what you were going to say and trail off." },
      { id: "sl6", text: "Have others commented that your speech is difficult to understand — for example that you mumble, rush your words, mispronounce sounds, or are unclear in certain situations?", trait: "speech intelligibility difficulty", example: "People often ask you to repeat yourself, or your friends say 'What?' because you speak too fast or mumble without realising." },
      { id: "sl7", text: "Do you find non-literal language confusing — for example idioms ('bite the bullet'), metaphors ('she has a heart of gold'), or sarcasm — needing a moment to work out what was actually meant?", trait: "non-literal language difficulty", example: "Your teacher says 'Let's hit the books' and you momentarily picture actually hitting a book before realising they mean 'let's start studying'." },
      { id: "sl8", text: "Do you find conversational turn-taking difficult — either frequently talking over others, interrupting without realising, or struggling to know when it is your turn to speak?", trait: "conversational turn-taking difficulty", example: "In a group discussion, you either talk over people without meaning to, or you sit in silence because you can never find the right moment to speak." },
      { id: "sl9", text: "Do you find it hard to understand or use vocabulary at the level expected for your age — for example frequently encountering words you don't know, or struggling to use precise vocabulary when writing or speaking?", trait: "vocabulary knowledge difficulty", example: "In science, you hear words like 'photosynthesis' or 'evaporation' and they don't stick, even after the teacher has explained them several times." },
      { id: "sl10", text: "Do you find it difficult to retell a story, event, or explanation in a clear, logical sequence — often jumping between parts, leaving out key information, or confusing the listener?", trait: "narrative and sequencing difficulty", example: "You try to tell your mum about a film you watched, but you keep jumping between scenes and she says 'Wait, I'm confused — what happened first?'" },
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
      { id: "an1", text: "Over the past two weeks, how often have you felt persistently nervous, anxious, or on edge — not just in response to a specific event, but as a general background feeling?", trait: "persistent anxiety", example: "You wake up in the morning already feeling worried, even though nothing specific has happened — it's just a constant uneasy feeling in your stomach." },
      { id: "an2", text: "Over the past two weeks, how often have you found yourself unable to stop or control worrying — even when you know the worry is excessive or unlikely to be helpful?", trait: "uncontrollable worry", example: "You keep worrying about a test next week even though you've revised, and you can't stop the thoughts even when you try to distract yourself." },
      { id: "an3", text: "Over the past two weeks, how often have you felt unable to relax or 'switch off' — even in situations that should feel safe, calm, or enjoyable?", trait: "inability to relax", example: "You're watching your favourite TV show at home but you still feel tense and can't enjoy it because your mind keeps racing." },
      { id: "an4", text: "Over the past two weeks, how often have you felt so restless or keyed up that it is hard to sit still — feeling a physical tension or agitation that is difficult to settle?", trait: "anxious restlessness", example: "You're sitting in class and your body feels tight and jittery — you can't stop shifting in your seat and your muscles feel tense." },
      { id: "an5", text: "Over the past two weeks, how often have you become easily irritable or short-tempered — reacting more strongly than the situation warrants, and finding it hard to manage your emotional responses?", trait: "anxiety-driven irritability", example: "Your sibling asks you a simple question and you snap at them, then feel bad about it afterwards because it wasn't a big deal." },
      { id: "an6", text: "Over the past two weeks, how often have you felt a sense of dread or fear that something awful is about to happen — even when there is no clear or immediate threat?", trait: "anticipatory fear", example: "You're having a normal day but suddenly get a strong feeling that something terrible is about to happen, even though everything is fine." },
      { id: "an7", text: "Do you regularly avoid situations, places, or activities because of anxiety — for example, social situations, school, crowded places, or anything that might trigger worry or discomfort?", trait: "anxiety avoidance", example: "You skip a friend's party because the thought of being in a room full of people makes you feel sick, even though you wanted to go." },
      { id: "an8", text: "Do you experience physical symptoms of anxiety in everyday situations — such as a racing heart, difficulty breathing, sweating, stomach aches, headaches, or a feeling of unreality?", trait: "somatic anxiety symptoms", example: "Before school, you get stomach aches or feel like you can't breathe properly, even though nothing specific is worrying you." },
      { id: "an9", text: "Do you find yourself spending significant time worrying about things that might go wrong in the future — replaying scenarios, planning for worst cases, or struggling to stop 'what if' thinking?", trait: "future-focused worry", example: "You lie in bed thinking 'What if I fail the exam? What if my friends don't like me? What if something bad happens?' and you can't stop." },
      { id: "an10", text: "Has anxiety, worry, or fear significantly affected your ability to attend school or work, maintain friendships, or take part in activities you would otherwise enjoy?", trait: "anxiety impact on functioning", example: "You've missed several days of school this term because the anxiety was so bad you couldn't get out of bed, or you've stopped going to clubs you used to love." },
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
      { id: "ml1", text: "Does it take significantly longer than peers to learn and consolidate new concepts or skills — requiring many more repetitions, examples, and explanations before the learning is secure?", trait: "slow acquisition of new learning", example: "The rest of the class grasps a new topic after one lesson, but you need the teacher to explain it three or four more times before it starts to make sense." },
      { id: "ml2", text: "Is it hard to retain new information over time — for example, appearing to understand something in a lesson but having little or no recall of it the following week, even after practice?", trait: "retention difficulty", example: "You understood how to do long division on Monday, but by the following Monday it's as if you've never seen it before." },
      { id: "ml3", text: "Is it difficult to apply knowledge learned in one context to a different situation — for example, understanding a maths concept in maths but not recognising how to use it in science or everyday life?", trait: "transfer of learning difficulty", example: "You can calculate percentages in maths class, but when a shop says '30% off', you don't connect it to the same skill." },
      { id: "ml4", text: "Are abstract concepts — such as fractions, metaphors, cause and effect, or the passage of time — particularly difficult to understand, even with concrete examples and repeated explanation?", trait: "abstract reasoning difficulty", example: "You struggle to understand why characters in a story behave the way they do, or you find it hard to grasp ideas like 'democracy' or 'fairness' without very concrete examples." },
      { id: "ml5", text: "Is it hard to work independently on tasks without step-by-step adult support — for example, not knowing how to start, getting stuck quickly, or needing frequent reassurance and prompting?", trait: "independence in learning difficulty", example: "When the teacher says 'work on this independently', you sit staring at the page not knowing where to begin, and you need someone to guide you through each step." },
      { id: "ml6", text: "Is it difficult to keep up with the pace of lessons, discussions, or group activities — often still processing earlier information when the class has moved on?", trait: "processing speed difficulty", example: "The teacher has moved on to the next topic, but you're still trying to understand the previous point and feel left behind." },
      { id: "ml7", text: "Is reading and writing at a noticeably lower level than expected for the person's age — for example, reading age being 2 or more years behind chronological age?", trait: "below age-expected literacy", example: "You're in Year 9 but find it easier to read books aimed at Year 6 or 7, and your written work looks much simpler than your classmates'." },
      { id: "ml8", text: "Is it hard to plan and organise work without significant adult support — for example, struggling to know where to start, how to structure a response, or how to break a task into steps?", trait: "planning and organisation difficulty", example: "When given an essay to write, you don't know how to plan it or what order to put things in, and you need someone to create a step-by-step plan for you." },
      { id: "ml9", text: "Does the person have difficulty understanding and using subject-specific vocabulary across the curriculum — for example, struggling with terms like 'hypothesis', 'chronological', or 'denominator'?", trait: "curriculum vocabulary difficulty", example: "Words like 'evaluate', 'analyse', or 'justify' in exam questions confuse you because you're not sure what they're actually asking you to do." },
      { id: "ml10", text: "Is there a noticeable gap between what the person seems to understand verbally in conversation and what they are able to produce independently in written work or assessments?", trait: "verbal-written performance gap", example: "You can explain your ideas really well when talking to the teacher, but when you write them down in a test, the answer is much shorter and less detailed." },
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

const CANT_SAY_VALUE = -1;

// ─── Scoring ──────────────────────────────────────────────────────────────────
function getPercentage(answers: Record<string, number>, section: Section): number {
  // Exclude "Can't Say" answers from scoring
  const answeredQuestions = section.questions.filter(q => {
    const val = answers[q.id];
    return val !== undefined && val !== CANT_SAY_VALUE;
  });
  const maxScore = answeredQuestions.length * 4;
  if (maxScore === 0) return 0;
  const score = answeredQuestions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
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

/**
 * Plain-English rewrites of every screener question.
 * Each version is written at approximately Year 5 reading age:
 * short sentences, common words, no subordinate clauses or em-dash asides.
 * The old approach (regex stripping) just removed examples without
 * touching the actual sentence complexity — these are genuine rewrites.
 */
const SIMPLIFIED_QUESTIONS: Record<string, string> = {
  // ── Dyslexia ──────────────────────────────────────────────────────────────
  d1:  "Do you sometimes read a word wrong, even though you have seen it before?",
  d2:  "Do you often lose your place when reading, or read the same line twice by accident?",
  d3:  "Is it hard to sound out a new word you have never seen before?",
  d4:  "Is it hard to write down your ideas in order, even when you know what you want to say?",
  d5:  "Do you find it hard to tell left from right without thinking about it carefully?",
  d6:  "Do you need instructions repeated or written down so you do not forget them?",
  d7:  "Do you need to read the same paragraph more than once before you understand it?",
  d8:  "Do you stumble over words or lose your place when reading out loud?",
  d9:  "Was it much harder for you than for other people to learn things like the alphabet or times tables?",
  d10: "Do you keep spelling the same words wrong, even words you have written many times before?",
  d11: "Do you find it hard to copy from a board or book without losing your place or making mistakes?",
  // ── ADHD ──────────────────────────────────────────────────────────────────
  a1:  "Do you often leave tasks almost finished but never quite done?",
  a2:  "Is it hard to plan a task that has lots of steps?",
  a3:  "Do you forget appointments or deadlines, even important ones?",
  a4:  "Do you put off starting hard tasks for a long time, even when you know you should start?",
  a5:  "Do you feel fidgety or restless when you have to sit still for a long time?",
  a6:  "Does your brain feel like it is always switched on, even when you want to relax?",
  a7:  "Do you make careless mistakes in work because your mind drifts before you check it?",
  a8:  "Does your mind wander during tasks that need you to concentrate?",
  a9:  "Do you sometimes miss what someone is saying, even though you are trying to listen?",
  a10: "Do you often lose everyday things like your phone, keys, or bag?",
  a11: "Does background noise or movement easily pull your attention away from what you are doing?",
  a12: "Do you act or speak without thinking first, and then wish you had waited?",
  // ── ASC ───────────────────────────────────────────────────────────────────
  s1:  "Do you notice small sounds that other people do not seem to hear, and find them distracting?",
  s2:  "Is it hard to work out how a character in a book or film is feeling unless it is spelled out?",
  s3:  "Do you have one or two topics you are very deeply interested in, much more than most people?",
  s4:  "Is it hard to tell if someone is annoyed, joking, or upset just from their face or voice?",
  s5:  "Do you feel very tired after spending time with other people, even if you enjoyed it?",
  s6:  "Do you find it very upsetting when plans change without warning?",
  s7:  "Do people sometimes say you have taken something the wrong way, or that you missed a joke?",
  s8:  "Are the unwritten rules of social situations confusing to you?",
  s9:  "Do certain textures, lights, sounds, smells, or tastes bother you much more than they seem to bother other people?",
  s10: "Is it much easier to talk about facts or hobbies than to talk about feelings?",
  s11: "After talking with people, do you replay the conversation and worry that you said something wrong?",
  // ── Dyspraxia ─────────────────────────────────────────────────────────────
  dp1: "Do you bump into things or knock things over much more than other people do?",
  dp2: "Is your handwriting hard to read, even when you are trying your best?",
  dp3: "Does it take you much longer than others to learn physical skills like riding a bike?",
  dp4: "Is it hard to catch a ball, use scissors neatly, or pour a drink without spilling?",
  dp5: "Do you often misjudge distances, like how much space you need to walk through a gap?",
  dp6: "Do you get confused doing tasks in the right order, like following a recipe?",
  dp7: "Is it hard to tell a story or explain something in the right order?",
  dp8: "Do fine motor tasks like tying laces or doing up buttons take you much longer than others?",
  dp9: "Do you regularly forget equipment, or find it hard to keep your things organised?",
  dp10:"Is sport or PE much harder for you than other subjects, and do you try to avoid it?",
  // ── Dyscalculia ───────────────────────────────────────────────────────────
  dc1: "Is it hard to remember basic number facts like times tables, even after lots of practice?",
  dc2: "Is it hard to understand what a number means, like knowing what 347 looks like as an amount?",
  dc3: "Is it hard to make a rough guess about an amount without counting?",
  dc4: "Do you find it hard to work out change, split a bill, or check if a price is correct?",
  dc5: "Do you need to count around a clock to read the time, rather than knowing it straight away?",
  dc6: "Do maths tasks make you feel very anxious or cause your mind to go blank?",
  dc7: "Is it hard to hold a string of numbers in your head, like a phone number or PIN?",
  dc8: "Do you mix up maths symbols like + and ×, or < and >?",
  dc9: "Is it hard to understand fractions, decimals, or percentages?",
  // ── SLCN ──────────────────────────────────────────────────────────────────
  sl1: "Do you often know what word you want to say, but it will not come out?",
  sl2: "Do you struggle to follow three or more instructions given one after another?",
  sl3: "Is it much harder to understand people when there is background noise?",
  sl4: "Do you sometimes reply in a way that surprises people, because you understood them differently?",
  sl5: "Do you often lose track of what you are saying halfway through a sentence?",
  sl6: "Have people said they find it hard to understand you when you speak?",
  sl7: "Do you find phrases like 'break a leg' or 'hit the books' confusing at first?",
  sl8: "Is it hard to know when it is your turn to speak, so you either talk over people or stay silent?",
  sl9: "Do you often come across words you do not know, or find it hard to find the right word when writing?",
  sl10:"Is it hard to retell a story or explain an event in the right order?",
  // ── Anxiety ───────────────────────────────────────────────────────────────
  an1: "In the past two weeks, have you felt nervous or anxious most of the time?",
  an2: "In the past two weeks, have you been unable to stop worrying, even when you tried?",
  an3: "In the past two weeks, have you found it hard to relax, even in safe or calm situations?",
  an4: "In the past two weeks, have you felt so tense or restless that it was hard to sit still?",
  an5: "In the past two weeks, have you snapped at people more than usual?",
  an6: "In the past two weeks, have you felt like something awful was about to happen, even with no reason?",
  an7: "Do you avoid places or situations because of anxiety?",
  an8: "Do you get physical symptoms like a racing heart, stomach aches, or headaches because of worry?",
  an9: "Do you spend a lot of time thinking about things that might go wrong in the future?",
  an10:"Has worry or anxiety stopped you going to school, seeing friends, or doing things you enjoy?",
  // ── MLD ───────────────────────────────────────────────────────────────────
  ml1: "Does it take much longer than other people to learn something new?",
  ml2: "Do you understand something in a lesson but then find you have forgotten it the next week?",
  ml3: "Is it hard to use something you learned in one lesson when it comes up in a different subject?",
  ml4: "Are abstract ideas like fractions, metaphors, or cause and effect hard to grasp?",
  ml5: "Do you need an adult to guide you through each step of a task, rather than working on your own?",
  ml6: "Do you often feel left behind because the class moves on before you have understood the last point?",
  ml7: "Is your reading or writing noticeably behind what is expected for your age?",
  ml8: "Is it hard to plan a piece of writing or a task without a lot of adult help?",
  ml9: "Do subject words like 'evaluate', 'hypothesis', or 'denominator' confuse you in lessons or exams?",
  ml10:"Can you explain your ideas well when talking, but then find it hard to write the same thing down?",
};

/** Returns a plain-English rewrite of the question, or falls back to the original */
function simplifyText(text: string, id?: string): string {
  if (id && SIMPLIFIED_QUESTIONS[id]) return SIMPLIFIED_QUESTIONS[id];
  // Fallback: strip the longest subordinate clause patterns if no mapped version
  return text
    .replace(/— for example[^—]*—/g, "")
    .replace(/ — even when [^.?]*/g, "")
    .replace(/ — even [^.?]*/g, "")
    .replace(/ \(e\.g\.[^)]*\)/g, "")
    .replace(/ for example,[^,.]*/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/  +/g, " ")
    .trim()
    .replace(/,\s*$/, "?")
    .replace(/([^?!.])$/, "$1?");
}

// ─── Component ──────────────────────────────────────────────────
export default function SendScreener() {
  const { children, assignWork, updateAssignment } = useApp();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"intro" | "mode-select" | "questions" | "results">("intro");
  const [screenerMode, setScreenerMode] = useState<ScreenerMode>("full");
  const [simplifiedLanguage, setSimplifiedLanguage] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [direction, setDirection] = useState<1 | -1>(1);
  const [justAnswered, setJustAnswered] = useState(false);
  // Text size / reading age adjustment for accessibility
  const [questionTextSize, setQuestionTextSize] = useState<"sm" | "base" | "lg" | "xl">("base");
  // Assign-to-child dialog state
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignedChildId, setAssignedChildId] = useState("");
  const [assignSuccess, setAssignSuccess] = useState(false);
  // Save progress state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveChildId, setSaveChildId] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [allowHomeResume, setAllowHomeResume] = useState(false);
  // Track the assignment ID used for save-progress (so we can update it, not create duplicates)
  const [progressAssignmentId, setProgressAssignmentId] = useState<string | null>(null);
  const [progressAssignmentChildId, setProgressAssignmentChildId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Active question set depends on mode
  const activeQuestions = screenerMode === "quick" ? QUICK_QUESTIONS : ALL_QUESTIONS;
  const totalQ = screenerMode === "quick" ? QUICK_TOTAL : TOTAL_QUESTIONS;

  const currentItem = activeQuestions[currentQuestionIndex];
  const currentAnswer = currentItem ? answers[currentItem.question.id] : undefined;
  const progress = (currentQuestionIndex / totalQ) * 100;

  // Auto-advance after answering
  // Restore in-progress state from ?resume= URL param (set by parent portal)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get("resume");
      if (raw) {
        const saved = JSON.parse(decodeURIComponent(raw));
        if (saved.answers) setAnswers(saved.answers);
        if (saved.currentQuestionIndex) setCurrentQuestionIndex(saved.currentQuestionIndex);
        if (saved.mode) setScreenerMode(saved.mode);
        setStep("questions");
        // Clean URL so refresh doesn't re-trigger
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch {}
  }, []);

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
    setShowSaveDialog(false);
    setSaveSuccess(false);
    setProgressAssignmentId(null);
    setProgressAssignmentChildId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Save in-progress screener answers against a child
  async function handleSaveProgress() {
    if (!saveChildId) return;
    setSavingProgress(true);
    const progressData = JSON.stringify({
      mode: screenerMode,
      answers,
      currentQuestionIndex,
      savedAt: new Date().toISOString(),
      allowHomeResume,
    });
    const progressPct = Math.round((currentQuestionIndex / totalQ) * 100);
    try {
      if (progressAssignmentId && progressAssignmentChildId === saveChildId) {
        // Update existing progress assignment
        await updateAssignment(saveChildId, progressAssignmentId, {
          content: progressData,
          status: "started",
          progress: progressPct,
        });
      } else {
        // Create a new progress assignment
        const result = await (await import("@/lib/api")).pupils.createAssignment(saveChildId, {
          title: `SEND Screener — In Progress (${screenerMode === "quick" ? "Quick" : "Full"}) — ${new Date().toLocaleDateString("en-GB")}`,
          type: "send-screener-progress",
          content: progressData,
        });
        setProgressAssignmentId(result.id);
        setProgressAssignmentChildId(saveChildId);
        // Also update status and progress via updateAssignment
        await updateAssignment(saveChildId, result.id, { status: "started", progress: progressPct });
      }
      setSaveSuccess(true);
    } catch (e) {
      console.error("Failed to save screener progress", e);
    } finally {
      setSavingProgress(false);
    }
  }

  // Resume a saved screener from a child's assignment
  function handleResumeScreener(childId: string, assignment: any) {
    try {
      const data = JSON.parse(assignment.content);
      setScreenerMode(data.mode || "full");
      setAnswers(data.answers || {});
      setCurrentQuestionIndex(data.currentQuestionIndex || 0);
      setProgressAssignmentId(assignment.id);
      setProgressAssignmentChildId(childId);
      setSaveChildId(childId);
      setStep("questions");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error("Failed to parse screener progress", e);
    }
  }

  // Find children with in-progress screener assignments
  const inProgressScreeners = children.flatMap(child =>
    child.assignments
      .filter(a => a.type === "send-screener-progress" && a.status === "started")
      .map(a => ({ child, assignment: a }))
  );

  // Build a plain-text summary for PDF / assign
  function buildResultsSummary(): string {
    const results = SECTIONS.map(section => {
      const pct = getPercentage(answers, section);
      const level = getLevel(pct, section);
      return `${section.title}: ${level.toUpperCase()} (${pct}%)`;
    });
    return [
      `SEND Screener Results — ${screenerMode === "quick" ? "Quick" : "Full"} Screener`,
      `Date: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
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
    // If there's an existing in-progress assignment for this child, update it to completed
    if (progressAssignmentId && progressAssignmentChildId === assignedChildId) {
      await updateAssignment(assignedChildId, progressAssignmentId, {
        title: `SEND Screener Results (${screenerMode === "quick" ? "Quick" : "Full"}) — ${new Date().toLocaleDateString("en-GB")}`,
        content: summary,
        status: "completed",
        progress: 100,
      } as any);
    } else {
      await assignWork(assignedChildId, {
        title: `SEND Screener Results (${screenerMode === "quick" ? "Quick" : "Full"}) — ${new Date().toLocaleDateString("en-GB")}`,
        type: "send-screener",
        content: summary,
      });
    }
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

          {/* Key adult recommendation */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-5">
            <div className="flex gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-900 mb-1">⭐ Recommended: Complete with a Key Adult</p>
                <p className="text-sm text-blue-800 leading-relaxed">
                  For best results, we <strong>strongly recommend</strong> that younger pupils or those with
                  communication difficulties complete this screener alongside a <strong>trusted key adult</strong> —
                  such as their SENCO, form tutor, or teaching assistant. The key adult can help read questions aloud,
                  clarify meaning, and ensure responses accurately reflect the pupil's experiences across all settings.
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

          {/* Resume in-progress screeners */}
          {inProgressScreeners.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-3 flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4" /> Saved Progress — Resume where you left off
              </p>
              <div className="space-y-2">
                {inProgressScreeners.map(({ child, assignment }) => {
                  let savedAt = "";
                  try { savedAt = JSON.parse(assignment.content)?.savedAt ? new Date(JSON.parse(assignment.content).savedAt).toLocaleDateString("en-GB") : ""; } catch {}
                  return (
                    <button
                      key={assignment.id}
                      onClick={() => handleResumeScreener(child.id, assignment)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-left transition-all"
                    >
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                        {child.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{child.name}</p>
                        <p className="text-xs text-gray-500">{assignment.progress ?? 0}% complete{savedAt ? ` · saved ${savedAt}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold flex-shrink-0">
                        <PlayCircle className="w-4 h-4" /> Resume
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <button
            onClick={() => setStep("mode-select")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-indigo-200 active:scale-95"
          >
            Start Screener
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-center text-xs text-gray-400">
            Answer based on <strong>consistent, long-standing patterns</strong> — not just recent days or a difficult week.
            Think across the whole school year or longer. For younger pupils or those with communication needs,
            a <strong>key adult</strong> who knows the pupil well should complete this alongside them.
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

          {/* Reading age / text size accessibility control */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Accessibility — Question Text Size
            </p>
            <p className="text-xs text-blue-700">Increase the text size if the pupil has a lower reading age or finds smaller text harder to read.</p>
            <div className="flex gap-2">
              {(["sm", "base", "lg", "xl"] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setQuestionTextSize(size)}
                  className={`flex-1 py-2 rounded-lg border-2 font-medium transition-all ${
                    questionTextSize === size
                      ? "border-blue-500 bg-blue-100 text-blue-800"
                      : "border-transparent bg-white text-gray-500 hover:border-blue-200"
                  }`}
                  style={{ fontSize: size === "sm" ? 11 : size === "base" ? 13 : size === "lg" ? 15 : 18 }}
                >
                  {size === "sm" ? "Small" : size === "base" ? "Normal" : size === "lg" ? "Large" : "X-Large"}
                </button>
              ))}
            </div>
          </div>
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

        {/* Reading Age / Accessibility Controls */}
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${section.bgColor} ${section.color} border ${section.borderColor}`}>
            {section.icon}
            {section.title} — Q{questionNumberInSection} of {questionsPerSection}
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">Text size</span>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={["sm","base","lg","xl"].indexOf(questionTextSize)}
              onChange={e => setQuestionTextSize((["sm","base","lg","xl"] as const)[Number(e.target.value)])}
              className="w-16 accent-indigo-600"
            />
            <span className="text-[10px] font-bold text-indigo-600 w-5 text-center">
              {questionTextSize === "sm" ? "S" : questionTextSize === "base" ? "M" : questionTextSize === "lg" ? "L" : "XL"}
            </span>
          </div>
        </div>

        {/* Simplified language toggle */}
        <div className="mb-4">
          <button
            onClick={() => setSimplifiedLanguage(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              simplifiedLanguage
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
            }`}
          >
            <span>{simplifiedLanguage ? "✓" : "💬"}</span>
            {simplifiedLanguage ? "Simple language ON" : "Simplify language"}
          </button>
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
              <p className={`font-semibold text-gray-900 leading-relaxed ${
                questionTextSize === "sm" ? "text-sm" :
                questionTextSize === "lg" ? "text-lg" :
                questionTextSize === "xl" ? "text-xl" :
                "text-base"
              }`}>
                {simplifiedLanguage ? simplifyText(question.text, question.id) : question.text}
              </p>
              {question.example && (
                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-xs font-medium text-indigo-700 mb-0.5">Real-life example:</p>
                  <p className={`text-indigo-600 leading-relaxed ${
                    questionTextSize === "xl" ? "text-sm" : "text-xs"
                  }`}>{question.example}</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2 italic">
                Consider the whole school year or longer — consistent patterns, not just a difficult week
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
              {/* Can't Say option for self-report questions */}
              <motion.button
                onClick={() => handleAnswer(question.id, CANT_SAY_VALUE)}
                whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                  currentAnswer === CANT_SAY_VALUE
                    ? "bg-gray-600 border-transparent text-white shadow-lg"
                    : "bg-white border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${currentAnswer === CANT_SAY_VALUE ? "text-white" : "text-gray-600"}`}>
                    Can't Say
                  </p>
                  <p className={`text-xs mt-0.5 ${currentAnswer === CANT_SAY_VALUE ? "text-white/80" : "text-gray-400"}`}>
                    I'm not sure or this doesn't apply to me
                  </p>
                </div>
                {currentAnswer === CANT_SAY_VALUE && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Back + Save Progress buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {children.length > 0 && (
            <button
              onClick={() => { setShowSaveDialog(true); setSaveSuccess(false); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Progress
            </button>
          )}
        </div>

        {/* Save Progress Dialog */}
        <AnimatePresence>
          {showSaveDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
              onClick={e => { if (e.target === e.currentTarget) setShowSaveDialog(false); }}
            >
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Save Progress</h3>
                  <button onClick={() => setShowSaveDialog(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {saveSuccess ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">Progress saved!</p>
                    <p className="text-sm text-gray-500 mt-1">You can resume this screener from the home screen.</p>
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
                    >
                      Continue Screener
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">Select which pupil this screener is for. Progress will be saved and you can resume later.</p>
                    <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                      {children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => setSaveChildId(child.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            saveChildId === child.id
                              ? "border-amber-500 bg-amber-50"
                              : "border-gray-200 hover:border-amber-300"
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                            {child.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{child.name}</p>
                            <p className="text-xs text-gray-500">Year {child.yearGroup}</p>
                          </div>
                          {saveChildId === child.id && (
                            <CheckCircle2 className="w-5 h-5 text-amber-600 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSaveProgress}
                      disabled={!saveChildId || savingProgress}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-bold transition-colors"
                    >
                      {savingProgress ? "Saving..." : "Save Progress"}
                    </button>
                    {/* Teacher permission toggle */}
                    <button
                      onClick={() => setAllowHomeResume(v => !v)}
                      className={`mt-3 w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${allowHomeResume ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-gray-50"}`}
                    >
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${allowHomeResume ? "text-indigo-800" : "text-gray-700"}`}>Allow parent to resume at home</p>
                        <p className="text-xs text-gray-500 mt-0.5">Parent will see a Resume button in their portal</p>
                      </div>
                      <div className={`w-10 h-6 rounded-full flex items-center transition-all ${allowHomeResume ? "bg-indigo-500" : "bg-gray-300"}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow mx-1 transition-transform ${allowHomeResume ? "translate-x-4" : ""}`} />
                      </div>
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
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
    <div className="max-w-2xl mx-auto px-4 py-8" ref={resultsRef}>
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
                if (!resultsRef.current) return;
                // Open a new window for print-to-PDF (reliable cross-browser approach)
                const openPrintWindow = (html: string) => {
                  const printWindow = window.open("", "_blank", "width=900,height=700,scrollbars=yes");
                  if (!printWindow) {
                    alert("Please allow pop-ups for this site to save as PDF.");
                    return;
                  }
                  printWindow.document.open();
                  printWindow.document.write(html);
                  printWindow.document.close();
                };
                const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SEND Screener Results</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #1f2937; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4 portrait; margin: 15mm 18mm; }
    @media screen { body { padding: 20mm; max-width: 794px; margin: 0 auto; } }
    @media print { .no-print { display: none !important; } }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: #111827; }
    h2 { font-size: 16px; font-weight: 700; margin: 16px 0 8px; color: #111827; }
    p { font-size: 13px; color: #374151; margin-bottom: 6px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .badge-high { background: #fee2e2 !important; color: #b91c1c; }
    .badge-moderate { background: #fef3c7 !important; color: #b45309; }
    .badge-low { background: #d1fae5 !important; color: #065f46; }
    .result-card { margin-bottom: 14px; padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 10px; page-break-inside: avoid; break-inside: avoid; }
    .result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .result-title { font-size: 14px; font-weight: 700; color: #111827; }
    .result-subtitle { font-size: 11px; color: #6b7280; margin-bottom: 6px; }
    .headline { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 4px; }
    .explanation { font-size: 12px; color: #4b5563; margin-bottom: 4px; }
    .advice { font-size: 12px; color: #374151; background: #f9fafb !important; padding: 6px 10px; border-radius: 6px; border-left: 3px solid #6366f1; }
    .traits-box { background: #f9fafb !important; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; margin: 6px 0; }
    .traits-title { font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .trait-item { font-size: 11px; color: #4b5563; margin-bottom: 2px; }
    .next-steps { margin: 6px 0; }
    .next-steps li { font-size: 12px; color: #4b5563; margin-bottom: 3px; }
    .pro-route { background: #eef2ff !important; border: 1px solid #c7d2fe; border-radius: 6px; padding: 6px 10px; font-size: 12px; color: #4338ca; margin-top: 6px; }
    .disclaimer { background: #fef3c7 !important; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 12px; color: #92400e; }
    .overview-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .overview-bar-label { font-size: 12px; color: #374151; min-width: 140px; }
    .overview-bar-track { flex: 1; height: 10px; background: #f3f4f6; border-radius: 99px; overflow: hidden; }
    .overview-bar-fill { height: 100%; border-radius: 99px; }
    .overview-bar-fill-high { background: #f87171 !important; }
    .overview-bar-fill-moderate { background: #fbbf24 !important; }
    .overview-bar-fill-low { background: #34d399 !important; }
    .overview-bar-pct { font-size: 11px; font-weight: 700; min-width: 60px; text-align: right; }
    .section-divider { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <h1>SEND Screener Results</h1>
  <p style="color:#6b7280;margin-bottom:4px;">${screenerMode === "quick" ? "Quick Screener" : "Full Screener"} &mdash; ${new Date().toLocaleDateString("en-GB")}</p>
  <div class="disclaimer"><strong>&#9888;&#65039; This is NOT a diagnosis.</strong> These results are screening indicators only. Only a qualified professional (Educational Psychologist, GP, Psychiatrist, or specialist assessor) can provide a formal diagnosis. Results are based on self-reported responses.</div>
  <h2>Overview</h2>
  ${results.map(r => `
    <div class="overview-bar-row">
      <span class="overview-bar-label">${r.section.title}</span>
      <div class="overview-bar-track"><div class="overview-bar-fill overview-bar-fill-${r.level}" style="width:${r.pct}%"></div></div>
      <span class="overview-bar-pct badge badge-${r.level}">${r.level === "high" ? "High" : r.level === "moderate" ? "Moderate" : "Low"} &bull; ${r.pct}%</span>
    </div>`).join("")}
  <hr class="section-divider" />
  ${results.filter(r => r.level !== "low").length > 0 ? `<h2>Areas with Indicators</h2>` : ""}
  ${results.filter(r => r.level !== "low").map(r => {
    const content = VERDICT_CONTENT[r.section.id];
    return `<div class="result-card">
      <div class="result-header">
        <span class="result-title">${r.section.title}</span>
        <span class="badge badge-${r.level}">${r.level === "high" ? "High" : "Moderate"} &bull; ${r.pct}%</span>
      </div>
      <div class="result-subtitle">${r.section.subtitle} &bull; Based on: ${r.section.evidenceSource}</div>
      ${r.verdict ? `<div class="headline">${r.verdict.headline}</div><div class="explanation">${r.verdict.explanation}</div><div class="advice"><strong>Advice:</strong> ${r.verdict.advice}</div>` : ""}
      ${r.traits.length > 0 ? `<div class="traits-box"><div class="traits-title">Flagged traits</div>${r.traits.map(t => `<div class="trait-item">&#9658; ${t}</div>`).join("")}</div>` : ""}
      ${content?.nextSteps ? `<div class="next-steps"><strong style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Recommended next steps</strong><ul style="padding-left:16px;margin-top:4px;">${content.nextSteps.map(s => `<li>${s}</li>`).join("")}</ul></div>` : ""}
      ${content?.professionalRoute ? `<div class="pro-route"><strong>Who to see:</strong> ${content.professionalRoute}</div>` : ""}
    </div>`;
  }).join("")}
  ${results.filter(r => r.level === "low").length > 0 ? `
    <h2>Low Indicator Areas</h2>
    ${results.filter(r => r.level === "low").map(r => `
      <div class="result-card" style="border-color:#d1fae5;">
        <div class="result-header">
          <span class="result-title">${r.section.title}</span>
          <span class="badge badge-low">Low &bull; ${r.pct}%</span>
        </div>
        ${r.verdict ? `<div class="explanation">${r.verdict.explanation}</div>` : ""}
      </div>`).join("")}` : ""}
  <div class="footer">
    <span>Generated by Adaptly SEND Screener (adaptly.co.uk)</span>
    <span>For educational and informational purposes only</span>
  </div>
  <script>
    window.addEventListener('load', function() { setTimeout(function() { window.print(); }, 600); });
  </script>
</body>
</html>`;
                openPrintWindow(html);
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
              Assign to a Pupil
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

          {/* Row 4: Generate SMART Targets from high/moderate areas */}
          {(highResults.length > 0 || moderateResults.length > 0) && (
            <button
              onClick={() => {
                // Build pre-population data from high and moderate indicator areas
                const flaggedAreas = [...highResults, ...moderateResults].map(r => ({
                  area: r.section.title,
                  level: r.level,
                  traits: r.traits,
                  advice: r.verdict?.advice || "",
                }));
                const baseline = flaggedAreas.map(a =>
                  `${a.area} (${a.level === "high" ? "High" : "Moderate"} indicator): ${a.traits.slice(0, 2).join("; ")}.`
                ).join("\n");
                sessionStorage.setItem("screener_smart_targets_prefill", JSON.stringify({
                  baseline,
                  sendNeed: highResults[0]?.section.id || moderateResults[0]?.section.id || "",
                  notes: `Screened ${new Date().toLocaleDateString("en-GB")} — areas flagged: ${flaggedAreas.map(a => a.area).join(", ")}.`,
                }));
                setLocation("/tools/smart-targets");
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors shadow-lg shadow-violet-200"
            >
              <Zap className="w-4 h-4" />
              Generate SMART Targets from Results
            </button>
          )}
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
                  <h3 className="font-bold text-gray-900 text-lg">Assign to a Pupil</h3>
                  <button onClick={() => setShowAssignDialog(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {assignSuccess ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">Results assigned!</p>
                    <p className="text-sm text-gray-500 mt-1">The screener results have been added to the pupil's profile.</p>
                    <button
                      onClick={() => setShowAssignDialog(false)}
                      className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">Select which pupil to assign these screener results to. They will appear in the pupil's profile under Assignments.</p>
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
                Based on: {r.section.evidenceSource}
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
