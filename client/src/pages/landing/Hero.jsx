import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { FileText, Sparkles, Users, BookOpen, BarChart3, ShieldCheck, Brain, Heart, GraduationCap, Compass } from "lucide-react";
import { useVariant } from "./lib/useVariant";

// Hero — rich 2D composition with warm orbit tiles around a central dashboard.
// V2 (Immersive): 6 orbit tiles, soft parallax.
// V3 (Overdrive): 10 orbit tiles + outer ring of micro-dots + stronger parallax,
// scroll-out blur, and a richer background.
//
// NOTE: the WebGL hero is temporarily disabled while we stabilise Railway
// deployment. The 2D composition here is tuned to carry the page on its own.

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

const PILLARS = [
  { label: "EHCP", icon: FileText, color: "#D96C4A" },
  { label: "Adaptation", icon: Sparkles, color: "#E5B96E" },
  { label: "Parent Portal", icon: Users, color: "#7F8C72" },
  { label: "Reading", icon: BookOpen, color: "#D96C4A" },
  { label: "Analytics", icon: BarChart3, color: "#22201E" },
  { label: "Compliance", icon: ShieldCheck, color: "#7F8C72" },
  { label: "Behaviour", icon: Brain, color: "#D96C4A" },
  { label: "Wellbeing", icon: Heart, color: "#E5B96E" },
  { label: "Lessons", icon: GraduationCap, color: "#7F8C72" },
  { label: "Screener", icon: Compass, color: "#22201E" },
];

function polar(angleDeg, r) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

function OrbitComposition({ variant, mouseSx, mouseSy, radius }) {
  const count = variant === "v3" ? 10 : 6;
  const tiles = PILLARS.slice(0, count);

  return (
    <motion.div
      style={{ x: mouseSx, y: mouseSy }}
      className="absolute inset-0 flex items-center justify-center"
      data-testid="hero-composition"
    >
      {/* Orbit rings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="-320 -320 640 640" preserveAspectRatio="xMidYMid meet">
        {[radius * 0.55, radius, radius * 1.15, ...(variant === "v3" ? [radius * 1.3] : [])].map((r, i) => (
          <circle
            key={i}
            r={r}
            cx={0}
            cy={0}
            fill="none"
            stroke="#22201E"
            strokeOpacity={i === 1 ? 0.1 : 0.06}
            strokeDasharray={i === 1 ? "6 8" : "4 6"}
          />
        ))}
        {/* Connecting lines */}
        {tiles.map((o, i) => {
          const angle = (i / tiles.length) * 360 - 90;
          const p = polar(angle, radius);
          return (
            <motion.line
              key={i}
              x1={0}
              y1={0}
              x2={p.x}
              y2={p.y}
              stroke={o.color}
              strokeOpacity={0.2}
              strokeWidth={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.55 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })}

        {/* V3 only — micro-dot field around the outer orbit */}
        {variant === "v3" &&
          Array.from({ length: 48 }).map((_, i) => {
            const a = (i / 48) * 360;
            const r = radius * 1.42 + ((i % 3) * 10);
            const p = polar(a, r);
            return (
              <motion.circle
                key={"dot-" + i}
                cx={p.x}
                cy={p.y}
                r={1.3}
                fill="#22201E"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                transition={{ delay: 0.8 + (i % 8) * 0.04, duration: 0.8 }}
              />
            );
          })}
      </svg>

      {/* Central dashboard */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-[220px] sm:w-[260px] md:w-[300px] rounded-3xl glass p-5 shadow-[0_25px_70px_-20px_rgba(34,32,30,0.28)]"
        data-testid="hero-dashboard"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-terracotta" />
          <span className="w-2 h-2 rounded-full bg-honey" />
          <span className="w-2 h-2 rounded-full bg-sage" />
          <div className="ml-auto text-[10px] uppercase tracking-[0.2em] text-ink-500">Adaptly engine</div>
        </div>
        <div className="space-y-3">
          <div className="h-2 rounded-full bg-ink-900/10 overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "72%" }}
              transition={{ delay: 1.1, duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-gradient-to-r from-terracotta to-honey"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.1 }}
                className="aspect-[4/3] rounded-lg bg-ink-900/5 flex items-end p-2"
              >
                <motion.div
                  initial={{ height: "10%" }}
                  animate={{ height: `${40 + i * 20}%` }}
                  transition={{ delay: 1.6 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full rounded bg-ink-900"
                />
              </motion.div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="w-6 h-6 rounded-full bg-terracotta/20 flex items-center justify-center">
              <Sparkles size={12} className="text-terracotta" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 rounded-full bg-ink-900/10 w-full" />
              <div className="h-1.5 rounded-full bg-ink-900/10 w-2/3" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Orbiting tiles */}
      {tiles.map((o, i) => {
        const angle = (i / tiles.length) * 360 - 90;
        const p = polar(angle, radius);
        const Icon = o.icon;
        return (
          <motion.div
            key={o.label}
            initial={{ opacity: 0, scale: 0.6, x: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1, x: p.x, y: p.y }}
            transition={{ delay: 0.3 + i * 0.08, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute"
            style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3 + (i % 4) * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
              className="glass rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 whitespace-nowrap shadow-[0_10px_30px_-12px_rgba(34,32,30,0.22)]"
            >
              <span
                className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: `${o.color}22`, color: o.color }}
              >
                <Icon size={14} />
              </span>
              <span className="font-heading font-semibold text-xs text-ink-900">{o.label}</span>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default function Hero() {
  const sectionRef = useRef(null);
  const { variant } = useVariant();

  // Mouse parallax.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });

  useEffect(() => {
    const scale = variant === "v3" ? 24 : 14;
    const onMove = (e) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * scale);
      my.set((e.clientY / window.innerHeight - 0.5) * scale);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, variant]);

  // Scroll-linked exit.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, variant === "v3" ? 0.82 : 0.9]);
  const blurAmt = useTransform(scrollYProgress, [0, 1], [0, variant === "v3" ? 6 : 0]);
  const fade = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const filter = useTransform(blurAmt, (v) => `blur(${v}px)`);

  const orbitRadius = variant === "v3" ? 240 : 220;

  return (
    <section
      ref={sectionRef}
      id="top"
      data-testid="hero-section"
      className="relative min-h-[100svh] w-full overflow-hidden flex flex-col"
    >
      {/* Warm background glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[520px] h-[520px] rounded-full bg-terracotta/18 blur-[140px] animate-float-slow" />
        <div className="absolute bottom-10 right-10 w-[460px] h-[460px] rounded-full bg-honey/28 blur-[140px]" />
        {variant === "v3" && (
          <>
            <div className="absolute top-10 right-1/4 w-[340px] h-[340px] rounded-full bg-sage/22 blur-[120px]" />
            <div className="absolute top-1/2 left-10 w-[280px] h-[280px] rounded-full bg-terracotta/12 blur-[110px]" />
          </>
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

      <motion.div style={{ scale: heroScale, opacity: fade, filter }} className="relative flex-1 flex items-center pt-28 pb-10">
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
              24 specialist tools, built for SEND excellence
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

          {/* Ecosystem visualization */}
          <div
            className="lg:col-span-7 order-1 lg:order-2 relative h-[460px] sm:h-[540px] lg:h-[640px]"
            data-testid="hero-ecosystem"
          >
            <OrbitComposition variant={variant} mouseSx={sx} mouseSy={sy} radius={orbitRadius} />

            {/* Label chip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
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
