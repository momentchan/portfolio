uniform sampler2D uTexture;
uniform float uOpacity;
uniform float uDistortionStrength;
uniform float uTiling;
uniform float uRadius;
varying vec2 vUv;
uniform float uTime;

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

void main() {

      vec2 st = floor(vUv * 10.);
      float noise = simplexNoise2d(vUv * 5.0);
      vec2 ft = (fract(vUv * uTiling) - 0.5);
      ft *= smoothstep(uRadius, 0., length(ft));

      noise = fbm2(vUv * 20.0, uTime * 0.2);

      vec2 uv = vUv + ft * uDistortionStrength * noise;
      vec4 tex = texture2D(uTexture, uv);

                    // Convert from linear to sRGB for proper display
      vec3 sRGBColor = linearToSRGB(tex.rgb);

      vec3 color = sRGBColor;
                    // color = vec3(ft, 0.0);

      gl_FragColor = vec4(color, tex.a * uOpacity);
}