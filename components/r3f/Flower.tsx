'use client';

import { useLoader } from '@react-three/fiber';
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { useControls } from 'leva';
import { MeshTransmissionMaterial, Float } from '@react-three/drei';

// Custom hook for glass material configuration
const useGlassConfig = () => {
  return useControls('Glass Material', {
    samples: { value: 16, min: 1, max: 32, step: 1 },
    resolution: { value: 512, min: 64, max: 2048, step: 64 },
    transmission: { value: 1, min: 0, max: 1 },
    roughness: { value: 0.15, min: 0, max: 1, step: 0.01 },
    clearcoat: { value: 0.1, min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    thickness: { value: 200, min: 0, max: 200, step: 0.01 },
    backsideThickness: { value: 200, min: 0, max: 200, step: 0.01 },
    ior: { value: 1.5, min: 1, max: 5, step: 0.01 },
    chromaticAberration: { value: 1, min: 0, max: 1 },
    anisotropy: { value: 1, min: 0, max: 10, step: 0.01 },
    distortion: { value: 0.7, min: 0, max: 1, step: 0.01 },
    distortionScale: { value: 1, min: 0.01, max: 1, step: 0.01 },
    temporalDistortion: { value: 0.1, min: 0, max: 1, step: 0.01 },
    attenuationDistance: { value: 0.5, min: 0, max: 10, step: 0.01 },
    attenuationColor: '#ffffff',
    color: '#ffffff',
  }, { collapsed: true });
};

// Component for individual mesh with glass material
const GlassMesh = ({ mesh, config }: { 
  mesh: THREE.Mesh; 
  config: any; 
}) => (
  <Float floatIntensity={0} rotationIntensity={0}>
    <mesh
      geometry={mesh.geometry}
      position={mesh.position}
      rotation={mesh.rotation}
      scale={mesh.scale}
      castShadow
      receiveShadow
    >
      <MeshTransmissionMaterial
        {...config}
        toneMapped={false}
        backside={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  </Float>
);

export default function Flower(){
  const fbx = useLoader(FBXLoader, '/flower.fbx');
  const glassConfig = useGlassConfig();
  
  // Extract meshes from the loaded FBX
  const meshes = useMemo(() => {
    const arr: THREE.Mesh[] = [];
    fbx.traverse((child) => { 
      if (child instanceof THREE.Mesh) arr.push(child);
    });
    return arr;
  }, [fbx]);
  
  return (
    <group scale={0.01} position={[0, -1, 0]}>
      {meshes.map((mesh, i) => (
        <GlassMesh
          key={i}
          mesh={mesh}
          config={glassConfig}
        />
      ))}
    </group>
  );
}
