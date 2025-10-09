'use client';

import { Canvas, useThree } from '@react-three/fiber';
import AudioUI from './audio/AudioUI';
import { OrthographicCamera, Preload } from '@react-three/drei';
import { useEffect } from 'react';
import * as THREE from 'three';

function CameraSetup() {
  const { camera, size } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      camera.left = -size.width / 2;
      camera.right = size.width / 2;
      camera.top = size.height / 2;
      camera.bottom = -size.height / 2;
      camera.updateProjectionMatrix();
    }
  }, [camera, size]);

  return null;
}

export default function UICanvas() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <Canvas
        style={{ pointerEvents: 'none' }}
        gl={{
          alpha: true,
          antialias: true,
        }}
      >
        <OrthographicCamera
          makeDefault
          position={[0, 0, 1]}
          zoom={1}
          near={0.1}
          far={100}
        />
        <CameraSetup />
        <Preload all />
        <AudioUI />
      </Canvas>
    </div>
  );
}

