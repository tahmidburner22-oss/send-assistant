/**
 * Tests for buildClassAutoBrief — Phase A · PR-1
 *
 * Note: this file does NOT exercise the topic-bank.peekCurrentTopic path
 * because that helper reads localStorage; we test the rest of the pure-data
 * surface (pupil counting, tier mix, dedup of misconceptions, SEND needs)
 * which is everything the spec calls out. The topic-bank integration is
 * exercised end-to-end by PR-2's UI tests and by manual smoke tests.
 */
import { describe, it, expect } from "vitest";
import {
  buildClassAutoBrief,
  classAutoBriefIsUsable,
  renderClassBriefForPrompt,
} from "../class-auto-brief";
import type { Child } from "@/contexts/AppContext";

function child(over: Partial<Child> = {}): Child {
  return {
    id: over.id || `c_${Math.random().toString(36).slice(2, 8)}`,
    name: over.name || "Pupil X",
    yearGroup: over.yearGroup ?? "Year 7",
    sendNeed: over.sendNeed ?? "",
    sendNeeds: over.sendNeeds ?? [],
    code: over.code || "ABCD",
    upn: over.upn,
    dob: over.dob,
    createdAt: over.createdAt || new Date().toISOString(),
    parentEmail: over.parentEmail,
    parentName: over.parentName,
    assignments: over.assignments || [],
    submissions: over.submissions || [],
    timetable: over.timetable,
    ehcpOutcomes: over.ehcpOutcomes,
    iepTargets: over.iepTargets,
    recentMisconceptions: over.recentMisconceptions,
  } as Child;
}

describe("buildClassAutoBrief", () => {
  it("returns pupilCount=0 for an empty class", () => {
    const brief = buildClassAutoBrief("Year 7", []);
    expect(brief.pupilCount).toBe(0);
    expect(brief.tierMix).toEqual({ foundation: 0, core: 0, higher: 0, send: 0 });
    expect(brief.recentMisconceptions).toEqual([]);
    expect(brief.sendNeeds).toEqual([]);
    expect(brief.suggestedTopic).toBe("");
    expect(classAutoBriefIsUsable(brief)).toBe(false);
  });

  it("groups by yearGroup and ignores pupils outside the class", () => {
    const roster = [
      child({ id: "a", yearGroup: "Year 7" }),
      child({ id: "b", yearGroup: "Year 7" }),
      child({ id: "c", yearGroup: "Year 8" }),
    ];
    const brief = buildClassAutoBrief("Year 7", roster);
    expect(brief.pupilCount).toBe(2);
    expect(brief.pupilSummaries.map(p => p.pupilId).sort()).toEqual(["a", "b"]);
  });

  it("classifies SEND vs core tier mix", () => {
    const roster = [
      child({ id: "a", yearGroup: "Year 7" }),                                 // core
      child({ id: "b", yearGroup: "Year 7", sendNeed: "dyslexia" }),           // send
      child({ id: "c", yearGroup: "Year 7", sendNeeds: ["adhd", "anxiety"] }), // send
      child({ id: "d", yearGroup: "Year 7", sendNeed: "none-selected" }),      // core
    ];
    const brief = buildClassAutoBrief("Year 7", roster);
    expect(brief.tierMix.send).toBe(2);
    expect(brief.tierMix.core).toBe(2);
    expect(brief.sendNeeds.sort()).toEqual(["adhd", "dyslexia"]);
  });

  it("dedupes recentMisconceptions case-insensitively and caps at 5", () => {
    const roster = [
      child({ id: "a", yearGroup: "Year 7", recentMisconceptions: ["sign errors", "Order of ops"] }),
      child({ id: "b", yearGroup: "Year 7", recentMisconceptions: ["SIGN ERRORS", "fractions: like denominators"] }),
      child({ id: "c", yearGroup: "Year 7", recentMisconceptions: ["m1", "m2", "m3", "m4", "m5", "m6"] }),
    ];
    const brief = buildClassAutoBrief("Year 7", roster);
    expect(brief.recentMisconceptions.length).toBe(5);
    // First two come from pupil a (in-order) since we walk pupils in array order
    expect(brief.recentMisconceptions[0]).toBe("sign errors");
    expect(brief.recentMisconceptions[1]).toBe("Order of ops");
    // No duplicates regardless of case
    const lower = brief.recentMisconceptions.map(s => s.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it("computes a reading-age range from yearGroup alone when none is on the pupil record", () => {
    const roster = [
      child({ id: "a", yearGroup: "Year 7" }),
      child({ id: "b", yearGroup: "Year 7" }),
    ];
    const brief = buildClassAutoBrief("Year 7", roster);
    // Year 7 ⇒ ~12; range collapses to the same number
    expect(brief.readingAgeRange.min).toBe(12);
    expect(brief.readingAgeRange.max).toBe(12);
  });

  it("leaves suggestedTopic empty when no subject hint is provided", () => {
    const roster = [child({ id: "a", yearGroup: "Year 7" })];
    const brief = buildClassAutoBrief("Year 7", roster);
    expect(brief.suggestedTopic).toBe("");
    expect(classAutoBriefIsUsable(brief)).toBe(false);
    // Explicit override: requireTopic:false should make it usable as long as
    // there's at least one pupil
    expect(classAutoBriefIsUsable(brief, { requireTopic: false })).toBe(true);
  });
});

describe("renderClassBriefForPrompt", () => {
  it("includes class label, pupil count, and recent misconceptions when present", () => {
    const roster = [
      child({ id: "a", yearGroup: "Year 7", sendNeed: "dyslexia", recentMisconceptions: ["sign errors"] }),
      child({ id: "b", yearGroup: "Year 7" }),
    ];
    const brief = buildClassAutoBrief("Year 7", roster);
    const text = renderClassBriefForPrompt(brief);
    expect(text).toContain("Year 7");
    expect(text).toContain("2 pupils");
    expect(text).toContain("sign errors");
    expect(text).toContain("dyslexia");
  });

  it("does not include sections it has no data for", () => {
    const brief = buildClassAutoBrief("Year 7", [child({ id: "a", yearGroup: "Year 7" })]);
    const text = renderClassBriefForPrompt(brief);
    expect(text).not.toContain("misconception");
    expect(text).not.toContain("SEND needs in class:");
  });
});
