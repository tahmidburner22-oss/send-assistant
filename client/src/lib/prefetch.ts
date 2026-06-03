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
  "/tools/communication-board": () => import("../pages/tools/CommunicationBoard"),
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

// ═════════════════════════════════════════════════════════════════════════
// Phase A · PR-4 — Week Ahead prefetch
// ─────────────────────────────────────────────────────────────────────────
// Pure helper used by the WeekAheadPanel to warm sessionStorage during idle
// time, so clicking a "Your week, ready to print" card on Monday morning
// renders a worksheet near-instantly. Lives in this file (rather than its
// own) so the prefetch surface area is greppable in one place.
//
// Cache contract:
//   - key:   `weekAhead:{classId}:{yyyy-mm-dd}`
//   - value: JSON-stringified `AIWorksheetResult`
//   - TTL:   one calendar day (key changes at local midnight rollover)
//   - scope: sessionStorage (cleared on tab close)
//
// The helper is intentionally tolerant: every failure mode (sessionStorage
// denied, network down, AI provider 429) is silently absorbed because the
// click path will retry live. We never want a prefetch failure to surface.
// ═════════════════════════════════════════════════════════════════════════

export const WEEK_AHEAD_CACHE_PREFIX = "weekAhead:";

export interface WeekAheadPrefetchTarget {
  /** classId === Child.yearGroup, matching `lib/class-auto-brief.ts`. */
  classId: string;
  /** Subject hint for the brief — empty string means "let the brief decide". */
  subject?: string;
}

function todayCacheStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function weekAheadCacheKey(classId: string, date = todayCacheStamp()): string {
  return `${WEEK_AHEAD_CACHE_PREFIX}${classId}:${date}`;
}

/**
 * Drop every cached entry that doesn't match today's date stamp. Called by
 * the panel on midnight rollover so stale Monday cards aren't served on
 * Tuesday morning. Returns the count of evictions for testability.
 */
export function evictStaleWeekAhead(): number {
  if (typeof sessionStorage === "undefined") return 0;
  const today = todayCacheStamp();
  let evicted = 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(WEEK_AHEAD_CACHE_PREFIX) && !k.endsWith(`:${today}`)) {
        keys.push(k);
      }
    }
    for (const k of keys) {
      try { sessionStorage.removeItem(k); evicted += 1; } catch { /* ignore */ }
    }
  } catch {
    // sessionStorage unavailable — nothing to do.
  }
  return evicted;
}

/**
 * Schedule an idle-time prefetch for each target. The provided
 * `generateOne` callback is responsible for actually building the
 * worksheet (the panel injects `aiGenerateWorksheetFromClassBrief` here so
 * `lib/prefetch.ts` doesn't gain a hard dependency on `lib/ai.ts`).
 *
 * The caller can pass an `AbortSignal` to cancel mid-run.
 *
 * Returns a Promise that resolves once all prefetches have settled. Errors
 * from individual targets are swallowed — see file header.
 */
export async function prefetchWeekAhead(
  targets: WeekAheadPrefetchTarget[],
  generateOne: (target: WeekAheadPrefetchTarget) => Promise<unknown>,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  if (typeof window === "undefined") return;
  if (typeof sessionStorage === "undefined") return;
  if (!shouldPrefetch()) return;

  // First — make space for today.
  evictStaleWeekAhead();

  await new Promise<void>(resolve => {
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (ric) ric(() => resolve(), { timeout: 5000 });
    else setTimeout(resolve, 0);
  });

  for (const target of targets) {
    if (options.signal?.aborted) return;
    const key = weekAheadCacheKey(target.classId);
    try {
      if (sessionStorage.getItem(key)) continue;
    } catch { /* ignore */ }
    try {
      const ws = await generateOne(target);
      if (options.signal?.aborted) return;
      try {
        sessionStorage.setItem(key, JSON.stringify(ws));
      } catch { /* quota — silently drop */ }
    } catch {
      // Live click will retry — keep prefetch quiet.
    }
  }
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
