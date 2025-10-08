import * as THREE from 'three';
import { createParticleVertexShader, createParticleFragmentShader } from '../shaders/particleShaders';
import { VATMaterialUniforms, FlowFieldMaterialUniforms } from '../types';

/**
 * Create custom material for VAT particle system
 */
export function createVATParticleMaterial(): THREE.ShaderMaterial {
    const uniforms: VATMaterialUniforms = {
        positionTex: { value: null },
        velocityTex: { value: null },
        time: { value: 0.0 },
        sizeMultiplier: { value: 1.0 },
        minSize: { value: 1.0 },
        opacity: { value: 0 },
        glowColor: { value: new THREE.Color('#ffffff') },
        glowIntensity: { value: 0.5 },
        hueShift: { value: 0.0 },
        uLifetimeTexture: { value: null },
        uAnimateRate: { value: 0.0 },
        uFrameNormalized: { value: 0.0 },
        uGlobalRatio: { value: 0.0 },
    };

    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: createParticleVertexShader('vat'),
        fragmentShader: createParticleFragmentShader('vat'),
        transparent: true,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
    });
}

/**
 * Create custom material for FlowField particle system
 */
export function createFlowFieldParticleMaterial(): THREE.ShaderMaterial {
    const uniforms: FlowFieldMaterialUniforms = {
        positionTex: { value: null },
        velocityTex: { value: null },
        time: { value: 0.0 },
        sizeMultiplier: { value: 1.0 },
        minSize: { value: 1.0 },
        opacity: { value: 0 },
        glowColor: { value: new THREE.Color('#ffffff') },
        glowIntensity: { value: 0.5 },
        hueShift: { value: 0.0 },
        uPointer: { value: new THREE.Vector2(-1000, -1000) },
        uAspect: { value: 1 },
        uModelViewProjectionMatrix: { value: new THREE.Matrix4() },
        uAvoidanceRadius: { value: 0.0 },
        uSpeedMultiplier: { value: 0.0 },
    };

    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader: createParticleVertexShader('flowField'),
        fragmentShader: createParticleFragmentShader('flowField'),
        transparent: true,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
    });
}

/**
 * Update common material uniforms (shared between particle systems)
 */
export function updateCommonMaterialUniforms(
    material: THREE.ShaderMaterial,
    params: {
        time: number;
        opacity: number;
        glowColor: THREE.Color;
        glowIntensity: number;
        sizeMultiplier: number;
        minSize: number;
        hueShift: number;
        positionTex?: THREE.Texture | null;
        velocityTex?: THREE.Texture | null;
    }
): void {
    const { uniforms } = material;
    
    if (params.positionTex && uniforms.positionTex.value !== params.positionTex) {
        uniforms.positionTex.value = params.positionTex;
    }
    
    if (params.velocityTex && uniforms.velocityTex.value !== params.velocityTex) {
        uniforms.velocityTex.value = params.velocityTex;
    }
    
    uniforms.time.value = params.time;
    uniforms.opacity.value = params.opacity;
    uniforms.glowColor.value = params.glowColor;
    uniforms.glowIntensity.value = params.glowIntensity;
    uniforms.sizeMultiplier.value = params.sizeMultiplier;
    uniforms.minSize.value = params.minSize;
    uniforms.hueShift.value = params.hueShift;
}

