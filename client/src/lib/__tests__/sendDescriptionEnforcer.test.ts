/**
 * Tests for `sendDescriptionEnforcer` — the "SEND Description Requirement"
 * scrutiny item: every SEND-tagged worksheet must carry a block that NAMES
 * the specific adaptation (incl. the autism sub-profile) and describes it in
 * 2–3 sentences.
 *
 * The enforcer is pure / idempotent / conservative / observable — these tests
 * lock that contract.
 */
import { describe, it, expect } from "vitest";
import {
  enforceSendDescription,
  buildSendAdaptationSummary,
  hasMeaningfulSend,
  SEND_DESCRIPTION_SECTION_ID,
  SEND_DESCRIPTION_SECTION_TYPE,
} from "../sendDescriptionEnforcer";

function ws(sections: any[], metadata: Record<string, unknown> = {}): any {
  return { sections, metadata };
}

function findNote(result: any) {
  return (result.sections || []).find(
    (s: any) => s.id === SEND_DESCRIPTION_SECTION_ID,
  );
}

function countSentences(text: string): number {
  return (text.match(/[.!?](\s|$)/g) || []).length;
}

describe("hasMeaningfulSend", () => {
  it("treats the no-SEND sentinels as not meaningful", () => {
    for (const s of ["", "none", "none-selected", "general", "n/a", undefined, null]) {
      expect(hasMeaningfulSend(s as any)).toBe(false);
    }
  });
  it("treats a real need as meaningful", () => {
    expect(hasMeaningfulSend("dyslexia")).toBe(true);
    expect(hasMeaningfulSend("asc:asc-sensory")).toBe(true);
  });
});

describe("enforceSendDescription — insertion", () => {
  it("inserts a named + multi-sentence block for dyslexia", () => {
    const r = enforceSendDescription(
      ws([{ type: "questions", content: "1. Q" }]),
      "dyslexia",
    );
    const note = findNote(r);
    expect(note).toBeTruthy();
    expect(note.type).toBe(SEND_DESCRIPTION_SECTION_TYPE);
    // Names the adaptation, not a generic label.
    expect(note.content).toMatch(/Dyslexia/i);
    // 2–3 sentences (allow a little slack for the trailing clause).
    expect(countSentences(note.content)).toBeGreaterThanOrEqual(2);
  });

  it("inserts AFTER a learning-objective section when present", () => {
    const r = enforceSendDescription(
      ws([
        { type: "objective", content: "By the end…" },
        { type: "questions", content: "1. Q" },
      ]),
      "dyslexia",
    );
    expect(r.sections[0].type).toBe("objective");
    expect(r.sections[1].id).toBe(SEND_DESCRIPTION_SECTION_ID);
  });

  it("stamps an observable post-validator warning", () => {
    const r = enforceSendDescription(ws([{ type: "questions" }]), "dyslexia");
    const warnings = (r.metadata?.postValidatorWarnings as string[]) || [];
    expect(warnings.some((w) => /SEND description/i.test(w))).toBe(true);
  });
});

describe("enforceSendDescription — autism sub-profiles (the explicit scrutiny ask)", () => {
  it("names the PDA profile for a demand-avoidant sendNeed", () => {
    const note = findNote(enforceSendDescription(ws([{ type: "q" }]), "asc:asc-demand-avoidant"));
    expect(note.content).toMatch(/Pathological Demand Avoidance|PDA/i);
  });
  it("names the sensory profile for a sensory sendNeed", () => {
    const note = findNote(enforceSendDescription(ws([{ type: "q" }]), "asc:asc-sensory"));
    expect(note.content).toMatch(/sensory/i);
  });
  it("names the social-communication profile", () => {
    const note = findNote(enforceSendDescription(ws([{ type: "q" }]), "asc:asc-social"));
    expect(note.content).toMatch(/social/i);
  });
  it("falls back to a spectrum-aware description for bare 'autism'", () => {
    const note = findNote(enforceSendDescription(ws([{ type: "q" }]), "autism"));
    expect(note.content).toMatch(/Autism/i);
    expect(note.content).toMatch(/spectrum/i);
  });
});

describe("enforceSendDescription — guards", () => {
  it("is a no-op when no SEND need is set", () => {
    const input = ws([{ type: "questions" }]);
    const r = enforceSendDescription(input, "none");
    expect(findNote(r)).toBeUndefined();
    expect(r).toBe(input); // returns the same object untouched
  });

  it("does not mutate the input worksheet", () => {
    const input = ws([{ type: "questions", content: "1. Q" }]);
    const before = JSON.stringify(input);
    enforceSendDescription(input, "dyslexia");
    expect(JSON.stringify(input)).toBe(before);
  });

  it("is idempotent — running twice does not add a second block", () => {
    const once = enforceSendDescription(ws([{ type: "q" }]), "dyslexia");
    const twice = enforceSendDescription(once, "dyslexia");
    const notes = twice.sections.filter(
      (s: any) => s.id === SEND_DESCRIPTION_SECTION_ID,
    );
    expect(notes.length).toBe(1);
    expect(twice).toBe(once); // unchanged on the second pass
  });

  it("reads sendNeed from metadata when no explicit arg is given", () => {
    const r = enforceSendDescription(ws([{ type: "q" }], { sendNeed: "adhd" }));
    expect(findNote(r)).toBeTruthy();
  });
});

describe("buildSendAdaptationSummary", () => {
  it("returns null for an unknown need (so no low-value generic block is inserted)", () => {
    expect(buildSendAdaptationSummary("totally-unknown-need-xyz")).toBeNull();
  });
  it("describes the primary need for a stacked sendNeed", () => {
    const text = buildSendAdaptationSummary("dyslexia+eal");
    expect(text).toMatch(/Dyslexia/i);
  });
});
