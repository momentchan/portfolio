uniform sampler2D uMapTex;
uniform sampler2D uMaskTex;
uniform float uHueShift;
uniform float uTime;
uniform float uSeed;
uniform float uTriggerRate;

varying vec2 vUv;
varying vec2 vUv2;

void main() {
  vec4 color = texture2D(uMapTex, vUv);
  vec4 mask = texture2D(uMaskTex, vUv);
  
  if (mask.r > 0.5) {
    discard;
  }

  float shift = uHueShift + fract(uSeed) * 0.2;
  color.rgb = HSVShift(color.rgb, vec3(shift, 0.0, 0.0));
  
  csm_DiffuseColor = color;

  float l =  1.0 - vUv.y;
  // Create smooth animated gradient with seamless looping
  float animatedPos = mod(uTime + uSeed, 1.0);
  float distance1 = abs(l - animatedPos);
  float distance2 = abs(l - (animatedPos + 1.0));
  float distance3 = abs(l - (animatedPos - 1.0));
  float distance = min(min(distance1, distance2), distance3);
  float gradient = smoothstep(0.2, 0.0, distance);
  csm_Emissive = gradient * color.rgb * (0.5 + uTriggerRate * 0.5);
}
