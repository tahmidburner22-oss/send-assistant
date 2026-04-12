/**
 * UserPreferencesContext
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages per-user UI preferences:
 *  - Colour theme (brand colour, accent)
 *  - Background wallpaper / gradient for login + dashboard
 *  - Sidebar item visibility (show/hide per nav item)
 *  - Dashboard quick-access card visibility and order
 *  - Preferred subjects shown on dashboard
 *
 * Preferences are stored in localStorage keyed by user ID so each user on the
 * same device has their own settings. They are also synced to the server via
 * the /api/data/preferences endpoint when available.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColourTheme {
  id: string;
  label: string;
  primary: string;   // CSS colour for brand/primary
  accent: string;    // CSS colour for accent
  bg: string;        // Tailwind class for background
  preview: string;   // Hex for preview swatch
}

export interface Wallpaper {
  id: string;
  label: string;
  type: "gradient" | "solid" | "image" | "pattern";
  value: string;     // CSS background value
  preview: string;   // Short CSS for preview thumbnail
}

export interface UserPreferences {
  themeId: string;
  wallpaperId: string;
  customWallpaperUrl?: string;
  sidebarHidden: string[];          // array of nav path strings that are hidden
  dashboardCards: string[];         // ordered list of visible dashboard card ids
  dashboardSubjects: string[];      // subjects shown on dashboard
  dashboardPinnedTools: string[];   // tool paths pinned to dashboard
  showWorksheetLibrary?: boolean;   // show the Library tab in Worksheets (default: false)
  sidebarCollapsed: string[];       // array of sidebar section labels that are collapsed
  cardBorderColor?: string;         // hex colour for card borders e.g. "#10b981", or "none"
  // Icon & Card Appearance
  iconShape?: "rounded" | "circle" | "square";
  iconBorderStyle?: "none" | "subtle" | "bold";
  cardStyle?: "default" | "flat" | "elevated";
  layoutDensity?: "comfortable" | "compact";
  // Home Page Section Toggles
  showContinueSection?: boolean;
  showRecentActivity?: boolean;
  showSubjectBrowser?: boolean;
  showCobsTip?: boolean;
  // School branding
  schoolLogoUrl?: string;
  schoolName?: string;
  // Feature toggles
  show11Plus?: boolean;
}

// ─── Preset themes ────────────────────────────────────────────────────────────

export const COLOUR_THEMES: ColourTheme[] = [
  { id: "default",   label: "Adaptly Blue",    primary: "#6366f1", accent: "#8b5cf6", bg: "bg-white",         preview: "#6366f1" },
  { id: "emerald",   label: "Emerald Green",   primary: "#10b981", accent: "#059669", bg: "bg-white",         preview: "#10b981" },
  { id: "rose",      label: "Rose Pink",       primary: "#f43f5e", accent: "#e11d48", bg: "bg-white",         preview: "#f43f5e" },
  { id: "amber",     label: "Amber Gold",      primary: "#f59e0b", accent: "#d97706", bg: "bg-white",         preview: "#f59e0b" },
  { id: "sky",       label: "Sky Blue",        primary: "#0ea5e9", accent: "#0284c7", bg: "bg-white",         preview: "#0ea5e9" },
  { id: "violet",    label: "Deep Violet",     primary: "#7c3aed", accent: "#6d28d9", bg: "bg-white",         preview: "#7c3aed" },
  { id: "teal",      label: "Teal",            primary: "#14b8a6", accent: "#0d9488", bg: "bg-white",         preview: "#14b8a6" },
  { id: "slate",     label: "Slate Dark",      primary: "#475569", accent: "#334155", bg: "bg-white",         preview: "#475569" },
  { id: "orange",    label: "Burnt Orange",    primary: "#ea580c", accent: "#c2410c", bg: "bg-white",         preview: "#ea580c" },
  { id: "fuchsia",   label: "Fuchsia",         primary: "#d946ef", accent: "#c026d3", bg: "bg-white",         preview: "#d946ef" },
];

// ─── Preset wallpapers ────────────────────────────────────────────────────────

export const WALLPAPERS: Wallpaper[] = [
  { id: "none",         label: "Clean White",       type: "solid",    value: "#ffffff",                                                                                   preview: "#ffffff" },
  { id: "soft-gray",    label: "Soft Gray",         type: "solid",    value: "#f8fafc",                                                                                   preview: "#f8fafc" },
  { id: "indigo-grad",  label: "Indigo Gradient",   type: "gradient", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",                                         preview: "linear-gradient(135deg, #667eea, #764ba2)" },
  { id: "ocean",        label: "Ocean Breeze",      type: "gradient", value: "linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)",                                         preview: "linear-gradient(135deg, #2196F3, #21CBF3)" },
  { id: "sunset",       label: "Sunset",            type: "gradient", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",                                         preview: "linear-gradient(135deg, #f093fb, #f5576c)" },
  { id: "forest",       label: "Forest",            type: "gradient", value: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",                                         preview: "linear-gradient(135deg, #134e5e, #71b280)" },
  { id: "midnight",     label: "Midnight",          type: "gradient", value: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",                            preview: "linear-gradient(135deg, #0f0c29, #302b63)" },
  { id: "peach",        label: "Peach Blossom",     type: "gradient", value: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",                                         preview: "linear-gradient(135deg, #ffecd2, #fcb69f)" },
  { id: "mint",         label: "Fresh Mint",        type: "gradient", value: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",                                         preview: "linear-gradient(135deg, #d4fc79, #96e6a1)" },
  { id: "aurora",       label: "Aurora",            type: "gradient", value: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",                                         preview: "linear-gradient(135deg, #a8edea, #fed6e3)" },
  { id: "royal",        label: "Royal Blue",        type: "gradient", value: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",                                         preview: "linear-gradient(135deg, #141e30, #243b55)" },
  { id: "candy",        label: "Candy",             type: "gradient", value: "linear-gradient(135deg, #f8cdda 0%, #1d2b64 100%)",                                         preview: "linear-gradient(135deg, #f8cdda, #1d2b64)" },
  { id: "dots",         label: "Polka Dots",        type: "pattern",  value: "radial-gradient(circle, #e2e8f0 1px, transparent 1px) 0 0 / 20px 20px, #f8fafc",           preview: "#f8fafc" },
  { id: "grid",         label: "Grid",              type: "pattern",  value: "linear-gradient(#e2e8f0 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, #e2e8f0 1px, transparent 1px) 0 0 / 24px 24px, #f8fafc", preview: "#f8fafc" },
  { id: "diagonal",     label: "Diagonal Lines",    type: "pattern",  value: "repeating-linear-gradient(45deg, #e2e8f0 0, #e2e8f0 1px, #f8fafc 0, #f8fafc 50%) 0 0 / 20px 20px", preview: "#f8fafc" },
];

// ─── Default dashboard cards ──────────────────────────────────────────────────

export const ALL_DASHBOARD_CARDS = [
  { id: "worksheets",    label: "Worksheets",         path: "/worksheets" },
  { id: "differentiate", label: "Differentiate",      path: "/differentiate" },
  { id: "quiz-game",     label: "QuizBlast",          path: "/quiz-game" },
  { id: "revision-hub",  label: "Revision Hub",       path: "/revision-hub" },
  { id: "past-papers",   label: "Past Papers",        path: "/past-papers" },
  { id: "reading",       label: "Reading Hub",        path: "/reading" },
  { id: "children",      label: "Pupils",             path: "/children" },
  { id: "analytics",     label: "Analytics",          path: "/analytics" },
  { id: "daily-briefing","label": "Daily Briefing",   path: "/daily-briefing" },
  { id: "templates",     label: "Pre-made Worksheets",  path: "/templates" },
  { id: "attendance",    label: "Attendance",         path: "/attendance" },
  { id: "behaviour",     label: "Behaviour Tracking", path: "/behaviour-tracking" },
];

export const ALL_SUBJECTS = [
  "English", "Mathematics", "Science", "History", "Geography", "Art & Design",
  "Music", "Physical Education", "Computing", "Design & Technology", "Religious Education",
  "Modern Foreign Languages", "PSHE", "Business Studies", "Drama", "11+ Preparation",
];

const DEFAULT_PREFERENCES: UserPreferences = {
  themeId: "default",
  wallpaperId: "none",
  sidebarHidden: [],
  sidebarCollapsed: [],
  dashboardCards: ALL_DASHBOARD_CARDS.map(c => c.id),
  dashboardSubjects: ["Mathematics", "English", "Science", "History", "Geography"],
  dashboardPinnedTools: [],
  cardBorderColor: "none",
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface UserPreferencesContextType {
  preferences: UserPreferences;
  setTheme: (themeId: string) => void;
  setWallpaper: (wallpaperId: string, customUrl?: string) => void;
  toggleSidebarItem: (path: string) => void;
  isSidebarItemHidden: (path: string) => boolean;
  toggleSidebarSection: (label: string) => void;
  isSidebarSectionCollapsed: (label: string) => boolean;
  setDashboardCards: (cards: string[]) => void;
  setDashboardSubjects: (subjects: string[]) => void;
  toggleDashboardCard: (cardId: string) => void;
  toggleDashboardSubject: (subject: string) => void;
  togglePinnedTool: (path: string) => void;
  setShowWorksheetLibrary: (show: boolean) => void;
  setCardBorderColor: (color: string) => void;
  setIconShape: (shape: "rounded" | "circle" | "square") => void;
  setIconBorderStyle: (style: "none" | "subtle" | "bold") => void;
  setCardStyle: (style: "default" | "flat" | "elevated") => void;
  setLayoutDensity: (density: "comfortable" | "compact") => void;
  setHomeSection: (key: "showContinueSection" | "showRecentActivity" | "showSubjectBrowser" | "showCobsTip", val: boolean) => void;
  updatePreference: (key: keyof UserPreferences, val: any) => void;
  resetPreferences: () => void;
  currentTheme: ColourTheme;
  currentWallpaper: Wallpaper;
  wallpaperStyle: React.CSSProperties;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | null>(null);

function storageKey(userId?: string) {
  return `adaptly_prefs_${userId || "guest"}`;
}

function loadPrefs(userId?: string): UserPreferences {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle new fields added over time
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function savePrefs(prefs: UserPreferences, userId?: string) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
  } catch { /* localStorage full or unavailable */ }
}

// Debounced server sync — saves preferences to the server 1.5s after last change
let _serverSyncTimer: ReturnType<typeof setTimeout> | null = null;
function syncToServer(prefs: UserPreferences) {
  if (_serverSyncTimer) clearTimeout(_serverSyncTimer);
  _serverSyncTimer = setTimeout(async () => {
    try {
      await fetch('/api/data/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          },
        credentials: 'include',
        body: JSON.stringify(prefs),
      });
    } catch { /* Network unavailable — local storage is the fallback */ }
  }, 1500);
}

export function UserPreferencesProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId?: string;
}) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPrefs(userId));

  // Reload when user changes (login/logout) — also fetch from server to get cross-device prefs
  useEffect(() => {
    const local = loadPrefs(userId);
    setPreferences(local);
    // Fetch server preferences and merge (server wins for sidebarCollapsed, local wins for everything else)
    fetch('/api/data/preferences', {
      credentials: "include",
      credentials: 'include',
    })
      .then(r => r.ok ? r.json() : null)
      .then(serverPrefs => {
        if (!serverPrefs || typeof serverPrefs !== 'object') return;
        // Merge: server sidebarCollapsed overrides local (this is the cross-device state)
        const merged: UserPreferences = { ...DEFAULT_PREFERENCES, ...local, ...{
          sidebarCollapsed: serverPrefs.sidebarCollapsed ?? local.sidebarCollapsed ?? [],
        }};
        setPreferences(merged);
        savePrefs(merged, userId);
      })
      .catch(() => { /* server unavailable — use local */ });
  }, [userId]);

  // Apply theme CSS variables to :root whenever theme or card border changes
  useEffect(() => {
    const theme = COLOUR_THEMES.find(t => t.id === preferences.themeId) || COLOUR_THEMES[0];
    document.documentElement.style.setProperty("--brand", theme.primary);
    document.documentElement.style.setProperty("--brand-accent", theme.accent);
    // Card border colour override. When "none", remove the property so CSS falls back to Tailwind border.
    if (preferences.cardBorderColor && preferences.cardBorderColor !== "none") {
      document.documentElement.style.setProperty("--card-border-override", preferences.cardBorderColor);
    } else {
      document.documentElement.style.removeProperty("--card-border-override");
    }
  }, [preferences.themeId, preferences.cardBorderColor]);

  const update = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const next = { ...prev, ...updates };
      savePrefs(next, userId);
      syncToServer(next);
      return next;
    });
  }, [userId]);

  const setTheme = useCallback((themeId: string) => update({ themeId }), [update]);

  const setWallpaper = useCallback((wallpaperId: string, customUrl?: string) => {
    update({ wallpaperId, customWallpaperUrl: customUrl });
  }, [update]);

  const toggleSidebarItem = useCallback((path: string) => {
    setPreferences(prev => {
      const hidden = prev.sidebarHidden.includes(path)
        ? prev.sidebarHidden.filter(p => p !== path)
        : [...prev.sidebarHidden, path];
      const next = { ...prev, sidebarHidden: hidden };
      savePrefs(next, userId);
      syncToServer(next);
      return next;
    });
  }, [userId]);

  const toggleSidebarSection = useCallback((label: string) => {
    setPreferences(prev => {
      const collapsed = (prev.sidebarCollapsed || []).includes(label)
        ? (prev.sidebarCollapsed || []).filter(l => l !== label)
        : [...(prev.sidebarCollapsed || []), label];
      const next = { ...prev, sidebarCollapsed: collapsed };
      savePrefs(next, userId);
      syncToServer(next);
      return next;
    });
  }, [userId]);

  const isSidebarSectionCollapsed = useCallback((label: string) => {
    return (preferences.sidebarCollapsed || []).includes(label);
  }, [preferences.sidebarCollapsed]);

  const isSidebarItemHidden = useCallback((path: string) => {
    return preferences.sidebarHidden.includes(path);
  }, [preferences.sidebarHidden]);

  const setDashboardCards = useCallback((cards: string[]) => update({ dashboardCards: cards }), [update]);
  const setDashboardSubjects = useCallback((subjects: string[]) => update({ dashboardSubjects: subjects }), [update]);

  const toggleDashboardCard = useCallback((cardId: string) => {
    setPreferences(prev => {
      const cards = prev.dashboardCards.includes(cardId)
        ? prev.dashboardCards.filter(c => c !== cardId)
        : [...prev.dashboardCards, cardId];
      const next = { ...prev, dashboardCards: cards };
      savePrefs(next, userId);
      return next;
    });
  }, [userId]);

  const toggleDashboardSubject = useCallback((subject: string) => {
    setPreferences(prev => {
      const subjects = prev.dashboardSubjects.includes(subject)
        ? prev.dashboardSubjects.filter(s => s !== subject)
        : [...prev.dashboardSubjects, subject];
      const next = { ...prev, dashboardSubjects: subjects };
      savePrefs(next, userId);
      return next;
    });
  }, [userId]);

  const togglePinnedTool = useCallback((path: string) => {
    setPreferences(prev => {
      const pinned = prev.dashboardPinnedTools.includes(path)
        ? prev.dashboardPinnedTools.filter(p => p !== path)
        : [...prev.dashboardPinnedTools, path];
      const next = { ...prev, dashboardPinnedTools: pinned };
      savePrefs(next, userId);
      return next;
    });
  }, [userId]);

  const setShowWorksheetLibrary = useCallback((show: boolean) => {
    setPreferences(prev => {
      const next = { ...prev, showWorksheetLibrary: show };
      savePrefs(next, userId);
      return next;
    });
  }, [userId]);

  const setCardBorderColor = useCallback((color: string) => {
    update({ cardBorderColor: color });
  }, [update]);

  const setIconShape = useCallback((shape: "rounded" | "circle" | "square") => {
    update({ iconShape: shape });
  }, [update]);

  const setIconBorderStyle = useCallback((style: "none" | "subtle" | "bold") => {
    update({ iconBorderStyle: style });
  }, [update]);

  const setCardStyle = useCallback((style: "default" | "flat" | "elevated") => {
    update({ cardStyle: style });
  }, [update]);

  const setLayoutDensity = useCallback((density: "comfortable" | "compact") => {
    update({ layoutDensity: density });
  }, [update]);

  const setHomeSection = useCallback((key: "showContinueSection" | "showRecentActivity" | "showSubjectBrowser" | "showCobsTip", val: boolean) => {
    update({ [key]: val });
  }, [update]);

  const updatePreference = useCallback((key: keyof UserPreferences, val: any) => {
    update({ [key]: val });
  }, [update]);

  const resetPreferences = useCallback(() => {
    const fresh = { ...DEFAULT_PREFERENCES };
    savePrefs(fresh, userId);
    syncToServer(fresh);
    setPreferences(fresh);
  }, [userId]);

  const currentTheme = COLOUR_THEMES.find(t => t.id === preferences.themeId) || COLOUR_THEMES[0];
  const currentWallpaper = WALLPAPERS.find(w => w.id === preferences.wallpaperId) || WALLPAPERS[0];

  // Build wallpaper CSS style
  const wallpaperStyle: React.CSSProperties = (() => {
    if (preferences.wallpaperId === "custom" && preferences.customWallpaperUrl) {
      return {
        backgroundImage: `url(${preferences.customWallpaperUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    if (currentWallpaper.type === "solid") {
      return { backgroundColor: currentWallpaper.value };
    }
    return { background: currentWallpaper.value };
  })();

  return (
    <UserPreferencesContext.Provider value={{
      preferences,
      setTheme,
      setWallpaper,
      toggleSidebarItem,
      isSidebarItemHidden,
      toggleSidebarSection,
      isSidebarSectionCollapsed,
      setDashboardCards,
      setDashboardSubjects,
      toggleDashboardCard,
      toggleDashboardSubject,
      togglePinnedTool,
      setShowWorksheetLibrary,
      setCardBorderColor,
      setIconShape,
      setIconBorderStyle,
      setCardStyle,
      setLayoutDensity,
      setHomeSection,
      updatePreference,
      resetPreferences,
      currentTheme,
      currentWallpaper,
      wallpaperStyle,
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) throw new Error("useUserPreferences must be used within UserPreferencesProvider");
  return ctx;
}
