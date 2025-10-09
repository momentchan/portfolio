'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface SplitTextProps {
  text: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  className?: string;
  spin?: boolean;
  move?: boolean;
  fade?: boolean;
  onComplete?: () => void;
}

export default function SplitText({ 
  text, 
  delay = 0, 
  duration = 0.8,
  stagger = 0.03,
  className = '',
  spin = true,
  move = true,
  fade = true,
  onComplete 
}: SplitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chars = containerRef.current.querySelectorAll('.char');
    if (chars.length === 0) return;
    
    // Kill any existing animation
    if (tweenRef.current) {
      tweenRef.current.kill();
    }
    
    // Create new animation
    tweenRef.current = gsap.fromTo(
      chars,
      {
        opacity: fade ? 0 : 1,
        y: move ? 20 : 0,
        rotateX: spin ? -45 : 0,
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration,
        stagger,
        delay,
        ease: 'power3.out',
        onComplete,
      }
    );

    // Cleanup on unmount or before next animation
    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill();
      }
    };
  }, [text, delay, duration, stagger, fade, move, spin, onComplete]);

  const chars = text.split('').map((char, index) => (
    <span 
      key={index} 
      className="char inline-block"
      style={{ 
        transformStyle: 'preserve-3d',
        transformOrigin: '0% 50%',
        opacity: 0  // Start invisible, GSAP will animate to 1
      }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));

  return (
    <div 
      ref={containerRef} 
      className={`inline-block ${className}`}
      style={{ perspective: '1000px' }}
    >
      {chars}
    </div>
  );
}

