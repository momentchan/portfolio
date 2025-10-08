# VAT Animations

GSAP-based animation utilities for VAT lifecycle management.

## createVATLifecycleTimeline()

Creates a complete GSAP timeline for VAT mesh lifecycle animation including frame playback, scaling, and rotation.

### Parameters

**config** (`TimelineAnimationConfig`):
```typescript
{
  // Frame timing
  frameForwardDuration: number;    // Duration to animate forward (0→1)
  frameHoldDuration: number;       // Duration to hold at frame 1
  frameBackwardDuration: number;   // Duration to animate backward (1→0)
  
  // Scaling timing
  scaleInDuration: number;         // Duration to scale in
  scaleOutDuration: number;        // Duration to scale out
  maxScale: number;                // Maximum scale value
  
  // Rotation timing
  rotateInDuration: number;        // Duration to rotate in
  rotateOutDuration: number;       // Duration to rotate out
  
  // Callbacks
  onComplete?: () => void;                // Called when timeline completes
  onFrameUpdate?: (value: number) => void;  // Called on frame updates
  onGlobalRatioUpdate?: (value: number) => void;  // Called on global ratio updates
}
```

**refs** (`AnimationRefs`):
```typescript
{
  frameRef: { value: number };        // Frame animation ref (0-1)
  scaleRef: { value: number };        // Scale animation ref
  rotationRef: { value: number };     // Rotation animation ref
  globalRatioRef: { value: number };  // Global animation ratio ref (0-1)
}
```

### Returns

`gsap.core.Timeline` - The created GSAP timeline instance

### Example

```tsx
import { createVATLifecycleTimeline } from '@/components/r3f/vat'

const frameRef = useRef({ value: 0 })
const scaleRef = useRef({ value: 0 })
const rotationRef = useRef({ value: 0 })
const globalRatioRef = useRef({ value: 0 })

useEffect(() => {
  const timeline = createVATLifecycleTimeline(
    {
      frameForwardDuration: 3,
      frameHoldDuration: 5,
      frameBackwardDuration: 3,
      scaleInDuration: 1,
      scaleOutDuration: 1,
      maxScale: 1.5,
      rotateInDuration: 2,
      rotateOutDuration: 2,
      onComplete: () => console.log('Animation complete'),
      onFrameUpdate: (value) => setCurrentFrame(value),
      onGlobalRatioUpdate: (value) => setGlobalRatio(value)
    },
    {
      frameRef: frameRef.current,
      scaleRef: scaleRef.current,
      rotationRef: rotationRef.current,
      globalRatioRef: globalRatioRef.current
    }
  )

  return () => timeline.kill()
}, [])
```

## Animation Timeline

```
Time:     0s ──── 1s ───── 3s ──────── 8s ───── 10s ──── 11s
          │       │        │           │        │        │
Frame:    Forward─────────Hold────────────────Backward───End
Scale:    In──Hold────────────────────────────Out────────End
Rotation: In─────Hold──────────────────────────Out───────End
Global:   ──────────────────────Linear (0→1)──────────────End
```

The timeline coordinates three parallel animations:
1. **Frame**: Forward → Hold → Backward
2. **Scale**: In → Hold → Out
3. **Rotation**: In → Hold → Out

All animations are synchronized with the frame timeline duration.

## Benefits

- **Single Timeline**: All animations synchronized
- **Flexible Timing**: Independent control of each animation phase
- **Callback Support**: React to animation events
- **Easy Cleanup**: Single timeline.kill() clears everything
- **Type Safe**: Full TypeScript support

