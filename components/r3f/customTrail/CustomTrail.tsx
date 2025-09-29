import { Ribbon, ParticleDebugPoints } from '../../../lib/trail-gpu';
import { useFrame } from '@react-three/fiber';
import { useTrailSystem, useParticleSystem, useRibbonSystem } from './hooks';

export function CustomTrail() {
  // Use organized hooks for each system
  const { trailControls, trails } = useTrailSystem();
  const { particles } = useParticleSystem(trailControls.trailsNum);
  const { displayControls, geometry, materials } = useRibbonSystem({
    trailsNum: trailControls.trailsNum,
    nodesPerTrail: trailControls.length / trailControls.updateDistanceMin,
    nodeTexture: trails.nodeTexture!,
    trailTexture: trails.trailTexture!,
  });

  // Update systems each frame
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (!trails) return;

    particles.update(t, delta);
    trails.update(t, delta, particles.positionsTexture!);
  });

  return (
    <>
      {/* Main ribbon visualization */}
      {displayControls.showRibbon && trails.nodeTexture && trails.trailTexture && materials.material && (
        <Ribbon
          geometry={geometry}
          material={materials.material}
          depthMaterial={materials.depthMaterial}
          trails={trailControls.trailsNum}
        />
      )}

      {/* Debug points for particle positions */}
      {displayControls.showParticlePoints && (
        <ParticleDebugPoints
          particleTexture={particles.positionsTexture!}
          count={particles.count}
          size={0.05}
          color="#ff6b6b"
        />
      )}
    </>
  );
}
