'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { useEffect, ReactNode } from 'react';
import * as THREE from 'three';

interface UICanvasProps {
    size?: number;
    bottom?: number;
    left?: number;
    right?: number;
    zIndex?: number;
    cameraPosition?: [number, number, number];
    cameraZoom?: number;
    cameraNear?: number;
    cameraFar?: number;
    children: ReactNode;
    onHoverChange?: (hovered: boolean) => void;
    onClick?: () => void;
    hoverRadius?: number;
}

function CameraSetup({ canvasSize }: { canvasSize: number }) {
    const { camera } = useThree();

    useEffect(() => {
        if (camera instanceof THREE.OrthographicCamera) {
            camera.left = -canvasSize / 2;
            camera.right = canvasSize / 2;
            camera.top = canvasSize / 2;
            camera.bottom = -canvasSize / 2;
            camera.updateProjectionMatrix();
        }
    }, [camera, canvasSize]);

    return null;
}

function HoverPlane({
    radius,
    onClick,
    onHoverChange,
    position = [0, 0, 1]
}: {
    radius: number;
    onClick?: () => void;
    onHoverChange?: (hovered: boolean) => void;
    position?: [number, number, number];
}) {
    const { gl } = useThree();

    return (
        <mesh
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                onHoverChange?.(true);
                gl.domElement.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                onHoverChange?.(false);
                gl.domElement.style.cursor = 'auto';
            }}
        >
            <circleGeometry args={[radius, 32]} />
            <meshBasicMaterial transparent opacity={0} />
        </mesh>
    );
}

export default function UICanvas({
    size = 40,
    bottom,
    left,
    right,
    zIndex = 20,
    cameraPosition = [0, 0, 1],
    cameraZoom = 1,
    cameraNear = 0.1,
    cameraFar = 100,
    children,
    onHoverChange,
    onClick,
    hoverRadius,
}: UICanvasProps) {
    const positionStyle: React.CSSProperties = {
        position: 'fixed',
        width: size,
        height: size,
        zIndex,
    };

    if (bottom !== undefined) positionStyle.bottom = bottom;
    if (left !== undefined) positionStyle.left = left;
    if (right !== undefined) positionStyle.right = right;

    return (
        <div style={positionStyle}>
            <Canvas
                gl={{
                    alpha: true,
                    antialias: true,
                }}
                dpr={[2, 3]}
            >
                <OrthographicCamera
                    makeDefault
                    position={cameraPosition}
                    zoom={cameraZoom}
                    near={cameraNear}
                    far={cameraFar}
                />
                <CameraSetup canvasSize={size} />

                {children}

                {onClick && hoverRadius && (
                    <HoverPlane
                        radius={hoverRadius}
                        onClick={onClick}
                        onHoverChange={onHoverChange}
                    />
                )}
            </Canvas>
        </div>
    );
}

