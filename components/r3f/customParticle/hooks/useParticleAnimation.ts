import { useState, useEffect } from 'react';
import gsap from 'gsap';
import GlobalState from '../../GlobalStates';

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
        ease = 'power2.inOut',
    } = options;

    const [animate, setAnimate] = useState({ opacity: 0 });
    const { started } = GlobalState();

    useEffect(() => {
        if (!started) return;

        gsap.to(animate, {
            opacity: 1,
            duration,
            delay,
            ease,
            onUpdate: () => {
                setAnimate({ ...animate });
            }
        });
    }, [started]);

    return animate;
}

