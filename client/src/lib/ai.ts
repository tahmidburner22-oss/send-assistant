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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
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
    const timeoutMs = 180000; // 180 seconds — allows for Railway cold starts, complex worksheets, and SEND differentiation prompts
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
    // If server says no keys configured, throw immediately — don't silently fall back
    if (res.status === 503) {
      const errData = await res.json().catch(() => ({})) as any;
      if (errData?.noKeysConfigured) {
        throw new Error(errData.error || "No AI provider keys configured for your school. Please go to Settings → AI Providers to add your API keys.");
      }
    }
    // Fall through to client keys only on auth errors
    if (res.status !== 401 && res.status !== 403) {
      const errText = await res.text().catch(() => "");
      console.warn(`[Adaptly AI] Server error ${res.status}:`, errText.slice(0, 200));
    }
  } catch (serverErr: any) {
    // Re-throw no-keys-configured errors — these need to reach the UI
    if (serverErr?.message?.includes("No AI provider keys configured") || serverErr?.message?.includes("Settings → AI Providers")) {
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
  generateDiagram?: boolean;
  diagramType?: string;
  worksheetLength?: string;
  introOnly?: boolean; // When true, only generate intro sections (objectives, vocab, worked example) — used for hybrid exam mode
  recallTopic?: string; // When set, prepend 2-3 recall questions on this previous topic at the start of the worksheet
  targetPages?: number; // Target number of printed A4 pages (any positive integer, 0 = auto)
  readingAge?: number; // Target reading age (5–17) — controls vocabulary and sentence complexity
}): Promise<AIWorksheetResult> {

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

  const system = `You are an experienced UK teacher creating a classroom worksheet for ${params.yearGroup} (${phase}). Topic: "${params.topic}". All content must be exclusively about this topic. Calibrate language and difficulty for the year group. Respond with valid JSON only — no markdown, no code blocks. CRITICAL: Never use HTML tags (e.g. <span>, <div>, <p>, style= attributes) inside section content strings. Use plain text and LaTeX notation only (e.g. \\frac{1}{2}, \\sqrt{x}, x^2). Do not use color codes or inline styles.`;

  const examBoardNote = params.examBoard && params.examBoard !== "N/A" && params.examBoard !== "none"
    ? `Exam board: ${params.examBoard}.`
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
(1) Section A: small whole numbers only (1–20). Break every question into sub-steps with blanks: "Step 1: ___ Step 2: ___ Answer: ___".
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
      ? `Length: 10 min. 5–8 questions total. No challenge section.`
      : lengthMins >= 60
      ? `Length: 60 min. 30–40 questions total. Full guided (8–10 q), independent (15–20 q), challenge (4–6 q), extension.`
      : `Length: 30 min. 15–20 questions total: guided (4–5 q), independent (8–10 q), one challenge.`;

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

  // ── Maths-specific instruction ────────────────────────────────────────────
  const isMaths = params.subject.toLowerCase().includes("math");
  const isScienceOrMaths = isMaths || params.subject.toLowerCase().includes('science') || params.subject.toLowerCase().includes('physics') || params.subject.toLowerCase().includes('chemistry') || params.subject.toLowerCase().includes('biology');
  const mathsNote = isMaths
    ? `Maths: All questions must be numerical/calculation-based. Use LaTeX for all math expressions: wrap in \\(...\\) e.g. \\(\\dfrac{3}{4}\\), \\(x^{2}\\), \\(\\sqrt{x}\\), \\(\\times\\), \\(\\div\\), \\(\\pi\\). CRITICAL RULES: (1) NEVER use \\text{} or \\mathrm{} — write units as plain text OUTSIDE the math delimiters e.g. "\\(F = ma\\) where F is in N, m in kg, a in m/s²". (2) NEVER write \\textm/s or \\text{m/s} — just write "m/s" as plain text. (3) For chemical formulas use subscript numbers: H₂O, CO₂, H₂SO₄. (4) For scientific notation write e.g. "3 × 10⁻³" or \\(3 \\times 10^{-3}\\).`
    : isScienceOrMaths
    ? `Science: Use LaTeX \\(...\\) for equations e.g. \\(F = ma\\), \\(E = mc^{2}\\), \\(v = u + at\\). CRITICAL RULES: (1) NEVER use \\text{} or \\mathrm{} — write units as plain text outside math e.g. "\\(F = ma\\) where F is in N". (2) Write chemical formulas with subscript numbers: H₂O, CO₂, H₂SO₄, NaCl. (3) For scientific notation write "6.02 × 10²³" or \\(6.02 \\times 10^{23}\\). (4) Units: write as plain text — m/s, m/s², N, kg, J, W, Pa, mol, dm³, cm³, °C, K.`
    : `Use LaTeX \\(...\\) for any math expressions. Write units as plain text (e.g. "25 m/s" not "\\text{m/s}").`;

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

  // ── Reminder box note ─────────────────────────────────────────────────────
  const reminderBoxNote = !params.examStyle
    ? `Include a Reminder Box with exactly 3 short numbered steps (max 15 words each) explaining the core method for "${params.topic}".`
    : "";

  // ── Formula rules (topic-specific only) ──────────────────────────────────
  const formulaNote = `Only include a Key Formulas section if the topic "${params.topic}" genuinely requires a formula. Omit it if no formula is needed.`;

  // ── Common mistakes note ────────────────────────────────────────────────────
  const commonMistakesNote = !params.examStyle
    ? `In Teacher Notes, list 3–4 common mistakes students make with "${params.topic}". Include 1 misconception question in Section B showing wrong working for students to correct.`
    : "";

  // ── Topic enforcement note ─────────────────────────────────────────────────
  const topicEnforcementNote = `Every question, example, vocabulary term, and any diagram must be about "${params.topic}" only.`;
  const dataCompletenessNote = `Every question must be fully usable as written. Do not use placeholders, ellipses, missing values, unfinished lists, or references to unseen data. If a statistics question uses a table, survey, graph, grouped frequency table, histogram, cumulative frequency graph, box plot, or chart, include the complete numeric data needed to answer it directly in the worksheet text.`;
  const diagramRelevanceNote = `Only include or request a diagram if it is essential to teaching "${params.topic}". The diagram must match the exact worksheet topic and the questions that refer to it. If no exact topic-matching diagram is needed, omit the diagram entirely.`;
  const vocabularyCapNote = `Key Vocabulary must contain at most 5 items.`;

  const recallNote = params.recallTopic ? `RECALL SECTION REQUIRED: The first section of this worksheet must be titled "Recall — ${params.recallTopic}" and contain exactly 2-3 short retrieval questions on the PREVIOUS topic "${params.recallTopic}". These questions should be quick and accessible, designed to activate prior knowledge before the main topic. Do NOT mix recall questions with the main topic questions.` : '';

  const user = `Create one printable worksheet in valid raw JSON only.
Subject: ${params.subject} | Year: ${params.yearGroup} (${phase}) | Topic: ${params.topic} | Difficulty: ${params.difficulty || "mixed"}
${examBoardNote} ${lengthNote}
${pageCountNote}
${readingAgeNote}
${mathsNote}
${sendNote}
${tierNote}
${examStyleNote}
${formulaNote} ${reminderBoxNote} ${wordProblemsNote} ${commonMistakesNote}
${topicEnforcementNote}
${dataCompletenessNote}
${diagramRelevanceNote}
${vocabularyCapNote}
${recallNote}
${params.additionalInstructions ? `\nPriority override:\n${params.additionalInstructions}\n` : ""}

Structure required:
1. Learning Objectives
2. Key Vocabulary (maximum 5 items)
3. Worked Example
4. Reminder Box
5. ${sendSectionTitles.sectionA}
6. ${sendSectionTitles.sectionB}
7. Section C - Word Problems
8. ${sendSectionTitles.challenge}
9. Reflection
10. Common Mistakes
11. Mark Scheme (teacher only)
12. Teacher Notes (teacher only)
13. SEND Adaptations & Rationale (teacher only when SEND applies)

Formatting rules:
- Each question, step, bullet, or item must be on its own new line using \n.
- No HTML, no markdown, no code fences.
- Keep wording concise and printable.
- If SEND applies, show the adaptations in the pupil-facing sections, not just teacher notes.
- For maths, keep notation clean and readable in print/PDF.
- ABSOLUTELY NO EMOJIS anywhere in the output — not in section content, titles, labels, or any field. Use plain text alternatives only (e.g. use '[ ]' not '✅', use 'Great / OK / Struggling' not emoji scales).

Return EXACTLY this JSON (raw JSON only):
{
  "title": "${params.topic} — ${params.yearGroup} ${subjectDisplay} Worksheet",
  "subtitle": "${params.yearGroup} (${phase}) | ${subjectDisplay} | ${params.examBoard && params.examBoard !== 'none' ? params.examBoard : 'General'} | ${timingGuide}",
  "sections": [
    ${params.recallTopic ? `{"title": "Recall — ${params.recallTopic}", "type": "guided", "content": "2-3 retrieval questions on '${params.recallTopic}'"},` : ''}
    {"title": "Learning Objectives", "type": "objective", "content": "[3 objectives]"},
    {"title": "Key Vocabulary", "type": "vocabulary", "content": "[term | definition, one per line]"},
    ${isMaths && !params.examStyle ? `{"title": "Key Formulas", "type": "example", "content": "[LaTeX formulas or: No formula required]"},` : ''}
    {"title": "Worked Example", "type": "example", "content": "[${exampleGuide}]"}${params.introOnly ? '' : `,
    {"title": "Reminder Box", "type": "reminder-box", "content": "[3 numbered steps]"},
    {"title": "${sendSectionTitles.sectionA}", "type": "guided", "content": "[${hasSend ? 'scaffolded questions with hints/frames — apply ALL SEND rules' : 'guided questions with hints'}]"},
    {"title": "${sendSectionTitles.sectionB}", "type": "independent", "content": "[${hasSend ? 'scaffolded core practice — apply ALL SEND rules' : 'standard questions + 1 misconception question'}]"},
    {"title": "Section C — Word Problems", "type": "word-problems", "content": "[${hasSend ? '2-3 simple word problems — apply SEND language rules' : '3-4 real-life word problems, increasing difficulty'}]"},
    {"title": "${sendSectionTitles.challenge}", "type": "challenge", "content": "[${challengeGuide}${hasSend ? ' — optional, labelled as bonus' : ''}]"},
    {"title": "How Did I Do?", "type": "self-reflection", "teacherOnly": false, "content": "[${hasSend ? 'tick-box or text-scale self-assessment per SEND rules' : '3-4 I can statements + open question'}]"},
    {"title": "Common Mistakes to Avoid", "type": "common-mistakes", "teacherOnly": false, "content": "[3-4 common mistakes]"},
    {"title": "Mark Scheme", "type": "mark-scheme", "teacherOnly": true, "content": "[answers only]"},
    {"title": "Teacher Notes", "type": "teacher-notes", "teacherOnly": true, "content": "[timings, misconceptions, interventions, next topic]"},
    {"title": "SEND Adaptations & Rationale", "type": "teacher-notes", "teacherOnly": true, "content": "${hasSend ? `ADAPTED FOR: ${params.sendNeed!.toUpperCase()}\nADAPTATIONS: [list every specific change made]\nRATIONALE: [3-4 sentences: how ${params.sendNeed} affects learning, SEND Code of Practice, how each adaptation removes a barrier]\nCLASSROOM TIPS: [3-4 practical tips for the teacher]\nIF STUDENT STRUGGLES: [next steps / further scaffolding]` : 'No SEND adaptations — standard worksheet.'}"`}
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

  // Scale token limit with worksheet length — generous limits to prevent JSON truncation
  // Truncated JSON is the #1 cause of the fallback generator being triggered
  // 10min ≈ 2500t, 30min ≈ 5000t, 60min ≈ 7000t
  const maxTokensForLength = params.introOnly ? 2000 : (lengthMins >= 60 ? 7000 : lengthMins <= 10 ? 2500 : 5000);
  const { text, provider } = await callAI(system, user, maxTokensForLength);
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let json: any;

  // Robust JSON parsing with multiple fallback strategies
  const parseWithFixes = (s: string): any => {
    // Pre-process: escape \f (\frac) and \t (\times, \text, \theta) that appear to be LaTeX.
    // JSON treats \f as form feed and \t as tab, but the AI uses them as LaTeX commands.
    const preProcess = (raw: string): string => {
      const latexOnly = new Set(['f', 't']); // Only these two conflict with common LaTeX commands
      const out: string[] = [];
      let inStr = false;
      let i = 0;
      while (i < raw.length) {
        const ch = raw[i];
        if (!inStr) { if (ch === '"') inStr = true; out.push(ch); i++; continue; }
        if (ch === '\\') {
          const next = raw[i + 1];
          const afterNext = raw[i + 2];
          if (next && latexOnly.has(next) && afterNext && /[a-zA-Z]/.test(afterNext)) {
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
    // Process character by character to correctly handle string context
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
        // Inside a JSON string
        if (ch === '\\') {
          const next = raw[i + 1];
          const afterNext3 = raw[i + 2];
          // \f (\frac) and \t (\times) conflict with JSON escapes but are LaTeX commands.
          // Double the backslash when followed by a letter (indicating a LaTeX command).
          const latexConflicts2 = new Set(['f', 't']);
          if (next !== undefined && latexConflicts2.has(next) && afterNext3 && /[a-zA-Z]/.test(afterNext3)) {
            result.push('\\\\');
          } else if (next !== undefined && '"\\/bnrtu'.includes(next)) {
            // Valid JSON escape — keep as-is
            result.push(ch);
          } else {
            // Invalid escape (e.g. LaTeX \( \) \dfrac) — double the backslash
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

    // Strategy 3: extract largest JSON object with regex
    const match = fixed.match(/\{[\s\S]*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch (_) {} }

    throw new Error('all strategies failed');
  };

  try {
    json = parseWithFixes(cleaned);
  } catch (parseErr) {
    console.error("[Adaptly AI] JSON parse failed after all fixes. Raw response:", text.slice(0, 300));
    throw new Error(`AI returned invalid JSON. Raw: ${text.slice(0, 100)}`);
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

  // Optionally inject a diagram — uses server-side /api/ai/diagram with full fallback chain
  // (Wikimedia bank → Wikimedia search → Gemini SVG → GPT-4o SVG)
  if (params.generateDiagram) {
    try {
      const diagramSection = await aiGenerateWorksheetDiagram({
        subject: params.subject,
        topic: params.topic,
        yearGroup: params.yearGroup || 'Year 9',
        sendNeed: params.sendNeed,
      });
      if (diagramSection) {
        // Insert diagram after the worked example section (index 2) or at position 2
        const insertAt = Math.min(2, result.sections.length);
        result.sections = [
          ...result.sections.slice(0, insertAt),
          diagramSection,
          ...result.sections.slice(insertAt),
        ];
        console.info('[Diagram] Injected diagram via server endpoint, provider:', diagramSection.provider);
      }
    } catch (err) {
      console.warn('Diagram injection failed, continuing without diagram:', err);
    }
  }

  return result;
}

// ─── Story generation ────────────────────────────────────────────────────────

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
    const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('send_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;
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
  const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('send_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

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
  const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('send_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

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
  let remaining = text;
  // Remove year group
  remaining = remaining.replace(/year\s*\d{1,2}/gi, "").replace(/y\d{1,2}\b/gi, "").replace(/11\s*\+/g, "").replace(/eleven\s*plus/gi, "");
  // Remove subject keywords
  if (result.subject) {
    const kws = subjectMap[result.subject] || [];
    for (const kw of kws) {
      remaining = remaining.replace(new RegExp(`\\b${kw}\\b`, "gi"), "");
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
    // Capitalize first letter of each word
    result.topic = remaining.replace(/\b\w/g, c => c.toUpperCase());
  }

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

  const system = `You are a UK SEND specialist teacher. Rewrite the worksheet text to match a specific reading age level. CRITICAL: Change ONLY the language complexity, vocabulary, and sentence structure. Do NOT change the academic content, questions, numbers, formulas, or difficulty of the tasks themselves. Return valid JSON only, no markdown code blocks.`;

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

Return JSON array of sections with adjusted language:
[{"title": "...", "content": "...", "type": "...", "teacherOnly": false}]`;

  const { text, provider } = await callAI(system, user, 3000);
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = parseWithFixes(cleaned);
  const adjustedSections = Array.isArray(parsed) ? parsed : sectionsToAdjust;

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
