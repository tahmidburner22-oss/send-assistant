/**
 * WellbeingEnhancementsPanel — embedded inside Wellbeing Support tool page.
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, AlertTriangle, ShieldCheck, Send, Activity, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import {
  logMood, moodHistory, shouldAlertSenco,
  type Mood, MOOD_EMOJI, MOOD_LABEL,
  fiveWayBalance, FIVE_WAY_LABEL, type FiveWay,
  ZONE_DESCRIPTION, zoneFromMood, type Zone,
  crisisPathway, type CrisisType,
  type ExternalService, SERVICE_LABEL, handoffLetterText,
} from "@/lib/wellbeing-enhancements";

interface Props {
  pupilId: string;
  pupilName: string;
  schoolName?: string;
  /** Optional list of intervention text strings — feeds the Five Ways balance chart. */
  interventions?: string[];
}

const MOOD_ORDER: Mood[] = ["great", "ok", "meh", "sad", "angry"];

export default function WellbeingEnhancementsPanel({
  pupilId, pupilName, schoolName = "[School]", interventions = [],
}: Props) {
  const [tick, setTick] = useState(0);
  const [crisis, setCrisis] = useState<CrisisType>("low-mood");
  const [service, setService] = useState<ExternalService>("camhs");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderRole, setSenderRole] = useState("SENCO");

  const history = useMemo(() => moodHistory(pupilId, 30), [pupilId, tick]);
  const alert = useMemo(() => shouldAlertSenco(pupilId), [pupilId, tick]);
  const balance = useMemo(() => fiveWayBalance(interventions.map((t) => ({ text: t }))), [interventions]);
  const totalBalance = Object.values(balance).reduce((a, b) => a + b, 0);

  function record(m: Mood) {
    logMood({ pupilId, mood: m });
    setTick((t) => t + 1);
    toast.success(`Logged ${MOOD_LABEL[m]}.`);
  }

  function generateLetter() {
    if (!reason || !evidence) {
      toast.error("Add reason + at least one evidence line.");
      return;
    }
    const letter = handoffLetterText({
      service,
      pupilName,
      schoolName,
      senderName: senderName || "[Name]",
      senderRole,
      reason,
      evidence: evidence.split("\n").map((l) => l.trim()).filter(Boolean),
    });
    void navigator.clipboard?.writeText(letter).catch(() => {});
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pupilName.replace(/\W+/g, "_")}-${service}-referral.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Referral letter ready (copied + downloaded).");
  }

  if (!pupilId) {
    return (
      <Card className="border-pink-200 mt-4 border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground">Pick a pupil to enable wellbeing enhancements.</CardContent>
      </Card>
    );
  }

  const lastMood = history[history.length - 1]?.mood;
  const currentZone: Zone = lastMood ? zoneFromMood(lastMood) : "green";
  const zoneColors: Record<Zone, string> = {
    blue:   "bg-blue-100 text-blue-800 border-blue-300",
    green:  "bg-emerald-100 text-emerald-800 border-emerald-300",
    yellow: "bg-amber-100 text-amber-800 border-amber-300",
    red:    "bg-rose-100 text-rose-800 border-rose-300",
  };

  return (
    <Card className="border-pink-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-600" />
          <p className="text-sm font-bold">Wellbeing Enhancements — {pupilName}</p>
          {alert.alert && (
            <Badge variant="destructive" className="ml-auto gap-1 text-[10px]">
              <AlertTriangle className="w-3 h-3" /> SENCO alert: {alert.streak} red moods in a row
            </Badge>
          )}
        </div>

        <Tabs defaultValue="mood">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="mood">Mood</TabsTrigger>
            <TabsTrigger value="five-ways">5 Ways</TabsTrigger>
            <TabsTrigger value="zones">Zones</TabsTrigger>
            <TabsTrigger value="crisis">Crisis pathway</TabsTrigger>
            <TabsTrigger value="referral">Referral letter</TabsTrigger>
          </TabsList>

          <TabsContent value="mood" className="space-y-3 pt-3">
            <p className="text-[11px] text-muted-foreground">Tap an emoji to log mood. 3 reds in a row → SENCO alert.</p>
            <div className="flex flex-wrap gap-2">
              {MOOD_ORDER.map((m) => (
                <Button key={m} variant="outline" size="sm" onClick={() => record(m)} className="gap-1.5">
                  <span className="text-lg leading-none">{MOOD_EMOJI[m]}</span>
                  <span className="text-xs">{MOOD_LABEL[m]}</span>
                </Button>
              ))}
            </div>
            {history.length > 0 && (
              <div className="rounded-md border bg-muted/20 p-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Last 30 days</p>
                <div className="flex flex-wrap gap-1">
                  {history.map((h, i) => (
                    <span key={i} title={`${MOOD_LABEL[h.mood]} — ${new Date(h.at).toLocaleDateString("en-GB")}`} className="text-base">
                      {MOOD_EMOJI[h.mood]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="five-ways" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Audit balance across the Five Ways to Wellbeing tags found in your interventions.</p>
            {totalBalance === 0 ? (
              <p className="text-xs italic text-muted-foreground">No interventions tagged yet — add some intervention text to your plan.</p>
            ) : (
              <div className="space-y-1.5">
                {(Object.keys(balance) as FiveWay[]).map((way) => {
                  const pct = Math.round((balance[way] / totalBalance) * 100);
                  return (
                    <div key={way} className="text-[11px]">
                      <div className="flex justify-between"><span>{FIVE_WAY_LABEL[way]}</span><span className="text-muted-foreground">{balance[way]}</span></div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-pink-500" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="zones" className="space-y-2 pt-3">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ZONE_DESCRIPTION) as Zone[]).map((z) => (
                <div key={z} className={`rounded-md border p-2 ${zoneColors[z]} ${z === currentZone ? "ring-2 ring-offset-1" : ""}`}>
                  <p className="text-xs font-bold">{ZONE_DESCRIPTION[z].label}</p>
                  <p className="text-[10px]">{ZONE_DESCRIPTION[z].mood}</p>
                  <ul className="text-[10px] list-disc pl-4 mt-1">
                    {ZONE_DESCRIPTION[z].tools.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Currently inferred zone from latest mood: <strong>{ZONE_DESCRIPTION[currentZone].label}</strong>.</p>
          </TabsContent>

          <TabsContent value="crisis" className="space-y-2 pt-3">
            <Select value={crisis} onValueChange={(v) => setCrisis(v as CrisisType)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low-mood">Low mood</SelectItem>
                <SelectItem value="disclosure">Disclosure (abuse / harm)</SelectItem>
                <SelectItem value="safeguarding">Safeguarding concern</SelectItem>
                <SelectItem value="self-harm">Self-harm</SelectItem>
              </SelectContent>
            </Select>
            {(() => {
              const p = crisisPathway(crisis);
              return (
                <div className="text-[11px] space-y-1.5">
                  <p><strong>Immediate:</strong></p>
                  <ul className="list-disc pl-5">{p.immediate.map((s) => <li key={s}>{s}</li>)}</ul>
                  <p><strong>Escalation:</strong></p>
                  <ul className="list-disc pl-5">{p.escalation.map((s) => <li key={s}>{s}</li>)}</ul>
                  <p><strong>Documentation:</strong></p>
                  <ul className="list-disc pl-5">{p.documentation.map((s) => <li key={s}>{s}</li>)}</ul>
                  <p className="flex items-center gap-1.5 text-emerald-700 mt-1"><ShieldCheck className="w-3 h-3" /> Legal ref: {p.legalRef}</p>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="referral" className="space-y-2 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Service</Label>
                <Select value={service} onValueChange={(v) => setService(v as ExternalService)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SERVICE_LABEL) as ExternalService[]).map((k) => (
                      <SelectItem key={k} value={k}>{SERVICE_LABEL[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Sender name</Label>
                <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <Label className="text-xs">Sender role</Label>
                <Input value={senderRole} onChange={(e) => setSenderRole(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Reason</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="One-line reason for referral" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Evidence (one per line)</Label>
                <Textarea rows={4} value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder={"Boxall Profile completed 12/2/2026, score X\nClass observations Spring term"} />
              </div>
            </div>
            <Button size="sm" onClick={generateLetter} className="gap-1.5"><Send className="w-3.5 h-3.5" /> Generate referral letter</Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
