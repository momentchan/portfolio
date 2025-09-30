import { useEffect, useMemo, useRef } from 'react';
import { useControls } from 'leva';
import { useParticles } from '../../../../lib/trail-gpu';
import { ParticleConfig, ParticleShaderConfig } from '../../../../lib/trail-gpu/types';
import { customVelocityShader, customPositionShader } from '../particles';
import * as THREE from 'three';

export function useParticleSystem(trailsNum: number) {
  // Custom trail particle uniforms (shader parameters)
  const particleUniforms = useControls('Custom Trail Particles', {
    speed: { value: 0.2, min: 0.1, max: 2.0, step: 0.1 },
    noiseScale: { value: 1, min: 0.0, max: 200.0, step: 0.1 },
    timeScale: { value: 0.1, min: 0.1, max: 1.0, step: 0.1 },
    noiseStrength: { value: 2, min: 0., max: 200.0, step: 0.1 },
    attractStrength: { value: 1, min: 0.0, max: 10.0, step: 0.01 },
    damping: { value: 0.98, min: 0.0, max: 1.0, step: 0.01 },
  });

  // Generate initial particle positions
  const initialPositions = useMemo(() => {
    const positions = new Float32Array(trailsNum * 4);
    for (let i = 0; i < trailsNum; i++) {
      positions[i * 4] = (Math.random() - 0.5) * 0.1;
      positions[i * 4 + 1] = (Math.random() - 0.5) * 0.1;
      positions[i * 4 + 2] = (Math.random() - 0.5) * 0.1;
      positions[i * 4 + 3] = 0;
    }
    return positions;
  }, [trailsNum]);

  // Particle system configuration
  const particleConfig: ParticleConfig = useMemo(() => ({
    count: trailsNum,
    initialPositions,
  }), [trailsNum, initialPositions]);

  // Create shader config only once with initial values
  const shaderConfig: ParticleShaderConfig = useMemo(() => ({
    velocityShader: customVelocityShader,
    positionShader: customPositionShader,
    uniforms: {
      uSpeed: 0.2, // Initial value
      uNoiseScale: 2, // Initial value
      uTimeScale: 0.1, // Initial value
      uNoiseStrength: 2, // Initial value
      uAttractPos: new THREE.Vector3(0, 0, 0),
      uAttractStrength: 0.1,
      uDamping: 0.98, // Initial value
    }
  }), []); // Empty dependency array - only create once

  // Create custom trail particle system
  const particles = useParticles({
    count: trailsNum,
    shaderConfig,
    config: particleConfig,
  });

  // Update uniforms when controls change without recreating shader config
  useEffect(() => {
    if (particles.setUniform) {
      particles.setUniform('uSpeed', particleUniforms.speed);
      particles.setUniform('uNoiseScale', particleUniforms.noiseScale);
      particles.setUniform('uTimeScale', particleUniforms.timeScale);
      particles.setUniform('uNoiseStrength', particleUniforms.noiseStrength);
      particles.setUniform('uAttractStrength', particleUniforms.attractStrength);
      particles.setUniform('uDamping', particleUniforms.damping);
    }
  }, [particles, particleUniforms]);
  

  return {
    particleUniforms,
    particleConfig,
    shaderConfig,
    particles,
  };
}
