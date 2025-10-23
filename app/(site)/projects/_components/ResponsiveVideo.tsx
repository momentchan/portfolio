'use client';

import { useRef, useEffect } from 'react';
import { useProjectVideoUrls } from '@site/_shared/hooks/useResponsiveVideo';

interface ResponsiveVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    src: string;
    className?: string;
    autoPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
    playsInline?: boolean;
}

/**
 * Responsive video component that automatically selects the appropriate resolution
 * based on device type. Uses 720p for mobile devices and 1080p for desktop.
 */
export default function ResponsiveVideo({
    src,
    className = "w-full max-w-full rounded",
    autoPlay = true,
    loop = true,
    muted = true,
    playsInline = true,
    ...props
}: ResponsiveVideoProps) {
    const { currentUrl } = useProjectVideoUrls(src);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Ensure video plays when URL changes or component mounts
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !autoPlay) return;

        // Small delay to ensure video is loaded
        const playVideo = async () => {
            try {
                // Reset video to start
                video.load();

                // Try to play
                await video.play();
            } catch (error) {
                // Autoplay failed - this is normal for some browsers
                // The video will play on user interaction
                console.log('Video autoplay prevented:', error);
            }
        };

        playVideo();
    }, [currentUrl, autoPlay]);

    return (
        <video
            ref={videoRef}
            key={currentUrl} // Force remount when URL changes
            src={currentUrl}
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            playsInline={playsInline}
            className={className}
            {...props}
        />
    );
}
