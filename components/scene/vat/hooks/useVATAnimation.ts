import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Manages VAT frame animation
 */
export function useVATAnimation(
  metaData: any,
  speed: number = 1,
  paused: boolean = false,
  externalFrame?: number
) {
  const startTimeRef = useRef(performance.now() / 1000);
  const [time, setTime] = useState(0);

  useFrame((state, delta) => {
    if (paused) return;

    const currentTime = state.clock.elapsedTime;

    // Calculate frame
    let frame: number;
    if (externalFrame !== undefined) {
      frame = Math.min(externalFrame * metaData.frameCount, metaData.frameCount - 5);
    } else {
      frame = currentTime * (metaData.fps * speed) % metaData.frameCount;
    }

    setTime(prevTime => prevTime + delta * speed);

    return { frame, time };
  });

  return { time, startTime: startTimeRef.current };
}

/**
 * Manages interactive trigger rate
 */
export function useTriggerRate(hovering: boolean, speed: number = 1) {
  const triggerRate = useRef({ value: 0 });
  const [time, setTime] = useState(0);

  useFrame((state, delta) => {
    triggerRate.current.value += hovering ? delta * 2.0 : 0;
    triggerRate.current.value -= delta;
    triggerRate.current.value = Math.max(0, Math.min(triggerRate.current.value, 1));

    setTime(prevTime => prevTime + delta * speed * (1 + triggerRate.current.value * 1));
  });

  return { triggerRate: triggerRate.current.value, time };
}

