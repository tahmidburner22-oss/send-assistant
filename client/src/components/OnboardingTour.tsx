import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { data as dataApi } from "@/lib/api";

const TOUR_KEY = "send_tour_done";

const steps = [
  {
    title: "Welcome to Adaptly! 👋",
    description: "This quick tour will show you the key features. It only takes 2 minutes.",
    target: null,
  },
  {
    title: "Generate Worksheets",
    description: "Create differentiated worksheets tailored to any SEND need. Just select the subject, topic, and year group — the AI does the rest.",
    target: "worksheets",
  },
  {
    title: "Create Stories",
    description: "Generate accessible stories with comprehension questions, adapted for your pupils' reading levels and SEND needs.",
    target: "stories",
  },
  {
    title: "Manage Pupils",
    description: "Add pupil profiles, assign work, and track progress. Parents can view and submit work via the Parent Portal.",
    target: "children",
  },
  {
    title: "Track Attendance",
    description: "Record AM and PM attendance for all your pupils. View summaries and identify patterns.",
    target: "attendance",
  },
  {
    title: "You're all set! 🎉",
    description: "Explore the app at your own pace. Visit the Help Centre anytime if you have questions.",
    target: null,
  },
];

export default function OnboardingTour() {
  const { user } = useApp();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    // Show tour if user hasn't completed onboarding
    if (!user.onboardingDone && !localStorage.getItem(TOUR_KEY)) {
      setTimeout(() => setVisible(true), 1000);
    }
  }, [user]);

  const dismiss = async () => {
    setVisible(false);
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
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/20 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Onboarding tour">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm relative"
        >
          <button onClick={dismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="Skip tour">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand" aria-hidden="true" />
            </div>
            <span className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</span>
          </div>

          <h3 className="font-semibold text-lg mb-2">{current.title}</h3>
          <p className="text-sm text-muted-foreground mb-6">{current.description}</p>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-4">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-brand" : "w-1.5 bg-border"}`} />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={prev} className="flex-1">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />Back
              </Button>
            )}
            <Button size="sm" className="flex-1 bg-brand hover:bg-brand/90 text-white" onClick={next}>
              {step === steps.length - 1 ? "Get Started" : "Next"}
              {step < steps.length - 1 && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
