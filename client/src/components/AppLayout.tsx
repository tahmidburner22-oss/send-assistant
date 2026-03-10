import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Sparkles, FileText, BookOpen, LayoutGrid, Users, Clock,
  BarChart3, Lightbulb, ExternalLink, Settings, Menu, X, GraduationCap, LogOut,
  Calendar, TrendingUp, ClipboardList, IdCard, CheckSquare, ShieldAlert, Heart,
  HelpCircle, Table2, AlignLeft, Layers, CalendarDays, BookMarked, Ticket,
  BookType, Mail, Shield, ChevronDown, ChevronRight, ScrollText, Headphones, ScanSearch,
  Zap, NotebookPen, Pencil, MessageSquare
} from "lucide-react";

const mainMenu = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/send-screener", label: "SEND Needs Screener", icon: ScanSearch, color: "text-indigo-600" },
  { path: "/differentiate", label: "Differentiate", icon: Sparkles },
  { path: "/worksheets", label: "Worksheets", icon: FileText },
  { path: "/stories", label: "Stories", icon: BookOpen },
  { path: "/past-papers", label: "Past Papers", icon: ScrollText },
  { path: "/templates", label: "Templates", icon: LayoutGrid },
  { path: "/children", label: "Pupils", icon: Users },
  { path: "/revision-hub", label: "Revision Hub", icon: Headphones },
  { path: "/quiz-game", label: "QuizBlast", icon: Zap, color: "text-yellow-500" },
  { path: "/quiz-builder", label: "Quiz Builder", icon: Pencil, color: "text-orange-500" },
  { path: "/daily-briefing", label: "Daily Briefing", icon: NotebookPen, color: "text-blue-600" },
  { path: "/history", label: "History", icon: Clock },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/ideas", label: "Ideas", icon: Lightbulb },
];

const sendToolsMenu = [
  { path: "/tools/iep-generator", label: "IEP / EHCP Goals", icon: Shield, color: "text-blue-600" },
  { path: "/tools/social-stories", label: "Social Stories", icon: BookOpen, color: "text-purple-600" },
  { path: "/tools/pupil-passport", label: "Pupil Passport", icon: IdCard, color: "text-amber-600" },
  { path: "/tools/smart-targets", label: "SMART Targets", icon: CheckSquare, color: "text-teal-600" },
  { path: "/tools/behaviour-plan", label: "Behaviour Support Plan", icon: ShieldAlert, color: "text-orange-600" },
  { path: "/tools/wellbeing-support", label: "Wellbeing Support", icon: Heart, color: "text-red-500" },
];

const planningMenu = [
  { path: "/tools/lesson-planner", label: "Lesson Planner", icon: CalendarDays, color: "text-green-600" },
  { path: "/tools/medium-term-planner", label: "Medium Term Planner", icon: Calendar, color: "text-green-700" },
  { path: "/tools/quiz-generator", label: "Quiz Generator", icon: HelpCircle, color: "text-indigo-600" },
  { path: "/tools/rubric-generator", label: "Rubric / Mark Scheme", icon: Table2, color: "text-violet-600" },
  { path: "/tools/comprehension-generator", label: "Comprehension", icon: BookMarked, color: "text-sky-600" },
  { path: "/tools/exit-ticket", label: "Exit Ticket", icon: Ticket, color: "text-fuchsia-600" },
  { path: "/tools/flash-cards", label: "Flash Cards", icon: Layers, color: "text-yellow-600" },
  { path: "/tools/vocabulary-builder", label: "Vocabulary Builder", icon: BookType, color: "text-lime-700" },
];

const communicationMenu = [
  { path: "/tools/report-comments", label: "Report Comments", icon: FileText, color: "text-rose-600" },
  { path: "/tools/parent-newsletter", label: "Parent Newsletter", icon: Mail, color: "text-pink-600" },
  { path: "/tools/text-rewriter", label: "Text Rewriter", icon: AlignLeft, color: "text-cyan-600" },
];

const classroomMenu = [
  { path: "/visual-timetable", label: "Visual Timetable", icon: Calendar },
  { path: "/behaviour-tracking", label: "Behaviour Tracking", icon: TrendingUp },
  { path: "/attendance", label: "Attendance", icon: ClipboardList },
  { path: "/pupil-comments", label: "Pupil Comments", icon: MessageSquare, color: "text-violet-600" },
];

const accountMenu = [
  { path: "/parent-portal", label: "Parent Portal", icon: ExternalLink, external: true },
  { path: "/settings", label: "Settings", icon: Settings },
];

const allMenuItems = [
  ...mainMenu, ...sendToolsMenu, ...planningMenu, ...communicationMenu, ...classroomMenu, ...accountMenu
];

function SidebarSection({
  label, items, location, setSidebarOpen
}: {
  label: string;
  items: { path: string; label: string; icon: any; color?: string }[];
  location: string;
  setSidebarOpen: (v: boolean) => void;
}) {
  // Persist collapse state per section; default to open (true) on first visit
  const storageKey = `sidebar-section-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const [open, setOpen] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved === null ? true : saved === 'true';
  });

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem(storageKey, String(next));
  };

  const hasActive = items.some(i => location.startsWith(i.path));

  return (
    <>
      <button
        onClick={handleToggle}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${hasActive ? "text-brand" : "text-muted-foreground"}`}>
          {label}
        </span>
        {open ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {items.map(item => {
              const Icon = item.icon;
              const isActive = location.startsWith(item.path);
              return (
                <Link key={item.path} href={item.path} onClick={() => setSidebarOpen(false)}>
                  <div className={`mx-2 px-3 py-2 rounded-lg flex items-center gap-3 transition-all text-sm ${
                    isActive ? "bg-brand-light text-brand font-medium" : "text-foreground hover:bg-muted"
                  }`}>
                    <Icon className={`w-[16px] h-[16px] ${isActive ? "text-brand" : (item.color || "text-muted-foreground")}`} />
                    <span className="text-xs">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useApp();

  const currentPage = allMenuItems.find(m => location.startsWith(m.path));

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground">{currentPage?.label || "Adaptly"}</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-xl flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">Adaptly</div>
                    <div className="text-xs text-muted-foreground">SEND AI Platform</div>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Menu */}
              <div className="flex-1 overflow-y-auto py-2">
                {/* Main Menu — always visible, no collapse */}
                <div className="px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Main</span>
                </div>
                {mainMenu.map(item => {
                  const Icon = item.icon;
                  const isActive = location.startsWith(item.path);
                  return (
                    <Link key={item.path} href={item.path} onClick={() => setSidebarOpen(false)}>
                      <div className={`mx-2 px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-sm ${
                        isActive ? "bg-brand-light text-brand font-medium" : "text-foreground hover:bg-muted"
                      }`}>
                        <Icon className={`w-[18px] h-[18px] ${isActive ? "text-brand" : ((item as any).color || "")}`} />
                        {item.label}
                      </div>
                    </Link>
                  );
                })}

                <div className="mx-3 my-2 border-t border-border/50" />

                {/* Collapsible sections — all open by default, collapse state persisted */}
                <SidebarSection label="SEND Tools" items={sendToolsMenu} location={location} setSidebarOpen={setSidebarOpen} />
                <div className="mx-3 my-1 border-t border-border/30" />
                <SidebarSection label="Planning & Assessment" items={planningMenu} location={location} setSidebarOpen={setSidebarOpen} />
                <div className="mx-3 my-1 border-t border-border/30" />
                <SidebarSection label="Communication" items={communicationMenu} location={location} setSidebarOpen={setSidebarOpen} />
                <div className="mx-3 my-1 border-t border-border/30" />
                <SidebarSection label="Classroom Management" items={classroomMenu} location={location} setSidebarOpen={setSidebarOpen} />

                <div className="mx-3 my-2 border-t border-border/50" />

                {/* Account */}
                <div className="px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Account</span>
                </div>
                {accountMenu.map(item => {
                  const Icon = item.icon;
                  const isActive = location.startsWith(item.path);
                  return (
                    <Link key={item.path} href={item.path} onClick={() => setSidebarOpen(false)}>
                      <div className={`mx-2 px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-sm ${
                        isActive ? "bg-brand-light text-brand font-medium" : "text-foreground hover:bg-muted"
                      }`}>
                        <Icon className="w-[18px] h-[18px]" />
                        {item.label}
                      </div>
                    </Link>
                  );
                })}

                {/* Admin link — only for admin users */}
                {(user?.role === "school_admin" || user?.role === "mat_admin" || user?.email === "admin@sendassistant.app") && (
                  <Link href="/admin" onClick={() => setSidebarOpen(false)}>
                    <div className={`mx-2 px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-sm ${
                      location.startsWith("/admin") ? "bg-brand-light text-brand font-medium" : "text-foreground hover:bg-muted"
                    }`}>
                      <Shield className="w-[18px] h-[18px]" />
                      Admin Panel
                    </div>
                  </Link>
                )}
              </div>

              {/* User Info */}
              <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white font-semibold text-sm">
                    {user?.displayName?.[0] || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{user?.displayName || "User"}</div>
                    <div className="text-xs text-muted-foreground">
                      {({
                        mat_admin: "MAT Administrator",
                        school_admin: "School Administrator",
                        senco: "SENCO / Inclusion Lead",
                        teacher: "Teacher",
                        ta: "Teaching Assistant",
                        staff: "Support Staff",
                      } as Record<string, string>)[user?.role ?? ""] ?? user?.role ?? ""}
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); setSidebarOpen(false); window.location.href = "/"; }}
                    className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pb-8">
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
