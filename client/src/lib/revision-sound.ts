/**
 * revision-sound.ts
 *
 * Tiny Web Audio helpers for the revision session: a soft single chime as a
 * 30s "phase ending" warning, a gentle double-chime at the end of a phase,
 * and a celebratory three-note flourish for the wrap-up screen.
 *
 * No asset files — every sound is synthesised on the fly with an oscillator +
 * gain envelope so the bundle stays small and there's nothing to host.
 *
 * All helpers are best-effort: if the AudioContext is unavailable, blocked
 * (autoplay policy), or fails for any reason, the function silently returns.
 */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (_ctx && _ctx.state !== "closed") return _ctx;
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    _ctx = new Ctor();
    return _ctx;
  } catch {
    return null;
  }
}

/**
 * Some browsers suspend the AudioContext until the first user gesture.
 * Call this from a click handler (e.g. "Start session") to unlock playback
 * for the rest of the page lifetime.
 */
export function unlockAudio(): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

interface ToneOpts {
  freq: number;
  durationMs: number;
  delayMs?: number;
  volume?: number;     // 0..1
  type?: OscillatorType;
}

function tone(opts: ToneOpts): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime + (opts.delayMs ?? 0) / 1000;
    const dur = opts.durationMs / 1000;
    const peak = Math.max(0.0001, Math.min(1, opts.volume ?? 0.18));

    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, now);

    // Quick attack, gentle exponential decay — feels chime-ish, not buzzy.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + Math.min(0.05, dur * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  } catch {
    // Best-effort only.
  }
}

/** A single soft chime — used 30s before a phase ends as a gentle warning. */
export function playWarningChime(): void {
  tone({ freq: 660, durationMs: 380, volume: 0.14, type: "sine" });
}

/** A two-note "ding-ding" — used when a phase completes. */
export function playPhaseCompleteChime(): void {
  tone({ freq: 587, durationMs: 280, volume: 0.16, type: "sine" });
  tone({ freq: 880, durationMs: 380, delayMs: 220, volume: 0.18, type: "sine" });
}

/** A small three-note flourish — used on the wrap-up screen. */
export function playSessionCompleteChime(): void {
  tone({ freq: 523, durationMs: 220, volume: 0.16, type: "sine" });
  tone({ freq: 659, durationMs: 220, delayMs: 180, volume: 0.18, type: "sine" });
  tone({ freq: 784, durationMs: 420, delayMs: 360, volume: 0.20, type: "sine" });
}
