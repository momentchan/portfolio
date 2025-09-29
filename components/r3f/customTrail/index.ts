// Custom Trail System
// Organized shader files and hooks for custom trail system

// Particle shaders
export { customVelocityShader, customPositionShader } from './particles';

// Ribbon shaders
export { customRibbonQuadVertexShader, customRibbonQuadFragmentShader, customRibbonTubeVertexShader, customRibbonTubeFragmentShader } from './ribbon';

// Hooks
export { useTrailSystem, useParticleSystem, useRibbonSystem } from './hooks';

// Main component
export { CustomTrail } from './CustomTrail';
