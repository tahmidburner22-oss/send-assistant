import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  PerspectiveCamera,
  RoundedBox,
  Text,
  Float,
} from "@react-three/drei";
import * as THREE from "three";

// A physical "skill ladder" that replaces the 2D zoom card in V3.
// Each rung lifts and lights as you scroll the parent section.
// `progress` (0..1) is wired from the framer-motion scrollYProgress.

const BRAND = {
  cream: "#F4F0E6",
  ink: "#22201E",
  terracotta: "#D96C4A",
  honey: "#E5B96E",
  sage: "#7F8C72",
};

const RUNGS = [
  { label: "Letter sounds", level: "Emerging" },
  { label: "Blending CVC", level: "Emerging" },
  { label: "Digraphs", level: "Developing" },
  { label: "Multi-syllable", level: "Developing" },
  { label: "Fluency", level: "Secure" },
  { label: "Comprehension", level: "Secure" },
];

function Rung({ index, total, progress, data }) {
  const ref = useRef();
  const targetFill = useRef(0);
  useFrame(() => {
    if (!ref.current) return;
    const threshold = (index + 0.3) / total;
    const active = progress.current >= threshold;
    targetFill.current += ((active ? 1 : 0) - targetFill.current) * 0.08;
    const fill = targetFill.current;

    // Lift + warm glow as the rung "activates".
    const y = index * 0.55 - (total * 0.55) / 2 + fill * 0.15;
    ref.current.position.y = y;
    ref.current.position.z = -0.5 + fill * 0.3;

    const mat = ref.current.children[0]?.material;
    if (mat) {
      mat.emissiveIntensity = 0.05 + fill * 0.55;
    }
    const bar = ref.current.children[1];
    if (bar) {
      bar.scale.x = 0.02 + fill * 0.78;
      bar.position.x = -1.1 + (0.02 + fill * 0.78) / 2;
    }
  });

  const color =
    data.level === "Emerging"
      ? BRAND.honey
      : data.level === "Developing"
      ? BRAND.terracotta
      : BRAND.sage;

  return (
    <group ref={ref}>
      <RoundedBox args={[2.5, 0.42, 0.14]} radius={0.07} smoothness={4}>
        <meshPhysicalMaterial
          color={BRAND.cream}
          roughness={0.35}
          metalness={0.04}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          emissive={color}
          emissiveIntensity={0.08}
        />
      </RoundedBox>
      {/* Fill bar inside the card (scaled at runtime). */}
      <mesh position={[-1.1, -0.08, 0.08]}>
        <boxGeometry args={[1, 0.05, 0.01]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text
        position={[-1.1, 0.08, 0.08]}
        fontSize={0.11}
        color={BRAND.ink}
        anchorX="left"
        anchorY="middle"
        letterSpacing={-0.02}
      >
        {data.label}
      </Text>
      <Text
        position={[1.05, 0.08, 0.08]}
        fontSize={0.075}
        color={color}
        anchorX="right"
        anchorY="middle"
      >
        {data.level.toUpperCase()}
      </Text>
    </group>
  );
}

function LadderScene({ progressRef }) {
  const group = useRef();
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = -0.35 + Math.sin(t * 0.2) * 0.08 + progressRef.current * 0.55;
    group.current.rotation.x = -0.1 - progressRef.current * 0.08;
    group.current.position.y = -progressRef.current * 0.3;
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5.5]} fov={38} />
      <ambientLight intensity={0.5} color={BRAND.cream} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} color="#FFE8C4" />
      <pointLight position={[-3, 2, -2]} intensity={0.6} color={BRAND.terracotta} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={1.8} position={[3, 3, 3]} scale={[5, 2, 1]} color={BRAND.honey} />
        <Lightformer form="rect" intensity={1.3} position={[-4, -2, 2]} scale={[4, 2, 1]} color={BRAND.terracotta} />
      </Environment>

      <group ref={group}>
        <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.1}>
          {RUNGS.map((r, i) => (
            <Rung key={r.label} index={i} total={RUNGS.length} progress={progressRef} data={r} />
          ))}
        </Float>
      </group>
    </>
  );
}

export default function SkillLadder3D({ progressRef }) {
  // Safety ref so consumers can pass a scalar MotionValue or a regular ref.
  const fallback = useRef(0);
  const ref = progressRef?.current !== undefined ? progressRef : fallback;

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      className="absolute inset-0"
    >
      <Suspense fallback={null}>
        <LadderScene progressRef={ref} />
      </Suspense>
    </Canvas>
  );
}
