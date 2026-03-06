/**
 * Multi-provider AI engine for Adaptly.
 * Priority order: Groq → Gemini → OpenRouter → OpenAI → Local fallback
 * API keys stored in localStorage so users can update without redeploying.
 */

// ─── Built-in keys (used directly — no module-level localStorage access) ────
const BUILT_IN_KEYS: Record<string, string> = {
  groq: "", // Set your Groq API key in Settings → AI Configuration,
};

// ─── Key storage helpers ─────────────────────────────────────────────────────
export const AI_KEY_STORAGE = {
  groq: "adaptly_groq_key",
  gemini: "adaptly_gemini_key",
  openrouter: "adaptly_openrouter_key",
  openai: "adaptly_openai_key",
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
  const models = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-2-9b-it:free",
  ];
  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://adaptly.co.uk",
          "X-Title": "Adaptly SEND Assistant",
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

// ─── Main fallback chain ─────────────────────────────────────────────────────

export type AIProvider = "groq" | "gemini" | "openrouter" | "openai";

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000
): Promise<{ text: string; provider: AIProvider }> {
  const order: AIProvider[] = ["groq", "gemini", "openrouter", "openai"];
  const errors: string[] = [];

  for (const provider of order) {
    const key = getStoredKey(provider as keyof typeof AI_KEY_STORAGE);
    if (!key) {
      errors.push(`${provider}: no key`);
      continue;
    }
    try {
      let text: string;
      if (provider === "groq") text = await callGroq(systemPrompt, userPrompt, maxTokens);
      else if (provider === "gemini") text = await callGemini(systemPrompt, userPrompt, maxTokens);
      else if (provider === "openrouter") text = await callOpenRouter(systemPrompt, userPrompt, maxTokens);
      else text = await callOpenAI(systemPrompt, userPrompt, maxTokens);
      console.log(`[Adaptly AI] Success via ${provider}`);
      return { text, provider };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${provider}: ${msg}`);
      console.warn(`[Adaptly AI] ${provider} failed:`, msg);
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
}): Promise<AIWorksheetResult> {

  // ── Year-group calibration ──────────────────────────────────────────────────
  // Parse the year number from strings like "Year 1", "Year 5", "Year 10", "Year 13"
  const yearNum = parseInt((params.yearGroup || "").replace(/[^0-9]/g, ""), 10) || 7;

  // Key Stage and phase
  const phase =
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
  const examStyleNote = params.examStyle
    ? `Use exam-style formatting: numbered subparts (a)(b)(c), command words, mark allocations beside each question [X marks], time suggestions, answer lines.`
    : "";

  const user = `Create a differentiated worksheet for UK schools, STRICTLY calibrated for ${params.yearGroup}.

Subject: ${params.subject}
Topic: ${params.topic}
Year Group: ${params.yearGroup} — ${phase}
${sendNote}
${examBoardNote}
${examStyleNote}
Additional instructions: ${params.additionalInstructions || "none"}

━━━ YEAR GROUP CALIBRATION RULES (MANDATORY) ━━━
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
      "content": "By the end of this worksheet, students will be able to:\\n• [age-appropriate objective 1]\\n• [age-appropriate objective 2]\\n• [age-appropriate objective 3]"
    },
    {
      "title": "Key Vocabulary",
      "type": "vocabulary",
      "content": "TERM | DEFINITION\\n[term calibrated for ${params.yearGroup}] | [definition in language appropriate for ${params.yearGroup}]\\n[repeat for each vocabulary word]"
    },
    {
      "title": "Worked Example",
      "type": "example",
      "content": "[${exampleGuide}]"
    },
    {
      "title": "Foundation — Guided Practice",
      "type": "guided",
      "content": "[Questions calibrated for ${params.yearGroup} — ${questionGuide}. Include Hint: lines for scaffolding.]"
    },
    {
      "title": "Core Practice",
      "type": "independent",
      "content": "[Questions at expected level for ${params.yearGroup} — ${questionGuide}. No hints.]"
    },
    {
      "title": "Stretch & Challenge",
      "type": "challenge",
      "content": "[${challengeGuide}]"
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
    }
  ],
  "metadata": {
    "subject": "${params.subject}",
    "topic": "${params.topic}",
    "yearGroup": "${params.yearGroup}",
    "phase": "${phase}",
    "difficulty": "${params.difficulty || "mixed"}",
    "examBoard": "${params.examBoard || "General"}",
    "totalMarks": [calculate based on year group calibration],
    "estimatedTime": "${timingGuide.replace("Estimated time: ", "")}",
    "adaptations": ["List each adaptation applied, or 'Standard worksheet' if none"]
  }
}`;

  const { text, provider } = await callAI(system, user, 4000);
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const json = JSON.parse(cleaned);
  const result: AIWorksheetResult = { ...json, isAI: true, provider };

  // Optionally generate and inject a diagram section
  if (params.generateDiagram) {
    try {
      const diagramSection = await aiGenerateWorksheetDiagram({
        subject: params.subject,
        topic: params.topic,
        yearGroup: params.yearGroup,
        sendNeed: params.sendNeed,
        diagramType: params.diagramType,
      });
      // Insert diagram after the worked example section (index 2) or at position 2
      const insertAt = Math.min(2, result.sections.length);
      result.sections = [
        ...result.sections.slice(0, insertAt),
        diagramSection,
        ...result.sections.slice(insertAt),
      ];
    } catch (err) {
      console.warn("Diagram generation failed, continuing without diagram:", err);
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
  const system = `You are a creative writing teacher specialising in SEND-friendly stories for UK primary and secondary schools. Always respond with valid JSON only, no markdown.`;
  const user = `Write a ${params.length || "medium"} length ${params.genre} story for Year ${params.yearGroup} students.
${params.sendNeed ? `Adapted for: ${params.sendNeed}` : ""}
${params.characters?.length ? `Characters: ${params.characters.join(", ")}` : ""}
${params.setting ? `Setting: ${params.setting}` : ""}
${params.theme ? `Theme: ${params.theme}` : ""}
Reading level: ${params.readingLevel || "age-appropriate"}
Return JSON (no markdown): {"title": "Story Title", "content": "Full story text here..."}`;

  const { text, provider } = await callAI(system, user, 2000);
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
export async function aiGenerateDiagram(params: {
  subject: string;
  topic: string;
  yearGroup: string;
  diagramType?: string;
  sendNeed?: string;
}): Promise<{ svg: string; caption: string; provider?: string }> {
  const system = `You are an expert educational diagram creator. You produce clean, well-labelled SVG diagrams for UK school worksheets.
Rules:
- Return ONLY valid SVG markup starting with <svg and ending with </svg>. No JSON, no markdown, no explanation.
- Use a viewBox of "0 0 600 400" and set width="100%" height="auto"
- Use clear, readable fonts: font-family="Arial, sans-serif"
- Use a white background rect covering the full viewBox
- Label all parts clearly with text elements
- Use simple shapes: rect, circle, ellipse, line, path, polygon, text
- For science: draw accurate diagrams (cell, circuit, atom, etc.)
- For maths: draw graphs, geometric shapes, number lines, etc.
- For geography: draw simple maps, diagrams, cross-sections
- For history: draw timelines, maps, or relevant illustrations
- Make it educational and age-appropriate for Year ${params.yearGroup}
- Keep it clean and printable (no gradients, keep colours simple)
- SEND adaptation: ${params.sendNeed ? `Simplify labels for ${params.sendNeed} — use larger text (font-size 14+), fewer labels, clear arrows` : "Standard labelling"}
After the SVG, on a NEW LINE starting with CAPTION:, write a one-sentence caption for the diagram.`;

  const diagramTypeHint = params.diagramType
    ? `Diagram type requested: ${params.diagramType}`
    : `Choose the most relevant diagram type for this topic.`;

  const user = `Create an educational SVG diagram for:
Subject: ${params.subject}
Topic: ${params.topic}
Year Group: ${params.yearGroup}
${diagramTypeHint}

Output the SVG first, then CAPTION: [one sentence description]`;

  const { text, provider } = await callAI(system, user, 2500);

  // Extract SVG and caption
  const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
  const captionMatch = text.match(/CAPTION:\s*(.+)/i);

  if (!svgMatch) {
    throw new Error("AI did not return valid SVG");
  }

  const svg = svgMatch[0];
  const caption = captionMatch ? captionMatch[1].trim() : `${params.topic} diagram`;

  return { svg, caption, provider };
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
}): Promise<{ title: string; content: string; type: "diagram"; svg: string; caption: string; provider?: string }> {
  const { svg, caption, provider } = await aiGenerateDiagram(params);
  return {
    title: `Diagram: ${params.topic}`,
    content: caption,
    type: "diagram",
    svg,
    caption,
    provider,
  };
}
