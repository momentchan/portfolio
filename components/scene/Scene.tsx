'use client';

import { CameraControls, PerspectiveCamera, Preload } from '@react-three/drei';
import * as THREE from 'three';
import WebGLCanvas from '../common/WebGLCanvas';
import EnvironmentSetup from './EnvironmentSetup';
import Effects from './Effects';
import LevaWraper from '../../lib/r3f-gist/utility/LevaWraper';
import { CustomTrail } from './customTrail/CustomTrail';
import { VATMeshSpawner } from './vat/VATMeshSpawner';
import CameraRotator from './CameraRotator';
import DirectionalLights from './DirectionalLights';
import FlowFieldParticleSystem from './customParticle/FlowFieldParticleSystem';
import React, { Suspense, useEffect } from 'react';
import GlobalState from '../common/GlobalStates';
import BGM from './Bgm';

export default function Scene() {
  const { setIsMobile, setPaused, paused } = GlobalState();

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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setPaused((prev) => {
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setPaused]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <WebGLCanvas
        shadows
        frameloop={paused ? 'never' : 'always'}
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
          <BGM />
        </Suspense>
        <Preload all />
      </WebGLCanvas>
    </div >
  );
}
