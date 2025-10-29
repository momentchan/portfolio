# Particle Behaviors

This folder contains particle behavior implementations with shared utilities and type-safe uniforms.

## Structure

```
behaviors/
├── behaviorTypes.ts         # Shared uniform types and factories
├── shaderUtils.ts          # Common GLSL shader utilities
├── FlowFieldBehavior.tsx   # Flow field dynamics behavior
├── VATBehavior.tsx         # VAT-based behavior with lifetime management
└── README.md
```

## Behaviors

### VATBehavior

Controls particle lifecycle with VAT (Vertex Animation Texture) integration, curl noise movement, and mouse avoidance.

**Features:**
- Individual particle lifetimes from texture
- VAT position sampling with interpolation
- Upward drift with curl noise
- Pointer avoidance in screen space
- Age-based velocity boosting

**Constructor:**
```typescript
new VATBehavior(
    lifetime: number = 5.0,        // Default lifetime (overridden by texture)
    upwardSpeed: number = 0.5,     // Upward movement speed
    noiseScale: number = 1.0,      // Curl noise scale
    noiseStrength: number = 0.2,   // Curl noise strength
    timeScale: number = 1.0        // Time scaling for noise
)
```

**Key Uniforms:**
- `uLifetimeTexture` - Per-particle lifetime data
- `uVatPosTex` - VAT position texture
- `uUpwardSpeed` - Upward movement speed
- `uAnimateRate` - Animation progress (0-1)

### FlowFieldBehavior

Implements flow field dynamics with curl noise and pointer interaction.

**Features:**
- Curl noise-based flow field
- Center attraction force
- Pointer avoidance with speed sensitivity
- Velocity damping

**Constructor:**
```typescript
new FlowFieldBehavior(
    speed: number = 0.2,              // Base movement speed
    noiseScale: number = 1,           // Flow field noise scale
    timeScale: number = 0.1,          // Time evolution speed
    noiseStrength: number = 2,        // Flow field strength
    attractStrength: number = 1.5,    // Center attraction strength
    damping: number = 0.98,           // Velocity damping
    avoidanceStrength: number = 0.5,  // Pointer avoidance strength
    avoidanceRadius: number = 100.0   // Pointer avoidance radius
)
```

**Key Uniforms:**
- `uSpeed` - Base movement speed
- `uNoiseScale` - Flow field scale
- `uAttractStrength` - Center attraction force
- `uSpeedMultiplier` - Dynamic speed multiplier from pointer movement

## Shared Utilities

### behaviorTypes.ts

Provides type-safe uniform interfaces and factory functions.

**Interfaces:**
- `CommonBehaviorUniforms` - Shared across all behaviors
- `NoiseBehaviorUniforms` - Noise-related uniforms
- `VATBaseUniforms` - VAT-specific base uniforms
- `VATBehaviorUniforms` - Complete VAT behavior uniforms
- `FlowFieldBehaviorUniforms` - Complete flow field behavior uniforms

**Factory Functions:**
```typescript
createCommonUniforms()           // Creates common uniforms
createNoiseUniforms(scale, strength, timeScale)  // Creates noise uniforms
```

### shaderUtils.ts

Common GLSL shader utilities and helper functions.

**Functions:**
- `worldToNDC(worldPos, mvpMatrix)` - Convert world space to NDC
- `ndcToWorld(ndc, inverseMvpMatrix)` - Convert NDC to world space
- `safeNormalize(v)` - Safe vector normalization (avoids division by zero)
- `calculatePointerAvoidance(...)` - Screen-space pointer avoidance calculation

**VAT Utilities:**
- `VAT_pos_f(vatPosTex, uv2Texture, uv, frame, texW)` - Sample VAT at specific frame
- `VAT_pos(vatPosTex, uv2Texture, uv, frame, texW, frames)` - Interpolated VAT sampling

**Shader Preambles:**
```typescript
createPositionShaderPreamble()   // Standard position shader setup
createVelocityShaderPreamble()   // Standard velocity shader setup with noise
```

## Usage Example

```typescript
import { VATBehavior } from './behaviors/VATBehavior';

const behavior = new VATBehavior(
    5.0,   // lifetime
    0.5,   // upwardSpeed
    1.0,   // noiseScale
    0.2,   // noiseStrength
    1.0    // timeScale
);

// Update uniforms
behavior.uniforms.uVatPosTex.value = vatTexture;
behavior.uniforms.uLifetimeTexture.value = lifetimeTexture;
behavior.uniforms.uPointer.value.set(pointer.x, pointer.y);
```

## Extending

To create a custom behavior:

1. Import shared types and utilities
2. Extend `ParticleBehavior` from `@/packages/particle-system`
3. Use factory functions for common uniforms
4. Leverage shader utilities for common operations

```typescript
import { ParticleBehavior } from "@/packages/particle-system";
import { createCommonUniforms, CommonBehaviorUniforms } from './behaviorTypes';
import { createVelocityShaderPreamble, SHADER_UTILS } from './shaderUtils';

export class CustomBehavior extends ParticleBehavior {
    public uniforms: CommonBehaviorUniforms & {
        customUniform: { value: number };
    };

    constructor() {
        super();
        this.uniforms = {
            ...createCommonUniforms(),
            customUniform: { value: 1.0 }
        };
    }

    getVelocityShader(): string {
        return /*glsl*/ `
            ${createVelocityShaderPreamble()}
            uniform float customUniform;
            
            void main() {
                // Your custom logic here
            }
        `;
    }
}
```

## Benefits of Refactoring

1. **DRY Principle** - Common shader code extracted and reused
2. **Type Safety** - TypeScript interfaces for all uniforms
3. **Maintainability** - Shared utilities easy to update
4. **Consistency** - Same patterns across behaviors
5. **Documentation** - Clear interfaces and examples

