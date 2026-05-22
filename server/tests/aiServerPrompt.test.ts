/**
 * aiServerPrompt.test.ts
 *
 * PR-7 (audit item #39) — server-prompt unification.
 *
 * Locks the contract that every worksheet-content endpoint in
 * `server/routes/ai.ts` ships through
 * `buildServerWorksheetSystemPrompt`, and that the helper itself
 * always emits the curriculum-authority manifesto from the SINGLE
 * SOURCE OF TRUTH at `client/src/lib/curriculumAuthorityPrompt.ts`.
 *
 * What this test file enforces:
 *   1. The helper output contains every named manifesto section
 *      header (CURRICULUM AUTHORITY / NON-NEGOTIABLES /
 *      PEDAGOGICAL REGISTER / OUTPUT CONTRACT) and every numbered
 *      non-negotiable clause (1. UK ENGLISH ONLY → 6. NO FABRICATED
 *      CODES). The list is data-driven via
 *      `REQUIRED_MANIFESTO_HEADERS` so adding a section in the
 *      future is a one-line edit.
 *   2. GCSE / A-Level inputs include the awarding-body clause
 *      (e.g. "the published AQA specification") with the canonical
 *      board label. KS1 / KS2 / KS3 inputs do NOT include the
 *      awarding-body clause even when examBoard is supplied.
 *   3. The pedagogical-register note differs between key stages
 *      (KS1 ≠ KS2 ≠ KS3 ≠ GCSE ≠ A-Level).
 *   4. Sciences subjects add the maths-only working-out-box
 *      reminder; non-science subjects do not.
 *   5. The helper preserves the role text verbatim — the existing
 *      "You are an expert ..." stem must appear in the output.
 *   6. The output contract appears LAST when supplied; absent when
 *      omitted.
 *   7. The helper is pure / deterministic — same inputs always
 *      produce the same string.
 *
 * What this test file DELIBERATELY does NOT enforce:
 *   - `isUKEnglishCompliant` on the full helper output. The
 *     non-negotiables block deliberately quotes US drift words
 *     ("colour" not "color", …) as counter-examples to teach the
 *     model what to avoid; running the UK-English compliance
 *     predicate over the manifesto text itself would always fail.
 *     Compliance is locked separately in
 *     `server/tests/worksheetScrutiny.test.ts` against
 *     `buildCurriculumAuthorityPreamble` (the preamble alone, which
 *     IS UK-compliant).
 *   - HTTP route shape. The unit tests here cover the
 *     prompt-construction surface; integration tests for the
 *     routes themselves are out of scope for PR-7.
 */

import { describe, it, expect } from "vitest";

import {
  buildServerWorksheetSystemPrompt,
  buildCurriculumAuthorityManifesto,
  buildCurriculumAuthorityPreamble,
  buildNonNegotiablesBlock,
  buildPedagogicalRegisterNote,
  classifyKeyStage,
  isUKEnglishCompliant,
  REQUIRED_MANIFESTO_HEADERS,
  type CurriculumAuthorityInputs,
} from "../lib/curriculumAuthorityPromptServer";

// ─── 1. Required manifesto headers ──────────────────────────────────────────

describe("PR-7 / buildServerWorksheetSystemPrompt — required manifesto headers", () => {
  const baseInputs: CurriculumAuthorityInputs = {
    subject: "Mathematics",
    yearGroup: "Year 10",
    examBoard: "AQA",
    topic: "Adding fractions",
  };
  const role = "You are an expert UK teacher creating worksheet questions.";
  const out = buildServerWorksheetSystemPrompt({
    inputs: baseInputs,
    role,
    outputContract: "Return ONLY valid JSON — no markdown.",
  });

  it("contains every header listed in REQUIRED_MANIFESTO_HEADERS", () => {
    for (const header of REQUIRED_MANIFESTO_HEADERS) {
      expect(out, `missing header: "${header}"`).toContain(header);
    }
  });

  it("contains all six non-negotiable clauses", () => {
    expect(out).toContain("1. UK ENGLISH ONLY");
    expect(out).toContain("2. SI UNITS ONLY");
    expect(out).toContain("3. UK CONTEXTS ONLY");
    expect(out).toContain("4. NO COPYRIGHTED PAST-PAPER TEXT VERBATIM");
    expect(out).toContain("5. AWARDING-BODY COMMAND WORDS ONLY");
    expect(out).toContain("6. NO FABRICATED CODES");
  });

  it("contains a PEDAGOGICAL REGISTER block tied to the year group", () => {
    expect(out).toMatch(/PEDAGOGICAL REGISTER — GCSE/);
  });

  it("preserves the caller's role text verbatim", () => {
    expect(out).toContain(role);
  });

  it("places the OUTPUT CONTRACT last when supplied", () => {
    const contract = "Return ONLY valid JSON — no markdown.";
    const idx = out.indexOf(contract);
    expect(idx).toBeGreaterThan(-1);
    // Only the contract trails — nothing else after it.
    expect(out.slice(idx + contract.length).trim()).toBe("");
  });
});

// ─── 2. Awarding-body clause is GCSE-and-A-Level only ───────────────────────

describe("PR-7 / awarding body in the preamble — GCSE+ only", () => {
  /**
   * The "published <board> specification" clause is the GCSE-only
   * surface. The non-negotiables block ALSO mentions awarding bodies
   * generically (e.g. `"AQA Nov 2022 P2 Q5"` as a metadata-citation
   * example) so we can't just check for the bare board label.
   */
  function hasGcsePublishedClause(out: string, board: string): boolean {
    return new RegExp(`The published ${board} specification`).test(out);
  }

  it("emits 'the published AQA specification' for a GCSE + AQA call", () => {
    const out = buildServerWorksheetSystemPrompt({
      inputs: { subject: "Mathematics", yearGroup: "Year 10", examBoard: "AQA", topic: "Algebra" },
      role: "R",
    });
    expect(hasGcsePublishedClause(out, "AQA")).toBe(true);
    expect(out).toContain("AO1–AO4 only — never AO5+");
  });

  it("normalises 'edexcel' to 'Pearson Edexcel' in the GCSE clause", () => {
    const out = buildServerWorksheetSystemPrompt({
      inputs: { subject: "Physics", yearGroup: "Year 11", examBoard: "edexcel", topic: "Forces" },
      role: "R",
    });
    expect(hasGcsePublishedClause(out, "Pearson Edexcel")).toBe(true);
  });

  it("emits the GCSE clause for OCR / WJEC / Eduqas / CCEA / CIE", () => {
    for (const board of ["OCR", "WJEC", "Eduqas", "CCEA", "CIE"]) {
      const out = buildServerWorksheetSystemPrompt({
        inputs: { subject: "Geography", yearGroup: "Year 11", examBoard: board, topic: "Coasts" },
        role: "R",
      });
      expect(
        hasGcsePublishedClause(out, board),
        `awarding body "${board}" missing from GCSE preamble`,
      ).toBe(true);
    }
  });

  it("does NOT emit a 'published <board> specification' clause for KS3", () => {
    const out = buildServerWorksheetSystemPrompt({
      inputs: { subject: "Science", yearGroup: "Year 8", topic: "Electricity" },
      role: "R",
    });
    expect(out).toContain("KS3 scheme of work");
    for (const board of ["AQA", "Pearson Edexcel", "OCR", "WJEC", "Eduqas", "CCEA", "CIE"]) {
      expect(
        hasGcsePublishedClause(out, board),
        `unexpected GCSE clause for "${board}" in KS3 preamble`,
      ).toBe(false);
    }
  });

  it("does NOT emit a 'published <board> specification' clause for KS1 / KS2", () => {
    for (const yg of ["Year 1", "Year 5"]) {
      const out = buildServerWorksheetSystemPrompt({
        inputs: { subject: "Mathematics", yearGroup: yg, topic: "Place value" },
        role: "R",
      });
      expect(out).toContain("class teacher");
      for (const board of ["AQA", "Pearson Edexcel", "OCR", "WJEC", "Eduqas", "CCEA", "CIE"]) {
        expect(
          hasGcsePublishedClause(out, board),
          `unexpected GCSE clause for "${board}" in ${yg} preamble`,
        ).toBe(false);
      }
    }
  });

  it("ignores examBoard at KS3 even if the caller passes one", () => {
    // Some callsites pass examBoard for every request (the form has it as
    // a single field). The preamble must drop it below GCSE so the
    // model doesn't try to align KS3 work to AQA's GCSE command-word list.
    const out = buildServerWorksheetSystemPrompt({
      inputs: { subject: "Maths", yearGroup: "Year 8", examBoard: "AQA", topic: "Fractions" },
      role: "R",
    });
    expect(out).toContain("KS3 scheme of work");
    expect(out).not.toMatch(/AQA's command-word list/);
  });
});

// ─── 3. Pedagogical register scales by key stage ────────────────────────────

describe("PR-7 / pedagogical register — distinct per key stage", () => {
  function registerOnly(yearGroup: string, subject = "Mathematics") {
    return buildPedagogicalRegisterNote({ yearGroup, subject });
  }

  it("KS1 / KS2 / KS3 / GCSE / A-Level produce DIFFERENT register text", () => {
    const ks1 = registerOnly("Year 1");
    const ks2 = registerOnly("Year 5");
    const ks3 = registerOnly("Year 8");
    const gcse = registerOnly("Year 10");
    const aLevel = registerOnly("Year 13");
    const set = new Set([ks1, ks2, ks3, gcse, aLevel]);
    expect(set.size).toBe(5);
  });

  it("matches the expected key-stage label", () => {
    expect(registerOnly("Year 1")).toMatch(/PEDAGOGICAL REGISTER — KS1/);
    expect(registerOnly("Year 5")).toMatch(/PEDAGOGICAL REGISTER — KS2/);
    expect(registerOnly("Year 8")).toMatch(/PEDAGOGICAL REGISTER — KS3/);
    expect(registerOnly("Year 10")).toMatch(/PEDAGOGICAL REGISTER — GCSE/);
    expect(registerOnly("Year 13")).toMatch(/PEDAGOGICAL REGISTER — A-Level/);
  });

  it("appends the maths-only working-out-box reminder ONLY for sciences", () => {
    const physics = registerOnly("Year 10", "Physics");
    const biology = registerOnly("Year 10", "Biology");
    const chemistry = registerOnly("Year 10", "Chemistry");
    const generalScience = registerOnly("Year 10", "Combined Science");
    const maths = registerOnly("Year 10", "Mathematics");
    const english = registerOnly("Year 10", "English Literature");
    const history = registerOnly("Year 10", "History");

    for (const reg of [physics, biology, chemistry, generalScience]) {
      expect(reg).toContain("maths-only");
    }
    for (const reg of [maths, english, history]) {
      expect(reg).not.toContain("maths-only");
    }
  });
});

// ─── 4. Topic appears in the preamble ───────────────────────────────────────

describe("PR-7 / topic surfacing in the preamble", () => {
  it("quotes the topic verbatim in the authority chain", () => {
    const out = buildServerWorksheetSystemPrompt({
      inputs: { subject: "English Literature", yearGroup: "Year 11", examBoard: "AQA", topic: "Macbeth Act 1 Scene 5" },
      role: "R",
    });
    expect(out).toContain('"Macbeth Act 1 Scene 5"');
  });

  it("falls back to 'the topic' when the topic is missing", () => {
    const out = buildServerWorksheetSystemPrompt({
      inputs: { subject: "Mathematics", yearGroup: "Year 10", examBoard: "AQA" },
      role: "R",
    });
    expect(out).toContain("the topic");
  });
});

// ─── 5. Helper purity / determinism ─────────────────────────────────────────

describe("PR-7 / helper is pure + deterministic", () => {
  it("identical inputs always produce identical output", () => {
    const inputs: CurriculumAuthorityInputs = {
      subject: "Biology",
      yearGroup: "Year 11",
      examBoard: "AQA",
      topic: "Bioenergetics",
    };
    const a = buildServerWorksheetSystemPrompt({ inputs, role: "Role text", outputContract: "Return JSON." });
    const b = buildServerWorksheetSystemPrompt({ inputs, role: "Role text", outputContract: "Return JSON." });
    expect(b).toBe(a);
  });

  it("output is stable when the input object is built with keys in different orders", () => {
    const a = buildServerWorksheetSystemPrompt({
      inputs: { subject: "Maths", yearGroup: "Year 10", examBoard: "AQA", topic: "Algebra" },
      role: "R",
    });
    const b = buildServerWorksheetSystemPrompt({
      inputs: { topic: "Algebra", examBoard: "AQA", yearGroup: "Year 10", subject: "Maths" },
      role: "R",
    });
    expect(b).toBe(a);
  });
});

// ─── 6. Output contract is optional ─────────────────────────────────────────

describe("PR-7 / output contract — optional trailer", () => {
  it("omits the output-contract block when not supplied", () => {
    const out = buildServerWorksheetSystemPrompt({
      inputs: { subject: "Maths", yearGroup: "Year 10", examBoard: "AQA", topic: "Algebra" },
      role: "R",
    });
    // The role is the LAST block.
    expect(out.endsWith("R")).toBe(true);
  });

  it("omits the output-contract block when supplied as an empty / whitespace string", () => {
    const out = buildServerWorksheetSystemPrompt({
      inputs: { subject: "Maths", yearGroup: "Year 10", examBoard: "AQA", topic: "Algebra" },
      role: "R",
      outputContract: "   ",
    });
    expect(out.endsWith("R")).toBe(true);
  });
});

// ─── 7. classifyKeyStage boundary contract ──────────────────────────────────

describe("PR-7 / classifyKeyStage — boundary cases", () => {
  it("Year 6 → KS2 / Year 7 → KS3 / Year 11 → GCSE / Year 12 → A-Level", () => {
    expect(classifyKeyStage("Year 6")).toBe("KS2");
    expect(classifyKeyStage("Year 7")).toBe("KS3");
    expect(classifyKeyStage("Year 11")).toBe("GCSE");
    expect(classifyKeyStage("Year 12")).toBe("A-Level");
  });
});

// ─── 8. Convenience helper buildCurriculumAuthorityManifesto ────────────────

describe("PR-7 / buildCurriculumAuthorityManifesto — manifesto-only output", () => {
  it("returns preamble + non-negotiables + register, in that order", () => {
    const out = buildCurriculumAuthorityManifesto({
      subject: "Mathematics", yearGroup: "Year 10", examBoard: "AQA", topic: "Algebra",
    });
    const idxA = out.indexOf("CURRICULUM AUTHORITY");
    const idxB = out.indexOf("NON-NEGOTIABLES");
    const idxC = out.indexOf("PEDAGOGICAL REGISTER");
    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxB).toBeGreaterThan(idxA);
    expect(idxC).toBeGreaterThan(idxB);
  });

  it("does NOT include the role or output contract — those are caller-supplied", () => {
    const out = buildCurriculumAuthorityManifesto({
      subject: "Maths", yearGroup: "Year 10", examBoard: "AQA", topic: "Algebra",
    });
    expect(out).not.toContain("You are an expert");
    expect(out).not.toContain("Return ONLY");
  });

  it("matches the first three blocks of buildServerWorksheetSystemPrompt", () => {
    const inputs: CurriculumAuthorityInputs = {
      subject: "Mathematics",
      yearGroup: "Year 10",
      examBoard: "AQA",
      topic: "Algebra",
    };
    const manifesto = buildCurriculumAuthorityManifesto(inputs);
    const full = buildServerWorksheetSystemPrompt({ inputs, role: "R" });
    expect(full.startsWith(manifesto)).toBe(true);
  });
});

// ─── 9. Re-exports — sanity check ───────────────────────────────────────────

describe("PR-7 / re-exports from the client lib", () => {
  it("buildCurriculumAuthorityPreamble + buildNonNegotiablesBlock + buildPedagogicalRegisterNote are callable through the server shim", () => {
    expect(typeof buildCurriculumAuthorityPreamble).toBe("function");
    expect(typeof buildNonNegotiablesBlock).toBe("function");
    expect(typeof buildPedagogicalRegisterNote).toBe("function");
  });

  it("buildNonNegotiablesBlock is static — same call always yields the same string", () => {
    expect(buildNonNegotiablesBlock()).toBe(buildNonNegotiablesBlock());
  });

  it("isUKEnglishCompliant is callable through the shim and agrees with the client predicate", () => {
    // The shim merely re-exports the predicate. Locking that the
    // function reaches the server build without surprise.
    expect(typeof isUKEnglishCompliant).toBe("function");
    expect(isUKEnglishCompliant("Calculate the area in metres squared.")).toBe(true);
    expect(isUKEnglishCompliant("Calculate the area in meters squared.")).toBe(false);
  });
});

// ─── 10. The preamble alone (without the non-negotiables block) is UK-compliant ──

describe("PR-7 / buildCurriculumAuthorityPreamble is UK-English compliant on its own", () => {
  // The non-negotiables deliberately quote US drift words as
  // counter-examples ("colour" not "color", …) so the manifesto as a
  // whole is NOT compliant. The preamble alone — which is what the
  // server prepends to per-endpoint role text — is.
  it("GCSE preamble emits zero US drift", () => {
    const p = buildCurriculumAuthorityPreamble({
      subject: "Mathematics", yearGroup: "Year 10", examBoard: "AQA", topic: "Adding fractions",
    });
    expect(isUKEnglishCompliant(p)).toBe(true);
  });

  it("KS3 preamble emits zero US drift", () => {
    const p = buildCurriculumAuthorityPreamble({
      subject: "Science", yearGroup: "Year 8", topic: "Electricity",
    });
    expect(isUKEnglishCompliant(p)).toBe(true);
  });

  it("KS2 preamble emits zero US drift", () => {
    const p = buildCurriculumAuthorityPreamble({
      subject: "Mathematics", yearGroup: "Year 5", topic: "Place value",
    });
    expect(isUKEnglishCompliant(p)).toBe(true);
  });
});
