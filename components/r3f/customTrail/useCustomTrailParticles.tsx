import { useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { CustomTrailParticles } from './CustomTrailParticles';
import { ParticleConfig } from '../../../lib/trail-gpu/types';

export interface UseCustomTrailParticlesOptions {
  count: number;
  particleConfig?: Partial<ParticleConfig>;
  initialPositions?: Float32Array;
}

export interface UseCustomTrailParticlesReturn {
  particles: CustomTrailParticles;
  updateParticles: (timeSec: number, deltaTime: number) => void;
  setCustomTrailParams: (speed: number, noiseScale: number, timeScale: number) => void;
  dispose: () => void;
}

export function useCustomTrailParticles({
  count,
  particleConfig = {},
  initialPositions,
}: UseCustomTrailParticlesOptions): UseCustomTrailParticlesReturn {
  const { gl } = useThree();
  
  // Create custom trail particle system
  const particles = useMemo(() => {
    const system = new CustomTrailParticles(
      count,
      particleConfig,
      initialPositions
    );
    system.attachRenderer(gl);
    return system;
  }, [gl, count, particleConfig, initialPositions]);

  // Update function
  const updateParticles = useCallback((timeSec: number, deltaTime: number) => {
    particles.stepUpdate(timeSec, deltaTime);
  }, [particles]);

  // Set custom trail parameters
  const setCustomTrailParams = useCallback((speed: number, noiseScale: number, timeScale: number) => {
    particles.setCustomTrailParams(speed, noiseScale, timeScale);
  }, [particles]);

  // Dispose function
  const dispose = useCallback(() => {
    particles.dispose();
  }, [particles]);

  return {
    particles,
    updateParticles,
    setCustomTrailParams,
    dispose,
  };
}
