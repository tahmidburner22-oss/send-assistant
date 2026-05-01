import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Heart } from "lucide-react";

// Emotional "Why SEND matters" section – pulls heart-strings of investors and educators
// with a focus on the child behind every EHCP, real stats, and a statement of purpose.

const BIG_STATS = [
  { v: "1.6M+", l: "UK pupils with identified SEND needs", src: "Department for Education, 2024" },
  { v: "3–5 yrs", l: "average NHS wait for ADHD/autism assessment", src: "NHS England" },
  { v: "50–200", l: "pupils managed by a single SENCO", src: "National SENCO workload survey" },
  { v: "40%", l: "of SEND pupils identified after age 7", src: "Nuffield Foundation" },
];

export default function About() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section
      ref={ref}
      id="about"
      data-testid="about-section"
      className="relative py-28 md:py-40 px-6 md:px-12"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-terracotta font-semibold" data-testid="about-kicker">
              <Heart size={12} className="fill-terracotta" /> Why this matters
            </div>
            <h2
              className="mt-5 font-heading text-ink-900 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[0.92]"
              data-testid="about-title"
            >
              Behind every EHCP is{" "}
              <span className="font-display italic font-normal text-terracotta">a child</span>{" "}
              who deserves to be seen.
            </h2>

            <div className="mt-8 space-y-6 text-ink-500 text-base md:text-lg leading-relaxed max-w-2xl">
              <p>
                1.6 million children in England are living with special educational needs. Behind
                each number is a pupil with autism, dyslexia, ADHD or complex needs — waiting years
                for an assessment, slipping through a classroom that wasn't designed for them.
              </p>
              <p>
                We built Adaptly because SENCOs shouldn't have to choose between legally compliant
                provisions and their weekends. Because teachers shouldn't need to stay until midnight
                to differentiate a single worksheet. And because children shouldn't fall behind
                waiting for the system to catch up.
              </p>
            </div>

            <div className="mt-10 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-terracotta/10 via-cream-50 to-honey/10 border border-ink-900/5 max-w-2xl">
              <p className="font-display italic text-ink-900 text-2xl md:text-3xl leading-[1.15]">
                "If the system is too slow, we build the tools that let teachers move faster — and
                put every child on a ladder they can actually climb."
              </p>
              <p className="mt-5 text-sm text-ink-500">
                — The Adaptly team · UK-based educators & engineers
              </p>
            </div>
          </div>

          {/* Stats card */}
          <motion.div style={{ y: imgY }} className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="rounded-3xl bg-ink-900 text-cream-100 p-8 md:p-10 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-terracotta/30 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-honey/15 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="text-xs uppercase tracking-[0.25em] text-honey font-semibold">The numbers</div>
                <div className="mt-2 font-heading text-2xl md:text-3xl font-bold leading-tight">
                  A crisis of under-support — and a £2.4B market waiting for a category leader.
                </div>

                <div className="mt-8 space-y-5" data-testid="about-stats">
                  {BIG_STATS.map((s, i) => (
                    <motion.div
                      key={s.l}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ delay: 0.08 * i, duration: 0.6 }}
                      className="flex items-baseline gap-5 pb-5 border-b border-cream-100/10 last:border-0 last:pb-0"
                    >
                      <div className="font-display text-4xl md:text-5xl text-cream-100 leading-none w-28 flex-shrink-0">
                        {s.v}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm md:text-base text-cream-100/90 leading-snug">{s.l}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-cream-100/40">{s.src}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
