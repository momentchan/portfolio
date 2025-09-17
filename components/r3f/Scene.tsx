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

function FullscreenQuad() {
  const meshRef = useRef<THREE.Mesh>(null!);

  // Vertex shader for fullscreen quad
  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  // Fragment shader for animated background
  const fragmentShader = /* glsl */ `
    uniform float time;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      
      // Create animated gradient
      float t = time * 0.5;
      vec3 color1 = vec3(0.1, 0.2, 0.4); // Dark blue
      vec3 color2 = vec3(0.3, 0.1, 0.6); // Purple
      vec3 color3 = vec3(0.1, 0.4, 0.3); // Dark green
      
      float noise = sin(uv.x * 10.0 + t) * sin(uv.y * 10.0 + t * 0.7) * 0.5 + 0.5;
      
      vec3 finalColor = mix(color1, color2, noise);
      finalColor = mix(finalColor, color3, sin(uv.y + t) * 0.5 + 0.5);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  useFrame((state) => {
    if (meshRef.current.material) {
      (meshRef.current.material as THREE.ShaderMaterial).uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          time: { value: 0 }
        }}
      />
    </mesh>
  );
}

// Component to manage FBO texture inside Canvas
function FBOTextureManager({ fboTestRef, onTextureUpdate }: { 
  fboTestRef: React.RefObject<{ getFBOTexture: () => THREE.Texture | null } | null>;
  onTextureUpdate: (texture: THREE.Texture | null) => void;
}) {
  useFrame(() => {
    if (fboTestRef.current) {
      const texture = fboTestRef.current.getFBOTexture();
      onTextureUpdate(texture);
    }
  });
  return null;
}

export default function Scene() {
  const fboSceneRef = useRef<{ getFBOTexture: () => THREE.Texture | null }>(null);
  const [fboTexture, setFboTexture] = useState<THREE.Texture | null>(null);
  const traceRef = useRef<{ getFBOTexture: () => THREE.Texture | null; clearTraces?: () => void }>(null);

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
        <FBOScene ref={fboSceneRef} />
        <FBOTextureManager fboTestRef={fboSceneRef} onTextureUpdate={setFboTexture} />
        {/* <FullscreenPlane /> */}
        <MouseTraceFBO ref={traceRef} showDebug={true} dowwnsample={128}/>
        <FullscreenPlaneWithFBO fboTexture={fboTexture} traceTexture={traceRef.current?.getFBOTexture()} />
        {/* <FullscreenQuad /> */}
        <ambientLight intensity={0.6} />
        {/* <directionalLight position={[3, 3, 3]} intensity={1} /> */}
        {/* <Lines /> */}
        <RectangleSpawner />

        {/* <CameraControls /> */}
        {/* <Model path={'Astronaut.fbx'} pos={[0, 1.0, 0]} /> */}

        {/* <OrbitControls enableDamping /> */}
        {/* <Effects /> */}
        <EnvironmentSetup />
      </Canvas>
    </div>
  );
}
