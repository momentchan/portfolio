import { ParticleBehavior, ShaderBuilder, ShaderTemplates } from "@/lib/particle-system";
import noise4D from '../../../../lib/r3f-gist/shader/cginc/noise/noise4D.glsl';
import * as THREE from 'three';

// Custom Velocity Shader for Particle System
// Calculates forces and updates velocity for custom particle behavior
const customVelocityShader = /* glsl */ `
${noise4D}
precision highp float;

uniform float time;
uniform float delta;
uniform float uParticleCount;

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

// Custom force calculation
vec3 calculateCustomForces(vec3 pos, vec3 vel, float time) {
    // Calculate flow field velocity
    float t = time * uTimeScale;
    vec3 curl = curlNoise(vec4(pos * uNoiseScale + vec3(0.35), t)) * uNoiseStrength;

    vec3 centerAttract =  - pos * uAttractStrength;
    vec3 velocity = normalize(centerAttract + curl);

    
    return velocity * uSpeed;
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
    vec3 totalForce = calculateCustomForces(posXYZ, velXYZ, time);
    
    // Integrate velocity
    velXYZ +=  totalForce * delta;
    
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
uniform float uParticleCount;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    vec4 pos = texture2D(positionTex, uv);
    vec4 vel = texture2D(velocityTex, uv);
    
    vec3 posXYZ = pos.xyz;
    vec3 velXYZ = vel.xyz;
    float aux1 = pos.w;
    
    // Update position using velocity
    posXYZ += velXYZ * delta;
    
    gl_FragColor = vec4(posXYZ, aux1);
}
`;

export default class CustomBehavior extends ParticleBehavior {
    constructor(
        private speed: number = 0.2,
        private noiseScale: number = 1,
        private timeScale: number = 0.1,
        private noiseStrength: number = 2,
        private attractStrength: number = 1.5,
        private damping: number = 0.98
    ) {
        super();
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
        return {
            uSpeed: { value: this.speed },
            uNoiseScale: { value: this.noiseScale },
            uTimeScale: { value: this.timeScale },
            uNoiseStrength: { value: this.noiseStrength },
            uAttractStrength: { value: this.attractStrength },
            uGravity: { value: new THREE.Vector3(0, -0.1, 0) },
            uDamping: { value: this.damping },
            uMaxSpeed: { value: 2.0 }
        };
    }
}
