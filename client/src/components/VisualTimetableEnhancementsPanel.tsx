/**
 * VisualTimetableEnhancementsPanel — embedded inside Visual Timetable.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarRange, Volume2, AlertTriangle, Clock, Smartphone, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  type SymbolLibrary, LIBRARY_LABEL, symbolFor, setSymbolLibrary, getSymbolLibrary,
  type TimetableSlot, type TimetableDay,
  nowNextThen,
  speakAudioCue,
  applyDisruption, type DisruptionKind,
  transitionWarning, vibratePupilDevice,
} from "@/lib/visual-timetable-enhancements";

interface Props {
  pupilId?: string;
  pupilName?: string;
  day: TimetableDay;
  onUpdateDay?: (day: TimetableDay) => void;
}

export default function VisualTimetableEnhancementsPanel({ pupilId, pupilName, day, onUpdateDay }: Props) {
  const [library, setLibrary] = useState<SymbolLibrary>(pupilId ? getSymbolLibrary(pupilId) : "emoji");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const slot = useMemo(() => nowNextThen(day.slots), [day.slots, tick]);
  const warning = useMemo(() => slot.now ? transitionWarning(slot.now) : null, [slot.now, tick]);

  function changeLibrary(lib: SymbolLibrary) {
    setLibrary(lib);
    if (pupilId) setSymbolLibrary(pupilId, lib);
    toast.success(`Switched to ${LIBRARY_LABEL[lib]}.`);
  }

  function fireDrill() {
    const result = applyDisruption(day, "fire-drill", { durationMins: 20 });
    onUpdateDay?.({ ...day, slots: result.newSlots });
    toast.warning(result.swapCard);
  }

  function coverLesson() {
    const result = applyDisruption(day, "cover-lesson", {
      replacement: { label: "Quiet reading (cover)", symbolKey: "reading" },
    });
    onUpdateDay?.({ ...day, slots: result.newSlots });
    toast.success("Cover lesson applied.");
  }

  function vibrateNow() {
    if (warning?.vibrationMs) {
      vibratePupilDevice(warning.vibrationMs);
      toast.info("Sent vibration cue to pupil iPad.");
    }
  }

  return (
    <Card className="border-purple-200 mt-4">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-purple-600" />
          <p className="text-sm font-bold">Visual Timetable Enhancements{pupilName ? ` — ${pupilName}` : ""}</p>
          {warning && (
            <Badge variant="destructive" className="ml-auto gap-1 text-[10px]">
              <Clock className="w-3 h-3" /> {warning.level}-min warning
            </Badge>
          )}
        </div>

        <Tabs defaultValue="library">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="library">Symbols</TabsTrigger>
            <TabsTrigger value="ta">TA mode</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="disrupt">Disruption</TabsTrigger>
            <TabsTrigger value="warn">Countdown</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-2 pt-3">
            <Label className="text-xs">Symbol library (per pupil)</Label>
            <Select value={library} onValueChange={(v) => changeLibrary(v as SymbolLibrary)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(LIBRARY_LABEL) as SymbolLibrary[]).map((k) => (
                  <SelectItem key={k} value={k}>{LIBRARY_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">Schools must hold the appropriate licence for PCS / Widgit / Makaton — emoji is the licence-free fallback.</p>
            <div className="rounded-md border bg-muted/20 p-2 text-[11px] flex flex-wrap gap-2">
              {day.slots.slice(0, 8).map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 rounded border bg-white px-2 py-1">
                  <span className="text-base">{symbolFor(s.symbolKey, library)}</span>
                  <span>{s.label}</span>
                </span>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ta" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Mobile-friendly Now/Next/Then strip — read-only for TAs.</p>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              {(["now", "next", "then"] as const).map((k) => {
                const s = (slot as Record<typeof k, TimetableSlot | undefined>)[k];
                const colour = k === "now" ? "border-emerald-300 bg-emerald-50/40" : k === "next" ? "border-amber-300 bg-amber-50/40" : "border-blue-300 bg-blue-50/40";
                return (
                  <div key={k} className={`rounded-md border ${colour} p-2`}>
                    <p className="text-[10px] uppercase tracking-wide">{k}</p>
                    <p className="text-2xl">{s ? symbolFor(s.symbolKey, library) : "—"}</p>
                    <p className="font-bold">{s?.label || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{s ? `${s.startTime}–${s.endTime}` : ""}</p>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="audio" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Speak the upcoming slot — useful for VI / pre-readers.</p>
            <Button size="sm" onClick={() => slot.next && speakAudioCue(slot.next)} className="gap-1.5" disabled={!slot.next}>
              <Volume2 className="w-3.5 h-3.5" /> Cue: "{slot.next?.label || "—"}"
            </Button>
          </TabsContent>

          <TabsContent value="disrupt" className="space-y-2 pt-3">
            <p className="text-[11px] text-muted-foreground">Fire drill or cover lesson — re-flow the day in one tap.</p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={fireDrill} className="gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Fire drill</Button>
              <Button size="sm" variant="outline" onClick={coverLesson} className="gap-1.5">Cover lesson</Button>
            </div>
          </TabsContent>

          <TabsContent value="warn" className="space-y-2 pt-3">
            {warning ? (
              <div className="rounded-md border-amber-300 border bg-amber-50/50 p-2 text-amber-800 text-[11px]">
                <p className="font-bold flex items-center gap-1.5"><Clock className="w-3 h-3" /> {warning.message}</p>
                <Button size="sm" variant="ghost" onClick={vibrateNow} className="gap-1.5 mt-1">
                  <Smartphone className="w-3.5 h-3.5" /> Vibrate pupil device
                </Button>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">No warning right now — pupil is in the middle of a slot or no slot is active.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
