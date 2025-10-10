'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SplitText.module.css';

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
  const [animationKey, setAnimationKey] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset animation by incrementing key (forces re-render)
    setAnimationKey(prev => prev + 1);

    // Calculate total animation time
    const chars = text.length;
    const totalTime = (delay + duration + (chars * stagger)) * 1000;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Call onComplete after animation finishes
    if (onComplete) {
      timeoutRef.current = setTimeout(onComplete, totalTime);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, delay, duration, stagger, onComplete]);

  const chars = text.split('').map((char, index) => {
    const animationDelay = `${delay + (index * stagger)}s`;

    return (
      <span
        key={`${animationKey}-${index}`}
        className={styles.char}
        style={{
          animationDelay,
          animationDuration: `${duration}s`,
          // CSS variables for dynamic props
          '--start-opacity': fade ? '0' : '1',
          '--start-y': move ? '20px' : '0',
          '--start-rotate': spin ? '-45deg' : '0deg',
        } as React.CSSProperties}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    );
  });

  return (
    <div 
      key={animationKey}
      className={`${styles.container} ${className}`}
    >
      {chars}
    </div>
  );
}

