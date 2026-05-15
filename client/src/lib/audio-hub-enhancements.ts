/**
 * audio-hub-enhancements.ts — Improvements layered onto the Audio Revision Hub.
 *
 *  1. Real-voice cloning consent capture (uses lib/teacher-voice)
 *  2. Highlight-as-it-reads karaoke synchronisation (word-by-word boundaries)
 *  3. Voice-controlled navigation via Web Speech Recognition
 *  4. Auto-generate revision podcast bundles (RSS-flavoured manifest)
 *  5. Spoken comprehension nudges every N seconds
 */
import { speak, stopSpeaking } from "./teacher-voice";

// ── 1. Voice consent capture (data URL → profile) ───────────────────────────

export async function recordVoiceSample(
  maxSeconds = 90,
): Promise<{ dataUrl: string; durationSec: number } | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) return null;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mr = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  mr.ondataavailable = e => chunks.push(e.data);
  mr.start();
  return new Promise((resolve) => {
    let resolved = false;
    const stop = () => {
      if (resolved) return;
      resolved = true;
      mr.stop();
    };
    mr.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const dataUrl: string = await new Promise(res => {
        const reader = new FileReader();
        reader.onload = () => res(String(reader.result));
        reader.readAsDataURL(blob);
      });
      const dur = await durationOf(dataUrl);
      stream.getTracks().forEach(t => t.stop());
      resolve({ dataUrl, durationSec: dur });
    };
    setTimeout(stop, maxSeconds * 1000);
  });
}

async function durationOf(dataUrl: string): Promise<number> {
  return new Promise(res => {
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => res(a.duration || 0);
    a.onerror = () => res(0);
    a.src = dataUrl;
  });
}

// ── 2. Highlight-as-it-reads karaoke ────────────────────────────────────────

export interface KaraokeBoundary {
  word: string;
  charStart: number;
  charEnd: number;
  estStartMs: number;
}

/**
 * Compute approximate word-level start times for plain text. Uses an
 * average WPM (default 150) — good enough for highlight syncing without
 * waiting for browser-side word-boundary events that don't fire reliably.
 */
export function computeBoundaries(text: string, wpm = 150): KaraokeBoundary[] {
  const out: KaraokeBoundary[] = [];
  const wordRx = /\S+/g;
  const msPerWord = 60_000 / wpm;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = wordRx.exec(text)) !== null) {
    out.push({
      word: m[0],
      charStart: m.index,
      charEnd: m.index + m[0].length,
      estStartMs: Math.round(i * msPerWord),
    });
    i++;
  }
  return out;
}

/**
 * Drive a highlight cursor through the boundaries, calling `onWord` at the
 * estimated time of each word. Returns a cancel function.
 */
export function startKaraoke(
  boundaries: KaraokeBoundary[],
  onWord: (idx: number, word: string) => void,
): () => void {
  let cancelled = false;
  for (const [i, b] of boundaries.entries()) {
    setTimeout(() => {
      if (!cancelled) onWord(i, b.word);
    }, b.estStartMs);
  }
  return () => { cancelled = true; };
}

// ── 3. Voice-controlled navigation ──────────────────────────────────────────

export interface VoiceNavCommands {
  next?: () => void;
  previous?: () => void;
  repeat?: () => void;
  louder?: () => void;
  quieter?: () => void;
  what?: (heard: string) => void;
  pause?: () => void;
  play?: () => void;
}

/** Start listening; returns a stop function. */
export function startVoiceNav(commands: VoiceNavCommands): () => void {
  if (typeof window === "undefined") return () => {};
  const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return () => {};
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = "en-GB";
  rec.onresult = (ev: any) => {
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const transcript = String(ev.results[i][0].transcript || "").toLowerCase().trim();
      if (/^next( section)?$/.test(transcript)) commands.next?.();
      else if (/^(previous|back)$/.test(transcript)) commands.previous?.();
      else if (/^repeat$/.test(transcript)) commands.repeat?.();
      else if (/^louder$/.test(transcript)) commands.louder?.();
      else if (/^(quieter|softer)$/.test(transcript)) commands.quieter?.();
      else if (/^pause$/.test(transcript)) commands.pause?.();
      else if (/^(play|resume)$/.test(transcript)) commands.play?.();
      else if (/^what does (.+) mean$/.test(transcript)) commands.what?.(transcript.replace(/^what does /, "").replace(/ mean$/, ""));
    }
  };
  try { rec.start(); } catch {}
  return () => { try { rec.stop(); } catch {} };
}

// ── 4. Podcast bundle ───────────────────────────────────────────────────────

export interface PodcastEpisode {
  id: string;
  title: string;
  durationSec: number;
  publishedAt: string;
  text: string;
}

export function buildRssFeed(opts: { schoolName: string; episodes: PodcastEpisode[] }): string {
  const items = opts.episodes.map(e => `
  <item>
    <title>${escapeXml(e.title)}</title>
    <pubDate>${new Date(e.publishedAt).toUTCString()}</pubDate>
    <description>${escapeXml(e.text.slice(0, 240))}</description>
    <itunes:duration>${formatDur(e.durationSec)}</itunes:duration>
    <guid isPermaLink="false">adaptly:${e.id}</guid>
  </item>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${escapeXml(opts.schoolName)} — Adaptly Audio Revision</title>
    <link>https://adaptly.co.uk</link>
    <language>en-gb</language>
    ${items}
  </channel>
</rss>`;
}

function formatDur(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map(n => String(n).padStart(2, "0")).join(":");
}
function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[c] || c));
}

// ── 5. Comprehension nudges ─────────────────────────────────────────────────

export interface ComprehensionNudge {
  question: string;
  expectedKeywords: string[];
  atSec: number;
}

export function generateNudgesFor(text: string, intervalSec = 60): ComprehensionNudge[] {
  // Each ~150 words = ~60s at 150wpm. Pull a key noun phrase from each
  // window and turn it into a "what is X" prompt.
  const words = text.split(/\s+/);
  const stride = Math.round(150 * (intervalSec / 60));
  const out: ComprehensionNudge[] = [];
  for (let i = stride; i < words.length; i += stride) {
    const window = words.slice(i - stride, i).join(" ");
    const noun = pickKeyNoun(window);
    if (noun) {
      out.push({
        question: `What did the passage just tell us about ${noun}?`,
        expectedKeywords: [noun],
        atSec: Math.round((i / words.length) * (words.length / 150) * 60),
      });
    }
  }
  return out;
}

function pickKeyNoun(text: string): string | null {
  const tokens = text.replace(/[^a-zA-Z\s]/g, " ").split(/\s+/).filter(t => t.length >= 6 && /^[a-z]+$/i.test(t));
  if (tokens.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const t of tokens) counts[t.toLowerCase()] = (counts[t.toLowerCase()] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// Re-export speak/stop for convenience.
export { speak, stopSpeaking };
