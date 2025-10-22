'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface GyroscopeIconProps {
    radius?: number;
    active?: boolean;
    color?: string;
    activeColor?: string;
}

export default function GyroscopeIcon({
    radius = 15,
    active = false,
    color = '#888888',
    activeColor = '#ffffff',
}: GyroscopeIconProps) {
    const ring1Ref = useRef<THREE.Group>(null);
    const ring2Ref = useRef<THREE.Group>(null);
    const ring3Ref = useRef<THREE.Group>(null);
    const centerDotRef = useRef<THREE.Mesh>(null);

    // Rest sizes for each ring when inactive
    const restSizes = [radius * 0.7, radius * 0.5, radius * 0.4];
    const activeSize = radius * 0.6;

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

        // Pulse center dot when active
        if (centerDotRef.current) {
            const scale = active ? 1 + Math.sin(time * 4) * 0.3 : 1;
            centerDotRef.current.scale.set(scale, scale, scale);
        }
    });

    const currentColor = active ? activeColor : color;

    return (
        <group>
            {/* Ring 1 - Perpendicular to X axis */}
            <group ref={ring1Ref}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[restSizes[0], 0.3, 16, 32]} />
                    <meshBasicMaterial
                        color={currentColor}
                        transparent={true}
                        opacity={1}
                    />
                </mesh>
            </group>

            {/* Ring 2 - Perpendicular to Y axis */}
            <group ref={ring2Ref}>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                    <torusGeometry args={[restSizes[1], 0.3, 16, 32]} />
                    <meshBasicMaterial
                        color={currentColor}
                        transparent={true}
                        opacity={1}
                    />
                </mesh>
            </group>

            {/* Ring 3 - Perpendicular to Z axis */}
            <group ref={ring3Ref}>
                <mesh>
                    <torusGeometry args={[restSizes[2], 0.3, 16, 32]} />
                    <meshBasicMaterial
                        color={currentColor}
                        transparent={true}
                        opacity={1}
                    />
                </mesh>
            </group>

            {/* Center dot */}
            <mesh ref={centerDotRef}>
                <sphereGeometry args={[radius * 0.1, 16, 16]} />
                <meshBasicMaterial color={currentColor} transparent opacity={1} />
            </mesh>
        </group>
    );
}


