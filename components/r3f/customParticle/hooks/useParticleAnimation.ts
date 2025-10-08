import { useState, useEffect } from 'react';
import gsap from 'gsap';

/**
 * Shared hook for particle fade-in animation
 */
export function useParticleAnimation(options: {
    duration?: number;
    delay?: number;
    ease?: string;
} = {}) {
    const {
        duration = 3,
        delay = 1,
        ease = 'power2.inOut'
    } = options;

    const [animate, setAnimate] = useState({ opacity: 0 });

    useEffect(() => {
        gsap.to(animate, {
            opacity: 1,
            duration,
            delay,
            ease,
            onUpdate: () => {
                setAnimate({ ...animate });
            }
        });
    }, []);

    return animate;
}

