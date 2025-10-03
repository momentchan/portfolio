import React, { useState } from 'react'
import { VATMeshLifecycle } from './VATMeshLifecycle'
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

  const spawnVATMesh = () => {
    if (!isLoaded) {
      console.log('Resources not loaded yet, cannot spawn')
      console.log('Loaded state:', { gltf: !!gltf, posTex: !!posTex, nrmTex: !!nrmTex, mapTex: !!mapTex, maskTex: !!maskTex, meta: !!meta })
      return
    }
    console.log('Spawning VATMesh with ID:', meshCounter)
    const newId = meshCounter
    const currentCount = spawnedMeshes.length
    const position: [number, number, number] = [
      (currentCount % 3 - 1) * 0.1, // Spread horizontally
      Math.random() * 0.1,           // Random height
      (Math.floor(currentCount / 3) - 1) * 0.1 // Spread in depth
    ]
    setSpawnedMeshes(prev => [...prev, { id: newId, position }])
    setMeshCounter(prev => prev + 1)
  }

  const removeVATMesh = (id: number) => {
    setSpawnedMeshes(prev => prev.filter(mesh => mesh.id !== id))
  }

  return (
    <group>
      {/* Spawn button (you can trigger this from UI) */}
      <mesh onClick={spawnVATMesh} position={[0, 0, 0]} scale={0.1}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color={isLoaded ? "hotpink" : "gray"} />
      </mesh>

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
