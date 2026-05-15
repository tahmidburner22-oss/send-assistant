/**
 * skill-ladder-store.ts — per-pupil skill ladder with prerequisite DAG,
 * mastery vs exposure tracking, auto-population from work events, and
 * cohort-gap surface.
 */

const STORAGE_KEY = "adaptly_skill_ladder_v1";
const MASTERY_THRESHOLD = 0.8;
const MASTERY_INSTANCES = 3;

export type SkillState = "unknown" | "exposed" | "mastered";

export interface Skill {
  id: string;          // e.g. "maths.fractions.add-like"
  label: string;       // human label
  subject: string;     // English / Maths / Science / …
  yearGroup?: string;  // e.g. Y4
  /** Prerequisites — IDs of skills that should come first. */
  prereqs: string[];
}

export interface SkillRecord {
  pupilId: string;
  skillId: string;
  state: SkillState;
  /** Recent observations: 1.0 = correct, 0.0 = wrong. */
  scores: { score: number; at: number; source?: string }[];
  updatedAt: number;
}

interface Store {
  skills: Skill[];
  records: SkillRecord[];
}

function read(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { skills: DEFAULT_SKILLS, records: [] };
    const parsed = JSON.parse(raw);
    return {
      skills: Array.isArray(parsed?.skills) && parsed.skills.length > 0 ? parsed.skills : DEFAULT_SKILLS,
      records: Array.isArray(parsed?.records) ? parsed.records : [],
    };
  } catch {
    return { skills: DEFAULT_SKILLS, records: [] };
  }
}

function write(s: Store): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export const DEFAULT_SKILLS: Skill[] = [
  // Maths primary
  { id: "maths.number.count-100", label: "Count to 100", subject: "Mathematics", yearGroup: "Y1", prereqs: [] },
  { id: "maths.number.place-value-2", label: "Place value (tens & units)", subject: "Mathematics", yearGroup: "Y2", prereqs: ["maths.number.count-100"] },
  { id: "maths.add.within-20", label: "Addition within 20", subject: "Mathematics", yearGroup: "Y1", prereqs: ["maths.number.count-100"] },
  { id: "maths.add.column", label: "Column addition (3 digits)", subject: "Mathematics", yearGroup: "Y3", prereqs: ["maths.number.place-value-2"] },
  { id: "maths.fractions.equiv", label: "Equivalent fractions", subject: "Mathematics", yearGroup: "Y4", prereqs: ["maths.add.column"] },
  { id: "maths.fractions.add-like", label: "Add fractions, same denominator", subject: "Mathematics", yearGroup: "Y4", prereqs: ["maths.fractions.equiv"] },
  { id: "maths.measure.perimeter", label: "Perimeter of rectangles", subject: "Mathematics", yearGroup: "Y4", prereqs: ["maths.add.column"] },
  // English primary
  { id: "eng.read.phase3", label: "Phase 3 phonics", subject: "English", yearGroup: "Y1", prereqs: [] },
  { id: "eng.read.phase5", label: "Phase 5 phonics", subject: "English", yearGroup: "Y1", prereqs: ["eng.read.phase3"] },
  { id: "eng.read.fluency", label: "Reading fluency 90+ wcpm", subject: "English", yearGroup: "Y3", prereqs: ["eng.read.phase5"] },
  { id: "eng.write.sentence", label: "Compose a sentence with capital + full stop", subject: "English", yearGroup: "Y2", prereqs: [] },
  { id: "eng.write.paragraph", label: "Write a coherent paragraph", subject: "English", yearGroup: "Y4", prereqs: ["eng.write.sentence"] },
];

export function listSkills(filter: { subject?: string; yearGroup?: string } = {}): Skill[] {
  return read().skills.filter(s => {
    if (filter.subject && s.subject !== filter.subject) return false;
    if (filter.yearGroup && s.yearGroup !== filter.yearGroup) return false;
    return true;
  });
}

export function getRecord(pupilId: string, skillId: string): SkillRecord | undefined {
  return read().records.find(r => r.pupilId === pupilId && r.skillId === skillId);
}

export function getRecordsForPupil(pupilId: string): SkillRecord[] {
  return read().records.filter(r => r.pupilId === pupilId);
}

/** Append a measurement; mastery state updates automatically. */
export function recordMeasurement(
  pupilId: string,
  skillId: string,
  score: number,
  source?: string,
): SkillRecord {
  const store = read();
  let rec = store.records.find(r => r.pupilId === pupilId && r.skillId === skillId);
  if (!rec) {
    rec = { pupilId, skillId, state: "exposed", scores: [], updatedAt: Date.now() };
    store.records.push(rec);
  }
  rec.scores = [...rec.scores, { score, at: Date.now(), source }].slice(-10);
  rec.updatedAt = Date.now();
  // Mastery: at least N instances and a rolling mean ≥ threshold.
  if (rec.scores.length >= MASTERY_INSTANCES) {
    const recent = rec.scores.slice(-MASTERY_INSTANCES);
    const mean = recent.reduce((a, b) => a + b.score, 0) / recent.length;
    rec.state = mean >= MASTERY_THRESHOLD ? "mastered" : "exposed";
  }
  write(store);
  return rec;
}

/** Set the explicit teacher-marked state (overrides auto). */
export function setSkillState(pupilId: string, skillId: string, state: SkillState): void {
  const store = read();
  let rec = store.records.find(r => r.pupilId === pupilId && r.skillId === skillId);
  if (!rec) {
    rec = { pupilId, skillId, state, scores: [], updatedAt: Date.now() };
    store.records.push(rec);
  } else {
    rec.state = state;
    rec.updatedAt = Date.now();
  }
  write(store);
}

/** Find the lowest-rung prerequisite gap for a stuck skill. */
export function findGapBelow(pupilId: string, skillId: string): Skill | null {
  const skills = read().skills;
  const records = read().records;
  const skillById = new Map(skills.map(s => [s.id, s]));
  function masteredFor(id: string): boolean {
    return records.some(r => r.pupilId === pupilId && r.skillId === id && r.state === "mastered");
  }
  function dfs(id: string): Skill | null {
    const s = skillById.get(id);
    if (!s) return null;
    for (const p of s.prereqs) {
      if (!masteredFor(p)) {
        const deeper = dfs(p);
        return deeper || skillById.get(p) || null;
      }
    }
    return null;
  }
  return dfs(skillId);
}

/** Cohort gap: skills where N+ pupils share the same exposed-but-not-mastered state. */
export function cohortGap(pupilIds: string[], threshold = 3): Array<{ skill: Skill; pupils: string[] }> {
  const skills = read().skills;
  const records = read().records;
  const out: Array<{ skill: Skill; pupils: string[] }> = [];
  for (const s of skills) {
    const stuck = pupilIds.filter(pid => {
      const r = records.find(x => x.pupilId === pid && x.skillId === s.id);
      return r && r.state !== "mastered";
    });
    if (stuck.length >= threshold) out.push({ skill: s, pupils: stuck });
  }
  return out;
}
