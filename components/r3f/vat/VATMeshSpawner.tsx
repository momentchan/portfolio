import React, { useState, useEffect } from 'react'
import { VATMeshLifecycle } from './VATMeshLifecycle'
import { VATMesh } from './VATMesh'
import { useVATPreloader } from './VATPreloader'

// VATMesh spawner with lifecycle animation
export function VATMeshSpawner() {
  const [spawnedMeshes, setSpawnedMeshes] = useState<{id: number, position: [number, number, number]}[]>([])
  const [meshCounter, setMeshCounter] = useState(0)
  
  // Preload VAT resources
  const { gltf, posTex, nrmTex, mapTex, maskTex, meta, isLoaded } = useVATPreloader(
    "vat/Dahlia Clean_basisMesh.gltf",
    "vat/Dahlia Clean_pos.exr",
    "vat/Dahlia Clean_nrm.png",
    "textures/tujlip.png",
    "textures/blackanedwthioe.png",
    "vat/Dahlia Clean_meta.json"
  )

  // Pre-warm GPU by creating a hidden VATMesh when resources are loaded
  const [preWarmed, setPreWarmed] = useState(false)
  
  useEffect(() => {
    if (isLoaded && !preWarmed) {
      console.log('Pre-warming GPU with hidden VATMesh...')
      setPreWarmed(true)
    }
  }, [isLoaded, preWarmed])

  const spawnVATMesh = () => {
    if (!isLoaded) {
      console.log('Resources not loaded yet, cannot spawn')
      console.log('Loaded state:', { gltf: !!gltf, posTex: !!posTex, nrmTex: !!nrmTex, mapTex: !!mapTex, maskTex: !!maskTex, meta: !!meta })
      return
    }
    console.log('Spawning VATMesh with ID:', meshCounter)
    const newId = meshCounter
    const currentCount = spawnedMeshes.length
    // Spawn inside sphere with uniform distribution
    const radius = 0.5 // Sphere radius
    const theta = Math.random() * Math.PI * 2 // 0 to 2π
    const phi = Math.acos(2 * Math.random() - 1) // 0 to π
    const r = Math.cbrt(Math.random()) * radius // Cube root for uniform volume distribution
    
    const position: [number, number, number] = [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    ]
    setSpawnedMeshes(prev => [...prev, { id: newId, position }])
    setMeshCounter(prev => prev + 1)
  }

  const removeVATMesh = (id: number) => {
    setSpawnedMeshes(prev => prev.filter(mesh => mesh.id !== id))
  }

  // Keyboard event handler for F key spawning
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
          // Lifecycle animation props
          maxScale={5}
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
