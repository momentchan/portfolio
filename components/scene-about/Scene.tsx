'use client';

import { OrthographicCamera, PerspectiveCamera, Preload } from '@react-three/drei';
import LevaWraper from '../../lib/r3f-gist/utility/LevaWraper';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import WebGLCanvas from '../common/WebGLCanvas';
import StripeEffect from './StripeEffect';
import * as THREE from 'three';
import MouseTraceFBO from '../../lib/r3f-gist/utility/MouseTrace';
import { FBOTextureManager } from '../../lib/hooks/useFBOTextureManager';
import { useThree } from '@react-three/fiber';
import RectangleSpawner from './RectangleSpawner';

function DynamicCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      const aspect = size.width / size.height;
      const frustumSize = 20; // Total height of the view

      camera.left = -frustumSize * aspect / 2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
    }
  }, [camera, size]);

  return null;
}


export default function Scene() {
  // Unified ref management with proper typing
  const fboSceneRef = useRef<{ getFBOTexture: () => THREE.Texture | null } | null>(null);
  const traceRef = useRef<{ getFBOTexture: () => THREE.Texture | null; clearTraces?: () => void } | null>(null);
  const causticsRef = useRef<{ getMaterial: () => THREE.ShaderMaterial | null; getFBOTexture: () => THREE.Texture | null } | null>(null);
  const scriptedTraceRef = useRef<{ getFBOTexture: () => THREE.Texture | null } | null>(null);

  // Unified texture state management
  const [textures, setTextures] = useState<{
    trace: THREE.Texture | null;
  }>({
    trace: null,
  });

  // Unified FBO texture manager
  const handleTextureUpdate = (newTextures: Array<THREE.Texture | null>) => {
    setTextures({
      trace: newTextures[0] || null,
    });
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <WebGLCanvas
        shadows
        frameloop="always"
        gl={{
          alpha: true,
        }}
        onCreated={(state) => {
          // Set transparent background
          if (state.gl) {
            state.gl.setClearColor('#000000', 0); // 0 alpha for transparent background
          }
        }}
      >
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
        <Suspense fallback={null}>
          <DynamicCamera />
          <MouseTraceFBO ref={traceRef} showDebug={false} downsample={8} />
          <FBOTextureManager
            refs={[traceRef]}
            onTextureUpdate={handleTextureUpdate}
          />
          <RectangleSpawner />

          <StripeEffect traceTexture={textures.trace} />
        </Suspense>
        <Preload all />
      </WebGLCanvas>
    </div>
  );
}
