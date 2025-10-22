'use client';

import { useEffect, useMemo } from 'react';
import GlobalState from '@/components/common/GlobalStates';

/**
 * Custom hook to determine the appropriate video resolution based on device type
 * @param videoUrl1080p - URL for 1080p video
 * @param videoUrl720p - URL for 720p video
 * @returns The appropriate video URL based on device type
 */
export function useResponsiveVideo(videoUrl1080p: string, videoUrl720p?: string) {
  const { isMobile } = GlobalState();

  return useMemo(() => {
    // If 720p URL is provided and we're on mobile, use it; otherwise use 1080p
    const selectedUrl = (isMobile && videoUrl720p) ? videoUrl720p : videoUrl1080p;
    return selectedUrl;
  }, [videoUrl1080p, videoUrl720p, isMobile]);
}

/**
 * Utility function to convert video URL from one resolution to another
 * @param originalUrl - Original video URL
 * @param fromResolution - Resolution to replace (e.g., '1080p')
 * @param toResolution - Target resolution (e.g., '720p')
 * @returns Updated URL with new resolution
 */
export function convertVideoResolution(
  originalUrl: string, 
  fromResolution: string, 
  toResolution: string
): string {
  return originalUrl.replace(fromResolution, toResolution);
}

/**
 * Hook specifically for project video URLs that handles the conversion automatically
 * @param videoUrl - The main video URL (assumed to be 1080p)
 * @returns Object with both 1080p and 720p URLs, plus the appropriate one for current device
 */
export function useProjectVideoUrls(videoUrl: string) {
  const isVideo = videoUrl.toLowerCase().match(/\.(mp4|webm|mov|avi|ogg)$/);
  
  const videoUrls = useMemo(() => {
    if (!isVideo) {
      return { url1080p: videoUrl, url720p: videoUrl, currentUrl: videoUrl };
    }
    
    // Try to generate 720p URL by replacing resolution identifiers
    // Handle different possible patterns: -1080p., _1080p., 1080p-
    let url720p = videoUrl;
    
    if (videoUrl.includes('-1080p')) {
      url720p = videoUrl.replace('-1080p', '-720p');
    } else if (videoUrl.includes('_1080p')) {
      url720p = videoUrl.replace('_1080p', '_720p');
    } else if (videoUrl.includes('1080p-')) {
      url720p = videoUrl.replace('1080p-', '720p-');
    } else {
      // Fallback: try generic replacement
      url720p = convertVideoResolution(videoUrl, '1080p', '720p');
    }
    
    return {
      url1080p: videoUrl,
      url720p: url720p,
      currentUrl: videoUrl // Will be updated by useResponsiveVideo
    };
  }, [videoUrl, isVideo]);

  const currentUrl = useResponsiveVideo(videoUrls.url1080p, videoUrls.url720p);
  
  return {
    ...videoUrls,
    currentUrl
  };
}
