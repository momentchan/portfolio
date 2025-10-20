// ============================================================================
// UNIFORMS
// ============================================================================

// Texture and basic properties
uniform sampler2D uTexture;
uniform sampler2D uTraceTexture;
uniform float uTraceDistortion;
uniform float uOpacity;

// Distortion parameters
uniform float uDistortionStrength;
uniform float uDistortionNoise;
uniform float uTiling;
uniform float uRadius;

// Time and interaction
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerSpeed;
uniform float uAspect;
uniform float uOffset;
uniform vec2 uResolution;
uniform float uMouseOn;

// Stripe effect parameters
uniform vec2 uStripeFreqH;    // Horizontal stripe frequency
uniform vec2 uStripeFreqV;    // Vertical stripe frequency
uniform vec2 uStripeSpeed;    // Stripe animation speed
uniform vec2 uStripeStrength; // Stripe intensity

// Varying
varying vec2 vUv;

// ============================================================================
// CONSTANTS
// ============================================================================

#define MAX_STEPS 100
#define MAX_DIST 100.0
#define SURF_DIST 0.01

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

// Calculate gradient using central difference method
vec3 calculateGradient(sampler2D tex, vec2 uv) {
  vec2 texelSize = 1.0 / uResolution;
  float distortion = (fbm2(uv * 2.0, 0.1 * uTime) - 0.5) * 0.5;

  // Sample neighboring pixels for gradient calculation using .g channel
  float gx = texture2D(tex, uv + vec2(texelSize.x, 0.0) + distortion).g -
    texture2D(tex, uv - vec2(texelSize.x, 0.0) + distortion).g;
  float gy = texture2D(tex, uv + vec2(0.0, texelSize.y) + distortion).g -
    texture2D(tex, uv - vec2(0.0, texelSize.y) + distortion).g;

  // Calculate gradient magnitude
  float gradientMagnitude = sqrt(gx * gx + gy * gy);

  // Return gradient as vec3: (gx, gy, magnitude)
  return vec3(gx, gy, gradientMagnitude);
}

// Calculate gradient noise with parameters
float calculateGradNoise(vec2 uv, float frequency, float speed, float power, float offset, float amplitude) {
  return (pow(fbm2(uv * frequency, uTime * speed), power) + offset) * amplitude;
}

// Apply pointer speed influence to a value
float applyPointerSpeed(float baseValue, float speedInfluence) {
  return baseValue * (1.0 + uPointerSpeed * speedInfluence);
}

// ============================================================================
// DISTORTION FUNCTIONS
// ============================================================================

vec2 calculateDistortion(vec2 uv) {
    // Create tiling pattern
  vec2 ft = (fract(uv * uTiling) - 0.5) * vec2(uAspect, 1.0);
  ft *= smoothstep(uRadius, 0.0, length(ft));

    // Generate noise for distortion
  float noise = fbm2(uv * 5.0, uTime * 0.2) * uDistortionNoise;

    // Apply grid-based distortion
  float rep = 20.0;
  vec2 aspectCorrectedUV = uv * vec2(uAspect, 1.0);
  vec2 fv = (floor(aspectCorrectedUV * rep) + 0.5) / rep;
  fv = fv / vec2(uAspect, 1.0);

  vec2 dist = (fv - uPointer) * vec2(1.0, 1.0 / uAspect);
  float r = smoothstep(0.2, 0.0, length(dist));
  uv = mix(uv, fv, 0.0);

  return uv + ft * uDistortionStrength * (1.0 + noise) + vec2(uOffset, 0.0);
}

// ============================================================================
// STRIPE EFFECT FUNCTIONS
// ============================================================================

float calculateStripePattern(vec2 uv) {
    // Vertical stripe (background)
  float vStripeB = calculateGradNoise(vec2(uv.x + 28.8, 0.5), uStripeFreqV.x, uStripeSpeed.x, 10.0, 0.0, uStripeStrength.x);

    // Horizontal stripe (background)
  float hStripeB = calculateGradNoise(vec2(0.5, uv.y), uStripeFreqH.x, uStripeSpeed.y, 5.0, 0.5, uStripeStrength.y);

    // Horizontal stripe (secondary)
  float hStripeS = calculateGradNoise(vec2(0.5, uv.y), uStripeFreqH.y, uStripeSpeed.y, 1.0, 1.0, uStripeStrength.y);

  return vStripeB + hStripeB * hStripeS;
}

// ============================================================================
// GRAIN EFFECT FUNCTIONS
// ============================================================================

vec3 calculateGrainEffect(vec2 uv) {
    // Base grain noise
  float gn1 = grainNoise(uv, 2000.0, vec2(0.8, 1.2));

    // Positive grain spots
  float gn3 = pow(smoothstep(0.8, 1.0, fbm2(uv * 60.0, uTime * 0.05)), 2.0) * 1.0;

    // Negative grain spots
  float gn4 = -pow(smoothstep(0.8, 1.0, fbm2(uv * 60.0 + 2356.8, uTime * 0.05)), 2.0) * 0.5;

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
  vec4 traceTex = texture2D(uTraceTexture, vUv);
  // Calculate gradient of traceTex using the function
  vec3 gradientData = calculateGradient(uTraceTexture, vUv);

  // Extract gradient components
  vec2 gradient = vec2(gradientData.x, gradientData.y) / max(gradientData.z, 1e-6);
  float gradientMagnitude = gradientData.z;

  // gradient = vec2(gradient.y, -gradient.x);

  vec2 distortedUV = calculateDistortion(vUv);
  distortedUV += gradient * gradientMagnitude * 0.5 * uTraceDistortion;

    // Sample primary texture with distortion
  vec4 tex = texture2D(uTexture, distortedUV);

    // Mix textures based on controls
  vec4 finalTex = tex;

    // Convert to sRGB color space
  vec3 baseColor = linearToSRGB(finalTex.rgb);

    // Calculate stripe pattern
  float stripe = calculateStripePattern(distortedUV);

    // Calculate grain effect
  vec3 grain = calculateGrainEffect(distortedUV);

    // Apply grain to stripe pattern
  vec3 stripeWithGrain = vec3(stripe) * grain;

    // Add noise modulation
  float noise = fbm2(distortedUV * 2.0, uTime * 0.1);
  float noiseModulation = pow(remap(noise, vec2(0.0, 1.0), vec2(0.5, 1.0)), 5.0);
  stripeWithGrain *= noiseModulation;

  // Trace
  // stripeWithGrain += (traceTex.rrr) * 5.0 * stripeWithGrain;

    // Final color mixing
  vec3 finalColor = mix(stripeWithGrain * 0.75, (traceTex.rrr) * 2.0 * stripeWithGrain, uMouseOn);

    // Output
  gl_FragColor = vec4(finalColor, uOpacity);
}