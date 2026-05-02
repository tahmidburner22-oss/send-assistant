/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary — unauthorised copying, modification, or distribution is strictly prohibited.
 *
 * Multi-provider AI engine for Adaptly.
 * Priority order: Groq → Gemini → OpenRouter → OpenAI → Local fallback
 * API keys stored in localStorage so users can update without redeploying.
 */

// ─── Spec-aligned question banks ────────────────────────────────────────────
import { expandedMathTopics } from './mathTopicsExpanded';
import { allTopics as worksheetAllTopics } from './worksheet-generator';

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

// ─── Robust JSON parser (exported for use across the app) ──────────────────────
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
    // We ONLY handle \f and \t here:
    //   \f = form feed (\x0c) — NEVER used in worksheet content, but \frac is very common
    //   \t = tab (\x09) — rarely used in worksheet content, but \times/\text/\theta are common
    // We do NOT handle \n, \r, \b because those are legitimately used as control chars
    // in JSON strings (e.g. \nStep 1: is a newline before "Step 1:").
    // LaTeX commands starting with n/r/b (\neq, \rightarrow, \begin) are handled
    // by the renderMath function which can detect them from context.
    const latexEscapeChars = new Set(['f', 't']);
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
        // If this is \X where X is a LaTeX escape char AND the char after X is a letter,
        // it's a LaTeX command (e.g. \frac, \times) — double the backslash.
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

// ─── Key storage helpers ─────────────────────────────────────────────────────
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

// ─── Provider implementations ────────────────────────────────────────────────

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

// ─── Main fallback chain ─────────────────────────────────────────────────────

export type AIProvider = "groq" | "gemini" | "openrouter" | "openai" | "claude" | "huggingface";

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000
): Promise<{ text: string; provider: AIProvider }> {
  // Primary: route through server so admin API keys are used automatically for all users
  try {
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutMs = 55000; // 55s — just under Railway's 60s limit; triggers fast retry instead of hanging
    const timeoutId = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: reqHeaders,
      credentials: "include",
      signal: controller?.signal,
      // Server expects 'prompt' (not 'userPrompt') per the /api/ai/generate endpoint
      body: JSON.stringify({ prompt: userPrompt, systemPrompt, maxTokens }),
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

// ─── Worksheet generation ────────────────────────────────────────────────────

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
  };
  isAI: true;
  provider?: string;
}

// ─── Spec-aligned question injection helper ─────────────────────────────────
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
  worksheetLength?: string;
  introOnly?: boolean; // When true, only generate intro sections (objectives, vocab, worked example) — used for hybrid exam mode
  recallTopic?: string; // When set, prepend 2-3 recall questions on this previous topic at the start of the worksheet
  targetPages?: number; // Target number of printed A4 pages (any positive integer, 0 = auto)
  readingAge?: number; // Target reading age (5–17) — controls vocabulary and sentence complexity
  isRevisionMat?: boolean; // When true, generate a revision mat instead of a standard worksheet
  selectedSections?: string[]; // Which sections to include (from the sections selector)
  subtopic?: string; // Optional subtopic for more specific generation
  generateDiagram?: boolean; // Whether to include diagram sections (default: true for relevant subjects)
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

    const { text: rmText, provider: rmProvider } = await callAI(rmSystem, rmUser, 3500);
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

  // ── Year-group calibration ──────────────────────────────────────────────────
  // Parse the year number from strings like "Year 1", "Year 5", "Year 10", "Year 13"
  const is11Plus = (params.yearGroup || "").toLowerCase().includes("11+") || (params.yearGroup || "").toLowerCase().includes("eleven plus");
  const yearNum = is11Plus ? 6 : (parseInt((params.yearGroup || "").replace(/[^0-9]/g, ""), 10) || 7);

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
  const exampleGuide =
    yearNum <= 2  ? "Worked example: Very simple, 2–3 steps maximum. Use pictures or number lines if relevant." :
    yearNum <= 6  ? "Worked example: Clear 3–4 step example. Use diagrams or visual aids where helpful. Annotate each step." :
    yearNum <= 9  ? "Worked example: Detailed 4–6 step example showing full method. Annotate key steps. Include common mistakes to avoid." :
    yearNum <= 11 ? "Worked example: Full exam-style worked solution. Show all method marks. Include examiner tips." :
                   "Worked example: A-Level standard worked solution. Show all steps, justify each stage, reference relevant theory.";

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

  const blockInstructions: Record<string, string> = {
    TRUE_FALSE:         "Write exactly 4 numbered statements (1. 2. 3. 4.), each ending with TRUE or FALSE on the same line. Exactly 2 must be TRUE and 2 must be FALSE. Example: '1. Water boils at 100°C. TRUE'",
    MCQ:                "One question stem, then options: 'A  option' 'B  option' 'C  option' 'D  option' on separate lines. Only ONE is correct.",
    GAP_FILL:           `One paragraph 40-60 words with 5-7 blanks as _____. Next line: 'WORD BANK: word1 | word2 | word3 | word4 | word5 | word6 | word7'${isMaths ? '. MATHS GAP FILL CRITICAL RULE: Write ALL numbers, expressions and symbols as PLAIN TEXT in the gap fill paragraph (e.g. "x squared", "square root of 16", "three-quarters", "2x + 3") — do NOT use LaTeX \\\\(...\\\\) delimiters inside gap fill paragraphs because they render as raw text and break the layout. Reserve LaTeX ONLY for Worked Examples and calculation questions.' : ''}`,
    ORDERING:           "6 items each on its own line starting with ☐. Instruction: 'Number the boxes 1–6 to show the correct order.'",
    MATCHING:           "5 pairs. Each line: '1. [term] ←→ [definition]'. Pairs must be shuffled (term order ≠ definition order).",
    SHORT_ANSWER:       `One focused question. Mark allocation in brackets: [X marks]. No answer given — student writes it.${isMaths ? ' MATHS SHORT ANSWER RULE: Must be a numerical/calculation question — show working space. Do NOT ask students to "explain", "describe" or "discuss" in maths short answer questions. Ask them to calculate, find, solve, or show working.' : ''}`,
    TABLE:              "Markdown table with | separators. 3-4 columns. 4-5 rows. Blank cells use '...........' for students to fill in.",
    ERROR_CORRECTION:   "Present a worked solution with a deliberate mistake — choose an error that is realistic and topic-specific (wrong formula, arithmetic slip, incorrect unit, missed step). Format exactly:\n'Worked Answer\n[step 1]\n[step 2 — contains the error]\n[step 3 if needed]\n\nMistake\n[teacher-only: describe the exact error]\n\nTask\n1. Identify the mistake\n2. Explain why it is wrong\n3. Write the correct answer'\nIMPORTANT: The error must be plausible — something a real student would do. Do NOT make it trivially obvious. Use layout tag: error_correction.",
    RANKING:            "Present 4–6 items that can be meaningfully ordered by a clear criterion relevant to the topic. Format exactly:\n'Rank these from [highest/strongest/fastest/most] to [lowest/weakest/slowest/least]:\n- [item A]\n- [item B]\n- [item C]\n- [item D]\n\nExplain your reasoning:'\nThe criterion must be scientifically/factually correct and unambiguous. Do NOT use ranking for subjective opinions. Use layout tag: ranking.",
    WHAT_CHANGED:       "Present a before/after or cause/effect comparison that is directly relevant to the topic. Format exactly:\n'Scenario A\n[describe the initial state clearly]\n\nScenario B\n[describe the changed state — change exactly ONE variable]\n\nTask\n1. What changed between A and B?\n2. Why did this happen? (use subject vocabulary)\n3. What effect does this have on [relevant outcome]?'\nThe change must be scientifically/factually grounded. Use layout tag: what_changed.",
    CONSTRAINT_PROBLEM: "Present a design or problem-solving task with 2–4 specific constraints that require genuine understanding of the topic. Format exactly:\n'Goal\n[clear task description — what must be achieved]\n\nConstraints\n- [rule 1 — must be topic-specific]\n- [rule 2]\n- [rule 3]\n\nOutput\nShow your working / draw your solution below:'\nConstraints must be non-trivial and require topic knowledge to satisfy. Do NOT use for pure recall. Use layout tag: constraint_problem.",
  };

  const variantA = SECTION_A_VARIANTS[variantIndex];
  const variantB = SECTION_B_VARIANTS[variantIndex];

  const sectionAPrompt = `Section A must contain exactly 3 blocks separated by a blank line:
BLOCK 1 — ${blockInstructions[variantA[0]]}
BLOCK 2 — ${blockInstructions[variantA[1]]}
BLOCK 3 — ${blockInstructions[variantA[2]]}`;

  const sectionBPrompt = `Section B must contain exactly 3 blocks separated by a blank line:
BLOCK 1 — ${blockInstructions[variantB[0]]}
BLOCK 2 — ${blockInstructions[variantB[1]]}
BLOCK 3 — ${blockInstructions[variantB[2]]}`;

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
    : `You are an expert GCSE/curriculum worksheet designer creating a complete, print-ready, professionally structured student worksheet AND matching teacher answer key.

⚠️ CRITICAL FORMAT RULES — THESE OVERRIDE EVERYTHING ELSE:

SUBJECT TYPE: ${isSTEM ? 'STEM' : 'HUMANITIES'}

SECTION 1 — RECALL (Q1–Q3):
${sectionAPrompt}

SECTION 2 — UNDERSTANDING (Q4–Q6):
  Q4 — VISUAL/DIAGRAM ACTIVITY [5 marks]: Generate a TOPIC-SPECIFIC diagram for "${params.topic}".

DIAGRAM RULES — MANDATORY:
The diagram type MUST match the specific topic. Choose the BEST type from:
- "labeled" → structures (cells, organs, apparatus), character webs (literature), geographic features, theme maps
- "circuit" → ONLY for electricity/circuits topics (include "layout": "series" or "parallel")
- "flow" → processes, timelines, sequences, cause-effect chains, algorithms
- "cycle" → repeating processes (water cycle, rock cycle, nitrogen cycle, life cycles)
- "number-line" → fractions, decimals, ordering, place value (include "start", "end", "marked")
- "bar" → data/statistics questions (include "bars" array with real data, "xLabel", "yLabel")
- "axes" → coordinate geometry, graph plotting (include "xLabel", "yLabel")

CRITICAL: Every label, step, and title MUST use REAL terms specific to "${params.topic}".
For literature: use actual character names, themes, or techniques from the text.
For science: use correct scientific terminology for the specific process/structure.
For maths: use appropriate numerical values matching the concept.
For history: use real events, dates, or figures.

Output format: [[DIAGRAM:{"type":"...","title":"...","labels":[...]}]]
NEVER output a diagram with missing required fields. x/y values: 5-95 range. Max 8 labels.
NEVER use generic placeholders like "Label 1" or "Step 1" — use real topic-specific terms.
Show the diagram with questions about it underneath or beside it. Students answer questions ABOUT the diagram (identify, explain, apply) — do NOT ask them to label numbered blanks on the diagram itself. Format: diagram on left/top, sub-questions (a)(b)(c) on right/below with answer lines.
  Q5 — EXTRACT/STIMULUS RESPONSE [5 marks]: ${isSTEM ? 'Provide a scenario or data set (readings from an experiment, a word problem). Ask sub-questions: (a) Identify the relevant formula/law [1 mark] (b) Full worked calculation showing method [2 marks] (c) Explain what the result means in context [2 marks]' : 'Provide a 4–8 line extract from the primary text. Label with Act/Chapter/Section and speaker. Ask: (a) Identify ONE language/literary technique [1 mark] (b) What does this reveal about character/theme/author intent? [2 marks] (c) What does the key image/phrase/symbol represent? [2 marks]'}
  Q6 — SEQUENCING/STRUCTURED RESPONSE [4 marks]: ${isSTEM ? 'Generate a structured question appropriate to the topic. IMPORTANT: Only use a formula triangle if the topic genuinely has a triangular formula relationship (e.g. speed/distance/time, V=IR, P=IV, pressure=force/area, density=mass/volume). For all other topics, use a method scaffold: present a worked scenario and ask (a) Identify the key rule or principle [1 mark] (b) Apply it to a given scenario with full working [2 marks] (c) State the unit or explain the result [1 mark].' : 'Provide 6 events/plot points/key moments from the topic in a scrambled order. Ask students to number boxes 1–6 in the correct chronological or logical sequence. [3 marks: all correct = 3, 4–5 correct = 2, 2–3 correct = 1]'}

SECTION 3 — APPLICATION & ANALYSIS (Q7–Q9):
${sectionBPrompt}

CHALLENGE QUESTION [${isSTEM ? '8' : '12'} marks]: ${isMaths ? 'Present a challenging multi-step real-world maths problem on ' + '"' + params.topic + '"' + '. ALL parts must be numerical/calculation-based — NO written explanations or prose. (a) Set up the problem and identify the method [1 mark] (b) Perform 2–3 linked calculations showing ALL working [5 marks] (c) Give the final answer with correct units/form and check it [2 marks]. Mark scheme: method marks + accuracy marks only.' : isSTEM ? 'Present a multi-part real-world scenario requiring: (a) Choose and justify an approach/method/circuit/process (b) Perform at least 2–3 linked calculations showing all working (c) Explain what happens under a changed condition. Award: up to 3m for explanation + up to 5m for calculations.' : 'Present a short quotation from the text (3–8 words, with Act/scene reference). Instruction: "Starting with this extract, write about how [author] presents [concept/character/theme]." List what the answer must include. Award: Band 4 (10–12m) / Band 3 (7–9m) / Band 2 (4–6m) / Band 1 (1–3m). Describe each band in one sentence.'}

SELF REFLECTION: Generate a 5-row confidence table (Topic | Not Yet | Getting There | Confident). Each row must be a specific skill relevant to the topic (not generic). Then 3 written reflection prompts. Then an Exit Ticket box.

TEACHER COPY — ANSWER KEY: Provide answers for EVERY question. For Q9 and Challenge: reproduce full level descriptor bands. For STEM: show every step of working. For HUMANITIES: provide suggested quotes and page/act references. End with total mark breakdown: Section 1: Xm | Section 2: Xm | Section 3: Xm | Challenge: Xm | TOTAL: Xm

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

STRICT JSON OUTPUT: Respond with valid JSON only — no markdown, no code blocks. NEVER use HTML tags inside content strings. Use plain text and LaTeX notation only.`;

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
  const hasSend = params.sendNeed && params.sendNeed !== "none" && params.sendNeed !== "none-selected" && params.sendNeed !== "general";
  const sendNote = hasSend ? (() => {
    const sn = params.sendNeed!.toLowerCase();
    // Shared base for all SEND: always chunked, always numbered steps
    const base = `THIS WORKSHEET IS ADAPTED FOR A STUDENT WITH ${params.sendNeed!.toUpperCase()}. Apply ALL of the following SEND rules throughout every section:`;

    if (sn.includes("dyslexia")) return `${base}
(1) Short sentences max 12 words. Bold every key term. Word Bank at top of each section (4–6 terms + definitions).
(2) Every question = ONE sentence. Section A: sentence starter or answer frame per question (e.g. "The answer is ___ because ___"). Step-by-step method box before Section A.
(3) Section B: 'Steps to follow' reminder at top. Answer frames (blanks/tables/starters) for ≥3 questions.
(4) Generous line spacing. Each question on its own line. Tick-box 'I can' reflection.`;

    if (sn.includes("dyscalculia")) return `${base}
(1) ${isMaths ? "Section A: small whole numbers only (1–20). Break every question into sub-steps with blanks: 'Step 1: ___ Step 2: ___ Answer: ___'." : "Use very simple numerical data if numbers appear. Break every task into sub-steps with blanks."}
(2) Key Facts box at top of Section B (formulas, number facts). Partially completed working shown for each question.
(3) Worked example: every arithmetic step shown with WHY annotation. Word problems: 'What do I need to find?' prompt before each.
(4) No timed pressure language. Tick-box reflection with 'Great / OK / Struggling' scale.`;

    if (sn.includes("adhd")) return `${base}
(1) [ ] checkbox next to every question. Max 3 questions in Section A, max 5 in Section B. 'STOP — check your work' after Section A.
(2) Across the worksheet as a whole, use varied question SECTION TYPES (e.g. one calculation section, one fill-in section, one matching section, one true/false section). Do NOT add extra items to any individual section — each section keeps its standard number of questions/statements/options.
(3) Bold the action word in every instruction. Numbered bullet points only — no embedded instructions. Max 5-step worked example.
(4) After the midpoint question in Section B (e.g. after question 3 of 5), insert a standalone line: '🧠 BRAIN BREAK — stand up and stretch for 30 seconds before continuing!'
(5) Challenge labelled 'BONUS — only if you want to!'. Reflection: 'How focused were you today? 1 / 2 / 3 / 4 / 5'.`;

    if (sn.includes("asc") || sn.includes("autism") || sn.includes("asperger")) return `${base}
(1) Literal, unambiguous language only — no idioms or figurative language (write 'calculate the value of x', not 'find x'). One word per concept — never mix synonyms.
(2) Every section starts with 'What you need to do:' box listing exact steps. Fully worked identical example before Section A labelled 'EXAMPLE — follow these exact steps'.
(3) Neutral, factual contexts only — no social/emotional scenarios. Consistent identical layout across every section.
(4) Reflection: structured checklist 'I did: [checkbox] Section A [checkbox] Section B [checkbox] Challenge'.`;

    if (sn.includes("mld") || sn.includes("moderate learning")) return `${base}
(1) KS2 reading level. Short sentences. Fully completed model answer for Question 1. Concrete-pictorial-abstract progression in Section A.
(2) Every Section A question: sentence starter, partial answer, or hint. 'Help Box' at top of Section B (key facts, formulas, vocabulary).
(3) No multi-step problems in Section A. Section B: 2-step problems with sub-parts (a)(b). Worked example: full steps + partially completed second example.
(4) Challenge labelled optional. Tick-box reflection with sentence starters.`;

    if (sn.includes("slcn") || sn.includes("speech") || sn.includes("language") || sn.includes("communication")) return `${base}
(1) Word Bank at start (max 8 terms, plain English definitions). Short sentences, subject-verb-object structure only.
(2) Sentence frame for every question: 'The answer is ___ because ___'. Visual cues alongside every text question.
(3) 'Key Words' reminder at top of Section B. Matching, labelling, or multiple-choice for ≥3 questions. At least 2 visual/diagram-based questions.
(4) Numbered steps in worked example. Bold key action words. Reflection: 'I can ___ . I need to practise ___'.`;

    if (sn.includes("anxiety") || sn.includes("mental health") || sn.includes("semh")) return `${base}
(1) Section A labelled 'Warm-Up — no pressure!'. Section B labelled 'Main Practice — you've got this!'. Positive statement at start of each section.
(2) Replace 'must'/'should'/'need to' with 'try to'/'have a go at'. Challenge labelled 'OPTIONAL BONUS — only if you want to!'.
(3) 'Tip' box in each section. 'Take a break here if you need to' prompt midway. No timed pressure language.
(4) Reflection: 'How are you feeling? Calm / OK / Anxious' check-in. 'I tried...' and 'I found...' sentence starters.`;

    if (sn.includes("eal") || sn.includes("esl") || sn.includes("english as") || sn.includes("additional language")) return `${base}
(1) Bilingual-friendly Word Bank at start. Every subject term defined in plain English. Short sentences, no idioms or UK-specific cultural references.
(2) Sentence frame for every question. 'Key Phrases' box with useful academic language ('The answer is...', 'This shows that...').
(3) At least 2 visual/diagram-based questions. 'Useful Words' reminder in Section B. Bold key instruction words.
(4) Culturally neutral contexts. Minimal writing demands. Sentence starters for reflection.`;

    if (sn.includes("dyspraxia") || sn.includes("dcd") || sn.includes("coordination")) return `${base}
(1) Minimise handwriting. Use tick boxes, circle-the-answer, matching, and fill-in-the-blank formats. Large answer boxes throughout.
(2) Section A: multiple-choice or matching for ≥3 questions. Section B: tables or structured answer frames — no extended writing.
(3) Numbered bullet points for all instructions. Brief worked example steps (bullet points, not paragraphs).
(4) Challenge optional and in a low-writing format (circle correct answer or draw a diagram).`;

    if (sn.includes("vi") || sn.includes("visual impair")) return `${base}
(1) Minimum 18pt equivalent text. Bold all headings. High-contrast formatting. Generous spacing — no cluttered layouts.
(2) Every diagram described in words as well. No diagram-only questions. Text-based alternatives throughout.
(3) Every worked example step written in full text — no reliance on diagrams. Questions numbered prominently.
(4) Large answer spaces. Avoid small print, low-contrast text, or visually complex layouts.`;

    if (sn.includes("hi") || sn.includes("hearing impair") || sn.includes("deaf")) return `${base}
(1) All instructions written in full — no reliance on verbal explanation. Word Bank with all key terms defined.
(2) Diagrams, tables, and visual aids throughout. Every question fully self-contained in writing.
(3) Fully written worked example with clear annotations. No audio-dependent content.
(4) Clear, structured layout easy to navigate independently.`;

    if (sn.includes("pda") || sn.includes("odd")) return `${base}
(1) Replace demands with invitations: 'You might like to try...' not 'Answer the following'. Section A: 'Explore — choose where to start'. Section B: 'Investigate'.
(2) Offer 2 options per question where possible. Challenge: 'Secret Mission — if you choose to accept it'.
(3) 'We' language throughout ('Let's look at...'). 'Take a break here if you need to' prompt midway.
(4) No mandatory language, no timed pressure. Calm, uncluttered layout.`;

    if (sn.includes("tourette")) return `${base}
(1) Use multiple response formats — tick the answer, circle the correct word, fill in the blank, match with a line. Avoid requiring extended handwriting in any single section.
(2) Add natural break points between questions: a short horizontal rule and the text 'Take a breath here if you need to.' after every 3 questions.
(3) Calm, supportive, non-judgmental tone throughout. Remove all timed pressure language ('quickly', 'in 5 minutes', 'hurry'). No loud or urgent language.
(4) Section A: maximum 4 questions with varied formats. Section B: short-answer format only. Challenge: circle or tick format.`;

    if (sn.includes("older") || sn.includes("adult") || sn.includes("ks4") || sn.includes("ks5")) return `${base}
(1) Use adult-appropriate, professional register throughout. Contexts must be real-world, relevant to age 14+: workplace, finance, media, current affairs, health, technology.
(2) No childish language, no primary-school tone. 'Section A — Skills Practice', 'Section B — Application', 'Challenge — Extension Task'. Academic command words (analyse, evaluate, justify, assess).
(3) Include a 'Study Tips' box at the start of Section A with 1-2 exam technique reminders. Worked example in academic style — similar to mark scheme exemplar answers.
(4) Reflection: 'What went well?', 'What do I need to revise further?' — not traffic light circles.`;

    // Default for any other SEND need
    return `${base}
(1) Simple language, short sentences, all technical terms defined. Word Bank at start.
(2) Section A: sentence starter, hint, or partial answer for every question. Section B: 'Key Facts' box at top, varied question types.
(3) Worked example: clearly numbered steps with annotations. Visual supports throughout.
(4) Generous spacing, clear headings, tick-box or sentence-starter reflection.`;
  })() : "";

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
    : ``; // No constraint

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
  const mathsNote = isMaths
    ? `Maths: All questions must be numerical/calculation-based. Use LaTeX for all math expressions: wrap in \\(...\\) e.g. \\(\\dfrac{3}{4}\\), \\(x^{2}\\), \\(\\sqrt{x}\\), \\(\\times\\), \\(\\div\\), \\(\\pi\\). CRITICAL RULES: (1) NEVER use \\text{} or \\mathrm{} — write units as plain text OUTSIDE the math delimiters e.g. "\\(F = ma\\) where F is in N, m in kg, a in m/s²". (2) NEVER write \\textm/s or \\text{m/s} — just write "m/s" as plain text. (3) For chemical formulas use subscript numbers: H₂O, CO₂, H₂SO₄. (4) For scientific notation write e.g. "3 × 10⁻³" or \\(3 \\times 10^{-3}\\).`
    : isScienceOrMaths
    ? `Science: Use LaTeX \\(...\\) for equations e.g. \\(F = ma\\), \\(E = mc^{2}\\), \\(v = u + at\\). CRITICAL RULES: (1) NEVER use \\text{} or \\mathrm{} — write units as plain text outside math e.g. "\\(F = ma\\) where F is in N". (2) Write chemical formulas with subscript numbers: H₂O, CO₂, H₂SO₄, NaCl. (3) For scientific notation write "6.02 × 10²³" or \\(6.02 \\times 10^{23}\\). (4) Units: write as plain text — m/s, m/s², N, kg, J, W, Pa, mol, dm³, cm³, °C, K.`
    : `Use LaTeX \\(...\\) for any math expressions. Write units as plain text (e.g. "25 m/s" not "\\text{m/s}").`;

  // ── SVG Diagram injection note ──────────────────────────────────────────────
  // Subjects where inline diagrams add genuine value
  const diagramSubjects = ["science", "biology", "chemistry", "physics", "geography", "maths", "mathematics", "design", "engineering", "history", "english", "drama", "religious", "re", "rs", "economics", "business", "computing", "ict"];
  const isDiagramSubject = diagramSubjects.some(s => subjectLower.includes(s));
  const isVI = hasSend && !!(params.sendNeed?.toLowerCase().includes("vi") || params.sendNeed?.toLowerCase().includes("visual impair"));

  // ── Dynamic diagram type selection based on subject + topic ─────────────────
  // Comprehensive topic-specific mapping covering all subjects (primary + secondary).
  // New types: venn, timeline, pyramid, fraction-bar.
  // Diagrams are for LABELLING — students see numbered blanks, not answers.
  const getDiagramForTopic = (subject: string, topic: string): { type: string; instruction: string; example: string } => {
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
  };

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
      return `LAYOUT:diagram_subquestions\n${sel.example}\nStudy the diagram above and answer the questions below. [5 marks]\n(a) [Question about a specific feature of the ${params.topic} diagram — e.g. read a value, identify a point, describe a trend]. [1 mark]\n(b) [Question requiring interpretation or calculation using the diagram]. [2 marks]\n(c) [Question asking student to extend, predict or apply the diagram to a new value]. [2 marks]\nANSWERS: (a) [answer] (b) [answer with working] (c) [answer]`;
    }
    return `LAYOUT:diagram_subquestions\n${sel.example}\nStudy the diagram above and answer the questions below. [5 marks]\n(a) [Identify or name a specific part/feature shown in the diagram — 1 mark]\n(b) [Explain what the diagram shows or describe the process/relationship — 2 marks]\n(c) [Apply knowledge: predict, compare or extend what is shown — 2 marks]\nANSWERS: (a) [answer] (b) [answer] (c) [answer]`;
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
  // When SEND is active, rename sections to be less intimidating
  const sendSectionTitles = hasSend ? (() => {
    const sn = params.sendNeed!.toLowerCase();
    if (sn.includes("anxiety") || sn.includes("mental health") || sn.includes("semh"))
      return { sectionA: "Warm-Up — no pressure!", sectionB: "Main Practice — you've got this!", challenge: "OPTIONAL BONUS" };
    if (sn.includes("pda") || sn.includes("odd"))
      return { sectionA: "Explore — choose where to start", sectionB: "Investigate", challenge: "Secret Mission — if you choose to accept it" };
    if (sn.includes("adhd"))
      return { sectionA: "Section A — Quick Start (3 questions)", sectionB: "Section B — Main Practice (5 questions)", challenge: "BONUS — only if you want to!" };
    return { sectionA: "Section A — Guided Practice", sectionB: "Section B — Core Practice", challenge: "Challenge Question" };
  })() : { sectionA: "Section A — Guided Practice", sectionB: "Section B — Core Practice", challenge: "Challenge Question" };

  // ── Exam-style instruction ────────────────────────────────────────────────
  const examStyleNote = params.examStyle
    ? `Exam-style mode: Format like a real ${params.examBoard && params.examBoard !== "none" ? params.examBoard : "GCSE"} paper. Number questions Q1, Q2... with sub-parts (a)(b)(c). Show mark allocations [1 mark]. Use command words. Include answer lines. No worked example section.`
    : "";

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
  const diagramRelevanceNote = isScienceOrMaths
    ? `DIAGRAM REQUIREMENT: For Science and Maths, a diagram MUST be included in Q4. The diagram must match the exact worksheet topic "${params.topic}" and the questions that refer to it. Use the most appropriate diagram type for this specific topic.`
    : `Only include or request a diagram if it is essential to teaching "${params.topic}". The diagram must match the exact worksheet topic and the questions that refer to it. If no exact topic-matching diagram is needed, omit the diagram entirely.`;
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
      'section-a', 'questions', 'section-b', 'section-c', 'self-reflection'
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
    const wantMatch = secs.includes('match');
    // Support both legacy 'questions' and new split section IDs
    const wantQuestions = secs.includes('questions') || secs.includes('section-b');
    const wantSectionA = secs.includes('section-a');
    const wantSectionC = secs.includes('section-c');
    const wantSelfReflection = secs.includes('self-reflection');

    // Retrieve spec-aligned example questions for this topic (if available)
    const specExamples = getSpecQuestions(params.subject, params.topic);

    const structuredSystem = `You are an expert UK teacher creating a professional, print-ready worksheet. You respond with valid raw JSON only — no markdown, no code blocks, no HTML. Every rule below is mandatory.

SUBJECT TYPE: ${isSTEM ? 'STEM' : 'HUMANITIES'}
${isMaths ? 'MATHS RULES: All questions must be numerical/calculation-based ONLY. Never ask students to explain, describe, or write prose. Use LaTeX for all math: wrap in \\(...\\). E.g. \\(\\dfrac{3}{4}\\), \\(x^{2}\\), \\(\\sqrt{x}\\). Write units as plain text outside LaTeX.' : ''}
${readingAgeNote}
${sendNote}
${tierNote}
QUALITY STANDARD: Every question must be fully usable — no placeholders, no ellipses, no unfinished sentences. Use real numbers, real contexts. Textbook quality. Every question must be at the correct curriculum level for ${params.yearGroup || 'the year group'} — GCSE/KS3/KS4 standard as appropriate. Do NOT simplify the academic content or intellectual challenge of questions just because SEND adaptations are applied.
${specExamples ? `\n${specExamples}\n` : ''}
CRITICAL SEND RULE: SEND adaptations affect FORMATTING AND PRESENTATION ONLY — never the academic content or intellectual rigour of questions.
- The actual question content (what is being asked, the numbers used, the concepts tested) must remain at the correct GCSE/curriculum level for ${params.yearGroup || 'the year group'}.
- SEND overlays change HOW questions are presented (font, spacing, scaffolding frames, sentence starters, checkboxes, worked examples) — NOT WHAT is being asked.
- True/False statements must be factually correct curriculum statements at the appropriate level — not simplified to the point of being trivial.
- MCQ options must be plausible distractors at curriculum level — not dumbed-down guesses.
- Gap-fill paragraphs must use correct subject terminology — not replaced with everyday words.
- Short-answer and extended questions must require genuine subject knowledge — not just recall of simple facts.
- NEVER add SEND management instructions ('Complete the task in steps', 'Tick each step', 'Focus on one question', 'Take a break') as question content items.
- SEND scaffolding (sentence starters, answer frames, worked examples) goes in SEPARATE support boxes AROUND the questions — not inside the question text itself.`;

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
        if (dA.imageUrl) diagramAUrl = dA.imageUrl;
        if (dA.svg) diagramASvg = dA.svg;
        if (dA.caption) diagramACaption = dA.caption;
      }
      if (diagBRes.status === 'fulfilled' && diagBRes.value) {
        const dB = diagBRes.value;
        if (dB.imageUrl) diagramBUrl = dB.imageUrl;
        if (dB.svg) diagramBSvg = dB.svg;
        if (dB.caption) diagramBCaption = dB.caption;
      }
    } catch (diagPrefetchErr) {
      console.warn('[Diagram] Pre-fetch failed:', diagPrefetchErr);
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
      structuredSections.push(`{"title": "Key Vocabulary", "type": "vocabulary", "content": "KEY_TERMS:\n[Term 1 — most important term for ${params.topic}] \u2014 [precise, curriculum-accurate definition using subject-specific language appropriate for ${params.yearGroup}]\n[Term 2] \u2014 [precise, curriculum-accurate definition]\n[Term 3] \u2014 [precise, curriculum-accurate definition]\n[Term 4] \u2014 [precise, curriculum-accurate definition]\n[Term 5] \u2014 [precise, curriculum-accurate definition]\nRULE: EXACTLY 5 terms — no more, no fewer. Each definition must be factually accurate and use correct subject terminology."}`);
    }

    // 4. Common Mistakes
    if (wantCommonMistakes) {
      structuredSections.push(`{"title": "Common Mistakes to Avoid", "type": "common-mistakes", "teacherOnly": false, "content": "Watch out for these common errors:\n\nMISTAKE 1: [Name of mistake]\n\u2192 [Explanation of the mistake and how to avoid it]\n\nMISTAKE 2: [Name of mistake]\n\u2192 [Explanation of the mistake and how to avoid it]\n\nMISTAKE 3: [Name of mistake]\n\u2192 [Explanation of the mistake and how to avoid it]"}`);
    }

    // 5. Worked Example
    if (wantWorkedExample) {
      if (isMaths) {
        structuredSections.push(`{"title": "Worked Example", "type": "example", "content": "Study this worked example carefully before attempting the questions.\n\nQuestion: [A specific ${params.topic} problem with real numbers]\n\nStep 1: [First step \u2014 state the method or formula used]\nStep 2: [Substitute values and show calculation]\nStep 3: [Complete the calculation]\nAnswer: [Final answer with correct units/form]\n\n\u2713 Key point: [One sentence explaining the key method or rule]"}`);
      } else {
        structuredSections.push(`{"title": "Worked Example", "type": "example", "content": "Study this example carefully.\n\n[A clear, specific example demonstrating the key concept of ${params.topic}]\n\nStep 1: [First step]\nStep 2: [Second step]\nStep 3: [Third step \u2014 conclusion or result]\n\n\u2713 Key point: [One sentence explaining the main principle]"}`);
      }
    }

    // 6. Diagram A — full-page spread (after Worked Example, before Section A Questions)
    if (wantDiagramA) {
      const diagASection: Record<string, unknown> = {
        title: 'Diagram A',
        type: 'diagram',
        fullPage: true,
        content: diagramACaption,
        caption: diagramACaption,
      };
      if (diagramAUrl) diagASection.imageUrl = diagramAUrl;
      // Note: svg is NOT embedded in the prompt string (too large) — injected post-parse below
      structuredSections.push(JSON.stringify(diagASection));
    }

    // 7. Section A Questions (True/False, MCQ, Word Bank, Match)
    if (wantTrueFalse) {
      structuredSections.push(`{"title": "Section A — True or False", "type": "q-true-false", "marks": 4, "content": "Circle TRUE or FALSE for each statement. [4 marks]\n1. [Statement about ${params.topic} \u2014 TRUE]  TRUE  /  FALSE\n2. [Statement about ${params.topic} \u2014 FALSE]  TRUE  /  FALSE\n3. [Statement about ${params.topic} \u2014 TRUE]  TRUE  /  FALSE\n4. [Statement about ${params.topic} \u2014 FALSE]  TRUE  /  FALSE"}`);
    }

    if (wantMCQ) {
      structuredSections.push(`{"title": "Section A — Multiple Choice", "type": "q-mcq", "marks": 1, "content": "[A specific question about ${params.topic} at ${params.yearGroup} curriculum level — use real subject-specific language] [1 mark]\nA  [plausible incorrect option — a common misconception]\nB  [correct answer \u2014 mark with \u2713 at the end of this line] \u2713\nC  [plausible incorrect option]\nD  [plausible incorrect option]"}`);
    }

    if (wantWordBankGapFill) {
      structuredSections.push(`{"title": "Section A — Word Bank Gap Fill", "type": "q-gap-fill", "marks": 7, "content": "Complete the paragraph using words from the word bank below. [7 marks]\n[Write EXACTLY 7 sentences about ${params.topic}. Each sentence MUST contain exactly ONE blank shown as _____. The blank must replace a key subject term. Do NOT number the blanks. Do NOT put two blanks in one sentence. Result: 7 sentences = 7 blanks. ${isMaths ? 'Write all numbers and expressions as plain text \u2014 no LaTeX here.' : ''} Example format:\nThe _____ is the organelle where photosynthesis occurs.\nPlants absorb _____ from the air through their stomata.\n[continue for 5 more sentences, each with one _____ blank]]\nWORD BANK: [the 7 correct answers in shuffled order, plus 3 plausible distractors \u2014 total EXACTLY 10 words] [word1] | [word2] | [word3] | [word4] | [word5] | [word6] | [word7] | [word8] | [word9] | [word10]\nRULE: EXACTLY 7 sentences, EXACTLY 7 blanks (one per sentence), EXACTLY 10 words in word bank."}`);
    }

    if (wantMatch) {
      structuredSections.push(`{"title": "Section A — Match the Column", "type": "q-matching", "marks": 5, "content": "Draw a line to match each term with its correct definition. [5 marks]\nIMPORTANT: Write CORRECT pairs only — each term paired with its own accurate definition. The renderer will shuffle the definitions column for the student. Do NOT pre-shuffle or swap definitions between terms.\n${isMaths ? '1. [mathematical term from ' + params.topic + '] \u2194 [the accurate definition of THAT specific term — not another term\'s definition]\n2. [mathematical term] \u2194 [the accurate definition of THAT specific term]\n3. [mathematical term] \u2194 [the accurate definition of THAT specific term]\n4. [mathematical term] \u2194 [the accurate definition of THAT specific term]\n5. [mathematical term] \u2194 [the accurate definition of THAT specific term]' : '1. [key term from ' + params.topic + '] \u2194 [the accurate definition of THAT specific term — not another term\'s definition]\n2. [key term] \u2194 [the accurate definition of THAT specific term]\n3. [key term] \u2194 [the accurate definition of THAT specific term]\n4. [key term] \u2194 [the accurate definition of THAT specific term]\n5. [key term] \u2194 [the accurate definition of THAT specific term]'}"}`);
    }

    // 8. Section B Questions — Foundation / Guided Practice
    if (wantSectionA) {
      if (isMaths) {
        structuredSections.push(`{"title": "Section B — Foundation Questions", "type": "q-short-answer", "marks": 8, "content": "Answer all questions. Show all working. [8 marks]\n\n1. [Very straightforward ${params.topic} calculation \u2014 1 step] [1 mark]\n\n2. [Basic ${params.topic} calculation] [1 mark]\n\n3. [${params.topic} calculation with a simple context] [2 marks]\n\n4. [${params.topic} question \u2014 fill in the blank or complete the working] [2 marks]\n\n5. [${params.topic} question \u2014 two steps, scaffolded] [2 marks]"}`);
      } else {
        structuredSections.push(`{"title": "Section B — Foundation Questions", "type": "q-short-answer", "marks": 8, "content": "Answer all questions. [8 marks]\n\n1. [Knowledge recall question about ${params.topic}] [1 mark]\n\n2. [Simple comprehension question about ${params.topic}] [2 marks]\n\n3. [Application question \u2014 apply basic knowledge of ${params.topic}] [2 marks]\n\n4. [Describe or identify question about ${params.topic}] [3 marks]"}`);
      }
    }

    // 9. Diagram B — full-page spread (between Section B and Section C Questions)
    if (wantDiagramB) {
      const diagBSection: Record<string, unknown> = {
        title: 'Diagram B',
        type: 'diagram',
        fullPage: true,
        content: diagramBCaption,
        caption: diagramBCaption,
      };
      if (diagramBUrl) diagBSection.imageUrl = diagramBUrl;
      // Note: svg is NOT embedded in the prompt string (too large) — injected post-parse below
      structuredSections.push(JSON.stringify(diagBSection));
    }

    // 10. Section C Questions — Core Practice
    if (wantQuestions) {
      if (isMaths) {
        structuredSections.push(`{"title": "Section C — Core Practice", "type": "q-extended", "marks": 20, "content": "Answer all questions. Show all working. [20 marks]\n\n1. [Straightforward ${params.topic} calculation \u2014 1 mark] [1 mark]\n\n2. [Slightly harder ${params.topic} calculation \u2014 2 marks] [2 marks]\n\n3. [${params.topic} calculation requiring two steps] [2 marks]\n\n4. [${params.topic} problem with a real-world context] [3 marks]\n\n5. (a) [First part of a multi-part ${params.topic} problem] [2 marks]\n   (b) [Second part \u2014 builds on (a)] [2 marks]\n   (c) [Third part \u2014 applies the result] [2 marks]\n\n6. [${params.topic} problem requiring full method \u2014 show all working] [4 marks]\n\n7. [${params.topic} problem with interpretation or explanation] [4 marks]"}`);
      } else {
        structuredSections.push(`{"title": "Section C — Core Practice", "type": "q-extended", "marks": 20, "content": "Answer all questions. [20 marks]\n\n1. [Knowledge recall question about ${params.topic}] [1 mark]\n\n2. [Comprehension question about ${params.topic}] [2 marks]\n\n3. [Application question \u2014 apply knowledge of ${params.topic} to a given scenario] [3 marks]\n\n4. [Analysis question \u2014 explain or describe an aspect of ${params.topic}] [4 marks]\n\n5. [Evaluation question \u2014 assess or discuss ${params.topic}] [6 marks]\n   Your answer should include:\n   \u2022 [Point 1]\n   \u2022 [Point 2]\n   \u2022 [Point 3]\n\n6. [Extended response question about ${params.topic}] [4 marks]"}`);
      }
    }

    // 11. Challenge Question
    if (wantSectionC) {
      if (isMaths) {
        structuredSections.push(`{"title": "Challenge Question", "type": "challenge", "marks": 8, "content": "Challenge yourself! [8 marks]\n\n1. [Multi-step ${params.topic} problem requiring full method] [3 marks]\n\n2. [${params.topic} problem with a complex real-world context \u2014 show all working] [3 marks]\n\n3. \u2605 Stretch: [A proof, 'show that', or open-ended ${params.topic} problem] [2 marks]"}`);
      } else {
        structuredSections.push(`{"title": "Challenge Question", "type": "challenge", "marks": 8, "content": "Challenge yourself! [8 marks]\n\n1. [Higher-order analysis or evaluation question about ${params.topic}] [4 marks]\n\n2. [Synoptic or cross-topic question linking ${params.topic} to a wider concept] [4 marks]"}`);
      }
    }

    // 12. Self Reflection
    if (wantSelfReflection) {
      structuredSections.push(`{"title": "Self Reflection", "type": "self-reflection", "teacherOnly": false, "content": "SUBTITLE: Review your understanding before moving on.\nCONFIDENCE_TABLE:\n[specific skill/concept 1 from ${params.topic}]\n[specific skill/concept 2 from ${params.topic}]\n[specific skill/concept 3 from ${params.topic}]\n[specific skill/concept 4 from ${params.topic}]\n[specific skill/concept 5 from ${params.topic}]\nWRITTEN_PROMPTS:\nOne concept I feel confident about is ...\nOne area I still need to practise is ...\nA question I still want to ask my teacher is ...\nEXIT_TICKET: Write ONE thing you learned today about ${params.topic} in one sentence:"}`);
    }

    // Always add Teacher Key (teacher only)
    structuredSections.push(`{"title": "Teacher Key", "type": "mark-scheme", "teacherOnly": true, "content": "TEACHER KEY — TEACHER USE ONLY\n\nYou MUST write a complete answer for EVERY question generated above. Do not use placeholders. Follow this format exactly:\n\nRETRIEVAL (if present):\nQ1: [correct answer]\nQ2: [correct answer with mark allocation]\nQ3: [correct answer]\n\nSECTION A — True or False:\n1. [TRUE/FALSE] — [brief explanation]\n2. [TRUE/FALSE] — [brief explanation]\n3. [TRUE/FALSE] — [brief explanation]\n4. [TRUE/FALSE] — [brief explanation]\n\nSECTION A — Multiple Choice:\n[Letter]: [full correct answer text] [1 mark]\n\nSECTION A — Word Bank Gap Fill (in order of blanks):\n1. [word] 2. [word] 3. [word] 4. [word] 5. [word] 6. [word] 7. [word]\n\nSECTION A — Match the Column (correct pairs):\n1. [Term] ↔ [correct definition]\n2. [Term] ↔ [correct definition]\n3. [Term] ↔ [correct definition]\n4. [Term] ↔ [correct definition]\n5. [Term] ↔ [correct definition]\n\nSECTION B — Foundation Questions:\n1. [full model answer] [mark allocation]\n2. [full model answer] [mark allocation]\n3. [full model answer] [mark allocation]\n4. [full model answer] [mark allocation]\n\nSECTION C — Core Practice:\n1. [full model answer] [mark allocation]\n2. [full model answer] [mark allocation]\n3. [full model answer] [mark allocation]\n4. [full model answer] [mark allocation]\n5. [full model answer] [mark allocation]\n6. [full model answer] [mark allocation]\n\nCHALLENGE QUESTION:\n1. [full model answer including any required method/working] [mark allocation]\n2. [full model answer] [mark allocation]\n\nFor extended/essay questions: provide a model answer with key marking points listed (e.g. Award 1 mark for each of: [point 1], [point 2], [point 3]).\n${isMaths ? 'For maths: show full working for every calculation. State the method used. Show substitution and simplification steps.' : 'For science/humanities: state the command word requirement and what a full-mark answer must include.'}"}`);

    const structuredUser = `Create a professional, print-ready worksheet in valid raw JSON only.
Subject: ${params.subject} | Year: ${params.yearGroup} (${phase}) | Topic: ${params.topic} | Difficulty: ${params.difficulty || "mixed"}
${examBoardNote}
${mathsNote}
${topicEnforcementNote}
${dataCompletenessNote}
${params.additionalInstructions ? `\nADDITIONAL REQUIREMENTS (Priority override — must be followed):\n${params.additionalInstructions}\n` : ""}

RULES:
1. Every question must be COMPLETE and fully usable — no placeholders, no "...", no unfinished sentences.
2. Use REAL numbers and REAL contexts — never "a number", always "24", "3.7", "Birmingham".
3. Questions must escalate in difficulty (easiest first, hardest last).
4. ABSOLUTELY NO EMOJIS anywhere in the output.
5. No HTML, no markdown, no code fences in content strings.
6. Each step, question, or item must be on its own line using \n.
${isMaths ? '7. MATHS ONLY: All questions must be numerical/calculation-based. Never ask students to explain, describe, or write prose. Use LaTeX for all math expressions.' : ''}
8. SPEC QUALITY: Every question must be at genuine ${params.yearGroup} exam standard — use real exam command words (describe, explain, evaluate, calculate, state, identify, compare, justify, analyse). Questions must test the actual curriculum content of "${params.topic}" — not generic or trivially easy questions.
9. MCQ RULE: Mark the correct MCQ option with \u2713 at the end of that option line ONLY. Do NOT write "CORRECT:", "NOTE:", or any meta-instruction text in the content string — output ONLY the question and four options.
10. MATCH RULE: Write CORRECT pairs only — each term with its own accurate definition. Do NOT swap or shuffle definitions between terms.
11. MARK SCHEME RULE: The mark scheme section MUST contain a complete, full answer for every single question. No placeholders. Write actual answers.
12. VOCAB RULE: Key Vocabulary must contain EXACTLY 5 terms — no more, no fewer.
13. GAP FILL RULE: The gap fill paragraph MUST contain EXACTLY 7 blanks (shown as _____). Before you finish, count every _____ in your paragraph — if there are fewer than 7, add more sentences until you reach exactly 7. The word bank MUST have EXACTLY 10 words (7 correct answers + 3 distractors).

Return EXACTLY this JSON (raw JSON only, no markdown fences):
{
  "title": "${params.topic} — ${params.yearGroup} ${subjectDisplay} Worksheet",
  "subtitle": "${params.yearGroup} | ${subjectDisplay} | ${params.difficulty || 'Standard'}",
  "sections": [
    ${structuredSections.join(',\n    ')}
  ]
}`;

    const { text: structuredText, provider: structuredProvider } = await callAI(structuredSystem, structuredUser, 6500);
    const structuredCleaned = structuredText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    let structuredJson: any;
    try {
      structuredJson = parseWithFixes(structuredCleaned);
    } catch (_) {
      const repaired = repairTruncatedJson(structuredCleaned);
      if (repaired) {
        try { structuredJson = parseWithFixes(repaired); } catch { /* fall through to legacy path */ }
      }
    }
    if (structuredJson && structuredJson.sections && Array.isArray(structuredJson.sections) && structuredJson.sections.length > 0) {
      // Strip asterisks from all content
      structuredJson.sections = structuredJson.sections.map((s: any) => ({
        ...s,
        title: typeof s.title === 'string' ? s.title.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*/g, '').trim() : s.title,
        content: typeof s.content === 'string' ? s.content.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*/g, '').trim() : s.content,
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
      return { ...structuredJson, isAI: true, provider: structuredProvider };
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
    {"title": "Q4 — Visual/Diagram Activity", "type": "q-label-diagram", "content": "${q4DiagramPrompt}", "marks": 5},
    {"title": "Q5 — Calculation Practice", "type": "q-short-answer", "content": "${isMaths ? '[Pure calculation question on ${params.topic}] [5 marks]\n(a) Calculate: [specific numerical problem — show all working]. [2 marks]\n(b) Calculate: [a second numerical problem requiring a different method]. [2 marks]\n(c) Write the answer to part (b) correct to 2 significant figures. [1 mark]' : isSTEM ? '[Scenario or data set related to ${params.topic}] [5 marks]\n(a) Identify the relevant formula or scientific law. [1 mark]\n(b) Show the full calculation with working. [2 marks]\n(c) Explain what the result means in context. [2 marks]' : '[4–8 line extract from text related to ${params.topic}] [5 marks]\n(a) Identify ONE language or literary technique used in this extract. [1 mark]\n(b) What does this reveal about character, theme or author intent? [2 marks]\n(c) What does the key image or symbol represent? [2 marks]'}", "marks": 5},
    {"title": "Q6 — Sequencing/Structured Response", "type": "q-data-table", "content": "${isSTEM ? 'Answer the structured questions below. [4 marks]\n(a) Identify the key rule, law or principle that applies to [specific aspect of ' + params.topic + ']. [1 mark]\n(b) Apply it to this scenario: [specific scenario about ' + params.topic + ']. Show all working. [2 marks]\n(c) State the unit of the answer or explain what the result means. [1 mark]' : 'Number the events 1–6 in the correct order. [3 marks]\n[ ] [event/plot point 1 from ${params.topic}]\n[ ] [event/plot point 2 from ${params.topic}]\n[ ] [event/plot point 3 from ${params.topic}]\n[ ] [event/plot point 4 from ${params.topic}]\n[ ] [event/plot point 5 from ${params.topic}]\n[ ] [event/plot point 6 from ${params.topic}]\n3 marks: all correct | 2 marks: 4–5 correct | 1 mark: 2–3 correct'}", "marks": 4},
    {"title": "Q7 — Problem Solving", "type": "q-extended", "content": "[${isMaths ? 'Multi-step problem: solve a real-life numerical problem about ${params.topic}. No written explanation required — show full numerical working only. [6 marks]' : isSTEM ? 'Compare two cases or explain a key concept in depth' : 'Explain how a recurring motif/technique/theme is used across the text, with reference to at least TWO specific moments'} — ${params.topic}] [6 marks]", "marks": 6},
    {"title": "Q8 — Complete the Table", "type": "q-data-table", "content": "Complete the table below. [8 marks]\n${isSTEM ? '| No. | Scenario | Formula used | Working | Answer with unit |\n|---|---|---|---|---|\n| 1 | [specific calculation problem 1 about ${params.topic}] | ........... | ........... | ........... |\n| 2 | [specific calculation problem 2 about ${params.topic}] | ........... | ........... | ........... |\n| 3 | [specific calculation problem 3 about ${params.topic}] | ........... | ........... | ........... |\n| 4 | [specific calculation problem 4 about ${params.topic}] | ........... | ........... | ........... |' : '| No. | Theme | Key Quote (max 5 words) | Act/Scene/Chapter | Effect on audience/reader |\n|---|---|---|---|---|\n| 1 | [theme 1 from ${params.topic}] | ........... | ........... | ........... |\n| 2 | [theme 2 from ${params.topic}] | ........... | ........... | ........... |\n| 3 | [theme 3 from ${params.topic}] | ........... | ........... | ........... |\n| 4 | [theme 4 from ${params.topic}] | ........... | ........... | ........... |'}", "marks": 8},
    {"title": "Q9 — Extended Calculation", "type": "q-extended", "content": "${isMaths ? '[Multi-step calculation: a challenging problem on ${params.topic} that requires selecting and applying the correct method. No prose — show numerical working only. [8 marks]\nMark scheme: 1m method, 3m correct intermediate steps, 2m correct final answer with units, 2m correct rounding/simplification]' : isSTEM ? '[Higher-order evaluation question: evaluate a claim, design an experiment, or apply concept to unfamiliar context. Include 3 mark levels.] [8 marks]' : '\"[Contested statement about ${params.topic}]\"\nTo what extent do you agree? Use evidence from the text to support your argument. [8 marks]\nLevel 4 (7–8m): Sustained, convincing, nuanced argument with precise embedded evidence.\nLevel 3 (5–6m): Clear argument; analysis of both sides.\nLevel 2 (3–4m): Some relevant points; limited analysis.\nLevel 1 (1–2m): Narrative with little analysis.'}", "marks": 8},
    {"title": "${sendSectionTitles.challenge}", "type": "challenge", "content": "[${challengeGuide}${hasSend ? ' — optional, labelled as bonus' : ''}]"},
    {"title": "Self Reflection", "type": "self-reflection", "teacherOnly": false, "content": "SUBTITLE: Review your understanding before moving on.\nCONFIDENCE_TABLE:\n[specific skill/concept 1 from ${params.topic}]\n[specific skill/concept 2 from ${params.topic}]\n[specific skill/concept 3 from ${params.topic}]\n[specific skill/concept 4 from ${params.topic}]\n[specific skill/concept 5 from ${params.topic}]\nWRITTEN_PROMPTS:\nOne concept I feel confident about is ...\nOne area I still need to practise is ...\nA question I still want to ask my teacher is ...\nEXIT_TICKET: Write ONE thing you learned today about ${params.topic} in one sentence:"},
    {"title": "Teacher Copy — Answer Key", "type": "mark-scheme", "teacherOnly": true, "content": "MARKING GUIDANCE: Accept reasonable alternatives. Award marks for clear reasoning and correct application.\nSECTION 1 — RECALL [12 marks]\nQ1 TRUE/FALSE [4 marks]: [list each statement with TRUE or FALSE answer and brief justification]\nQ2 MCQ [1 mark]: [correct answer letter] — [brief explanation why correct and why distractors are wrong]\nQ3 CLOZE [7 marks]: [list all 7 correct answers in order, numbered 1–7]\nSECTION 2 — UNDERSTANDING [14 marks]\nQ4 DIAGRAM [5 marks]: [list each label with its correct position/component]\nQ5 EXTRACT/STIMULUS [5 marks]: (a) [answer] (b) [answer with mark allocation] (c) [answer with mark allocation]\nQ6 SEQUENCING/STRUCTURED [4 marks]: [correct sequence/answers with mark allocation]\nSECTION 3 — APPLICATION & ANALYSIS [22 marks]\nQ7 EXTENDED [6 marks]: [model answer with level descriptors — Level 1: 1–2m, Level 2: 3–4m, Level 3: 5–6m]\nQ8 TABLE [8 marks]: [complete table with all answers, 2 marks per row]\nQ9 EVALUATIVE [8 marks]: [model answer with level descriptors — Level 1–4 as specified in question]\nCHALLENGE [${isSTEM ? '8' : '12'} marks]: [full mark scheme with band descriptors]\nTOTAL MARKS: Section 1: 12m | Section 2: 14m | Section 3: 22m | Challenge: ${isSTEM ? '8' : '12'}m | TOTAL: ${isSTEM ? '56' : '60'}m"},
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
  const { text, provider } = await callAI(system, user, maxTokensForLength);
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
  if (result.metadata) {
    (result.metadata as any).subject = subjectDisplay;
  }
  // Fix subtitle capitalisation — replace lowercase subject name with capitalised version
  if (result.subtitle && params.subject) {
    const lowerSubject = params.subject.toLowerCase();
    // Replace all occurrences of the lowercase subject in the subtitle with the capitalised version
    result.subtitle = result.subtitle.replace(new RegExp(lowerSubject, 'gi'), subjectDisplay);
  }
  // Fix SEND badge — if sendNeed is 'none' or 'none-selected', hide it
  if (result.metadata) {
    const sn = (result.metadata as any).sendNeed;
    if (!sn || sn === 'none' || sn === 'none-selected' || sn === 'Standard') {
      (result.metadata as any).sendNeed = null;
    }
  }

  // Normalise metadata.adaptations — AI sometimes returns a string instead of an array
  if (result.metadata) {
    const raw = (result.metadata as any).adaptations;
    if (typeof raw === "string") {
      (result.metadata as any).adaptations = raw.length > 0 ? [raw] : [];
    } else if (!Array.isArray(raw)) {
      (result.metadata as any).adaptations = [];
    }
  }

  // ── Section randomisation — shuffle within difficulty tiers, preserve ascending order ──
  // Tiers: intro (non-question) → Section 1 (recall) → Section 2 (understanding) → Section 3 (application) → outro
  // Within each tier, sections are shuffled so each generation has a different order.
  if (result.sections && Array.isArray(result.sections)) {
    const INTRO_TYPES = new Set(['objective', 'prior-knowledge', 'vocabulary', 'common-mistakes', 'example']);
    const TIER1_TYPES = new Set(['q-true-false', 'q-mcq', 'q-gap-fill', 'q-ordering', 'q-matching']);
    const TIER2_TYPES = new Set(['q-label-diagram', 'q-short-answer', 'q-data-table', 'q-circuit', 'q-draw', 'q-graph']);
    const TIER3_TYPES = new Set(['q-extended', 'q-essay']);
    const OUTRO_TYPES = new Set(['challenge', 'self-reflection', 'mark-scheme', 'teacher-notes']);

    const shuffle = <T>(arr: T[]): T[] => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const intro: typeof result.sections = [];
    const tier1: typeof result.sections = [];
    const tier2: typeof result.sections = [];
    const tier3: typeof result.sections = [];
    const outro: typeof result.sections = [];
    const other: typeof result.sections = [];

    for (const s of result.sections) {
      if (INTRO_TYPES.has(s.type)) intro.push(s);
      else if (TIER1_TYPES.has(s.type)) tier1.push(s);
      else if (TIER2_TYPES.has(s.type)) tier2.push(s);
      else if (TIER3_TYPES.has(s.type)) tier3.push(s);
      else if (OUTRO_TYPES.has(s.type)) outro.push(s);
      else other.push(s);
    }

    // Shuffle within each tier (but keep intro and outro in original order)
    result.sections = [
      ...intro,
      ...shuffle(tier1),
      ...shuffle(tier2),
      ...shuffle(tier3),
      ...other,
      ...outro,
    ];

    // Renumber question titles so they remain sequential after shuffling
    // e.g. "Q3 — Cloze Paragraph" becomes "Q1 — Cloze Paragraph" if it ends up first
    let qNum = 1;
    result.sections = result.sections.map(s => {
      if (!INTRO_TYPES.has(s.type) && !OUTRO_TYPES.has(s.type) && !s.teacherOnly) {
        const newTitle = s.title.replace(/^Q\d+\s*[—–-]\s*/, `Q${qNum} — `);
        qNum++;
        return { ...s, title: newTitle };
      }
      return s;
    });
  }

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

  // ── Post-generation quality gate ─────────────────────────────────────────
  // Run lightweight deterministic checks to catch obvious failures.
  // Does NOT make an extra AI call — pure string analysis.
  const qualityIssues: string[] = [];
  const studentSections = result.sections.filter(s => !s.teacherOnly);

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
  }

  // Log quality issues (visible in dev console, doesn't block rendering)
  if (qualityIssues.length > 0) {
    console.warn('[Quality Gate] Issues detected:', qualityIssues);
    (result.metadata as any).qualityIssues = qualityIssues;
  }

  return result;
}

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
};

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
        console.info(`[Diagram] No verified diagram available for "${params.topic}" — diagram section omitted`);
        return null;
      }
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
  } catch (e) {
    console.warn('[Diagram] Server /api/ai/diagram failed:', e);
  }
  // No AI SVG fallback — only verified, legally licensed images from Wikimedia Commons are used.
  // If the server cannot find a diagram, we return null so the diagram section is omitted entirely.
  console.info(`[Diagram] No verified diagram available for "${params.topic}" (${params.subject}) — diagram section omitted`);
  return null;
}

/**
 * Generates a diagram section to be inserted into a worksheet.
 * Returns an AIWorksheetSection with type "diagram" and SVG content.
 */
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
export function parseNaturalLanguageInput(input: string): {
  subject?: string;
  yearGroup?: string;
  topic?: string;
  difficulty?: string;
  sendNeed?: string;
} {
  const text = input.trim().toLowerCase();
  const result: {
    subject?: string;
    yearGroup?: string;
    topic?: string;
    difficulty?: string;
    sendNeed?: string;
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

  // ── Subject extraction ──
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
      "science", "biology", "chemistry", "physics", "atoms", "atom", "cells", "cell",
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
  for (const [id, keywords] of Object.entries(subjectMap)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        result.subject = id;
        break;
      }
    }
    if (result.subject) break;
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
    [/periodic\s+table/i,             "Periodic Table",               "science"],
    [/atomic\s+structure/i,           "Atomic Structure",             "science"],
    [/covalent\s+bond/i,              "Covalent Bonding",             "science"],
    [/ionic\s+bond/i,                 "Ionic Bonding",                "science"],
    [/natural\s+selection/i,          "Natural Selection",            "science"],
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
    const scienceKeywords = ["cell","dna","evolution","photosynthesis","respiration","atom","molecule","element","compound","reaction","force","energy","wave","electricity","magnetism","circuit","periodic","osmosis","enzyme","organ","system","genetics","ecology","climate","particle","nuclear","acid","alkali","bonding","titration","electrolysis"];
    const historyKeywords = ["war","revolution","empire","tudor","victorian","roman","medieval","cold war","slavery","holocaust","civil","industrial","world war","henry","elizabeth","parliament","democracy","monarch"];
    const geographyKeywords = ["river","volcano","earthquake","climate","weather","tectonic","biome","rainforest","urbanisation","globalisation","migration","coast","glacier","population","development","map","landform","erosion","flood"];
    if (mathKeywords.some(k => topicLower.includes(k))) result.subject = "mathematics";
    else if (scienceKeywords.some(k => topicLower.includes(k))) result.subject = "science";
    else if (historyKeywords.some(k => topicLower.includes(k))) result.subject = "history";
    else if (geographyKeywords.some(k => topicLower.includes(k))) result.subject = "geography";
    else result.subject = "english"; // sensible fallback
  }

  // If we have a subject but no topic, use a sensible default topic for the subject
  if (result.subject && !result.topic) {
    const defaultTopics: Record<string, string> = {
      mathematics: "Number", english: "Reading Comprehension", science: "Cells",
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
