import React, { useState, useEffect } from 'react'
import { VATMeshLifecycle } from './VATMeshLifecycle'
import { VATMesh } from './VATMesh'
import { useVATPreloader } from './VATPreloader'
import { SpawnedMeshData } from './types'
import { AutoSpawner } from './AutoSpawner'
import { MathUtils, Vector3 } from 'three'
import { generateValidPosition, createSpawnId } from './utils'

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
  const [paused, setPaused] = useState(false)

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

  // Common VAT props shared across all spawned meshes
  const VATProps = {
    gltf: gltf.scene,
    posTex,
    nrmTex,
    mapTex,
    maskTex,
    metaData: meta
  }

  // Pre-warm GPU by creating a hidden VATMesh when resources are loaded
  const [preWarmed, setPreWarmed] = useState(false)

  useEffect(() => {
    if (isLoaded && !preWarmed) {
      console.log('Pre-warming GPU with hidden VATMesh...')
      setPreWarmed(true)
    }
  }, [isLoaded, preWarmed])


  const spawnVATMesh = () => {
    if (!isLoaded) return

    const position = generateValidPosition(spawnedMeshes, 0.5, 0.1)
    if (!position) return

    const newId = createSpawnId(meshCounter)
    const holdDuration = MathUtils.randFloat(3, 7)
    const animDuration = MathUtils.randFloat(2.5, 4.5)
    const scale = MathUtils.randFloat(0.5, 1) * 5

    setSpawnedMeshes(prev => [...prev, { 
      id: newId, 
      position: [position.x, position.y, position.z], 
      scale, 
      holdDuration, 
      animDuration 
    }])
    setMeshCounter(prev => prev + 1)
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
      if (event.code === 'Space') {
        event.preventDefault()
        setPaused(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLoaded])

  return (
    <group>
      {/* Auto-spawner component */}
      <AutoSpawner
        isActive={isLoaded}
        onSpawn={spawnVATMesh}
        minInterval={2000}
        maxInterval={5000}
        burstEnabled={true}
        burstInterval={[20000, 30000]}
        burstCount={[10, 15]}
        burstDuration={3000}
        enabled={true}
      />

      {isLoaded && preWarmed && (
        <VATMesh
          {...VATProps}
          position={[-1000, -1000, -1000]}
          frameRatio={0}
        />
      )}

      {spawnedMeshes.map((mesh) => (
        <VATMeshLifecycle
          key={mesh.id}
          {...VATProps}
          position={mesh.position}
          id={mesh.id}
          maxScale={mesh.scale}
          frameForwardDuration={mesh.animDuration}
          frameHoldDuration={mesh.holdDuration}
          frameBackwardDuration={mesh.animDuration}
          scaleInDuration={mesh.animDuration * 0.33}
          scaleOutDuration={mesh.animDuration * 0.33}
          rotateInDuration={mesh.animDuration * 0.67}
          rotateOutDuration={mesh.animDuration * 0.67}
          paused={paused}
          onComplete={() => removeVATMesh(mesh.id)}
        />
      ))}
    </group>
  )
}
