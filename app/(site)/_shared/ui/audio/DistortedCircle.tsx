'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import snoise from '@/lib/r3f-gist/shaders/cginc/noise/simplexNoise.glsl';
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

  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const lineObject = useMemo(() => {
    // Create a tube geometry for thick lines
    const curve = new THREE.EllipseCurve(
      0, 0,            // center x, y
      radius, radius,  // xRadius, yRadius
      0, 2 * Math.PI,  // startAngle, endAngle
      false,           // clockwise
      0                // rotation
    );

    const points = curve.getPoints(segments);
    const path = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p.x, p.y, 0))
    );
    path.closed = true;

    // Use TubeGeometry for actual thickness
    const geometry = new THREE.TubeGeometry(
      path,
      segments,
      lineWidth * 0.1, // tube radius (adjust multiplier as needed)
      8,                // radial segments
      true              // closed
    );

    const material = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uDistortionStrength;
        uniform float uDistortionFrequency;
        uniform float uSeed;
        ${snoise}
        
        void main() {
          // Get the center of the tube (original circle position)
          vec3 center = normalize(position) * ${radius.toFixed(2)};
          float dist = length(center.xy);
          float angle = atan(center.y, center.x);
          
          float noiseRadius = 1.3 * uDistortionFrequency;
          float noiseX = cos(angle) * noiseRadius;
          float noiseY = sin(angle) * noiseRadius;
          
          // Use seed to offset noise sampling for different patterns
          float radialNoise = simplexNoise2d(vec2(noiseX + uTime * 0.5 + uSeed * 100.0, noiseY + uSeed * 50.0));
          float newRadius = dist * (1.0 + radialNoise * 0.5 * uDistortionStrength * 0.6);
          newRadius *= mix(0.7, 1.0, smoothstep(0.0, 1.0, uDistortionStrength));
          
          // Calculate offset from center to current position
          vec3 offset = position - center;
          
          // Apply distortion to center, then add back the offset
          vec3 newCenter = vec3(
            cos(angle) * newRadius,
            sin(angle) * newRadius,
            0.0
          );
          
          vec3 finalPosition = newCenter + offset;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
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
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Mesh(geometry, material);
  }, [radius, segments, color, lineWidth]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const material = meshRef.current.material as THREE.ShaderMaterial;
    const { uniforms } = material;

    // Update uniforms
    uniforms.uTime.value = state.clock.elapsedTime * distortionSpeed;
    uniforms.uDistortionStrength.value = distortionStrength;
    uniforms.uDistortionFrequency.value = distortionFrequency;
    uniforms.uSeed.value = seed;
    uniforms.uColor.value.set(isHovered ? hoverColor : color);
  });

  return <primitive ref={meshRef} object={lineObject} position={[0, 0, seed % 1.0]} />;
}

