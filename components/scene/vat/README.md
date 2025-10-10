# VAT (Vertex Animation Texture) System

A complete system for working with Vertex Animation Textures in React Three Fiber, featuring lifecycle management, particle effects, and interactive triggers.

## Structure

```
vat/
├── animations/         # GSAP animation utilities
│   └── gsapTimeline.ts
├── components/         # Reusable sub-components
│   └── DebugAxes.tsx
├── hooks/              # React hooks
│   ├── useAnimatedValue.ts
│   └── useVATAnimation.ts
├── materials/          # Material creation and management
│   └── index.ts
├── shaders/            # GLSL shader code
│   └── *.glsl
├── utils/              # Utility functions
│   ├── index.ts
│   └── spawnerUtils.ts
├── VATMesh.tsx         # Core VAT mesh component
├── VATMeshLifecycle.tsx # VAT with lifecycle animations
├── VATMeshSpawner.tsx  # Spawner with auto-spawn logic
├── AutoSpawner.tsx     # Auto-spawning logic component
├── InteractiveTrigger.tsx # Interactive trigger helper
├── VATPreloader.tsx    # Resource preloading hook
├── types.ts            # TypeScript types
└── index.ts            # Main exports
```

## Core Components

### VATMesh

The base VAT mesh component with material controls and particle system integration.

```tsx
import { VATMesh } from '@scene/vat'

<VATMesh
  gltf={gltfScene}
  posTex={positionTexture}
  nrmTex={normalTexture}
  mapTex={colorTexture}
  maskTex={maskTexture}
  metaData={vatMetadata}
  speed={1}
  paused={false}
  useDepthMaterial={true}
  frame={0.5}          // Optional: 0-1 for external control
  interactive={true}
  triggerSize={0.05}
  globalRatio={0.8}
/>
```

**Features:**
- Automatic material creation and management
- Custom depth materials for shadows
- Particle system integration
- Interactive hover effects
- Leva controls for real-time material tweaking

### VATMeshLifecycle

VAT mesh with complete lifecycle animations (spawn, animate, despawn).

```tsx
import { VATMeshLifecycle } from '@scene/vat'

<VATMeshLifecycle
  {...vatProps}
  maxScale={1.5}
  frameForwardDuration={3}
  frameHoldDuration={5}
  frameBackwardDuration={3}
  scaleInDuration={1}
  scaleOutDuration={1}
  rotateInDuration={2}
  rotateOutDuration={2}
  onComplete={() => console.log('Animation complete')}
/>
```

**Animation Timeline:**
- Frame plays forward, holds, then reverses
- Scale fades in and out with custom timing
- Rotation animates in and out independently
- Global ratio (0-1) tracks overall progress

### VATMeshSpawner

High-level spawner with auto-spawn logic and resource management.

```tsx
import { VATMeshSpawner } from '@scene/vat'

<VATMeshSpawner
  vatData={{
    gltfPath: "vat/model.gltf",
    posTexPath: "vat/pos.exr",
    nrmTexPath: "vat/nrm.png",
    mapTexPath: "textures/color.png",
    maskTexPath: "textures/mask.png",
    metaPath: "vat/meta.json"
  }}
/>
```

**Features:**
- Automatic resource preloading
- GPU pre-warming with hidden mesh
- Auto-spawn with configurable intervals
- Burst spawning mode
- Collision detection (prevents overlapping spawns)
- Keyboard control (F key to spawn)

## Hooks

### useAnimatedValue(initialValue)

Encapsulates the ref/state pattern for GSAP animations.

```tsx
const [scaleRef, scale, syncScale] = useAnimatedValue(0)

gsap.to(scaleRef, {
  value: 1,
  onUpdate: syncScale
})

<mesh scale={scale} />
```

### useVATAnimation(metaData, speed, paused, externalFrame)

Manages VAT frame animation timing.

### useTriggerRate(hovering, speed)

Manages interactive trigger rate for hover effects.

### useVATPreloader(gltfPath, posTexPath, nrmTexPath, mapTexPath, maskTexPath, metaPath)

Preloads all VAT resources.

**Returns:**
```tsx
{
  gltf, posTex, nrmTex, mapTex, maskTex, meta,
  isLoaded  // true when all resources loaded
}
```

## Utilities

### spawnerUtils

- `generateValidPosition(existingMeshes, radius, minDistance, maxAttempts)` - Generate non-colliding spawn position
- `isPositionValid(position, existingMeshes, minDistance)` - Check position validity
- `createSpawnId(counter)` - Create unique mesh ID

### Spatial Utils

- `generateSpherePosition(radius, center?)` - Random position in sphere
- `calculateCameraFacingRotation(meshPos, cameraPos)` - Calculate rotation to face camera
- `applyRandomRotationOffsets(baseRotation, yRange, xRange)` - Apply random rotation offsets

### Material Utils

- `ensureUV2ForVAT(geometry, metadata)` - Ensure geometry has UV2 attribute for VAT

## Animations

### createVATLifecycleTimeline(config, refs)

Creates a synchronized GSAP timeline for frame, scale, and rotation animations.

**See:** `animations/README.md` for detailed documentation.

## Materials

### createVATMaterial(posTex, nrmTex, mapTex, maskTex, envMap, metaData, controls)

Creates a CustomShaderMaterial with VAT support.

### createVATDepthMaterial(posTex, nrmTex, metaData)

Creates a depth material for shadows.

### updatePhysicalProperties(material, controls)

Updates material physical properties from controls.

### updateAdvancedProperties(material, controls)

Updates advanced material properties (iridescence, transmission, etc.)

## Interactive Trigger

### InteractiveTrigger

Helper component for click/hover detection on invisible geometry.

```tsx
<InteractiveTrigger
  size={0.5}
  position={[0, 0, 0]}
  onTrigger={(type, data) => console.log(type)}
  id="trigger-1"
  visible={false}
/>
```

## Auto Spawner

### AutoSpawner

Component for automatic mesh spawning with burst modes.

```tsx
<AutoSpawner
  isActive={true}
  onSpawn={spawnCallback}
  minInterval={2000}
  maxInterval={5000}
  burstEnabled={true}
  burstInterval={[20000, 30000]}
  burstCount={[10, 15]}
  burstDuration={3000}
/>
```

**Features:**
- Random intervals between spawns
- Burst mode (spawn multiple at once)
- Visibility API integration (pauses when tab hidden)
- Automatic cleanup

## Types

### VATMeta

Core VAT metadata from exported JSON:
- `vertexCount`, `frameCount`, `fps`
- `texWidth`, `texHeight`, `columns`, `frameStride`
- `storeDelta`, `normalsCompressed`

### VATMeshProps

Props for VATMesh component (see component docs above)

### VATMeshLifecycleProps

Extends VATMeshProps with lifecycle animation timing

### SpawnedMeshData

Data structure for spawned meshes (id, position, scale, durations)

## Example: Complete Setup

```tsx
import { VATMeshSpawner } from '@scene/vat'

export function Scene() {
  return (
    <>
      <VATMeshSpawner
        vatData={{
          gltfPath: "vat/flower.gltf",
          posTexPath: "vat/flower_pos.exr",
          nrmTexPath: "vat/flower_nrm.png",
          mapTexPath: "textures/flower_color.png",
          maskTexPath: "textures/flower_mask.png",
          metaPath: "vat/flower_meta.json"
        }}
      />
    </>
  )
}
```

This will:
1. Preload all resources
2. Pre-warm GPU with hidden mesh
3. Auto-spawn VAT meshes with lifecycle animations
4. Spawn particle effects from VAT vertices
5. Handle cleanup when animations complete

## Particle Integration

Each VAT mesh automatically spawns a `VATParticleSystem` that:
- Samples positions from the VAT mesh geometry
- Follows VAT animation frames
- Responds to interaction (animateRate)
- Fades in/out with globalRatio

## Performance

- **GPU Pre-warming**: First mesh hidden offscreen to warm GPU
- **Instance Cloning**: Each VAT instance clones geometry/materials
- **Frustum Culling**: Disabled for VAT meshes (they animate)
- **Shadow Support**: Custom depth materials for accurate shadows
- **Particle Count**: Configurable in VATParticleSystem (default: 128)

## Best Practices

1. **Preload Resources**: Use `useVATPreloader` before rendering
2. **Manage Lifecycle**: Use `VATMeshLifecycle` for automatic cleanup
3. **Control Spawn Rate**: Adjust AutoSpawner intervals to match performance
4. **Collision Detection**: VATMeshSpawner prevents overlapping spawns
5. **Material Controls**: Use Leva controls for debugging, remove for production
