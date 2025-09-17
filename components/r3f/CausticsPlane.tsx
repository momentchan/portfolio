'use client';

import { useRef, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useControls } from 'leva';
import { useFBO } from '@react-three/drei';

// ===== TYPES =====
interface CausticsPlaneProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    size?: [number, number];
    showDebug?: boolean;
}

interface CausticsPlaneRef {
    getMaterial: () => THREE.ShaderMaterial | null;
    getFBOTexture: () => THREE.Texture | null;
}

// ===== SHADERS =====
const vertexShader = /* glsl */`
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    
    void main() {
        vUv = uv;
        // For simulation space, use UV coordinates as world position
        vWorldPosition = vec3(uv * 2.0 - 1.0, 0.0);
        vNormal = vec3(0.0, 0.0, 1.0);
        gl_Position = vec4(position, 1.0);
    }
`;

const fragmentShader = /* glsl */`
    uniform float uTime;
    uniform vec3 uLightPos;
    uniform float uCausticIntensity;
    uniform float uCausticSpeed;
    uniform float uCausticScale;
    uniform float uOpacity;
    uniform vec3 uCausticColor;
    uniform vec2 uResolution;
    uniform sampler2D uCausticsTexture;
    uniform float uTextureScale;
    uniform vec4 uSpeed; // speed1X, speed1Y, speed2X, speed2Y
    uniform float uLayerScale;
    uniform bool uUseDistanceFade;
    uniform bool uUseAngleFade;
    uniform float uFadeStart;
    uniform float uFadeEnd;
    uniform float uAngleFadeStart;
    uniform float uAngleFadeEnd;
    uniform float uAngleFadeIntensity;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    
    // Dual-layer caustics sampler (inspired by HLSL version)
    float causticsSampler(vec2 uv, vec4 speed, float time) {
        // First layer with speed.xy
        vec2 uv1 = uv * uTextureScale + speed.xy * time;
        // Second layer with speed.zw
        vec2 uv2 = uv * uTextureScale + 23.5 + speed.zw * time;
        
        // Sample both layers with layer scale
        float c1 = texture2D(uCausticsTexture, uv1 * uLayerScale).r;
        float c2 = texture2D(uCausticsTexture, uv2 * uLayerScale).r;
        
        // Take minimum for realistic caustics effect
        return min(c1, c2);
    }
    
    // Calculate physically correct caustics using dual-layer texture animation
    vec3 calculateCaustics(vec3 worldPos, vec3 normal, float time) {
        // Light parameters
        vec3 lightPos = uLightPos;
        
        // Calculate light ray from spotlight to world position
        vec3 lightRay = normalize(worldPos - lightPos);
        
        // Calculate angle between light ray and surface normal
        float angle = dot(lightRay, normal);
        
        // Project light ray onto the surface
        vec3 projectedRay = lightRay - normal * angle;
        
        // Create caustic UV coordinates based on projected ray
        vec2 causticUV = projectedRay.xy * uCausticScale;
        
        // Sample caustics using dual-layer animation
        float caustics = causticsSampler(causticUV, uSpeed, time * uCausticSpeed);
        
        // Apply physical falloff based on distance from light
        float lightDistance = length(worldPos - lightPos);
        float falloff = 1.0 / (1.0 + lightDistance * 0.1);
        
        // Apply angle-based intensity (Lambert's law)
        float angleIntensity = max(0.0, -angle);
        
        // Create bright spots and dark areas
        caustics = pow(caustics, 1.5) * falloff * angleIntensity * uCausticIntensity;
        
        return uCausticColor * caustics;
    }
    
    // Calculate edge fade based on distance from center
    float calculateDistanceFade(vec2 uv) {
        if (!uUseDistanceFade) return 1.0;
        // Distance from center (0.5, 0.5)
        float dist = length(uv - 0.5);
        // Fade from center to edges
        return 1.0 - smoothstep(uFadeStart, uFadeEnd, dist);
    }
    
    // Calculate edge fade based on angle from light
    float calculateAngleFade(vec3 worldPos, vec3 normal) {
        if (!uUseAngleFade) return 1.0;
        vec3 lightPos = uLightPos;
        vec3 lightRay = normalize(worldPos - lightPos);
        float angle = dot(lightRay, normal);
        // Fade based on how perpendicular the light is to the surface
        float angleFade = smoothstep(uAngleFadeStart, uAngleFadeEnd, abs(angle));
        // Apply intensity control
        return mix(1.0, angleFade, uAngleFadeIntensity);
    }
    
    void main() {
        // Calculate caustics
        vec3 caustics = calculateCaustics(vWorldPosition, vNormal, uTime * 10.);
        
        // Calculate edge fades
        float distanceFade = calculateDistanceFade(vUv);
        float angleFade = calculateAngleFade(vWorldPosition, vNormal);
        
        // Combine fades (you can choose which one to use or combine them)
        float finalFade = distanceFade * angleFade;
        
        // Apply fade to caustics
        caustics *= finalFade;
        
        // Output
        gl_FragColor = vec4(caustics, uOpacity * finalFade);
    }
`;

const debugVertexShader = /* glsl */`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0); // NDC quad
    }
`;

const debugFragmentShader = /* glsl */`
    uniform sampler2D uTexture;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
        vec4 color = texture2D(uTexture, vUv);
        gl_FragColor = vec4(color.rgb, uOpacity);
    }
`;

/**
 * Physically correct caustics plane with spotlight projection
 * Features: Realistic light refraction, angle-based intensity, world position support, FBO output
 */
const CausticsPlane = forwardRef<CausticsPlaneRef, CausticsPlaneProps>(({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    size = [4, 4],
    showDebug = true
}, ref) => {
    // ===== HOOKS =====
    const { size: viewportSize, gl } = useThree();
    const debugMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

    // ===== FBO SETUP =====
    const fbo = useFBO(1024, 1024, {
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
    });

    // ===== TEXTURE LOADING =====
    const causticsTexture = useLoader(THREE.TextureLoader, '/textures/Bruno_Caustics_Grayscale.png');
    causticsTexture.wrapS = THREE.RepeatWrapping;
    causticsTexture.wrapT = THREE.RepeatWrapping;

    // ===== CONTROLS =====
    const controls = useControls('Caustics Plane', {
        // Light parameters
        lightPosX: { value: -1.5, min: -10.0, max: 10.0, step: 0.1 },
        lightPosY: { value: 3.7, min: -10.0, max: 10.0, step: 0.1 },
        lightPosZ: { value: 1.3, min: -10.0, max: 10.0, step: 0.1 },

        // Caustics parameters
        causticIntensity: { value: 10.0, min: 0.0, max: 20.0, step: 0.1 },
        causticSpeed: { value: 0.02, min: 0.0, max: 1.0, step: 0.01 },
        causticScale: { value: 2.5, min: 0.1, max: 20.0, step: 0.1 },
        textureScale: { value: 1.0, min: 0.1, max: 5.0, step: 0.1 },

        // Animation parameters
        speed1X: { value: 0.05, min: -1.0, max: 1.0, step: 0.01 },
        speed1Y: { value: 0.05, min: -1.0, max: 1.0, step: 0.01 },
        speed2X: { value: -0.01, min: -1.0, max: 1.0, step: 0.01 },
        speed2Y: { value: 0.01, min: -1.0, max: 1.0, step: 0.01 },
        layerScale: { value: 4.0, min: 1.0, max: 20.0, step: 0.1 },

        // Visual parameters
        opacity: { value: 0.8, min: 0.0, max: 1.0, step: 0.01 },
        color: { value: '#ffffff' },

        // Edge fade parameters
        useDistanceFade: { value: false },
        useAngleFade: { value: true },
        fadeStart: { value: 0.3, min: 0.0, max: 1.0, step: 0.01 },
        fadeEnd: { value: 0.5, min: 0.0, max: 1.0, step: 0.01 },

        // Angle fade specific controls
        angleFadeStart: { value: 0.0, min: 0.0, max: 1.0, step: 0.01 },
        angleFadeEnd: { value: 0.5, min: 0.0, max: 1.0, step: 0.01 },
        angleFadeIntensity: { value: 1.0, min: 0.0, max: 2.0, step: 0.01 },

        // Debug controls
        showDebug: { value: showDebug },
    });

    // ===== MATERIALS =====
    const causticsMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0.0 },
                uLightPos: { value: new THREE.Vector3(0.0, 5.0, 3.0) },
                uCausticIntensity: { value: 1.0 },
                uCausticSpeed: { value: 1.0 },
                uCausticScale: { value: 1.0 },
                uOpacity: { value: 0.8 },
                uCausticColor: { value: new THREE.Vector3(0.9, 0.95, 1.0) },
                uResolution: { value: new THREE.Vector2(viewportSize.width, viewportSize.height) },
                uCausticsTexture: { value: causticsTexture },
                uTextureScale: { value: 1.0 },
                uSpeed: { value: new THREE.Vector4(0.1, 0.05, -0.08, 0.12) },
                uLayerScale: { value: 9.0 },
                uUseDistanceFade: { value: true },
                uUseAngleFade: { value: true },
                uFadeStart: { value: 0.3 },
                uFadeEnd: { value: 0.5 },
                uAngleFadeStart: { value: 0.0 },
                uAngleFadeEnd: { value: 0.5 },
                uAngleFadeIntensity: { value: 1.0 },
            },
            transparent: true,
            side: THREE.DoubleSide,
        });
    }, [viewportSize.width, viewportSize.height, causticsTexture]);

    // ===== SIMULATION SETUP =====
    const simulationScene = useMemo(() => new THREE.Scene(), []);
    const simulationCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
    const simulationMesh = useMemo(() => {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), causticsMaterial);
        mesh.frustumCulled = false;
        return mesh;
    }, [causticsMaterial]);

    // ===== EFFECTS =====
    // Add mesh to simulation scene
    useEffect(() => {
        simulationScene.add(simulationMesh);
        return () => {
            simulationScene.remove(simulationMesh);
        };
    }, [simulationScene, simulationMesh]);

    // Initialize FBO
    useEffect(() => {
        // Store current clear color
        const previousColor = new THREE.Color();
        gl.getClearColor(previousColor);
        const previousAlpha = gl.getClearAlpha();

        // Clear FBO with black
        gl.setClearColor(new THREE.Color(0, 0, 0), 1);
        gl.setRenderTarget(fbo);
        gl.clear(true, true, true);
        gl.setRenderTarget(null);

        // Restore previous clear color
        gl.setClearColor(previousColor, previousAlpha);
    }, [gl, fbo]);

    // ===== RENDER LOOP =====
    useFrame((state) => {
        if (causticsMaterial) {
            const uniforms = causticsMaterial.uniforms;

            // Update time uniform
            uniforms.uTime.value = state.clock.elapsedTime;

            // Update control-based uniforms
            uniforms.uLightPos.value.set(controls.lightPosX, controls.lightPosY, controls.lightPosZ);
            uniforms.uCausticIntensity.value = controls.causticIntensity;
            uniforms.uCausticSpeed.value = controls.causticSpeed;
            uniforms.uCausticScale.value = controls.causticScale;
            uniforms.uOpacity.value = controls.opacity;
            
            // Update color uniform
            const color = new THREE.Color(controls.color);
            uniforms.uCausticColor.value.set(color.r, color.g, color.b);
            
            // Update animation uniforms
            uniforms.uTextureScale.value = controls.textureScale;
            uniforms.uSpeed.value.set(controls.speed1X, controls.speed1Y, controls.speed2X, controls.speed2Y);
            uniforms.uLayerScale.value = controls.layerScale;
            
            // Update fade uniforms
            uniforms.uUseDistanceFade.value = controls.useDistanceFade;
            uniforms.uUseAngleFade.value = controls.useAngleFade;
            uniforms.uFadeStart.value = controls.fadeStart;
            uniforms.uFadeEnd.value = controls.fadeEnd;
            uniforms.uAngleFadeStart.value = controls.angleFadeStart;
            uniforms.uAngleFadeEnd.value = controls.angleFadeEnd;
            uniforms.uAngleFadeIntensity.value = controls.angleFadeIntensity;

            // Render to FBO
            gl.setRenderTarget(fbo);
            gl.clear();
            gl.render(simulationScene, simulationCamera);
            gl.setRenderTarget(null);

            // Update debug material texture
            if (debugMaterialRef.current) {
                debugMaterialRef.current.uniforms.uTexture.value = fbo.texture;
            }
        }
    });

    // ===== REF HANDLING =====
    useImperativeHandle(ref, () => ({
        getMaterial: () => causticsMaterial,
        getFBOTexture: () => fbo.texture,
    }));

    // ===== RENDER =====
    return (
        <group>
            {/* Debug quad to preview FBO content */}
            {controls.showDebug && (
                <mesh position={[0, 0, -1]}>
                    <planeGeometry args={[2, 2]} />
                    <shaderMaterial
                        ref={debugMaterialRef}
                        vertexShader={debugVertexShader}
                        fragmentShader={debugFragmentShader}
                        uniforms={{
                            uTexture: { value: null }, // Updated by useFrame
                            uOpacity: { value: 1 }
                        }}
                        transparent
                        depthWrite={false}
                    />
                </mesh>
            )}
        </group>
    );
});

CausticsPlane.displayName = 'CausticsPlane';

export default CausticsPlane;
