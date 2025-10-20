'use client';

import { useState, useEffect } from 'react';
import { ProjectMeta } from '@/lib/mdx';
import { useIntersectionObserver, useProjectLoading } from '@/lib/hooks';
import { Category, filterProjectsByCategory, getCoverMedia } from './utils/projectHelpers';
import { CategoryFilter, ProjectCard } from './components';
import HoverCanvas from './HoverCanvas';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface ProjectListProps {
  projects: ProjectMeta[];
}

const FADE_DELAY = 200;
const FADE_DURATION = 200;

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

  // Custom Hooks
  const {
    visibleItems,
    setItemRef,
    observeItems,
    isItemVisible,
  } = useIntersectionObserver();

  const {
    setLoadingState,
    isProjectLoading,
    shouldLoadProject,
    initializeLoading,
  } = useProjectLoading();

  // Derived State
  const filteredProjects = filterProjectsByCategory(projects, displayCategory);
  const hoveredMedia = hoveredProject ? getCoverMedia(hoveredProject) : { url: null, isVideo: false };

  // Initial mount animation
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Category change animation effect
  useEffect(() => {
    if (selectedCategory === displayCategory) return;

    setIsVisible(false);
    setHoveredProject(null);

    const timeout = setTimeout(() => {
      setDisplayCategory(selectedCategory);
      requestAnimationFrame(() => setIsVisible(true));
    }, FADE_DELAY);

    return () => clearTimeout(timeout);
  }, [selectedCategory, displayCategory]);

  // Setup intersection observer when projects change
  useEffect(() => {
    if (!isVisible || filteredProjects.length === 0) return;

    const projectSlugs = filteredProjects.map(p => p.slug);
    observeItems(projectSlugs);
  }, [isVisible, filteredProjects, observeItems]);

  // Initialize loading for visible and first few projects
  useEffect(() => {
    if (!isVisible || filteredProjects.length === 0) return;

    const cleanup = initializeLoading(filteredProjects, visibleItems);
    return cleanup;
  }, [isVisible, filteredProjects, visibleItems, initializeLoading]);

  // Handlers
  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleProjectHover = (project: ProjectMeta | null, element: HTMLElement | null) => {
    setHoveredProject(project);
    setHoveredElement(element);
  };

  const handleMediaLoad = (projectSlug: string) => {
    setLoadingState(projectSlug, false);
  };

  const handleMediaLoadStart = (projectSlug: string) => {
    setLoadingState(projectSlug, true);
  };

  const handleMediaError = (projectSlug: string) => {
    setLoadingState(projectSlug, false);
  };

  return (
    <>
      {/* Three.js Hover Effect Canvas */}
      {/* <HoverCanvas
        hoveredElement={hoveredElement}
        mediaUrl={hoveredMedia.url}
        isVideo={hoveredMedia.isVideo}
      /> */}

      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-20">
        {/* Category Filter */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryClick}
        />

        {/* Project Grid */}
        <ul
          className="grid gap-y-10 gap-x-4 sm:gap-y-20 sm:gap-x-6 lg:gap-y-50 lg:gap-x-8 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pb-32 transition-opacity"
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
            const isLoading = isProjectLoading(project.slug) && hasCover;
            const shouldLoad = shouldLoadProject(project.slug);
            const isVisible = isItemVisible(project.slug);

            return (
              <ProjectCard
                key={project.slug}
                project={project}
                isLoading={isLoading}
                shouldLoad={shouldLoad}
                isVisible={isVisible}
                setItemRef={setItemRef}
                onLoadStart={handleMediaLoadStart}
                onLoad={handleMediaLoad}
                onError={handleMediaError}
                onMouseEnter={handleProjectHover}
                onMouseLeave={() => handleProjectHover(null, null)}
              />
            );
          })}
        </ul>
      </div>
    </>
  );
}
