'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';
import { Suspense } from 'react';
import MouseTraceFBO from '../../lib/r3f-gist/utility/MouseTrace';
import { FBOTextureManager } from '../../lib/hooks/useFBOTextureManager';
import RectangleSpawner from './RectangleSpawner';
import GlobalState from '../common/GlobalStates';

interface InteractiveEffectsProps {
    onTextureUpdate: (newTextures: Array<THREE.Texture | null>) => void;
}

/**
 * InteractiveEffects groups all mouse-interactive elements that should only render on desktop
 * Includes mouse trace effects and rectangle spawning
 */
export default function InteractiveEffects({ onTextureUpdate }: InteractiveEffectsProps) {
    const { isMobile } = GlobalState();
    const traceRef = useRef<{
        getFBOTexture: () => THREE.Texture | null;
        clearTraces?: () => void
    } | null>(null);

    // Early return for mobile devices
    if (isMobile) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <MouseTraceFBO ref={traceRef} showDebug={false} downsample={8} />
            <FBOTextureManager
                refs={[traceRef]}
                onTextureUpdate={onTextureUpdate}
            />
            <RectangleSpawner />
        </Suspense>
    );
}
