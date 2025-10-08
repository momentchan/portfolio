# VAT Hooks

Reusable React hooks for VAT (Vertex Animation Texture) system.

## Hooks

### useAnimatedValue(initialValue)

Hook for GSAP-animated values that need to trigger React re-renders. Encapsulates the ref/state pattern for smooth animations.

**Parameters:**
- `initialValue` - Starting value (default: 0)

**Returns:** `[ref, state, syncCallback]`
- `ref` - Object with `value` property for GSAP to animate
- `state` - React state that triggers re-renders
- `syncCallback` - Function to sync ref → state

**Example:**
```tsx
import { useAnimatedValue } from '@/components/r3f/vat'

const [scaleRef, scale, syncScale] = useAnimatedValue(0)

useEffect(() => {
  gsap.to(scaleRef, {
    value: 1,
    duration: 2,
    onUpdate: syncScale  // Syncs ref to state on every frame
  })
}, [])

return <mesh scale={scale} />  // Uses state value
```

### useAnimatedValues(initialValues)

Hook for multiple animated values at once. Less recommended than individual `useAnimatedValue` calls.

**Parameters:**
- `initialValues` - Object with initial values

**Returns:** `{ refs, values, sync }`

**Example:**
```tsx
const animated = useAnimatedValues({
  scale: 0,
  opacity: 1
})

gsap.to(animated.refs.scale, {
  value: 1,
  onUpdate: animated.sync.scale
})

<mesh scale={animated.values.scale} />
```

### useVATAnimation(metaData, speed, paused, externalFrame)

Manages VAT frame animation timing.

**Parameters:**
- `metaData` - VAT metadata (fps, frameCount, etc.)
- `speed` - Animation speed multiplier (default: 1)
- `paused` - Whether animation is paused (default: false)
- `externalFrame` - Optional external frame control (0-1)

**Returns:**
- `time` - Current animation time
- `startTime` - Animation start timestamp

### useTriggerRate(hovering, speed)

Manages interactive trigger rate for hover effects.

**Parameters:**
- `hovering` - Whether object is being hovered
- `speed` - Base animation speed (default: 1)

**Returns:**
- `triggerRate` - Current trigger rate (0-1)
- `time` - Current time with trigger multiplier applied

## Pattern: GSAP + React

The `useAnimatedValue` hook solves a common problem when using GSAP with React:

**The Problem:**
- GSAP animates refs (for performance)
- React needs state changes to re-render
- Manually managing both is verbose

**The Solution:**
```tsx
// Old way (verbose)
const scaleRef = useRef({ value: 0 })
const [scale, setScale] = useState(0)
gsap.to(scaleRef, { value: 1, onUpdate: () => setScale(scaleRef.value) })

// New way (clean)
const [scaleRef, scale, syncScale] = useAnimatedValue(0)
gsap.to(scaleRef, { value: 1, onUpdate: syncScale })
```

Both approaches do the same thing, but the hook makes it cleaner and less error-prone.
