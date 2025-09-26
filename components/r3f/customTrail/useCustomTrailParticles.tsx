import { useMemo, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CustomTrailParticles } from './CustomTrailParticles';
import { ParticleConfig, ParticleShaderParams } from '../../../lib/trail-gpu/types';
import { useControls } from 'leva';
import * as THREE from 'three';

export interface UseCustomTrailParticlesOptions {
  count: number;
  particleConfig?: Partial<ParticleConfig>;
  uniforms?: Partial<ParticleShaderParams>;
}

export interface UseCustomTrailParticlesReturn {
  particles: CustomTrailParticles;
  AttractorDebug: React.ComponentType;
}

export function useCustomTrailParticles({
  count,
  particleConfig = {},
  uniforms = {},
}: UseCustomTrailParticlesOptions): UseCustomTrailParticlesReturn {
  const { gl } = useThree();
  const attractorPosRef = useRef(new THREE.Vector3(0, 0, 0));

  const initialPositions = useMemo(() => {
    const positions = new Float32Array(count *4);
    for (let i = 0; i < count; i++) {
      positions[i * 4] = (Math.random() - 0.5) * 0.1;
      positions[i * 4 + 1] = (Math.random() - 0.5) * 0.1;
      positions[i * 4 + 2] = (Math.random() - 0.5) * 0.1;
      positions[i * 4 + 3] = 0;
    }
    return positions;

  }, [count]);
  
  // Create custom trail particle system (only when count changes)
  const particles = useMemo(() => {
    console.log(uniforms);
    const system = new CustomTrailParticles(
      count,
      particleConfig, // Pass config for system setup
      initialPositions,
      uniforms, // Pass uniforms for shader parameters
    );
    system.attachRenderer(gl);
    return system;
  }, [gl, count, initialPositions, particleConfig]);

  // Update uniforms when they change (without recreating the system)
  useEffect(() => {
    particles.updateUniforms(uniforms);
  }, [particles, uniforms]);

  useFrame((state, delta) => {
    const r = 0.1
    const speed = 0.5;
    const pos = new THREE.Vector3(r * Math.cos(state.clock.elapsedTime * speed), r * Math.sin(state.clock.elapsedTime * speed), 0);
    
    // Update attractor position for both shader and debug sphere
    attractorPosRef.current.copy(pos);
    particles.setUniform('uAttractPos', pos);
  });

  // Debug sphere component that follows the attractor position
  const AttractorDebug = useMemo(() => {
    return () => {
      const meshRef = useRef<THREE.Mesh>(null);
      
      useFrame(() => {
        if (meshRef.current) {
          meshRef.current.position.copy(attractorPosRef.current);
        }
      });

      return (
        <mesh ref={meshRef}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial 
            color="#ff0000" 
            wireframe={true}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      );
    };
  }, []);

  return {
    particles,
    AttractorDebug,
  };
}
