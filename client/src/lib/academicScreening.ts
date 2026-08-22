export type AcademicSubject = "mathematics" | "english" | "science";
export type AssessmentDuration = 15 | 30 | 60;
export type QuestionKind = "multiple-choice" | "short-answer";

export interface ScreeningItem {
  id: string;
  subject: AcademicSubject;
  domain: string;
  kind: QuestionKind;
  prompt: string;
  context?: string;
  options?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
}

export interface ScreeningConfig {
  subject: AcademicSubject;
  yearGroup: string;
  duration: AssessmentDuration;
}

export interface DomainResult {
  domain: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface ScreeningReport {
  score: number;
  total: number;
  percentage: number;
  timeTakenSeconds: number;
  domainResults: DomainResult[];
  strengths: string[];
  focusAreas: string[];
  revisionTips: string[];
  curriculumAge: string;
  curriculumAgeMonths: number;
  itemResults: Array<{ itemId: string; correct: boolean; expectedAnswer: string; explanation: string }>;
}

const ITEM_COUNTS: Record<AssessmentDuration, number> = { 15: 8, 30: 16, 60: 30 };

function choice(subject: AcademicSubject, id: string, domain: string, prompt: string, options: string[], correctAnswer: string, explanation: string, context?: string): ScreeningItem {
  return { id, subject, domain, kind: "multiple-choice", prompt, context, options, correctAnswer, explanation };
}

function short(subject: AcademicSubject, id: string, domain: string, prompt: string, correctAnswer: string, explanation: string, acceptedAnswers: string[] = [], context?: string): ScreeningItem {
  return { id, subject, domain, kind: "short-answer", prompt, context, correctAnswer, acceptedAnswers, explanation };
}

type ItemBuilder = (variant: number) => ScreeningItem;

const mathsBuilders: ItemBuilder[] = [
  v => { const a = 36 + v * 12; const b = 14 + v * 3; return short("mathematics", `m-number-${v}`, "Number and Proportion", `Calculate ${a} + ${b}.`, String(a + b), "Add the ones, then the tens."); },
  v => { const n = 7 + v; const m = 8 + v; return choice("mathematics", `m-facts-${v}`, "Number and Proportion", `What is ${n} × ${m}?`, [String(n * m - 2), String(n * m), String(n * m + 2), String(n + m)], String(n * m), "Use multiplication facts or a written method."); },
  v => { const variants = [{ numerator: 2, denominator: 5, decimal: "0.4" }, { numerator: 1, denominator: 2, decimal: "0.5" }, { numerator: 3, denominator: 4, decimal: "0.75" }]; const fraction = variants[v % variants.length]; return choice("mathematics", `m-fraction-${v}`, "Number and Proportion", `Which decimal is equal to ${fraction.numerator}/${fraction.denominator}?`, ["0.25", "0.4", "0.5", "0.75"], fraction.decimal, "Convert the fraction by dividing the numerator by the denominator."); },
  v => { const x = 3 + v; return short("mathematics", `m-substitution-${v}`, "Algebra", `Work out 4x + 3 when x = ${x}.`, String(4 * x + 3), "Replace x with the given number before calculating."); },
  v => { const a = 5 + v; const b = 17 + v * 2; return choice("mathematics", `m-equation-${v}`, "Algebra", `Solve x + ${a} = ${b}.`, [String(b - a - 2), String(b - a), String(b + a), String(a)], String(b - a), "Undo the addition by subtracting the same number from both sides."); },
  v => { const base = 6 + v; const height = 4 + v; return short("mathematics", `m-area-${v}`, "Geometry and Measures", `A rectangle is ${base} cm long and ${height} cm wide. What is its area in cm²?`, String(base * height), "Area of a rectangle is length multiplied by width."); },
  v => { const first = 42 + v * 4; const second = 58 - v * 3; return choice("mathematics", `m-angle-${v}`, "Geometry and Measures", `Two angles on a straight line are ${first}° and x°. Find x.`, ["80°", `${180 - first}°`, "90°", `${first}°`], `${180 - first}°`, "Angles on a straight line total 180°."); },
  v => { const values = [4 + v, 6 + v, 8 + v, 10 + v]; return short("mathematics", `m-mean-${v}`, "Statistics and Probability", `Find the mean of ${values.join(", ")}.`, String((values.reduce((a, b) => a + b, 0)) / values.length), "Add all values and divide by the number of values."); },
  v => { const red = 3 + v; const blue = 7 + v; return choice("mathematics", `m-probability-${v}`, "Statistics and Probability", `A bag has ${red} red counters and ${blue} blue counters. What is the probability of choosing a red counter?`, [`${red}/${red + blue}`, `${blue}/${red + blue}`, `${red + blue}/${red}`, "1/2"], `${red}/${red + blue}`, "Probability is favourable outcomes divided by all outcomes."); },
  v => { const a = 2 + v; const b = 3 + v; return short("mathematics", `m-ratio-${v}`, "Number and Proportion", `Simplify the ratio ${a * 3}:${b * 3}.`, `${a}:${b}`, "Divide both parts of a ratio by the same common factor."); },
];

const englishBuilders: ItemBuilder[] = [
  v => { const word = ["reluctant", "ancient", "fragile"][v % 3]; const answer = ["unwilling", "very old", "easily broken"][v % 3]; return choice("english", `e-vocabulary-${v}`, "Vocabulary and Meaning", `Choose the closest meaning of “${word}”.`, [answer, "very loud", "quickly moving", "carefully planned"], answer, "Use the surrounding sense of the word and eliminate unrelated meanings."); },
  v => { const sentence = ["The hikers packed their bags before they left", "Maya finished her drawing before lunch", "The scientist checked the results twice"][v % 3]; return choice("english", `e-punctuation-${v}`, "Grammar and Punctuation", `Which version is correctly punctuated?`, [`${sentence}.`, `${sentence},`, `${sentence}?`, sentence], `${sentence}.`, "A complete statement ends with a full stop."); },
  v => { const subject = ["The choir", "A group of pupils", "The collection of shells"][v % 3]; const verb = ["was", "were", "was"][v % 3]; return choice("english", `e-agreement-${v}`, "Grammar and Punctuation", `Choose the correct verb: “${subject} ___ ready.”`, ["are", verb, "be", "have"], verb, "Match the verb to the true subject of the sentence."); },
  v => { const passage = ["At dawn, Leila placed the tiny seedling beside the window. Each day she measured it, turning the pot so every leaf reached the light.", "The old clock tower had not chimed for years. When Amir heard one clear note, he followed the sound through the empty square.", "Mina folded the map carefully. The path was steep, but the blue mark at the top promised a view of the sea."][v % 3]; const answer = ["She wanted it to grow well", "He was curious about the sound", "She expected a sea view"][v % 3]; return choice("english", `e-retrieval-${v}`, "Reading Comprehension", "What is the best inference from the extract?", [answer, "The character was bored", "The journey had ended", "The setting was a school"], answer, "Infer using details given in the extract.", passage); },
  v => { const words = ["careful", "quick", "bright"]; const correct = ["carefully", "quickly", "brightly"][v % 3]; return short("english", `e-adverb-${v}`, "Grammar and Punctuation", `Write the adverb form of “${words[v % 3]}”.`, correct, "Many adverbs are formed by adding -ly."); },
  v => { const sentence = ["the river rose after the storm", "we packed sandwiches for the trip", "the lantern flickered in the wind"][v % 3]; return short("english", `e-capital-${v}`, `Sentence Craft`, `Rewrite this sentence with a capital letter and full stop: “${sentence}”`, `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`, "Every sentence starts with a capital letter and ends with suitable punctuation."); },
  v => { const root = ["predict", "view", "kind"][v % 3]; const prefix = ["re", "pre", "un"][v % 3]; const answer = `${prefix}${root}`; return choice("english", `e-prefix-${v}`, "Vocabulary and Meaning", `Which word correctly uses the prefix “${prefix}-” with “${root}”?`, [answer, `${root}${prefix}`, `${prefix}-${root}-ing`, root], answer, "A prefix is added to the beginning of a root word."); },
  v => { const phrase = ["the wind whispered through the trees", "the sun smiled over the field", "the rain danced on the roof"][v % 3]; return choice("english", `e-language-${v}`, "Reading Comprehension", `What language device is used in “${phrase}”?`, ["Personification", "A fact", "A question", "A command"], "Personification", "Personification gives a human action or quality to a non-human thing."); },
  v => { const answer = ["because", "although", "therefore"][v % 3]; return choice("english", `e-connective-${v}`, "Sentence Craft", `Choose the best connective: “I took an umbrella ___ the forecast predicted rain.”`, [answer, "but", "or", "until"], answer, "The connective should show the relationship between the two ideas."); },
  v => { const answer = ["The boy carried the heavy box.", "The dog barked at the gate.", "The boat moved across the lake."][v % 3]; return choice("english", `e-subject-${v}`, "Grammar and Punctuation", `Which sentence has a clear subject and verb?`, [answer, "Across the lake.", "Because the rain.", "The heavy."], answer, "A complete sentence needs a subject and a verb."); },
];

const scienceBuilders: ItemBuilder[] = [
  v => { const answer = ["cell membrane", "nucleus", "cytoplasm"][v % 3]; return choice("science", `s-cell-${v}`, "Biology", "Which cell structure controls the activities of the cell?", ["Cell wall", answer, "Chlorophyll", "Vacuole"], answer, "The nucleus contains genetic material and controls cell activities."); },
  v => { const answer = ["photosynthesis", "respiration", "condensation"][v % 3]; const prompt = ["What process allows plants to make glucose using light?", "What process releases energy from glucose in cells?", "What process changes a gas into a liquid?"][v % 3]; return choice("science", `s-process-${v}`, "Biology", prompt, [answer, "melting", "freezing", "filtration"], answer, "Identify the named process from its scientific definition."); },
  v => { const mass = 20 + v * 5; const volume = 4 + v; return short("science", `s-density-${v}`, "Chemistry", `A material has a mass of ${mass} g and a volume of ${volume} cm³. Calculate its density in g/cm³.`, String(mass / volume), "Density equals mass divided by volume."); },
  v => { const answer = ["evaporation", "filtration", "chromatography"][v % 3]; const prompt = ["Which method can recover a dissolved solid from a solution by removing the liquid?", "Which method separates an insoluble solid from a liquid?", "Which method can separate coloured dyes in ink?"][v % 3]; return choice("science", `s-separation-${v}`, "Chemistry", prompt, [answer, "magnetism", "neutralisation", "combustion"], answer, "Choose the separation method that matches the materials involved."); },
  v => { const force = 12 + v * 4; const mass = 3 + v; return short("science", `s-force-${v}`, "Physics", `A force of ${force} N acts on a mass of ${mass} kg. Calculate the acceleration in m/s².`, String(force / mass), "Use force equals mass multiplied by acceleration, then divide force by mass."); },
  v => { const answer = ["voltmeter", "ammeter", "thermometer"][v % 3]; const prompt = ["Which instrument measures potential difference?", "Which instrument measures electric current?", "Which instrument measures temperature?"][v % 3]; return choice("science", `s-instrument-${v}`, "Working Scientifically", prompt, [answer, "ruler", "stopwatch", "newton meter"], answer, "Match the measuring instrument to the quantity."); },
  v => { const answer = ["independent variable", "dependent variable", "control variable"][v % 3]; const prompt = ["In an investigation of how light affects plant growth, what is the light level?", "In the same investigation, what is the measured plant height?", "In the same investigation, what should the amount of water be?"][v % 3]; return choice("science", `s-variable-${v}`, "Working Scientifically", prompt, [answer, "a conclusion", "a risk", "a prediction"], answer, "Identify whether a factor is changed, measured, or kept the same."); },
  v => { const answer = ["a reversible change", "an irreversible change", "a chemical reaction"][v % 3]; const prompt = ["Melting ice is", "Burning paper is", "Rust forming on iron is"][v % 3]; return choice("science", `s-change-${v}`, "Chemistry", prompt, [answer, "a measurement", "a force", "an electrical circuit"], answer, "A reversible change can be changed back; chemical changes create new substances."); },
  v => { const answer = ["gravity", "friction", "air resistance"][v % 3]; const prompt = ["Which force pulls objects towards Earth?", "Which force acts when two surfaces rub together?", "Which force slows a moving object in air?"][v % 3]; return choice("science", `s-force-type-${v}`, "Physics", prompt, [answer, "magnetism", "upthrust", "tension"], answer, "Identify the force from its effect."); },
  v => { const answer = ["fair test", "repeat readings", "identify hazards"][v % 3]; const prompt = ["What should a scientist do to compare one changed factor fairly?", "What improves confidence in a set of measurements?", "What must be done before practical work begins?"][v % 3]; return choice("science", `s-method-${v}`, "Working Scientifically", prompt, [answer, "change every variable", "ignore unusual results", "guess the result"], answer, "Good science controls variables, uses evidence, and manages risk."); },
];

const BANKS: Record<AcademicSubject, ItemBuilder[]> = {
  mathematics: mathsBuilders,
  english: englishBuilders,
  science: scienceBuilders,
};

export function getItemCount(duration: AssessmentDuration): number {
  return ITEM_COUNTS[duration];
}

export function buildAcademicScreening(config: ScreeningConfig): ScreeningItem[] {
  const builders = BANKS[config.subject];
  const count = getItemCount(config.duration);
  return Array.from({ length: count }, (_, index) => builders[index % builders.length](Math.floor(index / builders.length)));
}

function normaliseAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/[\s,]+/g, " ").replace(/²/g, "2").replace(/[.]+$/g, "");
}

export function markAcademicScreening(items: ScreeningItem[], answers: Record<string, string>, config: ScreeningConfig, timeTakenSeconds: number): ScreeningReport {
  const itemResults = items.map((item) => {
    const candidate = normaliseAnswer(answers[item.id] || "");
    const accepted = [item.correctAnswer, ...(item.acceptedAnswers || [])].map(normaliseAnswer);
    return { itemId: item.id, correct: accepted.includes(candidate), expectedAnswer: item.correctAnswer, explanation: item.explanation };
  });
  const score = itemResults.filter((result) => result.correct).length;
  const percentage = Math.round((score / Math.max(items.length, 1)) * 100);
  const domains = Array.from(new Set(items.map((item) => item.domain)));
  const domainResults = domains.map((domain) => {
    const matching = items.map((item, index) => ({ item, result: itemResults[index] })).filter(({ item }) => item.domain === domain);
    const correct = matching.filter(({ result }) => result.correct).length;
    return { domain, correct, total: matching.length, percentage: Math.round((correct / matching.length) * 100) };
  });
  const strengths = domainResults.filter((result) => result.percentage >= 75).map((result) => result.domain);
  const focusAreas = domainResults.filter((result) => result.percentage < 60).map((result) => result.domain);
  const revisionTips = focusAreas.map((domain) => revisionTip(config.subject, domain));
  const curriculumAgeMonths = curriculumAgeMonthsFor(config.yearGroup, percentage);
  return { score, total: items.length, percentage, timeTakenSeconds, domainResults, strengths, focusAreas, revisionTips, curriculumAge: formatAge(curriculumAgeMonths), curriculumAgeMonths, itemResults };
}

function revisionTip(subject: AcademicSubject, domain: string): string {
  const tips: Record<AcademicSubject, Record<string, string>> = {
    mathematics: {
      "Number and Proportion": "Practise short daily number-fact and fraction-conversion retrieval sets, then explain one method aloud.",
      Algebra: "Use substitution and equation balance models: write one line for each inverse step before checking the answer.",
      "Geometry and Measures": "Draw a labelled sketch before calculating and keep a small formula and angle-fact reference card.",
      "Statistics and Probability": "Collect a small data set, calculate one average, and describe probability as favourable outcomes over total outcomes.",
    },
    english: {
      "Vocabulary and Meaning": "Keep a personal word log: definition, synonym, and one original sentence for each new word.",
      "Grammar and Punctuation": "Edit one short paragraph at a time, checking capitals, sentence endings, and subject-verb agreement.",
      "Reading Comprehension": "Underline the exact words that support an answer, then turn them into a complete sentence.",
      "Sentence Craft": "Combine two simple sentences using a precise connective and reread aloud for clarity.",
    },
    science: {
      Biology: "Use labelled diagrams and explain each process with a cause, a change, and an outcome.",
      Chemistry: "Build a dual-code glossary: the scientific term on one side and a particle or separation sketch on the other.",
      Physics: "Write the formula, substitute units, calculate, then check whether the size of the answer is sensible.",
      "Working Scientifically": "Plan mini-investigations by naming the changed, measured, and controlled variables before collecting results.",
    },
  };
  return tips[subject][domain] || "Review the marked questions, identify the first missed step, and complete three similar practice items with feedback.";
}

function curriculumAgeMonthsFor(yearGroup: string, percentage: number): number {
  const year = Number(yearGroup.replace(/\D/g, "")) || 7;
  const expectedMonths = (year + 4) * 12 + 6;
  const adjustment = percentage >= 85 ? 24 : percentage >= 70 ? 9 : percentage >= 55 ? 0 : percentage >= 40 ? -12 : -24;
  return Math.max(84, Math.min(216, expectedMonths + adjustment));
}

function formatAge(months: number): string {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return `${years} years ${remainder} months`;
}

export const SUBJECT_LABELS: Record<AcademicSubject, string> = {
  mathematics: "Mathematics",
  english: "English",
  science: "Science",
};
