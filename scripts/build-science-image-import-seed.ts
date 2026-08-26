import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildScienceImageManifest } from "../shared/scienceImageGeneration.js";

const reviewedAssets: Record<string, { imageUrl: string; scientificReviewNotes: string }> = {
  "ks1-primary-science-plants-basic-flowering-plant-structure--diagram_a": {
    imageUrl: "/diagram-library/science/ks1-primary-plants-basic-flowering-plant-structure--diagram-a.png",
    scientificReviewNotes: "Approved primary review: plant anatomy and all five leader labels are correct; child-accessible layout retained.",
  },
  "ks2-primary-science-states-of-matter-water-cycle--diagram_a": {
    imageUrl: "/diagram-library/science/ks2-primary-states-of-matter-water-cycle--diagram-a.png",
    scientificReviewNotes: "Approved primary review: arrows correctly show evaporation, condensation, precipitation and collection.",
  },
  "ks3-biology-cells-and-organisation-plant-and-animal-cells--diagram_a": {
    imageUrl: "/diagram-library/science/ks3-biology-cells-and-organisation-plant-and-animal-cells--diagram-a.png",
    scientificReviewNotes: "Approved KS3 review after targeted correction: leader lines identify the plant-cell nucleus, chloroplast, vacuole and mitochondrion correctly; animal cell contains no cell wall or chloroplast.",
  },
  "gcse-chemistry-bonding-structure-and-properties-ionic-bonding--diagram_a": {
    imageUrl: "/diagram-library/science/gcse-chemistry-bonding-structure-and-properties-ionic-bonding--diagram-a.png",
    scientificReviewNotes: "Approved GCSE chemistry review: sodium transfers one electron to chlorine, producing correctly bracketed Na+ and Cl- ions with complete outer shells.",
  },
  "gcse-physics-electricity-series-and-parallel-circuits--diagram_a": {
    imageUrl: "/diagram-library/science/gcse-physics-electricity-series-and-parallel-circuits--diagram-a.png",
    scientificReviewNotes: "Rejected during final review: GPT Image 2 repeatedly rendered an open switch in a circuit described as closed. Retained in the staged files as a test case only; omitted from import.",
  },
};

async function main() {
  const manifest = buildScienceImageManifest({ includeRevisionMaps: true });
  const entries = manifest
    .filter((entry) => reviewedAssets[entry.assetId])
    .filter((entry) => !reviewedAssets[entry.assetId].scientificReviewNotes.startsWith("Rejected"))
    .map((entry) => ({
      ...entry,
      imageUrl: reviewedAssets[entry.assetId].imageUrl,
      tags: [...entry.aliases, entry.stage, entry.discipline, entry.topic, entry.subtopic, "gpt-image-2", "scientifically-reviewed"],
      reviewStatus: "approved",
      scientificReviewNotes: reviewedAssets[entry.assetId].scientificReviewNotes,
    }));

  const outputDir = resolve(process.cwd(), "generated");
  await mkdir(outputDir, { recursive: true });
  await writeFile(resolve(outputDir, "science-image-import-seed.json"), `${JSON.stringify({ entries }, null, 2)}\n`, "utf8");
  console.log(`Prepared ${entries.length} reviewed GPT Image 2 science assets for import.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
