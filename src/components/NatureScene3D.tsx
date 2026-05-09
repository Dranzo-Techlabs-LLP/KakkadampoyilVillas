"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Sparkles } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

type Variant = "rain" | "breeze" | "mix" | "calm";

function RainStreaks({ count = 600 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 30,
        y: Math.random() * 20,
        z: (Math.random() - 0.5) * 20,
        speed: 0.15 + Math.random() * 0.25,
      })),
    [count]
  );

  useFrame(() => {
    if (!ref.current) return;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      d.y -= d.speed;
      if (d.y < -8) d.y = 12 + Math.random() * 4;
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(0, 0, 0.05);
      dummy.scale.set(0.012, 0.55, 0.012);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[1, 1, 1, 4]} />
      <meshBasicMaterial color="#a8c4d8" transparent opacity={0.45} />
    </instancedMesh>
  );
}

function FloatingLeaf({
  position,
  color,
  scale = 1,
  drift = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
  drift?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = position[0] + Math.sin(t * 0.4 + seed) * 0.6 * drift;
    ref.current.position.y =
      position[1] + Math.cos(t * 0.35 + seed) * 0.4 - ((t * 0.15) % 8);
    if (ref.current.position.y < -4) ref.current.position.y += 8;
    ref.current.rotation.x = t * 0.5 + seed;
    ref.current.rotation.y = t * 0.4 + seed;
    ref.current.rotation.z = Math.sin(t * 0.6 + seed) * 0.5;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <planeGeometry args={[0.45, 0.7, 1, 4]} />
      <meshStandardMaterial
        color={color}
        side={THREE.DoubleSide}
        roughness={0.7}
        metalness={0.05}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}

function Leaves({ count = 18 }: { count?: number }) {
  const colors = ["#3F7E54", "#5A7A4F", "#8AA86F", "#1F4D2B", "#C99B5C", "#9DBE7C"];
  const leaves = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        position: [
          (Math.random() - 0.5) * 16,
          Math.random() * 8 + 1,
          (Math.random() - 0.5) * 8,
        ] as [number, number, number],
        color: colors[i % colors.length],
        scale: 0.6 + Math.random() * 0.9,
        drift: 0.6 + Math.random() * 1.2,
      })),
    [count]
  );

  return (
    <>
      {leaves.map((l, i) => (
        <FloatingLeaf key={i} {...l} />
      ))}
    </>
  );
}

function MistOrbs() {
  return (
    <>
      <Float speed={0.6} rotationIntensity={0.4} floatIntensity={1.4}>
        <mesh position={[-4, 1, -2]}>
          <sphereGeometry args={[2.2, 32, 32]} />
          <meshStandardMaterial
            color="#E8F0E1"
            transparent
            opacity={0.18}
            roughness={1}
          />
        </mesh>
      </Float>
      <Float speed={0.5} rotationIntensity={0.3} floatIntensity={1.2}>
        <mesh position={[5, -1, -3]}>
          <sphereGeometry args={[2.8, 32, 32]} />
          <meshStandardMaterial
            color="#F4F8F0"
            transparent
            opacity={0.14}
            roughness={1}
          />
        </mesh>
      </Float>
      <Float speed={0.4} rotationIntensity={0.2} floatIntensity={1}>
        <mesh position={[0, -2, -4]}>
          <sphereGeometry args={[3.4, 32, 32]} />
          <meshStandardMaterial
            color="#FAFDF7"
            transparent
            opacity={0.12}
            roughness={1}
          />
        </mesh>
      </Float>
    </>
  );
}

export default function NatureScene3D({
  variant = "mix",
  className = "",
  intensity = 1,
}: {
  variant?: Variant;
  className?: string;
  intensity?: number;
}) {
  return (
    <div className={`pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} color="#fff5d6" />
          <directionalLight position={[-5, 3, -5]} intensity={0.3} color="#a8d0a8" />
          <fog attach="fog" args={["#1F4D2B", 8, 22]} />

          <MistOrbs />

          {(variant === "rain" || variant === "mix") && (
            <RainStreaks count={Math.floor(500 * intensity)} />
          )}
          {(variant === "breeze" || variant === "mix") && (
            <Leaves count={Math.floor(20 * intensity)} />
          )}

          <Sparkles
            count={Math.floor(60 * intensity)}
            scale={[20, 12, 8]}
            size={2}
            speed={0.3}
            opacity={0.6}
            color="#E5C492"
          />

          <Environment preset="forest" />
        </Suspense>
      </Canvas>
    </div>
  );
}
