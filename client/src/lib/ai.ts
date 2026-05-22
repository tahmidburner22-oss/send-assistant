/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary — unauthorised copying, modification, or distribution is strictly prohibited.
 *
 * Multi-provider AI engine for Adaptly.
 * Priority order: Groq → Gemini → OpenRouter → OpenAI → Local fallback
 * API keys stored in localStorage so users can update without redeploying.
 *
 * ════════════════════════════════════════════════════════════════════════════
 * NAVIGATION INDEX (this file is ~4,500 lines — grep `// §` to jump)
 * ════════════════════════════════════════════════════════════════════════════
 *   §JSON      L121   repairTruncatedJson, parseWithFixes
 *   §KEYS      L261   AI_KEY_STORAGE, getStoredKey, setStoredKey
 *   §PROVIDERS L292   callGroq / callGemini / callOpenRouter / callOpenAI / callClaude / callHuggingFace
 *   §CALL      L479   AIProvider, AIChatMessage, callAIMessages, callAI
 *   §TYPES-WS  L629   AIWorksheetSection, AIWorksheetResult
 *   §SPEC      L746   getSpecQuestions (private prompt helper)
 *   §GENERATE  L817   aiGenerateWorksheet                        ← MAIN ENTRY POINT
 *   §CLASS-BRIEF L3446 aiGenerateWorksheetFromClassBrief (Phase A · PR-1)
 *   §STORY     L3510  aiGenerateStory
 *   §DIFF-TASK L3535  aiDifferentiateTask
 *   §EDIT      L3560  aiEditSection
 *   §REPORT    L3588  aiGenerateParentReport
 *   §DIAGRAM   L3649  aiGenerateDiagram
 *   §DIAG-WS   L3705  aiGenerateWorksheetDiagram
 *   §MCQ       L3729  aiGenerateComprehensionMCQ (+ ComprehensionMCQ)
 *   §SCAFFOLD  L3771  aiScaffoldExistingWorksheet
 *   §DIFF-WS   L3821  aiDifferentiateExistingWorksheet
 *   §NL-PARSE  L3879  parseNaturalLanguageInput
 *   §SCENARIO  L4200  aiScenarioSwap, aiScenarioSwapStory (L4342)
 *   §READAGE   L4251  aiAdjustReadingLevel, aiRewriteTextToReadingAge (L4529)
 *   §DIAG-SPEC L4396  DiagramSpec types, validateDiagramSpec, extractDiagramSpec, stripDiagramMarker
 *   §BATCH     L4572  aiBatchGenerateWorksheet
 *
 * For Phase A refactor (see .agents/tasks/phase-a-class-aware/features/FEAT-PR0.json):
 *   - Most callers import only callAI, parseWithFixes, repairTruncatedJson, aiGenerateStory,
 *     aiScenarioSwapStory, aiGenerateComprehensionMCQ, aiDifferentiateTask, parseWithFixes.
 *   - The Worksheets page additionally imports aiGenerateWorksheet, aiEditSection,
 *     aiScaffoldExistingWorksheet, aiDifferentiateExistingWorksheet, parseNaturalLanguageInput,
 *     aiScenarioSwap, aiAdjustReadingLevel.
 *   - Splitting must preserve every export name; create client/src/lib/ai/<topic>.ts files
 *     and turn this file into a barrel of re-exports.
 * ════════════════════════════════════════════════════════════════════════════
 */

// ─── Spec-aligned question banks ────────────────────────────────────────────
import { expandedMathTopics } from './mathTopicsExpanded';
import { allTopics as worksheetAllTopics } from './worksheet-generator';

// ─── Shared SEND + subject prompt fragments ─────────────────────────────────
// These two modules own the per-SEND-need adaptation rules and the
// per-subject palette / slide-structure rules that are used by BOTH the
// worksheet generator (this file) and the presentation generator
// (client/src/pages/tools/PresentationMaker.tsx). One source of truth
// prevents the two generators drifting apart and guarantees content matches.
import { getSendNoteForWorksheet, getSendSectionTitles } from './sendPromptFragments';
import { buildSubjectPromptFragments } from './subject-profiles';
import { enforceSendAdaptations } from './sendEnforcer';
// Deterministic post-generation validators — fix the specific content bugs
// teachers flagged in scrutiny reviews (multi-tick MCQ, duplicate word bank,
// irrelevant diagrams, year-group drift, overlong worked examples) even if
// the LLM slipped past the prompt rules.
import { runWorksheetPostValidators } from './worksheetPostValidator';

// FEAT-PB6 — SEND fidelity audit. Probes every worksheetRules entry for the
// pupil's SEND profile and emits a per-rule pass/fail report so teachers can
// see at a glance which adaptations actually landed.
import { applySendFidelityAudit } from './sendFidelityAudit';

// FEAT-PC8 — Maths Fluency / Reasoning / Problem-Solving (FRP) strand tagger.
// Runs after generation on maths worksheets only; classifies each question
// by command-word + structural fingerprints, stamps metadata.mathsStrandBalance,
// and surfaces warnings when the spec-mandated balance is not met.
// PR-M2 — non-blocking maths progression audit (Section A/B/C mark
// progression + Section C calculation-only command words).
import { applyMathsStrandTagging } from './mathsStrandTagger';
import { applyMathsProgressionAudit } from './mathsProgressionAudit';
// PR-M3 — Common Mistakes child-friendly format audit. Confirms each maths
// mistake block has the four labelled parts AND ≥2 numeric tokens in the
// wrong-working line. No-op for non-maths.
import { applyCommonMistakesAudit, applyCommonMistakesActiveRegenerate, type CommonMistakesRegenerator } from './commonMistakesValidator';
import { findExtract as findSourceExtract, renderExtractForPrompt } from './sourceTextLibrary';

// FEAT-PC9 — Required Practical / Working-Scientifically bank. Curated UK
// GCSE practicals with spec codes, real variables, sample data and
// common errors. Inject the matching practical into the AI prompt for
// KS4 science worksheets and stamp the chosen entry onto metadata so the
// teacher view can surface the spec reference.
import {
  formatRequiredPracticalForPrompt,
  applyRequiredPracticalTagging,
} from './requiredPractical-bank';

// FEAT-PC10 — Coverage map. Builds a teacher-only summary table for every
// Y9+ worksheet showing per-question Bloom level, command word, marks,
// best-match spec ref, and any linked misconception. Runs LAST so it sees
// the populated misconceptionLinks / requiredPractical / strand metadata.
import { applyCoverageMap } from './coverageMapBuilder';

// FEAT-PB1 — Per-question provenance stamps (specRef, AO, bloomLevel, readingAge).
// Runs after Pillar A audits to fill any remaining gaps deterministically.
import { applyQuestionProvenance } from './questionProvenance';

// FEAT-PB2 — Symbolic maths verification (CAS round-trip). Re-evaluates every
// numeric/algebraic answer with a self-contained mini-CAS. Populates
// metadata.mathsVerification and pushes mismatch warnings onto
// metadata.postValidatorWarnings. No-op for non-maths subjects.
import { applyMathsVerification } from './mathsVerifier';

// ─── Phase 1 — Curriculum-aligned structure ─────────────────────────────────
// Single source of truth for per-section question counts (7-7-5 + 1) and
// the marks → answer-lines ramp. Imported here so the prompt always asks
// the AI for the same counts the plan builder, post-validator and renderer
// expect — no more drift between literals across files.
import {
  SECTION_QUESTION_TARGETS,
  TOTAL_QUESTIONS_TARGET,
} from './worksheetSectionTargets';

// Phase 1 — UK awarding-body spec-point taxonomy. Used to inject a
// curated list of valid specRef values for the topic so the AI cannot
// invent spec codes; it must pick from the published list (or leave the
// field blank for the post-validator to fill).
import {
  getSpecPoints,
  getSpecPointsAcrossBoards,
  type ExamBoard as TaxonomyExamBoard,
} from './specPointTaxonomy';

// Phase 2 — Topic-specific Self-Reflection. Single source of truth for
// the "How Did I Do?" / "Self Reflection" content surface. Used in two
// places below: (1) the SEND-aware structured-path fallback that emits
// the section's content as part of the JSON template the AI fills in,
// and (2) — via worksheetPostValidator's enforceSelfReflectionTopicAnchor
// — to deterministically replace the section content when the AI emits
// generic placeholder text instead of topic-anchored statements.
import {
  buildSelfReflection,
  renderSelfReflectionAsMarkerBlock,
} from './selfReflectionBuilder';

// Phase 3 — Revision Tips. Single source of truth for the examiner-
// voice 5-tip panel. Imported here so:
//   (1) the structured-path emit can push deterministic builder output
//       as a worked example for the AI to match;
//   (2) the validator chain (via worksheetPostValidator) sees the same
//       canonical strings as the prompt and the renderer.
import {
  buildRevisionTips,
  renderRevisionTipsAsMarkerBlock,
} from './revisionTipsBuilder';

// ─── Phase 5 — Curriculum-authority system prompt ─────────────────────────
// Single source of truth for the worksheet system prompt's voice and
// authority layer. The preamble replaces the thin "expert UK teacher"
// opener with a properly bound (board × subject × year × topic × key
// stage) manifesto; the non-negotiables block consolidates the UK
// English / SI units / no-US-contexts / awarding-body / no-fabricated-
// codes / no-softeners rules in one labelled section; the register
// note scales tonally by key stage. Imported here so the prompt
// always asks the AI for the authority backbone the post-validator
// then enforces.
import {
  buildCurriculumAuthorityPreamble,
  buildNonNegotiablesBlock,
  buildPedagogicalRegisterNote,
} from './curriculumAuthorityPrompt';

// ─── Phase 4 — Misconception bank ──────────────────────────────────────────
// UK-curriculum misconception library. Injected into the worksheet system
// prompt so questions diagnose common pupil errors, not just test recall.
import { formatMisconceptionsForPrompt, getMisconceptionsForTopic } from './misconception-bank';

// ─── Pillar A — Exam-style questions for Year 9+ (FEAT-PA-001/002/003/004) ─
// PA#1 — AO/Paper/Calculator-aware exam-stem anchor retrieval; planner picks
// 1–2 anchor stems and seeds them as exemplars in the prompt.
// PA#2 — buildLorBlock forces a 6-mark Levelled Open Response with a 3-band
// level grid on Y10/Y11 science / humanities / English.
// PA#4 — getExamPaperTemplate replaces the generic Section 1/2/3 template
// with a real (subject, board, paper) sequence for Y10/Y11 exam-style mode.
// pillarAValidator runs the AO histogram, LOR-presence and synoptic-link
// audits *after* generation so metadata is always populated.
import { getExamStemAnchors, buildExamStemAnchorBlock } from './pastPaperQuestions';
import { buildLorBlock, buildExamPaperTemplateBlock } from './subject-profiles';
import { applyPillarAAudits } from './pillarAValidator';

// ─── Built-in keys — hardcoded server-side fallback (always available) ────────
// These are the admin keys used as fallback when no user key is provided.
// The server-side /api/ai/generate endpoint uses these from env vars directly.
const BUILT_IN_KEYS: Record<string, string> = {
  groq: "",
  gemini: "",
  openrouter: "",
  openai: "",
  claude: "",
  huggingface: "",
};

// ═══ §JSON · robust JSON parser (exported for use across the app) ══════════
/**
 * Attempt to repair a truncated JSON string by closing any open arrays/objects.
 * Returns the repaired string if it could be fixed, or null if not recoverable.
 * This handles the most common AI truncation case: running out of tokens mid-object.
 */
export function repairTruncatedJson(s: string): string | null {
  if (!s || !s.trim()) return null;
  let str = s.trim();
  // Must start with { to be a worksheet object
  if (!str.startsWith('{')) {
    const objStart = str.indexOf('{');
    if (objStart === -1) return null;
    str = str.slice(objStart);
  }
  // Close any open string — if we end mid-string, close it
  // Count unescaped quotes to detect open strings
  let inString = false;
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch === '\\' && inString) { i += 2; continue; }
    if (ch === '"') inString = !inString;
    i++;
  }
  if (inString) str += '"';
  // Remove trailing incomplete key-value (e.g. ends with , "title": )
  str = str.replace(/,\s*"[^"]*"\s*:\s*$/, '');
  str = str.replace(/,\s*$/, '');
  // Count open braces and brackets and close them
  let braces = 0, brackets = 0;
  inString = false;
  for (let j = 0; j < str.length; j++) {
    const c = str[j];
    if (c === '\\' && inString) { j++; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') braces++;
    else if (c === '}') braces--;
    else if (c === '[') brackets++;
    else if (c === ']') brackets--;
  }
  // Close unclosed arrays then objects
  for (let k = 0; k < brackets; k++) str += ']';
  for (let k = 0; k < braces; k++) str += '}';
  return str;
}

export function parseWithFixes(s: string): any {
  // Pre-process: escape LaTeX backslash sequences that JSON would misinterpret.
  // JSON treats \f as form feed (\x0c) and \t as tab (\x09), but the AI uses
  // \frac, \frown, \times, \text etc. (LaTeX commands) which must be doubled.
  const preProcess = (raw: string): string => {
    // Scan inside JSON strings and double backslashes before LaTeX-like sequences.
    // Two distinct repair classes:
    //   1) JSON-conflict escapes — \f and \t. JSON treats these as form feed / tab,
    //      but the AI uses them as the start of LaTeX commands like \frac and \times.
    //      We double the backslash only when the next char is a letter (so it really
    //      is a LaTeX command, not a deliberate control char).
    //   2) JSON-invalid escapes for math delimiters — \(, \), \[, \]. JSON.parse
    //      with these silently *drops* the backslash on tolerant browsers, so
    //      "\(b^2-4ac\)" arrives at the renderer as "(b^2-4ac)" and KaTeX never
    //      fires. We always double the backslash so the delimiters survive intact.
    // We do NOT touch \n, \r, \b because those are legitimately used as control
    // chars in JSON strings.
    const latexEscapeChars = new Set(['f', 't']);
    const mathDelimiters = new Set(['(', ')', '[', ']']);
    const out: string[] = [];
    let inStr = false;
    let i = 0;
    while (i < raw.length) {
      const ch = raw[i];
      if (!inStr) {
        if (ch === '"') inStr = true;
        out.push(ch); i++; continue;
      }
      if (ch === '\\') {
        const next = raw[i + 1];
        const afterNext = raw[i + 2];
        // Class 2: math delimiter. Always double — these are NEVER valid JSON escapes.
        if (next && mathDelimiters.has(next)) {
          out.push('\\\\'); i++; continue;
        }
        // Class 1: \f / \t followed by a letter → LaTeX command, double it.
        if (next && latexEscapeChars.has(next) && afterNext && /[a-zA-Z]/.test(afterNext)) {
          out.push('\\\\'); i++; continue;
        }
        out.push(ch); i++; continue;
      }
      if (ch === '"') { inStr = false; out.push(ch); i++; continue; }
      out.push(ch); i++;
    }
    return out.join('');
  };
  // Strategy 1: direct parse (with LaTeX pre-processing)
  try { return JSON.parse(preProcess(s)); } catch (_) {}
  // Strategy 1b: direct parse without pre-processing (fallback)
  try { return JSON.parse(s); } catch (_) {}
  // Strategy 2: fix literal control characters AND invalid backslash escapes inside strings
  const fixJsonContent = (raw: string): string => {
    const result: string[] = [];
    let inString = false;
    let i = 0;
    while (i < raw.length) {
      const ch = raw[i];
      if (!inString) {
        if (ch === '"') inString = true;
        result.push(ch);
        i++;
        continue;
      }
      if (ch === '\\') {
        const next = raw[i + 1];
        const afterNext2 = raw[i + 2];
        // LaTeX escape chars that conflict with JSON valid escapes:
        // Only handle \f (\frac) and \t (\times) — NOT \n, \r, \b which are used as real control chars.
        const latexConflicts = new Set(['f', 't']);
        if (next !== undefined && latexConflicts.has(next) && afterNext2 && /[a-zA-Z]/.test(afterNext2)) {
          // LaTeX command — double the backslash
          result.push('\\\\');
        } else if (next !== undefined && '"\\/bnrtu'.includes(next)) {
          result.push(ch);
        } else {
          result.push('\\\\');
        }
        i++;
        continue;
      }
      if (ch === '"') { inString = false; result.push(ch); i++; continue; }
      if (ch === '\n') { result.push('\\n'); i++; continue; }
      if (ch === '\r') { result.push('\\r'); i++; continue; }
      if (ch === '\t') { result.push('\\t'); i++; continue; }
      if (ch.charCodeAt(0) < 0x20) { result.push(`\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`); i++; continue; }
      result.push(ch);
      i++;
    }
    return result.join('');
  };
  const fixed = fixJsonContent(s);
  try { return JSON.parse(fixed); } catch (_) {}
  // Strategy 3: extract largest JSON object/array with regex
  const objMatch = fixed.match(/\{[\s\S]*\}/);
  if (objMatch) { try { return JSON.parse(objMatch[0]); } catch (_) {} }
  const arrMatch = fixed.match(/\[[\s\S]*\]/);
  if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch (_) {} }
  throw new Error('parseWithFixes: all strategies failed');
}

// ═══ §KEYS · key storage helpers ═══════════════════════════════════════════
export const AI_KEY_STORAGE = {
  groq: "adaptly_groq_key",
  gemini: "adaptly_gemini_key",
  openrouter: "adaptly_openrouter_key",
  openai: "adaptly_openai_key",
  claude: "adaptly_claude_key",
  huggingface: "adaptly_huggingface_key",
};

export function getStoredKey(provider: keyof typeof AI_KEY_STORAGE): string {
  try {
    const stored = localStorage.getItem(AI_KEY_STORAGE[provider]);
    return stored || BUILT_IN_KEYS[provider] || "";
  } catch {
    return BUILT_IN_KEYS[provider] || "";
  }
}

export function setStoredKey(provider: keyof typeof AI_KEY_STORAGE, key: string) {
  try {
    if (key.trim()) {
      localStorage.setItem(AI_KEY_STORAGE[provider], key.trim());
    } else {
      localStorage.removeItem(AI_KEY_STORAGE[provider]);
    }
  } catch {
    // localStorage not available in this context
  }
}

// ═══ §PROVIDERS · provider implementations ═════════════════════════════════

async function callGroq(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const key = getStoredKey("groq");
  if (!key) throw new Error("No Groq API key configured");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty response");
  return content as string;
}

async function callGemini(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const key = getStoredKey("gemini");
  if (!key) throw new Error("No Gemini API key configured");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Gemini returned empty response");
  return content as string;
}

async function callOpenRouter(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const key = getStoredKey("openrouter");
  if (!key) throw new Error("No OpenRouter API key configured");
  // Updated to currently-available free models (verified March 2026)
  const models = [
    "nvidia/nemotron-nano-9b-v2:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
    "arcee-ai/trinity-mini:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
  ];
  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://adaptly.co.uk",
          "X-Title": "Adaptly Adaptly",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content as string;
    } catch {
      continue;
    }
  }
  throw new Error("All OpenRouter models failed");
}

async function callOpenAI(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const key = getStoredKey("openai");
  if (!key) throw new Error("No OpenAI API key configured");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty response");
  return content as string;
}

async function callClaude(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const key = getStoredKey("claude");
  if (!key) throw new Error("No Claude API key configured");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude ${res.status}: ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data?.content?.[0]?.text;
  if (!content) throw new Error("Claude returned empty response");
  return content as string;
}

async function callHuggingFace(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const key = getStoredKey("huggingface");
  if (!key) throw new Error("No HuggingFace API key configured");
  // Updated to new HuggingFace Router endpoint (api-inference.huggingface.co deprecated)
  const models = [
    "Qwen/Qwen2.5-72B-Instruct",
    "meta-llama/Llama-3.1-8B-Instruct",
    "HuggingFaceH4/zephyr-7b-beta",
  ];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://router.huggingface.co/hf-inference/models/${model}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: maxTokens,
            temperature: 0.7,
          }),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content as string;
    } catch {
      continue;
    }
  }
  throw new Error("HuggingFace: all models failed");
}

// ═══ §CALL · main fallback chain ═══════════════════════════════════════════

export type AIProvider = "groq" | "gemini" | "openrouter" | "openai" | "claude" | "huggingface";

// ─── Messages-array variant ──────────────────────────────────────────────────
// Some tools (e.g. the Presentation Maker refinement flow) need multi-turn
// conversation history so the AI can remember context across "refine slide N"
// requests. `callAI` still takes (system, user, maxTokens) for every other
// caller — `callAIMessages` is a thin parallel surface that accepts a full
// messages array and routes it through the same server endpoint. The server
// already accepts a `messages` array, so no server change is needed.
export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callAIMessages(
  messages: AIChatMessage[],
  maxTokens = 2000,
  opts?: { responseFormat?: "json_object" | "text" },
): Promise<{ text: string; provider: AIProvider }> {
  // Derive (systemPrompt, userPrompt) for the single-prompt providers in the
  // fallback branch. System = all system messages concatenated. User =
  // concatenation of every subsequent turn rendered as "USER: …" / "ASSISTANT: …".
  const systemParts = messages.filter(m => m.role === "system").map(m => m.content);
  const conversation = messages.filter(m => m.role !== "system");
  const systemPrompt = systemParts.join("\n\n");
  const userPrompt = conversation
    .map(m => (m.role === "user" ? `USER: ${m.content}` : `ASSISTANT: ${m.content}`))
    .join("\n\n");

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    // Bumped from 55s → 90s — see callAI() for rationale. Keeps both paths in sync.
    const timeoutId = controller ? window.setTimeout(() => controller.abort(), 90000) : null;
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: controller?.signal,
      // Send BOTH shapes so the server can use messages[] (preferred) but
      // falls back to prompt/systemPrompt for older server builds.
      body: JSON.stringify({
        messages,
        prompt: userPrompt,
        systemPrompt,
        maxTokens,
        ...(opts?.responseFormat ? { responseFormat: opts.responseFormat } : {}),
      }),
    });
    if (timeoutId) window.clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const content = data.content || data.text;
      if (content) return { text: content, provider: (data.provider || "groq") as AIProvider };
    }
    if (res.status === 401 || res.status === 403) {
      const errData = await res.json().catch(() => ({})) as any;
      throw new Error(`AUTH_REQUIRED: ${errData?.error || "Session expired. Please log in again."}`);
    }
    if (res.status === 503) {
      const errData = await res.json().catch(() => ({})) as any;
      if (errData?.noKeysConfigured) throw new Error(errData.error || "No AI provider keys configured.");
    }
  } catch (serverErr: any) {
    if (serverErr?.message?.startsWith('AUTH_REQUIRED') || serverErr?.message?.includes("No AI provider keys configured")) {
      throw serverErr;
    }
    console.warn("[Adaptly AI] callAIMessages server error:", serverErr?.message);
  }
  // Client-keys fallback: collapses the conversation into a single prompt.
  return callAI(systemPrompt, userPrompt, maxTokens, opts);
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000,
  opts?: { responseFormat?: "json_object" | "text" },
): Promise<{ text: string; provider: AIProvider }> {
  // Primary: route through server so admin API keys are used automatically for all users
  try {
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    // Bumped from 55s → 90s so Extended-difficulty / long worksheets don't get
    // killed mid-fallback. The server cycles through up to ~14 providers each
    // with their own 12–20s timeout; with cooldowns the realistic worst-case
    // is ~70s. 90s gives the chain enough headroom to finish before the
    // client aborts. (Audit fix: "Groq Timeouts on Extended difficulty".)
    const timeoutMs = 90000;
    const timeoutId = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: reqHeaders,
      credentials: "include",
      signal: controller?.signal,
      // Server expects 'prompt' (not 'userPrompt') per the /api/ai/generate endpoint
      body: JSON.stringify({
        prompt: userPrompt,
        systemPrompt,
        maxTokens,
        ...(opts?.responseFormat ? { responseFormat: opts.responseFormat } : {}),
      }),
    });
    if (timeoutId) window.clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      // Server returns 'content' field (not 'text') — fix the field name
      const content = data.content || data.text;
      if (content) {
        return { text: content, provider: (data.provider || "groq") as AIProvider };
      }
    }
    // Handle 401/403 — session expired or not authenticated
    // This MUST throw immediately — do NOT silently fall through to empty client keys
    // NOTE: Do NOT redirect here — the caller (Worksheets.tsx) handles AUTH_REQUIRED
    // errors and shows a toast without destroying the page. A redirect here would
    // lose any partially-generated content and is jarring for the teacher.
    if (res.status === 401 || res.status === 403) {
      const errData = await res.json().catch(() => ({})) as any;
      const msg = errData?.error || (res.status === 401 ? 'Session expired. Please log in again.' : 'Access denied.');
      throw new Error(`AUTH_REQUIRED: ${msg}`);
    }
    // If server says no keys configured, throw immediately — don't silently fall back
    if (res.status === 503) {
      const errData = await res.json().catch(() => ({})) as any;
      if (errData?.noKeysConfigured) {
        throw new Error(errData.error || "No AI provider keys configured for your school. Please go to Settings → AI Providers to add your API keys.");
      }
    }
    // For other server errors, log and fall through to client keys
    const errText = await res.text().catch(() => "");
    console.warn(`[Adaptly AI] Server error ${res.status}:`, errText.slice(0, 200));
  } catch (serverErr: any) {
    // Re-throw auth errors and no-keys-configured errors — these need to reach the UI
    if (serverErr?.message?.startsWith('AUTH_REQUIRED') ||
        serverErr?.message?.includes("No AI provider keys configured") ||
        serverErr?.message?.includes("Settings → AI Providers")) {
      throw serverErr;
    }
    if (serverErr?.name === "AbortError") {
      console.warn("[Adaptly AI] Server generation timed out, using client keys fallback.");
    } else {
      console.error("[Adaptly AI DEBUG] Server route error:", serverErr?.name, serverErr?.message, serverErr);
      console.warn("[Adaptly AI] Server route unavailable, using client keys:", serverErr);
    }
  }
  // Fallback: locally stored keys (offline / dev)
  const order: AIProvider[] = ["groq", "gemini", "openrouter", "openai", "claude", "huggingface"];
  const errors: string[] = [];
  for (const provider of order) {
    const key = getStoredKey(provider as keyof typeof AI_KEY_STORAGE);
    if (!key) { errors.push(`${provider}: no key`); continue; }
    try {
      let text: string;
      if (provider === "groq") text = await callGroq(systemPrompt, userPrompt, maxTokens);
      else if (provider === "gemini") text = await callGemini(systemPrompt, userPrompt, maxTokens);
      else if (provider === "openrouter") text = await callOpenRouter(systemPrompt, userPrompt, maxTokens);
      else if (provider === "claude") text = await callClaude(systemPrompt, userPrompt, maxTokens);
      else if (provider === "huggingface") text = await callHuggingFace(systemPrompt, userPrompt, maxTokens);
      else text = await callOpenAI(systemPrompt, userPrompt, maxTokens);
      return { text, provider };
    } catch (e: unknown) {
      errors.push(`${provider}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(`All AI providers failed:\n${errors.join("\n")}`);
}

// ═══ §TYPES-WS · worksheet generation types ════════════════════════════════

export interface AIWorksheetSection {
  title: string;
  content: string;
  type: string;
  teacherOnly?: boolean;
  svg?: string;      // inline SVG markup for diagram sections
  caption?: string;  // diagram caption
}

export interface AIWorksheetResult {
  title: string;
  subtitle: string;
  sections: AIWorksheetSection[];
  metadata: {
    subject?: string;
    topic?: string;
    yearGroup?: string;
    difficulty: string;
    examBoard?: string;
    totalMarks?: number;
    estimatedTime?: string;
    adaptations: string[];
    /** Phase 4 / FEAT-002 — misconception IDs the AI deliberately targeted in this worksheet. */
    misconceptionsTargeted?: string[];
    /** FEAT-PB7 — per-MCQ misconception linkage (one entry per diagnosed distractor). */
    misconceptionLinks?: Array<{
      sectionIndex: number;
      sectionTitle?: string;
      distractor: string;
      misconceptionId: string;
    }>;
    /** FEAT-PB6 — per-rule SEND adaptation fidelity report. */
    sendFidelityReport?: {
      sendNeedId: string;
      sendNeedName: string;
      rules: Array<{
        ruleIndex: number;
        rule: string;
        status: "applied" | "missing" | "not-checked";
        evidence?: string;
      }>;
      appliedCount: number;
      totalCount: number;
      fidelityRatio: number;
      warnings: string[];
    };
    /** FEAT-PC8 — Fluency / Reasoning / Problem-Solving balance audit (maths only). */
    mathsStrandBalance?: {
      assignments: Array<{
        sectionIndex: number;
        sectionTitle?: string;
        sectionType?: string;
        strand: "fluency" | "reasoning" | "problem_solving";
        evidence: string;
      }>;
      counts: Record<"fluency" | "reasoning" | "problem_solving", number>;
      targets: Record<"fluency" | "reasoning" | "problem_solving", number>;
      totalQuestions: number;
      meetsTarget: boolean;
      warnings: string[];
    };
    /** FEAT-PC9 — KS4 Required Practical / Working-Scientifically anchor (science only). */
    requiredPractical?: {
      id: string;
      title: string;
      specCode: string;
      wsSkills: string[];
      detected: boolean;
      evidence?: string;
    };
    /** FEAT-PC10 — per-question coverage map (Y9+ only). */
    coverageMap?: {
      rows: Array<{
        qNum: number;
        sectionIndex: number;
        sectionTitle?: string;
        sectionType?: string;
        marks: number;
        bloom: "recall" | "understanding" | "application" | "challenge" | "uncategorised";
        commandWord: string;
        specRef: string;
        misconceptionIds: string[];
      }>;
      totalQuestions: number;
      totalMarks: number;
      bloomDistribution: Record<"recall" | "understanding" | "application" | "challenge" | "uncategorised", number>;
      commandWords: string[];
      subject?: string;
      yearGroup?: string;
      topic?: string;
    };
    // ── Pillar A — Exam-style questions for Year 9+ ────────────────────────
    /** PA#1 — UK GCSE paper code (P1/P2/P3). */
    paper?: "P1" | "P2" | "P3";
    /** PA#1 — calculator allowed on the source paper. */
    calculator?: boolean;
    /** PA#1 — Assessment Objective histogram. Counts every question on the sheet. */
    aoHistogram?: Record<"AO1" | "AO2" | "AO3" | "AO4", number>;
    /** PA#2 — flag set by assertLorPresent (Y10/Y11 sci/hum/Eng only). */
    lorPresent?: boolean;
    lorMarks?: number;
    lorBands?: string[];
    /** PA#3 — synoptic question links to prior topics. */
    synopticLinks?: Array<{ sectionIndex: number; priorTopic: string; sectionTitle?: string }>;
    /** PA#3 — prior topics injected into the prompt (echoed for the renderer). */
    priorTopics?: string[];
    /** PA#4 — exam-paper template key, e.g. "aqa:english_lang:P1". */
    examPaperTemplate?: string;
    /** Pillar A — non-blocking warnings raised by the post-validators. */
    postValidatorWarnings?: string[];
    /** FEAT-PB2 — symbolic maths verification (CAS round-trip) report. */
    mathsVerification?: {
      perQuestion: Array<{
        sectionIndex: number;
        sectionTitle?: string;
        kind: "numeric" | "expression" | "equation" | "unknown";
        raw: string;
        expected: string;
        status: "ok" | "mismatch" | "unverified";
        cas?: string;
        reason?: string;
      }>;
      counts: { ok: number; mismatch: number; unverified: number };
      ranAt?: string;
      durationMs?: number;
    };
  };
  isAI: true;
  provider?: string;
}

// ═══ §SPEC · spec-aligned question injection helper ═══════════════════════
/**
 * Returns a block of real specification-aligned example questions for the given
 * subject + topic, formatted for injection into the AI system prompt as few-shot
 * quality benchmarks. Falls back to an empty string if no data is available.
 */
function getSpecQuestions(subject: string, topic: string): string {
  const subjectKey = subject.toLowerCase().replace(/[^a-z]/g, '');
  // Normalise topic to a lookup key: lowercase, spaces→hyphens, strip apostrophes
  const topicKey = topic.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Try maths-specific banks first (expandedMathTopics has richer content)
  let topicData: any = null;
  if (subjectKey.includes('math')) {
    topicData = (expandedMathTopics as Record<string, any>)[topicKey] || null;
  }
  // Fall back to the merged allTopics bank (covers maths, english, science, history, geography)
  if (!topicData) {
    const subjectBank = worksheetAllTopics[subjectKey] || worksheetAllTopics['mathematics'];
    if (subjectBank) topicData = subjectBank[topicKey] || null;
  }
  if (!topicData) return '';

  const lines: string[] = [];
  lines.push('=== SPECIFICATION-ALIGNED EXAMPLE QUESTIONS (use these as your quality benchmark) ===');
  lines.push(`Topic: ${topicData.title || topic}`);
  if (topicData.objective) lines.push(`Learning Objective: ${topicData.objective}`);
  lines.push('');

  // Worked example
  if (topicData.example) {
    lines.push('WORKED EXAMPLE:');
    if (topicData.example.question) lines.push(`Q: ${topicData.example.question}`);
    if (Array.isArray(topicData.example.steps)) {
      topicData.example.steps.forEach((s: string) => lines.push(s));
    }
    lines.push('');
  }

  // Guided questions (Section 1 style)
  if (Array.isArray(topicData.guided) && topicData.guided.length > 0) {
    lines.push('SECTION 1 — GUIDED QUESTIONS (scaffolded, lower-stakes):');
    topicData.guided.slice(0, 4).forEach((item: any) => {
      lines.push(`• ${item.q}  [${item.marks} mark${item.marks !== 1 ? 's' : ''}]  Answer: ${item.a}`);
    });
    lines.push('');
  }

  // Independent questions (Section 2/3 style)
  if (Array.isArray(topicData.independent) && topicData.independent.length > 0) {
    lines.push('SECTION 2/3 — INDEPENDENT QUESTIONS (exam-style, increasing difficulty):');
    topicData.independent.slice(0, 6).forEach((item: any) => {
      lines.push(`• ${item.q}  [${item.marks} mark${item.marks !== 1 ? 's' : ''}]  Answer: ${item.a}`);
    });
    lines.push('');
  }

  // Challenge
  if (topicData.challenge) {
    lines.push('CHALLENGE QUESTION:');
    lines.push(`• ${topicData.challenge}`);
    if (topicData.challengeAnswer) lines.push(`  Answer: ${topicData.challengeAnswer}`);
    lines.push('');
  }

  lines.push('=== END OF SPECIFICATION EXAMPLES ===');
  lines.push('INSTRUCTION: Generate questions of EQUAL or HIGHER quality than the examples above.');
  lines.push('Match the exact style: numbered, mark-allocated, exam-board language, no trivial questions.');
  return lines.join('\n');
}

// ═══ §GENERATE · aiGenerateWorksheet — MAIN WORKSHEET ENTRY POINT ═════════
export async function aiGenerateWorksheet(params: {
  subject: string;
  topic: string;
  yearGroup: string;
  sendNeed?: string;
  difficulty?: string;
  examBoard?: string;
  includeAnswers?: boolean;
  additionalInstructions?: string;
  examStyle?: boolean;
  diagramType?: string;
  generateDiagram?: boolean;  // alias for diagramType — true enables diagram generation
  worksheetLength?: string;
  introOnly?: boolean; // When true, only generate intro sections (objectives, vocab, worked example) — used for hybrid exam mode
  recallTopic?: string; // When set, prepend 2-3 recall questions on this previous topic at the start of the worksheet
  targetPages?: number; // Target number of printed A4 pages (any positive integer, 0 = auto)
  readingAge?: number; // Target reading age (5–17) — controls vocabulary and sentence complexity
  isRevisionMat?: boolean; // When true, generate a revision mat instead of a standard worksheet
  selectedSections?: string[]; // Which sections to include (from the sections selector)
  subtopic?: string; // Optional subtopic for more specific generation
  // ── Pillar A — Exam-style questions for Year 9+ ─────────────────────────
  /** PA#1 — UK GCSE paper code: P1 (typically non-calc maths) / P2 / P3. */
  paper?: "P1" | "P2" | "P3";
  /** PA#1 — calculator allowed on this paper? Maths P1 = false; P2/P3 = true. */
  calculator?: boolean;
  /** PA#3 — 1–3 prior topics to interleave as synoptic questions. Replaces
   *  recallTopic on Y10/Y11 sheets; recallTopic still works for KS3. */
  priorTopics?: string[];
}): Promise<AIWorksheetResult> {

  // ── REVISION MAT: completely separate prompt path ─────────────────────────
  if (params.isRevisionMat) {
    const rmSystem = `You are an expert UK teacher creating a GCSE revision mat. You respond with valid raw JSON only — no markdown, no code blocks, no HTML. Every rule below is mandatory.`;

    const rmUser = `Create a revision mat for: Subject: ${params.subject} | Year: ${params.yearGroup} | Topic: ${params.topic}

Return EXACTLY this JSON structure (raw JSON only, no markdown fences):
{
  "title": "${params.topic} — ${params.yearGroup} ${params.subject} Worksheet",
  "sections": [
    {
      "type": "revision-mat-title",
      "title": "",
      "content": "[TOPIC NAME]\nLO: Students will be able to [one clear learning objective].\nKey Vocabulary:\n[Term 1] — [brief definition]\n[Term 2] — [brief definition]\n[Term 3] — [brief definition]\n[Term 4] — [brief definition]\n[Term 5] — [brief definition]"
    },
    { "type": "revision-mat-box", "title": "", "marks": 1, "content": "[COMPLETE 1-mark question — define/state/name/true-false/fill-blank/MCQ]" },
    { "type": "revision-mat-box", "title": "", "marks": 1, "content": "[COMPLETE 1-mark question — different type from above]" },
    { "type": "revision-mat-box", "title": "", "marks": 1, "content": "[COMPLETE 1-mark MCQ: stem\na. option\nb. option\nc. option\nd. option]" },
    { "type": "revision-mat-box", "title": "", "marks": 1, "content": "[COMPLETE 1-mark true/false: statement\nTrue / False]" },
    { "type": "revision-mat-box", "title": "", "marks": 2, "content": "[COMPLETE 2-mark question — name two / give two examples / explain briefly]" },
    { "type": "revision-mat-box", "title": "", "marks": 2, "content": "[COMPLETE 2-mark match-up:\nTerm 1 | Definition 1\nTerm 2 | Definition 2\nTerm 3 | Definition 3\nTerm 4 | Definition 4]" },
    { "type": "revision-mat-box", "title": "", "marks": 2, "content": "[COMPLETE 2-mark question — describe/explain briefly]" },
    { "type": "revision-mat-box", "title": "", "marks": 3, "content": "[COMPLETE 3-mark question — describe with three points or explain with reason]" },
    { "type": "revision-mat-box", "title": "", "marks": 3, "content": "[COMPLETE 3-mark question — compare, give three examples, or explain a process]" },
    { "type": "revision-mat-box", "title": "", "marks": 4, "content": "[COMPLETE 4-mark question — extended describe/explain, include [4 marks] at end]" },
    { "type": "revision-mat-box", "title": "", "marks": 4, "content": "[COMPLETE 4-mark question — analyse or apply to a scenario, include [4 marks] at end]" },
    { "type": "revision-mat-box", "title": "", "marks": 6, "content": "Challenge: [COMPLETE 6-mark extended response question — evaluate, assess, or discuss. Include [6 marks] at end.]" },
    { "type": "mark-scheme", "title": "Mark Scheme", "teacherOnly": true, "content": "[mark scheme for all 12 questions]" }
  ],
  "metadata": {
    "subject": "${params.subject}",
    "topic": "${params.topic}",
    "yearGroup": "${params.yearGroup}"
  }
}

MANDATORY RULES — violating any rule is wrong:
1. The revision-mat-title section content MUST start with the topic name on line 1, then "LO: " on line 2, then "Key Vocabulary:" on line 3, then 5 vocab terms (one per line, format: Term — definition). NO asterisks, NO markdown.
2. Generate EXACTLY 12 revision-mat-box sections with marks: 1,1,1,1,2,2,2,3,3,4,4,6.
3. Every question must be COMPLETE and make sense on its own. Never truncate. Never use placeholders.
4. MCQ questions: question stem + all 4 options (a. b. c. d.) in the SAME content field, total max 5 lines.
5. True/False questions: statement on line 1 (max 15 words), then "True / False" on line 2.
6. NO asterisks (*) anywhere. NO markdown. NO section headings. title field is always "" for question boxes.
7. Every question must be specifically about "${params.topic}" — no generic or off-topic questions.
8. NO answers in question boxes — only questions that students answer.
9. QUESTION LENGTH LIMITS (boxes are small — keep questions concise):
   - 1-mark boxes: max 20 words for the question stem. MCQ: stem max 15 words + 4 short options (max 5 words each).
   - 2-mark boxes: max 25 words. Match-up: max 4 pairs, each term/definition max 6 words.
   - 3-mark boxes: max 30 words.
   - 4-mark boxes: max 35 words (these boxes are wider and taller).
   - 6-mark box: max 40 words (this box is the largest).
10. Every vocab definition in the title section must be max 8 words.`;

    const { text: rmText, provider: rmProvider } = await callAI(rmSystem, rmUser, 3500, { responseFormat: "json_object" });
    const rmCleaned = rmText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    let rmJson: any;
    try {
      rmJson = parseWithFixes(rmCleaned);
    } catch (_) {
      const repaired = repairTruncatedJson(rmCleaned);
      if (repaired) {
        try { rmJson = parseWithFixes(repaired); } catch { throw new Error('Revision mat JSON parse failed'); }
      } else {
        throw new Error('Revision mat JSON parse failed');
      }
    }
    // Strip asterisks from all content
    if (rmJson.sections && Array.isArray(rmJson.sections)) {
      rmJson.sections = rmJson.sections.map((s: any) => ({
        ...s,
        title: typeof s.title === 'string' ? s.title.replace(/\*/g, '').trim() : s.title,
        content: typeof s.content === 'string' ? s.content.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*/g, '').trim() : s.content,
      }));

      // ── Revision Mat Diagram Lookup ──
      // Pull a diagram from the library instantly for the revision mat
      try {
        const diagResult = await aiGenerateWorksheetDiagram({
          subject: params.subject,
          topic: params.topic,
          yearGroup: params.yearGroup,
          sendNeed: params.sendNeed
        });
        if (diagResult) {
          // Inject as a diagram section
          rmJson.sections.push({
            ...diagResult,
            type: "diagram",
            isFullPage: true // Hint for the renderer
          });
        }
      } catch (diagErr) {
        console.warn("[RevisionMat] Diagram lookup failed:", diagErr);
      }
    }
    return { ...rmJson, isAI: true, provider: rmProvider };
  }
  // ── Subject flags (declared early so they can be used in template literals below) ──
  const isMaths = params.subject.toLowerCase().includes("math");
  const subjectLowerFlag = params.subject.toLowerCase();
  const isHumanities = [
    "english", "history", "geography", "religious", "re", "rs", "pshe", "citizenship",
    "media", "drama", "art", "music", "philosophy", "sociology", "psychology", "economics",
    "politics", "law", "business", "french", "spanish", "german", "languages", "latin",
  ].some(h => subjectLowerFlag.includes(h));
  const isSTEM = !isHumanities;

  // ── Subject-specific classification flags ────────────────────────────────────
  const isEnglishLang = subjectLowerFlag.includes("english language") || (subjectLowerFlag.includes("english") && !subjectLowerFlag.includes("literature"));
  const isEnglishLit = subjectLowerFlag.includes("english literature") || subjectLowerFlag.includes("literature");
  const isBiology = subjectLowerFlag.includes("biology") || subjectLowerFlag.includes("bio");
  const isChemistry = subjectLowerFlag.includes("chemistry") || subjectLowerFlag.includes("chem");
  const isPhysics = subjectLowerFlag.includes("physics") || subjectLowerFlag.includes("phys");
  const isScience = isBiology || isChemistry || isPhysics || subjectLowerFlag.includes("science");
  const isHistory = subjectLowerFlag.includes("history");
  const isGeography = subjectLowerFlag.includes("geography") || subjectLowerFlag.includes("geog");
  const isRS = subjectLowerFlag.includes("religious") || subjectLowerFlag.includes(" re ") || subjectLowerFlag === "re" || subjectLowerFlag === "rs" || subjectLowerFlag.includes(" rs ");
  const isCS = subjectLowerFlag.includes("computer science") || subjectLowerFlag.includes("computing");
  const isBusiness = subjectLowerFlag.includes("business") || subjectLowerFlag.includes("economics");
  const isMFL = subjectLowerFlag.includes("french") || subjectLowerFlag.includes("spanish") || subjectLowerFlag.includes("german") || subjectLowerFlag.includes("mfl") || subjectLowerFlag.includes("languages");

  // ── Year-group calibration ──────────────────────────────────────────────────
  // Parse the year number from strings like "Year 1", "Year 5", "Year 10", "Year 13"
  const is11Plus = (params.yearGroup || "").toLowerCase().includes("11+") || (params.yearGroup || "").toLowerCase().includes("eleven plus");
  const yearNum = is11Plus ? 6 : (parseInt((params.yearGroup || "").replace(/[^0-9]/g, ""), 10) || 7);

  // ── FEAT-PB5 — stem-preserving SEND mode ──────────────────────────────────
  // For exam-style worksheets at Year 9 and above the SEND adaptations must
  // never mutate question stems. We pass this flag to enforceSendAdaptations
  // so it skips question-content rewrites and to the prompt builder so the
  // LLM is told to keep the stem text unchanged. Section TITLE renames and
  // additive support boxes (sentence frames in the margin, key-formula
  // panels, larger answer-line height) are still permitted; the protected
  // surface is the question text and command words.
  const preserveStemsForSend = Boolean(params.examStyle) && yearNum >= 9;

  // Key Stage and phase
  const phase = is11Plus ? "11+ Preparation (ages 9–11, KS2 level)" :
    yearNum <= 2  ? "KS1 (ages 5–7)" :
    yearNum <= 6  ? "KS2 (ages 7–11)" :
    yearNum <= 9  ? "KS3 (ages 11–14)" :
    yearNum <= 11 ? "KS4 / GCSE (ages 14–16)" :
                   "KS5 / A-Level (ages 16–18)";

  // Sentence complexity guidance
  const sentenceGuide =
    yearNum <= 2  ? "Use very short sentences (5–8 words). Simple CVC and common sight words only. One idea per sentence." :
    yearNum <= 4  ? "Use short, clear sentences (8–12 words). Everyday vocabulary. Avoid technical jargon unless introducing it with a definition." :
    yearNum <= 6  ? "Use clear sentences (10–15 words). Introduce subject-specific vocabulary with brief definitions. Concrete examples preferred." :
    yearNum <= 8  ? "Use moderate complexity (12–18 words). Introduce technical vocabulary. Some abstract concepts with concrete anchors." :
    yearNum <= 9  ? "Use KS3-level academic language. Technical vocabulary expected. Multi-clause sentences acceptable." :
    yearNum <= 11 ? "Use GCSE-level academic language. Subject-specific terminology expected. Command words (describe, explain, evaluate, analyse) used precisely." :
                   "Use A-Level academic register. Sophisticated vocabulary, nuanced arguments, synoptic links expected.";

  // Vocabulary complexity
  const vocabGuide =
    yearNum <= 2  ? "Vocabulary: 3–4 very simple words (e.g. 'add', 'take away', 'shape'). One-word definitions." :
    yearNum <= 4  ? "Vocabulary: 4–5 accessible words with simple definitions. Avoid Latin/Greek roots." :
    yearNum <= 6  ? "Vocabulary: 5–6 subject words. Definitions in plain English. Include a visual example where helpful." :
    yearNum <= 8  ? "Vocabulary: 6–7 subject-specific terms. Definitions should be accurate but accessible." :
    yearNum <= 9  ? "Vocabulary: 7–8 technical terms. Definitions should match KS3 textbook level." :
    yearNum <= 11 ? "Vocabulary: 8–10 GCSE-level technical terms. Definitions should match mark-scheme language." :
                   "Vocabulary: 10–12 A-Level terms including Latin/Greek roots where relevant. Definitions should be precise and exam-board aligned.";

  // Question depth and cognitive demand (Bloom's taxonomy)
  const questionGuide =
    yearNum <= 2  ? "Questions: Recall and recognition only. 'What is…?', 'Circle the…', 'Draw a…'. Max 1 mark each. Total worksheet ≤ 15 marks." :
    yearNum <= 4  ? "Questions: Recall and simple application. Short answers. Max 2 marks each. Total worksheet ≤ 20 marks." :
    yearNum <= 6  ? "Questions: Recall, comprehension, and simple application. Short and medium answers. Max 3 marks each. Total worksheet ≤ 25 marks." :
    yearNum <= 8  ? "Questions: Recall, application, and some analysis. Mix of short (1–2 marks) and medium (3–4 marks). Total worksheet ≤ 35 marks." :
    yearNum <= 9  ? "Questions: Application, analysis, and some evaluation. Mix of 2–5 mark questions. Include one 6-mark extended answer. Total ≤ 40 marks." :
    yearNum <= 11 ? "Questions: GCSE-style — application, analysis, evaluation. Include 1-mark, 2-mark, 4-mark, and 6-mark questions. Use command words precisely. Total ≤ 50 marks." :
                   "Questions: A-Level style — analysis, evaluation, synthesis. Include short (4 marks), medium (8 marks), and extended (12+ marks) questions. Total ≤ 60 marks.";

  // Worked example complexity
  // IMPORTANT: ONLY the main steps are numbered in the rendered worksheet.
  // Sub-steps (indented explanatory lines beneath a main step) must be
  // indented with two spaces and must NOT have a leading number. The frontend
  // parser treats any line with >= 2 leading spaces OR bullet/letter markers
  // as a sub-step that sits underneath the preceding numbered step.
  const stepFormatRule = [
    "Format each worked example as follows:",
    "  'Step 1: <main action>' (numbered)",
    "    <any sub-step text indented with 2 spaces, no number>",
    "    <another sub-step indented with 2 spaces>",
    "  'Step 2: <next main action>' (numbered)",
    "    <indented sub-step>",
    "End with 'Answer: <final answer>'.",
    "Do NOT put a number on sub-steps. Number ONLY the main steps."
  ].join('\n');
  const exampleGuide =
    yearNum <= 2  ? `Worked example: Very simple, 2–3 main steps maximum. Use pictures or number lines if relevant. ${stepFormatRule}` :
    yearNum <= 6  ? `Worked example: Clear 3–4 main step example. Use diagrams or visual aids where helpful. Annotate each step with indented sub-steps. ${stepFormatRule}` :
    yearNum <= 9  ? `Worked example: Detailed 4–6 main step example showing full method. Indent sub-step annotations. Include common mistakes to avoid. ${stepFormatRule}` :
    yearNum <= 11 ? `Worked example: Full exam-style worked solution. Show all method marks across 4–6 numbered main steps, with indented sub-steps for working. Include examiner tips. ${stepFormatRule}` :
                   `Worked example: A-Level standard worked solution. Show all numbered main steps (5–7), justify each stage with indented sub-step notes, reference relevant theory. ${stepFormatRule}`;

  // Challenge section calibration
  const challengeGuide =
    yearNum <= 2  ? "Challenge: A simple extension activity (e.g. 'Can you make your own example?'). 1–2 marks." :
    yearNum <= 6  ? "Challenge: A problem-solving task slightly above expected level. 3–4 marks." :
    yearNum <= 9  ? "Challenge: A multi-step problem requiring application to a new context. 5–6 marks." :
    yearNum <= 11 ? "Challenge: A GCSE-style evaluation or 'discuss' question. 6–8 marks." :
                   "Challenge: A synoptic A-Level question requiring links across topics. 12–15 marks.";

  // Timing
  const timingGuide =
    yearNum <= 6  ? "Estimated time: 20–30 mins" :
    yearNum <= 9  ? "Estimated time: 35–45 mins" :
    yearNum <= 11 ? "Estimated time: 45–60 mins" :
                   "Estimated time: 60–90 mins";

  // ── Question layout rotation system (smart, context-aware) ───────────────
  // Deterministic seed from topic so same topic always gets same variant.
  // New question types (error_correction, ranking, what_changed, constraint_problem)
  // are selected based on topic/subject relevance — never forced.
  const topicSeed = Math.abs(
    params.topic.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  );
  const topicLower = params.topic.toLowerCase();
  const subjectLower = (params.subject || "").toLowerCase();

  // ── Relevance scoring for context-aware question types ────────────────────
  // Returns true if the topic/subject makes this question type a natural fit
  const isRelevant = {
    ERROR_CORRECTION: (
      // Great for STEM topics with calculations, common misconceptions
      isSTEM ||
      /calculat|formula|equation|method|working|proof|solve|error|mistake|misconception|ohm|newton|force|energy|speed|circuit|reaction|titrat|algebra|trigon|fraction|decimal|percent/i.test(topicLower)
    ),
    RANKING: (
      // Great for comparison topics, scales, hierarchies
      /rank|order|compar|scale|hierarch|priorit|greatest|smallest|highest|lowest|most|least|stronger|weaker|reactiv|conduct|resist|density|speed|temperature|timeline|chronolog|import|significant/i.test(topicLower) ||
      /science|physics|chemistry|biology|history|geography|economics/i.test(subjectLower)
    ),
    WHAT_CHANGED: (
      // Great for cause-effect, before/after, change-over-time topics
      /chang|effect|impact|cause|before|after|result|consequence|evolution|transform|react|process|cycle|growth|decay|war|revolution|industri|climate|adapt|mutation|circuit|variable/i.test(topicLower) ||
      /science|physics|chemistry|biology|history|geography/i.test(subjectLower)
    ),
    CONSTRAINT_PROBLEM: (
      // Great for design, problem-solving, engineering, maths application
      /design|build|create|construct|circuit|engineer|plan|optimis|maximis|minimis|budget|limit|rule|condition|constraint|network|algorithm|program|code|proof|invest|resource/i.test(topicLower) ||
      /maths|physics|computing|design|technology|engineering/i.test(subjectLower)
    ),
  };

  // ── Base variant pool (classic types — always valid) ──────────────────────
  type TripleType = [string, string, string];
  const BASE_A_VARIANTS: TripleType[] = [
    ["TRUE_FALSE",  "MCQ",      "GAP_FILL"],      // 0
    ["MCQ",         "GAP_FILL", "ORDERING"],      // 1
    ["GAP_FILL",    "TRUE_FALSE", "SHORT_ANSWER"], // 2
    ["ORDERING",    "TRUE_FALSE", "MCQ"],          // 3
    ["MATCHING",    "MCQ",      "GAP_FILL"],       // 4
    ["TRUE_FALSE",  "ORDERING", "SHORT_ANSWER"],  // 5
    ["MCQ",         "MATCHING", "TRUE_FALSE"],    // 6
    ["GAP_FILL",    "ORDERING", "MCQ"],           // 7
  ];
  const BASE_B_VARIANTS: TripleType[] = [
    ["SHORT_ANSWER", "TABLE",        "SHORT_ANSWER"],  // 0
    ["TABLE",        "SHORT_ANSWER", "ORDERING"],      // 1
    ["SHORT_ANSWER", "ORDERING",     "TABLE"],         // 2
    ["TABLE",        "MATCHING",     "SHORT_ANSWER"],  // 3
    ["SHORT_ANSWER", "TABLE",        "MATCHING"],      // 4
    ["ORDERING",     "TABLE",        "SHORT_ANSWER"],  // 5
    ["SHORT_ANSWER", "MATCHING",     "TABLE"],         // 6
    ["TABLE",        "SHORT_ANSWER", "ORDERING"],      // 7
  ];

  // ── Build candidate pools including relevant new types ────────────────────
  // New types are injected as alternatives to one slot in the variant only when relevant.
  // They never replace all 3 slots — classic types always anchor at least 2 slots.
  const SECTION_A_VARIANTS: TripleType[] = [...BASE_A_VARIANTS];
  const SECTION_B_VARIANTS: TripleType[] = [...BASE_B_VARIANTS];

  if (isRelevant.ERROR_CORRECTION) {
    SECTION_A_VARIANTS.push(["ERROR_CORRECTION", "MCQ",       "GAP_FILL"]);
    SECTION_B_VARIANTS.push(["ERROR_CORRECTION", "TABLE",     "SHORT_ANSWER"]);
  }
  if (isRelevant.RANKING) {
    SECTION_A_VARIANTS.push(["RANKING",      "TRUE_FALSE",   "SHORT_ANSWER"]);
    SECTION_B_VARIANTS.push(["RANKING",      "TABLE",        "SHORT_ANSWER"]);
  }
  if (isRelevant.WHAT_CHANGED) {
    SECTION_A_VARIANTS.push(["WHAT_CHANGED", "MCQ",          "GAP_FILL"]);
    SECTION_B_VARIANTS.push(["WHAT_CHANGED", "TABLE",        "SHORT_ANSWER"]);
  }
  if (isRelevant.CONSTRAINT_PROBLEM) {
    SECTION_A_VARIANTS.push(["CONSTRAINT_PROBLEM", "MCQ",    "TRUE_FALSE"]);
    SECTION_B_VARIANTS.push(["CONSTRAINT_PROBLEM", "TABLE",  "SHORT_ANSWER"]);
  }

  const variantIndex = topicSeed % SECTION_A_VARIANTS.length;

  // ── Maths-specific block addenda ──────────────────────────────────────────
  // When the subject is Maths, every question type needs to push for numerical,
  // calculation-based content rather than essay-style writing.
  const mathsTrueFalse = isMaths ? ` MATHS T/F RULE: Every statement MUST be a mathematical equality, inequality, or calculation (e.g. "1. \\(\\frac{3}{4} + \\frac{1}{8} = \\frac{7}{8}\\). TRUE"). Do NOT use worded statements like "Fractions can be added easily." — use concrete numeric facts the student can verify by calculation.` : "";
  const mathsMcq = isMaths ? ` MATHS MCQ RULE: The question stem MUST be a calculation (e.g. "Calculate \\(2.4 \\times 10^{3} \\div 0.6\\)"). All four options MUST be numerical answers (e.g. "A  4000", "B  400", "C  40", "D  4000000"). Distractors MUST be believable results of common errors (wrong power of 10, sign error, order-of-operations slip, forgotten carry). NEVER use worded options.` : "";
  const mathsGapFill = isMaths ? ` MATHS GAP FILL CRITICAL RULE: Write ALL numbers, expressions and symbols as PLAIN TEXT in the gap fill paragraph (e.g. "x squared", "square root of 16", "three-quarters", "2x + 3") — do NOT use LaTeX \\\\(...\\\\) delimiters inside gap fill paragraphs because they render as raw text and break the layout. Reserve LaTeX ONLY for Worked Examples and calculation questions. The gap fill should teach a method or procedure (e.g. "To solve a linear equation, first _____ both sides, then _____ both sides by the _____").` : "";
  const mathsShortAnswer = isMaths ? ` MATHS SHORT ANSWER RULE (STRICT): Must be a PURE NUMERICAL / CALCULATION question.
- START the question with an imperative calculation verb: "Calculate", "Work out", "Find the value of", "Solve", "Simplify", "Evaluate", "Factorise", "Expand", "Show that", or "Prove that".
- NEVER start with "Explain", "Describe", "Discuss", "Why", "What is the meaning of", "Give reasons for", "Compare", "Suggest" — these are writing verbs and are FORBIDDEN in maths.
- The question MUST contain at least one concrete number, variable expression, or equation (e.g. "Solve \\(3x - 7 = 2x + 5\\)" — not "Solve a linear equation").
- Use REAL numbers appropriate to the specification level (e.g. for Y10 Higher: use \\(x^{2} + 5x - 14 = 0\\), not \\(x + 1 = 0\\)).
- Answer must be a single number, fraction, exact surd, algebraic expression, or coordinate — NOT a paragraph of prose.` : "";
  const mathsTable = isMaths ? ` MATHS TABLE RULE: The table MUST be a function table, frequency table, ratio table, or calculation table. Columns should be things like "x | y=2x+3 | y-value", "Number | Squared | Cubed", "Ratio A:B | Simplified | Decimal form". Blank cells (..........) must be calculated values the student fills in — NOT worded answers.` : "";

  const blockInstructions: Record<string, string> = {
    TRUE_FALSE:         `Write exactly 4 numbered statements (1. 2. 3. 4.), each ending with TRUE or FALSE on the same line. Exactly 2 must be TRUE and 2 must be FALSE. Example: '1. Water boils at 100°C. TRUE'${mathsTrueFalse}`,
    MCQ:                `One question stem, then options: 'A  option' 'B  option' 'C  option' 'D  option' on separate lines. Only ONE is correct.${mathsMcq}`,
    GAP_FILL:           `One paragraph 40-60 words with 5-7 blanks as _____. Next line: 'WORD BANK: word1 | word2 | word3 | word4 | word5 | word6 | word7'${mathsGapFill}`,
    ORDERING:           `6 items each on its own line starting with ☐. Instruction: 'Number the boxes 1–6 to show the correct order.'${isMaths ? ' MATHS ORDERING RULE: Items must be steps of a calculation method (e.g. "Subtract 5 from both sides", "Divide both sides by 3") OR numerical values to be ordered (e.g. "0.25", "3/8", "30%").' : ''}`,
    MATCHING:           `5 pairs. Each line: '1. [term] ←→ [definition]'. Pairs must be shuffled (term order ≠ definition order).${isMaths ? ' MATHS MATCHING RULE: Prefer matching calculations to answers (e.g. "\\(5^{2}\\) ←→ 25", "\\(\\sqrt{49}\\) ←→ 7", "30% of 200 ←→ 60") OR matching equations to solutions.' : ''}`,
    SHORT_ANSWER:       `One focused question. Mark allocation in brackets: [X marks]. No answer given — student writes it.${mathsShortAnswer}`,
    TABLE:              `Markdown table with | separators. 3-4 columns. 4-5 rows. Blank cells use '...........' for students to fill in.${mathsTable}`,
    ERROR_CORRECTION:   `Present a worked solution with a deliberate mistake — choose an error that is realistic and topic-specific (wrong formula, arithmetic slip, incorrect unit, missed step). Format exactly:\n'Worked Answer\n[step 1]\n[step 2 — contains the error]\n[step 3 if needed]\n\nMistake\n[teacher-only: describe the exact error]\n\nTask\n1. Identify the mistake\n2. Explain why it is wrong\n3. Write the correct answer'\nIMPORTANT: The error must be plausible — something a real student would do. Do NOT make it trivially obvious. Use layout tag: error_correction.${isMaths ? ' MATHS ERROR CORRECTION RULE: The worked solution must be a numerical calculation. The error must be a concrete mathematical slip (sign error, order of operations, incorrect rearranging, forgotten reciprocal on fraction division, etc.) — NOT a conceptual misunderstanding expressed in prose.' : ''}`,
    RANKING:            `Present 4–6 items that can be meaningfully ordered by a clear criterion relevant to the topic. Format exactly:\n'Rank these from [highest/strongest/fastest/most] to [lowest/weakest/slowest/least]:\n- [item A]\n- [item B]\n- [item C]\n- [item D]\n\nExplain your reasoning:'\nThe criterion must be scientifically/factually correct and unambiguous. Do NOT use ranking for subjective opinions. Use layout tag: ranking.${isMaths ? ' MATHS RANKING RULE: Items must be numerical values, fractions, decimals, or expressions to be ordered (e.g. "Rank these from smallest to largest: 3/5, 0.65, 61%, 7/10, 0.58"). The student must calculate each to rank correctly — do NOT use a "reasoning" step.' : ''}`,
    WHAT_CHANGED:       `Present a before/after or cause/effect comparison that is directly relevant to the topic. Format exactly:\n'Scenario A\n[describe the initial state clearly]\n\nScenario B\n[describe the changed state — change exactly ONE variable]\n\nTask\n1. What changed between A and B?\n2. Why did this happen? (use subject vocabulary)\n3. What effect does this have on [relevant outcome]?'\nThe change must be scientifically/factually grounded. Use layout tag: what_changed.${isMaths ? ' MATHS WHAT-CHANGED RULE: Scenario A and B must each contain a calculation, and the student must calculate the new value after the change (e.g. A: "A car travels 120 km in 2 hours. Calculate the average speed." B: "The same journey now takes 1.5 hours. Calculate the new average speed and the percentage change.").' : ''}`,
    CONSTRAINT_PROBLEM: `Present a design or problem-solving task with 2–4 specific constraints that require genuine understanding of the topic. Format exactly:\n'Goal\n[clear task description — what must be achieved]\n\nConstraints\n- [rule 1 — must be topic-specific]\n- [rule 2]\n- [rule 3]\n\nOutput\nShow your working / draw your solution below:'\nConstraints must be non-trivial and require topic knowledge to satisfy. Do NOT use for pure recall. Use layout tag: constraint_problem.${isMaths ? ' MATHS CONSTRAINT RULE: Constraints must be numerical (e.g. "Budget must not exceed £500", "Area must be at least 20 m²", "Answer must be a positive integer"). The student must produce a numerical solution that satisfies every constraint, showing full working.' : ''}`,
  };

  const variantA = SECTION_A_VARIANTS[variantIndex];
  const variantB = SECTION_B_VARIANTS[variantIndex];

  // Phase 1 — Curriculum structure: Section 1 = 6-8 questions, Section 2 = 6-8 questions, Section 3 = 5 exam-style questions
  // The sectionAPrompt now requests 6-8 questions using varied formats.
  const sec1TargetCount = params.difficulty === "foundation" || params.difficulty === "basic" ? 6
    : params.difficulty === "higher" || params.difficulty === "stretch" ? 8 : 7;
  const sec2TargetCount = sec1TargetCount;
  const sec3TargetCount = 5; // always 5 for secondary

  const sectionAPrompt = `SECTION 1 — RECALL (${sec1TargetCount} questions, Q1–Q${sec1TargetCount}):
Generate exactly ${sec1TargetCount} recall questions. Use at least 3 DIFFERENT question formats (True/False, MCQ, Gap Fill, Matching, Ordering, Short Answer). No two adjacent questions may use the same format. Formats:
BLOCK 1 — ${blockInstructions[variantA[0]]}
BLOCK 2 — ${blockInstructions[variantA[1]]}
BLOCK 3 — ${blockInstructions[variantA[2]]}
BLOCKS 4–${sec1TargetCount} — continue with varied formats (Short Answer, Matching, Ordering, True/False) testing different aspects of recall. Each question must be on a SEPARATE question with its OWN answer space. Mark allocation MUST be shown for each question.`;

  const sectionBPrompt =
    yearNum >= 9 ? `SECTION 2 — UNDERSTANDING (${sec2TargetCount} questions, Q${sec1TargetCount + 1}–Q${sec1TargetCount + sec2TargetCount}):
Generate exactly ${sec2TargetCount} understanding questions. These must be HARDER than Section 1 and test deeper comprehension, application of concepts, and explanation. Use varied formats (Short Answer, Structured Response, Stimulus/Data Response, Table). Each question must have its OWN answer space with lines appropriate to the mark allocation. Mark allocation MUST be shown for each question.
Q${sec1TargetCount + 1} — ${blockInstructions[variantB[0]]}
Q${sec1TargetCount + 2} — ${blockInstructions[variantB[1]]}
Q${sec1TargetCount + 3} — ${blockInstructions[variantB[2]]}
Q${sec1TargetCount + 4}–Q${sec1TargetCount + sec2TargetCount} — continue with harder understanding questions using Short Answer or Structured Response format. Each must require genuine subject knowledge and explanation.` :
    `SECTION 2 — UNDERSTANDING (${sec2TargetCount} questions):
Generate exactly ${sec2TargetCount} understanding questions using varied formats.
BLOCK 1 — ${blockInstructions[variantB[0]]}
BLOCK 2 — ${blockInstructions[variantB[1]]}
BLOCK 3 — ${blockInstructions[variantB[2]]}
BLOCKS 4–${sec2TargetCount} — continue with harder understanding questions.`;
  const examStylePrompt = `\nCRITICAL: You MUST include "Diagram A" and "Diagram B" in your response.
For Diagram A: Use the marker [[DIAGRAM:{"type":"labeled","title":"Diagram A — ${params.topic}","labels":[{"text":"Label 1","x":20,"y":30},{"text":"Label 2","x":80,"y":30}]}]].
For Diagram B: Use the marker [[DIAGRAM:{"type":"labeled","title":"Diagram B — ${params.topic}","labels":[{"text":"Label 1","x":20,"y":30},{"text":"Label 2","x":80,"y":30}]}]].
${yearNum >= 9 ? `MANDATORY FOR YEAR 9-11: Section 3 MUST be titled 'SECTION 3 — EXAM STYLE QUESTIONS'. Every question in Section 3 (Q7, Q8, Q9) MUST be a multi-step exam-style question with realistic mark allocations (e.g. [3 marks], [4 marks]) and exam-board phrasing. Do NOT include simple recall or fluency questions in Section 3.` : ""}`;

  // ── Primary (KS1/KS2) layout enhancement ──────────────────────────────────
  const isPrimary = yearNum <= 6;
  const primaryLayoutNote = isPrimary ? `
PRIMARY SCHOOL LAYOUT RULES (${phase}) — MANDATORY — READ THIS FIRST:
This is a KS1/KS2 worksheet. It must feel like a fun activity sheet, NOT a secondary school handout.

CORE PRINCIPLE: LESS READING, MORE DOING. Max 8 words per instruction. No paragraphs anywhere.

ACTIVITY MIX — use ALL of these types spread across the sheet:
  - Circle the correct answer  - Match with a line (draw a line between two columns)
  - Fill in the blank  ___    - Tick the box  [ ]    - Number order / sort activity
  - True or false?            - Complete the table   - Draw and label
  - Cut and sort (describe as columns to sort)        - Colour the correct one
  - "Can you remember?" quick-fire mini quiz          - Word search or word scramble (describe as a word bank activity)

SECTIONS — use these child-friendly section names, not academic ones:
  KS1: "Can You Remember?", "Have a Go!", "Let's Try Together", "Your Challenge", "How Did I Do?"
  KS2: "Warm Up", "Let's Practise", "Dig Deeper", "Challenge Corner", "My Learning Check"

LAYOUT RULES:
1. Every activity box = bold title + ONE instruction sentence + activity content
2. Worked example: show it as a comic-strip style step sequence: Step 1 → Step 2 → Step 3 → Answer!
3. Vocabulary: NOT a definition list — make it a word-picture matching activity or word bank with blank definitions to fill in
4. Numbers/maths: use pictures (describe in words), number lines, tens frames, arrays where appropriate
5. Reflection: ONLY this: "I found this: [ ] Easy  [ ] OK  [ ] Tricky" — nothing else
6. Section A: start with the easiest possible version; every question scaffolded with a starter or partial answer
7. Challenge: label it "Super Challenge — can you do this?!" — make it feel exciting, not scary
8. NO long numbered lists of the same question type — vary after every 3 questions

SPACING: Big answer boxes, lots of white space. This should print as a welcoming, open document.
TONE: Positive, encouraging, child-voice. "You've got this!", "Great work!", "Did you spot the pattern?"
` : "";

  const system = isPrimary
    ? `You are an expert UK primary school teacher creating an engaging, age-appropriate activity worksheet for ${params.yearGroup} (${phase}). Topic: "${params.topic}".

READING AGE CEILING — MANDATORY:
${yearNum <= 2 ? '- Reading age: 5–7. Use ONLY words a 5-year-old knows. Max 6 words per instruction. Simple CVC words and common sight words. No technical jargon at all.' : yearNum <= 4 ? '- Reading age: 7–9. Short, everyday sentences (max 10 words). Avoid any Latin/Greek-root words. Define every subject word the first time it appears.' : '- Reading age: 9–11. Clear sentences (max 12 words). Every subject-specific word must have a simple definition in brackets the first time it appears.'}

VOCABULARY RULES — NEVER USE these secondary-school words in student-facing content:
- Do NOT use: analyse, evaluate, assess, justify, synthesise, hypothesis, methodology, criterion, criteria, infer, deduce, extrapolate, correlate, quantify, magnitude, perpendicular, adjacent, coefficient, denominator, numerator, simultaneous, quadratic, trajectory, velocity, acceleration, momentum, photosynthesis (use 'how plants make food'), osmosis (use 'water moving through'), mitosis (use 'cell splitting'), covalent, ionic, oxidation (use 'rusting/burning'), reduction, equilibrium, gradient (use 'slope'), circumference (use 'distance around the circle'), diameter (use 'distance across the middle').
- ALWAYS replace complex words with simple alternatives. If you must use a subject word, immediately define it in plain English in brackets.

TONE: Warm, encouraging, child-friendly. Use 'you', 'let's', 'have a go', 'well done'. No formal academic register.

FORMAT: Activity-based, NOT a secondary school handout. Lots of variety: circle, tick, draw, match, fill in. Short instructions only.

Respond with valid JSON only — no markdown, no code blocks, no HTML tags inside content strings. Use plain text only.`
    : `You are an expert GCSE/curriculum worksheet designer with deep knowledge of the UK National Curriculum, AQA, Edexcel, OCR, and WJEC specifications. You create complete, print-ready, professionally structured student worksheets AND matching teacher answer keys.

⚠️ CURRICULUM AUTHORITY MANDATE (Phase 5 — non-negotiable):
Every piece of content you generate MUST be anchored to the UK curriculum and exam-board specification for the given subject, topic, and year group. This means:
- All factual claims must be accurate according to the AQA/Edexcel/OCR specification for this topic
- Key vocabulary must match the exact terminology used in the specification (e.g. for AQA Biology: 'aerobic respiration', 'anaerobic respiration', 'ATP', 'mitochondria' — not informal synonyms)
- Mark schemes must follow the style of the specified exam board (AQA: method marks M1/A1; Edexcel: B marks for accuracy; OCR: point-based)
- Questions must reflect the actual style, difficulty, and command words used in past papers for this specification
- Do NOT generate content that contradicts the specification or uses out-of-date terminology
- The worked example MUST show a method that would score full marks on the actual exam
- Common mistakes listed MUST be genuine misconceptions identified in examiner reports for this topic
- For science: use the correct chemical equations, formulae, and units as specified by the exam board
- For maths: use the correct notation and methods as specified in the GCSE maths specification
- For English/Humanities: use the correct critical terminology and assessment objectives (AO1, AO2, AO3, AO4)
Content that does not meet this standard will be rejected. Generate content as if you are writing an official revision resource for the exam board.
${(() => {
  const diagramA = getDiagramForTopic(params.subject, params.topic);
  const diagramB = getDiagramForTopic(params.subject, "comparison or secondary process for " + params.topic);
  return `MANDATORY: You MUST include "Diagram A" in your response. Use this exact marker in the content field: ${diagramA.example}\nMANDATORY: You MUST include "Diagram B" in your response. Use this exact marker in the content field: ${diagramB.example}`;
})()}


⚠️ CRITICAL FORMAT RULES — THESE OVERRIDE EVERYTHING ELSE:

SUBJECT TYPE: ${isSTEM ? 'STEM' : 'HUMANITIES'}

PRINTED PAGE LAYOUT (MANDATORY ORDER — every worksheet INCLUDING MATHS must follow this exactly):
  Page 1 (may span 1–2 pages if content is long): Learning Objective → ${params.recallTopic ? 'Retrieval → ' : ''}Key Vocabulary → Common Mistakes → Worked Example
  Section 1 — Recall (Q1–Q${sec1TargetCount}, ${sec1TargetCount} questions) — starts on its own fresh page
  DIAGRAM A (full-page reference spread, own page)
  Section 2 — Understanding (Q${sec1TargetCount + 1}–Q${sec1TargetCount + sec2TargetCount}, ${sec2TargetCount} questions) — starts on its own fresh page
  DIAGRAM B (full-page visual reference spread, own page — may be skipped if topic has no second visual)
  Section 3 — ${yearNum >= 9 ? 'EXAM STYLE QUESTIONS' : 'Application & Analysis'} (Q${sec1TargetCount + sec2TargetCount + 1}–Q${sec1TargetCount + sec2TargetCount + sec3TargetCount}, ${sec3TargetCount} questions) + Challenge Question — starts on its own fresh page
  Self Reflection + Exit Ticket + Revision Tips — starts on its own fresh page
  Teacher Copy — Answer Key (teacher view only) — starts on its own fresh page

Emit sections IN THIS ORDER so printing matches the page layout. The intro block (LO, Retrieval if requested, Key Vocab, Common Mistakes, Worked Example) flows naturally — if it fits on one page it stays on one page; if it overflows it spans to a second page before Section 1 starts. Page breaks are CSS-driven: every Section divider, Diagram A, Diagram B, Self-Reflection, and Teacher-Key block starts a new printed page.

DIAGRAM A — REFERENCE DIAGRAM (MANDATORY, placed BETWEEN Section 1 and Section 2):
Every worksheet MUST include a REFERENCE diagram called "Diagram A" as its own full-page spread. This is a fully-labelled visual the student can refer back to while answering questions — it is NOT a task. Place it immediately AFTER the last question of Section 1 (Q3) and BEFORE the first question of Section 2 (Q4). Use format:
  {"type":"diagram-a","title":"Diagram A — [brief title e.g. 'The Water Cycle']","content":"Diagram A — Reference. Refer back to this diagram as you work through Section 2 and Section 3.\n[[DIAGRAM:{"type":"...","title":"...","labels":[...]}]]","altText":"..."}

DIAGRAM B — VISUAL REFERENCE (place BETWEEN Section 2 and Section 3):
Every worksheet SHOULD include a second diagram called "Diagram B" as its own full-page spread between Section 2 (Q6) and Section 3 (Q7). This is a VISUAL REFERENCE ONLY — it contains NO questions. If the topic has no genuinely valuable second diagram (e.g. pure algebra topics), emit a diagram-b section with content "[skipped — topic does not require a second visual]" so it can be dropped. Use format:
  {"type":"diagram-b","title":"Diagram B — [brief title]","content":"Diagram B — Visual Reference.\n[[DIAGRAM:...]]","altText":"..."}

⚠️ CRITICAL: Diagram A and Diagram B are VISUAL AIDS ONLY. They MUST NOT contain any questions, sub-questions, or tasks. All questions come ONLY from Section 1 (Q1–Q${sec1TargetCount}), Section 2 (Q${sec1TargetCount + 1}–Q${sec1TargetCount + sec2TargetCount}), and Section 3 (Q${sec1TargetCount + sec2TargetCount + 1}–Q${sec1TargetCount + sec2TargetCount + sec3TargetCount}). No extra questions should exist anywhere else in the worksheet.

⚠️ Diagram A MUST appear in EVERY worksheet. Diagram B should appear unless the topic genuinely has no second visual. NEITHER diagram should contain questions — questions come only from Sections 1, 2, and 3.

SECTION 1 — RECALL (Q1–Q3):
${sectionAPrompt}

SECTION 2 — UNDERSTANDING (Q4–Q6):
  Q4 — SHORT EXPLANATION / CALCULATION [5 marks]: ${isMaths ? 'A multi-step calculation question appropriate to the topic.' : 'A focused short-answer question requiring genuine understanding.'}
  Q5 — EXTRACT/STIMULUS RESPONSE [5 marks]: ${isSTEM ? 'Provide a scenario or data set (readings from an experiment, a word problem). Ask sub-questions: (a) Identify the relevant formula/law [1 mark] (b) Full worked calculation showing method [2 marks] (c) Explain what the result means in context [2 marks]' : 'Provide a 4–8 line extract from the primary text. Label with Act/Chapter/Section and speaker. Ask: (a) Identify ONE language/literary technique [1 mark] (b) What does this reveal about character/theme/author intent? [2 marks] (c) What does the key image/phrase/symbol represent? [2 marks]'}
  Q6 — SEQUENCING/STRUCTURED RESPONSE [4 marks]: ${isSTEM ? 'Generate a structured question appropriate to the topic. IMPORTANT: Only use a formula triangle if the topic genuinely has a triangular formula relationship (e.g. speed/distance/time, V=IR, P=IV, pressure=force/area, density=mass/volume). For all other topics, use a method scaffold: present a worked scenario and ask (a) Identify the key rule or principle [1 mark] (b) Apply it to a given scenario with full working [2 marks] (c) State the unit or explain the result [1 mark].' : 'Provide 6 events/plot points/key moments from the topic in a scrambled order. Ask students to number boxes 1–6 in the correct chronological or logical sequence. [3 marks: all correct = 3, 4–5 correct = 2, 2–3 correct = 1]'}

DIAGRAM RULES — MANDATORY (apply to BOTH Diagram A and Diagram B):
The diagram type MUST match the specific topic. Choose the BEST type from:
- "labeled" → structures (cells, organs, apparatus), character webs (literature), geographic features, theme maps
- "circuit" → ONLY for electricity/circuits topics (include "layout": "series" or "parallel")
- "flow" → processes, timelines, sequences, cause-effect chains, algorithms
- "cycle" → repeating processes (water cycle, rock cycle, nitrogen cycle, life cycles)
- "number-line" → fractions, decimals, ordering, place value (include "start", "end", "marked")
- "bar" → data/statistics questions (include "bars" array with real data, "xLabel", "yLabel")
- "axes" → coordinate geometry, graph plotting (include "xLabel", "yLabel")
- "fraction-bar" → primary fractions (include "numerator", "denominator")
- "pyramid" → ecological/energy pyramids (include "levels" array)
- "venn" → classification/comparison (include "setA", "setB", "onlyA", "overlap", "onlyB")
- "timeline" → history, sequence of events (include "events" array with dates)

CRITICAL: Every label, step, and title MUST use REAL terms specific to "${params.topic}".
For literature: use actual character names, themes, or techniques from the text.
For science: use correct scientific terminology for the specific process/structure.
For maths: use appropriate numerical values matching the concept.
For history: use real events, dates, or figures.

Output format: [[DIAGRAM:{"type":"...","title":"...","labels":[...]}]]
NEVER output a diagram with missing required fields. x/y values: 5-95 range. Max 8 labels.
NEVER use generic placeholders like "Label 1" or "Step 1" — use real topic-specific terms.
For DIAGRAM A: the diagram must be FULLY LABELLED (every part has a real term shown).
For DIAGRAM B: the diagram must be FULLY LABELLED — it is a visual reference only with NO questions attached.

SECTION 3 — ${yearNum >= 9 ? 'EXAM STYLE QUESTIONS' : 'APPLICATION & ANALYSIS'} (Q${sec1TargetCount + sec2TargetCount + 1}–Q${sec1TargetCount + sec2TargetCount + sec3TargetCount}, ${sec3TargetCount} questions):
${yearNum >= 9 ? `These MUST be genuine exam-style questions that look and feel like questions from a real ${params.examBoard || 'AQA/Edexcel'} GCSE paper. Requirements:
- Each question is SEPARATE with its own number, mark allocation in [X marks] format, and its own working-out lines
- Use exam command words: Calculate, Show that, Explain, Evaluate, Compare, Justify, Describe, Suggest
- Questions must escalate in difficulty: Q${sec1TargetCount + sec2TargetCount + 1} = 3-4 marks (structured), Q${sec1TargetCount + sec2TargetCount + 2} = 4-5 marks (multi-step), Q${sec1TargetCount + sec2TargetCount + 3} = 5-6 marks (extended), Q${sec1TargetCount + sec2TargetCount + 4} = 4-5 marks (evaluate/compare), Q${sec1TargetCount + sec2TargetCount + 5} = 6 marks (synoptic/multi-concept)
- Every question must have sub-parts (a), (b), (c) where appropriate
- Working-out lines MUST be provided under each question (more lines = more marks)
- Questions MUST test knowledge that appears in the ${params.examBoard || 'AQA'} specification for ${params.topic}
- Do NOT repeat question formats from Section 1 or Section 2
` : sectionBPrompt}${examStylePrompt}

CHALLENGE QUESTION [${isSTEM ? '8' : '12'} marks]: ${isMaths ? 'Present a challenging multi-step real-world maths problem on ' + '"' + params.topic + '"' + '. ALL parts must be numerical/calculation-based — NO written explanations or prose. (a) Set up the problem and identify the method [1 mark] (b) Perform 2–3 linked calculations showing ALL working [5 marks] (c) Give the final answer with correct units/form and check it [2 marks]. Mark scheme: method marks + accuracy marks only.' : isSTEM ? 'Present a multi-part real-world scenario requiring: (a) Choose and justify an approach/method/circuit/process (b) Perform at least 2–3 linked calculations showing all working (c) Explain what happens under a changed condition. Award: up to 3m for explanation + up to 5m for calculations.' : 'Present a short quotation from the text (3–8 words, with Act/scene reference). Instruction: "Starting with this extract, write about how [author] presents [concept/character/theme]." List what the answer must include. Award: Band 4 (10–12m) / Band 3 (7–9m) / Band 2 (4–6m) / Band 1 (1–3m). Describe each band in one sentence.'}

SELF REFLECTION + EXIT TICKET + REVISION TIPS (MANDATORY — every worksheet must end with these three blocks, in this order, on the pupil-facing page):

1. SELF REFLECTION — emit a section with type "self-reflection" containing:
   SUBTITLE: Review your understanding before moving on.
   CONFIDENCE_TABLE:
   [5 specific skills/concepts from ${params.topic}, one per line]
   WRITTEN_PROMPTS:
   One concept I feel confident about is ...
   One area I still need to practise is ...
   A question I still want to ask my teacher is ...
   EXIT_TICKET: Write ONE thing you learned today about ${params.topic} in one sentence.

2. REVISION TIPS — emit a separate section with type "revision-tips" containing five examiner-voice tips in this exact order, each prefixed with its category label in UPPERCASE:
   SUBTITLE: Examiner tips for tackling ${params.topic}.
   TIPS:
   1. COMMAND WORD: [what the dominant command word on this worksheet actually wants]
   2. WATCH OUT: [one named misconception that pupils make on this topic]
   3. METHOD: [one method habit that loses marks on this topic; for maths: show every step; for sciences: include units before rounding; for humanities: anchor to a date or source; for English: embed the quote then analyse a single word]
   4. MARK SCHEME: [how marks are awarded for the section's tariff]
   5. TIME: [time budget — roughly one minute per mark]

The Self-Reflection's confidence grid, written prompts and exit ticket all appear on the pupil-facing page (NOT teacher-only) and they sit on their own page break before the Teacher Copy below. Do not bury reflection inside the teacher copy — the pupil must see all three blocks.

TEACHER COPY — ANSWER KEY: Provide answers for EVERY question. ${isMaths ? `MATHS MARK SCHEME FORMAT (MANDATORY):
For every maths question, break the mark scheme down as:
  Q[n] [X marks total]:
    Method (M marks): [show every working step as a separate line, one per method mark]
    Accuracy (A marks): [final numerical answer with correct units/form]
    Alternative methods accepted: [list any other valid methods]
    Common errors to watch for: [2–3 typical student slips]
Use M1, M2, A1, A2 notation to show where each mark is awarded. Do NOT collapse into prose.` : 'For Q9 and Challenge: reproduce full level descriptor bands. For STEM: show every step of working. For HUMANITIES: provide suggested quotes and page/act references.'} End with total mark breakdown: Section 1: Xm | Section 2: Xm | Section 3: Xm | Challenge: Xm | TOTAL: Xm

DO NOT include a Reminder Box. DO NOT deviate from these formats. ABSOLUTELY NO EMOJIS in student-facing content.
CRITICAL SEND RULE: SEND adaptations affect FORMATTING AND PRESENTATION ONLY — never the academic content or intellectual rigour of questions.
- The actual question content (what is being asked, the numbers used, the concepts tested) must remain at the correct GCSE/curriculum level for the year group.
- SEND overlays change HOW questions are presented (font, spacing, scaffolding frames, sentence starters, checkboxes, worked examples) — NOT WHAT is being asked.
- True/False statements must be factually correct curriculum statements at the appropriate level — not simplified to the point of being trivial.
- MCQ options must be plausible distractors at curriculum level — not dumbed-down guesses.
- Gap-fill paragraphs must use correct subject terminology — not replaced with everyday words.
- Short-answer and extended questions must require genuine subject knowledge — not just recall of simple facts.
- NEVER add SEND management instructions ('Complete the task in steps', 'Tick each step', 'Focus on one question', 'Take a break') as question content items.
- SEND scaffolding (sentence starters, answer frames, worked examples) goes in SEPARATE support boxes AROUND the questions — not inside the question text itself.
- Do NOT simplify the academic content or intellectual challenge of questions just because SEND adaptations are applied.
- DIAGRAM A and DIAGRAM B MUST still be included with SEND applied — never omit them. SEND overlays may add alt-text, larger labels, or a word bank alongside the diagram, but the diagram itself is untouched.
- PAGE LAYOUT (Page 1 intro → Section 1 → Diagram A → Section 2 → Diagram B → Section 3+Challenge → Reflection → Teacher Key) MUST be preserved under every SEND overlay.
- MATHS under SEND: calculation-based rule still applies. SEND may add a method-step scaffold, a worked-example bridge, or a key-facts box — but questions must still be calculations, not prose.
- SEND does NOT reduce the total mark count. Every question keeps its original marks.
- NEVER merge or remove questions to simplify the sheet — Section 1 = ${sec1TargetCount} questions, Section 2 = ${sec2TargetCount} questions, Section 3 = ${sec3TargetCount} questions + Challenge. SEND adaptations add support AROUND each question, they never remove questions.
Topic: "${params.topic}" | Year: ${params.yearGroup} (${phase})

QUALITY STANDARDS — every question must meet professional UK teacher standards:
1. Every question must be fully usable — no placeholders, no "..." — complete, specific, answerable
2. Questions must escalate in difficulty across the worksheet (Section A ≤ grade ${Math.max(3, (parseInt(params.yearGroup?.replace(/\D/g, "") || "9")) - 4)}, Section B = grade ${Math.max(5, (parseInt(params.yearGroup?.replace(/\D/g, "") || "9")) - 2)}, Challenge = top grade)
3. Use REAL numbers, REAL contexts — never "a number", always "24", "3.7", "Birmingham", "2025"
4. ${isMaths ? "MATHS: Every expression MUST use LaTeX \\\\(...\\\\). NEVER write fractions, equations or symbols in plain text. \\\\(\\\\dfrac{3}{4}\\\\) NOT 3/4. \\\\(x^{2}\\\\) NOT x². \\\\(\\\\sqrt{16}\\\\) NOT √16. \\\\(\\\\times\\\\) NOT ×. All numeric answers must show working method." : "Use precise subject vocabulary throughout. Answers must require genuine understanding, not just recall."}
5. LAYOUT VARIATION IS MANDATORY — every section must use DIFFERENT question formats. Rotate through these types, never using the same format twice in a row:
   - TRUE/FALSE: "1. [statement]" per line, with "TRUE FALSE" on same line. Use for recall sections.
   - MCQ: "A  [option]\nB  [option]\nC  [option]\nD  [option]" — 2-column layout. One correct answer.
   - GAP FILL: flowing paragraph with ___ blanks + "WORD BANK: word1 | word2 | word3" line below.
   - ORDERING: items listed with ☐ box prefix, instruction to "Number 1–N in correct order".
   - MATCHING: "1. [term] ←→ [definition]" pairs.
   - TABLE: markdown table with | separators. Cells that students must complete MUST contain "..........." (dots) or "[blank]" — NEVER pre-fill answers in the student table. Only the first column (row numbers/given data) and header row should have content. All cells the student needs to fill in MUST be blank markers.
   - SHORT ANSWER: clear question + answer lines. Use for understanding/application sections.
   - EXTENDED ANSWER: structured essay/explain prompt. Use for challenge only.
   RULE: Section A (guided) must use at least 2 different formats. Section B (independent) must use at least 2 different formats. No adjacent questions may use the same format.

STRICT JSON OUTPUT: Respond with valid JSON only — no markdown, no code blocks. NEVER use HTML tags inside content strings. Use plain text and LaTeX notation only.
MARK ALLOCATION RULE (mandatory): Every question section MUST include an explicit mark allocation in the format [X marks] or [X mark] at the end of the question text. This applies to ALL question types: Short Answer, MCQ, True/False, Gap Fill, Matching, Ordering, Table, and Extended Answer. Only exception: if the section already has a numeric "marks" field set. Never omit mark allocations.`;

  const examBoardNote = params.examBoard && params.examBoard !== "N/A" && params.examBoard !== "none"
    ? (() => {
        const board = params.examBoard!.toUpperCase();
        const sub = params.subject.toLowerCase();
        const boardSpecific: Record<string, Record<string, string>> = {
          AQA: {
            maths: "AQA GCSE Maths: Use AQA command words (calculate, work out, show that, prove, estimate, write down). AQA mark allocations [1 mark], [2 marks], [3 marks]. Follow AQA mark scheme style — method marks and accuracy marks.",
            science: "AQA GCSE Science: Use AQA required practicals as contexts. AQA command words: describe, explain, evaluate, compare, calculate, give a reason, suggest. Include 6-mark extended writing format for questions worth 6 marks.",
            english: "AQA GCSE English: Use AQA assessment objectives (AO1: identify and interpret, AO2: explain, comment on language, AO3: compare, AO4: evaluate). AQA command words: explain, analyse, compare.",
            history: "AQA GCSE History: Use AQA question types — describe (4 marks), explain why (12 marks), 'how far do you agree' essay (16 marks). Use AQA source/interpretation analysis format.",
            geography: "AQA GCSE Geography: Use AQA command words — describe, explain, evaluate, assess, justify. Include 6-mark 'assess' and 'evaluate' questions. Reference AQA case study format.",
            default: `AQA specification: Use AQA command words, mark allocations, and assessment objectives. Follow AQA ${params.subject} mark scheme style.`,
          },
          EDEXCEL: {
            maths: "Edexcel GCSE Maths (Pearson): Use Edexcel-style question stems. 'Evaluate' means give a reasoned judgement. 'Hence' means use your previous answer. Mark allocations [1], [2], [3], [4]. Follow Pearson mark scheme method marks.",
            science: "Edexcel GCSE Science: Use Edexcel required practicals. 6-mark extended writing questions. Edexcel command words: state, describe, explain, evaluate, calculate, determine.",
            history: "Edexcel GCSE History: Use Edexcel question types — describe (4 marks), explain significance (8 marks), essay/extended writing (16 marks). Source and interpretation analysis.",
            default: `Edexcel (Pearson) specification: Use Edexcel command words, mark allocations, and assessment style. Follow Pearson ${params.subject} mark scheme conventions.`,
          },
          OCR: {
            maths: "OCR GCSE Maths: OCR question style with OCR command words. 'Find' means calculate. 'Write down' means no working needed. Mark allocations [B marks: accuracy, M marks: method, A marks: answer].",
            science: "OCR GCSE Science: OCR Gateway or Twenty First Century specification. OCR required practicals. 6-mark extended answer questions. OCR command words: state, describe, explain, evaluate, calculate.",
            default: `OCR specification: Use OCR command words, mark scheme conventions, and assessment objectives for ${params.subject}.`,
          },
          WJEC: {
            default: `WJEC specification: Use WJEC command words and assessment objectives. Welsh curriculum alignment where relevant. WJEC ${params.subject} mark scheme conventions.`,
          },
        };
        const boardMap = boardSpecific[board] || boardSpecific.EDEXCEL;
        const subjectKey = Object.keys(boardMap).find(k => k !== "default" && sub.includes(k)) || "default";
        return `Exam board: ${params.examBoard}. ${boardMap[subjectKey]}`;
      })()
    : "";
  // ── Per-condition SEND scaffolding ─────────────────────────────────────────
  // Source of truth is client/src/lib/sendPromptFragments.ts — the per-need
  // rules there are a direct translation of send-data.ts worksheetChanges so
  // what the AI is told matches what the teacher was promised in the UI.
  const hasSend = params.sendNeed && params.sendNeed !== "none" && params.sendNeed !== "none-selected" && params.sendNeed !== "general";
  const sendNote = hasSend ? getSendNoteForWorksheet(params.sendNeed!) : "";

  // FEAT-PB5 — when the exam-style flag is set on a Y9+ worksheet, append a
  // hard rule that SEND adaptations must NEVER alter the question stem text
  // or the exam command words. Support (sentence frames, key-formula box,
  // word bank, larger answer space) goes in SEPARATE boxes around the
  // question — not inside the stem.
  const stemPreservationNote = preserveStemsForSend && hasSend
    ? `\nSTEM-PRESERVING SEND OVERLAY (mandatory for Y9+ exam-style worksheets):\nThe SEND adaptations above MUST NOT modify the wording of any question stem, the exam command word, the mark allocation, or the order of questions. The stem must read identically to the un-adapted exam-style version. Apply SEND support EXCLUSIVELY through:\n  - a separate "Sentence frame" / "Answer frame" box rendered ALONGSIDE the question (not inside it);\n  - a margin "Definitions" / "Key terms" panel referencing the stem's vocabulary;\n  - a "Key formulas" / "Method reminder" box at the top of the section;\n  - larger answer-line height / generous spacing (the renderer applies this — never mention it in content).\nDo NOT prepend "[ ]", "Tip:", "BRAIN BREAK", or any SEND-style marker to the stem. Do NOT shorten, simplify, or rewrite the stem. Keep every command word ('Calculate', 'Explain', 'Evaluate', 'Compare', 'Justify') byte-identical to a standard worksheet.\n`
    : "";

  // FEAT-PC9 — Required Practical / Working-Scientifically block. Resolves
  // the matching anchor practical from requiredPractical-bank.ts (KS4 science
  // only — empty string for everything else) and injects it into both the
  // structured and legacy prompt strings.
  const requiredPracticalNote = formatRequiredPracticalForPrompt({
    subject: params.subject,
    topic: params.topic,
    yearGroup: params.yearGroup,
    examBoard: params.examBoard,
  });

  // ── Subject profile (shared with the presentation generator) ──────────────
  // Injecting the subject spec-anchor here is what keeps the worksheet and
  // presentation generators producing matching spec-aligned content.
  const subjectFragments = buildSubjectPromptFragments(params.subject);
  const subjectSpecNote = `${subjectFragments.specAnchorBlock}\n\n${subjectFragments.domainRulesBlock}`;

  // ── Phase 1 — Spec-point anchor (curriculum + GCSE spec lock) ────────────
  // Pulls the published list of spec points for (board, subject, year) from
  // specPointTaxonomy.ts and tells the AI: "these are the only valid
  // specRef values you may stamp on questions; do not invent codes". When
  // the topic is in a known dataset (e.g. AQA Maths Y10) we narrow further
  // to the rows whose specTitle overlaps with the topic; otherwise we list
  // up to ~12 spec points so the AI has at least a curated whitelist.
  const specPointAnchorBlock = (() => {
    if (!params.subject || !params.yearGroup) return "";
    const boardKey = (params.examBoard || "").toLowerCase().replace(/\s+/g, "") as TaxonomyExamBoard;
    let dataset = boardKey ? getSpecPoints(boardKey, params.subject, params.yearGroup) : null;
    let pool = dataset?.specPoints || [];
    if (pool.length === 0) {
      // Fallback: union across boards for this subject/year. Keeps the
      // AI grounded even when the school's specific board isn't bundled.
      pool = getSpecPointsAcrossBoards(params.subject, params.yearGroup);
    }
    if (pool.length === 0) return "";
    const topicLc = (params.topic || "").toLowerCase();
    const subtopicLc = (params.subtopic || "").toLowerCase();
    const matched = topicLc
      ? pool.filter(sp => {
          const title = sp.specTitle.toLowerCase();
          return (
            title.includes(topicLc) ||
            topicLc.includes(title) ||
            (subtopicLc && (title.includes(subtopicLc) || subtopicLc.includes(title)))
          );
        })
      : [];
    const finalSet = (matched.length > 0 ? matched : pool).slice(0, 12);
    const lines = finalSet.map(sp => {
      const tier = sp.tier && sp.tier !== "both" ? ` [${sp.tier}]` : "";
      const ao = sp.ao ? ` (${sp.ao})` : "";
      return `  - ${sp.specRef}: ${sp.specTitle}${tier}${ao}`;
    });
    const boardLabel = dataset?.board?.toUpperCase()
      ?? (boardKey ? boardKey.toUpperCase() : "MULTI-BOARD");
    return `CURRICULUM + SPEC LOCK — these are the ONLY valid specRef values for this worksheet:
Board: ${boardLabel} | Subject: ${params.subject} | ${params.yearGroup} | Topic: ${params.topic || "(unspecified)"}
${lines.join("\n")}

Rules:
- Every question section MUST stamp a "specRef" matching one of the codes above EXACTLY (e.g. "${finalSet[0]?.specRef ?? "N1"}"). Never invent a spec code.
- Every question section MUST stamp an "ncRef" — the verbatim National Curriculum Programme-of-Study statement this question assesses (gov.uk Programmes of Study). Quote the wording, do not paraphrase.
- If you cannot match a published spec point, leave specRef as an empty string — the post-validator will fill the closest match. Do NOT fabricate a code.
- Source whitelist for facts, dates, equations, statutes, mark-scheme conventions: gov.uk Programmes of Study, the named exam board's published specification + assessment objectives + mark schemes, BBC Bitesize, Oak National Academy. No other sources.`;
  })();

  // ── Difficulty tier (secondary only) ─────────────────────────────────────
  const isSecondary = yearNum >= 7;
  const difficultyTier = params.difficulty || "mixed";
  const tierNote = isSecondary
    ? difficultyTier === "foundation" || difficultyTier === "basic"
      ? `FOUNDATION TIER (grades 1–5): Simple language, single-skill questions, hints/sentence starters in Section A, whole-number values, no multi-step problems. Challenge = straightforward application.`
      : difficultyTier === "higher" || difficultyTier === "stretch"
      ? `HIGHER TIER (grades 4–9): Precise subject language, multi-step problems, Section A starts grade 5+, Section B includes reasoning/proof/'show that' questions, grade 8–9 challenge (proof or multi-concept).`
      : `MIXED TIER: Section A = Foundation grades 1–4 (scaffolded, single-skill). Section B = Higher grades 5–7 (multi-step). Challenge = grade 8–9 reasoning/proof.`
    : "";

  // ── Worksheet length calibration ────────────────────────────────────────
  const lengthMins = parseInt(params.worksheetLength || "30", 10);
  const lengthNote =
    lengthMins <= 10
      ? `Length: 10 min. Include ONLY: Learning Objective, Key Vocabulary, Q1 (True/False, 3 statements), Q2 (MCQ). No challenge, no self-reflection.`
      : lengthMins <= 20
      ? `Length: 20 min. Include: Learning Objective, Key Vocabulary, Common Mistakes, Worked Example, Q1 (True/False), Q2 (MCQ), Q3 (Gap Fill), Q4 (Short Answer, 3 marks), Q5 (Short Answer, 3 marks). No Q6-Q9. No challenge. Include Self Reflection.`
      : lengthMins >= 60
      ? `Length: 60 min. Full worksheet: Q1-Q9 plus 2 extra questions Q10 (extended, 5 marks) and Q11 (evaluation, 4 marks). Challenge question (8 marks). Full self-reflection.`
      : lengthMins >= 45
      ? `Length: 45 min. Full worksheet: Q1-Q9 plus one extra question Q10 (extended answer, 5 marks). Challenge question. Full self-reflection.`
      : `Length: 30 min (BASE). Full worksheet: Q1-Q3 (Knowledge Check section), Q4-Q6 (Understanding section), Q7-Q9 (Application & Analysis section). Challenge question. Self Reflection.`;

  // ── Target page count ──────────────────────────────────────────────────────
  const targetPages = params.targetPages || 0; // 0 = auto (no constraint)
  const pageCountNote = targetPages > 0
    ? targetPages === 1
      ? `CRITICAL: This worksheet MUST fit on exactly 1 printed A4 page (210mm × 297mm, standard margins).
      - Maximum 8-10 questions total
      - No word problems section
      - Compact worked example (2-3 steps max)
      - Minimal vocabulary (3-5 terms)
      - Single-line reflection
      - Use smaller font if needed (10-11pt)
      - Avoid multi-part questions
      - No extended challenge section
      - Keep all content extremely concise — every line counts`
      : targetPages === 2
      ? `PAGE LIMIT: This worksheet MUST fit on approximately 2 printed A4 pages. Standard amount of content — 15–20 questions, full worked example, vocabulary, and reflection. Do NOT exceed 2 pages.`
      : targetPages === 3
      ? `PAGE LIMIT: This worksheet MUST fill approximately 3 printed A4 pages. Include extra questions, extended worked examples, more word problems, and a detailed challenge section. 25–35 questions total. Do NOT exceed 3 pages.`
      : `PAGE LIMIT: This worksheet MUST fill approximately ${targetPages} printed A4 pages. Scale the number of questions, examples, and sections proportionally — roughly ${Math.round(targetPages * 12)} questions total, with ${targetPages > 4 ? 'multiple extended' : 'full'} sections, worked examples, and word problems. Do NOT exceed ${targetPages} pages.`
    : `Each section of the worksheet should be concise and ideally fit on a single page.`; // No constraint

  // ── Reading age override ───────────────────────────────────────────────────
  const readingAge = params.readingAge || 0; // 0 = match year group naturally
  const getReadingAgeNote = (age: number): string => {
    if (age <= 0) return ``;
    if (age <= 5) return `READING AGE 5: Use the very simplest words a young child knows. Maximum 4–5 words per sentence. Only single-syllable or very familiar two-syllable words. One idea per sentence. No technical vocabulary at all — describe everything using the most basic everyday words. Use pictures/emoji cues where possible.`;
    if (age <= 6) return `READING AGE 6: Very short sentences (4–6 words). Only the most common everyday words. One instruction per sentence. No compound sentences. Explain all subject words using the simplest possible terms.`;
    if (age <= 7) return `READING AGE 7: Use very short sentences (5–8 words max). Only simple, common everyday words. One instruction per sentence. No compound or complex sentences. Define ALL subject terms using the simplest possible words. Vocabulary definitions must use words a 7-year-old would know. Avoid any abstract language.`;
    if (age <= 8) return `READING AGE 8: Short sentences (6–9 words). Common vocabulary with simple explanations for any subject terms. Simple compound sentences allowed. Concrete, tangible language — avoid abstract concepts.`;
    if (age <= 9) return `READING AGE 9: Use short, clear sentences (8–12 words). Everyday vocabulary throughout. Simple compound sentences allowed. Define every technical term in brackets immediately after first use. Vocabulary definitions should use plain, concrete language a 9-year-old would understand.`;
    if (age <= 10) return `READING AGE 10: Sentences of 8–13 words. Accessible vocabulary with definitions for subject-specific terms. Mix of simple and compound sentences. Clear, direct instructions.`;
    if (age <= 11) return `READING AGE 11: Use moderate sentences (10–15 words). Subject vocabulary with brief, clear definitions. Some complex sentences acceptable. Direct, clear instructions. Vocabulary should be accessible to an average 11-year-old reader.`;
    if (age <= 12) return `READING AGE 12: Sentences of 10–16 words. Good vocabulary range including subject-specific terms with brief definitions. Varied sentence structures. Clear academic language.`;
    if (age <= 13) return `READING AGE 13: Use standard academic language appropriate for a 13-year-old. Technical vocabulary expected with concise definitions. Multi-clause sentences acceptable. GCSE-level command words (describe, explain, evaluate) can be used.`;
    if (age <= 14) return `READING AGE 14: Confident academic language. Technical vocabulary used naturally. Complex sentence structures. GCSE command words throughout. Analytical language expected.`;
    if (age <= 15) return `READING AGE 15: Advanced secondary-level language. Rich vocabulary, complex sentence structures, nuanced expression. GCSE/A-Level standard language throughout.`;
    if (age <= 16) return `READING AGE 16: A-Level standard language. Sophisticated vocabulary, complex analytical language, mature academic expression. High-level command words (analyse, evaluate, synthesise, justify).`;
    return `READING AGE 17+: University-entrance standard language. Highly sophisticated vocabulary, mature complex academic expression, analytical and evaluative depth. Expect the reader to handle dense, complex text with ease.`;
  };
  const readingAgeNote = getReadingAgeNote(readingAge);

  // ── Subject display (capitalised) ──────────────────────────────────────────
  const subjectDisplay = params.subject
    ? params.subject.charAt(0).toUpperCase() + params.subject.slice(1)
    : params.subject;

  // ── Maths-specific instruction ────────────────────────────────────────
  const isScienceOrMaths = isMaths || params.subject.toLowerCase().includes('science') || params.subject.toLowerCase().includes('physics') || params.subject.toLowerCase().includes('chemistry') || params.subject.toLowerCase().includes('biology');

  // ── Maths topic → specification skill mapping ──
  // This tells the AI exactly what calculation skill each topic should test,
  // so it generates specification-aligned calculation questions rather than
  // generic "explain" prose questions.
  const mathsSpecSkillForTopic = (topic: string, yr: number): string => {
    const t = topic.toLowerCase();
    // Number & arithmetic
    if (/fraction/.test(t)) return "adding, subtracting, multiplying, dividing fractions and mixed numbers; finding fractions of amounts; simplifying";
    if (/decimal/.test(t)) return "ordering decimals; +,−,×,÷ with decimals; converting between decimals/fractions/percentages";
    if (/percent/.test(t)) return "percentage of an amount; percentage increase/decrease using multipliers; reverse percentages; compound interest";
    if (/ratio/.test(t)) return "simplifying ratios; sharing in a ratio; using ratios to solve word problems; converting ratios to fractions";
    if (/proportion/.test(t)) return "direct and inverse proportion; best-buy problems; recipe scaling; unitary method";
    if (/round|estim|significant/.test(t)) return "rounding to decimal places and significant figures; estimating calculations; error bounds";
    if (/indices|power|standard form/.test(t)) return "laws of indices; negative and fractional indices; standard form × and ÷; converting to/from standard form";
    if (/surd/.test(t)) return "simplifying surds; rationalising the denominator; adding/subtracting/multiplying surds";
    if (/prime|hcf|lcm|factor|multiple/.test(t)) return "prime factorisation; HCF and LCM using Venn/product of primes";
    // Algebra
    if (/expand|bracket/.test(t)) return "expanding single, double and triple brackets; collecting like terms";
    if (/factori[sz]/.test(t)) return "factorising linear expressions; factorising quadratics (including a>1); difference of two squares";
    if (/solv.*equation|linear equation|equations/.test(t)) return "solving linear equations (1-step, 2-step, with brackets, with unknowns both sides, fractions)";
    if (/quadratic/.test(t)) return "solving quadratics by factorising, completing the square, and the quadratic formula; using the discriminant b\u00b2\u22124ac to determine the number of real roots; finding roots from a sketched or plotted parabola (graphical solutions, AQA A18)";
    if (/simultaneous/.test(t)) return "solving simultaneous equations by substitution and elimination; solving one linear + one quadratic";
    if (/inequalit/.test(t)) return "solving linear inequalities; representing solutions on a number line; quadratic inequalities";
    if (/sequence|nth term/.test(t)) return "finding the nth term of a linear sequence; quadratic sequences; Fibonacci-type sequences";
    if (/formula|rearrang|subject/.test(t)) return "substituting values into formulae; rearranging formulae to change the subject";
    if (/straight line|y\s*=\s*mx|gradient|linear graph/.test(t)) return "finding the gradient and y-intercept; writing equations y=mx+c; parallel and perpendicular lines";
    if (/quadratic graph|parabola/.test(t)) return "plotting quadratic graphs; finding roots, turning point and line of symmetry";
    if (/graph.*function|cubic|reciprocal|exponential/.test(t)) return "plotting and interpreting non-linear graphs; recognising function shapes";
    // Geometry & measure
    if (/angle/.test(t)) return "angle rules (straight line, around a point, parallel lines, in polygons); reasons for each step";
    if (/pythag/.test(t)) return "using Pythagoras' theorem to find missing sides in right-angled triangles; including 3D Pythagoras";
    if (/trigon|sin|cos|tan/.test(t)) return "SOHCAHTOA — finding missing sides and angles; exact trig values; sine/cosine rule; area = ½ab sin C";
    if (/area|perimeter/.test(t)) return "area and perimeter of rectangles, triangles, parallelograms, trapezia, compound shapes";
    if (/circle|circumference/.test(t)) return "area and circumference of circles; arc length and sector area; circle theorems";
    if (/volume|surface area|prism|cylinder|sphere|cone/.test(t)) return "volume and surface area of cubes, cuboids, prisms, cylinders, spheres, cones, pyramids";
    if (/transform|translat|rotat|reflect|enlarg/.test(t)) return "describing and performing translations, rotations, reflections, enlargements (including negative/fractional scale factor)";
    if (/similar|congruen/.test(t)) return "proving congruence; using similarity to find missing sides; ratio of areas and volumes";
    if (/vector/.test(t)) return "column vectors; vector addition/subtraction; scalar multiplication; vector geometry proofs";
    if (/bearing/.test(t)) return "measuring and calculating bearings; using bearings in combination with trigonometry";
    if (/loci|construction/.test(t)) return "ruler-and-compass constructions; loci (equidistant from points/lines)";
    // Statistics & probability
    if (/mean|median|mode|range|average/.test(t)) return "calculating mean, median, mode, range from lists and frequency tables; estimated mean from grouped data";
    if (/probabilit/.test(t)) return "calculating probabilities; tree diagrams; conditional probability; Venn diagram probability";
    if (/histogram/.test(t)) return "frequency density (frequency ÷ class width); drawing and interpreting histograms";
    if (/scatter|correlat/.test(t)) return "plotting scatter graphs; line of best fit; describing correlation; using to predict values";
    if (/pie chart/.test(t)) return "calculating angles for a pie chart (frequency/total × 360); drawing pie charts; interpreting pie charts";
    if (/cumulative/.test(t)) return "drawing cumulative frequency curves; finding median, quartiles, IQR; box plots";
    // Primary topics
    if (/multiply|division|addition|subtract|arithmetic/.test(t) && yr <= 6) return "column addition/subtraction; short/long multiplication; short/long division with numbers appropriate to year group";
    if (/time|clock/.test(t) && yr <= 6) return "reading analogue/digital clocks; converting between 12/24 hour; calculating time intervals";
    if (/money/.test(t) && yr <= 6) return "adding and subtracting money amounts; calculating change; solving multi-step money word problems";
    if (/shape|2d|3d/.test(t) && yr <= 6) return "identifying and describing 2D/3D shapes by their properties (sides, vertices, faces, edges)";
    return `specification-level calculation skills for "${topic}" appropriate to ${yr <= 6 ? "primary KS" + (yr <= 2 ? "1" : "2") : "GCSE/KS3"} level`;
  };

  const mathsSpecSkill = isMaths ? mathsSpecSkillForTopic(params.topic, yearNum) : "";

  // ── Maths layout contract (Fluency / Reasoning / Problem Solving) ─────────
  // Adds a layout spine to maths worksheets that teachers specifically asked
  // for: Fluency → Reasoning → Problem Solving, section-level guidance (not
  // per question), mixed-number subtraction rule for the worked example,
  // year-group lock, and question wording cap. This block is appended to
  // mathsNote below so the generator sees it INSIDE the main maths block.
  const yearNumForLock = (parseInt((params.yearGroup || "").replace(/\D/g, ""), 10) || 0);
  const yearLockClause = yearNumForLock > 0
    ? `
YEAR-GROUP LOCK (NON-NEGOTIABLE):
- Every heading, worked example, real-world context, and teacher note must use exactly "${params.yearGroup}". Never mix year groups — do NOT reference another year on the same sheet (e.g. do not write "Year 9" then "Year 11" elsewhere).
- Difficulty must match ${params.yearGroup} specifically. If you believe the topic fits a different year group, generate it at the level the user asked for; do NOT silently upgrade or downgrade.`
    : "";

  const mathsLayoutContract = isMaths ? `

MATHS WORKSHEET LAYOUT CONTRACT (MANDATORY — applies to EVERY maths worksheet):

SECTION SPINE — rename and rebalance sections:
- Section 1 label on the pupil-facing page: "Fluency — Core Practice" (single-skill, no context, 3 questions).
- Section 2 label on the pupil-facing page: "Reasoning — Show Your Thinking" (2–3 step questions that test the same skill in a new form or ask 'show that').
- Section 3 label on the pupil-facing page: "Problem Solving — Apply It" (worded, multi-step, exam-style, 3 questions).
- Do NOT keep the legacy labels "Recall / Understanding / Application / Analysis" on maths sheets — Fluency / Reasoning / Problem Solving is the White Rose / CGP convention UK teachers expect.

INSTRUCTION BOX POLICY — reduce cognitive load:
- Place the section instructions ONCE at the top of each section (two lines maximum). Do NOT repeat instruction language ('Read the question carefully…', 'Show all your working…') on every question.
- Do NOT emit a "WORKING OUT" caption on every question. The renderer provides the working space automatically.
- No "READING SUPPORT" or "HINTS" boxes in between questions. If a hint is needed put it in a single small panel at the top of the relevant section.
- Each section's opening panel fits into 2 lines maximum; all other per-question text is the question itself.

QUESTION WORDING CAP:
- Every maths question (including worded problems) must be written in 25 words or fewer. Keep the numbers and the operation prominent in the first sentence. Canonical style: "A jacket costs £75. It has 20% off. Work out the sale price." Match that register.
- Never re-state the method inside the question. The method belongs in the worked example at the top of the page, not inside each question.

WORKED EXAMPLE — STRICT FORMAT:
- The worked example shows at most 4 numbered steps. Each step is one short line (max 15 words). No narrative sentences, no "This is because…" paragraphs inside the worked example.
- For MIXED-NUMBER ARITHMETIC (add / subtract / multiply / divide of mixed numbers) the worked example MUST use this canonical method, in this exact order:
    Step 1: Convert every mixed number to a top-heavy fraction using "whole × denominator + numerator, over the same denominator". Show the calculation inline, e.g. \\(3\\tfrac{1}{4} = \\dfrac{3 \\times 4 + 1}{4} = \\dfrac{13}{4}\\).
    Step 2: Put the fractions over a common denominator (if needed) and carry out the operation.
    Step 3: Simplify and, if appropriate, convert back to a mixed number.
    Step 4 (optional): State the answer with the correct form.
- For OTHER topics (linear equations, percentages, area, etc.) the same 4-step cap applies — Identify / Substitute / Calculate / Answer — no narrative.
- NEVER produce a worked example with a mathematical error. Double-check every substitution before emitting.
${(params.difficulty === 'higher' || params.difficulty === 'stretch') ? `
EXTENDED-TIER WORKED EXAMPLE — THOUGHT-PROCESS COLUMN (MANDATORY for "${params.yearGroup}" Higher / Extended sheets):
- Render the worked example as a TWO-COLUMN structure. Left column: the calculation step (as above, max 15 words, LaTeX-wrapped). Right column header: "Thought Process".
- Each Thought-Process cell answers WHY this method was chosen, not how it works. Examples teachers expect to see:
    * Quadratics: "Coefficient of \\(x^{2}\\) is 1 and the constant factorises cleanly into a pair that sums to b — factorising is faster than the formula here."
    * Quadratics: "The discriminant \\(b^{2}-4ac\\) is not a perfect square, so factorising will fail. Use the quadratic formula."
    * Completing the square: "We need the vertex form \\((x+p)^{2}+q\\) to find the turning point — completing the square is the only method that exposes \\((p, q)\\)."
- Render the two columns as a markdown-style table OR as paragraph pairs labelled "Step n:" and "Why:". Do NOT collapse to a single column on Extended sheets.
- This column is REQUIRED on Higher / Extended worksheets and FORBIDDEN on Foundation / Access worksheets (where the simpler 4-step format is correct).` : ''}

PROGRESSION — smooth, not jumpy:
- Within each section questions escalate in small increments. Do not jump from a 1-step Fluency question straight to a multi-step Problem Solving question inside the same section.
- If a Problem Solving section would be too big a leap, add ONE medium 'bridge' question as the first item in Problem Solving.

VISUAL DENSITY — print-ready polish:
- No repeated headings, no decorative framing around every question, no duplicated footers or branding on mid-sheet pages.
- Answer spaces: 3–4 ruled lines for Fluency, a small working-out area for Reasoning, and a larger working-out area only for Problem Solving.
- Wide outer margins. Bold section headings. Aligned numbering.
${yearLockClause}` : "";

  // ── Science layout contract (applies to science/biology/chemistry/physics) ─
  // Teachers flagged: duplicated 'WHAT YOU NEED TO DO' boxes, irrelevant
  // computing diagrams, cluttered vocabulary tables, MCQ with multiple ticks,
  // bloated word bank, and bloated reflection. This block addresses each.
  const scienceLayoutContract = isScience ? `

SCIENCE WORKSHEET LAYOUT CONTRACT (MANDATORY — applies to EVERY science worksheet):

INSTRUCTION BOX POLICY — remove duplication:
- Place section instructions ("Show your working.") ONCE at the top of the section. NEVER repeat a 'WHAT YOU NEED TO DO' box under every question.
- Do NOT include a 'Read the question exactly as written' or similar generic instruction under individual questions. Per-question instructions come only from the question itself.
- If SEND scaffolding adds per-question support boxes they sit AFTER each question; the overlay engine owns those, not the prompt.

VOCABULARY — simple two-column list:
- Emit Key Vocabulary as a simple two-column list: one line per term in the format "Term — plain-English definition". Each definition fits on one line.
- Do NOT emit an empty-cell grid or a 4-column table. Max 8 terms; no duplicates.

MCQ — EXACTLY ONE CORRECT ANSWER:
- Every MCQ has EXACTLY ONE correct option. Distractors must be plausible misconceptions, not obviously wrong.
- Mark ONLY the correct option with ✓ at the end of its line. Do not tick more than one option. Never pre-fill any other option.

GAP FILL / WORD BANK:
- The word bank has EXACTLY 8–10 words. Every word appears at MOST ONCE. Do not include filler synonyms (e.g. 'push' and 'pull' must not both appear twice).
- The gap fill paragraph uses exactly the same words that appear in the word bank — no extras, no repeats inside the paragraph.

WORKED EXAMPLE — BULLET STEPS:
- Worked example is a sequence of at most 5 bullet steps with bold labels: "**Forces acting:** …", "**Effect:** …", "**Calculation:** …", "**Answer:** …". No narrative paragraphs.

EXTENDED ANSWER QUESTIONS — LEAN:
- Give each extended answer question one sentence of instruction and 3–4 ruled lines for response. Do NOT place a 'WHAT YOU NEED TO DO' block under these questions.

DIAGRAM SUBJECT-LOCK (CRITICAL — this is the bug the teacher flagged):
- Every diagram emitted on a science worksheet MUST be from the science domain. ALLOWED diagram types for science: labeled (cell/organ/apparatus), circuit (electricity topics ONLY), flow (process/sequence), cycle (water/rock/nitrogen/life), bar/axes/number-line (data), pyramid (ecological/energy), venn (classification), timeline (history of science where topic genuinely warrants it).
- FORBIDDEN diagram types on a science worksheet: anything that belongs to a different subject. In particular, do NOT emit "computer-architecture", "big-o-notation", "binary-representation", or any other computing / algorithm / programming diagram on a biology / chemistry / physics / combined-science sheet. If a topic does not have a relevant second diagram, emit Diagram B with content "[skipped — topic does not require a second visual]".

REFLECTION + EXIT TICKET + REVISION TIPS — MANDATORY:
- Every science worksheet must end with a Self-Reflection block (5 confidence rows + 3 written prompts + EXIT_TICKET line), a separate Revision Tips block (5 examiner-voice tips: command-word, watch-out, method, mark-scheme, time), and these two must appear on the pupil-facing page (NOT teacher-only). Sciences method-tip = "include units before rounding"; for combined-science calculation topics, also remind pupils to convert to SI units before substituting.` : "";

  const mathsNote = isMaths
    ? `MATHS — SPECIFICATION-ALIGNED CALCULATION PRACTICE (MANDATORY):

This is a MATHEMATICS worksheet. EVERY question (excluding vocabulary, worked example, and learning objective sections) MUST be a calculation question — never a "write an essay about..." or "explain in your own words..." question.

TARGET SKILL for "${params.topic}": ${mathsSpecSkill}

FLUENCY / REASONING / PROBLEM-SOLVING (FRP) BALANCE — MANDATORY (FEAT-PC8):
National Curriculum and AQA/Edexcel/OCR GCSE specifications require an explicit FRP mix on every Y9+ maths sheet. Across the 9 main questions you MUST include AT LEAST:
  - 4 fluency questions  — pure procedural calculation; "Calculate", "Work out", "Simplify", "Round", "Convert".
  - 3 reasoning questions — "Show that …", "Explain why …", "Justify …", "Prove …", "Give a reason …". The pupil must defend a mathematical claim, not just compute.
  - 2 problem-solving questions — multi-step real-world problems where the pupil chooses the method (multi-part (a)(b)(c), "Hence", "Use your answer from part (a) to find …", monetary / distance / recipe contexts).
Do NOT collapse all 9 questions into procedural calculation; a pure-fluency sheet fails the spec. Spread the strands across Sections 1–3 (recall + understanding + application) — Section 1 may be heavier on fluency, Section 2 on reasoning, Section 3 on problem-solving.

ABSOLUTE RULES:
1. Every question must START with one of these calculation verbs: Calculate, Work out, Find, Solve, Evaluate, Simplify, Expand, Factorise, Substitute, Show that, Prove, Write, Express, Round.
2. FORBIDDEN question stems in maths worksheets: "Explain why…", "Describe how…", "Discuss the…", "Give reasons for…", "What is the meaning of…", "In your own words…". These are writing questions — DO NOT use them. EXCEPTION: the FRP reasoning strand allows the specific mathematical command words "Show that", "Prove", "Justify", and "Give a reason" — these are mathematical reasoning, not prose.
3. Every question must contain REAL NUMBERS or REAL EXPRESSIONS to work with. Not "a number" — always "24", "3.7", "\\(x^{2} + 5x - 14\\)", "(2, 5)", "£85".
4. Use LaTeX \\(...\\) for ALL expressions: \\(\\dfrac{3}{4}\\) NOT 3/4; \\(x^{2}\\) NOT x²; \\(\\sqrt{16}\\) NOT √16; \\(\\times\\) NOT ×; \\(\\div\\) NOT ÷; \\(\\pi\\) NOT π. STRICT LATEX RULE: NEVER write x^2, x**2, x squared as plain text — even inside the Common Mistakes section, Teacher Notes, or any prose block. The ONLY accepted form for "x squared" anywhere on the worksheet is \\(x^{2}\\). Same for cubes (\\(x^{3}\\)), square roots (\\(\\sqrt{x}\\)), fractions (\\(\\dfrac{a}{b}\\)) and the quadratic-formula discriminant (\\(b^{2}-4ac\\)). Treat any caret (^) outside math delimiters as a generation error.
5. NEVER use \\text{} or \\mathrm{} — write units as plain text OUTSIDE math delimiters (e.g. "\\(F = ma\\) where F is in N, m in kg, a in m/s²").
6. Every answer must be a NUMBER, EXACT FRACTION, SURD, ALGEBRAIC EXPRESSION or COORDINATE — NOT a paragraph of prose. (Reasoning answers are short sentences anchored to a calculation, not free essay.)
7. Progression: Section 1 (Q1–3) uses single-step calculations with simple numbers; Section 2 (Q4–6) uses multi-step calculations in context; Section 3 (Q7–9) uses exam-style multi-step problems with worded context.
8. Every mark-scheme entry must show the FULL method (M marks) and the correct final answer (A marks). Award method marks separately from accuracy marks.
9. Context in word problems: use realistic UK contexts (shopping, distances, time, recipes, sports scores, surveys, building, travel) — make numbers genuinely meaningful, not arbitrary.
10. Worked example MUST show step-by-step calculation with annotations explaining each step — no prose, just clearly numbered calculation steps.${mathsLayoutContract}`
    : isScience
    ? `Science: Use LaTeX \\(...\\) for equations e.g. \\(F = ma\\), \\(E = mc^{2}\\), \\(v = u + at\\). CRITICAL RULES: (1) NEVER use \\text{} or \\mathrm{} — write units as plain text outside math e.g. "\\(F = ma\\) where F is in N". (2) Write chemical formulas with subscript numbers: H₂O, CO₂, H₂SO₄, NaCl. (3) For scientific notation write "6.02 × 10²³" or \\(6.02 \\times 10^{23}\\). (4) Units: write as plain text — m/s, m/s², N, kg, J, W, Pa, mol, dm³, cm³, °C, K.${scienceLayoutContract}${yearLockClause}`
    : isScienceOrMaths
    ? `Science: Use LaTeX \\(...\\) for equations e.g. \\(F = ma\\), \\(E = mc^{2}\\), \\(v = u + at\\). CRITICAL RULES: (1) NEVER use \\text{} or \\mathrm{} — write units as plain text outside math e.g. "\\(F = ma\\) where F is in N". (2) Write chemical formulas with subscript numbers: H₂O, CO₂, H₂SO₄, NaCl. (3) For scientific notation write "6.02 × 10²³" or \\(6.02 \\times 10^{23}\\). (4) Units: write as plain text — m/s, m/s², N, kg, J, W, Pa, mol, dm³, cm³, °C, K.${yearLockClause}`
    : `Use LaTeX \\(...\\) for any math expressions. Write units as plain text (e.g. "25 m/s" not "\\text{m/s}").${yearLockClause}`;

  // ── SVG Diagram injection note ──────────────────────────────────────────────
  // Subjects where inline diagrams add genuine value
  const diagramSubjects = ["science", "biology", "chemistry", "physics", "geography", "maths", "mathematics", "design", "engineering", "history", "english", "drama", "religious", "re", "rs", "economics", "business", "computing", "ict"];
  const isDiagramSubject = diagramSubjects.some(s => subjectLower.includes(s));
  const isVI = hasSend && !!(params.sendNeed?.toLowerCase().includes("vi") || params.sendNeed?.toLowerCase().includes("visual impair"));

  // ── Dynamic diagram type selection based on subject + topic ─────────────────
  // Comprehensive topic-specific mapping covering all subjects (primary + secondary).
  // New types: venn, timeline, pyramid, fraction-bar.
  // Diagrams are for LABELLING — students see numbered blanks, not answers.
  function getDiagramForTopic(subject: string, topic: string): { type: string; instruction: string; example: string } {
    const s = subject.toLowerCase();
    const t = topic.toLowerCase();

    // ── PHYSICS: Electricity/Circuits → circuit diagram ──
    if (/circuit|electric|voltage|current|resist|ohm|component|series|parallel|ammeter|voltmeter/.test(t)) {
      const layout = /parallel/.test(t) ? 'parallel' : 'series';
      return {
        type: 'circuit',
        instruction: `Label the circuit diagram. Write the correct component name next to each number.`,
        example: `[[DIAGRAM:{"type":"circuit","layout":"${layout}","labels":[{"text":"Battery","x":10,"y":50},{"text":"Switch","x":50,"y":10},{"text":"Bulb","x":90,"y":50},{"text":"Resistor","x":50,"y":90},{"text":"Ammeter","x":30,"y":30}]}]]`
      };
    }

    // ── BIOLOGY: Cycles → cycle diagram ──
    if (/nitrogen cycle|carbon cycle|water cycle|rock cycle|life cycle|menstrual cycle|cell cycle|krebs/.test(t)) {
      return {
        type: 'cycle',
        instruction: `Label each stage of the cycle diagram with the correct term.`,
        example: `[[DIAGRAM:{"type":"cycle","title":"${topic}","steps":["Stage 1","Stage 2","Stage 3","Stage 4"]}]]`
      };
    }

    // ── BIOLOGY: Processes → flow diagram ──
    if (/photosynthe|respirat|digestio|food chain|food web|mitosis|meiosis|ferment|decompos|excret|osmo|diffus/.test(t)) {
      return {
        type: 'flow',
        instruction: `Label each step of the process diagram with the correct term.`,
        example: `[[DIAGRAM:{"type":"flow","title":"${topic}","steps":["Step 1","Step 2","Step 3","Step 4","Step 5"]}]]`
      };
    }

    // ── BIOLOGY: Classification/Comparison → venn diagram ──
    if (/classif|vertebrate|invertebrate|prokaryot|eukaryot|plant.*animal|animal.*plant|compare.*cell|aerobic.*anaerobic|anaerobic.*aerobic/.test(t) && /bio|science/.test(s)) {
      return {
        type: 'venn',
        instruction: `Sort the items into the correct region of the Venn diagram.`,
        example: `[[DIAGRAM:{"type":"venn","title":"${topic}","setA":"Group A","setB":"Group B","onlyA":["item 1","item 2"],"overlap":["shared item"],"onlyB":["item 3","item 4"]}]]`
      };
    }

    // ── BIOLOGY: Structures → labeled anatomy diagram ──
    if (/cell|heart|lung|eye|ear|brain|kidney|leaf|flower|root|stem|organ|skeleton|muscle|tooth|skin|nervous|circulat|reproductive|immune|endocrine/.test(t) && /bio|science/.test(s)) {
      return {
        type: 'labeled',
        instruction: `Label the diagram. Write the correct name for each numbered part.`,
        example: `[[DIAGRAM:{"type":"labeled","title":"${topic}","labels":[{"text":"Use REAL term A from ${topic}","x":20,"y":25},{"text":"Real term B","x":80,"y":25},{"text":"Real term C","x":20,"y":60},{"text":"Real term D","x":80,"y":60},{"text":"Real term E","x":50,"y":85}]}]]`
      };
    }

    // ── BIOLOGY: Ecology pyramids → pyramid diagram ──
    if (/pyramid.*number|pyramid.*biomass|pyramid.*energy|trophic|food pyramid|ecological pyramid/.test(t)) {
      return {
        type: 'pyramid',
        instruction: `Label each level of the pyramid with the correct term.`,
        example: `[[DIAGRAM:{"type":"pyramid","title":"${topic}","levels":["Top predator","Secondary consumer","Primary consumer","Producer"]}]]`
      };
    }

    // ── CHEMISTRY: Atom/Bonding → labeled diagram ──
    if (/atom|electron|proton|neutron|ionic|covalent|bond|molecule|element|compound|periodic|shell|ion|isotope/.test(t)) {
      return {
        type: 'labeled',
        instruction: `Label the diagram. Write the correct term next to each numbered part.`,
        example: `[[DIAGRAM:{"type":"labeled","title":"${topic}","labels":[{"text":"Use REAL chemistry term from ${topic}","x":50,"y":15},{"text":"Real term 2","x":85,"y":50},{"text":"Real term 3","x":50,"y":85},{"text":"Real term 4","x":15,"y":50}]}]]`
      };
    }

    // ── CHEMISTRY: Reactions/States → flow diagram ──
    if (/reaction|state|solid|liquid|gas|evaporat|condens|melt|freez|dissolv|separat|distill|filtrat|chromatog|electrolys|oxidat|reduct|neutralis|combust|thermal decomp/.test(t)) {
      return {
        type: 'flow',
        instruction: `Label each stage of the process diagram with the correct term.`,
        example: `[[DIAGRAM:{"type":"flow","title":"${topic}","steps":["Stage 1","Stage 2","Stage 3","Stage 4"]}]]`
      };
    }

    // ── MATHS: Fractions (primary) → fraction-bar diagram ──
    if (/fraction/.test(t) && /math/.test(s) && isPrimary) {
      return {
        type: 'fraction-bar',
        instruction: `Look at the fraction bar. What fraction is shaded?`,
        example: `[[DIAGRAM:{"type":"fraction-bar","title":"${topic}","numerator":3,"denominator":4,"fractionLabel":"3/4"}]]`
      };
    }

    // ── MATHS: Fractions/Decimals/Percentages → number-line ──
    if (/fraction|decimal|percent|number line|ordering|place value|rounding|negative number|integer/.test(t) && /math/.test(s)) {
      return {
        type: 'number-line',
        instruction: `Identify the values at each marked position on the number line.`,
        example: `[[DIAGRAM:{"type":"number-line","title":"${topic}","start":0,"end":10,"marked":[2,5,7]}]]`
      };
    }

    // ── MATHS: Geometry/Shapes → labeled diagram ──
    if (/circle|triangle|angle|polygon|quadrilateral|area|perimeter|pythag|trigon|shape|symmetry|transform|rotation|reflect|parallel.*line|perpendicular|bisect|locus|bearing/.test(t) && /math/.test(s)) {
      return {
        type: 'labeled',
        instruction: `Label the diagram. Write the correct mathematical term next to each numbered part.`,
        example: `[[DIAGRAM:{"type":"labeled","title":"${topic}","labels":[{"text":"Use REAL maths term from ${topic}","x":50,"y":10},{"text":"Real term 2","x":85,"y":50},{"text":"Real term 3","x":50,"y":90},{"text":"Real term 4","x":15,"y":50}]}]]`
      };
    }

    // ── MATHS: Statistics/Data → bar chart ──
    if (/statistic|data|graph|chart|frequen|average|mean|median|mode|range|probabilit|pie chart|bar chart|histogram|tally|scatter|correlation|cumulative/.test(t) && /math/.test(s)) {
      return {
        type: 'bar',
        instruction: `Study the bar chart and answer the questions.`,
        example: `[[DIAGRAM:{"type":"bar","title":"${topic}","bars":[{"label":"Category A","value":15},{"label":"Category B","value":23},{"label":"Category C","value":8},{"label":"Category D","value":31}],"xLabel":"Category","yLabel":"Frequency"}]]`
      };
    }

    // ── MATHS: Coordinates/Algebra → axes ──
    if (/coordinate|plot|graph|linear|quadratic|equation|y\s*=|gradient|intercept|simultaneous|inequalit|function|cubic|exponential|reciprocal/.test(t) && /math/.test(s)) {
      return {
        type: 'axes',
        instruction: `Use the coordinate grid to answer the questions.`,
        example: `[[DIAGRAM:{"type":"axes","title":"${topic}","xLabel":"x","yLabel":"y"}]]`
      };
    }

    // ── PHYSICS: Forces/Motion/Energy → labeled or flow ──
    if (/force|motion|speed|velocity|accelerat|momentum|energy|wave|magnet|gravity|friction|pressure|density|moment|lever|pulley/.test(t) && !(/circuit|electric/.test(t))) {
      return {
        type: 'labeled',
        instruction: `Label the diagram. Write the correct term next to each numbered arrow or part.`,
        example: `[[DIAGRAM:{"type":"labeled","title":"${topic}","labels":[{"text":"Use REAL physics term from ${topic}","x":50,"y":10},{"text":"Real term 2","x":88,"y":50},{"text":"Real term 3","x":50,"y":88},{"text":"Real term 4","x":12,"y":50},{"text":"Real term 5","x":50,"y":50}]}]]`
      };
    }

    // ── PHYSICS: Nuclear/Radioactivity → flow ──
    if (/radioact|nuclear|decay|half.life|alpha|beta|gamma|fission|fusion/.test(t)) {
      return {
        type: 'flow',
        instruction: `Label each stage of the process diagram with the correct term.`,
        example: `[[DIAGRAM:{"type":"flow","title":"${topic}","steps":["Stage 1","Stage 2","Stage 3","Stage 4"]}]]`
      };
    }

    // ── GEOGRAPHY: Physical features → labeled diagram ──
    if (/volcano|earthquake|tectonic|plate|erosion|deposition|river|coast|glacier|weather|climate|biome|ecosystem|rainforest|desert|ocean|meander|oxbow|waterfall|cave|stack|spit|delta/.test(t)) {
      return {
        type: 'labeled',
        instruction: `Label the diagram. Write the correct geographical term next to each numbered feature.`,
        example: `[[DIAGRAM:{"type":"labeled","title":"${topic}","labels":[{"text":"Use REAL geography term from ${topic}","x":25,"y":20},{"text":"Real term 2","x":75,"y":20},{"text":"Real term 3","x":25,"y":70},{"text":"Real term 4","x":75,"y":70},{"text":"Real term 5","x":50,"y":45}]}]]`
      };
    }

    // ── GEOGRAPHY: Human/processes → flow diagram ──
    if (/population|migration|urbanis|globalisation|development|trade|sustainability|resource|farming|industry|deforestation|desertification/.test(t) && /geog/.test(s)) {
      return {
        type: 'flow',
        instruction: `Label each stage of the process diagram with the correct term.`,
        example: `[[DIAGRAM:{"type":"flow","title":"${topic}","steps":["Stage 1","Stage 2","Stage 3","Stage 4"]}]]`
      };
    }

    // ── GEOGRAPHY: Development comparison → venn diagram ──
    if (/compare.*countr|developed.*developing|hic.*lic|urban.*rural|rural.*urban/.test(t) && /geog/.test(s)) {
      return {
        type: 'venn',
        instruction: `Sort the features into the correct region of the Venn diagram.`,
        example: `[[DIAGRAM:{"type":"venn","title":"${topic}","setA":"Group A","setB":"Group B","onlyA":["feature 1","feature 2"],"overlap":["shared feature"],"onlyB":["feature 3","feature 4"]}]]`
      };
    }

    // ── ENGLISH LITERATURE: Character relationships → labeled (character web) ──
    if (/english|literature|drama/.test(s) && /macbeth|hamlet|romeo|juliet|inspector|gatsby|mice|men|mockingbird|christmas carol|jekyll|hyde|frankenstein|pride|prejudice|animal farm|lord of the flies|piggy|ralph|jack|othello|tempest|merchant|twelfth|midsummer|great expectations|oliver twist|jane eyre|wuthering|1984|brave new world/.test(t)) {
      return {
        type: 'labeled',
        instruction: `Label each numbered node of the character web with the correct character name and their role.`,
        example: `[[DIAGRAM:{"type":"labeled","title":"${topic} Characters","labels":[{"text":"Real character name from ${topic}","x":50,"y":10},{"text":"Real character name","x":88,"y":35},{"text":"Real character name","x":75,"y":80},{"text":"Real character name","x":25,"y":80},{"text":"Real character name","x":12,"y":35}]}]]`
      };
    }

    // ── ENGLISH: Themes/Concepts → labeled (theme map) ──
    if (/english|literature|drama/.test(s)) {
      return {
        type: 'labeled',
        instruction: `Label each numbered node with the correct theme, technique, or concept from the text.`,
        example: `[[DIAGRAM:{"type":"labeled","title":"${topic} Themes","labels":[{"text":"Real theme from ${topic}","x":50,"y":10},{"text":"Real theme","x":88,"y":35},{"text":"Real technique","x":75,"y":80},{"text":"Real concept","x":25,"y":80},{"text":"Real theme","x":12,"y":35}]}]]`
      };
    }

    // ── HISTORY: Events/Periods → timeline diagram ──
    if (/history/.test(s)) {
      return {
        type: 'timeline',
        instruction: `Label each event on the timeline with the correct description.`,
        example: `[[DIAGRAM:{"type":"timeline","title":"${topic} Timeline","events":[{"date":"Date 1","label":"Event 1"},{"date":"Date 2","label":"Event 2"},{"date":"Date 3","label":"Event 3"},{"date":"Date 4","label":"Event 4"},{"date":"Date 5","label":"Event 5"}]}]]`
      };
    }

    // ── RE/RS: Comparison of beliefs → venn diagram ──
    if (/religious|re|rs/.test(s) && /compare|similar|differ|christian.*muslim|muslim.*christian|hindu.*buddhist|buddhist.*hindu/.test(t)) {
      return {
        type: 'venn',
        instruction: `Sort the beliefs/practices into the correct region of the Venn diagram.`,
        example: `[[DIAGRAM:{"type":"venn","title":"${topic}","setA":"Religion A","setB":"Religion B","onlyA":["belief 1","belief 2"],"overlap":["shared belief"],"onlyB":["belief 3","belief 4"]}]]`
      };
    }

    // ── RE/RS: General → labeled (concept map) ──
    if (/religious|re|rs/.test(s)) {
      return {
        type: 'labeled',
        instruction: `Label each numbered node with the correct concept, belief, or practice.`,
        example: `[[DIAGRAM:{"type":"labeled","title":"${topic}","labels":[{"text":"Real concept from ${topic}","x":50,"y":10},{"text":"Real belief","x":88,"y":35},{"text":"Real practice","x":75,"y":80},{"text":"Real term","x":25,"y":80}]}]]`
      };
    }

    // ── BUSINESS/ECONOMICS: Hierarchy → pyramid diagram ──
    if (/business|economics/.test(s) && /hierarch|management|organisation|structure|maslow|need/.test(t)) {
      return {
        type: 'pyramid',
        instruction: `Label each level of the pyramid with the correct term.`,
        example: `[[DIAGRAM:{"type":"pyramid","title":"${topic}","levels":["Top level","Second level","Third level","Base level"]}]]`
      };
    }

    // ── BUSINESS/ECONOMICS: Processes → flow diagram ──
    if (/business|economics/.test(s) && /supply chain|production|market|trade|business cycle|economic cycle/.test(t)) {
      return {
        type: 'flow',
        instruction: `Label each stage of the process diagram with the correct term.`,
        example: `[[DIAGRAM:{"type":"flow","title":"${topic}","steps":["Stage 1","Stage 2","Stage 3","Stage 4"]}]]`
      };
    }

    // ── BUSINESS/ECONOMICS: General → labeled ──
    if (/business|economics/.test(s)) {
      return {
        type: 'labeled',
        instruction: `Label each numbered node with the correct business/economics term.`,
        example: `[[DIAGRAM:{"type":"labeled","title":"${topic}","labels":[{"text":"Real term from ${topic}","x":50,"y":10},{"text":"Real term 2","x":88,"y":35},{"text":"Real term 3","x":75,"y":80},{"text":"Real term 4","x":25,"y":80}]}]]`
      };
    }

    // ── COMPUTING/ICT → flow diagram ──
    if (/comput|ict|algorithm|program|code|binary|network|internet|cyber|database/.test(t) || /comput|ict/.test(s)) {
      return {
        type: 'flow',
        instruction: `Label each step of the flowchart with the correct term.`,
        example: `[[DIAGRAM:{"type":"flow","title":"${topic}","steps":["Step 1","Step 2","Step 3","Step 4"]}]]`
      };
    }

    // ── DT/ENGINEERING → labeled diagram ──
    if (/design|engineering|technology|dt/.test(s)) {
      return {
        type: 'labeled',
        instruction: `Label the diagram. Write the correct term next to each numbered part.`,
        example: `[[DIAGRAM:{"type":"labeled","title":"${topic}","labels":[{"text":"Real part from ${topic}","x":50,"y":12},{"text":"Real part 2","x":85,"y":50},{"text":"Real part 3","x":50,"y":88},{"text":"Real part 4","x":15,"y":50}]}]]`
      };
    }

    // ── PRIMARY: Maths shapes/measures → labeled ──
    if (isPrimary && /math/.test(s)) {
      return {
        type: 'labeled',
        instruction: `Label the diagram. Write the correct word next to each number.`,
        example: `[[DIAGRAM:{"type":"labeled","title":"${topic}","labels":[{"text":"Real part from ${topic}","x":50,"y":12},{"text":"Real part 2","x":85,"y":50},{"text":"Real part 3","x":50,"y":88},{"text":"Real part 4","x":15,"y":50}]}]]`
      };
    }

    // ── PRIMARY: Science → labeled ──
    if (isPrimary && /science/.test(s)) {
      return {
        type: 'labeled',
        instruction: `Label the diagram. Write the correct word next to each number.`,
        example: `[[DIAGRAM:{"type":"labeled","title":"${topic}","labels":[{"text":"Real part from ${topic}","x":20,"y":25},{"text":"Real part 2","x":80,"y":25},{"text":"Real part 3","x":20,"y":60},{"text":"Real part 4","x":80,"y":60},{"text":"Real part 5","x":50,"y":85}]}]]`
      };
    }

    // ── DEFAULT: labeled diagram ──
    return {
      type: 'auto',
      instruction: `Label the diagram. Write the correct term next to each number.`,
      example: `[[DIAGRAM:{"type":"labeled","title":"${topic}","labels":[{"text":"Real concept from ${topic}","x":50,"y":10},{"text":"Real belief","x":88,"y":35},{"text":"Real practice","x":75,"y":80},{"text":"Real term","x":25,"y":80}]}]]`
    };
  }

  const diagramSelection = getDiagramForTopic(params.subject, params.topic);

  // Build the Q4 diagram prompt — concise but topic-specific
  const q4DiagramPrompt = (() => {
    const sel = diagramSelection;
    // Single concise instruction: use real terms, match the exact topic
    return `${sel.instruction} [5 marks]\nUse REAL terms from "${params.topic}" — no placeholders.\n${sel.example}\nLABELS: [correct labels separated by |]\nANSWERS: [correct answers separated by |]`;
  })();
  // Q4 sub-question prompt: diagram shown with questions about it (not labelling)
  // For graphical maths topics (coordinates, graphs, statistics), use q-graph type with plot task
  const isGraphingMathsTopic = isMaths && /coordinate|plot|graph|linear|quadratic|gradient|intercept|function|cubic|exponential|scatter|histogram|cumulative|bar chart|pie chart|statistic|data|frequen/.test((params.topic || '').toLowerCase());
  const q4DiagramPromptSubQ = (() => {
    const sel = diagramSelection;
    if (isGraphingMathsTopic) {
      // For graphical maths: give data and ask students to plot a graph
      return `LAYOUT:diagram_subquestions\n${sel.example}\n[5 marks]\n(a) [Question about a specific feature of the ${params.topic} diagram — e.g. read a value, identify a point, describe a trend]. [1 mark]\n(b) [Question requiring interpretation or calculation using the diagram]. [2 marks]\n(c) [Question asking student to extend, predict or apply the diagram to a new value]. [2 marks]\nANSWERS: (a) [answer] (b) [answer with working] (c) [answer]`;
    }
    return `LAYOUT:diagram_subquestions\n${sel.example}\n[5 marks]\n(a) [Identify or name a specific part/feature shown in the diagram — 1 mark]\n(b) [Explain what the diagram shows or describe the process/relationship — 2 marks]\n(c) [Apply knowledge: predict, compare or extend what is shown — 2 marks]\nANSWERS: (a) [answer] (b) [answer] (c) [answer]`;
  })();

  // Diagrams are served from the diagram library only — never AI-generated.
  // After worksheet generation, the caller queries /api/diagram-library/entries
  // to find a matching diagram, then calls /api/ai/diagram-questions to generate
  // dynamic questions based on the diagram description.
  const svgDiagramNote = ``;

  // ── Word problems note ─────────────────────────────────────────────────────
  const wordProblemsNote = !params.examStyle
    ? `Section C: 3–4 real-life word problems using everyday contexts (money, time, sport, cooking). Increase in difficulty; last must be multi-step.`
    : "";

  // ── SEND section title overrides ─────────────────────────────────────────
  // Delegated to client/src/lib/sendPromptFragments.ts so the generator,
  // the server overlay engine, and the client enforcer all agree on the
  // exact strings (otherwise the 3-Q cap enforcer cannot find "Section A").
  const sendSectionTitles = hasSend
    ? getSendSectionTitles(params.sendNeed!)
    : { sectionA: "Section A — Guided Practice", sectionB: "Section B — Core Practice", challenge: "Challenge Question" };

  // ── Exam-style instruction ────────────────────────────────────────────────
  const examStyleNote = params.examStyle
    ? `Exam-style mode: Format like a real ${params.examBoard && params.examBoard !== "none" ? params.examBoard : "GCSE"} paper. Number questions Q1, Q2... with sub-parts (a)(b)(c). Show mark allocations [1 mark]. Use command words. Include answer lines. No worked example section.`
    : "";

  // ── Pillar A — Exam-style instruction blocks for Year 9+ ─────────────────
  // PA#1 — Paper / calculator note. Threads through to the prompt so a Y10
  // maths Paper-1 sheet never emits a calculator-only question.
  const paperCalcNote = (() => {
    const code = params.paper;
    if (!code && typeof params.calculator !== "boolean") return "";
    const parts: string[] = [];
    if (code) parts.push(`Paper code: ${code}.`);
    if (typeof params.calculator === "boolean") {
      parts.push(
        params.calculator
          ? `Calculator: ALLOWED. Questions may require numerical calculation that needs a calculator.`
          : `Calculator: NOT ALLOWED. Every numerical question must be solvable without a calculator (whole numbers, simple fractions, exact surds).`,
      );
    }
    return `Pillar A — paper context: ${parts.join(" ")}`;
  })();

  // PA#1 — exam-stem anchors retrieved from the past-paper bank by
  // (subject, topic, yearGroup, paperCode, calculator). These exemplars
  // anchor the AO/calc/paper conventions of real exams in the prompt so
  // every emitted stem matches the paper's tone.
  const examStemAnchorsBlock = (() => {
    if (!params.examStyle || yearNum < 9) return "";
    try {
      const anchors = getExamStemAnchors({
        subject: params.subject,
        topic: params.topic,
        yearGroup: yearNum,
        paperCode: params.paper,
        calculator: params.calculator,
        board: params.examBoard,
        limit: 2,
      });
      return buildExamStemAnchorBlock(anchors);
    } catch (err) {
      console.warn("[Pillar A] Exam stem anchor fetch failed:", err);
      return "";
    }
  })();

  // PA#2 — 6-mark Levelled Open Response. Forces ONE 6-mark LOR with a
  // Level 1/2/3 grid in the teacher key on Y10/Y11 sci/hum/Eng worksheets.
  const lorBlock = (() => {
    if (yearNum < 10 || yearNum > 11) return "";
    return buildLorBlock({ subject: params.subject, topic: params.topic, board: params.examBoard });
  })();

  // PA#3 — Synoptic / interleaved prior-topic block. Mandates one synoptic
  // question in Section 2 and one in Section 3, each with a metadata.
  // synopticLink field. priorTopics fall back to the legacy recallTopic
  // string for backwards compatibility.
  const effectivePriorTopics = (() => {
    if (params.priorTopics && params.priorTopics.length > 0) {
      return params.priorTopics.slice(0, 3);
    }
    if (params.recallTopic && params.recallTopic.trim().length > 0) {
      return [params.recallTopic.trim()];
    }
    return [] as string[];
  })();
  const synopticBlock = (() => {
    if (yearNum < 10 || yearNum > 11) return "";
    if (effectivePriorTopics.length === 0) return "";
    return [
      `### Pillar A — Synoptic / interleaved prior-topic questions — REQUIRED`,
      `Prior topics (most-recent first): ${effectivePriorTopics.join(", ")}.`,
      `Place ONE synoptic question in Section 2 (Understanding) and ONE in Section 3 (Application & Analysis) that explicitly links the current topic ("${params.topic}") to a prior topic.`,
      `Each synoptic section MUST set a metadata field "synopticLink" to the prior topic name (e.g. "synopticLink": "${effectivePriorTopics[0]}").`,
      `Begin each synoptic question with the phrase "Link to prior learning — ${effectivePriorTopics[0]}:" so teachers can spot them at a glance.`,
    ].join("\n");
  })();

  // PA#4 — Subject-specific exam-paper template. Replaces the generic
  // Section 1/2/3 / Challenge layout for Y10/Y11 exam-style sheets. Only
  // applies when examStyle is true.
  const examPaperTemplateBlock = (() => {
    if (!params.examStyle || yearNum < 10 || yearNum > 11 || !params.paper) return "";
    return buildExamPaperTemplateBlock({
      subject: params.subject,
      yearGroup: params.yearGroup,
      paper: params.paper,
      board: params.examBoard,
    });
  })();

  // ── Reminder box note — DISABLED (not in reference PDFs) ─────────────────
  const reminderBoxNote = "";

  // ── Formula rules (topic-specific only) ──────────────────────────────────
  const formulaNote = `Only include a Key Formulas section if the topic "${params.topic}" genuinely requires a formula. Omit it if no formula is needed.`;

  // ── Common mistakes note ────────────────────────────────────────────────────
  const commonMistakesNote = !params.examStyle
    ? `In Teacher Notes, list 3–4 common mistakes students make with "${params.topic}". Include 1 misconception question in Section B showing wrong working for students to correct.`
    : "";

  // ── Topic enforcement note ─────────────────────────────────────────────────
  const topicEnforcementNote = `Every question, example, vocabulary term, and any diagram must be about "${params.topic}" only.`;
  const dataCompletenessNote = `Every question must be fully usable as written. Do not use placeholders, ellipses, missing values, unfinished lists, or references to unseen data. If a statistics question uses a table, survey, graph, grouped frequency table, histogram, cumulative frequency graph, box plot, or chart, include the complete numeric data needed to answer it directly in the worksheet text.`;
  const graphDrawingNote = (isGraphingMathsTopic && !params.examStyle)
    ? `GRAPH DRAWING REQUIREMENT: Because this is a graphical maths topic ("${params.topic}"), at least ONE question (ideally Q8 or Q9) MUST ask students to plot a graph. Provide a complete set of coordinate pairs or data values (minimum 5 pairs) and ask students to: (1) plot the points on a grid, (2) draw the line/curve, (3) read off a specific value, (4) find the gradient or describe the shape. Use type "q-graph" for this question. The data MUST be specific to "${params.topic}" — real numbers, not placeholders.`
    : ``;
  const diagramRelevanceNote = `DIAGRAM RULE: Diagram A and Diagram B are separate full-page visual reference pages. They are NOT question sections. Do NOT include any questions about diagrams. All questions come only from Sections 1, 2, and 3.`;
  const vocabularyCapNote = `Key Vocabulary must contain at most 5 items.`;

  const recallNote = params.recallTopic ? `RETRIEVAL PRACTICE REQUIRED: After the Learning Objective and BEFORE Key Vocabulary, include a section titled "Retrieval Practice — ${params.recallTopic}" (type: "prior-knowledge") with exactly 3 short retrieval questions on the PREVIOUS topic "${params.recallTopic}". These must be quick, accessible questions (True/False, short answer, or fill-in-blank) to activate prior knowledge. Do NOT mix these with the main topic questions. This section appears SECOND in the worksheet, right after the Learning Objective.` : '';

  // ── STRUCTURED GENERATION PATH (always-on for all secondary worksheets) ────
  // This is the primary generation path for all non-primary, non-exam, non-revision worksheets.
  // It enforces the correct structure: LO → Retrieval → Key Vocab → Common Mistakes →
  // Worked Example → Diagram A → Section A (T/F, MCQ, Gap Fill, Match) → Section B →
  // Diagram B → Section C → Challenge → Self Reflection → Teacher Key
  if (!params.isRevisionMat && !params.examStyle && !params.introOnly && !isPrimary) {
    // Use selectedSections if provided, otherwise default to all sections enabled
    const secs = params.selectedSections ?? [
      'learning-objective', 'retrieval', 'key-vocabulary', 'common-mistakes',
      'worked-example', 'true-false', 'mcq', 'word-bank-gap-fill', 'match',
      'section-a', 'questions', 'section-b', 'section-c', 'revision-tips', 'self-reflection'
    ];
    const wantLO = secs.includes('learning-objective');
    const wantRetrieval = secs.includes('retrieval') && !!params.recallTopic;
    const wantKeyVocab = secs.includes('key-vocabulary');
    const wantWorkedExample = secs.includes('worked-example');
    const wantCommonMistakes = secs.includes('common-mistakes');
    // Diagrams are always included — every topic has a diagram via the SVG template + Wikimedia chain.
    // The checkbox only controls whether the section appears in the UI selector, not whether it's generated.
    const wantDiagramA = true;
    const wantDiagramB = true;
    const wantTrueFalse = secs.includes('true-false');
    const wantMCQ = secs.includes('mcq');
    const wantWordBankGapFill = secs.includes('word-bank-gap-fill');
    // Support both legacy 'questions' and new split section IDs
    const wantQuestions = secs.includes('questions') || secs.includes('section-b');
    const wantSectionA = secs.includes('section-a');
    const wantSectionC = secs.includes('section-c');
    const wantSelfReflection = secs.includes('self-reflection');
    // Phase 3 — Examiner-voice Revision Tips panel. Mirrors
    // wantSelfReflection: opt-in via the section toggle, default ON
    // for secondary worksheets.
    const wantRevisionTips = secs.includes('revision-tips');

    // Retrieve spec-aligned example questions for this topic (if available)
    const specExamples = getSpecQuestions(params.subject, params.topic);

    const ksGcseNote = (yearNum >= 7 && yearNum <= 11) ? `
KS3/4 GCSE SPEC REQUIREMENTS (MANDATORY for Year ${yearNum}):
- The rules below are implementations of the CURRICULUM AUTHORITY preamble — every section is bound to the authority chain (UK National Curriculum + named awarding body), the NON-NEGOTIABLES (UK English, SI units, awarding-body command words, no fabricated codes) and the pedagogical register note above.
- This worksheet must be usable as a COMPLETE, STANDALONE lesson resource — not a quiz or revision aid.
- Every section must be substantive and teach/reinforce the topic, not just test it.
- LEARNING OBJECTIVE: One clear, specific, measurable objective using Bloom's taxonomy verbs (identify, describe, explain, calculate, evaluate, analyse, compare).
- KEY VOCABULARY: EXACTLY 5 terms with precise, mark-scheme-quality definitions. Include units where applicable (e.g. "Resistance (Ω) — the opposition to the flow of current in a circuit").
- COMMON MISTAKES: 3 specific, topic-relevant misconceptions students make at GCSE level. Each must name the mistake AND explain the correct understanding.
- WORKED EXAMPLE: A complete, step-by-step solution to a real exam-style question. Show every step. Include formula, substitution, calculation, and answer with units. Add an examiner tip.
- SECTION A (True/False, MCQ, Gap Fill): Must test RECALL of specific facts, definitions, and formulae from the topic. True/False statements must be factually precise. MCQ distractors must be plausible misconceptions.
- SECTION B (Foundation Questions): 4 scaffolded questions escalating from 1 to 3 marks. Use command words: state, identify, describe, calculate.
- SECTION C (Core Practice): 6 exam-style questions escalating from 1 to 6 marks. Use command words: explain, calculate, evaluate, compare, analyse, justify. Include at least one multi-step calculation and one extended response.
- CHALLENGE: A synoptic or higher-order question linking the topic to a wider concept. Must require genuine analysis or evaluation.
- SELF REFLECTION: 5 specific, topic-relevant "I can …" statements for the confidence table — NEVER generic. Every statement must (a) name "${params.topic}" or its core noun phrase, and (b) start with "I can " followed by a real command word (Calculate, Solve, Describe, Explain, Analyse, Compare, Evaluate, Identify, etc. — pick verbs that match the question types in this worksheet). NEVER emit "I can ___", "I can apply what I have learned", or any placeholder. Written prompts must mention the topic explicitly. Exit ticket sentence must contain the topic name.
- REVISION TIPS: Output EXACTLY 5 examiner-voice tips, one per line, numbered 1–5, in this fixed category order: (1) COMMAND WORD, (2) WATCH OUT, (3) METHOD, (4) MARK SCHEME, (5) TIME. Each line MUST follow the format "N. LABEL: <tip text>" — e.g. "1. COMMAND WORD: When the question says 'Calculate …', the examiner wants you to …". UK English. UK awarding-body command words. Second person, imperative, terse — no padding. Tip 1 MUST quote one of the actual command words used on the questions in this worksheet. Tip 2 MUST name a real misconception about "${params.topic}" — pull it from the Common Mistakes section if present, otherwise pick the most likely error pupils make at ${params.yearGroup}. Tip 4 MUST mention how marks are awarded for the longest question on this worksheet (method marks vs accuracy marks, level descriptors, mark per technique-plus-effect, …). Tip 5 MUST give a time budget anchored to the worksheet total marks (≈ 1 minute per mark). NEVER emit generic filler ("revise carefully", "study hard", "make sure you understand", "good luck"). NEVER use placeholders ("[Tip 1]", "...", "___").
- TEACHER KEY: Complete model answers for EVERY question with mark allocations. For extended answers, list marking points explicitly.
- DIAGRAM SECTIONS: Diagram A and Diagram B are full-page visual resources from the diagram library — they are already provided as images. Do NOT generate text-based diagram descriptions. Do NOT include any questions about diagrams. All questions come ONLY from Section A (True/False, MCQ, Gap Fill), Section B (Foundation Questions), and Section C (Core Practice + Challenge).
` : '';
    // ── Build subject-specific rules block ────────────────────────────────────────
    const subjectSpecificRules = (() => {
      if (isMaths) return `
SUBJECT-SPECIFIC RULES — MATHEMATICS:
- ALL questions must be numerical/calculation-based. Never ask students to explain, describe, or write prose unless the topic explicitly requires proof or justification (e.g. 'Show that', 'Prove that').
- Use LaTeX for ALL mathematical notation: wrap in \\(...\\). E.g. \\(\\dfrac{3}{4}\\), \\(x^{2}\\), \\(\\sqrt{x}\\), \\(\\leq\\). Write units as plain text outside LaTeX.
- Notation must be checked carefully: use \\(x^{2}\\) not x2, \\(\\sqrt{x}\\) not sqrt(x), \\(\\frac{a}{b}\\) not a/b for fractions.
- Worked example MUST show: (1) the question, (2) method/formula stated, (3) substitution step, (4) calculation step, (5) final answer with units, (6) method mark note.
- Include at least ONE error-correction question somewhere in Section B or C (show a worked solution with a deliberate mistake; student finds and corrects it).
- Include at least ONE multi-step problem in Section C.
- Include at least ONE diagram, table, graph, or visual where the topic warrants it (geometry, statistics, coordinates, probability).
- Teacher Key MUST show full working for every calculation, state the method used, and show substitution and simplification steps separately.
- Ability tier guidance: Foundation = smaller numbers, clear steps, more worked scaffolds. Higher = algebraic generalisation, proof, surds, bounds, compound reasoning.`;

      if (isEnglishLit) {
        const litExtract = findSourceExtract({
          subject: params.subject,
          topic: params.topic,
          additionalInstructions: params.additionalInstructions,
        });
        const extractBlock = litExtract
          ? `\nCANONICAL EXTRACT — required source text for this worksheet:\n${renderExtractForPrompt(litExtract)}\n\nUSE THIS EXACT WORDING. Do not paraphrase, do not invent your own extract, and do not substitute a different scene. Quote from these line numbers in retrieval and language-analysis questions.\n`
          : '';
        return `
SUBJECT-SPECIFIC RULES — ENGLISH LITERATURE:
- Every worksheet MUST include: an extract or poem section, a context link, a key quotation focus, methods/language/form/structure analysis, a whole-text connection, and a mini exam-style question.
- Include a model paragraph with AO breakdown (AO1: ideas, AO2: methods, AO3: context).
- Include a comparative prompt where the topic allows.
- Section B MUST include at least one question using a specific quotation from the text.
- Section C MUST include at least one 8+ mark evaluation question with level descriptors (Level 1-4).
- Teacher Key MUST include: AO1/AO2/AO3 breakdown, context note, alternative interpretations, and level descriptor guidance.
- Diagram A = extract, poem or key passage. Diagram B = comparison poem, context timeline, methods bank or model answer annotation.
- SEND notes: provide quotation banks for dyslexia/working-memory; use context timelines for EAL/SLCN; keep challenge through interpretation, not reading density.${extractBlock}`;
      }

      if (isEnglishLang) return `
SUBJECT-SPECIFIC RULES — ENGLISH LANGUAGE:
- Every worksheet MUST be built around a source text. A worksheet without a proper source text is NOT a valid English Language worksheet.
- The source text MUST include line numbers and be at least 8-12 lines long.
- Required components: source text with line numbers, retrieval question, language analysis question, structure or viewpoint question, evaluation question, writing task or short crafted response, model answer or paragraph scaffold, vocabulary support for complex words.
- Section B MUST include: (a) a retrieval question referencing specific lines, (b) a language analysis question with a named technique, (c) a structure or viewpoint question.
- Section C MUST include: (a) an evaluation question, (b) a writing task with a clear purpose and audience.
- Teacher Key MUST include: model answer features, quotation use, method analysis, and band descriptors for extended questions.
- Diagram A = source extract with line numbers. Diagram B = writing stimulus image, second source, model answer, or planning frame.
- SEND notes: dyslexia = avoid dense extracts, increase spacing; EAL = glossary difficult words, avoid idioms in instructions; SLCN = sentence starters and analysis frames; ASC = make questions literal, avoid vague prompts.

DESCRIPTIVE / NARRATIVE WRITING (AQA Paper 1 Section B, AQA 8700) — STRUCTURAL FRAMEWORK MANDATORY:
- If the topic is descriptive writing, narrative writing, creative writing, image-based writing, or any AQA Paper 1 §B style task, you MUST teach an explicit structural framework. Pick ONE of the following models and reference it by name in BOTH the planning section and the model paragraph:
    (a) "Zoom In / Zoom Out" — open with a wide establishing shot, zoom in on one sensory detail, zoom out to a reflective conclusion.
    (b) "Cinematic Lens" — five short cinematic frames (wide → mid → close-up → close-up → wide), each anchored to a different sense.
    (c) "Five-Sense Sweep" — one paragraph per sense (sight, sound, smell, touch, taste), with deliberate sentence-length variation.
- The planning frame MUST give the pupil a labelled outline (e.g. "Para 1 — Zoom Out: …"; "Para 2 — Zoom In: …") so the structure is explicit, not implied.
- The model paragraph MUST use the chosen framework AND annotate it: tag each sentence with its structural role.

AO5 / AO6 PUNCTUATION VARIETY (MANDATORY for any writing task):
- AQA AO6 explicitly rewards "a wide range of punctuation accurately used". The worksheet MUST scaffold this — do NOT rely on full stops and commas alone.
- Sentence-craft / SEND scaffolding panel must include at least three of: colon, semi-colon, dash (em-dash or pair), ellipsis, parenthetical brackets. For each, give a one-line teaching rule and a worked sentence anchored to the topic.
- The model paragraph MUST contain at least one colon AND one semi-colon (or at minimum one colon and one well-placed dash) — flag them in the teacher annotation.
- Vocabulary panel must explicitly encourage ambitious lexis (e.g. "embers smouldered", "the silence congealed") rather than generic adjectives. AO5 marks "vocabulary chosen for effect" — make the worksheet train it.`;

      if (isBiology) return `
SUBJECT-SPECIFIC RULES — BIOLOGY:
- Worksheets must combine: factual recall, structure-function links, data interpretation, and required practical thinking.
- Required components: labelled or partially labelled biological structure, one data/graph/table task where relevant, one explain question using structure-function reasoning, one required-practical style question where relevant, one misconception check.
- Use correct biological terminology throughout. Do not simplify scientific terms — define them instead.
- Worked example MUST show a complete explanation of a biological process, not just a definition.
- Teacher Key MUST include: acceptable wording alternatives, required key terms that MUST appear in the answer, common misconceptions, and mark-scheme wording for longer answers.
- Diagram A = labelled cell, organ, body system, graph or microscope image. Diagram B = blank label task, graph completion, Punnett square or practical results table.
- SEND notes: MLD = use labelled before unlabelled diagrams; EAL = define process words (diffusion, osmosis, active transport); SLCN = cause-effect sentence frames; VI = text descriptions of diagrams.`;

      if (isChemistry) return `
SUBJECT-SPECIFIC RULES — CHEMISTRY:
- Worksheets must show calculations clearly. Formula, substitution, answer and unit must ALL be visible in worked examples.
- Required components: key vocabulary and symbols, particle or apparatus diagram where relevant, balanced equation practice where relevant, worked calculation with units, required practical question where relevant, error-correction question for common misconception.
- Every calculation question MUST show: formula → substitution → answer → unit.
- Balanced equations must use correct state symbols where appropriate.
- Teacher Key MUST include: formula used, substitution shown, units, significant figures where relevant, and acceptable alternative phrasings.
- Diagram A = particle model, apparatus, reaction profile, bonding diagram or data table. Diagram B = practical setup to label, chromatography/titration/electrolysis diagram, results table to complete.
- SEND notes: dyscalculia = formula triangle/step table; EAL = define yield, excess, rate, concentration; ASC = sequence practical methods clearly; dyslexia = avoid long chemical names without spacing.`;

      if (isPhysics) return `
SUBJECT-SPECIFIC RULES — PHYSICS:
- Worksheets must build equation fluency AND conceptual understanding together. Do not make physics only formula substitution.
- Required components: equation recall or equation bank, worked calculation with rearrangement where relevant, unit check, diagram/graph interpretation, practical/data question, explanation question for concept understanding.
- Every calculation MUST show: equation stated → rearrangement (if needed) → substitution → answer → unit.
- Include at least one graph interpretation or data analysis question.
- Teacher Key MUST include: equation used, rearrangement shown, substitution, unit, graph-reading method, and acceptable alternative phrasings.
- Diagram A = circuit, force diagram, wave diagram, velocity-time graph, I-V graph. Diagram B = complete a circuit, ray diagram, graph, force arrows or wave labels.
- SEND notes: dyscalculia = formula/substitute/solve/unit boxes; EAL = define resultant, potential difference, frequency, amplitude; ASC = make graph-reading steps explicit; VI = avoid small circuit labels, provide text description.`;

      if (isHistory) return `
SUBJECT-SPECIFIC RULES — HISTORY:
- Worksheets must train second-order thinking: cause, consequence, change, continuity, similarity, difference and significance.
- Required components: key chronology, source or interpretation, factual recall, explanation question, source utility or interpretation question where relevant, extended answer plan, model paragraph using own knowledge and judgement.
- Every worksheet MUST include at least one source or primary evidence item.
- Section C MUST include at least one extended question requiring a structured argument with evidence.
- Teacher Key MUST include: own knowledge points, provenance comments for sources, judgement guidance, and level descriptors for extended answers.
- Diagram A = primary source, image, cartoon, written extract or timeline. Diagram B = interpretation, cause-consequence map, significance ranking or judgement plan.
- SEND notes: EAL/SLCN = timeline and vocabulary for political/social terms; dyslexia = chunk sources, avoid huge text blocks; ASC = define the historical concept being tested.`;

      if (isGeography) return `
SUBJECT-SPECIFIC RULES — GEOGRAPHY:
- Worksheets must include data and geographical skills. A worksheet without map/graph/data interpretation is INCOMPLETE.
- Required components: named example or case study where relevant, map/graph/photo/table stimulus, AO4 skills question (data/calculation), process explanation, evaluation question where relevant, command word support.
- Include at least one data/calculation question (e.g. percentage change, grid reference, graph reading).
- Use real named places, real case studies, real data where possible.
- Teacher Key MUST include: data use, case-study detail, AO4 calculation steps, and mark-scheme wording.
- Diagram A = map, graph, satellite image, photograph, data table. Diagram B = blank map/graph, annotated process diagram, fieldwork table or case-study organiser.
- SEND notes: EAL = define process words and geographical terms; dyscalculia = scaffold percentage change, grid references, graph scales; VI = text descriptions of maps/graphs; ADHD = chunk long case-study information.`;

      if (isRS) return `
SUBJECT-SPECIFIC RULES — RELIGIOUS STUDIES:
- Worksheets must train balanced argument. Description alone is NOT enough.
- Required components: key beliefs/practices vocabulary, source of authority where relevant, short recall questions, explanation question, 12-mark evaluation plan where relevant, contrasting religious and non-religious views, conclusion frame.
- Every worksheet MUST include at least one question requiring a balanced argument with multiple perspectives.
- Section C MUST include at least one extended evaluation question with level descriptors.
- Teacher Key MUST include: religious teaching, contrasting view, conclusion quality guidance, and level descriptors.
- Diagram A = quotation, image, short source, news stimulus or belief comparison. Diagram B = argument scaffold, viewpoint comparison table or 12-mark planning grid.
- SEND notes: EAL = define abstract words (sanctity, stewardship, atonement, justice); SLCN = argument frames; ASC = make viewpoint comparison explicit and respectful.`;

      if (isCS) return `
SUBJECT-SPECIFIC RULES — COMPUTER SCIENCE:
- Worksheets must include algorithmic thinking, not just definitions.
- Required components: key terms, pseudocode or flowchart, trace table where relevant, error correction/debug task, application to a real problem, evaluation or design question.
- Pseudocode must use consistent, standard notation (e.g. WHILE, IF, FOR, PRINT, INPUT).
- Include at least one trace table or algorithm tracing task.
- Include at least one debug/error-correction task.
- Teacher Key MUST include: expected output for trace tables, corrected code/pseudocode, and explanation of why errors occur.
- Diagram A = pseudocode, flowchart, network diagram or data structure. Diagram B = trace table, algorithm to complete, error diagram or binary conversion grid.
- SEND notes: dyslexia = monospaced code blocks with clear spacing; ADHD = chunk algorithms, show line numbers; ASC = state exact expected output format; dyscalculia = support binary/denary conversion with place-value tables.`;

      if (isBusiness) return `
SUBJECT-SPECIFIC RULES — BUSINESS STUDIES / ECONOMICS:
- Worksheets must be case-study driven. Generic answers should be treated as weak.
- Required components: business/economic context (real or realistic named business), data table or graph, key terms, calculation question, application question, analysis chain (Point → Evidence → Explain → Link), evaluation with judgement.
- Every worksheet MUST include a realistic business/economic context with named figures or data.
- Section C MUST include at least one evaluation question requiring a justified judgement.
- Teacher Key MUST include: context application, calculation steps, justified judgement guidance, and level descriptors for evaluation questions.
- Diagram A = case study, data table, market graph or financial figures. Diagram B = break-even chart, cash-flow table, supply-demand diagram or decision matrix.
- SEND notes: EAL = define commercial/economic terms; dyscalculia = scaffold formula questions; SLCN = because/therefore chains; ADHD = break case studies into labelled facts.`;

      if (isMFL) return `
SUBJECT-SPECIFIC RULES — MODERN FOREIGN LANGUAGES:
- Worksheets must build vocabulary, grammar AND communication. They must NOT be only translation lists.
- Required components: topic vocabulary, grammar focus, short reading/listening transcript or prompt, comprehension questions, translation task where relevant, writing or speaking frame, self-check for tense/agreement/opinion phrases.
- Include at least one reading comprehension task with a target-language text.
- Include at least one grammar-focused task (e.g. verb conjugation, adjective agreement, tense identification).
- Include at least one productive task (writing or speaking frame).
- Teacher Key MUST include: model translations, grammar rule explanations, and acceptable alternative phrasings.
- Diagram A = reading text, advert, blog, email, infographic. Diagram B = photo card, writing prompt, grammar table or vocabulary organiser.
- SEND notes: dyslexia = space vocabulary clearly, avoid dense word lists; EAL = remember pupil may be multilingual; SLCN = sentence frames and oral rehearsal; ADHD = matching, sorting and short production tasks.`;

      // Default: general STEM or Humanities
      return `
SUBJECT-SPECIFIC RULES — ${params.subject.toUpperCase()}:
- Use exam-style command words appropriate to this subject.
- Include a worked example that models the full thought process, not just the answer.
- Include at least one data, source, or stimulus-based question.
- Include at least one higher-order question requiring analysis, evaluation or justification.
- Teacher Key MUST include model answers with mark allocations and acceptable alternatives.`;
    })();

    // ── Phase 4 / FEAT-002 — misconception-aware question design ───────────
    // Pull curated UK misconceptions matching this subject + topic + year group
    // and inject them as a mandatory rule block. The AI must echo back which
    // misconception IDs it targeted in metadata.misconceptionsTargeted, which
    // we surface in the teacher view of the worksheet.
    const misconceptionBlock = formatMisconceptionsForPrompt({
      subject: params.subject,
      topic: params.topic,
      yearGroup: params.yearGroup,
      limit: 5,
    });

    // ── PR #2 (worksheet-gen-efficiency) — strip empty conditional blocks
    //   Many of the blocks below (paperCalcNote, lorBlock, synopticBlock,
    //   examStemAnchorsBlock, examPaperTemplateBlock, requiredPracticalNote,
    //   stemPreservationNote, sendNote, tierNote, misconceptionBlock,
    //   subjectSpecNote, ksGcseNote, subjectSpecificRules) return "" under
    //   common conditions (e.g. KS3 sheets, no SEND, no exam style). Joining
    //   them with raw newlines used to leave 6–10 blank lines in every
    //   prompt — wasted input tokens that count against TPM-bound providers
    //   like Groq and Cerebras. We now filter to non-empty trimmed blocks
    //   and join with single newlines so the prompt stays compact.
    const structuredSystemSections: string[] = [
      // Phase 5 — Curriculum-authority preamble. Replaces the thin
      // "expert UK teacher creating a worksheet" opener with a
      // properly bound (board × subject × year × topic × key stage)
      // manifesto. Names the awarding body, UK National Curriculum
      // Programmes of Study, UK English and the output contract up
      // front so every downstream rule is enforcing a contract the
      // model has already agreed to.
      buildCurriculumAuthorityPreamble({
        subject: params.subject,
        yearGroup: params.yearGroup,
        examBoard: params.examBoard,
        topic: params.topic,
        isSTEM,
      }),
      // Phase 5 — Consolidated UK-English / SI-units / UK-contexts /
      // no-fabricated-codes / no-softeners block. Static text — same
      // six clauses on every prompt — so the model sees a stable
      // authority backbone across topics. Phases 1–4 still enforce
      // each rule downstream; this block names them up front.
      buildNonNegotiablesBlock(),
      `SUBJECT TYPE: ${isSTEM ? 'STEM' : 'HUMANITIES'} | SUBJECT: ${params.subject}`,
      readingAgeNote,
      // Phase 5 — Pedagogical register note. Sets the tonal expectation
      // (KS1/KS2 = warm but precise; KS3 = clear and explanatory; GCSE
      // = examiner voice; A-Level = academic but direct). Sits next to
      // readingAgeNote because reading age is vocabulary granularity
      // and the register note is *voice* — distinct concerns.
      buildPedagogicalRegisterNote({
        subject: params.subject,
        yearGroup: params.yearGroup,
        examBoard: params.examBoard,
        topic: params.topic,
        isSTEM,
      }),
      sendNote,
      stemPreservationNote,
      requiredPracticalNote,
      subjectSpecNote,
      specPointAnchorBlock,
      tierNote,
      ksGcseNote,
      subjectSpecificRules,
      misconceptionBlock,
      paperCalcNote,
      examStemAnchorsBlock,
      lorBlock,
      synopticBlock,
      examPaperTemplateBlock,
      // Phase 1 — section-count contract (7-7-5 + 1). Single source of truth
      // for the question counts every other layer expects.
      `SECTION QUESTION COUNTS — you must hit exactly:
- SECTION 1 — RECALL: ${SECTION_QUESTION_TARGETS.recall.target} questions (acceptable range ${SECTION_QUESTION_TARGETS.recall.min}–${SECTION_QUESTION_TARGETS.recall.max}).
  AO1 dominant. 1–2 marks each. Layouts: True/False, MCQ, gap-fill, matching, ordering, short-answer.
- SECTION 2 — UNDERSTANDING: ${SECTION_QUESTION_TARGETS.understanding.target} questions (acceptable range ${SECTION_QUESTION_TARGETS.understanding.min}–${SECTION_QUESTION_TARGETS.understanding.max}).
  AO1/AO2 mix. 2–4 marks each. Multi-step on at least 4 of the 7. Layouts: label-diagram, gap-fill, diagram-subquestions, table-complete, short-answer.
- SECTION 3 — APPLICATION: ${SECTION_QUESTION_TARGETS.application.target} exam-style questions (fixed).
  AO2/AO3 dominant. 4–8 marks each. At least one in an unfamiliar context. At least one calculation / "show that" question on STEM sheets.
  Layouts: extended-answer, diagram-subquestions, draw-box.
- CHALLENGE: ${SECTION_QUESTION_TARGETS.challenge.target} question (6–8 marks; grade 8–9 demand on Higher).
- TOTAL: ${TOTAL_QUESTIONS_TARGET} questions across the worksheet. Number them 1..${TOTAL_QUESTIONS_TARGET} with the "questionNumber" field.`,
      // Phase 1 — per-question contract that drives the renderer's per-Q
      // answer affordances (lines + working-out box) and the curriculum
      // post-validator.
      `PER-QUESTION CONTRACT — every question section (any section whose type starts with "q-", or is "challenge" / "extended-answer" / "lor" / "exam-question") MUST carry:
- "questionNumber" (int 1..${TOTAL_QUESTIONS_TARGET}): the question's position on the worksheet.
- "marks" (int): mark tariff. Match the section ranges above. Always include "[N marks]" inline at the end of the stem so the renderer can position the badge.
- "answerLines" (int): writing lines the renderer should draw per question. Use this ramp:
    1m → 2 lines       2m → 3 lines       3m → 4 lines       4m → 6 lines
    5–6m → 8 lines     7–8m → 12 lines    9+m → 14 lines
    True/False, MCQ, gap-fill, matching, ordering, label-diagram, table → 0 (the layout owns the answer affordance).
- "commandWord": the exam-board command word that opens the stem (Calculate, Explain, Describe, Evaluate, Compare, Justify, State, Identify, Show that, Analyse, Discuss). Match the named board's command-word list (AQA / Pearson Edexcel / OCR / WJEC-Eduqas / CCEA). Do NOT soften ("Talk about", "Have a think about" — banned).
- "workingOutBox" (boolean): MATHS ONLY. Set true on maths Application questions and any maths "calculate / work out / show that / find the value / solve / evaluate <number>" stem so the renderer prepends a dot-grid working area and a "Final answer:" capped row. Set FALSE on Science (Physics / Chemistry / Biology / Combined Science), English, Humanities, MFL, and any extended-writing question — sciences use standard writing lines sized by mark tariff (the dot-grid is a maths-specific affordance).
- "specRef": one of the published codes listed in the SPEC LOCK block above. Never invent.
- "ncRef": verbatim National Curriculum Programme-of-Study statement (gov.uk).
- "ao": "AO1" | "AO2" | "AO3" | "AO4". Match the cognitive demand.
- "bloomLevel": "remember" | "understand" | "apply" | "analyse" | "evaluate" | "create".
- "expectedReadingAge": integer 5–18 matched to ${params.yearGroup || 'the year group'} (Y9 ≈ 13, Y10 ≈ 14, Y11 ≈ 15) unless a SEND overlay lowers it.`,
      `QUALITY STANDARD: Every question must be fully usable — no placeholders, no ellipses, no unfinished sentences. Use real numbers, real contexts. Textbook quality. Every question must be at the correct curriculum level for ${params.yearGroup || 'the year group'} — GCSE/KS3/KS4 standard as appropriate. Questions must be traceable to the NC Programme-of-Study + the named exam-board specification — do not invent content the curriculum does not assess. Every question is bound to the CURRICULUM AUTHORITY preamble above and the NON-NEGOTIABLES block — UK English, SI units, awarding-body command words, no fabricated AO codes (AO1–AO4 only), no US drift, no softeners. The post-validator will warn on every drift it detects.`,
      specExamples,
    ].map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);

    const structuredSystem = `${structuredSystemSections.join('\n')}
PB1 — PER-QUESTION PROVENANCE (mandatory for Year 9, 10, 11 sheets — optional for KS3/KS2):
Stamp every question section (any section whose type starts with "q-", "challenge", "extended-answer", "lor", or "exam-question") with these structured fields ALONGSIDE the existing content/marks fields:
- "ao": one of "AO1", "AO2", "AO3", "AO4". Knowledge / recall = AO1. Application / explain / calculate = AO2. Analyse / evaluate / extended reasoning = AO3. Practical or skill questions (where the spec defines AO4) = AO4.
- "specRef": a short curriculum reference, e.g. "KS4 Physics — Forces" or "AQA GCSE Maths 4.1.1.2 — Algebraic notation". Pull the closest match from "${params.subject || 'the subject'} ${params.yearGroup || ''} — ${params.topic || ''}".
- "bloomLevel": one of "remember", "understand", "apply", "analyse", "evaluate", "create". Match the cognitive demand of the question.
- "expectedReadingAge": integer 5–18 representing the UK reading age the question text is pitched at. Match it to ${params.yearGroup || 'the year group'} (Year 9 ≈ 13, Year 10 ≈ 14, Year 11 ≈ 15) unless the SEND overlay lowers it.
- "sourceCitation": optional. Past-paper reference (e.g. "AQA Nov 2022 P2 Q5") if you adapted from one. Leave blank if not applicable — never invent a citation.
AO grade-band targets across the whole sheet (post-validator will warn if you drift):
- Year 7–9: AO1 ~ 50–60% · AO2 ~ 30% · AO3 ~ 10–20%.
- Year 10–11: AO1 ~ 30% · AO2 ~ 30–40% · AO3 ~ 20–30% · AO4 (if applicable) ~ 10–20%.
A deterministic post-validator will fill any of these fields you omit (best-match against the syllabus + reading-age estimator), so prefer to set them yourself for accuracy. NEVER fabricate a sourceCitation — leave it out instead.
CRITICAL SEND SEPARATION RULE — READ CAREFULLY:
SEND adaptations affect FORMATTING AND PRESENTATION ONLY. They must NEVER lower the academic challenge or change what is being assessed.
- challenge level = ability tier (Foundation/Standard/Higher/Scaffolded)
- access method = SEND overlay (dyslexia/ADHD/ASC/MLD/EAL/etc.)
- language complexity = reading age / EAL overlay
These three dimensions are INDEPENDENT. A higher-attaining pupil can need a dyslexia overlay. A pupil with EAL may still need Higher-tier challenge.
What SEND overlays MAY change: font size, line spacing, answer-space size, instruction length, vocabulary support, hints, scaffold steps, sentence starters, bilingual keyword support, worked-example detail, number of subparts (only where mark scheme is preserved).
What SEND overlays MUST NOT change: subject, topic, learning objective, diagram meaning, core assessment objective, answer accuracy, mark allocation, mathematical notation, science facts, exam-board command word meaning, question order.
SEND scaffolding (sentence starters, answer frames, worked examples) goes in SEPARATE support boxes AROUND the questions — not inside the question text itself.
NEVER add SEND management instructions as question content items ('Complete the task in steps', 'Tick each step', 'Focus on one question').
CRITICAL STRUCTURE RULE: ALL questions come ONLY from Section A (True/False, MCQ, Word Bank), Section B (Foundation Questions), and Section C (Core Practice + Challenge). Diagrams are VISUAL AIDS ONLY — they MUST NOT contain any questions, sub-questions, or tasks. Do NOT generate questions that reference diagrams (e.g. "Using the diagram, calculate..." or "What is labelled in the diagram?"). This applies to ALL subjects including Maths.`;

    // ── PRE-FETCH DIAGRAM URLS (parallel, before AI call) ──────────────────────
    // Fetch Diagram A and Diagram B from the library in parallel so the real
    // imageUrl is injected directly into the structured sections string.
    let diagramAUrl = '';
    let diagramACaption = `${params.topic} — Diagram A`;
    let diagramASvg = '';
    let diagramBUrl = '';
    let diagramBCaption = `${params.topic} — Diagram B`;
    let diagramBSvg = '';
    try {
      const [diagARes, diagBRes] = await Promise.allSettled([
        fetch('/api/ai/diagram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ subject: params.subject, topic: params.topic, yearGroup: params.yearGroup || 'Year 9', slot: 'A' }),
        }).then(r => r.ok ? r.json() : null),
        fetch('/api/ai/diagram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ subject: params.subject, topic: params.topic, yearGroup: params.yearGroup || 'Year 9', slot: 'B' }),
        }).then(r => r.ok ? r.json() : null),
      ]);
      if (diagARes.status === 'fulfilled' && diagARes.value) {
        const dA = diagARes.value;
        if (dA.imageUrl) {
          // Proxy external CDN URLs to avoid CORS issues in browser and PDF rendering
          diagramAUrl = (dA.imageUrl.startsWith('http://') || dA.imageUrl.startsWith('https://'))
            ? `/api/diagram-proxy?url=${encodeURIComponent(dA.imageUrl)}`
            : dA.imageUrl;
        }
        if (dA.svg) diagramASvg = dA.svg;
        if (dA.caption) diagramACaption = dA.caption;
      }
      if (diagBRes.status === 'fulfilled' && diagBRes.value) {
        const dB = diagBRes.value;
        if (dB.imageUrl) {
          // Proxy external CDN URLs to avoid CORS issues in browser and PDF rendering
          diagramBUrl = (dB.imageUrl.startsWith('http://') || dB.imageUrl.startsWith('https://'))
            ? `/api/diagram-proxy?url=${encodeURIComponent(dB.imageUrl)}`
            : dB.imageUrl;
        }
        if (dB.svg) diagramBSvg = dB.svg;
        if (dB.caption) diagramBCaption = dB.caption;
      }
    } catch (diagPrefetchErr) {
      console.warn('[Diagram] Pre-fetch failed:', diagPrefetchErr);
    }

    // ── DEDUPLICATION: if Diagram B is identical to Diagram A, clear B ──────────
    if (diagramBUrl && diagramBUrl === diagramAUrl) {
      console.log('[Diagram] Diagram B URL is identical to Diagram A — clearing B to avoid duplication');
      diagramBUrl = '';
      diagramBSvg = '';
    }
    if (!diagramBUrl && diagramBSvg && diagramBSvg === diagramASvg) {
      console.log('[Diagram] Diagram B SVG is identical to Diagram A — clearing B to avoid duplication');
      diagramBSvg = '';
    }

    // ── STRUCTURED SECTION ORDER (matches required format) ───────────────────
    // Format: Header → LO → Retrieval → Key Vocabulary → Common Mistakes →
    //         Worked Example → Diagram A → Section A Questions → Section B Questions →
    //         Diagram B → Section C Questions → Challenge → Self Reflection → Teacher Key
    const structuredSections: string[] = [];

    // 1. Learning Objective
    if (wantLO) {
      structuredSections.push(`{"title": "Learning Objective", "type": "objective", "content": "By the end of this lesson, students will be able to [one clear, specific learning objective for ${params.topic}]"}`);
    }

    // 2. Retrieval Practice (if selected and topic provided)
    if (wantRetrieval && params.recallTopic) {
      structuredSections.push(`{"title": "Retrieval \u2014 ${params.recallTopic}", "type": "prior-knowledge", "content": "Recall from last lesson!\n1. [True/False statement about ${params.recallTopic}] TRUE / FALSE\n2. [Short answer question about ${params.recallTopic}] [1 mark]\n3. [Fill-in-blank sentence about ${params.recallTopic}. The answer is _____.]"}`)
    }

    // 3. Key Vocabulary
    if (wantKeyVocab) {
      structuredSections.push(`{"title": "Key Vocabulary", "type": "vocabulary", "content": "[key term 1 for ${params.topic}] — [precise, curriculum-accurate definition in one sentence]\n[key term 2 for ${params.topic}] — [precise, curriculum-accurate definition in one sentence]\n[key term 3 for ${params.topic}] — [precise, curriculum-accurate definition in one sentence]\n[key term 4 for ${params.topic}] — [precise, curriculum-accurate definition in one sentence]\n[key term 5 for ${params.topic}] — [precise, curriculum-accurate definition in one sentence]"}`);
    }

    // 4. Common Mistakes
    // ── PR-M3: child-friendly Common Mistakes for MATHS only ─────────────
    //    Maths sheets get a four-part labelled structure with REAL numbers
    //    in every block (the wrong working, plain-English reason, the right
    //    working, and a quick self-check). Reading-age constraint baked
    //    into the prompt; deterministically post-validated by
    //    commonMistakesValidator.ts.
    //    Non-maths subjects keep the existing simpler template — no change.
    if (wantCommonMistakes) {
      if (isMaths) {
        // Reading-age guidance string varies by year: Y7-8 → ≤11, Y9+ → ≤13.
        const yearMatch = /year\s*(\d+)/i.exec(params.yearGroup || "");
        const yearNum = yearMatch ? Number(yearMatch[1]) : 9;
        const readingAge = yearNum <= 8 ? 11 : 13;
        const mistakeBlock = (n: number) =>
          `Mistake ${n}: [Short, plain-English name of the mistake \u2014 max 8 words, no jargon]\n\nWhat pupils often write:\n   [Realistic WRONG working for a ${params.topic} question. MUST contain at least two real numbers shown as a calculation, e.g. \"1/2 + 1/3 = 2/5\". No placeholders.]\n\nWhy that's wrong (in plain words):\n   [Two short sentences explaining the slip in everyday language. No words longer than 3 syllables. Reading age \u2264 ${readingAge}. If a maths term is needed, define it in the same sentence.]\n\nHow to do it right:\n   [Numbered steps showing the CORRECT working for the same question, ending with the right answer marked \u2713]\n\nQuick check: [One short \"try-it-yourself\" sentence with a fresh tiny calculation the pupil can do in their head to feel the rule.]`;
        const mathsContent =
          `Watch out for these common slip-ups. Each one shows the wrong working, why it goes wrong, and how to fix it.\n\n` +
          mistakeBlock(1) +
          `\n\n` +
          mistakeBlock(2) +
          `\n\n` +
          mistakeBlock(3);
        structuredSections.push(`{"title": "Common Mistakes to Avoid", "type": "common-mistakes", "teacherOnly": false, "content": "${mathsContent.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}`);
      } else {
        structuredSections.push(`{"title": "Common Mistakes to Avoid", "type": "common-mistakes", "teacherOnly": false, "content": "Watch out for these common errors:\n\nMISTAKE 1: [Name of mistake]\n\u2192 [Explanation of the mistake and how to avoid it]\n\nMISTAKE 2: [Name of mistake]\n\u2192 [Explanation of the mistake and how to avoid it]\n\nMISTAKE 3: [Name of mistake]\n\u2192 [Explanation of the mistake and how to avoid it]"}`);
      }
    }

    // 5. Worked Example
    if (wantWorkedExample) {
      if (isMaths) {
        structuredSections.push(`{"title": "Worked Example", "type": "example", "content": "Study this worked example carefully before attempting the questions.\n\nQuestion: [A specific ${params.topic} problem with real numbers]\n\nStep 1: [First step \u2014 state the method or formula used]\nStep 2: [Substitute values and show calculation]\nStep 3: [Complete the calculation]\nAnswer: [Final answer with correct units/form]\n\n\u2713 Key point: [One sentence explaining the key method or rule]"}`);
      } else {
        structuredSections.push(`{"title": "Worked Example", "type": "example", "content": "Study this example carefully.\n\n[A clear, specific example demonstrating the key concept of ${params.topic}]\n\nStep 1: [First step]\nStep 2: [Second step]\nStep 3: [Third step \u2014 conclusion or result]\n\n\u2713 Key point: [One sentence explaining the main principle]"}`);
      }
    }

    // 6. Section A Questions (True/False, MCQ, Word Bank, Match) — BEFORE Diagram A
    // PR-M1: True/False is hard-removed for maths regardless of any caller's
    //        selectedSections / saved preset / API state — maths sheets must
    //        never show True/False. MCQ remains gated only at the form layer
    //        (default-off for maths, opt-in toggle preserved).
    if (wantTrueFalse && !isMaths) {
      structuredSections.push(`{"title": "Section A — True or False", "type": "q-true-false", "marks": 4, "content": "Circle TRUE or FALSE for each statement. [4 marks]\n1. [Statement about ${params.topic} \u2014 TRUE]  TRUE  /  FALSE\n2. [Statement about ${params.topic} \u2014 FALSE]  TRUE  /  FALSE\n3. [Statement about ${params.topic} \u2014 TRUE]  TRUE  /  FALSE\n4. [Statement about ${params.topic} \u2014 FALSE]  TRUE  /  FALSE"}`);
    }

    // PR-M1 / steering: MCQ is hard-removed for maths to match the same
    //        treatment as True/False (PR-M1) and Word-Bank Gap-Fill (PR-M2).
    //        Maths sheets must never auto-emit MCQ regardless of any caller's
    //        selectedSections / saved preset / API state. The form-layer
    //        toggle is also default-off for maths in Worksheets.tsx.
    if (wantMCQ && !isMaths) {
      structuredSections.push(`{"title": "Section A — Multiple Choice", "type": "q-mcq", "marks": 1, "content": "[A specific question about ${params.topic} at ${params.yearGroup} curriculum level — use real subject-specific language] [1 mark]\nA  [plausible incorrect option — a common misconception]\nB  [correct answer \u2014 mark with \u2713 at the end of this line] \u2713\nC  [plausible incorrect option]\nD  [plausible incorrect option]"}`);
    }

    // PR-M2: Gap-fill is hard-removed for maths — same pattern as True/False
    //        in PR-M1. The maths spine is now fixed at three numbered-question
    //        sections (A → B → C); a gap-fill warm-up no longer fits.
    //        Non-maths subjects: behaviour unchanged.
    if (wantWordBankGapFill && !isMaths) {
      structuredSections.push(`{"title": "Section A \u2014 Word Bank Gap Fill", "type": "q-gap-fill", "marks": 7, "content": "Complete the paragraph using words from the word bank below. [7 marks]\n[Write EXACTLY 7 sentences about ${params.topic}. Each sentence MUST contain exactly ONE blank shown as _____. The blank must replace a key subject term. Do NOT number the blanks. Do NOT put two blanks in one sentence. Result: 7 sentences = 7 blanks. Example format:\nThe _____ is the organelle where photosynthesis occurs.\nPlants absorb _____ from the air through their stomata.\n[continue for 5 more sentences, each with one _____ blank]]\nWORD BANK: [the 7 correct answers in shuffled order, plus 3 plausible distractors \u2014 total EXACTLY 10 words] [word1] | [word2] | [word3] | [word4] | [word5] | [word6] | [word7] | [word8] | [word9] | [word10]\nRULE: EXACTLY 7 sentences, EXACTLY 7 blanks (one per sentence), EXACTLY 10 words in word bank."}`);
    }



    // 7. Diagram A — full-page spread (after Section A questions, before Section B)
    // Only include if we have a real image from the admin library (no SVG fallbacks)
    if (wantDiagramA && diagramAUrl) {
      const diagASection: Record<string, unknown> = {
        title: 'Diagram A',
        type: 'diagram',
        fullPage: true,
        content: diagramACaption,
        caption: diagramACaption,
        imageUrl: diagramAUrl,
      };
      structuredSections.push(JSON.stringify(diagASection));
    }

    // 8. Section B Questions — non-maths: Foundation / Guided Practice.
    //    Maths: PR-M2 reshape — this slot becomes the new SECTION A
    //    (warm-up fluency: 7 single-step calculations, 1–2 marks each).
    if (wantSectionA) {
      if (isMaths) {
        // ── PR-M2 — Section A (Warm-Up Fluency) ───────────────────────────
        // 7 single-step calculation questions. Mark spread: 1,1,1,2,1,2,2 →
        // total 10 marks, avg 1.43 marks/Q. Numbers are deliberately "clean"
        // (whole numbers, simple fractions, no negatives unless the topic IS
        // negatives) to build confidence. Always strictly easier than B.
        const sectionAMaths = `1. [${params.topic} single-step calculation \u2014 clean whole-number values, hit the technique once] [1 mark]\n\n2. [${params.topic} single-step calculation \u2014 different clean values applying the same rule] [1 mark]\n\n3. [${params.topic} single-step calculation \u2014 simple fraction or decimal where appropriate] [1 mark]\n\n4. [${params.topic} single-step calculation \u2014 slightly larger numbers, still one operation] [2 marks]\n\n5. [${params.topic} single-step calculation \u2014 vary the form (e.g. word phrasing of the same operation)] [1 mark]\n\n6. [${params.topic} single-step calculation \u2014 apply the formula or rule directly to new values] [2 marks]\n\n7. [${params.topic} single-step calculation \u2014 final fluency check, still one operation only] [2 marks]`;
        structuredSections.push(`{"title": "Section A \u2014 Warm-Up Fluency", "type": "q-short-answer", "marks": 10, "content": "${sectionAMaths.replace(/"/g, '\\"')}"}`);
      } else {
        const sectionBContent = `1. [${params.topic} recall or identification question] [1 mark]\n\n2. [${params.topic} short-answer question using a subject-specific skill] [2 marks]\n\n3. [${params.topic} application or process question \u2014 show working where needed] [3 marks]\n\n4. [${params.topic} describe or explain question using subject terminology] [2 marks]`;
        structuredSections.push(`{"title": "Section B \u2014 Foundation Questions", "type": "q-short-answer", "marks": 8, "content": "${sectionBContent.replace(/"/g, '\\"')}"}`);
      }
    }
        // 9. Diagram B — full-page spread (between Section B and Section C Questions)
    // Only include Diagram B if it has a unique image URL from the admin library (no SVG fallbacks)
    if (wantDiagramB && diagramBUrl) {
      const diagBSection: Record<string, unknown> = {
        title: 'Diagram B',
        type: 'diagram',
        fullPage: true,
        content: diagramBCaption,
        caption: diagramBCaption,
        imageUrl: diagramBUrl,
      };
      structuredSections.push(JSON.stringify(diagBSection));
    }

    // 10. Section C Questions — non-maths: Core Practice.
    //     Maths: PR-M2 reshape — this slot becomes the new SECTION B
    //     (procedural, harder: 7 multi-step calculations, 2–3 marks each).
    if (wantSectionC) {
      if (isMaths) {
        // ── PR-M2 — Section B (Procedural, Harder) ────────────────────────
        // 7 multi-step calculation questions. Mark spread: 2,2,3,2,3,2,3 →
        // total 17 marks, avg 2.43 marks/Q. Each question MUST require at
        // least one more step than its Section A equivalent (decimals, mixed
        // fractions, sign changes, harder order-of-operations).
        const sectionBMaths = `1. [${params.topic} two-step calculation \u2014 mixed numbers or decimals, show method then answer] [2 marks]\n\n2. [${params.topic} two-step calculation \u2014 introduces a sign change or order-of-operations decision] [2 marks]\n\n3. [${params.topic} three-step calculation \u2014 combine the rule with a related skill, full working required] [3 marks]\n\n4. [${params.topic} two-step calculation \u2014 trickier numbers (negatives, fractions, surds where appropriate)] [2 marks]\n\n5. [${params.topic} three-step calculation \u2014 rearrange before substituting, then evaluate] [3 marks]\n\n6. [${params.topic} two-step calculation \u2014 unit conversion or place-value shift built in] [2 marks]\n\n7. [${params.topic} three-step calculation \u2014 final stretch, must select correct method] [3 marks]`;
        structuredSections.push(`{"title": "Section B \u2014 Procedural Practice", "type": "q-short-answer", "marks": 17, "content": "${sectionBMaths.replace(/"/g, '\\"')}"}`);
      } else {
        const sectionCContent = `1. [${params.topic} knowledge recall question] [1 mark]\n\n2. [${params.topic} comprehension or identification question] [2 marks]\n\n3. [${params.topic} application question \u2014 apply knowledge to a scenario] [3 marks]\n\n4. [${params.topic} analysis question \u2014 explain or describe with subject-specific detail] [4 marks]\n\n5. [${params.topic} evaluation or extended-response question \u2014 assess, discuss, or justify with evidence] [6 marks]\n   Your answer should include:\n   \u2022 [Point 1 with evidence]\n   \u2022 [Point 2 with evidence]\n   \u2022 [Point 3 with evidence]\n\n6. [${params.topic} synoptic or extended question linking to a wider concept] [4 marks]`;
        structuredSections.push(`{"title": "Section C \u2014 Core Practice", "type": "q-extended", "marks": 20, "content": "${sectionCContent.replace(/"/g, '\\"')}"}`);
      }
    }
        // 11. Challenge Question — non-maths: synoptic challenge.
        //     Maths: PR-M2 reshape — this slot becomes the new SECTION C
        //     (problem-solving). Y7-8 → exam-style word problems with
        //     calculation answers. Y9-11 → exam-style past-paper-shaped
        //     questions matching tier + paper + AO mix. Both are
        //     CALCULATION-ONLY: no "describe / explain" command words.
    if (wantSectionC) {
      if (isMaths) {
        // ── Year-group routing ────────────────────────────────────────────
        const yearMatch = /year\s*(\d+)/i.exec(params.yearGroup || "");
        const yearNum = yearMatch ? Number(yearMatch[1]) : 9;
        const isLowerSecondary = yearNum >= 7 && yearNum <= 8;
        // ── PR-M2 — Section C (Problem-Solving / Exam-Style) ──────────────
        // 5 questions, marks: 3,4,4,4,5 → total 20 marks, avg 4.0 marks/Q.
        // Strict avg progression A(1.43) < B(2.43) < C(4.0) ✔
        // Every question MUST start with an allowed calculation verb
        // (Calculate / Work out / Find / Solve / Show that / Determine /
        // Hence find / How much / How many / How long).
        const sectionCMaths = isLowerSecondary
          ? `1. Work out [${params.topic} problem set in a real-world context \u2014 money, recipe, journey, ratio in a shop \u2014 single quantity to find] [3 marks]\n\n2. Calculate [${params.topic} two-step word problem \u2014 must extract values from the context, then compute] [4 marks]\n\n3. Find [${params.topic} multi-step word problem \u2014 distance / time / cost / ratio context, parts (a) and (b) building on each other] [4 marks]\n\n4. Show that [${params.topic} numerical claim is correct \u2014 pupil works out the value and verifies it equals the stated number] [4 marks]\n\n5. How many / How much [${params.topic} extended word problem \u2014 chooses the method, calculates, gives the final number with units] [5 marks]`
          : `1. Calculate [${params.topic} GCSE-style 3-mark question matching ${params.yearGroup} tier \u2014 method, substitution, answer] [3 marks]\n\n2. Solve [${params.topic} GCSE-style 4-mark question \u2014 multi-step, AO1/AO2 weighting] [4 marks]\n\n3. Find [${params.topic} GCSE-style 4-mark question with parts (a) and (b) \u2014 part (a) sets up, part (b) uses the result] [4 marks]\n\n4. Show that [${params.topic} GCSE-style 4-mark "show that" question \u2014 pupil derives the stated numerical result, full working only] [4 marks]\n\n5. Determine [${params.topic} GCSE-style 5-mark AO3 problem-solving question \u2014 chooses method, calculates, states answer with units] [5 marks]`;
        structuredSections.push(`{"title": "Section C \u2014 ${isLowerSecondary ? 'Problem Solving' : 'Exam-Style Practice'}", "type": "q-extended", "marks": 20, "content": "${sectionCMaths.replace(/"/g, '\\"')}"}`);
      } else {
        const challengeContent = `Challenge yourself! [8 marks]\n\n1. [Higher-order ${params.topic} question requiring analysis, evaluation or synthesis \u2014 use subject-specific command words] [4 marks]\n\n2. [Synoptic or cross-topic question linking ${params.topic} to a wider concept or real-world application] [4 marks]`;
        structuredSections.push(`{"title": "Challenge Question", "type": "challenge", "marks": 8, "content": "${challengeContent.replace(/"/g, '\\"')}"}`);
      }
    }
        // 12. Revision Tips — examiner-voice 5-tip panel (Phase 3).
    // Deterministic, topic-anchored. Pushed BEFORE the Self-Reflection
    // section so the printed page order is: questions → tips → reflect.
    // The structured-path emit pushes a worked example built from the
    // single source of truth (`revisionTipsBuilder.ts`); the AI is asked
    // to either match that structure or its output is replaced by
    // `enforceRevisionTipsPresence` in the post-validator chain.
    if (wantRevisionTips) {
      const sendKeyTips = hasSend ? (params.sendNeed || "").toLowerCase().replace(/[\s_]/g, "-") : "";
      const tips = buildRevisionTips({
        topic: params.topic,
        subject: params.subject,
        year: params.yearGroup,
        examBoard: params.examBoard,
        sendKey: sendKeyTips,
      });
      const tipsContent = renderRevisionTipsAsMarkerBlock(tips);
      structuredSections.push(`{"title": "Examiner Tips", "type": "revision-tips", "teacherOnly": false, "content": "${tipsContent.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}`);
    }

        // 13. Self Reflection — SEND-specific format
    // Phase 2 — Topic-specific Self-Reflection. The SEND register-tuned
    // content for this section is now produced by selfReflectionBuilder
    // (single source of truth). The builder mirrors the same five SEND
    // branches that used to live as inline string literals here
    // (tick-box / sentence-starter / emotional check-in / older-learner /
    // standard) and always emits topic-anchored content — every "I can"
    // statement and the exit ticket name the actual topic. The previous
    // sentence-starter branch emitted the literal placeholder
    // `WRITTEN_PROMPTS:\nI can ___.\n` which left an unfilled blank on
    // the pupil page; that bug is fixed at source by the builder.
    if (wantSelfReflection) {
      const sendKey = hasSend ? (params.sendNeed || "").toLowerCase().replace(/[\s_]/g, "-") : "";
      const reflection = buildSelfReflection({
        topic: params.topic,
        subject: params.subject,
        year: params.yearGroup,
        sendKey,
      });
      const selfReflectionContent = renderSelfReflectionAsMarkerBlock(reflection);
      structuredSections.push(`{"title": "Self Reflection", "type": "self-reflection", "teacherOnly": false, "content": "${selfReflectionContent.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}`);
    }

    // Always add Teacher Key (teacher only)
    structuredSections.push(`{"title": "Teacher Key", "type": "mark-scheme", "teacherOnly": true, "content": "TEACHER KEY — TEACHER USE ONLY\n\nWrite a COMPLETE model answer for EVERY question above. No placeholders. Include mark allocations. For each section:\n• Retrieval: Q1/Q2/Q3 answers\n• Section A: True/False answers with brief reason; MCQ correct letter + answer; Gap Fill words in order; Match correct pairs\n• Section B: Full model answer per question with mark allocation\n• Section C: Full model answer per question; for extended answers list marking points explicitly\n• Challenge: Full model answer with method/working where required\n${isMaths ? 'Show full working for every calculation: method → substitution → answer → units.' : 'State command word requirement and what a full-mark answer must include.'}"}`);

    // ── PR #2 (worksheet-gen-efficiency) — gate per-section rules
    //   Previously the RULES list always included MCQ/MATCH/VOCAB/GAP-FILL
    //   rules even when those sections weren't emitted (e.g. maths sheets
    //   never have T/F/MCQ/gap-fill, but the prompt still told the model
    //   how to format them). Now only the relevant rules ship. Also
    //   repairs two pre-existing typos in the rule list: a stray
    //   `\t1982\t` token between rules 6 and 7, and "PEC QUALITY" → "SPEC
    //   QUALITY" on rule 8.
    const structuredUserRules: string[] = [
      `1. Every question must be COMPLETE and fully usable — no placeholders, no "...", no unfinished sentences.`,
      `2. Use REAL numbers and REAL contexts — never "a number", always "24", "3.7", "Birmingham".`,
      `3. Questions must escalate in difficulty (easiest first, hardest last).`,
      `4. ABSOLUTELY NO EMOJIS anywhere in the output.`,
      `5. No HTML, no markdown, no code fences in content strings.`,
      `6. Each step, question, or item must be on its own line using \\n.`,
    ];
    if (isMaths) {
      structuredUserRules.push(`7. MATHS ONLY: All questions in EVERY section must be 100% calculation-based only. Never ask students to explain, describe, define, or write prose. Every question must require a numerical or algebraic calculation. Use LaTeX for all math expressions.`);
    }
    structuredUserRules.push(
      `8. SPEC QUALITY: Every question must be at genuine ${params.yearGroup} exam standard — use real exam command words (describe, explain, evaluate, calculate, state, identify, compare, justify, analyse). Questions must test the actual curriculum content of "${params.topic}" — not generic or trivially easy questions.`,
    );
    if (wantMCQ && !isMaths) {
      structuredUserRules.push(`9. MCQ RULE: Mark the correct MCQ option with \\u2713 at the end of that option line ONLY. Do NOT write "CORRECT:", "NOTE:", or any meta-instruction text in the content string — output ONLY the question and four options.`);
    }
    structuredUserRules.push(
      `10. MARK SCHEME RULE: The mark scheme section MUST contain a complete, full answer for every single question. No placeholders. Write actual answers.`,
    );
    if (wantKeyVocab) {
      structuredUserRules.push(`11. VOCAB RULE: Key Vocabulary must contain EXACTLY 5 terms — no more, no fewer.`);
    }
    if (wantWordBankGapFill && !isMaths) {
      structuredUserRules.push(`12. GAP FILL RULE: The gap fill paragraph MUST contain EXACTLY 7 blanks (shown as _____). Before you finish, count every _____ in your paragraph — if there are fewer than 7, add more sentences until you reach exactly 7. The word bank MUST have EXACTLY 10 words (7 correct answers + 3 distractors).`);
    }
    if (isMaths) {
      structuredUserRules.push(
        `13. MATHS PROGRESSION RULE (mandatory for every maths worksheet — checked by post-validator):
   - Section A is the WARM-UP. Every question is single-step. Numbers are clean (whole numbers, simple fractions). Mark range per Q: 1–2.
   - Section B is HARDER than A. Every question is multi-step (at least one more step than its Section A equivalent). Trickier numbers (decimals, mixed fractions, sign changes). Mark range per Q: 2–3.
   - Section C is HARDER than B. ${/year\s*[7-8]\b/i.test(params.yearGroup || "") ? "Real-world problem-solving (money, recipes, journeys, ratios)." : "Exam-style past-paper-shaped questions matching tier and AO mix."} Mark range per Q: 3–6.
   - Average marks-per-question MUST satisfy strict progression: avg(A) < avg(B) < avg(C). Count and verify before returning.
   - Section C COMMAND WORDS — every question MUST start with one of: Calculate, Work out, Find, Solve, Show that, Prove that, Determine, Hence find, How much, How many, How long, How far. FORBIDDEN: describe, explain, discuss, comment on, compare, evaluate-in-words, justify-in-words, outline, give reasons. Every Section C answer MUST be a number or algebraic value reached by calculation — never an essay.
14. MATHS-ONLY HARD REMOVALS: Do NOT generate any True/False section, MCQ section (unless explicitly requested), or word-bank/gap-fill section for maths worksheets — these are blocked at the form layer and must not appear under any spec drift.`,
      );
    }

    const structuredUserHeaderLines = [
      `Create a professional, print-ready worksheet in valid raw JSON only.`,
      `Subject: ${params.subject} | Year: ${params.yearGroup} (${phase}) | Topic: ${params.topic} | Difficulty: ${params.difficulty || "mixed"}`,
      examBoardNote,
      mathsNote,
      topicEnforcementNote,
      dataCompletenessNote,
      params.additionalInstructions
        ? `\nADDITIONAL REQUIREMENTS (Priority override — must be followed):\n${params.additionalInstructions}\n`
        : '',
    ].map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);

    const structuredUser = `${structuredUserHeaderLines.join('\n')}

RULES:
${structuredUserRules.join('\n')}

Return EXACTLY this JSON (raw JSON only, no markdown fences):
{
  "title": "${params.topic} — ${params.yearGroup} ${subjectDisplay} Worksheet",
  "subtitle": "${params.yearGroup} | ${subjectDisplay} | ${params.difficulty || 'Standard'}",
  "sections": [
    ${structuredSections.join(',\n    ')}
  ],
  "metadata": {
    "subject": "${params.subject}",
    "topic": "${params.topic}",
    "yearGroup": "${params.yearGroup || ''}",
    "difficulty": "${params.difficulty || 'standard'}",
    "misconceptionsTargeted": ["array of misconception IDs from the MISCONCEPTION-AWARE block above that you actually designed distractors for, e.g. m-frac-01"]
  }
}`;

    const { text: structuredText, provider: structuredProvider } = await callAI(structuredSystem, structuredUser, 6500, { responseFormat: "json_object" });
    const structuredCleaned = structuredText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    let structuredJson: any;
    let structuredParseError: unknown = null;
    try {
      structuredJson = parseWithFixes(structuredCleaned);
    } catch (firstErr) {
      structuredParseError = firstErr;
      const repaired = repairTruncatedJson(structuredCleaned);
      if (repaired) {
        try {
          structuredJson = parseWithFixes(repaired);
          structuredParseError = null;
          console.info("[Adaptly AI] Recovered structured JSON via repair");
        } catch (repairErr) {
          structuredParseError = repairErr;
        }
      }
    }
    if (structuredParseError) {
      // Was previously swallowed silently — now log so silent failures across
      // every provider are visible in the browser console and Sentry.
      console.warn(
        "[Adaptly AI] Structured path JSON parse failed (provider=" + structuredProvider + "), falling back to legacy generator. Raw:",
        structuredText.slice(0, 240)
      );
    } else if (!structuredJson || !Array.isArray(structuredJson?.sections) || structuredJson.sections.length === 0) {
      console.warn(
        "[Adaptly AI] Structured path returned empty/invalid sections (provider=" + structuredProvider + "), falling back to legacy generator."
      );
    }
    if (structuredJson && structuredJson.sections && Array.isArray(structuredJson.sections) && structuredJson.sections.length > 0) {
      // Strip asterisks from all content
      structuredJson.sections = structuredJson.sections.map((s: any) => ({
        ...s,
        title: typeof s.title === 'string' ? s.title.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*/g, '').trim() : s.title,
        content: typeof s.content === 'string' ? s.content.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*/g, '').trim() : s.content,
      }));
      // ── Phase 4 / FEAT-002 — strip [m-xxx] misconception ID markers from
      // any visible content (the prompt forbids them in question text but
      // some models still leak them; defensive strip).
      structuredJson.sections = structuredJson.sections.map((s: any) => ({
        ...s,
        content: typeof s.content === 'string'
          ? s.content.replace(/\s*\[m-[a-z0-9-]+\]\s*/gi, ' ').replace(/\s{2,}/g, ' ').trim()
          : s.content,
      }));
      // Post-parse: inject pre-fetched svg into diagram sections that have no imageUrl
      // (svg was not embedded in the prompt to avoid token bloat)
      let diagramSlotsFound = 0;
      structuredJson.sections = structuredJson.sections.map((s: any) => {
        if (s.type !== 'diagram') return s;
        diagramSlotsFound++;
        if (s.imageUrl) return s; // already has a real image URL — keep it
        if (diagramSlotsFound === 1 && diagramASvg) return { ...s, svg: diagramASvg, caption: s.caption || diagramACaption };
        if (diagramSlotsFound === 2 && diagramBSvg) return { ...s, svg: diagramBSvg, caption: s.caption || diagramBCaption };
        return s;
      });
      // Ensure metadata is always present — prevents crash in saveWorksheet
      if (!structuredJson.metadata) {
        structuredJson.metadata = {
          subject: params.subject,
          topic: params.topic,
          yearGroup: params.yearGroup || '',
          difficulty: params.difficulty || 'standard',
          examBoard: params.examBoard || 'General',
          sendNeed: params.sendNeed || undefined,
        };
      }
      // FIX-SEND-01: Unconditionally stamp the user-selected SEND need into
      // metadata so that LLM-returned null/stale values can never override it.
      // The enforcer and renderer both read metadata.sendNeed / metadata.sendNeedId
      // so both fields must be set here, before any downstream pass runs.
      if (params.sendNeed && params.sendNeed !== 'none-selected') {
        structuredJson.metadata.sendNeed = params.sendNeed;
        structuredJson.metadata.sendNeedId = params.sendNeed;
      } else {
        // Explicitly clear stale LLM-provided values when no SEND need was selected.
        structuredJson.metadata.sendNeed = null;
        structuredJson.metadata.sendNeedId = null;
      }
      // ── Phase 4 / FEAT-002 — capture & validate misconceptionsTargeted ──
      // The AI is asked to return an array of misconception IDs it targeted.
      // We sanity-check those IDs against the bank so only valid ones survive.
      // If the AI omitted the field, fall back to the IDs we asked for.
      try {
        const candidateIds = getMisconceptionsForTopic({
          subject: params.subject,
          topic: params.topic,
          yearGroup: params.yearGroup,
          limit: 5,
        }).map((e) => e.id);
        const candidateSet = new Set(candidateIds);
        const raw: unknown = structuredJson.metadata?.misconceptionsTargeted;
        let valid: string[] = [];
        if (Array.isArray(raw)) {
          valid = raw
            .filter((x: unknown): x is string => typeof x === 'string')
            .map((x) => x.trim().toLowerCase())
            .filter((x) => candidateSet.has(x));
        }
        if (valid.length === 0 && candidateIds.length > 0) {
          // The AI did not echo back IDs — record what we asked it to target
          // so the teacher view still surfaces useful information.
          valid = candidateIds;
        }
        if (valid.length > 0) {
          structuredJson.metadata.misconceptionsTargeted = valid;
        }
      } catch { /* never block worksheet generation on misconception metadata */ }
      // ── Post-validator: deterministic fixes for content bugs flagged in
      // live scrutiny reviews (multi-tick MCQ, duplicate word bank, foreign
      // diagrams on science sheets, year-group drift, overlong worked
      // example). Runs BEFORE the SEND enforcer so its fixes are visible to
      // downstream passes.
      const postValidated = runWorksheetPostValidators(structuredJson, {
        subject: params.subject,
        yearGroup: params.yearGroup,
        sendNeed: params.sendNeed,
        // Phase 1 — needed by enforceSpecAnchorPresence to resolve the
        // matching awarding-body taxonomy.
        examBoard: params.examBoard,
        // Phase 2 — needed by enforceSelfReflectionTopicAnchor so the
        // builder can anchor reflection statements to the actual topic
        // and the generic-content detector can verify topic mentions.
        topic: params.topic,
      });
      // Carry through the original shape — the post-validator preserves every
      // field, it only rewrites content in-place.
      const postValidatedWorksheet = postValidated.worksheet as typeof structuredJson;
      // ── SEND enforcer: deterministic post-process that guarantees the
      // adaptations the UI promised (ADHD inline checkboxes, 3-Q cap, brain
      // break, etc.) actually appear — even if the LLM skipped them. Runs on
      // the structured (primary) path before the overlay engine sees it.
      const enforcedStructured = enforceSendAdaptations(postValidatedWorksheet, params.sendNeed, { preserveStems: preserveStemsForSend });
      // FEAT-PB6 — non-blocking SEND fidelity audit: probes every adaptation
      // rule and stamps a per-rule report onto metadata.sendFidelityReport.
      const auditedStructured = applySendFidelityAudit(
        enforcedStructured.worksheet as typeof structuredJson,
        params.sendNeed,
      );
      // FEAT-PC8 — non-blocking maths FRP strand audit (no-op for non-maths).
      const strandTaggedStructured = applyMathsStrandTagging(
        auditedStructured as typeof structuredJson,
        { subject: params.subject, yearGroup: params.yearGroup },
      );
      // PR-M2 — non-blocking maths progression audit (Section A/B/C mark
      // progression + Section C calculation-only command-word audit).
      // No-op for non-maths.
      const progressionTaggedStructured = applyMathsProgressionAudit(
        strandTaggedStructured,
        { subject: params.subject, yearGroup: params.yearGroup },
      );
      // PR-M3 — non-blocking Common Mistakes audit. Confirms every maths
      // mistake block has the four labelled parts AND ≥2 numeric tokens in
      // the wrong-working line. No-op for non-maths.
      const commonMistakesTaggedStructured = applyCommonMistakesAudit(
        progressionTaggedStructured,
        { subject: params.subject },
      );
      // PR-M3-followup — active regenerate. The audit above is advisory;
      // this step takes its report and rewrites each failing block via
      // aiEditSection with the diagnostic detail in the prompt. Blocks
      // that still fail after one retry keep the original + warning, so
      // the teacher banner stays accurate. No-op for non-maths and for
      // sheets where every block already passes.
      const commonMistakesRegenerator: CommonMistakesRegenerator = async ({
        originalBlock,
        diagnostic,
        subject: blockSubject,
        yearGroup: blockYearGroup,
      }) => {
        const result = await aiEditSection({
          sectionTitle: 'Common Mistakes to Avoid',
          currentContent: originalBlock,
          instruction: diagnostic,
          subject: blockSubject,
          yearGroup: blockYearGroup,
        });
        return result.newContent;
      };
      const commonMistakesRegeneratedStructured =
        await applyCommonMistakesActiveRegenerate(
          commonMistakesTaggedStructured,
          commonMistakesRegenerator,
          { subject: params.subject, yearGroup: params.yearGroup },
        );
      // FEAT-PC9 — non-blocking Required-Practical tagging (KS4 science only).
      const practicalTaggedStructured = applyRequiredPracticalTagging(
        commonMistakesRegeneratedStructured,
        {
          subject: params.subject,
          topic: params.topic,
          yearGroup: params.yearGroup,
          examBoard: params.examBoard,
        },
      );
      // FEAT-PC10 — coverage map (Y9+ only). Runs last so misconceptionLinks
      // populated by FEAT-PB7 are visible.
      const coverageTaggedStructured = applyCoverageMap(practicalTaggedStructured, {
        subject: params.subject,
        topic: params.topic,
        yearGroup: params.yearGroup,
      });
      // FEAT-PA — Pillar A audits (AO histogram, 6-mark LOR, synoptic links).
      // Stamps metadata.aoHistogram / lorPresent / synopticLinks and pushes
      // non-blocking warnings onto metadata.postValidatorWarnings. Echoes
      // paper / calculator / priorTopics back to metadata for the renderer.
      const pillarATaggedStructured = applyPillarAAudits(coverageTaggedStructured as any, {
        subject: params.subject,
        topic: params.topic,
        yearGroup: params.yearGroup,
        examBoard: params.examBoard,
        examStyle: params.examStyle,
        priorTopics: effectivePriorTopics,
      }) as typeof coverageTaggedStructured;
      pillarATaggedStructured.metadata = {
        ...(pillarATaggedStructured.metadata ?? {}),
        ...(params.paper ? { paper: params.paper } : {}),
        ...(typeof params.calculator === "boolean" ? { calculator: params.calculator } : {}),
        ...(effectivePriorTopics.length > 0 ? { priorTopics: effectivePriorTopics } : {}),
      };
      // FEAT-PB1 — Per-question provenance (specRef, AO, bloomLevel, readingAge).
      const provenanceTaggedStructured = applyQuestionProvenance(pillarATaggedStructured, {
        subject: params.subject,
        topic: params.topic,
        yearGroup: params.yearGroup,
      });
      // FEAT-PB2 — Symbolic maths verification (CAS round-trip). No-op for
      // non-maths subjects; for maths sheets stamps metadata.mathsVerification
      // and pushes any mismatch warnings into metadata.postValidatorWarnings.
      const casTaggedStructured = applyMathsVerification(provenanceTaggedStructured, {
        subject: params.subject,
      });
      return { ...casTaggedStructured, isAI: true, provider: structuredProvider };
    }
    // If structured generation failed, fall through to legacy path
  }

  const user = `Create one printable worksheet in valid raw JSON only.
Subject: ${params.subject} | Year: ${params.yearGroup} (${phase}) | Topic: ${params.topic} | Difficulty: ${params.difficulty || "mixed"}
${examBoardNote} ${lengthNote}
${pageCountNote}
${readingAgeNote}
${primaryLayoutNote}
${mathsNote}
${sendNote}
${stemPreservationNote}
${requiredPracticalNote}
${paperCalcNote}
${examStemAnchorsBlock}
${lorBlock}
${synopticBlock}
${examPaperTemplateBlock}
${subjectSpecNote}
${tierNote}
${examStyleNote}
${formulaNote} ${reminderBoxNote} ${wordProblemsNote} ${commonMistakesNote}
${topicEnforcementNote}
${graphDrawingNote}
${dataCompletenessNote}
${diagramRelevanceNote}
${vocabularyCapNote}
${svgDiagramNote}
${recallNote}
${params.additionalInstructions ? `\nPriority override:\n${params.additionalInstructions}\n` : ""}

Structure required:
1. ${isPrimary ? "What Are We Learning?" : "Learning Objectives"}
2. ${isPrimary ? "Key Words" : "Key Vocabulary (maximum 5 items)"}
3. ${isPrimary ? "Common Mistakes" : "Common Mistakes to Avoid"}
4. ${isPrimary ? "Let's Try Together (worked example)" : "Worked Example"}
5. ${isPrimary ? (yearNum <= 2 ? "Have a Go!" : "Warm Up") : "SECTION 1 — RECALL (Q1 True/False, Q2 MCQ, Q3 Gap Fill)"}
6. ${isPrimary ? (yearNum <= 2 ? "Let's Practise" : "Let's Practise More") : "SECTION 2 — UNDERSTANDING (Q4 Label/Diagram, Q5 Source/Extract, Q6 Table Completion)"}
7. ${isPrimary ? "Think About It (real-life questions)" : "SECTION 3 — APPLICATION & ANALYSIS (Q7 Extended, Q8 Diagram+Answer, Q9 Evaluative)"}
8. ${isPrimary ? "Super Challenge!" : "Challenge Question"}
9. ${isPrimary ? "How Did I Do?" : "Self Reflection"}
10. Mark Scheme (teacher only)
11. Teacher Notes (teacher only)
12. SEND Adaptations & Rationale (teacher only when SEND applies)

Formatting rules:
- Each question, step, bullet, or item must be on its own new line using \n.
- No HTML, no markdown, no code fences.
- Keep wording concise and printable.
- If SEND applies, show the adaptations in the pupil-facing sections, not just teacher notes.
- For maths, keep notation clean and readable in print/PDF.
- Use lots of variety: circle the answer, tick the box, fill the blank, match with a line, draw and label, true/false. Vary every 2-3 questions. Short instructions only — max 8 words each.
- ABSOLUTELY NO EMOJIS anywhere in the output.

ADVANCED QUESTION TYPES — use 1–2 per worksheet for variety:
- type "error_correction": Show a worked solution with a deliberate mistake. Student finds the error, explains why it is wrong, writes the correct answer. Layout: left = boxed solution, right = response questions.
- type "ranking": Give 4–6 items to order by a rule (e.g. smallest to largest). Student ranks them and explains reasoning. Layout: item list + ranking boxes + explanation box.
- type "what_changed": Show Scenario A vs Scenario B. Student identifies what changed, what happens, and why. Layout: left = two scenarios, right = structured questions.
- type "constraint_problem": Give a goal with 2–4 constraints. Student solves while following all rules. Layout: boxed constraint list + working space + explanation.
Place ranking in Section 1 (recall), error_correction/what_changed in Section 2 (understanding), constraint_problem in Section 3 (application). Never place the same advanced type adjacent to itself.

Return EXACTLY this JSON (raw JSON only):
{
  "title": "${params.topic} — ${params.yearGroup} ${subjectDisplay} Worksheet",
  "subtitle": "${params.yearGroup} (${phase}) | ${subjectDisplay} | ${params.examBoard && params.examBoard !== 'none' ? params.examBoard : 'General'} | ${timingGuide}",
  "sections": [
    // ── PRIMARY SCHOOL (Chalkie style) ──
    ...(isPrimary ? [
      {"title": "Activity 1", "type": "q-primary-activity", "content": "[ONE clear, simple instruction sentence (max 8 words)]\n1. [Activity question 1]\n2. [Activity question 2]\n3. [Activity question 3]\n4. [Activity question 4]\n5. [Activity question 5]"},
      {"title": "Activity 2", "type": "q-primary-activity", "content": "[ONE clear, simple instruction sentence (max 8 words) for a DIFFERENT activity type]\n1. [Activity question 1]\n2. [Activity question 2]\n3. [Activity question 3]\n4. [Activity question 4]\n5. [Activity question 5]"},
      {"title": "Activity 3", "type": "q-primary-activity", "content": "[ONE clear, simple instruction sentence (max 8 words) for a DIFFERENT activity type]\n1. [Activity question 1]\n2. [Activity question 2]\n3. [Activity question 3]\n4. [Activity question 4]\n5. [Activity question 5]"},
      {"title": "Self Reflection", "type": "self-reflection", "teacherOnly": false, "content": "I found this:\n[ ] Easy\n[ ] OK\n[ ] Tricky"}
    ] : [
    // ── SECONDARY SCHOOL (GCSE style) ──
    {"title": "Learning Objectives", "type": "objective", "content": "[One clear learning objective sentence for ${params.topic}]"},
    ${params.recallTopic ? `{"title": "Retrieval Practice \u2014 ${params.recallTopic}", "type": "prior-knowledge", "content": "Recall from last lesson!\n1. [True/False statement about ${params.recallTopic}] TRUE / FALSE\n2. [Short question about ${params.recallTopic}]\n3. [Fill-in-blank about ${params.recallTopic}]"},` : ''}
    {"title": "Key Vocabulary", "type": "vocabulary", "content": "[6-8 terms, one per line: term | definition]"},
    {"title": "Common Mistakes to Avoid", "type": "common-mistakes", "teacherOnly": false, "content": "[3-4 common mistakes. Format each as:\nMISTAKE TITLE\n→ explanation of the mistake and how to avoid it]"},
    ${isMaths && !params.examStyle ? `{"title": "Key Formulas", "type": "example", "content": "[LaTeX formulas or: No formula required]"},` : ''}
    {"title": "Worked Example", "type": "example", "content": "[${exampleGuide}]"}${params.introOnly ? '' : `,
    {"title": "Q1 — True or False", "type": "q-true-false", "content": "Circle TRUE or FALSE for each statement. [4 marks]\n1. [statement about ${params.topic}] TRUE\n2. [statement about ${params.topic}] FALSE\n3. [statement about ${params.topic}] TRUE\n4. [statement about ${params.topic}] FALSE"},
    {"title": "Q2 — Multiple Choice", "type": "q-mcq", "content": "[Question about ${params.topic}] [1 mark]\nA  [option]\nB  [option]\nC  [option]\nD  [option]\nCORRECT: [correct letter only — do NOT mark with ✓ in the options above]"},
    {"title": "Q3 — Cloze Paragraph", "type": "q-gap-fill", "content": "Complete the paragraph using words from the word bank. [7 marks]\n[5–7 sentence summary paragraph about ${params.topic} with exactly 7 blanks shown as _____]\nWORD BANK: word1 | word2 | word3 | word4 | word5 | word6 | word7 | word8 | word9 | word10"},
    {"title": "Q4 — Recall", "type": "q-short-answer", "content": "[Single short recall question: state the definition of a key term from ${params.topic}. GCSE-accurate wording.] [1 mark]\\nAnswer: ___________", "marks": 1},
    {"title": "Q5 — Recall", "type": "q-short-answer", "content": "[Single short recall question: name or identify a second key term, process or fact from ${params.topic}. Different from Q4.] [1 mark]\\nAnswer: ___________", "marks": 1},
    {"title": "Q6 — Recall", "type": "q-short-answer", "content": "[Single short recall question: give a one-sentence explanation of a concept from ${params.topic}.] [2 marks]\\nAnswer: ___________\\n___________", "marks": 2},
    {"title": "Q7 — Recall", "type": "q-short-answer", "content": "${isSTEM ? '[Single short recall question: state the formula or equation used in ${params.topic}.] [2 marks]\\nAnswer: ___________\\n___________' : '[Single short recall question: identify a key event, quotation or technique from ${params.topic}.] [2 marks]\\nAnswer: ___________\\n___________'}", "marks": 2},
    {"title": "Q8 — Recall", "type": "q-short-answer", "content": "[Single short recall question: state or name something specific about ${params.topic}. One-word or one-phrase answer.] [1 mark]\\nAnswer: ___________", "marks": 1},
    {"title": "Q9 — Recall", "type": "q-short-answer", "content": "[Single short recall question: state one cause, effect or consequence related to ${params.topic}.] [2 marks]\\nAnswer: ___________\\n___________", "marks": 2},
    {"title": "Q10 — Understanding", "type": "q-short-answer", "content": "${isSTEM ? '[Single understanding question (Define): define a key term from ${params.topic} and give one example.] [2 marks]\\nAnswer: ___________\\n___________' : '[Single understanding question: identify and explain a key idea from ${params.topic}.] [2 marks]\\nAnswer: ___________\\n___________'}", "marks": 2},
    {"title": "Q11 — Understanding", "type": "q-short-answer", "content": "${isSTEM ? '[Single understanding question (Explain): explain a process or mechanism in ${params.topic}. Harder than Section 1.] [3 marks]\\nAnswer: ___________\\n___________\\n___________' : '[Single understanding question: explain the significance of a key idea in ${params.topic}.] [3 marks]\\nAnswer: ___________\\n___________\\n___________'}", "marks": 3},
    {"title": "Q12 — Understanding", "type": "q-short-answer", "content": "${isSTEM ? '[Single understanding question (Describe): describe the relationship between two variables or concepts in ${params.topic}.] [3 marks]\\nAnswer: ___________\\n___________\\n___________' : '[Single understanding question: describe how a technique or method is used in ${params.topic}.] [3 marks]\\nAnswer: ___________\\n___________\\n___________'}", "marks": 3},
    {"title": "Q13 — Understanding", "type": "q-short-answer", "content": "${isSTEM ? '[Single understanding question (Compare): compare two aspects of ${params.topic}. Requires a two-sided answer.] [4 marks]\\nAnswer: ___________\\n___________\\n___________\\n___________' : '[Single understanding question: compare two aspects of ${params.topic}.] [4 marks]\\nAnswer: ___________\\n___________\\n___________\\n___________'}", "marks": 4},
    {"title": "Q14 — Understanding", "type": "q-short-answer", "content": "${isSTEM ? '[Single understanding question: calculate or determine a value related to ${params.topic}. Show working. Harder than Section 1.] [3 marks]\\nWorking:\\n___________\\n___________\\nAnswer: ___________' : '[Single understanding question: analyse how a key idea develops or changes in ${params.topic}.] [3 marks]\\nAnswer: ___________\\n___________\\n___________'}", "marks": 3},
    {"title": "Q15 — Understanding", "type": "q-short-answer", "content": "${isSTEM ? '[Single understanding question (Suggest): suggest a reason for an observation or outcome related to ${params.topic}.] [2 marks]\\nAnswer: ___________\\n___________' : '[Single understanding question: suggest how an author or creator uses technique and theme in ${params.topic}.] [2 marks]\\nAnswer: ___________\\n___________'}", "marks": 2},
    {"title": "Q16 — Exam Style", "type": "q-extended", "content": "${isSTEM ? '[EXAM-STYLE QUESTION — AQA/Edexcel GCSE style. Use exact examiner wording.\\n\\nDescribe and explain [specific process or concept from ${params.topic}]. [4 marks]\\n\\nYour answer:\\n___________\\n___________\\n___________\\n___________\\n\\nMark scheme: 1 mark each for four correct points from: [list 4 GCSE mark-scheme points]]' : '[EXAM-STYLE QUESTION — AQA/Edexcel GCSE style.\\n\\nExplain how [key idea or technique] is presented in ${params.topic}. [4 marks]\\n\\nYour answer:\\n___________\\n___________\\n___________\\n___________]'}", "marks": 4},
    {"title": "Q17 — Exam Style", "type": "q-extended", "content": "${isSTEM ? '[EXAM-STYLE QUESTION — AQA/Edexcel GCSE style.\\n\\nCalculate [specific calculation requiring formula application from ${params.topic}]. Show all working. [4 marks]\\n\\nWorking:\\n___________\\n___________\\n___________\\n\\nAnswer: ___________ (unit: ___)\\n\\nMark scheme: 1 mark formula, 1 mark substitution, 1 mark calculation, 1 mark correct answer with unit]' : '[EXAM-STYLE QUESTION — AQA/Edexcel GCSE style.\\n\\nAnalyse how [theme or technique] is developed in ${params.topic}. [4 marks]\\n\\nYour answer:\\n___________\\n___________\\n___________\\n___________]'}", "marks": 4},
    {"title": "Q18 — Exam Style", "type": "q-extended", "content": "${isSTEM ? '[EXAM-STYLE QUESTION — AQA/Edexcel GCSE style.\\n\\nEvaluate [a claim, method or approach related to ${params.topic}]. Give evidence for and against. [6 marks]\\n\\nYour answer:\\n___________\\n___________\\n___________\\n___________\\n___________\\n___________\\n\\nLevel descriptors:\\nLevel 3 (5-6 marks): Detailed evaluation with evidence on both sides and a clear conclusion.\\nLevel 2 (3-4 marks): Some evaluation with limited evidence.\\nLevel 1 (1-2 marks): Basic points only.]' : '[EXAM-STYLE QUESTION — AQA/Edexcel GCSE style.\\n\\nTo what extent [evaluative question about ${params.topic}]? [6 marks]\\n\\nYour answer:\\n___________\\n___________\\n___________\\n___________\\n___________\\n___________]'}", "marks": 6},
    {"title": "Q19 — Exam Style", "type": "q-extended", "content": "${isSTEM ? '[EXAM-STYLE QUESTION — AQA/Edexcel GCSE style.\\n\\nA student states: [common misconception or incorrect statement about ${params.topic}]\\n\\nExplain why this student is incorrect. Use scientific knowledge in your answer. [3 marks]\\n\\nYour answer:\\n___________\\n___________\\n___________\\n\\nMark scheme: 1 mark identifying the error, 2 marks correct scientific explanation]' : '[EXAM-STYLE QUESTION — AQA/Edexcel GCSE style.\\n\\nA student argues that [debatable claim about ${params.topic}]. Do you agree? Justify your answer with evidence. [3 marks]\\n\\nYour answer:\\n___________\\n___________\\n___________]'}", "marks": 3},
    {"title": "Q20 — Exam Style", "type": "q-extended", "content": "${isSTEM ? '[EXAM-STYLE QUESTION — AQA/Edexcel GCSE style.\\n\\nA scientist investigates [specific scenario related to ${params.topic}]. The results show [data or observation].\\n\\n(a) Suggest one conclusion that can be drawn from this data. [1 mark]\\nAnswer: ___________\\n\\n(b) Explain the scientific reason for this result. [2 marks]\\nAnswer: ___________\\n___________\\n\\n(c) Suggest one improvement to the investigation. [1 mark]\\nAnswer: ___________\\n\\nMark scheme: (a) 1 mark correct conclusion; (b) 2 marks scientific explanation; (c) 1 mark valid improvement]' : '[EXAM-STYLE QUESTION — AQA/Edexcel GCSE style.\\n\\n(a) Identify one key theme in ${params.topic}. [1 mark]\\nAnswer: ___________\\n\\n(b) Explain how this theme is developed. [2 marks]\\nAnswer: ___________\\n___________\\n\\n(c) Evaluate its importance to the text as a whole. [1 mark]\\nAnswer: ___________]'}", "marks": 4},
    {"title": "${sendSectionTitles.challenge}", "type": "challenge", "content": "[${challengeGuide}${hasSend ? ' — optional, labelled as bonus' : ''}]"},
    {"title": "Self Reflection", "type": "self-reflection", "teacherOnly": false, "content": "SUBTITLE: Review your understanding before moving on.\nCONFIDENCE_TABLE:\n[specific skill/concept 1 from ${params.topic}]\n[specific skill/concept 2 from ${params.topic}]\n[specific skill/concept 3 from ${params.topic}]\n[specific skill/concept 4 from ${params.topic}]\n[specific skill/concept 5 from ${params.topic}]\nWRITTEN_PROMPTS:\nOne concept I feel confident about is ...\nOne area I still need to practise is ...\nA question I still want to ask my teacher is ...\nEXIT_TICKET: Write ONE thing you learned today about ${params.topic} in one sentence:"},
    {"title": "Teacher Copy — Answer Key", "type": "mark-scheme", "teacherOnly": true, "content": "MARKING GUIDANCE: Accept reasonable alternatives. Award marks for clear reasoning and correct application.\nSECTION 1 — RECALL [~18 marks]\nQ1 TRUE/FALSE [4 marks]: [list each statement with TRUE or FALSE answer and brief justification]\nQ2 MCQ [1 mark]: [correct answer letter] — [brief explanation why correct and why distractors are wrong]\nQ3 CLOZE [7 marks]: [list all 7 correct answers in order, numbered 1–7]\nQ4 RECALL [1 mark]: [correct answer]\nQ5 RECALL [1 mark]: [correct answer]\nQ6 RECALL [2 marks]: [correct answer — 1m each point]\nQ7 RECALL [2 marks]: [correct answer — 1m each point]\nQ8 RECALL [1 mark]: [correct answer]\nQ9 RECALL [2 marks]: [correct answer — 1m each point]\nSECTION 2 — UNDERSTANDING [~17 marks]\nQ10 UNDERSTANDING [2 marks]: [model answer]\nQ11 UNDERSTANDING [3 marks]: [model answer — 1m per point]\nQ12 UNDERSTANDING [3 marks]: [model answer — 1m per point]\nQ13 UNDERSTANDING [4 marks]: [model answer — 2m each side]\nQ14 UNDERSTANDING [3 marks]: [model answer — 1m formula, 1m working, 1m answer OR 1m per point]\nQ15 UNDERSTANDING [2 marks]: [model answer]\nSECTION 3 — APPLICATION & ANALYSIS (EXAM STYLE) [~21 marks]\nQ16 EXAM STYLE [4 marks]: [4 mark-scheme points, 1m each]\nQ17 EXAM STYLE [4 marks]: [1m formula, 1m substitution, 1m calculation, 1m correct answer with unit]\nQ18 EXAM STYLE [6 marks]: [Level 3 (5–6m): detailed evaluation; Level 2 (3–4m): some evaluation; Level 1 (1–2m): basic points]\nQ19 EXAM STYLE [3 marks]: [1m identifying error, 2m correct scientific explanation]\nQ20 EXAM STYLE [4 marks]: (a) [1m]; (b) [2m]; (c) [1m]\nCHALLENGE [${isSTEM ? '8' : '12'} marks]: [full mark scheme with band descriptors]\nTOTAL MARKS: Section 1: ~18m | Section 2: ~17m | Section 3: ~21m | Challenge: ${isSTEM ? '8' : '12'}m | TOTAL: ~${isSTEM ? '64' : '68'}m"},
    {"title": "Teacher Notes", "type": "teacher-notes", "teacherOnly": true, "content": "[timings, misconceptions, interventions, next topic]"},
    {"title": "SEND Adaptations & Rationale", "type": "teacher-notes", "teacherOnly": true, "content": "${hasSend ? `ADAPTED FOR: ${params.sendNeed!.toUpperCase()}\nADAPTATIONS: [list every specific change made]\nRATIONALE: [3-4 sentences: how ${params.sendNeed} affects learning, SEND Code of Practice, how each adaptation removes a barrier]\nCLASSROOM TIPS: [3-4 practical tips for the teacher]\nIF STUDENT STRUGGLES: [next steps / further scaffolding]` : 'No SEND adaptations — standard worksheet.'}"}`}
  ],
  "metadata": {
    "subject": "${subjectDisplay}",
    "topic": "${params.topic}",
    "yearGroup": "${params.yearGroup}",
    "phase": "${phase}",
    "difficulty": "${params.difficulty || "mixed"}",
    "examBoard": "${params.examBoard || "General"}",
    "totalMarks": 0,
    "estimatedTime": "${timingGuide.replace("Estimated time: ", "")}",
    "sendNeed": "${hasSend ? params.sendNeed : ''}",
    "adaptations": ["Standard worksheet"]
  }
}`;

  // Token limits — set conservatively to prevent JSON truncation, which is the #1 cause of fallback.
  // Groq llama-3.3-70b handles 4000 tokens reliably without truncating the JSON closing braces.
  // Going higher risks truncation → parse failure → fallback generator.
  const maxTokensForLength = params.introOnly ? 1800 : (lengthMins >= 60 ? 4000 : lengthMins <= 10 ? 2200 : 3500);
  const { text, provider } = await callAI(system, user, maxTokensForLength, { responseFormat: "json_object" });
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let json: any;

  // Use module-level parseWithFixes (defined at top of file)
  try {
    json = parseWithFixes(cleaned);
  } catch (parseErr) {
    // Before giving up, try to repair truncated JSON by closing any open structures.
    // This recovers ~70% of truncation cases where the AI ran out of tokens mid-object.
    const repaired = repairTruncatedJson(cleaned);
    if (repaired) {
      try {
        json = parseWithFixes(repaired);
        console.info("[Adaptly AI] Recovered truncated JSON via repair");
      } catch {
        console.error("[Adaptly AI] JSON parse failed after repair. Raw:", text.slice(0, 300));
        throw new Error(`AI returned invalid JSON. Raw: ${text.slice(0, 100)}`);
      }
    } else {
      console.error("[Adaptly AI] JSON parse failed after all fixes. Raw response:", text.slice(0, 300));
      throw new Error(`AI returned invalid JSON. Raw: ${text.slice(0, 100)}`);
    }
  }
  const result: AIWorksheetResult = { ...json, isAI: true, provider };

  // ── Defensive metadata normalisation ─────────────────────────────────────────
  // Some provider responses legitimately contain title/subtitle/sections but omit
  // the metadata object. The worksheet page, renderer, validator, auto-save and
  // diagram selection all expect metadata.subject/topic/yearGroup to exist, so
  // create a canonical fallback from the trusted request parameters before any
  // downstream code touches result.metadata.*.
  const incomingMetadata = (result as any).metadata && typeof (result as any).metadata === 'object'
    ? (result as any).metadata
    : {};
  (result as any).metadata = {
    ...incomingMetadata,
    subject: subjectDisplay,
    topic: incomingMetadata.topic || params.topic,
    subtopic: incomingMetadata.subtopic || params.subtopic || undefined,
    yearGroup: incomingMetadata.yearGroup || params.yearGroup,
    difficulty: incomingMetadata.difficulty || params.difficulty || 'standard',
    examBoard: incomingMetadata.examBoard || params.examBoard || 'General',
    sendNeed: incomingMetadata.sendNeed ?? params.sendNeed ?? null,
    readingAge: incomingMetadata.readingAge ?? params.readingAge ?? undefined,
    adaptations: Array.isArray(incomingMetadata.adaptations) ? incomingMetadata.adaptations : [],
  };
  if (!Array.isArray((result as any).sections)) {
    (result as any).sections = [];
  }

  // ── Normalise all section content to strings ─────────────────────────────────
  // The AI sometimes returns content as an array of objects, plain objects, or
  // other non-string types. Convert everything to a readable plain-text string.
  const normaliseContent = (c: any): string => {
    if (c === null || c === undefined) return '';
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) {
      return c.map((item: any) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          const q = item.q || item.question || item.text || item.content || item.step || '';
          const a = item.a || item.answer || item.solution || '';
          const marks = item.marks ? ` [${item.marks} mark${item.marks > 1 ? 's' : ''}]` : '';
          const hint = item.hint || item.scaffold || '';
          if (item.term || item.word) {
            const term = item.term || item.word || '';
            const def = item.definition || item.meaning || '';
            return def ? `${term} | ${def}` : term;
          }
          if (item.objective) return item.objective;
          let out = q ? `${q}${marks}` : '';
          if (hint) out += `\n   Hint: ${hint}`;
          if (a) out += `\n   Answer: ${a}`;
          if (!out) {
            const vals = Object.values(item).filter(v => typeof v === 'string' && (v as string).length > 0);
            out = (vals as string[]).join(' | ');
          }
          return out || JSON.stringify(item);
        }
        return String(item);
      }).join('\n');
    }
    if (typeof c === 'object') {
      const q = c.q || c.question || c.text || c.content || c.objective || c.step || '';
      const a = c.a || c.answer || c.solution || '';
      if (q && a) return `${q}\n   Answer: ${a}`;
      if (q) return q;
      if (c.term || c.word) {
        const term = c.term || c.word || '';
        const def = c.definition || c.meaning || '';
        return def ? `${term} | ${def}` : term;
      }
      const vals = Object.values(c).filter(v => typeof v === 'string' && (v as string).length > 0);
      if (vals.length > 0) return (vals as string[]).join('\n');
      return '';
    }
    return String(c);
  };

  // ── Strip HTML from section content strings ─────────────────────────────────
  const stripHtmlFromContent = (s: string): string => {
    if (!s) return s;
    let out = s.replace(/["']?\s*\bstyle\s*=\s*["'][^"']*["']\s*>/g, '');
    out = out.replace(/\bclass\s*=\s*["'](?!katex["'])[^"']*["']\s*>/g, '');
    out = out.replace(/<\/?(?:span|div|p|a|font|section|article|header|footer|nav|ul|ol|li|table|tr|td|th|thead|tbody|tfoot|blockquote|pre|code|mark|small|del|ins|u|s|abbr|cite|dfn|kbd|samp|var|time|details|summary|form|input|select|textarea|button|label|fieldset|legend|canvas|script|style|link|meta)[^>]*>/gi, '');
    return out;
  };

  if (result.sections && Array.isArray(result.sections)) {
    result.sections = result.sections.map((section: any) => {
      const rawContent = normaliseContent(section.content);
      const cleanContent = stripHtmlFromContent(rawContent);
      return {
        ...section,
        title: typeof section.title === 'string' ? section.title.replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim() : section.title,
        content: cleanContent,
      };
    });
  }


  // ── Strip rogue markdown bold markers from title (** or __) ─────────────────
  // The AI sometimes wraps titles in **...** — strip these before any other processing
  if (result.title) {
    result.title = result.title.replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim();
  }

  // ── Topic enforcement post-processing ────────────────────────────────────────
  // If the AI generated the wrong topic title, override it with the correct one.
  const requestedTopic = params.topic.toLowerCase().trim();
  const generatedTitle = (result.title || '').toLowerCase().trim();
  if (!generatedTitle.includes(requestedTopic)) {
    result.title = `${params.topic} — ${params.yearGroup} ${subjectDisplay} Worksheet`;
    console.warn(`[Adaptly AI] Topic mismatch: requested "${params.topic}", got title "${result.title}". Title overridden.`);
  }

  // ── Subject capitalisation in metadata and subtitle ────────────────────────────
  // Ensure the metadata subject field uses the properly capitalised display name
  (result.metadata as any).subject = subjectDisplay;
  // Fix subtitle capitalisation — replace lowercase subject name with capitalised version
  if (result.subtitle && params.subject) {
    const lowerSubject = params.subject.toLowerCase();
    // Replace all occurrences of the lowercase subject in the subtitle with the capitalised version
    result.subtitle = result.subtitle.replace(new RegExp(lowerSubject, 'gi'), subjectDisplay);
  }
  // Fix SEND badge — if sendNeed is 'none' or 'none-selected', hide it
  const sn = (result.metadata as any).sendNeed;
  if (!sn || sn === 'none' || sn === 'none-selected' || sn === 'Standard') {
    (result.metadata as any).sendNeed = null;
  }

  // Normalise metadata.adaptations — AI sometimes returns a string instead of an array
  const raw = (result.metadata as any).adaptations;
  if (typeof raw === "string") {
    (result.metadata as any).adaptations = raw.length > 0 ? [raw] : [];
  } else if (!Array.isArray(raw)) {
    (result.metadata as any).adaptations = [];
  }

  // ── Section order — fixed per spec, NO shuffling ────────────────────────────────────
  // The spec requires a fixed section order:
  // LO → Retrieval → Key Vocab → Common Mistakes → Worked Example →
  // Section A (T/F, MCQ, Gap Fill, Match) → Diagram A → Section B →
  // Diagram B → Section C → Challenge → Self Reflection → Teacher Key
  // Shuffling within tiers is DISABLED — it conflicts with the fixed order
  // and causes confusion when diagrams are interleaved between sections.
  // The legacy path (non-structured) preserves the order returned by the AI.

  // ── Auto-fetch real diagrams for diagram sections (including Diagram A and Diagram B) ──
  // For any diagram section that lacks an imageUrl, try to fetch a real Wikimedia diagram.
  try {
    const diagramSectionTypes = new Set(['q-label-diagram', 'diagram']);
    const diagramLayoutPattern = /^LAYOUT:(label_diagram|diagram_subquestions)/;
    const sectionsNeedingDiagram = result.sections.filter(s =>
      (diagramSectionTypes.has(s.type) || diagramLayoutPattern.test(s.content || '')) &&
      !(s as any).imageUrl
    );
    if (sectionsNeedingDiagram.length > 0) {
      // Fetch one diagram result and apply to all diagram sections that need one
      const diagramResult = await Promise.race([
        aiGenerateDiagram({
          subject: params.subject,
          topic: params.topic,
          yearGroup: params.yearGroup || 'Year 9',
          sendNeed: params.sendNeed,
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
      ]);
      if (diagramResult?.imageUrl) {
        // Attach the real diagram image to ALL matching diagram sections
        for (const targetSection of sectionsNeedingDiagram) {
          (targetSection as any).imageUrl = diagramResult.imageUrl;
          (targetSection as any).caption = (targetSection as any).caption || diagramResult.caption || `${params.topic} diagram`;
          (targetSection as any).attribution = diagramResult.attribution || '';
        }
        console.info(`[Diagram] Auto-attached real diagram to ${sectionsNeedingDiagram.length} diagram section(s)`);
      }
    }
  } catch (autoErr) {
    console.warn('[Diagram] Auto-diagram fetch failed:', autoErr);
  }

  // Diagram injection is handled automatically for diagram subjects via the inline [[DIAGRAM:...]] syntax.
  // The generateDiagram toggle has been removed — diagrams are always included for relevant subjects.

  // ── Diagram A & Diagram B enforcement ───────────────────────────────────
  // Spec requirement: EVERY worksheet must include both a reference diagram
  // (Diagram A) between Section 1 and Section 2, and a task diagram
  // (Diagram B) between Section 2 and Section 3 (unless topic has no second visual).
  // If the AI failed to produce either, inject a minimal placeholder section.
  try {
    // First: honor an explicit "skipped" marker on a Diagram B section —
    // if the AI emitted a diagram-b section but flagged it as skipped for this
    // topic, remove it entirely so no empty full-page spread gets printed.
    result.sections = (result.sections || []).filter((s: any) => {
      const type = String(s.type || '').toLowerCase();
      if (type !== 'diagram-b') return true;
      const content = String(s.content || '').toLowerCase();
      const skipped = /\bskipped\b|\bno second visual\b|\bnot applicable\b/.test(content) &&
        !content.includes('[[diagram:'); // only skip if there's no actual diagram
      if (skipped) {
        console.info('[Diagrams] Dropped explicitly-skipped Diagram B section');
        return false;
      }
      return true;
    });

    const sections = result.sections;
    const hasDiagramA = sections.some((s: any) => {
      const type = String(s.type || '').toLowerCase();
      const title = String(s.title || '').toLowerCase();
      const content = String(s.content || '').toLowerCase();
      return type === 'diagram-a' ||
        title.includes('diagram a') ||
        content.includes('diagram a —') ||
        content.includes('diagram a -');
    });
    const hasDiagramB = sections.some((s: any) => {
      const type = String(s.type || '').toLowerCase();
      const title = String(s.title || '').toLowerCase();
      const content = String(s.content || '').toLowerCase();
      return type === 'diagram-b' ||
        title.includes('diagram b') ||
        content.includes('diagram b —') ||
        content.includes('diagram b -');
    });

    // Helpers to find the Q-number from a section title (e.g. "Q5. Calculate...")
    const getQNum = (s: any): number | null => {
      const t = String(s.title || s.content || '');
      const m = t.match(/Q\s*(\d+)/i);
      return m ? parseInt(m[1], 10) : null;
    };

    // If Diagram A is missing, inject it BETWEEN Q3 (end of Section 1) and Q4 (start of Section 2).
    if (!hasDiagramA) {
      // Try to find an existing diagram section first — re-label the first one as Diagram A.
      const firstDiagramSection = sections.find((s: any) => {
        const type = String(s.type || '').toLowerCase();
        return type === 'diagram' || type === 'q-label-diagram' || String(s.content || '').includes('[[DIAGRAM:');
      });
      if (firstDiagramSection) {
        (firstDiagramSection as any).type = 'diagram-a';
        (firstDiagramSection as any).title = `Diagram A — ${params.topic}`;
        if (!String(firstDiagramSection.content || '').toLowerCase().includes('diagram a')) {
          firstDiagramSection.content = `Diagram A — Reference. Refer back to this diagram as you work through Section 2 and Section 3.\n\n${firstDiagramSection.content || ''}`;
        }
        // Move it to the correct position (between Q3 and Q4) if not already there.
        const currentIdx = sections.indexOf(firstDiagramSection);
        let insertIdx = sections.findIndex((s: any) => {
          const qn = getQNum(s);
          return qn !== null && qn >= 4;
        });
        if (insertIdx < 0) {
          // Fallback: after last Section 1 question
          insertIdx = sections.length;
          for (let i = sections.length - 1; i >= 0; i--) {
            const qn = getQNum(sections[i]);
            if (qn !== null && qn <= 3) { insertIdx = i + 1; break; }
          }
        }
        if (currentIdx !== insertIdx && currentIdx >= 0) {
          sections.splice(currentIdx, 1);
          // Adjust insertIdx if it was after the removed item
          const adjustedIdx = currentIdx < insertIdx ? insertIdx - 1 : insertIdx;
          sections.splice(adjustedIdx, 0, firstDiagramSection);
        }
        console.info('[Diagrams] Re-labelled and repositioned existing diagram section as Diagram A');
      } else {
        // No diagram at all — insert a placeholder Diagram A between Q3 and Q4.
        const insertIdx = (() => {
          const firstQ4 = sections.findIndex((s: any) => {
            const qn = getQNum(s);
            return qn !== null && qn >= 4;
          });
          if (firstQ4 > 0) return firstQ4;
          // Fallback: after last Section-1 question (q-true-false, q-mcq, q-gap-fill)
          const section1Types = new Set(['q-true-false', 'q-mcq', 'q-gap-fill', 'q-matching', 'q-ordering']);
          for (let i = sections.length - 1; i >= 0; i--) {
            if (section1Types.has(String(sections[i].type || '').toLowerCase())) {
              return i + 1;
            }
          }
          return sections.length;
        })();
        const diagramAPlaceholder = {
          type: 'diagram-a',
          title: `Diagram A — ${params.topic}`,
          content: `Diagram A — Reference. Refer back to this diagram as you work through Section 2 and Section 3.\n\n[A labelled diagram for "${params.topic}" will be shown here. Teachers can replace this with their preferred reference image.]`,
          altText: `Reference diagram for ${params.topic}`,
        };
        sections.splice(insertIdx, 0, diagramAPlaceholder as any);
        console.info('[Diagrams] Inserted placeholder Diagram A between Section 1 and Section 2');
      }
    }

    // If Diagram B is missing, inject a task diagram BETWEEN Q6 and Q7.
    // Note: Diagram B is OPTIONAL — if the topic has no clear second visual,
    // we skip insertion rather than force a placeholder.
    const refreshedSections = result.sections || sections;
    const hasDiagramBNow = refreshedSections.some((s: any) => {
      const type = String(s.type || '').toLowerCase();
      const title = String(s.title || '').toLowerCase();
      return type === 'diagram-b' || title.includes('diagram b');
    });
    // Decide if this topic needs a Diagram B at all — rough heuristic: any
    // subject in the diagram-subjects allow-list gets one.
    const topicNeedsDiagramB = isDiagramSubject;
    if (!hasDiagramBNow && topicNeedsDiagramB) {
      // Find position between Q6 (last understanding Q) and Q7 (first application Q)
      const q7Idx = refreshedSections.findIndex((s: any) => {
        const qn = getQNum(s);
        return qn !== null && qn >= 7;
      });
      const diagramBPlaceholder = {
        type: 'diagram-b',
        title: `Diagram B — ${params.topic}`,
        content: `Diagram B — Visual Reference.\n\n[A diagram for "${params.topic}" will be shown here. This is a visual aid only — no questions are attached to this diagram.]`,
        marks: 0,
        altText: `Visual reference diagram for ${params.topic}`,
      };
      if (q7Idx > 0) {
        refreshedSections.splice(q7Idx, 0, diagramBPlaceholder as any);
      } else {
        // Fallback: append before teacher-key / self-reflection
        const insertBeforeIdx = refreshedSections.findIndex((s: any) => {
          const t = String(s.type || '').toLowerCase();
          return t === 'teacher-key' || t === 'mark-scheme' || t === 'answers' ||
                 t === 'self-reflection' || t === 'reflection' || (s as any).teacherOnly;
        });
        const insertAt = insertBeforeIdx > 0 ? insertBeforeIdx : refreshedSections.length;
        refreshedSections.splice(insertAt, 0, diagramBPlaceholder as any);
      }
      console.info('[Diagrams] Inserted placeholder Diagram B between Section 2 and Section 3');
    }

    // Set diagram IDs in metadata for traceability
    const diagramASection = (result.sections || []).find((s: any) =>
      String(s.type || '').toLowerCase() === 'diagram-a' ||
      String(s.title || '').toLowerCase().includes('diagram a')
    );
    const diagramBSection = (result.sections || []).find((s: any) =>
      String(s.type || '').toLowerCase() === 'diagram-b' ||
      String(s.title || '').toLowerCase().includes('diagram b')
    );
    if (diagramASection && !(result.metadata as any).diagramAId) {
      (result.metadata as any).diagramAId = (diagramASection as any).sectionId || `diagram-a-${Date.now()}`;
    }
    if (diagramBSection && !(result.metadata as any).diagramBId) {
      (result.metadata as any).diagramBId = (diagramBSection as any).sectionId || `diagram-b-${Date.now()}`;
    }
  } catch (diagramEnforceErr) {
    console.warn('[Diagrams] Enforcement check failed:', diagramEnforceErr);
  }

  // ── Post-generation quality gate ─────────────────────────────────────────
  // Run lightweight deterministic checks to catch obvious failures.
  // Does NOT make an extra AI call — pure string analysis.
  const qualityIssues: string[] = [];
  const studentSections = result.sections.filter(s => !s.teacherOnly);

  // ── PAGE 1 ORDER ENFORCEMENT ────────────────────────────────────────────
  // Spec: Page 1 must be
  //   1. Learning Objective
  //   2. Retrieval (only if user ticked it — otherwise skipped)
  //   3. Key Vocabulary
  //   4. Common Mistakes
  //   5. Worked Example
  // Diagram A comes AFTER these on Page 2, followed by Section 1 questions.
  try {
    const PAGE1_ORDER: Record<string, number> = {
      'header': 0,
      'objective': 1,
      'learning-objective': 1,
      'learning-objectives': 1,
      'prior-knowledge': 2,   // Retrieval = prior-knowledge in canonical types
      'retrieval': 2,
      'vocabulary': 3,
      'key-vocabulary': 3,
      'key-terms': 3,
      'common-mistakes': 4,
      'misconceptions': 4,
      'worked-example': 5,
      'example': 5,
    };

    const sections = result.sections || [];
    // Identify each section's page-1 slot (if any)
    const p1Sections: Array<{ idx: number; slot: number }> = [];
    const otherSections: Array<{ idx: number }> = [];
    sections.forEach((s: any, idx: number) => {
      const type = String(s.type || '').toLowerCase();
      const slot = PAGE1_ORDER[type];
      if (slot !== undefined) {
        p1Sections.push({ idx, slot });
      } else {
        otherSections.push({ idx });
      }
    });

    // If retrieval not explicitly requested (params.recallTopic is empty),
    // drop retrieval/prior-knowledge sections from Page 1.
    const retrievalRequested = !!(params.recallTopic && params.recallTopic.trim().length > 0);
    const p1Keep = retrievalRequested
      ? p1Sections
      : p1Sections.filter(p => p.slot !== 2);
    const p1Drop = retrievalRequested
      ? []
      : p1Sections.filter(p => p.slot === 2).map(p => p.idx);

    // Reorder: sort p1Keep by slot, then keep otherSections in original order.
    if (p1Keep.length > 0) {
      const sortedP1 = [...p1Keep].sort((a, b) => a.slot - b.slot);
      const p1Set = new Set(sortedP1.map(p => p.idx));
      const newSections: any[] = [];
      for (const p of sortedP1) newSections.push(sections[p.idx]);
      for (let idx = 0; idx < sections.length; idx++) {
        if (p1Set.has(idx) || p1Drop.includes(idx)) continue;
        newSections.push(sections[idx]);
      }
      // Only update if the order actually changed
      const changed = newSections.some((s: any, i: number) => s !== sections[i]) ||
        newSections.length !== sections.length;
      if (changed) {
        result.sections = newSections;
        console.info(`[Page 1] Reordered Page 1 sections: LO → ${retrievalRequested ? 'Retrieval → ' : ''}Vocab → Common Mistakes → Worked Example`);
      }
    }
  } catch (page1Err) {
    console.warn('[Page 1] Reorder failed:', page1Err);
  }

  // 1. Check minimum section count
  if (studentSections.length < 3) {
    qualityIssues.push(`Only ${studentSections.length} student sections generated`);
  }

  // 2. Check title makes sense for topic
  if (result.title && params.topic) {
    const titleLower = result.title.toLowerCase();
    const topicWords = params.topic.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const topicPresent = topicWords.some(w => titleLower.includes(w));
    if (!topicPresent && topicWords.length > 0) {
      qualityIssues.push(`Title "${result.title}" may not match topic "${params.topic}"`);
    }
  }

  // 3. Check sections have real content (not placeholders)
  const placeholderPattern = /\[.*?\]|\.\.\.|placeholder|lorem ipsum|to be (written|completed|added)/i;
  studentSections.forEach((s, i) => {
    const content = typeof s.content === 'string' ? s.content : JSON.stringify(s.content);
    if (content.length < 20) {
      qualityIssues.push(`Section ${i+1} ("${s.title}") has very short content`);
    }
    if (placeholderPattern.test(content)) {
      qualityIssues.push(`Section ${i+1} ("${s.title}") appears to contain placeholder text`);
    }
  });

  // 4. Maths check — verify LaTeX is present if maths subject
  if (isMaths) {
    const allContent = studentSections.map(s => String(s.content || "")).join(" ");
    const hasLatex = allContent.includes("\\(") || allContent.includes("\\[");
    if (!hasLatex && allContent.length > 200) {
      qualityIssues.push("Maths worksheet appears to have no LaTeX notation");
      // Auto-fix: add metadata flag so UI can warn teacher
      (result.metadata as any).qualityWarning = "Math expressions may not be properly formatted";
    }

    // 4b. Check for forbidden writing verbs in maths questions.
    // Only scan numbered questions (q-* sections) — skip worked examples / vocabulary / explanations.
    const forbiddenVerbs = [
      /\bexplain\s+(why|how|the)/i,
      /\bdescribe\s+(in|how|why|the)/i,
      /\bdiscuss\s+the/i,
      /\bin your own words/i,
      /\bgive reasons/i,
      /\bwhat is the meaning of/i,
      /\bwhy is .* important/i,
    ];
    const questionSections = studentSections.filter(s => {
      const t = String(s.type || '').toLowerCase();
      return t.startsWith('q-') || t === 'independent' || t === 'guided';
    });
    const violatingQuestions: string[] = [];
    questionSections.forEach((s: any) => {
      const content = String(s.content || "");
      // Check each numbered sub-question within the content
      const lines = content.split(/\n+/);
      for (const line of lines) {
        // Skip short lines and headers
        if (line.length < 15) continue;
        if (forbiddenVerbs.some(rx => rx.test(line))) {
          violatingQuestions.push((s.title || s.type || 'question') + ': "' + line.substring(0, 60) + '..."');
          break;
        }
      }
    });
    if (violatingQuestions.length > 0) {
      qualityIssues.push(`Maths worksheet contains ${violatingQuestions.length} writing-style question(s) — should be calculation-based: ${violatingQuestions.slice(0, 3).join('; ')}`);
      (result.metadata as any).mathsWritingVerbWarning = violatingQuestions;
    }
  }

  // 5. Diagram A + Diagram B presence check (separate from earlier enforcement)
  const hasDiagramATag = studentSections.some((s: any) =>
    String(s.type || '').toLowerCase() === 'diagram-a' ||
    String(s.title || '').toLowerCase().includes('diagram a')
  );
  const hasDiagramBTag = studentSections.some((s: any) =>
    String(s.type || '').toLowerCase() === 'diagram-b' ||
    String(s.title || '').toLowerCase().includes('diagram b')
  );
  if (!hasDiagramATag) qualityIssues.push('Worksheet missing Diagram A (reference diagram)');
  if (!hasDiagramBTag) qualityIssues.push('Worksheet missing Diagram B (visual reference diagram)');

  // Log quality issues (visible in dev console, doesn't block rendering)
  if (qualityIssues.length > 0) {
    console.warn('[Quality Gate] Issues detected:', qualityIssues);
    (result.metadata as any).qualityIssues = qualityIssues;
  }

  // ── SEND enforcer: final defensive pass before we hand the worksheet to
  //    the overlay engine. Guarantees ADHD inline checkboxes, 3-Q / 5-Q caps,
  //    bolded action verbs and a BRAIN BREAK mid-Section-B; strips dyslexia
  //    italics from question text. No-op for other SEND needs (their rules
  //    are fully delegated to the prompt + server overlay).
  const legacyPostValidated = runWorksheetPostValidators(
    result as unknown as import("./worksheetPostValidator").PostValidatorWorksheet,
    {
      subject: params.subject,
      yearGroup: params.yearGroup,
      sendNeed: params.sendNeed,
      // Phase 1 — needed by enforceSpecAnchorPresence on the legacy path.
      examBoard: params.examBoard,
      // Phase 2 — needed by enforceSelfReflectionTopicAnchor on the
      // legacy path. Same rationale as the structured-path callsite.
      topic: params.topic,
    },
  );
  const legacyEnforced = enforceSendAdaptations(legacyPostValidated.worksheet, params.sendNeed, { preserveStems: preserveStemsForSend });
  // FEAT-PB6 — non-blocking SEND fidelity audit (legacy path).
  const auditedLegacy = applySendFidelityAudit(legacyEnforced.worksheet, params.sendNeed);
  // FEAT-PC8 — non-blocking maths FRP strand audit (no-op for non-maths).
  const strandTaggedLegacy = applyMathsStrandTagging(auditedLegacy, {
    subject: params.subject,
    yearGroup: params.yearGroup,
  });
  // PR-M2 — non-blocking maths progression audit (legacy path mirror).
  const progressionTaggedLegacy = applyMathsProgressionAudit(strandTaggedLegacy, {
    subject: params.subject,
    yearGroup: params.yearGroup,
  });
  // PR-M3 — non-blocking Common Mistakes audit (legacy path mirror).
  const commonMistakesTaggedLegacy = applyCommonMistakesAudit(progressionTaggedLegacy, {
    subject: params.subject,
  });
  // PR-M3-followup — active regenerate (legacy path mirror).
  const commonMistakesRegeneratorLegacy: CommonMistakesRegenerator = async ({
    originalBlock,
    diagnostic,
    subject: blockSubject,
    yearGroup: blockYearGroup,
  }) => {
    const result = await aiEditSection({
      sectionTitle: 'Common Mistakes to Avoid',
      currentContent: originalBlock,
      instruction: diagnostic,
      subject: blockSubject,
      yearGroup: blockYearGroup,
    });
    return result.newContent;
  };
  const commonMistakesRegeneratedLegacy = await applyCommonMistakesActiveRegenerate(
    commonMistakesTaggedLegacy,
    commonMistakesRegeneratorLegacy,
    { subject: params.subject, yearGroup: params.yearGroup },
  );
  // FEAT-PC9 — non-blocking Required-Practical tagging (KS4 science only).
  const practicalTaggedLegacy = applyRequiredPracticalTagging(commonMistakesRegeneratedLegacy, {
    subject: params.subject,
    topic: params.topic,
    yearGroup: params.yearGroup,
    examBoard: params.examBoard,
  });
  // FEAT-PC10 — coverage map (Y9+ only).
  const coverageTaggedLegacy = applyCoverageMap(practicalTaggedLegacy, {
    subject: params.subject,
    topic: params.topic,
    yearGroup: params.yearGroup,
  });
  // FEAT-PA — Pillar A audits (legacy path mirror).
  const pillarATaggedLegacy = applyPillarAAudits(coverageTaggedLegacy as any, {
    subject: params.subject,
    topic: params.topic,
    yearGroup: params.yearGroup,
    examBoard: params.examBoard,
    examStyle: params.examStyle,
    priorTopics: effectivePriorTopics,
  }) as typeof coverageTaggedLegacy;
  pillarATaggedLegacy.metadata = {
    ...(pillarATaggedLegacy.metadata ?? {}),
    ...(params.paper ? { paper: params.paper } : {}),
    ...(typeof params.calculator === "boolean" ? { calculator: params.calculator } : {}),
    ...(effectivePriorTopics.length > 0 ? { priorTopics: effectivePriorTopics } : {}),
  };
  // FEAT-PB1 — Per-question provenance (legacy path mirror).
  const provenanceTaggedLegacy = applyQuestionProvenance(pillarATaggedLegacy, {
    subject: params.subject,
    topic: params.topic,
    yearGroup: params.yearGroup,
  });
  // FEAT-PB2 — Symbolic maths verification (legacy path mirror).
  const casTaggedLegacy = applyMathsVerification(provenanceTaggedLegacy, {
    subject: params.subject,
  });
  return casTaggedLegacy as unknown as AIWorksheetResult;
}

// ═══ §CLASS-BRIEF · aiGenerateWorksheetFromClassBrief (Phase A · PR-1) ═════
/**
 * Thin wrapper around `aiGenerateWorksheet` that takes a `ClassAutoBrief`
 * (built synchronously in `lib/class-auto-brief.ts`) and turns it into the
 * arguments the underlying generator already understands.
 *
 * Key design choices, kept deliberately conservative:
 *
 * 1. We do NOT introduce a new prompt path. The brief is rendered into a
 *    short instruction block via `renderClassBriefForPrompt` and prepended
 *    to whatever `additionalInstructions` the caller passes. The model
 *    treats it the same way it already treats teacher-typed instructions,
 *    so no new prompt engineering is needed.
 *
 * 2. Override precedence is "explicit caller wins": brief-derived defaults
 *    are applied first, then `overrides` is spread on top. This lets PR-2's
 *    "Edit in form" flow override topic/yearGroup/sendNeed while still
 *    benefiting from the brief's class-context block.
 *
 * 3. The function delegates to `aiGenerateWorksheet` exactly once. No
 *    retry, no fallback. The Worksheets page already wraps it in its own
 *    multi-provider retry; we don't want to duplicate that here.
 */
export async function aiGenerateWorksheetFromClassBrief(
  brief: import("./class-auto-brief").ClassAutoBrief,
  overrides: Partial<Parameters<typeof aiGenerateWorksheet>[0]> = {},
): Promise<AIWorksheetResult> {
  // Lazy-import to avoid a static dependency cycle (class-auto-brief is
  // pure data and shouldn't pull ai.ts on import).
  const { renderClassBriefForPrompt } = await import("./class-auto-brief");

  const briefBlock = renderClassBriefForPrompt(brief);
  const callerInstructions = (overrides.additionalInstructions || "").trim();
  const additionalInstructions = callerInstructions
    ? `${briefBlock}\n\n${callerInstructions}`
    : briefBlock;

  // Derive sensible defaults from the brief, then let overrides win.
  const briefDerived: Parameters<typeof aiGenerateWorksheet>[0] = {
    subject: overrides.subject || brief.suggestedSubject || "",
    topic: overrides.topic || brief.suggestedTopic || "",
    yearGroup: overrides.yearGroup || brief.classLabel || "",
    // Only auto-pick a sendNeed when the entire class shares the same one;
    // otherwise the per-pupil differentiation belongs to PR-3 (Class Pack).
    sendNeed: brief.sendNeeds.length === 1 ? brief.sendNeeds[0] : undefined,
    // Reading age — use the upper end of the range as the target so the
    // worksheet doesn't underchallenge the strongest readers; SEND
    // adaptations are layered on top per-pupil by Class Pack later.
    readingAge: brief.readingAgeRange.max > 0 ? brief.readingAgeRange.max : undefined,
  };

  const merged: Parameters<typeof aiGenerateWorksheet>[0] = {
    ...briefDerived,
    ...overrides,
    additionalInstructions,
  };

  return aiGenerateWorksheet(merged);
}

// ═══ §STORY · aiGenerateStory ═════════════════════════════════════════════
export async function aiGenerateStory(params: {
  genre: string;
  yearGroup: string;
  sendNeed?: string;
  characters?: string[];
  setting?: string;
  theme?: string;
  readingLevel?: string;
  length?: string;
}): Promise<{ title: string; content: string; provider?: string }> {
  // Map length to word count targets
  const wordTargets: Record<string, string> = {
    "short": "approximately 500 words (4-5 paragraphs)",
    "medium": "approximately 1000 words (8-10 paragraphs)",
    "long": "approximately 1800 words (14-16 paragraphs)",
    "extra-long": "approximately 3000 words (22-26 paragraphs)",
  };
  const wordTarget = wordTargets[params.length || "medium"] || wordTargets["medium"];

  // Map reading level to specific instructions
  const readingLevelMap: Record<string, string> = {
    "age-appropriate": `matched to Year ${params.yearGroup} reading age`,
    "reading-age-6-7": "reading age 6-7 years: very simple sentences (max 8 words), basic vocabulary, phonics-friendly words, no complex clauses",
    "reading-age-7-8": "reading age 7-8 years: simple sentences (max 10 words), common vocabulary, some compound sentences",
    "reading-age-8-9": "reading age 8-9 years: mostly simple sentences, familiar vocabulary, occasional compound sentences",
    "reading-age-9-10": "reading age 9-10 years: mix of simple and compound sentences, accessible vocabulary with some challenging words",
    "reading-age-10-11": "reading age 10-11 years: varied sentence structure, wider vocabulary, some complex sentences",
    "reading-age-11-12": "reading age 11-12 years: varied and engaging sentences, good vocabulary range, descriptive language",
    "reading-age-12-13": "reading age 12-13 years: sophisticated sentences, rich vocabulary, literary techniques",
    "reading-age-13-14": "reading age 13-14 years: complex sentence structures, advanced vocabulary, mature themes handled appropriately",
    "reading-age-14-plus": "reading age 14+ years: mature, sophisticated writing with complex vocabulary and themes",
    "reading-age-15-16": "reading age 15-16 years: advanced secondary level writing, complex vocabulary, nuanced themes, literary techniques expected at GCSE level",
    "reading-age-16-17": "reading age 16-17 years: A-Level standard writing, sophisticated vocabulary, complex themes, analytical and literary depth",
    "reading-age-17-plus": "reading age 17+ years: university-entrance standard writing, highly sophisticated vocabulary, mature complex themes, literary and analytical depth equivalent to A-Level or beyond",
  };
  const readingInstruction = readingLevelMap[params.readingLevel || "age-appropriate"] || readingLevelMap["age-appropriate"];

  const system = `You are a professional creative writing teacher specialising in SEND-friendly, engaging stories for UK primary and secondary schools. You write stories that are:
- Structured in clear, well-developed paragraphs (each paragraph 3-5 sentences)
- Engaging, immersive and age-appropriate
- Rich in descriptive language and dialogue
- Following a clear narrative arc: introduction, rising action, climax, resolution
- Formatted with paragraph breaks (double newline between paragraphs)
Always respond with valid JSON only, no markdown code blocks.`;

  const user = `Write a ${params.genre} story for Year ${params.yearGroup} students.

STORY REQUIREMENTS:
- Length: ${wordTarget}
- Reading level: ${readingInstruction}
- Format: Proper paragraphs separated by blank lines. Each paragraph should be 3-5 sentences. Include dialogue where appropriate.
- Structure: Clear beginning (introduce characters/setting), middle (build tension/conflict), end (satisfying resolution)
${params.sendNeed ? `- SEND adaptation: ${params.sendNeed} — use appropriate scaffolding, clear language, and accessible structure` : ""}
${params.characters?.length ? `- Characters: ${params.characters.join(", ")}` : ""}
${params.setting ? `- Setting: ${params.setting}` : ""}
${params.theme ? `- Theme/moral: ${params.theme}` : ""}

IMPORTANT: Write the FULL story to the target length. Do not truncate. Use paragraph breaks (\n\n) between paragraphs.

Return JSON only (no markdown): {"title": "Story Title", "content": "Full story with paragraph breaks here..."}`;

  const { text, provider } = await callAI(system, user, params.length === "extra-long" ? 5000 : params.length === "long" ? 3500 : 2500);
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const result = parseWithFixes(cleaned);
  return { ...result, provider };
}
// ─── Task differentiationn ────────────────────────────────────────────────────

// Per-SEND-need differentiation rules derived from COBS Handbook and worksheetChanges data
const SEND_DIFF_RULES: Record<string, string> = {
  asc: "Use literal, unambiguous language only. Add a 'What you need to do' box before each section. Use consistent terminology — one word per concept, no synonyms. Avoid social or emotional scenarios. Replace open reflection with tick-box checklists.",
  asperger: "Use direct, literal language — no figurative language or idioms. Create a predictable, identical layout structure across every section. Add step-by-step numbered instructions for every task. Include visual diagrams alongside text.",
  "pda-odd": "Reframe demands as choices and invitations. Rename sections as 'Explore', 'Investigate', 'Secret Mission'. Replace 'You must' with 'You might like to...'. Add natural break points and 'Take a break here if you need to' prompts.",
  slcn: "Add a Word Bank with plain-English definitions at the start of each section. Provide sentence frames for every answer (e.g. 'The answer is ___ because ___'). Limit sentences to 12 words maximum. Use matching, labelling, and multiple-choice formats. Add visual cues alongside every text question.",
  dyslexia: "Limit every question to one sentence (max 12 words). Bold every key term at first use. Add sentence starters and answer frames. Include a step-by-step method box before practice. Use 1.5 line spacing and generous white space.",
  dyscalculia: "Break every question into numbered sub-steps with blanks (Step 1: ___ Step 2: ___). Include a number line or key facts box. Show every arithmetic step in the worked example with 'why' annotations. Use real-world contexts for all word problems.",
  dyspraxia: "Use multiple-choice, matching, and circle-the-answer formats. Provide large answer boxes. Use structured answer frames (tables, fill-in-the-blank) rather than open writing. Avoid extended writing tasks — use tick, circle, or diagram formats for challenge questions.",
  mld: "Provide a fully completed model answer for Question 1. Add a hint, sentence starter, or partial answer to every question. Include a 'Help Box' with key facts and vocabulary. Use KS2 reading level language. Apply concrete-pictorial-abstract progression.",
  adhd: "Add a [ ] checkbox next to every question. Limit to maximum 3 questions per section. Add a 'BRAIN BREAK — stand up and stretch!' prompt midway. Vary question types: calculation, fill-in, matching, true/false. Bold the action word in every instruction.",
  anxiety: "Rename Section A 'Warm-Up — no pressure!'. Label challenge as 'OPTIONAL BONUS — only if you want to!'. Add a positive statement at the start of each section. Replace 'must', 'should', 'need to' with 'try to', 'have a go at'. Add a text-based check-in (e.g. 'Calm / OK / Anxious') at start and end.",
  vi: "Use minimum 18pt equivalent font size. Apply high-contrast formatting. Describe all diagram content in text as well. Avoid questions that rely solely on visual interpretation. Add generous spacing between questions and sections.",
  hi: "Write all instructions in full — no reliance on verbal explanation. Add a Word Bank with definitions for all key terms. Make every question fully self-contained with all necessary information. Include visual diagrams alongside every text question. Remove any audio-dependent content.",
  tourettes: "Use multiple response formats: tick, circle, fill-in, short answer. Add natural break points into every section. Reduce writing demands — avoid long written responses. Use a calm, supportive, non-judgmental tone. Remove all timed pressure language ('quickly', 'in 5 minutes').",
  "older-learners": "Provide a graphic organiser or table for extended responses. Add a Cornell-style note section at the end of each section. Use age-appropriate academic language and contexts. Include a study tip box at the start of each section. Add clear section breaks with estimated time for each section.",
  "working-memory": "Add a 'Memory Aid' box before every question listing the key facts, formulas, or vocabulary needed. Break every multi-step question into numbered sub-steps with blanks. Include a visible word bank or key facts box at the top of every section. Place a fully worked example immediately before every practice section. One instruction per line only.",
  "semh": "Open with an emotional check-in: '[ ] Calm   [ ] OK   [ ] Need a break'. Rename Section A 'Warm-Up — no pressure!'. Add a positive statement at the start of each section. Replace 'must'/'should'/'need to' with 'try to'/'have a go at'. Insert a natural break point after every 3 questions.",
};

// ═══ §DIFF-TASK · aiDifferentiateTask ═════════════════════════════════════
export async function aiDifferentiateTask(params: {
  taskContent: string;
  sendNeed?: string;
  yearGroup?: string;
  subject?: string;
}): Promise<{ differentiatedContent: string; provider?: string }> {
  const sendRules = params.sendNeed ? SEND_DIFF_RULES[params.sendNeed] : null;
  const system = `You are a SEND specialist teacher who differentiates tasks to make them accessible for all learners. You follow UK SEND Code of Practice and COBS Handbook guidelines precisely.`;
  const user = `Differentiate this task for a ${params.yearGroup || "secondary"} ${params.subject || ""} student${params.sendNeed ? ` with ${params.sendNeed}` : ""}.

${sendRules ? `MANDATORY ADAPTATIONS FOR THIS SEND NEED — apply ALL of these:
${sendRules}

` : ""}TASK TO DIFFERENTIATE:
${params.taskContent}

Provide a clearly differentiated version applying all the mandatory adaptations above. Return as plain text only.`;

  const { text, provider } = await callAI(system, user, 1500);
  return { differentiatedContent: text, provider };
}

// ─── Edit section with AI ────────────────────────────────────────────────────

// ═══ §EDIT · aiEditSection ════════════════════════════════════════════════
export async function aiEditSection(params: {
  sectionTitle: string;
  currentContent: string;
  instruction: string;
  subject?: string;
  yearGroup?: string;
  sendNeed?: string;
}): Promise<{ newContent: string; provider?: string }> {
  const system = `You are an expert SEND teacher editing a worksheet section. Return ONLY the updated section content as plain text — no titles, no JSON, no markdown headers. Keep the same general structure but apply the requested changes.`;
  const user = `Section: "${params.sectionTitle}"
Subject: ${params.subject || "general"}
Year Group: ${params.yearGroup || "secondary"}
SEND Need: ${params.sendNeed || "general"}

Current content:
${params.currentContent}

Instruction: ${params.instruction}

Return only the updated content text:`;

  const { text, provider } = await callAI(system, user, 1500);
  return { newContent: text.trim(), provider };
}

// ─── Parent report generation ────────────────────────────────────────────────

// ═══ §REPORT · aiGenerateParentReport ═════════════════════════════════════
export async function aiGenerateParentReport(params: {
  childName: string;
  subject?: string;
  achievements: string;
  areasForImprovement: string;
  tone?: string;
}): Promise<{ report: string; provider?: string }> {
  const system = `You are a UK SEND teacher writing professional, empathetic parent reports. Write in clear, jargon-free language.`;
  const user = `Write a parent report for ${params.childName}${params.subject ? ` in ${params.subject}` : ""}.
Achievements: ${params.achievements}
Areas for improvement: ${params.areasForImprovement}
Tone: ${params.tone || "warm and professional"}
Write 2-3 paragraphs. Return plain text only.`;

  const { text, provider } = await callAI(system, user, 800);
  return { report: text.trim(), provider };
}

// ─── Diagram generation ──────────────────────────────────────────────────────
/**
 * Generates an inline SVG diagram relevant to the worksheet topic.
 * The AI produces clean SVG markup that renders directly in the browser —
 * no external image API required.
 */
// ─── Topic-aware diagram type hints ─────────────────────────────────────────
function getDiagramHint(subject: string, topic: string): string {
  const s = subject.toLowerCase();
  const t = topic.toLowerCase();
  if (s === "mathematics" || s === "maths") {
    if (t.includes("fraction") || t.includes("ratio")) return "Draw a clearly labelled fraction bar or pie chart divided into equal parts. Show numerator and denominator labels. Include a number line below.";
    if (t.includes("pythagoras") || t.includes("triangle")) return "Draw a right-angled triangle with sides labelled a, b, c (hypotenuse). Include the formula a²+b²=c² in a box. Mark the right-angle symbol.";
    if (t.includes("circle") || t.includes("circumference") || t.includes("area")) return "Draw a large circle with clearly labelled radius, diameter, circumference. Include formulae boxes for area (πr²) and circumference (2πr).";
    if (t.includes("graph") || t.includes("linear") || t.includes("quadratic") || t.includes("axes")) return "Draw x and y axes with arrows, origin labelled O. Include gridlines. Plot a sample curve or line with at least 3 labelled points.";
    if (t.includes("angle") || t.includes("polygon") || t.includes("shape")) return "Draw the relevant polygon with all angles labelled. Include angle sum in a callout box.";
    if (t.includes("vector") || t.includes("transformation")) return "Draw a coordinate grid with vectors or transformation arrows clearly labelled with direction and magnitude.";
    return "Draw a relevant mathematical diagram with clearly labelled axes, shapes, or number lines appropriate for this topic.";
  }
  if (s === "science" || s === "biology") {
    if (t.includes("cell")) return "Draw an animal cell and a plant cell side by side. Label: nucleus, cell membrane, cytoplasm, mitochondria. For plant cell also: cell wall, chloroplast, vacuole.";
    if (t.includes("circuit") || t.includes("electric")) return "Draw a simple series circuit with a battery, bulb, switch, and ammeter. Use standard circuit symbols. Label current direction with arrows.";
    if (t.includes("atom") || t.includes("electron")) return "Draw a Bohr model atom with nucleus (protons/neutrons) and electron shells. Label each shell with electron count.";
    if (t.includes("photosynthesis")) return "Draw a leaf cross-section showing chloroplasts, stomata, sunlight arrows, CO₂ in, O₂ out, and water uptake from roots.";
    if (t.includes("skeleton") || t.includes("bone") || t.includes("muscle")) return "Draw a simplified human skeleton outline with at least 8 major bones labelled (skull, spine, ribs, femur, tibia, humerus, radius, pelvis).";
    if (t.includes("digestive") || t.includes("digestion")) return "Draw the human digestive system from mouth to anus. Label: mouth, oesophagus, stomach, small intestine, large intestine, liver, pancreas.";
    if (t.includes("heart") || t.includes("blood")) return "Draw the human heart with four chambers labelled. Show blood flow direction with arrows. Label aorta, pulmonary artery, vena cava.";
    if (t.includes("wave") || t.includes("sound") || t.includes("light")) return "Draw a transverse wave with amplitude, wavelength, crest and trough clearly labelled. Include the wave equation v=fλ in a box.";
    return "Draw an accurate, labelled scientific diagram relevant to this biology/science topic.";
  }
  if (s === "geography") {
    if (t.includes("river") || t.includes("erosion")) return "Draw a river cross-section showing erosion, transportation, and deposition zones. Label: source, meander, oxbow lake, mouth, floodplain.";
    if (t.includes("volcano") || t.includes("tectonic")) return "Draw a cross-section of a volcano with magma chamber, vent, crater, lava flow. Label tectonic plates below.";
    if (t.includes("weather") || t.includes("climate")) return "Draw a weather front diagram showing warm front, cold front, precipitation zones, and wind direction arrows.";
    return "Draw a clear geographical diagram, map, or cross-section relevant to this topic with all features labelled.";
  }
  if (s === "history") {
    return "Draw a horizontal timeline with at least 5 key events labelled with dates. Use arrows and callout boxes for important turning points.";
  }
  return "Draw a clear, well-labelled educational diagram most relevant to this topic for UK school students.";
}

// ═══ §DIAGRAM · aiGenerateDiagram ═════════════════════════════════════════
export async function aiGenerateDiagram(params: {
  subject: string;
  topic: string;
  yearGroup: string;
  diagramType?: string;
  sendNeed?: string;
}): Promise<{ svg: string; caption: string; imageUrl?: string; attribution?: string; provider?: string } | null> {
  // ── Primary: dedicated server endpoint with Wikimedia bank + live search ──
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const res = await fetch('/api/ai/diagram', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        subject: params.subject,
        topic: params.topic,
        yearGroup: params.yearGroup,
        sendNeed: params.sendNeed,
        diagramType: params.diagramType,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      // If server explicitly says no diagram is available, return null (do NOT fall back to AI SVG)
      if (data.type === 'none' || (!data.imageUrl && !data.svg)) {
        console.info(`[Diagram] No verified diagram available for "${params.topic}" — falling back to AI SVG`);
        // We continue to the AI SVG fallback below
      } else {
        // Route any external imageUrl through the server proxy to avoid CORS/rate-limiting
        let imageUrl = data.imageUrl;
        if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
          imageUrl = `/api/diagram-proxy?url=${encodeURIComponent(imageUrl)}`;
        }
        return {
          svg: data.svg || '',
          caption: data.caption || `${params.topic} diagram`,
          imageUrl,
          attribution: data.attribution,
          provider: data.provider,
        };
      }
    }
  } catch (e) {
    console.warn('[Diagram] Server /api/ai/diagram failed:', e);
  }
  // AI SVG fallback — if server has no verified image, we generate a clean inline SVG
  // using the dedicated AI SVG generator.
  console.info(`[Diagram] Falling back to AI SVG for "${params.topic}" (${params.subject})`);
  const aiDiagram = await aiGenerateWorksheetDiagram({
    subject: params.subject,
    topic: params.topic,
    yearGroup: params.yearGroup,
    sendNeed: params.sendNeed,
  });
  return aiDiagram;
}

/**
 * Generates a diagram section to be inserted into a worksheet.
 * Returns an AIWorksheetSection with type "diagram" and SVG content.
 */
// ═══ §DIAG-WS · aiGenerateWorksheetDiagram ════════════════════════════════
export async function aiGenerateWorksheetDiagram(params: {
  subject: string;
  topic: string;
  yearGroup: string;
  sendNeed?: string;
  diagramType?: string;
}): Promise<{ title: string; content: string; type: "diagram"; svg: string; caption: string; imageUrl?: string; attribution?: string; provider?: string } | null> {
  const result = await aiGenerateDiagram(params);
  if (!result) return null; // No verified diagram available for this topic
  const { svg, caption, imageUrl, attribution, provider } = result;
  return {
    title: `Diagram: ${params.topic}`,
    content: caption,
    type: "diagram",
    svg: svg || '',
    caption,
    imageUrl,
    attribution,
    provider,
  };
}

// ─── Story Comprehension MCQ Generator ──────────────────────────────────────
// ═══ §MCQ · aiGenerateComprehensionMCQ ════════════════════════════════════
export interface ComprehensionMCQ {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export async function aiGenerateComprehensionMCQ(params: {
  storyTitle: string;
  storyContent: string;
  genre: string;
  yearGroup: string;
  count?: number;
}): Promise<ComprehensionMCQ[]> {
  const count = params.count || 6;
  const system = `You are a professional English teacher creating comprehension multiple-choice questions for UK school students. Always respond with valid JSON only, no markdown code blocks.`;
  const user = `Read this story and create ${count} multiple-choice comprehension questions.

STORY TITLE: ${params.storyTitle}
STORY:
${params.storyContent.substring(0, 3000)}

Create ${count} questions testing: literal comprehension, inference, vocabulary in context, character/setting analysis, and author's intent.
Each question must have exactly 4 options (A, B, C, D) with ONE correct answer. Wrong options should be plausible but clearly wrong to a careful reader.

Return JSON array only:
[{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "The text states..."}]`;
  const { text } = await callAI(system, user, 1500);
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = parseWithFixes(cleaned);
  return Array.isArray(parsed) ? parsed : parsed.questions || [];
}

// ─── SEND Scaffold Existing Worksheet ────────────────────────────────────────
/**
 * Takes the sections of an existing worksheet and transforms them with real
 * SEND scaffolding (gap fills, sentence starters, word banks, hint boxes)
 * while preserving all original content verbatim.
 *
 * Uses the dedicated /api/ai/scaffold-worksheet server endpoint.
 */
// ═══ §SCAFFOLD · aiScaffoldExistingWorksheet ══════════════════════════════
export async function aiScaffoldExistingWorksheet(params: {
  sections: Array<{ title: string; content: string; type?: string; teacherOnly?: boolean }>;
  sendNeed: string;
  subject?: string;
  topic?: string;
  yearGroup?: string;
  title?: string;
}): Promise<{
  sections: Array<{ title: string; content: string; type?: string; teacherOnly?: boolean }>;
  wordBank?: string;
  scaffoldingApplied?: string[];
  provider?: string;
}> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const res = await fetch('/api/ai/scaffold-worksheet', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({
      sections: params.sections,
      sendNeed: params.sendNeed,
      subject: params.subject,
      topic: params.topic,
      yearGroup: params.yearGroup,
      title: params.title,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Scaffold request failed: ${res.status}`);
  }

  const data = await res.json();
  const scaffolded = data.scaffolded;

  return {
    sections: scaffolded.sections || params.sections,
    wordBank: scaffolded.wordBank,
    scaffoldingApplied: scaffolded.scaffoldingApplied,
    provider: data.provider,
  };
}

// ─── Differentiate Existing Worksheet (Foundation / Higher) ─────────────────
// Uses the dedicated /api/ai/differentiate-worksheet endpoint which transforms
// the existing worksheet to a different difficulty tier — much faster than
// regenerating from scratch.
// ═══ §DIFF-WS · aiDifferentiateExistingWorksheet ══════════════════════════
export async function aiDifferentiateExistingWorksheet(params: {
  sections: Array<{ title: string; content: string; type?: string; teacherOnly?: boolean }>;
  tier: 'foundation' | 'higher';
  subject?: string;
  topic?: string;
  yearGroup?: string;
  title?: string;
}): Promise<{
  sections: Array<{ title: string; content: string; type?: string; teacherOnly?: boolean }>;
  tierApplied?: string;
  changesNote?: string;
  provider?: string;
}> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  const res = await fetch('/api/ai/differentiate-worksheet', {
    method: 'POST',
    signal: controller.signal,
    headers,
    credentials: 'include',
    body: JSON.stringify({
      sections: params.sections,
      tier: params.tier,
      subject: params.subject,
      topic: params.topic,
      yearGroup: params.yearGroup,
      title: params.title,
    }),
  });

  clearTimeout(timeoutId);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Differentiate request failed: ${res.status}`);
  }

  const data = await res.json();
  const differentiated = data.differentiated;

  return {
    sections: differentiated.sections || params.sections,
    tierApplied: differentiated.tierApplied,
    changesNote: differentiated.changesNote,
    provider: data.provider,
  };
}


// ─── Natural Language Input Parser ──────────────────────────────────────────
/**
 * Parses a natural-language prompt like "Year 10 Maths Fractions for dyslexia"
 * and extracts structured fields to auto-fill the worksheet generator form.
 * Uses pattern matching — no AI call required, so it's instant.
 */
// ═══ §NL-PARSE · parseNaturalLanguageInput ════════════════════════════════
export function parseNaturalLanguageInput(input: string): {
  subject?: string;
  yearGroup?: string;
  topic?: string;
  difficulty?: string;
  sendNeed?: string;
  readingAge?: number;
} {
  const text = input.trim().toLowerCase();
  const result: {
    subject?: string;
    yearGroup?: string;
    topic?: string;
    difficulty?: string;
    sendNeed?: string;
    readingAge?: number;
  } = {};

  // ── Year Group extraction ──
  const yearMatch = text.match(/year\s*(\d{1,2})/i) || text.match(/y(\d{1,2})\b/i);
  if (yearMatch) {
    const num = parseInt(yearMatch[1], 10);
    if (num >= 1 && num <= 13) result.yearGroup = `Year ${num}`;
  }
  // 11+ detection
  if (/11\s*\+|eleven\s*plus/i.test(text)) {
    result.yearGroup = "11+ Preparation";
  }

  // ── Reading Age extraction ──
  const raMatch = text.match(/reading\s*age\s*(\d{1,2})/i) || text.match(/ra\s*(\d{1,2})/i);
  if (raMatch) {
    const age = parseInt(raMatch[1], 10);
    if (age >= 5 && age <= 18) result.readingAge = age;
  }

  // ── Subject extraction ──
  // Explicit science disciplines must win before broad keywords such as
  // "reading" in "reading age" or topic words shared across subjects.
  if (/\bbiology\b|\bbiological\b/i.test(text)) result.subject = "biology";
  else if (/\bchemistry\b|\bchemical\b/i.test(text)) result.subject = "chemistry";
  else if (/\bphysics\b|\bphysical\b/i.test(text)) result.subject = "physics";

  const subjectMap: Record<string, string[]> = {
    mathematics: [
      "math", "maths", "mathematics", "algebra", "geometry", "arithmetic", "calculus",
      "fractions", "fraction", "decimals", "decimal", "percentages", "percentage",
      "ratio", "ratios", "proportion", "proportions", "probability", "statistics",
      "trigonometry", "trig", "pythagoras", "surds", "surd", "indices", "index",
      "vectors", "vector", "matrices", "matrix", "quadratic", "quadratics",
      "simultaneous", "inequalities", "inequality", "sequences", "sequence",
      "differentiation", "integration", "calculus", "functions", "function",
      "number", "numeracy", "multiplication", "division", "addition", "subtraction",
      "integers", "integer", "prime", "primes", "factors", "multiples", "bodmas",
      "area", "perimeter", "volume", "circle", "circles", "angles", "angle",
      "shape", "shapes", "coordinates", "coordinate", "graphs", "graph",
      "equations", "equation", "formulae", "formula", "loci", "bearing", "bearings",
      "gcse maths", "a-level maths", "a level maths",
    ],
    english: [
      "english", "literacy", "reading", "writing", "comprehension", "grammar",
      "poetry", "poem", "poems", "shakespeare", "macbeth", "hamlet", "romeo",
      "punctuation", "spelling", "vocabulary", "persuasive", "narrative",
      "descriptive writing", "creative writing", "of mice and men", "great gatsby",
      "newspaper", "speech", "letter writing", "essay", "analysis",
    ],
    science: [
      "science", "atoms", "atom", "cells", "cell",
      "forces", "energy", "electricity", "magnetism", "waves", "light", "sound",
      "periodic table", "elements", "compounds", "mixtures", "reactions", "reaction",
      "evolution", "genetics", "dna", "photosynthesis", "respiration", "digestion",
      "ecosystems", "ecosystem", "particles", "particle", "nuclear", "space", "planets",
      "acids", "alkalis", "ph", "titration", "electrolysis", "bonding", "covalent",
    ],
    history: [
      "history", "ww1", "ww2", "world war", "tudor", "victorian", "medieval",
      "roman", "empire", "cold war", "civil rights", "holocaust", "slavery",
      "industrial revolution", "french revolution", "american revolution",
      "first world war", "second world war", "henry viii", "elizabeth",
    ],
    geography: [
      "geography", "rivers", "volcanoes", "earthquakes", "climate", "weather",
      "maps", "tectonic", "biomes", "biome", "rainforest", "urbanisation",
      "globalisation", "development", "population", "migration", "coasts",
      "glaciation", "glacial", "weather systems",
    ],
    computing: [
      "computing", "computer science", "coding", "programming", "algorithms",
      "python", "html", "css", "javascript", "binary", "logic gates", "networking",
      "cybersecurity", "databases", "sql", "boolean",
    ],
    art: ["art", "drawing", "painting", "sculpture", "design", "collage", "printmaking"],
    music: ["music", "rhythm", "melody", "composition", "instruments", "notation"],
    pe: ["pe", "physical education", "sport", "fitness", "exercise", "health"],
    dt: ["dt", "design technology", "design and technology", "food tech", "textiles", "resistant materials"],
    re: ["re", "religious education", "religion", "faith", "beliefs", "christianity", "islam", "hinduism", "buddhism"],
    mfl: ["french", "spanish", "german", "mfl", "languages", "foreign language", "italian", "mandarin"],
    pshe: ["pshe", "citizenship", "wellbeing", "mental health", "relationships", "sex ed", "drugs"],
    business: ["business", "economics", "enterprise", "marketing", "finance", "accounting", "supply and demand"],
    drama: ["drama", "theatre", "acting", "performance", "script", "stagecraft"],
  };
  if (!result.subject) {
    for (const [id, keywords] of Object.entries(subjectMap)) {
      for (const kw of keywords) {
        if (kw === "reading" && /\breading\s+age\b/i.test(text)) continue;
        if (text.includes(kw)) {
          result.subject = id;
          break;
        }
      }
      if (result.subject) break;
    }
  }

  // ── SEND Need extraction ──
  const sendMap: Record<string, string[]> = {
    dyslexia: ["dyslexia", "dyslexic"],
    dyscalculia: ["dyscalculia", "dyscalculic"],
    dyspraxia: ["dyspraxia", "dyspraxic"],
    asc: ["autism", "autistic", "asc"],
    asperger: ["asperger"],
    adhd: ["adhd", "attention deficit"],
    anxiety: ["anxiety", "anxious"],
    slcn: ["slcn", "speech and language", "communication needs"],
    mld: ["mld", "moderate learning"],
    vi: ["visual impairment", "visually impaired", "vi", "blind", "low vision"],
    hi: ["hearing impairment", "hearing impaired", "hi", "deaf"],
    tourettes: ["tourette", "tics"],
    "pda-odd": ["pda", "pathological demand", "odd", "oppositional"],
    "older-learners": ["older learner", "mature student"],
  };
  for (const [id, keywords] of Object.entries(sendMap)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        result.sendNeed = id;
        break;
      }
    }
    if (result.sendNeed) break;
  }

  // ── Difficulty extraction ──
  if (/\bfoundation\b/i.test(text) || /\beasy\b/i.test(text) || /\bsimple\b/i.test(text) || /\bbasic\b/i.test(text)) {
    result.difficulty = "foundation";
  } else if (/\bhigher\b/i.test(text) || /\bhard\b/i.test(text) || /\bchalleng/i.test(text) || /\badvanced\b/i.test(text) || /\bstretch\b/i.test(text)) {
    result.difficulty = "higher";
  }

  // ── Topic extraction (everything that's left after removing matched tokens) ──
  // Strategy: first check for known compound topic phrases before stripping anything,
  // then fall back to the remainder approach.
  const COMPOUND_TOPICS: Array<[RegExp, string, string]> = [
    // [pattern, canonical topic name, subject override if needed]
    [/quadratic\s+equation/i,         "Quadratic Equations",          "mathematics"],
    [/quadratic\s+formula/i,          "Quadratic Formula",            "mathematics"],
    [/simultaneous\s+equation/i,      "Simultaneous Equations",       "mathematics"],
    [/linear\s+equation/i,            "Linear Equations",             "mathematics"],
    [/linear\s+graph/i,               "Linear Graphs",                "mathematics"],
    [/straight.line\s+graph/i,        "Straight-Line Graphs",         "mathematics"],
    [/nth\s+term/i,                   "nth Term of a Sequence",       "mathematics"],
    [/arithmetic\s+sequence/i,        "Arithmetic Sequences",         "mathematics"],
    [/geometric\s+sequence/i,         "Geometric Sequences",          "mathematics"],
    [/completing\s+the\s+square/i,    "Completing the Square",        "mathematics"],
    [/circle\s+theorem/i,             "Circle Theorems",              "mathematics"],
    [/speed.*distance.*time/i,        "Speed, Distance and Time",     "mathematics"],
    [/percentage\s+change/i,          "Percentage Change",            "mathematics"],
    [/reverse\s+percentage/i,         "Reverse Percentages",          "mathematics"],
    [/standard\s+form/i,              "Standard Form",                "mathematics"],
    [/direct\s+proportion/i,          "Direct Proportion",            "mathematics"],
    [/inverse\s+proportion/i,         "Inverse Proportion",           "mathematics"],
    [/trigonometric\s+ratio/i,        "Trigonometric Ratios",         "mathematics"],
    [/sine\s+rule/i,                  "Sine Rule",                    "mathematics"],
    [/cosine\s+rule/i,                "Cosine Rule",                  "mathematics"],
    [/equation\s+of\s+a\s+circle/i,  "Equation of a Circle",         "mathematics"],
    [/periodic\s+table/i,             "Periodic Table",               "chemistry"],
    [/atomic\s+structure/i,           "Atomic Structure",             "chemistry"],
    [/covalent\s+bond/i,              "Covalent Bonding",             "chemistry"],
    [/ionic\s+bond/i,                 "Ionic Bonding",                "chemistry"],
    [/natural\s+selection/i,          "Natural Selection",            "biology"],
    [/photosynthesis/i,                "Photosynthesis",               "biology"],
    [/respiration/i,                   "Respiration",                  "biology"],
    [/mitosis/i,                       "Mitosis",                      "biology"],
    [/nuclear\s+(decay|radiation)/i,  "Nuclear Decay",                "physics"],
    [/forces?\s+and\s+motion/i,      "Forces and Motion",            "physics"],
    [/industrial\s+revolution/i,      "Industrial Revolution",        "history"],
    [/world\s+war\s+[12one two]/i,   text.includes("ww1") || text.includes("world war 1") || text.includes("world war one") || text.includes("first world war") ? "World War One" : "World War Two", "history"],
    [/civil\s+rights/i,               "Civil Rights Movement",        "history"],
    [/plate\s+tectonic/i,             "Plate Tectonics",              "geography"],
    [/coastal\s+erosion/i,            "Coastal Erosion",              "geography"],
    [/urban\s+land\s+use/i,           "Urban Land Use",               "geography"],
  ];

  // Check compound topics first — they win over the generic remainder extraction
  let compoundTopicFound = false;
  for (const [pattern, topicName, subj] of COMPOUND_TOPICS) {
    if (pattern.test(text)) {
      result.topic = topicName;
      if (!result.subject) result.subject = subj;
      compoundTopicFound = true;
      break;
    }
  }

  // First, save any specific topic keyword that was matched as the subject trigger.
  // e.g. "multiplication" triggers subject=mathematics but is also the topic.
  // We must NOT strip it from the remaining text in that case.
  const specificTopicKeywords = new Set([
    "multiplication", "division", "addition", "subtraction", "fractions", "fraction",
    "decimals", "decimal", "percentages", "percentage", "ratio", "ratios",
    "proportion", "proportions", "probability", "statistics", "trigonometry", "trig",
    "pythagoras", "surds", "surd", "indices", "index", "vectors", "vector",
    "matrices", "matrix", "quadratics", "quadratic", "simultaneous", "inequalities",
    "inequality", "sequences", "sequence", "differentiation", "integration",
    "calculus", "functions", "function", "algebra", "geometry", "arithmetic",
    "numeracy", "integers", "integer", "prime", "primes", "factors",
    "multiples", "bodmas", "area", "perimeter", "volume", "circle", "circles",
    "angles", "angle", "shape", "shapes", "coordinates", "coordinate", "graphs",
    "graph", "equations", "equation", "formulae", "formula", "loci", "bearing",
    "bearings", "photosynthesis", "respiration", "osmosis", "evolution", "genetics",
    "electricity", "magnetism", "forces", "energy", "waves", "acids", "alkalis",
    "titration", "electrolysis", "bonding", "periodic table", "cells", "cell",
    "atoms", "atom", "compounds", "mixtures", "reactions", "reaction",
  ]);

  if (!compoundTopicFound) {
    // Detect if the subject was triggered by a specific topic keyword
    let subjectTriggerKeyword = "";
    if (result.subject) {
      const kws = subjectMap[result.subject] || [];
      for (const kw of kws) {
        if (text.includes(kw) && specificTopicKeywords.has(kw)) {
          subjectTriggerKeyword = kw;
          break;
        }
      }
    }

    let remaining = text;
    // Remove year group
    remaining = remaining.replace(/year\s*\d{1,2}/gi, "").replace(/y\d{1,2}\b/gi, "").replace(/11\s*\+/g, "").replace(/eleven\s*plus/gi, "");
    // Remove subject keywords — but NOT the one that is also a specific topic
    if (result.subject) {
      const kws = subjectMap[result.subject] || [];
      for (const kw of kws) {
        if (kw === subjectTriggerKeyword) continue;
        if (subjectTriggerKeyword && ["math", "maths", "mathematics"].includes(kw)) continue;
        remaining = remaining.replace(new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "gi"), "");
      }
    }
    // Remove SEND keywords
    if (result.sendNeed) {
      const kws = sendMap[result.sendNeed] || [];
      for (const kw of kws) {
        remaining = remaining.replace(new RegExp(`\\b${kw}\\b`, "gi"), "");
      }
    }
    // Remove difficulty keywords
    remaining = remaining.replace(/\b(foundation|higher|easy|hard|simple|basic|advanced|stretch|challenging|mixed)\b/gi, "");
    // Remove filler words
    remaining = remaining.replace(/\b(for|with|about|on|in|the|a|an|create|make|generate|worksheet|lesson|please|can|you|i|want|need|to)\b/gi, "");
    // Clean up
    remaining = remaining.replace(/[,\-–—]/g, " ").replace(/\s+/g, " ").trim();

    if (remaining.length > 1) {
      // Use the subject trigger keyword as the topic if remaining is very short
      // (e.g. "quadratics" stays as "Quadratic Equations" not "Quadratics")
      const topicWord = remaining.toLowerCase();
      const TOPIC_EXPANSIONS: Record<string, string> = {
        quadratic: "Quadratic Equations", quadratics: "Quadratic Equations",
        simultaneous: "Simultaneous Equations", inequality: "Inequalities",
        inequalities: "Inequalities", surds: "Surds and Indices",
        surd: "Surds", indices: "Indices and Powers",
        trig: "Trigonometry", pythagoras: "Pythagoras' Theorem",
        vectors: "Vectors", matrices: "Matrices",
        differentiation: "Differentiation", integration: "Integration",
        sequences: "Sequences and Series", bodmas: "Order of Operations (BODMAS)",
        loci: "Loci and Constructions", formulae: "Using Formulae",
        coordinates: "Coordinates and Graphs", probability: "Probability",
        statistics: "Statistics and Data", fractions: "Fractions",
        decimals: "Decimals and Percentages", percentages: "Percentages",
        photosynthesis: "Photosynthesis", respiration: "Respiration",
        electrolysis: "Electrolysis", bonding: "Chemical Bonding",
        titration: "Acid-Base Titrations",
      };
      result.topic = TOPIC_EXPANSIONS[topicWord]
        ?? remaining.replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  // ── Fill in all missing defaults so the worksheet always generates ─────────
  // If we have a topic but no subject, try to infer it from topic keywords
  if (result.topic && !result.subject) {
    const topicLower = result.topic.toLowerCase();
    const mathKeywords = ["fraction","decimal","percentage","algebra","equation","graph","geometry","trigonometry","calculus","statistic","probability","ratio","proportion","vector","matrix","sequence","polynomial","differentiation","integration","pythagoras","angle","area","perimeter","volume","circle","triangle","quadratic","linear","simultaneous","inequality","surd","index","prime","factor","multiple","arithmetic","multiplication","division","addition","subtraction","number","shape","coordinate","symmetry","transformation","bearing","loci"];
    const biologyKeywords = ["cell","cells","mitosis","meiosis","dna","genetic","genetics","evolution","photosynthesis","respiration","osmosis","diffusion","enzyme","organ","ecosystem","ecology","infection","disease","homeostasis","hormone","plant","animal","protein","chromosome"];
    const chemistryKeywords = ["atom","molecule","element","compound","reaction","periodic","acid","alkali","base","bonding","titration","electrolysis","salt","rate","equilibrium","hydrocarbon","organic","metal","ion","ionic","covalent","particle"];
    const physicsKeywords = ["force","motion","speed","velocity","acceleration","energy","wave","electricity","magnetism","circuit","nuclear","radioactive","decay","pressure","momentum","power","current","voltage","resistance","light","sound","emf"];
    const scienceKeywords = [...biologyKeywords, ...chemistryKeywords, ...physicsKeywords, "climate", "matter"];
    const historyKeywords = ["war","revolution","empire","tudor","victorian","roman","medieval","cold war","slavery","holocaust","civil","industrial","world war","henry","elizabeth","parliament","democracy","monarch"];
    const geographyKeywords = ["river","volcano","earthquake","climate","weather","tectonic","biome","rainforest","urbanisation","globalisation","migration","coast","glacier","population","development","map","landform","erosion","flood"];
    if (mathKeywords.some(k => topicLower.includes(k))) result.subject = "mathematics";
    else if (biologyKeywords.some(k => topicLower.includes(k))) result.subject = "biology";
    else if (chemistryKeywords.some(k => topicLower.includes(k))) result.subject = "chemistry";
    else if (physicsKeywords.some(k => topicLower.includes(k))) result.subject = "physics";
    else if (scienceKeywords.some(k => topicLower.includes(k))) result.subject = "science";
    else if (historyKeywords.some(k => topicLower.includes(k))) result.subject = "history";
    else if (geographyKeywords.some(k => topicLower.includes(k))) result.subject = "geography";
    else result.subject = "english"; // sensible fallback
  }

  // If we have a subject but no topic, use a sensible default topic for the subject
  if (result.subject && !result.topic) {
    const defaultTopics: Record<string, string> = {
      mathematics: "Number", english: "Reading Comprehension", science: "Cells",
      biology: "Cells", chemistry: "Atomic Structure", physics: "Forces and Motion",
      history: "World War II", geography: "Rivers", computing: "Algorithms",
      art: "Drawing", music: "Theory", pe: "Health", dt: "Design Process",
      re: "World Religions", mfl: "Vocabulary", pshe: "Wellbeing",
      business: "Supply and Demand", drama: "Script Writing",
    };
    result.topic = defaultTopics[result.subject] || "Introduction";
  }

  // Ensure we always have a year group — default to Year 9 (GCSE transition year)
  if (!result.yearGroup) result.yearGroup = "Year 9";

  // Ensure we always have a difficulty — default to mixed
  if (!result.difficulty) result.difficulty = "mixed";

  // If still no subject and no topic at all, return something workable
  if (!result.subject) result.subject = "mathematics";
  if (!result.topic) result.topic = "Number";

  return result;
}

// ─── Scenario Swap ──────────────────────────────────────────────────────────
/**
 * Recontextualizes worksheet questions to a new scenario/theme (e.g., shopping → football)
 * while keeping the academic skill and difficulty identical.
 */
// ═══ §SCENARIO · aiScenarioSwap ═══════════════════════════════════════════
export async function aiScenarioSwap(params: {
  sections: Array<{ title: string; content: string; type?: string; teacherOnly?: boolean }>;
  newScenario: string;
  subject?: string;
  yearGroup?: string;
  sendNeed?: string;
}): Promise<{
  sections: Array<{ title: string; content: string; type?: string; teacherOnly?: boolean }>;
  provider?: string;
}> {
  const system = `You are a UK SEND specialist teacher. Your task is to recontextualize worksheet questions to use a new real-world scenario/theme while keeping the EXACT same academic skills, difficulty level, mark allocations, and question structure. Only change the context/scenario — not the maths, science, or subject content. Return valid JSON only, no markdown code blocks.`;

  const sectionsToSwap = params.sections.filter(s => !s.teacherOnly && s.type !== "answers" && s.type !== "mark-scheme" && s.type !== "teacher-notes");
  const teacherSections = params.sections.filter(s => s.teacherOnly || s.type === "answers" || s.type === "mark-scheme" || s.type === "teacher-notes");

  const user = `Recontextualize ALL questions in this worksheet to use the theme/scenario: "${params.newScenario}"

Subject: ${params.subject || "general"}
Year Group: ${params.yearGroup || "secondary"}
${params.sendNeed ? `SEND Need: ${params.sendNeed} — maintain all SEND adaptations` : ""}

IMPORTANT RULES:
- Change ONLY the real-world context (names, places, objects, situations)
- Keep the EXACT same mathematical/academic operations, difficulty, and mark allocations
- Keep all scaffolding (sentence starters, word banks, hints) but update their context
- Keep section titles and structure identical
- If a section has no contextual content (e.g., vocabulary definitions), keep it unchanged

SECTIONS TO RECONTEXTUALIZE:
${JSON.stringify(sectionsToSwap, null, 2)}

Return JSON array of sections with updated content:
[{"title": "...", "content": "...", "type": "...", "teacherOnly": false}]`;

  const { text, provider } = await callAI(system, user, 3000);
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = parseWithFixes(cleaned);
  const swappedSections = Array.isArray(parsed) ? parsed : sectionsToSwap;

  return {
    sections: [...swappedSections, ...teacherSections],
    provider,
  };
}

// ─── Reading Level Adjustment ───────────────────────────────────────────────
/**
 * Rewrites worksheet instructions and vocabulary to match a target reading age
 * without changing the mathematical/academic difficulty.
 */
// ═══ §READAGE · aiAdjustReadingLevel ══════════════════════════════════════
export async function aiAdjustReadingLevel(params: {
  sections: Array<{ title: string; content: string; type?: string; teacherOnly?: boolean }>;
  targetAge: number; // e.g., 7, 9, 11, 13
  subject?: string;
  yearGroup?: string;
  sendNeed?: string;
}): Promise<{
  sections: Array<{ title: string; content: string; type?: string; teacherOnly?: boolean }>;
  provider?: string;
}> {
  const getAgeGuide = (age: number): string => {
    if (age <= 5) return "Reading age 5: Maximum 4–5 words per sentence. Only single-syllable or very familiar words. No technical vocabulary at all.";
    if (age <= 6) return "Reading age 6: Very short sentences (4–6 words). Only the most common everyday words. Explain all subject words in the simplest terms.";
    if (age <= 7) return "Reading age 7: Use very short sentences (5-8 words max). Simple, common words only. One instruction per sentence. No compound or complex sentences. Avoid all technical jargon — use everyday words instead.";
    if (age <= 8) return "Reading age 8: Short sentences (6–9 words). Common vocabulary with simple explanations for subject terms. Simple compound sentences allowed.";
    if (age <= 9) return "Reading age 9: Use short, clear sentences (8-12 words). Everyday vocabulary. Simple compound sentences allowed. Define any technical terms in brackets immediately after.";
    if (age <= 10) return "Reading age 10: Sentences of 8–13 words. Accessible vocabulary with definitions for subject-specific terms. Mix of simple and compound sentences.";
    if (age <= 11) return "Reading age 11: Use moderate sentences (10-15 words). Subject vocabulary with brief definitions. Some complex sentences acceptable. Clear, direct instructions.";
    if (age <= 12) return "Reading age 12: Sentences of 10–16 words. Good vocabulary range including subject-specific terms with brief definitions. Varied sentence structures.";
    if (age <= 13) return "Reading age 13: Use standard academic language. Technical vocabulary expected. Multi-clause sentences acceptable. GCSE-level command words (describe, explain, evaluate).";
    if (age <= 14) return "Reading age 14: Confident academic language. Technical vocabulary used naturally. Complex sentence structures. GCSE command words throughout.";
    if (age <= 15) return "Reading age 15: Advanced secondary-level language. Rich vocabulary, complex sentence structures, nuanced expression. GCSE/A-Level standard.";
    if (age <= 16) return "Reading age 16: A-Level standard language. Sophisticated vocabulary, complex analytical language, mature academic expression.";
    return "Reading age 17+: University-entrance standard. Highly sophisticated vocabulary, mature complex academic expression, analytical and evaluative depth.";
  };

  const guide = getAgeGuide(params.targetAge);

  const system = `You are a UK SEND specialist teacher. Rewrite the worksheet text to match a specific reading age level. CRITICAL: Change ONLY the language complexity, vocabulary, and sentence structure. Do NOT change the academic content, questions, numbers, formulas, or difficulty of the tasks themselves. Return a valid JSON ARRAY only — no wrapper object, no markdown code blocks, no extra keys. Output MUST start with [ and end with ].`;

  const sectionsToAdjust = params.sections.filter(s => !s.teacherOnly && s.type !== "answers" && s.type !== "mark-scheme");
  const preservedSections = params.sections.filter(s => s.teacherOnly || s.type === "answers" || s.type === "mark-scheme");

  const user = `Rewrite ALL instructions and text in this worksheet to match: ${guide}

Subject: ${params.subject || "general"}
Year Group: ${params.yearGroup || "secondary"}
${params.sendNeed ? `SEND Need: ${params.sendNeed}` : ""}

RULES:
- Rewrite ONLY the instructional text, question wording, and vocabulary definitions
- Do NOT change: numbers, formulas, equations, mark allocations, answer spaces, section titles
- Keep all scaffolding structures (word banks, sentence starters, checklists) but simplify their language
- If content is already at or below the target reading level, leave it unchanged

SECTIONS:
${JSON.stringify(sectionsToAdjust, null, 2)}

Return a JSON array (NOT an object) of sections with adjusted language — start with [ and end with ]:
[{"title": "...", "content": "...", "type": "...", "teacherOnly": false}]`;

  const { text, provider } = await callAI(system, user, 3000);
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: any;
  try {
    parsed = parseWithFixes(cleaned);
  } catch (e) {
    throw new Error("Reading level adjustment failed — AI returned unparseable response. Please try again.");
  }

  // Handle both a raw array AND a wrapped object like {"sections": [...]}
  let adjustedSections: typeof sectionsToAdjust;
  if (Array.isArray(parsed)) {
    adjustedSections = parsed;
  } else if (parsed && Array.isArray(parsed.sections)) {
    adjustedSections = parsed.sections;
  } else if (parsed && Array.isArray(parsed.adjustedSections)) {
    adjustedSections = parsed.adjustedSections;
  } else {
    // Could not extract sections array — throw so the caller shows an error toast
    throw new Error("Reading level adjustment failed — unexpected AI response format. Please try again.");
  }

  // Validate we got real section objects back
  if (adjustedSections.length === 0) {
    throw new Error("Reading level adjustment returned empty sections. Please try again.");
  }

  return {
    sections: [...adjustedSections, ...preservedSections],
    provider,
  };
}

// ─── Story Scenario Swap ──────────────────────────────────────────────────
/**
 * Recontextualizes a story to use a new scenario/theme while keeping the same
 * reading level, structure, and educational value.
 */
// ═══ §SCENARIO (story variant) · aiScenarioSwapStory ══════════════════════
export async function aiScenarioSwapStory(params: {
  title: string;
  content: string;
  newScenario: string;
  genre?: string;
  yearGroup?: string;
  sendNeed?: string;
  readingLevel?: string;
}): Promise<{
  title: string;
  content: string;
  provider?: string;
}> {
  const system = `You are a UK SEND specialist teacher and creative writer. Your task is to recontextualize an educational story to use a new real-world scenario/theme while keeping the EXACT same reading level, story structure, educational value, and length. Return valid JSON only with "title" and "content" fields, no markdown code blocks.`;

  const user = `Recontextualize this story to use the theme/scenario: "${params.newScenario}"

Genre: ${params.genre || "general"}
Year Group: ${params.yearGroup || "secondary"}
${params.sendNeed ? `SEND Need: ${params.sendNeed} — maintain all SEND adaptations` : ""}
${params.readingLevel ? `Reading Level: ${params.readingLevel}` : ""}

IMPORTANT RULES:
- Change the setting, characters, and context to match the new scenario
- Keep the EXACT same reading level and vocabulary complexity
- Keep the same story structure (beginning, middle, end)
- Keep the same length (approximately the same number of paragraphs)
- Maintain any SEND adaptations (short sentences, simple vocabulary, etc.)
- Update the title to reflect the new scenario

CURRENT TITLE: ${params.title}

CURRENT STORY:
${params.content}

Return JSON: {"title": "new title", "content": "full recontextualized story"}`;

  const { text, provider } = await callAI(system, user, 3000);
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = parseWithFixes(cleaned);

  return {
    title: parsed?.title || params.title,
    content: parsed?.content || params.content,
    provider,
  };
}

// ─── SVG Diagram Renderer — client-side, zero extra API cost ─────────────────
// The AI embeds structured diagram JSON in section content using this format:
// [[DIAGRAM:{"type":"labeled","title":"...","labels":[{"text":"...","x":50,"y":40}],...}]]
// This function extracts and renders them as clean SVG without any extra AI call.

// ═══ §DIAG-SPEC · DiagramSpec types and helpers ═══════════════════════════
export interface DiagramSpec {
  type: "labeled" | "flow" | "cycle" | "bar" | "number-line" | "axes" | "circuit" | "venn" | "timeline" | "pyramid" | "fraction-bar";
  /** For circuit diagrams: "series" | "parallel" | "series-ammeter" | "parallel-voltmeter" */
  layout?: string;
  title?: string;
  // For labeled diagrams (anatomy, geography, physics)
  shape?: "circle" | "rectangle" | "triangle" | "custom";
  labels?: Array<{ text: string; x: number; y: number; anchor?: "start" | "end" | "middle" }>;
  // For flow/cycle diagrams
  steps?: string[];
  // For number lines
  start?: number; end?: number; marked?: number[];
  // For bar charts / axes
  bars?: Array<{ label: string; value: number }>;
  xLabel?: string; yLabel?: string;
  // For venn diagrams
  setA?: string; setB?: string; overlap?: string[];
  onlyA?: string[]; onlyB?: string[];
  // For timeline diagrams
  events?: Array<{ date: string; label: string }>;
  // For pyramid diagrams
  levels?: string[];
  // For fraction-bar diagrams
  numerator?: number; denominator?: number; fractionLabel?: string;
}

/**
 * Validates a DiagramSpec object to ensure all required fields are present and valid.
 * Returns false if the spec is invalid so extractDiagramSpec can return null.
 */
export function validateDiagramSpec(spec: DiagramSpec): boolean {
  const validTypes = ["labeled", "circuit", "flow", "cycle", "number-line", "bar", "axes", "venn", "timeline", "pyramid", "fraction-bar"];
  if (!spec || !spec.type) return false;
  if (!validTypes.includes(spec.type)) return false;

  switch (spec.type) {
    case "labeled":
      if (!spec.labels || spec.labels.length < 3) return false;
      if (spec.labels.some(l => l.x < 5 || l.x > 95 || l.y < 5 || l.y > 95)) return false;
      if (spec.labels.length > 8) return false;
      break;
    case "circuit":
      if (!spec.layout) return false;
      break;
    case "flow":
    case "cycle":
      if (!spec.steps || spec.steps.length < 3 || spec.steps.length > 8) return false;
      break;
    case "bar":
      if (!spec.bars || spec.bars.length < 2) return false;
      break;
    case "number-line":
      if (spec.start === undefined || spec.end === undefined) return false;
      break;
    case "axes":
      if (!spec.xLabel || !spec.yLabel) return false;
      break;
    case "venn":
      if (!spec.setA || !spec.setB) return false;
      break;
    case "timeline":
      if (!spec.events || spec.events.length < 2 || spec.events.length > 8) return false;
      break;
    case "pyramid":
      if (!spec.levels || spec.levels.length < 2 || spec.levels.length > 7) return false;
      break;
    case "fraction-bar":
      if (!spec.denominator || spec.denominator < 1 || spec.denominator > 12) return false;
      if (spec.numerator === undefined || spec.numerator < 0) return false;
      break;
  }
  return true;
}

/**
 * Detects [[DIAGRAM:{...}]] markers in section content and returns the JSON spec.
 * Returns null if no diagram marker is found or if the spec fails validation.
 */
export function extractDiagramSpec(content: string | null | undefined): DiagramSpec | null {
  if (!content) return null;
  const match = content.match(/\[\[DIAGRAM:(\{[\s\S]*?\})\]\]/);
  if (!match) return null;
  try {
    const spec = JSON.parse(match[1]);
    if (!validateDiagramSpec(spec)) return null;
    return spec;
  } catch { return null; }
}

/**
 * Strips the [[DIAGRAM:{...}]] marker from content so only the text question remains.
 * Also strips AI instruction lines (IMPORTANT:, LABELS:, ANSWERS:) that should not be visible.
 */
export function stripDiagramMarker(content: string): string {
  let cleaned = content.replace(/\[\[DIAGRAM:\{[\s\S]*?\}\]\]/g, "");
  // Strip AI instruction lines that leak into visible content.
  // Robust matching: handles leading pipes, whitespace, asterisks, and partial matches.
  cleaned = cleaned.split("\n").filter(line => {
    const trimmed = line.trim();
    // Strip empty lines that are just whitespace
    if (!trimmed) return true; // keep blank lines for spacing
    // Direct prefix matches (case-insensitive)
    if (/^\*{0,2}\s*IMPORTANT\s*[:—-]/i.test(trimmed)) return false;
    if (/^\*{0,2}\s*LABELS\s*[:—-]/i.test(trimmed)) return false;
    if (/^\*{0,2}\s*ANSWERS\s*[:—-]/i.test(trimmed)) return false;
    if (/^\*{0,2}\s*NOTE\s*[:—-]/i.test(trimmed)) return false;
    if (/^\*{0,2}\s*CRITICAL\s*[:—-]/i.test(trimmed)) return false;
    if (/^\*{0,2}\s*DIAGRAM\s*(TYPE|RULES|INSTRUCTION)\s*[:—-]/i.test(trimmed)) return false;
    if (/^\*{0,2}\s*TOPIC[\s-]*SPECIFIC/i.test(trimmed)) return false;
    // Pipe-table rows containing LABELS/ANSWERS/IMPORTANT
    if (/^\|?\s*\*{0,2}\s*LABELS\s*[:—|]/i.test(trimmed)) return false;
    if (/^\|?\s*\*{0,2}\s*ANSWERS\s*[:—|]/i.test(trimmed)) return false;
    if (/^\|?\s*\*{0,2}\s*IMPORTANT\s*[:—|]/i.test(trimmed)) return false;
    // Strip separator rows between LABELS/ANSWERS tables (e.g. |---|---|)
    if (/^\|[\s\-:]+\|/.test(trimmed) && trimmed.split('|').length >= 3) {
      const cells = trimmed.split('|').filter(c => c.trim());
      if (cells.every(c => /^[\s\-:]+$/.test(c))) return false;
    }
    // Strip lines that are just "LABELS" or "ANSWERS" headers with no content
    if (/^\|?\s*labels\s*\|?\s*$/i.test(trimmed)) return false;
    if (/^\|?\s*answers\s*\|?\s*$/i.test(trimmed)) return false;
    return true;
  }).join("\n");
  return cleaned.trim();
}

// Last verified: safe-updates-v2 applied, groq_1/2/3 rotation preserved

/**
 * Rewrites a single piece of text (e.g., a screener question) to match a target reading age.
 * Preserves meaning and intent — only changes vocabulary and sentence structure.
 */
// ═══ §READAGE (rewrite variant) · aiRewriteTextToReadingAge ═══════════════
export async function aiRewriteTextToReadingAge(params: {
  text: string;
  targetAge: number;
  context?: string; // e.g. "SEND screener question about dyslexia"
}): Promise<string> {
  const getAgeGuide = (age: number): string => {
    if (age <= 5) return "Reading age 5: Maximum 4–5 words per sentence. Only single-syllable or very familiar words. No technical vocabulary at all.";
    if (age <= 6) return "Reading age 6: Very short sentences (4–6 words). Only the most common everyday words. Explain all subject words in the simplest terms.";
    if (age <= 7) return "Reading age 7: Use very short sentences (5-8 words max). Simple, common words only. One instruction per sentence. No compound or complex sentences. Avoid all technical jargon — use everyday words instead.";
    if (age <= 8) return "Reading age 8: Short sentences (6–9 words). Common vocabulary with simple explanations for subject terms. Simple compound sentences allowed.";
    if (age <= 9) return "Reading age 9: Use short, clear sentences (8-12 words). Everyday vocabulary. Simple compound sentences allowed. Define any technical terms in brackets immediately after.";
    if (age <= 10) return "Reading age 10: Sentences of 8–13 words. Accessible vocabulary with definitions for subject-specific terms. Mix of simple and compound sentences.";
    if (age <= 11) return "Reading age 11: Use moderate sentences (10-15 words). Subject vocabulary with brief definitions. Some complex sentences acceptable. Clear, direct instructions.";
    if (age <= 12) return "Reading age 12: Sentences of 10–16 words. Good vocabulary range including subject-specific terms with brief definitions. Varied sentence structures.";
    if (age <= 13) return "Reading age 13: Use standard academic language. Technical vocabulary expected. Multi-clause sentences acceptable.";
    if (age <= 14) return "Reading age 14: Confident academic language. Technical vocabulary used naturally. Complex sentence structures.";
    if (age <= 15) return "Reading age 15: Advanced secondary-level language. Rich vocabulary, complex sentence structures, nuanced expression.";
    if (age <= 16) return "Reading age 16: A-Level standard language. Sophisticated vocabulary, complex analytical language, mature academic expression.";
    return "Reading age 17+: University-entrance standard. Highly sophisticated vocabulary, mature complex academic expression.";
  };

  const guide = getAgeGuide(params.targetAge);

  const system = `You are a UK SEND specialist. Rewrite the given text to match a specific reading age. CRITICAL RULES:
- Change ONLY vocabulary complexity and sentence structure
- Preserve the EXACT meaning, intent, and all specific details
- Do NOT add or remove information
- Return ONLY the rewritten text — no explanations, no quotes, no extra formatting`;

  const user = `Rewrite this text to match: ${guide}

${params.context ? `Context: ${params.context}\n\n` : ""}Text to rewrite:
${params.text}`;

  const { text } = await callAI(system, user, 300);
  return text.trim().replace(/^["']|["']$/g, ""); // strip any surrounding quotes
}

// ── Batch Worksheet Generation ────────────────────────────────────────────────
// Calls POST /api/ai/batch-generate-worksheet to generate all 4 differentiation
// tiers (Base, Foundation, Higher, SEND) in a single AI call.
// This is ~4x more efficient than calling aiGenerateWorksheet three separate times.
// ═══ §BATCH · aiBatchGenerateWorksheet ════════════════════════════════════
export async function aiBatchGenerateWorksheet(params: {
  subject: string;
  topic: string;
  yearGroup: string;
  examBoard?: string;
  additionalInstructions?: string;
  includeAnswers?: boolean;
}): Promise<{
  tiers: {
    base: any;
    foundation: any;
    higher: any;
    send: any;
  };
  provider: string;
}> {
  const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };

  const res = await fetch("/api/ai/batch-generate-worksheet", {
    method: "POST",
    headers: reqHeaders,
    credentials: "include",
    body: JSON.stringify({
      subject: params.subject,
      topic: params.topic,
      yearGroup: params.yearGroup,
      examBoard: params.examBoard,
      additionalInstructions: params.additionalInstructions,
      includeAnswers: params.includeAnswers,
    }),
  });

  if (res.status === 401 || res.status === 403) {
    // Do NOT redirect — let the caller handle AUTH_REQUIRED gracefully
    throw new Error("AUTH_REQUIRED: Session expired. Please log in again.");
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({})) as any;
    throw new Error(errData?.error || "Batch generation failed. Please try again.");
  }

  const data = await res.json();
  if (!data.tiers) {
    throw new Error("Invalid response from batch generation endpoint.");
  }
  return { tiers: data.tiers, provider: data.provider || "unknown" };
}
