/**
 * Hover-based route chunk prefetching.
 *
 * Listens once at the document level for `mouseover`/`focusin` events on
 * internal links, and triggers the matching lazy `import()` so the chunk
 * is already in cache by the time the user actually clicks.
 *
 * - Only runs in the browser.
 * - Each route is prefetched at most once per session.
 * - Respects Save-Data and slow connections (skips prefetch then).
 * - No effect on routes we don't recognise — perfectly safe to attach
 *   globally.
 */

type Importer = () => Promise<unknown>;

// Match the lazy import targets in App.tsx exactly. Keep these in lock-step;
// missing entries simply skip prefetch (graceful no-op).
const ROUTE_IMPORTS: Record<string, Importer> = {
  // Hubs
  "/send-hub": () => import("../pages/hubs/SENDHub"),
  "/ehcp-hub": () => import("../pages/hubs/EHCPHub"),
  "/revision-section": () => import("../pages/hubs/RevisionHubSection"),
  "/planning-hub": () => import("../pages/hubs/PlanningHub"),
  "/communications-hub": () => import("../pages/hubs/CommunicationsHub"),
  "/classroom-hub": () => import("../pages/hubs/ClassroomHub"),

  // Core
  "/home": () => import("../pages/Home"),
  "/login": () => import("../pages/Login"),
  "/differentiate": () => import("../pages/Differentiate"),
  "/worksheets": () => import("../pages/Worksheets"),
  "/reading": () => import("../pages/Reading"),
  "/templates": () => import("../pages/Templates"),
  "/pupils": () => import("../pages/Children"),
  "/history": () => import("../pages/History"),
  "/analytics": () => import("../pages/Analytics"),
  "/ideas": () => import("../pages/Ideas"),
  "/past-papers": () => import("../pages/PastPapers"),
  "/revision-hub": () => import("../pages/RevisionHub"),
  "/settings": () => import("../pages/Settings"),
  "/visual-timetable": () => import("../pages/VisualTimetable"),
  "/behaviour-tracking": () => import("../pages/BehaviourTracking"),
  "/attendance": () => import("../pages/Attendance"),
  "/pupil-comments": () => import("../pages/PupilComments"),
  "/admin": () => import("../pages/AdminPanel"),
  "/super-admin/users": () => import("../pages/SuperAdminUsers"),

  // Tools
  "/tools/iep-generator": () => import("../pages/tools/IEPGenerator"),
  "/tools/social-stories": () => import("../pages/tools/SocialStories"),
  "/tools/lesson-planner": () => import("../pages/tools/LessonPlanner"),
  "/tools/report-comments": () => import("../pages/tools/ReportComments"),
  "/tools/pupil-passport": () => import("../pages/tools/PupilPassport"),
  "/tools/smart-targets": () => import("../pages/tools/SmartTargets"),
  "/tools/behaviour-plan": () => import("../pages/tools/BehaviourPlan"),
  "/tools/quiz-generator": () => import("../pages/tools/QuizGenerator"),
  "/tools/rubric-generator": () => import("../pages/tools/RubricGenerator"),
  "/tools/text-rewriter": () => import("../pages/tools/TextRewriter"),
  "/tools/flash-cards": () => import("../pages/tools/FlashCards"),
  "/tools/medium-term-planner": () => import("../pages/tools/MediumTermPlanner"),
  "/tools/comprehension-generator": () => import("../pages/tools/ComprehensionGenerator"),
  "/tools/exit-ticket": () => import("../pages/tools/ExitTicket"),
  "/tools/vocabulary-builder": () => import("../pages/tools/VocabularyBuilder"),
  "/tools/wellbeing-support": () => import("../pages/tools/WellbeingSupport"),
  "/tools/risk-assessment": () => import("../pages/tools/RiskAssessment"),
  "/tools/parent-newsletter": () => import("../pages/tools/ParentNewsletter"),
  "/tools/presentation-maker": () => import("../pages/tools/PresentationMaker"),

  // Misc
  "/pricing": () => import("../pages/Pricing"),
  "/help": () => import("../pages/HelpCentre"),
  "/parent-portal": () => import("../pages/ParentPortal"),
  "/quiz-game": () => import("../pages/QuizGame"),
  "/quiz-builder": () => import("../pages/QuizBuilder"),
  "/daily-briefing": () => import("../pages/DailyBriefing"),
  "/send-screener": () => import("../pages/SendScreener"),

  // Legal
  "/privacy": () => import("../pages/PrivacyPolicy"),
  "/terms": () => import("../pages/Terms"),
  "/accessibility": () => import("../pages/Accessibility"),
  "/ai-governance": () => import("../pages/AIGovernance"),
  "/dpa": () => import("../pages/DPA"),
  "/safeguarding": () => import("../pages/Safeguarding"),
  "/cookie-policy": () => import("../pages/CookiePolicy"),
};

const prefetched = new Set<string>();

function shouldPrefetch(): boolean {
  if (typeof navigator === "undefined") return false;
  // Honour user's data-saver setting.
  const conn = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /(^|-)(2g|slow-2g)$/.test(conn.effectiveType)) return false;
  return true;
}

function pathFromHref(href: string | null): string | null {
  if (!href) return null;
  // Skip absolute URLs to other origins, mailto/tel, anchor-only links.
  if (/^(https?:|mailto:|tel:|#)/i.test(href) && !href.startsWith(window.location.origin)) {
    return null;
  }
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return url.pathname;
  } catch {
    return null;
  }
}

function matchRoute(pathname: string): Importer | null {
  if (ROUTE_IMPORTS[pathname]) return ROUTE_IMPORTS[pathname];
  // Walk up path segments so /tools/iep-generator/123 still hits /tools/iep-generator.
  const parts = pathname.split("/").filter(Boolean);
  for (let i = parts.length; i > 0; i--) {
    const candidate = "/" + parts.slice(0, i).join("/");
    if (ROUTE_IMPORTS[candidate]) return ROUTE_IMPORTS[candidate];
  }
  return null;
}

export function prefetchRoute(pathname: string): void {
  if (!shouldPrefetch()) return;
  if (prefetched.has(pathname)) return;
  const importer = matchRoute(pathname);
  if (!importer) return;
  prefetched.add(pathname);
  importer().catch(() => {
    // Allow a retry next time — the real navigation will surface the error.
    prefetched.delete(pathname);
  });
}

export function installRoutePrefetch(): () => void {
  if (typeof window === "undefined") return () => {};

  const onTrigger = (event: Event) => {
    const target = event.target as Element | null;
    const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!link) return;
    const path = pathFromHref(link.getAttribute("href"));
    if (path) prefetchRoute(path);
  };

  document.addEventListener("mouseover", onTrigger, { passive: true });
  document.addEventListener("focusin", onTrigger);
  document.addEventListener(
    "touchstart",
    onTrigger,
    { passive: true, capture: true } as AddEventListenerOptions
  );

  return () => {
    document.removeEventListener("mouseover", onTrigger);
    document.removeEventListener("focusin", onTrigger);
    document.removeEventListener("touchstart", onTrigger, { capture: true } as EventListenerOptions);
  };
}
