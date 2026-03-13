/**
 * Test script to verify renderMath handles all exam question symbols correctly.
 * We scan all question text fields for math notation patterns.
 */
import { readFileSync } from 'fs';

// Read all question bank files
const files = [
  { name: 'Past Paper Questions', path: 'client/src/lib/pastPaperQuestions.ts' },
  { name: 'Past Paper Expanded', path: 'client/src/lib/pastPaperQuestionsExpanded.ts' },
  { name: 'Maths Question Bank', path: 'client/src/lib/questionBankMaths.ts' },
  { name: 'Physics Question Bank', path: 'client/src/lib/questionBankPhysics.ts' },
  { name: 'Chemistry Question Bank', path: 'client/src/lib/questionBankChemistry.ts' },
  { name: 'Biology Question Bank', path: 'client/src/lib/questionBankBiology.ts' },
];

function extractTextFields(content) {
  const texts = [];
  const regex = /(?:text|question|markScheme|context):\s*["'`]((?:[^"'`\\]|\\.)*?)["'`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1].length > 5) texts.push(match[1]);
  }
  return texts;
}

// Math notation patterns to detect
const mathPatterns = [
  { name: 'LaTeX frac', regex: /\\frac\{/ },
  { name: 'LaTeX sqrt', regex: /\\sqrt/ },
  { name: 'LaTeX dollar', regex: /\$[^$]+\$/ },
  { name: 'LaTeX inline', regex: /\\\(.*?\\\)/ },
  { name: 'LaTeX display', regex: /\\\[.*?\\\]/ },
  { name: 'Caret power', regex: /[A-Za-z0-9]\^[A-Za-z0-9]/ },
  { name: 'HTML sup', regex: /<sup>/ },
  { name: 'HTML sub', regex: /<sub>/ },
  { name: 'Plain fraction', regex: /[A-Za-z0-9]+\/[A-Za-z0-9]+/ },
  { name: 'Greek letter cmd', regex: /\\(alpha|beta|gamma|delta|theta|sigma|lambda|mu|pi|omega|rho|epsilon|phi|eta)\b/ },
  { name: 'Inequality cmd', regex: /\\(leq|geq|neq|approx)\b/ },
  { name: 'Times/div cmd', regex: /\\(times|div|cdot|pm)\b/ },
  { name: 'Unicode superscript', regex: /[\u00b2\u00b3]/ },
  { name: 'Unicode sqrt', regex: /\u221a/ },
  { name: 'Unicode degree', regex: /\u00b0/ },
  { name: 'Unicode multiply', regex: /\u00d7/ },
  { name: 'Unicode divide', regex: /\u00f7/ },
  { name: 'Unicode pi', regex: /\u03c0/ },
  { name: 'Truncated frac', regex: /\brac\{/ },
  { name: 'Truncated sqrt', regex: /\bqrt\{/ },
  { name: 'Truncated times', regex: /\bimes\b/ },
  { name: 'Word squared', regex: /\bsquared\b/ },
  { name: 'Word cubed', regex: /\bcubed\b/ },
  { name: 'Word root', regex: /\broot\(/ },
  { name: 'Word degrees', regex: /\d+\s*degrees\b/ },
];

console.log('=== SYMBOL RENDERING AUDIT ===\n');

let totalTexts = 0;
let totalWithMath = 0;
const symbolStats = {};
const warnings = [];

for (const file of files) {
  let content;
  try {
    content = readFileSync(file.path, 'utf8');
  } catch (e) {
    console.log(`Skipping ${file.name}: file not found`);
    continue;
  }
  
  const texts = extractTextFields(content);
  totalTexts += texts.length;
  
  let mathCount = 0;
  
  for (const text of texts) {
    let hasMath = false;
    for (const pattern of mathPatterns) {
      if (pattern.regex.test(text)) {
        hasMath = true;
        if (!symbolStats[pattern.name]) symbolStats[pattern.name] = 0;
        symbolStats[pattern.name]++;
      }
    }
    if (hasMath) mathCount++;
    
    // Check for potential issues
    // 1. Unmatched braces in LaTeX
    if (/\\frac\{[^}]*$/.test(text)) {
      warnings.push({ file: file.name, issue: 'Unmatched frac brace', text: text.substring(0, 80) });
    }
    // 2. Double backslash (escaped in source)
    if (/\\\\frac/.test(text)) {
      warnings.push({ file: file.name, issue: 'Double backslash frac', text: text.substring(0, 80) });
    }
  }
  
  totalWithMath += mathCount;
  console.log(`${file.name}: ${texts.length} text fields, ${mathCount} with math notation`);
}

console.log(`\nSUMMARY:`);
console.log(`  Total text fields: ${totalTexts}`);
console.log(`  Fields with math: ${totalWithMath}`);

console.log(`\nSymbol distribution:`);
for (const [name, count] of Object.entries(symbolStats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${name}: ${count}`);
}

if (warnings.length > 0) {
  console.log(`\nWARNINGS (${warnings.length}):`);
  warnings.forEach(w => {
    console.log(`  [${w.file}] ${w.issue}: "${w.text}..."`);
  });
} else {
  console.log('\nNo rendering warnings found!');
}

// Check which maths/science topics exist in the syllabus
console.log('\n=== MATHS/SCIENCE TOPICS FOR WORKSHEET GENERATION ===\n');

const syllabusContent = readFileSync('client/src/lib/syllabus-data.ts', 'utf8');
const mathsTopics = [];
const scienceTopics = [];

// Extract topics for mathematics
const mathsSection = syllabusContent.match(/mathematics:\s*\{([\s\S]*?)\n  \},/);
if (mathsSection) {
  const topicMatches = mathsSection[1].match(/topic:\s*"([^"]+)"/g);
  if (topicMatches) {
    topicMatches.forEach(m => {
      const topic = m.match(/topic:\s*"([^"]+)"/)[1];
      if (!mathsTopics.includes(topic)) mathsTopics.push(topic);
    });
  }
}

// Extract topics for science
const scienceSection = syllabusContent.match(/science:\s*\{([\s\S]*?)\n  \},/);
if (scienceSection) {
  const topicMatches = scienceSection[1].match(/topic:\s*"([^"]+)"/g);
  if (topicMatches) {
    topicMatches.forEach(m => {
      const topic = m.match(/topic:\s*"([^"]+)"/)[1];
      if (!scienceTopics.includes(topic)) scienceTopics.push(topic);
    });
  }
}

console.log(`Maths topics (${mathsTopics.length}):`);
mathsTopics.forEach(t => console.log(`  - ${t}`));
console.log(`\nScience topics (${scienceTopics.length}):`);
scienceTopics.forEach(t => console.log(`  - ${t}`));
