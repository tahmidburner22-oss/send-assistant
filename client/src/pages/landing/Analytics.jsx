import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingUp, Activity, Users2, Target } from "lucide-react";

// Animated analytics / dashboard section — charts draw on view, counters tick up,
// heatmap cells appear, panel tilts slightly on mouse move.

function Counter({ value, suffix = "", prefix = "", duration = 1.6 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const from = 0;
    const to = value;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setN(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value, duration]);
  const display = value % 1 === 0 ? Math.round(n).toLocaleString() : n.toFixed(1);
  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

function SparkLine({ progress }) {
  const pts = [10, 24, 18, 36, 28, 46, 40, 58, 52, 72, 68, 84];
  const w = 240;
  const h = 80;
  const path = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - (p / 100) * h;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#D96C4A" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#D96C4A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={path + ` L${w},${h} L0,${h} Z`}
        fill="url(#spark-grad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: progress ? 1 : 0 }}
        transition={{ duration: 1 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke="#D96C4A"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: progress ? 1 : 0 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function Analytics() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const tiltRef = useRef(null);

  const onMove = (e) => {
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1200px) rotateY(${x * 4}deg) rotateX(${-y * 3}deg)`;
  };
  const onLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "perspective(1200px) rotateY(0) rotateX(0)";
  };

  return (
    <section
      ref={ref}
      id="analytics"
      data-testid="analytics-section"
      className="relative py-28 md:py-40 px-6 md:px-12"
    >
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold flex items-center gap-2">
            <Activity size={12} /> Analytics · built-in
          </div>
          <h2 className="mt-5 font-heading text-ink-900 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
            See the impact{" "}
            <span className="font-display italic font-normal">as it happens.</span>
          </h2>
          <p className="mt-5 text-ink-500 text-base md:text-lg leading-relaxed">
            Every adaptation, every submission, every Skill Ladder rung — live on the dashboard.
            Trust leaders get investor-grade reporting. SENCOs get the audit trail Ofsted asks for.
          </p>
        </div>

        <div
          ref={tiltRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="relative rounded-3xl bg-cream-50 border border-ink-900/5 p-5 md:p-8 shadow-[0_40px_90px_-30px_rgba(34,32,30,0.3)] transition-transform duration-300"
          data-testid="analytics-dashboard"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-terracotta" />
            <span className="w-2 h-2 rounded-full bg-honey" />
            <span className="w-2 h-2 rounded-full bg-sage" />
            <div className="ml-auto text-[10px] uppercase tracking-[0.2em] text-ink-500">Trust dashboard · Spring term 2026</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { lbl: "Worksheets adapted", val: 18420, icon: Activity, colour: "#D96C4A" },
              { lbl: "Pupils on adaptive plans", val: 2187, icon: Users2, colour: "#E5B96E" },
              { lbl: "Avg. Skill-Ladder climb", val: 2.4, suffix: " rungs", icon: TrendingUp, colour: "#7F8C72" },
              { lbl: "EHCP compliance score", val: 98, suffix: "%", icon: Target, colour: "#22201E" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.lbl}
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.1 * i, duration: 0.6 }}
                  className="p-5 rounded-2xl bg-white border border-ink-900/5"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: s.colour + "15", color: s.colour }}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="text-[10px] text-sage">▲ +12%</span>
                  </div>
                  <div className="mt-4 font-display text-3xl md:text-4xl text-ink-900 leading-none">
                    <Counter value={s.val} suffix={s.suffix || ""} />
                  </div>
                  <div className="mt-2 text-[11px] text-ink-500 uppercase tracking-wide">{s.lbl}</div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Progress line */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="lg:col-span-2 p-5 rounded-2xl bg-white border border-ink-900/5"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="font-heading font-bold text-ink-900">Reading comprehension — cohort trend</div>
                <div className="text-xs text-sage font-semibold">+18% this half-term</div>
              </div>
              <SparkLine progress={inView} />
              <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-ink-500">
                <span>Sept</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span>
              </div>
            </motion.div>

            {/* Bar chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="p-5 rounded-2xl bg-white border border-ink-900/5"
            >
              <div className="font-heading font-bold text-ink-900 mb-4">SEND tool usage</div>
              <div className="space-y-3">
                {[
                  { lbl: "Worksheet Gen.", v: 88, c: "#D96C4A" },
                  { lbl: "EHCP Builder", v: 72, c: "#E5B96E" },
                  { lbl: "Differentiate", v: 65, c: "#7F8C72" },
                  { lbl: "SEND Screener", v: 41, c: "#22201E" },
                ].map((b, i) => (
                  <div key={b.lbl}>
                    <div className="flex justify-between text-[11px] text-ink-500 mb-1">
                      <span>{b.lbl}</span>
                      <span>{b.v}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-900/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${b.v}%` } : {}}
                        transition={{ delay: 0.7 + i * 0.1, duration: 1.1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: b.c }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Heatmap */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="mt-4 p-5 rounded-2xl bg-white border border-ink-900/5"
          >
            <div className="flex justify-between items-baseline mb-4">
              <div className="font-heading font-bold text-ink-900">Intervention heatmap · KS2</div>
              <div className="text-xs text-ink-500">Higher intensity = more support delivered</div>
            </div>
            <div className="grid grid-cols-12 gap-1.5">
              {Array.from({ length: 48 }).map((_, i) => {
                const v = Math.random();
                const o = 0.1 + v * 0.9;
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={inView ? { scale: 1, opacity: 1 } : {}}
                    transition={{ delay: 0.9 + (i % 12) * 0.02 + Math.floor(i / 12) * 0.05, duration: 0.4 }}
                    className="aspect-square rounded"
                    style={{ background: `rgba(217,108,74,${o})` }}
                  />
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
