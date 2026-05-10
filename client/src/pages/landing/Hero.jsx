import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import {
  FileText,
  Sparkles,
  Users,
  BookOpen,
  BarChart3,
  ShieldCheck,
  Brain,
  Heart,
  GraduationCap,
  Compass,
} from "lucide-react";
import { useVariant } from "./lib/useVariant";

// ────────────────────────────────────────────────────────────────
// Hero — 200vh sticky scroll scene.
// As the user scrolls:
//   0.00–0.25  intro          (title settles, orbit assembles)
//   0.25–0.55  scroll-told    (title morphs to second message, engine rotates)
//   0.55–0.85  third message  (engine flares, orbit tiles disperse)
//   0.85–1.00  exit           (scene blurs, CTAs slide in, hand-off to About)
//
// The "engine" SVG in the centre is a frame-by-frame rotating geometric glyph
// whose rotation, glow and stroke-offset are all directly bound to
// scrollYProgress. That's the "follows you frame by frame" feel.
//
// V2: restrained (one message, short scroll scene).
// V3: full sequence above, plus more orbit tiles, wider parallax range,
//     velocity-reactive glow, and the orbit tiles travel radially outward
//     as you scroll past 60%.
// ────────────────────────────────────────────────────────────────

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

// Big reveal line. overflow:hidden was clipping descenders before — we now
// reveal via y-percentage on an inner span with generous line-height on the
// outer span so descenders breathe.
function RevealLine({ children, delay = 0 }) {
  return (
    <span className="block overflow-hidden" style={{ lineHeight: 1.05, paddingBottom: "0.08em" }}>
      <motion.span
        initial={{ y: "115%" }}
        animate={{ y: "0%" }}
        transition={{ delay, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="block"
      >
        {children}
      </motion.span>
    </span>
  );
}

// The scroll-told title — three messages that fade through one another.
// Each message has its own copy block, absolutely stacked.
function ScrollTitle({ scrollYProgress, variant }) {
  const isV3 = variant === "v3";
  // Opacity curves: each message owns a range.
  // V2 shows only message 1 (restrained).
  const a1 = useTransform(scrollYProgress, [0, 0.18, 0.32, 0.44], [1, 1, 0, 0]);
  const a2 = useTransform(
    scrollYProgress,
    [0.28, 0.42, 0.58, 0.68],
    isV3 ? [0, 1, 1, 0] : [0, 0, 0, 0]
  );
  const a3 = useTransform(
    scrollYProgress,
    [0.6, 0.72, 0.85, 0.95],
    isV3 ? [0, 1, 1, 0] : [0, 0, 0, 0]
  );
  const y1 = useTransform(scrollYProgress, [0, 0.5], [0, -60]);
  const y2 = useTransform(scrollYProgress, [0.28, 0.7], [40, -40]);
  const y3 = useTransform(scrollYProgress, [0.6, 1], [50, -30]);

  return (
    <div className="relative min-h-[260px] sm:min-h-[300px] lg:min-h-[340px]">
      {/* Message 1 */}
      <motion.h1
        style={{ opacity: a1, y: y1 }}
        className="absolute inset-0 font-heading text-ink-900 tracking-[-0.04em] text-5xl sm:text-6xl lg:text-7xl font-bold"
        data-testid="hero-title"
      >
        <RevealLine delay={0.1}>One platform for</RevealLine>
        <RevealLine delay={0.22}>
          <span className="font-display italic font-normal text-terracotta">teaching, support</span>
        </RevealLine>
        <RevealLine delay={0.34}>and progress.</RevealLine>
      </motion.h1>

      {/* Message 2 (V3 only) */}
      {isV3 && (
        <motion.h1
          style={{ opacity: a2, y: y2 }}
          aria-hidden
          className="absolute inset-0 font-heading text-ink-900 tracking-[-0.04em] text-5xl sm:text-6xl lg:text-7xl font-bold"
        >
          <span className="block" style={{ lineHeight: 1.05, paddingBottom: "0.08em" }}>
            24 specialist
          </span>
          <span
            className="block font-display italic font-normal text-terracotta"
            style={{ lineHeight: 1.05, paddingBottom: "0.08em" }}
          >
            tools. one
          </span>
          <span className="block" style={{ lineHeight: 1.05, paddingBottom: "0.08em" }}>
            quiet engine.
          </span>
        </motion.h1>
      )}

      {/* Message 3 (V3 only) */}
      {isV3 && (
        <motion.h1
          style={{ opacity: a3, y: y3 }}
          aria-hidden
          className="absolute inset-0 font-heading text-ink-900 tracking-[-0.04em] text-5xl sm:text-6xl lg:text-7xl font-bold"
        >
          <span className="block" style={{ lineHeight: 1.05, paddingBottom: "0.08em" }}>
            Built so every
          </span>
          <span
            className="block font-display italic font-normal text-terracotta"
            style={{ lineHeight: 1.05, paddingBottom: "0.08em" }}
          >
            child is seen,
          </span>
          <span className="block" style={{ lineHeight: 1.05, paddingBottom: "0.08em" }}>
            not missed.
          </span>
        </motion.h1>
      )}
    </div>
  );
}

// The engine glyph — a geometric mark that rotates as you scroll and whose
// stroke dash-offset flows with scroll velocity. Pure SVG, GPU-friendly.
function EngineGlyph({ scrollYProgress, variant }) {
  const isV3 = variant === "v3";
  const rotate = useTransform(scrollYProgress, [0, 1], [0, isV3 ? 540 : 140]);
  const innerRotate = useTransform(scrollYProgress, [0, 1], [0, isV3 ? -360 : -80]);
  const dashOffset = useTransform(scrollYProgress, [0, 1], [0, isV3 ? 560 : 140]);
  const flare = useTransform(
    scrollYProgress,
    [0, 0.5, 0.8, 1],
    isV3 ? [0.4, 0.85, 1, 0.6] : [0.4, 0.6, 0.7, 0.55]
  );
  const warp = useTransform(scrollYProgress, [0, 1], [1, isV3 ? 1.12 : 1.04]);

  return (
    <div className="relative flex items-center justify-center w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] lg:w-[320px] lg:h-[320px]">
      {/* Soft warm halo behind the mark, flaring on scroll */}
      <motion.div
        style={{ opacity: flare, scale: warp }}
        className="absolute inset-0 rounded-full"
        aria-hidden
      >
        <div
          className="absolute inset-4 rounded-full blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(217,108,74,0.55), rgba(217,108,74,0) 70%)" }}
        />
        <div
          className="absolute inset-0 rounded-full blur-3xl"
          style={{ background: "radial-gradient(closest-side, rgba(229,185,110,0.35), rgba(229,185,110,0) 70%)" }}
        />
      </motion.div>

      {/* Outer ring — rotates with scroll */}
      <motion.svg
        style={{ rotate }}
        viewBox="-160 -160 320 320"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        <motion.circle
          cx="0"
          cy="0"
          r="140"
          fill="none"
          stroke="#22201E"
          strokeOpacity="0.22"
          strokeWidth="1"
          strokeDasharray="4 8"
          style={{ strokeDashoffset: dashOffset }}
        />
        <motion.circle
          cx="0"
          cy="0"
          r="122"
          fill="none"
          stroke="#D96C4A"
          strokeOpacity="0.55"
          strokeWidth="1.5"
          strokeDasharray="2 14"
          style={{ strokeDashoffset: dashOffset }}
        />
        {/* Tick marks */}
        {Array.from({ length: 48 }).map((_, i) => {
          const a = (i / 48) * 360;
          const p1 = polar(a, 146);
          const p2 = polar(a, i % 4 === 0 ? 155 : 150);
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#22201E"
              strokeOpacity={i % 4 === 0 ? 0.45 : 0.18}
              strokeWidth="1"
            />
          );
        })}
      </motion.svg>

      {/* Inner wheel — counter-rotates */}
      <motion.svg
        style={{ rotate: innerRotate }}
        viewBox="-100 -100 200 200"
        className="absolute inset-[45px] sm:inset-[52px] lg:inset-[60px]"
        aria-hidden
      >
        {/* Six-armed engine wheel */}
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * 360;
          const p = polar(a, 70);
          return (
            <g key={i} opacity="0.8">
              <line x1="0" y1="0" x2={p.x} y2={p.y} stroke="#22201E" strokeOpacity="0.35" strokeWidth="1.5" />
              <circle cx={p.x} cy={p.y} r="3.5" fill={i % 3 === 0 ? "#D96C4A" : "#22201E"} />
            </g>
          );
        })}
        <circle cx="0" cy="0" r="10" fill="#22201E" />
        <circle cx="0" cy="0" r="3" fill="#E5B96E" />
      </motion.svg>

      {/* Centre medallion (static, anchors the composition) */}
      <div className="relative z-10 w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] lg:w-[112px] lg:h-[112px] rounded-full glass flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(34,32,30,0.25)]">
        <div className="text-center">
          <div className="font-display text-3xl text-ink-900 leading-none">A</div>
          <div className="mt-1 text-[8px] uppercase tracking-[0.3em] text-ink-500">engine</div>
        </div>
      </div>
    </div>
  );
}

// Orbiting tiles — V3 disperses them outward as scroll progresses past 60%.
function OrbitTiles({ scrollYProgress, variant, mouseSx, mouseSy }) {
  const isV3 = variant === "v3";
  const count = isV3 ? 10 : 6;
  const tiles = PILLARS.slice(0, count);

  // Mobile: fewer tiles and smaller radius so the composition fits without
  // overflowing the viewport or hitting the copy column.
  const baseRadius = useResponsiveRadius(isV3);
  const visibleTiles = tiles.slice(0, baseRadius.count);

  // Radial expansion as scroll advances into later thirds.
  const radiusMul = useTransform(
    scrollYProgress,
    [0, 0.55, 0.9],
    isV3 ? [1, 1.05, 1.5] : [1, 1.02, 1.15]
  );
  // Tile opacity fades out near the end.
  const tileOpacity = useTransform(scrollYProgress, [0, 0.75, 1], [1, 1, 0]);

  return (
    <motion.div
      style={{ x: mouseSx, y: mouseSy, opacity: tileOpacity }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      data-testid="hero-orbit"
    >
      {/* Orbit ring */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="-320 -320 640 640"
        preserveAspectRatio="xMidYMid meet"
      >
        {visibleTiles.map((o, i) => {
          const angle = (i / visibleTiles.length) * 360 - 90;
          const p = polar(angle, baseRadius.value);
          return (
            <motion.line
              key={i}
              x1={0}
              y1={0}
              x2={p.x}
              y2={p.y}
              stroke={o.color}
              strokeOpacity={0.22}
              strokeWidth={1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.55 }}
              transition={{ delay: 0.4 + i * 0.06, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })}
      </svg>

      {visibleTiles.map((o, i) => {
        const angle = (i / visibleTiles.length) * 360 - 90;
        return (
          <OrbitTile
            key={o.label}
            tile={o}
            index={i}
            angle={angle}
            baseRadius={baseRadius.value}
            radiusMul={radiusMul}
          />
        );
      })}
    </motion.div>
  );
}

// Pick an orbit radius and tile count that fit the current viewport width.
function useResponsiveRadius(isV3) {
  const [state, setState] = useState(() => ({ value: isV3 ? 260 : 220, count: isV3 ? 10 : 6 }));
  useEffect(() => {
    const compute = () => {
      const w = typeof window === "undefined" ? 1024 : window.innerWidth;
      if (w < 640) {
        setState({ value: 130, count: isV3 ? 8 : 5 });
      } else if (w < 1024) {
        setState({ value: 190, count: isV3 ? 9 : 6 });
      } else {
        setState({ value: isV3 ? 260 : 220, count: isV3 ? 10 : 6 });
      }
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [isV3]);
  return state;
}

function OrbitTile({ tile, index, angle, baseRadius, radiusMul }) {
  const Icon = tile.icon;
  const x = useTransform(radiusMul, (m) => polar(angle, baseRadius * m).x);
  const y = useTransform(radiusMul, (m) => polar(angle, baseRadius * m).y);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + index * 0.06, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ x, y }}
      className="absolute"
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.4 + (index % 4) * 0.3, repeat: Infinity, ease: "easeInOut", delay: index * 0.15 }}
        className="glass rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 whitespace-nowrap shadow-[0_10px_30px_-12px_rgba(34,32,30,0.22)]"
      >
        <span
          className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{ background: `${tile.color}22`, color: tile.color }}
        >
          <Icon size={14} />
        </span>
        <span className="font-heading font-semibold text-xs text-ink-900">{tile.label}</span>
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  const sectionRef = useRef(null);
  const { variant } = useVariant();
  const reducedMotion = useReducedMotion();
  const isV3 = variant === "v3";

  // Mouse parallax for desktop.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });

  useEffect(() => {
    if (reducedMotion) return;
    const range = isV3 ? 24 : 14;
    const onMove = (e) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * range);
      my.set((e.clientY / window.innerHeight - 0.5) * range);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, isV3, reducedMotion]);

  // The sticky scroll scene. V3 is 200vh tall; V2 is 120vh for a shorter beat.
  const sceneHeight = isV3 ? "200vh" : "120vh";

  // Scroll progress across the whole hero section.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Global scene transforms.
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, isV3 ? 0.92 : 0.96]);
  const stageBlur = useTransform(
    scrollYProgress,
    [0, 0.85, 1],
    isV3 ? [0, 0, 6] : [0, 0, 0]
  );
  const stageFilter = useMotionTemplate`blur(${stageBlur}px)`;
  const stageOpacity = useTransform(scrollYProgress, [0, 0.92, 1], [1, 1, 0]);

  return (
    <section
      ref={sectionRef}
      id="top"
      data-testid="hero-section"
      className="relative w-full"
      style={{ height: sceneHeight }}
    >
      {/* Sticky viewport — the actual scene. */}
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Warm background glow */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[520px] h-[520px] rounded-full bg-terracotta/18 blur-[140px] animate-float-slow" />
          <div className="absolute bottom-10 right-10 w-[460px] h-[460px] rounded-full bg-honey/28 blur-[140px]" />
          {isV3 && (
            <>
              <div className="absolute top-10 right-1/4 w-[340px] h-[340px] rounded-full bg-sage/22 blur-[120px]" />
              <div className="absolute top-1/2 left-10 w-[280px] h-[280px] rounded-full bg-terracotta/12 blur-[110px]" />
            </>
          )}
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#22201E 1px, transparent 1px), linear-gradient(90deg, #22201E 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <motion.div
          style={{ scale: stageScale, opacity: stageOpacity, filter: stageFilter }}
          className="relative flex-1 h-full flex items-center pt-28 pb-16"
        >
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

              <div className="mt-6">
                <ScrollTitle scrollYProgress={scrollYProgress} variant={variant} />
              </div>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 text-base md:text-lg text-ink-500 leading-relaxed max-w-lg"
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
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <a
                  href="https://adaptly.co.uk/login"
                  data-testid="hero-cta-primary"
                  data-cursor="hover"
                  className="group inline-flex items-center gap-3 rounded-full bg-ink-900 text-cream-100 px-7 py-4 text-sm md:text-base font-medium hover:bg-terracotta transition-all duration-300 hover:scale-[1.03]"
                >
                  Start free today
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
                <a
                  href="#services"
                  data-testid="hero-cta-secondary"
                  data-cursor="hover"
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

            {/* Engine stage + orbit */}
            <div
              className="lg:col-span-7 order-1 lg:order-2 relative h-[460px] sm:h-[540px] lg:h-[640px]"
              data-testid="hero-ecosystem"
            >
              <OrbitTiles
                scrollYProgress={scrollYProgress}
                variant={variant}
                mouseSx={sx}
                mouseSy={sy}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <EngineGlyph scrollYProgress={scrollYProgress} variant={variant} />
              </div>

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

        {/* Scroll indicator — only during the first beat */}
        <ScrollCue scrollYProgress={scrollYProgress} />
      </div>
    </section>
  );
}

function ScrollCue({ scrollYProgress }) {
  const op = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  return (
    <motion.div
      style={{ opacity: op }}
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
  );
}
