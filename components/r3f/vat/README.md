# VAT (Vertex Animation Texture) Components

This directory contains refactored VAT components for rendering vertex-animated meshes in Three.js.

## Structure

```
vat/
├── components/           # React components
│   └── DebugAxes.tsx    # Debug visualization component
├── materials/           # Material factory functions
│   └── index.ts         # VAT material creation and management
├── shaders/            # GLSL shader files
│   ├── vertex.glsl     # Vertex shader code
│   ├── fragment.glsl   # Fragment shader code
│   └── index.ts        # Shader exports with includes
├── types.ts            # TypeScript interfaces and types
├── utils/              # Utility functions
│   └── index.ts        # Helper functions for VAT operations
├── VATMesh.tsx         # Core VAT mesh component
├── VATMeshLifecycle.tsx # VAT mesh with GSAP animations
├── VATMeshSpawner.tsx  # VAT mesh spawner with keyboard controls
├── VATPreloader.tsx    # VAT resource preloader hook
├── index.ts            # Main exports
└── README.md           # This file
```

## Components

### VATMesh
Core component for rendering vertex-animated meshes with custom shaders.

**Props:**
- `gltf`: THREE.Group - Preloaded GLTF scene
- `posTex`: THREE.Texture - Position texture
- `nrmTex`: THREE.Texture - Normal texture (optional)
- `mapTex`: THREE.Texture - Diffuse texture (optional)
- `maskTex`: THREE.Texture - Mask texture (optional)
- `metaData`: VATMeta - VAT metadata
- `frame`: number - External frame control (optional)
- Standard Three.js mesh props (position, rotation, scale)

### VATMeshLifecycle
VAT mesh with GSAP-powered lifecycle animations.

**Features:**
- Frame animation (forward, hold, backward)
- Scale animation (in, hold, out)
- Rotation animation
- Camera-facing rotation on spawn
- Random rotation offsets
- Debug axes visualization

**Props:**
- All VATMesh props except `frame`
- Animation timing controls
- Camera tracking options
- Completion callback

### VATMeshSpawner
Manages spawning and lifecycle of multiple VAT meshes.

**Features:**
- F-key spawning
- Sphere-based position generation
- Resource preloading
- GPU pre-warming
- Automatic cleanup

### VATPreloader
Hook for preloading VAT resources with proper loader selection.

**Resources:**
- GLTF mesh
- Position texture (EXR)
- Normal texture (PNG/EXR)
- Diffuse texture
- Mask texture
- Metadata JSON

## Utilities

### Geometry
- `ensureUV2ForVAT()` - Creates UV2 attribute for VAT geometry

### Positioning
- `generateSpherePosition()` - Generates random positions inside sphere

### Rotation
- `calculateCameraFacingRotation()` - Calculates rotation to face camera
- `applyRandomRotationOffsets()` - Applies random X/Z rotation offsets

## Materials

### Factory Functions
- `createVATMaterial()` - Creates VAT material with custom shaders
- `createVATDepthMaterial()` - Creates depth material for shadows
- `updateVATMaterial()` - Updates material properties

### Shaders
- **Vertex**: VAT position/normal sampling with noise
- **Fragment**: Color processing with hue shift and animated gradient

## Usage

```tsx
import { VATMeshSpawner } from '@/components/r3f/vat'

function Scene() {
  return (
    <>
      <VATMeshSpawner />
    </>
  )
}
```

## Controls

- **F** - Spawn new VAT mesh
- **Space** - Pause/resume animations (when focused on VATMeshLifecycle)

## Features

- ✅ Modular architecture
- ✅ TypeScript support
- ✅ GSAP animations
- ✅ Camera-facing rotation
- ✅ Random positioning
- ✅ Material controls via Leva
- ✅ Debug visualization
- ✅ Resource preloading
- ✅ GPU pre-warming
- ✅ Automatic cleanup
