/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary — unauthorised copying, modification, or distribution is strictly prohibited.
 *
 * Multi-provider AI engine for Adaptly.
 * Priority order: Groq → Gemini → OpenRouter → OpenAI → Local fallback
 * API keys stored in localStorage so users can update without redeploying.
 */

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
    // Include the JWT token from localStorage in the Authorization header.
    // The server's requireAuth middleware reads from req.headers.authorization first.
    // Without this header the request returns 401 and AI generation silently fails.
    const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('send_token') : null;
    const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (storedToken) reqHeaders["Authorization"] = `Bearer ${storedToken}`;
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
    if (res.status === 401 || res.status === 403) {
      const errData = await res.json().catch(() => ({})) as any;
      // Clear the stale token so the user gets redirected to login
      if (typeof localStorage !== 'undefined') localStorage.removeItem('send_token');
      const msg = errData?.error || (res.status === 401 ? 'Session expired. Please log in again.' : 'Access denied.');
      // Redirect to login after a short delay so any toast can show
      setTimeout(() => { window.location.href = '/login'; }, 2000);
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
      rmJson = JSON.parse(rmCleaned);
    } catch (_) {
      const repaired = repairTruncatedJson(rmCleaned);
      if (repaired) {
        try { rmJson = JSON.parse(repaired); } catch { throw new Error('Revision mat JSON parse failed'); }
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

  // ── Question type pools (always increasing difficulty: Recall → Understanding → Application) ──
  // Each section picks 3 types at random so every worksheet looks different.
  // Types within each pool are at the same cognitive level — randomising them keeps
  // variety without ever mixing difficulty levels or repeating the same layout.

  type QType = string;

  // Recall pool — Knowledge Check (Section A): factual retrieval, recognition, reproduction
  const RECALL_POOL: QType[] = [
    "TRUE_FALSE", "MCQ", "GAP_FILL", "ORDERING", "MATCHING",
    "SHORT_ANSWER",
  ];
  // Understanding/Application pool — Section B: analysis, application, extended thinking
  const APPLICATION_POOL: QType[] = [
    "SHORT_ANSWER", "TABLE", "ORDERING", "MATCHING",
    "SHORT_ANSWER", "TABLE",  // weighted toward these for variety
  ];

  // Add relevant advanced types to the appropriate pool (never forced; only when topic fits)
  if (isRelevant.ERROR_CORRECTION) RECALL_POOL.push("ERROR_CORRECTION");
  if (isRelevant.RANKING) RECALL_POOL.push("RANKING");
  if (isRelevant.WHAT_CHANGED) APPLICATION_POOL.push("WHAT_CHANGED");
  if (isRelevant.CONSTRAINT_PROBLEM) APPLICATION_POOL.push("CONSTRAINT_PROBLEM");

  // Pick 3 unique types from a pool at random (Fisher-Yates on a copy, take first 3)
  function pickTypes(pool: QType[], count: number): QType[] {
    const arr = [...pool];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Deduplicate while preserving order
    const seen = new Set<string>();
    const result: QType[] = [];
    for (const t of arr) {
      if (!seen.has(t) && result.length < count) {
        seen.add(t);
        result.push(t);
      }
    }
    // Pad with fallbacks if not enough unique types
    const fallbacks = ["SHORT_ANSWER", "TABLE", "MCQ", "GAP_FILL", "TRUE_FALSE"];
    for (const f of fallbacks) {
      if (result.length >= count) break;
      if (!seen.has(f)) { seen.add(f); result.push(f); }
    }
    return result;
  }

  const [typeA1, typeA2, typeA3] = pickTypes(RECALL_POOL, 3);
  const [typeB1, typeB2, typeB3] = pickTypes(APPLICATION_POOL, 3);


  const blockInstructions: Record<string, string> = {
    TRUE_FALSE:         "Write exactly 4 numbered statements (1. 2. 3. 4.), each ending with TRUE or FALSE on the same line. Exactly 2 must be TRUE and 2 must be FALSE. Example: '1. Water boils at 100°C. TRUE'",
    MCQ:                "One question stem, then options: 'A  option' 'B  option' 'C  option' 'D  option' on separate lines. Only ONE is correct.",
    GAP_FILL:           "One paragraph 40-60 words with 5-7 blanks as _____. Next line: 'WORD BANK: word1 | word2 | word3 | word4 | word5 | word6 | word7'",
    ORDERING:           "6 items each on its own line starting with ☐. Instruction: 'Number the boxes 1–6 to show the correct order.'",
    MATCHING:           "5 pairs. Each line: '1. [term] ←→ [definition]'. Pairs must be shuffled (term order ≠ definition order).",
    SHORT_ANSWER:       "One focused question. Mark allocation in brackets: [X marks]. No answer given — student writes it.",
    TABLE:              "Markdown table with | separators. 3-4 columns. 4-5 rows. Blank cells use '...........' for students to fill in.",
    ERROR_CORRECTION:   "Present a worked solution with a deliberate mistake — choose an error that is realistic and topic-specific (wrong formula, arithmetic slip, incorrect unit, missed step). Format exactly:\n'Worked Answer\n[step 1]\n[step 2 — contains the error]\n[step 3 if needed]\n\nMistake\n[teacher-only: describe the exact error]\n\nTask\n1. Identify the mistake\n2. Explain why it is wrong\n3. Write the correct answer'\nIMPORTANT: The error must be plausible — something a real student would do. Do NOT make it trivially obvious. Use layout tag: error_correction.",
    RANKING:            "Present 4–6 items that can be meaningfully ordered by a clear criterion relevant to the topic. Format exactly:\n'Rank these from [highest/strongest/fastest/most] to [lowest/weakest/slowest/least]:\n- [item A]\n- [item B]\n- [item C]\n- [item D]\n\nExplain your reasoning:'\nThe criterion must be scientifically/factually correct and unambiguous. Do NOT use ranking for subjective opinions. Use layout tag: ranking.",
    WHAT_CHANGED:       "Present a before/after or cause/effect comparison that is directly relevant to the topic. Format exactly:\n'Scenario A\n[describe the initial state clearly]\n\nScenario B\n[describe the changed state — change exactly ONE variable]\n\nTask\n1. What changed between A and B?\n2. Why did this happen? (use subject vocabulary)\n3. What effect does this have on [relevant outcome]?'\nThe change must be scientifically/factually grounded. Use layout tag: what_changed.",
    CONSTRAINT_PROBLEM: "Present a design or problem-solving task with 2–4 specific constraints that require genuine understanding of the topic. Format exactly:\n'Goal\n[clear task description — what must be achieved]\n\nConstraints\n- [rule 1 — must be topic-specific]\n- [rule 2]\n- [rule 3]\n\nOutput\nShow your working / draw your solution below:'\nConstraints must be non-trivial and require topic knowledge to satisfy. Do NOT use for pure recall. Use layout tag: constraint_problem.",
  };

  const sectionAPrompt = `SECTION 1 — KNOWLEDGE CHECK: These 3 question blocks test recall and recognition.
Questions MUST increase in difficulty across the 3 blocks (easiest → hardest recall).
BLOCK 1 — ${blockInstructions[typeA1]}
BLOCK 2 — ${blockInstructions[typeA2]}
BLOCK 3 — ${blockInstructions[typeA3]}`;

  const sectionBPrompt = `SECTION 3 — APPLICATION & ANALYSIS: These 3 question blocks test deeper understanding.
Questions MUST increase in difficulty (harder than Section 1).
BLOCK 1 — ${blockInstructions[typeB1]}
BLOCK 2 — ${blockInstructions[typeB2]}
BLOCK 3 — ${blockInstructions[typeB3]}`;

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

SECTION 1 — KNOWLEDGE CHECK (Q1–Q3):
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
Ask students to label/identify parts. Include LABELS: and ANSWERS: lines.
  Q5 — EXTRACT/STIMULUS RESPONSE [5 marks]: ${isSTEM ? 'Provide a scenario or data set (readings from an experiment, a word problem). Ask sub-questions: (a) Identify the relevant formula/law [1 mark] (b) Full worked calculation showing method [2 marks] (c) Explain what the result means in context [2 marks]' : 'Provide a 4–8 line extract from the primary text. Label with Act/Chapter/Section and speaker. Ask: (a) Identify ONE language/literary technique [1 mark] (b) What does this reveal about character/theme/author intent? [2 marks] (c) What does the key image/phrase/symbol represent? [2 marks]'}
  Q6 — SEQUENCING/STRUCTURED RESPONSE [4 marks]: ${isSTEM ? 'Generate a structured question appropriate to the topic. IMPORTANT: Only use a formula triangle if the topic genuinely has a triangular formula relationship (e.g. speed/distance/time, V=IR, P=IV, pressure=force/area, density=mass/volume). For all other topics, use a method scaffold: present a worked scenario and ask (a) Identify the key rule or principle [1 mark] (b) Apply it to a given scenario with full working [2 marks] (c) State the unit or explain the result [1 mark].' : 'Provide 6 events/plot points/key moments from the topic in a scrambled order. Ask students to number boxes 1–6 in the correct chronological or logical sequence. [3 marks: all correct = 3, 4–5 correct = 2, 2–3 correct = 1]'}

SECTION 3 — APPLICATION & ANALYSIS (Q7–Q9):
${sectionBPrompt}

CHALLENGE QUESTION [${isSTEM ? '8' : '12'} marks]: ${isSTEM ? 'Present a multi-part real-world scenario requiring: (a) Choose and justify an approach/method/circuit/process (b) Perform at least 2–3 linked calculations showing all working (c) Explain what happens under a changed condition. Award: up to 3m for explanation + up to 5m for calculations.' : 'Present a short quotation from the text (3–8 words, with Act/scene reference). Instruction: "Starting with this extract, write about how [author] presents [concept/character/theme]." List what the answer must include. Award: Band 4 (10–12m) / Band 3 (7–9m) / Band 2 (4–6m) / Band 1 (1–3m). Describe each band in one sentence.'}

SELF REFLECTION: Generate a 5-row confidence table (Topic | Not Yet | Getting There | Confident). Each row must be a specific skill relevant to the topic (not generic). Then 3 written reflection prompts. Then an Exit Ticket box.

TEACHER COPY — ANSWER KEY: Provide answers for EVERY question. For Q9 and Challenge: reproduce full level descriptor bands. For STEM: show every step of working. For HUMANITIES: provide suggested quotes and page/act references. End with total mark breakdown: Section 1: Xm | Section 2: Xm | Section 3: Xm | Challenge: Xm | TOTAL: Xm

DO NOT include a Reminder Box. DO NOT deviate from these formats. ABSOLUTELY NO EMOJIS in student-facing content.
Topic: "${params.topic}" | Year: ${params.yearGroup} (${phase})

QUALITY STANDARDS — produce professional, high-quality educational content:
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
(2) Vary question types: calculation, fill-in, matching, true/false. 'BRAIN BREAK — stand up and stretch!' prompt midway through Section B.
(3) Bold the action word in every instruction. Numbered bullet points only — no embedded instructions. Max 5-step worked example.
(4) Challenge labelled 'BONUS — only if you want to!'. Reflection: 'How focused were you today? 1 / 2 / 3 / 4 / 5'.`;

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

  // Diagrams auto-generate for relevant subjects — no toggle needed
  const svgDiagramNote = (isDiagramSubject && !isVI && !params.examStyle)
    ? `SVG DIAGRAM INSTRUCTION — MANDATORY FOR Q4:
You MUST embed exactly ONE [[DIAGRAM:{...}]] marker inside Q4's "content" field.
Diagram type pre-selected for this topic: "${diagramSelection.type}"
${diagramSelection.instruction}
Every label, step, event, or level MUST use REAL terms from "${params.topic}" — NEVER generic placeholders like "Label 1", "Step 1", "Date 1", "Level 1".
Use this template and replace ALL values with real topic-specific content:
${diagramSelection.example}
After the diagram marker, add these two lines:
LABELS: [correct label 1 | label 2 | label 3 | ...]
ANSWERS: [correct answer 1 | answer 2 | answer 3 | ...]
Rules: x/y are percentages (5–95). Title must name the specific topic.`
    : ``;  const diagramRelevanceNote = isDiagramSubject ? `DIAGRAM RULE: The [[DIAGRAM:{...}]] in Q4 MUST use real terms from "${params.topic}". Never use placeholder text. The diagram type has been pre-selected: use "${diagramSelection.type}".` : ``;