/**
 * Exam Paper Builder
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds a worksheet using REAL, verbatim past paper questions from the
 * pastPaperQuestions database. When the user toggles "Exam-style formatting",
 * every question on the worksheet is a genuine question from a past exam paper
 * with only typography and SEND-friendly formatting adjusted.
 */

import {
  allPastPaperQuestions,
  getExamQuestions,
  formatQuestionForWorksheet,
  getDatabaseSummary,
  type PastPaperQuestion,
} from "./pastPaperQuestions";
import type { AIWorksheetResult, AIWorksheetSection } from "./ai";

// Subject name → database subject id mapping
const SUBJECT_MAP: Record<string, string> = {
  mathematics: "mathematics",
  maths: "mathematics",
  math: "mathematics",
  "english language": "english-language",
  "english-language": "english-language",
  english: "english-language",
  "english literature": "english-literature",
  "english-literature": "english-literature",
  literature: "english-literature",
  biology: "biology",
  chemistry: "chemistry",
  physics: "physics",
  science: "science",
  "combined science": "science",
  history: "history",
  geography: "geography",
  "computer science": "computer-science",
  "computer-science": "computer-science",
  computing: "computer-science",
  cs: "computer-science",
  "religious studies": "religious-studies",
  "religious-studies": "religious-studies",
  rs: "religious-studies",
  re: "religious-studies",
  "religious education": "religious-studies",
  business: "business",
  "business studies": "business",
  french: "french",
  spanish: "spanish",
  german: "german",
  mfl: "mfl",
  "modern foreign languages": "mfl",
  art: "art",
  drama: "drama",
  music: "music",
  pe: "pe",
  "physical education": "pe",
  psychology: "psychology",
  sociology: "sociology",
  economics: "economics",
};

function normaliseSubject(subject: string): string {
  return SUBJECT_MAP[subject.toLowerCase().trim()] || subject.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Parse a year group string like "Year 7", "Year 10", "KS3", "GCSE", "KS2" into a number.
 * Returns undefined if the year group cannot be determined.
 */
function parseYearGroupNumber(yearGroup?: string): number | undefined {
  if (!yearGroup) return undefined;
  const yg = yearGroup.toLowerCase().trim();
  // Direct year number: "year 7", "y7", "7"
  const match = yg.match(/(\d+)/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= 13) return n;
  }
  // Key stage mappings
  if (yg.includes("ks1") || yg.includes("key stage 1")) return 2;
  if (yg.includes("ks2") || yg.includes("key stage 2")) return 6;
  if (yg.includes("ks3") || yg.includes("key stage 3")) return 8;
  if (yg.includes("gcse") || yg.includes("ks4") || yg.includes("key stage 4")) return 10;
  if (yg.includes("a-level") || yg.includes("sixth") || yg.includes("ks5")) return 12;
  return undefined;
}

// Tier mapping from difficulty setting — maps internal ID to GCSE tier for question filtering
function normaliseTier(difficulty?: string): "Higher" | "Foundation" | undefined {
  if (!difficulty) return undefined;
  const d = difficulty.toLowerCase();
  if (d === "higher" || d === "stretch") return "Higher";
  if (d === "foundation" || d === "basic") return "Foundation";
  return undefined; // mixed/standard/access/extended — no tier filter
}

// Returns the human-readable tier/difficulty label for the worksheet header
function getTierLabel(subject: string, difficulty?: string): string {
  if (!difficulty || difficulty === "mixed") return "";
  const subj = subject.toLowerCase();
  // Tiered subjects (Maths, Science, MFL)
  if (["mathematics", "science", "mfl", "biology", "chemistry", "physics"].some(s => subj.includes(s))) {
    if (difficulty === "higher") return " — Higher Tier";
    if (difficulty === "foundation") return " — Foundation Tier";
  }
  // English — single tier with scaffolding levels
  if (subj.includes("english")) {
    if (difficulty === "higher") return " — Extended";
    if (difficulty === "foundation") return " — Entry Level";
  }
  // 11+
  if (subj.includes("eleven") || subj.includes("11+")) {
    if (difficulty === "higher") return " — Advanced";
    if (difficulty === "foundation") return " — Standard";
  }
  // All other subjects (levelled)
  if (difficulty === "higher") return " — Extended";
  if (difficulty === "foundation") return " — Access Level";
  return "";
}

export interface ExamPaperWorksheetParams {
  subject: string;
  topic?: string;
  yearGroup: string;
  examBoard?: string;
  difficulty?: string;
  sendNeed?: string;
  includeAnswers?: boolean;
  worksheetLength?: string;
  additionalInstructions?: string;
}

export interface ExamPaperSection {
  title: string;
  type: string;
  content: string;
  teacherOnly?: boolean;
}

export interface ExamPaperWorksheet {
  title: string;
  subtitle: string;
  sections: ExamPaperSection[];
  metadata: {
    subject: string;
    topic: string;
    yearGroup: string;
    difficulty: string;
    examBoard: string;
    totalMarks: number;
    estimatedTime: string;
    adaptations: string[];
    isExamPaper: true;
    questionsUsed: Array<{ id: string; board?: string; year?: number; paper?: string }>;
  };
  isAI: false;
  isExamPaper: true;
}

/**
 * Determine how many questions to include based on worksheet length.
 */
function getQuestionCount(worksheetLength?: string): number {
  const mins = parseInt(worksheetLength || "30", 10);
  if (mins <= 10) return 5;
  if (mins <= 20) return 8;
  if (mins <= 30) return 12;
  if (mins <= 45) return 18;
  if (mins >= 60) return 25;
  return 12;
}

/**
 * Build a SEND-friendly header for the exam paper.
 */
function buildExamHeader(params: ExamPaperWorksheetParams, board: string): string {
  const boardName = board && board !== "none" && board !== "Any" ? board : "Adaptly";
  const tierLabel = getTierLabel(params.subject, params.difficulty);
  const sendNote = params.sendNeed && params.sendNeed !== "none" && params.sendNeed !== "general"
    ? `\n\n> **SEND Adaptation:** This paper has been formatted for students with ${params.sendNeed}. Font size, line spacing and layout have been adjusted for accessibility. Questions are verbatim from real exam papers.`
    : "";

  return `**Exam Board:** ${boardName}${tierLabel}  
**Year Group:** ${params.yearGroup}  
**Subject:** ${params.subject}  
**Instructions:** Answer ALL questions. Show all working. Write your answers in the spaces provided.${sendNote}

---`;
}

/**
 * Build a formula/information box for the subject if relevant.
 */
function buildInfoBox(subject: string, board: string): string {
  const s = subject.toLowerCase();
  if (s.includes("math")) {
    return `**Formulae you may need:**
- Area of a rectangle = length × width
- Area of a triangle = ½ × base × height  
- Area of a circle = πr²
- Circumference = 2πr
- Pythagoras: a² + b² = c²
- Volume of a cuboid = l × w × h
- Speed = Distance ÷ Time

---`;
  }
  if (s.includes("physics")) {
    return `**Equations you may need:**
- Speed = Distance ÷ Time (v = d/t)
- Force = Mass × Acceleration (F = ma)
- Work done = Force × Distance (W = Fd)
- Power = Energy ÷ Time (P = E/t)
- Kinetic energy = ½mv²
- GPE = mgh

---`;
  }
  if (s.includes("chem")) {
    return `**Information you may need:**
- Relative atomic masses: H=1, C=12, N=14, O=16, Na=23, Mg=24, Al=27, S=32, Cl=35.5, K=39, Ca=40, Fe=56, Cu=64, Zn=65, Br=80, Ag=108, I=127, Ba=137

---`;
  }
  return "";
}

/**
 * Format a question for SEND-friendly display with proper exam formatting.
 */
function formatQuestionSEND(q: PastPaperQuestion, index: number, sendNeed?: string): string {
  // Strip any trailing asterisks or markdown bold markers from question text
  const cleanText = (q.text || q.question || "").replace(/\s*\*+\s*$/, "").trim();
  const markLabel = (q.marks ?? 0) === 1 ? "1 mark" : `${q.marks ?? 0} marks`;

  // Context block (stimulus text, table, etc.)
  const contextBlock = q.context
    ? `\n\n> ${q.context.split("\n").join("\n> ")}\n`
    : "";

  // Hints removed — not shown on worksheets
  const sendHint = "";

  // Answer lines
  const lineCount = q.answerLines || Math.max(2, Math.ceil((q.marks ?? 2) * 1.5));
  const answerLines = Array(lineCount).fill("___________________________________________").join("\n\n");

  // Sub-parts
  let subPartsText = "";
  if (q.subParts && q.subParts.length > 0) {
    q.subParts.forEach(part => {
      const pm = part.marks === 1 ? "1 mark" : `${part.marks} marks`;
      const pLines = Array(part.answerLines || 3).fill("___________________________________________").join("\n\n");
      subPartsText += `\n\n**(${part.label})** ${part.text} **[${pm}]**\n\n${pLines}`;
    });
  }

  const questionText = q.subParts && q.subParts.length > 0
    ? `**Q${index}.** ${cleanText}${contextBlock}${sendHint}${subPartsText}`
    : `**Q${index}.** ${cleanText} **[${markLabel}]**${contextBlock}${sendHint}\n\n${answerLines}`;

  return questionText + `\n\n*[${q.board} ${q.year} — ${q.paper}]*\n\n---`;
}

/**
 * Build a mark scheme section from the selected questions.
 */
function buildMarkScheme(questions: PastPaperQuestion[]): string {
  let ms = "**Mark Scheme**\n\n";
  ms += "> *Adaptly exam-style questions. Mark schemes are provided below for each question.*\n\n";

  questions.forEach((q, i) => {
    const markLabel = q.marks === 1 ? "1 mark" : `${q.marks} marks`;
    ms += `**Q${i + 1}.** [${markLabel}] — *${q.topic}, ${q.paper}*\n`;
    ms += `- Topic: ${q.topic}\n`;
    ms += `- Command word: ${q.commandWord || "N/A"}\n`;
    if (q.markScheme) ms += `- Mark scheme: ${q.markScheme}\n`;
    ms += "\n";
  });

  return ms;
}

/**
 * Build teacher notes for the exam paper.
 */
function buildTeacherNotes(questions: PastPaperQuestion[], params: ExamPaperWorksheetParams): string {
  const boards = Array.from(new Set(questions.map(q => q.board)));
  const years = Array.from(new Set(questions.map(q => q.year))).sort();
  const topics = Array.from(new Set(questions.map(q => q.topic)));
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks ?? 0), 0);

  return `**Teacher Notes**

**Questions sourced from:** Adaptly Exam-Style Question Bank

**Topics covered:** ${topics.join(", ")}

**Total marks:** ${totalMarks}

**SEND considerations:**
${params.sendNeed && params.sendNeed !== "none" && params.sendNeed !== "general"
  ? `- Paper formatted for: ${params.sendNeed}\n- Increased line spacing applied\n- Font size increased for readability\n- Hints added to scaffold questions`
  : "- Standard formatting applied\n- Adjust font size and line spacing as needed for individual students"}

**Suggested use:**
- Use as a timed practice paper (exam conditions)
- Use individual questions as starters or plenaries
- Assign specific questions by topic for targeted revision

**Mark scheme:** Included in the mark scheme section of this paper.`;
}

/**
 * Main function: build an exam paper worksheet from Adaptly exam-style questions.
 * Returns an ExamPaperWorksheet with original questions.
 */
export function buildExamPaperWorksheet(params: ExamPaperWorksheetParams): ExamPaperWorksheet {
  const normSubject = normaliseSubject(params.subject);
  const board = params.examBoard && params.examBoard !== "none" ? params.examBoard : "Adaptly";
  const tier = normaliseTier(params.difficulty);
  const questionCount = getQuestionCount(params.worksheetLength);

  // Parse year group number from string like "Year 7", "Year 10", "KS3", "GCSE" etc.
  const yearGroupNum = parseYearGroupNumber(params.yearGroup);

  // Fetch questions from database
  const topicFilter = params.topic && params.topic.toLowerCase() !== "general" ? params.topic : undefined;
  const minNeeded = Math.min(3, questionCount);

  // Attempt 1: exact board + tier + topic + year group
  let questions = getExamQuestions({
    subject: normSubject,
    board,
    tier,
    topic: topicFilter,
    limit: questionCount,
    yearMin: 2010,
    yearGroup: yearGroupNum,
  });

  // Attempt 2: any board, keep tier + topic + year group
  if (questions.length < minNeeded) {
    questions = getExamQuestions({
      subject: normSubject,
      tier,
      topic: topicFilter,
      limit: questionCount,
      yearMin: 2010,
      yearGroup: yearGroupNum,
    });
  }

  // Attempt 3: any board + any tier, keep topic + year group
  if (questions.length < minNeeded) {
    questions = getExamQuestions({
      subject: normSubject,
      topic: topicFilter,
      limit: questionCount,
      yearMin: 2010,
      yearGroup: yearGroupNum,
    });
  }

  // Attempt 4: any board + any tier + topic, drop year group restriction
  if (questions.length < minNeeded) {
    questions = getExamQuestions({
      subject: normSubject,
      topic: topicFilter,
      limit: questionCount,
      yearMin: 2010,
    });
  }

  // Attempt 5: any board + any tier + no topic (broadest fallback)
  if (questions.length === 0) {
    questions = getExamQuestions({
      subject: normSubject,
      limit: questionCount,
      yearMin: 2010,
    });
  }

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks ?? 0), 0);
  const tier_label = getTierLabel(params.subject, params.difficulty);
  const boardLabel = board !== "none" ? board : "Adaptly";

  // Build sections
  const sections: ExamPaperSection[] = [];

  // 1. Exam header / instructions
  sections.push({
    title: "Instructions",
    type: "instructions",
    content: buildExamHeader(params, boardLabel),
  });

  // 2. Information / formula box (subject-specific)
  const infoBox = buildInfoBox(params.subject, boardLabel);
  if (infoBox) {
    sections.push({
      title: "Formulae & Information",
      type: "info-box",
      content: infoBox,
    });
  }

  // 3. Questions — split into sections if enough questions
  if (questions.length === 0) {
    // No questions found — inform user
    sections.push({
      title: "Exam Questions",
      type: "questions",
      content: `> **Note:** No past paper questions were found in the database for ${params.subject} (${boardLabel}${tier ? ` — ${tier} Tier` : ""}).
>
> The database currently contains questions for: Mathematics, English Language, English Literature, Biology, Chemistry, Physics, History, Geography (GCSE-style, exam-ready).
>
> **To add more questions:** Visit the Past Papers section and use the question bank to import additional questions.
>
> In the meantime, the AI has been used to generate exam-style questions in the format of ${boardLabel} papers.`,
    });
  } else if (questions.length <= 8) {
    // Single section for short papers
    const questionsContent = questions.map((q, i) => formatQuestionSEND(q, i + 1, params.sendNeed)).join("\n\n");
    sections.push({
      title: `Exam Questions [${totalMarks} marks]`,
      type: "questions",
      content: questionsContent,
    });
  } else {
    // Split into Section A and Section B
    const midpoint = Math.ceil(questions.length / 2);
    const sectionA = questions.slice(0, midpoint);
    const sectionB = questions.slice(midpoint);
    const marksA = sectionA.reduce((s, q) => s + (q.marks ?? 0), 0);
    const marksB = sectionB.reduce((s, q) => s + (q.marks ?? 0), 0);

    sections.push({
      title: `Section A [${marksA} marks]`,
      type: "questions",
      content: sectionA.map((q, i) => formatQuestionSEND(q, i + 1, params.sendNeed)).join("\n\n"),
    });
    sections.push({
      title: `Section B [${marksB} marks]`,
      type: "questions",
      content: sectionB.map((q, i) => formatQuestionSEND(q, midpoint + i + 1, params.sendNeed)).join("\n\n"),
    });
  }

  // 4. Mark scheme (teacher only)
  if (params.includeAnswers !== false) {
    sections.push({
      title: "Mark Scheme",
      type: "mark-scheme",
      teacherOnly: true,
      content: buildMarkScheme(questions),
    });
  }

  // 5. Teacher notes (teacher only)
  sections.push({
    title: "Teacher Notes",
    type: "teacher-notes",
    teacherOnly: true,
    content: buildTeacherNotes(questions, params),
  });

  const topicLabel = params.topic || "Mixed Topics";
  const mins = parseInt(params.worksheetLength || "30", 10);

  return {
    title: `${boardLabel} ${params.subject} Past Paper Practice — ${topicLabel}${tier_label}`,
    subtitle: `${params.yearGroup} | ${boardLabel} GCSE | ${totalMarks} marks | ${mins} minutes`,
    sections,
    metadata: {
      subject: params.subject,
      topic: topicLabel,
      yearGroup: params.yearGroup,
      difficulty: params.difficulty || "mixed",
      examBoard: boardLabel,
      totalMarks,
      estimatedTime: `${mins} minutes`,
      adaptations: params.sendNeed && params.sendNeed !== "none" && params.sendNeed !== "general"
        ? [`Formatted for ${params.sendNeed}`, "Increased line spacing", "Verbatim past paper questions"]
        : ["Verbatim past paper questions", "Standard formatting"],
      isExamPaper: true,
      questionsUsed: questions.map(q => ({
        id: q.id,
        board: q.board,
        year: q.year,
        paper: q.paper,
      })),
    },
    isAI: false,
    isExamPaper: true,
  };
}

/**
 * Get a summary of available past paper questions for display in the UI.
 */
export function getPastPaperDatabaseInfo() {
  return getDatabaseSummary();
}

/**
 * Check if the database has questions for a given subject and board.
 */
export function hasPastPaperQuestions(subject: string, board?: string): boolean {
  const normSubject = normaliseSubject(subject);
  const count = getExamQuestions({ subject: normSubject, board, limit: 1 }).length;
  return count > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// HYBRID EXAM WORKSHEET BUILDER
// ─────────────────────────────────────────────────────────────────────────────
// When exam questions are ticked, this function takes an AI-generated worksheet
// and replaces the exercise sections (guided, independent, challenge) with REAL
// exam questions from the bank, sorted by marks (low → high).
// The rest of the worksheet (learning objectives, vocab, worked example, etc.)
// remains exactly the same as the normal AI worksheet.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect if a question requires a source text to be printed.
 * English questions often reference "Source A", "Source B", "lines 1–4" etc.
 */
function questionRequiresSource(q: PastPaperQuestion): boolean {
  const text = (q.text || "").toLowerCase();
  return (
    text.includes("source a") ||
    text.includes("source b") ||
    text.includes("source c") ||
    text.includes("read lines") ||
    text.includes("read again") ||
    text.includes("refer to source") ||
    text.includes("from the text") ||
    text.includes("from source") ||
    text.includes("from lines") ||
    text.includes("in lines") ||
    text.includes("the passage") ||
    text.includes("the extract") ||
    text.includes("the article")
  );
}

/**
 * Get the exam board past papers URL for source text downloads.
 */
function getBoardPastPapersUrl(board?: string): string {
  const b = (board || "AQA").toUpperCase();
  if (b === "AQA") return "https://www.aqa.org.uk/past-papers" // kept: external link only;
  if (b === "EDEXCEL" || b === "PEARSON") return "https://qualifications.pearson.com/en/support/support-topics/exams/past-papers.html";
  if (b === "OCR") return "https://www.ocr.org.uk/administration/support-and-tools/past-papers/";
  if (b === "WJEC") return "https://www.wjec.co.uk/resources/";
  if (b === "CCEA") return "https://ccea.org.uk/learning-resources/past-papers";
  return "https://www.aqa.org.uk/past-papers";
}

/**
 * Build a source text warning for teacher notes when questions require printed sources.
 */
function buildSourceWarning(questions: PastPaperQuestion[]): string {
  const questionsNeedingSource = questions.filter(questionRequiresSource);
  if (questionsNeedingSource.length === 0) return "";

  const boards = Array.from(new Set(questionsNeedingSource.map(q => q.board).filter(Boolean)));
  const papers = Array.from(new Set(questionsNeedingSource.map(q => `${q.board} ${q.year} ${q.paper}`).filter(Boolean)));

  let warning = `\n\n---\n\n## ⚠️ PRINT REQUIRED — SOURCE TEXTS\n\n`;
  warning += `> **ACTION REQUIRED:** ${questionsNeedingSource.length} question${questionsNeedingSource.length > 1 ? "s" : ""} on this worksheet require${questionsNeedingSource.length === 1 ? "s" : ""} a printed source text (passage/extract). Students CANNOT answer these questions without the source text.\n\n`;
  warning += `**Questions requiring source texts:**\n`;
  questionsNeedingSource.forEach((q, i) => {
    const qIdx = questions.indexOf(q) + 1;
    warning += `- Q${qIdx}: ${(q.text || "").substring(0, 80)}... *(${q.board} ${q.year}, ${q.paper})*\n`;
  });
  warning += `\n**Download source texts from:**\n`;
  boards.forEach(board => {
    const url = getBoardPastPapersUrl(board);
    warning += `- **${board}:** [${url}](${url})\n`;
  });
  warning += `\n**Papers needed:** ${papers.join("; ")}\n`;
  warning += `\n> 💡 **Tip:** Download the full question paper PDF from the exam board website. The source texts (passages/extracts) are printed at the beginning of the paper. Print these pages separately for students before the lesson.\n`;

  return warning;
}

/**
 * Build a formatted exam questions section from real past paper questions.
 * Questions are sorted by marks (low → high) to scaffold difficulty.
 */
function buildExamQuestionsSection(
  questions: PastPaperQuestion[],
  sectionTitle: string,
  sendNeed?: string
): AIWorksheetSection {
  // Sort by marks ascending (low mark questions first)
  const sorted = [...questions].sort((a, b) => (a.marks || 0) - (b.marks || 0));
  const totalMarks = sorted.reduce((sum, q) => sum + (q.marks || 0), 0);
  const content = sorted.map((q, i) => formatQuestionSEND(q, i + 1, sendNeed)).join("\n\n");

  return {
    title: `${sectionTitle} [${totalMarks} marks]`,
    type: "questions",
    content,
  };
}

export interface HybridExamWorksheetParams {
  aiWorksheet: AIWorksheetResult;
  subject: string;
  topic?: string;
  yearGroup: string;
  examBoard?: string;
  difficulty?: string;
  sendNeed?: string;
  includeAnswers?: boolean;
  worksheetLength?: string;
}

/**
 * Build a hybrid exam worksheet:
 * - Keeps the AI-generated structure (learning objectives, vocab, worked example, self-reflection)
 * - Replaces exercise sections (guided, independent, challenge) with real exam questions
 * - Adds source text warnings in teacher notes when needed
 * - Questions are sorted low marks → high marks
 */
export function buildHybridExamWorksheet(params: HybridExamWorksheetParams): AIWorksheetResult {
  const { aiWorksheet, subject, topic, yearGroup, examBoard, difficulty, sendNeed, includeAnswers, worksheetLength } = params;

  const normSubject = normaliseSubject(subject);
  const board = examBoard && examBoard !== "none" ? examBoard : "Adaptly";
  const tier = normaliseTier(difficulty);
  const questionCount = getQuestionCount(worksheetLength);
  const yearGroupNum = parseYearGroupNumber(yearGroup);
  const topicFilter = topic && topic.toLowerCase() !== "general" ? topic : undefined;

  // Fetch real exam questions from the bank
  let questions = getExamQuestions({
    subject: normSubject,
    board,
    tier,
    topic: topicFilter,
    limit: questionCount,
    yearMin: 2010,
    yearGroup: yearGroupNum,
  });

  // Fallback attempts if not enough questions
  if (questions.length < 3) {
    questions = getExamQuestions({ subject: normSubject, tier, topic: topicFilter, limit: questionCount, yearMin: 2010, yearGroup: yearGroupNum });
  }
  if (questions.length < 3) {
    questions = getExamQuestions({ subject: normSubject, topic: topicFilter, limit: questionCount, yearMin: 2010, yearGroup: yearGroupNum });
  }
  if (questions.length < 3) {
    questions = getExamQuestions({ subject: normSubject, topic: topicFilter, limit: questionCount, yearMin: 2010 });
  }
  if (questions.length === 0) {
    questions = getExamQuestions({ subject: normSubject, limit: questionCount, yearMin: 2010 });
  }

  // Sort all questions by marks ascending (low → high) for scaffolded difficulty
  const sortedQuestions = [...questions].sort((a, b) => (a.marks || 0) - (b.marks || 0));

  // Split into sections: guided (low marks), core (mid marks), challenge (high marks)
  const third = Math.ceil(sortedQuestions.length / 3);
  const guidedQs = sortedQuestions.slice(0, third);
  const coreQs = sortedQuestions.slice(third, third * 2);
  const challengeQs = sortedQuestions.slice(third * 2);

  // Build the exam questions sections
  const examSections: AIWorksheetSection[] = [];

  if (questions.length === 0) {
    // No questions found — show informative message
    examSections.push({
      title: "Exam Questions",
      type: "questions",
      content: `> **Note:** No past paper questions were found in the database for ${subject} (${board}${tier ? ` — ${tier} Tier` : ""}).
>
> The database currently contains questions for: Mathematics, English Language, English Literature, Biology, Chemistry, Physics, History, Geography (GCSE-style, exam-ready).
>
> In the meantime, please use the AI-generated questions above for practice.`,
    });
  } else if (sortedQuestions.length <= 5) {
    // Small set — single section
    examSections.push(buildExamQuestionsSection(sortedQuestions, "Exam Practice Questions", sendNeed));
  } else {
    // Split into guided, core, challenge
    if (guidedQs.length > 0) {
      examSections.push(buildExamQuestionsSection(guidedQs, "Section A — Guided Practice (Exam Questions)", sendNeed));
    }
    if (coreQs.length > 0) {
      examSections.push(buildExamQuestionsSection(coreQs, "Section B — Core Practice (Exam Questions)", sendNeed));
    }
    if (challengeQs.length > 0) {
      examSections.push(buildExamQuestionsSection(challengeQs, "Section C — Stretch & Challenge (Exam Questions)", sendNeed));
    }
  }

  // Build mark scheme for exam questions
  const examMarkScheme: AIWorksheetSection = {
    title: "Mark Scheme (Exam Questions)",
    type: "mark-scheme",
    teacherOnly: true,
    content: buildMarkScheme(sortedQuestions),
  };

  // Build source text warning if needed
  const sourceWarning = buildSourceWarning(sortedQuestions);

  // Rebuild the worksheet sections:
  // Keep: objective, vocabulary, key formulas, worked example, self-reflection
  // Replace: guided, independent, challenge sections with real exam questions
  // Keep: teacher notes (with source warning appended), mark scheme (replaced with exam mark scheme)
  console.log('[HybridExam] AI worksheet sections:', aiWorksheet.sections.map(s => `${s.type}:${s.title}`));
  console.log('[HybridExam] Questions found:', questions.length, sortedQuestions.map(q => `${q.marks}m:${q.text?.substring(0,30)}`));
  const EXERCISE_TYPES = new Set(["guided", "independent", "challenge", "questions", "mark-scheme"]);
  const TEACHER_TYPES = new Set(["teacher-notes", "teacher-only"]);

  const keptSections = aiWorksheet.sections.filter(s => {
    // Remove exercise sections and old mark scheme (will be replaced)
    if (EXERCISE_TYPES.has(s.type)) return false;
    // Keep teacher notes (we'll modify them)
    return true;
  });

  // Find and update teacher notes with source warning
  const updatedSections = keptSections.map(s => {
    if (TEACHER_TYPES.has(s.type) || s.title.toLowerCase().includes("teacher")) {
      return {
        ...s,
        content: s.content + sourceWarning,
      };
    }
    return s;
  });

  // Insert exam questions before teacher notes/mark scheme
  const teacherSections = updatedSections.filter(s => TEACHER_TYPES.has(s.type) || s.title.toLowerCase().includes("teacher") || s.type === "teacher-notes");
  const nonTeacherSections = updatedSections.filter(s => !TEACHER_TYPES.has(s.type) && !s.title.toLowerCase().includes("teacher") && s.type !== "teacher-notes");

  const totalMarks = sortedQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const boardLabel = board !== "none" ? board : "Adaptly";

  return {
    ...aiWorksheet,
    title: aiWorksheet.title.replace(/worksheet/i, "Exam Practice Worksheet"),
    subtitle: `${yearGroup} | ${subject} | ${boardLabel} | ${totalMarks} marks`,
    sections: [
      ...nonTeacherSections,
      ...examSections,
      examMarkScheme,
      ...teacherSections,
    ],
    metadata: {
      ...aiWorksheet.metadata,
      totalMarks,
      examBoard: boardLabel,
      adaptations: [
        ...(aiWorksheet.metadata.adaptations || []),
        "Real exam questions from past papers",
        `Questions sorted low → high marks`,
      ],
    },
    isAI: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTED QUESTIONS WORKSHEET BUILDER (Exam Hub Multi-Select)
// ─────────────────────────────────────────────────────────────────────────────
// When a user selects specific questions from the Exam Hub, this function
// builds a complete worksheet using those exact questions as the exercises.
// The AI generates intro sections (objectives, vocab, worked example) and the
// real exam questions are used as the exercise sections.
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectedQuestionsWorksheetParams {
  questions: PastPaperQuestion[];
  subject: string;
  yearGroup: string;
  sendNeed?: string;
  includeAnswers?: boolean;
}

/**
 * Build a worksheet from user-selected exam questions.
 * Questions are sorted by marks (low → high) for scaffolded difficulty.
 * Time is estimated as ~1.5 minutes per mark.
 * Source text warnings are included in teacher notes.
 */
export function buildSelectedQuestionsWorksheet(
  params: SelectedQuestionsWorksheetParams
): AIWorksheetResult {
  const { questions, subject, yearGroup, sendNeed, includeAnswers } = params;

  if (questions.length === 0) {
    return {
      title: "Exam Practice Worksheet",
      subtitle: `${yearGroup} | ${subject}`,
      sections: [{
        title: "No Questions Selected",
        type: "questions",
        content: "> Please go back to the Exam Hub and select at least one question.",
      }],
      metadata: {
        subject,
        yearGroup,
        difficulty: "mixed",
        totalMarks: 0,
        estimatedTime: "0 minutes",
        adaptations: [],
      },
      isAI: true,
    };
  }

  // Sort by marks ascending (low → high) for scaffolded difficulty
  const sorted = [...questions].sort((a, b) => (a.marks || 0) - (b.marks || 0));
  const totalMarks = sorted.reduce((sum, q) => sum + (q.marks || 0), 0);
  // Estimate time: ~1.5 minutes per mark, minimum 5 minutes
  const estimatedMins = Math.max(5, Math.round(totalMarks * 1.5));

  // Determine boards and topics from selected questions
  const boards = Array.from(new Set(sorted.map(q => q.board).filter(Boolean)));
  const topics = Array.from(new Set(sorted.map(q => q.topic).filter(Boolean)));
  const boardLabel = boards.length === 1 ? boards[0]! : boards.join(", ");
  const topicLabel = topics.length <= 3 ? topics.join(", ") : `${topics.slice(0, 3).join(", ")} + ${topics.length - 3} more`;

  // Build exam question sections
  const examSections: AIWorksheetSection[] = [];

  if (sorted.length <= 5) {
    // Small set — single section
    examSections.push(buildExamQuestionsSection(sorted, "Exam Practice Questions", sendNeed));
  } else {
    // Split into guided (low marks), core (mid marks), challenge (high marks)
    const third = Math.ceil(sorted.length / 3);
    const guidedQs = sorted.slice(0, third);
    const coreQs = sorted.slice(third, third * 2);
    const challengeQs = sorted.slice(third * 2);

    if (guidedQs.length > 0) {
      examSections.push(buildExamQuestionsSection(guidedQs, "Section A — Foundation (Exam Questions)", sendNeed));
    }
    if (coreQs.length > 0) {
      examSections.push(buildExamQuestionsSection(coreQs, "Section B — Core Practice (Exam Questions)", sendNeed));
    }
    if (challengeQs.length > 0) {
      examSections.push(buildExamQuestionsSection(challengeQs, "Section C — Stretch & Challenge (Exam Questions)", sendNeed));
    }
  }

  // Build mark scheme
  const markSchemeSection: AIWorksheetSection = {
    title: "Mark Scheme (Exam Questions)",
    type: "mark-scheme",
    teacherOnly: true,
    content: buildMarkScheme(sorted),
  };

  // Build source text warning
  const sourceWarning = buildSourceWarning(sorted);

  // Build teacher notes with source links
  let teacherContent = `**Teacher Notes**\n\n`;
  teacherContent += `**Questions sourced from:** ${boardLabel} past papers\n\n`;
  teacherContent += `**Topics covered:** ${topicLabel}\n\n`;
  teacherContent += `**Total marks:** ${totalMarks}\n\n`;
  teacherContent += `**Estimated time:** ${estimatedMins} minutes (~1.5 min per mark)\n\n`;
  teacherContent += `**Questions selected:** ${sorted.length} questions hand-picked from the Exam Hub\n\n`;

  if (sendNeed && sendNeed !== "none" && sendNeed !== "general" && sendNeed !== "none-selected") {
    teacherContent += `**SEND considerations:**\n`;
    teacherContent += `- Paper formatted for: ${sendNeed}\n`;
    teacherContent += `- Increased line spacing applied\n`;
    teacherContent += `- Font size increased for readability\n\n`;
  }

  teacherContent += `**Individual question sources:**\n`;
  sorted.forEach((q, i) => {
    const url = getBoardPastPapersUrl(q.board);
    teacherContent += `- Q${i + 1}: ${q.board} ${q.year} — ${q.paper}, Q${q.questionNum} [${q.marks} mark${q.marks !== 1 ? "s" : ""}] — [Download paper](${url})\n`;
  });

  teacherContent += sourceWarning;

  const teacherSection: AIWorksheetSection = {
    title: "Teacher Notes",
    type: "teacher-notes",
    teacherOnly: true,
    content: teacherContent,
  };

  // Build info box if maths/science
  const infoBoxContent = buildInfoBox(subject, boardLabel);
  const infoSection: AIWorksheetSection | null = infoBoxContent ? {
    title: "Information",
    type: "example",
    content: infoBoxContent,
  } : null;

  // Self-reflection section
  const reflectionSection: AIWorksheetSection = {
    title: "How Did I Do?",
    type: "self-reflection",
    content: topics.slice(0, 4).map(t =>
      `I can answer exam questions about ${t}`
    ).join("\n") + "\nQ: Which question did you find most challenging and why?",
  };

  // Assemble all sections
  const allSections: AIWorksheetSection[] = [];
  if (infoSection) allSections.push(infoSection);
  allSections.push(...examSections);
  allSections.push(reflectionSection);
  if (includeAnswers !== false) allSections.push(markSchemeSection);
  allSections.push(teacherSection);

  return {
    title: `Exam Practice Worksheet — ${topicLabel}`,
    subtitle: `${yearGroup} | ${subject} | ${boardLabel} | ${totalMarks} marks | ${estimatedMins} mins`,
    sections: allSections,
    metadata: {
      subject,
      topic: topicLabel,
      yearGroup,
      difficulty: "mixed",
      examBoard: boardLabel,
      totalMarks,
      estimatedTime: `${estimatedMins} minutes`,
      adaptations: [
        "Hand-picked exam questions from past papers",
        `Questions sorted low → high marks`,
        `${sorted.length} questions, ${totalMarks} total marks`,
      ],
    },
    isAI: true,
  };
}
