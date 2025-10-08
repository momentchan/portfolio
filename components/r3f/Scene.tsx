'use client';

import { Canvas } from '@react-three/fiber';
import { CameraControls, Loader, PerspectiveCamera, Preload } from '@react-three/drei';
import * as THREE from 'three';
import EnvironmentSetup from './EnvironmentSetup';
import Effects from './Effects';
import LevaWraper from '../../lib/r3f-gist/utility/LevaWraper';
import { CustomTrail } from './customTrail/CustomTrail';
import { VATMeshSpawner } from './vat/VATMeshSpawner';
import CameraRotator from './CameraRotator';
import DirectionalLights from './DirectionalLights';
import FlowFieldParticleSystem from './customParticle/FlowFieldParticleSystem';
import { Suspense, useEffect } from 'react';
import GlobalState from './GlobalStates';

export default function Scene() {
  const { setIsMobile } = GlobalState();

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    }, [])


  return (
    <div style={{ width: '100%', height: '100%' }}>
      <LevaWraper initialHidden={true} />
      <Canvas
        shadows
        gl={{ shadowMapType: THREE.PCFSoftShadowMap }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#000000']} />

          <PerspectiveCamera
            makeDefault
            position={[0, 0, 0.75]}
            zoom={1}
            near={0.01}
            far={5}
            fov={60}
          />

          <CameraRotator />
          {/* <CameraControls /> */}

          <CustomTrail />
          <FlowFieldParticleSystem />
          <VATMeshSpawner />

          <EnvironmentSetup />
          <DirectionalLights />
          <Effects />

          <Preload all />
        </Suspense>
      </Canvas>
      <Loader />
    </div >
  );
}
