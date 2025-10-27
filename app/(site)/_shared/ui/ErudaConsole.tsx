'use client';

import { useEffect } from 'react';
import GlobalState from '../state/GlobalStates';

export default function ErudaConsole() {
    const { isDev, isMobile } = GlobalState();

    useEffect(() => {
        // Only load Eruda on mobile devices or in development mode
        if (isDev && isMobile) {
            import('eruda').then((eruda) => {
                eruda.default.init();
            }).catch((error) => {
                console.error('Failed to load Eruda:', error);
            });
        }
    }, [isDev, isMobile]);

    return null;
}
