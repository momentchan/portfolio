'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import snoise from '@/lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl';
import * as THREE from 'three';

interface DistortedCircleUIProps {
  radius?: number;
  segments?: number;
  color?: string;
  distortionStrength?: number;
  distortionSpeed?: number;
  distortionFrequency?: number;
  lineWidth?: number;
  pixelOffset?: { x: number; y: number } | ((size: { width: number; height: number }) => { x: number; y: number });
}

export default function DistortedCircle({
  radius = 30, // In pixels
  segments = 128,
  color = '#ffffff',
  distortionStrength = 0.2,
  distortionSpeed = 1.0,
  distortionFrequency = 1.0,
  lineWidth = 1,
  pixelOffset = (size) => ({ x: size.width - 50, y: size.height - 50 }),
}: DistortedCircleUIProps) {
  const lineRef = useRef<THREE.Line>(null);
  const { size } = useThree();

  // Create geometry and material
  const lineObject = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const vertexShader = /* glsl */ `
      uniform float uTime;
      uniform float uDistortionStrength;
      uniform float uDistortionFrequency;

      ${snoise}
      
      void main() {
        float dist = length(position.xy);
        float angle = atan(position.y, position.x);
        
        float noiseRadius = 1.3 * uDistortionFrequency;
        float noiseX = cos(angle) * noiseRadius;
        float noiseY = sin(angle) * noiseRadius;
        
        float radialNoise = simplexNoise2d(vec2(noiseX + uTime * 0.5, noiseY));
        float newRadius = dist * (1.0 + radialNoise * 0.5 * uDistortionStrength);
        
        vec3 pos;
        pos.x = cos(angle) * newRadius;
        pos.y = sin(angle) * newRadius;
        pos.z = 0.0;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = /* glsl */ `
      uniform vec3 uColor;
      
      void main() {
        gl_FragColor = vec4(uColor, 0.5);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uDistortionStrength: { value: 0 },
        uDistortionFrequency: { value: 0 },
      },
      transparent: true,
      linewidth: lineWidth,
    });

    const line = new THREE.LineLoop(geo, mat);
    return line;
  }, [radius, segments, color, lineWidth]);

  // Animate and position
  useFrame((state) => {
    if (!lineRef.current) return;

    const material = lineRef.current.material as THREE.ShaderMaterial;
    const { uniforms } = material;

    // Update uniforms
    uniforms.uTime.value = state.clock.elapsedTime * distortionSpeed;
    uniforms.uDistortionStrength.value = distortionStrength;
    uniforms.uDistortionFrequency.value = distortionFrequency;

    // Calculate position based on pixel offset
    const offset = typeof pixelOffset === 'function' 
      ? pixelOffset(size) 
      : pixelOffset;

    // Frustum is in pixel space, so convert pixel position to centered coordinates
    // (0,0) is center, so offset from center
    const x = offset.x - size.width / 2;
    const y = size.height / 2 - offset.y;

    lineRef.current.position.set(x, y, 0);
  });

  return (
    <primitive
      ref={lineRef}
      object={lineObject}
    />
  );
}

