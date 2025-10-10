import { useRef } from "react";
import { useControls } from "leva";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export default function DirectionalLights() {
    const debug = false;
    const keyLightControls = useControls('Lights.Key Light', {
        intensity: { value: 1, min: 0, max: 10, step: 0.1 },
        height: { value: 15, min: 5, max: 25, step: 1 },
    });

    const fillLightControls = useControls('Lights.Fill Light', {
        intensity: { value: 0.1, min: 0, max: 2, step: 0.01 },
        height: { value: 8, min: 3, max: 20, step: 1 },
        offset: { value: 180, min: 0, max: 360, step: 10 }, // Offset in degrees
    });

    const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
    const keyHelperRef = useRef<THREE.DirectionalLightHelper | null>(null);
    const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
    const fillHelperRef = useRef<THREE.DirectionalLightHelper | null>(null);

    useFrame((state) => {
        const time = state.clock.elapsedTime * 2;
        const radius = 8; // Circle radius

        // Key light position
        const keyAngle = time * 0.3;
        const keyXPosition = Math.cos(keyAngle) * radius;
        const keyZPosition = Math.sin(keyAngle) * radius;

        if (keyLightRef.current) {
            keyLightRef.current.position.set(keyXPosition, keyLightControls.height, keyZPosition);
            keyLightRef.current.intensity = keyLightControls.intensity;
        }

        // Fill light position (offset from key light)
        const fillAngle = keyAngle + (fillLightControls.offset * Math.PI / 180);
        const fillXPosition = Math.cos(fillAngle) * radius;
        const fillZPosition = Math.sin(fillAngle) * radius;

        if (fillLightRef.current) {
            fillLightRef.current.position.set(fillXPosition, fillLightControls.height, fillZPosition);
            fillLightRef.current.intensity = fillLightControls.intensity;
        }

        // Update helpers
        if (keyHelperRef.current) {
            keyHelperRef.current.update();
        }
        if (fillHelperRef.current) {
            fillHelperRef.current.update();
        }
    });

    return (
        <>
            {/* Key Light */}
            <directionalLight
                ref={keyLightRef}
                position={[0, keyLightControls.height, 0]}
                intensity={keyLightControls.intensity}
                castShadow
                shadow-mapSize-width={4096}
                shadow-mapSize-height={4096}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
                shadow-bias={-0.001}
            />
            {keyLightRef.current && debug && (
                <directionalLightHelper
                    ref={keyHelperRef}
                    args={[keyLightRef.current, 2, 0xff0000]}
                />
            )}

            {/* Fill Light */}
            <directionalLight
                ref={fillLightRef}
                position={[0, fillLightControls.height, 0]}
                intensity={fillLightControls.intensity}
                castShadow={false}
            />
            {fillLightRef.current && debug && (
                <directionalLightHelper
                    ref={fillHelperRef}
                    args={[fillLightRef.current, 2, 0x0000ff]}
                />
            )}
        </>
    );
}
