import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { Clock, CalendarDays, Sparkles } from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Cinematic hero — full-viewport video background, bottom-only backdrop blur,
// single static content panel. No slides, no stepper, no state.
//
// Video playback fix: we set crossOrigin="anonymous" and listen for the
// "canplay" event before calling .play() so the browser has enough data to
// start. We also try again on "loadedmetadata" as a fallback for slow
// connections. autoPlay is kept as a declarative hint for browsers that
// honour it without JS.
// ────────────────────────────────────────────────────────────────────────────

const HERO_VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4";

const METADATA = [
  { Icon: Sparkles, label: "24 specialist tools" },
  { Icon: Clock,    label: "5h+ saved per EHCP" },
  { Icon: CalendarDays, label: "Term-ready in minutes" },
];

export default function Hero() {
  const videoRef = useRef(null);
  const reduced  = useReducedMotion();

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (reduced) {
      v.pause();
      return;
    }

    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.then === "function") p.catch(() => {});
    };

    // Try immediately (works when the element already has enough data).
    tryPlay();

    // Also try on canplay / loadedmetadata for slow connections.
    v.addEventListener("canplay",       tryPlay, { once: true });
    v.addEventListener("loadedmetadata", tryPlay, { once: true });

    return () => {
      v.removeEventListener("canplay",       tryPlay);
      v.removeEventListener("loadedmetadata", tryPlay);
    };
  }, [reduced]);

  return (
    <section
      id="top"
      data-testid="hero-section"
      className="hero-cinematic relative w-full min-h-[100svh] overflow-hidden flex flex-col text-white"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: "-0.01em" }}
    >
      {/* ── Background video z-0 ── */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        src={HERO_VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        aria-hidden="true"
      />

      {/* ── Bottom-only backdrop blur z-1 (no darkening) ── */}
      <div
        aria-hidden
        className="hero-bottom-blur pointer-events-none absolute inset-0 z-[1] backdrop-blur-xl"
      />

      {/* ── Hero content z-10 ── */}
      <div className="relative z-10 flex flex-col flex-1 min-h-[100svh]">
        {/* pushes content to bottom */}
        <div className="flex-1" />

        <div className="px-4 sm:px-6 md:px-12 pb-8 md:pb-16">
          <div className="max-w-7xl mx-auto">

            {/* Metadata row — 300 ms */}
            <div
              className="flex flex-wrap items-center gap-3 sm:gap-6 mb-5 md:mb-7 text-xs sm:text-sm text-white/80 animate-blur-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              {METADATA.map(({ Icon, label }, i) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <Icon size={15} className={`flex-shrink-0 ${i === 0 ? "fill-white" : ""}`} aria-hidden />
                  <span className="font-medium tracking-wide">{label}</span>
                </span>
              ))}
            </div>

            {/* Title — 400 ms */}
            <h1
              className="text-3xl sm:text-5xl md:text-6xl lg:text-[5.25rem] font-light text-white mb-4 md:mb-6 animate-blur-fade-up max-w-4xl"
              style={{ letterSpacing: "-0.04em", lineHeight: 1.02, animationDelay: "400ms" }}
            >
              Step through.<br className="hidden sm:block" /> Teach smarter.
            </h1>

            {/* Description — 500 ms */}
            <p
              className="text-base sm:text-lg md:text-xl text-white/70 mb-8 md:mb-12 max-w-2xl leading-relaxed animate-blur-fade-up"
              style={{ animationDelay: "500ms" }}
            >
              EHCP drafting, differentiated worksheets, parent portal, behaviour
              and analytics — every SEND tool a UK school needs, joined up in one
              quiet engine.
            </p>

            {/* CTA buttons — 600 / 700 ms */}
            <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
              <a
                href="https://adaptly.co.uk/login"
                data-testid="hero-cta-primary"
                className="inline-flex items-center bg-white text-black rounded-full font-medium px-6 sm:px-8 py-2.5 sm:py-3 hover:bg-white/85 transition-colors animate-blur-fade-up text-sm sm:text-base"
                style={{ animationDelay: "600ms" }}
              >
                Start free
              </a>
              <a
                href="#about"
                data-testid="hero-cta-secondary"
                className="liquid-glass inline-flex items-center rounded-full font-medium px-6 sm:px-8 py-2.5 sm:py-3 animate-blur-fade-up text-sm sm:text-base"
                style={{ animationDelay: "700ms" }}
              >
                See the platform
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
