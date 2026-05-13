// Self-contained CSS for the Adaptly landing page.
// Injected as a <style> tag at mount so we don't touch the global theme.

export const LANDING_FONT_HREFS = [
  "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;600;700&display=swap",
  "https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800,900&display=swap",
  // Inter — used by the cinematic hero and the liquid-glass nav pill.
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
];

export const LANDING_CSS = `
/* Editorial Swiss Humanism: warm paper, precise evidence-led sections, restrained motion, and no artificial scroll dead zones. */
html[data-landing-variant="overdrive"], html[data-landing-variant="overdrive"] body { overflow-x: clip; }
.adaptly-landing { background: linear-gradient(180deg,#F4F0E6 0%,#EFEADC 100%); color:#22201E; font-family:'Manrope',system-ui,sans-serif; -webkit-font-smoothing:antialiased; overflow-x: clip; }
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

/* Lenis — hide native scrollbar jank when active */
html.lenis-active, html.lenis-active body { height: auto; }
html.lenis-active { scroll-behavior: auto; }

/* Scroll-velocity reactive skew — cheap and only on opt-in elements */
.adaptly-landing .velocity-skew {
  transform: skewY(calc(var(--scroll-velocity,0) * 0.04deg));
  transition: transform .2s cubic-bezier(.16,1,.3,1);
  will-change: transform;
}

/* Section scroll margin so anchor nav doesn't sit under the fixed header */
.adaptly-landing section { scroll-margin-top: 96px; }

/* Slightly punchier glass for the locked Overdrive look */
.adaptly-landing .glass {
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(16px) saturate(135%);
  -webkit-backdrop-filter: blur(16px) saturate(135%);
}

/* Mobile — tighten the default py-14 md:py-20 sections so we don't get long
   dead stretches between content blocks on tall phone viewports. We target
   the two Tailwind padding classes used by every section. */
@media (max-width: 639px) {
  .adaptly-landing section.py-14,
  .adaptly-landing section[class*="py-14"] {
    padding-top: 3.5rem !important;
    padding-bottom: 3.5rem !important;
  }
}

@media (max-height: 900px) and (orientation: landscape) and (max-width: 1179px) {
  .adaptly-landing section[class*="py-14"],
  .adaptly-landing section[class*="py-20"],
  .adaptly-landing section[class*="py-24"] {
    padding-top: 2.75rem !important;
    padding-bottom: 2.75rem !important;
  }
  .adaptly-landing h1 { font-size: clamp(3.4rem, 8vw, 5.8rem) !important; line-height: .92 !important; }
  .adaptly-landing h2 { font-size: clamp(2.4rem, 6vw, 4.2rem) !important; }
  .adaptly-landing [data-testid="hero-ecosystem"] { max-height: 44vh; }
  .adaptly-landing [data-testid="hero-stats"] { margin-top: 1rem !important; }
}

/* Hide the native cursor on pointer-fine devices so the custom one can shine.
   Touch devices keep the default behaviour. We also leave inputs and
   textareas with their native cursor so typing feels right. */
@media (hover: hover) and (pointer: fine) and (min-width: 1024px) {
  .adaptly-landing,
  .adaptly-landing a,
  .adaptly-landing button,
  .adaptly-landing [role="button"] {
    cursor: none;
  }
  .adaptly-landing input,
  .adaptly-landing textarea,
  .adaptly-landing select {
    cursor: text;
  }
}

/* Ensure large display text never clips descenders when animated into view */
.adaptly-landing h1, .adaptly-landing h2, .adaptly-landing h3 { padding-bottom: 0.04em; }

/* ────────────────────────────────────────────────────────────────────────
   Cinematic / Jack-inspired primitives
   Scoped to .adaptly-landing so they never leak into the rest of the app.
   ──────────────────────────────────────────────────────────────────────── */

/* Inter is used by the cinematic hero + nav pill links. */
.adaptly-landing .font-inter { font-family: 'Inter', system-ui, sans-serif; }

/* Liquid-glass pill — translucent, blurred, with a thin gradient stroke. */
.adaptly-landing .liquid-glass {
  position: relative;
  overflow: hidden;
  border: none;
  background: rgba(255,255,255,0.01);
  background-blend-mode: luminosity;
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
  color: #fff;
}
.adaptly-landing .liquid-glass::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  pointer-events: none;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.45) 0%,
    rgba(255,255,255,0.15) 20%,
    rgba(255,255,255,0)    40%,
    rgba(255,255,255,0)    60%,
    rgba(255,255,255,0.15) 80%,
    rgba(255,255,255,0.45) 100%);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
}
.adaptly-landing .liquid-glass:hover { background: rgba(255,255,255,0.06); }

/* Bottom blur mask — covers the full hero, blur fades to transparent above 45%. */
.adaptly-landing .hero-bottom-blur {
  -webkit-mask-image: linear-gradient(to top, black 0%, transparent 45%);
          mask-image: linear-gradient(to top, black 0%, transparent 45%);
}

/* Blur-fade-up — used on every hero/nav element with staggered animationDelay. */
@keyframes adaptly-blur-fade-up {
  from { opacity: 0; filter: blur(20px); transform: translateY(40px); }
  to   { opacity: 1; filter: blur(0);    transform: translateY(0);    }
}
.adaptly-landing .animate-blur-fade-up {
  opacity: 0;
  animation: adaptly-blur-fade-up 1s ease-out forwards;
  will-change: opacity, transform, filter;
}

/* Jack gradient text — for the cinematic-stack heading. */
.adaptly-landing .hero-heading {
  background: linear-gradient(180deg, #646973 0%, #BBCCD7 100%);
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Jack gradient contact pill (used in Contact). */
.adaptly-landing .gradient-pill {
  background: linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%);
  box-shadow: 0px 4px 4px rgba(181,1,167,0.25), inset 4px 4px 12px #7721B1;
  outline: 2px solid #fff;
  outline-offset: -3px;
  color: #fff;
  border: none;
  transition: transform .25s ease, filter .25s ease;
}
.adaptly-landing .gradient-pill:hover { transform: translateY(-1px); filter: brightness(1.08); }
.adaptly-landing .gradient-pill:active { transform: translateY(0); filter: brightness(0.96); }

/* Ghost pill (used as secondary CTA + Live Project on dark backgrounds). */
.adaptly-landing .ghost-pill {
  border: 2px solid #D7E2EA;
  color: #D7E2EA;
  background: transparent;
  transition: background .25s ease;
}
.adaptly-landing .ghost-pill:hover { background: rgba(215,226,234,0.10); }

/* Cinematic hero specific — hero owns the page background underneath the
   nav, so we keep the scoped page background but the hero <section> sits on
   pure black until its bg-cover video loads. */
.adaptly-landing .hero-cinematic { background: #000; color: #fff; }

/* iOS Safari: backdrop-filter inside masked containers is sometimes ignored.
   Add a tiny opaque guard so the blur is forced to compose. */
@supports not ((-webkit-backdrop-filter: blur(4px)) or (backdrop-filter: blur(4px))) {
  .adaptly-landing .liquid-glass { background: rgba(255,255,255,0.12); }
}

/* Reduced motion / data — neutralise the cinematic stack so it stays readable. */
@media (prefers-reduced-motion: reduce) {
  .adaptly-landing .animate-blur-fade-up {
    animation: none !important;
    opacity: 1 !important;
    filter: none !important;
    transform: none !important;
  }
}

@media (prefers-reduced-motion: reduce) { .adaptly-landing * { animation-duration:.01ms !important; transition-duration:.01ms !important; scroll-behavior:auto !important; } }
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
