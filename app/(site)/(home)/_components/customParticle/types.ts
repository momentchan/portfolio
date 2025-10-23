import * as THREE from 'three';

/**
 * Common particle system props
 */
export interface BaseParticleSystemProps {
    particleCount?: number;
}

/**
 * VAT-specific particle system props
 */
export interface VATParticleSystemProps extends BaseParticleSystemProps {
    frame: number;
    posTex: THREE.Texture;
    meta: VATMetadata;
    geometry?: THREE.BufferGeometry;
    storeDelta?: number;
    animateRate?: number;
    globalRatio?: number;
}

/**
 * VAT metadata structure
 */
export interface VATMetadata {
    vertexCount: number;
    frameCount: number;
    texWidth: number;
    texHeight: number;
    frameStride: number;
}

/**
 * Material controls interface
 */
export interface ParticleMaterialControls {
    glowColor: string;
    glowIntensity: number;
    sizeMultiplier: number;
    minSize: number;
}

/**
 * VAT-specific material uniforms
 */
export interface VATMaterialUniforms {
    [uniform: string]: THREE.IUniform<any>;
    positionTex: { value: THREE.Texture | null };
    velocityTex: { value: THREE.Texture | null };
    time: { value: number };
    sizeMultiplier: { value: number };
    minSize: { value: number };
    opacity: { value: number };
    glowColor: { value: THREE.Color };
    glowIntensity: { value: number };
    hueShift: { value: number };
    uLifetimeTexture: { value: THREE.Texture | null };
    uAnimateRate: { value: number };
    uFrameNormalized: { value: number };
    uGlobalRatio: { value: number };
}

/**
 * FlowField-specific material uniforms
 */
export interface FlowFieldMaterialUniforms {
    [uniform: string]: THREE.IUniform<any>;
    positionTex: { value: THREE.Texture | null };
    velocityTex: { value: THREE.Texture | null };
    time: { value: number };
    sizeMultiplier: { value: number };
    minSize: { value: number };
    opacity: { value: number };
    glowColor: { value: THREE.Color };
    glowIntensity: { value: number };
    hueShift: { value: number };
    uPointer: { value: THREE.Vector2 };
    uAspect: { value: number };
    uModelViewProjectionMatrix: { value: THREE.Matrix4 };
    uAvoidanceRadius: { value: number };
    uSpeedMultiplier: { value: number };
}

