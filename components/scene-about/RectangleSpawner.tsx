'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useControls } from 'leva';
import { Rectangle } from './Shape';

interface SpawnedRectangle {
    id: string;
    position: THREE.Vector3;
    ratio: number;
    size: number;
    aspectRatio: number;
    opacity: number;
    createdAt: number;
}

export default function RectangleSpawner() {
    const { camera, mouse } = useThree();
    const [spawnedRectangles, setSpawnedRectangles] = useState<SpawnedRectangle[]>([]);
    const lastSpawnTime = useRef(0);
    const previousMouseRef = useRef(new THREE.Vector2(0, 0));

    const controls = useControls('Rectangle Spawner', {
        spawnCooldown: { value: 10, min: 1, max: 100, step: 1 },
        maxRectangles: { value: 100, min: 10, max: 200, step: 10 },
        rectangleLifetime: { value: 1000, min: 50, max: 2000, step: 50 },
        rectangleSize: { value: 0.05, min: 0.01, max: 1.0, step: 0.01 },
        aspectRatio: { value: 0.5, min: 0.1, max: 5.0, step: 0.1 },
        aspectRatioVariation: { value: 1.5, min: 0.0, max: 3.0, step: 0.1 },
        opacityVariation: { value: 1.0, min: 0.0, max: 1.0, step: 0.1 },
        sizeVariation: { value: 0.5, min: 0.0, max: 1.0, step: 0.1 },
        opacity: { value: 0.1, min: 0.0, max: 1.0, step: 0.01 },
        clearAll: { value: false, onChange: () => setSpawnedRectangles([]) }
    });

    const getMouseWorldPosition = useCallback(() => {
        const orthoCamera = camera as THREE.OrthographicCamera;
        const left = orthoCamera.left / orthoCamera.zoom;
        const right = orthoCamera.right / orthoCamera.zoom;
        const top = orthoCamera.top / orthoCamera.zoom;
        const bottom = orthoCamera.bottom / orthoCamera.zoom;

        const worldX = THREE.MathUtils.lerp(left, right, (mouse.x + 1) * 0.5);
        const worldY = THREE.MathUtils.lerp(bottom, top, (mouse.y + 1) * 0.5);
        return new THREE.Vector3(worldX, worldY, 0);
    }, [mouse, camera]);

    const createRectangle = useCallback((worldPos: THREE.Vector3) => {
        const baseSize = controls.rectangleSize;
        const variation = controls.sizeVariation > 0
            ? (Math.random() - 0.5) * 2 * controls.sizeVariation * baseSize
            : 0;
        const finalSize = Math.max(0.01, baseSize + variation);

        const randomFactor = Math.random();
        const baseAspectRatio = controls.aspectRatio;
        const aspectVariation = controls.aspectRatioVariation;
        let finalAspectRatio = baseAspectRatio;

        if (randomFactor < 0.5) {
            const minRatio = Math.max(0.1, baseAspectRatio - aspectVariation);
            finalAspectRatio = minRatio + (randomFactor * 2 * (baseAspectRatio - minRatio));
        } else {
            const maxRatio = baseAspectRatio + aspectVariation;
            finalAspectRatio = baseAspectRatio + ((randomFactor - 0.5) * 2 * (maxRatio - baseAspectRatio));
        }

        const baseOpacity = controls.opacity;
        const opacityVariation = controls.opacityVariation;
        const finalOpacity = baseOpacity + (Math.random() - 0.5) * 2 * opacityVariation * baseOpacity;

        return {
            id: `rect-${Date.now()}-${Math.random()}`,
            position: worldPos.clone(),
            ratio: 1.0,
            size: finalSize,
            aspectRatio: finalAspectRatio,
            opacity: finalOpacity,
            createdAt: Date.now()
        };
    }, [controls]);

    useFrame((state) => {
        const now = Date.now();
        const currentMouse = new THREE.Vector2(state.pointer.x, state.pointer.y);
        const mouseDistance = currentMouse.distanceTo(previousMouseRef.current);

        // Spawn rectangle on mouse movement
        if (mouseDistance > 0.001 && now - lastSpawnTime.current > controls.spawnCooldown) {
            const worldPos = getMouseWorldPosition();
            if (worldPos) {
                setSpawnedRectangles(prev => {
                    const newRectangles = prev.length >= controls.maxRectangles ? prev.slice(1) : prev;
                    const newRectangle = createRectangle(worldPos);
                    return [...newRectangles, newRectangle];
                });
                lastSpawnTime.current = now;
            }
        }

        previousMouseRef.current.copy(currentMouse);

        // Update rectangle lifetimes
        setSpawnedRectangles(prev => {
            const now = Date.now();
            let hasChanges = false;

            const updatedRects = prev.map(rect => {
                const age = now - rect.createdAt;
                const lifeRatio = Math.max(0, 1 - (age / controls.rectangleLifetime));

                if (Math.abs(rect.ratio - lifeRatio) > 0.01) {
                    hasChanges = true;
                    return { ...rect, ratio: lifeRatio };
                }
                return rect;
            });

            return hasChanges ? updatedRects : prev;
        });
    });

    // Clean up old rectangles
    useEffect(() => {
        const cleanup = setInterval(() => {
            const now = Date.now();
            setSpawnedRectangles(prev =>
                prev.filter(rect => now - rect.createdAt < controls.rectangleLifetime)
            );
        }, 1000);

        return () => clearInterval(cleanup);
    }, [controls.rectangleLifetime]);

    return (
        <>
            {spawnedRectangles.map((rect) => (
                <Rectangle
                    key={rect.id}
                    pos={rect.position}
                    opacity={rect.ratio * rect.opacity}
                    size={rect.size}
                    aspectRatio={rect.aspectRatio}
                />
            ))}
        </>
    );
}