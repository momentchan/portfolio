'use client';

import { useEffect } from 'react';

/**
 * Custom hook to handle dynamic viewport height on mobile devices
 * Updates CSS custom property --vh to account for browser UI (address bar, etc.)
 */
export function useViewportHeight() {
  useEffect(() => {
    const setViewportHeight = () => {
      // Get the actual viewport height
      const vh = window.innerHeight * 0.01;
      // Set the CSS custom property
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial value
    setViewportHeight();

    // Update on resize and orientation change
    const handleResize = () => {
      setViewportHeight();
    };

    // Use multiple events to catch different scenarios
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // For iOS Safari specifically
    window.addEventListener('scroll', handleResize, { passive: true });
    window.addEventListener('touchstart', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('scroll', handleResize);
      window.removeEventListener('touchstart', handleResize);
    };
  }, []);
}
