'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';

export default function CameraRotator() {
  const { camera } = useThree();
  const timeRef = useRef(0);

  const controls = useControls('Camera Rotator', {
    radius: { value: 1, min: 1, max: 100, step: 1 },
    speed: { value: -0.1, min: -5, max: 5, step: 0.1 },
    height: { value: 0, min: -10, max: 10, step: 0.1 },
    enabled: true
  });

  useFrame((state, delta) => {
    if (!controls.enabled) return;

    // Update time based on speed and delta time (Unity-style)
    timeRef.current += delta * controls.speed;
    
    // Calculate camera position using Unity CameraMotion pattern
    const x = controls.radius * Math.cos(timeRef.current);
    const y = controls.radius * Math.sin(timeRef.current * 0.5) + controls.height;
    const z = controls.radius * Math.sin(timeRef.current);

    // Update camera position
    camera.position.set(x, y, z);
    
    // Make camera look at origin
    camera.lookAt(0, controls.height, 0);
  });

  return null;
}
