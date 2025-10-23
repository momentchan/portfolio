'use client';

import React, { useEffect } from 'react';
import Scene from '@home/Scene';
import LoadingPage from '@home/_landing/LoadingPage';
import AudioUICanvas from './ui/audio/AudioUICanvas';
import LevaWraper from '@lib/r3f-gist/utility/LevaWraper';
import { Leva } from 'leva';
import GlobalState from './state/GlobalStates';

function PersistentSceneComponent() {
  const { setPaused, isDev, currentPath, initialPath } = GlobalState();
  const isHomepage = currentPath === '/';

  useEffect(() => {
    if (initialPath !== '/' && !isHomepage) {
      setPaused(true);
    } else {
      setPaused(!isHomepage);
    }
  }, [isHomepage, setPaused, initialPath]);


  return (
    <>
      {isDev ? <LevaWraper initialHidden={true} /> : <Leva hidden={true} />}
      <div
        className="fixed inset-0 z-0 transition-opacity duration-2000 select-none"
        style={{
          opacity: isHomepage ? 1 : 0,
          visibility: isHomepage ? 'visible' : 'hidden',
        }}
      >
        <Scene />
      </div>
      <LoadingPage />
      <AudioUICanvas radius={10} bottomOffset={5} rightOffset={5} />
    </>
  );
}

// Custom comparison (() => true) means "props are always equal"
// This prevents re-renders from parent layout updates (except from zustand)
export default React.memo(PersistentSceneComponent, () => true);

