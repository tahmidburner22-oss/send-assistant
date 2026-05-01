// Self-contained CSS for the Adaptly landing page.
// Injected as a <style> tag at mount so we don't touch the global theme.

export const LANDING_FONT_HREFS = [
  "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;600;700&display=swap",
  "https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800,900&display=swap",
];

export const LANDING_CSS = `
.adaptly-landing { background: linear-gradient(180deg,#F4F0E6 0%,#EFEADC 100%); color:#22201E; font-family:'Manrope',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
.adaptly-landing::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:1; opacity:0.05; mix-blend-mode:multiply; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E"); }

.adaptly-landing .font-display { font-family:'Instrument Serif',serif; font-weight:400; letter-spacing:-0.02em; }
.adaptly-landing .font-heading { font-family:'Cabinet Grotesk','Manrope',sans-serif; letter-spacing:-0.03em; }
.adaptly-landing .font-body { font-family:'Manrope',sans-serif; }

.adaptly-landing .bg-cream-50 { background-color:#FBF8F1 !important; }
.adaptly-landing .bg-cream-100 { background-color:#F4F0E6 !important; }
.adaptly-landing .bg-cream-200 { background-color:#EAE5D9 !important; }
.adaptly-landing .bg-cream-300 { background-color:#D8D1BF !important; }
.adaptly-landing .bg-ink-900 { background-color:#22201E !important; }
.adaptly-landing .bg-ink-700 { background-color:#3A3733 !important; }
.adaptly-landing .bg-ink-500 { background-color:#5C5A56 !important; }
.adaptly-landing .bg-terracotta { background-color:#D96C4A !important; }
.adaptly-landing .bg-honey { background-color:#E5B96E !important; }
.adaptly-landing .bg-sage { background-color:#7F8C72 !important; }
.adaptly-landing .text-cream-50 { color:#FBF8F1 !important; }
.adaptly-landing .text-cream-100 { color:#F4F0E6 !important; }
.adaptly-landing .text-cream-200 { color:#EAE5D9 !important; }
.adaptly-landing .text-ink-900 { color:#22201E !important; }
.adaptly-landing .text-ink-700 { color:#3A3733 !important; }
.adaptly-landing .text-ink-500 { color:#5C5A56 !important; }
.adaptly-landing .text-ink-300 { color:#8B8882 !important; }
.adaptly-landing .text-terracotta { color:#D96C4A !important; }
.adaptly-landing .text-honey { color:#E5B96E !important; }
.adaptly-landing .text-sage { color:#7F8C72 !important; }
.adaptly-landing .border-terracotta { border-color:#D96C4A !important; }
.adaptly-landing .border-honey { border-color:#E5B96E !important; }
.adaptly-landing .border-sage { border-color:#7F8C72 !important; }
.adaptly-landing .border-ink-900 { border-color:#22201E !important; }
.adaptly-landing .from-terracotta { --tw-gradient-from:#D96C4A var(--tw-gradient-from-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to,rgba(217,108,74,0)); }
.adaptly-landing .to-terracotta { --tw-gradient-to:#D96C4A var(--tw-gradient-to-position) !important; }
.adaptly-landing .from-honey { --tw-gradient-from:#E5B96E var(--tw-gradient-from-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to,rgba(229,185,110,0)); }
.adaptly-landing .to-honey { --tw-gradient-to:#E5B96E var(--tw-gradient-to-position) !important; }
.adaptly-landing .from-cream-100 { --tw-gradient-from:#F4F0E6 var(--tw-gradient-from-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to,rgba(244,240,230,0)); }
.adaptly-landing .from-cream-50 { --tw-gradient-from:#FBF8F1 var(--tw-gradient-from-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to,rgba(251,248,241,0)); }
.adaptly-landing .from-cream-200 { --tw-gradient-from:#EAE5D9 var(--tw-gradient-from-position) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to,rgba(234,229,217,0)); }
.adaptly-landing .via-cream-50 { --tw-gradient-stops: var(--tw-gradient-from), #FBF8F1 var(--tw-gradient-via-position), var(--tw-gradient-to,rgba(251,248,241,0)) !important; }
.adaptly-landing .via-cream-100 { --tw-gradient-stops: var(--tw-gradient-from), #F4F0E6 var(--tw-gradient-via-position), var(--tw-gradient-to,rgba(244,240,230,0)) !important; }
.adaptly-landing .via-ink-900 { --tw-gradient-stops: var(--tw-gradient-from), #22201E var(--tw-gradient-via-position), var(--tw-gradient-to,rgba(34,32,30,0)) !important; }
.adaptly-landing .to-cream-50 { --tw-gradient-to:#FBF8F1 var(--tw-gradient-to-position) !important; }
.adaptly-landing .to-cream-100 { --tw-gradient-to:#F4F0E6 var(--tw-gradient-to-position) !important; }
.adaptly-landing .to-cream-200 { --tw-gradient-to:#EAE5D9 var(--tw-gradient-to-position) !important; }
.adaptly-landing .to-ink-900 { --tw-gradient-to:#22201E var(--tw-gradient-to-position) !important; }

.adaptly-landing .glass { background: rgba(255,255,255,0.45); backdrop-filter: blur(24px) saturate(140%); -webkit-backdrop-filter: blur(24px) saturate(140%); border: 1px solid rgba(255,255,255,0.6); box-shadow: 0 8px 32px rgba(34,32,30,0.06); }
.adaptly-landing .glass-dark { background: rgba(34,32,30,0.65); backdrop-filter: blur(24px) saturate(140%); -webkit-backdrop-filter: blur(24px) saturate(140%); border: 1px solid rgba(255,255,255,0.08); }

.adaptly-landing .marquee-mask { -webkit-mask-image: linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent); mask-image: linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent); }
@keyframes adaptly-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.adaptly-landing .animate-marquee { animation: adaptly-marquee 40s linear infinite; }
@keyframes adaptly-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.adaptly-landing .animate-float-slow { animation: adaptly-float 6s ease-in-out infinite; }

.adaptly-landing ::selection { background:#D96C4A; color:#F4F0E6; }
.adaptly-landing .tilt-card { transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s; transform-style: preserve-3d; will-change: transform; }
.adaptly-landing .hairline { background: linear-gradient(90deg,transparent,rgba(34,32,30,0.18),transparent); height:1px; }

@media (prefers-reduced-motion: reduce) { .adaptly-landing * { animation-duration:.01ms !important; transition-duration:.01ms !important; } }
`;

export function injectLandingStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("adaptly-landing-styles")) return;

  LANDING_FONT_HREFS.forEach((href, idx) => {
    const id = `adaptly-landing-font-${idx}`;
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  });

  const s = document.createElement("style");
  s.id = "adaptly-landing-styles";
  s.textContent = LANDING_CSS;
  document.head.appendChild(s);
}
