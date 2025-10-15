'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProjectMeta } from '@/lib/mdx';
import useGlobalState from '@/components/common/GlobalStates';

type Category = 'all' | 'web' | 'experiential';

interface ProjectsFilterProps {
  projects: ProjectMeta[];
}

export default function ProjectsFilter({ projects }: ProjectsFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [hoveredProject, setHoveredProject] = useState<ProjectMeta | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const activeProjectSlug = useGlobalState((state) => state.activeProjectSlug);
  const setActiveProjectSlug = useGlobalState((state) => state.setActiveProjectSlug);
  const currentPath = useGlobalState((state) => state.currentPath);
  const previousPath = useGlobalState((state) => state.previousPath);

  const filteredProjects = projects.filter(project => {
    if (selectedCategory === 'all') return true;
    return project.category === selectedCategory;
  });

  const categories: { value: Category; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'web', label: 'Web' },
    { value: 'experiential', label: 'Experiential' },
  ];

  // Use two columns when more than 10 projects
  const useTwoColumns = filteredProjects.length > 10;

  // Reset active project only when NOT coming from a project detail page
  // useEffect(() => {
  //   const isComingFromProjectPage = previousPath.startsWith('/projects/');
  //   const isOnProjectsListPage = currentPath === '/projects';

  //   // Only reset if we're on projects list AND NOT coming from a project detail page
  //   if (isOnProjectsListPage && !isComingFromProjectPage) {
  //     setActiveProjectSlug(null);
  //   }
  // }, [currentPath, previousPath, setActiveProjectSlug]);

  // // Trigger animation and reset active project when category changes
  // useEffect(() => {
  //   setAnimationKey(prev => prev + 1);
  //   setActiveProjectSlug(null);
  //   setHoveredProject(null);
  // }, [selectedCategory, setActiveProjectSlug]);


  return (
    <div className="flex flex-col">
      {/* Category filter buttons */}
      <div className="flex gap-8 mb-8 flex-shrink-0">
        {categories.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSelectedCategory(value)}
            className={`py-2 text-sm rounded-lg transition-colors cursor-pointer ${selectedCategory === value
              ? 'text-white'
              : 'text-white/50 hover:text-white/80'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Project list - scrollable, auto two columns when >10 items */}
      <ul
        className={`overflow-y-auto scrollbar-hide flex-1 grid gap-y-3 w-fit ${useTwoColumns ? 'grid-cols-2 gap-x-10 auto-rows-min' : 'grid-cols-1'
          }`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          gridAutoFlow: useTwoColumns ? 'column' : 'row',
          gridTemplateRows: useTwoColumns ? `repeat(${Math.ceil(filteredProjects.length / 2)}, auto)` : 'auto',
        }}
      >
        {filteredProjects.map((p, index) => {
          const isActive = activeProjectSlug === p.slug;
          const isHovered = hoveredProject?.slug === p.slug;

          // Determine text color based on hover and active states
          let textColor = 'text-white/30'; // default

          if (hoveredProject) {
            // When hovering: active is white, others are very dark
            textColor = isHovered ? 'text-white underline' : 'text-white/50';
          } else if (activeProjectSlug) {
            // When not hovering but has active: active is white, others are dim
            textColor = isActive ? 'text-white underline' : 'text-white/50';
          }

          return (
            <li
              key={`${animationKey}-${p.slug}`}
              onMouseEnter={() => {
                setHoveredProject(p);
                setActiveProjectSlug(p.slug);
              }}
              onMouseLeave={() => setHoveredProject(null)}
              className="transition-all duration-200 animate-crop-down"
              style={{
                animationDelay: `${index * 50}ms`,
                opacity: 0,
                animationFillMode: 'forwards'
              }}
            >
              <Link
                href={`/projects/${p.slug}`}
                className={`block text-sm font-medium transition-all duration-200 text-medium ${textColor}`}
              >
                {p.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

