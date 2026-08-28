#!/usr/bin/env node
/**
 * diagram-library-progress.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads the live `diagram_library` Postgres table and joins it against
 * docs/diagram-library-catalogue.csv (the brief catalogue produced by
 * tools/diagram-catalogue/generate.mjs) to answer two questions:
 *
 *   1. How many catalogue briefs already have a curated image attached
 *      in the live DB? (the "done" pile)
 *   2. Which briefs still need an image? (the "to-do" pile, prioritised)
 *
 * Categorisation per catalogue row:
 *   - DONE          — DB row matched and curated = 1 (image_url filled in)
 *   - NEEDS-IMAGE   — DB row matched but curated = 0 (brief seeded but no image)
 *   - NOT-SEEDED    — no matching DB row at all (brief lives only in the CSV)
 *
 * Plus orphan detection: any DB row that doesn't match a catalogue brief is
 * flagged for review (could be a near-duplicate worth merging).
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/diagram-library-progress.mjs
 *
 * Optional flags:
 *   --next 50             Print the 50 highest-priority NEEDS-IMAGE +
 *                         NOT-SEEDED briefs to stdout (sorted GCSE → KS3
 *                         → A-Level → primary, since GCSE is highest-impact).
 *   --out path/to/file.md Override the default report path
 *                         (docs/diagram-library-progress.md).
 *   --json                Also write a machine-readable JSON snapshot to
 *                         docs/diagram-library-progress.json.
 *
 * Output (default):
 *   docs/diagram-library-progress.md
 * ─────────────────────────────────────────────────────────────────────────────
 */

import pg from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(REPO_ROOT, "docs/diagram-library-catalogue.csv");
const DEFAULT_OUT = path.join(REPO_ROOT, "docs/diagram-library-progress.md");

// ── Argument parsing ────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { next: 0, out: DEFAULT_OUT, json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--next") args.next = Math.max(0, parseInt(argv[++i], 10) || 0);
    else if (a === "--out") args.out = path.resolve(argv[++i]);
    else if (a === "--json") args.json = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: DATABASE_URL=... node scripts/diagram-library-progress.mjs " +
          "[--next N] [--out PATH] [--json]"
      );
      process.exit(0);
    }
  }
  return args;
}

// ── Tiny CSV parser (state machine, handles quoted fields) ──────────────────
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuote) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuote = true;
      else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (c === "\r") {
        // skip CR
      } else {
        cur += c;
      }
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).filter((r) => r.length === header.length).map((r) => {
    const obj = {};
    for (let i = 0; i < header.length; i++) obj[header[i]] = r[i];
    return obj;
  });
}

// ── Match-key normalisation ─────────────────────────────────────────────────
function normTitle(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
function normYear(s) {
  // "Year 10", "10", "year10" → "10"; ranges like "Year 10-11" → "10-11"
  return String(s || "")
    .toLowerCase()
    .replace(/year/gi, "")
    .replace(/\s+/g, "")
    .trim();
}
function normSubject(s) {
  return String(s || "").toLowerCase().trim();
}
function joinKey(subject, year_group, title) {
  return `${normSubject(subject)}|${normYear(year_group)}|${normTitle(title)}`;
}

// ── Phase + priority helpers ────────────────────────────────────────────────
const SECONDARY_BANDS = new Set(["KS3", "GCSE", "A-Level"]);
function phaseFor(band) {
  if (band === "KS3") return "KS3 (Y7–Y9)";
  if (band === "GCSE") return "GCSE (Y10–Y11)";
  if (band === "A-Level") return "A-Level (Y12–Y13)";
  return "Primary (Y1–Y6)";
}
// GCSE is the biggest impact (peak worksheet usage), so we surface it first
// when the user asks for "next N to work on".
function bandPriority(band) {
  switch (band) {
    case "GCSE":
      return 0;
    case "KS3":
      return 1;
    case "A-Level":
      return 2;
    default:
      return 3; // primary bands
  }
}

// ── Progress bar (ASCII, plays nicely in markdown code blocks) ──────────────
function bar(done, total, width = 24) {
  if (!total) return "─".repeat(width);
  const pct = done / total;
  const filled = Math.round(pct * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}
function pct(done, total) {
  if (!total) return "—";
  return `${((done / total) * 100).toFixed(1)}%`;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);

  if (!process.env.DATABASE_URL) {
    console.error(
      "ERROR: DATABASE_URL environment variable is required.\n" +
        "       Get the value from Supabase → Project Settings → Database →\n" +
        "       Connection string → URI (use the pooler URL, not direct).\n" +
        "       In CI, set it as a repository secret named DATABASE_URL."
    );
    process.exit(1);
  }

  // 1. Read the catalogue CSV
  let catalogueText;
  try {
    catalogueText = await fs.readFile(CSV_PATH, "utf8");
  } catch (err) {
    console.error(
      `ERROR: cannot read ${path.relative(REPO_ROOT, CSV_PATH)}\n` +
        `       Make sure tools/diagram-catalogue/generate.mjs has been run.\n` +
        `       (${err.message})`
    );
    process.exit(1);
  }
  const catalogue = parseCsv(catalogueText);
  console.log(`Read ${catalogue.length} catalogue briefs from CSV.`);

  // 2. Read the live DB
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const dbStart = Date.now();
  const { rows: dbRows } = await pool.query(
    `SELECT id, title, subject, topic, year_group, image_url, asset_ref,
            curated, diagram_type, source
       FROM diagram_library`
  );
  await pool.end();
  console.log(
    `Fetched ${dbRows.length} live diagram_library rows in ${Date.now() - dbStart}ms.`
  );

  // 3. Index DB rows by match key
  const dbByKey = new Map();
  for (const r of dbRows) {
    dbByKey.set(joinKey(r.subject, r.year_group, r.title), r);
  }

  // 4. Categorise every catalogue brief
  const matchedDbIds = new Set();
  const briefs = catalogue.map((c) => {
    const key = joinKey(c.subject, c.year_group, c.title);
    const db = dbByKey.get(key);
    if (db) matchedDbIds.add(db.id);
    let status;
    if (!db) status = "NOT-SEEDED";
    else if (Number(db.curated) === 1 || db.image_url) status = "DONE";
    else status = "NEEDS-IMAGE";
    return {
      id: c.id,
      title: c.title,
      subject: c.subject,
      topic: c.topic,
      year_group: c.year_group,
      year_band: c.year_band,
      diagram_type: c.diagram_type,
      tags: c.tags,
      status,
      db_id: db ? db.id : null,
      db_image_url: db ? db.image_url || null : null,
    };
  });

  // 5. Find orphan DB rows (not in catalogue)
  const orphans = dbRows
    .filter((r) => !matchedDbIds.has(r.id))
    .map((r) => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      topic: r.topic,
      year_group: r.year_group,
      curated: Number(r.curated) === 1 || !!r.image_url,
      source: r.source,
    }));

  // 6. Build summary structures
  const total = briefs.length;
  const totals = {
    DONE: briefs.filter((b) => b.status === "DONE").length,
    "NEEDS-IMAGE": briefs.filter((b) => b.status === "NEEDS-IMAGE").length,
    "NOT-SEEDED": briefs.filter((b) => b.status === "NOT-SEEDED").length,
  };

  // Per-phase
  const phases = new Map();
  for (const b of briefs) {
    const p = phaseFor(b.year_band);
    if (!phases.has(p)) phases.set(p, { total: 0, done: 0, needs: 0, notSeeded: 0 });
    const e = phases.get(p);
    e.total++;
    if (b.status === "DONE") e.done++;
    else if (b.status === "NEEDS-IMAGE") e.needs++;
    else e.notSeeded++;
  }
  const phaseOrder = [
    "Primary (Y1–Y6)",
    "KS3 (Y7–Y9)",
    "GCSE (Y10–Y11)",
    "A-Level (Y12–Y13)",
  ];

  // Per-subject within phase
  const phaseSubjectKey = (phase, subject) => `${phase}::${subject}`;
  const phaseSubjects = new Map();
  for (const b of briefs) {
    const p = phaseFor(b.year_band);
    const key = phaseSubjectKey(p, b.subject);
    if (!phaseSubjects.has(key)) {
      phaseSubjects.set(key, {
        phase: p,
        subject: b.subject,
        total: 0,
        done: 0,
        needs: 0,
        notSeeded: 0,
      });
    }
    const e = phaseSubjects.get(key);
    e.total++;
    if (b.status === "DONE") e.done++;
    else if (b.status === "NEEDS-IMAGE") e.needs++;
    else e.notSeeded++;
  }

  // 7. Build the markdown report
  const lines = [];
  const now = new Date().toISOString().replace("T", " ").slice(0, 16) + "Z";
  lines.push("# Diagram Library — Progress Report");
  lines.push("");
  lines.push(
    `_Generated ${now} by \`scripts/diagram-library-progress.mjs\`. ` +
      `Re-run via Actions → "Diagram library — progress audit"._`
  );
  lines.push("");
  lines.push("## Headline");
  lines.push("");
  lines.push("```");
  lines.push(
    `${bar(totals.DONE, total)}  ${pct(totals.DONE, total)} done  ` +
      `(${totals.DONE.toLocaleString()} of ${total.toLocaleString()})`
  );
  lines.push("```");
  lines.push("");
  lines.push(
    `- **${totals.DONE.toLocaleString()}** briefs are LIVE — image uploaded, ` +
      `the AI can serve them in worksheets right now.`
  );
  lines.push(
    `- **${totals["NEEDS-IMAGE"].toLocaleString()}** briefs are seeded into the ` +
      `live DB but still need an image (\`curated = 0\`).`
  );
  lines.push(
    `- **${totals["NOT-SEEDED"].toLocaleString()}** briefs only exist in the ` +
      `catalogue CSV — they haven't been added to the live DB yet.`
  );
  lines.push(
    `- **${orphans.length.toLocaleString()}** rows in the live DB don't match ` +
      `any catalogue brief — see "Orphan DB rows" below for review.`
  );
  lines.push("");
  lines.push("## Progress by phase");
  lines.push("");
  lines.push("| Phase | Done | Needs image | Not seeded | Total | % done |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: |");
  for (const phase of phaseOrder) {
    const e = phases.get(phase) || { total: 0, done: 0, needs: 0, notSeeded: 0 };
    lines.push(
      `| ${phase} | ${e.done} | ${e.needs} | ${e.notSeeded} | ${e.total} | ${pct(e.done, e.total)} |`
    );
  }
  lines.push(
    `| **Total** | **${totals.DONE}** | **${totals["NEEDS-IMAGE"]}** | ` +
      `**${totals["NOT-SEEDED"]}** | **${total}** | **${pct(totals.DONE, total)}** |`
  );
  lines.push("");

  lines.push("## Progress by subject (within phase)");
  lines.push("");
  lines.push("| Phase | Subject | Done | Needs image | Not seeded | Total | % done |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: |");
  const subjectRows = [...phaseSubjects.values()].sort((a, b) => {
    const pa = phaseOrder.indexOf(a.phase);
    const pb = phaseOrder.indexOf(b.phase);
    if (pa !== pb) return pa - pb;
    return a.subject.localeCompare(b.subject);
  });
  for (const e of subjectRows) {
    lines.push(
      `| ${e.phase} | ${e.subject} | ${e.done} | ${e.needs} | ${e.notSeeded} | ${e.total} | ${pct(e.done, e.total)} |`
    );
  }
  lines.push("");

  // 8. "Next up" — highest-priority to-do briefs
  const todo = briefs
    .filter((b) => b.status !== "DONE")
    .sort((a, b) => {
      const pa = bandPriority(a.year_band);
      const pb = bandPriority(b.year_band);
      if (pa !== pb) return pa - pb;
      // Inside a band, prefer NEEDS-IMAGE over NOT-SEEDED (less work to flip)
      if (a.status !== b.status) {
        if (a.status === "NEEDS-IMAGE") return -1;
        if (b.status === "NEEDS-IMAGE") return 1;
      }
      // Then by subject + topic for deterministic ordering
      const sa = `${a.subject}::${a.topic}`;
      const sb = `${b.subject}::${b.topic}`;
      return sa.localeCompare(sb);
    });
  const previewN = 30;
  lines.push(`## Next ${previewN} highest-priority briefs to work on`);
  lines.push("");
  lines.push(
    "Sorted GCSE → KS3 → A-Level → Primary because GCSE is where worksheet " +
      "usage peaks and the lift per image is largest."
  );
  lines.push("");
  lines.push("| Status | Phase | Subject | Topic | Title |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const b of todo.slice(0, previewN)) {
    lines.push(
      `| ${b.status} | ${phaseFor(b.year_band)} | ${b.subject} | ${b.topic} | ${b.title} |`
    );
  }
  lines.push("");

  // 9. Orphan DB rows
  if (orphans.length) {
    lines.push("## Orphan DB rows (not matched to any catalogue brief)");
    lines.push("");
    lines.push(
      "These live in `diagram_library` but don't match a catalogue brief by " +
        "(subject, year_group, title). They may be near-duplicates worth merging, " +
        "or pre-catalogue manually-uploaded entries that the catalogue should " +
        "absorb in a future generator pass."
    );
    lines.push("");
    lines.push("| DB id | Subject | Year | Topic | Title | Curated |");
    lines.push("| --- | --- | --- | --- | --- | :---: |");
    const orphanPreview = orphans.slice(0, 50);
    for (const o of orphanPreview) {
      lines.push(
        `| \`${o.id}\` | ${o.subject || ""} | ${o.year_group || ""} | ${o.topic || ""} | ${o.title || ""} | ${o.curated ? "✓" : ""} |`
      );
    }
    if (orphans.length > orphanPreview.length) {
      lines.push("");
      lines.push(
        `_…and ${orphans.length - orphanPreview.length} more — see the JSON ` +
          `snapshot if you need the full list._`
      );
    }
    lines.push("");
  }

  lines.push("## How this report is built");
  lines.push("");
  lines.push(
    "1. Loads `docs/diagram-library-catalogue.csv` (the brief catalogue " +
      "produced by `tools/diagram-catalogue/generate.mjs`)."
  );
  lines.push(
    "2. Connects to the live `diagram_library` Postgres table via `DATABASE_URL`."
  );
  lines.push(
    "3. Joins them by `(subject, year_group, title)` after lower-casing and " +
      "trimming."
  );
  lines.push(
    "4. Buckets each catalogue row as DONE / NEEDS-IMAGE / NOT-SEEDED, plus " +
      "flags any DB rows that didn't match."
  );
  lines.push("");

  // 10. Write outputs
  await fs.mkdir(path.dirname(args.out), { recursive: true });
  await fs.writeFile(args.out, lines.join("\n") + "\n", "utf8");
  console.log(`\nWrote ${path.relative(REPO_ROOT, args.out)}`);

  if (args.json) {
    const jsonPath = args.out.replace(/\.md$/, ".json");
    await fs.writeFile(
      jsonPath,
      JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          totals,
          phases: Object.fromEntries(phases),
          phase_subjects: subjectRows,
          orphans,
          todo: todo.map((b) => ({
            id: b.id,
            title: b.title,
            subject: b.subject,
            topic: b.topic,
            year_band: b.year_band,
            year_group: b.year_group,
            status: b.status,
            tags: b.tags,
          })),
        },
        null,
        2
      ),
      "utf8"
    );
    console.log(`Wrote ${path.relative(REPO_ROOT, jsonPath)}`);
  }

  // 11. Pretty stdout summary so the GitHub Actions step summary is helpful
  console.log("");
  console.log(`╭─ Diagram catalogue progress ────────────────────────────────`);
  console.log(`│  Done           : ${totals.DONE.toString().padStart(5)} / ${total}`);
  console.log(`│  Needs image    : ${totals["NEEDS-IMAGE"].toString().padStart(5)}`);
  console.log(`│  Not seeded     : ${totals["NOT-SEEDED"].toString().padStart(5)}`);
  console.log(`│  Orphan DB rows : ${orphans.length.toString().padStart(5)}`);
  console.log(`│  Overall        : ${pct(totals.DONE, total)}`);
  console.log(`╰─────────────────────────────────────────────────────────────`);

  // 12. Optional --next preview
  if (args.next > 0) {
    console.log(`\nNext ${Math.min(args.next, todo.length)} highest-priority briefs:`);
    for (const b of todo.slice(0, args.next)) {
      console.log(
        `  [${b.status}] ${b.year_band.padEnd(8)} ${b.subject.padEnd(28)} ${b.title}`
      );
    }
  }
}

main().catch((err) => {
  console.error("\n❌ Audit failed:", err.message || err);
  if (err.stack) console.error(err.stack.split("\n").slice(1, 5).join("\n"));
  process.exit(1);
});
