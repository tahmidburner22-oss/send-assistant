/**
 * NewsletterEnhancementsPanel — embedded inside Parent Newsletter tool page.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Mail, Image as ImageIcon, Volume2, Square, ShieldAlert, Send, Activity } from "lucide-react";
import { toast } from "sonner";
import {
  readability, wordsAboveTarget,
  suggestImagesForNewsletter,
  logDelivery, deliveryLog,
  speakNewsletter, stopSpeaking,
  lintNewsletter,
} from "@/lib/newsletter-enhancements";

interface Props {
  text: string;            // current newsletter draft (live-bound from parent tool)
  subject?: string;
  recipients?: number;
  language?: string;       // "en-GB", "pl-PL", "ur-PK", etc.
}

export default function NewsletterEnhancementsPanel({
  text, subject = "Parent Newsletter", recipients = 0, language = "en-GB",
}: Props) {
  const [target, setTarget] = useState(11);   // default UK average parent reading age
  const [speaking, setSpeaking] = useState(false);
  const [tick, setTick] = useState(0);

  const score = useMemo(() => (text ? readability(text) : null), [text]);
  const flagged = useMemo(() => (text ? wordsAboveTarget(text, target) : []), [text, target]);
  const images = useMemo(() => (text ? suggestImagesForNewsletter(text) : []), [text]);
  const findings = useMemo(() => (text ? lintNewsletter(text) : []), [text]);
  const sends = useMemo(() => deliveryLog(), [tick]);

  const errors = findings.filter((f) => f.severity === "error");
  const warns  = findings.filter((f) => f.severity === "warn");

  function deliver(channel: "portal" | "email" | "sms") {
    if (!text) { toast.error("Empty newsletter."); return; }
    logDelivery({ channel, recipients, subject, byteSize: text.length });
    setTick((t) => t + 1);
    toast.success(`${channel === "portal" ? "Posted to Parent Portal" : channel === "email" ? "Email queued" : "SMS queued"} — ${recipients} recipient${recipients === 1 ? "" : "s"}`);
  }

  function toggleSpeak() {
    if (speaking) { stopSpeaking(); setSpeaking(false); }
    else { void speakNewsletter(text, language); setSpeaking(true); }
  }

  if (!text) {
    return (
      <Card className="border-amber-200 mt-4 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">Generate a newsletter to enable enhancements.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-amber-600" />
          <p className="text-sm font-bold">Newsletter Enhancements</p>
        </div>

        <Tabs defaultValue="readability">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="readability">Reading age</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="deliver">Deliver</TabsTrigger>
            <TabsTrigger value="lint">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="readability" className="space-y-2 pt-3">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <Label className="text-xs">Target reading age</Label>
                <span className="text-xs font-bold text-amber-700">age {target}</span>
              </div>
              <Slider value={[target]} onValueChange={(v) => setTarget(v[0])} min={7} max={16} step={1} />
              <p className="text-[10px] text-muted-foreground mt-1">UK average adult parent reading age is ~11. Slide higher for sixth-form / professional audiences.</p>
            </div>
            {score && (
              <div className="rounded-md border bg-muted/20 p-2 text-[11px]">
                <p>FK grade: <strong>{score.fkGrade}</strong> · UK reading age: <strong>{score.ukReadingAge}</strong></p>
                <p>{score.words} words · {score.sentences} sentences</p>
                {flagged.length > 0 && (
                  <p className="mt-1 text-rose-700">Words above target ({flagged.length}): {flagged.slice(0, 12).join(", ")}{flagged.length > 12 ? "…" : ""}</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="images" className="space-y-2 pt-3">
            {images.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">No image hints matched the current text.</p>
            ) : (
              <ul className="space-y-1.5">
                {images.map((img, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border bg-muted/20 p-2 text-[11px]">
                    <span><strong>¶{img.paragraphIndex + 1}</strong> · {img.query}</span>
                    <a href={img.url} target="_blank" rel="noreferrer" className="text-amber-700 underline">find image</a>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-muted-foreground">Alt text is auto-derived from the topic — paste image into the email/portal with this alt.</p>
          </TabsContent>

          <TabsContent value="audio" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Speech-synthesis read-back ({language}). Useful for parents with low literacy.</p>
            <Button size="sm" onClick={toggleSpeak} className="gap-1.5">
              {speaking ? <><Square className="w-3.5 h-3.5" /> Stop</> : <><Volume2 className="w-3.5 h-3.5" /> Read aloud</>}
            </Button>
          </TabsContent>

          <TabsContent value="deliver" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Push the newsletter and record the delivery for audit.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => deliver("portal")} className="gap-1.5"><Send className="w-3.5 h-3.5" /> Post to Portal</Button>
              <Button size="sm" variant="outline" onClick={() => deliver("email")} className="gap-1.5"><Mail className="w-3.5 h-3.5" /> Email parents</Button>
              <Button size="sm" variant="outline" onClick={() => deliver("sms")} className="gap-1.5"><Activity className="w-3.5 h-3.5" /> SMS</Button>
            </div>
            {sends.length > 0 && (
              <div className="text-[10px] text-muted-foreground mt-2">
                Last 5 sends: {sends.slice(-5).map((s) => `${s.channel} (${new Date(s.at).toLocaleDateString("en-GB")})`).join(", ")}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lint" className="space-y-2 pt-3">
            {findings.length === 0 ? (
              <p className="text-xs text-emerald-700">No compliance issues detected.</p>
            ) : (
              <ul className="space-y-1.5 text-[11px]">
                {[...errors, ...warns].map((f, i) => (
                  <li key={i} className={`flex items-start gap-2 rounded-md border p-2 ${f.severity === "error" ? "border-rose-300 bg-rose-50/50 text-rose-800" : "border-amber-300 bg-amber-50/50 text-amber-800"}`}>
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p><Badge variant="outline" className="text-[9px] mr-1">{f.rule}</Badge>{f.message}</p>
                      {f.excerpt && <p className="italic mt-0.5">"{f.excerpt}"</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
