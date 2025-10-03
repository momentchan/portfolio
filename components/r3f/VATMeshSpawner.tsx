import React, { useState } from 'react'
import { VATMeshLifecycle } from './VATMeshLifecycle'
import { useVATPreloader } from './VATPreloader'

// VATMesh spawner with lifecycle animation
export function VATMeshSpawner() {
  const [spawnedMeshes, setSpawnedMeshes] = useState<number[]>([])
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
    setSpawnedMeshes(prev => [...prev, newId])
    setMeshCounter(prev => prev + 1)
  }

  const removeVATMesh = (id: number) => {
    setSpawnedMeshes(prev => prev.filter(meshId => meshId !== id))
  }

  return (
    <group>
      {/* Spawn button (you can trigger this from UI) */}
      <mesh onClick={spawnVATMesh} position={[0, 0, 0]} scale={0.1}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color={isLoaded ? "hotpink" : "gray"} />
      </mesh>

      {/* Spawned VAT meshes with lifecycle animation */}
      {spawnedMeshes.map((id, index) => (
        <VATMeshLifecycle
          key={id}
          gltf={gltf.scene}
          posTex={posTex}
          nrmTex={nrmTex}
          mapTex={mapTex}
          maskTex={maskTex}
          metaData={meta}
          position={[
            (index % 3 - 1) * 0.1, // Spread horizontally
            Math.random() * 0.1,   // Random height
            (Math.floor(index / 3) - 1) * 0.1 // Spread in depth
          ]}
          // Lifecycle animation props
          maxScale={5}
          // Frame timing
          frameForwardDuration={3}  // 1.5 seconds to play forward
          frameHoldDuration={5.0}     // 5 seconds to hold at frame 1
          frameBackwardDuration={3} // 1.5 seconds to play backward
          // Scaling timing
          scaleInDuration={1}       // 2 seconds to scale in (starts with frame start)
          scaleOutDuration={1}      // 2 seconds to scale out (ends with frame complete)
          onComplete={() => removeVATMesh(id)}
        />
      ))}
    </group>
  )
}
