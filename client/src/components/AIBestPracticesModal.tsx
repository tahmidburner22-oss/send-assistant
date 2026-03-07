import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Eye, Scale, UserCheck, Sparkles, AlertTriangle, CheckCircle2
} from "lucide-react";

interface AIBestPracticesModalProps {
  onAccept: () => void;
}

const practices = [
  {
    icon: Eye,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Check for Bias & Accuracy",
    description: "AI isn't perfect. It may produce inaccurate or biased content. Always review all AI-generated material before sharing with students or parents.",
  },
  {
    icon: Sparkles,
    color: "text-purple-600",
    bg: "bg-purple-50",
    title: "Use the 80/20 Rule",
    description: "Let AI handle the initial 80% as your draft, then add your professional knowledge and final touch as the last 20%. You know your students best.",
  },
  {
    icon: Scale,
    color: "text-amber-600",
    bg: "bg-amber-50",
    title: "Trust Your Professional Judgement",
    description: "Use AI as a starting point, not the final solution. Always adhere to your school's policies, the SEND Code of Practice, and your own professional standards.",
  },
  {
    icon: Shield,
    color: "text-red-600",
    bg: "bg-red-50",
    title: "Protect Student Privacy",
    description: "Avoid including full names, dates of birth, addresses, or other personally identifiable information in AI prompts. Use initials or anonymised descriptions where possible.",
  },
  {
    icon: UserCheck,
    color: "text-green-600",
    bg: "bg-green-50",
    title: "SEND-Specific Responsibility",
    description: "AI-generated EHCP goals, behaviour plans, and SEND strategies must be reviewed by a qualified SENCO before implementation. These tools support — they do not replace — professional SEND expertise.",
  },
  {
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50",
    title: "Safeguarding First",
    description: "Never use AI to make safeguarding decisions. Any safeguarding concern must follow your school's procedures and be reported to your Designated Safeguarding Lead (DSL) immediately.",
  },
];

export default function AIBestPracticesModal({ onAccept }: AIBestPracticesModalProps) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    localStorage.setItem("adaptly_ai_practices_accepted", "true");
    setTimeout(onAccept, 400);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-brand to-brand/80 p-6 text-white flex-shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Best Practices for Using AI</h2>
                <p className="text-white/80 text-sm">Please read before using Adaptly</p>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {practices.map((practice, i) => {
              const Icon = practice.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex gap-3 p-3 rounded-xl border border-border/40 bg-gray-50/50"
                >
                  <div className={`w-9 h-9 rounded-lg ${practice.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4.5 h-4.5 ${practice.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{practice.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{practice.description}</p>
                  </div>
                </motion.div>
              );
            })}

            <div className="text-[11px] text-muted-foreground text-center pt-2 pb-1 leading-relaxed">
              By clicking "I Accept", you agree to Adaptly's{" "}
              <a href="/terms" className="text-brand underline" target="_blank">Terms of Service</a>{" "}
              and{" "}
              <a href="/privacy" className="text-brand underline" target="_blank">Privacy Policy</a>.
              You confirm you are a qualified education professional using this platform in a professional capacity.
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/40 flex-shrink-0 bg-white">
            <Button
              onClick={handleAccept}
              disabled={accepted}
              className="w-full h-12 bg-brand hover:bg-brand/90 text-white font-semibold text-base rounded-xl"
            >
              {accepted ? (
                <><CheckCircle2 className="w-5 h-5 mr-2" /> Accepted — Welcome to Adaptly!</>
              ) : (
                "I Accept — Let's Get Started"
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
