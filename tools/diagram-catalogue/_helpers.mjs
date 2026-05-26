/**
 * Shared helpers for the diagram catalogue generator.
 *
 * Each subject module exports `build(ctx)` and pushes rows into ctx.add(...).
 * Rows are normalised to the diagram_library DB columns plus extra editorial
 * fields (year_band, style_notes) for review.
 *
 * The catalogue spans Reception → A-Level. Primary rows (Y1–Y6) keep the
 * legacy `pdl-NNNN` id prefix so the existing CSV diff stays minimal;
 * secondary rows (KS3 / GCSE / A-Level) use `dlc-NNNNN` to make their origin
 * obvious in the merged file.
 */

export const BAND_FOR_YEAR = {
  // Primary
  "Year 1": "KS1",
  "Year 2": "KS1",
  "Year 3": "LKS2",
  "Year 4": "LKS2",
  "Year 5": "UKS2",
  "Year 6": "UKS2",
  "Year 1-2": "KS1",
  "Year 1-6": "KS1+KS2",
  "Year 3-4": "LKS2",
  "Year 5-6": "UKS2",
  "Year 2-6": "KS1+KS2",
  "Year 3-6": "KS2",
  // KS3
  "Year 7": "KS3",
  "Year 8": "KS3",
  "Year 9": "KS3",
  "Year 7-8": "KS3",
  "Year 7-9": "KS3",
  "Year 8-9": "KS3",
  // GCSE
  "Year 10": "GCSE",
  "Year 11": "GCSE",
  "Year 10-11": "GCSE",
  // A-Level
  "Year 12": "A-Level",
  "Year 13": "A-Level",
  "Year 12-13": "A-Level",
};

const SECONDARY_BANDS = new Set(["KS3", "GCSE", "A-Level"]);

export function makeContext() {
  let primaryN = 0;
  let secondaryN = 0;
  const rows = [];
  const seenTitles = new Map(); // title -> count
  function add(row) {
    const year_band = row.year_band || BAND_FOR_YEAR[row.year_group] || "KS1+KS2";
    let id;
    if (SECONDARY_BANDS.has(year_band)) {
      secondaryN += 1;
      id = `dlc-${String(secondaryN).padStart(5, "0")}`;
    } else {
      primaryN += 1;
      id = `pdl-${String(primaryN).padStart(4, "0")}`;
    }
    // De-duplicate titles deterministically: the same canonical diagram is
    // often listed under multiple bands (e.g. a tectonic plate boundary
    // appears at KS3, GCSE *and* A-Level). Suffix the band on collisions so
    // each row title is globally unique while the topic stays recognisable.
    let title = row.title;
    if (seenTitles.has(title)) {
      const candidate = `${row.title} (${year_band})`;
      if (!seenTitles.has(candidate)) {
        title = candidate;
      } else {
        // Same band collision (rare) — fall back to band + subject prefix.
        let n = 2;
        while (seenTitles.has(`${row.title} (${year_band} ${n})`)) n += 1;
        title = `${row.title} (${year_band} ${n})`;
      }
    }
    seenTitles.set(title, 1);
    rows.push({
      id,
      title,
      subject: row.subject,
      topic: row.topic,
      year_group: row.year_group,
      year_band,
      diagram_type: row.diagram_type || "diagram_a",
      description: row.description,
      style_notes:
        row.style_notes ||
        (SECONDARY_BANDS.has(year_band)
          ? "Clean line-art, exam-paper feel, labelled in 12pt sans-serif, white background"
          : "Bright, friendly, bold outlines, child-appropriate palette"),
      tags: Array.isArray(row.tags) ? row.tags : [],
      source: row.source || "Adaptly Diagram Catalogue",
      curated: 0, // becomes 1 after image upload
      image_url: row.image_url || "",
      asset_ref: row.asset_ref || "",
    });
  }
  return {
    add,
    get rows() {
      return rows;
    },
    get count() {
      return rows.length;
    },
    get primaryCount() {
      return primaryN;
    },
    get secondaryCount() {
      return secondaryN;
    },
  };
}

/**
 * Generate `count` items where the title and description follow a pattern
 * with a varying integer (e.g. ten-frame 0..10, number line 0..20).
 */
export function range(count, fn) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(fn(i));
  return out;
}

/**
 * Helper that emits one row per item in a list, using a common props template.
 */
export function emitMany(ctx, common, items) {
  for (const item of items) {
    ctx.add({ ...common, ...item, tags: [...(common.tags || []), ...(item.tags || [])] });
  }
}

/**
 * Convenience: emit titled items from a list of [title, description?] tuples.
 */
export function emitTitled(ctx, common, list) {
  for (const entry of list) {
    const [title, description = title] = Array.isArray(entry) ? entry : [entry, entry];
    ctx.add({
      ...common,
      title,
      description: typeof description === "string" ? description : common.description,
      tags: common.tags || [],
    });
  }
}

export function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCsv(rows) {
  const cols = [
    "id",
    "title",
    "subject",
    "topic",
    "year_group",
    "year_band",
    "diagram_type",
    "description",
    "style_notes",
    "tags",
    "source",
    "curated",
    "image_url",
    "asset_ref",
  ];
  const lines = [cols.join(",")];
  for (const r of rows) {
    const tagsJson = JSON.stringify(r.tags || []);
    lines.push(
      cols
        .map((c) => (c === "tags" ? csvEscape(tagsJson) : csvEscape(r[c])))
        .join(","),
    );
  }
  return lines.join("\n") + "\n";
}
