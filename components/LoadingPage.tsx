'use client';

import { useEffect, useState, useCallback } from 'react';
import { useProgress } from '@react-three/drei';
import GlobalStates from './r3f/GlobalStates';
import SplitText from './SplitText';

const WORDS = ['seen.', 'felt.', 'remembered.'];

export default function LoadingPage() {
  const { started, setStarted } = GlobalStates();
  const { progress, active } = useProgress();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Auto-start when loading complete and last word shown
  useEffect(() => {
    if (progress === 100 && !active && currentWordIndex >= WORDS.length - 1) {
      const timer = setTimeout(() => setStarted(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [progress, active, currentWordIndex, setStarted]);

  // Handle word animation completion
  const handleWordComplete = useCallback(() => {
    if (currentWordIndex < WORDS.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  }, [currentWordIndex]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white transition-opacity duration-1000"
      style={{
        opacity: started ? 0 : 1,
        pointerEvents: started ? 'none' : 'auto',
      }}
    >
      <div className="max-w-2xl text-center">
        {/* Single word container - each word replaces the previous */}
        <div 
          className="text-3xl md:text-5xl font-light tracking-wide"
          style={{ 
            minHeight: '1.2em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="overflow-hidden">
            <SplitText
              text={WORDS[currentWordIndex]}
              delay={0}
              duration={1}
              stagger={0.05}
              // spin={false}
              // move={false}
              onComplete={handleWordComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
