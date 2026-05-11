import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

// All 124 diagram files in public/diagrams/
const DIAGRAM_FILES = [
  "3d-shapes.png",
  "accuracy-number-line.png",
  "acids-bases.png",
  "algebra-blank-axes.png",
  "algebra-blank-grid.png",
  "algebra-function-machine.png",
  "algebra-inequality-region.png",
  "algebra-linear-graph-reference.png",
  "algebra-parabola-reference.png",
  "algebra-sequence-dot-pattern.png",
  "algebra-straight-line-reference.png",
  "ancient-egypt.png",
  "angles-types.png",
  "animal-cell.png",
  "area-perimeter.png",
  "atomic-structure.png",
  "battle-of-hastings.png",
  "bearings.png",
  "big-o-notation.png",
  "binary-representation.png",
  "butterfly-lifecycle.png",
  "cells-biology.png",
  "circle-parts.png",
  "circle-theorems.png",
  "coastal-features.png",
  "computer-architecture.png",
  "coordinates.png",
  "coordinate-system.png",
  "covalent-bonding.png",
  "digestive-system.png",
  "distillation.png",
  "dna-structure.png",
  "electrical-circuit.png",
  "electrolysis.png",
  "electromagnetic-spectrum.png",
  "energy-stores.png",
  "energy-transfer.png",
  "enzyme-activity.png",
  "equation-triangle-density.png",
  "equation-triangle-pressure.png",
  "equation-triangle-sdt.png",
  "flower-structure.png",
  "food-chain.png",
  "food-web.png",
  "forces.png",
  "fractions.png",
  "graph-distance-time.png",
  "graph-velocity-time.png",
  "great-fire-london.png",
  "greenhouse-effect.png",
  "hadrians-wall.png",
  "human-ear.png",
  "human-eye.png",
  "human-heart.png",
  "human-skeleton.png",
  "ionic-bonding.png",
  "light-reflection.png",
  "magnetic-field.png",
  "metallic-bonding.png",
  "mitosis.png",
  "natural-selection.png",
  "neuron.png",
  "number-line.png",
  "number-standard-form-place-value.png",
  "ohms-law.png",
  "parallel-circuit.png",
  "percentages.png",
  "periodic-table.png",
  "photosynthesis.png",
  "ph-scale.png",
  "plant-cell.png",
  "polygons.png",
  "probability.png",
  "probability-sample-space-grid.svg",
  "probability-scale-spinner.svg",
  "probability-tree-independent.svg",
  "probability-tree-no-replacement.svg",
  "probability-two-way-table.svg",
  "probability-venn-sets.svg",
  "pythagoras.png",
  "quadratic-graph.png",
  "quadratics.png",
  "radiation-types.png",
  "rates-of-reaction.png",
  "ratio.png",
  "real-life-conversion-graph.png",
  "refraction-lens.png",
  "respiration.png",
  "respiratory-system.png",
  "river-meander.png",
  "rock-cycle.png",
  "roman-empire.png",
  "scale-grid.png",
  "simultaneous-equations.png",
  "solar-system.png",
  "specific-heat-capacity.png",
  "standard-form-place-value.png",
  "states-of-matter.png",
  "states-particles.png",
  "statistics-averages-raw-data.svg",
  "statistics-bar-pie-charts.svg",
  "statistics-box-plots.svg",
  "statistics-cumulative-frequency.svg",
  "statistics-grouped-frequency-table.svg",
  "statistics-histogram.svg",
  "statistics.png",
  "statistics-questionnaire-results.svg",
  "statistics-sampling-methods.svg",
  "statistics-scatter-graph.svg",
  "stone-age.png",
  "tectonic-plates.png",
  "transformations.png",
  "triangle-properties.png",
  "trigonometry.png",
  "unit-circle.png",
  "vectors.png",
  "venn-diagram.png",
  "viking-longship.png",
  "volcano-cross-section.png",
  "water-cycle.png",
  "waves.png",
  "wave-types.png",
  "world-biomes.png",
  "ww1-trenches.png",
];

type Category =
  | "All"
  | "Algebra"
  | "Biology"
  | "Chemistry"
  | "Physics"
  | "Geometry"
  | "History"
  | "Geography"
  | "Computing"
  | "Statistics"
  | "Other";

const CATEGORIES: Category[] = [
  "All",
  "Algebra",
  "Biology",
  "Chemistry",
  "Physics",
  "Geometry",
  "History",
  "Geography",
  "Computing",
  "Statistics",
  "Other",
];

function categorize(filename: string): Category {
  const lower = filename.toLowerCase();
  if (/^algebra/.test(lower)) return "Algebra";
  if (/^(biology|cells|animal|digestive|butterfly|dna|enzyme|flower|food-chain|food-web|human|mitosis|natural-selection|neuron|photosynthesis|plant|respiration|respiratory)/.test(lower)) return "Biology";
  if (/^(chemistry|acids|atomic|covalent|distillation|electrolysis|ionic|metallic|periodic|ph-scale|rates-of-reaction|rock-cycle|states)/.test(lower)) return "Chemistry";
  if (/^(physics|forces|motion|energy|circuit|electromagnetic|electrical|light|magnetic|ohms|parallel|radiation|refraction|solar|specific-heat|waves?|wave-types|graph-distance|graph-velocity|equation-triangle)/.test(lower)) return "Physics";
  if (/^(geometry|angles|shapes|circle|coordinate|bearings|3d-shapes|area|polygons|pythagoras|quadratic|trigonometry|triangle|transformations|unit-circle|vectors|venn|simultaneous|fractions|percentages|ratio|number|accuracy|scale|real-life)/.test(lower)) return "Geometry";
  if (/^(history|ancient|battle|great-fire|hadrians|roman|stone-age|viking|ww1)/.test(lower)) return "History";
  if (/^(geography|coastal|volcano|water-cycle|weather|tectonic|river|world-biomes|greenhouse)/.test(lower)) return "Geography";
  if (/^(computing|binary|computer|big-o)/.test(lower)) return "Computing";
  if (/^(statistics|probability)/.test(lower)) return "Statistics";
  return "Other";
}

function prettifyFilename(filename: string): string {
  const name = filename.replace(/\.(png|svg)$/, "");
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export interface DiagramPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (diagramUrl: string, filename: string) => void;
}

export function DiagramPicker({ open, onOpenChange, onSelect }: DiagramPickerProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");

  const filtered = useMemo(() => {
    return DIAGRAM_FILES.filter((file) => {
      const matchesSearch = !search || file.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || categorize(file) === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Diagram</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diagrams..."
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={category === cat ? "default" : "outline"}
              className={`cursor-pointer text-xs ${
                category === cat
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "hover:bg-indigo-50 hover:border-indigo-300"
              }`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-1">
            {filtered.map((file) => (
              <button
                key={file}
                onClick={() => {
                  onSelect(`/diagrams/${file}`, file);
                  onOpenChange(false);
                  setSearch("");
                  setCategory("All");
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group"
              >
                <div className="w-full aspect-square rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img
                    src={`/diagrams/${file}`}
                    alt={prettifyFilename(file)}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="text-[10px] text-gray-600 text-center leading-tight line-clamp-2 font-medium">
                  {prettifyFilename(file)}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                No diagrams found matching your search.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DiagramPicker;
