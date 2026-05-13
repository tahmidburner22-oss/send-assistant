import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "./lib/data";
import { AdaptlyMark } from "./AdaptlyWordmark";

// ────────────────────────────────────────────────────────────────────────────
// Cinematic top nav.
//
// Sits above the cinematic hero on a transparent background, then picks up a
// subtle dark surface once the user scrolls past the first viewport so the
// links remain readable on the warm cream body below.
//
// Behaviour:
//   • Logo + each link + the CTA + the user/menu glass icons fade in with a
//     staggered .animate-blur-fade-up timing matching the hero's rhythm.
//   • At <lg the centre links collapse into a dropdown driven by an animated
//     hamburger ↔ X icon (rotate-180 + opacity + scale-50, duration-500).
//   • Body scroll is locked while the mobile dropdown is open, so the user
//     can't see the underlying page jump on iOS.
//   • A 2px scroll-progress bar runs along the very top, kept from the prior
//     nav so the scroll storytelling pages still get their progress hint.
// ────────────────────────────────────────────────────────────────────────────

const STAGGER = {
  logo: "0ms",
  links: ["100ms", "150ms", "200ms", "250ms", "300ms"],
  cta: "350ms",
  toggle: "350ms",
};

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Body scroll lock for the mobile dropdown.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
    };
  }, [open]);

  // Close the dropdown on resize past lg so the desktop layout takes over.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024 && open) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <motion.div
        data-testid="nav-scroll-progress"
        style={{ scaleX: progress }}
        className="fixed top-0 left-0 right-0 h-[2px] origin-left bg-terracotta z-[60]"
      />

      <header
        data-testid="nav-header"
        className="fixed top-0 left-0 right-0 z-50"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div
          className={`px-4 sm:px-6 md:px-12 transition-all duration-500 ${
            scrolled || open ? "py-3 bg-black/55 backdrop-blur-md" : "py-4 md:py-6"
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Logo — 0ms */}
            <a
              href="#top"
              data-testid="nav-logo"
              data-cursor="hover"
              className="flex items-center gap-2 sm:gap-3 group animate-blur-fade-up"
              style={{ animationDelay: STAGGER.logo }}
            >
              <AdaptlyMark
                size={36}
                className="text-white transition-transform duration-500 group-hover:rotate-[-8deg]"
              />
              <span className="font-semibold text-lg sm:text-xl tracking-[-0.02em] text-white">
                Adaptly
              </span>
            </a>

            {/* Centre nav (lg+) — staggered */}
            <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {NAV_LINKS.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="px-3 xl:px-4 py-2 text-sm text-white/85 hover:text-white transition-colors animate-blur-fade-up"
                  style={{ animationDelay: STAGGER.links[i] || "300ms" }}
                >
                  {l.label}
                </a>
              ))}
            </nav>

            {/* Right cluster */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Start free CTA — 350ms (replaces the "Search" pill from the spec). */}
              <a
                href="https://adaptly.co.uk/login"
                data-testid="nav-cta-start"
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white text-black font-medium text-xs sm:text-sm px-4 md:px-6 py-2 sm:py-2.5 hover:bg-white/85 transition-colors animate-blur-fade-up"
                style={{ animationDelay: STAGGER.cta }}
              >
                Start free
                <span aria-hidden>→</span>
              </a>

              {/* Hamburger toggle (<lg) — 350ms */}
              <button
                onClick={() => setOpen((v) => !v)}
                data-testid="nav-mobile-toggle"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-controls="mobile-menu"
                className="lg:hidden liquid-glass relative w-11 h-11 rounded-full flex items-center justify-center text-white animate-blur-fade-up"
                style={{ animationDelay: STAGGER.toggle }}
              >
                {/* Animated icon swap — rotate-180, opacity, scale-50, duration-500 */}
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                    open ? "rotate-180 opacity-0 scale-50" : "rotate-0 opacity-100 scale-100"
                  }`}
                  aria-hidden
                >
                  <Menu size={18} />
                </span>
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                    open ? "rotate-0 opacity-100 scale-100" : "-rotate-180 opacity-0 scale-50"
                  }`}
                  aria-hidden
                >
                  <X size={18} />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown — slides in from below the header (top-[72px]) */}
        <div
          id="mobile-menu"
          data-testid="mobile-menu"
          className={`lg:hidden absolute top-[64px] sm:top-[72px] left-0 right-0 z-40 transition-all duration-500 ease-out ${
            open
              ? "translate-y-0 opacity-100"
              : "-translate-y-4 opacity-0 pointer-events-none"
          }`}
        >
          <div className="bg-gray-900/95 backdrop-blur-lg border-t border-b border-gray-800 shadow-2xl">
            <div className="px-4 sm:px-6 md:px-12 py-5 max-w-7xl mx-auto">
              <nav className="flex flex-col gap-1" aria-label="Mobile">
                {NAV_LINKS.map((l, i) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    data-testid={`nav-mobile-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className={`block py-3 px-3 rounded-lg text-white/90 hover:bg-gray-800/50 hover:text-white text-base font-medium transition-all duration-500 ease-out ${
                      open ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
                    }`}
                    style={{ transitionDelay: open ? `${i * 50}ms` : "0ms" }}
                  >
                    {l.label}
                  </a>
                ))}
              </nav>

              {/* CTA section visible on small screens where the inline CTA is hidden. */}
              <div className="mt-4 pt-4 border-t border-gray-800 sm:hidden">
                <a
                  href="https://adaptly.co.uk/login"
                  onClick={() => setOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-medium text-sm px-6 py-3"
                >
                  Start free
                  <span aria-hidden>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop scrim that closes the menu when tapped. Below the dropdown
          (z-30), above the page content. Pointer-events follow the open state. */}
      <button
        type="button"
        aria-hidden={!open}
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className={`lg:hidden fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
    </>
  );
}
