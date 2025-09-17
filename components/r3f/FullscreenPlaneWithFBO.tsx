'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useControls } from 'leva';
import { useTexture } from '@react-three/drei';
import simplexNoise from '@/lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl';
import gradientNoise from '@/lib/r3f-gist/shader/cginc/noise/gradientNoise.glsl';
import fragment from '@/app/(site)/shaders/fragment.glsl';
import utility from '@/lib/r3f-gist/shader/cginc/utility.glsl';
import raymarching from '@/lib/r3f-gist/shader/cginc/raymarching.glsl';

interface FullscreenPlaneWithFBOProps {
  fboTexture?: THREE.Texture | null;
  traceTexture?: THREE.Texture | null;
}

export default function FullscreenPlaneWithFBO({ fboTexture, traceTexture }: FullscreenPlaneWithFBOProps) {
  const { camera, size } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  // State for animation
  const [offset, setOffset] = useState(0.0);
  const [interpolatedPointer, setInterpolatedPointer] = useState(new THREE.Vector2(0.5, 0.5));
  const [pointerSpeed, setPointerSpeed] = useState(0.0);
  const previousPointerRef = useRef(new THREE.Vector2(0.5, 0.5));

  // Load textures from public/textures
  const textures = useTexture({
    texture1: '/textures/198083adc5709adb2d785d4d58a87440.jpg',
    texture2: '/textures/27032d87ca65e74ac0a6bc8b0389c36f.jpg',
    texture3: '/textures/4fefb9d6a9150d9269e39e6f396990cb.jpg',
    texture4: '/textures/74822907eb66e5ee986e6a247af6b664.jpg',
    texture5: '/textures/a3182e538f3204413fab4009b52075f6.jpg',
    texture6: '/textures/ce922f44c888a74136efe62d422e23ae.jpg',
    texture7: '/textures/ea05b622336a50e113eb57ed7603fa41.jpg',
  });

  const controls = useControls('FullscreenPlane with FBO', {
    // Texture selection
    selectedTexture: { 
      value: 'texture1', 
      options: {
        'Texture 1': 'texture1',
        'Texture 2': 'texture2', 
        'Texture 3': 'texture3',
        'Texture 4': 'texture4',
        'Texture 5': 'texture5',
        'Texture 6': 'texture6',
        'Texture 7': 'texture7'
      }
    },
    textureMix: { value: 0, min: 0, max: 1, step: 0.01 },
    
    // Distortion controls
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

  // Get the selected external texture
  const selectedExternalTexture = useMemo(() => {
    return textures[controls.selectedTexture as keyof typeof textures];
  }, [textures, controls.selectedTexture]);

  // FullscreenPlane shader material using FBO texture or external texture
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
       ${raymarching}
        ${simplexNoise}
        ${gradientNoise}
        ${utility}
        ${fragment}
      `,
      uniforms: {
        uTexture: { value: fboTexture },
        uExternalTexture: { value: selectedExternalTexture },
        uTraceTexture: { value: traceTexture },
        uTextureMix: { value: controls.textureMix },
        uOpacity: { value: 1.0 },
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
        debug: { value: 0 },
        uAspect: { value: 1.0 },
        uOffset: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
      },
      toneMapped: false,
    });
  }, [fboTexture, selectedExternalTexture, controls, traceTexture]);

  // Update texture when FBO texture changes
  useEffect(() => {
    if (shaderMaterial && fboTexture) {
      shaderMaterial.uniforms.uTexture.value = fboTexture;
      shaderMaterial.uniforms.uTraceTexture.value = traceTexture;
      shaderMaterial.needsUpdate = true;
    }
  }, [shaderMaterial, fboTexture, traceTexture, size.width, size.height]);

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

    // Texture uniforms
    uniforms.uTextureMix.value = controls.textureMix;
    
    // Control-based uniforms
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

    material.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -1]} material={shaderMaterial}>
      <planeGeometry args={[planeDimensions.width, planeDimensions.height]} />
    </mesh>
  );
}
