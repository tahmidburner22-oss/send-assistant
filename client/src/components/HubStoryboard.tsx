/**
 * HubStoryboard — replaces tool grids with numbered storyboards.
 * One-shot drop-in: pass a hub label, theme colour and an ordered list of
 * { number, title, blurb, tools[] }.
 *
 * Visual: each step is a horizontal lane with its number badge, title and
 * a small row of pill-style tool cards. The whole thing reads as a process
 * the SENCO is mid-way through, not a feature catalogue.
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ChevronRight } from "lucide-react";
import { TOOLS } from "@/lib/tool-registry";

export interface StoryboardStep {
  n: string;       // "1", "2", …
  title: string;   // "Plan tomorrow"
  blurb: string;
  toolIds: string[];
}

interface Props {
  hubLabel: string;
  hubBlurb: string;
  accent: string;            // tailwind colour key e.g. "green"
  breadcrumb?: string;       // override breadcrumb label
  homeHref?: string;
  steps: StoryboardStep[];
  /** Tip block shown at the bottom of the hub. */
  tip?: { title: string; body: string };
}

export default function HubStoryboard({
  hubLabel, hubBlurb, accent, breadcrumb, homeHref = "/home", steps, tip,
}: Props) {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-7">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link href={homeHref}><span className="hover:text-foreground cursor-pointer">Home</span></Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{breadcrumb || hubLabel}</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-10 h-10 rounded-2xl bg-${accent}-600 flex items-center justify-center shadow-lg shadow-${accent}-200`}>
            <span className="text-white font-black text-sm">{steps.length}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">{hubLabel}</h1>
            <p className="text-sm text-muted-foreground">{hubBlurb}</p>
          </div>
        </div>
      </motion.div>

      <ol className="space-y-4">
        {steps.map((step, idx) => (
          <motion.li
            key={step.n}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * idx }}
            className="relative"
          >
            <div className="flex gap-3">
              {/* Step rail */}
              <div className="flex flex-col items-center">
                <div className={`flex-shrink-0 w-9 h-9 rounded-full bg-${accent}-600 text-white text-sm font-black flex items-center justify-center shadow`}>
                  {step.n}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 w-px bg-${accent}-200 my-1`} />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <h2 className="text-base font-bold text-foreground leading-tight">{step.title}</h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{step.blurb}</p>
                <div className="flex flex-wrap gap-2">
                  {step.toolIds.map(tid => {
                    const tool = TOOLS.find(t => t.id === tid);
                    if (!tool) return null;
                    const Icon = tool.icon;
                    return (
                      <Link key={tool.id} href={tool.path}>
                        <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer border border-border/60">
                          <CardContent className="flex items-center gap-2 px-3 py-1.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tool.colour}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-semibold text-foreground">{tool.label}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.li>
        ))}
      </ol>

      {tip && (
        <Card className={`border-${accent}-100 bg-${accent}-50/40`}>
          <CardContent className="p-4">
            <p className={`text-xs font-semibold text-${accent}-800 mb-1`}>{tip.title}</p>
            <p className={`text-xs text-${accent}-700/80 leading-relaxed`}>{tip.body}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
