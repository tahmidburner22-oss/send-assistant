#!/usr/bin/env node
/**
 * Diagram image pipeline runner.
 *
 * One run = one batch. Processes up to `--batch=N` (default 50) pending
 * rows, then exits cleanly. Designed to be invoked by GitHub Actions on
 * a 30-minute cron, or run locally for ad-hoc top-ups.
 *
 * Per-row pipeline:
 *   1. Choose render strategy from taxonomy.
 *   2. SVG strategy → render synchronously, write PNG via sharp, update state.
 *   3. AI strategy:
 *        a. Build strict prompt.
 *        b. Generate via provider chain.
 *        c. Run QA.
 *        d. If QA fails with a known mutation, rebuild prompt with the
 *           mutation and retry up to MAX_RETRIES times.
 *        e. On success, write PNG, update state.
 *
 * Outputs:
 *   client/public/diagrams/generated/{id}.png — the final image.
 *   tools/image-pipeline/state.json           — per-row state.
 *   tools/image-pipeline/dashboard/data.json  — dashboard payload.
 *   tools/image-pipeline/logs/{ISO-DATE}.log  — per-run log.
 *
 * Concurrency: AI tier processes up to CONCURRENCY (default 4) rows in
 * parallel. SVG tier is fast and runs sequentially.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./csv.mjs";
import { chooseStrategy, summariseStrategies } from "./taxonomy.mjs";
import { getRenderer } from "./renderers/index.mjs";
import { buildPrompt } from "./prompt.mjs";
import * as providers from "./providers/index.mjs";
import { runQA } from "./qa.mjs";
import {
  loadState,
  saveState,
  set as setRow,
  pickBatch,
  summarise,
  summariseByPhase,
} from "./state.mjs";
import {
  loadFeedback,
  saveFeedback,
  indexUnappliedById,
  markApplied,
} from "./feedback.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const CATALOGUE_PATH = path.join(REPO_ROOT, "docs/diagram-library-catalogue.csv");
const OUTPUT_DIR = path.join(REPO_ROOT, "client/public/diagrams/generated");
const DASHBOARD_DATA = path.join(__dirname, "dashboard/data.json");
const LOG_DIR = path.join(__dirname, "logs");

const MAX_RETRIES = 3;

function parseArgs(argv) {
  const args = { batch: 50, concurrency: 4, dry: false, only: null };
  for (const a of argv) {
    const [k, v] = a.replace(/^--/, "").split("=");
    if (k === "batch") args.batch = parseInt(v, 10) || 50;
    else if (k === "concurrency") args.concurrency = parseInt(v, 10) || 4;
    else if (k === "dry") args.dry = true;
    else if (k === "only") args.only = v;
  }
  return args;
}

async function ensureDirs() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.mkdir(path.dirname(DASHBOARD_DATA), { recursive: true });
}

async function loadCatalogue() {
  const text = await fs.readFile(CATALOGUE_PATH, "utf8");
  const rows = parseCsv(text);
  return rows.filter((r) => r.id);
}

async function svgToPng(svg) {
  const sharpMod = await import("sharp");
  const sharp = sharpMod.default;
  return sharp(Buffer.from(svg))
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function processSvgRow(row, decision, log) {
  const renderer = getRenderer(decision.renderer);
  if (!renderer) {
    log.warn(
      `${row.id}: renderer "${decision.renderer}" not implemented; downgrading to ai-structural`,
    );
    return { downgrade: "ai-structural" };
  }
  const svg = renderer.render(row, decision.params || {});
  const png = await svgToPng(svg);
  const out = path.join(OUTPUT_DIR, `${row.id}.png`);
  await fs.writeFile(out, png);
  return { ok: true, png, path: out };
}

async function processAiRow(row, strategy, log, userFeedback = null) {
  let mutation = null;
  let attempts = [];
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const prompt = buildPrompt(row, strategy, {
      mutation,
      attempt,
      userFlaws: userFeedback?.flaws || null,
      userNote: userFeedback?.note || null,
    });
    let gen;
    try {
      gen = await providers.generate({
        positive: prompt.positive,
        negative: prompt.negative,
        width: prompt.width,
        height: prompt.height,
        seed: hashSeed(row.id, attempt),
        attempt,
      });
    } catch (err) {
      attempts.push({ attempt, providerError: String(err.message) });
      return { ok: false, providerOut: true, attempts };
    }
    const qa = await runQA(gen.png, row, {});
    attempts.push({
      attempt,
      provider: gen.provider,
      qa: { ok: qa.ok, fail: qa.fail, reason: qa.reason },
    });
    if (qa.ok) {
      const out = path.join(OUTPUT_DIR, `${row.id}.png`);
      await fs.writeFile(out, gen.png);
      return { ok: true, provider: gen.provider, attempts, path: out };
    }
    mutation = qa.mutation || null;
    log.info(`${row.id}: attempt ${attempt} failed (${qa.fail}: ${qa.reason})`);
  }
  return { ok: false, qaFailed: true, attempts };
}

function hashSeed(id, attempt) {
  // Deterministic seed per (id, attempt) so retries differ but reruns reproduce.
  // The seed must fit in a signed 32-bit int — Gemini rejects values > 2^31-1
  // with "Invalid value at 'generation_config.seed' (TYPE_INT32)". We mask
  // off the sign bit so the result is always a non-negative int31.
  let h = 2166136261;
  const s = `${id}:${attempt}`;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h & 0x7fffffff;
}

async function processBatch(batch, args, state, log, feedbackById) {
  const queue = batch.slice();
  const workers = Array.from({ length: args.concurrency }, () =>
    (async () => {
      while (queue.length > 0) {
        const row = queue.shift();
        if (!row) break;
        const decision = chooseStrategy(row);
        const userFb = feedbackById.get(row.id) || null;
        const fbTag = userFb ? ` (teacher-feedback: ${userFb.flaws.join("|")})` : "";
        log.info(
          `→ ${row.id} [${decision.strategy}${decision.renderer ? "/" + decision.renderer : ""}]${fbTag} ${row.title}`,
        );
        try {
          if (decision.strategy === "svg") {
            const r = await processSvgRow(row, decision, log);
            if (r.downgrade) {
              const r2 = await processAiRow(row, r.downgrade, log, userFb);
              recordResult(state, row, decision, r2, "ai-structural");
            } else {
              recordResult(state, row, decision, r, "svg");
            }
          } else {
            const r = await processAiRow(row, decision.strategy, log, userFb);
            recordResult(state, row, decision, r, decision.strategy);
          }
        } catch (err) {
          log.error(`× ${row.id}: ${err.message}`);
          setRow(state, row.id, {
            status: "ai-failed",
            lastError: String(err.message),
            strategy: decision.strategy,
          });
        }
      }
    })(),
  );
  await Promise.all(workers);
}

function recordResult(state, row, decision, result, strategy) {
  if (result.ok) {
    setRow(state, row.id, {
      status: strategy === "svg" ? "svg-rendered" : "done",
      strategy,
      renderer: decision.renderer || null,
      provider: result.provider || null,
      attempts: result.attempts?.length ?? 0,
      generatedAt: new Date().toISOString(),
      imagePath: `/diagrams/generated/${row.id}.png`,
      lastError: null,
    });
  } else if (result.providerOut) {
    setRow(state, row.id, {
      status: "provider-out",
      strategy,
      lastError: result.attempts?.at(-1)?.providerError || "all-providers-failed",
      attemptsLog: result.attempts,
    });
  } else if (result.qaFailed) {
    setRow(state, row.id, {
      status: "ai-failed",
      strategy,
      lastError: "qa-rejected-after-retries",
      attemptsLog: result.attempts,
    });
  }
}

async function writeDashboardData(state, catalogue) {
  const counts = summarise(state, catalogue);
  // Browse list — every row that has an image, newest first. The
  // dashboard paginates this client-side; one entry is ~200 bytes so
  // a fully-populated catalogue is ~1.2 MB which is fine for a static
  // page.
  const browse = Object.entries(state.rows)
    .filter(([, v]) => v.imagePath)
    .sort((a, b) => (b[1].generatedAt || "").localeCompare(a[1].generatedAt || ""))
    .map(([id, v]) => {
      const row = catalogue.find((r) => r.id === id);
      return {
        id,
        title: row?.title || id,
        subject: row?.subject || "",
        topic: row?.topic || "",
        yearGroup: row?.year_group || "",
        imagePath: v.imagePath,
        strategy: v.strategy,
        provider: v.provider,
        generatedAt: v.generatedAt,
        lastFeedback: v.lastFeedback || null,
      };
    });
  // recent[] is kept for backward-compatibility with the previous
  // dashboard layout — first 24 of `browse`.
  const recent = browse.slice(0, 24);
  const failures = Object.entries(state.rows)
    .filter(([, v]) => v.status === "ai-failed" || v.status === "provider-out")
    .slice(0, 100)
    .map(([id, v]) => {
      const row = catalogue.find((r) => r.id === id);
      return {
        id,
        title: row?.title || id,
        subject: row?.subject || "",
        status: v.status,
        lastError: v.lastError,
      };
    });
  const taxonomy = summariseStrategies(catalogue);
  const byPhase = summariseByPhase(state, catalogue);

  const data = {
    updatedAt: new Date().toISOString(),
    counts,
    byPhase,
    taxonomy,
    recent,
    browse,
    failures,
  };
  await fs.writeFile(DASHBOARD_DATA, JSON.stringify(data, null, 2) + "\n");
}

function makeLogger() {
  const lines = [];
  const now = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(LOG_DIR, `${now}.log`);
  const log = (lvl, msg) => {
    const line = `[${new Date().toISOString()}] ${lvl} ${msg}`;
    lines.push(line);
    console.log(line);
  };
  return {
    info: (m) => log("INFO", m),
    warn: (m) => log("WARN", m),
    error: (m) => log("ERROR", m),
    flush: () => fs.writeFile(file, lines.join("\n") + "\n").catch(() => {}),
    file,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const log = makeLogger();
  await ensureDirs();
  log.info(
    `Pipeline run started — batch=${args.batch} concurrency=${args.concurrency} dry=${args.dry}`,
  );

  // Diagnostic: print the active provider chain and which keys are
  // visible in env. This is the single most-asked debugging question
  // ("is my Gemini key even reaching the runner?") so we surface the
  // answer at the top of every run log. Values are NEVER printed —
  // only "set"/"missing".
  const keyStatus = {
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    TOGETHER_API_KEY: !!process.env.TOGETHER_API_KEY,
    CLOUDFLARE_AI_TOKEN: !!process.env.CLOUDFLARE_AI_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: !!process.env.CLOUDFLARE_ACCOUNT_ID,
    HUGGINGFACE_TOKEN: !!process.env.HUGGINGFACE_TOKEN,
  };
  log.info(
    `Provider keys visible: ${Object.entries(keyStatus)
      .map(([k, v]) => `${k}=${v ? "set" : "missing"}`)
      .join(" ")}`,
  );
  log.info(`Active provider chain: ${providers.activeChain().join(" → ")}`);
  const hasPaidKey =
    keyStatus.GEMINI_API_KEY ||
    keyStatus.TOGETHER_API_KEY ||
    keyStatus.CLOUDFLARE_AI_TOKEN ||
    keyStatus.HUGGINGFACE_TOKEN;
  if (!hasPaidKey) {
    log.warn(
      "No paid provider key reached the runner. " +
        "Pollinations is the only fallback and it returns HTTP 402 in 2026. " +
        "Add a secret named EXACTLY 'GEMINI_API_KEY' (case-sensitive) at " +
        "Settings → Secrets and variables → Actions → New repository secret. " +
        "If you already added it and this warning still appears, the secret " +
        "name does not match — delete and re-add it with the exact name above.",
    );
  }

  const catalogue = await loadCatalogue();
  log.info(`Loaded catalogue: ${catalogue.length} rows`);
  const state = await loadState();

  // Auto-rescue: when a paid provider key is now available but rows are
  // still stuck in 'provider-out' from earlier runs (typically because
  // they hit Pollinations HTTP 402 before a Gemini key was added),
  // reset them to 'pending' so they retry on this run. Skipped on --dry.
  if (hasPaidKey && !args.dry) {
    let rescued = 0;
    for (const [id, row] of Object.entries(state.rows)) {
      if (row.status === "provider-out") {
        setRow(state, id, {
          status: "pending",
          // Keep the previous error around for audit, but clear the
          // attemptsLog so the next run starts fresh.
          rescueNote: `Auto-rescued from provider-out at ${new Date().toISOString()} after a paid provider key became available.`,
          attemptsLog: null,
        });
        rescued += 1;
      }
    }
    if (rescued > 0) {
      log.info(
        `Auto-rescue: reset ${rescued} 'provider-out' rows to 'pending' (a paid provider key is now available).`,
      );
    }
  }

  // Apply any teacher-feedback entries that arrived since the last run:
  // every flagged row is reset to 'pending' (so it gets picked up this
  // batch) and its flaws are passed through to the prompt builder via
  // feedbackById. Skipped on --dry so feedback survives until a real run.
  const feedbackQueue = await loadFeedback();
  const feedbackById = indexUnappliedById(feedbackQueue);
  if (feedbackById.size > 0 && !args.dry) {
    log.info(`Applying ${feedbackById.size} teacher-feedback entries`);
    for (const [id, entry] of feedbackById) {
      setRow(state, id, {
        status: "pending",
        lastFeedback: {
          flaws: entry.flaws,
          note: entry.note,
          submittedBy: entry.submittedBy,
          submittedAt: entry.submittedAt,
          issueNumber: entry.issueNumber,
        },
      });
    }
    markApplied(feedbackQueue, [...feedbackById.values()]);
    await saveFeedback(feedbackQueue);
  } else if (feedbackById.size > 0) {
    log.info(`(dry) ${feedbackById.size} teacher-feedback entries would be applied`);
  }

  let batch;
  if (args.only) {
    batch = catalogue.filter((r) => r.id === args.only);
  } else {
    // When teacher feedback exists, prioritise those rows in this batch
    // even if other pending rows would normally come first.
    const flaggedRows = feedbackById.size
      ? catalogue.filter((r) => feedbackById.has(r.id))
      : [];
    const flaggedIds = new Set(flaggedRows.map((r) => r.id));
    const rest = pickBatch(state, catalogue, args.batch).filter(
      (r) => !flaggedIds.has(r.id),
    );
    batch = [...flaggedRows, ...rest].slice(0, args.batch);
  }
  log.info(`Batch: ${batch.length} rows`);

  if (args.dry) {
    for (const row of batch) {
      const d = chooseStrategy(row);
      log.info(`DRY ${row.id} → ${d.strategy} ${d.renderer || ""} | ${row.title}`);
    }
    await writeDashboardData(state, catalogue);
    await log.flush();
    return;
  }

  if (batch.length === 0) {
    log.info("Nothing to do.");
    await writeDashboardData(state, catalogue);
    await log.flush();
    return;
  }

  await processBatch(batch, args, state, log, feedbackById);
  await saveState(state);
  await writeDashboardData(state, catalogue);
  const counts = summarise(state, catalogue);
  log.info(`Run complete: ${JSON.stringify(counts)}`);
  await log.flush();
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exitCode = 1;
});
