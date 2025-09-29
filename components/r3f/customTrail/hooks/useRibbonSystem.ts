import { useEffect, useMemo } from 'react';
import { useControls } from 'leva';
import { useTexture } from '@react-three/drei';
import { useRibbonGeometry, useRibbonMaterials } from '../../../../lib/trail-gpu';
import { 
  customRibbonQuadVertexShader, 
  customRibbonQuadFragmentShader,
  customRibbonTubeVertexShader,
  customRibbonTubeFragmentShader
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
  const normalTexture = useTexture('/textures/Trail/rust_coarse_01_nor_dx_1k.png');

  // Display controls
  const displayControls = useControls('Display', {
    showRibbon: { value: true },
    showParticlePoints: { value: false },
    geometryType: { value: 'quad', options: ['quad', 'tube'] },
    ribbonColor: { value: '#ffffff' },
    ribbonWidth: { value: 0.001, min: 0.0001, max: 0.01, step: 0.0001 },
    tubeSegments: { value: 16, min: 3, max: 32, step: 1 },
    wireframe: { value: false },
    roughness: { value: 0.3, min: 0.0, max: 1.0, step: 0.01 },
    metalness: { value: 0.8, min: 0.0, max: 1.0, step: 0.01 },
    noiseScale: { value: 200, min: 0.1, max: 200.0, step: 0.1 },
    normalMapIntensityX: { value: 100, min: 0.0, max: 1000.0, step: 0.01 },
    normalMapIntensityY: { value: 1, min: 0.0, max: 1000.0, step: 0.01 },
    normalMapRepeatX: { value: 10, min: 0.0, max: 10.0, step: 0.01 },
    normalMapRepeatY: { value: 1, min: 0.0, max: 10.0, step: 0.01 },
  });

  // Update normal texture repeat
  useEffect(() => {
    normalTexture.repeat.set(displayControls.normalMapRepeatX, displayControls.normalMapRepeatY);
  }, [normalTexture, displayControls.normalMapRepeatX, displayControls.normalMapRepeatY]);

  // Flexible material properties
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

  // Create geometry based on selected type
  const geometry = useRibbonGeometry({
    geometryType: displayControls.geometryType as 'quad' | 'tube',
    geometryConfig: displayControls.geometryType === 'tube' 
      ? { 
          nodes: nodesPerTrail, 
          trails: trailsNum, 
          segments: displayControls.tubeSegments,
          radius: displayControls.ribbonWidth
        }
      : { 
          nodes: nodesPerTrail, 
          trails: trailsNum, 
          width: displayControls.ribbonWidth 
        },
  });

  // Create materials with appropriate shaders based on geometry type
  const materials = useRibbonMaterials({
    materialType: 'custom-shader',
    materialConfig: {
      vertexShader: displayControls.geometryType === 'tube' 
        ? customRibbonTubeVertexShader 
        : customRibbonQuadVertexShader,
      fragmentShader: displayControls.geometryType === 'tube' 
        ? customRibbonTubeFragmentShader 
        : customRibbonQuadFragmentShader,
      uniforms: {
        // Standard uniforms (required)
        uNodeTex: { value: nodeTexture },
        uTrailTex: { value: trailTexture },
        uBaseWidth: { value: displayControls.ribbonWidth },
        uNodes: { value: nodesPerTrail },
        uTrails: { value: trailsNum },
        uCameraPos: { value: new THREE.Vector3() },
        uColor: { value: new THREE.Color(displayControls.ribbonColor) },
        
        // Tube-specific uniforms
        ...(displayControls.geometryType === 'tube' && {
          uSegments: { value: displayControls.tubeSegments },
          uTime: { value: 0 },
        }),
        
        // Custom uniforms
        uRoughness: { value: displayControls.roughness },
        uMetalness: { value: displayControls.metalness },
        uNoiseScale: { value: displayControls.noiseScale },
        uTest: { value: 0 }, // Debug uniform
      },
      nodeTex: nodeTexture,
      trailTex: trailTexture,
      baseWidth: displayControls.ribbonWidth,
      nodes: nodesPerTrail,
      trails: trailsNum,
      color: displayControls.ribbonColor,
      materialProps,
      // Tube-specific config
      ...(displayControls.geometryType === 'tube' && {
        segments: displayControls.tubeSegments,
      }),
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
