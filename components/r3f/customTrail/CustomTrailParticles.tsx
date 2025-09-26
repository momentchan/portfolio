import { GPUTrailParticles } from '../../../lib/trail-gpu/GPUTrailParticles';
import { ParticleConfig, ParticleShaderParams } from '../../../lib/trail-gpu/types';
import { updateParticlesFrag } from '../../../lib/trail-gpu/shaders';

import simplexNoise3d from '../../../lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl';

const customTrailParticlesFrag = /* glsl */ `
// GPU Particle System Update Shader
// Updates particle positions using a 3D flow field based on noise
${simplexNoise3d}
precision highp float;

// Uniforms
uniform sampler2D uParticlesPrev;    // Previous particle positions (1xN texture)
uniform float uTimeSec;              // Current time in seconds
uniform float uDeltaTime;            // Time delta for integration
uniform float uSpeed;                // Particle movement speed
uniform float uNoiseScale;           // Scale factor for noise coordinates
uniform float uTimeScale;            // Time scale for animation
uniform float uParticleCount;        // Total number of particles
uniform float uNoiseStrength;        // Strength of the noise

uniform float uTest;
uniform vec3 uAttractPos;
varying vec2 vUv;

/**
 * Gets the particle index from UV coordinates
 */
int pixelIndex() {
    float y = vUv.y * float(uParticleCount);
    return int(floor(y));
}

/**
 * Reads particle data from the previous frame
 */
vec4 readParticle(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uParticlesPrev, vec2(0.5, v));
}


void main() {
    int idx = pixelIndex();
    
    // Read previous particle state
    vec4 prev = readParticle(idx);
    vec3 pos = prev.xyz;  // Position
    float aux = prev.w;   // Auxiliary data (unused in this implementation)
    
    // Calculate flow field velocity
    float t = uTimeSec * uTimeScale;
    vec3 curl = curlNoise(pos * uNoiseScale) * uNoiseStrength;
    // vec3 velocity = curl(pos * uNoiseScale, t);

    vec3 attract = (uAttractPos - pos);

    vec3 velocity = normalize( attract + curl );
    

    // Update position using Euler integration
    pos += velocity * uSpeed * uDeltaTime;
    
    // Output new particle state
    gl_FragColor = vec4(pos, aux);
}
`



/**
 * Custom Trail Particle System
 * Particles that move through a 3D noise-based flow field
 */
export class CustomTrailParticles extends GPUTrailParticles {
  constructor(
    count: number,
    config: Partial<ParticleConfig> = {},
    initialPositions?: Float32Array,
    uniforms: Partial<ParticleShaderParams> = {},
  ) {
    super(count, customTrailParticlesFrag, config, initialPositions, uniforms);
  }
}
