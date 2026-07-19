import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.fn();
const mockAll = vi.fn();
const mockRun = vi.fn();

vi.mock("../db/index.js", () => ({
  default: {
    prepare: vi.fn((sql: string) => ({
      get: (...args: unknown[]) => mockGet(sql, ...args),
      all: (...args: unknown[]) => mockAll(sql, ...args),
      run: (...args: unknown[]) => mockRun(sql, ...args),
    })),
  },
}));

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { email: "admin@adaptly.co.uk", role: "admin" };
    next();
  },
}));

import worksheetLibraryRouter from "../routes/worksheetLibrary.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/library", worksheetLibraryRouter);
  return app;
}

function fillerSections(prefix: string) {
  return [1, 2, 3].map((number) => ({
    id: `${prefix}-${number}`,
    title: `Practice ${number}`,
    type: "q-short-answer",
    content: `Complete practice question ${number}.`,
  }));
}

describe("GET /api/library/lookup", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockAll.mockReset();
    mockRun.mockReset();
  });

  it("does not return an unrelated fuzzy topic when a broad keyword overlaps", async () => {
    mockAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "alg-standard-y10",
          subject: "Maths",
          topic: "Algebra — Solving Equations",
          year_group: "Year 10",
          tier: "standard",
          title: "Algebra Standard",
        },
      ])
      .mockResolvedValueOnce([]);

    const res = await request(createApp())
      .get("/api/library/lookup")
      .query({
        subject: "Maths",
        topic: "Simultaneous Equations",
        yearGroup: "Year 11",
        tier: "standard",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ found: false });
    expect(mockGet).toHaveBeenCalledTimes(3);
  });

  it.skip("returns a safe same-topic match from another year group when no requested-year copy exists", async () => {
    mockGet
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    mockAll
      .mockResolvedValueOnce([
        {
          id: "sim-standard-y10",
          subject: "Maths",
          topic: "Simultaneous Equations",
          year_group: "Year 10",
          title: "Simultaneous Equations Standard",
          subtitle: "Year 10 | Maths",
          tier: "standard",
          sections: JSON.stringify([
            { id: "q1", title: "Q1", type: "q-short-answer", content: "Solve the simultaneous equations." },
          ]),
          teacher_sections: "[]",
          key_vocab: "[]",
          curated: 1,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ tier: "standard" }]);

    const res = await request(createApp())
      .get("/api/library/lookup")
      .query({
        subject: "Maths",
        topic: "Simultaneous Equations",
        yearGroup: "Year 11",
        tier: "standard",
      });

    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.entry).toMatchObject({
      id: "sim-standard-y10",
      topic: "Simultaneous Equations",
      year_group: "Year 10",
      tier: "standard",
    });
    expect(res.body.availableTiers).toEqual(["standard"]);
  });
});

describe("POST /api/library/resolve", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockAll.mockReset();
    mockRun.mockReset();
  });

  it("returns the curated Atomic Structure mixed worksheet with teacher sections and shared asset-backed diagrams", async () => {
    mockGet.mockResolvedValueOnce({
      id: "atomic-mixed-y11",
      subject: "Chemistry",
      topic: "Atomic Structure",
      year_group: "Year 11",
      title: "Atomic Structure - Mixed (Year 11 Chemistry)",
      subtitle: "Curated GCSE Chemistry worksheet - Mixed",
      tier: "mixed",
      sections: JSON.stringify([
        {
          id: "q1-label-diagram",
          title: "Q1 - Label the Diagram",
          type: "q-label-diagram",
          imageUrl: "/images/atom_nb_unlabelled_final.png",
          content: "Use the word bank to label the five parts of the atom.",
        },
        {
          id: "reference-labelled-carbon",
          title: "Reference Diagram - Carbon Atom",
          type: "diagram",
          imageUrl: "/images/atom_nb_labelled_final.png",
          content: "Use this labelled reference diagram to check particle placement and shell structure.",
        },
        ...fillerSections("atomic-mixed"),
      ]),
      teacher_sections: JSON.stringify([
        { id: "teacher-answer-key", title: "Teacher Answer Key", type: "mark-scheme", teacherOnly: true, content: "Answers here" },
        { id: "teacher-notes", title: "Teacher Notes", type: "teacher-notes", teacherOnly: true, content: "Notes here" },
      ]),
      key_vocab: JSON.stringify([{ term: "Atom", definition: "The smallest particle of an element." }]),
      learning_objective: "Describe atomic structure.",
      curated: 1,
      version: 3,
      canonical_topic_key: "atomic_structure",
      base_structure_json: JSON.stringify({ structuralHash: "atomic-hash" }),
    });

    mockAll
      .mockResolvedValueOnce([
        { id: "asset-unlabelled", section_key: "q1-label-diagram", asset_type: "diagram", public_url: "/images/atom_nb_unlabelled_final.png", topic_tags: "[]" },
        { id: "asset-labelled", section_key: "reference-labelled-carbon", asset_type: "diagram", public_url: "/images/atom_nb_labelled_final.png", topic_tags: "[]" },
      ])
      .mockResolvedValueOnce([
        { tier: "foundation" },
        { tier: "higher" },
        { tier: "mixed" },
        { tier: "scaffolded" },
      ]);

    const res = await request(createApp())
      .post("/api/library/resolve")
      .send({
        subject: "Chemistry",
        topic: "Atomic Structure",
        yearGroup: "Year 11",
        tier: "mixed",
      });

    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.tier).toBe("mixed");
    expect(res.body.availableTiers).toEqual(["foundation", "higher", "mixed", "scaffolded"]);
    expect(res.body.teacherSections).toHaveLength(2);
    expect(res.body.teacherSections[0]).toMatchObject({
      id: "teacher-answer-key",
      teacherOnly: true,
      title: "Teacher Answer Key",
    });
    expect(res.body.sections[0]).toMatchObject({
      id: "q1-label-diagram",
      assetRef: "asset-unlabelled",
      imageUrl: "/images/atom_nb_unlabelled_final.png",
    });
    expect(res.body.sections[1]).toMatchObject({
      id: "reference-labelled-carbon",
      assetRef: "asset-labelled",
      imageUrl: "/images/atom_nb_labelled_final.png",
    });
    expect(res.body.assets).toEqual([
      { id: "asset-unlabelled", sectionKey: "q1-label-diagram", publicUrl: "/images/atom_nb_unlabelled_final.png", assetType: "diagram" },
      { id: "asset-labelled", sectionKey: "reference-labelled-carbon", publicUrl: "/images/atom_nb_labelled_final.png", assetType: "diagram" },
    ]);
  });

  it("returns the curated Atomic Structure scaffolded worksheet with foundation wording, teacher key, and the same shared diagram assets", async () => {
    mockGet.mockResolvedValueOnce({
      id: "atomic-scaffolded-y11",
      subject: "Chemistry",
      topic: "Atomic Structure",
      year_group: "Year 11",
      title: "Atomic Structure - Scaffolded (Year 11 Chemistry)",
      subtitle: "Curated GCSE Chemistry worksheet - Scaffolded SEND version",
      tier: "scaffolded",
      sections: JSON.stringify([
        {
          id: "q5-chlorine-35",
          title: "Q5 - Chlorine-35",
          type: "q-short-answer",
          content: "An atom of chlorine is written as 35/17 Cl.\nAtomic number = 17. Mass number = 35.\n\na) How many protons does it have?\n\nb) How many neutrons does it have? Hint: mass number - atomic number.\n\nc) How many electrons does it have? Hint: in a neutral atom, electrons = protons.",
        },
        {
          id: "q1-label-diagram",
          title: "Q1 - Label the Diagram",
          type: "q-label-diagram",
          imageUrl: "/images/atom_nb_unlabelled_final.png",
          content: "Use the word bank to label the five parts of the atom.",
        },
        ...fillerSections("atomic-scaffolded"),
      ]),
      teacher_sections: JSON.stringify([
        { id: "teacher-answer-key", title: "Teacher Answer Key", type: "mark-scheme", teacherOnly: true, content: "Answers here" },
        { id: "teacher-notes", title: "Teacher Notes", type: "teacher-notes", teacherOnly: true, content: "Notes here" },
      ]),
      key_vocab: JSON.stringify([]),
      learning_objective: "Describe atomic structure.",
      curated: 1,
      version: 2,
      canonical_topic_key: "atomic_structure",
      base_structure_json: JSON.stringify({ structuralHash: "atomic-hash" }),
    });

    mockAll
      .mockResolvedValueOnce([
        { id: "asset-unlabelled", section_key: "q1-label-diagram", asset_type: "diagram", public_url: "/images/atom_nb_unlabelled_final.png", topic_tags: "[]" },
        { id: "asset-labelled", section_key: "reference-labelled-carbon", asset_type: "diagram", public_url: "/images/atom_nb_labelled_final.png", topic_tags: "[]" },
      ])
      .mockResolvedValueOnce([
        { tier: "foundation" },
        { tier: "higher" },
        { tier: "mixed" },
        { tier: "scaffolded" },
      ]);

    const res = await request(createApp())
      .post("/api/library/resolve")
      .send({
        subject: "Chemistry",
        topic: "Atomic Structure",
        yearGroup: "Year 11",
        tier: "scaffolded",
      });

    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.tier).toBe("scaffolded");
    expect(res.body.teacherSections).toHaveLength(2);
    expect(res.body.sections[0].content).toContain("Atomic number = 17. Mass number = 35.");
    expect(res.body.sections[0].content).toContain("Hint: mass number - atomic number.");
    expect(res.body.sections[0].content).not.toContain("Explain what this means.");
    expect(res.body.sections[1]).toMatchObject({
      id: "q1-label-diagram",
      assetRef: "asset-unlabelled",
      imageUrl: "/images/atom_nb_unlabelled_final.png",
    });
  });
});



describe("per-subtopic library identities", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockAll.mockReset();
    mockRun.mockReset();
  });

  const entry = (subtopic: string, id = "linear-one-step") => ({
    id,
    subject: "Maths",
    topic: "Solving Linear Equations",
    subtopic,
    year_group: "Year 9",
    title: subtopic || "Legacy Linear Equations",
    subtitle: "Year 9 | Maths",
    tier: "mixed",
    sections: JSON.stringify([
      { id: `${id}-objective`, title: "Objective", type: "objective", content: "Solve equations." },
      { id: `${id}-example`, title: "Worked Example", type: "example", content: "x + 2 = 5" },
      ...fillerSections(id),
    ]),
    teacher_sections: "[]",
    key_vocab: "[]",
    curated: 1,
    source: "curated",
    version: 1,
    canonical_topic_key: "solving_linear_equations",
    base_structure_json: "{}",
  });

  it("resolves the exact requested subtopic and reports only its tiers", async () => {
    mockGet.mockResolvedValueOnce(entry("One-step equations"));
    mockAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ tier: "mixed" }]);

    const res = await request(createApp())
      .post("/api/library/resolve")
      .send({
        subject: "Maths",
        topic: "Solving Linear Equations",
        subtopic: "One-step equations",
        yearGroup: "Year 9",
        tier: "mixed",
      });

    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.entry).toMatchObject({
      id: "linear-one-step",
      subtopic: "One-step equations",
    });
    expect(res.body.worksheetManifest.sourceSubtopic).toBe("One-step equations");
    expect(res.body.availableTiers).toEqual(["mixed"]);

    const exactLookup = mockGet.mock.calls[0];
    expect(exactLookup[0]).toContain("COALESCE(LOWER(subtopic), '') = ?");
    expect(exactLookup).toContain("one-step equations");
    const tierLookup = mockAll.mock.calls[1];
    expect(tierLookup).toContain("one-step equations");
  });

  it("prefers an exact named standard row over a legacy mixed row", async () => {
    const standard = { ...entry("One-step equations", "linear-one-step-standard"), tier: "standard" };
    mockGet
      .mockResolvedValueOnce(undefined) // exact mixed
      .mockResolvedValueOnce(undefined) // exact base
      .mockResolvedValueOnce(standard); // exact standard
    mockAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ tier: "standard" }]);

    const res = await request(createApp())
      .post("/api/library/resolve")
      .send({
        subject: "Maths",
        topic: "Solving Linear Equations",
        subtopic: "One-step equations",
        yearGroup: "Year 9",
        tier: "mixed",
      });

    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.libraryId).toBe("linear-one-step-standard");
    expect(res.body.entry.subtopic).toBe("One-step equations");
    expect(mockGet).toHaveBeenCalledTimes(3);
    expect(mockGet.mock.calls.some((call) => call.includes(""))).toBe(false);
  });

  it("never returns a different named subtopic", async () => {
    mockGet.mockResolvedValue(undefined);
    mockAll.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT * FROM worksheet_library")) {
        return [entry("Two-step equations", "linear-two-step")];
      }
      return [];
    });

    const res = await request(createApp())
      .post("/api/library/resolve")
      .send({
        subject: "Maths",
        topic: "Solving Linear Equations",
        subtopic: "One-step equations",
        yearGroup: "Year 9",
        tier: "mixed",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ found: false });
  });

  it("retains a legacy empty-subtopic row as a backwards-compatible fallback", async () => {
    mockGet
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(entry("", "linear-legacy"));
    mockAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ tier: "standard" }]);

    const res = await request(createApp())
      .post("/api/library/resolve")
      .send({
        subject: "Maths",
        topic: "Solving Linear Equations",
        subtopic: "One-step equations",
        yearGroup: "Year 9",
        tier: "mixed",
      });

    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.entry.id).toBe("linear-legacy");
    expect(res.body.entry.subtopic).toBe("");
    expect(res.body.worksheetManifest.sourceSubtopic).toBeNull();
    expect(res.body.availableTiers).toEqual(["mixed"]);
    expect(mockAll.mock.calls[1]).toContain("");
  });

  it("preserves the subtopic and deterministic overlays while switching tier", async () => {
    const higher = { ...entry("One-step equations", "linear-one-step-higher"), tier: "higher" };
    mockGet
      .mockResolvedValueOnce({
        id: "linear-one-step",
        base_entry_id: null,
        canonical_topic_key: "solving_linear_equations",
        year_group: "Year 9",
        topic: "Solving Linear Equations",
        subtopic: "One-step equations",
      })
      .mockResolvedValueOnce(higher);
    mockAll
      .mockResolvedValueOnce([{ tier: "higher" }, { tier: "mixed" }])
      .mockResolvedValueOnce([]);

    const res = await request(createApp())
      .post("/api/library/switch-tier")
      .send({
        subject: "Maths",
        topic: "Solving Linear Equations",
        subtopic: "One-step equations",
        yearGroup: "Year 9",
        targetTier: "higher",
        sourceLibraryId: "linear-one-step",
        sendNeed: "dyslexia",
        readingAge: "11",
      });

    expect(res.status).toBe(200);
    expect(res.body.found).toBe(true);
    expect(res.body.libraryId).toBe("linear-one-step-higher");
    expect(res.body.worksheetManifest.sourceSubtopic).toBe("One-step equations");
    expect(res.body.appliedOverlays.map((overlay: any) => overlay.type)).toEqual(
      expect.arrayContaining(["send_need", "reading_age"]),
    );
    expect(res.body.sections.some((section: any) => section.type === "send-support")).toBe(true);
    expect(res.body.sections.find((section: any) => section.id === "linear-one-step-higher-1")?.content)
      .toContain("Complete practice question 1.");
  });

  it("does not let AI auto-save overwrite a curated row with the same subtopic identity", async () => {
    mockGet.mockResolvedValueOnce({ id: "linear-one-step", curated: 1 });

    const res = await request(createApp())
      .post("/api/library/auto-save")
      .send({
        subject: "Maths",
        topic: "Solving Linear Equations",
        subtopic: "One-step equations",
        yearGroup: "Year 9",
        title: "AI replacement",
        sections: fillerSections("ai"),
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      skipped: true,
      reason: "curated entry preserved",
    });
    expect(mockRun).not.toHaveBeenCalled();
    expect(mockGet.mock.calls[0]).toContain("One-step equations");
  });
});
