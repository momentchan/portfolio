import React, { useState, useEffect, useRef } from 'react'
import { VATMeshLifecycle } from './VATMeshLifecycle'
import { VATMesh } from './VATMesh'
import { useVATPreloader } from './VATPreloader'
import { SpawnedMeshData } from './types'
import { generateSpherePosition } from './utils'
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
    console.log('Spawning VATMesh with ID:', meshCounter)
    const newId = Date.now() + meshCounter // Use timestamp + counter for guaranteed uniqueness
    const scale = MathUtils.randFloat(0.5, 1) * 5 // Random scale between 0.5 and 1.0

    const positionArray: [number, number, number] = [position.x, position.y, position.z]
    setSpawnedMeshes(prev => [...prev, { id: newId, position: positionArray, scale }])
    setMeshCounter(prev => prev + 1)
  }

  const spawnVATMesh = () => {
    const position = generateSpherePosition(0.5) // Radius of 0.5
    spawnVATMeshAt(new THREE.Vector3(position[0], position[1], position[2]))
  }

  const removeVATMesh = (id: number) => {
    setSpawnedMeshes(prev => prev.filter(mesh => mesh.id !== id))
  }

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

  // Auto-spawn test function - spawns VAT every 2 seconds
  useEffect(() => {
    if (!isLoaded) return

    const interval = setInterval(() => {
      spawnVATMesh()
    }, 5000) // 2 seconds

    return () => clearInterval(interval)
  }, [isLoaded])

  return (
    <group>

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
          frameForwardDuration={3}  // 3 seconds to play forward
          frameHoldDuration={5.0}   // 5 seconds to hold at frame 1
          frameBackwardDuration={3} // 3 seconds to play backward
          // Scaling timing
          scaleInDuration={1}       // 1 second to scale in (starts with frame start)
          scaleOutDuration={1}      // 1 second to scale out (ends with frame complete)
          // Rotation timing
          rotateInDuration={2}    // 2 seconds to rotate in (starts with frame start)
          rotateOutDuration={2}   // 2 seconds to rotate out (ends with frame complete)
          onComplete={() => removeVATMesh(mesh.id)}
        />
      ))}
    </group>
  )
}
