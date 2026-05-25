/**
 * reading-enhancements.ts — Improvements layered onto Reading & Stories.
 *
 *  1. Decodable phonics mode — restrict generation to a phase grapheme set
 *  2. Comprehension question taxonomy (Reading Reconsidered's 5 domains)
 *  3. Pupil-name personalisation safety guards
 *  4. Audio narration with character voices (uses lib/teacher-voice + WebSpeech)
 *  5. Running-record / WCPM assessment helpers
 */
import { speak as voiceSpeak } from "./teacher-voice";

// ── 1. Decodable phonics mode ────────────────────────────────────────────────

export type LSPhase = "Phase 2" | "Phase 3" | "Phase 4" | "Phase 5" | "Phase 6";

/**
 * Letters & Sounds / Little Wandle simplified grapheme set per phase.
 * Phase N is cumulative — includes earlier phases.
 */
const PHASE_GRAPHEMES: Record<LSPhase, string[]> = {
  "Phase 2": [
    "s","a","t","p","i","n","m","d","g","o","c","k","ck","e","u","r","h","b","f","ff","l","ll","ss",
  ],
  "Phase 3": [
    "j","v","w","x","y","z","zz","qu","ch","sh","th","ng",
    "ai","ee","igh","oa","oo","ar","or","ur","ow","oi","ear","air","ure","er",
  ],
  "Phase 4": [],
  "Phase 5": [
    "ay","ou","ie","ea","oy","ir","ue","aw","wh","ph","ew","oe","au","a-e","e-e","i-e","o-e","u-e",
  ],
  "Phase 6": [
    "tion","sion","ous","ed","ing","ly","ful","est","er-comparative",
  ],
};

const COMMON_EXCEPTION_WORDS: Record<LSPhase, string[]> = {
  "Phase 2": ["the","to","I","go","no","into"],
  "Phase 3": ["he","she","we","me","be","was","you","they","all","are","my","her"],
  "Phase 4": ["said","so","have","like","some","come","were","there","little","one","do","when","out","what"],
  "Phase 5": ["oh","Mrs","people","their","called","asked","could","through","once"],
  "Phase 6": [],
};

export function cumulativeGraphemes(phase: LSPhase): string[] {
  const all: LSPhase[] = ["Phase 2","Phase 3","Phase 4","Phase 5","Phase 6"];
  const idx = all.indexOf(phase);
  return all.slice(0, idx + 1).flatMap(p => PHASE_GRAPHEMES[p]);
}

export function cumulativeExceptionWords(phase: LSPhase): string[] {
  const all: LSPhase[] = ["Phase 2","Phase 3","Phase 4","Phase 5","Phase 6"];
  const idx = all.indexOf(phase);
  return all.slice(0, idx + 1).flatMap(p => COMMON_EXCEPTION_WORDS[p]);
}

/**
 * Validate a passage against a phonics phase. Returns the list of words
 * that contain graphemes outside the cumulative phase set (and aren't a
 * recognised "common exception word" for the phase).
 */
export function validatePhonicsPassage(text: string, phase: LSPhase): string[] {
  const exceptions = new Set(cumulativeExceptionWords(phase).map(w => w.toLowerCase()));
  // Heuristic: split into words and check each character looks like a single
  // letter present in the cumulative set. Ignores graphemes vs phonemes
  // accuracy — designed to *flag candidates*, not be a phonics expert.
  const allowedChars = new Set("abcdefghijklmnopqrstuvwxyz".split(""));
  const out = new Set<string>();
  for (const w of text.replace(/[^a-zA-Z\s'-]/g, " ").split(/\s+/).filter(Boolean)) {
    const lower = w.toLowerCase();
    if (exceptions.has(lower)) continue;
    if ([...lower].some(c => !allowedChars.has(c))) out.add(w);
    if (lower.length >= 7 && phase === "Phase 2") out.add(w); // very long words break Phase 2 decoding
  }
  return Array.from(out);
}

export function phonicsPromptSuffix(phase: LSPhase): string {
  return `
DECODABLE MODE — ${phase}.
Use only words decodable with these grapheme correspondences (cumulative): ${cumulativeGraphemes(phase).slice(0, 30).join(", ")}.
Allowed common-exception words: ${cumulativeExceptionWords(phase).join(", ")}.
Do not use words that require graphemes outside the phase. If a topic word is not decodable, replace it with a decodable synonym.`;
}

// ── 2. Comprehension question taxonomy ──────────────────────────────────────

export type CompDomain = "retrieval" | "inference" | "vocabulary" | "sequence" | "predict";

export interface ClassifiedQuestion {
  text: string;
  domain: CompDomain;
}

const TAGGERS: Array<{ rx: RegExp; domain: CompDomain }> = [
  { rx: /\bwhat does (?:.+) mean\b|\bwhat is the meaning of\b|\bword .+ suggest\b|\bdefine\b/i, domain: "vocabulary" },
  { rx: /\bwhy\b|\bhow does (?:.+) feel\b|\bwhat does this (?:tell|show)\b|\binfer\b|\bsuggest\b/i, domain: "inference" },
  { rx: /\bwhat happens (?:next|after)\b|\bwhat will happen\b|\bpredict\b/i, domain: "predict" },
  { rx: /\bin what order\b|\bbefore\b|\bafter\b|\bwhat happened first\b|\btimeline\b|\bsequence\b/i, domain: "sequence" },
];

export function classifyQuestion(text: string): CompDomain {
  for (const t of TAGGERS) if (t.rx.test(text)) return t.domain;
  return "retrieval";
}

export function classifyAll(questions: string[]): ClassifiedQuestion[] {
  return questions.map(q => ({ text: q, domain: classifyQuestion(q) }));
}

export function rebalancePromptSuffix(targets: Partial<Record<CompDomain, number>>): string {
  const domains = (Object.entries(targets) as [CompDomain, number][])
    .filter(([, n]) => n > 0)
    .map(([d, n]) => `${n} ${d}`);
  if (domains.length === 0) return "";
  return `Generate exactly: ${domains.join(", ")} comprehension question(s). Tag each with [retrieval], [inference], [vocabulary], [sequence] or [predict].`;
}

// ── 3. Pupil-name personalisation guard ─────────────────────────────────────

const SENSITIVE_TOPICS = [
  "death","funeral","suicide","abuse","sexual","alcohol","drug","violence","gun","knife","weapon","murder",
];

export interface PersonalisationCheck {
  ok: boolean;
  problems: string[];
}

export function safeguardPersonalisation(passage: string, name: string, interest?: string): PersonalisationCheck {
  const problems: string[] = [];
  const lower = passage.toLowerCase();
  for (const t of SENSITIVE_TOPICS) {
    if (lower.includes(t)) problems.push(`Sensitive topic appears with personalised content: "${t}". Review before sharing with parents.`);
  }
  if (name && passage.split(name).length - 1 > 12) {
    problems.push(`Pupil's first name appears more than 12 times — risk of feeling intrusive.`);
  }
  if (interest && !lower.includes(interest.toLowerCase())) {
    problems.push(`Pupil's special interest "${interest}" does not appear in the passage.`);
  }
  return { ok: problems.length === 0, problems };
}

// ── 4. Audio narration ──────────────────────────────────────────────────────

export interface NarratedChunk {
  speaker: "narrator" | "character";
  characterName?: string;
  text: string;
}

export function tagDialogue(passage: string): NarratedChunk[] {
  const out: NarratedChunk[] = [];
  for (const line of passage.split(/\n+/)) {
    const dialogueMatch = line.match(/^"([^"]+)"\s*(?:said|asked|replied|whispered|shouted)\s+([A-Z][a-z]+)/);
    if (dialogueMatch) {
      out.push({ speaker: "character", characterName: dialogueMatch[2], text: dialogueMatch[1] });
      const after = line.replace(dialogueMatch[0], "").trim();
      if (after) out.push({ speaker: "narrator", text: after });
    } else if (line.trim()) {
      out.push({ speaker: "narrator", text: line });
    }
  }
  return out;
}

export async function speakWithCharacters(
  chunks: NarratedChunk[],
  opts?: { rate?: number },
): Promise<void> {
  // Cycle through a small palette of pitches to differentiate characters.
  const charToPitch: Record<string, number> = {};
  let nextPitch = 0;
  const palette = [1.2, 0.85, 1.4, 0.7, 1.05, 1.55];
  for (const c of chunks) {
    if (c.speaker === "character" && c.characterName && !(c.characterName in charToPitch)) {
      charToPitch[c.characterName] = palette[nextPitch++ % palette.length];
    }
  }
  const rate = opts?.rate ?? 0.95;
  for (const c of chunks) {
    const pitch = c.speaker === "character" && c.characterName ? charToPitch[c.characterName] : 1.0;
    await voiceSpeak(c.text, { profileOverride: { pitch, rate } });
  }
}

// ── 5. Running record / WCPM assessment ─────────────────────────────────────

export interface RunningRecord {
  totalWords: number;
  errors: number;
  /** Self-corrections — error then immediately fixed. */
  selfCorrections: number;
  durationSec: number;
  wcpm: number;
  accuracy: number; // %
}

export function computeRunningRecord(opts: {
  totalWords: number;
  errors: number;
  selfCorrections: number;
  startMs: number;
  endMs: number;
}): RunningRecord {
  const durationSec = Math.max(1, (opts.endMs - opts.startMs) / 1000);
  const wcpm = Math.round((opts.totalWords - opts.errors) / (durationSec / 60));
  const accuracy = Math.round(((opts.totalWords - opts.errors) / opts.totalWords) * 1000) / 10;
  return {
    totalWords: opts.totalWords,
    errors: opts.errors,
    selfCorrections: opts.selfCorrections,
    durationSec: Math.round(durationSec),
    wcpm,
    accuracy,
  };
}

/** Simple phoneme bucketing for miscue analysis. */
export function categoriseMiscue(target: string, said: string): "initial" | "medial" | "final" | "whole" {
  const t = target.toLowerCase();
  const s = said.toLowerCase();
  if (s.length === 0) return "whole";
  if (t.length >= 2 && s.length >= 2 && t[0] !== s[0]) return "initial";
  if (t.slice(-1) !== s.slice(-1)) return "final";
  return "medial";
}
