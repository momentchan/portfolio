'use client';

import { useProjectVideoUrls } from '@/lib/hooks/useResponsiveVideo';

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

    return (
        <video
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
