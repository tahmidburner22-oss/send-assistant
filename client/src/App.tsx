import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import CookieBanner from "./components/CookieBanner";
import OnboardingTour from "./components/OnboardingTour";
import SessionTimeout from "./components/SessionTimeout";
import AIBestPracticesGate from "./components/AIBestPracticesGate";
import SubscriptionGate from "./components/SubscriptionGate";

// Core pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Differentiate from "./pages/Differentiate";
import Worksheets from "./pages/Worksheets";
import Stories from "./pages/Stories";
import Templates from "./pages/Templates";
import PastPapers from "./pages/PastPapers";
import RevisionHub from "./pages/RevisionHub";
import Children from "./pages/Children";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Ideas from "./pages/Ideas";
import ParentPortal from "./pages/ParentPortal";
import Settings from "./pages/Settings";
import VisualTimetable from "./pages/VisualTimetable";
import BehaviourTracking from "./pages/BehaviourTracking";
import Attendance from "./pages/Attendance";
import PupilComments from "./pages/PupilComments";
import AdminPanel from "./pages/AdminPanel";

// New AI Tools
import IEPGenerator from "./pages/tools/IEPGenerator";
import SocialStories from "./pages/tools/SocialStories";
import LessonPlanner from "./pages/tools/LessonPlanner";
import ReportComments from "./pages/tools/ReportComments";
import PupilPassport from "./pages/tools/PupilPassport";
import SmartTargets from "./pages/tools/SmartTargets";
import BehaviourPlan from "./pages/tools/BehaviourPlan";
import QuizGenerator from "./pages/tools/QuizGenerator";
import RubricGenerator from "./pages/tools/RubricGenerator";
import TextRewriter from "./pages/tools/TextRewriter";
import FlashCards from "./pages/tools/FlashCards";
import MediumTermPlanner from "./pages/tools/MediumTermPlanner";
import ComprehensionGenerator from "./pages/tools/ComprehensionGenerator";
import ExitTicket from "./pages/tools/ExitTicket";
import VocabularyBuilder from "./pages/tools/VocabularyBuilder";
import WellbeingSupport from "./pages/tools/WellbeingSupport";
import ParentNewsletter from "./pages/tools/ParentNewsletter";

// Legal & Compliance
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Accessibility from "./pages/Accessibility";
import AIGovernance from "./pages/AIGovernance";
import DPA from "./pages/DPA";
import CookiePolicy from "./pages/CookiePolicy";

// UX
import Pricing from "./pages/Pricing";
import HelpCentre from "./pages/HelpCentre";
import Onboarding from "./pages/Onboarding";
import SendScreener from "./pages/SendScreener";
import QuizGame from "./pages/QuizGame";
import QuizJoin from "./pages/QuizJoin";
import QuizBuilder from "./pages/QuizBuilder";
import DailyBriefing from "./pages/DailyBriefing";

import AppLayout from "./components/AppLayout";
import { useApp } from "./contexts/AppContext";
import { UserPreferencesProvider } from "./contexts/UserPreferencesContext";
import { useLocation } from "wouter";

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
      <Switch>
        {/* Core */}
        <Route path="/home" component={Home} />
        <Route path="/differentiate" component={Differentiate} />
        <Route path="/worksheets" component={Worksheets} />
        <Route path="/stories" component={Stories} />
        <Route path="/templates" component={Templates} />
        <Route path="/children" component={Children} />
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

        {/* Communication */}
        <Route path="/tools/report-comments" component={ReportComments} />
        <Route path="/tools/parent-newsletter" component={ParentNewsletter} />
        <Route path="/tools/text-rewriter" component={TextRewriter} />

        <Route component={NotFound} />
      </Switch>
    </AppLayout>
    </SubscriptionGate>
  );
}

function Router() {
  return (
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
