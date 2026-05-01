import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ScanSearch,
  Tag,
  ClipboardCheck,
  Wand2,
  Send,
  Smartphone,
  TrendingUp,
  FileText,
  CheckCircle2,
  Bell,
  ArrowRight,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────────
// Pinned vertical scroll storytelling — one pupil's journey through
// Adaptly across 8 connected steps. Same visual language throughout.
// ──────────────────────────────────────────────────────────────────

const STEPS = [
  { n: "01", t: "Screen learners", d: "Use a quick screener to spot possible learning needs.", icon: ScanSearch },
  { n: "02", t: "Identify support", d: "Turn results into clear, practical support areas.", icon: Tag },
  { n: "03", t: "Plan next steps", d: "Review strategies and choose the right classroom support.", icon: ClipboardCheck },
  { n: "04", t: "Adapt lessons", d: "Generate SEND-aware resources matched to learner needs.", icon: Wand2 },
  { n: "05", t: "Assign and teach", d: "Send the right version to the right learner or class.", icon: Send },
  { n: "06", t: "Keep parents informed", d: "Share progress and updates through the parent portal.", icon: Smartphone },
  { n: "07", t: "Track impact", d: "See how support, interventions and learning progress connect.", icon: TrendingUp },
  { n: "08", t: "Review and report", d: "Build clear records for staff, parents and school teams.", icon: FileText },
];

// Persistent pupil profile card — visible through every step.
function PupilCard({ stage }) {
  const tags = stage >= 1 ? ["Dyslexia", "ADHD"] : stage >= 0 ? ["Pending screen"] : [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute top-4 right-4 z-30 w-[180px] glass rounded-2xl p-3 shadow-[0_15px_40px_-15px_rgba(34,32,30,0.3)]"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-terracotta text-cream-100 font-heading font-bold flex items-center justify-center text-sm">
          JK
        </div>
        <div className="min-w-0">
          <div className="font-heading font-bold text-ink-900 text-sm leading-tight">Jamie K.</div>
          <div className="text-[10px] text-ink-500 uppercase tracking-wider">Year 5 · 9 yrs</div>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1">
        {tags.length === 0 ? (
          <span className="text-[10px] text-ink-500 italic">no profile yet…</span>
        ) : (
          tags.map((t) => (
            <motion.span
              key={t}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-terracotta/15 text-terracotta"
            >
              {t}
            </motion.span>
          ))
        )}
      </div>
      {stage >= 6 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2.5 pt-2.5 border-t border-ink-900/5 flex items-center gap-1.5 text-[10px] text-sage font-semibold"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
          Progress · +18%
        </motion.div>
      )}
    </motion.div>
  );
}

// Each step renders a different mockup inside the same container.
function StepMockup({ step }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 p-7 md:p-9 pt-24 md:pt-28"
      >
        {step === 0 && <Mockup1Screener />}
        {step === 1 && <Mockup2Needs />}
        {step === 2 && <Mockup3Plan />}
        {step === 3 && <Mockup4Adapt />}
        {step === 4 && <Mockup5Assign />}
        {step === 5 && <Mockup6Parent />}
        {step === 6 && <Mockup7Track />}
        {step === 7 && <Mockup8Report />}
      </motion.div>
    </AnimatePresence>
  );
}

function Panel({ children, label }) {
  return (
    <div className="h-full rounded-2xl bg-white border border-ink-900/5 p-5 relative overflow-hidden">
      {label && (
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500 font-semibold mb-3">{label}</div>
      )}
      {children}
    </div>
  );
}

// 1. Screener
function Mockup1Screener() {
  const items = [
    "Reading aloud is hesitant",
    "Difficulty sustaining attention",
    "Letters reverse occasionally",
    "Prefers sensory-friendly seating",
    "Forgets multi-step instructions",
  ];
  return (
    <Panel label="SEND screener · 6 domains">
      <div className="font-heading font-bold text-ink-900 text-lg md:text-xl mb-4">Quick observation form</div>
      <div className="space-y-2.5">
        {items.map((q, i) => (
          <motion.div
            key={q}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.18, duration: 0.4 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-cream-50 border border-ink-900/5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15 + i * 0.18 + 0.25, type: "spring", stiffness: 400, damping: 22 }}
              className="w-5 h-5 rounded-md bg-terracotta text-cream-100 flex items-center justify-center flex-shrink-0 mt-0.5"
            >
              <CheckCircle2 size={11} strokeWidth={3} />
            </motion.div>
            <span className="text-sm text-ink-900">{q}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-[10px] text-ink-500 mb-1">
          <span>Screening progress</span>
          <span>5 / 12</span>
        </div>
        <div className="h-1.5 rounded-full bg-ink-900/10 overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "60%" }}
            transition={{ duration: 1.4, delay: 0.4 }}
            className="h-full bg-gradient-to-r from-terracotta to-honey"
          />
        </div>
      </div>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink-900 text-cream-100 text-xs font-semibold"
      >
        Analyse <ArrowRight size={12} />
      </motion.button>
    </Panel>
  );
}

// 2. Needs identified
function Mockup2Needs() {
  const tags = [
    { l: "Dyslexia support", c: "#D96C4A" },
    { l: "ADHD strategies", c: "#E5B96E" },
    { l: "Reading scaffolds", c: "#7F8C72" },
    { l: "EAL vocabulary help", c: "#22201E" },
  ];
  return (
    <Panel label="Screener results">
      <div className="font-heading font-bold text-ink-900 text-lg md:text-xl mb-2">Identified needs</div>
      <div className="text-sm text-ink-500 mb-5">Three confidence-weighted indicators have been flagged.</div>
      <div className="grid grid-cols-2 gap-3">
        {tags.map((t, i) => (
          <motion.div
            key={t.l}
            initial={{ opacity: 0, scale: 0.7, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.13, type: "spring", stiffness: 220, damping: 20 }}
            className="p-4 rounded-xl border-2 relative overflow-hidden"
            style={{ borderColor: t.c + "40", background: t.c + "08" }}
          >
            <div
              className="absolute -top-4 -right-4 w-12 h-12 rounded-full opacity-20"
              style={{ background: t.c }}
            />
            <div className="relative">
              <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: t.c }}>
                Indicator
              </div>
              <div className="mt-1 font-heading font-bold text-ink-900 text-sm leading-tight">{t.l}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-5 p-3 rounded-xl bg-ink-900/5 text-sm text-ink-700"
      >
        <span className="font-semibold text-ink-900">AI summary · </span>Pattern consistent with profiles
        associated with ADHD (inattentive) and specific learning difficulty.
      </motion.div>
    </Panel>
  );
}

// 3. Plan support
function Mockup3Plan() {
  const strategies = [
    { l: "Chunked instructions", on: true },
    { l: "Visual timetable", on: true },
    { l: "Audio-supported reading", on: true },
    { l: "Reduced-distraction seating", on: true },
    { l: "Coloured overlays", on: false },
  ];
  return (
    <Panel label="Teacher dashboard · plan support">
      <div className="font-heading font-bold text-ink-900 text-lg md:text-xl mb-4">Suggested strategies</div>
      <div className="space-y-2.5">
        {strategies.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="flex items-center justify-between p-3 rounded-xl bg-cream-50 border border-ink-900/5"
          >
            <span className="text-sm text-ink-900">{s.l}</span>
            <motion.div
              initial={{ background: "#E5E0D2" }}
              animate={{ background: s.on ? "#D96C4A" : "#E5E0D2" }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="w-9 h-5 rounded-full p-0.5 relative flex-shrink-0"
            >
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: s.on ? 16 : 0 }}
                transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 500, damping: 25 }}
                className="w-4 h-4 rounded-full bg-cream-50 shadow-sm"
              />
            </motion.div>
          </motion.div>
        ))}
      </div>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink-900 text-cream-100 text-xs font-semibold"
      >
        Create support plan <ArrowRight size={12} />
      </motion.button>
    </Panel>
  );
}

// 4. Adapt lessons
function Mockup4Adapt() {
  return (
    <Panel label="Worksheet · adaptive">
      <div className="font-heading font-bold text-ink-900 text-lg md:text-xl mb-1">Photosynthesis · KS2</div>
      <div className="text-xs text-ink-500 mb-4 flex items-center gap-2">
        Adapting <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}>·</motion.span>
        <span>Dyslexia + ADHD profile applied</span>
      </div>
      <div className="space-y-2 mb-4">
        {[
          { w: "70%", c: "bg-terracotta" },
          { w: "55%", c: "bg-honey" },
          { w: "62%", c: "bg-sage" },
          { w: "40%", c: "bg-ink-900" },
        ].map((b, i) => (
          <motion.div
            key={i}
            initial={{ width: 0 }}
            animate={{ width: b.w }}
            transition={{ delay: 0.2 + i * 0.12, duration: 0.7 }}
            className={`h-3 rounded-full ${b.c}`}
          />
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="grid grid-cols-3 gap-2 mb-4"
      >
        {["Larger font", "Chunked", "Word bank"].map((t, i) => (
          <motion.div
            key={t}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.95 + i * 0.1, type: "spring", stiffness: 300 }}
            className="text-[10px] uppercase tracking-wider font-bold text-center px-2 py-2 rounded-lg bg-terracotta/10 text-terracotta"
          >
            {t}
          </motion.div>
        ))}
      </motion.div>
      <div className="flex flex-wrap gap-1.5">
        {["sunlight", "water", "leaf", "carbon dioxide"].map((w, i) => (
          <motion.span
            key={w}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 + i * 0.08 }}
            className="text-xs px-2 py-1 rounded-full bg-cream-50 border border-ink-900/10 text-ink-900"
          >
            {w}
          </motion.span>
        ))}
      </div>
    </Panel>
  );
}

// 5. Assign and teach
function Mockup5Assign() {
  const versions = [
    { l: "Standard", on: 0.6, c: "#7F8C72" },
    { l: "Scaffolded", on: 1, c: "#D96C4A" },
    { l: "EAL version", on: 0.5, c: "#E5B96E" },
  ];
  return (
    <Panel label="Class · 5B · assignment">
      <div className="font-heading font-bold text-ink-900 text-lg md:text-xl mb-4">Send to learners</div>
      <div className="space-y-2.5 mb-4">
        {versions.map((v, i) => (
          <motion.div
            key={v.l}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.18 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-cream-50 border border-ink-900/5"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: v.c + "20", color: v.c }}>
              <FileText size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-ink-900">{v.l}</div>
              <div className="h-1 rounded-full bg-ink-900/10 mt-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${v.on * 100}%` }}
                  transition={{ delay: 0.4 + i * 0.18, duration: 0.6 }}
                  className="h-full rounded-full"
                  style={{ background: v.c }}
                />
              </div>
            </div>
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.18 }}
              className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-sage/15 text-sage"
            >
              Assigned
            </motion.span>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="text-xs text-ink-500"
      >
        <span className="font-semibold text-ink-900">28 pupils · </span>each receives the version matched to their profile.
      </motion.div>
    </Panel>
  );
}

// 6. Parent portal — flying card → phone
function Mockup6Parent() {
  return (
    <Panel label="School-home · parent portal">
      <div className="grid grid-cols-[1fr_auto_180px] gap-4 items-center h-full">
        <div className="relative">
          <div className="font-heading font-bold text-ink-900 text-base md:text-lg leading-tight mb-3">
            Update · Reading +18%
          </div>
          <div className="h-2 rounded-full bg-ink-900/10 mb-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "78%" }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-terracotta"
            />
          </div>
          <div className="text-[10px] text-ink-500">Teacher composed · 3:12 pm</div>
        </div>

        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 30, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-10 h-10 rounded-xl bg-terracotta text-cream-100 flex items-center justify-center"
        >
          <Bell size={16} />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-[1.4rem] bg-ink-900 p-1.5"
        >
          <div className="rounded-[1.1rem] bg-cream-50 overflow-hidden">
            <div className="h-3 bg-ink-900 flex items-center justify-center">
              <div className="w-10 h-0.5 rounded-full bg-cream-100/30" />
            </div>
            <div className="p-3">
              <div className="text-[8px] uppercase tracking-wider text-ink-500 font-semibold">Adaptly · now</div>
              <div className="font-heading font-bold text-xs text-ink-900 leading-tight mt-1">
                Jamie · Reading
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="mt-2.5 p-2 rounded-lg bg-terracotta/10"
              >
                <div className="font-heading font-bold text-base text-ink-900 leading-none">+18%</div>
                <div className="h-1 rounded-full bg-ink-900/10 mt-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "78%" }}
                    transition={{ delay: 2, duration: 0.7 }}
                    className="h-full rounded-full bg-terracotta"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </Panel>
  );
}

// 7. Track impact
function Mockup7Track() {
  const points = [10, 22, 18, 36, 32, 48, 42, 58, 52, 68, 64, 80];
  const w = 360;
  const h = 130;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - (p / 100) * h;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");
  return (
    <Panel label="Progress · 6-week intervention">
      <div className="font-heading font-bold text-ink-900 text-lg md:text-xl mb-3">Intervention impact</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 mb-3">
        <defs>
          <linearGradient id="prog-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#D96C4A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D96C4A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={path + ` L${w},${h} L0,${h} Z`}
          fill="url(#prog-grad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke="#D96C4A"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.7, ease: "easeOut" }}
        />
      </svg>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { l: "Reading age", v: "+8 mo" },
          { l: "On-task time", v: "+24%" },
          { l: "Confidence", v: "▲ ▲" },
        ].map((m, i) => (
          <motion.div
            key={m.l}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + i * 0.12 }}
            className="p-3 rounded-xl bg-cream-50 border border-ink-900/5 text-center"
          >
            <div className="font-display text-2xl text-terracotta leading-none">{m.v}</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-500 mt-1">{m.l}</div>
          </motion.div>
        ))}
      </div>
    </Panel>
  );
}

// 8. Review and report — assembling document
function Mockup8Report() {
  const sections = [
    "Pupil profile",
    "Identified needs",
    "Strategies applied",
    "Intervention notes",
    "Parent communication",
    "Progress summary",
  ];
  return (
    <Panel label="Annual review · auto-assembled">
      <div className="font-heading font-bold text-ink-900 text-lg md:text-xl mb-3">Support record · Y5</div>
      <div className="space-y-2 mb-4">
        {sections.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.13 }}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-cream-50 border border-ink-900/5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15 + i * 0.13 + 0.25 }}
              className="w-5 h-5 rounded-full bg-sage text-cream-100 flex items-center justify-center"
            >
              <CheckCircle2 size={11} strokeWidth={3} />
            </motion.div>
            <div className="text-sm text-ink-900 flex-1">{s}</div>
            <div className="text-[10px] text-ink-500">12 lines</div>
          </motion.div>
        ))}
      </div>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta text-cream-100 text-xs font-semibold"
      >
        Export .docx <ArrowRight size={12} />
      </motion.button>
    </Panel>
  );
}

export default function Process() {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      const i = Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)));
      setActive(i);
    });
    return () => unsub();
  }, [scrollYProgress]);

  const lineScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // ── Mobile (≤1024px) — stacked cards, no pinning ─────────────
  if (!isDesktop) {
    return (
      <section id="process" data-testid="process-section" className="relative py-24 px-6 bg-gradient-to-b from-cream-100 via-cream-50 to-cream-100">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">How it works</div>
            <h2 className="mt-3 font-heading text-ink-900 text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95]">
              From a quick screen{" "}
              <span className="font-display italic font-normal">to a finished review.</span>
            </h2>
            <p className="mt-4 text-ink-500 text-base leading-relaxed">
              One pupil. Eight connected steps. Adaptly walks each child through screening, support and progress —
              evidencing every decision along the way.
            </p>
          </div>
          <div className="space-y-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.6 }}
                  className="rounded-3xl bg-cream-50 border border-ink-900/5 p-6 relative overflow-hidden"
                  data-testid={`process-step-${i}`}
                >
                  <div className="absolute -top-6 -right-3 font-display text-[8rem] leading-none text-terracotta/10 select-none">
                    {s.n}
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-terracotta/15 text-terracotta flex items-center justify-center">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-terracotta font-semibold">Step {s.n}</div>
                        <div className="font-heading font-bold text-ink-900 text-xl leading-tight">{s.t}</div>
                      </div>
                    </div>
                    <div className="text-sm text-ink-500 leading-relaxed">{s.d}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── Desktop — pinned scroll storytelling ─────────────────────
  return (
    <section
      ref={ref}
      id="process"
      data-testid="process-section"
      className="relative bg-gradient-to-b from-cream-100 via-cream-50 to-cream-100"
      style={{ height: `${STEPS.length * 80}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Decorative glows */}
        <div className="absolute top-1/3 -left-32 w-[460px] h-[460px] rounded-full bg-terracotta/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-[460px] h-[460px] rounded-full bg-honey/15 blur-[120px] pointer-events-none" />

        <div className="relative h-full max-w-7xl mx-auto px-12 grid grid-cols-12 gap-10 items-center">
          {/* Left — text column */}
          <div className="col-span-5 relative">
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">How it works</div>
            <h2 className="mt-3 font-heading text-ink-900 text-4xl xl:text-5xl font-bold tracking-tight leading-[0.95]">
              One pupil's journey{" "}
              <span className="font-display italic font-normal">through the system.</span>
            </h2>

            <div className="mt-10 relative h-[260px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <div className="font-display text-7xl xl:text-8xl text-terracotta leading-none">
                    {STEPS[active].n}
                  </div>
                  <div className="mt-5 font-heading font-bold text-ink-900 text-2xl xl:text-3xl tracking-tight leading-tight">
                    {STEPS[active].t}
                  </div>
                  <div className="mt-3 text-ink-500 text-base xl:text-lg leading-relaxed max-w-md">
                    {STEPS[active].d}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step dots / labels */}
            <div className="mt-6 space-y-1.5">
              {STEPS.map((s, i) => (
                <motion.button
                  key={s.n}
                  onClick={() => {
                    if (ref.current) {
                      const rect = ref.current.getBoundingClientRect();
                      const target = window.scrollY + rect.top + (ref.current.offsetHeight * (i + 0.5)) / STEPS.length;
                      window.scrollTo({ top: target, behavior: "smooth" });
                    }
                  }}
                  className="flex items-center gap-3 text-left group w-full"
                  data-testid={`process-dot-${i}`}
                >
                  <span
                    className={`w-1.5 rounded-full transition-all duration-500 ${
                      i === active
                        ? "h-6 bg-terracotta"
                        : i < active
                        ? "h-1.5 bg-ink-900/40"
                        : "h-1.5 bg-ink-900/15"
                    }`}
                  />
                  <span
                    className={`text-xs transition-all ${
                      i === active
                        ? "font-bold text-ink-900"
                        : i < active
                        ? "text-ink-500 line-through"
                        : "text-ink-300"
                    }`}
                  >
                    {s.n} · {s.t}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right — sticky mockup container */}
          <div className="col-span-7 relative h-[68vh]">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cream-50 to-cream-200/60 border border-ink-900/5 shadow-[0_40px_90px_-30px_rgba(34,32,30,0.3)] overflow-hidden">
              {/* Window chrome */}
              <div className="absolute top-0 inset-x-0 px-5 pt-5 flex items-center gap-2 z-20">
                <span className="w-2 h-2 rounded-full bg-terracotta" />
                <span className="w-2 h-2 rounded-full bg-honey" />
                <span className="w-2 h-2 rounded-full bg-sage" />
                <div className="ml-auto text-[10px] uppercase tracking-[0.2em] text-ink-500">
                  Adaptly · {STEPS[active].t}
                </div>
              </div>
              <PupilCard stage={active} />
              <StepMockup step={active} />
            </div>
          </div>
        </div>

        {/* Bottom progress bar */}
        <div className="absolute bottom-6 left-12 right-12">
          <div className="h-px bg-ink-900/10 relative overflow-hidden">
            <motion.div
              style={{ scaleX: lineScaleX }}
              className="absolute inset-y-0 left-0 right-0 bg-terracotta origin-left"
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[0.25em] text-ink-500">
            <span>Screen</span>
            <span>Identify</span>
            <span>Plan</span>
            <span>Adapt</span>
            <span>Assign</span>
            <span>Share</span>
            <span>Track</span>
            <span>Report</span>
          </div>
        </div>
      </div>
    </section>
  );
}
