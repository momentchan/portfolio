'use client';

import { useLoader } from '@react-three/fiber';
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { useControls } from 'leva';
import { MeshTransmissionMaterial, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

// Custom hook for glass material configuration
const useGlassConfig = () => {
  return useControls('Glass Material', {
    samples: { value: 16, min: 1, max: 32, step: 1 },
    resolution: { value: 512, min: 64, max: 2048, step: 64 },
    transmission: { value: 1, min: 0, max: 1 },
    roughness: { value: 0.15, min: 0, max: 1, step: 0.01 },
    clearcoat: { value: 0.1, min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    thickness: { value: 200, min: 0, max: 200, step: 0.01 },
    backsideThickness: { value: 200, min: 0, max: 200, step: 0.01 },
    ior: { value: 1.5, min: 1, max: 5, step: 0.01 },
    chromaticAberration: { value: 1, min: 0, max: 1 },
    anisotropy: { value: 1, min: 0, max: 10, step: 0.01 },
    distortion: { value: 0.7, min: 0, max: 1, step: 0.01 },
    distortionScale: { value: 1, min: 0.01, max: 1, step: 0.01 },
    temporalDistortion: { value: 0.1, min: 0, max: 1, step: 0.01 },
    attenuationDistance: { value: 0.5, min: 0, max: 10, step: 0.01 },
    attenuationColor: '#ffffff',
    color: '#ffffff',
  }, { collapsed: true });
};



// Component for individual mesh with glass material
const GlassMesh = ({ mesh, config }: { 
  mesh: THREE.Mesh; 
  config: any; 
}) => (
  <Float floatIntensity={0} rotationIntensity={0}>
    <mesh
      geometry={mesh.geometry}
      position={mesh.position}
      rotation={mesh.rotation}
      scale={mesh.scale}
      castShadow
      receiveShadow
    >
      <MeshTransmissionMaterial
        {...config}
        toneMapped={false}
        backside={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  </Float>
);

// Component for individual mesh with shader material
const ShaderMesh = ({ mesh }: { 
  mesh: THREE.Mesh; 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Get controls directly in this component
  const config = useControls('Shader Material', {
    // Fresnel controls
    fresnelIntensity: { value: 0.1, min: 0.1, max: 5.0, step: 0.1 },
    fresnelPower: { value: 3.0, min: 0.5, max: 3.0, step: 0.01 },
    fresnelColor: '#ffffff',
    fresnelRimColor: '#ffffff',
    fresnelRimStrength: { value: 0.5, min: 0.0, max: 2.0, step: 0.01 },
    fresnelFalloff: { value: 2, min: 0.1, max: 2.0, step: 0.01 }
  }, { collapsed: true });
  
  // Create shader material once and update uniforms
  const shaderMaterial = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 fresnelColor;
        uniform vec3 fresnelRimColor;
        uniform float fresnelIntensity;
        uniform float fresnelPower;
        uniform float fresnelRimStrength;
        uniform float fresnelFalloff;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
          // Fresnel effect - creates edge glow based on viewing angle
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          float fresnelEffect = pow(1.0 - abs(dot(vNormal, viewDirection)), fresnelPower);
          
          // Enhanced fresnel with rim lighting
          float rimEffect = pow(1.0 - abs(dot(vNormal, viewDirection)), fresnelFalloff);
          
          // Combine fresnel effects
          float combinedFresnel = fresnelEffect * fresnelIntensity;
          float rimLighting = rimEffect * fresnelRimStrength;
          
          // Use fresnel as opacity - edges are visible, center is transparent
          float edgeOpacity = combinedFresnel + rimLighting;
          
          // Clamp opacity to reasonable range
          edgeOpacity = clamp(edgeOpacity, 0.0, 1.0);
          
          // Final color with fresnel-based opacity
          vec3 finalColor = fresnelColor * combinedFresnel + fresnelRimColor * rimLighting;
          
          // Output with fresnel-based alpha - edges are visible, center is transparent
          gl_FragColor = vec4(finalColor, edgeOpacity);
        }
      `,
      uniforms: {
        fresnelColor: { value: new THREE.Color(config.fresnelColor) },
        fresnelRimColor: { value: new THREE.Color(config.fresnelRimColor) },
        fresnelIntensity: { value: config.fresnelIntensity },
        fresnelPower: { value: config.fresnelPower },
        fresnelRimStrength: { value: config.fresnelRimStrength },
        fresnelFalloff: { value: config.fresnelFalloff }
      },
      side: THREE.DoubleSide,
      transparent: true
    });
    
    return material;
  }, []); // Empty dependency array - create once
  
  // Update uniforms when config changes
  useEffect(() => {
    // Update uniform values
    shaderMaterial.uniforms.fresnelColor.value = new THREE.Color(config.fresnelColor);
    shaderMaterial.uniforms.fresnelRimColor.value = new THREE.Color(config.fresnelRimColor);
    shaderMaterial.uniforms.fresnelIntensity.value = config.fresnelIntensity;
    shaderMaterial.uniforms.fresnelPower.value = config.fresnelPower;
    shaderMaterial.uniforms.fresnelRimStrength.value = config.fresnelRimStrength;
    shaderMaterial.uniforms.fresnelFalloff.value = config.fresnelFalloff;
    
    shaderMaterial.needsUpdate = true;
  }, [config, shaderMaterial]);
  
  return (
    <Float floatIntensity={0} rotationIntensity={0}>
      <mesh
        ref={meshRef}
        geometry={mesh.geometry}
        position={mesh.position}
        rotation={mesh.rotation}
        scale={mesh.scale}
        castShadow
        receiveShadow
        material={shaderMaterial}
      />
    </Float>
  );
};

export default function Flower(){
  const fbx = useLoader(FBXLoader, '/flower_Hibiscus_A01.FBX');
  const glassConfig = useGlassConfig();
  const groupRef = useRef<THREE.Group>(null);
  
  const materialToggle = useControls('Material Selection', {
    materialType: { value: 'shader', options: ['glass', 'shader'] }
  });
  
  const rotationControls = useControls('Rotation', {
    speed: { value: 0.5, min: 0, max: 2, step: 0.1 },
    enabled: true
  });
  
  // Extract meshes from the loaded FBX
  const meshes = useMemo(() => {
    const arr: THREE.Mesh[] = [];
    fbx.traverse((child) => { 
      if (child instanceof THREE.Mesh) arr.push(child);
    });
    return arr;
  }, [fbx]);

  // Animate rotation
  useFrame((state, delta) => {
    if (groupRef.current && rotationControls.enabled) {
      groupRef.current.rotation.y += delta * rotationControls.speed;
    }
  });
  
  return (
    <group ref={groupRef} scale={0.0025} position={[0, -0.1, 0]} rotation={[Math.PI * 0.2, 0, 0]}>
      {materialToggle.materialType === 'glass' ? (
        // Render glass material
        meshes.map((mesh, i) => (
          <GlassMesh
            key={i}
            mesh={mesh}
            config={glassConfig}
          />
        ))
      ) : (
        // Render shader material
        meshes.map((mesh, i) => (
          <ShaderMesh
            key={i}
            mesh={mesh}
          />
        ))
      )}
    </group>
  );
}
