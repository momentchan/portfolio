import { useEffect, useMemo, useRef, useState } from 'react';
import { useControls } from 'leva';
import { useParticles } from '../../../../lib/trail-gpu';
import { ParticleConfig, ParticleShaderConfig } from '../../../../lib/trail-gpu/types';
import { customVelocityShader, customPositionShader } from '../particles';
import * as THREE from 'three';
import { gsap } from 'gsap';

export function useParticleSystem(trailsNum: number, rate: number) {
  // GSAP animated parameters - using state to trigger re-renders
  const [animatedParams, setAnimatedParams] = useState({
    speed: 0.6,
    noiseScale: 30,
    timeScale: 0.1,
    noiseStrength: 10,
    attractStrength: -2,
    damping: 0.98
  });

  // Keep Leva controls for quick testing (optional override)
  const particleUniforms = useControls('Trails.Particles', {
    speed: { value: 0.2, min: 0.1, max: 2.0, step: 0.1 },
    noiseScale: { value: 1, min: 0.0, max: 200.0, step: 0.1 },
    timeScale: { value: 0.1, min: 0.1, max: 1.0, step: 0.1 },
    noiseStrength: { value: 2, min: 0., max: 200.0, step: 0.1 },
    attractStrength: { value: 1, min: 0.0, max: 10.0, step: 0.01 },
    damping: { value: 0.98, min: 0.0, max: 1.0, step: 0.01 },
    useGSAP: true // Toggle to use GSAP vs Leva controls
  });

  // Generate initial particle positions
  const radius = 0.02;
  const initialPositions = useMemo(() => {
    const positions = new Float32Array(trailsNum * 4);
    for (let i = 0; i < trailsNum; i++) {
      // Generate random point on unit sphere, then scale by random radius
      const theta = Math.random() * Math.PI * 2; // 0 to 2π
      const phi = Math.acos(2 * Math.random() - 1); // 0 to π
      const r = Math.cbrt(Math.random()) * radius; // Cube root for uniform distribution

      positions[i * 4] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 4 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 4 + 2] = r * Math.cos(phi);
      positions[i * 4 + 3] = 0;
    }
    return positions;
  }, [trailsNum, radius]);

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

  // GSAP animation setup for all parameters
  useEffect(() => {
    if (!particles.setUniform) return;

    const tl = gsap.timeline();

    // Animate multiple parameters in the same timeline step
    tl
    // .to(animatedParams, {
    //   damping: 0.98,
    //   speed: 0.2,
    //   noiseScale: 10,
    //   duration: 3,
    //   ease: "power2.in",
    //   delay: 1,
    //   onUpdate: () => setAnimatedParams({ ...animatedParams })
    // })
    // .to(animatedParams, {
    //   speed: 1,
    //   noiseScale: 2,
    //   // noiseStrength: 2,
    //   attractStrength: 20,
    //   damping: 0.8,
    //   duration: 1,
    //   ease: "power2.in",
    //   // delay: 3,
    //   onUpdate: () => setAnimatedParams({ ...animatedParams })
    // })
    .to(animatedParams, {
      speed: 0.2,
      noiseScale: 1,
      noiseStrength: 2,
      attractStrength: 1,
      damping: 0.98,
      duration: 5,
      ease: "power2.inOut",
      delay: 2,
      onUpdate: () => setAnimatedParams({ ...animatedParams })
    })
    

  }, [particles]);

  // Update uniforms when parameters change
  useEffect(() => {
    if (!particles.setUniform) return;

    const params = particleUniforms.useGSAP ? animatedParams : particleUniforms;

    particles.setUniform('uSpeed', params.speed);
    particles.setUniform('uNoiseScale', params.noiseScale);
    particles.setUniform('uTimeScale', params.timeScale);
    particles.setUniform('uNoiseStrength', params.noiseStrength);
    particles.setUniform('uAttractStrength', params.attractStrength);
    particles.setUniform('uDamping', params.damping);

  }, [particles, particleUniforms, animatedParams]);


  return {
    particleUniforms,
    particleConfig,
    shaderConfig,
    particles,
    animatedParams,
  };
}
