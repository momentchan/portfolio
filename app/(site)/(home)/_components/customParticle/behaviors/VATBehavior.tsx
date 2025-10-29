import { ParticleBehavior } from "@/lib/particle-system";
import * as THREE from 'three';
import { VATBehaviorUniforms, createCommonUniforms } from './behaviorTypes';
import { VAT_SAMPLING, SHADER_UTILS } from './shaderUtils';
import noise4D from '@/lib/r3f-gist/shaders/cginc/noise/noise4D.glsl';

/**
 * VAT behavior with lifetime management, noise-based movement, and mouse avoidance
 */
export class VATBehavior extends ParticleBehavior {
    public uniforms: VATBehaviorUniforms;

    constructor(
        private lifetime: number = 5.0,
        private upwardSpeed: number = 0.005,
        private noiseScale: number = 100.0,
        private noiseStrength: number = 0.01,
        private timeScale: number = 0.1
    ) {
        super();

        this.uniforms = {
            ...createCommonUniforms(),
            uNoiseScale: { value: this.noiseScale },
            uNoiseStrength: { value: this.noiseStrength },
            uTimeScale: { value: this.timeScale },
            uUpwardSpeed: { value: this.upwardSpeed },
            uGlobalRatio: { value: 0.0 },
            uLifetimeTexture: { value: null },
            uVatPosTex: { value: null },
            uFrames: { value: 0 },
            uTexW: { value: 0 },
            uFrame: { value: 0 },
            uUV2Texture: { value: null },
            uBasePosTexture: { value: null },
            uStoreDelta: { value: 0 },
            uAnimateRate: { value: 0.0 },
            modelMatrix: { value: new THREE.Matrix4() },
        };
    }

    getName(): string {
        return 'VAT Behavior';
    }

    getPositionShader(): string {
        return /*glsl*/ `
            precision highp float;

            uniform float time;
            uniform float delta;
            
            ${VAT_SAMPLING}
            
            uniform sampler2D uLifetimeTexture;
            uniform sampler2D uVatPosTex;
            uniform sampler2D uUV2Texture;
            uniform sampler2D uBasePosTexture;
            uniform float uFrame;
            uniform float uTexW;
            uniform float uFrames;
            uniform int uStoreDelta;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                
                float lifetime = texture2D(uLifetimeTexture, uv).x;
                
                vec3 currentPos = pos.xyz;
                float age = pos.w;
                
                age += delta;
                
                // Reset particle if it exceeded its lifetime
                if (age >= lifetime) {
                    vec3 vatPos = VAT_pos(uVatPosTex, uUV2Texture, uv, uFrame, uTexW, uFrames);
                    vec3 basePos = texture2D(uBasePosTexture, uv).xyz;
                    vatPos = (uStoreDelta == 1) ? (basePos + vatPos) : vatPos;
                    currentPos = vatPos;
                    age = 0.0;
                } else {
                    currentPos += vel.xyz * delta;
                }
                
                gl_FragColor = vec4(currentPos, age);
            }
        `;
    }

    getVelocityShader(): string {
        return /*glsl*/ `
            ${noise4D}
            ${SHADER_UTILS}
            precision highp float;

            uniform float time;
            uniform float delta;
            
            uniform float uUpwardSpeed;
            uniform float uNoiseScale;
            uniform float uNoiseStrength;
            uniform float uTimeScale;
            uniform sampler2D uLifetimeTexture;
            uniform float uDamping;
            uniform float uAnimateRate;
            uniform float uAvoidanceStrength;
            uniform float uPointerSpeedMultiplier;
            uniform mat4 uModelViewProjectionMatrix;
            uniform mat4 uInverseModelViewProjectionMatrix;
            uniform float uAvoidanceRadius;
            uniform vec2 uPointer;
            uniform float uAspect;
            uniform float uGlobalRatio;

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                
                float lifetime = texture2D(uLifetimeTexture, uv).x;
                
                vec3 currentPos = pos.xyz;
                float age = pos.w;
                vec3 velocity = vel.xyz;
                
                // Reset velocity on respawn
                if (age >= lifetime) {
                    velocity = vec3(0.0, uUpwardSpeed, 0.0);
                } else {
                    float ageNormalized = age / lifetime;
                    float boost = 1.0 + smoothstep(0.0, 0.4, uAnimateRate) * 
                                       smoothstep(0.4, 0.2, ageNormalized) * 2.0;
                    boost *= smoothstep(0.0, 0.1, uGlobalRatio);

                    // Upward movement
                    vec3 up = vec3(0.0, uUpwardSpeed, 0.0);
                    
                    // Curl noise
                    float t = time * uTimeScale;
                    vec3 noise = curlNoise(vec4(currentPos * uNoiseScale + vec3(0.35), t)) * uNoiseStrength;

                    // Pointer avoidance
                    vec3 avoidance = calculatePointerAvoidance(
                        currentPos,
                        uPointer,
                        uAspect,
                        uAvoidanceRadius,
                        uAvoidanceStrength,
                        uModelViewProjectionMatrix,
                        uInverseModelViewProjectionMatrix
                    );

                    vec3 acc = (up + noise) * boost + avoidance * uPointerSpeedMultiplier;
                    velocity += acc * delta;
                    velocity *= (1.0 - uDamping * delta);
                }
                
                gl_FragColor = vec4(velocity, 0.0);
            }
        `;
    }

    getPositionUniforms(): Record<string, any> {
        return this.uniforms;
    }

    getVelocityUniforms(): Record<string, any> {
        return this.uniforms;
    }
}

