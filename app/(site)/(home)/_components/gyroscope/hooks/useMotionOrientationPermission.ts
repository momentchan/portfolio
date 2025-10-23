'use client';
import { useCallback, useState } from 'react';

export type PermissionState = 'idle' | 'asking' | 'granted' | 'denied' | 'unavailable';

export function useMotionOrientationPermission() {
  const [state, setState] = useState<PermissionState>('idle');
  const [reason, setReason] = useState<string | null>(null);

  const request = useCallback(async () => {
    if (state === 'asking') return;
    setState('asking'); 
    setReason(null);

    const ask = async (Ctor: any) => {
      if (Ctor && typeof Ctor.requestPermission === 'function') {
        return await Ctor.requestPermission();
      }
      return 'granted';
    };

    try {
      // Check HTTPS requirement
      if (typeof window !== 'undefined' && 
          window.location.protocol !== 'https:' && 
          window.location.hostname !== 'localhost') {
        setState('denied'); 
        setReason('Requires HTTPS');
        return;
      }

      const motionCtor = (window as any).DeviceMotionEvent;
      const orientCtor = (window as any).DeviceOrientationEvent;
      
      if (!motionCtor && !orientCtor) {
        setState('unavailable'); 
        setReason('Not supported on this device');
        return;
      }

      // Request BOTH permissions in the same user gesture (required for iOS 18)
      const [motionState, orientState] = await Promise.all([
        ask(motionCtor),
        ask(orientCtor),
      ]);

      if (motionState === 'granted' && orientState === 'granted') {
        setState('granted');
      } else {
        setState('denied');
        setReason(`motion=${motionState}, orientation=${orientState}`);
      }
    } catch (e: any) {
      setState('denied'); 
      setReason(e?.message || 'Unknown error');
    }
  }, [state]);

  return { state, reason, request };
}

