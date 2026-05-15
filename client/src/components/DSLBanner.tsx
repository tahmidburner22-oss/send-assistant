/**
 * DSLBanner — Shows a warning banner for school admins when the DSL
 * has not confirmed their role after registration (Improvement #6).
 */
import { useState, useEffect } from "react";
import { Shield, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

const DISMISS_KEY = "adaptly_dsl_banner_dismissed";

export default function DSLBanner() {
  const { user, school, isLoggedIn } = useApp();
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISS_KEY));
  const [dslUnconfirmed, setDslUnconfirmed] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !user || !school) return;
    // Only show to school_admin or mat_admin
    if (!["school_admin", "mat_admin"].includes(user.role)) return;
    // Check if DSL is unconfirmed — we read from school data
    const checkDsl = async () => {
      try {
        const res = await fetch("/api/schools/my", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.dsl_email && !data.dsl_confirmed) {
            setDslUnconfirmed(true);
          }
        }
      } catch {}
    };
    checkDsl();
  }, [isLoggedIn, user, school]);

  if (!dslUnconfirmed || dismissed) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800 px-4 py-2 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
        <Shield className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>DSL confirmation pending.</strong> Your Designated Safeguarding Lead has not yet confirmed their role via email. A reminder will be sent if unconfirmed after 7 days.
        </span>
      </div>
      <button onClick={() => { setDismissed(true); localStorage.setItem(DISMISS_KEY, "1"); }} className="text-blue-500 hover:text-blue-700">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
