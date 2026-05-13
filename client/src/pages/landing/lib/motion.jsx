// Jack-inspired reusable motion primitives, scoped to the Adaptly landing page.
//
// Exports:
//   <FadeIn as delay duration x y> — viewport-triggered fade/slide using motion.create(Tag).
//   <AnimatedText text>            — character-by-character scroll-driven opacity reveal.
//   <Magnet padding strength>      — mouse-following magnetic effect with smooth in/out.
//
// All three are designed to be drop-in inside `.adaptly-landing` and to honour
// prefers-reduced-motion. They are mobile/tablet/desktop aware:
//   • Magnet is automatically inert on touch devices and when `(hover: none)`.
//   • AnimatedText fades to fully visible on touch / coarse pointer devices to
//     avoid sluggish per-character scroll work on phones.
//   • FadeIn collapses to a no-op when prefers-reduced-motion is set.

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

// ───── FadeIn ────────────────────────────────────────────────────────────────

const motionTagCache = new Map();

function getMotionTag(tag) {
  if (motionTagCache.has(tag)) return motionTagCache.get(tag);
  // motion.create() is the v12 API; falls back to motion[tag] if not present.
  const Component =
    typeof motion.create === "function" ? motion.create(tag) : motion[tag] || motion.div;
  motionTagCache.set(tag, Component);
  return Component;
}

/**
 * Animates a child into view once. Tag-aware via motion.create().
 *
 * @param {object} p
 * @param {string} [p.as="div"]      Element tag for the wrapper.
 * @param {number} [p.delay=0]       Delay in seconds.
 * @param {number} [p.duration=0.7]  Duration in seconds.
 * @param {number} [p.x=0]           Initial x offset in px.
 * @param {number} [p.y=30]          Initial y offset in px.
 * @param {string} [p.viewportMargin="50px"] viewport.margin value.
 */
export function FadeIn({
  as = "div",
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  viewportMargin = "50px",
  className = "",
  children,
  ...rest
}) {
  const reduced = useReducedMotion();
  const Tag = getMotionTag(as);

  if (reduced) {
    // Render the children straight (no animation) — but keep the wrapper tag
    // so callers' layouts don't shift between motion/no-motion.
    const Static = as || "div";
    return (
      <Static className={className} {...rest}>
        {children}
      </Static>
    );
  }

  return (
    <Tag
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: viewportMargin, amount: 0 }}
      transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ───── AnimatedText ──────────────────────────────────────────────────────────

function useIsCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);
  return coarse;
}

/**
 * Per-character scroll-reveal text. Each character is animated from
 * opacity 0.2 → 1 over its slice of the parent's scroll progress.
 *
 * Honours prefers-reduced-motion (renders fully visible) and on touch
 * devices, where per-char scroll math is wasteful.
 */
export function AnimatedText({
  text,
  as = "p",
  className = "",
  // Offset for useScroll. The defaults match the Jack spec.
  offset = ["start 0.8", "end 0.2"],
  ...rest
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const coarse = useIsCoarsePointer();
  const Tag = as;

  const { scrollYProgress } = useScroll({ target: ref, offset });

  const chars = useMemo(() => Array.from(String(text || "")), [text]);
  const total = chars.length || 1;

  if (reduced || coarse) {
    return (
      <Tag ref={ref} className={className} {...rest}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag ref={ref} className={className} {...rest}>
      {chars.map((ch, i) => (
        <Char key={i} ch={ch} index={i} total={total} progress={scrollYProgress} />
      ))}
    </Tag>
  );
}

function Char({ ch, index, total, progress }) {
  // Each char animates over a slice of scroll progress, with a small
  // overlap so transitions are continuous, not stepwise.
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [start, end], [0.2, 1]);

  const isSpace = ch === " ";

  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      aria-hidden={false}
    >
      {/* invisible placeholder preserves layout */}
      <span style={{ opacity: 0 }}>{isSpace ? "\u00A0" : ch}</span>
      <motion.span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity,
          willChange: "opacity",
        }}
      >
        {isSpace ? "\u00A0" : ch}
      </motion.span>
    </span>
  );
}

// ───── Magnet ────────────────────────────────────────────────────────────────

/**
 * Mouse-following magnetic hover effect.
 *
 * @param {object} p
 * @param {number} [p.padding=150]      Activation ring around the element in px.
 * @param {number} [p.strength=3]       Higher = subtler movement.
 * @param {string} [p.activeTransition="transform 0.3s ease-out"]
 * @param {string} [p.inactiveTransition="transform 0.6s ease-in-out"]
 * @param {boolean}[p.disabled=false]   Forces inert (used for SSR / reduced motion).
 *
 * Renders a single child element and clones it to inject the ref/transform.
 * If multiple children are passed, they're wrapped in a span.
 */
export function Magnet({
  padding = 150,
  strength = 3,
  activeTransition = "transform 0.3s ease-out",
  inactiveTransition = "transform 0.6s ease-in-out",
  disabled = false,
  className = "",
  children,
  ...rest
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const coarse = useIsCoarsePointer();
  const inert = disabled || reduced || coarse;

  useEffect(() => {
    if (inert) return;
    const el = ref.current;
    if (!el) return;

    let active = false;
    let raf = 0;

    const apply = (tx, ty, transitionStyle) => {
      el.style.transition = transitionStyle;
      el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    };

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      // Within the padded ring => activate
      const halfW = rect.width / 2;
      const halfH = rect.height / 2;
      const inX = Math.abs(dx) < halfW + padding;
      const inY = Math.abs(dy) < halfH + padding;

      if (inX && inY) {
        if (!active) {
          active = true;
        }
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          apply(dx / strength, dy / strength, activeTransition);
        });
      } else if (active) {
        active = false;
        cancelAnimationFrame(raf);
        apply(0, 0, inactiveTransition);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      el.style.transform = "";
      el.style.transition = "";
    };
  }, [inert, padding, strength, activeTransition, inactiveTransition]);

  // If a single React element is passed, clone it with our ref so the
  // magnet effect targets the actual visual element (button, image, etc.).
  const onlyChild =
    Children.count(children) === 1 ? Children.only(children) : null;

  if (onlyChild && isValidElement(onlyChild)) {
    return cloneElement(onlyChild, {
      ref,
      style: {
        ...(onlyChild.props.style || {}),
        willChange: "transform",
      },
      className: [onlyChild.props.className, className].filter(Boolean).join(" "),
      ...rest,
    });
  }

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline-block", willChange: "transform" }}
      {...rest}
    >
      {children}
    </span>
  );
}

// Tiny helper export for cases where callers want a motion value directly.
export { useMotionValue };
