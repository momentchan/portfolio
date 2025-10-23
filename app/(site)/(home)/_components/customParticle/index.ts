// Main exports for the Custom Particle System

// Particle Systems
export { default as FlowFieldParticleSystem } from './FlowFieldParticleSystem';
export { default as VATParticleSystem } from './VATParticleSystem';

// Behaviors
export { FlowFieldBehavior } from './behaviors/FlowFieldBehavior';
export { VATBehavior } from './behaviors/VATBehavior';

export type {
    CommonBehaviorUniforms,
    NoiseBehaviorUniforms,
    VATBaseUniforms,
    VATBehaviorUniforms,
    FlowFieldBehaviorUniforms,
} from './behaviors/behaviorTypes';

// Position Configurations
export { 
    RandomSpherePositionConfig, 
} from './configs/PositionConfigs';

// Utilities
export { 
    generateLifetimeTexture, 
} from './LifetimeTexture';

export {
    generateRandomVertexIds,
    generateBasePosTexture,
    generateUV2Texture,
} from './utils/textureUtils';

export {
    calculateMVPMatrices,
    getModelMatrix,
} from './utils/matrixUtils';

// Materials
export {
    createVATParticleMaterial,
    createFlowFieldParticleMaterial,
    updateCommonMaterialUniforms,
} from './materials/particleMaterial';

// Shaders
export {
    createParticleVertexShader,
    createParticleFragmentShader,
} from './shaders/particleShaders';
export type { ParticleSystemType } from './shaders/particleShaders';

// Hooks
export { useParticleAnimation } from './hooks/useParticleAnimation';

// Types
export type {
    BaseParticleSystemProps,
    VATParticleSystemProps,
    VATMetadata,
    ParticleMaterialControls,
    VATMaterialUniforms,
    FlowFieldMaterialUniforms,
} from './types';
