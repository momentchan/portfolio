'use client';

import { useEffect } from "react";
import GlobalState from "../state/GlobalStates";

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
            const isLargeWidth = window.innerWidth >= 1024; // lg breakpoint
            setIsMobile(isMobileWidth);

            // Apply global CSS classes to body
            const body = document.body;
            if (isLargeWidth) {
                body.classList.remove('is-sp');
                body.classList.add('is-pc');
            } else {
                body.classList.remove('is-pc');
                body.classList.add('is-sp');
            }
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