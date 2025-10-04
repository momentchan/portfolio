import * as THREE from 'three'

// Core VAT metadata interface
export interface VATMeta {
  vertexCount: number
  frameCount: number
  fps: number
  texWidth: number
  texHeight: number
  columns: number
  frameStride: number
  storeDelta: boolean
  normalsCompressed: boolean
}

// VAT resource bundle
export interface VATResources {
  gltf: THREE.Group
  posTex: THREE.Texture
  nrmTex: THREE.Texture | null
  mapTex: THREE.Texture | null
  maskTex: THREE.Texture | null
  meta: VATMeta
  refCount: number
}

// Material controls interface
export interface VATMaterialControls {
  roughness: number
  metalness: number
  transmission: number
  thickness: number
  ior: number
  clearcoat: number
  clearcoatRoughness: number
  reflectivity: number
  envMapIntensity: number
  sheen: number
  sheenRoughness: number
  sheenColor: string
  iridescence: number
  iridescenceIOR: number
  iridescenceThicknessMin: number
  iridescenceThicknessMax: number
  attenuationDistance: number
  attenuationColor: string
  bumpScale: number
  hueShift: number
  noiseScale: number
  noiseStrength: number
  speed: number
}

// VATMesh props interface
export interface VATMeshProps {
  // Preloaded resources
  gltf: THREE.Group
  posTex: THREE.Texture
  nrmTex?: THREE.Texture | null
  mapTex?: THREE.Texture | null
  maskTex?: THREE.Texture | null
  metaData: VATMeta
  speed?: number
  timeOffset?: number
  paused?: boolean
  useDepthMaterial?: boolean
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  // External frame control
  frame?: number
}

// VATMeshLifecycle props interface
export interface VATMeshLifecycleProps extends Omit<VATMeshProps, 'frame'> {
  maxScale?: number
  // Frame lifecycle timing
  frameForwardDuration?: number
  frameHoldDuration?: number
  frameBackwardDuration?: number
  // Scaling timing (relative to frame timing)
  scaleInDuration?: number
  scaleOutDuration?: number
  // Rotation timing (relative to frame timing)
  rotateInDuration?: number
  rotateOutDuration?: number
  // Camera tracking
  trackCamera?: boolean
  angleOffset?: number
  onComplete?: () => void
}

// Spawned mesh data
export interface SpawnedMeshData {
  id: number
  position: [number, number, number]
  scale: number
}

// Default material controls
export const DEFAULT_MATERIAL_CONTROLS: VATMaterialControls = {
  roughness: 0.25,
  metalness: 0.6,
  transmission: 0,
  thickness: 0,
  ior: 1.5,
  clearcoat: 0.1,
  clearcoatRoughness: 0.1,
  reflectivity: 0.5,
  envMapIntensity: 1,
  sheen: 0,
  sheenRoughness: 0.1,
  sheenColor: '#3695ff',
  iridescence: 0,
  iridescenceIOR: 1.3,
  iridescenceThicknessMin: 100,
  iridescenceThicknessMax: 400,
  attenuationDistance: Infinity,
  attenuationColor: '#ffffff',
  bumpScale: 1.0,
  hueShift: 0.45,
  noiseScale: 10,
  noiseStrength: 0.2,
  speed: 0.3,
}
