import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { MathUtils, Vector3, Group } from 'three'
import * as THREE from 'three'

import { VATMeshLifecycle } from './VATMeshLifecycle'
import { VATMesh } from './VATMesh'
import { useVATPreloader } from './VATPreloader'
import { SpawnedMeshData } from './types'
import { AutoSpawner } from './AutoSpawner'
import { generateValidPosition, createSpawnId, screenToWorldAtDepth } from './utils'
import GlobalState from '@site/_shared/state/GlobalStates'

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

// Helper function for shader compilation (frame separation handled at higher level)
async function compileVATShaders(
  gl: any,
  vatMeshObject: Group,
  scene: any
): Promise<{ success: boolean; newPrograms: number }> {
  const programsBefore = gl.info.programs?.length || 0
  let compilationSucceeded = false

  // Check if methods exist on the WebGL renderer
  const hasCompileAsync = typeof gl.compileAsync === 'function'
  const hasCompile = typeof gl.compile === 'function'
  const isDev = process.env.NODE_ENV !== 'production'

  // Try compileAsync first
  if (hasCompileAsync) {
    try {
      await gl.compileAsync(vatMeshObject, scene)
      compilationSucceeded = true
      if (isDev) console.log('✅ Async compilation succeeded')
    } catch (error) {
      if (isDev) console.warn('❌ Async compilation failed:', error)
      // Continue to synchronous fallback
    }
  }

  // Fallback to synchronous compilation
  if (!compilationSucceeded && hasCompile) {
    try {
      gl.compile(vatMeshObject, scene)
      compilationSucceeded = true
      if (isDev) console.log('✅ Sync compilation succeeded')
    } catch (error) {
      if (isDev) console.warn('❌ Sync compilation failed:', error)
    }
  }

  // Skip fallback render for now to avoid errors
  if (!compilationSucceeded) {
    if (isDev) console.warn('⚠️ No compilation methods available, shaders will compile on first use')
  }

  const programsAfter = gl.info.programs?.length || 0
  return {
    success: compilationSucceeded,
    newPrograms: programsAfter - programsBefore
  }
}

const DEFAULT_VAT_DATA: VATData = {
  gltfPath: "/vat/Dahlia_Clean_basisMesh.gltf",
  posTexPath: "/vat/Dahlia_Clean_pos.exr",
  nrmTexPath: "/vat/Dahlia_Clean_nrm.png",
  mapTexPath: "/textures/tujlip.png",
  maskTexPath: "/textures/blackanedwthioe.png",
  metaPath: "/vat/Dahlia_Clean_meta.json"
}

export function VATMeshSpawner({ vatData }: VATMeshSpawnerProps = {}) {
  const { gl, camera, scene } = useThree()
  const { started, isDev } = GlobalState()

  // State management
  const [spawnedMeshes, setSpawnedMeshes] = useState<SpawnedMeshData[]>([])
  const [meshCounter, setMeshCounter] = useState(0)
  const [preWarmed, setPreWarmed] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)
  const [isCompiled, setIsCompiled] = useState(false)

  // Refs
  const startedRef = useRef(started)
  const prewarmRef = useRef<Group | null>(null)

  useEffect(() => { startedRef.current = started }, [started])

  // VAT resources loading
  const currentVATData = vatData || DEFAULT_VAT_DATA
  const { gltf, posTex, nrmTex, mapTex, maskTex, meta, isLoaded } = useVATPreloader(
    currentVATData.gltfPath,
    currentVATData.posTexPath,
    currentVATData.nrmTexPath,
    currentVATData.mapTexPath,
    currentVATData.maskTexPath,
    currentVATData.metaPath
  )

  const VATProps = gltf
    ? { gltf: gltf.scene, posTex, nrmTex, mapTex, maskTex, metaData: meta }
    : undefined as any

  // Mount hidden VATMesh for shader pre-compilation
  useEffect(() => {
    if (isLoaded && started && !preWarmed) {
      if (process.env.NODE_ENV !== 'production') console.log('🔄 Pre-warming VAT shaders...')
      setPreWarmed(true)
    }
  }, [isLoaded, started, preWarmed])

  // Trigger shader compilation with proper frame separation
  useEffect(() => {
    const hasLightsOrEnv = scene.children.some(o => (o as any).isLight) || (scene as any).environment

    if (!isLoaded || !started || !preWarmed || !VATProps) return
    if (isCompiled || isCompiling) return

    if (!hasLightsOrEnv) {
      if (process.env.NODE_ENV !== 'production') console.log('Waiting for lights/environment before compilation')
      return
    }

    if (!prewarmRef.current) return

    setIsCompiling(true)
    if (process.env.NODE_ENV !== 'production') console.log('📋 Scheduling shader compilation for next frame...')

    // Schedule compilation for the NEXT frame using setTimeout
    setTimeout(() => {
      if (!prewarmRef.current) {
        setIsCompiling(false)
        return
      }

      if (process.env.NODE_ENV !== 'production') console.log('🚀 Starting shader compilation in separate frame...')

      compileVATShaders(gl, prewarmRef.current, scene)
        .then(({ success, newPrograms }) => {
          if (success && newPrograms > 0) {
            if (process.env.NODE_ENV !== 'production') console.log(`✅ VAT shaders compiled (+${newPrograms} programs)`)
          } else if (success) {
            if (process.env.NODE_ENV !== 'production') console.log('✅ VAT shader compilation completed')
          } else {
            if (process.env.NODE_ENV !== 'production') console.log('⚠️ VAT shader compilation skipped')
          }
        })
        .catch((e) => {
          if (process.env.NODE_ENV !== 'production') console.warn('[VAT] Shader compilation failed:', e)
        })
        .finally(() => {
          setIsCompiled(true)
          setIsCompiling(false)
        })
    }, 16) // One frame delay (16ms ≈ 60fps)

  }, [isLoaded, started, preWarmed, isCompiled, isCompiling, gl, camera, scene, VATProps])


  const spawnVATMesh = useCallback((position?: Vector3) => {
    if (!isLoaded || !startedRef.current || !isCompiled) {
      if (process.env.NODE_ENV !== 'production') console.log('Spawn blocked:', { isLoaded, started: startedRef.current, isCompiled })
      return
    }

    setSpawnedMeshes(prev => {
      const spawnPosition = position || generateValidPosition(prev, 0.5, 0.1)
      if (!spawnPosition) return prev

      setMeshCounter(counter => counter + 1)

      return [...prev, {
        id: createSpawnId(prev.length),
        position: [spawnPosition.x, spawnPosition.y, spawnPosition.z] as [number, number, number],
        scale: MathUtils.randFloat(0.5, 1) * 5,
        holdDuration: MathUtils.randFloat(3, 7),
        animDuration: MathUtils.randFloat(2.5, 4.5),
        manual: !!position
      }]
    })
  }, [isLoaded, isCompiled, gl])

  const removeVATMesh = useCallback((id: number) => {
    setSpawnedMeshes(prev => prev.filter(mesh => mesh.id !== id))
  }, [])

  // Event handlers for manual spawning
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyF') {
        event.preventDefault()
        spawnVATMesh()
      }
    }

    const handleClick = (event: MouseEvent) => {
      if (!isLoaded || !isCompiled) return

      // Skip audio UI area (bottom-right 50x50px)
      const isInAudioUI = (
        event.clientX >= window.innerWidth - 50 &&
        event.clientY >= window.innerHeight - 50
      )
      if (isInAudioUI) return

      const pointer = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      }

      const worldPos = screenToWorldAtDepth(pointer, camera, MathUtils.randFloat(0.75, 1))
      spawnVATMesh(worldPos)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleClick)
    }
  }, [isLoaded, isCompiled, camera, spawnVATMesh])

  if (!VATProps) return null

  return (
    <group>
      <AutoSpawner
        isActive={isLoaded && isCompiled}
        onSpawn={spawnVATMesh}
        minInterval={2000}
        maxInterval={5000}
        initialDelay={5000}
        burstEnabled={true}
        burstInterval={[20000, 30000]}
        burstCount={[10, 15]}
        burstDuration={3000}
        enabled={started}
      />

      {/* Hidden mesh for shader pre-compilation */}
      {preWarmed && (
        <group ref={prewarmRef}>
          <VATMesh
            {...VATProps}
            position={[-10000, -10000, -10000]}
            interactive={true}
            useDepthMaterial={true}
          />
        </group>
      )}

      {/* Active VAT meshes */}
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
          paused={false}
          onComplete={() => removeVATMesh(mesh.id)}
          interactive={true}
          useDepthMaterial={true}
        />
      ))}
    </group>
  )
}
