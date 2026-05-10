import { motion } from "framer-motion";
import { useVariant } from "./lib/useVariant";

// Floating picker (bottom-right). Two pills: V2 Immersive / V3 Overdrive.
// Designer preview control — once you pick, we can remove it and lock the
// winning variant.

const OPTIONS = [
  { id: "v2", label: "Immersive", sub: "Restrained" },
  { id: "v3", label: "Overdrive", sub: "Full spectacle" },
];

export default function VariantSwitcher() {
  const { variant, setVariant } = useVariant();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-5 right-5 z-[70] pointer-events-auto"
      data-testid="variant-switcher"
    >
      <div className="glass rounded-2xl p-1.5 flex items-center gap-1 shadow-[0_20px_60px_-20px_rgba(34,32,30,0.35)]">
        {OPTIONS.map((o) => {
          const active = variant === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setVariant(o.id)}
              data-testid={`variant-option-${o.id}`}
              data-cursor="hover"
              className="relative px-4 py-2.5 rounded-xl text-left group"
            >
              {active && (
                <motion.span
                  layoutId="variant-pill"
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-ink-900"
                />
              )}
              <span
                className={`relative z-10 block font-heading font-bold text-[11px] tracking-wide uppercase ${
                  active ? "text-cream-100" : "text-ink-900"
                }`}
              >
                {o.label}
              </span>
              <span
                className={`relative z-10 block text-[9px] ${
                  active ? "text-cream-100/60" : "text-ink-500"
                } tracking-wider uppercase mt-0.5`}
              >
                {o.sub}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 text-[9px] uppercase tracking-[0.25em] text-ink-500 text-right pr-1">
        Preview · ask Kiro to lock in
      </div>
    </motion.div>
  );
}
