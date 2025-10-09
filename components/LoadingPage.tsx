'use client';

import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import GlobalStates from './r3f/GlobalStates';
import SplitText from './SplitText';

export default function LoadingPage() {
  const { started, setStarted } = GlobalStates();
  const { progress, active } = useProgress();
  const [showWord2, setShowWord2] = useState(false);
  const [showWord3, setShowWord3] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (progress === 100 && !active && complete) {
      const timer = setTimeout(() => {
        setStarted(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, active, complete]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white transition-opacity duration-1000"
      style={{
        opacity: started ? 0 : 1,
        pointerEvents: started ? 'none' : 'auto',
      }}
    >
      <div className="max-w-2xl text-center space-y-12">
        <div className="space-y-4 text-5xl md:text-7xl font-light tracking-wide">
          <div className="overflow-hidden h-[1.2em]">
            <SplitText
              text="seen."
              delay={1}
              duration={1}
              stagger={0.05}
              spin={false}
              move={false}
              onComplete={() => setShowWord2(true)}
            />
          </div>

          <div className="overflow-hidden h-[1.2em]" style={{ visibility: showWord2 ? 'visible' : 'hidden' }}>
            {showWord2 && (
              <SplitText
                text="felt."
                delay={0}
                duration={1}
                stagger={0.05}
                spin={false}
                onComplete={() => setShowWord3(true)}
              />
            )}
          </div>

          <div className="overflow-hidden h-[1.2em]" style={{ visibility: showWord3 ? 'visible' : 'hidden' }}>
            {showWord3 && (
              <SplitText
                text="remembered."
                delay={0}
                duration={1}
                stagger={0.05}
                onComplete={() => setComplete(true)}
              />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

