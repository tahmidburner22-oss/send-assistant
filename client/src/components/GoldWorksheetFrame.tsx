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
 *
 * a11yProfileId — when supplied, the matching accessibility profile CSS is
 * injected into the iframe document so typography overlays (OpenDyslexic,
 * Lexend, Atkinson Hyperlegible, visual-stress tints, large print) apply to
 * the gold layout exactly as they do to the standard worksheet renderer.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getA11yProfileById, buildA11yProfileCss, A11Y_FONTS_HEAD_HTML } from "@/lib/accessibility-profiles";

// True on-screen pixel size of one 285mm × 200mm page at 96dpi.
const PAGE_W_PX = Math.round((285 * 96) / 25.4); // ≈ 1077
const PAGE_H_PX = Math.round((200 * 96) / 25.4); // ≈ 756

interface GoldWorksheetFrameProps {
  /** Complete HTML document from renderGoldWorksheetHtml(). */
  html: string;
  /** Optional title for the iframe (accessibility). */
  title?: string;
  /**
   * Optional accessibility profile id (from DEFAULT_A11Y_PROFILES).
   * When set, the matching CSS is injected into the iframe document so
   * typography overlays apply to the gold layout.
   */
  a11yProfileId?: string;
}

/**
 * Inject accessibility profile CSS into the gold worksheet HTML document.
 * The profile CSS is scoped to `.ws-a11y-{id}` — we add that class to the
 * <body> element so it cascades to all content without touching the layout.
 */
function injectA11yProfile(html: string, profileId: string | undefined): string {
  if (!profileId || profileId === "standard") return html;
  const profile = getA11yProfileById(profileId);
  if (!profile || profile.id === "standard") return html;

  const css = buildA11yProfileCss(profile);
  if (!css) return html;

  // Inject font <link> tags + profile CSS into <head>
  const headInjection = `${A11Y_FONTS_HEAD_HTML}\n<style>\n${css}\n</style>`;
  const bodyClass = `ws-a11y-${profile.id}`;

  let result = html;
  // Insert into <head>
  result = result.replace("</head>", `${headInjection}\n</head>`);
  // Add class to <body> — handle both <body> and <body ...attrs>
  result = result.replace(/<body([^>]*)>/, (match, attrs) => {
    const existingClass = attrs.match(/class="([^"]*)"/);
    if (existingClass) {
      return `<body${attrs.replace(`class="${existingClass[1]}"`, `class="${existingClass[1]} ${bodyClass}"`)}>`;
    }
    return `<body${attrs} class="${bodyClass}">`;
  });
  return result;
}

export default function GoldWorksheetFrame({ html, title = "Worksheet preview", a11yProfileId }: GoldWorksheetFrameProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  // Natural (unscaled) height of the document content — measured after load,
  // falling back to the nominal 2-page height until then.
  const [contentH, setContentH] = useState(PAGE_H_PX * 2);

  // Apply a11y profile to the HTML document
  const processedHtml = useMemo(
    () => injectA11yProfile(html, a11yProfileId),
    [html, a11yProfileId]
  );

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
          srcDoc={processedHtml}
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
