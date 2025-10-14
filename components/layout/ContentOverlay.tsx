'use client';

import React, { useEffect, useRef } from 'react';
import styles from './ContentOverlay.module.css';

/**
 * OverlayChrome - Animated blur layer
 * 
 * Uses a two-frame technique to prevent blur flicker:
 * 1. Frame 1: Blur layer exists with full blur but opacity:0
 * 2. Frame 2+: Fade in opacity (avoiding backdrop-filter animation)
 */
export function OverlayChrome() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Double RAF ensures blur is rendered before fading in
    const id = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => {
        ref.current?.classList.add(styles.blurReady);
      });
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      ref={ref}
      className={`
        pointer-events-none
        absolute inset-0 rounded-1xl
        ${styles.blurLayer}
        ${styles.contentFadeIn}
        opacity-0
      `}
      aria-hidden="true"
    />
  );
}

/**
 * OverlayBody - Animated content layer
 * 
 * Fades in with scale + translateY animation
 */
export function OverlayBody({ children }: React.PropsWithChildren) {
  return (
    <div className={`relative z-10 ${styles.contentFadeIn}`}>
      {children}
    </div>
  );
}

interface ContentOverlayProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ContentOverlay - Glass-morphic card with animated blur
 * 
 * Structure:
 * - Container: Base styles, scrolling, sizing
 * - OverlayChrome: Animated backdrop-blur layer
 * - OverlayBody: Animated content layer
 * 
 * The separation prevents blur "pop-in" by ensuring backdrop-filter
 * is rendered before becoming visible.
 */
export default function ContentOverlay({ children, className = '' }: ContentOverlayProps) {
  return (
    <div
      className={`
        relative rounded-1xl shadow-2xl 
        border border-gray-200 dark:border-gray-800
        p-10 pointer-events-auto 
        overflow-y-auto max-h-[80vh]
        bg-white/100 dark:bg-black/50
        isolate will-change-transform
        ${className}
      `}
    >
      <OverlayChrome />
      <OverlayBody>{children}</OverlayBody>
    </div>
  );
}