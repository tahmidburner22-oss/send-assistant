import { motion } from "framer-motion";
import { Bell, Check, TrendingUp } from "lucide-react";

// Teacher-to-parent portal transfer animation — shows staff creating an update
// that smoothly arrives on a parent's mobile in real time.

export default function ParentPortal() {
  return (
    <section id="parent-portal" data-testid="parentportal-section" className="relative py-28 md:py-40 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold">Parent portal</div>
          <h2 className="mt-5 font-heading text-ink-900 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
            Parents who are informed are{" "}
            <span className="font-display italic font-normal text-terracotta">parents who engage.</span>
          </h2>
          <p className="mt-5 text-ink-500 text-base md:text-lg leading-relaxed">
            A teacher creates an update in the Adaptly dashboard. Seconds later, it lands on the parent's phone —
            complete with progress, the Skill Ladder climb and the day's adaptive work. No more lost letters.
            No more chasing signatures.
          </p>
        </div>

        <div className="relative rounded-3xl bg-gradient-to-br from-cream-50 via-cream-100 to-cream-200/60 border border-ink-900/5 p-8 md:p-14 overflow-hidden">
          <div className="absolute -top-20 right-20 w-60 h-60 rounded-full bg-honey/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-terracotta/10 blur-3xl pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Teacher desktop */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 relative rounded-2xl bg-cream-50 border border-ink-900/5 shadow-[0_30px_60px_-30px_rgba(34,32,30,0.25)] p-5"
              data-testid="pp-teacher-dashboard"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-terracotta" />
                <span className="w-2 h-2 rounded-full bg-honey" />
                <span className="w-2 h-2 rounded-full bg-sage" />
                <div className="ml-auto text-[10px] uppercase tracking-[0.2em] text-ink-500">Teacher dashboard</div>
              </div>
              <div className="p-4 rounded-xl bg-ink-900/3 border border-ink-900/5">
                <div className="text-xs text-ink-500 mb-2">New update · Jamie K · Year 5</div>
                <div className="font-heading font-bold text-lg text-ink-900">
                  Weekly progress · Reading comprehension
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-2 rounded-full bg-ink-900/10 overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      whileInView={{ width: "78%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-terracotta to-honey"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-ink-500">
                    <span>Baseline · emerging</span>
                    <span className="text-terracotta font-semibold">Developing · 78%</span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-terracotta/8 border border-terracotta/20 text-sm text-ink-700">
                  "Jamie completed 4/5 daily packs this week. Comprehension up 18%. Continue
                  audio-supported reading pathway."
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <motion.button
                  initial={{ scale: 1 }}
                  whileInView={{ scale: [1, 1.06, 1] }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.6, duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink-900 text-cream-100 text-sm font-medium"
                >
                  Send to parent <Bell size={14} />
                </motion.button>
                <span className="text-xs text-ink-500">· auto-notifies via portal</span>
              </div>
            </motion.div>

            {/* Flying update particle */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: [0, 1, 1, 0], x: ["0%", "30%", "70%", "100%"], y: [0, -30, -60, 0] }}
              viewport={{ once: true }}
              transition={{ duration: 2.2, delay: 2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block absolute left-[48%] top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-terracotta text-cream-100 flex items-center justify-center shadow-lg"
              data-testid="pp-update-pill"
            >
              <Bell size={20} />
            </motion.div>

            {/* Parent phone */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 mx-auto w-[260px] md:w-[300px]"
              data-testid="pp-parent-phone"
            >
              <div className="rounded-[2.2rem] bg-ink-900 p-2 shadow-[0_40px_80px_-20px_rgba(34,32,30,0.4)]">
                <div className="rounded-[1.8rem] bg-cream-50 overflow-hidden">
                  <div className="h-6 bg-ink-900 flex items-center justify-center">
                    <div className="w-20 h-1 rounded-full bg-cream-100/20" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-terracotta/15 flex items-center justify-center">
                        <span className="text-terracotta font-heading font-bold">A</span>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.15em] text-ink-500">Adaptly · now</div>
                        <div className="font-heading font-bold text-sm">New update from school</div>
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 2.8, duration: 0.6 }}
                      className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-cream-100 to-cream-200 border border-ink-900/5"
                    >
                      <div className="text-[10px] uppercase tracking-[0.15em] text-ink-500 font-semibold">
                        Jamie · Reading
                      </div>
                      <div className="mt-1 font-heading font-bold text-base text-ink-900 leading-tight flex items-center gap-2">
                        +18% this week
                        <span className="w-5 h-5 rounded-full bg-sage/20 flex items-center justify-center">
                          <TrendingUp size={12} className="text-sage" strokeWidth={3} />
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-ink-900/10 overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          whileInView={{ width: "78%" }}
                          viewport={{ once: true }}
                          transition={{ delay: 3.2, duration: 1 }}
                          className="h-full bg-terracotta"
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] text-ink-500">
                        <span>Emerging</span>
                        <span className="text-terracotta font-semibold">Developing</span>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 3.6 }}
                      className="mt-4 flex items-center gap-2 text-xs text-sage font-semibold"
                    >
                      <Check size={14} /> Read receipt · 3:14 pm
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
