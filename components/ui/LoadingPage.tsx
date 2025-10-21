'use client';

import { useEffect, useState, useCallback } from 'react';
import GlobalStates from '@/components/common/GlobalStates';
import { useProgress } from '@react-three/drei';
import LoadingStats, { type LoadingMetrics } from './LoadingStats';
import SplitText from './SplitText';

const WORDS = ['seen.', 'felt.', 'remembered.'];

const showStats = false// process.env.NODE_ENV === 'development';

export default function LoadingPage() {
  const { started, setStarted } = GlobalStates();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const { progress, active } = useProgress();
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Handle loading completion callback
  const handleLoadingComplete = useCallback((metrics: LoadingMetrics) => {
    setLoadingComplete(true);
  }, []);

  useEffect(() => {
    if (progress === 100 && !active) {
      setLoadingComplete(true);
    }
  }, [progress, active]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('dev') === 'true') {
      setStarted(true);
    }
  }, [setStarted]);

  useEffect(() => {
    if (loadingComplete && currentWordIndex >= WORDS.length - 1) {
      const timer = setTimeout(() => setStarted(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [loadingComplete, currentWordIndex, setStarted]);

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
              delay={currentWordIndex === 0 ? 1.0 : 0}
              duration={0.75}
              stagger={0.0}
              spin={false}
              move={false}
              onComplete={handleWordComplete}
            />
          </div>
        </div>

        {/* Loading statistics component */}
        <LoadingStats
          showVisual={showStats}
          showConsole={showStats}
          onLoadingComplete={handleLoadingComplete}
        />
      </div>
    </div>
  );
}

