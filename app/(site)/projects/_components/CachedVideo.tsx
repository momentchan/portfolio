'use client';

import { useEffect, useRef, useId } from 'react';
import { useProjectVideoUrls } from '@site/_shared/hooks/useResponsiveVideo';

interface CachedVideoProps {
    slug: string;
    src: string;
    className?: string;
    autoPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
    playsInline?: boolean;
    onLoadStart?: () => void;
    onLoadedData?: () => void;
    onCanPlay?: () => void;
    onError?: () => void;
    onPause?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
    /**
     * When multiple CachedVideo with the same slug exist on the same page, avoid competing for the same <video>.
     * Set to true to include the instance id in the cache key (reduces cross-page cache reuse).
     */
    uniquePerInstance?: boolean;
}

interface CachedVideoElement {
    element: HTMLVideoElement;
    lastUsed: number;
    wasPlaying: boolean;
    observer?: IntersectionObserver;
    currentSrc?: string;
    unbind?: () => void; // Used to clean up the fixed listeners attached on first creation
}

// ---- Global cache (by slug or slug::instance) ----
const videoCache = new Map<string, CachedVideoElement>();
const MAX_CACHE_SIZE = 8;
const CACHE_CLEANUP_INTERVAL = 3 * 60 * 1000; // 3 minutes
const CACHE_ENTRY_TTL = 8 * 60 * 1000; // 8 minutes

const cleanupCache = () => {
    const now = Date.now();
    const entries = Array.from(videoCache.entries());

    // Remove expired
    for (const [key, cached] of entries) {
        if (now - cached.lastUsed > CACHE_ENTRY_TTL) {
            try {
                cached.unbind?.();
                cached.observer?.disconnect();
                cached.element.remove();
            } finally {
                videoCache.delete(key);
            }
        }
    }

    // Trim LRU
    if (videoCache.size > MAX_CACHE_SIZE) {
        const sorted = Array.from(videoCache.entries()).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
        const toRemove = sorted.slice(0, videoCache.size - MAX_CACHE_SIZE);
        for (const [key, cached] of toRemove) {
            try {
                cached.unbind?.();
                cached.observer?.disconnect();
                cached.element.remove();
            } finally {
                videoCache.delete(key);
            }
        }
    }
};

// HMR-safe interval
declare global {
    interface Window {
        __cvCleanup?: number;
    }
}
if (typeof window !== 'undefined' && !window.__cvCleanup) {
    window.__cvCleanup = window.setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);
}

export default function CachedVideo({
    slug,
    src,
    className = 'w-full h-full object-cover',
    autoPlay = true,
    loop = true,
    muted = true,
    playsInline = true,
    onLoadStart,
    onLoadedData,
    onCanPlay,
    onError,
    onPause,
    uniquePerInstance = false,
}: CachedVideoProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { currentUrl } = useProjectVideoUrls(src);

    // Fixed listeners read the latest callbacks (avoid stale closure)
    const latestHandlersRef = useRef({ onLoadStart, onLoadedData, onCanPlay, onError, onPause });
    useEffect(() => {
        latestHandlersRef.current = { onLoadStart, onLoadedData, onCanPlay, onError, onPause };
    }, [onLoadStart, onLoadedData, onCanPlay, onError, onPause]);

    const listenersRef = useRef<{
        loadstart: () => void;
        loadeddata: () => void;
        canplay: () => void;
        error: (e: Event) => void;
        pause: (e: Event) => void;
    } | null>(null);

    if (!listenersRef.current) {
        listenersRef.current = {
            loadstart: () => latestHandlersRef.current.onLoadStart?.(),
            loadeddata: () => latestHandlersRef.current.onLoadedData?.(),
            canplay: () => latestHandlersRef.current.onCanPlay?.(),
            error: () => latestHandlersRef.current.onError?.(),
            pause: (e) => latestHandlersRef.current.onPause?.(e as unknown as React.SyntheticEvent<HTMLVideoElement>),
        };
    }

    const instanceId = useId();
    const cacheKey = uniquePerInstance ? `${slug}::${instanceId}` : slug;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let cached = videoCache.get(cacheKey);
        const isNew = !cached;

        if (!cached) {
            const video = document.createElement('video');

            // Attributes: prepare before setting src (critical for iOS)
            video.muted = muted;
            if (muted) video.setAttribute('muted', '');
            video.playsInline = playsInline;
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.autoplay = autoPlay;
            video.loop = loop;
            video.preload = 'metadata';

            video.className = className;
            video.style.pointerEvents = 'none'; // Allow clicks to pass through to parent Link

            // Bind fixed listeners (bind once only)
            const L = listenersRef.current!;
            video.addEventListener('loadstart', L.loadstart);
            video.addEventListener('loadeddata', L.loadeddata);
            video.addEventListener('canplay', L.canplay);
            video.addEventListener('error', L.error);
            video.addEventListener('pause', L.pause);

            const unbind = () => {
                video.removeEventListener('loadstart', L.loadstart);
                video.removeEventListener('loadeddata', L.loadeddata);
                video.removeEventListener('canplay', L.canplay);
                video.removeEventListener('error', L.error);
                video.removeEventListener('pause', L.pause);
            };

            cached = {
                element: video,
                lastUsed: Date.now(),
                wasPlaying: false,
                currentSrc: undefined,
                unbind,
            };
            videoCache.set(cacheKey, cached);
        } else {
            // Update className (keep other attributes as initially set)
            cached.element.className = className;
            // If parent needs different autoplay/muted/loop on different pages, sync here
            cached.element.autoplay = autoPlay;
            cached.element.loop = loop;
            cached.element.muted = muted;
            if (muted) cached.element.setAttribute('muted', '');
            else cached.element.removeAttribute('muted');
        }

        const video = cached.element;

        // Only set src and call load() when the source changes
        if (cached.currentSrc !== currentUrl) {
            // Before setting src, ensure attributes are all ready (handled above)
            video.src = currentUrl;
            cached.currentSrc = currentUrl;
            video.load();
        }

        container.appendChild(video);

        // ---- Play intent (independent of video.paused) ----
        let isPlaying = false;
        const touchLastUsed = () => {
            cached!.lastUsed = Date.now();
        };
        const markPlay = () => {
            isPlaying = true;
            touchLastUsed();
        };
        const markPause = () => {
            isPlaying = false;
            touchLastUsed();
        };
        video.addEventListener('play', markPlay);
        video.addEventListener('pause', markPause);
        video.addEventListener('timeupdate', touchLastUsed);

        // Single entry resume function: check readyState + resume once on canplay
        const tryResume = () => {
            if (!(cached!.wasPlaying || autoPlay)) return;
            if (video.readyState >= 2 && video.paused) {
                video.play().catch(() => { });
            } else {
                const once = () => {
                    video.removeEventListener('canplay', once);
                    if (video.paused) video.play().catch(() => { });
                };
                video.addEventListener('canplay', once);
            }
        };

        // On first mount: try to resume (defer to next frame to avoid early timing)
        requestAnimationFrame(() => tryResume());

        // Observe container visibility: visible → preload:auto + resume; hidden → preload:metadata + pause and record intent
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry) return;
                if (entry.isIntersecting) {
                    if (video.preload !== 'auto') video.preload = 'auto';
                    tryResume();
                    touchLastUsed();
                } else {
                    if (video.preload !== 'metadata') video.preload = 'metadata';
                    if (!video.paused) {
                        cached!.wasPlaying = isPlaying; // Preserve play intent before leaving viewport
                        video.pause();
                    }
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(container);
        cached.observer = observer;

        // Page visibility / BFCache return
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                cached!.wasPlaying = isPlaying || !video.paused;
                if (!video.paused) video.pause();
            } else {
                queueMicrotask(tryResume);
            }
        };
        const onPageHide = () => {
            cached!.wasPlaying = isPlaying || !video.paused;
            if (!video.paused) video.pause();
        };
        const onPageShow = (e: PageTransitionEvent) => {
            if ((e.persisted || document.visibilityState === 'visible')) {
                requestAnimationFrame(() => tryResume());
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('pagehide', onPageHide);
        window.addEventListener('pageshow', onPageShow);

        // Cleanup: keep cache, but detach from DOM and remove temporary listeners
        return () => {
            if (video.parentNode === container) container.removeChild(video);

            // Write back using "play intent" rather than !video.paused
            cached!.wasPlaying = isPlaying;

            if (!video.paused) video.pause();

            observer.disconnect();
            if (cached) cached.observer = undefined;

            video.removeEventListener('play', markPlay);
            video.removeEventListener('pause', markPause);
            video.removeEventListener('timeupdate', touchLastUsed);

            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('pagehide', onPageHide);
            window.removeEventListener('pageshow', onPageShow);
        };
    }, [cacheKey, currentUrl, className, autoPlay, loop, muted, playsInline, uniquePerInstance]);

    return <div ref={containerRef} className="w-full h-full" />;
}