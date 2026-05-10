import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  MeshTransmissionMaterial,
  Environment,
  Lightformer,
  PerspectiveCamera,
  RoundedBox,
  Text,
} from "@react-three/drei";
import * as THREE from "three";

// ──────────────────────────────────────────────────────────────────
// Adaptly 3D hero scene.
// A warm, editorial composition: one central soft-lit "engine" core
// surrounded by drifting rounded-tile cards representing product pillars.
// The scene is shared between V2 (Immersive) and V3 (Overdrive) — V3
// cranks up card count, bloom-ish lightformers, rotation speed, mouse
// parallax, and material complexity.
// ──────────────────────────────────────────────────────────────────

// Brand palette (OKLCH-matched, tinted away from pure neutrals).
const BRAND = {
  cream: "#F4F0E6",
  ink: "#22201E",
  terracotta: "#D96C4A",
  honey: "#E5B96E",
  sage: "#7F8C72",
};

const PILLARS = [
  { label: "EHCP", color: BRAND.terracotta },
  { label: "Worksheets", color: BRAND.honey },
  { label: "Parent Portal", color: BRAND.sage },
  { label: "Analytics", color: BRAND.ink },
  { label: "Screener", color: BRAND.terracotta },
  { label: "Reading", color: BRAND.honey },
  { label: "Skill Ladder", color: BRAND.sage },
  { label: "Behaviour", color: BRAND.terracotta },
  { label: "Compliance", color: BRAND.ink },
  { label: "Wellbeing", color: BRAND.honey },
  { label: "Lesson Plans", color: BRAND.sage },
  { label: "Rubrics", color: BRAND.terracotta },
];

// A soft pointer-tracker that we feed to scene objects for parallax.
function usePointer() {
  const ref = useRef(new THREE.Vector2(0, 0));
  useFrame(({ pointer }) => {
    // ease pointer toward target
    ref.current.x += (pointer.x - ref.current.x) * 0.06;
    ref.current.y += (pointer.y - ref.current.y) * 0.06;
  });
  return ref;
}

// Central "engine": a rounded glass core with a warm inner glow.
function Core({ variant }) {
  const group = useRef();
  const inner = useRef();
  const pointer = usePointer();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = t * (variant === "v3" ? 0.22 : 0.12);
      group.current.rotation.x = Math.sin(t * 0.35) * 0.08;
      // Parallax tilt from pointer.
      group.current.rotation.y += pointer.current.x * 0.25;
      group.current.rotation.x += pointer.current.y * 0.18;
    }
    if (inner.current) {
      const s = 1 + Math.sin(t * 1.1) * 0.04;
      inner.current.scale.setScalar(s);
    }
  });

  const useTransmission = variant === "v3";

  return (
    <group ref={group}>
      {/* Outer glass shell */}
      <RoundedBox args={[1.7, 1.7, 1.7]} radius={0.32} smoothness={6} castShadow receiveShadow>
        {useTransmission ? (
          <MeshTransmissionMaterial
            thickness={0.6}
            roughness={0.15}
            transmission={1}
            ior={1.35}
            chromaticAberration={0.04}
            anisotropicBlur={0.3}
            distortion={0.15}
            distortionScale={0.3}
            temporalDistortion={0.1}
            backside
            color={BRAND.cream}
            attenuationColor={BRAND.honey}
            attenuationDistance={1.4}
          />
        ) : (
          <meshPhysicalMaterial
            color={BRAND.cream}
            roughness={0.25}
            metalness={0.05}
            clearcoat={1}
            clearcoatRoughness={0.15}
            transmission={0.55}
            thickness={0.7}
            ior={1.3}
          />
        )}
      </RoundedBox>

      {/* Warm inner orb that pulses */}
      <mesh ref={inner} position={[0, 0, 0]}>
        <icosahedronGeometry args={[0.62, 4]} />
        <MeshDistortMaterial
          color={BRAND.terracotta}
          roughness={0.3}
          metalness={0.1}
          distort={variant === "v3" ? 0.42 : 0.28}
          speed={variant === "v3" ? 1.8 : 1.2}
          emissive={BRAND.terracotta}
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Subtle accent ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.012, 32, 128]} />
        <meshBasicMaterial color={BRAND.honey} transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

// A single drifting tile around the core.
function OrbitTile({ index, total, radius, color, label, variant }) {
  const group = useRef();
  const speed = variant === "v3" ? 0.18 : 0.1;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const angle = (index / total) * Math.PI * 2 + t * speed;
    const y = Math.sin(t * 0.5 + index) * 0.3;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (group.current) {
      group.current.position.set(x, y, z);
      // Face the camera gently.
      group.current.lookAt(state.camera.position);
      // Slight wobble for life.
      group.current.rotation.z = Math.sin(t * 0.7 + index) * 0.05;
    }
  });

  const [w, h] = variant === "v3" ? [0.95, 0.52] : [0.85, 0.48];

  return (
    <group ref={group}>
      <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.35}>
        <RoundedBox args={[w, h, 0.055]} radius={0.09} smoothness={4} castShadow>
          <meshPhysicalMaterial
            color={BRAND.cream}
            roughness={0.35}
            metalness={0.02}
            clearcoat={0.7}
            clearcoatRoughness={0.25}
            transmission={0.3}
            thickness={0.2}
            ior={1.25}
          />
        </RoundedBox>
        {/* Color tab on the left edge */}
        <mesh position={[-w / 2 + 0.05, 0, 0.028]}>
          <boxGeometry args={[0.04, h * 0.55, 0.002]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <Text
          position={[0.04, 0, 0.03]}
          fontSize={0.085}
          color={BRAND.ink}
          anchorX="center"
          anchorY="middle"
          maxWidth={w - 0.18}
          letterSpacing={-0.02}
        >
          {label}
        </Text>
      </Float>
    </group>
  );
}

function Orbit({ variant }) {
  const tiles = variant === "v3" ? PILLARS : PILLARS.slice(0, 8);
  const radius = variant === "v3" ? 2.9 : 2.6;
  return tiles.map((p, i) => (
    <OrbitTile
      key={p.label}
      index={i}
      total={tiles.length}
      radius={radius}
      color={p.color}
      label={p.label}
      variant={variant}
    />
  ));
}

// Small dust particles (V3 only) — cheap, gives the scene atmosphere.
function Dust({ count = 80 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color={BRAND.honey}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// Camera dolly that slowly drifts — gives a cinematic feel without scroll binding.
function CameraRig({ variant }) {
  const { camera } = useThree();
  const pointer = usePointer();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const base = variant === "v3" ? 6.2 : 5.8;
    camera.position.x = Math.sin(t * 0.15) * 0.6 + pointer.current.x * 0.7;
    camera.position.y = Math.cos(t * 0.2) * 0.35 + pointer.current.y * 0.5;
    camera.position.z = base;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Scene({ variant }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={38} />
      <CameraRig variant={variant} />

      {/* Warm three-point lighting — no harsh shadows. */}
      <ambientLight intensity={0.55} color={BRAND.cream} />
      <directionalLight
        position={[3, 4, 5]}
        intensity={1.1}
        color="#FFF3DE"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-4, -2, -3]} intensity={0.6} color={BRAND.terracotta} />
      <pointLight position={[0, 3, -2]} intensity={0.35} color={BRAND.honey} />

      <Environment resolution={256} background={false}>
        <group rotation={[0, 0, 0]}>
          <Lightformer form="rect" intensity={2} position={[4, 3, 4]} scale={[6, 2, 1]} color={BRAND.honey} />
          <Lightformer form="rect" intensity={1.1} position={[-4, 2, 3]} scale={[5, 2, 1]} color={BRAND.cream} />
          <Lightformer form="circle" intensity={1.4} position={[0, -3, 2]} scale={3} color={BRAND.terracotta} />
          {variant === "v3" && (
            <Lightformer form="ring" intensity={1.8} position={[0, 0, -5]} scale={7} color={BRAND.honey} />
          )}
        </group>
      </Environment>

      <Core variant={variant} />
      <Orbit variant={variant} />
      {variant === "v3" && <Dust count={140} />}
    </>
  );
}

export default function Hero3DScene({ variant = "v2" }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      className="absolute inset-0"
      style={{ touchAction: "none" }}
    >
      <Suspense fallback={null}>
        <Scene variant={variant} />
      </Suspense>
    </Canvas>
  );
}
