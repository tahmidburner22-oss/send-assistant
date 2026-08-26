import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildScienceImageManifest, validateScienceImageManifest } from "../shared/scienceImageGeneration.js";

async function main() {
  const manifest = buildScienceImageManifest({ includeRevisionMaps: true });
  const problems = validateScienceImageManifest(manifest);
  if (problems.length) {
    throw new Error(`Science image manifest validation failed:\n${problems.join("\n")}`);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    generatorModel: "gpt-image-2",
    promptVersion: "science-library-v1.0",
    totalAssets: manifest.length,
    byStage: Object.fromEntries(["KS1", "KS2", "KS3", "GCSE"].map((stage) => [stage, manifest.filter((entry) => entry.stage === stage).length])),
    byDiagramType: Object.fromEntries(["diagram_a", "diagram_b", "revision_map"].map((type) => [type, manifest.filter((entry) => entry.diagramType === type).length])),
    requiredPracticalAssets: manifest.filter((entry) => entry.requiredPractical).length,
    taxonomyRecords: new Set(manifest.map((entry) => entry.taxonomyId)).size,
  };

  const outputDir = resolve(process.cwd(), "generated");
  await mkdir(outputDir, { recursive: true });
  await writeFile(resolve(outputDir, "science-image-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(resolve(outputDir, "science-image-manifest-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
