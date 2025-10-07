import * as THREE from 'three';
import photoshopMath from '@/lib/r3f-gist/shader/cginc/photoshopMath.glsl?raw';

export interface MaterialUniforms {
    positionTex: { value: THREE.Texture | null };
    velocityTex: { value: THREE.Texture | null };
    time: { value: number };
    sizeMultiplier: { value: number };
    minSize: { value: number };
    opacity: { value: number };
    glowColor: { value: THREE.Color };
    glowIntensity: { value: number };
    hueShift: { value: number };
}

export class MaterialFactory {
    static createGlowMaterial(uniforms: Partial<MaterialUniforms> = {}): THREE.ShaderMaterial {
        const defaultUniforms: MaterialUniforms = {
            positionTex: { value: null },
            velocityTex: { value: null },
            time: { value: 0.0 },
            sizeMultiplier: { value: 1.0 },
            minSize: { value: 1.0 },
            opacity: { value: 1.0 },
            glowColor: { value: new THREE.Color('#ffffff') },
            glowIntensity: { value: 0.5 },
            hueShift: { value: 0.0 },
            ...uniforms
        };

        return new THREE.ShaderMaterial({
            uniforms: defaultUniforms as any,
            vertexShader: /*glsl*/ `
                uniform sampler2D positionTex;
                uniform sampler2D velocityTex;
                uniform float time;
                uniform float sizeMultiplier;
                uniform float minSize;
                attribute float size;
                
                varying vec3 vColor;
                varying float vSize;
                varying float vAge;
                varying vec4 vVel;
                
                void main() {
                    vec4 pos = texture2D(positionTex, uv);
                    vec4 vel = texture2D(velocityTex, uv);
                    vColor = color;
                    vAge = pos.w; // Age stored in position.w
                    vVel = vel;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
                    
                    float calculatedSize = size * sizeMultiplier * (300.0 / -mvPosition.z);
                    vSize = calculatedSize;
                    
                    gl_PointSize = max(calculatedSize, minSize);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: /*glsl*/ `
                ${photoshopMath}
                uniform float opacity;
                uniform float time;
                uniform float glowIntensity;
                varying vec3 vColor;
                varying float vSize;
                varying float vAge;
                varying vec4 vVel;
                uniform vec3 glowColor;
                uniform float hueShift;

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
                    
                    // Fade based on age (normalized or raw depending on implementation)
                    float ageFade = 1.0 - smoothstep(0.0, 1.0, vAge);
                    fade *= ageFade;

                    vec3 color = vColor * glowIntensity * glowColor;
                    color = HSVShift(color, vec3(hueShift, 0.0, 0.0));

                    gl_FragColor = vec4(color, opacity * fade);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
        });
    }

    static createBasicMaterial(uniforms: Partial<MaterialUniforms> = {}): THREE.ShaderMaterial {
        const defaultUniforms: MaterialUniforms = {
            positionTex: { value: null },
            velocityTex: { value: null },
            time: { value: 0.0 },
            sizeMultiplier: { value: 1.0 },
            minSize: { value: 1.0 },
            opacity: { value: 1.0 },
            glowColor: { value: new THREE.Color('#ffffff') },
            glowIntensity: { value: 0.5 },
            hueShift: { value: 0.0 },
            ...uniforms
        };

        return new THREE.ShaderMaterial({
            uniforms: defaultUniforms as any,
            vertexShader: /*glsl*/ `
                uniform sampler2D positionTex;
                uniform float time;
                uniform float sizeMultiplier;
                attribute float size;
                
                varying vec3 vColor;
                varying float vAge;
                
                void main() {
                    vec4 pos = texture2D(positionTex, uv);
                    vColor = color;
                    vAge = pos.w;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
                    
                    float calculatedSize = size * sizeMultiplier * (300.0 / -mvPosition.z);
                    
                    gl_PointSize = max(calculatedSize, minSize);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: /*glsl*/ `
                uniform float opacity;
                uniform vec3 glowColor;
                uniform float glowIntensity;
                varying vec3 vColor;
                varying float vAge;

                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    float fade = 1.0 - smoothstep(0.0, 0.5, dist);
                    fade = pow(fade, 1.2);
                    
                    vec3 color = vColor * glowIntensity * glowColor;
                    gl_FragColor = vec4(color, opacity * fade);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
        });
    }
}
