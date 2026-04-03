import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGet = vi.fn();
const mockAll = vi.fn();

vi.mock("../db/index.js", () => ({
  default: {
    prepare: vi.fn((sql: string) => ({
      get: (...args: unknown[]) => mockGet(sql, ...args),
      all: (...args: unknown[]) => mockAll(sql, ...args),
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

describe("GET /api/library/lookup", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockAll.mockReset();
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
      ]);

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
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("returns a safe same-topic match from another year group when no requested-year copy exists", async () => {
    mockAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "sim-standard-y10",
          tier: "standard",
          title: "Simultaneous Equations Standard",
        },
      ]);

    mockGet.mockResolvedValueOnce({
      id: "sim-standard-y10",
      subject: "Maths",
      topic: "Simultaneous Equations",
      year_group: "Year 10",
      title: "Simultaneous Equations Standard",
      subtitle: "Year 10 | Maths",
      tier: "standard",
      sections: "[]",
      teacher_sections: "[]",
      key_vocab: "[]",
      curated: 1,
    });

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
