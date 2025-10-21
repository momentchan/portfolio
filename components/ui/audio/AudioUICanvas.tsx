'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import DistortedCircle from './DistortedCircle';
import GlobalStates from '@/components/common/GlobalStates';
import BGM from './Bgm';
import gsap from 'gsap';


interface AudioUICanvasProps {
    radius?: number;
    bottomOffset?: number;
    rightOffset?: number;
    numLayers?: number;
    seedRange?: [number, number];
    frequencyRange?: [number, number];
    speedRange?: [number, number];
    onClick?: () => void;
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
    onHoverChange
}: {
    radius: number;
    onClick: () => void;
    onHoverChange: (hovered: boolean) => void;
}) {
    const { gl } = useThree();

    return (
        <mesh
            position={[0, 0, 1]}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            onPointerOver={(e) => {
                e.stopPropagation();
                onHoverChange(true);
                gl.domElement.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                onHoverChange(false);
                gl.domElement.style.cursor = 'auto';
            }}
        >
            <circleGeometry args={[radius, 32]} />
            <meshBasicMaterial transparent opacity={0} />
        </mesh>
    );
}

export default function AudioUICanvas({
    radius = 10,
    bottomOffset = 25,
    rightOffset = 25,
    onClick,
}: AudioUICanvasProps) {
    const canvasSize = radius * 4;
    const { soundOn, setSoundOn } = GlobalStates();
    const [animatedStrength, setAnimatedStrength] = useState(0);
    const [hovered, setHovered] = useState(false);
    const strengthRef = useRef({ value: 0 });

    const seeds = [12.35, 0.58, 3.67];


    useEffect(() => {
        gsap.to(strengthRef.current, {
            value: soundOn ? 1 : 0,
            duration: 1,
            ease: 'power2.inOut',
            onUpdate: () => {
                setAnimatedStrength(strengthRef.current.value);
            }
        });
    }, [soundOn]);

    const handleClick = () => {
        setSoundOn(!soundOn);
        onClick?.();
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: bottomOffset,
                right: rightOffset,
                width: canvasSize,
                height: canvasSize,
                zIndex: 20,
            }}
        >
            <Canvas gl={{ alpha: true, antialias: true }}>
                <OrthographicCamera makeDefault position={[0, 0, 1]} zoom={1} near={0.1} far={100} />
                <CameraSetup canvasSize={canvasSize} />

                {/* BGM Component - handles all audio in the same canvas as the UI */}
                <BGM />

                {/* Multiple overlapping circles */}
                {seeds.map((seed, i) => (
                    <DistortedCircle
                        key={i}
                        radius={radius}
                        segments={32}
                        color="#888888"
                        distortionStrength={animatedStrength}
                        distortionSpeed={1}
                        distortionFrequency={0.3}
                        seed={seed}
                        lineWidth={5}
                        isHovered={hovered}
                    />
                ))}

                {/* Single hover plane for all circles */}
                <HoverPlane
                    radius={radius}
                    onClick={handleClick}
                    onHoverChange={setHovered}
                />
            </Canvas>
        </div>
    );
}

