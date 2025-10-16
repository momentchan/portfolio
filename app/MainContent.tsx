'use client';

import useGlobalState from "@/components/common/GlobalStates";

export default function MainContent({ children }: { children: React.ReactNode }) {
  const currentPath = useGlobalState((state) => state.currentPath);
  const isHomepage = currentPath === '/';

  return (
    <main
      className="relative z-10 min-h-screen px-4 sm:px-6 lg:px-10 mt-4 sm:mt-6 lg:mt-8 overflow-y-auto scrollbar-hide"
      style={{ pointerEvents: isHomepage ? 'none' : 'auto' }}
    >
      {children}
    </main>
  );
}

