import { gsap } from 'gsap';

export interface TimelineAnimationConfig {
  // Frame timing
  frameForwardDuration: number;
  frameHoldDuration: number;
  frameBackwardDuration: number;
  // Scaling timing
  scaleInDuration: number;
  scaleOutDuration: number;
  maxScale: number;
  // Rotation timing
  rotateInDuration: number;
  rotateOutDuration: number;
  // Callbacks
  onComplete?: () => void;
  onFrameUpdate?: (value: number) => void;
  onScaleUpdate?: (value: number) => void;
  onRotationUpdate?: (value: number) => void;
  onGlobalRatioUpdate?: (value: number) => void;
}

export interface AnimationRefs {
  frameRef: { value: number };
  scaleRef: { value: number };
  rotationRef: { value: number };
  globalRatioRef: { value: number };
}

/**
 * Creates a GSAP timeline for VAT lifecycle animation
 */
export function createVATLifecycleTimeline(
  config: TimelineAnimationConfig,
  refs: AnimationRefs
): gsap.core.Timeline {
  const {
    frameForwardDuration,
    frameHoldDuration,
    frameBackwardDuration,
    scaleInDuration,
    scaleOutDuration,
    maxScale,
    rotateInDuration,
    rotateOutDuration,
    onComplete,
    onFrameUpdate,
    onScaleUpdate,
    onRotationUpdate,
    onGlobalRatioUpdate
  } = config;

  const timeline = gsap.timeline({
    onComplete: () => {
      if (onComplete) onComplete();
    }
  });

  // Calculate total frame duration
  const totalFrameDuration = frameForwardDuration + frameHoldDuration + frameBackwardDuration;
  const scaleOutStartTime = totalFrameDuration - scaleOutDuration;
  const rotateOutStartTime = totalFrameDuration - rotateOutDuration;

  // Frame animation sequence
  timeline
    .to(refs.frameRef, {
      value: 1,
      duration: frameForwardDuration,
      ease: "none",
      onUpdate: () => onFrameUpdate?.(refs.frameRef.value)
    })
    .to(refs.frameRef, {
      value: 1,
      duration: frameHoldDuration,
      ease: "none"
    })
    .to(refs.frameRef, {
      value: 0,
      duration: frameBackwardDuration,
      ease: "none",
      onUpdate: () => onFrameUpdate?.(refs.frameRef.value)
    }, frameForwardDuration + frameHoldDuration);

  // Scale animation sequence
  timeline
    .to(refs.scaleRef, {
      value: maxScale,
      duration: scaleInDuration,
      ease: "power2.out",
      onUpdate: () => onScaleUpdate?.(refs.scaleRef.value)
    }, 0)
    .to(refs.scaleRef, {
      value: maxScale,
      duration: scaleOutStartTime - scaleInDuration,
      ease: "none"
    }, scaleInDuration)
    .to(refs.scaleRef, {
      value: 0,
      duration: scaleOutDuration,
      ease: "power2.in",
      onUpdate: () => onScaleUpdate?.(refs.scaleRef.value)
    }, scaleOutStartTime);

  // Rotation animation sequence
  timeline
    .to(refs.rotationRef, {
      value: -Math.PI,
      duration: rotateInDuration,
      ease: "power2.out",
      onUpdate: () => onRotationUpdate?.(refs.rotationRef.value)
    }, 0)
    .to(refs.rotationRef, {
      value: -Math.PI,
      duration: rotateOutStartTime - rotateInDuration,
      ease: "none"
    }, rotateInDuration)
    .to(refs.rotationRef, {
      value: 0,
      duration: rotateOutDuration,
      ease: "power2.in",
      onUpdate: () => onRotationUpdate?.(refs.rotationRef.value)
    }, rotateOutStartTime);

  // Global ratio animation
  timeline.to(refs.globalRatioRef, {
    value: 1,
    duration: totalFrameDuration,
    ease: "none",
    onUpdate: () => onGlobalRatioUpdate?.(refs.globalRatioRef.value)
  }, 0);

  return timeline;
}

