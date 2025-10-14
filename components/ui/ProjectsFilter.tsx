'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProjectMeta } from '@/lib/mdx';
import useGlobalState from '@/components/common/GlobalStates';

type Category = 'all' | 'web' | 'spatial';

interface ProjectsFilterProps {
  projects: ProjectMeta[];
}

export default function ProjectsFilter({ projects }: ProjectsFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [hoveredProject, setHoveredProject] = useState<ProjectMeta | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const activeProjectSlug = useGlobalState((state) => state.activeProjectSlug);
  const setActiveProjectSlug = useGlobalState((state) => state.setActiveProjectSlug);

  const filteredProjects = projects.filter(project => {
    if (selectedCategory === 'all') return true;
    return project.category === selectedCategory;
  });

  const categories: { value: Category; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'web', label: 'Web' },
    { value: 'spatial', label: 'Spatial' },
  ];

  // Reset active project on mount (page change)
  useEffect(() => {
    setActiveProjectSlug(null);
  }, [setActiveProjectSlug]);

  // Trigger animation and reset active project when category changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
    setActiveProjectSlug(null);
    setHoveredProject(null);
  }, [selectedCategory, setActiveProjectSlug]);


  return (
    <div>
      {/* Category filter buttons */}
      <div className="flex gap-8 mb-8">
        {categories.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSelectedCategory(value)}
            className={`py-2 text-sm rounded-lg transition-colors cursor-pointer ${
              selectedCategory === value
                ? 'text-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Project list */}
      <ul className="space-y-4">
        {filteredProjects.map((p, index) => {
          const isActive = activeProjectSlug === p.slug;
          const isHovered = hoveredProject?.slug === p.slug;
          
          // Determine text color based on hover and active states
          let textColor = 'text-white/30'; // default
          
          if (hoveredProject) {
            // When hovering: active is white, others are very dark
            textColor = isHovered ? 'text-white underline' : 'text-white/10';
          } else if (activeProjectSlug) {
            // When not hovering but has active: active is white, others are dim
            textColor = isActive ? 'text-white underline' : 'text-white';
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
                animationDelay: `${index * 100}ms`,
                opacity: 0,
                animationFillMode: 'forwards'
              }}
            >
              <Link 
                href={`/projects/${p.slug}`}
                className={`block text-2xl font-medium transition-all duration-200 text-medium ${textColor}`}
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

