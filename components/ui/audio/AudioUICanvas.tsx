'use client';

import { useEffect, useRef, useState } from 'react';
import DistortedCircle from './DistortedCircle';
import GlobalStates from '@/components/common/GlobalStates';
import BGM from './Bgm';
import gsap from 'gsap';
import UICanvas from '@/components/ui/common/UICanvas';

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
        <UICanvas
            size={canvasSize}
            bottom={0}
            right={0}
            zIndex={20}
            cameraPosition={[0, 0, 1]}
            cameraZoom={1}
            cameraNear={0.1}
            cameraFar={100}
            onClick={handleClick}
            onHoverChange={setHovered}
            hoverRadius={radius * 5}
        >
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
        </UICanvas>
    );
}

