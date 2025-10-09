'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useState, useEffect } from 'react';
import snoise from '@/lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl';
import * as THREE from 'three';
import GlobalState from '@/components/r3f/GlobalStates';

interface DistortedCircleProps {
  radius?: number;
  segments?: number;
  color?: string;
  hoverColor?: string;
  distortionStrength?: number;
  distortionSpeed?: number;
  distortionFrequency?: number;
  lineWidth?: number;
  pixelOffset?: { x: number; y: number } | ((size: { width: number; height: number }) => { x: number; y: number });
  onClick?: () => void;
}
export default function DistortedCircle({
  segments = 128,
  radius = 10,
  color = '#ffffff',
  hoverColor = '#00ffff',
  distortionStrength = 0.3,
  distortionSpeed = 1.0,
  distortionFrequency = 0.5,
  lineWidth = 5,
  onClick,
}: DistortedCircleProps) {

  const lineRef = useRef<THREE.Line>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, gl } = useThree();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    gl.domElement.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered, gl]);

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
        ${snoise}
        
        void main() {
          float dist = length(position.xy);
          float angle = atan(position.y, position.x);
          float noiseRadius = 1.3 * uDistortionFrequency;
          float noiseX = cos(angle) * noiseRadius;
          float noiseY = sin(angle) * noiseRadius;
          float radialNoise = simplexNoise2d(vec2(noiseX + uTime * 0.5, noiseY));
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
      },
      transparent: true,
      linewidth: lineWidth,
    });

    return new THREE.LineLoop(geo, material);
  }, [radius, segments, color, lineWidth]);

  useFrame((state) => {
    if (!lineRef.current || !meshRef.current) return;

    const material = lineRef.current.material as THREE.ShaderMaterial;
    const { uniforms } = material;

    // Update uniforms
    uniforms.uTime.value = state.clock.elapsedTime * distortionSpeed;
    uniforms.uDistortionStrength.value = distortionStrength;
    uniforms.uDistortionFrequency.value = distortionFrequency;
    uniforms.uColor.value.set(hovered ? hoverColor : color);

  });

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      >
        <circleGeometry args={[radius, 32]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <primitive ref={lineRef} object={lineObject} />
    </group>
  );
}

