'use client';

import { OrthographicCamera, Preload } from '@react-three/drei';
import React, { Suspense, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import WebGLCanvas from '../../../../lib/r3f-gist/components/webgl/WebGLCanvas';
import StripeEffect from './StripeEffect';
import DynamicCamera from './DynamicCamera';
import InteractiveEffects from './InteractiveEffects';
import { Perf } from 'r3f-perf'

/**
 * About Scene - 3D interactive background for the about page
 * Features:
 * - Orthographic camera with dynamic aspect ratio adjustment
 * - Stripe effect that works on all devices
 * - Interactive mouse trace and rectangle spawning (desktop only)
 * - Transparent background to overlay content
 */
export default function Scene() {
  const [textures, setTextures] = useState<{
    trace: THREE.Texture | null;
  }>({
    trace: null,
  });

  /**
   * Handles texture updates from the FBO texture manager
   * Updates the trace texture used by StripeEffect
   */
  const handleTextureUpdate = (newTextures: Array<THREE.Texture | null>) => {
    setTextures({
      trace: newTextures[0] || null,
    });
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <WebGLCanvas
        frameloop="always"
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#000000']} />

          <OrthographicCamera
            makeDefault
            position={[0, 0, 10]}
            zoom={50}
            near={0.1}
            far={1000}
            left={-10}
            right={10}
            top={10}
            bottom={-10}
          />
          {/* Camera setup with dynamic aspect ratio adjustment */}
          <DynamicCamera />

          {/* Interactive effects (desktop only) */}
          <InteractiveEffects onTextureUpdate={handleTextureUpdate} />

          {/* Main visual effect that works on all devices */}
          <StripeEffect traceTexture={textures.trace} />
        </Suspense>
        <Preload all />
      </WebGLCanvas>
    </div>
  );
}
