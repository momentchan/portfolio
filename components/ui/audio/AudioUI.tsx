'use client';

import DistortedCircle from './DistortedCircle';
import { useControls } from 'leva';

export default function AudioUI() {
  const controls = useControls({
    distortionFrequency: {
      value: 0.3,
      min: 0.1,
      max: 1,
    },
    distortionStrength: {
      value: 0.5,
      min: 0,
      max: 1,
    },
    distortionSpeed: {
      value: 1.0,
      min: 0,
      max: 10,
    },
  });

  return (
    <>
      <DistortedCircle
        radius={10}
        segments={256}
        pixelOffset={(size) => ({ x: size.width - 25, y: size.height - 25 })}
        color="#ffffff"
        distortionStrength={controls.distortionStrength}
        distortionSpeed={controls.distortionSpeed}
        distortionFrequency={controls.distortionFrequency}
        lineWidth={5}
      />
    </>
  );
}

