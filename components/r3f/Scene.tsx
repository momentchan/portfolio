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

// Generic FBO texture manager
function FBOTextureManager({ ref, onTextureUpdate }: {
  ref: React.RefObject<{ getFBOTexture: () => THREE.Texture | null } | null>;
  onTextureUpdate: (texture: THREE.Texture | null) => void;
}) {
  useFrame(() => {
    if (ref.current) {
      const texture = ref.current.getFBOTexture();
      onTextureUpdate(texture);
    }
  });
  return null;
}


export default function Scene() {
  const fboSceneRef = useRef<{ getFBOTexture: () => THREE.Texture | null }>(null);
  const [fboTexture, setFboTexture] = useState<THREE.Texture | null>(null);
  const traceRef = useRef<{ getFBOTexture: () => THREE.Texture | null; clearTraces?: () => void }>(null);
  const [traceTexture, setTraceTexture] = useState<THREE.Texture | null>(null);
  const causticsRef = useRef<{ getMaterial: () => THREE.ShaderMaterial | null; getFBOTexture: () => THREE.Texture | null }>(null);
  const [causticsTexture, setCausticsTexture] = useState<THREE.Texture | null>(null);
  const scriptedTraceRef = useRef<{ getFBOTexture: () => THREE.Texture | null }>(null);
  const [scriptedTraceTexture, setScriptedTraceTexture] = useState<THREE.Texture | null>(null);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Leva />
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
        {/* <FBOTextureManager fboTestRef={fboSceneRef} onTextureUpdate={setFboTexture} /> */}
        <CausticsPlane ref={causticsRef} />
        <FBOTextureManager ref={causticsRef} onTextureUpdate={setCausticsTexture} />
        <MouseTraceFBO ref={traceRef} showDebug={true} dowwnsample={128} />
        <FBOTextureManager ref={traceRef} onTextureUpdate={setTraceTexture} />

        <RectangleSpawner />
        <FullscreenPlaneWithFBO fboTexture={fboTexture} traceTexture={traceTexture} scriptedTraceTexture={scriptedTraceTexture}
          causticsTexture={causticsTexture} />

        <ScriptedTrace ref={scriptedTraceRef} showDebug={true} />
        <FBOTextureManager ref={scriptedTraceRef} onTextureUpdate={setScriptedTraceTexture} />

        {/* <CameraControls /> */}
        {/* <Effects /> */}
        <EnvironmentSetup />
      </Canvas>
    </div>
  );
}
