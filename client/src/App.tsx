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

// Core pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Differentiate from "./pages/Differentiate";
import Worksheets from "./pages/Worksheets";
import Stories from "./pages/Stories";
import Templates from "./pages/Templates";
import Children from "./pages/Children";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Ideas from "./pages/Ideas";
import ParentPortal from "./pages/ParentPortal";
import Settings from "./pages/Settings";
import VisualTimetable from "./pages/VisualTimetable";
import BehaviourTracking from "./pages/BehaviourTracking";
import Attendance from "./pages/Attendance";
import AdminPanel from "./pages/AdminPanel";

// Legal & Compliance
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Accessibility from "./pages/Accessibility";
import AIGovernance from "./pages/AIGovernance";
import DPA from "./pages/DPA";

// UX
import Pricing from "./pages/Pricing";
import HelpCentre from "./pages/HelpCentre";
import Onboarding from "./pages/Onboarding";

import AppLayout from "./components/AppLayout";

function ProtectedRoutes() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/home" component={Home} />
        <Route path="/differentiate" component={Differentiate} />
        <Route path="/worksheets" component={Worksheets} />
        <Route path="/stories" component={Stories} />
        <Route path="/templates" component={Templates} />
        <Route path="/children" component={Children} />
        <Route path="/history" component={History} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/ideas" component={Ideas} />
        <Route path="/settings" component={Settings} />
        <Route path="/visual-timetable" component={VisualTimetable} />
        <Route path="/behaviour-tracking" component={BehaviourTracking} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/admin" component={AdminPanel} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
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

      {/* Legal & Compliance (public) */}
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            {/* Global overlays — rendered outside Router so they persist across navigation */}
            <CookieBanner />
            <OnboardingTour />
            <SessionTimeout />
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
