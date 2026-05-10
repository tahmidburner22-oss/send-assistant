// Smooth scroll via Lenis, scoped to the landing page only.
// If Lenis isn't installed (typical CI / deploy), we fail open — the page
// works with native scroll, just without the butter.
//
// We use an indirect import specifier so Vite doesn't try to resolve the
// module at build time. This keeps the build green even when `lenis` isn't
// in `node_modules`.

import { useEffect } from "react";

// Indirection tricks Vite's static analyzer into leaving this alone.
const LENIS_SPEC = /* @__PURE__ */ (() => "lenis")();

export function useLenis({ enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let lenis;
    let raf;
    let cancelled = false;

    (async () => {
      try {
        const LenisMod = await import(/* @vite-ignore */ LENIS_SPEC);
        if (cancelled) return;
        const Lenis = LenisMod.default || LenisMod.Lenis || LenisMod;
        lenis = new Lenis({
          lerp: 0.085,
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 1.2,
        });

        const root = document.documentElement;
        lenis.on("scroll", ({ velocity }) => {
          root.style.setProperty("--scroll-velocity", String(velocity || 0));
        });

        const frame = (t) => {
          lenis?.raf(t);
          raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        document.documentElement.classList.add("lenis-active");
      } catch {
        // lenis missing; silently keep native scroll.
      }
    })();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      lenis?.destroy?.();
      document.documentElement.classList.remove("lenis-active");
      document.documentElement.style.removeProperty("--scroll-velocity");
    };
  }, [enabled]);
}
