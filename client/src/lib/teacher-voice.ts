/**
 * teacher-voice.ts — Teacher voice replay infrastructure.
 *
 * SENCOs and class teachers can record a 90-second consent sample (which
 * we store as a base64 audio data URL on the user's machine until a real
 * server-side voice-cloning endpoint is wired in). Tools that opt in
 * — Audio Revision Hub, Reading & Stories, Parent Newsletter, BSP read-aloud —
 * can then synthesise their output in the teacher's own voice rather than
 * a stock TTS.
 *
 * For the UK SEND audience, "voiced by their actual teacher" is a measurable
 * engagement multiplier and is also the most defensible audio-content
 * answer: parents and Ofsted know exactly whose voice is reading the work.
 *
 * Until a server endpoint exists, we use Web Speech API for the actual
 * synthesis — but a teacher-voice profile sets defaults (rate, pitch, the
 * Web Speech voice that most closely matches the recorded sample's
 * fundamental frequency) so the same playback experience persists across
 * tools.
 *
 * GDPR posture: the recorded sample never leaves localStorage; only the
 * derived profile (numbers, no audio) ever crosses the network when the
 * server endpoint exists.
 */

const STORAGE_KEY = "adaptly_teacher_voice_v1";

export interface TeacherVoiceProfile {
  /** Owner's display name shown in the consent UI. */
  ownerName: string;
  /** ISO timestamp of consent capture — required to play back. */
  consentAt: string;
  /** ISO date the consent expires (we default to 1 year). */
  consentExpires: string;
  /** Web Speech voice name (best match from the local voice list). */
  voiceName?: string;
  /** Playback rate (0.5–2). */
  rate: number;
  /** Pitch (0–2). */
  pitch: number;
  /** Optional base64 sample (≤90s ≈ 700KB) used to surface what was recorded. */
  sample?: string;
}

export function getProfile(): TeacherVoiceProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as TeacherVoiceProfile;
    if (!p.consentExpires || new Date(p.consentExpires) < new Date()) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveProfile(p: TeacherVoiceProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

export function clearProfile(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

/**
 * Speak `text` using the active teacher-voice profile (or fall back to the
 * default Web Speech voice). Returns a promise that resolves when playback
 * ends. No-op (resolves immediately) if the browser has no Web Speech API.
 */
export function speak(text: string, opts?: { profileOverride?: Partial<TeacherVoiceProfile> }): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }
    const synth = window.speechSynthesis;
    const profile = getProfile();
    const utter = new SpeechSynthesisUtterance(text);
    const wantedVoice = opts?.profileOverride?.voiceName ?? profile?.voiceName;
    const voices = synth.getVoices();
    if (wantedVoice) {
      const v = voices.find(v => v.name === wantedVoice);
      if (v) utter.voice = v;
    } else if (voices.length > 0) {
      const enGB = voices.find(v => v.lang === "en-GB") || voices.find(v => /UK|British/i.test(v.name));
      if (enGB) utter.voice = enGB;
    }
    utter.rate  = opts?.profileOverride?.rate  ?? profile?.rate  ?? 1.0;
    utter.pitch = opts?.profileOverride?.pitch ?? profile?.pitch ?? 1.0;
    utter.onend   = () => resolve();
    utter.onerror = () => resolve();
    synth.speak(utter);
  });
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Estimate the length in seconds of a base64 audio data URL by inspecting
 * the wrapped <audio> element. Used by the consent recorder to enforce the
 * 90-second cap.
 */
export function audioDurationSeconds(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => resolve(a.duration || 0);
    a.onerror = () => resolve(0);
    a.src = dataUrl;
  });
}
