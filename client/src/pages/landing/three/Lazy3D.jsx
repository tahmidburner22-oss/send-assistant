// Stub for the 3D lazy loader.
// The full 3D implementation (Hero3DScene / SkillLadder3D) is temporarily
// disabled to keep deployment builds green. We always render the 2D fallback
// passed by the parent. See Hero3DScene.jsx.disabled / SkillLadder3D.jsx.disabled
// for the original implementation.

export function LazyHero3D({ fallback }) {
  return fallback || null;
}

export function LazySkillLadder3D({ fallback }) {
  return fallback || null;
}
