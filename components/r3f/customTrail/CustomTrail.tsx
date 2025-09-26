import { useEffect, useMemo } from 'react';
import { useControls } from 'leva';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Ribbon } from '../../../lib/trail-gpu/Ribbon';
import { ParticleDebugPoints } from '../../../lib/trail-gpu/ParticleDebugPoints';
import { useTrailsWithParticles } from '../../../lib/trail-gpu/hooks/useTrailsWithParticles';
import { useCustomTrailParticles } from './useCustomTrailParticles';
import { TrailConfig, ParticleConfig } from '../../../lib/trail-gpu/types';
import { customVertexShader, customFragmentShader } from './CustomShaders';

export function CustomTrail() {
  // Load normal texture
  const normalTexture = useTexture('/textures/Trail/rust_coarse_01_nor_dx_1k.png');

  // Trail configuration
  const trailControls = useControls('Trail System', {
    nodesPerTrail: { value: 100, min: 10, max: 200, step: 1 },
    trailsNum: { value: 1000, min: 10, max: 2000, step: 1 },
    updateDistanceMin: { value: 0.005, min: 0.001, max: 0.5, step: 0.001 },
  });

  // Custom trail particle configuration
  const particleControls = useControls('Custom Trail Particles', {
    speed: { value: 0.1, min: 0.1, max: 2.0, step: 0.1 },
    noiseScale: { value: 0.1, min: 0.1, max: 2.0, step: 0.1 },
    timeScale: { value: 0.1, min: 0.1, max: 1.0, step: 0.1 },
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


  // Create trail system configuration
  const trailConfig: TrailConfig = useMemo(() => ({
    nodesPerTrail: trailControls.nodesPerTrail,
    trailsNum: trailControls.trailsNum,
    updateDistanceMin: trailControls.updateDistanceMin,
  }), [trailControls]);

  const particleConfig: ParticleConfig = useMemo(() => ({
    count: trailControls.trailsNum,
    speed: particleControls.speed,
    noiseScale: particleControls.noiseScale,
    timeScale: particleControls.timeScale,
  }), [trailControls.trailsNum, particleControls]);


  const initialPositions = useMemo(() => {
    const positions = new Float32Array(trailControls.trailsNum *4);
    for (let i = 0; i < trailControls.trailsNum; i++) {
      positions[i * 4] = (Math.random() - 0.5) * 0.1;
      positions[i * 4 + 1] = (Math.random() - 0.5) * 0.5;
      positions[i * 4 + 2] = (Math.random() - 0.5) * 0.1;
      positions[i * 4 + 3] = 0;
    }
    return positions;

  }, [trailControls.trailsNum]);

  // Create custom trail particle system
  const { particles } = useCustomTrailParticles({
    count: trailControls.trailsNum,
    particleConfig,
    initialPositions,
  });

  // Combine with trail system
  const { trails } = useTrailsWithParticles({
    particleSystem: particles,
    trailConfig,
  });

  const customUniforms = useMemo(() => ({
    uRoughness: { value: displayControls.roughness },
    uMetalness: { value: displayControls.metalness },
    uNoiseScale: { value: displayControls.noiseScale },
  }), [displayControls]);

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

  return (
    <>
      {/* Main ribbon visualization */}
      {displayControls.showRibbon && (
        <Ribbon
          nodeTex={trails.nodeTexture}
          trailTex={trails.trailTexture}
          nodes={trails.nodes}
          trails={trails.trails}
          baseWidth={displayControls.ribbonWidth}
          color={displayControls.ribbonColor}
          materialProps={materialProps}
          customVertexShader={customVertexShader}
          customFragmentShader={customFragmentShader}
          customUniforms={customUniforms}
          />
      )}

      {/* Debug points for particle positions */}
      {displayControls.showParticlePoints && (
        <ParticleDebugPoints
          particleTexture={particles.particlesTexture}
          count={particles.count}
          size={0.05}
          color="#ff6b6b"
        />
      )}
    </>
  );
}
