import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Pinned zoom parallax. Split layout: copy stays top-left, card zooms bottom-right.
// Card is out of the copy's path so there's no overlap.

export default function ZoomParallax() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 5.4]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-6, 2]);
  const cardX = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const cardY = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const fgOpacity = useTransform(scrollYProgress, [0, 0.35, 0.5], [1, 1, 0]);

  return (
    <section
      ref={ref}
      id="zoom"
      data-testid="zoom-section"
      className="relative"
      style={{ height: "240vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-ink-900">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-terracotta/20 blur-[160px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full bg-honey/15 blur-[160px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative h-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Foreground copy — top/left quadrant */}
          <motion.div
            style={{ opacity: fgOpacity }}
            className="lg:col-span-6 pt-28 lg:pt-0 relative z-20"
            data-testid="zoom-copy"
          >
            <div className="text-xs uppercase tracking-[0.3em] text-honey font-semibold">The moment it matters</div>
            <h2 className="mt-4 font-heading font-bold text-cream-100 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[0.92] tracking-tight">
              Every rung a child climbs —{" "}
              <span className="font-display italic font-normal text-honey">captured.</span>
            </h2>
            <p className="mt-6 text-cream-100/70 text-base md:text-lg leading-relaxed max-w-lg">
              Adaptly doesn't just adapt work. It evidences progress — down to the skill, to the day, to
              the page. The paper trail writes itself.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-cream-100/50">
              <span className="w-8 h-px bg-cream-100/30" />
              Scroll to zoom
            </div>
          </motion.div>

          {/* Zooming card — bottom/right quadrant */}
          <div className="lg:col-span-6 relative h-[55vh] lg:h-full flex items-center justify-center">
            <motion.div
              style={{ scale, rotate, x: cardX, y: cardY }}
              className="origin-center"
              data-testid="zoom-worksheet"
            >
              <div className="w-[280px] md:w-[340px] rounded-2xl bg-cream-50 p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500 font-semibold">
                    Skill Ladder · Mia T · Y7
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-sage/15 text-sage text-[10px] font-bold">Secure</div>
                </div>
                <div className="font-heading font-bold text-ink-900 text-base md:text-lg leading-tight">
                  Phonics & decoding — emerging to secure
                </div>
                <div className="mt-4 space-y-2.5">
                  {[
                    { l: "Emerging", pct: 100, color: "bg-honey" },
                    { l: "Developing", pct: 100, color: "bg-terracotta" },
                    { l: "Secure", pct: 92, color: "bg-sage" },
                  ].map((s) => (
                    <div key={s.l}>
                      <div className="flex justify-between text-[10px] text-ink-500 mb-1">
                        <span>{s.l}</span>
                        <span>{s.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-ink-900/10 overflow-hidden">
                        <div className={`h-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 rounded-xl bg-ink-900/5 text-[11px] text-ink-700 leading-relaxed">
                  <span className="font-semibold">AI note · </span>Mia has moved two rungs in six weeks.
                  Recommend introducing comprehension-focused daily packs next cycle.
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-cream-100/30">
          Evidence · auto-generated · audit-ready
        </div>
      </div>
    </section>
  );
}
