/**
 * StreamedOutput — renders AI text progressively as chunks arrive.
 *
 * Displays a blinking cursor at the end while streaming, and transitions
 * smoothly to the final rendered output when complete. Used by AIToolPage
 * when streaming is enabled.
 *
 * a11y: the visible <div> updates on every chunk for sighted users, but the
 * paired aria-live region is only updated on word/sentence boundaries to
 * avoid screen-reader chaos (announcing every character would be unusable).
 */
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  /** The accumulated text so far (raw markdown/plain text) */
  text: string;
  /** Whether the stream is still in progress */
  isStreaming: boolean;
  /** Optional className for the container */
  className?: string;
  /** Optional inline styles (from AccessibilityPanel) */
  style?: React.CSSProperties;
}

/** Roughly chunk new text on sentence/word boundaries for assistive tech. */
function chunkForA11y(prev: string, next: string): string | null {
  if (next.length <= prev.length) return null;
  const delta = next.slice(prev.length);
  // Only emit a chunk when we have completed a clause (sentence or roughly 8+ words).
  const sentenceEnd = /[.!?\n]\s|[。！？]/.test(delta);
  const wordCount   = delta.trim().split(/\s+/).filter(Boolean).length;
  if (sentenceEnd || wordCount >= 8) return delta.trim();
  return null;
}

export function StreamedOutput({ text, isStreaming, className = "", style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Throttled mirror of `text` for the aria-live region only.
  const [a11yText, setA11yText] = useState("");
  const lastAnnouncedRef = useRef("");

  useEffect(() => {
    if (!isStreaming) {
      // On stream end announce any remaining tail.
      if (text && text !== lastAnnouncedRef.current) {
        const tail = text.slice(lastAnnouncedRef.current.length).trim();
        if (tail) setA11yText(tail);
        lastAnnouncedRef.current = text;
      }
      return;
    }
    const chunk = chunkForA11y(lastAnnouncedRef.current, text);
    if (chunk) {
      lastAnnouncedRef.current = text;
      setA11yText(chunk);
    }
  }, [text, isStreaming]);

  // Auto-scroll to bottom while streaming
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      const el = containerRef.current;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      if (isNearBottom) el.scrollTop = el.scrollHeight;
    }
  }, [text, isStreaming]);

  const cursor = useMemo(
    () => isStreaming
      ? <span className="inline-block w-2 h-4 ml-0.5 bg-brand/70 animate-pulse rounded-sm align-text-bottom" aria-hidden="true" />
      : null,
    [isStreaming],
  );

  return (
    <>
      <div
        ref={containerRef}
        className={`whitespace-pre-wrap leading-relaxed text-foreground/90 ${className}`}
        style={style}
        aria-hidden={isStreaming ? "true" : undefined}
      >
        {text}
        {cursor}
      </div>
      {/* Politely announce sentence-sized chunks for assistive technology. */}
      <span className="sr-only" aria-live="polite" aria-atomic="false" role="status">
        {a11yText}
      </span>
    </>
  );
}

export default StreamedOutput;
