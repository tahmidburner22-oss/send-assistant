/**
 * CreateExamPaper.tsx — Phase E PR-B.
 *
 * Tool page for the Create-an-Exam-Paper feature. The teacher picks a
 * subject, selects one or more topics (or fine-grained subtopics), enters
 * a target mark total, and the page calls `buildCreatedExamPaper` (the
 * pure assembly engine in `client/src/lib/createExamPaperBuilder.ts`)
 * which emits the same `ExamPaperWorksheet` shape the existing
 * `examPaperBuilder.ts` builders produce.
 *
 * Self-contained — no AIToolPage / no AI generation. The page renders
 * the assembled paper inline with a Print button (uses `window.print()`).
 * Class-pack and PDF export are deliberately deferred to a follow-up
 * PR; the engine emits the canonical worksheet shape so plugging it
 * into pdf-generator-v2 / Class Pack later is one extra import away.
 */

import { useMemo, useState } from "react";
import { ScrollText, Plus, X, Printer, AlertCircle } from "lucide-react";
import {
  buildCreatedExamPaper,
  type CreatedExamPaperParams,
  type CreatedExamPaperResult,
} from "@/lib/createExamPaperBuilder";
import {
  getTopicsForSubject,
  getSubtopicsForTopic,
  getCandidatePoolForTopics,
} from "@/lib/pastPaperQuestions";

// ── Canonical subject IDs (must match q.subject in the bank) ─────────────
const SUBJECT_OPTIONS: { value: string; label: string }[] = [
  { value: "mathematics", label: "Mathematics" },
  { value: "biology", label: "Biology" },
  { value: "chemistry", label: "Chemistry" },
  { value: "physics", label: "Physics" },
  { value: "english-language", label: "English Language" },
  { value: "english-literature", label: "English Literature" },
  { value: "history", label: "History" },
  { value: "geography", label: "Geography" },
  { value: "computer-science", label: "Computer Science" },
];

const YEAR_OPTIONS: { value: number | ""; label: string }[] = [
  { value: "", label: "Any" },
  { value: 7, label: "Year 7" },
  { value: 8, label: "Year 8" },
  { value: 9, label: "Year 9" },
  { value: 10, label: "Year 10" },
  { value: 11, label: "Year 11" },
  { value: 12, label: "Year 12" },
  { value: 13, label: "Year 13" },
];

const MARK_PRESETS = [40, 60, 80, 100];

export default function CreateExamPaper() {
  const [subject, setSubject] = useState<string>("mathematics");
  const [yearGroup, setYearGroup] = useState<number | "">(11);
  const [tier, setTier] = useState<"" | "Higher" | "Foundation">("");
  const [calculator, setCalculator] = useState<"any" | "yes" | "no">("any");
  const [totalMarks, setTotalMarks] = useState<number>(80);
  const [paperStyle, setPaperStyle] = useState<"real-exam" | "single-section">("real-exam");
  const [includeAnswers, setIncludeAnswers] = useState<boolean>(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [result, setResult] = useState<CreatedExamPaperResult | null>(null);

  // Topics for the chosen subject, with per-topic question counts.
  const topicsWithCounts = useMemo(() => {
    if (!subject) return [];
    const tier_ = tier || undefined;
    const yg = yearGroup || undefined;
    const topics = getTopicsForSubject(subject);
    return topics.map(topic => {
      const pool = getCandidatePoolForTopics({ subject, topics: [topic], tier: tier_, yearGroup: yg });
      const subtopics = getSubtopicsForTopic(topic).map(sub => {
        const subPool = getCandidatePoolForTopics({ subject, topics: [sub], tier: tier_, yearGroup: yg });
        return { name: sub, count: subPool.length };
      });
      return { topic, count: pool.length, subtopics };
    });
  }, [subject, tier, yearGroup]);

  function toggleTopic(name: string) {
    setSelectedTopics(prev => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]);
  }

  function clearTopics() {
    setSelectedTopics([]);
  }

  function generate() {
    if (selectedTopics.length === 0) return;
    const params: CreatedExamPaperParams = {
      subject,
      topics: selectedTopics,
      totalMarks,
      tier: tier || undefined,
      yearGroup: yearGroup || undefined,
      calculator: calculator === "any" ? undefined : calculator === "yes",
      paperStyle,
      includeAnswers,
    };
    const r = buildCreatedExamPaper(params);
    setResult(r);
    // Scroll to the result.
    setTimeout(() => {
      document.getElementById("create-exam-paper-output")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 print:p-0 print:max-w-none">
      {/* Header — hidden on print so the printed paper is clean. */}
      <div className="print:hidden mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-rose-700 rounded-lg p-2.5">
            <ScrollText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create an Exam Paper</h1>
        </div>
        <p className="text-sm text-slate-600 max-w-2xl">
          Pick a subject, select the topics you want covered, and set the total marks.
          The tool assembles a real-style exam paper from the question bank — warm-up,
          core and stretch sections, balanced AOs, with an optional teacher mark scheme.
        </p>
      </div>

      {/* Form. */}
      <div className="print:hidden bg-white rounded-xl border border-slate-200 p-6 mb-6 space-y-5">
        {/* Subject + year + tier row. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Subject">
            <select
              className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm"
              value={subject}
              onChange={e => { setSubject(e.target.value); setSelectedTopics([]); setResult(null); }}
              data-testid="create-exam-subject"
            >
              {SUBJECT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Year group">
            <select
              className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm"
              value={String(yearGroup)}
              onChange={e => setYearGroup(e.target.value ? Number(e.target.value) : "")}
            >
              {YEAR_OPTIONS.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Tier">
            <select
              className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm"
              value={tier}
              onChange={e => setTier(e.target.value as "" | "Higher" | "Foundation")}
            >
              <option value="">Any</option>
              <option value="Higher">Higher</option>
              <option value="Foundation">Foundation</option>
            </select>
          </Field>
        </div>

        {/* Topic chips. */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Topics ({selectedTopics.length} selected)
            </label>
            {selectedTopics.length > 0 && (
              <button
                type="button"
                onClick={clearTopics}
                className="text-xs text-rose-700 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          {topicsWithCounts.length === 0 && (
            <p className="text-sm text-slate-500 py-2">
              No topics found for this subject in the bank.
            </p>
          )}
          <div className="space-y-3 max-h-96 overflow-y-auto border border-slate-200 rounded-md p-3">
            {topicsWithCounts.map(group => (
              <div key={group.topic}>
                <button
                  type="button"
                  onClick={() => toggleTopic(group.topic)}
                  className={`text-left w-full px-3 py-2 rounded-md border text-sm font-medium transition-colors ${
                    selectedTopics.includes(group.topic)
                      ? "bg-rose-50 border-rose-300 text-rose-800"
                      : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {selectedTopics.includes(group.topic) ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    <span>{group.topic}</span>
                    <span className="text-xs text-slate-500 ml-1">({group.count} Qs)</span>
                  </span>
                </button>
                {group.subtopics.length > 0 && (
                  <div className="mt-1.5 ml-5 flex flex-wrap gap-1.5">
                    {group.subtopics.map(sub => (
                      <button
                        key={sub.name}
                        type="button"
                        onClick={() => toggleTopic(sub.name)}
                        className={`text-xs px-2 py-1 rounded-full border ${
                          selectedTopics.includes(sub.name)
                            ? "bg-rose-100 border-rose-300 text-rose-800"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                        title={`${sub.count} questions in the bank`}
                      >
                        {sub.name} <span className="text-slate-400">({sub.count})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Marks + calculator + style row. */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Field label="Total marks">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                max={200}
                value={totalMarks}
                onChange={e => setTotalMarks(Math.max(10, Math.min(200, Number(e.target.value) || 80)))}
                className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm"
              />
            </div>
            <div className="flex gap-1 mt-1">
              {MARK_PRESETS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTotalMarks(m)}
                  className={`text-xs px-2 py-0.5 rounded ${
                    totalMarks === m ? "bg-rose-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Calculator">
            <select
              className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm"
              value={calculator}
              onChange={e => setCalculator(e.target.value as "any" | "yes" | "no")}
            >
              <option value="any">Any</option>
              <option value="yes">Allowed</option>
              <option value="no">Not allowed</option>
            </select>
          </Field>
          <Field label="Paper style">
            <select
              className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm"
              value={paperStyle}
              onChange={e => setPaperStyle(e.target.value as "real-exam" | "single-section")}
            >
              <option value="real-exam">Real exam (warm-up / core / stretch)</option>
              <option value="single-section">Single section</option>
            </select>
          </Field>
          <Field label="Mark scheme">
            <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-300 bg-white text-sm">
              <input
                type="checkbox"
                checked={includeAnswers}
                onChange={e => setIncludeAnswers(e.target.checked)}
              />
              <span>Include teacher mark scheme</span>
            </label>
          </Field>
        </div>

        {/* Generate button. */}
        <div className="pt-2">
          <button
            type="button"
            onClick={generate}
            disabled={selectedTopics.length === 0}
            className={`px-6 py-2.5 rounded-md text-sm font-semibold ${
              selectedTopics.length === 0
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-rose-700 text-white hover:bg-rose-800"
            }`}
            data-testid="create-exam-generate"
          >
            Generate paper
          </button>
          {selectedTopics.length === 0 && (
            <span className="ml-3 text-xs text-slate-500">Pick at least one topic to begin.</span>
          )}
        </div>
      </div>

      {/* Result. */}
      {result && (
        <div id="create-exam-paper-output" className="space-y-4">
          {/* Action bar — hidden on print. */}
          <div className="print:hidden flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
            <div>
              <div className="text-sm font-semibold text-slate-800">{result.worksheet.title}</div>
              <div className="text-xs text-slate-500">{result.worksheet.subtitle}</div>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 text-white text-sm hover:bg-slate-900"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>

          {/* Warnings — hidden on print. */}
          {result.warnings.length > 0 && (
            <div className="print:hidden bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5" />
                <div className="text-sm font-semibold text-amber-900">
                  {result.warnings.length === 1 ? "1 warning" : `${result.warnings.length} warnings`}
                </div>
              </div>
              <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5 ml-1">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Printable paper. */}
          <div className="bg-white rounded-xl border border-slate-200 print:border-0 p-8 print:p-0">
            {/* Title block. */}
            <div className="text-center mb-6 print:mb-4">
              <h2 className="text-2xl font-bold text-slate-900">{result.worksheet.title}</h2>
              <p className="text-sm text-slate-600 mt-1">{result.worksheet.subtitle}</p>
              <p className="text-xs text-slate-500 mt-1">
                Total marks: {result.worksheet.metadata.totalMarks} · Time: {result.worksheet.metadata.estimatedTime}
                {result.worksheet.metadata.adaptations.length > 0 && (
                  <> · {result.worksheet.metadata.adaptations.join(" · ")}</>
                )}
              </p>
            </div>

            {/* Sections. */}
            {result.worksheet.sections.map((s, idx) => (
              <div
                key={idx}
                className={`mb-6 print:mb-4 ${s.teacherOnly ? "print:break-before-page" : ""}`}
              >
                <h3 className={`text-lg font-bold mb-3 pb-1 border-b ${
                  s.teacherOnly ? "text-cyan-800 border-cyan-300" : "text-slate-900 border-slate-300"
                }`}>
                  {s.title}
                  {s.teacherOnly && (
                    <span className="ml-2 text-xs font-normal text-cyan-700 print:hidden">(teacher only)</span>
                  )}
                </h3>
                <pre className="font-sans text-sm whitespace-pre-wrap text-slate-800 leading-relaxed">
                  {s.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
