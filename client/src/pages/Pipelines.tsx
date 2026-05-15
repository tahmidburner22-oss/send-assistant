/**
 * Pipelines — `/pipelines` lists every named workflow.
 * `/pipelines/:id` renders a numbered stepper with deep-links into each
 * tool. Step completion persists per pupil in localStorage so a SENCO
 * can pause the Annual Review pipeline halfway through and resume.
 */
import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight, Workflow, ArrowRight, CheckCircle2, RotateCcw, Clock,
} from "lucide-react";
import {
  PIPELINES, getPipeline, pipelineSteps, getPipelineProgress,
  markStepComplete, resetPipelineProgress,
} from "@/lib/pipelines";
import { usePupilScope } from "@/contexts/PupilScopeContext";
import { useApp } from "@/contexts/AppContext";

export default function PipelinesIndex() {
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Link href="/home"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Pipelines</span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
          <Workflow className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">Pipelines</h1>
          <p className="text-sm text-muted-foreground">Multi-tool workflows that mirror the actual job a SENCO is doing.</p>
        </div>
      </div>

      <div className="grid gap-3">
        {PIPELINES.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href={`/pipelines/${p.id}`}>
              <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-black flex-shrink-0">
                    {p.steps.length}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-bold text-foreground">{p.label}</p>
                      <span className="text-[10px] text-muted-foreground">{p.audience}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{p.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 mt-1" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function PipelineDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { pupilId } = usePupilScope();
  const { children } = useApp();
  const pupil = children.find(c => c.id === pupilId);
  const pipeline = getPipeline(id || "");
  const [progress, setProgress] = useState(() => getPipelineProgress(id || "", pupilId));

  useEffect(() => {
    if (!id) return;
    setProgress(getPipelineProgress(id, pupilId));
  }, [id, pupilId]);

  if (!pipeline) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm font-semibold">Pipeline not found.</p>
            <Link href="/pipelines"><span className="text-xs text-brand underline">Back to pipelines</span></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = pipelineSteps(pipeline);

  function handleStep(idx: number, path: string) {
    if (!id) return;
    markStepComplete(id, idx, pupilId);
    setProgress(getPipelineProgress(id, pupilId));
    navigate(path);
  }

  function handleReset() {
    if (!id) return;
    resetPipelineProgress(id, pupilId);
    setProgress(getPipelineProgress(id, pupilId));
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/home"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/pipelines"><span className="hover:text-foreground cursor-pointer">Pipelines</span></Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{pipeline.label}</span>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white font-black flex items-center justify-center flex-shrink-0">
              {pipeline.steps.length}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold leading-tight">{pipeline.label}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{pipeline.description}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">{pipeline.audience}</Badge>
                {pupil ? (
                  <Badge className="text-[10px] bg-indigo-100 text-indigo-700 border-indigo-200">Scoped to {pupil.name}</Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">No pupil scoped — set one in the top bar to track per-pupil progress.</span>
                )}
                {progress.completed.length > 0 && (
                  <button onClick={handleReset} className="text-[10px] text-muted-foreground hover:text-foreground underline flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Reset progress
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ol className="space-y-3">
        {steps.map((step, idx) => {
          const Icon = step.tool.icon;
          const done = progress.completed.includes(String(idx));
          const current = progress.current === idx;
          return (
            <motion.li
              key={`${step.toolId}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * idx }}
              className="flex gap-3"
            >
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full text-sm font-black flex items-center justify-center shadow-sm ${
                  done
                    ? "bg-emerald-500 text-white"
                    : current
                      ? "bg-violet-600 text-white"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : step.n.replace(/[^0-9]/g, "") || (idx + 1)}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 w-px ${done ? "bg-emerald-300" : "bg-border"} my-1`} />
                )}
              </div>

              <Card className={`flex-1 ${current ? "border-violet-300 bg-violet-50/40" : ""}`}>
                <CardContent className="p-3 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${step.tool.colour}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{step.heading}</p>
                    <p className="text-[11px] text-muted-foreground">{step.blurb}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1 italic">{step.tool.label}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={done ? "outline" : current ? "default" : "outline"}
                    onClick={() => handleStep(idx, `${step.tool.path}${pupilId ? `?pupilId=${pupilId}` : ""}`)}
                    className="gap-1.5"
                  >
                    {done ? "Re-do" : current ? "Start" : "Open"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.li>
          );
        })}
      </ol>

      {progress.updatedAt > 0 && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          Last activity {new Date(progress.updatedAt).toLocaleString("en-GB")}
        </p>
      )}
    </div>
  );
}
