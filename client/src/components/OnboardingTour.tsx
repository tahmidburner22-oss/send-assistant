import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Sparkles, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { data as dataApi } from "@/lib/api";

const TOUR_KEY = "send_tour_done";
const TOUR_NEVER_KEY = "send_tour_never";

const steps = [
  {
    title: "Welcome to Adaptly! 👋",
    description: "This quick tour will show you the key features. It only takes 2 minutes. You can dismiss it at any time.",
    target: null,
    icon: "✨",
  },
  {
    title: "Generate Worksheets",
    description: "Create differentiated worksheets tailored to any SEND need. Just select the subject, topic, and year group — the AI does the rest.",
    target: "worksheets",
    icon: "📄",
  },
  {
    title: "Create Stories",
    description: "Generate accessible stories with comprehension questions, adapted for your pupils' reading levels and SEND needs.",
    target: "stories",
    icon: "📖",
  },
  {
    title: "Manage Pupils",
    description: "Add pupil profiles, assign work, and track progress. Parents can view and submit work via the Parent Portal.",
    target: "children",
    icon: "👩‍🎓",
  },
  {
    title: "Track Attendance",
    description: "Record AM and PM attendance for all your pupils. View summaries and identify patterns.",
    target: "attendance",
    icon: "📅",
  },
  {
    title: "Admin Panel",
    description: "Admins can manage users, view AI usage logs, configure API keys, and review safeguarding incidents — all in one place.",
    target: "admin",
    icon: "🛡️",
  },
  {
    title: "You're all set! 🎉",
    description: "Explore Adaptly at your own pace. You can restart this tour anytime from Settings.",
    target: null,
    icon: "🚀",
  },
];

export default function OnboardingTour() {
  const { user } = useApp();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    // Never show if user clicked "Never show again"
    if (localStorage.getItem(TOUR_NEVER_KEY)) return;
    // Show tour if user hasn't completed onboarding
    if (!user.onboardingDone && !localStorage.getItem(TOUR_KEY)) {
      setTimeout(() => setVisible(true), 1200);
    }
  }, [user]);

  const dismiss = async () => {
    setVisible(false);
    localStorage.setItem(TOUR_KEY, "1");
    try { await dataApi.completeOnboarding(); } catch {}
  };

  const neverShow = async () => {
    setVisible(false);
    localStorage.setItem(TOUR_NEVER_KEY, "1");
    localStorage.setItem(TOUR_KEY, "1");
    try { await dataApi.completeOnboarding(); } catch {}
  };

  const next = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  const prev = () => setStep(s => Math.max(0, s - 1));

  if (!visible) return null;

  const current = steps[step];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Onboarding tour"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm relative"
        >
          {/* Close / skip button */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-lg">
              {current.icon}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Step {step + 1} of {steps.length}
            </span>
          </div>

          <h3 className="font-semibold text-lg mb-2">{current.title}</h3>
          <p className="text-sm text-muted-foreground mb-5">{current.description}</p>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === step ? "w-6 bg-brand" : "w-1.5 bg-border hover:bg-muted-foreground"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={prev} className="flex-1">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />Back
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1 bg-brand hover:bg-brand/90 text-white"
              onClick={next}
            >
              {step === steps.length - 1 ? "Get Started" : "Next"}
              {step < steps.length - 1 && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
            </Button>
          </div>

          {/* Never show again */}
          <button
            onClick={neverShow}
            className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <EyeOff className="w-3 h-3" />
            Never show this again
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
