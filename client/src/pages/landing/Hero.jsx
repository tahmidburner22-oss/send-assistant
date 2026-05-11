import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
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

// ────────────────────────────────────────────────────────────────
// Hero — sticky scroll scene.
// Desktop (≥1024px): 200vh of scroll. Three title messages cycle through
//   as you scroll (only one in the DOM at a time so there's no overlap
//   bleed). Engine glyph + orbit tiles share one parallax transform so
//   the connecting lines always meet the wheel's centre.
// Tablet (640-1023px): 160vh — same sequence, tighter.
// Mobile (<640px): natural-flow section, single headline, no sticky.
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

const TITLES = [
  {
    a: "One platform for",
    b: "teaching, support",
    c: "and progress.",
  },
  {
    a: "24 specialist",
    b: "tools. one",
    c: "quiet engine.",
  },
  {
    a: "Built so every",
    b: "child is seen,",
    c: "not missed.",
  },
];

function polar(angleDeg, r) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

// Layout picks viewport-appropriate sizes.
// Mobile (<640px): natural-height section (no sticky) so copy + engine +
// stats fit without clipping. Tablet/desktop: sticky scroll scene.
function useHeroLayout() {
  const [layout, setLayout] = useState({
    sceneHeight: "200vh",
    orbitRadius: 260,
    orbitCount: 10,
    enableTitleMorph: true,
    mouseParallaxRange: 24,
    sticky: true,
  });
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (h < 500 && w < 1200) {
        // Landscape phone — use mobile config
        setLayout({
          sceneHeight: "auto",
          orbitRadius: 135,
          orbitCount: 5,
          enableTitleMorph: false,
          mouseParallaxRange: 0,
          sticky: false,
        });
        return;
      }
      if (w < 640) {
        setLayout({
          sceneHeight: "auto",
          orbitRadius: 135,
          orbitCount: 5,
          enableTitleMorph: false,
          mouseParallaxRange: 0,
          sticky: false,
        });
      } else if (w < 1024) {
        setLayout({
          sceneHeight: "160vh",
          orbitRadius: 195,
          orbitCount: 8,
          enableTitleMorph: true,
          mouseParallaxRange: 16,
          sticky: true,
        });
      } else {
        setLayout({
          sceneHeight: "200vh",
          orbitRadius: 260,
          orbitCount: 10,
          enableTitleMorph: true,
          mouseParallaxRange: 24,
          sticky: true,
        });
      }
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return layout;
}

// Reveal line that doesn't clip descenders.
function RevealLine({ children, delay = 0, keyRef }) {
  return (
    <span
      className="block overflow-hidden"
      style={{ lineHeight: 1.05, paddingBottom: "0.1em" }}
    >
      <motion.span
        key={keyRef}
        initial={{ y: "115%" }}
        animate={{ y: "0%" }}
        exit={{ y: "-115%" }}
        transition={{ delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="block"
      >
        {children}
      </motion.span>
    </span>
  );
}

// Render a single title block. Switching activeIndex triggers a staggered
// exit/enter via AnimatePresence. Only one block is ever in the DOM at a
// time, so zero-opacity ghosts can't cause visual overlap.
function ActiveTitle({ activeIndex }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={activeIndex}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 1 }}
      >
        <TitleBlock index={activeIndex} />
      </motion.div>
    </AnimatePresence>
  );
}

function TitleBlock({ index }) {
  const t = TITLES[index] || TITLES[0];
  return (
    <h1
      className="font-heading text-ink-900 tracking-[-0.04em] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold"
      data-testid="hero-title"
    >
      <RevealLine delay={0.02} keyRef={`${index}-a`}>
        {t.a}
      </RevealLine>
      <RevealLine delay={0.12} keyRef={`${index}-b`}>
        <span className="font-display italic font-normal text-terracotta">{t.b}</span>
      </RevealLine>
      <RevealLine delay={0.22} keyRef={`${index}-c`}>
        {t.c}
      </RevealLine>
    </h1>
  );
}

// The engine glyph — rotates with scroll, counter-rotating inner wheel.
function EngineGlyph({ scrollYProgress }) {
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 540]);
  const innerRotate = useTransform(scrollYProgress, [0, 1], [0, -360]);
  const dashOffset = useTransform(scrollYProgress, [0, 1], [0, 560]);
  const flare = useTransform(scrollYProgress, [0, 0.5, 0.8, 1], [0.4, 0.85, 1, 0.6]);
  const warp = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <div className="relative flex items-center justify-center w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] lg:w-[320px] lg:h-[320px]">
      <motion.div
        style={{ opacity: flare, scale: warp }}
        className="absolute inset-0 rounded-full"
        aria-hidden
      >
        <div
          className="absolute inset-4 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(217,108,74,0.55), rgba(217,108,74,0) 70%)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(229,185,110,0.35), rgba(229,185,110,0) 70%)",
          }}
        />
      </motion.div>

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

      <motion.svg
        style={{ rotate: innerRotate }}
        viewBox="-100 -100 200 200"
        className="absolute inset-[40px] sm:inset-[52px] lg:inset-[60px]"
        aria-hidden
      >
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * 360;
          const p = polar(a, 70);
          return (
            <g key={i} opacity="0.8">
              <line
                x1="0"
                y1="0"
                x2={p.x}
                y2={p.y}
                stroke="#22201E"
                strokeOpacity="0.35"
                strokeWidth="1.5"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill={i % 3 === 0 ? "#D96C4A" : "#22201E"}
              />
            </g>
          );
        })}
        <circle cx="0" cy="0" r="10" fill="#22201E" />
        <circle cx="0" cy="0" r="3" fill="#E5B96E" />
      </motion.svg>

      <div className="relative z-10 w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] lg:w-[112px] lg:h-[112px] rounded-full glass flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(34,32,30,0.25)]">
        <div className="text-center">
          <div className="font-display text-2xl sm:text-3xl text-ink-900 leading-none">A</div>
          <div className="mt-1 text-[8px] uppercase tracking-[0.3em] text-ink-500">engine</div>
        </div>
      </div>
    </div>
  );
}

function OrbitTiles({ scrollYProgress, orbitRadius, orbitCount }) {
  const tiles = PILLARS.slice(0, orbitCount);
  const radiusMul = useTransform(scrollYProgress, [0, 0.55, 0.9], [1, 1.05, 1.5]);
  const tileOpacity = useTransform(scrollYProgress, [0, 0.75, 1], [1, 1, 0]);

  return (
    <motion.div
      style={{ opacity: tileOpacity }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      data-testid="hero-orbit"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="-320 -320 640 640"
        preserveAspectRatio="xMidYMid meet"
      >
        {tiles.map((o, i) => {
          const angle = (i / tiles.length) * 360 - 90;
          const p = polar(angle, orbitRadius);
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
              transition={{
                delay: 0.4 + i * 0.06,
                duration: 1.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          );
        })}
      </svg>

      {tiles.map((o, i) => {
        const angle = (i / tiles.length) * 360 - 90;
        return (
          <OrbitTile
            key={o.label}
            tile={o}
            index={i}
            angle={angle}
            baseRadius={orbitRadius}
            radiusMul={radiusMul}
          />
        );
      })}
    </motion.div>
  );
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
        transition={{
          duration: 3.4 + (index % 4) * 0.3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.15,
        }}
        className="glass rounded-2xl px-3 sm:px-3.5 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-2.5 whitespace-nowrap shadow-[0_10px_30px_-12px_rgba(34,32,30,0.22)]"
      >
        <span
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center"
          style={{ background: `${tile.color}22`, color: tile.color }}
        >
          <Icon size={13} />
        </span>
        <span className="font-heading font-semibold text-[11px] sm:text-xs text-ink-900">
          {tile.label}
        </span>
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  const sectionRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const layout = useHeroLayout();

  // Mouse parallax — applied to the WHOLE composition (engine + tiles)
  // so their geometry stays consistent.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  // Copy column uses a smaller parallax range so it reads as separate.
  const copyX = useTransform(sx, (v) => v * 0.4);
  const copyY = useTransform(sy, (v) => v * 0.4);

  useEffect(() => {
    if (reducedMotion || layout.mouseParallaxRange === 0) return;
    const range = layout.mouseParallaxRange;
    const onMove = (e) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * range);
      my.set((e.clientY / window.innerHeight - 0.5) * range);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, layout.mouseParallaxRange, reducedMotion]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Active title index driven by scroll buckets. Keeps exactly one title
  // in the DOM — no opacity crossfade, no bleed, no overlap.
  const [activeIndex, setActiveIndex] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!layout.enableTitleMorph) {
      if (activeIndex !== 0) setActiveIndex(0);
      return;
    }
    const next = v < 0.38 ? 0 : v < 0.7 ? 1 : 2;
    if (next !== activeIndex) setActiveIndex(next);
  });

  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const stageBlur = useTransform(scrollYProgress, [0, 0.85, 1], [0, 0, 6]);
  const stageFilter = useMotionTemplate`blur(${stageBlur}px)`;
  const stageOpacity = useTransform(scrollYProgress, [0, 0.92, 1], [1, 1, 0]);

  return (
    <section
      ref={sectionRef}
      id="top"
      data-testid="hero-section"
      className="relative w-full"
      style={layout.sticky ? { height: layout.sceneHeight } : undefined}
    >
      <div
        className={
          layout.sticky
            ? "sticky top-0 h-[100svh] w-full overflow-hidden"
            : "relative w-full overflow-hidden"
        }
      >
        {/* Warm background glow */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[420px] sm:w-[520px] h-[420px] sm:h-[520px] rounded-full bg-terracotta/18 blur-[140px] animate-float-slow" />
          <div className="absolute bottom-10 right-10 w-[380px] sm:w-[460px] h-[380px] sm:h-[460px] rounded-full bg-honey/28 blur-[140px]" />
          <div className="hidden sm:block absolute top-10 right-1/4 w-[340px] h-[340px] rounded-full bg-sage/22 blur-[120px]" />
          <div className="hidden sm:block absolute top-1/2 left-10 w-[280px] h-[280px] rounded-full bg-terracotta/12 blur-[110px]" />
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
          style={
            layout.sticky
              ? { scale: stageScale, opacity: stageOpacity, filter: stageFilter }
              : undefined
          }
          className={
            layout.sticky
              ? "relative h-full flex items-center pt-24 sm:pt-28 pb-12 sm:pb-16"
              : "relative flex items-center pt-24 pb-14 min-h-[100svh]"
          }
        >
          <div className="max-w-7xl mx-auto w-full px-5 sm:px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 items-center">
            {/* Copy column — lighter parallax */}
            <motion.div
              style={{ x: copyX, y: copyY }}
              className="lg:col-span-5 order-2 lg:order-1"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[11px] sm:text-xs md:text-sm text-ink-700 font-medium"
                data-testid="hero-kicker"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
                24 specialist tools, built for SEND excellence
              </motion.div>

              {/* Fixed-height title container so swapping active title
                  doesn't reflow the rest of the column. Sized for 3 lines
                  at the largest breakpoint plus descender padding. */}
              <div className="mt-5 sm:mt-6 relative min-h-[180px] sm:min-h-[220px] md:min-h-[260px] lg:min-h-[320px]">
                <ActiveTitle activeIndex={activeIndex} />
              </div>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 sm:mt-6 text-sm sm:text-base md:text-lg text-ink-500 leading-relaxed max-w-lg"
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
                className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3"
              >
                <a
                  href="https://adaptly.co.uk/login"
                  data-testid="hero-cta-primary"
                  data-cursor="hover"
                  className="group inline-flex items-center gap-3 rounded-full bg-ink-900 text-cream-100 px-6 sm:px-7 py-3.5 sm:py-4 text-sm md:text-base font-medium hover:bg-terracotta transition-all duration-300 hover:scale-[1.03]"
                >
                  Start free today
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
                <a
                  href="#services"
                  data-testid="hero-cta-secondary"
                  data-cursor="hover"
                  className="inline-flex items-center gap-3 rounded-full bg-cream-50/70 backdrop-blur border border-ink-900/10 text-ink-900 px-6 sm:px-7 py-3.5 sm:py-4 text-sm md:text-base font-medium hover:bg-cream-50 transition-all"
                >
                  See the platform
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.95, duration: 0.8 }}
                className="mt-8 sm:mt-10 grid grid-cols-3 gap-3 sm:gap-4 max-w-md"
                data-testid="hero-stats"
              >
                {[
                  ["5h+", "saved / EHCP"],
                  ["24", "tools"],
                  ["100%", "SEND aligned"],
                ].map(([v, l], i) => (
                  <div
                    key={l}
                    className="glass rounded-2xl p-3 sm:p-4"
                    data-testid={`hero-stat-${i}`}
                  >
                    <div className="font-display text-2xl sm:text-3xl md:text-4xl text-ink-900 leading-none">
                      {v}
                    </div>
                    <div className="mt-1 text-[9px] sm:text-[10px] md:text-xs text-ink-500 uppercase tracking-wider">
                      {l}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Engine + orbit composition — shared parallax wrapper so
                the connecting lines always point to the wheel's centre. */}
            <motion.div
              style={{ x: sx, y: sy }}
              className="lg:col-span-7 order-1 lg:order-2 relative h-[340px] sm:h-[460px] md:h-[540px] lg:h-[640px]"
              data-testid="hero-ecosystem"
            >
              <OrbitTiles
                scrollYProgress={scrollYProgress}
                orbitRadius={layout.orbitRadius}
                orbitCount={layout.orbitCount}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <EngineGlyph scrollYProgress={scrollYProgress} />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.8 }}
                className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 md:left-6 glass rounded-full px-3 py-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-ink-700"
              >
                <Sparkles size={12} className="text-terracotta" />
                Adaptly engine · live
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {layout.sticky && <ScrollCue scrollYProgress={scrollYProgress} />}
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
      className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ink-500 z-10"
      data-testid="hero-scroll-indicator"
    >
      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em]">
        Scroll to explore
      </span>
      <div className="w-px h-8 sm:h-10 bg-ink-900/20 overflow-hidden relative">
        <motion.div
          animate={{ y: [-40, 40] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="absolute inset-x-0 top-0 h-4 bg-ink-900"
        />
      </div>
    </motion.div>
  );
}
