'use client';

import { useState, useEffect } from 'react';
import useGlobalState from "@/components/common/GlobalStates";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const currentPath = useGlobalState((state) => state.currentPath);
  const previousPath = useGlobalState((state) => state.previousPath);
  const isHomepage = currentPath === '/';
  const [isVisible, setIsVisible] = useState(true);

  // Handle page transition fade effects and scroll reset
  useEffect(() => {
    if (currentPath !== previousPath) {
      setIsVisible(false);

      // Reset scroll position when navigating to a new page
      // This prevents scroll position from affecting navbar visibility
      const timer = setTimeout(() => {
        // Reset scroll position more reliably
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.scrollTop = 0;
        }
        // Also reset window scroll if any
        window.scrollTo(0, 0);

        setIsVisible(true);
      }, 150); // Half of transition duration for smoother effect
      return () => clearTimeout(timer);
    }
  }, [currentPath, previousPath]);

  return (
    <main
      className="relative z-10 h-screen-dynamic overflow-y-auto scrollbar-hide transition-opacity duration-300 ease-in-out"
      style={{
        pointerEvents: isHomepage ? 'none' : 'auto',
        opacity: isVisible ? 1 : 0
      }}
    >
      <div className="px-4 sm:px-6 lg:px-10 mt-20 sm:mt-24 lg:mt-28">
        {children}
      </div>
    </main>
  );
}

