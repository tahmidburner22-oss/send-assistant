/**
 * DiagramProbe.tsx — maths-only AI SVG quality probe (developer surface)
 *
 * Production /api/ai/diagram serves admin-library images only. This page is
 * a throwaway-shaped harness that lets the product owner eyeball whether
 * AI-generated SVG diagrams are good enough to re-enable in the maths
 * pipeline. Direct-URL only at /diagram-probe — there is deliberately no
 * sidebar entry. Server-side enforced maths-only.
 *
 * Flow:
 *   1. Pick a maths topic + year group (defaults provided).
 *   2. Click Generate. Server returns the freeform SVG, the parsed
 *      caption, the provider that won the fallback chain, and the raw
 *      LLM body for debugging.
 *   3. Client renders the SVG and runs `auditAiSvg()` against it. The
 *      report (pass/fail + per-issue rows) is shown beside the diagram.
 *   4. If the audit failed, a "Retry with audit feedback" button reruns
 *      the server endpoint with the audit summary injected into the
 *      prompt — the hybrid retry policy we'd ship if we re-enabled AI
 *      SVG. The retry result is shown alongside the original so you can
 *      compare attempt 1 vs attempt 2 side-by-side.
 *
 * The page deliberately does not cache, persist, or telemeter. Open it,
 * try a topic, decide. If we re-enable AI SVG in the maths pipeline, the
 * retry policy implemented here is what we'd ship in production.
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auditAiSvg, type SvgLayoutReport } from "@/lib/engines/diagramEngine";

// Maths-only suggestions covering the topics most likely to need a diagram.
// Pure UX nicety — the textarea is freeform.
const SUGGESTED_TOPICS = [
  "Bar chart from a frequency table",
  "Pie chart of favourite sports",
  "Scatter graph with line of best fit",
  "Box plot showing five-number summary",
  "Cumulative frequency curve",
  "Pythagoras' theorem on a right-angled triangle",
  "Circle: radius, diameter, circumference, sector",
  "Reflection of a triangle in y = x",
  "Translation by vector (3, -2)",
  "Similar triangles with scale factor 3",
  "Volume of a triangular prism",
  "Net of a cuboid",
  "Angles in parallel lines (alternate, co-interior)",
  "Polygon with interior angles labelled",
  "Bearings: three-figure bearing from A to B",
  "Probability tree for two coin flips",
  "Frequency tree for a class of 30",
  "Histogram with unequal class widths",
  "Number line with -5 and +3 marked",
  "Quadratic graph y = x^2 - 4",
];

interface ProbeResponse {
  svg: string;
  caption: string;
  provider: string;
  raw: string;
  retried: boolean;
}

interface ProbeAttempt {
  response: ProbeResponse;
  audit: SvgLayoutReport;
  /** "first" or "retry" — for header labelling. */
  kind: "first" | "retry";
}

function summariseAuditForPrompt(report: SvgLayoutReport): string {
  // Keep this terse and prescriptive — the LLM is more likely to act on
  // numbered, ordered demands than on a wall of prose. Top 8 issues only;
  // anything beyond that is usually a knock-on of the earlier ones.
  const lines: string[] = [];
  const top = report.issues.slice(0, 8);
  for (let i = 0; i < top.length; i++) {
    lines.push(`${i + 1}. [${top[i].kind}] ${top[i].message}`);
  }
  if (report.issues.length > top.length) {
    lines.push(`... and ${report.issues.length - top.length} more.`);
  }
  return lines.join("\n");
}

async function callDiagramProbe(input: {
  topic: string;
  yearGroup: string;
  auditFeedback?: string;
}): Promise<ProbeResponse> {
  const res = await fetch("/api/ai/diagram-probe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      subject: "Maths",
      topic: input.topic,
      yearGroup: input.yearGroup,
      auditFeedback: input.auditFeedback,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<ProbeResponse> & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data?.error || `Probe failed (HTTP ${res.status})`);
  }
  return {
    svg: String(data.svg || ""),
    caption: String(data.caption || ""),
    provider: String(data.provider || "unknown"),
    raw: String(data.raw || ""),
    retried: Boolean(data.retried),
  };
}

function AttemptCard({ attempt }: { attempt: ProbeAttempt }) {
  const { response, audit, kind } = attempt;
  const headerLabel = kind === "first" ? "Attempt 1" : "Attempt 2 (retry)";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {headerLabel}
          <Badge variant={audit.pass ? "default" : "destructive"}>
            {audit.pass ? "Audit pass" : "Audit fail"}
          </Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {response.provider}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SVG render. Trusted because it came back from our own server
            and is bound for inline display only on this developer surface.
            We deliberately do not sanitise — the whole point of the probe
            is to see what the LLM actually produced. */}
        <div className="rounded border bg-white p-2">
          {response.svg ? (
            <div
              className="w-full overflow-hidden"
              dangerouslySetInnerHTML={{ __html: response.svg }}
            />
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No &lt;svg&gt; element parsed from the response.
            </div>
          )}
        </div>
        {response.caption ? (
          <p className="text-sm italic text-muted-foreground">
            Caption: {response.caption}
          </p>
        ) : null}
        <div>
          <p className="font-semibold text-sm">{audit.summary}</p>
          {audit.issues.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {audit.issues.slice(0, 12).map((issue, i) => (
                <li key={i}>
                  <span className="font-mono uppercase">[{issue.kind}]</span>{" "}
                  {issue.message}
                </li>
              ))}
              {audit.issues.length > 12 ? (
                <li className="text-xs italic">
                  ... and {audit.issues.length - 12} more.
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
        {!response.svg ? (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              Show raw provider response (debug)
            </summary>
            <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 font-mono">
              {response.raw}
            </pre>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function DiagramProbe() {
  const [topic, setTopic] = useState("Bar chart from a frequency table");
  const [yearGroup, setYearGroup] = useState("Year 9");
  const [busy, setBusy] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [first, setFirst] = useState<ProbeAttempt | null>(null);
  const [retry, setRetry] = useState<ProbeAttempt | null>(null);

  // Stable memo of the prompt-feedback summary so the retry button label
  // can show the issue count without re-deriving on every render.
  const firstIssueCount = useMemo(
    () => first?.audit.issues.length ?? 0,
    [first],
  );

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    setFirst(null);
    setRetry(null);
    try {
      const response = await callDiagramProbe({ topic, yearGroup });
      const audit = auditAiSvg(response.svg || "");
      setFirst({ response, audit, kind: "first" });
    } catch (e: any) {
      setError(e?.message || "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRetry() {
    if (!first) return;
    setRetrying(true);
    setError(null);
    setRetry(null);
    try {
      const auditFeedback = summariseAuditForPrompt(first.audit);
      const response = await callDiagramProbe({
        topic,
        yearGroup,
        auditFeedback,
      });
      const audit = auditAiSvg(response.svg || "");
      setRetry({ response, audit, kind: "retry" });
    } catch (e: any) {
      setError(e?.message || "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">AI Diagram Probe (Maths only)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Developer surface. Production worksheets are unaffected — this
          calls a separate endpoint and never writes to the diagram
          library. Use it to decide whether AI SVG is good enough to
          re-enable in the maths pipeline.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Topic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="topic">Maths topic</Label>
              <Textarea
                id="topic"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={2}
                placeholder="e.g. Bar chart from a frequency table"
              />
            </div>
            <div>
              <Label htmlFor="year">Year group</Label>
              <Input
                id="year"
                value={yearGroup}
                onChange={e => setYearGroup(e.target.value)}
                placeholder="Year 9"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Suggested topics — click to use
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUGGESTED_TOPICS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTopic(s)}
                  className="rounded-full border bg-muted px-3 py-1 text-xs hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleGenerate} disabled={busy || !topic.trim()}>
              {busy ? "Generating..." : "Generate"}
            </Button>
            {first && !first.audit.pass ? (
              <Button
                variant="secondary"
                onClick={handleRetry}
                disabled={retrying}
              >
                {retrying
                  ? "Retrying..."
                  : `Retry with audit feedback (${firstIssueCount} issue${firstIssueCount === 1 ? "" : "s"})`}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Probe failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {first ? <AttemptCard attempt={first} /> : null}
        {retry ? <AttemptCard attempt={retry} /> : null}
      </div>
    </div>
  );
}
