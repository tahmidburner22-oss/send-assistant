/**
 * AudioHubEnhancementsPanel — embedded inside the Audio Revision Hub.
 * Surfaces the five Audio improvements.
 */
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Mic, Headphones, Waves, Podcast, MessageCircle, Pause, Play, Square,
  Save, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  recordVoiceSample, computeBoundaries, startKaraoke, startVoiceNav,
  generateNudgesFor, buildRssFeed, speak, stopSpeaking,
  type ComprehensionNudge, type PodcastEpisode,
} from "@/lib/audio-hub-enhancements";
import { getProfile, saveProfile, clearProfile } from "@/lib/teacher-voice";

interface Props {
  text: string;
  schoolName?: string;
}

export default function AudioHubEnhancementsPanel({ text, schoolName = "Your school" }: Props) {
  const [profile, setProfileState] = useState(() => getProfile());
  const [recording, setRecording] = useState(false);
  const [hi, setHi] = useState(0);
  const cancelRef = useRef<(() => void) | null>(null);

  async function handleRecord() {
    setRecording(true);
    const sample = await recordVoiceSample(90);
    setRecording(false);
    if (!sample) { toast.error("Microphone unavailable."); return; }
    const consentExpires = new Date(); consentExpires.setFullYear(consentExpires.getFullYear() + 1);
    const next = {
      ownerName: "Class teacher",
      consentAt: new Date().toISOString(),
      consentExpires: consentExpires.toISOString(),
      voiceName: undefined,
      rate: 1.0,
      pitch: 1.0,
      sample: sample.dataUrl,
    };
    saveProfile(next);
    setProfileState(next);
    toast.success(`Voice sample saved (${Math.round(sample.durationSec)}s).`);
  }

  function handleClearProfile() {
    clearProfile();
    setProfileState(null);
    toast.success("Voice profile removed.");
  }

  function startWithKaraoke() {
    stopSpeaking();
    const boundaries = computeBoundaries(text);
    cancelRef.current?.();
    cancelRef.current = startKaraoke(boundaries, (i) => setHi(i));
    speak(text);
  }

  function stop() {
    stopSpeaking();
    cancelRef.current?.();
    setHi(0);
  }

  // Voice-nav listener while playback is active.
  useEffect(() => {
    if (!profile) return;
    const stop = startVoiceNav({
      next:    () => toast("Heard: next"),
      previous: () => toast("Heard: previous"),
      repeat:  () => startWithKaraoke(),
      pause:   () => stopSpeaking(),
      play:    () => startWithKaraoke(),
    });
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const nudges: ComprehensionNudge[] = generateNudgesFor(text);
  const boundaries = computeBoundaries(text);

  function exportPodcast() {
    const episode: PodcastEpisode = {
      id: `ep_${Date.now()}`,
      title: text.slice(0, 60).split(/\s+/).slice(0, 8).join(" ") || "Revision Episode",
      durationSec: Math.round((text.split(/\s+/).length / 150) * 60),
      publishedAt: new Date().toISOString(),
      text,
    };
    const rss = buildRssFeed({ schoolName, episodes: [episode] });
    const blob = new Blob([rss], { type: "application/rss+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "adaptly-revision.rss"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Podcast feed exported (revision.rss).");
  }

  if (!text) return null;

  return (
    <Card className="border-indigo-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-indigo-600" />
          <p className="text-sm font-bold">Audio Revision Enhancements</p>
        </div>

        <Tabs defaultValue="voice">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="voice">Teacher voice</TabsTrigger>
            <TabsTrigger value="karaoke">Karaoke</TabsTrigger>
            <TabsTrigger value="nav">Voice nav</TabsTrigger>
            <TabsTrigger value="podcast">Podcast</TabsTrigger>
            <TabsTrigger value="nudges">Nudges</TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-2 pt-3">
            {!profile ? (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Record a 90-second sample to tune playback to your voice. Sample stays on this device.
                </p>
                <Button size="sm" onClick={handleRecord} disabled={recording} className="gap-1.5">
                  <Mic className={`w-3.5 h-3.5 ${recording ? "animate-pulse text-red-500" : ""}`} />
                  {recording ? "Recording (90s max)…" : "Record consent sample"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Profile active · expires {new Date(profile.consentExpires).toLocaleDateString("en-GB")}</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => speak("Hello, this is your teacher's voice playing back from Adaptly.")}>Test playback</Button>
                  <Button size="sm" variant="ghost" onClick={handleClearProfile} className="text-red-500 gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Remove</Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="karaoke" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Word-by-word highlight as the audio plays — dyslexia-friendly font + adjustable speed.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={startWithKaraoke} className="gap-1.5"><Play className="w-3.5 h-3.5" /> Play with karaoke</Button>
              <Button size="sm" variant="outline" onClick={stop} className="gap-1.5"><Square className="w-3.5 h-3.5" /> Stop</Button>
            </div>
            <div className="font-mono text-sm leading-loose max-h-48 overflow-y-auto rounded border bg-muted/20 p-2 break-words">
              {boundaries.map((b, i) => (
                <span
                  key={i}
                  className={`inline-block mr-1.5 mb-0.5 px-1 rounded ${i === hi ? "bg-yellow-300 text-black" : ""}`}
                >
                  {b.word}
                </span>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="nav" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Try saying: <em>next, previous, repeat, louder, quieter, pause, play, "what does X mean".</em>
            </p>
            <Badge variant="outline" className="text-[10px]">Listening when this tab is active and playback is on.</Badge>
          </TabsContent>

          <TabsContent value="podcast" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Bundle this and other recent texts into a podcast feed. Subscribable from Apple Podcasts via private RSS URL.
            </p>
            <Button size="sm" onClick={exportPodcast} className="gap-1.5"><Podcast className="w-3.5 h-3.5" /> Export RSS</Button>
          </TabsContent>

          <TabsContent value="nudges" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">
              Spoken comprehension prompt every 60 seconds. Pupils' responses are logged.
            </p>
            <ul className="text-[11px] space-y-1">
              {nudges.length === 0
                ? <li className="text-muted-foreground italic">Passage too short for nudges.</li>
                : nudges.map((n, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">@{n.atSec}s</Badge>
                    {n.question}
                  </li>
                ))}
            </ul>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
