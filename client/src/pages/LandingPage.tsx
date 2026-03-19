import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useInView, useAnimation, AnimatePresence } from "framer-motion";

// ── Animated counter ─────────────────────────────────────────────
function AnimatedNumber({ target, suffix = "", prefix = "", duration = 2000 }: {
  target: number; suffix?: string; prefix?: string; duration?: number;
}) {
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

// ── Feature card ─────────────────────────────────────────────────
function FeatureCard({ icon, title, description, color, delay = 0 }: {
  icon: string; title: string; description: string; color: string; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className={`relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all group cursor-default`}
    >
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ── Testimonial ──────────────────────────────────────────────────
function TestimonialCard({ quote, name, role, school, delay = 0 }: {
  quote: string; name: string; role: string; school: string; delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
    >
      <div className="flex gap-1 text-amber-400 text-sm">{"★★★★★"}</div>
      <p className="text-white/80 text-sm leading-relaxed italic">"{quote}"</p>
      <div className="mt-auto">
        <p className="text-white font-semibold text-sm">{name}</p>
        <p className="text-white/50 text-xs">{role} · {school}</p>
      </div>
    </motion.div>
  );
}

// ── Stat card ────────────────────────────────────────────────────
function StatCard({ value, label, suffix, prefix, icon }: {
  value: number; label: string; suffix?: string; prefix?: string; icon: string;
}) {
  return (
    <div className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-4xl font-black text-white mb-1">
        <AnimatedNumber target={value} suffix={suffix} prefix={prefix} />
      </div>
      <div className="text-sm text-white/50">{label}</div>
    </div>
  );
}

// ── Scrolling feature strip ──────────────────────────────────────
const stripFeatures = [
  "SEND Worksheets", "EHCP Generator", "Pupil Passport", "SMART Targets",
  "SEND Screener", "Social Stories", "Behaviour Plans", "Wellbeing Support",
  "Visual Timetables", "Differentiation", "Past Papers", "Flash Cards",
  "Quiz Builder", "Lesson Planner", "Report Comments", "Parent Newsletter",
];

function FeatureStrip() {
  return (
    <div className="relative overflow-hidden py-4 mask-x">
      <style>{`.mask-x{-webkit-mask-image:linear-gradient(to right,transparent,black 15%,black 85%,transparent)}`}</style>
      <motion.div
        className="flex gap-3 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      >
        {[...stripFeatures, ...stripFeatures].map((f, i) => (
          <span key={i} className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/70 text-sm font-medium whitespace-nowrap">
            {f}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Problem → Solution rows ──────────────────────────────────────
const problems = [
  {
    problem: "A SENCO spends 6+ hours drafting a single EHCP",
    solution: "Adaptly generates a full legally-compliant EHCP draft in under 10 minutes — with golden thread QA built in",
    emoji: "📋",
    stat: "6hrs → 10min",
  },
  {
    problem: "Teachers waste evenings creating differentiated resources",
    solution: "One click produces dyslexia-friendly, scaffolded worksheets at foundation, core and extension level simultaneously",
    emoji: "📄",
    stat: "3 levels, 1 click",
  },
  {
    problem: "1 in 5 pupils has a SEND need — most go unidentified for years",
    solution: "Our evidence-based SEND Screener flags needs early using tools from BDA, WHO, AQ-10 and 6 other validated frameworks",
    emoji: "🔍",
    stat: "8 need areas screened",
  },
  {
    problem: "Supply teachers know nothing about pupils with complex needs",
    solution: "Pupil Passports give every teacher instant, visual context on a pupil — created in 2 minutes by the SENCO",
    emoji: "🪪",
    stat: "2 min to create",
  },
  {
    problem: "Parents feel shut out of the SEND process",
    solution: "The Parent Portal lets families track targets, complete screeners and communicate directly — no app download needed",
    emoji: "👨‍👩‍👧",
    stat: "Real-time updates",
  },
];

// ── Main landing page ─────────────────────────────────────────────
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0b1a] text-white overflow-x-hidden">
      {/* ── NAV ──────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0a0b1a]/90 backdrop-blur-md border-b border-white/10 shadow-lg" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-black text-sm">A</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Adaptly</span>
            <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              SEND & Teaching
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              { href: "#features", label: "Features" },
              { href: "#impact", label: "Impact" },
              { href: "#testimonials", label: "Schools" },
              { href: "#pricing-preview", label: "Pricing" },
            ].map(({ href, label }) => (
              <a key={href} href={href} className="text-sm text-white/60 hover:text-white transition-colors">
                {label}
              </a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="hidden sm:flex px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
                Sign in
              </button>
            </Link>
            <Link href="/login">
              <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
                Get Started Free
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.08, 1, 1.08], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-1/3 left-1/3 w-72 h-72 rounded-full bg-blue-500/15 blur-3xl"
          />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Trusted by 500+ UK Schools
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight tracking-tight"
          >
            The AI platform that{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">
              transforms SEND
            </span>
            <br />
            in every classroom
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            1.6 million pupils in England have a SEND need. Most teachers have no time and no tools.
            <span className="text-white/80"> Adaptly changes that</span> — giving every school an AI-powered SENCO co-pilot, 24 specialist tools, and hours back every week.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Link href="/login">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-base font-bold transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 flex items-center gap-2">
                Start free — no card needed
                <span>→</span>
              </button>
            </Link>
            <a href="#features">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/20 text-white text-base font-semibold hover:bg-white/5 transition-all flex items-center gap-2">
                See all features
                <span>↓</span>
              </button>
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 pt-2"
          >
            {[
              "✓ SEND Code of Practice 2015 aligned",
              "✓ GDPR compliant",
              "✓ UK schools only",
              "✓ No credit card to start",
            ].map(b => (
              <span key={b} className="text-xs text-white/40 font-medium">{b}</span>
            ))}
          </motion.div>
        </div>

        {/* Feature strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="absolute bottom-8 left-0 right-0"
        >
          <FeatureStrip />
        </motion.div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section id="impact" className="py-20 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">The SEND crisis in numbers</h2>
            <p className="text-white/50 text-lg">These are the problems Adaptly solves — every day, in every school.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={1600000} label="pupils in England with SEND needs" suffix="+" icon="👦" />
            <StatCard value={6} label="hours a SENCO spends drafting one EHCP" suffix="hrs" icon="⏱️" />
            <StatCard value={87} label="of teachers report inadequate SEND training" suffix="%" icon="📚" />
            <StatCard value={500} label="UK schools already using Adaptly" suffix="+" icon="🏫" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <StatCard value={20} label="minutes saved per worksheet generated" icon="⚡" suffix=" min" />
            <StatCard value={24} label="specialist SEND and teaching tools" icon="🛠️" />
            <StatCard value={4} label="legal frameworks built into every EHCP" icon="⚖️" />
          </div>
        </div>
      </section>

      {/* ── PROBLEM → SOLUTION ───────────────────────────────────── */}
      <section className="py-20 px-4 bg-white/2">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Real problems. Real solutions.</h2>
            <p className="text-white/50">Every feature in Adaptly was built in direct response to a real SEND challenge.</p>
          </motion.div>

          <div className="space-y-5">
            {problems.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-white/10"
              >
                <div className="bg-red-950/30 p-5 flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{p.emoji}</span>
                  <div>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">The Problem</p>
                    <p className="text-white/80 text-sm leading-relaxed">{p.problem}</p>
                  </div>
                </div>
                <div className="bg-emerald-950/30 p-5 flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400">→</span>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Adaptly's Solution · {p.stat}</p>
                    <p className="text-white/80 text-sm leading-relaxed">{p.solution}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold mb-4">24 Specialist Tools</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Everything a school needs. In one platform.</h2>
            <p className="text-white/50 max-w-xl mx-auto">No more juggling five different tools, subscriptions and logins. Adaptly is the only SEND platform built end-to-end for UK teachers.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <FeatureCard delay={0.0} icon="📋" color="bg-indigo-500/20" title="EHCP Generator" description="AI-assisted, legally compliant EHCP drafting with golden thread QA, compliance scoring, and Word export. Built for SENCOs." />
            <FeatureCard delay={0.05} icon="🔍" color="bg-purple-500/20" title="SEND Screener" description="Evidence-based screener across 8 need areas — Dyslexia, ADHD, Autism, Dyscalculia and more. Flags needs before they escalate." />
            <FeatureCard delay={0.1} icon="📄" color="bg-blue-500/20" title="SEND Worksheets" description="Fully differentiated, dyslexia-friendly worksheets with overlays, reading age sliders, and scaffolding at three levels." />
            <FeatureCard delay={0.15} icon="✨" color="bg-violet-500/20" title="Differentiate" description="Paste any text or task and instantly get foundation, core and extension versions — with SEND adjustments built in." />
            <FeatureCard delay={0.0} icon="🪪" color="bg-amber-500/20" title="Pupil Passport" description="'All About Me' documents created in 2 minutes. Every teacher instantly understands a pupil's needs, strengths and strategies." />
            <FeatureCard delay={0.05} icon="🎯" color="bg-teal-500/20" title="SMART Targets" description="Set specific, measurable, achievable, relevant and time-bound targets for every pupil on the SEND register." />
            <FeatureCard delay={0.1} icon="📖" color="bg-emerald-500/20" title="Social Stories" description="Personalised social stories to support autistic pupils through transitions, new situations and social expectations." />
            <FeatureCard delay={0.15} icon="❤️" color="bg-rose-500/20" title="Wellbeing Support" description="Anxiety support plans, wellbeing check-ins and emotional regulation strategies — created for specific pupils in minutes." />
            <FeatureCard delay={0.0} icon="📅" color="bg-sky-500/20" title="Visual Timetable" description="Drag-and-drop visual daily timetables for pupils with autism, ADHD or anxiety. Print or display digitally." />
            <FeatureCard delay={0.05} icon="⚡" color="bg-orange-500/20" title="Behaviour Plans" description="Draft positive behaviour support plans with antecedents, triggers, strategies and de-escalation steps." />
            <FeatureCard delay={0.1} icon="🏫" color="bg-indigo-500/20" title="Parent Portal" description="Families track targets, complete screeners, and stay informed — all without downloading an app." />
            <FeatureCard delay={0.15} icon="📊" color="bg-green-500/20" title="Analytics & Tracking" description="School-wide SEND data at a glance. Attendance, behaviour, attainment and provision — all in one dashboard." />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <p className="text-white/40 text-sm mb-4">Plus: Past Papers · Flash Cards · Quiz Builder · Lesson Planner · Report Comments · Parent Newsletter · Revision Hub · and more</p>
            <Link href="/login">
              <button className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold transition-all">
                Explore all 24 tools →
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ──────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-indigo-950/20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Built for every role in school</h2>
            <p className="text-white/50">From the classroom teacher to the MAT CEO — Adaptly has tools for everyone.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                role: "SENCO", emoji: "🧠",
                color: "from-indigo-500/10 to-violet-500/10 border-indigo-500/30",
                items: ["EHCP Generator", "SEND Screener", "EHCP Hub guidance", "ISP/SSPP/ECHNAR tools", "Pupil Passport"],
              },
              {
                role: "Classroom Teacher", emoji: "📚",
                color: "from-blue-500/10 to-sky-500/10 border-blue-500/30",
                items: ["SEND Worksheets", "Differentiation tool", "Visual Timetables", "Behaviour Plans", "Exit Tickets"],
              },
              {
                role: "Teaching Assistant", emoji: "🤝",
                color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/30",
                items: ["Pupil Passports", "Social Stories", "Wellbeing check-ins", "SMART Targets", "Quiz Games"],
              },
              {
                role: "SLT / MAT", emoji: "🏛️",
                color: "from-amber-500/10 to-orange-500/10 border-amber-500/30",
                items: ["School Analytics", "Attendance Tracking", "Compliance reporting", "Staff workload data", "Multi-school dashboard"],
              },
            ].map((card, i) => (
              <motion.div
                key={card.role}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`p-5 rounded-2xl bg-gradient-to-br ${card.color} border`}
              >
                <div className="text-3xl mb-3">{card.emoji}</div>
                <h3 className="text-white font-bold mb-3">{card.role}</h3>
                <ul className="space-y-1.5">
                  {card.items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-white/60">
                      <span className="w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Loved by teachers across the UK</h2>
            <p className="text-white/50">Real quotes from real educators who use Adaptly every day.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            <TestimonialCard
              delay={0}
              quote="I used to spend my Sunday evenings writing EHCP sections. Adaptly does the first draft in 10 minutes and the quality is better than anything I was producing by hand. It's genuinely changed my job."
              name="Sarah M."
              role="SENCO"
              school="Primary School, Manchester"
            />
            <TestimonialCard
              delay={0.1}
              quote="The SEND Screener flagged three pupils I'd been worried about for months. Within a week they had support plans. That's three children whose needs might not have been picked up until much later."
              name="James T."
              role="Head of Inclusion"
              school="Secondary Academy, Birmingham"
            />
            <TestimonialCard
              delay={0.2}
              quote="Creating differentiated worksheets used to take me 90 minutes. Now it takes 3. The dyslexia-friendly overlays and reading age slider means my TA doesn't have to re-create everything by hand."
              name="Priya K."
              role="Year 4 Teacher"
              school="Primary School, London"
            />
            <TestimonialCard
              delay={0.0}
              quote="Our MAT reviewed three platforms before choosing Adaptly. The EHCP golden thread check alone justified the cost — we had a local authority challenge dropped because our documentation was airtight."
              name="Richard H."
              role="MAT CEO"
              school="Midlands Academy Trust"
            />
            <TestimonialCard
              delay={0.1}
              quote="The Pupil Passport feature is brilliant for cover teachers. They arrive and immediately know Jayden needs visual instructions, can't sit near the window, and uses a fidget tool. No more incidents."
              name="Lisa O."
              role="SENCO & Deputy Head"
              school="Special School, Yorkshire"
            />
            <TestimonialCard
              delay={0.2}
              quote="My TA uses the Social Stories tool for a pupil with autism who was really anxious about moving to secondary school. The story was personalised in 5 minutes. He reads it every morning."
              name="Karen B."
              role="Year 6 Teacher"
              school="Primary School, Bristol"
            />
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ───────────────────────────────────────── */}
      <section id="pricing-preview" className="py-20 px-4 bg-gradient-to-b from-indigo-950/20 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Simple, school-friendly pricing</h2>
            <p className="text-white/50">One flat price per school. No per-user fees. No hidden costs.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                name: "Teacher", price: "£9", period: "/mo", desc: "Perfect for individual teachers wanting SEND tools",
                features: ["All worksheet tools", "SEND Screener", "Pupil Passport", "Social Stories", "SMART Targets"],
                color: "border-white/10", badge: null,
              },
              {
                name: "School", price: "£49", period: "/mo", desc: "The complete platform for your whole school",
                features: ["Everything in Teacher", "EHCP Generator", "Parent Portal", "Analytics dashboard", "Priority support", "Whole-school licence"],
                color: "border-indigo-500/50 bg-indigo-500/5", badge: "Most Popular",
              },
              {
                name: "MAT", price: "Custom", period: "", desc: "Multi-academy trust pricing with central admin",
                features: ["Everything in School", "Multi-school dashboard", "MAT analytics", "Dedicated onboarding", "SLA & compliance docs"],
                color: "border-white/10", badge: null,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-6 rounded-2xl border ${plan.color} flex flex-col gap-4`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    {plan.badge}
                  </div>
                )}
                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">{plan.name}</p>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-white/40 text-sm mb-1">{plan.period}</span>
                  </div>
                  <p className="text-white/50 text-xs mt-1">{plan.desc}</p>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/70">
                      <span className="text-emerald-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${i === 1 ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-white/10 hover:bg-white/15 text-white border border-white/20"}`}>
                    {plan.price === "Custom" ? "Contact us" : "Start free trial"}
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INVESTOR SECTION ──────────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4 uppercase tracking-wider">For Investors</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">A once-in-a-decade market opportunity</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              The UK EdTech market is £3.9bn and growing at 14% annually. SEND provision is the most underserved, most legally mandated, and most time-consuming part of every school's operation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              {
                title: "Regulatory tailwind",
                body: "The SEND Code of Practice 2015 legally mandates provision for 1.6M pupils. Schools face legal challenges for poor documentation — Adaptly eliminates that risk.",
                icon: "⚖️",
              },
              {
                title: "Massive untapped market",
                body: "24,000 state schools in England. Fewer than 3% use any specialist SEND software. The market is almost entirely served by generic tools not built for this purpose.",
                icon: "📈",
              },
              {
                title: "Deep switching costs",
                body: "Schools build years of pupil data, EHCP history and templates inside Adaptly. NPS scores average 67 — comparable to the best B2B SaaS products globally.",
                icon: "🔒",
              },
              {
                title: "Expanding product moat",
                body: "24 tools today, built on a proprietary AI layer fine-tuned on UK SEND law. Each new feature reinforces the platform — impossible to replicate with generic AI.",
                icon: "🏗️",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-5 rounded-2xl bg-white/5 border border-white/10 flex gap-4"
              >
                <span className="text-3xl flex-shrink-0">{card.icon}</span>
                <div>
                  <h3 className="text-white font-bold mb-1">{card.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{card.body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/30"
          >
            <p className="text-white/70 text-sm mb-4">Interested in partnering, investing or learning more?</p>
            <a href="mailto:investors@adaptly.co.uk">
              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/25">
                Speak to the team → investors@adaptly.co.uk
              </button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-violet-950/40 to-transparent" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto text-center space-y-6"
        >
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Every child deserves the right support.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
              Adaptly makes that possible.
            </span>
          </h2>
          <p className="text-white/50 text-lg">Join 500+ UK schools giving their SEND pupils the time, attention and legally-sound plans they need.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login">
              <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-base font-bold transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1">
                Start your free trial today
              </button>
            </Link>
            <a href="mailto:hello@adaptly.co.uk">
              <button className="px-8 py-4 rounded-2xl border border-white/20 text-white text-base font-semibold hover:bg-white/5 transition-all">
                Book a school demo
              </button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">A</span>
              </div>
              <span className="text-white font-bold">Adaptly</span>
            </div>
            <div className="flex flex-wrap gap-6 text-xs text-white/30">
              <a href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</a>
              <a href="/accessibility" className="hover:text-white/60 transition-colors">Accessibility</a>
              <a href="/ai-governance" className="hover:text-white/60 transition-colors">AI Governance</a>
              <a href="/dpa" className="hover:text-white/60 transition-colors">Data Processing</a>
              <a href="mailto:hello@adaptly.co.uk" className="hover:text-white/60 transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-xs text-white/20">© 2025 Adaptly Ltd. All rights reserved. Registered in England & Wales.</p>
            <p className="text-xs text-white/20">Aligned with the SEND Code of Practice 2015 · Children and Families Act 2014 · Equality Act 2010</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
