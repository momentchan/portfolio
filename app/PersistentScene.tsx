'use client';

import React from 'react';
import Scene from '@/components/scene/Scene';
import LoadingPage from '@/components/ui/LoadingPage';
import AudioUICanvas from '@/components/ui/audio/AudioUICanvas';

/**
 * PersistentScene - Loads once and persists across all routes
 * 
 * React.memo with custom comparison (() => true) ensures this component
 * never re-renders during navigation, keeping the scene mounted permanently.
 */
function PersistentSceneComponent() {
  return (
    <>
      <div className="fixed inset-0 z-0">
        <Scene />
      </div>
      <LoadingPage />
      <AudioUICanvas radius={10} bottomOffset={5} rightOffset={5} />
    </>
  );
}

// Custom comparison (() => true) means "props are always equal"
// This prevents re-renders from parent layout updates
export default React.memo(PersistentSceneComponent, () => true);

