'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProjectMeta } from '@/lib/mdx';
import useGlobalState from '@/components/common/GlobalStates';
import OptimizedImage from '@/components/ui/OptimizedImage';
import HoverCanvas from './HoverCanvas';
import { isCloudflareImage } from '@/utils/cf';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type Category = 'all' | 'web' | 'experiential';

interface ProjectListProps {
  projects: ProjectMeta[];
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'web', label: 'Web' },
  { value: 'experiential', label: 'Experiential' },
];

const FADE_DELAY = 200;
const FADE_DURATION = 200;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.ogg'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
}

function getFullMediaUrl(mediaPath: string | undefined): string | null {
  if (!mediaPath) return null;

  // Cloudflare media - use as-is (already full URL)
  if (isCloudflareImage(mediaPath)) {
    return mediaPath;
  }

  // Local media - use relative path (Next.js handles it correctly)
  return mediaPath;
}

function getCoverMedia(project: ProjectMeta): { url: string | null; isVideo: boolean } {
  const url = getFullMediaUrl(project.cover);
  return { url, isVideo: isVideoUrl(project.cover) };
}

function getProjectTextColor(
  projectSlug: string,
  activeSlug: string | null,
  hoveredSlug: string | null
): string {
  const isHovered = hoveredSlug === projectSlug;
  const isActive = activeSlug === projectSlug;

  if (hoveredSlug) {
    return isHovered ? 'lg:text-white' : 'lg:text-white/50';
  }
  if (activeSlug) {
    return isActive ? 'lg:text-white' : 'lg:text-white/50';
  }
  return 'lg:text-white/30';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProjectList({ projects }: ProjectListProps) {
  // Local State
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [displayCategory, setDisplayCategory] = useState<Category>('all');
  const [hoveredProject, setHoveredProject] = useState<ProjectMeta | null>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Global State
  const activeProjectSlug = useGlobalState((state) => state.activeProjectSlug);
  const setActiveProjectSlug = useGlobalState((state) => state.setActiveProjectSlug);

  // Derived State
  const filteredProjects = projects.filter(
    (project) => displayCategory === 'all' || project.category === displayCategory
  );
  const hoveredMedia = hoveredProject ? getCoverMedia(hoveredProject) : { url: null, isVideo: false };

  // Initial mount animation
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Category change animation effect
  useEffect(() => {
    if (selectedCategory === displayCategory) return;

    setIsVisible(false);
    setActiveProjectSlug(null);
    setHoveredProject(null);

    const timeout = setTimeout(() => {
      setDisplayCategory(selectedCategory);
      requestAnimationFrame(() => setIsVisible(true));
    }, FADE_DELAY);

    return () => clearTimeout(timeout);
  }, [selectedCategory, displayCategory, setActiveProjectSlug]);

  // Handlers
  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleProjectHover = (project: ProjectMeta | null, element: HTMLElement | null) => {
    setHoveredProject(project);
    setHoveredElement(element);
    if (project) {
      setActiveProjectSlug(project.slug);
    }
  };

  return (
    <>
      {/* Three.js Hover Effect Canvas */}
      {/* <HoverCanvas
        hoveredElement={hoveredElement}
        mediaUrl={hoveredMedia.url}
        isVideo={hoveredMedia.isVideo}
      /> */}

      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 h-screen pb-20">
        {/* Category Filter */}
        <nav className="flex gap-4 sm:gap-6 lg:gap-8 flex-shrink-0 flex-wrap lg:flex-nowrap">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleCategoryClick(value)}
              className={`py-2 text-xs sm:text-sm cursor-pointer transition-colors ${selectedCategory === value
                ? 'text-white'
                : 'text-white/50 hover:text-white/80'
                }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Project Grid */}
        <ul
          className="overflow-y-auto scrollbar-hide flex-1 grid gap-y-10 gap-x-4 sm:gap-y-20 sm:gap-x-6 lg:gap-y-50 lg:gap-x-8 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-h-0 pb-32 transition-opacity"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            opacity: isVisible ? 1 : 0,
            transitionDuration: `${FADE_DURATION}ms`,
          }}
        >
          {filteredProjects.map((project) => {
            const cover = getCoverMedia(project);
            const hasCover = cover.url !== null;

            return (
              <li key={project.slug}>
                <Link
                  href={`/projects/${project.slug}`}
                  className={`flex flex-col gap-2 text-xs sm:text-sm text-white transition-colors ${getProjectTextColor(
                    project.slug,
                    activeProjectSlug,
                    hoveredProject?.slug || null
                  )}`}
                >
                  {hasCover && (
                    <div
                      className="relative w-full aspect-video lg:aspect-square overflow-hidden rounded"
                      onMouseEnter={(e) => handleProjectHover(project, e.currentTarget)}
                      onMouseLeave={() => handleProjectHover(null, null)}
                    >
                      {cover.isVideo ? (
                        <video
                          key={cover.url}
                          src={cover.url!}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                          onPause={(e) => {
                            // Prevent pause, keep playing
                            const video = e.currentTarget;
                            if (video.paused) {
                              video.play().catch(() => { });
                            }
                          }}
                        />
                      ) : (
                        <OptimizedImage
                          path={cover.url!}
                          alt={project.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          preset="medium"
                        />
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <span>{project.title}</span>

                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-block px-1.5 py-0.5 rounded bg-white/5 text-white/50 text-[9px] sm:text-[10px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
