import { useEffect, useMemo } from 'react';
import { useControls } from 'leva';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Ribbon } from '../../../lib/trail-gpu/Ribbon';
import { ParticleDebugPoints } from '../../../lib/trail-gpu/ParticleDebugPoints';
import { useParticles, useTrails } from '../../../lib/trail-gpu';
import { TrailConfig, ParticleConfig, ParticleShaderConfig } from '../../../lib/trail-gpu/types';
import { customVertexShader, customFragmentShader } from './CustomShaders';
import { DistanceShaderPack } from '@/lib/trail-gpu/shaders/packs/distance';
import { useFrame } from '@react-three/fiber';
import { customVelocityShader, customPositionShader } from './CustomTrailParticles';

export function CustomTrail() {
  // Load normal texture
  const normalTexture = useTexture('/textures/Trail/rust_coarse_01_nor_dx_1k.png');

  // Trail configuration
  const trailControls = useControls('Trail System', {
    length: { value: 0.3, min: 0, max: 0.5, step: 0.01 },
    trailsNum: { value: 1000, min: 10, max: 2000, step: 1 },
    updateDistanceMin: { value: 0.005, min: 0.001, max: 0.5, step: 0.001 },
  });

  // Custom trail particle uniforms (shader parameters)
  const particleUniforms = useControls('Custom Trail Particles', {
    speed: { value: 0.2, min: 0.1, max: 2.0, step: 0.1 },
    noiseScale: { value: 2, min: 0.0, max: 2.0, step: 0.1 },
    timeScale: { value: 0.1, min: 0.1, max: 1.0, step: 0.1 },
    noiseStrength: { value: 2, min: 0., max: 2.0, step: 0.1 },
  });

  const displayControls = useControls('Display', {
    showRibbon: { value: true },
    showParticlePoints: { value: false },
    ribbonColor: { value: '#ffffff' },
    ribbonWidth: { value: 0.001, min: 0.0001, max: 0.01, step: 0.0001 },
    wireframe: { value: false },
    roughness: { value: 0.3, min: 0.0, max: 1.0, step: 0.01 },
    metalness: { value: 0.8, min: 0.0, max: 1.0, step: 0.01 },
    noiseScale: { value: 200, min: 0.1, max: 200.0, step: 0.1 },
    normalMapIntensityX: { value: 100, min: 0.0, max: 1000.0, step: 0.01 },
    normalMapIntensityY: { value: 1, min: 0.0, max: 1000.0, step: 0.01 },
    normalMapRepeatX: { value: 10, min: 0.0, max: 10.0, step: 0.01 },
    normalMapRepeatY: { value: 1, min: 0.0, max: 10.0, step: 0.01 },
  });

  useEffect(() => {
    normalTexture.repeat.set(displayControls.normalMapRepeatX, displayControls.normalMapRepeatY);
  }, [displayControls.normalMapRepeatX, displayControls.normalMapRepeatY]);

  const initialPositions = useMemo(() => {
    const positions = new Float32Array(trailControls.trailsNum *4);
    for (let i = 0; i < trailControls.trailsNum; i++) {
      positions[i * 4] = (Math.random() - 0.5) * 0.1;
      positions[i * 4 + 1] = (Math.random() - 0.5) * 0.1;
      positions[i * 4 + 2] = (Math.random() - 0.5) * 0.1;
      positions[i * 4 + 3] = 0;
    }
    return positions;

  }, [trailControls.trailsNum]);
  
  // Particle system configuration (system setup only)
  const particleConfig: ParticleConfig = useMemo(() => ({
    count: trailControls.trailsNum,
    initialPositions,
  }), [trailControls.trailsNum]);

  // Shader configuration
  const shaderConfig: ParticleShaderConfig = useMemo(() => ({
    velocityShader: customVelocityShader,
    positionShader: customPositionShader,
    uniforms: {
      uSpeed: particleUniforms.speed,
      uNoiseScale: particleUniforms.noiseScale,
      uTimeScale: particleUniforms.timeScale,
      uNoiseStrength: particleUniforms.noiseStrength,
      uAttractPos: new THREE.Vector3(0, 0, 0),
    }
  }), [particleUniforms]);

 

  // Create custom trail particle system
  const particles = useParticles({
    count: trailControls.trailsNum,
    shaderConfig,
    config: particleConfig,
  });

  // Combine with trail system
  const trails = useTrails({
    nodesPerTrail: trailControls.length / trailControls.updateDistanceMin,
    trailsNum: trailControls.trailsNum,
    updateDistanceMin: trailControls.updateDistanceMin,
    shaderPack: DistanceShaderPack,
  });

  // Material configuration for custom shader
  const materialConfig = useMemo(() => ({
    vertexShader: customVertexShader,
    fragmentShader: customFragmentShader,
    uniforms: {
      // Standard uniforms (required)
      uNodeTex: { value: trails.nodeTexture },
      uTrailTex: { value: trails.trailTexture },
      uBaseWidth: { value: displayControls.ribbonWidth },
      uNodes: { value: trailControls.length / trailControls.updateDistanceMin },
      uTrails: { value: trailControls.trailsNum },
      uCameraPos: { value: new THREE.Vector3() },
      uColor: { value: new THREE.Color(displayControls.ribbonColor) },
      
      // Custom uniforms
      uRoughness: { value: displayControls.roughness },
      uMetalness: { value: displayControls.metalness },
      uNoiseScale: { value: displayControls.noiseScale },
      uTest: { value: 0 }, // Debug uniform
    }
  }), [trails.nodeTexture, trails.trailTexture, displayControls, trailControls]);

  // Flexible material properties - you can add any Three.js material props here
  const materialProps = useMemo(() => ({
    // Basic material properties
    wireframe: displayControls.wireframe,
    transparent: false,

    // Textures and maps
    normalMap: normalTexture,
    normalScale: new THREE.Vector2(displayControls.normalMapIntensityX, displayControls.normalMapIntensityY),

    // Material properties
    roughness: displayControls.roughness,
    metalness: displayControls.metalness,
  }), [normalTexture, displayControls]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (!trails) return;

    particles.update(t, delta);
    trails.update(t, delta, particles.positionsTexture!);
  });

  return (
    <>
      {/* Main ribbon visualization */}
      {displayControls.showRibbon && trails.nodeTexture && trails.trailTexture && (
        <Ribbon
          nodeTex={trails.nodeTexture}
          trailTex={trails.trailTexture}
          nodes={trailControls.length / trailControls.updateDistanceMin}
          trails={trailControls.trailsNum}
          baseWidth={displayControls.ribbonWidth}
          color={displayControls.ribbonColor}
          materialType="custom-shader"
          materialConfig={materialConfig}
          materialProps={materialProps}
        />
      )}

      {/* Debug points for particle positions */}
      {displayControls.showParticlePoints && (
        <ParticleDebugPoints
          particleTexture={particles.positionsTexture!}
          count={particles.count}
          size={0.05}
          color="#ff6b6b"
        />
      )}

    </>
  );
}
