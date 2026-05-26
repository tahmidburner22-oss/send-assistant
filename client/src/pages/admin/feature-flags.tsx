/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * client/src/pages/admin/feature-flags.tsx — W3 (FEAT-H8 admin wiring).
 *
 * Admin page for the per-school dark-flag allow-list backed by
 * `server/routes/featureFlagsAdmin.ts`. The page is a thin CRUD UI:
 *
 *   - Loads the current allow-list on mount via GET /api/admin/feature-flags.
 *   - Renders one row per (schoolId, flag) entry with toggles for
 *      enabled, optional subjects, optional question types.
 *   - Lets the operator add a new row (school + flag picker) and remove
 *      existing rows.
 *   - Saves the whole list back via PUT /api/admin/feature-flags.
 *
 * Style mirrors the existing admin telemetry page (plain inline-styled
 * React rather than the design system) so both admin pages render
 * consistently before the cohesive admin shell ships.
 */

import React, { useEffect, useMemo, useState } from "react";

type DarkFlagName =
  | "PROMPT_AB_ENABLED"
  | "PROMPT_FAMILIES_ENABLED"
  | "PROMPT_SELF_CONSISTENCY_ENABLED"
  | "PROMPT_CITATION_LAYER_ENABLED"
  | "GENERATION_CACHE_ENABLED";

interface FlagAllowEntry {
  schoolId: string;
  flag: DarkFlagName;
  enabled: boolean;
  subjects?: string[];
  questionTypes?: string[];
}

interface AllowListResponse {
  version: number;
  entries: FlagAllowEntry[];
  updatedAt: string | null;
  knownFlags: DarkFlagName[];
}

const FALLBACK_FLAGS: DarkFlagName[] = [
  "PROMPT_AB_ENABLED",
  "PROMPT_FAMILIES_ENABLED",
  "PROMPT_SELF_CONSISTENCY_ENABLED",
  "PROMPT_CITATION_LAYER_ENABLED",
  "GENERATION_CACHE_ENABLED",
];

const FRAME: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "24px 16px",
  fontFamily: "DM Sans, system-ui, sans-serif",
  color: "#1f2937",
  background: "#f9fafb",
};

const CARD: React.CSSProperties = {
  marginBottom: 16,
  padding: 16,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
};

const BTN_PRIMARY: React.CSSProperties = {
  background: "#1d4ed8",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const BTN_SECONDARY: React.CSSProperties = {
  background: "#fff",
  color: "#1f2937",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 12,
  cursor: "pointer",
};

const BTN_DANGER: React.CSSProperties = {
  background: "#fff",
  color: "#7f1d1d",
  border: "1px solid #fecaca",
  borderRadius: 6,
  padding: "4px 8px",
  fontSize: 12,
  cursor: "pointer",
};

const INPUT: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 6,
  padding: "6px 8px",
  fontSize: 12,
  width: "100%",
  boxSizing: "border-box",
};

function commaList(arr: string[] | undefined): string {
  return (arr ?? []).join(", ");
}

function parseCommaList(value: string): string[] | undefined {
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length === 0 ? undefined : parts;
}

export interface AdminFeatureFlagsPageProps {
  /** Optional fetcher injection for tests. Defaults to `fetch`. */
  fetcher?: typeof fetch;
}

export function AdminFeatureFlagsPage(
  props: AdminFeatureFlagsPageProps = {},
): React.ReactElement {
  const fetcher = props.fetcher ?? (typeof fetch !== "undefined" ? fetch.bind(globalThis) : undefined);

  const [entries, setEntries] = useState<FlagAllowEntry[]>([]);
  const [knownFlags, setKnownFlags] = useState<DarkFlagName[]>(FALLBACK_FLAGS);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [newSchoolId, setNewSchoolId] = useState<string>("");
  const [newFlag, setNewFlag] = useState<DarkFlagName>(FALLBACK_FLAGS[0]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) =>
      a.schoolId.localeCompare(b.schoolId) || a.flag.localeCompare(b.flag),
    ),
    [entries],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    if (!fetcher) {
      setLoading(false);
      setError("fetch unavailable in this environment");
      return;
    }
    fetcher("/api/admin/feature-flags")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as AllowListResponse;
      })
      .then((data) => {
        if (cancelled) return;
        setEntries(data.entries ?? []);
        setUpdatedAt(data.updatedAt ?? null);
        if (Array.isArray(data.knownFlags) && data.knownFlags.length > 0) {
          setKnownFlags(data.knownFlags);
          setNewFlag(data.knownFlags[0]);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  function updateEntry(idx: number, patch: Partial<FlagAllowEntry>) {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }

  function removeEntry(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  function addEntry() {
    const id = newSchoolId.trim();
    if (id.length === 0) {
      setError("Enter a school ID before adding a flag");
      return;
    }
    setEntries((prev) => [...prev, { schoolId: id, flag: newFlag, enabled: true }]);
    setNewSchoolId("");
    setError(null);
  }

  async function save() {
    if (!fetcher) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetcher("/api/admin/feature-flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as AllowListResponse;
      setEntries(data.entries ?? []);
      setUpdatedAt(data.updatedAt ?? null);
      setNotice("Saved");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main data-testid="admin-feature-flags-page" style={FRAME}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Feature flags</h1>
        <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
          Per-school dark-flag allow-list. Flags default to the env value; entries here override per school.
          {updatedAt && (
            <span style={{ marginLeft: 8 }}>
              Last saved: <code>{updatedAt}</code>
            </span>
          )}
        </p>
      </header>

      {error && (
        <div role="alert" style={{ ...CARD, background: "#fee2e2", color: "#7f1d1d", borderColor: "#fecaca" }}>
          {error}
        </div>
      )}
      {notice && (
        <div role="status" style={{ ...CARD, background: "#dcfce7", color: "#14532d", borderColor: "#bbf7d0" }}>
          {notice}
        </div>
      )}

      <section style={CARD}>
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 8px" }}>Add an override</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center" }}>
          <input
            aria-label="school id"
            placeholder="school id (e.g. school-123)"
            value={newSchoolId}
            onChange={(e) => setNewSchoolId(e.target.value)}
            style={INPUT}
          />
          <select
            aria-label="flag"
            value={newFlag}
            onChange={(e) => setNewFlag(e.target.value as DarkFlagName)}
            style={INPUT}
          >
            {knownFlags.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button type="button" onClick={addEntry} style={BTN_SECONDARY}>
            Add
          </button>
        </div>
      </section>

      <section style={CARD}>
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: "0 0 8px" }}>Current overrides ({sortedEntries.length})</h2>
        {loading ? (
          <p style={{ fontSize: 12, color: "#6b7280" }}>Loading…</p>
        ) : sortedEntries.length === 0 ? (
          <p style={{ fontSize: 12, color: "#6b7280" }}>No per-school overrides. Env defaults apply everywhere.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "6px 8px" }}>School</th>
                <th style={{ textAlign: "left", padding: "6px 8px" }}>Flag</th>
                <th style={{ textAlign: "center", padding: "6px 8px" }}>Enabled</th>
                <th style={{ textAlign: "left", padding: "6px 8px" }}>Subjects (optional)</th>
                <th style={{ textAlign: "left", padding: "6px 8px" }}>Question types (optional)</th>
                <th style={{ padding: "6px 8px" }} />
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry) => {
                const idx = entries.indexOf(entry);
                return (
                  <tr key={`${entry.schoolId}::${entry.flag}::${idx}`} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{entry.schoolId}</td>
                    <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{entry.flag}</td>
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      <input
                        aria-label={`enabled-${entry.schoolId}-${entry.flag}`}
                        type="checkbox"
                        checked={entry.enabled}
                        onChange={(e) => updateEntry(idx, { enabled: e.target.checked })}
                      />
                    </td>
                    <td style={{ padding: "4px 8px" }}>
                      <input
                        aria-label={`subjects-${entry.schoolId}-${entry.flag}`}
                        placeholder="all"
                        value={commaList(entry.subjects)}
                        onChange={(e) => updateEntry(idx, { subjects: parseCommaList(e.target.value) })}
                        style={INPUT}
                      />
                    </td>
                    <td style={{ padding: "4px 8px" }}>
                      <input
                        aria-label={`question-types-${entry.schoolId}-${entry.flag}`}
                        placeholder="all"
                        value={commaList(entry.questionTypes)}
                        onChange={(e) => updateEntry(idx, { questionTypes: parseCommaList(e.target.value) })}
                        style={INPUT}
                      />
                    </td>
                    <td style={{ padding: "4px 8px", textAlign: "right" }}>
                      <button type="button" onClick={() => removeEntry(idx)} style={BTN_DANGER}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button type="button" onClick={save} disabled={saving} style={{ ...BTN_PRIMARY, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </main>
  );
}

export default AdminFeatureFlagsPage;
