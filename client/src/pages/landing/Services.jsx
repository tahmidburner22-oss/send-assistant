import { useRef } from "react";
import { motion } from "framer-motion";
import { TOOLS } from "./lib/data";

function ToolCard({ tool, index }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(0)`;
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateY(0) rotateX(0) translateZ(0)";
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: (index % 8) * 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="group"
      data-testid={`tool-card-${index}`}
    >
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="tilt-card h-full rounded-3xl p-6 md:p-7 bg-cream-50 border border-ink-900/5 hover:border-terracotta/30 hover:shadow-[0_20px_50px_-20px_rgba(217,108,74,0.25)] transition-all duration-500 relative overflow-hidden"
      >
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-terracotta/5 group-hover:bg-terracotta/15 transition-colors duration-500" />
        <div className="relative flex items-start justify-between">
          <span className="font-display text-4xl text-ink-900/15 leading-none">{String(index + 1).padStart(2, "0")}</span>
          <span className="w-9 h-9 rounded-full bg-ink-900 text-cream-100 flex items-center justify-center text-sm group-hover:bg-terracotta transition-colors">
            →
          </span>
        </div>
        <h3 className="relative mt-8 font-heading font-bold text-xl md:text-2xl text-ink-900 tracking-tight leading-tight">
          {tool.t}
        </h3>
        <p className="relative mt-3 text-sm text-ink-500 leading-relaxed">{tool.d}</p>
      </div>
    </motion.article>
  );
}

export default function Services() {
  return (
    <section
      id="services"
      data-testid="services-section"
      className="relative py-28 md:py-40 px-6 md:px-12"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">24 specialist tools</div>
            <h2 className="mt-5 font-heading text-ink-900 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
              Everything a school needs,{" "}
              <span className="font-display italic font-normal">in one platform.</span>
            </h2>
          </div>
          <p className="md:max-w-md text-ink-500 text-base md:text-lg leading-relaxed">
            From EHCP drafting to daily adaptive work delivery — every tool is purpose-built for UK schools
            and aligned with statutory guidance.
          </p>
        </div>

        {/* Marquee tool names */}
        <div className="marquee-mask overflow-hidden mb-14" data-testid="services-marquee">
          <div className="flex gap-12 whitespace-nowrap animate-marquee">
            {[...TOOLS, ...TOOLS].map((t, i) => (
              <span key={i} className="font-display text-3xl md:text-4xl italic text-ink-700/70">
                {t.t} <span className="text-terracotta">·</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6" data-testid="services-grid">
          {TOOLS.map((tool, i) => (
            <ToolCard key={tool.t} tool={tool} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
