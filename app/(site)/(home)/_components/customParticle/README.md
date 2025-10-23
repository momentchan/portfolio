# Custom Particle System

A modular and reusable particle system library built on top of the base particle system, featuring specialized implementations for VAT (Vertex Animation Texture) particles and flow field particles.

## Structure

```
customParticle/
├── behaviors/          # Particle behavior implementations
│   ├── FlowFieldBehavior.tsx
│   └── VATBehavior.tsx
├── configs/            # Position configuration presets
│   └── PositionConfigs.tsx
├── hooks/              # Shared React hooks
│   └── useParticleAnimation.ts
├── materials/          # Material factories and utilities
│   └── particleMaterial.ts
├── shaders/            # Shared shader code
│   └── particleShaders.ts
├── utils/              # Utility functions
│   ├── matrixUtils.ts
│   └── textureUtils.ts
├── FlowFieldParticleSystem.tsx
├── VATParticleSystem.tsx
├── LifetimeTexture.tsx
├── types.ts
└── index.ts
```

## Particle Systems

### VATParticleSystem

A particle system designed to work with Vertex Animation Textures (VAT). Particles are spawned from mesh vertices and follow VAT animation data.

**Features:**
- Lifetime-based particle aging
- VAT texture sampling for position
- Animated gradient effects based on animation progress
- Mouse avoidance behavior
- Noise-based movement

**Usage:**
```tsx
<VATParticleSystem
  frame={0.5}
  posTex={vatPositionTexture}
  meta={vatMetadata}
  geometry={meshGeometry}
  storeDelta={1}
  animateRate={0.5}
  globalRatio={0.8}
/>
```

### FlowFieldParticleSystem

A particle system with flow field dynamics and mouse interaction.

**Features:**
- Flow field-based movement
- Mouse pointer avoidance
- Velocity-based glow effects
- Speed-sensitive behavior

**Usage:**
```tsx
<FlowFieldParticleSystem />
```

## Shared Utilities

### Materials

#### `createVATParticleMaterial()`
Creates a shader material for VAT particle systems with lifetime and animation support.

#### `createFlowFieldParticleMaterial()`
Creates a shader material for flow field particle systems with velocity-based effects.

#### `updateCommonMaterialUniforms(material, params)`
Updates common uniforms shared between particle materials (time, opacity, colors, etc.).

### Shaders

#### `createParticleVertexShader(options)`
Generates a customizable vertex shader with optional features:
- `useLifetime`: Add lifetime-based aging
- `useGlobalRatio`: Add global animation ratio fading

#### `createParticleFragmentShader(options)`
Generates a customizable fragment shader with optional features:
- `useVelocityGlow`: Add velocity-based glow effects
- `useAnimateRate`: Add animated gradient effects

### Texture Utilities

#### `generateRandomVertexIds(particleCount, maxVertexCount)`
Generates random vertex IDs for particle-to-vertex mapping.

#### `generateBasePosTexture(count, geometry, randomIds)`
Creates a texture containing base positions from mesh geometry.

#### `generateUV2Texture(count, meta, randomIds)`
Creates a UV2 texture for VAT coordinate mapping.

### Matrix Utilities

#### `calculateMVPMatrices(modelMatrix, camera)`
Calculates model-view-projection matrix and its inverse for screen-space operations.

#### `getModelMatrix(particleSystemRef)`
Safely retrieves the model matrix from a particle system reference.

### Hooks

#### `useParticleAnimation(options)`
Hook for particle fade-in animation using GSAP.

```tsx
const animate = useParticleAnimation({
  duration: 3,
  delay: 1,
  ease: 'power2.inOut'
});
```

## Types

All TypeScript types and interfaces are available in `types.ts`:

- `BaseParticleSystemProps`
- `VATParticleSystemProps`
- `VATMetadata`
- `ParticleMaterialControls`
- `VATMaterialUniforms`
- `FlowFieldMaterialUniforms`

## Behaviors

### VATBehavior
Controls particle lifecycle with VAT integration, noise-based movement, and mouse avoidance.

### FlowFieldBehavior
Implements flow field dynamics with curl noise and pointer interaction.

## Configuration Presets

### RandomSpherePositionConfig
Generates random positions within a sphere.

```tsx
new RandomSpherePositionConfig(radius, center)
```

## Best Practices

1. **Material Creation**: Use the factory functions (`createVATParticleMaterial`, `createFlowFieldParticleMaterial`) instead of creating materials manually.

2. **Uniform Updates**: Use `updateCommonMaterialUniforms()` for shared uniforms to maintain consistency.

3. **Texture Generation**: Reuse random vertex IDs between base position and UV2 textures for consistency.

4. **Performance**: Keep particle counts reasonable (128-2048 depending on device capabilities).

## Extending

To create a new particle system:

1. Create a new behavior in `behaviors/`
2. Use shared material utilities or create a new material function
3. Extend types in `types.ts`
4. Export from `index.ts`

Example:
```tsx
import { createParticleVertexShader, createParticleFragmentShader } from './shaders/particleShaders';

const customMaterial = new THREE.ShaderMaterial({
  uniforms: { /* ... */ },
  vertexShader: createParticleVertexShader({ useLifetime: true }),
  fragmentShader: createParticleFragmentShader({ useVelocityGlow: true }),
  // ...
});
```

