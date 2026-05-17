/**
 * Comprehension Generator
 *
 * Five improvements layered on top of the original 3-way differentiated output:
 *  1. Reading-age estimate per level (renderable badge, full panel)
 *  2. Cloze-version builder for the source passage
 *  3. Vocab pre-teach strip (auto-extracted Tier 2/3)
 *  4. Source loader — fetch a URL into the source text box
 *  5. Bloom's tagging on every generated question
 */
import { useEffect, useState } from "react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import { formatToolOutput } from "@/lib/format-tool-output";
import AIToolPage from "@/components/AIToolPage";
import ComprehensionEnhancementsPanel from "@/components/ComprehensionEnhancementsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BookMarked, Printer, Globe, Loader2, Gauge } from "lucide-react";
import { toast } from "sonner";
import {
  fetchSourceText,
  computeReadability,
  tagBloom,
  bloomBadgeHtml,
} from "@/lib/comprehension-enhancements";

const years = ["Reception","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6","Year 7","Year 8","Year 9","Year 10","Year 11","Year 12","Year 13"].map(y => ({ value: y, label: y }));

/**
 * Parse a 3-way differentiated comprehension output into three labelled sections.
 * Looks for **Support Level**, **Core Level**, **Extension Level** headings.
 */
function parse3Way(text: string): { support: string; core: string; extension: string; rest: string } | null {
  const supportMatch  = text.match(/\*\*Support\s*Level\*\*([^]*?)(?=\*\*Core\s*Level\*\*|\*\*Extension\s*Level\*\*|$)/i);
  const coreMatch     = text.match(/\*\*Core\s*Level\*\*([^]*?)(?=\*\*Extension\s*Level\*\*|$)/i);
  const extensionMatch = text.match(/\*\*Extension\s*Level\*\*([^]*?)(?=$)/i);
  if (!supportMatch && !coreMatch && !extensionMatch) return null;
  const lastLevelEnd = extensionMatch
    ? text.indexOf(extensionMatch[0]) + extensionMatch[0].length
    : coreMatch
    ? text.indexOf(coreMatch[0]) + coreMatch[0].length
    : 0;
  const rest = text.slice(lastLevelEnd).trim();
  return {
    support:   supportMatch?.[1]?.trim()   || "",
    core:      coreMatch?.[1]?.trim()      || "",
    extension: extensionMatch?.[1]?.trim() || "",
    rest,
  };
}

function mdToHtml(text: string, opts: { tagBloom: boolean }): string {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^#{1,3}\s+(.+)$/gm, "<p class='font-semibold mt-2'>$1</p>")
    .replace(/^[-•]\s+(.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/^(\d+)\.\s+(.+)$/gm, "<li class='ml-4 list-decimal' data-q='$1'>$2</li>")
    .replace(/\n\n/g, "</p><p class='mt-2'>")
    .replace(/\n/g, "<br/>");
  if (opts.tagBloom) {
    // Inject a Bloom badge before any <li> whose body contains a question mark
    // or a marks-allocation tag. Covers both bullet and numbered lists.
    html = html.replace(
      /<li class='ml-4 (list-disc|list-decimal)'( data-q='\d+')?>([^<]*(\?|\(\s*\d+\s*marks?\s*\))[^<]*)<\/li>/g,
      (_match, listType: string, dataQ: string | undefined, body: string) => {
        return `<li class='ml-4 ${listType}'${dataQ || ""}>${bloomBadgeHtml(tagBloom(body))} ${body}</li>`;
      },
    );
  }
  return html;
}

const LEVEL_CONFIG = [
  { key: "support",   label: "Support Level",   sub: "Scaffolded — sentence starters & guided questions", bg: "#eff6ff", border: "#3b82f6", header: "#2563eb", badge: "Foundation" },
  { key: "core",      label: "Core Level",       sub: "Standard comprehension questions",                  bg: "#f5f3ff", border: "#7c3aed", header: "#6d28d9", badge: "Core" },
  { key: "extension", label: "Extension Level",  sub: "Higher-order thinking — analysis & evaluation",     bg: "#ecfeff", border: "#0891b2", header: "#0e7490", badge: "Extension" },
] as const;

function ThreeWayOutput({ parsed }: {
  parsed: { support: string; core: string; extension: string; rest: string };
}) {
  const [printLevel, setPrintLevel] = useState<"all" | "support" | "core" | "extension">("all");

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center gap-2 flex-wrap p-3 bg-slate-50 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Print:</span>
        {(["all", "support", "core", "extension"] as const).map(level => (
          <button
            key={level}
            onClick={() => setPrintLevel(level)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
              printLevel === level
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
            }`}
          >
            {level === "all" ? "All three levels" : level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
        <button
          onClick={() => window.print()}
          className="no-print ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold bg-slate-800 text-white border border-slate-800 hover:bg-slate-900"
        >
          <Printer className="w-3.5 h-3.5" /> Print selected level
        </button>
      </div>

      {LEVEL_CONFIG.map(cfg => {
        const content = parsed[cfg.key];
        if (!content) return null;
        const stats = computeReadability(content);
        const hidden = printLevel !== "all" && printLevel !== cfg.key;
        return (
          <div
            key={cfg.key}
            className={hidden ? "no-print" : ""}
            style={{
              border: `2px solid ${cfg.border}`,
              borderRadius: "12px",
              overflow: "hidden",
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            <div style={{ background: cfg.header, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "15px", color: "#fff" }}>{cfg.label}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", marginTop: "1px" }}>{cfg.sub}</div>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "2px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 700 }}>
                  ~age {stats.approxUkReadingAge} · {stats.band}
                </span>
                <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700 }}>
                  {cfg.badge}
                </span>
              </div>
            </div>
            <div
              style={{ padding: "14px 16px", background: cfg.bg, fontSize: "14px", lineHeight: "1.7" }}
              dangerouslySetInnerHTML={{ __html: mdToHtml(content, { tagBloom: true }) }}
            />
          </div>
        );
      })}

      {parsed.rest && (
        <div style={{ border: "2px solid #94a3b8", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ background: "#475569", padding: "10px 16px" }}>
            <div style={{ fontWeight: 800, fontSize: "15px", color: "#fff" }}>Answer Key & Additional Activities</div>
          </div>
          <div
            style={{ padding: "14px 16px", background: "#f8fafc", fontSize: "14px", lineHeight: "1.7" }}
            dangerouslySetInnerHTML={{ __html: mdToHtml(parsed.rest, { tagBloom: false }) }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Source loader widget ──────────────────────────────────────────────────
function SourceLoader({ onLoad }: { onLoad: (text: string) => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function fetchNow() {
    if (!url.trim()) return;
    setBusy(true);
    try {
      const txt = await fetchSourceText(url.trim());
      onLoad(txt);
      toast.success(`Loaded ~${txt.split(/\s+/).length} words from URL.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not load URL.";
      toast.error(`${msg} — paste the passage manually.`);
    }
    setBusy(false);
  }

  return (
    <Card className="border-sky-200 mb-3">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-sky-700">
          <Globe className="w-3.5 h-3.5" />
          <p className="text-[11px] font-semibold">Load source from URL (optional)</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="text-xs h-8"
          />
          <Button size="sm" onClick={fetchNow} disabled={busy || !url.trim()} className="h-8 gap-1.5">
            {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading…</> : <><Globe className="w-3.5 h-3.5" />Fetch</>}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Fetches via a public reader proxy. If it fails, copy-paste the passage into the Source Text field.
        </p>
      </CardContent>
    </Card>
  );
}

export default function ComprehensionGenerator() {
  const { preferences } = useUserPreferences();
  const [lastDiff, setLastDiff] = useState<string>("3-way");
  const [latestResult, setLatestResult] = useState<string>("");
  const [latestSource, setLatestSource] = useState<string>("");
  const [sourceOverride, setSourceOverride] = useState<string>("");

  // Listen for source-loader → write into the textarea via DOM (the simplest
  // way that works without pulling AIToolPage's setValue out).
  useEffect(() => {
    if (!sourceOverride) return;
    const el = document.querySelector<HTMLTextAreaElement>("#field-text");
    if (el) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(el, sourceOverride);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, [sourceOverride]);

  return (
    <div>
      <div className="px-4 pt-6 max-w-2xl mx-auto">
        <SourceLoader onLoad={setSourceOverride} />
      </div>

      <AIToolPage
        assignable={true}
        title="Comprehension Generator"
        description="Create differentiated reading comprehension activities from any text"
        icon={<BookMarked className="w-5 h-5 text-white" />}
        accentColor="bg-sky-600"
        fields={[
          { id: "text", label: "Source Text", type: "textarea", placeholder: "Paste the reading passage here...", required: true, span: "full", hint: "Tip: use the URL loader above to import an article." },
          { id: "yearGroup", label: "Year Group", type: "select", options: years, required: true, span: "half" },
          { id: "numQuestions", label: "Questions per Level", type: "select", options: [3,5,6,8,10].map(n => ({ value: String(n), label: String(n) })), span: "half" },
          { id: "questionTypes", label: "Question Types", type: "select", options: [
            { value: "mixed",    label: "Mixed (literal + inferential + evaluative)" },
            { value: "literal",  label: "Literal only" },
            { value: "inference", label: "Inference focused" },
            { value: "vipers",   label: "VIPERS format" },
          ], span: "half" },
          { id: "differentiation", label: "Differentiation", type: "select", options: [
            { value: "3-way",  label: "3-way (Support / Core / Extension)" },
            { value: "single", label: "Single level" },
            { value: "send",   label: "SEND adapted" },
          ], span: "half" },
          { id: "includeAnswers", label: "Include Answer Key", type: "select", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], span: "half" },
          { id: "includeVocab", label: "Include Vocabulary Activity", type: "select", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], span: "half" },
          { id: "tagBloom", label: "Tag questions with Bloom level", type: "select", options: [
            { value: "yes", label: "Yes — label every question" },
            { value: "no",  label: "No" },
          ], span: "half" },
        ]}
        buildPrompt={(v) => {
          setLastDiff(v.differentiation || "3-way");
          setLatestSource(v.text || "");
          const tagBloomOn = v.tagBloom !== "no";
          return {
            system: `You are an expert UK English teacher specialising in reading comprehension and literacy. You create high-quality comprehension activities that develop genuine reading skills. You use the VIPERS framework where appropriate.`,
            user: `Create a comprehension activity for ${v.yearGroup} based on this text:

${v.text}

Requirements:
- ${v.numQuestions || 5} questions per level
- Question types: ${v.questionTypes || "mixed"}
- Differentiation: ${v.differentiation || "3-way"}
- Include answer key: ${v.includeAnswers !== "no" ? "Yes" : "No"}
- Include vocabulary activity: ${v.includeVocab !== "no" ? "Yes" : "No"}
${tagBloomOn ? '- BLOOM TAGGING: prefix every question with its Bloom level in square brackets at the start, e.g. "[Analysis] How does the author…". Use one of: Knowledge, Comprehension, Application, Analysis, Evaluation, Creation.' : ""}

${v.differentiation === "3-way" ? `IMPORTANT — Structure output with EXACTLY these three headings on their own lines:
**Support Level**
(${v.numQuestions || 5} scaffolded questions with sentence starters, simpler vocabulary, guided prompts)

**Core Level**
(${v.numQuestions || 5} standard questions — a mix of literal and inferential)

**Extension Level**
(${v.numQuestions || 5} higher-order questions requiring analysis, evaluation, and extended writing)

Keep each level completely self-contained. Do NOT merge levels or reference other levels within a level.` : ""}

${v.questionTypes === "vipers" ? "Label each question with its VIPERS skill (V/I/P/E/R/S)" : ""}

For each question: clear question text, marks allocation${v.includeAnswers !== "no" ? ", model answer" : ""}.

${v.includeVocab !== "no" ? "\nAfter all levels: VOCABULARY ACTIVITY with 5-8 key words from the text — definition, example sentence, and a task." : ""}`,
            maxTokens: 4000,
          };
        }}
        outputTitle={(v) => `Comprehension Activity (${v.yearGroup})`}
        onResult={(text, vals) => {
          setLatestResult(text);
          setLatestSource(vals.text || "");
        }}
        renderCustomOutput={(text) => {
          if (lastDiff === "3-way") {
            const parsed = parse3Way(text);
            if (parsed) return <ThreeWayOutput parsed={parsed} />;
          }
          // Fallback formatter
          const html = formatToolOutput(text, { logoUrl: preferences.schoolLogoUrl, schoolName: preferences.schoolName, accentColor: "#0284c7", emoji: "📖", title: "Comprehension" });
          return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
        }}
        renderPostActions={(result) => (
          <ComprehensionEnhancementsPanel rawOutput={result} sourceText={latestSource} />
        )}
      />

      {/* Floating reading-age summary when no result yet */}
      {!latestResult && latestSource && (
        <div className="max-w-2xl mx-auto px-4 pb-4">
          <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-[11px] flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-semibold text-sky-900">Source readability:</span>
            <span>~age {computeReadability(latestSource).approxUkReadingAge} ({computeReadability(latestSource).band}) · {computeReadability(latestSource).words} words</span>
          </div>
        </div>
      )}
    </div>
  );
}
