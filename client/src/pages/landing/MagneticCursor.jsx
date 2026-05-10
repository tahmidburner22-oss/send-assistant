import { useEffect, useRef, useState } from "react";
import { useVariant } from "./lib/useVariant";

// Custom magnetic cursor (V3 only, desktop, fine-pointer devices).
// A trailing dot + ring that scale up on interactive elements. This is a
// hallmark of premium editorial sites (see godly/awwwards). Kept off V2.
//
// We don't hide the native cursor — just layer ours on top. That way any
// accessibility affordance (e.g. text selection, focus rings) still works.

export default function MagneticCursor() {
  const { variant } = useVariant();
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);
  const pos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const raf = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduced && variant === "v3");
  }, [variant]);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX - 3}px, ${e.clientY - 3}px, 0)`;
      }
      // Detect interactive element under cursor.
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const interactive = !!el?.closest?.(
        "a,button,[role=button],[data-cursor=hover],input,textarea,select,label"
      );
      setHover(interactive);
    };

    const loop = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.18;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x - 16}px, ${ringPos.current.y - 16}px, 0)`;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="fixed top-0 left-0 z-[80] pointer-events-none"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: `1.5px solid ${hover ? "#D96C4A" : "#22201E"}`,
          opacity: 0.7,
          transform: "translate3d(-100px,-100px,0)",
          transition: "width .25s cubic-bezier(.22,1,.36,1), height .25s cubic-bezier(.22,1,.36,1), border-color .2s, opacity .2s, background .2s",
          ...(hover
            ? { width: 52, height: 52, background: "rgba(217,108,74,0.08)", opacity: 0.85 }
            : {}),
        }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="fixed top-0 left-0 z-[80] pointer-events-none"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: hover ? "#D96C4A" : "#22201E",
          transform: "translate3d(-100px,-100px,0)",
          transition: "background .2s",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.4)",
        }}
      />
    </>
  );
}
