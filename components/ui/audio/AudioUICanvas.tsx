'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import DistortedCircle from './DistortedCircle';
import GlobalStates from '@/components/r3f/GlobalStates';
import gsap from 'gsap';

interface AudioUICanvasProps {
    radius?: number;
    bottomOffset?: number;
    rightOffset?: number;
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

export default function AudioUICanvas({
    radius = 10,
    bottomOffset = 25,
    rightOffset = 25,
    onClick,
}: AudioUICanvasProps) {
    const canvasSize = radius * 4;
    const { soundOn, setSoundOn } = GlobalStates();
    const [animatedStrength, setAnimatedStrength] = useState(0);
    const strengthRef = useRef({ value: 0 });

    useEffect(() => {
        gsap.to(strengthRef.current, {
            value: soundOn ? 0.3 : 0,
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
                zIndex: 1000,
            }}
        >
            <Canvas gl={{ alpha: true, antialias: true }}>
                <OrthographicCamera makeDefault position={[0, 0, 1]} zoom={1} near={0.1} far={100} />
                <CameraSetup canvasSize={canvasSize} />
                <DistortedCircle
                    radius={radius}
                    segments={256}
                    distortionStrength={animatedStrength}
                    distortionSpeed={1.0}
                    distortionFrequency={0.5}
                    lineWidth={5}
                    onClick={handleClick}
                />
            </Canvas>
        </div>
    );
}

