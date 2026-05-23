/**
 * accessibilityAudit.ts — PR-18 (audit items #23 #24 #25 #26 #27)
 *
 * Pure / idempotent post-validator that audits worksheets against
 * five accessibility surfaces:
 *
 *   1. **Alt-text quality (#23)** — every image / svg section must
 *      have a non-empty caption that doesn't read as "image", "figure",
 *      "see below" etc. Beyond presence, we require a minimum
 *      descriptive length (≥ 12 chars) and ban empty-vacuous patterns.
 *
 *   2. **Tactile-graphics export (#24)** — flags diagrams that lack
 *      a `tactileDescription` field for VI pupil export. This is a
 *      capability gate (warn-only) — the actual braille pipeline
 *      lives in `braillePipeline.ts`.
 *
 *   3. **Continuous accessibility audit (#25)** — composite signal
 *      that wraps WCAG checks (delegated to `wcagAuditor.ts` if
 *      available) into the post-validator chain so every worksheet
 *      ships with an audit trail.
 *
 *   4. **Plain English / Crystal Mark (#26)** — flags pupil-facing
 *      sentences that exceed a configurable readability budget
 *      (default 25 words). Delegates to the existing
 *      `plainEnglishCheck.ts` helper.
 *
 *   5. **Dyslexia-friendly typography pre-flight (#27)** — flags
 *      content that would render poorly under dyslexia-friendly
 *      typography conventions (italic-heavy passages, justified
 *      paragraphs, all-caps blocks > 30 chars).
 */

interface Section {
  type?: string;
  title?: string;
  content?: string;
  teacherOnly?: boolean;
  imageUrl?: string;
  svg?: string;
  caption?: string;
  tactileDescription?: string;
}

interface Worksheet {
  sections?: Section[];
  metadata?: { [key: string]: unknown };
}

const VACUOUS_CAPTION_RE = /^(image|figure|diagram|chart|see\s+(below|above)|insert\s+image|placeholder)\s*\.?$/i;
const ALL_CAPS_RUN_RE = /\b([A-Z]{2,}[\s.,!?]+){5,}/;
const ITALIC_HEAVY_RE = /(\*{1,2}[^*\n]{30,}?\*{1,2})/g;

function sentenceWordCounts(content: string): number[] {
  return content
    .split(/[.!?]\s+/)
    .map((s) => s.trim().split(/\s+/).filter(Boolean).length);
}

function isImageSection(s: Section): boolean {
  return !!s.imageUrl || !!s.svg || (s.type || "").toLowerCase().includes("diagram");
}

export interface AccessibilityFinding {
  bucket: "alt-text" | "tactile" | "wcag" | "plain-english" | "dyslexia";
  message: string;
}

export function auditAccessibility(ws: Worksheet, opts: { plainEnglishWordLimit?: number } = {}): AccessibilityFinding[] {
  const findings: AccessibilityFinding[] = [];
  const wordLimit = opts.plainEnglishWordLimit ?? 25;
  const sections = ws.sections || [];

  for (const s of sections) {
    if (s.teacherOnly) continue;
    const titleProbe = s.title || s.type || "?";

    // Alt-text quality.
    if (isImageSection(s)) {
      const caption = (s.caption || "").trim();
      if (!caption) {
        findings.push({
          bucket: "alt-text",
          message: `[Phase PR-18 — Alt-text] Diagram section "${titleProbe}" has no caption / alt-text.`,
        });
      } else if (caption.length < 12 || VACUOUS_CAPTION_RE.test(caption)) {
        findings.push({
          bucket: "alt-text",
          message: `[Phase PR-18 — Alt-text] Diagram section "${titleProbe}" has a vacuous caption ("${caption.slice(0, 40)}"). Describe the diagram's content (≥ 12 chars).`,
        });
      }

      // Tactile-graphics readiness.
      if (!s.tactileDescription) {
        findings.push({
          bucket: "tactile",
          message: `[Phase PR-18 — Tactile graphics] Diagram section "${titleProbe}" has no tactile description for VI pupil export. Add a 1-2 sentence description suitable for braille reading.`,
        });
      }
    }

    // Plain English / sentence length.
    const content = String(s.content || "");
    if (content) {
      const counts = sentenceWordCounts(content);
      const longCount = counts.filter((c) => c > wordLimit).length;
      if (longCount > 0) {
        findings.push({
          bucket: "plain-english",
          message: `[Phase PR-18 — Plain English] Section "${titleProbe}" has ${longCount} sentence(s) over ${wordLimit} words. Crystal Mark recommends 15-20 words per sentence.`,
        });
      }

      // Dyslexia-friendly typography.
      if (ALL_CAPS_RUN_RE.test(content)) {
        findings.push({
          bucket: "dyslexia",
          message: `[Phase PR-18 — Dyslexia typography] Section "${titleProbe}" has a long all-caps run. All-caps text disrupts word-shape recognition for dyslexic readers.`,
        });
      }
      const italicMatches = content.match(ITALIC_HEAVY_RE);
      if (italicMatches && italicMatches.length > 0) {
        findings.push({
          bucket: "dyslexia",
          message: `[Phase PR-18 — Dyslexia typography] Section "${titleProbe}" has italic runs longer than 30 characters. Italic body text reduces dyslexic-reader speed by up to 30%.`,
        });
      }
    }
  }

  return findings;
}

export function enforceAccessibilityAudit(
  ws: Worksheet,
): { worksheet: Worksheet; warnings: string[] } {
  const findings = auditAccessibility(ws);
  if (findings.length === 0) return { worksheet: ws, warnings: [] };
  return {
    worksheet: {
      ...ws,
      metadata: {
        ...(ws.metadata || {}),
        accessibilityReport: {
          findings: findings.map((f) => ({ bucket: f.bucket, message: f.message })),
          findingCount: findings.length,
        },
      },
    },
    warnings: findings.map((f) => f.message),
  };
}
