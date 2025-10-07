// Main exports for the Custom Particle System

// Particle Systems
export { default as FlowFieldParticleSystem } from './FlowFieldParticleSystem';
export { default as LifetimeParticleSystem } from './LifetimeParticleSystem';

// Behaviors
export { FlowFieldBehavior } from './behaviors/FlowFieldBehavior';
export { LifetimeBehavior } from './behaviors/LifetimeBehavior';

// Position Configurations
export { 
    RandomSpherePositionConfig, 
    SphereSurfacePositionConfig, 
    GridPositionConfig, 
    InitialPositionConfig 
} from './configs/PositionConfigs';

// Shared Utilities
export { MaterialFactory } from './shared/MaterialFactory';
export { useParticleSystemBase } from './shared/ParticleSystemBase';

// Texture Utilities
export { 
    generateSpherePositionTexture, 
    generateSphereSurfaceTexture 
} from './SpherePositionTexture';

export { 
    generateLifetimeTexture, 
    generateUniformLifetimeTexture, 
    generateGradientLifetimeTexture 
} from './LifetimeTexture';

// Types
export type { MaterialUniforms } from './shared/MaterialFactory';
export type { ParticleSystemConfig, ParticleSystemBaseProps } from './shared/ParticleSystemBase';
