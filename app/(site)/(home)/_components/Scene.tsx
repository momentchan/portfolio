'use client';

import { CameraControls, PerspectiveCamera, Preload } from '@react-three/drei';
import { WebGLCanvas, WebGLLoadingComponent, WebGLErrorComponent } from '@/packages/r3f-gist/components';
import EnvironmentSetup from './EnvironmentSetup';
import Effects from './effects/Effects';
import { CustomTrail } from './customTrail/CustomTrail';
import { VATMeshSpawner } from './vat/VATMeshSpawner';
import CameraRotator from './CameraRotator';
import DirectionalLights from './DirectionalLights';
import FlowFieldParticleSystem from './customParticle/FlowFieldParticleSystem';
import React, { Suspense, useEffect, useState } from 'react';
import GlobalState from '@site/_shared/state/GlobalStates';
import { getEnvironment } from '@site/_shared/utils/environment';
import HintMessage from './HintMessage';
import { GyroscopeProvider, GyroscopePermissionUI } from './gyroscope';
import { AdaptiveDPRMonitor } from '@/packages/r3f-gist/components/webgl/AdaptiveDPRMonitor';
import { Canvas } from '@react-three/fiber';
import { WebGPURenderer } from "three/webgpu";
import FlowFieldParticleSystemWebGPU from './customParticle/FlowFieldParticleSystemWebGPU';


export default function Scene() {
  const { setPaused, paused, setEnvironment, isProd, isMobile } = GlobalState();

  // Testing states for WebGLCanvas loading and error layouts
  const [forceLoading, setForceLoading] = useState(false);
  const [forceError, setForceError] = useState(false);

  // Calculate actual values based on isMobile (used in component props)
  const particleCount = isMobile ? 2048 : 2024;
  const shadowQuality = isMobile ? 2048 : 4096;
  const environmentQuality = isMobile ? 128 : 256;

  // Initialize environment detection
  useEffect(() => {
    const env = getEnvironment();
    setEnvironment(env);
  }, [setEnvironment]);

  // Mobile detection is now handled centrally in GlobalStates component

  useEffect(() => {
    if (isProd) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setPaused((prev) => {
          return !prev;
        });
      }

      // Testing keys for WebGLCanvas layouts
      if (event.key === 'l' || event.key === 'L') {
        event.preventDefault();
        setForceLoading(true);
        setForceError(false);
        // Auto reset after 3 seconds
        setTimeout(() => setForceLoading(false), 3000);
      }
      if (event.key === 'e' || event.key === 'E') {
        event.preventDefault();
        setForceError(true);
        setForceLoading(false);
        // Auto reset after 3 seconds
        setTimeout(() => setForceError(false), 3000);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setPaused, isProd]);

  return (
    <GyroscopeProvider>
      <div style={{ width: '100%', height: '100%' }}>
        <Canvas
          shadows
          frameloop={paused ? 'never' : 'always'}
          gl={(canvas) => {
            const renderer = new WebGPURenderer({
              ...canvas as any,
              powerPreference: "high-performance",
              antialias: true,
              alpha: true,
            });
            renderer.setClearColor('#000000');
            renderer.autoClear = true;
            // renderer.inspector = new Inspector();
            renderer.sortObjects = false;

            return renderer.init().then(() => renderer);
          }}
        // loadingComponent={<WebGLLoadingComponent />}
        // errorComponent={<WebGLErrorComponent />}
        // forceLoading={forceLoading}
        // forceError={forceError}
        >
          <Suspense fallback={null}>
            <color attach="background" args={['#000000']} />

            <AdaptiveDPRMonitor initialDPR={1} />

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
            {/* <CustomTrail /> */}
            <FlowFieldParticleSystemWebGPU />
            {/* <VATMeshSpawner /> */}
            <EnvironmentSetup quality={environmentQuality} />
            <DirectionalLights shadowQuality={shadowQuality} />
            {/* <Effects /> */}
          </Suspense>
          <Preload all />
        </Canvas>
        <HintMessage />
        <GyroscopePermissionUI />
      </div >
    </GyroscopeProvider>
  );
}
