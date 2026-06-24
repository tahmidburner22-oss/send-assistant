/**
 * verify-maths-gold.mts  (run with: npx tsx scripts/verify-maths-gold.mts)
 *
 * Renders gold worksheets (base + SEND themes) in headless Chromium and checks
 * that nothing overflows the fixed 2-page A4 landscape geometry. Also captures
 * screenshots for visual spot-checking against maths-worksheets/pdf/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
  renderGoldWorksheetHtml,
  type GoldWorksheet,
} from "../client/src/lib/mathsGoldRenderer.ts";
import { getGoldSendTheme } from "../client/src/lib/mathsGoldSend.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "client/src/data/maths-gold/worksheets.json"),
    "utf8"
  )
) as Record<string, GoldWorksheet>;

const SHOT_DIR = path.join(ROOT, "output", "maths-gold-verify");
fs.mkdirSync(SHOT_DIR, { recursive: true });

// representative spread: algebra, fractions (frac markup), surds, stats, geometry
const SAMPLE_SLUGS = [
  "021-substitution-into-expressions",
  "069-multiplying-fractions",
  "178-simplifying-surds",
  "170-mean-median-mode-and-range",
  "194-volume-of-pyramids-cones-and-spheres",
  "139-tree-diagrams",
];
const THEMES = ["base", "dyslexia", "vi", "mld", "adhd"];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 820 },
    deviceScaleFactor: 1,
  });
  await page.emulateMedia({ media: "print" });

  let failures = 0;
  let checks = 0;

  for (const slug of SAMPLE_SLUGS) {
    const data = DATA[slug];
    if (!data) {
      console.log(`MISSING DATA: ${slug}`);
      failures++;
      continue;
    }
    for (const themeId of THEMES) {
      checks++;
      const theme = themeId === "base" ? undefined : getGoldSendTheme(themeId);
      const html = renderGoldWorksheetHtml(data, theme);
      await page.setContent(html, { waitUntil: "networkidle" });

      const report = await page.evaluate(() => {
        const pages = Array.from(document.querySelectorAll(".ws-root .page"));
        const tol = 2; // px tolerance
        const out: {
          pageCount: number;
          overflows: { page: number; sel: string; over: number; dir: string }[];
          examples: number;
          practice: number;
          misc: number;
          challenge: number;
        } = {
          pageCount: pages.length,
          overflows: [],
          examples: document.querySelectorAll(".ws-root .ex-c").length,
          practice: document.querySelectorAll(".ws-root .pc").length +
            document.querySelectorAll(".ws-root .prac-mixed").length,
          misc: document.querySelectorAll(".ws-root .mi").length,
          challenge: document.querySelectorAll(".ws-root .cc").length,
        };
        pages.forEach((pg, i) => {
          const pr = pg.getBoundingClientRect();
          const descendants = pg.querySelectorAll("*");
          descendants.forEach((el) => {
            const r = (el as HTMLElement).getBoundingClientRect();
            if (r.width === 0 && r.height === 0) return;
            const overBottom = r.bottom - pr.bottom;
            const overRight = r.right - pr.right;
            if (overBottom > tol) {
              out.overflows.push({
                page: i + 1,
                sel:
                  (el as HTMLElement).className?.toString().slice(0, 40) ||
                  el.tagName,
                over: Math.round(overBottom),
                dir: "bottom",
              });
            }
            if (overRight > tol) {
              out.overflows.push({
                page: i + 1,
                sel:
                  (el as HTMLElement).className?.toString().slice(0, 40) ||
                  el.tagName,
                over: Math.round(overRight),
                dir: "right",
              });
            }
          });
        });
        return out;
      });

      // keep only the largest overflow per page to reduce noise
      const worst = new Map<string, { over: number; sel: string; dir: string }>();
      for (const o of report.overflows) {
        const k = `${o.page}`;
        if (!worst.has(k) || worst.get(k)!.over < o.over)
          worst.set(k, { over: o.over, sel: o.sel, dir: o.dir });
      }

      const structOk =
        report.pageCount === 2 &&
        report.examples === 4 &&
        report.misc === 5 &&
        report.challenge === 2;
      const overflowOk = worst.size === 0;
      const ok = structOk && overflowOk;
      if (!ok) failures++;

      const tag = `${slug} [${themeId}]`;
      if (ok) {
        console.log(`  OK  ${tag}`);
      } else {
        console.log(
          `FAIL  ${tag}  pages=${report.pageCount} ex=${report.examples} misc=${report.misc} chal=${report.challenge}` +
            (overflowOk
              ? ""
              : "  overflow=" +
                [...worst.entries()]
                  .map(([p, w]) => `p${p}:${w.sel}+${w.over}px(${w.dir})`)
                  .join(", "))
        );
      }

      // screenshot a couple for visual inspection
      if (themeId === "base" || themeId === "dyslexia") {
        await page.screenshot({
          path: path.join(SHOT_DIR, `${slug}__${themeId}.png`),
          fullPage: true,
        });
      }
    }
  }

  await browser.close();
  console.log(`\n${checks - failures}/${checks} checks passed.`);
  if (failures > 0) process.exitCode = 1;
}

main();
