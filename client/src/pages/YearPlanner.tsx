/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * YearPlanner.tsx — FEAT-H2.
 *
 * Curriculum-architect-style year planner. Minimal v1: list-based
 * calendar (38 ISO weeks Sep-Aug), one topic per week, persists per
 * (school, year-group, academic-year). Drag-drop UX is deferred to a
 * follow-up — v1 ships the persisted shape + the editing surface so
 * planners can build a SoW.
 */

import React, { useState } from "react";
import {
  buildAcademicWeeks,
  emptyPlan,
  setWeekTopic,
  type YearPlan,
} from "@/lib/yearPlannerSchema";

export interface YearPlannerProps {
  /** Pre-loaded plan; undefined → fresh plan. */
  initialPlan?: YearPlan;
  schoolId?: string;
  yearGroup?: string;
  academicYear?: string;
  /** Available topics (fetched from topic-bank in production). */
  availableTopics?: { id: string; name: string }[];
  onSave?: (plan: YearPlan) => Promise<void> | void;
}

export function YearPlanner(props: YearPlannerProps): React.ReactElement {
  const [plan, setPlan] = useState<YearPlan>(
    props.initialPlan ||
      emptyPlan(props.schoolId || "demo-school", props.yearGroup || "Y10", props.academicYear || "2026/27"),
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const weeks = buildAcademicWeeks(plan.academicYear);
  const topics = props.availableTopics || [];

  function handleSetTopic(isoWeek: number, topicId: string) {
    const next = setWeekTopic(plan, isoWeek, topicId || undefined);
    setPlan(next);
  }

  async function handleSave() {
    if (!props.onSave) return;
    setSaving(true);
    try {
      await props.onSave(plan);
      setSavedAt(new Date().toLocaleTimeString("en-GB"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main data-testid="year-planner" className="p-4 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold">Year Planner</h1>
          <p className="text-xs text-gray-600">
            {plan.yearGroup} · {plan.academicYear} · {plan.schoolId}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-sm px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save plan"}
        </button>
      </header>
      {savedAt && <p className="text-xs text-green-700 mb-2">Last saved at {savedAt}.</p>}
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left p-2">Week</th>
            <th className="text-left p-2">Topic</th>
            <th className="text-left p-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => {
            const wk = plan.weeks.find((x) => x.isoWeek === w.isoWeek);
            return (
              <tr
                key={w.isoWeek}
                className={`border-b border-gray-100 ${w.isHoliday ? "bg-yellow-50" : ""}`}
              >
                <td className="p-2 font-mono">
                  {w.label}
                  {w.isHoliday && <span className="text-yellow-700 ml-1">●</span>}
                </td>
                <td className="p-2">
                  <select
                    value={wk?.topicId || ""}
                    onChange={(e) => handleSetTopic(w.isoWeek, e.target.value)}
                    aria-label={`Topic for week ${w.isoWeek}`}
                    className="border border-gray-300 rounded px-1 py-0.5 w-full"
                    disabled={w.isHoliday}
                  >
                    <option value="">— none —</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 text-gray-500">{wk?.notes || ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <footer className="mt-3 text-[11px] text-gray-500">
        Holiday weeks are highlighted; topics are disabled on those rows.
      </footer>
    </main>
  );
}

export default YearPlanner;
