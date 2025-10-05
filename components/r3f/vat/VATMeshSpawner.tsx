import React, { useState, useEffect, useRef } from 'react'
import { VATMeshLifecycle } from './VATMeshLifecycle'
import { VATMesh } from './VATMesh'
import { useVATPreloader } from './VATPreloader'
import { SpawnedMeshData } from './types'
import { generateSpherePosition } from './utils'
import { MathUtils } from 'three'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { GPUSpawner } from './gpuSpawn'
import { useTrailContext } from '../contexts/TrailContext'

// VATMesh spawner with lifecycle animation
export function VATMeshSpawner() {
  const { gl } = useThree()
  const { nodeTexture } = useTrailContext()
  const [spawnedMeshes, setSpawnedMeshes] = useState<SpawnedMeshData[]>([])
  const [meshCounter, setMeshCounter] = useState(0)
  const gpuSpawnerRef = useRef<GPUSpawner | null>(null)

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

  // Initialize GPU spawner when nodeTexture and gl are available
  useEffect(() => {
    if (nodeTexture && gl && !gpuSpawnerRef.current) {
      gpuSpawnerRef.current = new GPUSpawner(gl, nodeTexture)
    } else if (gpuSpawnerRef.current && nodeTexture) {
      gpuSpawnerRef.current.updateNodeTexture(nodeTexture)
    } else if (gpuSpawnerRef.current && gl) {
      gpuSpawnerRef.current.updateRenderer(gl)
    }
  }, [nodeTexture, gl])

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

  const nodeIndex = useRef(0)

  // Keyboard event handler for F key spawning and N key for node position testing
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyF') {
        event.preventDefault()
        spawnVATMesh()
      }
      if (event.code === 'KeyG') {
        event.preventDefault()
        if (gpuSpawnerRef.current) {
          // Get spawn data for target node (trail 0, nodeIndex)
          const spawnData = gpuSpawnerRef.current.getSpawnData(0, nodeIndex.current)
          if (spawnData) {
            spawnVATMeshAt(spawnData.position)
            nodeIndex.current = (nodeIndex.current + 5) % nodeTexture!.image.width
          } else {
            console.log('Failed to get target position')
          }
        } else {
          console.log('GPU spawner not available')
        }
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
