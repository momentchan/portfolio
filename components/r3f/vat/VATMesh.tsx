import * as THREE from 'three'
import React, { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { useControls } from 'leva'
import { VATMeshProps, VATMaterialControls, DEFAULT_MATERIAL_CONTROLS } from './types'
import { createVATMaterial, createVATDepthMaterial, updateVATMaterial } from './materials'
import { ensureUV2ForVAT } from './utils'

function useMaterialControls() {
  return useControls('VAT.Material', {
    roughness: { value: DEFAULT_MATERIAL_CONTROLS.roughness, min: 0, max: 1, step: 0.01 },
    metalness: { value: DEFAULT_MATERIAL_CONTROLS.metalness, min: 0, max: 1, step: 0.01 },
    transmission: { value: DEFAULT_MATERIAL_CONTROLS.transmission, min: 0, max: 1, step: 0.01 },
    thickness: { value: DEFAULT_MATERIAL_CONTROLS.thickness, min: 0, max: 10, step: 0.1 },
    ior: { value: DEFAULT_MATERIAL_CONTROLS.ior, min: 1, max: 2.5, step: 0.01 },
    clearcoat: { value: DEFAULT_MATERIAL_CONTROLS.clearcoat, min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: DEFAULT_MATERIAL_CONTROLS.clearcoatRoughness, min: 0, max: 1, step: 0.01 },
    reflectivity: { value: DEFAULT_MATERIAL_CONTROLS.reflectivity, min: 0, max: 1, step: 0.01 },
    envMapIntensity: { value: DEFAULT_MATERIAL_CONTROLS.envMapIntensity, min: 0, max: 2, step: 0.1 },
    sheen: { value: DEFAULT_MATERIAL_CONTROLS.sheen, min: 0, max: 1, step: 0.01 },
    sheenRoughness: { value: DEFAULT_MATERIAL_CONTROLS.sheenRoughness, min: 0, max: 1, step: 0.01 },
    sheenColor: DEFAULT_MATERIAL_CONTROLS.sheenColor,
    iridescence: { value: DEFAULT_MATERIAL_CONTROLS.iridescence, min: 0, max: 1, step: 0.01 },
    iridescenceIOR: { value: DEFAULT_MATERIAL_CONTROLS.iridescenceIOR, min: 1, max: 2.333, step: 0.01 },
    iridescenceThicknessMin: { value: DEFAULT_MATERIAL_CONTROLS.iridescenceThicknessMin, min: 0, max: 1000, step: 10 },
    iridescenceThicknessMax: { value: DEFAULT_MATERIAL_CONTROLS.iridescenceThicknessMax, min: 0, max: 1000, step: 10 },
    attenuationDistance: { value: DEFAULT_MATERIAL_CONTROLS.attenuationDistance, min: 0.01, max: 10, step: 0.01 },
    attenuationColor: DEFAULT_MATERIAL_CONTROLS.attenuationColor,
    bumpScale: { value: DEFAULT_MATERIAL_CONTROLS.bumpScale, min: 0, max: 1, step: 0.01 },
    hueShift: { value: DEFAULT_MATERIAL_CONTROLS.hueShift, min: -1, max: 1, step: 0.01 },
    noiseScale: { value: DEFAULT_MATERIAL_CONTROLS.noiseScale, min: 0, max: 10, step: 0.1 },
    noiseStrength: { value: DEFAULT_MATERIAL_CONTROLS.noiseStrength, min: 0, max: 1, step: 0.01 },
    speed : {value: DEFAULT_MATERIAL_CONTROLS.speed, min: 0, max: 1, step: 0.01 },
  }, { collapsed: true })
}

// Main component
export function VATMesh({
  gltf,
  posTex,
  nrmTex = null,
  mapTex = null,
  maskTex = null,
  metaData,
  speed = 1,
  timeOffset = 0,
  paused = false,
  useDepthMaterial = true,
  frame: externalFrame,
  ...rest
}: VATMeshProps) {
  const materialControls = useMaterialControls()

  const groupRef = useRef<THREE.Group>(null!)
  const materialsRef = useRef<CustomShaderMaterial[]>([])
  const startTimeRef = useRef<number>(0)
  const { scene } = useThree()
  
  const [seed] = useState(() => THREE.MathUtils.randFloat(0, 1000))

  // Create materials and clone scene for this instance
  useEffect(() => {
    materialsRef.current.length = 0

    // Clone the scene for this instance to avoid sharing geometry between instances
    const clonedScene = gltf.clone()
    
    clonedScene.traverse((object: any) => {
      if (object.isMesh) {
        const mesh = object as THREE.Mesh

        ensureUV2ForVAT(mesh.geometry, metaData)

        // Create unique materials for this instance
        const vatMaterial = createVATMaterial(posTex, nrmTex, mapTex, maskTex, scene.environment, metaData, materialControls)
        vatMaterial.uniforms.uSeed.value = seed
        vatMaterial.uniforms.uHueShift.value = DEFAULT_MATERIAL_CONTROLS.hueShift
        mesh.material = vatMaterial
        materialsRef.current.push(vatMaterial)

        // Optionally add custom depth material
        if (useDepthMaterial) {
          const vatDepthMaterial = createVATDepthMaterial(posTex, nrmTex, metaData)
          vatDepthMaterial.uniforms.uSeed.value = seed
          vatDepthMaterial.uniforms.uHueShift.value = DEFAULT_MATERIAL_CONTROLS.hueShift
          mesh.customDepthMaterial = vatDepthMaterial
          materialsRef.current.push(vatDepthMaterial)
        }

        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.frustumCulled = false
      }
    })

    // Store the cloned scene reference
    if (groupRef.current) {
      groupRef.current.clear()
      groupRef.current.add(clonedScene)
    }

    startTimeRef.current = performance.now() / 1000
  }, [gltf, posTex, nrmTex, metaData, useDepthMaterial, seed])

  // Update material properties
  useEffect(() => {
    for (const material of materialsRef.current) {
      updateVATMaterial(material, materialControls)
    }
  }, [materialControls])

  // Update depth material properties (frame animation)
  useEffect(() => {
    for (const material of materialsRef.current) {
      // Update frame uniform for all materials (both physical and depth)
      if (material.uniforms?.uFrame) {
        material.uniforms.uFrame.value = 0.0 // Reset to frame 0
      }
    }
  }, [useDepthMaterial])

  // Animation frame update
  useFrame((state) => {
    if (paused) return

    const currentTime = state.clock.elapsedTime
    
    // Use external frame if provided, otherwise use normal animation
    let frame: number
    
    if (externalFrame !== undefined) {
      // External frame control
      frame = Math.min(externalFrame * metaData.frameCount, metaData.frameCount - 5)
    } else {
      // Normal VAT animation
      frame = currentTime * (metaData.fps * speed) % metaData.frameCount
    }
    
    // Update materials
    for (const material of materialsRef.current) {
      if (material.uniforms?.uFrame) {
        material.uniforms.uFrame.value = frame
      }
      if (material.uniforms?.uTime) {
        material.uniforms.uTime.value = currentTime * materialControls.speed
      }
    }
  })

  return (
    <group ref={groupRef} {...rest}/>
  )
}