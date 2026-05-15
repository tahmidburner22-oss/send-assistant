/**
 * OnboardingTour — Interactive first-login feature walkthrough.
 * Improvement #8: Role-aware steps (max ~5 per role).
 * Improvement #9: Anchored coachmarks using element positioning.
 * Shows automatically on first login. Dismissible. Restartable from Settings.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowRight, ArrowLeft, Sparkles, FileText, BookOpen, Users,
  BarChart2, ClipboardCheck, Calendar, MessageSquare, Headphones, Layout, Zap, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { data as dataApi } from "@/lib/api";

const TOUR_KEY       = "send_tour_done";
const TOUR_NEVER_KEY = "send_tour_never";

interface TourStep {
  title: string;
  description: string;
  detail: string;
  icon: React.ReactNode;
  color: string;
  navHint?: string; // data-nav-label value to anchor to
  image: string;
  roles: string[]; // which roles see this step
}

// ── All available steps with role tagging ─────────────────────────────────────
const ALL_STEPS: TourStep[] = [
  {
    title: "Welcome to Adaptly!",
    description: "A quick tour of the features most relevant to your role. You can skip or restart from Settings anytime.",
    detail: "Adaptly is used by teachers, TAs, SENCOs, and school admins across the UK.",
    icon: <Sparkles className="w-5 h-5" />,
    color: "bg-indigo-100 text-indigo-700",
    image: "🏫",
    roles: ["school_admin", "mat_admin", "senco", "teacher", "ta"],
  },
  {
    title: "AI Worksheet Generator",
    description: "Generate differentiated, curriculum-aligned worksheets in under 30 seconds. Choose subject, year group, topic and SEND need.",
    detail: "Tip: use the Differentiate button to create Foundation, Core, Higher and SEND versions of any worksheet.",
    icon: <FileText className="w-5 h-5" />,
    color: "bg-emerald-100 text-emerald-700",
    navHint: "Worksheets",
    image: "📄",
    roles: ["school_admin", "mat_admin", "senco", "teacher"],
  },
  {
    title: "Revision Hub & AI Podcast",
    description: "Upload revision notes and Adaptly converts them into an AI podcast students can listen to — plus an interactive quiz.",
    detail: "Tip: students can interrupt the podcast to ask questions based on their uploaded notes.",
    icon: <Headphones className="w-5 h-5" />,
    color: "bg-cyan-100 text-cyan-700",
    navHint: "Revision Hub",
    image: "🎙️",
    roles: ["school_admin", "senco", "teacher"],
  },
  {
    title: "Pupil Management & Assignments",
    description: "Add pupil profiles with year group and SEND needs. Assign worksheets, track progress, and use auto-marking for instant feedback.",
    detail: "Tip: the Scheduler auto-generates and assigns a new worksheet every week — fully hands-free.",
    icon: <Users className="w-5 h-5" />,
    color: "bg-orange-100 text-orange-700",
    navHint: "Pupils",
    image: "👩‍🎓",
    roles: ["school_admin", "senco", "teacher", "ta"],
  },
  {
    title: "SEND Needs Screener",
    description: "Evidence-based screener covering Dyslexia, ADHD, Autism, Dyspraxia, Dyscalculia, SLCN, Anxiety and MLD with classroom strategies.",
    detail: "Important: this is a screening indicator only — always refer to a qualified professional for formal assessment.",
    icon: <ClipboardCheck className="w-5 h-5" />,
    color: "bg-teal-100 text-teal-700",
    navHint: "SEND Needs Screener",
    image: "🔍",
    roles: ["school_admin", "senco"],
  },
  {
    title: "Parent Portal",
    description: "Parents view their child's work, progress and AI insights. You control exactly what they can see.",
    detail: "Incomplete SEND screeners stay locked behind teacher permission — parents only see completed reports.",
    icon: <MessageSquare className="w-5 h-5" />,
    color: "bg-pink-100 text-pink-700",
    navHint: "Parent Portal",
    image: "👨‍👩‍👧",
    roles: ["school_admin", "senco", "teacher"],
  },
  {
    title: "Attendance & Behaviour",
    description: "Record AM/PM attendance, log behaviour incidents, and generate AI behaviour support plans linked to pupil profiles.",
    detail: "Tip: Bromcom and Arbor users can sync pupil data via Settings → MIS Integration (Premium).",
    icon: <Calendar className="w-5 h-5" />,
    color: "bg-amber-100 text-amber-700",
    navHint: "Attendance",
    image: "📅",
    roles: ["school_admin", "senco", "teacher", "ta"],
  },
  {
    title: "Analytics & Safeguarding",
    description: "View usage stats and pupil progress. AI-flagged safeguarding concerns are logged and your DSL alerted automatically.",
    detail: "Tip: review flagged content in the Admin Panel → Safeguarding.",
    icon: <BarChart2 className="w-5 h-5" />,
    color: "bg-red-100 text-red-700",
    navHint: "Analytics",
    image: "📊",
    roles: ["school_admin", "mat_admin", "senco"],
  },
  {
    title: "You're ready to go!",
    description: "Start by generating your first worksheet — it takes about 15 seconds. Need help? Use the Help Centre anytime.",
    detail: "We read every feedback message. Use the feedback button on any page.",
    icon: <Star className="w-5 h-5" />,
    color: "bg-yellow-100 text-yellow-700",
    image: "🚀",
    roles: ["school_admin", "mat_admin", "senco", "teacher", "ta"],
  },
];

export default function OnboardingTour() {
  const { user } = useApp();
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState(0);
  const [exiting, setExiting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [anchorPos, setAnchorPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Improvement #8: Filter steps by user role
  const steps = ALL_STEPS.filter(s => {
    if (!user) return true;
    return s.roles.includes(user.role);
  });

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(TOUR_NEVER_KEY)) return;
    if (!user.onboardingDone && !localStorage.getItem(TOUR_KEY)) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, [user]);

  // Improvement #9: Anchor position calculation
  const updateAnchorPosition = useCallback(() => {
    const hint = steps[step]?.navHint;
    if (!hint) { setAnchorPos(null); return; }
    const el = document.querySelector<HTMLElement>(`[data-nav-label="${hint}"]`);
    if (!el) { setAnchorPos(null); return; }
    const rect = el.getBoundingClientRect();
    setAnchorPos({ top: rect.top, left: rect.right + 12, width: rect.width });
  }, [step, steps]);

  // Pulse the matching sidebar nav link while step is active
  useEffect(() => {
    const hint = steps[step]?.navHint;
    const els = document.querySelectorAll<HTMLElement>("[data-nav-label]");
    els.forEach(el => {
      if (hint && el.getAttribute("data-nav-label") === hint) el.classList.add("tour-beacon");
      else el.classList.remove("tour-beacon");
    });
    updateAnchorPosition();
    // Update position on scroll/resize
    window.addEventListener("resize", updateAnchorPosition);
    window.addEventListener("scroll", updateAnchorPosition, true);
    return () => {
      els.forEach(el => el.classList.remove("tour-beacon"));
      window.removeEventListener("resize", updateAnchorPosition);
      window.removeEventListener("scroll", updateAnchorPosition, true);
    };
  }, [step, steps, updateAnchorPosition]);

  const dismiss = async () => {
    setExiting(true);
    setTimeout(() => setVisible(false), 280);
    localStorage.setItem(TOUR_KEY, "1");
    try { await dataApi.completeOnboarding(); } catch {}
  };

  const neverShow = () => {
    localStorage.setItem(TOUR_NEVER_KEY, "1");
    dismiss();
  };

  if (!visible || steps.length === 0) return null;

  const cur      = steps[step];
  const progress = ((step + 1) / steps.length) * 100;
  const isFirst  = step === 0;
  const isLast   = step === steps.length - 1;

  // Improvement #9: Position card near the anchored element if possible
  const cardStyle: React.CSSProperties = anchorPos && anchorPos.top > 60 && anchorPos.top < window.innerHeight - 300
    ? { position: "fixed", top: `${anchorPos.top}px`, left: `${anchorPos.left}px`, bottom: "auto", right: "auto" }
    : { position: "fixed", bottom: "20px", right: "20px" };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: exiting ? 0 : 0.32 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-black z-[9998]"
        onClick={dismiss}
      />

      <motion.div
        ref={cardRef}
        key="tour"
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 0.9 : 1, y: exiting ? 24 : 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        style={cardStyle}
        className="z-[9999] w-[350px] max-w-[calc(100vw-24px)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800">
          <motion.div
            className="h-full bg-indigo-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${cur.color}`}>
              {cur.icon}
            </span>
            <span className="text-[11px] font-medium text-gray-400">Step {step + 1} of {steps.length}</span>
          </div>
          <button onClick={dismiss} className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.18 }}
            className="px-4 pb-1"
          >
            <div className="text-2xl mb-2 select-none">{cur.image}</div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-[15px] leading-snug mb-1.5">{cur.title}</h3>
            <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{cur.description}</p>
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 rounded-xl px-3 py-2 flex gap-2 items-start">
              <Zap className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-indigo-700 dark:text-indigo-300 leading-relaxed">{cur.detail}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="px-4 pt-3 pb-3 flex items-center justify-between">
          <div>
            {!isFirst && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isFirst && (
              <button onClick={neverShow} className="text-[11px] text-gray-400 hover:text-gray-600 underline-offset-2 hover:underline transition-colors">
                Don't show again
              </button>
            )}
            <Button size="sm" onClick={() => { if (isLast) dismiss(); else setStep(s => s + 1); }}
              className="h-7 px-3 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
              {isLast ? "Get started" : "Next"}{!isLast && <ArrowRight className="w-3 h-3 ml-1" />}
            </Button>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1 pb-3">
          {steps.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}
              className={`rounded-full transition-all duration-200 ${i === step ? "w-4 h-1.5 bg-indigo-500" : "w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300"}`} />
          ))}
        </div>
      </motion.div>

      {/* Beacon pulse CSS */}
      <style>{`
        .tour-beacon { position: relative; }
        .tour-beacon::after {
          content: ''; position: absolute; right: 8px; top: 50%;
          transform: translateY(-50%); width: 7px; height: 7px;
          background: #6366f1; border-radius: 50%; z-index: 20;
          animation: beaconPulse 1.3s ease-in-out infinite;
        }
        @keyframes beaconPulse {
          0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          60% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(99,102,241,0); }
        }
      `}</style>
    </AnimatePresence>
  );
}
