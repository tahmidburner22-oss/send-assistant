import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useVariant } from "./lib/useVariant";
import { LazyHero3D } from "./three/Lazy3D";

// Hero with a real 3D scene on the right.
// Copy column on the left uses character-level stagger reveals driven by
// ease-out-quart so the type *settles* instead of springing.
// The 3D canvas is lazy-loaded, with a 2D "loading constellation" fallback
// that itself looks good if WebGL ever fails.

function RevealLine({ children, delay = 0 }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ delay, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="block"
      >
        {children}
      </motion.span>
    </span>
  );
}

// A minimal 2D skeleton — used only while the 3D bundle is loading or on
// reduced-motion devices. Restrained on purpose: no orbit spam.
function HeroFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="w-56 h-56 rounded-[2rem] glass shadow-[0_30px_80px_-20px_rgba(34,32,30,0.25)] flex items-center justify-center"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-terracotta to-honey opacity-80" />
        </motion.div>
        <div className="absolute inset-0 -z-10 rounded-[2rem] bg-terracotta/20 blur-3xl" />
      </div>
    </div>
  );
}

export default function Hero() {
  const sectionRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const { variant } = useVariant();

  // Mouse parallax for the text column (subtle).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });

  useEffect(() => {
    const onMove = (e) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 10);
      my.set((e.clientY / window.innerHeight - 0.5) * 10);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  // Scroll-linked exit: the hero gently fades and shrinks as you leave it.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, variant === "v3" ? 0.82 : 0.9]);
  const blur = useTransform(scrollYProgress, [0, 1], [0, variant === "v3" ? 6 : 0]);
  const fade = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  return (
    <section
      ref={sectionRef}
      id="top"
      data-testid="hero-section"
      className="relative min-h-[100svh] w-full overflow-hidden flex flex-col"
    >
      {/* Warm background glow — softer than the old one; the 3D scene carries most of the interest now. */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[520px] h-[520px] rounded-full bg-terracotta/15 blur-[140px] animate-float-slow" />
        <div className="absolute bottom-10 right-10 w-[420px] h-[420px] rounded-full bg-honey/25 blur-[140px]" />
        {variant === "v3" && (
          <div className="absolute top-10 left-10 w-[320px] h-[320px] rounded-full bg-sage/20 blur-[130px]" />
        )}
      </div>

      {/* Grid overlay for structure. */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#22201E 1px, transparent 1px), linear-gradient(90deg, #22201E 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div style={{ scale, opacity: fade, filter }} className="relative flex-1 flex items-center pt-28 pb-10">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Copy */}
          <motion.div style={{ x: sx, y: sy }} className="lg:col-span-5 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs md:text-sm text-ink-700 font-medium"
              data-testid="hero-kicker"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
              24 specialist tools · built for SEND excellence
            </motion.div>

            <h1
              className="mt-6 font-heading text-ink-900 leading-[0.92] tracking-[-0.04em] text-5xl sm:text-6xl lg:text-7xl font-bold"
              data-testid="hero-title"
            >
              <RevealLine delay={0.1}>One platform for</RevealLine>
              <RevealLine delay={0.22}>
                <span className="font-display italic font-normal text-terracotta">teaching, support</span>
              </RevealLine>
              <RevealLine delay={0.34}>and progress.</RevealLine>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 text-base md:text-lg text-ink-500 leading-relaxed max-w-lg"
              data-testid="hero-subtitle"
            >
              From EHCP drafting and worksheet generation to behaviour plans, parent
              communications and daily adaptive work, every SEND tool a UK school needs,
              connected in one intelligent engine.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <a
                href="https://adaptly.co.uk/login"
                data-testid="hero-cta-primary"
                className="group inline-flex items-center gap-3 rounded-full bg-ink-900 text-cream-100 px-7 py-4 text-sm md:text-base font-medium hover:bg-terracotta transition-all duration-300 hover:scale-[1.03]"
              >
                Start free today
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a
                href="#services"
                data-testid="hero-cta-secondary"
                className="inline-flex items-center gap-3 rounded-full bg-cream-50/70 backdrop-blur border border-ink-900/10 text-ink-900 px-7 py-4 text-sm md:text-base font-medium hover:bg-cream-50 transition-all"
              >
                See the platform
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95, duration: 0.8 }}
              className="mt-10 grid grid-cols-3 gap-4 max-w-md"
              data-testid="hero-stats"
            >
              {[
                ["5h+", "saved / EHCP"],
                ["24", "specialist tools"],
                ["100%", "SEND aligned"],
              ].map(([v, l], i) => (
                <div key={l} className="glass rounded-2xl p-4" data-testid={`hero-stat-${i}`}>
                  <div className="font-display text-3xl md:text-4xl text-ink-900 leading-none">{v}</div>
                  <div className="mt-1 text-[10px] md:text-xs text-ink-500 uppercase tracking-wider">{l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* 3D ecosystem */}
          <div
            ref={canvasWrapRef}
            className="lg:col-span-7 order-1 lg:order-2 relative h-[460px] sm:h-[540px] lg:h-[640px]"
            data-testid="hero-ecosystem"
          >
            <LazyHero3D variant={variant} containerRef={canvasWrapRef} fallback={<HeroFallback />} />

            {/* Soft vignette around the canvas so the scene blends with cream bg. */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(closest-side, transparent 60%, rgba(244,240,230,0.35) 100%)"
            }} />

            {/* Label chip, anchored to the canvas to prove the composition is intentional */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.8 }}
              className="absolute bottom-4 left-4 md:left-6 glass rounded-full px-3 py-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-ink-700"
            >
              <Sparkles size={12} className="text-terracotta" />
              Adaptly engine · live
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ink-500 z-10"
        data-testid="hero-scroll-indicator"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll to explore</span>
        <div className="w-px h-10 bg-ink-900/20 overflow-hidden relative">
          <motion.div
            animate={{ y: [-40, 40] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="absolute inset-x-0 top-0 h-4 bg-ink-900"
          />
        </div>
      </motion.div>
    </section>
  );
}
