/**
 * lesson-planner-enhancements.ts — Improvements layered onto the Lesson Planner.
 *
 *  1. Adaptive teaching column — auto-generated per-pupil adaptations from passports
 *  2. Retrieval starter generator — picks 4 prior-topic questions (Rosenshine)
 *  3. Live timing & pacing widget (with "extend by 5 min" recompression)
 *  4. Resource bundle export (lesson + worksheet + slides + exit ticket + retrieval)
 *  5. Plan critique pass (Walkthru-style coaching mentor pass)
 */

const LESSON_HISTORY_KEY = "adaptly_lesson_topic_history_v1";

// ── 1. Adaptive teaching column ─────────────────────────────────────────────

export interface PupilForAdaptation {
  pupilId: string;
  name: string;
  needs: string[];           // e.g. ["dyslexia", "ADHD", "EAL Polish"]
  strategies?: string[];     // pre-loaded strategies from passport
}

export interface PupilAdaptation {
  pupilId: string;
  name: string;
  adaptations: string[];
}

const NEED_STRATEGIES: Array<{ rx: RegExp; strategies: string[] }> = [
  { rx: /dyslex/i,           strategies: ["Cream-coloured paper / overlay", "Sans-serif 14pt", "Pre-teach key vocab", "Coloured-line-by-line reader"] },
  { rx: /adhd/i,             strategies: ["Movement break every 12 min", "Chunk task into ≤3 sub-steps", "Visual now/next strip", "Fidget tool available"] },
  { rx: /asc|autism/i,       strategies: ["Visual schedule for the lesson", "Warn 5 min before transitions", "Quiet workspace option", "Literal language (avoid idioms)"] },
  { rx: /eal/i,              strategies: ["Bilingual word bank", "Image-supported vocab", "Sentence stems", "Allow first-language drafting"] },
  { rx: /slcn|speech|language/i, strategies: ["Pre-teach 5 key words with visuals", "Allow extra processing time (10s wait)", "Modelled sentence frames"] },
  { rx: /vi|visual\s+impair/i, strategies: ["Enlarged print 18pt+", "Tactile diagram / raised-line", "Read instructions aloud", "Front seat / good lighting"] },
  { rx: /hi|hearing\s+impair/i, strategies: ["Face the pupil when speaking", "Captioned media only", "Buddy check-in", "Reduce background noise"] },
  { rx: /sema|smebd|behav/i, strategies: ["Calm-corner pass available", "Pre-agreed exit signal", "First-then board", "Restorative micro-conversation"] },
  { rx: /dyspraxi|dcd/i,     strategies: ["Pencil grip / sloped writing surface", "Reduce written volume — accept verbal", "Pre-cut materials"] },
];

export function adaptationsFor(pupil: PupilForAdaptation): PupilAdaptation {
  const set = new Set<string>(pupil.strategies || []);
  for (const need of pupil.needs) {
    for (const { rx, strategies } of NEED_STRATEGIES) {
      if (rx.test(need)) strategies.forEach((s) => set.add(s));
    }
  }
  return { pupilId: pupil.pupilId, name: pupil.name, adaptations: Array.from(set) };
}

export function adaptationsForClass(pupils: PupilForAdaptation[]): PupilAdaptation[] {
  return pupils.map(adaptationsFor);
}

// ── 2. Retrieval starter ────────────────────────────────────────────────────

export interface RetrievalQuestion {
  topic: string;
  question: string;
  source: "this-term" | "last-term";
}

export function recordTaught(topic: string): void {
  try {
    const all = JSON.parse(localStorage.getItem(LESSON_HISTORY_KEY) || "[]") as { topic: string; at: number }[];
    all.push({ topic, at: Date.now() });
    localStorage.setItem(LESSON_HISTORY_KEY, JSON.stringify(all.slice(-300)));
  } catch {}
}

export function priorTopics(currentTopic?: string, days = 90): string[] {
  try {
    const cutoff = Date.now() - days * 86400_000;
    const all = (JSON.parse(localStorage.getItem(LESSON_HISTORY_KEY) || "[]") as { topic: string; at: number }[])
      .filter((r) => r.at >= cutoff && r.topic !== currentTopic);
    return Array.from(new Set(all.map((r) => r.topic))).slice(-12);
  } catch { return []; }
}

const RETRIEVAL_TEMPLATES = [
  (t: string) => `What is the key idea behind "${t}"?`,
  (t: string) => `Give one example of "${t}" in real life.`,
  (t: string) => `True or false: "${t}" only applies to one specific situation. Justify.`,
  (t: string) => `Compare "${t}" with the topic we did before it. One similarity, one difference.`,
];

export function retrievalStarter(currentTopic: string, n = 4): RetrievalQuestion[] {
  const prior = priorTopics(currentTopic);
  const out: RetrievalQuestion[] = [];
  for (let i = 0; i < n && i < prior.length; i++) {
    const t = prior[(prior.length - 1 - i) % prior.length];
    const tmpl = RETRIEVAL_TEMPLATES[i % RETRIEVAL_TEMPLATES.length];
    out.push({ topic: t, question: tmpl(t), source: i < 2 ? "this-term" : "last-term" });
  }
  return out;
}

// ── 3. Pacing widget ────────────────────────────────────────────────────────

export interface PacingSection {
  name: string;
  plannedMinutes: number;
}

export interface PacingState {
  startedAt: number;
  sections: (PacingSection & { startedAt: number; finishedAt?: number })[];
  currentIndex: number;
}

export function startPacing(sections: PacingSection[]): PacingState {
  return {
    startedAt: Date.now(),
    sections: sections.map((s, i) => ({ ...s, startedAt: i === 0 ? Date.now() : 0 })),
    currentIndex: 0,
  };
}

export function advancePacing(state: PacingState): PacingState {
  const s = { ...state };
  s.sections = s.sections.map((sec, i) => i === s.currentIndex ? { ...sec, finishedAt: Date.now() } : sec);
  s.currentIndex = Math.min(s.currentIndex + 1, s.sections.length - 1);
  s.sections = s.sections.map((sec, i) => i === s.currentIndex && !sec.startedAt ? { ...sec, startedAt: Date.now() } : sec);
  return s;
}

/** Add `extraMinutes` to the current section, redistribute the cost across the rest equally. */
export function extendCurrent(state: PacingState, extraMinutes: number): PacingState {
  const remainingCount = state.sections.length - state.currentIndex - 1;
  const cost = remainingCount > 0 ? extraMinutes / remainingCount : 0;
  return {
    ...state,
    sections: state.sections.map((s, i) => {
      if (i === state.currentIndex) return { ...s, plannedMinutes: s.plannedMinutes + extraMinutes };
      if (i > state.currentIndex)   return { ...s, plannedMinutes: Math.max(1, s.plannedMinutes - cost) };
      return s;
    }),
  };
}

// ── 4. Resource bundle export ───────────────────────────────────────────────

export interface ResourceBundleManifest {
  topic: string;
  yearGroup: string;
  generatedAt: string;
  files: { name: string; description: string; status: "linked" | "missing" }[];
}

export function buildBundleManifest(opts: {
  topic: string;
  yearGroup: string;
  has: { lesson: boolean; worksheet: boolean; slides: boolean; exitTicket: boolean; retrieval: boolean };
}): ResourceBundleManifest {
  return {
    topic: opts.topic,
    yearGroup: opts.yearGroup,
    generatedAt: new Date().toISOString(),
    files: [
      { name: "lesson-plan.txt",     description: "Full lesson plan",        status: opts.has.lesson     ? "linked" : "missing" },
      { name: "worksheet.pdf",       description: "Pupil worksheet",          status: opts.has.worksheet  ? "linked" : "missing" },
      { name: "slides.pptx",         description: "Presentation deck",        status: opts.has.slides     ? "linked" : "missing" },
      { name: "exit-ticket.txt",     description: "Plenary / exit ticket",    status: opts.has.exitTicket ? "linked" : "missing" },
      { name: "retrieval-starter.txt", description: "Retrieval-practice opener", status: opts.has.retrieval  ? "linked" : "missing" },
    ],
  };
}

// ── 5. Plan critique pass ───────────────────────────────────────────────────

export interface CritiqueSuggestion {
  area: "modelling" | "checking-for-understanding" | "scaffolding" | "challenge" | "transitions";
  suggestion: string;
}

const CRITIQUE_RULES: Array<{ test: (text: string) => boolean; suggestion: CritiqueSuggestion }> = [
  {
    test: (t) => !/i\s+do|teacher\s+models?|worked\s+example/i.test(t),
    suggestion: { area: "modelling", suggestion: "Add an explicit 'I do' / worked example before the 'we do' phase." },
  },
  {
    test: (t) => !/cold[\s-]*call|mini[-\s]?whiteboard|hinge\s+question|cfu/i.test(t),
    suggestion: { area: "checking-for-understanding", suggestion: "Add at least one CFU device — cold-call, mini-whiteboards, or a hinge question." },
  },
  {
    test: (t) => !/scaffold|sentence\s+frame|word\s+bank|model\s+answer/i.test(t),
    suggestion: { area: "scaffolding", suggestion: "Specify the scaffolds (sentence frames, word banks, model answers) — not just 'will be differentiated'." },
  },
  {
    test: (t) => !/stretch|challenge|extension|deeper/i.test(t),
    suggestion: { area: "challenge", suggestion: "Name the stretch task by name — 'extension' alone is too thin." },
  },
  {
    test: (t) => !/transition|tidy[\s-]*up|two[\s-]*minute\s+warning/i.test(t),
    suggestion: { area: "transitions", suggestion: "Plan the transitions explicitly: 2-min warning, packing-away routine, signal." },
  },
];

export function critiquePlan(text: string): CritiqueSuggestion[] {
  return CRITIQUE_RULES.filter(({ test }) => test(text)).map(({ suggestion }) => suggestion).slice(0, 3);
}
