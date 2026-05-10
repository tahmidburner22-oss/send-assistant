import { lazy, Suspense, useEffect, useState } from "react";

// Lazy-load the R3F bundles only when the container is near the viewport.
// Also gates on prefers-reduced-motion and on `@react-three/fiber` being
// available — on a fresh clone without `pnpm install` we render the fallback.

const Hero3DScene = lazy(() => import("./Hero3DScene.jsx"));
const SkillLadder3D = lazy(() => import("./SkillLadder3D.jsx"));

function useShouldRender3D(containerRef) {
  const [should, setShould] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    // Defer until near viewport — keeps LCP fast.
    const el = containerRef?.current;
    if (!el) {
      // Immediate render when no container is given.
      setShould(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShould(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [containerRef]);
  return should;
}

export function LazyHero3D({ variant, containerRef, fallback }) {
  const should = useShouldRender3D(containerRef);
  if (!should) return fallback || null;
  return (
    <Suspense fallback={fallback || null}>
      <Hero3DScene variant={variant} />
    </Suspense>
  );
}

export function LazySkillLadder3D({ progressRef, containerRef, fallback }) {
  const should = useShouldRender3D(containerRef);
  if (!should) return fallback || null;
  return (
    <Suspense fallback={fallback || null}>
      <SkillLadder3D progressRef={progressRef} />
    </Suspense>
  );
}
