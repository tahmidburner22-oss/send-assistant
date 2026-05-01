import { motion } from "framer-motion";
import { BEFORE_AFTER } from "./lib/data";
import { ArrowRight } from "lucide-react";

export default function CaseStudies() {
  return (
    <section
      id="case-studies"
      data-testid="casestudies-section"
      className="relative py-28 md:py-40 px-6 md:px-12 bg-ink-900 text-cream-100 rounded-t-[2rem] md:rounded-t-[3rem] overflow-hidden"
    >
      {/* Texture */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* Glow */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-terracotta/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-honey/10 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] text-honey font-semibold">Before & after Adaptly</div>
          <h2 className="mt-5 font-heading text-cream-100 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
            The Sunday-evening{" "}
            <span className="font-display italic font-normal text-honey">paperwork</span>{" "}
            is over.
          </h2>
          <p className="mt-6 text-cream-100/70 text-base md:text-lg leading-relaxed">
            Ofsted inspectors compliment our schools on their provisions. SENCOs reclaim their weekends.
            Pupils get the support they are legally entitled to — this year, not next.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6" data-testid="case-studies-grid">
          {BEFORE_AFTER.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: (i % 2) * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="glass-dark rounded-3xl p-7 md:p-8 group hover:border-terracotta/50 transition-colors"
              data-testid={`case-study-${i}`}
            >
              <div className="flex items-start gap-5">
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-cream-100/40 font-semibold">Before</div>
                  <p className="mt-2 text-cream-100/70 line-through decoration-terracotta/50 leading-relaxed">
                    {item.before}
                  </p>
                </div>
              </div>
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-cream-100/10" />
                <ArrowRight className="text-honey" size={18} />
                <div className="h-px flex-1 bg-cream-100/10" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-honey font-semibold">After</div>
                <p className="mt-2 text-cream-100 text-base md:text-lg leading-relaxed font-medium">{item.after}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Compliance chips */}
        <div className="mt-20 pt-10 border-t border-cream-100/10">
          <div className="text-xs uppercase tracking-[0.2em] text-honey font-semibold">Built on a foundation of trust</div>
          <div className="mt-6 flex flex-wrap gap-3" data-testid="compliance-chips">
            {[
              "GDPR (UK & EU)",
              "SEND Code of Practice 2015",
              "Children & Families Act 2014",
              "Equality Act 2010",
              "AI Transparency",
              "UK/EU Data Residency",
            ].map((c) => (
              <span key={c} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cream-100/20 text-xs md:text-sm text-cream-100/80 backdrop-blur">
                <span className="w-1.5 h-1.5 rounded-full bg-honey" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
