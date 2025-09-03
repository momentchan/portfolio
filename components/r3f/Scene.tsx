'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { useControls, Leva } from 'leva';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';

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

function Flower(){
  const fbx = useLoader(FBXLoader, '/flower.fbx');
  
  const materialParams = useControls('Glass Material', {
    transmission: { value: 0.9, min: 0, max: 1, step: 0.01 },
    thickness: { value: 0.5, min: 0, max: 2, step: 0.01 },
    roughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    clearcoat: { value: 0.1, min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    ior: { value: 1.5, min: 1, max: 5, step: 0.01 },
    attenuationDistance: { value: 0.5, min: 0, max: 10, step: 0.01 },
    attenuationColor: '#ffffff',
    color: '#ffffff',
    opacity: { value: 0.8, min: 0, max: 1, step: 0.01 }
  });
  
  useEffect(() => {
    // Create a single material instance
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      transmission: materialParams.transmission,
      thickness: materialParams.thickness,
      roughness: materialParams.roughness,
      clearcoat: materialParams.clearcoat,
      clearcoatRoughness: materialParams.clearcoatRoughness,
      ior: materialParams.ior,
      attenuationDistance: materialParams.attenuationDistance,
      attenuationColor: new THREE.Color(materialParams.attenuationColor),
      color: new THREE.Color(materialParams.color),
      opacity: materialParams.opacity,
      side: THREE.DoubleSide
    });
    
    // Apply the same material instance to all meshes
    fbx.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = glassMaterial;
      }
    });
  }, [fbx, materialParams]);
  
  return (
    <primitive 
      object={fbx} 
      scale={0.01}
      position={[0, -1, 0]}
    />
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
  const bloomParams = useControls('Bloom Effect', {
    intensity: { value: 1, min: 0, max: 3, step: 0.01 },
    luminanceThreshold: { value: 0.9, min: 0, max: 1, step: 0.01 },
    luminanceSmoothing: { value: 0.025, min: 0, max: 0.1, step: 0.001 },
    mipmapBlur: false
  });

  const dofParams = useControls('Depth of Field', {
    focusDistance: { value: 0, min: 0, max: 1, step: 0.01 },
    focalLength: { value: 0.024, min: 0.001, max: 0.1, step: 0.001 },
    bokehScale: { value: 2, min: 0, max: 10, step: 0.1 },
    height: { value: 480, min: 100, max: 1000, step: 10 }
  });

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

        <Environment preset="city" />


        <EffectComposer>
          <Bloom 
            intensity={bloomParams.intensity}
            luminanceThreshold={bloomParams.luminanceThreshold}
            luminanceSmoothing={bloomParams.luminanceSmoothing}
            mipmapBlur={bloomParams.mipmapBlur}
          />
          <DepthOfField 
            focusDistance={dofParams.focusDistance}
            focalLength={dofParams.focalLength}
            bokehScale={dofParams.bokehScale}
            height={dofParams.height}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
