import * as THREE from 'three'
import React, { useEffect, useLayoutEffect, useRef, useState, forwardRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { useControls } from 'leva'
import { VATMeshProps } from './types'
import { updatePhysicalProperties, updateAdvancedProperties } from './materials'
import { InteractiveTrigger } from './InteractiveTrigger'
import { VATParticleSystem } from '../customParticle'
import { cloneAndSetupVATScene, calculateVATFrame } from './utils/materialSetup'

const HUE_CYCLE = 120

export const VATMesh = forwardRef<THREE.Group, VATMeshProps>(function VATMesh({
  gltf,
  posTex,
  nrmTex = null,
  mapTex = null,
  maskTex = null,
  metaData,
  vatSpeed = 1,
  paused = false,
  useDepthMaterial = true,
  frameRatio,
  interactive = true,
  triggerSize = 1,
  id,
  globalRatio,
  manual = false,
  ...rest
}: VATMeshProps, ref) {
  const materialPropertiesControls = useControls('VAT.Material', {
    roughness: { value: 0.4, min: 0, max: 1, step: 0.01 },
    metalness: { value: 0.6, min: 0, max: 1, step: 0.01 },
    transmission: { value: 0, min: 0, max: 1, step: 0.01 },
    thickness: { value: 0, min: 0, max: 10, step: 0.1 },
    ior: { value: 1.5, min: 1, max: 2.5, step: 0.01 },
    clearcoat: { value: 0.1, min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    reflectivity: { value: 0.5, min: 0, max: 1, step: 0.01 },
    envMapIntensity: { value: 1, min: 0, max: 2, step: 0.1 },
    bumpScale: { value: 1.0, min: 0, max: 1, step: 0.01 },
    sheen: { value: 0, min: 0, max: 1, step: 0.01 },
    sheenRoughness: { value: 0.1, min: 0, max: 1, step: 0.01 },
    sheenColor: '#3695ff',
    iridescence: { value: 0, min: 0, max: 1, step: 0.01 },
    iridescenceIOR: { value: 1.3, min: 1, max: 2.333, step: 0.01 },
    iridescenceThicknessMin: { value: 100, min: 0, max: 1000, step: 10 },
    iridescenceThicknessMax: { value: 400, min: 0, max: 1000, step: 10 },
    attenuationDistance: { value: Infinity, min: 0.01, max: 10, step: 0.01 },
    attenuationColor: '#ffffff',
  }, { collapsed: true })

  const shaderControls = useControls('VAT.Shader', {
    noiseScale: { value: 1, min: 0, max: 10, step: 0.1 },
    noiseStrength: { value: 0.3, min: 0, max: 1, step: 0.01 },
    waveSpeed: { value: 0.3, min: 0, max: 1, step: 0.01 },
  }, { collapsed: true })

  const materialControls = { ...materialPropertiesControls, ...shaderControls }

  const groupRef = useRef<THREE.Group>(null!)
  const materialsRef = useRef<CustomShaderMaterial[]>([])
  const vatMesh = useRef<THREE.Mesh>(null!)
  const clonedSceneRef = useRef<THREE.Group | null>(null)
  const { scene } = useThree()

  const seed = useRef(THREE.MathUtils.randFloat(0, 1000))
  const spawnTimeRef = useRef(performance.now() / 1000)
  const triggerRate = useRef({ value: 0 })
  const [time, setTime] = useState(0)
  const [hovering, setHovering] = useState(false)

  const handleVATMeshTrigger = (triggerType: 'click' | 'hover' | 'collision', data?: any) => {
    if (triggerType === 'hover') {
      setHovering(data?.data?.isHovered ?? false)
    }
  }

  // Create materials and clone scene
  useEffect(() => {
    // Remove old scene if exists
    if (clonedSceneRef.current && groupRef.current) {
      groupRef.current.remove(clonedSceneRef.current)
    }

    const { scene: clonedScene, materials, mesh } = cloneAndSetupVATScene(
      gltf, posTex, nrmTex, mapTex, maskTex, scene.environment, metaData, materialControls, useDepthMaterial, manual
    )

    materialsRef.current = materials
    if (mesh) vatMesh.current = mesh
    clonedSceneRef.current = clonedScene

    if (groupRef.current) {
      groupRef.current.add(clonedScene)
    }

    return () => {
      if (clonedSceneRef.current && groupRef.current) {
        groupRef.current.remove(clonedSceneRef.current)
      }
    }
  }, [gltf, posTex, nrmTex, metaData, useDepthMaterial, manual])

  useEffect(() => {
    for (const material of materialsRef.current) {
      updatePhysicalProperties(material, materialPropertiesControls)
      updateAdvancedProperties(material, materialPropertiesControls)
    }
  }, [materialPropertiesControls])

  useFrame((state, delta) => {
    if (paused) return

    const frame = calculateVATFrame(frameRatio, state.clock.elapsedTime, metaData, vatSpeed)

    triggerRate.current.value += hovering ? delta * 10.0 : 0
    triggerRate.current.value -= delta
    triggerRate.current.value = Math.max(0, Math.min(triggerRate.current.value, 1))

    setTime(time + delta * materialControls.waveSpeed * (1 + triggerRate.current.value * 2.0))

    for (const material of materialsRef.current) {
      material.uniforms.uFrame.value = frame
      material.uniforms.uTime.value = time
      material.uniforms.uSeed.value = seed.current
      material.uniforms.uNoiseScale.value = shaderControls.noiseScale
      material.uniforms.uNoiseStrength.value = shaderControls.noiseStrength
      material.uniforms.uHueShift.value = (spawnTimeRef.current / HUE_CYCLE) % 1
      material.uniforms.uTriggerRate.value = triggerRate.current.value
      material.uniforms.uManual.value = manual ? 1 : 0
    }
  })

  return (
    <group ref={ref || groupRef} {...rest}>
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
      {vatMesh.current && (
        <VATParticleSystem
          frame={frameRatio || 0}
          posTex={posTex}
          meta={metaData}
          geometry={vatMesh.current.geometry}
          storeDelta={1}
          animateRate={(time + seed.current) % 1}
          globalRatio={globalRatio}
        />
      )}
    </group>
  )
})
