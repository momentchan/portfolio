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

export default function Scene() {
  const { setIsMobile, setPaused, paused, setEnvironment, isProd } = GlobalState();

  // Testing states for WebGLCanvas loading and error layouts
  const [forceLoading, setForceLoading] = useState(false);
  const [forceError, setForceError] = useState(false);

  // Initialize environment detection
  useEffect(() => {
    const env = getEnvironment();
    setEnvironment(env);
  }, [setEnvironment]);

  // Detect mobile device based on screen size
  useEffect(() => {
    const checkIsMobile = () => {
      // Use viewport width instead of screen width for better accuracy
      const isMobile = window.innerWidth <= 768; // Common mobile breakpoint
      setIsMobile(isMobile);
    };

    // Check on mount
    checkIsMobile();

    // Listen for resize events to handle orientation changes and window resizing
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [setIsMobile])

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
          <CustomTrail />
          <FlowFieldParticleSystem />
          <VATMeshSpawner />
          <EnvironmentSetup />
          <DirectionalLights />
          <Effects />
        </Suspense>
        <Preload all />
      </WebGLCanvas>
    </div >
  );
}
