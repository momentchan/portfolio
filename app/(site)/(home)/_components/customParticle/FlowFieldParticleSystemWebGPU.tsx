import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import {
    Fn,
    uniform,
    instancedArray,
    instanceIndex,
    float,
    vec3,
    vec4,
    mx_noise_vec3,
    mx_hsvtorgb,
    mx_rgbtohsv,
    length,
    normalize,
    mix,
    uv,
    smoothstep,
    pow,
    If
} from "three/tsl";
import { useControls } from "leva";

export default function FlowFieldParticleSystemWebGPU() {
    const { camera } = useThree();

    const controls = useControls('Particles.Flow Field (WebGPU)', {
        count: { value: 2048, min: 500, max: 10000, step: 100 },
        speed: { value: 0.2, min: 0.0, max: 2.0 },
        noiseScale: { value: 1.0, min: 0.1, max: 5.0 },
        noiseStrength: { value: 2.0, min: 0.0, max: 5.0 },
        attractStrength: { value: 1.5, min: 0.0, max: 5.0 },
        avoidanceStrength: { value: 3.0, min: 0.0, max: 10.0 },
        avoidanceRadius: { value: 0.5, min: 0.1, max: 2.0 },
        particleSize: { value: 0.05, min: 0.01, max: 0.5 },
        // Visual controls matching GLSL
        color: { value: '#ffd3d3' },
        glowIntensity: { value: 0.4, min: 0, max: 10 },
        hueShift: { value: 0.0, min: 0, max: 1 },
    });

    // Uniforms
    const uniforms = useMemo(() => ({
        uTime: uniform(0),
        uDelta: uniform(0),
        uSpeed: uniform(controls.speed),
        uNoiseScale: uniform(controls.noiseScale),
        uNoiseStrength: uniform(controls.noiseStrength),
        uAttractStrength: uniform(controls.attractStrength),
        uAvoidanceStrength: uniform(controls.avoidanceStrength),
        uAvoidanceRadius: uniform(controls.avoidanceRadius),
        uPointer: uniform(new THREE.Vector3(999, 999, 999)),
        // Visual Uniforms
        uColor: uniform(new THREE.Color(controls.color)),
        uGlowIntensity: uniform(controls.glowIntensity),
        uHueShift: uniform(controls.hueShift),
        uSize: uniform(controls.particleSize),
    }), []);

    // Initialize Data
    const { positionBuffer, velocityBuffer, seedBuffer } = useMemo(() => {
        const posArray = new Float32Array(controls.count * 3);
        const velArray = new Float32Array(controls.count * 3);
        const seedArray = new Float32Array(controls.count);
        const radius = 2.0;

        for (let i = 0; i < controls.count; i++) {
            const r = Math.cbrt(Math.random()) * radius;
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            posArray[i * 3 + 2] = r * Math.cos(phi);

            seedArray[i] = Math.random();
        }

        return {
            positionBuffer: instancedArray(posArray, 'vec3'),
            velocityBuffer: instancedArray(velArray, 'vec3'),
            seedBuffer: instancedArray(seedArray, 'float'),
        };
    }, [controls.count]);

    // --- Compute Shader (Physics) ---
    const computeLogic = useMemo(() => {
        return Fn(() => {
            const position = positionBuffer.element(instanceIndex);
            const velocity = velocityBuffer.element(instanceIndex);

            // Physics logic...
            const noiseTime = uniforms.uTime.mul(0.1);
            const scaledPos = position.mul(uniforms.uNoiseScale);
            const noiseVal = mx_noise_vec3(scaledPos.add(vec3(noiseTime)));
            const curlForce = noiseVal.mul(uniforms.uNoiseStrength);
            const attractForce = position.negate().mul(uniforms.uAttractStrength);

            const distToPointer = length(position.sub(uniforms.uPointer));
            const repulsion = vec3(0.0).toVar();

            If(distToPointer.lessThan(uniforms.uAvoidanceRadius), () => {
                const dir = normalize(position.sub(uniforms.uPointer));
                const strength = uniforms.uAvoidanceStrength.mul(
                    vec3(1.0).sub(distToPointer.div(uniforms.uAvoidanceRadius))
                );
                repulsion.assign(dir.mul(strength));
            });

            const totalAccel = curlForce.add(attractForce).add(repulsion);
            const targetVelocity = normalize(totalAccel).mul(uniforms.uSpeed);
            const newVelocity = mix(velocity, targetVelocity, uniforms.uDelta.mul(5.0));

            velocity.assign(newVelocity);
            position.addAssign(velocity.mul(uniforms.uDelta));
        });
    }, [positionBuffer, velocityBuffer, uniforms]);

    // --- Fragment / Material Logic (Ported from GLSL) ---
    const material = useMemo(() => {
        const mat = new THREE.SpriteNodeMaterial({
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending, // Simulating "glow"
        });

        // 1. Position & Size (Vertex Stage)
        mat.positionNode = positionBuffer.element(instanceIndex);

        // Note: TSL Sprite handles perspective scale automatically, 
        // we just set the base world size.
        const seed = seedBuffer.element(instanceIndex);
        const randomSize = mix(0.5, 1.5, seed); // Variance
        mat.scaleNode = vec3(uniforms.uSize.mul(randomSize));

        // 2. Color & Shape (Fragment Stage)
        mat.colorNode = Fn(() => {
            const velocity = velocityBuffer.element(instanceIndex);

            // --- Shape Generation (Circular with Soft Edge) ---
            // GLSL: vec2 center = gl_PointCoord - vec2(0.5);
            // TSL: uv() is 0..1
            const center = uv().sub(0.5);
            const dist = length(center);

            // GLSL: float fade = 1.0 - smoothstep(0.0, 0.5, dist); fade = pow(fade, 1.2);
            const fade = float(1.0).sub(smoothstep(0.0, 0.5, dist));
            const softFade = pow(fade, 1.2);

            // --- Color Calculation ---
            // GLSL: vec3 color = vColor * glowIntensity * glowColor;
            const baseColor = uniforms.uColor.mul(uniforms.uGlowIntensity);

            // --- HSV Shift ---
            // Replicating HSVShift(color, vec3(hueShift, 0.0, 0.0))
            const hsv = mx_rgbtohsv(baseColor);
            const shiftedH = hsv.x.add(uniforms.uHueShift); // Add shift
            // We use fract to keep hue in 0-1 range (optional but good practice)
            // But mx_hsvtorgb usually handles overflow.
            const hsvShifted = vec3(shiftedH, hsv.y, hsv.z);
            const colorWithHsv = mx_hsvtorgb(hsvShifted);

            // --- Velocity Based Glow (FlowField specific) ---
            // GLSL: float speed = smoothstep(0.0, 0.5, length(vVel.xyz));
            const speedVal = length(velocity);
            const speedFactor = smoothstep(0.0, 0.5, speedVal);

            // GLSL: color *= (1.0 + pow(speed, 2.0) * 100.0);
            const brightnessBoost = float(1.0).add(pow(speedFactor, 2.0).mul(100.0));
            const finalColor = colorWithHsv.mul(brightnessBoost);

            // Output: vec4(color, opacity * fade)
            // We assume base opacity is 1.0 for now, multiplied by shape fade
            return vec4(finalColor, softFade);
        })();

        return mat;
    }, [positionBuffer, velocityBuffer, seedBuffer, uniforms]);

    // Mesh
    const mesh = useMemo(() => {
        const sprite = new THREE.Sprite(material);
        sprite.count = controls.count;
        return sprite;
    }, [material, controls.count]);

    // Loop
    useFrame((state, delta) => {
        // Sync Controls
        uniforms.uTime.value = state.clock.elapsedTime;
        uniforms.uDelta.value = Math.min(delta, 0.1);
        uniforms.uSpeed.value = controls.speed;
        uniforms.uNoiseScale.value = controls.noiseScale;
        uniforms.uNoiseStrength.value = controls.noiseStrength;
        uniforms.uAttractStrength.value = controls.attractStrength;
        uniforms.uAvoidanceStrength.value = controls.avoidanceStrength;
        uniforms.uAvoidanceRadius.value = controls.avoidanceRadius;

        uniforms.uColor.value.set(controls.color);
        uniforms.uGlowIntensity.value = controls.glowIntensity;
        // Cycle hue automatically like in the original example
        const hueCycle = 120;
        uniforms.uHueShift.value = (performance.now() / 1000 / hueCycle) % 1;
        uniforms.uSize.value = controls.particleSize;

        // Pointer
        const vec = new THREE.Vector3(state.pointer.x, state.pointer.y, 0.5);
        vec.unproject(camera);
        const dir = vec.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));
        uniforms.uPointer.value.copy(pos);

        const gl = state.gl as unknown as THREE.WebGPURenderer;
        gl.compute(computeLogic().compute(controls.count));
    });

    return (
        <primitive object={mesh} />
    );
}