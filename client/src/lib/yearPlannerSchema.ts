/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * yearPlannerSchema.ts — FEAT-H2.
 *
 * Schema + helpers for the curriculum-architect-style year planner.
 * Drag-drop UI lives in client/src/pages/YearPlanner.tsx; this file
 * carries the persisted shape + pure validation helpers.
 */

import { z } from "zod";

export const YearPlannerWeekSchema = z.object({
  isoWeek: z.number().int().min(1).max(53),
  topicId: z.string().max(120).optional(),
  unitPackId: z.string().max(120).optional(),
  archetype: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
});

export type YearPlannerWeek = z.infer<typeof YearPlannerWeekSchema>;

export const YearPlanSchema = z.object({
  schoolId: z.string().min(1).max(64),
  yearGroup: z.string().min(1).max(20),
  /** e.g. "2026/27" */
  academicYear: z.string().min(4).max(20),
  weeks: z.array(YearPlannerWeekSchema).max(53),
  updatedBy: z.string().max(120).optional(),
  updatedAt: z.string().optional(),
});

export type YearPlan = z.infer<typeof YearPlanSchema>;

/** Returns 38 ISO weeks for a Sep-Aug academic year, with school-holiday weeks marked. */
export function buildAcademicWeeks(academicYear: string): { isoWeek: number; isHoliday: boolean; label: string }[] {
  const startYear = parseInt(academicYear.split("/")[0], 10);
  if (!Number.isFinite(startYear)) return [];
  const out: { isoWeek: number; isHoliday: boolean; label: string }[] = [];
  // Approximate UK academic year: Sep week 1 → Jul week 4. ISO weeks 36-52 + 1-30.
  const sequence: number[] = [];
  for (let w = 36; w <= 52; w++) sequence.push(w);
  for (let w = 1; w <= 30; w++) sequence.push(w);
  // Half-term + Christmas + Easter + half-term + summer holiday weeks (very rough).
  const holidayIsoWeeks = new Set<number>([44, 51, 52, 1, 8, 14, 15, 22, 30]);
  for (const w of sequence) {
    out.push({
      isoWeek: w,
      isHoliday: holidayIsoWeeks.has(w),
      label: `Wk ${w}`,
    });
  }
  return out;
}

export function isPlanValid(plan: unknown): plan is YearPlan {
  return YearPlanSchema.safeParse(plan).success;
}

export function setWeekTopic(plan: YearPlan, isoWeek: number, topicId: string | undefined): YearPlan {
  const idx = plan.weeks.findIndex((w) => w.isoWeek === isoWeek);
  const newWeeks = plan.weeks.slice();
  if (idx >= 0) {
    newWeeks[idx] = { ...newWeeks[idx], topicId };
  } else {
    newWeeks.push({ isoWeek, topicId });
  }
  return { ...plan, weeks: newWeeks, updatedAt: new Date().toISOString() };
}

export function emptyPlan(schoolId: string, yearGroup: string, academicYear: string): YearPlan {
  return { schoolId, yearGroup, academicYear, weeks: [], updatedAt: new Date().toISOString() };
}
