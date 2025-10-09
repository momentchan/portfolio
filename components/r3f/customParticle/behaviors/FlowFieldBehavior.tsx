import { ParticleBehavior } from "@/lib/particle-system";
import * as THREE from 'three';
import { FlowFieldBehaviorUniforms, createCommonUniforms } from './behaviorTypes';
import { SHADER_UTILS } from './shaderUtils';
import noise4D from '@/lib/r3f-gist/shader/cginc/noise/noise4D.glsl';

/**
 * Flow field behavior with curl noise and pointer interaction
 */
export class FlowFieldBehavior extends ParticleBehavior {
    public uniforms: FlowFieldBehaviorUniforms;

    constructor(
        private speed: number = 0.2,
        private noiseScale: number = 1,
        private timeScale: number = 0.1,
        private noiseStrength: number = 2,
        private attractStrength: number = 1.5,
        private avoidanceStrength: number = 0.5,
        private avoidanceRadius: number = 100.0
    ) {
        super();

        this.uniforms = {
            ...createCommonUniforms(),
            uNoiseScale: { value: this.noiseScale },
            uNoiseStrength: { value: this.noiseStrength },
            uTimeScale: { value: this.timeScale },
            uSpeed: { value: this.speed },
            uAttractStrength: { value: this.attractStrength },
            uGravity: { value: new THREE.Vector3(0, -0.1, 0) },
            uMaxSpeed: { value: 2.0 },
        };

        // Override common uniforms with constructor values
        this.uniforms.uAvoidanceStrength.value = this.avoidanceStrength;
        this.uniforms.uAvoidanceRadius.value = this.avoidanceRadius;
    }

    getName(): string {
        return 'Flow Field';
    }

    getPositionShader(): string {
        return /*glsl*/ `
            precision highp float;

            uniform float time;
            uniform float delta;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                
                vec3 posXYZ = pos.xyz;
                float aux1 = pos.w;
                
                posXYZ += vel.xyz * delta;
                
                gl_FragColor = vec4(posXYZ, aux1);
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
            
            uniform vec3 uGravity;
            uniform float uDamping;
            uniform float uMaxSpeed;
            uniform float uSpeed;
            uniform float uNoiseScale;
            uniform float uTimeScale;
            uniform float uNoiseStrength;
            uniform float uAttractStrength;
            uniform vec2 uPointer;
            uniform float uAspect;
            uniform float uAvoidanceStrength;
            uniform float uAvoidanceRadius;
            uniform float uPointerSpeedMultiplier;
            uniform mat4 uModelViewProjectionMatrix;
            uniform mat4 uInverseModelViewProjectionMatrix;

            vec4 calculateCustomForces(vec3 pos, vec3 vel, float time) {
                float t = time * uTimeScale;
                vec3 curl = curlNoise(vec4(pos * uNoiseScale + vec3(0.35), t)) * uNoiseStrength;
                vec3 attract = -pos * uAttractStrength;
                
                // Pointer avoidance
                vec3 avoidance = calculatePointerAvoidance(
                    pos,
                    uPointer,
                    uAspect,
                    uAvoidanceRadius,
                    uAvoidanceStrength * uPointerSpeedMultiplier,
                    uModelViewProjectionMatrix,
                    uInverseModelViewProjectionMatrix
                );
                
                vec3 velocity = safeNormalize(curl + attract);
                
                return vec4(velocity * uSpeed + avoidance, length(avoidance) * uPointerSpeedMultiplier);
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;
                
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                
                vec3 posXYZ = pos.xyz;
                vec3 velXYZ = vel.xyz;
                float aux1 = vel.w;

                vec4 acc = calculateCustomForces(posXYZ, velXYZ, time);

                aux1 += (acc.w * 10.0 - 1.0) * delta;
                aux1 = clamp(aux1, 0.0, 1.0);
                
                velXYZ += acc.xyz * delta;
                velXYZ *= (1.0 - uDamping * delta);
                
                gl_FragColor = vec4(velXYZ, aux1);
            }
        `;
    }

    getVelocityUniforms(): Record<string, any> {
        return this.uniforms;
    }

    getPositionUniforms(): Record<string, any> {
        return {};
    }
}
