'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { useControls, Leva } from 'leva';
import EnvironmentSetup from './EnvironmentSetup';
import Flower from './Flower';
import Effects from './Effects';

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

function FullscreenQuad() {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  // Vertex shader for fullscreen quad
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;
  
  // Fragment shader for animated background
  const fragmentShader = `
    uniform float time;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      
      // Create animated gradient
      float t = time * 0.5;
      vec3 color1 = vec3(0.1, 0.2, 0.4); // Dark blue
      vec3 color2 = vec3(0.3, 0.1, 0.6); // Purple
      vec3 color3 = vec3(0.1, 0.4, 0.3); // Dark green
      
      float noise = sin(uv.x * 10.0 + t) * sin(uv.y * 10.0 + t * 0.7) * 0.5 + 0.5;
      
      vec3 finalColor = mix(color1, color2, noise);
      finalColor = mix(finalColor, color3, sin(uv.y + t) * 0.5 + 0.5);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;
  
  useFrame((state) => {
    if (meshRef.current.material) {
      (meshRef.current.material as THREE.ShaderMaterial).uniforms.time.value = state.clock.elapsedTime;
    }
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0, -1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          time: { value: 0 }
        }}
      />
    </mesh>
  );
}

export default function Scene() {

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Leva />
      <Canvas camera={{ position: [0, 2, 3], fov: 50 }}>
        {/* <FullscreenQuad /> */}
        <ambientLight intensity={0.6} />
        {/* <directionalLight position={[3, 3, 3]} intensity={1} /> */}
        {/* <SpinningBox /> */}
        <Flower />
        <OrbitControls enableDamping />

        <EnvironmentSetup />

        <Effects />
      </Canvas>
    </div>
  );
}
