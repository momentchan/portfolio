import { useEffect, useMemo } from 'react';
import { useControls } from 'leva';
import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useRibbonGeometry, useRibbonMaterials } from '../../../../lib/trail-gpu';
import {
  customRibbonQuadVertexShader,
  customRibbonQuadFragmentShader
} from '../ribbon';
import * as THREE from 'three';

interface UseRibbonSystemProps {
  trailsNum: number;
  nodesPerTrail: number;
  nodeTexture: THREE.Texture;
  trailTexture: THREE.Texture;
}

export function useRibbonSystem({
  trailsNum,
  nodesPerTrail,
  nodeTexture,
  trailTexture
}: UseRibbonSystemProps) {
  // Load normal texture
  const normalTexture = useTexture('/textures/rust_coarse_01_nor_dx_1k.png');
  const { scene } = useThree();

  // Display controls
  const displayControls = useControls('Trails.Ribbon', {
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
    envMapIntensity: { value: 0, min: 0.0, max: 1.0, step: 0.01 },
  }, { collapsed: true });

  // Update normal texture repeat
  useEffect(() => {
    normalTexture.repeat.set(displayControls.normalMapRepeatX, displayControls.normalMapRepeatY);
  }, [normalTexture, displayControls.normalMapRepeatX, displayControls.normalMapRepeatY]);

  // Flexible material properties
  const materialProps = useMemo(() => (
    {
    // Basic material properties
    wireframe: displayControls.wireframe,
    transparent: false,
    envMapIntensity: displayControls.envMapIntensity,
    envMap: scene.environment,

    normalMap: normalTexture,
    normalScale: new THREE.Vector2(displayControls.normalMapIntensityX, displayControls.normalMapIntensityY),

    roughness: displayControls.roughness,
    metalness: displayControls.metalness,
  }), [normalTexture, displayControls, scene.environment]);

  // Create quad geometry
  const geometry = useRibbonGeometry({
    geometryType: 'quad',
    geometryConfig: {
      nodes: nodesPerTrail,
      trails: trailsNum,
      width: displayControls.ribbonWidth
    },
  });

  // Create materials with quad shaders
  const materials = useRibbonMaterials({
    materialType: 'standard',
    materialConfig: {
      nodeTex: nodeTexture,
      trailTex: trailTexture,
      baseWidth: displayControls.ribbonWidth,
      nodes: nodesPerTrail,
      trails: trailsNum,
      color: displayControls.ribbonColor,
      materialProps,
      vertexShader: customRibbonQuadVertexShader,
      fragmentShader: customRibbonQuadFragmentShader,
      uniforms: {
        // Standard uniforms (required)
        uNodeTex: { value: nodeTexture },
        uTrailTex: { value: trailTexture },
        uBaseWidth: { value: displayControls.ribbonWidth },
        uNodes: { value: nodesPerTrail },
        uTrails: { value: trailsNum },
        uCameraPos: { value: new THREE.Vector3() },
        uColor: { value: new THREE.Color(displayControls.ribbonColor) },

        // Custom uniforms
        uNoiseScale: { value: displayControls.noiseScale },
        uTest: { value: 0 }, // Debug uniform
      },
      
    },
  });

  return {
    displayControls,
    materialProps,
    geometry,
    materials,
    normalTexture,
  };
}
