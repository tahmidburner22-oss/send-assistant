import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";
import { FileText, Sparkles, Users, BookOpen, BarChart3, ShieldCheck, Heart } from "lucide-react";

// Orbiting feature cards around a central "Adaptly Engine" dashboard.
// Pure HTML / Framer Motion / SVG — no WebGL — and every card reflects a real product pillar.

const ORBITS = [
  { label: "Worksheets", icon: FileText, angle: -90, r: 270, color: "#D96C4A", delay: 0.2 },
  { label: "SEND Adaptation", icon: Sparkles, angle: -30, r: 270, color: "#E5B96E", delay: 0.3 },
  { label: "Parent Portal", icon: Users, angle: 30, r: 270, color: "#7F8C72", delay: 0.4 },
  { label: "Reading", icon: BookOpen, angle: 90, r: 270, color: "#D96C4A", delay: 0.5 },
  { label: "Analytics", icon: BarChart3, angle: 150, r: 270, color: "#22201E", delay: 0.6 },
  { label: "Compliance", icon: ShieldCheck, angle: 210, r: 270, color: "#7F8C72", delay: 0.7 },
  { label: "Wellbeing", icon: Heart, angle: 270, r: 0, color: "#D96C4A", delay: 0 }, // unused, placeholder
];

function polar(angle, r) {
  const a = (angle * Math.PI) / 180;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

export default function Hero() {
  const sectionRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 });
  const sy = useSpring(my, { stiffness: 80, damping: 20 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      mx.set(x);
      my.set(y);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const fade = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const activeOrbits = ORBITS.slice(0, 6);
  const radius = isMobile ? 150 : 260;

  return (
    <section
      ref={sectionRef}
      id="top"
      data-testid="hero-section"
      className="relative min-h-[100svh] w-full overflow-hidden flex flex-col"
    >
      {/* Glow orbs background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[520px] h-[520px] rounded-full bg-terracotta/20 blur-[140px] animate-float-slow" />
        <div className="absolute bottom-10 right-10 w-[460px] h-[460px] rounded-full bg-honey/30 blur-[140px]" />
        <div className="absolute top-10 right-1/4 w-[320px] h-[320px] rounded-full bg-sage/20 blur-[120px]" />
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

      <motion.div style={{ scale, opacity: fade }} className="relative flex-1 flex items-center pt-28 pb-10">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Copy */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-7 text-base md:text-lg text-ink-500 leading-relaxed max-w-lg"
              data-testid="hero-subtitle"
            >
              From EHCP drafting and worksheet generation to behaviour plans, parent
              communications and daily adaptive work — every SEND tool a UK school needs,
              connected in one intelligent engine.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.8 }}
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
              transition={{ delay: 0.9, duration: 0.8 }}
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
          </div>

          {/* Ecosystem */}
          <div className="lg:col-span-7 order-1 lg:order-2 relative h-[480px] sm:h-[560px] lg:h-[640px]" data-testid="hero-ecosystem">
            <motion.div
              style={{ x: sx, y: sy }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Orbit rings */}
              <svg className="absolute inset-0 w-full h-full" viewBox="-320 -320 640 640" preserveAspectRatio="xMidYMid meet">
                {[radius * 0.55, radius, radius * 1.15].map((r, i) => (
                  <circle
                    key={i}
                    r={r}
                    cx={0}
                    cy={0}
                    fill="none"
                    stroke="#22201E"
                    strokeOpacity={0.06}
                    strokeDasharray="4 6"
                  />
                ))}
                {/* Animated connecting lines */}
                {activeOrbits.map((o, i) => {
                  const p = polar(o.angle, radius);
                  return (
                    <motion.line
                      key={i}
                      x1={0}
                      y1={0}
                      x2={p.x}
                      y2={p.y}
                      stroke={o.color}
                      strokeOpacity={0.25}
                      strokeWidth={1}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.6 }}
                      transition={{ delay: o.delay + 0.1, duration: 1.2, ease: "easeOut" }}
                    />
                  );
                })}
              </svg>

              {/* Central dashboard */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-[220px] sm:w-[260px] md:w-[300px] rounded-3xl glass p-5 shadow-[0_25px_70px_-20px_rgba(34,32,30,0.25)]"
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
                      transition={{ delay: 1.2, duration: 1.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-terracotta to-honey"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4 + i * 0.1 }}
                        className="aspect-[4/3] rounded-lg bg-ink-900/5 flex items-end p-2"
                      >
                        <motion.div
                          initial={{ height: "10%" }}
                          animate={{ height: `${40 + i * 20}%` }}
                          transition={{ delay: 1.8 + i * 0.1, duration: 0.8 }}
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

              {/* Orbiting feature cards */}
              {activeOrbits.map((o, i) => {
                const p = polar(o.angle, radius);
                const Icon = o.icon;
                return (
                  <motion.div
                    key={o.label}
                    initial={{ opacity: 0, scale: 0.6, x: 0, y: 0 }}
                    animate={{ opacity: 1, scale: 1, x: p.x, y: p.y }}
                    transition={{ delay: o.delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute"
                    style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
                    data-testid={`hero-orbit-${o.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3 + i * 0.2, repeat: Infinity, ease: "easeInOut", delay: o.delay }}
                      className="glass rounded-2xl px-4 py-3 flex items-center gap-3 whitespace-nowrap shadow-[0_10px_30px_-12px_rgba(34,32,30,0.2)]"
                    >
                      <span
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: `${o.color}20`, color: o.color }}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="font-heading font-semibold text-sm text-ink-900">{o.label}</span>
                    </motion.div>
                  </motion.div>
                );
              })}

              {/* Moving dots along orbit */}
              {activeOrbits.map((o, i) => (
                <motion.div
                  key={"dot-" + i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ background: o.color }}
                  animate={{
                    x: Array.from({ length: 37 }).map((_, k) => polar(o.angle + k * 10, radius).x),
                    y: Array.from({ length: 37 }).map((_, k) => polar(o.angle + k * 10, radius).y),
                  }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: i * 0.4 }}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
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

function RevealLine({ children, delay = 0 }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="block"
      >
        {children}
      </motion.span>
    </span>
  );
}
