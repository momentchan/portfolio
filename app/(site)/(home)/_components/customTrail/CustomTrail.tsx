import { Ribbon, ParticleDebugPoints } from '@/lib/trail-gpu';
import { useFrame } from '@react-three/fiber';
import { useTrailSystem, useParticleSystem, useRibbonSystem } from './hooks';
import { gsap } from 'gsap';
import GlobalState from '@site/_shared/state/GlobalStates';
import { useRef } from 'react';

export function CustomTrail() {
  const { started } = GlobalState();

  // Use organized hooks for each system
  const { trailControls, trails } = useTrailSystem();
  const { particles } = useParticleSystem(trailControls.trailsNum);
  const { displayControls, geometry, materials } = useRibbonSystem({
    trailsNum: trailControls.trailsNum,
    nodesPerTrail: trailControls.length / trailControls.updateDistanceMin,
    nodeTexture: trails.nodeTexture!,
    trailTexture: trails.trailTexture!,
  });

  const timeRef = useRef(0);

  // Update systems each frame
  useFrame((state, delta) => {
    if (!trails || !started) return;

    const dt = Math.min(delta, 1 / 30)

    const t = timeRef.current;
    timeRef.current += dt;

    // Always update particles
    particles.update(t, dt);

    // Only update trails if enabled by mouse control
    trails.update(t, dt, particles.positionsTexture!);

    // Update time uniform for tube shader if using tube geometry
    if (materials.material && (materials.material as any).uniforms) {
      if ((materials.material as any).uniforms.uTime) {
        (materials.material as any).uniforms.uTime.value = t;
      }
    }
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
