'use client';

import { useEffect, useRef } from 'react';

interface OrientationData {
  alpha: number;
  beta: number;
  gamma: number;
}

export function useDeviceOrientation(
  enabled: boolean,
  onUpdate: (data: OrientationData) => void
) {
  const prevOrientationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });

  useEffect(() => {
    if (!enabled) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
        const newAlpha = event.alpha;
        const newBeta = event.beta;
        const newGamma = event.gamma;

        // Gimbal lock detection and filtering
        const isNearGimbalLock = Math.abs(newBeta - 90) < 20;
        const prevAlpha = prevOrientationRef.current.alpha;
        const prevGamma = prevOrientationRef.current.gamma;
        
        const alphaDiff = Math.abs(newAlpha - prevAlpha);
        const gammaDiff = Math.abs(newGamma - prevGamma);
        const alphaJump = Math.min(alphaDiff, 360 - alphaDiff);
        
        let finalAlpha = newAlpha;
        let finalGamma = newGamma;
        
        if (isNearGimbalLock) {
          if (alphaJump > 30) {
            finalAlpha = prevAlpha;
          } else {
            finalAlpha = prevAlpha + (newAlpha - prevAlpha) * 0.1;
          }
          
          if (gammaDiff > 30) {
            finalGamma = prevGamma;
          } else {
            finalGamma = prevGamma + (newGamma - prevGamma) * 0.1;
          }
        }

        const values = {
          alpha: finalAlpha,
          beta: newBeta,
          gamma: finalGamma
        };
        
        prevOrientationRef.current = values;
        onUpdate(values);
      }
    };

    const handleMotion = (event: DeviceMotionEvent) => {
      // Ensures permission is properly granted on iOS 18
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [enabled, onUpdate]);
}

