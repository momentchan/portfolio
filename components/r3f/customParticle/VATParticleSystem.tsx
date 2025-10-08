import { ParticleSystem, ZeroVelocityConfig, UniformColorConfig, RandomSizeConfig, RandomPositionConfig } from "@/lib/particle-system";
import { useEffect, useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three';
import { VATBehavior } from "./behaviors/VATBehavior";
import { generateLifetimeTexture } from "./LifetimeTexture";
import { useControls } from "leva";
import { VATParticleSystemProps } from "./types";
import { createVATParticleMaterial, updateCommonMaterialUniforms } from "./materials/particleMaterial";
import { generateRandomVertexIds, generateBasePosTexture, generateUV2Texture } from "./utils/textureUtils";
import { calculateMVPMatrices, getModelMatrix } from "./utils/matrixUtils";
import { useParticleAnimation } from "./hooks/useParticleAnimation";

export default function VATParticleSystem({
    frame,
    posTex,
    meta,
    geometry,
    storeDelta = 0,
    animateRate = 0,
    globalRatio = 0
}: VATParticleSystemProps) {
    const { gl, camera, viewport } = useThree();
    const particleCount = 128;

    const controls = useControls('Particles.VAT Particles', {
        glowColor: { value: '#ffd3d3' },
        glowIntensity: { value: 0.4, min: 0, max: 10, step: 0.01 },
        sizeMultiplier: { value: 0.4, min: 0, max: 2, step: 0.01 },
        minSize: { value: 2.0, min: 1.0, max: 5.0, step: 0.1 },
        minLifetime: { value: 2.0, min: 0.5, max: 8.0, step: 0.1 },
        maxLifetime: { value: 4.0, min: 1.0, max: 12.0, step: 0.1 },
        upwardSpeed: { value: 0.005, min: 0.0, max: 0.01, step: 0.001 },
        noiseStrength: { value: 0.01, min: 0, max: 0.1, step: 0.001 },
        noiseScale: { value: 100, min: 0, max: 100, step: 0.001 },
        avoidanceStrength: { value: 1, min: 0, max: 10, step: 0.01 },
        avoidanceRadius: { value: 0.1, min: 0, max: 0.5, step: 0.001 },
    }, { collapsed: true });

    const particleSystemRef = useRef<any>(null);

    const config = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-0, 0], y: [-0, 0], z: [0, 0] }),
        velocity: new ZeroVelocityConfig(),
        color: new UniformColorConfig([1, 1, 1]),
        size: new RandomSizeConfig([0.01, 0.02])
    }), []);

    const hueCycle = 120;

    const behaviorRef = useRef<VATBehavior>(new VATBehavior());

    // Generate random vertex IDs (shared between base position and UV2 textures)
    const randomVertexIds = useMemo(() => {
        const maxVertexCount = meta?.vertexCount || (geometry?.getAttribute('position')?.count || 1);
        return generateRandomVertexIds(particleCount, maxVertexCount);
    }, [meta, geometry, particleCount]);

    // Create custom material
    const customMaterial = useMemo(() => createVATParticleMaterial(), []);

    // Use shared animation hook
    const animate = useParticleAnimation({ duration: 3, delay: 1 });

    const lifetimeTexture = useMemo(() => {
        return generateLifetimeTexture(particleCount, controls.minLifetime, controls.maxLifetime, gl);
    }, [controls.minLifetime, controls.maxLifetime, gl, particleCount]);

    // Generate UV2 texture for VAT mapping
    const uv2Texture = useMemo(() => {
        if (meta) {
            return generateUV2Texture(particleCount, meta, randomVertexIds);
        }
        return null;
    }, [meta, randomVertexIds, particleCount]);

    // Generate base position texture if geometry is provided
    const basePosTexture = useMemo(() => {
        if (geometry) {
            return generateBasePosTexture(particleCount, geometry, randomVertexIds);
        }
        return null;
    }, [geometry, randomVertexIds, particleCount]);

    useEffect(() => {
        if (particleSystemRef.current) {
            const meshRef = particleSystemRef.current.getMeshRef();
            meshRef.userData = { isVAT: false };
        }
    }, []);

    useFrame((state) => {
        if (!particleSystemRef.current) return;

        const time = state.clock.elapsedTime;
        const positionTex = particleSystemRef.current.getParticleTexture?.();
        const velocityTex = particleSystemRef.current.getVelocityTexture?.();
        const modelMatrix = getModelMatrix(particleSystemRef);

        // Calculate MVP matrices
        const { modelViewProjectionMatrix, inverseModelViewProjectionMatrix } =
            calculateMVPMatrices(modelMatrix, camera);

        // Update common material uniforms
        updateCommonMaterialUniforms(customMaterial, {
            time,
            opacity: 1, // animate.opacity,
            glowColor: new THREE.Color(controls.glowColor),
            glowIntensity: controls.glowIntensity,
            sizeMultiplier: controls.sizeMultiplier,
            minSize: controls.minSize,
            hueShift: (performance.now() / 1000 / hueCycle) % 1,
            positionTex,
            velocityTex,
        });

        // Update VAT-specific uniforms
        customMaterial.uniforms.uLifetimeTexture.value = lifetimeTexture;
        customMaterial.uniforms.uAnimateRate.value = animateRate;
        customMaterial.uniforms.uGlobalRatio.value = globalRatio;

        // Update behavior uniforms
        const behavior = behaviorRef.current;
        behavior.uniforms.uVatPosTex.value = posTex;
        behavior.uniforms.uFrames.value = meta.frameCount;
        behavior.uniforms.uTexW.value = meta.texWidth;
        behavior.uniforms.uFrame.value = Math.min(frame * meta.frameCount, meta.frameCount - 5);

        if (uv2Texture) behavior.uniforms.uUV2Texture.value = uv2Texture;
        if (basePosTexture) behavior.uniforms.uBasePosTexture.value = basePosTexture;

        behavior.uniforms.uStoreDelta.value = storeDelta;
        behavior.uniforms.uDamping.value = 0.98;
        behavior.uniforms.uTime.value = time;
        behavior.uniforms.uLifetimeTexture.value = lifetimeTexture;
        behavior.uniforms.uUpwardSpeed.value = controls.upwardSpeed;
        behavior.uniforms.uAnimateRate.value = animateRate;
        behavior.uniforms.uNoiseStrength.value = controls.noiseStrength;
        behavior.uniforms.uNoiseScale.value = controls.noiseScale;
        behavior.uniforms.uModelViewProjectionMatrix.value.copy(modelViewProjectionMatrix);
        behavior.uniforms.uInverseModelViewProjectionMatrix.value.copy(inverseModelViewProjectionMatrix);
        behavior.uniforms.uAspect.value = viewport.aspect;
        behavior.uniforms.uPointer.value.set(state.pointer.x, state.pointer.y);
        behavior.uniforms.uAvoidanceStrength.value = controls.avoidanceStrength;
        behavior.uniforms.uAvoidanceRadius.value = controls.avoidanceRadius;
    }, 1);

    return (
        <ParticleSystem
            ref={particleSystemRef}
            count={particleCount}
            config={config}
            behavior={behaviorRef.current}
            customMaterial={customMaterial}
        />
    );
}
