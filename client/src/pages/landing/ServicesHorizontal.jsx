import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { TOOLS } from "./lib/data";
import ServicesGrid from "./Services.jsx";

// V3-only horizontal pinned scroll through all 24 tools.
// Vertical scroll translates into horizontal translation of an inner rail.
// Signature move of awwwards / godly / linear-style landings.
//
// Mobile fallback: we reuse the V2 grid because horizontal pinned scroll is
// awkward on a short viewport.

export default function ServicesHorizontal() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  if (!isDesktop) return <ServicesGrid />;
  return <ServicesHorizontalDesktop />;
}

function ServicesHorizontalDesktop() {
  const sectionRef = useRef(null);
  const railRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4 });

  // The rail translates from 0 to -(full width - 100vw). Since we don't know
  // the exact width at render time, we drive a percentage that covers the
  // typical content width. Content is ~ (24 + 1) cards × ~340px + gaps.
  // We use a vw-based offset so it scales with viewport.
  const x = useTransform(smooth, [0, 1], ["0vw", "-210vw"]);

  const rest = TOOLS; // all 24 tools

  return (
    <section
      ref={sectionRef}
      id="services"
      data-testid="services-section"
      className="relative"
      style={{ height: "420vh" }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden flex flex-col justify-center">
        {/* Subtle decorative background */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-[420px] h-[420px] rounded-full bg-terracotta/10 blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-[420px] h-[420px] rounded-full bg-honey/15 blur-[120px]" />
        </div>

        {/* Label strip */}
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

        {/* The horizontal rail */}
        <motion.div
          ref={railRef}
          style={{ x }}
          className="mt-10 flex items-stretch gap-5 md:gap-7 pl-6 md:pl-12 pr-20 will-change-transform"
        >
          {/* Lead panel — the pitch */}
          <div className="flex-shrink-0 w-[85vw] sm:w-[560px] flex items-center">
            <div>
              <h2 className="font-heading text-ink-900 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
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

          {/* Tool cards */}
          {rest.map((t, i) => (
            <ToolRailCard key={t.t} tool={t} index={i} />
          ))}

          {/* Spacer for final card breathing room */}
          <div className="flex-shrink-0 w-[20vw]" />
        </motion.div>

        {/* Scroll progress under the rail */}
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
      className="flex-shrink-0 w-[80vw] sm:w-[360px] md:w-[380px]"
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
