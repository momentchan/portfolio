import * as THREE from 'three';

/**
 * Common uniforms shared between behaviors
 */
export interface CommonBehaviorUniforms {
    uTime: { value: number };
    uDamping: { value: number };
    uPointer: { value: THREE.Vector2 };
    uAspect: { value: number };
    uAvoidanceStrength: { value: number };
    uAvoidanceRadius: { value: number };
    uModelViewProjectionMatrix: { value: THREE.Matrix4 };
    uInverseModelViewProjectionMatrix: { value: THREE.Matrix4 };
}

/**
 * Noise-related uniforms
 */
export interface NoiseBehaviorUniforms {
    uNoiseScale: { value: number };
    uNoiseStrength: { value: number };
    uTimeScale: { value: number };
}

/**
 * VAT-related base uniforms
 */
export interface VATBaseUniforms {
    uVatPosTex: { value: THREE.Texture | null };
    uFrames: { value: number };
    uTexW: { value: number };
    uFrame: { value: number };
    uUV2Texture: { value: THREE.Texture | null };
    uBasePosTexture: { value: THREE.Texture | null };
    uStoreDelta: { value: number };
}

/**
 * Complete VAT behavior uniforms
 */
export interface VATBehaviorUniforms extends 
    CommonBehaviorUniforms, 
    NoiseBehaviorUniforms, 
    VATBaseUniforms {
    uUpwardSpeed: { value: number };
    uLifetimeTexture: { value: THREE.Texture | null };
    uAnimateRate: { value: number };
    modelMatrix: { value: THREE.Matrix4 };
}

/**
 * Flow field-related uniforms
 */
export interface FlowFieldBehaviorUniforms extends 
    CommonBehaviorUniforms, 
    NoiseBehaviorUniforms {
    uSpeed: { value: number };
    uAttractStrength: { value: number };
    uGravity: { value: THREE.Vector3 };
    uMaxSpeed: { value: number };
    uSpeedMultiplier: { value: number };
}

/**
 * Create common behavior uniforms
 */
export function createCommonUniforms(): CommonBehaviorUniforms {
    return {
        uTime: { value: 0.0 },
        uDamping: { value: 0.98 },
        uPointer: { value: new THREE.Vector2(0.0, 0.0) },
        uAspect: { value: 1.0 },
        uAvoidanceStrength: { value: 0.0 },
        uAvoidanceRadius: { value: 0.0 },
        uModelViewProjectionMatrix: { value: new THREE.Matrix4() },
        uInverseModelViewProjectionMatrix: { value: new THREE.Matrix4() },
    };
}

