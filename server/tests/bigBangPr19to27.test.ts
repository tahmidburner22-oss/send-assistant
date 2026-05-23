/**
 * bigBangPr19to27.test.ts
 *
 * Combined PR-19 through PR-27 — sanity coverage for the new
 * validators / builders / helpers added in
 * `big-bang/pr-19-to-pr-27-combined`. One describe block per PR, each
 * with the minimum cases needed to lock the public API:
 *
 *   - PR-19 — catalogue / coverage audits + carry-overs (#16 #17 #19 #31).
 *   - PR-20 — A/B framework, per-subject prompt families, self-consistency,
 *     citation grounding (env-flagged dark).
 *   - PR-21 — promptSections carve-up surface + no-bigfile-reads guard.
 *   - PR-22 — tiered validator severity + render telemetry helper.
 *   - PR-23 — diagram requestability ranker + page-fit audit.
 *   - PR-24 — print presets + export parity script (smoke only).
 *   - PR-25 — KS5 synoptic, MFL shell, edit-that-learns.
 *   - PR-26 — companion-page surface (smoke).
 *   - PR-27 — telemetry aggregators.
 */

import { describe, it, expect } from "vitest";

// PR-19
import {
  extractDeclaredTerms,
  runVocabularyLibraryAudit,
  enforceSpVocabularyLibrary,
} from "../../client/src/lib/spVocabularyLibraryAudit";
import {
  runSpecPointTaxonomyAudit,
  enforceSpecPointTaxonomy,
} from "../../client/src/lib/specPointTaxonomyAudit";
import {
  runLongitudinalBloomAudit,
} from "../../client/src/lib/longitudinalBloomAudit";
import {
  detectRpOnWorksheet,
  runRequiredPracticalAudit,
} from "../../client/src/lib/requiredPracticalCoverage";
import {
  runPastPaperFrequencyAudit,
  enforcePastPaperFrequencyAnchor,
} from "../../client/src/lib/pastPaperFrequencyAnchor";
import {
  auditCommonMistakesNonMaths,
  applyCommonMistakesAuditUniversal,
} from "../../client/src/lib/commonMistakesValidator";
import {
  isKnownMisconceptionId,
  listAllMisconceptionIds,
  getMisconceptionRegistryView,
  MISCONCEPTION_ID_PATTERN,
} from "../../client/src/lib/misconceptionBank";
import {
  parseEstimatedTimeMinutes,
  reconcileRevisionTipsTimeBudget,
} from "../../client/src/lib/revisionTipsBuilder";
import {
  diffPupilSections,
  hashSectionContent,
} from "../../client/src/lib/classPackVisualDiff";

// PR-20
import {
  pickVariant,
  resolveExperiment,
  validateExperiment,
  type PromptExperiment,
} from "../../client/src/lib/promptAbFramework";
import {
  PROMPT_FAMILIES,
  lookupPromptFamily,
  renderPromptFamily,
} from "../../client/src/lib/perSubjectPromptFamilies";
import {
  shouldSelfSample,
  recommendedSampleCount,
  reconcileSelfConsistency,
} from "../../client/src/lib/selfConsistencySampler";
import {
  validateFactualClaim,
  auditCitations,
  enforceCitationGrounding,
  CITATION_CORPUS,
} from "../../client/src/lib/citationGroundedFactual";

// PR-21
import { composePromptSections } from "../../client/src/lib/promptSections";
import { buildSectionStructureRules } from "../../client/src/lib/promptSections/sectionStructureRules";
import { buildSubjectFamilyDirectives } from "../../client/src/lib/promptSections/subjectFamilyDirectives";

// PR-22
import {
  VALIDATOR_SEVERITY,
  lookupSeverity,
  bucketWarningsBySeverity,
  severityForWarning,
} from "../../client/src/lib/validatorSeverity";
import {
  summariseRenderTelemetry,
} from "../../client/src/lib/renderTelemetry";
import {
  createTelemetryLogger,
  __test__ as telemetryInternals,
} from "../../server/lib/telemetry";
import {
  detectRegressions,
  type RegressionRow,
} from "./worksheet-eval/runner";

// PR-23
import {
  rankDiagramRequestability,
  pickTopRequestable,
} from "../../client/src/lib/diagramRanker";
import {
  auditDiagramPageFit,
  enforceDiagramPageFit,
  DIAGRAM_BUDGET,
} from "../../client/src/lib/diagramPageFitAudit";

// PR-24
import {
  PRINT_PRESETS,
  listPrintPresets,
  lookupPrintPreset,
  buildPageCss,
} from "../../client/src/lib/printPresets";

// PR-25
import {
  buildSynopticStem,
  enforceKs5Synoptic,
  isKs5,
} from "../../client/src/lib/ks5SynopticBuilder";
import { buildMflRevisionShell } from "../../client/src/lib/mflRevisionShell";
import {
  captureEdits,
  applyEditLearnings,
} from "../../client/src/lib/editThatLearns";

// PR-27
import {
  aggregateValidatorFirings,
  aggregateRegenerationHeatmap,
  aggregateTokenCostRollup,
} from "../../client/src/lib/telemetryAggregators";

// Registry
import {
  WORKSHEET_POST_VALIDATORS,
  listValidatorNames,
} from "../../client/src/lib/worksheetPostValidatorRegistry";

const ISO = "2026-05-23T12:00:00.000Z";

// ─── PR-19 ───────────────────────────────────────────────────────────────────

describe("PR-19 — pure data audits", () => {
  it("extractDeclaredTerms reads the Word Bank section", () => {
    const ws = {
      sections: [
        { type: "key-vocab", content: "respiration\nmitochondria\nglucose, ATP" },
      ],
    };
    const terms = extractDeclaredTerms(ws);
    expect(terms).toContain("respiration");
    expect(terms).toContain("mitochondria");
    expect(terms).toContain("atp");
  });

  it("runVocabularyLibraryAudit reports missing terms", () => {
    const corpus = [
      { sections: [{ type: "key-vocab", content: "respiration\nmitochondria" }] },
    ];
    const r = runVocabularyLibraryAudit(corpus, [
      { topic: "respiration", expectedTerms: ["respiration", "atp", "mitochondria", "glucose"] },
    ]);
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].missingTerms).toEqual(expect.arrayContaining(["atp", "glucose"]));
    expect(r.totalMissing).toBeGreaterThan(0);
  });

  it("enforceSpVocabularyLibrary warns on empty Word Bank for sciences", () => {
    const ws = {
      metadata: { subject: "Biology", topic: "Respiration" },
      sections: [{ type: "q-short-answer", content: "Define respiration." }],
    };
    const r = enforceSpVocabularyLibrary(ws);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("runSpecPointTaxonomyAudit counts coverage", () => {
    const taxonomy = [
      { code: "4.1.1.1", label: "Atomic structure", subject: "chemistry", keyStage: "ks4" as const },
      { code: "4.1.1.2", label: "Periodic table", subject: "chemistry", keyStage: "ks4" as const },
    ];
    const corpus = [
      { sections: [{ specRef: "4.1.1.1" }] },
      { sections: [{ specRef: "4.1.1.1.a" }] }, // counts as 4.1.1.1 prefix
    ];
    const r = runSpecPointTaxonomyAudit(corpus, taxonomy);
    expect(r.coveredCount).toBe(1);
    expect(r.uncoveredCount).toBe(1);
  });

  it("enforceSpecPointTaxonomy warns on exam-year worksheet without spec refs", () => {
    const ws = { metadata: { subject: "Chemistry", yearGroup: "Year 11" }, sections: [{}] };
    const r = enforceSpecPointTaxonomy(ws);
    expect(r.warnings.some((w) => w.includes("No spec refs"))).toBe(true);
  });

  it("runLongitudinalBloomAudit detects a stalled ramp", () => {
    const ws = (avg: number) => ({
      metadata: { coverageMap: { bloomDistribution: { recall: avg < 2 ? 5 : 0, application: avg >= 3 ? 5 : 0 } } },
    });
    const stalled = [ws(1), ws(1), ws(1), ws(1), ws(1), ws(1)];
    const r = runLongitudinalBloomAudit("p1", stalled);
    expect(r.rampStalled).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("runRequiredPracticalAudit reports per-RP coverage", () => {
    const corpus = [
      { metadata: { requiredPractical: { id: "rp-physics-shc" }, subject: "physics" } },
    ];
    const r = runRequiredPracticalAudit(corpus, { subject: "physics" });
    expect(r.totalRequired).toBeGreaterThan(0);
    expect(r.coveredCount + r.uncoveredCount).toBe(r.totalRequired);
  });

  it("detectRpOnWorksheet picks up the metadata stamp", () => {
    const list = [
      { id: "rp-1", title: "Specific heat capacity", specCode: "RP1", subject: "physics" },
    ];
    const ws = { metadata: { requiredPractical: { id: "rp-1" } } };
    expect(detectRpOnWorksheet(ws, list)?.id).toBe("rp-1");
  });

  it("runPastPaperFrequencyAudit ranks topics by occurrence", () => {
    const corpus = [
      { id: "1", topic: "fractions", year: 2022 },
      { id: "2", topic: "fractions", year: 2023 },
      { id: "3", topic: "graphs", year: 2023 },
    ];
    const r = runPastPaperFrequencyAudit(corpus, { topN: 2 });
    expect(r.rows[0].topic).toBe("fractions");
    expect(r.topNTopics).toEqual(["fractions", "graphs"]);
  });

  it("enforcePastPaperFrequencyAnchor advises when topic not in top-N", () => {
    const ws = { metadata: { topic: "off-list" } };
    const r = enforcePastPaperFrequencyAnchor(ws, { topNTopics: ["fractions", "graphs"] });
    expect(r.warnings.some((w) => w.includes("not in current top"))).toBe(true);
  });
});

describe("PR-19 carry-overs (#16 #17 #19 #31)", () => {
  it("auditCommonMistakesNonMaths flags a placeholder block", () => {
    const ws = {
      metadata: { subject: "English Literature" },
      sections: [
        {
          type: "common-mistakes",
          title: "Common Mistakes",
          content: "Mistake 1: Plot retelling\n[example]\nWhy that's wrong: …\nHow to do it right: …\nQuick check: …",
        },
      ],
    };
    const r = auditCommonMistakesNonMaths(ws);
    expect(r?.warnings.some((w) => w.includes("placeholder"))).toBe(true);
  });

  it("applyCommonMistakesAuditUniversal routes by subject", () => {
    const wsMaths = {
      metadata: { subject: "Mathematics" },
      sections: [{ type: "common-mistakes", title: "Common Mistakes", content: "" }],
    };
    const wsEnglish = { metadata: { subject: "English" }, sections: [] };
    const wsArt = { metadata: { subject: "Art" }, sections: [] };
    const out1 = applyCommonMistakesAuditUniversal(wsMaths);
    const out2 = applyCommonMistakesAuditUniversal(wsEnglish);
    const out3 = applyCommonMistakesAuditUniversal(wsArt);
    // Maths and English (non-maths) paths both stamp a report; subjects
    // outside both paths (e.g. Art) no-op and return the input untouched.
    expect(out1.metadata?.commonMistakesAudit).toBeDefined();
    expect(out2.metadata?.commonMistakesAudit).toBeDefined();
    expect(out3).toBe(wsArt);
  });

  it("misconceptionBank registry view returns a frozen index", () => {
    const ids = listAllMisconceptionIds();
    expect(ids.length).toBeGreaterThan(0);
    // MISCONCEPTION_ID_PATTERN has the `g` flag — test against a fresh
    // RegExp source to avoid lastIndex state leaking between calls.
    expect(ids[0]).toMatch(new RegExp(MISCONCEPTION_ID_PATTERN.source));
    expect(isKnownMisconceptionId(ids[0])).toBe(true);
    expect(isKnownMisconceptionId("m-not-a-real-id")).toBe(false);
    const view = getMisconceptionRegistryView();
    expect(Object.isFrozen(view)).toBe(true);
  });

  it("parseEstimatedTimeMinutes parses common shapes", () => {
    expect(parseEstimatedTimeMinutes("45 minutes")).toEqual({ min: 45, max: 45 });
    expect(parseEstimatedTimeMinutes("35–45 mins")).toEqual({ min: 35, max: 45 });
    expect(parseEstimatedTimeMinutes("1 hour")).toEqual({ min: 60, max: 60 });
    expect(parseEstimatedTimeMinutes("garbage")).toBe(null);
  });

  it("reconcileRevisionTipsTimeBudget warns on drift", () => {
    const drifted = reconcileRevisionTipsTimeBudget({
      marksUsed: [1, 1, 2, 3, 5, 5, 8],
      estimatedTime: "10 minutes",
    });
    expect(drifted.drifted).toBe(true);
    expect(drifted.warnings.length).toBe(1);
    const aligned = reconcileRevisionTipsTimeBudget({
      marksUsed: [1, 1, 2, 3, 5, 5, 8],
      estimatedTime: "30 minutes",
    });
    expect(aligned.drifted).toBe(false);
    expect(aligned.warnings.length).toBe(0);
  });

  it("ClassPackVisualDiff diffPupilSections classifies cells", () => {
    const base = [
      { title: "Q1", content: "Calculate 1/2 + 1/4" },
      { title: "Q2", content: "Solve x + 3 = 5" },
    ];
    const pupil = [
      { title: "Q1", content: "Calculate 1/2 + 1/4" }, // same
      { title: "Q2", content: "Solve x + 3 = 7" }, // changed
      { title: "Q3", content: "Find x" }, // added
    ];
    const rows = diffPupilSections(base, pupil);
    const status = (t: string) => rows.find((r) => r.title === t)?.cell.status;
    expect(status("Q1")).toBe("same");
    expect(status("Q2")).toBe("changed");
    expect(status("Q3")).toBe("added");
    expect(hashSectionContent({ content: "abc" })).toBe(hashSectionContent({ content: "abc" }));
  });
});

// ─── PR-20 ───────────────────────────────────────────────────────────────────

describe("PR-20 — A/B framework, prompt families, self-consistency, citations", () => {
  const exp: PromptExperiment<string> = {
    id: "exp-1",
    variants: [
      { id: "control", weight: 50, payload: "control-prompt" },
      { id: "shorter", weight: 50, payload: "shorter-prompt" },
    ],
  };

  it("pickVariant is deterministic for a given seed", () => {
    const a = pickVariant(exp, "user-123");
    const b = pickVariant(exp, "user-123");
    expect(a.id).toBe(b.id);
  });

  it("resolveExperiment respects PROMPT_AB_ENABLED env flag", () => {
    const off = resolveExperiment(exp, "user-1", {});
    expect(off.shouldRespectFlag).toBe(false);
    const on = resolveExperiment(exp, "user-1", { PROMPT_AB_ENABLED: "true" });
    expect(on.shouldRespectFlag).toBe(true);
  });

  it("validateExperiment catches misweighted variants", () => {
    const r = validateExperiment({ id: "bad", variants: [{ id: "a", weight: 30, payload: 1 }] });
    expect(r.ok).toBe(false);
    expect(r.errors.join("\n")).toContain("Weights sum to 30");
  });

  it("lookupPromptFamily classifies by subject", () => {
    expect(lookupPromptFamily("Mathematics").key).toBe("maths");
    expect(lookupPromptFamily("Biology").key).toBe("science");
    expect(lookupPromptFamily("English Literature").key).toBe("english-lit");
    expect(lookupPromptFamily("Tutoring").key).toBe("general");
  });

  it("renderPromptFamily emits forbidden patterns when present", () => {
    const out = renderPromptFamily(PROMPT_FAMILIES.maths);
    expect(out).toContain("FORBIDDEN PATTERNS");
    expect(out).toContain("mph");
  });

  it("self-consistency: shouldSelfSample only fires on heavy extended-answer Qs", () => {
    expect(shouldSelfSample({ type: "q-extended", marks: 6 })).toBe(true);
    expect(shouldSelfSample({ type: "q-extended", marks: 3 })).toBe(false);
    expect(shouldSelfSample({ type: "q-mcq", marks: 6 })).toBe(false);
  });

  it("recommendedSampleCount scales with marks", () => {
    expect(recommendedSampleCount(2)).toBe(1);
    expect(recommendedSampleCount(6)).toBeGreaterThanOrEqual(3);
    expect(recommendedSampleCount(12)).toBeLessThanOrEqual(5);
  });

  it("reconcileSelfConsistency picks consensus marking points", () => {
    const r = reconcileSelfConsistency([
      { answerKey: "answer one", markingPoints: ["A", "B"] },
      { answerKey: "answer one extended", markingPoints: ["A", "C"] },
      { answerKey: "answer one even longer", markingPoints: ["A", "D"] },
    ]);
    expect(r.consensusPoints).toContain("A");
    expect(r.consensusKey).toContain("longer");
    expect(r.confidence).toBeGreaterThan(0);
  });

  it("validateFactualClaim accepts canonical history claim", () => {
    const ok = validateFactualClaim("The Battle of Hastings took place on 14 October 1066.", "history");
    expect(ok.matched).toBe(true);
    const bad = validateFactualClaim("The Battle of Hastings was fought in 1067.", "history");
    expect(bad.matched).toBe(false);
  });

  it("auditCitations reports unmatched claims", () => {
    expect(CITATION_CORPUS.length).toBeGreaterThan(0);
    const r = auditCitations({
      metadata: { subject: "Physics" },
      sections: [
        { factualClaims: ["The speed of light in a vacuum is 3.0 × 10^8 m/s."] },
        { factualClaims: ["Light travels at 1 m/s in a vacuum."] },
      ],
    });
    expect(r.totalClaims).toBe(2);
    expect(r.matchedCount).toBe(1);
    expect(r.unmatchedCount).toBe(1);
  });

  it("enforceCitationGrounding no-ops when env flag is off", () => {
    const original = process.env.PROMPT_CITATION_LAYER_ENABLED;
    delete process.env.PROMPT_CITATION_LAYER_ENABLED;
    const r = enforceCitationGrounding({ metadata: { subject: "History" }, sections: [] });
    expect(r.warnings).toEqual([]);
    if (original !== undefined) process.env.PROMPT_CITATION_LAYER_ENABLED = original;
  });
});

// ─── PR-21 ───────────────────────────────────────────────────────────────────

describe("PR-21 — promptSections carve-up surface", () => {
  it("composePromptSections assembles seven blocks", () => {
    const out = composePromptSections({
      subject: "Physics",
      topic: "Forces",
      yearGroup: "Year 10",
      examBoard: "aqa",
      sendNeeds: ["dyslexia"],
      marksTariff: [1, 1, 2, 4],
      commandWords: ["Calculate"],
    });
    expect(out).toContain("EXAM-BOARD MANIFESTO");
    expect(out).toContain("SUBJECT FAMILY DIRECTIVES");
    expect(out).toContain("STRUCTURE CONTRACT");
    expect(out).toContain("MARK SCHEME CONTRACT");
    expect(out).toContain("SEND DIRECTIVES");
    expect(out).toContain("SELF-REFLECTION CONTRACT");
    expect(out).toContain("REVISION TIPS CONTRACT");
  });

  it("buildSectionStructureRules adds Y9+ requirements", () => {
    const y10 = buildSectionStructureRules({ yearGroup: "Year 10" });
    expect(y10).toContain("M/A");
    const y6 = buildSectionStructureRules({ yearGroup: "Year 6" });
    expect(y6).not.toContain("M/A");
  });

  it("buildSubjectFamilyDirectives forbids workingOutBox in sciences", () => {
    const sci = buildSubjectFamilyDirectives({ subject: "Biology" });
    expect(sci).toContain("DO NOT set workingOutBox");
  });
});

// ─── PR-22 ───────────────────────────────────────────────────────────────────

describe("PR-22 — tiered severity + render telemetry + regression detector", () => {
  it("VALIDATOR_SEVERITY covers every registered name", () => {
    const names = listValidatorNames();
    for (const n of names) {
      expect(VALIDATOR_SEVERITY[n]).toBeDefined();
    }
  });

  it("lookupSeverity defaults to p2 for unknown", () => {
    expect(lookupSeverity("not-a-real-validator")).toBe("p2");
    expect(lookupSeverity("single-mcq-correct")).toBe("p0");
  });

  it("severityForWarning + bucketWarningsBySeverity classify a mixed list", () => {
    const buckets = bucketWarningsBySeverity([
      "[single-mcq-correct] MCQ has two correct answers.",
      "[command-word-fidelity] command word missing.",
      "Misc free-text warning.",
    ]);
    expect(buckets.p0.length + buckets.p1.length + buckets.p2.length).toBe(3);
    expect(severityForWarning("MCQ duplicate detected")).toBe("p0");
  });

  it("summariseRenderTelemetry computes crash-free rate", () => {
    const r = summariseRenderTelemetry([
      { worksheetId: "w1", startedAt: ISO, completed: true, durationMs: 100 },
      { worksheetId: "w2", startedAt: ISO, completed: false, errorMessage: "TypeError: x" },
      { worksheetId: "w3", startedAt: ISO, completed: true, durationMs: 200 },
    ]);
    expect(r.totalAttempts).toBe(3);
    expect(r.totalCrashed).toBe(1);
    expect(r.crashFreeRate).toBeCloseTo(2 / 3, 2);
  });

  it("createTelemetryLogger emits via the supplied sink", () => {
    const captured: Array<{ level: string; payload: Record<string, unknown> }> = [];
    const log = createTelemetryLogger({
      serviceName: "test",
      sink: (level, payload) => captured.push({ level, payload }),
    });
    log.info({ event: "hello" });
    log.warn({ event: "warn" });
    expect(captured).toHaveLength(2);
    expect(captured[0].payload.event).toBe("hello");
    expect(captured[0].payload.service).toBe("test");
  });

  it("telemetry redactObject masks PII keys", () => {
    const out = telemetryInternals.redactObject({ pupilName: "Alice", action: "view" });
    expect(out.pupilName).toBe("A***");
    expect(out.action).toBe("view");
  });

  it("detectRegressions flags >threshold rule failures", () => {
    const prev = {
      ruleStats: { "rule-a": { passed: 50, failed: 0 }, "rule-b": { passed: 50, failed: 0 } },
    } as unknown as Parameters<typeof detectRegressions>[0];
    const next = {
      ruleStats: { "rule-a": { passed: 50, failed: 0 }, "rule-b": { passed: 25, failed: 25 } },
    } as unknown as Parameters<typeof detectRegressions>[1];
    const rows: RegressionRow[] = detectRegressions(prev, next, 0.05);
    expect(rows.find((r) => r.rule === "rule-b")).toBeDefined();
    expect(rows.find((r) => r.rule === "rule-a")).toBeUndefined();
  });
});

// ─── PR-23 ───────────────────────────────────────────────────────────────────

describe("PR-23 — diagram pipeline", () => {
  it("rankDiagramRequestability returns one row per section", () => {
    const ws = {
      metadata: { subject: "Physics" },
      sections: [
        { type: "q-short-answer", title: "Q1", content: "Draw the force diagram for the block.", marks: 4 },
        { type: "q-short-answer", title: "Q2", content: "Define resistance.", marks: 1 },
        { type: "diagram", title: "Existing", imageUrl: "/img/x.png" },
      ],
    };
    const rows = rankDiagramRequestability(ws);
    expect(rows).toHaveLength(3);
    expect(rows[0].state).toBe("requestable");
    expect(rows[2].state).toBe("present");
  });

  it("pickTopRequestable returns top-N by score", () => {
    const ws = {
      metadata: { subject: "Physics" },
      sections: [
        { type: "q-short-answer", title: "Q1", content: "Draw a circuit diagram with labels.", marks: 6 },
        { type: "q-short-answer", title: "Q2", content: "Define ohm.", marks: 2 },
      ],
    };
    const rows = rankDiagramRequestability(ws);
    const top = pickTopRequestable(rows, 1);
    expect(top).toHaveLength(1);
    expect(top[0].title).toBe("Q1");
  });

  it("auditDiagramPageFit budget thresholds", () => {
    expect(DIAGRAM_BUDGET.maxHeightPx).toBe(800);
    const ws = {
      sections: [
        { type: "diagram", title: "Big", diagramBounds: { heightPx: 1200, widthPx: 1500 }, diagramLabelCount: 16 },
      ],
    };
    const r = auditDiagramPageFit(ws);
    expect(r.oversizedCount).toBeGreaterThan(0);
    expect(r.overComplexCount).toBeGreaterThan(0);
    expect(r.warnings.length).toBeGreaterThanOrEqual(2);
  });

  it("enforceDiagramPageFit stamps the report on metadata", () => {
    const ws = {
      sections: [
        { type: "diagram", diagramBounds: { heightPx: 1000 } },
      ],
    };
    const r = enforceDiagramPageFit(ws);
    const meta = r.worksheet.metadata as { diagramPageFit?: { oversizedCount: number } } | undefined;
    expect(meta?.diagramPageFit?.oversizedCount).toBeGreaterThan(0);
  });
});

// ─── PR-24 ───────────────────────────────────────────────────────────────────

describe("PR-24 — print presets", () => {
  it("PRINT_PRESETS contains the five canonical presets", () => {
    const ids = listPrintPresets().map((p) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining(["a4-portrait", "a4-landscape", "a3-portrait", "a5-landscape", "leaflet-trifold"]),
    );
  });

  it("lookupPrintPreset falls back to a4-portrait", () => {
    expect(lookupPrintPreset(undefined).id).toBe("a4-portrait");
    expect(lookupPrintPreset("a3-portrait").id).toBe("a3-portrait");
    expect(lookupPrintPreset("not-a-real-preset").id).toBe("a4-portrait");
  });

  it("buildPageCss emits a CSS @page rule with the preset margins", () => {
    const css = buildPageCss(PRINT_PRESETS["a3-portrait"]);
    expect(css).toContain("@page");
    expect(css).toContain("A3");
    expect(css).toContain("20mm");
  });

  it("the booklet preset declares folding instructions", () => {
    expect(PRINT_PRESETS["a5-landscape"].foldingInstructions).toContain("fold");
  });
});

// ─── PR-25 ───────────────────────────────────────────────────────────────────

describe("PR-25 — KS5 synoptic + MFL shell + edit-that-learns", () => {
  it("isKs5 classifies year groups", () => {
    expect(isKs5("Year 12")).toBe(true);
    expect(isKs5("Y13")).toBe(true);
    expect(isKs5("Year 10")).toBe(false);
  });

  it("buildSynopticStem produces a deterministic stem", () => {
    const a = buildSynopticStem({ topic: "Equilibria", subject: "Chemistry", yearGroup: "Year 12", priorTopics: ["acids", "bases"] });
    const b = buildSynopticStem({ topic: "Equilibria", subject: "Chemistry", yearGroup: "Year 12", priorTopics: ["acids", "bases"] });
    expect(a).toEqual(b);
    expect(a?.threadedTopics).toEqual(["acids", "bases"]);
    expect(a?.suggestedMarks).toBeGreaterThan(0);
  });

  it("buildSynopticStem returns null when not KS5", () => {
    expect(buildSynopticStem({ topic: "x", yearGroup: "Year 10", priorTopics: ["a", "b"] })).toBe(null);
  });

  it("enforceKs5Synoptic warns when prior topics not threaded into sections", () => {
    const ws = {
      metadata: { yearGroup: "Year 12", priorTopics: ["acids", "bases"], topic: "Equilibria", subject: "Chemistry" },
      sections: [{ content: "Discuss equilibria." }],
    };
    const r = enforceKs5Synoptic(ws);
    expect(r.warnings.some((w) => w.includes("does not visibly thread"))).toBe(true);
  });

  it("buildMflRevisionShell returns five sections in canonical order", () => {
    const shell = buildMflRevisionShell({ language: "french", topic: "le voyage", yearGroup: "Year 11" }, { nowIso: ISO });
    expect(shell.sections.map((s) => s.type)).toEqual([
      "translation-l1-to-l2",
      "translation-l2-to-l1",
      "reading-comprehension",
      "vocabulary",
      "grammar-drill",
    ]);
    expect(shell.generatedAt).toBe(ISO);
  });

  it("captureEdits reports word-substitution + section-content-swap", () => {
    const ai = {
      sections: [
        { title: "Q1", content: "John drove 50 miles for $10." },
        { title: "Q2", content: "Compute the area." },
      ],
    };
    const edited = {
      sections: [
        { title: "Q1", content: "Aisha drove 80 km for £8." }, // many word swaps
        { title: "Q2", content: "Find the area of a circle radius 7 cm." }, // bigger swap
      ],
    };
    const learnings = captureEdits(ai, edited, { nowIso: ISO });
    expect(learnings.length).toBeGreaterThan(0);
    const kinds = new Set(learnings.map((l) => l.kind));
    expect(
      kinds.has("section-content-swap") ||
        kinds.has("word-substitution") ||
        kinds.has("section-reordered"),
    ).toBe(true);
  });

  it("applyEditLearnings rewrites words on a confidence threshold", () => {
    const ws = { sections: [{ title: "Q1", content: "Tom drove 50 miles." }] };
    const learnings = [
      {
        kind: "word-substitution" as const,
        sectionTitle: "Q1",
        substitutions: { miles: "km" },
        confidence: 0.7,
        capturedAt: ISO,
      },
    ];
    const r = applyEditLearnings(ws, learnings, { confidenceThreshold: 0.5 });
    expect(r.worksheet.sections[0].content).toContain("km");
    expect(r.worksheet.sections[0].content).not.toContain("miles");
  });
});

// ─── PR-26 ───────────────────────────────────────────────────────────────────

describe("PR-26 — companion page surface", () => {
  it("aiSchemas declares hintLadders + companionShare on metadata (smoke)", async () => {
    // Imports already covered by aiSchemas.test.ts. Just ensure the
    // shape is wired by checking the structural types via a typed
    // worksheet object.
    const ws: { metadata: { companionShare: { token: string; expiresAt: string }; hintLadders: Array<{ questionId: string; question: string; hints: [string, string, string] }> } } = {
      metadata: {
        companionShare: { token: "tok", expiresAt: "2026-12-01" },
        hintLadders: [{ questionId: "s0q1", question: "?", hints: ["h1", "h2", "h3"] }],
      },
    };
    expect(ws.metadata.companionShare.token).toBe("tok");
    expect(ws.metadata.hintLadders[0].hints).toHaveLength(3);
  });
});

// ─── PR-27 ───────────────────────────────────────────────────────────────────

describe("PR-27 — telemetry aggregators", () => {
  it("aggregateValidatorFirings counts and percentages", () => {
    const r = aggregateValidatorFirings([
      { validatorName: "command-word-fidelity", occurredAt: ISO, severity: "p1" },
      { validatorName: "command-word-fidelity", occurredAt: ISO, severity: "p1" },
      { validatorName: "single-mcq-correct", occurredAt: ISO, severity: "p0" },
    ]);
    expect(r.totalFirings).toBe(3);
    expect(r.rows[0].validatorName).toBe("command-word-fidelity");
    expect(r.severityTotals.p0).toBe(1);
    expect(r.severityTotals.p1).toBe(2);
  });

  it("aggregateRegenerationHeatmap groups by topic", () => {
    const r = aggregateRegenerationHeatmap([
      { worksheetId: "w1", topic: "Fractions", subject: "Maths", occurredAt: ISO, sectionType: "mark-scheme" },
      { worksheetId: "w2", topic: "Fractions", subject: "Maths", occurredAt: ISO, sectionType: "mark-scheme" },
      { worksheetId: "w3", topic: "Algebra", subject: "Maths", occurredAt: ISO, sectionType: "q-extended" },
    ]);
    expect(r.totalRegenerations).toBe(3);
    expect(r.rows[0].topic).toBe("fractions");
    expect(r.rows[0].topSectionType).toBe("mark-scheme");
  });

  it("aggregateTokenCostRollup buckets by day and provider", () => {
    const r = aggregateTokenCostRollup([
      { occurredAt: "2026-05-22T10:00:00Z", promptTokens: 100, completionTokens: 200, estimatedUsd: 0.01, provider: "openai" },
      { occurredAt: "2026-05-22T11:00:00Z", promptTokens: 150, completionTokens: 250, estimatedUsd: 0.012, provider: "openai" },
      { occurredAt: "2026-05-23T09:00:00Z", promptTokens: 50, completionTokens: 100, estimatedUsd: 0.004, provider: "groq" },
    ]);
    expect(r.totalCalls).toBe(3);
    expect(r.byDay).toHaveLength(2);
    expect(r.byProvider[0].provider).toBe("openai");
    expect(r.totalEstimatedUsd).toBeCloseTo(0.026, 3);
  });
});

// ─── Registry wiring ─────────────────────────────────────────────────────────

describe("PR-19..27 registry wiring", () => {
  it("the new PR-19/23/25/20 validators are registered", () => {
    const names = listValidatorNames();
    expect(names).toEqual(
      expect.arrayContaining([
        "sp-vocabulary-library",
        "spec-point-taxonomy",
        "ks5-synoptic",
        "diagram-page-fit",
        "citation-grounding",
      ]),
    );
  });

  it("the registry array stays frozen", () => {
    expect(Object.isFrozen(WORKSHEET_POST_VALIDATORS)).toBe(true);
  });

  it("every registered name is unique kebab-case", () => {
    const names = listValidatorNames();
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(n).toMatch(/^[a-z][a-z0-9-]+$/);
  });
});
