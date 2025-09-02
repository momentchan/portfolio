'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function SpinningBox() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    ref.current.rotation.x += dt * 0.6;
    ref.current.rotation.y += dt * 0.8;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4f46e5" />
    </mesh>
  );
}

export default function Scene() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [2.5, 2, 2.5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 3]} intensity={1} />
        <SpinningBox />
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
