// Mobile-first replacement for ZoomParallax.
//
// The desktop ZoomParallax pins the viewport for ~165vh and runs a
// scroll-driven scale + rotate + curtain animation. On phones that
// translates to a janky pinned section eating two full screen heights
// before the user reaches the next bit of copy, and Framer Motion's
// per-frame `useTransform` work shows up clearly in the scroll thread.
//
// This static counterpart preserves the *message* (a finished worksheet
// dropping into the cinematic dark backdrop) without any scroll-pinned
// transforms — fast paint, no layout pinning, no GPU compositing cost.
//
// Used below md (<768px) and whenever the user has prefers-reduced-motion.

export default function ZoomParallaxMobile() {
  return (
    <section
      id="zoom"
      data-testid="zoom-section-mobile"
      className="relative bg-ink-900 text-white py-20 px-6 overflow-hidden"
    >
      {/* Soft ambient blobs — pure CSS, no scroll listeners */}
      <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-terracotta/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-[420px] h-[420px] rounded-full bg-honey/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-md mx-auto text-center space-y-6">
        <p className="text-xs uppercase tracking-[0.18em] text-white/60">Worksheets</p>
        <h2 className="text-3xl font-semibold tracking-[-0.02em]">
          Differentiated worksheets, ready in seconds.
        </h2>
        <p className="text-base text-white/75 leading-relaxed">
          Pick a topic, choose a pupil profile, and Adaptly produces a finished
          PDF with the right reading age, scaffolding and layout for them.
        </p>

        {/* Static "card" — looks like the desktop hero card without the
            zoom-and-rotate scroll choreography. */}
        <div className="mt-6 mx-auto w-full max-w-xs aspect-[3/4] rounded-2xl bg-white/95 text-ink-900 shadow-2xl ring-1 ring-white/10 p-4 text-left">
          <div className="h-2 w-16 rounded bg-ink-900/15 mb-3" />
          <div className="h-5 w-3/4 rounded bg-ink-900/80 mb-4" />
          <div className="space-y-2">
            <div className="h-2 rounded bg-ink-900/10" />
            <div className="h-2 w-5/6 rounded bg-ink-900/10" />
            <div className="h-2 w-2/3 rounded bg-ink-900/10" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="h-10 rounded bg-sage/30" />
            <div className="h-10 rounded bg-honey/40" />
            <div className="h-10 rounded bg-terracotta/30" />
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-2 rounded bg-ink-900/10" />
            <div className="h-2 w-4/5 rounded bg-ink-900/10" />
          </div>
        </div>

        <p className="text-xs text-white/50 pt-2">Tap a feature below to learn more.</p>
      </div>
    </section>
  );
}
