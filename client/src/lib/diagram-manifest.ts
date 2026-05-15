/**
 * diagram-manifest.ts
 * Client-side helper for looking up diagram icons from the static manifest.
 * Used by Phase 2.3 (topic icon in header) and Phase 3.1 (no-DB diagram fallback).
 */

interface ManifestEntry {
  file: string;
  path: string;
  topicKeys: string[];
  subject: string;
}

interface DiagramManifest {
  count: number;
  entries: ManifestEntry[];
}

let cachedManifest: DiagramManifest | null = null;

/**
 * Loads and caches the diagram manifest from the static public folder.
 */
async function loadManifest(): Promise<DiagramManifest> {
  if (cachedManifest) return cachedManifest;
  try {
    const res = await fetch('/diagrams/manifest.json');
    if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
    cachedManifest = await res.json();
    return cachedManifest!;
  } catch {
    return { count: 0, entries: [] };
  }
}

/**
 * Normalises a topic string to a lookup key (lowercase, hyphenated).
 */
function normaliseTopicKey(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Common synonyms that map to diagram filenames
const TOPIC_SYNONYMS: Record<string, string> = {
  'finding-the-hypotenuse': 'pythagoras',
  'pythagoras-theorem': 'pythagoras',
  'pythagorean-theorem': 'pythagoras',
  'forces-and-motion': 'newtons-laws',
  'newtons-laws-of-motion': 'newtons-laws',
  'the-water-cycle': 'water-cycle',
  'plant-cells': 'plant-cell',
  'animal-cells': 'animal-cell',
  'the-digestive-system': 'digestive-system',
  'electromagnetic-spectrum': 'em-spectrum',
  'human-digestive-system': 'digestive-system',
  'the-periodic-table': 'periodic-table',
  'ionic-bonding': 'ionic-bonds',
  'covalent-bonding': 'covalent-bonding',
  'atomic-structure': 'atomic-structure',
  'photosynthesis-process': 'photosynthesis',
  'cellular-respiration': 'respiration',
  'carbon-cycle': 'water-cycle', // fallback
  'linear-graphs': 'algebra-linear-graph-reference',
  'quadratic-graphs': 'algebra-parabola-reference',
  'plotting-coordinates': 'coordinate-system',
  'area-and-perimeter': 'area-perimeter',
  'types-of-angles': 'angles-types',
  'circle-theorems': 'circle-theorems',
  'parts-of-a-circle': 'circle-parts',
  'tectonic-plates': 'tectonic-plates',
  'coastal-erosion': 'coastal-features',
  'battle-of-hastings': 'battle-of-hastings',
};

/**
 * Finds a matching diagram for a given topic string.
 * Returns the path to the diagram image or null if no match found.
 */
export async function findDiagramForTopic(topic: string, subject?: string): Promise<string | null> {
  const manifest = await loadManifest();
  if (!manifest.entries.length) return null;

  const key = normaliseTopicKey(topic);

  // Check synonym table first
  const synonym = TOPIC_SYNONYMS[key];
  if (synonym) {
    const match = manifest.entries.find(e => e.topicKeys.includes(synonym));
    if (match) return match.path;
  }

  // Direct key match
  const direct = manifest.entries.find(e => e.topicKeys.includes(key));
  if (direct) return direct.path;

  // Fuzzy: check if any entry's topicKeys are a substring of the topic key or vice versa
  const fuzzy = manifest.entries.find(e =>
    e.topicKeys.some(tk => key.includes(tk) || tk.includes(key))
  );
  if (fuzzy) return fuzzy.path;

  // Subject-filtered token match: split topic into words and check against entries in the same subject
  const tokens = key.split('-').filter(t => t.length > 3);
  if (tokens.length && subject) {
    const subjectKey = normaliseTopicKey(subject);
    const subjectEntries = manifest.entries.filter(e =>
      e.subject === subjectKey || e.subject === 'general'
    );
    for (const entry of subjectEntries) {
      const matchCount = tokens.filter(t => entry.topicKeys.some(tk => tk.includes(t))).length;
      if (matchCount >= 2 || (tokens.length === 1 && matchCount === 1)) return entry.path;
    }
  }

  return null;
}

/**
 * Returns a small thumbnail icon URL for the worksheet header.
 * Returns null if no suitable diagram exists.
 */
export async function getTopicIcon(topic: string, subject?: string): Promise<string | null> {
  return findDiagramForTopic(topic, subject);
}
