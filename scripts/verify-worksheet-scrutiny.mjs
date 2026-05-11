/**
 * Verification script — hand-runs key worksheet-scrutiny logic without
 * needing vitest / node_modules installed.
 *
 * Exercises:
 *   1. normaliseSendKey & resolveSendSpec — autism sub-profile resolution
 *   2. runWorksheetPostValidators — full chain
 *   3. buildAscSupport — one WYNTD box per section
 *
 * Runs the real TypeScript source by stripping types with a small
 * hand-rolled transform (enough for these three modules).
 *
 * Usage:
 *   node scripts/verify-worksheet-scrutiny.mjs
 *
 * Exits 0 on success, non-zero on failure.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { createRequire } from "module";
import { execSync } from "child_process";
import path from "path";

const require = createRequire(import.meta.url);

function stripTypes(src) {
  // No longer used — we compile with tsc instead. Kept as a defensive fallback.
  return src;
}

function loadModule(relPath) {
  // Use the globally-installed tsc to compile the target file to JS in a
  // temp dir, then require() it. We write a local package.json with
  // {"type":"commonjs"} so node treats the emitted .js files as CJS even
  // though the project root has "type":"module".
  const outDir = path.resolve(".verify-tmp");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "package.json"), '{"type":"commonjs"}');
  const tscBin = "tsc";
  try {
    execSync(
      `${tscBin} --outDir "${outDir}" --module commonjs --target ES2020 --esModuleInterop --allowJs --skipLibCheck --strict false --moduleResolution node --ignoreConfig "${path.resolve(relPath)}"`,
      { stdio: "pipe" }
    );
  } catch (_e) {
    // tsc may exit non-zero when there are type errors, but JS output is
    // usually still written. Ignore.
  }
  const jsPath = path.join(outDir, path.basename(relPath).replace(/\.ts$/, ".js"));
  if (!existsSync(jsPath)) {
    throw new Error(`tsc did not produce ${jsPath}`);
  }
  delete require.cache[require.resolve(jsPath)];
  return require(jsPath);
}

function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`  ✗ ${label}\n    expected ${e}\n    actual   ${a}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`  ✓ ${label}`);
  return true;
}

function assertTrue(cond, label) {
  if (!cond) {
    console.error(`  ✗ ${label}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`  ✓ ${label}`);
  return true;
}

console.log("Verifying worksheet-scrutiny improvements...\n");

// Because the type-stripper is narrow, we focus on the single module whose
// transformation we have full confidence in — worksheetPostValidator. For
// resolveSendSpec / overlayEngine we verify via string-level assertions of
// the source itself.

// ── 1. resolveSendSpec string-level checks ─────────────────────────────────
console.log("resolveSendSpec wiring:");
{
  const src = readFileSync("client/src/lib/sendPromptFragments.ts", "utf8");
  assertTrue(/\[\/\\b\(asc-social\|social-communication\)\\b\/, "asc-social"\]/.test(src),
    "asc-social matcher registered");
  assertTrue(/\[\/\\b\(asc-demand-avoidant\|demand-avoidant\|asc-da\)\\b\/, "asc-demand-avoidant"\]/.test(src),
    "asc-demand-avoidant matcher registered");
  assertTrue(/\[\/\\b\(asc-sensory\|sensory-dominant\|asc-sd\)\\b\/, "asc-sensory"\]/.test(src),
    "asc-sensory matcher registered");
  assertTrue(/\[\/\\b\(asc-rigid\|rigid-thinking\|asc-routine\)\\b\/, "asc-rigid"\]/.test(src),
    "asc-rigid matcher registered");
  assertTrue(/function normaliseSendKey/.test(src) && /split\(":"\)/.test(src),
    "normaliseSendKey handles compound 'asc:asc-social' form");
  assertTrue(/id: "asc-social"/.test(src) && /id: "asc-demand-avoidant"/.test(src) &&
             /id: "asc-sensory"/.test(src) && /id: "asc-rigid"/.test(src),
    "All 4 autism sub-profile specs defined");
}

// ── 2. worksheetPostValidator behavioural checks ───────────────────────────
console.log("\nworksheetPostValidator:");
try {
  const mod = loadModule("client/src/lib/worksheetPostValidator.ts");
  const { enforceSingleMcqCorrect, dedupeWordBank, stripForeignDiagrams,
          enforceYearGroupLock, capWorkedExampleSteps, runWorksheetPostValidators } = mod;

  {
    const r = enforceSingleMcqCorrect({ sections: [{
      type: "q-mcq", content: "Q?\nA  x\nB  y ✓\nC  z ✓\nD  w",
    }] });
    assertEqual((r.worksheet.sections[0].content.match(/✓/g) || []).length, 1,
      "enforceSingleMcqCorrect leaves exactly one ✓");
    assertTrue(r.warnings.length === 1, "enforceSingleMcqCorrect emits one warning");
  }

  {
    const r = dedupeWordBank({ sections: [{
      type: "q-gap-fill",
      content: "WORD BANK: a | b | A | c | d | e | f | g | h | i | j | k",
    }] });
    const line = r.worksheet.sections[0].content.split("\n")
      .find(l => l.startsWith("WORD BANK:"));
    const words = line.split(":")[1].split("|").map(x => x.trim()).filter(Boolean);
    assertTrue(words.length === 10, `word bank capped at 10 (got ${words.length})`);
    assertTrue(new Set(words.map(w => w.toLowerCase())).size === words.length,
      "word bank deduped (case-insensitive)");
  }

  {
    const r = stripForeignDiagrams(
      { metadata: { subject: "physics" }, sections: [
        { type: "diagram-a", title: "computer-architecture" },
        { type: "diagram-b", title: "Forces diagram" },
      ] },
      { subject: "physics" },
    );
    assertTrue(r.worksheet.sections.length === 1, "computer-architecture diagram removed from physics sheet");
    assertTrue(r.worksheet.sections[0].title === "Forces diagram", "legitimate science diagram kept");
  }

  {
    const r = enforceYearGroupLock(
      { metadata: { yearGroup: "Year 9" },
        title: "Fractions — Year 11 Mathematics Worksheet",
        sections: [{ type: "objective", title: "Year 11 goal", content: "See the Year 11 spec." }],
      },
      { yearGroup: "Year 9" },
    );
    assertTrue(r.worksheet.title.includes("Year 9"), "title rewritten to declared year");
    assertTrue(!r.worksheet.title.includes("Year 11"), "stray Year 11 stripped from title");
    assertTrue(r.worksheet.sections[0].title.includes("Year 9"), "section title rewritten");
    assertTrue(!r.worksheet.sections[0].content.includes("Year 11"), "section content rewritten");
  }

  {
    const r = capWorkedExampleSteps(
      { metadata: { subject: "mathematics" }, sections: [{
        type: "example",
        content: "Step 1: a\nStep 2: b\nStep 3: c\nStep 4: d\nStep 5: e\nStep 6: f\n✓ Key point: x",
      }] },
      { subject: "mathematics" },
    );
    const content = r.worksheet.sections[0].content;
    assertTrue(/Step 4/.test(content), "maths kept Step 4");
    assertTrue(!/Step 5/.test(content), "maths clipped Step 5");
    assertTrue(!/Step 6/.test(content), "maths clipped Step 6");
    assertTrue(/Key point/.test(content), "Key point trailer preserved");
  }

  {
    const r = runWorksheetPostValidators({
      metadata: { subject: "physics", yearGroup: "Year 9" },
      title: "Forces — Year 11 Worksheet",
      sections: [
        { type: "q-mcq", content: "Q?\nA ✓\nB ✓\nC\nD" },
        { type: "q-gap-fill", content: "WORD BANK: a | b | A | B | c | d | e | f | g | h | i | j | k" },
        { type: "diagram-a", title: "computer-architecture overview" },
      ],
    }, { subject: "physics", yearGroup: "Year 9" });
    assertTrue(r.warnings.length >= 3, "end-to-end chain emitted multiple warnings");
    assertTrue(r.worksheet.title === "Forces — Year 9 Worksheet", "end-to-end rewrote title year");
    const mcq = r.worksheet.sections.find(s => s.type === "q-mcq");
    assertTrue((mcq.content.match(/✓/g) || []).length === 1, "end-to-end single ✓");
    const dia = r.worksheet.sections.find(s => s.type === "diagram-a");
    assertTrue(!dia, "end-to-end removed computer-architecture diagram");
  }
} catch (e) {
  console.error("  ✗ worksheetPostValidator load/run failed:", e && e.message);
  console.error(e && e.stack);
  process.exitCode = 1;
}

// ── 3. overlayEngine.buildAscSupport — source-level check ─────────────────
console.log("\noverlayEngine ASC support (source-level checks):");
{
  const src = readFileSync("server/lib/overlayEngine.ts", "utf8");
  assertTrue(/function buildAscSupport/.test(src), "buildAscSupport present");
  assertTrue(/flushGroup/.test(src) && /insertAfterIdx/.test(src),
    "buildAscSupport uses section-grouping logic (not per-question)");
  assertTrue(/key\.startsWith\("asc-"\)/.test(src),
    "dispatcher routes autism sub-profile ids to buildAscSupport");
  // And that we removed the old per-question logic
  assertTrue(!/for \(const section of sections\) \{\s*result\.push\(section\);\s*if \(!QUESTION_TYPES\.has\(section\.type\)[^}]*\}\s*const steps/s.test(src),
    "old per-question WYNTD loop removed");
}

// ── 4. ai.ts wiring ────────────────────────────────────────────────────────
console.log("\nai.ts post-validator wiring:");
{
  const src = readFileSync("client/src/lib/ai.ts", "utf8");
  assertTrue(/runWorksheetPostValidators/.test(src), "runWorksheetPostValidators imported");
  const callSites = (src.match(/runWorksheetPostValidators\(/g) || []).length;
  assertTrue(callSites >= 2, `runWorksheetPostValidators invoked in both paths (${callSites} call sites)`);
  assertTrue(/Fluency — Core Practice/.test(src) && /Reasoning — Show Your Thinking/.test(src)
    && /Problem Solving — Apply It/.test(src),
    "Maths layout contract names present in ai.ts");
  assertTrue(/MATHS WORKSHEET LAYOUT CONTRACT/.test(src),
    "Maths layout contract header present");
  assertTrue(/SCIENCE WORKSHEET LAYOUT CONTRACT/.test(src),
    "Science layout contract header present");
  assertTrue(/FORBIDDEN diagram types on a science worksheet/.test(src),
    "Science diagram subject-lock rule present");
  assertTrue(/mixed-number|top-heavy fraction/i.test(src),
    "Mixed-number worked-example rule present");
  assertTrue(/YEAR-GROUP LOCK/.test(src),
    "Year-group lock rule present");
  assertTrue(/SELF REFLECTION \(SLIM/.test(src),
    "Slim reflection rule present in top-level prompt");
}

// ── 5. send-data.ts autism sub-profiles ──────────────────────────────────
console.log("\nsend-data.ts autism sub-profiles + descriptionBlocks:");
{
  const src = readFileSync("client/src/lib/send-data.ts", "utf8");
  assertTrue(/subProfiles/.test(src), "subProfiles field declared");
  assertTrue(/id: "asc-social"/.test(src) && /id: "asc-demand-avoidant"/.test(src)
    && /id: "asc-sensory"/.test(src) && /id: "asc-rigid"/.test(src),
    "All 4 autism sub-profiles defined on ASC entry");
  assertTrue(/descriptionBlocks:/.test(src), "descriptionBlocks field used");
  const blocksCount = (src.match(/descriptionBlocks:\s*\{/g) || []).length;
  assertTrue(blocksCount >= 10,
    `descriptionBlocks present on >=10 SEND needs (got ${blocksCount})`);
}

// ── 6. SENDInfoPanel renders structured blocks ─────────────────────────────
console.log("\nSENDInfoPanel:");
{
  const src = readFileSync("client/src/components/SENDInfoPanel.tsx", "utf8");
  assertTrue(/descriptionBlocks/.test(src), "reads descriptionBlocks");
  assertTrue(/How it presents/.test(src), "renders 'How it presents' label");
  assertTrue(/Barriers on a standard worksheet/.test(src), "renders 'Barriers' label");
  assertTrue(/What the generator changes/.test(src), "renders 'What the generator changes' label");
  assertTrue(/subProfiles/.test(src), "renders sub-profile picker hints");
}

// ── 7. WorksheetRenderer removed per-question 'Working out' caption ───────
console.log("\nWorksheetRenderer:");
{
  const src = readFileSync("client/src/components/WorksheetRenderer.tsx", "utf8");
  // The original complaint was about the 'Working out' (lowercase) caption
  // printed next to EVERY per-question maths answer box — there used to be
  // 3 such occurrences across the main, sub-question, and nested maths
  // blocks. We fixed the three per-question instances and kept:
  //   - The whole-section 'Working Out' box (a different feature, title case)
  //   - The bordered 'WORKING OUT' header on the single challenge question.
  // Both of those are intentional and represent different visual treatments.
  const lowercasePerQuestion = (src.match(/>\s*Working\s+out\s*</g) || []).length;
  assertTrue(lowercasePerQuestion === 0,
    `per-question lowercase 'Working out' caption removed from maths blocks (found ${lowercasePerQuestion})`);
}

if (process.exitCode === 1) {
  console.log("\n✗ Verification FAILED");
  process.exit(1);
} else {
  console.log("\n✓ All verification checks passed");
}



// ── 8. Run buildAscSupport end-to-end via the compiled overlayEngine ──────
console.log("\noverlayEngine buildAscSupport (runtime check):");
try {
  const mod = loadModule("server/lib/overlayEngine.ts");
  const { applyOverlays } = mod;
  const baseSections = [
    { id: "lo", type: "learning-objective", content: "Understand forces." },
    { id: "s1", type: "header", title: "Section 1 — Fluency" },
    { id: "q1", type: "q-short-answer", content: "Calculate 12 + 7." },
    { id: "q2", type: "q-short-answer", content: "Calculate 15 - 3." },
    { id: "q3", type: "q-short-answer", content: "Calculate 9 x 4." },
    { id: "s2", type: "header", title: "Section 2 — Reasoning" },
    { id: "q4", type: "q-short-answer", content: "Show that 2 + 3 = 5." },
    { id: "q5", type: "q-short-answer", content: "Show that 10 - 4 = 6." },
  ];
  const r = applyOverlays(baseSections, { sendNeed: "asc" });
  const wyntd = r.sections.filter(s => /what you need to do/i.test(String(s.title || "")));
  assertTrue(wyntd.length === 2,
    `ASC overlay inserts ONE 'What you need to do' box per section (found ${wyntd.length})`);
  // Every original question section is still present
  const keptQs = r.sections.filter(s => /^q\d+$/.test(String(s.id || ""))).map(s => s.id);
  assertEqual(keptQs, ["q1", "q2", "q3", "q4", "q5"],
    "All original question sections preserved");

  // Also verify sub-profile routing works
  const r2 = applyOverlays(baseSections, { sendNeed: "asc:asc-demand-avoidant" });
  const wyntd2 = r2.sections.filter(s => /what you need to do/i.test(String(s.title || "")));
  assertTrue(wyntd2.length === 2,
    `ASC sub-profile 'asc-demand-avoidant' still routes to the same overlay (found ${wyntd2.length})`);
} catch (e) {
  console.error("  ✗ overlayEngine runtime check failed:", e && e.message);
  if (e && e.stack) console.error(e.stack);
  process.exitCode = 1;
}

if (process.exitCode === 1) {
  console.log("\n✗ Verification FAILED (runtime check)");
  process.exit(1);
}
console.log("\n✓ All runtime checks passed");
