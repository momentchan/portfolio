'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import GlobalStates from '@site/_shared/state/GlobalStates';

export default function HintMessage() {
    const { started, isMobile, currentPath } = GlobalStates();
    const containerRef = useRef<HTMLDivElement>(null);
    const [hintShown, setHintShown] = useState(false);
    const prevPathRef = useRef(currentPath);
    const isHomepage = currentPath === '/';

    const hintText = isMobile
        ? "Touch or swipe — let it bloom"
        : "Click or drag — let it bloom";

    // Reset hint when navigating TO homepage (not just being on homepage)
    useEffect(() => {
        const prevPath = prevPathRef.current;
        const navigatedToHomepage = !prevPath || (prevPath !== '/' && currentPath === '/');

        if (navigatedToHomepage && started) {
            setHintShown(false);
            if (containerRef.current) {
                gsap.set(containerRef.current, {
                    opacity: 0,
                    display: 'flex'
                });
            }
        }

        prevPathRef.current = currentPath;
    }, [currentPath, started]);

    useEffect(() => {
        if (!containerRef.current || hintShown || !isHomepage) return;

        if (started) {
            // Create GSAP timeline
            const tl = gsap.timeline({
                delay: 2, // Wait 1 second after scene starts
            });

            // Show the hint with fade in
            tl.fromTo(containerRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 2, ease: "power2.out" }
            )
                // Keep visible for 3 seconds
                .to({}, { duration: 3 })
                // Fade out
                .to(containerRef.current,
                    {
                        opacity: 0,
                        duration: 2,
                        ease: "power2.out",
                        onComplete: () => {
                            // Hide the element after fade out and mark as shown
                            if (containerRef.current) {
                                containerRef.current.style.display = 'none';
                            }
                            setHintShown(true);
                        }
                    }
                );

            return () => {
                tl.kill();
            };
        } else {
            // Reset when scene is not started
            if (containerRef.current) {
                gsap.set(containerRef.current, {
                    opacity: 0,
                    display: 'none'
                });
            }
        }
    }, [started, hintShown, isHomepage]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
            style={{ opacity: 0, display: started ? 'flex' : 'none' }}
        >
            <div className="text-white text-center px-8">
                <p className="text-sm md:text-xl font-light tracking-wide">
                    {hintText}
                </p>
            </div>
        </div>
    );
}
