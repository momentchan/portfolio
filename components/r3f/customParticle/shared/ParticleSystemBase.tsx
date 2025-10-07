import { ParticleSystem, ZeroVelocityConfig, UniformColorConfig, RandomSizeConfig } from "@/lib/particle-system";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three';
import gsap from "gsap";
import { useControls } from "leva";
import { MaterialFactory } from "./MaterialFactory";

export interface ParticleSystemConfig {
    count?: number;
    spawnType?: 'inside' | 'surface';
    sphereRadius?: number;
    glowColor?: string;
    glowIntensity?: number;
    sizeMultiplier?: number;
    minSize?: number;
    opacity?: number;
    hueShift?: number;
}

export interface ParticleSystemBaseProps {
    config?: ParticleSystemConfig;
    behavior: any;
    positionConfig: any;
    onUpdate?: (time: number, delta: number) => void;
    onMaterialUpdate?: (material: THREE.ShaderMaterial, time: number) => void;
    customMaterial?: THREE.ShaderMaterial;
}

export function useParticleSystemBase({
    config = {},
    behavior,
    positionConfig,
    onUpdate,
    onMaterialUpdate,
    customMaterial
}: ParticleSystemBaseProps) {
    const { gl } = useThree();
    const particleSystemRef = useRef<any>(null);

    const defaultConfig: ParticleSystemConfig = {
        count: 1024,
        spawnType: 'inside',
        sphereRadius: 0.3,
        glowColor: '#ffd3d3',
        glowIntensity: 0.4,
        sizeMultiplier: 0.4,
        minSize: 2.0,
        opacity: 1.0,
        hueShift: 0.0,
        ...config
    };

    const particleConfig = useMemo(() => ({
        position: positionConfig,
        velocity: new ZeroVelocityConfig(),
        color: new UniformColorConfig([1, 1, 1]),
        size: new RandomSizeConfig([0.1, 0.02])
    }), [positionConfig]);

    const material = useMemo(() => {
        return customMaterial || MaterialFactory.createGlowMaterial({
            opacity: { value: 0 },
            glowColor: { value: new THREE.Color(defaultConfig.glowColor!) },
            glowIntensity: { value: defaultConfig.glowIntensity! },
            sizeMultiplier: { value: defaultConfig.sizeMultiplier! },
            minSize: { value: defaultConfig.minSize!     }
        });
    }, [customMaterial, defaultConfig]);

    const [animate, setAnimate] = useState({
        opacity: 0
    });

    useEffect(() => {
        gsap.to(animate, {
            opacity: defaultConfig.opacity!,
            duration: 3,
            delay: 1,
            ease: "power2.inOut",
            onUpdate: () => {
                setAnimate({ ...animate });
            }
        });
    }, [defaultConfig.opacity]);

    useFrame((state, delta) => {
        if (particleSystemRef.current) {
            const time = state.clock.elapsedTime;

            // Update textures
            const positionTex = particleSystemRef.current.getParticleTexture?.();
            const velocityTex = particleSystemRef.current.getVelocityTexture?.();
            
            if (positionTex && material.uniforms.positionTex.value !== positionTex) {
                material.uniforms.positionTex.value = positionTex;
            }
            if (velocityTex && material.uniforms.velocityTex.value !== velocityTex) {
                material.uniforms.velocityTex.value = velocityTex;
            }

            // Update material uniforms
            material.uniforms.opacity.value = animate.opacity;
            material.uniforms.time.value = time;
            material.uniforms.glowIntensity.value = defaultConfig.glowIntensity!;
            material.uniforms.sizeMultiplier.value = defaultConfig.sizeMultiplier!;
            material.uniforms.minSize.value = defaultConfig.minSize!;
            material.uniforms.glowColor.value = new THREE.Color(defaultConfig.glowColor!);
            material.uniforms.hueShift.value = defaultConfig.hueShift!;

            // Custom update callbacks
            onUpdate?.(time, delta);
            onMaterialUpdate?.(material, time);
        }
    }, 1);

    return {
        particleSystemRef,
        particleConfig,
        material,
        config: defaultConfig
    };
}
