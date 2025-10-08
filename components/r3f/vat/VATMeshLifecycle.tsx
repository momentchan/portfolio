import React, { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { VATMesh } from './VATMesh'
import * as THREE from 'three'
import { VATMeshLifecycleProps } from './types'
import { calculateCameraFacingRotation, applyRandomRotationOffsets } from './utils'
import { createVATLifecycleTimeline } from './animations/gsapTimeline'
import { useAnimatedValue } from '../hooks/useAnimatedValue'

export function VATMeshLifecycle({
  gltf,
  posTex,
  nrmTex,
  mapTex,
  maskTex,
  metaData,
  position,
  id,
  maxScale = 1,
  frameForwardDuration = 1,
  frameHoldDuration = 2,
  frameBackwardDuration = 1,
  scaleInDuration = 1,
  scaleOutDuration = 1,
  rotateInDuration = 1,
  rotateOutDuration = 1,
  paused = false,
  manual = false,
  onComplete,
}: VATMeshLifecycleProps) {

  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null!)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  
  const [frameRatioRef, frameRatio, syncFrameRatio] = useAnimatedValue(0)
  const [scaleRef, scale, syncScale] = useAnimatedValue(0)
  const [rotationRef, rotation, syncRotation] = useAnimatedValue(0)
  const [globalRatioRef, globalRatio, syncGlobalRatio] = useAnimatedValue(0)

  // Calculate initial rotation so Y-axis faces camera when spawned
  useEffect(() => {
    if (!groupRef.current || !position) return

    const meshPosition = new THREE.Vector3(...position)
    const baseRotation = calculateCameraFacingRotation(meshPosition, camera.position)
    const finalRotation = applyRandomRotationOffsets(baseRotation, manual ? [0,0] : [-45, 45], manual ? [0, 0] : [-45, 0])

    groupRef.current.setRotationFromQuaternion(finalRotation)
  }, [camera, position])

  // Initialize GSAP timeline (only once per instance)
  useEffect(() => {
    if (!groupRef.current) return

    // Kill existing timeline if it exists
    if (timelineRef.current) {
      timelineRef.current.kill()
      timelineRef.current = null
    }

    // Create timeline using utility function
    const timeline = createVATLifecycleTimeline(
      {
        frameForwardDuration,
        frameHoldDuration,
        frameBackwardDuration,
        scaleInDuration,
        scaleOutDuration,
        maxScale,
        rotateInDuration,
        rotateOutDuration,
        onComplete,
        onFrameUpdate: syncFrameRatio,
        onScaleUpdate: syncScale,
        onRotationUpdate: syncRotation,
        onGlobalRatioUpdate: syncGlobalRatio
      },
      {
        frameRef: frameRatioRef,
        scaleRef: scaleRef,
        rotationRef: rotationRef,
        globalRatioRef: globalRatioRef
      }
    )

    timelineRef.current = timeline

    return () => {
      timeline.kill()
    }
  }, [])

  // Keyboard controls for pause/unpause
  useEffect(() => {
    if (!timelineRef.current) return
    
    if (paused) {
      timelineRef.current.pause()
    } else {
      timelineRef.current.resume()
    }
  }, [paused])


  return (
    <group ref={groupRef} position={position}>
      <VATMesh
        gltf={gltf}
        posTex={posTex}
        nrmTex={nrmTex}
        mapTex={mapTex}
        maskTex={maskTex}
        metaData={metaData}
        id={id}
        position={[0, 0, 0]}
        rotation={[0, rotation, 0]}
        scale={[scale, scale, scale]}
        triggerSize={0.05}
        frameRatio={frameRatio}
        globalRatio={globalRatio}
      />
    </group>
  )
}
