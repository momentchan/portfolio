'use client';

import { ReactNode } from 'react';

interface ContentOverlayProps {
  children: ReactNode;
  className?: string;
}

/**
 * Glass-morphic overlay wrapper for content pages
 * Creates a frosted glass effect on top of the background scene
 */
export default function ContentOverlay({ children, className = '' }: ContentOverlayProps) {
  return (
    <div 
      className={`
        relative
        backdrop-blur-md
        bg-white/100
        dark:bg-black/60
        rounded-1xl
        shadow-2xl
        border border-gray-200
        dark:border-gray-800
        p-10
        pointer-events-auto
        ${className}
      `}
    >
      {children}
    </div>
  );
}

