'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import snoise from '@/lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl';
import * as THREE from 'three';

interface DistortedCircleProps {
  radius?: number;
  segments?: number;
  color?: string;
  hoverColor?: string;
  distortionStrength?: number;
  distortionSpeed?: number;
  distortionFrequency?: number;
  seed?: number;
  lineWidth?: number;
  isHovered?: boolean;
}
export default function DistortedCircle({
  segments = 128,
  radius = 10,
  color = '#ffffff',
  hoverColor = '#ffffff',
  distortionStrength = 0.3,
  distortionSpeed = 1.0,
  distortionFrequency = 0.5,
  seed = 0,
  lineWidth = 5,
  isHovered = false,
}: DistortedCircleProps) {

  const lineRef = useRef<THREE.Line>(null);
  const { size } = useThree();

  const lineObject = useMemo(() => {
    const vertices: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uDistortionStrength;
        uniform float uDistortionFrequency;
        uniform float uSeed;
        ${snoise}
        
        void main() {
          float dist = length(position.xy);
          float angle = atan(position.y, position.x);
          
          float noiseRadius = 1.3 * uDistortionFrequency;
          float noiseX = cos(angle) * noiseRadius;
          float noiseY = sin(angle) * noiseRadius;
          
          // Use seed to offset noise sampling for different patterns
          float radialNoise = simplexNoise2d(vec2(noiseX + uTime * 0.5 + uSeed * 100.0, noiseY + uSeed * 50.0));
          float newRadius = dist * (1.0 + radialNoise * 0.5 * uDistortionStrength);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(
            cos(angle) * newRadius,
            sin(angle) * newRadius,
            0.0,
            1.0
          );
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        void main() {
          gl_FragColor = vec4(uColor, 1.0);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uDistortionStrength: { value: 0 },
        uDistortionFrequency: { value: 0 },
        uSeed: { value: 0 },
      },
      transparent: true,
      linewidth: lineWidth,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.LineLoop(geo, material);
  }, [radius, segments, color, lineWidth]);

  useFrame((state) => {
    if (!lineRef.current) return;

    const material = lineRef.current.material as THREE.ShaderMaterial;
    const { uniforms } = material;

    // Update uniforms
    uniforms.uTime.value = state.clock.elapsedTime * distortionSpeed;
    uniforms.uDistortionStrength.value = distortionStrength;
    uniforms.uDistortionFrequency.value = distortionFrequency;
    uniforms.uSeed.value = seed;
    uniforms.uColor.value.set(isHovered ? hoverColor : color);
  });

  return <primitive ref={lineRef} object={lineObject} />;
}

