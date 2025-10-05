'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as THREE from 'three';

interface TrailContextType {
  nodeTexture: THREE.Texture | null;
  setNodeTexture: (texture: THREE.Texture | null) => void;
}

const TrailContext = createContext<TrailContextType | undefined>(undefined);

interface TrailProviderProps {
  children: ReactNode;
}

export function TrailProvider({ children }: TrailProviderProps) {
  const [nodeTexture, setNodeTexture] = useState<THREE.Texture | null>(null);

  return (
    <TrailContext.Provider value={{ nodeTexture, setNodeTexture }}>
      {children}
    </TrailContext.Provider>
  );
}

export function useTrailContext() {
  const context = useContext(TrailContext);
  if (context === undefined) {
    throw new Error('useTrailContext must be used within a TrailProvider');
  }
  return context;
}
