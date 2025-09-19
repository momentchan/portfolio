'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, CameraControls } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useControls, Leva } from 'leva';
import EnvironmentSetup from './EnvironmentSetup';
import Flower from './Flower';
import Effects from './Effects';
import FullscreenPlaneWithFBO from './FullscreenPlaneWithFBO';
import RectangleSpawner from './RectangleSpawner';
import FBOScene from './FBOScene';
import Model from './Model';
import MouseTraceFBO from '../../lib/r3f-gist/utility/MouseTrace';
import CausticsPlane from './CausticsPlane';
import ScriptedTrace from './ScriptedTrace';
import LevaWraper from '../../lib/r3f-gist/utility/LevaWraper';
import { FBOTextureManager } from '../../lib/hooks/useFBOTextureManager';

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
    fbo: THREE.Texture | null;
    trace: THREE.Texture | null;
    caustics: THREE.Texture | null;
    scriptedTrace: THREE.Texture | null;
  }>({
    fbo: null,
    trace: null,
    caustics: null,
    scriptedTrace: null
  });

  // Unified FBO texture manager
  const handleTextureUpdate = (newTextures: Array<THREE.Texture | null>) => {
    setTextures({
      fbo: newTextures[0] || null,
      trace: newTextures[1] || null,
      caustics: newTextures[2] || null,
      scriptedTrace: newTextures[3] || null
    });
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <LevaWraper initialHidden={true} />
      <Canvas>
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
        <DynamicCamera />
        {/* <FBOScene ref={fboSceneRef} /> */}
        <CausticsPlane ref={causticsRef} showDebug={false} />
        <MouseTraceFBO ref={traceRef} showDebug={false} dowwnsample={128} />
        {/* <ScriptedTrace ref={scriptedTraceRef} showDebug={true} /> */}

        {/* Single unified FBO texture manager */}
        <FBOTextureManager
          refs={[fboSceneRef, traceRef, causticsRef, scriptedTraceRef]}
          onTextureUpdate={handleTextureUpdate}
        />

        <RectangleSpawner />
        <FullscreenPlaneWithFBO
          fboTexture={textures.fbo}
          traceTexture={textures.trace}
          scriptedTraceTexture={textures.scriptedTrace}
          causticsTexture={textures.caustics} />
        <CameraControls />


        {/* <Effects /> */}
        <EnvironmentSetup />
      </Canvas>
    </div>
  );
}
