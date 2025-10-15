'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import useGlobalState from '@/components/common/GlobalStates';

/**
 * PathTracker - Tracks current and previous paths in global state
 * Mount at root layout level
 */
export default function PathTracker() {
  const pathname = usePathname();
  const setCurrentPath = useGlobalState((state) => state.setCurrentPath);
  const currentPath = useGlobalState((state) => state.currentPath);

  useEffect(() => {
    if (pathname !== currentPath) {
      setCurrentPath(pathname);
    }
  }, [pathname, currentPath, setCurrentPath]);

  return null;
}

