import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FileText, Target, ShieldCheck, Users, Sparkles, CheckCircle2 } from "lucide-react";

// EHCP document-assembly section — each section of a live EHCP slides in sequentially
// with golden-thread QA check marks firing as layers complete.

const LAYERS = [
  {
    t: "Section A · Pupil profile",
    d: "Photo, SEND needs, communication preferences, pupil voice.",
    icon: Users,
    color: "#D96C4A",
    contributors: ["Teacher", "Parent", "Pupil"],
  },
  {
    t: "Section B · Educational needs",
    d: "Evidence-based summary across literacy, numeracy, social, sensory.",
    icon: Sparkles,
    color: "#E5B96E",
    contributors: ["SENCO", "Ed. Psych"],
  },
  {
    t: "Section E · SMART outcomes",
    d: "Specific, measurable, time-bound outcomes aligned to national expectations.",
    icon: Target,
    color: "#7F8C72",
    contributors: ["Adaptly AI", "SENCO"],
  },
  {
    t: "Section F · Provisions",
    d: "Exact, legally enforceable provision — golden-thread-checked against statute.",
    icon: ShieldCheck,
    color: "#22201E",
    contributors: ["Adaptly AI", "SENCO", "Local Authority"],
  },
  {
    t: "Section H · Review",
    d: "Scheduled review cycle, attendees, measurable success criteria.",
    icon: FileText,
    color: "#D96C4A",
    contributors: ["All stakeholders"],
  },
];

export default function EhcpBuilder() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="ehcp"
      data-testid="ehcp-section"
      className="relative py-28 md:py-40 px-6 md:px-12"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold flex items-center gap-2">
              <FileText size={12} /> EHCP · document assembly
            </div>
            <h2 className="mt-5 font-heading text-ink-900 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
              A 6-hour EHCP,{" "}
              <span className="font-display italic font-normal text-terracotta">drafted</span>{" "}
              in under 10 minutes.
            </h2>
            <p className="mt-6 text-ink-500 text-base md:text-lg leading-relaxed max-w-lg">
              Adaptly walks the SENCO through five statutory sections — each one pre-filled with
              evidence from the pupil record and QA-checked against the SEND Code of Practice 2015.
              You stay in control. The golden thread holds.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
              {[
                ["Golden-thread QA", "Every provision checked for specificity"],
                ["Multi-voice input", "Teacher · parent · pupil · AI"],
                ["Word export", "Clean document for LA submission"],
                ["Versioned audit", "Every edit timestamped"],
              ].map(([t, d]) => (
                <div key={t} className="p-4 rounded-2xl bg-cream-50 border border-ink-900/5">
                  <div className="font-heading font-bold text-sm text-ink-900 leading-tight">{t}</div>
                  <div className="mt-1 text-[11px] text-ink-500">{d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Document stack */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-3xl bg-gradient-to-b from-cream-50 to-cream-100 border border-ink-900/5 p-5 md:p-7 shadow-[0_40px_90px_-30px_rgba(34,32,30,0.3)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-terracotta" />
                <span className="w-2 h-2 rounded-full bg-honey" />
                <span className="w-2 h-2 rounded-full bg-sage" />
                <div className="ml-auto text-[10px] uppercase tracking-[0.2em] text-ink-500">
                  Jamie K · Year 5 · EHCP draft v2
                </div>
              </div>

              <div className="space-y-3" data-testid="ehcp-layers">
                {LAYERS.map((l, i) => {
                  const Icon = l.icon;
                  return (
                    <motion.div
                      key={l.t}
                      initial={{ opacity: 0, x: 30, scale: 0.98 }}
                      animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
                      transition={{ delay: 0.15 + i * 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="p-5 rounded-2xl bg-white border border-ink-900/5 relative overflow-hidden group"
                      data-testid={`ehcp-layer-${i}`}
                    >
                      <div className="absolute -left-2 top-0 bottom-0 w-1" style={{ background: l.color }} />
                      <div className="flex items-start gap-4">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: l.color + "15", color: l.color }}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="font-heading font-bold text-ink-900 text-base md:text-lg">{l.t}</div>
                            <motion.span
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={inView ? { opacity: 1, scale: 1 } : {}}
                              transition={{ delay: 0.15 + i * 0.18 + 0.4, duration: 0.4 }}
                              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-sage font-semibold"
                            >
                              <CheckCircle2 size={12} /> QA passed
                            </motion.span>
                          </div>
                          <p className="mt-1 text-sm text-ink-500 leading-relaxed">{l.d}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {l.contributors.map((c) => (
                              <span
                                key={c}
                                className="text-[10px] uppercase tracking-[0.15em] font-semibold text-ink-700 bg-ink-900/5 px-2 py-1 rounded-full"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Connecting line to next */}
                      {i < LAYERS.length - 1 && (
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={inView ? { scaleY: 1 } : {}}
                          transition={{ delay: 0.15 + i * 0.18 + 0.5, duration: 0.3 }}
                          className="absolute left-3 -bottom-2 w-px h-3 bg-ink-900/20 origin-top z-10"
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Final footer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.15 + LAYERS.length * 0.18 + 0.2, duration: 0.6 }}
                className="mt-5 p-5 rounded-2xl bg-ink-900 text-cream-100 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-terracotta/20 text-honey flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-heading font-bold">EHCP · compliance score 98%</div>
                  <div className="text-xs text-cream-100/60">Ready for LA submission · 7 min 42 sec</div>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-terracotta text-cream-100 text-xs font-semibold">
                  Export .docx
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
