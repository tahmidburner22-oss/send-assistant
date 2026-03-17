import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
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
import { useLocation } from "wouter";

// ── Lazy-loaded pages — each page loads only when the user navigates to it ────
// Core pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Differentiate = lazy(() => import("./pages/Differentiate"));
// Worksheets is the heaviest page (imports ~9.7MB of question banks) — lazy load it
const Worksheets = lazy(() => import("./pages/Worksheets"));
const Stories = lazy(() => import("./pages/Stories"));
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
const SuperAdminUsers = lazy(() => import("./pages/SuperAdminUsers"));

// New AI Tools
const IEPGenerator = lazy(() => import("./pages/tools/IEPGenerator"));
const SocialStories = lazy(() => import("./pages/tools/SocialStories"));
const LessonPlanner = lazy(() => import("./pages/tools/LessonPlanner"));
const ReportComments = lazy(() => import("./pages/tools/ReportComments"));
const PupilPassport = lazy(() => import("./pages/tools/PupilPassport"));
const SmartTargets = lazy(() => import("./pages/tools/SmartTargets"));
const BehaviourPlan = lazy(() => import("./pages/tools/BehaviourPlan"));
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
const ParentNewsletter = lazy(() => import("./pages/tools/ParentNewsletter"));

// Legal & Compliance
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const AIGovernance = lazy(() => import("./pages/AIGovernance"));
const DPA = lazy(() => import("./pages/DPA"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));

// UX
const Pricing = lazy(() => import("./pages/Pricing"));
const HelpCentre = lazy(() => import("./pages/HelpCentre"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const SendScreener = lazy(() => import("./pages/SendScreener"));
const QuizGame = lazy(() => import("./pages/QuizGame"));
const QuizJoin = lazy(() => import("./pages/QuizJoin"));
const QuizBuilder = lazy(() => import("./pages/QuizBuilder"));
const DailyBriefing = lazy(() => import("./pages/DailyBriefing"));

// ── Page loading fallback ─────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoutes() {
  const { isLoggedIn, loading } = useApp();
  const [, navigate] = useLocation();

  // While the session is being restored from the token, show a loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your session&hellip;</p>
        </div>
      </div>
    );
  }

  // Not logged in (or session timed out) — redirect to login
  if (!isLoggedIn) {
    // Use replace so the back button doesn't loop
    window.location.replace("/login");
    return null;
  }

  return (
    <SubscriptionGate>
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Core */}
          <Route path="/home" component={Home} />
          <Route path="/differentiate" component={Differentiate} />
          <Route path="/worksheets" component={Worksheets} />
          {/* Reading section — /stories redirects to /reading for backwards compatibility */}
          <Route path="/reading" component={Reading} />
          <Route path="/stories">{() => { window.location.replace("/reading"); return null; }}</Route>
          <Route path="/templates" component={Templates} />
          <Route path="/pupils" component={Children} />
          <Route path="/children">{() => { window.location.replace("/pupils"); return null; }}</Route>
          <Route path="/history" component={History} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/ideas" component={Ideas} />
          <Route path="/past-papers" component={PastPapers} />
          <Route path="/revision-hub" component={RevisionHub} />
          <Route path="/settings" component={Settings} />
          <Route path="/visual-timetable" component={VisualTimetable} />
          <Route path="/behaviour-tracking" component={BehaviourTracking} />
          <Route path="/attendance" component={Attendance} />
          <Route path="/pupil-comments" component={PupilComments} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/super-admin/users" component={SuperAdminUsers} />

          {/* SEND Screener */}
          <Route path="/send-screener" component={SendScreener} />

          {/* Classroom Tools */}
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
        {/* Auth */}
        <Route path="/" component={Login} />
        <Route path="/login" component={Login} />

        {/* School onboarding wizard (public) */}
        <Route path="/onboarding" component={Onboarding} />

        {/* Parent portal (public with access code) */}
        <Route path="/parent-portal" component={ParentPortal} />
        <Route path="/parent-portal/:section" component={ParentPortal} />

        {/* QuizBlast player join (public) */}
        <Route path="/quiz-join" component={QuizJoin} />
        <Route path="/quiz-join/:code" component={QuizJoin} />

        {/* Legal & Compliance (public) */}
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={Terms} />
        <Route path="/cookie-policy" component={CookiePolicy} />
        <Route path="/accessibility" component={Accessibility} />
        <Route path="/ai-governance" component={AIGovernance} />
        <Route path="/dpa" component={DPA} />

        {/* UX pages (public) */}
        <Route path="/pricing" component={Pricing} />
        <Route path="/help" component={HelpCentre} />

        {/* Protected app routes */}
        <Route>
          <ProtectedRoutes />
        </Route>
      </Switch>
    </Suspense>
  );
}

function AppWithPreferences() {
  const { user } = useApp();
  return (
    <UserPreferencesProvider userId={user?.id}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <CookieBanner />
        <OnboardingTour />
        <AIBestPracticesGate />
        <SessionTimeout />
      </TooltipProvider>
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
