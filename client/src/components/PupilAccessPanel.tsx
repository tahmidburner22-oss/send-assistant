import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, Pause, StepBack, StepForward, Volume2, X } from "lucide-react";
import type { PupilReaderSegment } from "@/lib/pupilAccessibility";
import { spokenWordIndex } from "@/lib/pupilAccessibility";

interface PupilAccessPanelProps {
  segments: PupilReaderSegment[];
  onFocusModeChange: (active: boolean) => void;
}

export default function PupilAccessPanel({ segments, onFocusModeChange }: PupilAccessPanelProps) {
  const [open, setOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [wordIndex, setWordIndex] = useState<number | null>(null);
  const [speechRate, setSpeechRate] = useState(1);
  const [isDictating, setIsDictating] = useState(false);
  const [draft, setDraft] = useState("");
  const [dictationNotice, setDictationNotice] = useState("");
  const recognitionRef = useRef<any>(null);

  const current = segments[Math.min(segmentIndex, Math.max(segments.length - 1, 0))];
  const canRead = typeof window !== "undefined" && "speechSynthesis" in window;
  const hasSegments = segments.length > 0;

  const words = useMemo(() => current?.text.split(/\s+/).filter(Boolean) || [], [current?.text]);

  const stopReading = () => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setIsReading(false);
    setWordIndex(null);
  };

  const readCurrent = () => {
    if (!current || !canRead) return;
    stopReading();
    const utterance = new SpeechSynthesisUtterance(current.text);
    utterance.lang = "en-GB";
    utterance.rate = speechRate;
    utterance.onboundary = (event) => setWordIndex(spokenWordIndex(current.text, event.charIndex));
    utterance.onend = () => { setIsReading(false); setWordIndex(null); };
    utterance.onerror = () => { setIsReading(false); setWordIndex(null); };
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const stopDictation = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsDictating(false);
  };

  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setDictationNotice("Speech-to-text is not available in this browser. You can type your response below instead.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join("");
      setDraft(transcript);
      setDictationNotice("Review and edit this draft before you use it. Nothing is submitted automatically.");
    };
    recognition.onerror = () => {
      setIsDictating(false);
      setDictationNotice("Dictation stopped. Check the draft, then continue typing if needed.");
    };
    recognition.onend = () => setIsDictating(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsDictating(true);
    setDictationNotice("Listening. Speak in short phrases and say punctuation where helpful.");
  };

  useEffect(() => () => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    onFocusModeChange(focusMode);
    return () => onFocusModeChange(false);
  }, [focusMode, onFocusModeChange]);

  useEffect(() => {
    if (segmentIndex >= segments.length) setSegmentIndex(Math.max(segments.length - 1, 0));
  }, [segmentIndex, segments.length]);

  if (!hasSegments) return null;

  return (
    <section className="no-print rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-slate-900" aria-label="Pupil access tools">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Pupil access tools</p>
          <p className="text-xs text-slate-600">Listen, dictate a reviewable draft, or work through one short part at a time.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-900 hover:bg-sky-100">
          {open ? "Hide tools" : "Open tools"}
        </button>
      </div>

      {open && current && (
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-lg border border-sky-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-sky-800">Read and focus</p>
                <p className="text-xs text-slate-600">{current.label} · Part {segmentIndex + 1} of {segments.length}</p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                <input type="checkbox" checked={focusMode} onChange={(event) => setFocusMode(event.target.checked)} className="h-4 w-4 rounded border-sky-400" />
                Focus mode
              </label>
            </div>
            <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-7" aria-live="polite">
              {words.map((word, index) => <span key={`${word}-${index}`} className={index === wordIndex ? "rounded bg-amber-200 px-0.5 text-slate-950" : ""}>{word}{" "}</span>)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={isReading ? stopReading : readCurrent} disabled={!canRead} className="inline-flex items-center gap-1.5 rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50">
                {isReading ? <Pause className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                {isReading ? "Pause reading" : "Read this part"}
              </button>
              <label className="text-xs text-slate-700">Speed <select value={speechRate} onChange={(event) => setSpeechRate(Number(event.target.value))} className="ml-1 rounded border border-slate-300 bg-white p-1" aria-label="Reading speed"><option value={0.8}>Slow</option><option value={1}>Normal</option><option value={1.2}>Fast</option></select></label>
              <button type="button" onClick={() => { stopReading(); setSegmentIndex((value) => Math.max(0, value - 1)); }} disabled={segmentIndex === 0} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs disabled:opacity-40"><StepBack className="h-3.5 w-3.5" /> Previous</button>
              <button type="button" onClick={() => { stopReading(); setSegmentIndex((value) => Math.min(segments.length - 1, value + 1)); }} disabled={segmentIndex === segments.length - 1} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs disabled:opacity-40">Next <StepForward className="h-3.5 w-3.5" /></button>
            </div>
            {!canRead && <p className="mt-2 text-xs text-amber-800">Read-aloud is not available in this browser. You can still use focus mode and the typed response box.</p>}
          </div>

          <div className="rounded-lg border border-violet-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-800">Speak or type a draft</p>
            <p className="mt-1 text-xs text-slate-600">Use this for a response draft. Check it carefully before copying it into your worksheet or sharing it with your teacher.</p>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Your response draft appears here. You can type if you prefer." className="mt-3 min-h-28 w-full rounded-md border border-slate-300 p-2 text-sm leading-6 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200" aria-label="Editable response draft" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={isDictating ? stopDictation : startDictation} className="inline-flex items-center gap-1.5 rounded-md border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-900 hover:bg-violet-100">
                {isDictating ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                {isDictating ? "Stop dictation" : "Start dictation"}
              </button>
              <button type="button" onClick={() => setDraft("")} disabled={!draft} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs disabled:opacity-40"><X className="h-3.5 w-3.5" /> Clear draft</button>
            </div>
            <p className="mt-2 text-xs text-slate-600" aria-live="polite">{dictationNotice || "Nothing is submitted, marked, or saved to a pupil record by this tool."}</p>
          </div>
        </div>
      )}
    </section>
  );
}
