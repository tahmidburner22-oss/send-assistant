/**
 * HubStoryboard — numbered storyboard hub layout with a richer, more visual feel.
 *
 * Each step is a horizontal lane with a colour-themed number badge, title, blurb
 * and a row of tool cards (icon + name + short description). The whole hub
 * leads with a gradient hero, ends with an optional tip card AND a compact
 * "All tools in this hub" gallery so every relevant tool is one click away.
 *
 * Accent colours are kept as a fixed map so Tailwind's JIT scanner sees every
 * class literal (rather than depending on `bg-${accent}-600` template strings,
 * which can drop classes from the production build).
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Sparkles, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TOOLS, toolsForHub, type HubId } from "@/lib/tool-registry";

export interface StoryboardStep {
  n: string;
  title: string;
  blurb: string;
  toolIds: string[];
}

type AccentKey =
  | "blue" | "green" | "pink" | "indigo" | "violet" | "teal" | "amber"
  | "rose" | "cyan" | "emerald" | "purple" | "orange";

interface AccentTokens {
  // Hero (page header band)
  heroFrom: string;   // gradient stop 1
  heroVia: string;    // gradient stop 2
  heroTo: string;     // gradient stop 3
  heroRing: string;   // outer ring on the icon tile
  // Step rail
  stepBg: string;     // step number bubble bg
  stepBgSoft: string; // soft tint behind the step row
  stepRail: string;   // vertical connecting line
  stepBorder: string; // step row border
  // Tool cards
  cardBorder: string;
  cardAccent: string; // left bar / chip
  cardChip: string;   // light bg for icon backplate
  cardChipText: string;
  // Tip block
  tipBorder: string;
  tipBg: string;
  tipText: string;
  tipTextSoft: string;
  // "More tools" footer block
  moreFromBg: string;
}

// Fully-spelt-out classes so Tailwind's scanner picks them up.
const ACCENTS: Record<AccentKey, AccentTokens> = {
  blue: {
    heroFrom: "from-blue-500", heroVia: "via-sky-500", heroTo: "to-cyan-500",
    heroRing: "ring-blue-200/60",
    stepBg: "bg-blue-600", stepBgSoft: "bg-blue-50/60", stepRail: "bg-blue-200",
    stepBorder: "border-blue-100",
    cardBorder: "border-blue-100", cardAccent: "bg-blue-500",
    cardChip: "bg-blue-50", cardChipText: "text-blue-600",
    tipBorder: "border-blue-200", tipBg: "bg-blue-50/60",
    tipText: "text-blue-900", tipTextSoft: "text-blue-700/85",
    moreFromBg: "from-blue-50/40",
  },
  green: {
    heroFrom: "from-green-500", heroVia: "via-emerald-500", heroTo: "to-teal-500",
    heroRing: "ring-green-200/60",
    stepBg: "bg-green-600", stepBgSoft: "bg-green-50/60", stepRail: "bg-green-200",
    stepBorder: "border-green-100",
    cardBorder: "border-green-100", cardAccent: "bg-green-500",
    cardChip: "bg-green-50", cardChipText: "text-green-600",
    tipBorder: "border-green-200", tipBg: "bg-green-50/60",
    tipText: "text-green-900", tipTextSoft: "text-green-700/85",
    moreFromBg: "from-green-50/40",
  },
  pink: {
    heroFrom: "from-pink-500", heroVia: "via-rose-500", heroTo: "to-fuchsia-500",
    heroRing: "ring-pink-200/60",
    stepBg: "bg-pink-600", stepBgSoft: "bg-pink-50/60", stepRail: "bg-pink-200",
    stepBorder: "border-pink-100",
    cardBorder: "border-pink-100", cardAccent: "bg-pink-500",
    cardChip: "bg-pink-50", cardChipText: "text-pink-600",
    tipBorder: "border-pink-200", tipBg: "bg-pink-50/60",
    tipText: "text-pink-900", tipTextSoft: "text-pink-700/85",
    moreFromBg: "from-pink-50/40",
  },
  indigo: {
    heroFrom: "from-indigo-500", heroVia: "via-blue-500", heroTo: "to-violet-500",
    heroRing: "ring-indigo-200/60",
    stepBg: "bg-indigo-600", stepBgSoft: "bg-indigo-50/60", stepRail: "bg-indigo-200",
    stepBorder: "border-indigo-100",
    cardBorder: "border-indigo-100", cardAccent: "bg-indigo-500",
    cardChip: "bg-indigo-50", cardChipText: "text-indigo-600",
    tipBorder: "border-indigo-200", tipBg: "bg-indigo-50/60",
    tipText: "text-indigo-900", tipTextSoft: "text-indigo-700/85",
    moreFromBg: "from-indigo-50/40",
  },
  violet: {
    heroFrom: "from-violet-500", heroVia: "via-purple-500", heroTo: "to-fuchsia-500",
    heroRing: "ring-violet-200/60",
    stepBg: "bg-violet-600", stepBgSoft: "bg-violet-50/60", stepRail: "bg-violet-200",
    stepBorder: "border-violet-100",
    cardBorder: "border-violet-100", cardAccent: "bg-violet-500",
    cardChip: "bg-violet-50", cardChipText: "text-violet-600",
    tipBorder: "border-violet-200", tipBg: "bg-violet-50/60",
    tipText: "text-violet-900", tipTextSoft: "text-violet-700/85",
    moreFromBg: "from-violet-50/40",
  },
  teal: {
    heroFrom: "from-teal-500", heroVia: "via-cyan-500", heroTo: "to-sky-500",
    heroRing: "ring-teal-200/60",
    stepBg: "bg-teal-600", stepBgSoft: "bg-teal-50/60", stepRail: "bg-teal-200",
    stepBorder: "border-teal-100",
    cardBorder: "border-teal-100", cardAccent: "bg-teal-500",
    cardChip: "bg-teal-50", cardChipText: "text-teal-600",
    tipBorder: "border-teal-200", tipBg: "bg-teal-50/60",
    tipText: "text-teal-900", tipTextSoft: "text-teal-700/85",
    moreFromBg: "from-teal-50/40",
  },
  amber: {
    heroFrom: "from-amber-500", heroVia: "via-orange-500", heroTo: "to-yellow-500",
    heroRing: "ring-amber-200/60",
    stepBg: "bg-amber-600", stepBgSoft: "bg-amber-50/60", stepRail: "bg-amber-200",
    stepBorder: "border-amber-100",
    cardBorder: "border-amber-100", cardAccent: "bg-amber-500",
    cardChip: "bg-amber-50", cardChipText: "text-amber-600",
    tipBorder: "border-amber-200", tipBg: "bg-amber-50/60",
    tipText: "text-amber-900", tipTextSoft: "text-amber-700/85",
    moreFromBg: "from-amber-50/40",
  },
  rose: {
    heroFrom: "from-rose-500", heroVia: "via-pink-500", heroTo: "to-red-500",
    heroRing: "ring-rose-200/60",
    stepBg: "bg-rose-600", stepBgSoft: "bg-rose-50/60", stepRail: "bg-rose-200",
    stepBorder: "border-rose-100",
    cardBorder: "border-rose-100", cardAccent: "bg-rose-500",
    cardChip: "bg-rose-50", cardChipText: "text-rose-600",
    tipBorder: "border-rose-200", tipBg: "bg-rose-50/60",
    tipText: "text-rose-900", tipTextSoft: "text-rose-700/85",
    moreFromBg: "from-rose-50/40",
  },
  cyan: {
    heroFrom: "from-cyan-500", heroVia: "via-sky-500", heroTo: "to-blue-500",
    heroRing: "ring-cyan-200/60",
    stepBg: "bg-cyan-600", stepBgSoft: "bg-cyan-50/60", stepRail: "bg-cyan-200",
    stepBorder: "border-cyan-100",
    cardBorder: "border-cyan-100", cardAccent: "bg-cyan-500",
    cardChip: "bg-cyan-50", cardChipText: "text-cyan-600",
    tipBorder: "border-cyan-200", tipBg: "bg-cyan-50/60",
    tipText: "text-cyan-900", tipTextSoft: "text-cyan-700/85",
    moreFromBg: "from-cyan-50/40",
  },
  emerald: {
    heroFrom: "from-emerald-500", heroVia: "via-green-500", heroTo: "to-teal-500",
    heroRing: "ring-emerald-200/60",
    stepBg: "bg-emerald-600", stepBgSoft: "bg-emerald-50/60", stepRail: "bg-emerald-200",
    stepBorder: "border-emerald-100",
    cardBorder: "border-emerald-100", cardAccent: "bg-emerald-500",
    cardChip: "bg-emerald-50", cardChipText: "text-emerald-600",
    tipBorder: "border-emerald-200", tipBg: "bg-emerald-50/60",
    tipText: "text-emerald-900", tipTextSoft: "text-emerald-700/85",
    moreFromBg: "from-emerald-50/40",
  },
  purple: {
    heroFrom: "from-purple-500", heroVia: "via-violet-500", heroTo: "to-fuchsia-500",
    heroRing: "ring-purple-200/60",
    stepBg: "bg-purple-600", stepBgSoft: "bg-purple-50/60", stepRail: "bg-purple-200",
    stepBorder: "border-purple-100",
    cardBorder: "border-purple-100", cardAccent: "bg-purple-500",
    cardChip: "bg-purple-50", cardChipText: "text-purple-600",
    tipBorder: "border-purple-200", tipBg: "bg-purple-50/60",
    tipText: "text-purple-900", tipTextSoft: "text-purple-700/85",
    moreFromBg: "from-purple-50/40",
  },
  orange: {
    heroFrom: "from-orange-500", heroVia: "via-amber-500", heroTo: "to-red-500",
    heroRing: "ring-orange-200/60",
    stepBg: "bg-orange-600", stepBgSoft: "bg-orange-50/60", stepRail: "bg-orange-200",
    stepBorder: "border-orange-100",
    cardBorder: "border-orange-100", cardAccent: "bg-orange-500",
    cardChip: "bg-orange-50", cardChipText: "text-orange-600",
    tipBorder: "border-orange-200", tipBg: "bg-orange-50/60",
    tipText: "text-orange-900", tipTextSoft: "text-orange-700/85",
    moreFromBg: "from-orange-50/40",
  },
};

interface Props {
  hubLabel: string;
  hubBlurb: string;
  /** Tailwind colour key. Falls back to indigo if not in the accent map. */
  accent: string;
  breadcrumb?: string;
  homeHref?: string;
  steps: StoryboardStep[];
  /** Tip block shown at the bottom of the hub. */
  tip?: { title: string; body: string };
  /** Hub id used to populate the "All tools in this hub" footer grid. */
  hubId?: HubId;
  /** Hero icon — defaults to Sparkles. */
  heroIcon?: LucideIcon;
}

export default function HubStoryboard({
  hubLabel, hubBlurb, accent, breadcrumb, homeHref = "/home",
  steps, tip, hubId, heroIcon: HeroIcon = Sparkles,
}: Props) {
  const a = ACCENTS[(accent as AccentKey)] ?? ACCENTS.indigo;

  // Resolve all tool ids referenced by the storyboard so we can offer a
  // "More tools in this hub" gallery for anything unused.
  const referencedIds = new Set<string>(steps.flatMap(s => s.toolIds));
  const moreTools = hubId
    ? toolsForHub(hubId).filter(t => !referencedIds.has(t.id))
    : [];

  const totalTools = referencedIds.size + moreTools.length;

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-7">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link href={homeHref}><span className="hover:text-foreground cursor-pointer">Home</span></Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{breadcrumb || hubLabel}</span>
      </motion.div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${a.heroFrom} ${a.heroVia} ${a.heroTo} text-white shadow-xl`}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 w-64 h-64 rounded-full bg-black/10 blur-3xl" />
        {/* Subtle dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm ring-4 ${a.heroRing} flex items-center justify-center shadow-lg`}>
              <HeroIcon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
                {hubLabel}
              </h1>
              <p className="text-sm sm:text-base text-white/90 mt-1.5 leading-relaxed max-w-2xl">
                {hubBlurb}
              </p>
            </div>
          </div>

          {/* Hero stats row */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              {steps.length} step{steps.length === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
              <Wrench className="w-3 h-3" />
              {totalTools} tool{totalTools === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Workflow steps ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-end justify-between mb-3 px-1">
          <div>
            <h2 className="text-base font-bold text-foreground">The workflow</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Walk the routine step-by-step — each step launches the right tool.
            </p>
          </div>
        </div>

        <ol className="space-y-3">
          {steps.map((step, idx) => (
            <motion.li
              key={step.n}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * idx, duration: 0.3 }}
              className={`relative rounded-2xl border ${a.stepBorder} ${a.stepBgSoft} p-4 sm:p-5 backdrop-blur-sm`}
            >
              <div className="flex gap-3 sm:gap-4">
                {/* Step rail */}
                <div className="flex flex-col items-center">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-2xl ${a.stepBg} text-white text-base font-black flex items-center justify-center shadow-md ring-4 ring-white`}>
                    {step.n}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 w-0.5 ${a.stepRail} my-2 rounded-full opacity-70`} />
                  )}
                </div>

                {/* Step body */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1 mb-3">
                    {step.blurb}
                  </p>

                  {/* Tool cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {step.toolIds.map(tid => {
                      const tool = TOOLS.find(t => t.id === tid);
                      if (!tool) return null;
                      const Icon = tool.icon;
                      return (
                        <Link key={tool.id} href={tool.path}>
                          <div className={`group relative overflow-hidden rounded-xl bg-white border ${a.cardBorder} hover:border-foreground/20 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}>
                            {/* Left accent bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${a.cardAccent} opacity-80 group-hover:opacity-100 transition-opacity`} />
                            <div className="flex items-center gap-3 pl-4 pr-3 py-2.5">
                              <div className={`w-9 h-9 rounded-lg ${tool.colour} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                  {tool.label}
                                </div>
                                <div className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                                  {tool.description}
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>

      {/* ── Tip card ─────────────────────────────────────────────────────── */}
      {tip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={`relative overflow-hidden rounded-2xl border ${a.tipBorder} ${a.tipBg} backdrop-blur-sm p-5 shadow-sm`}>
            <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/30 blur-2xl" />
            <div className="relative flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl ${a.stepBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${a.tipText} mb-1`}>{tip.title}</p>
                <p className={`text-xs sm:text-sm ${a.tipTextSoft} leading-relaxed`}>{tip.body}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── More tools in this hub (gallery) ─────────────────────────────── */}
      {moreTools.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`rounded-2xl border border-border/50 bg-gradient-to-br ${a.moreFromBg} to-white p-5 shadow-sm`}
        >
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                More tools in this hub
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Extras you might reach for outside the main workflow.
              </p>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {moreTools.length} extra
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {moreTools.map(tool => {
              const Icon = tool.icon;
              return (
                <Link key={tool.id} href={tool.path}>
                  <div className="group rounded-xl border border-border/60 bg-white hover:border-foreground/20 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <div className={`w-9 h-9 rounded-lg ${tool.colour} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground truncate">
                          {tool.label}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                          {tool.description}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
