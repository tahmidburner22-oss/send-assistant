import { createRoot } from "react-dom/client";
import App from "./App";

// Self-hosted DM Sans (no Google Fonts CDN).
// Removes a third-party request on first paint and avoids transmitting
// visitor IPs to fonts.gstatic.com — relevant for UK GDPR compliance
// (see Legitimate_Interests_Assessment_Adaptly.md).
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-sans/400-italic.css";

import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";

createRoot(document.getElementById("root")!).render(<App />);

// Register the offline-capable service worker in production. Safe no-op in dev.
registerServiceWorker();
