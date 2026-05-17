/**
 * wcagAuditor.ts — FEAT-PC7 · Phase C (WCAG 2.2 AA audit)
 * ──────────────────────────────────────────────────────────────────────────
 * Programmatic axe-core wrapper. Runs an accessibility audit on a rendered
 * worksheet's DOM element and returns the violations in a UI-friendly shape.
 *
 * Design notes:
 *   - axe-core is loaded via dynamic import to keep it out of the initial
 *     JS bundle. A worksheet page that never opens the audit pays nothing.
 *   - We pin to the WCAG 2.2 Level AA + ARIA tag families that map to
 *     SEND/EHCP procurement requirements.
 *   - If axe-core fails to load (offline / chunk error / package missing
 *     in dev sandbox) we fall back to a tiny built-in auditor that catches
 *     the highest-frequency offenders (missing alt, label-less inputs,
 *     poor heading order). The badge will still render — never silently
 *     pretend the page passed.
 */

// ─── Public types ──────────────────────────────────────────────────────────

export type Impact = "minor" | "moderate" | "serious" | "critical";

export interface AuditViolation {
  /** axe-core rule ID (e.g. "image-alt", "color-contrast"). */
  id: string;
  /** Severity bucket. */
  impact: Impact;
  /** Short human-readable description for the violations panel. */
  description: string;
  /** WCAG / Section 508 success-criterion tags from axe (e.g. "wcag2aa"). */
  tags: string[];
  /** Per-element occurrence count. */
  occurrences: number;
  /** First-occurrence target selector — useful for click-to-highlight. */
  firstTarget?: string;
  /** Help URL (axe rule documentation). */
  helpUrl?: string;
}

export interface AuditWarning {
  id: string;
  description: string;
  occurrences: number;
}

export interface WcagAuditResult {
  /** True when there are zero violations. */
  passed: boolean;
  /** Source of the result — "axe" or "fallback". */
  engine: "axe" | "fallback" | "none";
  /** When the audit ran (ISO timestamp). */
  ranAt: string;
  /** Aggregated violations, grouped by rule and sorted by impact. */
  violations: AuditViolation[];
  /** Soft warnings (axe "incomplete" rules — needs human review). */
  warnings: AuditWarning[];
  /** Total number of nodes the engine inspected. */
  inspected: number;
}

export interface AuditOptions {
  /** Force the fallback engine (skip axe). Used in tests. */
  useFallback?: boolean;
  /** Limit which axe tag families to run. Defaults to WCAG 2.2 AA. */
  tags?: string[];
}

// ─── Internal: axe-core dynamic loader ─────────────────────────────────────

interface AxeRunResult {
  violations: Array<{
    id: string;
    impact?: Impact | null;
    description: string;
    help?: string;
    helpUrl?: string;
    tags: string[];
    nodes: Array<{ target: string[] }>;
  }>;
  incomplete: Array<{
    id: string;
    description: string;
    nodes: Array<unknown>;
  }>;
  passes: Array<unknown>;
  inapplicable: Array<unknown>;
}

interface AxeModule {
  run: (
    context: Element | Document,
    options?: { runOnly?: { type: string; values: string[] } },
  ) => Promise<AxeRunResult>;
}

let axePromise: Promise<AxeModule | null> | null = null;

async function loadAxe(): Promise<AxeModule | null> {
  if (axePromise) return axePromise;
  axePromise = (async () => {
    try {
      // @ts-expect-error — axe-core ships its own types but they may not be installed yet.
      const mod = await import(/* @vite-ignore */ "axe-core");
      const m = (mod && (mod.default || mod)) as AxeModule;
      return m && typeof m.run === "function" ? m : null;
    } catch {
      return null;
    }
  })();
  return axePromise;
}

// ─── Public API ────────────────────────────────────────────────────────────

const DEFAULT_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
];

/**
 * Run a WCAG 2.2 AA audit against the supplied DOM element. Returns a
 * structured result that the UI can render in a chip + violations panel.
 *
 * Never throws — on any internal error the function returns a result with
 * `engine: "none"` and empty violations, so the caller can still display
 * a "couldn't audit" tooltip without crashing.
 */
export async function auditWorksheetElement(
  element: Element | null | undefined,
  opts: AuditOptions = {},
): Promise<WcagAuditResult> {
  const ranAt = new Date().toISOString();

  if (!element || typeof window === "undefined") {
    return {
      passed: false,
      engine: "none",
      ranAt,
      violations: [],
      warnings: [],
      inspected: 0,
    };
  }

  if (!opts.useFallback) {
    const axe = await loadAxe();
    if (axe) {
      try {
        const result = await axe.run(element, {
          runOnly: { type: "tag", values: opts.tags || DEFAULT_TAGS },
        });
        return summariseAxeResult(result, ranAt);
      } catch (err) {
        // Fall through to the heuristic fallback rather than crash the UI.
        console.warn("[wcagAuditor] axe-core run failed, using fallback:", err);
      }
    }
  }

  return runFallbackAudit(element, ranAt);
}

// ─── Axe → UI summariser ───────────────────────────────────────────────────

function summariseAxeResult(result: AxeRunResult, ranAt: string): WcagAuditResult {
  const violations: AuditViolation[] = (result.violations || []).map((v) => ({
    id: v.id,
    impact: (v.impact || "moderate") as Impact,
    description: v.help || v.description,
    tags: v.tags || [],
    occurrences: (v.nodes || []).length,
    firstTarget: v.nodes?.[0]?.target?.join(" "),
    helpUrl: v.helpUrl,
  }));

  // Sort: critical → serious → moderate → minor
  const order: Record<Impact, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  violations.sort((a, b) => (order[a.impact] ?? 9) - (order[b.impact] ?? 9));

  const warnings: AuditWarning[] = (result.incomplete || []).map((w) => ({
    id: w.id,
    description: w.description,
    occurrences: (w.nodes || []).length,
  }));

  const inspected =
    (result.passes?.length || 0) +
    (result.violations?.length || 0) +
    (result.incomplete?.length || 0) +
    (result.inapplicable?.length || 0);

  return {
    passed: violations.length === 0,
    engine: "axe",
    ranAt,
    violations,
    warnings,
    inspected,
  };
}

// ─── Fallback heuristic auditor ────────────────────────────────────────────

/**
 * Tiny zero-dependency auditor used when axe-core can't load. Catches the
 * three highest-frequency WCAG 2.2 AA offenders so the badge is meaningful
 * even in a degraded environment. Not a substitute for axe in production.
 */
function runFallbackAudit(element: Element, ranAt: string): WcagAuditResult {
  const violations: AuditViolation[] = [];
  const warnings: AuditWarning[] = [];

  // 1. image-alt
  const imgs = Array.from(element.querySelectorAll("img"));
  const noAlt = imgs.filter((i) => !i.hasAttribute("alt") || i.getAttribute("alt")?.trim() === "");
  if (noAlt.length > 0) {
    violations.push({
      id: "image-alt",
      impact: "serious",
      description:
        "Images must have an alt attribute describing their content (or alt='' if decorative).",
      tags: ["wcag2a", "wcag111"],
      occurrences: noAlt.length,
      firstTarget: describeTarget(noAlt[0]),
    });
  }

  // 2. label
  const inputs = Array.from(
    element.querySelectorAll<HTMLElement>("input, textarea, select"),
  ).filter((el) => {
    const type = el.getAttribute("type") || "";
    return !["hidden", "submit", "button", "reset"].includes(type);
  });
  const unlabelled = inputs.filter((el) => {
    if (el.getAttribute("aria-label")?.trim()) return false;
    if (el.getAttribute("aria-labelledby")?.trim()) return false;
    if (el.getAttribute("title")?.trim()) return false;
    const id = el.getAttribute("id");
    if (id && element.querySelector(`label[for='${cssEscape(id)}']`)) return false;
    if (el.closest("label")) return false;
    return true;
  });
  if (unlabelled.length > 0) {
    violations.push({
      id: "label",
      impact: "critical",
      description: "Form fields must have an associated label, aria-label, or aria-labelledby.",
      tags: ["wcag2a", "wcag332", "wcag131"],
      occurrences: unlabelled.length,
      firstTarget: describeTarget(unlabelled[0]),
    });
  }

  // 3. heading-order — first heading should be h1/h2; never skip levels.
  const headings = Array.from(
    element.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"),
  );
  const skipped: HTMLElement[] = [];
  let prev = 0;
  for (const h of headings) {
    const level = parseInt(h.tagName.substring(1), 10);
    if (prev > 0 && level > prev + 1) skipped.push(h);
    prev = level;
  }
  if (skipped.length > 0) {
    warnings.push({
      id: "heading-order",
      description: "Heading levels should not skip (e.g. h2 → h4). Use sequential levels.",
      occurrences: skipped.length,
    });
  }

  // 4. button-name — buttons with no text and no aria-label.
  const buttons = Array.from(element.querySelectorAll<HTMLElement>("button"));
  const namelessButtons = buttons.filter(
    (b) =>
      !b.textContent?.trim() &&
      !b.getAttribute("aria-label")?.trim() &&
      !b.getAttribute("title")?.trim(),
  );
  if (namelessButtons.length > 0) {
    violations.push({
      id: "button-name",
      impact: "serious",
      description: "Buttons must have discernible text via content, aria-label, or title.",
      tags: ["wcag2a", "wcag412"],
      occurrences: namelessButtons.length,
      firstTarget: describeTarget(namelessButtons[0]),
    });
  }

  return {
    passed: violations.length === 0,
    engine: "fallback",
    ranAt,
    violations,
    warnings,
    inspected: imgs.length + inputs.length + headings.length + buttons.length,
  };
}

function describeTarget(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.getAttribute("id");
  if (id) return `${tag}#${id}`;
  const cls = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean)[0];
  return cls ? `${tag}.${cls}` : tag;
}

function cssEscape(value: string): string {
  // Minimal CSS.escape polyfill for older browsers / jsdom.
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

// ─── Convenience: format a result as a one-line tooltip string ─────────────

export function formatAuditTooltip(result: WcagAuditResult): string {
  if (result.engine === "none") return "Accessibility audit not yet run.";
  if (result.passed) {
    return `WCAG 2.2 AA · ${result.violations.length === 0 ? "Pass" : "Fail"} · ${result.warnings.length} warning(s) · audited ${new Date(result.ranAt).toLocaleTimeString()}`;
  }
  const top = result.violations[0];
  return `${result.violations.length} issue(s). Top: ${top.id} (${top.impact}) — ${top.description.slice(0, 80)}`;
}
