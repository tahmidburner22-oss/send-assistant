/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * client/src/pages/companion/[token].tsx — PR-26 / audit item #81.
 *
 * Pupil-facing companion app surface. Consumes the
 * `metadata.companionShare` token + `metadata.hintLadders` payload
 * that `ai.ts` already stamps on every Y9+ worksheet (Phase 4 /
 * FEAT-005). Until now the token resolved to a 404 because no
 * pupil-facing surface read it.
 *
 * Read-only pupil view. Designed mobile-first because pupils open it
 * on their phone or tablet at home. Shows:
 *
 *   - The worksheet questions (just the stems, no teacher key, no
 *     teacher-only metadata).
 *   - A "Need a hint?" button per question that walks through the
 *     three-step hint ladder (gentle → strong → solution).
 *   - "Get the next hint" only ever advances by one rung so pupils
 *     don't skip straight to the answer.
 *
 * No external network calls. The token lookup is delegated to
 * `useCompanionWorksheet` (a parent hook scaffolded in PR-9) so this
 * page is purely presentational and easy to unit-test.
 */

import React, { useState, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CompanionWorksheetSection {
  type?: string;
  title?: string;
  content?: string;
  marks?: number;
}

export interface CompanionHintLadder {
  questionId: string;
  question: string;
  hints: [string, string, string];
}

export interface CompanionWorksheet {
  title?: string;
  metadata?: {
    subject?: string;
    yearGroup?: string;
    topic?: string;
    companionShare?: { token?: string; expiresAt?: string };
    hintLadders?: CompanionHintLadder[];
  };
  sections?: CompanionWorksheetSection[];
}

export interface CompanionPageProps {
  /** Resolved token from the URL. */
  token: string;
  /** Optional pre-fetched worksheet (used by tests). */
  worksheet?: CompanionWorksheet | null;
  /** Optional fetcher (used in production); falls back to `null`. */
  fetcher?: (token: string) => CompanionWorksheet | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const QUESTION_TYPES = new Set(["q-mcq", "q-short-answer", "q-extended", "mcq", "question"]);

function isQuestionSection(s: CompanionWorksheetSection): boolean {
  if (QUESTION_TYPES.has(String(s.type || "").toLowerCase())) return true;
  return /^q[-_]/i.test(String(s.type || ""));
}

function questionIdFor(idx: number, sectionIdx: number): string {
  return `s${sectionIdx}q${idx}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CompanionPage(props: CompanionPageProps): React.ReactElement {
  const { token, fetcher } = props;
  const ws = useMemo<CompanionWorksheet | null>(() => {
    if (props.worksheet !== undefined) return props.worksheet;
    if (typeof fetcher === "function") return fetcher(token);
    return null;
  }, [token, fetcher, props.worksheet]);

  const [hintLevels, setHintLevels] = useState<Record<string, number>>({});

  if (!ws) {
    return (
      <main
        data-testid="companion-page-empty"
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "24px 16px",
          fontFamily: "DM Sans, system-ui, sans-serif",
          color: "#1f2937",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Companion link expired</h1>
        <p style={{ fontSize: 14, color: "#52525b" }}>
          This companion link is invalid or has expired. Ask your teacher for a new one.
        </p>
      </main>
    );
  }

  const expiry = ws.metadata?.companionShare?.expiresAt;
  const expiresAt = expiry ? new Date(expiry) : null;
  const expired = expiresAt instanceof Date && !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now();

  const ladders = ws.metadata?.hintLadders || [];
  const ladderById = new Map<string, CompanionHintLadder>();
  for (const l of ladders) ladderById.set(l.questionId, l);

  const questionSections = (ws.sections || []).filter(isQuestionSection);

  return (
    <main
      data-testid="companion-page"
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily: "DM Sans, system-ui, sans-serif",
        color: "#1f2937",
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: "#6b7280", letterSpacing: 0.5, textTransform: "uppercase", margin: 0 }}>
          Companion
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "4px 0 6px" }}>
          {ws.title || "Worksheet"}
        </h1>
        <p style={{ fontSize: 12, color: "#52525b", margin: 0 }}>
          {[ws.metadata?.subject, ws.metadata?.yearGroup, ws.metadata?.topic].filter(Boolean).join(" · ")}
        </p>
        {expired && (
          <div
            data-testid="companion-expired"
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#7f1d1d",
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            This link expired on {expiresAt!.toLocaleDateString("en-GB")}. Ask your teacher for a new one.
          </div>
        )}
      </header>

      <ol style={{ listStyle: "decimal inside", padding: 0, margin: 0 }}>
        {questionSections.map((s, idx) => {
          const id = questionIdFor(idx + 1, idx);
          const ladder = ladderById.get(id) || ladders[idx];
          const level = hintLevels[id] || 0;
          return (
            <li
              key={id}
              style={{
                marginBottom: 14,
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                {s.title || `Question ${idx + 1}`}
              </div>
              <div
                style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}
                data-testid={`companion-question-${idx}`}
              >
                {String(s.content || "")}
              </div>
              {ladder && (
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    data-testid={`companion-hint-${idx}`}
                    disabled={expired || level >= 3}
                    onClick={() =>
                      setHintLevels((prev) => ({ ...prev, [id]: Math.min(3, (prev[id] || 0) + 1) }))
                    }
                    style={{
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      border: "1px solid #1f2937",
                      borderRadius: 4,
                      background: level >= 3 ? "#e5e7eb" : "#1f2937",
                      color: level >= 3 ? "#6b7280" : "#fff",
                      cursor: level >= 3 ? "not-allowed" : "pointer",
                    }}
                  >
                    {level === 0 ? "Need a hint?" : level >= 3 ? "All hints shown" : "Next hint"}
                  </button>
                  {Array.from({ length: level }).map((_, hidx) => (
                    <div
                      key={hidx}
                      style={{
                        marginTop: 6,
                        padding: "6px 10px",
                        fontSize: 12,
                        background: "#f3f4f6",
                        borderLeft: "3px solid #1f2937",
                        borderRadius: 4,
                      }}
                    >
                      <strong style={{ marginRight: 4 }}>Hint {hidx + 1}:</strong>
                      {ladder.hints[hidx]}
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <footer style={{ marginTop: 24, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
        Adaptly Companion · You can only use this link once it has been shared by your teacher.
      </footer>
    </main>
  );
}

export default CompanionPage;
