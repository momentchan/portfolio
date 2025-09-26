'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, CameraControls, PerspectiveCamera, Environment } from '@react-three/drei';
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
import ParticleSystem from '../../lib/particle-system/ParticleSystem';
import { GradientColorConfig, ZeroVelocityConfig, RandomSizeConfig, RandomPositionConfig, UniformSizeConfig, GridPositionConfig } from '@/lib/particle-system/config';
import BasicExamples from '@/lib/particle-system/examples/BasicExamples';
import AdvancedExamples from '@/lib/particle-system/examples/AdvancedExamples';
import CustomExamples from '@/lib/particle-system/examples/CustomExamples';
import CustomUniformExamples from '@/lib/particle-system/examples/CustomUniformExamples';
import { OrbitalExample } from '@/lib/trail-gpu/examples/OrbitalExample';
import { FlowFieldExample } from '@/lib/trail-gpu/examples/FlowFieldExample';
import { CustomTrail } from './customTrail/CustomTrail';

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
  return <><directionalLight
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

    {/* {directionalLightRef.current && (
      <directionalLightHelper ref={helperRef} args={[directionalLightRef.current, 2, 0xff0000]} />
    )} */}
  </>;
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
      <Canvas
        shadows
        gl={{ shadowMapType: THREE.PCFSoftShadowMap }}
      >
        <color attach="background" args={['#000000']} />
        {/* <OrthographicCamera
          makeDefault
          position={[0, 0, -10]}
          zoom={50}
          near={0.1}
          far={1000}
          left={-10}
          right={10}
          top={10}
          bottom={-10} 
        /> */}

        <PerspectiveCamera
          makeDefault
          position={[0, 0, 0.5]}
          zoom={1}
          near={0.1}
          far={100}
          fov={60}
        />



        <DynamicCamera />
        {/* <FBOScene ref={fboSceneRef} /> */}
        {/* <CausticsPlane ref={causticsRef} showDebug={false} /> */}
        {/* <MouseTraceFBO ref={traceRef} showDebug={true} downsample={1} /> */}
        {/* <ScriptedTrace ref={scriptedTraceRef} showDebug={true} /> */}

        {/* Single unified FBO texture manager */}
        <FBOTextureManager
          refs={[fboSceneRef, traceRef, causticsRef, scriptedTraceRef]}
          onTextureUpdate={handleTextureUpdate}
        />

        {/* <RectangleSpawner /> */}
        {/* <FullscreenPlaneWithFBO
          fboTexture={textures.fbo}
          traceTexture={textures.trace}
          scriptedTraceTexture={textures.scriptedTrace}
          causticsTexture={textures.caustics} /> */}
        <CameraControls />

        {/* <ParticleSystem
          count={1024}
          config={
            {
              position: new GridPositionConfig({ x: [-0.2, 0.2], y: [-0.2, 0.2], z: [-0.2, 0.2] }),
              velocity: new ZeroVelocityConfig(),
              size: new UniformSizeConfig(1)
            }}
        /> */}

        <CustomTrail />
        <DirectionalLight />

        <Effects />
        {/* <EnvironmentSetup /> */}
      </Canvas>
    </div >
  );
}
