'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls, PerspectiveCamera } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { useControls } from 'leva';
import EnvironmentSetup from './EnvironmentSetup';
import Effects from './Effects';
import LevaWraper from '../../lib/r3f-gist/utility/LevaWraper';
import { CustomTrail } from './customTrail/CustomTrail';
import { VATMeshSpawner } from './vat/VATMeshSpawner';

function DirectionalLight() {
  const controls = useControls('Directional Light', {
    intensity: { value: 1, min: 0, max: 10, step: 0.1 },
  });
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const helperRef = useRef<THREE.DirectionalLightHelper | null>(null);

  useFrame((state) => {
    if (directionalLightRef.current) {
      const time = state.clock.elapsedTime * 2;
      const radius = 8; // Circle radius
      const xPosition = Math.cos(time * 0.3) * radius; // Circular motion on X
      const zPosition = Math.sin(time * 0.3) * radius; // Circular motion on Z
      directionalLightRef.current.position.set(xPosition, 10, zPosition);
    }
    if (helperRef.current) {
      helperRef.current.update();
    }
  });
  return <>
    <directionalLight
      ref={directionalLightRef}
      position={[0, 10, 0]}
      intensity={controls.intensity} castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
      shadow-bias={-0.001} />
  </>;
}


export default function Scene() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <LevaWraper initialHidden={true} />
      <Canvas
        shadows
        gl={{ shadowMapType: THREE.PCFSoftShadowMap }}
      >
        <color attach="background" args={['#000000']} />

        <PerspectiveCamera
          makeDefault
          position={[0, 2, 1]}
          zoom={1}
          near={0.1}
          far={5}
          fov={60}
        />

        <CameraControls />
        <EnvironmentSetup />
        <CustomTrail />
        <DirectionalLight />
        <Effects />
        <VATMeshSpawner />
      </Canvas>
    </div >
  );
}
