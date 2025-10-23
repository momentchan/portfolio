'use client';

import { CameraControls, PerspectiveCamera, Preload } from '@react-three/drei';
import WebGLCanvas from '../common/WebGLCanvas';
import EnvironmentSetup from './EnvironmentSetup';
import Effects from './Effects';
import { CustomTrail } from './customTrail/CustomTrail';
import { VATMeshSpawner } from './vat/VATMeshSpawner';
import CameraRotator from './CameraRotator';
import DirectionalLights from './DirectionalLights';
import FlowFieldParticleSystem from './customParticle/FlowFieldParticleSystem';
import React, { Suspense, useEffect, useState } from 'react';
import GlobalState from '../common/GlobalStates';
import WebGLLoadingComponent from '../common/WebGLLoadingComponent';
import WebGLErrorComponent from '../common/WebGLErrorComponent';
import { getEnvironment } from '../../utils/environment';
import HintMessage from './HintMessage';
import { GyroscopeProvider, GyroscopePermissionUI } from './gyroscope';

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
        <WebGLCanvas
          shadows
          frameloop={paused ? 'never' : 'always'}
          loadingComponent={<WebGLLoadingComponent />}
          errorComponent={<WebGLErrorComponent />}
          forceLoading={forceLoading}
          forceError={forceError}
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
            <FlowFieldParticleSystem particleCount={particleCount} />
            <VATMeshSpawner />
            <EnvironmentSetup quality={environmentQuality} />
            <DirectionalLights shadowQuality={shadowQuality} />
            <Effects />
          </Suspense>
          <Preload all />
        </WebGLCanvas>
        <HintMessage />
        <GyroscopePermissionUI />
      </div >
    </GyroscopeProvider>
  );
}
