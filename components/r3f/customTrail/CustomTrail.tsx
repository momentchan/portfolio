import { Ribbon, ParticleDebugPoints } from '../../../lib/trail-gpu';
import { useFrame } from '@react-three/fiber';
import { useTrailSystem, useParticleSystem, useRibbonSystem } from './hooks';
import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';

export function CustomTrail() {
  // Trail update state - controlled by mouse
  const [trailUpdateEnabled, setTrailUpdateEnabled] = useState(true);
  const [rate, setRate] = useState(0);
  const rateRef = useRef({ value: 0 });

  // Store rate in ref for GSAP animation
  useEffect(() => {
    rateRef.current.value = rate;
  }, [rate]);

  // Animate rate from 0 to 1 over 5 seconds using GSAP
  useEffect(() => {
    const tl = gsap.timeline();
    tl.to(rateRef.current, {
      value: 1,
      duration: 3,
      ease: "power2.in",
      delay: 2,
      onUpdate: () => {
        setRate(rateRef.current.value);
      }
    });
  }, []);



  // Use organized hooks for each system
  const { trailControls, trails } = useTrailSystem();
  const { particles } = useParticleSystem(trailControls.trailsNum, rate);
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
