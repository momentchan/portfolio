import { ParticleSystem } from "@/lib/particle-system";
import { useEffect, useRef, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { LifetimeBehavior } from "./behaviors/LifetimeBehavior";
import { RandomSpherePositionConfig, InitialPositionConfig } from "./configs/PositionConfigs";
import { useParticleSystemBase } from "./shared/ParticleSystemBase";
import { generateSpherePositionTexture, generateSphereSurfaceTexture } from "./SpherePositionTexture";
import { generateLifetimeTexture, generateUniformLifetimeTexture, generateGradientLifetimeTexture } from "./LifetimeTexture";
import { useControls } from "leva";
import * as THREE from 'three';

export default function LifetimeParticleSystem() {
    const { gl } = useThree();

    const controls = useControls('Lifetime Particles', {
        glowColor: { value: '#ffd3d3' },
        glowIntensity: { value: 0.4, min: 0, max: 10, step: 0.01 },
        sizeMultiplier: { value: 0.4, min: 0, max: 2, step: 0.01 },
        minSize: { value: 2.0, min: 1.0, max: 5.0, step: 0.1 },
        minLifetime: { value: 2.0, min: 0.5, max: 8.0, step: 0.1 },
        maxLifetime: { value: 6.0, min: 1.0, max: 12.0, step: 0.1 },
        lifetimeType: { options: ['random', 'uniform', 'gradient'], value: 'random' },
        upwardSpeed: { value: 0.5, min: 0.1, max: 2.0, step: 0.01 },
        noiseStrength: { value: 0.2, min: 0, max: 1.0, step: 0.01 },
        sphereRadius: { value: 0.3, min: 0.1, max: 1.0, step: 0.01 },
        spawnType: { options: ['inside', 'surface'], value: 'inside' }
    });

    const behaviorRef = useRef<LifetimeBehavior>(new LifetimeBehavior(
        5.0, // Default lifetime (not used anymore since we use texture)
        controls.upwardSpeed,
        1.0,
        controls.noiseStrength,
        1.0
    ));

    // Generate initial positions texture
    const initialPositionsTexture = useMemo(() => {
        if (controls.spawnType === 'surface') {
            return generateSphereSurfaceTexture(1024, controls.sphereRadius, [0, 0, 0], gl);
        } else {
            return generateSpherePositionTexture(1024, controls.sphereRadius, [0, 0, 0], gl);
        }
    }, [controls.sphereRadius, controls.spawnType, gl]);

    // Generate lifetime texture
    const lifetimeTexture = useMemo(() => {
        switch (controls.lifetimeType) {
            case 'random':
                return generateLifetimeTexture(1024, controls.minLifetime, controls.maxLifetime, gl);
            case 'uniform':
                return generateUniformLifetimeTexture(1024, (controls.minLifetime + controls.maxLifetime) / 2, gl);
            case 'gradient':
                return generateGradientLifetimeTexture(1024, controls.minLifetime, controls.maxLifetime, gl);
            default:
                return generateLifetimeTexture(1024, controls.minLifetime, controls.maxLifetime, gl);
        }
    }, [controls.lifetimeType, controls.minLifetime, controls.maxLifetime, gl]);

    const { particleSystemRef, particleConfig, material, config } = useParticleSystemBase({
        config: {
            count: 1024,
            spawnType: controls.spawnType as 'inside' | 'surface',
            sphereRadius: controls.sphereRadius,
            glowColor: controls.glowColor,
            glowIntensity: controls.glowIntensity,
            sizeMultiplier: controls.sizeMultiplier,
            minSize: controls.minSize,
        },
        behavior: behaviorRef.current,
        positionConfig: new InitialPositionConfig(new RandomSpherePositionConfig(controls.sphereRadius, [0, 0, 0])),
        onUpdate: (time: number, delta: number) => {
            // Update behavior uniforms
            behaviorRef.current.updateParameters(controls.upwardSpeed, controls.noiseStrength);
            behaviorRef.current.updateTime(time);
        },
        onMaterialUpdate: (material: THREE.ShaderMaterial, time: number) => {
            material.uniforms.hueShift.value = (performance.now() / 1000 / 120) % 1;
        }
    });

    useEffect(() => {
        // Set the initial positions texture to the behavior
        behaviorRef.current.setInitialPositions(initialPositionsTexture);
        // Set the lifetime texture to the behavior
        behaviorRef.current.setLifetimeTexture(lifetimeTexture);
    }, [initialPositionsTexture, lifetimeTexture]);

    return (
        <ParticleSystem
            ref={particleSystemRef}
            count={config.count}
            config={particleConfig}
            behavior={behaviorRef.current}
            customMaterial={material}
        />
    );
}
