import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { TOOLS } from "./lib/data";

// Horizontal pinned scroll through all 24 tools on desktop (≥1024px).
// Vertical scroll translates into horizontal translation of an inner rail.
// On mobile/tablet we render a vertical grid to keep the scroll natural and
// avoid any blank pinned space.

export default function ServicesHorizontal() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  if (!isDesktop) return <ServicesStack />;
  return <ServicesHorizontalDesktop />;
}

// ───── Mobile / tablet — vertical marquee intro + dense grid ─────

function ServicesStack() {
  return (
    <section
      id="services"
      data-testid="services-section"
      className="relative py-20 sm:py-24 px-5 sm:px-6"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
          24 specialist tools
        </div>
        <h2 className="mt-4 font-heading text-ink-900 text-4xl sm:text-5xl font-bold tracking-tight leading-[0.95]"
          style={{ paddingBottom: "0.08em" }}
        >
          Everything a school needs,{" "}
          <span className="font-display italic font-normal">in one platform.</span>
        </h2>
        <p className="mt-5 text-ink-500 text-base leading-relaxed max-w-lg">
          From EHCP drafting to daily adaptive work delivery, every tool is
          purpose-built for UK schools and aligned with statutory guidance.
        </p>

        {/* Marquee of tool names */}
        <div className="marquee-mask overflow-hidden mt-8 mb-10">
          <div className="flex gap-8 whitespace-nowrap animate-marquee">
            {[...TOOLS, ...TOOLS].map((t, i) => (
              <span
                key={i}
                className="font-display text-2xl italic text-ink-700/70"
              >
                {t.t} <span className="text-terracotta">·</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map((tool, i) => (
            <motion.article
              key={tool.t}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                delay: (i % 6) * 0.04,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="rounded-3xl bg-cream-50 border border-ink-900/5 p-5 sm:p-6 relative overflow-hidden"
              data-testid={`tool-card-${i}`}
            >
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-terracotta/10" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <span className="font-display text-3xl text-ink-900/20 leading-none tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-ink-900 text-cream-100 flex items-center justify-center text-sm">
                    →
                  </span>
                </div>
                <h3 className="mt-6 font-heading font-bold text-lg text-ink-900 tracking-[-0.02em] leading-tight">
                  {tool.t}
                </h3>
                <p className="mt-2 text-sm text-ink-500 leading-relaxed">
                  {tool.d}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───── Desktop — pinned horizontal rail ─────

function ServicesHorizontalDesktop() {
  const sectionRef = useRef(null);
  const railRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.4,
  });

  // Rail travels ~210vw left as user scrolls. Matches 24 cards + intro panel.
  const x = useTransform(smooth, [0, 1], ["0vw", "-210vw"]);

  return (
    <section
      ref={sectionRef}
      id="services"
      data-testid="services-section"
      className="relative"
      style={{ height: "380vh" }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden flex flex-col justify-center">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-[420px] h-[420px] rounded-full bg-terracotta/10 blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-[420px] h-[420px] rounded-full bg-honey/15 blur-[120px]" />
        </div>

        {/* Header strip */}
        <div className="px-6 md:px-12 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">
              24 specialist tools
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-ink-500">
              Scroll to explore →
            </div>
          </div>
        </div>

        {/* Horizontal rail */}
        <motion.div
          ref={railRef}
          style={{ x }}
          className="mt-10 flex items-stretch gap-5 md:gap-7 pl-6 md:pl-12 pr-20 will-change-transform"
        >
          {/* Lead pitch panel */}
          <div className="flex-shrink-0 w-[560px] flex items-center">
            <div>
              <h2
                className="font-heading text-ink-900 text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]"
                style={{ paddingBottom: "0.08em" }}
              >
                Everything a school needs,{" "}
                <span className="font-display italic font-normal">in one platform.</span>
              </h2>
              <p className="mt-5 text-ink-500 text-base md:text-lg leading-relaxed max-w-md">
                From EHCP drafting to daily adaptive work delivery, every tool is
                purpose-built for UK schools and aligned with statutory guidance.
              </p>
              <div className="mt-8 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink-700 font-bold">
                <span className="font-display text-6xl text-terracotta leading-none tabular-nums">
                  24
                </span>
                <div>
                  <div>Specialist</div>
                  <div>Tools</div>
                </div>
              </div>
            </div>
          </div>

          {TOOLS.map((tool, i) => (
            <ToolRailCard key={tool.t} tool={tool} index={i} />
          ))}

          {/* Tail spacer so the last card gets breathing room */}
          <div className="flex-shrink-0 w-[20vw]" />
        </motion.div>

        <ScrollProgressBar progress={smooth} />
      </div>
    </section>
  );
}

function ToolRailCard({ tool, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 w-[360px] md:w-[380px]"
      data-cursor="hover"
      data-testid={`tool-card-${index}`}
    >
      <div className="h-full rounded-3xl bg-cream-50 border border-ink-900/5 p-6 md:p-7 relative overflow-hidden transition-colors duration-500 hover:border-terracotta/40">
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-terracotta/10" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <span className="font-display text-4xl text-ink-900/20 leading-none tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="w-9 h-9 rounded-full bg-ink-900 text-cream-100 flex items-center justify-center text-sm">
              →
            </span>
          </div>
          <h3 className="mt-10 font-heading font-bold text-xl md:text-2xl text-ink-900 tracking-[-0.02em] leading-tight">
            {tool.t}
          </h3>
          <p className="mt-3 text-sm text-ink-500 leading-relaxed">{tool.d}</p>
        </div>
      </div>
    </motion.article>
  );
}

function ScrollProgressBar({ progress }) {
  const scaleX = useTransform(progress, [0, 1], [0, 1]);
  return (
    <div className="absolute bottom-8 left-6 right-6 md:left-12 md:right-12 max-w-7xl mx-auto pointer-events-none">
      <div className="h-px bg-ink-900/10 relative overflow-hidden">
        <motion.div
          style={{ scaleX, transformOrigin: "left" }}
          className="absolute inset-0 bg-terracotta"
        />
      </div>
    </div>
  );
}
