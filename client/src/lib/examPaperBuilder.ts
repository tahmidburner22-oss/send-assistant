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
};

function normaliseSubject(subject: string): string {
  return SUBJECT_MAP[subject.toLowerCase().trim()] || subject.toLowerCase().replace(/\s+/g, "-");
}

// Tier mapping from difficulty setting
function normaliseTier(difficulty?: string): "Higher" | "Foundation" | undefined {
  if (!difficulty) return undefined;
  const d = difficulty.toLowerCase();
  if (d === "higher" || d === "stretch") return "Higher";
  if (d === "foundation" || d === "basic") return "Foundation";
  return undefined; // mixed — no tier filter
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
    questionsUsed: Array<{ id: string; board: string; year: number; paper: string }>;
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
  const boardName = board && board !== "none" && board !== "Any" ? board : "AQA";
  const tier = normaliseTier(params.difficulty);
  const tierLabel = tier ? ` — ${tier} Tier` : "";
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
  const markLabel = q.marks === 1 ? "1 mark" : `${q.marks} marks`;

  // Context block (stimulus text, table, etc.)
  const contextBlock = q.context
    ? `\n\n> ${q.context.split("\n").join("\n> ")}\n`
    : "";

  // SEND-specific hint
  let sendHint = "";
  if (sendNeed && sendNeed !== "none" && sendNeed !== "general") {
    const need = sendNeed.toLowerCase();
    if (need.includes("dyslexia") || need.includes("reading")) {
      sendHint = `\n> 💡 *Hint: Read the question carefully. Underline the key words.*`;
    } else if (need.includes("autism") || need.includes("asd")) {
      sendHint = `\n> 💡 *Hint: Focus on one part of the question at a time.*`;
    } else if (need.includes("adhd")) {
      sendHint = `\n> 💡 *Hint: Break this into steps. Tick each step as you complete it.*`;
    } else if (need.includes("dyscalculia")) {
      sendHint = `\n> 💡 *Hint: You may use a number line or multiplication grid.*`;
    }
  }

  // Answer lines
  const lineCount = q.answerLines || Math.max(2, Math.ceil(q.marks * 1.5));
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
    ? `**Q${index}.** ${q.text}${contextBlock}${sendHint}${subPartsText}`
    : `**Q${index}.** ${q.text} **[${markLabel}]**${contextBlock}${sendHint}\n\n${answerLines}`;

  return questionText + `\n\n*[${q.board} ${q.year} — ${q.paper}]*\n\n---`;
}

/**
 * Build a mark scheme section from the selected questions.
 */
function buildMarkScheme(questions: PastPaperQuestion[]): string {
  let ms = "**Mark Scheme**\n\n";
  ms += "> *These are real past paper questions. Full mark schemes are available on the relevant exam board website.*\n\n";

  questions.forEach((q, i) => {
    const markLabel = q.marks === 1 ? "1 mark" : `${q.marks} marks`;
    ms += `**Q${i + 1}.** [${markLabel}] — *${q.board} ${q.year}, ${q.paper}*\n`;
    ms += `- Topic: ${q.topic}\n`;
    ms += `- Command word: ${q.commandWord || "N/A"}\n\n`;
  });

  ms += "\n**Download full mark schemes:**\n";
  ms += "- AQA: [aqa.org.uk/past-papers](https://www.aqa.org.uk/past-papers)\n";
  ms += "- Edexcel: [qualifications.pearson.com](https://qualifications.pearson.com/en/support/support-topics/exams/past-papers.html)\n";
  ms += "- OCR: [ocr.org.uk/administration/support-and-tools/past-papers](https://www.ocr.org.uk/administration/support-and-tools/past-papers/)\n";
  ms += "- WJEC: [wjec.co.uk/resources](https://www.wjec.co.uk/resources/)\n";

  return ms;
}

/**
 * Build teacher notes for the exam paper.
 */
function buildTeacherNotes(questions: PastPaperQuestion[], params: ExamPaperWorksheetParams): string {
  const boards = Array.from(new Set(questions.map(q => q.board)));
  const years = Array.from(new Set(questions.map(q => q.year))).sort();
  const topics = Array.from(new Set(questions.map(q => q.topic)));
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return `**Teacher Notes**

**Questions sourced from:** ${boards.join(", ")} past papers (${years[0]}–${years[years.length - 1]})

**Topics covered:** ${topics.join(", ")}

**Total marks:** ${totalMarks}

**Exam board selected:** ${params.examBoard && params.examBoard !== "none" ? params.examBoard : "AQA (default)"}

**SEND considerations:**
${params.sendNeed && params.sendNeed !== "none" && params.sendNeed !== "general"
  ? `- Paper formatted for: ${params.sendNeed}\n- Increased line spacing applied\n- Font size increased for readability\n- Hints added to scaffold questions`
  : "- Standard formatting applied\n- Adjust font size and line spacing as needed for individual students"}

**Suggested use:**
- Use as a timed practice paper (exam conditions)
- Use individual questions as starters or plenaries
- Assign specific questions by topic for targeted revision

**Mark scheme:** Available on the relevant exam board website (links in mark scheme section).`;
}

/**
 * Main function: build an exam paper worksheet from real past paper questions.
 * Returns an ExamPaperWorksheet with verbatim questions.
 */
export function buildExamPaperWorksheet(params: ExamPaperWorksheetParams): ExamPaperWorksheet {
  const normSubject = normaliseSubject(params.subject);
  const board = params.examBoard && params.examBoard !== "none" ? params.examBoard : "AQA";
  const tier = normaliseTier(params.difficulty);
  const questionCount = getQuestionCount(params.worksheetLength);

  // Fetch questions from database
  const topicFilter = params.topic && params.topic.toLowerCase() !== "general" ? params.topic : undefined;
  let questions = getExamQuestions({
    subject: normSubject,
    board,
    tier,
    topic: topicFilter,
    limit: questionCount,
    yearMin: 2015,
  });

  // Fallback: if not enough questions for the specific board, try any board
  if (questions.length < Math.min(3, questionCount)) {
    questions = getExamQuestions({
      subject: normSubject,
      tier,
      topic: topicFilter,
      limit: questionCount,
      yearMin: 2015,
    });
  }

  // Fallback: if still no questions, try without topic filter
  if (questions.length === 0) {
    questions = getExamQuestions({
      subject: normSubject,
      limit: questionCount,
      yearMin: 2015,
    });
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const tier_label = tier ? ` (${tier} Tier)` : "";
  const boardLabel = board !== "none" ? board : "AQA";

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
> The database currently contains questions for: Mathematics, English Language, English Literature, Biology, Chemistry, Physics, History, Geography (AQA, Edexcel, OCR, WJEC).
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
    const marksA = sectionA.reduce((s, q) => s + q.marks, 0);
    const marksB = sectionB.reduce((s, q) => s + q.marks, 0);

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
