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
            uInitialPositions: { value: null },
            uLifetimeTexture: { value: null }
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
uniform sampler2D uInitialPositions;
uniform sampler2D uLifetimeTexture;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // Read current particle state
    vec4 pos = texture2D(positionTex, uv);
    vec4 vel = texture2D(velocityTex, uv);
    
    // Get individual lifetime for this particle
    vec4 lifetimeData = texture2D(uLifetimeTexture, uv);
    float particleLifetime = lifetimeData.x;
    
    vec3 currentPos = pos.xyz;
    float age = pos.w; // Age stored in position.w
    
    // Update age
    age += delta;
    
    // Check if particle has exceeded its individual lifetime
    if (age >= particleLifetime) {
        // Reset particle to its initial spawn position from texture
        vec4 initialPos = texture2D(uInitialPositions, uv);
        currentPos = initialPos.xyz;
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

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // Read current particle state
    vec4 pos = texture2D(positionTex, uv);
    vec4 vel = texture2D(velocityTex, uv);
    
    // Get individual lifetime for this particle
    vec4 lifetimeData = texture2D(uLifetimeTexture, uv);
    float particleLifetime = lifetimeData.x;
    
    vec3 currentPos = pos.xyz;
    float age = pos.w; // Age stored in position.w
    vec3 currentVel = vel.xyz;
    
    // Check if particle has exceeded its individual lifetime
    if (age >= particleLifetime) {
        // Reset velocity to initial upward movement
        currentVel = vec3(0.0, uUpwardSpeed, 0.0);
    } else {
        // Add upward movement
        currentVel.y += uUpwardSpeed * delta;
        
        // Add some noise for organic movement
        float t = time * uTimeScale;
        vec3 noise = curlNoise(vec4(currentPos * uNoiseScale + vec3(0.35), t)) * uNoiseStrength;
        currentVel += noise * delta;
        
        // Apply slight damping to prevent excessive acceleration
        currentVel *= 0.98;
    }
    
    gl_FragColor = vec4(currentVel, 0.0);
}
`;
    }

    getPositionUniforms(): Record<string, any> {
        return {
            uUpwardSpeed: this.uniforms.uUpwardSpeed,
            uNoiseScale: this.uniforms.uNoiseScale,
            uNoiseStrength: this.uniforms.uNoiseStrength,
            uTimeScale: this.uniforms.uTimeScale,
            uTime: this.uniforms.uTime,
            uInitialPositions: this.uniforms.uInitialPositions,
            uLifetimeTexture: this.uniforms.uLifetimeTexture
        };
    }

    getVelocityUniforms(): Record<string, any> {
        return {
            uUpwardSpeed: this.uniforms.uUpwardSpeed,
            uNoiseScale: this.uniforms.uNoiseScale,
            uNoiseStrength: this.uniforms.uNoiseStrength,
            uTimeScale: this.uniforms.uTimeScale,
            uTime: this.uniforms.uTime,
            uLifetimeTexture: this.uniforms.uLifetimeTexture
        };
    }

    // Update methods
    updateTime(time: number) {
        this.uniforms.uTime.value = time;
    }

    setInitialPositions(initialPositionsTexture: THREE.Texture) {
        this.uniforms.uInitialPositions.value = initialPositionsTexture;
    }

    setLifetimeTexture(lifetimeTexture: THREE.Texture) {
        this.uniforms.uLifetimeTexture.value = lifetimeTexture;
    }

    updateParameters(upwardSpeed: number, noiseStrength: number) {
        this.uniforms.uUpwardSpeed.value = upwardSpeed;
        this.uniforms.uNoiseStrength.value = noiseStrength;
    }
}
