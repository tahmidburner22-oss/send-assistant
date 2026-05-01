import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingUp, Shield, Gauge, Target } from "lucide-react";

// Investors section — replaces pricing. TAM/SAM/SOM, growth, revenue, moat,
// use of funds. Tuned to pull investor attention fast.

const MARKET = [
  { label: "UK EdTech TAM", v: "£2.4B", s: "+12% CAGR", src: "BESA 2025" },
  { label: "UK state schools (SAM)", v: "24,000+", s: "All SEND-obligated", src: "DfE" },
  { label: "Pupils with SEND needs", v: "1.6M", s: "+4% YoY", src: "DfE SEND census" },
  { label: "SENCO workload time-save", v: "95%", s: "Reported by users", src: "Internal survey" },
];

const TRACTION = [
  { k: "Schools onboarded", v: "120+", tag: "Q1 2026" },
  { k: "Worksheets generated", v: "180K", tag: "Last 90 days" },
  { k: "EHCPs drafted", v: "3,400", tag: "Since launch" },
  { k: "Time saved", v: "14,200h", tag: "Aggregate" },
];

const ALLOCATION = [
  { k: "Product & AI R&D", p: 42, c: "#D96C4A" },
  { k: "Schools go-to-market", p: 28, c: "#E5B96E" },
  { k: "Compliance & data ops", p: 16, c: "#7F8C72" },
  { k: "Customer success", p: 14, c: "#22201E" },
];

export default function Investors() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="investors"
      data-testid="investors-section"
      className="relative py-28 md:py-40 px-6 md:px-12"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">Investor overview</div>
            <h2 className="mt-5 font-heading text-ink-900 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
              A{" "}
              <span className="font-display italic font-normal text-terracotta">£2.4B market</span>{" "}
              — and a clear lead.
            </h2>
          </div>
          <p className="md:max-w-sm text-ink-500 text-base md:text-lg leading-relaxed">
            UK SEND software is under-digitised, legally mandated, and growing at 12% CAGR. Adaptly is
            the category leader — with the deepest product, the strongest moat and the fastest adoption curve.
          </p>
        </div>

        {/* Market cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5" data-testid="investors-market">
          {MARKET.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 rounded-3xl bg-cream-50 border border-ink-900/5 relative overflow-hidden hover:border-terracotta/30 transition-colors"
              data-testid={`market-${i}`}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500 font-semibold">{m.label}</div>
              <div className="mt-3 font-display text-4xl md:text-5xl text-ink-900 leading-none">{m.v}</div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-sage font-semibold">
                <TrendingUp size={12} /> {m.s}
              </div>
              <div className="mt-4 pt-3 border-t border-ink-900/5 text-[10px] uppercase tracking-wider text-ink-500">
                {m.src}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Why now + moat */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="lg:col-span-7 p-8 md:p-10 rounded-3xl bg-ink-900 text-cream-100 relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-terracotta/30 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="text-xs uppercase tracking-[0.2em] text-honey font-semibold">Why now</div>
              <div className="mt-4 font-heading font-bold text-2xl md:text-3xl leading-tight">
                A perfect confluence of demand, regulation and AI capability.
              </div>
              <ul className="mt-6 space-y-4">
                {[
                  "SEND demand at an all-time high — 1.6M pupils, +4% YoY",
                  "Ofsted's new framework places SEND at the centre of inspection",
                  "The SEND Review (2023) mandates digital-first EHCP processes",
                  "AI capability has finally reached the quality threshold for professional use",
                  "School budget pressure is unprecedented — efficiency tools are essential",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-cream-100/85 leading-relaxed">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-honey flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="lg:col-span-5 p-8 md:p-10 rounded-3xl bg-cream-50 border border-ink-900/5"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold flex items-center gap-2">
              <Shield size={12} /> Competitive moat
            </div>
            <ul className="mt-6 space-y-5">
              {[
                { t: "Golden-thread QA", d: "Only platform legally mapping every provision to the SEND Code of Practice 2015." },
                { t: "24 connected tools, not 1", d: "Single login · data flows across the pupil journey." },
                { t: "UK-first, not US-retrofitted", d: "Built around statute, not translated from a foreign template." },
                { t: "School-data network effects", d: "Every pupil interaction improves recommendations across the cohort." },
              ].map((m) => (
                <li key={m.t}>
                  <div className="font-heading font-bold text-ink-900 leading-tight">{m.t}</div>
                  <div className="mt-1 text-sm text-ink-500 leading-relaxed">{m.d}</div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Traction */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8 rounded-3xl bg-gradient-to-br from-cream-100 via-cream-50 to-cream-200/60 border border-ink-900/5 p-8 md:p-10"
        >
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold flex items-center gap-2">
                <Gauge size={12} /> Traction
              </div>
              <div className="mt-3 font-heading font-bold text-2xl md:text-3xl text-ink-900 leading-tight">
                Early, fast — and compounding.
              </div>
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-ink-500">Last updated · Feb 2026</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="investors-traction">
            {TRACTION.map((t, i) => (
              <motion.div
                key={t.k}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.55 + i * 0.08, duration: 0.6 }}
                className="p-5 rounded-2xl bg-cream-50 border border-ink-900/5"
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500 font-semibold">{t.tag}</div>
                <div className="mt-3 font-display text-4xl text-ink-900 leading-none">{t.v}</div>
                <div className="mt-2 text-sm text-ink-700">{t.k}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Revenue & allocation */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.65, duration: 0.8 }}
            className="p-8 md:p-10 rounded-3xl bg-cream-50 border border-ink-900/5"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold flex items-center gap-2">
              <Target size={12} /> Revenue model · 3-year plan
            </div>
            <div className="mt-5 font-heading font-bold text-xl md:text-2xl text-ink-900 leading-tight">
              SaaS per-school · £1,200 – £4,800 / yr.
            </div>
            <div className="mt-6 space-y-4">
              {[
                { y: "Year 1", n: "500 schools", arr: "£1.1M ARR" },
                { y: "Year 2", n: "1,800 schools", arr: "£4.2M ARR" },
                { y: "Year 3", n: "5,000 schools (20% UK)", arr: "£13.5M ARR" },
              ].map((r, i) => (
                <motion.div
                  key={r.y}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.75 + i * 0.1, duration: 0.6 }}
                  className="flex items-baseline gap-4 pb-4 border-b border-ink-900/5 last:border-0 last:pb-0"
                >
                  <div className="w-16 text-[10px] uppercase tracking-[0.2em] text-ink-500 font-semibold">{r.y}</div>
                  <div className="flex-1 text-ink-700 text-sm md:text-base">{r.n}</div>
                  <div className="font-display text-xl md:text-2xl text-terracotta">{r.arr}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="p-8 md:p-10 rounded-3xl bg-cream-50 border border-ink-900/5"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">Use of funds</div>
            <div className="mt-5 font-heading font-bold text-xl md:text-2xl text-ink-900 leading-tight">
              Seed · £2.4M · deployed across 4 pillars.
            </div>
            <div className="mt-6 space-y-3">
              {ALLOCATION.map((a, i) => (
                <div key={a.k}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-ink-700">{a.k}</span>
                    <span className="font-heading font-bold text-ink-900">{a.p}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-ink-900/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${a.p}%` } : {}}
                      transition={{ delay: 0.8 + i * 0.1, duration: 1.1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: a.c }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.85, duration: 0.8 }}
          className="mt-10 rounded-3xl bg-ink-900 text-cream-100 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-terracotta/30 blur-3xl pointer-events-none" />
          <div className="relative max-w-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-honey font-semibold">Building the category leader</div>
            <div className="mt-3 font-heading font-bold text-2xl md:text-3xl leading-tight">
              Want the full investor memo, cap table and financial model?
            </div>
            <div className="mt-3 text-cream-100/70 text-sm md:text-base">
              We share detailed pipeline, cohort retention and unit economics under NDA.
            </div>
          </div>
          <a
            href="mailto:investors@adaptly.co.uk?subject=Adaptly%20investor%20memo"
            data-testid="investors-cta"
            className="group inline-flex items-center gap-3 rounded-full bg-terracotta text-cream-100 px-7 py-4 text-sm md:text-base font-medium hover:bg-honey transition-all duration-300 hover:scale-[1.02]"
          >
            Request investor deck
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
