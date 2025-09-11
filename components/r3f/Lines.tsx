'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useControls } from 'leva';
import { Line } from '@react-three/drei';

export default function Lines() {
  const linesRef = useRef<THREE.Group>(null);
  
  // Controls for the lines
  const config = useControls('Lines', {
    lineCount: { value: 50, min: 10, max: 200, step: 1 },
    lineWidth: { value: 1.0, min: 0.1, max: 5.0, step: 0.1 },
    lineColor: '#ffffff',
    lineOpacity: { value: 0.8, min: 0.1, max: 1.0, step: 0.01 },
    maxLength: { value: 4.0, min: 0.5, max: 10.0, step: 0.1 },
    minLength: { value: 0.5, min: 0.1, max: 5.0, step: 0.01 },
    spaceSizeX: { value: 20, min: 0, max: 100, step: 1 },
    spaceSizeY: { value: 20, min: 0, max: 100, step: 1 },
    spaceSizeZ: { value: 0, min: 0, max: 100, step: 1 }
  }, { collapsed: true });

  // Seeded random number generator
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate lines with seeded random positions and lengths
  const lines = useMemo(() => {
    const lineData: Array<{
      x: number;
      y: number;
      z: number;
      length: number;
      rotationX: number;
      rotationY: number;
      rotationZ: number;
    }> = [];

    // Generate stable seeds for each line based on line count
    const stableSeeds = [];
    for (let i = 0; i < config.lineCount; i++) {
      stableSeeds.push(Math.floor(Math.sin(i * 123.456) * 1000000));
    }

    for (let i = 0; i < config.lineCount; i++) {
      const lineSeed = stableSeeds[i];
      
      lineData.push({
        x: (seededRandom(lineSeed) - 0.5) * config.spaceSizeX, // Random X position across screen
        y: (seededRandom(lineSeed + 1) - 0.5) * config.spaceSizeY, // Random Y position in 3D space
        z: (seededRandom(lineSeed + 2) - 0.5) * config.spaceSizeZ, // Random Z position for depth
        length: seededRandom(lineSeed + 3) * (config.maxLength - config.minLength) + config.minLength,
        rotationX: seededRandom(lineSeed + 4) * Math.PI * 2, // Random rotation around X axis
        rotationY: seededRandom(lineSeed + 5) * Math.PI * 2, // Random rotation around Y axis
        rotationZ: seededRandom(lineSeed + 6) * Math.PI * 2  // Random rotation around Z axis
      });
    }

    return lineData;
  }, [config.lineCount, config.maxLength, config.minLength, config.spaceSizeX, config.spaceSizeY, config.spaceSizeZ]); // Only regenerate when these change

  // No animation needed - lines stay in place
  // useFrame removed since we don't want movement

  return (
    <group ref={linesRef}>
      {lines.map((lineData, index) => {
        // Create line points from center outward
        const points: [number, number, number][] = [
          [0, -lineData.length / 2, 0],  // Start point
          [0, lineData.length / 2, 0]    // End point
        ];
        
        return (
          <Line
            key={index}
            points={points}
            position={[lineData.x, lineData.y, lineData.z]}
            // rotation={[lineData.rotationX, lineData.rotationY, lineData.rotationZ]}
            color={config.lineColor}
            lineWidth={config.lineWidth}
            transparent
            opacity={config.lineOpacity}
          />
        );
      })}
    </group>
  );
}
