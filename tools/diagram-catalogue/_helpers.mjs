/**
 * Shared helpers for the primary diagram catalogue generator.
 *
 * Each subject module exports `build(ctx)` and pushes rows into ctx.add(...).
 * Rows are normalised to the diagram_library DB columns plus extra editorial
 * fields (year_band, style_notes) for review.
 */

export const BAND_FOR_YEAR = {
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
};

export function makeContext() {
  let n = 0;
  const rows = [];
  function add(row) {
    n += 1;
    const id = `pdl-${String(n).padStart(4, "0")}`;
    const year_band = row.year_band || BAND_FOR_YEAR[row.year_group] || "KS1+KS2";
    rows.push({
      id,
      title: row.title,
      subject: row.subject,
      topic: row.topic,
      year_group: row.year_group,
      year_band,
      diagram_type: row.diagram_type || "diagram_a",
      description: row.description,
      style_notes: row.style_notes || "Bright, friendly, bold outlines, child-appropriate palette",
      tags: Array.isArray(row.tags) ? row.tags : [],
      source: row.source || "Adaptly Primary Catalogue",
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
      return n;
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
