'use client';

import { useTexture } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useControls } from 'leva';
import simplexNoise from '@/lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl';
import gradientNoise from '@/lib/r3f-gist/shader/cginc/noise/gradientNoise.glsl';
import fragment from '@/app/(site)/shaders/fragment.glsl';
import utility from '@/lib/r3f-gist/shader/cginc/utility.glsl';

// Constants
const TEXTURE_PATHS = [
  '/textures/a3182e538f3204413fab4009b52075f6.jpg',
  '/textures/Anne-Hathaway.jpg',
  '/textures/ea05b622336a50e113eb57ed7603fa41.jpg',
  '/textures/198083adc5709adb2d785d4d58a87440.jpg',
  '/textures/ce922f44c888a74136efe62d422e23ae.jpg',
  '/textures/27032d87ca65e74ac0a6bc8b0389c36f.jpg',
  '/textures/4fefb9d6a9150d9269e39e6f396990cb.jpg',
  '/textures/74822907eb66e5ee986e6a247af6b664.jpg',
];

// Types
interface ShaderControls {
  distortionStrength: number;
  tiling: number;
  radius: number;
  stripeStrength: { x: number; y: number };
  stripeFreqH: { x: number; y: number };
  stripeFreqV: { x: number; y: number };
  stripeSpeed: { x: number; y: number };
  pointerLerpSpeed: number;
  pointerSpeedMultiplier: number;
  pointerSpeedDecay: number;
}

// Custom hooks
const useTextureManager = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const textures = useTexture(TEXTURE_PATHS) as THREE.Texture[];

  // Configure texture color space
  useEffect(() => {
    textures.forEach((texture: THREE.Texture) => {
      if (texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
      }
    });
  }, [textures]);

  const nextTexture = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % TEXTURE_PATHS.length);
  }, []);

  const prevTexture = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + TEXTURE_PATHS.length) % TEXTURE_PATHS.length);
  }, []);

  return {
    textures,
    currentTexture: textures[currentIndex],
    currentIndex,
    nextTexture,
    prevTexture,
  };
};

const useKeyboardControls = (onPrev: () => void, onNext: () => void, onDebug: () => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          onPrev();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case 'd':
          onDebug();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, onDebug]);
};

const usePlaneDimensions = (camera: THREE.Camera) => {
  const { size } = useThree();
  
  return useMemo(() => {
    const orthoCamera = camera as THREE.OrthographicCamera;
    const zoomFactor = orthoCamera.zoom;
    
    // Calculate the actual camera bounds (which are now dynamic)
    const aspect = size.width / size.height;
    const frustumSize = 20; // Same as in DynamicCamera
    const actualLeft = -frustumSize * aspect / 2;
    const actualRight = frustumSize * aspect / 2;
    const actualTop = frustumSize / 2;
    const actualBottom = -frustumSize / 2;
    
    const width = ((actualRight - actualLeft) / zoomFactor) * 1;
    const height = ((actualTop - actualBottom) / zoomFactor) * 1;
    return { width, height };
  }, [camera, size.width, size.height]);
};

export default function FullscreenPlane() {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const [debug, setDebug] = useState(0);
  
  // Interpolated pointer values
  const [interpolatedPointer, setInterpolatedPointer] = useState(new THREE.Vector2(0.5, 0.5));
  const [pointerSpeed, setPointerSpeed] = useState(0.0);
  const previousPointerRef = useRef(new THREE.Vector2(0.5, 0.5));

  const controls = useControls({
    distortionStrength: { value: 0, min: 0, max: 1, step: 0.01 },
    tiling: { value: 15.0, min: 0, max: 100, step: 0.1 },
    radius: { value: 0.5, min: 0, max: 1, step: 0.01 },
    stripeStrength: { value: { x: 2, y: 0.8 }, step: 0.01 },
    stripeFreqH: { value: { x: 10, y: 500 }, step: 1 },
    stripeFreqV: { value: { x: 4, y: 500 }, step: 1 },
    stripeSpeed: { value: { x: 0.1, y: 0.2 }, step: 0.01 },
    pointerLerpSpeed: { value: 8.0, min: 0.1, max: 20.0, step: 0.1 },
    pointerSpeedMultiplier: { value: 1.0, min: 0.0, max: 5.0, step: 0.1 },
    pointerSpeedDecay: { value: 0.95, min: 0.8, max: 0.99, step: 0.01 },
  }) as ShaderControls;

  const { currentTexture, nextTexture, prevTexture } = useTextureManager();
  const { width: planeWidth, height: planeHeight } = usePlaneDimensions(camera);

  const toggleDebug = useCallback(() => {
    setDebug(prev => prev === 0 ? 1 : 0);
  }, []);

  useKeyboardControls(prevTexture, nextTexture, toggleDebug);

  // Update texture when it changes
  useEffect(() => {
    if (meshRef.current && currentTexture) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTexture.value = currentTexture;
      material.needsUpdate = true;
    }
  }, [currentTexture]);

  // Update uniforms in animation frame
  useFrame((state, delta) => {
    if (!meshRef.current || !currentTexture) return;

    const material = meshRef.current.material as THREE.ShaderMaterial;
    const uniforms = material.uniforms;

    // Calculate pointer movement speed
    const currentPointer = new THREE.Vector2(
      state.pointer.x * 0.5 + 0.5,
      state.pointer.y * 0.5 + 0.5
    );
    
    // Calculate distance moved since last frame
    const movementDistance = currentPointer.distanceTo(previousPointerRef.current);
    const currentSpeed = movementDistance / delta; // Speed in units per second
    
    // Apply speed multiplier and decay
    const newSpeed = Math.max(
      currentSpeed * controls.pointerSpeedMultiplier,
      pointerSpeed * controls.pointerSpeedDecay
    );
    setPointerSpeed(newSpeed);
    
    // Update previous pointer position
    previousPointerRef.current.copy(currentPointer);
    
    // Interpolate pointer position for smooth movement
    const lerpFactor = Math.min(delta * controls.pointerLerpSpeed, 1.0);
    interpolatedPointer.lerp(currentPointer, lerpFactor);
    
    // Time-based uniforms
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uPointer.value = interpolatedPointer.clone();
    uniforms.uPointerSpeed.value = newSpeed;

    // Control-based uniforms
    uniforms.uDistortionStrength.value = controls.distortionStrength;
    uniforms.uTiling.value = controls.tiling;
    uniforms.uRadius.value = controls.radius;
    uniforms.debug.value = debug;

    // Vector2 uniforms
    uniforms.uStripeFreqH.value = new THREE.Vector2(controls.stripeFreqH.x, controls.stripeFreqH.y);
    uniforms.uStripeFreqV.value = new THREE.Vector2(controls.stripeFreqV.x, controls.stripeFreqV.y);
    uniforms.uStripeSpeed.value = new THREE.Vector2(controls.stripeSpeed.x, controls.stripeSpeed.y);
    uniforms.uStripeStrength.value = new THREE.Vector2(controls.stripeStrength.x, controls.stripeStrength.y);
    uniforms.uAspect.value = state.viewport.aspect;

    material.needsUpdate = true;
  });

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        ${simplexNoise}
        ${gradientNoise}
        ${utility}
        ${fragment}
      `,
      uniforms: {
        uTexture: { value: currentTexture },
        uOpacity: { value: 1.0 },
        uDistortionStrength: { value: controls.distortionStrength },
        uTiling: { value: controls.tiling },
        uTime: { value: 0.0 },
        uRadius: { value: controls.radius },
        uStripeFreqH: { value: new THREE.Vector2(controls.stripeFreqH.x, controls.stripeFreqH.y) },
        uStripeFreqV: { value: new THREE.Vector2(controls.stripeFreqV.x, controls.stripeFreqV.y) },
        uStripeSpeed: { value: new THREE.Vector2(controls.stripeSpeed.x, controls.stripeSpeed.y) },
        uStripeStrength: { value: new THREE.Vector2(controls.stripeStrength.x, controls.stripeStrength.y) },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uPointerSpeed: { value: 0.0 },
        debug: { value: debug },
        uAspect: { value: 1.0 },
      },
      toneMapped: false,
    });
  }, [currentTexture, controls, debug]);

  return (
    <mesh ref={meshRef} position={[0, 0, -1]} material={shaderMaterial}>
      <planeGeometry args={[planeWidth, planeHeight]} />
    </mesh>
  );
}