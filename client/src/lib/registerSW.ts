/**
 * Service worker registration — production only.
 *
 * The dev server uses HMR, so registering the service worker in dev would
 * intercept module requests and break live reload. We only register against
 * the production build (`vite build` → served by Express/Netlify).
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  // Defer registration to the load event so it doesn't compete with first
  // paint on slow connections.
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      // Failing to register is non-fatal — the app still works without
      // offline support. Surface the error in the console so we notice
      // misconfiguration in production.
      console.warn("[Adaptly] Service worker registration failed:", err);
    });
  });
}
