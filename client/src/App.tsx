import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import CookieBanner from "./components/CookieBanner";
import OnboardingTour from "./components/OnboardingTour";
import SessionTimeout from "./components/SessionTimeout";
import AIBestPracticesGate from "./components/AIBestPracticesGate";
import SubscriptionGate from "./components/SubscriptionGate";
import AppLayout from "./components/AppLayout";
import { useApp } from "./contexts/AppContext";
import { UserPreferencesProvider } from "./contexts/UserPreferencesContext";
import { PupilScopeProvider } from "./contexts/PupilScopeContext";
import { useLocation } from "wouter";
import { installRoutePrefetch } from "./lib/prefetch";

// Hub section pages
const SENDHub = lazy(() => import("./pages/hubs/SENDHub"));
const EHCPHub = lazy(() => import("./pages/hubs/EHCPHub"));
const RevisionHubSection = lazy(() => import("./pages/hubs/RevisionHubSection"));
const PlanningHub = lazy(() => import("./pages/hubs/PlanningHub"));
const CommunicationsHub = lazy(() => import("./pages/hubs/CommunicationsHub"));
const ClassroomHub = lazy(() => import("./pages/hubs/ClassroomHub"));

// Core pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Differentiate = lazy(() => import("./pages/Differentiate"));
const Worksheets = lazy(() => import("./pages/Worksheets"));
const Reading = lazy(() => import("./pages/Reading"));
const Templates = lazy(() => import("./pages/Templates"));
const PastPapers = lazy(() => import("./pages/PastPapers"));
const RevisionHub = lazy(() => import("./pages/RevisionHub"));
const Children = lazy(() => import("./pages/Children"));
const History = lazy(() => import("./pages/History"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Ideas = lazy(() => import("./pages/Ideas"));
const ParentPortal = lazy(() => import("./pages/ParentPortal"));
const Settings = lazy(() => import("./pages/Settings"));
const VisualTimetable = lazy(() => import("./pages/VisualTimetable"));
const BehaviourTracking = lazy(() => import("./pages/BehaviourTracking"));
const Attendance = lazy(() => import("./pages/Attendance"));
const PupilComments = lazy(() => import("./pages/PupilComments"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminTelemetry = lazy(() => import("./pages/admin/telemetry"));
const AdminFeatureFlags = lazy(() => import("./pages/admin/feature-flags"));
const SuperAdminUsers = lazy(() => import("./pages/SuperAdminUsers"));

// AI Tools
const IEPGenerator = lazy(() => import("./pages/tools/IEPGenerator"));
const SocialStories = lazy(() => import("./pages/tools/SocialStories"));
const LessonPlanner = lazy(() => import("./pages/tools/LessonPlanner"));
const ReportComments = lazy(() => import("./pages/tools/ReportComments"));
const PupilPassport = lazy(() => import("./pages/tools/PupilPassport"));
const SmartTargets = lazy(() => import("./pages/tools/SmartTargets"));
const BehaviourPlan = lazy(() => import("./pages/tools/BehaviourPlan"));
const CommunicationBoard = lazy(() => import("./pages/tools/CommunicationBoard"));
const QuizGenerator = lazy(() => import("./pages/tools/QuizGenerator"));
const RubricGenerator = lazy(() => import("./pages/tools/RubricGenerator"));
const TextRewriter = lazy(() => import("./pages/tools/TextRewriter"));
const FlashCards = lazy(() => import("./pages/tools/FlashCards"));
const MediumTermPlanner = lazy(() => import("./pages/tools/MediumTermPlanner"));
const ComprehensionGenerator = lazy(() => import("./pages/tools/ComprehensionGenerator"));
const ExitTicket = lazy(() => import("./pages/tools/ExitTicket"));
const VocabularyBuilder = lazy(() => import("./pages/tools/VocabularyBuilder"));
const WellbeingSupport = lazy(() => import("./pages/tools/WellbeingSupport"));
const RiskAssessment = lazy(() => import("./pages/tools/RiskAssessment"));

// SEND "Connected Studios" — six flagship SEND tools (T1-T6)
const ConnectedResourceGenerator = lazy(() => import("./pages/tools/ConnectedResourceGenerator"));
const StoryStudio = lazy(() => import("./pages/tools/StoryStudio"));
const ActivityGenerator = lazy(() => import("./pages/tools/ActivityGenerator"));
const VisualLearningStudio = lazy(() => import("./pages/tools/VisualLearningStudio"));
const AdaptationHub = lazy(() => import("./pages/tools/AdaptationHub"));
const TeachingAgent = lazy(() => import("./pages/tools/TeachingAgent"));
const ParentNewsletter = lazy(() => import("./pages/tools/ParentNewsletter"));
const PresentationMaker = lazy(() => import("./pages/tools/PresentationMaker"));
const CreateExamPaper = lazy(() => import("./pages/tools/CreateExamPaper"));

// Legal & Compliance
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const AIGovernance = lazy(() => import("./pages/AIGovernance"));
const DPA = lazy(() => import("./pages/DPA"));
const Safeguarding = lazy(() => import("./pages/Safeguarding"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));

// UX / misc
const Pricing = lazy(() => import("./pages/Pricing"));
const HelpCentre = lazy(() => import("./pages/HelpCentre"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const SendScreener = lazy(() => import("./pages/SendScreener"));
const AcademicScreenings = lazy(() => import("./pages/AcademicScreenings"));
const QuizGame = lazy(() => import("./pages/QuizGame"));
const QuizJoin = lazy(() => import("./pages/QuizJoin"));
const SharedWorksheet = lazy(() => import("./pages/SharedWorksheet"));
const QuizBuilder = lazy(() => import("./pages/QuizBuilder"));
const DailyBriefing = lazy(() => import("./pages/DailyBriefing"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

// Connectivity (pupil profile, pipelines, scheduler, skill ladder, daily work)
const PupilProfile = lazy(() => import("./pages/PupilProfile"));
const PipelinesIndex = lazy(() => import("./pages/Pipelines"));
const PipelineDetail = lazy(() => import("./pages/Pipelines").then(m => ({ default: m.PipelineDetail })));
const Scheduler = lazy(() => import("./pages/Scheduler"));
const SkillLadder = lazy(() => import("./pages/SkillLadder"));
const DailyWork = lazy(() => import("./pages/DailyWork"));
const PupilPassportShare = lazy(() => import("./pages/PupilPassportShare"));
const PupilCompanion = lazy(() => import("./pages/PupilCompanion"));

// FEAT-PC4 — Curriculum coverage map ("Ofsted view"). Behind the
// COVERAGE_MAP_ENABLED feature flag; when off, the page itself renders an
// opt-in panel rather than 404, so the route can stay registered safely.
const CurriculumCoverage = lazy(() => import("./pages/CurriculumCoverage"));

// PR-M4-followup — maths-only AI SVG probe. Direct-URL access only at
// /diagram-probe; deliberately not added to the sidebar. Used to decide
// whether to re-enable AI SVG in the production maths pipeline. The
// server endpoint enforces maths-only.
const DiagramProbe = lazy(() => import("./pages/DiagramProbe"));

function PageLoader() {
  // Skeleton shell — feels closer to the real layout than a centred spinner,
  // and removes the layout shift jolt when lazy chunks finish loading.
  return (
    <div
      className="min-h-[60vh] w-full px-4 sm:px-6 lg:px-8 py-8 animate-pulse"
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-1/3 rounded-md bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-32 rounded-lg bg-muted" />
          <div className="h-32 rounded-lg bg-muted" />
          <div className="h-32 rounded-lg bg-muted" />
        </div>
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
      </div>
      <span className="sr-only">Loading&hellip;</span>
    </div>
  );
}

function SessionLoader({
  error,
  onRetry,
  onSignIn,
}: {
  error?: string | null;
  onRetry?: () => void;
  onSignIn?: () => void;
}) {
  // A delayed service startup should never leave a teacher on an indefinite
  // skeleton. Offer a clear, keyboard-accessible recovery state after the
  // session request reaches its bounded timeout.
  if (error) {
    return (
      <main className="min-h-screen grid place-items-center bg-background p-6" aria-labelledby="session-recovery-title">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-amber-100 text-amber-800 text-lg font-semibold" aria-hidden="true">!</div>
          <h1 id="session-recovery-title" className="text-lg font-semibold text-foreground">We are still opening your workspace</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={onRetry} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">Try again</button>
            <button type="button" onClick={onSignIn} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">Return to sign in</button>
          </div>
        </section>
      </main>
    );
  }

  // Full-screen skeleton shown while the auth session boots.
  // Mimics the eventual app shell (top bar + sidebar + content) so the
  // transition into the real layout is visually quiet.
  return (
    <div
      className="min-h-screen flex bg-background animate-pulse"
      role="status"
      aria-live="polite"
      aria-label="Loading your session"
    >
      <aside className="hidden lg:block w-60 border-r bg-muted/40 p-4 space-y-3">
        <div className="h-8 w-32 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="space-y-2 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-muted" />
          ))}
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b bg-muted/40 px-6 flex items-center gap-4">
          <div className="h-6 w-24 rounded bg-muted" />
          <div className="ml-auto h-8 w-8 rounded-full bg-muted" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="h-8 w-1/3 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
            <div className="h-40 rounded-lg bg-muted" />
            <div className="h-40 rounded-lg bg-muted" />
            <div className="h-40 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading your session&hellip;</span>
    </div>
  );
}

/**
 * Tiny client-side redirect that uses wouter's navigation rather than
 * window.location.replace — avoids a full document reload and the white
 * flash that comes with it.
 */
function ClientRedirect({ to }: { to: string }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);
  return <PageLoader />;
}

function ProtectedRoutes() {
  const { isLoggedIn, loading, sessionError, retrySession } = useApp();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isLoggedIn && !sessionError) {
      navigate("/login", { replace: true });
    }
  }, [loading, isLoggedIn, sessionError, navigate]);

  if (loading || !isLoggedIn) {
    return <SessionLoader error={sessionError} onRetry={() => { void retrySession(); }} onSignIn={() => navigate("/login", { replace: true })} />;
  }

  return (
    <SubscriptionGate>
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            {/* Hub section landing pages */}
            <Route path="/send-hub" component={SENDHub} />
            <Route path="/ehcp-hub" component={EHCPHub} />
            <Route path="/revision-section" component={RevisionHubSection} />
            <Route path="/planning-hub" component={PlanningHub} />
            <Route path="/communications-hub" component={CommunicationsHub} />
            <Route path="/classroom-hub" component={ClassroomHub} />

            {/* Core */}
            <Route path="/home" component={Home} />
            <Route path="/differentiate" component={Differentiate} />
            <Route path="/worksheets" component={Worksheets} />
            <Route path="/reading" component={Reading} />
            <Route path="/stories">{() => <ClientRedirect to="/reading" />}</Route>
            <Route path="/templates" component={Templates} />
            <Route path="/pupils" component={Children} />
            <Route path="/pupils/:id" component={PupilProfile} />
            <Route path="/children">{() => <ClientRedirect to="/pupils" />}</Route>
            <Route path="/history" component={History} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/coverage" component={CurriculumCoverage} />
            <Route path="/diagram-probe" component={DiagramProbe} />
            <Route path="/ideas" component={Ideas} />
            <Route path="/past-papers" component={PastPapers} />
            <Route path="/revision-hub" component={RevisionHub} />
            <Route path="/settings" component={Settings} />
            <Route path="/visual-timetable" component={VisualTimetable} />
            <Route path="/behaviour-tracking" component={BehaviourTracking} />
            <Route path="/attendance" component={Attendance} />
            <Route path="/pupil-comments" component={PupilComments} />
            <Route path="/admin" component={AdminPanel} />
            <Route path="/admin/telemetry" component={AdminTelemetry} />
            <Route path="/admin/feature-flags" component={AdminFeatureFlags} />
            <Route path="/super-admin/users" component={SuperAdminUsers} />

            {/* Connectivity: pipelines, scheduler, skill ladder, daily work */}
            <Route path="/pipelines" component={PipelinesIndex} />
            <Route path="/pipelines/:id" component={PipelineDetail} />
            <Route path="/scheduler" component={Scheduler} />
            <Route path="/skill-ladder" component={SkillLadder} />
            <Route path="/daily-work" component={DailyWork} />

            {/* SEND and academic screening */}
            <Route path="/send-screener" component={SendScreener} />
            <Route path="/academic-screenings" component={AcademicScreenings} />

            {/* Classroom live tools */}
            <Route path="/quiz-game" component={QuizGame} />
            <Route path="/quiz-builder" component={QuizBuilder} />
            <Route path="/quiz-builder/:id" component={QuizBuilder} />
            <Route path="/daily-briefing" component={DailyBriefing} />

            {/* SEND Tools */}
            <Route path="/tools/iep-generator" component={IEPGenerator} />
            <Route path="/tools/social-stories" component={SocialStories} />
            <Route path="/tools/pupil-passport" component={PupilPassport} />
            <Route path="/tools/smart-targets" component={SmartTargets} />
            <Route path="/tools/behaviour-plan" component={BehaviourPlan} />
            <Route path="/tools/wellbeing-support" component={WellbeingSupport} />
            <Route path="/tools/communication-board" component={CommunicationBoard} />

            {/* SEND Connected Studios (T1-T6) */}
            <Route path="/tools/connected-resource" component={ConnectedResourceGenerator} />
            <Route path="/tools/story-studio" component={StoryStudio} />
            <Route path="/tools/activity-generator" component={ActivityGenerator} />
            <Route path="/tools/visual-learning" component={VisualLearningStudio} />
            <Route path="/tools/adaptation-hub" component={AdaptationHub} />
            <Route path="/tools/teaching-agent" component={TeachingAgent} />

            {/* Planning & Assessment */}
            <Route path="/tools/lesson-planner" component={LessonPlanner} />
            <Route path="/tools/medium-term-planner" component={MediumTermPlanner} />
            <Route path="/tools/quiz-generator" component={QuizGenerator} />
            <Route path="/tools/rubric-generator" component={RubricGenerator} />
            <Route path="/tools/comprehension-generator" component={ComprehensionGenerator} />
            <Route path="/tools/exit-ticket" component={ExitTicket} />
            <Route path="/tools/flash-cards" component={FlashCards} />
            <Route path="/tools/vocabulary-builder" component={VocabularyBuilder} />
            <Route path="/tools/risk-assessment" component={RiskAssessment} />

            {/* Phase E PR-B — Create an Exam Paper. Pure-function assembly
                from the question bank; no AI generation. */}
            <Route path="/tools/create-exam-paper" component={CreateExamPaper} />
            <Route path="/tools/presentation-maker" component={PresentationMaker} />

            {/* Communication */}
            <Route path="/tools/report-comments" component={ReportComments} />
            <Route path="/tools/parent-newsletter" component={ParentNewsletter} />
            <Route path="/tools/text-rewriter" component={TextRewriter} />

            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </AppLayout>
    </SubscriptionGate>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/welcome" component={LandingPage} />
        <Route path="/login" component={Login} />
        <Route path="/reset-password" component={Login} />
        <Route path="/verify-email" component={Login} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/parent-portal" component={ParentPortal} />
        <Route path="/parent-portal/:section" component={ParentPortal} />
        <Route path="/quiz-join" component={QuizJoin} />
        <Route path="/quiz-join/:code" component={QuizJoin} />
        <Route path="/shared/:token" component={SharedWorksheet} />
        <Route path="/share/passport/:token" component={PupilPassportShare} />
        <Route path="/share/companion/:token" component={PupilCompanion} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={Terms} />
        <Route path="/cookie-policy" component={CookiePolicy} />
        <Route path="/accessibility" component={Accessibility} />
        <Route path="/ai-governance" component={AIGovernance} />
        <Route path="/dpa" component={DPA} />
        <Route path="/safeguarding" component={Safeguarding} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/help" component={HelpCentre} />
        <Route>
          <ProtectedRoutes />
        </Route>
      </Switch>
    </Suspense>
  );
}

function AppWithPreferences() {
  const { user } = useApp();
  // Install hover/focus route-chunk prefetcher once per app mount.
  useEffect(() => installRoutePrefetch(), []);
  return (
    <UserPreferencesProvider userId={user?.id}>
      <PupilScopeProvider>
        <TooltipProvider>
          {/* Keyboard skip-to-content link — first focusable element on every page */}
          <a href="#main-content" className="skip-to-content">
            Skip to main content
          </a>
          <Toaster />
          <div id="main-content" tabIndex={-1}>
            <Router />
          </div>
          <CookieBanner />
          <OnboardingTour />
          <AIBestPracticesGate />
          <SessionTimeout />
        </TooltipProvider>
      </PupilScopeProvider>
    </UserPreferencesProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AppProvider>
          <AppWithPreferences />
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
