import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Type, Palette, ListChecks, Volume2, Shapes } from "lucide-react";

// Interactive live demo of Adaptly's SEND differentiation — one base worksheet,
// toggleable support profiles that visibly transform the preview.

const PROFILES = [
  { id: "base", label: "Mainstream", icon: Shapes, color: "#22201E" },
  { id: "dyslexia", label: "Dyslexia", icon: Type, color: "#D96C4A" },
  { id: "adhd", label: "ADHD", icon: ListChecks, color: "#E5B96E" },
  { id: "asc", label: "ASC", icon: Palette, color: "#7F8C72" },
  { id: "eal", label: "EAL", icon: Volume2, color: "#D96C4A" },
];

const WORKSHEET = {
  base: {
    title: "Photosynthesis — KS3 Biology",
    instruction: "Explain how plants make their own food using sunlight, water and carbon dioxide.",
    questions: [
      "Define the word 'photosynthesis'.",
      "Name the three ingredients a plant needs.",
      "Where in the plant does photosynthesis happen?",
      "Why are leaves usually green?",
    ],
    tone: "standard",
  },
  dyslexia: {
    title: "Photosynthesis — KS3 Biology",
    instruction: "Read the sentence out loud. Then answer the questions. Use the word bank.",
    questions: [
      "What is photosynthesis? (circle the best answer)",
      "What three things does a plant need? (tick 3)",
      "Where in the plant? Draw an arrow on the picture.",
    ],
    tone: "dyslexia",
    wordbank: ["sunlight", "water", "leaf", "carbon dioxide"],
  },
  adhd: {
    title: "Photosynthesis — 4 quick tasks",
    instruction: "Four short tasks. Tick each box when you finish. Take a 30-second break between tasks.",
    questions: [
      "Task 1 · Write 'photosynthesis' in your book.",
      "Task 2 · List the 3 ingredients.",
      "Task 3 · Label the diagram (2 mins).",
      "Task 4 · Answer: why green?",
    ],
    tone: "adhd",
  },
  asc: {
    title: "Photosynthesis — step by step",
    instruction: "You will complete 4 steps. Each step has one clear question and one correct answer.",
    questions: [
      "Step 1. Photosynthesis means: plants making food. True or False?",
      "Step 2. Plants need: (choose exactly three) sun, water, carbon dioxide, milk.",
      "Step 3. The leaf is where it happens. True or False?",
      "Step 4. Chlorophyll makes leaves green. True or False?",
    ],
    tone: "asc",
  },
  eal: {
    title: "Photosynthesis — picture + words",
    instruction: "Match the English word to the picture. Then answer in full sentences.",
    questions: [
      "Match: sunlight / water / leaf / plant.",
      "Complete: 'Plants need ___, ___ and ___.'",
      "Write one sentence: 'Photosynthesis is ...'",
    ],
    tone: "eal",
    wordbank: ["sunlight", "water", "carbon dioxide", "leaf", "plant"],
  },
};

export default function LiveDifferentiate() {
  const [active, setActive] = useState("base");
  const data = WORKSHEET[active];
  const profile = PROFILES.find((p) => p.id === active);

  const textClass =
    active === "dyslexia"
      ? "font-[OpenDyslexic,system-ui] tracking-wide leading-loose"
      : "";
  const bgTint =
    active === "dyslexia"
      ? "bg-[#FDF6E3]"
      : active === "adhd"
      ? "bg-[#FFFBF3]"
      : active === "asc"
      ? "bg-[#F6F8F2]"
      : active === "eal"
      ? "bg-[#FBF5F0]"
      : "bg-white";

  return (
    <section id="differentiate" data-testid="differentiate-section" className="relative py-28 md:py-40 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.2em] text-terracotta font-semibold flex items-center gap-2">
              <Sparkles size={12} /> SEND differentiation · live demo
            </div>
            <h2 className="mt-5 font-heading text-ink-900 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
              One worksheet.{" "}
              <span className="font-display italic font-normal">Every learner.</span>
            </h2>
            <p className="mt-5 text-ink-500 text-base md:text-lg leading-relaxed">
              Toggle a support profile — watch the same base worksheet reshape itself live. Font, spacing,
              task chunking, scaffolds, word banks, tone — all adapted to the pupil's SEND need in one click.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Toggles */}
          <div className="lg:col-span-4 space-y-3" data-testid="differentiate-toggles">
            {PROFILES.map((p) => {
              const Icon = p.icon;
              const isActive = active === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  data-testid={`differentiate-toggle-${p.id}`}
                  className={`w-full group flex items-center gap-4 p-5 rounded-2xl text-left border transition-all duration-300 ${
                    isActive
                      ? "bg-ink-900 text-cream-100 border-ink-900 shadow-[0_20px_50px_-20px_rgba(217,108,74,0.4)]"
                      : "bg-cream-50 border-ink-900/5 hover:border-terracotta/40 hover:-translate-y-0.5"
                  }`}
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isActive ? "rgba(217,108,74,0.2)" : `${p.color}15`,
                      color: isActive ? "#E5B96E" : p.color,
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-base">{p.label}</div>
                    <div className={`text-xs ${isActive ? "text-cream-100/60" : "text-ink-500"}`}>
                      {p.id === "base" && "Standard curriculum version"}
                      {p.id === "dyslexia" && "Dyslexia-friendly font & spacing"}
                      {p.id === "adhd" && "Chunked into 4 short tasks"}
                      {p.id === "asc" && "Literal, step-by-step instructions"}
                      {p.id === "eal" && "Picture matching + word bank"}
                    </div>
                  </div>
                  {isActive && (
                    <motion.span
                      layoutId="diff-active"
                      className="w-2 h-2 rounded-full bg-honey"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Worksheet preview */}
          <div className="lg:col-span-8" data-testid="differentiate-preview">
            <div className="relative rounded-3xl bg-cream-50 border border-ink-900/5 p-3 md:p-5 shadow-[0_40px_80px_-30px_rgba(34,32,30,0.25)]">
              <div className="flex items-center gap-2 px-2 pb-3">
                <span className="w-2 h-2 rounded-full bg-terracotta" />
                <span className="w-2 h-2 rounded-full bg-honey" />
                <span className="w-2 h-2 rounded-full bg-sage" />
                <div className="ml-auto text-[10px] uppercase tracking-[0.2em] text-ink-500">
                  Auto-adapted · {profile.label}
                </div>
              </div>
              <div className={`relative min-h-[520px] rounded-2xl ${bgTint} p-7 md:p-10 overflow-hidden`}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -18, filter: "blur(6px)" }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className={textClass}
                  >
                    <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500 font-semibold">Worksheet</div>
                    <h3 className="mt-2 font-heading font-bold text-2xl md:text-3xl text-ink-900 leading-tight">
                      {data.title}
                    </h3>
                    <div className="mt-5 p-4 rounded-xl bg-ink-900/5 text-ink-700 text-sm md:text-base leading-relaxed">
                      <span className="font-semibold text-ink-900">Instructions · </span>
                      {data.instruction}
                    </div>

                    <ol className="mt-6 space-y-3">
                      {data.questions.map((q, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 + i * 0.07, duration: 0.5 }}
                          className="flex gap-3 items-start"
                        >
                          <span
                            className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
                            style={{ background: profile.color + "20", color: profile.color }}
                          >
                            {i + 1}
                          </span>
                          <span className={`text-ink-900 text-sm md:text-base ${active === "dyslexia" ? "leading-loose" : "leading-relaxed"}`}>
                            {q}
                          </span>
                        </motion.li>
                      ))}
                    </ol>

                    {data.wordbank && (
                      <div className="mt-7 p-4 rounded-xl border border-dashed border-ink-900/20">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500 font-semibold mb-2">
                          Word bank
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {data.wordbank.map((w) => (
                            <span
                              key={w}
                              className="px-3 py-1.5 rounded-full bg-cream-100 text-ink-900 text-sm font-medium border border-ink-900/10"
                            >
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance pill */}
                    <div className="mt-8 pt-6 border-t border-ink-900/5 flex flex-wrap gap-3 items-center">
                      <span className="inline-flex items-center gap-2 text-xs text-ink-500">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: profile.color }} />
                        Golden-thread QA passed
                      </span>
                      <span className="inline-flex items-center gap-2 text-xs text-ink-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                        SEND Code of Practice · Section F
                      </span>
                      <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-terracotta font-semibold">
                        Generated in 8.2s
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
