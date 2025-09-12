// ============================================================================
// UNIFORMS
// ============================================================================

// Texture and basic properties
uniform sampler2D uTexture;
uniform float uOpacity;

// Distortion parameters
uniform float uDistortionStrength;
uniform float uTiling;
uniform float uRadius;

// Time and interaction
uniform float uTime;
uniform vec2 uPointer;

// Stripe effect parameters
uniform vec2 uStripeFreqH;    // Horizontal stripe frequency
uniform vec2 uStripeFreqV;    // Vertical stripe frequency
uniform vec2 uStripeSpeed;    // Stripe animation speed
uniform vec2 uStripeStrength; // Stripe intensity

// Debug
uniform float debug;

// Varying
varying vec2 vUv;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Color space conversion
vec3 linearToSRGB(vec3 c) {
    return mix(1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, 12.92 * c, step(c, vec3(0.0031308)));
}

// Fractal Brownian Motion (2 octaves)
float fbm2(vec2 p, float t) {
    float f = 0.50000 * simplexNoise3d(vec3(p, t));
    p = p * 2.01;
    f += 0.25000 * simplexNoise3d(vec3(p, t));
    return f * (1.0 / 0.75) * 0.5 + 0.5;
}

// Random number generation
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Grain noise generation
float grainNoise(vec2 uv, float frequency, vec2 range) {
    return remap(random(floor(uv * frequency)), vec2(0.0, 1.0), range);
}

// Calculate gradient noise with parameters
float calculateGradNoise(vec2 uv, float frequency, float speed, float power, float offset, float amplitude) {
    return (pow(fbm2(uv * frequency, uTime * speed), power) + offset) * amplitude;
}

// ============================================================================
// DISTORTION FUNCTIONS
// ============================================================================

vec2 calculateDistortion(vec2 uv) {
    // Create tiling pattern
    vec2 ft = (fract(uv * uTiling) - 0.5);
    ft *= smoothstep(uRadius, 0., length(ft));
    
    // Generate noise for distortion
    float noise = fbm2(uv * 5.0, uTime * 0.2);
    
    // Apply distortion
    return uv + ft * uDistortionStrength * noise;
}

// ============================================================================
// STRIPE EFFECT FUNCTIONS
// ============================================================================

float calculateStripePattern(vec2 uv) {
    // Vertical stripe (background)
    float vStripeB = calculateGradNoise(
        vec2(uv.x + 28.8, 0.5), 
        uStripeFreqV.x, 
        uStripeSpeed.x, 
        10., 
        0.0, 
        uStripeStrength.x
    );
    
    // Horizontal stripe (background)
    float hStripeB = calculateGradNoise(
        vec2(0.5, uv.y), 
        uStripeFreqH.x, 
        uStripeSpeed.y, 
        5., 
        0.5, 
        uStripeStrength.y
    );
    
    // Horizontal stripe (secondary)
    float hStripeS = calculateGradNoise(
        vec2(0.5, uv.y), 
        uStripeFreqH.y, 
        uStripeSpeed.y, 
        1., 
        1., 
        uStripeStrength.y
    );
    
    return vStripeB + hStripeB * hStripeS;
}

// ============================================================================
// GRAIN EFFECT FUNCTIONS
// ============================================================================

vec3 calculateGrainEffect(vec2 uv) {
    // Base grain noise
    float gn1 = grainNoise(uv, 2000., vec2(0.8, 1.2));
    
    // Positive grain spots
    float gn3 = pow(smoothstep(0.8, 1.0, fbm2(uv * 60., uTime * 0.05)), 2.0) * 1.0;
    
    // Negative grain spots
    float gn4 = -pow(smoothstep(0.8, 1.0, fbm2(uv * 60. + 2356.8, uTime * 0.05)), 2.0) * 0.5;
    
    // Combine grain effects
    vec3 grain = vec3(gn1);
    grain += gn3;
    grain += gn4;
    
    return grain;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

void main() {
    // Calculate distorted UV coordinates
    vec2 distortedUV = calculateDistortion(vUv);
    
    // Sample texture with distortion
    vec4 tex = texture2D(uTexture, distortedUV);
    
    // Convert to sRGB color space
    vec3 baseColor = linearToSRGB(tex.rgb);
    
    // Calculate stripe pattern
    float stripe = calculateStripePattern(distortedUV);
    
    // Calculate grain effect
    vec3 grain = calculateGrainEffect(distortedUV);
    
    // Apply grain to stripe pattern
    vec3 stripeWithGrain = vec3(stripe) * grain;
    
    // Add noise modulation
    float noiseModulation = pow(
        remap(fbm2(distortedUV * 2.0, uTime * 0.1), vec2(0.0, 1.0), vec2(0.5, 1.0)), 
        5.0
    );
    
    // Apply noise modulation
    stripeWithGrain *= noiseModulation;
    
    // Final color mixing
    vec3 finalColor = mix(stripeWithGrain, baseColor, debug);
    
    // Output
    gl_FragColor = vec4(finalColor, tex.a * uOpacity);
}