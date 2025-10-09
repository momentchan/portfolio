import { useRef } from 'react';

/**
 * Custom hook to track pointer movement and calculate speed
 * @returns Object containing current pointer position, delta, speed, and normalized speed multiplier
 */
export function usePointerTracking() {
  const prevPointerRef = useRef({ x: 0, y: 0 });

  const calculatePointerSpeed = (currentPointer: { x: number; y: number }, delta: number) => {
    const pointerDelta = {
      x: currentPointer.x - prevPointerRef.current.x,
      y: currentPointer.y - prevPointerRef.current.y
    };

    const pointerSpeed = Math.sqrt(
      pointerDelta.x * pointerDelta.x + pointerDelta.y * pointerDelta.y
    ) / delta;

    prevPointerRef.current = currentPointer;

    // Normalize speed to 0-1 range (0.1 is max speed threshold)
    const pointerSpeedMultiplier = Math.max(0, Math.min(1, (pointerSpeed - 0) / (0.1 - 0)));

    return {
      currentPointer,
      pointerDelta,
      pointerSpeed,
      pointerSpeedMultiplier
    };
  };

  return { calculatePointerSpeed };
}

