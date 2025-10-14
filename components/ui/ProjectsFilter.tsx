'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProjectMeta } from '@/lib/mdx';

type Category = 'all' | 'web' | 'spatial';

interface ProjectsFilterProps {
  projects: ProjectMeta[];
}

export default function ProjectsFilter({ projects }: ProjectsFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [activeProject, setActiveProject] = useState<ProjectMeta | null>(null);
  const [hoveredProject, setHoveredProject] = useState<ProjectMeta | null>(null);

  const filteredProjects = projects.filter(project => {
    if (selectedCategory === 'all') return true;
    return project.category === selectedCategory;
  });

  const categories: { value: Category; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'web', label: 'Web' },
    { value: 'spatial', label: 'Spatial' },
  ];

  return (
    <div>
      {/* Category filter buttons */}
      <div className="flex gap-4 mb-8">
        {categories.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSelectedCategory(value)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === value
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Split screen layout */}
      <div className="flex gap-8 h-[70vh]">
        {/* Left half - Project list */}
        <div className="w-1/2 border-r border-white/10 pr-8">
          <ul className="space-y-6">
            {filteredProjects.length > 0 ? (
              filteredProjects.map(p => {
                const isActive = activeProject?.slug === p.slug;
                const isHovered = hoveredProject?.slug === p.slug;
                
                // Determine text color based on hover and active states
                let textColor = 'text-white/30'; // default
                
                if (hoveredProject) {
                  // When hovering: active is white, others are very dark
                  textColor = isHovered ? 'text-white underline' : 'text-white/10';
                } else if (activeProject) {
                  // When not hovering but has active: active is white, others are dim
                  textColor = isActive ? 'text-white underline' : 'text-white/30';
                }
                
                return (
                  <li 
                    key={p.slug}
                    onMouseEnter={() => {
                      setHoveredProject(p);
                      setActiveProject(p);
                    }}
                    onMouseLeave={() => setHoveredProject(null)}
                    className="transition-all duration-200"
                  >
                    <Link 
                      href={`/projects/${p.slug}`}
                      className={`block text-2xl font-medium transition-all duration-200 ${textColor}`}
                    >
                      {p.title}
                    </Link>
                  </li>
                );
              })
            ) : (
              <li className="text-white/50">No projects found in this category.</li>
            )}
          </ul>
        </div>

        {/* Right half - Media preview */}
        <div className="w-1/2 flex items-center justify-center overflow-hidden">
          {(() => {
            const displayProject = hoveredProject || activeProject;
            if (!displayProject) return null;
            
            return (
              <div className="w-full h-full overflow-y-auto p-8 space-y-4 scrollbar-hide" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}>
                {/* Videos */}
                {displayProject.videos && displayProject.videos.length > 0 && (
                  displayProject.videos.map((video, index) => (
                    <video
                      key={`${displayProject.slug}-video-${index}`}
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
                {displayProject.images && displayProject.images.length > 0 && (
                  displayProject.images.map((image, index) => (
                    <img
                      key={`${displayProject.slug}-image-${index}`}
                      src={image}
                      alt={`${displayProject.title} - ${index + 1}`}
                      className="w-full rounded"
                    />
                  ))
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

