import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { TESTIMONIALS } from "./lib/data";

// Testimonials — no portraits. Typography-first quote wall with decorative typography.

export default function Testimonials() {
  const [i, setI] = useState(0);
  const prev = () => setI((p) => (p - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => setI((p) => (p + 1) % TESTIMONIALS.length);
  const t = TESTIMONIALS[i];

  return (
    <section
      id="testimonials"
      data-testid="testimonials-section"
      className="relative py-28 md:py-40 px-6 md:px-12"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">What schools say</div>
            <h2 className="mt-5 font-heading text-ink-900 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
              Trusted by SENCOs{" "}
              <span className="font-display italic font-normal">across the UK.</span>
            </h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={prev}
              data-testid="testimonial-prev"
              aria-label="Previous testimonial"
              className="w-12 h-12 rounded-full border border-ink-900/15 text-ink-900 flex items-center justify-center hover:bg-ink-900 hover:text-cream-100 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              data-testid="testimonial-next"
              aria-label="Next testimonial"
              className="w-12 h-12 rounded-full bg-ink-900 text-cream-100 flex items-center justify-center hover:bg-terracotta transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Featured quote */}
        <div className="relative rounded-3xl bg-gradient-to-br from-cream-50 via-cream-100 to-cream-200/50 border border-ink-900/5 p-8 md:p-14 overflow-hidden">
          <div className="absolute top-6 right-8 opacity-[0.07]">
            <Quote size={220} className="text-terracotta" strokeWidth={1} />
          </div>
          <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-honey/25 blur-3xl pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="flex gap-1 mb-5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} size={16} className="fill-honey text-honey" />
                ))}
              </div>
              <p
                className="font-display italic text-ink-900 text-3xl md:text-5xl lg:text-6xl leading-[1.08] max-w-5xl"
                data-testid={`testimonial-quote-${i}`}
              >
                "{t.quote}"
              </p>
              <div className="mt-10 pt-8 border-t border-ink-900/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-terracotta text-cream-100 flex items-center justify-center font-heading font-bold text-lg">
                  {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div className="font-heading font-bold text-ink-900 text-lg">{t.name}</div>
                  <div className="text-sm text-ink-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Secondary wall */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5" data-testid="testimonial-secondary">
          {TESTIMONIALS.map((tt, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              data-testid={`testimonial-card-${idx}`}
              className={`text-left p-6 rounded-2xl border transition-all duration-300 ${
                idx === i
                  ? "bg-ink-900 text-cream-100 border-ink-900"
                  : "bg-cream-50 text-ink-900 border-ink-900/5 hover:border-terracotta/40 hover:-translate-y-0.5"
              }`}
            >
              <div className={`text-xs mb-3 ${idx === i ? "text-honey" : "text-terracotta"} font-semibold uppercase tracking-[0.2em]`}>
                {idx === i ? "Now reading" : `Read ${idx + 1}`}
              </div>
              <div className="font-heading font-bold leading-tight line-clamp-3 text-base md:text-lg">
                "{tt.quote.slice(0, 90)}…"
              </div>
              <div className={`mt-4 text-xs ${idx === i ? "text-cream-100/70" : "text-ink-500"}`}>
                {tt.name} · {tt.role.split("·")[0].trim()}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
