import { useState } from "react";
import { useNotificationWS } from "@/hooks/useNotificationWS";
import React from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { useUserPreferences, COLOUR_THEMES } from "@/contexts/UserPreferencesContext";
import { motion, AnimatePresence } from "framer-motion";
import CommandPalette from "./CommandPalette";
import FeedbackWidget from "./FeedbackWidget";
import {
  Home, Brain, GraduationCap, Pencil, MessageCircle, Monitor,
  LogOut, Menu, X, Shield, Settings, ExternalLink,
  Search, Bell, ChevronRight, Users, FileCheck, Mail, MessageSquare,
  ClipboardList,
} from "lucide-react";

const ehcpHub = {
  path: "/tools/iep-generator",
  label: "EHCP Plan Generator",
  icon: FileCheck,
  color: "text-indigo-700",
  bg: "bg-indigo-100",
  description: "AI-assisted EHCP drafting — SENCO & SLT",
  toolPrefixes: ["/tools/iep-generator"],
};

const ehcpSidebarItem = {
  path: "/ehcp-hub",
  label: "EHCP Hub",
  icon: ClipboardList,
  color: "text-violet-700",
  bg: "bg-violet-100",
  description: "ISP, SSPP, ECHNAR guidance & EHCP drafting",
  toolPrefixes: ["/ehcp-hub", "/tools/iep-generator"],
};

const hubs = [
  {
    path: "/send-hub",
    label: "SEND Hub",
    icon: Brain,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    description: "IEP, social stories, pupil passport & more",
    toolPrefixes: ["/tools/iep","/tools/social","/tools/pupil-passport","/tools/smart-targets","/tools/behaviour-plan","/tools/wellbeing","/send-screener","/visual-timetable","/worksheets","/differentiate"],
  },
  {
    path: "/revision-section",
    label: "Revision Hub",
    icon: GraduationCap,
    color: "text-teal-600",
    bg: "bg-teal-50",
    description: "Past papers, flash cards, quizzes & audio",
    toolPrefixes: ["/past-papers","/revision-hub","/tools/flash-cards","/worksheets","/tools/quiz-gen","/tools/vocabulary","/quiz-game","/tools/comprehension"],
  },
  {
    path: "/planning-hub",
    label: "Planning Hub",
    icon: Pencil,
    color: "text-green-600",
    bg: "bg-green-50",
    description: "Lesson plans, differentiation & resources",
    toolPrefixes: ["/tools/lesson-planner","/tools/medium-term","/tools/rubric","/tools/exit-ticket","/templates","/tools/risk-assessment","/tools/vocabulary","/tools/comprehension","/tools/quiz-gen"],
  },
  {
    path: "/communications-hub",
    label: "Communications Hub",
    icon: MessageCircle,
    color: "text-rose-500",
    bg: "bg-rose-50",
    description: "Reports, newsletters, behaviour & attendance",
    toolPrefixes: ["/tools/report-comments","/tools/parent-newsletter","/tools/text-rewriter","/parent-portal","/pupil-comments","/behaviour-tracking","/attendance"],
  },
  {
    path: "/classroom-hub",
    label: "Classroom Hub",
    icon: Monitor,
    color: "text-blue-600",
    bg: "bg-blue-50",
    description: "Pupils, QuizBlast, analytics & daily briefing",
    toolPrefixes: ["/daily-briefing","/analytics","/pupils","/ideas","/history","/reading","/quiz-game"],
  },
];

const accountMenu = [
  { path: "/pupils",        label: "Pupil Profiles", icon: Users },
  { path: "/parent-portal", label: "Parent Portal",  icon: ExternalLink },
  { path: "/settings",      label: "Settings",       icon: Settings },
];

const allKnownPaths: { path: string; label: string }[] = [
  { path: "/home", label: "Home" },
  { path: "/send-hub", label: "SEND Hub" },
  { path: "/ehcp-hub", label: "EHCP Hub" },
  { path: "/revision-section", label: "Revision Hub" },
  { path: "/planning-hub", label: "Planning Hub" },
  { path: "/communications-hub", label: "Communications Hub" },
  { path: "/classroom-hub", label: "Classroom Hub" },
  { path: "/tools/iep-generator", label: "IEP / EHCP Goals" },
  { path: "/tools/social-stories", label: "Social Stories" },
  { path: "/tools/pupil-passport", label: "Pupil Passport" },
  { path: "/tools/smart-targets", label: "SMART Targets" },
  { path: "/tools/behaviour-plan", label: "Behaviour Support Plan" },
  { path: "/tools/wellbeing-support", label: "Wellbeing Support" },
  { path: "/send-screener", label: "SEND Needs Screener" },
  { path: "/visual-timetable", label: "Visual Timetable" },
  { path: "/past-papers", label: "Past Papers" },
  { path: "/revision-hub", label: "Audio Revision Hub" },
  { path: "/tools/flash-cards", label: "Flash Cards" },
  { path: "/worksheets", label: "Worksheets" },
  { path: "/tools/quiz-generator", label: "Quiz Generator" },
  { path: "/tools/vocabulary-builder", label: "Vocabulary Builder" },
  { path: "/quiz-game", label: "QuizBlast" },
  { path: "/quiz-builder", label: "Quiz Builder" },
  { path: "/tools/comprehension-generator", label: "Comprehension Generator" },
  { path: "/tools/lesson-planner", label: "Lesson Planner" },
  { path: "/tools/medium-term-planner", label: "Medium Term Planner" },
  { path: "/differentiate", label: "Differentiate" },
  { path: "/tools/rubric-generator", label: "Rubric / Mark Scheme" },
  { path: "/tools/exit-ticket", label: "Exit Ticket" },
  { path: "/reading", label: "Reading & Stories" },
  { path: "/templates", label: "Pre-made Worksheets" },
  { path: "/tools/risk-assessment", label: "Risk Assessment" },
  { path: "/tools/report-comments", label: "Report Comments" },
  { path: "/tools/parent-newsletter", label: "Parent Newsletter" },
  { path: "/tools/text-rewriter", label: "Text Rewriter" },
  { path: "/parent-portal", label: "Parent Portal" },
  { path: "/pupil-comments", label: "Pupil Comments" },
  { path: "/behaviour-tracking", label: "Behaviour Tracking" },
  { path: "/attendance", label: "Attendance Tracker" },
  { path: "/daily-briefing", label: "Daily Briefing" },
  { path: "/analytics", label: "Analytics" },
  { path: "/pupils", label: "Pupil Profiles" },
  { path: "/history", label: "History" },
  { path: "/ideas", label: "Ideas" },
  { path: "/settings", label: "Settings" },
  { path: "/admin", label: "Admin Panel" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout, children: pupils } = useApp();
  const { preferences, wallpaperStyle } = useUserPreferences();

  // ── Real-time WebSocket notifications (via useNotificationWS hook) ───────────
  const {
    notifications: wsNotifs,
    dismiss: dismissWsNotif,
    markAllRead: markWsAllRead,
    isConnected: wsConnected,
  } = useNotificationWS({ token: user?.token });

  // Also include local assignment-completion notifications for backwards compat
  const assignmentNotifs = pupils.flatMap(p =>
    p.assignments
      .filter(a => a.status === "completed" && !a.mark && !a.teacherComment)
      .map(a => ({
        id: `${p.id}__${a.id}`,
        type: "assignment" as const,
        title: `${p.name} completed work`,
        body: a.title,
        link: "/pupils",
        read: false,
        created_at: a.completedAt || new Date().toISOString(),
      }))
  ).slice(0, 5);

  const allNotifications = [
    ...wsNotifs,
    ...assignmentNotifs.filter(a => !wsNotifs.some(w => w.id === a.id)),
  ];
  const notifications = allNotifications.filter(n => !n.read);
  const unreadCount = notifications.length;

  const dismissNotif = (id: string) => {
    // Assignment-local notifs are dismissed in-memory; WS notifs via the hook
    dismissWsNotif(id);
  };

  const markAllRead = () => {
    markWsAllRead();
  };

  const theme = COLOUR_THEMES.find(t => t.id === preferences.themeId) || COLOUR_THEMES[0];
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--brand", theme.primary);
    document.documentElement.style.setProperty("--brand-accent", theme.accent);
    document.documentElement.style.setProperty("--color-primary", theme.primary);
  }

  const currentPage = allKnownPaths.find(m => location.startsWith(m.path));

  const isHubActive = (hub: typeof hubs[0]) => {
    if (location === hub.path) return true;
    return hub.toolPrefixes.some(p => location.startsWith(p));
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={wallpaperStyle}>
      <CommandPalette />
      <FeedbackWidget />

      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b"
        style={{ backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}30` }}
      >
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground truncate max-w-[200px]">
            {currentPage?.label || "Adaptly"}
          </h1>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button onClick={() => setNotifOpen(o => !o)} className="p-2 rounded-lg hover:bg-muted transition-colors relative" title={wsConnected ? "Notifications (live)" : "Notifications (reconnecting…)"}>
                <Bell className="w-4 h-4 text-muted-foreground" />
                {/* WS live indicator dot */}
                <span className={`absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full border border-background ${wsConnected ? "bg-green-500" : "bg-amber-400"}`} title={wsConnected ? "Live" : "Reconnecting"} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-10 w-72 bg-card border border-border/60 rounded-xl shadow-lg z-50 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">
                          Notifications {unreadCount > 0 && <span className="ml-1 text-[10px] font-bold text-brand">({unreadCount})</span>}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${wsConnected ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {wsConnected ? "● Live" : "● Reconnecting"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[10px] text-brand hover:text-brand/70 font-medium transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </div>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                        {allNotifications.length > 0 ? "All caught up — no unread notifications" : "No new notifications"}
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto divide-y divide-border/30">
                        {notifications.map((n) => (
                          <div key={n.id} className="flex items-start gap-1 pr-1 hover:bg-muted/40 transition-colors">
                            <Link href={n.link || "/pupils"} onClick={() => { dismissNotif(n.id); setNotifOpen(false); }} className="flex-1">
                              <div className="px-3 py-2.5 cursor-pointer">
                                <p className="text-xs font-medium text-foreground">{n.title}</p>
                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{n.body}</p>
                              </div>
                            </Link>
                            <button
                              onClick={() => dismissNotif(n.id)}
                              title="Mark as read"
                              className="p-1.5 mt-1.5 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("adaptly:open-search"))}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border transition-all text-xs min-w-[160px]"
              title="Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1 text-left">Search tools &amp; pages…</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background border border-border/50 text-[9px] font-mono text-muted-foreground/70">⌘K</kbd>
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("adaptly:open-search"))}
              className="sm:hidden p-2 -mr-2 rounded-lg hover:bg-muted transition-colors"
              title="Search (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 shadow-2xl flex flex-col bg-background border-r border-border/50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md overflow-hidden bg-white">
                    <img src="/logo.png" alt="Adaptly Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm tracking-tight">Adaptly</div>
                    <div className="text-[10px] text-muted-foreground">AI Platform for SEND & Teaching</div>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav */}
              <div className="flex-1 overflow-y-auto py-3">
                {/* Home */}
                <Link href="/home" onClick={() => setSidebarOpen(false)}>
                  <div className={`mx-2 mb-1 px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-sm ${
                    location === "/home" ? "bg-brand-light text-brand font-semibold" : "text-foreground hover:bg-muted"
                  }`}>
                    <Home className={`w-[18px] h-[18px] ${location === "/home" ? "text-brand" : "text-muted-foreground"}`} />
                    Home
                  </div>
                </Link>

                <div className="px-3 pb-2 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SENCO & SLT</span>
                </div>

                <div className="px-2 mb-1">
                  {/* EHCP Hub — standalone sidebar tab */}
                  {(() => {
                    const hub = ehcpSidebarItem;
                    const Icon = hub.icon;
                    const active = hub.toolPrefixes.some(p => location.startsWith(p));
                    return (
                      <Link href={hub.path} onClick={() => setSidebarOpen(false)}>
                        <div className={`px-3 py-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer group mb-1 ${
                          active
                            ? "bg-brand-light border border-brand/20"
                            : "hover:bg-muted/60 border border-transparent"
                        }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                            active ? "bg-brand text-white shadow-sm" : `${hub.bg} ${hub.color}`
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-semibold leading-tight ${active ? "text-brand" : "text-foreground"}`}>
                              {hub.label}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">{hub.description}</div>
                          </div>
                          <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${active ? "text-brand rotate-90" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
                        </div>
                      </Link>
                    );
                  })()}
                  {(() => {
                    const hub = ehcpHub;
                    const Icon = hub.icon;
                    const active = location.startsWith(hub.path);
                    return (
                      <Link href={hub.path} onClick={() => setSidebarOpen(false)}>
                        <div className={`px-3 py-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer group ${
                          active
                            ? "bg-brand-light border border-brand/20"
                            : "hover:bg-muted/60 border border-transparent"
                        }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                            active ? "bg-brand text-white shadow-sm" : `${hub.bg} ${hub.color}`
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-semibold leading-tight ${active ? "text-brand" : "text-foreground"}`}>
                              {hub.label}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">{hub.description}</div>
                          </div>
                          <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${active ? "text-brand rotate-90" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
                        </div>
                      </Link>
                    );
                  })()}
                </div>

                <div className="px-3 pb-2 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hubs</span>
                </div>

                <div className="space-y-1 px-2">
                  {hubs.map(hub => {
                    const Icon = hub.icon;
                    const active = isHubActive(hub);
                    return (
                      <Link key={hub.path} href={hub.path} onClick={() => setSidebarOpen(false)}>
                        <div className={`px-3 py-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer group ${
                          active
                            ? "bg-brand-light border border-brand/20"
                            : "hover:bg-muted/60 border border-transparent"
                        }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                            active ? "bg-brand text-white shadow-sm" : `${hub.bg} ${hub.color}`
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-semibold leading-tight ${active ? "text-brand" : "text-foreground"}`}>
                              {hub.label}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">{hub.description}</div>
                          </div>
                          <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${active ? "text-brand rotate-90" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="mx-3 mt-4 mb-2 pt-3 border-t border-border/40">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Account</span>
                </div>

                <div className="px-2">
                  {accountMenu.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.path} href={item.path} onClick={() => setSidebarOpen(false)}>
                        <div className={`px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-sm mb-0.5 ${
                          location.startsWith(item.path) ? "bg-brand-light text-brand font-medium" : "text-foreground hover:bg-muted"
                        }`}>
                          <Icon className="w-[18px] h-[18px] text-muted-foreground" />
                          {item.label}
                        </div>
                      </Link>
                    );
                  })}

                  {(user?.role === "school_admin" || user?.role === "mat_admin" || user?.email === "admin@sendassistant.app") && (
                    <Link href="/admin" onClick={() => setSidebarOpen(false)}>
                      <div className={`px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-sm ${
                        location.startsWith("/admin") ? "bg-brand-light text-brand font-medium" : "text-foreground hover:bg-muted"
                      }`}>
                        <Shield className="w-[18px] h-[18px] text-muted-foreground" />
                        Admin Panel
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              {/* User Footer */}
              <div className="p-4 border-t border-border/50 bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <a
                    href="mailto:support@adaptly.co.uk"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/40"
                    title="Email support"
                  >
                    <Mail className="w-3 h-3" />
                    Get Help
                  </a>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("adaptly:feedback"))}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/40"
                    title="Give feedback"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Feedback
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {user?.displayName?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{user?.displayName || "User"}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {(({
                        mat_admin: "MAT Administrator",
                        school_admin: "School Administrator",
                        senco: "SENCO / Inclusion Lead",
                        teacher: "Teacher",
                        ta: "Teaching Assistant",
                        staff: "Support Staff",
                      } as Record<string, string>)[user?.role ?? ""] ?? user?.role ?? "")}
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); setSidebarOpen(false); window.location.href = "/"; }}
                    className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="pb-8 overflow-x-hidden w-full">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
