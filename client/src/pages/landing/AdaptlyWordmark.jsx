// Inline SVG wordmark + logomark for Adaptly.
// Replaces the JPG with a white rectangle background. Fully transparent,
// scales crisply, inherits currentColor.
//
// The mark is a geometric "A" carved from two stacked arcs, suggesting a
// ladder rung rising — on-brand for "every rung a child climbs".

export function AdaptlyMark({ size = 40, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Soft warm backdrop disc */}
      <circle cx="32" cy="32" r="30" fill="#D96C4A" fillOpacity="0.08" />
      {/* Outer arc — top of the A / upper rung */}
      <path
        d="M12 46 L32 12 L52 46"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner crossbar — the rung */}
      <path
        d="M22 34 L42 34"
        stroke="#D96C4A"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AdaptlyWordmark({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <AdaptlyMark size={36} className="text-ink-900" />
      <span className="font-heading font-bold text-xl md:text-2xl tracking-[-0.04em] text-ink-900">
        Adaptly
      </span>
    </span>
  );
}
