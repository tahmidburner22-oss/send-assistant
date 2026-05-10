// Smooth scroll via Lenis, scoped to the landing page only.
// If Lenis isn't installed yet (CI, older checkouts), we fail open — the page
// still works with native scroll, just without the butter.

import { useEffect } from "react";

export function useLenis({ enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    // Respect OS preference.
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let lenis;
    let raf;
    let cancelled = false;

    (async () => {
      try {
        const LenisMod = await import("lenis");
        if (cancelled) return;
        const Lenis = LenisMod.default || LenisMod.Lenis || LenisMod;
        lenis = new Lenis({
          lerp: 0.085, // slightly slower than default for a calmer glide
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 1.2,
        });

        // Expose scroll velocity on the <html> element so sections can read it.
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
