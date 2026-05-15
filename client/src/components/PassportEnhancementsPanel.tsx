/**
 * PassportEnhancementsPanel — embedded next to Pupil Passport output.
 * Surfaces the five passport improvements.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  IdCard, Share2, Camera, RefreshCw, ThumbsUp, AlertTriangle, Copy, Save,
  Smile, Meh, Frown,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateSupplyShareLink, PUPIL_VOICE_STEMS, getPupilVoice, savePupilVoice,
  savePhoto, getPhoto, isPhotoExpired, syncFromTimeline, logStrategyFeedback,
  rankStrategies,
} from "@/lib/passport-enhancements";

interface Props {
  pupilId: string;
  pupilName: string;
  yearGroup?: string;
  sendNeeds?: string[];
  body: string;
  issuedBy?: string;
}

const MOODS = [
  { v: 5, icon: Smile, label: "Happy" },
  { v: 4, icon: Smile, label: "Good" },
  { v: 3, icon: Meh,   label: "OK" },
  { v: 2, icon: Frown, label: "Tricky" },
  { v: 1, icon: Frown, label: "Hard" },
];

export default function PassportEnhancementsPanel({ pupilId, pupilName, yearGroup, sendNeeds, body, issuedBy = "Adaptly" }: Props) {
  const [shareUrl, setShareUrl] = useState<string>("");
  const [voice, setVoice] = useState(() => getPupilVoice(pupilId));
  const [responses, setResponses] = useState<Record<string, string>>(() => voice?.responses || {});
  const [mood, setMood] = useState<number>(voice?.mood || 3);
  const [photo, setPhotoState] = useState(() => getPhoto(pupilId));
  const [strategy, setStrategy] = useState("");
  const [tick, setTick] = useState(0);
  const ranking = useMemo(() => rankStrategies(pupilId), [pupilId, tick]);
  const synced = useMemo(() => syncFromTimeline(pupilId), [pupilId, tick]);

  function makeShare() {
    const url = generateSupplyShareLink({
      pupilName, yearGroup, sendNeeds, body, issuedBy, daysValid: 14,
    });
    setShareUrl(url);
    navigator.clipboard.writeText(url);
    toast.success("Supply-teacher link copied (expires in 14 days).");
  }

  function saveVoice() {
    const v = {
      pupilId,
      capturedAt: new Date().toISOString(),
      responses,
      mood,
    };
    savePupilVoice(v);
    setVoice(v);
    toast.success("Pupil voice saved.");
  }

  async function onPhotoFile(file: File | null) {
    if (!file) return;
    const dataUrl: string = await new Promise(res => {
      const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file);
    });
    const expires = new Date(); expires.setFullYear(expires.getFullYear() + 1);
    const rec = {
      pupilId, dataUrl,
      consentDate: new Date().toISOString(),
      consentBy: "current user",
      expiresAt: expires.toISOString(),
    };
    savePhoto(rec);
    setPhotoState(rec);
    toast.success("Photo saved with consent metadata. Auto-hides after 1 year.");
  }

  function logStrat(worked: boolean) {
    if (!strategy.trim()) { toast.error("Enter a strategy first."); return; }
    logStrategyFeedback({ pupilId, strategy, worked });
    setStrategy("");
    setTick(t => t + 1);
  }

  if (!pupilId) return (
    <Card className="border-amber-200 mt-4 border-dashed">
      <CardContent className="p-4 text-xs text-muted-foreground">
        Pick a pupil to enable Passport enhancements.
      </CardContent>
    </Card>
  );

  return (
    <Card className="border-amber-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <IdCard className="w-4 h-4 text-amber-600" />
          <p className="text-sm font-bold">Passport Enhancements — {pupilName}</p>
        </div>

        <Tabs defaultValue="share">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="share">Supply-teacher share</TabsTrigger>
            <TabsTrigger value="voice">Pupil voice</TabsTrigger>
            <TabsTrigger value="photo">Photo + consent</TabsTrigger>
            <TabsTrigger value="sync">Auto-sync</TabsTrigger>
            <TabsTrigger value="ranks">What worked</TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              60-second large-print view designed to be read in the 60 seconds before period 1.
            </p>
            <Button size="sm" onClick={makeShare} className="gap-1.5"><Share2 className="w-3.5 h-3.5" /> Generate link</Button>
            {shareUrl && (
              <div className="rounded-md bg-muted/30 p-2 text-[10px] break-all">{shareUrl}</div>
            )}
          </TabsContent>

          <TabsContent value="voice" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Pupil-facing screen — let the child fill these in independently.</p>
            <div className="space-y-2">
              {PUPIL_VOICE_STEMS.map(s => (
                <div key={s.id}>
                  <Label className="text-xs">{s.prompt}</Label>
                  <Input
                    placeholder={s.placeholder}
                    value={responses[s.id] || ""}
                    onChange={(e) => setResponses(prev => ({ ...prev, [s.id]: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              ))}
              <div>
                <Label className="text-xs">Today I feel…</Label>
                <div className="flex items-center gap-1 mt-1">
                  {MOODS.map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.v}
                        onClick={() => setMood(m.v)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          mood === m.v ? "bg-amber-500 text-white" : "bg-muted hover:bg-amber-100"
                        }`}
                        title={m.label}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button size="sm" onClick={saveVoice} className="gap-1.5"><Save className="w-3.5 h-3.5" /> Save voice</Button>
              {voice && <p className="text-[10px] text-muted-foreground">Last captured {new Date(voice.capturedAt).toLocaleString("en-GB")}.</p>}
            </div>
          </TabsContent>

          <TabsContent value="photo" className="space-y-2 pt-3">
            {isPhotoExpired(pupilId) && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-700 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Photo consent has expired and the photo is hidden. Re-capture with fresh consent to use again.
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onPhotoFile(e.target.files?.[0] || null)}
              className="block w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-amber-200 file:bg-amber-50 file:text-amber-700"
            />
            {photo && !isPhotoExpired(pupilId) && (
              <div className="flex items-center gap-3">
                <img src={photo.dataUrl} className="w-16 h-16 rounded-lg object-cover" alt={pupilName} />
                <div className="text-[11px]">
                  <p>Consent given by <strong>{photo.consentBy}</strong> on {new Date(photo.consentDate).toLocaleDateString("en-GB")}.</p>
                  <p className="text-muted-foreground">Auto-hides after {new Date(photo.expiresAt).toLocaleDateString("en-GB")}.</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sync" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Live-pull most-recent EHCP and BSP content from this pupil's timeline so the passport never goes stale.
            </p>
            {synced.ehcp && (
              <div className="rounded-md border border-indigo-200 bg-indigo-50 p-2 text-[11px]">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" /> EHCP — {new Date(synced.ehcp.capturedAt).toLocaleDateString("en-GB")}
                </p>
                <p className="line-clamp-3">{synced.ehcp.text}</p>
              </div>
            )}
            {synced.bsp && (
              <div className="rounded-md border border-orange-200 bg-orange-50 p-2 text-[11px]">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" /> BSP — {new Date(synced.bsp.capturedAt).toLocaleDateString("en-GB")}
                </p>
                <p className="line-clamp-3">{synced.bsp.text}</p>
              </div>
            )}
            {!synced.ehcp && !synced.bsp && (
              <p className="text-xs text-muted-foreground italic">No EHCP or BSP found in this pupil's timeline yet.</p>
            )}
          </TabsContent>

          <TabsContent value="ranks" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Quick teacher feedback. Strategies that work for this pupil rise to the top.
            </p>
            <div className="flex items-center gap-1.5">
              <Input value={strategy} onChange={(e) => setStrategy(e.target.value)} placeholder="e.g. visual timer / fidget cube" className="flex-1" />
              <Button size="sm" onClick={() => logStrat(true)}  className="gap-1"><ThumbsUp className="w-3.5 h-3.5" /> Worked</Button>
              <Button size="sm" variant="outline" onClick={() => logStrat(false)}>Didn't</Button>
            </div>
            {ranking.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No feedback logged yet.</p>
            ) : (
              <ul className="text-[11px] space-y-0.5 max-h-32 overflow-y-auto">
                {ranking.map(r => (
                  <li key={r.strategy} className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{Math.round(r.rate * 100)}%</Badge>
                    {r.strategy}
                    <span className="text-muted-foreground text-[10px] ml-auto">{r.success}/{r.total}</span>
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
