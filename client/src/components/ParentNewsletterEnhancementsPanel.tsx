/**
 * ParentNewsletterEnhancementsPanel — surfaces 5 v2 improvements for the
 * Parent Newsletter / Letter tool:
 *   1. Reading-age check (FK grade, long sentences, jargon swaps)
 *   2. Channel-aware outputs (SMS / Instagram / noticeboard / email subject)
 *   3. Tone preview (5-axis scoring + warnings)
 *   4. Mail-merge by surname (CSV in → per-family copies + CSV out)
 *   5. GDPR scrub validator (severity-banded findings)
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Gauge, Megaphone, Palette, Users, ShieldCheck, Printer, Copy, Download,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import {
  analyseReadability, readabilityHtml, type ReadabilityReport,
  deriveChannels, type ChannelOutputs,
  scoreTone, TONE_AXIS_LABEL, type ToneAxis,
  parseRecipientsCsv, mergeAll, mergeCsvExport, type MergeRecipient, type MergedLetter,
  summariseGdpr, gdprSummaryHtml, buildFamilyDraftReviewGate,
} from "@/lib/parent-newsletter-enhancements";

interface Props {
  result: string;
  values: Record<string, string>;
}

function openPrint(html: string, title: string): void {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) {
    toast.error("Pop-up blocked — allow pop-ups to print.");
    return;
  }
  w.document.write(`<!doctype html><html><head><title>${title}</title></head><body>${html}<script>window.print();<\/script></body></html>`);
  w.document.close();
}

function downloadFile(filename: string, content: string, mime = "text/csv"): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}`);
  } catch {
    toast.error("Copy failed");
  }
}

export default function ParentNewsletterEnhancementsPanel({ result, values }: Props) {
  const { children } = useApp();

  const readability: ReadabilityReport = useMemo(() => analyseReadability(result || ""), [result]);
  const channels: ChannelOutputs = useMemo(() => deriveChannels({
    letterText: result || "",
    schoolName: values.schoolName || "",
    yearGroup: values.yearGroup || "",
    date: values.date || "",
    actionRequired: values.actionRequired || "",
  }), [result, values.schoolName, values.yearGroup, values.date, values.actionRequired]);
  const tone = useMemo(() => scoreTone(result || ""), [result]);
  const gdpr = useMemo(() => summariseGdpr(result || ""), [result]);
  const reviewGate = useMemo(() => buildFamilyDraftReviewGate({
    privacy: gdpr,
    readability,
    communicationType: values.type,
  }), [gdpr, readability, values.type]);

  // Mail-merge state
  const classCsv = useMemo(() => {
    return children
      .map((c) => {
        const parts = (c.name || "").trim().split(/\s+/);
        const last = parts.length > 1 ? parts[parts.length - 1] : "";
        const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0] || "";
        return [last, first, c.parentName || "", c.parentEmail || ""].join(",");
      })
      .filter((line) => line.split(",")[0]);
  }, [children]);
  const [mergeCsv, setMergeCsv] = useState<string>(() => classCsv.join("\n"));
  const recipients: MergeRecipient[] = useMemo(() => parseRecipientsCsv(mergeCsv), [mergeCsv]);
  const merged: MergedLetter[] = useMemo(() => mergeAll(result || "", recipients), [result, recipients]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [mergeReviewAcknowledged, setMergeReviewAcknowledged] = useState(false);
  useEffect(() => {
    setMergeReviewAcknowledged(false);
  }, [result, values.type, reviewGate.status, gdpr.high, gdpr.medium]);

  const toneAxes: { axis: ToneAxis; v: number }[] = [
    { axis: "warm", v: tone.warm },
    { axis: "formal", v: tone.formal },
    { axis: "urgent", v: tone.urgent },
    { axis: "actionOriented", v: tone.actionOriented },
    { axis: "inclusive", v: tone.inclusive },
  ];

  const bandColour = readability.band === "easy" ? "text-emerald-700"
    : readability.band === "fair" ? "text-cyan-700"
    : readability.band === "hard" ? "text-amber-700"
    : "text-rose-700";

  return (
    <Card className="border-pink-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-pink-600" />
          <p className="text-sm font-bold">Newsletter extras — draft review</p>
        </div>
        <div className={`rounded-lg border p-2.5 text-[11px] ${reviewGate.status === "blocked" ? "border-rose-300 bg-rose-50 text-rose-900" : reviewGate.status === "attention" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-sky-300 bg-sky-50 text-sky-900"}`}>
          <p className="font-semibold">{reviewGate.label}</p>
          {reviewGate.blockers.map(blocker => <p key={blocker} className="mt-1">{blocker}</p>)}
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {reviewGate.checks.map(check => <li key={check}>{check}</li>)}
          </ul>
          <p className="mt-1.5 font-medium">This tool creates drafts and local exports only. It does not send messages or approve distribution.</p>
        </div>

        <Tabs defaultValue="readability">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="readability"><Gauge className="w-3.5 h-3.5 mr-1" />Reading age</TabsTrigger>
            <TabsTrigger value="channels"><Megaphone className="w-3.5 h-3.5 mr-1" />Channels</TabsTrigger>
            <TabsTrigger value="tone"><Palette className="w-3.5 h-3.5 mr-1" />Tone</TabsTrigger>
            <TabsTrigger value="merge"><Users className="w-3.5 h-3.5 mr-1" />Mail-merge</TabsTrigger>
            <TabsTrigger value="gdpr"><ShieldCheck className="w-3.5 h-3.5 mr-1" />GDPR scrub</TabsTrigger>
          </TabsList>

          <TabsContent value="readability" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Flesch-Kincaid scoring against the UK parent-comms target (Grade 8 / age 13). Long sentences and jargon are
              flagged with plain-English replacements.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <Badge className="bg-pink-100 text-pink-700 border-pink-300">Reading age ~{readability.readingAge}</Badge>
              <Badge variant="outline">FK grade {readability.fkGrade}</Badge>
              <Badge variant="outline">{readability.wordCount} words</Badge>
              <Badge variant="outline">avg {readability.avgSentenceLen} w/sentence</Badge>
            </div>
            <p className={`text-[11px] font-semibold ${bandColour}`}>{readability.bandLabel}</p>
            {readability.longSentences.length > 0 && (
              <details className="text-[11px]" open>
                <summary className="cursor-pointer font-semibold text-amber-700">
                  {readability.longSentences.length} long sentence(s) — likely to lose skim-readers
                </summary>
                <ul className="mt-1 pl-4 list-disc space-y-1 max-h-40 overflow-y-auto">
                  {readability.longSentences.map((s, i) => (
                    <li key={i}><span className="text-slate-400">[{s.words} words]</span> {s.text}</li>
                  ))}
                </ul>
              </details>
            )}
            {readability.jargonHits.length > 0 && (
              <details className="text-[11px]" open>
                <summary className="cursor-pointer font-semibold text-purple-700">
                  {readability.jargonHits.length} jargon term(s) — swap for plain English
                </summary>
                <ul className="mt-1 pl-4 list-none space-y-0.5">
                  {readability.jargonHits.map((j) => (
                    <li key={j.word}>
                      <strong>{j.word}</strong> <span className="text-slate-400">({j.count}×)</span> → <em className="text-emerald-700">{j.suggestion}</em>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <Button size="sm" variant="outline" onClick={() => openPrint(readabilityHtml(readability), "Reading-age report")} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print report
            </Button>
          </TabsContent>

          <TabsContent value="channels" className="space-y-3 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Same letter, four channels: SMS (≤160 chars), Instagram caption with hashtags, noticeboard poster, and an
              email subject line. The original letter is untouched.
            </p>
            <div className="rounded-md border border-pink-100 bg-pink-50/40 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-pink-800">SMS · {channels.sms.length}/160</span>
                <Button size="sm" variant="ghost" className="h-6 px-2 gap-1" onClick={() => copyToClipboard(channels.sms, "SMS")}>
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
              <pre className="text-[11px] whitespace-pre-wrap font-sans m-0 text-slate-800">{channels.sms}</pre>
            </div>
            <div className="rounded-md border border-purple-100 bg-purple-50/40 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-purple-800">Instagram · {channels.instagram.length} chars</span>
                <Button size="sm" variant="ghost" className="h-6 px-2 gap-1" onClick={() => copyToClipboard(channels.instagram, "IG caption")}>
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
              <pre className="text-[11px] whitespace-pre-wrap font-sans m-0 text-slate-800">{channels.instagram}</pre>
            </div>
            <div className="rounded-md border border-amber-100 bg-amber-50/40 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-amber-800">Noticeboard poster</span>
                <Button size="sm" variant="ghost" className="h-6 px-2 gap-1" onClick={() => copyToClipboard(channels.noticeboard, "poster")}>
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
              <pre className="text-[11px] whitespace-pre-wrap font-sans m-0 text-slate-800">{channels.noticeboard}</pre>
            </div>
            <div className="rounded-md border border-cyan-100 bg-cyan-50/40 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-cyan-800">Email subject ({channels.emailSubject.length} chars)</span>
                <Button size="sm" variant="ghost" className="h-6 px-2 gap-1" onClick={() => copyToClipboard(channels.emailSubject, "subject")}>
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
              <pre className="text-[11px] whitespace-pre-wrap font-sans m-0 text-slate-800">{channels.emailSubject}</pre>
            </div>
          </TabsContent>

          <TabsContent value="tone" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Five-axis tone scoring (per 100 words). The dominant axis tells you what parents will <em>feel</em> when they
              skim it — adjust if it doesn't match the message you intended.
            </p>
            <div className="space-y-1.5">
              {toneAxes.map((a) => {
                const isDominant = a.axis === tone.dominant;
                return (
                  <div key={a.axis} className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className={isDominant ? "font-bold text-pink-700" : "text-slate-700"}>
                        {TONE_AXIS_LABEL[a.axis]}{isDominant ? " · dominant" : ""}
                      </span>
                      <span className="text-slate-500">{a.v}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${isDominant ? "bg-pink-600" : "bg-pink-300"}`}
                        style={{ width: `${Math.min(100, a.v)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {tone.warnings.length > 0 && (
              <ul className="text-[11px] mt-2 space-y-1">
                {tone.warnings.map((w, i) => (
                  <li key={i} className="text-amber-700 flex items-start gap-1.5">
                    <span>⚠</span><span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="merge" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              CSV in (one recipient per line: <code>lastName,firstName,parentName,parentEmail</code>) → local per-family draft copies
              with <code>Dear Mr/Mrs &lt;Surname&gt;</code> salutations. Class details are auto-loaded only for teacher review; no message is sent from this panel.
            </p>
            <Textarea
              value={mergeCsv}
              onChange={(e) => { setMergeCsv(e.target.value); setPreviewIdx(0); }}
              placeholder="Khan,Aisha,Mr Khan,a.khan@example.com"
              className="text-[11px] font-mono h-24"
            />
            <label className="flex items-start gap-2 rounded-md border border-pink-100 bg-pink-50/40 p-2 text-[11px] text-slate-700">
              <input
                type="checkbox"
                checked={mergeReviewAcknowledged}
                disabled={!reviewGate.mayExportPersonalisedCopies}
                onChange={event => setMergeReviewAcknowledged(event.target.checked)}
                className="mt-0.5 h-3.5 w-3.5"
              />
              <span>I have reviewed the recipients, factual content and privacy findings. I understand this creates local draft copies only; I remain responsible for any later distribution.</span>
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline">{recipients.length} recipient(s)</Badge>
              <Button size="sm" variant="outline"
                disabled={merged.length === 0 || !reviewGate.mayExportPersonalisedCopies || !mergeReviewAcknowledged}
                onClick={() => downloadFile("mail_merge.csv", mergeCsvExport(merged))}
                className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> Download merged CSV
              </Button>
              {merged.length > 0 && (
                <div className="flex items-center gap-1 ml-auto">
                  <Button size="sm" variant="ghost" className="h-7 px-2"
                    onClick={() => setPreviewIdx((i) => Math.max(0, i - 1))}>‹</Button>
                  <span className="text-[11px] text-slate-600">{previewIdx + 1}/{merged.length}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2"
                    onClick={() => setPreviewIdx((i) => Math.min(merged.length - 1, i + 1))}>›</Button>
                </div>
              )}
            </div>
            {merged.length > 0 && merged[previewIdx] && (
              <div className="rounded-md border bg-white p-3 max-h-72 overflow-y-auto">
                <p className="text-[11px] font-bold text-pink-700 mb-1">
                  {merged[previewIdx].recipient.firstName} {merged[previewIdx].recipient.lastName}
                  {merged[previewIdx].recipient.parentEmail ? ` · ${merged[previewIdx].recipient.parentEmail}` : ""}
                </p>
                <pre className="text-[11px] whitespace-pre-wrap font-sans m-0 text-slate-800">{merged[previewIdx].body}</pre>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gdpr" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Pre-send PII audit — UPNs, NHS numbers, full pupil names, DOBs, postcodes, medical/SEN flags, photo descriptors.
              Parent letters are widely forwarded, so flag risks even if your lawful basis covers them internally.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className={gdpr.high > 0 ? "bg-rose-100 text-rose-700 border-rose-300" : "bg-emerald-100 text-emerald-700 border-emerald-300"}>
                {gdpr.high} high
              </Badge>
              <Badge className="bg-amber-100 text-amber-800 border-amber-300">{gdpr.medium} medium</Badge>
              <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300">{gdpr.low} low</Badge>
              {gdpr.pass && <Badge className="bg-emerald-600 text-white">PASS</Badge>}
            </div>
            {gdpr.findings.length === 0 ? (
              <p className="text-[11px] italic text-emerald-700">No automated privacy concerns were flagged. A teacher must still review the recipient list, content and distribution route.</p>
            ) : (
              <div className="rounded-md border bg-white max-h-64 overflow-y-auto">
                <table className="w-full text-[10px]">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="text-left p-1.5 w-14">Sev</th>
                      <th className="text-left p-1.5 w-24">Category</th>
                      <th className="text-left p-1.5 w-28">Match</th>
                      <th className="text-left p-1.5">Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gdpr.findings.map((f, i) => (
                      <tr key={i} className="border-t border-slate-100 align-top">
                        <td className={`p-1.5 font-bold uppercase ${f.severity === "high" ? "text-rose-700" : f.severity === "medium" ? "text-amber-700" : "text-cyan-700"}`}>{f.severity}</td>
                        <td className="p-1.5">{f.category}</td>
                        <td className="p-1.5 font-mono">{f.match}</td>
                        <td className="p-1.5 text-slate-600">
                          {f.context}
                          <div className="text-[10px] text-emerald-700 italic mt-0.5">→ {f.recommendation}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={() => openPrint(gdprSummaryHtml(gdpr), "GDPR scrub report")} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print audit
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
