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
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: reqHeaders,
      credentials: "include",
      // Server expects 'prompt' (not 'userPrompt') per the /api/ai/generate endpoint
      body: JSON.stringify({ prompt: userPrompt, systemPrompt, maxTokens }),
    });
    if (res.ok) {
      const data = await res.json();
      // Server returns 'content' field (not 'text') — fix the field name
      const content = data.content || data.text;
      if (content) {
        return { text: content, provider: (data.provider || "groq") as AIProvider };
      }
    }
    // Fall through to client keys only on auth errors
    if (res.status !== 401 && res.status !== 403) {
      const errText = await res.text().catch(() => "");
      console.warn(`[Adaptly AI] Server error ${res.status}:`, errText.slice(0, 200));
    }
  } catch (serverErr) {
    console.warn("[Adaptly AI] Server route unavailable, using client keys:", serverErr);
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

  const system = `You are an expert UK school teacher creating high-quality differentiated worksheets.
You are currently writing for ${params.yearGroup} students (${phase}).
You MUST calibrate EVERY element — vocabulary, sentence length, question depth, mark allocations, and worked examples — precisely for this year group.
A Year 5 worksheet and a Year 10 worksheet on the same topic must look COMPLETELY DIFFERENT in language and cognitive demand.
Always respond with valid JSON only — no markdown, no code blocks, just raw JSON.`;

  const examBoardNote = params.examBoard && params.examBoard !== "N/A" && params.examBoard !== "none"
    ? `Exam Board: ${params.examBoard}. Use that board's exact command words, mark allocation style, and question conventions.`
    : "";
  const sendNote = params.sendNeed && params.sendNeed !== "none" && params.sendNeed !== "general"
    ? `SEND adaptation required for: ${params.sendNeed}. Include scaffolded hints, sentence starters, simplified language where needed, and accessibility notes.`
    : "";

  // ── Difficulty tier (secondary only) ─────────────────────────────────────
  const isSecondary = yearNum >= 7;
  const difficultyTier = params.difficulty || "mixed";
  const tierNote = isSecondary
    ? difficultyTier === "foundation" || difficultyTier === "basic"
      ? `DIFFICULTY TIER: Foundation. All questions MUST come from the GCSE Foundation specification only (grades 1–5). Questions should be accessible, straightforward, and match Foundation-tier exam papers from AQA, Edexcel, OCR, and WJEC${params.examBoard && params.examBoard !== "none" ? ` — prioritise ${params.examBoard}` : ""}. No Higher-only content.`
      : difficultyTier === "higher" || difficultyTier === "stretch"
      ? `DIFFICULTY TIER: Higher. All questions MUST come from the GCSE Higher specification (grades 4–9). Include Higher-only content, multi-step problems, and demanding questions matching Higher-tier exam papers from AQA, Edexcel, OCR, and WJEC${params.examBoard && params.examBoard !== "none" ? ` — prioritise ${params.examBoard}` : ""}.`
      : `DIFFICULTY TIER: Mixed (Foundation + Higher). Include a range of questions: roughly half from Foundation specification (grades 1–5) and half from Higher specification (grades 5–9), matching real GCSE exam paper style from AQA, Edexcel, OCR, and WJEC${params.examBoard && params.examBoard !== "none" ? ` — prioritise ${params.examBoard}` : ""}.`
    : "";

  // ── Worksheet length calibration ────────────────────────────────────────
  const lengthMins = parseInt(params.worksheetLength || "30", 10);
  const lengthNote =
    lengthMins <= 10
      ? `WORKSHEET LENGTH: 10 minutes. This is a SHORT, focused practice. Generate ONLY 5–8 questions total across all sections. No extension or challenge section. Keep every question brief. A student working at normal pace must be able to complete the entire worksheet in 10 minutes.`
      : lengthMins >= 60
      ? `WORKSHEET LENGTH: 1 hour. This is a FULL LESSON worksheet. Generate a LARGE volume of questions — at least 30–40 questions total spread across all sections. Include a full guided practice section (8–10 questions), a large independent practice section (15–20 questions), a substantial challenge section (4–6 questions), and an extension task. The worksheet must genuinely take a student approximately 60 minutes to complete at normal working pace. Do NOT produce a short worksheet.`
      : `WORKSHEET LENGTH: 30 minutes. Generate a standard worksheet with 15–20 questions total: guided practice (4–5 questions), independent practice (8–10 questions), and a challenge question. A student working at normal pace should take approximately 30 minutes.`;

  // ── Maths-specific instruction ────────────────────────────────────────────
  const isMaths = params.subject.toLowerCase().includes("math");
  const mathsNote = isMaths
    ? `MATHS RULES (MANDATORY):
- ALL questions MUST be number-based (e.g. "Calculate \\(\\dfrac{3}{4} + \\dfrac{1}{2}\\)", "Solve \\(5x + 3 = 18\\)", "Find the area of a rectangle \\(7\\text{ cm} \\times 4\\text{ cm}\\)").
- Do NOT write wordy or text-heavy questions. No long paragraphs. Questions should be short, direct, and numerical.
- The worked example MUST show a fully worked numerical calculation with clear step-by-step arithmetic.
- Include 2–3 problem-solving questions where the SEND need (if any) is applied in a real-world context (e.g. money, time, measurement), but keep them concise and number-focused.
- Numbers must be clean and sensible for the year group (e.g. Year 3: whole numbers under 100; Year 7: integers and simple fractions; Year 10: decimals, surds, algebraic expressions). Do NOT generate awkward or unrealistic numbers.
- Do NOT include questions that are just definitions, descriptions, or explanations — every question must require a numerical answer or algebraic working.
- MATH NOTATION (MANDATORY): Use LaTeX notation for ALL mathematical expressions:
  * Fractions: \\(\\dfrac{numerator}{denominator}\\) e.g. \\(\\dfrac{3}{4}\\) NOT 3/4
  * Powers: \\(x^{2}\\) NOT x^2 or x2
  * Square roots: \\(\\sqrt{x}\\) NOT sqrt(x)
  * Multiplication: \\(\\times\\) NOT x or *
  * Division: \\(\\div\\) NOT /
  * Minus: \\(-\\) (standard minus sign)
  * Pi: \\(\\pi\\)
  * Wrap ALL math expressions in \\(...\\) for inline or \\[...\\] for display
  * Example: "Work out \\(\\dfrac{3}{4} + \\dfrac{1}{6}\\). Give your answer as a fraction in its simplest form."`
    : `MATH NOTATION: When any mathematical expression appears, use LaTeX notation wrapped in \\(...\\) for inline math.`;

  // ── Exam-style instruction ────────────────────────────────────────────────
  const examStyleNote = params.examStyle
    ? `EXAM-STYLE MODE (MANDATORY): Questions must be taken directly from the style of real UK exam papers (GCSE/A-Level/KS2 SATs as appropriate for the year group). Format EXACTLY like a real exam paper:
- Number each question Q1, Q2, Q3... with sub-parts (a), (b), (c) where appropriate.
- Show mark allocations in brackets after each question: [1 mark], [2 marks], [4 marks] etc.
- Use precise exam command words: "Calculate", "Show that", "Prove", "Evaluate", "Describe", "Explain", "Compare", "Sketch", "State" — appropriate to the subject and year group.
- Include answer lines or answer boxes (write "Answer: ............" or "Answer = ............" as appropriate).
- For maths: questions must be purely numerical/algebraic — no wordy paragraphs.
- Do NOT include a worked example section in exam-style mode. ONLY include a formula box if the topic genuinely requires a formula to answer the questions (e.g. area formulae for a geometry topic, quadratic formula for solving quadratics). If the topic does NOT require a formula (e.g. arithmetic, reading comprehension, grammar), do NOT include any formula box at all.
- The overall layout and question style must be indistinguishable from a real ${params.examBoard && params.examBoard !== "none" ? params.examBoard : "GCSE"} exam paper.`
    : "";

  // ── Formula rules (topic-specific only) ──────────────────────────────────
  const formulaNote = `FORMULA RULES (MANDATORY):
- ONLY include formulas that are DIRECTLY required to answer the questions on this specific topic ("${params.topic}").
- Do NOT include generic formula sheets or unrelated formulas.
- If the topic is "Pythagoras' Theorem", include ONLY the Pythagorean formula \\(a^2 + b^2 = c^2\\).
- If the topic is "Fractions" or "Arithmetic", do NOT include any formula box — no formulas are needed.
- If the topic is "Quadratic Equations", include ONLY the quadratic formula.
- If the topic is "Circle Theorems", include ONLY the relevant circle area/circumference formulas.
- If the topic does NOT involve a formula, omit the formula section entirely.
- NEVER include a formula box just to fill space — only include it if students genuinely need it to answer the questions.`;

  // ── Topic enforcement note ─────────────────────────────────────────────────
  const topicEnforcementNote = `
╔════════════════════════════════════════════════════════════════════════════╗
║ CRITICAL — TOPIC ENFORCEMENT (MANDATORY, NO EXCEPTIONS)                        ║
╠════════════════════════════════════════════════════════════════════════════╣
║ The topic is: "${params.topic}"                                                  ║
║ EVERY SINGLE QUESTION in this worksheet MUST be about "${params.topic}" ONLY.    ║
║ Do NOT include questions about any other topic, even if related.                ║
║ Do NOT mix in questions about other topics as "warm-up" or "extension".         ║
║ If the topic is "Fractions", ALL questions must be about fractions.             ║
║ If the topic is "Algebra", ALL questions must be about algebra.                 ║
║ The worked example MUST demonstrate "${params.topic}" specifically.              ║
║ The vocabulary section MUST only include terms related to "${params.topic}".     ║
║ The learning objectives MUST all be about "${params.topic}".                     ║
╚════════════════════════════════════════════════════════════════════════════╝`;

  const user = `Create a differentiated worksheet for UK schools, STRICTLY calibrated for ${params.yearGroup}.

Subject: ${params.subject}
Topic: ${params.topic}
Year Group: ${params.yearGroup} — ${phase}
${topicEnforcementNote}
${sendNote}
${examBoardNote}
${tierNote}
${lengthNote}
${mathsNote}
${examStyleNote}
${formulaNote}
Additional instructions: ${params.additionalInstructions || "none"}

━━━ YEAR GROUP CALIBRATION RULES (MANDATORY) ━━━
Year group scaling is CRITICAL. The difficulty, language, and cognitive demand must match the year group EXACTLY:
- Year 1–2 (KS1): Very simple, concrete, visual. Single-step problems only.
- Year 3–4 (KS2 lower): Simple and clear. Two-step problems. Everyday contexts.
- Year 5–6 (KS2 upper): Moderate complexity. Multi-step. Introduce subject vocabulary.
- Year 7–8 (KS3 lower): Accessible secondary level. Build on KS2. Introduce formal methods.
- Year 9 (KS3 upper): More demanding. Bridge to GCSE. Introduce GCSE-style questions.
- Year 10–11 (KS4/GCSE): Full GCSE standard. Exam-board aligned. Command words. Tier-appropriate.
- Year 12–13 (KS5/A-Level): A-Level standard. Synoptic. Extended responses.
- 11+ Preparation: KS2 upper level (Year 5–6 standard) but focused on 11+ exam skills. Include Verbal Reasoning (word codes, analogies, sequences), Non-Verbal Reasoning (patterns, shapes), Maths (arithmetic, word problems, fractions, ratios), and English (comprehension, vocabulary, grammar). Questions must be in the style of GL Assessment and CEM 11+ papers. Use multiple-choice or short-answer format where appropriate.

A Year 3 worksheet and a Year 10 worksheet on the same topic MUST look completely different.
${sentenceGuide}
${vocabGuide}
${questionGuide}
${exampleGuide}
${challengeGuide}
Timing: ${timingGuide}

IMPORTANT: Do NOT use GCSE language for primary students. Do NOT use primary-level language for GCSE students.
Every question, definition, and sentence must be appropriate for ${params.yearGroup}.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return EXACTLY this JSON structure (raw JSON only, no markdown):
{
  "title": "Descriptive worksheet title including topic and year group",
  "subtitle": "${params.yearGroup} | ${params.subject} | ${params.examBoard || "General"} | ${timingGuide}",
  "sections": [
    {
      "title": "Learning Objectives",
      "type": "objective",
      "content": "By the end of this lesson, students will be able to:\\n• [age-appropriate objective 1]\\n• [age-appropriate objective 2]\\n• [age-appropriate objective 3]"
    },
    {
      "title": "Key Vocabulary",
      "type": "vocabulary",
      "content": "TERM | DEFINITION\\n[IMPORTANT: Each line must be exactly: term | definition. Use ONLY terms directly related to '${params.topic}'. Use age-appropriate language for ${params.yearGroup}. Do NOT include generic terms unrelated to the topic. Do NOT use bullet points or numbering. Example for 'Fractions': Numerator | The top number in a fraction — shows how many parts are selected\\nDenominator | The bottom number in a fraction — shows how many equal parts in total\\nEquivalent fractions | Fractions that have the same value, e.g. 1/2 = 2/4]"
    },
    ${isMaths && !params.examStyle ? `{
      "title": "Key Formulas",
      "type": "example",
      "content": "[FORMULA RULES: ONLY include this section if the topic '${params.topic}' genuinely requires a formula. If it does, list ONLY the formulas directly needed for this topic — no others. Format each formula clearly with its name and LaTeX notation. If no formula is needed for this topic, write 'No formula required for this topic.' and keep this section very brief.]"
    },` : ''}
    {
      "title": "Worked Example",
      "type": "example",
      "content": "[${exampleGuide}${isMaths ? " — MUST be a fully worked numerical/algebraic calculation, step by step. No prose." : ""}]"
    }${params.introOnly ? '' : `,
    {
      "title": "Section A — Guided Practice",
      "type": "guided",
      "content": "[Questions calibrated for ${params.yearGroup} — ${questionGuide}. Include Hint: lines for scaffolding.${isMaths ? " ALL questions must be number/calculation based." : ""}]"
    },
    {
      "title": "Section B — Core Practice",
      "type": "independent",
      "content": "[Questions at expected level for ${params.yearGroup} — ${questionGuide}. No hints.${isMaths ? " ALL questions must be number/calculation based. Include 2–3 problem-solving questions." : ""}]"
    },
    {
      "title": "Section C — Stretch & Challenge",
      "type": "challenge",
      "content": "[${challengeGuide}${isMaths ? " Must be a multi-step numerical or algebraic problem." : ""}]"
    },
    {
      "title": "How Did I Do?",
      "type": "self-reflection",
      "content": "[Write 3–4 self-reflection statements for students to rate themselves. Each statement should start with 'I can' and be directly about the topic '${params.topic}'. Calibrate the language for ${params.yearGroup}. Format: one statement per line, starting with 'I can'. Example for 'Fractions' Year 5: I can identify the numerator and denominator in a fraction\\nI can find equivalent fractions\\nI can add two fractions with the same denominator\\nI can compare fractions and say which is larger. Also include one open question at the end on a new line starting with 'Q:' — e.g. 'Q: What did you find most tricky about this topic? Write one sentence.']"
    },
    {
      "title": "Mark Scheme",
      "type": "mark-scheme",
      "teacherOnly": true,
      "content": "[Full mark scheme with method marks, common errors, and total marks]"
    },
    {
      "title": "Teacher Notes",
      "type": "teacher-notes",
      "teacherOnly": true,
      "content": "[Lesson structure, common misconceptions for ${params.yearGroup}, intervention prompts, extension ideas]"
    }`}
  ],
  "metadata": {
    "subject": "${params.subject}",
    "topic": "${params.topic}",
    "yearGroup": "${params.yearGroup}",
    "phase": "${phase}",
    "difficulty": "${params.difficulty || "mixed"}",
    "examBoard": "${params.examBoard || "General"}",
    "totalMarks": 0,
    "estimatedTime": "${timingGuide.replace("Estimated time: ", "")}",
    "adaptations": ["List each adaptation applied, or 'Standard worksheet' if none"]
  }
}`;

  // Scale token limit with worksheet length — longer worksheets need more tokens
  // In introOnly mode, we only need ~1500 tokens (just objectives, vocab, worked example)
  const maxTokensForLength = params.introOnly ? 2000 : (lengthMins >= 60 ? 8000 : lengthMins <= 10 ? 3000 : 6000);
  const { text, provider } = await callAI(system, user, maxTokensForLength);
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let json: any;
  try {
    json = JSON.parse(cleaned);
  } catch (parseErr) {
    // LaTeX escape sequences like \( \) \[ \] \{ \} \dfrac \sqrt etc. are invalid JSON escapes.
    // Fix by doubling backslashes inside JSON string values only.
    try {
      // Strategy: replace invalid single-backslash escapes with double backslashes
      // Only fix sequences that are NOT valid JSON escapes (\" \\ \/ \b \f \n \r \t \uXXXX)
      const fixedJson = cleaned.replace(
        /\\(?!["\\\//bfnrtu])/g,
        "\\\\"
      );
      json = JSON.parse(fixedJson);
    } catch (fixErr) {
      console.error("[Adaptly AI] JSON parse failed even after LaTeX fix. Raw response:", text.slice(0, 300));
      throw new Error(`AI returned invalid JSON. Raw: ${text.slice(0, 100)}`);
    }
  }
  const result: AIWorksheetResult = { ...json, isAI: true, provider };

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
  const result = JSON.parse(cleaned);
  return { ...result, provider };
}

// ─── Task differentiation ────────────────────────────────────────────────────

export async function aiDifferentiateTask(params: {
  taskContent: string;
  sendNeed?: string;
  yearGroup?: string;
  subject?: string;
}): Promise<{ differentiatedContent: string; provider?: string }> {
  const system = `You are a SEND specialist teacher who differentiates tasks to make them accessible for all learners.`;
  const user = `Differentiate this task for a ${params.yearGroup || "secondary"} ${params.subject || ""} student${params.sendNeed ? ` with ${params.sendNeed}` : ""}:

${params.taskContent}

Provide a clearly differentiated version with simplified language, visual cues, and scaffolding. Return as plain text only.`;

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
}): Promise<{ svg: string; caption: string; imageUrl?: string; attribution?: string; provider?: string }> {
  // ── Primary: dedicated server endpoint (GPT-4o → fallback chain → Pollinations) ──
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
    console.warn('[Diagram] Server /api/ai/diagram failed, using legacy fallback:', e);
  }

  // ── Fallback 1: Gemini direct call (when server is unavailable) ─────────────────────────
  // Note: Pollinations flux is no longer available from server IPs. Gemini SVG is used instead.
  // (No direct Gemini client-side call here — falls through to callAI which tries all providers)

  // ── Fallback 2: Legacy SVG via callAI ──────────────────────────────────────────────────────
  const topicHint = params.diagramType || getDiagramHint(params.subject, params.topic);
  const sendAdapt = params.sendNeed
    ? `SEND adaptation for ${params.sendNeed}: font-size="16" minimum on ALL labels, stroke-width="3" on all outlines, max 6 labels, high-contrast colours, large bold arrows.`
    : 'Standard quality: font-size="14" minimum on all labels, stroke-width="2" on outlines.';
  const system = `You are a specialist educational SVG diagram generator for UK school worksheets. Your diagrams must be PROFESSIONAL, ACCURATE, WELL-SPACED, and PRINT-READY.

CANVAS: viewBox="0 0 700 500" — plan all coordinates on this 700×500 canvas before drawing.

MANDATORY RULES:
1. Output ONLY valid SVG starting with <svg viewBox="0 0 700 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg"> and ending with </svg>. No other text.
2. First child: <rect width="700" height="500" fill="white"/>.
3. ALL <text> elements must have font-family="Arial, sans-serif" and an explicit fill colour.
4. Permitted elements: rect, circle, ellipse, line, path, polygon, polyline, text, tspan, g, defs, marker only.
5. Title: <text x="350" y="30" text-anchor="middle" font-size="17" font-weight="bold" fill="#1e293b" font-family="Arial, sans-serif">.
6. Shapes: stroke="#1e293b" stroke-width="2". Pale fills: #dbeafe, #dcfce7, #fef9c3, #fce7f3, #ffedd5.
7. ALL labels OUTSIDE shapes with short straight leader lines (stroke="#64748b" stroke-width="1"). NEVER overlap text with shapes or other text.
8. Minimum 15px gap between shapes. 50px margin on all sides (elements within x=50..650, y=40..470).
9. ${sendAdapt}
10. Scientifically/mathematically accurate. Correct spelling on all labels.
11. SPECIAL CHARACTERS: NEVER use raw Unicode in SVG text. Use HTML entities: &#178; for \u00b2, &#179; for \u00b3, &#176; for degree, &#955; for lambda, &#960; for pi, &#8594; for right arrow.
After </svg> write: CAPTION: [one sentence]`;
  const user = `Draw a professional educational SVG diagram.
Subject: ${params.subject}, Topic: ${params.topic}, Year: ${params.yearGroup}
Spec: ${topicHint}
Remember: labels OUTSIDE shapes, no overlapping, 50px margins, SVG only then CAPTION:`;
  const { text, provider } = await callAI(system, user, 3000);
  const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
  const captionMatch = text.match(/CAPTION:\s*(.+)/i);
  if (!svgMatch) {
    const fallbackSvg = `<svg viewBox="0 0 700 500" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg"><rect width="700" height="500" fill="white"/><rect x="20" y="20" width="660" height="460" fill="#f8f9ff" stroke="#6366f1" stroke-width="2" rx="12"/><text x="350" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#6366f1" font-weight="bold">${params.topic}</text><text x="350" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#666">${params.subject} — ${params.yearGroup}</text></svg>`;
    return { svg: fallbackSvg, caption: `${params.topic} diagram`, provider };
  }
  return { svg: svgMatch[0], caption: captionMatch ? captionMatch[1].trim() : `${params.topic} diagram`, provider };
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
}): Promise<{ title: string; content: string; type: "diagram"; svg: string; caption: string; imageUrl?: string; attribution?: string; provider?: string }> {
  const { svg, caption, imageUrl, attribution, provider } = await aiGenerateDiagram(params);
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
  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed) ? parsed : parsed.questions || [];
}
