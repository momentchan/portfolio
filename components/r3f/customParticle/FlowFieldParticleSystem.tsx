import { ParticleSystem, ZeroVelocityConfig, UniformColorConfig, RandomSizeConfig } from "@/lib/particle-system";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three';
import { FlowFieldBehavior } from "./behaviors/FlowFieldBehavior";
import { RandomSpherePositionConfig } from "./configs/PositionConfigs";
import { useControls } from "leva";
import { createFlowFieldParticleMaterial, updateCommonMaterialUniforms } from "./materials/particleMaterial";
import { calculateMVPMatrices, getModelMatrix } from "./utils/matrixUtils";
import { useParticleAnimation } from "./hooks/useParticleAnimation";

export default function FlowFieldParticleSystem() {
    const { camera, viewport } = useThree();

    const controls = useControls('Particles.Flow Field Particles', {
        glowColor: { value: '#ffd3d3' },
        glowIntensity: { value: 0.4, min: 0, max: 10, step: 0.01 },
        sizeMultiplier: { value: 0.4, min: 0, max: 2, step: 0.01 },
        minSize: { value: 2.0, min: 1.0, max: 5.0, step: 0.1 },
        avoidanceStrength: { value: 3, min: 0, max: 10, step: 0.01 },
        avoidanceRadius: { value: 0.2, min: 0, max: 0.5, step: 0.001 },
    }, { collapsed: true });

    const particleSystemRef = useRef<any>(null);
    const prevPointerRef = useRef({ x: 0, y: 0 });

    const config = useMemo(() => ({
        position: new RandomSpherePositionConfig(0.3, [0, 0, 0]),
        velocity: new ZeroVelocityConfig(),
        color: new UniformColorConfig([1, 1, 1]),
        size: new RandomSizeConfig([0.01, 0.02])
    }), []);

    const hueCycle = 120;

    const behaviorRef = useRef<FlowFieldBehavior>(new FlowFieldBehavior());

    // Create custom material
    const customMaterial = useMemo(() => createFlowFieldParticleMaterial(), []);

    // Use shared animation hook
    const animate = useParticleAnimation({ duration: 3, delay: 5 });

    useFrame((state, delta) => {
        if (!particleSystemRef.current) return;

        const time = state.clock.elapsedTime;

        // Calculate pointer movement speed
        const currentPointer = { x: state.pointer.x, y: state.pointer.y };
        const pointerDelta = {
            x: currentPointer.x - prevPointerRef.current.x,
            y: currentPointer.y - prevPointerRef.current.y
        };
        const pointerSpeed = Math.sqrt(
            pointerDelta.x * pointerDelta.x + pointerDelta.y * pointerDelta.y
        ) / delta;
        prevPointerRef.current = currentPointer;
        const speedMultiplier = Math.max(0, Math.min(1, (pointerSpeed - 0) / (0.1 - 0)));

        const positionTex = particleSystemRef.current.getParticleTexture?.();
        const velocityTex = particleSystemRef.current.getVelocityTexture?.();
        const modelMatrix = getModelMatrix(particleSystemRef);

        // Calculate MVP matrices
        const { modelViewProjectionMatrix, inverseModelViewProjectionMatrix } =
            calculateMVPMatrices(modelMatrix, camera);

        // Update common material uniforms
        updateCommonMaterialUniforms(customMaterial, {
            time,
            opacity: animate.opacity,
            glowColor: new THREE.Color(controls.glowColor),
            glowIntensity: controls.glowIntensity,
            sizeMultiplier: controls.sizeMultiplier,
            minSize: controls.minSize,
            hueShift: (performance.now() / 1000 / hueCycle) % 1,
            positionTex,
            velocityTex,
        });

        // Update behavior uniforms
        const behavior = behaviorRef.current;
        behavior.uniforms.uPointer.value.set(state.pointer.x, state.pointer.y);
        behavior.uniforms.uSpeedMultiplier.value = speedMultiplier;
        behavior.uniforms.uAvoidanceStrength.value = controls.avoidanceStrength;
        behavior.uniforms.uAvoidanceRadius.value = controls.avoidanceRadius;
        behavior.uniforms.uModelViewProjectionMatrix.value.copy(modelViewProjectionMatrix);
        behavior.uniforms.uInverseModelViewProjectionMatrix.value.copy(inverseModelViewProjectionMatrix);
        behavior.uniforms.uAspect.value = viewport.aspect;
    });

    return (
        <ParticleSystem
            ref={particleSystemRef}
            count={2048}
            config={config}
            behavior={behaviorRef.current}
            customMaterial={customMaterial}
        />
    );
}
