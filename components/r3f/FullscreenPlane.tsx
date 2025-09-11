'use client';

import { useTexture } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useControls } from 'leva';
import simplexNoise from '@/lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl';
import fragment from '@/shaders/fragment.glsl';

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
                ${simplexNoise}
                ${fragment}
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
