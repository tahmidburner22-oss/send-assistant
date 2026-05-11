import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { callAI } from "@/lib/ai";
import { formatToolOutput } from "@/lib/format-tool-output";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { downloadHtmlAsPdf, printWorksheetElement } from "@/lib/pdf-generator-v2";
import {
  CheckSquare, Sparkles, Loader2, Copy, Printer, Download,
  RefreshCw, Check, X, BarChart3, Target,
} from "lucide-react";
import interventionsData from "@/data/interventions";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Intervention {
  name: string;
  eefRating: number;
  ageRange: string;
  sendArea: string[];
  costTier: string;
  description: string;
}

interface SMARTCheck {
  hasNumber: boolean;
  hasTimeframe: boolean;
  hasMeasurable: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const interventions: Intervention[] = interventionsData as Intervention[];

const sendNeeds = ["Autism Spectrum Condition","ADHD","Dyslexia","Dyscalculia","Dyspraxia","Speech & Language Needs","Social, Emotional & Mental Health","Hearing Impairment","Visual Impairment","Physical Disability","Moderate Learning Difficulties","Severe Learning Difficulties","EAL"].map(n => ({ value: n, label: n }));
const areas = ["Reading","Writing","Maths","Communication","Social Skills","Behaviour & Self-Regulation","Independence","Fine Motor Skills","Gross Motor Skills","Attention & Focus","Emotional Regulation","Organisational Skills"].map(a => ({ value: a, label: a }));

const SCREENER_ID_TO_SEND_NEED: Record<string, string> = {
  adhd: "ADHD",
  dyslexia: "Dyslexia",
  autism: "Autism Spectrum Condition",
  dyscalculia: "Dyscalculia",
  dyspraxia: "Dyspraxia",
  slcn: "Speech & Language Needs",
  semh: "Social, Emotional & Mental Health",
  mld: "Moderate Learning Difficulties",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getKeyStageFromYear(yearGroup: string): { ks: string; minAge: number; maxAge: number } {
  const match = yearGroup.match(/(\d+)/);
  if (!match) return { ks: "KS1", minAge: 4, maxAge: 7 };
  const yr = parseInt(match[1]);
  if (yr <= 2) return { ks: "KS1", minAge: 4, maxAge: 7 };
  if (yr <= 6) return { ks: "KS2", minAge: 7, maxAge: 11 };
  if (yr <= 9) return { ks: "KS3", minAge: 11, maxAge: 14 };
  if (yr <= 11) return { ks: "KS4", minAge: 14, maxAge: 16 };
  return { ks: "KS5", minAge: 16, maxAge: 18 };
}

function filterInterventions(sendNeed: string, yearGroup: string): Intervention[] {
  const { minAge, maxAge } = getKeyStageFromYear(yearGroup);
  return interventions
    .filter(i => {
      const matchesNeed = i.sendArea.some(a => a.toLowerCase() === sendNeed.toLowerCase());
      if (!matchesNeed) return false;
      const ageMatch = i.ageRange.match(/(\d+)-(\d+)/);
      if (!ageMatch) return true;
      const iMin = parseInt(ageMatch[1]);
      const iMax = parseInt(ageMatch[2]);
      return iMin <= maxAge && iMax >= minAge;
    })
    .sort((a, b) => b.eefRating - a.eefRating)
    .slice(0, 5);
}

function validateSMART(targetText: string): SMARTCheck {
  const hasNumber = /\d+/.test(targetText);
  const hasTimeframe = /by\s+(the\s+end\s+of\s+|[A-Z][a-z]+\s+\d{4}|week\s+\d|term\s+\d)/i.test(targetText)
    || /within\s+\d+\s+(week|month|term)/i.test(targetText);
  const hasMeasurable = /from\s+\d+.*to\s+\d+/i.test(targetText)
    || /\d+\s*(out of|\/|percent|%)/i.test(targetText);
  return { hasNumber, hasTimeframe, hasMeasurable };
}

function parseTargets(text: string): string[] {
  const targets: string[] = [];
  const sections = text.split(/\*\*Target\s+\d+[:\*]/i);
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const endIdx = section.search(/\*\*(Baseline|SMART Check|Success Criteria|Strategies|Resources|Monitoring)[:\*]/i);
    const targetText = endIdx > 0 ? section.slice(0, endIdx) : section.split("\n")[0];
    if (targetText.trim()) targets.push(targetText.replace(/\*\*/g, "").trim());
  }
  if (targets.length === 0) {
    const altSplit = text.split(/\n(?=\d+[\.\)]\s)/);
    for (const chunk of altSplit) {
      const line = chunk.trim();
      if (line.length > 20 && /\d/.test(line)) {
        targets.push(line.split("\n")[0].replace(/^\d+[\.\)]\s*/, "").trim());
      }
    }
  }
  return targets;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SmartTargets() {
  const { preferences } = useUserPreferences();
  const outputRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [studentName, setStudentName] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [sendNeed, setSendNeed] = useState("");
  const [area, setArea] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [reviewPeriod, setReviewPeriod] = useState("6 weeks");
  const [numTargets, setNumTargets] = useState("3");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [showProgressChart, setShowProgressChart] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("screener_smart_targets_prefill");
    if (raw) {
      try {
        const data = JSON.parse(raw) as { baseline: string; sendNeed: string; notes: string };
        sessionStorage.removeItem("screener_smart_targets_prefill");
        setCurrentLevel(data.baseline);
        setSendNeed(SCREENER_ID_TO_SEND_NEED[data.sendNeed] || "");
      } catch {
        // ignore
      }
    }
  }, []);

  const relevantInterventions = sendNeed && yearGroup ? filterInterventions(sendNeed, yearGroup) : [];

  const handleGenerate = async () => {
    if (!studentName.trim()) return toast.error("Please enter student initials");
    if (!yearGroup) return toast.error("Please select a year group");
    if (!sendNeed) return toast.error("Please select a SEND need");
    if (!area) return toast.error("Please select a target area");
    if (!currentLevel.trim()) return toast.error("Please describe the current level");

    setLoading(true);
    setResult("");

    const interventionBlock = relevantInterventions.length > 0
      ? `\n\nRecommended evidence-based interventions to reference:\n${relevantInterventions.map((iv, i) => `${i + 1}. ${iv.name} (EEF Rating: ${iv.eefRating}/5, Cost: ${iv.costTier}) - ${iv.description}`).join("\n")}`
      : "";

    try {
      const { text } = await callAI(
        `You are an expert SENCO with 20 years of experience writing SMART targets for pupils with SEND. You write targets that are Specific, Measurable, Achievable, Relevant, and Time-bound. You use UK SEND Code of Practice 2015 terminology and person-centred language.

SMART VALIDATION RULE - CRITICAL: Before outputting any target, mentally check it against all 5 SMART criteria:
- SPECIFIC: Does it name the exact skill, behaviour, or outcome? (Not "improve reading" - instead "read CVC words with 90% accuracy")
- MEASURABLE: Is there a number, frequency, or observable criterion? (Not "make progress" - instead "on 4 out of 5 occasions")
- ACHIEVABLE: Is it realistic given the baseline and review period? (Not a leap of 3 years in 6 weeks)
- RELEVANT: Does it directly address the identified SEND need and area?
- TIME-BOUND: Does it specify "By [review date]" or "within [review period]"?
If any criterion is missing, rewrite the target before outputting it. Never output a target that fails any SMART criterion.`,
        `Generate ${numTargets} SMART targets for:
Student: ${studentName}
Year Group: ${yearGroup}
SEND Need: ${sendNeed}
Target Area: ${area}
Review Period: ${reviewPeriod}
Current Level / Baseline:
${currentLevel}${interventionBlock}

For each target, provide ALL of the following sections:
**Target 1:** [Full SMART statement - must include: specific skill, measurable criterion (number/frequency), and time-bound phrase "By [review date]" or "Within [review period]"]
**SMART Check:** [One sentence confirming: Specific + Measurable + Achievable + Relevant + Time-bound - or rewrite if any fail]
**Baseline:** [Precise current level - what the student can/cannot do now]
**Success Criteria:** [Exactly 3 measurable indicators - observable, countable evidence of achievement]
**Strategies:** [2-3 specific, evidence-based teaching/support strategies for this SEND need]
**Resources:** [Named interventions, tools, or materials - e.g. "Toe by Toe programme", "visual timer", "Word Wasp"]
**Monitoring:** [Specific frequency and method - e.g. "Weekly 5-minute probe test recorded on tracking sheet"]

Make targets ambitious yet achievable given the baseline. Use person-centred language. Ensure each target directly addresses ${sendNeed} in the area of ${area}.`,
        3000
      );
      setResult(text);
      toast.success("Targets generated successfully");
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard");
  };

  const handlePrint = () => {
    if (outputRef.current) printWorksheetElement(outputRef.current, { title: `SMART Targets - ${studentName}` });
  };

  const handlePdf = async () => {
    if (!outputRef.current) return;
    try {
      await downloadHtmlAsPdf(outputRef.current, `SMART_Targets_${studentName.replace(/\./g, "")}.pdf`);
      toast.success("PDF downloaded");
    } catch { toast.error("PDF export failed"); }
  };

  const handlePrintProgress = () => {
    if (progressRef.current) printWorksheetElement(progressRef.current, { title: `Progress Chart - ${studentName}` });
  };

  const parsedTargets = result ? parseTargets(result) : [];

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">SMART Targets Generator</h1>
              <p className="text-teal-200 text-sm mt-0.5">Generate specific, measurable, achievable SEND targets for any area of need</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      {!result && (
        <Card className="border-border/50">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Student Initials <span className="text-red-500">*</span></Label>
                <input value={studentName} onChange={e => setStudentName(e.target.value.slice(0, 4))} placeholder="e.g. L.C." maxLength={4} className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-teal-600/30" />
                <p className="text-[10px] text-muted-foreground">Initials only (max 4 chars) - do not enter full names (GDPR)</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Year Group <span className="text-red-500">*</span></Label>
                <select value={yearGroup} onChange={e => setYearGroup(e.target.value)} className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-teal-600/30">
                  <option value="">Select...</option>
                  {["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">SEND Need <span className="text-red-500">*</span></Label>
                <select value={sendNeed} onChange={e => setSendNeed(e.target.value)} className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-teal-600/30">
                  <option value="">Select...</option>
                  {sendNeeds.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Target Area <span className="text-red-500">*</span></Label>
                <select value={area} onChange={e => setArea(e.target.value)} className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-teal-600/30">
                  <option value="">Select...</option>
                  {areas.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Review Period</Label>
                <select value={reviewPeriod} onChange={e => setReviewPeriod(e.target.value)} className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-teal-600/30">
                  <option value="6 weeks">6 Weeks</option>
                  <option value="1 term">1 Term</option>
                  <option value="2 terms">2 Terms</option>
                  <option value="1 year">1 Year</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Number of Targets</Label>
                <select value={numTargets} onChange={e => setNumTargets(e.target.value)} className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-teal-600/30">
                  {[2,3,4,5].map(n => <option key={n} value={String(n)}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Current Level / Starting Point <span className="text-red-500">*</span></Label>
              <Textarea value={currentLevel} onChange={e => setCurrentLevel(e.target.value)} placeholder="What can the student currently do? What is the baseline?" rows={3} className="text-sm resize-none" />
            </div>

            {/* Relevant interventions preview */}
            {relevantInterventions.length > 0 && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                <p className="text-xs font-bold text-teal-800 mb-1.5 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" />Matched Interventions ({relevantInterventions.length})</p>
                <div className="space-y-1">
                  {relevantInterventions.map((iv, i) => (
                    <div key={i} className="text-[11px] text-teal-700 flex items-center gap-1.5">
                      <span className="font-semibold">{iv.name}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-teal-300 text-teal-600">EEF {iv.eefRating}/5</Badge>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-teal-300 text-teal-600">{iv.costTier}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-teal-600 mt-1.5">These will be included in the AI prompt for evidence-based recommendations</p>
              </div>
            )}

            <Button onClick={handleGenerate} disabled={loading} className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating targets...</> : <><Sparkles className="w-4 h-4" />Generate SMART Targets</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Output */}
      {result && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 items-center no-print">
            <Button variant="outline" size="sm" onClick={() => setResult("")} className="gap-1.5"><RefreshCw className="w-3.5 h-3.5" />New</Button>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5"><Copy className="w-3.5 h-3.5" />Copy</Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5"><Printer className="w-3.5 h-3.5" />Print</Button>
            <Button variant="outline" size="sm" onClick={handlePdf} className="gap-1.5"><Download className="w-3.5 h-3.5" />PDF</Button>
            <Button variant="outline" size="sm" onClick={() => setShowProgressChart(!showProgressChart)} className="gap-1.5 ml-auto">
              <BarChart3 className="w-3.5 h-3.5" />{showProgressChart ? "Hide" : "Show"} Progress Chart
            </Button>
          </div>

          {/* SMART Validator Badges */}
          {parsedTargets.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-bold flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-teal-600" />SMART Validation</p>
                {parsedTargets.map((target, i) => {
                  const check = validateSMART(target);
                  return (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                      <span className="text-xs font-bold text-teal-700 flex-shrink-0 mt-0.5">T{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-foreground leading-relaxed line-clamp-2">{target}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 gap-0.5 ${check.hasNumber ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}`}>
                            {check.hasNumber ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}Has number
                          </Badge>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 gap-0.5 ${check.hasTimeframe ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}`}>
                            {check.hasTimeframe ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}Has timeframe
                          </Badge>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 gap-0.5 ${check.hasMeasurable ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}`}>
                            {check.hasMeasurable ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}Has measurable outcome
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Formatted Output */}
          <div ref={outputRef} className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatToolOutput(result, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#0d9488", emoji: "\uD83C\uDFAF", title: "SMART Targets" }) }} />

          {/* Progress Chart */}
          {showProgressChart && (
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-teal-600" />Progress Tracking Chart</p>
                  <Button variant="outline" size="sm" onClick={handlePrintProgress} className="gap-1.5 text-xs h-7"><Printer className="w-3 h-3" />Print Chart</Button>
                </div>
                <div ref={progressRef} className="overflow-x-auto">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-teal-50">
                        <th className="border border-teal-200 px-2 py-2 text-left font-bold text-teal-800 w-[200px]">Target</th>
                        <th className="border border-teal-200 px-2 py-2 text-center font-bold text-teal-800 w-[60px]">Baseline</th>
                        <th className="border border-teal-200 px-2 py-2 text-center font-bold text-teal-800">Week 1</th>
                        <th className="border border-teal-200 px-2 py-2 text-center font-bold text-teal-800">Week 2</th>
                        <th className="border border-teal-200 px-2 py-2 text-center font-bold text-teal-800">Week 3</th>
                        <th className="border border-teal-200 px-2 py-2 text-center font-bold text-teal-800">Week 4</th>
                        <th className="border border-teal-200 px-2 py-2 text-center font-bold text-teal-800">Week 5</th>
                        <th className="border border-teal-200 px-2 py-2 text-center font-bold text-teal-800">Week 6</th>
                        <th className="border border-teal-200 px-2 py-2 text-center font-bold text-teal-800 w-[50px]">RAG</th>
                        <th className="border border-teal-200 px-2 py-2 text-center font-bold text-teal-800 w-[100px]">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(parsedTargets.length > 0 ? parsedTargets : ["Target 1", "Target 2", "Target 3"]).map((target, i) => (
                        <tr key={i}>
                          <td className="border border-teal-200 px-2 py-3 text-xs leading-tight">{target.length > 80 ? target.slice(0, 80) + "..." : target}</td>
                          <td className="border border-teal-200 px-2 py-3"></td>
                          <td className="border border-teal-200 px-2 py-3"></td>
                          <td className="border border-teal-200 px-2 py-3"></td>
                          <td className="border border-teal-200 px-2 py-3"></td>
                          <td className="border border-teal-200 px-2 py-3"></td>
                          <td className="border border-teal-200 px-2 py-3"></td>
                          <td className="border border-teal-200 px-2 py-3"></td>
                          <td className="border border-teal-200 px-2 py-3"></td>
                          <td className="border border-teal-200 px-2 py-3"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span>Student: <strong>{studentName}</strong></span>
                    <span>Year: <strong>{yearGroup}</strong></span>
                    <span>Review: <strong>{reviewPeriod}</strong></span>
                    <span className="ml-auto">RAG: <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mx-0.5"></span>R <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mx-0.5"></span>A <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mx-0.5"></span>G</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
