'use client';

import React, { useEffect } from 'react';
import Scene from '@/components/scene/Scene';
import LoadingPage from '@/components/ui/LoadingPage';
import HintMessage from '@/components/ui/HintMessage';
import AudioUICanvas from '@/components/ui/audio/AudioUICanvas';
import LevaWraper from '@/lib/r3f-gist/utility/LevaWraper';
import { Leva } from 'leva';
import GlobalState from '@/components/common/GlobalStates';

/**
 * PersistentScene - Loads once and persists across all routes
 * Hides and pauses when not on homepage to save performance
 */
function PersistentSceneComponent() {
  const { setPaused, isDev, currentPath } = GlobalState();
  const isHomepage = currentPath === '/';

  useEffect(() => {
    setPaused(!isHomepage);
  }, [isHomepage, setPaused]);

  return (
    <>
      {isDev ? <LevaWraper initialHidden={true} /> : <Leva hidden={true} />}
      <div
        className="fixed inset-0 z-0 transition-opacity duration-2000"
        style={{
          opacity: isHomepage ? 1 : 0,
          visibility: isHomepage ? 'visible' : 'hidden',
        }}
      >
        <Scene />
      </div>
      <LoadingPage />
      <HintMessage />
      <AudioUICanvas radius={10} bottomOffset={5} rightOffset={5} />
    </>
  );
}

// Custom comparison (() => true) means "props are always equal"
// This prevents re-renders from parent layout updates (except from zustand)
export default React.memo(PersistentSceneComponent, () => true);

