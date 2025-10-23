'use client';

import { useViewportHeight } from '../hooks/useViewportHeight';

/**
 * Provider component to initialize dynamic viewport height handling
 * This ensures the viewport height is calculated and applied globally
 */
export default function ViewportHeightProvider({ children }: { children: React.ReactNode }) {
  useViewportHeight();
  return children;
}
