uniform sampler2D uTexture;
uniform float uOpacity;
uniform float uDistortionStrength;
uniform float uTiling;
uniform float uRadius;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uStripeFreqH;
uniform vec2 uStripeFreqV;
uniform vec2 uStripeSpeed;
uniform vec2 uStripeStrength;
uniform float debug;

// Linear to sRGB conversion
vec3 linearToSRGB(vec3 c) {
      return mix(1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, 12.92 * c, step(c, vec3(0.0031308)));
}
float fbm2(vec2 p, float t) {
      float f;
      f = 0.50000 * simplexNoise3d(vec3(p, t));
      p = p * 2.01;
      f += 0.25000 * simplexNoise3d(vec3(p, t));
      return f * (1.0 / 0.75) * 0.5 + 0.5;
}
float fbm4(vec2 p, float t)
{
	float f;
	f = 0.50000 * simplexNoise3d(vec3(p, t)); p = p * 2.01;
	f += 0.25000 * simplexNoise3d(vec3(p, t)); p = p * 2.02; //from iq
	f += 0.12500 * simplexNoise3d(vec3(p, t)); p = p * 2.03;
	f += 0.06250 * simplexNoise3d(vec3(p, t));
	return f * (1.0 / 0.9375) * 0.5 + 0.5;
}

float random(vec2 st) {
    return fract(sin(dot(st.xy ,vec2(12.9898,78.233))) * 43758.5453123);
}
float grainNoise(vec2 uv, float frequency, vec2 range) {
    return remap(random(floor(uv * frequency)), vec2(0.0, 1.0), range);
}



float calculateGradNoise(vec2 uv, float frequency, float speed, float power, float offset, float amplitude) {
      return (pow(fbm2(uv * frequency, uTime * speed), power) + offset) * amplitude;
      return (pow(gradientNoise01(uv * frequency + uTime * speed), power) + offset) * amplitude;
}

void main() {

      vec2 st = floor(vUv * 10.);
      float noise = simplexNoise2d(vUv * 5.0);
      vec2 ft = (fract(vUv * uTiling) - 0.5);
      ft *= smoothstep(uRadius, 0., length(ft));

      noise = fbm2(vUv * 5.0, uTime * 0.2);

      vec2 uv = vUv + ft * uDistortionStrength * noise;
      vec4 tex = texture2D(uTexture, uv);

                    // Convert from linear to sRGB for proper display
      vec3 sRGBColor = linearToSRGB(tex.rgb);

      float vStripeB = calculateGradNoise(vec2(uv.x + 28.8, 0.5), uStripeFreqV.x, uStripeSpeed.x, 10., 0.0, uStripeStrength.x);
      // float vStripeS = calculateGradNoise(vec2(vUv.x, 0.5), uStripeFreqV.y, uStripeSpeed.x, 1., 0.6, uStripeStrength.x);
      float hStipeB = calculateGradNoise(vec2(0.5, uv.y), uStripeFreqH.x, uStripeSpeed.y, 5., 0.5, uStripeStrength.y);
      float hStipeS = calculateGradNoise(vec2(0.5, uv.y), uStripeFreqH.y, uStripeSpeed.y, 1., 1., uStripeStrength.y);

      float stripe = vStripeB + hStipeB * hStipeS;

      vec3 color = sRGBColor;

      float n = pow(remap(fbm2(uv * 2.0, uTime * 0.1), vec2(0.0, 1.0), vec2(0.5, 1.0)), 5.0);

      float gn1 = grainNoise(uv,2000., vec2(0.8, 1.2));
      float gn2 = grainNoise(uv, 1000., vec2(2.0, 1.5));
      float gn3 = smoothstep(0.9, 1.0, grainNoise(uv, 50., vec2(0.0, 1.0))) * 0.2;
      gn3 = pow(smoothstep(0.8, 1.0, fbm2(uv * 60., uTime * 0.05)), 2.0) * 1.;
      float gn4 = -pow(smoothstep(0.8, 1.0, fbm2(uv * 60. + 2356.8, uTime * 0.05)), 2.0) * 0.5;
      vec3 test = vec3(stripe) * gn1;
      test += gn3;
      test += gn4;
      test *= n;
      color = mix(sRGBColor, test, debug);

      gl_FragColor = vec4(color, tex.a * uOpacity);
}