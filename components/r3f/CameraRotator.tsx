'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { gsap } from 'gsap';
import GlobalState from './GlobalStates';

export default function CameraRotator() {
  const { camera } = useThree();
  const { started, paused } = GlobalState();

  const timeRef = useRef(0);

  const controls = useControls('Camera Rotator', {
    radius: { value: 1, min: 0, max: 2, step: 1 },
    speed: { value: 0.2, min: -5, max: 5, step: 0.1 },
    height: { value: 0, min: -2, max: 2, step: 0.01 },
    enabled: true
  });

  const rotateLerpRef = useRef({ value: 0 });

  useEffect(() => {
    if (!started) return;

    const tl = gsap.timeline();
    tl.to(rotateLerpRef.current, {
      value: 1,
      duration: 5,
    });
  }, [started]);

  useFrame((state, delta) => {
    if (!controls.enabled) return;

    const speed = controls.speed * rotateLerpRef.current.value;
    timeRef.current += (started && !paused) ? delta * speed : 0;

    const x = controls.radius * Math.cos(timeRef.current);
    const y = controls.radius * Math.sin(timeRef.current * 0.5) + controls.height;
    const z = controls.radius * Math.sin(timeRef.current);

    // Update camera position
    camera.position.set(x, y, z);
    
    // Make camera look at origin
    camera.lookAt(0, 0, 0);
  });

  return null;
}
