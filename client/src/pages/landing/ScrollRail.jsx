import { useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useVariant } from "./lib/useVariant";

// Fixed left-edge companion rail (V3 only, desktop).
// Shows: section counter, current section name, vertical progress bar, and a
// live scroll percentage. Inspired by awwwards / godly editorial sites.
// Hidden on mobile and on V2 to keep V2 restrained.

const SECTIONS = [
  { id: "top", label: "Intro" },
  { id: "about", label: "Why it matters" },
  { id: "services", label: "Platform" },
  { id: "differentiate", label: "Live demo" },
  { id: "zoom", label: "Progress" },
  { id: "process", label: "How it works" },
  { id: "ehcp", label: "EHCP" },
  { id: "parent-portal", label: "Parents" },
  { id: "analytics", label: "Analytics" },
  { id: "why-adaptly", label: "Why Adaptly" },
  { id: "testimonials", label: "Stories" },
  { id: "investors", label: "Investors" },
  { id: "contact", label: "Start" },
];

export default function ScrollRail() {
  const { variant } = useVariant();
  const [active, setActive] = useState(0);
  const [pct, setPct] = useState(0);
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  const scaleY = useTransform(smooth, [0, 1], [0, 1]);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      setPct(Math.round(v * 100));
    });
    return () => unsub();
  }, [scrollYProgress]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = SECTIONS.findIndex((s) => s.id === e.target.id);
            if (i >= 0) setActive(i);
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  if (variant !== "v3") return null;

  const current = SECTIONS[active];
  const total = SECTIONS.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col items-start gap-4 pointer-events-none select-none"
      data-testid="scroll-rail"
    >
      {/* Section counter */}
      <div className="pointer-events-auto">
        <div className="font-display text-6xl leading-none text-ink-900/80 tabular-nums">
          {String(active + 1).padStart(2, "0")}
        </div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.3em] text-ink-500">
          / {String(total).padStart(2, "0")}
        </div>
      </div>

      {/* Vertical progress bar */}
      <div className="relative h-[200px] w-px bg-ink-900/10 overflow-hidden pointer-events-none">
        <motion.div
          style={{ scaleY, transformOrigin: "top" }}
          className="absolute inset-0 bg-ink-900"
        />
      </div>

      {/* Current section label */}
      <div className="pointer-events-none">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading font-bold text-sm text-ink-900 tracking-tight"
        >
          {current.label}
        </motion.div>
        <div className="mt-0.5 text-[9px] uppercase tracking-[0.25em] text-ink-500 tabular-nums">
          {pct}% scrolled
        </div>
      </div>
    </motion.div>
  );
}
