import photoshopMath from '@/lib/r3f-gist/shader/cginc/photoshopMath.glsl?raw'

export type ParticleSystemType = 'vat' | 'flowField';

/**
 * Shared vertex shader for particle systems
 */
export const createParticleVertexShader = (type: ParticleSystemType) => {
    const isVAT = type === 'vat';

    return /*glsl*/ `
        uniform sampler2D positionTex;
        uniform sampler2D velocityTex;
        uniform float time;
        uniform float sizeMultiplier;
        uniform float minSize;
        ${isVAT ? 'uniform float uGlobalRatio;' : ''}
        ${isVAT ? 'uniform sampler2D uLifetimeTexture;' : ''}
        
        attribute float size;
        
        varying vec3 vColor;
        varying float vSize;
        varying vec4 vVel;
        ${isVAT ? 'varying float vAge;' : ''}

        void main() {
            vec4 pos = texture2D(positionTex, uv);
            vec4 vel = texture2D(velocityTex, uv);
            vColor = color;
            vVel = vel;
            
            ${isVAT ? /*glsl*/ `
                float lifetime = texture2D(uLifetimeTexture, uv).r;
                float age = pos.w / lifetime;
                vAge = age;
            ` : ''}
            
            vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
            float calculatedSize = size * sizeMultiplier * (300.0 / -mvPosition.z);
            
            ${isVAT ? /*glsl*/ `
                // Fade in/out based on age
                calculatedSize *= smoothstep(0.0, 0.1, age) * smoothstep(1.0, 0.9, age);
                // Fade in/out based on global animation ratio
                calculatedSize *= smoothstep(0.9, 0.85, uGlobalRatio) * (1.0 + smoothstep(0.1, 0., uGlobalRatio) * 3.0);
            ` : ''}
            
            vSize = calculatedSize;
            
            gl_PointSize = max(calculatedSize, minSize);
            gl_Position = projectionMatrix * mvPosition;
        }
    `;
};

/**
 * Shared fragment shader for particle systems
 */
export const createParticleFragmentShader = (type: ParticleSystemType) => {
    const isVAT = type === 'vat';
    const isFlowField = type === 'flowField';

    return /*glsl*/ `
        ${photoshopMath}
        uniform float opacity;
        uniform float time;
        uniform float glowIntensity;
        uniform vec3 glowColor;
        uniform float hueShift;
        ${isVAT ? 'uniform float uAnimateRate;' : ''}
        
        varying vec3 vColor;
        varying float vSize;
        varying vec4 vVel;
        ${isVAT ? 'varying float vAge;' : ''}

        void main() {
            // Create circular particles with anti-flickering
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            
            // Use smooth falloff to prevent harsh edges
            float fade = 1.0 - smoothstep(0.0, 0.5, dist);
            fade = pow(fade, 1.2);
            
            // Anti-flickering: fade out particles that are too small
            float sizeFade = smoothstep(0.0, 1.0, vSize / 1.5);
            sizeFade = pow(sizeFade, 0.8);
            fade *= sizeFade;
            
            vec3 color = vColor * glowIntensity * glowColor;
            // Apply hue shift
            color = HSVShift(color, vec3(hueShift, 0.0, 0.0));
            
            ${isFlowField ? /*glsl*/ `
                // Add velocity-based glow
                float speed = smoothstep(0.0, 0.5, length(vVel.xyz));
                color *= (1.0 + pow(speed, 2.0) * 100.0);
                color *= (1.0 + vVel.w * 2.0);
            ` : ''}
            
            ${isVAT ? /*glsl*/ `
                // Add animated gradient based on age
                float distance1 = abs(vAge - uAnimateRate);
                float distance2 = abs(vAge - (uAnimateRate + 1.0));
                float distance3 = abs(vAge - (uAnimateRate - 1.0));
                float distance = min(min(distance1, distance2), distance3);
                float gradient = smoothstep(0.2, 0.0, distance);
                color *= (1.0 + pow(gradient, 2.0) * 5.0);
            ` : ''}
            
            gl_FragColor = vec4(color, opacity * fade);
        }
    `;
};

