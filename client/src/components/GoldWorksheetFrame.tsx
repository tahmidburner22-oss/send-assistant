/**
 * GoldWorksheetFrame.tsx
 *
 * On-screen preview for the "gold" maths worksheet layout. The gold renderer
 * produces a complete, self-contained HTML document (two fixed 285mm × 200mm
 * landscape pages), so it cannot be rendered through the normal React
 * section renderer — we host it in a sandboxed <iframe srcDoc> instead.
 *
 * The page is a fixed physical width (285mm ≈ 1077px). To fit any container
 * we measure the available width and apply a CSS transform scale, so the
 * spread shrinks to fit on narrow screens and never overflows horizontally,
 * while staying pixel-faithful to the printed/PDF output.
 */
import { useCallback, useEffect, useRef, useState } from "react";

// True on-screen pixel size of one 285mm × 200mm page at 96dpi.
const PAGE_W_PX = Math.round((285 * 96) / 25.4); // ≈ 1077
const PAGE_H_PX = Math.round((200 * 96) / 25.4); // ≈ 756

interface GoldWorksheetFrameProps {
  /** Complete HTML document from renderGoldWorksheetHtml(). */
  html: string;
  /** Optional title for the iframe (accessibility). */
  title?: string;
}

export default function GoldWorksheetFrame({ html, title = "Worksheet preview" }: GoldWorksheetFrameProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  // Natural (unscaled) height of the document content — measured after load,
  // falling back to the nominal 2-page height until then.
  const [contentH, setContentH] = useState(PAGE_H_PX * 2);

  const recompute = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const available = wrap.clientWidth;
    if (available > 0) setScale(available / PAGE_W_PX);
  }, []);

  // Track container width.
  useEffect(() => {
    recompute();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", recompute);
      return () => window.removeEventListener("resize", recompute);
    }
    const ro = new ResizeObserver(() => recompute());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [recompute]);

  // Measure the real document height once the iframe content loads.
  const handleLoad = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    try {
      const h = Math.max(
        doc.body?.scrollHeight ?? 0,
        doc.documentElement?.scrollHeight ?? 0,
        PAGE_H_PX * 2
      );
      setContentH(h);
    } catch {
      /* cross-origin shouldn't happen with srcDoc — ignore */
    }
    recompute();
  }, [recompute]);

  return (
    <div ref={wrapRef} style={{ width: "100%", overflow: "hidden" }}>
      <div style={{ height: contentH * scale }}>
        <iframe
          ref={iframeRef}
          title={title}
          srcDoc={html}
          onLoad={handleLoad}
          scrolling="no"
          style={{
            width: PAGE_W_PX,
            height: contentH,
            border: "none",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            background: "#fff",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
