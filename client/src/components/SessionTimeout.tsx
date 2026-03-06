import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

const TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
const WARNING_MS = 5 * 60 * 1000;  // warn 5 minutes before

export default function SessionTimeout() {
  const { isLoggedIn, logout } = useApp();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (!isLoggedIn) return;
    setShowWarning(false);
    setSecondsLeft(300);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(300);
      countdownRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) { clearInterval(countdownRef.current!); return 0; }
          return s - 1;
        });
      }, 1000);
    }, TIMEOUT_MS - WARNING_MS);

    timeoutRef.current = setTimeout(() => {
      logout();
    }, TIMEOUT_MS);
  }, [isLoggedIn, logout]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isLoggedIn, resetTimer]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <AnimatePresence>
      {showWarning && isLoggedIn && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-800 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Session expiring soon</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  You'll be logged out in {mins}:{secs.toString().padStart(2, "0")} due to inactivity.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white" onClick={resetTimer}>
                    Stay logged in
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-700 dark:text-amber-300" onClick={() => logout()}>
                    <LogOut className="w-3 h-3 mr-1" />Log out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
