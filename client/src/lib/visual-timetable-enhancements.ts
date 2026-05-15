/**
 * visual-timetable-enhancements.ts — Improvements layered onto Visual Timetable.
 *
 *  1. Symbol library swap (PCS / Widgit / Makaton) per pupil
 *  2. Now/Next/Then mobile mode for TAs (read-only live view)
 *  3. Audio cues per slot (pre-recorded or AI-generated)
 *  4. Disruption mode — fire drill / cover lesson rapid re-flow
 *  5. Transition countdown — 5/2/1 minute warning + optional vibration
 */

const TT_KEY = "adaptly_visual_timetable_v1";
const PUPIL_PREF_KEY = "adaptly_visual_timetable_prefs_v1";

// ── Shared types ────────────────────────────────────────────────────────────

export type SymbolLibrary = "pcs" | "widgit" | "makaton" | "emoji";

export const LIBRARY_LABEL: Record<SymbolLibrary, string> = {
  pcs: "PCS (Picture Communication Symbols)",
  widgit: "Widgit",
  makaton: "Makaton",
  emoji: "Emoji (fallback)",
};

export interface TimetableSlot {
  id: string;
  startTime: string;        // "HH:MM"
  endTime: string;
  label: string;
  symbolKey: string;        // e.g. "maths", "literacy", "lunch"
  audioUrl?: string;
  done?: boolean;
}

export interface TimetableDay {
  date: string;             // YYYY-MM-DD
  pupilId?: string;
  slots: TimetableSlot[];
}

// ── 1. Symbol library swap ──────────────────────────────────────────────────

const SYMBOL_MAPS: Record<SymbolLibrary, Record<string, string>> = {
  emoji: {
    maths: "➗", literacy: "📚", reading: "📖", writing: "✏️", science: "🔬",
    art: "🎨", pe: "🏃", music: "🎵", lunch: "🍎", break: "🧃",
    assembly: "👥", ict: "💻", history: "📜", geography: "🌍", drama: "🎭",
    "form-time": "🪑", "free-play": "🧸", "story-time": "📖",
  },
  pcs: {
    maths: "[PCS:maths]", literacy: "[PCS:literacy]", reading: "[PCS:reading]",
    writing: "[PCS:writing]", science: "[PCS:science]", art: "[PCS:art]",
    pe: "[PCS:pe]", music: "[PCS:music]", lunch: "[PCS:lunch]", break: "[PCS:break]",
  },
  widgit: {
    maths: "[Widgit:maths]", literacy: "[Widgit:literacy]", reading: "[Widgit:reading]",
    writing: "[Widgit:writing]", science: "[Widgit:science]", art: "[Widgit:art]",
    pe: "[Widgit:pe]", music: "[Widgit:music]", lunch: "[Widgit:lunch]", break: "[Widgit:break]",
  },
  makaton: {
    maths: "[Makaton:maths]", literacy: "[Makaton:literacy]", reading: "[Makaton:reading]",
    writing: "[Makaton:writing]", science: "[Makaton:science]", art: "[Makaton:art]",
    pe: "[Makaton:pe]", music: "[Makaton:music]", lunch: "[Makaton:lunch]", break: "[Makaton:break]",
  },
};

export interface PupilSymbolPref {
  pupilId: string;
  library: SymbolLibrary;
}

export function setSymbolLibrary(pupilId: string, library: SymbolLibrary): void {
  try {
    const all = JSON.parse(localStorage.getItem(PUPIL_PREF_KEY) || "[]") as PupilSymbolPref[];
    const filtered = all.filter((p) => p.pupilId !== pupilId);
    filtered.push({ pupilId, library });
    localStorage.setItem(PUPIL_PREF_KEY, JSON.stringify(filtered));
  } catch {}
}

export function getSymbolLibrary(pupilId: string): SymbolLibrary {
  try {
    const all = JSON.parse(localStorage.getItem(PUPIL_PREF_KEY) || "[]") as PupilSymbolPref[];
    return all.find((p) => p.pupilId === pupilId)?.library || "emoji";
  } catch { return "emoji"; }
}

export function symbolFor(key: string, library: SymbolLibrary): string {
  return SYMBOL_MAPS[library][key.toLowerCase()] || SYMBOL_MAPS.emoji[key.toLowerCase()] || "•";
}

// ── 2. Now/Next/Then helper ─────────────────────────────────────────────────

export interface NowNextThen {
  now?: TimetableSlot;
  next?: TimetableSlot;
  then?: TimetableSlot;
  isFinished: boolean;
}

export function nowNextThen(slots: TimetableSlot[], nowDate = new Date()): NowNextThen {
  const minutes = nowDate.getHours() * 60 + nowDate.getMinutes();
  const idx = slots.findIndex((s) => {
    const start = parseHHMM(s.startTime);
    const end = parseHHMM(s.endTime);
    return minutes >= start && minutes < end;
  });
  if (idx === -1) {
    // Either before first or after last slot.
    const isFinished = slots.length > 0 && minutes >= parseHHMM(slots[slots.length - 1].endTime);
    return { now: undefined, next: slots[0], then: slots[1], isFinished };
  }
  return {
    now: slots[idx],
    next: slots[idx + 1],
    then: slots[idx + 2],
    isFinished: false,
  };
}

function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

// ── 3. Audio cues ───────────────────────────────────────────────────────────

export function generateAudioCue(slot: TimetableSlot, lang = "en-GB"): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const u = new SpeechSynthesisUtterance(`Time for ${slot.label}!`);
  u.lang = lang;
  u.rate = 0.9;
  return u;
}

export function speakAudioCue(slot: TimetableSlot, lang = "en-GB"): void {
  const u = generateAudioCue(slot, lang);
  if (u) window.speechSynthesis.speak(u);
}

// ── 4. Disruption mode ──────────────────────────────────────────────────────

export type DisruptionKind = "fire-drill" | "cover-lesson" | "early-finish" | "late-start";

export interface DisruptionResult {
  reason: DisruptionKind;
  newSlots: TimetableSlot[];
  swapCard: string;        // human-readable summary
}

export function applyDisruption(day: TimetableDay, kind: DisruptionKind, opts: { atTime?: string; durationMins?: number; replacement?: Partial<TimetableSlot> } = {}): DisruptionResult {
  const minutes = opts.atTime ? parseHHMM(opts.atTime) : (() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();
  const dur = opts.durationMins ?? (kind === "fire-drill" ? 20 : 60);

  const newSlots: TimetableSlot[] = [];
  const changes: string[] = [];

  for (const slot of day.slots) {
    const start = parseHHMM(slot.startTime);
    const end = parseHHMM(slot.endTime);
    if (kind === "fire-drill" && minutes >= start && minutes < end) {
      // Insert evacuation slot, push remainder
      newSlots.push({
        id: `disr_${Date.now()}`,
        startTime: minToHHMM(minutes),
        endTime: minToHHMM(minutes + dur),
        label: "Fire drill — evacuation",
        symbolKey: "alarm",
      });
      newSlots.push({ ...slot, startTime: minToHHMM(minutes + dur), endTime: minToHHMM(end + dur) });
      changes.push(`Inserted fire-drill (${dur} min) at ${minToHHMM(minutes)}; slot "${slot.label}" pushed.`);
      continue;
    }
    if (kind === "cover-lesson" && minutes >= start && minutes < end && opts.replacement) {
      newSlots.push({
        ...slot,
        ...opts.replacement,
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
      changes.push(`Slot "${slot.label}" replaced with cover: "${opts.replacement.label || slot.label}".`);
      continue;
    }
    if (kind === "early-finish" && start >= minutes) {
      changes.push(`Slot "${slot.label}" cancelled (early finish).`);
      continue;
    }
    if (kind === "late-start" && end <= minutes) {
      changes.push(`Slot "${slot.label}" skipped (late start).`);
      continue;
    }
    newSlots.push(slot);
  }

  return {
    reason: kind,
    newSlots,
    swapCard: `${day.date} — ${kind}\n${changes.join("\n")}`,
  };
}

function minToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h < 10 ? "0" : ""}${h}:${m < 10 ? "0" : ""}${m}`;
}

// ── 5. Transition countdown ─────────────────────────────────────────────────

export interface TransitionWarning {
  level: 5 | 2 | 1;
  message: string;
  vibrationMs?: number[];
}

const VIBRATION_LADDER: Record<5 | 2 | 1, number[]> = {
  5: [120],
  2: [120, 80, 120],
  1: [200, 80, 200, 80, 200],
};

export function transitionWarning(slot: TimetableSlot, nowDate = new Date()): TransitionWarning | null {
  const minutes = nowDate.getHours() * 60 + nowDate.getMinutes();
  const end = parseHHMM(slot.endTime);
  const minsRemaining = end - minutes;
  if (minsRemaining === 5) return { level: 5, message: `5 minutes left of ${slot.label}.`, vibrationMs: VIBRATION_LADDER[5] };
  if (minsRemaining === 2) return { level: 2, message: `2 minutes left of ${slot.label}.`, vibrationMs: VIBRATION_LADDER[2] };
  if (minsRemaining === 1) return { level: 1, message: `1 minute left — get ready to switch.`, vibrationMs: VIBRATION_LADDER[1] };
  return null;
}

export function vibratePupilDevice(pattern: number[]): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(pattern); } catch {}
  }
}

// ── Persistence ─────────────────────────────────────────────────────────────

export function saveDay(day: TimetableDay): void {
  try {
    const all = JSON.parse(localStorage.getItem(TT_KEY) || "[]") as TimetableDay[];
    const filtered = all.filter((d) => !(d.date === day.date && d.pupilId === day.pupilId));
    filtered.push(day);
    localStorage.setItem(TT_KEY, JSON.stringify(filtered.slice(-200)));
  } catch {}
}

export function loadDay(date: string, pupilId?: string): TimetableDay | null {
  try {
    return (JSON.parse(localStorage.getItem(TT_KEY) || "[]") as TimetableDay[])
      .find((d) => d.date === date && d.pupilId === pupilId) || null;
  } catch { return null; }
}
