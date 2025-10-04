import React, { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { VATMesh } from './VATMesh'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { VATMeshLifecycleProps } from './types'
import { calculateCameraFacingRotation, applyRandomRotationOffsets } from './utils'
import { DebugAxes } from './components/DebugAxes'

export function VATMeshLifecycle({
  maxScale = 1,
  // Frame timing
  frameForwardDuration = 1,
  frameHoldDuration = 2,
  frameBackwardDuration = 1,
  // Scaling timing
  scaleInDuration = 1,      // Duration for scale in
  scaleOutDuration = 1,     // Duration for scale out
  // Rotation timing
  rotateInDuration = 1,     // Duration for rotation in
  rotateOutDuration = 1,    // Duration for rotation out
  // Camera tracking
  trackCamera = false,      // Whether to continuously face camera
  onComplete,
  ...vatMeshProps
}: VATMeshLifecycleProps) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null!)
  const [currentFrame, setCurrentFrame] = useState(0)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const scaleRef = useRef({ value: 0 })
  const frameRef = useRef({ value: 0 })
  const rotationRef = useRef({ value: 0 })

  // Calculate initial rotation so Y-axis faces camera when spawned
  useEffect(() => {
    if (!groupRef.current || !vatMeshProps.position) return

    const meshPosition = new THREE.Vector3(...vatMeshProps.position)
    const baseRotation = calculateCameraFacingRotation(meshPosition, camera.position)
    const finalRotation = applyRandomRotationOffsets(baseRotation, 45, 45)
    
    groupRef.current.setRotationFromQuaternion(finalRotation)
  }, [camera, vatMeshProps.position])

  // Initialize GSAP timeline (only once per instance)
  useEffect(() => {
    if (!groupRef.current) return

    // Kill existing timeline if it exists
    if (timelineRef.current) {
      timelineRef.current.kill()
      timelineRef.current = null
    }

    // Create GSAP timeline for this specific VAT instance
    const timeline = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete()
      }
    })

    // Calculate total frame duration
    const totalFrameDuration = frameForwardDuration + frameHoldDuration + frameBackwardDuration
    const scaleOutStartTime = totalFrameDuration - scaleOutDuration
    const rotateOutStartTime = totalFrameDuration - rotateOutDuration

    // Frame animation sequence
    timeline
      // Frame forward phase
      .to(frameRef.current, {
        value: 1,
        duration: frameForwardDuration,
        ease: "none",
        onUpdate: () => setCurrentFrame(frameRef.current.value)
      })
      // Frame hold phase
      .to(frameRef.current, {
        value: 1,
        duration: frameHoldDuration,
        ease: "none"
      })
      // Frame backward phase
      .to(frameRef.current, {
        value: 0,
        duration: frameBackwardDuration,
        ease: "none",
        onUpdate: () => setCurrentFrame(frameRef.current.value)
      }, frameForwardDuration + frameHoldDuration)

    // Scale animation sequence
    timeline
      // Scale in phase (starts immediately)
      .to(scaleRef.current, {
        value: maxScale,
        duration: scaleInDuration,
        ease: "power2.out"
      }, 0)
      // Scale hold phase (between scale in complete and scale out start)
      .to(scaleRef.current, {
        value: maxScale,
        duration: scaleOutStartTime - scaleInDuration,
        ease: "none"
      }, scaleInDuration)
      // Scale out phase (ends with timeline complete)
      .to(scaleRef.current, {
        value: 0,
        duration: scaleOutDuration,
        ease: "power2.in"
      }, scaleOutStartTime)

    // Rotation animation sequence
    timeline
      // Rotate forward during rotate in phase
      .to(rotationRef.current, {
        value: -Math.PI,
        duration: rotateInDuration,
        ease: "power2.out"
      }, 0)
      // Hold rotation during hold phase
      .to(rotationRef.current, {
        value: -Math.PI,
        duration: rotateOutStartTime - rotateInDuration,
        ease: "none"
      }, rotateInDuration)
      // Rotate backward during rotate out phase
      .to(rotationRef.current, {
        value: 0, // Return to original rotation
        duration: rotateOutDuration,
        ease: "power2.in"
      }, rotateOutStartTime)

    timelineRef.current = timeline

    return () => {
      timeline.kill()
    }
  }, []) // Empty dependency array - only run once per instance

  // Keyboard controls for pause/unpause
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && timelineRef.current) {
        event.preventDefault()
        if (timelineRef.current.paused()) {
          timelineRef.current.resume()
        } else {
          timelineRef.current.pause()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <group ref={groupRef} position={vatMeshProps.position}>

      <VATMesh
        {...vatMeshProps}
        frame={currentFrame}
        position={[0, 0, 0]} // Reset position since it's now on the group
        rotation={[0, rotationRef.current.value, 0]}
        scale={[scaleRef.current.value, scaleRef.current.value, scaleRef.current.value]}
        />

        {/* Debug axes */}
        <DebugAxes visible={false} size={1} />
    </group>
  )
}
