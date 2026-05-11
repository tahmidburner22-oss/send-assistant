/**
 * StreamedOutput — renders AI text progressively as chunks arrive.
 *
 * Displays a blinking cursor at the end while streaming, and transitions
 * smoothly to the final rendered output when complete. Used by AIToolPage
 * when streaming is enabled.
 */
import { useEffect, useRef } from "react";

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

export function StreamedOutput({ text, isStreaming, className = "", style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom while streaming
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      const el = containerRef.current;
      // Only scroll if user hasn't scrolled up manually
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      if (isNearBottom) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [text, isStreaming]);

  return (
    <div
      ref={containerRef}
      className={`whitespace-pre-wrap leading-relaxed text-foreground/90 ${className}`}
      style={style}
    >
      {text}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-0.5 bg-brand/70 animate-pulse rounded-sm align-text-bottom" />
      )}
    </div>
  );
}

export default StreamedOutput;
