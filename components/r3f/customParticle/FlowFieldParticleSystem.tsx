import { ParticleSystem, ZeroVelocityConfig, SpherePositionConfig, UniformColorConfig, ParticlePositionConfig, RandomSizeConfig } from "@/lib/particle-system";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three';
import { FlowFieldBehavior } from "./behaviors/FlowFieldBehavior";
import { RandomSpherePositionConfig } from "./configs/PositionConfigs";
import gsap from "gsap";
import { useControls } from "leva";
import photoshopMath from '@/lib/r3f-gist/shader/cginc/photoshopMath.glsl?raw'

// Custom material with glow effect
const createCustomMaterial = (positionTex: THREE.Texture | null, velocityTex: THREE.Texture | null) => {
    return new THREE.ShaderMaterial({
        uniforms: {
            positionTex: { value: positionTex },
            velocityTex: { value: velocityTex },
            time: { value: 0.0 },
            sizeMultiplier: { value: 1.0 },
            minSize: { value: 1.0 },
            opacity: { value: 0 },
            glowColor: { value: new THREE.Color('#ffffff') },
            glowIntensity: { value: 0.5 },
            hueShift: { value: 0.0 },
            uPointer: { value: new THREE.Vector2(-1000, -1000) },
            uAspect: { value: 1 },
            uModelViewProjectionMatrix: { value: new THREE.Matrix4() },
            uAvoidanceRadius: { value: 0.0 },
            uSpeedMultiplier: { value: 0.0 },
        },
        vertexShader: /*glsl*/ `
            uniform sampler2D positionTex;
            uniform sampler2D velocityTex;
            uniform float time;
            uniform float sizeMultiplier;
            uniform float minSize;
            attribute float size;
            
            varying vec3 vColor;
            varying float vSize;
            varying vec4 vVel;
            
            void main() {
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                vColor = color;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
                
                float calculatedSize = size * sizeMultiplier * (300.0 / -mvPosition.z);
                vSize = calculatedSize;
                vVel = vel;
                
                gl_PointSize = max(calculatedSize, minSize);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: /*glsl*/ `
            ${photoshopMath}
            uniform float opacity;
            uniform float time;
            uniform float glowIntensity;
            varying vec3 vColor;
            varying float vSize;
            varying vec4 vVel;
            uniform vec3 glowColor;
            uniform float hueShift;

            void main() {
                // Create circular particles with anti-flickering
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                
                // Use smooth falloff to prevent harsh edges
                float fade = 1.0 - smoothstep(0.0, 0.5, dist);
                fade = pow(fade, 1.2);
                
                // Anti-flickering: fade out particles that are too small
                float sizeFade = smoothstep(0.0, 1.0, vSize / 1.5);
                sizeFade = pow(sizeFade, 0.8);
                fade *= sizeFade;
                
                float speed = smoothstep(0.0, 0.5, length(vVel.xyz));

                vec3 color = vColor * glowIntensity * glowColor * (1.0 + pow(speed, 2.0) * 100.0);
                color = HSVShift(color, vec3(hueShift, 0.0, 0.0));

                color *= (1.0 + vVel.w * 10.0);

                gl_FragColor = vec4(color, opacity * fade);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
    });
};

export default function FlowFieldParticleSystem() {
    const { camera, viewport } = useThree();
    const controls = useControls('Particle', {
        glowColor: { value: '#ffd3d3' },
        glowIntensity: { value: 0.4, min: 0, max: 10, step: 0.01 },
        sizeMultiplier: { value: 0.4, min: 0, max: 2, step: 0.01 },
        minSize: { value: 2.0, min: 1.0, max: 5.0, step: 0.1 },
        avoidanceStrength: { value: 3, min: 0, max: 10, step: 0.01 },
        avoidanceRadius: { value: 0.2, min: 0, max: 0.5, step: 0.001 },
    });

    const particleSystemRef = useRef<any>(null);
    const prevPointerRef = useRef({ x: 0, y: 0 });

    const config = useMemo(() => ({
        position: new RandomSpherePositionConfig(0.3, [0, 0, 0]),
        velocity: new ZeroVelocityConfig(),
        color: new UniformColorConfig([1, 1, 1]),
        size: new RandomSizeConfig([0.01, 0.02])
    }), []);

    const hueCycle = 120;

    const behaviorRef = useRef<FlowFieldBehavior>(new FlowFieldBehavior(0.2, 1, 0.1, 2, 1.5, 0.98, 0.5, 100));

    // Create custom material
    const customMaterial = useMemo(() => {
        return createCustomMaterial(null, null); // Will be updated when texture is available
    }, []);

    const [animate, setAnimate] = useState({
        opacity: 0
    });

    useEffect(() => {
        gsap.to(animate, {
            opacity: 1,
            duration: 3,
            delay: 5,
            ease: "power2.inOut",
            onUpdate: () => {
                setAnimate({ ...animate });
            }
        });
    }, []);

    useFrame((state, delta) => {
        if (particleSystemRef.current) {
            const time = state.clock.elapsedTime;

            // Calculate pointer movement speed
            const currentPointer = { x: state.pointer.x, y: state.pointer.y };
            const pointerDelta = {
                x: currentPointer.x - prevPointerRef.current.x,
                y: currentPointer.y - prevPointerRef.current.y
            };
            const pointerSpeed = Math.sqrt(pointerDelta.x * pointerDelta.x + pointerDelta.y * pointerDelta.y) / delta;
            prevPointerRef.current = currentPointer;
            const speedMultiplier = Math.max(0, Math.min(1, (pointerSpeed - 0) / (0.1 - 0)));


            const positionTex = particleSystemRef.current.getParticleTexture?.();
            const velocityTex = particleSystemRef.current.getVelocityTexture?.();
            if (positionTex && customMaterial.uniforms.positionTex.value !== positionTex) {
                customMaterial.uniforms.positionTex.value = positionTex;
            }

            if (velocityTex && customMaterial.uniforms.velocityTex.value !== velocityTex) {
                customMaterial.uniforms.velocityTex.value = velocityTex;
            }
            
            customMaterial.uniforms.opacity.value = animate.opacity;
            customMaterial.uniforms.time.value = time;
            customMaterial.uniforms.glowIntensity.value = controls.glowIntensity;
            customMaterial.uniforms.sizeMultiplier.value = controls.sizeMultiplier;
            customMaterial.uniforms.minSize.value = controls.minSize;
            customMaterial.uniforms.glowColor.value = new THREE.Color(controls.glowColor);
            customMaterial.uniforms.hueShift.value = (performance.now() / 1000 / hueCycle) % 1;

            const modelMatrix = particleSystemRef.current?.matrixWorld || new THREE.Matrix4();
            const viewMatrix = camera.matrixWorldInverse;
            const projectionMatrix = camera.projectionMatrix;

            const modelViewProjectionMatrix = new THREE.Matrix4().multiplyMatrices(projectionMatrix, new THREE.Matrix4().multiplyMatrices(viewMatrix, modelMatrix));
            const inverseModelViewProjectionMatrix = modelViewProjectionMatrix.clone().invert();

            behaviorRef.current.uniforms.uPointer.value.set(state.pointer.x, state.pointer.y);
            behaviorRef.current.uniforms.uSpeedMultiplier.value = speedMultiplier;
            behaviorRef.current.uniforms.uAvoidanceStrength.value = controls.avoidanceStrength;
            behaviorRef.current.uniforms.uAvoidanceRadius.value = controls.avoidanceRadius;
            behaviorRef.current.uniforms.uModelViewProjectionMatrix.value.copy(modelViewProjectionMatrix);
            behaviorRef.current.uniforms.uInverseModelViewProjectionMatrix.value.copy(inverseModelViewProjectionMatrix);
            behaviorRef.current.uniforms.uAspect.value = viewport.aspect;
        }
    }, 1);

    return (
        <ParticleSystem
            ref={particleSystemRef}
            count={2048}
            config={config}
            behavior={behaviorRef.current}
            customMaterial={customMaterial}
        />
    )
}