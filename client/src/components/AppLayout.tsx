import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/contexts/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Sparkles, FileText, BookOpen, LayoutGrid, Users, Clock,
  BarChart3, Lightbulb, ExternalLink, Settings, Menu, X, GraduationCap, LogOut,
  Calendar, TrendingUp, ClipboardList
} from "lucide-react";

const mainMenu = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/differentiate", label: "Differentiate", icon: Sparkles },
  { path: "/worksheets", label: "Worksheets", icon: FileText },
  { path: "/stories", label: "Stories", icon: BookOpen },
  { path: "/templates", label: "Templates", icon: LayoutGrid },
  { path: "/children", label: "Children", icon: Users },
  { path: "/history", label: "History", icon: Clock },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/ideas", label: "Ideas", icon: Lightbulb },
];

const toolsMenu = [
  { path: "/visual-timetable", label: "Visual Timetable", icon: Calendar },
  { path: "/behaviour-tracking", label: "Behaviour Tracking", icon: TrendingUp },
  { path: "/attendance", label: "Attendance", icon: ClipboardList },
];

const accountMenu = [
  { path: "/parent-portal", label: "Parent Portal", icon: ExternalLink, external: true },
  { path: "/settings", label: "Settings", icon: Settings },
];

const allMenuItems = [...mainMenu, ...toolsMenu, ...accountMenu];

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
                    <div className="text-xs text-muted-foreground">For Schools</div>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main Menu */}
              <div className="flex-1 overflow-y-auto py-2">
                <div className="px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Main Menu</span>
                </div>
                {mainMenu.map(item => {
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

                <div className="mx-3 my-3 border-t border-border/50" />

                <div className="px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SEND Tools</span>
                </div>
                {toolsMenu.map(item => {
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

                <div className="mx-3 my-3 border-t border-border/50" />

                <div className="px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Account</span>
                </div>
                {accountMenu.map(item => {
                  const Icon = item.icon;
                  const isActive = location.startsWith(item.path);
                  if (item.external) {
                    return (
                      <Link key={item.path} href={item.path} onClick={() => setSidebarOpen(false)}>
                        <div className="mx-2 px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all text-sm text-foreground hover:bg-muted">
                          <Icon className="w-[18px] h-[18px]" />
                          {item.label}
                        </div>
                      </Link>
                    );
                  }
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
              </div>

              {/* User Info */}
              <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white font-semibold text-sm">
                    {user?.displayName?.[0] || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{user?.displayName || "User"}</div>
                    <div className="text-xs text-muted-foreground">{user?.role === "school_admin" || user?.role === "mat_admin" || user?.role === "senco" ? "Admin" : user?.role === "ta" ? "Teaching Assistant" : "Teacher"}</div>
                  </div>
                  <button onClick={() => { logout(); setSidebarOpen(false); window.location.href = "/"; }} className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
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
