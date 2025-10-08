import { useRef, useState, useCallback } from 'react';

/**
 * Hook for GSAP-animated values that need to trigger React re-renders
 * 
 * Returns a ref (for GSAP to animate) and state (for React to re-render),
 * plus a sync callback to bridge them.
 * 
 * @param initialValue - Starting value
 * @returns [ref, state, syncCallback]
 * 
 * @example
 * const [scaleRef, scale, setScale] = useAnimatedValue(0)
 * 
 * gsap.to(scaleRef, {
 *   value: 1,
 *   onUpdate: () => setScale(scaleRef.value)
 * })
 * 
 * <mesh scale={scale} />
 */
export function useAnimatedValue(initialValue: number = 0) {
  const ref = useRef({ value: initialValue });
  const [state, setState] = useState(initialValue);
  
  const sync = useCallback(() => {
    setState(ref.current.value);
  }, []);
  
  return [ref.current, state, sync] as const;
}

/**
 * Hook for multiple animated values
 * 
 * @example
 * const animated = useAnimatedValues({
 *   scale: 0,
 *   rotation: 0,
 *   opacity: 1
 * })
 * 
 * gsap.to(animated.refs.scale, {
 *   value: 1,
 *   onUpdate: () => animated.sync.scale()
 * })
 * 
 * <mesh scale={animated.values.scale} />
 */
export function useAnimatedValues<T extends Record<string, number>>(
  initialValues: T
): {
  refs: { [K in keyof T]: { value: number } };
  values: { [K in keyof T]: number };
  sync: { [K in keyof T]: () => void };
} {
  const keys = Object.keys(initialValues) as Array<keyof T>;
  
  const refs = useRef<{ [K in keyof T]: { value: number } }>(
    keys.reduce((acc, key) => {
      acc[key] = { value: initialValues[key] };
      return acc;
    }, {} as { [K in keyof T]: { value: number } })
  );

  const [values, setValues] = useState<T>(initialValues);

  const sync = useRef<{ [K in keyof T]: () => void }>(
    keys.reduce((acc, key) => {
      acc[key] = () => {
        setValues(prev => ({
          ...prev,
          [key]: refs.current[key].value
        }));
      };
      return acc;
    }, {} as { [K in keyof T]: () => void })
  );

  return {
    refs: refs.current,
    values,
    sync: sync.current
  };
}

