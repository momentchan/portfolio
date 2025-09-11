'use client';

import { useTexture } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useControls } from 'leva';
import simplexNoise from '@/lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl';
import fbm from '@/lib/r3f-gist/shader/cginc/noise/fractal.glsl';

export default function FullscreenPlane() {

    const { camera } = useThree();
    const [currentTextureIndex, setCurrentTextureIndex] = useState(0);
    const meshRef = useRef<THREE.Mesh>(null);
    const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);

    const controls = useControls({
        distortionStrength: { value: 0.8, min: 0, max: 1, step: 0.01 },
        tiling: { value: 15.0, min: 0, max: 100, step: 0.1 },
        radius: { value: 0.5, min: 0, max: 1, step: 0.01 }
    });

    // Define all available textures
    const texturePaths = [
        '/textures/Anne-Hathaway.jpg',
        '/textures/ea05b622336a50e113eb57ed7603fa41.jpg',
        '/textures/198083adc5709adb2d785d4d58a87440.jpg',
        '/textures/ce922f44c888a74136efe62d422e23ae.jpg',
        '/textures/27032d87ca65e74ac0a6bc8b0389c36f.jpg',
        '/textures/4fefb9d6a9150d9269e39e6f396990cb.jpg',
        '/textures/74822907eb66e5ee986e6a247af6b664.jpg',
    ];

    // Load all textures with proper color space
    const textures = useTexture(texturePaths);

    // Configure texture color space for accurate colors
    useEffect(() => {
        textures.forEach(texture => {
            if (texture) {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.needsUpdate = true;
            }
        });
    }, [textures]);

    // Handle keyboard input for texture switching
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                setCurrentTextureIndex(prev =>
                    prev === 0 ? texturePaths.length - 1 : prev - 1
                );
            } else if (event.key === 'ArrowRight') {
                setCurrentTextureIndex(prev =>
                    prev === texturePaths.length - 1 ? 0 : prev + 1
                );
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [texturePaths.length]);

    // Calculate the plane size to match the orthographic camera's view frustum
    const orthoCamera = camera as THREE.OrthographicCamera;
    // Account for zoom factor - higher zoom means smaller effective view
    const zoomFactor = orthoCamera.zoom;
    const planeWidth = ((orthoCamera.right - orthoCamera.left) / zoomFactor) * 1;
    const planeHeight = ((orthoCamera.top - orthoCamera.bottom) / zoomFactor) * 1;

    // Update shader material when texture changes
    useEffect(() => {
        if (meshRef.current && textures[currentTextureIndex]) {
            const material = meshRef.current.material as THREE.ShaderMaterial;
            material.uniforms.uTexture.value = textures[currentTextureIndex];
            material.uniforms.uDistortionStrength.value = controls.distortionStrength;
            material.uniforms.uTiling.value = controls.tiling;
            material.uniforms.uRadius.value = controls.radius;
            material.needsUpdate = true;
        }
    }, [currentTextureIndex, textures, controls]);
    useFrame((state) => {
        if (meshRef.current && textures[currentTextureIndex]) {
            const material = meshRef.current.material as THREE.ShaderMaterial;
            material.uniforms.uTime.value = state.clock.elapsedTime;
            material.needsUpdate = true;
        }
    });


    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({

            vertexShader: /* glsl */`
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /* glsl */`
                uniform sampler2D uTexture;
                uniform float uOpacity;
                uniform float uDistortionStrength;
                uniform float uTiling;
                uniform float uRadius;
                varying vec2 vUv;
                uniform float uTime;
                ${simplexNoise}
                
                
                // Linear to sRGB conversion
                vec3 linearToSRGB(vec3 c) {
                    return mix(1.055 * pow(c, vec3(1.0/2.4)) - 0.055, 12.92 * c, step(c, vec3(0.0031308)));
                }
                float fbm2(vec2 p, float t)
                {
                    float f;
                    f = 0.50000 * simplexNoise3d(vec3(p, t)); p = p * 2.01;
                    f += 0.25000 * simplexNoise3d(vec3(p, t));
                    return f * (1.0 / 0.75) * 0.5 + 0.5;
                }
                
                void main() {

                    vec2 st = floor(vUv * 10.);
                    float noise = simplexNoise2d(vUv * 5.0);
                    vec2 ft = (fract(vUv * uTiling) - 0.5);
                    ft *= smoothstep(uRadius, 0., length(ft));
                    
                    noise = fbm2(vUv * 20.0, uTime* 0.2);

                    vec2 uv = vUv+ ft * uDistortionStrength * noise;
                    vec4 tex = texture2D(uTexture, uv);
                    
                    // Convert from linear to sRGB for proper display
                    vec3 sRGBColor = linearToSRGB(tex.rgb);
                    

                    vec3 color = sRGBColor;
                    // color = vec3(ft, 0.0);

                    gl_FragColor = vec4(color, tex.a * uOpacity);
                }
            `,
            uniforms: {
                uTexture: { value: textures[currentTextureIndex] },
                uOpacity: { value: 1.0 },
                uDistortionStrength: { value: controls.distortionStrength },
                uTiling: { value: controls.tiling },
                uTime: { value: 0.0 },
                uRadius: { value: 0.5 }
            },
            toneMapped: false
        });
    }, [currentTextureIndex, textures]);

    return (
        <mesh ref={meshRef} position={[0, 0, -1]} material={shaderMaterial}>
            <planeGeometry args={[planeWidth, planeHeight]} />
            {/* <meshBasicMaterial map={textures[currentTextureIndex]} /> */}
        </mesh>
    );
}
