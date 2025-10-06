import { ParticleBehavior, ShaderBuilder, ShaderTemplates } from "@/lib/particle-system";
import noise4D from '../../../lib/r3f-gist/shader/cginc/noise/noise4D.glsl';
import * as THREE from 'three';

// Custom Velocity Shader for Particle System
// Calculates forces and updates velocity for custom particle behavior
const customVelocityShader = /* glsl */ `
${noise4D}
precision highp float;

uniform float time;
uniform float delta;

// Default physics uniforms
uniform vec3 uGravity;
uniform float uDamping;
uniform float uMaxSpeed;

// Custom uniforms
uniform float uSpeed;
uniform float uNoiseScale;
uniform float uTimeScale;
uniform float uNoiseStrength;
uniform float uAttractStrength;
uniform vec2 uPointer;
uniform float uAspect;
uniform float uAvoidanceStrength;
uniform float uAvoidanceRadius;
uniform float uSpeedMultiplier;

uniform mat4 uModelViewProjectionMatrix;
uniform mat4 uInverseModelViewProjectionMatrix;

vec2 worldToNDC(vec3 worldPos) {
    // Use the proper model-view-projection matrix
    vec4 clipPos = uModelViewProjectionMatrix * vec4(worldPos, 1.0);
    vec3 ndc = clipPos.xyz / clipPos.w;
    return ndc.xy;
}
vec3 ndcToWorld(vec2 ndc) {
    vec4 worldPos = uInverseModelViewProjectionMatrix * vec4(ndc, 0.0, 0.0);
    return worldPos.xyz;
}

vec3 safeNormalize(vec3 v) {
    float length = max(length(v), 1e-6);
    return v / length;
}
// Custom force calculation
vec4 calculateCustomForces(vec3 pos, vec3 vel, float time) {
    float t = time * uTimeScale;
    vec3 curl = curlNoise(vec4(pos * uNoiseScale + vec3(0.35), t)) * uNoiseStrength;
    vec3 attract = -pos * uAttractStrength;
    

    // avoid
    vec2 ndc = worldToNDC(pos);
    float dist = length((ndc - uPointer) * vec2(uAspect, 1.0));
    vec2 ndcDir = normalize(ndc - uPointer);
    vec3 worldDir = ndcToWorld(ndcDir);
    float multiplier = smoothstep(uAvoidanceRadius, 0.0, dist);
    vec3 avoidance = worldDir * multiplier * uAvoidanceStrength * uSpeedMultiplier;

    vec3 velocity = safeNormalize(curl + attract);
    
    return vec4(velocity * uSpeed + avoidance, multiplier * uSpeedMultiplier);
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // Read previous particle state
    vec4 pos = texture2D(positionTex, uv);
    vec4 vel = texture2D(velocityTex, uv);
    
    vec3 posXYZ = pos.xyz;
    vec3 velXYZ = vel.xyz;
    float aux1 = vel.w;

    // Apply forces and integrate velocity
    vec4 acc = calculateCustomForces(posXYZ, velXYZ, time);

    aux1 += (acc.w * 10. - 1.0) * delta;
    aux1 = clamp(aux1, 0.0, 1.0);
    
    velXYZ += acc.xyz * delta;
    
    // Apply damping
    velXYZ *= (1.0 - uDamping * delta);
    
    gl_FragColor = vec4(velXYZ, aux1);
}
`;

// Custom Position Shader for Particle System
// Updates position using velocity from the velocity shader
const customPositionShader = /* glsl */ `
precision highp float;

uniform float time;
uniform float delta;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    vec4 pos = texture2D(positionTex, uv);
    vec4 vel = texture2D(velocityTex, uv);
    
    vec3 posXYZ = pos.xyz;
    vec3 velXYZ = vel.xyz;
    float aux1 = pos.w;
    
    posXYZ += velXYZ * delta;
    
    gl_FragColor = vec4(posXYZ, aux1);
}
`;

export default class CustomBehavior extends ParticleBehavior {
    public uniforms: Record<string, any>;

    constructor(
        private speed: number = 0.2,
        private noiseScale: number = 1,
        private timeScale: number = 0.1,
        private noiseStrength: number = 2,
        private attractStrength: number = 1.5,
        private damping: number = 0.98,
        private avoidanceStrength: number = 0.5,
        private avoidanceRadius: number = 100.0
    ) {
        super();

        // Create uniforms once and store them
        this.uniforms = {
            uSpeed: { value: this.speed },
            uNoiseScale: { value: this.noiseScale },
            uTimeScale: { value: this.timeScale },
            uNoiseStrength: { value: this.noiseStrength },
            uAttractStrength: { value: this.attractStrength },
            uGravity: { value: new THREE.Vector3(0, -0.1, 0) },
            uDamping: { value: this.damping },
            uMaxSpeed: { value: 2.0 },
            uSpeedMultiplier: { value: 1.0 },
            uPointer: { value: new THREE.Vector2(0, 0) },
            uAspect: { value: 1 },
            uAvoidanceStrength: { value: this.avoidanceStrength },
            uAvoidanceRadius: { value: this.avoidanceRadius },
            uModelViewProjectionMatrix: { value: new THREE.Matrix4() },
            uInverseModelViewProjectionMatrix: { value: new THREE.Matrix4() }
        };
    }

    getName(): string {
        return 'Custom Flow Field';
    }

    getPositionShader(): string {
        return new ShaderBuilder()
            .setPositionShader(customPositionShader)
            .build().positionShader;
    }

    getVelocityShader(): string {
        return customVelocityShader;
    }

    getVelocityUniforms(): Record<string, any> {
        return this.uniforms;
    }

}
