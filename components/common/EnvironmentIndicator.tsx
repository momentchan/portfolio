'use client';

import React from 'react';
import GlobalState from './GlobalStates';
import { getEnvironmentDisplay } from '../../utils/environment';

interface EnvironmentIndicatorProps {
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export default function EnvironmentIndicator({ 
  show = true, 
  position = 'top-right',
  className = ''
}: EnvironmentIndicatorProps) {
  const { environment, isDev, isProd } = GlobalState();

  // Only show in development unless explicitly requested
  if (!show || isProd) {
    return null;
  }

  const positionStyles = {
    'top-left': { top: '10px', left: '10px' },
    'top-right': { top: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' },
  };

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        ...positionStyles[position],
        padding: '8px 12px',
        backgroundColor: isDev ? '#000000' : '#1a1a1a',
        color: isDev ? '#00ff00' : '#ffffff',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        borderRadius: '4px',
        border: isDev ? '1px solid #00ff00' : '1px solid #333',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
        userSelect: 'none',
        ...(isDev && {
          animation: 'pulse 2s infinite',
        }),
      }}
    >
      {getEnvironmentDisplay()}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
