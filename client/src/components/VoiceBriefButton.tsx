/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * VoiceBriefButton.tsx — FEAT-H5.
 *
 * Small button that uses the Web Speech API to transcribe a teacher
 * brief. On done, calls onTranscript with the transcribed text so the
 * caller can feed it into parseNaturalLanguageInput.
 */

import React, { useEffect } from "react";
import { useVoiceToTextHook } from "@/hooks/useVoiceToTextHook";

export interface VoiceBriefButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function VoiceBriefButton(props: VoiceBriefButtonProps): React.ReactElement | null {
  const voice = useVoiceToTextHook();

  useEffect(() => {
    if (voice.state === "done" && voice.transcript) {
      props.onTranscript(voice.transcript);
      voice.reset();
    }
  }, [voice, props]);

  if (!voice.supported) return null;

  return (
    <span className={`inline-flex items-center gap-2 ${props.className || ""}`}>
      <button
        type="button"
        onClick={voice.state === "recording" ? voice.stop : voice.start}
        data-testid="voice-brief-button"
        aria-pressed={voice.state === "recording"}
        className={`text-xs px-2 py-1 rounded border ${
          voice.state === "recording" ? "bg-red-50 border-red-400 text-red-700" : "border-gray-300"
        }`}
      >
        {voice.state === "recording" ? "● Stop" : "🎤 Speak your brief"}
      </button>
      {voice.state === "permission-denied" && (
        <span className="text-xs text-amber-600">Microphone access required.</span>
      )}
    </span>
  );
}

export default VoiceBriefButton;
