import React, { useState, useEffect, useRef } from 'react'
import { VATMeshLifecycle } from './VATMeshLifecycle'
import { VATMesh } from './VATMesh'
import { useVATPreloader } from './VATPreloader'
import { SpawnedMeshData } from './types'
import { generateSpherePosition } from './utils'
import { AutoSpawner } from './AutoSpawner'
import { MathUtils } from 'three'
import * as THREE from 'three'

export interface VATData {
  gltfPath: string
  posTexPath: string
  nrmTexPath: string
  mapTexPath: string
  maskTexPath: string
  metaPath: string
}

interface VATMeshSpawnerProps {
  vatData?: VATData
}

// VATMesh spawner with lifecycle animation
export function VATMeshSpawner({ vatData }: VATMeshSpawnerProps = {}) {
  const [spawnedMeshes, setSpawnedMeshes] = useState<SpawnedMeshData[]>([])
  const [meshCounter, setMeshCounter] = useState(0)

  // Default VAT data
  const defaultVATData: VATData = {
    gltfPath: "vat/Dahlia Clean_basisMesh.gltf",
    posTexPath: "vat/Dahlia Clean_pos.exr",
    nrmTexPath: "vat/Dahlia Clean_nrm.png",
    mapTexPath: "textures/tujlip.png",
    maskTexPath: "textures/blackanedwthioe.png",
    metaPath: "vat/Dahlia Clean_meta.json"
  }

  // Use provided VAT data or fall back to defaults
  const currentVATData = vatData || defaultVATData

  // Preload VAT resources
  const { gltf, posTex, nrmTex, mapTex, maskTex, meta, isLoaded } = useVATPreloader(
    currentVATData.gltfPath,
    currentVATData.posTexPath,
    currentVATData.nrmTexPath,
    currentVATData.mapTexPath,
    currentVATData.maskTexPath,
    currentVATData.metaPath
  )

  // Pre-warm GPU by creating a hidden VATMesh when resources are loaded
  const [preWarmed, setPreWarmed] = useState(false)

  useEffect(() => {
    if (isLoaded && !preWarmed) {
      console.log('Pre-warming GPU with hidden VATMesh...')
      setPreWarmed(true)
    }
  }, [isLoaded, preWarmed])


  const spawnVATMeshAt = (position: THREE.Vector3) => {
    if (!isLoaded) {
      console.log('Resources not loaded yet, cannot spawn')
      console.log('Loaded state:', { gltf: !!gltf, posTex: !!posTex, nrmTex: !!nrmTex, mapTex: !!mapTex, maskTex: !!maskTex, meta: !!meta })
      return
    }
    const newId = Date.now() + meshCounter + Math.random() * 1000000 // Use timestamp + counter + random for guaranteed uniqueness
    const scale = MathUtils.randFloat(0.5, 1) * 5 // Random scale between 0.5 and 1.0

    const positionArray: [number, number, number] = [position.x, position.y, position.z]
    const holdDuration = MathUtils.randFloat(3, 7)
    const animDuration = MathUtils.randFloat(2.5, 4.5)
    setSpawnedMeshes(prev => [...prev, { id: newId, position: positionArray, scale, holdDuration, animDuration }])
    setMeshCounter(prev => prev + 1)
  }

  // Check if position is too close to existing VAT meshes
  const isPositionValid = (position: THREE.Vector3, minDistance: number = 0.1): boolean => {
    return !spawnedMeshes.some(mesh => {
      const meshPos = new THREE.Vector3(mesh.position[0], mesh.position[1], mesh.position[2])
      const distance = position.distanceTo(meshPos)
      return distance < minDistance
    })
  }

  // Generate a valid position that doesn't collide with existing meshes
  const generateValidPosition = (maxAttempts: number = 50): THREE.Vector3 | null => {
    for (let i = 0; i < maxAttempts; i++) {
      const position = generateSpherePosition(0.5) // Radius of 0.5
      const vectorPosition = new THREE.Vector3(position[0], position[1], position[2])
      
      if (isPositionValid(vectorPosition)) {
        return vectorPosition
      }
    }
    return null // Couldn't find a valid position after max attempts
  }

  const spawnVATMesh = () => {
    const validPosition = generateValidPosition()
    if (validPosition) {
      spawnVATMeshAt(validPosition)
    } else {
      console.warn('Could not find a valid spawn position - too many VAT meshes nearby')
    }
  }

  const removeVATMesh = (id: number) => {
    setSpawnedMeshes(prev => prev.filter(mesh => mesh.id !== id))
  }

  // Auto-spawn state

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyF') {
        event.preventDefault()
        spawnVATMesh()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLoaded, meshCounter, spawnedMeshes.length])

  return (
    <group>
      {/* Auto-spawner component */}
      <AutoSpawner
        isActive={isLoaded}
        onSpawn={spawnVATMesh}
        minInterval={2000}
        maxInterval={5000}
        burstEnabled={true}
        burstInterval={[20000, 30000]} // 25-30 seconds between bursts
        burstCount={[10, 15]} // 10-15 VATs per burst
        burstDuration={3000} // 5 seconds to spawn all burst VATs
      />

      {/* Pre-warm GPU with hidden VATMesh */}
      {isLoaded && preWarmed && (
        <VATMesh
          gltf={gltf.scene}
          posTex={posTex}
          nrmTex={nrmTex}
          mapTex={mapTex}
          maskTex={maskTex}
          metaData={meta}
          position={[-1000, -1000, -1000]} // Hidden position
          frame={0} // Start at frame 0
        />
      )}

      {/* Spawned VAT meshes with lifecycle animation */}
      {spawnedMeshes.map((mesh) => (
        <VATMeshLifecycle
          key={mesh.id}
          gltf={gltf.scene}
          posTex={posTex}
          nrmTex={nrmTex}
          mapTex={mapTex}
          maskTex={maskTex}
          metaData={meta}
          position={mesh.position}
          id={mesh.id}
          // Lifecycle animation props
          maxScale={mesh.scale}
          // Frame timing
          frameForwardDuration={mesh.animDuration}  // 3 seconds to play forward
          frameHoldDuration={mesh.holdDuration}   // Random 3-7 seconds to hold at frame 1
          frameBackwardDuration={mesh.animDuration} // 3 seconds to play backward
          // Scaling timing
          scaleInDuration={mesh.animDuration * 0.33}       // 1 second to scale in (starts with frame start)
          scaleOutDuration={mesh.animDuration * 0.33}      // 1 second to scale out (ends with frame complete)
          // Rotation timing
          rotateInDuration={mesh.animDuration * 0.67}    // 2 seconds to rotate in (starts with frame start)
          rotateOutDuration={mesh.animDuration * 0.67}   // 2 seconds to rotate out (ends with frame complete)
          onComplete={() => removeVATMesh(mesh.id)}
        />
      ))}
    </group>
  )
}
