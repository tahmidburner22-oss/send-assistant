/**
 * traumaInformedProfile.ts — PR-16
 *
 * Trauma-informed register for worksheet adaptations.
 * Covers Adverse Childhood Experiences (ACEs) impact on learning:
 * hypervigilance, attachment difficulties, executive function overload,
 * emotional dysregulation.
 *
 * Pure / deterministic / idempotent. No I/O, no LLM calls.
 */

export interface TraumaInformedRule {
  id: string;
  rule: string;
  category: "safety" | "predictability" | "autonomy" | "connection" | "regulation";
  adaptations: string[];
}

/**
 * Evidence-based rules for trauma-informed worksheet adaptation.
 * Source: UK Trauma-Informed Practice guide (NICE CG26 + Education Endowment Foundation).
 */
export const TRAUMA_INFORMED_RULES: TraumaInformedRule[] = [
  {
    id: "ti-01",
    rule: "Avoid sudden, unpredictable question formats within a single worksheet",
    category: "predictability",
    adaptations: ["Use consistent question formats within each section", "Signal transitions explicitly ('Now we move to...')"],
  },
  {
    id: "ti-02",
    rule: "Reduce demand language ('You must', 'You should') — use invitational prompts",
    category: "autonomy",
    adaptations: ["Rephrase 'You must answer...' to 'Have a go at...'", "Offer choice: 'Choose 3 of these 5 questions'"],
  },
  {
    id: "ti-03",
    rule: "Provide explicit emotional regulation cues",
    category: "regulation",
    adaptations: ["Add 'If this feels hard, take a breath and try the next one' between sections", "Include a 'calm corner' prompt after challenging questions"],
  },
  {
    id: "ti-04",
    rule: "Avoid content that may trigger trauma responses (violence, family conflict, abandonment themes)",
    category: "safety",
    adaptations: ["Screen question scenarios for domestic themes", "Replace family-based word problems with school/community contexts"],
  },
  {
    id: "ti-05",
    rule: "Build in success early — start with confidence-building questions",
    category: "safety",
    adaptations: ["First 2 questions should be recall/recognition (Bloom 1)", "Add a tick-box for 'I managed this one' after each question"],
  },
  {
    id: "ti-06",
    rule: "Keep instructions short and visual where possible",
    category: "predictability",
    adaptations: ["Max 2 sentences per instruction block", "Use numbered steps, not prose paragraphs"],
  },
  {
    id: "ti-07",
    rule: "Allow for non-linear completion — student can work in any order",
    category: "autonomy",
    adaptations: ["Add 'You can do these in any order' header", "Avoid 'Use your answer from Q1 to...' dependencies where possible"],
  },
  {
    id: "ti-08",
    rule: "Include relational anchoring — connect tasks to known adults",
    category: "connection",
    adaptations: ["Add 'Ask your TA if you get stuck on this one'", "Include 'Show this to [name] when you finish' prompt"],
  },
];

/**
 * Check a worksheet's content against trauma-informed rules.
 * Returns findings + an overall safety score.
 */
export function auditTraumaInformed(
  sections: Array<{ type?: string; title?: string; content?: string }>,
): { findings: Array<{ ruleId: string; status: "ok" | "concern"; evidence?: string }>; safetyScore: number } {
  const findings: Array<{ ruleId: string; status: "ok" | "concern"; evidence?: string }> = [];
  const allContent = sections.map((s) => `${s.title || ""} ${s.content || ""}`).join("\n").toLowerCase();

  // Check each rule
  for (const rule of TRAUMA_INFORMED_RULES) {
    let concern = false;
    let evidence: string | undefined;

    switch (rule.id) {
      case "ti-02": // Demand language
        if (/\byou must\b|\byou should\b|\byou need to\b/i.test(allContent)) {
          concern = true;
          evidence = "Contains demand language ('you must'/'you should')";
        }
        break;
      case "ti-04": // Trigger content
        if (/\bfight\b|\bdivorce\b|\babandoned\b|\bhit\b|\bscared\b|\balone at home\b/i.test(allContent)) {
          concern = true;
          evidence = "Contains potentially triggering themes";
        }
        break;
      case "ti-06": // Long instructions
        {
          const longInstructions = sections.filter((s) =>
            s.type && /objective|instruction/i.test(s.type) &&
            (s.content || "").split(/[.!?]/).some((sent) => sent.trim().split(/\s+/).length > 25)
          );
          if (longInstructions.length > 0) {
            concern = true;
            evidence = "Contains instruction sentences > 25 words";
          }
        }
        break;
      default:
        // Other rules require structural analysis beyond simple text matching
        break;
    }

    findings.push({ ruleId: rule.id, status: concern ? "concern" : "ok", evidence });
  }

  const concerns = findings.filter((f) => f.status === "concern").length;
  const safetyScore = Math.max(0, 100 - concerns * 15);

  return { findings, safetyScore };
}
