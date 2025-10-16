'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { ProjectMeta } from '@/lib/mdx';
import useGlobalState from '@/components/common/GlobalStates';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface PersistentMediaViewerProps {
  projects: ProjectMeta[];
}

export default function PersistentMediaViewer({ projects }: PersistentMediaViewerProps) {
  const pathname = usePathname();
  const activeProjectSlug = useGlobalState((state) => state.activeProjectSlug);
  const setActiveProjectSlug = useGlobalState((state) => state.setActiveProjectSlug);

  // Auto-update from URL when on detail page
  useEffect(() => {
    if (pathname.startsWith('/projects/') && pathname !== '/projects') {
      const slug = pathname.split('/projects/')[1];
      if (slug && slug !== activeProjectSlug) {
        setActiveProjectSlug(slug);
      }
    }
  }, [pathname, activeProjectSlug, setActiveProjectSlug]);

  const currentProject = useMemo(() => {
    if (!activeProjectSlug) return null;
    return projects.find(p => p.slug === activeProjectSlug) || null;
  }, [activeProjectSlug, projects]);

  if (!currentProject) return null;

  return (
    <div className="w-full h-full pt-4 sm:pt-8 lg:pt-16 flex items-center justify-center overflow-hidden">
      <div
        className="w-full h-full overflow-y-auto space-y-3 sm:space-y-4 scrollbar-hide sm:px-0"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Videos */}
        {currentProject.videos && currentProject.videos.length > 0 && (
          currentProject.videos.map((video, index) => (
            <video
              key={`${currentProject.slug}-video-${index}`}
              src={video}
              autoPlay
              loop
              muted
              playsInline
              className="w-full rounded"
            />
          ))
        )}

        {/* Images */}
        {currentProject.images && currentProject.images.length > 0 && (
          currentProject.images.map((image, index) => (
            <OptimizedImage
              key={`${currentProject.slug}-image-${index}`}
              path={image}
              alt={`${currentProject.title} - ${index + 1}`}
              width={1600}
              height={900}
              loading={index < 2 ? 'eager' : 'lazy'}
              priority={index === 0}
              className="w-full rounded"
            />
          ))
        )}
      </div>
    </div>
  );
}

