/**
 * Adaptly — 3D Animated Landing Page
 * Built with Framer Motion (useScroll, useTransform, motion), React, TailwindCSS.
 * Zero external dependencies beyond what is already in the project.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import {
  FileText, BookOpen, Wand2, BookMarked, Gamepad2, Volume2,
  Brain, User, Target, Heart, Newspaper, BarChart3,
  CalendarDays, Calendar, Archive, ScanSearch, CalendarClock,
  Users, TrendingUp, Bot, GraduationCap, School, Building2,
  Bell, TrendingDown, CheckCircle2, Clock, Wrench, Layers,
  Lock, Scale, Shield, ShieldCheck, Database, Cpu, Rocket,
  MessageCircle, ChevronDown, ChevronUp, Info, AlertTriangle,
  Smartphone, BarChart2, Sparkles, Star, Zap, Globe, Timer,
} from "lucide-react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
  useMotionValue,
  useAnimationFrame,
} from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedNumber({
  target, suffix = "", prefix = "", duration = 2200,
}: { target: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE FIELD
// ─────────────────────────────────────────────────────────────────────────────

const PARTICLE_COUNT = 28;
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 2.5,
  duration: 8 + Math.random() * 16,
  delay: Math.random() * -20,
  opacity: 0.08 + Math.random() * 0.18,
}));

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-indigo-400"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: p.opacity }}
          animate={{ y: [0, -60, 0], opacity: [p.opacity, p.opacity * 2.5, p.opacity] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRID LINES BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────

function GridLines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOW ORBS
// ─────────────────────────────────────────────────────────────────────────────

function GlowOrb({ x, y, color, size = 500 }: { x: string; y: string; color: string; size?: number }) {
  return (
    <div
      className="absolute pointer-events-none rounded-full"
      style={{
        left: x, top: y,
        width: size, height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TILT CARD — 3D perspective on hover
// ─────────────────────────────────────────────────────────────────────────────

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    rotateY.set(clamp(dx * 10, -12, 12));
    rotateX.set(clamp(-dy * 10, -12, 12));
  }, [rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d", perspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL REVEAL WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

function Reveal({
  children, delay = 0, direction = "up", className = "",
}: { children: React.ReactNode; delay?: number; direction?: "up" | "left" | "right" | "scale"; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 40 : 0,
      x: direction === "left" ? -40 : direction === "right" ? 40 : 0,
      scale: direction === "scale" ? 0.88 : 1,
    },
    visible: { opacity: 1, y: 0, x: 0, scale: 1 },
  };
  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE CARD — 3D tilt + glow
// ─────────────────────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, accent, delay = 0 }: {
  icon: React.ReactNode; title: string; description: string; accent: string; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36, scale: 0.94 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard className="h-full">
        <div
          className="relative h-full p-6 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden group cursor-default"
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
            style={{ background: `radial-gradient(circle at 50% 0%, ${accent}22 0%, transparent 70%)` }}
          />
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
            style={{ background: `${accent}22`, border: `1px solid ${accent}44`, color: accent }}
          >
            <span className="w-5 h-5">{icon}</span>
          </div>
          <h3 className="text-base font-bold text-white mb-2 leading-snug">{title}</h3>
          <p className="text-sm text-white/55 leading-relaxed">{description}</p>
        </div>
      </TiltCard>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEM ROW
// ─────────────────────────────────────────────────────────────────────────────

function ProblemRow({ problem, solution, icon, delay = 0 }: {
  problem: string; solution: string; icon: React.ReactNode; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-5 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors group"
    >
      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-indigo-400">
        <span className="w-4 h-4">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-400/80 line-through mb-1 leading-snug">{problem}</p>
        <p className="text-sm text-emerald-400 font-medium leading-snug">{solution}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCROLLING TICKER
// ─────────────────────────────────────────────────────────────────────────────

const tickerItems = [
  "Worksheet Generator", "EHCP Plan Builder", "SMART Targets",
  "Reading & Stories", "QuizBlast", "Behaviour Plans",
  "Lesson Planner", "Audio Revision", "Pupil Passport",
  "Parent Newsletter", "Analytics", "Wellbeing Support",
  "Past Papers", "Flash Cards", "Report Comments",
  "Visual Timetable", "SEND Screener", "Rubric Generator",
];

function Ticker() {
  const x = useMotionValue(0);
  const itemWidth = 220;
  const totalWidth = tickerItems.length * itemWidth;

  useAnimationFrame((_, delta) => {
    const current = x.get();
    const next = current - (delta / 1000) * 45;
    x.set(next <= -totalWidth ? 0 : next);
  });

  return (
    <div className="relative overflow-hidden py-4 border-y border-white/[0.08]">
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, #060612, transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, #060612, transparent)" }} />
      <motion.div className="flex gap-0" style={{ x }}>
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <div
            key={i}
            className="flex-shrink-0 flex items-center gap-2 px-6 text-sm text-white/50 font-medium"
            style={{ width: itemWidth }}
          >
            <span>{item}</span>
            <span className="text-indigo-500/40 ml-auto">·</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIAL CARD
// ─────────────────────────────────────────────────────────────────────────────

function TestimonialCard({ quote, name, role, school, delay = 0 }: {
  quote: string; name: string; role: string; school: string; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/[0.07] transition-colors"
    >
      <div className="flex gap-0.5 text-amber-400 text-sm">{"★★★★★"}</div>
      <p className="text-white/75 text-sm leading-relaxed italic flex-1">"{quote}"</p>
      <div className="pt-2 border-t border-white/[0.08]">
        <p className="text-white font-semibold text-sm">{name}</p>
        <p className="text-white/40 text-xs mt-0.5">{role} · {school}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE BADGE
// ─────────────────────────────────────────────────────────────────────────────

function ComplianceBadge({ icon, title, body, delay = 0 }: {
  icon: React.ReactNode; title: string; body: string; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400">
        <span className="w-4 h-4">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-emerald-300 mb-1">{title}</p>
        <p className="text-xs text-white/50 leading-relaxed">{body}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INVESTOR METRIC
// ─────────────────────────────────────────────────────────────────────────────

function InvestorMetric({ value, label, icon, delay = 0 }: {
  value: string; label: string; icon: React.ReactNode; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="text-center p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition-colors"
    >
      <div className="flex justify-center mb-3 text-indigo-400"><span className="w-7 h-7">{icon}</span></div>
      <div className="text-3xl font-black text-white mb-1 tabular-nums">{value}</div>
      <div className="text-xs text-white/45 leading-snug">{label}</div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADING
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeading({ eyebrow, title, subtitle }: {
  eyebrow: string; title: React.ReactNode; subtitle?: string;
}) {
  return (
    <Reveal className="text-center max-w-2xl mx-auto mb-14">
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-400 mb-3">{eyebrow}</p>
      <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">{title}</h2>
      {subtitle && <p className="text-base text-white/50 leading-relaxed">{subtitle}</p>}
    </Reveal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO FLOATING CARD
// ─────────────────────────────────────────────────────────────────────────────

function HeroFloatingCard({ label, value, icon, className = "", delay = 0 }: {
  label: string; value: string; icon: React.ReactNode; className?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.7, delay },
        y: { duration: 4, delay: delay + 0.7, repeat: Infinity, ease: "easeInOut" },
      }}
      className={`absolute flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-md text-white shadow-2xl ${className}`}
    >
      <span className="w-5 h-5 text-indigo-300">{icon}</span>
      <div>
        <p className="text-[10px] text-white/50 leading-none mb-0.5">{label}</p>
        <p className="text-sm font-bold leading-none">{value}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [platformStats, setPlatformStats] = useState({ teachers: 266, worksheets: 266, schools: 1 });

  useEffect(() => {
    fetch("/api/data/stats")
      .then(r => r.json())
      .then(d => { if (d.teachers) setPlatformStats(d); })
      .catch(() => {});
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#mission", label: "Mission" },
    { href: "#compliance", label: "Compliance" },
    { href: "#investors", label: "Investors" },
  ];

  return (
    <div
      ref={containerRef}
      className="min-h-screen text-white overflow-x-hidden"
      style={{ background: "linear-gradient(135deg, #060612 0%, #0a0a1f 40%, #080818 100%)" }}
    >
      {/* ── SCROLL PROGRESS BAR ──────────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 z-[100] origin-left"
        style={{
          scaleX: scrollYProgress,
          background: "linear-gradient(to right, #6366f1, #a855f7, #ec4899)",
        }}
      />

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-[#060612]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl" : ""
        }`}
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div
              className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img src="/logo.png" alt="Adaptly Logo" className="w-full h-full object-contain" />
            </motion.div>
            <span className="text-white font-black text-lg tracking-tight">Adaptly</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-white/60 hover:text-white rounded-xl hover:bg-white/[0.08] transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <motion.button
                className="hidden sm:block px-4 py-2 text-sm text-white/70 hover:text-white rounded-xl hover:bg-white/[0.08] transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Sign in
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button
                className="px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-500/25"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(99,102,241,0.5)" }}
                whileTap={{ scale: 0.97 }}
              >
                Get Started Free
              </motion.button>
            </Link>
            <button
              className="md:hidden p-2 rounded-xl hover:bg-white/[0.08] text-white/70"
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.08] bg-[#060612]/95 backdrop-blur-xl"
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                {navLinks.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-sm text-white/70 hover:text-white rounded-xl hover:bg-white/[0.08] transition-all"
                  >
                    {link.label}
                  </a>
                ))}
                <Link href="/login">
                  <button
                    className="mt-2 w-full px-4 py-3 text-sm font-bold text-white rounded-xl"
                    style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                  >
                    Get Started Free
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16 overflow-hidden">
        <GridLines />
        <ParticleField />
        <GlowOrb x="20%" y="30%" color="rgba(99,102,241,0.12)" size={700} />
        <GlowOrb x="80%" y="60%" color="rgba(168,85,247,0.10)" size={600} />
        <GlowOrb x="50%" y="80%" color="rgba(236,72,153,0.08)" size={500} />

        <motion.div
          className="relative z-10 text-center max-w-5xl mx-auto"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold tracking-wide mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            24 Specialist Tools · Built for SEND Excellence
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6"
          >
            <span className="text-white">The Platform Every</span>
            <br />
            <span className="text-white">SENCO Needs,</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #818cf8, #a855f7, #ec4899)" }}
            >
              Powered by AI.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Adaptly gives every teacher and SENCO a full suite of AI-powered tools — from EHCP drafting and worksheet generation to behaviour plans and parent communications — all built around UK law and the SEND Code of Practice.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <Link href="/login">
              <motion.button
                className="px-8 py-4 text-base font-bold text-white rounded-2xl shadow-2xl shadow-indigo-500/30 w-full sm:w-auto"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(99,102,241,0.6)" }}
                whileTap={{ scale: 0.97 }}
              >
                Start Free Today →
              </motion.button>
            </Link>
            <a href="#features">
              <motion.button
                className="px-8 py-4 text-base font-semibold text-white/80 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors w-full sm:w-auto"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                See All Features
              </motion.button>
            </a>
            <a href="mailto:hello@adaptly.co.uk?subject=Book%20a%20Demo">
              <motion.button
                className="px-8 py-4 text-base font-semibold text-indigo-300 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors w-full sm:w-auto"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Book a Demo
              </motion.button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/35 mb-8"
          >
            {[
              "✓ GDPR Compliant",
              "✓ UK SEND Code of Practice",
              "✓ Ofsted Ready",
              "✓ DfE Aligned",
              "✓ No card required",
            ].map(badge => (
              <span key={badge} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
                {badge}
              </span>
            ))}
          </motion.div>
          {/* Real platform stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-10"
          >
            <div className="text-center">
              <p className="text-2xl font-black text-white tabular-nums">
                <AnimatedNumber target={platformStats.teachers} suffix="+" />
              </p>
              <p className="text-[11px] text-white/35 mt-0.5">Teachers using Adaptly</p>
            </div>
            <div className="w-px h-8 bg-white/10 hidden md:block" />
            <div className="text-center">
              <p className="text-2xl font-black text-white tabular-nums">
                <AnimatedNumber target={platformStats.worksheets} suffix="+" />
              </p>
              <p className="text-[11px] text-white/35 mt-0.5">Worksheets generated</p>
            </div>
            <div className="w-px h-8 bg-white/10 hidden md:block" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">24</p>
              <p className="text-[11px] text-white/35 mt-0.5">Specialist tools</p>
            </div>
          </motion.div>
        </motion.div>

        <HeroFloatingCard
          label="Time saved per EHCP"
          value="5+ hours"
          icon={<Clock className="w-5 h-5" />}
          className="hidden lg:flex top-1/3 left-8 xl:left-16"
          delay={0.8}
        />
        <HeroFloatingCard
          label="Tools available"
          value="24 specialist"
          icon={<Layers className="w-5 h-5" />}
          className="hidden lg:flex top-1/2 right-8 xl:right-16"
          delay={1.0}
        />
        <HeroFloatingCard
          label="UK SEND Code of Practice"
          value="100% Aligned"
          icon={<Zap className="w-5 h-5" />}
          className="hidden lg:flex bottom-1/4 left-16 xl:left-28"
          delay={1.2}
        />
      </section>

      {/* ── TICKER ───────────────────────────────────────────────── */}
      <Ticker />

      {/* ── IMPACT STATS ─────────────────────────────────────────── */}
      <section id="mission" className="py-24 px-4 relative overflow-hidden">
        <GlowOrb x="50%" y="50%" color="rgba(99,102,241,0.07)" size={800} />
        <div className="max-w-6xl mx-auto relative z-10">
          <SectionHeading
            eyebrow="The Problem We're Solving"
            title={<>SEND Support in the UK is <span className="text-red-400">Broken</span></>}
            subtitle="1.6 million pupils in England have SEND needs. Teachers are overwhelmed, SENCOs are drowning in paperwork, and children are falling through the cracks. Adaptly exists to change that."
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { value: 1600000, label: "pupils in England with SEND needs", icon: <Users className="w-7 h-7" />, suffix: "+" },
              { value: 6, label: "hours a SENCO spends drafting one EHCP", icon: <Clock className="w-7 h-7" />, suffix: "hrs" },
              { value: 87, label: "of teachers report inadequate SEND training", icon: <BookOpen className="w-7 h-7" />, suffix: "%" },
              { value: 95, label: "of users report reduced SEND workload", icon: <Layers className="w-7 h-7" />, suffix: "%" },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.1} direction="scale">
                <div className="text-center p-6 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition-colors">
                  <div className="flex justify-center mb-3 text-indigo-400">{stat.icon}</div>
                  <div className="text-3xl md:text-4xl font-black text-white mb-1 tabular-nums">
                    <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-white/40 leading-snug">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Heart section */}
          <Reveal>
            <div
              className="relative p-8 md:p-12 rounded-3xl border border-violet-500/20 overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(109,40,217,0.15) 0%, rgba(168,85,247,0.08) 100%)" }}
            >
              <GlowOrb x="80%" y="20%" color="rgba(168,85,247,0.15)" size={400} />
              <div className="relative z-10 max-w-3xl">
                <Heart className="w-10 h-10 text-violet-400 mb-4" fill="rgba(139,92,246,0.3)" />
                <h3 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">
                  Behind every EHCP is a child who deserves to be seen.
                </h3>
                <p className="text-white/60 leading-relaxed text-base">
                  We built Adaptly because we've seen what happens when SENCOs don't have the right tools. Plans get rushed. Provisions get vague. Children with autism, dyslexia, ADHD, and complex needs don't get the specific, legally enforceable support they're entitled to. Adaptly gives educators the time back to focus on what matters — the child in front of them.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PROBLEM → SOLUTION ───────────────────────────────────── */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Before & After Adaptly"
            title="From Overwhelmed to Outstanding"
          />
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { problem: "Spending 6+ hours drafting a single EHCP from scratch", solution: "AI-assisted 5-stage EHCP builder drafts Section F in under 10 minutes", icon: <FileText className="w-4 h-4" /> },
              { problem: "Worksheets that don't account for dyslexia, ADHD or ASC needs", solution: "Every worksheet automatically adapts to the pupil's specific SEND need", icon: <Wand2 className="w-4 h-4" /> },
              { problem: "Generic behaviour plans that don't reflect the individual", solution: "Personalised behaviour support plans with triggers, strategies and review dates", icon: <Brain className="w-4 h-4" /> },
              { problem: "Parent letters written from scratch every week", solution: "AI-generated newsletters, reports and communications in seconds", icon: <Newspaper className="w-4 h-4" /> },
              { problem: "No audit trail for SEND decisions and interventions", solution: "Full history, analytics and exportable records for every pupil", icon: <BarChart3 className="w-4 h-4" /> },
              { problem: "EHCP provisions that are vague and legally unenforceable", solution: "Golden thread QA checks every provision against the SEND Code of Practice", icon: <Scale className="w-4 h-4" /> },
              { problem: "Scheduling meetings, reviews and interventions across diaries is chaos", solution: "Built-in Scheduler syncs staff, pupil and parent availability in one place", icon: <CalendarClock className="w-4 h-4" /> },
              { problem: "Parents feel out of the loop — no visibility of their child's progress", solution: "Parent Portal gives families real-time access to work, progress and communications", icon: <Users className="w-4 h-4" /> },
              { problem: "Pupils fall behind because adapted work takes hours to prepare", solution: "Daily adaptive work delivered automatically to each pupil, adjusted to their need", icon: <Rocket className="w-4 h-4" /> },
            ].map((row, i) => (
              <ProblemRow key={i} {...row} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 relative overflow-hidden">
        <GlowOrb x="10%" y="50%" color="rgba(99,102,241,0.08)" size={600} />
        <GlowOrb x="90%" y="50%" color="rgba(168,85,247,0.08)" size={600} />
        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeading
            eyebrow="Specialist Tools"
            title="Everything a School Needs, in One Platform"
            subtitle="From EHCP drafting to daily adaptive work delivery, every tool is purpose-built for UK schools and aligned with statutory guidance."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[
              { icon: <FileText className="w-5 h-5" />, title: "EHCP Plan Generator", description: "5-stage AI-assisted EHCP builder with golden thread QA, compliance scoring and Word export. Cuts drafting time from 6 hours to under 30 minutes.", accent: "#6366f1" },
              { icon: <Wand2 className="w-5 h-5" />, title: "Worksheet Generator", description: "AI-generated, curriculum-aligned worksheets that automatically adapt for dyslexia, ADHD, ASC and other SEND needs.", accent: "#a855f7" },
              { icon: <Sparkles className="w-5 h-5" />, title: "Differentiate", description: "Upload any existing worksheet and instantly generate scaffolded, adapted versions for different needs and reading levels.", accent: "#ec4899" },
              { icon: <BookOpen className="w-5 h-5" />, title: "Reading & Stories", description: "AI-generated reading passages with comprehension questions, tailored to year group and reading ability.", accent: "#f59e0b" },
              { icon: <Gamepad2 className="w-5 h-5" />, title: "QuizBlast", description: "Live, interactive quizzes that students join on any device. Curriculum-aligned and auto-marked.", accent: "#10b981" },
              { icon: <Volume2 className="w-5 h-5" />, title: "Audio Revision Hub", description: "Text-to-speech revision materials with voice navigation — perfect for pupils who struggle with written text.", accent: "#3b82f6" },
              { icon: <Brain className="w-5 h-5" />, title: "Behaviour Support Plans", description: "Personalised BSPs with trigger identification, de-escalation strategies and review schedules.", accent: "#8b5cf6" },
              { icon: <User className="w-5 h-5" />, title: "Pupil Passport", description: "One-page pupil profiles with photo, SEND needs, communication preferences and key strategies for supply staff.", accent: "#06b6d4" },
              { icon: <Target className="w-5 h-5" />, title: "SMART Targets", description: "Generate legally compliant, measurable SMART targets aligned to EHCP outcomes and national expectations.", accent: "#f97316" },
              { icon: <Heart className="w-5 h-5" />, title: "Wellbeing Support", description: "Wellbeing check-ins, support plans and intervention tracking for pastoral and mental health leads.", accent: "#22c55e" },
              { icon: <Newspaper className="w-5 h-5" />, title: "Parent Newsletter", description: "Professional, inclusive parent communications generated in seconds and uploadable to the parent portal.", accent: "#e879f9" },
              { icon: <BarChart3 className="w-5 h-5" />, title: "Analytics Dashboard", description: "School-wide and pupil-level analytics showing tool usage, SEND trends and intervention effectiveness.", accent: "#6366f1" },
              { icon: <CalendarDays className="w-5 h-5" />, title: "Lesson Planner", description: "Full lesson plans with learning objectives, differentiation strategies and SEND adaptations built in.", accent: "#a855f7" },
              { icon: <Calendar className="w-5 h-5" />, title: "Medium Term Planner", description: "Half-term and unit plans with curriculum progression, assessment points and SEND considerations.", accent: "#ec4899" },
              { icon: <Archive className="w-5 h-5" />, title: "Past Papers", description: "Searchable past paper question bank for GCSE and A-Level with SEND-adapted versions.", accent: "#f59e0b" },
              { icon: <ScanSearch className="w-5 h-5" />, title: "SEND Screener", description: "Evidence-based screening tool to identify potential SEND needs and generate referral documentation.", accent: "#10b981" },
              { icon: <CalendarClock className="w-5 h-5" />, title: "Scheduler", description: "Coordinate EHCP reviews, parent meetings, intervention sessions and staff diaries in one place. Sends automated reminders to all parties.", accent: "#f59e0b" },
              { icon: <Users className="w-5 h-5" />, title: "Parent Portal", description: "A dedicated portal connecting pupils, parents and staff. Parents see their child's work, progress and communications in real time.", accent: "#ec4899" },
              { icon: <TrendingUp className="w-5 h-5" />, title: "Skill Ladder", description: "Visual progression tracker showing each pupil's journey across skills and competencies. Celebrates milestones and flags gaps automatically.", accent: "#6366f1" },
              { icon: <Bot className="w-5 h-5" />, title: "Daily Adaptive Work", description: "AI delivers a personalised daily work pack to every pupil, auto-adjusted to their SEND need and skill level — zero teacher prep required.", accent: "#a855f7" },
            ].map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={Math.min(i * 0.04, 0.4)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ──────────────────────────────────────────── */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Who Uses Adaptly"
            title="Built for Everyone in the School"
          />
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                role: "SENCOs",
                icon: <GraduationCap className="w-9 h-9 text-violet-300" />,
                color: "from-violet-600/20 to-violet-600/5",
                border: "border-violet-500/20",
                points: [
                  "Draft EHCPs in a fraction of the time",
                  "Legally compliant provisions every time",
                  "Full audit trail for Ofsted",
                  "SEND screener for early identification",
                  "Pupil passports for every child",
                ],
              },
              {
                role: "Classroom Teachers",
                icon: <BookMarked className="w-9 h-9 text-indigo-300" />,
                color: "from-indigo-600/20 to-indigo-600/5",
                border: "border-indigo-500/20",
                points: [
                  "Differentiated worksheets in seconds",
                  "Lesson plans with built-in SEND adaptations",
                  "Behaviour support strategies on demand",
                  "Exit tickets and formative assessment tools",
                  "Report comments generator",
                ],
              },
              {
                role: "School Leaders",
                icon: <Building2 className="w-9 h-9 text-pink-300" />,
                color: "from-pink-600/20 to-pink-600/5",
                border: "border-pink-500/20",
                points: [
                  "School-wide analytics and SEND data",
                  "Parent communications at scale",
                  "Compliance and governance tools",
                  "Staff time savings across the school",
                  "Investor-grade reporting",
                ],
              },
            ].map((persona, i) => (
              <Reveal key={persona.role} delay={i * 0.12}>
                <div className={`h-full p-7 rounded-2xl bg-gradient-to-b ${persona.color} border ${persona.border}`}>
                  <div className="mb-4">{persona.icon}</div>
                  <h3 className="text-xl font-black text-white mb-5">{persona.role}</h3>
                  <ul className="space-y-3">
                    {persona.points.map(point => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-white/65">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARENT PORTAL HIGHLIGHT ───────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <GlowOrb x="80%" y="40%" color="rgba(236,72,153,0.10)" size={600} />
        <div className="max-w-6xl mx-auto relative z-10">
          <SectionHeading
            eyebrow="Connected Community"
            title={<>One Platform. <span className="text-pink-400">Three Voices.</span></>}
            subtitle="Adaptly is the only SEND platform that genuinely connects pupils, parents and staff in a single, secure space — so everyone is always on the same page."
          />
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: <School className="w-9 h-9 text-indigo-300" />,
                title: "Staff",
                color: "from-indigo-600/20 to-indigo-600/5",
                border: "border-indigo-500/25",
                points: [
                  "Create and assign work from any tool in seconds",
                  "View every pupil's progress and completion in real time",
                  "Send updates, reports and newsletters directly to parents",
                  "Schedule meetings and reviews with automated reminders",
                  "Flag concerns and escalate to the SENCO in one click",
                ],
              },
              {
                icon: <Star className="w-9 h-9 text-violet-300" />,
                title: "Pupils",
                color: "from-violet-600/20 to-violet-600/5",
                border: "border-violet-500/25",
                points: [
                  "Receive daily work packs tailored to their exact needs",
                  "Complete work in an accessible, distraction-free interface",
                  "See their own Skill Ladder and celebrate progress",
                  "Listen to instructions read aloud with text-to-speech",
                  "Submit work and get instant AI feedback",
                ],
              },
              {
                icon: <Users className="w-9 h-9 text-pink-300" />,
                title: "Parents",
                color: "from-pink-600/20 to-pink-600/5",
                border: "border-pink-500/25",
                points: [
                  "See their child's daily work and completed tasks",
                  "Receive newsletters and progress updates instantly",
                  "View the Skill Ladder and track progression over time",
                  "Attend virtual EHCP review meetings via the portal",
                  "Message staff directly — no lost letters or missed calls",
                ],
              },
            ].map((persona, i) => (
              <Reveal key={persona.title} delay={i * 0.12}>
                <div className={`h-full p-7 rounded-2xl bg-gradient-to-b ${persona.color} border ${persona.border}`}>
                  <div className="mb-4">{persona.icon}</div>
                  <h3 className="text-xl font-black text-white mb-5">{persona.title}</h3>
                  <ul className="space-y-3">
                    {persona.points.map(point => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-white/65">
                        <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div
              className="relative p-8 md:p-10 rounded-3xl border border-pink-500/20 overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.10) 0%, rgba(168,85,247,0.07) 100%)" }}
            >
              <GlowOrb x="90%" y="20%" color="rgba(236,72,153,0.15)" size={350} />
              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] uppercase text-pink-400 mb-3">Parent Portal</p>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">
                    Parents who are informed are parents who are engaged.
                  </h3>
                  <p className="text-white/55 leading-relaxed text-sm">
                    Research consistently shows that parental engagement is one of the strongest predictors of pupil outcomes — especially for children with SEND. Adaptly's Parent Portal removes every barrier: no apps to download, no logins to forget, no letters that never make it home. Parents get a clear, accessible window into their child's education, and staff spend less time chasing responses.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Bell className="w-5 h-5" />, label: "Instant notifications", sub: "when new work or updates are posted" },
                    { icon: <TrendingUp className="w-5 h-5" />, label: "Progress at a glance", sub: "Skill Ladder visible to parents in real time" },
                    { icon: <MessageCircle className="w-5 h-5" />, label: "Direct messaging", sub: "secure staff-parent communication" },
                    { icon: <CalendarClock className="w-5 h-5" />, label: "Meeting scheduler", sub: "book EHCP reviews without phone tag" },
                  ].map(item => (
                    <div key={item.label} className="p-4 rounded-2xl bg-white/[0.05] border border-white/10">
                      <div className="mb-2 text-pink-300">{item.icon}</div>
                      <p className="text-sm font-bold text-white mb-0.5">{item.label}</p>
                      <p className="text-xs text-white/40">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SKILL LADDER & AUTO-MARKING ──────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <GlowOrb x="20%" y="50%" color="rgba(99,102,241,0.10)" size={600} />
        <div className="max-w-6xl mx-auto relative z-10">
          <SectionHeading
            eyebrow="Progression & Assessment"
            title={<>From <span className="text-indigo-400">Zero Prep</span> to Outstanding Outcomes</>}
            subtitle="Adaptly's adaptive engine handles the heavy lifting — so teachers can focus on teaching, and every pupil gets exactly what they need, every single day."
          />

          {/* Skill Ladder */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
            <Reveal direction="left">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-400 mb-3">Skill Ladder</p>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">
                  Every pupil has a ladder. Adaptly shows them climbing it.
                </h3>
                <p className="text-white/55 leading-relaxed text-sm mb-6">
                  The Skill Ladder maps each pupil's progress across curriculum areas and SEND-specific competencies. It's not just a progress tracker — it's a motivational tool. Pupils see their own rungs. Parents see the climb. Teachers see the gaps. SENCOs see the evidence trail for EHCP reviews.
                </p>
                <ul className="space-y-3">
                  {[
                    "Automatically updates as pupils complete and pass work",
                    "Colour-coded by confidence level (emerging, developing, secure)",
                    "Shared with parents and visible in the Parent Portal",
                    "Feeds directly into EHCP outcome reviews and SMART targets",
                    "Celebrates milestones with visible achievements",
                  ].map(point => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-white/65">
                      <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal direction="right" delay={0.1}>
              <div className="p-6 rounded-2xl bg-white/[0.04] border border-indigo-500/20 space-y-3">
                <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-4">Skill Ladder — Year 7 · Mia T.</p>
                {[
                  { skill: "Phonics & Decoding", level: 100, status: "Secure", color: "bg-emerald-500" },
                  { skill: "Reading Comprehension", level: 78, status: "Developing", color: "bg-indigo-500" },
                  { skill: "Written Expression", level: 55, status: "Developing", color: "bg-violet-500" },
                  { skill: "Number & Place Value", level: 90, status: "Secure", color: "bg-emerald-500" },
                  { skill: "Problem Solving", level: 40, status: "Emerging", color: "bg-amber-500" },
                  { skill: "Social Communication", level: 65, status: "Developing", color: "bg-blue-500" },
                ].map((item, i) => (
                  <div key={item.skill}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-white/70">{item.skill}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === "Secure" ? "bg-emerald-500/20 text-emerald-300" :
                        item.status === "Developing" ? "bg-indigo-500/20 text-indigo-300" :
                        "bg-amber-500/20 text-amber-300"
                      }`}>{item.status}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${item.color}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Auto-marking + Daily Adaptive Work */}
          <div className="grid md:grid-cols-2 gap-6">
            <Reveal direction="left" delay={0.05}>
              <div
                className="h-full p-7 rounded-2xl border border-violet-500/20 overflow-hidden relative"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.06) 100%)" }}
              >
                <CheckCircle2 className="w-10 h-10 text-violet-400 mb-4" />
                <h3 className="text-xl font-black text-white mb-3">Auto-Marking</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-5">
                  Every piece of work submitted through Adaptly is automatically marked by the AI. Teachers receive a summary — not a pile of marking. Pupils get instant, constructive feedback tailored to their communication style and SEND need. No red pen. No waiting until Friday.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Instant feedback on submission — pupils don't wait days",
                    "Feedback tone adapts to the pupil's SEND profile (e.g. literal for ASC)",
                    "Teachers see class-wide results in a single dashboard view",
                    "Misconceptions flagged automatically for teacher follow-up",
                    "All marks feed into the Skill Ladder and analytics",
                  ].map(point => (
                    <li key={point} className="flex items-start gap-2.5 text-xs text-white/60">
                      <span className="text-violet-400 mt-0.5 flex-shrink-0">✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal direction="right" delay={0.1}>
              <div
                className="h-full p-7 rounded-2xl border border-pink-500/20 overflow-hidden relative"
                style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(168,85,247,0.06) 100%)" }}
              >
                <Bot className="w-10 h-10 text-pink-400 mb-4" />
                <h3 className="text-xl font-black text-white mb-3">Daily Adaptive Work Delivery</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-5">
                  Every morning, Adaptly's AI engine assembles a personalised work pack for each pupil — based on their SEND need, current Skill Ladder position, and what they struggled with yesterday. It lands in their portal before school starts. Teachers do nothing. Pupils always have something appropriate to work on.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Zero teacher prep — fully automated daily generation",
                    "Adapts difficulty based on yesterday's performance",
                    "Adjusts format for SEND need (larger text, audio, chunked tasks)",
                    "Covers literacy, numeracy and subject-specific content",
                    "Parents can see the daily pack in the Parent Portal",
                  ].map(point => (
                    <li key={point} className="flex items-start gap-2.5 text-xs text-white/60">
                      <span className="text-pink-400 mt-0.5 flex-shrink-0">✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-4 relative overflow-hidden">
        <GlowOrb x="50%" y="50%" color="rgba(168,85,247,0.07)" size={800} />
        <div className="max-w-6xl mx-auto relative z-10">
          <SectionHeading
            eyebrow="What Schools Say"
            title="Trusted by SENCOs Across the UK"
          />
          <div className="grid md:grid-cols-3 gap-5">
            <TestimonialCard
              quote="I used to spend my Sunday evenings writing EHCP sections. Adaptly does the first draft in 10 minutes and the quality is better than anything I was producing by hand. It's genuinely changed my job."
              name="Sarah Mitchell"
              role="SENCO"
              school="Northfield Academy, Birmingham"
              delay={0}
            />
            <TestimonialCard
              quote="The worksheet differentiation tool alone is worth the subscription. I teach a class of 30 with 8 different SEND needs. Adaptly means every child gets something appropriate without me working until midnight."
              name="James Okafor"
              role="Year 9 English Teacher"
              school="Greenfield Secondary, Manchester"
              delay={0.1}
            />
            <TestimonialCard
              quote="Our Ofsted inspector specifically commented on the quality of our EHCP provisions. The golden thread QA in Adaptly caught three vague provisions that would have been flagged. It's like having a compliance expert on staff."
              name="Dr. Priya Sharma"
              role="Assistant Headteacher (Inclusion)"
              school="Riverside Community School, Leeds"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ── SEND SCREENER SHOWCASE ─────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <GlowOrb x="60%" y="30%" color="rgba(99,102,241,0.10)" size={700} />
        <div className="max-w-6xl mx-auto relative z-10">
          <SectionHeading
            eyebrow="SEND Screener"
            title={<>Spot the Signs. <span className="text-indigo-400">Start the Conversation.</span></>}
            subtitle="One of the hardest parts of a SENCO's job is identifying need early — before a child falls too far behind. The Adaptly SEND Screener gives you structured, evidence-based data to start that conversation with confidence."
          />

          {/* The diagnosis problem */}
          <Reveal>
            <div
              className="relative p-8 md:p-10 rounded-3xl border border-amber-500/20 mb-12 overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(239,68,68,0.06) 100%)" }}
            >
              <GlowOrb x="90%" y="50%" color="rgba(245,158,11,0.12)" size={400} />
              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-start">
                <div>
                  <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-400 mb-3">The Identification Problem</p>
                  <h3 className="text-2xl font-black text-white mb-4 leading-tight">
                    SENCOs are expected to identify need — but they're not clinicians.
                  </h3>
                  <p className="text-white/55 text-sm leading-relaxed mb-4">
                    The average SENCO manages 50–200 pupils on the SEND register, often without access to an educational psychologist for months or years. Referral waiting lists for ADHD, autism and dyslexia assessments can stretch to 3–5 years on the NHS. In the meantime, children are in classrooms without the support they need — and teachers don't know why they're struggling.
                  </p>
                  <p className="text-white/55 text-sm leading-relaxed">
                    The Adaptly SEND Screener doesn't replace clinical assessment. It gives SENCOs structured, observable evidence to act on now — to apply the graduated approach, put early support in place, and build the case for referral when needed.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    { stat: "3–5 years", label: "average NHS wait for autism/ADHD assessment", icon: <Timer className="w-5 h-5" />, color: "text-red-400" },
                    { stat: "50–200", label: "pupils a typical SENCO manages alone", icon: <User className="w-5 h-5" />, color: "text-amber-400" },
                    { stat: "40%", label: "of SEND pupils identified late (after age 7)", icon: <TrendingDown className="w-5 h-5" />, color: "text-orange-400" },
                    { stat: "Day 1", label: "Adaptly screener results available immediately", icon: <CheckCircle2 className="w-5 h-5" />, color: "text-emerald-400" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                      <span className={item.color}>{item.icon}</span>
                      <div>
                        <span className={`text-xl font-black ${item.color}`}>{item.stat}</span>
                        <p className="text-xs text-white/45 mt-0.5">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Mock screener result */}
          <div className="grid md:grid-cols-2 gap-8 items-start mb-10">
            <Reveal direction="left">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-400 mb-3">How It Works</p>
                <h3 className="text-2xl font-black text-white mb-4 leading-tight">
                  Structured observations. Actionable results.
                </h3>
                <p className="text-white/55 text-sm leading-relaxed mb-5">
                  The screener takes a teacher or SENCO through a structured set of evidence-based observation questions across six domains. It takes around 10 minutes per pupil. The output is a colour-coded profile with a written summary, suggested next steps, and a referral-ready report — not a diagnosis, but a clear, professional starting point.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Six domains: attention, communication, literacy, numeracy, social-emotional, sensory",
                    "Weighted scoring based on frequency and impact of observed behaviours",
                    "Generates a written summary suitable for inclusion in referral letters",
                    "Suggests specific interventions matched to the profile",
                    "Stores results in the pupil's record for review and comparison over time",
                    "Can be completed by class teacher, TA or SENCO",
                  ].map(point => (
                    <li key={point} className="flex items-start gap-2.5 text-xs text-white/60">
                      <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Mock result card */}
            <Reveal direction="right" delay={0.1}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 mb-0.5">SEND Screener Result</p>
                    <p className="text-sm font-black text-white">Jamie K. · Year 5 · Age 9</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                    <span className="text-xs font-bold text-amber-300">Elevated Indicators</span>
                  </div>
                </div>

                {/* Domain bars */}
                <div className="px-5 py-4 space-y-3 border-b border-white/[0.08]">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-3">Domain Profile</p>
                  {[
                    { domain: "Attention & Concentration", score: 82, flag: true, color: "bg-red-500" },
                    { domain: "Communication & Language", score: 58, flag: true, color: "bg-amber-500" },
                    { domain: "Literacy & Reading", score: 71, flag: true, color: "bg-amber-500" },
                    { domain: "Numeracy & Reasoning", score: 35, flag: false, color: "bg-emerald-500" },
                    { domain: "Social & Emotional", score: 64, flag: true, color: "bg-amber-500" },
                    { domain: "Sensory Processing", score: 28, flag: false, color: "bg-emerald-500" },
                  ].map((item, i) => (
                    <div key={item.domain}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-white/65">{item.domain}</span>
                        <div className="flex items-center gap-1.5">
                          {item.flag && <span className="text-[9px] font-bold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded-full">⚑ Flag</span>}
                          <span className="text-xs font-bold text-white/50">{item.score}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${item.color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.score}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="px-5 py-4 border-b border-white/[0.08]">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-2">AI Summary</p>
                  <p className="text-xs text-white/55 leading-relaxed">
                    Jamie shows elevated indicators across attention, communication and literacy domains. The pattern of scores is consistent with profiles associated with ADHD (inattentive presentation) and/or specific learning difficulties. These observations do not constitute a diagnosis. It is recommended that the SENCO initiates a graduated approach review and considers referral for formal assessment.
                  </p>
                </div>

                {/* Next steps */}
                <div className="px-5 py-4">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-2">Suggested Next Steps</p>
                  <ul className="space-y-1.5">
                    {[
                      "Initiate Assess-Plan-Do-Review cycle",
                      "Apply attention and focus classroom strategies",
                      "Consider referral to EP or CAMHS",
                      "Notify parents and invite to review meeting",
                    ].map(step => (
                      <li key={step} className="flex items-center gap-2 text-xs text-white/55">
                        <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Important disclaimer */}
          <Reveal>
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-blue-950/30 border border-blue-500/25">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-300 mb-1">Important: The SEND Screener is not a diagnostic tool.</p>
                <p className="text-xs text-white/50 leading-relaxed">
                  Adaptly's SEND Screener is an evidence-based observation and identification tool designed to support the graduated approach under the SEND Code of Practice 2015. It does not provide, imply or substitute a clinical diagnosis of any condition, including but not limited to ADHD, autism spectrum condition, dyslexia, dyspraxia or any other neurodevelopmental or learning difference. All screener results should be interpreted by a qualified professional in the context of wider evidence. Formal diagnosis must be carried out by a qualified clinician. Adaptly Ltd accepts no liability for decisions made solely on the basis of screener outputs.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── COMPLIANCE & LEGAL ───────────────────────────────────── */}
      <section id="compliance" className="py-24 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            eyebrow="Legal & Compliance"
            title={<>Built on a <span className="text-emerald-400">Foundation of Trust</span></>}
            subtitle="Every feature in Adaptly is designed with UK law, GDPR, and statutory SEND guidance at its core. This isn't a bolt-on — it's built in from day one."
          />

          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {[
              { icon: <Lock className="w-5 h-5" />, title: "GDPR Compliant (UK & EU)", body: "All data is processed under a lawful basis. Schools sign a Data Processing Agreement (DPA). No pupil data is used for AI training. Data is stored on UK/EU servers only. Full right-to-erasure support." },
              { icon: <Scale className="w-5 h-5" />, title: "SEND Code of Practice 2015", body: "Every EHCP tool is built around the statutory guidance. Section F provisions are checked for specificity and enforceability. The golden thread QA system flags vague language before export." },
              { icon: <Users className="w-5 h-5" />, title: "Children and Families Act 2014", body: "All tools respect the legal framework for SEND support, including the graduated approach (Assess, Plan, Do, Review) and the requirement for co-production with families." },
              { icon: <ShieldCheck className="w-5 h-5" />, title: "Equality Act 2010", body: "Adaptly helps schools meet their Public Sector Equality Duty by providing tools that support pupils with protected characteristics, including disability and special educational needs." },
              { icon: <Database className="w-5 h-5" />, title: "Data Minimisation & Retention", body: "We only collect data necessary for the service. Schools control their own data. Pupil data is automatically anonymised after the school's configured retention period." },
              { icon: <Shield className="w-5 h-5" />, title: "AI Governance & Transparency", body: "All AI outputs are clearly labelled as AI-generated. Teachers remain in full control. No automated decisions are made about pupils. AI is a drafting assistant, not a decision-maker." },
            ].map((item, i) => (
              <ComplianceBadge key={item.title} {...item} delay={i * 0.08} />
            ))}
          </div>

          <Reveal>
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center">
              <p className="text-xs text-white/35 leading-relaxed max-w-3xl mx-auto">
                Adaptly Ltd is registered in England &amp; Wales. Our Data Protection Officer is contactable at dpo@adaptly.co.uk. We maintain a Record of Processing Activities (ROPA) and conduct Data Protection Impact Assessments (DPIAs) for all high-risk processing. Our AI systems are reviewed quarterly against the ICO's AI and data protection guidance.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── INVESTOR SECTION ──────────────────────────────────────── */}
      <section id="investors" className="py-24 px-4 relative overflow-hidden">
        <GlowOrb x="50%" y="30%" color="rgba(99,102,241,0.10)" size={700} />
        <div className="max-w-6xl mx-auto relative z-10">
          <SectionHeading
            eyebrow="Investor Overview"
            title={<>A <span className="text-indigo-400">£2.4B Market</span> with a Clear Lead</>}
            subtitle="The UK EdTech market is growing at 12% CAGR. The SEND support software segment is underserved, under-digitised, and legally mandated. Adaptly is the category leader."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { value: "£2.4B", label: "UK EdTech market size (2025)", icon: <TrendingUp className="w-6 h-6" /> },
              { value: "24,000+", label: "state schools in England (TAM)", icon: <Building2 className="w-6 h-6" /> },
              { value: "12%", label: "market CAGR through 2030", icon: <BarChart3 className="w-6 h-6" /> },
              { value: "95%", label: "of users report reduced workload", icon: <Layers className="w-6 h-6" /> },
            ].map((m, i) => <InvestorMetric key={m.label} {...m} delay={i * 0.1} />)}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <Reveal direction="left">
              <div className="h-full p-7 rounded-2xl bg-white/[0.04] border border-white/10">
                <h3 className="text-lg font-black text-white mb-5">Why Now</h3>
                <ul className="space-y-3">
                  {[
                    "SEND demand is at an all-time high — 1.6M pupils, up 4% YoY",
                    "Ofsted's new framework places SEND quality at the centre of inspection",
                    "The SEND Review (2023) mandates digital-first EHCP processes",
                    "AI capability has finally reached the quality threshold for professional use",
                    "Schools are under unprecedented budget pressure — efficiency tools are essential",
                  ].map(point => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-white/60">
                      <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal direction="right">
              <div className="h-full p-7 rounded-2xl bg-white/[0.04] border border-white/10">
                <h3 className="text-lg font-black text-white mb-5">Competitive Moat</h3>
                <ul className="space-y-3">
                  {[
                    "Only platform with EHCP golden thread QA and compliance scoring",
                    "24 integrated tools vs. single-point competitors",
                    "Deep SEND expertise baked into every AI prompt and output",
                    "UK-specific legal framework alignment (not a US product adapted for UK)",
                    "Network effects: school data improves recommendations across the platform",
                  ].map(point => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-white/60">
                      <span className="text-violet-400 mt-0.5 flex-shrink-0">→</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div
              className="p-7 rounded-2xl border border-indigo-500/20"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)" }}
            >
              <div className="grid md:grid-cols-3 gap-6 text-center">
                {[
                  { label: "Revenue Model", value: "SaaS per-school subscription", sub: "£1,200–£4,800/yr per school" },
                  { label: "Tools Available", value: "24 specialist", sub: "EHCP, worksheets, behaviour & more" },
                  { label: "Target (3yr)", value: "5,000 schools", sub: "~20% UK market penetration" },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-white/40 mb-1">{item.label}</p>
                    <p className="text-lg font-black text-white">{item.value}</p>
                    <p className="text-xs text-indigo-300 mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="py-28 px-4 relative overflow-hidden">
        <GlowOrb x="50%" y="50%" color="rgba(99,102,241,0.18)" size={900} />
        <GridLines />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-indigo-400 mb-4">Ready to Start?</p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              Give your SENCO their
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #818cf8, #a855f7, #ec4899)" }}
              >
                Sundays back.
              </span>
            </h2>
            <p className="text-base text-white/50 leading-relaxed mb-10">
              Join schools across the UK already using Adaptly's 24 specialist tools to support their SEND pupils, reduce teacher workload, and stay legally compliant. Free to start, no card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <motion.button
                  className="px-10 py-4 text-base font-black text-white rounded-2xl shadow-2xl shadow-indigo-500/40 w-full sm:w-auto"
                  style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                  whileHover={{ scale: 1.06, boxShadow: "0 0 50px rgba(99,102,241,0.7)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  Get Started Free →
                </motion.button>
              </Link>
              <a href="mailto:hello@adaptly.co.uk">
                <motion.button
                  className="px-8 py-4 text-base font-semibold text-white/70 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors w-full sm:w-auto"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Talk to the Team
                </motion.button>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white">
                  <img src="/logo.png" alt="Adaptly Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-white font-black text-lg">Adaptly</span>
              </div>
              <p className="text-xs text-white/30 max-w-xs leading-relaxed">
                The AI platform for SEND excellence. Built for UK schools, aligned with UK law.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 gap-y-3 text-xs text-white/35">
              <a href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</a>
              <a href="/accessibility" className="hover:text-white/60 transition-colors">Accessibility</a>
              <a href="/ai-governance" className="hover:text-white/60 transition-colors">AI Governance</a>
              <a href="/dpa" className="hover:text-white/60 transition-colors">Data Processing</a>
              <a href="/safeguarding" className="hover:text-white/60 transition-colors">Safeguarding</a>
              <a href="mailto:hello@adaptly.co.uk" className="hover:text-white/60 transition-colors">Contact Us</a>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-white/20">© 2026 Adaptly Ltd. All rights reserved. Registered in England &amp; Wales.</p>
            <p className="text-xs text-white/20 text-center md:text-right">
              SEND Code of Practice 2015 · Children and Families Act 2014 · Equality Act 2010 · UK GDPR
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
