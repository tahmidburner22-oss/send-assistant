#!/usr/bin/env node
/**
 * build-diagram-manifest.mjs
 * Scans client/public/diagrams/ and generates a manifest.json
 * mapping canonical topic keys to diagram file paths.
 * Run: node scripts/build-diagram-manifest.mjs
 */
import { readdirSync, writeFileSync } from 'fs';
import { join, extname, basename } from 'path';

const DIAGRAMS_DIR = join(process.cwd(), 'client/public/diagrams');
const OUTPUT_PATH = join(process.cwd(), 'client/public/diagrams/manifest.json');

// Subject classification by keyword
const SUBJECT_KEYWORDS = {
  mathematics: ['algebra', 'angles', 'area', 'bearings', 'circle', 'coordinate', 'fraction', 'geometry', 'graph', 'inequality', 'linear', 'number-line', 'parabola', 'perimeter', 'probability', 'pythagoras', 'quadratic', 'ratio', 'sequence', 'shapes', 'statistics', 'symmetry', 'transformation', 'trigonometry', 'vectors', 'venn'],
  biology: ['animal', 'bacteria', 'butterfly', 'cell', 'dna', 'digestive', 'ecosystem', 'enzyme', 'evolution', 'food-chain', 'food-web', 'heart', 'human-body', 'lifecycle', 'lung', 'mitosis', 'nervous', 'organ', 'photosynthesis', 'plant', 'respiration'],
  chemistry: ['acid', 'atom', 'bonding', 'covalent', 'distillation', 'electrolysis', 'element', 'ionic', 'periodic', 'reaction', 'separation'],
  physics: ['circuit', 'electromagnet', 'em-spectrum', 'energy', 'force', 'half-life', 'light', 'magnet', 'motion', 'motor', 'newton', 'nuclear', 'ray', 'reflection', 'wave'],
  history: ['ancient', 'battle', 'castle', 'cold-war', 'empire', 'medieval', 'roman', 'timeline', 'trench', 'tudor', 'viking', 'war', 'hastings'],
  geography: ['coastal', 'climate', 'earthquake', 'erosion', 'glacier', 'map', 'plate', 'population', 'river', 'tectonic', 'volcano', 'water-cycle', 'weather'],
  computer_science: ['algorithm', 'binary', 'big-o', 'computer', 'cpu', 'data-structure', 'flowchart', 'logic-gate', 'network', 'sorting'],
  english: ['language', 'literary', 'poetry', 'shakespeare'],
  science: ['microscope', 'scientific-method', 'lab'],
};

function classifySubject(filename) {
  const lower = filename.toLowerCase();
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return subject;
    }
  }
  return 'general';
}

function fileToTopicKeys(filename) {
  // Remove extension, split on hyphens/underscores
  const base = basename(filename, extname(filename));
  const keys = [base]; // primary key is the full stem
  // Also add individual word tokens for fuzzy matching
  const tokens = base.split(/[-_]+/).filter(t => t.length > 2);
  if (tokens.length > 1) keys.push(...tokens);
  return keys;
}

const files = readdirSync(DIAGRAMS_DIR)
  .filter(f => /\.(png|svg|jpg|jpeg|webp)$/i.test(f))
  .sort();

const manifest = {
  generated: new Date().toISOString(),
  count: files.length,
  entries: files.map(f => ({
    file: f,
    path: `/diagrams/${f}`,
    topicKeys: fileToTopicKeys(f),
    subject: classifySubject(f),
  })),
};

writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));
console.log(`Diagram manifest generated: ${manifest.count} entries -> ${OUTPUT_PATH}`);
