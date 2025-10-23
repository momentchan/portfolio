'use client';

import { useRef } from 'react';
import * as THREE from 'three';

interface GyroscopeControlResult {
  rotationSpeed: number;
  radiusSpeed: number;
}

export function useGyroscopeControl() {
  const prevRotationSpeedRef = useRef(0);
  const prevRadiusSpeedRef = useRef(0);

  const calculateSpeeds = (
    beta: number,
    gamma: number,
    sensitivity: number
  ): GyroscopeControlResult => {
    // Normalize angles
    const clampedGamma = THREE.MathUtils.clamp(gamma, -90, 90);
    const clampedBeta = THREE.MathUtils.clamp(beta, 20, 150);
    
    const gammaNorm = clampedGamma / 90;
    // 45° as neutral (comfortable phone holding angle)
    // 22.5° = forward (zoom in), 67.5° = backward (zoom out)
    const betaNorm = (clampedBeta - 45) / 22.5;

    // Gimbal lock protection
    const distanceFromGimbalLock = Math.abs(clampedBeta - 90);
    const gimbalLockFactor = THREE.MathUtils.clamp(distanceFromGimbalLock / 20, 0.3, 1.0);
    
    // Calculate target speeds
    const targetRotationSpeed = THREE.MathUtils.clamp(
      gammaNorm * sensitivity * 100 * gimbalLockFactor,
      -0.5, 0.5
    );
    const targetRadiusSpeed = THREE.MathUtils.clamp(
      -betaNorm * sensitivity * 50,
      -1, 1
    );

    // Smooth speed transitions
    const speedLerpFactor = 0.7;
    const rotationSpeed = THREE.MathUtils.lerp(prevRotationSpeedRef.current, targetRotationSpeed, speedLerpFactor);
    const radiusSpeed = THREE.MathUtils.lerp(prevRadiusSpeedRef.current, targetRadiusSpeed, speedLerpFactor);

    // Store for next frame
    prevRotationSpeedRef.current = rotationSpeed;
    prevRadiusSpeedRef.current = radiusSpeed;

    return { rotationSpeed, radiusSpeed };
  };

  return { calculateSpeeds };
}

