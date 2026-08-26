import { BASELINE_BANKS, plannedAssessmentSeconds, totalAssessmentMarks, type BaselineQuestion } from "../client/src/lib/baselineAssessmentBank";

const SUBJECTS = ["mathematics", "english", "science"] as const;
const YEARS = ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11"] as const;
const DURATIONS = [5, 8, 12] as const;

type Finding = { severity: "error" | "warning"; code: string; subject: string; year: string; id: string; detail: string };
const findings: Finding[] = [];
const add = (severity: Finding["severity"], code: string, q: BaselineQuestion, detail: string) => findings.push({ severity, code, subject: q.subject, year: q.yearGroup, id: q.id, detail });
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const allIds = new Set<string>();
const prompts = new Map<string, BaselineQuestion[]>();
const report: Array<Record<string, unknown>> = [];

for (const subject of SUBJECTS) {
  for (const year of YEARS) {
    const questions = BASELINE_BANKS[subject][year];
    if (!questions || questions.length !== 12) {
      findings.push({ severity: "error", code: "BANK_LENGTH", subject, year, id: "bank", detail: `Expected 12 questions; found ${questions?.length ?? 0}.` });
      continue;
    }
    const firstFiveDomains = new Set(questions.slice(0, 5).map((q) => q.domain));
    const firstEightDomains = new Set(questions.slice(0, 8).map((q) => q.domain));
    report.push({
      subject,
      year,
      questionCount: questions.length,
      fiveMinuteRoute: { questions: 5, marks: totalAssessmentMarks(questions.slice(0, 5)), plannedSeconds: plannedAssessmentSeconds(questions.slice(0, 5)), domains: [...firstFiveDomains] },
      thirtyMinuteRoute: { questions: 8, marks: totalAssessmentMarks(questions.slice(0, 8)), plannedSeconds: plannedAssessmentSeconds(questions.slice(0, 8)), domains: [...firstEightDomains] },
      fullRoute: { questions: 12, marks: totalAssessmentMarks(questions), plannedSeconds: plannedAssessmentSeconds(questions), domains: [...new Set(questions.map((q) => q.domain))] },
    });

    for (const q of questions) {
      if (q.subject !== subject || q.yearGroup !== year) add("error", "IDENTITY", q, "Subject or year does not match its parent bank.");
      if (!q.id || allIds.has(q.id)) add("error", "DUPLICATE_ID", q, "Question ID is missing or duplicated.");
      allIds.add(q.id);
      if (!q.prompt || !q.correctAnswer || !q.explanation || !q.curriculumReference) add("error", "REQUIRED_FIELD", q, "Prompt, answer, explanation and curriculum reference are required.");
      if (!Number.isInteger(q.marks) || q.marks < 1 || q.marks > 4) add("error", "MARK_RANGE", q, `Marks must be an integer from 1–4; found ${q.marks}.`);
      if (q.suggestedSeconds < 60 || q.suggestedSeconds > 300) add("error", "TIME_RANGE", q, `Suggested time must be 60–300 seconds; found ${q.suggestedSeconds}.`);
      if (q.suggestedSeconds < q.marks * 50) add("warning", "TIME_MARK_RATIO", q, `${q.marks} marks have only ${q.suggestedSeconds} seconds.`);
      if (q.kind === "multiple-choice") {
        const matches = (q.options || []).filter((option) => option.trim() === q.correctAnswer.trim());
        if (!q.options || q.options.length !== 4 || matches.length !== 1) add("error", "CHOICE_KEY", q, "A multiple-choice item needs four displayed options and exactly one exact matching correct option.");
      }
      if (q.kind === "short-answer" && q.marks >= 2 && (!q.acceptedAnswers || q.acceptedAnswers.length === 0)) add("warning", "LIMITED_VARIANTS", q, "A multi-mark short answer has no accepted alternative phrasing.");
      const key = normalise(q.prompt);
      prompts.set(key, [...(prompts.get(key) || []), q]);
    }
    if (firstFiveDomains.size < 3) findings.push({ severity: "warning", code: "SHORT_ROUTE_COVERAGE", subject, year, id: "bank", detail: `First five questions cover only ${firstFiveDomains.size} domains.` });
    if (firstEightDomains.size < 4) findings.push({ severity: "warning", code: "MEDIUM_ROUTE_COVERAGE", subject, year, id: "bank", detail: `First eight questions cover only ${firstEightDomains.size} domains.` });
  }
}

for (const duplicates of prompts.values()) {
  if (duplicates.length > 1) for (const q of duplicates) add("warning", "DUPLICATE_PROMPT", q, `Duplicate normalised prompt across: ${duplicates.map((item) => item.id).join(", ")}.`);
}

const output = {
  totals: {
    questions: Array.from(allIds).length,
    errors: findings.filter((finding) => finding.severity === "error").length,
    warnings: findings.filter((finding) => finding.severity === "warning").length,
  },
  routes: report,
  findings,
};
console.log(JSON.stringify(output, null, 2));
