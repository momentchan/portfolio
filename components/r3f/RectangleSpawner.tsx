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
    const { camera, raycaster, mouse, scene, size } = useThree();
    const [spawnedRectangles, setSpawnedRectangles] = useState<SpawnedRectangle[]>([]);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const lastSpawnTime = useRef(0);

    // Controls for spawn system
    const controls = useControls('Rectangle Spawner', {
        spawnCooldown: { value: 10, min: 10, max: 1000, step: 10 },
        maxRectangles: { value: 50, min: 10, max: 200, step: 10 },
        rectangleLifetime: { value: 1000, min: 50, max: 2000, step: 50 },
        rectangleSize: { value: 0.1, min: 0.01, max: 0.1, step: 0.01 },
        aspectRatio: { value: 1.0, min: 0.1, max: 5.0, step: 0.1 },
        aspectRatioVariation: { value: 1.5, min: 0.0, max: 3.0, step: 0.1 },
        opacityVariation: { value: 1.0, min: 0.0, max: 1.0, step: 0.1 },
        sizeVariation: { value: 1.0, min: 0.0, max: 1.0, step: 0.1 },
        opacity: { value: 0.05, min: 0.0, max: 1.0, step: 0.01 },
        clearAll: { value: false, onChange: () => setSpawnedRectangles([]) }
    });

    // Convert mouse position to 2D world coordinates for orthographic camera
    const getMouseWorldPosition = useCallback(() => {
        const orthoCamera = camera as THREE.OrthographicCamera;

        // Get camera bounds and zoom factor
        const left = orthoCamera.left;    // -10
        const right = orthoCamera.right;  // 10
        const top = orthoCamera.top;      // 10
        const bottom = orthoCamera.bottom; // -10
        const zoom = orthoCamera.zoom;    // 50

        // Calculate effective bounds with zoom
        const effectiveLeft = left / zoom;
        const effectiveRight = right / zoom;
        const effectiveTop = top / zoom;
        const effectiveBottom = bottom / zoom;

        // Mouse coordinates are normalized (-1 to 1)
        // Convert to our 2D world space
        const worldX = THREE.MathUtils.lerp(effectiveLeft, effectiveRight, (mouse.x + 1) * 0.5);
        const worldY = THREE.MathUtils.lerp(effectiveBottom, effectiveTop, (mouse.y + 1) * 0.5);

        return new THREE.Vector3(worldX, worldY, 0);
    }, [mouse, camera]);

    // Convert screen mouse event to world coordinates
    const getMouseWorldPositionFromEvent = useCallback((event: MouseEvent) => {
        const orthoCamera = camera as THREE.OrthographicCamera;
        const canvas = event.target as HTMLCanvasElement;

        // Get canvas bounds
        const rect = canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;

        // Convert to normalized coordinates (0 to 1)
        const normalizedX = canvasX / rect.width;
        const normalizedY = 1.0 - (canvasY / rect.height); // Flip Y coordinate

        // Get camera bounds and zoom factor
        const left = orthoCamera.left;    // -10
        const right = orthoCamera.right;  // 10
        const top = orthoCamera.top;      // 10
        const bottom = orthoCamera.bottom; // -10
        const zoom = orthoCamera.zoom;    // 50

        // Calculate effective bounds with zoom
        const effectiveLeft = left / zoom;
        const effectiveRight = right / zoom;
        const effectiveTop = top / zoom;
        const effectiveBottom = bottom / zoom;

        const worldX = THREE.MathUtils.lerp(effectiveLeft, effectiveRight, normalizedX);
        const worldY = THREE.MathUtils.lerp(effectiveBottom, effectiveTop, normalizedY);



        return new THREE.Vector3(worldX, worldY, 0);
    }, [camera]);

    // Spawn a rectangle at mouse position
    const spawnRectangle = useCallback(() => {
        const worldPos = getMouseWorldPosition();

        if (worldPos) {
            setSpawnedRectangles(prev => {
                // Limit number of rectangles
                const newRectangles = prev.length >= controls.maxRectangles
                    ? prev.slice(1) // Remove oldest
                    : prev;

                // Calculate size with optional variation
                const baseSize = controls.rectangleSize;
                const variation = controls.sizeVariation > 0
                    ? (Math.random() - 0.5) * 2 * controls.sizeVariation * baseSize
                    : 0;
                const finalSize = Math.max(0.01, baseSize + variation);

                // Calculate aspect ratio (random or fixed)
                let finalAspectRatio = controls.aspectRatio;
                const baseAspectRatio = controls.aspectRatio;
                const aspectVariation = controls.aspectRatioVariation;

                // Create a range from very thin to very wide
                // aspectVariation controls how extreme the shapes can be
                const randomFactor = Math.random(); // 0 to 1

                if (randomFactor < 0.5) {
                    // Create aspect ratios < 1 (tall rectangles)
                    // Range: 0.1 to baseAspectRatio
                    const minRatio = Math.max(0.1, baseAspectRatio - aspectVariation);
                    const factor = randomFactor * 2; // 0 to 1
                    finalAspectRatio = minRatio + (factor * (baseAspectRatio - minRatio));
                } else {
                    // Create aspect ratios > 1 (wide rectangles)
                    // Range: baseAspectRatio to baseAspectRatio + aspectVariation
                    const maxRatio = baseAspectRatio + aspectVariation;
                    const factor = (randomFactor - 0.5) * 2; // 0 to 1
                    finalAspectRatio = baseAspectRatio + (factor * (maxRatio - baseAspectRatio));
                }

                const baseOpacity = controls.opacity;
                const opacityVariation = controls.opacityVariation;
                const finalOpacity = baseOpacity + (Math.random() - 0.5) * 2 * opacityVariation * baseOpacity;

                const newRectangle: SpawnedRectangle = {
                    id: `rect-${Date.now()}-${Math.random()}`,
                    position: worldPos.clone(),
                    ratio: 1.0,
                    size: finalSize,
                    aspectRatio: finalAspectRatio,
                    opacity: finalOpacity,
                    createdAt: Date.now()
                };

                return [...newRectangles, newRectangle];
            });
        }
    }, [getMouseWorldPosition, controls.maxRectangles, controls.rectangleSize, controls.sizeVariation, controls.aspectRatio, controls.aspectRatioVariation, controls.opacityVariation, controls.opacity]);

    // Handle mouse events
    const handleMouseDown = useCallback((event: MouseEvent) => {
        setIsMouseDown(true);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsMouseDown(false);
    }, []);

    const handleMouseMove = useCallback((event: MouseEvent) => {
        const now = Date.now();



        // Spawn rectangle on mouse move with cooldown
        if (now - lastSpawnTime.current > controls.spawnCooldown) {
            // Use direct event-based coordinate calculation
            const worldPos = getMouseWorldPositionFromEvent(event);

            setSpawnedRectangles(prev => {
                // Limit number of rectangles
                const newRectangles = prev.length >= controls.maxRectangles
                    ? prev.slice(1) // Remove oldest
                    : prev;

                // Calculate size with optional variation
                const baseSize = controls.rectangleSize;
                const variation = controls.sizeVariation > 0
                    ? (Math.random() - 0.5) * 2 * controls.sizeVariation * baseSize
                    : 0;
                const finalSize = Math.max(0.01, baseSize + variation);

                // Calculate aspect ratio (random or fixed)
                let finalAspectRatio = controls.aspectRatio;
                const baseAspectRatio = controls.aspectRatio;
                const aspectVariation = controls.aspectRatioVariation;

                // Create a range from very thin to very wide
                // aspectVariation controls how extreme the shapes can be
                const randomFactor = Math.random(); // 0 to 1

                if (randomFactor < 0.5) {
                    // Create aspect ratios < 1 (tall rectangles)
                    // Range: 0.1 to baseAspectRatio
                    const minRatio = Math.max(0.1, baseAspectRatio - aspectVariation);
                    const factor = randomFactor * 2; // 0 to 1
                    finalAspectRatio = minRatio + (factor * (baseAspectRatio - minRatio));
                } else {
                    // Create aspect ratios > 1 (wide rectangles)
                    // Range: baseAspectRatio to baseAspectRatio + aspectVariation
                    const maxRatio = baseAspectRatio + aspectVariation;
                    const factor = (randomFactor - 0.5) * 2; // 0 to 1
                    finalAspectRatio = baseAspectRatio + (factor * (maxRatio - baseAspectRatio));
                }

                const baseOpacity = controls.opacity;
                const opacityVariation = controls.opacityVariation;
                const finalOpacity = baseOpacity + (Math.random() - 0.5) * 2 * opacityVariation * baseOpacity;

                const newRectangle: SpawnedRectangle = {
                    id: `rect-${Date.now()}-${Math.random()}`,
                    position: worldPos,
                    ratio: 1.0,
                    size: finalSize,
                    aspectRatio: finalAspectRatio,
                    opacity: finalOpacity,
                    createdAt: Date.now()
                };

                return [...newRectangles, newRectangle];
            });

            lastSpawnTime.current = now;
        }
    }, [getMouseWorldPositionFromEvent, controls.spawnCooldown, controls.maxRectangles, controls.rectangleSize, controls.sizeVariation, controls.aspectRatio, controls.aspectRatioVariation, controls.opacityVariation, controls.opacity]);

    // Add event listeners
    useEffect(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mousemove', handleMouseMove);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mousemove', handleMouseMove);
        };
    }, [handleMouseDown, handleMouseUp, handleMouseMove]);

    // Animate rectangle sizes and update lifetime ratios
    useFrame((state) => {
        setSpawnedRectangles(prev => {
            const now = Date.now();
            let hasChanges = false;
            
            const updatedRects = prev.map(rect => {
                const age = now - rect.createdAt; // Age in milliseconds
                const lifeRatio = Math.max(0, 1 - (age / controls.rectangleLifetime)); // Normalized lifetime (1 to 0)
                
                // Only update if ratio has changed significantly (to avoid unnecessary re-renders)
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
