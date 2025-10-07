import { ParticleSystem, ZeroVelocityConfig, UniformColorConfig, RandomSizeConfig, RandomPositionConfig } from "@/lib/particle-system";
import { useEffect, useRef, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three';
import { LifetimeBehavior } from "./behaviors/LifetimeBehavior";
import { RandomSpherePositionConfig } from "./configs/PositionConfigs";
import { generateLifetimeTexture } from "./LifetimeTexture";
import gsap from "gsap";
import { useControls } from "leva";
import photoshopMath from '@/lib/r3f-gist/shader/cginc/photoshopMath.glsl?raw'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { useLoader } from "@react-three/fiber";

// Custom material with glow effect for lifetime particles
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
            varying float vAge;
            
            void main() {
                vec4 pos = texture2D(positionTex, uv);
                vec4 vel = texture2D(velocityTex, uv);
                vColor = color;
                vAge = pos.w; // Age is stored in position.w
                
                vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
                
                float calculatedSize = size * sizeMultiplier * (300.0 / -mvPosition.z);
                vSize = calculatedSize;
                
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
            varying float vAge;
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
                
                // Fade based on age (normalized or raw depending on implementation)
                float ageFade = 1.0 - smoothstep(0.0, 1.0, vAge);
                fade *= ageFade;

                vec3 color = vColor * glowIntensity * glowColor;
                color = HSVShift(color, vec3(hueShift, 0.0, 0.0));

                gl_FragColor = vec4(color, opacity * fade);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
    });
};

export default function LifetimeParticleSystem({
    frame,
    posTex,
    meta,
    geometry,
    storeDelta = 0
}: {
    frame: number,
    posTex: THREE.Texture,
    meta: any,
    geometry?: THREE.BufferGeometry,
    storeDelta?: number
}) {


    const { gl } = useThree();

    const particleCount = 8192 * 2 * 2;

    const controls = useControls('Lifetime Particles', {
        glowColor: { value: '#ffd3d3' },
        glowIntensity: { value: 0.4, min: 0, max: 10, step: 0.01 },
        sizeMultiplier: { value: 0.4, min: 0, max: 2, step: 0.01 },
        minSize: { value: 2.0, min: 1.0, max: 5.0, step: 0.1 },
        minLifetime: { value: 2.0, min: 0.5, max: 8.0, step: 0.1 },
        maxLifetime: { value: 8.0, min: 1.0, max: 12.0, step: 0.1 },
        upwardSpeed: { value: 0.01, min: 0.0, max: 0.1, step: 0.001 },
        noiseStrength: { value: 0.01, min: 0, max: 0.1, step: 0.001 },
    });

    const particleSystemRef = useRef<any>(null);

    const config = useMemo(() => ({
        position: new RandomPositionConfig({ x: [-0, 0], y: [-0, 0], z: [0, 0] }),
        velocity: new ZeroVelocityConfig(),
        color: new UniformColorConfig([1, 1, 1]),
        size: new RandomSizeConfig([0.03, 0.03])
    }), []);

    const hueCycle = 120;

    const behaviorRef = useRef<LifetimeBehavior>(new LifetimeBehavior(
        5.0, // Default lifetime (not used anymore since we use texture)
        controls.upwardSpeed,
        1.0,
        controls.noiseStrength,
        1.0,
    ));
    // Generate base position texture from mesh geometry
    const generateBasePosTexture = (count: number, geometry: THREE.BufferGeometry, gl: THREE.WebGLRenderer): THREE.DataTexture => {
        const size = Math.floor(Math.sqrt(count));
        const data = new Float32Array(size * size * 4);

        const positions = geometry.getAttribute('position');

        for (let i = 0; i < size * size; i++) {
            const vatId = i % positions.count;
            const x = positions.getX(vatId);
            const y = positions.getY(vatId);
            const z = positions.getZ(vatId);

            const index = i * 4;
            data[index] = x;
            data[index + 1] = y;
            data[index + 2] = z;
            data[index + 3] = 0;
        }

        const texture = new THREE.DataTexture(
            data,
            size,
            size,
            THREE.RGBAFormat,
            THREE.FloatType
        );
        texture.needsUpdate = true;
        return texture;
    };

    // Generate UV2 texture for VAT mapping
    const generateUV2Texture = (count: number, meta: any, gl: THREE.WebGLRenderer): THREE.DataTexture => {
        const size = Math.floor(Math.sqrt(count));
        const data = new Float32Array(size * size * 4);

        for (let i = 0; i < size * size; i++) {
            // Map particle index to VAT vertex index (wraps if more particles than vertices)
            const vatId = i % meta.vertexCount;

            // Calculate UV2 coordinates based on VAT vertex ID
            const colIndex = Math.floor(vatId / meta.texHeight);
            const vIndex = vatId % meta.texHeight;
            const px = colIndex * meta.frameStride;
            const py = vIndex;
            const u = (px + 0.5) / meta.texWidth;
            const v = (py + 0.5) / meta.texHeight;

            const index = i * 4;
            data[index] = u;     // UV2 U coordinate
            data[index + 1] = v; // UV2 V coordinate
            data[index + 2] = 0; // Unused
            data[index + 3] = 0; // Unused
        }

        const texture = new THREE.DataTexture(
            data,
            size,
            size,
            THREE.RGBAFormat,
            THREE.FloatType
        );
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
        return texture;
    };

    // Create custom material
    const customMaterial = useMemo(() => {
        return createCustomMaterial(null, null); // Will be updated when texture is available
    }, []);

    const [animate, setAnimate] = useState({
        opacity: 0
    });

    const lifetimeTexture = useMemo(() => {
        return generateLifetimeTexture(particleCount, controls.minLifetime, controls.maxLifetime, gl);
    }, [controls.minLifetime, controls.maxLifetime, gl]);

    // Generate UV2 texture for VAT mapping
    const uv2Texture = useMemo(() => {
        if (meta) {
            return generateUV2Texture(particleCount, meta, gl);
        }
        return null;
    }, [meta, gl]);

    // Generate base position texture if geometry is provided
    const basePosTexture = useMemo(() => {
        if (geometry) {
            return generateBasePosTexture(particleCount, geometry, gl);
        }
        return null;
    }, [geometry, gl]);

    useEffect(() => {
        gsap.to(animate, {
            opacity: 1,
            duration: 3,
            delay: 1,
            ease: "power2.inOut",
            onUpdate: () => {
                setAnimate({ ...animate });
            }
        });
    }, []);


    useFrame((state, delta) => {
        if (particleSystemRef.current) {
            const time = state.clock.elapsedTime;

            const positionTex = particleSystemRef.current.getParticleTexture?.();
            const velocityTex = particleSystemRef.current.getVelocityTexture?.();
            if (positionTex && customMaterial.uniforms.positionTex.value !== positionTex) {
                customMaterial.uniforms.positionTex.value = positionTex;
            }

            if (velocityTex && customMaterial.uniforms.velocityTex.value !== velocityTex) {
                customMaterial.uniforms.velocityTex.value = velocityTex;
            }

            customMaterial.uniforms.opacity.value = 1;// animate.opacity;
            customMaterial.uniforms.time.value = time;
            customMaterial.uniforms.glowIntensity.value = controls.glowIntensity;
            customMaterial.uniforms.sizeMultiplier.value = controls.sizeMultiplier;
            customMaterial.uniforms.minSize.value = controls.minSize;
            customMaterial.uniforms.glowColor.value = new THREE.Color(controls.glowColor);
            customMaterial.uniforms.hueShift.value = (performance.now() / 1000 / hueCycle) % 1;

            // Update behavior uniforms
            behaviorRef.current.uniforms.uVatPosTex.value = posTex;
            behaviorRef.current.uniforms.uFrames.value = meta.frameCount;
            behaviorRef.current.uniforms.uTexW.value = meta.texWidth;
            behaviorRef.current.uniforms.uFrame.value = Math.min(frame * meta.frameCount, meta.frameCount - 5);

            if (uv2Texture) {
                behaviorRef.current.uniforms.uUV2Texture.value = uv2Texture;
            }
            if (basePosTexture) {
                behaviorRef.current.uniforms.uBasePosTexture.value = basePosTexture;
            }
            behaviorRef.current.uniforms.uStoreDelta.value = storeDelta;
            behaviorRef.current.uniforms.uDamping.value = 0.98;
            behaviorRef.current.uniforms.uTime.value = time;
            behaviorRef.current.uniforms.uLifetimeTexture.value = lifetimeTexture;
            behaviorRef.current.uniforms.uUpwardSpeed.value = controls.upwardSpeed;
            behaviorRef.current.uniforms.uNoiseStrength.value = controls.noiseStrength;
        }
    }, 1);


    return (
        <ParticleSystem
            ref={particleSystemRef}
            count={particleCount}
            config={config}
            behavior={behaviorRef.current}
            customMaterial={customMaterial}
            userData={{ isVAT: false }}
        />
    );
}
