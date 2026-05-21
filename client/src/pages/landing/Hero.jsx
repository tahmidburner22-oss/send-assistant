import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  BarChart2,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Adaptly hero — Editorial Product Showcase.
//
// A complete redesign of the previous cinematic-video hero. The Nav assumes
// white text on a dark surface, so we keep a deep ink-900 background to stay
// compatible without modifying Nav. The visual story is now told in a single
// confident frame instead of a 3-slide carousel:
//
//   • Left: editorial headline with a serif italic accent, a benefit
//     paragraph, two CTAs, and a trust strip (avatars + compliance pills).
//   • Right: a real-looking "browser frame" worksheet preview that subtly
//     tilts on mouse-move (perspective transform, capped at ±5 deg).
//   • Around the preview: four floating tool badges (EHCP · 10 min,
//     Parent reply ready, Reading age +1.4y, 92% compliance) gently
//     drifting in a 7s/9s/10s/11s loop. Each one tells a different
//     product pillar so the reader gets the full breadth at a glance.
//   • Background: warm ink-900 base with three slow-drifting blurred orbs
//     (terracotta + sage + honey) and a subtle white grid pattern.
//   • Bottom edge: smooth gradient fade into the cream About section
//     below + a vertical scroll cue.
//
// Accessibility:
//   • Respects prefers-reduced-motion: no tilt, no orb drift, no badge
//     float. Headline still fades in once on load.
//   • All controls are >=44px. The CTA group + scroll cue keep proper
//     focus rings via *:focus-visible (defined in index.css).
//   • Decorative elements are aria-hidden; the worksheet preview itself
//     is purely visual so assistive tech reads only the headline,
//     subhead, and CTAs.
// ────────────────────────────────────────────────────────────────────────────

// Worksheet preview content — chosen so the visual tells the story even at
// thumbnail size: clear "Section A" header, two question stems with answer
// lines, and a SEND tip box. This isn't a live worksheet, it's static
// illustrative content engineered to look real at a glance.
const PREVIEW = {
  subject: "Year 9 Maths · Adding fractions",
  send: "Dyslexia-friendly · cream overlay",
  questions: [
    { n: "1", text: "Solve:  ¼ + ⅓ = ____", lines: 1 },
    { n: "2", text: "Find a common denominator for ⅖ and ⅕. Show your steps.", lines: 2 },
  ],
  tip: "Tip: cross-multiply when denominators don't match — top times top, bottom times bottom.",
};

// Floating tool badges that orbit the product card. Each picks up a different
// SEND-relevant signal so visitors see the breadth of the platform without
// reading body copy. Hidden under md to avoid crowding the mobile layout.
const BADGES = [
  {
    id: "ehcp",
    icon: ShieldCheck,
    label: "Section F drafted",
    sub: "EHCP · 10 minutes",
    accent: "text-terracotta border-terracotta/40 bg-terracotta/10",
    pos: "top-[6%] -left-2 sm:left-2 lg:-left-6",
    floatY: [-6, 0, -6],
    duration: 7,
    delay: 0,
  },
  {
    id: "parent",
    icon: MessageSquare,
    label: "Parent reply ready",
    sub: "Communications",
    accent: "text-honey border-honey/40 bg-honey/10",
    pos: "top-[14%] right-2 lg:-right-4",
    floatY: [0, -8, 0],
    duration: 9,
    delay: 0.6,
  },
  {
    id: "analytics",
    icon: BarChart2,
    label: "Reading age +1.4y",
    sub: "Pupil analytics",
    accent: "text-sage border-sage/40 bg-sage/10",
    pos: "bottom-[18%] -left-2 sm:left-2 lg:-left-8",
    floatY: [0, -7, 0],
    duration: 10,
    delay: 1.2,
  },
  {
    id: "compliance",
    icon: CheckCircle2,
    label: "92% compliance",
    sub: "Golden-thread audit",
    accent: "text-emerald-300 border-emerald-300/40 bg-emerald-300/10",
    pos: "bottom-[8%] right-0 lg:-right-6",
    floatY: [-5, 0, -5],
    duration: 11,
    delay: 1.8,
  },
];

// ── Worksheet preview card ──────────────────────────────────────────────────
function WorksheetPreview({ reduced }) {
  // Subtle perspective tilt that follows the cursor. Capped to ±5 deg to
  // avoid the "wobbly" effect when the cursor moves quickly. Off entirely
  // for reduced-motion users.
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const onMove = (e) => {
    if (reduced) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
    const dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
    setTilt({ rx: -dy * 5, ry: dx * 5 });
  };
  const onLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={reduced ? false : { opacity: 0, y: 30, scale: 0.96 }}
      // Continuous "breathing" — a 1.0 ↔ 1.012 pulse on a 6s loop. Small enough
      // to feel ambient rather than jittery, but enough to signal the card is
      // alive even when the cursor isn't over it.
      animate={
        reduced
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 1, y: [30, 0, 0], scale: [0.96, 1.012, 1, 1.012, 1] }
      }
      transition={
        reduced
          ? { duration: 0.6 }
          : {
              opacity: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 },
              y: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 },
              scale: {
                duration: 6,
                times: [0, 0.25, 0.5, 0.75, 1],
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.2, // wait until the entrance settles
              },
            }
      }
      style={{
        transform: `perspective(1400px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        transformStyle: "preserve-3d",
      }}
      aria-hidden
      data-testid="hero-product-preview"
      className="relative w-full max-w-[460px] mx-auto"
    >
      {/* Soft glow behind the card — picks up the warm orb palette and
          gently pulses with the breathing motion. */}
      <motion.div
        aria-hidden
        className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-terracotta/30 via-honey/15 to-sage/20 blur-3xl pointer-events-none"
        animate={reduced ? { opacity: 0.7 } : { opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      />

      {/* Browser frame */}
      <div className="relative rounded-[1.75rem] bg-cream-50 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.55)] ring-1 ring-white/10 overflow-hidden">
        {/* Periodic glass shimmer — a diagonal highlight band that sweeps
            across the whole card every 7s. Pure CSS gradient + motion.div
            translateX so it's GPU-friendly. Off entirely under reduced-motion.
            Pointer-events disabled so it never intercepts hover. */}
        {!reduced && (
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background:
                "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
              mixBlendMode: "overlay",
            }}
            initial={{ x: "-120%" }}
            animate={{ x: ["-120%", "120%"] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              repeatDelay: 5.6,
              ease: "easeInOut",
              delay: 2.0,
            }}
          />
        )}
        {/* Top chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-ink-900/10 bg-cream-100">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 flex-1 h-6 rounded-full bg-cream-200/70 border border-ink-900/10 flex items-center px-3">
            <span className="text-[10px] tracking-tight font-medium text-ink-500">adaptly.co.uk/worksheets</span>
          </span>
        </div>

        {/* Worksheet body */}
        <div className="p-5 sm:p-6 bg-white">
          {/* Header strip */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-terracotta">
                Section A
              </div>
              <div className="mt-0.5 text-[15px] font-semibold text-ink-900 truncate">
                {PREVIEW.subject}
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-sage border border-sage/40 bg-sage/10 px-2 py-1 rounded-full">
              <Sparkles size={10} /> {PREVIEW.send}
            </span>
          </div>

          {/* Question list — answer lines reveal in sequence after the card
              lands, mimicking a teacher watching Adaptly fill them in. */}
          <div className="space-y-4">
            {PREVIEW.questions.map((q, qi) => (
              <div key={q.n} className="text-[13px] leading-relaxed text-ink-900">
                <p className="font-medium">
                  <span className="text-terracotta mr-1">{q.n}.</span>
                  {q.text}
                </p>
                <div className="mt-2 space-y-2">
                  {Array.from({ length: q.lines }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="block h-px bg-ink-900/15 origin-left"
                      initial={reduced ? false : { scaleX: 0, opacity: 0.4 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{
                        // Stagger across both questions so the eye sees the
                        // lines being "drawn" left-to-right.
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 1.05 + qi * 0.35 + i * 0.18,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tip box — adopts the SEND-friendly cream-overlay style */}
          <div className="mt-5 rounded-xl border border-honey/40 bg-honey/10 px-3 py-2.5">
            <p className="text-[12px] leading-relaxed text-ink-700">
              <span className="font-semibold text-ink-900">💡 </span>
              {PREVIEW.tip}
            </p>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-ink-900/10 bg-cream-50">
          <div className="flex items-center gap-1.5 text-[10px] text-ink-500">
            {/* Auto-save dot pulse — signals the worksheet is "live". */}
            <motion.span
              aria-hidden
              className="relative flex w-2 h-2"
              animate={reduced ? {} : { opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="absolute inset-0 rounded-full bg-sage/60 blur-[2px]" />
              <span className="relative inline-block w-2 h-2 rounded-full bg-sage" />
            </motion.span>
            <span>Auto-saved · 2 sec ago</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-ink-700 px-2 py-1 rounded-md border border-ink-900/15">PDF</span>
            <span className="text-[10px] font-medium text-cream-50 px-2 py-1 rounded-md bg-ink-900">Print</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Floating badge ──────────────────────────────────────────────────────────
function FloatingBadge({ badge, reduced }) {
  const Icon = badge.icon;
  return (
    <motion.div
      aria-hidden
      className={`absolute ${badge.pos} hidden md:flex items-center gap-2.5 px-3 py-2 rounded-2xl border backdrop-blur-md ${badge.accent}`}
      style={{ background: "rgba(34,32,30,0.55)" }}
      initial={reduced ? false : { opacity: 0, scale: 0.9 }}
      animate={
        reduced
          ? { opacity: 1, scale: 1 }
          : { opacity: 1, scale: 1, y: badge.floatY }
      }
      transition={
        reduced
          ? { duration: 0.4 }
          : {
              opacity: { duration: 0.7, delay: badge.delay + 0.6 },
              scale: { duration: 0.7, delay: badge.delay + 0.6, ease: [0.16, 1, 0.3, 1] },
              y: { duration: badge.duration, repeat: Infinity, ease: "easeInOut" },
            }
      }
    >
      <span className="w-7 h-7 rounded-xl bg-cream-50/10 flex items-center justify-center flex-shrink-0">
        <Icon size={14} />
      </span>
      <div className="text-left min-w-0">
        <div className="text-[11px] font-semibold text-cream-50 leading-tight">{badge.label}</div>
        <div className="text-[9px] uppercase tracking-wider text-cream-200/70 leading-tight mt-0.5">{badge.sub}</div>
      </div>
    </motion.div>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────
export default function Hero() {
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);

  // Tiny "loaded" flag to drive the staggered headline entrance. We avoid
  // the existing animate-blur-fade-up class because Framer's motion gives
  // us a cleaner sync with reduced-motion + the right column's animation.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="top"
      data-testid="hero-section"
      tabIndex={-1}
      className="hero-product relative w-full min-h-[100svh] overflow-hidden bg-ink-900 text-cream-50"
      style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}
    >
      {/* ─── Background layers ─────────────────────────────────────────── */}

      {/* Warm gradient base — slightly richer than flat ink-900 */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, #2C2825 0%, #22201E 50%, #1B1917 100%)",
        }}
      />

      {/* Drifting orbs — terracotta + sage + honey. Heavily blurred so they
          read as atmospheric warmth rather than discrete shapes. */}
      <motion.div
        aria-hidden
        className="absolute -top-32 -left-32 w-[36rem] h-[36rem] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(217,108,74,0.45) 0%, rgba(217,108,74,0) 65%)" }}
        animate={reduced ? {} : { x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 right-[-10%] w-[40rem] h-[40rem] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(127,140,114,0.40) 0%, rgba(127,140,114,0) 65%)" }}
        animate={reduced ? {} : { x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-1/3 left-1/2 w-[28rem] h-[28rem] rounded-full pointer-events-none -translate-x-1/2"
        style={{ background: "radial-gradient(circle, rgba(229,185,110,0.18) 0%, rgba(229,185,110,0) 70%)" }}
        animate={reduced ? {} : { y: [0, 24, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid pattern, masked into a soft ellipse so the edges of
          the viewport don't show hard lines. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />

      {/* Bottom gradient fade — bridges into the cream About section below
          so the page feels continuous rather than two glued layers. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(34,32,30,0) 0%, #F4F0E6 100%)",
        }}
      />

      {/* ─── Content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-28 sm:pt-32 lg:pt-40 pb-32 sm:pb-40 lg:pb-48 flex flex-col lg:grid lg:grid-cols-12 gap-10 lg:gap-14 items-center min-h-[100svh]">
        {/* Left column — content */}
        <div className="lg:col-span-7 w-full">
          {/* Eyebrow */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={loaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-semibold text-terracotta"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" aria-hidden />
            Built for UK SEND teams
          </motion.div>

          {/* Headline — editorial sans/serif mix.
              "Step through" + "Teach" sit in Cabinet Grotesk via .font-heading,
              while the standout word "smarter." takes a serif italic from
              Instrument Serif (.font-display) and gets the warm gradient fill. */}
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={loaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="font-heading mt-6 text-[2.5rem] sm:text-6xl md:text-7xl lg:text-[5.25rem] xl:text-[6rem] leading-[0.95] tracking-[-0.035em] font-bold text-cream-50"
            style={{ paddingBottom: "0.06em" }}
          >
            Step through.<br />
            Teach{" "}
            <motion.span
              className="font-display italic inline-block"
              style={{
                // 200%-wide gradient → background-position animation slides
                // the warm honey/terracotta highlight across the word in a
                // perpetual but unhurried 6s loop. Reduced-motion users get
                // a static gradient at 0% position.
                background:
                  "linear-gradient(95deg, #E5B96E 0%, #D96C4A 30%, #F4D9A8 50%, #D96C4A 70%, #E5B96E 100%)",
                backgroundSize: "220% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                fontWeight: 400,
              }}
              animate={
                reduced
                  ? { backgroundPosition: "0% 50%" }
                  : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      // Wait for the headline's own entrance to finish so the
                      // sweep doesn't fight the rise-up.
                      delay: 0.9,
                    }
              }
            >
              smarter.
            </motion.span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={loaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.30 }}
            className="mt-5 sm:mt-6 max-w-xl text-base sm:text-lg lg:text-xl text-cream-200/80 leading-relaxed"
          >
            EHCPs, differentiated worksheets, parent communications and analytics — every
            SEND tool a UK school needs, joined up in <span className="text-cream-50 font-medium">one quiet engine</span>.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={loaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.42 }}
            className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3 sm:gap-4"
          >
            <a
              href="https://adaptly.co.uk/login"
              data-testid="hero-cta-primary"
              className="group relative inline-flex items-center gap-2 rounded-full px-7 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-cream-50 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #D96C4A 0%, #E5B96E 100%)",
                boxShadow:
                  "0 12px 30px -10px rgba(217,108,74,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              <span className="relative z-10">Start free trial</span>
              <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-0.5" />
              {/* Highlight sweep on hover */}
              <span
                aria-hidden
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background:
                    "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
                }}
              />
            </a>
            <a
              href="#about"
              data-testid="hero-cta-secondary"
              className="inline-flex items-center gap-2 rounded-full px-7 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-cream-100 border border-cream-100/30 hover:bg-cream-100/10 transition-colors"
            >
              See how it works
              <span aria-hidden className="text-cream-200/60">↓</span>
            </a>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={loaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}
            data-testid="hero-trust-strip"
            className="mt-10 sm:mt-12 flex flex-col gap-4 lg:gap-5"
          >
            {/* Avatars + trust line */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5" aria-hidden>
                <span className="inline-block h-8 w-8 rounded-full ring-2 ring-ink-900 bg-gradient-to-br from-emerald-300 to-emerald-500" />
                <span className="inline-block h-8 w-8 rounded-full ring-2 ring-ink-900 bg-gradient-to-br from-amber-300 to-orange-400" />
                <span className="inline-block h-8 w-8 rounded-full ring-2 ring-ink-900 bg-gradient-to-br from-sky-300 to-indigo-500" />
                <span className="inline-block h-8 w-8 rounded-full ring-2 ring-ink-900 bg-gradient-to-br from-rose-300 to-pink-500" />
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-ink-900 bg-cream-100/15 text-[10px] font-semibold text-cream-50">
                  +
                </span>
              </div>
              <p className="text-xs sm:text-sm text-cream-200/85 leading-snug">
                <span className="font-semibold text-cream-50">Trusted by UK SENCOs</span>
                <span className="mx-2 text-cream-200/40" aria-hidden>·</span>
                In trial across primary &amp; secondary schools
              </p>
            </div>

            {/* Compliance pills */}
            <ul className="flex flex-wrap items-center gap-2" aria-label="Compliance">
              {[
                { icon: ShieldCheck, label: "UK GDPR" },
                { icon: GraduationCap, label: "SEND Code of Practice" },
                { icon: CheckCircle2, label: "DfE filtering aligned" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <li
                    key={c.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-cream-100/20 bg-cream-100/5 px-2.5 py-1 text-[11px] font-medium text-cream-100/85"
                  >
                    <Icon size={12} aria-hidden />
                    {c.label}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>

        {/* Right column — product showcase */}
        <div className="lg:col-span-5 w-full relative">
          <div className="relative w-full">
            <WorksheetPreview reduced={!!reduced} />
            {/* Floating tool badges (md+ only — they crowd the mobile layout) */}
            {BADGES.map((b) => (
              <FloatingBadge key={b.id} badge={b} reduced={!!reduced} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Scroll cue ────────────────────────────────────────────────── */}
      <motion.div
        aria-hidden
        initial={reduced ? false : { opacity: 0 }}
        animate={loaded ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="absolute left-1/2 -translate-x-1/2 bottom-8 z-10 flex flex-col items-center gap-2 text-cream-200/60"
      >
        <span className="text-[10px] uppercase tracking-[0.25em] font-semibold">Scroll</span>
        <span className="relative block w-px h-10 bg-cream-200/30 overflow-hidden">
          <motion.span
            className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-terracotta to-transparent"
            animate={reduced ? {} : { y: ["-100%", "120%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
