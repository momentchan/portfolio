'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useControls } from 'leva';
import simplexNoise from '@/packages/r3f-gist/shaders/cginc/noise/simplexNoise.glsl';
import gradientNoise from '@/packages/r3f-gist/shaders/cginc/noise/gradientNoise.glsl';
import fragment from './fragment.glsl';
import utility from '@/packages/r3f-gist/shaders/cginc/math/utility.glsl';

interface StripeEffectProps {
  traceTexture?: THREE.Texture | null;
}

export default function StripeEffect({ traceTexture }: StripeEffectProps) {
  const { camera, size } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  // State for animation
  const [offset, setOffset] = useState(0.0);
  const [interpolatedPointer, setInterpolatedPointer] = useState(new THREE.Vector2(0.5, 0.5));
  const [pointerSpeed, setPointerSpeed] = useState(0.0);
  const previousPointerRef = useRef(new THREE.Vector2(0.5, 0.5));

  const controls = useControls('Stripe Effect', {
    // Distortion controls
    traceDistortion: { value: 1, min: 0, max: 1, step: 0.01 },
    distortionStrength: { value: 0, min: 0, max: 10, step: 0.01 },
    distortionNoise: { value: 1, min: 0, max: 1, step: 0.01 },
    offsetSpeed: { value: 0.04, min: 0, max: 0.1, step: 0.01 },
    radius: { value: 0.5, min: 0, max: 1, step: 0.01 },
    tiling: { value: 1.0, min: 0, max: 100, step: 0.1 },

    // Stripe controls
    stripeStrength: { value: { x: 2, y: 0.8 }, step: 0.01 },
    stripeFreqH: { value: { x: 10, y: 500 }, step: 1 },
    stripeFreqV: { value: { x: 4, y: 500 }, step: 1 },
    stripeSpeed: { value: { x: 0.1, y: 0.2 }, step: 0.01 },

    // Pointer controls
    pointerLerpSpeed: { value: 8.0, min: 0.1, max: 20.0, step: 0.1 },
    pointerSpeedMultiplier: { value: 1.0, min: 0.0, max: 5.0, step: 0.1 },
    pointerSpeedDecay: { value: 0.95, min: 0.8, max: 0.99, step: 0.01 },
  });

  // Calculate plane dimensions (same as FullscreenPlane)
  const planeDimensions = useMemo(() => {
    const orthoCamera = camera as THREE.OrthographicCamera;
    const zoomFactor = orthoCamera.zoom;

    const aspect = size.width / size.height;
    const frustumSize = 20;
    const actualLeft = -frustumSize * aspect / 2;
    const actualRight = frustumSize * aspect / 2;
    const actualTop = frustumSize / 2;
    const actualBottom = -frustumSize / 2;

    const width = ((actualRight - actualLeft) / zoomFactor) * 1;
    const height = ((actualTop - actualBottom) / zoomFactor) * 1;
    return { width, height };
  }, [camera, size.width, size.height]);

  // Stripe Effect shader material using FBO texture or external texture
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
        uTraceTexture: { value: traceTexture },
        uOpacity: { value: 1.0 },
        uTraceDistortion: { value: controls.traceDistortion },
        uDistortionStrength: { value: controls.distortionStrength },
        uTiling: { value: controls.tiling },
        uDistortionNoise: { value: controls.distortionNoise },
        uTime: { value: 0.0 },
        uRadius: { value: controls.radius },
        uStripeFreqH: { value: new THREE.Vector2(controls.stripeFreqH.x, controls.stripeFreqH.y) },
        uStripeFreqV: { value: new THREE.Vector2(controls.stripeFreqV.x, controls.stripeFreqV.y) },
        uStripeSpeed: { value: new THREE.Vector2(controls.stripeSpeed.x, controls.stripeSpeed.y) },
        uStripeStrength: { value: new THREE.Vector2(controls.stripeStrength.x, controls.stripeStrength.y) },
        uPointer: { value: new THREE.Vector2(0.5, 0.5) },
        uPointerSpeed: { value: 0.0 },
        uAspect: { value: 1.0 },
        uOffset: { value: 0.0 },
        uMouseOn: { value: size.width <= 1024 ? 0.0 : 1.0 },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
      },
      toneMapped: false,
    });
  }, [controls, traceTexture]);

  // Update texture when FBO texture changes
  useEffect(() => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTraceTexture.value = traceTexture;
      shaderMaterial.needsUpdate = true;
    }
  }, [shaderMaterial, traceTexture, size.width, size.height]);

  // Update uniforms in animation frame
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const material = meshRef.current.material as THREE.ShaderMaterial;
    const uniforms = material.uniforms;

    // Calculate pointer movement speed
    const currentPointer = new THREE.Vector2(
      state.pointer.x * 0.5 + 0.5,
      state.pointer.y * 0.5 + 0.5
    );

    const movementDistance = currentPointer.distanceTo(previousPointerRef.current);
    const currentSpeed = movementDistance / delta;

    const newSpeed = Math.max(
      currentSpeed * controls.pointerSpeedMultiplier,
      pointerSpeed * controls.pointerSpeedDecay
    );
    setPointerSpeed(newSpeed);

    previousPointerRef.current.copy(currentPointer);

    const lerpFactor = Math.min(delta * controls.pointerLerpSpeed, 1.0);
    interpolatedPointer.lerp(currentPointer, lerpFactor);

    // Time-based uniforms
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uPointer.value = interpolatedPointer.clone();
    uniforms.uPointerSpeed.value = newSpeed;

    // Control-based uniforms
    uniforms.uTraceDistortion.value = controls.traceDistortion;
    uniforms.uDistortionStrength.value = controls.distortionStrength;
    uniforms.uTiling.value = controls.tiling;
    uniforms.uRadius.value = controls.radius;

    // Vector2 uniforms
    uniforms.uStripeFreqH.value = new THREE.Vector2(controls.stripeFreqH.x, controls.stripeFreqH.y);
    uniforms.uStripeFreqV.value = new THREE.Vector2(controls.stripeFreqV.x, controls.stripeFreqV.y);
    uniforms.uStripeSpeed.value = new THREE.Vector2(controls.stripeSpeed.x, controls.stripeSpeed.y);
    uniforms.uStripeStrength.value = new THREE.Vector2(controls.stripeStrength.x, controls.stripeStrength.y);
    uniforms.uAspect.value = state.viewport.aspect;
    uniforms.uResolution.value = new THREE.Vector2(size.width, size.height);
    setOffset(prev => prev + delta * controls.offsetSpeed);
    uniforms.uOffset.value = offset;
    uniforms.uMouseOn.value = size.width <= 1024 ? 0.0 : 1.0;
    material.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -1]} material={shaderMaterial}>
      <planeGeometry args={[planeDimensions.width, planeDimensions.height]} />
    </mesh>
  );
}
