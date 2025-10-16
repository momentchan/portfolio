'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProjectMeta } from '@/lib/mdx';
import useGlobalState from '@/components/common/GlobalStates';
import OptimizedImage from '@/components/ui/OptimizedImage';

type Category = 'all' | 'web' | 'experiential';

interface ProjectsFilterProps {
  projects: ProjectMeta[];
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'web', label: 'Web' },
  { value: 'experiential', label: 'Experiential' },
];

const FADE_DELAY = 50;
const FADE_DURATION = 500;

export default function ProjectsFilter({ projects }: ProjectsFilterProps) {
  // State
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [displayCategory, setDisplayCategory] = useState<Category>('all');
  const [hoveredProject, setHoveredProject] = useState<ProjectMeta | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Global state
  const activeProjectSlug = useGlobalState((state) => state.activeProjectSlug);
  const setActiveProjectSlug = useGlobalState((state) => state.setActiveProjectSlug);

  // Filter projects based on display category
  const filteredProjects = projects.filter(project =>
    displayCategory === 'all' || project.category === displayCategory
  );

  // Handle category change with fade animation
  useEffect(() => {
    if (selectedCategory === displayCategory) return;

    setIsVisible(false);
    setActiveProjectSlug(null);
    setHoveredProject(null);

    const timeout = setTimeout(() => {
      setDisplayCategory(selectedCategory);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, FADE_DELAY);

    return () => clearTimeout(timeout);
  }, [selectedCategory, displayCategory, setActiveProjectSlug]);


  // Handlers
  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleProjectHover = (project: ProjectMeta | null) => {
    setHoveredProject(project);
    if (project) {
      setActiveProjectSlug(project.slug);
    }
  };

  // Helper to determine project text color on desktop
  const getProjectTextColor = (projectSlug: string) => {
    const isHovered = hoveredProject?.slug === projectSlug;
    const isActive = activeProjectSlug === projectSlug;

    if (hoveredProject) {
      return isHovered ? 'lg:text-white lg:underline' : 'lg:text-white/50';
    }
    if (activeProjectSlug) {
      return isActive ? 'lg:text-white lg:underline' : 'lg:text-white/50';
    }
    return 'lg:text-white/30';
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 h-screen">
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
        className="overflow-y-auto scrollbar-hide flex-1 grid gap-y-6 gap-x-4 sm:gap-y-8 sm:gap-x-6 lg:gap-y-16 lg:gap-x-8 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-h-0 pb-32 transition-opacity"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          opacity: isVisible ? 1 : 0,
          transitionDuration: `${FADE_DURATION}ms`,
        }}
      >
        {filteredProjects.map((project) => (
          <li
            key={project.slug}
            onMouseEnter={() => handleProjectHover(project)}
            onMouseLeave={() => handleProjectHover(null)}
          >
            <Link
              href={`/projects/${project.slug}`}
              className={`flex flex-col gap-2 text-xs sm:text-sm text-white transition-colors ${getProjectTextColor(project.slug)}`}
            >
              {project.images?.[0] && (
                <div className="relative w-full aspect-video lg:aspect-square overflow-hidden rounded">
                  <OptimizedImage
                    path={project.images[0]}
                    alt={project.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    preset="medium"
                  />
                </div>
              )}
              <span>{project.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

