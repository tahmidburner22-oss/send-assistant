import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { BEFORE_AFTER } from "./lib/data";

// ────────────────────────────────────────────────────────────────────────────
// Before & After Adaptly — sticky stacking ("Projects" pattern from Jack).
//
// On md+, each before/after card is sticky inside its own h-[85vh] panel and
// scales down as later cards take centre stage. Each card's top offset is
// index * 28px and its target scale is 1 - (total - 1 - index) * 0.03 — the
// exact formula from the Jack spec, applied to our six items.
//
// On <md (mobile / small tablet) the original 2-column grid is preserved
// because long sticky stacks on phones can feel like a scroll trap on slow
// devices. We also disable the scroll-driven scale on prefers-reduced-motion.
// ────────────────────────────────────────────────────────────────────────────

export default function CaseStudies() {
  return (
    <section
      id="case-studies"
      data-testid="casestudies-section"
      className="relative py-14 md:py-20 px-6 md:px-12 bg-ink-900 text-cream-100 rounded-t-[2rem] md:rounded-t-[3rem] overflow-hidden"
    >
      {/* Texture */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
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
          <div className="text-xs uppercase tracking-[0.2em] text-honey font-semibold">
            Before &amp; after Adaptly
          </div>
          <h2 className="mt-5 font-heading text-cream-100 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
            The Sunday-evening{" "}
            <span className="font-display italic font-normal text-honey">paperwork</span>{" "}
            is over.
          </h2>
          <p className="mt-6 text-cream-100/70 text-base md:text-lg leading-relaxed">
            Ofsted inspectors compliment our schools on their provisions. SENCOs reclaim
            their weekends. Pupils get the support they are legally entitled to — this year,
            not next.
          </p>
        </div>

        {/* Mobile: original two-column grid (kept for small viewports) */}
        <div
          className="mt-12 md:hidden grid grid-cols-1 gap-5"
          data-testid="case-studies-grid"
        >
          {BEFORE_AFTER.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                delay: (i % 2) * 0.08,
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="glass-dark rounded-3xl p-6 group"
              data-testid={`case-study-${i}`}
            >
              <BeforeAfterBody item={item} />
            </motion.div>
          ))}
        </div>

        {/* md+: sticky stacking cards (Jack Projects pattern) */}
        <div className="hidden md:block mt-16">
          <CaseStudiesStack items={BEFORE_AFTER} />
        </div>

        {/* Compliance chips */}
        <div className="mt-16 md:mt-20 pt-10 border-t border-cream-100/10">
          <div className="text-xs uppercase tracking-[0.2em] text-honey font-semibold">
            Built on a foundation of trust
          </div>
          <div className="mt-6 flex flex-wrap gap-3" data-testid="compliance-chips">
            {[
              "GDPR (UK & EU)",
              "SEND Code of Practice 2015",
              "Children & Families Act 2014",
              "Equality Act 2010",
              "AI Transparency",
              "UK/EU Data Residency",
            ].map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cream-100/20 text-xs md:text-sm text-cream-100/80 backdrop-blur"
              >
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

function CaseStudiesStack({ items }) {
  const total = items.length;
  return (
    <div data-testid="case-studies-stack">
      {items.map((item, i) => (
        <StickyCard key={i} index={i} total={total} item={item} />
      ))}
    </div>
  );
}

function useReducedMotionFlag() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);
  return reduced;
}

function StickyCard({ index, total, item }) {
  const containerRef = useRef(null);
  const reduced = useReducedMotionFlag();

  // Jack spec — final scale of *this* card when the next card has fully
  // overlapped it. A card at index N out of total T scales down to
  // 1 - (T - 1 - N) * 0.03. The last card (N === T-1) holds at 1.
  const targetScale = 1 - (total - 1 - index) * 0.03;
  const topOffset = index * 28;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    // Start scaling once the card reaches the sticky position; complete by the
    // time the next sticky card is fully covering it.
    offset: ["start start", "start -10%"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);

  return (
    <div
      ref={containerRef}
      className="relative h-[85vh] flex items-start justify-center"
      data-testid={`case-study-${index}`}
    >
      <motion.div
        style={{
          // sticky pos
          position: "sticky",
          top: `calc(6rem + ${topOffset}px)`,
          // scale on supported browsers; reduced-motion freezes at scale 1.
          scale: reduced ? 1 : scale,
          // Each later card sits just above the prior one in the stack.
          zIndex: index + 1,
        }}
        className="w-full max-w-4xl mx-auto rounded-[2rem] md:rounded-[2.5rem] border-2 border-[#D7E2EA]/20 bg-ink-900 p-7 md:p-10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-6">
          <span className="font-display text-5xl md:text-6xl text-cream-100/30 leading-none tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-honey font-semibold mt-2">
            Before / After
          </span>
        </div>

        <div className="mt-8">
          <BeforeAfterBody item={item} />
        </div>
      </motion.div>
    </div>
  );
}

function BeforeAfterBody({ item }) {
  return (
    <>
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-cream-100/40 font-semibold">
          Before
        </div>
        <p className="mt-2 text-cream-100/70 line-through decoration-terracotta/50 leading-relaxed">
          {item.before}
        </p>
      </div>
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-cream-100/10" />
        <ArrowRight className="text-honey" size={18} />
        <div className="h-px flex-1 bg-cream-100/10" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-honey font-semibold">
          After
        </div>
        <p className="mt-2 text-cream-100 text-base md:text-lg leading-relaxed font-medium">
          {item.after}
        </p>
      </div>
    </>
  );
}
