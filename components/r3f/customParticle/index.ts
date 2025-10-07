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
} from './configs/PositionConfigs';

export { 
    generateLifetimeTexture, 
} from './LifetimeTexture';

