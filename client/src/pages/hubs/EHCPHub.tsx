import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight, ClipboardList, AlertTriangle, CheckCircle2,
  BookOpen, Info, FileText, Lightbulb, Shield, ArrowRight,
  XCircle, FileCheck, ChevronDown, ChevronUp,
} from "lucide-react";
import EHCPPlanGenerator from "@/pages/tools/IEPGenerator";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemAnim = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

export default function EHCPHub() {
  const [showGenerator, setShowGenerator] = useState(false);

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link href="/home"><span className="hover:text-foreground cursor-pointer">Home</span></Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">EHCP Hub</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">EHCP Hub</h1>
            <p className="text-sm text-muted-foreground">Guidance, tools and legal compliance for Education, Health and Care Plans</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-violet-900 mb-1">Key Legal Principle — Section F</p>
              <p className="text-xs text-violet-800 leading-relaxed">
                <strong>Section F must specify exact provision.</strong> It cannot be vague or refer to other documents alone.
                ISP, SSPP and EHCNAR are supporting documents — they do not replace Section F.
                Vague wording can be legally challenged and leaves the child without enforceable protection.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center">
            <Lightbulb className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">How to Integrate Each Document Properly</h2>
        </div>

        <motion.div variants={itemAnim}>
          <Card className="border-indigo-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">1. ISP — Individual Support Plan</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Section F</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Use it to inform Section F — not replace it</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">The ISP handles progress tracking and termly review. It does not remove your obligation to specify exact provision in Section F.</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /><p className="text-xs">Put the <strong>exact support in Section F</strong>, then link to ISP for tracking</p></div>
                <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /><p className="text-xs">Targets reviewed termly through the ISP</p></div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-[10px] font-bold text-emerald-700 mb-1 uppercase tracking-wide">✓ Strong Example</p>
                <p className="text-xs text-emerald-800 italic leading-relaxed">"Daily 1:1 reading intervention for 20 minutes, delivered by a trained teaching assistant. Targets to be reviewed termly through the Individual Support Plan (ISP)."</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-[10px] font-bold text-red-700 mb-1 uppercase tracking-wide">✗ Avoid This</p>
                <p className="text-xs text-red-700 italic">"Support as per ISP" — too vague, not legally enforceable</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemAnim}>
          <Card className="border-purple-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">2. SSPP — School Support &amp; Provision Plan</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">Section F</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Shows how the school will deliver provision</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">The SSPP details delivery logistics. Section F must still contain the specific, measurable provision.</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /><p className="text-xs">Write provision clearly and specifically in Section F first</p></div>
                <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /><p className="text-xs">Add a reference line to SSPP for detailed delivery method</p></div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-[10px] font-bold text-emerald-700 mb-1 uppercase tracking-wide">✓ Strong Example</p>
                <p className="text-xs text-emerald-800 italic leading-relaxed">"A structured phonics intervention (5x per week, 30 minutes, group of no more than 3 pupils). Detailed delivery to be set out in the school's SSPP."</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-[10px] font-bold text-red-700 mb-1 uppercase tracking-wide">✗ Avoid This</p>
                <p className="text-xs text-red-700 italic">"Support will be provided via SSPP" — too vague, not legally enforceable</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemAnim}>
          <Card className="border-amber-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-4 h-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">3. EHCNAR — EHC Needs Assessment Review</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Review Process</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">This is NOT provision — it does not go in Section F</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">EHCNAR belongs in the review process, annual review notes and Section E (outcomes) updates. It is a review mechanism, not a provision document.</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /><p className="text-xs">Reference in the annual review notes</p></div>
                <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" /><p className="text-xs">Use to update Section E outcomes at annual review</p></div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-[10px] font-bold text-emerald-700 mb-1 uppercase tracking-wide">✓ Example Wording</p>
                <p className="text-xs text-emerald-800 italic leading-relaxed">"Provision and outcomes to be reviewed annually through the EHCNAR process."</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-teal-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center"><FileCheck className="w-3.5 h-3.5 text-white" /></div>
              <h3 className="text-sm font-bold text-foreground">Section F Structure — Every Need Should Have</h3>
            </div>
            <div className="space-y-2">
              {[
                { num: "1", label: "Type of support", example: "e.g. 1:1 literacy intervention" },
                { num: "2", label: "Who delivers it", example: "e.g. trained teaching assistant" },
                { num: "3", label: "How often", example: "e.g. daily / 5x per week" },
                { num: "4", label: "How long", example: "e.g. 20 minutes per session" },
                { num: "5", label: "Group size (if relevant)", example: "e.g. 1:1 or group of no more than 3" },
              ].map(item => (
                <div key={item.num} className="flex items-start gap-3 bg-teal-50 border border-teal-100 rounded-lg p-2.5">
                  <div className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{item.num}</div>
                  <div><p className="text-xs font-semibold text-teal-900">{item.label}</p><p className="text-[10px] text-teal-600">{item.example}</p></div>
                </div>
              ))}
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
              <p className="text-[10px] font-bold text-teal-700 mb-1 uppercase tracking-wide">Then optionally add:</p>
              <p className="text-xs text-teal-700">• "Monitored through ISP"</p>
              <p className="text-xs text-teal-700">• "Delivered in line with SSPP"</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-emerald-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Gold Standard Example — Clean and Legally Strong
            </p>
            <p className="text-sm text-emerald-900 italic leading-relaxed">
              "X will receive 1:1 literacy intervention for 20 minutes daily, delivered by a trained teaching assistant. Progress will be reviewed termly through the ISP. Delivery will follow the school's SSPP."
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center"><XCircle className="w-3.5 h-3.5 text-white" /></div>
              <h3 className="text-sm font-bold text-foreground">Common Mistakes — Avoid These</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">These are legally weak and can be challenged:</p>
            <div className="space-y-1.5">
              {["Support as per ISP/SSPP","Access to interventions","Regular support","Provision in line with school policy","Additional adult support as appropriate"].map(mistake => (
                <div key={mistake} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg p-2">
                  <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-700 italic">"{mistake}"</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        {/* EHCP Plan Generator — embedded directly in the hub */}
        <div className="rounded-2xl border border-indigo-200 overflow-hidden">
          <button
            onClick={() => setShowGenerator(v => !v)}
            className="w-full flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-indigo-900">EHCP Plan Generator</p>
              <p className="text-xs text-indigo-700/80 mt-0.5">5-stage AI-assisted EHCP drafting — golden thread QA, compliance scoring &amp; Word export</p>
            </div>
            {showGenerator
              ? <ChevronUp className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
          </button>
          {showGenerator && (
            <div className="border-t border-indigo-200">
              <EHCPPlanGenerator />
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Guidance aligned with the SEND Code of Practice 2015, the Children and Families Act 2014, and the Equality Act 2010.
              All EHCP output must be reviewed by a qualified SENCO before use. This tool provides drafting support only and does not constitute legal advice.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
