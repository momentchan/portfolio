import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useState, useEffect } from 'react';

interface ShapeProps {
    points: THREE.Vector3[];
    opacity: number;
    blendMode?: THREE.Blending;
}

interface GeometryProps {
    pos: THREE.Vector3;
    size?: number;
    aspectRatio?: number;
    opacity: number;
    blendMode?: THREE.Blending;
}

function Shape({ points, opacity, blendMode = THREE.NormalBlending }: ShapeProps) {
    if (points.length === 0) return null;
    
    return (
        <Line 
            points={points} 
            color="white" 
            transparent 
            opacity={opacity} 
            lineWidth={1}
        />
    );
}

export function Rectangle({ pos, size = 0.1, aspectRatio = 1.0, opacity, blendMode }: GeometryProps) {
    const [points, setPoints] = useState<THREE.Vector3[]>([]);

    useEffect(() => {
        // Use provided size or default
        const scaledSize = size;
        
        // Calculate width and height based on aspect ratio
        // aspectRatio = width / height
        // Make both width and height vary to create more diverse shapes
        const baseSize = scaledSize;
        const width = baseSize * aspectRatio;
        const height = baseSize / aspectRatio;
        
        // Create rectangle points in XY plane (facing Z axis)
        // Ensure all points are at exactly Z=0 for perfect orthographic projection
        const p1 = new THREE.Vector3(-width, -height, 0);
        const p2 = new THREE.Vector3(width, -height, 0);
        const p3 = new THREE.Vector3(width, height, 0);
        const p4 = new THREE.Vector3(-width, height, 0);

        // Create points relative to position
        const newPoints = [
            p1.clone().add(pos), 
            p2.clone().add(pos), 
            p3.clone().add(pos), 
            p4.clone().add(pos), 
            p1.clone().add(pos) // Close the loop
        ];
        setPoints(newPoints);
    }, [pos, size, aspectRatio]);

    return <Shape points={points} opacity={opacity} blendMode={blendMode} />;
}