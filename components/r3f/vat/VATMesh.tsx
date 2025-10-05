import * as THREE from 'three'
import React, { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { useControls } from 'leva'
import { VATMeshProps, VATMaterialControls, DEFAULT_MATERIAL_CONTROLS } from './types'
import { createVATMaterial, createVATDepthMaterial, updatePhysicalProperties, updateAdvancedProperties } from './materials'
import { ensureUV2ForVAT } from './utils'
import { InteractiveTrigger } from './InteractiveTrigger'
import { gsap } from 'gsap'

// Material properties controls (physical + advanced combined)
function useMaterialPropertiesControls() {
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
    bumpScale: { value: DEFAULT_MATERIAL_CONTROLS.bumpScale, min: 0, max: 1, step: 0.01 },
    sheen: { value: DEFAULT_MATERIAL_CONTROLS.sheen, min: 0, max: 1, step: 0.01 },
    sheenRoughness: { value: DEFAULT_MATERIAL_CONTROLS.sheenRoughness, min: 0, max: 1, step: 0.01 },
    sheenColor: DEFAULT_MATERIAL_CONTROLS.sheenColor,
    iridescence: { value: DEFAULT_MATERIAL_CONTROLS.iridescence, min: 0, max: 1, step: 0.01 },
    iridescenceIOR: { value: DEFAULT_MATERIAL_CONTROLS.iridescenceIOR, min: 1, max: 2.333, step: 0.01 },
    iridescenceThicknessMin: { value: DEFAULT_MATERIAL_CONTROLS.iridescenceThicknessMin, min: 0, max: 1000, step: 10 },
    iridescenceThicknessMax: { value: DEFAULT_MATERIAL_CONTROLS.iridescenceThicknessMax, min: 0, max: 1000, step: 10 },
    attenuationDistance: { value: DEFAULT_MATERIAL_CONTROLS.attenuationDistance, min: 0.01, max: 10, step: 0.01 },
    attenuationColor: DEFAULT_MATERIAL_CONTROLS.attenuationColor,
  }, { collapsed: true })
}

function useShaderControls() {
  return useControls('VAT.Shader', {
    hueShift: { value: DEFAULT_MATERIAL_CONTROLS.hueShift, min: -1, max: 1, step: 0.01 },
    noiseScale: { value: DEFAULT_MATERIAL_CONTROLS.noiseScale, min: 0, max: 10, step: 0.1 },
    noiseStrength: { value: DEFAULT_MATERIAL_CONTROLS.noiseStrength, min: 0, max: 1, step: 0.01 },
    speed: { value: DEFAULT_MATERIAL_CONTROLS.speed, min: 0, max: 1, step: 0.01 },
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
  interactive = false,
  triggerSize = 1,
  id,
  ...rest
}: VATMeshProps) {
  const materialPropertiesControls = useMaterialPropertiesControls()
  const shaderControls = useShaderControls()

  // Combined controls for backward compatibility
  const materialControls = {
    ...materialPropertiesControls,
    ...shaderControls
  }

  const groupRef = useRef<THREE.Group>(null!)
  const materialsRef = useRef<CustomShaderMaterial[]>([])
  const startTimeRef = useRef<number>(0)
  const { scene } = useThree()

  const seedRef = useRef(THREE.MathUtils.randFloat(0, 1000))
  const spawnTimeRef = useRef(performance.now() / 1000) // Global spawn time
  const hueCycle = 120

  const triggerRate = useRef({ value: 0 })
  const timeRef = useRef({ value: 0 })
  const [hovering, setHovering] = useState(false)

  // Custom trigger handler for VATMesh-specific behavior
  const handleVATMeshTrigger = (triggerType: 'click' | 'hover' | 'collision', data?: any) => {
    switch (triggerType) {
      case 'click':
        // console.log(`VATMesh ${id} was clicked!`)
        break

      case 'hover':
        if (data?.data?.isHovered) {
          // console.log(`VATMesh ${id} hover entered`)
          setHovering(true)
        } else {
          // console.log(`VATMesh ${id} hover exited`)
          setHovering(false)
        }
        break

      case 'collision':
        break
    }
  }

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
        mesh.material = vatMaterial
        materialsRef.current.push(vatMaterial)

        // Optionally add custom depth material
        if (useDepthMaterial) {
          const vatDepthMaterial = createVATDepthMaterial(posTex, nrmTex, metaData)
          mesh.customDepthMaterial = vatDepthMaterial
          materialsRef.current.push(vatDepthMaterial)
        }

        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.frustumCulled = false
      }
    })

    if (groupRef.current) {
      // Clear only VAT objects, keep interactive elements
      const vatObjects = groupRef.current.children.filter(child =>
        child.userData.isVAT !== false // Keep non-VAT objects
      )
      vatObjects.forEach(child => groupRef.current!.remove(child))

      // Mark the cloned scene as VAT
      clonedScene.userData.isVAT = true
      clonedScene.traverse((child) => {
        child.userData.isVAT = true
      })

      groupRef.current.add(clonedScene)
    }

    startTimeRef.current = performance.now() / 1000
  }, [gltf, posTex, nrmTex, metaData, useDepthMaterial])

  useEffect(() => {
    for (const material of materialsRef.current) {
      updatePhysicalProperties(material, materialPropertiesControls)
      updateAdvancedProperties(material, materialPropertiesControls)
    }
  }, [materialPropertiesControls])

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
  useFrame((state, delta) => {
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

    // interactive
    triggerRate.current.value += hovering ? delta * 2.0 : 0
    triggerRate.current.value -= delta;
    triggerRate.current.value = Math.max(0, Math.min(triggerRate.current.value, 1))

    timeRef.current.value += delta * materialControls.speed * (1 + triggerRate.current.value * 1)

    // Update materials
    for (const material of materialsRef.current) {
      material.uniforms.uFrame.value = frame
      material.uniforms.uTime.value = timeRef.current.value

      // Update shader uniforms in real-time
      material.uniforms.uSeed.value = seedRef.current
      material.uniforms.uNoiseScale.value = shaderControls.noiseScale
      material.uniforms.uNoiseStrength.value = shaderControls.noiseStrength
      material.uniforms.uHueShift.value = shaderControls.hueShift + (spawnTimeRef.current / hueCycle) % 1
      material.uniforms.uTriggerRate.value = triggerRate.current.value
    }

  })

  return (
    <>
      <group ref={groupRef} {...rest}>
        {interactive && (
          <InteractiveTrigger
            size={triggerSize}
            position={[0, 0, 0]}
            onTrigger={handleVATMeshTrigger}
            id={id}
            visible={true}
            color="#ffffff"
            opacity={0.2}
            wireframe={true}
          />
        )}
      </group>
    </>
  )
}