/**
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
(1) LANGUAGE: Use short sentences (max 12 words). Avoid passive voice. Use active, direct language.
(2) VOCABULARY: Bold every key term on first use. Provide a Word Bank box at the top of each section with 4–6 key words and simple definitions.
(3) QUESTIONS: Each question must be ONE sentence only. No embedded clauses. No double-barrelled questions.
(4) SECTION A — GUIDED PRACTICE: Every question must have a sentence starter or partially completed answer frame. Example: "The answer is ___ because ___". Include a step-by-step method box before Section A.
(5) SECTION B — CORE PRACTICE: Include a 'Steps to follow' reminder at the top. Questions should be shorter than standard. Include answer frames (e.g. blanks, tables, or sentence starters) for at least 3 questions.
(6) WORKED EXAMPLE: Break into numbered micro-steps (max 6 words per step). Use arrows or bullet points to show progression.
(7) LAYOUT: Use generous line spacing. Avoid dense paragraphs. Each question on its own line with plenty of white space below for writing.
(8) REFLECTION: Use tick-box "I can" statements rather than open writing.`;

    if (sn.includes("dyscalculia")) return `${base}
(1) NUMBERS: Use only small, familiar whole numbers in Section A (e.g. 1–20). Gradually increase in Section B. Avoid decimals in Section A.
(2) VISUAL AIDS: Before every calculation question, include a visual anchor — e.g. a number line reference, a place value chart reminder, or a worked mini-example.
(3) SECTION A — GUIDED PRACTICE: Every question must be broken into sub-steps with blanks. Example: "Step 1: Write the first number ___. Step 2: Add ___ to it. Step 3: The answer is ___."
(4) SECTION B: Include a 'Key Facts' box at the top (e.g. multiplication facts, formula reminders). Questions should have partially completed working shown.
(5) WORKED EXAMPLE: Show every single arithmetic step — no skipping. Annotate each step with WHY (e.g. "We add because we are finding the total").
(6) WORD PROBLEMS: Keep language very simple. Underline the key number words. Provide a 'What do I need to find?' prompt before each problem.
(7) AVOID: Timed pressure language, complex multi-step problems without scaffolding, abstract notation without concrete meaning.
(8) REFLECTION: Use simple tick-box statements. Include a 'How I feel about maths today' emoji scale.`;

    if (sn.includes("adhd")) return `${base}
(1) CHUNKING: Break every section into micro-tasks of no more than 2–3 questions before a natural break point. Use a ✅ checkbox next to each question so students can tick off progress.
(2) SECTION A — GUIDED PRACTICE: Maximum 3 questions. Each question must have a clear, single instruction. Include a 'STOP — check your work' prompt after question 3.
(3) SECTION B — CORE PRACTICE: Maximum 5 questions. Vary question types (calculation, fill-in, matching, true/false) to maintain engagement. Include a 'BRAIN BREAK — stand up and stretch!' prompt halfway through.
(4) INSTRUCTIONS: Use numbered bullet points. Never embed instructions inside paragraphs. Bold the action word in every instruction (e.g. "**Calculate** the area of...").
(5) WORKED EXAMPLE: Use a colour-coded step-by-step box. Each step on its own line. Max 5 steps.
(6) LAYOUT: Use clear section dividers (e.g. thick lines or boxes). Avoid cluttered pages. Plenty of white space.
(7) CHALLENGE: Make it optional and label it clearly as 'BONUS — only if you want to!'
(8) REFLECTION: Use a quick 1–5 star rating ('How focused were you today?') rather than extended writing.`;

    if (sn.includes("asc") || sn.includes("autism") || sn.includes("asperger")) return `${base}
(1) LANGUAGE: Use literal, unambiguous language. NEVER use idioms, metaphors, or figurative language (e.g. do NOT write 'find x' — write 'calculate the value of x'). Be explicit about what is expected.
(2) STRUCTURE: Every section must begin with a clear 'What you need to do:' box listing exactly what is required. No surprises.
(3) SECTION A — GUIDED PRACTICE: Provide a fully worked identical example immediately before Section A (not just a similar one). Label it 'EXAMPLE — follow these exact steps'. Then questions should mirror the example structure closely.
(4) SECTION B: Provide a 'Steps to follow' checklist at the top. Questions should increase in difficulty gradually with no sudden jumps.
(5) VOCABULARY: Define every technical term. Avoid synonyms — use the same word consistently throughout (e.g. always 'calculate', never mix with 'work out', 'find', 'determine').
(6) CONTEXT: Avoid social/emotional scenarios. Use neutral, factual contexts (measurements, shapes, data).
(7) LAYOUT: Highly consistent formatting. Same structure every section. No decorative elements that could distract.
(8) REFLECTION: Use a structured checklist format ('I did: ☐ Section A ☐ Section B ☐ Challenge') rather than open-ended questions.`;

    if (sn.includes("mld") || sn.includes("moderate learning")) return `${base}
(1) LANGUAGE: Use simple vocabulary (KS2 reading level). Short sentences. Define all subject-specific words.
(2) SECTION A — GUIDED PRACTICE: Use a concrete-pictorial-abstract (CPA) approach. Start with a concrete real-world scenario, then a diagram/picture, then the abstract question. Provide a fully completed model answer for question 1 as a template.
(3) SECTION B: Provide a 'Help Box' at the top with key facts, formulas, or vocabulary the student may need. Questions should be shorter and more straightforward than standard.
(4) WORKED EXAMPLE: Show a complete step-by-step solution with annotations. Include a second partially completed example for the student to finish.
(5) SCAFFOLDING: Every question in Section A must have either: (a) a sentence starter, (b) a partially completed answer, or (c) a hint. At least 3 questions in Section B should have hints.
(6) QUESTIONS: Avoid multi-step problems in Section A. Section B may have 2-step problems with clear sub-parts (a) and (b).
(7) CHALLENGE: Label as optional. Make it a simple extension of Section B, not a new concept.
(8) REFLECTION: Use picture-based or emoji-based self-assessment.`;

    if (sn.includes("slcn") || sn.includes("speech") || sn.includes("language") || sn.includes("communication")) return `${base}
(1) VOCABULARY: Include a prominent Word Bank at the start with every key term defined in plain English. Limit to 8 key words maximum.
(2) LANGUAGE: Use short, simple sentences. Avoid complex subordinate clauses. Use subject-verb-object structure.
(3) SECTION A — GUIDED PRACTICE: Provide sentence frames for every question (e.g. 'The answer is ___ because ___'). Include visual cues (arrows, diagrams) alongside text.
(4) SECTION B: Include a 'Key Words' reminder box. Use matching, labelling, or multiple-choice formats for at least 3 questions to reduce language production demands.
(5) WORKED EXAMPLE: Use numbered steps with very short annotations. Include a diagram or visual where possible.
(6) INSTRUCTIONS: Use simple imperative sentences. Bold the key action word. Avoid embedded instructions.
(7) REFLECTION: Use sentence starters ('I can ___ . I need to practise ___') rather than open questions.
(8) AVOID: Long reading passages, complex question phrasing, abstract language without visual support.`;

    if (sn.includes("anxiety") || sn.includes("mental health") || sn.includes("semh")) return `${base}
(1) TONE: Use warm, encouraging, non-threatening language throughout. Begin each section with a positive statement (e.g. 'You already know how to do this — let's practise!').
(2) SECTION A — GUIDED PRACTICE: Label it 'Warm-Up — no pressure!' Provide a fully worked example immediately before. Questions should be straightforward confidence-builders.
(3) SECTION B: Label it 'Main Practice — you've got this!' Include a 'Tip' box with a helpful reminder. Avoid language like 'must', 'should', 'you need to'.
(4) CHALLENGE: Label clearly as 'OPTIONAL BONUS — only if you want to!' Never use language that implies failure if skipped.
(5) INSTRUCTIONS: Use positive framing ('Try to...' rather than 'You must...'). Break into small numbered steps.
(6) REFLECTION: Include a 'How are you feeling?' check-in at the start and end using an emoji scale. Use 'I tried...' and 'I found...' sentence starters rather than evaluative statements.
(7) LAYOUT: Use a calm, uncluttered design. Avoid red text or anything that could feel like marking/failure.
(8) AVOID: Timed pressure, competitive language, overly complex tasks without support.`;

    if (sn.includes("eal") || sn.includes("esl") || sn.includes("english as") || sn.includes("additional language")) return `${base}
(1) VOCABULARY: Include a bilingual-friendly Word Bank at the start. Define every subject-specific term in plain English. Use simple, everyday synonyms where possible.
(2) LANGUAGE: Use short, simple sentences. Avoid idioms, colloquialisms, and culturally specific references. Use consistent terminology throughout.
(3) SECTION A — GUIDED PRACTICE: Provide sentence frames for every question. Include a 'Key Phrases' box with useful mathematical/scientific language (e.g. 'The answer is...', 'This shows that...').
(4) SECTION B: Include a 'Useful Words' reminder. Use visual supports (diagrams, tables) alongside text questions. Include at least 2 questions with visual/diagram-based answers.
(5) WORKED EXAMPLE: Annotate every step in plain English. Avoid jargon. Show the full method clearly.
(6) INSTRUCTIONS: Use simple imperative sentences. Avoid passive voice. Bold key instruction words.
(7) REFLECTION: Use sentence starters in English. Keep writing demands minimal.
(8) CONTEXT: Use culturally neutral contexts. Avoid UK-specific cultural references that may be unfamiliar.`;

    if (sn.includes("dyspraxia") || sn.includes("dcd") || sn.includes("coordination")) return `${base}
(1) LAYOUT: Use large, well-spaced writing lines (at least 1.5cm height). Provide ample white space for written answers.
(2) WRITING DEMANDS: Minimise handwriting requirements. Use tick boxes, circle-the-answer, matching, and fill-in-the-blank formats wherever possible.
(3) SECTION A — GUIDED PRACTICE: Use multiple-choice or matching formats for at least 3 questions. Provide large answer boxes.
(4) SECTION B: Mix question types. Avoid questions requiring extensive written explanations. Use tables or structured answer frames.
(5) INSTRUCTIONS: Use numbered bullet points. Keep instructions brief and clear.
(6) WORKED EXAMPLE: Keep steps brief. Use bullet points rather than paragraphs.
(7) CHALLENGE: Optional. Use a format that minimises writing (e.g. circle the correct answer, draw a diagram).
(8) AVOID: Questions requiring long written responses, complex diagrams to copy, tight answer boxes.`;

    if (sn.includes("vi") || sn.includes("visual impair")) return `${base}
(1) FONT: Use minimum 18pt equivalent text. Bold all headings. Use high-contrast formatting.
(2) LAYOUT: Generous spacing between all elements. No cluttered layouts. Each question clearly separated.
(3) DIAGRAMS: Describe any diagram in words as well. Use text-based alternatives where possible.
(4) QUESTIONS: Avoid questions that rely solely on visual interpretation. Provide text descriptions of any visual content.
(5) WORKED EXAMPLE: Write out every step in full text. Do not rely on diagrams to convey method.
(6) SECTION A & B: Use clear, unambiguous formatting. Number questions prominently. Large answer spaces.
(7) AVOID: Small print, low-contrast text, diagram-only questions, cluttered layouts.`;

    if (sn.includes("hi") || sn.includes("hearing impair") || sn.includes("deaf")) return `${base}
(1) INSTRUCTIONS: All instructions must be written clearly — no reliance on verbal explanation.
(2) VOCABULARY: Define all key terms in writing. Include a Word Bank.
(3) VISUAL SUPPORTS: Include diagrams, tables, and visual aids wherever possible.
(4) WORKED EXAMPLE: Fully written out with clear annotations. No audio-dependent content.
(5) SECTION A & B: Ensure all questions are fully self-contained in writing. Include all necessary information within the question itself.
(6) LAYOUT: Clear, structured, easy to navigate independently.
(7) AVOID: Any content that assumes access to audio or verbal instruction.`;

    if (sn.includes("pda") || sn.includes("odd")) return `${base}
(1) FRAMING: Use collaborative, choice-based language throughout. Replace demands with invitations (e.g. 'You might like to try...' instead of 'Answer the following').
(2) SECTION A: Label as 'Explore — choose where to start'. Allow any order. Offer 2 options for each question where possible.
(3) SECTION B: Label as 'Investigate'. Frame as puzzles or challenges rather than tasks.
(4) CHALLENGE: Frame as 'Secret Mission' or 'Expert Level — if you choose to accept it'.
(5) INSTRUCTIONS: Keep very brief. Use 'we' language ('Let's look at...'). Avoid 'you must' or 'you need to'.
(6) LAYOUT: Calm, uncluttered. Include a 'Take a break here if you need to' prompt midway.
(7) AVOID: Mandatory language, timed pressure, rigid structure without flexibility.`;

    // Default for any other SEND need
    return `${base}
(1) LANGUAGE: Use simple, clear language. Short sentences. Define all technical terms.
(2) SECTION A — GUIDED PRACTICE: Every question must have a sentence starter, hint, or partially completed answer frame.
(3) SECTION B — CORE PRACTICE: Include a 'Key Facts' reminder box at the top. Mix question types for variety.
(4) WORKED EXAMPLE: Break into clearly numbered steps. Annotate each step.
(5) SCAFFOLDING: Provide visual supports (diagrams, tables, word banks) throughout.
(6) CHUNKING: Break work into small sections with clear headings and natural break points.
(7) LAYOUT: Generous spacing, clear structure, uncluttered design.
(8) REFLECTION: Use simple tick-box or sentence-starter format.`;
  })() : "";

  // ── Difficulty tier (secondary only) ─────────────────────────────────────
  const isSecondary = yearNum >= 7;
  const difficultyTier = params.difficulty || "mixed";
  const tierNote = isSecondary
    ? difficultyTier === "foundation" || difficultyTier === "basic"
      ? `Difficulty: Foundation (GCSE grades 1–5). FOUNDATION TIER RULES: (1) Use simple, accessible language with short sentences. (2) Break every question into small, clearly numbered steps. (3) Include hints or sentence starters for each question in Section A (e.g. "Hint: Start by..."). (4) Avoid multi-step problems — each question tests ONE skill only. (5) Use familiar whole-number values; avoid complex fractions or decimals unless the topic requires it. (6) Section B questions should be slightly harder but still single-skill. (7) Challenge question should be a straightforward application, NOT a reasoning/proof question.`
      : difficultyTier === "higher" || difficultyTier === "stretch"
      ? `Difficulty: Higher (GCSE grades 4–9). HIGHER TIER RULES: (1) Use precise mathematical/scientific language throughout. (2) Include multi-step problems that require combining two or more skills. (3) Section A should start at grade 5 difficulty — no trivial recall questions. (4) Section B must include at least 2 questions requiring reasoning, proof, or "show that" style working. (5) Include questions with algebraic/symbolic manipulation, not just numerical substitution. (6) Challenge question must be a genuine grade 8–9 problem: proof, reverse engineering, or multi-concept application. (7) Use non-integer coefficients and complex values where appropriate.`
      : `Difficulty: Mixed (Foundation + Higher). MIXED TIER RULES: (1) Section A — Foundation-level questions (grades 1–4): single-skill, scaffolded, accessible. (2) Section B — Higher-level questions (grades 5–7): multi-step, less scaffolding, command words. (3) Challenge — Grade 8–9 reasoning or proof question. (4) Clearly label difficulty within each section where helpful (e.g. "★ Grade 4", "★★ Grade 6").`
    : "";

  // ── Worksheet length calibration ────────────────────────────────────────
  const lengthMins = parseInt(params.worksheetLength || "30", 10);
  const lengthNote =
    lengthMins <= 10
      ? `Length: 10 min. 5–8 questions total. No challenge section.`
      : lengthMins >= 60
      ? `Length: 60 min. 30–40 questions total. Full guided (8–10 q), independent (15–20 q), challenge (4–6 q), extension.`
      : `Length: 30 min. 15–20 questions total: guided (4–5 q), independent (8–10 q), one challenge.`;

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
  const topicEnforcementNote = `Every question, example, and vocabulary term must be about "${params.topic}" only.`;

  const user = `Create a printable worksheet.
Subject: ${params.subject} | Year: ${params.yearGroup} (${phase}) | Topic: ${params.topic} | Difficulty: ${params.difficulty || "mixed"}
${examBoardNote} ${sendNote} ${tierNote} ${lengthNote}
${mathsNote}
${examStyleNote}
${formulaNote} ${reminderBoxNote} ${wordProblemsNote} ${commonMistakesNote}
${topicEnforcementNote}
${params.additionalInstructions ? `\n\n=== CRITICAL OVERRIDE INSTRUCTIONS (HIGHEST PRIORITY \u2014 MUST FOLLOW EXACTLY) ===\n${params.additionalInstructions}\n=== END CRITICAL INSTRUCTIONS ===\n` : ""}

Follow this structure:
1. Title (include "${params.topic}")
2. Learning Objective (one sentence)
3. Worked Example (step-by-step)
4. Reminder Box (3 numbered steps, max 15 words each)
5. Section A - Basic Practice (4-5 guided questions with hints)
6. Section B - Standard Problems (5-8 questions + 1 misconception question)
7. Section C - Word Problems (3-4 real-life questions)
8. Challenge Question (one reasoning problem)
9. Reflection (3-4 "I can" statements + open question)
10. Common Mistakes (student-facing)
11. Answer Key (teacher only)
12. Teacher Notes (teacher only)

CRITICAL FORMATTING RULE: In all section content strings, put EACH question, step, or item on its OWN LINE separated by \n. NEVER put multiple questions on the same line separated by commas. Example: "1. First question\n2. Second question\n3. Third question"

Return EXACTLY this JSON (raw JSON, no markdown):
{
  "title": "${params.topic} — ${params.yearGroup} ${subjectDisplay} Worksheet",
  "subtitle": "${params.yearGroup} (${phase}) | ${subjectDisplay} | ${params.examBoard && params.examBoard !== 'none' ? params.examBoard : 'General'} | ${timingGuide}",
  "sections": [
    {"title": "Learning Objectives", "type": "objective", "content": "[3 objectives for ${params.topic}]"},
    {"title": "Key Vocabulary", "type": "vocabulary", "content": "[term | definition, one per line]"},
    ${isMaths && !params.examStyle ? `{"title": "Key Formulas", "type": "example", "content": "[formulas for ${params.topic} in LaTeX, or write: No formula required]"},` : ''}
    {"title": "Worked Example", "type": "example", "content": "[${exampleGuide}]"}${params.introOnly ? '' : `,
    {"title": "Reminder Box", "type": "reminder-box", "content": "[3 numbered steps for ${params.topic}]"},
    {"title": "${sendSectionTitles.sectionA}", "type": "guided", "content": "${hasSend ? 'WRITE heavily scaffolded guided questions here as a plain string — apply ALL SEND rules above — each question on its own line with hints/frames: 1. Question + [Hint: ...] or [Answer frame: ___ because ___]\n2. Question + scaffold\n3. Question + scaffold' : 'WRITE questions with hints here as a plain string — each on its own line: 1. Question one\n2. Question two\n3. Question three'}"},
    {"title": "${sendSectionTitles.sectionB}", "type": "independent", "content": "${hasSend ? 'WRITE scaffolded core practice questions here as a plain string — apply ALL SEND rules above — include Key Facts/Help Box reminder, vary question types, each on its own line: 1. Question one\n2. Question two' : 'WRITE standard questions + 1 misconception question here as a plain string — each on its own line: 1. Question one\n2. Question two'}"},
    {"title": "Section C — Word Problems", "type": "word-problems", "content": "WRITE ${hasSend ? '2-3 short, simple real-life word problems here — apply SEND language rules — each labelled PROBLEM 1, PROBLEM 2 etc on its own line' : '3-4 real-life word problems here as a plain string — each labelled PROBLEM 1, PROBLEM 2 etc on its own line'}"},
    {"title": "${sendSectionTitles.challenge}", "type": "challenge", "content": "[${challengeGuide}${hasSend ? ' — make this optional and clearly labelled as bonus/extension' : ''}]"},
    {"title": "${hasSend && (params.sendNeed!.toLowerCase().includes('anxiety') || params.sendNeed!.toLowerCase().includes('adhd')) ? 'How Did I Do? ★★★★★' : 'How Did I Do?'}", "type": "self-reflection", "teacherOnly": false, "content": "[${hasSend ? 'SEND-appropriate self-assessment: use tick-boxes, emoji scale, or sentence starters as specified in SEND rules above' : '3-4 I can statements + Q: open question'}]"},
    {"title": "Common Mistakes to Avoid", "type": "common-mistakes", "teacherOnly": false, "content": "[3-4 common mistakes students make on this topic, with brief explanations]"},
    {"title": "Mark Scheme", "type": "mark-scheme", "teacherOnly": true, "content": "[answers only]"},
    {"title": "Teacher Notes", "type": "teacher-notes", "teacherOnly": true, "content": "[timings, misconceptions, interventions, next topic]"},
    {"title": "SEND Adaptations & Rationale", "type": "teacher-notes", "teacherOnly": true, "content": "${hasSend ? `THIS WORKSHEET HAS BEEN ADAPTED FOR: ${params.sendNeed!.toUpperCase()}\n\nWHAT ADAPTATIONS WERE MADE:\n[List every specific adaptation applied in this worksheet — e.g. sentence starters added to Section A, Word Bank included, questions chunked into sub-steps, challenge labelled as optional, etc. Be specific about what was changed from a standard worksheet.]\n\nWHY THIS MATTERS — EVIDENCE-BASED RATIONALE:\n[Write 3–4 sentences explaining WHY these adaptations are necessary for a student with ${params.sendNeed}. Include: (1) How ${params.sendNeed} affects learning in a classroom context — what specific barriers does it create? (2) What the research/SEND Code of Practice says about supporting this need. (3) How each adaptation directly removes a specific barrier. (4) What the teacher should watch for during the lesson and how to further support the student.]\n\nCLASSROOM TIPS FOR THIS LESSON:\n[3–4 practical tips for the teacher delivering this specific worksheet to a student with ${params.sendNeed} — e.g. seating position, pre-teaching vocabulary, use of a scribe, allowing extra time, checking in at specific points, etc.]\n\nNEXT STEPS IF STUDENT STRUGGLES:\n[What to do if the student cannot access the worksheet despite adaptations — suggest further scaffolding, alternative formats, or specialist referral as appropriate for ${params.sendNeed}.]` : 'No SEND adaptations applied — standard worksheet.'}"`}
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
    "adaptations": ["Standard worksheet"]
  }
}`;

  // Scale token limit with worksheet length — llama-3.3-70b-versatile handles large outputs well
  // 10min ≈ 2000t, 30min ≈ 4000t, 60min ≈ 6000t
  const maxTokensForLength = params.introOnly ? 2000 : (lengthMins >= 60 ? 6000 : lengthMins <= 10 ? 2000 : 4000);
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

  // ── Strip HTML from section content strings ─────────────────────────────────
  // The AI sometimes generates HTML tags (e.g. <span style="color:#cc0000">) in
  // section content strings. Strip these before rendering to prevent raw attribute
  // text from appearing in the worksheet output.
  const stripHtmlFromContent = (s: string): string => {
    if (!s) return s;
    // Strip orphaned HTML attribute fragments (e.g. style="color:#cc0000">)
    let out = s.replace(/["']?\s*\bstyle\s*=\s*["'][^"']*["']\s*>/g, '');
    out = out.replace(/\bclass\s*=\s*["'](?!katex["'])[^"']*["']\s*>/g, '');
    // Strip complete HTML tags (except safe inline tags: sup, sub, strong, em, b, i, br)
    out = out.replace(/<\/?(?:span|div|p|a|font|section|article|header|footer|nav|ul|ol|li|table|tr|td|th|thead|tbody|tfoot|blockquote|pre|code|mark|small|del|ins|u|s|abbr|cite|dfn|kbd|samp|var|time|details|summary|form|input|select|textarea|button|label|fieldset|legend|canvas|script|style|link|meta)[^>]*>/gi, '');
    return out;
  };
  if (result.sections && Array.isArray(result.sections)) {
    result.sections = result.sections.map((section: any) => ({
      ...section,
      // Strip rogue ** or __ markdown bold markers from section titles
      title: typeof section.title === 'string' ? section.title.replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim() : section.title,
      content: typeof section.content === 'string' ? stripHtmlFromContent(section.content) : section.content,
    }));
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
  adhd: "Add a tick checkbox next to every question. Limit to maximum 3 questions per section. Add a 'BRAIN BREAK — stand up and stretch!' prompt midway. Vary question types: calculation, fill-in, matching, true/false. Bold the action word in every instruction.",
  anxiety: "Rename Section A 'Warm-Up — no pressure!'. Label challenge as 'OPTIONAL BONUS — only if you want to!'. Add a positive statement at the start of each section. Replace 'must', 'should', 'need to' with 'try to', 'have a go at'. Add an emoji check-in at start and end.",
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
