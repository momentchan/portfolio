import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { VATMeshLifecycle } from './VATMeshLifecycle'
import { VATMesh } from './VATMesh'
import { useVATPreloader } from './VATPreloader'
import { SpawnedMeshData } from './types'
import { AutoSpawner } from './AutoSpawner'
import { MathUtils, Vector3 } from 'three'
import { generateValidPosition, createSpawnId } from './utils'
import { screenToWorldAtDepth } from './utils'
import GlobalState from '../../common/GlobalStates';

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
  const { camera } = useThree()
  const [spawnedMeshes, setSpawnedMeshes] = useState<SpawnedMeshData[]>([])
  const [meshCounter, setMeshCounter] = useState(0)
  const { started, paused } = GlobalState()

  // Use refs to always have latest values in callbacks
  const startedRef = useRef(started)
  const pausedRef = useRef(paused)

  useEffect(() => {
    startedRef.current = started
    pausedRef.current = paused
  }, [started, paused])

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
    if (isLoaded && !preWarmed && started) {
      console.log('Pre-warming GPU with hidden VATMesh...')
      setPreWarmed(true)
    }
  }, [isLoaded, preWarmed, started])


  const spawnVATMesh = useCallback((position?: Vector3) => {
    if (!isLoaded || !startedRef.current || pausedRef.current) return

    setSpawnedMeshes(prev => {
      const spawnPosition = position || generateValidPosition(prev, 0.5, 0.1)
      if (!spawnPosition) return prev

      setMeshCounter(counter => counter + 1)

      const newId = createSpawnId(prev.length)
      const holdDuration = MathUtils.randFloat(3, 7)
      const animDuration = MathUtils.randFloat(2.5, 4.5)
      const scale = MathUtils.randFloat(0.5, 1) * 5

      return [...prev, {
        id: newId,
        position: [spawnPosition.x, spawnPosition.y, spawnPosition.z],
        scale,
        holdDuration,
        animDuration,
        manual: position ? true : false
      }]
    })
  }, [isLoaded])

  const removeVATMesh = useCallback((id: number) => {
    setSpawnedMeshes(prev => prev.filter(mesh => mesh.id !== id))
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyF') {
        event.preventDefault()
        spawnVATMesh()
      }
    }

    const handleClick = (event: MouseEvent) => {
      if (!isLoaded) return

      // Check if click is within AudioUICanvas area (bottom-right corner)
      // Assuming AudioUICanvas is 40px × 40px at bottom-right with 5px offset
      const canvasSize = 40; // radius * 4 (10 * 4)
      const bottomOffset = 5;
      const rightOffset = 5;
      
      const isInAudioUI = (
        event.clientX >= window.innerWidth - canvasSize - rightOffset &&
        event.clientY >= window.innerHeight - canvasSize - bottomOffset
      );

      if (isInAudioUI) return; // Don't spawn if clicking audio UI

      const pointer = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      }

      const worldPos = screenToWorldAtDepth(pointer, camera, MathUtils.randFloat(1, 2))
      spawnVATMesh(worldPos)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleClick)
    }
  }, [isLoaded, camera])

  return (
    <group>
      {/* Auto-spawner component */}
      <AutoSpawner
        isActive={isLoaded}
        onSpawn={spawnVATMesh}
        minInterval={2000}
        maxInterval={5000}
        initialDelay={5000}  // Wait 3 seconds before first spawn
        burstEnabled={true}
        burstInterval={[20000, 30000]}
        burstCount={[10, 15]}
        burstDuration={3000}
        enabled={started && !paused}
      />

      {preWarmed && (
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
          manual={mesh.manual}
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
