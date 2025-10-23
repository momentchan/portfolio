import { useMemo } from 'react';
import { useControls } from 'leva';
import { useTrails } from '@/lib/trail-gpu';
import { DistanceShaderPack } from '@/lib/trail-gpu/shaders/packs/distance';
import { TrailConfig } from '@/lib/trail-gpu/types';

export function useTrailSystem() {
  // Trail configuration controls
  const trailControls = useControls('Trails.Trail', {
    length: { value: 0.3, min: 0, max: 0.5, step: 0.01 },
    trailsNum: { value: 1000, min: 10, max: 2000, step: 1 },
    updateDistanceMin: { value: 0.005, min: 0.001, max: 0.5, step: 0.001 },
  }, { collapsed: true });

  // Trail configuration
  const trailConfig: TrailConfig = useMemo(() => ({
    nodesPerTrail: trailControls.length / trailControls.updateDistanceMin,
    trailsNum: trailControls.trailsNum,
    updateDistanceMin: trailControls.updateDistanceMin,
  }), [trailControls]);

  // Create trail system
  const trails = useTrails({
    ...trailConfig,
    shaderPack: DistanceShaderPack,
  });

  return {
    trailControls,
    trailConfig,
    trails,
  };
}
