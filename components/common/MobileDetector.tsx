'use client';

import { useEffect } from "react";
import GlobalState from "./GlobalStates";

/**
 * Component to initialize mobile detection
 * Sets isMobile state in the main GlobalState store based on viewport width
 */
export default function MobileDetector() {
    const { setIsMobile } = GlobalState();

    useEffect(() => {
        const checkIsMobile = () => {
            const isMobileWidth = window.innerWidth <= 768;
            setIsMobile(isMobileWidth);
        };

        checkIsMobile();

        window.addEventListener('resize', checkIsMobile);

        return () => {
            window.removeEventListener('resize', checkIsMobile);
        };
    }, [setIsMobile])

    return null;
}