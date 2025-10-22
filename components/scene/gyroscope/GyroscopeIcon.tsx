'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface GyroscopeIconProps {
    radius?: number;
    active?: boolean;
    color?: string;
}

export default function GyroscopeIcon({
    radius = 15,
    active = false,
    color = '#888888',
}: GyroscopeIconProps) {
    const ring1Ref = useRef<THREE.Group>(null);
    const ring2Ref = useRef<THREE.Group>(null);
    const ring3Ref = useRef<THREE.Group>(null);
    const centerDotRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const waveRingRef = useRef<THREE.Mesh>(null!);
    const waveMaterialRef = useRef<THREE.MeshBasicMaterial>(null!);

    // Shared material for all meshes
    const sharedMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
    });

    // Wave ring material
    const waveMaterial = useMemo(() => new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
    }), [color]);

    // Store material ref for GSAP animation
    useEffect(() => {
        waveMaterialRef.current = waveMaterial;
    }, [waveMaterial]);

    // Constants
    const REST_SIZE_MULTIPLIERS = [0.7, 0.5, 0.4, 0.5];
    const ACTIVE_SIZE_MULTIPLIER = 0.6;
    const TORUS_THICKNESS = 0.4;
    const WAVE_TARGET_MULTIPLIER = 1.2;
    const WAVE_SCALE_DURATION = 0.5;
    const WAVE_OPACITY_DURATION = 2;

    // Calculated values
    const restSizes = REST_SIZE_MULTIPLIERS.map(mult => radius * mult);
    const activeSize = radius * ACTIVE_SIZE_MULTIPLIER;

    // Animate to reset or active state
    useEffect(() => {
        if (active) {
            // Active: scale all rings to activeSize and stop any rotation animations
            if (ring1Ref.current) {
                gsap.killTweensOf(ring1Ref.current.rotation); // Stop rotation animations
                const targetScale = activeSize / restSizes[0];
                gsap.to(ring1Ref.current.scale, {
                    x: targetScale, y: targetScale, z: targetScale,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            }
            if (ring2Ref.current) {
                gsap.killTweensOf(ring2Ref.current.rotation); // Stop rotation animations
                const targetScale = activeSize / restSizes[1];
                gsap.to(ring2Ref.current.scale, {
                    x: targetScale, y: targetScale, z: targetScale,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            }
            if (ring3Ref.current) {
                gsap.killTweensOf(ring3Ref.current.rotation); // Stop rotation animations
                const targetScale = activeSize / restSizes[2];
                gsap.to(ring3Ref.current.scale, {
                    x: targetScale, y: targetScale, z: targetScale,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            }
        } else {
            // Inactive: reset rotation and scale back to rest sizes
            if (ring1Ref.current) {
                gsap.to(ring1Ref.current.rotation, {
                    x: 0, y: 0, z: 0,
                    duration: 0.6,
                    ease: 'power2.out'
                });
                gsap.to(ring1Ref.current.scale, {
                    x: 1, y: 1, z: 1,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            }
            if (ring2Ref.current) {
                gsap.to(ring2Ref.current.rotation, {
                    x: 0, y: 0, z: 0,
                    duration: 0.6,
                    ease: 'power2.out'
                });
                gsap.to(ring2Ref.current.scale, {
                    x: 1, y: 1, z: 1,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            }
            if (ring3Ref.current) {
                gsap.to(ring3Ref.current.rotation, {
                    x: 0, y: 0, z: 0,
                    duration: 0.6,
                    ease: 'power2.out'
                });
                gsap.to(ring3Ref.current.scale, {
                    x: 1, y: 1, z: 1,
                    duration: 0.6,
                    ease: 'power2.out'
                });
            }
        }
    }, [active, activeSize, restSizes]);

    // Wave animation when not active
    useEffect(() => {
        let shouldContinue = !active;

        if (!active && waveRingRef.current && centerDotRef.current) {
            // Create continuous wave animation
            const createWave = () => {
                if (!waveRingRef.current || !centerDotRef.current || !shouldContinue) return;

                // Reset to initial state
                gsap.set(waveRingRef.current.scale, { x: 0, y: 0, z: 0 });
                gsap.set(centerDotRef.current.scale, { x: 1, y: 1, z: 1 });
                gsap.set(waveMaterialRef.current, { opacity: 1 });

                // Animate scale from 0 to activeSize with ease (both wave and center dot)
                const targetScale = WAVE_TARGET_MULTIPLIER * activeSize / restSizes[3];

                gsap.to(waveRingRef.current.scale, {
                    x: targetScale,
                    y: targetScale,
                    z: targetScale,
                    duration: 1.5,
                    ease: 'power2.out',
                });

                gsap.to(centerDotRef.current.scale, {
                    x: targetScale,
                    y: targetScale,
                    z: targetScale,
                    duration: WAVE_SCALE_DURATION,
                    ease: 'power2.out',
                });

                gsap.to(waveMaterialRef.current, {
                    opacity: 0,
                    duration: WAVE_OPACITY_DURATION,
                    ease: 'power5.out',
                    onComplete: createWave,
                });
            };

            createWave();
            return () => {
                shouldContinue = false;
            };
        } else {
            shouldContinue = false;
        }
    }, [active, activeSize, radius]);

    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;

        if (active) {
            // Ring 1: Rotate around tilted axis (not pure X)
            if (ring1Ref.current) {
                ring1Ref.current.rotation.x += delta * 1.2;
                ring1Ref.current.rotation.y += delta * 0.5;
                ring1Ref.current.rotation.z += delta * 0.3;
            }

            // Ring 2: Rotate around tilted axis (not pure Y)
            if (ring2Ref.current) {
                ring2Ref.current.rotation.x += delta * 0.3;
                ring2Ref.current.rotation.y += delta * 1.5;
                ring2Ref.current.rotation.z += delta * 0.4;
            }

            // Ring 3: Rotate around tilted axis (not pure Z)
            if (ring3Ref.current) {
                ring3Ref.current.rotation.x += delta * 0.4;
                ring3Ref.current.rotation.y += delta * 0.3;
                ring3Ref.current.rotation.z += delta * 1.0;
            }
        }
    });

    return (
        <group ref={groupRef}>
            {/* Ring 1 - Perpendicular to X axis */}
            <group ref={ring1Ref}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[restSizes[0], TORUS_THICKNESS, 16, 32]} />
                    <primitive object={sharedMaterial} />
                </mesh>
            </group>

            {/* Ring 2 - Perpendicular to Y axis */}
            <group ref={ring2Ref}>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                    <torusGeometry args={[restSizes[1], TORUS_THICKNESS, 16, 32]} />
                    <primitive object={sharedMaterial} />
                </mesh>
            </group>

            {/* Ring 3 - Perpendicular to Z axis */}
            <group ref={ring3Ref}>
                <mesh>
                    <torusGeometry args={[restSizes[2], TORUS_THICKNESS, 16, 32]} />
                    <primitive object={sharedMaterial} />
                </mesh>
            </group>

            {/* Wave ring - faces forward and expands during permission request */}
            <mesh ref={waveRingRef} position={[0, 0, 0.1]}>
                <torusGeometry args={[restSizes[3], TORUS_THICKNESS, 16, 32]} />
                <primitive object={waveMaterial} />
            </mesh>

            {/* Center dot */}
            <mesh ref={centerDotRef}>
                <sphereGeometry args={[radius * 0.1, 16, 16]} />
                <primitive object={sharedMaterial} />
            </mesh>

        </group>
    );
}


