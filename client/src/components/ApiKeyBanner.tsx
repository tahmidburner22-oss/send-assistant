/**
 * ApiKeyBanner — Persistent in-app banner shown when no AI keys are configured.
 * Improvement #2: Shows until user configures at least one key or dismisses.
 */
import { useState, useEffect } from "react";
import { AlertTriangle, X, Key } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useLocation } from "wouter";

const DISMISS_KEY = "adaptly_api_key_banner_dismissed";
const CHECK_INTERVAL = 60_000; // Re-check every 60s

export default function ApiKeyBanner() {
  const { user, isLoggedIn } = useApp();
  const [, setLocation] = useLocation();
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISS_KEY));
  const [hasKeys, setHasKeys] = useState(true); // Assume true until proven otherwise

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    // Check if the school has any AI keys configured
    const checkKeys = async () => {
      try {
        const res = await fetch("/api/ai/providers", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setHasKeys(data.providers && data.providers.length > 0);
        }
      } catch {}
    };
    checkKeys();
    const interval = setInterval(checkKeys, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [isLoggedIn, user]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  // Don't show if: not logged in, has keys, dismissed, or on settings page
  if (!isLoggedIn || hasKeys || dismissed) return null;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/settings")) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>AI features require an API key.</strong> Add a free Groq or Gemini key to start generating worksheets.
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setLocation("/settings")}
          className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md font-medium flex items-center gap-1"
        >
          <Key className="w-3 h-3" />
          Add Key
        </button>
        <button onClick={handleDismiss} className="text-amber-500 hover:text-amber-700">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
