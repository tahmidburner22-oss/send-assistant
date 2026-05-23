/**
 * NotesPad — auto-saving lesson notes for the Listen & Learn phase.
 *
 * • Persists to localStorage on every keystroke (debounced via React state
 *   render — no need for an explicit timer; localStorage writes are cheap).
 * • Surfaces a subtle "Auto-saved" pill so the parent can trust that work
 *   isn't lost if the browser is closed mid-session.
 * • Read-aloud helper uses the existing Web Speech wrapper so a child can
 *   hear back what they just typed (useful for SLCN / dyslexia profiles).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { speakText, speechSupported, stopSpeaking } from "@/lib/flashcards-v2-enhancements";
import { loadNotes, saveNotes } from "@/lib/revision-session-store";

interface NotesPadProps {
  sessionId: string;
  /** Pupil-facing prompt above the textarea. */
  prompt?: string;
  /** Inherit the session-wide accessibility font/size for legibility. */
  fontSize: number;
  fontFamily: string;
  /** Notify parent so the Runner can roll up final notes into the run. */
  onChange?: (notes: string) => void;
  /** Disabled while the audio lesson is loading, etc. */
  disabled?: boolean;
}

const SAVED_PILL_DURATION_MS = 1200;

export default function NotesPad({
  sessionId,
  prompt = "Type what you notice here…",
  fontSize,
  fontFamily,
  onChange,
  disabled = false,
}: NotesPadProps) {
  const [value, setValue] = useState<string>(() => loadNotes(sessionId));
  const [savedFlash, setSavedFlash] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const flashTimer = useRef<number | null>(null);

  // Hydrate from store when sessionId changes (e.g. resumed run).
  useEffect(() => {
    setValue(loadNotes(sessionId));
  }, [sessionId]);

  // Persist + bubble up.
  const handleChange = useCallback(
    (next: string) => {
      setValue(next);
      saveNotes(sessionId, next);
      onChange?.(next);

      setSavedFlash(true);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(
        () => setSavedFlash(false),
        SAVED_PILL_DURATION_MS,
      );
    },
    [sessionId, onChange],
  );

  // Cleanup the saved-pill timer on unmount.
  useEffect(() => () => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
  }, []);

  // Stop any TTS that's still running when the component unmounts.
  useEffect(() => () => {
    stopSpeaking();
  }, []);

  const ttsAvailable = speechSupported();
  const handleSpeak = () => {
    if (!ttsAvailable) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    if (!value.trim()) return;
    speakText(value, { rate: 0.9, lang: "en-GB" });
    setSpeaking(true);
    // SpeechSynthesis doesn't always fire "end" reliably across browsers;
    // we reset the visual state after a generous timeout based on length.
    const ms = Math.min(value.length * 70, 30_000) + 600;
    window.setTimeout(() => setSpeaking(false), ms);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/30 border-b border-border/50">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Your notes
        </div>
        <div className="flex items-center gap-1.5">
          {savedFlash && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              Auto-saved
            </span>
          )}
          {ttsAvailable && (
            <button
              type="button"
              onClick={handleSpeak}
              disabled={disabled || (!speaking && !value.trim())}
              aria-label={speaking ? "Stop reading aloud" : "Read notes aloud"}
              className={`inline-flex items-center gap-1 rounded-full px-2 h-6 text-[10px] font-semibold border transition-colors ${
                speaking
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-border text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              {speaking ? "Stop" : "Read"}
            </button>
          )}
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={prompt}
        disabled={disabled}
        className="w-full resize-none px-3 py-2.5 text-foreground placeholder:text-muted-foreground/70 focus:outline-none disabled:opacity-60"
        style={{ fontSize, fontFamily, minHeight: 160, lineHeight: 1.55 }}
        aria-label="Lesson notes"
      />
    </div>
  );
}
