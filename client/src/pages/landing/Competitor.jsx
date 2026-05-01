import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";

// Competitive comparison — why Adaptly wins vs single-point tools, generic EdTech
// and manual SENCO work. Built as a premium comparison table.

const ROWS = [
  { f: "EHCP drafting with golden-thread QA",                adaptly: "yes", sheet: "no",  ehcp: "partial", manual: "no" },
  { f: "Worksheets auto-adapted for SEND profiles",          adaptly: "yes", sheet: "partial", ehcp: "no", manual: "no" },
  { f: "Parent portal included (pupils, parents, staff)",    adaptly: "yes", sheet: "no",  ehcp: "no",      manual: "no" },
  { f: "Daily adaptive work pack delivery",                  adaptly: "yes", sheet: "no",  ehcp: "no",      manual: "no" },
  { f: "SEND Screener with referral-ready reports",          adaptly: "yes", sheet: "no",  ehcp: "no",      manual: "partial" },
  { f: "Built around UK SEND Code of Practice 2015",         adaptly: "yes", sheet: "no",  ehcp: "partial", manual: "yes" },
  { f: "One login · 24 connected tools",                     adaptly: "yes", sheet: "no",  ehcp: "no",      manual: "no" },
  { f: "Hours saved per EHCP",                               adaptly: "5h+",  sheet: "0",  ehcp: "1h",      manual: "0" },
  { f: "Per-school flat pricing (no per-pupil fees)",        adaptly: "yes", sheet: "no",  ehcp: "no",      manual: "—" },
];

function Cell({ v, highlight }) {
  if (v === "yes")
    return (
      <div className={`flex items-center justify-center ${highlight ? "text-terracotta" : "text-sage"}`}>
        <span className={`w-7 h-7 rounded-full flex items-center justify-center ${highlight ? "bg-terracotta text-cream-100" : "bg-sage/15"}`}>
          <Check size={14} strokeWidth={3} />
        </span>
      </div>
    );
  if (v === "no")
    return (
      <div className="flex items-center justify-center text-ink-500">
        <span className="w-7 h-7 rounded-full flex items-center justify-center bg-ink-900/5">
          <X size={14} />
        </span>
      </div>
    );
  if (v === "partial")
    return (
      <div className="flex items-center justify-center text-honey">
        <span className="w-7 h-7 rounded-full flex items-center justify-center bg-honey/15">
          <Minus size={14} strokeWidth={3} />
        </span>
      </div>
    );
  return (
    <div className={`text-center font-heading font-bold ${highlight ? "text-terracotta" : "text-ink-900"}`}>{v}</div>
  );
}

export default function Competitor() {
  return (
    <section id="why-adaptly" data-testid="competitor-section" className="relative py-28 md:py-40 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">Why Adaptly wins</div>
            <h2 className="mt-5 font-heading text-ink-900 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
              Single-point tools can't{" "}
              <span className="font-display italic font-normal">replace</span>{" "}
              a SEND platform.
            </h2>
          </div>
          <p className="md:max-w-sm text-ink-500 text-base md:text-lg leading-relaxed">
            Adaptly is the only UK platform with 24 connected specialist tools — purpose-built around statute,
            not bolted on.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl bg-cream-50 border border-ink-900/5 overflow-hidden shadow-[0_30px_60px_-30px_rgba(34,32,30,0.2)]"
          data-testid="competitor-table"
        >
          {/* Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr_1fr_1fr] bg-ink-900 text-cream-100">
            <div className="p-5 text-xs uppercase tracking-[0.2em] font-semibold">Feature</div>
            <div className="p-5 text-center text-sm font-heading font-bold bg-terracotta">Adaptly</div>
            <div className="p-5 text-center text-xs uppercase tracking-[0.15em] text-cream-100/70">AI worksheet tools</div>
            <div className="p-5 text-center text-xs uppercase tracking-[0.15em] text-cream-100/70">Generic EHCP SaaS</div>
            <div className="p-5 text-center text-xs uppercase tracking-[0.15em] text-cream-100/70">Manual / Word</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-ink-900/5">
            {ROWS.map((r, i) => (
              <motion.div
                key={r.f}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.04, duration: 0.5 }}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center hover:bg-terracotta/5 transition-colors"
                data-testid={`competitor-row-${i}`}
              >
                <div className="p-4 md:p-5 text-sm md:text-base text-ink-900 font-medium">{r.f}</div>
                <div className="p-4 md:p-5 bg-terracotta/5"><Cell v={r.adaptly} highlight /></div>
                <div className="p-4 md:p-5"><Cell v={r.sheet} /></div>
                <div className="p-4 md:p-5"><Cell v={r.ehcp} /></div>
                <div className="p-4 md:p-5"><Cell v={r.manual} /></div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Moat */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { t: "The only UK-law-first platform", d: "Every EHCP provision is golden-thread-checked against the SEND Code of Practice 2015 — not retrofitted from a US template." },
            { t: "A single login, 24 connected tools", d: "Worksheets feed the Skill Ladder. The Skill Ladder feeds EHCP reviews. Parents see it all. Competitors give you a silo." },
            { t: "Built with schools, not for them", d: "Every prompt, template and threshold was co-designed with practising SENCOs, teachers and trust inclusion leads." },
          ].map((m, i) => (
            <motion.div
              key={m.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              className="p-7 rounded-3xl bg-cream-50 border border-ink-900/5 hover:border-terracotta/30 transition-colors"
              data-testid={`competitor-moat-${i}`}
            >
              <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center font-display text-2xl">
                {i + 1}
              </div>
              <div className="mt-5 font-heading font-bold text-ink-900 text-lg md:text-xl leading-tight">{m.t}</div>
              <div className="mt-3 text-ink-500 text-sm leading-relaxed">{m.d}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
