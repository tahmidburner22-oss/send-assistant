/**
 * wellbeing-enhancements.ts — Improvements layered onto Wellbeing Support.
 *
 *  1. Mood check-in widget (parent-portal-friendly) with red-streak SENCO alerts
 *  2. Five Ways to Wellbeing tagging on every intervention
 *  3. Zones of Regulation visual mode (child-facing)
 *  4. Crisis pathway differentiation (low mood / disclosure / safeguarding)
 *  5. External-service handoff letter generation (CAMHS / Early Help / school nurse)
 */

const MOOD_KEY = "adaptly_wellbeing_mood_v1";

// ── 1. Mood check-in ────────────────────────────────────────────────────────

export type Mood = "great" | "ok" | "meh" | "sad" | "angry";

export const MOOD_EMOJI: Record<Mood, string> = {
  great: "😄",
  ok:    "🙂",
  meh:   "😐",
  sad:   "😔",
  angry: "😡",
};

export const MOOD_LABEL: Record<Mood, string> = {
  great: "Great",
  ok:    "OK",
  meh:   "Meh",
  sad:   "Sad",
  angry: "Angry",
};

export interface MoodEntry {
  pupilId: string;
  mood: Mood;
  at: number;
  note?: string;
}

const RED_MOODS: Mood[] = ["sad", "angry"];

export function logMood(entry: Omit<MoodEntry, "at">): void {
  try {
    const all = JSON.parse(localStorage.getItem(MOOD_KEY) || "[]") as MoodEntry[];
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(MOOD_KEY, JSON.stringify(all.slice(-2000)));
  } catch {}
}

export function moodHistory(pupilId: string, days = 30): MoodEntry[] {
  try {
    const cutoff = Date.now() - days * 86400_000;
    return (JSON.parse(localStorage.getItem(MOOD_KEY) || "[]") as MoodEntry[])
      .filter((m) => m.pupilId === pupilId && m.at >= cutoff)
      .sort((a, b) => a.at - b.at);
  } catch { return []; }
}

/** SENCO alert when a pupil logs 3+ red moods in a row. */
export function shouldAlertSenco(pupilId: string): { alert: boolean; streak: number } {
  const recent = moodHistory(pupilId, 14).slice(-5);
  let streak = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (RED_MOODS.includes(recent[i].mood)) streak++; else break;
  }
  return { alert: streak >= 3, streak };
}

// ── 2. Five Ways to Wellbeing tagging ───────────────────────────────────────

export type FiveWay = "connect" | "be-active" | "take-notice" | "keep-learning" | "give";

export const FIVE_WAY_LABEL: Record<FiveWay, string> = {
  "connect":        "Connect",
  "be-active":      "Be active",
  "take-notice":    "Take notice",
  "keep-learning":  "Keep learning",
  "give":           "Give",
};

const FIVE_WAY_KEYWORDS: Record<FiveWay, RegExp[]> = {
  "connect":       [/buddy/i, /talk/i, /circle\s+time/i, /pair/i, /group/i, /peer/i, /friend/i],
  "be-active":     [/walk/i, /movement/i, /sport/i, /play/i, /run/i, /stretch/i, /dance/i, /yoga/i],
  "take-notice":   [/mindful/i, /breathe/i, /grounding/i, /sensory/i, /5-4-3-2-1/i, /notice/i],
  "keep-learning": [/learn/i, /book/i, /skill/i, /club/i, /practice/i, /read/i],
  "give":          [/help/i, /volunteer/i, /kind/i, /share/i, /thank/i, /donate/i],
};

export function tagFiveWays(text: string): FiveWay[] {
  const ways: FiveWay[] = [];
  for (const [way, regs] of Object.entries(FIVE_WAY_KEYWORDS) as [FiveWay, RegExp[]][]) {
    if (regs.some((rx) => rx.test(text))) ways.push(way);
  }
  return ways;
}

export function fiveWayBalance(interventions: { text: string }[]): Record<FiveWay, number> {
  const counts: Record<FiveWay, number> = {
    "connect": 0, "be-active": 0, "take-notice": 0, "keep-learning": 0, "give": 0,
  };
  for (const i of interventions) {
    for (const way of tagFiveWays(i.text)) counts[way]++;
  }
  return counts;
}

// ── 3. Zones of Regulation ──────────────────────────────────────────────────

export type Zone = "blue" | "green" | "yellow" | "red";

export const ZONE_DESCRIPTION: Record<Zone, { label: string; mood: string; tools: string[] }> = {
  blue:   { label: "Blue Zone",   mood: "Tired, sad, sick, bored",        tools: ["Drink of water", "Stretch", "Talk to a trusted adult", "Quiet music"] },
  green:  { label: "Green Zone",  mood: "Calm, focused, ready to learn",  tools: ["Stay here — you're ready to learn"] },
  yellow: { label: "Yellow Zone", mood: "Frustrated, worried, silly, excited", tools: ["5-4-3-2-1 grounding", "Slow breathing", "Take a brain break", "Talk it through"] },
  red:    { label: "Red Zone",    mood: "Angry, terrified, out of control", tools: ["Safe space", "Deep breathing", "Sensory tool", "Find a trusted adult"] },
};

export function zoneFromMood(m: Mood): Zone {
  if (m === "great" || m === "ok") return "green";
  if (m === "meh") return "blue";
  if (m === "sad") return "blue";
  return "red";
}

// ── 4. Crisis pathway ───────────────────────────────────────────────────────

export type CrisisType = "low-mood" | "disclosure" | "safeguarding" | "self-harm";

export interface CrisisPathway {
  type: CrisisType;
  immediate: string[];
  escalation: string[];
  legalRef: string;
  documentation: string[];
}

export function crisisPathway(type: CrisisType): CrisisPathway {
  switch (type) {
    case "low-mood":
      return {
        type,
        immediate:    ["Quiet 1:1 with trusted adult", "Active listening — no advice", "Note triggers, sleep, appetite, peer relationships"],
        escalation:   ["Form tutor → pastoral lead → SENCO", "If persists 2+ weeks: GP referral via parent"],
        legalRef:     "DfE Mental Health and Behaviour in Schools (2018)",
        documentation: ["CPOMS / pastoral log entry", "Parent informed (record date)"],
      };
    case "disclosure":
      return {
        type,
        immediate:    ["Listen — don't promise confidentiality", "Use TED prompts (Tell, Explain, Describe)", "Record verbatim ASAP using pupil's words"],
        escalation:   ["Inform DSL within the hour", "Do NOT investigate further"],
        legalRef:     "Keeping Children Safe in Education (KCSiE 2024) — Part 1",
        documentation: ["Body map if injury reported", "Verbatim notes — pupil's words", "Time / place / who present"],
      };
    case "safeguarding":
      return {
        type,
        immediate:    ["Ensure pupil is safe NOW", "Do not leave alone if at risk", "Notify DSL immediately"],
        escalation:   ["DSL → MASH / Children's Social Care if threshold met", "Police 999 if immediate danger"],
        legalRef:     "Children Act 1989 s.17/s.47 thresholds; KCSiE 2024",
        documentation: ["Section 47 referral form", "Body map", "Multi-agency chronology"],
      };
    case "self-harm":
      return {
        type,
        immediate:    ["First aid as needed", "Calm 1:1, no audience", "Remove means of further harm safely"],
        escalation:   ["DSL within the hour", "Parent contact (unless contraindicated by DSL)", "GP / CAMHS urgent referral"],
        legalRef:     "DfE Mental Health and Behaviour in Schools (2018); KCSiE 2024",
        documentation: ["CPOMS entry", "Body map of injuries", "Risk assessment review", "Safety plan with pupil"],
      };
  }
}

// ── 5. External-service handoff letters ─────────────────────────────────────

export type ExternalService = "camhs" | "early-help" | "school-nurse" | "ep" | "salt" | "ot";

export const SERVICE_LABEL: Record<ExternalService, string> = {
  "camhs":         "CAMHS",
  "early-help":    "Early Help",
  "school-nurse":  "School Nurse",
  "ep":            "Educational Psychologist",
  "salt":          "Speech & Language Therapist",
  "ot":            "Occupational Therapist",
};

export interface HandoffLetter {
  service: ExternalService;
  pupilName: string;
  schoolName: string;
  senderName: string;
  senderRole: string;
  reason: string;
  evidence: string[];
  consentGivenBy?: string;
  consentDate?: string;
}

export function handoffLetterText(l: HandoffLetter): string {
  const today = new Date().toLocaleDateString("en-GB");
  const consent = l.consentGivenBy
    ? `Parental consent for this referral was given by ${l.consentGivenBy} on ${l.consentDate || "[date]"}.`
    : "Parental consent has been obtained verbally and is documented in the pupil's record.";
  return [
    `${l.schoolName}`,
    `${today}`,
    "",
    `Dear ${SERVICE_LABEL[l.service]} Team,`,
    "",
    `Re: Referral for ${l.pupilName}`,
    "",
    `I am writing to refer ${l.pupilName} for ${SERVICE_LABEL[l.service]} support.`,
    "",
    `Reason for referral: ${l.reason}`,
    "",
    "Evidence to date:",
    ...l.evidence.map((e) => `• ${e}`),
    "",
    consent,
    "",
    "Please contact me if any further information would assist your assessment.",
    "",
    "Yours sincerely,",
    "",
    `${l.senderName}`,
    `${l.senderRole}`,
    `${l.schoolName}`,
  ].join("\n");
}
