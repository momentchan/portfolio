'use client';

import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import { useControls } from 'leva';

export default function Effects() {
  const bloomParams = useControls('Effects.Bloom', {
    intensity: { value: 1, min: 0, max: 3, step: 0.01 },
    luminanceThreshold: { value: 0.5, min: 0, max: 1, step: 0.01 },
    luminanceSmoothing: { value: 0.025, min: 0, max: 0.1, step: 0.001 },
    mipmapBlur: true
  }, { collapsed: true });

  const dofParams = useControls('Effects.Depth of Field', {
    focusDistance: { value: 0.2, min: 0, max: 1, step: 0.01 },
    focalLength: { value: 0.024, min: 0.001, max: 1, step: 0.001 },
    bokehScale: { value: 2, min: 0, max: 10, step: 0.1 },
    focusRange: { value: 0.3, min: 0.01, max: 1, step: 0.01 },
    blur: { value: 0.5, min: 0, max: 2, step: 0.01 }
  }, { collapsed: true });

  return (
    <EffectComposer>
      <Bloom 
        intensity={bloomParams.intensity}
        luminanceThreshold={bloomParams.luminanceThreshold}
        luminanceSmoothing={bloomParams.luminanceSmoothing}
        mipmapBlur={bloomParams.mipmapBlur}
      />
      <DepthOfField 
        focusDistance={dofParams.focusDistance}
        focalLength={dofParams.focalLength}
        bokehScale={dofParams.bokehScale}
        focusRange={dofParams.focusRange}
        blur={dofParams.blur}
      />
    </EffectComposer>
  );
}
