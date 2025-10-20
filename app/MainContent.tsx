'use client';

import { useState, useEffect } from 'react';
import useGlobalState from "@/components/common/GlobalStates";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const currentPath = useGlobalState((state) => state.currentPath);
  const previousPath = useGlobalState((state) => state.previousPath);
  const isHomepage = currentPath === '/';
  const [isVisible, setIsVisible] = useState(true);

  // Handle page transition fade effects
  useEffect(() => {
    if (currentPath !== previousPath) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 150); // Half of transition duration for smoother effect
      return () => clearTimeout(timer);
    }
  }, [currentPath, previousPath]);

  return (
    <main
      className="relative z-10 h-screen overflow-y-auto scrollbar-hide transition-opacity duration-300 ease-in-out"
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

