import noise4D from '@/lib/r3f-gist/shaders/cginc/noise/noise4D.glsl';

// Custom Velocity Shader for Particle System
// Calculates forces and updates velocity for custom particle behavior
export const customVelocityShader = /* glsl */ `
${noise4D}
precision highp float;

uniform sampler2D uPositionsPrev;
uniform sampler2D uVelocitiesPrev;
uniform float uTimeSec;
uniform float uDeltaTime;
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
uniform vec3 uAttractPos;
uniform float uAttractStrength;

varying vec2 vUv;

int pixelIndex() {
    float y = vUv.y * float(uParticleCount);
    return int(floor(y));
}

vec4 readParticlePos(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uPositionsPrev, vec2(0.5, v));
}

vec4 readParticleVel(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uVelocitiesPrev, vec2(0.5, v));
}

// Custom force calculation
vec3 calculateCustomForces(vec3 pos, vec3 vel, float time) {
    // Calculate flow field velocity
    float t = time * uTimeScale;
    vec3 curl = curlNoise(vec4(pos * uNoiseScale + vec3(0.35), t)) * uNoiseStrength;
    vec3 attract = (uAttractPos - pos) * uAttractStrength;
    vec3 velocity = normalize(attract + curl);
    
    return velocity * uSpeed;
}

void main() {
    int idx = pixelIndex();
    
    // Read previous particle state
    vec4 posData = readParticlePos(idx);
    vec4 velData = readParticleVel(idx);
    
    vec3 pos = posData.xyz;
    vec3 vel = velData.xyz;
    float aux1 = velData.w;
    
    // Apply forces and integrate velocity
    vec3 totalForce = calculateCustomForces(pos, vel, uTimeSec);
    
    // Integrate velocity
    vel +=  totalForce * uDeltaTime;
    
    // Apply damping
    vel *= (1.0 - uDamping * uDeltaTime);
    
    // // Limit speed
    // float speed = length(vel);
    // if (speed > uMaxSpeed) {
    //     vel = normalize(vel) * uMaxSpeed;
    // }
    
    gl_FragColor = vec4(vel, aux1);
}
`;

// Custom Position Shader for Particle System
// Updates position using velocity from the velocity shader
export const customPositionShader = /* glsl */ `
precision highp float;

uniform sampler2D uPositionsPrev;
uniform sampler2D uVelocitiesPrev;
uniform float uTimeSec;
uniform float uDeltaTime;
uniform float uParticleCount;

varying vec2 vUv;

int pixelIndex() {
    float y = vUv.y * float(uParticleCount);
    return int(floor(y));
}

vec4 readParticlePos(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uPositionsPrev, vec2(0.5, v));
}

vec4 readParticleVel(int k) {
    float v = (float(k) + 0.5) / float(uParticleCount);
    return texture2D(uVelocitiesPrev, vec2(0.5, v));
}

void main() {
    int idx = pixelIndex();
    
    vec4 posData = readParticlePos(idx);
    vec4 velData = readParticleVel(idx);
    
    vec3 pos = posData.xyz;
    vec3 vel = velData.xyz;
    float aux1 = posData.w;
    
    // Update position using velocity
    pos += vel * uDeltaTime;
    
    gl_FragColor = vec4(pos, aux1);
}
`;
