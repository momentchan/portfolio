import { ParticleSystem, ZeroVelocityConfig, SpherePositionConfig, UniformColorConfig, ParticlePositionConfig, RandomSizeConfig } from "@/lib/particle-system";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three';
import CustomBehavior from "./customBehavior";
import gsap from "gsap";
import { useControls } from "leva";

// Custom position config for random positions inside a sphere
class RandomSpherePositionConfig extends ParticlePositionConfig {
    constructor(
        private radius: number = 1.0,
        private center: [number, number, number] = [0, 0, 0]
    ) {
        super();
    }

    generatePosition(index: number, totalCount: number, size: number): [number, number, number, number] {
        // Generate random point inside sphere using rejection sampling
        let x, y, z, distance;
        do {
            x = (Math.random() - 0.5) * 2 * this.radius;
            y = (Math.random() - 0.5) * 2 * this.radius;
            z = (Math.random() - 0.5) * 2 * this.radius;
            distance = Math.sqrt(x * x + y * y + z * z);
        } while (distance > this.radius);

        return [
            this.center[0] + x,
            this.center[1] + y,
            this.center[2] + z,
            0.0
        ];
    }
}

// Custom material with glow effect
const createCustomMaterial = (positionTex: THREE.Texture | null) => {
    return new THREE.ShaderMaterial({
        uniforms: {
            positionTex: { value: positionTex },
            time: { value: 0.0 },
            sizeMultiplier: { value: 1.0 },
            minSize: { value: 1.0 },
            opacity: { value: 0.8 },
            glowColor: { value: new THREE.Color('#00ff88') },
            glowIntensity: { value: 0.5 },
        },
        vertexShader: /*glsl*/ `
            uniform sampler2D positionTex;
            uniform float time;
            uniform float sizeMultiplier;
            uniform float minSize;
            
            attribute float size;
            
            varying vec3 vColor;
            varying float vSize;
            
            void main() {
                vec4 pos = texture2D(positionTex, uv);
                vColor = color;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
                
                float calculatedSize = size * sizeMultiplier * (300.0 / -mvPosition.z);
                vSize = calculatedSize;
                
                // Ensure minimum point size to prevent flickering
                gl_PointSize = max(calculatedSize, minSize);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: /*glsl*/ `
            uniform float opacity;
            uniform float time;
            uniform float glowIntensity;
            varying vec3 vColor;
            varying float vSize;
            
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
                // fade *= sizeFade;
                
                vec3 color = vColor * glowIntensity;
                
                gl_FragColor = vec4(color, opacity * fade);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
    });
};

export default function CustomParticle() {
    const controls = useControls('Particle', {
        glowIntensity: { value: 0.4, min: 0, max: 10, step: 0.01 },
        sizeMultiplier: { value: 0.4, min: 0, max: 2, step: 0.01 },
        minSize: { value: 2.0, min: 1.0, max: 5.0, step: 0.1 },
    });

    const particleSystemRef = useRef<any>(null);

    const config = useMemo(() => ({
        position: new RandomSpherePositionConfig(0.3, [0, 0, 0]),
        velocity: new ZeroVelocityConfig(),
        color: new UniformColorConfig([1, 1, 1]),
        size: new RandomSizeConfig([0.01, 0.02])
    }), []);

    const behavior = useMemo(() => new CustomBehavior(), []);

    // Create custom material
    const customMaterial = useMemo(() => {
        return createCustomMaterial(null); // Will be updated when texture is available
    }, []);

    const [animate, setAnimate] = useState({
        opacity: 0
    });

    useEffect(() => {
        gsap.to(animate, {
            opacity: 1,
            duration: 3,
            delay: 3,
            ease: "power2.inOut",
            onUpdate: () => {
                setAnimate({ ...animate });
            }
        });
    }, []);

    useEffect(() => {
        console.log(customMaterial);
    }, [customMaterial]);

    // Update material uniforms in real-time
    useFrame((state) => {
        if (particleSystemRef.current) {
            const time = state.clock.elapsedTime;

            // Get the position texture and update custom material
            const positionTex = particleSystemRef.current.getParticleTexture?.();
            if (positionTex && customMaterial.uniforms.positionTex.value !== positionTex) {
                customMaterial.uniforms.positionTex.value = positionTex;
            }

            customMaterial.uniforms.opacity.value = animate.opacity;
            customMaterial.uniforms.time.value = time;
            customMaterial.uniforms.glowIntensity.value = controls.glowIntensity;
            customMaterial.uniforms.sizeMultiplier.value = controls.sizeMultiplier;
            customMaterial.uniforms.minSize.value = controls.minSize;
        }
    });

    return (
        <ParticleSystem
            ref={particleSystemRef}
            count={2048}
            config={config}
            behavior={behavior}
            customMaterial={customMaterial}
        />
    )
}