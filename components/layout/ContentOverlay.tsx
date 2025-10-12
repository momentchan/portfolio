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
    <div className={`
      relative
      backdrop-blur-md
      bg-white/80
      dark:bg-black/80
      rounded-2xl
      shadow-2xl
      border border-white/20
      p-8
      pointer-events-auto
      ${className}
    `}>
      {children}
    </div>
  );
}

