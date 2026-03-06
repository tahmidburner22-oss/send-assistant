import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Settings2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { data as dataApi } from "@/lib/api";

const CONSENT_KEY = "send_cookie_consent";

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) setVisible(true);
  }, []);

  const saveConsent = async (analyticsConsent: boolean) => {
    const consent: ConsentState = {
      necessary: true,
      analytics: analyticsConsent,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    // Record on server (best-effort)
    dataApi.cookieConsent({ analytics: analyticsConsent, marketing: false }).catch(() => {});
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
          role="dialog"
          aria-label="Cookie consent"
          aria-modal="true"
        >
          <div className="bg-card border border-border rounded-xl shadow-lg p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="w-5 h-5 text-brand" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm">Cookie Preferences</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  We use essential cookies to make this site work. We'd also like to set optional analytics cookies to help us improve it.
                  {" "}<a href="/privacy#cookies" className="text-brand hover:underline">Learn more</a>
                </p>

                {showCustomise && (
                  <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-medium">Strictly necessary</Label>
                        <p className="text-xs text-muted-foreground">Required for the site to work</p>
                      </div>
                      <Switch checked disabled aria-label="Strictly necessary cookies (always on)" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="analytics-toggle" className="text-xs font-medium">Analytics</Label>
                        <p className="text-xs text-muted-foreground">Help us improve the site</p>
                      </div>
                      <Switch id="analytics-toggle" checked={analytics} onCheckedChange={setAnalytics} aria-label="Analytics cookies" />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button size="sm" className="bg-brand hover:bg-brand/90 text-white text-xs h-8" onClick={() => saveConsent(true)}>
                    <Check className="w-3 h-3 mr-1" />Accept All
                  </Button>
                  {showCustomise ? (
                    <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => saveConsent(analytics)}>
                      Save Preferences
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setShowCustomise(true)}>
                      <Settings2 className="w-3 h-3 mr-1" />Customise
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-xs h-8 text-muted-foreground" onClick={() => saveConsent(false)}>
                    Reject optional
                  </Button>
                </div>
              </div>
              <button onClick={() => setVisible(false)} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Dismiss cookie banner">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
