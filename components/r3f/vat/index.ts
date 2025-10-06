// Main exports for VAT components
export { VATMesh } from './VATMesh'
export { VATMeshLifecycle } from './VATMeshLifecycle'
export { VATMeshSpawner } from './VATMeshSpawner'
export { AutoSpawner } from './AutoSpawner'
export { useVATPreloader } from './VATPreloader'

// Type exports
export type {
  VATMeta,
  VATResources,
  VATMaterialControls,
  VATMeshProps,
  VATMeshLifecycleProps,
  SpawnedMeshData
} from './types'

export type { DebugAxesProps } from './components/DebugAxes'

// Utility exports
export {
  ensureUV2ForVAT,
  generateSpherePosition,
  calculateCameraFacingRotation,
  applyRandomRotationOffsets
} from './utils'

// Component exports
export { DebugAxes } from './components/DebugAxes'

// Material exports
export {
  createVATMaterial,
  createVATDepthMaterial,
  updateVATMaterial
} from './materials'

// Constants
export { DEFAULT_MATERIAL_CONTROLS } from './types'
