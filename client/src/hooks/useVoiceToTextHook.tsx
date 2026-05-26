/**
 * @copyright 2026 Adaptly Ltd. All rights reserved.
 * @license Proprietary.
 *
 * hooks/useVoiceToTextHook.tsx — FEAT-H5.
 *
 * Lightweight Web Speech API wrapper. Exposes a simple state machine:
 * idle → recording → transcribing → done | permission-denied.
 * Server-side / SSR safe (degrades to permission-unsupported).
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceState = "idle" | "recording" | "transcribing" | "done" | "permission-denied" | "unsupported";

interface SpeechRecognitionLike {
  start(): void;
  stop(): void;
  abort(): void;
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface UseVoiceToTextResult {
  state: VoiceState;
  transcript: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
  supported: boolean;
}

export function useVoiceToTextHook(): UseVoiceToTextResult {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const ctorRef = useRef<(new () => SpeechRecognitionLike) | null>(null);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const ctor = getSpeechRecognitionCtor();
    ctorRef.current = ctor;
    if (!ctor) setState("unsupported");
  }, []);

  const start = useCallback(() => {
    const ctor = ctorRef.current;
    if (!ctor) {
      setState("unsupported");
      return;
    }
    setTranscript("");
    setState("recording");
    const recog = new ctor();
    recog.lang = "en-GB";
    recog.interimResults = false;
    recog.continuous = false;
    recog.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + " ";
      }
      setTranscript(text.trim());
      setState("done");
    };
    recog.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setState("permission-denied");
      } else {
        setState("idle");
      }
    };
    recog.onend = () => {
      setState((s) => (s === "recording" ? "idle" : s));
    };
    recogRef.current = recog;
    try {
      recog.start();
    } catch {
      setState("idle");
    }
  }, []);

  const stop = useCallback(() => {
    if (recogRef.current) {
      try {
        recogRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setState((s) => (s === "permission-denied" || s === "unsupported" ? s : "idle"));
  }, []);

  return {
    state,
    transcript,
    start,
    stop,
    reset,
    supported: state !== "unsupported" && ctorRef.current !== null,
  };
}
