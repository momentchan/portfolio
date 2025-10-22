'use client';

import { useEffect } from "react";
import GlobalState from "./GlobalStates";

/**
 * Component to initialize mobile detection
 * Sets isMobile (viewport-based) and isTouchDevice (hardware-based) states
 */
export default function MobileDetector() {
    const { setIsMobile, setIsTouchDevice } = GlobalState();

    useEffect(() => {
        // Check if it's a real touch device (tablet/phone)
        const checkIsTouchDevice = () => {
            const hasTouchScreen = 'ontouchstart' in window ||
                navigator.maxTouchPoints > 0 ||
                (navigator as any).msMaxTouchPoints > 0;

            // Also check for mobile user agent patterns
            const userAgent = navigator.userAgent.toLowerCase();
            const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
            const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

            const isTouchDevice = hasTouchScreen && isMobileUA;
            setIsTouchDevice(isTouchDevice);
        };

        const checkIsMobile = () => {
            const isMobileWidth = window.innerWidth <= 768;
            setIsMobile(isMobileWidth);
        };

        checkIsTouchDevice(); // Only check once (device type doesn't change)
        checkIsMobile();

        window.addEventListener('resize', checkIsMobile);

        return () => {
            window.removeEventListener('resize', checkIsMobile);
        };
    }, [setIsMobile, setIsTouchDevice])

    return null;
}