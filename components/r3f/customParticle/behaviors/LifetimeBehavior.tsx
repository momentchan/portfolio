import { ParticleBehavior, ShaderBuilder, ShaderTemplates } from "@/lib/particle-system";
import noise4D from '../../../../lib/r3f-gist/shader/cginc/noise/noise4D.glsl';
import * as THREE from 'three';

// Enhanced Lifetime Behavior (refactored from LifetimeBehavior)
export class LifetimeBehavior extends ParticleBehavior {
    public uniforms: Record<string, any>;

    constructor(
        private lifetime: number = 5.0,
        private upwardSpeed: number = 0.5,
        private noiseScale: number = 1.0,
        private noiseStrength: number = 0.2,
        private timeScale: number = 1.0
    ) {
        super();

        this.uniforms = {
            uUpwardSpeed: { value: this.upwardSpeed },
            uNoiseScale: { value: this.noiseScale },
            uNoiseStrength: { value: this.noiseStrength },
            uTimeScale: { value: this.timeScale },
            uTime: { value: 0.0 },
            uLifetimeTexture: { value: null },
            uVatPosTex: { value: null },
            uFrames: { value: 0 },
            uTexW: { value: 0 },
            uFrame: { value: 0 },
            uUV2Texture: { value: null },
            uBasePosTexture: { value: null },
            uStoreDelta: { value: 0 },
            uDamping: { value: 0.98 },
            uAnimateRate: { value: 0.0 },
            uAspect: { value: 0.0 },
            uPointer: { value: new THREE.Vector2(0.0, 0.0) },
            uModelViewProjectionMatrix: { value: new THREE.Matrix4() },
            uInverseModelViewProjectionMatrix: { value: new THREE.Matrix4() },
            uAvoidanceStrength: { value: 0.0 },
            uAvoidanceRadius: { value: 0.0 },
            modelMatrix: { value: new THREE.Matrix4() },
        };
    }

    getName(): string {
        return 'Lifetime Reset';
    }

    getPositionShader(): string {
        return /*glsl*/ `
    precision highp float;

    uniform float time;
    uniform float delta;
    uniform float uUpwardSpeed;
    uniform float uNoiseScale;
    uniform float uNoiseStrength;
    uniform float uTimeScale;
    uniform sampler2D uLifetimeTexture;
    uniform sampler2D uVatPosTex;
    uniform sampler2D uUV2Texture;
    uniform sampler2D uBasePosTexture;
    uniform float uFrame;
    uniform float uTexW;
    uniform float uFrames;
    uniform int uStoreDelta;
    
    vec3 VAT_pos_f(vec2 uv, float f) {
        float fx = (f + 0.5) / uTexW;
        
        // Get UV2 coordinates from the UV2 texture
        vec4 uv2Data = texture2D(uUV2Texture, uv);
        vec2 uv2 = uv2Data.xy;
        
        // Use UV2 coordinates for VAT sampling with frame offset
        vec2 vatUv = vec2(uv2.x + fx, uv2.y);
        return texture2D(uVatPosTex, vatUv).xyz;
      }
      
      vec3 VAT_pos(vec2 uv, float f) {
        float f0 = floor(f);
        float f1 = min(f0 + 1.0, uFrames - 1.0);
        vec3 p0 = VAT_pos_f(uv, f0);
        vec3 p1 = VAT_pos_f(uv, f1);
        return mix(p0, p1, fract(f));
      }

      
    void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        
        // Read current particle state
        vec4 pos = texture2D(positionTex, uv);
        vec4 vel = texture2D(velocityTex, uv);
        
        // Get individual lifetime for this particle
        float lifetime = texture2D(uLifetimeTexture, uv).x;
        
        vec3 currentPos = pos.xyz;
        float age = pos.w; // Age stored in position.w
        
        // Update age
        age += delta;
        
        // Check if particle has exceeded its individual lifetime
        if (age >= lifetime) {
            vec3 vatPos = VAT_pos(uv, uFrame);
            vec3 basePos = texture2D(uBasePosTexture, uv).xyz;
            vatPos = (uStoreDelta == 1) ? (basePos + vatPos) : vatPos;
            currentPos = vatPos;
            age = 0.0; // Reset age
        } else {
            // Apply movement based on velocity
            currentPos += vel.xyz * delta;
        }
        
        gl_FragColor = vec4(currentPos, age);
    }
    `;
    }

    getVelocityShader(): string {
        return /*glsl*/ `
        ${noise4D}
        precision highp float;

        uniform float time;
        uniform float delta;
        uniform float uUpwardSpeed;
        uniform float uNoiseScale;
        uniform float uNoiseStrength;
        uniform float uTimeScale;
        uniform sampler2D uLifetimeTexture;
        uniform sampler2D uVatPosTex;
        uniform float uDamping;
        uniform float uAnimateRate;
        uniform float uAvoidanceStrength;
        uniform mat4 uModelViewProjectionMatrix;
        uniform mat4 uInverseModelViewProjectionMatrix;
        uniform float uAvoidanceRadius;
        uniform vec2 uPointer;
        uniform float uAspect;

        vec2 worldToNDC(vec3 worldPos) {
            vec4 clipPos = uModelViewProjectionMatrix * vec4(worldPos, 1.0);
            vec3 ndc = clipPos.xyz / clipPos.w;
            return ndc.xy;
        }

        vec3 ndcToWorld(vec2 ndc) {
            vec4 worldPos = uInverseModelViewProjectionMatrix * vec4(ndc, 0.0, 0.0);
            return worldPos.xyz;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            
            // Read current particle state
            vec4 pos = texture2D(positionTex, uv);
            vec4 vel = texture2D(velocityTex, uv);
            
            // Get individual lifetime for this particle
            float lifetime = texture2D(uLifetimeTexture, uv).x;
            
            vec3 currentPos = pos.xyz;
            float age = pos.w; // Age stored in position.w
            vec3 velocity = vel.xyz;
            
            // Check if particle has exceeded its individual lifetime
            if (age >= lifetime) {
                velocity = vec3(0.0, uUpwardSpeed, 0.0);
            } else {

                vec3 acc = vec3(0.0, 0.0, 0.0);
                float age_normalized = age / lifetime;

                float boost = 1.0 + smoothstep(0.0, 0.4, uAnimateRate) * smoothstep(0.4, 0.2, age_normalized) * 2.0;


                vec3 up = vec3(0.0, uUpwardSpeed, 0.0);
                float t = time * uTimeScale;
                vec3 noise = curlNoise(vec4(currentPos * uNoiseScale + vec3(0.35), t)) * uNoiseStrength;

                // Avoid pointer
                vec2 ndc = worldToNDC(currentPos);
                float dist = length((ndc - uPointer) * vec2(uAspect, 1.0));
                vec2 ndcDir = normalize(ndc - uPointer);
                vec3 worldDir = ndcToWorld(ndcDir);
                float multiplier = smoothstep(uAvoidanceRadius, 0.0, dist);
                vec3 avoidance = worldDir * multiplier * uAvoidanceStrength;

                acc = (up + noise) * boost + avoidance;
                // Add upward movement
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
