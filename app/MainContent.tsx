'use client';

import useGlobalState from "@/components/common/GlobalStates";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const currentPath = useGlobalState((state) => state.currentPath);
  const isHomepage = currentPath === '/';
  
  return (
    <main 
      className="relative z-10 min-h-screen px-10 mt-10" 
      style={{ pointerEvents: isHomepage ? 'none' : 'auto' }}
    >
      {children}
    </main>
  );
}

