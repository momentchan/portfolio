import React, { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { VATMesh, VATMeshProps } from './VATMesh'
import * as THREE from 'three'

interface VATMeshLifecycleProps extends Omit<VATMeshProps, 'frame'> {
  maxScale?: number
  // Frame lifecycle timing
  frameForwardDuration?: number
  frameHoldDuration?: number
  frameBackwardDuration?: number
  // Scaling timing (relative to frame timing)
  scaleInDuration?: number    // Duration for scale in (starts with frame forward)
  scaleOutDuration?: number   // Duration for scale out (ends with frame complete)
  onComplete?: () => void
}

export function VATMeshLifecycle({
  maxScale = 1,
  // Frame timing
  frameForwardDuration = 1,
  frameHoldDuration = 2,
  frameBackwardDuration = 1,
  // Scaling timing
  scaleInDuration = 1,      // Duration for scale in
  scaleOutDuration = 1,     // Duration for scale out
  onComplete,
  ...vatMeshProps
}: VATMeshLifecycleProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const [scalePhase, setScalePhase] = useState<'scaleIn' | 'scaleHold' | 'scaleOut' | 'complete'>('scaleIn')
  const [framePhase, setFramePhase] = useState<'frameForward' | 'frameHold' | 'frameBackward' | 'complete'>('frameForward')
  const [shouldRemove, setShouldRemove] = useState(false)
  const lifecycleStartTimeRef = useRef<number>(0)
  const [currentScale, setCurrentScale] = useState(0)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const pauseStartTimeRef = useRef<number>(0)

  // Initialize lifecycle animation
  useEffect(() => {
    setScalePhase('scaleIn')
    setFramePhase('frameForward')
    setShouldRemove(false)
    setCurrentScale(0)
    setCurrentFrame(0)
  }, [])

  // Keyboard controls for pause/unpause
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        setIsPaused(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Calculate current scale and frame based on lifecycle phase
  const updateLifecycle = (currentTime: number) => {
    // Set start time on first frame
    if (lifecycleStartTimeRef.current === 0) {
      lifecycleStartTimeRef.current = currentTime
    }

    // Handle pause/unpause timing
    if (isPaused && pauseStartTimeRef.current === 0) {
      // Just paused - record when pause started
      pauseStartTimeRef.current = currentTime
      return
    } else if (!isPaused && pauseStartTimeRef.current > 0) {
      // Just unpaused - adjust start time to account for pause duration
      const pauseDuration = currentTime - pauseStartTimeRef.current
      lifecycleStartTimeRef.current += pauseDuration
      pauseStartTimeRef.current = 0
    } else if (isPaused) {
      // Still paused - don't update animation
      return
    }

    const elapsed = currentTime - lifecycleStartTimeRef.current

    // Safety check: if elapsed is negative, return early
    if (elapsed < 0) return

    // Calculate total duration for frame animation
    const totalFrameDuration = frameForwardDuration + frameHoldDuration + frameBackwardDuration

    // Update frame animation
    if (elapsed >= totalFrameDuration) {
      setFramePhase('complete')
      setCurrentFrame(0)
    } else if (elapsed < frameForwardDuration) {
      // Frame forward phase
      if (framePhase !== 'frameForward') setFramePhase('frameForward')
      const progress = Math.max(0, Math.min(1, elapsed / frameForwardDuration))
      setCurrentFrame(progress)
    } else if (elapsed < frameForwardDuration + frameHoldDuration) {
      // Frame hold phase
      if (framePhase !== 'frameHold') setFramePhase('frameHold')
      setCurrentFrame(1)
    } else {
      // Frame backward phase
      if (framePhase !== 'frameBackward') setFramePhase('frameBackward')
      const frameBackwardStart = frameForwardDuration + frameHoldDuration
      const frameBackwardElapsed = elapsed - frameBackwardStart
      const progress = Math.max(0, Math.min(1, frameBackwardElapsed / frameBackwardDuration))
      setCurrentFrame(1 - progress)
    }

    // Update scaling animation with independent timing
    const scaleOutStartTime = totalFrameDuration - scaleOutDuration
    
    if (elapsed >= totalFrameDuration) {
      setScalePhase('complete')
      setCurrentScale(0)
    } else if (elapsed < scaleInDuration) {
      // Scale in phase (starts with frame start)
      if (scalePhase !== 'scaleIn') setScalePhase('scaleIn')
      const progress = Math.max(0, Math.min(1, elapsed / scaleInDuration))
      setCurrentScale(progress * maxScale)
    } else if (elapsed < scaleOutStartTime) {
      // Hold scale phase (between scale in complete and scale out start)
      if (scalePhase !== 'scaleHold') setScalePhase('scaleHold')
      setCurrentScale(maxScale)
    } else {
      // Scale out phase (ends with frame complete)
      if (scalePhase !== 'scaleOut') setScalePhase('scaleOut')
      const scaleOutElapsed = elapsed - scaleOutStartTime
      const progress = Math.max(0, Math.min(1, scaleOutElapsed / scaleOutDuration))
      setCurrentScale(maxScale * (1 - progress))
    }

    // Check if animation is complete
    if (elapsed >= totalFrameDuration) {
      setShouldRemove(true)
      if (onComplete) onComplete()
    }
  }

  // Animation frame update
  useFrame((state) => {
    updateLifecycle(state.clock.elapsedTime)
    
    // Apply scale to the group in local space
    if (groupRef.current) {
      groupRef.current.scale.set(currentScale, currentScale, currentScale)
    }
  })

  // Remove component when lifecycle is complete
  if (shouldRemove) {
    return null
  }

  return (
    <group ref={groupRef} position={vatMeshProps.position}>
      <VATMesh
        {...vatMeshProps}
        frame={currentFrame}
        position={[0, 0, 0]} // Reset position since it's now on the group
      />
    </group>
  )
}
