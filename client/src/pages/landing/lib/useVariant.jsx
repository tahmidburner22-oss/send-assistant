// Variant context: "v2" (immersive) or "v3" (overdrive).
// Persists to localStorage so the choice survives reloads.
// A tiny floating toggle in the corner lets the user flip between them live.

import { createContext, useContext, useEffect, useState } from "react";

const VariantCtx = createContext({ variant: "v2", setVariant: () => {} });

const STORAGE_KEY = "adaptly-landing-variant";
const VALID = new Set(["v2", "v3"]);

export function VariantProvider({ children, initial = "v2" }) {
  const [variant, setVariant] = useState(initial);

  // Hydrate from localStorage or ?variant= query param.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get("variant");
      if (q && VALID.has(q)) {
        setVariant(q);
        return;
      }
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && VALID.has(stored)) setVariant(stored);
    } catch {
      // ignore storage errors (Safari private mode, etc.)
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, variant);
    } catch {
      // ignore
    }
    document.documentElement.dataset.landingVariant = variant;
  }, [variant]);

  return (
    <VariantCtx.Provider value={{ variant, setVariant }}>
      {children}
    </VariantCtx.Provider>
  );
}

export function useVariant() {
  return useContext(VariantCtx);
}
