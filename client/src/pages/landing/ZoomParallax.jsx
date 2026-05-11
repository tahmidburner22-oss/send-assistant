import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Editorial Swiss Humanism: pinned moments must hand off promptly once their evidence is understood.
// Pinned scroll section. Worksheet card zooms into frame while the copy fades.
// Closing 20% of scroll slides a cream curtain up so the next (cream) section
// blends in with no hard colour break.
//
// Mobile: shorter pin (170vh instead of 220vh) and a smaller card so the
// composition doesn't leave dead space on tall phone viewports.

export default function ZoomParallax() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 6]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-6, 3]);
  const cardX = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const cardY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const fgOpacity = useTransform(scrollYProgress, [0, 0.35, 0.5], [1, 1, 0]);

  // Outro curtain.
  const outroY = useTransform(scrollYProgress, [0.8, 1], ["100%", "0%"]);
  const outroOpacity = useTransform(scrollYProgress, [0.8, 0.92, 1], [0, 0.85, 1]);

  return (
    <section
      ref={ref}
      id="zoom"
      data-testid="zoom-section"
      className="relative h-[135vh] sm:h-[150vh] lg:h-[165vh]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-ink-900">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-terracotta/20 blur-[160px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full bg-honey/15 blur-[160px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] rounded-full bg-sage/10 blur-[140px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative h-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center pt-24 lg:pt-0 pb-20 lg:pb-0">
          <motion.div
            style={{ opacity: fgOpacity }}
            className="lg:col-span-6 relative z-20"
            data-testid="zoom-copy"
          >
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-honey font-semibold">
              The moment it matters
            </div>
            <h2 className="mt-4 font-heading font-bold text-cream-100 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[0.92] tracking-tight">
              Every rung a child climbs,{" "}
              <span className="font-display italic font-normal text-honey">captured.</span>
            </h2>
            <p className="mt-5 sm:mt-6 text-cream-100/70 text-base md:text-lg leading-relaxed max-w-lg">
              Adaptly doesn't just adapt work. It evidences progress. Down to the skill, to the day, to
              the page. The paper trail writes itself.
            </p>
            <div className="mt-6 sm:mt-8 inline-flex items-center gap-3 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-cream-100/50">
              <span className="w-8 h-px bg-cream-100/30" />
              Scroll to climb
            </div>
          </motion.div>

          <div className="lg:col-span-6 relative h-[34vh] sm:h-[42vh] lg:h-full flex items-center justify-center">
            <motion.div
              style={{ scale, rotate, x: cardX, y: cardY }}
              className="origin-center"
              data-testid="zoom-worksheet"
            >
              <div className="w-[260px] sm:w-[300px] md:w-[340px] rounded-2xl bg-cream-50 p-5 sm:p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500 font-semibold">
                    Skill Ladder · Mia T · Y7
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-sage/15 text-sage text-[10px] font-bold">
                    Secure
                  </div>
                </div>
                <div className="font-heading font-bold text-ink-900 text-base md:text-lg leading-tight">
                  Phonics and decoding, emerging to secure
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
                  <span className="font-semibold">AI note: </span>Mia has moved two rungs in six weeks.
                  Recommend introducing comprehension-focused daily packs next cycle.
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-cream-100/30 whitespace-nowrap">
          Evidence · auto-generated · audit-ready
        </div>

        {/* Outro curtain — cream panel slides up so the next cream-backed
            section flows in without a hard colour break. */}
        <motion.div
          style={{ y: outroY, opacity: outroOpacity }}
          aria-hidden
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-cream-100 via-cream-50 to-cream-100"
        />
      </div>
    </section>
  );
}
