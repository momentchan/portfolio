import { Ribbon, ParticleDebugPoints } from '../../../lib/trail-gpu';
import { useFrame } from '@react-three/fiber';
import { useTrailSystem, useParticleSystem, useRibbonSystem } from './hooks';
import { useEffect, useState } from 'react';

export function CustomTrail() {
  // Trail update state - controlled by mouse
  const [trailUpdateEnabled, setTrailUpdateEnabled] = useState(true);

  // Use organized hooks for each system
  const { trailControls, trails } = useTrailSystem();
  const { particles } = useParticleSystem(trailControls.trailsNum);
  const { displayControls, geometry, materials } = useRibbonSystem({
    trailsNum: trailControls.trailsNum,
    nodesPerTrail: trailControls.length / trailControls.updateDistanceMin,
    nodeTexture: trails.nodeTexture!,
    trailTexture: trails.trailTexture!,
  });

  // Keyboard event handlers for trail update control
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Space key toggles trail update
      if (event.code === 'Space') {
        event.preventDefault(); // Prevent page scroll
        setTrailUpdateEnabled(prev => !prev);
        console.log(`Trail update ${trailUpdateEnabled ? 'disabled' : 'enabled'}`);
      }
    };

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [trailUpdateEnabled]);

  

  // Update systems each frame
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 30)
    if (!trails || !trailUpdateEnabled) return;
    
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
