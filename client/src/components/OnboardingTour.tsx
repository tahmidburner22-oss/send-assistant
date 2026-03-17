/**
 * OnboardingTour — Interactive first-login feature walkthrough.
 * Shows automatically on first login. Dismissible. Restartable from Settings.
 */
import { useState, useEffect, useRef } from "react";
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
  navHint?: string;
  image: string;
}

const STEPS: TourStep[] = [
  {
    title: "Welcome to Adaptly!",
    description: "This 60-second tour walks you through the features built specifically for SEND educators. You can skip and restart it anytime from Settings.",
    detail: "Adaptly is used by teachers, TAs, SENCOs, and school admins across the UK.",
    icon: <Sparkles className="w-5 h-5" />,
    color: "bg-indigo-100 text-indigo-700",
    image: "🏫",
  },
  {
    title: "AI Worksheet Generator",
    description: "Generate differentiated, curriculum-aligned worksheets in under 30 seconds. Choose subject, year group, topic and SEND need — the AI writes questions, worked examples, mark scheme and teacher notes.",
    detail: "Tip: use the Differentiate button to instantly create Foundation, Core, Higher and SEND versions of any worksheet.",
    icon: <FileText className="w-5 h-5" />,
    color: "bg-emerald-100 text-emerald-700",
    navHint: "Worksheets",
    image: "📄",
  },
  {
    title: "Revision Hub & AI Podcast",
    description: "Upload any PDF or Word revision notes and Adaptly converts them into a natural AI podcast the student can listen to — plus an interactive quiz and live Q&A.",
    detail: "Tip: students can interrupt the podcast to ask questions. The AI answers based on their specific uploaded notes.",
    icon: <Headphones className="w-5 h-5" />,
    color: "bg-cyan-100 text-cyan-700",
    navHint: "Revision Hub",
    image: "🎙️",
  },
  {
    title: "Accessible Reading & Stories",
    description: "Create reading comprehension stories tailored to your pupils' reading ages and SEND needs. Each story includes comprehension questions and vocabulary support.",
    detail: "Tip: Scenario Swap lets you change the story's setting or characters without rewriting — great for pupil motivation.",
    icon: <BookOpen className="w-5 h-5" />,
    color: "bg-purple-100 text-purple-700",
    navHint: "Reading",
    image: "📖",
  },
  {
    title: "Pupil Management & Assignments",
    description: "Add pupil profiles with year group and SEND needs. Assign worksheets directly, track progress, and use auto-marking for instant AI feedback on submitted work.",
    detail: "Tip: the Scheduler auto-generates and assigns a new worksheet every week — fully hands-free once set up.",
    icon: <Users className="w-5 h-5" />,
    color: "bg-orange-100 text-orange-700",
    navHint: "Pupils",
    image: "👩‍🎓",
  },
  {
    title: "SEND Needs Screener",
    description: "An evidence-based screener covering 8 SEND areas: Dyslexia, ADHD, Autism, Dyspraxia, Dyscalculia, SLCN, Anxiety and MLD. Produces a detailed report with classroom strategies.",
    detail: "Important: this is a screening indicator only — not a diagnosis. Always refer to a qualified professional for formal assessment.",
    icon: <ClipboardCheck className="w-5 h-5" />,
    color: "bg-teal-100 text-teal-700",
    navHint: "SEND Needs Screener",
    image: "🔍",
  },
  {
    title: "Parent Portal",
    description: "Parents get their own login to view their child's assigned work, progress, and AI-generated insights report. You control exactly what they can see.",
    detail: "Tip: incomplete SEND screeners stay locked behind teacher permission — parents can only view completed reports.",
    icon: <MessageSquare className="w-5 h-5" />,
    color: "bg-pink-100 text-pink-700",
    navHint: "Parent Portal",
    image: "👨‍👩‍👧",
  },
  {
    title: "Attendance & Behaviour",
    description: "Record AM/PM attendance, log behaviour incidents and positive reinforcements, and generate AI behaviour support plans. All linked to your pupil profiles.",
    detail: "Tip: Bromcom and Arbor users can sync pupil data automatically via Settings → MIS Integration (Premium plan).",
    icon: <Calendar className="w-5 h-5" />,
    color: "bg-amber-100 text-amber-700",
    navHint: "Attendance",
    image: "📅",
  },
  {
    title: "Planning & Assessment Tools",
    description: "Generate lesson plans, medium-term plans, exit tickets, quizzes, flash cards, rubrics, and end-of-term report comments — all AI-powered and SEND-aware.",
    detail: "Tip: QuizBlast lets you run a live whole-class quiz from any generated question set — students join with a code.",
    icon: <Layout className="w-5 h-5" />,
    color: "bg-violet-100 text-violet-700",
    navHint: "Templates",
    image: "🗂️",
  },
  {
    title: "Analytics & Safeguarding",
    description: "View usage stats and pupil progress. Any AI prompt flagged as a safeguarding concern is automatically logged and your DSL is alerted by email.",
    detail: "Tip: all AI outputs pass through content moderation. Review flagged content in the Admin Panel → Safeguarding.",
    icon: <BarChart2 className="w-5 h-5" />,
    color: "bg-red-100 text-red-700",
    navHint: "Analytics",
    image: "📊",
  },
  {
    title: "You're ready to go!",
    description: "Start by generating your first worksheet — it takes about 15 seconds. Then add your pupils and assign them work.",
    detail: "Need help? Use the Help Centre or the feedback button on any page. We read every message.",
    icon: <Star className="w-5 h-5" />,
    color: "bg-yellow-100 text-yellow-700",
    image: "🚀",
  },
];

export default function OnboardingTour() {
  const { user } = useApp();
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(TOUR_NEVER_KEY)) return;
    if (!user.onboardingDone && !localStorage.getItem(TOUR_KEY)) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, [user]);

  // Pulse the matching sidebar nav link while step is active
  useEffect(() => {
    const hint = STEPS[step]?.navHint;
    const els  = document.querySelectorAll<HTMLElement>("[data-nav-label]");
    els.forEach(el => {
      if (hint && el.getAttribute("data-nav-label") === hint) el.classList.add("tour-beacon");
      else el.classList.remove("tour-beacon");
    });
    return () => els.forEach(el => el.classList.remove("tour-beacon"));
  }, [step]);

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

  if (!visible) return null;

  const cur      = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const isFirst  = step === 0;
  const isLast   = step === STEPS.length - 1;

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
        key="tour"
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 0.9 : 1, y: exiting ? 24 : 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="fixed bottom-5 right-5 z-[9999] w-[350px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
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
            <span className="text-[11px] font-medium text-gray-400">Step {step + 1} of {STEPS.length}</span>
          </div>
          <button onClick={dismiss} className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
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
            <h3 className="font-bold text-gray-900 text-[15px] leading-snug mb-1.5">{cur.title}</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-3">{cur.description}</p>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 flex gap-2 items-start">
              <Zap className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-indigo-700 leading-relaxed">{cur.detail}</p>
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
          {STEPS.map((_, i) => (
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
