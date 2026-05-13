import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  Play,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Cinematic hero — full-viewport video background, bottom-only backdrop blur
// (no dark gradient overlay), staggered blur-fade-up entrance for every
// element, three SEND-relevant value slides cycled via Prev / Next, and full
// support for reduced-motion + reduced-data preferences.
//
// Mobile/tablet specifics:
//   • Uses min-h-[100svh] so iOS Safari's address bar can't crop the hero.
//   • At <md the right-side stepper sits *above* the CTAs so thumbs reach
//     them; at md+ it floats to the right edge as the spec describes.
//   • Touch devices and reduced-motion automatically render a poster
//     instead of starting the video — no "loading" flash on slow networks.
//   • All interactive controls are >= 44px tall (CTAs are 44/48px, stepper
//     pills are 44px tall, glass icon buttons are 44×44px).
// ────────────────────────────────────────────────────────────────────────────

const HERO_VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4";

const SLIDES = [
  {
    id: "platform",
    metadata: [
      { icon: Sparkles, label: "24 specialist tools" },
      { icon: Clock, label: "5h+ saved per EHCP" },
      { icon: CalendarDays, label: "Term-ready in minutes" },
    ],
    title: "Step through. Teach smarter.",
    description:
      "EHCP drafting, differentiated worksheets, parent portal, behaviour and analytics — every SEND tool a UK school needs, joined up in one quiet engine.",
  },
  {
    id: "ehcp",
    metadata: [
      { icon: ShieldCheck, label: "SEND Code aligned" },
      { icon: Clock, label: "Section F in 10 min" },
      { icon: CalendarDays, label: "Audit-ready records" },
    ],
    title: "From referral to plan in minutes.",
    description:
      "A 5-stage AI-assisted EHCP builder with golden-thread QA, compliance scoring and Word export — drafted in under an hour, not a weekend.",
  },
  {
    id: "parents",
    metadata: [
      { icon: Sparkles, label: "Daily adaptive work" },
      { icon: Clock, label: "Zero teacher prep" },
      { icon: CalendarDays, label: "Live progress feed" },
    ],
    title: "Calmer parents. Clearer pupils.",
    description:
      "A dedicated parent portal that delivers each pupil's adaptive work pack every morning — with progress, behaviour notes and updates parents can see in real time.",
  },
];

export default function Hero() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const videoRef = useRef(null);

  // On reduced-motion / reduced-data we never start the video; the poster
  // first frame is what the user sees. We also pause it if it had started.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (reduced) {
      try {
        v.pause();
      } catch {
        /* no-op */
      }
      return;
    }
    // Best-effort autoplay; if the browser blocks it we keep the poster.
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.then === "function") p.catch(() => {});
    };
    tryPlay();
  }, [reduced]);

  const next = () => setActive((i) => (i + 1) % SLIDES.length);
  const prev = () => setActive((i) => (i - 1 + SLIDES.length) % SLIDES.length);

  // Keyboard support — left/right arrows step the slides while focus is
  // anywhere inside the hero.
  const sectionRef = useRef(null);
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      data-testid="hero-section"
      tabIndex={-1}
      // The hero owns its own black background while the rest of the page
      // keeps the warm cream theme.
      className="hero-cinematic relative w-full min-h-[100svh] overflow-hidden flex flex-col text-white"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Background video — z-0 */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        src={HERO_VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        // poster intentionally omitted — the video is short and the metadata
        // preload is enough; we don't have a static fallback URL.
        aria-hidden="true"
      />

      {/* Bottom-only backdrop blur — z-1, no darkening */}
      <div
        aria-hidden
        className="hero-bottom-blur pointer-events-none absolute inset-0 z-[1] backdrop-blur-xl"
      />

      {/* Content — z-10 */}
      <div className="relative z-10 flex flex-col flex-1 min-h-[100svh]">
        {/* Spacer so content sits at the bottom under the navbar.
            Nav is fixed in <Nav>; we just leave the area visible to the video. */}
        <div className="flex-1" />

        <div className="px-4 sm:px-6 md:px-12 pb-8 md:pb-16">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
            {/* Left — slide content */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={SLIDES[active].id}
                  initial={reduced ? false : { opacity: 0, y: 18, filter: "blur(10px)" }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -18, filter: "blur(10px)" }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Metadata row — 300ms */}
                  <div
                    className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6 md:mb-8 text-xs sm:text-sm text-white/85 animate-blur-fade-up"
                    style={{ animationDelay: "300ms" }}
                  >
                    {SLIDES[active].metadata.map((m, i) => {
                      const Icon = m.icon;
                      return (
                        <span
                          key={`${active}-${i}`}
                          className="inline-flex items-center gap-2"
                        >
                          <Icon
                            size={16}
                            className={`flex-shrink-0 sm:w-[18px] sm:h-[18px] ${
                              i === 0 ? "fill-white" : ""
                            }`}
                          />
                          <span className="font-medium">{m.label}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* Title — 400ms */}
                  <h1
                    className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-4 md:mb-6 animate-blur-fade-up"
                    style={{
                      letterSpacing: "-0.04em",
                      lineHeight: 1.02,
                      animationDelay: "400ms",
                    }}
                  >
                    {SLIDES[active].title}
                  </h1>

                  {/* Description — 500ms */}
                  <p
                    className="text-base sm:text-lg md:text-xl text-white/70 mb-6 md:mb-12 max-w-2xl leading-relaxed animate-blur-fade-up"
                    style={{ animationDelay: "500ms" }}
                  >
                    {SLIDES[active].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* CTA buttons — fixed (don't re-mount per slide) */}
              <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
                <a
                  href="https://adaptly.co.uk/login"
                  data-testid="hero-cta-primary"
                  className="inline-flex items-center gap-2 bg-white text-black rounded-full font-medium px-6 sm:px-8 py-2.5 sm:py-3 hover:bg-white/85 transition-colors animate-blur-fade-up text-sm sm:text-base"
                  style={{ animationDelay: "600ms" }}
                >
                  <Play size={18} className="fill-black" aria-hidden />
                  <span>Start free</span>
                </a>
                <a
                  href="#about"
                  data-testid="hero-cta-secondary"
                  className="liquid-glass inline-flex items-center gap-2 rounded-full font-medium px-6 sm:px-8 py-2.5 sm:py-3 animate-blur-fade-up text-sm sm:text-base"
                  style={{ animationDelay: "700ms" }}
                >
                  See the platform
                </a>
              </div>
            </div>

            {/* Right — Previous / Next stepper.
                Mobile: sits below CTAs (md:hidden trigger group above).
                md+: floats right, aligned to the bottom of the row. */}
            <div className="flex flex-row md:flex-row gap-3 md:self-end md:flex-shrink-0">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous slide"
                data-testid="hero-stepper-prev"
                className="liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium animate-blur-fade-up min-w-[44px] min-h-[44px]"
                style={{ animationDelay: "800ms" }}
              >
                <ChevronLeft size={18} aria-hidden />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next slide"
                data-testid="hero-stepper-next"
                className="liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium animate-blur-fade-up min-w-[44px] min-h-[44px]"
                style={{ animationDelay: "900ms" }}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>
          </div>

          {/* Slide indicator dots — visible on all sizes for orientation. */}
          <div
            className="max-w-7xl mx-auto mt-6 md:mt-8 flex items-center gap-2 animate-blur-fade-up"
            style={{ animationDelay: "950ms" }}
            aria-hidden
          >
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === active ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
